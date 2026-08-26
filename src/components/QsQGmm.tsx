import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Hospital, Search, Award, RefreshCw } from 'lucide-react';

interface QsQGmmRow {
    lugar: number;
    nombre: string;
    conexion: string;
    polizas_iniciales: number;
    inicial: number;
    renovacion: number;
    total_gmm: number;
}

interface Props {
    data: {
        top5_inicial?: QsQGmmRow[];
        top5_renovacion?: QsQGmmRow[];
        all?: QsQGmmRow[];
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

export const QsQGmmContent: React.FC<Props> = ({ data, fechaCorte, themeMode }) => {
    const [search, setSearch] = useState('');

    if (!data || !data.all || data.all.length === 0) {
        return (
            <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No se encontraron datos registrados para QsQ GMM.
            </div>
        );
    }

    const top5Inicial = data.top5_inicial || data.all.slice(0, 5);
    const top5Renovacion = data.top5_renovacion || data.all.slice(0, 5);
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
                        <div style={{ background: 'rgba(128, 203, 196, 0.15)', border: '1px solid rgba(128, 203, 196, 0.3)', borderRadius: '10px', padding: '8px', display: 'flex' }}>
                            <Hospital size={24} color="#80CBC4" />
                        </div>
                        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                            🏥 QsQ GMM (Matriz 2043)
                        </h2>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                        Métricas de Prima Inicial, Renovación y Total GMM Individual
                    </p>
                </div>

                {fechaCorte && (
                    <div style={{
                        background: 'rgba(128, 203, 196, 0.12)',
                        border: '1px solid rgba(128, 203, 196, 0.3)',
                        borderRadius: '12px',
                        padding: '8px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#80CBC4',
                        fontSize: '0.85rem',
                        fontWeight: 700
                    }}>
                        <span>📅 Fecha de Corte: {fechaCorte}</span>
                    </div>
                )}
            </div>

            {/* TOP 5 GRID: INICIAL vs RENOVACIÓN */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                {/* TABLA 1: TOP 5 EN INICIAL */}
                <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #80CBC4' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                        <Award size={20} color="#80CBC4" />
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                            🏆 Top 5 Promotoría — Prima Inicial
                        </h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {top5Inicial.map((item, idx) => (
                            <div
                                key={idx}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '12px 14px',
                                    background: idx === 0 ? 'rgba(128, 203, 196, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                                    border: `1px solid ${idx === 0 ? 'rgba(128, 203, 196, 0.3)' : 'var(--glass-border)'}`,
                                    borderRadius: '10px',
                                    flexWrap: 'wrap',
                                    gap: '8px'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '50%',
                                        background: idx === 0 ? '#80CBC4' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : 'rgba(255,255,255,0.1)',
                                        color: idx < 3 ? '#0F172A' : 'var(--text-primary)',
                                        fontWeight: 800,
                                        fontSize: '0.8rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.88rem' }}>
                                            {item.nombre}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                            Conexión: {item.conexion} | Pól. Inic: {item.polizas_iniciales}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
                                        Prima Inicial
                                    </div>
                                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#80CBC4' }}>
                                        {fmt(item.inicial)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* TABLA 2: TOP 5 EN RENOVACIÓN */}
                <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #BA68C8' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                        <RefreshCw size={20} color="#BA68C8" />
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                            🔄 Top 5 Promotoría — Prima Renovación
                        </h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {top5Renovacion.map((item, idx) => (
                            <div
                                key={idx}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '12px 14px',
                                    background: idx === 0 ? 'rgba(186, 104, 200, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                                    border: `1px solid ${idx === 0 ? 'rgba(186, 104, 200, 0.3)' : 'var(--glass-border)'}`,
                                    borderRadius: '10px',
                                    flexWrap: 'wrap',
                                    gap: '8px'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '50%',
                                        background: idx === 0 ? '#BA68C8' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : 'rgba(255,255,255,0.1)',
                                        color: idx < 3 ? '#0F172A' : 'var(--text-primary)',
                                        fontWeight: 800,
                                        fontSize: '0.8rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.88rem' }}>
                                            {item.nombre}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                            Conexión: {item.conexion}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
                                        Prima Renovación
                                    </div>
                                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#BA68C8' }}>
                                        {fmt(item.renovacion)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* TABLA GENERAL: DETALLE COMPLETO GMM INDIVIDUAL */}
            <div className="glass-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                        📊 Detalle Completo — GMM Individual ({allRows.length} Asesores)
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
                                <th style={{ padding: '12px 10px', textAlign: 'center', color: '#42A5F5' }}>Pólizas Iniciales</th>
                                <th style={{ padding: '12px 10px', textAlign: 'right', color: '#80CBC4' }}>Inicial (GMM)</th>
                                <th style={{ padding: '12px 10px', textAlign: 'right', color: '#BA68C8' }}>Renovación (GMM)</th>
                                <th style={{ padding: '12px 10px', textAlign: 'right', color: '#00E676' }}>Total GMM</th>
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
                                    <td style={{ padding: '12px 10px', textAlign: 'center', fontWeight: 700, color: '#42A5F5' }}>{fmtNum(r.polizas_iniciales)}</td>
                                    <td style={{ padding: '12px 10px', textAlign: 'right', color: '#80CBC4', fontWeight: 600 }}>{fmt(r.inicial)}</td>
                                    <td style={{ padding: '12px 10px', textAlign: 'right', color: '#BA68C8', fontWeight: 600 }}>{fmt(r.renovacion)}</td>
                                    <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 800, color: '#00E676' }}>{fmt(r.total_gmm)}</td>
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

export default QsQGmmContent;
