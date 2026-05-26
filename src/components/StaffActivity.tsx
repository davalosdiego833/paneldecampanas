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
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [selectedPeriod, setSelectedPeriod] = useState<string>('latest');

    // Reset period when changing staff
    useEffect(() => {
        setSelectedPeriod('latest');
    }, [activeStaff]);

    useEffect(() => {
        fetch('/api/admin/staff-activity?t=' + Date.now())
            .then(res => {
                if (!res.ok) throw new Error('HTTP error ' + res.status);
                return res.json();
            })
            .then(d => {
                setStaffData(d);
                const keys = Object.keys(d);
                if (keys.length > 0) setActiveStaff(keys[0]);
                setLoading(false);
            })
            .catch(e => {
                console.error(e);
                setErrorMsg(e.message || 'Error de red');
                setLoading(false);
            });
    }, []);

    if (loading) return <div style={{ color: 'white', padding: '40px', textAlign: 'center' }}>Cargando métricas del staff...</div>;
    if (errorMsg) return <div style={{ color: '#FF6B6B', padding: '40px', textAlign: 'center' }}>Error al cargar datos: {errorMsg}</div>;
    if (!staffData || Object.keys(staffData).length === 0) return <div style={{ color: 'white', padding: '40px', textAlign: 'center' }}>No hay datos de staff registrados. (El servidor devolvió vacío)</div>;
    
    const person = staffData[activeStaff];

    let prevIndex = -1;
    let currIndex = -1;
    let availablePeriods: { id: string, label: string }[] = [{ id: 'latest', label: 'Última Semana' }];

    if (person && person.history && person.history.length > 0) {
        // Extract unique months
        const monthsNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const monthsMap = new Map<string, string>();
        
        person.history.forEach((h: any) => {
            const parts = h.date.split('-');
            if (parts.length >= 2) {
                const year = parts[0];
                const month = parseInt(parts[1], 10);
                const periodId = `${year}-${parts[1]}`;
                const periodLabel = `${monthsNames[month - 1]} ${year}`;
                if (!monthsMap.has(periodId)) {
                    monthsMap.set(periodId, periodLabel);
                }
            }
        });

        Array.from(monthsMap.entries()).forEach(([id, label]) => {
            availablePeriods.push({ id, label });
        });

        if (selectedPeriod === 'latest' && person.history.length >= 2) {
            currIndex = person.history.length - 1;
            prevIndex = person.history.length - 2;
        } else if (selectedPeriod !== 'latest') {
            const monthEntries = person.history
                .map((h: any, index: number) => ({ h, index }))
                .filter((item: any) => item.h.date.startsWith(selectedPeriod));
            
            if (monthEntries.length >= 2) {
                prevIndex = monthEntries[0].index;
                currIndex = monthEntries[monthEntries.length - 1].index;
            }
        }
    }

    const hasEnoughData = prevIndex !== -1 && currIndex !== -1;

    const devMetrics = [
        { key: 'citas_iniciales', label: 'Citas Iniciales', icon: '📞' },
        { key: 'citas_cierre', label: 'Citas de Cierre', icon: '🎯' },
        { key: 'sesiones_11', label: 'Sesiones 1:1', icon: '🗣️' },
        { key: 'polizas', label: 'Pólizas', icon: '📄' },
        { key: 'contratos_firmados', label: 'Contratos Firmados', icon: '🏅' },
        { key: 'arranque_rapido', label: 'Acompañamientos / Arranques', icon: '⚡' },
        { key: 'tareas_actividades', label: 'Actividades/Tareas en Agenda', icon: '📅' },
    ];

    const hrConversionMetrics = [
        { key: 'activos_mes', label: 'Activos (Mes)', icon: '👥' },
        { key: 'ent_enamoramiento', label: 'Enamoramiento', icon: '💖' },
        { key: 'ent_compensacion', label: 'Compensación', icon: '💰' },
        { key: 'ent_administrativa', label: 'Administrativa', icon: '📁' },
        { key: 'sesiones_rda', label: 'Sesiones RDA Completadas', icon: '✅' },
    ];

    const hrProspectingMetrics = [
        { key: 'recluta_contactos', label: 'Contactos / Búsqueda', icon: '🔎', isVolume: true },
        { key: 'recluta_citas', label: 'Citas Recluta (Bitácora)', icon: '📅', isVolume: true },
        { key: 'recluta_entrevistas', label: 'Entrevistas Realizadas', icon: '🤝' },
    ];

    const metrics = person?.role === 'hr' ? [...hrConversionMetrics, ...hrProspectingMetrics] : devMetrics;

    let deltas: any[] = [];
    let totalGoldHours = 0;
    let intensity = "0";
    let conversionChartData: any[] = [];
    let volumeChartData: any[] = [];
    let prev: any = {};
    let curr: any = {};

    if (hasEnoughData && person?.history) {
        prev = person.history[prevIndex]?.data || {};
        curr = person.history[currIndex]?.data || {};

        deltas = metrics.map(m => ({
            key: m.key,
            label: m.label,
            gain: (curr[m.key] || 0) - (prev[m.key] || 0),
            prev: prev[m.key] || 0,
            curr: curr[m.key] || 0,
            isVolume: (m as any).isVolume
        }));

        // Solo sumar horas para Desarrollo
        if (person.role !== 'hr') {
            const excludeHours = ['tareas_actividades', 'polizas', 'contratos_firmados'];
            totalGoldHours = deltas.filter(d => !excludeHours.includes(d.key)).reduce((sum, d) => sum + d.gain, 0);
            intensity = ((totalGoldHours / 40) * 100).toFixed(0);
        }

        const excludeConversion = ['tareas_actividades', 'activos_mes', 'polizas', 'contratos_firmados'];
        conversionChartData = deltas.filter(d => !d.isVolume && !excludeConversion.includes(d.key)).map(d => ({ 
            name: d.label, 'Previo': d.prev, 'Actual': d.curr, 'Ganancia': d.gain 
        }));
        
        volumeChartData = deltas.filter(d => d.isVolume).map(d => ({ 
            name: d.label, 'Previo': d.prev, 'Actual': d.curr, 'Ganancia': d.gain 
        }));
    }

    const TableSection = ({ title, icon, data }: { title: string, icon: any, data: any[] }) => (
        <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{title}</h3>
                {icon}
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
                        {data.map(d => (
                            <tr key={d.label} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                <td style={{ padding: '20px 24px', fontWeight: 700, fontSize: '1rem' }}>{d.label}</td>
                                <td style={{ padding: '20px 24px', opacity: 0.5, textAlign: 'center', fontSize: '1rem' }}>{d.prev}</td>
                                <td style={{ padding: '20px 24px', fontWeight: 800, textAlign: 'center', fontSize: '1.2rem' }}>{d.curr}</td>
                                <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                                    <span style={{ padding: '6px 14px', borderRadius: '20px', background: d.gain >= 0 ? 'rgba(0,230,118,0.15)' : 'rgba(255,82,82,0.15)', color: d.gain >= 0 ? '#00E676' : '#FF5252', fontSize: '0.9rem', fontWeight: 900 }}>
                                        {d.gain > 0 ? `+${d.gain}` : d.gain}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const formatGain = (currVal: any, prevVal: any) => {
        const gain = Number(currVal || 0) - Number(prevVal || 0);
        return gain > 0 ? `+${gain}` : gain;
    };

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

                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        {availablePeriods.length > 1 && (
                            <select 
                                value={selectedPeriod} 
                                onChange={(e) => setSelectedPeriod(e.target.value)}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--glass-border)',
                                    background: 'rgba(255,255,255,0.05)',
                                    color: 'var(--text-primary)',
                                    fontSize: '0.85rem',
                                    fontWeight: 700,
                                    outline: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                {availablePeriods.map(p => (
                                    <option key={p.id} value={p.id} style={{ background: '#1e293b' }}>{p.label}</option>
                                ))}
                            </select>
                        )}

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
                                {staffData[key]?.name || 'Asesor'}
                            </button>
                        ))}
                    </div>
                </div>
                </div>

                {!hasEnoughData ? (
                    <div style={{ textAlign: 'center', padding: '100px 40px', color: 'var(--text-secondary)' }}>
                        <h2 style={{ color: 'white', marginBottom: '16px' }}>📉 Esperando datos de comparativa para {person?.name || activeStaff}</h2>
                        <p>{selectedPeriod !== 'latest' ? 'Se necesitan al menos 2 registros en este mes para calcular el crecimiento mensual.' : 'Necesitamos más de un registro para poder calcular el crecimiento semanal.'}</p>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'white' }}>
                                    💎 Mina de Oro — {person?.name || activeStaff}
                                </h1>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: '6px' }}>
                                    {selectedPeriod === 'latest' 
                                        ? `Comparativo: Martes ${person?.history?.[prevIndex]?.date || '?'} vs lunes ${person?.history?.[currIndex]?.date || '?'}`
                                        : `Comparativo Mensual: ${person?.history?.[prevIndex]?.date || '?'} vs ${person?.history?.[currIndex]?.date || '?'}`}
                                </p>
                            </div>
                            
                            {person?.role !== 'hr' ? (
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
                            {person?.role !== 'hr' ? (
                                <>
                                    <div className="glass-card" style={{ borderLeft: '4px solid #00E676', padding: '24px' }}>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>APROVECHAMIENTO SEMANAL</div>
                                        <div style={{ fontSize: '2.8rem', fontWeight: 900, color: '#00E676', margin: '8px 0' }}>{intensity}%</div>
                                        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Basado en 40 horas totales a la semana.</div>
                                        <div style={{ marginTop: '16px', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', position: 'relative' }}>
                                            <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${Math.min(parseInt(intensity) || 0, 100)}%`, background: '#00E676', borderRadius: '4px' }} />
                                        </div>
                                    </div>
                                    <div className="glass-card" style={{ borderLeft: '4px solid #FFD93D', padding: '24px' }}>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>TOTAL HORAS DE VALOR</div>
                                        <div style={{ fontSize: '2.8rem', fontWeight: 900, color: '#FFD93D', margin: '8px 0' }}>{totalGoldHours} hrs</div>
                                        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Suma del crecimiento en actividades críticas.</div>
                                    </div>
                                    <div className="glass-card" style={{ borderLeft: '4px solid #42A5F5', padding: '24px' }}>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>ACTIVIDADES COMPLETADAS EN AGENDA</div>
                                        <div style={{ fontSize: '2.8rem', fontWeight: 900, color: '#42A5F5', margin: '8px 0' }}>{formatGain(curr.tareas_actividades, prev.tareas_actividades)}</div>
                                        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Incremento en tareas totales registradas.</div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="glass-card" style={{ borderLeft: '4px solid #F50057', padding: '24px' }}>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>ENAMORAMIENTO</div>
                                        <div style={{ fontSize: '2.8rem', fontWeight: 900, color: '#F50057', margin: '8px 0' }}>{formatGain(curr.ent_enamoramiento, prev.ent_enamoramiento)}</div>
                                        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Crecimiento semanal de prospectos enamorados.</div>
                                    </div>
                                    <div className="glass-card" style={{ borderLeft: '4px solid #007AFF', padding: '24px' }}>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>ENTREVISTA REALIZADAS</div>
                                        <div style={{ fontSize: '2.8rem', fontWeight: 900, color: '#007AFF', margin: '8px 0' }}>{formatGain(curr.recluta_entrevistas, prev.recluta_entrevistas)}</div>
                                        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Nuevas entrevistas registradas en bitácora.</div>
                                    </div>
                                    <div className="glass-card" style={{ borderLeft: '4px solid #FFD93D', padding: '24px' }}>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>COMPENSACIÓN</div>
                                        <div style={{ fontSize: '2.8rem', fontWeight: 900, color: '#FFD93D', margin: '8px 0' }}>{formatGain(curr.ent_compensacion, prev.ent_compensacion)}</div>
                                        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Nuevas entrevistas de compensación cerradas.</div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Observaciones (Si existen) */}
                        {curr.observaciones && (
                            <div className="glass-card" style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', borderLeft: '4px solid #A855F7' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                    <span style={{ fontSize: '1.2rem' }}>💡</span>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', margin: 0 }}>Observaciones y Áreas de Mejora</h3>
                                </div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                                    {curr.observaciones}
                                </div>
                            </div>
                        )}

                        {/* Metrics Table(s) */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {person.role === 'hr' ? (
                                <>
                                    <TableSection 
                                        title="🔍 Desglose: Mina de Reclutamiento (Conversión)" 
                                        icon={<Activity size={20} color="#007AFF" />} 
                                        data={deltas.filter(d => hrConversionMetrics.some(m => m.key === d.key))}
                                    />
                                    <TableSection 
                                        title="📋 Desglose: Bitácora de Prospección (Esfuerzo)" 
                                        icon={<Activity size={20} color="#A855F7" />} 
                                        data={deltas.filter(d => hrProspectingMetrics.some(m => m.key === d.key))}
                                    />
                                </>
                            ) : (
                                <TableSection 
                                    title="🔍 Desglose Comparativo de Actividad" 
                                    icon={<Activity size={20} color="#007AFF" />} 
                                    data={deltas}
                                />
                            )}
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
