import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import AdmZip from 'adm-zip';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CARPETAS_DESTINO = {
    'Informativos': [
        { regex: /proactivo/i, dir: path.join('administrador', 'proactivos'), hist: 'Proactivos' },
        { regex: /sin emisi/i, dir: path.join('administrador', 'asesores_sin_emision'), hist: 'Asesores sin emision' },
        { regex: /comparativo/i, dir: path.join('administrador', 'comparativo_vida'), hist: 'Comparativo Vida' }
    ]
};

async function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

async function main() {
    console.log('🚀 Iniciando robot descargador de Reportes Administrativos...');

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
    
    const tmpAdminDir = path.join(__dirname, 'tmp_admin');
    if (!fs.existsSync(tmpAdminDir)) fs.mkdirSync(tmpAdminDir, { recursive: true });

    // Limpiar directorios
    fs.readdirSync(downloadDir).forEach(f => fs.unlinkSync(path.join(downloadDir, f)));
    fs.readdirSync(tmpAdminDir).forEach(f => fs.unlinkSync(path.join(tmpAdminDir, f)));

    const client = await page.target().createCDPSession();
    await client.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: downloadDir });

    const carpetasDelPortal = Object.keys(CARPETAS_DESTINO);

    for (const nombreCarpeta of carpetasDelPortal) {
        console.log(`\n📂 Entrando a la carpeta: ${nombreCarpeta}`);
        
        const success = await page.evaluate((folderName) => {
            const spans = Array.from(document.querySelectorAll('span.rtIn'));
            const target = spans.find(s => s.innerText.trim() === folderName);
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
        await delay(5000);

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
            
            await page.evaluate((rowId) => {
                const row = document.getElementById(rowId);
                if (row) row.click();
            }, archivo.id);

            await delay(1500);
            fs.readdirSync(downloadDir).forEach(f => fs.unlinkSync(path.join(downloadDir, f)));

            console.log(`   ⏳ Iniciando descarga...`);
            await page.evaluate(() => {
                if (typeof dnnModule !== 'undefined' && dnnModule.digitalAssets) {
                    dnnModule.digitalAssets.download();
                }
            });

            let downloadedFile = null;
            let attempts = 0;
            while (attempts < 60) {
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

                if (downloadedFile.toLowerCase().endsWith('.zip')) {
                    try {
                        const zip = new AdmZip(fileToProcessPath);
                        const zipEntries = zip.getEntries();
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

                // Movemos a tmp_admin para procesamiento con python
                const tmpAdminPath = path.join(tmpAdminDir, actualFileName);
                fs.copyFileSync(fileToProcessPath, tmpAdminPath);
            }
        }
    }
    
    console.log('\n🐍 Ejecutando script de limpieza y desencriptado en Python...');
    try {
        const pythonScript = path.join(__dirname, 'scripts', 'clean_admin_reports.py');
        execSync(`"${path.join(__dirname, '.venv', 'bin', 'python3')}" "${pythonScript}"`, { stdio: 'inherit' });
    } catch (e) {
        console.error('❌ Error ejecutando python:', e.message);
    }

    console.log('\n📁 Moviendo archivos limpios a sus carpetas finales...');
    const procesados = fs.readdirSync(tmpAdminDir);
    for (const file of procesados) {
        if(file.endsWith('.xls') || file.endsWith('.xlsx') || file.endsWith('.xlsm')) {
            let destinoRegla = null;
            for (const regla of CARPETAS_DESTINO['Informativos']) {
                if (regla.regex.test(file)) {
                    destinoRegla = regla;
                    break;
                }
            }
            if (destinoRegla) {
                const finalDir = path.join(__dirname, destinoRegla.dir);
                if (!fs.existsSync(finalDir)) fs.mkdirSync(finalDir, { recursive: true });
                
                fs.readdirSync(finalDir).forEach(f => {
                    if (f.endsWith('.xls') || f.endsWith('.xlsx') || f.endsWith('.xlsm')) {
                        fs.unlinkSync(path.join(finalDir, f));
                    }
                });

                const newPath = path.join(finalDir, file);
                fs.copyFileSync(path.join(tmpAdminDir, file), newPath);
                console.log(`   ✅ Guardado: ${destinoRegla.dir}/${file}`);
            }
        }
    }

    try {
        fs.readdirSync(downloadDir).forEach(f => fs.unlinkSync(path.join(downloadDir, f)));
        fs.readdirSync(tmpAdminDir).forEach(f => fs.unlinkSync(path.join(tmpAdminDir, f)));
    } catch(e) {}
    
    console.log('\n🎉 ¡Proceso finalizado!');
    browser.disconnect();
}
main().catch(console.error);
