import puppeteer from 'puppeteer-core';

async function main() {
    const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
    const pages = await browser.pages();
    console.log(`Total de pestañas abiertas: ${pages.length}`);
    for (let i = 0; i < pages.length; i++) {
        const p = pages[i];
        console.log(`\n--- Pestaña ${i} ---`);
        console.log('URL:', p.url());
        try {
            const title = await p.title();
            console.log('Título:', title);
        } catch (e) {
            console.log('Error obteniendo título:', e.message);
        }
    }
    browser.disconnect();
}
main().catch(e => console.error('ERROR:', e.message));
