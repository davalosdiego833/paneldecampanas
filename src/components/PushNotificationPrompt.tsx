import React, { useEffect, useState } from 'react';
import { Bell, CheckCircle2, X, Send, Power, ShieldCheck, Smartphone, RefreshCw } from 'lucide-react';

interface PushPromptProps {
    role: 'admin' | 'asesor';
    clave?: string;
    name?: string;
}

const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
};

export const PushNotificationPrompt: React.FC<PushPromptProps> = ({ role, clave, name }) => {
    const [showPrompt, setShowPrompt] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [status, setStatus] = useState<'idle' | 'loading' | 'testing' | 'success' | 'denied' | 'unsubscribed'>('idle');
    const [statusMsg, setStatusMsg] = useState('');

    useEffect(() => {
        const handleForceOpen = () => {
            setShowPrompt(true);
            checkSubscriptionStatus();
        };
        window.addEventListener('open_push_prompt', handleForceOpen);
        (window as any).openPushPrompt = handleForceOpen;

        checkSubscriptionStatus();

        return () => window.removeEventListener('open_push_prompt', handleForceOpen);
    }, [role, clave]);

    const checkSubscriptionStatus = async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            return;
        }

        if (Notification.permission === 'granted') {
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.getSubscription();
            if (sub) {
                setIsSubscribed(true);
                localStorage.setItem('push_notifications_enabled', 'true');
            } else {
                setIsSubscribed(false);
            }
        } else if (Notification.permission === 'default') {
            setIsSubscribed(false);
            const enabled = localStorage.getItem('push_notifications_enabled');
            if (!enabled) {
                setTimeout(() => setShowPrompt(true), 1500);
            }
        }
    };

    const registerSubscription = async () => {
        try {
            setStatus('loading');
            const reg = await navigator.serviceWorker.register('/sw.js');
            await navigator.serviceWorker.ready;

            const resKey = await fetch('/api/push/vapid-public-key');
            if (!resKey.ok) throw new Error('Could not fetch public key');
            const { publicKey } = await resKey.json();

            let sub = await reg.pushManager.getSubscription();
            if (!sub) {
                sub = await reg.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(publicKey)
                });
            }

            await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subscription: sub,
                    role,
                    clave: clave || 'UNKNOWN',
                    name: name || (role === 'admin' ? 'Administrador' : 'Asesor')
                })
            });

            setIsSubscribed(true);
            localStorage.setItem('push_notifications_enabled', 'true');
            setStatus('success');
            setStatusMsg('Notificaciones activadas exitosamente.');
            setTimeout(() => {
                setStatus('idle');
                setShowPrompt(false);
            }, 2500);
        } catch (err: any) {
            console.error('[PUSH PROMPT] Error al suscribir:', err);
            setStatus('idle');
        }
    };

    const handleEnable = async () => {
        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                await registerSubscription();
            } else {
                setStatus('denied');
                setStatusMsg('El permiso de notificaciones fue denegado en tu navegador.');
            }
        } catch (err) {
            console.error('[PUSH PROMPT] Error solicitando permiso:', err);
        }
    };

    const handleTestNotification = async () => {
        try {
            setStatus('testing');
            setStatusMsg('Enviando notificación de prueba...');
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.getSubscription();
            if (!sub) {
                await registerSubscription();
                return;
            }

            const res = await fetch('/api/push/test-device', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscription: sub, role })
            });

            if (res.ok) {
                setStatus('success');
                setStatusMsg('Notificación enviada. Revisa la pantalla de tu dispositivo.');
            } else {
                throw new Error('Error al enviar prueba');
            }

            setTimeout(() => {
                setStatus('idle');
                setStatusMsg('');
            }, 3000);
        } catch (err: any) {
            setStatus('idle');
            setStatusMsg('No se pudo enviar la prueba.');
        }
    };

    const handleUnsubscribe = async () => {
        try {
            setStatus('loading');
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.getSubscription();
            if (sub) {
                await fetch('/api/push/unsubscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ subscription: sub })
                });
                await sub.unsubscribe();
            }
            setIsSubscribed(false);
            localStorage.removeItem('push_notifications_enabled');
            setStatus('unsubscribed');
            setStatusMsg('Notificaciones desactivadas para este dispositivo.');
            setTimeout(() => {
                setStatus('idle');
                setShowPrompt(false);
            }, 2500);
        } catch (err) {
            console.error('[PUSH PROMPT] Error al desuscribir:', err);
            setStatus('idle');
        }
    };

    const handleDismiss = () => {
        localStorage.setItem('push_prompt_dismissed', 'true');
        setShowPrompt(false);
    };

    if (!showPrompt) return null;

    return (
        <div style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 99999,
            maxWidth: '400px',
            width: 'calc(100vw - 48px)',
            background: 'rgba(15, 23, 42, 0.96)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '16px',
            padding: '20px 24px',
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.6)',
            color: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, rgba(0, 122, 255, 0.2) 0%, rgba(0, 122, 255, 0.05) 100%)',
                        border: '1px solid rgba(0, 122, 255, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#007AFF'
                    }}>
                        <Bell size={20} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#FFFFFF', letterSpacing: '0.01em' }}>
                            {isSubscribed ? 'Configuración de Notificaciones' : 'Notificaciones en Dispositivo'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
                            {role === 'admin' ? 'Perfil: Administrador' : 'Perfil: Asesor'}
                        </div>
                    </div>
                </div>
                <button
                    onClick={handleDismiss}
                    style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', padding: '4px' }}
                >
                    <X size={18} />
                </button>
            </div>

            {/* Status Indicator */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: '8px',
                background: isSubscribed ? 'rgba(0, 230, 118, 0.08)' : 'rgba(255, 255, 255, 0.04)',
                border: isSubscribed ? '1px solid rgba(0, 230, 118, 0.25)' : '1px solid rgba(255, 255, 255, 0.08)',
                fontSize: '0.8rem',
                color: isSubscribed ? '#00E676' : '#94A3B8',
                fontWeight: 600
            }}>
                {isSubscribed ? <ShieldCheck size={16} /> : <Smartphone size={16} />}
                <span>
                    {isSubscribed 
                        ? 'Estado: Notificaciones Activas en este dispositivo' 
                        : 'Estado: Sin notificaciones registradas'}
                </span>
            </div>

            {/* Status Messages */}
            {statusMsg && (
                <div style={{
                    fontSize: '0.8rem',
                    color: status === 'success' ? '#00E676' : (status === 'denied' ? '#FF6B6B' : '#60A5FA'),
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                }}>
                    {status === 'success' && <CheckCircle2 size={15} />}
                    {status === 'testing' && <RefreshCw size={15} className="spin" />}
                    <span>{statusMsg}</span>
                </div>
            )}

            {/* Actions Panel */}
            {!isSubscribed ? (
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={handleEnable}
                        disabled={status === 'loading'}
                        style={{
                            flex: 1,
                            padding: '10px 16px',
                            borderRadius: '10px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #007AFF 0%, #0056B3 100%)',
                            color: '#FFFFFF',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 14px rgba(0, 122, 255, 0.3)'
                        }}
                    >
                        <Bell size={16} /> Activar Notificaciones
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button
                        onClick={handleTestNotification}
                        disabled={status === 'testing'}
                        style={{
                            width: '100%',
                            padding: '10px 16px',
                            borderRadius: '10px',
                            border: '1px solid rgba(0, 122, 255, 0.4)',
                            background: 'rgba(0, 122, 255, 0.1)',
                            color: '#60A5FA',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'all 0.2s'
                        }}
                    >
                        <Send size={15} /> Probar Notificación en este Celular
                    </button>

                    <button
                        onClick={handleUnsubscribe}
                        disabled={status === 'loading'}
                        style={{
                            width: '100%',
                            padding: '8px 16px',
                            borderRadius: '10px',
                            border: '1px solid rgba(255, 107, 107, 0.2)',
                            background: 'transparent',
                            color: '#FF6B6B',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            opacity: 0.8
                        }}
                    >
                        <Power size={13} /> Desactivar Notificaciones en este dispositivo
                    </button>
                </div>
            )}
        </div>
    );
};
