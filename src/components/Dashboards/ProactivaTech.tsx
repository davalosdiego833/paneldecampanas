import React from 'react';
import { motion } from 'framer-motion';
import { AdvisorData } from '../../types';

interface Props {
    data: AdvisorData;
}

const NIVELES = [
    { id: 4, name: 'iPhone 17 Pro Max (256GB) + $10,000', icon: '📱👑', pols: 15, com: 45000, minRank: 1, maxRank: 15, color: '#FFD700' },
    { id: 3, name: 'iPhone 17 (256GB) + $7,500', icon: '📱', pols: 12, com: 30000, minRank: 16, maxRank: 35, color: '#E0E0E0' },
    { id: 2, name: 'Apple Watch Serie 11 + $5,000', icon: '⌚', pols: 9, com: 15000, minRank: 36, maxRank: 85, color: '#CD7F32' },
    { id: 1, name: 'AirPods Pro 3 + $2,500', icon: '🎧', pols: 6, com: 9000, minRank: 86, maxRank: 195, color: '#00E676' }
];

const ProactivaTech: React.FC<Props> = ({ data }) => {
    const rank = Number(data.Ranking || 99999);
    const polizas = Number(data.Polizas || 0);
    const comisiones = Number(data.Comisiones || 0);
    const fechaCorte = data.Fecha_Corte || '';

    // Find what bracket the advisor's ranking belongs to
    const targetLevel = NIVELES.find(n => rank >= n.minRank && rank <= n.maxRank);

    // Determine the highest prize level they meet requirements for,
    // up to their maximum possible level (targetLevel)
    let prizeWon = null;
    if (rank <= 195) {
        const maxLevelAllowed = targetLevel ? targetLevel.id : 1;
        const allowedLevels = NIVELES.filter(n => n.id <= maxLevelAllowed);
        for (const lvl of allowedLevels) {
            if (polizas >= lvl.pols && comisiones >= lvl.com) {
                prizeWon = lvl;
                break;
            }
        }
    }

interface Level {
    id: number;
    name: string;
    icon: string;
    pols: number;
    com: number;
    minRank: number;
    maxRank: number;
    color: string;
    customMsg?: string;
}

    // Determine next target level sequentially
    let nextLevel: Level | null = null;
    if (!prizeWon) {
        // Si no han ganado ningún premio, el primer objetivo es calificar al premio más bajo (AirPods Pro 3)
        const lowestLevel = NIVELES.find(n => n.id === 1);
        if (lowestLevel) {
            nextLevel = { 
                ...lowestLevel, 
                customMsg: rank > 195 ? 'Entrar al Top 195 del Ranking' : undefined 
            };
        }
    } else {
        // Si ya tienen un premio ganado, el objetivo es el siguiente nivel de premio
        const currentPrizeId = prizeWon.id;
        const nextPrizeLevel = NIVELES.find(n => n.id === currentPrizeId + 1);
        
        if (nextPrizeLevel) {
            if (rank <= nextPrizeLevel.maxRank) {
                // Su ranking ya es suficiente para el siguiente premio, solo falta producción
                nextLevel = nextPrizeLevel;
            } else {
                // Necesitan subir en el ranking para poder aspirar a este siguiente premio
                nextLevel = {
                    ...nextPrizeLevel,
                    customMsg: `Subir al Lugar ${nextPrizeLevel.maxRank} en el Ranking`
                };
            }
        }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
            {/* KPI Cards */}
            <section>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px', opacity: 0.8 }}>Resumen de Producción</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
                    <div className="glass-card" style={{ textAlign: 'center', borderTop: '4px solid var(--primary-blue)' }}>
                        <p style={{ fontSize: '0.9rem', opacity: 0.6, marginBottom: '4px' }}>Lugar Nacional</p>
                        <p style={{ fontSize: '2rem', fontWeight: 700, color: rank <= 195 ? '#007AFF' : 'inherit' }}>
                            {rank <= 9999 ? `#${rank}` : 'Sin ranking'}
                        </p>
                        <p style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '4px' }}>
                            {rank <= 195 ? '🎯 Zona de Calificación' : '⚠️ Fuera de Calificación (Top 195)'}
                        </p>
                    </div>
                    <div className="glass-card" style={{ textAlign: 'center', borderTop: '4px solid #00E676' }}>
                        <p style={{ fontSize: '0.9rem', opacity: 0.6, marginBottom: '4px' }}>Pólizas Acumuladas</p>
                        <p style={{ fontSize: '2rem', fontWeight: 700 }}>{polizas.toFixed(1)}</p>
                    </div>
                    <div className="glass-card" style={{ textAlign: 'center', borderTop: '4px solid #FF9800' }}>
                        <p style={{ fontSize: '0.9rem', opacity: 0.6, marginBottom: '4px' }}>Comisiones Acumuladas</p>
                        <p style={{ fontSize: '2rem', fontWeight: 700 }}>
                            ${comisiones.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                        </p>
                    </div>
                </div>
            </section>

            {/* Current Reward Status */}
            <section>
                <div className="glass-card" style={{
                    background: prizeWon
                        ? 'linear-gradient(135deg, rgba(0,230,118,0.1) 0%, rgba(10,14,23,0.8) 100%)'
                        : 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(10,14,23,0.8) 100%)',
                    border: prizeWon ? '1px solid #00E676' : '1px solid rgba(255,255,255,0.05)',
                    padding: '32px',
                    textAlign: 'center',
                    borderRadius: '20px'
                }}>
                    {prizeWon ? (
                        <div>
                            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '8px' }}>🎉</span>
                            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#00E676', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Premio Actual Ganado</h4>
                            <p style={{ fontSize: '1.8rem', fontWeight: 900, margin: '8px 0', color: '#fff' }}>{prizeWon.name}</p>
                            <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>Has asegurado este premio al estar en el ranking y cumplir con los mínimos requeridos.</p>
                        </div>
                    ) : (
                        <div>
                            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '8px' }}>⏳</span>
                            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Premio Actual</h4>
                            <p style={{ fontSize: '1.8rem', fontWeight: 900, margin: '8px 0', color: 'rgba(255,255,255,0.4)' }}>Sin premio aún</p>
                            <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>Necesitas cumplir con el mínimo de pólizas y comisiones, y entrar al Top 195 del ranking general.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Prize Table tracker */}
            <section>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '24px', opacity: 0.8 }}>Niveles de Premios Proactiva Tech</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
                    {NIVELES.map(n => {
                        const isRankOk = rank >= n.minRank && rank <= n.maxRank;
                        const isPolOk = polizas >= n.pols;
                        const isComOk = comisiones >= n.com;
                        const isCurrentlyWon = prizeWon && prizeWon.id === n.id;
                        
                        // Card styles based on status
                        let borderStyle = '1px solid rgba(255,255,255,0.05)';
                        let shadowStyle = 'none';
                        let opacityStyle = 0.5;

                        if (isCurrentlyWon) {
                            borderStyle = `2px solid ${n.color}`;
                            shadowStyle = `0 0 20px ${n.color}25`;
                            opacityStyle = 1;
                        } else if (isRankOk) {
                            borderStyle = '1px dashed #007AFF';
                            opacityStyle = 1;
                        } else if (rank <= n.maxRank) {
                            // High rank allows potential qualification for lower ones too
                            opacityStyle = 0.8;
                        }

                        return (
                            <div key={n.id} className="glass-card" style={{
                                padding: '24px',
                                border: borderStyle,
                                boxShadow: shadowStyle,
                                opacity: opacityStyle,
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '16px',
                                transition: '0.3s'
                            }}>
                                {/* Badges */}
                                {isRankOk && (
                                    <span style={{
                                        position: 'absolute', top: '12px', right: '12px',
                                        background: 'rgba(0,122,255,0.15)', border: '1px solid #007AFF',
                                        color: '#007AFF', fontSize: '0.65rem', fontWeight: 800,
                                        padding: '2px 8px', borderRadius: '12px', textTransform: 'uppercase'
                                    }}>
                                        Tu Rango
                                    </span>
                                )}
                                {isCurrentlyWon && (
                                    <span style={{
                                        position: 'absolute', top: '12px', right: '12px',
                                        background: 'rgba(0,230,118,0.15)', border: '1px solid #00E676',
                                        color: '#00E676', fontSize: '0.65rem', fontWeight: 800,
                                        padding: '2px 8px', borderRadius: '12px', textTransform: 'uppercase'
                                    }}>
                                        Alcanzado
                                    </span>
                                )}

                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ fontSize: '2rem' }}>{n.icon}</span>
                                    <div>
                                        <h4 style={{ fontSize: '0.9rem', fontWeight: 800 }}>Lugares {n.minRank}-{n.maxRank}</h4>
                                        <p style={{ fontSize: '0.75rem', opacity: 0.6 }}>{n.name}</p>
                                    </div>
                                </div>

                                <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: isPolOk ? '#00E676' : 'inherit' }}>
                                        <span>Meta: {n.pols} pólizas</span>
                                        <span>{isPolOk ? '✅' : '🔴'} {polizas.toFixed(1)} / {n.pols}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: isComOk ? '#00E676' : 'inherit' }}>
                                        <span>Meta: ${n.com.toLocaleString()} com.</span>
                                        <span>{isComOk ? '✅' : '🔴'} ${comisiones.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Next Steps Card */}
            {nextLevel && (
                <section>
                    <div className="glass-card" style={{
                        background: 'rgba(0, 122, 255, 0.05)',
                        border: '1px dashed #007AFF',
                        padding: '24px',
                        textAlign: 'center'
                    }}>
                        <p style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px' }}>
                            Próximo objetivo para ganar: <span style={{ color: '#007AFF' }}>{nextLevel.name}</span>
                        </p>
                        
                        {nextLevel.customMsg && (
                            <p style={{ fontSize: '0.85rem', color: '#FF9800', fontWeight: 600, marginBottom: '12px' }}>
                                ⚠️ Requisito de Ranking: {nextLevel.customMsg} (Tu lugar actual: #{rank})
                            </p>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'center', gap: '48px' }}>
                            <div>
                                <p style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>
                                    {Math.max(0, nextLevel.pols - polizas).toFixed(1)}
                                </p>
                                <p style={{ fontSize: '0.75rem', opacity: 0.6 }}>Pólizas faltantes</p>
                            </div>
                            <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />
                            <div>
                                <p style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>
                                    ${Math.max(0, nextLevel.com - comisiones).toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                                </p>
                                <p style={{ fontSize: '0.75rem', opacity: 0.6 }}>Comisión faltante</p>
                            </div>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
};

export default ProactivaTech;
