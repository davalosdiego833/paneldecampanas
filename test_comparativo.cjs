const XLSX = require('xlsx');
const fs = require('fs');

const wb = XLSX.readFile('tmp_admin/Comparativo Vida.xlsm');
const wsP = wb.Sheets['Resumen x Prom'] || wb.Sheets[wb.SheetNames[1]];
const rawP = XLSX.utils.sheet_to_json(wsP, { header: 1 });

const dataRow = rawP.find(r => r && (String(r[3]).trim() === '2043' || String(r[1]).includes('2043') || String(r[2]).includes('2043'))) || [];

console.log("dataRow:");
console.log(dataRow);
console.log("Summary:");
console.log({
    Polizas_Pagadas_Año_Anterior: dataRow[9],
    Polizas_Pagadas_Año_Actual: dataRow[10],
    Crec_Polizas_Pagadas: dataRow[11],
    '%_Crec_Polizas_Pagadas': dataRow[12],
    Prima_Pagada_Año_Anterior: dataRow[21],
    Prima_Pagada_Año_Actual: dataRow[22],
    Crec_Prima_Pagada: dataRow[23],
    '%_Crec_Prima_Pagada': dataRow[24]
});

const wsA = wb.Sheets['Detalle de Asesores'] || wb.Sheets['asesores'];
const rawA = XLSX.utils.sheet_to_json(wsA, { header: 1, range: 6 });
console.log("Asesor row sample:");
const asesor = rawA.find(r => r && (String(r[3]) === '2043' || String(r[4]) === '2043'));
console.log(asesor);
if (asesor) {
    console.log("Asesor mapped:");
    console.log({
        'Clave': String(asesor[6] || '').trim(),
        'Nombre del Asesor': asesor[7],
        'Sucursal': asesor[4],
        'Polizas_Pagadas_Año_Anterior': Number(asesor[16] || 0),
        'Polizas_Pagadas_Año_Actual': Number(asesor[17] || 0),
        'Crec_Polizas_Pagadas': Number(asesor[18] || 0),
        '%_Crec_Polizas_Pagadas': Number(asesor[19] || 0),
        'Prima_Pagada_Año_Anterior': Number(asesor[24] || 0),
        'Prima_Pagada_Año_Actual': Number(asesor[25] || 0),
        'Crec_Prima_Pagada': Number(asesor[26] || 0),
        '%_Crec_Prima_Pagada': Number(asesor[27] || 0)
    });
}
