import puppeteer from 'puppeteer-core';
import path from 'path';

async function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

async function run() {
    const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
    const pages = await browser.pages();
    let page = pages.find(p => p.url().includes('asesordeseguros.com.mx'));
    
    // Configurar descarga
    const downloadDir = path.join(process.cwd(), 'scratch', 'downloads');
    const client = await page.target().createCDPSession();
    await client.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: downloadDir });

    console.log('Clicking on Campañas in tree...');
    await page.evaluate(() => {
        const spans = Array.from(document.querySelectorAll('span.rtIn'));
        const camp = spans.find(s => s.innerText === 'Campañas');
        if (camp) camp.click();
    });
    
    await delay(5000); // Wait for grid to load

    console.log('Files in Campañas:');
    const files = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('tr.rgRow, tr.rgAltRow'));
        return rows.map(r => ({
            name: r.querySelector('span[id$="ItemName"]')?.innerText || '',
            id: r.id
        })).filter(f => f.name.includes('.xls'));
    });
    console.log(files);

    if (files.length > 0) {
        console.log(`Selecting file: ${files[0].name}`);
        await page.evaluate((rowId) => {
            const row = document.getElementById(rowId);
            if (row) row.click();
        }, files[0].id);
        
        await delay(2000);
        
        console.log('Clicking Download from DNN API...');
        await page.evaluate(() => {
            if (dnnModule && dnnModule.digitalAssets) {
                dnnModule.digitalAssets.download();
            }
        });
        
        console.log('Waiting for download...');
        await delay(10000);
    }
    
    browser.disconnect();
}

run().catch(console.error);
