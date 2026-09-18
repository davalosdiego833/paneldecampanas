import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// -- CONFIG --
// Claves a procesar: se pasan como argumentos de línea de comandos.
// Ej: node descargar_premios.js 47116 117440
const CLAVES = process.argv.slice(2);

const CLAVE_PROMOTORIA = '2043'; // AMBRIZ Y DAVALOS SC
const MAX_INTENTOS = 2; // Reintentos por asesor antes de rendirse

const OUTPUT_DIR = path.join(__dirname, 'premios');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// --- Monitoreo de LIMRA/IGC entre actualizaciones ---
// Antes de sobreescribir el data.json de un asesor, leemos el anterior (si existe)
// y sacamos su LIMRA/IGC de la cabecera, para que el reporte pueda mostrar si
// subieron, bajaron o se mantuvieron igual desde el corte pasado.
function extraerIndicadoresCabecera(rawArr) {
    if (!Array.isArray(rawArr)) return {};
    let i = 0;
    for (; i < rawArr.length; i++) {
        if (/^(Asesor|Clave|Avance Al|Fecha Concurso|Tipo):/.test(String(rawArr[i]))) continue;
        break;
    }
    const indicadores = {};
    for (; i < rawArr.length - 1; i += 2) {
        const label = rawArr[i];
        const val = rawArr[i + 1];
        if (/^Histórico/i.test(String(label))) break;
        indicadores[label] = val;
    }
    return indicadores;
}

function limpiarPorcentajeIndice(v) {
    if (v === undefined || v === null) return null;
    const n = parseFloat(String(v).replace(/[^0-9.-]/g, ''));
    return Number.isNaN(n) ? null : n;
}

function leerIndicesAnteriores(dataJsonPath) {
    try {
        if (!fs.existsSync(dataJsonPath)) return null;
        const anterior = JSON.parse(fs.readFileSync(dataJsonPath, 'utf-8'));
        const indicadores = extraerIndicadoresCabecera(anterior?.resumen?.cabecera?._raw);
        const limra = limpiarPorcentajeIndice(indicadores['LIMRA']);
        const igc = limpiarPorcentajeIndice(indicadores['IGC']);
        if (limra === null && igc === null) return null;
        return { limra, igc, fecha: anterior.timestamp || null };
    } catch (e) {
        console.warn('   ⚠️ No se pudieron leer los índices de la actualización anterior:', e.message);
        return null;
    }
}

// --- Desglose Inicial vs Renovación de "Bonos Anticipados" (solo Bono Vida) ---
// El portal (hojameta) SOLO reporta un "Bonos Anticipados" combinado (Inicial +
// Renovación juntos) y lo neta contra "Bono Semestral" (también combinado) para
// sacar "Bonos a Pagar". No hay forma de pedirle el desglose directo.
// Para poder mostrar "cuánto de lo ya anticipado es de Inicial" y "cuánto de
// Renovación" por separado, lo reconstruimos nosotros comparando cada corte
// contra el anterior (mismo patrón que ya usa leerIndicesAnteriores arriba):
//   - Mientras el combinado no suba, no hubo pago nuevo -> no tocamos nada.
//   - Cuando el combinado sube (se detectó un pago), repartimos el incremento
//     proporcional a lo que el corte ANTERIOR decía que llevaba calculado cada
//     bono (Inicial vs Renovación) -- es la mejor aproximación posible dado que
//     el portal no da el detalle, y garantiza que la suma de los dos
//     desglosados siempre cuadre exacto con el combinado real del portal.
//   - Al cambiar de semestre (Bono Vida se reinicia cada semestre) reseteamos
//     el acumulado a cero.
function extraerCampoCabecera(rawArr, campo) {
    if (!Array.isArray(rawArr)) return null;
    for (const linea of rawArr) {
        const m = String(linea).match(new RegExp(`^${campo}:\\s*(.*)$`));
        if (m) return m[1].trim();
    }
    return null;
}

function mapaFilasTabla(texto) {
    const mapa = {};
    const lineas = String(texto || '').split('\n');
    for (const linea of lineas) {
        if (!linea.includes('\t')) continue;
        const celdas = linea.split('\t').map(c => c.trim());
        const etiqueta = celdas[0].trim();
        if (!etiqueta) continue;
        // Solo la primera vez que aparece cada etiqueta (evita pisar "Bono Inicial"
        // del resumen con el de la sub-sección de Renovación, igual que en el front).
        if (!(etiqueta in mapa)) mapa[etiqueta] = celdas.slice(1);
    }
    return mapa;
}

function parseMontosVida(texto) {
    const m = mapaFilasTabla(texto);
    return {
        montoBonoInicial: limpiarPorcentajeIndice(m['Bono Inicial']?.[0]) || 0,
        montoBonoRenovacion: limpiarPorcentajeIndice(m['Bono Renovación']?.[0]) || 0,
        bonosAnticipados: limpiarPorcentajeIndice(m['Bonos Anticipados']?.[0]) || 0,
    };
}

function calcularSemestreKey(avanceAlStr) {
    // "Avance Al" viene como dd-mm-yyyy
    const partes = String(avanceAlStr || '').split(/[-/]/).map(Number);
    if (partes.length < 3 || !partes[1] || !partes[2]) return null;
    const [, mes, anio] = partes;
    return `${anio}-${mes <= 6 ? 'S1' : 'S2'}`;
}

function leerAnticiposAnteriores(dataJsonPath) {
    try {
        if (!fs.existsSync(dataJsonPath)) return null;
        const anterior = JSON.parse(fs.readFileSync(dataJsonPath, 'utf-8'));
        if (!anterior?.detalleModalTexto) return null;
        const montos = parseMontosVida(anterior.detalleModalTexto);
        return { ...montos, tracking: anterior.anticiposDesglosados || null };
    } catch (e) {
        console.warn('   ⚠️ No se pudieron leer los anticipos de la actualización anterior:', e.message);
        return null;
    }
}

function calcularAnticiposDesglosados({ anterior, montoBonoInicialActual, montoBonoRenovacionActual, bonosAnticipadosActual, semestreKeyActual }) {
    const redondear = n => Math.round(n * 100) / 100;
    const trackingAnterior = anterior?.tracking || null;
    const semestreNuevo = !trackingAnterior || trackingAnterior.semestreKey !== semestreKeyActual;

    if (semestreNuevo) {
        // No hay corte anterior del mismo semestre del que partir -> no podemos
        // atribuir con certeza un anticipo que ya viniera de antes. En la práctica
        // esto arranca en $0, pero por si el portal ya trae algo anticipado desde
        // el primer corte del semestre, lo repartimos proporcional a lo calculado
        // de hoy como mejor esfuerzo, y seguimos el rastreo desde aquí en adelante.
        const totalActual = montoBonoInicialActual + montoBonoRenovacionActual;
        const inicial = bonosAnticipadosActual > 0 && totalActual > 0
            ? bonosAnticipadosActual * (montoBonoInicialActual / totalActual)
            : 0;
        return {
            semestreKey: semestreKeyActual,
            inicialAnticipadoAcumulado: redondear(inicial),
            renovacionAnticipadoAcumulado: redondear(bonosAnticipadosActual - inicial),
            anticipadosCombinadoUltimoCorte: bonosAnticipadosActual,
            actualizadoEn: new Date().toISOString(),
        };
    }

    let inicialAcum = trackingAnterior.inicialAnticipadoAcumulado || 0;
    let renovacionAcum = trackingAnterior.renovacionAnticipadoAcumulado || 0;
    const combinadoAnterior = trackingAnterior.anticipadosCombinadoUltimoCorte || 0;
    const delta = bonosAnticipadosActual - combinadoAnterior;

    if (delta > 0.5) {
        // Pago nuevo detectado: repartimos el incremento proporcional a lo que el
        // corte anterior decía que llevaba calculado cada bono.
        const baseInicial = anterior?.montoBonoInicial || 0;
        const baseRenovacion = anterior?.montoBonoRenovacion || 0;
        const baseTotal = baseInicial + baseRenovacion;
        const deltaInicial = baseTotal > 0 ? delta * (baseInicial / baseTotal) : delta / 2;
        inicialAcum += deltaInicial;
        renovacionAcum += (delta - deltaInicial);
    } else if (delta < -0.5) {
        // El combinado bajó (poco común: correcciones del portal). Reescalamos
        // ambos acumulados proporcionalmente para no quedar con una suma mayor
        // al nuevo total que reporta el portal.
        const totalAcumAnterior = inicialAcum + renovacionAcum;
        if (totalAcumAnterior > 0) {
            const factor = Math.max(0, bonosAnticipadosActual) / totalAcumAnterior;
            inicialAcum *= factor;
            renovacionAcum *= factor;
        }
    }
    // |delta| <= 0.5 -> sin pago nuevo, dejamos el acumulado tal cual estaba.

    return {
        semestreKey: semestreKeyActual,
        inicialAnticipadoAcumulado: redondear(inicialAcum),
        renovacionAnticipadoAcumulado: redondear(renovacionAcum),
        anticipadosCombinadoUltimoCorte: bonosAnticipadosActual,
        actualizadoEn: new Date().toISOString(),
    };
}

// Espera a que se abra una ventana/pestaña nueva (window.open / target=_blank)
// y regresa la Page correspondiente ya cargada.
function esperarNuevaPagina(browser, timeout = 20000) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            browser.off('targetcreated', onTarget);
            reject(new Error('Timeout esperando nueva pestaña/ventana emergente'));
        }, timeout);

        async function onTarget(target) {
            console.log(`      (debug) targetcreated: type=${target.type()} url=${target.url()}`);
            if (target.type() !== 'page') return;
            const newPage = await target.page();
            if (!newPage) return;
            clearTimeout(timer);
            browser.off('targetcreated', onTarget);
            try {
                await newPage.waitForNetworkIdle({ idleTime: 800, timeout: 15000 }).catch(() => {});
            } catch (e) {}
            resolve(newPage);
        }

        browser.on('targetcreated', onTarget);
    });
}

// Busca en la página un elemento cuyo texto (trim, exacto o "contiene") coincida,
// y le da clic. Devuelve true/false según si lo encontró.
// IMPORTANTE: usamos un clic REAL de mouse (ElementHandle.click) en vez de
// elemento.click() en JS. Un click() sintético no siempre cuenta como "gesto
// de usuario" genuino, y Chrome bloquea en silencio los window.open() que
// dependan de eso (sin error, sin diálogo visible) — eso nos costó varias
// vueltas detectar.
async function clickPorTexto(page, texto, { exact = true, tag = '*' } = {}) {
    const marca = `mcp-click-${Date.now()}`;
    const encontrado = await page.evaluate((texto, exact, tag, marca) => {
        const nodos = Array.from(document.querySelectorAll(tag));
        const target = nodos.find(el => {
            const crudo = el.tagName === 'INPUT' ? (el.value || '') : (el.textContent || '');
            // Normalizamos espacios/tabs/saltos de línea internos a un solo espacio
            // (varios botones de hojameta traen el texto formateado con \n\t\t\t adentro)
            const t = crudo.replace(/\s+/g, ' ').trim();
            if (!t) return false;
            const soloTexto = el.children.length === 0 || Array.from(el.children).every(c => !(c.textContent || '').trim());
            const coincide = exact ? t === texto : t.includes(texto);
            return coincide && soloTexto;
        });
        if (!target) return false;
        // OJO: NO subimos a buscar un "ancestro clicable" — los clics hacen bubbling
        // normal, así que clickear el elemento exacto del texto ya dispara cualquier
        // listener puesto en un ancestro. Subir de nivel es lo que nos hizo clickear
        // cajas gigantes equivocadas (ej. toda la fila de tarjetas en vez de un tile).
        // Excepción: si el propio target tiene tamaño 0 (texto envuelto raro), usamos
        // su padre inmediato nada más.
        let clicable = target;
        const rectPropio = target.getBoundingClientRect();
        if (rectPropio.width === 0 || rectPropio.height === 0) {
            clicable = target.parentElement || target;
        }
        clicable.setAttribute('data-mcp-target', marca);
        const rect = clicable.getBoundingClientRect();
        return {
            tag: clicable.tagName,
            cls: clicable.className,
            html: clicable.outerHTML.slice(0, 150),
            rect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height }
        };
    }, texto, exact, tag, marca);

    if (!encontrado) return false;
    console.log(`      (debug) clickPorTexto("${texto}") -> <${encontrado.tag} class="${encontrado.cls}"> rect=${JSON.stringify(encontrado.rect)}`);
    console.log(`      (debug) html: ${encontrado.html}`);

    const handle = await page.$(`[data-mcp-target="${marca}"]`);
    if (!handle) return false;
    await handle.evaluate(el => el.scrollIntoView({ block: 'center' })).catch(() => {});
    try {
        await handle.click(); // clic real de mouse vía CDP (necesario para que no bloqueen popups)
    } catch (e) {
        console.log(`   ⚠️ Clic real falló ("${e.message}"), usando clic JS de respaldo...`);
        await handle.evaluate(el => el.click());
    }
    return true;
}

// Algunas ventanas emergentes pasan por 1-2 páginas intermedias de redirección
// (ASP viejo -> hojameta) DESPUÉS de que "network idle" ya se cumplió una vez.
// Si tratamos de leer justo en ese instante, el frame se "desconecta" (detached)
// a media redirección. Aquí esperamos a que la URL deje de cambiar antes de
// dar por buena la página.
async function esperarPaginaEstable(page, { intentos = 6, esperaMs = 1200 } = {}) {
    let urlAnterior = null;
    for (let i = 0; i < intentos; i++) {
        let urlActual;
        try { urlActual = page.url(); } catch (e) { urlActual = null; }
        if (urlActual && urlActual === urlAnterior && urlActual !== 'about:blank') {
            // Confirmar además que el DOM responde (no está a media navegación)
            const listo = await page.evaluate(() => document.readyState).catch(() => null);
            if (listo === 'complete' || listo === 'interactive') return true;
        }
        urlAnterior = urlActual;
        await delay(esperaMs);
    }
    return false;
}

async function volcarDebug(page, prefijo, carpeta) {
    try {
        await page.screenshot({ path: path.join(carpeta, `${prefijo}.png`), fullPage: true });
    } catch (e) { console.log(`   ⚠️ No se pudo tomar screenshot (${prefijo}):`, e.message); }
    try {
        const texto = await page.evaluate(() => document.body.innerText);
        fs.writeFileSync(path.join(carpeta, `${prefijo}.txt`), texto);
    } catch (e) { console.log(`   ⚠️ No se pudo volcar texto (${prefijo}):`, e.message); }
}

// Extrae la tabla "Resumen de Bonos" (Bonos | Bono Mes | Bono Acumulado | Gana)
// y las tarjetas superiores de indicadores, de la página hojameta de un asesor.
async function extraerResumenAsesor(page) {
    return await page.evaluate(() => {
        const bodyText = document.body.innerText || '';

        // Tarjetas superiores: buscamos pares "Etiqueta" + "Valor" en el bloque de arriba
        // (Asesor, Clave, Avance Al, Fecha Concurso, Tipo, Pólizas Vida, Prima Meta Vida, etc.)
        const cabecera = {};
        const lineas = bodyText.split('\n').map(l => l.trim()).filter(Boolean);
        cabecera._raw = lineas.slice(0, 40);

        // Tabla "Resumen de Bonos"
        const tablas = Array.from(document.querySelectorAll('table'));
        let resumenBonos = null;
        for (const t of tablas) {
            const headerText = t.innerText.slice(0, 200);
            if (/Bonos[\s\S]*Bono Mes[\s\S]*Acumulado/i.test(headerText) || /Bono Mes/i.test(headerText)) {
                const filas = Array.from(t.querySelectorAll('tr')).map(tr =>
                    Array.from(tr.querySelectorAll('td,th')).map(td => td.innerText.trim())
                ).filter(f => f.length > 0);
                resumenBonos = filas;
                break;
            }
        }

        return {
            cabecera,
            resumenBonos,
            todoElTexto: bodyText
        };
    });
}

// Intenta cerrar el modal actualmente abierto en hojameta (botón "X" de la
// esquina superior derecha). Prueba varias estrategias porque no sabemos de
// antemano la marca exacta del botón.
async function cerrarModalActual(page) {
    const intentos = [
        () => clickPorTexto(page, '×'),
        () => clickPorTexto(page, 'X'),
        () => clickPorTexto(page, 'x'),
    ];
    for (const intentar of intentos) {
        try {
            if (await intentar()) return true;
        } catch (e) {}
    }
    // Fallback: buscar un botón/ícono de cerrar por clase/aria-label típico de
    // modales Bootstrap/jQuery, o el que ya vimos en las capturas (esquina
    // superior derecha de la barra azul del modal).
    const cerrado = await page.evaluate(() => {
        const candidatos = Array.from(document.querySelectorAll(
            '.close, [aria-label="Close"], [aria-label="close"], .modal-header .close, button.close, .k-icon.k-i-close, .fa-times, .fa-close'
        ));
        const visible = candidatos.find(el => {
            const r = el.getBoundingClientRect();
            return r.width > 0 && r.height > 0;
        });
        if (visible) { visible.click(); return true; }
        return false;
    }).catch(() => false);
    if (cerrado) return true;
    // Último recurso: tecla Escape.
    try { await page.keyboard.press('Escape'); return true; } catch (e) { return false; }
}

// Extrae TODAS las tablas visibles de la página/modal actual como texto plano
// por filas (para parseo posterior en el front, similar a extraerResumenAsesor).
async function extraerTodasLasTablas(page) {
    return await page.evaluate(() => {
        const tablas = Array.from(document.querySelectorAll('table'));
        return tablas.map(t => ({
            headerHint: t.innerText.slice(0, 80).replace(/\s+/g, ' '),
            filas: Array.from(t.querySelectorAll('tr')).map(tr =>
                Array.from(tr.querySelectorAll('td,th')).map(td => td.innerText.trim())
            ).filter(f => f.length > 0)
        })).filter(t => t.filas.length > 0);
    });
}

// Extrae cabecera (Asesor/Promotoría/GA + tarjetas de indicadores) + tabla
// "Resumen de Bonos", igual que extraerResumenAsesor pero reusable para
// Promotoría y Gerente de Agencia.
async function extraerResumenGeneral(page) {
    return await page.evaluate(() => {
        const bodyText = document.body.innerText || '';
        const lineas = bodyText.split('\n').map(l => l.trim()).filter(Boolean);
        const cabecera = { _raw: lineas.slice(0, 40) };

        const tablas = Array.from(document.querySelectorAll('table'));
        let resumenBonos = null;
        for (const t of tablas) {
            const headerText = t.innerText.slice(0, 200);
            if (/Bonos[\s\S]*Bono Mes[\s\S]*Acumulado/i.test(headerText) || /Bono Mes/i.test(headerText)) {
                resumenBonos = Array.from(t.querySelectorAll('tr')).map(tr =>
                    Array.from(tr.querySelectorAll('td,th')).map(td => td.innerText.trim())
                ).filter(f => f.length > 0);
                break;
            }
        }
        return { cabecera, resumenBonos, todoElTexto: bodyText };
    });
}

// Descarga el Reporte de Premios de la Promotoría (Bono Vida + Subsidios) y,
// desde ahí, el de la Gerente de Agencia (Bono Inicial + Apoyo).
async function procesarPromotoria(browser) {
    console.log(`\n🏢 Procesando reporte de PROMOTORÍA y GERENTE DE AGENCIA...`);
    const carpetaPromotoria = path.join(OUTPUT_DIR, 'PROMOTORIA');
    const carpetaGA = path.join(OUTPUT_DIR, 'GA_KAREN');
    if (!fs.existsSync(carpetaPromotoria)) fs.mkdirSync(carpetaPromotoria, { recursive: true });
    if (!fs.existsSync(carpetaGA)) fs.mkdirSync(carpetaGA, { recursive: true });

    const pages = await browser.pages();
    let page = pages.find(p => p.url().includes('lineamonterrey') || p.url().includes('asesordeseguros'));
    if (!page) throw new Error('No se encontró una pestaña logueada en el portal. Abre el portal e inicia sesión.');

    page.removeAllListeners('dialog');
    page.on('dialog', async (d) => { await d.dismiss().catch(() => {}); });

    let popupPromotor;
    const resultado = { timestamp: new Date().toISOString(), promotoria: {}, gerenteAgencia: {} };

    try {
        console.log('   🔗 Navegando a Reportes > Premios...');
        await page.goto('https://www.lineamonterrey.com.mx/AsesoresWeb/Reportes/Premios/Promotor/PremiosPromotor.aspx', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await delay(2500);

        console.log('   🖱️ Clic en "AMBRIZ Y DAVALOS SC"...');
        const clickNombre = await clickPorTexto(page, 'AMBRIZ Y DAVALOS SC', { tag: 'a' });
        if (!clickNombre) throw new Error('No se encontró el link de "AMBRIZ Y DAVALOS SC"');
        await delay(2000);

        console.log('   🖱️ Clic en "Aceptar"...');
        const esperaPromotor = esperarNuevaPagina(browser);
        const clickAceptar = await clickPorTexto(page, 'Aceptar');
        if (!clickAceptar) throw new Error('No se encontró el botón "Aceptar"');
        await delay(1500);
        popupPromotor = await esperaPromotor;
        console.log(`   ✅ Ventana Promotor abierta: ${popupPromotor.url()}`);
        await delay(2500);
        await volcarDebug(popupPromotor, '1_dashboard_promotoria', carpetaPromotoria);

        // --- Resumen general de la Promotoría (cabecera + Resumen de Bonos) ---
        resultado.promotoria.resumen = await extraerResumenGeneral(popupPromotor);

        // --- Bono Vida ---
        console.log('   🖱️ Clic en fila "Bono Vida"...');
        const clickBonoVida = await clickPorTexto(popupPromotor, 'Bono Vida');
        if (clickBonoVida) {
            await delay(2000);
            await volcarDebug(popupPromotor, '2_bono_vida', carpetaPromotoria);
            resultado.promotoria.bonoVidaTexto = await popupPromotor.evaluate(() => document.body.innerText);
            resultado.promotoria.bonoVidaTablas = await extraerTodasLasTablas(popupPromotor);

            // Prima Faltante Nva Org (botón dentro del modal de Bono Vida)
            console.log('   🖱️ Clic en "Ver Prima Faltante Nva Org."...');
            let clickFaltante = await clickPorTexto(popupPromotor, 'Ver Prima Faltante Nva Org.');
            if (!clickFaltante) clickFaltante = await clickPorTexto(popupPromotor, 'Ver Prima Faltante Nva Org', { exact: false });
            if (clickFaltante) {
                await delay(1500);
                await volcarDebug(popupPromotor, '3_prima_faltante', carpetaPromotoria);
                resultado.promotoria.primaFaltanteTablas = await extraerTodasLasTablas(popupPromotor);
                await cerrarModalActual(popupPromotor); // cierra el popup de Prima Faltante
                await delay(1000);
            } else {
                console.log('   ⚠️ No se encontró el botón "Ver Prima Faltante Nva Org."');
            }

            await cerrarModalActual(popupPromotor); // cierra el modal de Bono Vida
            await delay(1500);
        } else {
            console.log('   ⚠️ No se encontró la fila "Bono Vida" en el Resumen de Bonos');
        }

        // --- Subsidios ---
        console.log('   🖱️ Clic en fila "Subsidios"...');
        const clickSubsidios = await clickPorTexto(popupPromotor, 'Subsidios');
        if (clickSubsidios) {
            await delay(2000);
            await volcarDebug(popupPromotor, '4_subsidios', carpetaPromotoria);
            resultado.promotoria.subsidiosTexto = await popupPromotor.evaluate(() => document.body.innerText);
            resultado.promotoria.subsidiosTablas = await extraerTodasLasTablas(popupPromotor);
            await cerrarModalActual(popupPromotor);
            await delay(1500);
        } else {
            console.log('   ⚠️ No se encontró la fila "Subsidios" en el Resumen de Bonos');
        }

        fs.writeFileSync(path.join(carpetaPromotoria, 'data.json'), JSON.stringify(resultado.promotoria, null, 2));
        console.log('   💾 Guardado en premios/PROMOTORIA/data.json');

        // --- Gerente de Agencia (Karen): "GA" abre una lista ("Mis Gerentes de
        // Agencia") con DOS íconos por fila: una ❌/✅ de estatus de Apoyo (que
        // solo expande un mini-resumen inline si le da clic) y, más a la
        // derecha, un ícono ↗ real de navegación (<a target="_blank">) que abre
        // en pestaña nueva el dashboard completo de esa Gerente. Hay que
        // asegurarnos de clickear ESE, no el de estatus.
        console.log('   🖱️ Clic en indicador "GA"...');
        const clickGA = await clickPorTexto(popupPromotor, 'GA');
        if (!clickGA) {
            console.log('   ⚠️ No se encontró el indicador "GA" — se omite el reporte de Gerente de Agencia.');
        } else {
            await delay(1500);
            await volcarDebug(popupPromotor, '5a_lista_ga', carpetaGA);

            console.log('   🖱️ Clic en el ícono ↗ de detalle de Karen...');
            const esperaGA = esperarNuevaPagina(browser);
            const marcaIconoGA = `mcp-icono-ga-${Date.now()}`;
            const iconoGAEncontrado = await popupPromotor.evaluate((marca) => {
                const filas = Array.from(document.querySelectorAll('tr')).filter(tr => /karen/i.test(tr.innerText));
                for (const fila of filas) {
                    // Preferimos un <a> real con target="_blank" o href (el ↗
                    // de navegación); si no hay, tomamos el ÚLTIMO ícono de la
                    // fila (el ↗ está más a la derecha que la ❌ de estatus).
                    let clicable = fila.querySelector('a[target="_blank"], a[href]:not([href="#"])');
                    if (!clicable) {
                        const iconos = Array.from(fila.querySelectorAll('a, svg, i, [class*="icon"]'));
                        const ultimo = iconos[iconos.length - 1];
                        clicable = ultimo?.closest('a, button, td') || ultimo;
                    }
                    if (clicable) { clicable.setAttribute('data-mcp-target', marca); return true; }
                }
                return false;
            }, marcaIconoGA);
            let popupGA = null;
            if (iconoGAEncontrado) {
                const handleIconoGA = await popupPromotor.$(`[data-mcp-target="${marcaIconoGA}"]`);
                await handleIconoGA?.evaluate(el => el.scrollIntoView({ block: 'center' })).catch(() => {});
                try { await handleIconoGA.click(); } catch (e) { await handleIconoGA.evaluate(el => el.click()); }
                popupGA = await esperaGA.catch(() => null);
            } else {
                console.log('   ⚠️ No se encontró el ícono de detalle de Karen en la lista de Gerentes de Agencia');
            }

            const paginaGA = popupGA || popupPromotor;
            if (popupGA) {
                console.log('   ⏳ Esperando a que termine de redirigir a hojameta...');
                await esperarPaginaEstable(paginaGA);
            }
            await delay(1500);
            await volcarDebug(paginaGA, '5_dashboard_ga', carpetaGA);
            console.log(`   ✅ Reporte de GA en: ${paginaGA.url()}`);

            resultado.gerenteAgencia.resumen = await extraerResumenGeneral(paginaGA);

            // --- Bono Inicial (GA) ---
            console.log('   🖱️ Clic en fila "Bono Inicial"...');
            const clickBonoInicial = await clickPorTexto(paginaGA, 'Bono Inicial');
            if (clickBonoInicial) {
                await delay(2500); // el detalle de asesores (DataTable) puede tardar en cargar
                await volcarDebug(paginaGA, '6_bono_inicial_ga', carpetaGA);
                resultado.gerenteAgencia.bonoInicialTexto = await paginaGA.evaluate(() => document.body.innerText);
                resultado.gerenteAgencia.bonoInicialTablas = await extraerTodasLasTablas(paginaGA);
                await cerrarModalActual(paginaGA);
                await delay(1500);
            } else {
                console.log('   ⚠️ No se encontró la fila "Bono Inicial" en el Resumen de Bonos de GA');
            }

            // --- Apoyos (GA) ---
            console.log('   🖱️ Clic en fila "Apoyos"...');
            let clickApoyo = await clickPorTexto(paginaGA, 'Apoyos');
            if (!clickApoyo) clickApoyo = await clickPorTexto(paginaGA, 'Apoyo');
            if (!clickApoyo) clickApoyo = await clickPorTexto(paginaGA, 'Bono Apoyos', { exact: false });
            if (clickApoyo) {
                await delay(2000);
                await volcarDebug(paginaGA, '7_apoyo_ga', carpetaGA);
                resultado.gerenteAgencia.apoyoTexto = await paginaGA.evaluate(() => document.body.innerText);
                resultado.gerenteAgencia.apoyoTablas = await extraerTodasLasTablas(paginaGA);
                await cerrarModalActual(paginaGA);
                await delay(1500);
            } else {
                console.log('   ⚠️ No se encontró la fila "Apoyo" en el Resumen de Bonos de GA');
            }

            if (popupGA) await popupGA.close().catch(() => {});
        }

        fs.writeFileSync(path.join(carpetaGA, 'data.json'), JSON.stringify(resultado.gerenteAgencia, null, 2));
        console.log('   💾 Guardado en premios/GA_KAREN/data.json');

        return resultado;
    } finally {
        await popupPromotor?.close().catch(() => {});
    }
}

async function procesarAsesor(browser, clave, intento = 1) {
    console.log(`\n👤 Procesando clave ${clave} (intento ${intento}/${MAX_INTENTOS})...`);
    const carpetaAsesor = path.join(OUTPUT_DIR, clave);
    if (!fs.existsSync(carpetaAsesor)) fs.mkdirSync(carpetaAsesor, { recursive: true });

    const pages = await browser.pages();
    let page = pages.find(p => p.url().includes('lineamonterrey') || p.url().includes('asesordeseguros'));
    if (!page) {
        throw new Error('No se encontró una pestaña logueada en el portal. Abre el portal e inicia sesión.');
    }

    page.removeAllListeners('dialog');
    page.on('dialog', async (d) => {
        console.log(`      (debug) DIALOG del navegador: ${d.type()} -> "${d.message()}"`);
        await d.dismiss().catch(() => {});
    });

    let popupPromotor, popupAsesor;

    try {
        // 1. Ir a la pantalla de Reportes > Premios (nivel Promotor)
        console.log('   🔗 Navegando a Reportes > Premios...');
        await page.goto('https://www.lineamonterrey.com.mx/AsesoresWeb/Reportes/Premios/Promotor/PremiosPromotor.aspx', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await delay(2500);

        // 2. Clic en el nombre de la promotoría (AMBRIZ Y DAVALOS SC) para llenar la Clave
        console.log('   🖱️ Clic en "AMBRIZ Y DAVALOS SC"...');
        const clickNombre = await clickPorTexto(page, 'AMBRIZ Y DAVALOS SC', { tag: 'a' });
        if (!clickNombre) throw new Error('No se encontró el link de "AMBRIZ Y DAVALOS SC"');
        await delay(2000);

        // 3. Clic en Aceptar -> se abre ventana emergente (Promotor hojameta)
        console.log('   🖱️ Clic en "Aceptar"...');
        const esperaPromotor = esperarNuevaPagina(browser);
        const clickAceptar = await clickPorTexto(page, 'Aceptar');
        if (!clickAceptar) throw new Error('No se encontró el botón "Aceptar"');
        await delay(1500);
        await volcarDebug(page, '0_post_aceptar', carpetaAsesor);
        console.log(`      (debug) URL de la pestaña principal tras Aceptar: ${page.url()}`);
        popupPromotor = await esperaPromotor;
        console.log(`   ✅ Ventana Promotor abierta: ${popupPromotor.url()}`);
        await delay(2000);
        await volcarDebug(popupPromotor, '1_promotor', carpetaAsesor);

        // 4. Clic en el tile "LIMRA"
        console.log('   🖱️ Clic en tile "LIMRA"...');
        const clickLimra = await clickPorTexto(popupPromotor, 'LIMRA');
        if (!clickLimra) throw new Error('No se encontró el tile "LIMRA"');
        await delay(1500);
        await volcarDebug(popupPromotor, '1b_post_limra', carpetaAsesor);

        // 5. Clic en "Ver Detalle Asesores"
        console.log('   🖱️ Clic en "Ver Detalle Asesores"...');
        let clickDetalle = await clickPorTexto(popupPromotor, 'Ver Detalle Asesores');
        if (!clickDetalle) clickDetalle = await clickPorTexto(popupPromotor, 'Ver Detalle Asesores', { exact: false });
        if (!clickDetalle) {
            const botones = await popupPromotor.evaluate(() =>
                Array.from(document.querySelectorAll('button, a, [role="button"], div[onclick]')).map(el => ({
                    tag: el.tagName, texto: (el.textContent || '').trim().slice(0, 60)
                })).filter(b => b.texto)
            );
            console.log('      (debug) Botones/enlaces visibles en la página:', JSON.stringify(botones, null, 2));
            throw new Error('No se encontró el botón "Ver Detalle Asesores"');
        }
        await delay(1500);
        await volcarDebug(popupPromotor, '2_limra_detalle', carpetaAsesor);

        // 6. Buscar la clave en el buscador de la tabla (DataTables) para filtrar
        console.log(`   🔎 Buscando clave ${clave} en la tabla de asesores...`);
        const searchInput = await popupPromotor.$('input[type="search"]');
        if (!searchInput) throw new Error('No se encontró el campo de búsqueda de la tabla de asesores');
        await searchInput.click({ clickCount: 3 });
        await searchInput.type(clave, { delay: 50 });
        await delay(1500);
        await volcarDebug(popupPromotor, '3_busqueda', carpetaAsesor);

        // 7. Clic en el ícono ↗ de la fila resultante -> se abre ventana emergente del asesor
        console.log('   🖱️ Clic en el ícono de detalle del asesor...');
        const esperaAsesor = esperarNuevaPagina(browser);
        const marcaIcono = `mcp-icono-${Date.now()}`;
        const iconoEncontrado = await popupPromotor.evaluate((claveBuscada, marca) => {
            const filas = Array.from(document.querySelectorAll('tr')).filter(tr => tr.innerText.includes(claveBuscada));
            for (const fila of filas) {
                const link = fila.querySelector('a, svg, i, [class*="icon"]');
                const clicable = link?.closest('a, button, td');
                if (clicable) { clicable.setAttribute('data-mcp-target', marca); return true; }
            }
            return false;
        }, clave, marcaIcono);
        if (!iconoEncontrado) throw new Error('No se encontró el ícono ↗ en la fila del asesor');
        const handleIcono = await popupPromotor.$(`[data-mcp-target="${marcaIcono}"]`);
        if (!handleIcono) throw new Error('No se pudo obtener el handle del ícono del asesor');
        await handleIcono.evaluate(el => el.scrollIntoView({ block: 'center' })).catch(() => {});
        try {
            await handleIcono.click();
        } catch (e) {
            console.log(`   ⚠️ Clic real falló ("${e.message}"), usando clic JS de respaldo...`);
            await handleIcono.evaluate(el => el.click());
        }
        popupAsesor = await esperaAsesor;
        console.log(`   ✅ Ventana Asesor abierta: ${popupAsesor.url()}`);
        // Damos tiempo de sobra a que hojameta termine de traer los datos por AJAX
        // (a veces tarda y si leemos muy pronto todo sale en 0).
        await delay(intento === 1 ? 3500 : 6000);
        await volcarDebug(popupAsesor, '4_dashboard_asesor', carpetaAsesor);

        // 8. Extraer resumen (tarjetas + tabla "Resumen de Bonos")
        const resumen = await extraerResumenAsesor(popupAsesor);

        // Detección de "todo en cero" / carga fallida: hojameta a veces tarda en
        // traer los datos y deja los indicadores del encabezado clavados en 0.
        // Tomamos todos los valores numéricos de la cabecera (Prima Meta, LIMRA,
        // IGC, Prima Renov, etc.) y si TODOS son cero, asumimos que no cargó bien
        // (es extremadamente raro que un asesor activo tenga absolutamente todo en 0).
        const valoresCabecera = (resumen.cabecera._raw || [])
            .map(l => l.replace(/[^0-9.]/g, ''))
            .filter(l => l.length > 0)
            .map(Number)
            .filter(n => !Number.isNaN(n));
        const todoCero = valoresCabecera.length > 0 && valoresCabecera.every(n => n === 0);

        const pareceVacio = !resumen.resumenBonos || resumen.resumenBonos.length === 0 ||
            resumen.todoElTexto.trim().length < 100 || todoCero;

        if (pareceVacio && intento < MAX_INTENTOS) {
            console.log(`   ⚠️ La página cargó vacía/en ceros (posible falla de hojameta, todoCero=${todoCero}). Recargando y reintentando...`);
            await popupAsesor.close().catch(() => {});
            await popupPromotor.close().catch(() => {});
            await delay(4000);
            return await procesarAsesor(browser, clave, intento + 1);
        }

        // 9. Intentar abrir el detalle de "Bono Vida" o "Bono TA"/"Training Allowance"
        console.log('   🖱️ Intentando abrir detalle de bono (Vida / TA)...');
        let detalleAbierto = await clickPorTexto(popupAsesor, 'Bono Vida');
        if (!detalleAbierto) detalleAbierto = await clickPorTexto(popupAsesor, 'Bono TA');
        if (!detalleAbierto) detalleAbierto = await clickPorTexto(popupAsesor, 'Bono Training Allowance', { exact: false });
        await delay(2000);
        await volcarDebug(popupAsesor, '5_detalle_bono', carpetaAsesor);

        const detalleModal = await popupAsesor.evaluate(() => document.body.innerText);

        const rutaDataJson = path.join(carpetaAsesor, 'data.json');
        const indicesAnteriores = leerIndicesAnteriores(rutaDataJson);

        // Desglose Inicial vs Renovación de lo ya anticipado — solo aplica a Bono
        // Vida (Nuevo Profesional). Bono TA no separa Inicial/Renovación.
        const tipoCab = extraerCampoCabecera(resumen.cabecera._raw, 'Tipo') || '';
        const esBonoVida = tipoCab && !/training/i.test(tipoCab);
        let anticiposDesglosados = null;
        if (esBonoVida) {
            const avanceAlCab = extraerCampoCabecera(resumen.cabecera._raw, 'Avance Al');
            const semestreKeyActual = calcularSemestreKey(avanceAlCab);
            if (semestreKeyActual) {
                const montosActuales = parseMontosVida(detalleModal);
                const anticiposAnteriores = leerAnticiposAnteriores(rutaDataJson);
                anticiposDesglosados = calcularAnticiposDesglosados({
                    anterior: anticiposAnteriores,
                    montoBonoInicialActual: montosActuales.montoBonoInicial,
                    montoBonoRenovacionActual: montosActuales.montoBonoRenovacion,
                    bonosAnticipadosActual: montosActuales.bonosAnticipados,
                    semestreKeyActual,
                });
            }
        }

        const resultado = {
            clave,
            timestamp: new Date().toISOString(),
            urlDashboard: popupAsesor.url(),
            resumen,
            pareceVacio,
            detalleModalTexto: detalleModal,
            intentos: intento,
            indicesAnteriores,
            anticiposDesglosados
        };

        fs.writeFileSync(rutaDataJson, JSON.stringify(resultado, null, 2));
        console.log(`   💾 Guardado en premios/${clave}/data.json`);
        if (indicesAnteriores) {
            console.log(`   📊 Índices anteriores: LIMRA ${indicesAnteriores.limra}% · IGC ${indicesAnteriores.igc}%`);
        }
        if (anticiposDesglosados) {
            console.log(`   💰 Anticipos desglosados: Inicial ${anticiposDesglosados.inicialAnticipadoAcumulado} · Renovación ${anticiposDesglosados.renovacionAnticipadoAcumulado}`);
        }

        return resultado;

    } finally {
        await popupAsesor?.close().catch(() => {});
        await popupPromotor?.close().catch(() => {});
    }
}

async function main() {
    const soloPromotoria = CLAVES.includes('--promotoria');
    const clavesAsesores = CLAVES.filter(c => c !== '--promotoria');

    if (clavesAsesores.length === 0 && !soloPromotoria) {
        console.error('❌ Debes indicar al menos una clave, o --promotoria. Ej: node descargar_premios.js 47116 117440');
        console.error('   Para el reporte de Promotoría + Gerente de Agencia: node descargar_premios.js --promotoria');
        process.exit(1);
    }

    console.log('🚀 Iniciando descarga de Reportes de Premios...');
    if (clavesAsesores.length > 0) console.log(`   Claves a procesar: ${clavesAsesores.join(', ')}`);
    if (soloPromotoria) console.log('   + Reporte de Promotoría / Gerente de Agencia');

    let browser;
    try {
        browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9223', defaultViewport: null });
    } catch (e) {
        console.error('❌ No se pudo conectar al navegador. Asegúrate de ejecutar: node lanzar_navegador_premios.js e iniciar sesión.');
        process.exit(1);
    }

    if (soloPromotoria) {
        try {
            await procesarPromotoria(browser);
        } catch (err) {
            console.error('   ❌ Error procesando Promotoría/GA:', err.message);
        }
        await delay(1500);
    }

    const resultados = [];
    const fallidos = [];

    for (const clave of clavesAsesores) {
        try {
            const r = await procesarAsesor(browser, clave);
            resultados.push(r);
            if (r.pareceVacio) fallidos.push(clave);
        } catch (err) {
            console.error(`   ❌ Error con clave ${clave}:`, err.message);
            fallidos.push(clave);
        }
        await delay(2000);
    }

    console.log('\n✨ Proceso completado.');
    console.log(`   ✅ Procesados: ${resultados.length}/${clavesAsesores.length}`);
    if (fallidos.length > 0) {
        console.log(`   ⚠️ Necesitan revisión manual (Opción B): ${fallidos.join(', ')}`);
    }

    browser.disconnect();
    process.exit(0);
}

main().catch(err => {
    console.error('💥 Error fatal:', err);
    process.exit(1);
});
