import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { NotificationBroadcastModal } from './NotificationBroadcastModal';
import { NotificationCenterModal } from './NotificationCenterModal';
import { DeviceManagerModal } from './DeviceManagerModal';
import { SlidersHorizontal, Bell, Send, Users, Activity, Info, ChevronDown, Smartphone } from 'lucide-react';

interface Props {
    onSelectOption: (option: 'asesores' | 'convenciones' | 'promotoria' | 'karen' | 'actividad' | 'meta24m' | 'staff' | 'centro_avisos' | 'infografias') => void;
    onLogout: () => void;
}

const AdminHome: React.FC<Props> = ({ onSelectOption, onLogout }) => {
    const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
    const [isNotifCenterOpen, setIsNotifCenterOpen] = useState(false);
    const [isDeviceManagerOpen, setIsDeviceManagerOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'radial-gradient(ellipse at top, #0f1219 0%, #080a0f 70%)',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Background glow */}
            <div
                style={{
                    position: 'absolute',
                    top: '-20%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '700px',
                    height: '700px',
                    background: 'radial-gradient(circle, rgba(0, 122, 255, 0.06) 0%, transparent 70%)',
                    pointerEvents: 'none',
                }}
            />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '40px',
                    padding: '48px',
                    maxWidth: '520px',
                    width: '100%',
                    position: 'relative',
                    zIndex: 10,
                }}
            >
                {/* Logo */}
                <motion.img
                    src="/assets/logos/empresa/ambriz_logo.png"
                    alt="Ambriz Asesores"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    style={{
                        width: '220px',
                        filter: 'drop-shadow(0 10px 30px rgba(0, 122, 255, 0.2))',
                    }}
                />

                {/* Title */}
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        display: 'inline-block',
                        padding: '6px 16px',
                        background: 'rgba(0, 122, 255, 0.15)',
                        border: '1px solid rgba(0, 122, 255, 0.3)',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: '#007AFF',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        marginBottom: '16px',
                    }}>
                        🛡️ Panel Administrador
                    </div>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
                        ¿Qué deseas consultar?
                    </h1>
                    <p style={{ fontSize: '0.9rem', color: '#9ca3af' }}>
                        Selecciona una opción para continuar
                    </p>
                </div>

                {/* Options Card */}
                <div
                    style={{
                        width: '100%',
                        background: 'rgba(255, 255, 255, 0.03)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '16px',
                        padding: '32px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                    }}
                >
                    {/* Meta Despacho 24M */}
                    <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                            fetch('/api/activity', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    asesor: "Administrador",
                                    accion: "Consultó Reporte Admin: Meta 24M"
                                })
                            }).catch(e => console.error('Error', e));
                            onSelectOption('meta24m');
                        }}
                        style={{
                            width: '100%',
                            padding: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0.05) 100%)',
                            border: '1px solid rgba(212, 175, 55, 0.3)',
                            borderRadius: '16px',
                            cursor: 'pointer',
                            color: '#ffffff',
                            fontFamily: 'inherit',
                            boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        {/* Glow effect */}
                        <div style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: 'radial-gradient(circle, rgba(212,175,55,0.1) 0%, transparent 60%)', pointerEvents: 'none' }} />

                        <div style={{
                            width: '56px', height: '56px', borderRadius: '14px',
                            background: 'linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, boxShadow: '0 4px 15px rgba(212, 175, 55, 0.4)',
                            zIndex: 1
                        }}>
                            <span style={{ fontSize: '28px' }}>🎯</span>
                        </div>
                        <div style={{ textAlign: 'left', flex: 1, zIndex: 1 }}>
                            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#D4AF37', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>Meta Anual 24M</div>
                            <div style={{ fontSize: '0.85rem', color: '#e5e7eb', marginTop: '4px', fontWeight: 500 }}>
                                Seguimiento mensual objetivo 2026
                            </div>
                        </div>
                        <span style={{ fontSize: '1.4rem', color: '#D4AF37', zIndex: 1 }}>→</span>
                    </motion.button>

                    {/* Resumen de Asesores */}
                    <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                            fetch('/api/activity', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    asesor: "Administrador",
                                    accion: "Consultó Reporte Admin: Resumen de Asesores"
                                })
                            }).catch(e => console.error('Error', e));
                            onSelectOption('asesores');
                        }}
                        style={{
                            width: '100%',
                            padding: '20px 24px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            background: 'linear-gradient(135deg, rgba(0, 230, 118, 0.12) 0%, rgba(0, 230, 118, 0.04) 100%)',
                            border: '1px solid rgba(0, 230, 118, 0.2)',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            color: '#ffffff',
                            fontFamily: 'inherit',
                        }}
                    >
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '12px',
                            background: 'linear-gradient(135deg, #00E676 0%, #00C853 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, boxShadow: '0 4px 15px rgba(0, 230, 118, 0.3)',
                        }}>
                            <span style={{ fontSize: '24px' }}>📊</span>
                        </div>
                        <div style={{ textAlign: 'left', flex: 1 }}>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>Resumen de Asesores</div>
                            <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '2px' }}>
                                KPIs, métricas y detalle por campaña
                            </div>
                        </div>
                        <span style={{ fontSize: '1.2rem', color: '#00E676', opacity: 0.7 }}>→</span>
                    </motion.button>

                    {/* Convenciones */}
                    <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                            fetch('/api/activity', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    asesor: "Administrador",
                                    accion: "Consultó Reporte Admin: Convenciones"
                                })
                            }).catch(e => console.error('Error', e));
                            onSelectOption('convenciones');
                        }}
                        style={{
                            width: '100%',
                            padding: '20px 24px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            background: 'linear-gradient(135deg, rgba(255, 184, 0, 0.12) 0%, rgba(255, 184, 0, 0.04) 100%)',
                            border: '1px solid rgba(255, 184, 0, 0.25)',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            color: '#ffffff',
                            fontFamily: 'inherit',
                        }}
                    >
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '12px',
                            background: 'linear-gradient(135deg, #FFB800 0%, #FF8800 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, boxShadow: '0 4px 15px rgba(255, 184, 0, 0.3)',
                        }}>
                            <span style={{ fontSize: '24px' }}>🏆</span>
                        </div>
                        <div style={{ textAlign: 'left', flex: 1 }}>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>Convenciones</div>
                            <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '2px' }}>
                                Calificación por Promotoría y Gerencia
                            </div>
                        </div>
                        <span style={{ fontSize: '1.2rem', color: '#FFB800', opacity: 0.8 }}>→</span>
                    </motion.button>

                    {/* Resumen de Promotoría */}
                    <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                            fetch('/api/activity', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    asesor: "Administrador",
                                    accion: "Consultó Reporte Admin: Resumen de Promotoría"
                                })
                            }).catch(e => console.error('Error', e));
                            onSelectOption('promotoria');
                        }}
                        style={{
                            width: '100%',
                            padding: '20px 24px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            background: 'linear-gradient(135deg, rgba(0, 122, 255, 0.12) 0%, rgba(0, 122, 255, 0.04) 100%)',
                            border: '1px solid rgba(0, 122, 255, 0.2)',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            color: '#ffffff',
                            fontFamily: 'inherit',
                        }}
                    >
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '12px',
                            background: 'linear-gradient(135deg, #007AFF 0%, #0055CC 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, boxShadow: '0 4px 15px rgba(0, 122, 255, 0.3)',
                        }}>
                            <span style={{ fontSize: '24px' }}>🏢</span>
                        </div>
                        <div style={{ textAlign: 'left', flex: 1 }}>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>Resumen de Promotoría</div>
                            <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '2px' }}>
                                Reportes financieros y salud del área
                            </div>
                        </div>
                        <span style={{ fontSize: '1.2rem', color: '#007AFF', opacity: 0.7 }}>→</span>
                    </motion.button>



                    {/* Gerencia Karen */}
                    <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                            fetch('/api/activity', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    asesor: "Administrador",
                                    accion: "Consultó Reporte Admin: Gerencia Karen"
                                })
                            }).catch(e => console.error('Error', e));
                            onSelectOption('karen');
                        }}
                        style={{
                            width: '100%',
                            padding: '20px 24px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            background: 'linear-gradient(135deg, rgba(0, 184, 217, 0.12) 0%, rgba(0, 184, 217, 0.04) 100%)',
                            border: '1px solid rgba(0, 184, 217, 0.2)',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            color: '#ffffff',
                            fontFamily: 'inherit',
                        }}
                    >
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '12px',
                            background: 'linear-gradient(135deg, #00B8D9 0%, #0097A7 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, boxShadow: '0 4px 15px rgba(0, 184, 217, 0.3)',
                        }}>
                            <span style={{ fontSize: '24px' }}>👔</span>
                        </div>
                        <div style={{ textAlign: 'left', flex: 1 }}>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>Gerencia Karen</div>
                            <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '2px' }}>
                                Sucursal 2856
                            </div>
                        </div>
                        <span style={{ fontSize: '1.2rem', color: '#00B8D9', opacity: 0.7 }}>→</span>
                    </motion.button>

                </div>

                {/* Back link */}
                <button
                    onClick={onLogout}
                    style={{
                        background: 'none', border: 'none', color: '#9ca3af',
                        cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'inherit',
                        display: 'flex', alignItems: 'center', gap: '6px',
                    }}
                >
                    ← Volver al inicio
                </button>
                <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '0.65rem', color: '#9ca3af', opacity: 0.3, letterSpacing: '0.1em', fontWeight: 600 }}>
                    VERSION v1.3.8 — HARMONY
                </div>
            </motion.div>

            {/* Admin Controls Dropdown Layer */}
            <div ref={menuRef} style={{
                position: 'absolute',
                top: '24px',
                right: '24px',
                zIndex: 50,
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
            }}>
                {/* Notification Center Bell Button */}
                <button
                    onClick={() => setIsNotifCenterOpen(true)}
                    style={{
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        background: 'rgba(15, 23, 42, 0.85)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '24px',
                        color: '#FFFFFF',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
                        position: 'relative'
                    }}
                    title="Centro de Avisos & Comunicados"
                >
                    <Bell size={15} color="#F59E0B" />
                    {unreadCount > 0 && (
                        <span style={{
                            background: '#F59E0B',
                            color: '#0F172A',
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            borderRadius: '10px',
                            padding: '1px 6px',
                            lineHeight: 1
                        }}>
                            {unreadCount}
                        </span>
                    )}
                </button>

                {/* Single Executive Dropdown Button */}
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    style={{
                        padding: '10px 18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        background: isMenuOpen ? 'rgba(0, 122, 255, 0.25)' : 'rgba(15, 23, 42, 0.85)',
                        backdropFilter: 'blur(12px)',
                        border: isMenuOpen ? '1px solid rgba(0, 122, 255, 0.5)' : '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '24px',
                        color: '#FFFFFF',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        letterSpacing: '0.05em',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)'
                    }}
                >
                    <SlidersHorizontal size={15} color="#60A5FA" />
                    <span>HERRAMIENTAS</span>
                    <ChevronDown size={14} color="#60A5FA" style={{ transform: isMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                </button>

                {/* Executive Dropdown Menu */}
                {isMenuOpen && (
                    <div style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        right: 0,
                        width: '240px',
                        background: 'rgba(15, 23, 42, 0.98)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '14px',
                        padding: '8px',
                        boxShadow: '0 20px 48px rgba(0, 0, 0, 0.6)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        zIndex: 100
                    }}>
                        <button
                            onClick={() => {
                                setIsMenuOpen(false);
                                if ((window as any).openPushPrompt) {
                                    (window as any).openPushPrompt();
                                }
                            }}
                            style={{
                                width: '100%',
                                padding: '10px 14px',
                                borderRadius: '10px',
                                border: 'none',
                                background: 'transparent',
                                color: '#FFFFFF',
                                fontSize: '0.83rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                textAlign: 'left',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 122, 255, 0.15)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            <Bell size={16} color="#60A5FA" /> Activar Notificaciones
                        </button>

                        <button
                            onClick={() => {
                                setIsMenuOpen(false);
                                setIsDeviceManagerOpen(true);
                            }}
                            style={{
                                width: '100%',
                                padding: '10px 14px',
                                borderRadius: '10px',
                                border: 'none',
                                background: 'transparent',
                                color: '#FFFFFF',
                                fontSize: '0.83rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                textAlign: 'left',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(52, 211, 153, 0.15)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            <Smartphone size={16} color="#34D399" /> Dispositivos Conectados
                        </button>

                        <button
                            onClick={() => {
                                setIsMenuOpen(false);
                                setIsBroadcastOpen(true);
                            }}
                            style={{
                                width: '100%',
                                padding: '10px 14px',
                                borderRadius: '10px',
                                border: 'none',
                                background: 'transparent',
                                color: '#FFFFFF',
                                fontSize: '0.83rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                textAlign: 'left',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 122, 255, 0.15)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            <Send size={16} color="#60A5FA" /> Enviar Comunicado
                        </button>

                        <button
                            onClick={() => {
                                setIsMenuOpen(false);
                                onSelectOption('staff');
                            }}
                            style={{
                                width: '100%',
                                padding: '10px 14px',
                                borderRadius: '10px',
                                border: 'none',
                                background: 'transparent',
                                color: '#94A3B8',
                                fontSize: '0.83rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                textAlign: 'left',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                                e.currentTarget.style.color = '#FFFFFF';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = '#94A3B8';
                            }}
                        >
                            <Users size={16} color="#94A3B8" /> Actividad Staff
                        </button>

                        <button
                            onClick={() => {
                                setIsMenuOpen(false);
                                onSelectOption('actividad');
                            }}
                            style={{
                                width: '100%',
                                padding: '10px 14px',
                                borderRadius: '10px',
                                border: 'none',
                                background: 'transparent',
                                color: '#94A3B8',
                                fontSize: '0.83rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                textAlign: 'left',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                                e.currentTarget.style.color = '#FFFFFF';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = '#94A3B8';
                            }}
                        >
                            <Activity size={16} color="#94A3B8" /> Actividad de la Página
                        </button>

                        <button
                            onClick={() => {
                                setIsMenuOpen(false);
                                fetch('/api/activity', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        asesor: "Administrador",
                                        accion: "Consultó Centro de Avisos"
                                    })
                                }).catch(e => console.error('Error', e));
                                onSelectOption('centro_avisos');
                            }}
                            style={{
                                width: '100%',
                                padding: '10px 14px',
                                borderRadius: '10px',
                                border: 'none',
                                background: 'transparent',
                                color: '#FF9F43',
                                fontSize: '0.83rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                textAlign: 'left',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 159, 67, 0.12)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            <Info size={16} color="#FF9F43" /> Centro de Avisos
                        </button>
                    </div>
                )}
            </div>

            {/* Notification Broadcast Modal */}
            <NotificationBroadcastModal
                isOpen={isBroadcastOpen}
                onClose={() => setIsBroadcastOpen(false)}
            />

            {/* Notification Center In-App History Modal */}
            <NotificationCenterModal
                isOpen={isNotifCenterOpen}
                onClose={() => setIsNotifCenterOpen(false)}
                role="admin"
                onUnreadCountChange={(count) => setUnreadCount(count)}
            />

            {/* Device Manager Modal */}
            <DeviceManagerModal
                isOpen={isDeviceManagerOpen}
                onClose={() => setIsDeviceManagerOpen(false)}
            />
        </div>
    );
};

export default AdminHome;
