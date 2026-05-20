import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPORT_PATH = path.join(__dirname, '../estatus polizas/reportes/2026-05/reporte_2026-05-20_inactivos.json');

if (!fs.existsSync(REPORT_PATH)) {
    console.error('El reporte no existe.');
    process.exit(1);
}

const data = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf-8'));

const targets = [
    { name: 'MARIA JOSE GUZMAN ZAMORA', clave: '114431' },
    { name: 'ANGELICA YADIRA ROMERO JAUREGUI', clave: '108920' },
    { name: 'BRUNO BRAULIO MACIAS ALVAREZ', clave: '113076' },
    { name: 'JOSE ALBERTO CORONADO ROSAS', clave: '94205' }
];

targets.forEach(t => {
    const advisor = data.asesores.find(a => a.clave === t.clave);
    console.log(`\n========================================`);
    console.log(`👤 ASESOR: ${t.name} (${t.clave})`);
    
    if (!advisor) {
        console.log('No se encontró información para este asesor.');
        return;
    }
    
    console.log(`📊 Total histórico de pólizas: ${advisor.total_polizas}`);
    console.log(`Estatus de su cartera:`);
    Object.keys(advisor.estatus).forEach(status => {
        console.log(`- ${status}: ${advisor.estatus[status]}`);
    });
});
