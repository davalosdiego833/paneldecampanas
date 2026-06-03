import puppeteer from 'puppeteer-core';
import path from 'path';

async function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

async function run() {
    console.log('Connecting to browser...');
    const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
    const pages = await browser.pages();
    let page = pages.find(p => p.url().includes('asesordeseguros.com.mx'));
    
    // Configurar la carpeta temporal para descargas
    const downloadDir = path.join(process.cwd(), 'tmp_descargas');
    const client = await page.target().createCDPSession();
    await client.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: downloadDir });

    console.log('Buscando carpeta "Campañas"...');
    
    // Find the row containing "Campañas"
    const campanasSelector = await page.evaluateHandle(() => {
        const rows = Array.from(document.querySelectorAll('tr.rgRow, tr.rgAltRow'));
        return rows.find(r => r.innerText.includes('Campañas'));
    });
    
    if (campanasSelector) {
        console.log('Haciendo doble clic en la carpeta Campañas...');
        await campanasSelector.focus();
        // Sometimes ASP.NET needs actual mouse events
        const boundingBox = await campanasSelector.boundingBox();
        if (boundingBox) {
            await page.mouse.click(boundingBox.x + 20, boundingBox.y + 10, { clickCount: 2 });
            await delay(4000); // Wait for grid to reload
            
            console.log('Revisando contenido de la carpeta Campañas...');
            const files = await page.evaluate(() => {
                const rows = Array.from(document.querySelectorAll('tr.rgRow, tr.rgAltRow'));
                return rows.map(r => r.innerText.replace(/\t|\n/g, ' ').trim()).filter(t => t.length > 0);
            });
            console.log('Archivos encontrados:', files);
            
            // Volver atrás para no romper el estado
            console.log('Volviendo atrás...');
            const backBtn = await page.evaluateHandle(() => {
                const rows = Array.from(document.querySelectorAll('tr.rgRow, tr.rgAltRow'));
                return rows.find(r => r.innerText.includes('..') || r.innerText.includes('Parent Folder'));
            });
            
            if (backBtn && backBtn.asElement()) {
                const bb = await backBtn.boundingBox();
                if (bb) await page.mouse.click(bb.x + 20, bb.y + 10, { clickCount: 2 });
                await delay(3000);
            }
        }
    } else {
        console.log('No se encontró la carpeta Campañas.');
    }
    
    browser.disconnect();
}

run().catch(console.error);
