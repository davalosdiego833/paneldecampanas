const XLSX = require('xlsx');

const cvPath = '/Users/diego/Desktop/panel de campañas/administrador/comparativo_vida/Comparativo Vida.xlsm';
const wb = XLSX.readFile(cvPath);
const wsA = wb.Sheets['Detalle de Asesores'] || wb.Sheets['asesores'];
if (!wsA) {
    console.log("No asesores sheet!");
    process.exit(1);
}

const rawA = XLSX.utils.sheet_to_json(wsA, { header: 1, range: 6 });
const isRaw = true;
const PROMO_SUCURSALES = ['2043', '2856', '2511'];

const results = [];
rawA.forEach(r => {
    if (r) {
        const name = r[8];
        const sucursal = String(r[5] || '').trim();
        const polActual = Number(r[18] || 0);
        
        if (name && name !== 'TOTAL' && PROMO_SUCURSALES.includes(sucursal)) {
            if (polActual <= 3) {
                results.push({
                    name,
                    sucursal,
                    polActual
                });
            }
        }
    }
});

// Sort by number of policies ascending, then by name
results.sort((a, b) => a.polActual - b.polActual || a.name.localeCompare(b.name));

console.log(JSON.stringify(results, null, 2));
