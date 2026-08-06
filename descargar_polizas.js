import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// -- CONFIGURACIONES --
const isInactive = process.argv.includes('--inactivos');
const DOWNLOAD_DIRECTORY = isInactive 
    ? path.join(__dirname, 'estatus polizas', 'reportes', 'inactivos') 
    : path.join(__dirname, 'estatus polizas', 'reportes');

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

    console.log(`    📥 Extrayendo Página ${pageNum}...`);

    try {
        await page.waitForSelector('#ctl00_ContentPlaceHolder1_GVPolList', { timeout: 15000 });
        const rawHtml = await page.$eval('#ctl00_ContentPlaceHolder1_GVPolList', table => {
            let html = '<table border="1">';
            html += '<tr><th>No. Póliza</th><th>Contratante</th><th>Asegurado Principal</th><th>Producto</th><th>Estatus</th><th>E6</th><th>E7</th><th>E8</th><th>E9</th><th>E10</th><th>E11</th><th>E12</th></tr>';
            for(let row of table.rows) {
                // Ignore completely empty rows or the pager row
                if (!row.textContent || !row.textContent.trim()) continue;
                if (row.textContent.includes('1') && row.textContent.includes('2') && row.cells.length === 1) continue;
                
                html += '<tr>';
                for(let cell of row.cells) {
                    html += '<td>' + (cell.textContent || '').trim() + '</td>';
                }
                html += '</tr>';
            }
            html += '</table>';
            return html;
        });
        // Add meta charset to preserve UTF-8 like Ñ
        const htmlContent = '<html><meta charset="utf-8"><body>' + rawHtml + '</body></html>';
        
        const safeName = advNombre.replace(/[^a-zA-Z0-9]/g, '_');
        const newFileName = `${advClave}_${safeName}_P${pageNum}.xls`;
        const newPath = path.join(DOWNLOAD_DIRECTORY, newFileName);
        
        fs.writeFileSync(newPath, htmlContent);
        console.log(`    ✅ Guardado (Extracción DOM): ${newFileName}`);
        return true;
    } catch (e) {
        console.log(`    ⚠️ No se encontró la tabla de pólizas en pág ${pageNum}. Puede que no haya pólizas.`);
        return false;
    }
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

    // NUEVO: Seleccionar Activos o Inactivos
    if (isInactive) {
        console.log('🔘 Cambiando a vista de asesores INACTIVOS...');
        try {
            await page.waitForSelector('#ctl00_ContentPlaceHolder1_rdbStatus_1', { visible: true, timeout: 30000 });
            const wasChanged = await page.evaluate(() => {
                const rdb = document.querySelector('#ctl00_ContentPlaceHolder1_rdbStatus_1');
                if (rdb && !rdb.checked) { rdb.click(); return true; }
                return false;
            });
            if (wasChanged) await delay(10000); // Esperar post-carga AJAX solo si hubo cambio
            await page.waitForSelector('#ctl00_ContentPlaceHolder1_GVListAgents', { timeout: 15000 });
        } catch(e) { console.log('⚠️ No se pudo cambiar a Inactivos'); }
    } else {
        try { 
            const wasChanged = await page.evaluate(() => {
                const rdb = document.querySelector('#ctl00_ContentPlaceHolder1_rdbStatus_0');
                if (rdb && !rdb.checked) { rdb.click(); return true; }
                return false;
            });
            if (wasChanged) await delay(4000); 
            await page.waitForSelector('#ctl00_ContentPlaceHolder1_GVListAgents', { timeout: 15000 });
        } catch(e) {}
    }

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
    fs.writeFileSync(path.join(DOWNLOAD_DIRECTORY, 'lista_asesores.json'), JSON.stringify(asesores, null, 2));

    for (let i = 0; i < asesores.length; i++) {
        const adv = asesores[i];

        // Skip previously downloaded advisors
        const safeName = adv.nombre.replace(/[^a-zA-Z0-9]/g, '_');
        const filePattern = new RegExp(`${adv.clave}_${safeName}_P1\\.xls`);
        const existingFiles = fs.readdirSync(DOWNLOAD_DIRECTORY);
        if (existingFiles.some(f => filePattern.test(f))) {
            console.log(`\n⏭️ [${i + 1}/${asesores.length}] Saltando: ${adv.clave} - ${adv.nombre} (ya existe)`);
            continue;
        }

        console.log(`\n👤 [${i + 1}/${asesores.length}] Procesando: ${adv.clave} - ${adv.nombre}`);

        try {
            // --- ESTRATEGIA ROBUSTA (Sugerida por el usuario) ---
            // 1. Ir a la lista principal para resetear el estado y picarle a "Inactivos" cada vez
            // Esto asegura que la sesión del portal "recuerde" que estamos trabajando con inactivos
            await page.goto('https://www.lineamonterrey.com.mx/AsesoresWeb/Consultas/PolizasProm.aspx', { waitUntil: 'domcontentloaded', timeout: 60000 });
            
            if (isInactive) {
                // Seleccionar Inactivos radio button
                const inactiveRadio = '#ctl00_ContentPlaceHolder1_rdbStatus_1';
                await page.waitForSelector(inactiveRadio, { timeout: 10000 });
                await page.evaluate(() => {
                    const rdb = document.querySelector('#ctl00_ContentPlaceHolder1_rdbStatus_1');
                    if (rdb && !rdb.checked) rdb.click();
                });
                await delay(3000); // Esperar post-carga AJAX
            }

            // 2. IR AL ASESOR ESPECÍFICO
            const navUrl = `https://www.lineamonterrey.com.mx/AsesoresWeb/Consultas/Polizas/Asesor/PolizasAgente.aspx?vagente=${adv.clave}`;
            console.log(`    🔗 Navegando a: ${navUrl}`);
            await page.goto(navUrl, { waitUntil: 'domcontentloaded', timeout: 90000 });

            // Wait for grid to have data rows (excluding header)
            try {
                await page.waitForSelector('#ctl00_ContentPlaceHolder1_GVPolList tr.GridRow, #ctl00_ContentPlaceHolder1_GVPolList tr.GridAlternatingRow', { timeout: 15000 });
            } catch (e) {
                console.log('    ℹ️ No se detectaron pólizas en el grid (o tardó mucho).');
                // Tomar captura si sale vacío (opcional para debug)
            }


            // --- PAGINACIÓN COMPLETA (Soporta 50+ páginas con el "..." de ASP.NET) ---
            let currentPageNum = 1;

            while (true) {
                await downloadCurrentPage(page, adv.clave, adv.nombre, currentPageNum, botTempDir);

                const nextPageObj = await page.evaluate((currentNum) => {
                    const pagerRow = document.querySelector('#ctl00_ContentPlaceHolder1_GVPolList tr:last-child');
                    if (!pagerRow) return null;
                    const links = Array.from(pagerRow.querySelectorAll('a'));
                    if (links.length === 0) return null;

                    // 1. Buscar enlace directo para la siguiente página numérica
                    const nextDirect = links.find(a => parseInt(a.innerText.trim()) === currentNum + 1);
                    if (nextDirect) {
                        return { num: currentNum + 1, isEllipsis: false };
                    }

                    // 2. Si no hay directo pero hay un "..." o ">" al final, hacer clic para cargar el siguiente bloque de páginas
                    const ellipsisLinks = links.filter(a => a.innerText.trim() === '...' || a.innerText.trim() === '>');
                    if (ellipsisLinks.length > 0) {
                        return { num: currentNum + 1, isEllipsis: true };
                    }

                    return null;
                }, currentPageNum);

                if (!nextPageObj) {
                    console.log(`    ✅ Paginación completada para ${adv.nombre}. Total páginas descargadas: ${currentPageNum}`);
                    break;
                }

                console.log(`  🖱️ Cambiando a Página ${nextPageObj.num}...`);

                const textBefore = await page.evaluate(() => {
                    const r = document.querySelector('#ctl00_ContentPlaceHolder1_GVPolList tr.GridRow, #ctl00_ContentPlaceHolder1_GVPolList tr.GridAlternatingRow');
                    return r ? r.innerText : '';
                });

                const clicked = await page.evaluate((target) => {
                    const pagerRow = document.querySelector('#ctl00_ContentPlaceHolder1_GVPolList tr:last-child');
                    if (!pagerRow) return false;
                    const links = Array.from(pagerRow.querySelectorAll('a'));
                    if (target.isEllipsis) {
                        const ellipsis = links.filter(a => a.innerText.trim() === '...' || a.innerText.trim() === '>');
                        const lastEl = ellipsis[ellipsis.length - 1];
                        if (lastEl) { lastEl.click(); return true; }
                    } else {
                        const link = links.find(a => parseInt(a.innerText.trim()) === target.num);
                        if (link) { link.click(); return true; }
                    }
                    return false;
                }, nextPageObj);

                if (!clicked) {
                    console.log(`    ⚠️ No se pudo cambiar a la página ${nextPageObj.num}. Finalizando paginación.`);
                    break;
                }

                // Esperar a que la tabla cambie de contenido en AJAX
                await delay(2500);
                let waitRetries = 0;
                while (waitRetries < 10) {
                    const textAfter = await page.evaluate(() => {
                        const r = document.querySelector('#ctl00_ContentPlaceHolder1_GVPolList tr.GridRow, #ctl00_ContentPlaceHolder1_GVPolList tr.GridAlternatingRow');
                        return r ? r.innerText : '';
                    });
                    if (textAfter !== textBefore) break;
                    await delay(1000);
                    waitRetries++;
                }

                currentPageNum++;
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
