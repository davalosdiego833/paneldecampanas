import React from 'react';
import { motion } from 'framer-motion';
import { AdvisorData } from '../../types';
import { Trophy, Target, Award, DollarSign, CheckCircle2, XCircle, AlertCircle, Percent } from 'lucide-react';

interface Props {
    data: AdvisorData;
}

const formatCurrency = (val: number | null | undefined) => {
    if (val == null || isNaN(Number(val))) return '$0.00';
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 }).format(Number(val));
};

const RetoPorCiento: React.FC<Props> = ({ data }) => {
    const conteo = Number(data.Conteo || 0);
    const sumaComision = Number(data.Suma_Comision || 0);
    const porcentaje = Number(data.Porcentaje || 0);
    const extracomision = Number(data.Extracomision || 0);
    const cumplimiento = Boolean(data.Cumplimiento);

    // Calculate next tier target
    let nextTier = 4;
    let nextPct = '20%';
    if (conteo >= 12) {
        nextTier = 12;
        nextPct = '40% (¡MÁXIMO ALCANZADO!)';
    } else if (conteo >= 10) {
        nextTier = 12;
        nextPct = '40%';
    } else if (conteo >= 8) {
        nextTier = 10;
        nextPct = '35%';
    } else if (conteo >= 6) {
        nextTier = 8;
        nextPct = '30%';
    } else if (conteo >= 4) {
        nextTier = 6;
        nextPct = '25%';
    }

    const progressPct = Math.min(100, (conteo / nextTier) * 100);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

            {/* KPI Cards Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '20px'
            }}>
                {/* Card 1: Pólizas Contadas */}
                <motion.div whileHover={{ scale: 1.02 }} className="glass-card" style={{ padding: '24px', borderTop: '4px solid #FF9800' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pólizas Contadas</span>
                        <Target size={22} style={{ color: '#FF9800' }} />
                    </div>
                    <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#fff' }}>{conteo}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        {conteo >= 12 ? '¡Meta Máxima Cumplida!' : `Te faltan ${Math.max(0, nextTier - conteo)} para el ${nextPct}`}
                    </div>
                </motion.div>

                {/* Card 2: Porcentaje Extra */}
                <motion.div whileHover={{ scale: 1.02 }} className="glass-card" style={{ padding: '24px', borderTop: '4px solid #D4AF37' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>% Extra Ganado</span>
                        <Percent size={22} style={{ color: '#D4AF37' }} />
                    </div>
                    <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#D4AF37' }}>{(porcentaje * 100).toFixed(0)}%</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Sobre comisión generada</div>
                </motion.div>

                {/* Card 3: Suma Comisión */}
                <motion.div whileHover={{ scale: 1.02 }} className="glass-card" style={{ padding: '24px', borderTop: '4px solid #007AFF' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Base Comisión</span>
                        <DollarSign size={22} style={{ color: '#007AFF' }} />
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>{formatCurrency(sumaComision)}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Comisiones acumuladas en campaña</div>
                </motion.div>

                {/* Card 4: Extra Comisión */}
                <motion.div whileHover={{ scale: 1.02 }} className="glass-card" style={{ padding: '24px', borderTop: '4px solid #00E676' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Extra Comisión</span>
                        <Trophy size={22} style={{ color: '#00E676' }} />
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#00E676' }}>{formatCurrency(extracomision)}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Monto ganado adicional</div>
                </motion.div>
            </div>

            {/* Target Tier Progress Bar */}
            <div className="glass-card" style={{ padding: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: 0 }}>Progreso de Escalafón</h3>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                            {conteo >= 4 ? `Has alcanzado ${(porcentaje * 100).toFixed(0)}% extra de comisión.` : 'Emite y paga tus primeras 4 pólizas para desbloquear el 20% extra.'}
                        </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '20px', background: cumplimiento ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255, 152, 0, 0.15)', border: `1px solid ${cumplimiento ? 'rgba(0, 230, 118, 0.3)' : 'rgba(255, 152, 0, 0.3)'}`, color: cumplimiento ? '#00E676' : '#FF9800', fontWeight: 700, fontSize: '0.85rem' }}>
                        {cumplimiento ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                        <span>{cumplimiento ? 'EN META (CUMPLIDO)' : 'EN PROCESO'}</span>
                    </div>
                </div>

                <div style={{ width: '100%', height: '14px', background: 'rgba(255,255,255,0.06)', borderRadius: '10px', overflow: 'hidden', position: 'relative', marginBottom: '20px' }}>
                    <div style={{ width: `${progressPct}%`, height: '100%', background: 'linear-gradient(90deg, #FF9800, #D4AF37, #00E676)', borderRadius: '10px', transition: 'width 0.5s ease' }} />
                </div>

                {/* Tiers Visual Matrix */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                    {[
                        { polizas: 4, pct: 20 },
                        { polizas: 6, pct: 25 },
                        { polizas: 8, pct: 30 },
                        { polizas: 10, pct: 35 },
                        { polizas: 12, pct: 40 },
                    ].map((t, idx) => {
                        const isReached = conteo >= t.polizas;
                        return (
                            <div key={idx} style={{
                                padding: '14px',
                                borderRadius: '14px',
                                background: isReached ? 'rgba(0, 230, 118, 0.12)' : 'rgba(255,255,255,0.03)',
                                border: `1px solid ${isReached ? 'rgba(0, 230, 118, 0.3)' : 'var(--glass-border)'}`,
                                textAlign: 'center',
                                transition: 'all 0.2s ease'
                            }}>
                                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: isReached ? '#00E676' : '#fff' }}>
                                    {t.polizas} {t.polizas === 12 ? 'o más' : ''}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: '2px 0 6px' }}>PÓLIZAS</div>
                                <div style={{ fontSize: '1rem', fontWeight: 800, color: isReached ? '#00E676' : '#D4AF37' }}>
                                    +{t.pct}% Extra
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Campaign Rules & Bases Card */}
            <div className="glass-card" style={{ padding: '28px', borderLeft: '4px solid #D4AF37' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#D4AF37', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Award size={22} />
                    Bases de Participación — Reto Por Ciento (Julio - Agosto 2026)
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.6 }}>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                        <h4 style={{ color: '#fff', fontSize: '0.92rem', fontWeight: 700, marginBottom: '8px' }}>👤 Asesores Participantes</h4>
                        <p style={{ margin: 0 }}>Campaña exclusiva para <b>Asesores Consolidados</b> con año de conexión <b>2022 o anteriores</b>.</p>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                        <h4 style={{ color: '#fff', fontSize: '0.92rem', fontWeight: 700, marginBottom: '8px' }}>🛡️ Reglas de Conteo & Prima Mínima</h4>
                        <ul style={{ margin: 0, paddingLeft: '20px' }}>
                            <li><b>Vida Individual:</b> Cuenta <b>1 póliza</b> (Prima mínima $17,000 MXN).</li>
                            <li><b>Gastos Médicos:</b> Cuenta <b>0.5 póliza</b> (Prima mínima $15,000 MXN).</li>
                            <li>Aplica para pólizas semestrales y anuales emitidas y pagadas durante el periodo de la campaña.</li>
                        </ul>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default RetoPorCiento;
