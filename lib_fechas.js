// Fecha de corte REAL de las campañas: la línea "Avance ... al <día> de <mes> <año>." de la hoja.
//
// Existe porque el escáner genérico (extractCutoffDate) exige "mes" seguido de espacio y NO
// reconoce la coma que pone Convenciones Asesores ("al 07 de octubre, 2026."). Al no leer esa
// línea se pasaba a la siguiente — "IGC Y LIMRA al 30 de septiembre 2026." — que es solo el
// cierre de mes de IGC/LIMRA, y el corte real de la campaña se veía una semana atrasado.
const AVANCE = /avance[\s\S]*?\bal\s+(\d{1,2})\s+(?:de\s+)?([a-záéíóúñ]{3,}),?\s+(?:de\s+)?(\d{4})/i;

/** "Avance del 1 de julio,  al 07 de octubre, 2026." -> "07 de octubre de 2026". null si no coincide. */
export function fechaDeAvance(texto) {
    const m = String(texto || '').match(AVANCE);
    return m ? `${m[1]} de ${m[2]} de ${m[3]}` : null;
}

const MESES_ABBR = { ENE: 'enero', FEB: 'febrero', MAR: 'marzo', ABR: 'abril', MAY: 'mayo', JUN: 'junio', JUL: 'julio', AGO: 'agosto', SEP: 'septiembre', OCT: 'octubre', NOV: 'noviembre', DIC: 'diciembre' };

/** Convenciones Promotores: el corte real viene en el nombre del archivo que aparece en B16
 *  ("U:\...\10 Convenciones Promotores 14-OCT-2026 .xlsx" -> "14 de octubre 2026"; mismo formato que
 *  usa actualizar_snapshot.js). B17 ("IGC Y LIMRA al 13 de octubre") es solo el cierre de IGC/LIMRA. */
export function fechaDeNombreArchivo(texto) {
    const m = String(texto || '').match(/(\d{1,2})-([A-Za-z]{3})-(\d{4})/);
    const mes = m && MESES_ABBR[m[2].toUpperCase()];
    return mes ? `${Number(m[1])} de ${mes} ${m[3]}` : null;
}

/** Busca la línea de "Avance" en las primeras 35 filas de una hoja (objeto de SheetJS). */
export function fechaDeAvanceEnHoja(ws, XLSX) {
    if (!ws) return null;
    const filas = XLSX.utils.sheet_to_json(ws, { header: 1, range: 0 });
    for (let r = 0; r < Math.min(filas.length, 35); r++) {
        for (const celda of filas[r] || []) {
            if (typeof celda !== 'string' || !/avance/i.test(celda)) continue;
            const f = fechaDeAvance(celda);
            if (f) return f;
        }
    }
    return null;
}
