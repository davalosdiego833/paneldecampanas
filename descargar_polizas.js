import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// -- CONFIGURACIONES --
const DOWNLOAD_DIRECTORY = path.join(__dirname, 'estatus polizas', 'reportes');

if (!fs.existsSync(DOWNLOAD_DIRECTORY)) {
    fs.mkdirSync(DOWNLOAD_DIRECTORY, { recursive: true });
}

async function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

async function getAvailablePages(page) {
    return await page.evaluate(() => {
        const pagerRow = document.querySelector('#ctl00_ContentPlaceHolder1_GVPolList tr:last-child');
        if (!pagerRow) return [];
        const links = Array.from(pagerRow.querySelectorAll('a'));
        const current = pagerRow.querySelector('span');

        let pages = [];
        if (current && !isNaN(parseInt(current.innerText))) {
            pages.push({ num: parseInt(current.innerText), active: true });
        }

        links.forEach(l => {
            const num = parseInt(l.innerText);
            if (!isNaN(num)) {
                pages.push({ num: num });
            }
        });

        return pages.map(p => p.num).sort((a, b) => a - b);
    });
}

async function downloadCurrentPage(page, advClave, advNombre, pageNum, botTempDir) {
    console.log(`    📥 Descargando Página ${pageNum}...`);

    // Limpiar temp
    if (fs.existsSync(botTempDir)) {
        const files = fs.readdirSync(botTempDir);
        for (const file of files) fs.unlinkSync(path.join(botTempDir, file));
    }

    const excelBtnSelector = '#ctl00_ContentPlaceHolder1_BtnImprimir';
    try {
        await page.waitForSelector(excelBtnSelector, { timeout: 15000 });
        await page.click(excelBtnSelector);
    } catch (e) {
        console.log(`    ⚠️ No se encontró botón Excel en pág ${pageNum}. Puede que no haya pólizas.`);
        return false;
    }

    let downloadedFileName = null;
    for (let checks = 0; checks < 60; checks++) { // 30 seg
        await delay(500);
        const files = fs.readdirSync(botTempDir);
        if (files.length > 0 && !files.find(f => f.endsWith('.crdownload'))) {
            downloadedFileName = files[0];
            break;
        }
    }

    if (!downloadedFileName) {
        console.log(`    ⚠️ Tiempo agotado para descarga.`);
        return false;
    }

    const safeName = advNombre.replace(/[^a-zA-Z0-9]/g, '_');
    const newFileName = `${advClave}_${safeName}_P${pageNum}.xls`;
    const oldPath = path.join(botTempDir, downloadedFileName);
    const newPath = path.join(DOWNLOAD_DIRECTORY, newFileName);
    fs.renameSync(oldPath, newPath);
    console.log(`    ✅ Guardado: ${newFileName}`);
    return true;
}

async function main() {
    console.log('🚀 Iniciando descarga de pólizas (Direct Navigation Mode)...');

    const browser = await puppeteer.connect({
        browserURL: 'http://127.0.0.1:9222',
        defaultViewport: null
    });

    const pages = await browser.pages();
    let page = pages.find(p => p.url().includes('lineamonterrey') || p.url().includes('asesordeseguros'));

    if (!page) {
        console.error('❌ No se encontró una pestaña activa de Linea Monterrey. Por favor, abre el portal e inicia sesión.');
        process.exit(1);
    }

    const botTempDir = path.join(DOWNLOAD_DIRECTORY, 'temp_descarga');
    if (!fs.existsSync(botTempDir)) fs.mkdirSync(botTempDir, { recursive: true });

    // --- LIMPIEZA INICIAL ---
    // Mover archivos anteriores a una carpeta de 'respaldo_previo' para forzar una descarga completa y limpia de hoy
    const backupDir = path.join(DOWNLOAD_DIRECTORY, 'respaldo_previo');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

    const countFiles = fs.readdirSync(DOWNLOAD_DIRECTORY).filter(f => f.endsWith('.xls')).length;
    if (countFiles > 0) {
        console.log(`📦 Respaldando ${countFiles} archivos XLS previos para forzar descarga limpia...`);
        fs.readdirSync(DOWNLOAD_DIRECTORY).forEach(f => {
            if (f.endsWith('.xls')) {
                try { fs.renameSync(path.join(DOWNLOAD_DIRECTORY, f), path.join(backupDir, f)); } catch (e) { }
            }
        });
    }

    const client = await page.target().createCDPSession();
    await client.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: botTempDir });

    console.log('🔗 Verificando página inicial y obteniendo lista...');

    // Always start by going to the main list to get the freshest advisor keys
    await page.goto('https://www.lineamonterrey.com.mx/AsesoresWeb/Consultas/PolizasProm.aspx', { waitUntil: 'domcontentloaded', timeout: 90000 }).catch(() => { });
    await delay(3000);

    const asesores = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('#ctl00_ContentPlaceHolder1_GVListAgents tr.GridRow, #ctl00_ContentPlaceHolder1_GVListAgents tr.GridAlternatingRow'));
        return rows.map(r => {
            const cells = r.querySelectorAll('td');
            return {
                nombre: cells[0] ? cells[0].innerText.trim() : '',
                clave: cells[1] ? cells[1].innerText.trim() : ''
            };
        }).filter(a => {
            const upper = a.nombre.toUpperCase();
            // Solo excluimos el nombre exacto de la promotoría si aparece como cuenta genérica,
            // pero NO a los asesores individuales (aunque se apelliden Ambriz o Davalos)
            const esCuentaGenerica = upper === 'AMBRIZ Y DAVALOS' || upper === 'AMBRIZ Y DAVALOS S.C.' || upper.includes('PROMOTORIA');
            return a.nombre && a.clave && !esCuentaGenerica;
        });
    });

    console.log(`📋 Encontrados ${asesores.length} asesores para procesar.`);

    for (let i = 0; i < asesores.length; i++) {
        const adv = asesores[i];

        // Skip previously downloaded advisors
        const safeName = adv.nombre.replace(/[^a-zA-Z0-9]/g, '_');
        const filePattern = new RegExp(`${adv.clave}_${safeName}_P1\\.xls`);
        const existingFiles = fs.readdirSync(DOWNLOAD_DIRECTORY);
        if (existingFiles.some(f => filePattern.test(f))) {
            console.log(`\n⏭️ [${i + 1}/${asesores.length}] Saltando: ${adv.clave} - ${adv.nombre} (ya existen archivos cruzados)`);
            continue;
        }

        console.log(`\n👤 [${i + 1}/${asesores.length}] Procesando: ${adv.clave} - ${adv.nombre}`);

        try {
            // DIRECT NAVIGATION! By bypassing UI clicks we avoid huge timeouts
            const navUrl = `https://www.lineamonterrey.com.mx/AsesoresWeb/Consultas/Polizas/Asesor/PolizasAgente.aspx?vagente=${adv.clave}`;
            console.log(`    🔗 Navegando directo a la póliza...`);
            await page.goto(navUrl, { waitUntil: 'domcontentloaded', timeout: 90000 });

            // Wait for grid to have data rows (excluding header)
            try {
                await page.waitForSelector('#ctl00_ContentPlaceHolder1_GVPolList tr.GridRow, #ctl00_ContentPlaceHolder1_GVPolList tr.GridAlternatingRow', { timeout: 15000 });
            } catch (e) {
                console.log('    ℹ️ No se detectaron pólizas en el grid (o tardó mucho). Intentando descargar de todas formas.');
            }

            const pageNumbers = await getAvailablePages(page);
            if (pageNumbers.length === 0) {
                await downloadCurrentPage(page, adv.clave, adv.nombre, 1, botTempDir);
            } else {
                console.log(`  📄 Detectadas ${pageNumbers.length} páginas.`);

                for (let pIdx = 0; pIdx < pageNumbers.length; pIdx++) {
                    const pNum = pageNumbers[pIdx];

                    if (pNum > 1) {
                        console.log(`  🖱️ Cambiando a Página ${pNum}...`);
                        await page.evaluate((targetNum) => {
                            const pagerRow = document.querySelector('#ctl00_ContentPlaceHolder1_GVPolList tr:last-child');
                            const links = Array.from(pagerRow.querySelectorAll('a'));
                            const link = links.find(a => a.innerText == targetNum);
                            if (link) link.click();
                        }, pNum);

                        // Wait for update (Grid content should change)
                        await delay(5000);
                        try {
                            await page.waitForSelector('#ctl00_ContentPlaceHolder1_GVPolList', { timeout: 10000 });
                        } catch (e) { }
                    }

                    const success = await downloadCurrentPage(page, adv.clave, adv.nombre, pNum, botTempDir);
                    if (!success) {
                        console.log(`    ⚠️ Reintentando descarga de Página ${pNum}...`);
                        await delay(3000);
                        await downloadCurrentPage(page, adv.clave, adv.nombre, pNum, botTempDir);
                    }
                }
            }

        } catch (err) {
            console.error(`  ❌ Error con ${adv.nombre}:`, err.message);
            await delay(5000);
        }
    }

    console.log('\n✨ Proceso de descarga completado.');
    process.exit(0);
}

main().catch(console.error);
