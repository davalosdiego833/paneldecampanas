import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ACTIVE_PATH = path.join(__dirname, '../estatus polizas/reportes/2026-05/reporte_2026-05-20.json');
const INACTIVE_PATH = path.join(__dirname, '../estatus polizas/reportes/2026-05/reporte_2026-05-20_inactivos.json');

const activeData = JSON.parse(fs.readFileSync(ACTIVE_PATH, 'utf-8'));
const inactiveData = JSON.parse(fs.readFileSync(INACTIVE_PATH, 'utf-8'));

function searchAdvisors(data, typeLabel) {
    console.log(`\n========================================`);
    console.log(`🔍 BUSCANDO EN REPORTE DE ${typeLabel.toUpperCase()}`);
    console.log(`========================================`);
    
    data.asesores.forEach(a => {
        const nameUpper = a.nombre.toUpperCase();
        if (nameUpper.includes('ISAI') || nameUpper.includes('VALERIA') || nameUpper.includes('MACIAS')) {
            console.log(`👤 ASESOR: ${a.nombre} (${a.clave})`);
            console.log(`📊 Total histórico de pólizas: ${a.total_polizas}`);
            console.log(`Estatus de su cartera:`);
            if (Object.keys(a.estatus).length === 0) {
                console.log(`- (Sin pólizas registradas)`);
            } else {
                Object.keys(a.estatus).forEach(status => {
                    console.log(`- ${status}: ${a.estatus[status]}`);
                });
            }
            console.log(`----------------------------------------`);
        }
    });
}

searchAdvisors(activeData, 'Activos');
searchAdvisors(inactiveData, 'Inactivos');
