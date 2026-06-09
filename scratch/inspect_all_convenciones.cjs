const fs = require('fs');
const snapshot = JSON.parse(fs.readFileSync('./db/resumen_snapshot.json', 'utf-8'));
const list = snapshot.data?.campaigns?.convenciones || [];
list.forEach(c => {
    console.log(`Asesor: ${c.Asesor} -> PA_Total: ${c.PA_Total}, Polizas: ${c.Polizas}, Lugar: ${c.Lugar}`);
});
