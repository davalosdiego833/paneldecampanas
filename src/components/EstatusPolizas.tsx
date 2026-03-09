import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, FileText, Clock, Search, Calendar, AlertTriangle, CheckCircle, XCircle, ChevronDown, TrendingUp, Users, Info, Activity } from 'lucide-react';

type SubTab = 'resumen' | 'historial';

interface Asesor {
    clave: string;
    nombre: string;
    total_polizas: number;
    estatus: Record<string, number>;
}

interface Reporte {
    fecha_reporte: string;
    resumen_general: {
        total_asesores: number;
        total_polizas: number;
        por_estatus: Record<string, number>;
    };
    asesores: Asesor[];
}

interface CambiosData {
    resumen: {
        fecha_anterior: string;
        fecha_nuevo: string;
        total_anterior: number;
        total_nuevo: number;
        diferencia_total: number;
        cambios_estatus_general: Record<string, { anterior: number; nuevo: number; diferencia: number }>;
    };
    lista_cambios: Array<{
        asesor: string;
        clave: string;
        poliza: string;
        contratante: string;
        producto: string;
        estatus_anterior: string;
        estatus_nuevo: string;
        fecha: string;
        tipo?: string;
    }>;
}

/* ========== KPI Card ========== */
const HeroCard: React.FC<{ title: string; value: string | number; trend?: string; trendUp?: boolean; color: string; icon: React.ReactNode }> = ({ title, value, trend, trendUp, color, icon }) => (
    <div className="glass-card" style={{ padding: '24px', flex: '1 1 280px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.1 }}>
            {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 100 }) : icon}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ background: `${color}15`, padding: '10px', borderRadius: '12px', color: color }}>
                {icon}
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</span>
        </div>
        <div style={{ fontSize: '2.4rem', fontWeight: 900, marginBottom: '8px', color: 'var(--text-primary)' }}>
            {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        {trend && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, color: trendUp ? 'var(--success-green)' : 'var(--danger-red)' }}>
                <TrendingUp size={16} style={{ transform: trendUp ? 'none' : 'rotate(180deg)' }} />
                {trend}
            </div>
        )}
    </div>
);

/* ========== MAIN COMPONENT ========== */
const EstatusPolizasContent: React.FC = () => {
    const [subTab, setSubTab] = useState<SubTab>('resumen');
    const [fechas, setFechas] = useState<string[]>([]);
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [reporte, setReporte] = useState<Reporte | null>(null);
    const [cambios, setCambios] = useState<CambiosData | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetch('/api/estatus-polizas/fechas').then(r => r.json())
            .then((dates: string[]) => {
                setFechas(dates);
                if (dates.length > 0) setSelectedDate(dates[0]);
            })
            .catch(console.error);
    }, []);

    useEffect(() => {
        if (!selectedDate) return;
        setLoading(true);
        // Load SUMMARY version for speed
        Promise.all([
            fetch(`/api/estatus-polizas/reporte/${selectedDate}?summary=true`).then(r => r.ok ? r.json() : null),
            fetch(`/api/estatus-polizas/cambios/${selectedDate}`).then(r => r.json().catch(() => null)),
        ]).then(([rep, cam]) => {
            setReporte(rep);
            setCambios(cam);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [selectedDate]);

    const formatDate = (f: string) => {
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const [y, m, d] = f.split('-');
        return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
    };

    if (loading && !reporte) return (
        <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-secondary)' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>⏳</motion.div>
            <p style={{ marginTop: '16px' }}>Optimizando datos para carga rápida...</p>
        </div>
    );

    if (!reporte) return <div style={{ textAlign: 'center', padding: '80px' }}>Error cargando reporte.</div>;

    const enVigor = reporte.resumen_general.por_estatus['En Vigor'] || 0;
    const historialTotal = reporte.resumen_general.total_polizas;
    const diff = cambios?.resumen.diferencia_total || 0;

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Top Navigation & Date */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        🛡️ Estatus de Pólizas
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '4px' }}>
                        Inventario histórico y seguimiento de producción
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                        {(['resumen', 'historial'] as SubTab[]).map(tab => (
                            <button key={tab} onClick={() => setSubTab(tab)} style={{
                                padding: '8px 16px', borderRadius: '8px', border: 'none', background: subTab === tab ? '#007AFF' : 'transparent',
                                color: subTab === tab ? '#fff' : 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', transition: '0.2s'
                            }}>
                                {tab === 'resumen' ? 'Panel Asesores' : 'Comparativo'}
                            </button>
                        ))}
                    </div>

                    <select value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} style={{
                        padding: '10px 16px', background: 'rgba(0,122,255,0.1)', border: '1px solid rgba(0,122,255,0.3)', borderRadius: '10px',
                        color: '#007AFF', fontSize: '0.85rem', fontWeight: 700, outline: 'none', cursor: 'pointer'
                    }}>
                        {fechas.map(f => <option key={f} value={f}>{formatDate(f)}</option>)}
                    </select>
                </div>
            </div>

            {/* HERO KPI SECTION — The "3-Second Rule" */}
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <HeroCard
                    title="Archivo Histórico"
                    value={historialTotal}
                    trend={diff !== 0 ? `${diff > 0 ? '+' : ''}${diff} vs anterior` : undefined}
                    trendUp={diff >= 0}
                    color="#42A5F5"
                    icon={<FileText />}
                />
                <HeroCard
                    title="Pólizas en Vigor"
                    value={enVigor}
                    trend={`${((enVigor / historialTotal) * 100).toFixed(1)}% del total`}
                    trendUp={true}
                    color="#00E676"
                    icon={<CheckCircle />}
                />
                <HeroCard
                    title="Asesores Activos"
                    value={reporte.resumen_general.total_asesores}
                    color="#9C27B0"
                    icon={<Users />}
                />
            </div>

            {/* MAIN CONTENT AREA */}
            <AnimatePresence mode="wait">
                {subTab === 'resumen' && (
                    <motion.div key="resumen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div className="glass-card" style={{ padding: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>🔍 Detalle por Asesor</h3>
                                <div style={{ position: 'relative', width: '300px' }}>
                                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                                    <input
                                        type="text"
                                        placeholder="Buscar por nombre o clave..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        style={{
                                            width: '100%', padding: '12px 12px 12px 40px', background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid var(--glass-border)', borderRadius: '12px', color: 'var(--text-primary)', outline: 'none'
                                        }}
                                    />
                                </div>
                            </div>

                            <AdvisorTable asesores={reporte.asesores} search={search} selectedDate={selectedDate} />
                        </div>
                    </motion.div>
                )}

                {subTab === 'historial' && (
                    <div className="glass-card" style={{ padding: '24px' }}>
                        {!cambios ? (
                            <div style={{ textAlign: 'center', padding: '40px' }}>
                                <Info size={40} style={{ opacity: 0.2, marginBottom: '16px' }} />
                                <p>No hay comparativo disponible para esta fecha (primer reporte).</p>
                            </div>
                        ) : (
                            <CambiosView cambios={cambios} />
                        )}
                    </div>
                )}


            </AnimatePresence>
        </motion.div>
    );
};

/* ========== ADVISOR TABLE COMPONENT ========== */
const AdvisorTable: React.FC<{ asesores: Asesor[]; search: string; selectedDate: string }> = ({ asesores, search, selectedDate }) => {
    const filtered = useMemo(() =>
        asesores.filter(a => a.nombre.toLowerCase().includes(search.toLowerCase()) || a.clave.includes(search))
            .sort((a, b) => b.total_polizas - a.total_polizas)
        , [asesores, search]);

    return (
        <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--glass-border)' }}>
                        <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, opacity: 0.6 }}>ASESOR</th>
                        <th style={{ padding: '16px', textAlign: 'center', fontSize: '0.8rem', fontWeight: 700, opacity: 0.6 }}>TOTAL HISTÓRICO</th>
                        <th style={{ padding: '16px', textAlign: 'center', fontSize: '0.8rem', fontWeight: 700, opacity: 0.6 }}>VIGENTES ✅</th>
                        <th style={{ padding: '16px', textAlign: 'center', fontSize: '0.8rem', fontWeight: 700, opacity: 0.6 }}>ANULADAS ❌</th>
                        <th style={{ padding: '16px', textAlign: 'center', fontSize: '0.8rem', fontWeight: 700, opacity: 0.6 }}>PRODUCTIVIDAD</th>
                    </tr>
                </thead>
                <tbody>
                    {filtered.map((a, i) => {
                        const ev = a.estatus['En Vigor'] || 0;
                        const an = a.estatus['Anulada'] || 0;
                        const pct = a.total_polizas > 0 ? Math.round((ev / a.total_polizas) * 100) : 0;
                        return (
                            <tr key={a.clave} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: '0.2s' }} className="hover-row">
                                <td style={{ padding: '16px' }}>
                                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{a.nombre}</div>
                                    <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>{a.clave}</div>
                                </td>
                                <td style={{ padding: '16px', textAlign: 'center', fontWeight: 800, fontSize: '1.1rem' }}>{a.total_polizas}</td>
                                <td style={{ padding: '16px', textAlign: 'center' }}>
                                    <span style={{ padding: '4px 12px', background: 'rgba(0,230,118,0.1)', color: 'var(--success-green)', borderRadius: '20px', fontWeight: 800 }}>{ev}</span>
                                </td>
                                <td style={{ padding: '16px', textAlign: 'center' }}>
                                    <span style={{ padding: '4px 12px', background: 'rgba(255,107,107,0.1)', color: 'var(--danger-red)', borderRadius: '20px', fontWeight: 800 }}>{an}</span>
                                </td>
                                <td style={{ padding: '16px', textAlign: 'center', width: '180px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 800 }}>
                                            <span style={{ color: pct > 70 ? 'var(--success-green)' : 'var(--accent-gold)' }}>{pct}% Eficacia</span>
                                        </div>
                                        <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${pct}%` }}
                                                style={{ height: '100%', background: pct > 70 ? 'var(--success-green)' : 'var(--accent-gold)' }}
                                            />
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

/* ========== CAMBIOS VIEW COMPONENT ========== */
const CambiosView: React.FC<{ cambios: CambiosData }> = ({ cambios }) => {
    // Clasificar cambios para el GPS solicitado por el usuario
    const cancelaciones = cambios.lista_cambios?.filter(c =>
        (c.estatus_anterior === 'En Vigor' || c.estatus_anterior === 'Vigor Prorrogado') &&
        (c.estatus_nuevo === 'Anulada' || c.estatus_nuevo === 'Cancelada' || c.estatus_nuevo === 'DESAPARECIDA (No en portal)')
    ) || [];

    const recuperaciones = cambios.lista_cambios?.filter(c =>
        (c.estatus_anterior === 'Anulada' || c.estatus_anterior === 'Cancelada' || c.estatus_anterior === 'Vigor Prorrogado') &&
        (c.estatus_nuevo === 'En Vigor')
    ) || [];

    const altas = cambios.lista_cambios?.filter(c => c.tipo === 'ALTA') || [];

    const generalStats = cambios.resumen.cambios_estatus_general;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
            {/* Encabezado GPS */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#007AFF', fontWeight: 700 }}>
                <Clock size={20} />
                <span>GPS de Cartera: Movimientos desde {cambios.resumen.fecha_anterior}</span>
            </div>

            {/* Layout de 3 Columnas: Resumen + Detalle */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>

                {/* COLUMNA 1: EN VIGOR (RECUPERACIONES) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="glass-card" style={{ padding: '16px', background: 'rgba(0, 230, 118, 0.05)', border: '1px solid rgba(0, 230, 118, 0.2)' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 800, opacity: 0.6, textTransform: 'uppercase' }}>Comparativa En Vigor</div>
                        <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--success-green)' }}>
                            {recuperaciones.length > 0 ? '+' : ''}{recuperaciones.length}
                        </div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid var(--glass-border)', padding: '16px', height: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', color: 'var(--success-green)' }}>
                            <TrendingUp size={18} />
                            <h4 style={{ fontSize: '0.9rem', fontWeight: 800 }}>GPS Recuperaciones ({recuperaciones.length})</h4>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {recuperaciones.map((c, i) => (
                                <div key={i} style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(0,230,118,0.3)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', alignItems: 'flex-start' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontWeight: 800, fontSize: '0.75rem', color: 'var(--success-green)', textTransform: 'uppercase' }}>
                                                {c.asesor} <span style={{ opacity: 0.6 }}>({c.clave})</span>
                                            </span>
                                            <span style={{ fontWeight: 900, fontSize: '0.9rem', color: 'var(--text-primary)', marginTop: '2px' }}>{c.contratante || 'CLIENTE RECONECTADO'}</span>
                                        </div>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-primary)', opacity: 0.6, background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                                            #{c.poliza && !c.poliza.startsWith('PENDIENTE') ? c.poliza : 'Detectando...'}
                                        </span>
                                    </div>
                                    <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)', marginBottom: '8px', opacity: 0.9 }}>
                                        {c.producto || 'Póliza de Vida'}
                                    </div>
                                    <div style={{ opacity: 0.8, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ opacity: 0.6 }}>{c.estatus_anterior}</span> ➔ <span style={{ fontWeight: 800, color: '#fff', background: 'var(--success-green)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem' }}>{c.estatus_nuevo}</span>
                                    </div>
                                </div>
                            ))}
                            {recuperaciones.length === 0 && <p style={{ fontSize: '0.8rem', opacity: 0.4 }}>Sin recuperaciones.</p>}
                        </div>
                    </div>
                </div>

                {/* COLUMNA 2: ARCHIVO HISTÓRICO (ALTAS/NUEVAS) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="glass-card" style={{ padding: '16px', background: 'rgba(0, 122, 255, 0.05)', border: '1px solid rgba(0, 122, 255, 0.2)' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 800, opacity: 0.6, textTransform: 'uppercase' }}>Nuevas en Histórico</div>
                        <div style={{ fontSize: '2rem', fontWeight: 900, color: '#007AFF' }}>
                            {altas.length > 0 ? '+' : ''}{altas.length}
                        </div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid var(--glass-border)', padding: '16px', height: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', color: '#007AFF' }}>
                            <Activity size={18} />
                            <h4 style={{ fontSize: '0.9rem', fontWeight: 800 }}>GPS Altas Nuevas ({altas.length})</h4>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {altas.map((c, i) => (
                                <div key={i} style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(0,122,255,0.3)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', alignItems: 'flex-start' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontWeight: 800, fontSize: '0.75rem', color: 'var(--primary-blue)', textTransform: 'uppercase' }}>
                                                {c.asesor} <span style={{ opacity: 0.6 }}>({c.clave})</span>
                                            </span>
                                            <span style={{ fontWeight: 900, fontSize: '0.9rem', color: 'var(--text-primary)', marginTop: '2px' }}>{c.contratante || 'NUEVA EMISIÓN'}</span>
                                        </div>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-primary)', opacity: 0.6, background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                                            #{c.poliza}
                                        </span>
                                    </div>
                                    <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)', marginBottom: '8px', opacity: 0.9 }}>
                                        {c.producto || 'Póliza Nueva'}
                                    </div>
                                    <div style={{ opacity: 0.8, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ opacity: 0.6 }}>Ingresa como</span> <span style={{ fontWeight: 800, color: '#fff', background: 'var(--primary-blue)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem' }}>{c.estatus_nuevo}</span>
                                    </div>
                                </div>
                            ))}
                            {altas.length === 0 && <p style={{ fontSize: '0.8rem', opacity: 0.4 }}>Sin pólizas nuevas.</p>}
                        </div>
                    </div>
                </div>

                {/* COLUMNA 3: ANULADAS (CANCELACIONES) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="glass-card" style={{ padding: '16px', background: 'rgba(255, 107, 107, 0.05)', border: '1px solid rgba(255, 107, 107, 0.2)' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 800, opacity: 0.6, textTransform: 'uppercase' }}>Comparativa Anuladas</div>
                        <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--danger-red)' }}>
                            {cancelaciones.length > 0 ? '-' : ''}{cancelaciones.length}
                        </div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid var(--glass-border)', padding: '16px', height: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', color: 'var(--danger-red)' }}>
                            <AlertTriangle size={18} />
                            <h4 style={{ fontSize: '0.9rem', fontWeight: 800 }}>GPS Cancelaciones ({cancelaciones.length})</h4>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {cancelaciones.map((c, i) => (
                                <div key={i} style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,107,107,0.3)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', alignItems: 'flex-start' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontWeight: 800, fontSize: '0.75rem', color: 'var(--danger-red)', textTransform: 'uppercase' }}>
                                                {c.asesor} <span style={{ opacity: 0.6 }}>({c.clave})</span>
                                            </span>
                                            <span style={{ fontWeight: 900, fontSize: '0.9rem', color: 'var(--text-primary)', marginTop: '2px' }}>{c.contratante || 'CLIENTE POR IDENTIFICAR'}</span>
                                        </div>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-primary)', opacity: 0.6, background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                                            #{c.poliza && !c.poliza.startsWith('PENDIENTE') ? c.poliza : 'Identificando...'}
                                        </span>
                                    </div>
                                    <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)', marginBottom: '8px', opacity: 0.9 }}>
                                        {c.producto || 'Póliza de Vida'}
                                    </div>
                                    <div style={{ opacity: 0.8, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ opacity: 0.6 }}>{c.estatus_anterior}</span> ➔ <span style={{ fontWeight: 800, color: '#fff', background: 'var(--danger-red)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem' }}>{c.estatus_nuevo}</span>
                                    </div>
                                </div>
                            ))}
                            {cancelaciones.length === 0 && <p style={{ fontSize: '0.8rem', opacity: 0.4 }}>Sin cancelaciones hoy.</p>}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

/* ========== SEGUIMIENTO VIEW COMPONENT ========== */
const SeguimientoView: React.FC = () => {
    const [data, setData] = useState<{ pendientes_recuperar: any[]; recuperadas_este_mes: any[] } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/estatus-polizas/seguimiento')
            .then(res => res.json())
            .then(d => { setData(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    if (loading) return <div>Cargando seguimiento...</div>;
    if (!data) return <div>No hay datos de seguimiento disponibles.</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '8px', color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <AlertTriangle /> Pendientes de Recuperación
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>Pólizas que cayeron en Anulada este mes y requieren seguimiento inmediato.</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                    {data.pendientes_recuperar.length === 0 ? (
                        <div className="glass-card" style={{ padding: '20px', textAlign: 'center', gridColumn: '1/-1', opacity: 0.5 }}>🎉 ¡Felicidades! No tienes cancelaciones pendientes.</div>
                    ) : data.pendientes_recuperar.map((c, i) => (
                        <div key={i} className="glass-card" style={{ padding: '16px', borderLeft: '4px solid var(--danger-red)' }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{c.contratante}</div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.7, margin: '4px 0' }}>{c.producto} | Pol: {c.poliza}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--danger-red)' }}>{c.asesor}</span>
                                <span style={{ fontSize: '0.7rem', padding: '2px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>Desde: {c.fecha}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '8px', color: 'var(--success-green)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CheckCircle /> Recuperadas con Éxito
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>Pólizas que pasaron de Anulada a En Vigor en el último corte.</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                    {data.recuperadas_este_mes.length === 0 ? (
                        <div className="glass-card" style={{ padding: '20px', textAlign: 'center', gridColumn: '1/-1', opacity: 0.5 }}>Aún no se detectan recuperaciones este mes.</div>
                    ) : data.recuperadas_este_mes.map((c, i) => (
                        <div key={i} className="glass-card" style={{ padding: '16px', borderLeft: '4px solid var(--success-green)' }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{c.contratante}</div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.7, margin: '4px 0' }}>{c.producto} | Pol: {c.poliza}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--success-green)' }}>{c.asesor}</span>
                                <span style={{ fontSize: '1.2rem' }}>💰</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default EstatusPolizasContent;

