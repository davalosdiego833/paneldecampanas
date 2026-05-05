import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, ArrowLeft, Rocket, AlertTriangle, MessageSquare, CheckCircle, Filter, Trash2, RefreshCw } from 'lucide-react';

interface Alert {
    id: string;
    asesor: string;
    firstName: string;
    campaign: string;
    type: 'positive' | 'risk';
    event: string;
    message: string;
    sent: boolean;
}

interface AlertsData {
    generatedAt: string | null;
    totalNew: number;
    alerts: Alert[];
}

interface Props {
    onBack: () => void;
    themeMode: 'dark' | 'light';
}

const campaignLabels: Record<string, { label: string; icon: string }> = {
    proactivos: { label: 'Proactivos', icon: '📊' },
    pagado_emitido: { label: 'Pagado y Emitido', icon: '💰' },
    comparativo_vida: { label: 'Comparativo de Vida', icon: '📈' },
    mdrt: { label: 'MDRT', icon: '🏆' },
    convenciones: { label: 'Convenciones', icon: '🏛️' },
    camino_cumbre: { label: 'Camino a la Cumbre', icon: '⛰️' },
    legion_centurion: { label: 'Legión Centurión', icon: '🛡️' },
    graduacion: { label: 'Graduación', icon: '🎓' },
    fanfest: { label: 'Fan Fest', icon: '🎉' },
    vive_tu_pasion: { label: 'Vive tu Pasión', icon: '🔥' },
};

const CentroAvisos: React.FC<Props> = ({ onBack, themeMode }) => {
    const [data, setData] = useState<AlertsData>({ generatedAt: null, totalNew: 0, alerts: [] });
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState<'all' | 'positive' | 'risk'>('all');
    const [filterCampaign, setFilterCampaign] = useState<string>('all');
    const [filterSent, setFilterSent] = useState<'pending' | 'sent' | 'all'>('pending');
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const fetchAlerts = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/alertas');
            const json = await res.json();
            setData(json);
        } catch (e) {
            console.error('Error fetching alerts:', e);
        }
        setLoading(false);
    };

    useEffect(() => { fetchAlerts(); }, []);

    const handleCopy = async (alert: Alert) => {
        await navigator.clipboard.writeText(alert.message);
        setCopiedId(alert.id);
        setTimeout(() => setCopiedId(null), 2500);
        // Mark as sent
        try {
            await fetch(`/api/admin/alertas/${alert.id}/sent`, { method: 'POST' });
            setData(prev => ({
                ...prev,
                alerts: prev.alerts.map(a => a.id === alert.id ? { ...a, sent: true } : a)
            }));
        } catch (e) { /* silent */ }
    };

    const handleClearSent = async () => {
        try {
            await fetch('/api/admin/alertas/clear-sent', { method: 'DELETE' });
            setData(prev => ({
                ...prev,
                alerts: prev.alerts.filter(a => !a.sent)
            }));
        } catch (e) { /* silent */ }
    };

    const filtered = data.alerts.filter(a => {
        if (filterType !== 'all' && a.type !== filterType) return false;
        if (filterCampaign !== 'all' && a.campaign !== filterCampaign) return false;
        if (filterSent === 'pending' && a.sent) return false;
        if (filterSent === 'sent' && !a.sent) return false;
        return true;
    });

    const positiveCount = data.alerts.filter(a => a.type === 'positive' && !a.sent).length;
    const riskCount = data.alerts.filter(a => a.type === 'risk' && !a.sent).length;
    const campaigns = [...new Set(data.alerts.map(a => a.campaign))];

    const isDark = themeMode === 'dark';

    return (
        <div style={{
            minHeight: '100vh',
            background: isDark
                ? 'radial-gradient(ellipse at top, #0f1219 0%, #080a0f 70%)'
                : 'linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%)',
            color: isDark ? '#fff' : '#1a1a2e',
            fontFamily: "'Inter', sans-serif",
        }}>
            {/* Header */}
            <div style={{
                padding: '20px 32px',
                display: 'flex', alignItems: 'center', gap: '16px',
                borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`,
                background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(20px)',
                position: 'sticky', top: 0, zIndex: 100,
            }}>
                <button onClick={onBack} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: isDark ? '#fff' : '#333', display: 'flex', alignItems: 'center',
                }}>
                    <ArrowLeft size={20} />
                </button>
                <Bell size={24} style={{ color: '#007AFF' }} />
                <div>
                    <h1 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Centro de Avisos</h1>
                    {data.generatedAt && (
                        <p style={{ fontSize: '0.7rem', opacity: 0.5, margin: 0 }}>
                            Última generación: {data.generatedAt}
                        </p>
                    )}
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                    <button onClick={fetchAlerts} title="Recargar" style={{
                        background: 'rgba(0,122,255,0.1)', border: '1px solid rgba(0,122,255,0.3)',
                        borderRadius: '8px', padding: '8px 12px', cursor: 'pointer',
                        color: '#007AFF', display: 'flex', alignItems: 'center', gap: '6px',
                        fontSize: '0.75rem', fontWeight: 700,
                    }}>
                        <RefreshCw size={14} /> Recargar
                    </button>
                    {data.alerts.some(a => a.sent) && (
                        <button onClick={handleClearSent} title="Limpiar enviados" style={{
                            background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)',
                            borderRadius: '8px', padding: '8px 12px', cursor: 'pointer',
                            color: '#FF6B6B', display: 'flex', alignItems: 'center', gap: '6px',
                            fontSize: '0.75rem', fontWeight: 700,
                        }}>
                            <Trash2 size={14} /> Limpiar Enviados
                        </button>
                    )}
                </div>
            </div>

            <div style={{ padding: '24px 32px', maxWidth: '1000px', margin: '0 auto' }}>
                {/* Summary Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        style={{
                            padding: '24px', borderRadius: '16px',
                            background: isDark ? 'rgba(0,230,118,0.08)' : 'rgba(0,200,100,0.08)',
                            border: '1px solid rgba(0,230,118,0.2)',
                            cursor: 'pointer',
                            outline: filterType === 'positive' ? '2px solid #00E676' : 'none',
                        }}
                        onClick={() => setFilterType(filterType === 'positive' ? 'all' : 'positive')}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <Rocket size={24} style={{ color: '#00E676' }} />
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#00E676' }}>Noticias Positivas</span>
                        </div>
                        <p style={{ fontSize: '2.5rem', fontWeight: 900, margin: 0, color: '#00E676' }}>{positiveCount}</p>
                        <p style={{ fontSize: '0.75rem', opacity: 0.6, margin: 0 }}>avisos pendientes de enviar</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        style={{
                            padding: '24px', borderRadius: '16px',
                            background: isDark ? 'rgba(255,107,107,0.08)' : 'rgba(255,80,80,0.08)',
                            border: '1px solid rgba(255,107,107,0.2)',
                            cursor: 'pointer',
                            outline: filterType === 'risk' ? '2px solid #FF6B6B' : 'none',
                        }}
                        onClick={() => setFilterType(filterType === 'risk' ? 'all' : 'risk')}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <AlertTriangle size={24} style={{ color: '#FF6B6B' }} />
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FF6B6B' }}>Alertas de Riesgo</span>
                        </div>
                        <p style={{ fontSize: '2.5rem', fontWeight: 900, margin: 0, color: '#FF6B6B' }}>{riskCount}</p>
                        <p style={{ fontSize: '0.75rem', opacity: 0.6, margin: 0 }}>avisos pendientes de enviar</p>
                    </motion.div>
                </div>

                {/* Filters */}
                <div style={{
                    display: 'flex', gap: '8px', flexWrap: 'wrap',
                    marginBottom: '20px', alignItems: 'center',
                }}>
                    <Filter size={16} style={{ opacity: 0.5 }} />
                    <select
                        value={filterCampaign}
                        onChange={e => setFilterCampaign(e.target.value)}
                        style={{
                            background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                            borderRadius: '8px', padding: '8px 12px',
                            color: 'inherit', fontSize: '0.8rem', fontFamily: 'inherit',
                        }}
                    >
                        <option value="all">Todas las campañas</option>
                        {campaigns.map(c => (
                            <option key={c} value={c}>
                                {(campaignLabels[c]?.icon || '📋') + ' ' + (campaignLabels[c]?.label || c)}
                            </option>
                        ))}
                    </select>
                    <select
                        value={filterSent}
                        onChange={e => setFilterSent(e.target.value as any)}
                        style={{
                            background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                            borderRadius: '8px', padding: '8px 12px',
                            color: 'inherit', fontSize: '0.8rem', fontFamily: 'inherit',
                        }}
                    >
                        <option value="pending">⏳ Pendientes</option>
                        <option value="sent">✅ Enviados</option>
                        <option value="all">📋 Todos</option>
                    </select>
                    <span style={{ fontSize: '0.75rem', opacity: 0.5, marginLeft: '8px' }}>
                        {filtered.length} aviso(s)
                    </span>
                </div>

                {/* Alert List */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px', opacity: 0.5 }}>
                        <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite' }} />
                        <p>Cargando avisos...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        style={{
                            textAlign: 'center', padding: '60px',
                            background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                            borderRadius: '16px', border: `1px dashed ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                        }}
                    >
                        <Bell size={48} style={{ opacity: 0.2, marginBottom: '12px' }} />
                        <p style={{ fontSize: '1.1rem', fontWeight: 700, opacity: 0.5 }}>No hay avisos pendientes</p>
                        <p style={{ fontSize: '0.85rem', opacity: 0.4 }}>
                            Los avisos se generan automáticamente al actualizar los reportes.
                        </p>
                    </motion.div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <AnimatePresence>
                            {filtered.map((alert, i) => {
                                const campInfo = campaignLabels[alert.campaign] || { label: alert.campaign, icon: '📋' };
                                const isPositive = alert.type === 'positive';
                                const accentColor = isPositive ? '#00E676' : '#FF6B6B';
                                const isCopied = copiedId === alert.id;

                                return (
                                    <motion.div
                                        key={alert.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        transition={{ delay: i * 0.03 }}
                                        style={{
                                            padding: '20px',
                                            borderRadius: '14px',
                                            background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.7)',
                                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                                            borderLeft: `4px solid ${accentColor}`,
                                            opacity: alert.sent ? 0.5 : 1,
                                            transition: 'all 0.3s',
                                        }}
                                    >
                                        {/* Top Row */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                    <span style={{ fontSize: '1.1rem' }}>{isPositive ? '🚀' : '⚠️'}</span>
                                                    <span style={{ fontSize: '0.95rem', fontWeight: 800 }}>{alert.asesor}</span>
                                                    {alert.sent && <CheckCircle size={14} style={{ color: '#00E676' }} />}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{
                                                        fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px',
                                                        borderRadius: '6px',
                                                        background: `${accentColor}15`,
                                                        color: accentColor,
                                                    }}>
                                                        {campInfo.icon} {campInfo.label}
                                                    </span>
                                                    <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>{alert.event}</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleCopy(alert)}
                                                style={{
                                                    background: isCopied ? '#25D366' : 'rgba(37,211,102,0.1)',
                                                    border: '1px solid rgba(37,211,102,0.3)',
                                                    borderRadius: '10px', padding: '10px 16px',
                                                    color: isCopied ? '#fff' : '#25D366',
                                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                                                    fontSize: '0.8rem', fontWeight: 800,
                                                    transition: 'all 0.2s', whiteSpace: 'nowrap',
                                                    fontFamily: 'inherit',
                                                }}
                                            >
                                                {isCopied ? <CheckCircle size={16} /> : <MessageSquare size={16} />}
                                                {isCopied ? '¡Copiado!' : alert.sent ? 'Copiar de nuevo' : 'Copiar Mensaje'}
                                            </button>
                                        </div>

                                        {/* Message Preview */}
                                        <details style={{ marginTop: '8px' }}>
                                            <summary style={{
                                                fontSize: '0.75rem', opacity: 0.5, cursor: 'pointer',
                                                fontWeight: 600, userSelect: 'none',
                                            }}>
                                                👁️ Ver vista previa del mensaje
                                            </summary>
                                            <div style={{
                                                marginTop: '8px', padding: '14px',
                                                background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.03)',
                                                borderRadius: '10px', fontSize: '0.8rem',
                                                whiteSpace: 'pre-wrap', lineHeight: '1.6',
                                                opacity: 0.8, fontFamily: "'Inter', sans-serif",
                                                maxHeight: '300px', overflowY: 'auto',
                                            }}>
                                                {alert.message}
                                            </div>
                                        </details>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CentroAvisos;
