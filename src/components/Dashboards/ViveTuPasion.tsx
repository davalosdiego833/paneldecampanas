import React from 'react';
import { motion } from 'framer-motion';
import { AdvisorData } from '../../types';

interface Props {
    data: AdvisorData;
}

const ViveTuPasion: React.FC<Props> = ({ data }) => {
    const polizas = Number(data.Polizas || 0);
    const comisiones = Number(data.Comisiones || 0);
    const premioActual = String(data.Premio_Actual || 'Ninguno aún');

    const niveles = [
        { id: 1, pols: 5, com: 15000, premio: "Gorra Adidas y Termo 🧢", icon: "🧢" },
        { id: 2, pols: 7, com: 25000, premio: "Gorra, Termo y Frigobar 🧊", icon: "🧊" },
        { id: 3, pols: 9, com: 40000, premio: "Gorra, Termo, Frigobar y Barra SONOS 🔊", icon: "🔊" },
        { id: 4, pols: 12, com: 50000, premio: "Todo + TV 65 Pulgadas 📺", icon: "📺" }
    ];

    // Find current level (last one fully met)
    const currentLevel = [...niveles].reverse().find(n => polizas >= n.pols && comisiones >= n.com);
    const nextLevel = niveles.find(n => polizas < n.pols || comisiones < n.com);

    const progress_pct = currentLevel ? (currentLevel.id / 4) * 100 : 0;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
            {/* Main Stats */}
            <section>
                <div className="glass-card" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '24px',
                    padding: '32px',
                    borderLeft: '4px solid #007AFF'
                }}>
                    <div>
                        <p style={{ opacity: 0.6, fontSize: '0.9rem', marginBottom: '8px' }}>Tu Producción</p>
                        <div style={{ display: 'flex', gap: '32px' }}>
                            <div>
                                <p style={{ fontSize: '2.5rem', fontWeight: 800 }}>{polizas}</p>
                                <p style={{ fontSize: '0.8rem', opacity: 0.5 }}>Pólizas</p>
                            </div>
                            <div>
                                <p style={{ fontSize: '2.5rem', fontWeight: 800 }}>${comisiones.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                                <p style={{ fontSize: '0.8rem', opacity: 0.5 }}>Comisiones</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Prize Tracker */}
            <section>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '24px', opacity: 0.8 }}>Camino a la Pasión: Niveles de Premios</h3>
                <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Progress Bar Container */}
                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', position: 'relative', margin: '40px 0' }}>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress_pct}%` }}
                            transition={{ duration: 1.5, ease: "easeInOut" }}
                            style={{ height: '100%', background: 'var(--primary-blue)', borderRadius: '4px' }}
                        />

                        {/* Level Markers */}
                        <div style={{ position: 'absolute', top: '-24px', left: 0, width: '100%', display: 'flex', justifyContent: 'space-between' }}>
                            {niveles.map(n => {
                                const isMet = polizas >= n.pols && comisiones >= n.com;
                                return (
                                    <div key={n.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                                        <div style={{
                                            width: '16px',
                                            height: '16px',
                                            borderRadius: '50%',
                                            background: isMet ? 'var(--primary-blue)' : 'rgba(255,255,255,0.1)',
                                            border: '2px solid rgba(0,0,0,0.5)',
                                            boxShadow: isMet ? '0 0 10px var(--primary-blue)' : 'none',
                                            zIndex: 5
                                        }} />
                                        <span style={{ fontSize: '0.7rem', opacity: isMet ? 1 : 0.4, marginTop: '8px', fontWeight: 700 }}>NIVEL {n.id}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Level Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                        {niveles.map(n => {
                            const polOK = polizas >= n.pols;
                            const comOK = comisiones >= n.com;
                            const isMet = polOK && comOK;

                            return (
                                <div key={n.id} className="glass-card" style={{
                                    padding: '20px',
                                    opacity: isMet ? 1 : 0.5,
                                    border: isMet ? '1px solid var(--primary-blue)' : '1px solid rgba(255,255,255,0.05)',
                                    transform: isMet ? 'scale(1.02)' : 'none'
                                }}>
                                    <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{n.icon}</div>
                                    <h4 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: isMet ? 'var(--primary-blue)' : 'inherit' }}>Nivel {n.id}</h4>
                                    <p style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '12px', minHeight: '3em' }}>{n.premio}</p>
                                    <div style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <div style={{ color: polOK ? 'var(--success-green)' : 'inherit' }}>{polOK ? '✅' : '🔴'} {n.pols} Pólizas</div>
                                        <div style={{ color: comOK ? 'var(--success-green)' : 'inherit' }}>{comOK ? '✅' : '🔴'} ${n.com.toLocaleString()} Comis.</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Next Step Info */}
            <section>
                {nextLevel ? (
                    <div className="glass-card" style={{ textAlign: 'center', background: 'rgba(0,122,255,0.05)', border: '1px dashed var(--primary-blue)' }}>
                        <p style={{ fontSize: '1rem', fontWeight: 600 }}>Tus próximos pasos para el <span style={{ color: 'var(--primary-blue)' }}>Nivel {nextLevel.id}</span>:</p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', marginTop: '16px' }}>
                            <div>
                                <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{Math.max(0, nextLevel.pols - polizas)}</p>
                                <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>Pólizas faltantes</p>
                            </div>
                            <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />
                            <div>
                                <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>${Math.max(0, nextLevel.com - comisiones).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                                <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>Comisión faltante</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="glass-card" style={{ textAlign: 'center', background: 'rgba(0,230,118,0.1)', border: '1px solid var(--success-green)' }}>
                        <h2 style={{ fontSize: '2rem' }}>🎉 ¡CAMPEÓN! 🎉</h2>
                        <p>Has alcanzado el nivel máximo de la campaña Vive Tu Pasión.</p>
                    </div>
                )}
            </section>

            {/* Time Progress Bar */}
            <section style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 700, opacity: 0.8 }}>Vigencia de la Campaña (Marzo - Mayo)</p>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', overflow: 'hidden' }}>
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, Math.max(0, (new Date().getMonth() - 2 + 0.5) / 3 * 100))}%` }}
                        style={{ height: '100%', background: 'rgba(255,255,255,0.3)' }}
                    />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', opacity: 0.5, fontStyle: 'italic' }}>
                    <span>Marzo</span>
                    <span>Mes Actual: {new Intl.DateTimeFormat('es-MX', { month: 'long' }).format(new Date()).toUpperCase()}</span>
                    <span>Mayo (Cierre)</span>
                </div>
            </section>
        </div>
    );
};

export default ViveTuPasion;
