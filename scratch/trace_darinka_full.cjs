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

let confStart = -1;
for(let i=0; i<data.length; i++) {
    if(data[i][0] && typeof data[i][0] === 'string' && data[i][0].toUpperCase() === 'ASESOR' && data[i][1] && data[i][1].toUpperCase() === 'FRECUENCIA') {
        confStart = i + 1;
        break;
    }
}

if(confStart !== -1) {
    for(let i=confStart; i<data.length; i++) {
        const name = data[i][0];
        if(!name) continue;
        const ramo = data[i][2] || '';
        const montoReal = data[i][4] || 0;
        
        confirmacion.push({
            nameClean: cleanName(name),
            ramo: String(ramo).toUpperCase(),
            monto: Number(montoReal)
        });
    }
}

const confMap = {};
for(const row of confirmacion) {
    if(!confMap[row.nameClean]) {
        confMap[row.nameClean] = { polizasVida: 0, primaVida: 0, polizasGmm: 0, primaGmm: 0 };
    }
    const c = confMap[row.nameClean];
    if(row.ramo.includes('VIDA')) {
        c.polizasVida += 1;
        c.primaVida += row.monto;
    } else if(row.ramo.includes('GMM')) {
        c.polizasGmm += 0.5;
        c.primaGmm += row.monto;
    }
}

const gmmMap = {};
for(const row of gmm) {
    gmmMap[row.nameClean] = {
        polizasGmm: row.polizasGmm,
        primaGmm: row.primaGmm
    };
}

const processedNames = new Set();
const finalTable = [];

for(const v of ventas) {
    const c = confMap[v.nameClean];
    const g = gmmMap[v.nameClean];
    processedNames.add(v.nameClean);
    
    if (v.nameClean.includes('DARINKA')) {
        console.log(`Matching loop - Darinka Clean: ${v.nameClean}, Has conf? ${!!c}, Has gmm? ${!!g}`);
    }
}

for(const [name, c] of Object.entries(confMap)) {
    if(!processedNames.has(name)) {
        processedNames.add(name);
        if (name.includes('DARINKA')) {
            console.log(`Add loop - Darinka Clean from conf: ${name}`);
        }
    }
}
