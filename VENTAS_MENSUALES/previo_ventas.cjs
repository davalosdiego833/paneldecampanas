/**
 * PREVIO de ventas del mes (antes del cierre). Lee previo_datos_<MES>.json (filas transcritas de las fotos del avance)
 * y arma el Excel con 2 pestañas: todo lo de las fotos + solo PAGADA / PAGADA MP con resumen por asesor.
 *
 * Uso: node previo_ventas.cjs OCTUBRE [carpeta_salida]      (default: Escritorio)
 *
 * Columnas informativas (NO afectan los campeones ni procesar_mes.cjs / generar_reporte_cierre.cjs):
 *  - Vida 1 a 1 : cada póliza de vida = 1.        GMM 1 a 1 : cada póliza de GMM = 1.
 *  - Vida CC    : puntos por PEA (campañas): >= 17,000 = 1 · >= 65,000 = 2 · >= 190,000 = 3 · menos de 17,000 = 0.
 *  - GMM CC     : cada póliza de GMM = 0.5 (nunca doble/triple) siempre que su PEA sea >= 10,000; menos de eso = 0.
 * Las pólizas pagadas por debajo del mínimo (Vida < 17,000 / GMM < 10,000) salen en la tabla "Primas menores al mínimo".
 * Campeones del mes siguen con Vida 1 a 1 y GMM CC (0.5), como siempre.
 */
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

const mes = (process.argv[2] || '').toUpperCase();
const OUT_DIR = process.argv[3] || path.join(process.env.HOME, 'Desktop');
const datosPath = path.join(__dirname, `previo_datos_${mes}.json`);
if (!mes || !fs.existsSync(datosPath)) { console.error('Uso: node previo_ventas.cjs <MES>  (necesita previo_datos_<MES>.json)'); process.exit(1); }
const D = JSON.parse(fs.readFileSync(datosPath, 'utf-8'));

const NAVY = 'FF1F3A6E', GOLD = 'FFFFF3C4', RED = 'FFE24B4A';
const border = { bottom: { style: 'thin', color: { argb: 'FFD9DEE8' } } };
const hdr = (c, t) => { c.value = t; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } }; c.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }; c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }; };
const fill = (c, a) => c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: a } };
const sp = s => { const m = s.match(/^(.*?)\s+(\d+)$/); return { nombre: m[1], clave: +m[2] }; };
const ramoDe = f => /^(DG00|VM35)VD/.test(f) ? 'VIDA' : /^(DG00|VM35)GM/.test(f) ? 'GMM' : '?';
const div = f => f === 'MENSUAL' ? 12 : f === 'TRIMESTRAL' ? 4 : f === 'SEMESTRAL' ? 2 : 1;
const MIN_VIDA = 17000, MIN_GMM = 10000;
const puntosVidaCC = pea => pea >= 190000 ? 3 : pea >= 65000 ? 2 : pea >= MIN_VIDA ? 1 : 0;
const FORM_CC = `IF(I{n}="GMM",IF(G{n}>=${MIN_GMM},0.5,0),IF(G{n}>=190000,3,IF(G{n}>=65000,2,IF(G{n}>=${MIN_VIDA},1,0))))`;

const rows = D.filas.map(r => ({ partner: r[0], ...sp(r[1]), folio: r[2], cliente: r[3], forma: r[4], pea: r[5], estatus: r[6], ramo: ramoDe(r[2]) }));
if (rows.some(r => r.ramo === '?')) throw new Error('Hay folios cuyo ramo no se pudo deducir');

const wb = new ExcelJS.Workbook();
const head = (ws, t, s, span) => { ws.mergeCells(1, 1, 1, span); ws.getCell('A1').value = t; ws.getCell('A1').font = { bold: true, size: 14, color: { argb: NAVY } }; ws.mergeCells(2, 1, 2, span); ws.getCell('A2').value = s; ws.getCell('A2').font = { italic: true, size: 10, color: { argb: 'FF555555' } }; };

// ---- Hoja 1: todo lo de las fotos
const a = wb.addWorksheet('Avance ' + mes.toLowerCase() + ' (fotos)', { views: [{ showGridLines: false, state: 'frozen', ySplit: 4 }] });
head(a, `Ventas ${mes.toLowerCase()} ${D.anio} — PREVIO (${D.corte})`, 'Todo lo que viene en las fotos, tal cual. El ramo (Vida/GMM) se dedujo del folio (VD = Vida, GM = GMM); la foto no trae esa columna.', 9);
['Partner', 'Asesor', 'Clave', 'Folio', 'Cliente', 'Forma de pago', 'PEA', 'Estatus', 'Ramo (por folio)'].forEach((t, i) => hdr(a.getCell(4, i + 1), t));
a.getRow(4).height = 28;
rows.forEach((r, i) => {
    const row = a.getRow(5 + i);
    [r.partner, r.nombre, r.clave, r.folio, r.cliente, r.forma, r.pea, r.estatus, r.ramo].forEach((v, j) => {
        const c = row.getCell(j + 1); c.value = v; c.border = border;
        if ([0, 2, 3, 5, 7, 8].includes(j)) c.alignment = { horizontal: 'center' };
        if (j === 6) c.numFmt = '$#,##0.00;[Red]-$#,##0.00';
        if (r.estatus === 'ANULADA') c.font = { color: { argb: RED } };
    });
});
const last = 4 + rows.length;
let t = last + 2;
const S = (p, st) => st.map(s => `SUMIFS($G$5:$G$${last},$A$5:$A$${last},"${p}",$H$5:$H$${last},"${s}")`).join('+');
const val = (p, st) => Math.round(rows.filter(r => r.partner === p && st.includes(r.estatus)).reduce((s, r) => s + r.pea, 0) * 100) / 100;
const tot = (label, p, st) => {
    a.getCell(t, 5).value = p; a.getCell(t, 5).alignment = { horizontal: 'right' };
    a.getCell(t, 6).value = label; a.getCell(t, 6).font = { bold: true };
    const c = a.getCell(t, 7); c.value = { formula: S(p, st), result: val(p, st) }; c.numFmt = '$#,##0.00;[Red]-$#,##0.00'; c.font = { bold: true }; fill(c, GOLD); t++;
};
for (const p of [...new Set(rows.map(r => r.partner))]) {
    tot('Aceptadas y pagadas (neto de anuladas)', p, ['ACEPTADA', 'PAGADA', 'ANULADA']);
    tot('Anuladas', p, ['ANULADA']);
    tot('Aceptadas NT y pagadas MP', p, ['ACEPTADA NT', 'PAGADA MP']);
    tot('   Aceptadas NT', p, ['ACEPTADA NT']);
    tot('   Pagadas MP', p, ['PAGADA MP']);
    t++;
}
[9, 38, 10, 22, 38, 14, 15, 14, 12].forEach((w, i) => a.getColumn(i + 1).width = w);

// ---- Hoja 2: solo PAGADA / PAGADA MP
const P = rows.filter(r => ['PAGADA', 'PAGADA MP'].includes(r.estatus)).sort((x, y) => x.nombre.localeCompare(y.nombre, 'es') || x.folio.localeCompare(y.folio));
const b = wb.addWorksheet('Solo pagadas (previo)', { views: [{ showGridLines: false, state: 'frozen', ySplit: 4 }] });
head(b, `Solo PAGADA y PAGADA MP — PREVIO ${mes.toLowerCase()} ${D.anio}`, 'Prima real = PEA ÷ 12/4/2/1 según la forma de pago. 1 a 1: toda póliza = 1. CC (puntos de campañas): Vida por PEA (17 mil = 1 · 65 mil = 2 · 190 mil = 3), GMM = 0.5 sin doble/triple (mínimo 10 mil de PEA). Solo informativo.', 18);
['Partner', 'Asesor', 'Clave', 'Folio', 'Cliente', 'Forma de pago', 'PEA', 'Estatus', 'Ramo', 'Póliza 1 a 1', 'Puntos CC', 'Monto real'].forEach((tx, i) => hdr(b.getCell(4, i + 1), tx));
b.getRow(4).height = 28;
const cc = r => r.ramo === 'GMM' ? (r.pea >= MIN_GMM ? 0.5 : 0) : puntosVidaCC(r.pea);
P.forEach((r, i) => {
    const n = 5 + i, row = b.getRow(n);
    [r.partner, r.nombre, r.clave, r.folio, r.cliente, r.forma, r.pea, r.estatus, r.ramo].forEach((v, j) => {
        const c = row.getCell(j + 1); c.value = v; c.border = border;
        if ([0, 2, 3, 5, 7, 8].includes(j)) c.alignment = { horizontal: 'center' };
        if (j === 6) c.numFmt = '$#,##0.00';
    });
    const p1 = row.getCell(10); p1.value = 1; p1.alignment = { horizontal: 'center' }; p1.border = border;
    const pc = row.getCell(11); pc.value = { formula: FORM_CC.replace(/\{n\}/g, n), result: cc(r) }; pc.alignment = { horizontal: 'center' }; pc.border = border;
    const mr = row.getCell(12); mr.value = { formula: `G${n}/IF(F${n}="MENSUAL",12,IF(F${n}="TRIMESTRAL",4,IF(F${n}="SEMESTRAL",2,1)))`, result: r.pea / div(r.forma) }; mr.numFmt = '$#,##0.00'; mr.border = border;
});
const lp = 4 + P.length, tr = b.getRow(lp + 1);
tr.getCell(2).value = `TOTAL: ${P.length} pólizas pagadas`;
tr.getCell(7).value = { formula: `SUM(G5:G${lp})`, result: P.reduce((s, r) => s + r.pea, 0) };
tr.getCell(10).value = { formula: `SUM(J5:J${lp})`, result: P.length };
tr.getCell(11).value = { formula: `SUM(K5:K${lp})`, result: P.reduce((s, r) => s + cc(r), 0) };
tr.getCell(12).value = { formula: `SUM(L5:L${lp})`, result: P.reduce((s, r) => s + r.pea / div(r.forma), 0) };
for (let c = 1; c <= 12; c++) { const x = tr.getCell(c); x.font = { bold: true }; fill(x, GOLD); if (c === 7 || c === 12) x.numFmt = '$#,##0.00'; if (c === 10 || c === 11) x.alignment = { horizontal: 'center' }; }

// Resumen por asesor (a la derecha)
const c0 = 14; // N
const H = ['Asesor', 'Pólizas', 'Vida 1 a 1', 'Vida CC', 'Prima Pagada Vida', 'GMM 1 a 1', 'GMM CC', 'Prima Pagada GMM', 'Prima total'];
H.forEach((tx, i) => hdr(b.getCell(4, c0 + i), tx));
const G = {};
P.forEach(r => {
    const g = G[r.nombre] ||= { v1: 0, vcc: 0, vp: 0, g1: 0, gcc: 0, gp: 0 };
    const real = r.pea / div(r.forma);
    if (r.ramo === 'VIDA') { g.v1 += 1; g.vcc += puntosVidaCC(r.pea); g.vp += real; } else { g.g1 += 1; g.gcc += cc(r); g.gp += real; }
});
const L = Object.entries(G).sort((x, y) => (y[1].vp + y[1].gp) - (x[1].vp + x[1].gp));
const cl = k => b.getColumn(c0 + k).letter;
const rng = col => `$${col}$5:$${col}$${lp}`;
L.forEach(([nom, g], i) => {
    const n = 5 + i;
    const set = (k, v, fmt, center) => { const c = b.getCell(n, c0 + k); c.value = v; c.border = border; if (fmt) c.numFmt = fmt; if (center) c.alignment = { horizontal: 'center' }; };
    const A = `${cl(0)}${n}`;
    set(0, nom);
    set(2, { formula: `COUNTIFS(${rng('B')},${A},${rng('I')},"VIDA")`, result: g.v1 }, null, true);
    set(3, { formula: `SUMIFS(${rng('K')},${rng('B')},${A},${rng('I')},"VIDA")`, result: g.vcc }, null, true);
    set(4, { formula: `SUMIFS(${rng('L')},${rng('B')},${A},${rng('I')},"VIDA")`, result: g.vp }, '$#,##0.00');
    set(5, { formula: `COUNTIFS(${rng('B')},${A},${rng('I')},"GMM")`, result: g.g1 }, null, true);
    set(6, { formula: `SUMIFS(${rng('K')},${rng('B')},${A},${rng('I')},"GMM")`, result: g.gcc }, null, true);
    set(7, { formula: `SUMIFS(${rng('L')},${rng('B')},${A},${rng('I')},"GMM")`, result: g.gp }, '$#,##0.00');
    set(1, { formula: `${cl(2)}${n}+${cl(5)}${n}`, result: g.v1 + g.g1 }, null, true);
    set(8, { formula: `${cl(4)}${n}+${cl(7)}${n}`, result: g.vp + g.gp }, '$#,##0.00');
});
const lt = 5 + L.length, e = 4 + L.length;
const T = (k, formula, result, fmt) => { const c = b.getCell(lt, c0 + k); c.value = formula ? { formula, result } : result; c.font = { bold: true }; fill(c, GOLD); if (fmt) c.numFmt = fmt; if (k > 0) c.alignment = { horizontal: 'center' }; };
T(0, null, 'TOTAL');
const sum = f => L.reduce((s, [, g]) => s + f(g), 0);
const cols = { 1: g => g.v1 + g.g1, 2: g => g.v1, 3: g => g.vcc, 4: g => g.vp, 5: g => g.g1, 6: g => g.gcc, 7: g => g.gp, 8: g => g.vp + g.gp };
for (const k of Object.keys(cols)) T(+k, `SUM(${cl(+k)}5:${cl(+k)}${e})`, sum(cols[k]), [4, 7, 8].includes(+k) ? '$#,##0.00' : null);
const nota = b.getCell(lt + 2, c0);
nota.value = 'Pólizas = Vida 1 a 1 + GMM 1 a 1 (las que realmente vendieron). Los puntos para campañas están en Vida CC + GMM CC. Campeones del mes: Vida 1 a 1 y GMM CC (0.5), igual que siempre.';
nota.font = { italic: true, size: 9, color: { argb: 'FF555555' } };

// Tabla de primas menores al mínimo para CC (solo pagadas): Vida < 17,000 · GMM < 10,000
const menores = P.filter(r => r.pea < (r.ramo === 'GMM' ? MIN_GMM : MIN_VIDA));
const tm = lt + 4;
b.getCell(tm, c0).value = `PRIMAS MENORES AL MÍNIMO PARA CC (pólizas pagadas) — Vida menor a $${MIN_VIDA.toLocaleString('en-US')} · GMM menor a $${MIN_GMM.toLocaleString('en-US')} de PEA`;
b.getCell(tm, c0).font = { bold: true, size: 11, color: { argb: NAVY } };
['Asesor', 'Ramo', 'Folio', 'Cliente', 'PEA', 'Mínimo CC', 'Le falta', 'Estatus'].forEach((tx, i) => hdr(b.getCell(tm + 1, c0 + i), tx));
if (!menores.length) {
    const c = b.getCell(tm + 2, c0);
    c.value = '✔ Ninguna póliza pagada está por debajo del mínimo.'; c.font = { italic: true, color: { argb: 'FF1FB37A' } };
} else {
    menores.forEach((r, i) => {
        const min = r.ramo === 'GMM' ? MIN_GMM : MIN_VIDA, n = tm + 2 + i;
        [r.nombre, r.ramo, r.folio, r.cliente, r.pea, min, min - r.pea, r.estatus].forEach((v, j) => {
            const c = b.getCell(n, c0 + j); c.value = v; c.border = border;
            if ([1, 2, 7].includes(j)) c.alignment = { horizontal: 'center' };
            if ([4, 5, 6].includes(j)) c.numFmt = '$#,##0.00';
            if (j === 4) c.font = { color: { argb: RED }, bold: true };
        });
    });
}
[9, 36, 9, 22, 34, 14, 14, 13, 8, 9, 9, 14, 3, 36, 9, 10, 9, 18, 10, 9, 18, 16].forEach((w, i) => b.getColumn(i + 1).width = w);

const out = path.join(OUT_DIR, `PREVIO_Ventas_${mes.charAt(0) + mes.slice(1).toLowerCase()}.xlsx`);
wb.xlsx.writeFile(out).then(() => {
    console.log('✅', out, '|', P.length, 'pólizas pagadas,', L.length, 'asesores');
    L.forEach(([n, g]) => console.log(n.padEnd(36), 'pól', g.v1 + g.g1, '| vida 1a1', g.v1, 'CC', g.vcc, '| gmm 1a1', g.g1, 'CC', g.gcc, '| prima', Math.round(g.vp + g.gp)));
    console.log('TOTAL pól', sum(cols[1]), '| vida 1a1', sum(cols[2]), 'CC', sum(cols[3]), '| gmm 1a1', sum(cols[5]), 'CC', sum(cols[6]), '| prima', Math.round(sum(cols[8])));
});
