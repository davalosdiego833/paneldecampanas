import fs from 'fs';

const snapshot = JSON.parse(fs.readFileSync('./db/resumen_snapshot.json', 'utf8'));
const vtp = snapshot.data.campaigns.vive_tu_pasion || [];

console.log('--- vive_tu_pasion with Premio NOT empty count:', vtp.filter(x => x.Premio).length);
vtp.forEach((x, idx) => {
    if (x.Polizas > 0) {
        console.log(`${idx}: Asesor: ${x.Asesor} -> Polizas: ${x.Polizas}, Premio: ${x.Premio}`);
    }
});
