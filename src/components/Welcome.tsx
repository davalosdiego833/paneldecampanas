import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ThemeConfig } from '../types';
import { Search, ChevronDown, Check, X, Bell, Shield, GraduationCap, Plane, Users, Smartphone, TrendingUp, Stethoscope, Award } from 'lucide-react';
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

            {/* Executive Notice Center */}
            <div
                className="glass-card"
                style={{
                    textAlign: 'left',
                    borderLeft: `4px solid ${theme?.colores?.acentos || 'var(--accent-gold)'}`,
                    padding: '28px',
                    borderRadius: '16px',
                    background: 'rgba(15, 23, 42, 0.65)',
                    backdropFilter: 'blur(16px)',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                    <h4 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px', margin: 0 }}>
                        <div style={{
                            background: 'rgba(212, 175, 55, 0.15)',
                            border: '1px solid rgba(212, 175, 55, 0.3)',
                            borderRadius: '10px',
                            padding: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: theme?.colores?.acentos || 'var(--accent-gold)'
                        }}>
                            <Bell size={22} />
                        </div>
                        Centro de Avisos & Comunicados
                    </h4>
                    <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        padding: '5px 14px',
                        borderRadius: '20px',
                        background: 'rgba(212, 175, 55, 0.12)',
                        color: theme?.colores?.acentos || 'var(--accent-gold)',
                        border: '1px solid rgba(212, 175, 55, 0.25)'
                    }}>
                        Agosto 2026
                    </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* Item 1: Legión Centurión */}
                    <div style={{
                        padding: '16px 20px',
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        display: 'flex',
                        gap: '16px',
                        alignItems: 'flex-start'
                    }}>
                        <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(212, 175, 55, 0.15)', color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Shield size={20} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                                <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                                    Legión Centurión — Objetivo Agosto
                                </strong>
                                <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: '6px', background: 'rgba(212, 175, 55, 0.15)', color: 'var(--accent-gold)' }}>
                                    META DEL MES
                                </span>
                            </div>
                            <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                                La meta acumulada para este mes de Agosto es de <span style={{ color: 'var(--accent-gold)', fontWeight: 700 }}>32 pólizas acumuladas</span> como mínimo. Mantén el ritmo y asegura tu lugar en la élite de la promotoría.
                            </p>
                        </div>
                    </div>

                    {/* Item 2: Educar es Creer */}
                    <div style={{
                        padding: '16px 20px',
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        display: 'flex',
                        gap: '16px',
                        alignItems: 'flex-start'
                    }}>
                        <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(66, 165, 245, 0.15)', color: '#42A5F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <GraduationCap size={20} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                                <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                                    Campaña Educar Es Creer — Segubeca
                                </strong>
                                <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: '6px', background: 'rgba(66, 165, 245, 0.15)', color: '#42A5F5' }}>
                                    1 AGO – 30 SEP 2026
                                </span>
                            </div>
                            <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                                ¡En este regreso a clases Segubeca vale más!
                            </p>
                            <div style={{ marginTop: '8px', fontSize: '0.88rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div>• <strong style={{ color: 'var(--text-primary)' }}>Para Asesores:</strong> Ponderación en Cuaderno de Concursos para plazos ≥ 9 años sube al <span style={{ color: '#FF6B6B', fontWeight: 700 }}>120% en UDIS</span> y <span style={{ color: '#FF6B6B', fontWeight: 700 }}>75% en DLLS</span>. En Convenciones pondera al <span style={{ color: 'var(--accent-gold)', fontWeight: 700 }}>DOBLE</span>.</div>
                                <div>• <strong style={{ color: 'var(--text-primary)' }}>Para Clientes:</strong> Regalo de Kit de Regreso a Clases (lonchera, libreta y colores) para las primeras <span style={{ fontWeight: 700 }}>1,000 pólizas</span> emitidas y pagadas con prima anualizada ≥ $30,000.</div>
                            </div>
                        </div>
                    </div>

                    {/* Item 3: Bono 15 MDRT */}
                    <div style={{
                        padding: '16px 20px',
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        display: 'flex',
                        gap: '16px',
                        alignItems: 'flex-start'
                    }}>
                        <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(156, 39, 176, 0.15)', color: '#BA68C8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Plane size={20} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                                <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                                    Bono 15 MDRT — Asistencia a Orlando, Florida
                                </strong>
                                <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: '6px', background: 'rgba(156, 39, 176, 0.15)', color: '#BA68C8' }}>
                                    CONEXIÓN 2022 A 2026
                                </span>
                            </div>
                            <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                                Alcanza la meta de Miembro MDRT 2027 al 100% de producción SMNYL y asiste a la Reunión Anual 2027 en Orlando, Florida para recibir un <span style={{ color: 'var(--accent-gold)', fontWeight: 700 }}>Bono Especial de $15,000 MXN</span> abonado a tu estado de cuenta.
                            </p>
                        </div>
                    </div>

                    {/* Item 4: Mentores MDRT */}
                    <div style={{
                        padding: '16px 20px',
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        display: 'flex',
                        gap: '16px',
                        alignItems: 'flex-start'
                    }}>
                        <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(76, 175, 80, 0.15)', color: '#81C784', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Users size={20} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                                <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                                    Campaña Mentores MDRT 2026
                                </strong>
                                <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: '6px', background: 'rgba(255, 107, 107, 0.15)', color: '#FF6B6B' }}>
                                    REGISTRO LÍMITE: 31 AGO
                                </span>
                            </div>
                            <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                                ¡Impulsa a la próxima generación de Miembros MDRT y comparte tu camino al éxito!
                            </p>
                            <div style={{ marginTop: '8px', fontSize: '0.88rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div>• <strong style={{ color: 'var(--text-primary)' }}>Mentores (MDRT 2026):</strong> Reciben <span style={{ color: 'var(--accent-gold)', fontWeight: 700 }}>$15,000 MXN</span> por cada mentee que logre MDRT 2027 (hasta 3 mentees = $45,000 MXN).</div>
                                <div>• <strong style={{ color: 'var(--text-primary)' }}>Mentees:</strong> Asesores que nunca hayan sido MDRT reciben <span style={{ color: 'var(--accent-gold)', fontWeight: 700 }}>$15,000 MXN</span> al lograr su membresía y asistir a Orlando.</div>
                            </div>
                        </div>
                    </div>

                    {/* Item 5: ProactivaTech 2.0 */}
                    <div style={{
                        padding: '16px 20px',
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        display: 'flex',
                        gap: '16px',
                        alignItems: 'flex-start'
                    }}>
                        <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(0, 188, 212, 0.15)', color: '#4DD0E1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Smartphone size={20} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                                <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                                    Campaña ProactivaTech 2.0
                                </strong>
                                <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: '6px', background: 'rgba(255, 107, 107, 0.15)', color: '#FF6B6B' }}>
                                    CIERRE ESTE MES (AGOSTO)
                                </span>
                            </div>
                            <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                                ¡Último mes de la campaña! Cumple con tus metas de pólizas y comisiones para ganar desde unos <span style={{ fontWeight: 700 }}>AirPods Pro 3</span> hasta el <span style={{ color: 'var(--accent-gold)', fontWeight: 700 }}>iPhone 17 Pro Max</span>.
                            </p>
                        </div>
                    </div>

                    {/* Item 6: Bono de Conexión */}
                    <div style={{
                        padding: '16px 20px',
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        display: 'flex',
                        gap: '16px',
                        alignItems: 'flex-start'
                    }}>
                        <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(255, 152, 0, 0.15)', color: '#FFB74D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Award size={20} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                                <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                                    Bono de Conexión — Referidos
                                </strong>
                                <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: '6px', background: 'rgba(255, 152, 0, 0.15)', color: '#FFB74D' }}>
                                    JUNIO – OCTUBRE 2026
                                </span>
                            </div>
                            <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                                ¡Obtén <span style={{ color: '#FF6B6B', fontWeight: 700 }}>$10,000 MXN adicionales</span> de Bono de Conexión por cada Asesor referido conectado! (Aplica en el mes 1).
                            </p>
                        </div>
                    </div>

                    {/* Item 7: Reto Por Ciento */}
                    <div style={{
                        padding: '16px 20px',
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        display: 'flex',
                        gap: '16px',
                        alignItems: 'flex-start'
                    }}>
                        <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(233, 30, 99, 0.15)', color: '#F06292', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <TrendingUp size={20} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                                <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                                    Campaña Reto Por Ciento
                                </strong>
                                <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: '6px', background: 'rgba(233, 30, 99, 0.15)', color: '#F06292' }}>
                                    ASESORES CONSOLIDADOS
                                </span>
                            </div>
                            <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                                <span style={{ color: '#FF6B6B', fontWeight: 700 }}>"GANA EXTRA COMISIÓN"</span> incrementando tu producción en comparación con tu histórico.
                            </p>
                        </div>
                    </div>

                    {/* Item 8: Requisitos Médicos */}
                    <div style={{
                        padding: '16px 20px',
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        display: 'flex',
                        gap: '16px',
                        alignItems: 'flex-start'
                    }}>
                        <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(0, 150, 136, 0.15)', color: '#80CBC4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Stethoscope size={20} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                                <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                                    Tabla de Requisitos Médicos
                                </strong>
                                <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: '6px', background: 'rgba(0, 150, 136, 0.15)', color: '#80CBC4' }}>
                                    VIGENTE 2026
                                </span>
                            </div>
                            <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                                Consulta el tabulador actualizado con exámenes y requerimientos médicos por edad y suma asegurada en la sección de Bases PDF.
                            </p>
                        </div>
                    </div>
                </div>
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
