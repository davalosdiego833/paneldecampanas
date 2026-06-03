import puppeteer from 'puppeteer-core';

async function run() {
    const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
    const pages = await browser.pages();
    // Let's use the first page instead of creating a new one in case it has active sessions
    let page = pages.find(p => p.url().includes('asesordeseguros.com.mx')) || await browser.newPage();
    
    const url = 'https://www.asesordeseguros.com.mx/Acceso/tabid/220/Default.aspx?returnurl=%2fComoVamos%2fReportesdeventas%2fReportePromotor.aspx%3ffolderId%3d567%26view%3dgridview%26pageSize%3d2147483647';
    console.log('Navigating to URL...');
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
    
    // wait a bit for any dynamic content
    await new Promise(r => setTimeout(r, 5000));

    const links = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a')).map(a => ({
            text: a.innerText.trim(),
            href: a.href
        })).filter(l => l.text.length > 0);
    });
    
    console.log(`Found ${links.length} links. First 50:`);
    links.slice(0, 50).forEach(l => {
        console.log(`- "${l.text}" | ${l.href}`);
    });

    // don't close the browser
    browser.disconnect();
}

run().catch(console.error);
