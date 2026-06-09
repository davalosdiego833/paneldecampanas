import fs from 'fs';

const snapshot = JSON.parse(fs.readFileSync('./db/resumen_snapshot.json', 'utf8'));
const proactivos = snapshot.data.resumen_general.proactivos || [];

const activeProactivos = proactivos.filter(p => p.Proactivo_al_mes === 'p');
const dicProactivos = proactivos.filter(p => p.Proactivo_a_Dic === 'p');

console.log('--- PROACTIVOS AL MES (p) ---');
console.log('Total count:', activeProactivos.length);
activeProactivos.forEach(p => {
    console.log(`- ${p.ASESOR} (Polizas total: ${p.Polizas_Acumuladas_Total})`);
});

console.log('\n--- PROACTIVOS A DIC (p) ---');
console.log('Total count:', dicProactivos.length);
dicProactivos.forEach(p => {
    console.log(`- ${p.ASESOR}`);
});
