import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ThemeConfig } from '../types';
import { Search, ChevronDown, Check, X, Bell } from 'lucide-react';
import { BasesCampanasExplorer } from './BasesCampanasExplorer';

interface Props {
    theme: ThemeConfig | null;
    onAdvisorSelect: (name: string) => void;
}

const Welcome: React.FC<Props> = ({ theme, onAdvisorSelect }) => {
    const [advisors, setAdvisors] = useState<string[]>([]);
    const [selectedName, setSelectedName] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
    const [quote, setQuote] = useState<string>('');

    const quotes = [
        "El éxito no es el final, el fracaso no es fatal: lo que cuenta es el valor para continuar.",
        "Tu actitud, no tu aptitud, determinará tu altitud.",
        "La excelencia no es un acto, sino un hábito.",
        "Vender es servir. Servir es ganar.",
        "No encuentres clientes para tus productos, encuentra productos para tus clientes.",
        "El 80% del éxito es aparecer.",
        "Donde hay una empresa de éxito, alguien tomó alguna vez una decisión valiente.",
        "La mejor forma de predecir el futuro es creándolo.",
        "El único lugar donde el éxito viene antes que el trabajo es en el diccionario."
    ];

    useEffect(() => {
        fetch('/api/advisors')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setAdvisors(data.sort());
                } else {
                    setAdvisors([]);
                }
            })
            .catch(err => {
                console.error('Error fetching advisors:', err);
                setAdvisors([]);
            });
        setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
    }, []);

    const safeAdvisors = Array.isArray(advisors) ? advisors : [];
    const filteredAdvisors = searchTerm.length > 0
        ? safeAdvisors.filter(name => name && typeof name === 'string' && name.toLowerCase().includes(searchTerm.toLowerCase()))
        : safeAdvisors;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '100px' }}
        >
            {/* Main Logo & Header */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '-60px', zIndex: 20 }}>
                <img
                    src="/assets/logos/empresa/ambriz_logo.png"
                    alt="Logo"
                    style={{ width: '300px', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))' }}
                />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: theme?.colores?.acentos || 'var(--accent-gold)' }}>
                    ¡Hola!
                </h1>
                <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>
                    {theme?.config_home?.icono || '🏆'} {theme?.config_home?.subtitulo || 'Bienvenido al Portal de Campañas'}
                </p>
                <p style={{ fontStyle: 'italic', opacity: 0.6, fontSize: '0.95rem', marginTop: '10px' }}>"{quote}"</p>
            </div>

            {/* Notices */}
            <div
                className="glass-card"
                style={{
                    textAlign: 'left',
                    borderLeft: `4px solid ${theme?.colores?.acentos || 'var(--accent-gold)'}`,
                    padding: '24px'
                }}
            >
                <h4 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '20px', color: theme?.colores?.acentos || 'var(--accent-gold)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Bell size={26} /> Centro de Avisos
                </h4>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '1rem', color: 'var(--text-secondary)', padding: '0 8px' }}>
                    <li>
                        <span style={{ marginRight: '10px' }}>📱</span>
                        <strong style={{ color: 'var(--text-primary)' }}>Campaña ProactivaTech 2.0 (Junio – Agosto 2026)</strong>
                        <div style={{ marginLeft: '28px', marginTop: '4px', fontSize: '0.9rem' }}>
                            ¡Tus logros te pueden llevar a estrenar el nuevo iPhone! Cumple con tus metas de pólizas y comisiones para ganar desde unos <span style={{ fontWeight: 700 }}>AirPods Pro 3</span> hasta el <span style={{ color: 'var(--accent-gold)', fontWeight: 700 }}>iPhone 17 Pro Max</span>.
                        </div>
                    </li>
                    <li>
                        <span style={{ marginRight: '10px' }}>📈</span>
                        <strong style={{ color: 'var(--text-primary)' }}>Campaña Reto Por Ciento</strong>
                        <div style={{ marginLeft: '28px', marginTop: '4px', fontSize: '0.9rem' }}>
                            <span style={{ color: '#FF6B6B', fontWeight: 700 }}>"GANA EXTRA COMISIÓN"</span> SOLO ASESORES CONSOLIDADOS.
                        </div>
                    </li>
                    <li>
                        <span style={{ marginRight: '10px' }}>🤝</span>
                        <strong style={{ color: 'var(--text-primary)' }}>Bono de Conexión (Junio - Octubre 2026)</strong>
                        <div style={{ marginLeft: '28px', marginTop: '4px', fontSize: '0.9rem' }}>
                            ¡Obtén <span style={{ color: '#FF6B6B', fontWeight: 700 }}>$10,000 adicionales</span> de Bono de Conexión por cada Asesor referido conectado! (Aplica en el mes 1).
                        </div>
                    </li>
                    <li>
                        <span style={{ marginRight: '10px' }}>🛡️</span>
                        <strong style={{ color: 'var(--text-primary)' }}>Legión Centurión — ¡Objetivo Julio!</strong>
                        <div style={{ marginLeft: '28px', marginTop: '4px', fontSize: '0.9rem' }}>La meta para este mes es de <span style={{ color: 'var(--accent-gold)', fontWeight: 700 }}>28 pólizas acumuladas</span> como mínimo. Mantén el ritmo y asegura tu lugar en la élite de la promotoría.</div>
                    </li>
                </ul>
            </div>

            {/* Componente Dinámico de Bases */}
            <BasesCampanasExplorer themeColor={theme?.colores?.acentos || '#42A5F5'} />

            {/* Sección de Login forzada al final */}
            <div className="glass-card" style={{ maxWidth: '600px', margin: '20px auto 0', width: '100%', position: 'relative', padding: '32px' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '24px', color: 'var(--text-primary)' }}>
                    Accede a tus Resultados
                </h3>
                
                <div style={{ marginBottom: '24px', textAlign: 'left' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 600 }}>Busca y selecciona tu nombre para comenzar</label>
                    <div style={{ position: 'relative' }}>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '12px',
                                padding: '14px 16px',
                                transition: '0.3s border-color'
                            }}
                        >
                            <Search size={20} style={{ opacity: 0.5 }} />
                            <input
                                type="text"
                                placeholder="Escribe tu nombre..."
                                value={searchTerm || selectedName}
                                onFocus={() => {
                                    setShowSuggestions(true);
                                    if (selectedName) setSearchTerm(selectedName);
                                }}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setSelectedName('');
                                    setShowSuggestions(true);
                                }}
                                style={{
                                    flex: 1,
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--text-primary)',
                                    fontSize: '1.1rem',
                                    outline: 'none',
                                    fontFamily: 'inherit'
                                }}
                            />
                            {(searchTerm || selectedName) && (
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setSelectedName('');
                                    }}
                                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
                                >
                                    <X size={18} />
                                </button>
                            )}
                            <ChevronDown size={20} style={{ opacity: 0.5, transform: showSuggestions ? 'rotate(180deg)' : 'none', transition: '0.3s' }} />
                        </div>

                        {/* Suggestions Dropdown */}
                        {showSuggestions && (
                            <div
                                style={{
                                    position: 'absolute',
                                    bottom: '100%',
                                    left: 0,
                                    right: 0,
                                    background: '#1a1c22',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: '12px',
                                    marginBottom: '8px',
                                    maxHeight: '260px',
                                    overflowY: 'auto',
                                    zIndex: 100,
                                    boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
                                    padding: '8px'
                                }}
                            >
                                {filteredAdvisors.length > 0 ? (
                                    filteredAdvisors.map(name => (
                                        <button
                                            key={name}
                                            onClick={() => {
                                                setSelectedName(name);
                                                setSearchTerm('');
                                                setShowSuggestions(false);
                                            }}
                                            style={{
                                                width: '100%',
                                                padding: '12px 16px',
                                                textAlign: 'left',
                                                background: selectedName === name ? 'rgba(0,122,255,0.15)' : 'none',
                                                border: 'none',
                                                color: selectedName === name ? '#007AFF' : 'var(--text-primary)',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                fontSize: '1rem',
                                                transition: '0.2s',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginBottom: '2px'
                                            }}
                                            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                                            onMouseLeave={(e) => (e.currentTarget.style.background = selectedName === name ? 'rgba(0,122,255,0.15)' : 'none')}
                                        >
                                            {name}
                                            {selectedName === name && <Check size={18} />}
                                        </button>
                                    ))
                                ) : (
                                    <div style={{ padding: '20px', color: 'var(--text-secondary)', fontSize: '1rem' }}>No se encontraron asesores</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Click outside to close (Pseudo-implementation) */}
                {showSuggestions && (
                    <div
                        onClick={() => setShowSuggestions(false)}
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 90 }}
                    />
                )}

                {selectedName && (
                    <motion.button
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        onClick={() => {
                            // Register activity
                            fetch('/api/activity', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    asesor: selectedName,
                                    accion: 'Inició Sesión / Entró al Dashboard'
                                })
                            }).catch(e => console.error('Error logueando actividad', e));

                            onAdvisorSelect(selectedName);
                        }}
                        className="btn-primary"
                        style={{ width: '100%', padding: '18px', borderRadius: '12px', fontWeight: 700, fontSize: '1.1rem', cursor: 'pointer', marginTop: '16px' }}
                    >
                        Entrar a mi Perfil
                    </motion.button>
                )}
            </div>
        </motion.div>
    );
};

export default Welcome;
