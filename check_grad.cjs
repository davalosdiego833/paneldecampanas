const XLSX = require('xlsx');
const wb = XLSX.readFile('graduacion/Graduacion Asesores.xlsm');
console.log('Sheets:', wb.SheetNames);
for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(ws, {header: 1});
    console.log(`\nSheet: ${sheetName}`);
    for(let i=0; i<Math.min(10, data.length); i++) {
        console.log(data[i]);
    }
}
