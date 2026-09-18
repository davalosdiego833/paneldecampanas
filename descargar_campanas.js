import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import AdmZip from 'adm-zip';
import { execSync } from 'child_process';
import XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPORTES_URL = 'https://www.asesordeseguros.com.mx/ComoVamos/Reportesdeventas/ReportePromotor.aspx?folderId=100&view=gridview&pageSize=10';

// Carpetas del portal que contienen archivos descargables (se ignora "Quién es quién")
const CARPETAS_PORTAL = ['Campañas', 'Esparcimiento', 'Informativos', 'Pagado Pendiente'];

// Reglas planas: se aplican al nombre del archivo descargado sin importar de qué
// carpeta del portal salió. `campaignKey` debe existir en campaignDates o fechas_corte
// del snapshot (db/resumen_snapshot.json) para poder comparar fechas de corte.
// `rename` fuerza el nombre final del archivo en destino (si no se da, se conserva el nombre descargado).
// `dateFrom: 'skip'` = no se puede saber la fecha sin desencriptar; siempre se copia y
// el propio actualizar_snapshot.js decide internamente si notifica.
const REGLAS = [
    { regex: /camino/i, dir: 'camino_cumbre', campaignKey: 'camino_cumbre', label: 'Camino a la Cumbre' },
    // Acepta con o sin acento (legión/centurión); excluye la variante "Managers" (otro reporte, sin pipeline propio)
    { regex: /(legi[oó]n|centuri[oó]n)(?!.*manager)/i, dir: 'legion_centurion', campaignKey: 'legion_centurion', label: 'Legión Centurión' },
    { regex: /graduaci.*asesor/i, dir: 'graduacion', campaignKey: 'graduacion', label: 'Graduación' },
    { regex: /mdrt.*asesor/i, dir: 'mdrt', campaignKey: 'mdrt', label: 'MDRT' },
    { regex: /convenciones.*promotor/i, dir: 'convenciones', rename: 'convenciones_promotores.xlsx', campaignKey: 'convenciones_promotores', label: 'Convención Promotoría', dateFrom: 'convenciones_promotores_b17' },
    { regex: /convenciones.*asesor/i, dir: 'convenciones', campaignKey: 'convenciones', label: 'Convención Asesores' },
    { regex: /educar.*convenci/i, dir: 'educar_es_creer', rename: 'Educar es Crecer Convenciones.xlsx', campaignKey: 'educar_es_creer', label: 'Educar es Creer (Convenciones)' },
    { regex: /educar.*(segubeca|client)/i, dir: 'educar_es_creer', rename: 'Educar es Crecer Segubeca Clientes.xlsx', campaignKey: 'educar_es_creer', label: 'Educar es Creer (Clientes)' },
    { regex: /poder.*elegirte.*convenci/i, dir: 'poder_elegirte', rename: 'El poder de elegirte Convenciones.xlsx', campaignKey: 'poder_elegirte', label: 'El Poder de Elegirte (Convenciones)' },
    { regex: /poder.*elegirte.*client/i, dir: 'poder_elegirte', rename: 'El Poder De Elegirte Clientes.xlsx', campaignKey: 'poder_elegirte', label: 'El Poder de Elegirte (Clientes)' },
    { regex: /pagpendrecluta|recluta.*temp/i, dir: path.join('administrador', 'pagado_emitido'), rename: 'PagPendReclutas.xls', campaignKey: 'pagado_pendiente_reclutas', label: 'Pagado/Pendiente (Reclutas)', dateFrom: 'skip' },
    { regex: /pagpend/i, dir: path.join('administrador', 'pagado_emitido'), rename: 'PagPend.xls', campaignKey: 'pagado_pendiente', label: 'Pagado/Pendiente', dateFrom: 'skip' },
    { regex: /proactivo/i, dir: path.join('administrador', 'proactivos'), campaignKey: 'proactivos', label: 'Proactivos' },
    { regex: /sin emisi/i, dir: path.join('administrador', 'asesores_sin_emision'), campaignKey: 'asesores_sin_emision', label: 'Asesores sin Emisión' },
    // Específico a "Comparativo Vida" — "Comparativo GMM" es un reporte distinto sin pipeline propio
    { regex: /comparativo.*vida/i, dir: path.join('administrador', 'comparativo_vida'), rename: 'Comparativo Vida.xlsm', campaignKey: 'comparativo_vida', label: 'Comparativo de Vida' }
];

async function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

const formatExcelDate = (val) => {
    const monthsNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    if (typeof val === 'number') {
        const d = XLSX.SSF.parse_date_code(val);
        if (d) {
            const year = d.y < 100 ? (d.y < 30 ? 2000 + d.y : 1900 + d.y) : d.y;
            return `${d.d} de ${monthsNames[d.m - 1]} de ${year}`;
        }
    }
    return String(val || '').trim();
};

const extractCutoffDateGeneric = (wb) => {
    for (let i = 0; i < Math.min(wb.SheetNames.length, 5); i++) {
        const ws = wb.Sheets[wb.SheetNames[i]];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1, range: 0 });
        for (let r = 0; r < 35; r++) {
            const row = data[r];
            if (!row) continue;
            for (const val of row) {
                if (!val) continue;
                if (typeof val === 'number' && val > 44000 && val < 50000) return formatExcelDate(val);
                const str = String(val);
                const match = str.match(/(\d{1,2}\s+(?:de\s+)?[a-záéíóúñA-ZÁÉÍÓÚÑ]{3,}\s+(?:de\s+)?\d{2,4})/i) || str.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
                if (match) return match[1].trim();
            }
        }
    }
    return '';
};

// Normaliza texto de fecha para comparar por día/mes/año reales, no por el texto
// literal (evita falsos "cambios" por formato: "11 de septiembre" vs "11 Septiembre",
// o meses abreviados "27 de AGO" vs "27 de agosto").
const MES_ABBR = {
    ene: 'enero', feb: 'febrero', mar: 'marzo', abr: 'abril', may: 'mayo', jun: 'junio',
    jul: 'julio', ago: 'agosto', sep: 'septiembre', set: 'septiembre', oct: 'octubre',
    nov: 'noviembre', dic: 'diciembre'
};
const quitarAcentos = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

const normalizarFecha = (str) => {
    if (!str) return '';
    let s = quitarAcentos(String(str).toLowerCase()).replace(/\s+/g, ' ').trim();
    s = s.replace(/\bde\b/g, ' ').replace(/\s+/g, ' ').trim();
    const m = s.match(/(\d{1,2})\s+([a-z]{3,})\s+(\d{2,4})/);
    if (!m) return s;
    const dia = String(parseInt(m[1], 10));
    let mes = m[2].slice(0, 3);
    mes = MES_ABBR[mes] || m[2];
    let anio = m[3];
    if (anio.length === 2) anio = (parseInt(anio, 10) < 30 ? '20' : '19') + anio;
    return `${dia}-${mes}-${anio}`;
};

const fechasIguales = (a, b) => {
    if (!a || !b) return false;
    return normalizarFecha(a) === normalizarFecha(b);
};

const extractConvencionesPromotoresDate = (filePath) => {
    const wb = XLSX.readFile(filePath, { sheets: ['Lineas Personales'] });
    const ws = wb.Sheets['Lineas Personales'];
    if (!ws) return '';
    const b17 = ws['B17'];
    if (b17 && b17.v) {
        const m = String(b17.v).match(/al\s+(.+)/i);
        return m ? m[1].replace(/\.\s*$/, '').trim() : String(b17.v).trim();
    }
    return '';
};

const extractCutoffDate = (regla, filePath) => {
    try {
        if (regla.dateFrom === 'convenciones_promotores_b17') return extractConvencionesPromotoresDate(filePath);
        const wb = XLSX.readFile(filePath);
        return extractCutoffDateGeneric(wb);
    } catch (e) {
        console.log(`      ⚠️ No se pudo leer fecha de corte: ${e.message}`);
        return null;
    }
};

const getLiveDates = () => {
    const snapPath = path.join(__dirname, 'db', 'resumen_snapshot.json');
    if (!fs.existsSync(snapPath)) return {};
    try {
        const snap = JSON.parse(fs.readFileSync(snapPath, 'utf-8'));
        const data = snap.data || snap;
        return { ...(data.campaignDates || {}), ...(data.fechas_corte || {}) };
    } catch (e) {
        return {};
    }
};

async function main() {
    console.log('🚀 Iniciando robot descargador de Campañas y Reportes Administrativos...');

    let browser;
    try {
        browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
    } catch (e) {
        console.error('❌ No se pudo conectar al navegador. Asegúrate de ejecutar: node lanzar_navegador.js');
        process.exit(1);
    }

    const pages = await browser.pages();
    let page = pages.find(p => p.url().includes('lineamonterrey') || p.url().includes('asesordeseguros'));

    if (!page) {
        console.error('❌ No se encontró ninguna pestaña logueada en el portal.');
        process.exit(1);
    }

    console.log('🧭 Navegando a Reportes de Ventas Promotor...');
    await page.bringToFront();
    await page.goto(REPORTES_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await delay(3000);

    const downloadDir = path.join(__dirname, 'tmp_campanas');
    if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir, { recursive: true });
    fs.readdirSync(downloadDir).forEach(f => fs.unlinkSync(path.join(downloadDir, f)));

    const client = await page.target().createCDPSession();
    await client.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: downloadDir });

    const liveDates = getLiveDates();
    const cambios = []; // { campaignKey, label, oldDate, newDate }
    const sinCambios = [];
    const sinRegla = [];
    const noComparables = []; // dateFrom === 'skip' (siempre se copian, el propio actualizar_snapshot.js decide si notifica)

    for (const nombreCarpeta of CARPETAS_PORTAL) {
        console.log(`\n📂 Entrando a la carpeta: ${nombreCarpeta}`);

        const success = await page.evaluate((folderName) => {
            const spans = Array.from(document.querySelectorAll('span.rtIn'));
            let target = spans.find(s => s.innerText.trim() === folderName);
            if (!target && folderName === 'Pagado Pendiente') {
                target = spans.find(s => s.innerText.trim().toUpperCase() === 'PAGADO Y EMITIDO' || s.innerText.trim().toUpperCase() === 'PAGADO PENDIENTE');
            }
            if (target) { target.click(); return true; }
            return false;
        }, nombreCarpeta);

        if (!success) {
            console.log(`⚠️ No se encontró la carpeta "${nombreCarpeta}" en el menú.`);
            continue;
        }

        console.log('   ⏳ Esperando a que carguen los archivos...');
        await delay(5000);

        const archivos = await page.evaluate(() => {
            const rows = Array.from(document.querySelectorAll('tr.rgRow, tr.rgAltRow'));
            return rows.map(r => {
                const nameSpan = r.querySelector('span[id$="ItemName"]');
                return { name: nameSpan ? nameSpan.innerText.trim() : '', id: r.id };
            }).filter(f => f.name.match(/\.(xls|xlsx|xlsm|zip)$/i));
        });

        if (archivos.length === 0) {
            console.log('   ℹ️ La carpeta está vacía o no tiene archivos Excel/ZIP.');
            continue;
        }

        for (const archivo of archivos) {
            const reglaPreliminar = REGLAS.find(r => r.regex.test(archivo.name));
            if (!reglaPreliminar) {
                sinRegla.push(archivo.name);
                console.log(`   ⏭️ Sin regla de destino, se ignora: ${archivo.name}`);
                continue;
            }

            console.log(`   ⬇️ Descargando: ${archivo.name}`);
            await page.evaluate((rowId) => {
                const row = document.getElementById(rowId);
                if (row) row.click();
            }, archivo.id);
            await delay(1500);

            fs.readdirSync(downloadDir).forEach(f => fs.unlinkSync(path.join(downloadDir, f)));

            await page.evaluate(() => {
                if (typeof dnnModule !== 'undefined' && dnnModule.digitalAssets) dnnModule.digitalAssets.download();
            });

            let downloadedFile = null;
            let attempts = 0;
            while (attempts < 30) {
                await delay(1000);
                const currentFiles = fs.readdirSync(downloadDir);
                downloadedFile = currentFiles.find(f => !f.endsWith('.crdownload') && !f.startsWith('.com.google.Chrome'));
                if (downloadedFile) break;
                attempts++;
            }

            if (!downloadedFile) {
                console.log(`   ❌ Error: "${archivo.name}" tardó demasiado en descargar.`);
                continue;
            }

            let fileToProcessPath = path.join(downloadDir, downloadedFile);
            let actualFileName = downloadedFile;

            if (downloadedFile.toLowerCase().endsWith('.zip')) {
                try {
                    const zip = new AdmZip(fileToProcessPath);
                    const excelEntry = zip.getEntries().find(e => e.entryName.match(/\.(xls|xlsx|xlsm)$/i));
                    if (excelEntry) {
                        zip.extractEntryTo(excelEntry, downloadDir, false, true);
                        actualFileName = excelEntry.entryName;
                        fileToProcessPath = path.join(downloadDir, actualFileName);
                    }
                } catch (e) {
                    console.log(`   ❌ Error al descomprimir ${downloadedFile}: ${e.message}`);
                    continue;
                }
            }

            const regla = REGLAS.find(r => r.regex.test(downloadedFile) || r.regex.test(actualFileName)) || reglaPreliminar;

            const finalDir = path.join(__dirname, regla.dir);
            if (!fs.existsSync(finalDir)) fs.mkdirSync(finalDir, { recursive: true });
            const finalName = regla.rename || actualFileName;
            const newPath = path.join(finalDir, finalName);

            if (regla.dateFrom === 'skip') {
                fs.copyFileSync(fileToProcessPath, newPath);
                noComparables.push(regla.label);
                console.log(`   📁 Copiado (se validará con el proceso completo): ${regla.dir}/${finalName}`);
                try { fs.unlinkSync(fileToProcessPath); } catch (e) {}
                continue;
            }

            const nuevaFecha = extractCutoffDate(regla, fileToProcessPath);
            const fechaActual = liveDates[regla.campaignKey] || '';

            if (nuevaFecha && !fechasIguales(nuevaFecha, fechaActual)) {
                fs.copyFileSync(fileToProcessPath, newPath);
                cambios.push({ campaignKey: regla.campaignKey, label: regla.label, oldDate: fechaActual || '(sin dato previo)', newDate: nuevaFecha });
                console.log(`   ✅ ACTUALIZADO: ${regla.label} — ${fechaActual || 'sin dato previo'} → ${nuevaFecha}`);
            } else {
                sinCambios.push({ label: regla.label, fecha: fechaActual || nuevaFecha || '(sin fecha)' });
                console.log(`   ⏸️ Sin cambios: ${regla.label} (sigue en ${fechaActual || nuevaFecha || 'fecha desconocida'}). Se borra la descarga.`);
            }

            try { fs.unlinkSync(fileToProcessPath); } catch (e) {}
        }
    }

    try {
        fs.readdirSync(downloadDir).forEach(f => fs.unlinkSync(path.join(downloadDir, f)));
        fs.rmdirSync(downloadDir);
    } catch (e) {}

    console.log('\n============================================================');
    console.log('📊 RESUMEN DE LA REVISIÓN');
    console.log('============================================================');
    if (cambios.length > 0) {
        console.log(`\n✅ ${cambios.length} archivo(s) con fecha de corte NUEVA:`);
        cambios.forEach(c => console.log(`   • ${c.label}: ${c.oldDate} → ${c.newDate}`));
    } else {
        console.log('\n✅ Ningún archivo con lógica de comparación directa cambió de fecha.');
    }
    if (noComparables.length > 0) {
        console.log(`\nℹ️ ${noComparables.length} archivo(s) copiados sin poder verificar fecha de antemano (se validan en el proceso completo): ${noComparables.join(', ')}`);
    }
    if (sinCambios.length > 0) {
        console.log(`\n⏸️ ${sinCambios.length} sin cambios (se borraron): ${sinCambios.map(s => s.label).join(', ')}`);
    }
    if (sinRegla.length > 0) {
        console.log(`\n⏭️ ${sinRegla.length} archivo(s) del portal ignorados (sin regla / campaña descontinuada): ${sinRegla.join(', ')}`);
    }

    if (cambios.length === 0 && noComparables.length === 0) {
        console.log('\n🎉 Todo está al día. No se procesó ni desplegó nada.');
        browser.disconnect();
        return;
    }

    console.log('\n🔄 Procesando snapshot local...');
    try {
        execSync('node actualizar_snapshot.js', { stdio: 'inherit' });
    } catch (e) {
        console.error('❌ Error en consolidación local:', e.message);
        browser.disconnect();
        return;
    }

    const dirByCampaignKey = {};
    REGLAS.forEach(r => { dirByCampaignKey[r.campaignKey] = r.dir; });
    const foldersToDeploy = new Set(cambios.map(c => dirByCampaignKey[c.campaignKey]).filter(Boolean));
    if (noComparables.length > 0) foldersToDeploy.add(path.join('administrador', 'pagado_emitido'));

    console.log(`\n🚀 Desplegando a producción: ${[...foldersToDeploy].join(', ')}`);
    try {
        execSync(`bash deploy_datos.sh ${[...foldersToDeploy].map(f => `"${f}"`).join(' ')}`, { stdio: 'inherit' });
    } catch (e) {
        console.error('❌ Error en despliegue:', e.message);
        browser.disconnect();
        return;
    }

    console.log('\n🔔 Enviando notificaciones de lo que cambió...');
    try {
        execSync('node actualizar_snapshot.js --notify', { stdio: 'inherit' });
    } catch (e) {
        console.error('❌ Error al notificar:', e.message);
    }

    console.log('\n🎉 ¡Proceso de revisión, actualización, despliegue y notificación finalizado!');
    browser.disconnect();
}

main().catch(console.error);
