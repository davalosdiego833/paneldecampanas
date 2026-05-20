import fs from 'fs';
import path from 'path';

const file = './estatus polizas/cambios/2026-05/cambios_2026-05-20_inactivos.json';
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

const anuladas = data.lista_cambios.filter(c => c.estatus_nuevo === 'Anulada');

console.log(`🔍 Total pólizas recién anuladas (cambios detectados): ${anuladas.length}`);

const grouped = {};
anuladas.forEach(c => {
  if (!grouped[c.asesor]) grouped[c.asesor] = [];
  grouped[c.asesor].push(c);
});

Object.keys(grouped).forEach(asesor => {
  console.log(`\n👤 Asesor: ${asesor} (${grouped[asesor][0].clave}) - ${grouped[asesor].length} pólizas anuladas:`);
  grouped[asesor].forEach(p => {
    console.log(`  - Póliza: ${p.poliza} | Contratante: ${p.contratante} | Producto: ${p.producto} | De: ${p.estatus_anterior} -> ${p.estatus_nuevo}`);
  });
});
