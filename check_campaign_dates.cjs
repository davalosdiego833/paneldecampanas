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
    const ccPath = path.join(BASE_PATH, 'camino_cumbre', 'Camino a la Cumbre.xlsx');
    if (fs.existsSync(ccPath)) {
        const wb = XLSX.readFile(ccPath);
        console.log("Camino a la Cumbre:", extractCutoffDate(wb));
    }
    const gradPath = path.join(BASE_PATH, 'graduacion', 'Graduacion Asesores.xlsm');
    if (fs.existsSync(gradPath)) {
        const wb = XLSX.readFile(gradPath);
        console.log("Graduacion:", extractCutoffDate(wb));
    }
} catch (e) { console.error(e); }
