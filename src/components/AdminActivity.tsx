import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LogOut, ArrowLeft, RefreshCw, Users, Activity, Clock, LogIn } from 'lucide-react';

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

    useEffect(() => {
        fetchActivity();
    }, []);

    // Metricas basicas
    const today = new Date().toISOString().split('T')[0];
    const todaysActivities = activities.filter(a => a.fecha === today);
    const uniqueUsersToday = new Set(todaysActivities.map(a => a.asesor)).size;

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
                            <h1 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Actividad en la Página</h1>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Log de conexiones</span>
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button onClick={fetchActivity} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', background: 'rgba(212, 175, 55, 0.1)', color: '#D4AF37', border: '1px solid rgba(212, 175, 55, 0.2)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}>
                        <RefreshCw size={16} className={loading ? 'spin-animation' : ''} />
                        Actualizar
                    </button>
                    <button onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', background: 'rgba(255, 107, 107, 0.1)', color: '#FF6B6B', border: '1px solid rgba(255, 107, 107, 0.2)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}>
                        <LogOut size={16} /> Salir
                    </button>
                </div>
            </header>

            <main style={{ flex: 1, padding: '24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                    {/* Tarjeta de métricas: Accesos de hoy */}
                    <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '20px', borderTop: '3px solid #007AFF' }}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(0, 122, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <LogIn size={28} color="#007AFF" />
                        </div>
                        <div>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Accesos Hoy</p>
                            <h2 style={{ margin: '4px 0 0 0', fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{todaysActivities.length}</h2>
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
                            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Accesos Históricos</p>
                            <h2 style={{ margin: '4px 0 0 0', fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{activities.length}</h2>
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
                                </tr>
                            </thead>
                            <tbody>
                                {loading && activities.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando registros...</td>
                                    </tr>
                                ) : activities.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>No hay actividad registrada aún.</td>
                                    </tr>
                                ) : (
                                    activities.slice(0, 100).map((act, idx) => (
                                        <motion.tr
                                            key={act.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.02 }}
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
                                        </motion.tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminActivity;
