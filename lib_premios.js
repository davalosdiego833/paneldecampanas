// Funciones puras / sin navegador de correr_premios_automatico.js, separadas para
// poder probarlas sin abrir Chrome ni tocar el portal.
//
// Idea: antes de bajar los reportes completos, el script lee la fecha de corte
// ("Avance Al") que trae el portal y la compara contra lo que ya tenemos guardado
// en premios/<clave>/data.json. Solo si el portal trae un corte más nuevo corre el
// trabajo completo; si no, solo avisa que no hay actualización.
import fs from 'fs';
import path from 'path';

const pad = (n) => String(n).padStart(2, '0');

/** "30-09-2026" (o con "/") -> "2026-09-30", comparable como texto. null si no se entiende. */
export function fechaClave(texto) {
    const m = String(texto || '').match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (!m) return null;
    const dia = parseInt(m[1], 10), mes = parseInt(m[2], 10), anio = parseInt(m[3], 10);
    if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;
    return `${anio}-${pad(mes)}-${pad(dia)}`;
}

/** Saca el texto de "Avance Al: dd-mm-yyyy" de las primeras líneas de la cabecera de un reporte. */
export function fechaAvanceAl(rawCabecera) {
    if (!Array.isArray(rawCabecera)) return null;
    for (const linea of rawCabecera) {
        const m = String(linea).match(/^Avance Al:\s*(.+)$/);
        if (m) return m[1].trim();
    }
    return null;
}

/** Lee, de cada premios/<clave>/data.json, su fecha de corte y si la captura salió incompleta.
 *  Devuelve [{ clave, existe, fecha, pareceVacio }]. */
export function leerEstadoGuardado(premiosDir, claves) {
    return claves.map((clave) => {
        const ruta = path.join(premiosDir, clave, 'data.json');
        const estado = { clave, existe: fs.existsSync(ruta), fecha: null, pareceVacio: false };
        if (!estado.existe) return estado;
        try {
            const d = JSON.parse(fs.readFileSync(ruta, 'utf-8'));
            estado.fecha = fechaAvanceAl(d?.resumen?.cabecera?._raw);
            estado.pareceVacio = d?.pareceVacio === true;
        } catch { /* archivo ilegible: queda sin fecha y se trata como "faltan datos" */ }
        return estado;
    });
}

/** Decide qué hacer comparando el corte del portal contra el MÁS VIEJO de lo guardado
 *  (así, si algún asesor se quedó atrás en una corrida anterior, se vuelve a intentar).
 *    'correr'   = hay corte nuevo (o faltan datos): bajar todo.
 *    'omitir'   = el portal trae el mismo corte (motivo 'igual') o uno más viejo ('anterior').
 *    'ilegible' = no se pudo interpretar la fecha del portal: no se asume nada. */
export function decidirAccion(fechaPortal, estado) {
    const p = fechaClave(fechaPortal);
    const sinDatos = estado.filter((e) => !fechaClave(e.fecha)).map((e) => e.clave);
    const incompletas = estado.filter((e) => e.pareceVacio).map((e) => e.clave);
    const base = { fechaPortal, sinDatos, incompletas, fechaGuardada: null, claveMasVieja: null };

    if (!p) return { ...base, accion: 'ilegible', motivo: 'ilegible' };

    const conFecha = estado
        .filter((e) => fechaClave(e.fecha))
        .sort((a, b) => fechaClave(a.fecha).localeCompare(fechaClave(b.fecha)));
    const masVieja = conFecha[0] || null;
    if (masVieja) {
        base.fechaGuardada = masVieja.fecha;
        base.claveMasVieja = masVieja.clave;
    }

    if (sinDatos.length > 0) return { ...base, accion: 'correr', motivo: 'faltan_datos' };
    if (p > fechaClave(masVieja.fecha)) return { ...base, accion: 'correr', motivo: 'corte_nuevo' };
    if (p === fechaClave(masVieja.fecha)) return { ...base, accion: 'omitir', motivo: 'igual' };
    return { ...base, accion: 'omitir', motivo: 'anterior' };
}
