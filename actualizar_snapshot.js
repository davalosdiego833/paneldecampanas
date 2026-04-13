import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BASE_PATH = __dirname;

const SNAPSHOT_PATH = path.join(BASE_PATH, 'db', 'resumen_snapshot.json');
const MONTHS_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const parseSpanishDate = (str) => {
    if (!str) return '';
    const match = String(str).toLowerCase().match(/(\d{1,2})\s+de\s+([a-z]+)(\s+de)?\s+(\d{4})/i);
    if (match) {
        const day = match[1].padStart(2, '0');
        const monthStr = match[2].toLowerCase();
        let mIdx = MONTHS_ES.indexOf(monthStr);
        if (mIdx === -1) {
            mIdx = MONTHS_ES.findIndex(m => m.startsWith(monthStr) || monthStr.startsWith(m.substring(0, 3)));
        }
        const month = (mIdx !== -1 ? mIdx + 1 : 1).toString().padStart(2, '0');
        const year = match[4];
        return `${year}-${month}-${day}`;
    }
    return '';
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
    return String(val || '');
};

const findSheet = (wb, name) => {
    const match = wb.SheetNames.find(n => n.toLowerCase().trim() === name.toLowerCase().trim());
    return match ? wb.Sheets[match] : null;
};

const extractCutoffDate = (wb, type) => {
    try {
        if (type === 'legion_centurion') {
            const ws = wb.Sheets[wb.SheetNames[0]];
            const v = ws?.['B9']?.v || "";
            const m = String(v).match(/\d{1,2}\s+de\s+[a-z]+\s+de\s+\d{4}/i);
            return m ? parseSpanishDate(m[0]) : '';
        }
        if (type === 'mdrt') {
            const ws = wb.Sheets[wb.SheetNames.find(n => n.toUpperCase() === 'MDRT') || wb.SheetNames[0]];
            const v = ws?.['A1']?.v || "";
            const ms = String(v).match(/\d{1,2}\s+de\s+[a-z]+\s+de\s+\d{4}/gi);
            return ms ? parseSpanishDate(ms[ms.length - 1]) : '';
        }
        if (type === 'camino_cumbre') {
            const ws = wb.Sheets[wb.SheetNames[0]];
            const v = ws?.['A1']?.v || ws?.['B19']?.v || "";
            const ms = String(v).match(/\d{1,2}\s+de\s+[a-z]+\s+de\s+\d{4}/gi);
            return ms ? parseSpanishDate(ms[ms.length - 1]) : '';
        }
        if (type === 'convenciones') {
            const ws = wb.Sheets[wb.SheetNames[0]];
            const v = ws?.['B17']?.v || "";
            if (typeof v === 'number') return parseSpanishDate(formatExcelDate(v));
            const m = String(v).match(/\d{1,2}\s+de\s+[a-z]+\s+de\s+\d{4}/i);
            return m ? parseSpanishDate(m[0]) : '';
        }
        if (type === 'graduacion') {
            const ws = wb.Sheets[wb.SheetNames[0]];
            return parseSpanishDate(formatExcelDate(ws?.['A1']?.v));
        }
        if (type === 'proactivos') {
            const ws = wb.Sheets['Detalle Asesores'];
            if (!ws) return '';
            const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
            return parseSpanishDate(formatExcelDate(data[2]?.[2] || data[2]?.[0] || ""));
        }
        if (type === 'pagado_pendiente') {
            const ws = wb.Sheets[wb.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
            return parseSpanishDate(formatExcelDate(data[0]?.[1] || data[0]?.[0] || ws?.['A1']?.v || ""));
        }
        if (type === 'asesores_sin_emision') {
            const ws = wb.Sheets['Promotores'] || wb.Sheets[wb.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
            return parseSpanishDate(formatExcelDate(data[1]?.[0] || data[0]?.[0] || ""));
        }
        if (type === 'comparativo_vida') {
            const ws = findSheet(wb, 'asesores');
            if (!ws) return '';
            const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
            return parseSpanishDate(formatExcelDate(data[0]?.[0] || data[1]?.[2] || ""));
        }
        if (type === 'fanfest' || type === 'vive_tu_pasion') {
            const ws = wb.Sheets[wb.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
            for (let i = 0; i < 15; i++) {
                if (!data[i]) continue;
                const rowStr = data[i].join(' ');
                const m = String(rowStr).match(/\d{1,2}\s+de\s+[a-z]+(\s+de)?\s+(\d{4})/i);
                if (m) return parseSpanishDate(m[0]);
            }
            return '';
        }
        return '';
    } catch (e) { return ''; }
};

const getAdvisorDirectory = () => {
    const filePath = path.join(BASE_PATH, 'administrador', 'directorio_asesores.xlsx');
    if (!fs.existsSync(filePath)) return {};
    const workbook = XLSX.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);
    const directory = {};
    data.forEach(row => {
        const keys = Object.keys(row);
        const claveKey = keys.find(k => k.toLowerCase().trim() === 'clave');
        const nombreKey = keys.find(k => k.toLowerCase().trim() === 'nombre_completo' || k.toLowerCase().trim() === 'nombre completo');
        if (claveKey && nombreKey && row[claveKey] && row[nombreKey]) {
            directory[String(row[claveKey])] = String(row[nombreKey]).trim();
        }
    });
    return directory;
};

const readExcelFileData = (folderName) => {
    const folderPath = path.join(BASE_PATH, folderName);
    if (!fs.existsSync(folderPath)) return null;
    const files = fs.readdirSync(folderPath).filter(f => (f.endsWith('.xlsx') || f.endsWith('.xlsm') || f.endsWith('.xls')) && !f.startsWith('~$'));
    if (files.length === 0) return null;
    const fileName = files.sort((a, b) => fs.statSync(path.join(folderPath, b)).mtimeMs - fs.statSync(path.join(folderPath, a)).mtimeMs)[0];
    const filePath = path.join(folderPath, fileName);
    return XLSX.readFile(filePath, { cellFormula: false, cellStyles: false, cellNF: false });
};

const formatMexicoTimestamp = () => {
    const now = new Date();
    const fmt = (opts) => new Intl.DateTimeFormat('es-MX', { ...opts, timeZone: 'America/Mexico_City' }).format(now);
    return `${fmt({ day: 'numeric' })}/${fmt({ month: 'numeric' })}/${fmt({ year: 'numeric' })}, ${fmt({ hour: 'numeric', hour12: false }).padStart(2, '0')}:${fmt({ minute: 'numeric' }).padStart(2, '0')}:${fmt({ second: 'numeric' }).padStart(2, '0')}`;
};

async function runUpdate() {
    console.log('🚀 Actualizando snapshot con nuevo nombre de asesor...');
    const dir = getAdvisorDirectory();
    const resolveName = (cl) => dir[String(cl)] || `Asesor ${cl}`;
    const result = { dates: {} };
    const cams = ['mdrt', 'camino_cumbre', 'convenciones', 'graduacion', 'legion_centurion', 'fanfest', 'vive_tu_pasion'];

    for (const c of cams) {
        const wb = readExcelFileData(c);
        if (wb) {
            if (c === 'mdrt') {
                const ws = wb.Sheets[wb.SheetNames.find(n => n.toUpperCase() === 'MDRT') || wb.SheetNames[0]];
                const data = XLSX.utils.sheet_to_json(ws, { range: 3 });
                result.mdrt = data.filter(r => String(r.Matriz || r['Mat'] || '') === '2043').map(r => {
                    const paKey = Object.keys(r).find(k => k.trim().toLowerCase() === 'total prima' || k.trim().toLowerCase() === 'camino prima');
                    return { Asesor: resolveName(r.Asesor || r['Nombre del Asesor']), Clave: r.Asesor || '', PA_Acumulada: Number(r[paKey] || 0) };
                });
            } else if (c === 'camino_cumbre') {
                const ws = wb.Sheets[wb.SheetNames[0]];
                const data = XLSX.utils.sheet_to_json(ws, { header: 1, range: 3 });
                result.camino_cumbre = data.slice(1).filter(r => String(r[3] || '') === '2043').map(r => ({ Asesor: resolveName(r[5]), Clave: r[5] || '', Mes_Asesor: Number(r[10] || 1), Polizas_Totales: Number(r[13] || 0), Mes_1_Prod: Number(r[21] || 0), Mes_2_Prod: Number(r[22] || 0), Mes_3_Prod: Number(r[23] || 0) }));
            } else if (c === 'convenciones') {
                const sheetName = wb.SheetNames.find(n => n.toUpperCase() === 'TODOS LOS RAMOS') || wb.SheetNames[0];
                const ws = wb.Sheets[sheetName];
                const data = XLSX.utils.sheet_to_json(ws, { header: 1, range: 'A20:AI5000' });
                const allRows = data.slice(1);
                let c480 = 0, c228 = 0, c108 = 0, c28 = 0;
                allRows.forEach(r => {
                    const l = Number(r[32]);
                    if (l === 480) c480 = Number(r[24] || 0);
                    if (l === 228) c228 = Number(r[24] || 0);
                    if (l === 108) c108 = Number(r[24] || 0);
                    if (l === 28) c28 = Number(r[24] || 0);
                });
                result.convenciones = allRows.filter(r => String(r[4] || '') === '2043').map(r => ({
                    Asesor: resolveName(r[7]), Clave: r[7] || '', Comision_Vida: Number(r[11] || 0), RDA: Number(r[18] || 0), PA_Total: Number(r[24] || 0), Polizas: Number(r[28] || 0),
                    Lugar: Number(r[32] || 9999), Lugar_480: c480, Lugar_228: c228, Lugar_108: c108, Lugar_28: c28
                }));
            } else if (c === 'graduacion') {
                const ws = wb.Sheets[wb.SheetNames[0]];
                const data = XLSX.utils.sheet_to_json(ws, { header: 1, range: 2 });
                result.graduacion = data.slice(1).filter(r => String(r[3] || '') === '2043').map(r => ({ Asesor: resolveName(r[6]), Clave: r[6] || '', Mes_Asesor: Number(r[8] || 1), Polizas_Totales: Number(r[16] || 0) }));
            } else if (c === 'legion_centurion') {
                const ws = findSheet(wb, 'Asesores') || wb.Sheets[wb.SheetNames[0]];
                const data = XLSX.utils.sheet_to_json(ws, { header: 1, range: 11 });
                const b9 = ws['B9']?.v || "";
                const mMatch = String(b9).toLowerCase().match(/(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/);
                const mIndex = mMatch ? MONTHS_ES.indexOf(mMatch[1]) + 1 : 1;
                result.legion_centurion = data.slice(1).filter(r => String(r[4] || '') === '2043').map(r => ({
                    Asesor: resolveName(r[6]), Clave: r[6] || '', Total_Polizas: Number(r[10] || 0), Mes_Actual: mIndex, Nivel: r[13] || '', EnMeta: String(r[12] || '').toLowerCase() === 'p'
                }));
            } else if (c === 'fanfest') {
                const ws = findSheet(wb, 'ASESORES') || wb.Sheets[wb.SheetNames[0]];
                const data = XLSX.utils.sheet_to_json(ws, { header: 1, range: 7 });
                result.fanfest = data.slice(2).filter(r => String(r[4] || '') === '2043').map(r => ({
                    Asesor: resolveName(r[6]), Clave: r[6] || '', Total_Polizas: Number(r[13] || 0), Enero: Number(r[8] || 0), Febrero: Number(r[9] || 0), Marzo: Number(r[10] || 0), Abril: Number(r[11] || 0), Condicion: String(r[12] || '').toLowerCase() === 'p', Premio: String(r[14] || '').toLowerCase() === 'p' ? "GANADO 🏆" : "PENDIENTE ⏳"
                }));
            } else if (c === 'vive_tu_pasion') {
                const ws = findSheet(wb, 'ASESORES') || wb.Sheets[wb.SheetNames[0]];
                const data = XLSX.utils.sheet_to_json(ws, { header: 1, range: 7 });
                result.vive_tu_pasion = data.slice(2).filter(r => String(r[4] || '') === '2043').map(r => ({
                    Asesor: resolveName(r[6]), Clave: r[6] || '', Polizas: Number(r[8] || 0), Comisiones: Number(r[9] || 0), Premio: r[10] || ""
                }));
            }
            const iso = extractCutoffDate(wb, c);
            if (iso) {
                const d = iso.split('-');
                result.dates[c] = `${d[2]} de ${MONTHS_ES[Number(d[1]) - 1]} de ${d[0]}`;
            } else result.dates[c] = "";
        }
    }

    const rg = { fechas_corte: {} };
    const adminFolders = [
        { key: 'asesores_sin_emision', path: 'administrador/asesores_sin_emision', type: 'asesores_sin_emision' },
        { key: 'pagado_pendiente', path: 'administrador/pagado_emitidido', type: 'pagado_pendiente' },
        { key: 'proactivos', path: 'administrador/proactivos', type: 'proactivos' },
        { key: 'comparativo_vida', path: 'administrador/comparativo_vida', type: 'comparativo_vida' }
    ];
    for (const admin of adminFolders) {
        const wb = readExcelFileData(admin.path);
        if (wb) {
            rg.fechas_corte[admin.key] = formatExcelDate(extractCutoffDate(wb, admin.type));
            if (admin.key === 'asesores_sin_emision') {
                const wsP = wb.Sheets['Promotores'], wsA = wb.Sheets['Asesores'];
                rg.asesores_sin_emision = { summaryBySucursal: [], individuals: [] };
                if (wsP) {
                    const dat = XLSX.utils.sheet_to_json(wsP, { header: 1, range: 3 });
                    rg.asesores_sin_emision.summaryBySucursal = dat.filter(r => String(r[3] || '') === '2043').map(r => ({ Sucursal: r[5] || 'Descon', Suc: r[4], Agentes: Number(r[6] || 0), Asesores_con_Emisión_Vida: Number(r[7] || 0), '%_Asesores_con_Emisión_Vida': Number(r[8] || 0), Asesores_con_Emisión_GMM: Number(r[9] || 0), '%_Asesores_con_Emisión_GMM': Number(r[10] || 0), Asesores_con_pol_Pagada_Vida: Number(r[11] || 0), '%_Asesores_con_pol_Pagada_Vida': Number(r[12] || 0), Asesores_con_pol_Pagada_GMM: Number(r[13] || 0), '%_Asesores_con_pol_Pagada_GMM': Number(r[14] || 0), Prima_Pagada_Vida: Number(r[15] || 0), Prima_Pagada_GMM: Number(r[16] || 0) }));
                }
                if (wsA) {
                    const dat = XLSX.utils.sheet_to_json(wsA, { header: 1, range: 4 });
                    rg.asesores_sin_emision.individuals = dat.filter(r => String(r[3] || '') === '2043').map(r => ({ Asesor: resolveName(r[6]), Clave: r[6] || '', Sucursal: r[5] || 'General', Suc: r[4], Emitido_Vida: Number(r[10] || 0), Emitido_GMM: Number(r[11] || 0), Pagado_Vida: Number(r[12] || 0), Pagado_GMM: Number(r[13] || 0), Prima_Pagada_Vida: Number(r[14] || 0), Prima_Pagada_GMM: Number(r[15] || 0), Sin_Emisión_Vida: r[16] || '', Sin_Emisión_GMM: r[17] || '', '3_Meses_Sin_Emisión_Vida': r[18] || '', '3_Meses_Sin_Emisión_GMM': r[19] || '' }));
                }
            } else if (admin.key === 'pagado_pendiente') {
                const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
                const validSucursales = ['2043', '2692', '2856', '2511'];
                rg.pagado_pendiente = data.slice(3).filter(r => r[2] != null && validSucursales.includes(String(r[1]))).map(r => ({ 'Nombre Asesor': resolveName(r[4] || r[2]), 'Sucursal': r[1], 'Pólizas-Pagadas': Number(r[5] || 0), 'Recibo_Inicial_Pagado': Number(r[6] || 0), 'Recibo_Ordinario_Pagado': Number(r[7] || 0), 'Total _Prima_Pagada': Number(r[8] || 0), 'Pólizas_Pendinetes': Number(r[9] || 0), 'Recibo_Inicial_Pendiente': Number(r[10] || 0), 'Recibo_Ordinario_Pendiente': Number(r[11] || 0), 'Total _Prima_Pendiente': Number(r[12] || 0) }));
            } else if (admin.key === 'proactivos') {
                const ws = wb.Sheets['Detalle Asesores'];
                if (ws) {
                    const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
                    rg.proactivos = data.slice(7).filter(r => String(r[2] || '') === '2043').map(r => ({ 'ASESOR': resolveName(r[4]), 'SUC': r[3], 'Polizas_Acumuladas_Mes_Ant.': Number(r[9] || 0), 'Polizas_Del_mes': Number(r[10] || 0), 'Polizas_Acumuladas_Total': Number(r[11] || 0), 'Proactivo_al_mes': r[12] || '', 'Pólizas_Faltantes': Number(r[13] || 0) }));
                }
            } else if (admin.key === 'comparativo_vida') {
                const wsP = findSheet(wb, 'promotoria'), wsA = findSheet(wb, 'asesores');
                let sum = null;
                if (wsP) {
                    const rawP = XLSX.utils.sheet_to_json(wsP, { header: 1 });
                    const dataRow = rawP.find((row, idx) => idx > 0 && row.length > 4 && typeof row[0] === 'number');
                    if (dataRow) {
                        sum = {
                            Polizas_Pagadas_Año_Anterior: Number(dataRow[0] || 0), Polizas_Pagadas_Año_Actual: Number(dataRow[1] || 0),
                            Prima_Pagada_Año_Anterior: Number(dataRow[4] || 0), Prima_Pagada_Año_Actual: Number(dataRow[5] || 0),
                            Recluta_Año_Anterior: Number(dataRow[8] || 0), Recluta_Año_Actual: Number(dataRow[9] || 0),
                            Prima_Pagada_Reclutas_Año_Anterior: Number(dataRow[12] || 0), Prima_Pagada_Reclutas_Año_Actual: Number(dataRow[13] || 0)
                        };
                    }
                }
                let inds = [];
                if (wsA) {
                    const rawFormat = XLSX.utils.sheet_to_json(wsA, { header: 1 });
                    if (rawFormat.length > 2 && rawFormat[2][2] === 'Mat') {
                        inds = rawFormat.slice(3).filter(r => String(r[2] || '') === '2043').map(r => ({ 'Nombre del Asesor': resolveName(r[4] || r[6]), 'Sucursal': r[3], 'Polizas_Pagadas_Año_Anterior': Number(r[15] || 0), 'Polizas_Pagadas_Año_Actual': Number(r[16] || 0), 'Prima_Pagada_Año_Anterior': Number(r[23] || 0), 'Prima_Pagada_Año_Actual': Number(r[24] || 0) }));
                    } else {
                        inds = XLSX.utils.sheet_to_json(wsA, { range: 1 }).filter(r => String(r['MAT'] || '') === '2043').map(r => ({ 'Nombre del Asesor': resolveName(r['Clave'] || r['Nombre']), 'Sucursal': r['Sucursal'], 'Polizas_Pagadas_Año_Anterior': Number(r['Pzs Pag Ant'] || 0), 'Polizas_Pagadas_Año_Actual': Number(r['Pzs Pag Act'] || 0), 'Prima_Pagada_Año_Anterior': Number(r['Pri Pag Ant'] || 0), 'Prima_Pagada_Año_Actual': Number(r['Pri Pag Act'] || 0) }));
                    }
                }
                rg.comparativo_vida = { individuals: inds, generalSummary: sum };
            }
        }
    }

    const snapshot = {
        updatedAt: formatMexicoTimestamp(),
        data: { ...result, resumen_general: rg }
    };

    if (!fs.existsSync(path.dirname(SNAPSHOT_PATH))) fs.mkdirSync(path.dirname(SNAPSHOT_PATH), { recursive: true });
    fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2));
    console.log(`✨ Snapshot actualizado. Asesor 116876 ahora es: ${dir['116876']}`);
}
runUpdate().catch(err => { console.error(err); process.exit(1); });
