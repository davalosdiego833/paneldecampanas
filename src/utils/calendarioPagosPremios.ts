// Calendario oficial de cortes y publicación del Reporte de Premios (aplica igual
// para Bono Vida y Bono TA — es el mismo calendario de la compañía, no depende del
// asesor). Fuente: documento oficial que compartió Diego. La compañía lo publica
// POR TRIMESTRE completo (no mes a mes) — lo de abajo es el 3er trimestre 2026
// (jul-sep) completo. Cuando Diego mande el siguiente trimestre, se agrega como un
// bloque nuevo al final de este arreglo (no hace falta tocar nada más).
export interface FilaCalendarioPagos {
    fechaCorte: string; // DD/MM/YYYY
    tipoProceso: 'Semanal' | 'Mensual';
    fechaPublicacion: string; // DD/MM/YYYY
    // Solo aplican en el corte Mensual (cierre de mes) — en los cortes Semanales
    // el documento oficial los deja en blanco.
    fechaIntegracionEstadoCuenta?: string; // DD/MM/YYYY
    fechaPagoSemanal?: string; // DD/MM/YYYY
}

export interface TrimestreCalendarioPagos {
    label: string;
    filas: FilaCalendarioPagos[];
}

// Un bloque por trimestre, tal como la compañía lo publica. Para agregar el
// siguiente trimestre cuando Diego lo mande: copia un bloque nuevo aquí abajo con
// su label ("4o Trimestre 2026", etc.) y sus filas — no hace falta tocar nada más,
// ni en este archivo ni en la pestaña que lo muestra.
export const TRIMESTRES_CALENDARIO_PAGOS: TrimestreCalendarioPagos[] = [
    {
        label: '3er Trimestre 2026 (Jul-Sep)',
        filas: [
            { fechaCorte: '10/07/2026', tipoProceso: 'Semanal', fechaPublicacion: '15/07/2026' },
            { fechaCorte: '17/07/2026', tipoProceso: 'Semanal', fechaPublicacion: '22/07/2026' },
            { fechaCorte: '24/07/2026', tipoProceso: 'Semanal', fechaPublicacion: '29/07/2026' },
            { fechaCorte: '31/07/2026', tipoProceso: 'Mensual', fechaPublicacion: '13/08/2026', fechaIntegracionEstadoCuenta: '13/08/2026', fechaPagoSemanal: '14/08/2026' },

            { fechaCorte: '14/08/2026', tipoProceso: 'Semanal', fechaPublicacion: '19/08/2026' },
            { fechaCorte: '21/08/2026', tipoProceso: 'Semanal', fechaPublicacion: '26/08/2026' },
            { fechaCorte: '31/08/2026', tipoProceso: 'Mensual', fechaPublicacion: '10/09/2026', fechaIntegracionEstadoCuenta: '10/09/2026', fechaPagoSemanal: '11/09/2026' },

            { fechaCorte: '11/09/2026', tipoProceso: 'Semanal', fechaPublicacion: '17/09/2026' },
            { fechaCorte: '18/09/2026', tipoProceso: 'Semanal', fechaPublicacion: '23/09/2026' },
            { fechaCorte: '24/09/2026', tipoProceso: 'Semanal', fechaPublicacion: '29/09/2026' },
            { fechaCorte: '30/09/2026', tipoProceso: 'Mensual', fechaPublicacion: '13/10/2026', fechaIntegracionEstadoCuenta: '13/10/2026', fechaPagoSemanal: '14/10/2026' },
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
