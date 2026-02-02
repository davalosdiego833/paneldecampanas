import React from 'react';
import { motion } from 'framer-motion';
import { AdvisorData } from '../../types';

interface Props {
    data: AdvisorData;
}

const formatCurrency = (val: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val);

const Convenciones: React.FC<Props> = ({ data }) => {
    const comision_vida = Number(data.Comision_Vida || 0);
    const rda = Number(data.RDA || 0);
    const comisiones_totales = comision_vida + rda;
    const polizas = Number(data.Polizas || 0);
    const lugar = Number(data.Lugar || 0);

    const is_qualified = (lugar <= 480 && polizas >= 30 && comisiones_totales >= 588500);
    const status_txt = is_qualified ? "✅ DENTRO DE RANGO" : "❌ POR CALIFICAR";
    const status_color = is_qualified ? 'var(--success-green)' : 'var(--danger-red)';

    const targets = [
        { label: "1 Diamante (Cancún)", val: Number(data.Lugar_480 || 588500) },
        { label: "2 Diamantes (Costa Rica)", val: Number(data.Lugar_228 || 0) },
        { label: "3 Diamantes (París)", val: Number(data.Lugar_108 || 0) },
        { label: "Gran Diamante (Amalfi)", val: Number(data.Lugar_28 || 0) }
    ];

    const destinos = [
        { label: "Cancún (1 Diamante)", img: "cancun.jpeg" },
        { label: "Costa Rica (2 Diamantes)", img: "costa_rica.jpeg" },
        { label: "París (3 Diamantes)", img: "paris.jpeg" },
        { label: "Amalfitana (Gran Diamante)", img: "amalfi.jpeg" }
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
            <div style={{
                background: 'rgba(0, 230, 118, 0.15)',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid rgba(0, 230, 118, 0.3)',
                color: 'var(--success-green)',
                fontWeight: 600,
                textAlign: 'center'
            }}>
                Dato importante: Para clasificar a convenciones necesitamos un mínimo de 30 pólizas y un mínimo de $588,500 de comisiones.
            </div>

            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                <div className="glass-card">
                    <p style={{ fontSize: '0.9rem', opacity: 0.6, marginBottom: '4px' }}>Créditos Vida</p>
                    <p style={{ fontSize: '1.8rem', fontWeight: 600 }}>{formatCurrency(comision_vida)}</p>
                </div>
                <div className="glass-card">
                    <p style={{ fontSize: '0.9rem', opacity: 0.6, marginBottom: '4px' }}>RDA</p>
                    <p style={{ fontSize: '1.8rem', fontWeight: 600 }}>{formatCurrency(rda)}</p>
                </div>
                <div className="glass-card" style={{ borderBottom: '4px solid var(--success-green)' }}>
                    <p style={{ fontSize: '0.9rem', opacity: 0.6, marginBottom: '4px' }}>Créditos Totales</p>
                    <p style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--success-green)' }}>{formatCurrency(comisiones_totales)}</p>
                </div>

                <div className="glass-card">
                    <p style={{ fontSize: '0.9rem', opacity: 0.6, marginBottom: '4px' }}>Pólizas</p>
                    <p style={{ fontSize: '1.8rem', fontWeight: 600 }}>{polizas}</p>
                </div>
                <div className="glass-card">
                    <p style={{ fontSize: '0.9rem', opacity: 0.6, marginBottom: '4px' }}>Lugar</p>
                    <p style={{ fontSize: '1.8rem', fontWeight: 600 }}>#{lugar}</p>
                </div>
                <div className="glass-card" style={{ borderBottom: `4px solid ${status_color}` }}>
                    <p style={{ fontSize: '0.9rem', opacity: 0.6, marginBottom: '4px' }}>Estatus Viaje</p>
                    <p style={{ fontSize: '1.4rem', fontWeight: 900, color: status_color }}>{status_txt}</p>
                </div>
            </section>

            <section>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '24px', opacity: 0.8 }}>¿Cuánto tiene el último lugar?</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                    {targets.map(t => (
                        <div key={t.label} className="glass-card" style={{ textAlign: 'center', padding: '20px' }}>
                            <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.6, marginBottom: '4px' }}>{t.label}</p>
                            <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>{formatCurrency(t.val)}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, opacity: 0.8 }}>Dashboards de Persecución</h3>
                {targets.map(t => {
                    const progress = Math.min(100, (comisiones_totales / (t.val || 1)) * 100);
                    return (
                        <div key={t.label} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <p style={{ fontSize: '0.9rem', fontWeight: 700 }}>Persecución: {t.label.split(' (')[1].slice(0, -1)}</p>
                            <div style={{ height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', overflow: 'hidden' }}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 1, ease: 'easeOut' }}
                                    style={{ height: '100%', background: 'var(--success-green)' }}
                                />
                            </div>
                            <div style={{ display: 'flex', justifySelf: 'between', fontSize: '0.75rem', opacity: 0.6, justifyContent: 'space-between' }}>
                                <span>$0</span>
                                <span style={{ fontWeight: 700, color: 'var(--success-green)' }}>{comisiones_totales >= t.val ? '¡Meta Lograda! 🎉' : `Faltante: ${formatCurrency(t.val - comisiones_totales)}`}</span>
                                <span>Meta: {formatCurrency(t.val)}</span>
                            </div>
                        </div>
                    );
                })}
            </section>

            <section>
                <h3 style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 700, marginBottom: '32px' }}>¿Sabes cuáles son los destinos?</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
                    {destinos.map(d => (
                        <div key={d.label} style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div className="glass-card" style={{ padding: 0, overflow: 'hidden', borderRadius: '12px', aspectRatio: '16/9' }}>
                                <img src={`/assets/destinos/${d.img}`} alt={d.label} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }} className="hover:scale-105" />
                            </div>
                            <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{d.label}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default Convenciones;
