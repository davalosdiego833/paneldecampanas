import puppeteer from 'puppeteer-core';

async function main() {
    const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222' });
    const pages = await browser.pages();
    let page = pages.find(p => p.url().includes('lineamonterrey') || p.url().includes('asesordeseguros'));
    
    console.log('Got page', page.url());
    
    try {
        console.log('Clicking Inactivos...');
        await page.evaluate(() => {
            const radio = document.querySelector('#ctl00_ContentPlaceHolder1_rdbStatus_1');
            if (radio) radio.click();
        });
        console.log('Clicked! Waiting 5s...');
        await new Promise(r => setTimeout(r, 5000));
        
        const count = await page.evaluate(() => {
            return document.querySelectorAll('#ctl00_ContentPlaceHolder1_GVListAgents tr').length;
        });
        console.log('Rows found:', count);
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
main().catch(console.error);
