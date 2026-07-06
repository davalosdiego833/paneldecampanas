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
const gmm = [];
const confirmacion = [];

for(let i=2; i<data.length; i++) {
    const name = data[i][0];
    if(name === 'Total') break;
    if(typeof name === 'string' && name.trim().length > 0) {
        ventas.push({
            nameOriginal: name.trim(),
            nameClean: cleanName(name),
            polizasTotal: data[i][1] || 0,
            polizasVida: data[i][2] || 0,
            primaVida: data[i][3] || 0,
            polizasGmm: data[i][4] || 0,
            primaGmm: data[i][5] || 0,
            primaTotal: data[i][6] || 0
        });
    }
}

for(let i=2; i<data.length; i++) {
    const name = data[i][8];
    if(name && typeof name === 'string' && name.toUpperCase() !== 'ASESOR' && !name.toUpperCase().includes('CAMPEONES') && !name.toUpperCase().includes('NOVATO') && !name.toUpperCase().includes('PRO') && !name.toUpperCase().includes('MESES')) {
        gmm.push({
            nameClean: cleanName(name),
            polizasGmm: data[i][9] || 0,
            primaGmm: data[i][11] || 0
        });
    }
}

const gmmMap = {};
for(const row of gmm) {
    gmmMap[row.nameClean] = {
        polizasGmm: row.polizasGmm,
        primaGmm: row.primaGmm
    };
}

console.log("Processed names check for 'COLUMNA':");
console.log("Is 'COLUMNA' in GMM map?", 'COLUMNA' in gmmMap);

const processedNames = new Set();
for(const v of ventas) {
    processedNames.add(v.nameClean);
}
console.log("Is 'COLUMNA' in processedNames (after ventas)?", processedNames.has('COLUMNA'));

// Check GMM loop
for(const [name, g] of Object.entries(gmmMap)) {
    if(!processedNames.has(name)) {
        console.log(`GMM Missing from processedNames: ${name}`, g);
    }
}
