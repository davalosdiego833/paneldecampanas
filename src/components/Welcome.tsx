import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ThemeConfig } from '../types';

interface Props {
    theme: ThemeConfig | null;
    onAdvisorSelect: (name: string) => void;
}

const Welcome: React.FC<Props> = ({ theme, onAdvisorSelect }) => {
    const [advisors, setAdvisors] = useState<string[]>([]);
    const [selectedName, setSelectedName] = useState<string>('');
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
            .then(data => setAdvisors(data));
        setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
    }, []);

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

            <div className="glass-card" style={{ maxWidth: '500px', margin: '0 auto', width: '100%' }}>
                <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Selecciona tu nombre</label>
                    <select
                        className="input-modern"
                        value={selectedName}
                        onChange={(e) => setSelectedName(e.target.value)}
                        style={{ textAlign: 'center', fontWeight: 500 }}
                    >
                        <option value="" disabled>-- Elige un asesor --</option>
                        {advisors.map(name => (
                            <option key={name} value={name} style={{ color: '#000' }}>{name}</option>
                        ))}
                    </select>
                </div>

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
                    <button
                        onClick={() => onAdvisorSelect(selectedName)}
                        className="btn-primary"
                    >
                        Ver mis Resultados
                    </button>
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
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                    <li>⚽ <strong style={{ color: 'var(--text-primary)' }}>¡Nueva Campaña: Goliza de Pólizas! (Ene - Feb):</strong> Gana un balón TRIONDA 2026, playera de México o el combo Ray-Ban Meta.</li>
                    <li>💳 <strong style={{ color: 'var(--text-primary)' }}>Meses Sin Intereses (Ene - Mar):</strong> Promoción vigente para Nuevos Negocios y Renovaciones.</li>
                    <li>🏔️ <strong style={{ color: 'var(--text-primary)' }}>Comino a la Cumbre:</strong> Revisa tu avance actual.</li>
                    <li>🏆 <strong style={{ color: 'var(--text-primary)' }}>Meta MDRT 2026:</strong> Nueva meta de $1,810,400 PA.</li>
                </ul>
            </div>
        </motion.div>
    );
};

export default Welcome;
