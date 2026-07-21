import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BASE_PATH = __dirname;
const DB_PATH = path.join(BASE_PATH, 'db');
const SNAPSHOT_FILE = path.join(DB_PATH, 'resumen_snapshot.json');

// FILTRO ÚNICO: Solo Matriz 2043
// FILTRO ÚNICO: Solo Matriz 2043
const VALID_SUCURSAL = '2043';
const SUCURSALES_ADMIN = ['2043', '2856', '2511']; // IDs conocidos de la promo

const cleanNameText = (text) => {
    if (!text) return '';
    return String(text).replace(/Ð/g, 'Ñ').replace(/ð/g, 'ñ').trim();
};

// Helper to resolve advisor name using the directory
const resolveName = (clave, fallbackName, directory) => {
    if (!clave) return cleanNameText(fallbackName || 'Asesor Desconocido');
    const claveStr = String(clave).trim();
    const resolved = directory[claveStr] || fallbackName || `Asesor ${claveStr}`;
    return cleanNameText(resolved);
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

const readExcelSheetMemorySafe = (filePath, sheetSelector) => {
    const tempWb = XLSX.readFile(filePath, { bookSheets: true });
    let targetSheet = null;
    if (typeof sheetSelector === 'function') {
        targetSheet = tempWb.SheetNames.find(sheetSelector);
    } else if (typeof sheetSelector === 'string') {
        targetSheet = tempWb.SheetNames.find(n => n.toUpperCase() === sheetSelector.toUpperCase());
    } else if (typeof sheetSelector === 'number') {
        targetSheet = tempWb.SheetNames[sheetSelector];
    }
    if (!targetSheet) {
        targetSheet = tempWb.SheetNames[0];
    }
    const wb = XLSX.readFile(filePath, { sheets: [targetSheet] });
    wb.SheetNames = [targetSheet];
    return wb;
};

const SUCURSALES_PROMO = ['2043'];
const MONTHS_ES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

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

        const runStepInline = (step, campaigns, campaignDates, directory, directoryFechas) => {
            if (step === 'mdrt') {
                try {
                    console.log('Processing mdrt');
                    const mdrtPath = path.join(BASE_PATH, 'mdrt');
                    const recentFile = getMostRecentFile(mdrtPath);
                    if (recentFile) {
                        let wb = readExcelSheetMemorySafe(path.join(mdrtPath, recentFile), n => n.toUpperCase() === 'MDRT');
                        let ws = wb.Sheets[wb.SheetNames[0]];
                        let data = extractData(ws);
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
                        wb = null; ws = null; data = null;
                    }
                } catch(e) { console.warn('⚠️ MDRT skip:', e.message); }
            } else if (step === 'convenciones') {
                try {
                    console.log('Processing convenciones');
                    const convPath = path.join(BASE_PATH, 'convenciones');
                    const recentFile = getMostRecentFile(convPath);
                    if (recentFile) {
                        let wb = readExcelSheetMemorySafe(path.join(convPath, recentFile), 0);
                        let ws = wb.Sheets[wb.SheetNames[0]];
                        let data = XLSX.utils.sheet_to_json(ws, { header: 1, range: 'A20:AL15000' });
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
                        wb = null; ws = null; data = null;
                    }
                } catch(e) { console.warn('⚠️ Convenciones skip:', e.message); }
            } else if (step === 'legion_centurion') {
                try {
                    console.log('Processing legion_centurion');
                    const legPath = path.join(BASE_PATH, 'legion_centurion');
                    const recentFile = getMostRecentFile(legPath);
                    if (recentFile) {
                        let wb = readExcelSheetMemorySafe(path.join(legPath, recentFile), 0);
                        let ws = wb.Sheets[wb.SheetNames[0]];
                        let data = XLSX.utils.sheet_to_json(ws, { header: 1, range: 11 });
                        const b9 = ws['B9']?.v || '';
                        const mMatch = String(b9).toLowerCase().match(/(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/);
                        const mIndex = mMatch ? MONTHS_ES.indexOf(mMatch[1]) + 1 : 1;
                        campaigns.legion_centurion = data.slice(1).filter(r => SUCURSALES_PROMO.includes(String(r[4] || ''))).map(r => ({
                            Asesor: resolveName(r[6], null, directory), Clave: String(r[6] || ''),
                            Total_Polizas: Number(r[10] || 0), Mes_Actual: mIndex,
                            Nivel: r[13] || '', EnMeta: String(r[11] || '').toLowerCase() === 'p'
                        }));
                        campaignDates.legion_centurion = String(b9).match(/\d{1,2}\s+de\s+[a-z]+\s+de\s+\d{4}/i)?.[0] || '';
                        wb = null; ws = null; data = null;
                    }
                } catch(e) { console.warn('⚠️ Legión skip:', e.message); }
            } else if (step === 'camino_cumbre') {
                try {
                    console.log('Processing camino_cumbre');
                    const ccPath = path.join(BASE_PATH, 'camino_cumbre');
                    const recentFile = getMostRecentFile(ccPath);
                    if (recentFile) {
                        let wb = readExcelSheetMemorySafe(path.join(ccPath, recentFile), 0);
                        let ws = wb.Sheets['Participante'] || wb.Sheets[wb.SheetNames[0]];
                        let data = extractData(ws);
                        campaigns.camino_cumbre = data.filter(r => {
                            const matKey = Object.keys(r).find(k => k && (k.trim().toUpperCase() === 'MATRIZ' || k.trim().toUpperCase() === 'MAT' || k.trim().toUpperCase() === 'MAT / UNIDAD' || k.trim().toUpperCase() === 'PROM_MAT'));
                            return SUCURSALES_PROMO.includes(String(r[matKey] || ''));
                        }).map(r => {
                            const nameKey = Object.keys(r).find(k => k && (k.trim().toUpperCase() === 'NOMBRE DEL ASESOR' || k.trim().toUpperCase() === 'ASESOR' || k.trim().toUpperCase() === 'NOMBRE'));
                            const claveKey = r['Clave'] ? 'Clave' : (Object.keys(r).find(k => k && (k.trim().toUpperCase() === 'NUM_AGENTE' || k.trim().toUpperCase() === 'CLAVE')) || nameKey);
                            const mesAsesorKey = Object.keys(r).find(k => k && (k.trim().toUpperCase() === 'MES ASESOR' || k.trim().toUpperCase() === 'MES_ASESOR' || k.trim().toUpperCase() === 'MES'));
                            const polizasKey = Object.keys(r).find(k => k && (k.trim().toUpperCase() === 'TOTAL' || k.trim().toUpperCase() === 'PÓLIZAS TOTALES' || k.trim().toUpperCase() === 'TOTAL POLIZAS' || k.trim().toUpperCase() === 'POLIZAS TOTALES')) || Object.keys(r).find(k => k && (k.trim().toUpperCase().includes('POLIZA') || k.trim().toUpperCase().includes('PÓLIZA')));
                            
                            // trimestres
                            const m1Key = Object.keys(r).find(k => k && k.trim().toUpperCase() === 'MES 1');
                            const m2Key = Object.keys(r).find(k => k && k.trim().toUpperCase() === 'MES 2');
                            const m3Key = Object.keys(r).find(k => k && k.trim().toUpperCase() === 'MES 3');
                            return {
                                Asesor: resolveName(r[claveKey] || r[nameKey], null, directory), Clave: String(r[claveKey] || ''),
                                Mes_Asesor: Number(r[mesAsesorKey] || 1), Polizas_Totales: Number(r[polizasKey] || 0),
                                Mes_1_Prod: Number(r[m1Key] || 0), Mes_2_Prod: Number(r[m2Key] || 0), Mes_3_Prod: Number(r[m3Key] || 0)
                            };
                        });
                        campaignDates.camino_cumbre = extractCutoffDate(wb);
                        wb = null; ws = null; data = null;
                    }
                } catch(e) { console.warn('⚠️ Camino Cumbre skip:', e.message); }
            } else if (step === 'graduacion') {
                try {
                    console.log('Processing graduacion');
                    const gradPath = path.join(BASE_PATH, 'graduacion');
                    const recentFile = getMostRecentFile(gradPath);
                    if (recentFile) {
                        const selector = n => n.toLowerCase().includes('desarrollo');
                        let wb = readExcelSheetMemorySafe(path.join(gradPath, recentFile), selector);
                        let ws = wb.Sheets[wb.SheetNames[0]];
                        
                        const rawGradRows = XLSX.utils.sheet_to_json(ws, { header: 1 });
                        let hIdx = -1;
                        for (let i = 0; i < Math.min(30, rawGradRows.length); i++) {
                            const row = rawGradRows[i];
                            if (row && row.some(cell => {
                                const c = String(cell).toLowerCase().trim();
                                return c === 'asesor' || c === 'mat' || c === 'promotor / partner' || c === 'nombre';
                            })) {
                                hIdx = i;
                                break;
                            }
                        }
                        if (hIdx === -1) hIdx = 0;
                        const rawHeaderRow = rawGradRows[hIdx] || [];
                        const headers = Array.from({ length: rawHeaderRow.length }, (_, i) => String(rawHeaderRow[i] || '').trim().toUpperCase());
                        
                        const matIdx = headers.findIndex(h => h === 'MAT' || h === 'MATRIZ');
                        const claveIdx = headers.findIndex(h => h === 'ASESOR' || h === 'NUM_AGENTE');
                        const nameIdx = headers.findIndex(h => h === 'NOMBRE' || h === 'NOMBRE DEL ASESOR');
                        const mesIdx = headers.findIndex(h => h === 'MES' || h === 'MES ASESOR');
                        const limiteIdx = headers.findIndex(h => h.includes('LÍMITE') || h.includes('LIMITE'));
                        const polizasIdx = headers.findIndex(h => h === 'TOTAL' || h.includes('POLIZA'));
                        const comIdx = headers.findIndex((h, idx) => idx > polizasIdx && (h === 'TOTAL' || h.includes('COMISION')));

                        campaigns.graduacion = rawGradRows.slice(hIdx + 1).filter(r => {
                            const matVal = String(r[matIdx] || '').trim();
                            return SUCURSALES_PROMO.includes(matVal) && r[claveIdx];
                        }).map(r => {
                            return {
                                Asesor: resolveName(r[claveIdx], r[nameIdx], directory),
                                Clave: String(r[claveIdx] || ''),
                                Mes_Asesor: Number(r[mesIdx] || 0),
                                Polizas_Totales: Number(r[polizasIdx] || 0),
                                Comisones: Number(r[comIdx] || 0),
                                Fecha_Limite_Meta: formatExcelDate(r[limiteIdx])
                            };
                        });
                        campaignDates.graduacion = extractCutoffDate(wb);
                        wb = null; ws = null;
                    }
                } catch(e) { console.warn('⚠️ Graduación skip:', e.message); }
            } else if (step === 'proactiva_tech') {
                try {
                    console.log('Processing proactiva_tech');
                    const ptPath = path.join(BASE_PATH, 'proactivatech');
                    const recentFile = getMostRecentFile(ptPath);
                    if (recentFile) {
                        const selector = n => n.toLowerCase().includes('asesores');
                        let wb = readExcelSheetMemorySafe(path.join(ptPath, recentFile), selector);
                        let ws = wb.Sheets[wb.SheetNames[0]];
                        let data = XLSX.utils.sheet_to_json(ws, { range: 6 });
                        const advisorsData = data.slice(1);

                        const getExcelYear = (val) => {
                            if (!val) return 0;
                            const num = Number(val);
                            if (!isNaN(num)) {
                                const date = new Date(Math.round((num - 25569) * 86400 * 1000));
                                return date.getUTCFullYear();
                            }
                            const str = String(val).trim();
                            const match = str.match(/\b(20\d{2})\b/);
                            if (match) {
                                return parseInt(match[1], 10);
                            }
                            return 0;
                        };

                        campaigns.proactiva_tech = advisorsData.filter(r => {
                            const matVal = String(r.MATRIZ || '').trim();
                            if (matVal !== '2043') return false;

                            const conVal = r['CONEXIÓN'];
                            const year = getExcelYear(conVal);
                            return year >= 2023;
                        }).map(r => ({
                            Asesor: resolveName(r.ASESOR, null, directory),
                            Clave: String(r.ASESOR || ''),
                            Polizas: Number(r['PÓLIZAS'] || 0),
                            Comisiones: Number(r.COMISIONES || 0),
                            Ranking: Number(r.RANKING || 99999)
                        }));
                        const wsRes = wb.Sheets['RESUMEN'] || wb.Sheets[wb.SheetNames[0]];
                        const rawRes = XLSX.utils.sheet_to_json(wsRes, { header: 1 });
                        let cutoffStr = '';
                        for (let r = 0; r < Math.min(15, rawRes.length); r++) {
                            const row = rawRes[r];
                            if (!row) continue;
                            for (const val of row) {
                                if (!val) continue;
                                const str = String(val).toUpperCase();
                                if (str.includes('AVANCE AL') || str.includes('CORTE AL')) {
                                    const match = str.match(/(?:AVANCE|CORTE)\s+AL\s+(.+)$/);
                                    if (match) {
                                        cutoffStr = match[1].trim().toLowerCase()
                                            .replace('20256', '2026')
                                            .replace('2025', '2026');
                                        break;
                                    }
                                }
                            }
                            if (cutoffStr) break;
                        }
                        campaignDates.proactiva_tech = cutoffStr || '30 de junio de 2026';
                        wb = null; ws = null; data = null;
                    }
                } catch(e) { console.warn('⚠️ Proactiva Tech skip:', e.message); }
            } else if (step === 'reto_por_ciento') {
                try {
                    console.log('Processing reto_por_ciento');
                    const rpcPath = path.join(BASE_PATH, 'reto_por_ciento');
                    const recentFile = getMostRecentFile(rpcPath);
                    if (recentFile) {
                        let wb = readExcelSheetMemorySafe(path.join(rpcPath, recentFile), n => n.toUpperCase() === 'ASESORES');
                        let ws = wb.Sheets[wb.SheetNames[0]];
                        let raw = XLSX.utils.sheet_to_json(ws, { range: 7 });
                        campaigns.reto_por_ciento = raw.filter(r => {
                            const matKey = Object.keys(r).find(k => k && (k.trim().toUpperCase() === 'MATRIZ' || k.trim().toUpperCase() === 'PROM_MAT'));
                            const sucKey = Object.keys(r).find(k => k && (k.trim().toUpperCase() === 'SUCURSAL' || k.trim().toUpperCase() === 'PROM_SUC'));
                            return SUCURSALES_PROMO.includes(String(r[matKey] || '')) || SUCURSALES_PROMO.includes(String(r[sucKey] || ''));
                        }).map(r => {
                            const claveKey = Object.keys(r).find(k => k && (k.trim().toUpperCase() === 'ASESOR' || k.trim().toUpperCase() === 'NUM_AGENTE'));
                            const conexionKey = Object.keys(r).find(k => k && (k.trim().toUpperCase() === 'CONEXIÓN' || k.trim().toUpperCase() === 'CONEXION'));
                            const conteoKey = Object.keys(r).find(k => k && k.trim().toUpperCase() === 'CONTEO');
                            const cumpleKey = Object.keys(r).find(k => k && (k.trim().toUpperCase() === 'CUMPLIMIENTO' || k.trim().toUpperCase() === 'CUMPLE'));
                            const sumaKey = Object.keys(r).find(k => k && (k.trim().toUpperCase() === 'SUMA COMISIÓN' || k.trim().toUpperCase() === 'SUMA'));
                            const pctKey = Object.keys(r).find(k => k && (k.trim().toUpperCase() === 'PORCENTAJE' || k.trim().toUpperCase() === 'PORCENTAJES'));
                            const extraKey = Object.keys(r).find(k => k && (k.trim().toUpperCase() === 'EXTRACOMISION' || k.trim().toUpperCase() === 'EXTRA COMISION'));

                            const clave = String(r[claveKey] || '');
                            return {
                                Asesor: resolveName(clave, null, directory),
                                Clave: clave,
                                Conexion: formatExcelDate(r[conexionKey]),
                                Conteo: Number(r[conteoKey] || 0),
                                Cumplimiento: String(r[cumpleKey] || '').toUpperCase() === 'P',
                                Suma_Comision: Number(r[sumaKey] || 0),
                                Porcentaje: Number(r[pctKey] || 0),
                                Extracomision: Number(r[extraKey] || 0)
                            };
                        });
                        campaignDates.reto_por_ciento = extractCutoffDate(wb) || '15 de julio de 2026';
                        wb = null; ws = null; raw = null;
                    }
                } catch(e) { console.warn('⚠️ Reto Por Ciento skip:', e.message); }
            }
            if (global.gc) global.gc();
        };

        const args = process.argv.slice(2);
        const stepArg = args.find(arg => arg.startsWith('--step='));
        const step = stepArg ? stepArg.split('=')[1] : null;

        if (step) {
            console.log(`[SNAPSHOT SUBPROCESS] Running step: ${step}`);
            const campaigns = {};
            const campaignDates = {};

            runStepInline(step, campaigns, campaignDates, directory, directoryFechas);

            const stepFile = path.join(DB_PATH, `step_${step}.json`);
            fs.writeFileSync(stepFile, JSON.stringify({
                campaigns: campaigns[step] || [],
                date: campaignDates[step] || ''
            }, null, 2));
            console.log(`[SNAPSHOT SUBPROCESS] Step ${step} finished and saved to ${stepFile}`);
            process.exit(0);
        }

        // ===================== CAMPAÑAS (SPAWN SUBPROCESSES FIRST WHEN MEMORY IS LOW) =====================
        const campaigns = {};
        const campaignDates = {};

        const steps = ['mdrt', 'convenciones', 'legion_centurion', 'camino_cumbre', 'graduacion', 'proactiva_tech', 'reto_por_ciento'];
        for (const s of steps) {
            runStepInline(s, campaigns, campaignDates, directory, directoryFechas);
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
        const xlsPath1 = path.join(BASE_PATH, 'administrador', 'pagado_emitido', 'PagPend.xls');
        const xlsPath2 = path.join(BASE_PATH, 'administrador', 'pagado_emitidido', 'PagPend.xls');
        const xlsPath = fs.existsSync(xlsPath1) ? xlsPath1 : (fs.existsSync(xlsPath2) ? xlsPath2 : null);

        if (xlsPath) {
            console.log('🔄 [SNAPSHOT] Encontrado PagPend.xls original. Decriptando y filtrando...');
            try {
                const scriptPath = path.join(BASE_PATH, 'scripts', 'process_pagado_pendiente.py');
                const localVenv = path.join(BASE_PATH, '.venv', 'bin', 'python');
                const hostingerAlt = '/opt/alt/python311/bin/python3';
                const pythonBin = fs.existsSync(localVenv) ? localVenv : (fs.existsSync(hostingerAlt) ? hostingerAlt : 'python3');
                execSync(`"${pythonBin}" "${scriptPath}" "${xlsPath}"`, { stdio: 'inherit' });
            } catch (e) {
                console.error('❌ [SNAPSHOT] Error al procesar PagPend.xls:', e.message);
            }
        }

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
                        'Proactivo_al_mes': String(r[12] || '').trim().toUpperCase() === 'P' ? 'SÍ' : 'NO',
                        'Pólizas_Faltantes': Number(r[13] || 0),
                        'Proactivo_a_Dic': String(r[14] || '').trim().toUpperCase() === 'P' ? 'SÍ' : 'NO',
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
