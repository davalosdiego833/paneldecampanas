import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const BASE_PATH = process.cwd();
const DB_PATH = path.join(BASE_PATH, 'db');
const SNAPSHOT_FILE = path.join(DB_PATH, 'resumen_snapshot.json');

// FILTRO ÚNICO: Solo Matriz 2043
// FILTRO ÚNICO: Solo Matriz 2043
const VALID_SUCURSAL = '2043';
const SUCURSALES_ADMIN = ['2043', '2856', '2692', '2511', '313']; // IDs conocidos de la promo

// Helper to resolve advisor name using the directory
const resolveName = (clave, fallbackName, directory) => {
    if (!clave) return fallbackName || 'Asesor Desconocido';
    const claveStr = String(clave).trim();
    return directory[claveStr] || fallbackName || `Asesor ${claveStr}`;
};

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
    // Buscamos en las primeras 3 hojas, primeras 5 filas
    for (let i = 0; i < Math.min(wb.SheetNames.length, 3); i++) {
        const ws = wb.Sheets[wb.SheetNames[i]];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1, range: 0 });
        for (let r = 0; r < 5; r++) {
            const row = data[r];
            if (!row) continue;
            for (const val of row) {
                if (!val) continue;
                
                // Opción 1: Es una fecha de Excel (Número entre 45000 y 47000 aprox para 2023-2028)
                if (typeof val === 'number' && val > 45000 && val < 47000) {
                    return formatExcelDate(val);
                }

                // Opción 2: Es un string que parece fecha
                const str = String(val).toUpperCase();
                if (/\d{1,2}\s+(?:DE\s+)?[A-ZÁÉÍÓÚÑ]{3,}\s+(?:DE\s+)?\d{4}/i.test(str)) {
                    return formatExcelDate(val);
                }
            }
        }
    }
    return '';
};

const run = () => {
    try {
        console.log('🚀 Iniciando restauración de Snapshot (Solo Matriz 2043)...');

        // 1. Cargar Directorio de Asesores
        const dirPath = path.join(BASE_PATH, 'administrador', 'directorio_asesores.xlsx');
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

        const snapshot = {
            updatedAt: new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' }),
            data: {
                resumen_general: {},
                fechas_corte: {}
            }
        };

        const rg = snapshot.data.resumen_general;
        const fc = snapshot.data.fechas_corte;

        // 2. Reporte Pagado y Pendiente
        const pePath = path.join(BASE_PATH, 'administrador', 'pagado_emitidido', 'pagado_emitido.xlsx');
        if (fs.existsSync(pePath)) {
            const wb = XLSX.readFile(pePath);
            const ws = wb.Sheets[wb.SheetNames[0]];
            const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 });
            
            // Brain Rule: Include if Sucursal is 2043 OR if advisor exists in our directory (Managers/Gerencias)
            const dataRows = rawData.slice(3).filter(r => {
                const claveStr = String(r[0] || '').trim();
                const sucursalStr = String(r[1] || '').trim();
                const nameInExcel = String(r[2] || '').trim();
                
                const isOurSucursal = sucursalStr === VALID_SUCURSAL || sucursalStr === '2856' || sucursalStr === '2511';
                const isInDirectory = !!directory[claveStr];

                // Alert if it's a known sucursal but missing in directory
                if (isOurSucursal && !isInDirectory && nameInExcel) {
                    console.warn(`⚠️ ALERTA: Clave ${claveStr} (${nameInExcel}) de sucursal ${sucursalStr} no está en el directorio.`);
                }

                return nameInExcel && (isOurSucursal || isInDirectory);
            });
            
            rg.pagado_pendiente = dataRows.map(r => ({
                'Nombre Asesor': resolveName(r[0], r[2], directory),
                'Sucursal': r[1],
                'Pólizas-Pagadas': Number(r[5] || 0),
                'Recibo_Inicial_Pagado': Number(r[6] || 0),
                'Recibo_Ordinario_Pagado': Number(r[7] || 0),
                'Total _Prima_Pagada': Number(r[8] || 0),
                'Pólizas_Pendinetes': Number(r[9] || 0),
                'Recibo_Inicial_Pendiente': Number(r[10] || 0),
                'Recibo_Ordinario_Pendiente': Number(r[11] || 0),
                'Total _Prima_Pendiente': Number(r[12] || 0)
            }));
            fc.pagado_pendiente = extractCutoffDate(wb);
        }

        // 3. Asesores sin Emisión
        const sinEmPath = path.join(BASE_PATH, 'administrador', 'asesores_sin_emision', 'Asesores sin Emision.xls');
        if (fs.existsSync(sinEmPath)) {
            const wb = XLSX.readFile(sinEmPath);
            const wsP = wb.Sheets['Promotores'];
            const wsA = wb.Sheets['Asesores'];
            
            rg.asesores_sin_emision = { summaryBySucursal: [], individuals: [] };
            
            if (wsP) {
                const dat = XLSX.utils.sheet_to_json(wsP, { header: 1, range: 3 });
                rg.asesores_sin_emision.summaryBySucursal = dat
                    .filter(r => {
                        const sucId = String(r[1] || r[4] || '').trim();
                        return SUCURSALES_ADMIN.includes(sucId);
                    })
                    .map(r => ({
                        Sucursal: r[5] || r[2],
                        Suc: r[4] || r[1],
                        Agentes: Number(r[6] || 0),
                        Asesores_con_Emisión_Vida: Number(r[7] || 0),
                        '%_Asesores_con_Emisión_Vida': Number(r[8] || 0),
                        Asesores_con_Emisión_GMM: Number(r[9] || 0),
                        '%_Asesores_con_Emisión_GMM': Number(r[10] || 0),
                        Asesores_con_pol_Pagada_Vida: Number(r[11] || 0),
                        '%_Asesores_con_pol_Pagada_Vida': Number(r[12] || 0),
                        Asesores_con_pol_Pagada_GMM: Number(r[13] || 0),
                        '%_Asesores_con_pol_Pagada_GMM': Number(r[14] || 0),
                        Prima_Pagada_Vida: Number(r[15] || 0),
                        Prima_Pagada_GMM: Number(r[16] || 0)
                    }));
            }
            
            if (wsA) {
                const dat = XLSX.utils.sheet_to_json(wsA, { header: 1, range: 4 });
                rg.asesores_sin_emision.individuals = dat
                    .filter(r => {
                        const claveStr = String(r[6] || '').trim();
                        const sucId = String(r[3] || r[4] || '').trim();
                        return SUCURSALES_ADMIN.includes(sucId) || !!directory[claveStr];
                    })
                    .map(r => ({
                        Asesor: resolveName(r[6], r[7], directory),
                        Clave: r[6],
                        Sucursal: r[5],
                        Suc: r[4],
                        Emitido_Vida: Number(r[10] || 0),
                        Emitido_GMM: Number(r[11] || 0),
                        Pagado_Vida: Number(r[12] || 0),
                        Pagado_GMM: Number(r[13] || 0),
                        Prima_Pagada_Vida: Number(r[14] || 0),
                        Prima_Pagada_GMM: Number(r[15] || 0),
                        Sin_Emisión_Vida: r[16],
                        Sin_Emisión_GMM: r[17],
                        '3_Meses_Sin_Emisión_Vida': r[18],
                        '3_Meses_Sin_Emisión_GMM': r[19]
                    }));
            }
            fc.asesores_sin_emision = extractCutoffDate(wb);
        }

        // 4. Proactivos
        const proPath = path.join(BASE_PATH, 'administrador', 'proactivos', 'Proactivos.xlsx');
        if (fs.existsSync(proPath)) {
            const wb = XLSX.readFile(proPath);
            const ws = wb.Sheets['Detalle Asesores'] || wb.Sheets[wb.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(ws, { header: 1, range: 4 });
            
            rg.proactivos = data
                .filter(r => {
                    const claveStr = String(r[4] || '').trim();
                    const sucId = String(r[2] || r[3] || '').trim();
                    return r[4] && (SUCURSALES_ADMIN.includes(sucId) || !!directory[claveStr]);
                })
                .map(r => ({
                    ASESOR: resolveName(r[4], null, directory),
                    SUC: r[3],
                    'Polizas_Acumuladas_Mes_Ant.': Number(r[9] || 0),
                    'Polizas_Del_mes': Number(r[10] || 0),
                    'Polizas_Acumuladas_Total': Number(r[11] || 0),
                    'Proactivo_al_mes': r[12],
                    'Pólizas_Faltantes': Number(r[13] || 0),
                    'Proactivo_a_Dic': r[14],
                    'Pólizas_Faltantes_Para_Dic': Number(r[15] || 0)
                }));
            fc.proactivos = extractCutoffDate(wb);
        }

        // 5. Comparativo de Vida
        const cvPath = path.join(BASE_PATH, 'administrador', 'comparativo_vida', 'comparativo vida.xlsx');
        if (fs.existsSync(cvPath)) {
            const wb = XLSX.readFile(cvPath);
            const wsP = wb.Sheets['promotoria'] || wb.Sheets[wb.SheetNames[0]];
            const rawP = XLSX.utils.sheet_to_json(wsP, { header: 1 });
            const dataRow = rawP[4];
            
            if (dataRow) {
                const parseVal = (v) => {
                    if (v == null || v === '') return 0;
                    if (typeof v === 'number') return v;
                    const clean = String(v).replace(/[%,\s]/g, '');
                    const n = parseFloat(clean);
                    return isNaN(n) ? 0 : (String(v).includes('%') ? n / 100 : n);
                };

                rg.comparativo_vida = {
                    generalSummary: {
                        Polizas_Pagadas_Año_Anterior: parseVal(dataRow[0]),
                        Polizas_Pagadas_Año_Actual: parseVal(dataRow[1]),
                        Crec_Polizas_Pagadas: parseVal(dataRow[2]),
                        '%_Crec_Polizas_Pagadas': parseVal(dataRow[3]),
                        Prima_Pagada_Año_Anterior: parseVal(dataRow[4]),
                        'Prima_Pagada_Añoa_Actual': parseVal(dataRow[5]),
                        Crec_Prima_Pagada: parseVal(dataRow[6]),
                        '%_Crec_Prima_Pagada': parseVal(dataRow[7]),
                        Recluta_Año_Anterior: parseVal(dataRow[8]),
                        Recluta_Año_Actual: parseVal(dataRow[9]),
                        Crec_Recluta: parseVal(dataRow[10]),
                        '%_Crec_Recluta': parseVal(dataRow[11]),
                        Prima_Pagada_Reclutas_Año_Anterior: parseVal(dataRow[12]),
                        Prima_Pagada_Reclutas_Año_Actual: parseVal(dataRow[13]),
                        Crec_Prima_Pagada_Reclutas: parseVal(dataRow[14]),
                        '%_Crec_Prima_Pagada_Reclutas': parseVal(dataRow[15])
                    },
                    individuals: []
                };
            }

            const wsA = wb.Sheets['asesores'];
            if (wsA) {
                const rawA = XLSX.utils.sheet_to_json(wsA, { header: 1, range: 6 });
                rg.comparativo_vida.individuals = rawA
                    .filter(r => {
                        const claveStr = String(r[5] || '').trim();
                        const sucId = String(r[3] || r[4] || '').trim();
                        return r[6] && r[6] !== 'TOTAL' && (SUCURSALES_ADMIN.includes(sucId) || !!directory[claveStr]);
                    })
                    .map(r => ({
                        'Nombre del Asesor': resolveName(r[5], r[6], directory),
                        'Sucursal': r[3],
                        'Polizas_Pagadas_Año_Anterior': Number(r[15] || 0),
                        'Polizas_Pagadas_Año_Actual': Number(r[16] || 0),
                        'Crec_Polizas_Pagadas': Number(r[17] || 0),
                        '%_Crec_Polizas_Pagadas': Number(r[18] || 0),
                        'Prima_Pagada_Año_Anterior': Number(r[23] || 0),
                        'Prima_Pagada_Año_Actual': Number(r[24] || 0),
                        'Crec_Prima_Pagada': Number(r[25] || 0),
                        '%_Crec_Prima_Pagada': Number(r[26] || 0)
                    }));
            }
            fc.comparativo_vida = extractCutoffDate(wb);
        }

        if (!fs.existsSync(DB_PATH)) fs.mkdirSync(DB_PATH);
        fs.writeFileSync(SNAPSHOT_FILE, JSON.stringify(snapshot, null, 2));
        console.log('✅ Snapshot restaurado (FILTRO 2043) exitosamente!');

    } catch (e) {
        console.error('❌ Error en consolidación:', e);
    }
};

run();
