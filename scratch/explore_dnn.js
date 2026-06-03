import puppeteer from 'puppeteer-core';

async function run() {
    const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
    const pages = await browser.pages();
    let page = pages.find(p => p.url().includes('asesordeseguros.com.mx'));
    
    console.log(`Analyzing page: ${page.url()}`);

    const items = await page.evaluate(() => {
        // En DNN DigitalAssets, los folders y archivos suelen estar en una tabla con id que contiene Grid
        const cells = Array.from(document.querySelectorAll('td, span.dnnDropText, .dnnGridItem, .dnnGridAltItem, .ItemName'));
        return cells.map(c => c.innerText.trim()).filter(t => t.length > 0);
    });
    
    // remove duplicates and short strings
    const uniqueItems = [...new Set(items)].filter(i => i.length > 3);
    console.log(`Found ${uniqueItems.length} unique items. Interesting ones:`);
    
    const keywords = ['campa', 'esparcimiento', 'informa', 'pagado', 'camino', 'mdrt', 'gradua', 'proactivo'];
    
    uniqueItems.forEach(text => {
        const textLower = text.toLowerCase();
        if (keywords.some(k => textLower.includes(k))) {
            console.log(`-> "${text}"`);
        }
    });

    browser.disconnect();
}

run().catch(console.error);
