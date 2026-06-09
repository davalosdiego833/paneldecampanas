const XLSX = require('xlsx');
const fs = require('fs');

const inputPath = '/Users/diego/Desktop/panel de campañas/VENTAS_MENSUALES/VENTAS MENSUALES.xlsx';
const wb = XLSX.readFile(inputPath);
const ws = wb.Sheets['MAYO'];

const data = XLSX.utils.sheet_to_json(ws, {header: 1, defval: null});

const ventas = [];
const gmm = [];
const confirmacion = [];

// Clean Name helper
function cleanName(name) {
    if(!name) return '';
    // Remove numbers and trailing spaces
    return name.replace(/[0-9]+/g, '').replace(/Ñ/g, 'Ñ').trim().toUpperCase();
}

// Extract Ventas (Row 2 to 47 approx)
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

// Extract GMM (Row 2 onwards, column 8)
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

// Extract Confirmacion (Row 54 onwards)
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

// Process Confirmacion grouping
const confMap = {};
for(const row of confirmacion) {
    if(!confMap[row.nameClean]) {
        confMap[row.nameClean] = { polizasVida: 0, primaVida: 0, polizasGmm: 0, primaGmm: 0 };
    }
    const c = confMap[row.nameClean];
    // 1 policy per row in Confirmacion. user: "CADA PALABRA DE LA COLUMNA RAMO SIGNIFICA UNA VENTA... 1 PALABRA = 1 POLIZA". user: "CUENTO LOS GMM COMO 0.5"
    if(row.ramo.includes('VIDA')) {
        c.polizasVida += 1;
        c.primaVida += row.monto;
    } else if(row.ramo.includes('GMM')) {
        c.polizasGmm += 0.5;
        c.primaGmm += row.monto;
    }
}

// Process GMM grouping
const gmmMap = {};
for(const row of gmm) {
    gmmMap[row.nameClean] = {
        polizasGmm: row.polizasGmm,
        primaGmm: row.primaGmm
    };
}

// Reconcile
const finalTable = [];
const report = [];

const processedNames = new Set();

for(const v of ventas) {
    const c = confMap[v.nameClean];
    const g = gmmMap[v.nameClean];
    processedNames.add(v.nameClean);
    
    let isModified = false;
    let changes = [];
    
    const finalRow = {
        Asesor: v.nameOriginal,
        "Pólizas ": v.polizasTotal,
        "Vida": v.polizasVida,
        "Prima Pagada vida": v.primaVida,
        "Gmm": v.polizasGmm,
        "Prima Pagada gmm": v.primaGmm,
        "Prima total": v.primaTotal
    };

    if(c) {
        // Update from Confirmacion
        if(v.polizasVida !== c.polizasVida) {
            changes.push(`Vida Pólizas: ${v.polizasVida} -> ${c.polizasVida}`);
            finalRow["Vida"] = c.polizasVida;
            isModified = true;
        }
        if(Math.abs(v.primaVida - c.primaVida) > 1) { // 1 peso threshold
            changes.push(`Vida Prima: ${v.primaVida} -> ${c.primaVida}`);
            finalRow["Prima Pagada vida"] = c.primaVida;
            isModified = true;
        }
        if(v.polizasGmm !== c.polizasGmm) {
            changes.push(`GMM Pólizas: ${v.polizasGmm} -> ${c.polizasGmm}`);
            finalRow["Gmm"] = c.polizasGmm;
            isModified = true;
        }
        if(Math.abs(v.primaGmm - c.primaGmm) > 1) {
            changes.push(`GMM Prima: ${v.primaGmm} -> ${c.primaGmm}`);
            finalRow["Prima Pagada gmm"] = c.primaGmm;
            isModified = true;
        }
    } else if (g) {
        // No conf, check GMM
        if(v.polizasGmm !== g.polizasGmm) {
            changes.push(`GMM Pólizas: ${v.polizasGmm} -> ${g.polizasGmm} (de tabla GMM)`);
            finalRow["Gmm"] = g.polizasGmm;
            isModified = true;
        }
        if(Math.abs(v.primaGmm - g.primaGmm) > 1) {
            changes.push(`GMM Prima: ${v.primaGmm} -> ${g.primaGmm} (de tabla GMM)`);
            finalRow["Prima Pagada gmm"] = g.primaGmm;
            isModified = true;
        }
    }
    
    // Recalculate totals
    finalRow["Pólizas "] = finalRow["Vida"] + finalRow["Gmm"];
    finalRow["Prima total"] = finalRow["Prima Pagada vida"] + finalRow["Prima Pagada gmm"];
    
    if(isModified) {
        report.push(`Modificado: ${v.nameOriginal}. Cambios: ${changes.join(', ')}`);
    }
    
    finalTable.push(finalRow);
}

// Find missing from Confirmacion
for(const [name, c] of Object.entries(confMap)) {
    if(!processedNames.has(name)) {
        processedNames.add(name);
        const finalRow = {
            Asesor: name,
            "Pólizas ": c.polizasVida + c.polizasGmm,
            "Vida": c.polizasVida,
            "Prima Pagada vida": c.primaVida,
            "Gmm": c.polizasGmm,
            "Prima Pagada gmm": c.primaGmm,
            "Prima total": c.primaVida + c.primaGmm
        };
        finalTable.push(finalRow);
        report.push(`Agregado de Confirmación: ${name}. Vida: ${c.polizasVida}, GMM: ${c.polizasGmm}`);
    }
}

// Find missing from GMM
for(const [name, g] of Object.entries(gmmMap)) {
    if(!processedNames.has(name)) {
        processedNames.add(name);
        const finalRow = {
            Asesor: name,
            "Pólizas ": g.polizasGmm,
            "Vida": 0,
            "Prima Pagada vida": 0,
            "Gmm": g.polizasGmm,
            "Prima Pagada gmm": g.primaGmm,
            "Prima total": g.primaGmm
        };
        finalTable.push(finalRow);
        report.push(`Agregado de GMM: ${name}. GMM: ${g.polizasGmm}`);
    }
}

// Write to new tab in Excel
// Write to new SEPARATE Excel file to avoid corrupting formulas/formatting
const newWb = XLSX.utils.book_new();
const newWs = XLSX.utils.json_to_sheet(finalTable);
XLSX.utils.book_append_sheet(newWb, newWs, "MAYO_CORREGIDO");
XLSX.writeFile(newWb, '/Users/diego/Desktop/panel de campañas/VENTAS_MENSUALES/MAYO_CORREGIDO_RESULTADO.xlsx');

fs.writeFileSync('reporte_mayo.txt', report.join('\n'));

console.log("Reconciliación completada. Se generó archivo MAYO_CORREGIDO_RESULTADO.xlsx y reporte_mayo.txt");
