import XLSX from 'xlsx';
import path from 'path';

const BASE_PATH = process.cwd();
const dirPath = path.join(BASE_PATH, 'administrador', 'directorio_asesores.xlsx');

const wbDir = XLSX.readFile(dirPath);
const sheet = wbDir.Sheets[wbDir.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet);
const row = data.find(r => String(r.Clave || r.CLAVE).trim() === '101640');
if (row) {
    const name = row.Nombre_Completo || row['Nombre Completo'] || row.nombre;
    console.log('Row name:', name);
    for (let i = 0; i < name.length; i++) {
        console.log(`char[${i}]: ${name[i]} (code: ${name.charCodeAt(i)})`);
    }
} else {
    console.log('Row 101640 not found');
}
