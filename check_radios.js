import puppeteer from 'puppeteer-core';
async function main() {
    const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
    const pages = await browser.pages();
    let page = pages.find(p => p.url().includes('lineamonterrey.com.mx/AsesoresWeb/Consultas/PolizasProm.aspx'));
    
    if (!page) {
        console.log('No PolizasProm tab found. Found urls:', pages.map(p => p.url()));
        process.exit(1);
    }

    const radios = await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('input[type="radio"]'));
        return inputs.map(i => ({
            id: i.id,
            name: i.name,
            checked: i.checked,
            labelText: i.nextElementSibling?.innerText || i.parentElement?.innerText
        }));
    });

    console.log('Radio buttons found:', JSON.stringify(radios, null, 2));
    process.exit(0);
}
main().catch(console.error);
