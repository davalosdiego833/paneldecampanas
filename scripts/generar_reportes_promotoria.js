// Genera los 3 Excels de seguimiento manual que Diego mandaba a mano
// (Legión Centurión, Convenciones, MDRT) a partir del snapshot actual del panel.
// Uso: node scripts/generar_reportes_promotoria.js [carpeta_salida]
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_PATH = path.join(__dirname, '..');
const OUT_DIR = process.argv[2] || path.join(process.env.HOME, 'Desktop');

const snapshot = JSON.parse(fs.readFileSync(path.join(BASE_PATH, 'db', 'resumen_snapshot.json'), 'utf-8'));
const data = snapshot.data;

const today = new Date();
const MES_ACTUAL = today.getMonth() + 1; // 1-12, mes calendario real de hoy
const MESES_RESTANTES = 12 - MES_ACTUAL + 1; // incluye el mes en curso
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
    ws.getCell('B9').value = `Avance al ${fechaCorte} — Meta del mes (${MESES_NOMBRES[MES_ACTUAL-1]}): ${4 * MES_ACTUAL} pólizas mínimo (Bronce)`;
    ws.getCell('B9').font = { italic: true, size: 10, color: { argb: 'FF555555' } };

    const headers = ['Asesor', 'Clave', 'Total Pólizas', `Faltante Bronce (${4*MES_ACTUAL})`, 'Cumple Meta'];
    headerRow(ws, 11, headers, NAVY);
    ws.getColumn(2).width = 32;

    const threshold = 4 * MES_ACTUAL;
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

async function buildMdrt() {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('MDRT', { views: [{ showGridLines: false }] });
    ws.columns = [{ width: 4 }, { width: 6 }, { width: 32 }, { width: 10 }, { width: 16 }, { width: 16 }, { width: 18 }, { width: 10 }];

    await addLogo(wb, ws, 'mdrt.png', 'B2:D6');

    ws.mergeCells('E2:H2');
    ws.getCell('E2').value = 'MESA DEL MILLÓN DE DÓLARES — PRIMA INICIAL ANUALIZADA';
    ws.getCell('E2').font = { bold: true, size: 12, color: { argb: NAVY } };
    ws.getCell('E2').alignment = { horizontal: 'center', wrapText: true };

    ws.mergeCells('E4:H4');
    ws.getCell('E4').value = `META MIEMBRO MDRT: $${META_MDRT_MIEMBRO.toLocaleString('es-MX')}`;
    ws.getCell('E4').font = { bold: true, color: { argb: NAVY } };
    ws.mergeCells('E5:H5');
    ws.getCell('E5').value = `Meses restantes del año (incluye ${MESES_NOMBRES[MES_ACTUAL-1]}): ${MESES_RESTANTES}`;
    ws.getCell('E5').font = { italic: true, size: 10, color: { argb: 'FF555555' } };

    const fechaCorte = data.campaignDates?.mdrt || '';
    ws.mergeCells('B9:H9');
    ws.getCell('B9').value = `Avance al ${fechaCorte}`;
    ws.getCell('B9').font = { italic: true, size: 10, color: { argb: 'FF555555' } };

    const headers = ['Lugar', 'Asesor', 'Clave', 'Total Prima', 'Faltante MDRT', 'Faltante Prom./Mes', 'Nivel'];
    headerRow(ws, 11, headers, NAVY);

    const rows = [...(data.campaigns.mdrt || [])].sort((a,b) => (b.PA_Acumulada||0) - (a.PA_Acumulada||0));
    rows.forEach((r, i) => {
        const rowIdx = 12 + i;
        const row = ws.getRow(rowIdx);
        const prima = Number(r.PA_Acumulada || 0);
        const faltante = Math.max(0, META_MDRT_MIEMBRO - prima);
        const faltanteProm = faltante > 0 ? faltante / MESES_RESTANTES : 0;
        const logrado = prima >= META_MDRT_MIEMBRO;
        row.getCell(1).value = i + 1;
        row.getCell(2).value = r.Asesor;
        row.getCell(3).value = r.Clave;
        row.getCell(4).value = prima; row.getCell(4).numFmt = '$#,##0';
        row.getCell(5).value = logrado ? 0 : faltante; row.getCell(5).numFmt = '$#,##0';
        row.getCell(6).value = logrado ? 0 : faltanteProm; row.getCell(6).numFmt = '$#,##0';
        row.getCell(7).value = logrado ? 'MDRT' : '';
        row.getCell(7).font = { bold: true, color: { argb: GREEN } };
        [1,2,3,4,5,6,7].forEach(c => { borderAll(row.getCell(c)); if (c===1 || c>=4) row.getCell(c).alignment = { horizontal: 'center' }; });
        if (logrado) [1,2,3,4,5,6,7].forEach(c => row.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHTGREEN } });
    });

    await wb.xlsx.writeFile(path.join(OUT_DIR, 'MDRT_Promotoria.xlsx'));
    console.log('✅ MDRT generado —', rows.length, 'asesores');
}

await buildLegion();
await buildConvenciones();
await buildMdrt();
console.log('\nListo. Archivos en:', OUT_DIR);
