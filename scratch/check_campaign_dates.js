import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

const formatExcelDate = (val) => {
    const monthsNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    if (typeof val === 'number') {
        const d = XLSX.SSF.parse_date_code(val);
        if (d) {
            const year = d.y < 100 ? (d.y < 30 ? 2000 + d.y : 1900 + d.y) : d.y;
            return `${d.d} de ${monthsNames[d.m - 1]} de ${year}`;
        }
    }
    return String(val || '').trim();
};

const extractCutoffDate = (wb) => {
    for (let i = 0; i < Math.min(wb.SheetNames.length, 3); i++) {
        const ws = wb.Sheets[wb.SheetNames[i]];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1, range: 0 });
        for (let r = 0; r < 10; r++) { // More rows just in case
            const row = data[r];
            if (!row) continue;
            for (const val of row) {
                if (!val) continue;
                if (typeof val === 'number' && val > 44000 && val < 48000) {
                    return formatExcelDate(val);
                }
                const str = String(val).toUpperCase();
                if (/\d{1,2}\s+(?:DE\s+)?[A-ZÁÉÍÓÚÑ]{3,}\s+(?:DE\s+)?\d{4}/i.test(str)) {
                    return str;
                }
            }
        }
    }
    return 'No encontrada';
};

const campaigns = [
    { name: 'Graduación', path: 'graduacion/graduacion.xlsx' },
    { name: 'Camino a la Cumbre', path: 'camino_cumbre/CAMINO A LA CUMBRE.xlsx' },
    { name: 'Convenciones', path: 'convenciones/Convenciones Asesores.xlsx' },
    { name: 'Fan Fest', path: 'fanfest/FanFest Asesores.xlsx' },
    { name: 'Vive tu Pasión', path: 'vive_tu_pasion/VIVE TU PASIO\u0301N.xlsx' }
];

console.log('📅 Fechas de Corte Detectadas:');
campaigns.forEach(c => {
    if (fs.existsSync(c.path)) {
        const wb = XLSX.readFile(c.path);
        console.log(`- ${c.name}: ${extractCutoffDate(wb)}`);
    } else {
        console.log(`- ${c.name}: Archivo no encontrado (${c.path})`);
    }
});
