import React, { useState, useEffect } from 'react';
import { ThemeConfig, Page } from './types';
import Layout from './components/Layout';
import Welcome from './components/Welcome';
import CampaignSelector from './components/CampaignSelector';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
    const [page, setPage] = useState<Page>('welcome');
    const [theme, setTheme] = useState<ThemeConfig | null>(null);
    const [selectedAdvisor, setSelectedAdvisor] = useState<string | null>(null);
    const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
    const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');

    const toggleTheme = () => {
        setThemeMode(prev => prev === 'dark' ? 'light' : 'dark');
    };

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

    useEffect(() => {
        fetch('/api/active-theme')
            .then(res => res.json())
            .then(data => setTheme(data))
            .catch(err => console.error('Error fetching theme:', err));
    }, []);

    return (
        <Layout
            theme={theme}
            onGoHome={handleGoHome}
            page={page}
            setPage={setPage}
            selectedCampaign={selectedCampaign}
            themeMode={themeMode}
            toggleTheme={toggleTheme}
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
