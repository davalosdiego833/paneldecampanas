import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

const BASE_PATH = '/Users/diego/Desktop/panel de campañas';
const SUCURSALES_PROMO = ['2043'];

// Helper functions from actualizar_snapshot.js
const getMostRecentFile = (dir) => {
    if (!fs.existsSync(dir)) return null;
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.xlsx') || f.endsWith('.xlsm') || f.endsWith('.xls'));
    if (files.length === 0) return null;
    return files.sort((a, b) => {
        return fs.statSync(path.join(dir, b)).mtime.getTime() - fs.statSync(path.join(dir, a)).mtime.getTime();
    })[0];
};

const readExcelSheetMemorySafe = (filePath, sheetSelector) => {
    const tempWb = XLSX.readFile(filePath, { bookSheets: true });
    let targetSheet = null;
    if (typeof sheetSelector === 'function') {
        targetSheet = tempWb.SheetNames.find(sheetSelector);
    } else if (typeof sheetSelector === 'string') {
        targetSheet = tempWb.SheetNames.find(n => n.toUpperCase() === sheetSelector.toUpperCase());
    } else if (typeof sheetSelector === 'number') {
        targetSheet = tempWb.SheetNames[sheetSelector];
    }
    if (!targetSheet) {
        targetSheet = tempWb.SheetNames[0];
    }
    return XLSX.readFile(filePath, { sheets: [targetSheet] });
};

const cleanNameText = (text) => {
    if (!text) return '';
    return String(text)
        .replace(/Ð/g, 'Ñ')
        .replace(/ð/g, 'ñ')
        .replace(/Ý/g, 'Í')
        .replace(/ã/g, 'á')
        .replace(/õ/g, 'õ')
        .trim();
};

const resolveName = (idOrName) => {
    return cleanNameText(idOrName);
};

const extractData = (ws) => {
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
    if (headerIdx === -1) return [];
    const headers = rawData[headerIdx].map(h => String(h || '').trim());
    const rows = [];
    for (let i = headerIdx + 1; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row || row.length === 0) continue;
        const obj = {};
        headers.forEach((h, colIdx) => {
            if (h) {
                obj[h] = row[colIdx];
            }
        });
        rows.push(obj);
    }
    return rows;
};

try {
    const mdrtPath = path.join(BASE_PATH, 'mdrt');
    const recentFile = getMostRecentFile(mdrtPath);
    console.log('Recent file:', recentFile);
    if (recentFile) {
        const fullPath = path.join(mdrtPath, recentFile);
        const wb = readExcelSheetMemorySafe(fullPath, n => n.toUpperCase() === 'MDRT');
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = extractData(ws);
        console.log('Total parsed rows in step:', data.length);
        
        const filtered = data.filter(r => {
            const matKey = Object.keys(r).find(k => k && (k.trim().toUpperCase() === 'MATRIZ' || k.trim().toUpperCase() === 'MAT' || k.trim().toUpperCase() === 'MAT / UNIDAD'));
            const matches = SUCURSALES_PROMO.includes(String(r[matKey] || ''));
            return matches;
        });
        console.log('Filtered rows in step:', filtered.length);
        
        const mapped = filtered.map(r => {
            const paKey = Object.keys(r).find(k => k && (k.trim().toUpperCase() === 'TOTAL PRIMA' || k.trim().toUpperCase() === 'CAMINO PRIMA' || k.trim().toUpperCase() === 'PRIMA ANUALIZADA' || k.trim().toUpperCase() === 'PRIMA PONDERADA MDRT'));
            const nameKey = Object.keys(r).find(k => k && (k.trim().toUpperCase() === 'NOMBRE DEL ASESOR' || k.trim().toUpperCase() === 'ASESOR'));
            const claveKey = r['Clave'] ? 'Clave' : (Object.keys(r).find(k => k && k.trim().toUpperCase() === 'ASESOR') || nameKey);
            return { Asesor: resolveName(r[claveKey] || r[nameKey]), Clave: String(r[claveKey] || ''), PA_Acumulada: Number(r[paKey] || 0) };
        });
        console.log('Mapped sample:', mapped.slice(0, 5));
    }
} catch (e) {
    console.error('Error running debug:', e);
}
