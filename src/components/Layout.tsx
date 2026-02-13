import React, { useState } from 'react';
import { Home, FolderOpen, Settings, LogOut, Sun, Moon } from 'lucide-react';
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

    const handleAdminLogin = () => {
        if (password === 'Diego080303') {
            setIsAdmin(true);
            setShowAdminLogin(false);
        }
    };

    return (
        <div className="app-layout" data-theme={themeMode}>
            <SeasonalEffects effect={theme?.efecto} themeId={theme?.id} />

            {/* Sidebar */}
            <aside className="sidebar">
                <div style={{ padding: '0 10px 20px 10px', textAlign: 'center' }}>
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
            <main className="main-content">
                {children}
            </main>
        </div>
    );
};

export default Layout;
