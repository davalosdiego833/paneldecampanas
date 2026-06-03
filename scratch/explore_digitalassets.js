import puppeteer from 'puppeteer-core';

async function run() {
    const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
    const pages = await browser.pages();
    let page = pages.find(p => p.url().includes('asesordeseguros.com.mx'));
    
    const apiInfo = await page.evaluate(() => {
        if (typeof dnnModule !== 'undefined' && dnnModule.digitalAssets) {
            return Object.keys(dnnModule.digitalAssets);
        }
        return 'Not found';
    });
    
    console.log('API methods available:', apiInfo);
    
    browser.disconnect();
}

run().catch(console.error);
