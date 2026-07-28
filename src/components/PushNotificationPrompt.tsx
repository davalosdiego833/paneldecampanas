import React, { useEffect, useState } from 'react';
import { Bell, CheckCircle, X } from 'lucide-react';

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
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'denied'>('idle');

    useEffect(() => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            return;
        }

        // Check current permission
        if (Notification.permission === 'granted') {
            // Already granted, silently register subscription in case token changed
            registerSubscription();
            return;
        }

        if (Notification.permission === 'default') {
            // Show prompt banner after 3 seconds
            const timer = setTimeout(() => {
                const dismissed = localStorage.getItem('push_prompt_dismissed');
                if (!dismissed) {
                    setShowPrompt(true);
                }
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [role, clave]);

    const registerSubscription = async () => {
        try {
            const reg = await navigator.serviceWorker.register('/sw.js');
            await navigator.serviceWorker.ready;

            const resKey = await fetch('/api/push/vapid-public-key');
            if (!resKey.ok) return;
            const { publicKey } = await resKey.json();

            const existingSub = await reg.pushManager.getSubscription();
            const sub = existingSub || await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey)
            });

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

            setStatus('success');
            setTimeout(() => setShowPrompt(false), 3000);
        } catch (err) {
            console.error('[PUSH PROMPT] Error al suscribir:', err);
        }
    };

    const handleEnable = async () => {
        setStatus('loading');
        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                await registerSubscription();
            } else {
                setStatus('denied');
                setTimeout(() => setShowPrompt(false), 4000);
            }
        } catch (err) {
            console.error('[PUSH PROMPT] Error solicitando permiso:', err);
            setShowPrompt(false);
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
            top: '20px',
            right: '20px',
            zIndex: 9999,
            maxWidth: '380px',
            width: 'calc(100vw - 40px)',
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 159, 67, 0.4)',
            borderRadius: '16px',
            padding: '16px 20px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            color: '#FFF',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            animation: 'fadeInSlide 0.3s ease-out'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #FF9F43 0%, #FF5252 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(255,159,67,0.3)'
                    }}>
                        <Bell size={20} color="#FFF" />
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#FFF' }}>Activa las Notificaciones 📲</div>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>
                            {role === 'admin' ? 'Avisos de reportes y campañas' : 'Alertas al actualizar campañas'}
                        </div>
                    </div>
                </div>
                <button
                    onClick={handleDismiss}
                    style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: '4px' }}
                >
                    <X size={18} />
                </button>
            </div>

            {status === 'idle' && (
                <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                    <button
                        onClick={handleEnable}
                        style={{
                            flex: 1,
                            padding: '10px',
                            borderRadius: '10px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #007AFF 0%, #00E676 100%)',
                            color: '#FFF',
                            fontWeight: 800,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            boxShadow: '0 4px 14px rgba(0,122,255,0.4)',
                            transition: 'all 0.2s'
                        }}
                    >
                        Activar en mi Celular
                    </button>
                    <button
                        onClick={handleDismiss}
                        style={{
                            padding: '10px 14px',
                            borderRadius: '10px',
                            border: '1px solid rgba(255,255,255,0.15)',
                            background: 'rgba(255,255,255,0.05)',
                            color: 'rgba(255,255,255,0.7)',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            cursor: 'pointer'
                        }}
                    >
                        Ahora no
                    </button>
                </div>
            )}

            {status === 'loading' && (
                <div style={{ textAlign: 'center', padding: '8px', fontSize: '0.85rem', color: '#FFD93D', fontWeight: 700 }}>
                    ⏳ Conectando con tu celular...
                </div>
            )}

            {status === 'success' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px', fontSize: '0.85rem', color: '#00E676', fontWeight: 800 }}>
                    <CheckCircle size={18} /> ¡Notificaciones activadas con éxito!
                </div>
            )}

            {status === 'denied' && (
                <div style={{ padding: '6px', fontSize: '0.8rem', color: '#FF6B6B' }}>
                    ⚠️ Notificaciones bloqueadas en tu navegador.
                </div>
            )}
        </div>
    );
};
