import React, { useState } from 'react';
import { Home, FolderOpen, Settings, LogOut, Sun, Moon, ChevronLeft, ChevronRight, Bell } from 'lucide-react';
import { ThemeConfig, Page } from '../types';
import SeasonalEffects from './SeasonalEffects';
import { NotificationCenterModal } from './NotificationCenterModal';

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
    const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth <= 768;
        }
        return false;
    });
    const [isNotifCenterOpen, setIsNotifCenterOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const handleAdminLogin = () => {
        if (password === 'Diego080303') {
            setIsAdmin(true);
            setShowAdminLogin(false);
        }
    };

    const handleNavClick = (action: () => void) => {
        action();
        if (typeof window !== 'undefined' && window.innerWidth <= 768) {
            setSidebarCollapsed(true);
        }
    };

    return (
        <div className="app-layout" data-theme={themeMode} style={{ position: 'relative' }}>
            <SeasonalEffects effect={theme?.efecto} themeId={theme?.id} />

            {/* Telón / Backdrop para móviles cuando el menú está abierto */}
            {!sidebarCollapsed && (
                <div
                    className="mobile-sidebar-backdrop"
                    onClick={() => setSidebarCollapsed(true)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.65)',
                        backdropFilter: 'blur(4px)',
                        WebkitBackdropFilter: 'blur(4px)',
                        zIndex: 998,
                        transition: 'opacity 0.3s ease'
                    }}
                />
            )}

            {/* Botón flotante para mostrar menú cuando está oculto */}
            {sidebarCollapsed && (
                <button
                    onClick={() => setSidebarCollapsed(false)}
                    title="Mostrar Menú Lateral"
                    style={{
                        position: 'fixed',
                        top: '16px',
                        left: '16px',
                        zIndex: 999,
                        background: 'rgba(15, 23, 42, 0.85)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '12px',
                        color: 'var(--text-primary)',
                        padding: '10px 16px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        transition: 'all 0.2s ease'
                    }}
                >
                    <ChevronRight size={18} color="var(--accent-gold)" />
                    <span>Mostrar Menú</span>
                </button>
            )}

            {/* Sidebar */}
            <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
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
                            onClick={() => handleNavClick(onGoHome)}
                            className="nav-item"
                        >
                            <Home className="nav-icon" size={20} />
                            <span>Inicio</span>
                        </button>
                    )}

                    <button
                        onClick={() => handleNavClick(() => setIsNotifCenterOpen(true))}
                        className="nav-item"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Bell className="nav-icon" size={20} style={{ color: '#F59E0B' }} />
                            <span>Buzón de Avisos</span>
                        </div>
                        {unreadCount > 0 && (
                            <span style={{ background: '#F59E0B', color: '#0F172A', fontSize: '0.7rem', fontWeight: 800, borderRadius: '10px', padding: '2px 8px', marginLeft: 'auto' }}>
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    {page === 'dashboard' && (
                        <button
                            onClick={() => handleNavClick(() => setPage('campaign_selector'))}
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
                                onClick={() => handleNavClick(() => setIsAdmin(false))}
                                className="nav-item"
                                style={{ color: 'var(--danger-red)', paddingLeft: 0, justifyContent: 'center' }}
                            >
                                <LogOut size={16} className="nav-icon" /> Cerrar Sesión
                            </button>
                        </div>
                    )}

                    {/* Botón Notificaciones Push */}
                    <button
                        onClick={() => {
                            if ((window as any).openPushPrompt) (window as any).openPushPrompt();
                        }}
                        className="nav-item"
                        style={{ fontSize: '0.85rem', justifyContent: 'center', marginTop: '4px' }}
                    >
                        <Bell size={16} className="nav-icon" />
                        <span>Notificaciones</span>
                    </button>

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
                            onClick={() => handleNavClick(onLogout)}
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
            >
                {children}
            </main>

            {/* In-App Notification Center Modal */}
            <NotificationCenterModal
                isOpen={isNotifCenterOpen}
                onClose={() => setIsNotifCenterOpen(false)}
                role={isAdmin ? 'admin' : 'asesor'}
                onUnreadCountChange={(count) => setUnreadCount(count)}
            />
        </div>
    );
};

export default Layout;
