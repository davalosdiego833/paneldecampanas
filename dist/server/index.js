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
let cachedAdvisors = [];
let lastDirectoryMtime = 0;
const getCachedAdvisors = () => {
    const filePath = path.join(BASE_PATH, 'administrador', 'directorio_asesores.xlsx');
    if (!fs.existsSync(filePath))
        return cachedAdvisors;
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
const mimeTypes = {
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
const setMimeHeaders = (res, filePath) => {
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
    if (!fs.existsSync(filePath))
        return {};
    try {
        const workbook = XLSX.readFile(filePath);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(worksheet);
        const directory = {};
        data.forEach(row => {
            const keys = Object.keys(row);
            const claveKey = keys.find(k => k.toLowerCase().trim() === 'clave');
            const nombreKey = keys.find(k => k.toLowerCase().trim() === 'nombre_completo' || k.toLowerCase().trim() === 'nombre completo');
            if (claveKey && nombreKey && row[claveKey] && row[nombreKey]) {
                directory[String(row[claveKey])] = String(row[nombreKey]).trim();
            }
        });
        return directory;
    }
    catch (e) {
        console.error('Error reading director:', e);
        return {};
    }
};
const MONTHS_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const parseSpanishDate = (str) => {
    if (!str)
        return '';
    const match = String(str).toLowerCase().match(/(\d{1,2})\s+de\s+([a-z]+)\s+de\s+(\d{4})/i);
    if (match) {
        const day = match[1].padStart(2, '0');
        const mIdx = MONTHS_ES.indexOf(match[2].toLowerCase());
        const month = (mIdx !== -1 ? mIdx + 1 : 1).toString().padStart(2, '0');
        const year = match[3];
        return `${year}-${month}-${day}`;
    }
    return '';
};
const formatExcelDate = (val) => {
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
const excelCache = {};
// Cache for historical dates mapping: { folderPath: { "YYYY-MM-DD": "filename.xlsx" } }
const historyCache = {};
// Helper to get cutoff date from any worksheet based on common locations
const extractCutoffDate = (wb, type) => {
    try {
        if (type === 'legion_centurion') {
            const ws = wb.Sheets[wb.SheetNames[0]];
            const v = ws?.['B9']?.v || "";
            const m = String(v).match(/\d{1,2}\s+de\s+[a-z]+\s+de\s+\d{4}/i);
            return m ? parseSpanishDate(m[0]) : '';
        }
        if (type === 'mdrt') {
            const ws = wb.Sheets[wb.SheetNames.find((n) => n.toUpperCase() === 'MDRT') || wb.SheetNames[0]];
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
            if (typeof v === 'number')
                return parseSpanishDate(formatExcelDate(v));
            const m = String(v).match(/\d{1,2}\s+de\s+[a-z]+\s+de\s+\d{4}/i);
            return m ? parseSpanishDate(m[0]) : '';
        }
        if (type === 'graduacion') {
            const ws = wb.Sheets[wb.SheetNames[0]];
            return parseSpanishDate(formatExcelDate(ws?.['A1']?.v));
        }
        if (type === 'proactivos') {
            const ws = wb.Sheets['Detalle Asesores'];
            if (!ws)
                return '';
            const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
            return parseSpanishDate(formatExcelDate(data[2]?.[2] || data[2]?.[0] || ""));
        }
        if (type === 'pagado_pendiente') {
            const ws = wb.Sheets[wb.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
            return parseSpanishDate(formatExcelDate(data[0]?.[1] || data[0]?.[0] || ws?.['A1']?.v || ""));
        }
        if (type === 'asesores_sin_emision') {
            const ws = wb.Sheets['Promotores'] || wb.Sheets[wb.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
            return parseSpanishDate(formatExcelDate(data[1]?.[0] || data[0]?.[0] || ""));
        }
        if (type === 'comparativo_vida') {
            const ws = wb.Sheets['asesores'];
            if (!ws)
                return '';
            const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
            return parseSpanishDate(formatExcelDate(data[1]?.[2] || ""));
        }
        return '';
    }
    catch (e) {
        return '';
    }
};
// Helper to read Excel with optional date (history)
const readExcelData = (folderName, options = {}) => {
    const folderPath = path.join(BASE_PATH, folderName);
    if (!fs.existsSync(folderPath))
        return null;
    try {
        let fileName = '';
        if (options.date && historyCache[folderName] && historyCache[folderName][options.date]) {
            fileName = historyCache[folderName][options.date];
        }
        else {
            // Default: get latest file (by mtime)
            const files = fs.readdirSync(folderPath).filter(f => (f.endsWith('.xlsx') || f.endsWith('.xlsm') || f.endsWith('.xls')) && !f.startsWith('~$'));
            if (files.length === 0)
                return null;
            fileName = files.sort((a, b) => fs.statSync(path.join(folderPath, b)).mtimeMs - fs.statSync(path.join(folderPath, a)).mtimeMs)[0];
        }
        const filePath = path.join(folderPath, fileName);
        const stats = fs.statSync(filePath);
        const mtime = stats.mtimeMs;
        const cacheKey = `${folderName}_${fileName}`;
        // Return from cache if file hasn't changed
        if (excelCache[cacheKey] && excelCache[cacheKey].mtime === mtime) {
            if (options.skipJson)
                return excelCache[cacheKey].workbook;
            if (excelCache[cacheKey].json)
                return excelCache[cacheKey].json;
            const workbook = excelCache[cacheKey].workbook;
            const sheetNames = workbook.SheetNames;
            const json = XLSX.utils.sheet_to_json(workbook.Sheets[sheetNames[0]]);
            excelCache[cacheKey].json = json;
            return json;
        }
        console.log(`[DEBUG] Cache miss for ${cacheKey}. Reading file: ${filePath}`);
        const workbook = XLSX.readFile(filePath, { cellFormula: false, cellStyles: false, cellNF: false });
        excelCache[cacheKey] = { mtime, workbook };
        if (options.skipJson)
            return workbook;
        const sheetNames = workbook.SheetNames;
        const json = XLSX.utils.sheet_to_json(workbook.Sheets[sheetNames[0]]);
        excelCache[cacheKey].json = json;
        return json;
    }
    catch (error) {
        console.error(`Error reading folder/file ${folderName}:`, error);
        return null;
    }
};
const getLegionDate = (worksheet) => {
    const v = worksheet?.['B9']?.v || "";
    const m = String(v).match(/\d{1,2}\s+de\s+[a-z]+\s+de\s+\d{4}/i);
    return m ? m[0] : null;
};
const getMdrtDate = (worksheet) => {
    const v = worksheet?.['A1']?.v || "";
    const ms = String(v).match(/\d{1,2}\s+de\s+[a-z]+\s+de\s+\d{4}/gi);
    return ms ? ms[ms.length - 1] : null;
};
const getCaminoDate = (worksheet) => {
    const v = worksheet?.['A1']?.v || worksheet?.['B19']?.v || "";
    const ms = String(v).match(/\d{1,2}\s+de\s+[a-z]+\s+de\s+\d{4}/gi);
    return ms ? ms[ms.length - 1] : null;
};
// --- Endpoints ---
app.get('/api/admin/available-reports', (req, res) => {
    try {
        const adminReports = [
            { id: 'asesores_sin_emision', path: 'administrador/asesores_sin_emision' },
            { id: 'pagado_pendiente', path: 'administrador/pagado_emitidido' },
            { id: 'proactivos', path: 'administrador/proactivos' },
            { id: 'comparativo_vida', path: 'administrador/comparativo_vida' }
        ];
        const campaigns = ['mdrt', 'convenciones', 'camino_cumbre', 'graduacion', 'legion_centurion'];
        const allPaths = [...adminReports, ...campaigns.map(c => ({ id: c, path: c }))];
        const reportsInfo = {};
        allPaths.forEach(entry => {
            const folderPath = path.join(BASE_PATH, entry.path);
            if (fs.existsSync(folderPath) && fs.lstatSync(folderPath).isDirectory()) {
                const files = fs.readdirSync(folderPath).filter(f => (f.endsWith('.xlsx') || f.endsWith('.xlsm') || f.endsWith('.xls')) && !f.startsWith('~$'));
                const datesMap = {};
                files.forEach(f => {
                    const fullPath = path.join(folderPath, f);
                    try {
                        const wb = XLSX.readFile(fullPath, { cellFormula: false, cellStyles: false });
                        const date = extractCutoffDate(wb, entry.id);
                        if (date) {
                            datesMap[date] = f;
                        }
                    }
                    catch (e) { }
                });
                historyCache[entry.path] = datesMap;
                reportsInfo[entry.id] = Object.keys(datesMap).sort().reverse();
            }
        });
        res.json(reportsInfo);
    }
    catch (err) {
        console.error('Error listing reports:', err);
        res.status(500).json({ error: 'Could not scan reports' });
    }
});
app.get('/api/campaigns', (req, res) => {
    const exclude = ['assets', 'themes', 'server', 'node_modules', 'src', 'public', '.git', 'dist', '.conda', 'administrador', 'tmp', '.cache', '.npm', 'estatus polizas', 'estatus_polizas'];
    try {
        const folders = fs.readdirSync(BASE_PATH, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory() && !exclude.includes(dirent.name) && !dirent.name.startsWith('.'))
            .map(dirent => dirent.name);
        res.json(folders.sort());
    }
    catch (error) {
        res.status(500).json({ error: 'Could not list campaigns' });
    }
});
app.get('/api/advisors', (req, res) => {
    try {
        const advisors = getCachedAdvisors();
        if (advisors.length > 0)
            return res.json(advisors);
        res.json([]);
    }
    catch (error) {
        res.status(500).json({ error: 'Could not list advisors' });
    }
});
app.get('/api/campaign/:name/data/:advisor', (req, res) => {
    const { name, advisor } = req.params;
    const { date } = req.query;
    if (name === 'legion_centurion') {
        const wb = readExcelData(name, { skipJson: true, date: date });
        if (!wb)
            return res.status(404).json({ error: 'Raw file not found' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const b9 = ws['B9']?.v || "";
        const mMatch = String(b9).toLowerCase().match(/(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/);
        const mIndex = mMatch ? MONTHS_ES.indexOf(mMatch[1]) + 1 : 1;
        const json = XLSX.utils.sheet_to_json(ws, { range: 'A11:Z10000' });
        const dir = getAdvisorDirectory();
        const advisorKeys = Object.keys(dir).filter(key => dir[key] === advisor);
        const row = json.find(r => String(r['Matriz'] || '') === '2043' && (String(r['Asesor'] || '') === advisor || advisorKeys.includes(String(r['Asesor'] || ''))));
        if (!row)
            return res.status(404).json({ error: 'Advisor not found' });
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
        const wb = readExcelData(name, { skipJson: true, date: date });
        if (!wb)
            return res.status(404).json({ error: 'Raw file not found' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1, range: 'A20:AI5000' });
        const dir = getAdvisorDirectory();
        const advisorIds = Object.keys(dir).filter(id => dir[id] === advisor);
        const row = data.find(r => String(r[4] || '') === '2043' && (String(r[7] || '') === advisor || advisorIds.includes(String(r[7] || ''))));
        if (!row)
            return res.status(404).json({ error: 'Advisor not found' });
        const allCredits = data.slice(1).filter(r => r[32] != null && r[32] !== '' && r[24] != null);
        let c480 = 0, c228 = 0, c108 = 0, c28 = 0;
        allCredits.forEach(r => {
            const l = Number(r[32]);
            if (l === 480)
                c480 = Number(r[24] || 0);
            if (l === 228)
                c228 = Number(r[24] || 0);
            if (l === 108)
                c108 = Number(r[24] || 0);
            if (l === 28)
                c28 = Number(r[24] || 0);
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
        const wb = readExcelData(name, { skipJson: true, date: date });
        if (!wb)
            return res.status(404).json({ error: 'Raw file not found' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1, range: 3 });
        const dir = getAdvisorDirectory();
        const advisorIds = Object.keys(dir).filter(id => dir[id] === advisor);
        const row = data.find(r => String(r[3] || '') === '2043' && (String(r[5] || '') === advisor || advisorIds.includes(String(r[5] || ''))));
        if (!row)
            return res.status(404).json({ error: 'Advisor not found' });
        const pols = Number(row[13] || 0);
        const mes = Number(row[10] || 1);
        return res.json({
            'Asesor': advisor, 'Clave': row[5] || '', 'Fecha_Corte': getCaminoDate(ws) || "",
            'Mes_Asesor': mes, 'Trimestre': Math.ceil(mes / 3), 'Polizas_Totales': pols,
            'Mes_1_Prod': row[21] || 0, 'Mes_2_Prod': row[22] || 0, 'Mes_3_Prod': row[23] || 0
        });
    }
    if (name === 'graduacion') {
        const wb = readExcelData(name, { skipJson: true, date: date });
        if (!wb)
            return res.status(404).json({ error: 'Raw file not found' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws, { range: 2 });
        const dir = getAdvisorDirectory();
        const advisorKeys = Object.keys(dir).filter(key => dir[key] === advisor);
        const row = json.find(r => String(r['NOMBRE'] || '') === advisor || advisorKeys.includes(String(r['NOMBRE'] || '')) || String(r['ASESOR'] || '') === advisor || advisorKeys.includes(String(r['ASESOR'] || '')));
        if (!row)
            return res.status(404).json({ error: 'Advisor not found' });
        return res.json({
            'Asesor': advisor, 'Clave': row['ASESOR'] || '', 'Fecha_Corte': getMdrtDate(ws) || "",
            'Mes_Asesor': row['MES'] || 0, 'Polizas_Totales': row['EN VIGOR'] || 0, 'Comisones': row['TOTAL2'] || 0
        });
    }
    if (name === 'mdrt') {
        const wb = readExcelData(name, { skipJson: true, date: date });
        if (!wb)
            return res.status(404).json({ error: 'Raw file not found' });
        const ws = wb.Sheets[wb.SheetNames.find((n) => n.toUpperCase() === 'MDRT') || wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws, { range: 3 });
        const dir = getAdvisorDirectory();
        const advisorKeys = Object.keys(dir).filter(key => dir[key] === advisor);
        const row = json.find(r => String(r['Mat'] || '') === '2043' && (String(r['Nombre del Asesor'] || '') === advisor || advisorKeys.includes(String(r['Nombre del Asesor'] || '')) || String(r['Asesor'] || '') === advisor || advisorKeys.includes(String(r['Asesor'] || ''))));
        if (!row)
            return res.status(404).json({ error: 'Advisor not found' });
        const pa = Number(row['Total Prima'] || 0);
        const mMatches = Array.from(String(ws['A1']?.v || '').toLowerCase().matchAll(/(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/g));
        const lastM = mMatches.length > 0 ? mMatches[mMatches.length - 1][1] : "enero";
        return res.json({
            'Asesor': advisor, 'Clave': row['Asesor'] || '', 'Fecha_Corte': getMdrtDate(ws) || "",
            'Mes_Actual': MONTHS_ES.indexOf(lastM) + 1, 'PA_Acumulada': pa
        });
    }
    const json = readExcelData(name, { date: date });
    if (!json)
        return res.status(404).json({ error: 'Campaign not found' });
    const dir = getAdvisorDirectory();
    const advisorKeys = Object.keys(dir).filter(key => dir[key] === advisor);
    const advisorData = json.find((row) => String(row.Asesor || '') === advisor || advisorKeys.includes(String(row.Asesor || '')) || String(row.Clave || '') === advisor || advisorKeys.includes(String(row.Clave || '')));
    if (!advisorData)
        return res.status(404).json({ error: 'Advisor not found' });
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
    }
    catch (e) {
        res.status(500).json({ error: 'Could not list themes' });
    }
});
app.get('/api/active-theme', (req, res) => {
    const activePath = path.join(THEMES_PATH, 'active_theme.txt');
    let themeFile = fs.existsSync(activePath) ? fs.readFileSync(activePath, 'utf-8').trim() : 'modo_neon.json';
    const themePath = path.join(THEMES_PATH, themeFile);
    if (fs.existsSync(themePath)) {
        res.json({ file: themeFile, ...JSON.parse(fs.readFileSync(themePath, 'utf-8')) });
    }
    else
        res.status(404).json({ error: 'Theme not found' });
});
app.post('/api/active-theme', (req, res) => {
    try {
        fs.writeFileSync(path.join(THEMES_PATH, 'active_theme.txt'), req.body.themeFile);
        res.json({ success: true });
    }
    catch (e) {
        res.status(500).json({ error: 'Could not update theme' });
    }
});
app.get('/api/admin/summary', (req, res) => {
    try {
        const { date } = req.query;
        const result = {};
        const dir = getAdvisorDirectory();
        const resolveName = (cl) => dir[String(cl)] || `Asesor ${cl}`;
        const cams = ['mdrt', 'camino_cumbre', 'convenciones', 'graduacion', 'legion_centurion'];
        cams.forEach(c => {
            try {
                const wb = readExcelData(c, { skipJson: true, date: date });
                if (wb) {
                    if (c === 'mdrt') {
                        const ws = wb.Sheets[wb.SheetNames.find((n) => n.toUpperCase() === 'MDRT') || wb.SheetNames[0]];
                        const data = XLSX.utils.sheet_to_json(ws, { range: 3 });
                        result.mdrt = data.filter(r => String(r.Matriz || r['Mat'] || '') === '2043').map(r => ({ Asesor: resolveName(r.Asesor), Clave: r.Asesor || '', PA_Acumulada: Number(r.PA_Acumulada || r['Total Prima'] || 0) }));
                    }
                    else if (c === 'camino_cumbre') {
                        const ws = wb.Sheets[wb.SheetNames[0]];
                        const data = XLSX.utils.sheet_to_json(ws, { header: 1, range: 3 });
                        result.camino_cumbre = data.slice(1).filter(r => String(r[3] || '') === '2043').map(r => ({ Asesor: resolveName(r[5]), Clave: r[5] || '', Mes_Asesor: Number(r[10] || 1), Polizas_Totales: Number(r[13] || 0) }));
                    }
                    else if (c === 'convenciones') {
                        const ws = wb.Sheets[wb.SheetNames[0]];
                        const data = XLSX.utils.sheet_to_json(ws, { header: 1, range: 'A20:AI5000' });
                        // Global thresholds
                        const allRows = data.slice(1);
                        let c480 = 0, c228 = 0, c108 = 0, c28 = 0;
                        allRows.forEach(r => {
                            const l = Number(r[32]);
                            if (l === 480)
                                c480 = Number(r[24] || 0);
                            if (l === 228)
                                c228 = Number(r[24] || 0);
                            if (l === 108)
                                c108 = Number(r[24] || 0);
                            if (l === 28)
                                c28 = Number(r[24] || 0);
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
                    }
                    else if (c === 'graduacion') {
                        const ws = wb.Sheets[wb.SheetNames[0]];
                        const data = XLSX.utils.sheet_to_json(ws, { header: 1, range: 2 });
                        result.graduacion = data.slice(1).filter(r => String(r[3] || '') === '2043').map(r => ({ Asesor: r[7] ? String(r[7]) : resolveName(r[6]), Clave: r[6] || '', Mes_Asesor: Number(r[8] || 1), Polizas_Totales: Number(r[16] || 0) }));
                    }
                    else if (c === 'legion_centurion') {
                        const ws = wb.Sheets[wb.SheetNames[0]];
                        const data = XLSX.utils.sheet_to_json(ws, { header: 1, range: 11 });
                        result.legion_centurion = data.slice(1).filter(r => String(r[4] || '') === '2043').map(r => ({ Asesor: resolveName(r[6]), Clave: r[6] || '', Total_Polizas: Number(r[10] || 0), Nivel: r[13] || '' }));
                    }
                }
                else
                    result[c] = [];
            }
            catch {
                result[c] = [];
            }
        });
        res.json(result);
    }
    catch (e) {
        res.status(500).json({ error: 'Could not build admin summary' });
    }
});
app.get('/api/campaigns/dates', (req, res) => {
    try {
        const cams = ['mdrt', 'camino_cumbre', 'convenciones', 'graduacion', 'legion_centurion'];
        const result = {};
        cams.forEach(c => {
            const wb = readExcelData(c, { skipJson: true });
            if (wb) {
                const iso = extractCutoffDate(wb, c);
                if (iso) {
                    const d = iso.split('-');
                    result[c] = `${d[2]} de ${MONTHS_ES[Number(d[1]) - 1]} de ${d[0]}`;
                }
                else
                    result[c] = "";
            }
            else
                result[c] = "";
        });
        res.json(result);
    }
    catch (e) {
        res.status(500).json({ error: 'Could not read dates' });
    }
});
app.post('/api/admin/verify-password', (req, res) => {
    if (req.body.password === (process.env.ADMIN_PASSWORD || 'Panel2043'))
        res.json({ success: true });
    else
        res.status(401).json({ success: false, error: 'Contraseña incorrecta' });
});
app.get('/api/resumen-general', (req, res) => {
    try {
        const { dates } = req.query;
        const selectedDates = dates ? JSON.parse(dates) : {};
        const result = { fechas_corte: {} };
        const sinEmPath = 'administrador/asesores_sin_emision';
        const wbSin = readExcelData(sinEmPath, { skipJson: true, date: selectedDates.asesores_sin_emision });
        if (wbSin) {
            const wsP = wbSin.Sheets['Promotores'], wsA = wbSin.Sheets['Asesores'];
            result.fechas_corte['asesores_sin_emision'] = formatExcelDate(extractCutoffDate(wbSin, 'asesores_sin_emision'));
            result.asesores_sin_emision = { summaryBySucursal: [], individuals: [] };
            if (wsP) {
                const dat = XLSX.utils.sheet_to_json(wsP, { header: 1, range: 3 });
                result.asesores_sin_emision.summaryBySucursal = dat.filter((r) => String(r[3] || '') === '2043').map((r) => ({ Sucursal: r[5] || 'Descon', Suc: r[4], Agentes: Number(r[6] || 0), Asesores_con_Emisión_Vida: Number(r[7] || 0), '%_Asesores_con_Emisión_Vida': Number(r[8] || 0), Asesores_con_pol_Pagada_Vida: Number(r[11] || 0), Prima_Pagada_Vida: Number(r[15] || 0) }));
            }
            if (wsA) {
                const dat = XLSX.utils.sheet_to_json(wsA, { header: 1, range: 4 });
                result.asesores_sin_emision.individuals = dat.filter((r) => String(r[3] || '') === '2043').map((r) => ({ Asesor: r[7] || 'Descon', Clave: r[6] || '', Sucursal: r[5] || 'General', Suc: r[4], Emitido_Vida: Number(r[10] || 0), Pagado_Vida: Number(r[12] || 0), Prima_Pagada_Vida: Number(r[14] || 0), Sin_Emisión_Vida: r[16] || '' }));
            }
        }
        const pagPath = 'administrador/pagado_emitidido';
        const wbPag = readExcelData(pagPath, { skipJson: true, date: selectedDates.pagado_pendiente });
        if (wbPag) {
            const data = XLSX.utils.sheet_to_json(wbPag.Sheets[wbPag.SheetNames[0]], { header: 1 });
            result.fechas_corte['pagado_pendiente'] = formatExcelDate(extractCutoffDate(wbPag, 'pagado_pendiente'));
            result.pagado_pendiente = data.slice(3).filter(r => r[2] != null).map(r => ({ 'Nombre Asesor': r[2], 'Sucursal': r[1], 'Pólizas-Pagadas': Number(r[5] || 0), 'Total _Prima_Pagada': Number(r[8] || 0), 'Pólizas_Pendinetes': Number(r[9] || 0), 'Total _Prima_Pendiente': Number(r[12] || 0) }));
        }
        const dir = getAdvisorDirectory();
        const proPath = 'administrador/proactivos';
        const wbPro = readExcelData(proPath, { skipJson: true, date: selectedDates.proactivos });
        if (wbPro) {
            const ws = wbPro.Sheets['Detalle Asesores'];
            if (ws) {
                const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
                result.fechas_corte['proactivos'] = formatExcelDate(extractCutoffDate(wbPro, 'proactivos'));
                result.proactivos = data.slice(7).filter(r => String(r[2] || '') === '2043').map(r => ({ 'ASESOR': dir[String(r[4])] || `Asesor ${r[4]}`, 'SUC': r[3], 'Polizas_Acumuladas_Mes_Ant.': Number(r[9] || 0), 'Polizas_Del_mes': Number(r[10] || 0), 'Polizas_Acumuladas_Total': Number(r[11] || 0), 'Proactivo_al_mes': r[12] || '', 'Pólizas_Faltantes': Number(r[13] || 0) }));
            }
        }
        const compPath = 'administrador/comparativo_vida';
        const wbComp = readExcelData(compPath, { skipJson: true, date: selectedDates.comparativo_vida });
        if (wbComp) {
            const wsP = wbComp.Sheets['promotoria'], wsA = wbComp.Sheets['asesores'];
            result.fechas_corte['comparativo_vida'] = formatExcelDate(extractCutoffDate(wbComp, 'comparativo_vida'));
            let sum = null;
            if (wsP) {
                const d = XLSX.utils.sheet_to_json(wsP, { range: 2 })[0] || {};
                sum = { Polizas_Pagadas_Año_Anterior: Number(d['Polizas Pagadas Año Anterior'] || d[0] || 0), Polizas_Pagadas_Año_Actual: Number(d['Polizas Pagadas Año Actual'] || d[1] || 0), Prima_Pagada_Año_Anterior: Number(d['Prima Pagada Año Anterior'] || d[4] || 0), Prima_Pagada_Año_Actual: Number(d['Prima Pagada Año Actual'] || d[5] || 0) };
            }
            let inds = wsA ? XLSX.utils.sheet_to_json(wsA, { range: 1 }).filter((r) => String(r['MAT'] || '') === '2043').map((r) => ({ 'Nombre del Asesor': r['Nombre'], 'Sucursal': r['Sucursal'], 'Polizas_Pagadas_Año_Anterior': Number(r['Pzs Pag Ant'] || 0), 'Polizas_Pagadas_Año_Actual': Number(r['Pzs Pag Act'] || 0), 'Prima_Pagada_Año_Anterior': Number(r['Pri Pag Ant'] || 0), 'Prima_Pagada_Año_Actual': Number(r['Pri Pag Act'] || 0) })) : [];
            result.comparativo_vida = { individuals: inds, generalSummary: sum };
        }
        res.json(result);
    }
    catch (e) {
        res.status(500).json({ error: 'Could not read summary data' });
    }
});
// ===================== ESTATUS DE PÓLIZAS =====================
const POLIZAS_PATH = path.join(BASE_PATH, 'estatus polizas');
app.get('/api/estatus-polizas/fechas', (req, res) => {
    try {
        const reportesPath = path.join(POLIZAS_PATH, 'reportes');
        if (!fs.existsSync(reportesPath))
            return res.json([]);
        const fechas = [];
        fs.readdirSync(reportesPath, { withFileTypes: true }).filter(d => d.isDirectory() && /^\d{4}-\d{2}$/.test(d.name)).forEach(dir => {
            fs.readdirSync(path.join(reportesPath, dir.name)).filter(f => f.startsWith('reporte_') && f.endsWith('.json')).forEach(f => {
                const m = f.match(/reporte_(\d{4}-\d{2}-\d{2})\.json/);
                if (m)
                    fechas.push(m[1]);
            });
        });
        res.json(fechas.sort().reverse());
    }
    catch (e) {
        res.status(500).json({ error: 'Could not list dates' });
    }
});
app.get('/api/estatus-polizas/reporte/:fecha', (req, res) => {
    try {
        const { fecha } = req.params;
        const p = path.join(POLIZAS_PATH, 'reportes', fecha.substring(0, 7), `reporte_${fecha}.json`);
        if (!fs.existsSync(p))
            return res.status(404).json({ error: 'Not found' });
        res.json(JSON.parse(fs.readFileSync(p, 'utf-8')));
    }
    catch (e) {
        res.status(500).json({ error: 'Read error' });
    }
});
app.get('/api/estatus-polizas/cambios/:fecha', (req, res) => {
    try {
        const { fecha } = req.params;
        const p = path.join(POLIZAS_PATH, 'cambios', fecha.substring(0, 7), `cambios_${fecha}.json`);
        if (!fs.existsSync(p))
            return res.json(null);
        res.json(JSON.parse(fs.readFileSync(p, 'utf-8')));
    }
    catch (e) {
        res.status(500).json({ error: 'Read error' });
    }
});
app.get('/api/estatus-polizas/seguimiento', (req, res) => {
    try {
        const p = path.join(POLIZAS_PATH, 'seguimiento', 'seguimiento_activo.json');
        if (!fs.existsSync(p))
            return res.json({ ultima_actualizacion: null, pendientes_recuperar: [], recuperadas_este_mes: [] });
        res.json(JSON.parse(fs.readFileSync(p, 'utf-8')));
    }
    catch (e) {
        res.status(500).json({ error: 'Read error' });
    }
});
app.use((req, res) => {
    if (req.path.startsWith('/api'))
        return res.status(404).json({ error: 'API not found' });
    if (path.extname(req.path))
        return res.status(404).send('Not found');
    const p = path.join(DIST_PATH, 'index.html');
    if (fs.existsSync(p)) {
        res.setHeader('Content-Type', 'text/html');
        res.sendFile(p);
    }
    else
        res.status(404).send('Frontend not built.');
});
app.listen(PORT, '0.0.0.0', () => console.log(`Server running at http://0.0.0.0:${PORT}`));
