import XLSX from 'xlsx';
import path from 'path';

const BASE_PATH = process.cwd();
const dirPath = path.join(BASE_PATH, 'administrador', 'directorio_asesores.xlsx');
const wbDir = XLSX.readFile(dirPath);
const dataDir = XLSX.utils.sheet_to_json(wbDir.Sheets[wbDir.SheetNames[0]]);

const matches = dataDir.filter(r => {
    const name = String(r.Nombre_Completo || r['Nombre Completo'] || r.nombre || '');
    return name.toUpperCase().includes('MARIO') || name.toUpperCase().includes('IVAN');
});

console.log('Matches for MARIO or IVAN in directory:', matches);
