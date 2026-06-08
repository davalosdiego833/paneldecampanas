const XLSX = require('xlsx');

const filePath = '/Users/diego/Desktop/panel de campañas/administrador/pagado_emitido/PagPend.xls';
console.log("Loading workbook...");
const wb = XLSX.readFile(filePath);
console.log("Sheet names in PagPend.xls:", wb.SheetNames);

const firstSheetName = wb.SheetNames[0];
const ws = wb.Sheets[firstSheetName];
const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 });
console.log(`Total rows in ${firstSheetName}:`, rawData.length);

console.log("First 15 rows of the sheet:");
rawData.slice(0, 15).forEach((r, idx) => {
    console.log(`Row ${idx}:`, r.slice(0, 15));
});

// Let's search for column headers in the first 30 rows
console.log("\nSearching for columns...");
for (let i = 0; i < Math.min(30, rawData.length); i++) {
    const r = rawData[i];
    if (r && r.length > 5) {
        // Look for keywords
        const str = r.map(x => String(x || '').toLowerCase());
        if (str.includes('ramo') || str.includes('oficina') || str.includes('promotor') || str.includes('sucursal')) {
            console.log(`Headers found at Row ${i}:`, r.slice(0, 20));
            break;
        }
    }
}
