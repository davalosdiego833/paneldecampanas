// Consulta SOLO el reporte Pagado / Pendiente ("Pagado y Emitido") en el portal.
//   - Si el portal trae un corte más reciente que el de la app: lo descarga, reconstruye
//     el snapshot, lo publica al servidor, manda el aviso push y lo archiva.
//   - Si no hay nada nuevo: te avisa y no toca nada.
// Mismo patrón que correr_campanas_admin_automatico.js: usuario/contraseña del Llavero y
// el captcha SIEMPRE lo escribes tú (si el Chrome ya traía sesión vigente, ni captcha pide).
//
// Uso:
//   node correr_pagado_automatico.js                    consulta y, si hay novedad, publica todo
//   node correr_pagado_automatico.js --solo-consultar   solo avisa si hay novedad, no cambia nada
//   node correr_pagado_automatico.js --desde-carpeta=/ruta   usa archivos ya descargados a mano
//                                                      (sin portal ni captcha)
import puppeteer from 'puppeteer-core';
import AdmZip from 'adm-zip';
import { execFileSync, spawnSync } from 'child_process';
import readline from 'readline';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
    evaluarCambio, respaldar, restaurar, ultimoIdComunicado, comunicadosNuevos,
} from './lib_pagado.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const SOLO_CONSULTAR = args.includes('--solo-consultar');
const DESDE_CARPETA = (args.find(a => a.startsWith('--desde-carpeta=')) || '').slice('--desde-carpeta='.length) || null;

// ---- Portal -----------------------------------------------------------------
const KEYCHAIN_SERVICE = 'asesores-portal-smnyl';
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PUERTO = 9222; // el mismo de campañas/admin: comparte sesión, así que a veces ni pide captcha
// pageSize alto: con 10 el portal corta la lista de archivos de la carpeta.
const REPORTES_URL = 'https://www.asesordeseguros.com.mx/ComoVamos/Reportesdeventas/ReportePromotor.aspx?folderId=100&view=gridview&pageSize=100';
const CARPETAS_PORTAL = ['PAGADO PENDIENTE', 'PAGADO Y EMITIDO'];
const BASE_ID = 'dnn_ctr706_Login_PAsesores_Login_PAsesores';
const SEL_USUARIO = `#${BASE_ID}_txtUsername`;
const SEL_PASSWORD = `#${BASE_ID}_txtPassword`;
const SEL_CAPTCHA = `#${BASE_ID}_txtimgcode`;
const SEL_LOGIN_BTN = `#${BASE_ID}_cmdLogin`;

// ---- Servidor (mismos valores que deploy_datos.sh) ---------------------------------
const SERVER_IP = '195.35.10.40';
const SERVER_USER = 'u211138134';
const SERVER_PORT = '65002';
const SSH_KEY = path.join(os.homedir(), '.ssh', 'id_rsa_panel');
const SSH_KEX = 'curve25519-sha256,ecdh-sha2-nistp256,diffie-hellman-group14-sha256';
const HISTORIAL_URL = 'https://panel.ambrizydavalos.com/api/comunicados/history';

// ---- Reporte --------------------------------------------------------------------
// Orden importa: "PagPendReclutas" también contiene "pagpend", así que Reclutas va primero.
const REPORTES = [
    { key: 'pagado_pendiente_reclutas', label: 'Pagado / Pendiente (Reclutas)', regex: /pagpendrecluta|recluta.*temp/i, destino: 'PagPendReclutas.xls' },
    { key: 'pagado_pendiente', label: 'Pagado / Pendiente', regex: /pagpend/i, destino: 'PagPend.xls' },
];
const clasificar = (nombre) => REPORTES.find(r => r.regex.test(nombre));

const DATOS_DIR = 'administrador/pagado_emitido';
const TMP = path.join(__dirname, 'tmp_pagado');
const LISTOS = path.join(TMP, 'listos');
const RESPALDO = path.join(TMP, 'respaldo');
// Todo lo que este script puede modificar; se respalda para dejarlo como estaba si la publicación falla.
const RUTAS_RESPALDO = [
    'db/resumen_snapshot.json', 'db/resumen_snapshot_prev.json', 'db/notified_dates.json', 'db/alertas_pendientes.json',
    DATOS_DIR, 'administrador/pagado_emitidido',
];

const PYTHON = fs.existsSync(path.join(__dirname, '.venv', 'bin', 'python'))
    ? path.join(__dirname, '.venv', 'bin', 'python') : 'python3';

const delay = (ms) => new Promise(r => setTimeout(r, ms));
const correr = (cmd, cmdArgs) => execFileSync(cmd, cmdArgs, { stdio: 'inherit', cwd: __dirname });

function avisoMac(titulo, mensaje) {
    if (process.env.SIN_AVISO_ESCRITORIO) return;
    try {
        execFileSync('osascript', ['-e', `display notification ${JSON.stringify(mensaje)} with title ${JSON.stringify(titulo)}`]);
    } catch { /* el aviso de escritorio es un extra; el resultado ya salió en la terminal */ }
}

// ---- Sesión en el portal ------------------------------------------------------------
function leerCredencialesLlavero() {
    const salida = execFileSync('security', ['find-generic-password', '-s', KEYCHAIN_SERVICE], { encoding: 'utf8' });
    const usuario = (salida.match(/"acct"<blob>="([^"]+)"/) || [])[1];
    const password = execFileSync('security', ['find-generic-password', '-s', KEYCHAIN_SERVICE, '-w'], { encoding: 'utf8' }).trim();
    if (!usuario || !password) throw new Error('No se pudieron leer las credenciales del Llavero.');
    return { usuario, password };
}

function preguntarEnTerminal(pregunta) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise(resolve => rl.question(pregunta, r => { rl.close(); resolve(r.trim()); }));
}

const hayFormularioLogin = async (page) => page.url().includes('Acceso') || !!(await page.$(SEL_USUARIO));

async function iniciarSesion(page) {
    console.log('🔑 Leyendo credenciales del Llavero de macOS...');
    const { usuario, password } = leerCredencialesLlavero();
    await page.waitForSelector(SEL_USUARIO, { timeout: 20000 });
    await page.type(SEL_USUARIO, usuario);
    await page.type(SEL_PASSWORD, password);
    console.log('\n👀 Mira la ventana de Chrome que se acaba de abrir.');
    const captcha = await preguntarEnTerminal('✍️  Escribe aquí el texto del captcha que ves en pantalla: ');
    await page.type(SEL_CAPTCHA, captcha);
    await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {}),
        page.click(SEL_LOGIN_BTN),
    ]);
    if (page.url().includes('Acceso')) throw new Error('El login no funcionó (seguimos en la página de acceso). Revisa el captcha y vuelve a correrlo.');
    console.log('✅ Login OK.');
    await page.goto(REPORTES_URL, { waitUntil: 'networkidle2', timeout: 60000 });
}

async function abrirSesion() {
    let browser;
    let lanzado = false;
    try {
        browser = await puppeteer.connect({ browserURL: `http://127.0.0.1:${PUERTO}`, defaultViewport: null });
        console.log('🔗 Reutilizando el Chrome que ya estaba abierto.');
    } catch {
        console.log('🚀 Abriendo Chrome...');
        browser = await puppeteer.launch({
            executablePath: CHROME_PATH, headless: false, defaultViewport: null,
            args: [`--remote-debugging-port=${PUERTO}`, '--start-maximized'],
            userDataDir: '/tmp/puppeteer_user_data',
        });
        lanzado = true;
    }
    const paginas = await browser.pages();
    const page = paginas.find(p => /asesordeseguros|lineamonterrey/.test(p.url())) || paginas[0] || await browser.newPage();
    await page.bringToFront();
    await page.goto(REPORTES_URL, { waitUntil: 'networkidle2', timeout: 60000 });
    if (await hayFormularioLogin(page)) await iniciarSesion(page);
    else console.log('✅ La sesión del portal sigue vigente (no hace falta captcha).');
    return { browser, page, lanzado };
}

// ---- Descarga ------------------------------------------------------------------------
async function esperarDescarga(dir, maxSeg = 90) {
    let ultimoTam = -1;
    for (let i = 0; i < maxSeg; i++) {
        await delay(1000);
        const f = fs.readdirSync(dir).find(n => !n.endsWith('.crdownload') && !n.startsWith('.'));
        if (!f) continue;
        const tam = fs.statSync(path.join(dir, f)).size;
        if (tam > 0 && tam === ultimoTam) return path.join(dir, f);
        ultimoTam = tam;
    }
    return null;
}

/** Deja el Excel (ya sin zip) en LISTOS/<destino> y devuelve esa ruta. */
function dejarListo(archivoDescargado, regla) {
    let excel = archivoDescargado;
    if (/\.zip$/i.test(archivoDescargado)) {
        const zip = new AdmZip(archivoDescargado);
        const entrada = zip.getEntries().find(e => /\.(xls|xlsx|xlsm)$/i.test(e.entryName) && !e.entryName.startsWith('__MACOSX'));
        if (!entrada) throw new Error(`El zip ${path.basename(archivoDescargado)} no trae ningún Excel.`);
        const dir = path.dirname(archivoDescargado);
        zip.extractEntryTo(entrada, dir, false, true);
        excel = path.join(dir, path.basename(entrada.entryName));
    }
    const destino = path.join(LISTOS, regla.destino);
    fs.copyFileSync(excel, destino);
    return destino;
}

async function descargarDelPortal(page) {
    const client = await page.target().createCDPSession();
    const entro = await page.evaluate((nombres) => {
        const span = Array.from(document.querySelectorAll('span.rtIn')).find(s => nombres.includes(s.innerText.trim().toUpperCase()));
        if (span) { span.click(); return true; }
        return false;
    }, CARPETAS_PORTAL);
    if (!entro) throw new Error('No encontré la carpeta "Pagado Pendiente" en el menú del portal.');
    console.log('📂 Entrando a la carpeta: Pagado Pendiente');

    const listar = () => page.evaluate(() => Array.from(document.querySelectorAll('tr.rgRow, tr.rgAltRow')).map(r => {
        const n = r.querySelector('span[id$="ItemName"]');
        return { name: n ? n.innerText.trim() : '', id: r.id };
    }).filter(f => /\.(xls|xlsx|xlsm|zip)$/i.test(f.name)));

    // La lista tarda en refrescarse al cambiar de carpeta: reintenta hasta ver algo que nos sirva.
    let archivos = [];
    for (let intento = 0; intento < 4; intento++) {
        await delay(intento === 0 ? 5000 : 4000);
        archivos = await listar();
        if (archivos.some(a => clasificar(a.name))) break;
    }

    const listos = {};
    const ignorados = [];
    for (const archivo of archivos) {
        const regla = clasificar(archivo.name);
        if (!regla || listos[regla.key]) { ignorados.push(archivo.name); continue; }
        console.log(`   ⬇️ Descargando: ${archivo.name}`);
        const dir = path.join(TMP, `dl_${regla.key}`);
        fs.mkdirSync(dir, { recursive: true });
        await client.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: dir });
        await page.evaluate((id) => { const fila = document.getElementById(id); if (fila) fila.click(); }, archivo.id);
        await delay(1500);
        await page.evaluate(() => { if (typeof dnnModule !== 'undefined' && dnnModule.digitalAssets) dnnModule.digitalAssets.download(); });
        const bajado = await esperarDescarga(dir);
        if (!bajado) { console.log(`   ❌ "${archivo.name}" tardó demasiado en descargar.`); continue; }
        listos[regla.key] = { ruta: dejarListo(bajado, regla), original: archivo.name };
    }
    if (Object.keys(listos).length === 0) {
        throw new Error(`No encontré archivos de Pagado/Pendiente en la carpeta. Vi: ${archivos.map(a => a.name).join(', ') || '(vacía)'}`);
    }
    if (ignorados.length) console.log(`   ⏭️ Ignorados: ${ignorados.join(', ')}`);
    return listos;
}

/** Modo --desde-carpeta: toma el archivo más reciente que coincida con cada reporte. */
function tomarDeCarpeta(carpeta) {
    if (!fs.existsSync(carpeta)) throw new Error(`No existe la carpeta ${carpeta}`);
    const candidatos = fs.readdirSync(carpeta)
        .filter(n => /\.(xls|xlsx|xlsm|zip)$/i.test(n) && !n.startsWith('~$') && !n.startsWith('.') && !/_decrypted_temp/i.test(n))
        .map(n => ({ n, regla: clasificar(n), t: fs.statSync(path.join(carpeta, n)).mtimeMs }))
        .filter(c => c.regla)
        .sort((a, b) => b.t - a.t);
    const listos = {};
    for (const c of candidatos) {
        if (listos[c.regla.key]) continue;
        console.log(`📄 Usando ${c.n}`);
        listos[c.regla.key] = { ruta: dejarListo(path.join(carpeta, c.n), c.regla), original: c.n };
    }
    if (Object.keys(listos).length === 0) throw new Error(`No hay archivos PagPend/PagPendReclutas en ${carpeta}`);
    return listos;
}

// ---- Fechas ----------------------------------------------------------------------------
function leerFechaPortal(ruta) {
    const r = spawnSync(PYTHON, [path.join(__dirname, 'scripts', 'process_pagado_pendiente.py'), '--solo-fecha', ruta], { encoding: 'utf8' });
    const m = (r.stdout || '').match(/FECHA_CORTE=(.*)/);
    return m && m[1].trim() ? m[1].trim() : null;
}

function fechasDeLaApp() {
    try {
        const snap = JSON.parse(fs.readFileSync(path.join(__dirname, 'db', 'resumen_snapshot.json'), 'utf8'));
        return (snap.data || snap).fechas_corte || {};
    } catch { return {}; }
}

// ---- Servidor ------------------------------------------------------------------------------
function servidorResponde() {
    const r = spawnSync('ssh', [
        '-o', `KexAlgorithms=${SSH_KEX}`, '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=10',
        '-i', SSH_KEY, '-p', SERVER_PORT, `${SERVER_USER}@${SERVER_IP}`, 'echo ok',
    ], { encoding: 'utf8', timeout: 25000 });
    return r.status === 0 && /ok/.test(r.stdout || '');
}

async function servidorConReintentos(intentos = 3) {
    for (let i = 1; i <= intentos; i++) {
        if (servidorResponde()) return true;
        if (i < intentos) { console.log(`   ⏳ El servidor no responde (intento ${i}/${intentos}), reintento en 10 s...`); await delay(10000); }
    }
    return false;
}

async function publicarConReintentos(intentos = 3) {
    const esperas = [20000, 45000];
    for (let i = 1; i <= intentos; i++) {
        try {
            correr('bash', ['deploy_datos.sh', DATOS_DIR]);
            return;
        } catch {
            if (i === intentos) throw new Error(`El servidor cortó la publicación ${intentos} veces seguidas.`);
            console.log(`   ⏳ Falló la publicación (intento ${i}/${intentos}), reintento en ${esperas[i - 1] / 1000} s...`);
            await delay(esperas[i - 1]);
        }
    }
}

async function leerHistorial() {
    try {
        const res = await fetch(HISTORIAL_URL, { signal: AbortSignal.timeout(10000) });
        return res.ok ? await res.json() : null;
    } catch { return null; }
}

// ---- Aplicar cambios --------------------------------------------------------------------------
function restaurarTodo() {
    console.log('↩️  Regresando todo a como estaba antes de empezar...');
    restaurar(__dirname, RUTAS_RESPALDO, RESPALDO);
}

/** Deja listo para que un `node actualizar_snapshot.js --notify` posterior sí detecte el cambio. */
function restaurarEstadoDeAviso() {
    fs.copyFileSync(path.join(RESPALDO, 'db', 'resumen_snapshot.json'), path.join(__dirname, 'db', 'resumen_snapshot_prev.json'));
    fs.copyFileSync(path.join(RESPALDO, 'db', 'notified_dates.json'), path.join(__dirname, 'db', 'notified_dates.json'));
}

async function aplicar(nuevos) {
    console.log('\n🛠️  Hay actualización: aplicando cambios...');
    if (!(await servidorConReintentos())) {
        console.error('\n❌ El servidor no responde, así que no se cambió nada.');
        console.error('   Detén los procesos en Hostinger (hPanel) y vuelve a correr este script.');
        avisoMac('Pagado / Pendiente', 'Hay actualización pero el servidor no responde. No se cambió nada.');
        process.exitCode = 2;
        return false;
    }

    respaldar(__dirname, RUTAS_RESPALDO, RESPALDO);
    try {
        for (const r of nuevos) fs.copyFileSync(r.ruta, path.join(__dirname, DATOS_DIR, r.destino));
        console.log('\n🔄 Reconstruyendo el snapshot...');
        // --solo-pagado: modo rápido (recalcula solo Pagado/Pendiente y reutiliza el resto del snapshot; segundos en vez de minutos).
        // El aviso va DESPUÉS de publicar, para no avisar de algo que no llegó.
        correr('node', ['actualizar_snapshot.js', '--solo-pagado']);
        const hoy = fechasDeLaApp();
        for (const r of nuevos) {
            if (evaluarCambio(r.fechaPortal, hoy[r.key]) !== 'igual') {
                throw new Error(`El snapshot quedó en "${hoy[r.key] || 'sin fecha'}" pero el portal trae "${r.fechaPortal}". Algo falló al procesar ${r.destino}.`);
            }
        }
        console.log('\n📤 Publicando al servidor real...');
        await publicarConReintentos();
    } catch (e) {
        console.error(`\n❌ ${e.message}`);
        try { restaurarTodo(); } catch (err) {
            console.error(`⚠️ No pude restaurar automáticamente (${err.message}). Tu respaldo está en ${RESPALDO}`);
            conservarTmp = true;
        }
        avisoMac('Pagado / Pendiente: NO se publicó', 'Falló la publicación; todo quedó como estaba.');
        process.exitCode = 1;
        return false;
    }

    // Publicado. Ahora el aviso, verificando que de verdad haya llegado al servidor.
    console.log('\n🔔 Enviando aviso...');
    const antes = await leerHistorial();
    const idAntes = antes ? ultimoIdComunicado(antes) : null;
    let avisoOk = null; // true / false / null = no se pudo verificar
    try {
        correr('node', ['actualizar_snapshot.js', '--solo-pagado', '--notify']);
        await delay(2000);
        const despues = await leerHistorial();
        if (idAntes !== null && despues) avisoOk = comunicadosNuevos(despues, idAntes, /pagado/i).length > 0;
    } catch (e) {
        console.error(`⚠️ Error al enviar el aviso: ${e.message}`);
        avisoOk = false;
    }
    if (avisoOk === false) {
        restaurarEstadoDeAviso();
        console.error('⚠️ Los datos SÍ se publicaron, pero el aviso no aparece en el servidor.');
        console.error('   Cuando el servidor responda bien, reenvíalo con:  node actualizar_snapshot.js --notify');
        avisoMac('Pagado / Pendiente publicado, aviso PENDIENTE', 'Los datos ya están en la app pero el aviso no llegó. Revisa la terminal.');
        process.exitCode = 4;
    } else if (avisoOk === null) {
        console.log('ℹ️ Aviso enviado, pero no pude comprobar en el servidor que haya llegado.');
    } else {
        console.log('✅ Aviso verificado en el servidor.');
    }

    try {
        // Con tope de tiempo: el archivo va a una carpeta de iCloud y una vez se trabó 28 minutos.
        execFileSync('node', ['archivar_historial_mensual.js', '--solo=pagado_emitido'], { stdio: 'inherit', cwd: __dirname, timeout: 120000 });
    } catch (e) {
        archivadoOk = false;
        console.error(`⚠️ No se pudo archivar el histórico mensual (${e.code === 'ETIMEDOUT' ? 'se trabó más de 2 minutos' : e.message}).`);
        console.error('   Lo demás ya quedó publicado y avisado. Para reintentar solo el archivado:  node archivar_historial_mensual.js --solo=pagado_emitido');
    }
    return avisoOk !== false;
}

// ---- Principal ----------------------------------------------------------------------------------
let conservarTmp = false;
let archivadoOk = true;

async function main() {
    console.log('🔎 Consulta de Pagado / Pendiente (Pagado y Emitido)');
    if (SOLO_CONSULTAR) console.log('   Modo solo consulta: no se cambia ni se publica nada.');
    fs.rmSync(TMP, { recursive: true, force: true });
    fs.mkdirSync(LISTOS, { recursive: true });

    if (!SOLO_CONSULTAR && !servidorResponde()) {
        console.log('⚠️ Ahora mismo el servidor no responde por SSH. Si hay novedad, volveré a intentar antes de publicar.');
    }

    let sesion = null;
    try {
        let descargados;
        if (DESDE_CARPETA) {
            descargados = tomarDeCarpeta(DESDE_CARPETA);
        } else {
            sesion = await abrirSesion();
            descargados = await descargarDelPortal(sesion.page);
        }

        const fechasApp = fechasDeLaApp();
        const resultados = REPORTES.map(r => {
            const d = descargados[r.key];
            if (!d) return { ...r, estado: 'no_encontrado' };
            const fechaPortal = leerFechaPortal(d.ruta);
            const fechaApp = fechasApp[r.key] || '';
            return { ...r, ruta: d.ruta, fechaPortal, fechaApp, estado: fechaPortal ? evaluarCambio(fechaPortal, fechaApp) : 'ilegible' };
        });

        const ETIQUETA = {
            nuevo: '🆕 HAY ACTUALIZACIÓN', igual: '⏸️  sin cambios', anterior: '⏸️  el portal trae un corte MÁS VIEJO que la app (no se toca)',
            ilegible: '❌ no pude leer la fecha del archivo', no_encontrado: '❌ no apareció en el portal',
        };
        console.log('\n============================================================');
        console.log('📊 RESULTADO');
        console.log('============================================================');
        for (const r of resultados) {
            console.log(`• ${r.label}: ${ETIQUETA[r.estado]}`);
            if (r.fechaPortal) console.log(`    app: ${r.fechaApp || '(sin dato)'}   |   portal: ${r.fechaPortal}`);
        }

        const nuevos = resultados.filter(r => r.estado === 'nuevo');
        const problemas = resultados.filter(r => r.estado === 'ilegible' || r.estado === 'no_encontrado');
        if (problemas.length) process.exitCode = 3;

        if (nuevos.length === 0) {
            const fechas = resultados.filter(r => r.fechaApp).map(r => `${r.label}: ${r.fechaApp}`).join(' · ');
            console.log(problemas.length ? '\n⚠️ No hay actualización confirmada, pero hubo problemas (arriba).' : '\n✅ Todo al día: no hay actualización nueva.');
            avisoMac('Pagado / Pendiente', problemas.length ? 'No pude confirmar la actualización (revisa la terminal).' : `Sin cambios. ${fechas}`);
            return;
        }

        const cuales = nuevos.map(r => `${r.label} → ${r.fechaPortal}`).join(' · ');
        if (SOLO_CONSULTAR) {
            console.log('\n🆕 Hay actualización disponible (no se aplicó por --solo-consultar).');
            avisoMac('Pagado / Pendiente: HAY ACTUALIZACIÓN', cuales);
            return;
        }

        const ok = await aplicar(nuevos);
        if (ok) {
            console.log(archivadoOk
                ? '\n🎉 Listo: Pagado / Pendiente actualizado, publicado, avisado y archivado.'
                : '\n✅ Pagado / Pendiente actualizado, publicado y avisado. ⚠️ El archivado mensual NO se hizo (ver arriba).');
            avisoMac('Pagado / Pendiente actualizado', `${cuales}. Ya está en la app.${archivadoOk ? '' : ' (Archivado mensual pendiente.)'}`);
            if (!archivadoOk) process.exitCode = 5;
        }
    } finally {
        if (sesion) {
            try { sesion.lanzado ? await sesion.browser.close() : sesion.browser.disconnect(); } catch { /* ya estaba cerrado */ }
        }
        if (!conservarTmp) fs.rmSync(TMP, { recursive: true, force: true });
    }
}

main().catch(err => {
    console.error(`\n❌ Error: ${err.message}`);
    avisoMac('Pagado / Pendiente: error', err.message);
    process.exit(1);
});
