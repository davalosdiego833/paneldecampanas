const XLSX = require('xlsx');
const inputPath = '/Users/diego/Desktop/panel de campañas/VENTAS_MENSUALES/VENTAS MENSUALES.xlsx';
const wb = XLSX.readFile(inputPath);
const ws = wb.Sheets['MAYO'];
const data = XLSX.utils.sheet_to_json(ws, {header: 1, defval: null});

function cleanName(name) {
    if(!name) return '';
    return name.replace(/[0-9]+/g, '').replace(/Ñ/g, 'Ñ').trim().toUpperCase();
}

const gmm = [];
for(let i=2; i<data.length; i++) {
    const name = data[i][8];
    if(name && typeof name === 'string' && name.toUpperCase() !== 'ASESOR' && !name.toUpperCase().includes('CAMPEONES') && !name.toUpperCase().includes('NOVATO') && !name.toUpperCase().includes('PRO') && !name.toUpperCase().includes('MESES')) {
        gmm.push({
            nameClean: cleanName(name),
            nameOriginal: name,
            polizasGmm: data[i][9] || 0,
            primaGmm: data[i][11] || 0
        });
    }
}

console.log('GMM entries extracted:');
console.log(gmm.slice(0, 5));
