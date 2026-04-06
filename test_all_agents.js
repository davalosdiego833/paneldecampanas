import puppeteer from 'puppeteer-core';
import fs from 'fs';

async function main() {
    const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
    const pages = await browser.pages();
    let page = pages.find(p => p.url().includes('lineamonterrey'));
    
    const rawData = fs.readFileSync('estatus polizas/reportes/inactivos/lista_asesores.json', 'utf-8');
    const asesores = JSON.parse(rawData);

    console.log(`Auditing ${asesores.length} asesores...`);
    let foundAny = false;

    for (const adv of asesores) {
        process.stdout.write(`Viendo ${adv.clave} - ${adv.nombre}: `);
        await page.goto(`https://www.lineamonterrey.com.mx/AsesoresWeb/Consultas/Polizas/Asesor/PolizasAgente.aspx?vagente=${adv.clave}`, { waitUntil: 'domcontentloaded' });
        
        // Esperemos medio segundo extra 
        await new Promise(r => setTimeout(r, 1000));
        
        const count = await page.evaluate(() => {
            const rows = document.querySelectorAll('#ctl00_ContentPlaceHolder1_GVPolList tr.GridRow, #ctl00_ContentPlaceHolder1_GVPolList tr.GridAlternatingRow');
            return rows.length;
        });

        if (count > 0) {
            console.log(`${count} POLIZAS ENCONTRADAS!`);
            foundAny = true;
        } else {
            console.log(`0 polizas`);
        }
    }
    
    console.log('Auditoria terminada.');
    process.exit(0);
}
main().catch(console.error);
