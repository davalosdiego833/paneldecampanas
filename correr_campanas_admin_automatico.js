import puppeteer from 'puppeteer-core';
import { execSync, spawn } from 'child_process';
import readline from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Mismo portal y credenciales que "estatus polizas" y "premios" — Llavero de macOS.
const KEYCHAIN_SERVICE = 'asesores-portal-smnyl';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
// Página real de reportes (misma que usa descargar_campanas.js). Si no hay sesión,
// el portal redirige solo a la pantalla de login y regresa aquí después.
const TARGET_URL = 'https://www.asesordeseguros.com.mx/ComoVamos/Reportesdeventas/ReportePromotor.aspx?folderId=100&view=gridview&pageSize=10';

// Mismo puerto que ya usan lanzar_navegador.js / descargar_campanas.js / run_admin_download.js
const REMOTE_DEBUGGING_PORT = 9222;

// Selectores del formulario de login (idénticos en todo el portal: mismo sitio).
const BASE_ID = 'dnn_ctr706_Login_PAsesores_Login_PAsesores';
const SEL_USUARIO = `#${BASE_ID}_txtUsername`;
const SEL_PASSWORD = `#${BASE_ID}_txtPassword`;
const SEL_CAPTCHA = `#${BASE_ID}_txtimgcode`;
const SEL_LOGIN_BTN = `#${BASE_ID}_cmdLogin`;

// Carpetas que descarga run_admin_download.js (para publicarlas después, ya que
// ese script no se auto-despliega como sí hace descargar_campanas.js).
const CARPETAS_ADMIN_DOWNLOAD = [
    path.join('administrador', 'proactivos'),
    path.join('administrador', 'asesores_sin_emision'),
    path.join('administrador', 'comparativo_vida'),
];

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

function correrComando(cmd, args) {
    return new Promise((resolve, reject) => {
        const proc = spawn(cmd, args, { stdio: 'inherit', cwd: __dirname });
        proc.on('close', code => code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(' ')} terminó con código ${code}`)));
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
        args: [`--remote-debugging-port=${REMOTE_DEBUGGING_PORT}`, '--start-maximized'],
        userDataDir: '/tmp/puppeteer_user_data',
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

    // Soltamos Puppeteer (Chrome se queda abierto con remote debugging activo)
    // para que los scripts de descarga se conecten por su cuenta.
    browser.disconnect();

    console.log('\n📥 Descargando y publicando Campañas (descarga + deploy + notificación incluidos)...\n');
    await correrComando('node', ['descargar_campanas.js']);

    console.log('\n📥 Descargando Reportes Administrativos (Proactivos, Sin Emisión, Comparativo Vida)...\n');
    await correrComando('node', ['run_admin_download.js']);

    // run_admin_download.js no regenera el snapshot por su cuenta — sin este paso,
    // db/resumen_snapshot.json se queda con los datos de la descarga anterior
    // (la de descargar_campanas.js) y no con la descarga fresca de arriba.
    console.log('\n🔄 Actualizando snapshot con los reportes recién descargados...\n');
    await correrComando('node', ['actualizar_snapshot.js']);

    console.log('\n📤 Publicando reportes administrativos al servidor real...\n');
    await correrComando('bash', ['deploy_datos.sh', ...CARPETAS_ADMIN_DOWNLOAD]);

    await correrComando('node', ['archivar_historial_mensual.js']);

    console.log('\n✅ Todo listo: campañas + reportes admin descargados, publicados y archivados.');

    try {
        const browser2 = await puppeteer.connect({ browserURL: `http://127.0.0.1:${REMOTE_DEBUGGING_PORT}`, defaultViewport: null });
        await browser2.close();
    } catch (e) {
        console.log('(Chrome ya se había cerrado o no se pudo cerrar automáticamente, ciérralo tú si sigue abierto)');
    }
}

main().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
