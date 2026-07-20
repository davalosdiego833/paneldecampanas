const XLSX = require('xlsx');

const wbGrad = XLSX.readFile('graduacion/Graduacion Asesores.xlsm');
for (const sName of ['Asesores en Desarrollo', 'Asesores Transitorios ', 'Asesores en Desarrollo (2)']) {
    console.log(`\n================ Sheet: ${sName} ================`);
    const ws = wbGrad.Sheets[sName];
    if (!ws) { console.log('Sheet not found'); continue; }
    const raw = XLSX.utils.sheet_to_json(ws, { header: 1 });
    for (let i = 0; i < Math.min(25, raw.length); i++) {
        if (raw[i] && raw[i].length > 0) {
            console.log(`Row ${i}:`, raw[i].slice(0, 15));
        }
    }
}
