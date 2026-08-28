// Tablas y fórmulas oficiales de los Cuadernos de Concursos 2026
// (CC 2026 Asesores en Desarrollo / CC 2026 Asesores Nuevos Profesionales).
// Todo lo de este archivo son constantes/funciones puras — no llama a la red.

// ============================================================
// BONO TRAINING ALLOWANCE (Asesores en Desarrollo, mes 1-12)
// ============================================================

export interface FilaTA {
    mes: number;
    comisionMeta: number;
    polizasAcumVidaGmmi: number;
    minPolizasVida: number;
    premioMinimo: number;
    premioMaximo: number;
}

// Tabla 2 del Cuaderno "Asesores en Desarrollo"
export const TABLA_TA: FilaTA[] = [
    { mes: 1, comisionMeta: 9000, polizasAcumVidaGmmi: 3, minPolizasVida: 1, premioMinimo: 9000, premioMaximo: 33000 },
    { mes: 2, comisionMeta: 15000, polizasAcumVidaGmmi: 6, minPolizasVida: 2, premioMinimo: 15000, premioMaximo: 56000 },
    { mes: 3, comisionMeta: 21000, polizasAcumVidaGmmi: 9, minPolizasVida: 3, premioMinimo: 21000, premioMaximo: 69000 },
    { mes: 4, comisionMeta: 31000, polizasAcumVidaGmmi: 12, minPolizasVida: 4, premioMinimo: 31000, premioMaximo: 102000 },
    { mes: 5, comisionMeta: 39000, polizasAcumVidaGmmi: 15, minPolizasVida: 5, premioMinimo: 39000, premioMaximo: 129000 },
    { mes: 6, comisionMeta: 51000, polizasAcumVidaGmmi: 18, minPolizasVida: 6, premioMinimo: 51000, premioMaximo: 167000 },
    { mes: 7, comisionMeta: 13000, polizasAcumVidaGmmi: 3, minPolizasVida: 1, premioMinimo: 13000, premioMaximo: 38000 },
    { mes: 8, comisionMeta: 21000, polizasAcumVidaGmmi: 6, minPolizasVida: 2, premioMinimo: 21000, premioMaximo: 64000 },
    { mes: 9, comisionMeta: 32000, polizasAcumVidaGmmi: 9, minPolizasVida: 3, premioMinimo: 32000, premioMaximo: 95000 },
    { mes: 10, comisionMeta: 43000, polizasAcumVidaGmmi: 12, minPolizasVida: 4, premioMinimo: 43000, premioMaximo: 130000 },
    { mes: 11, comisionMeta: 55000, polizasAcumVidaGmmi: 15, minPolizasVida: 5, premioMinimo: 55000, premioMaximo: 165000 },
    { mes: 12, comisionMeta: 70000, polizasAcumVidaGmmi: 18, minPolizasVida: 6, premioMinimo: 70000, premioMaximo: 210000 },
];

export const PCT_EXCEDENTE_TA = 0.35;

export interface ResultadoTA {
    mes: number;
    fila: FilaTA;
    cumplePolizas: boolean;
    bonoBase: number;
    bonoMaximoCalculado: number;
    bonoExcedente: number;
    bonoTotalCalculado: number;
}

// Semestre: 1-6 -> semestre 1, 7-12 -> semestre 2
export function semestreDeMes(mes: number): 1 | 2 {
    return mes <= 6 ? 1 : 2;
}

export function mesInicioSemestre(mes: number): number {
    return semestreDeMes(mes) === 1 ? 1 : 7;
}

export function calcularBonoTA(
    mes: number,
    comisionAcumuladaSemestre: number,
    polizasVidaGmmiAcumuladas: number,
    polizasVidaAcumuladas: number
): ResultadoTA {
    const fila = TABLA_TA.find(f => f.mes === mes) || TABLA_TA[0];
    const cumplePolizas = polizasVidaGmmiAcumuladas >= fila.polizasAcumVidaGmmi && polizasVidaAcumuladas >= fila.minPolizasVida;

    if (!cumplePolizas) {
        return { mes, fila, cumplePolizas, bonoBase: 0, bonoMaximoCalculado: 0, bonoExcedente: 0, bonoTotalCalculado: 0 };
    }

    const bonoBase = comisionAcumuladaSemestre * 1.0; // %Bono siempre 100%
    const bonoMaximoCalculado = Math.min(bonoBase, fila.premioMaximo);
    const bonoExcedente = Math.max(0, bonoBase - fila.premioMaximo) * PCT_EXCEDENTE_TA;
    const bonoTotalCalculado = bonoMaximoCalculado + bonoExcedente;

    return { mes, fila, cumplePolizas, bonoBase, bonoMaximoCalculado, bonoExcedente, bonoTotalCalculado };
}

// ============================================================
// BONO VIDA (Asesores Nuevos Profesionales, mes 13+)
// ============================================================

// Tabla 2: Metas de Prima Acumulada por Grupo y Mes del semestre (cifras en miles,
// ya multiplicadas x1000 aquí para trabajar en pesos directo).
export const TABLA_GRUPO_PRIMA: number[][] = [
    [455, 910, 1370, 1825, 2280, 2735],
    [420, 835, 1255, 1670, 2090, 2505],
    [355, 710, 1065, 1420, 1775, 2125],
    [325, 645, 970, 1290, 1615, 1945],
    [300, 605, 905, 1215, 1515, 1820],
    [275, 560, 835, 1115, 1400, 1675],
    [250, 500, 745, 1000, 1245, 1495],
    [210, 430, 640, 860, 1075, 1290],
    [185, 375, 555, 740, 930, 1115],
    [160, 315, 475, 640, 790, 950],
    [125, 245, 370, 490, 615, 735],
    [85, 175, 260, 350, 440, 525],
    [75, 140, 215, 280, 355, 420],
    [60, 130, 190, 260, 320, 385],
    [55, 110, 160, 220, 275, 330],
    [50, 90, 135, 185, 225, 275],
].map(fila => fila.map(v => v * 1000));

// Tabla 3: metas mínimas de pólizas (mensual, semestral acum, anual acum -solo 2º sem-)
export const TABLA_POLIZAS_VIDA = {
    mensual: [1, 1, 1, 1, 1, null], // mes 6 no aplica meta mensual (cierre de semestre)
    semestral: [2.5, 5, 7.5, 10, 12.5, 15],
    anual: [17.5, 20, 22.5, 25, 27.5, 30], // solo aplica en el 2º semestre del año
};

// Tabla 4: índice LIMRA mínimo requerido según antigüedad (meses de concurso)
export function limraMinimoPorAntiguedad(mesesConcurso: number): number {
    if (mesesConcurso >= 37) return 84.5;
    if (mesesConcurso >= 25) return 80.5;
    return 75.5; // 12-24 meses
}

// Tabla 5: % Bono Inicial según Grupo (fila) y banda de LIMRA (columna).
// Columnas: [indiceMinimo(piso de tabla), 87.5, 89.5, 91.5, 95.5]
export const TABLA_LIMRA_BONO: number[][] = [
    [9.8, 19.5, 33.0, 36.0, 45.0],
    [8.3, 16.5, 30.5, 34.0, 43.0],
    [7.0, 14.0, 27.5, 32.0, 40.0],
    [6.3, 12.5, 26.5, 30.0, 37.0],
    [5.8, 11.5, 24.5, 28.0, 35.0],
    [5.3, 10.5, 22.0, 26.0, 33.0],
    [5.0, 10.0, 19.5, 25.0, 31.0],
    [4.8, 9.5, 16.5, 23.0, 29.0],
    [4.5, 9.0, 14.0, 22.0, 27.0],
    [4.3, 8.5, 11.0, 20.0, 25.0],
    [4.0, 8.0, 10.0, 18.0, 23.0],
    [3.5, 7.0, 9.0, 17.0, 21.0],
    [2.8, 5.5, 8.0, 15.0, 19.0],
    [2.3, 4.5, 7.0, 14.0, 17.0],
    [1.8, 3.5, 5.5, 12.0, 15.0],
    [1.0, 2.0, 2.5, 11.0, 14.0],
];

// Tabla 6: % Bono Renovación según Grupo (fila) y banda de IGC (columna).
// Columnas: [91, 92.5, 95, 95.75]
export const TABLA_IGC_BONO: number[][] = [
    [6.0, 8.0, 11.0, 16.0],
    [5.5, 7.0, 9.5, 14.0],
    [5.0, 6.5, 9.0, 13.0],
    [4.6, 6.0, 8.5, 12.0],
    [4.3, 5.5, 8.0, 11.0],
    [4.0, 5.0, 7.0, 10.0],
    [3.7, 4.8, 6.5, 9.5],
    [3.4, 4.4, 6.0, 9.0],
    [3.0, 4.0, 5.5, 8.0],
    [2.8, 3.6, 5.0, 7.0],
    [2.5, 3.2, 4.5, 6.0],
    [2.2, 2.8, 4.0, 5.0],
    [1.9, 2.4, 3.0, 4.0],
    [1.5, 2.0, 2.5, 3.0],
    [1.3, 1.6, 2.0, 2.5],
    [1.0, 1.2, 1.3, 1.5],
];

export const PISO_BONO_INICIAL_PCT = 9.8; // Solo aplica: Bono Inicial de Vida + mes 13-36 + índices mínimos cumplidos

// Devuelve el mejor grupo (1=mejor) cuyo umbral de prima ya se alcanzó, o null si
// ni siquiera el grupo 16 (el más bajo) se alcanzó.
export function calcularGrupoVida(primaAcumulada: number, mesEnSemestre: number): number | null {
    const col = Math.min(Math.max(mesEnSemestre, 1), 6) - 1;
    for (let g = 0; g < TABLA_GRUPO_PRIMA.length; g++) {
        if (primaAcumulada >= TABLA_GRUPO_PRIMA[g][col]) return g + 1; // grupo 1-indexado
    }
    return null;
}

function bandaLimra(limra: number): number {
    if (limra >= 95.5) return 4;
    if (limra >= 91.5) return 3;
    if (limra >= 89.5) return 2;
    if (limra >= 87.5) return 1;
    return 0; // banda "índice mínimo"
}

function bandaIgc(igc: number): number | null {
    if (igc >= 95.75) return 3;
    if (igc >= 95) return 2;
    if (igc >= 92.5) return 1;
    if (igc >= 91) return 0;
    return null; // por debajo de 91%, no hay columna -> no calcula
}

export interface ResultadoVida {
    grupo: number | null;
    limraElegible: boolean;
    pctBonoInicial: number;
    pctBonoInicialAplicado: number; // con piso 9.8% si aplica
    pisoAplicado: boolean;
    bonoInicialCalculado: number;
    pctBonoRenovacion: number;
    bonoRenovacionCalculado: number;
    bonoTotalCalculado: number;
}

export function calcularBonoVida(params: {
    primaIniAcumulada: number;
    primaPagoIniAcumulada: number;
    primaRenovacionAcumulada: number;
    mesEnSemestre: number;
    limra: number;
    igc: number;
    antiguedadMeses: number;
    grupoTopeAnticipo?: number | null; // grupo con el que cerró el semestre anterior (o null si es su 1er semestre)
}): ResultadoVida {
    const { primaIniAcumulada, primaPagoIniAcumulada, primaRenovacionAcumulada, mesEnSemestre, limra, igc, antiguedadMeses, grupoTopeAnticipo } = params;

    const grupoReal = calcularGrupoVida(primaIniAcumulada, mesEnSemestre);
    const limraMinimo = limraMinimoPorAntiguedad(antiguedadMeses);
    const limraElegible = limra >= limraMinimo;

    if (grupoReal === null || !limraElegible) {
        return {
            grupo: grupoReal, limraElegible, pctBonoInicial: 0, pctBonoInicialAplicado: 0, pisoAplicado: false,
            bonoInicialCalculado: 0, pctBonoRenovacion: 0, bonoRenovacionCalculado: 0, bonoTotalCalculado: 0
        };
    }

    // Grupo efectivo para el ANTICIPO del mes: el peor (número más alto) entre el
    // grupo real de hoy y el tope heredado del semestre anterior (si existe).
    const grupoEfectivo = grupoTopeAnticipo ? Math.max(grupoReal, grupoTopeAnticipo) : grupoReal;

    const banda = bandaLimra(limra);
    const pctBonoInicialReal = TABLA_LIMRA_BONO[grupoEfectivo - 1][banda];
    const enVentanaPiso = antiguedadMeses >= 13 && antiguedadMeses <= 36;
    const pisoAplicado = enVentanaPiso && pctBonoInicialReal < PISO_BONO_INICIAL_PCT;
    const pctBonoInicialAplicado = pisoAplicado ? PISO_BONO_INICIAL_PCT : pctBonoInicialReal;

    const bonoInicialCalculado = (pctBonoInicialAplicado / 100) * primaPagoIniAcumulada;

    let pctBonoRenovacion = 0;
    let bonoRenovacionCalculado = 0;
    if (bonoInicialCalculado > 0) {
        const bIgc = bandaIgc(igc);
        if (bIgc !== null) {
            pctBonoRenovacion = TABLA_IGC_BONO[grupoEfectivo - 1][bIgc];
            bonoRenovacionCalculado = (pctBonoRenovacion / 100) * primaRenovacionAcumulada;
        }
    }

    return {
        grupo: grupoReal,
        limraElegible,
        pctBonoInicial: pctBonoInicialReal,
        pctBonoInicialAplicado,
        pisoAplicado,
        bonoInicialCalculado,
        pctBonoRenovacion,
        bonoRenovacionCalculado,
        bonoTotalCalculado: bonoInicialCalculado + bonoRenovacionCalculado
    };
}

// Prima faltante para alcanzar un grupo específico en un mes futuro dado, respecto
// a la prima acumulada actual (misma lógica que la tabla "Prima Faltante" de hojameta).
export function primaFaltantePorGrupo(primaAcumuladaActual: number, grupo: number, mesEnSemestre: number): number {
    const col = Math.min(Math.max(mesEnSemestre, 1), 6) - 1;
    const umbral = TABLA_GRUPO_PRIMA[grupo - 1][col];
    return Math.max(0, umbral - primaAcumuladaActual);
}

export function formatoMoneda(v: number): string {
    return v.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });
}
