import fs from 'fs';

const snapshot = JSON.parse(fs.readFileSync('./db/resumen_snapshot.json', 'utf8'));
const data = snapshot.data;

console.log('--- RESUMEN GENERAL (ADMIN REPORTES) ---');
for (const [key, val] of Object.entries(data.resumen_general)) {
    if (Array.isArray(val)) {
        console.log(`- ${key}: ${val.length} filas. Primer elemento:`, val[0]);
    } else {
        console.log(`- ${key}:`, Object.keys(val), 'individuals count:', val.individuals ? val.individuals.length : 'N/A');
    }
}

console.log('\n--- CAMPAÑAS ---');
for (const [key, val] of Object.entries(data.campaigns)) {
    console.log(`- ${key}: ${val.length} filas. Primer elemento:`, val[0]);
}

console.log('\n--- FECHAS DE CORTE ---');
console.log('fechas_corte:', data.fechas_corte);
console.log('campaignDates:', data.campaignDates);
