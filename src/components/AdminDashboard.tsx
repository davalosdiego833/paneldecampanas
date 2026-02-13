import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Home, BarChart3, Users, LogOut, ChevronRight, TrendingUp, TrendingDown, Target, AlertTriangle, Trophy, Award, Star, Shield, Sun, Moon } from 'lucide-react';

interface Props {
    onLogout: () => void;
    onBack: () => void;
    themeMode: 'dark' | 'light';
    toggleTheme: () => void;
}

type AdminView = 'resumen' | 'detalle';

interface CampaignData {
    [key: string]: any[];
}

const formatCurrency = (val: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val);

const CAMPAIGN_LABELS: Record<string, string> = {
    mdrt: 'MDRT 2026',
    camino_cumbre: 'Camino a la Cumbre',
    convenciones: 'Convenciones',
    graduacion: 'Graduación',
    legion_centurion: 'Legión Centurión',
};

const CAMPAIGN_ICONS: Record<string, string> = {
    mdrt: '🏆',
    camino_cumbre: '🏔️',
    convenciones: '✈️',
    graduacion: '🎓',
    legion_centurion: '🛡️',
};

const CAMPAIGN_COLORS: Record<string, string> = {
    mdrt: '#D4AF37',
    camino_cumbre: '#00E676',
    convenciones: '#007AFF',
    graduacion: '#FF6B35',
    legion_centurion: '#9C27B0',
};

// Classify advisors by status per campaign with enriched detail lines
const classifyAdvisors = (campaign: string, data: any[]) => {
    const ganando: any[] = [];
    const cerca: any[] = [];
    const lejos: any[] = [];

    const META_MEMBER = 1810400;
    const META_COT = 5431200;
    const META_TOT = 10862400;

    // Helper: get MDRT category
    const getMdrtCategory = (pa: number) => {
        if (pa >= META_TOT) return { cat: 'TOT', next: null, faltanteNext: 0 };
        if (pa >= META_COT) return { cat: 'COT', next: 'TOT', faltanteNext: META_TOT - pa };
        if (pa >= META_MEMBER) return { cat: 'Miembro', next: 'COT', faltanteNext: META_COT - pa };
        return { cat: null, next: 'Miembro', faltanteNext: META_MEMBER - pa };
    };

    // Helper: get Convenciones diamond (faltante = créditos del último lugar - créditos del asesor)
    // Créditos del asesor = Comision_Vida + RDA (igual que en el dashboard individual)
    const getDiamante = (lugar: number, creditosAsesor: number, row: any) => {
        const f28 = Math.max(0, Number(row.Lugar_28 || 0) - creditosAsesor);
        const f108 = Math.max(0, Number(row.Lugar_108 || 0) - creditosAsesor);
        const f228 = Math.max(0, Number(row.Lugar_228 || 0) - creditosAsesor);
        const f480 = Math.max(0, Number(row.Lugar_480 || 0) - creditosAsesor);
        if (lugar <= 28) return { diamante: '4 Diamantes', next: null, faltanteNext: 0 };
        if (lugar <= 108) return { diamante: '3 Diamantes', next: '4 Diamantes', faltanteNext: f28 };
        if (lugar <= 228) return { diamante: '2 Diamantes', next: '3 Diamantes', faltanteNext: f108 };
        if (lugar <= 480) return { diamante: '1 Diamante', next: '2 Diamantes', faltanteNext: f228 };
        return { diamante: null, next: '1 Diamante', faltanteNext: f480 };
    };

    // Helper: get Legión Centurión level (metas fijas)
    const LC_BRONCE = 48;
    const LC_PLATA = 72;
    const LC_ORO = 90;
    const LC_PLATINO = 120;
    const getLegionLevel = (polizas: number) => {
        if (polizas >= LC_PLATINO) return { nivel: 'Platino', next: null, faltanteNext: 0 };
        if (polizas >= LC_ORO) return { nivel: 'Oro', next: 'Platino', faltanteNext: LC_PLATINO - polizas };
        if (polizas >= LC_PLATA) return { nivel: 'Plata', next: 'Oro', faltanteNext: LC_ORO - polizas };
        if (polizas >= LC_BRONCE) return { nivel: 'Bronce', next: 'Plata', faltanteNext: LC_PLATA - polizas };
        return { nivel: null, next: 'Bronce', faltanteNext: LC_BRONCE - polizas };
    };

    data.forEach(row => {
        const name = row.Asesor || 'Desconocido';

        if (campaign === 'mdrt') {
            const pa = Number(row.PA_Acumulada || 0);
            const pct = (pa / META_MEMBER) * 100;
            const { cat, next, faltanteNext } = getMdrtCategory(pa);

            const details: string[] = [];
            if (pct >= 100) {
                // En meta: ya alcanzó Member o más
                details.push(`🏅 ${cat}`);
                details.push(`PA: ${formatCurrency(pa)}`);
                if (next) details.push(`Faltante ${next}: ${formatCurrency(faltanteNext)}`);
                else details.push('✨ Máximo nivel alcanzado');
                ganando.push({ name, value: pa, pct, details });
            } else if (pct >= 60) {
                // Cerca de meta: entre 60% y 99%
                details.push(`PA: ${formatCurrency(pa)}`);
                details.push(`Faltante Miembro: ${formatCurrency(META_MEMBER - pa)}`);
                cerca.push({ name, value: pa, pct, details });
            } else {
                // Por debajo: menos del 60%
                details.push(`PA: ${formatCurrency(pa)}`);
                details.push(`Faltante Miembro: ${formatCurrency(META_MEMBER - pa)}`);
                lejos.push({ name, value: pa, pct, details });
            }
        }

        else if (campaign === 'camino_cumbre') {
            const status = String(row.Estatus_meta || '').toUpperCase();
            const polizas = Number(row.Polizas_Totales || 0);
            const mes = Math.floor(Number(row.Mes_Asesor || 1));
            const metaAcum = mes * 4;
            const faltanteMeta = Math.max(0, metaAcum - polizas);

            const details: string[] = [];
            if (faltanteMeta <= 0) {
                // En meta: cumple o supera el promedio de 4 pólizas/mes
                details.push(`Mes ${mes} · ${polizas} pólizas`);
                details.push(status);
                ganando.push({ name, value: polizas, details, status });
            } else if (faltanteMeta <= 5) {
                // Cerca de meta: le faltan 5 o menos pólizas
                details.push(`Mes ${mes} · ${polizas} pólizas`);
                details.push(`Faltan ${faltanteMeta.toFixed(1)} pólizas para meta`);
                cerca.push({ name, value: polizas, details, status });
            } else {
                // Por debajo: le faltan más de 5
                details.push(`Mes ${mes} · ${polizas} pólizas`);
                details.push(`Faltan ${faltanteMeta.toFixed(1)} pólizas para meta`);
                lejos.push({ name, value: polizas, details, status });
            }
        }

        else if (campaign === 'convenciones') {
            const lugar = Number(row.Lugar || 9999);
            // Créditos del asesor = Comision_Vida + RDA (igual que en el dashboard individual)
            const comisionVida = Number(row.Comision_Vida || 0);
            const rda = Number(row.RDA || 0);
            const creditos = comisionVida + rda;
            const { diamante, next, faltanteNext } = getDiamante(lugar, creditos, row);

            const details: string[] = [];
            if (lugar <= 480) {
                // En meta: dentro del rango de diamantes
                details.push(`Lugar ${lugar} · ${diamante}`);
                details.push(`Créditos: ${formatCurrency(creditos)}`);
                if (next) details.push(`Faltante ${next}: ${formatCurrency(faltanteNext)}`);
                else details.push('✨ Máximo nivel');
                ganando.push({ name, value: creditos, details, lugar });
            } else if (faltanteNext <= 100000) {
                // Cerca de meta: le faltan $100k o menos para 1 Diamante
                details.push(`Lugar ${lugar}`);
                details.push(`Créditos: ${formatCurrency(creditos)}`);
                details.push(`Faltante 1 Diamante: ${formatCurrency(faltanteNext)}`);
                cerca.push({ name, value: creditos, details, lugar, faltante: faltanteNext });
            } else {
                // Por debajo: le faltan más de $100k
                details.push(`Lugar ${lugar}`);
                details.push(`Créditos: ${formatCurrency(creditos)}`);
                details.push(`Faltante 1 Diamante: ${formatCurrency(faltanteNext)}`);
                lejos.push({ name, value: creditos, details, lugar, faltante: faltanteNext });
            }
        }

        else if (campaign === 'graduacion') {
            const polizas = Number(row.Polizas_Totales || 0);
            const mes = Math.floor(Number(row.Mes_Asesor || 1));
            const metaGrad = mes * 3; // promedio mínimo 3 pólizas/mes
            const faltanteMeta = Math.max(0, metaGrad - polizas);
            const faltanteNormal = Math.max(0, 36 - polizas);
            const faltanteHonores = Math.max(0, 48 - polizas);

            const details: string[] = [
                `Mes ${mes} · ${polizas} pólizas`,
                `Normal: faltan ${faltanteNormal.toFixed(1)} · Honores: faltan ${faltanteHonores.toFixed(1)}`,
            ];

            if (faltanteMeta <= 0) {
                // En meta: cumple o supera promedio de 3 pólizas/mes
                ganando.push({ name, value: polizas, details });
            } else if (faltanteMeta <= 5) {
                // Cerca de meta: le faltan 5 o menos para el promedio
                cerca.push({ name, value: polizas, details });
            } else {
                // Por debajo: le faltan más de 5
                lejos.push({ name, value: polizas, details });
            }
        }

        else if (campaign === 'legion_centurion') {
            const polizas = Number(row.Total_Polizas || 0);
            const mes = Number(row.Mes_Actual || 1);
            const metaLC = mes * 4; // promedio mínimo 4 pólizas/mes
            const faltanteMeta = Math.max(0, metaLC - polizas);
            const { nivel, next, faltanteNext } = getLegionLevel(polizas);
            const faltanteBronce = Math.max(0, LC_BRONCE - polizas);

            const details: string[] = [];
            if (faltanteMeta <= 0) {
                // En meta: promedio ≥ 4 pólizas/mes
                details.push(`${polizas} pólizas · ${nivel || 'En camino'}`);
                if (next) details.push(`Faltante ${next}: ${faltanteNext} pólizas`);
                else details.push('✨ Máximo nivel alcanzado');
                ganando.push({ name, value: polizas, details, nivel });
            } else if (faltanteMeta <= 5) {
                // Cerca de meta: le faltan 5 o menos para el promedio
                details.push(`${polizas} pólizas`);
                details.push(`Faltante Bronce: ${faltanteBronce} pólizas`);
                cerca.push({ name, value: polizas, details, faltante: faltanteBronce });
            } else {
                // Por debajo: le faltan más de 5
                details.push(`${polizas} pólizas`);
                details.push(`Faltante Bronce: ${faltanteBronce} pólizas`);
                lejos.push({ name, value: polizas, details, faltante: faltanteBronce });
            }
        }
    });

    // Sort each category
    ganando.sort((a, b) => b.value - a.value);
    cerca.sort((a, b) => b.value - a.value);
    lejos.sort((a, b) => b.value - a.value);

    return { ganando, cerca, lejos };
};

const AdminDashboard: React.FC<Props> = ({ onLogout, onBack, themeMode, toggleTheme }) => {
    const [view, setView] = useState<AdminView>('resumen');
    const [data, setData] = useState<CampaignData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/summary')
            .then(res => res.json())
            .then(d => { setData(d); setLoading(false); })
            .catch(err => { console.error(err); setLoading(false); });
    }, []);

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)', color: 'var(--text-primary)' }}>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '16px' }}>⏳</div>
                    <p style={{ color: 'var(--text-secondary)' }}>Cargando datos de todas las campañas...</p>
                </motion.div>
            </div>
        );
    }

    if (!data) return <div style={{ color: 'white', padding: '40px' }}>Error cargando datos.</div>;

    const campaigns = Object.keys(data);
    const totalAdvisors = new Set(campaigns.flatMap(c => data[c].map((r: any) => r.Asesor))).size;

    // Build classifications for each campaign
    const classifications = campaigns.reduce((acc, camp) => {
        acc[camp] = classifyAdvisors(camp, data[camp]);
        return acc;
    }, {} as Record<string, ReturnType<typeof classifyAdvisors>>);

    return (
        <div className="app-layout" data-theme={themeMode}>
            {/* Admin Sidebar */}
            <aside className="sidebar" style={{ width: '260px' }}>
                <div style={{ padding: '0 10px 20px 10px', textAlign: 'center' }}>
                    <img
                        src="/assets/logos/empresa/ambriz_logo.png"
                        alt="Ambriz"
                        style={{ maxWidth: '140px', width: '100%', filter: 'brightness(1.1)' }}
                    />
                    <div style={{
                        marginTop: '12px',
                        display: 'inline-block',
                        padding: '4px 12px',
                        background: 'rgba(0, 122, 255, 0.15)',
                        border: '1px solid rgba(0, 122, 255, 0.3)',
                        borderRadius: '16px',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        color: '#007AFF',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                    }}>
                        ADMIN
                    </div>
                </div>

                <div style={{ height: '1px', background: 'var(--glass-border)', margin: '0 0 20px 0' }} />

                <nav style={{ flex: 1 }}>
                    <button onClick={() => setView('resumen')} className={`nav-item ${view === 'resumen' ? 'active' : ''}`}>
                        <BarChart3 className="nav-icon" size={20} />
                        <span>Resumen General</span>
                    </button>
                    <button onClick={() => setView('detalle')} className={`nav-item ${view === 'detalle' ? 'active' : ''}`}>
                        <Users className="nav-icon" size={20} />
                        <span>Detalle por Campaña</span>
                    </button>
                </nav>

                <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '16px', marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button onClick={onBack} className="nav-item" style={{ fontSize: '0.85rem' }}>
                        <Home className="nav-icon" size={16} />
                        <span>Menú Admin</span>
                    </button>
                    <button onClick={onLogout} className="nav-item" style={{ color: 'var(--danger-red)', fontSize: '0.85rem' }}>
                        <LogOut className="nav-icon" size={16} />
                        <span>Cerrar Sesión</span>
                    </button>
                    <button
                        onClick={toggleTheme}
                        className="nav-item"
                        style={{ fontSize: '0.85rem', justifyContent: 'center', marginTop: '4px' }}
                    >
                        {themeMode === 'dark' ? <Sun size={16} className="nav-icon" /> : <Moon size={16} className="nav-icon" />}
                        <span>{themeMode === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content" style={{ overflowY: 'auto', maxHeight: '100vh', padding: '32px 40px' }}>
                {view === 'resumen' ? (
                    <ResumenGeneral data={data} classifications={classifications} totalAdvisors={totalAdvisors} />
                ) : (
                    <DetallePorCampana data={data} classifications={classifications} />
                )}
            </main>
        </div>
    );
};

// =================== RESUMEN GENERAL ===================
const ResumenGeneral: React.FC<{
    data: CampaignData;
    classifications: Record<string, ReturnType<typeof classifyAdvisors>>;
    totalAdvisors: number;
}> = ({ data, classifications, totalAdvisors }) => {
    const campaigns = Object.keys(classifications);

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Header */}
            <div>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                    👁️ Ojo de Dios — Resumen General
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '4px' }}>
                    Vista panorámica de {totalAdvisors} asesores en {campaigns.length} campañas
                </p>
            </div>

            {/* Top KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                {campaigns.map(camp => {
                    const c = classifications[camp];
                    const total = c.ganando.length + c.cerca.length + c.lejos.length;
                    const pctGanando = total > 0 ? ((c.ganando.length / total) * 100).toFixed(0) : '0';
                    return (
                        <div key={camp} className="glass-card" style={{ borderTop: `3px solid ${CAMPAIGN_COLORS[camp]}` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                <span style={{ fontSize: '1.3rem' }}>{CAMPAIGN_ICONS[camp]}</span>
                                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: CAMPAIGN_COLORS[camp], textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    {CAMPAIGN_LABELS[camp]}
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '8px' }}>
                                <span style={{ fontSize: '2rem', fontWeight: 900 }}>{c.ganando.length}</span>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>/ {total} ganando</span>
                            </div>
                            {/* Mini progress */}
                            <div style={{ display: 'flex', gap: '3px', height: '6px' }}>
                                <div style={{ flex: c.ganando.length || 0.1, background: 'var(--success-green)', borderRadius: '3px' }} />
                                <div style={{ flex: c.cerca.length || 0.1, background: 'var(--accent-gold)', borderRadius: '3px' }} />
                                <div style={{ flex: c.lejos.length || 0.1, background: 'var(--danger-red)', borderRadius: '3px' }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                <span>✅ {c.ganando.length}</span>
                                <span>⚠️ {c.cerca.length}</span>
                                <span>❌ {c.lejos.length}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Semáforo Legend */}
            <div className="glass-card" style={{ display: 'flex', gap: '32px', justifyContent: 'center', padding: '16px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--success-green)' }} />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>En Meta / Ganando</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--accent-gold)' }} />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Cerca de Meta</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--danger-red)' }} />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Por Debajo</span>
                </div>
            </div>

            {/* Bar Chart per Campaign */}
            <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>📊 Distribución por Campaña</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {campaigns.map(camp => {
                        const c = classifications[camp];
                        const total = c.ganando.length + c.cerca.length + c.lejos.length;
                        if (total === 0) return null;
                        return (
                            <div key={camp} className="glass-card" style={{ padding: '16px 20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                                        {CAMPAIGN_ICONS[camp]} {CAMPAIGN_LABELS[camp]}
                                    </span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{total} asesores</span>
                                </div>
                                <div style={{ display: 'flex', gap: '3px', height: '24px', borderRadius: '6px', overflow: 'hidden' }}>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(c.ganando.length / total) * 100}%` }}
                                        transition={{ duration: 1, ease: 'easeOut' }}
                                        style={{ background: 'var(--success-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800, color: '#000' }}
                                    >
                                        {c.ganando.length > 0 && c.ganando.length}
                                    </motion.div>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(c.cerca.length / total) * 100}%` }}
                                        transition={{ duration: 1, ease: 'easeOut', delay: 0.1 }}
                                        style={{ background: 'var(--accent-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800, color: '#000' }}
                                    >
                                        {c.cerca.length > 0 && c.cerca.length}
                                    </motion.div>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(c.lejos.length / total) * 100}%` }}
                                        transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                                        style={{ background: 'var(--danger-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800, color: '#fff' }}
                                    >
                                        {c.lejos.length > 0 && c.lejos.length}
                                    </motion.div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                    <span>{((c.ganando.length / total) * 100).toFixed(0)}% ganando</span>
                                    <span>{((c.cerca.length / total) * 100).toFixed(0)}% cerca</span>
                                    <span>{((c.lejos.length / total) * 100).toFixed(0)}% por debajo</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Top Performers */}
            <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>🌟 Top Asesores Destacados</h2>
                <div className="glass-card">
                    {data.mdrt && data.mdrt.length > 0 && (
                        <div>
                            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: CAMPAIGN_COLORS.mdrt, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                🏆 Top 5 MDRT — Mayor Producción
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {[...data.mdrt]
                                    .sort((a: any, b: any) => Number(b.PA_Acumulada || 0) - Number(a.PA_Acumulada || 0))
                                    .slice(0, 5)
                                    .map((row: any, i: number) => {
                                        const pa = Number(row.PA_Acumulada || 0);
                                        const pct = Math.min(100, (pa / 1810400) * 100);
                                        return (
                                            <div key={row.Asesor} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                                                <span style={{ fontSize: '1.1rem', width: '28px', textAlign: 'center' }}>
                                                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                                                </span>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{row.Asesor}</div>
                                                    <div style={{ display: 'flex', gap: '3px', height: '4px', borderRadius: '2px', overflow: 'hidden', marginTop: '4px', background: 'rgba(255,255,255,0.05)' }}>
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${pct}%` }}
                                                            transition={{ duration: 1.2, ease: 'easeOut' }}
                                                            style={{ background: pct >= 100 ? 'var(--success-green)' : pct >= 60 ? 'var(--accent-gold)' : 'var(--danger-red)', borderRadius: '2px' }}
                                                        />
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{formatCurrency(pa)}</div>
                                                    <div style={{ fontSize: '0.65rem', color: pct >= 100 ? 'var(--success-green)' : 'var(--text-secondary)' }}>{pct.toFixed(1)}%</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

// =================== DETALLE POR CAMPAÑA ===================
const DetallePorCampana: React.FC<{
    data: CampaignData;
    classifications: Record<string, ReturnType<typeof classifyAdvisors>>;
}> = ({ data, classifications }) => {
    const [expandedCampaign, setExpandedCampaign] = useState<string | null>('mdrt');
    const campaigns = Object.keys(classifications);

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Header */}
            <div>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                    📋 Detalle por Campaña
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '4px' }}>
                    Desglose detallado de cada asesor separado por campaña
                </p>
            </div>

            {/* Campaign Accordion */}
            {campaigns.map(camp => {
                const c = classifications[camp];
                const total = c.ganando.length + c.cerca.length + c.lejos.length;
                const isExpanded = expandedCampaign === camp;

                return (
                    <div key={camp} className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                        {/* Campaign Header */}
                        <button
                            onClick={() => setExpandedCampaign(isExpanded ? null : camp)}
                            style={{
                                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '20px 24px', background: 'none', border: 'none', cursor: 'pointer',
                                color: 'var(--text-primary)', fontFamily: 'inherit',
                                borderBottom: isExpanded ? '1px solid var(--glass-border)' : 'none',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ fontSize: '1.5rem' }}>{CAMPAIGN_ICONS[camp]}</span>
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: CAMPAIGN_COLORS[camp] }}>
                                        {CAMPAIGN_LABELS[camp]}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                        {total} asesores • ✅ {c.ganando.length} ganando • ⚠️ {c.cerca.length} cerca • ❌ {c.lejos.length} por debajo
                                    </div>
                                </div>
                            </div>
                            <ChevronRight size={20} style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: '0.2s', opacity: 0.5 }} />
                        </button>

                        {/* Expanded Content */}
                        {isExpanded && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}
                            >
                                {/* Ganando */}
                                {c.ganando.length > 0 && (
                                    <AdvisorSection
                                        title="En Meta / Ganando"
                                        icon="✅"
                                        color="var(--success-green)"
                                        advisors={c.ganando}
                                        campaign={camp}
                                    />
                                )}

                                {/* Cerca */}
                                {c.cerca.length > 0 && (
                                    <AdvisorSection
                                        title="Cerca de Meta"
                                        icon="⚠️"
                                        color="var(--accent-gold)"
                                        advisors={c.cerca}
                                        campaign={camp}
                                    />
                                )}

                                {/* Lejos */}
                                {c.lejos.length > 0 && (
                                    <AdvisorSection
                                        title="Por Debajo de Meta"
                                        icon="❌"
                                        color="var(--danger-red)"
                                        advisors={c.lejos}
                                        campaign={camp}
                                    />
                                )}
                            </motion.div>
                        )}
                    </div>
                );
            })}
        </motion.div>
    );
};

// =================== ADVISOR SECTION ===================
const AdvisorSection: React.FC<{
    title: string;
    icon: string;
    color: string;
    advisors: any[];
    campaign: string;
}> = ({ title, icon, color, advisors, campaign }) => {
    const [showAll, setShowAll] = useState(false);
    const displayList = showAll ? advisors : advisors.slice(0, 10);

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span>{icon}</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color }}>{title}</span>
                <span style={{
                    fontSize: '0.7rem', fontWeight: 700, color: '#fff',
                    background: color, padding: '2px 10px', borderRadius: '10px',
                }}>{advisors.length}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {displayList.map((adv, i) => (
                    <div
                        key={adv.name + i}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '10px 14px', background: 'rgba(255,255,255,0.02)',
                            borderRadius: '8px', borderLeft: `3px solid ${color}`,
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ width: '24px', fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center' }}>{i + 1}</span>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{adv.name}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                            {adv.details ? adv.details.map((line: string, j: number) => (
                                <span key={j} style={{
                                    fontSize: j === 0 ? '0.8rem' : '0.7rem',
                                    color: j === 0 ? 'var(--text-primary)' : 'var(--text-secondary)',
                                    fontWeight: j === 0 ? 600 : 400,
                                    opacity: j === 0 ? 0.9 : 0.7,
                                }}>{line}</span>
                            )) : (
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{adv.label}</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {advisors.length > 10 && (
                <button
                    onClick={() => setShowAll(!showAll)}
                    style={{
                        marginTop: '8px', background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--primary-blue)', fontSize: '0.8rem', fontWeight: 600, fontFamily: 'inherit',
                    }}
                >
                    {showAll ? '▲ Ver menos' : `▼ Ver todos (${advisors.length})`}
                </button>
            )}
        </div>
    );
};

export default AdminDashboard;
