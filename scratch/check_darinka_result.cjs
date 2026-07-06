const XLSX = require('xlsx');
const wb = XLSX.readFile('/Users/diego/Desktop/panel de campañas/VENTAS_MENSUALES/MAYO_CORREGIDO_RESULTADO.xlsx');
const ws = wb.Sheets['MAYO_CORREGIDO'];
const data = XLSX.utils.sheet_to_json(ws);

console.log('All entries matching DARINKA in result:');
console.log(data.filter(r => r.Asesor && r.Asesor.includes('DARINKA')));
