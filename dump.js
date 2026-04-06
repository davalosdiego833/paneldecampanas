import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DOWNLOAD_DIRECTORY = path.join(__dirname, 'estatus polizas', 'reportes', 'inactivos');

if (!fs.existsSync(DOWNLOAD_DIRECTORY)) fs.mkdirSync(DOWNLOAD_DIRECTORY, { recursive: true });

async function main() {
    const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222' });
    const pages = await browser.pages();
    let page = pages.find(p => p.url().includes('lineamonterrey') || p.url().includes('asesordeseguros'));
    
    await page.goto('https://www.lineamonterrey.com.mx/AsesoresWeb/Consultas/PolizasProm.aspx', { waitUntil: 'domcontentloaded', timeout: 90000 }).catch(() => { });
    await new Promise(r => setTimeout(r, 3000));

    await page.evaluate(() => {
        const rdb = document.querySelector('#ctl00_ContentPlaceHolder1_rdbStatus_1');
        if (rdb) rdb.click();
    });
    await new Promise(r => setTimeout(r, 6000));

    const asesores = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('#ctl00_ContentPlaceHolder1_GVListAgents tr.GridRow, #ctl00_ContentPlaceHolder1_GVListAgents tr.GridAlternatingRow'));
        return rows.map(r => {
            const cells = r.querySelectorAll('td');
            return {
                nombre: cells[0] ? cells[0].innerText.trim() : '',
                clave: cells[1] ? cells[1].innerText.trim() : ''
            };
        }).filter(a => a.nombre && a.clave && !a.nombre.toUpperCase().includes('AMBRIZ Y DAVALOS'));
    });

    console.log(`Guardando ${asesores.length} asesores inactivos...`);
    fs.writeFileSync(path.join(DOWNLOAD_DIRECTORY, 'lista_asesores.json'), JSON.stringify(asesores, null, 2));
    process.exit(0);
}
main().catch(console.error);
