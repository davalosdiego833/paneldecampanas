import puppeteer from 'puppeteer-core';

async function main() {
    const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
    const pages = await browser.pages();
    const page = pages.find(p => p.url().includes('lineamonterrey') || p.url().includes('asesordeseguros'));
    if (!page) { console.log('No se encontró pestaña'); return; }
    await page.bringToFront();
    console.log('URL actual:', page.url());
    await page.screenshot({ path: 'scratch/portal_home.png', fullPage: false });
    console.log('Screenshot guardado.');
    browser.disconnect();
}
main().catch(e => console.error('ERROR:', e.message));
