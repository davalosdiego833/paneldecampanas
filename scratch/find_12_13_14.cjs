const XLSX = require('xlsx');
const fs = require('fs');

const proPath = '/Users/diego/Desktop/panel de campañas/administrador/proactivos/Proactivos.xlsx';
const dirPath = '/Users/diego/Desktop/panel de campañas/administrador/directorio_asesores.xlsx';

// Load directory
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

const fallbackPath = '/Users/diego/Desktop/panel de campañas/estatus polizas/reportes/lista_asesores.json';
if (fs.existsSync(fallbackPath)) {
    try {
        const fallbacks = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
        fallbacks.forEach(item => {
            const clave = String(item.clave || '').trim();
            if (clave && !directory[clave]) {
                directory[clave] = String(item.nombre || '').trim();
            }
        });
    } catch (e) {
        console.error('Error loading fallback list:', e.message);
    }
}

const wb = XLSX.readFile(proPath);
const ws = wb.Sheets['Detalle Asesores'] || wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws, { range: 5 });

const cutoffDate = new Date(2026, 5, 15); // June 15, 2026

const getExcelDate = (num) => {
    if (!num) return null;
    const serial = Number(num);
    if (isNaN(serial)) return null;
    return new Date(Math.round((serial - 25569) * 86400 * 1000));
};

const getMonthsDiff = (d1, d2) => {
    return (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
};

const cleanName = (name) => {
    if (!name) return '';
    return name.replace(/Ð/g, 'Ñ');
};

const results = [];

data.forEach((r, idx) => {
    const matVal = String(r['Mat'] || r['Matriz'] || '').trim();
    if (matVal !== '2043') return;

    const clave = String(r['ASESOR'] || r['Asesor'] || r['NUM_AGENTE'] || '').trim();
    let name = directory[clave] || r['Asesor'] || `Asesor ${clave}`;
    name = cleanName(name);
    const conVal = r['Conexión'] || r['CONEXIÓN'];
    const proactivoVal = String(r['Proactivo al mes'] || '').trim().toLowerCase(); // 'p' or 'i'
    
    const conDate = getExcelDate(conVal);
    if (!conDate) return;

    const months = getMonthsDiff(conDate, cutoffDate);
    
    if (months === 12 || months === 13 || months === 14) {
        results.push({
            name,
            clave,
            connectionDate: conDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }),
            months,
            isProactive: proactivoVal === 'p',
            proactivoRaw: proactivoVal,
            row: idx + 7
        });
    }
});

console.log(JSON.stringify(results, null, 2));
