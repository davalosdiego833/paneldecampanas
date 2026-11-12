// Excel de ALTAMAR 2027 (Camino 1) para la promotoría, con el diseño que Diego dejó:
// logo arriba a la izquierda, las dos tarjetas de metas (Consolidados / Nueva Organización)
// arriba a la derecha, título + meta, y la tabla de asesores.
// Uso: node scripts/generar_excel_altamar.js [carpeta_salida]   (por defecto el Escritorio)
// Imágenes en scripts/img/altamar_*.png. Datos: snapshot (campaigns.altamar).
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_PATH = path.join(__dirname, '..');
const OUT_DIR = process.argv[2] || path.join(process.env.HOME, 'Desktop');
const IMG = f => path.join(__dirname, 'img', f);

const snap = JSON.parse(fs.readFileSync(path.join(BASE_PATH, 'db', 'resumen_snapshot.json'), 'utf-8')).data;
const fix = x => String(x).replace(/Ð/g, 'Ñ').replace(/ð/g, 'ñ');
const META_POL = 8;
const META_COM = { CONSOLIDADO: 150000, NUEVA_ORGANIZACION: 80000 };
const NAVY = 'FF1F3A6E', GREEN = 'FFE3F6ED', RED = 'FFFDECEC', GOLD = 'FFFFF3C4';
const border = { bottom: { style: 'thin', color: { argb: 'FFD9DEE8' } } };

const rows = (snap.campaigns.altamar || []).slice().sort((a, b) => (b.Polizas - a.Polizas) || (b.Comisiones - a.Comisiones));
const widths = [38, 10, 14, 8, 22, 10, 14, 14, 17, 15];
const colPx = widths.map(w => Math.round(w * 7 + 5));
const totalPx = colPx.reduce((a, b) => a + b, 0);
const pxToCol = px => { let acc = 0; for (let i = 0; i < colPx.length; i++) { if (px < acc + colPx[i]) return i + (px - acc) / colPx[i]; acc += colPx[i]; } return colPx.length - 0.01; };

const wb = new ExcelJS.Workbook();
const ws = wb.addWorksheet('Altamar 2027', { views: [{ showGridLines: false }], pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 } });
widths.forEach((w, i) => { ws.getColumn(i + 1).width = w; });
for (let r = 1; r <= 5; r++) ws.getRow(r).height = 18; // 24 px por fila -> 120 px de zona de imágenes

const addImg = (file, xPx, hPx, wOfH) => {
    const id = wb.addImage({ filename: IMG(file), extension: 'png' });
    ws.addImage(id, { tl: { col: pxToCol(xPx), row: 0.1 }, ext: { width: Math.round(hPx * wOfH), height: hPx } });
};
addImg('altamar_logo.png', 4, 90, 472 / 122);
const hCard = 112;
const wC2 = Math.round(hCard * 334 / 168), wC1 = Math.round(hCard * 346 / 160);
addImg('altamar_nueva_organizacion.png', totalPx - wC2 - 4, hCard, 334 / 168);
addImg('altamar_consolidados.png', totalPx - wC2 - 4 - wC1 - 12, hCard, 346 / 160);

ws.mergeCells('A6:J6');
ws.getCell('A6').value = `Altamar 2027 — Avance de la promotoría · Camino 1 · Avance al ${snap.campaignDates.altamar}`;
ws.getCell('A6').font = { bold: true, size: 14, color: { argb: NAVY } };
ws.mergeCells('A7:J7');
ws.getCell('A7').value = 'Meta: 8 pólizas iniciales (Vida 1:1, GMM 0.5) + comisiones iniciales de $150,000 (Consolidados) o $80,000 (Nueva Organización)';
ws.getCell('A7').font = { italic: true, size: 10, color: { argb: 'FF555555' } };

const heads = ['Asesor', 'Clave', 'Conexión', 'Mes', 'Tipo de asesor', 'Pólizas', 'Cumple pólizas', 'Comisiones', 'Cumple comisiones', 'Cumple'];
const HR = 9;
heads.forEach((t, i) => {
    const c = ws.getCell(HR, i + 1);
    c.value = t; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
    c.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
});
ws.getRow(HR).height = 30;

let okAll = 0;
rows.forEach((a, i) => {
    const cons = a.Tipo_Asesor === 'CONSOLIDADO';
    const meta = cons ? META_COM.CONSOLIDADO : META_COM.NUEVA_ORGANIZACION;
    const cp = a.Polizas >= META_POL, cc = a.Comisiones >= meta, all = cp && cc;
    if (all) okAll++;
    const [y, m, d] = (a.Conexion || '').split('-').map(Number);
    const vals = [fix(a.Asesor), +a.Clave, y ? new Date(y, m - 1, d) : '', a.Mes_Asesor, cons ? 'Consolidado' : 'Nueva Organización', a.Polizas, cp ? '✅ Sí' : '❌ No', a.Comisiones, cc ? '✅ Sí' : '❌ No', all ? '✅ Cumple' : '❌ No cumple'];
    const row = ws.getRow(HR + 1 + i);
    vals.forEach((v, j) => {
        const c = row.getCell(j + 1);
        c.value = v; c.border = border;
        if (j !== 0) c.alignment = { horizontal: 'center' };
        if (j === 2) c.numFmt = 'dd/mm/yyyy';
        if (j === 5) c.numFmt = '0.0';
        if (j === 7) c.numFmt = '$#,##0';
        if (j === 6 || j === 8 || j === 9) {
            c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: String(v).startsWith('✅') ? GREEN : RED } };
            c.font = { bold: true, size: 10 };
        }
    });
});
const tr = ws.getRow(HR + 1 + rows.length);
tr.getCell(1).value = `TOTAL: ${rows.length} asesores · ${okAll} cumplen el Camino 1`;
for (let c = 1; c <= 10; c++) { tr.getCell(c).font = { bold: true }; tr.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GOLD } }; }

await wb.xlsx.writeFile(path.join(OUT_DIR, 'Altamar_Promotoria.xlsx'));
console.log(`✅ Altamar generado — ${rows.length} asesores, ${okAll} cumplen · ${OUT_DIR}/Altamar_Promotoria.xlsx`);
