import puppeteer from 'puppeteer-core';
import { execSync, spawn } from 'child_process';
import readline from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Mismo portal y credenciales que "estatus polizas" — guardadas en el Llavero
// de macOS, nunca en texto plano.
const KEYCHAIN_SERVICE = 'asesores-portal-smnyl';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const TARGET_URL = 'https://www.asesordeseguros.com.mx/Acceso/tabid/220/Default.aspx?returnurl=%2fPortalSwitch.aspx%3fReturnUrl1%3d%2fAsesoresWeb%2fReportes%2fPremios%2fPromotor%2fPremiosPromotor.aspx';

// Claves de asesores a descargar (mismas que ya se venían procesando en premios/).
// Edita esta lista si quieres agregar o quitar asesores.
const CLAVES = ['104750', '110453', '116876', '116883', '117440', '118069', '118246',
                 '47116', '80122', '87538', '90355', '94156'];

// Selectores del formulario de login (idénticos al portal de pólizas: mismo sitio).
const BASE_ID = 'dnn_ctr706_Login_PAsesores_Login_PAsesores';
const SEL_USUARIO = `#${BASE_ID}_txtUsername`;
const SEL_PASSWORD = `#${BASE_ID}_txtPassword`;
const SEL_CAPTCHA = `#${BASE_ID}_txtimgcode`;
const SEL_LOGIN_BTN = `#${BASE_ID}_cmdLogin`;

function leerCredencialesLlavero() {
    const salidaUsuario = execSync(`security find-generic-password -s "${KEYCHAIN_SERVICE}"`, { encoding: 'utf8' });
    const match = salidaUsuario.match(/"acct"<blob>="([^"]+)"/);
    const usuario = match ? match[1] : null;
    const password = execSync(`security find-generic-password -s "${KEYCHAIN_SERVICE}" -w`, { encoding: 'utf8' }).trim();
    if (!usuario || !password) throw new Error('No se pudieron leer las credenciales del Llavero.');
    return { usuario, password };
}

function preguntarEnTerminal(pregunta) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise(resolve => rl.question(pregunta, respuesta => { rl.close(); resolve(respuesta.trim()); }));
}

function correrComando(cmd, args, opciones = {}) {
    return new Promise((resolve, reject) => {
        const proc = spawn(cmd, args, { stdio: 'inherit', cwd: __dirname, ...opciones });
        proc.on('close', code => code === 0 ? resolve() : reject(new Error(`${cmd} terminó con código ${code}`)));
    });
}

async function main() {
    console.log('🔑 Leyendo credenciales del Llavero de macOS...');
    const { usuario, password } = leerCredencialesLlavero();
    console.log(`   Usuario: ${usuario}`);

    console.log('🚀 Abriendo Chrome...');
    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: false,
        defaultViewport: null,
        args: ['--remote-debugging-port=9223', '--start-maximized'],
        userDataDir: '/tmp/puppeteer_user_data_premios',
    });

    const pages = await browser.pages();
    const page = pages[0];
    await page.goto(TARGET_URL, { waitUntil: 'networkidle2' });

    console.log('✍️  Llenando usuario y contraseña...');
    await page.waitForSelector(SEL_USUARIO, { timeout: 20000 });
    await page.type(SEL_USUARIO, usuario);
    await page.type(SEL_PASSWORD, password);

    console.log('\n👀 Mira la ventana de Chrome que se acaba de abrir.');
    const captcha = await preguntarEnTerminal('✍️  Escribe aquí el texto del captcha que ves en pantalla: ');
    await page.type(SEL_CAPTCHA, captcha);

    console.log('➡️  Iniciando sesión...');
    await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {}),
        page.click(SEL_LOGIN_BTN),
    ]);

    if (page.url().includes('Acceso')) {
        console.log('❌ El login no funcionó (seguimos en la página de acceso). Revisa el captcha.');
        await browser.close();
        process.exit(1);
    }
    console.log(`✅ Login OK. Estamos en: ${page.url()}`);

    // Soltamos la conexión de Puppeteer (Chrome se queda abierto con remote
    // debugging activo) para que descargar_premios.js pueda conectarse por su cuenta,
    // igual que hacías manualmente antes.
    browser.disconnect();

    console.log(`\n📥 Descargando premios de ${CLAVES.length} asesores...\n`);
    await correrComando('node', ['descargar_premios.js', ...CLAVES, '--promotoria']);

    console.log('\n📤 Sincronizando con el servidor real...\n');
    await correrComando('bash', ['sincronizar_premios.sh']);

    console.log('\n✅ Todo listo: descarga + publicación en el sitio real completadas.');

    // Reconectamos solo para cerrar Chrome limpiamente.
    try {
        const browser2 = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9223', defaultViewport: null });
        await browser2.close();
    } catch (e) {
        console.log('(Chrome ya se había cerrado o no se pudo cerrar automáticamente, ciérralo tú si sigue abierto)');
    }
}

main().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
