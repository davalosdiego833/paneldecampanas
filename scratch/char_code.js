import fs from 'fs';

const snapshot = JSON.parse(fs.readFileSync('./db/resumen_snapshot.json', 'utf8'));
const vtp = snapshot.data.campaigns.vive_tu_pasion;
const entry = vtp.find(e => e.Asesor.includes('PE'));
if (entry) {
    const name = entry.Asesor;
    console.log('Name:', name);
    for (let i = 0; i < name.length; i++) {
        console.log(`char[${i}]: ${name[i]} (code: ${name.charCodeAt(i)})`);
    }
}
