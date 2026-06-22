const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const baseDir = '/Users/diego/Desktop/panel de campañas';
const sinEmPath = path.join(baseDir, 'administrador', 'asesores_sin_emision', 'Asesores sin Emision.xls');
const pagPath = path.join(baseDir, 'administrador', 'pagado_emitido', 'pagado_emitido.xlsx');
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

// 2. Load June Paid Vida (POLPAG) from pagado_emitido.xlsx
const junePaid = {};
let juneCutoff = 'Junio 2026';
if (fs.existsSync(pagPath)) {
    const wbPag = XLSX.readFile(pagPath);
    const wsPag = wbPag.Sheets[wbPag.SheetNames[0]];
    const dataPag = XLSX.utils.sheet_to_json(wsPag, { header: 1 });
    if (dataPag[0] && dataPag[0][0]) {
        juneCutoff = dataPag[0][0];
    }
    // Data rows start at index 3
    for (let i = 3; i < dataPag.length; i++) {
        const row = dataPag[i];
        if (row && row[0]) {
            const clave = String(row[0]).trim();
            const polpag = Number(row[5] || 0); // POLPAG is at column index 5
            junePaid[clave] = polpag;
        }
    }
}

// 3. Load Asesores sin Emisión (May data)
if (!fs.existsSync(sinEmPath)) {
    console.error("Asesores sin Emision.xls not found!");
    process.exit(1);
}

const wbSin = XLSX.readFile(sinEmPath);
const wsSin = wbSin.Sheets['Asesores'];
const dataSin = XLSX.utils.sheet_to_json(wsSin, { header: 1 });

const SUCURSALES_ADMIN = ['2043', '2856', '2511'];
const results = [];

// Header is at index 4, data starts at index 6
for (let i = 6; i < dataSin.length; i++) {
    const row = dataSin[i];
    if (!row || row.length === 0) continue;

    const mat = String(row[3] || '').trim();
    const suc = String(row[4] || '').trim();
    const clave = String(row[6] || '').trim();

    // Check if advisor belongs to our sucursales
    const isOurSucursal = SUCURSALES_ADMIN.includes(mat) || SUCURSALES_ADMIN.includes(suc);
    const isInDirectory = !!directory[clave];

    if (clave && (isOurSucursal || isInDirectory)) {
        let name = directory[clave] || row[7] || `Asesor ${clave}`;
        name = cleanName(name);

        const paidMay = Number(row[12] || 0); // Pagado Vida is index 12
        const paidJune = junePaid[clave] || 0;
        const totalSemestre = paidMay + paidJune;

        if (totalSemestre <= 3) {
            results.push({
                name,
                clave,
                sucursal: suc || mat || '2043',
                paidMay,
                paidJune,
                totalSemestre
            });
        }
    }
}

// Sort results by total Semestre ascending, then by name
results.sort((a, b) => a.totalSemestre - b.totalSemestre || a.name.localeCompare(b.name));

console.log('JUNE_CUTOFF:', juneCutoff);
console.log('TOTAL_RESULTS:', results.length);
console.log('RESULTS:', JSON.stringify(results, null, 2));
