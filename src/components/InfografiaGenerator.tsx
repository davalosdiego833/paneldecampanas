import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, Image, RefreshCw } from 'lucide-react';
import html2canvas from 'html2canvas';

interface Props {
    onBack: () => void;
    themeMode: 'dark' | 'light';
}

const TEMPLATES = [
    { id: 'top5_convenciones', label: 'Top 5 Convenciones', icon: '✈️', color: '#007AFF', sortKey: 'Lugar', sortAsc: true, campaign: 'convenciones', valueLabel: 'Lugar', valueKey: 'Lugar' },
    { id: 'top5_mdrt', label: 'Top 5 MDRT', icon: '🏆', color: '#D4AF37', sortKey: 'PA_Acumulada', sortAsc: false, campaign: 'mdrt', valueLabel: 'Prima Acumulada', valueKey: 'PA_Acumulada', isCurrency: true },
    { id: 'top5_legion', label: 'Top 5 Legión Centurión', icon: '🛡️', color: '#9C27B0', sortKey: 'Total_Polizas', sortAsc: false, campaign: 'legion_centurion', valueLabel: 'Pólizas', valueKey: 'Total_Polizas' },
    { id: 'top5_camino', label: 'Top 5 Camino a la Cumbre', icon: '⛰️', color: '#00E676', sortKey: 'Polizas_Totales', sortAsc: false, campaign: 'camino_cumbre', valueLabel: 'Pólizas', valueKey: 'Polizas_Totales' },
    { id: 'top5_graduacion', label: 'Top 5 Graduación', icon: '🎓', color: '#FF6B35', sortKey: 'Polizas_Totales', sortAsc: false, campaign: 'graduacion', valueLabel: 'Pólizas', valueKey: 'Polizas_Totales' },
    { id: 'top5_fanfest', label: 'Top 5 Fan Fest', icon: '⚽', color: '#2196F3', sortKey: 'Total_Polizas', sortAsc: false, campaign: 'fanfest', valueLabel: 'Pólizas', valueKey: 'Total_Polizas' },
    { id: 'top5_pagado', label: 'Top 5 Prima Pagada', icon: '💰', color: '#00C853', sortKey: 'Total _Prima_Pagada', sortAsc: false, campaign: '_pagado', valueLabel: 'Prima Pagada', valueKey: 'Total _Prima_Pagada', isCurrency: true },
    { id: 'proactivos_mes', label: 'Asesores Proactivos del Mes', icon: '📊', color: '#FF9800', campaign: '_proactivos', valueLabel: 'Pólizas', valueKey: 'Polizas_Acumuladas_Total' },
];

const formatCurrency = (val: number) => {
    if (Math.abs(val) >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
    if (Math.abs(val) >= 1000) return `$${(val / 1000).toFixed(1)}k`;
    return `$${val.toFixed(0)}`;
};

const InfografiaGenerator: React.FC<Props> = ({ onBack, themeMode }) => {
    const [campaignData, setCampaignData] = useState<any>(null);
    const [snapshotData, setSnapshotData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
    const [generating, setGenerating] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const isDark = themeMode === 'dark';

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const [campRes, snapRes] = await Promise.all([
                    fetch('/api/admin/summary?useSnapshot=true'),
                    fetch('/api/resumen-general'),
                ]);
                const camp = await campRes.json();
                const snap = await snapRes.json();
                setCampaignData(camp);
                setSnapshotData(snap);
            } catch (e) { console.error(e); }
            setLoading(false);
        };
        load();
    }, []);

    const getTemplateData = (tpl: typeof TEMPLATES[0]) => {
        if (tpl.campaign === '_pagado') {
            const raw = snapshotData?.pagado_pendiente || [];
            return [...raw].sort((a: any, b: any) => (b['Total _Prima_Pagada'] || 0) - (a['Total _Prima_Pagada'] || 0)).slice(0, 5).map((r: any, i: number) => ({
                rank: i + 1, name: r['Nombre Asesor'], value: r['Total _Prima_Pagada'] || 0,
            }));
        }
        if (tpl.campaign === '_proactivos') {
            const raw = snapshotData?.proactivos || [];
            return raw.filter((r: any) => r.Proactivo_al_mes === 'p').map((r: any, i: number) => ({
                rank: i + 1, name: r.ASESOR, value: r.Polizas_Acumuladas_Total || 0,
            }));
        }
        const data = campaignData?.[tpl.campaign] || [];
        const sorted = [...data].sort((a: any, b: any) => tpl.sortAsc ? (a[tpl.sortKey!] - b[tpl.sortKey!]) : (b[tpl.sortKey!] - a[tpl.sortKey!]));
        return sorted.slice(0, 5).map((r: any, i: number) => ({
            rank: i + 1, name: r.Asesor || r.Nombre, value: r[tpl.valueKey] || 0,
        }));
    };

    const getCutoffDate = (tpl: typeof TEMPLATES[0]) => {
        if (tpl.campaign.startsWith('_')) {
            return snapshotData?.fechas_corte?.[tpl.campaign === '_pagado' ? 'pagado_pendiente' : 'proactivos'] || snapshotData?.fechas_corte || '';
        }
        return campaignData?.dates?.[tpl.campaign] || '';
    };

    const handleDownload = async () => {
        if (!cardRef.current) return;
        setGenerating(true);
        try {
            const canvas = await html2canvas(cardRef.current, {
                backgroundColor: '#0a0e17',
                scale: 3,
                useCORS: true,
                logging: false,
            });
            const link = document.createElement('a');
            const tpl = TEMPLATES.find(t => t.id === selectedTemplate);
            link.download = `infografia_${tpl?.campaign || 'panel'}_${new Date().toISOString().slice(0, 10)}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (e) { console.error(e); }
        setGenerating(false);
    };

    const selected = TEMPLATES.find(t => t.id === selectedTemplate);
    const rows = selected ? getTemplateData(selected) : [];
    const cutoff = selected ? getCutoffDate(selected) : '';
    const isProactivos = selected?.campaign === '_proactivos';

    return (
        <div style={{ minHeight: '100vh', background: isDark ? 'radial-gradient(ellipse at top, #0f1219 0%, #080a0f 70%)' : 'linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%)', color: isDark ? '#fff' : '#1a1a2e', fontFamily: "'Inter', sans-serif" }}>
            {/* Header */}
            <div style={{ padding: '20px 32px', display: 'flex', alignItems: 'center', gap: '16px', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`, background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.8)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 100 }}>
                <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: isDark ? '#fff' : '#333', display: 'flex', alignItems: 'center' }}><ArrowLeft size={20} /></button>
                <Image size={24} style={{ color: '#E040FB' }} />
                <div>
                    <h1 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Generador de Infografías</h1>
                    <p style={{ fontSize: '0.7rem', opacity: 0.5, margin: 0 }}>Crea imágenes para compartir con tu equipo</p>
                </div>
            </div>

            <div style={{ padding: '24px 32px', maxWidth: '1100px', margin: '0 auto' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px', opacity: 0.5 }}>
                        <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite' }} />
                        <p>Cargando datos...</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: selectedTemplate ? '280px 1fr' : '1fr', gap: '24px' }}>
                        {/* Template Selector */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <p style={{ fontSize: '0.8rem', fontWeight: 700, opacity: 0.5, marginBottom: '4px' }}>SELECCIONA UNA PLANTILLA</p>
                            {TEMPLATES.map(tpl => (
                                <motion.button
                                    key={tpl.id}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setSelectedTemplate(tpl.id)}
                                    style={{
                                        padding: '14px 16px', borderRadius: '12px', cursor: 'pointer',
                                        background: selectedTemplate === tpl.id ? `${tpl.color}20` : isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                                        border: `1px solid ${selectedTemplate === tpl.id ? `${tpl.color}60` : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                                        display: 'flex', alignItems: 'center', gap: '10px',
                                        color: 'inherit', fontFamily: 'inherit', textAlign: 'left',
                                    }}
                                >
                                    <span style={{ fontSize: '1.2rem' }}>{tpl.icon}</span>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{tpl.label}</span>
                                </motion.button>
                            ))}
                        </div>

                        {/* Preview + Download */}
                        {selectedTemplate && selected && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
                                {/* The Infographic Card */}
                                <div ref={cardRef} style={{
                                    width: '520px', padding: '40px',
                                    background: 'linear-gradient(145deg, #0a0e17 0%, #131829 50%, #0a0e17 100%)',
                                    borderRadius: '24px', position: 'relative', overflow: 'hidden',
                                    fontFamily: "'Inter', 'Segoe UI', sans-serif",
                                }}>
                                    {/* Background accents */}
                                    <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '250px', height: '250px', background: `radial-gradient(circle, ${selected.color}15 0%, transparent 70%)`, pointerEvents: 'none' }} />
                                    <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '200px', height: '200px', background: `radial-gradient(circle, ${selected.color}10 0%, transparent 70%)`, pointerEvents: 'none' }} />

                                    {/* Header */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px', position: 'relative', zIndex: 2 }}>
                                        <img src="/assets/logos/empresa/ambriz_logo.png" alt="logo" style={{ height: '36px', objectFit: 'contain' }} crossOrigin="anonymous" />
                                        <div style={{ flex: 1 }} />
                                        <span style={{ fontSize: '2rem' }}>{selected.icon}</span>
                                    </div>

                                    <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff', margin: '8px 0 2px', letterSpacing: '-0.5px', position: 'relative', zIndex: 2 }}>
                                        {isProactivos ? 'Asesores Proactivos' : `Top ${rows.length}`}
                                    </h2>
                                    <p style={{ fontSize: '0.95rem', fontWeight: 700, color: selected.color, margin: '0 0 4px', position: 'relative', zIndex: 2 }}>
                                        {selected.label}
                                    </p>
                                    {cutoff && <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', margin: '0 0 20px', position: 'relative', zIndex: 2 }}>Corte: {cutoff}</p>}

                                    {/* Divider */}
                                    <div style={{ height: '2px', background: `linear-gradient(90deg, ${selected.color}, transparent)`, marginBottom: '20px', borderRadius: '2px', position: 'relative', zIndex: 2 }} />

                                    {/* Rows */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative', zIndex: 2 }}>
                                        {rows.length === 0 && <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '20px' }}>Sin datos disponibles</p>}
                                        {rows.map((row: any, i: number) => {
                                            const medals = ['🥇', '🥈', '🥉'];
                                            const firstName = row.name ? row.name.split(' ').slice(0, 2).map((w: string) => w.charAt(0) + w.slice(1).toLowerCase()).join(' ') : 'Asesor';
                                            const displayValue = selected.isCurrency ? formatCurrency(row.value) : (selected.campaign === 'convenciones' ? `#${row.value}` : `${row.value} pólizas`);

                                            return (
                                                <div key={i} style={{
                                                    display: 'flex', alignItems: 'center', gap: '12px',
                                                    padding: '12px 16px', borderRadius: '12px',
                                                    background: i === 0 ? `linear-gradient(135deg, ${selected.color}18 0%, ${selected.color}08 100%)` : 'rgba(255,255,255,0.03)',
                                                    border: `1px solid ${i === 0 ? `${selected.color}30` : 'rgba(255,255,255,0.05)'}`,
                                                }}>
                                                    <span style={{ fontSize: i < 3 ? '1.5rem' : '1rem', minWidth: '32px', textAlign: 'center' }}>
                                                        {i < 3 ? medals[i] : `${row.rank}.`}
                                                    </span>
                                                    <div style={{ flex: 1 }}>
                                                        <p style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff', margin: 0 }}>{firstName}</p>
                                                    </div>
                                                    <div style={{
                                                        padding: '4px 12px', borderRadius: '8px',
                                                        background: `${selected.color}20`,
                                                        fontSize: '0.8rem', fontWeight: 800, color: selected.color,
                                                    }}>
                                                        {displayValue}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Footer */}
                                    <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
                                        <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)', margin: 0 }}>Ambriz Asesores • Panel de Campañas</p>
                                        <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)', margin: 0 }}>ambrizasesores.com</p>
                                    </div>
                                </div>

                                {/* Download Button */}
                                <motion.button
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={handleDownload}
                                    disabled={generating || rows.length === 0}
                                    style={{
                                        padding: '14px 32px', borderRadius: '14px',
                                        background: `linear-gradient(135deg, ${selected.color}, ${selected.color}cc)`,
                                        border: 'none', color: '#fff', fontSize: '1rem', fontWeight: 800,
                                        cursor: rows.length === 0 ? 'not-allowed' : 'pointer',
                                        display: 'flex', alignItems: 'center', gap: '10px',
                                        fontFamily: 'inherit', opacity: rows.length === 0 ? 0.4 : 1,
                                        boxShadow: `0 4px 20px ${selected.color}40`,
                                    }}
                                >
                                    <Download size={20} />
                                    {generating ? 'Generando...' : 'Descargar Imagen PNG'}
                                </motion.button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default InfografiaGenerator;
