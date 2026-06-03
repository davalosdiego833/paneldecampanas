import puppeteer from 'puppeteer-core';

async function run() {
    const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
    const pages = await browser.pages();
    
    // Find the page with the portal
    let page = pages.find(p => p.url().includes('asesordeseguros.com.mx'));
    if (!page) {
        console.log('No asesordeseguros.com.mx page found!');
        browser.disconnect();
        return;
    }
    
    console.log(`Analyzing page: ${page.url()}`);
    console.log(`Title: ${await page.title()}`);

    const elements = await page.evaluate(() => {
        // We want to find links that look like folders or files
        return Array.from(document.querySelectorAll('a, span.dnnDropText')).map(el => {
            return {
                tag: el.tagName,
                text: el.innerText.trim(),
                href: el.href || '',
                id: el.id,
                className: el.className,
                onclick: el.getAttribute('onclick') || ''
            };
        }).filter(e => e.text.length > 0 && e.text.toLowerCase() !== 'mapa del sitio' && e.text.toLowerCase() !== 'portal de clientes');
    });
    
    console.log(`Found ${elements.length} elements. Interesting ones (containing folder names):`);
    
    const keywords = ['campaña', 'esparcimiento', 'informa', 'pagado', 'camino', 'mdrt', 'gradua', 'proactivo'];
    
    elements.forEach(e => {
        const textLower = e.text.toLowerCase();
        if (keywords.some(k => textLower.includes(k)) || e.href.includes('folderId')) {
            console.log(`- [${e.tag}] "${e.text}" | HREF: ${e.href} | ID: ${e.id} | ONCLICK: ${e.onclick}`);
        }
    });

    browser.disconnect();
}

run().catch(console.error);
