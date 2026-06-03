import puppeteer from 'puppeteer-core';

async function run() {
    const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
    const pages = await browser.pages();
    let page = pages.find(p => p.url().includes('asesordeseguros.com.mx'));
    
    const items = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'));
        return elements
            .filter(el => el.innerText && el.innerText.trim() === 'Campañas')
            .map(el => ({
                tag: el.tagName,
                className: el.className,
                id: el.id,
                onclick: el.getAttribute('onclick'),
                html: el.outerHTML.substring(0, 150)
            }));
    });
    
    console.log(JSON.stringify(items, null, 2));
    browser.disconnect();
}

run().catch(console.error);
