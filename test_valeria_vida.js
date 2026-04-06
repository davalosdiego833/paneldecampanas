import puppeteer from 'puppeteer-core';
async function main() {
    const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
    const pages = await browser.pages();
    let page = pages.find(p => p.url().includes('lineamonterrey'));
    
    console.log('Navigating to Valeria (18970)...');
    await page.goto('https://www.lineamonterrey.com.mx/AsesoresWeb/Consultas/Polizas/Asesor/PolizasAgente.aspx?vagente=18970', { waitUntil: 'domcontentloaded' });
    
    console.log('Selecting Vida...');
    await page.evaluate(() => {
        const dd = document.querySelector('#ctl00_ContentPlaceHolder1_DDListRamo');
        // 'Vida' is likely value=1 or 2, we need to find it by text if value is unknown
        const option = Array.from(dd.options).find(o => o.text === 'Vida');
        if (option) {
            dd.value = option.value;
            // The portal usually requires clicking the Aceptar button next to it!
            const btn = document.querySelector('#ctl00_ContentPlaceHolder1_btnAceptarRamo') || document.querySelector('input[value="Aceptar"]');
            if (btn) btn.click();
        }
    });

    console.log('Waiting for grid to reload...');
    await new Promise(r => setTimeout(r, 6000));
    
    const info = await page.evaluate(() => {
        const rows = document.querySelectorAll('#ctl00_ContentPlaceHolder1_GVPolList tr.GridRow, #ctl00_ContentPlaceHolder1_GVPolList tr.GridAlternatingRow');
        return rows.length > 0 ? `Encontradas ${rows.length} polizas en Vida!` : 'Tampoco hay polizas en Vida';
    });
    console.log(info);

    await page.screenshot({ path: 'valeria_vida_test.jpg' });
    console.log('Screenshot saved to valeria_vida_test.jpg');

    process.exit(0);
}
main().catch(console.error);
