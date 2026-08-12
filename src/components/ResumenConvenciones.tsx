import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, LogOut, Sun, Moon, Building2, UserCheck, Trophy, Sparkles } from 'lucide-react';
import ConvencionesPromotores from './Dashboards/ConvencionesPromotores';

interface Props {
    onBack: () => void;
    onLogout: () => void;
    themeMode: 'dark' | 'light';
    toggleTheme: () => void;
}

type ConvencionTab = 'promotoria' | 'gerente_agencia';

export const ResumenConvenciones: React.FC<Props> = ({ onBack, onLogout, themeMode, toggleTheme }) => {
    const [activeTab, setActiveTab] = useState<ConvencionTab>('promotoria');
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/resumen-general');
                const d = await res.json();
                setData(d);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching convenciones data:', err);
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <div style={{
            minHeight: '100vh',
            background: '#0d0e17',
            color: '#ffffff',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
            padding: '24px 32px'
        }}>
            {/* Top Navigation Header */}
            <div style={{
                maxWidth: '1440px',
                margin: '0 auto 28px auto',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px'
            }}>
                {/* Back button + Title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button
                        onClick={onBack}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 16px',
                            background: '#181a29',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '12px',
                            color: '#ffffff',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <ArrowLeft size={16} /> Volver
                    </button>

                    <h1 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0, color: '#ffffff' }}>
                        Reporte de Convenciones
                    </h1>
                </div>

                {/* Right controls: Theme & Logout */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                        onClick={toggleTheme}
                        style={{
                            padding: '10px 14px',
                            background: '#181a29',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '12px',
                            color: '#ffffff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.82rem'
                        }}
                    >
                        {themeMode === 'dark' ? <Sun size={16} color="#FFB800" /> : <Moon size={16} color="#3A86FF" />}
                        <span>{themeMode === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}</span>
                    </button>

                    <button
                        onClick={onLogout}
                        style={{
                            padding: '10px 14px',
                            background: 'rgba(255, 42, 122, 0.12)',
                            border: '1px solid rgba(255, 42, 122, 0.3)',
                            borderRadius: '12px',
                            color: '#FF2A7A',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.82rem',
                            fontWeight: 600
                        }}
                    >
                        <LogOut size={16} />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </div>

            {/* Main Tabs Selector */}
            <div style={{
                maxWidth: '1440px',
                margin: '0 auto 28px auto',
                display: 'flex',
                gap: '12px',
                background: '#181a29',
                padding: '6px',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                width: 'fit-content'
            }}>
                {/* Tab 1: Promotoría */}
                <button
                    onClick={() => setActiveTab('promotoria')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 24px',
                        borderRadius: '12px',
                        border: 'none',
                        background: activeTab === 'promotoria' ? 'linear-gradient(135deg, #3A86FF 0%, #00F2FE 100%)' : 'transparent',
                        color: activeTab === 'promotoria' ? '#ffffff' : '#8c94a8',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        transition: 'all 0.25s ease',
                        boxShadow: activeTab === 'promotoria' ? '0 4px 20px rgba(58, 134, 255, 0.3)' : 'none'
                    }}
                >
                    <Building2 size={18} />
                    Promotoría
                </button>

                {/* Tab 2: Gerente de Agencia */}
                <button
                    onClick={() => setActiveTab('gerente_agencia')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 24px',
                        borderRadius: '12px',
                        border: 'none',
                        background: activeTab === 'gerente_agencia' ? 'linear-gradient(135deg, #FFB800 0%, #FF8800 100%)' : 'transparent',
                        color: activeTab === 'gerente_agencia' ? '#ffffff' : '#8c94a8',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        transition: 'all 0.25s ease',
                        boxShadow: activeTab === 'gerente_agencia' ? '0 4px 20px rgba(255, 184, 0, 0.3)' : 'none'
                    }}
                >
                    <UserCheck size={18} />
                    Gerente Agencia
                </button>
            </div>

            {/* Content Display */}
            <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '100px 20px', color: '#8c94a8' }}>
                        Cargando datos de convenciones...
                    </div>
                ) : activeTab === 'promotoria' ? (
                    <ConvencionesPromotores data={data} themeMode={themeMode} />
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                            textAlign: 'center',
                            padding: '100px 20px',
                            background: '#181a29',
                            borderRadius: '24px',
                            border: '1px solid rgba(255, 255, 255, 0.07)',
                            maxWidth: '700px',
                            margin: '40px auto'
                        }}
                    >
                        <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>🚧</div>
                        <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#ffffff', margin: 0 }}>
                            En Proceso
                        </h2>
                        <p style={{ color: '#8c94a8', marginTop: '10px', fontSize: '0.95rem', lineHeight: '1.6' }}>
                            Próximamente estará disponible el reporte y desglose de Convenciones para <strong>Gerencia de Agencia</strong>.
                        </p>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default ResumenConvenciones;
