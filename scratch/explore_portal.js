import puppeteer from 'puppeteer-core';

async function run() {
    console.log('Connecting to browser...');
    const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
    const page = await browser.newPage();
    
    const url = 'https://www.asesordeseguros.com.mx/Acceso/tabid/220/Default.aspx?returnurl=%2fComoVamos%2fReportesdeventas%2fReportePromotor.aspx%3ffolderId%3d567%26view%3dgridview%26pageSize%3d2147483647';
    console.log('Navigating to URL...');
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    
    console.log('Extracting links...');
    const links = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a')).map(a => ({
            text: a.innerText.trim(),
            href: a.href,
            id: a.id,
            className: a.className
        })).filter(l => l.text.length > 0);
    });
    
    console.log('Links found:');
    links.forEach(l => {
        if(l.text.toLowerCase().includes('campaña') || l.text.toLowerCase().includes('esparci') || l.text.toLowerCase().includes('informa') || l.text.toLowerCase().includes('pagado')) {
            console.log(`- TEXT: "${l.text}" | HREF: ${l.href} | ID: ${l.id} | CLASS: ${l.className}`);
        }
    });

    await page.close();
    browser.disconnect();
}

run().catch(console.error);
