import fs from 'fs';

const snapshot = JSON.parse(fs.readFileSync('./db/resumen_snapshot.json', 'utf8'));
const proactivos = snapshot.data.resumen_general.proactivos || [];

const alMesVals = new Set();
const aDicVals = new Set();
proactivos.forEach(p => {
    alMesVals.add(p.Proactivo_al_mes);
    aDicVals.add(p.Proactivo_a_Dic);
});

console.log('Unique values for Proactivo_al_mes:', Array.from(alMesVals));
console.log('Unique values for Proactivo_a_Dic:', Array.from(aDicVals));

console.log('\nSample records:');
proactivos.slice(0, 15).forEach(p => {
    console.log(`Asesor: ${p.ASESOR} -> Al Mes: ${p.Proactivo_al_mes}, A Dic: ${p.Proactivo_a_Dic}, Faltantes: ${p['Pólizas_Faltantes']}, Faltantes Dic: ${p['Pólizas_Faltantes_Para_Dic']}`);
});
