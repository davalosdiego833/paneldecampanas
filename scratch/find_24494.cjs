const fs = require('fs');
const path = require('path');

const snapshot = JSON.parse(fs.readFileSync('./db/resumen_snapshot.json', 'utf-8'));
const data = snapshot.data || {};

console.log("--- Searching for ~24494 in resumen_general ---");
const pro = data.resumen_general?.proactivos || [];
pro.forEach(p => {
    for (const k of Object.keys(p)) {
        if (typeof p[k] === 'number' && p[k] >= 24000 && p[k] <= 25000) {
            console.log(`Found in proactivos: Asesor ${p.ASESOR}, key: ${k}, val: ${p[k]}`);
        }
    }
});

const pp = data.resumen_general?.pagado_pendiente || [];
pp.forEach(p => {
    for (const k of Object.keys(p)) {
        if (typeof p[k] === 'number' && p[k] >= 24000 && p[k] <= 25000) {
            console.log(`Found in pagado_pendiente: Asesor ${p['Nombre Asesor']}, key: ${k}, val: ${p[k]}`);
        }
    }
});

const cv = data.resumen_general?.comparativo_vida?.individuals || [];
cv.forEach(c => {
    for (const k of Object.keys(c)) {
        if (typeof c[k] === 'number' && c[k] >= 24000 && c[k] <= 25000) {
            console.log(`Found in comparativo_vida: Asesor ${c['Nombre del Asesor']}, key: ${k}, val: ${c[k]}`);
        }
    }
});

console.log("\n--- Searching for ~24494 in campaigns ---");
const campaigns = data.campaigns || {};
for (const campName of Object.keys(campaigns)) {
    const list = campaigns[campName] || [];
    list.forEach(c => {
        for (const k of Object.keys(c)) {
            const val = Number(c[k]);
            if (!isNaN(val) && val >= 24000 && val <= 25000) {
                console.log(`Found in campaign ${campName}: Asesor ${c.Asesor}, key: ${k}, val: ${val}`);
            }
        }
    });
}
