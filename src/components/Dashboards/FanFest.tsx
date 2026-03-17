import React from 'react';
import { motion } from 'framer-motion';
import { AdvisorData } from '../../types';

interface Props {
    data: AdvisorData;
}

const FanFest: React.FC<Props> = ({ data }) => {
    const enero = Number(data.Enero || 0);
    const febrero = Number(data.Febrero || 0);
    const marzo = Number(data.Marzo || 0);
    const abril = Number(data.Abril || 0);
    const total = Number(data.Total_Polizas || 0);
    const condicion = !!data.Condicion;
    const premio = String(data.Premio || 'PENDIENTE ⏳');

    const goal = 6;
    const progress_pct = Math.min(100, (total / goal) * 100);

    const statusColor = total >= goal && condicion ? 'var(--success-green)' : (total >= goal ? 'var(--accent-gold)' : 'var(--text-secondary)');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
            {/* Header Cards */}
            <section>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px', opacity: 0.8 }}>Resumen de Campaña</h3>
                <div className="glass-card" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '24px',
                    borderBottom: `4px solid ${statusColor}`,
                    padding: '32px'
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: '0.9rem', opacity: 0.6, marginBottom: '4px' }}>Total Pólizas (Ene-Abr)</p>
                        <p style={{ fontSize: '2.5rem', fontWeight: 800 }}>{total}</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: '0.9rem', opacity: 0.6, marginBottom: '4px' }}>Condición (Min 2 Mar-Abr)</p>
                        <p style={{ fontSize: '2rem', fontWeight: 700, color: condicion ? 'var(--success-green)' : 'var(--danger-red)' }}>
                            {condicion ? 'CUMPLIDA ✅' : 'PENDIENTE ❌'}
                        </p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: '0.9rem', opacity: 0.6, marginBottom: '4px' }}>Estatus de Premio</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 900, color: premio.includes('GANADO') ? 'var(--success-green)' : 'var(--accent-gold)' }}>
                            {premio}
                        </p>
                    </div>
                </div>
            </section>

            {/* Monthly Breakdown */}
            <section>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px', opacity: 0.8 }}>Desglose Mensual</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px' }}>
                    {[
                        { mes: 'Enero', val: enero },
                        { mes: 'Febrero', val: febrero },
                        { mes: 'Marzo', val: marzo },
                        { mes: 'Abril', val: abril }
                    ].map(m => (
                        <div key={m.mes} className="glass-card" style={{ textAlign: 'center', padding: '20px' }}>
                            <p style={{ fontSize: '0.8rem', textTransform: 'uppercase', opacity: 0.6, letterSpacing: '0.05em', marginBottom: '8px' }}>{m.mes}</p>
                            <p style={{ fontSize: '1.8rem', fontWeight: 700 }}>{m.val}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Progress Visual */}
            <section style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 700 }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Tu Avance a la Meta</span>
                        <span style={{ color: 'var(--accent-gold)' }}>{total} de {goal} Pólizas</span>
                    </div>
                    <div style={{ height: '24px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', overflow: 'hidden', padding: '4px' }}>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress_pct}%` }}
                            transition={{ duration: 1.2, ease: "easeOut" }}
                            style={{
                                height: '100%',
                                background: 'linear-gradient(90deg, #007AFF, #00E676)',
                                borderRadius: '8px',
                                boxShadow: '0 0 20px rgba(0,230,118,0.3)'
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', opacity: 0.6 }}>
                        <span>Inicio</span>
                        <span>{total >= goal ? '¡Meta de pólizas alcanzada! 🎯' : `Faltan ${goal - total} pólizas`}</span>
                        <span>Meta: {goal}</span>
                    </div>
                </div>

                {/* Prize Info Card */}
                <div className="glass-card" style={{
                    background: 'linear-gradient(135deg, rgba(0,122,255,0.1), rgba(0,230,118,0.1))',
                    padding: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    border: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <div style={{ fontSize: '3rem' }}>🎟️</div>
                    <div>
                        <h4 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '4px' }}>Premio Fan Fest</h4>
                        <p style={{ fontSize: '0.95rem', opacity: 0.8 }}>
                            Gana un **Pase al Evento** y un **Jersey Exclusivo de SMNYL**.
                            <br />
                            <span style={{ fontSize: '0.85rem', color: 'var(--accent-gold)' }}>*Requisito: 6 pólizas totales y mínimo 2 en el bimestre Marzo-Abril.</span>
                        </p>
                    </div>
                </div>

                {/* Time Progress Bar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '16px' }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: 700, opacity: 0.8 }}>Vigencia de la Campaña (Enero - Abril)</p>
                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', overflow: 'hidden' }}>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (new Date().getMonth() + 0.5) / 4 * 100)}%` }}
                            style={{ height: '100%', background: 'rgba(255,255,255,0.3)' }}
                        />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', opacity: 0.5, fontStyle: 'italic' }}>
                        <span>Enero</span>
                        <span>Mes Actual: {new Intl.DateTimeFormat('es-MX', { month: 'long' }).format(new Date()).toUpperCase()}</span>
                        <span>Abril (Cierre)</span>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default FanFest;
