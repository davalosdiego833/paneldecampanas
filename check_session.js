import puppeteer from 'puppeteer-core';
async function main() {
    const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
    const pages = await browser.pages();
    let page = pages.find(p => p.url().includes('lineamonterrey'));
    
    if (page) {
        console.log('Current URL:', page.url());
        await page.screenshot({ path: 'session_state.jpg' });
        console.log('Saved session_state.jpg');
    } else {
        console.log('No lineamonterrey tab found.');
    }
    process.exit(0);
}
main().catch(console.error);
