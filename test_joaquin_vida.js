import puppeteer from 'puppeteer-core';
async function main() {
    const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
    const pages = await browser.pages();
    let page = pages.find(p => p.url().includes('lineamonterrey'));
    
    console.log('Navigating to Joaquin (88060)...');
    await page.goto('https://www.lineamonterrey.com.mx/AsesoresWeb/Consultas/Polizas/Asesor/PolizasAgente.aspx?vagente=88060', { waitUntil: 'domcontentloaded' });
    
    await new Promise(r => setTimeout(r, 2000));
    
    let btnExcel = await page.evaluate(() => !!document.querySelector('#ctl00_ContentPlaceHolder1_imgBtnExcel'));
    console.log('Botón Excel ANTES de seleccionar Vida:', btnExcel);

    console.log('Seleccionando Vida...');
    await page.evaluate(() => {
        const dd = document.querySelector('#ctl00_ContentPlaceHolder1_DDListRamo');
        const option = Array.from(dd.options).find(o => o.text === 'Vida');
        if (option) {
            dd.value = option.value;
            const btn = document.querySelector('#ctl00_ContentPlaceHolder1_btnAceptarRamo') || document.querySelector('input[value="Aceptar"]');
            if (btn) btn.click();
        }
    });

    await new Promise(r => setTimeout(r, 5000));

    btnExcel = await page.evaluate(() => !!document.querySelector('#ctl00_ContentPlaceHolder1_imgBtnExcel'));
    console.log('Botón Excel DESPUÉS de seleccionar Vida:', btnExcel);

    const count = await page.evaluate(() => {
        return document.querySelectorAll('#ctl00_ContentPlaceHolder1_GVPolList tr.GridRow, #ctl00_ContentPlaceHolder1_GVPolList tr.GridAlternatingRow').length;
    });
    console.log(`Polizas en Vida: ${count}`);

    await page.screenshot({ path: 'joaquin_vida_test.jpg', fullPage: true });

    process.exit(0);
}
main().catch(console.error);
