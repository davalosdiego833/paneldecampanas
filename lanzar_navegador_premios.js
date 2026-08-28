import puppeteer from 'puppeteer-core';

// Copia de lanzar_navegador.js pero con puerto distinto (9223) para no chocar
// con Antigravity (u otra sesión) que ya esté usando el puerto 9222.

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const TARGET_URL = 'https://www.asesordeseguros.com.mx/Acceso/tabid/220/Default.aspx?returnurl=%2fPortalSwitch.aspx%3fReturnUrl1%3d%2fAsesoresWeb%2fReportes%2fPremios%2fPromotor%2fPremiosPromotor.aspx';

async function main() {
    console.log('🚀 Lanzando Chrome con Remote Debugging (Puerto 9223)...');

    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: false,
        defaultViewport: null,
        args: [
            '--remote-debugging-port=9223',
            '--start-maximized'
        ],
        userDataDir: '/tmp/puppeteer_user_data_premios'
    });

    console.log('✅ Chrome abierto.');

    const pages = await browser.pages();
    let page1 = pages[0];
    await page1.goto(TARGET_URL);

    console.log('\n======================================================');
    console.log('🛑 ACCIÓN REQUERIDA 🛑');
    console.log('1. Ingresa a Chrome (se acaba de abrir en tu pantalla).');
    console.log('2. Loguéate manualmente (usuario, contraseña, captcha).');
    console.log('3. Una vez que veas la pantalla de "Reportes de Bonos" ya logueado, avísame en el chat.');
    console.log('======================================================\n');

    browser.disconnect();
    console.log('✅ Script principal en pausa. Por favor, loguéate en la ventana ahora...');

    setInterval(() => { }, 100000);
}

main().catch(console.error);
