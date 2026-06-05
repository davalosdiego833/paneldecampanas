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

// Helper to get the most recent file in a folder
const getMostRecentFile = (dirPath) => {
    if (!fs.existsSync(dirPath)) return null;
    const files = fs.readdirSync(dirPath).filter(f => (f.endsWith('.xlsx') || f.endsWith('.xlsm')) && !f.startsWith('~$'));
    if (files.length === 0) return null;
    
    return files.map(f => {
        const fullPath = path.join(dirPath, f);
        return { file: f, mtime: fs.statSync(fullPath).mtime.getTime() };
    }).sort((a, b) => b.mtime - a.mtime)[0].file;
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
    // Buscamos en las primeras 3 hojas, primeras 30 filas
    for (let i = 0; i < Math.min(wb.SheetNames.length, 3); i++) {
        const ws = wb.Sheets[wb.SheetNames[i]];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1, range: 0 });
        for (let r = 0; r < 30; r++) {
            const row = data[r];
            if (!row) continue;
            for (const val of row) {
                if (!val) continue;
                
                // Opción 1: Es una fecha de Excel (Número entre 45000 y 47000 aprox para 2023-2028)
                if (typeof val === 'number' && val > 45000 && val < 47000) {
                    return formatExcelDate(val);
                }

                // Opción 2: Es un string que parece fecha (ej. "Avance al 27 de mayo de 2026")
                const str = String(val);
                const match = str.match(/\d{1,2}\s+(?:de\s+)?[a-záéíóúñ]{3,}\s+(?:de\s+)?\d{4}/i);
                if (match) {
                    return match[0].toLowerCase();
                }
            }
        }
    }
    return '';
};

const run = async () => {
    try {
        console.log('🚀 Iniciando restauración de Snapshot (Solo Matriz 2043)...');

        // HISTORIAL: Guardar snapshot anterior para comparación de alertas
        if (fs.existsSync(SNAPSHOT_FILE)) {
            const PREV_FILE = path.join(DB_PATH, 'resumen_snapshot_prev.json');
            fs.copyFileSync(SNAPSHOT_FILE, PREV_FILE);
            console.log('📸 Snapshot anterior guardado para comparación.');
        }

        // 1. Cargar Directorio de Asesores
        const dirPath = path.join(BASE_PATH, 'administrador', 'directorio_asesores.xlsx');
        const directory = {};
        const directoryFechas = {};
        if (fs.existsSync(dirPath)) {
            const wbDir = XLSX.readFile(dirPath);
            const dataDir = XLSX.utils.sheet_to_json(wbDir.Sheets[wbDir.SheetNames[0]]);
            dataDir.forEach(row => {
                const clave = row.Clave || row.CLAVE || row.clave;
                const nombre = row.Nombre_Completo || row['Nombre Completo'] || row.nombre;
                if (clave && nombre) directory[String(clave).trim()] = String(nombre).trim();
                
                const fechaConexion = row.FECHA_CONEXION || row.Fecha_Conexion || row.fecha_conexion || '';
                if (clave && fechaConexion) {
                    let fechaConexionStr = fechaConexion;
                    if (typeof fechaConexion === 'number' && fechaConexion > 30000) {
                        const dateObj = new Date((fechaConexion - 25569) * 86400 * 1000);
                        // Convert to ISO without timezone shifting it back a day
                        const year = dateObj.getFullYear();
                        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                        const day = String(dateObj.getDate()).padStart(2, '0');
                        fechaConexionStr = `${year}-${month}-${day}`;
                    } else if (fechaConexion instanceof Date) {
                        const year = fechaConexion.getFullYear();
                        const month = String(fechaConexion.getMonth() + 1).padStart(2, '0');
                        const day = String(fechaConexion.getDate()).padStart(2, '0');
                        fechaConexionStr = `${year}-${month}-${day}`;
                    }
                    directoryFechas[String(clave).trim()] = String(fechaConexionStr).trim();
                }
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
        let sinEmPath = path.join(BASE_PATH, 'administrador', 'asesores_sin_emision', 'Asesores sin Emision.xlsx');
        if (!fs.existsSync(sinEmPath)) {
            sinEmPath = path.join(BASE_PATH, 'administrador', 'asesores_sin_emision', 'Asesores sin Emision.xls');
        }
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
                .map(r => {
                    const claveStr = String(r[4] || '').trim();
                    return {
                        ASESOR: resolveName(r[4], null, directory),
                        SUC: r[3],
                        'Polizas_Acumuladas_Mes_Ant.': Number(r[9] || 0),
                        'Polizas_Del_mes': Number(r[10] || 0),
                        'Polizas_Acumuladas_Total': Number(r[11] || 0),
                        'Proactivo_al_mes': r[12],
                        'Pólizas_Faltantes': Number(r[13] || 0),
                        'Proactivo_a_Dic': r[14],
                        'Pólizas_Faltantes_Para_Dic': Number(r[15] || 0),
                        'Fecha_Conexion': directoryFechas[claveStr] || 'N/A'
                    };
                });
            fc.proactivos = extractCutoffDate(wb);
        }

        // 5. Comparativo de Vida
        let cvPath = path.join(BASE_PATH, 'administrador', 'comparativo_vida', 'Comparativo Vida.xlsm');
        if (!fs.existsSync(cvPath)) {
            cvPath = path.join(BASE_PATH, 'administrador', 'comparativo_vida', 'comparativo vida.xlsx');
        }
        if (fs.existsSync(cvPath)) {
            const wb = XLSX.readFile(cvPath);
            const wsP = wb.Sheets['Resumen x Prom'] || wb.Sheets['promotoria'] || wb.Sheets[wb.SheetNames[1]];
            const rawP = XLSX.utils.sheet_to_json(wsP, { header: 1 });
            const dataRow = rawP.find(r => r && (String(r[3]).trim() === '2043' || String(r[1]).includes('2043') || String(r[2]).includes('2043'))) || [];
            
            if (dataRow) {
                const parseVal = (v) => {
                    if (v == null || v === '') return 0;
                    if (typeof v === 'number') return v;
                    const clean = String(v).replace(/[%,\s]/g, '');
                    const n = parseFloat(clean);
                    return isNaN(n) ? 0 : (String(v).includes('%') ? n / 100 : n);
                };

                const isRaw = !!wb.Sheets['Detalle de Asesores'];
                
                if (isRaw) {
                    rg.comparativo_vida = {
                        generalSummary: {
                            Polizas_Pagadas_Año_Anterior: parseVal(dataRow[9]),
                            Polizas_Pagadas_Año_Actual: parseVal(dataRow[10]),
                            Crec_Polizas_Pagadas: parseVal(dataRow[11]),
                            '%_Crec_Polizas_Pagadas': parseVal(dataRow[12]),
                            Prima_Pagada_Año_Anterior: parseVal(dataRow[21]),
                            Prima_Pagada_Año_Actual: parseVal(dataRow[22]),
                            Crec_Prima_Pagada: parseVal(dataRow[23]),
                            '%_Crec_Prima_Pagada': parseVal(dataRow[24])
                        },
                        individuals: []
                    };
                } else {
                    rg.comparativo_vida = {
                        generalSummary: {
                            Polizas_Pagadas_Año_Anterior: parseVal(dataRow[0]),
                            Polizas_Pagadas_Año_Actual: parseVal(dataRow[1]),
                            Crec_Polizas_Pagadas: parseVal(dataRow[2]),
                            '%_Crec_Polizas_Pagadas': parseVal(dataRow[3]),
                            Prima_Pagada_Año_Anterior: parseVal(dataRow[4]),
                            Prima_Pagada_Año_Actual: parseVal(dataRow[5]),
                            Crec_Prima_Pagada: parseVal(dataRow[6]),
                            '%_Crec_Prima_Pagada': parseVal(dataRow[7])
                        },
                        individuals: []
                    };
                }
            }

            const wsA = wb.Sheets['Detalle de Asesores'] || wb.Sheets['asesores'];
            if (wsA) {
                const rawA = XLSX.utils.sheet_to_json(wsA, { header: 1, range: 6 });
                const isRaw = !!wb.Sheets['Detalle de Asesores'];
                
                const PROMO_SUCURSALES = ['2043', '2856', '2511'];
                
                const individuals = rawA
                    .filter(r => {
                        const sucId2 = String(r[isRaw ? 5 : 4] || '').trim();
                        return r[isRaw ? 8 : 6] && r[isRaw ? 8 : 6] !== 'TOTAL' && 
                               (PROMO_SUCURSALES.includes(sucId2));
                    })
                    .map(r => {
                        const sucId2 = String(r[isRaw ? 5 : 4] || '').trim();
                        return {
                            'Nombre del Asesor': resolveName(r[isRaw ? 7 : 5], r[isRaw ? 8 : 6], directory),
                            'Sucursal': sucId2,
                            'Polizas_Pagadas_Año_Anterior': Number(r[isRaw ? 17 : 15] || 0),
                            'Polizas_Pagadas_Año_Actual': Number(r[isRaw ? 18 : 16] || 0),
                            'Crec_Polizas_Pagadas': Number(r[isRaw ? 19 : 17] || 0),
                            '%_Crec_Polizas_Pagadas': Number(r[isRaw ? 20 : 18] || 0),
                            'Prima_Pagada_Año_Anterior': Number(r[isRaw ? 25 : 23] || 0),
                            'Prima_Pagada_Año_Actual': Number(r[isRaw ? 26 : 24] || 0),
                            'Crec_Prima_Pagada': Number(r[isRaw ? 27 : 25] || 0),
                            '%_Crec_Prima_Pagada': Number(r[isRaw ? 28 : 26] || 0)
                        };
                    });

                rg.comparativo_vida.individuals = individuals;

                // Recalculate summary from individuals to represent ONLY promo sucursales (2043, 2856, 2511)
                const sumField = (key) => individuals.reduce((s, r) => s + (Number(r[key]) || 0), 0);
                const polAnt = sumField('Polizas_Pagadas_Año_Anterior');
                const polAct = sumField('Polizas_Pagadas_Año_Actual');
                const primaAnt = sumField('Prima_Pagada_Año_Anterior');
                const primaAct = sumField('Prima_Pagada_Año_Actual');
                const safePct = (crec, ant) => ant !== 0 ? crec / ant : 0;
                rg.comparativo_vida.generalSummary = {
                    Polizas_Pagadas_Año_Anterior: polAnt,
                    Polizas_Pagadas_Año_Actual: polAct,
                    Crec_Polizas_Pagadas: polAct - polAnt,
                    '%_Crec_Polizas_Pagadas': safePct(polAct - polAnt, polAnt),
                    Prima_Pagada_Año_Anterior: primaAnt,
                    'Prima_Pagada_Añoa_Actual': primaAct,
                    Crec_Prima_Pagada: primaAct - primaAnt,
                    '%_Crec_Prima_Pagada': safePct(primaAct - primaAnt, primaAnt)
                };
            }
            fc.comparativo_vida = extractCutoffDate(wb);
        }

        // ===================== CAMPAÑAS =====================
        const SUCURSALES_PROMO = ['2043'];
        const MONTHS_ES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
        const campaigns = {};
        const campaignDates = {};

        // Helper para leer excels que traen basura (logos, fechas) en las primeras filas
        const extractData = (ws) => {
            const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 });
            let headerIdx = -1;
            for (let i = 0; i < Math.min(30, rawData.length); i++) {
                const row = rawData[i];
                if (row && row.some(cell => {
                    const c = String(cell).toLowerCase().trim();
                    return c === 'asesor' || c === 'mat' || c === 'mat / unidad' || c === 'nombre del asesor';
                })) {
                    headerIdx = i;
                    break;
                }
            }
            if (headerIdx === -1) headerIdx = 0;
            return XLSX.utils.sheet_to_json(ws, { range: headerIdx });
        };

        // MDRT
        try {
            console.log('Processing mdrt');
            const mdrtPath = path.join(BASE_PATH, 'mdrt');
            const files = fs.readdirSync(mdrtPath).filter(f => f.endsWith('.xlsx') || f.endsWith('.xlsm'));
            if (files.length > 0) {
                const wb = XLSX.readFile(path.join(mdrtPath, files[0]));
                const sheetName = wb.SheetNames.find(n => n.toUpperCase() === 'MDRT') || wb.SheetNames[0];
                const ws = wb.Sheets[sheetName];
                const data = extractData(ws);
                campaigns.mdrt = data.filter(r => {
                    const matKey = Object.keys(r).find(k => k && (k.trim().toUpperCase() === 'MATRIZ' || k.trim().toUpperCase() === 'MAT' || k.trim().toUpperCase() === 'MAT / UNIDAD'));
                    return SUCURSALES_PROMO.includes(String(r[matKey] || ''));
                }).map(r => {
                    const paKey = Object.keys(r).find(k => k && (k.trim().toUpperCase() === 'TOTAL PRIMA' || k.trim().toUpperCase() === 'CAMINO PRIMA' || k.trim().toUpperCase() === 'PRIMA ANUALIZADA' || k.trim().toUpperCase() === 'PRIMA PONDERADA MDRT'));
                    const nameKey = Object.keys(r).find(k => k && (k.trim().toUpperCase() === 'NOMBRE DEL ASESOR' || k.trim().toUpperCase() === 'ASESOR'));
                    const claveKey = r['Clave'] ? 'Clave' : (Object.keys(r).find(k => k && k.trim().toUpperCase() === 'ASESOR') || nameKey);
                    return { Asesor: resolveName(r[claveKey] || r[nameKey], null, directory), Clave: String(r[claveKey] || ''), PA_Acumulada: Number(r[paKey] || 0) };
                });
                campaignDates.mdrt = extractCutoffDate(wb);
            }
        } catch(e) { console.warn('⚠️ MDRT skip:', e.message); }

        // Convenciones
        try {
            console.log('Processing convenciones');
            const convPath = path.join(BASE_PATH, 'convenciones');
            const recentFile = getMostRecentFile(convPath);
            if (recentFile) {
                const wb = XLSX.readFile(path.join(convPath, recentFile));
                const ws = wb.Sheets[wb.SheetNames[0]];
                const data = XLSX.utils.sheet_to_json(ws, { header: 1, range: 'A20:AL15000' });
                const allRows = data.slice(1);
                let c480 = 0, c228 = 0, c108 = 0, c28 = 0;
                allRows.forEach(r => {
                    const l = Number(r[32]);
                    if (l === 480) c480 = Number(r[24] || 0);
                    if (l === 228) c228 = Number(r[24] || 0);
                    if (l === 108) c108 = Number(r[24] || 0);
                    if (l === 28) c28 = Number(r[24] || 0);
                });
                campaigns.convenciones = allRows.filter(r => SUCURSALES_PROMO.includes(String(r[4] || ''))).map(r => ({
                    Asesor: resolveName(r[7], null, directory), Clave: String(r[7] || ''),
                    PA_Total: Number(r[24] || 0), Polizas: Number(r[28] || 0),
                    Lugar: Number(r[32] || 9999), Lugar_480: c480, Lugar_228: c228, Lugar_108: c108, Lugar_28: c28,
                    Comision_Vida: Number(r[11] || 0), RDA: Number(r[18] || 0)
                }));
                campaignDates.convenciones = extractCutoffDate(wb);
            }
        } catch(e) { console.warn('⚠️ Convenciones skip:', e.message); }

        // Legión Centurión
        try {
            console.log('Processing legion_centurion');
            const legPath = path.join(BASE_PATH, 'legion_centurion');
            const recentFile = getMostRecentFile(legPath);
            if (recentFile) {
                const wb = XLSX.readFile(path.join(legPath, recentFile));
                const ws = wb.Sheets[wb.SheetNames[0]];
                const data = XLSX.utils.sheet_to_json(ws, { header: 1, range: 11 });
                const b9 = ws['B9']?.v || '';
                const mMatch = String(b9).toLowerCase().match(/(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/);
                const mIndex = mMatch ? MONTHS_ES.indexOf(mMatch[1]) + 1 : 1;
                campaigns.legion_centurion = data.slice(1).filter(r => SUCURSALES_PROMO.includes(String(r[4] || ''))).map(r => ({
                    Asesor: resolveName(r[6], null, directory), Clave: String(r[6] || ''),
                    Total_Polizas: Number(r[10] || 0), Mes_Actual: mIndex,
                    Nivel: r[13] || '', EnMeta: String(r[12] || '').toLowerCase() === 'p'
                }));
                campaignDates.legion_centurion = String(b9).match(/\d{1,2}\s+de\s+[a-z]+\s+de\s+\d{4}/i)?.[0] || '';
            }
        } catch(e) { console.warn('⚠️ Legión skip:', e.message); }

        // Camino a la Cumbre
        try {
            console.log('Processing camino_cumbre');
            const ccPath = path.join(BASE_PATH, 'camino_cumbre');
            const recentFile = getMostRecentFile(ccPath);
            if (recentFile) {
                const wb = XLSX.readFile(path.join(ccPath, recentFile));
                const ws = wb.Sheets[wb.SheetNames[0]];
                const data = extractData(ws);
                campaigns.camino_cumbre = data.filter(r => {
                    const matKey = Object.keys(r).find(k => k && (k.trim().toUpperCase() === 'MATRIZ' || k.trim().toUpperCase() === 'MAT' || k.trim().toUpperCase() === 'MAT / UNIDAD'));
                    return SUCURSALES_PROMO.includes(String(r[matKey] || r[3] || ''));
                }).map(r => {
                    const paKey = Object.keys(r).find(k => k && k.trim().toUpperCase().includes('TOTAL'));
                    const nameKey = Object.keys(r).find(k => k && (k.trim().toUpperCase() === 'NOMBRE DEL ASESOR' || k.trim().toUpperCase() === 'ASESOR'));
                    const claveKey = r['Clave'] ? 'Clave' : (Object.keys(r).find(k => k && k.trim().toUpperCase() === 'ASESOR') || nameKey);
                    return {
                        Asesor: resolveName(r[nameKey] || r[claveKey] || r[5], null, directory), Clave: String(r[claveKey] || r[5] || ''),
                        Mes_Asesor: Number(r.Mes_Asesor || r['Mes'] || r['MES'] || r[10] || 1), Polizas_Totales: Number(r.Polizas_Totales || r[paKey] || r[13] || 0)
                    };
                });
                campaignDates.camino_cumbre = extractCutoffDate(wb);
            }
        } catch(e) { console.warn('⚠️ Camino skip:', e.message); }

        // Fan Fest
        try {
            console.log('Processing fanfest');
            const ffPath = path.join(BASE_PATH, 'fanfest');
            const recentFile = getMostRecentFile(ffPath);
            if (recentFile) {
                const wb = XLSX.readFile(path.join(ffPath, recentFile));
                const ws = wb.Sheets['ASESORES'] || wb.Sheets[wb.SheetNames[0]];
                const data = XLSX.utils.sheet_to_json(ws, { header: 1, range: 7 });
                campaigns.fanfest = data.slice(2).filter(r => SUCURSALES_PROMO.includes(String(r[4] || ''))).map(r => ({
                    Asesor: resolveName(r[6], null, directory), Clave: String(r[6] || ''),
                    Total_Polizas: Number(r[13] || 0),
                    Condicion: String(r[12] || '').toLowerCase() === 'p',
                    Premio: String(r[14] || '').toLowerCase() === 'p' ? 'GANADO' : 'PENDIENTE'
                }));
                campaignDates.fanfest = extractCutoffDate(wb);
            }
        } catch(e) { console.warn('⚠️ FanFest skip:', e.message); }

        // Vive Tu Pasión
        try {
            console.log('Processing vive_tu_pasion');
            const vtpPath = path.join(BASE_PATH, 'vive_tu_pasion');
            const recentFile = getMostRecentFile(vtpPath);
            if (recentFile) {
                const wb = XLSX.readFile(path.join(vtpPath, recentFile));
                const ws = wb.Sheets['ASESORES'] || wb.Sheets[wb.SheetNames[0]];
                const data = XLSX.utils.sheet_to_json(ws, { header: 1, range: 7 });
                campaigns.vive_tu_pasion = data.slice(2).filter(r => SUCURSALES_PROMO.includes(String(r[4] || ''))).map(r => ({
                    Asesor: resolveName(r[6], null, directory), Clave: String(r[6] || ''),
                    Polizas: Number(r[8] || 0), Comisiones: Number(r[9] || 0),
                    Premio: r[10] || ''
                }));
                campaignDates.vive_tu_pasion = extractCutoffDate(wb);
            }
        } catch(e) { console.warn('⚠️ VTP skip:', e.message); }

        // Graduación
        try {
            console.log('Processing graduacion');
            const gradPath = path.join(BASE_PATH, 'graduacion');
            const recentFile = getMostRecentFile(gradPath);
            if (recentFile) {
                const wb = XLSX.readFile(path.join(gradPath, recentFile));
                let wsName = wb.SheetNames.find(n => n.toLowerCase().includes('encuentroii') || n.toLowerCase().includes('desarrollo (2)') || n.toLowerCase().includes('detalle') || n.toLowerCase().includes('asesores'));
                if (!wsName) wsName = wb.SheetNames[0];
                const ws = wb.Sheets[wsName];
                const data = extractData(ws);
                campaigns.graduacion = data.filter(r => {
                    const matKey = Object.keys(r).find(k => k && (k.trim().toUpperCase() === 'MATRIZ' || k.trim().toUpperCase() === 'MAT' || k.trim().toUpperCase() === 'MAT / UNIDAD'));
                    return SUCURSALES_PROMO.includes(String(r[matKey] || r[3] || ''));
                }).map(r => {
                    const paKey = Object.keys(r).find(k => k && (k.trim().toUpperCase().includes('TOTAL') || k.trim().toUpperCase().includes('VIGOR')));
                    const nameKey = Object.keys(r).find(k => k && (k.trim().toUpperCase() === 'NOMBRE DEL ASESOR' || k.trim().toUpperCase() === 'ASESOR' || k.trim().toUpperCase() === 'NOMBRE'));
                    const claveKey = r['Clave'] ? 'Clave' : (Object.keys(r).find(k => k && (k.trim().toUpperCase() === 'ASESOR' || k.trim().toUpperCase() === 'CLAVE')) || nameKey);
                    const limitKey = Object.keys(r).find(k => k && (k.trim().toUpperCase().includes('LÍMITE') || k.trim().toUpperCase().includes('LIMITE')));
                    return {
                        Asesor: r.Asesor || r[nameKey] ? String(r.Asesor || r[nameKey]) : resolveName(r.Clave || r[claveKey] || r[6], null, directory), Clave: String(r.Clave || r[claveKey] || r[6] || ''),
                        Mes_Asesor: Number(r.Mes_Asesor || r['Mes'] || r['mes'] || r['MES'] || 1), Polizas_Totales: Number(r.Polizas_Totales || r[paKey] || r['EN VIGOR'] || 0),
                        Fecha_Limite_Meta: r[limitKey] ? formatExcelDate(r[limitKey]) : '',
                        Comisones: Number(r.Comisones || r['TOTAL_1'] || Object.keys(r).reverse().find(k => k && k.trim().toUpperCase().includes('TOTAL')) ? r[Object.keys(r).reverse().find(k => k && k.trim().toUpperCase().includes('TOTAL'))] : 0)
                    };
                });
                campaignDates.graduacion = extractCutoffDate(wb);
            }
        } catch(e) { console.warn('⚠️ Graduación skip:', e.message); }

        snapshot.data.campaigns = campaigns;
        snapshot.data.campaignDates = campaignDates;

        if (!fs.existsSync(DB_PATH)) fs.mkdirSync(DB_PATH);
        fs.writeFileSync(SNAPSHOT_FILE, JSON.stringify(snapshot, null, 2));
        console.log('✅ Snapshot restaurado (FILTRO 2043) exitosamente!');

        // AUTO-GENERAR ALERTAS comparando snapshot anterior vs nuevo
        try {
            const { generateAlerts } = await import('./generar_alertas.js');
            generateAlerts();
        } catch (e) {
            console.warn('⚠️ No se pudieron generar alertas (generar_alertas.js):', e.message);
        }

    } catch (e) {
        console.error('❌ Error en consolidación:', e);
    }
};

run();
