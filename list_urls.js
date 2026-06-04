import puppeteer from 'puppeteer-core';
async function main() {
    const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
    const pages = await browser.pages();
    for (let p of pages) {
        console.log(p.url());
    }
    browser.disconnect();
}
main().catch(console.error);
