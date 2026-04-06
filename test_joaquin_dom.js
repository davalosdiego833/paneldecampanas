import puppeteer from 'puppeteer-core';
async function main() {
    const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
    const pages = await browser.pages();
    let page = pages.find(p => p.url().includes('lineamonterrey'));
    
    console.log('Navigating to Joaquin (88060)...');
    await page.goto('https://www.lineamonterrey.com.mx/AsesoresWeb/Consultas/Polizas/Asesor/PolizasAgente.aspx?vagente=88060', { waitUntil: 'domcontentloaded' });
    
    await new Promise(r => setTimeout(r, 4000));
    
    const count = await page.evaluate(() => {
        return document.querySelectorAll('#ctl00_ContentPlaceHolder1_GVPolList tr.GridRow, #ctl00_ContentPlaceHolder1_GVPolList tr.GridAlternatingRow').length;
    });
    console.log(`Polizas: ${count}`);

    const hasButton = await page.evaluate(() => {
        return !!document.querySelector('#ctl00_ContentPlaceHolder1_imgBtnExcel');
    });
    console.log(`Boton Excel: ${hasButton}`);

    await page.screenshot({ path: 'joaquin_test.jpg' });
    console.log('Screenshot saved to joaquin_test.jpg');

    process.exit(0);
}
main().catch(console.error);
