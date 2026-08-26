import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, Search, Award, CheckCircle } from 'lucide-react';

interface QsQVidaRow {
    lugar: number;
    nombre: string;
    conexion: string;
    prima_meta_ant: number;
    prima_meta_mes: number;
    prima_meta_acum: number;
    polizas_cc_mes: number;
    polizas_cc_acum: number;
    limra: string;
    igc: string;
    limra_num?: number;
    igc_num?: number;
}

interface Props {
    data: {
        top5?: QsQVidaRow[];
        all?: QsQVidaRow[];
    } | null;
    fechaCorte: string;
    themeMode: 'dark' | 'light';
}

const fmt = (n: number | null | undefined) => {
    if (n == null || isNaN(Number(n))) return '$0.00';
    return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const fmtNum = (n: number | null | undefined) => {
    if (n == null || isNaN(Number(n))) return '0';
    return Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

export const QsQVidaContent: React.FC<Props> = ({ data, fechaCorte, themeMode }) => {
    const [search, setSearch] = useState('');

    if (!data || !data.all || data.all.length === 0) {
        return (
            <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No se encontraron datos registrados para QsQ Vida.
            </div>
        );
    }

    const top5 = data.top5 || data.all.slice(0, 5);
    const allRows = data.all || [];

    const filteredRows = allRows.filter(r => 
        (r.nombre || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}
        >
            {/* Header Title & Cutoff Badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                        <div style={{ background: 'rgba(255, 183, 77, 0.15)', border: '1px solid rgba(255, 183, 77, 0.3)', borderRadius: '10px', padding: '8px', display: 'flex' }}>
                            <Lightbulb size={24} color="#FFB74D" />
                        </div>
                        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                            💡 QsQ Vida (Matriz 2043)
                        </h2>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                        Métricas de Prima Meta, Pólizas CC, LIMRA e IGC por Asesor
                    </p>
                </div>

                {fechaCorte && (
                    <div style={{
                        background: 'rgba(255, 183, 77, 0.12)',
                        border: '1px solid rgba(255, 183, 77, 0.3)',
                        borderRadius: '12px',
                        padding: '8px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#FFB74D',
                        fontSize: '0.85rem',
                        fontWeight: 700
                    }}>
                        <span>📅 Fecha de Corte: {fechaCorte}</span>
                    </div>
                )}
            </div>

            {/* TABLA 1: TOP 5 PROMOTORÍA (PRIMA META ACUMULADA MES ACTUAL) */}
            <div className="glass-card" style={{ padding: '24px', borderLeft: '4px solid #FFB74D' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                    <Award size={22} color="#FFB74D" />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                        🏆 Top 5 Promotoría — Prima Meta Acumulada Mes Actual
                    </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {top5.map((item, idx) => (
                        <div
                            key={idx}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '14px 18px',
                                background: idx === 0 ? 'rgba(255, 183, 77, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                                border: `1px solid ${idx === 0 ? 'rgba(255, 183, 77, 0.3)' : 'var(--glass-border)'}`,
                                borderRadius: '12px',
                                flexWrap: 'wrap',
                                gap: '12px'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    background: idx === 0 ? '#FFB74D' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : 'rgba(255,255,255,0.1)',
                                    color: idx < 3 ? '#0F172A' : 'var(--text-primary)',
                                    fontWeight: 800,
                                    fontSize: '0.85rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {idx + 1}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                                        {item.nombre}
                                    </div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                        Conexión: {item.conexion} | Pólizas CC Acum: {item.polizas_cc_acum}
                                    </div>
                                </div>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
                                    Prima Meta Acumulada
                                </div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFB74D' }}>
                                    {fmt(item.prima_meta_acum)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* TABLA 2: DETALLE COMPLETO (MATRIZ 2043) */}
            <div className="glass-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                        📊 Detalle Completo de Asesores ({allRows.length})
                    </h3>

                    {/* Search Bar */}
                    <div style={{ position: 'relative', minWidth: '240px' }}>
                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre de asesor..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="input-modern"
                            style={{ paddingLeft: '36px', fontSize: '0.85rem', width: '100%' }}
                        />
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--glass-border)', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                <th style={{ padding: '12px 10px' }}>#</th>
                                <th style={{ padding: '12px 10px' }}>Nombre del Asesor</th>
                                <th style={{ padding: '12px 10px' }}>Conexión</th>
                                <th style={{ padding: '12px 10px', textAlign: 'right', color: '#FFB74D' }}>Prima Meta (Ant)</th>
                                <th style={{ padding: '12px 10px', textAlign: 'right', color: '#FFB74D' }}>Prima Meta (Mes)</th>
                                <th style={{ padding: '12px 10px', textAlign: 'right', color: '#FFB74D' }}>Prima Meta (Acum)</th>
                                <th style={{ padding: '12px 10px', textAlign: 'center', color: '#42A5F5' }}>CC (Mes)</th>
                                <th style={{ padding: '12px 10px', textAlign: 'center', color: '#42A5F5' }}>CC (Acum)</th>
                                <th style={{ padding: '12px 10px', textAlign: 'center', color: '#00E676' }}>LIMRA</th>
                                <th style={{ padding: '12px 10px', textAlign: 'center', color: '#00E676' }}>IGC</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRows.map((r, i) => (
                                <tr 
                                    key={i} 
                                    style={{ 
                                        borderBottom: '1px solid var(--glass-border)',
                                        background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' 
                                    }}
                                >
                                    <td style={{ padding: '12px 10px', color: 'var(--text-secondary)', fontWeight: 700 }}>{i + 1}</td>
                                    <td style={{ padding: '12px 10px', color: 'var(--text-primary)', fontWeight: 600 }}>{r.nombre}</td>
                                    <td style={{ padding: '12px 10px', color: 'var(--text-secondary)' }}>{r.conexion}</td>
                                    <td style={{ padding: '12px 10px', textAlign: 'right' }}>{fmt(r.prima_meta_ant)}</td>
                                    <td style={{ padding: '12px 10px', textAlign: 'right' }}>{fmt(r.prima_meta_mes)}</td>
                                    <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 800, color: '#FFB74D' }}>{fmt(r.prima_meta_acum)}</td>
                                    <td style={{ padding: '12px 10px', textAlign: 'center' }}>{fmtNum(r.polizas_cc_mes)}</td>
                                    <td style={{ padding: '12px 10px', textAlign: 'center', fontWeight: 700, color: '#42A5F5' }}>{fmtNum(r.polizas_cc_acum)}</td>
                                    <td style={{ padding: '12px 10px', textAlign: 'center', fontWeight: 700, color: '#00E676' }}>{r.limra}</td>
                                    <td style={{ padding: '12px 10px', textAlign: 'center', fontWeight: 700, color: '#00E676' }}>{r.igc}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {search && (
                    <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Mostrando {filteredRows.length} de {allRows.length} asesores
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default QsQVidaContent;
