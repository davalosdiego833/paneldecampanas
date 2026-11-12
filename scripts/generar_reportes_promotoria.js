// Genera los 3 Excels de seguimiento manual que Diego mandaba a mano
// (Legión Centurión, Convenciones, MDRT y MDRT Aspirantes) a partir del snapshot actual del panel.
// Uso: node scripts/generar_reportes_promotoria.js [carpeta_salida]
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const BASE_PATH = path.join(__dirname, '..');
const OUT_DIR = process.argv[2] || path.join(process.env.HOME, 'Desktop');

const snapshot = JSON.parse(fs.readFileSync(path.join(BASE_PATH, 'db', 'resumen_snapshot.json'), 'utf-8'));
const data = snapshot.data;

const today = new Date();
const MES_ACTUAL = today.getMonth() + 1; // 1-12, mes calendario real de hoy
const MESES_RESTANTES = 12 - MES_ACTUAL + 1; // incluye el mes en curso
// Legión: la meta del mes es la del mes del CORTE (Mes_Actual del snapshot), no la del mes en que se corre el script.
// (2026-11-09: con corte al 31-oct y script corrido en noviembre salía "Meta del mes (noviembre): 44" en vez de octubre: 40.)
const MES_LEGION = Math.max(0, ...((data.campaigns?.legion_centurion || []).map(r => Number(r.Mes_Actual) || 0))) || MES_ACTUAL;
const MESES_NOMBRES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

const NAVY = 'FF1F3A6E';
const GOLD = 'FFD4AF37';
const RED = 'FFE24B4A';
const GREEN = 'FF1FB37A';
const LIGHTGREEN = 'FFE3F6ED';
const GRAY_HEADER = 'FFEDEFF4';

const headerRow = (ws, rowIdx, labels, fillColor, fontColor = 'FFFFFFFF') => {
    const row = ws.getRow(rowIdx);
    labels.forEach((label, i) => {
        const cell = row.getCell(i + 1);
        cell.value = label;
        cell.font = { bold: true, color: { argb: fontColor }, size: 11 };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } };
        cell.alignment = { vertical: 'middle', horizontal: i === 0 ? 'left' : 'center' };
        cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
    });
    row.height = 22;
};

const borderAll = (cell) => {
    cell.border = { top: {style:'thin', color:{argb:'FFD9DEE8'}}, left: {style:'thin', color:{argb:'FFD9DEE8'}}, bottom: {style:'thin', color:{argb:'FFD9DEE8'}}, right: {style:'thin', color:{argb:'FFD9DEE8'}} };
};

async function addLogo(wb, ws, filename, cellRange) {
    const logoPath = path.join(BASE_PATH, 'public', 'assets', 'logos', 'campanas', filename);
    if (!fs.existsSync(logoPath)) return;
    const imgId = wb.addImage({ filename: logoPath, extension: 'png' });
    ws.addImage(imgId, cellRange);
}

// ============================================================
// 1. LEGIÓN CENTURIÓN
// ============================================================
async function buildLegion() {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Legión Centurión', { views: [{ showGridLines: false }] });
    ws.columns = [
        { width: 4 }, { width: 32 }, { width: 10 }, { width: 14 }, { width: 16 }, { width: 14 }
    ];

    await addLogo(wb, ws, 'legion_centurion.png', 'B2:C6');

    ws.mergeCells('D2:F2');
    ws.getCell('D2').value = 'Metas Proporcionales VI&GMM';
    ws.getCell('D2').font = { bold: true, italic: true, color: { argb: NAVY }, size: 12 };
    ws.getCell('D2').alignment = { horizontal: 'center' };

    const tiers = [
        ['PLATINO', 10, 60, 120],
        ['ORO', 7.5, 45, 90],
        ['PLATA', 6, 36, 72],
        ['BRONCE', 4, 24, 48],
    ];
    headerRow(ws, 3, ['', 'Pól/mes', 'Meta Sem.', 'Meta Anual'], NAVY);
    tiers.forEach((t, i) => {
        const r = ws.getRow(4 + i);
        r.getCell(1).value = '';
        r.getCell(2).value = t[0];
        r.getCell(3).value = t[1];
        r.getCell(4).value = t[2];
        r.getCell(5).value = t[3];
        [2,3,4,5].forEach(c => { r.getCell(c).alignment = { horizontal: 'center' }; borderAll(r.getCell(c)); r.getCell(c).font = { bold: c === 2 }; });
    });

    const fechaCorte = data.campaignDates?.legion_centurion || '';
    ws.mergeCells('B9:F9');
    ws.getCell('B9').value = `Avance al ${fechaCorte} — Meta del mes (${MESES_NOMBRES[MES_LEGION-1]}): ${4 * MES_LEGION} pólizas mínimo (Bronce)`;
    ws.getCell('B9').font = { italic: true, size: 10, color: { argb: 'FF555555' } };

    const headers = ['Asesor', 'Clave', 'Total Pólizas', `Faltante Bronce (${4*MES_LEGION})`, 'Cumple Meta'];
    headerRow(ws, 11, headers, NAVY);
    ws.getColumn(2).width = 32;

    const threshold = 4 * MES_LEGION;
    const rows = [...(data.campaigns.legion_centurion || [])].sort((a,b) => (b.Total_Polizas||0) - (a.Total_Polizas||0));

    rows.forEach((r, i) => {
        const rowIdx = 12 + i;
        const row = ws.getRow(rowIdx);
        const total = Number(r.Total_Polizas || 0);
        const faltante = Math.max(0, threshold - total);
        const cumple = total >= threshold;
        row.getCell(1).value = r.Asesor;
        row.getCell(2).value = r.Clave;
        row.getCell(3).value = total;
        row.getCell(4).value = faltante;
        row.getCell(5).value = cumple ? '✅ SÍ' : '❌ NO';
        row.getCell(5).font = { bold: true, color: { argb: cumple ? GREEN : RED } };
        [1,2,3,4,5].forEach(c => { borderAll(row.getCell(c)); if (c>=3) row.getCell(c).alignment = { horizontal: 'center' }; });
        if (cumple) row.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHTGREEN } };
    });

    await wb.xlsx.writeFile(path.join(OUT_DIR, 'Legion_Centurion_Promotoria.xlsx'));
    console.log('✅ Legión Centurión generado —', rows.length, 'asesores');
}

// ============================================================
// 2. CONVENCIONES
// ============================================================
async function buildConvenciones() {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Convenciones', { views: [{ showGridLines: false }] });
    ws.columns = [{ width: 4 }, { width: 32 }, { width: 10 }, { width: 16 }, { width: 18 }, { width: 10 }, { width: 24 }];

    await addLogo(wb, ws, 'convenciones.png', 'B2:C6');

    ws.mergeCells('D2:G2');
    ws.getCell('D2').value = 'CONVENCIONES 2026-2027';
    ws.getCell('D2').font = { bold: true, size: 14, color: { argb: NAVY } };
    ws.getCell('D2').alignment = { horizontal: 'center' };

    headerRow(ws, 3, ['REQUISITOS', ''], NAVY, 'FFFFFFFF');
    ws.getRow(3).getCell(1).value = 'REQUISITOS';
    const reqs = [['Créditos', '$ 620,000.00'], ['Pólizas', '30'], ['LIMRA mínimo', '84.5%'], ['IGC mínimo', '91%']];
    reqs.forEach((r, i) => {
        const row = ws.getRow(4 + i);
        row.getCell(1).value = r[0]; row.getCell(1).font = { bold: true };
        row.getCell(2).value = r[1];
        [1,2].forEach(c => borderAll(row.getCell(c)));
    });

    // Créditos que tiene hoy el ÚLTIMO lugar de cada convención (mismos datos que el panel)
    const conv0 = (data.campaigns.convenciones || [])[0] || {};
    const ultimos = [
        ['1 Diamante · Los Cabos (#495)', Number(conv0.Lugar_495 || conv0.Lugar_480 || 0)],
        ['2 Diamantes · Vancouver (#228)', Number(conv0.Lugar_228 || 0)],
        ['3 Diamantes · Estambul (#108)', Number(conv0.Lugar_108 || 0)],
        ['Gran Diamante · Japón (#28)', Number(conv0.Lugar_28 || 0)],
    ];
    ws.mergeCells('D3:E3'); ws.mergeCells('F3:G3');
    [['D3', 'ÚLTIMO LUGAR POR CONVENCIÓN'], ['F3', 'Créditos del último lugar']].forEach(([c, v]) => {
        const cell = ws.getCell(c); cell.value = v;
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    });
    ultimos.forEach(([label, val], i) => {
        const r = 4 + i;
        ws.mergeCells(`D${r}:E${r}`); ws.mergeCells(`F${r}:G${r}`);
        const a = ws.getCell(`D${r}`), b = ws.getCell(`F${r}`);
        a.value = label; a.font = { bold: true, size: 10 };
        b.value = val; b.numFmt = '$#,##0'; b.alignment = { horizontal: 'center' }; b.font = { bold: true, color: { argb: NAVY } };
        [`D${r}`, `E${r}`, `F${r}`, `G${r}`].forEach(c => borderAll(ws.getCell(c)));
    });

    const fechaCorte = data.campaignDates?.convenciones || '';
    ws.mergeCells('B9:G9');
    ws.getCell('B9').value = `Avance al ${fechaCorte}`;
    ws.getCell('B9').font = { italic: true, size: 10, color: { argb: 'FF555555' } };

    const headers = ['Asesor', 'Clave', 'Créditos Totales', 'Pólizas Iniciales', 'Lugar', 'Calificación'];
    headerRow(ws, 11, headers, NAVY);

    const rows = [...(data.campaigns.convenciones || [])].sort((a,b) => (a.Lugar||99999) - (b.Lugar||99999));
    rows.forEach((r, i) => {
        const rowIdx = 12 + i;
        const row = ws.getRow(rowIdx);
        const creditos = Number(r.PA_Total || 0);
        const polizas = Number(r.Polizas || 0);
        const califica = creditos >= 620000 && polizas >= 30;
        row.getCell(1).value = r.Asesor;
        row.getCell(2).value = r.Clave;
        row.getCell(3).value = creditos;
        row.getCell(3).numFmt = '$#,##0';
        row.getCell(4).value = polizas;
        row.getCell(5).value = r.Lugar;
        row.getCell(6).value = califica ? '✅ CALIFICADO' : 'FALTA PÓLIZAS Y/O CRÉDITOS';
        row.getCell(6).font = { bold: true, color: { argb: califica ? GREEN : RED }, size: 10 };
        [1,2,3,4,5,6].forEach(c => { borderAll(row.getCell(c)); if (c>=3 && c<=5) row.getCell(c).alignment = { horizontal: 'center' }; });
        if (califica) row.getCell(6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHTGREEN } };
    });

    await wb.xlsx.writeFile(path.join(OUT_DIR, 'Convenciones_Promotoria.xlsx'));
    console.log('✅ Convenciones generado —', rows.length, 'asesores');
}

// ============================================================
// 3. MDRT
// ============================================================
const META_MDRT_MIEMBRO = 1810400;
// Aspirantes (asesores primerizos) ganan el evento llegando al 50% de la meta MDRT.
const META_MDRT_ASPIRANTE = META_MDRT_MIEMBRO * 0.5;
const CLAVES_ASPIRANTES = [
    '118246', // Antemio Oliva
    '105696', // Gabriela Castañeda
    '118915', // Humberto Sandoval
    '111056', // Jorge Luna
    '94156',  // María Teresa Asencio
    '117440', // Monserrat Velasco
    '103982', // Fernanda Ríos
    '118069', // Iván Romero
    '110575', // René de Alba
    '116883', // Sofía Campillo
    '104750', // Paulina Soto
    '119223', // Oscar Ramírez
];

// "%Vida vs Meta" (prima y comisión) tal como viene en la hoja MDRT del archivo de la compañía:
// col 7 = clave, col 17 = %Vida vs Meta (prima), col 30 = %Vida vs Meta (comisión). Nota 1 del archivo:
// la prima O la comisión de VIDA debe ser al menos el 50% de la meta del nivel MDRT.
function leerPctVidaMdrt() {
    const mdrtDir = path.join(BASE_PATH, 'mdrt');
    const archivo = fs.readdirSync(mdrtDir).filter(f => /\.xlsm?$|\.xlsx$/i.test(f) && !f.startsWith('~$'))
        .map(f => ({ f, t: fs.statSync(path.join(mdrtDir, f)).mtimeMs })).sort((a, b) => b.t - a.t)[0]?.f;
    if (!archivo) return {};
    const XLSX = require('xlsx');
    const wb = XLSX.readFile(path.join(mdrtDir, archivo), { sheets: ['MDRT'] });
    const raw = XLSX.utils.sheet_to_json(wb.Sheets['MDRT'], { header: 1, raw: true });
    const mapa = {};
    for (const r of raw) {
        if (!r || !(Number(r[7]) > 0) || typeof r[17] !== 'number') continue;
        mapa[String(r[7])] = { prima: r[17], comision: typeof r[30] === 'number' ? r[30] : null };
    }
    return mapa;
}

async function buildMdrt({ conPctVida = false, claves = null, meta = META_MDRT_MIEMBRO, titulo = 'MESA DEL MILLÓN DE DÓLARES — PRIMA INICIAL ANUALIZADA', etiquetaMeta = 'META MIEMBRO MDRT', etiquetaNivel = 'MDRT', hojaNombre = 'MDRT', archivo = 'MDRT_Promotoria.xlsx' } = {}) {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(hojaNombre, { views: [{ showGridLines: false }] });
    ws.columns = [{ width: 4 }, { width: 6 }, { width: 32 }, { width: 10 }, { width: 16 }, { width: 16 }, { width: 18 }, { width: 10 }];

    await addLogo(wb, ws, 'mdrt.png', 'B2:D6');

    ws.mergeCells('E2:H2');
    ws.getCell('E2').value = titulo;
    ws.getCell('E2').font = { bold: true, size: 12, color: { argb: NAVY } };
    ws.getCell('E2').alignment = { horizontal: 'center', wrapText: true };

    ws.mergeCells('E4:H4');
    ws.getCell('E4').value = `${etiquetaMeta}: $${meta.toLocaleString('es-MX')}`;
    ws.getCell('E4').font = { bold: true, color: { argb: NAVY } };
    ws.mergeCells('E5:H5');
    ws.getCell('E5').value = `Meses restantes del año (incluye ${MESES_NOMBRES[MES_ACTUAL-1]}): ${MESES_RESTANTES}`;
    ws.getCell('E5').font = { italic: true, size: 10, color: { argb: 'FF555555' } };

    const fechaCorte = data.campaignDates?.mdrt || '';
    ws.mergeCells('B9:H9');
    ws.getCell('B9').value = `Avance al ${fechaCorte}`;
    ws.getCell('B9').font = { italic: true, size: 10, color: { argb: 'FF555555' } };

    const headers = ['Lugar', 'Asesor', 'Clave', 'Total Prima', `Faltante ${etiquetaNivel}`, 'Faltante Prom./Mes', 'Nivel'];
    if (conPctVida) headers.push('% Vida vs Meta');
    headerRow(ws, 11, headers, NAVY);
    const pctVida = conPctVida ? leerPctVidaMdrt() : {};
    if (conPctVida) ws.getColumn(8).width = 16;

    const rows = [...(data.campaigns.mdrt || [])].filter(r => !claves || claves.includes(String(r.Clave))).sort((a,b) => (b.PA_Acumulada||0) - (a.PA_Acumulada||0));
    rows.forEach((r, i) => {
        const rowIdx = 12 + i;
        const row = ws.getRow(rowIdx);
        const prima = Number(r.PA_Acumulada || 0);
        const faltante = Math.max(0, meta - prima);
        const faltanteProm = faltante > 0 ? faltante / MESES_RESTANTES : 0;
        const logrado = prima >= meta;
        row.getCell(1).value = i + 1;
        row.getCell(2).value = r.Asesor;
        row.getCell(3).value = r.Clave;
        row.getCell(4).value = prima; row.getCell(4).numFmt = '$#,##0';
        row.getCell(5).value = logrado ? 0 : faltante; row.getCell(5).numFmt = '$#,##0';
        row.getCell(6).value = logrado ? 0 : faltanteProm; row.getCell(6).numFmt = '$#,##0';
        row.getCell(7).value = logrado ? etiquetaNivel : '';
        row.getCell(7).font = { bold: true, color: { argb: GREEN } };
        const ultCol = conPctVida ? 8 : 7;
        if (conPctVida) {
            const pv = pctVida[String(r.Clave)];
            const c8 = row.getCell(8);
            c8.value = pv ? pv.prima : null; c8.numFmt = '0.00%';
            if (pv) c8.font = { bold: true, color: { argb: pv.prima >= 0.5 ? GREEN : RED } };
        }
        for (let c = 1; c <= ultCol; c++) { borderAll(row.getCell(c)); if (c===1 || c>=4) row.getCell(c).alignment = { horizontal: 'center' }; }
        if (logrado) for (let c = 1; c <= ultCol; c++) row.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHTGREEN } };
    });

    if (conPctVida) {
        // Notas 1 y 2 tal cual vienen en el archivo original de MDRT (hoja MDRT, filas 11-12), en el espacio libre de arriba
        const notas = [
            'Nota 1: "Para alcanzar la meta es necesario que la prima o comisión de VIDA represente al menos el 50% de la meta para el nivel MDRT".',
            'Nota 2: Durante el año se validarán que todas las pólizas se encuentren en vigor, si una póliza se cancela se tomará solo la proporción pagada.',
        ];
        notas.forEach((txt, i) => {
            const r = 7 + i;
            ws.mergeCells(`E${r}:H${r}`);
            const c = ws.getCell(`E${r}`);
            c.value = txt;
            c.font = { size: 9, color: { argb: 'FF1F6F78' } };
            c.alignment = { vertical: 'top', wrapText: true };
            ws.getRow(r).height = 36;
        });
        // resalta "Nota 1:" / "Nota 2:" en negritas
        notas.forEach((txt, i) => {
            const etiqueta = `Nota ${i + 1}:`;
            ws.getCell(`E${7 + i}`).value = { richText: [
                { text: etiqueta, font: { bold: true, size: 9, color: { argb: i === 0 ? 'FF1F6F78' : 'FF5B4B8A' } } },
                { text: txt.slice(etiqueta.length), font: { size: 9, color: { argb: 'FF1F6F78' } } },
            ] };
        });
        const n = ws.getCell(12 + rows.length + 1, 2);
        n.value = '% Vida vs Meta = lo que lleva de VIDA contra la meta MDRT (columna del archivo de la compañía). Nota 1: la prima o la comisión de vida debe ser al menos 50% (verde = ya llega, rojo = todavía no).';
        n.font = { italic: true, size: 9, color: { argb: 'FF555555' } };
    }

    await wb.xlsx.writeFile(path.join(OUT_DIR, archivo));
    console.log(`✅ ${hojaNombre} generado —`, rows.length, 'asesores');
}

// ============================================================
// 4. CAMINO A LA CUMBRE (agregado 2026-11-09)
// Meta acumulada = 4 pólizas × mes del asesor (programa de 18 meses). Mismas reglas que Dashboards/CaminoCumbre.tsx.
// ============================================================
async function buildCamino() {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Camino a la Cumbre', { views: [{ showGridLines: false }] });
    ws.columns = [{ width: 4 }, { width: 34 }, { width: 10 }, { width: 12 }, { width: 10 }, { width: 10 }, { width: 10 }, { width: 13 }, { width: 16 }, { width: 11 }, { width: 14 }];

    await addLogo(wb, ws, 'camino_cumbre.png', 'B2:C6');

    ws.mergeCells('D2:K2');
    ws.getCell('D2').value = 'CAMINO A LA CUMBRE — Meta acumulada: 4 pólizas × mes del asesor (18 meses)';
    ws.getCell('D2').font = { bold: true, size: 12, color: { argb: NAVY } };
    ws.getCell('D2').alignment = { horizontal: 'center', wrapText: true };
    ws.mergeCells('D4:K5');
    ws.getCell('D4').value = 'Vida cuenta 1 póliza y GMM 0.5. Cerrar el primer trimestre sin producción implica baja automática; ventanas de recuperación en el mes 9 y el mes 18.';
    ws.getCell('D4').font = { italic: true, size: 10, color: { argb: 'FF555555' } };
    ws.getCell('D4').alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

    const fechaCorte = data.campaignDates?.camino_cumbre || '';
    ws.mergeCells('B9:K9');
    ws.getCell('B9').value = `Avance al ${fechaCorte}`;
    ws.getCell('B9').font = { italic: true, size: 10, color: { argb: 'FF555555' } };

    headerRow(ws, 11, ['Lugar', 'Asesor', 'Clave', 'Mes del asesor', 'Prod. mes 1', 'Prod. mes 2', 'Prod. mes 3', 'Pólizas totales', 'Meta acumulada (4 × mes)', 'Faltan', 'Cumple Meta'], NAVY);
    ws.getRow(11).height = 34;
    ws.getRow(11).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

    const rows = [...(data.campaigns.camino_cumbre || [])].sort((a, b) => (b.Polizas_Totales || 0) - (a.Polizas_Totales || 0));
    rows.forEach((r, i) => {
        const row = ws.getRow(12 + i);
        const mes = Math.floor(Number(r.Mes_Asesor || 1));
        const total = Number(r.Polizas_Totales || 0);
        const meta = mes * 4;
        const falta = Math.max(0, meta - total);
        const alerta = mes <= 3 && Number(r[`Mes_${mes}_Prod`] || 0) === 0;
        const cumple = total >= meta;
        [i + 1, r.Asesor, r.Clave, mes, Number(r.Mes_1_Prod || 0), Number(r.Mes_2_Prod || 0), Number(r.Mes_3_Prod || 0), total, meta, falta, alerta ? '⚠️ ALERTA' : (cumple ? '✅ SÍ' : '❌ NO')]
            .forEach((v, c) => { row.getCell(c + 1).value = v; });
        row.getCell(11).font = { bold: true, color: { argb: cumple && !alerta ? GREEN : RED } };
        for (let c = 1; c <= 11; c++) { borderAll(row.getCell(c)); if (c !== 2) row.getCell(c).alignment = { horizontal: 'center' }; }
        row.getCell(8).font = { bold: true };
        if (cumple && !alerta) row.getCell(11).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHTGREEN } };
    });
    const tot = ws.getRow(12 + rows.length);
    tot.getCell(2).value = 'TOTAL PROMOTORÍA';
    tot.getCell(8).value = rows.reduce((s, r) => s + Number(r.Polizas_Totales || 0), 0);
    for (let c = 1; c <= 11; c++) { const x = tot.getCell(c); x.font = { bold: true }; x.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3C4' } }; if (c !== 2) x.alignment = { horizontal: 'center' }; }

    await wb.xlsx.writeFile(path.join(OUT_DIR, 'Camino_a_la_Cumbre_Promotoria.xlsx'));
    console.log('✅ Camino a la Cumbre generado —', rows.length, 'asesores');
}

await buildLegion();
await buildCamino();
await buildConvenciones();
await buildMdrt({ conPctVida: true });
await buildMdrt({
    claves: CLAVES_ASPIRANTES,
    meta: META_MDRT_ASPIRANTE,
    titulo: 'MDRT ASPIRANTES — 50% DE LA META',
    etiquetaMeta: 'META ASPIRANTE (50% MDRT)',
    etiquetaNivel: 'ASPIRANTE',
    hojaNombre: 'MDRT Aspirantes',
    archivo: 'MDRT_Aspirantes_Promotoria.xlsx',
});
console.log('\nListo. Archivos en:', OUT_DIR);
