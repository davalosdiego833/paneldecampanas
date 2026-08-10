import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const folder = path.join(process.cwd(), 'VENTAS_MENSUALES');
const files = fs.readdirSync(folder);
console.log('Files in VENTAS_MENSUALES:', files);

files.forEach(f => {
    if (f.endsWith('.xlsx') || f.endsWith('.xls')) {
        const fullPath = path.join(folder, f);
        try {
            const wb = XLSX.readFile(fullPath, { cellFormulas: true });
            console.log(`\nWorkbook: ${f}`);
            console.log('Sheets:', wb.SheetNames);
            wb.SheetNames.forEach(s => {
                const sheet = wb.Sheets[s];
                const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
                console.log(`  Sheet '${s}': ${data.length} rows`);
                if (data.length > 0) {
                    console.log(`    Row 1:`, JSON.stringify(data[0]));
                    if (data.length > 1) console.log(`    Row 2:`, JSON.stringify(data[1]));
                }
            });
        } catch (e) {
            console.log(`Could not read ${f}:`, e.message);
        }
    }
});
