const XLSX = require('xlsx');
const wb = XLSX.readFile('/Users/diego/Desktop/panel de campañas/VENTAS_MENSUALES/JUNIO_CORREGIDO_RESULTADO.xlsx');
const ws = wb.Sheets['JUNIO_CORREGIDO'];
const data = XLSX.utils.sheet_to_json(ws);

console.log('Total rows in JUNIO result:', data.length);
console.log('Unique Asesor names count:', new Set(data.map(r => r.Asesor)).size);
console.log('Any duplicates?', data.length !== new Set(data.map(r => r.Asesor)).size);

// Print rows matching Darinka
console.log('\nDarinka entries in output:');
console.log(data.filter(r => r.Asesor && r.Asesor.includes('DARINKA')));
