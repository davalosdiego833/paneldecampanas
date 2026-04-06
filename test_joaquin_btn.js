import puppeteer from 'puppeteer-core';
async function main() {
    const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
    const pages = await browser.pages();
    let page = pages.find(p => p.url().includes('lineamonterrey'));
    
    console.log('Navigating to Joaquin (88060)...');
    await page.goto('https://www.lineamonterrey.com.mx/AsesoresWeb/Consultas/Polizas/Asesor/PolizasAgente.aspx?vagente=88060', { waitUntil: 'domcontentloaded' });
    
    await new Promise(r => setTimeout(r, 2000));
    
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

    const btnHtml = await page.evaluate(() => {
        // Find by text content "ENVIAR A EXCEL" or similar
        const els = Array.from(document.querySelectorAll('a, input, button'));
        for (let e of els) {
            if (e.innerText?.toUpperCase().includes('EXCEL') || e.value?.toUpperCase().includes('EXCEL')) {
                return e.outerHTML;
            }
        }
        return 'Not found by text. Dumping all inputs at bottom: ' + document.querySelector('#ctl00_ContentPlaceHolder1_GVPolList').nextElementSibling?.outerHTML;
    });

    console.log('Button HTML:', btnHtml);

    process.exit(0);
}
main().catch(console.error);
