const XLSX = require('xlsx');
const path = require('path');

const filePath = './convenciones/Convenciones Asesores.xlsx';
const wb = XLSX.readFile(filePath);
const ws = wb.Sheets[wb.SheetNames[0]];

// Leer filas de A15 a A25 para encontrar la fila de cabeceras
const data = XLSX.utils.sheet_to_json(ws, { header: 1, range: 'A15:AP25' });
data.forEach((r, idx) => {
    console.log(`Row ${idx + 15}:`, r.slice(0, 40).map((v, i) => `${i}: ${v}`));
});
