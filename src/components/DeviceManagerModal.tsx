import React, { useState, useEffect } from 'react';
import { Smartphone, X, RefreshCw, Trash2, CheckCircle2, AlertTriangle, Monitor, Laptop, ShieldCheck, Zap } from 'lucide-react';

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
    const [activeTab, setActiveTab] = useState<'devices' | 'onesignal'>('devices');
    const [devices, setDevices] = useState<DeviceSubscriptionItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [statusMsg, setStatusMsg] = useState('');

    // OneSignal Form States
    const [oneSignalAppId, setOneSignalAppId] = useState('');
    const [oneSignalApiKey, setOneSignalApiKey] = useState('');
    const [oneSignalEnabled, setOneSignalEnabled] = useState(true);
    const [oneSignalSaving, setOneSignalSaving] = useState(false);
    const [oneSignalMsg, setOneSignalMsg] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchDevices();
            fetchOneSignalConfig();
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

    const fetchOneSignalConfig = async () => {
        try {
            const res = await fetch('/api/onesignal/config');
            if (res.ok) {
                const data = await res.json();
                if (data.appId) setOneSignalAppId(data.appId);
                if (data.apiKey) setOneSignalApiKey(data.apiKey);
                if (typeof data.enabled === 'boolean') setOneSignalEnabled(data.enabled);
            }
        } catch (e) {
            console.error('[ONESIGNAL CONFIG] Error:', e);
        }
    };

    const handleSaveOneSignal = async () => {
        try {
            setOneSignalSaving(true);
            setOneSignalMsg('');
            const res = await fetch('/api/onesignal/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    appId: oneSignalAppId,
                    apiKey: oneSignalApiKey,
                    enabled: oneSignalEnabled
                })
            });

            if (res.ok) {
                setOneSignalMsg('Configuración OneSignal Enterprise guardada exitosamente.');
            } else {
                setOneSignalMsg('Error al guardar configuración.');
            }
        } catch (e) {
            setOneSignalMsg('Error de conexión con el servidor.');
        } finally {
            setOneSignalSaving(false);
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
                                Notificaciones & Dispositivos
                            </h3>
                            <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#94A3B8' }}>
                                Gestión de Envíos Masivos e Integración OneSignal
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

                {/* Navigation Tabs */}
                <div style={{
                    display: 'flex',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    backgroundColor: 'rgba(15, 23, 42, 0.5)',
                    padding: '0 24px'
                }}>
                    <button
                        onClick={() => setActiveTab('devices')}
                        style={{
                            padding: '14px 20px',
                            border: 'none',
                            borderBottom: activeTab === 'devices' ? '2px solid #38BDF8' : '2px solid transparent',
                            backgroundColor: 'transparent',
                            color: activeTab === 'devices' ? '#38BDF8' : '#94A3B8',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <Smartphone size={16} /> Dispositivos ({devices.length})
                    </button>

                    <button
                        onClick={() => setActiveTab('onesignal')}
                        style={{
                            padding: '14px 20px',
                            border: 'none',
                            borderBottom: activeTab === 'onesignal' ? '2px solid #E11D48' : '2px solid transparent',
                            backgroundColor: 'transparent',
                            color: activeTab === 'onesignal' ? '#E11D48' : '#94A3B8',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <Zap size={16} /> OneSignal Enterprise
                    </button>
                </div>

                {/* Tab Content */}
                <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                    {activeTab === 'devices' ? (
                        <>
                            {statusMsg && (
                                <div style={{
                                    marginBottom: '16px',
                                    padding: '12px 16px',
                                    borderRadius: '12px',
                                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                                    border: '1px solid rgba(59, 130, 246, 0.3)',
                                    color: '#93C5FD',
                                    fontSize: '0.85rem',
                                }}>
                                    {statusMsg}
                                </div>
                            )}

                            {loading && devices.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
                                    <RefreshCw size={24} className="spin" style={{ marginBottom: '8px' }} />
                                    <p style={{ margin: 0 }}>Cargando dispositivos...</p>
                                </div>
                            ) : devices.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94A3B8' }}>
                                    <AlertTriangle size={32} color="#F59E0B" style={{ marginBottom: '12px' }} />
                                    <h4 style={{ margin: '0 0 8px 0', color: '#F1F5F9' }}>Sin Dispositivos Registrados</h4>
                                    <p style={{ margin: 0, fontSize: '0.85rem', maxWidth: '400px', marginInline: 'auto' }}>
                                        No hay celulares ni computadoras conectadas aún. Los usuarios se registrarán automáticamente al abrir la App.
                                    </p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {devices.map((item, index) => {
                                        const formattedDate = item.subscribedAt ? new Date(item.subscribedAt).toLocaleString('es-MX', {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        }) : 'Reciente';

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
                                    })}
                                </div>
                            )}
                        </>
                    ) : (
                        /* OneSignal Enterprise Config Tab */
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{
                                padding: '16px 20px',
                                borderRadius: '16px',
                                backgroundColor: 'rgba(225, 29, 72, 0.12)',
                                border: '1px solid rgba(225, 29, 72, 0.3)',
                                color: '#FDA4AF'
                            }}>
                                <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: 800, color: '#F43F5E', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Zap size={18} /> Integración OneSignal Enterprise
                                </h4>
                                <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: '1.4' }}>
                                    Conecta las llaves de tu cuenta gratuita de OneSignal para garantizar la entrega instantánea al 100% en Apple Safari (iOS) y Google Chrome (Android).
                                </p>
                            </div>

                            {oneSignalMsg && (
                                <div style={{
                                    padding: '12px 16px',
                                    borderRadius: '12px',
                                    backgroundColor: oneSignalMsg.includes('Error') ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                    border: `1px solid ${oneSignalMsg.includes('Error') ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                                    color: oneSignalMsg.includes('Error') ? '#FCA5A5' : '#6EE7B7',
                                    fontSize: '0.85rem'
                                }}>
                                    {oneSignalMsg}
                                </div>
                            )}

                            <div>
                                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px', color: '#CBD5E1' }}>
                                    OneSignal App ID
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ej: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                                    value={oneSignalAppId}
                                    onChange={(e) => setOneSignalAppId(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        borderRadius: '10px',
                                        backgroundColor: '#1E293B',
                                        border: '1px solid rgba(255, 255, 255, 0.15)',
                                        color: '#FFFFFF',
                                        fontSize: '0.9rem',
                                        outline: 'none'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px', color: '#CBD5E1' }}>
                                    OneSignal REST API Key
                                </label>
                                <input
                                    type="password"
                                    placeholder="Ej: os_v2_app_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                    value={oneSignalApiKey}
                                    onChange={(e) => setOneSignalApiKey(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        borderRadius: '10px',
                                        backgroundColor: '#1E293B',
                                        border: '1px solid rgba(255, 255, 255, 0.15)',
                                        color: '#FFFFFF',
                                        fontSize: '0.9rem',
                                        outline: 'none'
                                    }}
                                />
                            </div>

                            <button
                                onClick={handleSaveOneSignal}
                                disabled={oneSignalSaving}
                                style={{
                                    padding: '14px 20px',
                                    borderRadius: '12px',
                                    backgroundColor: '#E11D48',
                                    color: '#FFFFFF',
                                    border: 'none',
                                    fontWeight: 800,
                                    fontSize: '0.95rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    boxShadow: '0 4px 14px rgba(225, 29, 72, 0.4)'
                                }}
                            >
                                {oneSignalSaving ? <RefreshCw size={18} className="spin" /> : <ShieldCheck size={18} />}
                                Guardar y Activar OneSignal
                            </button>
                        </div>
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
