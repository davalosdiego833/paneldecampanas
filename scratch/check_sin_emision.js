import fs from 'fs';

const snapshot = JSON.parse(fs.readFileSync('./db/resumen_snapshot.json', 'utf8'));
const sin = snapshot.data.resumen_general.asesores_sin_emision.individuals || [];

console.log('--- asesores_sin_emision.individuals count:', sin.length);
sin.slice(0, 15).forEach(s => {
    console.log(`Asesor: ${s.Asesor} -> Emitido Vida: ${s.Emitido_Vida}, Pagado Vida: ${s.Pagado_Vida}`);
});

console.log('\n--- Checking AI list against asesores_sin_emision ---');
const list = [
  'MARIA FERNANDA',
  'DARINKA',
  'ANA LAURA',
  'VELIA PATRICIA',
  'ADRIANA',
  'MIREYA',
  'PAULINA',
  'SOFIA',
  'MONSERRAT',
  'ANAIS',
  'MARIO IVAN'
];

list.forEach(name => {
    const s = sin.find(row => row.Asesor.toUpperCase().includes(name.toUpperCase()));
    if (s) {
        console.log(`Asesor: ${s.Asesor} -> FOUND in asesores_sin_emision!`);
    } else {
        console.log(`Asesor: ${name} -> NOT FOUND`);
    }
});
