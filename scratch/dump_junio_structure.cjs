const XLSX = require('xlsx');
const inputPath = '/Users/diego/Desktop/panel de campañas/VENTAS_MENSUALES/VENTAS MENSUALES.xlsx';
const wb = XLSX.readFile(inputPath);
const ws = wb.Sheets['JUNIO'];
const data = XLSX.utils.sheet_to_json(ws, {header: 1, defval: null});

console.log('=== MAIN TABLE ROWS (Col 0: Asesor) ===');
for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row && row[0]) {
        console.log(`Row ${i}: ${row[0]} | Polizas: ${row[1]} | Vida: ${row[2]} | PrimaVida: ${row[3]} | GMM: ${row[4]} | PrimaGMM: ${row[5]} | Total: ${row[6]}`);
        if (row[0].toUpperCase() === 'TOTAL') {
            console.log(`--- Main Table Ends at Row ${i} ---`);
        }
    }
}

console.log('\n=== GMM TABLE ROWS (Col 8) ===');
for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row && row[8]) {
        console.log(`Row ${i}: ${row[8]} | Col9: ${row[9]} | Col10: ${row[10]} | Col11: ${row[11]}`);
    }
}

console.log('\n=== CONFIRMACION TABLE ROWS (Col 0, from row 54 onwards) ===');
let confStarted = false;
for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (row && row[0] && row[0].toUpperCase() === 'ASESOR' && row[1] && row[1].toUpperCase() === 'FRECUENCIA') {
        confStarted = true;
        console.log(`--- Confirmacion Starts at Row ${i} ---`);
        continue;
    }
    if (confStarted && row && row[0]) {
        console.log(`Row ${i}: ${row[0]} | Frec: ${row[1]} | Ramo: ${row[2]} | MontoAnual: ${row[3]} | MontoReal: ${row[4]}`);
    }
}
