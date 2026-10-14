// Funciones puras / sin navegador de correr_pagado_automatico.js, separadas para
// poder probarlas sin abrir Chrome ni tocar el servidor.
import fs from 'fs';
import path from 'path';

const MES = { ene: 1, feb: 2, mar: 3, abr: 4, may: 5, jun: 6, jul: 7, ago: 8, sep: 9, set: 9, oct: 10, nov: 11, dic: 12 };
const quitarAcentos = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

/** "6 de octubre de 2026" / "29 de SEP de 2026" -> "2026-10-06". null si no se entiende. */
export function fechaClave(texto) {
    const s = quitarAcentos(String(texto || '').toLowerCase());
    const m = s.match(/(\d{1,2})\s+(?:de\s+)?([a-z]{3,})\s+(?:de\s+)?(\d{2,4})/);
    if (!m) return null;
    const mes = MES[m[2].slice(0, 3)];
    if (!mes) return null;
    let anio = parseInt(m[3], 10);
    if (anio < 100) anio += 2000;
    return `${anio}-${String(mes).padStart(2, '0')}-${String(parseInt(m[1], 10)).padStart(2, '0')}`;
}

/** Compara la fecha de corte del portal contra la que muestra la app.
 *  'nuevo' = el portal trae un corte más reciente; 'igual'; 'anterior' = el portal
 *  trae algo más viejo que la app (no se aplica); 'ilegible' = no se pudo interpretar. */
export function evaluarCambio(fechaPortal, fechaApp) {
    const p = fechaClave(fechaPortal);
    if (!p) return 'ilegible';
    const a = fechaClave(fechaApp);
    if (!a) return 'nuevo'; // la app no tiene fecha previa: lo del portal es lo más actual
    if (p === a) return 'igual';
    return p > a ? 'nuevo' : 'anterior';
}

/** Copia rutas relativas (archivos o carpetas) de baseDir a destino, conservando su estructura. */
export function respaldar(baseDir, rutas, destino) {
    for (const rel of rutas) {
        const origen = path.join(baseDir, rel);
        if (!fs.existsSync(origen)) continue;
        const dest = path.join(destino, rel);
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.cpSync(origen, dest, { recursive: true, force: true });
    }
}

/** Devuelve a baseDir lo respaldado con respaldar(). */
export function restaurar(baseDir, rutas, destino) {
    for (const rel of rutas) {
        const respaldo = path.join(destino, rel);
        if (!fs.existsSync(respaldo)) continue;
        fs.cpSync(respaldo, path.join(baseDir, rel), { recursive: true, force: true });
    }
}

/** Id más alto del historial de comunicados (los ids son Date.now() como texto). */
export function ultimoIdComunicado(lista) {
    return (Array.isArray(lista) ? lista : []).reduce((max, it) => Math.max(max, Number(it.id) || 0), 0);
}

/** Comunicados posteriores a `desdeId` cuyo título/cuerpo coincide con `patron`. */
export function comunicadosNuevos(lista, desdeId, patron) {
    return (Array.isArray(lista) ? lista : []).filter(
        it => (Number(it.id) || 0) > desdeId && patron.test(`${it.title || ''} ${it.body || ''}`),
    );
}
