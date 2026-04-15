
import * as XLSX from 'xlsx';
import * as path from 'path';

const filePath = '/Users/diego/Desktop/panel de campañas/administrador/comparativo_vida.xlsx';

try {
    const wb = XLSX.readFile(filePath);
    console.log('--- SHEETS FOUND ---');
    console.log(wb.SheetNames);

    const wsP = wb.Sheets['promotoria'] || wb.Sheets['Promotoria'];
    if (wsP) {
        const rawP = XLSX.utils.sheet_to_json(wsP, { header: 1 }) as any[][];
        console.log('\n--- SHEET: promotoria (Top 10 rows) ---');
        rawP.slice(0, 10).forEach((row, i) => {
            console.log(`Row ${i + 1}:`, JSON.stringify(row));
        });
    }

    const wsA = wb.Sheets['asesores'] || wb.Sheets['Asesores'];
    if (wsA) {
        const rawA = XLSX.utils.sheet_to_json(wsA, { header: 1 }) as any[][];
        console.log('\n--- SHEET: asesores (Top 15 rows) ---');
        rawA.slice(0, 15).forEach((row, i) => {
            console.log(`Row ${i + 1}:`, JSON.stringify(row));
        });
    }

} catch (e) {
    console.error('Error reading file:', e);
}
