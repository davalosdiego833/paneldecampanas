const XLSX = require('xlsx');

const proPath = '/Users/diego/Desktop/panel de campañas/administrador/proactivos/Proactivos.xlsx';
const wb = XLSX.readFile(proPath);
console.log('Sheet Names:', wb.SheetNames);
const ws = wb.Sheets['Detalle Asesores'] || wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
console.log('First 15 rows:');
for (let i = 0; i < 15; i++) {
    console.log(`Row ${i}:`, data[i]);
}
