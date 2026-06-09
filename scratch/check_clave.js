import XLSX from 'xlsx';
import path from 'path';

const BASE_PATH = process.cwd();
const dirPath = path.join(BASE_PATH, 'administrador', 'directorio_asesores.xlsx');
const wbDir = XLSX.readFile(dirPath);
const dataDir = XLSX.utils.sheet_to_json(wbDir.Sheets[wbDir.SheetNames[0]]);
const row = dataDir.find(r => String(r.Clave || r.CLAVE).trim() === '112522');
console.log('Clave 112522 row in directory:', row);
