import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const BASE_PATH = process.cwd();
const DB_PATH = path.join(BASE_PATH, 'db');
const SNAPSHOT_FILE = path.join(DB_PATH, 'resumen_snapshot.json');

// Helper to resolve advisor name using the directory
const resolveName = (clave, fallbackName, directory) => {
    if (!clave) return fallbackName || 'Asesor Desconocido';
    return directory[String(clave)] || fallbackName || `Asesor ${clave}`;
};

const run = () => {
    try {
        console.log('🚀 Iniciando consolidación de datos para Snapshot...');

        // 1. Cargar Directorio de Asesores
        const dirPath = path.join(BASE_PATH, 'administrador', 'directorio_asesores.xlsx');
        const directory = {};
        if (fs.existsSync(dirPath)) {
            const wbDir = XLSX.readFile(dirPath);
            const dataDir = XLSX.utils.sheet_to_json(wbDir.Sheets[wbDir.SheetNames[0]]);
            dataDir.forEach(row => {
                const clave = row.Clave || row.CLAVE || row.clave;
                const nombre = row.Nombre_Completo || row['Nombre Completo'] || row.nombre;
                if (clave && nombre) directory[String(clave)] = String(nombre).trim();
            });
        }

        const snapshot = {
            updatedAt: new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' }),
            data: {
                resumen_general: {},
                fechas_corte: {}
            }
        };

        // 2. Reporte Pagado y Emitido
        const pePath = path.join(BASE_PATH, 'administrador', 'pagado_emitidido', 'pagado_emitido.xlsx');
        if (fs.existsSync(pePath)) {
            const wb = XLSX.readFile(pePath);
            const ws = wb.Sheets[wb.SheetNames[0]];
            const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 });
            const dataRows = rawData.slice(3).filter(r => r[1] && r[1] !== 'TOTAL');
            
            snapshot.data.resumen_general.pagado_pendiente = dataRows.map(r => ({
                'Nombre Asesor': resolveName(r[1], r[2], directory),
                'Sucursal': r[3],
                'Pólizas-Pagadas': r[5],
                'Recibo_Inicial_Pagado': r[6],
                'Recibo_Ordinario_Pagado': r[7],
                'Total _Prima_Pagada': r[8],
                'Pólizas_Pendinetes': r[9],
                'Recibo_Inicial_Pendiente': r[10],
                'Recibo_Ordinario_Pendiente': r[11],
                'Total _Prima_Pendiente': r[12]
            }));
            const fechaVal = ws['A1']?.v || '';
            snapshot.data.fechas_corte.pagado_pendiente = String(fechaVal).match(/\d{1,2}\s+de\s+[a-z]+\s+de\s+\d{4}/i)?.[0] || '';
        }

        // 3. Comparativo de Vida
        const cvPath = path.join(BASE_PATH, 'administrador', 'comparativo_vida', 'comparativo vida.xlsx');
        if (fs.existsSync(cvPath)) {
            const wb = XLSX.readFile(cvPath);
            
            // Hoja Promotoria (Resumen General)
            const wsP = wb.Sheets['promotoria'] || wb.Sheets[wb.SheetNames[0]];
            const rawP = XLSX.utils.sheet_to_json(wsP, { header: 1 });
            const dataRow = rawP[4]; // Fila 5 es la data
            if (dataRow) {
                snapshot.data.resumen_general.comparativo_vida = {
                    generalSummary: {
                        Polizas_Pagadas_Año_Anterior: Number(dataRow[0] || 0),
                        Polizas_Pagadas_Año_Actual: Number(dataRow[1] || 0),
                        Crec_Polizas_Pagadas: Number(dataRow[2] || 0),
                        '%_Crec_Polizas_Pagadas': Number(dataRow[3] || 0),
                        Prima_Pagada_Año_Anterior: Number(dataRow[4] || 0),
                        'Prima_Pagada_Añoa_Actual': Number(dataRow[5] || 0), // Respetando el typo del Excel
                        Crec_Prima_Pagada: Number(dataRow[6] || 0),
                        '%_Crec_Prima_Pagada': Number(dataRow[7] || 0),
                        Recluta_Año_Anterior: Number(dataRow[8] || 0),
                        Recluta_Año_Actual: Number(dataRow[9] || 0),
                        Crec_Recluta: Number(dataRow[10] || 0),
                        '%_Crec_Recluta': Number(dataRow[11] || 0),
                        Prima_Pagada_Reclutas_Año_Anterior: Number(dataRow[12] || 0),
                        Prima_Pagada_Reclutas_Año_Actual: Number(dataRow[13] || 0),
                        Crec_Prima_Pagada_Reclutas: Number(dataRow[14] || 0),
                        '%_Crec_Prima_Pagada_Reclutas': Number(dataRow[15] || 0)
                    },
                    individuals: []
                };
            }

            // Hoja Asesores (Detalle)
            const wsA = wb.Sheets['asesores'];
            if (wsA) {
                const rawA = XLSX.utils.sheet_to_json(wsA, { header: 1 });
                // Empezamos desde la fila 4 (index 3) que es donde están los datos de asesores
                const advisorRows = rawA.slice(6).filter(r => r[6] && r[6] !== 'TOTAL');
                snapshot.data.resumen_general.comparativo_vida.individuals = advisorRows.map(r => ({
                    'Nombre del Asesor': resolveName(r[5], r[6], directory),
                    'Sucursal': r[3],
                    'Polizas_Pagadas_Año_Anterior': Number(r[15] || 0),
                    'Polizas_Pagadas_Año_Actual': Number(r[16] || 0),
                    'Prima_Pagada_Año_Anterior': Number(r[23] || 0),
                    'Prima_Pagada_Año_Actual': Number(r[24] || 0),
                }));
            }
            const fechaCV = wsP['A1']?.v || '';
            snapshot.data.fechas_corte.comparativo_vida = String(fechaCV).match(/\d{1,2}\s+de\s+[a-z]+\s+de\s+\d{4}/i)?.[0] || '';
        }

        // 4. Proactivos
        const proPath = path.join(BASE_PATH, 'administrador', 'proactivos', 'Proactivos.xlsx');
        if (fs.existsSync(proPath)) {
            const wb = XLSX.readFile(proPath);
            const ws = wb.Sheets['Resumen Proactivos'] || wb.Sheets[0];
            const data = XLSX.utils.sheet_to_json(ws);
            snapshot.data.resumen_general.proactivos = data.map(r => ({
                ...r,
                ASESOR: resolveName(r.Asesor, r.ASESOR, directory)
            }));
            const fechaPro = ws['A1']?.v || '';
            snapshot.data.fechas_corte.proactivos = String(fechaPro).match(/\d{1,2}\s+de\s+[a-z]+\s+de\s+\d{4}/i)?.[0] || '';
        }

        if (!fs.existsSync(DB_PATH)) fs.mkdirSync(DB_PATH);
        fs.writeFileSync(SNAPSHOT_FILE, JSON.stringify(snapshot, null, 2));
        console.log('✅ Snapshot actualizado exitosamente en db/resumen_snapshot.json');

    } catch (e) {
        console.error('❌ Error en consolidación:', e);
    }
};

run();
