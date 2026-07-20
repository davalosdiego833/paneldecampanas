import React, { useState } from 'react';
import { Home, FolderOpen, Settings, LogOut, Sun, Moon, ChevronLeft, ChevronRight } from 'lucide-react';
import { ThemeConfig, Page } from '../types';
import SeasonalEffects from './SeasonalEffects';

interface Props {
    children: React.ReactNode;
    theme: ThemeConfig | null;
    page: Page;
    setPage: (p: Page) => void;
    onGoHome: () => void;
    selectedCampaign: string | null;
    themeMode: 'dark' | 'light';
    toggleTheme: () => void;
    onLogout?: () => void;
}

const Layout: React.FC<Props> = ({ children, theme, page, setPage, onGoHome, selectedCampaign, themeMode, toggleTheme, onLogout }) => {
    const [showAdminLogin, setShowAdminLogin] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [password, setPassword] = useState('');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const handleAdminLogin = () => {
        if (password === 'Diego080303') {
            setIsAdmin(true);
            setShowAdminLogin(false);
        }
    };

    return (
        <div className="app-layout" data-theme={themeMode} style={{ position: 'relative' }}>
            <SeasonalEffects effect={theme?.efecto} themeId={theme?.id} />

            {/* Botón flotante para mostrar menú cuando está oculto */}
            {sidebarCollapsed && (
                <button
                    onClick={() => setSidebarCollapsed(false)}
                    title="Mostrar Menú Lateral"
                    style={{
                        position: 'fixed',
                        top: '18px',
                        left: '18px',
                        zIndex: 999,
                        background: 'var(--glass-bg)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '12px',
                        color: '#007AFF',
                        padding: '10px 16px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        transition: 'all 0.2s ease'
                    }}
                >
                    <ChevronRight size={18} />
                    <span>Mostrar Menú</span>
                </button>
            )}

            {/* Sidebar */}
            <aside 
                className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}
                style={{
                    width: sidebarCollapsed ? '0px' : undefined,
                    minWidth: sidebarCollapsed ? '0px' : undefined,
                    padding: sidebarCollapsed ? '0px' : undefined,
                    margin: sidebarCollapsed ? '0px' : undefined,
                    opacity: sidebarCollapsed ? 0 : 1,
                    border: sidebarCollapsed ? 'none' : undefined,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    overflow: 'hidden'
                }}
            >
                <div style={{ position: 'relative', padding: '0 10px 20px 10px', textAlign: 'center' }}>
                    <button
                        onClick={() => setSidebarCollapsed(true)}
                        title="Ocultar Menú Lateral"
                        style={{
                            position: 'absolute',
                            top: '-4px',
                            right: '0px',
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '8px',
                            color: 'var(--text-secondary)',
                            padding: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <ChevronLeft size={16} />
                    </button>

                    <img
                        src="/assets/logos/empresa/ambriz_logo.png"
                        alt="Ambriz"
                        style={{ maxWidth: '160px', width: '100%', filter: 'brightness(1.1)' }}
                    />
                </div>

                <div style={{ height: '1px', background: 'var(--glass-border)', margin: '0 20px 20px 20px' }} />

                <nav style={{ flex: 1 }}>
                    {page !== 'welcome' && (
                        <button
                            onClick={onGoHome}
                            className="nav-item"
                        >
                            <Home className="nav-icon" size={20} />
                            <span>Inicio</span>
                        </button>
                    )}

                    {page === 'dashboard' && (
                        <button
                            onClick={() => setPage('campaign_selector')}
                            className="nav-item active"
                        >
                            <FolderOpen className="nav-icon" size={20} />
                            <span>Campañas</span>
                        </button>
                    )}
                </nav>

                {/* Theme Toggle & Admin */}
                <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '20px', marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {!isAdmin ? (
                        <>
                            {showAdminLogin ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <input
                                        type="password"
                                        placeholder="Admin password"
                                        className="input-modern"
                                        style={{ fontSize: '0.85rem', padding: '10px' }}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
                                    />
                                    <button onClick={handleAdminLogin} className="btn-ghost" style={{ fontSize: '0.8rem' }}>Entrar</button>
                                </div>
                            ) : (
                                <button onClick={() => setShowAdminLogin(true)} className="btn-ghost" title="Admin" style={{ alignSelf: 'center' }}>
                                    <Settings size={18} />
                                </button>
                            )}
                        </>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--success-green)', letterSpacing: '0.05em', textAlign: 'center' }}>ADMIN MODE</span>
                            <button
                                onClick={() => setIsAdmin(false)}
                                className="nav-item"
                                style={{ color: 'var(--danger-red)', paddingLeft: 0, justifyContent: 'center' }}
                            >
                                <LogOut size={16} className="nav-icon" /> Cerrar Sesión
                            </button>
                        </div>
                    )}

                    {/* Botón Toggle Tema */}
                    <button
                        onClick={toggleTheme}
                        className="nav-item"
                        style={{ fontSize: '0.85rem', justifyContent: 'center', marginTop: '4px' }}
                    >
                        {themeMode === 'dark' ? <Sun size={16} className="nav-icon" /> : <Moon size={16} className="nav-icon" />}
                        <span>{themeMode === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}</span>
                    </button>

                    {/* Botón Cerrar Sesión - regresa al Login */}
                    {onLogout && (
                        <button
                            onClick={onLogout}
                            className="nav-item"
                            style={{ color: 'var(--text-secondary)', justifyContent: 'center', fontSize: '0.85rem', marginTop: '8px' }}
                        >
                            <LogOut size={16} className="nav-icon" /> Cerrar Sesión
                        </button>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <main 
                className={`main-content ${sidebarCollapsed ? 'expanded' : ''}`}
                style={{
                    padding: sidebarCollapsed ? '32px 32px 32px 80px' : '32px 48px',
                    maxWidth: sidebarCollapsed ? '100%' : '1400px',
                    margin: sidebarCollapsed ? '0' : '0 auto',
                    width: '100%',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
            >
                {children}
            </main>
        </div>
    );
};

export default Layout;
