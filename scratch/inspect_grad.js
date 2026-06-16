import XLSX from 'xlsx';
import path from 'path';

const gradPath = '/Users/diego/Desktop/panel de campañas/graduacion/Graduacion Asesores.xlsm';
const tempWb = XLSX.readFile(gradPath, { bookSheets: true });
console.log('Graduacion Sheets:', tempWb.SheetNames);

const selector = n => n.toLowerCase().includes('encuentroii') || n.toLowerCase().includes('desarrollo (2)') || n.toLowerCase().includes('detalle') || n.toLowerCase().includes('asesores');
const targetSheet = tempWb.SheetNames.find(selector) || tempWb.SheetNames[0];
console.log('Selected sheet:', targetSheet);

const wb = XLSX.readFile(gradPath, { sheets: [targetSheet] });
const ws = wb.Sheets[targetSheet];
const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
console.log('First 20 rows of Graduacion:');
for (let r = 0; r < Math.min(20, data.length); r++) {
    console.log(`Row ${r}:`, data[r]);
}
