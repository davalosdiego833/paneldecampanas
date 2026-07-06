const XLSX = require('xlsx');
const inputPath = '/Users/diego/Desktop/panel de campañas/VENTAS_MENSUALES/VENTAS MENSUALES.xlsx';
const wb = XLSX.readFile(inputPath);
const ws = wb.Sheets['MAYO'];
const data = XLSX.utils.sheet_to_json(ws, {header: 1, defval: null});

function cleanName(name) {
    if(!name) return '';
    return name.replace(/[0-9]+/g, '').replace(/Ñ/g, 'Ñ').trim().toUpperCase();
}

const ventas = [];
for(let i=2; i<data.length; i++) {
    const name = data[i][0];
    if(name === 'Total') break;
    if(typeof name === 'string' && name.trim().length > 0) {
        ventas.push({
            nameOriginal: name.trim(),
            nameClean: cleanName(name),
        });
    }
}

const confNames = new Set();
for(let i=50; i<data.length; i++) {
    const row = data[i];
    if (row && row[0] && row[2]) {
        confNames.add(cleanName(row[0]));
    }
}

for (const v of ventas) {
    if (v.nameClean.includes('DARINKA')) {
        console.log(`Ventas Darinka: [${v.nameClean}]`);
        console.log(`Is in confNames?`, confNames.has(v.nameClean));
    }
}
for (const c of confNames) {
    if (c.includes('DARINKA')) {
        console.log(`Conf Darinka: [${c}]`);
    }
}
