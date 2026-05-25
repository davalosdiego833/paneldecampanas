import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.join(__dirname, '../administrador/comparativo_vida/comparativo vida.xlsx');

const wb = XLSX.readFile(filePath);
const ws = wb.Sheets['asesores'];
const raw = XLSX.utils.sheet_to_json(ws, { header: 1 });

// Col 6 = Nombre del Asesor, Col 24 = Prima Pagada Año Actual (miles)
// Search in BOTH col 4 (Promotor) and col 6 (Nombre del Asesor)
const targets = [
  { key: 'monica',   label: 'Mónica Andrea Ambriz' },
  { key: 'desiree',  label: 'Desirée de la Peña' },
  { key: 'anais',    label: 'Anais Lua Moreno' },
  { key: 'rafael',   label: 'Rafael Alberto Suárez' },
  { key: 'orlanda',  label: 'Orlanda Jimena Cervantes' },
  { key: 'liliana',  label: 'Liliana Ivette Castillo' },
  { key: 'darinka',  label: 'Darinka Ureña Casillas' },
];

const totals = {};
targets.forEach(t => { totals[t.key] = { label: t.label, total: 0, rows: [] }; });

raw.forEach((row, i) => {
  if (i < 6) return;
  const promotor = String(row[4] || '').toLowerCase();
  const asesor   = String(row[6] || '').toLowerCase();
  const combined = promotor + ' ' + asesor;

  targets.forEach(t => {
    if (combined.includes(t.key)) {
      const prima = Number(row[24] || 0);
      totals[t.key].total += prima;
      totals[t.key].rows.push({ asesor: row[6], prima });
    }
  });
});

console.log('=== PRIMA PAGADA AÑO ACTUAL — COMPARATIVO DE VIDA ACTUALIZADO ===\n');
targets.forEach(t => {
  const d = totals[t.key];
  const totalPesos = Math.round(d.total * 1000);
  console.log(`${d.label}`);
  console.log(`  $${totalPesos.toLocaleString('es-MX')}  (${d.total.toFixed(3)}K)`);
  d.rows.forEach(r => console.log(`    - ${r.asesor}: ${r.prima}K`));
  console.log('');
});
