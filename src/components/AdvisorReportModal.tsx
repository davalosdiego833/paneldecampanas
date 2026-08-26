import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Activity, AlertTriangle, TrendingUp, HeartPulse, Lightbulb, Hospital, X } from 'lucide-react';
import { Proactivos, AsesoresSinEmision, ComparativoVida } from './ResumenPromotoria';
import { QsQVidaContent } from './QsQVida';
import { QsQGmmContent } from './QsQGmm';

export type ReportKey = 'proactivos' | 'asesores_sin_emision' | 'comparativo_vida' | 'qsq_vida' | 'qsq_gmm';

interface Props {
    reportKey: ReportKey | null;
    onClose: () => void;
    themeMode: 'dark' | 'light';
}

export const REPORT_CONFIGS: Record<ReportKey, { title: string; subtitle: string; icon: React.ReactNode; color: string; status: 'active' | 'upcoming' }> = {
    proactivos: {
        title: 'Proactivos',
        subtitle: 'Cumplimiento de mínimos de actividad por asesor',
        icon: <Activity size={22} />,
        color: '#00E676',
        status: 'active'
    },
    asesores_sin_emision: {
        title: 'Asesores sin Emisión',
        subtitle: 'Estado de emisión y producción por asesor (Vida y GMM)',
        icon: <AlertTriangle size={22} />,
        color: '#FF6B6B',
        status: 'active'
    },
    comparativo_vida: {
        title: 'Comparativo de Vida',
        subtitle: 'Año anterior vs. año actual en Pólizas y Prima Pagada',
        icon: <TrendingUp size={22} />,
        color: '#42A5F5',
        status: 'active'
    },
    qsq_vida: {
        title: 'QsQ Vida',
        subtitle: 'Análisis y métricas Quién es Quién en Vida',
        icon: <Lightbulb size={22} />,
        color: '#FFB74D',
        status: 'active'
    },
    qsq_gmm: {
        title: 'QsQ GMM',
        subtitle: 'Análisis y métricas Quién es Quién en GMM',
        icon: <Hospital size={22} />,
        color: '#80CBC4',
        status: 'active'
    }
};

export const AdvisorReportModal: React.FC<Props> = ({ reportKey, onClose, themeMode }) => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>(null);
    const [historicalDates, setHistoricalDates] = useState<{ [sec: string]: string | null }>({});

    useEffect(() => {
        if (!reportKey) return;
        
        const fetchData = async () => {
            try {
                setLoading(true);
                const params = new URLSearchParams();
                Object.entries(historicalDates).forEach(([sec, date]) => {
                    if (date) params.append(sec, date);
                });
                const res = await fetch(`/api/resumen-general?${params.toString()}`);
                if (!res.ok) throw new Error('Error al obtener datos');
                const json = await res.json();
                setData(json);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching general summary for advisor:', err);
                setLoading(false);
            }
        };

        fetchData();
    }, [reportKey, historicalDates]);

    if (!reportKey) return null;

    const config = REPORT_CONFIGS[reportKey];

    const handleDateSelect = (sec: string, date: string | null) => {
        setHistoricalDates(prev => ({ ...prev, [sec]: date }));
    };

    const renderReportBody = () => {
        if (config.status === 'upcoming') {
            return (
                <div 
                    className="glass-card" 
                    style={{ 
                        textAlign: 'center', 
                        padding: '60px 24px', 
                        margin: '40px auto', 
                        maxWidth: '560px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '16px'
                    }}
                >
                    <div style={{
                        width: '72px',
                        height: '72px',
                        borderRadius: '20px',
                        background: `${config.color}20`,
                        border: `1px solid ${config.color}40`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: config.color
                    }}>
                        {config.icon}
                    </div>
                    <span style={{
                        background: 'rgba(255, 183, 77, 0.15)',
                        border: '1px solid rgba(255, 183, 77, 0.3)',
                        color: '#FFB74D',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        padding: '4px 12px',
                        borderRadius: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                    }}>
                        🛠️ Próximamente
                    </span>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        Reporte {config.title} en Proceso
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                        Estamos preparando la integración de datos y tableros para este nuevo reporte. Muy pronto podrás consultar la información detallada desde este espacio.
                    </p>
                </div>
            );
        }

        if (loading) {
            return (
                <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-secondary)' }}>
                    Cargando información del reporte...
                </div>
            );
        }

        if (!data) {
            return (
                <div style={{ textAlign: 'center', padding: '80px', color: 'var(--danger-red)' }}>
                    No se pudieron cargar los datos del reporte. Por favor intente más tarde.
                </div>
            );
        }

        const fechaCorte = data.fechas_corte?.[reportKey] || '';

        switch (reportKey) {
            case 'proactivos':
                return (
                    <Proactivos
                        data={data.proactivos || []}
                        fechaCorte={fechaCorte}
                        selectedDate={historicalDates.proactivos || null}
                        onDateSelect={(d) => handleDateSelect('proactivos', d)}
                        themeMode={themeMode}
                        isAdvisorView={true}
                    />
                );
            case 'asesores_sin_emision':
                return (
                    <AsesoresSinEmision
                        data={data.asesores_sin_emision || null}
                        fechaCorte={fechaCorte}
                        selectedDate={historicalDates.asesores_sin_emision || null}
                        onDateSelect={(d) => handleDateSelect('asesores_sin_emision', d)}
                        themeMode={themeMode}
                        isAdvisorView={true}
                    />
                );
            case 'comparativo_vida':
                return (
                    <ComparativoVida
                        data={data.comparativo_vida || null}
                        fechaCorte={fechaCorte}
                        selectedDate={historicalDates.comparativo_vida || null}
                        onDateSelect={(d) => handleDateSelect('comparativo_vida', d)}
                        themeMode={themeMode}
                        isAdvisorView={true}
                    />
                );
            case 'qsq_vida':
                return (
                    <QsQVidaContent
                        data={data.qsq_vida || null}
                        fechaCorte={fechaCorte}
                        themeMode={themeMode}
                    />
                );
            case 'qsq_gmm':
                return (
                    <QsQGmmContent
                        data={data.qsq_gmm || null}
                        fechaCorte={fechaCorte}
                        themeMode={themeMode}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <AnimatePresence>
            <div 
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 1100,
                    background: 'rgba(10, 15, 30, 0.85)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflowY: 'auto'
                }}
            >
                {/* Header Bar */}
                <div 
                    style={{
                        position: 'sticky',
                        top: 0,
                        zIndex: 10,
                        background: 'rgba(15, 23, 42, 0.9)',
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
                        onClick={onClose}
                        className="btn-ghost"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 16px',
                            borderRadius: '10px',
                            border: '1px solid var(--glass-border)',
                            color: 'var(--text-primary)',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            cursor: 'pointer'
                        }}
                    >
                        <ArrowLeft size={18} />
                        <span>Volver al Menú Principal</span>
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ color: config.color, display: 'flex', alignItems: 'center' }}>
                            {config.icon}
                        </span>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                            {config.title}
                        </h2>
                    </div>

                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '8px',
                            color: 'var(--text-secondary)',
                            padding: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body Content */}
                <div style={{ padding: '32px 24px', maxWidth: '1300px', width: '100%', margin: '0 auto' }}>
                    {renderReportBody()}
                </div>
            </div>
        </AnimatePresence>
    );
};

export default AdvisorReportModal;
