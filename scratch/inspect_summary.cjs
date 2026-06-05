const XLSX = require('xlsx');

const cvPath = '/Users/diego/Desktop/panel de campañas/administrador/comparativo_vida/Comparativo Vida.xlsm';
const wb = XLSX.readFile(cvPath);
const wsP = wb.Sheets['Resumen x Prom'] || wb.Sheets['promotoria'] || wb.Sheets[wb.SheetNames[1]];
if (!wsP) {
    console.log("No sheet!");
    process.exit(1);
}

const rawP = XLSX.utils.sheet_to_json(wsP, { header: 1 });
console.log("Rows in Resumen x Prom:");
rawP.slice(0, 15).forEach((r, idx) => {
    console.log(`Row ${idx}:`, r);
});
