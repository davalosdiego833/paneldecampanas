import XLSX from 'xlsx';
import path from 'path';

const excelPath = path.join(process.cwd(), 'VENTAS_MENSUALES', 'VENTAS MENSUALES.xlsx');
const wb = XLSX.readFile(excelPath, { cellFormulas: true });

const sheetName = wb.SheetNames.find(s => s.trim() === 'JULIO');
console.log(`Found Sheet Name: '${sheetName}'`);
const sheet = wb.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

console.log(`\n=== ROWS IN '${sheetName}' (${data.length} rows) ===`);
data.forEach((r, i) => console.log(`Row ${i+1}:`, JSON.stringify(r)));
