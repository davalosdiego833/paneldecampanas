const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const baseDir = '/Users/diego/Desktop/panel de campañas';
const cvPath = path.join(baseDir, 'administrador', 'comparativo_vida', 'Comparativo Vida.xlsm');
const dirPath = path.join(baseDir, 'administrador', 'directorio_asesores.xlsx');

// 1. Load directory names
const directory = {};
if (fs.existsSync(dirPath)) {
    const wbDir = XLSX.readFile(dirPath);
    const dataDir = XLSX.utils.sheet_to_json(wbDir.Sheets[wbDir.SheetNames[0]]);
    dataDir.forEach(row => {
        const clave = row.Clave || row.CLAVE || row.clave;
        const nombre = row.Nombre_Completo || row['Nombre Completo'] || row.nombre;
        if (clave && nombre) directory[String(clave).trim()] = String(nombre).trim();
    });
}

const fallbackPath = path.join(baseDir, 'estatus polizas', 'reportes', 'lista_asesores.json');
if (fs.existsSync(fallbackPath)) {
    try {
        const fallbacks = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
        fallbacks.forEach(item => {
            const clave = String(item.clave || '').trim();
            if (clave && !directory[clave]) {
                directory[clave] = String(item.nombre || '').trim();
            }
        });
    } catch (e) {}
}

const cleanName = (name) => {
    if (!name) return '';
    return name.replace(/Ð/g, 'Ñ').trim().toUpperCase();
};

if (!fs.existsSync(cvPath)) {
    console.error("Comparativo Vida.xlsm not found!");
    process.exit(1);
}

const wb = XLSX.readFile(cvPath);
const wsA = wb.Sheets['Detalle de Asesores'] || wb.Sheets['asesores'];
const rawA = XLSX.utils.sheet_to_json(wsA, { header: 1, range: 6 });

const PROMO_SUCURSALES = ['2043', '2856', '2511'];
const results = [];

rawA.forEach(r => {
    if (!r || r.length === 0) return;

    const nameInExcel = String(r[8] || '').trim();
    const sucursal = String(r[5] || '').trim();
    const clave = String(r[7] || '').trim();
    const polActual = Number(r[18] || 0);

    if (nameInExcel && nameInExcel !== 'TOTAL' && (PROMO_SUCURSALES.includes(sucursal) || !!directory[clave])) {
        let name = directory[clave] || r[8] || `Asesor ${clave}`;
        name = cleanName(name);

        if (polActual <= 3) {
            results.push({
                name,
                clave,
                sucursal: sucursal || '2043',
                polActual
            });
        }
    }
});

// Sort by current year policies ascending, then by name
results.sort((a, b) => a.polActual - b.polActual || a.name.localeCompare(b.name));

console.log('TOTAL_RESULTS:', results.length);
console.log('RESULTS:', JSON.stringify(results, null, 2));
