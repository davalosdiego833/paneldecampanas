import React from 'react';
import { motion } from 'framer-motion';
import { Users, ShieldCheck, Calendar, ChevronRight, CheckCircle2, XCircle } from 'lucide-react';

interface Props {
    data: any;
    themeMode?: 'dark' | 'light';
}

const formatCurrency = (val: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val || 0);

export const ConvencionesGerente: React.FC<Props> = ({ data }) => {
    const cgData = data?.convenciones_gerente || data?.campaigns?.convenciones_gerente;
    const gerencia = cgData?.gerencia;
    const primerLugar = cgData?.primer_lugar;
    const minimos = cgData?.minimos;
    const fechaCorte = cgData?.fecha_corte || '31 de julio 2026';

    if (!gerencia) {
        return (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: '#8c94a8' }}>
                <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>No hay información disponible de convenciones para Gerencia de Agencia.</p>
            </div>
        );
    }

    // Candados Checks
    const checkTAGerencia = (gerencia.asesores_ta_gerencia || 0) >= (gerencia.meta_ta_gerencia || 4);
    const checkTAPromotor = (gerencia.asesores_ta_promotor || 0) >= (gerencia.meta_ta_promotor || 4) || gerencia.cumple_promotor;
    const totalCandadosOk = [checkTAGerencia, checkTAPromotor].filter(Boolean).length;

    // Helper for rendering Camino Card
    const renderCaminoCard = (
        titulo: string,
        comisionesActuales: number,
        rankingActual: number,
        primerLugarComision: number,
        diamantesList: {
            nombre: string;
            minimoComision: number;
            accentColor: string;
            badgeBg: string;
        }[]
    ) => {
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
                            <span style={{ fontSize: '0.72rem', color: '#8c94a8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Total Gerencia</span>
                            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#00E676', letterSpacing: '-0.5px' }}>
                                {formatCurrency(comisionesActuales)}
                            </div>
                        </div>

                        <div style={{
                            padding: '8px 16px',
                            background: rankingActual === 1 ? 'rgba(0, 230, 118, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                            border: `1px solid ${rankingActual === 1 ? 'rgba(0, 230, 118, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                            borderRadius: '14px',
                            textAlign: 'center',
                            minWidth: '85px'
                        }}>
                            <span style={{ fontSize: '0.68rem', color: '#8c94a8', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Ranking</span>
                            <span style={{ fontSize: '1.25rem', fontWeight: 900, color: rankingActual === 1 ? '#00E676' : '#ffffff' }}>
                                #{rankingActual}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Metas de Calificación */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(auto-fit, minmax(280px, 1fr))`,
                    gap: '16px',
                    marginTop: '4px'
                }}>
                    {diamantesList.map((d, idx) => {
                        const calificaPorLugar = rankingActual === 1;
                        const calificaPorMinimo = comisionesActuales >= d.minimoComision;
                        const faltaMinimo = Math.max(0, d.minimoComision - comisionesActuales);
                        const faltaPrimerLugar = Math.max(0, primerLugarComision - comisionesActuales);
                        const pctMinimo = Math.min(100, (comisionesActuales / (d.minimoComision || 1)) * 100);

                        return (
                            <div
                                key={idx}
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
                                        1er Lugar Asistencia
                                    </span>
                                </div>

                                {/* Numbers Breakdown */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.83rem' }}>
                                        <span style={{ color: '#8c94a8' }}>Mínimo de Campaña</span>
                                        <span style={{ fontWeight: 800, color: '#ffffff' }}>{formatCurrency(d.minimoComision)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.83rem' }}>
                                        <span style={{ color: '#8c94a8' }}>Actualmente 1er Lugar en Excel</span>
                                        <span style={{ fontWeight: 800, color: d.accentColor }}>{formatCurrency(primerLugarComision)}</span>
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
                                                <span>Falta al 1er lugar:</span>
                                                <span style={{ color: d.accentColor, fontWeight: 700 }}>{formatCurrency(faltaPrimerLugar)}</span>
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
            {/* Top Bar Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                    <h1 style={{ fontSize: '1.9rem', fontWeight: 900, margin: 0, letterSpacing: '-0.5px', color: '#ffffff' }}>
                        Convenciones Gerente de Agencia 2026 - 2027
                    </h1>
                    <p style={{ margin: '4px 0 0 0', color: '#8c94a8', fontSize: '0.9rem', fontWeight: 600 }}>
                        {gerencia.nombre} — Matriz {gerencia.mat} (Sucursal {gerencia.suc})
                    </p>
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

            {/* Upper Grid (2 Candados + Donut Gauge) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                
                {/* 2 Cards: Candados Generales Obligatorios */}
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
                            Candados Generales Obligatorios (Gerencia)
                        </h2>
                        <span style={{ fontSize: '0.78rem', color: '#8c94a8', fontWeight: 600 }}>
                            {totalCandadosOk} de 2 Cumplidos
                        </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                        
                        {/* Candado 1: Asesores TA Gerencia */}
                        <div style={{
                            background: '#121420',
                            padding: '20px',
                            borderRadius: '16px',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: '12px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '10px',
                                    background: 'linear-gradient(135deg, rgba(255, 42, 122, 0.2) 0%, rgba(156, 39, 176, 0.2) 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Users size={20} style={{ color: '#FF2A7A' }} />
                                </div>
                                <span style={{
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    background: checkTAGerencia ? 'rgba(0, 230, 118, 0.12)' : 'rgba(255, 42, 122, 0.12)',
                                    color: checkTAGerencia ? '#00E676' : '#FF2A7A'
                                }}>
                                    {checkTAGerencia ? '✅ Cumplido' : '❌ Pendiente (Mín. 4)'}
                                </span>
                            </div>

                            <div>
                                <span style={{ fontSize: '0.75rem', color: '#8c94a8', fontWeight: 700, textTransform: 'uppercase' }}>Ganadores TA Mes 4 (Sucursal)</span>
                                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#ffffff', marginTop: '2px' }}>
                                    {gerencia.asesores_ta_gerencia} <span style={{ fontSize: '0.9rem', color: '#8c94a8', fontWeight: 600 }}>/ {gerencia.meta_ta_gerencia || 4}</span>
                                </div>
                            </div>
                        </div>

                        {/* Candado 2: Cumplimiento de Promotor */}
                        <div style={{
                            background: '#121420',
                            padding: '20px',
                            borderRadius: '16px',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: '12px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '10px',
                                    background: 'linear-gradient(135deg, rgba(58, 134, 255, 0.2) 0%, rgba(0, 242, 254, 0.2) 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <ShieldCheck size={20} style={{ color: '#3A86FF' }} />
                                </div>
                                <span style={{
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    background: checkTAPromotor ? 'rgba(0, 230, 118, 0.12)' : 'rgba(255, 42, 122, 0.12)',
                                    color: checkTAPromotor ? '#00E676' : '#FF2A7A'
                                }}>
                                    {checkTAPromotor ? '✅ Cumplido' : '❌ Pendiente (Mín. 4)'}
                                </span>
                            </div>

                            <div>
                                <span style={{ fontSize: '0.75rem', color: '#8c94a8', fontWeight: 700, textTransform: 'uppercase' }}>Ganadores TA Mes 4 (Matriz Promotor)</span>
                                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#ffffff', marginTop: '2px' }}>
                                    {gerencia.asesores_ta_promotor} <span style={{ fontSize: '0.9rem', color: '#8c94a8', fontWeight: 600 }}>/ {gerencia.meta_ta_promotor || 4}</span>
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
                                <span style={{ fontSize: '0.68rem', color: '#8c94a8', textTransform: 'uppercase', fontWeight: 700 }}>Gerencia</span>
                                <span style={{ fontSize: '1.3rem', fontWeight: 900, color: '#ffffff' }}>Suc {gerencia.suc}</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Rankings List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.83rem' }}>
                            <span style={{ color: '#8c94a8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3A86FF' }} />
                                1er Camino (Asesores 12m)
                            </span>
                            <span style={{ fontWeight: 800, color: '#ffffff' }}>#{gerencia.c1_ranking}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.83rem' }}>
                            <span style={{ color: '#8c94a8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00E676' }} />
                                2do Camino (Nueva Org.)
                            </span>
                            <span style={{ fontWeight: 800, color: '#ffffff' }}>#{gerencia.c2_ranking}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.83rem' }}>
                            <span style={{ color: '#8c94a8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FFB800' }} />
                                3er Camino (Gerente 36m)
                            </span>
                            <span style={{ fontWeight: 800, color: '#ffffff' }}>#{gerencia.c3_ranking}</span>
                        </div>
                    </div>
                </div>

            </div>

            {/* Main Section: The 3 Caminos */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 900, margin: 0, color: '#ffffff', letterSpacing: '-0.3px' }}>
                    🏆 Evaluación Detallada por Caminos (Gerencia de Agencia)
                </h2>

                {/* 1er Camino */}
                {renderCaminoCard(
                    '1er Camino — Comisiones Asesores 12 Meses',
                    gerencia.c1_total,
                    gerencia.c1_ranking,
                    primerLugar?.c1_total || 0,
                    [
                        { nombre: '1 Diamante', minimoComision: minimos?.camino1?.['1d'] || 2100000, accentColor: '#3A86FF', badgeBg: 'rgba(58, 134, 255, 0.12)' },
                        { nombre: '2 Diamantes', minimoComision: minimos?.camino1?.['2d'] || 2365000, accentColor: '#00E676', badgeBg: 'rgba(0, 230, 118, 0.12)' },
                        { nombre: '3 Diamantes', minimoComision: minimos?.camino1?.['3d'] || 2900000, accentColor: '#FFB800', badgeBg: 'rgba(255, 184, 0, 0.12)' },
                    ]
                )}

                {/* 2do Camino */}
                {renderCaminoCard(
                    '2do Camino — Comisiones Nueva Organización',
                    gerencia.c2_total,
                    gerencia.c2_ranking,
                    primerLugar?.c2_total || 0,
                    [
                        { nombre: '1 Diamante', minimoComision: minimos?.camino2?.['1d'] || 2760000, accentColor: '#3A86FF', badgeBg: 'rgba(58, 134, 255, 0.12)' },
                        { nombre: '2 Diamantes', minimoComision: minimos?.camino2?.['2d'] || 3307500, accentColor: '#00E676', badgeBg: 'rgba(0, 230, 118, 0.12)' },
                        { nombre: '3 Diamantes', minimoComision: minimos?.camino2?.['3d'] || 4960000, accentColor: '#FFB800', badgeBg: 'rgba(255, 184, 0, 0.12)' },
                    ]
                )}

                {/* 3er Camino */}
                {renderCaminoCard(
                    '3er Camino — Comisiones Asesores 12m (Gerentes de Agencia 36 Meses)',
                    gerencia.c3_total,
                    gerencia.c3_ranking,
                    primerLugar?.c3_total || 0,
                    [
                        { nombre: '1 Diamante', minimoComision: minimos?.camino3?.['1d'] || 1160000, accentColor: '#3A86FF', badgeBg: 'rgba(58, 134, 255, 0.12)' },
                    ]
                )}
            </div>

        </div>
    );
};

export default ConvencionesGerente;
