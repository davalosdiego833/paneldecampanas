import React from 'react';
import { motion } from 'framer-motion';
import { AdvisorData } from '../../types';

interface Props {
    data: AdvisorData;
}

const formatCurrency = (val: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val);

const Convenciones: React.FC<Props> = ({ data }) => {
    // Base metrics
    const comision_vida = Number(data.Comision_Vida || 0);
    const rda = Number(data.RDA || 0);
    const creditos_totales = Number(data.PA_Total || 0);
    const polizas = Number(data.Polizas || 0);
    const lugar = Number(data.Lugar || 0);
    const nivel_convencion = String(data.Nivel_Convencion || '');

    // Qualification Logic (Smnylo specific thresholds)
    // Use data provided by API if exists, otherwise calculate
    const cumple_polizas = data.Cumple_Polizas !== undefined ? Boolean(data.Cumple_Polizas) : (polizas >= 30);
    const cumple_creditos = data.Cumple_Creditos !== undefined ? Boolean(data.Cumple_Creditos) : (creditos_totales >= 588500);
    const califica = data.Califica !== undefined ? Boolean(data.Califica) : (cumple_polizas && cumple_creditos);

    let destino_alcanzado = "";
    if (califica) {
        if (lugar <= 28) destino_alcanzado = "A AMALFI";
        else if (lugar <= 108) destino_alcanzado = "A PARÍS";
        else if (lugar <= 228) destino_alcanzado = "A COSTA RICA";
        else if (lugar <= 480) destino_alcanzado = "A CANCÚN";
    }

    const status_txt = califica ? `✅ CALIFICA ${destino_alcanzado}` : "❌ NO CALIFICA";
    const status_color = califica ? 'var(--success-green)' : 'var(--danger-red)';

    const targets = [
        { label: "1 Diamante (Cancún)", val: Number(data.Lugar_480 || 0), color: '#60A5FA' },
        { label: "2 Diamantes (Costa Rica)", val: Number(data.Lugar_228 || 0), color: '#34D399' },
        { label: "3 Diamantes (París)", val: Number(data.Lugar_108 || 0), color: '#FBBF24' },
        { label: "Gran Diamante (Amalfi)", val: Number(data.Lugar_28 || 0), color: '#F472B6' }
    ];

    const destinos = [
        { label: "Cancún (1 Diamante)", img: "cancun.jpeg" },
        { label: "Costa Rica (2 Diamantes)", img: "costa_rica.jpeg" },
        { label: "París (3 Diamantes)", img: "paris.jpeg" },
        { label: "Amalfitana (Gran Diamante)", img: "amalfi.jpeg" }
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
            {/* Candados Alert */}
            <div style={{
                background: 'rgba(0, 230, 118, 0.15)',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid rgba(0, 230, 118, 0.3)',
                color: 'var(--success-green)',
                fontWeight: 600,
                textAlign: 'center'
            }}>
                Dato importante: Para clasificar a convenciones necesitamos un mínimo de <b>30 pólizas</b> y un mínimo de <b>$588,500</b> de créditos.
            </div>

            {/* Nivel de Convención */}
            {nivel_convencion && (
                <div style={{
                    background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(244, 114, 182, 0.2))',
                    padding: '20px 24px',
                    borderRadius: '12px',
                    border: '1px solid rgba(251, 191, 36, 0.4)',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                }}>
                    <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>¡Vas en meta para:</p>
                    <p style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--accent-gold)' }}>{nivel_convencion}</p>
                </div>
            )}

            {/* Info Cards */}
            <section>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px', opacity: 0.8 }}>Información Importante</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <div className="glass-card" style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '4px', textTransform: 'uppercase' }}>Créditos Vida</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 600 }}>{formatCurrency(comision_vida)}</p>
                    </div>
                    <div className="glass-card" style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '4px', textTransform: 'uppercase' }}>RDA (GMM)</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 600 }}>{formatCurrency(rda)}</p>
                    </div>
                    <div className="glass-card" style={{ textAlign: 'center', borderBottom: '4px solid var(--success-green)' }}>
                        <p style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '4px', textTransform: 'uppercase' }}>Créditos Totales</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success-green)' }}>{formatCurrency(creditos_totales)}</p>
                    </div>
                    <div className="glass-card" style={{ textAlign: 'center', borderBottom: cumple_polizas ? '4px solid var(--success-green)' : '4px solid var(--danger-red)' }}>
                        <p style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '4px', textTransform: 'uppercase' }}>Pólizas</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 600 }}>{polizas}</p>
                        <p style={{ fontSize: '0.7rem', color: cumple_polizas ? 'var(--success-green)' : 'var(--danger-red)', fontWeight: 700 }}>
                            {cumple_polizas ? '✅ Mínimo 30 OK' : `❌ Faltan ${Math.max(0, 30 - polizas).toFixed(1)}`}
                        </p>
                    </div>
                    <div className="glass-card" style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '4px', textTransform: 'uppercase' }}>Lugar Nacional</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 700, color: lugar <= 480 ? 'var(--accent-gold)' : 'var(--text-primary)' }}>#{lugar}</p>
                    </div>
                    <div className="glass-card" style={{ textAlign: 'center', borderBottom: `4px solid ${status_color}` }}>
                        <p style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '4px', textTransform: 'uppercase' }}>Estatus</p>
                        <p style={{ fontSize: '1.2rem', fontWeight: 900, color: status_color }}>{status_txt}</p>
                    </div>
                </div>
            </section>

            {/* Convention Thresholds */}
            <section>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '24px', opacity: 0.8 }}>¿Cuánto tiene el último lugar de cada convención?</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                    {targets.map(t => (
                        <div key={t.label} className="glass-card" style={{ textAlign: 'center', padding: '20px', borderBottom: `3px solid ${t.color}` }}>
                            <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.6, marginBottom: '8px', letterSpacing: '0.05em' }}>{t.label}</p>
                            <p style={{ fontSize: '1.2rem', fontWeight: 700, color: t.color }}>{formatCurrency(t.val)}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Persecution Dashboards */}
            <section style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, opacity: 0.8 }}>Dashboards de Persecución</h3>
                {targets.map(t => {
                    const progress = Math.min(100, (creditos_totales / (t.val || 1)) * 100);
                    const faltante = Math.max(0, t.val - creditos_totales);
                    const reached = creditos_totales >= t.val && t.val > 0;
                    return (
                        <div key={t.label} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 700 }}>
                                <span style={{ color: t.color }}>{t.label.split(' (')[1]?.slice(0, -1) || t.label}</span>
                                <span style={{ color: t.color }}>{progress.toFixed(1)}%</span>
                            </div>
                            <div style={{ height: '14px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', overflow: 'hidden' }}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 1, ease: 'easeOut' }}
                                    style={{ height: '100%', background: t.color, borderRadius: '999px' }}
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', opacity: 0.6 }}>
                                <span>$0</span>
                                <span style={{ fontWeight: 700, color: reached ? 'var(--success-green)' : t.color }}>
                                    {reached ? '¡Meta Lograda! 🎉' : `Faltante: ${formatCurrency(faltante)}`}
                                </span>
                                <span>Meta: {formatCurrency(t.val)}</span>
                            </div>
                        </div>
                    );
                })}
            </section>

            {/* Destinations */}
            <section>
                <h3 style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 700, marginBottom: '32px' }}>¿Sabes cuáles son los destinos?</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
                    {destinos.map(d => (
                        <div key={d.label} style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div className="glass-card" style={{ padding: 0, overflow: 'hidden', borderRadius: '12px', aspectRatio: '16/9' }}>
                                <img src={`/assets/destinos/${d.img}`} alt={d.label} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }} />
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
