const XLSX = require('xlsx');
const inputPath = '/Users/diego/Desktop/panel de campañas/VENTAS_MENSUALES/VENTAS MENSUALES.xlsx';
const wb = XLSX.readFile(inputPath);
const ws = wb.Sheets['JUNIO'];
if (!ws) {
    console.log('Error: JUNIO sheet not found!');
    process.exit(1);
}
const data = XLSX.utils.sheet_to_json(ws, {header: 1, defval: null});
console.log('Total rows:', data.length);
console.log('First 10 rows:');
for (let i = 0; i < Math.min(data.length, 20); i++) {
    console.log(`Row ${i}:`, data[i]);
}

// Let's search for "ASESOR" or other sections to find columns
console.log('\nScanning for sections...');
for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (row && row.some(cell => typeof cell === 'string' && cell.toUpperCase().includes('ASESOR'))) {
        console.log(`Row ${i} contains ASESOR:`, row);
    }
}
