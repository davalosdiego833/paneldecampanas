import React, { useState, useEffect } from 'react';
import { ThemeConfig, Page } from './types';
import Layout from './components/Layout';
import LoginScreen from './components/LoginScreen';
import AdminHome from './components/AdminHome';
import AdminDashboard from './components/AdminDashboard';
import ResumenPromotoria from './components/ResumenPromotoria';
import ResumenConvenciones from './components/ResumenConvenciones';
import MetaDespacho from './components/MetaDespacho';
import Welcome from './components/Welcome';
import CampaignSelector from './components/CampaignSelector';
import Dashboard from './components/Dashboard';

import AdminActivity from './components/AdminActivity';
import StaffActivity from './components/StaffActivity';
import CentroAvisos from './components/CentroAvisos';
import InfografiaGenerator from './components/InfografiaGenerator';
import { PushNotificationPrompt } from './components/PushNotificationPrompt';

import { initOneSignal, setOneSignalUserTags, loginOneSignalIdentity } from './utils/OneSignalService';

const App: React.FC = () => {
    const [page, setPage] = useState<Page>('login');
    const [theme, setTheme] = useState<ThemeConfig | null>(null);
    const [selectedAdvisor, setSelectedAdvisor] = useState<string | null>(null);
    const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
    const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');

    const toggleTheme = () => {
        setThemeMode(prev => prev === 'dark' ? 'light' : 'dark');
    };

    // Sync theme mode to document root so CSS variables cascade properly
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', themeMode);
        document.body.setAttribute('data-theme', themeMode);
    }, [themeMode]);

    // Fetch OneSignal config and initialize SDK
    useEffect(() => {
        fetch('/api/onesignal/config')
            .then(res => res.json())
            .then(data => {
                if (data && data.appId) {
                    initOneSignal(data.appId);
                }
            })
            .catch(() => {});
    }, []);

    const handleGoHome = () => {
        setPage('welcome');
        setSelectedCampaign(null);
    };

    const handleAdvisorSelect = (advisor: string) => {
        setSelectedAdvisor(advisor);
        setPage('campaign_selector');
    };

    const handleCampaignSelect = (campaign: string) => {
        setSelectedCampaign(campaign);
        setPage('dashboard');
    };

    const handleRoleSelect = (role: 'asesor' | 'admin') => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('device_user_role', role);
        }
        if (role === 'asesor') {
            setPage('welcome');
        } else {
            setPage('admin_home');
        }
    };

    const handleAdminOption = (option: 'asesores' | 'convenciones' | 'promotoria' | 'karen' | 'actividad' | 'meta24m' | 'staff' | 'centro_avisos' | 'infografias') => {
        if (option === 'asesores') {
            setPage('admin_dashboard');
        } else if (option === 'convenciones') {
            setPage('resumen_convenciones');
        } else if (option === 'promotoria') {
            setPage('resumen_promotoria');
        } else if (option === 'karen') {
            setPage('gerencia_karen');
        } else if (option === 'actividad') {
            setPage('admin_actividad');
        } else if (option === 'meta24m') {
            setPage('admin_meta');
        } else if (option === 'staff') {
            setPage('admin_staff');
        } else if (option === 'centro_avisos') {
            setPage('centro_avisos');
        } else if (option === 'infografias') {
            setPage('infografias');
        }
    };

    const handleLogout = () => {
        setPage('login');
        setSelectedAdvisor(null);
        setSelectedCampaign(null);
    };

    useEffect(() => {
        fetch('/api/active-theme')
            .then(res => res.json())
            .then(data => {
                if (data && typeof data === 'object' && data.colores && data.config_home) {
                    setTheme(data);
                } else {
                    setTheme(null);
                }
            })
            .catch(err => {
                console.error('Error fetching theme:', err);
                setTheme(null);
            });
    }, []);

    const pageStr = page as string;
    const isAdminRole = pageStr.startsWith('admin_') || pageStr === 'resumen_promotoria' || pageStr === 'resumen_convenciones' || pageStr === 'gerencia_karen' || pageStr === 'centro_avisos';
    
    // Check stored role so admin device remains tagged as admin even on login/welcome pages
    const storedRole = typeof window !== 'undefined' ? localStorage.getItem('device_user_role') : null;
    const activePushRole: 'admin' | 'asesor' = (isAdminRole || storedRole === 'admin') ? 'admin' : 'asesor';

    // Identidad real de la persona detrás del dispositivo: la clave del asesor
    // seleccionado, o el nombre que el admin capturó una vez en el login.
    // Sin esto, OneSignal no puede distinguir "el mismo Diego reinstalando"
    // de "un admin nuevo" — cada re-registro se veía como un dispositivo
    // fantasma más, acumulándose sin límite.
    const adminIdentityName = typeof window !== 'undefined' ? localStorage.getItem('admin_identity_name') : null;
    const identityId = activePushRole === 'admin' ? (adminIdentityName || undefined) : (selectedAdvisor || undefined);

    useEffect(() => {
        setOneSignalUserTags(activePushRole, identityId, identityId);
        if (identityId) loginOneSignalIdentity(identityId);
    }, [activePushRole, identityId]);

    const renderMainContent = () => {
        if (page === 'login') return <LoginScreen onSelectRole={handleRoleSelect} />;
        if (page === 'admin_home') return <AdminHome onSelectOption={handleAdminOption} onLogout={handleLogout} />;
        if (page === 'admin_dashboard') return <AdminDashboard onLogout={handleLogout} onBack={() => setPage('admin_home')} themeMode={themeMode} toggleTheme={toggleTheme} />;
        if (page === 'resumen_convenciones') return <ResumenConvenciones onLogout={handleLogout} onBack={() => setPage('admin_home')} themeMode={themeMode} toggleTheme={toggleTheme} />;
        if (page === 'resumen_promotoria') return <ResumenPromotoria onLogout={handleLogout} onBack={() => setPage('admin_home')} themeMode={themeMode} toggleTheme={toggleTheme} />;
        if (page === 'gerencia_karen') return <ResumenPromotoria onLogout={handleLogout} onBack={() => setPage('admin_home')} themeMode={themeMode} toggleTheme={toggleTheme} sucursalFilter={[2856]} gerenciaName="GERENCIA KAREN" />;
        if (page === 'admin_actividad') return <AdminActivity onLogout={handleLogout} onBack={() => setPage('admin_home')} themeMode={themeMode} toggleTheme={toggleTheme} />;
        if (page === 'admin_meta') return <MetaDespacho onBack={() => setPage('admin_home')} themeMode={themeMode} />;
        if (page === 'admin_staff') return <StaffActivity onBack={() => setPage('admin_home')} themeMode={themeMode} />;
        if (page === 'centro_avisos') return <CentroAvisos onBack={() => setPage('admin_home')} themeMode={themeMode} />;
        if (page === 'infografias') return <InfografiaGenerator onBack={() => setPage('admin_home')} themeMode={themeMode} />;

        return (
            <Layout
                theme={theme}
                onGoHome={handleGoHome}
                page={page}
                setPage={setPage}
                selectedCampaign={selectedCampaign}
                themeMode={themeMode}
                toggleTheme={toggleTheme}
                onLogout={handleLogout}
            >
                {page === 'welcome' && (
                    <Welcome theme={theme} onAdvisorSelect={handleAdvisorSelect} />
                )}
                {page === 'campaign_selector' && (
                    <CampaignSelector
                        advisor={selectedAdvisor!}
                        onCampaignSelect={handleCampaignSelect}
                    />
                )}
                {page === 'dashboard' && (
                    <Dashboard
                        campaign={selectedCampaign!}
                        advisor={selectedAdvisor!}
                        themeMode={themeMode}
                    />
                )}
            </Layout>
        );
    };

    return (
        <>
            <PushNotificationPrompt role={activePushRole} clave={selectedAdvisor || undefined} name={selectedAdvisor || undefined} />
            {renderMainContent()}
        </>
    );
};

export default App;
