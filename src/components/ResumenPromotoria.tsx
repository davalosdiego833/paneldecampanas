import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, LogOut, ArrowLeft, DollarSign, Users, TrendingUp, Activity, AlertTriangle, CheckCircle, XCircle, Search, Calendar, Shield } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import EstatusPolizasContent from './EstatusPolizas';

interface Props {
    onBack: () => void;
    onLogout: () => void;
    themeMode: 'dark' | 'light';
    toggleTheme: () => void;
    sucursalFilter?: number[];
    gerenciaName?: string;
}

type Section = 'pagado_pendiente' | 'asesores_sin_emision' | 'proactivos' | 'comparativo_vida' | 'estatus_polizas';

const fmt = (n: number | null | undefined) => {
    if (n == null || isNaN(Number(n))) return '$0';
    return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};
const fmtNum = (n: number | null | undefined) => {
    if (n == null || isNaN(Number(n))) return '0';
    return Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};
const pct = (n: number | null | undefined) => {
    if (n == null || isNaN(Number(n))) return '0%';
    return (Number(n) * 100).toFixed(1) + '%';
};

const CHART_COLORS = { green: '#00E676', red: '#FF6B6B', yellow: '#FFD93D', blue: '#42A5F5' };

/* ========== Custom Tooltip for dark/light mode ========== */
const CustomBarTooltip = ({ active, payload, label, isCurrency }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: 'var(--card-bg, #1a1a2e)', border: '1px solid var(--glass-border, #333)', borderRadius: '8px', padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
            <div style={{ color: 'var(--text-primary, #fff)', fontWeight: 700, fontSize: '0.85rem', marginBottom: '4px' }}>{label}</div>
            {payload.map((p: any, i: number) => (
                <div key={i} style={{ color: p.color || '#42A5F5', fontSize: '0.8rem' }}>{p.name || p.dataKey}: {isCurrency ? fmt(p.value) : fmtNum(p.value)}</div>
            ))}
        </div>
    );
};

/* ========== Fecha Corte Badge ========== */
const FechaCorte: React.FC<{ fecha: string }> = ({ fecha }) => {
    if (!fecha) return null;
    return (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 14px', background: 'rgba(0,122,255,0.1)', border: '1px solid rgba(0,122,255,0.25)', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 600, color: '#42A5F5' }}>
            <Calendar size={14} />
            Fecha de corte: {fecha}
        </div>
    );
};

/* ========== Search Input ========== */
const SearchInput: React.FC<{ value: string; onChange: (v: string) => void; placeholder?: string }> = ({ value, onChange, placeholder }) => (
    <div style={{ position: 'relative', maxWidth: '320px', marginBottom: '12px' }}>
        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
        <input
            type="text"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder || 'Buscar asesor...'}
            style={{ width: '100%', padding: '10px 14px 10px 36px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none', fontFamily: 'inherit' }}
        />
    </div>
);


const ResumenPromotoria: React.FC<Props> = ({ onBack, onLogout, themeMode, toggleTheme, sucursalFilter, gerenciaName }) => {
    const [section, setSection] = useState<Section>('pagado_pendiente');
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [historicalDates, setHistoricalDates] = useState<Record<string, string | null>>({
        pagado_pendiente: null,
        asesores_sin_emision: null,
        proactivos: null,
        comparativo_vida: null
    });

    useEffect(() => {
        setLoading(true);

        const fetchData = async () => {
            try {
                // First check if a snapshot exists to optimize speed
                const snapRes = await fetch('/api/admin/snapshot-status');
                const snapStatus = await snapRes.json();

                const query = JSON.stringify(historicalDates);
                const useSnapshot = snapStatus.exists && !historicalDates.pagado_pendiente && !historicalDates.asesores_sin_emision && !historicalDates.proactivos && !historicalDates.comparativo_vida;

                const res = await fetch(`/api/resumen-general?dates=${encodeURIComponent(query)}&useSnapshot=${useSnapshot}`);
                const d = await res.json();
                setData(d);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        };

        fetchData();
    }, [historicalDates]);

    const handleDateSelect = (sec: string, date: string | null) => {
        setHistoricalDates(prev => ({ ...prev, [sec]: date }));
    };

    // Helper: filter rows by sucursal
    const filterData = (rawData: any) => {
        if (!rawData || !sucursalFilter || sucursalFilter.length === 0) return rawData;

        const getSucId = (row: any) => {
            // Priority 1: Explicit ID fields used in 'asesores_sin_emision' (Suc) and 'proactivos' (SUC)
            if (row.Suc !== undefined && row.Suc !== null) return Number(row.Suc);
            if (row.SUC !== undefined && row.SUC !== null) return Number(row.SUC);
            // Priority 2: 'Sucursal' field if it contains a numeric ID (used in 'comparativo_vida' and 'pagado_pendiente')
            const s = row.Sucursal;
            if (s !== undefined && s !== null && !isNaN(Number(s)) && String(s).trim() !== '') {
                return Number(s);
            }
            return 0;
        };

        const matchSuc = (row: any) => {
            const id = getSucId(row);
            return sucursalFilter.includes(id);
        };

        // Handle different data shapes
        if (Array.isArray(rawData)) {
            return rawData.filter(matchSuc);
        }
        if (rawData.individuals) {
            const filteredIndividuals = rawData.individuals.filter(matchSuc);
            const result: any = { ...rawData, individuals: filteredIndividuals };
            if (rawData.summaryBySucursal) {
                result.summaryBySucursal = rawData.summaryBySucursal.filter(matchSuc);
            }
            // For comparativo_vida: recalculate generalSummary from filtered individuals
            if (rawData.generalSummary && filteredIndividuals.length > 0) {
                const sum = (key: string) => filteredIndividuals.reduce((s: number, r: any) => s + (Number(r[key]) || 0), 0);
                const polAnt = sum('Polizas_Pagadas_Año_Anterior');
                const polAct = sum('Polizas_Pagadas_Año_Actual');
                const primaAnt = sum('Prima_Pagada_Año_Anterior');
                const primaAct = sum('Prima_Pagada_Año_Actual');
                const recAnt = sum('Recluta_Año_Anterior');
                const recAct = sum('Recluta_Año_Actual');
                const primaRecAnt = sum('Prima_Pagada_Reclutas_Año_Anterior');
                const primaRecAct = sum('Prima_Pagada_Reclutas_Año_Actual');
                const safePct = (crec: number, ant: number) => ant !== 0 ? crec / ant : 0;
                result.generalSummary = {
                    Polizas_Pagadas_Año_Anterior: polAnt,
                    Polizas_Pagadas_Año_Actual: polAct,
                    Crec_Polizas_Pagadas: polAct - polAnt,
                    '%_Crec_Polizas_Pagadas': safePct(polAct - polAnt, polAnt),
                    Prima_Pagada_Año_Anterior: primaAnt,
                    'Prima_Pagada_Añoa_Actual': primaAct,
                    Crec_Prima_Pagada: primaAct - primaAnt,
                    '%_Crec_Prima_Pagada': safePct(primaAct - primaAnt, primaAnt),
                    Recluta_Año_Anterior: recAnt,
                    Recluta_Año_Actual: recAct,
                    Crec_Recluta: recAct - recAnt,
                    '%_Crec_Recluta': safePct(recAct - recAnt, recAnt),
                    Prima_Pagada_Reclutas_Año_Anterior: primaRecAnt,
                    Prima_Pagada_Reclutas_Año_Actual: primaRecAct,
                    Crec_Prima_Pagada_Reclutas: primaRecAct - primaRecAnt,
                    '%_Crec_Prima_Pagada_Reclutas': safePct(primaRecAct - primaRecAnt, primaRecAnt),
                };
            }
            return result;
        }
        return rawData;
    };

    const allSections: { key: Section; label: string; icon: React.ReactNode }[] = [
        { key: 'pagado_pendiente', label: 'Pagado / Pendiente', icon: <DollarSign size={18} /> },
        { key: 'asesores_sin_emision', label: 'Asesores sin Emisión', icon: <AlertTriangle size={18} /> },
        { key: 'proactivos', label: 'Proactivos', icon: <Activity size={18} /> },
        { key: 'comparativo_vida', label: 'Comparativo de Vida', icon: <TrendingUp size={18} /> },
        { key: 'estatus_polizas', label: 'Estatus Pólizas', icon: <Shield size={18} /> },
    ];

    // Hide 'Estatus Pólizas' if we are in a Gerencia view (sucursalFilter is active)
    const isGerencia = sucursalFilter && sucursalFilter.length > 0;
    const sections = allSections.filter(s => {
        if (s.key === 'estatus_polizas' && isGerencia) return false;
        return true;
    });

    const sidebarLabel = gerenciaName || 'RESUMEN PROMOTORÍA';

    const renderContent = () => {
        // Estatus Pólizas manages its own data loading, render it independently
        if (section === 'estatus_polizas') return <EstatusPolizasContent />;

        if (loading) return <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-secondary)' }}>Cargando datos...</div>;
        if (!data) return <div style={{ textAlign: 'center', padding: '80px', color: 'var(--danger-red)' }}>Error al cargar datos</div>;

        const sectionFecha = data.fechas_corte?.[section] || '';

        switch (section) {
            case 'pagado_pendiente':
                return <PagadoPendiente
                    data={filterData(data.pagado_pendiente)}
                    fechaCorte={sectionFecha}
                    selectedDate={historicalDates.pagado_pendiente}
                    onDateSelect={(d: string | null) => handleDateSelect('pagado_pendiente', d)}
                    themeMode={themeMode}
                />;
            case 'asesores_sin_emision':
                return <AsesoresSinEmision
                    data={filterData(data.asesores_sin_emision)}
                    fechaCorte={sectionFecha}
                    selectedDate={historicalDates.asesores_sin_emision}
                    onDateSelect={(d: string | null) => handleDateSelect('asesores_sin_emision', d)}
                    themeMode={themeMode}
                />;
            case 'proactivos':
                return <Proactivos
                    data={filterData(data.proactivos)}
                    fechaCorte={sectionFecha}
                    selectedDate={historicalDates.proactivos}
                    onDateSelect={(d: string | null) => handleDateSelect('proactivos', d)}
                    themeMode={themeMode}
                />;
            case 'comparativo_vida':
                return <ComparativoVida
                    data={filterData(data.comparativo_vida)}
                    fechaCorte={sectionFecha}
                    isGerencia={!!sucursalFilter && sucursalFilter.length > 0}
                    selectedDate={historicalDates.comparativo_vida}
                    onDateSelect={(d: string | null) => handleDateSelect('comparativo_vida', d)}
                    themeMode={themeMode}
                />;
        }
    };

    return (
        <div className="app-layout" data-theme={themeMode}>
            <aside className="sidebar" style={{ width: '260px' }}>
                <div style={{ padding: '0 10px 20px 10px', textAlign: 'center' }}>
                    <img src="/assets/logos/empresa/ambriz_logo.png" alt="Ambriz" style={{ maxWidth: '140px', width: '100%', filter: 'brightness(1.1)' }} />
                    <div style={{ marginTop: '12px', display: 'inline-block', padding: '4px 12px', background: 'rgba(0,122,255,0.15)', border: '1px solid rgba(0,122,255,0.3)', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 700, color: '#007AFF', letterSpacing: '0.08em' }}>
                        {sidebarLabel}
                    </div>
                </div>
                <div style={{ height: '1px', background: 'var(--glass-border)', margin: '0 20px 16px 20px' }} />
                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {sections.map(s => (
                        <button key={s.key} onClick={() => setSection(s.key)} className={`nav-item ${section === s.key ? 'active' : ''}`} style={{ fontSize: '0.85rem' }}>
                            {s.icon}
                            <span>{s.label}</span>
                        </button>
                    ))}
                </nav>
                <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '16px', marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button onClick={onBack} className="nav-item" style={{ fontSize: '0.85rem' }}>
                        <ArrowLeft size={16} className="nav-icon" /> Menú Admin
                    </button>
                    <button onClick={toggleTheme} className="nav-item" style={{ fontSize: '0.85rem', justifyContent: 'center', marginTop: '4px' }}>
                        {themeMode === 'dark' ? <Sun size={16} className="nav-icon" /> : <Moon size={16} className="nav-icon" />}
                        <span>{themeMode === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}</span>
                    </button>
                    <button onClick={onLogout} className="nav-item" style={{ color: 'var(--text-secondary)', justifyContent: 'center', fontSize: '0.85rem' }}>
                        <LogOut size={16} className="nav-icon" /> Cerrar Sesión
                    </button>
                    <div style={{ marginTop: '8px', textAlign: 'center', fontSize: '0.65rem', color: 'var(--text-secondary)', opacity: 0.5, letterSpacing: '0.05em' }}>
                        VERSION v1.3.6 — NATIVE FINALIS
                    </div>
                </div>
            </aside>
            <main className="main-content" style={{ padding: '32px 40px', overflowY: 'auto' }}>
                {renderContent()}
            </main>
        </div>
    );
};

/* ========== KPI Card ========== */
const KPICard: React.FC<{ title: string; value: string; subtitle?: string; color?: string; icon?: React.ReactNode }> = ({ title, value, subtitle, color = '#007AFF', icon }) => (
    <div className="glass-card" style={{ padding: '20px 24px', flex: '1 1 200px', minWidth: '180px', borderTop: `3px solid ${color}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>{title}</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>{value}</div>
                {subtitle && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{subtitle}</div>}
            </div>
            {icon && <div style={{ opacity: 0.5 }}>{icon}</div>}
        </div>
    </div>
);

/* ========== TABLE HELPER ========== */
const DataTable: React.FC<{ headers: string[]; rows: any[][]; highlightCol?: number }> = ({ headers, rows, highlightCol }) => (
    <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
                <tr style={{ background: 'rgba(0,122,255,0.08)' }}>
                    {headers.map((h, i) => (
                        <th key={i} style={{ padding: '12px 14px', textAlign: i === 0 ? 'left' : 'center', fontWeight: 700, color: 'var(--text-primary)', borderBottom: '2px solid var(--glass-border)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {rows.map((row, ri) => (
                    <tr key={ri} style={{ borderBottom: '1px solid var(--glass-border)', background: ri % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                        {row.map((cell, ci) => (
                            <td key={ci} style={{ padding: '10px 14px', textAlign: ci === 0 ? 'left' : 'center', color: highlightCol === ci ? (Number(cell?.toString().replace(/[^0-9.-]/g, '')) < 0 ? '#FF6B6B' : '#00E676') : 'var(--text-primary)', fontWeight: highlightCol === ci ? 700 : 400, whiteSpace: 'nowrap' }}>{cell}</td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

/* ========== Searchable Table Wrapper ========== */
const SearchableTable: React.FC<{ title: string; headers: string[]; rows: any[][]; nameCol?: number; highlightCol?: number }> = ({ title, headers, rows, nameCol = 1, highlightCol }) => {
    const [search, setSearch] = useState('');
    const filtered = search ? rows.filter(r => String(r[nameCol] || '').toLowerCase().includes(search.toLowerCase())) : rows;
    return (
        <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>{title}</h3>
            <SearchInput value={search} onChange={setSearch} />
            <DataTable headers={headers} rows={filtered} highlightCol={highlightCol} />
            {search && <div style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{filtered.length} de {rows.length} asesores</div>}
        </div>
    );
};

/* ========== SECTION 1: PAGADO / PENDIENTE ========== */
const SectionHeader: React.FC<{ label: string; color: string; icon: string }> = ({ label, color, icon }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
        <span style={{ fontSize: '1.1rem' }}>{icon}</span>
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
        <div style={{ flex: 1, height: '1px', background: color, opacity: 0.25 }} />
    </div>
);

const PagadoPendiente: React.FC<{ data: any[]; fechaCorte: string; selectedDate: string | null; onDateSelect: (d: string | null) => void; themeMode: 'dark' | 'light' }> = ({ data, fechaCorte, selectedDate, onDateSelect, themeMode }) => {
    if (!data || !data.length) return <div>No hay datos</div>;

    // Column accessors (matching exact Excel column names including typos)
    const get = (r: any, key: string) => Number(r[key]) || 0;
    const polPag = (r: any) => get(r, 'Pólizas-Pagadas');
    const riPag = (r: any) => get(r, 'Recibo_Inicial_Pagado');
    const roPag = (r: any) => get(r, 'Recibo_Ordinario_Pagado');
    const totalPag = (r: any) => get(r, 'Total _Prima_Pagada');
    const polPend = (r: any) => get(r, 'Pólizas_Pendinetes');
    const riPend = (r: any) => get(r, 'Recibo_Inicial_Pendiente');
    const roPend = (r: any) => get(r, 'Recibo_Ordinario_Pendiente');
    const totalPend = (r: any) => get(r, 'Total _Prima_Pendiente');

    // Totals
    const sumPolPag = data.reduce((s, r) => s + polPag(r), 0);
    const sumRiPag = data.reduce((s, r) => s + riPag(r), 0);
    const sumRoPag = data.reduce((s, r) => s + roPag(r), 0);
    const sumTotalPag = data.reduce((s, r) => s + totalPag(r), 0);

    const sumPolPend = data.reduce((s, r) => s + polPend(r), 0);
    const sumRiPend = data.reduce((s, r) => s + riPend(r), 0);
    const sumRoPend = data.reduce((s, r) => s + roPend(r), 0);
    const sumTotalPend = data.reduce((s, r) => s + totalPend(r), 0);

    const asesoresConPago = data.filter(r => polPag(r) !== 0 || totalPag(r) !== 0).length;
    const asesoresConPendiente = data.filter(r => polPend(r) !== 0 || totalPend(r) !== 0).length;

    // Charts
    const pieInicial = [
        { name: 'Pagado', value: sumRiPag, fill: CHART_COLORS.green },
        { name: 'Pendiente', value: sumRiPend, fill: CHART_COLORS.red },
    ];
    const pieOrdinario = [
        { name: 'Pagado', value: sumRoPag, fill: CHART_COLORS.green },
        { name: 'Pendiente', value: sumRoPend, fill: CHART_COLORS.yellow },
    ];

    // Top Pendientes by Recibo Inicial
    const topPendientes = [...data].filter(r => riPend(r) > 0).sort((a, b) => riPend(b) - riPend(a));

    // Tables
    const pendHeaders = ['#', 'Asesor', 'Suc', 'Pólizas Pendientes', 'Recibo Inicial Pendiente'];
    const pendRows = data.filter(r => polPend(r) !== 0 || riPend(r) !== 0)
        .sort((a, b) => Math.abs(riPend(b)) - Math.abs(riPend(a)))
        .map((r, i) => [i + 1, r['Nombre Asesor'], r.Sucursal, fmtNum(polPend(r)), fmt(riPend(r))]);

    const pagHeaders = ['#', 'Asesor', 'Suc', 'Pólizas Pagadas', 'Recibo Inicial Pagado'];
    const pagRows = data.filter(r => polPag(r) !== 0 || riPag(r) !== 0)
        .sort((a, b) => Math.abs(riPag(b)) - Math.abs(riPag(a)))
        .map((r, i) => [i + 1, r['Nombre Asesor'], r.Sucursal, fmtNum(polPag(r)), fmt(riPag(r))]);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>💰 Pagado / Pendiente</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Desglose de recibos iniciales, ordinarios y totales</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <FechaCorte fecha={fechaCorte} />
                </div>
            </div>

            {/* ── SECCIÓN PAGADO ── */}
            <div className="glass-card" style={{ padding: '24px', borderLeft: '4px solid #00E676' }}>
                <SectionHeader label="Pagado" color="#00E676" icon="✅" />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
                    <KPICard title="Pólizas Pagadas" value={String(sumPolPag)} subtitle={`${asesoresConPago} asesores`} color="#00E676" icon={<CheckCircle size={22} color="#00E676" />} />
                    <KPICard title="Recibo Inicial" value={fmt(sumRiPag)} color="#00E676" icon={<DollarSign size={22} color="#00E676" />} />
                    <KPICard title="Recibo Ordinario" value={fmt(sumRoPag)} color="#42A5F5" icon={<TrendingUp size={22} color="#42A5F5" />} />
                    <KPICard title="Total Prima Pagada" value={fmt(sumTotalPag)} color="#00E676" icon={<DollarSign size={22} color="#00E676" />} />
                </div>
            </div>

            {/* ── SECCIÓN PENDIENTE ── */}
            <div className="glass-card" style={{ padding: '24px', borderLeft: '4px solid #FF6B6B' }}>
                <SectionHeader label="Pendiente" color="#FF6B6B" icon="⚠️" />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
                    <KPICard title="Pólizas Pendientes" value={String(sumPolPend)} subtitle={`${asesoresConPendiente} asesores`} color="#FF6B6B" icon={<AlertTriangle size={22} color="#FF6B6B" />} />
                    <KPICard title="Recibo Inicial" value={fmt(sumRiPend)} color="#FF6B6B" icon={<DollarSign size={22} color="#FF6B6B" />} />
                    <KPICard title="Recibo Ordinario" value={fmt(sumRoPend)} color="#FFD93D" icon={<TrendingUp size={22} color="#FFD93D" />} />
                    <KPICard title="Total Prima Pendiente" value={fmt(sumTotalPend)} color="#FF6B6B" icon={<DollarSign size={22} color="#FF6B6B" />} />
                </div>
            </div>

            {/* ── GRÁFICAS ── */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {/* Pie Recibo Inicial */}
                <div className="glass-card" style={{ padding: '24px', flex: '1 1 320px' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)' }}>📊 Recibo Inicial — Pagado vs Pendiente</h3>
                    <div style={{ height: '260px' }}>
                        <ResponsiveContainer>
                            <PieChart><Pie data={pieInicial} dataKey="value" cx="50%" cy="50%" outerRadius={95} strokeWidth={2}>{pieInicial.map((e, i) => <Cell key={i} fill={e.fill} />)}</Pie><Tooltip formatter={(v: any) => fmt(v)} /><Legend /></PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                {/* Pie Recibo Ordinario */}
                <div className="glass-card" style={{ padding: '24px', flex: '1 1 320px' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)' }}>📊 Recibo Ordinario — Pagado vs Pendiente</h3>
                    <div style={{ height: '260px' }}>
                        <ResponsiveContainer>
                            <PieChart><Pie data={pieOrdinario} dataKey="value" cx="50%" cy="50%" outerRadius={95} strokeWidth={2}>{pieOrdinario.map((e, i) => <Cell key={i} fill={e.fill} />)}</Pie><Tooltip formatter={(v: any) => fmt(v)} /><Legend /></PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* ── TOP 5 PENDIENTES (Recibo Inicial) ── */}
            {topPendientes.length > 0 && (
                <div className="glass-card" style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>🔴 Top 5 — Mayor Recibo Inicial Pendiente</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                        {topPendientes.slice(0, 5).map((r: any, i: number) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--glass-border)', fontSize: '0.9rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,107,107,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, color: '#FF6B6B' }}>{i + 1}</span>
                                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{r['Nombre Asesor']}</span>
                                </div>
                                <span style={{ fontWeight: 700, color: '#FF6B6B', fontSize: '1rem' }}>{fmt(riPend(r))}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── TABLA: Asesores con Pólizas Pendientes ── */}
            {pendRows.length > 0 && <SearchableTable title={`⚠️ Asesores con Pólizas Pendientes (${pendRows.length})`} headers={pendHeaders} rows={pendRows} />}

            {/* ── TABLA: Asesores con Pólizas Pagadas ── */}
            {pagRows.length > 0 && <SearchableTable title={`✅ Asesores con Pólizas Pagadas (${pagRows.length})`} headers={pagHeaders} rows={pagRows} />}

            {/* ── TABLA: Asesores sin Actividad ── */}
            {(() => {
                const sinActRows = data.filter(r => polPag(r) <= 0 && polPend(r) <= 0 && riPag(r) <= 0 && riPend(r) <= 0)
                    .map((r, i) => [i + 1, r['Nombre Asesor'], r.Sucursal]);
                return sinActRows.length > 0 ? (
                    <SearchableTable title={`⚪ Asesores sin Actividad (${sinActRows.length})`} headers={['#', 'Asesor', 'Suc']} rows={sinActRows} />
                ) : null;
            })()}
        </motion.div>
    );
};

/* ========== SECTION 2: ASESORES SIN EMISIÓN ========== */
const AsesoresSinEmision: React.FC<{ data: any; fechaCorte: string; selectedDate: string | null; onDateSelect: (d: string | null) => void; themeMode: 'dark' | 'light' }> = ({ data, fechaCorte, selectedDate, onDateSelect, themeMode }) => {
    if (!data) return <div>No hay datos</div>;
    const individuals = data.individuals || [];
    const summaryBySucursal = data.summaryBySucursal || [];

    const totalAgentes = individuals.length;
    const sinEmisionVida = individuals.filter((r: any) => r.Sin_Emisión_Vida === 'i').length;
    const sinEmisionGMM = individuals.filter((r: any) => r.Sin_Emisión_GMM === 'i').length;
    const tresMesesVida = individuals.filter((r: any) => r['3_Meses_Sin_Emisión_Vida'] === 'i').length;
    const tresMesesGMM = individuals.filter((r: any) => r['3_Meses_Sin_Emisión_GMM'] === 'i').length;
    const totalPrimaPagVida = individuals.reduce((s: number, r: any) => s + (Number(r.Prima_Pagada_Vida) || 0), 0);
    const totalPrimaPagGMM = individuals.reduce((s: number, r: any) => s + (Number(r.Prima_Pagada_GMM) || 0), 0);

    const pieVida = [{ name: 'Sin Emisión', value: sinEmisionVida, fill: '#FF6B6B' }, { name: 'Con Emisión', value: totalAgentes - sinEmisionVida, fill: '#00E676' }];
    const pieGMM = [{ name: 'Sin Emisión', value: sinEmisionGMM, fill: '#FF6B6B' }, { name: 'Con Emisión', value: totalAgentes - sinEmisionGMM, fill: '#00E676' }];

    // Grouping for categorized tables based on PAID POLICIES (> 0 or == 0)
    const conPolizasVida = individuals.filter((r: any) => (Number(r.Pagado_Vida) || 0) > 0);
    const sinPolizasVida = individuals.filter((r: any) => (Number(r.Pagado_Vida) || 0) <= 0);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>⚠️ Asesores sin Emisión</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Estado de emisión y producción pagada por asesor</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <FechaCorte fecha={fechaCorte} />
                </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                <KPICard title="Total Asesores" value={String(totalAgentes)} color="#007AFF" icon={<Users size={24} color="#007AFF" />} />
                <KPICard title="Sin Emisión Vida" value={`${sinEmisionVida} / ${totalAgentes}`} subtitle={`${((sinEmisionVida / totalAgentes) * 100).toFixed(0)}% del total`} color="#FF6B6B" icon={<XCircle size={24} color="#FF6B6B" />} />
                <KPICard title="Sin Emisión GMM" value={`${sinEmisionGMM} / ${totalAgentes}`} subtitle={`${((sinEmisionGMM / totalAgentes) * 100).toFixed(0)}% del total`} color="#FF6B6B" icon={<XCircle size={24} color="#FF6B6B" />} />
                <KPICard title="3+ Meses Sin Vida" value={String(tresMesesVida)} color="#FFD93D" icon={<AlertTriangle size={24} color="#FFD93D" />} />
                <KPICard title="3+ Meses Sin GMM" value={String(tresMesesGMM)} color="#FFD93D" icon={<AlertTriangle size={24} color="#FFD93D" />} />
                <KPICard title="Prima Pagada Vida" value={fmt(totalPrimaPagVida)} color="#00E676" />
                <KPICard title="Prima Pagada GMM" value={fmt(totalPrimaPagGMM)} color="#42A5F5" />
            </div>

            {summaryBySucursal.length > 0 && (
                <div className="glass-card" style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>📊 Resumen por Sucursal</h3>
                    <DataTable headers={['Nombre', 'Sucursal', 'Agentes', 'Em. Vida', '% Em. Vida', 'Em. GMM', '% Em. GMM', 'Pag. Vida', '% Pag. Vida', 'Pag. GMM', '% Pag. GMM', 'Prima Vida', 'Prima GMM']}
                        rows={summaryBySucursal.map((r: any) => {
                            const id = Number(r.Suc);
                            let managerName = r.Sucursal; // fallback
                            if (id === 2043 || id === 2511) managerName = 'Alejandra';
                            else if (id === 2692) managerName = 'Eduardo';
                            else if (id === 2856) managerName = 'Karen';

                            return [managerName, r.Suc, r.Agentes, r.Asesores_con_Emisión_Vida, pct(r['%_Asesores_con_Emisión_Vida']), r.Asesores_con_Emisión_GMM, pct(r['%_Asesores_con_Emisión_GMM']), r.Asesores_con_pol_Pagada_Vida, pct(r['%_Asesores_con_pol_Pagada_Vida']), r.Asesores_con_pol_Pagada_GMM, pct(r['%_Asesores_con_pol_Pagada_GMM']), fmt(r.Prima_Pagada_Vida), fmt(r.Prima_Pagada_GMM)];
                        })} />
                </div>
            )}

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div className="glass-card" style={{ padding: '24px', flex: '1 1 300px' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)' }}>Emisión Vida</h3>
                    <div style={{ height: '220px' }}><ResponsiveContainer><PieChart><Pie data={pieVida} dataKey="value" cx="50%" cy="50%" outerRadius={80} strokeWidth={2}>{pieVida.map((e, i) => <Cell key={i} fill={e.fill} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></div>
                </div>
                <div className="glass-card" style={{ padding: '24px', flex: '1 1 300px' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)' }}>Emisión GMM</h3>
                    <div style={{ height: '220px' }}><ResponsiveContainer><PieChart><Pie data={pieGMM} dataKey="value" cx="50%" cy="50%" outerRadius={80} strokeWidth={2}>{pieGMM.map((e, i) => <Cell key={i} fill={e.fill} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></div>
                </div>
            </div>

            {/* Categorized Advisor Tables */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {conPolizasVida.length > 0 && (
                    <SearchableTable
                        title={`✅ Asesores con Pólizas Pagadas Vida (${conPolizasVida.length})`}
                        headers={['#', 'Asesor', 'Suc', 'Emitido Vida', 'Pólizas Pagadas', 'Prima Pagada Vida']}
                        rows={conPolizasVida.map((r: any, i: number) => [i + 1, r.Asesor, r.Suc, fmtNum(r.Emitido_Vida), fmtNum(r.Pagado_Vida), fmt(r.Prima_Pagada_Vida)])}
                    />
                )}

                {sinPolizasVida.length > 0 && (
                    <SearchableTable
                        title={`⚪ Asesores sin Pólizas Pagadas Vida (${sinPolizasVida.length})`}
                        headers={['#', 'Asesor', 'Suc', 'Prima Pagada Vida', 'Estatus']}
                        rows={sinPolizasVida.map((r: any, i: number) => [
                            i + 1,
                            r.Asesor,
                            r.Suc,
                            fmt(r.Prima_Pagada_Vida),
                            r['3_Meses_Sin_Emisión_Vida'] === 'i' ? '🚨 Crítico (3 meses+)' : (Number(r.Prima_Pagada_Vida) > 0 ? '💰 Con Prima (Sin Póliza)' : '❌ Sin Actividad')
                        ])}
                    />
                )}
            </div>
        </motion.div>
    );
};

/* ========== SECTION 3: PROACTIVOS ========== */
const Proactivos: React.FC<{ data: any[]; fechaCorte: string; selectedDate: string | null; onDateSelect: (d: string | null) => void; themeMode: 'dark' | 'light' }> = ({ data, fechaCorte, selectedDate, onDateSelect, themeMode }) => {
    if (!data || !data.length) return <div>No hay datos</div>;

    const proactivosMes = data.filter((r: any) => r.Proactivo_al_mes === 'p').length;
    const noProactivosMes = data.filter((r: any) => r.Proactivo_al_mes === 'i').length;
    const proactivosDic = data.filter((r: any) => r.Proactivo_a_Dic === 'p').length;

    const chartData = [{ name: 'Proactivos', value: proactivosMes, fill: '#00E676' }, { name: 'No Proactivos', value: noProactivosMes, fill: '#FF6B6B' }];
    const sortedData = [...data].sort((a: any, b: any) => (Number(b.Polizas_Acumuladas_Total) || 0) - (Number(a.Polizas_Acumuladas_Total) || 0));
    const barData = sortedData.filter((r: any) => Number(r.Polizas_Acumuladas_Total) > 0).map((r: any) => ({
        name: (r.ASESOR || '').split(' ').slice(0, 2).join(' '),
        fullName: r.ASESOR || '',
        polizas: Number(r.Polizas_Acumuladas_Total) || 0,
    }));

    const headers = ['#', 'Asesor', 'Suc', 'Acum. Ant.', 'Del Mes', 'Acum. Total', 'Proactivo Mes', 'Faltantes', 'Proactivo Dic', 'Falt. Dic'];
    const rows = sortedData.map((r: any, i: number) => [
        i + 1, r.ASESOR, r.SUC, fmtNum(r['Polizas_Acumuladas_Mes_Ant.']), fmtNum(r.Polizas_Del_mes), fmtNum(r.Polizas_Acumuladas_Total),
        r.Proactivo_al_mes === 'p' ? '✅ Sí' : '❌ No', fmtNum(r.Pólizas_Faltantes), r.Proactivo_a_Dic === 'p' ? '✅ Sí' : '❌ No', fmtNum(r.Pólizas_Faltantes_Para_Dic),
    ]);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>📊 Proactivos</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Cumplimiento de mínimos de actividad por asesor</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <FechaCorte fecha={fechaCorte} />
                </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                <KPICard title="Total Asesores" value={String(data.length)} color="#007AFF" icon={<Users size={24} color="#007AFF" />} />
                <KPICard title="Proactivos (Mes)" value={String(proactivosMes)} subtitle={`${((proactivosMes / data.length) * 100).toFixed(0)}% del total`} color="#00E676" icon={<CheckCircle size={24} color="#00E676" />} />
                <KPICard title="No Proactivos (Mes)" value={String(noProactivosMes)} subtitle={`${((noProactivosMes / data.length) * 100).toFixed(0)}% del total`} color="#FF6B6B" icon={<XCircle size={24} color="#FF6B6B" />} />
                <KPICard title="Proactivos a Dic" value={String(proactivosDic)} color="#FFD93D" />
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div className="glass-card" style={{ padding: '24px', flex: '1 1 280px' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)' }}>Estado Proactivo del Mes</h3>
                    <div style={{ height: '240px' }}><ResponsiveContainer><PieChart><Pie data={chartData} dataKey="value" cx="50%" cy="50%" outerRadius={90} strokeWidth={2}>{chartData.map((e, i) => <Cell key={i} fill={e.fill} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></div>
                </div>
                {barData.length > 0 && (
                    <div className="glass-card" style={{ padding: '24px', flex: '2 1 400px' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)' }}>Pólizas Acumuladas</h3>
                        <div style={{ height: '240px' }}>
                            <ResponsiveContainer>
                                <BarChart data={barData}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
                                    <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                                    <Tooltip content={<CustomBarTooltip />} />
                                    <Bar dataKey="polizas" name="Pólizas" fill="#42A5F5" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </div>

            <SearchableTable title="📋 Detalle Completo" headers={headers} rows={rows} />
        </motion.div>
    );
};

/* ========== SECTION 4: COMPARATIVO DE VIDA ========== */
const ComparativoVida: React.FC<{ data: any; fechaCorte: string; isGerencia?: boolean; selectedDate: string | null; onDateSelect: (d: string | null) => void; themeMode: 'dark' | 'light' }> = ({ data, fechaCorte, isGerencia, selectedDate, onDateSelect, themeMode }) => {
    if (!data) return <div>No hay datos</div>;
    const individuals = data.individuals || [];
    const summary = data.generalSummary;

    // Summary helper component
    const SummaryItem: React.FC<{ label: string; value: string; color?: string }> = ({ label, value, color }) => (
        <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>{label}</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: color || 'var(--text-primary)' }}>{value}</div>
        </div>
    );

    // Get stats from summary or calculate from individuals
    const s = summary || {};
    const polAnt = Number(s.Polizas_Pagadas_Año_Anterior ?? individuals.reduce((sum: number, r: any) => sum + (Number(r.Polizas_Pagadas_Año_Anterior) || 0), 0));
    const polAct = Number(s.Polizas_Pagadas_Año_Actual ?? individuals.reduce((sum: number, r: any) => sum + (Number(r.Polizas_Pagadas_Año_Actual) || 0), 0));
    const primaAnt = Number(s.Prima_Pagada_Año_Anterior ?? individuals.reduce((sum: number, r: any) => sum + (Number(r.Prima_Pagada_Año_Anterior) || 0), 0));
    const primaAct = Number(s.Prima_Pagada_Añoa_Actual ?? s.Prima_Pagada_Año_Actual ?? individuals.reduce((sum: number, r: any) => sum + (Number(r.Prima_Pagada_Año_Actual) || 0), 0));

    const recAnt = Number(s.Recluta_Año_Anterior || 0);
    const recAct = Number(s.Recluta_Año_Actual || 0);
    const primaRecAnt = Number(s.Prima_Pagada_Reclutas_Año_Anterior || 0);
    const primaRecAct = Number(s.Prima_Pagada_Reclutas_Año_Actual || 0);

    const crecPol = polAct - polAnt;
    const crecPrima = primaAct - primaAnt;
    const pctCrecPol = polAnt > 0 ? ((crecPol / polAnt) * 100).toFixed(1) : '0';
    const pctCrecPrima = primaAnt > 0 ? ((crecPrima / primaAnt) * 100).toFixed(1) : '0';

    const enhancedIndividuals = individuals.map((r: any) => {
        const primAnt = Number(r.Prima_Pagada_Año_Anterior || 0);
        const primAct = Number(r.Prima_Pagada_Año_Actual || r.Prima_Pagada_Añoa_Actual || 0);
        const polAntLocal = Number(r.Polizas_Pagadas_Año_Anterior || 0);
        const polActLocal = Number(r.Polizas_Pagadas_Año_Actual || 0);
        
        // Use pre-calculated server values if available, otherwise compute locally
        const crecPrima = r.Crec_Prima_Pagada ?? (primAct - primAnt);
        const crecPol = r.Crec_Polizas_Pagadas ?? (polActLocal - polAntLocal);
        const pctPrima = r['%_Crec_Prima_Pagada'] ?? (primAnt !== 0 ? (crecPrima / primAnt) : 0);
        const pctPol = r['%_Crec_Polizas_Pagadas'] ?? (polAntLocal !== 0 ? (crecPol / polAntLocal) : 0);

        return {
            ...r,
            Crec_Prima_Pagada: crecPrima,
            Crec_Polizas_Pagadas: crecPol,
            '%_Crec_Prima_Pagada': pctPrima,
            '%_Crec_Polizas_Pagadas': pctPol
        };
    });

    const crecientes = enhancedIndividuals.filter((r: any) => Number(r.Crec_Prima_Pagada) > 0).length;
    const decrecientes = enhancedIndividuals.filter((r: any) => Number(r.Crec_Prima_Pagada) < 0).length;
    const sinCambio = enhancedIndividuals.filter((r: any) => Number(r.Polizas_Pagadas_Año_Anterior) > 0 && Number(r.Crec_Prima_Pagada) === 0).length;
    const trendPie = [{ name: 'Creciendo', value: crecientes, fill: '#00E676' }, { name: 'Decreciendo', value: decrecientes, fill: '#FF6B6B' }, { name: 'Sin cambio', value: sinCambio, fill: '#9E9E9E' }];

    const sorted = [...enhancedIndividuals].sort((a: any, b: any) => (Number(b.Crec_Prima_Pagada) || 0) - (Number(a.Crec_Prima_Pagada) || 0));
    const headers = ['#', 'Asesor', 'Suc', 'Pól. Anterior', 'Pól. Actual', 'Crec. Pól.', '% Crec. Pól.', 'Prima Anterior', 'Prima Actual', 'Crec. Prima', '% Crec. Prima'];
    const rows = sorted.map((r: any, i: number) => [
        i + 1, r['Nombre del Asesor'] || r.Asesor, r.Sucursal, fmtNum(r.Polizas_Pagadas_Año_Anterior), fmtNum(r.Polizas_Pagadas_Año_Actual), fmtNum(r.Crec_Polizas_Pagadas), pct(r['%_Crec_Polizas_Pagadas']),
        fmt(r.Prima_Pagada_Año_Anterior), fmt(r.Prima_Pagada_Año_Actual || r.Prima_Pagada_Añoa_Actual), fmt(r.Crec_Prima_Pagada), pct(r['%_Crec_Prima_Pagada']),
    ]);

    // Chart helpers
    const maxPrima = Math.max(primaAnt, primaAct, 1);
    const yMaxPri = Math.ceil(maxPrima * 1.2);
    const fmtYAxis = (v: number) => {
        if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
        if (v >= 1000) return `$${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k`;
        return `$${v.toFixed(0)}`;
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>📈 Comparativo de Vida</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Año anterior vs. año actual — Pólizas y prima pagada</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <FechaCorte fecha={fechaCorte} />
                </div>
            </div>

            {/* Top Cards */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                <KPICard title="Pólizas Año Anterior" value={String(polAnt)} color="#9E9E9E" />
                <KPICard title="Pólizas Año Actual" value={String(polAct)} subtitle={`${crecPol >= 0 ? '+' : ''}${crecPol} (${pctCrecPol}%)`} color={crecPol >= 0 ? '#00E676' : '#FF6B6B'} />
                <KPICard title="Prima Año Anterior" value={fmt(primaAnt)} color="#9E9E9E" />
                <KPICard title="Prima Año Actual" value={fmt(primaAct)} subtitle={`${crecPrima >= 0 ? '+' : ''}${fmt(crecPrima)} (${pctCrecPrima}%)`} color={crecPrima >= 0 ? '#00E676' : '#FF6B6B'} />
                {recAnt > 0 && (
                    <>
                        <KPICard title="Reclutas" value={`${recAct} vs ${recAnt}`} subtitle={`Crec: ${recAct - recAnt}`} color="#42A5F5" />
                        <KPICard title="Prima Reclutas" value={fmt(primaRecAct)} subtitle={`Ant: ${fmt(primaRecAnt)}`} color="#007AFF" />
                    </>
                )}
            </div>

            {/* Charts Section */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div className="glass-card" style={{ padding: '24px', flex: '1 1 360px' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)' }}>💰 Comparativo Prima Pagada</h3>
                    <div style={{ height: '260px' }}>
                        <ResponsiveContainer>
                            <BarChart data={[{ name: 'Anterior', valor: primaAnt }, { name: 'Actual', valor: primaAct }]}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                                <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                                <YAxis domain={[0, yMaxPri]} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} tickFormatter={fmtYAxis} />
                                <Tooltip content={<CustomBarTooltip isCurrency />} />
                                <Bar dataKey="valor" name="Prima Pagada" fill="#FFD93D" radius={[4, 4, 0, 0]} />
                                <Legend />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="glass-card" style={{ padding: '24px', flex: '1 1 360px' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)' }}>📋 Comparativo Pólizas Pagadas</h3>
                    <div style={{ height: '260px' }}>
                        <ResponsiveContainer>
                            <BarChart data={[{ name: 'Anterior', valor: polAnt }, { name: 'Actual', valor: polAct }]}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                                <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                                <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} allowDecimals={false} />
                                <Tooltip content={<CustomBarTooltip />} />
                                <Bar dataKey="valor" name="Pólizas" fill="#42A5F5" radius={[4, 4, 0, 0]} />
                                <Legend />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="glass-card" style={{ padding: '24px', flex: '1 1 280px' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)' }}>Tendencia de Asesores</h3>
                    <div style={{ height: '260px' }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie data={trendPie} dataKey="value" cx="50%" cy="50%" outerRadius={80} strokeWidth={2}>
                                    {trendPie.map((e, i) => <Cell key={i} fill={e.fill} />)}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Full Summary Table (Only if generalSummary exists) */}
            {summary && (
                <div className="glass-card" style={{ padding: '28px', borderLeft: '4px solid #007AFF' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px', color: 'var(--text-primary)' }}>
                        📊 {isGerencia ? 'Resumen General de la Gerencia' : 'Resumen General de la Promotoría'}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#42A5F5', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>📋 Pólizas Pagadas</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                                <SummaryItem label="Año Anterior" value={fmtNum(summary.Polizas_Pagadas_Año_Anterior)} />
                                <SummaryItem label="Año Actual" value={fmtNum(summary.Polizas_Pagadas_Año_Actual)} />
                                <SummaryItem label="Crecimiento" value={`${fmtNum(summary.Crec_Polizas_Pagadas)} (${pct(summary['%_Crec_Polizas_Pagadas'])})`} color={Number(summary.Crec_Polizas_Pagadas) >= 0 ? '#00E676' : '#FF6B6B'} />
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#FFD93D', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>💰 Prima Pagada</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                                <SummaryItem label="Año Anterior" value={fmt(summary.Prima_Pagada_Año_Anterior)} />
                                <SummaryItem label="Año Actual" value={fmt(summary.Prima_Pagada_Añoa_Actual || summary.Prima_Pagada_Año_Actual)} />
                                <SummaryItem label="Crecimiento" value={`${fmt(summary.Crec_Prima_Pagada)} (${pct(summary['%_Crec_Prima_Pagada'])})`} color={Number(summary.Crec_Prima_Pagada) >= 0 ? '#00E676' : '#FF6B6B'} />
                            </div>
                        </div>
                        {recAnt > 0 && !isGerencia && (
                            <>
                                <div>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#AB47BC', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>👥 Reclutas</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                                        <SummaryItem label="Año Anterior" value={fmtNum(summary.Recluta_Año_Anterior)} />
                                        <SummaryItem label="Año Actual" value={fmtNum(summary.Recluta_Año_Actual)} />
                                        <SummaryItem label="Crecimiento" value={`${fmtNum(summary.Crec_Recluta)} (${pct(summary['%_Crec_Recluta'])})`} color={Number(summary.Crec_Recluta) >= 0 ? '#00E676' : '#FF6B6B'} />
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#00B8D9', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>💵 Prima Pagada de Reclutas</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                                        <SummaryItem label="Año Anterior" value={fmt(summary.Prima_Pagada_Reclutas_Año_Anterior)} />
                                        <SummaryItem label="Año Actual" value={fmt(summary.Prima_Pagada_Reclutas_Año_Actual)} />
                                        <SummaryItem label="Crecimiento" value={`${fmt(summary.Crec_Prima_Pagada_Reclutas)} (${pct(summary['%_Crec_Prima_Pagada_Reclutas'])})`} color={Number(summary.Crec_Prima_Pagada_Reclutas) >= 0 ? '#00E676' : '#FF6B6B'} />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Detail Table */}
            <SearchableTable
                title="📋 Detalle Comparativo por Asesor"
                headers={headers}
                rows={rows}
                highlightCol={10}
            />
        </motion.div>
    );
};

export default ResumenPromotoria;
