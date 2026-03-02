import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, FileText, Clock, Search, Calendar, AlertTriangle, CheckCircle, XCircle, ChevronDown } from 'lucide-react';

/**
 * EstatusPolizas content components — designed to be embedded inside ResumenPromotoria.
 * No sidebar or layout wrapper — just the content area.
 */

type SubTab = 'resumen' | 'seguimiento' | 'historial';

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
        total_asesores_con_cambios: number;
    };
    asesores_con_cambios: Array<{
        clave: string;
        nombre: string;
        total_anterior: number;
        total_nuevo: number;
        diferencia_total: number;
        cambios_estatus: Record<string, { anterior: number; nuevo: number; diferencia: number }>;
    }>;
    asesores_sin_cambios: Array<{ clave: string; nombre: string; total: number }>;
}

interface Seguimiento {
    ultima_actualizacion: string | null;
    pendientes_recuperar: Array<{
        poliza: string;
        contratante: string;
        asesor: string;
        asesor_clave: string;
        estatus_anterior: string;
        fecha_cancelacion_detectada: string;
        dias_pendiente: number;
    }>;
    recuperadas_este_mes: Array<{
        poliza: string;
        contratante: string;
        asesor: string;
        fecha_cancelacion: string;
        fecha_recuperacion: string;
        dias_que_tardo: number;
    }>;
}

/* ========== Badge ========== */
const Badge: React.FC<{ value: number; color: string; bgColor: string }> = ({ value, color, bgColor }) => (
    <span style={{ display: 'inline-block', padding: '3px 12px', borderRadius: '12px', fontSize: '0.82rem', fontWeight: 700, color, background: bgColor }}>{value.toLocaleString()}</span>
);

/* ========== KPI Card ========== */
const EPCard: React.FC<{ title: string; value: string | number; subtitle?: string; color: string; icon?: React.ReactNode }> = ({ title, value, subtitle, color, icon }) => (
    <div className="glass-card" style={{ padding: '20px 24px', flex: '1 1 200px', minWidth: '160px', borderTop: `3px solid ${color}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>{title}</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>{typeof value === 'number' ? value.toLocaleString() : value}</div>
                {subtitle && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{subtitle}</div>}
            </div>
            {icon && <div style={{ opacity: 0.5 }}>{icon}</div>}
        </div>
    </div>
);

/* ========== Progress Bar ========== */
const ProgressBar: React.FC<{ pct: number; color: string }> = ({ pct, color }) => (
    <div style={{ width: '100%', height: '6px', background: 'rgba(148,163,184,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{ height: '100%', borderRadius: '3px', background: `linear-gradient(90deg, ${color}, ${color}dd)` }} />
    </div>
);

/* ========== Date Selector ========== */
const DateSelector: React.FC<{ fechas: string[]; selected: string; onChange: (f: string) => void }> = ({ fechas, selected, onChange }) => {
    const [open, setOpen] = useState(false);
    const formatDate = (f: string) => {
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const [y, m, d] = f.split('-');
        return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
    };
    return (
        <div style={{ position: 'relative' }}>
            <button onClick={() => setOpen(!open)} style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px',
                background: 'rgba(0,184,217,0.1)', border: '1px solid rgba(0,184,217,0.25)',
                borderRadius: '12px', fontSize: '0.82rem', fontWeight: 600, color: '#00B8D9',
                cursor: 'pointer', fontFamily: 'inherit',
            }}>
                <Calendar size={14} />{formatDate(selected)}
                <ChevronDown size={14} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
            </button>
            {open && (
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '6px', background: 'var(--bg-secondary, #0f1219)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '6px', zIndex: 100, minWidth: '160px', boxShadow: '0 8px 30px rgba(0,0,0,0.4)' }}>
                    {fechas.map(f => (
                        <button key={f} onClick={() => { onChange(f); setOpen(false); }} style={{
                            display: 'block', width: '100%', padding: '8px 14px', borderRadius: '8px',
                            fontSize: '0.82rem', color: f === selected ? '#00B8D9' : 'var(--text-primary)',
                            background: f === selected ? 'rgba(0,184,217,0.1)' : 'transparent',
                            border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                            fontWeight: f === selected ? 700 : 400,
                        }}>{formatDate(f)}</button>
                    ))}
                </div>
            )}
        </div>
    );
};

/* ========== Sub-Tab Bar ========== */
const SubTabBar: React.FC<{ active: SubTab; onChange: (t: SubTab) => void }> = ({ active, onChange }) => {
    const tabs: { key: SubTab; label: string; icon: React.ReactNode }[] = [
        { key: 'resumen', label: 'Resumen por Asesor', icon: <FileText size={15} /> },
        { key: 'seguimiento', label: 'Seguimiento Cancelaciones', icon: <AlertTriangle size={15} /> },
        { key: 'historial', label: 'Historial de Cambios', icon: <Clock size={15} /> },
    ];
    return (
        <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
            {tabs.map(t => (
                <button key={t.key} onClick={() => onChange(t.key)} style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    padding: '10px 16px', borderRadius: '10px', fontSize: '0.82rem', fontWeight: active === t.key ? 700 : 500,
                    color: active === t.key ? '#00B8D9' : 'var(--text-secondary)',
                    background: active === t.key ? 'rgba(0,184,217,0.1)' : 'transparent',
                    border: active === t.key ? '1px solid rgba(0,184,217,0.2)' : '1px solid transparent',
                    cursor: 'pointer', fontFamily: 'inherit', transition: '0.2s',
                }}>{t.icon}<span>{t.label}</span></button>
            ))}
        </div>
    );
};

/* ========== MAIN EXPORTED CONTENT COMPONENT ========== */
const EstatusPolizasContent: React.FC = () => {
    const [subTab, setSubTab] = useState<SubTab>('resumen');
    const [fechas, setFechas] = useState<string[]>([]);
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [reporte, setReporte] = useState<Reporte | null>(null);
    const [cambios, setCambios] = useState<CambiosData | null>(null);
    const [seguimiento, setSeguimiento] = useState<Seguimiento | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetch('/api/estatus-polizas/fechas').then(r => r.json())
            .then((dates: string[]) => { setFechas(dates); if (dates.length > 0) setSelectedDate(dates[0]); })
            .catch(console.error);
    }, []);

    useEffect(() => {
        if (!selectedDate) return;
        setLoading(true);
        Promise.all([
            fetch(`/api/estatus-polizas/reporte/${selectedDate}`).then(r => r.ok ? r.json() : null),
            fetch(`/api/estatus-polizas/cambios/${selectedDate}`).then(r => r.json()),
            fetch('/api/estatus-polizas/seguimiento').then(r => r.json()),
        ]).then(([rep, cam, seg]) => { setReporte(rep); setCambios(cam); setSeguimiento(seg); setLoading(false); })
            .catch(() => setLoading(false));
    }, [selectedDate]);

    if (loading) return <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-secondary)' }}>Cargando datos de pólizas...</div>;
    if (!reporte) return <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-secondary)' }}>No hay datos disponibles.</div>;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>🛡️ Estatus de Pólizas</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Seguimiento y cambios de pólizas por asesor</p>
                </div>
                {fechas.length > 0 && <DateSelector fechas={fechas} selected={selectedDate} onChange={setSelectedDate} />}
            </div>

            {/* Sub-tab bar */}
            <SubTabBar active={subTab} onChange={setSubTab} />

            {/* Content */}
            {subTab === 'resumen' && <ResumenSubTab reporte={reporte} search={search} setSearch={setSearch} />}
            {subTab === 'seguimiento' && <SeguimientoSubTab seguimiento={seguimiento} />}
            {subTab === 'historial' && <HistorialSubTab cambios={cambios} selectedDate={selectedDate} fechas={fechas} onDateChange={setSelectedDate} />}
        </motion.div>
    );
};

/* ========== SUB-TAB 1: RESUMEN POR ASESOR ========== */
const ResumenSubTab: React.FC<{ reporte: Reporte; search: string; setSearch: (s: string) => void }> = ({ reporte, search, setSearch }) => {
    const { resumen_general: rg, asesores } = reporte;
    const enVigor = rg.por_estatus['En Vigor'] || 0;
    const anulada = rg.por_estatus['Anulada'] || 0;
    const prorrogado = rg.por_estatus['Vigor Prorrogado'] || 0;
    const sinPago = rg.por_estatus['En Vigor sin Pago de Primas'] || 0;
    const pctVigor = rg.total_polizas > 0 ? ((enVigor / rg.total_polizas) * 100).toFixed(1) : '0';

    const sorted = [...asesores].sort((a, b) => b.total_polizas - a.total_polizas);
    const filtered = search ? sorted.filter(a => a.nombre.toLowerCase().includes(search.toLowerCase()) || a.clave.includes(search)) : sorted;

    return (
        <>
            {/* KPI Cards */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
                <EPCard title="Total Pólizas" value={rg.total_polizas} subtitle={`${rg.total_asesores} asesores`} color="#42A5F5" icon={<Shield size={22} color="#42A5F5" />} />
                <EPCard title="En Vigor" value={enVigor} subtitle={`${pctVigor}% del total`} color="#00E676" icon={<CheckCircle size={22} color="#00E676" />} />
                <EPCard title="Anuladas" value={anulada} subtitle={`${rg.total_polizas > 0 ? ((anulada / rg.total_polizas) * 100).toFixed(1) : 0}%`} color="#FF6B6B" icon={<XCircle size={22} color="#FF6B6B" />} />
                <EPCard title="Vigor Prorrogado" value={prorrogado} color="#FFD93D" icon={<Clock size={22} color="#FFD93D" />} />
                <EPCard title="En Vigor sin Pago" value={sinPago} color="#FB923C" icon={<AlertTriangle size={22} color="#FB923C" />} />
            </div>

            {/* Table */}
            <div className="glass-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>📋 Desglose por Asesor</h3>
                    <div style={{ position: 'relative', maxWidth: '280px' }}>
                        <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
                        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar asesor..."
                            style={{ width: '100%', padding: '8px 12px 8px 32px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '0.82rem', outline: 'none', fontFamily: 'inherit' }} />
                    </div>
                </div>
                <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                        <thead>
                            <tr style={{ background: 'rgba(0,184,217,0.08)' }}>
                                {['Asesor', 'Total', 'En Vigor ✅', 'Anulada ❌', 'Prorrog. ⏳', 'Sin Pago ⚠️', '% En Vigor'].map((h, i) => (
                                    <th key={h} style={{ padding: '12px 14px', textAlign: i === 0 ? 'left' : 'center', fontWeight: 700, color: 'var(--text-primary)', borderBottom: '2px solid var(--glass-border)', whiteSpace: 'nowrap', ...(h === '% En Vigor' ? { minWidth: '120px' } : {}) }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((a, i) => {
                                const ev = a.estatus['En Vigor'] || 0, an = a.estatus['Anulada'] || 0;
                                const vp = a.estatus['Vigor Prorrogado'] || 0, sp = a.estatus['En Vigor sin Pago de Primas'] || 0;
                                const pct = a.total_polizas > 0 ? Math.round((ev / a.total_polizas) * 100) : 0;
                                const pctColor = pct >= 70 ? '#00E676' : pct >= 50 ? '#FFD93D' : '#FF6B6B';
                                return (
                                    <tr key={a.clave} style={{ borderBottom: '1px solid var(--glass-border)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)', opacity: a.total_polizas === 0 ? 0.4 : 1 }}>
                                        <td style={{ padding: '10px 14px' }}>
                                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{a.nombre}</div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Clave: {a.clave}</div>
                                        </td>
                                        <td style={{ padding: '10px 14px', textAlign: 'center' }}><Badge value={a.total_polizas} color="var(--text-primary)" bgColor="rgba(148,163,184,0.15)" /></td>
                                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>{ev > 0 ? <Badge value={ev} color="#00E676" bgColor="rgba(0,230,118,0.12)" /> : <span style={{ color: '#475569' }}>0</span>}</td>
                                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>{an > 0 ? <Badge value={an} color="#FF6B6B" bgColor="rgba(255,107,107,0.12)" /> : <span style={{ color: '#475569' }}>0</span>}</td>
                                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>{vp > 0 ? <Badge value={vp} color="#FFD93D" bgColor="rgba(255,217,61,0.12)" /> : <span style={{ color: '#475569' }}>0</span>}</td>
                                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>{sp > 0 ? <Badge value={sp} color="#FB923C" bgColor="rgba(251,146,60,0.12)" /> : <span style={{ color: '#475569' }}>0</span>}</td>
                                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                            <div style={{ fontWeight: 700, color: pctColor, fontSize: '0.85rem', marginBottom: '4px' }}>{pct}%</div>
                                            <ProgressBar pct={pct} color={pctColor} />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {search && <div style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{filtered.length} de {asesores.length} asesores</div>}
            </div>
        </>
    );
};

/* ========== SUB-TAB 2: SEGUIMIENTO ========== */
const SeguimientoSubTab: React.FC<{ seguimiento: Seguimiento | null }> = ({ seguimiento }) => {
    const pendientes = seguimiento?.pendientes_recuperar || [];
    const recuperadas = seguimiento?.recuperadas_este_mes || [];
    const hasData = pendientes.length > 0 || recuperadas.length > 0;
    const getUrg = (d: number) => d <= 2 ? { label: 'Reciente', color: '#00E676', bg: 'rgba(0,230,118,0.1)' } : d <= 5 ? { label: 'Atención', color: '#FFD93D', bg: 'rgba(255,217,61,0.1)' } : { label: 'URGENTE', color: '#FF6B6B', bg: 'rgba(255,107,107,0.1)' };

    return (
        <>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
                <EPCard title="Pendientes de Recuperar" value={pendientes.length} color="#FF6B6B" icon={<AlertTriangle size={22} color="#FF6B6B" />} />
                <EPCard title="Recuperadas este Mes" value={recuperadas.length} color="#00E676" icon={<CheckCircle size={22} color="#00E676" />} />
                {pendientes.length > 0 && <EPCard title="Promedio Días Pendiente" value={Math.round(pendientes.reduce((s, p) => s + p.dias_pendiente, 0) / pendientes.length)} subtitle="días" color="#FFD93D" icon={<Clock size={22} color="#FFD93D" />} />}
            </div>

            {!hasData ? (
                <div className="glass-card" style={{ padding: '60px 24px', textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📋</div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Sin datos de seguimiento aún</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto' }}>
                        El seguimiento se activará automáticamente cuando detectemos cambios entre un día y otro. Mañana, al hacer el segundo chequeo, aparecerán aquí las pólizas que cambiaron de estatus.
                    </p>
                </div>
            ) : (
                <>
                    {pendientes.length > 0 && (
                        <div className="glass-card" style={{ padding: '24px', borderLeft: '4px solid #FF6B6B' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>⚠️ Pólizas Pendientes de Recuperar ({pendientes.length})</h3>
                            {pendientes.sort((a, b) => b.dias_pendiente - a.dias_pendiente).map((p, i) => {
                                const u = getUrg(p.dias_pendiente);
                                return (
                                    <div key={p.poliza} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid var(--glass-border)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                                                <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{p.poliza}</span>
                                                <span style={{ padding: '2px 8px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 700, color: u.color, background: u.bg }}>{u.label}</span>
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{p.contratante}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Asesor: {p.asesor} ({p.asesor_clave})</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontWeight: 800, fontSize: '1.2rem', color: u.color }}>{p.dias_pendiente} <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>días</span></div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>desde {p.fecha_cancelacion_detectada}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    {recuperadas.length > 0 && (
                        <div className="glass-card" style={{ padding: '24px', borderLeft: '4px solid #00E676' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>✅ Recuperadas este Mes ({recuperadas.length})</h3>
                            {recuperadas.map((p, i) => (
                                <div key={p.poliza} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--glass-border)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                                    <div>
                                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{p.poliza}</div>
                                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{p.contratante} — {p.asesor}</div>
                                    </div>
                                    <span style={{ padding: '3px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, color: '#00E676', background: 'rgba(0,230,118,0.1)' }}>✅ Recuperada en {p.dias_que_tardo}d</span>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </>
    );
};

/* ========== SUB-TAB 3: HISTORIAL ========== */
const HistorialSubTab: React.FC<{ cambios: CambiosData | null; selectedDate: string; fechas: string[]; onDateChange: (f: string) => void }> = ({ cambios, selectedDate, fechas }) => {
    if (!cambios) {
        return (
            <div className="glass-card" style={{ padding: '60px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📅</div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Sin cambios registrados para esta fecha</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '500px', margin: '0 auto' }}>
                    {fechas.length <= 1
                        ? 'Este es el primer día de registro (línea base). Los cambios se registrarán a partir del segundo chequeo. Mañana podrás ver aquí la comparativa.'
                        : `No se encontraron cambios registrados para el ${selectedDate}. Selecciona otra fecha para consultar.`
                    }
                </p>
                {fechas.length <= 1 && (
                    <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(0,184,217,0.08)', border: '1px solid rgba(0,184,217,0.2)', borderRadius: '12px', display: 'inline-block' }}>
                        <span style={{ fontSize: '0.85rem', color: '#00B8D9' }}>📌 Línea base establecida: {selectedDate}</span>
                    </div>
                )}
            </div>
        );
    }

    return (
        <>
            <div className="glass-card" style={{ padding: '24px', borderLeft: '4px solid #42A5F5' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>
                    📊 Comparativa: {cambios.resumen.fecha_anterior} → {cambios.resumen.fecha_nuevo}
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
                    <EPCard title="Total Pólizas" value={cambios.resumen.total_nuevo}
                        subtitle={`${cambios.resumen.diferencia_total >= 0 ? '+' : ''}${cambios.resumen.diferencia_total} vs anterior`}
                        color={cambios.resumen.diferencia_total >= 0 ? '#00E676' : '#FF6B6B'} />
                    <EPCard title="Asesores con Cambios" value={cambios.resumen.total_asesores_con_cambios} color="#FFD93D" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                    {Object.entries(cambios.resumen.cambios_estatus_general).map(([status, info]) => {
                        if (info.diferencia === 0) return null;
                        const isGood = (status === 'En Vigor' && info.diferencia > 0) || (status === 'Anulada' && info.diferencia < 0);
                        const color = isGood ? '#00E676' : '#FF6B6B';
                        return (
                            <div key={status} style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: `1px solid ${color}33` }}>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>{status}</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 800, color }}>{info.diferencia > 0 ? '+' : ''}{info.diferencia}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{info.anterior} → {info.nuevo}</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {cambios.asesores_con_cambios.length > 0 && (
                <div className="glass-card" style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>⚡ Asesores con Cambios ({cambios.asesores_con_cambios.length})</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {cambios.asesores_con_cambios.sort((a, b) => Math.abs(b.diferencia_total) - Math.abs(a.diferencia_total)).map(a => (
                            <div key={a.clave} style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <div>
                                        <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{a.nombre}</span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '8px' }}>({a.clave})</span>
                                    </div>
                                    <span style={{ padding: '3px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, color: a.diferencia_total >= 0 ? '#00E676' : '#FF6B6B', background: a.diferencia_total >= 0 ? 'rgba(0,230,118,0.1)' : 'rgba(255,107,107,0.1)' }}>
                                        {a.diferencia_total >= 0 ? '+' : ''}{a.diferencia_total} total
                                    </span>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {Object.entries(a.cambios_estatus).map(([status, info]) => {
                                        const isGood = (status === 'En Vigor' && info.diferencia > 0) || (status === 'Anulada' && info.diferencia < 0);
                                        return (
                                            <span key={status} style={{ padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', color: isGood ? '#00E676' : '#FF6B6B', background: isGood ? 'rgba(0,230,118,0.08)' : 'rgba(255,107,107,0.08)' }}>
                                                {status}: {info.anterior}→{info.nuevo} ({info.diferencia > 0 ? '+' : ''}{info.diferencia})
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="glass-card" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle size={18} color="#00E676" />
                <span style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                    <strong>{cambios.asesores_sin_cambios.length}</strong> asesores sin cambios en esta fecha
                </span>
            </div>
        </>
    );
};

export default EstatusPolizasContent;
