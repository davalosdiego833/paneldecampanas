import React from 'react';
import { motion } from 'framer-motion';
import { Award, CheckCircle, XCircle, AlertTriangle, Calendar, ShieldCheck, TrendingUp, DollarSign, Users, Sparkles } from 'lucide-react';

interface Props {
    data: any;
    themeMode?: 'dark' | 'light';
}

const formatCurrency = (val: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val || 0);

const formatPercent = (val: number) =>
    ((val || 0) * 100).toFixed(2) + '%';

export const ConvencionesPromotores: React.FC<Props> = ({ data, themeMode = 'dark' }) => {
    const cpData = data?.convenciones_promotores || data?.campaigns?.convenciones_promotores;
    const promo = cpData?.promotoria;
    const umbrales = cpData?.umbrales;
    const minimos = cpData?.minimos;
    const rangos = cpData?.rangos;
    const fechaCorte = cpData?.fecha_corte || '31 de julio 2026';

    if (!promo) {
        return (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
                No hay información disponible de convenciones para la promotoría.
            </div>
        );
    }

    // Candados Checks
    const checkTA = (promo.asesores_ta || 0) >= (minimos?.asesores_ta || 4);
    const checkReclutas = (promo.comisiones_reclutas || 0) >= (minimos?.comisiones_reclutas || 367500);
    const checkLIMRA = (promo.limra || 0) >= (minimos?.limra || 0.86);
    const checkIGC = (promo.igc || 0) >= (minimos?.igc || 0.9025);
    const candadosCumplidos = checkTA && checkReclutas && checkLIMRA && checkIGC;

    // Helper for rendering Camino Section
    const renderCaminoCard = (
        titulo: string,
        subtitulo: string,
        comisionesActuales: number,
        rankingActual: number,
        caminoKey: 'camino1' | 'camino2' | 'camino3',
        desgloseItems: { label: string; val: number }[]
    ) => {
        const u = umbrales?.[caminoKey] || {};
        const m = minimos?.[caminoKey] || {};
        const r = rangos?.[caminoKey] || {};

        const diamantes = [
            {
                key: '3d',
                nombre: '3 Diamantes',
                rango: `Lugares ${r['3d']?.[0]} al ${r['3d']?.[1]}`,
                maxLugar: r['3d']?.[1] || 3,
                minimoComision: m['3d'] || 0,
                ultimoLugarComision: u['3d'] || 0,
                badgeColor: '#FBBF24',
                bgColor: 'rgba(251, 191, 36, 0.08)',
                borderColor: 'rgba(251, 191, 36, 0.3)'
            },
            {
                key: '2d',
                nombre: '2 Diamantes',
                rango: `Lugares ${r['2d']?.[0]} al ${r['2d']?.[1]}`,
                maxLugar: r['2d']?.[1] || 6,
                minimoComision: m['2d'] || 0,
                ultimoLugarComision: u['2d'] || 0,
                badgeColor: '#34D399',
                bgColor: 'rgba(52, 211, 153, 0.08)',
                borderColor: 'rgba(52, 211, 153, 0.3)'
            },
            {
                key: '1d',
                nombre: '1 Diamante',
                rango: `Lugares ${r['1d']?.[0]} al ${r['1d']?.[1]}`,
                maxLugar: r['1d']?.[1] || 9,
                minimoComision: m['1d'] || 0,
                ultimoLugarComision: u['1d'] || 0,
                badgeColor: '#60A5FA',
                bgColor: 'rgba(96, 165, 250, 0.08)',
                borderColor: 'rgba(96, 165, 250, 0.3)'
            }
        ];

        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    background: 'var(--card-bg, #1a1a2e)',
                    borderRadius: '16px',
                    border: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
                    padding: '24px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px'
                }}
            >
                {/* Header Camino */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary, #fff)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <TrendingUp size={20} style={{ color: '#42A5F5' }} />
                            {titulo}
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #94a3b8)', marginTop: '4px', margin: 0 }}>
                            {subtitulo}
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #94a3b8)', textTransform: 'uppercase', fontWeight: 600 }}>Total Camino</div>
                            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#00E676' }}>{formatCurrency(comisionesActuales)}</div>
                        </div>
                        <div style={{
                            padding: '6px 14px',
                            background: rankingActual <= 21 ? 'rgba(0,230,118,0.15)' : 'rgba(255,255,255,0.06)',
                            border: `1px solid ${rankingActual <= 21 ? '#00E676' : 'rgba(255,255,255,0.15)'}`,
                            borderRadius: '12px',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary, #94a3b8)', textTransform: 'uppercase' }}>Ranking</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: rankingActual <= 21 ? '#00E676' : 'var(--text-primary, #fff)' }}>
                                #{rankingActual}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Desglose de rubros del camino */}
                {desgloseItems && desgloseItems.length > 0 && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                        gap: '10px',
                        background: 'rgba(255,255,255,0.03)',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                        {desgloseItems.map((item, idx) => (
                            <div key={idx}>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary, #94a3b8)' }}>{item.label}</div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary, #fff)' }}>{formatCurrency(item.val)}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Niveles de Diamantes */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary, #94a3b8)', textTransform: 'uppercase', margin: 0, letterSpacing: '0.5px' }}>
                        Metas de Calificación y Posición del Último Lugar:
                    </h4>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                        {diamantes.map((d) => {
                            const calificaPorLugar = rankingActual > 0 && rankingActual <= d.maxLugar;
                            const calificaPorMonomo = comisionesActuales >= d.minimoComision;
                            const faltaMonomo = Math.max(0, d.minimoComision - comisionesActuales);
                            const faltaUltimoLugar = Math.max(0, d.ultimoLugarComision - comisionesActuales);

                            const pctMonomo = Math.min(100, (comisionesActuales / (d.minimoComision || 1)) * 100);

                            return (
                                <div
                                    key={d.key}
                                    style={{
                                        background: d.bgColor,
                                        border: `1px solid ${d.borderColor}`,
                                        borderRadius: '14px',
                                        padding: '16px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '12px'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '1rem', fontWeight: 800, color: d.badgeColor, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Sparkles size={16} />
                                            {d.nombre}
                                        </span>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, background: 'rgba(255,255,255,0.1)', padding: '3px 8px', borderRadius: '6px', color: 'var(--text-primary, #fff)' }}>
                                            {d.rango}
                                        </span>
                                    </div>

                                    {/* Mínimo de Comisiones Requerido */}
                                    <div style={{ fontSize: '0.82rem', color: 'var(--text-primary, #fff)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: 'var(--text-secondary, #94a3b8)' }}>Mínimo de Campaña:</span>
                                            <span style={{ fontWeight: 700 }}>{formatCurrency(d.minimoComision)}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: 'var(--text-secondary, #94a3b8)' }}>Último Lugar en Excel (#{d.maxLugar}):</span>
                                            <span style={{ fontWeight: 700, color: d.badgeColor }}>{formatCurrency(d.ultimoLugarComision)}</span>
                                        </div>
                                    </div>

                                    {/* Progreso Visual */}
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary, #94a3b8)', marginBottom: '4px' }}>
                                            <span>Avance hacia Mínimo</span>
                                            <span style={{ fontWeight: 700, color: d.badgeColor }}>{pctMonomo.toFixed(1)}%</span>
                                        </div>
                                        <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${pctMonomo}%`, background: d.badgeColor, borderRadius: '4px', transition: 'width 0.5s ease' }} />
                                        </div>
                                    </div>

                                    {/* Status / Faltantes */}
                                    <div style={{ paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: '0.78rem' }}>
                                        {calificaPorLugar && calificaPorMonomo ? (
                                            <div style={{ color: '#00E676', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <CheckCircle size={14} /> ¡En zona de calificación!
                                            </div>
                                        ) : (
                                            <div style={{ color: '#FF6B6B', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                <span style={{ fontWeight: 700 }}>❌ Fuera de posición</span>
                                                <span style={{ opacity: 0.8 }}>Falta para mínimo: <b>{formatCurrency(faltaMonomo)}</b></span>
                                                <span style={{ opacity: 0.8 }}>Falta para último lugar (#{d.maxLugar}): <b>{formatCurrency(faltaUltimoLugar)}</b></span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </motion.div>
        );
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '1400px', margin: '0 auto' }}>
            {/* Top Banner Header */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(66, 165, 245, 0.15) 0%, rgba(156, 39, 176, 0.15) 100%)',
                border: '1px solid rgba(66, 165, 245, 0.3)',
                borderRadius: '16px',
                padding: '24px 28px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px'
            }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-primary, #fff)', margin: 0 }}>
                            🏛️ Convenciones Promotores 2026-2027
                        </h2>
                        <span style={{
                            padding: '4px 12px',
                            background: 'rgba(0,122,255,0.2)',
                            border: '1px solid rgba(0,122,255,0.4)',
                            borderRadius: '20px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            color: '#42A5F5',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}>
                            <Calendar size={14} /> Fecha de corte: {fechaCorte}
                        </span>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary, #94a3b8)', marginTop: '6px', margin: 0 }}>
                        Estatus de la Promotoría <b>Mat {promo.mat}</b> — {promo.oficina}
                    </p>
                </div>

                <div style={{
                    padding: '12px 20px',
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #94a3b8)', textTransform: 'uppercase', fontWeight: 600 }}>Lugar General Promotoría</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#FFD93D' }}>
                        #{promo.lugar_general}
                    </div>
                </div>
            </div>

            {/* Candados Generales Obligatorios */}
            <section>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <ShieldCheck size={22} style={{ color: candadosCumplidos ? '#00E676' : '#FFD93D' }} />
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary, #fff)', margin: 0 }}>
                        Candados Generales Obligatorios (Requisitos Mínimos)
                    </h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                    {/* Candado 1: Asesores TA mes 4 */}
                    <div style={{
                        background: checkTA ? 'rgba(0, 230, 118, 0.08)' : 'rgba(255, 107, 107, 0.08)',
                        border: `1px solid ${checkTA ? 'rgba(0, 230, 118, 0.3)' : 'rgba(255, 107, 107, 0.3)'}`,
                        borderRadius: '14px',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary, #94a3b8)' }}>ASESORES TA MES 4</span>
                            {checkTA ? <CheckCircle size={18} color="#00E676" /> : <XCircle size={18} color="#FF6B6B" />}
                        </div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: checkTA ? '#00E676' : '#FF6B6B' }}>
                            {promo.asesores_ta} / {minimos?.asesores_ta || 4}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: checkTA ? '#00E676' : '#FF6B6B', fontWeight: 600 }}>
                            {checkTA ? '✅ Cumplido (mínimo 4)' : `❌ Faltan ${(minimos?.asesores_ta || 4) - promo.asesores_ta} asesores`}
                        </div>
                    </div>

                    {/* Candado 2: Comisiones Reclutas */}
                    <div style={{
                        background: checkReclutas ? 'rgba(0, 230, 118, 0.08)' : 'rgba(255, 107, 107, 0.08)',
                        border: `1px solid ${checkReclutas ? 'rgba(0, 230, 118, 0.3)' : 'rgba(255, 107, 107, 0.3)'}`,
                        borderRadius: '14px',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary, #94a3b8)' }}>COMISIONES RECLUTAS JUL26-JUN27</span>
                            {checkReclutas ? <CheckCircle size={18} color="#00E676" /> : <XCircle size={18} color="#FF6B6B" />}
                        </div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 800, color: checkReclutas ? '#00E676' : '#FF6B6B' }}>
                            {formatCurrency(promo.comisiones_reclutas)}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: checkReclutas ? '#00E676' : '#FF6B6B', fontWeight: 600 }}>
                            {checkReclutas ? '✅ Cumplido' : `❌ Mínimo $367,500 (Falta ${formatCurrency((minimos?.comisiones_reclutas || 367500) - promo.comisiones_reclutas)})`}
                        </div>
                    </div>

                    {/* Candado 3: LIMRA */}
                    <div style={{
                        background: checkLIMRA ? 'rgba(0, 230, 118, 0.08)' : 'rgba(255, 107, 107, 0.08)',
                        border: `1px solid ${checkLIMRA ? 'rgba(0, 230, 118, 0.3)' : 'rgba(255, 107, 107, 0.3)'}`,
                        borderRadius: '14px',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary, #94a3b8)' }}>LIMRA (PERSISTENCIA)</span>
                            {checkLIMRA ? <CheckCircle size={18} color="#00E676" /> : <XCircle size={18} color="#FF6B6B" />}
                        </div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: checkLIMRA ? '#00E676' : '#FF6B6B' }}>
                            {formatPercent(promo.limra)}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: checkLIMRA ? '#00E676' : '#FF6B6B', fontWeight: 600 }}>
                            {checkLIMRA ? '✅ Cumplido (mínimo 86%)' : '❌ Menor al 86% requerido'}
                        </div>
                    </div>

                    {/* Candado 4: IGC */}
                    <div style={{
                        background: checkIGC ? 'rgba(0, 230, 118, 0.08)' : 'rgba(255, 107, 107, 0.08)',
                        border: `1px solid ${checkIGC ? 'rgba(0, 230, 118, 0.3)' : 'rgba(255, 107, 107, 0.3)'}`,
                        borderRadius: '14px',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary, #94a3b8)' }}>IGC</span>
                            {checkIGC ? <CheckCircle size={18} color="#00E676" /> : <XCircle size={18} color="#FF6B6B" />}
                        </div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: checkIGC ? '#00E676' : '#FF6B6B' }}>
                            {formatPercent(promo.igc)}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: checkIGC ? '#00E676' : '#FF6B6B', fontWeight: 600 }}>
                            {checkIGC ? '✅ Cumplido (mínimo 90.25%)' : '❌ Menor a 90.25% requerido'}
                        </div>
                    </div>
                </div>
            </section>

            {/* Los 3 Caminos */}
            <section style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-primary, #fff)', margin: 0 }}>
                    🏆 Evaluación por los 3 Caminos de Convención
                </h3>

                {/* 1er Camino */}
                {renderCaminoCard(
                    '1er Camino — Comisiones Iniciales de Todos los Ramos',
                    'Aplica comisiones iniciales de Vida, GMM Ind, DxN, Vida GyC y GMM GyC.',
                    promo.c1_comisiones_totales,
                    promo.c1_ranking,
                    'camino1',
                    [
                        { label: 'Vida Acumulado', val: promo.c1_vida },
                        { label: 'GMM & Acc. Ind.', val: promo.c1_gmm_ind },
                        { label: 'DxN', val: promo.c1_dxn },
                        { label: 'Vida GyC', val: promo.c1_vida_gyc },
                        { label: 'GMM GyC', val: promo.c1_gmm_gyc },
                        { label: 'Conv. al Doble', val: promo.c1_conv_doble }
                    ]
                )}

                {/* 2do Camino */}
                {renderCaminoCard(
                    '2do Camino — Comisiones Asesores 12 Meses',
                    'Comisiones generadas por la fuerza de ventas con antigüedad de 12 meses o menos.',
                    promo.c2_total,
                    promo.c2_ranking,
                    'camino2',
                    [
                        { label: 'Vida Asesores 12m', val: promo.c2_vida_12m },
                        { label: 'Conv. al Doble', val: promo.c2_conv_doble }
                    ]
                )}

                {/* 3er Camino */}
                {renderCaminoCard(
                    '3er Camino — Comisiones Nueva Organización',
                    'Comisiones de la nueva estructura de promotoría y desarrollo.',
                    promo.c3_total,
                    promo.c3_ranking,
                    'camino3',
                    [
                        { label: 'Nueva Organización', val: promo.c3_nueva_org },
                        { label: 'Conv. al Doble', val: promo.c3_conv_doble }
                    ]
                )}
            </section>
        </div>
    );
};

export default ConvencionesPromotores;
