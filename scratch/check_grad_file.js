import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

const BASE_PATH = process.cwd();
const gradPath = path.join(BASE_PATH, 'graduacion');
const files = fs.readdirSync(gradPath).filter(f => (f.endsWith('.xlsx') || f.endsWith('.xlsm')) && !f.startsWith('~$'));

const getMostRecentFile = (dirPath) => {
    if (!fs.existsSync(dirPath)) return null;
    const files = fs.readdirSync(dirPath).filter(f => (f.endsWith('.xlsx') || f.endsWith('.xlsm')) && !f.startsWith('~$'));
    if (files.length === 0) return null;
    return files.map(f => {
        const fullPath = path.join(dirPath, f);
        return { file: f, mtime: fs.statSync(fullPath).mtime.getTime() };
    }).sort((a, b) => b.mtime - a.mtime)[0].file;
};

const file = getMostRecentFile(gradPath);
if (file) {
    const full = path.join(gradPath, file);
    const wb = XLSX.readFile(full);
    let wsName = wb.SheetNames.find(n => n.toLowerCase().includes('encuentroii') || n.toLowerCase().includes('desarrollo (2)') || n.toLowerCase().includes('detalle') || n.toLowerCase().includes('asesores'));
    if (!wsName) wsName = wb.SheetNames[0];
    const ws = wb.Sheets[wsName];
    
    // Extract headers and data
    const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 });
    let headerIdx = -1;
    for (let i = 0; i < Math.min(30, rawData.length); i++) {
        const row = rawData[i];
        if (row && row.some(cell => {
            const c = String(cell).toLowerCase().trim();
            return c === 'asesor' || c === 'mat' || c === 'mat / unidad' || c === 'nombre del asesor';
        })) {
            headerIdx = i;
            break;
        }
    }
    if (headerIdx === -1) headerIdx = 0;
    const data = XLSX.utils.sheet_to_json(ws, { range: headerIdx });
    
    console.log('Headers from sheet:', Object.keys(data[0] || {}));
    console.log('First 3 data rows:', data.slice(0, 3));
} else {
    console.log('No graduacion file found');
}
