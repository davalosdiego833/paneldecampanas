import puppeteer from 'puppeteer-core';
async function main() {
    const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
    const pages = await browser.pages();
    let page = pages.find(p => p.url().includes('lineamonterrey'));
    
    console.log('Navigating to Selina (21615)...');
    await page.goto('https://www.lineamonterrey.com.mx/AsesoresWeb/Consultas/Polizas/Asesor/PolizasAgente.aspx?vagente=21615', { waitUntil: 'domcontentloaded' });
    
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
        const els = Array.from(document.querySelectorAll('a, input, button'));
        for (let e of els) {
            if (e.innerText?.toUpperCase().includes('EXCEL') || e.value?.toUpperCase().includes('EXCEL')) {
                return `Found Excel Button: ID=${e.id}, Type=${e.tagName}, Class=${e.className}, Value=${e.value}`;
            }
        }
        return 'Not found by text. Dumping container: ' + document.querySelector('#ctl00_ContentPlaceHolder1_GVPolList')?.parentElement.innerHTML;
    });

    console.log(btnHtml);

    process.exit(0);
}
main().catch(console.error);
