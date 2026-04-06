import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

async function check() {
    const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222' });
    const pages = await browser.pages();
    let page = pages.find(p => p.url().includes('lineamonterrey') || p.url().includes('asesordeseguros'));

    await page.goto('https://www.lineamonterrey.com.mx/AsesoresWeb/Consultas/PolizasProm.aspx', { waitUntil: 'domcontentloaded', timeout: 90000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 3000));

    const asesores = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('#ctl00_ContentPlaceHolder1_GVListAgents tr.GridRow, #ctl00_ContentPlaceHolder1_GVListAgents tr.GridAlternatingRow'));
        return rows.map(r => {
            const cells = r.querySelectorAll('td');
            return {
                nombre: cells[0] ? cells[0].innerText.trim() : '',
                clave: cells[1] ? cells[1].innerText.trim() : ''
            };
        }).filter(a => {
            const upper = a.nombre.toUpperCase();
            return a.nombre && a.clave && !(upper === 'AMBRIZ Y DAVALOS' || upper === 'AMBRIZ Y DAVALOS S.C.' || upper.includes('PROMOTORIA'));
        });
    });

    const downloadedFiles = fs.readdirSync('estatus polizas/reportes').filter(f => f.endsWith('.xls'));
    const downloadedClaves = new Set(downloadedFiles.map(f => f.split('_')[0]));

    const missing = asesores.filter(a => !downloadedClaves.has(a.clave));
    console.log('Faltan:', missing);
    process.exit(0);
}
check().catch(console.error);
