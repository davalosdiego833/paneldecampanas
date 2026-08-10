import XLSX from 'xlsx';
import path from 'path';

const excelPath = path.join(process.cwd(), 'VENTAS_MENSUALES', 'VENTAS MENSUALES.xlsx');
const wb = XLSX.readFile(excelPath, { cellFormulas: true });
const sheet = wb.Sheets['JULIO'];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

console.log(`\n=== JULIO SHEET CONTENTS (${data.length} rows) ===`);
data.forEach((r, i) => {
    if (r.some(c => c !== '')) {
        console.log(`Row ${i+1}:`, JSON.stringify(r));
    }
});
