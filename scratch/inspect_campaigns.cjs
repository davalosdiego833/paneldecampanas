const XLSX = require('xlsx');

console.log('=== INSPECTING CAMINO A LA CUMBRE ALL SHEETS ===');
const wbCC = XLSX.readFile('camino_cumbre/Camino a la Cumbre.xlsx');
for (const sName of wbCC.SheetNames) {
    console.log(`\n--- Sheet CC: ${sName} ---`);
    const ws = wbCC.Sheets[sName];
    const raw = XLSX.utils.sheet_to_json(ws, { header: 1 });
    for (let i = 0; i < Math.min(35, raw.length); i++) {
        if (raw[i] && raw[i].length > 0) {
            console.log(`Row ${i}:`, raw[i].slice(0, 15));
        }
    }
}

console.log('\n=== INSPECTING GRADUACION ALL SHEETS ===');
const wbGrad = XLSX.readFile('graduacion/Graduacion Asesores.xlsm');
for (const sName of wbGrad.SheetNames) {
    console.log(`\n--- Sheet Grad: ${sName} ---`);
    const ws = wbGrad.Sheets[sName];
    const raw = XLSX.utils.sheet_to_json(ws, { header: 1 });
    for (let i = 0; i < Math.min(35, raw.length); i++) {
        if (raw[i] && raw[i].length > 0) {
            console.log(`Row ${i}:`, raw[i].slice(0, 15));
        }
    }
}
