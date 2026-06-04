import puppeteer from 'puppeteer-core';
async function main() {
    const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
    const pages = await browser.pages();
    let page = pages.find(p => p.url().includes('asesordeseguros.com.mx'));
    if (!page) { console.error('Página no encontrada'); process.exit(1); }
    const folders = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('span.rtIn')).map(s => s.innerText.trim());
    });
    console.log(folders);
    browser.disconnect();
}
main().catch(console.error);
