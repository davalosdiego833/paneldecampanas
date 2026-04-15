import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Target, TrendingUp, Calendar, Info, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';

interface Props {
    onBack: () => void;
    themeMode: 'dark' | 'light';
}

const fmt = (n: number) => '$' + n.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const MetaDespacho: React.FC<Props> = ({ onBack, themeMode }) => {
    const [abrilPagado, setAbrilPagado] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    const META_MENSUAL = 2000000;
    const META_ANUAL = 24000000;

    // Hardcoded historical closed months
    const eneroPagado = 973307;
    const febreroPagado = 915278;
    const marzoPagado = 1483121; 

    useEffect(() => {
        const fetchLiveAprilData = async () => {
            try {
                // Fetch the snapshot that contains the 'pagado_pendiente' array
                const snapRes = await fetch('/api/admin/snapshot-status');
                const snapStatus = await snapRes.json();

                const res = await fetch(`/api/resumen-general?useSnapshot=${snapStatus.exists}`);
                const d = await res.json();

                // Calculate April total from LIVE 'Pagado y Emitido' snapshot
                if (d && d.pagado_pendiente) {
                    const totalApril = d.pagado_pendiente.reduce((sum: number, row: any) => {
                        return sum + Math.max(Number(row['Total _Prima_Pagada']) || 0, 0);
                    }, 0);
                    setAbrilPagado(totalApril);
                }
            } catch (err) {
                console.error("Error fetching live pagado data for April:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchLiveAprilData();
    }, []);

    // Derived accumulators
    const acumuladoTotal = eneroPagado + febreroPagado + marzoPagado + abrilPagado;
    const metaAcumuladaEsperada = META_MENSUAL * 4; // Ene, Feb, Mar, Abr
    const diferencialAcumulado = acumuladoTotal - metaAcumuladaEsperada;

    const faltanteMes = Math.max(0, META_MENSUAL - abrilPagado);
    const pctMes = Math.min((abrilPagado / META_MENSUAL) * 100, 100);
    const pctAnual = Math.min((acumuladoTotal / META_ANUAL) * 100, 100);

    // Chart Dataset
    const chartData = [
        { mes: 'Ene', pagado: eneroPagado, meta: META_MENSUAL },
        { mes: 'Feb', pagado: febreroPagado, meta: META_MENSUAL },
        { mes: 'Mar', pagado: marzoPagado, meta: META_MENSUAL },
        { mes: 'Abr (Vivo)', pagado: abrilPagado, meta: META_MENSUAL },
        { mes: 'May', pagado: 0, meta: META_MENSUAL },
        { mes: 'Jun', pagado: 0, meta: META_MENSUAL },
        { mes: 'Jul', pagado: 0, meta: META_MENSUAL },
        { mes: 'Ago', pagado: 0, meta: META_MENSUAL },
        { mes: 'Sep', pagado: 0, meta: META_MENSUAL },
        { mes: 'Oct', pagado: 0, meta: META_MENSUAL },
        { mes: 'Nov', pagado: 0, meta: META_MENSUAL },
        { mes: 'Dic', pagado: 0, meta: META_MENSUAL },
    ];

    const getBarColor = (val: number, meta: number) => {
        if (val === 0) return 'rgba(255,255,255,0.05)';
        if (val >= meta) return '#00E676'; // Bright green hit
        if (val >= meta * 0.7) return '#FFD93D'; // Yellow warning
        return '#FF6B6B'; // Red danger
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)' }}>
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                    <RefreshCw size={40} color="var(--accent-gold)" />
                </motion.div>
            </div>
        );
    }

    return (
        <div className="app-layout" data-theme={themeMode} style={{ overflowY: 'auto', background: 'radial-gradient(ellipse at top, #0f1219 0%, #080a0f 100%)' }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 24px' }}>

                {/* Header Navbar */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px', gap: '20px' }}>
                    <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '12px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div style={{ display: 'inline-block', padding: '6px 16px', background: 'rgba(212, 175, 55, 0.15)', border: '1px solid rgba(212, 175, 55, 0.3)', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800, color: '#D4AF37', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
                            🎯 Objetivo Anual Promotoría
                        </div>
                        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, margin: 0, color: '#fff' }}>Seguimiento Meta 24M (2026)</h1>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>

                    {/* Ring Progress (Yearly) */}
                    <div className="glass-card" style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(145deg, rgba(20,25,35,0.8), rgba(10,12,18,0.9))', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <h3 style={{ color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: 600, marginBottom: '24px' }}>Acumulado Anual (Ene - Abr)</h3>
                        <div style={{ position: 'relative', width: '220px', height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="220" height="220" viewBox="0 0 220 220" style={{ transform: 'rotate(-90deg)' }}>
                                {/* Background Circle */}
                                <circle cx="110" cy="110" r="90" stroke="rgba(255,255,255,0.05)" strokeWidth="16" fill="none" />
                                {/* Progress Circle */}
                                <motion.circle
                                    cx="110" cy="110" r="90"
                                    stroke="url(#goldGradient)"
                                    strokeWidth="16"
                                    fill="none"
                                    strokeLinecap="round"
                                    initial={{ strokeDasharray: '0 1000' }}
                                    animate={{ strokeDasharray: `${(pctAnual / 100) * (2 * Math.PI * 90)} 1000` }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                />
                                <defs>
                                    <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#D4AF37" />
                                        <stop offset="100%" stopColor="#F3E5AB" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div style={{ position: 'absolute', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Pagado</span>
                                <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', textShadow: '0 2px 10px rgba(212,175,55,0.3)' }}>
                                    {fmt(acumuladoTotal)}
                                </span>
                            </div>
                        </div>
                        <div style={{ marginTop: '24px', textAlign: 'center', width: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                <span>Progreso Anual</span>
                                <span style={{ color: '#D4AF37', fontWeight: 700 }}>{pctAnual.toFixed(1)}%</span>
                            </div>
                            <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                                <div style={{ width: `${pctAnual}%`, height: '100%', background: 'linear-gradient(90deg, #D4AF37, #F3E5AB)', borderRadius: '10px' }} />
                            </div>
                            <p style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Meta Anual: {fmt(META_ANUAL)}</p>
                        </div>
                    </div>

                    {/* Right column: Current Month & Accumulator analysis */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                        {/* En Vivo Marzo */}
                        <div className="glass-card" style={{ padding: '32px', flex: 1, position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: 0, right: 0, padding: '12px 16px', background: 'rgba(0,122,255,0.1)', color: '#42A5F5', fontWeight: 700, fontSize: '0.75rem', borderBottomLeftRadius: '16px' }}>En Vivo (Reporte Hoy)</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                                <Calendar size={24} color="#42A5F5" />
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', margin: 0 }}>Abril 2026</h3>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px', marginBottom: '24px' }}>
                                <span style={{ fontSize: '3rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>{fmt(abrilPagado)}</span>
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: 600, marginBottom: '8px' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Faltante del Mes</span>
                                    <span style={{ color: faltanteMes === 0 ? '#00E676' : '#FF6B6B' }}>
                                        {faltanteMes === 0 ? '¡Meta Superada! 🎉' : `Faltan ${fmt(faltanteMes)}`}
                                    </span>
                                </div>
                                <div style={{ height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${pctMes}%` }}
                                        transition={{ duration: 1 }}
                                        style={{ height: '100%', background: faltanteMes === 0 ? '#00E676' : '#42A5F5', borderRadius: '10px' }}
                                    />
                                </div>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px', textAlign: 'right' }}>Meta Mensual: {fmt(META_MENSUAL)}</p>
                            </div>
                        </div>

                        {/* Deficit / Superavit Acumulado */}
                        <div className="glass-card" style={{ padding: '32px', flex: 1, borderTop: `4px solid ${diferencialAcumulado >= 0 ? '#00E676' : '#FF6B6B'}` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                <TrendingUp size={24} color={diferencialAcumulado >= 0 ? '#00E676' : '#FF6B6B'} />
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>Balance Acumulado T1</h3>
                            </div>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
                                Comparando el total acumulado de Ene-Abr ({fmt(acumuladoTotal)}) contra lo que deberíamos llevar cobrado al cierre de este período ({fmt(metaAcumuladaEsperada)}):
                            </p>
                            <div style={{ padding: '16px', borderRadius: '12px', background: diferencialAcumulado >= 0 ? 'rgba(0,230,118,0.1)' : 'rgba(255,107,107,0.1)', color: diferencialAcumulado >= 0 ? '#00E676' : '#FF6B6B', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, fontSize: '1.2rem' }}>
                                <span>{diferencialAcumulado >= 0 ? 'Superávit a favor:' : 'Déficit acumulado:'}</span>
                                <span>{fmt(Math.abs(diferencialAcumulado))}</span>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Historico Mensual BarChart */}
                <div className="glass-card" style={{ padding: '40px', background: 'rgba(20,25,35,0.6)' }}>
                    <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>Histórico de Pagado Mensual</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Seguimiento mes a mes contra la cuota mensual de $2,000,000.</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.85rem' }}>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}><div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#00E676' }}></div> Meta Lograda</div>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}><div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#FFD93D' }}></div> Riesgo</div>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}><div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#FF6B6B' }}></div> Déficit Crítico</div>
                        </div>
                    </div>

                    <div style={{ height: '400px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="mes" stroke="rgba(255,255,255,0.4)" axisLine={false} tickLine={false} dy={10} />
                                <YAxis stroke="rgba(255,255,255,0.4)" axisLine={false} tickLine={false} dx={-10} tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const d = payload[0].payload;
                                            return (
                                                <div style={{ background: '#1a1a2e', border: '1px solid #333', padding: '12px 16px', borderRadius: '8px', color: '#fff' }}>
                                                    <p style={{ fontWeight: 700, marginBottom: '8px' }}>{d.mes}</p>
                                                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>Pagado: <strong style={{ color: getBarColor(d.pagado, d.meta) }}>{fmt(d.pagado)}</strong></p>
                                                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>Meta: <strong>{fmt(d.meta)}</strong></p>
                                                    {d.pagado > 0 && d.pagado < d.meta && (
                                                        <p style={{ marginTop: '8px', color: '#FF6B6B', fontSize: '0.8rem', fontWeight: 600 }}>Faltante: {fmt(d.meta - d.pagado)}</p>
                                                    )}
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <ReferenceLine y={META_MENSUAL} stroke="#D4AF37" strokeDasharray="5 5" strokeWidth={2} label={{ position: 'top', value: 'META MENSUAL $2.0M', fill: '#D4AF37', fontSize: 11, fontWeight: 700 }} />
                                <Bar dataKey="pagado" radius={[6, 6, 0, 0]}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={getBarColor(entry.pagado, entry.meta)} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default MetaDespacho;
