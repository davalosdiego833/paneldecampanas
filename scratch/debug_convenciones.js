import XLSX from 'xlsx';
const wb = XLSX.readFile('convenciones/Convenciones Asesores.xlsx');
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws, { header: 1, range: 0 });
console.log(data.slice(0, 15));
