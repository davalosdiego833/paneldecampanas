import React from 'react';
import { motion } from 'framer-motion';
import { AdvisorData } from '../../types';

interface Props {
    data: AdvisorData;
}

const formatCurrency = (val: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val);

const Mdrt: React.FC<Props> = ({ data }) => {
    const META_MEMBER = 1810400;
    const META_COT = 5431200;
    const META_TOT = 10862400;

    const pa_acumulada = Number(data.PA_Acumulada || 0);
    const mes_actual = Number(data.Mes_Actual || 1);
    const faltante_miembro = Math.max(0, Number(data.PA_Faltante_Miembro || 0));
    const faltante_cot = Math.max(0, Number(data.PA_Faltante_COT || 0));
    const faltante_tot = Math.max(0, Number(data.PA_Faltante_TOT || 0));

    const meses_restantes = Math.max(1, 12 - Math.floor(mes_actual) + 1);
    const mensual_member = faltante_miembro / meses_restantes;
    const mensual_cot = faltante_cot / meses_restantes;
    const mensual_tot = faltante_tot / meses_restantes;

    const getProgressColor = (pct: number) => {
        if (pct < 40) return 'var(--danger-red)';
        if (pct < 80) return 'var(--accent-gold)';
        return 'var(--success-green)';
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
            {/* Metas Totales */}
            <section>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px', opacity: 0.8 }}>Metas MDRT 2026</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                    <div className="glass-card">
                        <p style={{ fontSize: '0.9rem', opacity: 0.6, marginBottom: '4px' }}>Meta Miembro</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{formatCurrency(META_MEMBER)}</p>
                    </div>
                    <div className="glass-card">
                        <p style={{ fontSize: '0.9rem', opacity: 0.6, marginBottom: '4px' }}>Meta COT</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{formatCurrency(META_COT)}</p>
                    </div>
                    <div className="glass-card">
                        <p style={{ fontSize: '0.9rem', opacity: 0.6, marginBottom: '4px' }}>Meta TOT</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{formatCurrency(META_TOT)}</p>
                    </div>
                </div>
            </section>

            {/* Realidad Actual */}
            <section style={{ display: 'flex', justifyContent: 'center' }}>
                <div className="glass-card" style={{ width: '100%', maxWidth: '500px', border: '2px solid var(--accent-gold)', padding: '32px', textAlign: 'center', boxShadow: '0 0 30px rgba(212, 175, 55, 0.1)' }}>
                    <p style={{ fontSize: '1.1rem', opacity: 0.7, marginBottom: '8px' }}>Tu Producción Actual (PA)</p>
                    <p style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--accent-gold)' }}>{formatCurrency(pa_acumulada)}</p>
                </div>
            </section>

            {/* Plan de Ataque */}
            <section>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px', opacity: 0.8 }}>Plan de Ataque (Restante)</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>

                    {/* Member */}
                    <div className="glass-card" style={{ borderBottom: '4px solid var(--success-green)' }}>
                        <h4 style={{ fontWeight: 700, color: 'var(--success-green)', marginBottom: '16px', fontSize: '1.1rem' }}>Nivel MIEMBRO</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <p style={{ fontSize: '0.85rem', opacity: 0.6 }}>Faltante</p>
                                <p style={{ fontSize: '1.2rem', fontWeight: 600 }}>{formatCurrency(faltante_miembro)}</p>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <p style={{ fontSize: '0.85rem', opacity: 0.6 }}>Promedio Mensual</p>
                                <p style={{ fontSize: '1.2rem', fontWeight: 600 }}>{formatCurrency(mensual_member)}</p>
                            </div>
                        </div>
                    </div>

                    {/* COT */}
                    <div className="glass-card" style={{ borderBottom: '4px solid var(--primary-blue)' }}>
                        <h4 style={{ fontWeight: 700, color: 'var(--primary-blue)', marginBottom: '16px', fontSize: '1.1rem' }}>Nivel COT</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <p style={{ fontSize: '0.85rem', opacity: 0.6 }}>Faltante</p>
                                <p style={{ fontSize: '1.2rem', fontWeight: 600 }}>{formatCurrency(faltante_cot)}</p>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <p style={{ fontSize: '0.85rem', opacity: 0.6 }}>Promedio Mensual</p>
                                <p style={{ fontSize: '1.2rem', fontWeight: 600 }}>{formatCurrency(mensual_cot)}</p>
                            </div>
                        </div>
                    </div>

                    {/* TOT */}
                    <div className="glass-card" style={{ borderBottom: '4px solid var(--accent-gold)' }}>
                        <h4 style={{ fontWeight: 700, color: 'var(--accent-gold)', marginBottom: '16px', fontSize: '1.1rem' }}>Nivel TOT</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <p style={{ fontSize: '0.85rem', opacity: 0.6 }}>Faltante</p>
                                <p style={{ fontSize: '1.2rem', fontWeight: 600 }}>{formatCurrency(faltante_tot)}</p>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <p style={{ fontSize: '0.85rem', opacity: 0.6 }}>Promedio Mensual</p>
                                <p style={{ fontSize: '1.2rem', fontWeight: 600 }}>{formatCurrency(mensual_tot)}</p>
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* Carreras Visuales */}
            <section style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, opacity: 0.8 }}>Carreras Visuales</h3>

                {[
                    { label: 'Camino a Miembro', meta: META_MEMBER, color: 'var(--success-green)' },
                    { label: 'Camino a COT', meta: META_COT, color: 'var(--primary-blue)' },
                    { label: 'Camino a TOT', meta: META_TOT, color: 'var(--accent-gold)' }
                ].map(bar => {
                    const pct = Math.min(100, (pa_acumulada / bar.meta) * 100);
                    return (
                        <div key={bar.label} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 700 }}>
                                <span>{bar.label}</span>
                                <span>{pct.toFixed(1)}%</span>
                            </div>
                            <div style={{ height: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', overflow: 'hidden' }}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    style={{ height: '100%', background: bar.color }}
                                />
                            </div>
                        </div>
                    );
                })}

                {/* Time Progress */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '32px' }}>
                    <p style={{ fontSize: '0.9rem', fontWeight: 700 }}>Avance del Año (Tiempo)</p>
                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', overflow: 'hidden' }}>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(mes_actual / 12) * 100}%` }}
                            transition={{ duration: 1 }}
                            style={{ height: '100%', background: 'var(--text-secondary)' }}
                        />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', opacity: 0.5, fontStyle: 'italic' }}>
                        <span>Enero</span>
                        <span>Mes {mes_actual} de 12</span>
                        <span>Diciembre</span>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Mdrt;
