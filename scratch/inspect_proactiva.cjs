const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', 'proactivatech', 'Proactivatech 2.0.xlsx');
const wb = XLSX.readFile(filePath);
const ws = wb.Sheets['ASESORES'];

const parsed = XLSX.utils.sheet_to_json(ws, { range: 6 });
const advisorsData = parsed.slice(1);

// Sort by ranking general ascending
advisorsData.sort((a, b) => Number(a.RANKING || 99999) - Number(b.RANKING || 99999));

console.log('Top 10 ranked advisors in the entire file:');
console.table(advisorsData.slice(0, 10).map(r => ({
    Clave: r.ASESOR,
    Matriz: r.MATRIZ,
    Polizas: r['PÓLIZAS'],
    Comisiones: r.COMISIONES,
    Ranking: r.RANKING
})));
