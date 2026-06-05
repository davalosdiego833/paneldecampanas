const XLSX = require('xlsx');
const path = require('path');

const cvPath = '/Users/diego/Desktop/panel de campañas/administrador/comparativo_vida/Comparativo Vida.xlsm';
const wb = XLSX.readFile(cvPath);
const wsA = wb.Sheets['Detalle de Asesores'] || wb.Sheets['asesores'];
if (!wsA) {
    console.log("No asesores sheet!");
    process.exit(1);
}

const rawA = XLSX.utils.sheet_to_json(wsA, { header: 1, range: 6 });
console.log("Total rows in rawA:", rawA.length);
console.log("First 3 rows of rawA (after range: 6):");
console.log(rawA.slice(0, 3));

console.log("\nSample rows with 2043:");
const filtered = rawA.filter(r => r && (String(r[3]).includes('2043') || String(r[4]).includes('2043') || String(r[5]).includes('2043')));
console.log("Count of rows matching 2043:", filtered.length);
console.log("First 10 matches:");
filtered.slice(0, 10).forEach((r, idx) => {
    console.log(`Match ${idx}:`, {
        r3: r[3],
        r4: r[4],
        r5: r[5],
        r6: r[6],
        r7: r[7],
        r8: r[8],
        r9: r[9]
    });
});

console.log("\nAll unique values of column 3, 4, 5 in rawA:");
const u3 = new Set(), u4 = new Set(), u5 = new Set();
rawA.forEach(r => {
    if (r) {
        if (r[3] !== undefined) u3.add(r[3]);
        if (r[4] !== undefined) u4.add(r[4]);
        if (r[5] !== undefined) u5.add(r[5]);
    }
});
console.log("Unique col 3:", Array.from(u3));
console.log("Unique col 4:", Array.from(u4));
console.log("Unique col 5:", Array.from(u5));
