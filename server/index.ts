import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import XLSX from 'xlsx';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 5005;

// Adjust BASE_PATH depending on if we are running from /server/index.ts (dev) or /dist/server/index.js (prod)
const isProd = __dirname.endsWith('dist/server') || __dirname.endsWith('dist\\server');
const BASE_PATH = isProd ? path.join(__dirname, '../..') : path.join(__dirname, '..');
const ASSETS_PATH = path.join(BASE_PATH, 'assets');
const THEMES_PATH = path.join(BASE_PATH, 'themes');

app.use(cors());
app.use(express.json());

let cachedAdvisors: string[] = [];
let lastDirectoryMtime = 0;

const getCachedAdvisors = () => {
    const filePath = path.join(BASE_PATH, 'administrador', 'directorio_asesores.xlsx');
    if (!fs.existsSync(filePath)) return cachedAdvisors;

    const mtime = fs.statSync(filePath).mtimeMs;
    if (mtime === lastDirectoryMtime && cachedAdvisors.length > 0) {
        return cachedAdvisors;
    }

    const directory = getAdvisorDirectory();
    cachedAdvisors = Object.values(directory).sort();
    lastDirectoryMtime = mtime;
    return cachedAdvisors;
};

// Explicitly set correct MIME types (Hostinger fix)
const mimeTypes: Record<string, string> = {
    '.js': 'application/javascript',
    '.mjs': 'application/javascript',
    '.css': 'text/css',
    '.html': 'text/html',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
};

const setMimeHeaders = (res: any, filePath: string) => {
    const ext = path.extname(filePath).toLowerCase();
    if (mimeTypes[ext]) {
        res.setHeader('Content-Type', mimeTypes[ext]);
    }
};

// Serve static assets
app.use('/assets', express.static(ASSETS_PATH, { setHeaders: setMimeHeaders }));

// Serve Frontend Build
const DIST_PATH = path.join(BASE_PATH, 'dist');
app.use(express.static(DIST_PATH, { setHeaders: setMimeHeaders }));

// Helper to get advisor directory
const getAdvisorDirectory = () => {
    const filePath = path.join(BASE_PATH, 'administrador', 'directorio_asesores.xlsx');
    if (!fs.existsSync(filePath)) return {};

    try {
        const workbook = XLSX.readFile(filePath);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data: any[] = XLSX.utils.sheet_to_json(worksheet);
        const directory: Record<string, string> = {};
        data.forEach(row => {
            // Robust column matching
            const keys = Object.keys(row);
            const claveKey = keys.find(k => k.toLowerCase().trim() === 'clave');
            const nombreKey = keys.find(k => k.toLowerCase().trim() === 'nombre_completo' || k.toLowerCase().trim() === 'nombre completo');

            if (claveKey && nombreKey && row[claveKey] && row[nombreKey]) {
                directory[String(row[claveKey])] = String(row[nombreKey]).trim();
            }
        });
        return directory;
    } catch (e) {
        console.error('Error reading director:', e);
        return {};
    }
};

// Simple in-memory cache for Excel data to prevent heavy re-reads
const excelCache: Record<string, { mtime: number, workbook: any, json?: any }> = {};

// Helper to read Excel with caching
const readExcelData = (folderName: string, options: { skipJson?: boolean } = {}) => {
    const folderPath = path.join(BASE_PATH, folderName);
    if (!fs.existsSync(folderPath) || !fs.lstatSync(folderPath).isDirectory()) return null;

    try {
        const files = fs.readdirSync(folderPath).filter(f => (f.endsWith('.xlsx') || f.endsWith('.xlsm')) && !f.startsWith('~$'));
        if (files.length === 0) return null;

        const filePath = path.join(folderPath, files[0]);
        const stats = fs.statSync(filePath);
        const mtime = stats.mtimeMs;

        // Return from cache if file hasn't changed
        if (excelCache[folderName] && excelCache[folderName].mtime === mtime) {
            if (options.skipJson) return excelCache[folderName].workbook;
            if (excelCache[folderName].json) return excelCache[folderName].json;
            // If we have workbook but need JSON
            const workbook = excelCache[folderName].workbook;
            const sheetName = workbook.SheetNames[0];
            const json = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
            excelCache[folderName].json = json;
            return json;
        }

        console.log(`[DEBUG] Cache miss for ${folderName}. Reading file: ${filePath}`);
        const workbook = XLSX.readFile(filePath, { cellFormula: false, cellStyles: false, cellNF: false });

        excelCache[folderName] = { mtime, workbook };

        if (options.skipJson) return workbook;

        const sheetName = workbook.SheetNames[0];
        const json = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        excelCache[folderName].json = json;
        return json;
    } catch (error) {
        console.error(`Error reading folder/file ${folderName}:`, error);
        return null;
    }
};

// Helper to get cutoff date from cell B9 (Legion Centurion raw format)
const getLegionDate = (worksheet: any) => {
    const cellValue = worksheet?.['B9']?.v || "";
    // Regex to match e.g. "18 de febrero de 2026"
    const match = String(cellValue).match(/\d{1,2}\s+de\s+\w+\s+de\s+\d{4}/i);
    return match ? match[0] : null;
};

// Helper to get cutoff date from cell A1 (New MDRT format: "del 1 de enero al 25 de febrero...")
const getMdrtDate = (worksheet: any) => {
    const cellValue = worksheet?.['A1']?.v || "";
    // Find all dates and take the last one
    const matches = String(cellValue).match(/\d{1,2}\s+de\s+\w+\s+de\s+\d{4}/gi);
    return matches ? matches[matches.length - 1]! : null;
};

// Helper to get cutoff date from cell A1 or B19 (Camino raw format)
const getCaminoDate = (worksheet: any) => {
    // Try A1 first (light files), then B19 (heavy files)
    const cellValue = worksheet?.['A1']?.v || worksheet?.['B19']?.v || "";
    const matches = String(cellValue).match(/\d{1,2}\s+de\s+\w+\s+de\s+\d{4}/gi);
    return matches ? matches[matches.length - 1]! : null;
};

// Endpoints
app.get('/api/campaigns', (req, res) => {
    const exclude = ['assets', 'themes', 'server', 'node_modules', 'src', 'public', '.git', 'dist', '.conda', 'administrador', 'tmp', '.cache', '.npm', 'estatus polizas', 'estatus_polizas'];
    try {
        const folders = fs.readdirSync(BASE_PATH, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory() && !exclude.includes(dirent.name) && !dirent.name.startsWith('.'))
            .map(dirent => dirent.name);
        res.json(folders.sort());
    } catch (error) {
        res.status(500).json({ error: 'Could not list campaigns' });
    }
});

app.get('/api/advisors', (req, res) => {
    try {
        const advisors = getCachedAdvisors();
        if (advisors.length > 0) {
            return res.json(advisors);
        }

        // Emergency fallback if directory is missing
        const lightFolders = ['camino_cumbre', 'convenciones', 'graduacion'];
        const fallbackSet = new Set<string>();
        lightFolders.forEach(f => {
            const data = readExcelData(f);
            if (data) data.forEach((r: any) => { if (r.Asesor) fallbackSet.add(r.Asesor) });
        });
        res.json(Array.from(fallbackSet).sort());
    } catch (error) {
        res.status(500).json({ error: 'Could not list advisors' });
    }
});

app.get('/api/campaign/:name/data/:advisor', (req, res) => {
    const { name, advisor } = req.params;

    // Process special raw format for Legion Centurion
    if (name === 'legion_centurion') {
        const folderPath = path.join(BASE_PATH, name);
        if (!fs.existsSync(folderPath)) return res.status(404).json({ error: 'Folder not found' });

        const workbook = readExcelData(name, { skipJson: true });
        if (!workbook) return res.status(404).json({ error: 'Raw file not found' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const b9 = sheet['B9']?.v || "";

        const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
        const monthMatch = String(b9).toLowerCase().match(/(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/);
        const monthIndex = monthMatch ? months.indexOf(monthMatch[1]) + 1 : 1;

        // Limit range to first 10,000 rows to avoid processing 1M+ empty rows
        const json: any[] = XLSX.utils.sheet_to_json(sheet, { range: 'A11:Z10000' });

        // Directory for name resolution
        const directory = getAdvisorDirectory();
        const advisorKeys = Object.keys(directory).filter(key => directory[key] === advisor);

        const row = json.find(r => {
            if (String(r['Matriz'] || '') !== '2043') return false;
            const clave = String(r['Asesor'] || '');
            return clave === advisor || advisorKeys.includes(clave);
        });

        if (!row) return res.status(404).json({ error: 'Advisor not found' });

        const totalPol = Number(row['Total Pólizas'] || 0);
        const cumpled = String(row['Cumple Meta Proporc.'] || '').toLowerCase();
        const clave = String(row['Asesor'] || '');

        return res.json({
            'Asesor': directory[clave] || clave,
            'Clave': clave,
            'Fecha_Corte': getLegionDate(sheet) || "",
            'Mes_Actual': monthIndex,
            'Total_Polizas': totalPol,
            'Bronce': Math.max(0, (4 * monthIndex) - totalPol),
            'Plata': Math.max(0, (6 * monthIndex) - totalPol),
            'Oro': Math.max(0, (7.5 * monthIndex) - totalPol),
            'Platino': Math.max(0, (10 * monthIndex) - totalPol),
            'Promedio_Mensual': totalPol / monthIndex,
            'Va_En_Meta': cumpled === 'p' ? "✅ EN META" : "❌ POR DEBAJO"
        });
    }

    // Process special raw format for Convenciones
    if (name === 'convenciones') {
        const workbook = readExcelData(name, { skipJson: true });
        if (!workbook) return res.status(404).json({ error: 'Raw file not found' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        if (!worksheet) return res.status(404).json({ error: 'Sheet not found' });

        // Date from B17
        const fechaCorte = worksheet?.['B17']?.v || "";

        // Data starts at Row 20 (range index 19), limit to 5000 rows
        const data: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, range: 'A20:AI5000' });

        const directory = getAdvisorDirectory();
        const advisorIds = Object.keys(directory).filter(id => directory[id] === advisor);

        // Find advisor row (Mat 2043, Clave match)
        const row = data.find(r => {
            if (String(r[4] || '') !== '2043') return false;
            const clave = String(r[7] || '');
            return clave === advisor || advisorIds.includes(clave);
        });

        if (!row) return res.status(404).json({ error: 'Advisor not found' });

        // --- Convention thresholds from ENTIRE dataset ---
        // Find credits of the person at places 480, 228, 108, 28
        const allWithPlace = data.slice(1).filter(r => r[32] != null && r[32] !== '' && r[24] != null);

        let credits480 = 0, credits228 = 0, credits108 = 0, credits28 = 0;
        allWithPlace.forEach(r => {
            const lugar = Number(r[32]);
            if (lugar === 480) credits480 = Number(r[24] || 0);
            if (lugar === 228) credits228 = Number(r[24] || 0);
            if (lugar === 108) credits108 = Number(r[24] || 0);
            if (lugar === 28) credits28 = Number(r[24] || 0);
        });

        // Convention level from asterisks column (index 33)
        const convRaw = String(row[33] || '').trim().toUpperCase();
        let nivelConvencion = '';
        if (convRaw.includes('GD')) nivelConvencion = '💎 Gran Diamante';
        else if (convRaw === '***') nivelConvencion = '💎💎💎 3 Diamantes';
        else if (convRaw === '**') nivelConvencion = '💎💎 2 Diamantes';
        else if (convRaw === '*') nivelConvencion = '💎 1 Diamante';

        const creditosTotales = Number(row[24] || 0);
        const polizas = Number(row[28] || 0);
        const lugar = Number(row[32] || 0);

        // Candados: Mínimo 30 pólizas Y $588,500 créditos
        const cumplePolizas = polizas >= 30;
        const cumpleCreditos = creditosTotales >= 588500;
        const isQualified = cumplePolizas && cumpleCreditos && lugar <= 480;

        return res.json({
            'Asesor': advisor,
            'Clave': row[7] || '',
            'Fecha_Corte': fechaCorte,
            'Comision_Vida': Number(row[11] || 0),
            'RDA': Number(row[20] || 0),
            'PA_Total': creditosTotales,
            'Polizas': polizas,
            'Lugar': lugar,
            'Nivel_Convencion': nivelConvencion,
            'Califica': isQualified,
            'Cumple_Polizas': cumplePolizas,
            'Cumple_Creditos': cumpleCreditos,
            'Lugar_480': credits480,
            'Lugar_228': credits228,
            'Lugar_108': credits108,
            'Lugar_28': credits28
        });
    }

    // Process special raw format for Camino a la Cumbre
    if (name === 'camino_cumbre') {
        const workbook = readExcelData(name, { skipJson: true });
        if (!workbook) return res.status(404).json({ error: 'Raw file not found' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        if (!worksheet) return res.status(404).json({ error: 'Sheet not found' });

        // Headers at Row 4 (index 3)
        const data: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, range: 3 });

        const directory = getAdvisorDirectory();
        const advisorIds = Object.keys(directory).filter(id => directory[id] === advisor);

        const row = data.find(r => {
            // MAT Column D (index 3)
            if (String(r[3] || '') !== '2043') return false;

            // CLAVE Column F (index 5)
            const clave = String(r[5] || '');
            return clave === advisor || advisorIds.includes(clave);
        });

        if (!row) return res.status(404).json({ error: 'Advisor not found' });

        const polizas_totales = Number(row[13] || 0);
        const mes_asesor = Number(row[10] || 1);

        // Dynamic search for Observation column in header
        const headers = data[0] || [];
        const obsIdx = headers.findIndex((h: any) => String(h || '').toLowerCase().includes('observaci'));
        let estatus = (obsIdx !== -1 ? row[obsIdx] : '') || '';

        // Baja alert logic if Quarter 1 is 0
        if (!estatus && mes_asesor <= 3 && polizas_totales === 0) {
            estatus = '⚠️ BAJA POR INACTIVIDAD';
        }

        let fechaConexion = row[6] || '';
        if (typeof fechaConexion === 'number') {
            const d = XLSX.SSF.parse_date_code(fechaConexion);
            const monthsSp = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
            if (d) fechaConexion = `${d.d} de ${monthsSp[d.m - 1]} de ${d.y}`;
        }

        return res.json({
            'Asesor': advisor,
            'Clave': row[5] || '',
            'Fecha_Corte': getCaminoDate(worksheet) || "",
            'Fecha_Conexion': fechaConexion,
            'Mes_Asesor': mes_asesor,
            'Trimestre': Math.ceil(mes_asesor / 3),
            'Polizas_Totales': polizas_totales,
            'Mes_1_Prod': row[21] || 0,
            'Mes_2_Prod': row[22] || 0,
            'Mes_3_Prod': row[23] || 0,
            'Estatus_meta': estatus
        });
    }

    // Process special raw format for Graduacion
    if (name === 'graduacion') {
        const workbook = readExcelData(name, { skipJson: true });
        if (!workbook) return res.status(404).json({ error: 'Raw file not found' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];

        // Data starts from Row 4 (index 3)
        const json: any[] = XLSX.utils.sheet_to_json(sheet, { range: 2 }); // Range 2 starts reading from Row 3 (headers)

        const directory = getAdvisorDirectory();
        const advisorKeys = Object.keys(directory).filter(key => directory[key] === advisor);

        const row = json.find(r => {
            const keys = Object.keys(r);
            const nombreKey = keys.find(k => k.trim() === 'NOMBRE');
            const claveKey = keys.find(k => k.trim() === 'ASESOR');

            const rowNombre = nombreKey ? String(r[nombreKey] || '') : '';
            const rowClave = claveKey ? String(r[claveKey] || '') : '';
            return rowNombre === advisor || advisorKeys.includes(rowNombre) || rowClave === advisor || advisorKeys.includes(rowClave);
        });

        if (!row) return res.status(404).json({ error: 'Advisor not found' });

        return res.json({
            'Asesor': advisor,
            'Clave': row['ASESOR'] || '',
            'Fecha_Corte': getMdrtDate(sheet) || "",
            'Mes_Asesor': row['MES'] || 0,
            'Fecha_Conexion': row['F. CONEXIÓN'] || '',
            'Limite_Logro_Meta': row['LÍMITE P/  LOGRO DE META'] || '',
            'Polizas_Totales': row['EN VIGOR'] || 0,
            'Comisones': row['TOTAL2'] || 0,
            'Produccion_Mes': row['TOTAL'] || 0 // This is the total pol. sold, used for maintenance logic in frontend
        });
    }

    // Process special raw format for MDRT
    if (name === 'mdrt') {
        const folderPath = path.join(BASE_PATH, name);
        if (!fs.existsSync(folderPath)) return res.status(404).json({ error: 'Folder not found' });

        const workbook = readExcelData(name, { skipJson: true });
        if (!workbook) return res.status(404).json({ error: 'Raw file not found' });

        const mdrtSheetName = workbook.SheetNames.find((n: string) => n.toUpperCase() === 'MDRT') || workbook.SheetNames[0];
        const worksheet = workbook.Sheets[mdrtSheetName!];
        if (!worksheet) return res.status(404).json({ error: 'MDRT sheet not found' });

        const dateStr = worksheet['A1']?.v || "";
        const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
        const monthMatches = Array.from(String(dateStr).toLowerCase().matchAll(/(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/g));
        const lastMonth = monthMatches.length > 0 ? monthMatches[monthMatches.length - 1]![1] : "enero";
        const monthIndex = months.indexOf(lastMonth) + 1;

        // Data starts from Row 4 (index 3)
        const json: any[] = XLSX.utils.sheet_to_json(worksheet, { range: 3 });

        const directory = getAdvisorDirectory();
        const advisorKeys = Object.keys(directory).filter(key => directory[key] === advisor);

        const row = json.find(r => {
            const keys = Object.keys(r);
            const matKey = keys.find(k => k.trim() === 'Mat');
            const nombreKey = keys.find(k => k.trim() === 'Nombre del Asesor');
            const claveKey = keys.find(k => k.trim() === 'Asesor');

            if (matKey && String(r[matKey] || '') !== '2043') return false;

            const rowNombre = nombreKey ? String(r[nombreKey] || '') : '';
            const rowClave = claveKey ? String(r[claveKey] || '') : '';

            return rowNombre === advisor || advisorKeys.includes(rowNombre) || rowClave === advisor || advisorKeys.includes(rowClave);
        });

        if (!row) return res.status(404).json({ error: 'Advisor not found' });

        // Total Prima might have spaces in key
        const paKey = Object.keys(row).find(k => k.trim() === 'Total Prima');
        const pa = paKey ? Number(row[paKey] || 0) : 0;

        return res.json({
            'Asesor': advisor,
            'Clave': row['Asesor'] || '',
            'Fecha_Corte': getMdrtDate(worksheet) || "",
            'Mes_Actual': monthIndex,
            'PA_Acumulada': pa,
            'PA_Faltante_Miembro': Math.max(0, 1810400 - pa),
            'PA_Faltante_COT': Math.max(0, 5431200 - pa),
            'PA_Faltante_TOT': Math.max(0, 10862400 - pa)
        });
    }

    const data: any = readExcelData(name);
    if (!data) return res.status(404).json({ error: 'Campaign not found' });

    const directory = getAdvisorDirectory();
    // Reverse lookup to find IDs for this name
    const advisorKeys = Object.keys(directory).filter(key => directory[key] === advisor);

    // Find row by name OR by any of its IDs
    const advisorData = data.find((row: any) => {
        const rowAsesor = String(row.Asesor || '');
        const rowClave = String(row.Clave || '');
        return rowAsesor === advisor || advisorKeys.includes(rowAsesor) || rowClave === advisor || advisorKeys.includes(rowClave);
    });

    if (!advisorData) return res.status(404).json({ error: 'Advisor not found in this campaign' });

    res.json(advisorData);
});

app.get('/api/themes', (req, res) => {
    try {
        const files = fs.readdirSync(THEMES_PATH).filter(f => f.endsWith('.json'));
        const themes = files.map(f => {
            const content = fs.readFileSync(path.join(THEMES_PATH, f), 'utf-8');
            return { file: f, ...JSON.parse(content) };
        });
        res.json(themes);
    } catch (error) {
        res.status(500).json({ error: 'Could not list themes' });
    }
});

app.get('/api/active-theme', (req, res) => {
    const activePath = path.join(THEMES_PATH, 'active_theme.txt');
    let themeFile = 'modo_neon.json';
    if (fs.existsSync(activePath)) {
        themeFile = fs.readFileSync(activePath, 'utf-8').trim();
    }

    const themePath = path.join(THEMES_PATH, themeFile);
    if (fs.existsSync(themePath)) {
        const content = fs.readFileSync(themePath, 'utf-8');
        res.json({ file: themeFile, ...JSON.parse(content) });
    } else {
        res.status(404).json({ error: 'Theme not found' });
    }
});

app.post('/api/active-theme', (req, res) => {
    const { themeFile } = req.body;
    const activePath = path.join(THEMES_PATH, 'active_theme.txt');
    try {
        fs.writeFileSync(activePath, themeFile);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Could not update theme' });
    }
});


// Admin endpoint: get ALL data for ALL campaigns (Mat 2043 only, with correct column mapping)
app.get('/api/admin/summary', (req, res) => {
    try {
        const result: Record<string, any[]> = {};
        const directory = getAdvisorDirectory();

        // Helper to resolve name from clave
        const resolveName = (clave: any) => {
            const key = String(clave || '');
            return directory[key] || key;
        };

        // ── MDRT ──
        try {
            const workbook = readExcelData('mdrt', { skipJson: true });
            if (workbook) {
                const sheetName = workbook.SheetNames.find((n: string) => n.toUpperCase() === 'MDRT') || workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName!];
                const data: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, range: 3 });
                const rows2043 = data.slice(1).filter(r => String(r[2] || '') === '2043');
                result.mdrt = rows2043.map(r => ({
                    Asesor: r[6] ? String(r[6]) : resolveName(r[5]),
                    Clave: r[5] || '',
                    PA_Acumulada: Number(r[21] || 0),
                    Fecha_Corte: getMdrtDate(worksheet) || '',
                }));
            } else { result.mdrt = []; }
        } catch { result.mdrt = []; }

        // ── CAMINO A LA CUMBRE ──
        try {
            const workbook = readExcelData('camino_cumbre', { skipJson: true });
            if (workbook) {
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const data: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, range: 3 });
                const rows2043 = data.slice(1).filter(r => String(r[3] || '') === '2043');
                result.camino_cumbre = rows2043.map(r => {
                    const polizas = Number(r[13] || 0);
                    const mes = Number(r[10] || 1);
                    const metaAcum = mes * 4;
                    return {
                        Asesor: resolveName(r[5]),
                        Clave: r[5] || '',
                        Mes_Asesor: mes,
                        Polizas_Totales: polizas,
                        Trimestre: Math.ceil(mes / 3),
                        Estatus_meta: polizas >= metaAcum ? 'EN META' : 'POR DEBAJO',
                    };
                });
            } else { result.camino_cumbre = []; }
        } catch { result.camino_cumbre = []; }

        // ── CONVENCIONES ──
        try {
            const workbook = readExcelData('convenciones', { skipJson: true });
            if (workbook) {
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const data: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, range: 'A20:AI5000' });

                // Convention thresholds
                const allWithPlace = data.slice(1).filter(r => r[32] != null && r[32] !== '' && r[24] != null);
                let credits480 = 0, credits228 = 0, credits108 = 0, credits28 = 0;
                allWithPlace.forEach(r => {
                    const lugar = Number(r[32]);
                    if (lugar === 480) credits480 = Number(r[24] || 0);
                    if (lugar === 228) credits228 = Number(r[24] || 0);
                    if (lugar === 108) credits108 = Number(r[24] || 0);
                    if (lugar === 28) credits28 = Number(r[24] || 0);
                });

                const rows2043 = data.slice(1).filter(r => String(r[4] || '') === '2043');
                result.convenciones = rows2043.map(r => {
                    const creditos = Number(r[24] || 0);
                    const polizas = Number(r[28] || 0);
                    const lugar = Number(r[32] || 9999);
                    const convRaw = String(r[33] || '').trim().toUpperCase();
                    let nivel = '';
                    if (convRaw.includes('GD')) nivel = 'Gran Diamante';
                    else if (convRaw === '***') nivel = '3 Diamantes';
                    else if (convRaw === '**') nivel = '2 Diamantes';
                    else if (convRaw === '*') nivel = '1 Diamante';

                    return {
                        Asesor: resolveName(r[7]),
                        Clave: r[7] || '',
                        Comision_Vida: Number(r[11] || 0),
                        RDA: Number(r[20] || 0),
                        PA_Total: creditos,
                        Polizas: polizas,
                        Lugar: lugar,
                        Nivel_Convencion: nivel,
                        Lugar_480: credits480,
                        Lugar_228: credits228,
                        Lugar_108: credits108,
                        Lugar_28: credits28,
                    };
                });
            } else { result.convenciones = []; }
        } catch { result.convenciones = []; }

        // ── GRADUACIÓN ──
        try {
            const workbook = readExcelData('graduacion', { skipJson: true });
            if (workbook) {
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const data: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, range: 2 });
                const rows2043 = data.slice(1).filter(r => String(r[3] || '') === '2043');
                result.graduacion = rows2043.map(r => ({
                    Asesor: r[7] ? String(r[7]) : resolveName(r[6]),
                    Clave: r[6] || '',
                    Mes_Asesor: Number(r[8] || 1),
                    Polizas_Totales: Number(r[16] || 0),
                    Comisiones: Number(r[20] || 0),
                }));
            } else { result.graduacion = []; }
        } catch { result.graduacion = []; }

        // ── LEGIÓN CENTURIÓN ──
        try {
            const workbook = readExcelData('legion_centurion', { skipJson: true });
            if (workbook) {
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const b9 = worksheet['B9']?.v || "";
                const monthsNames = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
                const monthMatch = String(b9).toLowerCase().match(/(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/);
                const currentMonthIdx = monthMatch ? monthsNames.indexOf(monthMatch[1]) + 1 : 1;

                const data: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, range: 11 }); // Row 12
                const rows2043 = data.slice(1).filter(r => String(r[4] || '') === '2043');
                result.legion_centurion = rows2043.map(r => ({
                    Asesor: resolveName(r[6]),
                    Clave: r[6] || '',
                    Mes_Actual: currentMonthIdx,
                    Total_Polizas: Number(r[10] || 0),
                    Nivel: r[13] || '',
                }));
            } else { result.legion_centurion = []; }
        } catch { result.legion_centurion = []; }

        res.json(result);
    } catch (error) {
        console.error('Error building admin summary:', error);
        res.status(500).json({ error: 'Could not build admin summary' });
    }
});

// Campaign cut-off dates endpoint
app.get('/api/campaigns/dates', (req, res) => {
    try {
        const campaignFolders = ['mdrt', 'camino_cumbre', 'convenciones', 'graduacion', 'legion_centurion'];
        const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

        const result: Record<string, string> = {};

        const monthsSp = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

        campaignFolders.forEach(folder => {
            try {
                const workbook = readExcelData(folder, { skipJson: true });
                if (workbook) {
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName!];

                    if (folder === 'legion_centurion') {
                        result[folder] = getLegionDate(worksheet) || "";
                    } else if (folder === 'mdrt') {
                        const mdrtSheetName = workbook.SheetNames.find((n: string) => n.toUpperCase() === 'MDRT') || workbook.SheetNames[0];
                        const mdrtSheet = workbook.Sheets[mdrtSheetName!];
                        result[folder] = getMdrtDate(mdrtSheet) || "";
                    } else if (folder === 'camino_cumbre') {
                        result[folder] = getCaminoDate(worksheet) || "";
                    } else if (folder === 'convenciones') {
                        const raw = worksheet?.['B17']?.v || "";
                        result[folder] = String(raw);
                    } else {
                        // For legacy/simple files, try to get date from A1 or first row JSON
                        const json = readExcelData(folder);
                        let rawDate: any = null;

                        if (json && json.length > 0 && (json[0] as any).Fecha_Corte != null) {
                            rawDate = (json[0] as any).Fecha_Corte;
                        } else {
                            rawDate = worksheet?.['A1']?.v;
                        }

                        if (rawDate != null) {
                            if (typeof rawDate === 'number' && rawDate > 40000) {
                                const d = XLSX.SSF.parse_date_code(rawDate);
                                if (d) {
                                    result[folder] = `${d.d} de ${monthsSp[d.m - 1]} de ${d.y}`;
                                } else {
                                    result[folder] = String(rawDate);
                                }
                            } else {
                                result[folder] = String(rawDate);
                            }
                        } else {
                            result[folder] = "";
                        }
                    }
                } else {
                    result[folder] = "";
                }
            } catch (e) {
                console.error(`Error processing date for ${folder}:`, e);
                result[folder] = "";
            }
        });
        res.json(result);
    } catch (error) {
        console.error('Error reading campaign dates:', error);
        res.status(500).json({ error: 'Could not read campaign dates' });
    }
});

// Admin Password Verification
app.post('/api/admin/verify-password', (req, res) => {
    const { password } = req.body;
    const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'Panel2043';

    if (password === ADMIN_PASS) {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, error: 'Contraseña incorrecta' });
    }
});

// Resumen General endpoint: reads modular files if they exist, or falls back to resumen_general.xlsx
app.get('/api/resumen-general', (req, res) => {
    try {
        const result: Record<string, any> = { fechas_corte: {} };
        const monthsNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

        const formatExcelDate = (val: any): string => {
            if (typeof val === 'number') {
                const d = XLSX.SSF.parse_date_code(val);
                if (d) {
                    const year = d.y < 100 ? (d.y < 30 ? 2000 + d.y : 1900 + d.y) : d.y;
                    return `${d.d} de ${monthsNames[d.m - 1]} de ${year}`;
                }
            }
            return String(val || '');
        };

        const legacyPath = path.join(BASE_PATH, 'administrador', 'resumen_general.xlsx');
        let legacyWorkbook: any = null;
        if (fs.existsSync(legacyPath)) legacyWorkbook = XLSX.readFile(legacyPath);

        // 1. ASESORES SIN EMISION
        const sinEmisionPath = path.join(BASE_PATH, 'administrador', 'asesores_sin_emision', 'Asesores sin Emision.xls');
        if (fs.existsSync(sinEmisionPath)) {
            const wb = XLSX.readFile(sinEmisionPath);
            const wsProm = wb.Sheets['Promotores'];
            const wsAses = wb.Sheets['Asesores'];

            // Extract date from the first rows
            const promJson: any[][] = wsProm ? XLSX.utils.sheet_to_json(wsProm, { header: 1 }) : [];
            const rawDateProm = (promJson[1] && promJson[1][0]) || (promJson[0] && promJson[0][0]) || "";
            result.fechas_corte['asesores_sin_emision'] = formatExcelDate(rawDateProm);

            // Summary by Sucursal from Promotores
            result.asesores_sin_emision = { summaryBySucursal: [], individuals: [] };
            if (wsProm) {
                const dataProm: any[][] = XLSX.utils.sheet_to_json(wsProm, { header: 1, range: 3 });
                result.asesores_sin_emision.summaryBySucursal = dataProm.filter(r => String(r[3] || '') === '2043').map(r => ({
                    Sucursal: r[5] || 'Desconocido',
                    Suc: r[4],
                    Agentes: Number(r[6] || 0),
                    Asesores_con_Emisión_Vida: Number(r[7] || 0),
                    '%_Asesores_con_Emisión_Vida': Number(r[8] || 0),
                    Asesores_con_Emisión_GMM: Number(r[9] || 0),
                    '%_Asesores_con_Emisión_GMM': Number(r[10] || 0),
                    Asesores_con_pol_Pagada_Vida: Number(r[11] || 0),
                    '%_Asesores_con_pol_Pagada_Vida': Number(r[12] || 0),
                    Asesores_con_pol_Pagada_GMM: Number(r[13] || 0),
                    '%_Asesores_con_pol_Pagada_GMM': Number(r[14] || 0),
                    Prima_Pagada_Vida: Number(r[15] || 0),
                    Prima_Pagada_GMM: Number(r[16] || 0),
                }));
            }

            // Individuals from Asesores
            if (wsAses) {
                const dataAses: any[][] = XLSX.utils.sheet_to_json(wsAses, { header: 1, range: 4 });
                result.asesores_sin_emision.individuals = dataAses.filter(r => String(r[3] || '') === '2043').map(r => ({
                    Asesor: r[7] || 'Desconocido',
                    Clave: r[6] || '',
                    Sucursal: r[5] || 'General',
                    Suc: r[4],
                    Emitido_Vida: Number(r[10] || 0),
                    Emitido_GMM: Number(r[11] || 0),
                    Pagado_Vida: Number(r[12] || 0),
                    Pagado_GMM: Number(r[13] || 0),
                    Prima_Pagada_Vida: Number(r[14] || 0),
                    Prima_Pagada_GMM: Number(r[15] || 0),
                    Sin_Emisión_Vida: r[16] || '',
                    Sin_Emisión_GMM: r[17] || '',
                    '3_Meses_Sin_Emisión_Vida': r[18] || '',
                    '3_Meses_Sin_Emisión_GMM': r[19] || ''
                }));
            }
        } else if (legacyWorkbook && legacyWorkbook.Sheets['asesores_sin_emision']) {
            // Legacy fallback
            const ws = legacyWorkbook.Sheets['asesores_sin_emision'];
            result.fechas_corte['asesores_sin_emision'] = formatExcelDate(ws['A1']?.v);
            const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
            const headers = data[1] || [];
            const individuals: any[] = [];
            const summaryBySucursal: any[] = [];
            data.slice(2).forEach(row => {
                if (row[0]) individuals.push(Object.fromEntries(headers.slice(0, 12).map((h, i) => [h, row[i]])));
                if (row[13]) summaryBySucursal.push(Object.fromEntries(headers.slice(13, 25).map((h, i) => [h, row[13 + i]])));
            });
            result.asesores_sin_emision = { individuals, summaryBySucursal };
        }

        // 2. PAGADO / PENDIENTE (PAGADO_EMITIDO)
        const pagadoPath = path.join(BASE_PATH, 'administrador', 'pagado_emitidido', 'pagado_emitido.xlsx');
        if (fs.existsSync(pagadoPath)) {
            const wb = XLSX.readFile(pagadoPath);
            const ws = wb.Sheets[wb.SheetNames[0]];
            const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
            result.fechas_corte['pagado_pendiente'] = formatExcelDate(data[0]?.[1] || data[0]?.[0] || "");
            result.pagado_pendiente = data.slice(3).filter(r => r[2] != null).map(r => ({
                'Nombre Asesor': r[2],
                'Sucursal': r[1],
                'Pólizas-Pagadas': Number(r[5] || 0),
                'Recibo_Inicial_Pagado': Number(r[6] || 0),
                'Recibo_Ordinario_Pagado': Number(r[7] || 0),
                'Total _Prima_Pagada': Number(r[8] || 0),
                'Pólizas_Pendinetes': Number(r[9] || 0),
                'Recibo_Inicial_Pendiente': Number(r[10] || 0),
                'Recibo_Ordinario_Pendiente': Number(r[11] || 0),
                'Total _Prima_Pendiente': Number(r[12] || 0)
            }));
        } else if (legacyWorkbook && legacyWorkbook.Sheets['pagado_pendiente']) {
            const ws = legacyWorkbook.Sheets['pagado_pendiente'];
            result.fechas_corte['pagado_pendiente'] = formatExcelDate(ws['A1']?.v);
            const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
            result.pagado_pendiente = data.slice(3).filter(r => r[2] != null).map(r => ({
                'Nombre Asesor': r[2], 'Sucursal': r[1],
                'Pólizas-Pagadas': r[5], 'Recibo_Inicial_Pagado': r[6], 'Recibo_Ordinario_Pagado': r[7], 'Total _Prima_Pagada': r[8],
                'Pólizas_Pendinetes': r[9], 'Recibo_Inicial_Pendiente': r[10], 'Recibo_Ordinario_Pendiente': r[11], 'Total _Prima_Pendiente': r[12]
            }));
        }

        // Helper: Read master directory
        const readDirectoryMap = () => {
            const dirPath = path.join(BASE_PATH, 'administrador', 'directorio_asesores.xlsx');
            if (fs.existsSync(dirPath)) {
                try {
                    const wb = XLSX.readFile(dirPath);
                    const ws = wb.Sheets[wb.SheetNames[0]];
                    const data: any[] = XLSX.utils.sheet_to_json(ws);
                    const map: Record<string, string> = {};
                    data.forEach((r: any) => {
                        if (r.Clave) map[String(r.Clave)] = String(r.Nombre_Completo || '').trim();
                    });
                    return map;
                } catch (e) { console.error('Error reading directory:', e); }
            }
            return {};
        };
        const directoryMap = readDirectoryMap();

        // 3. PROACTIVOS
        const proactivosPath = path.join(BASE_PATH, 'administrador', 'proactivos', 'Proactivos.xlsx');
        if (fs.existsSync(proactivosPath)) {
            const wb = XLSX.readFile(proactivosPath);
            const ws = wb.Sheets['Detalle Asesores'];
            if (ws) {
                const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
                const rawDate = (data[2]?.[2] || data[2]?.[0] || "").toString();
                result.fechas_corte['proactivos'] = formatExcelDate(rawDate);
                result.proactivos = data.slice(7).filter(r => String(r[2] || '') === '2043').map(r => ({
                    'ASESOR': directoryMap[String(r[4])] || `Asesor ${r[4]}`,
                    'SUC': r[3],
                    'Polizas_Acumuladas_Mes_Ant.': Number(r[9] || 0),
                    'Polizas_Del_mes': Number(r[10] || 0),
                    'Polizas_Acumuladas_Total': Number(r[11] || 0),
                    'Proactivo_al_mes': r[12] || '',
                    'Pólizas_Faltantes': Number(r[13] || 0),
                    'Proactivo_a_Dic': r[14] || '',
                    'Pólizas_Faltantes_Para_Dic': Number(r[15] || 0)
                }));
            }
        } else if (legacyWorkbook && legacyWorkbook.Sheets['proactivos']) {
            const ws = legacyWorkbook.Sheets['proactivos'];
            result.fechas_corte['proactivos'] = formatExcelDate(ws['A1']?.v);
            const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
            const headers = data[1] || [];
            result.proactivos = data.slice(2).filter(r => r[0]).map(r =>
                Object.fromEntries(headers.map((h, i) => [h, r[i]]))
            );
        }

        // 4. COMPARATIVO VIDA
        const compPath = path.join(BASE_PATH, 'administrador', 'comparativo_vida', 'comparativo vida.xlsx');
        if (fs.existsSync(compPath)) {
            const wb = XLSX.readFile(compPath);
            const wsProm = wb.Sheets['promotoria'];
            const wsAses = wb.Sheets['asesores'];
            let generalSummary = null;
            let individuals: any[] = [];

            if (wsProm) {
                const dataProm: any[][] = XLSX.utils.sheet_to_json(wsProm, { header: 1 });
                const d = dataProm[2] || []; // Data in Row 3
                generalSummary = {
                    Polizas_Pagadas_Año_Anterior: Number(d[0] || 0),
                    Polizas_Pagadas_Año_Actual: Number(d[1] || 0),
                    Crec_Polizas_Pagadas: Number(d[2] || 0),
                    '%_Crec_Polizas_Pagadas': Number(d[3] || 0),
                    Prima_Pagada_Año_Anterior: Number(d[4] || 0),
                    'Prima_Pagada_Añoa_Actual': Number(d[5] || 0),
                    Crec_Prima_Pagada: Number(d[6] || 0),
                    '%_Crec_Prima_Pagada': Number(d[7] || 0),
                    Recluta_Año_Anterior: Number(d[8] || 0),
                    Recluta_Año_Actual: Number(d[9] || 0),
                    Crec_Recluta: Number(d[10] || 0),
                    '%_Crec_Recluta': Number(d[11] || 0),
                    Prima_Pagada_Reclutas_Año_Anterior: Number(d[12] || 0),
                    Prima_Pagada_Reclutas_Año_Actual: Number(d[13] || 0),
                    Crec_Prima_Pagada_Reclutas: Number(d[14] || 0),
                    '%_Crec_Prima_Pagada_Reclutas': Number(d[15] || 0),
                };
            }

            if (wsAses) {
                const dataAses: any[][] = XLSX.utils.sheet_to_json(wsAses, { header: 1 });
                result.fechas_corte['comparativo_vida'] = formatExcelDate(dataAses[1]?.[2] || ""); // Row 2, Col C has 'Información al...'
                individuals = dataAses.slice(3).filter(r => String(r[2] || '') === '2043').map(r => ({
                    'Nombre del Asesor': r[6],
                    'Sucursal': r[3],
                    'Polizas_Pagadas_Año_Anterior': Number(r[15] || 0),
                    'Polizas_Pagadas_Año_Actual': Number(r[16] || 0),
                    'Crec_Polizas_Pagadas': Number(r[17] || 0),
                    '%_Crec_Polizas_Pagadas': Number(r[18] || 0),
                    'Prima_Pagada_Año_Anterior': Number(r[23] || 0),
                    'Prima_Pagada_Año_Actual': Number(r[24] || 0),
                    'Crec_Prima_Pagada': Number(r[25] || 0),
                    '%_Crec_Prima_Pagada': Number(r[26] || 0)
                }));
            }
            result.comparativo_vida = { individuals, generalSummary };
        } else if (legacyWorkbook && legacyWorkbook.Sheets['comparativo_vida']) {
            const key = 'comparativo_vida';
            const ws = legacyWorkbook.Sheets[key];
            result.fechas_corte[key] = formatExcelDate(ws['A1']?.v);
            const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
            const headers = data[1] || [];
            const rows = data.slice(2);
            const individuals: any[] = rows.filter(r => r[0]).map(r =>
                Object.fromEntries(headers.slice(0, 10).map((h, i) => [h, r[i]]))
            );
            const summaryRow = rows.find(r => r[12]);
            const generalSummary = summaryRow ? Object.fromEntries(headers.slice(12).map((h, i) => [h, summaryRow[12 + i]])) : null;
            result[key] = { individuals, generalSummary };
        } else {
            result.comparativo_vida = { individuals: [], generalSummary: null };
            result.fechas_corte['comparativo_vida'] = '';
        }

        res.json(result);
    } catch (error) {
        console.error('Error reading modular resumen general:', error);
        res.status(500).json({ error: 'Could not read modular summary data' });
    }
});

// ===================== ESTATUS DE PÓLIZAS =====================
const POLIZAS_PATH = path.join(BASE_PATH, 'estatus polizas');

// List available dates (reports)
app.get('/api/estatus-polizas/fechas', (req, res) => {
    try {
        const reportesPath = path.join(POLIZAS_PATH, 'reportes');
        if (!fs.existsSync(reportesPath)) return res.json([]);

        const fechas: string[] = [];
        const monthDirs = fs.readdirSync(reportesPath, { withFileTypes: true })
            .filter(d => d.isDirectory() && /^\d{4}-\d{2}$/.test(d.name));

        monthDirs.forEach(dir => {
            const dirPath = path.join(reportesPath, dir.name);
            fs.readdirSync(dirPath)
                .filter(f => f.startsWith('reporte_') && f.endsWith('.json'))
                .forEach(f => {
                    const match = f.match(/reporte_(\d{4}-\d{2}-\d{2})\.json/);
                    if (match) fechas.push(match[1]);
                });
        });

        res.json(fechas.sort().reverse());
    } catch (error) {
        console.error('Error listing poliza dates:', error);
        res.status(500).json({ error: 'Could not list dates' });
    }
});

// Get report for a specific date
app.get('/api/estatus-polizas/reporte/:fecha', (req, res) => {
    try {
        const { fecha } = req.params;
        const month = fecha.substring(0, 7);
        const filePath = path.join(POLIZAS_PATH, 'reportes', month, `reporte_${fecha}.json`);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: `No report found for ${fecha}` });
        }

        const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        res.json(content);
    } catch (error) {
        console.error('Error reading poliza report:', error);
        res.status(500).json({ error: 'Could not read report' });
    }
});

// Get changes for a specific date
app.get('/api/estatus-polizas/cambios/:fecha', (req, res) => {
    try {
        const { fecha } = req.params;
        const month = fecha.substring(0, 7);
        const filePath = path.join(POLIZAS_PATH, 'cambios', month, `cambios_${fecha}.json`);

        if (!fs.existsSync(filePath)) {
            return res.json(null); // No changes file = no comparison yet
        }

        const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        res.json(content);
    } catch (error) {
        console.error('Error reading poliza changes:', error);
        res.status(500).json({ error: 'Could not read changes' });
    }
});

// Get active follow-up tracker
app.get('/api/estatus-polizas/seguimiento', (req, res) => {
    try {
        const filePath = path.join(POLIZAS_PATH, 'seguimiento', 'seguimiento_activo.json');

        if (!fs.existsSync(filePath)) {
            return res.json({
                ultima_actualizacion: null,
                pendientes_recuperar: [],
                recuperadas_este_mes: []
            });
        }

        const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        res.json(content);
    } catch (error) {
        console.error('Error reading seguimiento:', error);
        res.status(500).json({ error: 'Could not read seguimiento' });
    }
});

// SPA Fallback — catch all unmatched routes and serve index.html
app.use((req, res) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    // Skip requests that look like static files (have an extension)
    if (path.extname(req.path)) {
        return res.status(404).send('Not found');
    }
    const indexPath = path.join(DIST_PATH, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.setHeader('Content-Type', 'text/html');
        res.sendFile(indexPath);
    } else {
        res.status(404).send('Frontend not built. Please run npm run build.');
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
});

console.log("Server listening setup complete");

