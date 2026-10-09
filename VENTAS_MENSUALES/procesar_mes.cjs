/**
 * Arma las hojas "<MES>" (filas crudas) y "<MES>_CORREGIDO" (resumen por asesor)
 * en VENTAS MENSUALES.xlsx a partir del archivo "Emisión 2043 - cierre <mes>.xlsx".
 *
 * Uso: node procesar_mes.cjs SEPTIEMBRE "/ruta/Emisión 2043 - cierre septiembre.xlsx" [AÑO]
 *
 * Regla (deducida de AGOSTO): cuentan solo pólizas con ESTATUS "PAGADA" o
 * "PAGADA MP" y ramo VIDA/GMM. Vida = 1 póliza, GMM = 0.5. Monto real = PEA
 * dividido entre 12/4/2/1 según la frecuencia.
 */
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const mes = (process.argv[2] || '').toUpperCase();
const srcPath = process.argv[3];
const anio = process.argv[4] || String(new Date().getFullYear());
if (!mes || !srcPath) { console.error('Uso: node procesar_mes.cjs <MES> "<archivo descargado>" [AÑO]'); process.exit(1); }

const inputPath = path.join(__dirname, 'VENTAS MENSUALES.xlsx');
const wb = XLSX.readFile(inputPath, { cellFormula: true });
const src = XLSX.readFile(srcPath);
const srcSheet = src.SheetNames.find(n => n.trim().toUpperCase() === `${mes} ${anio}`);
if (!srcSheet) { console.error(`❌ No hay hoja "${mes} ${anio}" en ${srcPath}`); process.exit(1); }

const data = XLSX.utils.sheet_to_json(src.Sheets[srcSheet], { header: 1, defval: '' });
const hIdx = data.findIndex(r => r.some(c => String(c).trim().toUpperCase() === 'ASESOR'));
const head = data[hIdx].map(c => String(c).trim().toUpperCase());
const col = n => head.indexOf(n);
const cA = col('ASESOR'), cF = col('FORMA DE PAGO'), cP = col('PEA'), cE = col('ESTATUS'), cR = col('RAMO');

const limpiar = s => String(s).replace(/Ð/g, 'Ñ').trim();
const filas = [];
const descartadas = {};
for (const r of data.slice(hIdx + 1)) {
    const ramo = String(r[cR] || '').trim().toUpperCase();
    if (!r[cA] || !ramo) continue;
    const estatus = String(r[cE] || '').trim().toUpperCase();
    if (estatus !== 'PAGADA' && estatus !== 'PAGADA MP') { descartadas[estatus] = (descartadas[estatus] || 0) + 1; continue; }
    if (!ramo.includes('VIDA') && !ramo.includes('GMM')) continue;
    filas.push({ asesor: limpiar(r[cA]), frecuencia: String(r[cF]).trim().toUpperCase(), ramo: ramo.includes('VIDA') ? 'VIDA' : 'GMM', anual: Number(r[cP]) || 0 });
}
filas.sort((a, b) => a.asesor.localeCompare(b.asesor, 'es'));

// Hoja cruda "<MES>"
const div = f => f === 'MENSUAL' ? 12 : f === 'TRIMESTRAL' ? 4 : f === 'SEMESTRAL' ? 2 : 1;
const raw = [['ASESOR', 'FRECUENCIA', 'RAMO', 'MONTO ANUAL', 'MONTO REAL']];
filas.forEach(f => raw.push([f.asesor, f.frecuencia, f.ramo, f.anual, f.anual / div(f.frecuencia)]));
const wsRaw = XLSX.utils.aoa_to_sheet(raw);
filas.forEach((_, i) => { const n = i + 2; wsRaw['E' + n] = { t: 'n', v: raw[i + 1][4], f: `D${n}/IF(B${n}="MENSUAL",12,IF(B${n}="TRIMESTRAL",4,IF(B${n}="SEMESTRAL",2,1)))` }; });
if (wb.SheetNames.includes(mes)) wb.Sheets[mes] = wsRaw; else XLSX.utils.book_append_sheet(wb, wsRaw, mes);

// Hoja "<MES>_CORREGIDO"
const grouped = {};
for (const f of filas) {
    const g = grouped[f.asesor] ||= { nombre: f.asesor.replace(/\s+\d+$/, ''), vc: 0, vp: 0, gc: 0, gp: 0 };
    const real = f.anual / div(f.frecuencia);
    if (f.ramo === 'VIDA') { g.vc += 1; g.vp += real; } else { g.gc += 0.5; g.gp += real; }
}
const asesores = Object.values(grouped).sort((a, b) => (b.vp + b.gp) - (a.vp + a.gp));
const m = [["Asesor", "Pólizas ", "Vida", "Prima Pagada vida", "Gmm", "Prima Pagada gmm", "Prima total", "", "TOTAL", ""]];
let tvp = 0, tvc = 0, tgp = 0, tgc = 0;
const log = [];
asesores.forEach(a => {
    tvp += a.vp; tvc += a.vc; tgp += a.gp; tgc += a.gc;
    m.push([a.nombre, a.vc + a.gc, a.vc, a.vp, a.gc, a.gp, a.vp + a.gp, "", "", ""]);
    log.push(`Procesado: ${a.nombre} -> Vida: ${a.vc} ($${a.vp.toFixed(2)}), GMM: ${a.gc} ($${a.gp.toFixed(2)}), Total Pólizas: ${a.vc + a.gc}, Total Prima: $${(a.vp + a.gp).toFixed(2)}`);
});
while (m.length < 19) m.push(["", "", "", "", "", "", "", "", "", ""]);
const lado = [['PRIMA VIDA', tvp], ['POLIZAS VIDA', tvc], ['PRIMA GMM', tgp], ['POLIZAS GMM', tgc], ['POLIZAS V+GMM', tvc + tgc], ['PRIMA VI+GMM', tvp + tgp]];
lado.forEach(([k, v], i) => { m[i + 1][8] = k; m[i + 1][9] = v; });
['CAMPEONES:', 'NOVATO POLIZAS VIDA', 'PRO POLIZAS VIDA', 'NOVATO PRIMA VIDA', 'PRO PRIMA VIDA', 'NOVATO POLIZAS GMM', 'PRO POLIZAS GMM', 'NOVATO PRIMA GMM', 'PRO PRIMAS GMM']
    .forEach((k, i) => { m[10 + i][8] = k; m[10 + i][9] = ''; });
const wsC = XLSX.utils.aoa_to_sheet(m);
const nombreC = `${mes}_CORREGIDO`;
if (wb.SheetNames.includes(nombreC)) wb.Sheets[nombreC] = wsC; else XLSX.utils.book_append_sheet(wb, wsC, nombreC);

XLSX.writeFile(wb, inputPath);
const solo = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(solo, wsC, nombreC);
XLSX.writeFile(solo, path.join(__dirname, `${nombreC}_RESULTADO.xlsx`));
fs.writeFileSync(path.join(__dirname, `reporte_${mes.toLowerCase()}.txt`), log.join('\n'));
console.log(`✅ ${mes}: ${filas.length} pólizas pagadas, ${asesores.length} asesores. Descartadas por estatus:`, descartadas);
console.log(log.join('\n'));
console.log(`TOTALES: Vida ${tvc} pól / $${tvp.toFixed(2)} | GMM ${tgc} pól / $${tgp.toFixed(2)} | Prima total $${(tvp + tgp).toFixed(2)}`);
