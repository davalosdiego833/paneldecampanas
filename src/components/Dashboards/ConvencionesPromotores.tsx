import React from 'react';
import { motion } from 'framer-motion';
import { Users, DollarSign, ShieldCheck, Activity, Calendar, Trophy, ChevronRight, CheckCircle2, XCircle } from 'lucide-react';

interface Props {
    data: any;
    themeMode?: 'dark' | 'light';
}

const formatCurrency = (val: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val || 0);

const formatPercent = (val: number) =>
    ((val || 0) * 100).toFixed(1) + '%';

export const ConvencionesPromotores: React.FC<Props> = ({ data }) => {
    const cpData = data?.convenciones_promotores || data?.campaigns?.convenciones_promotores;
    const promo = cpData?.promotoria;
    const umbrales = cpData?.umbrales;
    const minimos = cpData?.minimos;
    const rangos = cpData?.rangos;
    const fechaCorte = cpData?.fecha_corte || '31 de julio 2026';

    if (!promo) {
        return (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: '#8c94a8' }}>
                <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>No hay información disponible de convenciones para la promotoría.</p>
            </div>
        );
    }

    // Candados Checks
    const checkTA = (promo.asesores_ta || 0) >= (minimos?.asesores_ta || 4);
    const checkReclutas = (promo.comisiones_reclutas || 0) >= (minimos?.comisiones_reclutas || 367500);
    const checkLIMRA = (promo.limra || 0) >= (minimos?.limra || 0.86);
    const checkIGC = (promo.igc || 0) >= (minimos?.igc || 0.9025);
    const totalCandadosOk = [checkTA, checkReclutas, checkLIMRA, checkIGC].filter(Boolean).length;

    // Helper for rendering Camino Card (Cleaned up, no subtitle/desglose, Diamantes ordered 1D -> 2D -> 3D)
    const renderCaminoCard = (
        titulo: string,
        comisionesActuales: number,
        rankingActual: number,
        caminoKey: 'camino1' | 'camino2' | 'camino3'
    ) => {
        const u = umbrales?.[caminoKey] || {};
        const m = minimos?.[caminoKey] || {};
        const r = rangos?.[caminoKey] || {};

        // Ordered: 1 Diamante -> 2 Diamantes -> 3 Diamantes
        const diamantes = [
            {
                key: '1d',
                nombre: '1 Diamante',
                rango: `Lugares ${r['1d']?.[0]} al ${r['1d']?.[1]}`,
                maxLugar: r['1d']?.[1] || 9,
                minimoComision: m['1d'] || 0,
                ultimoLugarComision: u['1d'] || 0,
                accentColor: '#3A86FF',
                badgeBg: 'rgba(58, 134, 255, 0.12)',
            },
            {
                key: '2d',
                nombre: '2 Diamantes',
                rango: `Lugares ${r['2d']?.[0]} al ${r['2d']?.[1]}`,
                maxLugar: r['2d']?.[1] || 6,
                minimoComision: m['2d'] || 0,
                ultimoLugarComision: u['2d'] || 0,
                accentColor: '#00E676',
                badgeBg: 'rgba(0, 230, 118, 0.12)',
            },
            {
                key: '3d',
                nombre: '3 Diamantes',
                rango: `Lugares ${r['3d']?.[0]} al ${r['3d']?.[1]}`,
                maxLugar: r['3d']?.[1] || 3,
                minimoComision: m['3d'] || 0,
                ultimoLugarComision: u['3d'] || 0,
                accentColor: '#FFB800',
                badgeBg: 'rgba(255, 184, 0, 0.12)',
            }
        ];

        return (
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    background: '#181a29',
                    borderRadius: '20px',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    padding: '28px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.25)'
                }}
            >
                {/* Header Camino */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-0.3px' }}>
                            {titulo}
                        </h3>
                        <ChevronRight size={18} style={{ color: '#8c94a8' }} />
                    </div>

                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                        <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '0.72rem', color: '#8c94a8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Total Camino</span>
                            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#00E676', letterSpacing: '-0.5px' }}>
                                {formatCurrency(comisionesActuales)}
                            </div>
                        </div>

                        <div style={{
                            padding: '8px 16px',
                            background: rankingActual <= 21 ? 'rgba(0, 230, 118, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                            border: `1px solid ${rankingActual <= 21 ? 'rgba(0, 230, 118, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                            borderRadius: '14px',
                            textAlign: 'center',
                            minWidth: '85px'
                        }}>
                            <span style={{ fontSize: '0.68rem', color: '#8c94a8', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Ranking</span>
                            <span style={{ fontSize: '1.25rem', fontWeight: 900, color: rankingActual <= 21 ? '#00E676' : '#ffffff' }}>
                                #{rankingActual}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Metas de Calificación (1D -> 2D -> 3D) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginTop: '4px' }}>
                    {diamantes.map((d) => {
                        const calificaPorLugar = rankingActual > 0 && rankingActual <= d.maxLugar;
                        const calificaPorMinimo = comisionesActuales >= d.minimoComision;
                        const faltaMinimo = Math.max(0, d.minimoComision - comisionesActuales);
                        const faltaUltimoLugar = Math.max(0, d.ultimoLugarComision - comisionesActuales);
                        const pctMinimo = Math.min(100, (comisionesActuales / (d.minimoComision || 1)) * 100);

                        return (
                            <div
                                key={d.key}
                                style={{
                                    background: '#121420',
                                    borderRadius: '16px',
                                    border: '1px solid rgba(255, 255, 255, 0.06)',
                                    padding: '20px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    gap: '16px',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                {/* Top Badge Header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{
                                            width: '10px',
                                            height: '10px',
                                            borderRadius: '50%',
                                            background: d.accentColor,
                                            boxShadow: `0 0 10px ${d.accentColor}`
                                        }} />
                                        <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>
                                            {d.nombre}
                                        </span>
                                    </div>
                                    <span style={{
                                        fontSize: '0.72rem',
                                        fontWeight: 700,
                                        background: d.badgeBg,
                                        color: d.accentColor,
                                        padding: '4px 10px',
                                        borderRadius: '8px'
                                    }}>
                                        {d.rango}
                                    </span>
                                </div>

                                {/* Numbers Breakdown */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.83rem' }}>
                                        <span style={{ color: '#8c94a8' }}>Mínimo de Campaña</span>
                                        <span style={{ fontWeight: 800, color: '#ffffff' }}>{formatCurrency(d.minimoComision)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.83rem' }}>
                                        <span style={{ color: '#8c94a8' }}>Último Lugar en Excel (#{d.maxLugar})</span>
                                        <span style={{ fontWeight: 800, color: d.accentColor }}>{formatCurrency(d.ultimoLugarComision)}</span>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.73rem', marginBottom: '6px' }}>
                                        <span style={{ color: '#8c94a8', fontWeight: 600 }}>Avance a Mínimo</span>
                                        <span style={{ color: d.accentColor, fontWeight: 800 }}>{pctMinimo.toFixed(1)}%</span>
                                    </div>
                                    <div style={{ height: '6px', width: '100%', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '10px', overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%',
                                            width: `${pctMinimo}%`,
                                            background: `linear-gradient(90deg, ${d.accentColor} 0%, #ffffff 100%)`,
                                            borderRadius: '10px',
                                            transition: 'width 0.6s ease'
                                        }} />
                                    </div>
                                </div>

                                {/* Status Footer Badge */}
                                <div style={{
                                    paddingTop: '12px',
                                    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                                    fontSize: '0.78rem'
                                }}>
                                    {calificaPorLugar && calificaPorMinimo ? (
                                        <div style={{ color: '#00E676', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <CheckCircle2 size={16} /> ¡En Posición de Calificación!
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <div style={{ color: '#FF2A7A', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <XCircle size={15} /> Fuera de Posición
                                            </div>
                                            <div style={{ fontSize: '0.72rem', color: '#8c94a8', display: 'flex', justifyContent: 'space-between' }}>
                                                <span>Falta a mínimo:</span>
                                                <span style={{ color: '#ffffff', fontWeight: 700 }}>{formatCurrency(faltaMinimo)}</span>
                                            </div>
                                            <div style={{ fontSize: '0.72rem', color: '#8c94a8', display: 'flex', justifyContent: 'space-between' }}>
                                                <span>Falta a último lugar:</span>
                                                <span style={{ color: d.accentColor, fontWeight: 700 }}>{formatCurrency(faltaUltimoLugar)}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </motion.div>
        );
    };

    return (
        <div style={{
            background: '#11131f',
            padding: '24px 32px',
            borderRadius: '24px',
            color: '#ffffff',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
            display: 'flex',
            flexDirection: 'column',
            gap: '32px',
            maxWidth: '1440px',
            margin: '0 auto'
        }}>
            {/* Top Bar Header (Simplified Header: Title & Cutoff Date) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                    <h1 style={{ fontSize: '1.9rem', fontWeight: 900, margin: 0, letterSpacing: '-0.5px', color: '#ffffff' }}>
                        Convenciones Promotores 2026 - 2027
                    </h1>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Date Pill */}
                    <div style={{
                        padding: '10px 18px',
                        background: '#181a29',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        color: '#3A86FF'
                    }}>
                        <Calendar size={16} />
                        Fecha de corte: {fechaCorte}
                    </div>
                </div>
            </div>

            {/* Upper Grid (Top Pages + Conversion Gauge Style) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                
                {/* 2x2 Grid: Metas y Candados Obligatorios */}
                <div style={{
                    gridColumn: 'span 2',
                    background: '#181a29',
                    borderRadius: '20px',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.2)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <ShieldCheck size={20} style={{ color: '#3A86FF' }} />
                            Candados Generales Obligatorios
                        </h2>
                        <span style={{ fontSize: '0.78rem', color: '#8c94a8', fontWeight: 600 }}>
                            {totalCandadosOk} de 4 Cumplidos
                        </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                        
                        {/* Candado 1: Asesores TA */}
                        <div style={{
                            background: '#121420',
                            padding: '18px',
                            borderRadius: '16px',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: '12px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '10px',
                                    background: 'linear-gradient(135deg, rgba(255, 42, 122, 0.2) 0%, rgba(156, 39, 176, 0.2) 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Users size={18} style={{ color: '#FF2A7A' }} />
                                </div>
                                <span style={{
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    background: checkTA ? 'rgba(0, 230, 118, 0.12)' : 'rgba(255, 42, 122, 0.12)',
                                    color: checkTA ? '#00E676' : '#FF2A7A'
                                }}>
                                    {checkTA ? '✅ Cumplido' : '❌ Pendiente'}
                                </span>
                            </div>

                            <div>
                                <span style={{ fontSize: '0.72rem', color: '#8c94a8', fontWeight: 700, textTransform: 'uppercase' }}>Asesores TA Mes 4</span>
                                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ffffff', marginTop: '2px' }}>
                                    {promo.asesores_ta} <span style={{ fontSize: '0.9rem', color: '#8c94a8', fontWeight: 600 }}>/ {minimos?.asesores_ta || 4}</span>
                                </div>
                            </div>
                        </div>

                        {/* Candado 2: Comisiones Reclutas */}
                        <div style={{
                            background: '#121420',
                            padding: '18px',
                            borderRadius: '16px',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: '12px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '10px',
                                    background: 'linear-gradient(135deg, rgba(255, 184, 0, 0.2) 0%, rgba(255, 87, 34, 0.2) 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <DollarSign size={18} style={{ color: '#FFB800' }} />
                                </div>
                                <span style={{
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    background: checkReclutas ? 'rgba(0, 230, 118, 0.12)' : 'rgba(255, 42, 122, 0.12)',
                                    color: checkReclutas ? '#00E676' : '#FF2A7A'
                                }}>
                                    {checkReclutas ? '✅ Cumplido' : '❌ Mín. $367.5k'}
                                </span>
                            </div>

                            <div>
                                <span style={{ fontSize: '0.72rem', color: '#8c94a8', fontWeight: 700, textTransform: 'uppercase' }}>Comisiones Reclutas</span>
                                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#ffffff', marginTop: '2px' }}>
                                    {formatCurrency(promo.comisiones_reclutas)}
                                </div>
                            </div>
                        </div>

                        {/* Candado 3: Persistencia LIMRA */}
                        <div style={{
                            background: '#121420',
                            padding: '18px',
                            borderRadius: '16px',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: '12px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '10px',
                                    background: 'linear-gradient(135deg, rgba(58, 134, 255, 0.2) 0%, rgba(0, 242, 254, 0.2) 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <ShieldCheck size={18} style={{ color: '#3A86FF' }} />
                                </div>
                                <span style={{
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    background: checkLIMRA ? 'rgba(0, 230, 118, 0.12)' : 'rgba(255, 42, 122, 0.12)',
                                    color: checkLIMRA ? '#00E676' : '#FF2A7A'
                                }}>
                                    {checkLIMRA ? '✅ Min 86%' : '❌ Bajo'}
                                </span>
                            </div>

                            <div>
                                <span style={{ fontSize: '0.72rem', color: '#8c94a8', fontWeight: 700, textTransform: 'uppercase' }}>Persistencia LIMRA</span>
                                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#00E676', marginTop: '2px' }}>
                                    {formatPercent(promo.limra)}
                                </div>
                            </div>
                        </div>

                        {/* Candado 4: Índice IGC */}
                        <div style={{
                            background: '#121420',
                            padding: '18px',
                            borderRadius: '16px',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: '12px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '10px',
                                    background: 'linear-gradient(135deg, rgba(0, 230, 118, 0.2) 0%, rgba(0, 184, 148, 0.2) 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Activity size={18} style={{ color: '#00E676' }} />
                                </div>
                                <span style={{
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    background: checkIGC ? 'rgba(0, 230, 118, 0.12)' : 'rgba(255, 42, 122, 0.12)',
                                    color: checkIGC ? '#00E676' : '#FF2A7A'
                                }}>
                                    {checkIGC ? '✅ Min 90.25%' : '❌ Bajo'}
                                </span>
                            </div>

                            <div>
                                <span style={{ fontSize: '0.72rem', color: '#8c94a8', fontWeight: 700, textTransform: 'uppercase' }}>Índice IGC</span>
                                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#00E676', marginTop: '2px' }}>
                                    {formatPercent(promo.igc)}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Right Side Summary Panel */}
                <div style={{
                    background: '#181a29',
                    borderRadius: '20px',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '20px',
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.2)'
                }}>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                        Estatus por Camino
                    </h2>

                    {/* Circular Ring Graphic */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 0' }}>
                        <div style={{
                            width: '140px',
                            height: '140px',
                            borderRadius: '50%',
                            background: 'conic-gradient(#3A86FF 0% 33%, #00E676 33% 66%, #FFB800 66% 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 0 25px rgba(0,0,0,0.4)'
                        }}>
                            <div style={{
                                width: '108px',
                                height: '108px',
                                borderRadius: '50%',
                                background: '#181a29',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <span style={{ fontSize: '0.7rem', color: '#8c94a8', textTransform: 'uppercase', fontWeight: 700 }}>Lugar Global</span>
                                <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ffffff' }}>#{promo.lugar_general}</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Rankings List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.83rem' }}>
                            <span style={{ color: '#8c94a8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3A86FF' }} />
                                1er Camino (Comisiones Totales)
                            </span>
                            <span style={{ fontWeight: 800, color: '#ffffff' }}>#{promo.c1_ranking}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.83rem' }}>
                            <span style={{ color: '#8c94a8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00E676' }} />
                                2do Camino (Asesores 12m)
                            </span>
                            <span style={{ fontWeight: 800, color: '#ffffff' }}>#{promo.c2_ranking}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.83rem' }}>
                            <span style={{ color: '#8c94a8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FFB800' }} />
                                3er Camino (Nueva Org.)
                            </span>
                            <span style={{ fontWeight: 800, color: '#ffffff' }}>#{promo.c3_ranking}</span>
                        </div>
                    </div>
                </div>

            </div>

            {/* Main Section: The 3 Caminos (Detailed Cleaned-Up Cards) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 900, margin: 0, color: '#ffffff', letterSpacing: '-0.3px' }}>
                    🏆 Evaluación Detallada por Caminos
                </h2>

                {/* 1er Camino */}
                {renderCaminoCard(
                    '1er Camino — Comisiones Iniciales de Todos los Ramos',
                    promo.c1_comisiones_totales,
                    promo.c1_ranking,
                    'camino1'
                )}

                {/* 2do Camino */}
                {renderCaminoCard(
                    '2do Camino — Comisiones Asesores 12 Meses',
                    promo.c2_total,
                    promo.c2_ranking,
                    'camino2'
                )}

                {/* 3er Camino */}
                {renderCaminoCard(
                    '3er Camino — Comisiones Nueva Organización',
                    promo.c3_total,
                    promo.c3_ranking,
                    'camino3'
                )}
            </div>

        </div>
    );
};

export default ConvencionesPromotores;
