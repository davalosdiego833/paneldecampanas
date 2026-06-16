import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

const mdrtPath = '/Users/diego/Desktop/panel de campañas/mdrt/MDRT Asesores.xlsm';
console.log('Reading workbook sheets...');
const tempWb = XLSX.readFile(mdrtPath, { bookSheets: true });
console.log('Sheets found:', tempWb.SheetNames);

const targetSheetName = tempWb.SheetNames.find(n => n.toUpperCase() === 'MDRT') || tempWb.SheetNames[0];
console.log('Reading sheet:', targetSheetName);
const wb = XLSX.readFile(mdrtPath, { sheets: [targetSheetName] });
const ws = wb.Sheets[targetSheetName];

const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
console.log('First 35 rows of sheet:');
for (let r = 0; r < Math.min(35, data.length); r++) {
    const row = data[r];
    if (row && row.length > 0) {
        console.log(`Row ${r}:`, row.slice(0, 10));
    }
}
