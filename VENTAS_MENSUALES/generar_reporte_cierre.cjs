/**
 * Genera el JSON del "Cierre de Mes" (tabla grande + campeones por categoría)
 * a partir de la hoja "<MES>_CORREGIDO" del libro VENTAS MENSUALES.xlsx,
 * y lo publica en db/ventas_mensuales/latest.json para que el panel lo sirva.
 *
 * Uso:
 *   node generar_reporte_cierre.cjs AGOSTO
 *
 * El nombre del mes es en español y sin acentos (ENERO, FEBRERO, ... AGOSTO, ...).
 */
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const MESES_LABEL = {
    ENERO: 'Enero', FEBRERO: 'Febrero', MARZO: 'Marzo', ABRIL: 'Abril',
    MAYO: 'Mayo', JUNIO: 'Junio', JULIO: 'Julio', AGOSTO: 'Agosto',
    SEPTIEMBRE: 'Septiembre', OCTUBRE: 'Octubre', NOVIEMBRE: 'Noviembre', DICIEMBRE: 'Diciembre'
};

const mesArg = (process.argv[2] || '').trim().toUpperCase();
if (!mesArg || !MESES_LABEL[mesArg]) {
    console.error('❌ Uso: node generar_reporte_cierre.cjs <MES>  (ej: node generar_reporte_cierre.cjs AGOSTO)');
    process.exit(1);
}

const inputPath = path.join(__dirname, 'VENTAS MENSUALES.xlsx');
if (!fs.existsSync(inputPath)) {
    console.error(`❌ No se encontró el archivo: ${inputPath}`);
    process.exit(1);
}

const aliasPath = path.join(__dirname, 'alias_asesores.json');
let aliasMap = {};
if (fs.existsSync(aliasPath)) {
    const raw = JSON.parse(fs.readFileSync(aliasPath, 'utf-8'));
    for (const [k, v] of Object.entries(raw)) {
        if (k.startsWith('_')) continue;
        aliasMap[k.trim().toUpperCase()] = v;
    }
}

const wb = XLSX.readFile(inputPath);
const sheetName = wb.SheetNames.find(n => n.trim().toUpperCase() === `${mesArg}_CORREGIDO`);
if (!sheetName) {
    console.error(`❌ No se encontró la hoja "${mesArg}_CORREGIDO". Hojas disponibles: ${wb.SheetNames.join(', ')}`);
    process.exit(1);
}

const ws = wb.Sheets[sheetName];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

// --- Tabla principal (columnas A-G) ---
const tabla = [];
for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const nombre = String(r[0] || '').trim();
    if (!nombre) continue;
    tabla.push({
        asesor: nombre,
        polizas: Number(r[1]) || 0,
        vida: Number(r[2]) || 0,
        primaVida: Number(r[3]) || 0,
        gmm: Number(r[4]) || 0,
        primaGmm: Number(r[5]) || 0,
        primaTotal: Number(r[6]) || 0,
    });
}

// Totales calculados directamente de la tabla (siempre consistentes, no dependen
// de que el panel lateral I/J del Excel esté bien sumado a mano).
const totales = tabla.reduce((acc, a) => {
    acc.primaVida += a.primaVida;
    acc.polizasVida += a.vida;
    acc.primaGmm += a.primaGmm;
    acc.polizasGmm += a.gmm;
    acc.primaTotal += a.primaTotal;
    acc.polizasTotal += a.polizas;
    return acc;
}, { primaVida: 0, polizasVida: 0, primaGmm: 0, polizasGmm: 0, primaTotal: 0, polizasTotal: 0 });

// --- Campeones (columnas I/J = índices 8/9) ---
const CATEGORIAS = {
    'POLIZAS VIDA': { key: 'polizasVida', categoria: 'Pólizas Vida' },
    'PRIMA VIDA': { key: 'primaVida', categoria: 'Prima Vida' },
    'PRIMAS VIDA': { key: 'primaVida', categoria: 'Prima Vida' },
    'POLIZAS GMM': { key: 'polizasGmm', categoria: 'Pólizas GMM' },
    'PRIMA GMM': { key: 'primaGmm', categoria: 'Prima GMM' },
    'PRIMAS GMM': { key: 'primaGmm', categoria: 'Prima GMM' },
};

function resolverAsesor(apodo) {
    const limpio = String(apodo || '').trim();
    if (!limpio) return { nombre: null, raw: '' };
    const encontrado = aliasMap[limpio.toUpperCase()];
    return { nombre: encontrado || null, raw: limpio };
}

const campeonesPorCategoria = {}; // key -> { categoria, novato, profesional }
const sinResolver = [];

for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const etiqueta = String(r[8] || '').trim().toUpperCase();
    const valor = r[9];
    if (!etiqueta || etiqueta === 'CAMPEONES:' || etiqueta === 'CAMPEONES') continue;

    let nivel = null;
    let resto = etiqueta;
    if (etiqueta.startsWith('NOVATO ')) { nivel = 'novato'; resto = etiqueta.replace('NOVATO ', ''); }
    else if (etiqueta.startsWith('PRO ')) { nivel = 'profesional'; resto = etiqueta.replace('PRO ', ''); }
    if (!nivel) continue; // es una fila de totales (PRIMA VIDA, POLIZAS VIDA, etc), no de campeones

    const cat = CATEGORIAS[resto];
    if (!cat) {
        console.warn(`⚠️  Etiqueta de campeón no reconocida: "${etiqueta}" (revisa el layout de la hoja)`);
        continue;
    }

    if (!campeonesPorCategoria[cat.key]) {
        campeonesPorCategoria[cat.key] = { key: cat.key, categoria: cat.categoria, novato: null, profesional: null };
    }
    const ganador = resolverAsesor(valor);
    if (!ganador.nombre && ganador.raw) sinResolver.push(ganador.raw);
    campeonesPorCategoria[cat.key][nivel] = ganador;
}

const ORDEN_CATEGORIAS = ['polizasVida', 'primaVida', 'polizasGmm', 'primaGmm'];
const campeones = ORDEN_CATEGORIAS
    .filter(k => campeonesPorCategoria[k])
    .map(k => campeonesPorCategoria[k]);

const reporte = {
    mes: mesArg,
    mesLabel: `${MESES_LABEL[mesArg]} ${new Date().getFullYear()}`,
    generadoEn: new Date().toISOString(),
    tabla,
    totales,
    campeones,
};

const outDir = path.join(__dirname, '..', 'db', 'ventas_mensuales');
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'latest.json');
fs.writeFileSync(outPath, JSON.stringify(reporte, null, 2));

console.log(`✅ Reporte de Cierre de ${MESES_LABEL[mesArg]} generado: ${outPath}`);
console.log(`   Asesores en la tabla: ${tabla.length}`);
console.log(`   Categorías de campeones detectadas: ${campeones.length}`);
if ([...new Set(sinResolver)].length > 0) {
    console.warn(`⚠️  Apodos sin mapear en alias_asesores.json (agrégalos antes de publicar):`);
    [...new Set(sinResolver)].forEach(a => console.warn(`   - "${a}"`));
}
