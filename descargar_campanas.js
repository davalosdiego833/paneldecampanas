import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import AdmZip from 'adm-zip';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CARPETAS_DESTINO = {
    'Campañas': [
        { regex: /camino/i, dir: 'camino_cumbre', hist: 'Camino a la Cumbre' },
        { regex: /vive/i, dir: 'vive_tu_pasion', hist: 'Vive tu pasion' }
        // Agrega otras campañas según necesites
    ],
    'Esparcimiento': [
        { regex: /convenciones.*asesor/i, dir: 'convenciones', hist: 'Convenciones' },
        { regex: /graduaci.*asesor/i, dir: 'graduacion', hist: 'Graduación' },
        { regex: /mdrt.*asesor/i, dir: 'mdrt', hist: 'MDRT' }
    ],
    'Informativos': [
        { regex: /proactivo/i, dir: path.join('administrador', 'proactivos'), hist: 'Proactivos' },
        { regex: /sin emisi/i, dir: path.join('administrador', 'asesores_sin_emision'), hist: 'Asesores sin emision' },
        { regex: /comparativo/i, dir: path.join('administrador', 'comparativo_vida'), hist: 'Comparativo Vida' }
    ],
    'Pagado Pendiente': [
        { regex: /pagpend/i, dir: path.join('administrador', 'pagado_emitidido'), hist: 'Pagado Pendiente' }
    ]
};

async function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

async function main() {
    const isCierre = process.argv.includes('--cierre');
    console.log('🚀 Iniciando robot descargador de Campañas...');
    if (isCierre) console.log('📁 MODO CIERRE ACTIVADO: Se guardará copia en el archivo histórico de tu Escritorio.');

    let browser;
    try {
        browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
    } catch (e) {
        console.error('❌ No se pudo conectar al navegador. Asegúrate de ejecutar: node lanzar_navegador.js');
        process.exit(1);
    }

    const pages = await browser.pages();
    let page = pages.find(p => p.url().includes('asesordeseguros.com.mx'));

    if (!page) {
        console.error('❌ No se encontró la pestaña del portal. Por favor inicia sesión y navega a "Reporte Promotor".');
        process.exit(1);
    }

    const downloadDir = path.join(__dirname, 'tmp_campanas');
    if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir, { recursive: true });

    // Limpiar carpeta temporal
    fs.readdirSync(downloadDir).forEach(f => fs.unlinkSync(path.join(downloadDir, f)));

    const client = await page.target().createCDPSession();
    await client.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: downloadDir });

    const carpetasDelPortal = Object.keys(CARPETAS_DESTINO);

    for (const nombreCarpeta of carpetasDelPortal) {
        console.log(`\n📂 Entrando a la carpeta: ${nombreCarpeta}`);
        
        // Clic en la carpeta en el menú izquierdo (Tree View)
        const success = await page.evaluate((folderName) => {
            const spans = Array.from(document.querySelectorAll('span.rtIn'));
            let target = spans.find(s => s.innerText.trim() === folderName);
            if (!target && folderName === 'Pagado Pendiente') {
                target = spans.find(s => s.innerText.trim().toUpperCase() === 'PAGADO Y EMITIDO' || s.innerText.trim().toUpperCase() === 'PAGADO PENDIENTE');
            }
            if (target) {
                target.click();
                return true;
            }
            return false;
        }, nombreCarpeta);

        if (!success) {
            console.log(`⚠️ No se encontró la carpeta "${nombreCarpeta}" en el menú.`);
            continue;
        }

        console.log('   ⏳ Esperando a que carguen los archivos...');
        await delay(5000); // Esperar a que la tabla se refresque por AJAX

        // Obtener archivos disponibles
        const archivos = await page.evaluate(() => {
            const rows = Array.from(document.querySelectorAll('tr.rgRow, tr.rgAltRow'));
            return rows.map(r => {
                const nameSpan = r.querySelector('span[id$="ItemName"]');
                return {
                    name: nameSpan ? nameSpan.innerText.trim() : '',
                    id: r.id
                };
            }).filter(f => f.name.match(/\.(xls|xlsx|xlsm|zip)$/i));
        });

        if (archivos.length === 0) {
            console.log('   ℹ️ La carpeta está vacía o no tiene archivos Excel/ZIP.');
            continue;
        }

        for (const archivo of archivos) {
            console.log(`   ⬇️ Seleccionando archivo: ${archivo.name}`);
            
            // Clic en la fila para seleccionar el archivo
            await page.evaluate((rowId) => {
                const row = document.getElementById(rowId);
                if (row) row.click();
            }, archivo.id);

            await delay(1500);

            // Limpiar tmp_campanas antes de iniciar la descarga
            fs.readdirSync(downloadDir).forEach(f => fs.unlinkSync(path.join(downloadDir, f)));

            // Clic en Descargar vía API de DigitalAssets
            console.log(`   ⏳ Iniciando descarga...`);
            await page.evaluate(() => {
                if (typeof dnnModule !== 'undefined' && dnnModule.digitalAssets) {
                    dnnModule.digitalAssets.download();
                }
            });

            // Esperar a que aparezca el archivo en la carpeta temporal
            let downloadedFile = null;
            let attempts = 0;
            while (attempts < 30) { // Max 30 segundos
                await delay(1000);
                const currentFiles = fs.readdirSync(downloadDir);
                downloadedFile = currentFiles.find(f => !f.endsWith('.crdownload') && !f.startsWith('.com.google.Chrome'));
                if (downloadedFile) break;
                attempts++;
            }

            if (downloadedFile) {
                console.log(`   ✅ Descargado exitosamente: ${downloadedFile}`);
                
                let fileToProcessPath = path.join(downloadDir, downloadedFile);
                let actualFileName = downloadedFile;

                // Descomprimir si es ZIP
                if (downloadedFile.toLowerCase().endsWith('.zip')) {
                    try {
                        const zip = new AdmZip(fileToProcessPath);
                        const zipEntries = zip.getEntries();
                        // Tomamos el primer excel que encontremos dentro del zip
                        const excelEntry = zipEntries.find(e => e.entryName.match(/\.(xls|xlsx|xlsm)$/i));
                        if (excelEntry) {
                            zip.extractEntryTo(excelEntry, downloadDir, false, true);
                            actualFileName = excelEntry.entryName;
                            fileToProcessPath = path.join(downloadDir, actualFileName);
                            console.log(`   📦 Descomprimido: ${actualFileName}`);
                        }
                    } catch (e) {
                        console.log(`   ❌ Error al descomprimir ${downloadedFile}: ${e.message}`);
                    }
                }

                // Mover archivo a su carpeta destino final
                let destinoRegla = null;
                const reglas = CARPETAS_DESTINO[nombreCarpeta];
                // Comparamos el regex contra el nombre del archivo ZIP original o el Excel extraído
                for (const regla of reglas) {
                    if (regla.regex.test(downloadedFile) || regla.regex.test(actualFileName)) {
                        destinoRegla = regla;
                        break;
                    }
                }

                if (destinoRegla) {
                    // 1. Acomodo para el Sitio Web
                    const finalDir = path.join(__dirname, destinoRegla.dir);
                    if (!fs.existsSync(finalDir)) fs.mkdirSync(finalDir, { recursive: true });
                    
                    // Limpiar archivos anteriores en la carpeta web (para que no haya duplicados ni basura)
                    fs.readdirSync(finalDir).forEach(f => {
                        if (f.endsWith('.xls') || f.endsWith('.xlsx') || f.endsWith('.xlsm')) {
                            fs.unlinkSync(path.join(finalDir, f));
                        }
                    });

                    const newPath = path.join(finalDir, actualFileName);
                    fs.copyFileSync(fileToProcessPath, newPath);
                    console.log(`   📁 Movido a Web: ${destinoRegla.dir}/${actualFileName}`);

                    // 2. Acomodo para el Archivo Histórico (solo si es cierre de mes)
                    if (isCierre) {
                        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                        const mesActual = meses[new Date().getMonth()];
                        const añoActual = new Date().getFullYear();
                        
                        // Ruta base histórica
                        const homeDir = process.env.HOME || process.env.USERPROFILE;
                        const historialDir = path.join(homeDir, 'Desktop', 'AVANCE DE CAMPAÑAS', destinoRegla.hist, String(añoActual));
                        if (!fs.existsSync(historialDir)) fs.mkdirSync(historialDir, { recursive: true });

                        const ext = path.extname(actualFileName);
                        const baseName = path.basename(actualFileName, ext);
                        const nombreHistorico = `${baseName}_${mesActual}_${añoActual}${ext}`;
                        
                        const histPath = path.join(historialDir, nombreHistorico);
                        fs.copyFileSync(fileToProcessPath, histPath);
                        console.log(`   📚 Guardado en Histórico: ${destinoRegla.hist}/${añoActual}/${nombreHistorico}`);
                    }
                } else {
                    console.log(`   ⚠️ No hay regla de carpeta local para este archivo. Se queda en tmp_campanas.`);
                }
            } else {
                console.log(`   ❌ Error: El archivo tardó demasiado en descargar.`);
            }
        }
    }

    // Limpiar tmp al final
    try {
        fs.readdirSync(downloadDir).forEach(f => fs.unlinkSync(path.join(downloadDir, f)));
        fs.rmdirSync(downloadDir);
    } catch(e) {}

    console.log('\n🔄 Consolidando localmente...');
    try {
        execSync('node actualizar_snapshot.js', { stdio: 'inherit' });
        console.log('✅ Consolidación local completada.');
    } catch (e) {
        console.error('❌ Error en consolidación local:', e.message);
    }

    console.log('\n🚀 Desplegando a producción...');
    try {
        execSync('./deploy.sh', { stdio: 'inherit' });
        console.log('✅ Despliegue completado.');
    } catch (e) {
        console.error('❌ Error en despliegue:', e.message);
    }

    console.log('\n🎉 ¡Proceso de descarga, consolidación y despliegue finalizado!');
    browser.disconnect();
}

main().catch(console.error);
