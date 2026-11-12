// Excel del Comparativo de Vida por asesor: solo pólizas pagadas y prima pagada
// (año anterior, año actual, crecimiento y % de crecimiento). Datos: snapshot.
// El reporte de la compañía viene "en miles", aquí la prima se convierte a pesos (x1000).
// Uso: node scripts/generar_excel_comparativo_vida.js [carpeta_salida]   (por defecto el Escritorio)
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_PATH = path.join(__dirname, '..');
const OUT_DIR = process.argv[2] || path.join(process.env.HOME, 'Desktop');
const snap = JSON.parse(fs.readFileSync(path.join(BASE_PATH, 'db', 'resumen_snapshot.json'), 'utf-8')).data;
const fix = x => String(x).replace(/Ð/g, 'Ñ').replace(/ð/g, 'ñ');
const K = 1000;
const NAVY = 'FF1F3A6E', TEAL = 'FF2E6F9E', GREEN = 'FF1FA37A', GOLD = 'FFFFF3C4', GOOD = 'FF1B8A5A', BAD = 'FFD64545';
const border = { bottom: { style: 'thin', color: { argb: 'FFD9DEE8' } } };

const rows = (snap.resumen_general.comparativo_vida.individuals || []).map(r => ({
    nombre: fix(r['Nombre del Asesor']), clave: +r.Clave, suc: r.Sucursal,
    pa: +r.Polizas_Pagadas_Año_Anterior || 0, pc: +r.Polizas_Pagadas_Año_Actual || 0,
    xa: (+r.Prima_Pagada_Año_Anterior || 0) * K, xc: (+r.Prima_Pagada_Año_Actual || 0) * K,
})).filter(r => r.pa !== 0 || r.xa !== 0) // se quitan los que tienen 0 en pólizas Y prima del año anterior
  .sort((a, b) => ((b.xc - b.xa) - (a.xc - a.xa)));

const pct = (c, a) => (a ? (c - a) / a : (c ? 1 : 0));
const wb = new ExcelJS.Workbook();
const ws = wb.addWorksheet('Comparativo Vida', { views: [{ showGridLines: false, state: 'frozen', xSplit: 1, ySplit: 5 }] });
[36, 9, 8, 11, 11, 12, 12, 17, 17, 17, 12].forEach((w, i) => { ws.getColumn(i + 1).width = w; });
ws.mergeCells('A1:K1'); ws.getCell('A1').value = 'Comparativo de Vida por asesor — ¿Quién crece y quién decrece?';
ws.getCell('A1').font = { bold: true, size: 15, color: { argb: NAVY } };
ws.mergeCells('A2:K2'); ws.getCell('A2').value = `Información al ${snap.fechas_corte.comparativo_vida} · Pólizas pagadas y prima pagada de Vida Individual · Prima en pesos (el reporte viene en miles) · Solo asesores con producción el año anterior · Ordenado de mayor a menor crecimiento de prima`;
ws.getCell('A2').font = { italic: true, size: 10, color: { argb: 'FF555555' } };

const hdr = (c, t, col) => { c.value = t; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: col } }; c.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }; c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }; };
ws.mergeCells('A4:A5'); hdr(ws.getCell('A4'), 'Asesor', NAVY);
ws.mergeCells('B4:B5'); hdr(ws.getCell('B4'), 'Clave', NAVY);
ws.mergeCells('C4:C5'); hdr(ws.getCell('C4'), 'Unidad', NAVY);
ws.mergeCells('D4:G4'); hdr(ws.getCell('D4'), 'PÓLIZAS PAGADAS', TEAL);
ws.mergeCells('H4:K4'); hdr(ws.getCell('H4'), 'PRIMA PAGADA (pesos)', GREEN);
['Año anterior', 'Año actual', 'Crecimiento', '% crecimiento'].forEach((t, i) => { hdr(ws.getCell(5, 4 + i), t, TEAL); hdr(ws.getCell(5, 8 + i), t, GREEN); });
ws.getRow(5).height = 28;

const put = (r, v, total) => {
    const row = ws.getRow(r);
    const vals = [v.nombre, v.clave ?? '', v.suc ?? '', v.pa, v.pc, v.pc - v.pa, pct(v.pc, v.pa), v.xa, v.xc, v.xc - v.xa, pct(v.xc, v.xa)];
    vals.forEach((x, j) => {
        const c = row.getCell(j + 1);
        c.value = x; c.border = border;
        if (j > 0) c.alignment = { horizontal: 'center' };
        if (j >= 3 && j <= 5) c.numFmt = j === 5 ? '+0.0;-0.0;0.0' : '0.0';
        if (j === 6 || j === 10) c.numFmt = '+0.0%;-0.0%;0.0%';
        if (j >= 7 && j <= 9) c.numFmt = j === 9 ? '+$#,##0;-$#,##0;$0' : '$#,##0';
        if (j === 5 || j === 6 || j === 9 || j === 10) {
            const n = typeof x === 'number' ? x : 0;
            c.font = { bold: true, color: { argb: n > 0 ? GOOD : n < 0 ? BAD : 'FF777777' } };
        }
        if (total) { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GOLD } }; c.font = { ...(c.font || {}), bold: true }; }
    });
};
rows.forEach((v, i) => put(6 + i, v, false));
const tot = rows.reduce((t, r) => ({ pa: t.pa + r.pa, pc: t.pc + r.pc, xa: t.xa + r.xa, xc: t.xc + r.xc }), { pa: 0, pc: 0, xa: 0, xc: 0 });
put(6 + rows.length + 1, { nombre: 'TOTAL PROMOTORÍA', ...tot }, true);
ws.autoFilter = { from: { row: 5, column: 1 }, to: { row: 5 + rows.length, column: 11 } };
await wb.xlsx.writeFile(path.join(OUT_DIR, 'Comparativo_Vida_Asesores.xlsx'));
const crece = rows.filter(r => r.xc > r.xa).length, decrece = rows.filter(r => r.xc < r.xa).length;
console.log(`✅ ${rows.length} asesores · crecen ${crece} · decrecen ${decrece} · total pólizas ${tot.pa}→${tot.pc} (${(pct(tot.pc, tot.pa) * 100).toFixed(1)}%) · prima $${Math.round(tot.xa)}→$${Math.round(tot.xc)} (${(pct(tot.xc, tot.xa) * 100).toFixed(1)}%)`);
