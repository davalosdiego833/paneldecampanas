// Version: 1.2.3_final_sync
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import os from 'os';
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
let cachedDirectoryMap: Record<string, string> = {};
let lastDirectoryMtime = 0;

const getCachedAdvisors = () => {
    getAdvisorDirectory(); // This populates the caches if needed
    return cachedAdvisors;
};

// Helper to get advisor directory
const getAdvisorDirectory = () => {
    const filePath = path.join(BASE_PATH, 'administrador', 'directorio_asesores.xlsx');
    if (!fs.existsSync(filePath)) return {};

    try {
        const mtime = fs.statSync(filePath).mtimeMs;
        if (mtime === lastDirectoryMtime && Object.keys(cachedDirectoryMap).length > 0) {
            return cachedDirectoryMap;
        }

        const workbook = XLSX.readFile(filePath);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data: any[] = XLSX.utils.sheet_to_json(worksheet);
        const directory: Record<string, string> = {};
        data.forEach(row => {
            const keys = Object.keys(row);
            const claveKey = keys.find(k => k.toLowerCase().trim() === 'clave');
            const nombreKey = keys.find(k => k.toLowerCase().trim() === 'nombre_completo' || k.toLowerCase().trim() === 'nombre completo');

            if (claveKey && nombreKey && row[claveKey] && row[nombreKey]) {
                directory[String(row[claveKey])] = String(row[nombreKey]).trim();
            }
        });

        cachedDirectoryMap = directory;
        cachedAdvisors = Object.values(directory).sort();
        lastDirectoryMtime = mtime;

        return directory;
    } catch (e) {
        console.error('Error reading director:', e);
        return {};
    }
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



const MONTHS_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const parseSpanishDate = (str: string): string => {
    if (!str) return '';
    // Use a regex that allows optional "de" before the year
    const match = String(str).toLowerCase().match(/(\d{1,2})\s+de\s+([a-z]+)(\s+de)?\s+(\d{4})/i);
    if (match) {
        const day = match[1].padStart(2, '0');
        const monthStr = match[2].toLowerCase();
        let mIdx = MONTHS_ES.indexOf(monthStr);
        if (mIdx === -1) {
            mIdx = MONTHS_ES.findIndex(m => m.startsWith(monthStr) || monthStr.startsWith(m.substring(0, 3)));
        }
        const month = (mIdx !== -1 ? mIdx + 1 : 1).toString().padStart(2, '0');
        const year = match[4]; // index changed because of optional group
        return `${year}-${month}-${day}`;
    }
    return '';
};

const formatExcelDate = (val: any): string => {
    const monthsNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    if (typeof val === 'number') {
        const d = XLSX.SSF.parse_date_code(val);
        if (d) {
            const year = d.y < 100 ? (d.y < 30 ? 2000 + d.y : 1900 + d.y) : d.y;
            return `${d.d} de ${monthsNames[d.m - 1]} de ${year}`;
        }
    }
    return String(val || '');
};

// Simple in-memory cache for Excel data to prevent heavy re-reads
const excelCache: Record<string, { mtime: number, workbook: any, json?: any }> = {};

// Cache for historical dates mapping: { folderPath: { "YYYY-MM-DD": "filename.xlsx" } }
const historyCache: Record<string, Record<string, string>> = {};

// Helper to get Mexico City time — reliable method using Intl
const formatMexicoTimestamp = () => {
    const now = new Date();
    // Use Intl.DateTimeFormat to get each component in Mexico City timezone
    const fmt = (opts: Intl.DateTimeFormatOptions) =>
        new Intl.DateTimeFormat('es-MX', { ...opts, timeZone: 'America/Mexico_City' }).format(now);
    const day = fmt({ day: 'numeric' });
    const month = fmt({ month: 'numeric' });
    const year = fmt({ year: 'numeric' });
    const hour = fmt({ hour: 'numeric', hour12: false });
    const minute = fmt({ minute: 'numeric' });
    const second = fmt({ second: 'numeric' });
    return `${day}/${month}/${year}, ${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:${second.padStart(2, '0')}`;
};

// Helper: case-insensitive sheet lookup
const findSheet = (wb: any, name: string) => {
    const exact = wb.Sheets[name];
    if (exact) return exact;
    const match = wb.SheetNames.find((n: string) => n.toLowerCase() === name.toLowerCase());
    return match ? wb.Sheets[match] : null;
};

// Helper to get cutoff date from any worksheet based on common locations
const extractCutoffDate = (wb: any, type: string): string => {
    try {
        if (type === 'legion_centurion') {
            const ws = wb.Sheets[wb.SheetNames[0]];
            const v = ws?.['B9']?.v || "";
            const m = String(v).match(/\d{1,2}\s+de\s+[a-z]+\s+de\s+\d{4}/i);
            return m ? parseSpanishDate(m[0]) : '';
        }
        if (type === 'mdrt') {
            const ws = wb.Sheets[wb.SheetNames.find((n: string) => n.toUpperCase() === 'MDRT') || wb.SheetNames[0]];
            const v = ws?.['A1']?.v || "";
            const ms = String(v).match(/\d{1,2}\s+de\s+[a-z]+\s+de\s+\d{4}/gi);
            return ms ? parseSpanishDate(ms[ms.length - 1]) : '';
        }
        if (type === 'camino_cumbre') {
            const ws = wb.Sheets[wb.SheetNames[0]];
            const v = ws?.['A1']?.v || ws?.['B19']?.v || "";
            const ms = String(v).match(/\d{1,2}\s+de\s+[a-z]+\s+de\s+\d{4}/gi);
            return ms ? parseSpanishDate(ms[ms.length - 1]) : '';
        }
        if (type === 'convenciones') {
            const ws = wb.Sheets[wb.SheetNames[0]];
            const v = ws?.['B17']?.v || "";
            if (typeof v === 'number') return parseSpanishDate(formatExcelDate(v));
            const m = String(v).match(/\d{1,2}\s+de\s+[a-z]+\s+de\s+\d{4}/i);
            return m ? parseSpanishDate(m[0]) : '';
        }
        if (type === 'graduacion') {
            const ws = wb.Sheets[wb.SheetNames[0]];
            return parseSpanishDate(formatExcelDate(ws?.['A1']?.v));
        }
        if (type === 'proactivos') {
            const ws = wb.Sheets['Detalle Asesores'];
            if (!ws) return '';
            const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
            return parseSpanishDate(formatExcelDate(data[2]?.[2] || data[2]?.[0] || ""));
        }
        if (type === 'pagado_pendiente') {
            const ws = wb.Sheets[wb.SheetNames[0]];
            const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
            return parseSpanishDate(formatExcelDate(data[0]?.[1] || data[0]?.[0] || ws?.['A1']?.v || ""));
        }
        if (type === 'asesores_sin_emision') {
            const ws = wb.Sheets['Promotores'] || wb.Sheets[wb.SheetNames[0]];
            const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
            return parseSpanishDate(formatExcelDate(data[1]?.[0] || data[0]?.[0] || ""));
        }
        if (type === 'comparativo_vida') {
            const ws = findSheet(wb, 'asesores');
            if (!ws) return '';
            const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
            return parseSpanishDate(formatExcelDate(data[0]?.[0] || data[1]?.[2] || ""));
        }
        if (type === 'fanfest' || type === 'vive_tu_pasion') {
            const ws = wb.Sheets[wb.SheetNames[0]];
            const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
            for (let i = 0; i < 15; i++) {
                if (!data[i]) continue;
                const rowStr = data[i].join(' ');
                const m = String(rowStr).match(/\d{1,2}\s+de\s+[a-z]+(\s+de)?\s+(\d{4})/i);
                if (m) return parseSpanishDate(m[0]);
            }
            return '';
        }
        return '';
    } catch (e) {
        return '';
    }
};

// Helper to read Excel with optional date (history)
const readExcelData = (folderName: string, options: { skipJson?: boolean, date?: string } = {}) => {
    const folderPath = path.join(BASE_PATH, folderName);
    if (!fs.existsSync(folderPath)) return null;

    try {
        let fileName = '';
        if (options.date && historyCache[folderName] && historyCache[folderName][options.date]) {
            fileName = historyCache[folderName][options.date];
        } else {
            // Default: get latest file (by mtime)
            const files = fs.readdirSync(folderPath).filter(f => (f.endsWith('.xlsx') || f.endsWith('.xlsm') || f.endsWith('.xls')) && !f.startsWith('~$'));
            if (files.length === 0) return null;
            fileName = files.sort((a, b) => fs.statSync(path.join(folderPath, b)).mtimeMs - fs.statSync(path.join(folderPath, a)).mtimeMs)[0];
        }

        const filePath = path.join(folderPath, fileName);
        const stats = fs.statSync(filePath);
        const mtime = stats.mtimeMs;
        const cacheKey = `${folderName}_${fileName}`;

        // Return from cache if file hasn't changed
        if (excelCache[cacheKey] && excelCache[cacheKey].mtime === mtime) {
            if (options.skipJson) return excelCache[cacheKey].workbook;
            if (excelCache[cacheKey].json) return excelCache[cacheKey].json;
            const workbook = excelCache[cacheKey].workbook;
            const sheetNames = workbook.SheetNames;
            const json = XLSX.utils.sheet_to_json(workbook.Sheets[sheetNames[0]]);
            excelCache[cacheKey].json = json;
            return json;
        }

        console.log(`[DEBUG] Cache miss for ${cacheKey}. Reading file: ${filePath}`);
        const workbook = XLSX.readFile(filePath, { cellFormula: false, cellStyles: false, cellNF: false });
        excelCache[cacheKey] = { mtime, workbook };

        if (options.skipJson) return workbook;

        const sheetNames = workbook.SheetNames;
        const json = XLSX.utils.sheet_to_json(workbook.Sheets[sheetNames[0]]);
        excelCache[cacheKey].json = json;
        return json;
    } catch (error) {
        console.error(`Error reading folder/file ${folderName}:`, error);
        return null;
    }
};

const getLegionDate = (worksheet: any) => {
    const v = worksheet?.['B9']?.v || "";
    const m = String(v).match(/\d{1,2}\s+de\s+[a-z]+\s+de\s+\d{4}/i);
    return m ? m[0] : null;
};

const getMdrtDate = (worksheet: any) => {
    const v = worksheet?.['A1']?.v || "";
    const ms = String(v).match(/\d{1,2}\s+de\s+[a-z]+\s+de\s+\d{4}/gi);
    return ms ? ms[ms.length - 1]! : null;
};

const getCaminoDate = (worksheet: any) => {
    const v = worksheet?.['A1']?.v || worksheet?.['B19']?.v || "";
    const ms = String(v).match(/\d{1,2}\s+de\s+[a-z]+\s+de\s+\d{4}/gi);
    return ms ? ms[ms.length - 1]! : null;
};

// --- Endpoints ---

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
        if (advisors.length > 0) return res.json(advisors);
        res.json([]);
    } catch (error) {
        res.status(500).json({ error: 'Could not list advisors' });
    }
});

app.get('/api/campaign/:name/data/:advisor', (req, res) => {
    const { name, advisor } = req.params;
    const { date } = req.query;

    if (name === 'legion_centurion') {
        const wb = readExcelData(name, { skipJson: true, date: date as string });
        if (!wb) return res.status(404).json({ error: 'Raw file not found' });
        const sheetName = wb.SheetNames.find((n: string) => n.toUpperCase() === 'ASESORES') || wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        if (!ws._cachedJson) ws._cachedJson = XLSX.utils.sheet_to_json(ws, { range: 'A11:Z10000' });
        const json: any[] = ws._cachedJson;
        const b9 = ws['B9']?.v || "";
        const mMatch = String(b9).toLowerCase().match(/(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/);
        const mIndex = mMatch ? MONTHS_ES.indexOf(mMatch[1]) + 1 : 1;
        const dir = getAdvisorDirectory();
        const advisorKeys = Object.keys(dir).filter(key => dir[key] === advisor);
        const row = json.find(r => String(r['Matriz'] || '') === '2043' && (String(r['Asesor'] || '') === advisor || advisorKeys.includes(String(r['Asesor'] || ''))));
        if (!row) return res.status(404).json({ error: 'Advisor not found' });
        const totalPol = Number(row['Total Pólizas'] || 0);
        const clave = String(row['Asesor'] || '');
        return res.json({
            'Asesor': dir[clave] || clave, 'Clave': clave, 'Fecha_Corte': getLegionDate(ws) || "",
            'Mes_Actual': mIndex, 'Total_Polizas': totalPol, 'Bronce': Math.max(0, (4 * mIndex) - totalPol),
            'Plata': Math.max(0, (6 * mIndex) - totalPol), 'Oro': Math.max(0, (7.5 * mIndex) - totalPol),
            'Platino': Math.max(0, (10 * mIndex) - totalPol), 'Promedio_Mensual': totalPol / mIndex,
            'Va_En_Meta': String(row['Cumple Meta Proporc.'] || '').toLowerCase() === 'p' ? "✅ EN META" : "❌ POR DEBAJO"
        });
    }

    if (name === 'convenciones') {
        const wb = readExcelData(name, { skipJson: true, date: date as string });
        if (!wb) return res.status(404).json({ error: 'Raw file not found' });
        const sheetName = wb.SheetNames.find((n: string) => n.toUpperCase() === 'TODOS LOS RAMOS') || wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        if (!ws._cachedData) ws._cachedData = XLSX.utils.sheet_to_json(ws, { header: 1, range: 'A20:AI5000' });
        const data: any[][] = ws._cachedData;
        const dir = getAdvisorDirectory();
        const advisorIds = Object.keys(dir).filter(id => dir[id] === advisor);
        const row = data.find(r => String(r[4] || '') === '2043' && (String(r[7] || '') === advisor || advisorIds.includes(String(r[7] || ''))));
        if (!row) return res.status(404).json({ error: 'Advisor not found' });
        const allCredits = data.slice(1).filter(r => r[32] != null && r[32] !== '' && r[24] != null);
        let c480 = 0, c228 = 0, c108 = 0, c28 = 0;
        allCredits.forEach(r => {
            const l = Number(r[32]);
            if (l === 480) c480 = Number(r[24] || 0);
            if (l === 228) c228 = Number(r[24] || 0);
            if (l === 108) c108 = Number(r[24] || 0);
            if (l === 28) c28 = Number(r[24] || 0);
        });
        const credits = Number(row[24] || 0);
        const pols = Number(row[28] || 0);
        const lugar = Number(row[32] || 0);

        const cumplePolizas = pols >= 30;
        const cumpleCreditos = credits >= 588500;
        const califica = cumplePolizas && cumpleCreditos;

        return res.json({
            'Asesor': advisor, 'Clave': row[7] || '', 'Fecha_Corte': String(ws['B17']?.v || ""),
            'Comision_Vida': Number(row[11] || 0), 'RDA': Number(row[18] || 0), 'PA_Total': credits, 'Polizas': pols,
            'Lugar': lugar, 'Lugar_480': c480, 'Lugar_228': c228, 'Lugar_108': c108, 'Lugar_28': c28,
            'Califica': califica, 'Cumple_Polizas': cumplePolizas, 'Cumple_Creditos': cumpleCreditos
        });
    }

    if (name === 'camino_cumbre') {
        const wb = readExcelData(name, { skipJson: true, date: date as string });
        if (!wb) return res.status(404).json({ error: 'Raw file not found' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        if (!ws._cachedData) ws._cachedData = XLSX.utils.sheet_to_json(ws, { header: 1, range: 3 });
        const data: any[][] = ws._cachedData;
        const dir = getAdvisorDirectory();
        const advisorIds = Object.keys(dir).filter(id => dir[id] === advisor);
        const row = data.find(r => String(r[3] || '') === '2043' && (String(r[5] || '') === advisor || advisorIds.includes(String(r[5] || ''))));
        if (!row) return res.status(404).json({ error: 'Advisor not found' });
        const pols = Number(row[13] || 0);
        const mes = Number(row[10] || 1);
        return res.json({
            'Asesor': advisor, 'Clave': row[5] || '', 'Fecha_Corte': getCaminoDate(ws) || "",
            'Mes_Asesor': mes, 'Trimestre': Math.ceil(mes / 3), 'Polizas_Totales': pols,
            'Mes_1_Prod': row[21] || 0, 'Mes_2_Prod': row[22] || 0, 'Mes_3_Prod': row[23] || 0
        });
    }

    if (name === 'graduacion') {
        const wb = readExcelData(name, { skipJson: true, date: date as string });
        if (!wb) return res.status(404).json({ error: 'Raw file not found' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        if (!ws._cachedJson) ws._cachedJson = XLSX.utils.sheet_to_json(ws, { range: 2 });
        const json: any[] = ws._cachedJson;
        const dir = getAdvisorDirectory();
        const advisorKeys = Object.keys(dir).filter(key => dir[key] === advisor);
        const row = json.find(r => String(r['NOMBRE'] || '') === advisor || advisorKeys.includes(String(r['NOMBRE'] || '')) || String(r['ASESOR'] || '') === advisor || advisorKeys.includes(String(r['ASESOR'] || '')));
        if (!row) return res.status(404).json({ error: 'Advisor not found' });

        const limitKey = Object.keys(row).find(k => k.includes('MITE P/'));
        const fechaLimite = limitKey ? row[limitKey] : "";

        return res.json({
            'Asesor': advisor, 'Clave': row['ASESOR'] || '', 'Fecha_Corte': getMdrtDate(ws) || "",
            'Mes_Asesor': row['MES'] || 0, 'Polizas_Totales': row['EN VIGOR'] || 0, 'Comisones': row['TOTAL2'] || 0,
            'Fecha_Limite_Meta': formatExcelDate(fechaLimite) || "No disponible"
        });
    }

    if (name === 'fanfest') {
        const wb = readExcelData(name, { skipJson: true, date: date as string });
        if (!wb) return res.status(404).json({ error: 'Raw file not found' });
        const sheetName = wb.SheetNames.find((n: string) => n.toUpperCase() === 'ASESORES') || wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, range: 7 }); // Headers on Row 8
        const dir = getAdvisorDirectory();
        const advisorIds = Object.keys(dir).filter(id => dir[id] === advisor);

        // E (idx 4) is Mat, G (idx 6) is Clave
        const row = data.find(r => String(r[4] || '') === '2043' && (String(r[6] || '') === advisor || advisorIds.includes(String(r[6] || ''))));
        if (!row) return res.status(404).json({ error: 'Advisor not found' });

        return res.json({
            'Asesor': advisor,
            'Clave': row[6] || '',
            'Fecha_Corte': extractCutoffDate(wb, 'fanfest'),
            'Enero': Number(row[8] || 0),
            'Febrero': Number(row[9] || 0),
            'Marzo': Number(row[10] || 0),
            'Abril': Number(row[11] || 0),
            'Condicion': String(row[12] || '').toLowerCase() === 'p',
            'Total_Polizas': Number(row[13] || 0),
            'Premio': String(row[14] || '').toLowerCase() === 'p' ? "GANADO 🏆" : "PENDIENTE ⏳"
        });
    }

    if (name === 'vive_tu_pasion') {
        const wb = readExcelData(name, { skipJson: true, date: date as string });
        if (!wb) return res.status(404).json({ error: 'Raw file not found' });
        const sheetName = wb.SheetNames.find((n: string) => n.toUpperCase() === 'ASESORES') || wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, range: 7 });
        const dir = getAdvisorDirectory();
        const advisorIds = Object.keys(dir).filter(id => dir[id] === advisor);

        const row = data.find(r => String(r[4] || '') === '2043' && (String(r[6] || '') === advisor || advisorIds.includes(String(r[6] || ''))));
        if (!row) return res.status(404).json({ error: 'Advisor not found' });

        return res.json({
            'Asesor': advisor,
            'Clave': row[6] || '',
            'Fecha_Corte': extractCutoffDate(wb, 'vive_tu_pasion'),
            'Polizas': Number(row[8] || 0),
            'Comisiones': Number(row[9] || 0),
            'Premio_Actual': row[10] || "Ninguno aún"
        });
    }

    if (name === 'mdrt') {
        const wb = readExcelData(name, { skipJson: true, date: date as string });
        if (!wb) return res.status(404).json({ error: 'Raw file not found' });
        const ws = wb.Sheets[wb.SheetNames.find((n: string) => n.toUpperCase() === 'MDRT') || wb.SheetNames[0]];
        if (!ws._cachedJson) ws._cachedJson = XLSX.utils.sheet_to_json(ws, { range: 3 });
        const json: any[] = ws._cachedJson;
        const dir = getAdvisorDirectory();
        const advisorKeys = Object.keys(dir).filter(key => dir[key] === advisor);
        const row = json.find(r => String(r['Mat'] || '') === '2043' && (String(r['Nombre del Asesor'] || '') === advisor || advisorKeys.includes(String(r['Nombre del Asesor'] || '')) || String(r['Asesor'] || '') === advisor || advisorKeys.includes(String(r['Asesor'] || ''))));
        if (!row) return res.status(404).json({ error: 'Advisor not found' });
        const paKey = Object.keys(row).find(k => (k || '').trim().toLowerCase() === 'total prima');
        const pa = paKey ? Number(row[paKey] || 0) : 0;
        const mMatches = Array.from(String(ws['A1']?.v || '').toLowerCase().matchAll(/(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/g));
        const lastM = mMatches.length > 0 ? mMatches[mMatches.length - 1]![1] : "enero";
        return res.json({
            'Asesor': advisor, 'Clave': row['Asesor'] || '', 'Fecha_Corte': getMdrtDate(ws) || "",
            'Mes_Actual': MONTHS_ES.indexOf(lastM) + 1, 'PA_Acumulada': pa
        });
    }

    const json = readExcelData(name, { date: date as string });
    if (!json) return res.status(404).json({ error: 'Campaign not found' });
    const dir = getAdvisorDirectory();
    const advisorKeys = Object.keys(dir).filter(key => dir[key] === advisor);
    const advisorData = json.find((row: any) => String(row.Asesor || '') === advisor || advisorKeys.includes(String(row.Asesor || '')) || String(row.Clave || '') === advisor || advisorKeys.includes(String(row.Clave || '')));
    if (!advisorData) return res.status(404).json({ error: 'Advisor not found' });
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
    } catch (e) { res.status(500).json({ error: 'Could not list themes' }); }
});

app.get('/api/active-theme', (req, res) => {
    const activePath = path.join(THEMES_PATH, 'active_theme.txt');
    let themeFile = fs.existsSync(activePath) ? fs.readFileSync(activePath, 'utf-8').trim() : 'modo_neon.json';
    const themePath = path.join(THEMES_PATH, themeFile);
    if (fs.existsSync(themePath)) {
        res.json({ file: themeFile, ...JSON.parse(fs.readFileSync(themePath, 'utf-8')) });
    } else res.status(404).json({ error: 'Theme not found' });
});

app.post('/api/active-theme', (req, res) => {
    try {
        fs.writeFileSync(path.join(THEMES_PATH, 'active_theme.txt'), req.body.themeFile);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Could not update theme' }); }
});

app.get('/api/admin/summary', (req, res) => {
    try {
        const { date, useSnapshot } = req.query;

        // Performance optimization: check for frozen snapshot
        if (useSnapshot === 'true' && fs.existsSync(SNAPSHOT_PATH)) {
            const snapshotData = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf-8'));
            return res.json(snapshotData.data || snapshotData); // Fallback for old snapshot format
        }

        const result: Record<string, any> = { dates: {} };
        const dir = getAdvisorDirectory();
        const resolveName = (cl: any) => dir[String(cl)] || `Asesor ${cl}`;

        const cams = ['mdrt', 'camino_cumbre', 'convenciones', 'graduacion', 'legion_centurion', 'fanfest', 'vive_tu_pasion'];
        cams.forEach(c => {
            try {
                const wb = readExcelData(c, { skipJson: true, date: date as string });
                if (wb) {
                    if (c === 'mdrt') {
                        const ws = wb.Sheets[wb.SheetNames.find((n: string) => n.toUpperCase() === 'MDRT') || wb.SheetNames[0]];
                        const data: any[] = XLSX.utils.sheet_to_json(ws, { range: 3 });
                        result.mdrt = data.filter(r => String(r.Matriz || r['Mat'] || '') === '2043').map(r => {
                            // Find PA column (some Excels have leading/trailing spaces)
                            const paKey = Object.keys(r).find(k => k.trim().toLowerCase() === 'total prima' || k.trim().toLowerCase() === 'camino prima');
                            return {
                                Asesor: resolveName(r.Asesor || r['Nombre del Asesor']),
                                Clave: r.Asesor || '',
                                PA_Acumulada: Number(r[paKey!] || 0)
                            };
                        });
                    } else if (c === 'camino_cumbre') {
                        const ws = wb.Sheets[wb.SheetNames[0]];
                        const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, range: 3 });
                        result.camino_cumbre = data.slice(1).filter(r => String(r[3] || '') === '2043').map(r => ({ Asesor: resolveName(r[5]), Clave: r[5] || '', Mes_Asesor: Number(r[10] || 1), Polizas_Totales: Number(r[13] || 0), Mes_1_Prod: Number(r[21] || 0), Mes_2_Prod: Number(r[22] || 0), Mes_3_Prod: Number(r[23] || 0) }));
                    } else if (c === 'convenciones') {
                        const ws = wb.Sheets[wb.SheetNames[0]];
                        const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, range: 'A20:AI5000' });
                        // Global thresholds
                        const allRows = data.slice(1);
                        let c480 = 0, c228 = 0, c108 = 0, c28 = 0;
                        allRows.forEach(r => {
                            const l = Number(r[32]);
                            if (l === 480) c480 = Number(r[24] || 0);
                            if (l === 228) c228 = Number(r[24] || 0);
                            if (l === 108) c108 = Number(r[108] || r[24] || 0); // fallback or specific col if needed
                            if (l === 228) c228 = Number(r[228] || r[24] || 0);

                            // Re-calculate exactly like the advisor dashboard
                            if (l === 480) c480 = Number(r[24] || 0);
                            if (l === 228) c228 = Number(r[24] || 0);
                            if (l === 108) c108 = Number(r[24] || 0);
                            if (l === 28) c28 = Number(r[24] || 0);
                        });
                        result.convenciones = allRows.filter(r => String(r[4] || '') === '2043').map(r => ({
                            Asesor: resolveName(r[7]),
                            Clave: r[7] || '',
                            Comision_Vida: Number(r[11] || 0),
                            RDA: Number(r[18] || 0),
                            PA_Total: Number(r[24] || 0),
                            Polizas: Number(r[28] || 0),
                            Lugar: Number(r[32] || 9999),
                            Lugar_480: c480, Lugar_228: c228, Lugar_108: c108, Lugar_28: c28
                        }));
                    } else if (c === 'graduacion') {
                        const ws = wb.Sheets[wb.SheetNames[0]];
                        const data: any[] = XLSX.utils.sheet_to_json(ws, { header: 1, range: 2 });
                        result.graduacion = data.slice(1).filter(r => String(r[3] || '') === '2043').map(r => ({ Asesor: r[7] ? String(r[7]) : resolveName(r[6]), Clave: r[6] || '', Mes_Asesor: Number(r[8] || 1), Polizas_Totales: Number(r[16] || 0) }));
                    } else if (c === 'legion_centurion') {
                        const ws = wb.Sheets[wb.SheetNames[0]];
                        const data: any[] = XLSX.utils.sheet_to_json(ws, { header: 1, range: 11 });
                        const b9 = ws['B9']?.v || "";
                        const mMatch = String(b9).toLowerCase().match(/(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/);
                        const mIndex = mMatch ? MONTHS_ES.indexOf(mMatch[1]) + 1 : 1;
                        result.legion_centurion = data.slice(1).filter(r => String(r[4] || '') === '2043').map(r => ({
                            Asesor: resolveName(r[6]),
                            Clave: r[6] || '',
                            Total_Polizas: Number(r[10] || 0),
                            Mes_Actual: mIndex,
                            Nivel: r[13] || '',
                            EnMeta: String(r[12] || '').toLowerCase() === 'p'
                        }));
                    } else if (c === 'fanfest') {
                        const ws = wb.Sheets['ASESORES'] || wb.Sheets[wb.SheetNames[0]];
                        const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, range: 7 });
                        result.fanfest = data.slice(2).filter(r => String(r[4] || '') === '2043').map(r => ({
                            Asesor: resolveName(r[6]),
                            Clave: r[6] || '',
                            Total_Polizas: Number(r[13] || 0),
                            Enero: Number(r[8] || 0),
                            Febrero: Number(r[9] || 0),
                            Marzo: Number(r[10] || 0),
                            Abril: Number(r[11] || 0),
                            Condicion: String(r[12] || '').toLowerCase() === 'p',
                            Premio: String(r[14] || '').toLowerCase() === 'p' ? "GANADO 🏆" : "PENDIENTE ⏳"
                        }));
                    } else if (c === 'vive_tu_pasion') {
                        const ws = wb.Sheets['ASESORES'] || wb.Sheets[wb.SheetNames[0]];
                        const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, range: 7 });
                        result.vive_tu_pasion = data.slice(2).filter(r => String(r[4] || '') === '2043').map(r => ({
                            Asesor: resolveName(r[6]),
                            Clave: r[6] || '',
                            Polizas: Number(r[8] || 0),
                            Comisiones: Number(r[9] || 0),
                            Premio: r[10] || ""
                        }));
                    }
                } else result[c] = [];

                // Extract cutoff date
                if (wb) {
                    const iso = extractCutoffDate(wb, c);
                    if (iso) {
                        const d = iso.split('-');
                        result.dates[c] = `${d[2]} de ${MONTHS_ES[Number(d[1]) - 1]} de ${d[0]}`;
                    } else result.dates[c] = "";
                } else result.dates[c] = "";

            } catch { result[c] = []; result.dates[c] = ""; }
        });
        res.json(result);
    } catch (e) { res.status(500).json({ error: 'Could not build admin summary' }); }
});

app.get('/api/admin/snapshot-status', (req, res) => {
    if (fs.existsSync(SNAPSHOT_PATH)) {
        const stats = fs.statSync(SNAPSHOT_PATH);
        const data = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf-8'));
        return res.json({
            exists: true,
            updatedAt: data.updatedAt,
            mtime: stats.mtime
        });
    }
    res.json({ exists: false });
});

app.post('/api/admin/snapshot', async (req, res) => {
    try {
        // PERFORMANCE FIX: Clear Excel cache to force reading new files
        Object.keys(excelCache).forEach(k => delete excelCache[k]);
        console.log('[DEBUG] Clearing Excel cache for fresh snapshot');

        // We reuse the logic from /api/admin/summary but save it
        // Simulating a fetch or just calling the internal logic would be best
        // To keep it simple and clean, let's just use the current data state
        const dir = getAdvisorDirectory();
        const resolveName = (cl: any) => dir[String(cl)] || `Asesor ${cl}`;
        const result: Record<string, any> = { dates: {} };
        const cams = ['mdrt', 'camino_cumbre', 'convenciones', 'graduacion', 'legion_centurion', 'fanfest', 'vive_tu_pasion'];

        for (const c of cams) {
            const wb = readExcelData(c, { skipJson: true });
            if (wb) {
                if (c === 'mdrt') {
                    const ws = wb.Sheets[wb.SheetNames.find((n: string) => n.toUpperCase() === 'MDRT') || wb.SheetNames[0]];
                    const data: any[] = XLSX.utils.sheet_to_json(ws, { range: 3 });
                    result.mdrt = data.filter(r => String(r.Matriz || r['Mat'] || '') === '2043').map(r => {
                        const paKey = Object.keys(r).find(k => k.trim().toLowerCase() === 'total prima' || k.trim().toLowerCase() === 'camino prima');
                        return { Asesor: resolveName(r.Asesor || r['Nombre del Asesor']), Clave: r.Asesor || '', PA_Acumulada: Number(r[paKey!] || 0) };
                    });
                } else if (c === 'camino_cumbre') {
                    const ws = wb.Sheets[wb.SheetNames[0]];
                    const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, range: 3 });
                    result.camino_cumbre = data.slice(1).filter(r => String(r[3] || '') === '2043').map(r => ({ Asesor: resolveName(r[5]), Clave: r[5] || '', Mes_Asesor: Number(r[10] || 1), Polizas_Totales: Number(r[13] || 0), Mes_1_Prod: Number(r[21] || 0), Mes_2_Prod: Number(r[22] || 0), Mes_3_Prod: Number(r[23] || 0) }));
                } else if (c === 'convenciones') {
                    const sheetName = wb.SheetNames.find((n: string) => n.toUpperCase() === 'TODOS LOS RAMOS') || wb.SheetNames[0];
                    const ws = wb.Sheets[sheetName];
                    const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, range: 'A20:AI5000' });
                    const allRows = data.slice(1);
                    let c480 = 0, c228 = 0, c108 = 0, c28 = 0;
                    allRows.forEach(r => {
                        const l = Number(r[32]);
                        if (l === 480) c480 = Number(r[24] || 0);
                        if (l === 228) c228 = Number(r[24] || 0);
                        if (l === 108) c108 = Number(r[24] || 0);
                        if (l === 28) c28 = Number(r[24] || 0);
                    });
                    result.convenciones = allRows.filter(r => String(r[4] || '') === '2043').map(r => ({
                        Asesor: resolveName(r[7]), Clave: r[7] || '', Comision_Vida: Number(r[11] || 0), RDA: Number(r[18] || 0), PA_Total: Number(r[24] || 0), Polizas: Number(r[28] || 0),
                        Lugar: Number(r[32] || 9999), Lugar_480: c480, Lugar_228: c228, Lugar_108: c108, Lugar_28: c28
                    }));
                } else if (c === 'graduacion') {
                    const ws = wb.Sheets[wb.SheetNames[0]];
                    const data: any[] = XLSX.utils.sheet_to_json(ws, { header: 1, range: 2 });
                    result.graduacion = data.slice(1).filter(r => String(r[3] || '') === '2043').map(r => ({ Asesor: r[7] ? String(r[7]) : resolveName(r[6]), Clave: r[6] || '', Mes_Asesor: Number(r[8] || 1), Polizas_Totales: Number(r[16] || 0) }));
                } else if (c === 'legion_centurion') {
                    const sheetName = wb.SheetNames.find((n: string) => n.toUpperCase() === 'ASESORES') || wb.SheetNames[0];
                    const ws = wb.Sheets[sheetName];
                    const data: any[] = XLSX.utils.sheet_to_json(ws, { header: 1, range: 11 });
                    const b9 = ws['B9']?.v || "";
                    const mMatch = String(b9).toLowerCase().match(/(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/);
                    const mIndex = mMatch ? MONTHS_ES.indexOf(mMatch[1]) + 1 : 1;
                    result.legion_centurion = data.slice(1).filter(r => String(r[4] || '') === '2043').map(r => ({
                        Asesor: resolveName(r[6]), Clave: r[6] || '', Total_Polizas: Number(r[10] || 0), Mes_Actual: mIndex, Nivel: r[13] || '', EnMeta: String(r[12] || '').toLowerCase() === 'p'
                    }));
                } else if (c === 'fanfest') {
                    const ws = wb.Sheets['ASESORES'] || wb.Sheets[wb.SheetNames[0]];
                    const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, range: 7 });
                    result.fanfest = data.slice(2).filter(r => String(r[4] || '') === '2043').map(r => ({
                        Asesor: resolveName(r[6]), Clave: r[6] || '', Total_Polizas: Number(r[13] || 0), Enero: Number(r[8] || 0), Febrero: Number(r[9] || 0), Marzo: Number(r[10] || 0), Abril: Number(r[11] || 0), Condicion: String(r[12] || '').toLowerCase() === 'p', Premio: String(r[14] || '').toLowerCase() === 'p' ? "GANADO 🏆" : "PENDIENTE ⏳"
                    }));
                } else if (c === 'vive_tu_pasion') {
                    const ws = wb.Sheets['ASESORES'] || wb.Sheets[wb.SheetNames[0]];
                    const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, range: 7 });
                    result.vive_tu_pasion = data.slice(2).filter(r => String(r[4] || '') === '2043').map(r => ({
                        Asesor: resolveName(r[6]), Clave: r[6] || '', Polizas: Number(r[8] || 0), Comisiones: Number(r[9] || 0), Premio: r[10] || ""
                    }));
                }

                // Extract cutoff date for snapshot
                if (wb) {
                    const iso = extractCutoffDate(wb, c);
                    if (iso) {
                        const d = iso.split('-');
                        result.dates[c] = `${d[2]} de ${MONTHS_ES[Number(d[1]) - 1]} de ${d[0]}`;
                    } else result.dates[c] = "";
                } else result.dates[c] = "";
            }
        }

        const snapshot = {
            updatedAt: formatMexicoTimestamp(),
            data: {
                ...result,
                resumen_general: {} // Placeholder to be filled below
            }
        };

        // INTEGRATE RESUMEN GENERAL LOGIC INTO SNAPSHOT
        try {
            const rg: Record<string, any> = { fechas_corte: {} };

            // --- Asesores sin Emisión ---
            try {
                const sinEmPath = 'administrador/asesores_sin_emision';
                const wbSin = readExcelData(sinEmPath, { skipJson: true });
                if (wbSin) {
                    const wsP = wbSin.Sheets['Promotores'], wsA = wbSin.Sheets['Asesores'];
                    rg.fechas_corte['asesores_sin_emision'] = formatExcelDate(extractCutoffDate(wbSin, 'asesores_sin_emision'));
                    rg.asesores_sin_emision = { summaryBySucursal: [], individuals: [] };
                    if (wsP) {
                        const dat = XLSX.utils.sheet_to_json(wsP, { header: 1, range: 3 });
                        rg.asesores_sin_emision.summaryBySucursal = dat.filter((r: any) => String(r[3] || '') === '2043').map((r: any) => ({ Sucursal: r[5] || 'Descon', Suc: r[4], Agentes: Number(r[6] || 0), Asesores_con_Emisión_Vida: Number(r[7] || 0), '%_Asesores_con_Emisión_Vida': Number(r[8] || 0), Asesores_con_Emisión_GMM: Number(r[9] || 0), '%_Asesores_con_Emisión_GMM': Number(r[10] || 0), Asesores_con_pol_Pagada_Vida: Number(r[11] || 0), '%_Asesores_con_pol_Pagada_Vida': Number(r[12] || 0), Asesores_con_pol_Pagada_GMM: Number(r[13] || 0), '%_Asesores_con_pol_Pagada_GMM': Number(r[14] || 0), Prima_Pagada_Vida: Number(r[15] || 0), Prima_Pagada_GMM: Number(r[16] || 0) }));
                    }
                    if (wsA) {
                        const dat = XLSX.utils.sheet_to_json(wsA, { header: 1, range: 4 });
                        rg.asesores_sin_emision.individuals = dat.filter((r: any) => String(r[3] || '') === '2043').map((r: any) => ({ Asesor: r[7] || 'Descon', Clave: r[6] || '', Sucursal: r[5] || 'General', Suc: r[4], Emitido_Vida: Number(r[10] || 0), Emitido_GMM: Number(r[11] || 0), Pagado_Vida: Number(r[12] || 0), Pagado_GMM: Number(r[13] || 0), Prima_Pagada_Vida: Number(r[14] || 0), Prima_Pagada_GMM: Number(r[15] || 0), Sin_Emisión_Vida: r[16] || '', Sin_Emisión_GMM: r[17] || '', '3_Meses_Sin_Emisión_Vida': r[18] || '', '3_Meses_Sin_Emisión_GMM': r[19] || '' }));
                    }
                    console.log(`[SNAPSHOT] asesores_sin_emision: ${rg.asesores_sin_emision.individuals.length} individuals`);
                } else {
                    console.warn('[SNAPSHOT] asesores_sin_emision: No workbook found');
                }
            } catch (e) { console.error('[SNAPSHOT] Error reading asesores_sin_emision:', e); }

            // --- Pagado y Emitido ---
            try {
                const pagPath = 'administrador/pagado_emitidido';
                const wbPag = readExcelData(pagPath, { skipJson: true });
                if (wbPag) {
                    const data: any[][] = XLSX.utils.sheet_to_json(wbPag.Sheets[wbPag.SheetNames[0]], { header: 1 });
                    rg.fechas_corte['pagado_pendiente'] = formatExcelDate(extractCutoffDate(wbPag, 'pagado_pendiente'));
                    const validSucursales = ['2043', '2692', '2856', '2511'];
                    rg.pagado_pendiente = data.slice(3)
                        .filter(r => r[2] != null && validSucursales.includes(String(r[1])))
                        .map(r => ({ 'Nombre Asesor': r[2], 'Sucursal': r[1], 'Pólizas-Pagadas': Number(r[5] || 0), 'Recibo_Inicial_Pagado': Number(r[6] || 0), 'Recibo_Ordinario_Pagado': Number(r[7] || 0), 'Total _Prima_Pagada': Number(r[8] || 0), 'Pólizas_Pendinetes': Number(r[9] || 0), 'Recibo_Inicial_Pendiente': Number(r[10] || 0), 'Recibo_Ordinario_Pendiente': Number(r[11] || 0), 'Total _Prima_Pendiente': Number(r[12] || 0) }));
                    console.log(`[SNAPSHOT] pagado_pendiente: ${rg.pagado_pendiente.length} rows`);
                } else {
                    console.warn('[SNAPSHOT] pagado_emitidido: No workbook found');
                }
            } catch (e) { console.error('[SNAPSHOT] Error reading pagado_emitidido:', e); }

            // --- Proactivos ---
            try {
                const proPath = 'administrador/proactivos';
                const wbPro = readExcelData(proPath, { skipJson: true });
                if (wbPro) {
                    const ws = wbPro.Sheets['Detalle Asesores'];
                    if (ws) {
                        const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
                        rg.fechas_corte['proactivos'] = formatExcelDate(extractCutoffDate(wbPro, 'proactivos'));
                        rg.proactivos = data.slice(7).filter(r => String(r[2] || '') === '2043').map(r => ({ 'ASESOR': dir[String(r[4])] || `Asesor ${r[4]}`, 'SUC': r[3], 'Polizas_Acumuladas_Mes_Ant.': Number(r[9] || 0), 'Polizas_Del_mes': Number(r[10] || 0), 'Polizas_Acumuladas_Total': Number(r[11] || 0), 'Proactivo_al_mes': r[12] || '', 'Pólizas_Faltantes': Number(r[13] || 0) }));
                        console.log(`[SNAPSHOT] proactivos: ${rg.proactivos.length} rows`);
                    } else {
                        console.warn('[SNAPSHOT] proactivos: Sheet "Detalle Asesores" NOT found. Available sheets:', wbPro.SheetNames);
                    }
                } else {
                    console.warn('[SNAPSHOT] proactivos: No workbook found');
                }
            } catch (e) { console.error('[SNAPSHOT] Error reading proactivos:', e); }

            // --- Comparativo de Vida ---
            try {
                const compPath = 'administrador/comparativo_vida';
                const wbComp = readExcelData(compPath, { skipJson: true });
                if (wbComp) {
                    const wsP = findSheet(wbComp, 'promotoria'), wsA = findSheet(wbComp, 'asesores');
                    console.log('[SNAPSHOT] comparativo_vida sheets found:', { promotoria: !!wsP, asesores: !!wsA, available: wbComp.SheetNames });
                    rg.fechas_corte['comparativo_vida'] = formatExcelDate(extractCutoffDate(wbComp, 'comparativo_vida'));
                    let sum: any = null;
                    if (wsP) {
                        const rawP = XLSX.utils.sheet_to_json(wsP, { header: 1 }) as any[][];
                        const parseVal = (v: any) => {
                            if (v === undefined || v === null || v === '') return 0;
                            if (typeof v === 'number') return v;
                            const str = String(v).replace(/[%,\s]/g, '');
                            const num = parseFloat(str);
                            if (isNaN(num)) return 0;
                            return String(v).includes('%') ? num / 100 : num;
                        };
                        const dataRow = rawP[4] || rawP.find((row, idx) => idx > 0 && row.length > 4 && typeof row[0] === 'number');
                        if (dataRow) {
                            // LITERAL MAPPING FROM EXCEL SCREENSHOT (Row 5 = index 4)
                            sum = {
                                Polizas_Pagadas_Año_Anterior: parseVal(dataRow[0]),
                                Polizas_Pagadas_Año_Actual: parseVal(dataRow[1]),
                                Crec_Polizas_Pagadas: parseVal(dataRow[2]) || (parseVal(dataRow[1]) - parseVal(dataRow[0])),
                                '%_Crec_Polizas_Pagadas': parseVal(dataRow[3]) || (parseVal(dataRow[0]) !== 0 ? (parseVal(dataRow[1]) - parseVal(dataRow[0])) / parseVal(dataRow[0]) : 0),
                                Prima_Pagada_Año_Anterior: parseVal(dataRow[4]),
                                'Prima_Pagada_Añoa_Actual': parseVal(dataRow[5]),
                                Crec_Prima_Pagada: parseVal(dataRow[6]) || (parseVal(dataRow[5]) - parseVal(dataRow[4])),
                                '%_Crec_Prima_Pagada': parseVal(dataRow[7]) || (parseVal(dataRow[4]) !== 0 ? (parseVal(dataRow[5]) - parseVal(dataRow[4])) / parseVal(dataRow[4]) : 0),
                                Recluta_Año_Anterior: parseVal(dataRow[8]),
                                Recluta_Año_Actual: parseVal(dataRow[9]),
                                Crec_Recluta: parseVal(dataRow[10]) || (parseVal(dataRow[9]) - parseVal(dataRow[8])),
                                '%_Crec_Recluta': parseVal(dataRow[11]) || (parseVal(dataRow[8]) !== 0 ? (parseVal(dataRow[9]) - parseVal(dataRow[8])) / parseVal(dataRow[8]) : 0),
                                Prima_Pagada_Reclutas_Año_Anterior: parseVal(dataRow[12]),
                                Prima_Pagada_Reclutas_Año_Actual: parseVal(dataRow[13]),
                                Crec_Prima_Pagada_Reclutas: parseVal(dataRow[14]) || (parseVal(dataRow[13]) - parseVal(dataRow[12])),
                                '%_Crec_Prima_Pagada_Reclutas': parseVal(dataRow[15]) || (parseVal(dataRow[12]) !== 0 ? (parseVal(dataRow[13]) - parseVal(dataRow[12])) / parseVal(dataRow[12]) : 0)
                            };
                        }
                    } else {
                        console.warn('[SNAPSHOT] comparativo_vida: Sheet "promotoria" NOT found. Available sheets:', wbComp.SheetNames);
                    }
                    let inds: any[] = [];
                    if (wsA) {
                        const rawFormat = XLSX.utils.sheet_to_json(wsA, { header: 1 }) as any[][];
                        if (rawFormat.length > 2 && rawFormat[2][2] === 'Mat') {
                            inds = rawFormat.slice(6).filter((r: any) => String(r[6] || r[5] || '') !== '' && r[6] !== 'TOTAL').map((r: any) => ({
                                'Nombre del Asesor': r[6] || r[5],
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
                        } else {
                            inds = XLSX.utils.sheet_to_json(wsA, { range: 1 }).filter((r: any) => String(r['MAT'] || '') === '2043').map((r: any) => ({ 'Nombre del Asesor': r['Nombre'], 'Sucursal': r['Sucursal'], 'Polizas_Pagadas_Año_Anterior': Number(r['Pzs Pag Ant'] || 0), 'Polizas_Pagadas_Año_Actual': Number(r['Pzs Pag Act'] || 0), 'Prima_Pagada_Año_Anterior': Number(r['Pri Pag Ant'] || 0), 'Prima_Pagada_Año_Actual': Number(r['Pri Pag Act'] || 0) }));
                        }
                    } else {
                        console.warn('[SNAPSHOT] comparativo_vida: Sheet "asesores" NOT found. Available sheets:', wbComp.SheetNames);
                    }
                    rg.comparativo_vida = { individuals: inds, generalSummary: sum };
                    console.log(`[SNAPSHOT] comparativo_vida: ${inds.length} individuals`);
                } else {
                    console.warn('[SNAPSHOT] comparativo_vida: No workbook found');
                }
            } catch (e) { console.error('[SNAPSHOT] Error reading comparativo_vida:', e); }

            snapshot.data.resumen_general = rg;
        } catch (rgError) {
            console.error('Error during snapshot resumen_general:', rgError);
        }

        const dbDir = path.join(BASE_PATH, 'db');
        if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir);

        // --- AUTOMATIC ACTIVITY LOG FOR SNAPSHOT/PUSH ---
        try {
            const now = new Date();
            const fmtMx = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('es-MX', { ...opts, timeZone: 'America/Mexico_City' }).format(now);
            const mxDay = fmtMx({ day: '2-digit' }), mxMonth = fmtMx({ month: '2-digit' }), mxYear = fmtMx({ year: 'numeric' });
            const mxHour = fmtMx({ hour: '2-digit', hour12: false }), mxMinute = fmtMx({ minute: '2-digit' }), mxSecond = fmtMx({ second: '2-digit' });

            const event = {
                id: Date.now().toString(),
                asesor: "⚡ SISTEMA",
                accion: "📥 Nueva Actualización de Reportes (Push)",
                fecha: `${mxYear}-${mxMonth}-${mxDay}`,
                hora: `${mxHour.padStart(2, '0')}:${mxMinute.padStart(2, '0')}:${mxSecond.padStart(2, '0')}`,
                timestamp: now.getTime()
            };

            let activities = dualReadArray(ACTIVITY_FILE);
            activities.unshift(event);
            if (activities.length > 5000) activities = activities.slice(0, 5000);
            dualWrite(ACTIVITY_FILE, activities);
        } catch (actErr) { console.error('Error logging snapshot activity:', actErr); }
        // ----------------------------------------------

        fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2));
        res.json({ success: true, updatedAt: snapshot.updatedAt });
    } catch (e) {
        console.error('Snapshot Error:', e);
        res.status(500).json({ error: 'Failed to create snapshot' });
    }
});

app.get('/api/campaigns/dates', (req, res) => {
    try {
        const cams = ['mdrt', 'camino_cumbre', 'convenciones', 'graduacion', 'legion_centurion', 'fanfest', 'vive_tu_pasion'];
        const result: Record<string, string> = {};
        cams.forEach(c => {
            const wb = readExcelData(c, { skipJson: true });
            if (wb) {
                const iso = extractCutoffDate(wb, c);
                if (iso) {
                    const d = iso.split('-');
                    result[c] = `${d[2]} de ${MONTHS_ES[Number(d[1]) - 1]} de ${d[0]}`;
                } else result[c] = "";
            } else result[c] = "";
        });
        res.json(result);
    } catch (e) { res.status(500).json({ error: 'Could not read dates' }); }
});

app.post('/api/admin/verify-password', (req, res) => {
    if (req.body.password === (process.env.ADMIN_PASSWORD || 'Panel2043')) res.json({ success: true });
    else res.status(401).json({ success: false, error: 'Contraseña incorrecta' });
});

app.get('/api/historico-metas', (req, res) => {
    const filePath = path.join(BASE_PATH, 'db', 'historico_metas.json');
    if (!fs.existsSync(filePath)) {
        return res.json({ "2026": {} });
    }
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        res.json(JSON.parse(data));
    } catch (e) {
        res.status(500).json({ error: 'Error reading history' });
    }
});

app.get('/api/resumen-general', (req, res) => {
    try {
        const { dates, useSnapshot } = req.query;

        // Performance optimization: check for frozen snapshot
        if (useSnapshot === 'true' && fs.existsSync(SNAPSHOT_PATH)) {
            const snapshotData = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf-8'));
            if (snapshotData.data?.resumen_general) {
                return res.json(snapshotData.data.resumen_general);
            }
        }

        const selectedDates = dates ? JSON.parse(dates as string) : {};
        const result: Record<string, any> = { fechas_corte: {} };

        const sinEmPath = 'administrador/asesores_sin_emision';
        const wbSin = readExcelData(sinEmPath, { skipJson: true, date: selectedDates.asesores_sin_emision });
        if (wbSin) {
            const wsP = wbSin.Sheets['Promotores'], wsA = wbSin.Sheets['Asesores'];
            result.fechas_corte['asesores_sin_emision'] = formatExcelDate(extractCutoffDate(wbSin, 'asesores_sin_emision'));
            result.asesores_sin_emision = { summaryBySucursal: [], individuals: [] };
            if (wsP) {
                const dat = XLSX.utils.sheet_to_json(wsP, { header: 1, range: 3 });
                result.asesores_sin_emision.summaryBySucursal = dat.filter((r: any) => String(r[3] || '') === '2043').map((r: any) => ({ Sucursal: r[5] || 'Descon', Suc: r[4], Agentes: Number(r[6] || 0), Asesores_con_Emisión_Vida: Number(r[7] || 0), '%_Asesores_con_Emisión_Vida': Number(r[8] || 0), Asesores_con_Emisión_GMM: Number(r[9] || 0), '%_Asesores_con_Emisión_GMM': Number(r[10] || 0), Asesores_con_pol_Pagada_Vida: Number(r[11] || 0), '%_Asesores_con_pol_Pagada_Vida': Number(r[12] || 0), Asesores_con_pol_Pagada_GMM: Number(r[13] || 0), '%_Asesores_con_pol_Pagada_GMM': Number(r[14] || 0), Prima_Pagada_Vida: Number(r[15] || 0), Prima_Pagada_GMM: Number(r[16] || 0) }));
            }
            if (wsA) {
                const dat = XLSX.utils.sheet_to_json(wsA, { header: 1, range: 4 });
                result.asesores_sin_emision.individuals = dat.filter((r: any) => String(r[3] || '') === '2043').map((r: any) => ({ Asesor: r[7] || 'Descon', Clave: r[6] || '', Sucursal: r[5] || 'General', Suc: r[4], Emitido_Vida: Number(r[10] || 0), Emitido_GMM: Number(r[11] || 0), Pagado_Vida: Number(r[12] || 0), Pagado_GMM: Number(r[13] || 0), Prima_Pagada_Vida: Number(r[14] || 0), Prima_Pagada_GMM: Number(r[15] || 0), Sin_Emisión_Vida: r[16] || '', Sin_Emisión_GMM: r[17] || '', '3_Meses_Sin_Emisión_Vida': r[18] || '', '3_Meses_Sin_Emisión_GMM': r[19] || '' }));
            }
        }

        const pagPath = 'administrador/pagado_emitidido';
        const wbPag = readExcelData(pagPath, { skipJson: true, date: selectedDates.pagado_pendiente });
        if (wbPag) {
            const data: any[][] = XLSX.utils.sheet_to_json(wbPag.Sheets[wbPag.SheetNames[0]], { header: 1 });
            result.fechas_corte['pagado_pendiente'] = formatExcelDate(extractCutoffDate(wbPag, 'pagado_pendiente'));
            const validSucursales = ['2043', '2692', '2856', '2511'];
            result.pagado_pendiente = data.slice(3)
                .filter(r => r[2] != null && validSucursales.includes(String(r[1])))
                .map(r => ({ 'Nombre Asesor': r[2], 'Sucursal': r[1], 'Pólizas-Pagadas': Number(r[5] || 0), 'Recibo_Inicial_Pagado': Number(r[6] || 0), 'Recibo_Ordinario_Pagado': Number(r[7] || 0), 'Total _Prima_Pagada': Number(r[8] || 0), 'Pólizas_Pendinetes': Number(r[9] || 0), 'Recibo_Inicial_Pendiente': Number(r[10] || 0), 'Recibo_Ordinario_Pendiente': Number(r[11] || 0), 'Total _Prima_Pendiente': Number(r[12] || 0) }));
        }

        const dir = getAdvisorDirectory();
        const proPath = 'administrador/proactivos';
        const wbPro = readExcelData(proPath, { skipJson: true, date: selectedDates.proactivos });
        if (wbPro) {
            const ws = wbPro.Sheets['Detalle Asesores'];
            if (ws) {
                const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
                result.fechas_corte['proactivos'] = formatExcelDate(extractCutoffDate(wbPro, 'proactivos'));
                result.proactivos = data.slice(7).filter(r => String(r[2] || '') === '2043').map(r => ({ 'ASESOR': dir[String(r[4])] || `Asesor ${r[4]}`, 'SUC': r[3], 'Polizas_Acumuladas_Mes_Ant.': Number(r[9] || 0), 'Polizas_Del_mes': Number(r[10] || 0), 'Polizas_Acumuladas_Total': Number(r[11] || 0), 'Proactivo_al_mes': r[12] || '', 'Pólizas_Faltantes': Number(r[13] || 0) }));
            }
        }

        const compPath = 'administrador/comparativo_vida';
        const wbComp = readExcelData(compPath, { skipJson: true, date: selectedDates.comparativo_vida });
        if (wbComp) {
            const wsP = findSheet(wbComp, 'promotoria'), wsA = findSheet(wbComp, 'asesores');
            result.fechas_corte['comparativo_vida'] = formatExcelDate(extractCutoffDate(wbComp, 'comparativo_vida'));
            let sum: any = null;
            if (wsP) {
                const rawP = XLSX.utils.sheet_to_json(wsP, { header: 1 }) as any[][];
                if (rawP.length > 2) {
                    const parseVal = (v: any) => {
                        if (v === undefined || v === null || v === '') return 0;
                        if (typeof v === 'number') return v;
                        const str = String(v).replace(/[%,\s]/g, '');
                        const num = parseFloat(str);
                        if (isNaN(num)) return 0;
                        return String(v).includes('%') ? num / 100 : num;
                    };
                    // Try Row 5 (index 4) first, then fallback to finding number row
                    const dataRow = rawP[4] || rawP.find((row, idx) => idx > 0 && row.length > 4 && typeof row[0] === 'number');
                    if (dataRow) {
                        // LITERAL MAPPING FROM EXCEL SCREENSHOT (Row 5 = index 4)
                        sum = {
                            Polizas_Pagadas_Año_Anterior: parseVal(dataRow[0]),
                            Polizas_Pagadas_Año_Actual: parseVal(dataRow[1]),
                            Crec_Polizas_Pagadas: parseVal(dataRow[2]) || (parseVal(dataRow[1]) - parseVal(dataRow[0])),
                            '%_Crec_Polizas_Pagadas': parseVal(dataRow[3]) || (parseVal(dataRow[0]) !== 0 ? (parseVal(dataRow[1]) - parseVal(dataRow[0])) / parseVal(dataRow[0]) : 0),
                            Prima_Pagada_Año_Anterior: parseVal(dataRow[4]),
                            'Prima_Pagada_Añoa_Actual': parseVal(dataRow[5]),
                            Crec_Prima_Pagada: parseVal(dataRow[6]) || (parseVal(dataRow[5]) - parseVal(dataRow[4])),
                            '%_Crec_Prima_Pagada': parseVal(dataRow[7]) || (parseVal(dataRow[4]) !== 0 ? (parseVal(dataRow[5]) - parseVal(dataRow[4])) / parseVal(dataRow[4]) : 0),
                            Recluta_Año_Anterior: parseVal(dataRow[8]),
                            Recluta_Año_Actual: parseVal(dataRow[9]),
                            Crec_Recluta: parseVal(dataRow[10]) || (parseVal(dataRow[9]) - parseVal(dataRow[8])),
                            '%_Crec_Recluta': parseVal(dataRow[11]) || (parseVal(dataRow[8]) !== 0 ? (parseVal(dataRow[9]) - parseVal(dataRow[8])) / parseVal(dataRow[8]) : 0),
                            Prima_Pagada_Reclutas_Año_Anterior: parseVal(dataRow[12]),
                            Prima_Pagada_Reclutas_Año_Actual: parseVal(dataRow[13]),
                            Crec_Prima_Pagada_Reclutas: parseVal(dataRow[14]) || (parseVal(dataRow[13]) - parseVal(dataRow[12])),
                            '%_Crec_Prima_Pagada_Reclutas': parseVal(dataRow[15]) || (parseVal(dataRow[12]) !== 0 ? (parseVal(dataRow[13]) - parseVal(dataRow[12])) / parseVal(dataRow[12]) : 0)
                        };
                        console.log('[DEBUG] Promotoría API Row Found (v1.2.0):', dataRow.slice(0, 16));
                    }
                }

                if (!sum) {
                    const d: any = XLSX.utils.sheet_to_json(wsP, { range: 2 })[0] || {};
                    sum = {
                        Polizas_Pagadas_Año_Anterior: Number(d['Polizas Pagadas Año Anterior'] || d[0] || 0),
                        Polizas_Pagadas_Año_Actual: Number(d['Polizas Pagadas Año Actual'] || d[1] || 0),
                        Prima_Pagada_Año_Anterior: Number(d['Prima Pagada Año Anterior'] || d[4] || 0),
                        Prima_Pagada_Año_Actual: Number(d['Prima Pagada Año Actual'] || d[5] || 0)
                    };
                }
            }
            let inds: any[] = [];
            if (wsA) {
                const rawFormat = XLSX.utils.sheet_to_json(wsA, { header: 1 }) as any[][];
                if (rawFormat.length > 2 && rawFormat[2][2] === 'Mat') {
                    // Nuevo formato complejo (Comparativo Vida original)
                    inds = rawFormat.slice(6).filter((r: any) => String(r[6] || r[5] || '') !== '' && r[6] !== 'TOTAL').map((r: any) => ({
                        'Nombre del Asesor': r[6] || r[5],
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
                } else {
                    // Formato antiguo limpio
                    inds = XLSX.utils.sheet_to_json(wsA, { range: 1 }).filter((r: any) => String(r['MAT'] || '') === '2043').map((r: any) => ({
                        'Nombre del Asesor': r['Nombre'],
                        'Sucursal': r['Sucursal'],
                        'Polizas_Pagadas_Año_Anterior': Number(r['Pzs Pag Ant'] || 0),
                        'Polizas_Pagadas_Año_Actual': Number(r['Pzs Pag Act'] || 0),
                        'Prima_Pagada_Año_Anterior': Number(r['Pri Pag Ant'] || 0),
                        'Prima_Pagada_Año_Actual': Number(r['Pri Pag Act'] || 0)
                    }));
                }
            }
            result.comparativo_vida = { individuals: inds, generalSummary: sum };
        }
        res.json(result);
    } catch (e) { res.status(500).json({ error: 'Could not read summary data' }); }
});

// ===================== PERSISTENT DATA STORAGE =====================
// Dual-write system: data is stored in BOTH db/ (in the repo) AND
// ~/.panel_campanas_data/ (outside repo, survives git deploys).
// On read, both locations are merged so data is never lost.

const PERSISTENT_DIR = path.join(os.homedir(), '.panel_campanas_data');
const LOCAL_DB_DIR = path.join(BASE_PATH, 'db');

// Ensure both directories exist
[PERSISTENT_DIR, LOCAL_DB_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

console.log(`[STORAGE] Local DB: ${LOCAL_DB_DIR}`);
console.log(`[STORAGE] Persistent backup: ${PERSISTENT_DIR}`);

// --- Generic helpers for dual-read/write ---
const readJsonFile = (filePath: string): any => {
    try {
        if (fs.existsSync(filePath)) {
            const raw = fs.readFileSync(filePath, 'utf-8').trim();
            if (raw) return JSON.parse(raw);
        }
    } catch (e) { console.error(`[STORAGE] Error reading ${filePath}:`, e); }
    return null;
};

const writeJsonFile = (filePath: string, data: any) => {
    try {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (e) { console.error(`[STORAGE] Error writing ${filePath}:`, e); }
};

// Merge two arrays of activity events by unique id
const mergeActivities = (a: any[], b: any[]): any[] => {
    const map = new Map<string, any>();
    for (const item of [...b, ...a]) { // a takes priority over b
        if (item && item.id) map.set(item.id, item);
    }
    return Array.from(map.values()).sort((x, y) => (y.timestamp || 0) - (x.timestamp || 0));
};

// Merge two comment objects (union of keys, newer takes priority)
const mergeComentarios = (a: Record<string, any>, b: Record<string, any>): Record<string, any> => {
    return { ...b, ...a }; // a takes priority
};

// Dual-read: merge from both locations
const dualReadArray = (filename: string): any[] => {
    const localPath = path.join(LOCAL_DB_DIR, filename);
    const persistPath = path.join(PERSISTENT_DIR, filename);
    const local = readJsonFile(localPath) || [];
    const persist = readJsonFile(persistPath) || [];
    return mergeActivities(Array.isArray(local) ? local : [], Array.isArray(persist) ? persist : []);
};

const dualReadObject = (filename: string): Record<string, any> => {
    const localPath = path.join(LOCAL_DB_DIR, filename);
    const persistPath = path.join(PERSISTENT_DIR, filename);
    const local = readJsonFile(localPath) || {};
    const persist = readJsonFile(persistPath) || {};
    return mergeComentarios(
        typeof persist === 'object' && !Array.isArray(persist) ? persist : {},
        typeof local === 'object' && !Array.isArray(local) ? local : {}
    );
};

// Dual-write: save to both locations
const dualWrite = (filename: string, data: any) => {
    writeJsonFile(path.join(LOCAL_DB_DIR, filename), data);
    writeJsonFile(path.join(PERSISTENT_DIR, filename), data);
};

// ===================== LOG DE ACTIVIDAD =====================
const ACTIVITY_FILE = 'actividad.json';
const SNAPSHOT_PATH = path.join(BASE_PATH, 'db', 'resumen_snapshot.json');

app.post('/api/activity', (req, res) => {
    try {
        const { asesor, accion } = req.body;
        if (!asesor || !accion) return res.status(400).json({ error: 'Faltan datos' });

        const now = new Date();
        const fmtMx = (opts: Intl.DateTimeFormatOptions) =>
            new Intl.DateTimeFormat('es-MX', { ...opts, timeZone: 'America/Mexico_City' }).format(now);
        const mxDay = fmtMx({ day: '2-digit' });
        const mxMonth = fmtMx({ month: '2-digit' });
        const mxYear = fmtMx({ year: 'numeric' });
        const mxHour = fmtMx({ hour: '2-digit', hour12: false });
        const mxMinute = fmtMx({ minute: '2-digit' });
        const mxSecond = fmtMx({ second: '2-digit' });
        const event = {
            id: Date.now().toString(),
            asesor,
            accion,
            fecha: `${mxYear}-${mxMonth}-${mxDay}`,
            hora: `${mxHour.padStart(2, '0')}:${mxMinute.padStart(2, '0')}:${mxSecond.padStart(2, '0')}`,
            timestamp: now.getTime()
        };

        let activities = dualReadArray(ACTIVITY_FILE);
        activities.unshift(event);

        // Keep only the last 5000 events
        if (activities.length > 5000) activities = activities.slice(0, 5000);

        dualWrite(ACTIVITY_FILE, activities);
        res.json({ success: true });
    } catch (e) {
        console.error('Error al guardar actividad:', e);
        res.status(500).json({ error: 'Could not save activity' });
    }
});

app.get('/api/activity', (req, res) => {
    try {
        res.json(dualReadArray(ACTIVITY_FILE));
    } catch (e) {
        console.error('Error al leer actividad:', e);
        res.status(500).json({ error: 'Could not read activity' });
    }
});

app.delete('/api/activity/:id', (req, res) => {
    try {
        const { id } = req.params;
        let activities = dualReadArray(ACTIVITY_FILE);
        const initialLength = activities.length;
        activities = activities.filter((a: any) => a.id !== id);

        if (activities.length < initialLength) {
            dualWrite(ACTIVITY_FILE, activities);
            return res.json({ success: true, message: 'Record deleted successfully' });
        }
        res.status(404).json({ error: 'Record not found' });
    } catch (e) {
        console.error('Error deleting activity:', e);
        res.status(500).json({ error: 'Error modifying activity log' });
    }
});

// ===================== ESTATUS DE PÓLIZAS =====================
const POLIZAS_PATH = path.join(BASE_PATH, 'estatus polizas');

app.get('/api/estatus-polizas/fechas', (req, res) => {
    try {
        const { inactivos } = req.query;
        const reportesPath = path.join(POLIZAS_PATH, 'reportes');
        if (!fs.existsSync(reportesPath)) return res.json([]);
        const fechas: string[] = [];
        fs.readdirSync(reportesPath, { withFileTypes: true }).filter(d => d.isDirectory() && /^\d{4}-\d{2}$/.test(d.name)).forEach(dir => {
            fs.readdirSync(path.join(reportesPath, dir.name)).filter(f => {
                if (!f.startsWith('reporte_') || !f.endsWith('.json') || f.includes('summary')) return false;
                return inactivos === 'true' ? f.includes('_inactivos') : !f.includes('_inactivos');
            }).forEach(f => {
                const m = f.match(/reporte_(\d{4}-\d{2}-\d{2})(?:_inactivos)?\.json/);
                if (m) fechas.push(m[1]);
            });
        });
        res.json([...new Set(fechas)].sort().reverse());
    } catch (e) { res.status(500).json({ error: 'Could not list dates' }); }
});

app.get('/api/estatus-polizas/reporte/:fecha', (req, res) => {
    try {
        const { fecha } = req.params;
        const { summary, inactivos } = req.query;
        const suffix = summary === 'true' ? '_summary.json' : '.json';
        const inactivoStr = inactivos === 'true' ? '_inactivos' : '';
        const p = path.join(POLIZAS_PATH, 'reportes', fecha.substring(0, 7), `reporte_${fecha}${inactivoStr}${suffix}`);

        if (!fs.existsSync(p)) {
            // Fallback to full if summary doesn't exist
            const fullP = path.join(POLIZAS_PATH, 'reportes', fecha.substring(0, 7), `reporte_${fecha}${inactivoStr}.json`);
            if (!fs.existsSync(fullP)) return res.status(404).json({ error: 'Not found' });
            return res.json(JSON.parse(fs.readFileSync(fullP, 'utf-8')));
        }
        res.json(JSON.parse(fs.readFileSync(p, 'utf-8')));
    } catch (e) { res.status(500).json({ error: 'Read error' }); }
});

app.get('/api/estatus-polizas/cambios/:fecha', (req, res) => {
    try {
        const { fecha } = req.params;
        const { inactivos } = req.query;
        const inactivoStr = inactivos === 'true' ? '_inactivos' : '';
        const p = path.join(POLIZAS_PATH, 'cambios', fecha.substring(0, 7), `cambios_${fecha}${inactivoStr}.json`);
        if (!fs.existsSync(p)) return res.json(null);
        res.json(JSON.parse(fs.readFileSync(p, 'utf-8')));
    } catch (e) { res.status(500).json({ error: 'Read error' }); }
});



app.get('/api/estatus-polizas/seguimiento', (req, res) => {
    try {
        const p = path.join(POLIZAS_PATH, 'seguimiento', 'seguimiento_activo.json');
        if (!fs.existsSync(p)) return res.json({ ultima_actualizacion: null, pendientes_recuperar: [], recuperadas_este_mes: [] });
        res.json(JSON.parse(fs.readFileSync(p, 'utf-8')));
    } catch (e) { res.status(500).json({ error: 'Read error' }); }
});

// ===================== COMENTARIOS GPS DE CARTERA =====================
const COMENTARIOS_FILE = 'comentarios_polizas.json';

app.get('/api/estatus-polizas/comentarios', (req, res) => {
    try { res.json(dualReadObject(COMENTARIOS_FILE)); }
    catch (e) { res.status(500).json({ error: 'Read error' }); }
});

app.post('/api/estatus-polizas/comentarios', (req, res) => {
    try {
        const { poliza, comentario, fecha_cambio } = req.body;
        if (!poliza) return res.status(400).json({ error: 'poliza is required' });
        const now = new Date();
        const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('es-MX', { ...o, timeZone: 'America/Mexico_City' }).format(now);
        const fecha = `${fmt({ year: 'numeric' })}-${fmt({ month: '2-digit' })}-${fmt({ day: '2-digit' })}`;
        const comentarios = dualReadObject(COMENTARIOS_FILE);
        if (comentario && comentario.trim()) {
            comentarios[poliza] = { comentario: comentario.trim(), fecha_comentario: fecha, fecha_cambio: fecha_cambio || '' };
        } else {
            delete comentarios[poliza];
        }
        dualWrite(COMENTARIOS_FILE, comentarios);
        res.json({ success: true });
    } catch (e) { console.error('Error saving comentario:', e); res.status(500).json({ error: 'Write error' }); }
});

app.use((req, res) => {
    if (req.path.startsWith('/api')) return res.status(404).json({ error: 'API not found' });
    if (path.extname(req.path)) return res.status(404).send('Not found');
    const p = path.join(DIST_PATH, 'index.html');
    if (fs.existsSync(p)) {
        res.setHeader('Content-Type', 'text/html');
        res.sendFile(p);
    } else res.status(404).send('Frontend not built.');
});

const preloadCampaigns = () => {
    console.log('[CACHE WARMER] Inicializando precarga de campañas en segundo plano para máxima velocidad...');
    getCachedAdvisors(); // Precarga instántanea de asesores en memoria

    const campaigns = ['mdrt', 'camino_cumbre', 'convenciones', 'graduacion', 'legion_centurion'];
    let idx = 0;

    const loadNext = () => {
        if (idx >= campaigns.length) {
            console.log('[CACHE WARMER] 🚀 Todas las campañas han sido precargadas exitosamente. El panel será ultra rápido.');
            return;
        }
        const c = campaigns[idx];
        try {
            const wb = readExcelData(c, { skipJson: true });
            if (wb && wb.Sheets) {
                if (c === 'convenciones') {
                    const ws = wb.Sheets[wb.SheetNames[0]];
                    if (!ws._cachedData) ws._cachedData = XLSX.utils.sheet_to_json(ws, { header: 1, range: 'A20:AI5000' });
                } else if (c === 'camino_cumbre') {
                    const ws = wb.Sheets[wb.SheetNames[0]];
                    if (!ws._cachedData) ws._cachedData = XLSX.utils.sheet_to_json(ws, { header: 1, range: 3 });
                } else if (c === 'graduacion') {
                    const ws = wb.Sheets[wb.SheetNames[0]];
                    if (!ws._cachedJson) ws._cachedJson = XLSX.utils.sheet_to_json(ws, { range: 2 });
                } else if (c === 'mdrt') {
                    const ws = wb.Sheets[wb.SheetNames.find((n: string) => n.toUpperCase() === 'MDRT') || wb.SheetNames[0]];
                    if (ws && !ws._cachedJson) ws._cachedJson = XLSX.utils.sheet_to_json(ws, { range: 3 });
                } else if (c === 'legion_centurion') {
                    const ws = wb.Sheets[wb.SheetNames[0]];
                    if (!ws._cachedJson) ws._cachedJson = XLSX.utils.sheet_to_json(ws, { range: 'A11:Z10000' });
                }
            }
        } catch (e) {
            console.error(`[CACHE WARMER] Error al precargar ${c}:`, e);
        }
        idx++;
        setTimeout(loadNext, 1000); // Wait 1 second before doing the next one
    };

    setTimeout(loadNext, 2000); // Start preloading 2 seconds after boot
};


app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
    // preloadCampaigns(); // Disabled temporarily to prevent 7MB file deadlock on boot
});
