import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
    const pages = await browser.pages();
    let page = pages.find(p => p.url().includes('lineamonterrey'));
    
    // Configurar descargas a temp_descarga igual que descargar_polizas.js
    const botTempDir = path.join(__dirname, 'estatus polizas', 'reportes', 'inactivos', 'temp_descarga');
    if (!fs.existsSync(botTempDir)) fs.mkdirSync(botTempDir, { recursive: true });
    
    const client = await page.target().createCDPSession();
    await client.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: botTempDir });

    console.log('Navigating to Joaquin (88060)...');
    await page.goto('https://www.lineamonterrey.com.mx/AsesoresWeb/Consultas/Polizas/Asesor/PolizasAgente.aspx?vagente=88060', { waitUntil: 'domcontentloaded' });
    
    await new Promise(r => setTimeout(r, 2000));
    const btnExcel = await page.evaluate(() => {
        const btn = document.querySelector('#ctl00_ContentPlaceHolder1_imgBtnExcel');
        if (btn) { btn.click(); return true; }
        return false;
    });

    if (btnExcel) {
        console.log('Click OK. Waiting for download...');
        let downloadedFile = null;
        for (let t = 0; t < 60; t++) { // Wait up to 30s
            const files = fs.readdirSync(botTempDir).filter(f => f.endsWith('.xls') || f.endsWith('.xlsx'));
            if (files.length > 0) {
                downloadedFile = files[0];
                break;
            }
            if (fs.readdirSync(botTempDir).filter(f => f.endsWith('.crdownload')).length > 0) {
                console.log('   (descargando...)');
            }
            await new Promise(r => setTimeout(r, 500));
        }
        if (downloadedFile) {
            console.log('Success!', downloadedFile);
            fs.unlinkSync(path.join(botTempDir, downloadedFile));
        } else {
            console.log('FAILED! No file arrived after 30s.');
        }
    } else {
        console.log('No Excel button found!');
    }

    process.exit(0);
}
main().catch(console.error);
