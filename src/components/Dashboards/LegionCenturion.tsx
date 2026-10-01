import React from 'react';
import { motion } from 'framer-motion';
import { AdvisorData } from '../../types';

interface Props {
    data: AdvisorData;
}

interface PolizaDetalle {
    Poliza: string;
    Emision: string;
    Pago: string;
    Forma_Pago: string;
    Mes: string;
    Plan: string;
    Prima_Anualizada: number;
    Comisiones: number;
    Participacion: number;
    Conteo: number;
    Momentum: string;
    Personal: string;
    Observaciones: string;
}

const fmtMoney = (v: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(v || 0);

const LegionCenturion: React.FC<Props> = ({ data }) => {
    const total_polizas = Number(data.Total_Polizas || 0);
    const promedio = Number(data.Promedio_Mensual || 0);
    const va_en_meta = String(data.Va_En_Meta || '').toUpperCase();
    const mes_actual = Number(data.Mes_Actual || 1);
    const meta_polizas = 48;
    const progress_pct = Math.min(100, (total_polizas / meta_polizas) * 100);
    const polizasDetalle: PolizaDetalle[] = Array.isArray(data.Polizas_Detalle) ? data.Polizas_Detalle : [];

    const isInMeta = va_en_meta.includes('EN META');
    const statusColor = isInMeta ? 'var(--success-green)' : 'var(--danger-red)';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
            <section>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px', opacity: 0.8 }}>Información Importante</h3>
                <div className="glass-card" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '24px',
                    borderBottom: `4px solid ${statusColor}`,
                    padding: '32px'
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: '0.9rem', opacity: 0.6, marginBottom: '4px' }}>Total Pólizas</p>
                        <p style={{ fontSize: '2rem', fontWeight: 700 }}>{total_polizas.toFixed(1)}</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: '0.9rem', opacity: 0.6, marginBottom: '4px' }}>Promedio Mensual</p>
                        <p style={{ fontSize: '2rem', fontWeight: 700 }}>{promedio.toFixed(2)}</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: '0.9rem', opacity: 0.6, marginBottom: '4px' }}>Va En Meta</p>
                        <p style={{ fontSize: '2rem', fontWeight: 900, color: statusColor }}>
                            {va_en_meta}
                        </p>
                    </div>
                </div>
            </section>

            <section>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px', opacity: 0.8 }}>¿Cuánto me hace falta para ir en meta este mes?</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '24px' }}>
                    {['Bronce', 'Plata', 'Oro', 'Platino'].map(lvl => (
                        <div key={lvl} className="glass-card" style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '0.8rem', textTransform: 'uppercase', opacity: 0.6, letterSpacing: '0.05em', marginBottom: '8px' }}>{lvl}</p>
                            <p style={{ fontSize: '1.8rem', fontWeight: 700 }}>{Number(data[lvl] || 0).toFixed(1)}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary-blue)' }}>
                        <span>Tu Avance en Pólizas</span>
                        <span>{total_polizas.toFixed(1)} Pólizas</span>
                    </div>
                    <div style={{ height: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', overflow: 'hidden' }}>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress_pct}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            style={{ height: '100%', background: 'var(--primary-blue)' }}
                        />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', opacity: 0.6 }}>
                        <span>0</span>
                        <span>{total_polizas >= meta_polizas ? '¡Meta Lograda! 🎉' : `Faltan: ${(meta_polizas - total_polizas).toFixed(1)}`}</span>
                        <span>Meta: {meta_polizas}</span>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '16px' }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: 700, opacity: 0.8 }}>Tiempo restante de la campaña</p>
                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', overflow: 'hidden' }}>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(mes_actual / 12) * 100}%` }}
                            style={{ height: '100%', background: 'var(--text-secondary)' }}
                        />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', opacity: 0.5, fontStyle: 'italic' }}>
                        <span>Mes 0</span>
                        <span>Mes {mes_actual} de 12 ({(mes_actual / 12 * 100).toFixed(0)}%)</span>
                        <span>Cierre</span>
                    </div>
                </div>
            </section>

            {polizasDetalle.length > 0 && (
                <section>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px', opacity: 0.8 }}>
                        Detalle de tus Pólizas ({polizasDetalle.length})
                    </h3>
                    <p style={{ fontSize: '0.85rem', opacity: 0.6, marginBottom: '16px' }}>
                        Todo lo que te está contando para Legión Centurión en lo que va del año.
                    </p>
                    <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', minWidth: '960px' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(0,122,255,0.08)' }}>
                                        {['Póliza', 'Emisión', 'Pago', 'Forma de Pago', 'Plan / Ramo', 'Prima Anualizada', 'Comisiones', '% Particip.', 'Conteo', 'Observaciones'].map((h, i) => (
                                            <th key={i} style={{ padding: '12px 14px', textAlign: i === 0 ? 'left' : 'center', fontWeight: 700, borderBottom: '2px solid var(--glass-border)', whiteSpace: 'nowrap' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {polizasDetalle.map((p, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid var(--glass-border)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                                            <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>{p.Poliza}</td>
                                            <td style={{ padding: '10px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>{p.Emision}</td>
                                            <td style={{ padding: '10px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>{p.Pago}</td>
                                            <td style={{ padding: '10px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>{p.Forma_Pago}</td>
                                            <td style={{ padding: '10px 14px' }}>{p.Plan}</td>
                                            <td style={{ padding: '10px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>{fmtMoney(p.Prima_Anualizada)}</td>
                                            <td style={{ padding: '10px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>{fmtMoney(p.Comisiones)}</td>
                                            <td style={{ padding: '10px 14px', textAlign: 'center' }}>{(p.Participacion * 100).toFixed(0)}%</td>
                                            <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: 'var(--primary-blue)' }}>{p.Conteo}</td>
                                            <td style={{ padding: '10px 14px', fontSize: '0.75rem', opacity: 0.75 }}>{p.Observaciones}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
};

export default LegionCenturion;
