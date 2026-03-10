import puppeteer from 'puppeteer-core';
import readline from 'readline';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const TARGET_URL = 'https://www.asesordeseguros.com.mx/Acceso/tabid/220/Default.aspx?returnurl=%2fPortalSwitch.aspx%3fReturnUrl1%3d%2fAsesoresWeb%2fReportes%2fPremios%2fPromotor%2fPremiosPromotor.aspx';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function main() {
    console.log('🚀 Lanzando Chrome con Remote Debugging (Puerto 9222)...');

    // Lanzamos Chrome desde el ejecutable del sistema operativo.
    // userDataDir nos permite persistir la sesión. El flag 9222 es crucial para conectarnos luego.
    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: false,
        defaultViewport: null,
        args: [
            '--remote-debugging-port=9222',
            '--start-maximized'
        ],
        userDataDir: '/tmp/puppeteer_user_data'
    });

    console.log('✅ Chrome abierto.');
    console.log('Abriendo las 3 pestañas de la sesión...');

    // Abrimos 3 pestañas
    const pages = await browser.pages();
    let page1 = pages[0];
    await page1.goto(TARGET_URL);

    let page2 = await browser.newPage();
    await page2.goto(TARGET_URL);

    let page3 = await browser.newPage();
    await page3.goto(TARGET_URL);

    console.log('\n======================================================');
    console.log('🛑 ACCIÓN REQUERIDA 🛑');
    console.log('1. Ingresa a Chrome (se acaba de abrir en tu pantalla).');
    console.log('2. Loguéate manualmente en las TRES (3) pestañas.');
    console.log('3. Una vez que veas la página de inicio dentro del portal en las 3 pestañas, envíame un mensaje por aquí confirmando que ya estás logueado.');
    console.log('======================================================\n');

    // Desconectamos para que el script termine pero Chrome se quede abierto en el puerto 9222
    browser.disconnect();
    console.log('✅ Script principal en pausa. Por favor, loguéate en la ventana ahora...');
    // Evitamos usar process.exit(0) porque puede matar al navegador hijo en Mac.

    // Quedamos en espera de "Ctrl+C" cuando Diego confirme
    setInterval(() => { }, 100000);
}

main().catch(console.error);
