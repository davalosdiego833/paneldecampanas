// Convierte el texto crudo capturado por descargar_premios.js (innerText de las
// páginas de hojameta) en objetos limpios y tipados. hojameta renderiza sus tablas
// como filas separadas por \n y celdas separadas por \t, así que es parseable de
// forma confiable sin tener que volver a tocar el navegador.

export function limpiarNumero(v: string | undefined): number {
    if (!v) return 0;
    const n = parseFloat(v.replace(/[^0-9.-]/g, ''));
    return Number.isNaN(n) ? 0 : n;
}

export function limpiarPorcentaje(v: string | undefined): number {
    return limpiarNumero(v);
}

// La cabecera (cabecera._raw) es un arreglo plano: primero 5 strings "Etiqueta: valor",
// luego pares alternados [Etiqueta, Valor, Etiqueta, Valor, ...] hasta "Histórico de Bonos".
export interface CabeceraPremios {
    asesor: string;
    clave: string;
    avanceAl: string;
    fechaConcurso: string;
    tipo: string;
    indicadores: Record<string, string>;
}

export function parseCabecera(raw: string[]): CabeceraPremios {
    const cab: CabeceraPremios = { asesor: '', clave: '', avanceAl: '', fechaConcurso: '', tipo: '', indicadores: {} };
    let i = 0;
    for (; i < raw.length; i++) {
        const linea = raw[i];
        const m = linea.match(/^(Asesor|Clave|Avance Al|Fecha Concurso|Tipo):\s*(.*)$/);
        if (m) {
            const key = m[1];
            const val = m[2].trim();
            if (key === 'Asesor') cab.asesor = val;
            else if (key === 'Clave') cab.clave = val;
            else if (key === 'Avance Al') cab.avanceAl = val;
            else if (key === 'Fecha Concurso') cab.fechaConcurso = val;
            else if (key === 'Tipo') cab.tipo = val;
        } else {
            break;
        }
    }
    // A partir de aquí vienen pares Etiqueta/Valor hasta llegar a "Histórico de Bonos"
    for (; i < raw.length - 1; i += 2) {
        const label = raw[i];
        const val = raw[i + 1];
        if (/^Histórico/i.test(label)) break;
        cab.indicadores[label] = val;
    }
    return cab;
}

// Extrae un mapa Etiqueta -> [valores de las demás columnas de esa fila] a partir
// del texto completo del modal de detalle (tablas tipo "Bonos | Real | Meta | Cumple").
export function mapaFilasTabla(texto: string): Record<string, string[]> {
    const mapa: Record<string, string[]> = {};
    const lineas = texto.split('\n');
    for (const linea of lineas) {
        if (!linea.includes('\t')) continue;
        const celdas = linea.split('\t').map(c => c.trim());
        const etiqueta = celdas[0].trim();
        if (!etiqueta) continue;
        // Solo guardamos la primera vez que aparece cada etiqueta (evita pisar
        // "Bono Inicial" del resumen con el de la sub-sección de Renovación)
        if (!(etiqueta in mapa)) {
            mapa[etiqueta] = celdas.slice(1);
        }
    }
    return mapa;
}

export interface DetalleTA {
    mes: number;
    polizasMesVI: number;
    polizasMesGMMI: number;
    polizasSemVI: number;
    polizasSemVIMeta: number;
    polizasSemVIGMMI: number;
    polizasSemVIGMMIMeta: number;
    comisionMetaMes: number;
    comisionMetaSem: number;
    comisionMetaSemMeta: number;
    comisionPagoSem: number;
    pctBonoInicial: number;
    bonoCalculado: number;
    bonoTope: number;
    excedente: number;
    pctBonoExcedente: number;
    bonoExcedente: number;
    bonoTA: number;
    bonoSemestral: number;
    bonosAnticipados: number;
    bonoAPagar: number;
}

export function parseDetalleTA(texto: string): DetalleTA {
    const m = mapaFilasTabla(texto);
    const mesMatch = texto.match(/Mes\s*\n?\s*(\d+)/);
    return {
        mes: mesMatch ? Number(mesMatch[1]) : 0,
        polizasMesVI: limpiarNumero(m['Pólizas Mes VI']?.[0]),
        polizasMesGMMI: limpiarNumero(m['Pólizas Mes GMMI']?.[0]),
        polizasSemVI: limpiarNumero(m['Pólizas Sem VI']?.[0]),
        polizasSemVIMeta: limpiarNumero(m['Pólizas Sem VI']?.[1]),
        polizasSemVIGMMI: limpiarNumero(m['Pólizas Sem VI+GMMI']?.[0]),
        polizasSemVIGMMIMeta: limpiarNumero(m['Pólizas Sem VI+GMMI']?.[1]),
        comisionMetaMes: limpiarNumero(m['Comisión Meta Mes']?.[0]),
        comisionMetaSem: limpiarNumero(m['Comisión Meta Sem']?.[0]),
        comisionMetaSemMeta: limpiarNumero(m['Comisión Meta Sem']?.[1]),
        comisionPagoSem: limpiarNumero(m['Comisión Pago Sem']?.[0]),
        pctBonoInicial: limpiarPorcentaje(m['% Bono Inicial']?.[0]),
        bonoCalculado: limpiarNumero(m['Bono Calculado']?.[0]),
        bonoTope: limpiarNumero(m['Bono Tope']?.[0]),
        excedente: limpiarNumero(m['Excedente']?.[0]),
        pctBonoExcedente: limpiarPorcentaje(m['% Bono Excedente']?.[0]),
        bonoExcedente: limpiarNumero(m['Bono Excedente']?.[0]),
        bonoTA: limpiarNumero(m['Bono TA']?.[0]),
        bonoSemestral: limpiarNumero(m['Bono Semestral']?.[0]),
        bonosAnticipados: limpiarNumero(m['Bonos Anticipados']?.[0]),
        bonoAPagar: limpiarNumero(m['Bono a Pagar']?.[0]),
    };
}

export interface DetalleVida {
    polizaMes: number;
    polizaMesMeta: number;
    polizasSemestre: number;
    polizasSemestreMeta: number;
    polizasAnual: number;
    polizasAnualMeta: number;
    primaMetaMes: number;
    primaMetaSem: number;
    grupoCalculado: number;
    grupoTope: number;
    limra: number;
    primaPagoSem: number;
    pctBonoInicial: number;
    montoBonoInicial: number;
    igc: number;
    primaRenovacionSem: number;
    pctBonoRenovacion: number;
    montoBonoRenovacion: number;
    bonoSemestral: number;
    bonosAnticipados: number;
    bonosAPagar: number;
}

export function parseDetalleVida(texto: string): DetalleVida {
    const m = mapaFilasTabla(texto);
    return {
        polizaMes: limpiarNumero(m['Póliza Mes']?.[0]),
        polizaMesMeta: limpiarNumero(m['Póliza Mes']?.[1]),
        polizasSemestre: limpiarNumero(m['Pólizas Semestre']?.[0]),
        polizasSemestreMeta: limpiarNumero(m['Pólizas Semestre']?.[1]),
        polizasAnual: limpiarNumero(m['Pólizas Anual']?.[0]),
        polizasAnualMeta: limpiarNumero(m['Pólizas Anual']?.[1]),
        primaMetaMes: limpiarNumero(m['Prima Meta Mes']?.[0]),
        primaMetaSem: limpiarNumero(m['Prima Meta Sem']?.[0]),
        grupoCalculado: limpiarNumero(m['Grupo Calculado']?.[0]),
        grupoTope: limpiarNumero(m['Grupo Tope']?.[0]),
        limra: limpiarPorcentaje(m['LIMRA']?.[0]),
        primaPagoSem: limpiarNumero(m['Prima Pago Sem']?.[0]),
        pctBonoInicial: limpiarPorcentaje(m['% Bono Inicial']?.[0]),
        // "Bono Inicial" aparece 2 veces en el texto: la 1a (aquí, header con monto en $)
        // y una 2a vacía dentro de la sub-sección de Bono Renovación (solo checkmark de
        // dependencia) — mapaFilasTabla se queda con la 1a, que es justo la que trae el monto.
        montoBonoInicial: limpiarNumero(m['Bono Inicial']?.[0]),
        igc: limpiarPorcentaje(m['IGC']?.[0]),
        primaRenovacionSem: limpiarNumero(m['Prima Renovación Sem']?.[0]),
        pctBonoRenovacion: limpiarPorcentaje(m['% Bono Renovación']?.[0]),
        montoBonoRenovacion: limpiarNumero(m['Bono Renovación']?.[0]),
        bonoSemestral: limpiarNumero(m['Bono Semestral']?.[0]),
        bonosAnticipados: limpiarNumero(m['Bonos Anticipados']?.[0]),
        bonosAPagar: limpiarNumero(m['Bonos a Pagar']?.[0] || m['Bono a Pagar']?.[0]),
    };
}

export interface FilaResumenBono {
    nombre: string;
    bonoMes: number;
    bonoAcumulado: number;
}

// resumen.resumenBonos ya viene como array de arrays [Bonos, Bono Mes, Bono Acumulado, Gana, ...]
export function parseResumenBonos(filas: string[][] | null): FilaResumenBono[] {
    if (!filas || filas.length < 2) return [];
    return filas.slice(1, filas.length - 1) // quita encabezado y fila "Total"
        .map(f => ({
            nombre: f[0],
            bonoMes: limpiarNumero(f[1]),
            bonoAcumulado: limpiarNumero(f[2]),
        }));
}
