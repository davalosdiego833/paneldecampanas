// Pestaña "Calendario" del Reporte de Premios — mismo calendario para TODOS los
// asesores (Bono Vida y Bono TA), no depende de datos del asesor. Les dice cuándo
// corta cada reporte (semanal/mensual), cuándo se publica, y en los cortes
// mensuales, cuándo se integra al Estado de Cuenta y cuándo cae el pago.
// La compañía lo publica por TRIMESTRE completo, por eso se muestra agrupado así
// (un bloque con encabezado por trimestre) en vez de una sola tabla larga.
import React, { useMemo } from 'react';
import { TRIMESTRES_CALENDARIO_PAGOS, CALENDARIO_PAGOS_PREMIOS, FilaCalendarioPagos, parseFechaDDMMYYYY } from '../../utils/calendarioPagosPremios';

const celda: React.CSSProperties = { padding: '8px 10px' };

export const PestanaCalendarioPagos: React.FC = () => {
    const proximaFila = useMemo(() => {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const futuras = CALENDARIO_PAGOS_PREMIOS
            .filter(f => parseFechaDDMMYYYY(f.fechaPublicacion) >= hoy)
            .sort((a, b) => parseFechaDDMMYYYY(a.fechaPublicacion).getTime() - parseFechaDDMMYYYY(b.fechaPublicacion).getTime());
        return futuras[0] || null;
    }, []);

    const ultimoTrimestre = TRIMESTRES_CALENDARIO_PAGOS[TRIMESTRES_CALENDARIO_PAGOS.length - 1];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="glass-card" style={{ padding: '20px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '4px', opacity: 0.8 }}>📅 Calendario de cortes y publicación</h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                    Estas son las fechas oficiales: cuándo corta la información de cada reporte, cuándo se publica, y en el corte de fin de mes, cuándo se integra al Estado de Cuenta y cuándo cae el pago. La compañía lo publica por trimestre.
                </p>

                {proximaFila && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px',
                        borderRadius: '10px', background: 'rgba(212,175,55,0.1)', border: '1px solid var(--accent-gold)',
                        marginBottom: '4px', fontSize: '0.85rem'
                    }}>
                        <span>📌</span>
                        <span>
                            Próxima publicación: <strong>{proximaFila.fechaPublicacion}</strong>
                            {' '}(corte {proximaFila.tipoProceso.toLowerCase()} del {proximaFila.fechaCorte})
                            {proximaFila.fechaPagoSemanal && <> — pago el <strong>{proximaFila.fechaPagoSemanal}</strong></>}
                        </span>
                    </div>
                )}
            </div>

            {TRIMESTRES_CALENDARIO_PAGOS.map(trimestre => (
                <div key={trimestre.label} className="glass-card" style={{ padding: '20px' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px' }}>{trimestre.label}</h4>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', minWidth: '620px' }}>
                            <thead>
                                <tr style={{ color: 'var(--text-secondary)', textAlign: 'left', textTransform: 'uppercase', fontSize: '0.72rem' }}>
                                    <th style={celda}>Fecha de corte</th>
                                    <th style={celda}>Tipo de proceso</th>
                                    <th style={celda}>Fecha de publicación</th>
                                    <th style={celda}>Integración Estado de Cuenta</th>
                                    <th style={celda}>Fecha de pago</th>
                                </tr>
                            </thead>
                            <tbody>
                                {trimestre.filas.map((f: FilaCalendarioPagos, i: number) => {
                                    const esMensual = f.tipoProceso === 'Mensual';
                                    // Nuevo bloque de mes: la fila justo después de un cierre Mensual.
                                    const iniciaBloque = i > 0 && trimestre.filas[i - 1].tipoProceso === 'Mensual';
                                    const esProxima = proximaFila?.fechaCorte === f.fechaCorte;
                                    return (
                                        <tr key={f.fechaCorte} style={{
                                            borderTop: iniciaBloque ? '2px solid var(--border, rgba(255,255,255,0.15))' : '1px solid var(--border, rgba(255,255,255,0.06))',
                                            background: esProxima ? 'rgba(212,175,55,0.12)' : esMensual ? 'rgba(255,255,255,0.04)' : 'transparent',
                                            fontWeight: esMensual ? 700 : 400,
                                        }}>
                                            <td style={celda}>{f.fechaCorte}</td>
                                            <td style={celda}>{f.tipoProceso}</td>
                                            <td style={celda}>{f.fechaPublicacion}</td>
                                            <td style={{ ...celda, color: 'var(--text-secondary)' }}>{f.fechaIntegracionEstadoCuenta || '—'}</td>
                                            <td style={{ ...celda, color: esMensual ? 'var(--accent-gold)' : 'var(--text-secondary)' }}>{f.fechaPagoSemanal || '—'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '10px' }}>
                        Los cortes "Mensual" (fin de mes) son los que se integran al Estado de Cuenta y traen fecha de pago — los cortes "Semanal" son solo el avance de esa semana.
                        {trimestre.label === ultimoTrimestre.label && ' En cuanto se publique el siguiente trimestre, se agrega aquí como un bloque nuevo.'}
                    </p>
                </div>
            ))}
        </div>
    );
};
