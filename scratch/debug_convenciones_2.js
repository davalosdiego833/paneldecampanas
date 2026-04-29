import XLSX from 'xlsx';
const wb = XLSX.readFile('convenciones/Convenciones Asesores.xlsx');
console.log('Sheets:', wb.SheetNames);
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws, { header: 1, range: 0 });
console.log('Rows count:', data.length);
// Find first row with data
const firstDataRow = data.findIndex(r => r.length > 0);
console.log('First data row index:', firstDataRow);
if (firstDataRow !== -1) {
    console.log('First 5 data rows:', data.slice(firstDataRow, firstDataRow + 5));
}
