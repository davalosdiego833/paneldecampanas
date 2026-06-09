const XLSX = require('xlsx');
const path = require('path');

const filePath = './convenciones/Convenciones Asesores.xlsx';
const wb = XLSX.readFile(filePath);
const ws = wb.Sheets[wb.SheetNames[0]];

const data = XLSX.utils.sheet_to_json(ws, { header: 1, range: 'A20:AL15000' });
const allRows = data.slice(1);

const uniqueConvs = {};
allRows.forEach(r => {
    const conv = r[33]; // columna 33 es Convención
    const lugConv = r[32]; // columna 32 es Lug Conv
    const creditos = r[24]; // columna 24 es Créditos Totales
    if (conv) {
        if (!uniqueConvs[conv]) {
            uniqueConvs[conv] = [];
        }
        uniqueConvs[conv].push({ lugConv: Number(lugConv), creditos: Number(creditos) });
    }
});

console.log("Unique Convenciones values and sample places/credits:");
for (const key of Object.keys(uniqueConvs)) {
    const list = uniqueConvs[key].sort((a, b) => a.lugConv - b.lugConv);
    console.log(`\nConvención: "${key}" (count: ${list.length})`);
    console.log("Min place:", list[0]);
    console.log("Max place:", list[list.length - 1]);
}
