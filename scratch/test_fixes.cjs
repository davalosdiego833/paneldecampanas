const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const SUCURSALES_PROMO = ['2043'];

const cleanNameText = (text) => {
    if (!text) return '';
    return String(text).replace(/Ð/g, 'Ñ').replace(/ð/g, 'ñ').trim();
};

const formatExcelDate = (val) => {
    const monthsNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    if (typeof val === 'number') {
        const d = XLSX.SSF.parse_date_code(val);
        if (d) {
            const year = d.y < 100 ? (d.y < 30 ? 2000 + d.y : 1900 + d.y) : d.y;
            return `${d.d} de ${monthsNames[d.m - 1]} de ${year}`;
        }
    }
    return String(val || '').trim();
};

const extractData = (ws) => {
    const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 });
    let headerIdx = -1;
    for (let i = 0; i < Math.min(30, rawData.length); i++) {
        const row = rawData[i];
        if (row && row.some(cell => {
            const c = String(cell).toLowerCase().trim();
            return c === 'asesor' || c === 'mat' || c === 'mat / unidad' || c === 'nombre del asesor' || c === 'matriz';
        })) {
            headerIdx = i;
            break;
        }
    }
    if (headerIdx === -1) headerIdx = 0;
    return XLSX.utils.sheet_to_json(ws, { range: headerIdx });
};

// TEST CAMINO CUMBRE
console.log('=== TEST CAMINO CUMBRE ===');
const wbCC = XLSX.readFile('camino_cumbre/Camino a la Cumbre.xlsx');
let wsCC = wbCC.Sheets['Participante'] || wbCC.Sheets[wbCC.SheetNames[0]];
let dataCC = extractData(wsCC);

const resCC = dataCC.filter(r => {
    const matKey = Object.keys(r).find(k => k && (k.trim().toUpperCase() === 'MATRIZ' || k.trim().toUpperCase() === 'MAT' || k.trim().toUpperCase() === 'MAT / UNIDAD' || k.trim().toUpperCase() === 'PROM_MAT'));
    return SUCURSALES_PROMO.includes(String(r[matKey] || ''));
}).map(r => {
    const nameKey = Object.keys(r).find(k => k && (k.trim().toUpperCase() === 'NOMBRE DEL ASESOR' || k.trim().toUpperCase() === 'ASESOR' || k.trim().toUpperCase() === 'NOMBRE'));
    const claveKey = r['Clave'] ? 'Clave' : (Object.keys(r).find(k => k && (k.trim().toUpperCase() === 'NUM_AGENTE' || k.trim().toUpperCase() === 'CLAVE')) || nameKey);
    const mesAsesorKey = Object.keys(r).find(k => k && (k.trim().toUpperCase() === 'MES ASESOR' || k.trim().toUpperCase() === 'MES_ASESOR' || k.trim().toUpperCase() === 'MES'));
    const polizasKey = Object.keys(r).find(k => k && (k.trim().toUpperCase().includes('POLIZA') || k.trim().toUpperCase().includes('PÓLIZA') || k.trim().toUpperCase() === 'TOTAL POLIZAS' || k.trim().toUpperCase() === 'POLIZAS TOTALES'));
    
    const m1Key = Object.keys(r).find(k => k && k.trim().toUpperCase() === 'MES 1');
    const m2Key = Object.keys(r).find(k => k && k.trim().toUpperCase() === 'MES 2');
    const m3Key = Object.keys(r).find(k => k && k.trim().toUpperCase() === 'MES 3');
    return {
        Asesor: r[nameKey] || r[claveKey], Clave: String(r[claveKey] || ''),
        Mes_Asesor: Number(r[mesAsesorKey] || 1), Polizas_Totales: Number(r[polizasKey] || 0),
        Mes_1_Prod: Number(r[m1Key] || 0), Mes_2_Prod: Number(r[m2Key] || 0), Mes_3_Prod: Number(r[m3Key] || 0)
    };
});
console.log('Camino Cumbre count:', resCC.length);
console.log('Sample CC:', resCC.slice(0, 5));

// TEST GRADUACION
console.log('\n=== TEST GRADUACION ===');
const wbGrad = XLSX.readFile('graduacion/Graduacion Asesores.xlsm');
const gradSheetName = wbGrad.SheetNames.find(n => n.toLowerCase().includes('desarrollo')) || wbGrad.SheetNames[0];
console.log('Grad Sheet used:', gradSheetName);
let wsGrad = wbGrad.Sheets[gradSheetName];

const rawGradRows = XLSX.utils.sheet_to_json(wsGrad, { header: 1 });
let hIdx = -1;
for (let i = 0; i < Math.min(30, rawGradRows.length); i++) {
    const row = rawGradRows[i];
    if (row && row.some(cell => {
        const c = String(cell).toLowerCase().trim();
        return c === 'asesor' || c === 'mat' || c === 'promotor / partner' || c === 'nombre';
    })) {
        hIdx = i;
        break;
    }
}

console.log('Grad Header row index:', hIdx);
const rawHeaderRow = rawGradRows[hIdx] || [];
const headers = Array.from({ length: rawHeaderRow.length }, (_, i) => String(rawHeaderRow[i] || '').trim().toUpperCase());
console.log('Headers:', headers);

const matIdx = headers.findIndex(h => h === 'MAT' || h === 'MATRIZ');
const claveIdx = headers.findIndex(h => h === 'ASESOR' || h === 'NUM_AGENTE');
const nameIdx = headers.findIndex(h => h === 'NOMBRE' || h === 'NOMBRE DEL ASESOR');
const mesIdx = headers.findIndex(h => h === 'MES' || h === 'MES ASESOR');
const limiteIdx = headers.findIndex(h => h.includes('LÍMITE') || h.includes('LIMITE'));

// Polizas total is the first 'TOTAL' or 'TOTAL POLIZAS'
const polizasIdx = headers.findIndex(h => h === 'TOTAL' || h.includes('POLIZA'));
// Comisiones total is the second 'TOTAL' or column after VIDA/GMM
const comIdx = headers.findIndex((h, idx) => idx > polizasIdx && (h === 'TOTAL' || h.includes('COMISION')));

console.log({ matIdx, claveIdx, nameIdx, mesIdx, limiteIdx, polizasIdx, comIdx });

const resGrad = rawGradRows.slice(hIdx + 1).filter(r => {
    const matVal = String(r[matIdx] || '').trim();
    return SUCURSALES_PROMO.includes(matVal) && r[claveIdx];
}).map(r => {
    return {
        Asesor: cleanNameText(r[nameIdx] || r[claveIdx]),
        Clave: String(r[claveIdx] || ''),
        Mes_Asesor: Number(r[mesIdx] || 0),
        Polizas_Totales: Number(r[polizasIdx] || 0),
        Comisones: Number(r[comIdx] || 0),
        Fecha_Limite_Meta: formatExcelDate(r[limiteIdx])
    };
});

console.log('Graduacion count:', resGrad.length);
console.log('Sample Grad:', resGrad);
