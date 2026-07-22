// Version: 1.3.9_the_fortress
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import os from 'os';
import XLSX from 'xlsx';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Detect if we are running in the Hostinger remote environment
const isHostinger = __dirname.includes('domains/panel.ambrizydavalos.com');
const isProd = __dirname.includes('/dist/server');

// Reliable BASE_PATH detection
// In dev mode, __dirname is 'server/' so we go up one level to project root
// In prod (dist/server), we go up 3 levels to project root
let BASE_PATH = __dirname;
if (isProd) {
    BASE_PATH = path.join(__dirname, '../../..');
} else if (!isHostinger) {
    // Dev mode: server/ → project root
    BASE_PATH = path.join(__dirname, '..');
}

const app = express();
const PORT = Number(process.env.PORT) || 5005;

// Load .env from parent dir if it doesn't exist locally
const localEnv = path.join(BASE_PATH, '.env');
const safeExists = (p: string) => {
    try {
        return Boolean(p && fs.existsSync(p));
    } catch {
        return false;
    }
};

const hostingerEnv = path.join(BASE_PATH, '../.env');
if (safeExists(localEnv)) {
    dotenv.config({ path: localEnv });
} else if (safeExists(hostingerEnv)) {
    dotenv.config({ path: hostingerEnv });
}

// Helper to reliably find protected folders in Distributed Architecture
const SUCURSALES_PROMO = ['2043', '2856', '2511'];

const getProtectedPath = (folder: string) => {
    const f = folder === 'proactiva_tech' ? 'proactivatech' : folder;
    const cwd = process.cwd();
    const candidates = [
        path.join(BASE_PATH, f),
        path.join(cwd, f),
        path.join(__dirname, f),
        path.join(__dirname, 'dist', f)
    ];
    const found = candidates.find(p => safeExists(p));
    if (found) return found;
    return path.join(BASE_PATH, f);
};

const DB_PATH_DYNAMIC = getProtectedPath('db');
const ASSETS_PATH = path.join(BASE_PATH, 'assets');
const THEMES_PATH = path.join(BASE_PATH, 'themes');
const ADMIN_PATH = getProtectedPath('administrador');

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
    const cwd = process.cwd();
    const candidateFiles = [
        path.join(ADMIN_PATH, 'directorio_asesores.xlsx'),
        path.join(BASE_PATH, 'administrador', 'directorio_asesores.xlsx'),
        path.join(cwd, 'administrador', 'directorio_asesores.xlsx'),
        path.join(__dirname, 'administrador', 'directorio_asesores.xlsx')
    ];
    const filePath = candidateFiles.find(p => safeExists(p)) || path.join(ADMIN_PATH, 'directorio_asesores.xlsx');
    if (!safeExists(filePath)) return {};

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
                const cleanName = String(row[nombreKey]).replace(/Ð/g, 'Ñ').replace(/ð/g, 'ñ').trim();
                directory[String(row[claveKey])] = cleanName;
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

// Serve Frontend Build & Assets
const possibleDistPaths = [
    path.join(__dirname, 'dist'),
    path.join(__dirname, '../dist'),
    path.join(__dirname, 'public_html', 'dist'),
    path.join(BASE_PATH, 'dist'),
    path.join(BASE_PATH, 'public_html', 'dist')
];
const DIST_PATH = possibleDistPaths.find(p => safeExists(path.join(p, 'index.html'))) || path.join(BASE_PATH, 'dist');

app.use('/assets', (req, res, next) => {
    const filename = req.path.replace(/^\//, '');
    const cwd = process.cwd();
    const candidates = [
        path.join(DIST_PATH, 'assets', filename),
        path.join(DIST_PATH, filename),
        path.join(__dirname, 'dist', 'assets', filename),
        path.join(__dirname, 'assets', filename),
        path.join(BASE_PATH, 'dist', 'assets', filename),
        path.join(BASE_PATH, 'assets', filename),
        path.join(cwd, 'dist', 'assets', filename),
        path.join(cwd, 'assets', filename),
        path.join('/home/u211138134/domains/panel.ambrizydavalos.com/public_html/dist/assets', filename),
        path.join('/home/u211138134/domains/panel.ambrizydavalos.com/public_html/assets', filename)
    ];
    const found = candidates.find(p => safeExists(p));
    if (found) {
        setMimeHeaders(res, found);
        return res.sendFile(found);
    }
    next();
});
app.use(express.static(DIST_PATH, { setHeaders: setMimeHeaders }));




const extractData = (ws: any) => {
    const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 });
    let headerIdx = -1;
    for (let i = 0; i < Math.min(25, rawData.length); i++) {
        if (rawData[i] && (rawData[i] as any[]).some(cell => {
            if (!cell) return false;
            const c = String(cell).toLowerCase().trim();
            return c === 'asesor' || c === 'mat' || c === 'mat / unidad' || c === 'nombre del asesor';
        })) {
            headerIdx = i;
            break;
        }
    }
    if (headerIdx === -1) headerIdx = 0;
    return XLSX.utils.sheet_to_json(ws, { range: headerIdx });
};

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
            let sheetNames = ['MDRT', 'Detalle', 'Calculadora'];
            let sheetsToScan = sheetNames.filter((n: string) => wb.SheetNames.includes(n)).map((n: string) => wb.Sheets[n]);
            if (sheetsToScan.length === 0) sheetsToScan = wb.SheetNames.slice(0, 3).map((n: string) => wb.Sheets[n]);
            
            for (let sheet of sheetsToScan) {
                const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
                for (let i = 0; i < Math.min(25, rawRows.length); i++) {
                    for (let j = 0; j < Math.min(10, rawRows[i].length); j++) {
                        const text = String(rawRows[i][j]).trim();
                        const match = text.match(/avance al (\d{1,2}) de (\w+) de (\d{4})/i) ||
                                      text.match(/avance.*\b(\d{1,2})\s*de\s*([a-zA-Z]+)\s*(?:de\s*)?(\d{4})/i) ||
                                      text.match(/(\d{1,2})\s*de\s*([a-zA-Z]+)\s*(?:de\s*)?(\d{4})/i);
                        if (match && !text.match(/igc|limra/i)) {
                            return parseSpanishDate(match[0]);
                        }
                    }
                }
            }
            return '';
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
        if (type === 'fanfest' || type === 'vive_tu_pasion' || type === 'proactiva_tech') {
            const ws = wb.Sheets[wb.SheetNames[0]];
            const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
            for (let i = 0; i < 15; i++) {
                if (!data[i]) continue;
                const rowStr = data[i].join(' ').replace('20256', '2026').replace('2025', '2026');
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
    const cwd = process.cwd();
    const candidateFolders = [
        getProtectedPath(folderName),
        path.join(BASE_PATH, folderName),
        path.join(cwd, folderName),
        path.join(__dirname, folderName),
        path.join(__dirname, 'dist', folderName)
    ];
    const folderPath = candidateFolders.find(p => safeExists(p) && (() => { try { return fs.readdirSync(p).some(f => (f.endsWith('.xlsx') || f.endsWith('.xlsm') || f.endsWith('.xls')) && !f.startsWith('~$')); } catch { return false; } })());
    if (!folderPath) return null;

    try {
        let fileName = '';
        if (options.date && historyCache[folderName] && historyCache[folderName][options.date]) {
            fileName = historyCache[folderName][options.date];
        } else {
            // Default: get latest file (by mtime)
            const files = fs.readdirSync(folderPath).filter(f => (f.endsWith('.xlsx') || f.endsWith('.xlsm') || f.endsWith('.xls')) && !f.startsWith('~$'));
            if (files.length === 0) return null;
            fileName = files.sort((a, b) => {
                try { return fs.statSync(path.join(folderPath, b)).mtimeMs - fs.statSync(path.join(folderPath, a)).mtimeMs; }
                catch { return 0; }
            })[0];
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

app.get('/api/bases_campanas', (req, res) => {
    const publicPath = path.join(BASE_PATH, 'public', 'bases_campanas');
    const distPath = path.join(BASE_PATH, 'dist', 'bases_campanas');
    const prodPath = path.join(BASE_PATH, 'bases_campanas');
    
    let targetPath = fs.existsSync(prodPath) ? prodPath : fs.existsSync(publicPath) ? publicPath : fs.existsSync(distPath) ? distPath : null;

    if (!targetPath) {
        return res.json([]);
    }

    const scanDirectory = (dir: string, route: string) => {
        const items: any[] = [];
        try {
            const dirents = fs.readdirSync(dir, { withFileTypes: true });
            for (const dirent of dirents) {
                if (dirent.name.startsWith('.')) continue; // ignore hidden
                
                const fullPath = path.join(dir, dirent.name);
                const fileRoute = `${route}/${dirent.name}`;
                
                if (dirent.isDirectory()) {
                    const children = scanDirectory(fullPath, fileRoute);
                    if (children.length > 0) {
                        items.push({
                            type: 'directory',
                            name: dirent.name,
                            path: fileRoute,
                            children: children
                        });
                    }
                } else if (dirent.name.toLowerCase().endsWith('.pdf') || dirent.name.toLowerCase().endsWith('.png') || dirent.name.toLowerCase().endsWith('.jpg') || dirent.name.toLowerCase().endsWith('.jpeg')) {
                    items.push({
                        type: 'file',
                        name: dirent.name,
                        path: fileRoute
                    });
                }
            }
        } catch (e) {
            console.error("Error scanning dir:", e);
        }
        return items;
    };

    const tree = scanDirectory(targetPath, '/bases_campanas');
    res.json(tree);
});

app.get('/api/campaigns', (req, res) => {
    const exclude = ['assets', 'themes', 'server', 'node_modules', 'src', 'public', '.git', 'dist', '.conda', 'administrador', 'tmp', '.cache', '.npm', 'estatus polizas', 'estatus_polizas'];
    try {
        const publicFolders = fs.readdirSync(BASE_PATH, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory() && !exclude.includes(dirent.name) && !dirent.name.startsWith('.'))
            .map(dirent => dirent.name);

        const protectedPath = getProtectedPath('.');
        let protectedFolders: string[] = [];
        if (fs.existsSync(protectedPath)) {
            protectedFolders = fs.readdirSync(protectedPath, { withFileTypes: true })
                .filter(dirent => dirent.isDirectory() && !exclude.includes(dirent.name) && !dirent.name.startsWith('.') && dirent.name !== 'public_html' && dirent.name !== 'nodejs' && dirent.name !== 'db')
                .map(dirent => dirent.name);
        }

        const allFolders = Array.from(new Set([...publicFolders, ...protectedFolders]));
        res.json(allFolders.sort());
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

const findSnapshotPath = () => {
    const cwd = process.cwd();
    const candidates = [
        SNAPSHOT_PATH,
        path.join(BASE_PATH, 'db', 'resumen_snapshot.json'),
        path.join(cwd, 'db', 'resumen_snapshot.json'),
        path.join(__dirname, 'db', 'resumen_snapshot.json')
    ];
    return candidates.find(p => safeExists(p)) || SNAPSHOT_PATH;
};

app.get('/api/campaign/:name/data/:advisor', (req, res) => {
    const { name, advisor } = req.params;
    const { date } = req.query;

    // ========== SNAPSHOT-FIRST STRATEGY ==========
    // If no historical date was requested, try to serve from the pre-computed snapshot.
    // The snapshot is a tiny JSON file (~100KB) that already has all campaign data
    // filtered for our promotoria. This avoids opening massive Excel files (10-30MB each).
    const snapPath = findSnapshotPath();
    if (!date && safeExists(snapPath)) {
        try {
            const snapshotData = JSON.parse(fs.readFileSync(snapPath, 'utf-8'));
            const campaigns = snapshotData.campaigns || snapshotData.data?.campaigns;
            const campaignDates = snapshotData.campaignDates || snapshotData.data?.campaignDates || {};

            if (campaigns && campaigns[name] && campaigns[name].length > 0) {
                const campData: any[] = campaigns[name];
                const dir = getAdvisorDirectory();
                const advisorKeys = Object.keys(dir).filter(key => dir[key] === advisor);

                // Find the advisor's row in the snapshot data
                const row = campData.find((r: any) =>
                    String(r.Asesor || '') === advisor ||
                    advisorKeys.includes(String(r.Clave || '')) ||
                    String(r.Clave || '') === advisor
                );

                if (row) {
                    const fechaCorte = campaignDates[name] || '';

                    if (name === 'legion_centurion') {
                        const mIndex = Number(row.Mes_Actual || 1);
                        const totalPol = Number(row.Total_Polizas || 0);
                        return res.json({
                            Asesor: row.Asesor, Clave: row.Clave, Fecha_Corte: fechaCorte,
                            Mes_Actual: mIndex, Total_Polizas: totalPol,
                            Bronce: Math.max(0, (4 * mIndex) - totalPol),
                            Plata: Math.max(0, (6 * mIndex) - totalPol),
                            Oro: Math.max(0, (7.5 * mIndex) - totalPol),
                            Platino: Math.max(0, (10 * mIndex) - totalPol),
                            Promedio_Mensual: totalPol / mIndex,
                            Va_En_Meta: row.EnMeta ? "✅ EN META" : "❌ POR DEBAJO"
                        });
                    }

                    if (name === 'convenciones') {
                        const credits = Number(row.PA_Total || 0);
                        const pols = Number(row.Polizas || 0);
                        return res.json({
                            Asesor: row.Asesor, Clave: row.Clave, Fecha_Corte: fechaCorte,
                            Comision_Vida: Number(row.Comision_Vida || 0), RDA: Number(row.RDA || 0),
                            PA_Total: credits, Polizas: pols, Lugar: Number(row.Lugar || 9999),
                            Lugar_480: Number(row.Lugar_480 || 0), Lugar_228: Number(row.Lugar_228 || 0),
                            Lugar_108: Number(row.Lugar_108 || 0), Lugar_28: Number(row.Lugar_28 || 0),
                            Califica: pols >= 30 && credits >= 588500,
                            Cumple_Polizas: pols >= 30, Cumple_Creditos: credits >= 588500
                        });
                    }

                    if (name === 'camino_cumbre') {
                        return res.json({
                            Asesor: row.Asesor, Clave: row.Clave, Fecha_Corte: fechaCorte,
                            Mes_Asesor: Number(row.Mes_Asesor || 1),
                            Trimestre: Math.ceil(Number(row.Mes_Asesor || 1) / 3),
                            Polizas_Totales: Number(row.Polizas_Totales || 0),
                            Mes_1_Prod: Number(row.Mes_1_Prod || 0),
                            Mes_2_Prod: Number(row.Mes_2_Prod || 0),
                            Mes_3_Prod: Number(row.Mes_3_Prod || 0)
                        });
                    }

                    if (name === 'graduacion') {
                        return res.json({
                            Asesor: row.Asesor, Clave: row.Clave, Fecha_Corte: fechaCorte,
                            Mes_Asesor: Number(row.Mes_Asesor || 0),
                            Polizas_Totales: Number(row.Polizas_Totales || 0),
                            Comisones: Number(row.Comisones || 0),
                            Fecha_Limite_Meta: row.Fecha_Limite_Meta || "No disponible"
                        });
                    }

                    if (name === 'proactiva_tech') {
                        return res.json({
                            Asesor: row.Asesor, Clave: row.Clave, Fecha_Corte: fechaCorte,
                            Polizas: Number(row.Polizas || 0),
                            Comisiones: Number(row.Comisiones || 0),
                            Ranking: Number(row.Ranking || 99999)
                        });
                    }

                    if (name === 'mdrt') {
                        const pa = Number(row.PA_Acumulada || 0);
                        let currentMonthNum = 1;
                        if (fechaCorte) {
                            const mMatch = String(fechaCorte).toLowerCase().match(/(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/);
                            if (mMatch) currentMonthNum = MONTHS_ES.indexOf(mMatch[1]) + 1;
                        }
                        return res.json({
                            Asesor: row.Asesor, Clave: row.Clave, Fecha_Corte: fechaCorte,
                            Mes_Actual: currentMonthNum, PA_Acumulada: pa
                        });
                    }

                    // Generic: return raw snapshot row + date
                    return res.json({ ...row, Fecha_Corte: fechaCorte });
                }
                // Advisor not found in snapshot data
                return res.status(404).json({ error: 'Advisor not found' });
            }
        } catch (e) {
            console.warn('[SNAPSHOT] Error reading snapshot, falling back to Excel:', (e as Error).message);
        }
    }

    // ========== EXCEL FALLBACK (historical dates or no snapshot) ==========
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
        const row = json.find(r => {
            const matVal = r['MATRIZ'] || r['Matriz'] || r['matriz'] || '';
            const advisorVal = r['ASESOR'] || r['Asesor'] || r['asesor'] || '';
            return SUCURSALES_PROMO.includes(String(matVal)) && 
                   (String(advisorVal) === advisor || advisorKeys.includes(String(advisorVal)));
        });
        if (!row) return res.status(404).json({ error: 'Advisor not found' });
        const totalPol = Number(row['TOTAL_POLIZAS'] || row['Total Pólizas'] || row['Total_Polizas'] || 0);
        const clave = String(row['ASESOR'] || row['Asesor'] || row['asesor'] || '');
        const cumpleVal = row['CUMPLE'] || row['Cumple Meta Proporc.'] || row['Cumple'] || '';
        return res.json({
            'Asesor': dir[clave] || clave, 'Clave': clave, 'Fecha_Corte': getLegionDate(ws) || "",
            'Mes_Actual': mIndex, 'Total_Polizas': totalPol, 'Bronce': Math.max(0, (4 * mIndex) - totalPol),
            'Plata': Math.max(0, (6 * mIndex) - totalPol), 'Oro': Math.max(0, (7.5 * mIndex) - totalPol),
            'Platino': Math.max(0, (10 * mIndex) - totalPol), 'Promedio_Mensual': totalPol / mIndex,
            'Va_En_Meta': String(cumpleVal).toLowerCase() === 'p' ? "✅ EN META" : "❌ POR DEBAJO"
        });
    }

    if (name === 'convenciones') {
        const wb = readExcelData(name, { skipJson: true, date: date as string });
        if (!wb) return res.status(404).json({ error: 'Raw file not found' });
        const sheetName = wb.SheetNames.find((n: string) => n.toUpperCase() === 'TODOS LOS RAMOS') || wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        if (!ws._cachedData) ws._cachedData = XLSX.utils.sheet_to_json(ws, { header: 1, range: 'A20:AL15000' });
        const data: any[][] = ws._cachedData;
        const dir = getAdvisorDirectory();
        const advisorIds = Object.keys(dir).filter(id => dir[id] === advisor);
        const row = data.find(r => SUCURSALES_PROMO.includes(String(r[4] || '')) && (String(r[7] || '') === advisor || advisorIds.includes(String(r[7] || ''))));
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
        if (!ws._cachedData) {
            const rawData: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
            let headerIdx = -1;
            for (let i = 0; i < Math.min(30, rawData.length); i++) {
                if (rawData[i] && rawData[i].some(c => String(c).toLowerCase().trim() === 'asesor')) {
                    headerIdx = i; break;
                }
            }
            if (headerIdx === -1) headerIdx = 0;
            ws._cachedData = XLSX.utils.sheet_to_json(ws, { range: headerIdx, defval: '' });
        }
        const data = ws._cachedData;
        const dir = getAdvisorDirectory();
        const advisorIds = Object.keys(dir).filter(id => dir[id] === advisor);
        const row: any = data.find((r: any) => SUCURSALES_PROMO.includes(String(r['Mat'] || r['Matriz'] || '')) && (String(r['Asesor'] || '') === advisor || advisorIds.includes(String(r['Asesor'] || ''))));
        if (!row) return res.status(404).json({ error: 'Advisor not found' });
        return res.json({
            'Asesor': advisor, 'Clave': row['Asesor'] || '', 'Fecha_Corte': extractCutoffDate(wb, 'camino_cumbre') || "",
            'Mes_Asesor': Number(row['Mes'] || 1), 'Trimestre': Math.ceil(Number(row['Mes'] || 1) / 3), 'Polizas_Totales': Number(row['Total'] || row['Polizas_Totales'] || 0),
            'Mes_1_Prod': Number(row['Mes 1'] || 0), 'Mes_2_Prod': Number(row['Mes 2'] || 0), 'Mes_3_Prod': Number(row['Mes 3'] || 0)
        });
    }

    if (name === 'graduacion') {
        const wb = readExcelData(name, { skipJson: true, date: date as string });
        if (!wb) return res.status(404).json({ error: 'Raw file not found' });
        let wsName = wb.SheetNames.find((n: string) => n.toLowerCase().includes('desarrollo (2)') || n.toLowerCase().includes('detalle') || n.toLowerCase().includes('asesores'));
        if (!wsName) wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        if (!ws._cachedData) {
            const rawData: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
            let headerIdx = -1;
            for (let i = 0; i < Math.min(30, rawData.length); i++) {
                if (rawData[i] && rawData[i].some(c => String(c).toLowerCase().trim() === 'asesor' || String(c).toLowerCase().trim() === 'clave')) {
                    headerIdx = i; break;
                }
            }
            if (headerIdx === -1) headerIdx = 0;
            ws._cachedData = XLSX.utils.sheet_to_json(ws, { range: headerIdx, defval: '' });
        }
        const data = ws._cachedData;
        const dir = getAdvisorDirectory();
        const advisorKeys = Object.keys(dir).filter(key => dir[key] === advisor);
        const row: any = data.find((r: any) => SUCURSALES_PROMO.includes(String(r['Matriz'] || r['Mat'] || r['Sucursal'] || r['Suc'] || '')) && (String(r['Asesor'] || r['NOMBRE'] || '') === advisor || advisorKeys.includes(String(r['Asesor'] || r['NOMBRE'] || '')) || String(r['Clave'] || r['ASESOR'] || '') === advisor || advisorKeys.includes(String(r['Clave'] || r['ASESOR'] || ''))));
        if (!row) return res.status(404).json({ error: 'Advisor not found' });
        const limitKey = Object.keys(row).find(k => k.includes('MITE P/') || k.toLowerCase().includes('limite'));
        const fechaLimite = limitKey ? row[limitKey] : "";
        const paKey = Object.keys(row).find(k => k.toLowerCase().includes('total') || k.toLowerCase().includes('vigor'));
        return res.json({
            'Asesor': advisor, 'Clave': row['Clave'] || row['Asesor'] || row['ASESOR'] || '', 'Fecha_Corte': extractCutoffDate(wb, 'graduacion') || parseSpanishDate(extractCutoffDate(wb, 'graduacion')) || "",
            'Mes_Asesor': row['mes'] || row['MES'] || 0, 'Polizas_Totales': row[paKey as string] || row['EN VIGOR'] || 0, 'Comisones': row['Convenciones y Recon.'] || row['TOTAL2'] || 0,
            'Fecha_Limite_Meta': formatExcelDate(fechaLimite) || "No disponible"
        });
    }

    if (name === 'fanfest') {
        const wb = readExcelData(name, { skipJson: true, date: date as string });
        if (!wb) return res.status(404).json({ error: 'Raw file not found' });
        const sheetName = wb.SheetNames.find((n: string) => n.toUpperCase() === 'ASESORES') || wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, range: 7 });
        const dir = getAdvisorDirectory();
        const advisorIds = Object.keys(dir).filter(id => dir[id] === advisor);
        const row = data.find(r => SUCURSALES_PROMO.includes(String(r[4] || '')) && (String(r[6] || '') === advisor || advisorIds.includes(String(r[6] || ''))));
        if (!row) return res.status(404).json({ error: 'Advisor not found' });
        return res.json({
            'Asesor': advisor, 'Clave': row[6] || '', 'Fecha_Corte': extractCutoffDate(wb, 'fanfest'),
            'Enero': Number(row[8] || 0), 'Febrero': Number(row[9] || 0),
            'Marzo': Number(row[10] || 0), 'Abril': Number(row[11] || 0),
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
        const row = data.find(r => SUCURSALES_PROMO.includes(String(r[4] || '')) && (String(r[6] || '') === advisor || advisorIds.includes(String(r[6] || ''))));
        if (!row) return res.status(404).json({ error: 'Advisor not found' });
        return res.json({
            'Asesor': advisor, 'Clave': row[6] || '', 'Fecha_Corte': extractCutoffDate(wb, 'vive_tu_pasion'),
            'Polizas': Number(row[8] || 0), 'Comisiones': Number(row[9] || 0),
            'Premio_Actual': row[10] || "Ninguno aún"
        });
    }

    if (name === 'mdrt') {
        const wb = readExcelData(name, { skipJson: true, date: date as string });
        if (!wb) return res.status(404).json({ error: 'Raw file not found' });
        const ws = wb.Sheets[wb.SheetNames.find((n: string) => n.toUpperCase() === 'MDRT') || wb.SheetNames[0]];
        if (!ws._cachedJson) ws._cachedJson = extractData(ws);
        const json: any[] = ws._cachedJson;
        const dir = getAdvisorDirectory();
        const advisorKeys = Object.keys(dir).filter(key => dir[key] === advisor);
        const row = json.find(r => SUCURSALES_PROMO.includes(String(r['Mat'] || r['Matriz'] || '')) && (String(r['Nombre del Asesor'] || '') === advisor || advisorKeys.includes(String(r['Nombre del Asesor'] || '')) || String(r['Asesor'] || '') === advisor || advisorKeys.includes(String(r['Asesor'] || ''))));
        if (!row) return res.status(404).json({ error: 'Advisor not found' });
        const paKey = Object.keys(row).find(k => (k || '').trim().toLowerCase() === 'total prima');
        const pa = paKey ? Number(row[paKey] || 0) : 0;
        const cutoffDate = extractCutoffDate(wb, 'mdrt');
        let currentMonthNum = 1;
        if (cutoffDate) {
            const parts = cutoffDate.split('-');
            if (parts.length === 3) currentMonthNum = parseInt(parts[1], 10);
        }
        return res.json({
            'Asesor': advisor, 'Clave': row['Asesor'] || '', 'Fecha_Corte': extractCutoffDate(wb, 'mdrt') || parseSpanishDate(extractCutoffDate(wb, 'mdrt')) || "",
            'Mes_Actual': currentMonthNum, 'PA_Acumulada': pa
        });
    }

    if (name === 'reto_por_ciento') {
        const wb = readExcelData(name, { skipJson: true, date: date as string });
        if (!wb) return res.status(404).json({ error: 'Raw file not found' });
        const sheetName = wb.SheetNames.find((n: string) => n.toUpperCase() === 'ASESORES') || wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const raw: any[] = XLSX.utils.sheet_to_json(ws, { range: 7 });
        const dir = getAdvisorDirectory();
        const advisorKeys = Object.keys(dir).filter(key => dir[key] === advisor);
        const row = raw.find((r: any) => {
            const matKey = Object.keys(r).find(k => k && (k.trim().toUpperCase() === 'MATRIZ' || k.trim().toUpperCase() === 'PROM_MAT'));
            const sucKey = Object.keys(r).find(k => k && (k.trim().toUpperCase() === 'SUCURSAL' || k.trim().toUpperCase() === 'PROM_SUC'));
            const matchesPromo = SUCURSALES_PROMO.includes(String(matKey ? r[matKey] : '')) || SUCURSALES_PROMO.includes(String(sucKey ? r[sucKey] : ''));
            const claveKey = Object.keys(r).find(k => k && (k.trim().toUpperCase() === 'ASESOR' || k.trim().toUpperCase() === 'NUM_AGENTE'));
            const clave = String(claveKey ? r[claveKey] : '');
            return matchesPromo && (clave === advisor || advisorKeys.includes(clave));
        });
        if (!row) return res.status(404).json({ error: 'Advisor not found' });
        const claveKey = Object.keys(row).find(k => k && (k.trim().toUpperCase() === 'ASESOR' || k.trim().toUpperCase() === 'NUM_AGENTE'));
        const conexionKey = Object.keys(row).find(k => k && (k.trim().toUpperCase() === 'CONEXIÓN' || k.trim().toUpperCase() === 'CONEXION'));
        const conteoKey = Object.keys(row).find(k => k && k.trim().toUpperCase() === 'CONTEO');
        const cumpleKey = Object.keys(row).find(k => k && (k.trim().toUpperCase() === 'CUMPLIMIENTO' || k.trim().toUpperCase() === 'CUMPLE'));
        const sumaKey = Object.keys(row).find(k => k && (k.trim().toUpperCase() === 'SUMA COMISIÓN' || k.trim().toUpperCase() === 'SUMA'));
        const pctKey = Object.keys(row).find(k => k && (k.trim().toUpperCase() === 'PORCENTAJE' || k.trim().toUpperCase() === 'PORCENTAJES'));
        const extraKey = Object.keys(row).find(k => k && (k.trim().toUpperCase() === 'EXTRACOMISION' || k.trim().toUpperCase() === 'EXTRA COMISION'));
        return res.json({
            'Asesor': advisor,
            'Clave': String(claveKey ? row[claveKey] : ''),
            'Conexion': formatExcelDate(conexionKey ? row[conexionKey] : null),
            'Conteo': Number(conteoKey ? row[conteoKey] : 0),
            'Cumplimiento': String(cumpleKey ? row[cumpleKey] : '').toUpperCase() === 'P',
            'Suma_Comision': Number(sumaKey ? row[sumaKey] : 0),
            'Porcentaje': Number(pctKey ? row[pctKey] : 0),
            'Extracomision': Number(extraKey ? row[extraKey] : 0),
            'Fecha_Corte': extractCutoffDate(wb, 'reto_por_ciento') || '15 de julio de 2026'
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

        // Performance optimization: always use snapshot when no historical date is set
        if (!date && fs.existsSync(SNAPSHOT_PATH)) {
            const snapshotData = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf-8'));
            const data = snapshotData.data || snapshotData;
            if (data && data.campaigns && (data.campaigns.mdrt || data.campaigns.camino_cumbre || data.campaigns.graduacion)) {
                // Return campaigns + dates in flat structure compatible with frontend
                return res.json({ ...data.campaigns, dates: data.campaignDates || {} });
            }
        }

        const result: Record<string, any> = { dates: {} };
        const dir = getAdvisorDirectory();
        const resolveName = (cl: any) => {
            const name = dir[String(cl)] || `Asesor ${cl}`;
            return name.replace(/Ð/g, 'Ñ').replace(/ð/g, 'ñ');
        };

        const cams = ['mdrt', 'camino_cumbre', 'convenciones', 'graduacion', 'legion_centurion', 'fanfest', 'vive_tu_pasion', 'proactiva_tech', 'reto_por_ciento'];
        cams.forEach(c => {
            try {
                const wb = readExcelData(c, { skipJson: true, date: date as string });
                if (wb) {
                    if (c === 'mdrt') {
                        const ws = wb.Sheets[wb.SheetNames.find((n: string) => n.toUpperCase() === 'MDRT') || wb.SheetNames[0]];
                        const data: any[] = extractData(ws);
                        result.mdrt = data.filter(r => SUCURSALES_PROMO.includes(String(r.Matriz || r['Mat'] || ''))).map(r => {
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
                        result.camino_cumbre = data.slice(1).filter(r => SUCURSALES_PROMO.includes(String(r[3] || ''))).map(r => ({ Asesor: resolveName(r[5]), Clave: r[5] || '', Mes_Asesor: Number(r[12] || r[10] || 1), Polizas_Totales: Number(r[16] || r[14] || 0), Mes_1_Prod: Number(r[24] || r[21] || 0), Mes_2_Prod: Number(r[25] || r[22] || 0), Mes_3_Prod: Number(r[26] || r[23] || 0) }));
                    } else if (c === 'convenciones') {
                        const ws = wb.Sheets[wb.SheetNames[0]];
                        const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, range: 'A20:AL15000' });
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
                        result.convenciones = allRows.filter(r => SUCURSALES_PROMO.includes(String(r[4] || ''))).map(r => ({
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
                        result.graduacion = data.slice(1).filter(r => SUCURSALES_PROMO.includes(String(r[3] || ''))).map(r => ({ Asesor: r[7] ? String(r[7]) : resolveName(r[6]), Clave: r[6] || '', Mes_Asesor: Number(r[8] || 1), Polizas_Totales: Number(r[16] || 0) }));
                    } else if (c === 'legion_centurion') {
                        const ws = wb.Sheets[wb.SheetNames[0]];
                        const data: any[] = XLSX.utils.sheet_to_json(ws, { header: 1, range: 11 });
                        const b9 = ws['B9']?.v || "";
                        const mMatch = String(b9).toLowerCase().match(/(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/);
                        const mIndex = mMatch ? MONTHS_ES.indexOf(mMatch[1]) + 1 : 1;
                        result.legion_centurion = data.slice(1).filter(r => SUCURSALES_PROMO.includes(String(r[4] || ''))).map(r => ({
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
                        result.fanfest = data.slice(2).filter(r => SUCURSALES_PROMO.includes(String(r[4] || ''))).map(r => ({
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
                        result.vive_tu_pasion = data.slice(2).filter(r => SUCURSALES_PROMO.includes(String(r[4] || ''))).map(r => ({
                            Asesor: resolveName(r[6]),
                            Clave: r[6] || '',
                            Polizas: Number(r[8] || 0),
                            Comisiones: Number(r[9] || 0),
                            Premio: r[10] || ""
                        }));
                    } else if (c === 'proactiva_tech') {
                        const selector = (n: string) => n.toLowerCase().includes('asesores');
                        const sheetName = wb.SheetNames.find(selector) || wb.SheetNames[0];
                        const ws = wb.Sheets[sheetName];
                        const data: any[] = XLSX.utils.sheet_to_json(ws, { range: 6 });
                        const advisorsData = data.slice(1);
                        
                        const getExcelYear = (val: any) => {
                            if (!val) return 0;
                            const num = Number(val);
                            if (!isNaN(num)) {
                                const date = new Date(Math.round((num - 25569) * 86400 * 1000));
                                return date.getUTCFullYear();
                            }
                            const str = String(val).trim();
                            const match = str.match(/\b(20\d{2})\b/);
                            return match ? parseInt(match[1], 10) : 0;
                        };

                        result.proactiva_tech = advisorsData.filter(r => {
                            const matVal = String(r.MATRIZ || r.Matriz || '').trim();
                            if (!SUCURSALES_PROMO.includes(matVal)) return false;
                            const conVal = r['CONEXIÓN'] || r['Conexión'] || r['CONEXION'] || r['conexion'];
                            const year = getExcelYear(conVal);
                            return year >= 2023;
                        }).map(r => ({
                            Asesor: resolveName(r.ASESOR || r.Asesor || ''),
                            Clave: String(r.ASESOR || r.Asesor || ''),
                            Polizas: Number(r['PÓLIZAS'] || r['Pólizas'] || r['Polizas'] || 0),
                            Comisiones: Number(r.COMISIONES || r.Comisiones || r.comisiones || 0),
                            Ranking: Number(r.RANKING || r.Ranking || r.ranking || 99999)
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
        const resolveName = (cl: any) => {
            const name = dir[String(cl)] || `Asesor ${cl}`;
            return name.replace(/Ð/g, 'Ñ').replace(/ð/g, 'ñ');
        };
        const result: Record<string, any> = { dates: {} };
        const cams = ['mdrt', 'camino_cumbre', 'convenciones', 'graduacion', 'legion_centurion', 'fanfest', 'vive_tu_pasion', 'proactiva_tech', 'reto_por_ciento'];

        for (const c of cams) {
            const wb = readExcelData(c, { skipJson: true });
            if (wb) {
                if (c === 'mdrt') {
                    const ws = wb.Sheets[wb.SheetNames.find((n: string) => n.toUpperCase() === 'MDRT') || wb.SheetNames[0]];
                    const data: any[] = extractData(ws);
                    result.mdrt = data.filter(r => String(r.Matriz || r['Mat'] || '') === '2043').map(r => {
                        const paKey = Object.keys(r).find(k => k.trim().toLowerCase() === 'total prima' || k.trim().toLowerCase() === 'camino prima');
                        return { Asesor: resolveName(r.Asesor || r['Nombre del Asesor']), Clave: r.Asesor || '', PA_Acumulada: Number(r[paKey!] || 0) };
                    });
                } else if (c === 'camino_cumbre') {
                    const ws = wb.Sheets[wb.SheetNames[0]];
                    const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, range: 3 });
                    result.camino_cumbre = data.slice(1).filter(r => String(r[3] || '') === '2043').map(r => ({ Asesor: resolveName(r[5]), Clave: r[5] || '', Mes_Asesor: Number(r[12] || r[10] || 1), Polizas_Totales: Number(r[16] || r[14] || 0), Mes_1_Prod: Number(r[24] || r[21] || 0), Mes_2_Prod: Number(r[25] || r[22] || 0), Mes_3_Prod: Number(r[26] || r[23] || 0) }));
                } else if (c === 'convenciones') {
                    const sheetName = wb.SheetNames.find((n: string) => n.toUpperCase() === 'TODOS LOS RAMOS') || wb.SheetNames[0];
                    const ws = wb.Sheets[sheetName];
                    const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, range: 'A20:AL15000' });
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
                } else if (c === 'proactiva_tech') {
                    const selector = (n: string) => n.toLowerCase().includes('asesores');
                    const sheetName = wb.SheetNames.find(selector) || wb.SheetNames[0];
                    const ws = wb.Sheets[sheetName];
                    const data: any[] = XLSX.utils.sheet_to_json(ws, { range: 6 });
                    const advisorsData = data.slice(1);
                    
                    const getExcelYear = (val: any) => {
                        if (!val) return 0;
                        const num = Number(val);
                        if (!isNaN(num)) {
                            const date = new Date(Math.round((num - 25569) * 86400 * 1000));
                            return date.getUTCFullYear();
                        }
                        const str = String(val).trim();
                        const match = str.match(/\b(20\d{2})\b/);
                        return match ? parseInt(match[1], 10) : 0;
                    };

                    result.proactiva_tech = advisorsData.filter(r => {
                        const matVal = String(r.MATRIZ || r.Matriz || '').trim();
                        if (matVal !== '2043') return false;
                        const conVal = r['CONEXIÓN'] || r['Conexión'] || r['CONEXION'] || r['conexion'];
                        const year = getExcelYear(conVal);
                        return year >= 2023;
                    }).map(r => ({
                        Asesor: resolveName(r.ASESOR || r.Asesor || ''),
                        Clave: String(r.ASESOR || r.Asesor || ''),
                        Polizas: Number(r['PÓLIZAS'] || r['Pólizas'] || r['Polizas'] || 0),
                        Comisiones: Number(r.COMISIONES || r.Comisiones || r.comisiones || 0),
                        Ranking: Number(r.RANKING || r.Ranking || r.ranking || 99999)
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
                const xlsPath1 = path.join(BASE_PATH, 'administrador', 'pagado_emitido', 'PagPend.xls');
                const xlsPath2 = path.join(BASE_PATH, 'administrador', 'pagado_emitidido', 'PagPend.xls');
                const xlsPath = fs.existsSync(xlsPath1) ? xlsPath1 : (fs.existsSync(xlsPath2) ? xlsPath2 : null);

                if (xlsPath) {
                    console.log('[SNAPSHOT] Encontrado PagPend.xls original. Decriptando y filtrando...');
                    try {
                        const scriptPath = path.join(BASE_PATH, 'scripts', 'process_pagado_pendiente.py');
                        const localVenv = path.join(BASE_PATH, '.venv', 'bin', 'python');
                        const hostingerAlt = '/opt/alt/python311/bin/python3';
                        const pythonBin = fs.existsSync(localVenv) ? localVenv : (fs.existsSync(hostingerAlt) ? hostingerAlt : 'python3');
                        execSync(`"${pythonBin}" "${scriptPath}" "${xlsPath}"`, { stdio: 'inherit' });
                    } catch (peErr) {
                        console.error('[SNAPSHOT] Error al procesar PagPend.xls:', peErr);
                    }
                }

                const pagPath = 'administrador/pagado_emitidido';
                const wbPag = readExcelData(pagPath, { skipJson: true });
                if (wbPag) {
                    const data: any[][] = XLSX.utils.sheet_to_json(wbPag.Sheets[wbPag.SheetNames[0]], { header: 1 });
                    rg.fechas_corte['pagado_pendiente'] = formatExcelDate(extractCutoffDate(wbPag, 'pagado_pendiente'));
                    const validSucursales = ['2043', '2856', '2511'];
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
                        rg.proactivos = data.slice(7).filter(r => String(r[2] || '') === '2043').map(r => ({ 'ASESOR': dir[String(r[4])] || `Asesor ${r[4]}`, 'SUC': r[3], 'Polizas_Acumuladas_Mes_Ant.': Number(r[9] || 0), 'Polizas_Del_mes': Number(r[10] || 0), 'Polizas_Acumuladas_Total': Number(r[11] || 0), 'Proactivo_al_mes': String(r[12] || '').trim().toUpperCase() === 'P' ? 'SÍ' : 'NO', 'Pólizas_Faltantes': Number(r[13] || 0) }));
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
                        const dataRow = rawP.find(r => r && (String(r[3]).trim() === '2043' || String(r[1]).includes('2043') || String(r[2]).includes('2043'))) || [];
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
                        const isRaw = !!wbComp.Sheets['Detalle de Asesores'];
                        const rawFormat = XLSX.utils.sheet_to_json(wsA, { header: 1, range: 6 }) as any[][];
                        const PROMO_SUCURSALES = ['2043', '2856', '2511'];
                        inds = rawFormat
                            .filter((r: any) => {
                                const sucId2 = String(r[isRaw ? 5 : 4] || '').trim();
                                return r[isRaw ? 8 : 6] && r[isRaw ? 8 : 6] !== 'TOTAL' && 
                                       (PROMO_SUCURSALES.includes(sucId2));
                            })
                            .map((r: any) => {
                                const sucId2 = String(r[isRaw ? 5 : 4] || '').trim();
                                const clave = String(r[isRaw ? 7 : 5] || '').trim();
                                const name = r[isRaw ? 8 : 6];
                                return {
                                    'Nombre del Asesor': dir[clave] || name || `Asesor ${clave}`,
                                    'Sucursal': sucId2,
                                    'Polizas_Pagadas_Año_Anterior': Number(r[isRaw ? 17 : 15] || 0),
                                    'Polizas_Pagadas_Año_Actual': Number(r[isRaw ? 18 : 16] || 0),
                                    'Crec_Polizas_Pagadas': Number(r[isRaw ? 19 : 17] || 0),
                                    '%_Crec_Polizas_Pagadas': Number(r[isRaw ? 20 : 18] || 0),
                                    'Prima_Pagada_Año_Anterior': Number(r[isRaw ? 25 : 23] || 0),
                                    'Prima_Pagada_Año_Actual': Number(r[isRaw ? 26 : 24] || 0),
                                    'Crec_Prima_Pagada': Number(r[isRaw ? 27 : 25] || 0),
                                    '%_Crec_Prima_Pagada': Number(r[isRaw ? 28 : 26] || 0)
                                };
                            });

                        // Recalculate summary to represent ONLY promo sucursales (2043, 2856, 2511)
                        const sumField = (key: string) => inds.reduce((s: number, r: any) => s + (Number(r[key]) || 0), 0);
                        const polAnt = sumField('Polizas_Pagadas_Año_Anterior');
                        const polAct = sumField('Polizas_Pagadas_Año_Actual');
                        const primaAnt = sumField('Prima_Pagada_Año_Anterior');
                        const primaAct = sumField('Prima_Pagada_Año_Actual');
                        const safePct = (crec: number, ant: number) => ant !== 0 ? crec / ant : 0;
                        sum = {
                            Polizas_Pagadas_Año_Anterior: polAnt,
                            Polizas_Pagadas_Año_Actual: polAct,
                            Crec_Polizas_Pagadas: polAct - polAnt,
                            '%_Crec_Polizas_Pagadas': safePct(polAct - polAnt, polAnt),
                            Prima_Pagada_Año_Anterior: primaAnt,
                            'Prima_Pagada_Añoa_Actual': primaAct,
                            Crec_Prima_Pagada: primaAct - primaAnt,
                            '%_Crec_Prima_Pagada': safePct(primaAct - primaAnt, primaAnt)
                        };
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

        const dbDir = DB_PATH_DYNAMIC;
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
        const snapPath = findSnapshotPath();
        if (safeExists(snapPath)) {
            const snapshotData = JSON.parse(fs.readFileSync(snapPath, 'utf-8'));
            const dates = snapshotData.campaignDates || snapshotData.data?.campaignDates;
            if (dates && Object.keys(dates).length > 0) {
                return res.json(dates);
            }
        }
        
        // Instant non-blocking fallback
        return res.json({
            mdrt: "15 de julio de 2026",
            camino_cumbre: "15 de julio de 2026",
            convenciones: "15 de julio de 2026",
            graduacion: "15 de julio de 2026",
            legion_centurion: "15 de julio de 2026",
            fanfest: "15 de julio de 2026",
            vive_tu_pasion: "15 de julio de 2026",
            proactiva_tech: "30 de junio de 2026",
            reto_por_ciento: "15 de julio de 2026"
        });
    } catch (e) {
        res.json({
            mdrt: "15 de julio de 2026",
            camino_cumbre: "15 de julio de 2026",
            convenciones: "15 de julio de 2026",
            graduacion: "15 de julio de 2026",
            legion_centurion: "15 de julio de 2026",
            fanfest: "15 de julio de 2026",
            vive_tu_pasion: "15 de julio de 2026",
            proactiva_tech: "30 de junio de 2026",
            reto_por_ciento: "15 de julio de 2026"
        });
    }
});

app.post('/api/admin/verify-password', (req, res) => {
    if (req.body.password === (process.env.ADMIN_PASSWORD || 'Panel2043')) res.json({ success: true });
    else res.status(401).json({ success: false, error: 'Contraseña incorrecta' });
});

app.get('/api/historico-metas', (req, res) => {
    const filePath = path.join(DB_PATH_DYNAMIC, 'historico_metas.json');
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

app.get('/api/daniela/resumen', (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    try {
        if (!fs.existsSync(SNAPSHOT_PATH)) {
            return res.send("Hola Diego. Aún no se ha compilado ningún snapshot de base de datos.");
        }
        const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf-8'));
        const pag = snapshot.data?.resumen_general?.pagado_pendiente || [];
        
        let polPag = 0, riPag = 0, roPag = 0, totPag = 0;
        let polPend = 0, riPend = 0, roPend = 0, totPend = 0;
        
        pag.forEach((r: any) => {
            polPag += Number(r['Pólizas-Pagadas']) || 0;
            riPag += Number(r['Recibo_Inicial_Pagado']) || 0;
            roPag += Number(r['Recibo_Ordinario_Pagado']) || 0;
            totPag += Number(r['Total _Prima_Pagada']) || 0;
            
            polPend += Number(r['Pólizas_Pendinetes']) || 0;
            riPend += Number(r['Recibo_Inicial_Pendiente']) || 0;
            roPend += Number(r['Recibo_Ordinario_Pendiente']) || 0;
            totPend += Number(r['Total _Prima_Pendiente']) || 0;
        });
        
        const fecha = snapshot.data?.fechas_corte?.pagado_pendiente || "desconocida";
        
        const text = `💰 *RESUMEN PAGADO / PENDIENTE*
📅 *Corte:* ${fecha}

🟢 *PAGADO:*
- Pólizas: ${polPag}
- Recibo Inicial: $${riPag.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
- Recibo Ordinario: $${roPag.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
- Total Prima Pagada: $${totPag.toLocaleString('es-MX', { minimumFractionDigits: 2 })}

🔴 *PENDIENTE:*
- Pólizas: ${polPend}
- Recibo Inicial: $${riPend.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
- Recibo Ordinario: $${roPend.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
- Total Prima Pendiente: $${totPend.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
        
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.send(text);
    } catch (e: any) {
        res.status(500).send("Error al procesar el resumen: " + e.message);
    }
});

app.get('/api/daniela/datos', (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    try {
        if (!fs.existsSync(SNAPSHOT_PATH)) {
            return res.status(404).json({ error: 'Snapshot not found' });
        }
        const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf-8'));
        const originalData = snapshot.data || {};
        const rg = originalData.resumen_general || {};
        const originalCampaigns = originalData.campaigns || {};

        // 1. Fechas de corte
        const fechas_corte = originalData.fechas_corte || {};

        // LÓGICA DE FILTRADO DINÁMICO DE CONSULTAS
        const rawQuery = String(req.query.q || req.query.query || '').trim();
        const queryNorm = rawQuery ? rawQuery.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : '';

        let filterAdvisor: string | null = null;
        let filterCampaign: string | null = null;
        let filterProactivos = false;

        if (queryNorm) {
            // Compilar lista única de todos los asesores en base de datos para mapeo
            const allAdvisors = new Set<string>();
            if (originalCampaigns.convenciones) originalCampaigns.convenciones.forEach((c: any) => { if (c.Asesor) allAdvisors.add(c.Asesor); });
            if (originalCampaigns.mdrt) originalCampaigns.mdrt.forEach((c: any) => { if (c.Asesor) allAdvisors.add(c.Asesor); });
            if (rg.proactivos) rg.proactivos.forEach((p: any) => { if (p.ASESOR) allAdvisors.add(p.ASESOR); });
            if (rg.pagado_pendiente) rg.pagado_pendiente.forEach((r: any) => { if (r['Nombre Asesor']) allAdvisors.add(r['Nombre Asesor']); });

            const nicknames: Record<string, string> = {
                'moni': 'MONICA ANDREA AMBRIZ GOMEZ',
                'monica': 'MONICA ANDREA AMBRIZ GOMEZ',
                'desiree': 'DESIREE DE LA PEÑA OROZCO',
                'desy': 'DESIREE DE LA PEÑA OROZCO',
                'desire': 'DESIREE DE LA PEÑA OROZCO',
                'darinka': 'DARINKA UREÑA CASILLAS',
                'dary': 'DARINKA UREÑA CASILLAS',
                'rafa': 'RAFAEL ALBERTO SUAREZ BAQUEDANO',
                'rafael': 'RAFAEL ALBERTO SUAREZ BAQUEDANO',
                'teresa': 'MARIA TERESA ASENCIO LOZANO',
                'tere': 'MARIA TERESA ASENCIO LOZANO',
                'paulina': 'PAULINA LIZBETH SOTO MUÑIZ',
                'pau': 'PAULINA LIZBETH SOTO MUÑIZ',
                'gabriela': 'GABRIELA CASTAÑEDA SALAZAR',
                'gaby': 'GABRIELA CASTAÑEDA SALAZAR',
                'sofia': 'SOFIA CAMPILLO VASCONCELOS',
                'sofi': 'SOFIA CAMPILLO VASCONCELOS',
                'monserrat': 'MONSERRAT VELASCO SANTOS',
                'monse': 'MONSERRAT VELASCO SANTOS',
                'anais': 'ANAIS LUA MORENO',
                'paula': 'PAULA ANGELICA LOMELI CAZARES'
            };

            // Intentar emparejar apodos primero
            for (const nick in nicknames) {
                const regex = new RegExp('\\b' + nick + '\\b', 'i');
                if (regex.test(queryNorm)) {
                    filterAdvisor = nicknames[nick];
                    break;
                }
            }

            // Si no coincide apodo, buscar por coincidencia de palabras utilizando un sistema de puntuación (scoring)
            // para evitar colisiones (por ejemplo, que "Jorge Preciado" coincida con "Jorge Luna" si este aparece primero)
            if (!filterAdvisor) {
                let bestAdvisor: string | null = null;
                let maxScore = 0;

                for (const advisor of allAdvisors) {
                    const advNorm = advisor.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
                    const words = advNorm.split(/\s+/).filter(w => w.length > 2 && w !== 'del' && w !== 'las' && w !== 'los' && w !== 'maria');
                    
                    let score = 0;
                    for (const word of words) {
                        const regex = new RegExp('\\b' + word + '\\b', 'i');
                        if (regex.test(queryNorm)) {
                            score += 1;
                        }
                    }
                    
                    if (score > maxScore) {
                        maxScore = score;
                        bestAdvisor = advisor;
                    }
                }

                if (maxScore > 0) {
                    filterAdvisor = bestAdvisor;
                }
            }

            // Si no es consulta de asesor, identificar si se busca campaña o proactividad
            if (!filterAdvisor) {
                if (queryNorm.includes('fanfest') || queryNorm.includes('fan fest')) {
                    filterCampaign = 'fanfest';
                } else if (queryNorm.includes('pasion') || queryNorm.includes('pasión')) {
                    filterCampaign = 'vive_tu_pasion';
                } else if (queryNorm.includes('mdrt')) {
                    filterCampaign = 'mdrt';
                } else if (queryNorm.includes('convencion') || queryNorm.includes('convenciones')) {
                    filterCampaign = 'convenciones';
                } else if (queryNorm.includes('legion') || queryNorm.includes('legión') || queryNorm.includes('centurion') || queryNorm.includes('centurión')) {
                    filterCampaign = 'legion_centurion';
                } else if (queryNorm.includes('cumbre')) {
                    filterCampaign = 'camino_cumbre';
                } else if (queryNorm.includes('graduacion') || queryNorm.includes('graduación')) {
                    filterCampaign = 'graduacion';
                } else if (queryNorm.includes('proactivo') || queryNorm.includes('proactivos') || queryNorm.includes('activo') || queryNorm.includes('activos')) {
                    filterProactivos = true;
                }
            }
        }

        const matchAsesor = (name: string) => {
            if (!filterAdvisor) return true;
            const n1 = name ? name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : '';
            const n2 = filterAdvisor.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
            return n1 === n2;
        };

        const includeCampaign = (name: string) => {
            if (filterAdvisor) return true;
            if (filterCampaign) return name === filterCampaign;
            if (filterProactivos) return false;
            return true;
        };

        const includeProactivos = () => {
            if (filterAdvisor) return true;
            if (filterCampaign) return false;
            if (filterProactivos) return true;
            return true;
        };

        const includePagadoPendiente = () => {
            if (filterAdvisor) return true;
            if (filterCampaign) return false;
            if (filterProactivos) return false;
            return true;
        };

        // 2. Resumen Pagado / Pendiente
        const pag = rg.pagado_pendiente || [];
        let polPag = 0, riPag = 0, roPag = 0, totPag = 0;
        let polPend = 0, riPend = 0, roPend = 0, totPend = 0;
        
        pag.forEach((r: any) => {
            polPag += Number(r['Pólizas-Pagadas']) || 0;
            riPag += Number(r['Recibo_Inicial_Pagado']) || 0;
            roPag += Number(r['Recibo_Ordinario_Pagado']) || 0;
            totPag += Number(r['Total _Prima_Pagada']) || 0;
            
            polPend += Number(r['Pólizas_Pendinetes']) || 0;
            riPend += Number(r['Recibo_Inicial_Pendiente']) || 0;
            roPend += Number(r['Recibo_Ordinario_Pendiente']) || 0;
            totPend += Number(r['Total _Prima_Pendiente']) || 0;
        });

        const pagado_pendiente_consolidado = {
            pagado: { polizas: polPag, recibo_inicial: riPag, recibo_ordinario: roPag, total_prima: totPag },
            pendiente: { polizas: polPend, recibo_inicial: riPend, recibo_ordinario: roPend, total_prima: totPend }
        };

        const pagado_pendiente_por_asesor = includePagadoPendiente()
            ? pag.map((r: any) => ({
                asesor: r['Nombre Asesor'],
                pagado: { polizas: Number(r['Pólizas-Pagadas']) || 0, total_prima: Number(r['Total _Prima_Pagada']) || 0 },
                pendiente: { polizas: Number(r['Pólizas_Pendinetes']) || 0, total_prima: Number(r['Total _Prima_Pendiente']) || 0 }
            })).filter((r: any) => (r.pagado.polizas > 0 || r.pendiente.polizas > 0) && matchAsesor(r.asesor))
            : [];

        // 3. Proactivos
        const proactivos_list = rg.proactivos || [];

        // Calculate mesRequisito based on the proactivos cutoff date
        const monthsArr = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        let mesRequisito = new Date().getMonth() + 1;
        const fCorteProactivos = fechas_corte.proactivos || '';
        const parts = fCorteProactivos.split('-');
        if (parts.length === 3 && parts[0].length === 4) {
            const monthNum = parseInt(parts[1], 10);
            if (monthNum >= 1 && monthNum <= 12) mesRequisito = monthNum;
        } else {
            const words = fCorteProactivos.replace(/,/g, '').split(/\s+/);
            for (const word of words) {
                const idx = monthsArr.indexOf(word.toLowerCase());
                if (idx !== -1) {
                    mesRequisito = idx + 1;
                    break;
                }
            }
        }

        const proactivos_activos = includeProactivos()
            ? proactivos_list
                .filter((p: any) => String(p.Proactivo_al_mes).trim().toUpperCase() === 'SÍ' && matchAsesor(p.ASESOR))
                .map((p: any) => {
                    const polizasAcum = Number(p.Polizas_Acumuladas_Total) || 0;
                    return {
                        asesor: p.ASESOR,
                        sucursal: p.SUC,
                        polizas_del_mes: p.Polizas_Del_mes,
                        polizas_acumuladas: polizasAcum,
                        requisito_mes: mesRequisito,
                        faltantes_mes: Math.max(0, mesRequisito - polizasAcum),
                        faltantes_dic: p.Pólizas_Faltantes_Para_Dic,
                        fecha_conexion: p.Fecha_Conexion
                    };
                })
            : [];

        const proactivos_inactivos = includeProactivos()
            ? proactivos_list
                .filter((p: any) => String(p.Proactivo_al_mes).trim().toUpperCase() !== 'SÍ' && matchAsesor(p.ASESOR))
                .map((p: any) => {
                    const polizasAcum = Number(p.Polizas_Acumuladas_Total) || 0;
                    return {
                        asesor: p.ASESOR,
                        sucursal: p.SUC,
                        polizas_del_mes: p.Polizas_Del_mes,
                        polizas_acumuladas: polizasAcum,
                        requisito_mes: mesRequisito,
                        faltantes_mes: Math.max(0, mesRequisito - polizasAcum),
                        faltantes_dic: p.Pólizas_Faltantes_Para_Dic,
                        fecha_conexion: p.Fecha_Conexion
                    };
                })
            : [];

        // 4. Campañas simplificadas
        const campaigns: Record<string, any[]> = {};
        
        if (originalCampaigns.mdrt && includeCampaign('mdrt')) {
            campaigns.mdrt = originalCampaigns.mdrt
                .filter((c: any) => Number(c.PA_Acumulada) > 0 && matchAsesor(c.Asesor))
                .map((c: any) => ({ asesor: c.Asesor, clave: c.Clave, pa_acumulada: c.PA_Acumulada }));
        }
        if (originalCampaigns.convenciones && includeCampaign('convenciones')) {
            campaigns.convenciones = originalCampaigns.convenciones
                .filter((c: any) => (Number(c.PA_Total) > 0 || Number(c.Polizas) > 0) && matchAsesor(c.Asesor))
                .map((c: any) => ({
                    asesor: c.Asesor,
                    clave: c.Clave,
                    creditos: Number(c.PA_Total || 0),
                    polizas: Number(c.Polizas || 0),
                    lugar_ranking: Number(c.Lugar || 9999),
                    meta_creditos_lugar_480: Number(c.Lugar_480 || 0),
                    meta_creditos_lugar_228: Number(c.Lugar_228 || 0),
                    meta_creditos_lugar_108: Number(c.Lugar_108 || 0),
                    meta_creditos_lugar_28: Number(c.Lugar_28 || 0)
                }));
        }
        if (originalCampaigns.legion_centurion && includeCampaign('legion_centurion')) {
            campaigns.legion_centurion = originalCampaigns.legion_centurion
                .filter((c: any) => Number(c.Total_Polizas) > 0 && matchAsesor(c.Asesor))
                .map((c: any) => ({
                    asesor: c.Asesor,
                    clave: c.Clave,
                    total_polizas: c.Total_Polizas,
                    mes_actual: c.Mes_Actual,
                    nivel: c.Nivel,
                    en_meta: c.EnMeta
                }));
        }
        if (originalCampaigns.camino_cumbre && includeCampaign('camino_cumbre')) {
            campaigns.camino_cumbre = originalCampaigns.camino_cumbre
                .filter((c: any) => Number(c.Polizas_Totales) > 0 && matchAsesor(c.Asesor))
                .map((c: any) => ({
                    asesor: c.Asesor,
                    clave: c.Clave,
                    mes_asesor: c.Mes_Asesor,
                    polizas_totales: c.Polizas_Totales
                }));
        }
        if (originalCampaigns.fanfest && includeCampaign('fanfest')) {
            campaigns.fanfest = originalCampaigns.fanfest
                .filter((c: any) => (Number(c.Total_Polizas) > 0 || String(c.Premio).trim() === 'GANADO') && matchAsesor(c.Asesor))
                .map((c: any) => ({
                    asesor: c.Asesor,
                    clave: c.Clave,
                    total_polizas: c.Total_Polizas,
                    premio: c.Premio
                }));
        }
        if (originalCampaigns.vive_tu_pasion && includeCampaign('vive_tu_pasion')) {
            campaigns.vive_tu_pasion = originalCampaigns.vive_tu_pasion
                .filter((c: any) => (Number(c.Polizas) > 0 || String(c.Premio).trim() !== '') && matchAsesor(c.Asesor))
                .map((c: any) => ({
                    asesor: c.Asesor,
                    clave: c.Clave,
                    polizas: c.Polizas,
                    premio: c.Premio
                }));
        }
        if (originalCampaigns.proactiva_tech && includeCampaign('proactiva_tech')) {
            campaigns.proactiva_tech = originalCampaigns.proactiva_tech
                .filter((c: any) => (Number(c.Polizas) > 0 || Number(c.Comisiones) > 0) && matchAsesor(c.Asesor))
                .map((c: any) => ({
                    asesor: c.Asesor,
                    clave: c.Clave,
                    polizas: c.Polizas,
                    comisiones: c.Comisiones,
                    ranking: c.Ranking
                }));
        }
        if (originalCampaigns.reto_por_ciento && includeCampaign('reto_por_ciento')) {
            campaigns.reto_por_ciento = originalCampaigns.reto_por_ciento
                .filter((c: any) => matchAsesor(c.Asesor))
                .map((c: any) => ({
                    asesor: c.Asesor,
                    clave: c.Clave,
                    conteo: c.Conteo,
                    cumplimiento: c.Cumplimiento,
                    suma_comision: c.Suma_Comision,
                    porcentaje: c.Porcentaje,
                    extracomision: c.Extracomision
                }));
        }
        if (originalCampaigns.graduacion && includeCampaign('graduacion')) {
            campaigns.graduacion = originalCampaigns.graduacion
                .filter((c: any) => matchAsesor(c.Asesor))
                .map((c: any) => ({
                    asesor: c.Asesor,
                    clave: c.Clave,
                    mes_asesor: c.Mes_Asesor,
                    polizas_totales: c.Polizas_Totales,
                    fecha_limite: c.Fecha_Limite_Meta,
                    comisiones: c.Comisones
                }));
        }

        // 5. Consolidación de respuesta
        res.json({
            fechas_corte,
            resumen_general: {
                pagado_pendiente_consolidado,
                pagado_pendiente_por_asesor,
                proactivos_activos,
                proactivos_inactivos
            },
            campaigns
        });
    } catch (e: any) {
        res.status(500).json({ error: 'Error reading and processing snapshot: ' + e.message });
    }
});

app.get('/api/resumen-general', (req, res) => {
    try {
        const { dates, useSnapshot } = req.query;

        // Performance optimization: check for frozen snapshot
        if (useSnapshot === 'true' && fs.existsSync(SNAPSHOT_PATH)) {
            const snapshotData = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf-8'));
            if (snapshotData.data?.resumen_general) {
                // Return flat structure compatible with frontend
                return res.json({
                    ...snapshotData.data.resumen_general,
                    fechas_corte: snapshotData.data.resumen_general.fechas_corte || snapshotData.data.fechas_corte || {}
                });
            }
        }

        const VALID_SUCURSAL = '2043';
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
                result.asesores_sin_emision.summaryBySucursal = dat
                    .filter((r: any) => String(r[1]) === VALID_SUCURSAL || String(r[4]) === VALID_SUCURSAL)
                    .map((r: any) => ({ 
                        Sucursal: r[5] || r[2], 
                        Suc: r[4] || r[1], 
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
                        Prima_Pagada_GMM: Number(r[16] || 0) 
                    }));
            }
            if (wsA) {
                const dat = XLSX.utils.sheet_to_json(wsA, { header: 1, range: 4 });
                result.asesores_sin_emision.individuals = dat
                    .filter((r: any) => String(r[3]) === VALID_SUCURSAL || String(r[4]) === VALID_SUCURSAL)
                    .map((r: any) => ({ 
                        Asesor: r[7] || 'Descon', 
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
        }

        const xlsPath1 = path.join(BASE_PATH, 'administrador', 'pagado_emitido', 'PagPend.xls');
        const xlsPath2 = path.join(BASE_PATH, 'administrador', 'pagado_emitidido', 'PagPend.xls');
        const xlsPath = fs.existsSync(xlsPath1) ? xlsPath1 : (fs.existsSync(xlsPath2) ? xlsPath2 : null);

        if (xlsPath) {
            console.log('[API] Encontrado PagPend.xls original. Decriptando y filtrando...');
            try {
                const scriptPath = path.join(BASE_PATH, 'scripts', 'process_pagado_pendiente.py');
                const localVenv = path.join(BASE_PATH, '.venv', 'bin', 'python');
                const hostingerAlt = '/opt/alt/python311/bin/python3';
                const pythonBin = fs.existsSync(localVenv) ? localVenv : (fs.existsSync(hostingerAlt) ? hostingerAlt : 'python3');
                execSync(`"${pythonBin}" "${scriptPath}" "${xlsPath}"`, { stdio: 'inherit' });
            } catch (peErr) {
                console.error('[API] Error al procesar PagPend.xls:', peErr);
            }
        }

        const pagPath = 'administrador/pagado_emitidido';
        const wbPag = readExcelData(pagPath, { skipJson: true, date: selectedDates.pagado_pendiente });
        if (wbPag) {
            const data: any[][] = XLSX.utils.sheet_to_json(wbPag.Sheets[wbPag.SheetNames[0]], { header: 1 });
            result.fechas_corte['pagado_pendiente'] = formatExcelDate(extractCutoffDate(wbPag, 'pagado_pendiente'));
            const validSucursales = ['2043', '2856', '2511'];
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
                result.proactivos = data.slice(7).filter(r => String(r[2] || '') === '2043').map(r => ({ 'ASESOR': dir[String(r[4])] || `Asesor ${r[4]}`, 'SUC': r[3], 'Polizas_Acumuladas_Mes_Ant.': Number(r[9] || 0), 'Polizas_Del_mes': Number(r[10] || 0), 'Polizas_Acumuladas_Total': Number(r[11] || 0), 'Proactivo_al_mes': String(r[12] || '').trim().toUpperCase() === 'P' ? 'SÍ' : 'NO', 'Pólizas_Faltantes': Number(r[13] || 0) }));
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
                    const dataRow = rawP.find(r => r && (String(r[3]).trim() === '2043' || String(r[1]).includes('2043') || String(r[2]).includes('2043'))) || [];
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
                const isRaw = !!wbComp.Sheets['Detalle de Asesores'];
                const rawFormat = XLSX.utils.sheet_to_json(wsA, { header: 1, range: 6 }) as any[][];
                const PROMO_SUCURSALES = ['2043', '2856', '2511'];
                inds = rawFormat
                    .filter((r: any) => {
                        const sucId2 = String(r[isRaw ? 5 : 4] || '').trim();
                        return r[isRaw ? 8 : 6] && r[isRaw ? 8 : 6] !== 'TOTAL' && 
                               (PROMO_SUCURSALES.includes(sucId2));
                    })
                    .map((r: any) => {
                        const sucId2 = String(r[isRaw ? 5 : 4] || '').trim();
                        const clave = String(r[isRaw ? 7 : 5] || '').trim();
                        const name = r[isRaw ? 8 : 6];
                        return {
                            'Nombre del Asesor': dir[clave] || name || `Asesor ${clave}`,
                            'Sucursal': sucId2,
                            'Polizas_Pagadas_Año_Anterior': Number(r[isRaw ? 17 : 15] || 0),
                            'Polizas_Pagadas_Año_Actual': Number(r[isRaw ? 18 : 16] || 0),
                            'Crec_Polizas_Pagadas': Number(r[isRaw ? 19 : 17] || 0),
                            '%_Crec_Polizas_Pagadas': Number(r[isRaw ? 20 : 18] || 0),
                            'Prima_Pagada_Año_Anterior': Number(r[isRaw ? 25 : 23] || 0),
                            'Prima_Pagada_Año_Actual': Number(r[isRaw ? 26 : 24] || 0),
                            'Crec_Prima_Pagada': Number(r[isRaw ? 27 : 25] || 0),
                            '%_Crec_Prima_Pagada': Number(r[isRaw ? 28 : 26] || 0)
                        };
                    });

                // Recalculate summary to represent ONLY promo sucursales (2043, 2856, 2511)
                const sumField = (key: string) => inds.reduce((s: number, r: any) => s + (Number(r[key]) || 0), 0);
                const polAnt = sumField('Polizas_Pagadas_Año_Anterior');
                const polAct = sumField('Polizas_Pagadas_Año_Actual');
                const primaAnt = sumField('Prima_Pagada_Año_Anterior');
                const primaAct = sumField('Prima_Pagada_Año_Actual');
                const safePct = (crec: number, ant: number) => ant !== 0 ? crec / ant : 0;
                sum = {
                    Polizas_Pagadas_Año_Anterior: polAnt,
                    Polizas_Pagadas_Año_Actual: polAct,
                    Crec_Polizas_Pagadas: polAct - polAnt,
                    '%_Crec_Polizas_Pagadas': safePct(polAct - polAnt, polAnt),
                    Prima_Pagada_Año_Anterior: primaAnt,
                    'Prima_Pagada_Añoa_Actual': primaAct,
                    Crec_Prima_Pagada: primaAct - primaAnt,
                    '%_Crec_Prima_Pagada': safePct(primaAct - primaAnt, primaAnt)
                };
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
const LOCAL_DB_DIR = DB_PATH_DYNAMIC;

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


// ===================== CENTRO DE AVISOS =====================
const ALERTS_FILE_PATH = path.join(DB_PATH_DYNAMIC, 'alertas_pendientes.json');

app.get('/api/admin/alertas', (req, res) => {
    try {
        if (fs.existsSync(ALERTS_FILE_PATH)) {
            const data = JSON.parse(fs.readFileSync(ALERTS_FILE_PATH, 'utf-8'));
            return res.json(data);
        }
        res.json({ generatedAt: null, totalNew: 0, alerts: [] });
    } catch (e) {
        res.status(500).json({ error: 'Could not read alerts' });
    }
});

app.post('/api/admin/alertas/:id/sent', (req, res) => {
    try {
        if (!fs.existsSync(ALERTS_FILE_PATH)) return res.status(404).json({ error: 'No alerts file' });
        const data = JSON.parse(fs.readFileSync(ALERTS_FILE_PATH, 'utf-8'));
        const alert = (data.alerts || []).find((a: any) => a.id === req.params.id);
        if (alert) {
            alert.sent = true;
            fs.writeFileSync(ALERTS_FILE_PATH, JSON.stringify(data, null, 2));
        }
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Could not update alert' });
    }
});

app.delete('/api/admin/alertas/clear-sent', (req, res) => {
    try {
        if (!fs.existsSync(ALERTS_FILE_PATH)) return res.json({ success: true });
        const data = JSON.parse(fs.readFileSync(ALERTS_FILE_PATH, 'utf-8'));
        data.alerts = (data.alerts || []).filter((a: any) => !a.sent);
        fs.writeFileSync(ALERTS_FILE_PATH, JSON.stringify(data, null, 2));
        res.json({ success: true, remaining: data.alerts.length });
    } catch (e) {
        res.status(500).json({ error: 'Could not clear alerts' });
    }
});

// ===================== LOG DE ACTIVIDAD =====================
const ACTIVITY_FILE = 'actividad.json';
const SNAPSHOT_PATH = path.join(DB_PATH_DYNAMIC, 'resumen_snapshot.json');


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
const POLIZAS_PATH = getProtectedPath('estatus polizas');

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

// ===================== ACTIVIDAD DEL STAFF =====================
const STAFF_FILE = 'staff_activity.json';

app.get('/api/admin/staff-activity', (req, res) => {
    try {
        const filePath = path.join(DB_PATH_DYNAMIC, STAFF_FILE);
        if (!fs.existsSync(filePath)) return res.json({});
        res.json(JSON.parse(fs.readFileSync(filePath, 'utf-8')));
    } catch (e) { res.status(500).json({ error: 'Read error' }); }
});

app.post('/api/admin/staff-activity', (req, res) => {
    try {
        const filePath = path.join(DB_PATH_DYNAMIC, STAFF_FILE);
        fs.writeFileSync(filePath, JSON.stringify(req.body, null, 2));
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Write error' }); }
});

app.use((req, res) => {
    if (req.path.startsWith('/api')) return res.status(404).json({ error: 'API not found' });
    if (path.extname(req.path)) return res.status(404).send('Not found');
    const cwd = process.cwd();
    const candidateIndexFiles = [
        path.join(DIST_PATH, 'index.html'),
        path.join(cwd, 'index.html'),
        path.join(cwd, 'dist', 'index.html'),
        path.join(__dirname, 'index.html'),
        path.join(__dirname, 'dist', 'index.html'),
        path.join(BASE_PATH, 'index.html'),
        path.join(BASE_PATH, 'dist', 'index.html'),
        '/home/u211138134/domains/panel.ambrizydavalos.com/public_html/index.html',
        '/home/u211138134/domains/panel.ambrizydavalos.com/public_html/dist/index.html'
    ];
    const foundIndex = candidateIndexFiles.find(p => fs.existsSync(p));
    if (foundIndex) {
        res.setHeader('Content-Type', 'text/html');
        return res.sendFile(foundIndex);
    }
    res.status(404).send('Frontend not built.');
});

const preloadCampaigns = () => {
    console.log('[CACHE WARMER] Inicializando precarga de campañas en segundo plano para máxima velocidad...');
    getCachedAdvisors(); // Precarga instántanea de asesores en memoria

    const campaigns = ['mdrt', 'camino_cumbre', 'convenciones', 'graduacion', 'legion_centurion', 'proactiva_tech', 'reto_por_ciento'];
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
                    if (!ws._cachedData) ws._cachedData = XLSX.utils.sheet_to_json(ws, { header: 1, range: 'A20:AL15000' });
                } else if (c === 'camino_cumbre') {
                    const ws = wb.Sheets[wb.SheetNames[0]];
                    if (!ws._cachedData) ws._cachedData = XLSX.utils.sheet_to_json(ws, { header: 1, range: 3 });
                } else if (c === 'graduacion') {
                    const ws = wb.Sheets[wb.SheetNames[0]];
                    if (!ws._cachedJson) ws._cachedJson = XLSX.utils.sheet_to_json(ws, { range: 2 });
                } else if (c === 'mdrt') {
                    const ws = wb.Sheets[wb.SheetNames.find((n: string) => n.toUpperCase() === 'MDRT') || wb.SheetNames[0]];
                    if (ws && !ws._cachedJson) ws._cachedJson = extractData(ws);
                } else if (c === 'legion_centurion') {
                    const ws = wb.Sheets[wb.SheetNames[0]];
                    if (!ws._cachedJson) ws._cachedJson = XLSX.utils.sheet_to_json(ws, { range: 'A11:Z10000' });
                } else if (c === 'proactiva_tech') {
                    const selector = (n: string) => n.toLowerCase().includes('asesores');
                    const sheetName = wb.SheetNames.find(selector) || wb.SheetNames[0];
                    const ws = wb.Sheets[sheetName];
                    if (!ws._cachedJson) ws._cachedJson = XLSX.utils.sheet_to_json(ws, { range: 6 });
                }
            }
        } catch (e) {
            console.error(`[CACHE WARMER] Error al precargar ${c}:`, e);
        }
        idx++;
        setTimeout(loadNext, 1000); // Wait 1 second before doing the next
    };

    setTimeout(loadNext, 2000); // Start preloading 2 seconds after boot
};

// Final catch-all for React SPA
app.get('*', (req, res) => {
    const cwd = process.cwd();
    const candidateIndexFiles = [
        path.join(DIST_PATH, 'index.html'),
        path.join(cwd, 'index.html'),
        path.join(cwd, 'dist', 'index.html'),
        path.join(__dirname, 'index.html'),
        path.join(__dirname, 'dist', 'index.html'),
        path.join(BASE_PATH, 'index.html'),
        path.join(BASE_PATH, 'dist', 'index.html'),
        '/home/u211138134/domains/panel.ambrizydavalos.com/public_html/index.html',
        '/home/u211138134/domains/panel.ambrizydavalos.com/public_html/dist/index.html'
    ];
    const foundIndex = candidateIndexFiles.find(p => safeExists(p));
    if (foundIndex) {
        return res.sendFile(foundIndex);
    }
    res.status(404).send(`Frontend not built. CWD: ${cwd}, __dirname: ${__dirname}, BASE_PATH: ${BASE_PATH}`);
});

app.listen(PORT, () => {
    console.log(`🚀 Fortress Server running on port ${PORT}`);
});
