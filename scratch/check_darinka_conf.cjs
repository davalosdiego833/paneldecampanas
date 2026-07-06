const XLSX = require('xlsx');
const inputPath = '/Users/diego/Desktop/panel de campañas/VENTAS_MENSUALES/VENTAS MENSUALES.xlsx';
const wb = XLSX.readFile(inputPath);
const ws = wb.Sheets['MAYO'];
const data = XLSX.utils.sheet_to_json(ws, {header: 1, defval: null});

function cleanName(name) {
    if(!name) return '';
    return name.replace(/[0-9]+/g, '').replace(/Ñ/g, 'Ñ').trim().toUpperCase();
}

console.log('=== CONFIRMACION DARINKA ===');
for (let i = 50; i < data.length; i++) {
    const row = data[i];
    if (row && row[0] && row[0].includes('DARINKA')) {
        console.log(`CONF Row ${i}: [${row[0]}] -> clean: [${cleanName(row[0])}]`);
    }
}
