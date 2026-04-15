
const XLSX = require('xlsx');
const path = require('path');

// THE CORRECT PATH FOUND VIA list_dir
const filePath = '/Users/diego/Desktop/panel de campañas/administrador/comparativo_vida/comparativo vida.xlsx';

try {
    const wb = XLSX.readFile(filePath);
    console.log('--- SHEETS FOUND ---');
    console.log(wb.SheetNames);

    console.log('\n--- LOOKING FOR SHEET "promotoria" ---');
    const wsNames = wb.SheetNames;
    const pName = wsNames.find(n => n.toLowerCase().trim() === 'promotoria');
    console.log('Final Sheet Name Match:', pName);

    if (pName) {
        const wsP = wb.Sheets[pName];
        const rawP = XLSX.utils.sheet_to_json(wsP, { header: 1 });
        console.log('\n--- SHEET: promotoria (Exact Rows) ---');
        rawP.slice(0, 10).forEach((row, i) => {
            console.log(`Row ${i + 1} (Index ${i}): ${JSON.stringify(row)}`);
        });
        
        const dataRow = rawP[4];
        if (dataRow) {
            console.log('\n--- DATA ROW (INDEX 4 / FILA 5) ---');
            console.log('Raw:', JSON.stringify(dataRow));
            console.log('Col 0 (Pol Ant):', dataRow[0]);
            console.log('Col 1 (Pol Act):', dataRow[1]);
            console.log('Col 2 (Crec Pol):', dataRow[2]);
            console.log('Col 3 (% Crec Pol):', dataRow[3]);
        }
    }

    console.log('\n--- LOOKING FOR SHEET "asesores" ---');
    const aName = wsNames.find(n => n.toLowerCase().trim() === 'asesores');
    if (aName) {
        const wsA = wb.Sheets[aName];
        const rawA = XLSX.utils.sheet_to_json(wsA, { header: 1 });
        console.log('\n--- SHEET: asesores (Top 10 rows) ---');
        rawA.slice(0, 10).forEach((row, i) => {
            console.log(`Row ${i + 1}: ${JSON.stringify(row)}`);
        });
    }

} catch (e) {
    console.error('Error reading file:', e);
}
