import puppeteer from 'puppeteer-core';
import { execSync, execFileSync, spawn } from 'child_process';
import readline from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';
import { leerEstadoGuardado, decidirAccion } from './lib_premios.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Mismo portal y credenciales que "estatus polizas" — guardadas en el Llavero
// de macOS, nunca en texto plano.
const KEYCHAIN_SERVICE = 'asesores-portal-smnyl';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PUERTO = 9223;
const TARGET_URL = 'https://www.asesordeseguros.com.mx/Acceso/tabid/220/Default.aspx?returnurl=%2fPortalSwitch.aspx%3fReturnUrl1%3d%2fAsesoresWeb%2fReportes%2fPremios%2fPromotor%2fPremiosPromotor.aspx';

// Claves de asesores a descargar (mismas que ya se venían procesando en premios/).
// Edita esta lista si quieres agregar o quitar asesores.
const CLAVES_TODAS = ['104750', '110453', '116876', '116883', '117440', '118069', '118246',
                 '47116', '80122', '87538', '90355', '94156', '119447', '118915'];

// Cómo correrlo:
//   node correr_premios_automatico.js                  revisa PRIMERO la fecha de corte del portal; solo si hay
//                                                      corte nuevo (o faltan datos) descarga todo; si no, avisa
//                                                      que no hay actualización
//   node correr_premios_automatico.js --solo-consultar solo revisa y avisa; nunca descarga nada
//   node correr_premios_automatico.js --forzar         descarga todo sin revisar la fecha
//   node correr_premios_automatico.js 119447           procesa SOLO esas claves (sin Promotoría/Karen), sin revisar la fecha
//   node correr_premios_automatico.js 119447 --promotoria   esas claves + Promotoría/Karen (sin revisar la fecha)
//   node correr_premios_automatico.js --promotoria     SOLO Promotoría/Karen (sin revisar la fecha)
const ARGS = process.argv.slice(2);
const FORZAR = ARGS.includes('--forzar');
const SOLO_CONSULTAR = ARGS.includes('--solo-consultar');
const CLAVES_ARGV = ARGS.filter(a => /^\d+$/.test(a));
const SOLO_ALGUNAS = CLAVES_ARGV.length > 0;
const PIDE_PROMOTORIA = ARGS.includes('--promotoria');   // con claves: las suma; sin claves: SOLO Promotoría/Karen
const CLAVES = SOLO_ALGUNAS ? CLAVES_ARGV : (PIDE_PROMOTORIA ? [] : CLAVES_TODAS);
const INCLUIR_PROMOTORIA = PIDE_PROMOTORIA || !SOLO_ALGUNAS;
const REVISAR_CORTE = SOLO_CONSULTAR || (!SOLO_ALGUNAS && !PIDE_PROMOTORIA && !FORZAR);

// Todo lo que forma parte del "trabajo completo": se compara su fecha de corte guardada
// contra la del portal (si alguno se quedó atrás, se vuelve a intentar).
const A_COMPARAR = [...CLAVES_TODAS, 'PROMOTORIA', 'GA_KAREN'];

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

// Igual que correrComando, pero además devuelve todo lo que el proceso imprimió.
function correrCapturando(cmd, args) {
    return new Promise((resolve, reject) => {
        let salida = '';
        const proc = spawn(cmd, args, { stdio: ['inherit', 'pipe', 'inherit'], cwd: __dirname });
        proc.stdout.on('data', d => { const t = d.toString(); salida += t; process.stdout.write(t); });
        proc.on('close', code => code === 0 ? resolve(salida) : reject(new Error(`${cmd} terminó con código ${code}`)));
    });
}

function avisoMac(titulo, mensaje) {
    if (process.env.SIN_AVISO_ESCRITORIO) return;
    try {
        execFileSync('osascript', ['-e', `display notification ${JSON.stringify(mensaje)} with title ${JSON.stringify(titulo)}`]);
    } catch { /* el aviso de escritorio es un extra; el resultado ya salió en la terminal */ }
}

const hayFormularioLogin = async (page) => page.url().includes('Acceso') || !!(await page.$(SEL_USUARIO));

async function iniciarSesion(page) {
    console.log('🔑 Leyendo credenciales del Llavero de macOS...');
    const { usuario, password } = leerCredencialesLlavero();
    console.log(`   Usuario: ${usuario}`);

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

    if (page.url().includes('Acceso')) throw new Error('El login no funcionó (seguimos en la página de acceso). Revisa el captcha.');
    console.log(`✅ Login OK. Estamos en: ${page.url()}`);
}

// Reutiliza el Chrome si ya estaba abierto en el puerto de premios; si no, lo abre.
// Solo pide captcha si el portal realmente manda a la pantalla de acceso.
async function abrirSesion() {
    let browser;
    let lanzado = false;
    try {
        browser = await puppeteer.connect({ browserURL: `http://127.0.0.1:${PUERTO}`, defaultViewport: null });
        console.log('🔗 Reutilizando el Chrome que ya estaba abierto.');
    } catch {
        console.log('🚀 Abriendo Chrome...');
        browser = await puppeteer.launch({
            executablePath: CHROME_PATH,
            headless: false,
            defaultViewport: null,
            args: [`--remote-debugging-port=${PUERTO}`, '--start-maximized'],
            userDataDir: '/tmp/puppeteer_user_data_premios',
        });
        lanzado = true;
    }

    try {
        const pages = await browser.pages();
        const page = pages.find(p => /asesordeseguros|lineamonterrey/.test(p.url())) || pages[0] || await browser.newPage();
        await page.bringToFront();
        await page.goto(TARGET_URL, { waitUntil: 'networkidle2' });
        if (await hayFormularioLogin(page)) await iniciarSesion(page);
        else console.log('✅ La sesión del portal sigue vigente (no hace falta captcha).');
    } catch (err) {
        if (lanzado) await browser.close().catch(() => {});
        else browser.disconnect();
        throw err;
    }
    return browser;
}

// Reconecta solo para cerrar Chrome limpiamente.
async function cerrarChrome() {
    try {
        const browser2 = await puppeteer.connect({ browserURL: `http://127.0.0.1:${PUERTO}`, defaultViewport: null });
        await browser2.close();
    } catch (e) {
        console.log('(Chrome ya se había cerrado o no se pudo cerrar automáticamente, ciérralo tú si sigue abierto)');
    }
}

// Lee la fecha de corte del portal y decide si hay que descargar todo.
// Devuelve true solo si hay que seguir con la descarga completa.
async function revisarCorte() {
    console.log('\n🔎 Revisando la fecha de corte del portal antes de descargar todo...\n');
    let salida;
    try {
        salida = await correrCapturando('node', ['descargar_premios.js', '--solo-fecha']);
    } catch (err) {
        console.log('\n⚠️  No pude leer la fecha de corte del portal (puede estar actualizando su información o no cargó).');
        console.log('   No se descargó nada. Intenta de nuevo en un rato, o corre con --forzar para descargar de todos modos.');
        avisoMac('Reporte de Premios', 'No pude leer la fecha de corte del portal. No se descargó nada.');
        process.exitCode = 3;
        return false;
    }

    const fechaPortal = (salida.match(/FECHA_CORTE_PORTAL=(\d{1,2}[-/]\d{1,2}[-/]\d{4})/) || [])[1];
    const d = decidirAccion(fechaPortal, leerEstadoGuardado(path.join(__dirname, 'premios'), A_COMPARAR));

    if (d.accion === 'ilegible') {
        console.log('\n⚠️  No entendí la fecha de corte que devolvió el portal. No se descargó nada (usa --forzar para descargar de todos modos).');
        avisoMac('Reporte de Premios', 'No entendí la fecha de corte del portal. No se descargó nada.');
        process.exitCode = 3;
        return false;
    }

    if (d.incompletas.length > 0) {
        console.log(`\n⚠️  Ojo: estas capturas guardadas salieron incompletas y siguen pendientes: ${d.incompletas.join(', ')}`);
        console.log(`   Para reintentarlas solas: node correr_premios_automatico.js ${d.incompletas.join(' ')}`);
    }

    if (d.accion === 'omitir') {
        if (d.motivo === 'igual') {
            console.log(`\n✅ No hay actualización: el portal sigue en el corte ${d.fechaPortal}, el mismo que ya tenemos guardado.`);
            avisoMac('Reporte de Premios', `Sin novedad: el portal sigue en el corte ${d.fechaPortal}.`);
        } else {
            console.log(`\nℹ️  No hay actualización: el portal muestra el corte ${d.fechaPortal}, más viejo que lo que ya tenemos (${d.fechaGuardada}). No se descargó nada.`);
            avisoMac('Reporte de Premios', `Sin novedad: el portal muestra un corte (${d.fechaPortal}) más viejo que el guardado.`);
        }
        return false;
    }

    // d.accion === 'correr'
    if (d.motivo === 'faltan_datos') {
        console.log(`\n🆕 Faltan datos guardados de: ${d.sinDatos.join(', ')}. Se descarga todo.`);
    } else {
        console.log(`\n🆕 Hay corte nuevo: el portal trae el ${d.fechaPortal} y lo más viejo que tenemos guardado es el ${d.fechaGuardada} (${d.claveMasVieja}).`);
    }
    if (SOLO_CONSULTAR) {
        console.log('   (No se descargó nada porque corriste con --solo-consultar.)');
        avisoMac('Reporte de Premios', `¡Hay corte nuevo en el portal (${d.fechaPortal})! Corre el script para descargarlo.`);
        return false;
    }
    avisoMac('Reporte de Premios', `Corte nuevo (${d.fechaPortal}). Descargando todo...`);
    return true;
}

async function main() {
    const browser = await abrirSesion();

    // Soltamos la conexión de Puppeteer (Chrome se queda abierto con remote
    // debugging activo) para que descargar_premios.js pueda conectarse por su cuenta,
    // igual que hacías manualmente antes.
    browser.disconnect();

    if (REVISAR_CORTE) {
        const hayQueDescargar = await revisarCorte();
        if (!hayQueDescargar) {
            await cerrarChrome();
            return;
        }
    }

    console.log(`\n📥 Descargando premios de ${CLAVES.length} asesor(es)${SOLO_ALGUNAS ? ` (solo: ${CLAVES.join(', ')})` : ''}${INCLUIR_PROMOTORIA ? ' + Promotoría/Karen' : ''}...\n`);
    await correrComando('node', ['descargar_premios.js', ...CLAVES, ...(INCLUIR_PROMOTORIA ? ['--promotoria'] : [])]);

    console.log('\n📤 Sincronizando con el servidor real...\n');
    await correrComando('bash', ['sincronizar_premios.sh']);

    console.log('\n✅ Todo listo: descarga + publicación en el sitio real completadas.');
    avisoMac('Reporte de Premios', 'Listo: descarga y publicación en el sitio real completadas.');

    await cerrarChrome();
}

main().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
