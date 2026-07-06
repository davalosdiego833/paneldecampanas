const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const inputPath = '/Users/diego/Desktop/panel de campañas/VENTAS_MENSUALES/VENTAS MENSUALES.xlsx';
const wb = XLSX.readFile(inputPath);
const ws = wb.Sheets['JUNIO'];

if (!ws) {
    console.error("❌ Error: No se encontró la pestaña 'JUNIO' en el archivo Excel.");
    process.exit(1);
}

const data = XLSX.utils.sheet_to_json(ws, {header: 1, defval: null});

const ventas = [];
const gmm = [];
const confirmacion = [];

// Helper to normalize names (handling encoding issues like Ð instead of Ñ)
function cleanName(name) {
    if(!name) return '';
    return name
        .replace(/[0-9]+/g, '')
        .replace(/Ð/g, 'Ñ')
        .replace(/Ñ/g, 'Ñ')
        .trim()
        .toUpperCase();
}

// Helper to pretty print names in final report (replaces Ð with Ñ)
function prettyName(name) {
    if(!name) return '';
    return name.replace(/Ð/g, 'Ñ').trim();
}

// 1. Extract Ventas from main table (Cols 0 to 6)
for(let i=2; i<data.length; i++) {
    const name = data[i][0];
    if(name && typeof name === 'string' && name.trim().toUpperCase() === 'TOTAL') break;
    if(name && typeof name === 'string' && name.trim().length > 0) {
        ventas.push({
            nameOriginal: name.trim(),
            nameClean: cleanName(name),
            polizasTotal: Number(data[i][1]) || 0,
            polizasVida: Number(data[i][2]) || 0,
            primaVida: Number(data[i][3]) || 0,
            polizasGmm: Number(data[i][4]) || 0,
            primaGmm: Number(data[i][5]) || 0,
            primaTotal: Number(data[i][6]) || 0
        });
    }
}

// 2. Extract GMM from GMM table (Col 8, Row 2 onwards)
for(let i=2; i<data.length; i++) {
    const name = data[i][8];
    if(name && typeof name === 'string') {
        const upper = name.toUpperCase();
        if (upper !== 'ASESOR' && 
            !upper.includes('COLUMNA') && 
            !upper.includes('CAMPEONES') && 
            !upper.includes('NOVATO') && 
            !upper.includes('PRO') && 
            !upper.includes('MESES')) {
            
            gmm.push({
                nameClean: cleanName(name),
                nameOriginal: name.trim(),
                polizasGmm: Number(data[i][9]) || 0,
                primaGmm: Number(data[i][11]) || 0
            });
        }
    }
}

// 3. Extract Confirmacion (bottom table, starting row identified dynamically)
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
            nameOriginal: name.trim(),
            ramo: String(ramo).toUpperCase(),
            monto: Number(montoReal)
        });
    }
} else {
    console.warn("⚠️ Advertencia: No se encontró la cabecera de la tabla de Confirmación.");
}

// Group Confirmacion data by Advisor
const confMap = {};
for(const row of confirmacion) {
    if(!confMap[row.nameClean]) {
        confMap[row.nameClean] = { nameOriginal: row.nameOriginal, polizasVida: 0, primaVida: 0, polizasGmm: 0, primaGmm: 0 };
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

// Group GMM data by Advisor
const gmmMap = {};
for(const row of gmm) {
    gmmMap[row.nameClean] = {
        nameOriginal: row.nameOriginal,
        polizasGmm: row.polizasGmm,
        primaGmm: row.primaGmm
    };
}

// 4. Reconciliation
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
        Asesor: prettyName(v.nameOriginal),
        "Pólizas ": v.polizasTotal,
        "Vida": v.polizasVida,
        "Prima Pagada vida": v.primaVida,
        "Gmm": v.polizasGmm,
        "Prima Pagada gmm": v.primaGmm,
        "Prima total": v.primaTotal
    };

    if(c) {
        // Reconcile with Confirmacion table (highest priority)
        if(v.polizasVida !== c.polizasVida) {
            changes.push(`Vida Pólizas: ${v.polizasVida} -> ${c.polizasVida}`);
            finalRow["Vida"] = c.polizasVida;
            isModified = true;
        }
        if(Math.abs(v.primaVida - c.primaVida) > 1) {
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
        // Reconcile with GMM table (medium priority)
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
        report.push(`Modificado: ${prettyName(v.nameOriginal)}. Cambios: ${changes.join(', ')}`);
    }
    
    finalTable.push(finalRow);
}

// 5. Add advisors missing from Main Table but present in Confirmacion
for(const [nameClean, c] of Object.entries(confMap)) {
    if(!processedNames.has(nameClean)) {
        processedNames.add(nameClean);
        const finalRow = {
            Asesor: prettyName(c.nameOriginal),
            "Pólizas ": c.polizasVida + c.polizasGmm,
            "Vida": c.polizasVida,
            "Prima Pagada vida": c.primaVida,
            "Gmm": c.polizasGmm,
            "Prima Pagada gmm": c.primaGmm,
            "Prima total": c.primaVida + c.primaGmm
        };
        finalTable.push(finalRow);
        report.push(`Agregado de Confirmación: ${prettyName(c.nameOriginal)}. Vida: ${c.polizasVida}, GMM: ${c.polizasGmm}`);
    }
}

// 6. Add advisors missing from Main Table but present in GMM Table
for(const [nameClean, g] of Object.entries(gmmMap)) {
    if(!processedNames.has(nameClean)) {
        processedNames.add(nameClean);
        const finalRow = {
            Asesor: prettyName(g.nameOriginal),
            "Pólizas ": g.polizasGmm,
            "Vida": 0,
            "Prima Pagada vida": 0,
            "Gmm": g.polizasGmm,
            "Prima Pagada gmm": g.primaGmm,
            "Prima total": g.primaGmm
        };
        finalTable.push(finalRow);
        report.push(`Agregado de GMM: ${prettyName(g.nameOriginal)}. GMM: ${g.polizasGmm}`);
    }
}

// 7. Write to Excel and output log
const newWb = XLSX.utils.book_new();
const newWs = XLSX.utils.json_to_sheet(finalTable);
XLSX.utils.book_append_sheet(newWb, newWs, "JUNIO_CORREGIDO");

const outputPath = '/Users/diego/Desktop/panel de campañas/VENTAS_MENSUALES/JUNIO_CORREGIDO_RESULTADO.xlsx';
XLSX.writeFile(newWb, outputPath);

const logPath = '/Users/diego/Desktop/panel de campañas/VENTAS_MENSUALES/reporte_junio.txt';
fs.writeFileSync(logPath, report.join('\n'));

console.log("✅ Reconciliación completada exitosamente para JUNIO.");
console.log(`📂 Excel generado: ${outputPath}`);
console.log(`📂 Log de cambios generado: ${logPath}`);
