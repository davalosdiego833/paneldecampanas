import fs from 'fs';

const snapshot = JSON.parse(fs.readFileSync('./db/resumen_snapshot.json', 'utf8'));
const pag = snapshot.data.resumen_general.pagado_pendiente || [];

console.log('--- pagado_pendiente count:', pag.length);
pag.forEach((p, idx) => {
    console.log(`${idx}: ${p['Nombre Asesor']}`);
});
