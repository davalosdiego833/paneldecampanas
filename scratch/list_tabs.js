import puppeteer from 'puppeteer-core';

async function run() {
    const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
    const pages = await browser.pages();
    
    console.log(`Found ${pages.length} tabs open:`);
    for (let i = 0; i < pages.length; i++) {
        console.log(`Tab ${i}: ${pages[i].url()} - TITLE: ${await pages[i].title()}`);
    }
    
    browser.disconnect();
}

run().catch(console.error);
