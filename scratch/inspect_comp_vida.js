import fs from 'fs';

const snapshot = JSON.parse(fs.readFileSync('./db/resumen_snapshot.json', 'utf8'));
const comp = snapshot.data.resumen_general.comparativo_vida.individuals || [];

console.log('--- comparativo_vida count:', comp.length);
comp.forEach((c, idx) => {
    console.log(`${idx}: ${c['Nombre del Asesor']}`);
});
