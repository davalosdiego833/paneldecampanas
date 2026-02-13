import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    onSelectRole: (role: 'asesor' | 'admin') => void;
}

const LoginScreen: React.FC<Props> = ({ onSelectRole }) => {
    const [isAdminMode, setIsAdminMode] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAdminLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/admin/verify-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            const data = await res.json();
            if (data.success) {
                onSelectRole('admin');
            } else {
                setError('Contraseña incorrecta');
            }
        } catch (err) {
            setError('Error al conectar con el servidor');
        } finally {
            setLoading(false);
        }
    };

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
            {/* Background glow effect */}
            <div
                style={{
                    position: 'absolute',
                    top: '-30%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '600px',
                    height: '600px',
                    background: 'radial-gradient(circle, rgba(212, 175, 55, 0.08) 0%, transparent 70%)',
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
                    maxWidth: '480px',
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
                        width: '280px',
                        filter: 'drop-shadow(0 10px 30px rgba(212, 175, 55, 0.3))',
                    }}
                />

                {/* Title */}
                <div style={{ textAlign: 'center' }}>
                    <h1
                        style={{
                            fontSize: '1.8rem',
                            fontWeight: 700,
                            color: '#ffffff',
                            letterSpacing: '-0.02em',
                            marginBottom: '8px',
                        }}
                    >
                        Portal de Seguimiento
                    </h1>
                    <p
                        style={{
                            fontSize: '0.95rem',
                            color: '#9ca3af',
                            fontWeight: 400,
                        }}
                    >
                        {isAdminMode ? 'Ingresa la clave de administración' : 'Selecciona tu perfil para continuar'}
                    </p>
                </div>

                {/* Role selection card */}
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
                        minHeight: '260px',
                        justifyContent: 'center'
                    }}
                >
                    <AnimatePresence mode="wait">
                        {!isAdminMode ? (
                            <motion.div
                                key="roles"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
                            >
                                {/* Asesor Button */}
                                <motion.button
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => onSelectRole('asesor')}
                                    style={{
                                        width: '100%',
                                        padding: '20px 24px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '16px',
                                        background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0.05) 100%)',
                                        border: '1px solid rgba(212, 175, 55, 0.25)',
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        color: '#ffffff',
                                        fontFamily: 'inherit',
                                    }}
                                >
                                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #D4AF37 0%, #b8962e 100%)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 15px rgba(212, 175, 55, 0.3)' }}>
                                        <span style={{ fontSize: '24px' }}>👤</span>
                                    </div>
                                    <div style={{ textAlign: 'left', flex: 1 }}>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>Soy Asesor</div>
                                        <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '2px' }}>Consulta tus campañas y resultados</div>
                                    </div>
                                    <span style={{ fontSize: '1.2rem', color: '#D4AF37', opacity: 0.7 }}>→</span>
                                </motion.button>

                                {/* Administrador Button */}
                                <motion.button
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setIsAdminMode(true)}
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
                                        transition: 'all 0.2s ease',
                                        color: '#ffffff',
                                        fontFamily: 'inherit',
                                    }}
                                >
                                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #007AFF 0%, #005ec4 100%)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 15px rgba(0, 122, 255, 0.3)' }}>
                                        <span style={{ fontSize: '24px' }}>🛡️</span>
                                    </div>
                                    <div style={{ textAlign: 'left', flex: 1 }}>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>Soy Administrador</div>
                                        <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '2px' }}>Vista general de la promotoría</div>
                                    </div>
                                    <span style={{ fontSize: '1.2rem', color: '#007AFF', opacity: 0.7 }}>→</span>
                                </motion.button>
                            </motion.div>
                        ) : (
                            <motion.form
                                key="admin-login"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleAdminLogin}
                                style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
                            >
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', fontWeight: 500 }}>Contraseña Maestra</label>
                                    <input
                                        autoFocus
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        style={{
                                            width: '100%',
                                            padding: '14px 18px',
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(0, 122, 255, 0.3)',
                                            borderRadius: '10px',
                                            color: '#fff',
                                            fontSize: '1.1rem',
                                            outline: 'none',
                                            textAlign: 'center',
                                            letterSpacing: '0.3em'
                                        }}
                                    />
                                </div>

                                {error && (
                                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: '#FF6B6B', fontSize: '0.85rem', textAlign: 'center', margin: 0 }}>{error}</motion.p>
                                )}

                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button
                                        type="button"
                                        onClick={() => { setIsAdminMode(false); setPassword(''); setError(''); }}
                                        style={{ flex: 1, padding: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading || !password}
                                        style={{
                                            flex: 2,
                                            padding: '14px',
                                            background: 'linear-gradient(135deg, #007AFF 0%, #005ec4 100%)',
                                            border: 'none',
                                            borderRadius: '10px',
                                            color: '#fff',
                                            cursor: (loading || !password) ? 'not-allowed' : 'pointer',
                                            fontWeight: 700,
                                            fontSize: '0.9rem',
                                            boxShadow: '0 4px 15px rgba(0, 122, 255, 0.3)',
                                            opacity: (loading || !password) ? 0.6 : 1
                                        }}
                                    >
                                        {loading ? 'Verificando...' : 'Acceder'}
                                    </button>
                                </div>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.05em' }}>
                    AMBRIZ ASESORES © 2026
                </p>
            </motion.div>
        </div>
    );
};

export default LoginScreen;
