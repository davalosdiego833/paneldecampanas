import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LogOut, ArrowLeft, RefreshCw, Users, Activity, Clock, LogIn, Shield, Trash2 } from 'lucide-react';

interface Props {
    onLogout: () => void;
    onBack: () => void;
    themeMode: 'dark' | 'light';
    toggleTheme: () => void;
}

interface ActivityEvent {
    id: string;
    asesor: string;
    accion: string;
    fecha: string;
    hora: string;
    timestamp: number;
}

const AdminActivity: React.FC<Props> = ({ onLogout, onBack, themeMode, toggleTheme }) => {
    const [activities, setActivities] = useState<ActivityEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'accesos' | 'campanas' | 'admin'>('accesos');

    const fetchActivity = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/activity');
            const data = await res.json();
            setActivities(data);
        } catch (err) {
            console.error('Error fetching activity logs:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Estás seguro de querer eliminar este registro de actividad? Esto descontará los números estadísticos en tiempo real.')) return;

        try {
            const res = await fetch(`/api/activity/${id}`, { method: 'DELETE' });
            if (res.ok) {
                // Refresh data to automatically update all charts and metrics
                fetchActivity();
            } else {
                alert('No se pudo eliminar el registro.');
            }
        } catch (e) {
            console.error('Error al borrar registro:', e);
        }
    };

    useEffect(() => {
        fetchActivity();
    }, []);

    // Metricas basicas - Accesos
    const today = new Date().toISOString().split('T')[0];
    const loginActivities = activities.filter(a => a.accion === 'Inició Sesión / Entró al Dashboard');
    const todaysLogins = loginActivities.filter(a => a.fecha === today);
    const uniqueUsersToday = new Set(todaysLogins.map(a => a.asesor)).size;

    // Metricas basicas - Campañas
    const campaignActivities = activities.filter(a => a.accion.startsWith('Consultó Campaña:'));
    const todaysCampaignClicks = campaignActivities.filter(a => a.fecha === today).length;

    // Ranking de campañas
    const campaignCounts = campaignActivities.reduce((acc, curr) => {
        const campName = curr.accion.replace('Consultó Campaña: ', '');
        acc[campName] = (acc[campName] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const topCampaigns = Object.entries(campaignCounts)
        .sort((a, b) => b[1] - a[1]) // highest first
        .slice(0, 5); // top 5

    // Metricas basicas - Admin
    const adminActivities = activities.filter(a => a.accion.startsWith('Consultó Reporte Admin:'));
    const todaysAdminClicks = adminActivities.filter(a => a.fecha === today).length;

    // Ranking de Reportes Admin
    const adminCounts = adminActivities.reduce((acc, curr) => {
        const reportName = curr.accion.replace('Consultó Reporte Admin: ', '');
        acc[reportName] = (acc[reportName] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const topAdminReports = Object.entries(adminCounts)
        .sort((a, b) => b[1] - a[1]) // highest first
        .slice(0, 4); // top 4 (since there's only 4 reports currently)

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Minimal Header */}
            <header className="glass-panel" style={{
                padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid var(--glass-border)',
                background: 'rgba(15, 18, 25, 0.8)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}>
                        <ArrowLeft size={18} /> Volver al Menú
                    </button>
                    <div style={{ width: '1px', height: '24px', background: 'var(--glass-border)' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.05) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
                            <Activity size={20} color="#D4AF37" />
                        </div>
                        <div>
                            <h1 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Monitor de Actividad</h1>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Log de conexiones e intereses</span>
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>

                    {/* Tabs Switcher in Header */}
                    <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                        <button
                            onClick={() => setActiveTab('accesos')}
                            style={{
                                padding: '6px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, transition: '0.2s',
                                background: activeTab === 'accesos' ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
                                color: activeTab === 'accesos' ? '#D4AF37' : 'var(--text-secondary)'
                            }}
                        >
                            Accesos
                        </button>
                        <button
                            onClick={() => setActiveTab('campanas')}
                            style={{
                                padding: '6px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, transition: '0.2s',
                                background: activeTab === 'campanas' ? 'rgba(0, 122, 255, 0.15)' : 'transparent',
                                color: activeTab === 'campanas' ? '#007AFF' : 'var(--text-secondary)'
                            }}
                        >
                            Campañas
                        </button>
                        <button
                            onClick={() => setActiveTab('admin')}
                            style={{
                                padding: '6px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, transition: '0.2s',
                                background: activeTab === 'admin' ? 'rgba(108, 92, 231, 0.15)' : 'transparent',
                                color: activeTab === 'admin' ? '#a29bfe' : 'var(--text-secondary)'
                            }}
                        >
                            Admin
                        </button>
                    </div>

                    <div style={{ width: '1px', height: '24px', background: 'var(--glass-border)' }} />

                    <button onClick={fetchActivity} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', background: 'rgba(212, 175, 55, 0.1)', color: '#D4AF37', border: '1px solid rgba(212, 175, 55, 0.2)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}>
                        <RefreshCw size={16} className={loading ? 'spin-animation' : ''} />
                    </button>
                    <button onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', background: 'rgba(255, 107, 107, 0.1)', color: '#FF6B6B', border: '1px solid rgba(255, 107, 107, 0.2)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}>
                        <LogOut size={16} /> Salir
                    </button>
                </div>
            </header>

            <main style={{ flex: 1, padding: '24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>

                {/* ----------------- TAB: ACCESOS ----------------- */}
                {activeTab === 'accesos' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                            {/* Tarjeta de métricas: Accesos de hoy */}
                            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '20px', borderTop: '3px solid #007AFF' }}>
                                <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(0, 122, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <LogIn size={28} color="#007AFF" />
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Inicios de Sesión Hoy</p>
                                    <h2 style={{ margin: '4px 0 0 0', fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{todaysLogins.length}</h2>
                                </div>
                            </div>

                            {/* Tarjeta de métricas: Usuarios únicos hoy */}
                            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '20px', borderTop: '3px solid #00E676' }}>
                                <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(0, 230, 118, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Users size={28} color="#00E676" />
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Asesores Únicos Hoy</p>
                                    <h2 style={{ margin: '4px 0 0 0', fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{uniqueUsersToday}</h2>
                                </div>
                            </div>

                            {/* Tarjeta de métricas: Total Registros */}
                            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '20px', borderTop: '3px solid #D4AF37' }}>
                                <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(212, 175, 55, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Activity size={28} color="#D4AF37" />
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Inicios de Sesión (Log)</p>
                                    <h2 style={{ margin: '4px 0 0 0', fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{loginActivities.length}</h2>
                                </div>
                            </div>
                        </div>

                        <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Clock size={20} color="var(--accent-gold)" />
                                    Registro de Entradas Recientes
                                </h3>
                            </div>

                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--glass-border)' }}>
                                            <th style={{ padding: '16px 24px', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fecha y Hora</th>
                                            <th style={{ padding: '16px 24px', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nombre del Asesor</th>
                                            <th style={{ padding: '16px 24px', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Acción</th>
                                            <th style={{ padding: '16px 24px', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Eliminar</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading && loginActivities.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando registros...</td>
                                            </tr>
                                        ) : loginActivities.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>No hay actividad registrada aún.</td>
                                            </tr>
                                        ) : (
                                            loginActivities.slice(0, 50).map((act, idx) => (
                                                <motion.tr
                                                    key={act.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.01 }}
                                                    style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}
                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'}
                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                >
                                                    <td style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{act.fecha}</div>
                                                        <div style={{ fontSize: '0.8rem' }}>{act.hora}</div>
                                                    </td>
                                                    <td style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--accent-gold)' }}>
                                                        {act.asesor}
                                                    </td>
                                                    <td style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                                        <div style={{ display: 'inline-block', padding: '4px 10px', background: 'rgba(0, 122, 255, 0.1)', color: '#007AFF', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600 }}>
                                                            {act.accion}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                                        <button
                                                            onClick={() => handleDelete(act.id)}
                                                            style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}
                                                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                            title="Eliminar registro permanentemente"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </td>
                                                </motion.tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ----------------- TAB: CAMPAÑAS ----------------- */}
                {activeTab === 'campanas' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                            {/* Clics Hoy */}
                            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '20px', borderTop: '3px solid #00B8D9' }}>
                                <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(0, 184, 217, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Activity size={28} color="#00B8D9" />
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Clics en Campañas Hoy</p>
                                    <h2 style={{ margin: '4px 0 0 0', fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{todaysCampaignClicks}</h2>
                                </div>
                            </div>

                            {/* Total Clics */}
                            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '20px', borderTop: '3px solid #6C5CE7' }}>
                                <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(108, 92, 231, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Activity size={28} color="#6C5CE7" />
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Consultas Históricas</p>
                                    <h2 style={{ margin: '4px 0 0 0', fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{campaignActivities.length}</h2>
                                </div>
                            </div>
                        </div>

                        {/* Ranking Top 5 Campañas */}
                        <div className="glass-card" style={{ padding: '24px', marginBottom: '32px' }}>
                            <h3 style={{ margin: '0 0 20px 0', fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                🏆 Ranking: Clics Totales por Campaña
                            </h3>
                            {topCampaigns.length === 0 ? (
                                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>No hay clics registrados todavía.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {topCampaigns.map(([camp, count], idx) => {
                                        // Simple percentage bar (relative to the #1 campaign)
                                        const maxCount = topCampaigns[0][1];
                                        const widthPct = Math.max((count / maxCount) * 100, 2); // At least 2% width

                                        return (
                                            <div key={camp} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                <div style={{ width: '24px', fontWeight: 700, color: idx === 0 ? '#D4AF37' : 'var(--text-secondary)' }}>
                                                    #{idx + 1}
                                                </div>
                                                <div style={{ width: '150px', fontSize: '0.9rem', fontWeight: 600 }}>
                                                    {camp}
                                                </div>
                                                <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${widthPct}%` }}
                                                        transition={{ duration: 1, delay: idx * 0.1 }}
                                                        style={{ height: '100%', background: idx === 0 ? 'linear-gradient(90deg, #D4AF37, #F3E5AB)' : 'linear-gradient(90deg, #007AFF, #6C5CE7)', borderRadius: '4px' }}
                                                    />
                                                </div>
                                                <div style={{ width: '60px', textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>
                                                    {count} {count === 1 ? 'clic' : 'clics'}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Recent Campaign Log */}
                        <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Clock size={20} color="#007AFF" />
                                    Registro de Navegación Reciente
                                </h3>
                            </div>

                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--glass-border)' }}>
                                            <th style={{ padding: '16px 24px', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fecha y Hora</th>
                                            <th style={{ padding: '16px 24px', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Asesor</th>
                                            <th style={{ padding: '16px 24px', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Campaña</th>
                                            <th style={{ padding: '16px 24px', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Eliminar</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading && campaignActivities.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando registros...</td>
                                            </tr>
                                        ) : campaignActivities.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>No hay clics en campañas registrados aún.</td>
                                            </tr>
                                        ) : (
                                            campaignActivities.slice(0, 50).map((act, idx) => {
                                                const campName = act.accion.replace('Consultó Campaña: ', '');
                                                return (
                                                    <motion.tr
                                                        key={act.id}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: idx * 0.01 }}
                                                        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}
                                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'}
                                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                    >
                                                        <td style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{act.fecha}</div>
                                                            <div style={{ fontSize: '0.8rem' }}>{act.hora}</div>
                                                        </td>
                                                        <td style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                                            {act.asesor}
                                                        </td>
                                                        <td style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                                            <div style={{ display: 'inline-block', padding: '4px 10px', background: 'rgba(108, 92, 231, 0.1)', color: '#a29bfe', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600 }}>
                                                                {campName}
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                                            <button
                                                                onClick={() => handleDelete(act.id)}
                                                                style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}
                                                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                                title="Eliminar clic en campaña"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </td>
                                                    </motion.tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ----------------- TAB: ADMIN ----------------- */}
                {activeTab === 'admin' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                            {/* Admin Clics Hoy */}
                            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '20px', borderTop: '3px solid #00B8D9' }}>
                                <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(0, 184, 217, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Shield size={28} color="#00B8D9" />
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Visitas a Reportes Hoy</p>
                                    <h2 style={{ margin: '4px 0 0 0', fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{todaysAdminClicks}</h2>
                                </div>
                            </div>

                            {/* Total Admin Clics */}
                            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '20px', borderTop: '3px solid #6C5CE7' }}>
                                <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(108, 92, 231, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Activity size={28} color="#6C5CE7" />
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Consultas Históricas (Admin)</p>
                                    <h2 style={{ margin: '4px 0 0 0', fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{adminActivities.length}</h2>
                                </div>
                            </div>
                        </div>

                        {/* Ranking Top 4 Reportes Admin */}
                        <div className="glass-card" style={{ padding: '24px', marginBottom: '32px' }}>
                            <h3 style={{ margin: '0 0 20px 0', fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                🏆 Ranking: Reportes Más Consultados
                            </h3>
                            {topAdminReports.length === 0 ? (
                                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>No hay visitas a reportes registradas todavía.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {topAdminReports.map(([report, count], idx) => {
                                        // Simple percentage bar (relative to the #1 report)
                                        const maxCount = topAdminReports[0][1];
                                        const widthPct = Math.max((count / maxCount) * 100, 2); // At least 2% width

                                        return (
                                            <div key={report} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                <div style={{ width: '24px', fontWeight: 700, color: idx === 0 ? '#D4AF37' : 'var(--text-secondary)' }}>
                                                    #{idx + 1}
                                                </div>
                                                <div style={{ width: '200px', fontSize: '0.9rem', fontWeight: 600 }}>
                                                    {report}
                                                </div>
                                                <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${widthPct}%` }}
                                                        transition={{ duration: 1, delay: idx * 0.1 }}
                                                        style={{ height: '100%', background: idx === 0 ? 'linear-gradient(90deg, #D4AF37, #F3E5AB)' : 'linear-gradient(90deg, #00B8D9, #0097A7)', borderRadius: '4px' }}
                                                    />
                                                </div>
                                                <div style={{ width: '60px', textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>
                                                    {count} {count === 1 ? 'visita' : 'visitas'}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Recent Admin Log */}
                        <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Clock size={20} color="#a29bfe" />
                                    Registro de Supervisión Reciente
                                </h3>
                            </div>

                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--glass-border)' }}>
                                            <th style={{ padding: '16px 24px', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fecha y Hora</th>
                                            <th style={{ padding: '16px 24px', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Usuario</th>
                                            <th style={{ padding: '16px 24px', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reporte Consultado</th>
                                            <th style={{ padding: '16px 24px', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Eliminar</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading && adminActivities.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando registros...</td>
                                            </tr>
                                        ) : adminActivities.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>No hay visitas administrativas registradas aún.</td>
                                            </tr>
                                        ) : (
                                            adminActivities.slice(0, 50).map((act, idx) => {
                                                const reportName = act.accion.replace('Consultó Reporte Admin: ', '');
                                                return (
                                                    <motion.tr
                                                        key={act.id}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: idx * 0.01 }}
                                                        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}
                                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'}
                                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                    >
                                                        <td style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{act.fecha}</div>
                                                            <div style={{ fontSize: '0.8rem' }}>{act.hora}</div>
                                                        </td>
                                                        <td style={{ padding: '16px 24px', fontWeight: 600, color: '#D4AF37' }}>
                                                            {act.asesor}
                                                        </td>
                                                        <td style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                                            <div style={{ display: 'inline-block', padding: '4px 10px', background: 'rgba(0, 184, 217, 0.1)', color: '#00B8D9', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600 }}>
                                                                {reportName}
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                                            <button
                                                                onClick={() => handleDelete(act.id)}
                                                                style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}
                                                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                                title="Eliminar visita de Admin"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </td>
                                                    </motion.tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                )}
            </main>
        </div>
    );
};

export default AdminActivity;
