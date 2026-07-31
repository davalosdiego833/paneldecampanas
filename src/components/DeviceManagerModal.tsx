import React, { useState, useEffect } from 'react';
import { Smartphone, X, RefreshCw, Trash2, CheckCircle2, AlertTriangle, Monitor, Laptop } from 'lucide-react';

export interface DeviceSubscriptionItem {
    endpoint: string;
    role: 'admin' | 'asesor';
    clave?: string;
    name?: string;
    deviceInfo?: string;
    subscribedAt?: string;
}

interface DeviceManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const DeviceManagerModal: React.FC<DeviceManagerModalProps> = ({ isOpen, onClose }) => {
    const [devices, setDevices] = useState<DeviceSubscriptionItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [statusMsg, setStatusMsg] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchDevices();
        }
    }, [isOpen]);

    const fetchDevices = async () => {
        try {
            setLoading(true);
            setStatusMsg('');
            const res = await fetch('/api/push/devices');
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    setDevices(data);
                }
            } else {
                setStatusMsg('No se pudo cargar la lista de dispositivos.');
            }
        } catch (e) {
            console.error('[DEVICE MANAGER] Error:', e);
            setStatusMsg('Error al conectar con el servidor.');
        } finally {
            setLoading(false);
        }
    };

    const handleRevoke = async (endpoint: string) => {
        if (!window.confirm('¿Estás seguro de desvincular este dispositivo? Ya no recibirá notificaciones.')) {
            return;
        }

        try {
            setLoading(true);
            const res = await fetch('/api/push/revoke', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ endpoint })
            });

            if (res.ok) {
                setDevices(prev => prev.filter(d => d.endpoint !== endpoint));
                setStatusMsg('Dispositivo desvinculado con éxito.');
            } else {
                setStatusMsg('No se pudo revocar la suscripción.');
            }
        } catch (e) {
            setStatusMsg('Error al procesar la desvinculación.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const getDeviceIcon = (deviceInfo?: string) => {
        if (!deviceInfo) return <Smartphone size={18} color="#F59E0B" />;
        if (deviceInfo.includes('iPhone') || deviceInfo.includes('iOS')) return <Smartphone size={18} color="#10B981" />;
        if (deviceInfo.includes('Android')) return <Smartphone size={18} color="#06B6D4" />;
        if (deviceInfo.includes('Mac')) return <Laptop size={18} color="#818CF8" />;
        return <Monitor size={18} color="#94A3B8" />;
    };

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
                maxWidth: '680px',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: '85vh',
                overflow: 'hidden',
                color: '#F8FAFC',
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}>
                {/* Header */}
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
                            background: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#0F172A',
                            boxShadow: '0 4px 12px rgba(6, 182, 212, 0.3)'
                        }}>
                            <Smartphone size={20} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#FFFFFF' }}>
                                Dispositivos Conectados
                            </h3>
                            <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#94A3B8' }}>
                                Celulares y Laptops con Notificaciones Activas
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
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Subheader */}
                <div style={{
                    padding: '12px 24px',
                    backgroundColor: 'rgba(30, 41, 59, 0.4)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#CBD5E1' }}>
                        Dispositivos Activos: <span style={{ color: '#38BDF8', fontWeight: 800 }}>{devices.length}</span>
                    </span>
                    <button
                        onClick={fetchDevices}
                        disabled={loading}
                        style={{
                            padding: '6px 12px',
                            borderRadius: '10px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            backgroundColor: '#1E293B',
                            color: '#CBD5E1',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            cursor: 'pointer',
                        }}
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        <span>Actualizar Lista</span>
                    </button>
                </div>

                {statusMsg && (
                    <div style={{
                        margin: '12px 24px 0 24px',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        backgroundColor: 'rgba(6, 182, 212, 0.15)',
                        border: '1px solid rgba(6, 182, 212, 0.3)',
                        color: '#67E8F9',
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <CheckCircle2 size={16} />
                        <span>{statusMsg}</span>
                    </div>
                )}

                {/* List */}
                <div style={{
                    padding: '20px 24px',
                    overflowY: 'auto',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                }}>
                    {loading && devices.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: '#94A3B8', fontSize: '0.9rem' }}>
                            Cargando dispositivos...
                        </div>
                    ) : devices.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: '#94A3B8' }}>
                            <AlertTriangle size={36} style={{ margin: '0 auto 8px auto', opacity: 0.4 }} />
                            <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#CBD5E1' }}>
                                No hay dispositivos registrados.
                            </p>
                        </div>
                    ) : (
                        devices.map((item, index) => {
                            const formattedDate = item.subscribedAt
                                ? new Date(item.subscribedAt).toLocaleString('es-MX', {
                                      day: '2-digit',
                                      month: 'short',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                  })
                                : 'Fecha no disponible';

                            return (
                                <div
                                    key={index}
                                    style={{
                                        padding: '14px 18px',
                                        borderRadius: '16px',
                                        backgroundColor: 'rgba(30, 41, 59, 0.7)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: '12px',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{
                                            width: '38px',
                                            height: '38px',
                                            borderRadius: '10px',
                                            backgroundColor: '#1E293B',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}>
                                            {getDeviceIcon(item.deviceInfo)}
                                        </div>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#FFFFFF' }}>
                                                    {item.name || 'Usuario Promotoría'}
                                                </h4>
                                                <span style={{
                                                    fontSize: '0.65rem',
                                                    fontWeight: 800,
                                                    padding: '2px 6px',
                                                    borderRadius: '6px',
                                                    backgroundColor: item.role === 'admin' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                                                    color: item.role === 'admin' ? '#FBBF24' : '#34D399',
                                                    border: `1px solid ${item.role === 'admin' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                                                    textTransform: 'uppercase'
                                                }}>
                                                    {item.role === 'admin' ? 'Admin' : 'Asesor'}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
                                                <span>{item.deviceInfo || 'Dispositivo Web'}</span>
                                                <span>Conectado: {formattedDate}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleRevoke(item.endpoint)}
                                        style={{
                                            padding: '6px 12px',
                                            borderRadius: '10px',
                                            backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                            border: '1px solid rgba(239, 68, 68, 0.3)',
                                            color: '#FCA5A5',
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <Trash2 size={13} />
                                        <span>Desvincular</span>
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '16px 24px',
                    backgroundColor: 'rgba(30, 41, 59, 0.6)',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                }}>
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
                        }}
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};
