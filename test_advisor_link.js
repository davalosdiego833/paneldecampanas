import puppeteer from 'puppeteer-core';
async function main() {
    const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
    const pages = await browser.pages();
    let page = pages.find(p => p.url().includes('lineamonterrey'));
    
    // Check Valeria (18970) in the list
    const linkInfo = await page.evaluate(() => {
        const rows = document.querySelectorAll('#ctl00_ContentPlaceHolder1_GVListAgents tr');
        for (let r of rows) {
            if (r.innerText.includes('18970') || r.innerText.includes('VALERIA')) {
                const a = r.querySelector('a');
                return a ? { href: a.href, onClick: a.getAttribute('onclick'), text: a.innerText } : 'No link found';
            }
        }
        return 'Row not found';
    });
    console.log('Valeria link info:', JSON.stringify(linkInfo));

    // CLICK NATIVELY
    console.log('Clicking Valeria...');
    await page.evaluate(() => {
        const rows = document.querySelectorAll('#ctl00_ContentPlaceHolder1_GVListAgents tr');
        for (let r of rows) {
            if (r.innerText.includes('18970')) {
                const a = r.querySelector('a');
                if (a) a.click();
            }
        }
    });

    await new Promise(r => setTimeout(r, 8000));
    console.log('URL after click:', page.url());
    
    const gridFound = await page.evaluate(() => {
        return !!document.querySelector('#ctl00_ContentPlaceHolder1_GVPolList');
    });
    console.log('Grid found:', gridFound);
    
    // Check if there are any dropdowns
    const dropdowns = await page.evaluate(() => {
        const selects = Array.from(document.querySelectorAll('select'));
        return selects.map(s => ({ id: s.id, value: s.value, options: Array.from(s.options).map(o => o.text) }));
    });
    console.log('Dropdowns on page:', JSON.stringify(dropdowns));

    await page.screenshot({ path: 'valeria_test.jpg' });
    console.log('Screenshot saved to valeria_test.jpg');

    process.exit(0);
}
main().catch(console.error);
