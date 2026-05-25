import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.join(__dirname, '../administrador/pagado_emitidido/pagado_emitido.xlsx');

const wb = XLSX.readFile(filePath);
const ws = wb.Sheets[wb.SheetNames[0]];
const raw = XLSX.utils.sheet_to_json(ws, { header: 1 });

// Print first 5 rows to understand structure
console.log('=== PRIMERAS 6 FILAS (estructura) ===');
raw.slice(0, 6).forEach((r, i) => console.log(`Fila ${i}:`, JSON.stringify(r)));

// Target advisors (partial match, case insensitive)
const targets = ['monica', 'desiree', 'anais', 'rafael', 'orlanda', 'liliana', 'darinka'];

console.log('\n=== ASESORES DE LA PRESENTACIÓN ===');
raw.forEach((row, i) => {
  if (i < 3) return; // skip headers
  const name = String(row[2] || '').toLowerCase();
  if (targets.some(t => name.includes(t))) {
    console.log(`\nFila ${i}: ${row[2]}`);
    console.log(`  Clave: ${row[0]} | Suc: ${row[1]}`);
    console.log(`  Pólizas Pagadas: ${row[5]}`);
    console.log(`  RI Pagado:       ${row[6]}`);
    console.log(`  RO Pagado:       ${row[7]}`);
    console.log(`  TOTAL Prima Pagada: ${row[8]}`);
  }
});

// Also show total from general summary
console.log('\n=== TOTAL GENERAL PROMOTORIA ===');
// Look for totals row
raw.forEach((row, i) => {
  const cell = String(row[0] || '').toLowerCase();
  if (cell.includes('total') || cell.includes('suma')) {
    console.log(`Fila ${i}:`, JSON.stringify(row));
  }
});
