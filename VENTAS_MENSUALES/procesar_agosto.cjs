const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const inputPath = '/Users/diego/Desktop/panel de campañas/VENTAS_MENSUALES/VENTAS MENSUALES.xlsx';
const wb = XLSX.readFile(inputPath);

const wsAgosto = wb.Sheets['AGOSTO'];
if (!wsAgosto) {
    console.error("❌ Error: No se encontró la pestaña 'AGOSTO' en el archivo Excel.");
    process.exit(1);
}

const data = XLSX.utils.sheet_to_json(wsAgosto, { header: 1, defval: '' });

// Extract raw policy rows from AGOSTO sheet
const rawRows = [];
for (let i = 1; i < data.length; i++) {
    const r = data[i];
    if (r && r[0]) {
        const full = String(r[0]).trim();
        // Clean advisor name: handle character replacements and remove trailing numeric ID
        let nameClean = full.replace(/Ð/g, "Ñ").replace(/\s+\d+$/, "").trim().toUpperCase();
        let nameOriginal = full.replace(/Ð/g, "Ñ").replace(/\s+\d+$/, "").trim();
        const frecuencia = String(r[1] || "").trim().toUpperCase();
        const ramo = String(r[2] || "").trim().toUpperCase();
        const montoAnual = Number(r[3]) || 0;
        const montoReal = Number(r[4]) || 0;
        rawRows.push({ full, nameClean, nameOriginal, frecuencia, ramo, montoAnual, montoReal });
    }
}

// Group by advisor
const grouped = {};
for (const row of rawRows) {
    if (!grouped[row.nameClean]) {
        grouped[row.nameClean] = {
            nameClean: row.nameClean,
            nameOriginal: row.nameOriginal,
            vidaCount: 0,
            vidaPrima: 0,
            gmmCount: 0,
            gmmPrima: 0
        };
    }
    const g = grouped[row.nameClean];
    if (row.ramo.includes("VIDA")) {
        g.vidaCount += 1;
        g.vidaPrima += row.montoReal;
    } else if (row.ramo.includes("GMM")) {
        g.gmmCount += 0.5;
        g.gmmPrima += row.montoReal;
    }
}

// Convert grouped object to array and sort by Prima Total descending
const advisors = Object.values(grouped);
advisors.sort((a, b) => (b.vidaPrima + b.gmmPrima) - (a.vidaPrima + a.gmmPrima));

// Build sheet 2D matrix matching standard layout
const sheetMatrix = [];

// Header row
sheetMatrix.push([
    "Asesor",
    "Pólizas ",
    "Vida",
    "Prima Pagada vida",
    "Gmm",
    "Prima Pagada gmm",
    "Prima total",
    "",
    "TOTAL",
    ""
]);

let totVidaPrima = 0;
let totVidaPol = 0;
let totGmmPrima = 0;
let totGmmPol = 0;
const reportLines = [];

advisors.forEach(a => {
    const polTotal = a.vidaCount + a.gmmCount;
    const primTotal = a.vidaPrima + a.gmmPrima;
    totVidaPrima += a.vidaPrima;
    totVidaPol += a.vidaCount;
    totGmmPrima += a.gmmPrima;
    totGmmPol += a.gmmCount;

    reportLines.push(`Procesado: ${a.nameOriginal} -> Vida: ${a.vidaCount} ($${a.vidaPrima.toFixed(2)}), GMM: ${a.gmmCount} ($${a.gmmPrima.toFixed(2)}), Total Pólizas: ${polTotal}, Total Prima: $${primTotal.toFixed(2)}`);

    sheetMatrix.push([
        a.nameOriginal,
        polTotal,
        a.vidaCount,
        a.vidaPrima,
        a.gmmCount,
        a.gmmPrima,
        primTotal,
        "",
        "",
        ""
    ]);
});

// Ensure at least 19 rows exist for totals and champions template
while (sheetMatrix.length < 19) {
    sheetMatrix.push(["", "", "", "", "", "", "", "", "", ""]);
}

// Side Totals
sheetMatrix[1][8] = "PRIMA VIDA";
sheetMatrix[1][9] = totVidaPrima;

sheetMatrix[2][8] = "POLIZAS VIDA";
sheetMatrix[2][9] = totVidaPol;

sheetMatrix[3][8] = "PRIMA GMM";
sheetMatrix[3][9] = totGmmPrima;

sheetMatrix[4][8] = "POLIZAS GMM";
sheetMatrix[4][9] = totGmmPol;

sheetMatrix[5][8] = "POLIZAS V+GMM";
sheetMatrix[5][9] = totVidaPol + totGmmPol;

sheetMatrix[6][8] = "PRIMA VI+GMM";
sheetMatrix[6][9] = totVidaPrima + totGmmPrima;

// Champions template
sheetMatrix[10][8] = "CAMPEONES:";
sheetMatrix[10][9] = "";
sheetMatrix[11][8] = "NOVATO POLIZAS VIDA";
sheetMatrix[11][9] = "";
sheetMatrix[12][8] = "PRO POLIZAS VIDA";
sheetMatrix[12][9] = "";
sheetMatrix[13][8] = "NOVATO PRIMA VIDA";
sheetMatrix[13][9] = "";
sheetMatrix[14][8] = "PRO PRIMA VIDA";
sheetMatrix[14][9] = "";
sheetMatrix[15][8] = "NOVATO POLIZAS GMM";
sheetMatrix[15][9] = "";
sheetMatrix[16][8] = "PRO POLIZAS GMM";
sheetMatrix[16][9] = "";
sheetMatrix[17][8] = "NOVATO PRIMA GMM";
sheetMatrix[17][9] = "";
sheetMatrix[18][8] = "PRO PRIMAS GMM";
sheetMatrix[18][9] = "";

// Create sheet
const newWs = XLSX.utils.aoa_to_sheet(sheetMatrix);

// Append/Update sheet in workbook
if (wb.SheetNames.includes("AGOSTO_CORREGIDO")) {
    wb.Sheets["AGOSTO_CORREGIDO"] = newWs;
} else {
    XLSX.utils.book_append_sheet(wb, newWs, "AGOSTO_CORREGIDO");
}

XLSX.writeFile(wb, inputPath);

// Write standalone result file
const standaloneWb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(standaloneWb, newWs, "AGOSTO_CORREGIDO");
const standalonePath = path.join(__dirname, 'AGOSTO_CORREGIDO_RESULTADO.xlsx');
XLSX.writeFile(standaloneWb, standalonePath);

// Write report log
const logPath = path.join(__dirname, 'reporte_agosto.txt');
fs.writeFileSync(logPath, reportLines.join('\n'));

console.log("✅ Pestaña 'AGOSTO_CORREGIDO' procesada e insertada exitosamente en el libro principal.");
console.log(`📂 Archivo generado: ${standalonePath}`);
console.log(`📂 Reporte generado: ${logPath}`);
