import puppeteer from 'puppeteer-core';
async function main() {
    const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
    const pages = await browser.pages();
    let page = pages.find(p => p.url().includes('lineamonterrey'));
    
    // Choose someone the user might have seen. Let's do Selina.
    console.log('Navigating to Selina (21615)...');
    await page.goto('https://www.lineamonterrey.com.mx/AsesoresWeb/Consultas/Polizas/Asesor/PolizasAgente.aspx?vagente=21615', { waitUntil: 'domcontentloaded' });
    
    // Check grid BEFORE any Ramo
    const countBefore = await page.evaluate(() => {
        const rows = document.querySelectorAll('#ctl00_ContentPlaceHolder1_GVPolList tr.GridRow, #ctl00_ContentPlaceHolder1_GVPolList tr.GridAlternatingRow');
        return rows.length;
    });
    console.log(`-> Encontradas ${countBefore} polizas ANTES de seleccionar Ramo`);
    
    const options = await page.evaluate(() => {
        const dd = document.querySelector('#ctl00_ContentPlaceHolder1_DDListRamo');
        return Array.from(dd.options).map(o => ({ value: o.value, text: o.text }));
    });

    for (const opt of options) {
        if (opt.value === '0') continue; // Skip "Seleccione..."

        console.log('Testing Ramo:', opt.text);
        await page.evaluate((val) => {
            const dd = document.querySelector('#ctl00_ContentPlaceHolder1_DDListRamo');
            dd.value = val;
            const btn = document.querySelector('#ctl00_ContentPlaceHolder1_btnAceptarRamo') || document.querySelector('input[value="Aceptar"]');
            if (btn) btn.click();
        }, opt.value);

        await new Promise(r => setTimeout(r, 6000));
        
        const count = await page.evaluate(() => {
            const rows = document.querySelectorAll('#ctl00_ContentPlaceHolder1_GVPolList tr.GridRow, #ctl00_ContentPlaceHolder1_GVPolList tr.GridAlternatingRow');
            return rows.length;
        });
        console.log(`-> Encontradas ${count} polizas en ${opt.text}`);
    }

    process.exit(0);
}
main().catch(console.error);
