const XLSX = require('xlsx');

const wbGrad = XLSX.readFile('graduacion/Graduacion Asesores.xlsm');
const ws = wbGrad.Sheets['Asesores en Desarrollo'];
const raw = XLSX.utils.sheet_to_json(ws, { header: 1 });
console.log('Row 15 full headers:');
console.log(raw[15]);
console.log('Row 16 data:');
console.log(raw[16]);
console.log('Row 17 data:');
console.log(raw[17]);
