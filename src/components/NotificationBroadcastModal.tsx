import React, { useState, useEffect } from 'react';
import { Megaphone, Send, FileText, Layers, Users, CheckCircle2, History, X, ExternalLink, Shield } from 'lucide-react';

interface BroadcastModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface BroadcastItem {
    id: string;
    title: string;
    body: string;
    url: string;
    group: string;
    timestamp: string;
    successCount: number;
}

const PRESET_DESTINATIONS = [
    { label: '🏆 Sección de Campañas', value: '/campanas' },
    { label: '📊 Resumen de Asesores', value: '/resumen-asesores' },
    { label: '🎯 Meta Anual 2026', value: '/meta-anual' },
    { label: '📄 PDF Tabla Requisitos Médicos', value: '/bases_campanas/CAMBIO%20TABLA%20REQUISITOS%20MEDICOS/Bases%20Tabla%20de%20requisitos%20me%CC%81dicos_VF.pdf' },
    { label: '📄 PDF Campañas Vigentes Agosto 2026', value: '/bases_campanas/Camapan%CC%83as%20Agosto/Campa%C3%B1as%20vigentes%20Agosto%202026.pdf' },
    { label: '📄 PDF Convenciones Asesores 2027', value: '/bases_campanas/Convenciones/Convenciones%20Asesores%20LP%202027.pdf' },
    { label: '📄 PDF Bono 15 MDRT', value: '/bases_campanas/BONO%2015%20MDRT/Bases%20Campa%C3%B1a%20Bono%2015%20MDRT.pdf' },
    { label: '📄 PDF Mentor MDRT 2026', value: '/bases_campanas/MENTOR%20MDRT%202026/Bases%20Mentor%20MDRT%202026.pdf' },
    { label: '📄 PDF Educar Es Creer (Asesores)', value: '/bases_campanas/EDUCAR%20ES%20CREER%20ASESORES/Campa%C3%B1a%20Educar%20Es%20Creer%20Asesores.pdf' },
    { label: '📄 PDF Educar Es Creer (Clientes)', value: '/bases_campanas/EDUCAR%20ES%20CREER%20CLIENTES/Campa%C3%B1a%20Educar%20Es%20Creer%20(Clientes).pdf' },
    { label: '📄 PDF Bases Camino a la Cumbre', value: '/bases_campanas/Camino%20a%20la%20cumbre/Bases%20Camino%20a%20la%20Cumbre_2026.pdf' },
    { label: '📄 PDF Bases Legión Centurión', value: '/bases_campanas/Legion/Legio%CC%81n%20Centurio%CC%81n%20Asesores%202026.pdf' },
    { label: '📄 PDF Bases MDRT 2026', value: '/bases_campanas/Legion/bases_mdrt_2026.pdf' },
    { label: '📄 PDF Bases Proactiva Tech 2.0', value: '/bases_campanas/Proactiva%20Tech/Campa%C3%B1a%20ProactivaTech%202.0%20Nueva%20Organizaci%C3%B3n%202026.pdf' },
    { label: '📄 PDF Bases Reto Por Ciento', value: '/bases_campanas/RETO%20POR%20CIENTO/Campa%C3%B1a%20Reto%20Por%20Ciento%202026.pdf' },
    { label: '📄 PDF Bono de Conexión', value: '/bases_campanas/Bono%20de%20conexion/Campa%C3%B1a%20%2B%20Bono%20de%20Conexi%C3%B3n%202026.pdf' },
    { label: '📄 PDF MSI Iniciales GMM', value: '/bases_campanas/MSI%20Iniciales/MSI%20Iniciales%20(jul-sep26.pdf' },
    { label: '📄 PDF MSI Renovación GMM', value: '/bases_campanas/MSI%20RENOVACION/Renovaci%C3%B3n%20GMM%20MSI%20(jul-sep26).pdf' },
    { label: '🔗 Enlace Externo o Personalizado', value: 'custom' },
];

export const NotificationBroadcastModal: React.FC<BroadcastModalProps> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');
    const [targetGroup, setTargetGroup] = useState<'asesor' | 'admin' | 'all'>('asesor');
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [selectedDestination, setSelectedDestination] = useState('/campanas');
    const [customUrl, setCustomUrl] = useState('');
    const [sending, setSending] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [history, setHistory] = useState<BroadcastItem[]>([]);

    useEffect(() => {
        if (isOpen) {
            fetchHistory();
        }
    }, [isOpen]);

    const fetchHistory = async () => {
        try {
            const res = await fetch('/api/push/history');
            if (res.ok) {
                const data = await res.json();
                setHistory(data);
            }
        } catch (e) {
            console.error('[BROADCAST] Error al cargar historial:', e);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !body.trim()) {
            setFeedback({ type: 'error', message: 'Por favor completa el título y el mensaje.' });
            return;
        }

        const finalUrl = selectedDestination === 'custom' ? customUrl.trim() : selectedDestination;

        try {
            setSending(true);
            setFeedback(null);

            const res = await fetch('/api/push/send-custom', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    group: targetGroup,
                    title: title.trim(),
                    body: body.trim(),
                    url: finalUrl || '/'
                })
            });

            const text = await res.text();
            let data: any = {};
            try {
                data = JSON.parse(text);
            } catch (e) {
                throw new Error(res.ok ? 'Respuesta procesada' : (text.slice(0, 100) || 'Error en la respuesta del servidor'));
            }

            if (res.ok && data.success) {
                setFeedback({
                    type: 'success',
                    message: `Comunicado enviado exitosamente. Alcance: ${data.result?.successCount || 0} dispositivos.`
                });
                setTitle('');
                setBody('');
                fetchHistory();
                setTimeout(() => {
                    setFeedback(null);
                }, 4000);
            } else {
                throw new Error(data.error || 'Error al despachar el comunicado');
            }
        } catch (err: any) {
            setFeedback({ type: 'error', message: err.message || 'Error al conectar con el servidor.' });
        } finally {
            setSending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 99990,
            background: 'rgba(5, 10, 24, 0.85)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
            <div style={{
                background: 'rgba(15, 23, 42, 0.98)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '20px',
                width: '100%',
                maxWidth: '620px',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 32px 64px rgba(0, 0, 0, 0.7)',
                overflow: 'hidden',
                color: '#FFFFFF'
            }}>
                {/* Modal Header */}
                <div style={{
                    padding: '24px 28px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'linear-gradient(135deg, rgba(0, 122, 255, 0.08) 0%, transparent 100%)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '12px',
                            background: 'rgba(0, 122, 255, 0.15)',
                            border: '1px solid rgba(0, 122, 255, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#60A5FA'
                        }}>
                            <Megaphone size={22} />
                        </div>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '0.01em' }}>
                                Centro de Comunicados
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '2px' }}>
                                Notificaciones Push Personalizadas a Celulares
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#64748B',
                            cursor: 'pointer',
                            padding: '6px',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div style={{
                    display: 'flex',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    background: 'rgba(0, 0, 0, 0.2)',
                    padding: '0 28px'
                }}>
                    <button
                        onClick={() => setActiveTab('create')}
                        style={{
                            padding: '14px 20px',
                            background: 'transparent',
                            border: 'none',
                            borderBottom: activeTab === 'create' ? '2px solid #007AFF' : '2px solid transparent',
                            color: activeTab === 'create' ? '#60A5FA' : '#94A3B8',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <Send size={16} /> Redactar Comunicado
                    </button>

                    <button
                        onClick={() => setActiveTab('history')}
                        style={{
                            padding: '14px 20px',
                            background: 'transparent',
                            border: 'none',
                            borderBottom: activeTab === 'history' ? '2px solid #007AFF' : '2px solid transparent',
                            color: activeTab === 'history' ? '#60A5FA' : '#94A3B8',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <History size={16} /> Historial de Avisos ({history.length})
                    </button>
                </div>

                {/* Body Content */}
                <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1 }}>
                    {feedback && (
                        <div style={{
                            padding: '12px 16px',
                            borderRadius: '10px',
                            marginBottom: '20px',
                            background: feedback.type === 'success' ? 'rgba(0, 230, 118, 0.1)' : 'rgba(255, 107, 107, 0.1)',
                            border: feedback.type === 'success' ? '1px solid rgba(0, 230, 118, 0.3)' : '1px solid rgba(255, 107, 107, 0.3)',
                            color: feedback.type === 'success' ? '#00E676' : '#FF6B6B',
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                        }}>
                            {feedback.type === 'success' && <CheckCircle2 size={18} />}
                            <span>{feedback.message}</span>
                        </div>
                    )}

                    {activeTab === 'create' ? (
                        <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {/* Audiencia */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94A3B8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Destinatarios (Audiencia)
                                </label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                                    {[
                                        { id: 'asesor', label: 'Asesores', desc: 'Promotoría general', icon: Users },
                                        { id: 'admin', label: 'Administradores', desc: 'Equipo interno', icon: Shield },
                                        { id: 'all', label: 'Todos', desc: 'Todos los celulares', icon: Layers }
                                    ].map(g => {
                                        const Icon = g.icon;
                                        const isSelected = targetGroup === g.id;
                                        return (
                                            <button
                                                key={g.id}
                                                type="button"
                                                onClick={() => setTargetGroup(g.id as any)}
                                                style={{
                                                    padding: '12px',
                                                    borderRadius: '12px',
                                                    border: isSelected ? '1px solid #007AFF' : '1px solid rgba(255, 255, 255, 0.1)',
                                                    background: isSelected ? 'rgba(0, 122, 255, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                                                    color: isSelected ? '#FFFFFF' : '#94A3B8',
                                                    cursor: 'pointer',
                                                    textAlign: 'left',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.85rem' }}>
                                                    <Icon size={16} color={isSelected ? '#60A5FA' : '#64748B'} />
                                                    {g.label}
                                                </div>
                                                <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '4px' }}>
                                                    {g.desc}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Título */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94A3B8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Título de la Notificación
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Ej: ¡Nueva Campaña Convención 2027!"
                                    maxLength={65}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        borderRadius: '10px',
                                        border: '1px solid rgba(255, 255, 255, 0.12)',
                                        background: 'rgba(0, 0, 0, 0.3)',
                                        color: '#FFFFFF',
                                        fontSize: '0.9rem',
                                        outline: 'none'
                                    }}
                                />
                            </div>

                            {/* Mensaje */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94A3B8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Mensaje del Comunicado
                                </label>
                                <textarea
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                    placeholder="Ej: Se han publicado las bases oficiales en PDF. Toca aquí para consultarlas directamente en el panel."
                                    rows={3}
                                    maxLength={180}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        borderRadius: '10px',
                                        border: '1px solid rgba(255, 255, 255, 0.12)',
                                        background: 'rgba(0, 0, 0, 0.3)',
                                        color: '#FFFFFF',
                                        fontSize: '0.9rem',
                                        outline: 'none',
                                        resize: 'vertical'
                                    }}
                                />
                            </div>

                            {/* Destino (Enlace en 1 Clic) */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94A3B8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Destino al Tocar la Notificación (Enlace en 1 Clic)
                                </label>
                                <select
                                    value={selectedDestination}
                                    onChange={(e) => setSelectedDestination(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        borderRadius: '10px',
                                        border: '1px solid rgba(255, 255, 255, 0.12)',
                                        background: '#0F172A',
                                        color: '#FFFFFF',
                                        fontSize: '0.85rem',
                                        outline: 'none',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {PRESET_DESTINATIONS.map((preset) => (
                                        <option key={preset.value} value={preset.value}>
                                            {preset.label}
                                        </option>
                                    ))}
                                </select>

                                {selectedDestination === 'custom' && (
                                    <input
                                        type="text"
                                        value={customUrl}
                                        onChange={(e) => setCustomUrl(e.target.value)}
                                        placeholder="Pegar URL completa (ej: https://ejemplo.com o /ruta)"
                                        style={{
                                            width: '100%',
                                            marginTop: '10px',
                                            padding: '12px 16px',
                                            borderRadius: '10px',
                                            border: '1px solid rgba(0, 122, 255, 0.4)',
                                            background: 'rgba(0, 122, 255, 0.05)',
                                            color: '#FFFFFF',
                                            fontSize: '0.85rem',
                                            outline: 'none'
                                        }}
                                    />
                                )}
                            </div>

                            {/* Footer / Submit */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    style={{
                                        padding: '12px 20px',
                                        borderRadius: '10px',
                                        border: '1px solid rgba(255, 255, 255, 0.15)',
                                        background: 'transparent',
                                        color: '#94A3B8',
                                        fontWeight: 600,
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={sending}
                                    style={{
                                        padding: '12px 24px',
                                        borderRadius: '10px',
                                        border: 'none',
                                        background: 'linear-gradient(135deg, #007AFF 0%, #0056B3 100%)',
                                        color: '#FFFFFF',
                                        fontWeight: 700,
                                        fontSize: '0.9rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        boxShadow: '0 4px 16px rgba(0, 122, 255, 0.3)'
                                    }}
                                >
                                    <Send size={16} /> {sending ? 'Despachando...' : 'Enviar Comunicado Instantáneo'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        /* Historial Tab */
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {history.length === 0 ? (
                                <div style={{ textAlign: 'center', color: '#64748B', padding: '40px 0', fontSize: '0.9rem' }}>
                                    No se han enviado comunicados personalizados aún.
                                </div>
                            ) : (
                                history.map((item) => (
                                    <div
                                        key={item.id}
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.03)',
                                            border: '1px solid rgba(255, 255, 255, 0.08)',
                                            borderRadius: '12px',
                                            padding: '16px 18px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '8px'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#FFFFFF' }}>
                                                {item.title}
                                            </div>
                                            <span style={{
                                                fontSize: '0.7rem',
                                                padding: '3px 8px',
                                                borderRadius: '6px',
                                                background: 'rgba(0, 122, 255, 0.15)',
                                                color: '#60A5FA',
                                                fontWeight: 600
                                            }}>
                                                {item.group === 'asesor' ? 'Asesores' : (item.group === 'admin' ? 'Administradores' : 'Todos')}
                                            </span>
                                        </div>

                                        <div style={{ fontSize: '0.85rem', color: '#CBD5E1', lineHeight: '1.4' }}>
                                            {item.body}
                                        </div>

                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            fontSize: '0.75rem',
                                            color: '#64748B',
                                            marginTop: '4px',
                                            paddingTop: '8px',
                                            borderTop: '1px solid rgba(255, 255, 255, 0.05)'
                                        }}>
                                            <span>{new Date(item.timestamp).toLocaleString('es-MX')}</span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#00E676' }}>
                                                <CheckCircle2 size={13} /> {item.successCount} dispositivos alcanzados
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
