import puppeteer from 'puppeteer-core';

async function main() {
    const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
    const pages = await browser.pages();
    const page = pages.find(p => p.url().includes('asesordeseguros.com.mx/Home.aspx'));
    if (!page) { console.log('No se encontró pestaña de home'); return; }
    await page.bringToFront();

    const clicked = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a'));
        const target = links.find(a => a.innerText.trim().toLowerCase().includes('campañas de venta'));
        if (target) { target.click(); return true; }
        return false;
    });
    console.log('Click en "Campañas de venta":', clicked);
    await new Promise(r => setTimeout(r, 4000));
    console.log('Nueva URL:', page.url());
    await page.screenshot({ path: 'scratch/portal_campanas.png' });
    console.log('Screenshot guardado.');
    browser.disconnect();
}
main().catch(e => console.error('ERROR:', e.message));
