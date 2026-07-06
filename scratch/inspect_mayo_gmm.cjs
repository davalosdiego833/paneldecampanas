const XLSX = require('xlsx');
const inputPath = '/Users/diego/Desktop/panel de campañas/VENTAS_MENSUALES/VENTAS MENSUALES.xlsx';
const wb = XLSX.readFile(inputPath);
const ws = wb.Sheets['MAYO'];
const data = XLSX.utils.sheet_to_json(ws, {header: 1, defval: null});

console.log('=== GMM TABLE IN MAYO ===');
for (let i = 0; i < 20; i++) {
    const row = data[i];
    if (row && (row[8] !== null || row[9] !== null)) {
        console.log(`Row ${i}: ${row[8]} | ${row[9]} | ${row[10]} | ${row[11]}`);
    }
}
