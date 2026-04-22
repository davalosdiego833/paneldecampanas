import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, ChevronLeft } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Props {
    onBack: () => void;
    themeMode: 'dark' | 'light';
}

const StaffActivity: React.FC<Props> = ({ onBack, themeMode }) => {
    const [staffData, setStaffData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeStaff, setActiveStaff] = useState<string>('');

    useEffect(() => {
        fetch('/api/admin/staff-activity')
            .then(res => res.json())
            .then(d => {
                setStaffData(d);
                const keys = Object.keys(d);
                if (keys.length > 0) setActiveStaff(keys[0]);
                setLoading(false);
            })
            .catch(e => {
                console.error(e);
                setLoading(false);
            });
    }, []);

    if (loading) return <div style={{ color: 'white', padding: '40px', textAlign: 'center' }}>Cargando métricas del staff...</div>;
    if (!staffData || Object.keys(staffData).length === 0) return <div style={{ color: 'white', padding: '40px', textAlign: 'center' }}>No hay datos de staff registrados.</div>;
    const person = staffData[activeStaff];
    
    // Lógica para encontrar el ciclo de comparación correcto (evitar mostrar 0 si el último es un baseline)
    let prevIndex = -1;
    let currIndex = -1;

    if (person && person.history && person.history.length >= 2) {
        // Buscamos el último registro que tenga "movimiento" respecto al anterior
        // O simplemente tomamos los dos últimos que no sean idénticos
        for (let i = person.history.length - 1; i > 0; i--) {
            const c = person.history[i].data;
            const p = person.history[i-1].data;
            const hasDiff = Object.keys(c).some(k => (c[k] || 0) !== (p[k] || 0));
            if (hasDiff) {
                currIndex = i;
                prevIndex = i - 1;
                break;
            }
        }
        // Fallback: si todos son iguales (recién empezando), tomamos los dos últimos
        if (currIndex === -1) {
            currIndex = person.history.length - 1;
            prevIndex = person.history.length - 2;
        }
    }

    const hasEnoughData = prevIndex !== -1 && currIndex !== -1;

    const devMetrics = [
        { key: 'citas_iniciales', label: 'Citas Iniciales', icon: '📞' },
        { key: 'citas_cierre', label: 'Citas de Cierre', icon: '🎯' },
        { key: 'sesiones_11', label: 'Sesiones 1:1', icon: '🗣️' },
        { key: 'arranque_rapido', label: 'Acompañamientos / Arranques', icon: '⚡' },
        { key: 'tareas_actividades', label: 'Actividades/Tareas en Agenda', icon: '📅' },
    ];

    const hrMetrics = [
        { key: 'ent_enamoramiento', label: 'Entrevistas Enamoramiento', icon: '💖' },
        { key: 'ent_seleccion', label: 'Entrevistas Selección / Comp.', icon: '📝' },
        { key: 'sesiones_rda', label: 'Sesiones RDA Completadas', icon: '✅' },
        { key: 'recluta_citas', label: 'Citas Recluta (Bitácora)', icon: '📅', isVolume: true },
        { key: 'recluta_contactos', label: 'Contactos / Búsqueda', icon: '🔎', isVolume: true },
    ];

    const metrics = person?.role === 'hr' ? hrMetrics : devMetrics;

    let deltas: any[] = [];
    let totalGoldHours = 0;
    let intensity = "0";
    let conversionChartData: any[] = [];
    let volumeChartData: any[] = [];
    let prev: any = null;
    let curr: any = null;

    if (hasEnoughData) {
        prev = person.history[prevIndex].data;
        curr = person.history[currIndex].data;

        deltas = metrics.map(m => ({
            label: m.label,
            gain: (curr[m.key] || 0) - (prev[m.key] || 0),
            prev: prev[m.key] || 0,
            curr: curr[m.key] || 0,
            isVolume: (m as any).isVolume
        }));

        // Solo sumar horas para Desarrollo
        if (person.role !== 'hr') {
            totalGoldHours = deltas.filter(d => d.label !== 'Actividades/Tareas en Agenda').reduce((sum, d) => sum + d.gain, 0);
            intensity = ((totalGoldHours / 40) * 100).toFixed(0);
        }

        conversionChartData = deltas.filter(d => !d.isVolume && d.label !== 'Actividades/Tareas en Agenda').map(d => ({ 
            name: d.label, 'Previo': d.prev, 'Actual': d.curr, 'Ganancia': d.gain 
        }));
        
        volumeChartData = deltas.filter(d => d.isVolume).map(d => ({ 
            name: d.label, 'Previo': d.prev, 'Actual': d.curr, 'Ganancia': d.gain 
        }));
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '40px' }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                
                {/* Top Nav & Tabs */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button 
                        onClick={onBack}
                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 600 }}
                    >
                        <ChevronLeft size={20} /> Volver al Menú
                    </button>

                    <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                        {Object.keys(staffData).map(key => (
                            <button
                                key={key}
                                onClick={() => setActiveStaff(key)}
                                style={{
                                    padding: '8px 20px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    fontWeight: 700,
                                    background: activeStaff === key ? '#007AFF' : 'transparent',
                                    color: activeStaff === key ? 'white' : 'var(--text-secondary)',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {staffData[key].name.split(' ')[0]}
                            </button>
                        ))}
                    </div>
                </div>

                {!hasEnoughData ? (
                    <div style={{ textAlign: 'center', padding: '100px 40px', color: 'var(--text-secondary)' }}>
                        <h2 style={{ color: 'white', marginBottom: '16px' }}>📉 Esperando datos de comparativa para {person.name}</h2>
                        <p>Necesitamos más de un registro para poder calcular el crecimiento semanal.</p>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'white' }}>
                                    💎 Mina de Oro — {person.name}
                                </h1>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: '6px' }}>
                                    Comparativo: Martes {person.history[prevIndex].date} vs lunes {person.history[currIndex].date}
                                </p>
                            </div>
                            
                            {person.role !== 'hr' ? (
                                <div style={{ padding: '12px 24px', background: 'rgba(0,122,255,0.1)', border: '1px solid rgba(0,122,255,0.25)', borderRadius: '16px', textAlign: 'right' }}>
                                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'white' }}>{totalGoldHours} hrs <span style={{ fontSize: '0.9rem', opacity: 0.5, fontWeight: 400 }}>de crecimiento</span></div>
                                    <div style={{ fontSize: '0.85rem', color: '#007AFF', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>{(totalGoldHours / 5).toFixed(1)} hrs / día promedio</div>
                                </div>
                            ) : (
                                <div style={{ padding: '12px 24px', background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.25)', borderRadius: '16px', textAlign: 'right' }}>
                                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'white' }}>RH Activo</div>
                                    <div style={{ fontSize: '0.85rem', color: '#A855F7', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>Gestión de Reclutamiento</div>
                                </div>
                            )}
                        </div>

                        {/* Intensity KPI */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                            {person.role !== 'hr' ? (
                                <>
                                    <div className="glass-card" style={{ borderLeft: '4px solid #00E676', padding: '24px' }}>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>APROVECHAMIENTO SEMANAL</div>
                                        <div style={{ fontSize: '2.8rem', fontWeight: 900, color: '#00E676', margin: '8px 0' }}>{intensity}%</div>
                                        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Basado en 40 horas totales a la semana.</div>
                                        <div style={{ marginTop: '16px', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', position: 'relative' }}>
                                            <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${Math.min(parseInt(intensity), 100)}%`, background: '#00E676', borderRadius: '4px' }} />
                                        </div>
                                    </div>
                                    <div className="glass-card" style={{ borderLeft: '4px solid #FFD93D', padding: '24px' }}>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>TOTAL HORAS DE VALOR</div>
                                        <div style={{ fontSize: '2.8rem', fontWeight: 900, color: '#FFD93D', margin: '8px 0' }}>{totalGoldHours} hrs</div>
                                        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Suma del crecimiento en actividades críticas.</div>
                                    </div>
                                    <div className="glass-card" style={{ borderLeft: '4px solid #42A5F5', padding: '24px' }}>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>ACTIVIDADES COMPLETADAS EN AGENDA</div>
                                        <div style={{ fontSize: '2.8rem', fontWeight: 900, color: '#42A5F5', margin: '8px 0' }}>+{(curr.tareas_actividades || 0) - (prev.tareas_actividades || 0)}</div>
                                        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Incremento en tareas totales registradas.</div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="glass-card" style={{ borderLeft: '4px solid #A855F7', padding: '24px' }}>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>NUEVO ALCANCE DE BÚSQUEDA</div>
                                        <div style={{ fontSize: '2.8rem', fontWeight: 900, color: '#A855F7', margin: '8px 0' }}>+{(curr.recluta_contactos || 0) - (prev.recluta_contactos || 0)}</div>
                                        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Nuevos contactos registrados en bitácora esta semana.</div>
                                    </div>
                                    <div className="glass-card" style={{ borderLeft: '4px solid #FF5252', padding: '24px' }}>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>NUEVAS CITAS AGENDADAS</div>
                                        <div style={{ fontSize: '2.8rem', fontWeight: 900, color: '#FF5252', margin: '8px 0' }}>+{(curr.recluta_citas || 0) - (prev.recluta_citas || 0)}</div>
                                        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Crecimiento en volumen de reclutamiento.</div>
                                    </div>
                                    <div className="glass-card" style={{ borderLeft: '4px solid #007AFF', padding: '24px' }}>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>ENTREVISTAS DE FILTRO</div>
                                        <div style={{ fontSize: '2.8rem', fontWeight: 900, color: '#007AFF', margin: '8px 0' }}>+{(curr.ent_enamoramiento || 0) - (prev.ent_enamoramiento || 0) + (curr.ent_seleccion || 0) - (prev.ent_seleccion || 0)}</div>
                                        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Total de entrevistas iniciales y de selección.</div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Metrics Table */}
                        <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                            <div style={{ padding: '24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>🔍 Desglose Comparativo de Actividad</h3>
                                <Activity size={20} color="#007AFF" />
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--glass-border)' }}>
                                            <th style={{ padding: '20px 24px', fontSize: '0.8rem', opacity: 0.6, fontWeight: 600 }}>TIPO DE ACTIVIDAD</th>
                                            <th style={{ padding: '20px 24px', fontSize: '0.8rem', opacity: 0.6, fontWeight: 600, textAlign: 'center' }}>CIERRE MARTES</th>
                                            <th style={{ padding: '20px 24px', fontSize: '0.8rem', opacity: 0.6, fontWeight: 600, textAlign: 'center' }}>CIERRE LUNES</th>
                                            <th style={{ padding: '20px 24px', fontSize: '0.8rem', opacity: 0.6, fontWeight: 600, textAlign: 'right' }}>CRECIMIENTO</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {deltas.map(d => (
                                            <tr key={d.label} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                                <td style={{ padding: '20px 24px', fontWeight: 700, fontSize: '1rem' }}>{d.label}</td>
                                                <td style={{ padding: '20px 24px', opacity: 0.5, textAlign: 'center', fontSize: '1rem' }}>{d.prev}</td>
                                                <td style={{ padding: '20px 24px', fontWeight: 800, textAlign: 'center', fontSize: '1.2rem' }}>{d.curr}</td>
                                                <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                                                    <span style={{ padding: '6px 14px', borderRadius: '20px', background: d.gain >= 0 ? 'rgba(0,230,118,0.15)' : 'rgba(255,82,82,0.15)', color: d.gain >= 0 ? '#00E676' : '#FF5252', fontSize: '0.9rem', fontWeight: 900 }}>
                                                        {d.gain >= 0 ? `+${d.gain}` : d.gain}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Chart Section - Split into two for scale */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px' }}>
                            <div className="glass-card" style={{ padding: '32px' }}>
                                <div style={{ marginBottom: '24px' }}>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>📊 Conversión de Mina</h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Citas, Entrevistas y Arranques</p>
                                </div>
                                <div style={{ height: '300px', width: '100%' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={conversionChartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                            <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} />
                                            <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} />
                                            <Tooltip contentStyle={{ background: '#12141a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                                            <Bar name="Previo" dataKey="Previo" fill="rgba(255,255,255,0.1)" radius={[4, 4, 0, 0]} />
                                            <Bar name="Actual" dataKey="Actual" fill="#007AFF" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="glass-card" style={{ padding: '32px' }}>
                                <div style={{ marginBottom: '24px' }}>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>📈 Volumen de Prospección</h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Contactos y Citas en Bitácora</p>
                                </div>
                                <div style={{ height: '300px', width: '100%' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={volumeChartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                            <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} />
                                            <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} />
                                            <Tooltip contentStyle={{ background: '#12141a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                                            <Bar name="Previo" dataKey="Previo" fill="rgba(255,255,255,0.1)" radius={[4, 4, 0, 0]} />
                                            <Bar name="Actual" dataKey="Actual" fill="#A855F7" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </motion.div>
        </div>
    );
};

export default StaffActivity;
