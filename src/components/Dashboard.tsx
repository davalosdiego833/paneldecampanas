import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AdvisorData } from '../types';
import Mdrt from './Dashboards/Mdrt';
import LegionCenturion from './Dashboards/LegionCenturion';
import Convenciones from './Dashboards/Convenciones';
import CaminoCumbre from './Dashboards/CaminoCumbre';
import Graduacion from './Dashboards/Graduacion';

interface Props {
    campaign: string;
    advisor: string;
}

const Dashboard: React.FC<Props> = ({ campaign, advisor }) => {
    const [data, setData] = useState<AdvisorData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch(`/api/campaign/${campaign}/data/${advisor}`)
            .then(res => res.json())
            .then(d => {
                setData(d);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching dashboard data:', err);
                setLoading(false);
            });
    }, [campaign, advisor]);

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px', flexDirection: 'column', gap: '20px' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-gold)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <p style={{ color: 'var(--text-secondary)' }}>Cargando información...</p>
        </div>
    );

    if (!data) return (
        <div className="glass-card" style={{ padding: '60px', textAlign: 'center' }}>
            <h2 className="text-gold" style={{ fontSize: '1.5rem', marginBottom: '16px' }}>Datos no encontrados</h2>
            <p className="text-muted">No se encontró información para esta campaña y asesor.</p>
        </div>
    );

    const renderDashboard = () => {
        switch (campaign.toLowerCase()) {
            case 'mdrt': return <Mdrt data={data} />;
            case 'legion_centurion': return <LegionCenturion data={data} />;
            case 'convenciones': return <Convenciones data={data} />;
            case 'camino_cumbre': return <CaminoCumbre data={data} />;
            case 'graduacion': return <Graduacion data={data} />;
            default: return (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '24px'
                }}>
                    {Object.entries(data).map(([key, value]) => (
                        key !== 'Asesor' && (
                            <div key={key} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                                <p style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '8px' }}>{key}</p>
                                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{String(value)}</p>
                            </div>
                        )
                    ))}
                </div>
            );
        }
    };

    const formatDate = (date: string | number) => {
        if (!date) return 'Fecha no disponible';

        // Handle Excel serial number
        if (typeof date === 'number') {
            const excelEpoch = new Date(1899, 11, 30);
            const dt = new Date(excelEpoch.getTime() + date * 86400000);
            return dt.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
        }

        // Handle string date
        const dt = new Date(date);
        if (isNaN(dt.getTime())) return String(date); // Return as is if invalid date

        return dt.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ paddingBottom: '48px' }}
        >
            <header className="glass-card" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '32px',
                marginBottom: '48px',
                padding: '32px',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '300px',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.05))',
                    pointerEvents: 'none'
                }} />

                <div style={{ width: '120px', flexShrink: 0 }}>
                    <img
                        src={`/assets/logos/campanas/${campaign}.png`}
                        alt={campaign}
                        style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
                        onError={(e) => {
                            (e.target as HTMLImageElement).onerror = null;
                            (e.target as HTMLImageElement).src = '/assets/logos/campanas/generic.png';
                        }}
                    />
                </div>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1.1, textTransform: 'uppercase', marginBottom: '8px' }}>
                        {campaign.replace(/_/g, ' ')}
                    </h1>
                    {data.Fecha_Corte && (
                        <p style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            <span>📅</span>
                            <span>Actualizado al: <b>{formatDate(data.Fecha_Corte)}</b></span>
                        </p>
                    )}
                </div>
            </header>

            {renderDashboard()}
        </motion.div>
    );
};

export default Dashboard;
