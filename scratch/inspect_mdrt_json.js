import XLSX from 'xlsx';
import path from 'path';

const mdrtPath = '/Users/diego/Desktop/panel de campañas/mdrt/MDRT Asesores.xlsm';
const tempWb = XLSX.readFile(mdrtPath, { bookSheets: true });
const targetSheetName = tempWb.SheetNames.find(n => n.toUpperCase() === 'MDRT') || tempWb.SheetNames[0];
const wb = XLSX.readFile(mdrtPath, { sheets: [targetSheetName] });
const ws = wb.Sheets[targetSheetName];

// SUCURSALES_PROMO
const SUCURSALES_PROMO = ['2043'];

// Helper from actualizar_snapshot.js
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
    console.log('Detected headers:', headers);

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

const data = extractData(ws);
console.log('Total parsed rows:', data.length);
if (data.length > 0) {
    console.log('Sample parsed row 0:', data[0]);
    console.log('Sample keys of row 0:', Object.keys(data[0]));
}

const filtered = data.filter(r => {
    const matKey = Object.keys(r).find(k => k && (k.trim().toUpperCase() === 'MATRIZ' || k.trim().toUpperCase() === 'MAT' || k.trim().toUpperCase() === 'MAT / UNIDAD'));
    const matVal = String(r[matKey] || '');
    if (matVal === '2043' || matVal === '2856') {
        console.log('Found matVal in filtered:', matVal, r);
    }
    return SUCURSALES_PROMO.includes(matVal);
});

console.log('Total filtered rows for SUCURSALES_PROMO:', filtered.length);
