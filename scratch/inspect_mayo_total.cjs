const XLSX = require('xlsx');
const inputPath = '/Users/diego/Desktop/panel de campañas/VENTAS_MENSUALES/VENTAS MENSUALES.xlsx';
const wb = XLSX.readFile(inputPath);
const ws = wb.Sheets['MAYO'];
const data = XLSX.utils.sheet_to_json(ws, {header: 1, defval: null});

for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (row && row[0] && row[0].toString().trim().toUpperCase() === 'TOTAL') {
        console.log(`MAYO Row ${i}:`, row);
    }
}
