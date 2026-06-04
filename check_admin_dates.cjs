const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const BASE_PATH = __dirname;

function extractCutoffDate(wb) {
    for (const sheetName of wb.SheetNames) {
        const ws = wb.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, blankrows: false });
        for (const row of rows.slice(0, 15)) {
            for (const cell of row) {
                if (cell && typeof cell === 'string') {
                    const match = cell.match(/al\s+(\d{1,2}\s+de\s+[a-zA-Z]+\s+de\s+\d{4})/i) ||
                                  cell.match(/al\s+(\d{1,2}\s*[A-Z]{3}\s*\d{2,4})/i) ||
                                  cell.match(/(\d{1,2}\s+de\s+[a-zA-Z]+\s+de\s+\d{4})/i) ||
                                  cell.match(/al\s*:\s*(\d{2}\/\d{2}\/\d{4})/i) ||
                                  cell.match(/FECHA DE CORTE:\s*(\d{2}\/\d{2}\/\d{4})/i) ||
                                  cell.match(/(?:A|Al)\s+(\d{1,2})\s+DE\s+([A-Z]+)\s+DEL\s+(\d{4})/i);
                    if (match) return match[0].replace(/^(al\s*:?\s*|fecha de corte:\s*)/i, '').trim();
                }
            }
        }
    }
    return "No encontrada";
}

try {
    console.log("Fechas de corte de Reportes Administrativos:");
    
    const cvPath = path.join(BASE_PATH, 'administrador', 'comparativo_vida', 'Comparativo Vida.xlsm');
    if (fs.existsSync(cvPath)) {
        const wb = XLSX.readFile(cvPath);
        console.log("- Comparativo Vida:", extractCutoffDate(wb));
    } else {
        console.log("- Comparativo Vida: Archivo no encontrado");
    }

    const proPath = path.join(BASE_PATH, 'administrador', 'proactivos', 'Proactivos.xlsx');
    if (fs.existsSync(proPath)) {
        const wb = XLSX.readFile(proPath);
        console.log("- Proactivos:", extractCutoffDate(wb));
    } else {
        console.log("- Proactivos: Archivo no encontrado");
    }

    let sinEmPath = path.join(BASE_PATH, 'administrador', 'asesores_sin_emision', 'Asesores sin Emision.xlsx');
    if (!fs.existsSync(sinEmPath)) {
        sinEmPath = path.join(BASE_PATH, 'administrador', 'asesores_sin_emision', 'Asesores sin Emision.xls');
    }
    if (fs.existsSync(sinEmPath)) {
        const wb = XLSX.readFile(sinEmPath);
        console.log("- Asesores sin Emisión:", extractCutoffDate(wb));
    } else {
        console.log("- Asesores sin Emisión: Archivo no encontrado");
    }
} catch (e) {
    console.error("Error:", e);
}
