import fs from 'fs';

const snapshot = JSON.parse(fs.readFileSync('./db/resumen_snapshot.json', 'utf8'));
const proactivos = snapshot.data.resumen_general.proactivos || [];

console.log('Index | ASESOR | Al Mes | A Dic | Faltantes | Faltantes Dic | Acum Total | Del Mes');
console.log('------------------------------------------------------------------------------------');
proactivos.forEach((p, idx) => {
    console.log(`${String(idx).padStart(2)} | ${p.ASESOR.padEnd(35)} | ${p.Proactivo_al_mes} | ${p.Proactivo_a_Dic} | ${String(p['Pólizas_Faltantes']).padEnd(9)} | ${String(p['Pólizas_Faltantes_Para_Dic']).padEnd(13)} | ${String(p.Polizas_Acumuladas_Total).padEnd(10)} | ${p.Polizas_Del_mes}`);
});
