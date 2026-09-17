// Tabla 1 del Cuaderno de Concursos 2026 — Asesores Profesionales.
// "% Prima Meta y Pago" por producto: cuánto de la prima realmente cuenta
// para el cálculo del Bono Vida (Bono Inicial), según la moneda de la póliza.
// dls/udis = null significa que ese producto no existe/no aplica en esa moneda.

export interface ProductoPonderado {
    nombre: string;
    categoria?: string; // agrupa variantes del mismo producto (ej. "Segubeca")
    dls: number | null;
    udis: number | null;
    nota?: string;
}

export const PRODUCTOS_PONDERACION: ProductoPonderado[] = [
    { nombre: 'Realiza (Prima Básica)', dls: 110, udis: 120 },
    { nombre: 'Objetivo Vida (Prima Básica)', dls: 120, udis: 120 },
    {
        nombre: 'ORVI 99', dls: null, udis: 100,
        nota: 'Aplica desde el 1 de febrero de 2026. Del 1 al 31 de enero 2026 se usa la ponderación de enero a diciembre 2025.'
    },
    { nombre: 'Pagos Limitados 15 y 20', categoria: 'ORVI 99', dls: 90, udis: 110 },
    { nombre: 'Edad 60', categoria: 'ORVI 99', dls: null, udis: 110 },
    { nombre: 'Pagos Limitados 10', categoria: 'ORVI 99', dls: 90, udis: 90 },
    { nombre: 'Pagos Limitados 6', categoria: 'ORVI 99', dls: 90, udis: null },
    { nombre: 'Star Temporal 10 y 20', dls: 110, udis: 120 },
    { nombre: 'Star Temporal 5 y 65', dls: 110, udis: null },
    { nombre: 'Se Adapta', dls: 0, udis: 0 },
    { nombre: 'Suma Asegurada < a 150 mil UDIS', categoria: 'Imagina Ser / Ser+ (Prima Básica)', dls: null, udis: 100 },
    { nombre: 'Plazos ≥ 20 años', categoria: 'Imagina Ser / Ser+ (Prima Básica)', dls: 110, udis: 110 },
    { nombre: 'Plazos < 20 años', categoria: 'Imagina Ser / Ser+ (Prima Básica)', dls: 80, udis: 100 },
    { nombre: 'Imagina Ser Prima Única', dls: 10, udis: 10 },
    { nombre: 'Imagina Ser 10 pagos', dls: 110, udis: 110 },
    { nombre: 'Imagina Ser 15 pagos', dls: 110, udis: 110 },
    { nombre: 'Plazos ≥ 9 años', categoria: 'Segubeca (se excluye CVD)', dls: 50, udis: 80 },
    { nombre: 'Plazos < 9 años', categoria: 'Segubeca (se excluye CVD)', dls: 0, udis: 0 },
    { nombre: 'Star Dotal 10', dls: null, udis: 80 },
    { nombre: 'Star Dotal 20', dls: 50, udis: 80 },
    { nombre: 'Star Dotal 15', dls: null, udis: 80 },
    { nombre: 'Nuevo Plenitud', dls: 100, udis: 100 },
    { nombre: 'Nuevo Vida Mujer', dls: 100, udis: 100 },
    { nombre: 'Respaldo Educativo', dls: 100, udis: null },
    { nombre: 'Respaldo Negocio', dls: 100, udis: null },
    { nombre: 'Legado (pesos y dlls)', dls: 110, udis: null },
    { nombre: 'MIO', dls: null, udis: 130 },
    { nombre: 'Tempo Vida 1 y Star Temporal 1', dls: 0, udis: 0 },
    {
        nombre: 'Otros Planes (no incluidos en esta tabla)', dls: 0, udis: 0,
        nota: 'Si la prima anualizada es mayor a $17,000, cuenta como póliza (Reglas de Conteo) pero no cuenta para Prima Meta ni Prima Pago. Tempo Vida 1 y Star Temporal 1 nunca cuentan como póliza, sin importar el monto de prima.'
    },
];

export type NivelPonderacion = 'verde' | 'amarillo' | 'rojo' | 'na';

export function nivelPonderacion(pct: number | null): NivelPonderacion {
    if (pct === null) return 'na';
    if (pct >= 100) return 'verde';
    if (pct >= 50) return 'amarillo';
    return 'rojo';
}

export const COLOR_NIVEL: Record<NivelPonderacion, string> = {
    verde: '#3ecf7e',
    amarillo: '#f0b429',
    rojo: '#e8635e',
    na: 'var(--text-secondary)',
};

export function nombreCompleto(p: ProductoPonderado): string {
    return p.categoria ? `${p.categoria} — ${p.nombre}` : p.nombre;
}
