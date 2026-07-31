import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, X, ExternalLink, Calendar, Info } from 'lucide-react';

export interface ComunicadoItem {
    id: string;
    timestamp: string;
    group: 'all' | 'admin' | 'asesor';
    title: string;
    body: string;
    url?: string;
    sender?: string;
}

interface NotificationCenterModalProps {
    isOpen: boolean;
    onClose: () => void;
    role: 'admin' | 'asesor';
    onUnreadCountChange?: (count: number) => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
    isOpen,
    onClose,
    role,
    onUnreadCountChange
}) => {
    const [comunicados, setComunicados] = useState<ComunicadoItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [readIds, setReadIds] = useState<string[]>(() => {
        try {
            return JSON.parse(localStorage.getItem('read_comunicados_ids') || '[]');
        } catch {
            return [];
        }
    });

    useEffect(() => {
        if (isOpen) {
            fetchHistory();
        }
    }, [isOpen, role]);

    useEffect(() => {
        const unreadCount = comunicados.filter(c => !readIds.includes(c.id)).length;
        if (onUnreadCountChange) {
            onUnreadCountChange(unreadCount);
        }
    }, [comunicados, readIds]);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/comunicados/history');
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    const filtered = data.filter((item: ComunicadoItem) => {
                        if (role === 'admin') return true;
                        return item.group === 'all' || item.group === 'asesor';
                    });
                    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                    setComunicados(filtered);
                }
            }
        } catch (e) {
            console.error('[NOTIF CENTER] Error cargando historial:', e);
        } finally {
            setLoading(false);
        }
    };

    const markAllAsRead = () => {
        const allIds = comunicados.map(c => c.id);
        setReadIds(allIds);
        localStorage.setItem('read_comunicados_ids', JSON.stringify(allIds));
    };

    const markAsRead = (id: string) => {
        if (!readIds.includes(id)) {
            const updated = [...readIds, id];
            setReadIds(updated);
            localStorage.setItem('read_comunicados_ids', JSON.stringify(updated));
        }
    };

    const handleActionClick = (item: ComunicadoItem) => {
        markAsRead(item.id);
        if (item.url) {
            if (item.url.startsWith('http')) {
                window.open(item.url, '_blank');
            } else {
                window.location.href = item.url;
            }
        }
    };

    if (!isOpen) return null;

    const unreadCount = comunicados.filter(c => !readIds.includes(c.id)).length;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
        }}>
            <div style={{
                backgroundColor: '#0F172A',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '24px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
                width: '100%',
                maxWidth: '600px',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: '85vh',
                overflow: 'hidden',
                color: '#F8FAFC',
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}>
                {/* Header Elegante y Minimalista */}
                <div style={{
                    padding: '20px 24px',
                    backgroundColor: 'rgba(30, 41, 59, 0.8)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#0F172A',
                            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
                        }}>
                            <Bell size={20} />
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#FFFFFF' }}>
                                    Centro de Avisos
                                </h3>
                                {unreadCount > 0 && (
                                    <span style={{
                                        backgroundColor: '#F59E0B',
                                        color: '#0F172A',
                                        fontSize: '0.7rem',
                                        fontWeight: 800,
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                    }}>
                                        {unreadCount} nuevo{unreadCount > 1 ? 's' : ''}
                                    </span>
                                )}
                            </div>
                            <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#94A3B8' }}>
                                Promotoría Ambriz & Dávalos S.C.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            color: '#94A3B8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                            e.currentTarget.style.color = '#FFFFFF';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                            e.currentTarget.style.color = '#94A3B8';
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Lista Limpia de Avisos */}
                <div style={{
                    padding: '20px 24px',
                    overflowY: 'auto',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                }}>
                    {loading && comunicados.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: '#94A3B8', fontSize: '0.9rem' }}>
                            Cargando avisos...
                        </div>
                    ) : comunicados.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: '#94A3B8' }}>
                            <Info size={36} style={{ margin: '0 auto 8px auto', opacity: 0.4 }} />
                            <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#CBD5E1' }}>
                                No hay avisos pendientes en este momento.
                            </p>
                        </div>
                    ) : (
                        comunicados.map(item => {
                            const isRead = readIds.includes(item.id);
                            const formattedDate = new Date(item.timestamp).toLocaleString('es-MX', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                            });

                            return (
                                <div
                                    key={item.id}
                                    onClick={() => markAsRead(item.id)}
                                    style={{
                                        padding: '16px 20px',
                                        borderRadius: '16px',
                                        backgroundColor: isRead ? 'rgba(30, 41, 59, 0.4)' : 'rgba(30, 41, 59, 0.9)',
                                        border: isRead ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(245, 158, 11, 0.35)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '8px',
                                        transition: 'all 0.2s',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {!isRead && (
                                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#F59E0B' }} />
                                            )}
                                            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: isRead ? '#E2E8F0' : '#FDE68A' }}>
                                                {item.title}
                                            </h4>
                                        </div>
                                        <span style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Calendar size={12} />
                                            {formattedDate}
                                        </span>
                                    </div>

                                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#CBD5E1', lineHeight: '1.5' }}>
                                        {item.body}
                                    </p>

                                    {item.url && (
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleActionClick(item);
                                                }}
                                                style={{
                                                    padding: '6px 14px',
                                                    borderRadius: '10px',
                                                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                                                    border: '1px solid rgba(245, 158, 11, 0.3)',
                                                    color: '#FBBF24',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 700,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = '#F59E0B';
                                                    e.currentTarget.style.color = '#0F172A';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.15)';
                                                    e.currentTarget.style.color = '#FBBF24';
                                                }}
                                            >
                                                <span>Ver información</span>
                                                <ExternalLink size={12} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer Minimalista: 2 Botones Claros */}
                <div style={{
                    padding: '16px 24px',
                    backgroundColor: 'rgba(30, 41, 59, 0.6)',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    {unreadCount > 0 ? (
                        <button
                            onClick={markAllAsRead}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '12px',
                                border: 'none',
                                backgroundColor: 'transparent',
                                color: '#F59E0B',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                cursor: 'pointer',
                            }}
                        >
                            <CheckCircle2 size={15} />
                            <span>Marcar todo como leído</span>
                        </button>
                    ) : (
                        <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Todos los avisos al día</span>
                    )}

                    <button
                        onClick={onClose}
                        style={{
                            padding: '8px 20px',
                            borderRadius: '12px',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            backgroundColor: '#334155',
                            color: '#FFFFFF',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'background 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#475569'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#334155'}
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};
