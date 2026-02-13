import React from 'react';
import { motion } from 'framer-motion';
import { AdvisorData } from '../../types';

interface Props {
    data: AdvisorData;
}

const formatCurrency = (val: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val);

const MESES_ES = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

/** Convert an Excel serial date number (days since 1900-01-01) to a readable Spanish date */
const formatExcelDate = (raw: any): string => {
    if (raw == null || raw === '' || raw === 0) return 'No disponible';

    const num = Number(raw);
    if (!isNaN(num) && num > 30000 && num < 100000) {
        const excelEpoch = new Date(Date.UTC(1899, 11, 30));
        const date = new Date(excelEpoch.getTime() + num * 86400000);
        const month = MESES_ES[date.getUTCMonth()];
        const year = date.getUTCFullYear();
        return `${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`;
    }

    const parsed = new Date(String(raw));
    if (!isNaN(parsed.getTime())) {
        const month = MESES_ES[parsed.getMonth()];
        const year = parsed.getFullYear();
        return `${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`;
    }

    return String(raw);
};

const Graduacion: React.FC<Props> = ({ data }) => {
    const mes_asesor = Math.floor(Number(data.Mes_Asesor || 1));
    const polizas_totales = Number(data.Polizas_Totales || 0);
    const comisiones = Number(data.Comisones || 0);
    const produccion_mes = Number(data.Produccion_Mes || data.Polizas_Mes || 0);
    const fecha_limite = formatExcelDate(data.Limite_Logro_Meta);

    const currentMonth = new Date().getMonth() + 1;
    const monthsTo12 = 12 - mes_asesor;
    const mes12Month = (currentMonth + monthsTo12 - 1) % 12 + 1;

    const corte = [12, 1, 2, 3, 4, 5].includes(mes12Month) ? 'MAYO' : 'NOVIEMBRE';
    const evento = corte === 'MAYO' ? 'AGOSTO' : 'FEBRERO';

    const isMaintenance = mes_asesor > 12;
    const maintenanceAlert = isMaintenance && produccion_mes === 0;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, opacity: 0.8 }}>Información Importante</h3>
                    <div className="glass-card" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: '24px',
                        borderBottom: '4px solid var(--accent-gold)',
                        padding: '32px'
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '0.8rem', opacity: 0.6, textTransform: 'uppercase', marginBottom: '8px' }}>PÓLIZAS TOTALES</p>
                            <p style={{ fontSize: '2rem', fontWeight: 700 }}>{polizas_totales.toFixed(1)}</p>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '0.8rem', opacity: 0.6, textTransform: 'uppercase', marginBottom: '8px' }}>COMISIONES ACUMULADAS</p>
                            <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{formatCurrency(comisiones)}</p>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '0.8rem', opacity: 0.6, textTransform: 'uppercase', marginBottom: '8px' }}>FECHA LÍMITE META</p>
                            <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{fecha_limite}</p>
                        </div>
                    </div>

                    {isMaintenance && (
                        <div className="glass-card" style={{ textAlign: 'center', borderTop: '2px solid var(--accent-gold)' }}>
                            <p style={{ fontSize: '0.9rem' }}>Fase de Mantenimiento | Corte: <b>{corte}</b> | Evento: <b>{evento}</b></p>
                            {maintenanceAlert && (
                                <div style={{
                                    marginTop: '16px',
                                    padding: '12px',
                                    background: 'rgba(255, 59, 48, 0.1)',
                                    color: 'var(--danger-red)',
                                    fontWeight: 700,
                                    borderRadius: '8px',
                                    animation: 'pulse 2s infinite'
                                }}>
                                    ⚠️ REGLA DE MANTENIMIENTO: No puedes cerrar este mes en 0 pólizas.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Time Pie */}
                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
                    <div style={{ position: 'relative', width: '140px', height: '140px' }}>
                        <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }} viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="transparent" />
                            <motion.circle
                                cx="50" cy="50" r="40"
                                stroke="var(--accent-gold)"
                                strokeWidth="8"
                                strokeLinecap="round"
                                fill="transparent"
                                initial={{ strokeDasharray: "0 251.2" }}
                                animate={{ strokeDasharray: `${(Math.min(mes_asesor, 12) / 12) * 251.2} 251.2` }}
                                transition={{ duration: 1 }}
                            />
                        </svg>
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: '1.8rem', fontWeight: 700 }}>{mes_asesor}</span>
                            <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>de 12</span>
                        </div>
                    </div>
                    <p style={{ fontSize: '0.85rem', fontWeight: 700, opacity: 0.6, marginTop: '16px' }}>Mes del Asesor</p>
                </div>
            </section>

            <section style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, opacity: 0.8 }}>Dashboards de Persecución</h3>

                {/* Normal */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-gold)' }}>
                        <span>Graduación Normal (36 Pólizas)</span>
                        <span>{Math.min(100, (polizas_totales / 36) * 100).toFixed(1)}%</span>
                    </div>
                    <div style={{ height: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', overflow: 'hidden' }}>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (polizas_totales / 36) * 100)}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            style={{ height: '100%', background: 'var(--accent-gold)' }}
                        />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', opacity: 0.6 }}>
                        <span>0</span>
                        <span>{polizas_totales >= 36 ? '¡Meta Lograda! 🎉' : `Faltan: ${(36 - polizas_totales).toFixed(1)}`}</span>
                        <span>Meta: 36</span>
                    </div>
                </div>

                {/* Honors */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-gold)' }}>
                        <span>Graduación con Honores (48 Pólizas)</span>
                        <span>{Math.min(100, (polizas_totales / 48) * 100).toFixed(1)}%</span>
                    </div>
                    <div style={{ height: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', overflow: 'hidden' }}>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (polizas_totales / 48) * 100)}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            style={{ height: '100%', background: 'var(--accent-gold)' }}
                        />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', opacity: 0.6 }}>
                        <span>0</span>
                        <span>{polizas_totales >= 48 ? '¡Meta Lograda! 🎉' : `Faltan: ${(48 - polizas_totales).toFixed(1)}`}</span>
                        <span>Meta: 48</span>
                    </div>
                </div>
            </section>

            <footer className="glass-card" style={{ borderLeft: '4px solid var(--accent-gold)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ fontWeight: 700, textTransform: 'uppercase', textAlign: 'center', color: 'var(--accent-gold)' }}>⚠️ Aviso de Calificación</h4>
                <p style={{ opacity: 0.8, fontSize: '0.9rem', textAlign: 'justify' }}>
                    Para asesores que logran la meta antes de su corte, es obligatorio mantener una producción mínima de
                    una (1) póliza mensual. La inactividad comercial anula automáticamente el derecho al evento.
                </p>
            </footer>
        </div>
    );
};

export default Graduacion;
