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

const groups = {};
rawA.forEach(r => {
    if (r) {
        const sucId1 = String(r[4] || '').trim();
        const sucId2 = String(r[5] || '').trim();
        if (sucId1 === '2043') {
            if (!groups[sucId2]) {
                groups[sucId2] = [];
            }
            groups[sucId2].push(r[8]); // name
        }
    }
});

console.log("Unique sucursales under Matriz 2043 and count of advisors:");
for (const [suc, names] of Object.entries(groups)) {
    console.log(`Sucursal: ${suc}, Count: ${names.length}`);
    console.log(`Sample Names:`, names.slice(0, 5));
}
