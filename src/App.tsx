import React, { useState, useEffect } from 'react';
import { ThemeConfig, Page } from './types';
import Layout from './components/Layout';
import LoginScreen from './components/LoginScreen';
import AdminHome from './components/AdminHome';
import AdminDashboard from './components/AdminDashboard';
import ResumenPromotoria from './components/ResumenPromotoria';
import Welcome from './components/Welcome';
import CampaignSelector from './components/CampaignSelector';
import Dashboard from './components/Dashboard';

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
        if (role === 'asesor') {
            setPage('welcome');
        } else {
            setPage('admin_home');
        }
    };

    const handleAdminOption = (option: 'asesores' | 'promotoria' | 'eduardo' | 'karen') => {
        if (option === 'asesores') {
            setPage('admin_dashboard');
        } else if (option === 'promotoria') {
            setPage('resumen_promotoria');
        } else if (option === 'eduardo') {
            setPage('gerencia_eduardo');
        } else if (option === 'karen') {
            setPage('gerencia_karen');
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
            .then(data => setTheme(data))
            .catch(err => console.error('Error fetching theme:', err));
    }, []);

    // Login screen — full page, outside layout
    if (page === 'login') {
        return <LoginScreen onSelectRole={handleRoleSelect} />;
    }

    // Admin Home — full page, outside layout  
    if (page === 'admin_home') {
        return <AdminHome onSelectOption={handleAdminOption} onLogout={handleLogout} />;
    }

    // Admin Dashboard — has its own layout/sidebar
    if (page === 'admin_dashboard') {
        return <AdminDashboard onLogout={handleLogout} onBack={() => setPage('admin_home')} themeMode={themeMode} toggleTheme={toggleTheme} />;
    }

    // Resumen de Promotoría — has its own layout/sidebar
    if (page === 'resumen_promotoria') {
        return <ResumenPromotoria onLogout={handleLogout} onBack={() => setPage('admin_home')} themeMode={themeMode} toggleTheme={toggleTheme} />;
    }

    // Gerencia Eduardo — filtered by sucursal 2692
    if (page === 'gerencia_eduardo') {
        return <ResumenPromotoria onLogout={handleLogout} onBack={() => setPage('admin_home')} themeMode={themeMode} toggleTheme={toggleTheme} sucursalFilter={[2692]} gerenciaName="GERENCIA EDUARDO" />;
    }

    // Gerencia Karen — filtered by sucursal 2856
    if (page === 'gerencia_karen') {
        return <ResumenPromotoria onLogout={handleLogout} onBack={() => setPage('admin_home')} themeMode={themeMode} toggleTheme={toggleTheme} sucursalFilter={[2856]} gerenciaName="GERENCIA KAREN" />;
    }

    // Advisor flow: uses regular Layout
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
                />
            )}
        </Layout>
    );
};

export default App;
