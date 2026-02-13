import React from 'react';
import { motion } from 'framer-motion';

interface Props {
    onSelectOption: (option: 'asesores' | 'promotoria' | 'eduardo' | 'karen') => void;
    onLogout: () => void;
}

const AdminHome: React.FC<Props> = ({ onSelectOption, onLogout }) => {
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
                    {/* Resumen de Asesores */}
                    <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onSelectOption('asesores')}
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

                    {/* Resumen de Promotoría */}
                    <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onSelectOption('promotoria')}
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

                    {/* Gerencia Eduardo */}
                    <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onSelectOption('eduardo')}
                        style={{
                            width: '100%',
                            padding: '20px 24px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            background: 'linear-gradient(135deg, rgba(108, 92, 231, 0.12) 0%, rgba(108, 92, 231, 0.04) 100%)',
                            border: '1px solid rgba(108, 92, 231, 0.2)',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            color: '#ffffff',
                            fontFamily: 'inherit',
                        }}
                    >
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '12px',
                            background: 'linear-gradient(135deg, #6C5CE7 0%, #5A4BD1 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, boxShadow: '0 4px 15px rgba(108, 92, 231, 0.3)',
                        }}>
                            <span style={{ fontSize: '24px' }}>👔</span>
                        </div>
                        <div style={{ textAlign: 'left', flex: 1 }}>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>Gerencia Eduardo</div>
                            <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '2px' }}>
                                Sucursal 2692
                            </div>
                        </div>
                        <span style={{ fontSize: '1.2rem', color: '#6C5CE7', opacity: 0.7 }}>→</span>
                    </motion.button>

                    {/* Gerencia Karen */}
                    <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onSelectOption('karen')}
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
            </motion.div>
        </div>
    );
};

export default AdminHome;
