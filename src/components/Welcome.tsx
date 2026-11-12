import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeConfig } from '../types';
import { Search, ChevronDown, Check, X, Bell, Shield, GraduationCap, Plane, Users, Smartphone, Stethoscope, BarChart3, Car, Gift, Heart, CreditCard, FileText, Eye, Trophy, ArrowLeft } from 'lucide-react';
import { BasesCampanasExplorer } from './BasesCampanasExplorer';
import { AdvisorReportModal, REPORT_CONFIGS, ReportKey } from './AdvisorReportModal';
import { PdfViewerModal } from './PdfViewerModal';
import CierreMes from './Dashboards/CierreMes';

interface Props {
    theme: ThemeConfig | null;
    onAdvisorSelect: (name: string) => void;
}

interface AdvisorEntry {
    clave: string;
    name: string;
}

const Welcome: React.FC<Props> = ({ theme, onAdvisorSelect }) => {
    const [advisors, setAdvisors] = useState<AdvisorEntry[]>([]);
    const [selectedName, setSelectedName] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
    const [quote, setQuote] = useState<string>('');
    const [isAvisosOpen, setIsAvisosOpen] = useState<boolean>(false);
    const [selectedReportKey, setSelectedReportKey] = useState<ReportKey | null>(null);
    const [selectedPdf, setSelectedPdf] = useState<{ title: string; path: string } | null>(null);
    const [showCierreMes, setShowCierreMes] = useState<boolean>(false);

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
        fetch('/api/advisors-with-clave')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setAdvisors(data);
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
        ? safeAdvisors.filter(a =>
            a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.clave.includes(searchTerm)
        )
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

            {/* Reportes Ejecutivos de Promotoría para Asesores */}
            <div 
                className="glass-card" 
                style={{ 
                    padding: '24px', 
                    borderRadius: '16px', 
                    borderLeft: '4px solid #007AFF', 
                    textAlign: 'left'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ background: 'rgba(0, 122, 255, 0.15)', border: '1px solid rgba(0, 122, 255, 0.3)', borderRadius: '10px', padding: '8px', display: 'flex' }}>
                            <BarChart3 size={22} color="#007AFF" />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                                Reportes Promotoría
                            </h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                                Consulta métricas y producción de la promotoría
                            </p>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                    {(Object.keys(REPORT_CONFIGS) as ReportKey[]).map(key => {
                        const cfg = REPORT_CONFIGS[key];
                        return (
                            <button
                                key={key}
                                onClick={() => setSelectedReportKey(key)}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '16px 10px',
                                    borderRadius: '14px',
                                    border: `1px solid ${cfg.color}35`,
                                    background: 'var(--glass-bg)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    position: 'relative',
                                    gap: '8px',
                                    textAlign: 'center'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-3px)';
                                    e.currentTarget.style.background = `${cfg.color}20`;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.background = 'var(--glass-bg)';
                                }}
                            >
                                {cfg.status === 'upcoming' && (
                                    <span style={{
                                        position: 'absolute',
                                        top: '6px',
                                        right: '6px',
                                        fontSize: '0.6rem',
                                        fontWeight: 800,
                                        background: 'rgba(255, 183, 77, 0.15)',
                                        color: '#FFB74D',
                                        border: '1px solid rgba(255, 183, 77, 0.3)',
                                        borderRadius: '6px',
                                        padding: '1px 5px'
                                    }}>
                                        Próximamente
                                    </span>
                                )}
                                <div style={{
                                    width: '42px',
                                    height: '42px',
                                    borderRadius: '12px',
                                    background: `${cfg.color}15`,
                                    border: `1px solid ${cfg.color}30`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: cfg.color
                                }}>
                                    {cfg.icon}
                                </div>
                                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                                    {cfg.title}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Cierre de Mes y Campeones */}
            <div
                className="glass-card"
                style={{
                    padding: '24px',
                    borderRadius: '16px',
                    borderLeft: '4px solid var(--accent-gold)',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '16px'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: 'rgba(212, 175, 55, 0.15)', border: '1px solid rgba(212, 175, 55, 0.3)', borderRadius: '10px', padding: '8px', display: 'flex', color: 'var(--accent-gold)' }}>
                        <Trophy size={22} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                            Cierre de Mes y Campeones
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                            Producción del mes y los campeones de cada categoría
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setShowCierreMes(true)}
                    className="btn-primary"
                    style={{ padding: '12px 22px', borderRadius: '10px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                    Ver Cierre de Mes
                </button>
            </div>

            {/* Executive Notice Center (Abanico Desplegable) — oculto temporalmente; quitar display:'none' para volver a mostrarlo */}
            <div
                className="glass-card"
                style={{
                    display: 'none',
                    textAlign: 'left',
                    borderLeft: `4px solid ${theme?.colores?.acentos || 'var(--accent-gold)'}`,
                    padding: '20px 24px',
                    borderRadius: '16px',
                    transition: 'all 0.3s ease'
                }}
            >
                <div
                    onClick={() => setIsAvisosOpen(!isAvisosOpen)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        userSelect: 'none',
                        flexWrap: 'wrap',
                        gap: '12px'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
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
                        <h4 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                            Centro de Avisos & Comunicados
                        </h4>
                        <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '4px 10px',
                            borderRadius: '20px',
                            background: 'rgba(212, 175, 55, 0.15)',
                            color: theme?.colores?.acentos || 'var(--accent-gold)',
                            border: '1px solid rgba(212, 175, 55, 0.3)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: theme?.colores?.acentos || 'var(--accent-gold)' }} />
                            9 Comunicados
                        </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            padding: '5px 14px',
                            borderRadius: '20px',
                            background: 'rgba(255, 255, 255, 0.06)',
                            color: 'var(--text-secondary)',
                            border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                            Septiembre 2026
                        </span>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 14px',
                            borderRadius: '10px',
                            background: isAvisosOpen ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                            border: isAvisosOpen ? '1px solid rgba(212, 175, 55, 0.4)' : '1px solid rgba(255, 255, 255, 0.15)',
                            color: isAvisosOpen ? (theme?.colores?.acentos || 'var(--accent-gold)') : 'var(--text-primary)',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            transition: 'all 0.2s ease'
                        }}>
                            <span>{isAvisosOpen ? 'Ocultar Avisos' : 'Ver Avisos (Abanico)'}</span>
                            <ChevronDown
                                size={18}
                                style={{
                                    transform: isAvisosOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.3s ease'
                                }}
                            />
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    {isAvisosOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.35, ease: 'easeInOut' }}
                            style={{ overflow: 'hidden' }}
                        >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', marginTop: '16px' }}>
                                {/* Item 1: Conduce tu Éxito 2026 */}
                                <div style={{ padding: '16px 20px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(212, 175, 55, 0.3)', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                                    <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(212, 175, 55, 0.15)', color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Car size={20} /></div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                                            <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 700 }}>🏎️ Campaña Cierre de Año "Conduce tu Éxito 2026"</strong>
                                            <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: '6px', background: 'rgba(212, 175, 55, 0.15)', color: 'var(--accent-gold)' }}>1 SEP – 31 DIC 2026</span>
                                        </div>
                                        <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>¡Cierra el año estrenando auto! Gana un <span style={{ color: 'var(--accent-gold)', fontWeight: 700 }}>BMW X1 Híbrido Conectable</span> (1er lugar Nacional) o un <span style={{ color: '#42A5F5', fontWeight: 700 }}>Toyota Prius HEV</span> en tu Dirección Comercial. Además, califica a bonos en efectivo de <span style={{ color: '#66BB6A', fontWeight: 700 }}>$7,000, $10,000 y $15,000 MXN</span>. *Pólizas Momentum cuentan con 50% adicional en conteo.*</p>
                                        <button 
                                            onClick={() => setSelectedPdf({ title: 'Campaña Conduce tu Éxito 2026', path: '/bases_campanas/Conduce%20Tu%20Exito%202026/Campa%C3%B1a%20Conduce%20Tu%20%C3%89xito%202026.pdf' })}
                                            style={{ marginTop: '10px', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', background: 'rgba(212, 175, 55, 0.15)', border: '1px solid rgba(212, 175, 55, 0.4)', color: 'var(--accent-gold)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                                        >
                                            <Eye size={14} /> 📄 Ver PDF Oficial
                                        </button>
                                    </div>
                                </div>
                                {/* Item 2: Tú Primero Noviembre 2026 */}
                                <div style={{ padding: '16px 20px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                                    <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(41, 182, 246, 0.15)', color: '#4FC3F7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Heart size={20} /></div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                                            <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 700 }}>💙 Campaña Tú Primero — Pólizas Personales</strong>
                                            <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: '6px', background: 'rgba(41, 182, 246, 0.15)', color: '#4FC3F7' }}>1 – 30 NOV 2026</span>
                                        </div>
                                        <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>Tus pólizas personales con forma de pago <span style={{ color: '#4FC3F7', fontWeight: 700 }}>semestral o anual</span> cuentan para Cuaderno de Concursos, Reconocimientos, Camino a la Cumbre y Convenciones. Vida Individual con prima recibo anualizada de <span style={{ fontWeight: 700 }}>$30,000+</span> (1-48 meses de concurso) o <span style={{ fontWeight: 700 }}>$40,000+</span> (49 meses en adelante), y GMM con prima comisión anualizada de <span style={{ fontWeight: 700 }}>$15,000+</span>. *No aplica con otras campañas vigentes.*</p>
                                        <button
                                            onClick={() => setSelectedPdf({ title: 'Campaña Tú Primero Noviembre 2026', path: '/bases_campanas/Tu%20Primero%20Noviembre%202026/T%C3%BA%20Primero%20Noviembre%202026.pdf' })}
                                            style={{ marginTop: '10px', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', background: 'rgba(41, 182, 246, 0.15)', border: '1px solid rgba(41, 182, 246, 0.4)', color: '#4FC3F7', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                                        >
                                            <Eye size={14} /> 📄 Ver PDF Oficial
                                        </button>
                                    </div>
                                </div>
                                {/* Item 2b: Buen Fin 2026 */}
                                <div style={{ padding: '16px 20px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                                    <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(233, 30, 99, 0.15)', color: '#F06292', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CreditCard size={20} /></div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                                            <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 700 }}>🛍️ SMNYL con el Buen Fin</strong>
                                            <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: '6px', background: 'rgba(233, 30, 99, 0.15)', color: '#F06292' }}>13 – 17 NOV 2026</span>
                                        </div>
                                        <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>Tus clientes con tarjeta de crédito <span style={{ fontWeight: 700 }}>BBVA</span> pagan en una sola exhibición y obtienen <span style={{ color: '#F06292', fontWeight: 700 }}>3 meses sin intereses</span> pagando hasta marzo 2027 (compra mínima $3,500, por Pago Express, Pago en Línea o Mail Order; el cliente debe inscribirse en la app del 3 al 12 de noviembre). Si no desean la promoción de BBVA, SMNYL sigue ofreciendo <span style={{ fontWeight: 700 }}>6 MSI</span> por Mail Order y Pago en Línea.</p>
                                        <button
                                            onClick={() => setSelectedPdf({ title: 'Campaña Buen Fin 2026', path: '/bases_campanas/Buen%20Fin%202026/Campa%C3%B1a%20Buen%20Fin%202026.pdf' })}
                                            style={{ marginTop: '10px', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', background: 'rgba(233, 30, 99, 0.15)', border: '1px solid rgba(233, 30, 99, 0.4)', color: '#F06292', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                                        >
                                            <Eye size={14} /> 📄 Ver PDF Oficial
                                        </button>
                                    </div>
                                </div>
                                {/* Item 2c: Visión Proactiva 2027 */}
                                <div style={{ padding: '16px 20px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                                    <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(63, 81, 181, 0.2)', color: '#7986CB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trophy size={20} /></div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                                            <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 700 }}>👁️ Visión Proactiva 2027 — Campaña Asesores</strong>
                                            <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: '6px', background: 'rgba(63, 81, 181, 0.2)', color: '#7986CB' }}>1 NOV 2026 – 31 MAR 2027</span>
                                        </div>
                                        <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>Gana tu lugar para el evento en la Ciudad de México (julio 2027): acumula <span style={{ color: '#7986CB', fontWeight: 700 }}>10 pólizas</span> de Vida Individual (prima mínima $17,000) o GMM Individual (prima comisión mínima $15,000), conteo 1 a 1, emitidas y pagadas en la vigencia; o <span style={{ color: '#7986CB', fontWeight: 700 }}>1 póliza</span> nueva de Experiencia Global de Grupo y Colectivo (prima mínima $50,000). Asesores conectados de diciembre 2026 a marzo 2027 tienen meta proporcional. *Incluye la entrada individual; no incluye hospedaje ni traslado.*</p>
                                        <button
                                            onClick={() => setSelectedPdf({ title: 'Visión Proactiva 2027 — Asesores', path: '/bases_campanas/Vision%20Proactiva%202027/Visi%C3%B3n%20Proactiva%20Asesores%202027.pdf' })}
                                            style={{ marginTop: '10px', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', background: 'rgba(63, 81, 181, 0.2)', border: '1px solid rgba(63, 81, 181, 0.5)', color: '#7986CB', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                                        >
                                            <Eye size={14} /> 📄 Ver PDF Oficial
                                        </button>
                                    </div>
                                </div>
                                {/* Item 3: Momentum Eur3ka */}
                                <div style={{ padding: '16px 20px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                                    <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(156, 39, 176, 0.15)', color: '#BA68C8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Gift size={20} /></div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                                            <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 700 }}>🎁 Campaña Momentum Eur3ka 2026</strong>
                                            <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: '6px', background: 'rgba(156, 39, 176, 0.15)', color: '#BA68C8' }}>1 SEP – 31 OCT 2026</span>
                                        </div>
                                        <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>Gana una <span style={{ color: 'var(--accent-gold)', fontWeight: 700 }}>Gift Card de Amazon</span> por cada póliza emitida y pagada proveniéndote de Momentum (vencimientos e indemnizaciones): desde <span style={{ fontWeight: 700 }}>$3,000 MXN</span> ($35k a $49.9k), <span style={{ fontWeight: 700 }}>$4,500 MXN</span> ($50k a $99.9k) hasta <span style={{ color: '#FF6B6B', fontWeight: 700 }}>$6,000 MXN</span> ($100k+).</p>
                                        <button 
                                            onClick={() => setSelectedPdf({ title: 'Campaña Momentum Eur3ka 2026', path: '/bases_campanas/MOMENTUM/Campa%C3%B1a%20Momentum%20Eur3ka%202026.pdf' })}
                                            style={{ marginTop: '10px', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', background: 'rgba(156, 39, 176, 0.15)', border: '1px solid rgba(156, 39, 176, 0.4)', color: '#BA68C8', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                                        >
                                            <Eye size={14} /> 📄 Ver PDF Oficial
                                        </button>
                                    </div>
                                </div>
                                {/* Item 6: Legión Centurión (36) */}
                                <div style={{ padding: '16px 20px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                                    <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(212, 175, 55, 0.15)', color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Shield size={20} /></div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                                            <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 700 }}>Legión Centurión — Objetivo Septiembre</strong>
                                            <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: '6px', background: 'rgba(212, 175, 55, 0.15)', color: 'var(--accent-gold)' }}>META DEL MES</span>
                                        </div>
                                        <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>La meta acumulada para este mes de Septiembre es de <span style={{ color: 'var(--accent-gold)', fontWeight: 700 }}>36 pólizas acumuladas</span> como mínimo. Mantén el ritmo y asegura tu lugar en la élite de la promotoría.</p>
                                        <button 
                                            onClick={() => setSelectedPdf({ title: 'Bases Legión Centurión 2026', path: '/bases_campanas/Legion/Legio%CC%81n%20Centurio%CC%81n%20Asesores%202026.pdf' })}
                                            style={{ marginTop: '10px', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', background: 'rgba(212, 175, 55, 0.15)', border: '1px solid rgba(212, 175, 55, 0.4)', color: 'var(--accent-gold)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                                        >
                                            <Eye size={14} /> 📄 Ver PDF Oficial
                                        </button>
                                    </div>
                                </div>
                                {/* Item 8: Bono 15 MDRT */}
                                <div style={{ padding: '16px 20px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                                    <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(156, 39, 176, 0.15)', color: '#BA68C8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plane size={20} /></div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                                            <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 700 }}>Bono 15 MDRT — Asistencia a Orlando, Florida</strong>
                                        </div>
                                        <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>Alcanza la meta de Miembro MDRT 2027 al 100% de producción SMNYL y asiste a la Reunión Anual 2027 en Orlando, Florida para recibir un <span style={{ color: 'var(--accent-gold)', fontWeight: 700 }}>Bono Especial de $15,000 MXN</span>.</p>
                                        <button 
                                            onClick={() => setSelectedPdf({ title: 'Bono 15 MDRT 2026', path: '/bases_campanas/BONO%2015%20MDRT/Bases%20Campa%C3%B1a%20Bono%2015%20MDRT.pdf' })}
                                            style={{ marginTop: '10px', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', background: 'rgba(156, 39, 176, 0.15)', border: '1px solid rgba(156, 39, 176, 0.4)', color: '#BA68C8', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                                        >
                                            <Eye size={14} /> 📄 Ver PDF Oficial
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
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
                                    filteredAdvisors.map(({ name, clave }) => (
                                        <button
                                            key={clave}
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
                                                gap: '12px',
                                                marginBottom: '2px'
                                            }}
                                            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                                            onMouseLeave={(e) => (e.currentTarget.style.background = selectedName === name ? 'rgba(0,122,255,0.15)' : 'none')}
                                        >
                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                                <span style={{
                                                    fontSize: '0.78rem',
                                                    fontWeight: 700,
                                                    color: selectedName === name ? '#007AFF' : 'var(--text-secondary)',
                                                    background: selectedName === name ? 'rgba(0,122,255,0.12)' : 'rgba(255,255,255,0.06)',
                                                    padding: '3px 9px',
                                                    borderRadius: '20px',
                                                    letterSpacing: '0.02em'
                                                }}>
                                                    {clave}
                                                </span>
                                                {selectedName === name && <Check size={18} />}
                                            </span>
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

            {/* Modal de Reportes Ejecutivos para Asesores */}
            <AdvisorReportModal
                reportKey={selectedReportKey}
                onClose={() => setSelectedReportKey(null)}
                themeMode={theme?.id === 'light' ? 'light' : 'dark'}
            />
            {/* Modal de visor de PDF con botón de regresar al menú */}
            <PdfViewerModal
                isOpen={!!selectedPdf}
                pdfUrl={selectedPdf?.path || null}
                title={selectedPdf?.title || null}
                onClose={() => setSelectedPdf(null)}
            />

            {/* Pantalla de Cierre de Mes y Campeones, con botón de regresar al menú */}
            <AnimatePresence>
                {showCierreMes && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 1100,
                            background: theme?.id === 'light' ? 'rgba(240, 242, 245, 0.96)' : 'rgba(10, 15, 30, 0.85)',
                            backdropFilter: 'blur(16px)',
                            WebkitBackdropFilter: 'blur(16px)',
                            display: 'flex',
                            flexDirection: 'column',
                            overflowY: 'auto'
                        }}
                    >
                        <div
                            style={{
                                position: 'sticky',
                                top: 0,
                                zIndex: 10,
                                background: theme?.id === 'light' ? 'rgba(255, 255, 255, 0.92)' : 'rgba(15, 23, 42, 0.9)',
                                backdropFilter: 'blur(20px)',
                                borderBottom: '1px solid var(--glass-border)',
                                padding: '16px 24px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '16px'
                            }}
                        >
                            <button
                                onClick={() => setShowCierreMes(false)}
                                className="btn-ghost"
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    padding: '8px 16px', borderRadius: '10px',
                                    border: '1px solid var(--glass-border)', color: 'var(--text-primary)',
                                    fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer'
                                }}
                            >
                                <ArrowLeft size={18} />
                                <span>Volver al Menú Principal</span>
                            </button>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ color: 'var(--accent-gold)', display: 'flex', alignItems: 'center' }}>
                                    <Trophy size={20} />
                                </span>
                                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                                    Cierre de Mes y Campeones
                                </h2>
                            </div>

                            <button
                                onClick={() => setShowCierreMes(false)}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.06)', border: '1px solid var(--glass-border)',
                                    borderRadius: '8px', color: 'var(--text-secondary)', padding: '6px',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ padding: '32px 24px', maxWidth: '1300px', width: '100%', margin: '0 auto' }}>
                            <CierreMes />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default Welcome;
