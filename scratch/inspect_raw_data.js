import XLSX from 'xlsx';
import path from 'path';

const mdrtPath = '/Users/diego/Desktop/panel de campañas/mdrt/MDRT Asesores.xlsm';
const tempWb = XLSX.readFile(mdrtPath, { bookSheets: true });
const targetSheetName = tempWb.SheetNames.find(n => n.toUpperCase() === 'MDRT') || tempWb.SheetNames[0];
const wb = XLSX.readFile(mdrtPath, { sheets: [targetSheetName] });
const ws = wb.Sheets[targetSheetName];

const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 });
console.log('rawData length:', rawData.length);

let headerIdx = -1;
for (let i = 0; i < Math.min(30, rawData.length); i++) {
    const row = rawData[i];
    if (row && row.some(cell => {
        const c = String(cell).toLowerCase().trim();
        const matches = c === 'asesor' || c === 'mat' || c === 'mat / unidad' || c === 'nombre del asesor';
        if (matches) {
            console.log(`Matched row ${i} with cell: "${cell}"`);
        }
        return matches;
    })) {
        headerIdx = i;
        break;
    }
}
console.log('headerIdx:', headerIdx);
