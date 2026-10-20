// Calendario oficial de cortes y publicación del Reporte de Premios (aplica igual
// para Bono Vida y Bono TA — es el mismo calendario de la compañía, no depende del
// asesor). Fuente: documento oficial que compartió Diego. La compañía lo publica
// POR TRIMESTRE completo (no mes a mes). Solo se conserva el trimestre VIGENTE (decisión de
// Diego: sin historial); cuando mande el siguiente, se reemplaza el bloque de abajo por el nuevo.
export interface FilaCalendarioPagos {
    fechaCorte: string; // DD/MM/YYYY
    tipoProceso: 'Semanal' | 'Mensual';
    fechaPublicacion: string; // DD/MM/YYYY
    // Solo aplican en el corte Mensual (cierre de mes) — en los cortes Semanales
    // el documento oficial los deja en blanco.
    fechaIntegracionEstadoCuenta?: string; // DD/MM/YYYY
    fechaPagoSemanal?: string; // DD/MM/YYYY
    // La fecha de corte viene con "**" en el calendario oficial: es una fecha de PUBLICACIÓN ESPECIAL (confirmado por Diego).
    marcada?: boolean;
}

export interface TrimestreCalendarioPagos {
    label: string;
    filas: FilaCalendarioPagos[];
}

// Un bloque por trimestre, tal como la compañía lo publica. Cuando Diego mande el siguiente
// trimestre, se reemplaza el bloque de abajo (label nuevo, p. ej. "1er Trimestre 2027 (Ene-Mar)",
// y sus filas) — no hace falta tocar nada más, ni en este archivo ni en la pestaña que lo muestra.
export const TRIMESTRES_CALENDARIO_PAGOS: TrimestreCalendarioPagos[] = [
    {
        label: '4o Trimestre 2026 (Oct-Dic)',
        filas: [
            { fechaCorte: '13/10/2026', tipoProceso: 'Semanal', fechaPublicacion: '16/10/2026' },
            { fechaCorte: '16/10/2026', tipoProceso: 'Semanal', fechaPublicacion: '21/10/2026' },
            { fechaCorte: '23/10/2026', tipoProceso: 'Semanal', fechaPublicacion: '28/10/2026' },
            { fechaCorte: '31/10/2026', tipoProceso: 'Mensual', fechaPublicacion: '12/11/2026', fechaIntegracionEstadoCuenta: '12/11/2026', fechaPagoSemanal: '13/11/2026' },

            { fechaCorte: '13/11/2026', tipoProceso: 'Semanal', fechaPublicacion: '19/11/2026' },
            { fechaCorte: '20/11/2026', tipoProceso: 'Semanal', fechaPublicacion: '25/11/2026' },
            { fechaCorte: '25/11/2026', tipoProceso: 'Semanal', fechaPublicacion: '27/11/2026', marcada: true },
            { fechaCorte: '30/11/2026', tipoProceso: 'Mensual', fechaPublicacion: '10/12/2026', fechaIntegracionEstadoCuenta: '10/12/2026', fechaPagoSemanal: '11/12/2026' },

            { fechaCorte: '11/12/2026', tipoProceso: 'Semanal', fechaPublicacion: '16/12/2026' },
            { fechaCorte: '18/12/2026', tipoProceso: 'Semanal', fechaPublicacion: '23/12/2026' },
            { fechaCorte: '23/12/2026', tipoProceso: 'Semanal', fechaPublicacion: '29/12/2026' },
            { fechaCorte: '31/12/2026', tipoProceso: 'Mensual', fechaPublicacion: '13/01/2027', fechaIntegracionEstadoCuenta: '13/01/2027', fechaPagoSemanal: '14/01/2027' },
        ],
    },
];

// Vista plana de todas las filas (todos los trimestres juntos), útil para calcular
// "próxima publicación" sin importar en qué trimestre cae.
export const CALENDARIO_PAGOS_PREMIOS: FilaCalendarioPagos[] = TRIMESTRES_CALENDARIO_PAGOS.flatMap(t => t.filas);

export function parseFechaDDMMYYYY(v: string): Date {
    const [d, m, y] = v.split('/').map(Number);
    return new Date(y, m - 1, d);
}
