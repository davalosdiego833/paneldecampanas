import fs from 'fs';

const snapshot = JSON.parse(fs.readFileSync('./db/resumen_snapshot.json', 'utf8'));
const proactivos = snapshot.data.resumen_general.proactivos || [];

const list = [
  'MARIA FERNANDA CARLOS VAZQUEZ',
  'SOFIA CAMPILLO VASCONCELOS',
  'MONSERRAT VELASCO SANTOS',
  'JOCELYN URIBE VARGAS',
  'SAMUEL NUÑO RIVERA',
  'ANA LAURA CONTRERAS IÑIGUEZ',
  'PAULINA RODRIGUEZ DE LA MORA',
  'HANA SOFIA LOPEZ QUIÑONEZ',
  'VELIA PATRICIA BERNAL RAMOS'
];

console.log('--- Checking Advisors listed by AI ---');
list.forEach(name => {
    const p = proactivos.find(row => row.ASESOR.toUpperCase().includes(name.toUpperCase()));
    if (p) {
        console.log(`Asesor: ${p.ASESOR} -> Al Mes: ${p.Proactivo_al_mes}, A Dic: ${p.Proactivo_a_Dic}, Faltantes: ${p['Pólizas_Faltantes']}, Faltantes Dic: ${p['Pólizas_Faltantes_Para_Dic']}`);
    } else {
        console.log(`Asesor: ${name} -> NOT FOUND in proactivos`);
    }
});
