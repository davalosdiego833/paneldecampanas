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

// Helper to read Excel
const readExcelData = (folderName: string) => {
    const folderPath = path.join(BASE_PATH, folderName);
    if (!fs.existsSync(folderPath) || !fs.lstatSync(folderPath).isDirectory()) return null;

    try {
        const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.xlsx') && !f.startsWith('~$'));
        console.log(`[DEBUG] Files in ${folderName}: ${JSON.stringify(files)}`);

        if (files.length === 0) return null;

        const filePath = path.join(folderPath, files[0]);
        console.log(`[DEBUG] Reading file: ${filePath}`);
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        console.log(`[DEBUG] Rows found: ${json.length}`);
        if (json.length > 0) console.log('[DEBUG] First row keys:', Object.keys(json[0] as any));
        return json;
    } catch (error) {
        console.error(`Error reading folder/file ${folderName}:`, error);
        return null;
    }
};

// Endpoints
app.get('/api/campaigns', (req, res) => {
    const exclude = ['assets', 'themes', 'server', 'node_modules', 'src', 'public', '.git', 'dist', '.conda', 'administrador'];
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
        const exclude = ['assets', 'themes', 'server', 'node_modules', 'src', 'public', '.git', 'dist', '.conda', 'administrador'];
        const folders = fs.readdirSync(BASE_PATH, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory() && !exclude.includes(dirent.name) && !dirent.name.startsWith('.'))
            .map(dirent => dirent.name);

        const allNames = new Set<string>();
        console.log('[DEBUG] Processing folders:', folders);
        folders.forEach(folder => {
            const data: any = readExcelData(folder);
            if (data) {
                console.log(`[DEBUG] Loaded ${data.length} rows from ${folder}`);
                data.forEach((row: any) => {
                    if (row.Asesor) allNames.add(row.Asesor);
                });
            } else {
                console.log(`[DEBUG] No data for ${folder}`);
            }
        });

        // Manual surgical removal as in original app.py
        const forbiddenVersion = "ANA LAURA CONTRERAS IÑIGUEZ";
        const advisorList = Array.from(allNames).filter(name => name !== forbiddenVersion).sort();

        res.json(advisorList);
    } catch (error) {
        res.status(500).json({ error: 'Could not list advisors' });
    }
});

app.get('/api/campaign/:name/data/:advisor', (req, res) => {
    const { name, advisor } = req.params;
    const data: any = readExcelData(name);
    if (!data) return res.status(404).json({ error: 'Campaign not found' });

    const advisorData = data.find((row: any) => row.Asesor === advisor);
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


// Admin endpoint: get ALL data for ALL campaigns
app.get('/api/admin/summary', (req, res) => {
    try {
        const campaignFolders = ['mdrt', 'camino_cumbre', 'convenciones', 'graduacion', 'legion_centurion'];
        const result: Record<string, any[]> = {};

        campaignFolders.forEach(folder => {
            const data = readExcelData(folder);
            if (data) {
                result[folder] = data as any[];
            } else {
                result[folder] = [];
            }
        });

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
        const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

        const formatExcelDate = (serial: number): string => {
            const excelEpoch = new Date(Date.UTC(1899, 11, 30));
            const dt = new Date(excelEpoch.getTime() + serial * 86400000);
            const day = dt.getUTCDate();
            const month = meses[dt.getUTCMonth()];
            const year = dt.getUTCFullYear();
            return `${day} de ${month} de ${year}`;
        };

        const result: Record<string, string> = {};

        campaignFolders.forEach(folder => {
            const data = readExcelData(folder) as any[];
            if (data && data.length > 0 && data[0].Fecha_Corte != null) {
                const raw = data[0].Fecha_Corte;
                if (typeof raw === 'number' && raw > 30000) {
                    result[folder] = formatExcelDate(raw);
                } else {
                    result[folder] = String(raw);
                }
            } else {
                result[folder] = '';
            }
        });

        res.json(result);
    } catch (error) {
        console.error('Error reading campaign dates:', error);
        res.status(500).json({ error: 'Could not read campaign dates' });
    }
});

// Resumen General endpoint: reads resumen_general.xlsx with all 4 sheets
app.get('/api/resumen-general', (req, res) => {
    try {
        const filePath = path.join(BASE_PATH, 'administrador', 'resumen_general.xlsx');
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'resumen_general.xlsx not found' });
        }

        const workbook = XLSX.readFile(filePath);
        const result: Record<string, any> = {};

        // Extract cut-off date from cell A1 of the first sheet
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const cellA1 = firstSheet?.['A1'];
        let fechaCorte = '';
        if (cellA1) {
            if (cellA1.w) {
                // Use the formatted value from Excel (e.g. "Feb-06")
                fechaCorte = cellA1.w;
            } else if (cellA1.v) {
                // Fallback: convert serial to date
                const d = XLSX.SSF.parse_date_code(cellA1.v);
                if (d) {
                    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                    // Excel 2-digit year: if < 30 assume 2000s, else 1900s
                    const year = d.y < 100 ? (d.y < 30 ? 2000 + d.y : 1900 + d.y) : d.y;
                    fechaCorte = `${months[d.m - 1]} ${year}`;
                }
            }
        }
        result['fecha_corte'] = fechaCorte;

        // All sheets have a date in row 1, real headers in row 2, data from row 3
        const sheetConfigs: Record<string, string> = {
            'pagado_pendiente': 'pagado_pendiente',
            'asesores_sin_emision': 'asesores_sin_emision',
            'proactivos': 'proactivos',
            'comparativo_vida': 'comparativo_vida'
        };

        for (const [key, sheetName] of Object.entries(sheetConfigs)) {
            const worksheet = workbook.Sheets[sheetName];
            if (!worksheet) {
                result[key] = [];
                continue;
            }

            const allData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

            if (allData.length < 2) {
                result[key] = [];
                continue;
            }

            const headers = allData[1] as string[];
            const dataRows = allData.slice(2);

            if (key === 'asesores_sin_emision') {
                const individualHeaders = headers.slice(0, 12);
                const summaryHeaders = headers.slice(13, 25);
                const individuals: any[] = [];
                const summaryBySucursal: any[] = [];

                dataRows.forEach((row: any[]) => {
                    if (row[0] != null) {
                        const obj: any = {};
                        individualHeaders.forEach((h, i) => { if (h) obj[h] = row[i] ?? null; });
                        individuals.push(obj);
                    }
                    if (row[13] != null) {
                        const obj: any = {};
                        summaryHeaders.forEach((h, i) => { if (h) obj[h] = row[13 + i] ?? null; });
                        summaryBySucursal.push(obj);
                    }
                });
                result[key] = { individuals, summaryBySucursal };
            } else if (key === 'comparativo_vida') {
                const individualHeaders = headers.slice(0, 10);
                const summaryHeaders = headers.slice(12, 28);
                const individuals: any[] = [];
                let generalSummary: any = null;

                dataRows.forEach((row: any[]) => {
                    if (row[0] != null) {
                        const obj: any = {};
                        individualHeaders.forEach((h, i) => { if (h) obj[h] = row[i] ?? null; });
                        individuals.push(obj);
                    }
                    if (row[12] != null && !generalSummary) {
                        const obj: any = {};
                        summaryHeaders.forEach((h, i) => { if (h) obj[h] = row[12 + i] ?? null; });
                        generalSummary = obj;
                    }
                });
                result[key] = { individuals, generalSummary };
            } else {
                const items: any[] = [];
                dataRows.forEach((row: any[]) => {
                    if (row[0] != null) {
                        const obj: any = {};
                        headers.forEach((h, i) => { if (h) obj[h] = row[i] ?? null; });
                        items.push(obj);
                    }
                });
                result[key] = items;
            }
        }

        res.json(result);
    } catch (error) {
        console.error('Error reading resumen general:', error);
        res.status(500).json({ error: 'Could not read resumen general data' });
    }
});

// SPA Fallback — only for routes without file extensions (not static assets)
app.get('*', (req, res) => {
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
