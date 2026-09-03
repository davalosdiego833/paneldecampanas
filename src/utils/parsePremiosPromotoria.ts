// Parsers para los reportes de Premios de la Promotoría y de Gerente de Agencia.
// A diferencia de los asesores (que se parsean del innerText tabulado), aquí
// preferimos las tablas ya extraídas del DOM (`extraerTodasLasTablas` en
// descargar_premios.js) porque vienen perfectamente columnadas — mucho más
// confiable que intentar separar por tabs el texto plano.

import { limpiarNumero, limpiarPorcentaje, FilaResumenBono, mapaFilasTabla } from './parsePremiosDetalle';

export interface TablaCruda { headerHint: string; filas: string[][] }

// ---------------------------------------------------------------------------
// Cabecera común (Promotoría y GA comparten la misma estructura de tarjetas)
// ---------------------------------------------------------------------------
export interface CabeceraGeneral {
    nombre: string;
    clave: string;
    avanceAl: string;
    fechaConexion: string;
    tipo: string;
    indicadores: Record<string, string>;
}

export function parseCabeceraGeneral(raw: string[]): CabeceraGeneral {
    const cab: CabeceraGeneral = { nombre: '', clave: '', avanceAl: '', fechaConexion: '', tipo: '', indicadores: {} };
    let i = 0;
    for (; i < raw.length; i++) {
        const linea = raw[i];
        const m = linea.match(/^(Clave|Avance Al|Fecha Conex|Tipo):\s*(.*)$/);
        if (m) {
            const val = m[2].trim();
            if (m[1] === 'Clave') cab.clave = val;
            else if (m[1] === 'Avance Al') cab.avanceAl = val;
            else if (m[1] === 'Fecha Conex') cab.fechaConexion = val;
            else if (m[1] === 'Tipo') cab.tipo = val;
        } else if (i === 0) {
            cab.nombre = linea.trim();
        } else {
            break;
        }
    }
    for (; i < raw.length - 1; i += 2) {
        const label = raw[i];
        const val = raw[i + 1];
        if (/^Histórico|^×$/i.test(label)) break;
        cab.indicadores[label] = val;
    }
    return cab;
}

// Busca en `tablas` la primera cuyo header (o primera fila) cumpla `test`.
function buscarTabla(tablas: TablaCruda[], test: (primeraFila: string[], hint: string) => boolean): TablaCruda | null {
    return tablas.find(t => t.filas[0] && test(t.filas[0], t.headerHint)) || null;
}

// Variante que revisa TODAS las filas de la tabla (no solo la primera) — útil
// cuando la fila que identifica a la tabla no es la de encabezado (ej. el
// histórico de Apoyos trae "Gana"/"% Cump" en filas intermedias, no en la 0).
function buscarTablaPorAlgunaFila(tablas: TablaCruda[], test: (fila: string[]) => boolean): TablaCruda | null {
    return tablas.find(t => t.filas.some(test)) || null;
}

// La tabla "Resumen de Bonos" (Bonos | Bono Mes | Bono Acumulado | Gana) es
// idéntica en estructura a la de Asesores — reusamos el mismo parser.
export function parseResumenBonosDesdeTablas(tablas: TablaCruda[]): FilaResumenBono[] {
    const t = buscarTabla(tablas, f => /Bono Mes/i.test(f.join(' ')) && /Acumulado/i.test(f.join(' ')));
    if (!t) return [];
    return t.filas.slice(1, t.filas.length - 1).map(f => ({
        nombre: f[0].replace(/\s+/g, ' ').trim(),
        bonoMes: limpiarNumero(f[1]),
        bonoAcumulado: limpiarNumero(f[2]),
    }));
}

// ---------------------------------------------------------------------------
// PROMOTORÍA — Bono Vida (Inicial + Crecimiento + Renovación)
// ---------------------------------------------------------------------------
export interface DetalleBonoVidaPromotoria {
    mes: number;
    // Bono Inicial
    primaMetaNOMes: number;
    primaMetaNOSem: number;
    grupo: number | null;
    ganadoresTA: number;
    ganadoresTAMin: number;
    limra: number;
    primaPagoNOSem: number;
    primaPagoConsSem: number;
    pctBonoInicialNO: number;
    pctBonoInicialCons: number;
    // Bono Crecimiento
    primaMetaNOSemAnoAnt: number;
    primaMetaNOSemAnoAct: number;
    crecimientoPct: number;
    altasSemestre: number;
    pctBonoCrecimiento: number;
    // Bono Renovación
    igc: number;
    primaPagoRenovacionNOSem: number;
    primaPagoRenovacionConsSem: number;
    pctBonoRenovacionNO: number;
    pctBonoRenovacionCons: number;
    // Totales (montos que ya calcula el portal, tal cual)
    bonoInicialTotal: number;
    bonoCrecimientoTotal: number;
    bonoRenovacionTotal: number;
    bonoSemestral: number;
    bonosAnticipados: number;
    bonosAPagar: number;
}

export function parseBonoVidaPromotoria(texto: string): DetalleBonoVidaPromotoria {
    const m = mapaFilasTabla(texto);
    const mesMatch = texto.match(/Resumen Bono Vida\s*Mes\s*(\d+)/i) || texto.match(/Mes\s*(\d+)/);
    const grupoTxt = m['Prima Meta Asesores Nueva Organización Sem']?.[1] || '';
    const grupoMatch = grupoTxt.match(/Gpo:?\s*(\d+)/i);
    const grupo = grupoMatch ? Number(grupoMatch[1]) : null;

    return {
        mes: mesMatch ? Number(mesMatch[1]) : 0,
        primaMetaNOMes: limpiarNumero(m['Prima Meta Asesores Nueva Organización Mes']?.[0]),
        primaMetaNOSem: limpiarNumero(m['Prima Meta Asesores Nueva Organización Sem']?.[0]),
        grupo: grupo && grupo > 0 ? grupo : null,
        ganadoresTA: limpiarNumero(m['Ganadores TA']?.[0]),
        ganadoresTAMin: limpiarNumero(m['Ganadores TA']?.[1]),
        limra: limpiarPorcentaje(m['LIMRA']?.[0]),
        primaPagoNOSem: limpiarNumero(m['Prima Pago Asesores Nueva Organización Sem']?.[0]),
        primaPagoConsSem: limpiarNumero(m['Prima Pago Asesores Consolidados Sem']?.[0]),
        pctBonoInicialNO: limpiarPorcentaje(m['% Bono Inicial Nueva Organización']?.[0]),
        pctBonoInicialCons: limpiarPorcentaje(m['% Bono Inicial Consolidados']?.[0]),
        primaMetaNOSemAnoAnt: limpiarNumero(m['Prima Meta Asesores Nva Organización Semestre Año Ant']?.[0]),
        primaMetaNOSemAnoAct: limpiarNumero(m['Prima Meta Asesores Nva Organización Semestre Año Act']?.[0]),
        crecimientoPct: limpiarPorcentaje(m['Crecimiento Prima Meta Nva Organización']?.[0]),
        altasSemestre: limpiarNumero(m['Altas del Semestre Actual']?.[0]),
        pctBonoCrecimiento: limpiarPorcentaje(m['% del Bono de Crecimiento']?.[0]),
        igc: limpiarPorcentaje(m['IGC']?.[0]),
        primaPagoRenovacionNOSem: limpiarNumero(m['Prima Pago Renovación Nva Org Sem']?.[0]),
        primaPagoRenovacionConsSem: limpiarNumero(m['Prima Pago Renovación Cons Sem']?.[0]),
        pctBonoRenovacionNO: limpiarPorcentaje(m['% Bono Renovación Nva Org']?.[0]),
        pctBonoRenovacionCons: limpiarPorcentaje(m['% Bono Renovación Cons']?.[0]),
        bonoInicialTotal: limpiarNumero(m['Bono Inicial']?.[0]),
        bonoCrecimientoTotal: limpiarNumero(m['Bono Crecimiento']?.[0]),
        bonoRenovacionTotal: limpiarNumero(m['Bono Renovación']?.[0]),
        bonoSemestral: limpiarNumero(m['Bono Semestral']?.[0]),
        bonosAnticipados: limpiarNumero(m['Bonos Anticipados']?.[0]),
        bonosAPagar: limpiarNumero(m['Bonos a Pagar']?.[0]),
    };
}

// Tabla "Prima Faltante Nueva Organización": Grupo | mes1..mesN | % Bono
export interface PrimaFaltantePromotoria {
    meses: string[];
    filas: { grupo: number; faltantePorMes: (number | null)[]; pctBono: number }[];
}

export function parsePrimaFaltantePromotoria(tablas: TablaCruda[]): PrimaFaltantePromotoria | null {
    const t = buscarTabla(tablas, f => f[0] === 'Grupo' && /%\s*Bono/i.test(f[f.length - 1] || ''));
    if (!t) return null;
    const header = t.filas[0];
    const meses = header.slice(1, header.length - 1);
    const filas = t.filas.slice(1).map(f => ({
        grupo: limpiarNumero(f[0]),
        faltantePorMes: f.slice(1, f.length - 1).map(v => (v.trim() === '' ? null : limpiarNumero(v))),
        pctBono: limpiarPorcentaje(f[f.length - 1]),
    }));
    return { meses, filas };
}

// ---------------------------------------------------------------------------
// PROMOTORÍA — Subsidios de Renta
// ---------------------------------------------------------------------------
export interface DetalleSubsidios {
    rentaMensual: number;
    asesoresProactivosSemAnt: number;
    asesoresProactivosMes: number;
    primaMetaRecluta6m: number;
    pctSubsidio: number;
    primaPagoNO6m: number;
    promPrimaPagoNO: number;
    subsidioRenta: number;
    pctSubsidioVsRenta: number;
}

function extraerValorTrasEtiqueta(texto: string, etiqueta: string): string {
    const escapada = etiqueta.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const m = texto.match(new RegExp(escapada + '\\s*\\n+\\s*([^\\n]+)'));
    return m ? m[1].trim() : '';
}

export function parseSubsidiosPromotoria(texto: string, tablas: TablaCruda[]): DetalleSubsidios {
    const tablaRenta = buscarTabla(tablas, f => f[0] === 'RENTA MES');
    const tablaSubsidio = buscarTabla(tablas, f => f[0] === 'SUBSIDIO');
    const buscarEnTabla = (t: TablaCruda | null, etiqueta: string) => {
        const fila = t?.filas.find(f => f[0] === etiqueta);
        return fila ? fila[1] : '';
    };
    return {
        rentaMensual: limpiarNumero(buscarEnTabla(tablaRenta, 'Renta Mensual')),
        asesoresProactivosSemAnt: limpiarNumero(buscarEnTabla(tablaSubsidio, 'Asesores Proactivos Sem Ant')),
        asesoresProactivosMes: limpiarNumero(buscarEnTabla(tablaSubsidio, 'Asesores Proactivos Mes')),
        primaMetaRecluta6m: limpiarNumero(buscarEnTabla(tablaSubsidio, 'Prima Meta Recluta (6 meses)')),
        pctSubsidio: limpiarPorcentaje(buscarEnTabla(tablaSubsidio, '% Subsidio')),
        primaPagoNO6m: limpiarNumero(buscarEnTabla(tablaSubsidio, 'Prima Pago Nva Org (6 meses)')),
        promPrimaPagoNO: limpiarNumero(buscarEnTabla(tablaSubsidio, 'Prom Prima Pago Nva Org')),
        // Estos dos no viven dentro de una <table> del DOM, así que los sacamos
        // del innerText plano (patrón "Etiqueta\n...\nValor").
        subsidioRenta: limpiarNumero(extraerValorTrasEtiqueta(texto, 'Subsidio Renta')),
        pctSubsidioVsRenta: limpiarPorcentaje(extraerValorTrasEtiqueta(texto, '% Subsidio vs Renta')),
    };
}

// ---------------------------------------------------------------------------
// GERENTE DE AGENCIA — Bono Inicial (Detalle de Asesores)
// ---------------------------------------------------------------------------
export interface AsesorDetalleGA {
    clave: string;
    nombre: string;
    fechaConcurso: string;
    estatus: string;
    polizas: number;
    comVIMes: number;
    comGMMIMes: number;
    comVIGMMIAcum: number;
    limra: number;
    igc: number;
}

export interface DetalleBonoInicialGA {
    asesores: AsesorDetalleGA[];
    totalMes: number; // suma de comVIMes + comGMMIMes de todos
    totalAcumulado: number; // suma de comVIGMMIAcum de todos
}

export function parseBonoInicialGA(tablas: TablaCruda[]): DetalleBonoInicialGA {
    const t = buscarTabla(tablas, f => f[0] === 'Clave' && /Nombre/i.test(f[1] || ''));
    const asesores: AsesorDetalleGA[] = t
        ? t.filas.slice(1).map(f => ({
            clave: f[0],
            nombre: f[1],
            fechaConcurso: f[2],
            estatus: f[3],
            polizas: limpiarNumero(f[4]),
            comVIMes: limpiarNumero(f[5]),
            comGMMIMes: limpiarNumero(f[6]),
            comVIGMMIAcum: limpiarNumero(f[7]),
            limra: limpiarPorcentaje(f[8]),
            igc: limpiarPorcentaje(f[9]),
        }))
        : [];
    return {
        asesores,
        totalMes: asesores.reduce((acc, a) => acc + a.comVIMes + a.comGMMIMes, 0),
        totalAcumulado: asesores.reduce((acc, a) => acc + a.comVIGMMIAcum, 0),
    };
}

// ---------------------------------------------------------------------------
// GERENTE DE AGENCIA — Apoyo
// ---------------------------------------------------------------------------
export interface HistoricoApoyoMes { mesLabel: string; mesNumero: number; pctCump: number; gana: boolean }

export interface DetalleApoyoGA {
    historico: HistoricoApoyoMes[];
    mesActual: number;
    ganadoresTA: number;
    ganadoresTAMin: number;
    comisionesVida: number;
    comisionesGMMI: number;
    comisionesTotales: number;
    comisionesTotalesMin: number;
    pctCumplimiento: number;
    apoyoMes: number;
    apoyosRecuperados: number;
    apoyoMesFinal: number;
    apoyosAcumulados: number;
}

export function parseApoyoGA(tablas: TablaCruda[]): DetalleApoyoGA {
    const tHistorico = buscarTablaPorAlgunaFila(tablas, f => f[1] === 'Gana');
    const historico: HistoricoApoyoMes[] = [];
    if (tHistorico && tHistorico.filas.length >= 3) {
        const filaMeses = tHistorico.filas.find(f => /Ene|Feb|Mar|Abr|May|Jun|Jul|Ago|Sep|Oct|Nov|Dic/.test(f.join('')));
        const filaMesNum = tHistorico.filas.find(f => f[1] === 'Mes');
        const filaCump = tHistorico.filas.find(f => f[1] === '% Cump' || f[0] === 'Apoyo' && f[1] === '% Cump');
        if (filaMesNum && filaCump) {
            const numMeses = filaMesNum.slice(2).filter(v => v.trim() !== '').length;
            for (let i = 0; i < numMeses; i++) {
                // El check ✓/❌ de "Gana" es un ícono sin texto (innerText lo
                // deja en blanco) — lo derivamos de la regla oficial: solo gana
                // el apoyo si el cumplimiento llega al 100%.
                const pctCump = limpiarPorcentaje(filaCump[i + 2]);
                historico.push({
                    mesLabel: filaMeses?.[i + 2] || '',
                    mesNumero: limpiarNumero(filaMesNum[i + 2]),
                    pctCump,
                    gana: pctCump >= 100,
                });
            }
        }
    }

    const tMes = buscarTabla(tablas, f => /^Mes\s*\d+$/.test(f[0] || ''));
    const buscar = (label: string) => tMes?.filas.find(f => f[0] === label) || [];
    const filaGanadoresTA = buscar('Ganadores TA');
    const filaComTotales = buscar('Comisiones Totales');
    const filaApoyoMes = tMes?.filas.filter(f => f[0] === 'Apoyo Mes') || [];
    const filaApoyosAcum = tMes?.filas.find(f => f[0] === 'Apoyos Acumulados');

    const mesActual = Number((tMes?.filas[0]?.[0] || '').replace(/\D/g, '')) || 0;

    return {
        historico,
        mesActual,
        ganadoresTA: limpiarNumero(filaGanadoresTA[1]),
        ganadoresTAMin: limpiarNumero(filaGanadoresTA[2]),
        comisionesVida: limpiarNumero(buscar('Comisiones Vida')[1]),
        comisionesGMMI: limpiarNumero(buscar('Comisiones GMMI')[1]),
        comisionesTotales: limpiarNumero(filaComTotales[1]),
        comisionesTotalesMin: limpiarNumero(filaComTotales[2]),
        pctCumplimiento: limpiarPorcentaje(filaComTotales[3]),
        apoyoMes: limpiarNumero(filaApoyoMes[0]?.[1]),
        apoyosRecuperados: limpiarNumero(buscar('Apoyos Recuperados')[1]),
        apoyoMesFinal: limpiarNumero(filaApoyoMes[1]?.[3]),
        apoyosAcumulados: limpiarNumero(filaApoyosAcum?.[3]),
    };
}

export function formatoMoneda(v: number): string {
    return v.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });
}
export function formatoPct(v: number): string {
    return `${v.toLocaleString('es-MX', { maximumFractionDigits: 1 })}%`;
}
