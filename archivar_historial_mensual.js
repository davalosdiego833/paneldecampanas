import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Carpeta real donde Diego ya archiva manualmente el histórico de campañas.
const DESTINO_BASE = '/Users/diego/Desktop/AVANCE DE CAMPAÑAS';
const SNAPSHOT_PATH = path.join(__dirname, 'db', 'resumen_snapshot.json');

const MESES = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO',
               'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
// Nombre completo primero (para no confundir "mar" con "marzo" a medias) y
// luego abreviaturas de 3 letras — las fechas del snapshot usan ambas formas
// ("11 de septiembre de 2026", "27 de AGO de 2026").
const MESES_PATRONES = [
    ['ENERO', /enero/i], ['FEBRERO', /febrero/i], ['MARZO', /marzo/i], ['ABRIL', /abril/i],
    ['MAYO', /mayo/i], ['JUNIO', /junio/i], ['JULIO', /julio/i], ['AGOSTO', /agosto/i],
    ['SEPTIEMBRE', /septiembre|setiembre/i], ['OCTUBRE', /octubre/i], ['NOVIEMBRE', /noviembre/i], ['DICIEMBRE', /diciembre/i],
    ['ENERO', /\bene\b/i], ['FEBRERO', /\bfeb\b/i], ['MARZO', /\bmar\b/i], ['ABRIL', /\babr\b/i],
    ['MAYO', /\bmay\b/i], ['JUNIO', /\bjun\b/i], ['JULIO', /\bjul\b/i], ['AGOSTO', /\bago\b/i],
    ['SEPTIEMBRE', /\bsep(t)?\b/i], ['OCTUBRE', /\boct\b/i], ['NOVIEMBRE', /\bnov\b/i], ['DICIEMBRE', /\bdic\b/i],
];

/** Extrae {mes: 'SEPTIEMBRE', anio: '2026'} de un texto tipo "11 de septiembre de 2026"
 *  o "27 de AGO de 2026". Devuelve null si no se reconoce nada. */
function extraerMesAnio(fechaTexto) {
    if (!fechaTexto) return null;
    const anioMatch = String(fechaTexto).match(/\b(20\d{2})\b/);
    const anio = anioMatch ? anioMatch[1] : null;
    for (const [nombre, patron] of MESES_PATRONES) {
        if (patron.test(fechaTexto)) return { mes: nombre, anio: anio || String(new Date().getFullYear()) };
    }
    return null;
}

function cargarSnapshot() {
    if (!fs.existsSync(SNAPSHOT_PATH)) return { campaignDates: {}, fechas_corte: {} };
    const raw = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf-8'));
    return {
        campaignDates: raw?.data?.campaignDates || {},
        fechas_corte: raw?.data?.fechas_corte || {},
    };
}

// Temporada de Convenciones (ciclo Jul-Jun), calculada a partir del mes/año
// REAL de cierre de esa campaña, no de la fecha en que se corre el script.
function temporadaConvenciones(mesNombre, anio) {
    const mesNum = MESES.indexOf(mesNombre) + 1; // 1-12
    const anioNum = parseInt(anio, 10);
    return mesNum >= 7 ? `${anioNum}-${anioNum + 1}` : `${anioNum - 1}-${anioNum}`;
}

function elegirArchivo(carpetaAbs, patrones) {
    if (!fs.existsSync(carpetaAbs)) return null;
    const archivos = fs.readdirSync(carpetaAbs).filter(f => !f.startsWith('.') && !f.startsWith('~$'));
    for (const patron of patrones) {
        const encontrado = archivos.find(f => patron.test(f));
        if (encontrado) return encontrado;
    }
    return null;
}

function copiarArchivo(origenAbs, destinoCarpetaAbs, nombreDestinoSinExt) {
    const ext = path.extname(origenAbs);
    fs.mkdirSync(destinoCarpetaAbs, { recursive: true });
    const destinoPath = path.join(destinoCarpetaAbs, `${nombreDestinoSinExt}${ext}`);
    fs.copyFileSync(origenAbs, destinoPath);
    return destinoPath;
}

function main() {
    const { campaignDates, fechas_corte } = cargarSnapshot();
    console.log(`\n🗄️  Archivando en "AVANCE DE CAMPAÑAS" (usando la fecha de cierre real de cada reporte)...\n`);

    // Cada entrada: de dónde sacar el archivo local, cómo elegirlo si hay varios,
    // en qué llave del snapshot está su fecha de corte real, y a qué carpeta va.
    const MAPEO = [
        { origen: 'camino_cumbre', patrones: [/camino/i], claveFecha: campaignDates.camino_cumbre, destino: (m) => path.join(DESTINO_BASE, 'CC', m.anio) },
        { origen: 'legion_centurion', patrones: [/legion|centurion/i], claveFecha: campaignDates.legion_centurion, destino: (m) => path.join(DESTINO_BASE, 'LEGION', m.anio) },
        { origen: 'graduacion', patrones: [/graduaci/i], claveFecha: campaignDates.graduacion, destino: (m) => path.join(DESTINO_BASE, 'GRADUACION', m.anio) },
        { origen: 'mdrt', patrones: [/mdrt.*\.xlsm$/i], claveFecha: campaignDates.mdrt, destino: (m) => path.join(DESTINO_BASE, 'MDRT', m.anio) },
        { origen: path.join('administrador', 'proactivos'), patrones: [/proactivo/i], claveFecha: fechas_corte.proactivos, destino: (m) => path.join(DESTINO_BASE, 'PROMO', 'proactivos', m.anio) },
        { origen: path.join('administrador', 'asesores_sin_emision'), patrones: [/\.xls$/i, /.*/], claveFecha: fechas_corte.asesores_sin_emision, destino: (m) => path.join(DESTINO_BASE, 'PROMO', 'asesores sin emision', m.anio) },
        { origen: path.join('administrador', 'comparativo_vida'), patrones: [/comparativo/i], claveFecha: fechas_corte.comparativo_vida, destino: (m) => path.join(DESTINO_BASE, 'PROMO', 'comparativo vida', m.anio) },
        // Confirmado con Diego: el crudo (PagPend.xls), no el procesado.
        { origen: path.join('administrador', 'pagado_emitido'), patrones: [/^PagPend\.xls$/i], claveFecha: fechas_corte.pagado_pendiente, destino: (m) => path.join(DESTINO_BASE, 'PROMO', 'PAG & EMI', m.anio) },
    ];

    for (const item of MAPEO) {
        const mesInfo = extraerMesAnio(item.claveFecha);
        if (!mesInfo) {
            console.log(`   ⏸️  ${item.origen} — sin fecha de cierre reconocible (valor: ${item.claveFecha || 'ninguno'}), no se archiva`);
            continue;
        }
        const carpetaAbs = path.join(__dirname, item.origen);
        const archivo = elegirArchivo(carpetaAbs, item.patrones);
        if (!archivo) {
            console.log(`   ⏸️  ${item.origen} — sin archivo local que archivar`);
            continue;
        }
        const destinoPath = copiarArchivo(path.join(carpetaAbs, archivo), item.destino(mesInfo), mesInfo.mes);
        console.log(`   ✅ ${item.origen}/${archivo} (cierre: ${item.claveFecha}) → ${destinoPath.replace(DESTINO_BASE + '/', '')}`);
    }

    // --- Convenciones: Asesores y Promotoría, cada una con SU PROPIA fecha de cierre ---
    const convencionesDir = path.join(__dirname, 'convenciones');
    if (fs.existsSync(convencionesDir)) {
        const archivos = fs.readdirSync(convencionesDir).filter(f => !f.startsWith('.') && !f.startsWith('~$'));
        const promotor = archivos.find(f => /promotor/i.test(f));
        const asesor = archivos.find(f => !/promotor/i.test(f));

        const mesAsesor = extraerMesAnio(campaignDates.convenciones);
        if (asesor && mesAsesor) {
            const temporada = temporadaConvenciones(mesAsesor.mes, mesAsesor.anio);
            const destinoPath = copiarArchivo(
                path.join(convencionesDir, asesor),
                path.join(DESTINO_BASE, 'CONVENCIONES', mesAsesor.anio, temporada, 'ASESORES'),
                mesAsesor.mes,
            );
            console.log(`   ✅ convenciones/${asesor} (cierre: ${campaignDates.convenciones}) → ${destinoPath.replace(DESTINO_BASE + '/', '')}`);
        } else {
            console.log(`   ⏸️  convenciones (Asesores) — no se archivó (archivo: ${asesor || 'ninguno'}, fecha: ${campaignDates.convenciones || 'ninguna'})`);
        }

        const mesPromotor = extraerMesAnio(campaignDates.convenciones_promotores);
        if (promotor && mesPromotor) {
            const temporada = temporadaConvenciones(mesPromotor.mes, mesPromotor.anio);
            const destinoPath = copiarArchivo(
                path.join(convencionesDir, promotor),
                path.join(DESTINO_BASE, 'CONVENCIONES', mesPromotor.anio, temporada, 'PROMO'),
                mesPromotor.mes,
            );
            console.log(`   ✅ convenciones/${promotor} (cierre: ${campaignDates.convenciones_promotores}) → ${destinoPath.replace(DESTINO_BASE + '/', '')}`);
        } else {
            console.log(`   ⏸️  convenciones (Promotoría) — no se archivó (archivo: ${promotor || 'ninguno'}, fecha: ${campaignDates.convenciones_promotores || 'ninguna'})`);
        }
    } else {
        console.log('   ⏸️  convenciones — carpeta origen no existe');
    }

    console.log(`\n📁 Archivado en: ${DESTINO_BASE}`);
    console.log('   (Educar es Creer y El Poder de Elegirte NO se archivan por ahora, según lo acordado)');
}

main();
