const XLSX = require('xlsx');
const inputPath = '/Users/diego/Desktop/panel de campañas/VENTAS_MENSUALES/VENTAS MENSUALES.xlsx';
const wb = XLSX.readFile(inputPath);
const ws = wb.Sheets['JUNIO'];
const data = XLSX.utils.sheet_to_json(ws, {header: 1, defval: null});

console.log('=== MAIN TABLE ===');
for (let i = 0; i < 54; i++) {
    const row = data[i];
    if (row) {
        console.log(`Row ${i}: ${row[0]} | ${row[1]} | ${row[2]} | ${row[3]} | ${row[4]} | ${row[5]} | ${row[6]}`);
    }
}
