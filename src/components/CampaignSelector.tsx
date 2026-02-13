import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Props {
    advisor: string;
    onCampaignSelect: (campaign: string) => void;
}

const CampaignSelector: React.FC<Props> = ({ advisor, onCampaignSelect }) => {
    const [campaigns, setCampaigns] = useState<string[]>([]);
    const [dates, setDates] = useState<Record<string, string>>({});

    const campaignOrder = ["legion_centurion", "mdrt", "convenciones", "camino_cumbre", "graduacion"];

    const logoMapping: Record<string, string> = {
        "legion_centurion": "/assets/logos/campanas/legion_centurion.png",
        "mdrt": "/assets/logos/campanas/mdrt.png",
        "convenciones": "/assets/logos/campanas/convenciones.png",
        "camino_cumbre": "/assets/logos/campanas/camino_cumbre.png",
        "graduacion": "/assets/logos/campanas/graduacion.png"
    };

    useEffect(() => {
        fetch('/api/campaigns')
            .then(res => res.json())
            .then(data => {
                const sorted = data.sort((a: string, b: string) => {
                    return campaignOrder.indexOf(a) - campaignOrder.indexOf(b);
                });
                setCampaigns(sorted);
            });

        fetch('/api/campaigns/dates')
            .then(res => res.json())
            .then(data => setDates(data))
            .catch(err => console.error('Error fetching campaign dates:', err));
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ padding: '0 20px' }}
        >
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '16px' }}>
                    Hola, <span className="text-gold">{advisor}</span>
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                    Selecciona la campaña que deseas consultar:
                </p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '32px',
                maxWidth: '1200px',
                margin: '0 auto'
            }}>
                {campaigns.map(camp => (
                    <motion.div
                        key={camp}
                        whileHover={{ scale: 1.03, translateY: -5 }}
                        className="glass-card"
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            minHeight: '320px',
                            padding: '32px'
                        }}
                        onClick={() => onCampaignSelect(camp)}
                    >
                        {/* Fecha de corte badge */}
                        {dates[camp] && (
                            <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '5px 14px',
                                background: 'rgba(212, 175, 55, 0.12)',
                                border: '1px solid rgba(212, 175, 55, 0.25)',
                                borderRadius: '20px',
                                fontSize: '0.78rem',
                                color: 'var(--accent-gold, #d4af37)',
                                fontWeight: 500,
                                marginBottom: '12px',
                                letterSpacing: '0.02em'
                            }}>
                                <span>📅</span>
                                <span>Corte: <strong>{dates[camp]}</strong></span>
                            </div>
                        )}

                        <div style={{
                            height: '160px',
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '24px',
                            flex: 1
                        }}>
                            <img
                                src={logoMapping[camp] || '/assets/logos/campanas/generic.png'}
                                alt={camp}
                                style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.3))' }}
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/assets/logos/campanas/generic.png';
                                }}
                            />
                        </div>
                        <button className="btn-primary" style={{ fontSize: '0.9rem', padding: '12px 24px' }}>
                            ENTRAR A {camp.replace(/_/g, ' ').toUpperCase()}
                        </button>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
};

export default CampaignSelector;
