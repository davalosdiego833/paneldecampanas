import React from 'react';
import { motion } from 'framer-motion';
import { AdvisorData } from '../../types';

interface Props {
    data: AdvisorData;
}

const CaminoCumbre: React.FC<Props> = ({ data }) => {
    const mes_asesor = Math.floor(Number(data.Mes_Asesor || 1));
    const polizas_totales = Number(data.Polizas_Totales || 0);
    const status_orig = String(data.Estatus_meta || '').toUpperCase();
    const trimestre = data.Trimestre || 1;
    const meta_acumulada = mes_asesor * 4;

    // Alert logic
    const isAlert = mes_asesor <= 3 && Number(data[`Mes_${mes_asesor}_Prod`] || 0) === 0;
    const status_txt = isAlert ? '⚠️ ALERTA: MES SIN ACTIVIDAD' : status_orig;
    const isInMeta = status_orig.includes('EN META') && !isAlert;

    const statusColor = isInMeta ? 'var(--success-green)' : 'var(--danger-red)';

    const progress_pct = Math.min(100, (polizas_totales / (meta_acumulada || 1)) * 100);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, opacity: 0.8 }}>Información Importante</h3>
                    <div className="glass-card" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                        gap: '24px',
                        borderBottom: `4px solid ${statusColor}`,
                        padding: '32px'
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '0.8rem', opacity: 0.6, textTransform: 'uppercase', marginBottom: '8px' }}>Pólizas Totales</p>
                            <p style={{ fontSize: '2rem', fontWeight: 700 }}>{polizas_totales.toFixed(1)}</p>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '0.8rem', opacity: 0.6, textTransform: 'uppercase', marginBottom: '8px' }}>Estatus Actual</p>
                            <p style={{ fontSize: '1.5rem', fontWeight: 900, color: statusColor }}>{status_txt}</p>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '0.8rem', opacity: 0.6, textTransform: 'uppercase', marginBottom: '8px' }}>Trimestre Actual</p>
                            <p style={{ fontSize: '2rem', fontWeight: 700 }}>{trimestre}</p>
                        </div>
                    </div>
                </div>

                {/* Time Donut */}
                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
                    <div style={{ position: 'relative', width: '140px', height: '140px' }}>
                        <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }} viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="transparent" />
                            <motion.circle
                                cx="50" cy="50" r="40"
                                stroke="var(--primary-blue)"
                                strokeWidth="8"
                                strokeLinecap="round"
                                fill="transparent"
                                initial={{ strokeDasharray: "0 251.2" }}
                                animate={{ strokeDasharray: `${(mes_asesor / 18) * 251.2} 251.2` }}
                                transition={{ duration: 1 }}
                            />
                        </svg>
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: '1.8rem', fontWeight: 700 }}>{mes_asesor}</span>
                            <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>de 18</span>
                        </div>
                    </div>
                    <p style={{ fontSize: '0.85rem', fontWeight: 700, opacity: 0.6, marginTop: '16px' }}>Mes del Asesor</p>
                </div>
            </section>

            <section>
                <div style={{ background: 'rgba(0, 122, 255, 0.15)', padding: '16px 24px', borderRadius: '12px', color: '#60A5FA', fontWeight: 600, marginBottom: '32px', textAlign: 'center' }}>
                    Tu meta acumulada al mes {mes_asesor} es de {meta_acumulada} pólizas
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 700, color: '#60A5FA' }}>
                        <span>Dashboard de Meta Mensual</span>
                        <span>{progress_pct.toFixed(1)}%</span>
                    </div>
                    <div style={{ height: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', overflow: 'hidden' }}>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress_pct}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            style={{ height: '100%', background: 'var(--primary-blue)' }}
                        />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', opacity: 0.6 }}>
                        <span>0</span>
                        <span>{polizas_totales >= meta_acumulada ? '¡Meta Lograda! 🎉' : `Avance: ${polizas_totales.toFixed(1)} de ${meta_acumulada}`}</span>
                        <span>Meta: {meta_acumulada}</span>
                    </div>
                </div>
            </section>

            <footer className="glass-card" style={{ borderLeft: '4px solid var(--primary-blue)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ fontWeight: 700, color: 'var(--primary-blue)', fontSize: '1.1rem' }}>Reglas de Continuidad Operativa</h4>
                <p style={{ opacity: 0.8, fontSize: '0.95rem' }}>
                    <b>Continuidad del programa:</b> Todo asesor debe mantener actividad constante.
                    Cerrar el primer trimestre con producción nula implica la baja automática.
                </p>
                <p style={{ opacity: 0.8, fontSize: '0.95rem' }}>
                    <b>Ventanas de Recuperación:</b> Cortes estratégicos en el <b>Mes 9</b> y <b>Mes 18</b>.
                </p>
            </footer>
        </div>
    );
};

export default CaminoCumbre;
