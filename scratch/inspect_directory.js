import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const BASE_PATH = process.cwd();
const dirPath = path.join(BASE_PATH, 'administrador', 'directorio_asesores.xlsx');

if (!fs.existsSync(dirPath)) {
    console.log('directory_asesores.xlsx not found at', dirPath);
    process.exit(1);
}

const wbDir = XLSX.readFile(dirPath);
const dataDir = XLSX.utils.sheet_to_json(wbDir.Sheets[wbDir.SheetNames[0]]);
console.log('Total directory rows:', dataDir.length);
console.log('Sample directory rows:');
dataDir.slice(0, 10).forEach(row => {
    console.log(`Clave: ${row.Clave || row.CLAVE || row.clave} -> Nombre: ${row.Nombre_Completo || row['Nombre Completo'] || row.nombre}`);
});

// Let's also check for names with special characters (e.g. Ñ or accents)
console.log('\nRows with special chars (Ñ, accents):');
dataDir.forEach(row => {
    const name = String(row.Nombre_Completo || row['Nombre Completo'] || row.nombre || '');
    if (name.includes('Ñ') || name.includes('Ñ') || name.includes('PEÑA') || name.includes('UREÑA') || name.includes('AMBRIZ') || name.includes('Ó')) {
        console.log(`Clave: ${row.Clave || row.CLAVE} -> ${name}`);
    }
});
