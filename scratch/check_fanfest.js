import fs from 'fs';

const snapshot = JSON.parse(fs.readFileSync('./db/resumen_snapshot.json', 'utf8'));
const fanfest = snapshot.data.campaigns.fanfest || [];

const conds = new Set();
const premios = new Set();
fanfest.forEach(f => {
    conds.add(f.Condicion);
    premios.add(f.Premio);
});

console.log('Unique Condicion values:', Array.from(conds));
console.log('Unique Premio values:', Array.from(premios));

console.log('\nSample records:');
fanfest.slice(0, 15).forEach(f => {
    console.log(`Asesor: ${f.Asesor} -> Condicion: ${f.Condicion}, Premio: ${f.Premio}, Polizas: ${f.Total_Polizas}`);
});
