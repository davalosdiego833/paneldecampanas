import puppeteer from 'puppeteer-core';

async function run() {
    const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
    const pages = await browser.pages();
    let page = pages.find(p => p.url().includes('asesordeseguros.com.mx'));
    
    // Find all tree nodes
    const nodes = await page.evaluate(() => {
        const spans = Array.from(document.querySelectorAll('span.rtIn'));
        return spans.map(s => s.innerText.trim());
    });
    console.log('Tree nodes:', nodes);
    
    browser.disconnect();
}

run().catch(console.error);
