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
const BASE_PATH = path.join(__dirname, '..');
const ASSETS_PATH = path.join(BASE_PATH, 'assets');
const THEMES_PATH = path.join(BASE_PATH, 'themes');

app.use(cors());
app.use(express.json());

// Serve static assets
app.use('/assets', express.static(ASSETS_PATH));

// Serve Frontend Build
const DIST_PATH = path.join(BASE_PATH, 'dist');
app.use(express.static(DIST_PATH));

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
    const exclude = ['assets', 'themes', 'server', 'node_modules', 'src', 'public', '.git', 'dist', '.conda'];
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
        const exclude = ['assets', 'themes', 'server', 'node_modules', 'src', 'public', '.git', 'dist', '.conda'];
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


// SPA Fallback
app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    const indexPath = path.join(DIST_PATH, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('Frontend not built. Please run npm run build.');
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
});
