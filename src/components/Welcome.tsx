import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ThemeConfig } from '../types';

interface Props {
    theme: ThemeConfig | null;
    onAdvisorSelect: (name: string) => void;
}

import { Search, ChevronDown, Check, X } from 'lucide-react';

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
                setAdvisors(data.sort());
            });
        setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
    }, []);

    const filteredAdvisors = searchTerm.length > 0
        ? advisors.filter(name => name.toLowerCase().includes(searchTerm.toLowerCase()))
        : advisors;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '32px' }}
        >
            {/* Main Logo & Header */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '-60px', zIndex: 20 }}>
                <img
                    src="/assets/logos/empresa/ambriz_logo.png"
                    alt="Logo"
                    style={{ width: '300px', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))' }}
                />
            </div>

            <h2 style={{ fontSize: '1.8rem', fontWeight: 300, color: 'var(--text-primary)' }}>
                Bienvenido al Portal de Seguimiento
            </h2>

            <div className="glass-card" style={{ maxWidth: '500px', margin: '0 auto', width: '100%', position: 'relative' }}>
                <div style={{ marginBottom: '24px', textAlign: 'left' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>Busca y selecciona tu nombre</label>
                    <div style={{ position: 'relative' }}>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '12px',
                                padding: '12px 16px',
                                transition: '0.3s border-color'
                            }}
                        >
                            <Search size={18} style={{ opacity: 0.5 }} />
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
                                    fontSize: '1rem',
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
                                    <X size={16} />
                                </button>
                            )}
                            <ChevronDown size={18} style={{ opacity: 0.5, transform: showSuggestions ? 'rotate(180deg)' : 'none', transition: '0.3s' }} />
                        </div>

                        {/* Suggestions Dropdown */}
                        {showSuggestions && (
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    right: 0,
                                    background: '#1a1c22',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: '12px',
                                    marginTop: '8px',
                                    maxHeight: '260px',
                                    overflowY: 'auto',
                                    zIndex: 100,
                                    boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
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
                                                padding: '10px 16px',
                                                textAlign: 'left',
                                                background: selectedName === name ? 'rgba(0,122,255,0.15)' : 'none',
                                                border: 'none',
                                                color: selectedName === name ? '#007AFF' : 'var(--text-primary)',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                fontSize: '0.9rem',
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
                                            {selectedName === name && <Check size={16} />}
                                        </button>
                                    ))
                                ) : (
                                    <div style={{ padding: '20px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No se encontraron asesores</div>
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: theme?.colores.acentos || 'var(--accent-gold)' }}>
                        {selectedName ? `¡Hola, ${selectedName}!` : '¡Hola!'}
                    </h1>
                    <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
                        {theme?.config_home.icono} {theme?.config_home.subtitulo}
                    </p>
                    <p style={{ fontStyle: 'italic', opacity: 0.6, fontSize: '0.95rem' }}>"{quote}"</p>
                </div>

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
                        style={{ width: '100%', padding: '16px', borderRadius: '12px', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}
                    >
                        Ver mis Resultados
                    </motion.button>
                )}
            </div>

            {/* Notices */}
            <div
                className="glass-card"
                style={{
                    textAlign: 'left',
                    borderLeft: `4px solid ${theme?.colores.acentos || 'var(--accent-gold)'}`,
                    marginTop: '20px'
                }}
            >
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', color: theme?.colores.acentos || 'var(--accent-gold)' }}>
                    📢 Centro de Avisos de la Promotoría
                </h4>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                    <li>
                        <span style={{ marginRight: '10px' }}>🌟</span>
                        <strong style={{ color: 'var(--text-primary)' }}>MDRT DAY — ¡Alcanza la Gloria Mundial!</strong>
                        <div style={{ marginLeft: '28px', marginTop: '4px', fontSize: '0.9rem' }}>
                            El MDRT DAY es tu pasaporte a la élite internacional de asesores. Tu lugar en la Mesa del Millón te espera este junio en CDMX. 
                            <span style={{ color: 'var(--accent-gold)', fontWeight: 700 }}> Cierre en junio</span>. ¡Transforma hoy tu carrera y trasciende fronteras! 
                            Chequen las bases completas en el grupo de campañas.
                        </div>
                    </li>
                    <li>
                        <span style={{ marginRight: '10px' }}>🚀</span>
                        <strong style={{ color: 'var(--text-primary)' }}>Convenciones al Doble — ¡Acelera tu Vuelo al Éxito!</strong>
                        <div style={{ marginLeft: '28px', marginTop: '4px', fontSize: '0.9rem' }}>
                            ¡Aprovecha el impulso de abril! Durante todo el mes, tus créditos valen <span style={{ color: '#FF6B6B', fontWeight: 700 }}>X2 para Convenciones</span>. 
                            Es tu momento de brillar y escalar posiciones en el ranking. ¡Haz que cada esfuerzo cuente el doble!
                        </div>
                    </li>
                    <li>
                        <span style={{ marginRight: '10px' }}>⚽</span>
                        <strong style={{ color: 'var(--text-primary)' }}>Campaña Fan Fest (Ene - Abr)</strong>
                        <div style={{ marginLeft: '28px', marginTop: '4px', fontSize: '0.9rem' }}>¡Vive la pasión del Mundial! Vende <span style={{ color: 'var(--accent-gold)', fontWeight: 700 }}>6 pólizas</span> y gana un **Pase al Evento** y un **Jersey Exclusivo de SMNYL**.</div>
                    </li>
                    <li>
                        <span style={{ marginRight: '10px' }}>🔥</span>
                        <strong style={{ color: 'var(--text-primary)' }}>Vive Tu Pasión (Mar - May)</strong>
                        <div style={{ marginLeft: '28px', marginTop: '4px', fontSize: '0.9rem' }}>¡4 niveles de premios esperándote! Cumple con tus metas de pólizas y comisiones para ganar desde **Tecnología SONOS** hasta una **TV de 65"**.</div>
                    </li>
                    <li>
                        <span style={{ marginRight: '10px' }}>🛡️</span>
                        <strong style={{ color: 'var(--text-primary)' }}>Legión Centurión — ¡Objetivo Abril!</strong>
                        <div style={{ marginLeft: '28px', marginTop: '4px', fontSize: '0.9rem' }}>La meta para este mes es de <span style={{ color: 'var(--accent-gold)', fontWeight: 700 }}>16 pólizas acumuladas</span>. Mantén el ritmo y asegura tu lugar en la élite de la promotoría.</div>
                    </li>
                    <li>
                        <span style={{ marginRight: '10px' }}>📅</span>
                        <strong style={{ color: 'var(--text-primary)' }}>Junta Mensual: Lunes 13 de Abril</strong>
                        <div style={{ marginLeft: '28px', marginTop: '4px', fontSize: '0.9rem' }}>Nuestra reunión estratégica del mes. Análisis de resultados, reconocimientos y plan de vuelo para el segundo trimestre. ¡Te esperamos!</div>
                    </li>
                    <li>
                        <span style={{ marginRight: '10px' }}>💳</span>
                        <strong style={{ color: 'var(--text-primary)' }}>Meses Sin Intereses (Abr - Jun)</strong>
                        <div style={{ marginLeft: '28px', marginTop: '4px', fontSize: '0.9rem' }}>Aprovecha el impulso de los MSI para nuevos negocios y renovaciones. Es la herramienta clave para facilitar el pago a tus clientes durante este periodo.</div>
                    </li>
                </ul>
            </div>
        </motion.div>
    );
};

export default Welcome;
