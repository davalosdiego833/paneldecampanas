import React from 'react';
import { motion } from 'framer-motion';
import { AdvisorData } from '../../types';

interface Props {
    data: AdvisorData;
}

const META_POLIZAS = 8;
const META_COMISIONES = { CONSOLIDADO: 150000, NUEVA_ORGANIZACION: 80000 } as const;

const fmtMoney = (n: number) =>
    n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });

const fmtConexion = (iso?: string) => {
    if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return '';
    const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
};

const ProgressBar: React.FC<{ label: string; pct: number; left: string; right: string; color: string }> = ({ label, pct, left, right, color }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 700, color }}>
            <span>{label}</span>
            <span>{pct.toFixed(0)}%</span>
        </div>
        <div style={{ height: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', overflow: 'hidden' }}>
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, pct)}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                style={{ height: '100%', background: color }}
            />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', opacity: 0.6 }}>
            <span>{left}</span>
            <span>{right}</span>
        </div>
    </div>
);

const Altamar: React.FC<Props> = ({ data }) => {
    const esConsolidado = String(data.Tipo_Asesor) === 'CONSOLIDADO';
    const tipoLabel = esConsolidado ? 'Asesor Consolidado' : 'Asesor Nueva Organización';
    const metaCom = esConsolidado ? META_COMISIONES.CONSOLIDADO : META_COMISIONES.NUEVA_ORGANIZACION;

    const polizas = Number(data.Polizas || 0);
    const comisiones = Number(data.Comisiones || 0);
    const mes = Math.floor(Number(data.Mes_Asesor || 0));

    const cumplePol = polizas >= META_POLIZAS;
    const cumpleCom = comisiones >= metaCom;
    const cumple = cumplePol && cumpleCom;

    const faltanPol = Math.max(0, META_POLIZAS - polizas);
    const faltanCom = Math.max(0, metaCom - comisiones);

    const statusColor = cumple ? 'var(--success-green)' : 'var(--danger-red)';
    const statusTxt = cumple ? '✅ CUMPLES CAMINO 1' : '❌ AÚN NO CUMPLES';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, opacity: 0.8 }}>Camino 1 · Asesores VI y GMM</h3>
                    <div className="glass-card" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                        gap: '24px',
                        borderBottom: `4px solid ${statusColor}`,
                        padding: '32px'
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '0.75rem', opacity: 0.6, textTransform: 'uppercase', marginBottom: '8px' }}>Pólizas</p>
                            <p style={{ fontSize: '1.8rem', fontWeight: 700 }}>{polizas.toFixed(1)}</p>
                            <p style={{ fontSize: '0.75rem', opacity: 0.5 }}>de {META_POLIZAS}</p>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '0.75rem', opacity: 0.6, textTransform: 'uppercase', marginBottom: '8px' }}>Comisiones iniciales</p>
                            <p style={{ fontSize: '1.8rem', fontWeight: 700 }}>{fmtMoney(comisiones)}</p>
                            <p style={{ fontSize: '0.75rem', opacity: 0.5 }}>de {fmtMoney(metaCom)}</p>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '0.75rem', opacity: 0.6, textTransform: 'uppercase', marginBottom: '8px' }}>Estatus</p>
                            <p style={{ fontSize: '1.15rem', fontWeight: 900, color: statusColor }}>{statusTxt}</p>
                        </div>
                    </div>
                </div>

                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '14px', padding: '32px' }}>
                    <div style={{ display: 'inline-flex', alignSelf: 'flex-start', padding: '6px 14px', borderRadius: '999px', background: 'rgba(212, 175, 55, 0.15)', border: '1px solid rgba(212, 175, 55, 0.35)', color: 'var(--accent-gold)', fontWeight: 700, fontSize: '0.85rem' }}>
                        {tipoLabel}
                    </div>
                    {mes > 0 && (
                        <p style={{ fontSize: '0.95rem', opacity: 0.85 }}>
                            <b>Mes {mes}</b> como asesor
                        </p>
                    )}
                    {fmtConexion(data.Conexion as string) && (
                        <p style={{ fontSize: '0.85rem', opacity: 0.6 }}>Conexión: {fmtConexion(data.Conexion as string)}</p>
                    )}
                </div>
            </section>

            <section style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                <div style={{ background: 'rgba(0, 122, 255, 0.15)', padding: '16px 24px', borderRadius: '12px', color: '#60A5FA', fontWeight: 600, textAlign: 'center' }}>
                    Tu meta: <b>{META_POLIZAS} pólizas</b> iniciales y <b>{fmtMoney(metaCom)}</b> en comisiones iniciales
                </div>

                <ProgressBar
                    label="Pólizas iniciales"
                    pct={(polizas / META_POLIZAS) * 100}
                    color="var(--primary-blue)"
                    left="0"
                    right={cumplePol ? '¡Listo! 🎉' : `Te faltan ${faltanPol.toFixed(1)} pólizas`}
                />
                <ProgressBar
                    label="Comisiones iniciales"
                    pct={(comisiones / metaCom) * 100}
                    color="var(--accent-gold)"
                    left={fmtMoney(0)}
                    right={cumpleCom ? '¡Listo! 🎉' : `Te faltan ${fmtMoney(faltanCom)}`}
                />
            </section>

            <footer className="glass-card" style={{ borderLeft: '4px solid var(--primary-blue)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <h4 style={{ fontWeight: 700, color: 'var(--primary-blue)', fontSize: '1.1rem' }}>Cómo se califica</h4>
                <p style={{ opacity: 0.85, fontSize: '0.95rem' }}>
                    <b>Camino 1:</b> mínimo 8 pólizas iniciales de Vida (cuenta 1) y GMM (cuenta 0.5), más comisiones iniciales mínimas de
                    <b> $80,000</b> para Asesores Nueva Organización o <b>$150,000</b> para Asesores Consolidados.
                </p>
                <p style={{ opacity: 0.6, fontSize: '0.85rem' }}>
                    Camino 2 (30 lugares; mínimo 8 pólizas de GMM y comisiones iniciales de $50,000) y Camino 3 (5 lugares; comisiones iniciales de $60,000 en Vida grupo y GMM colectivo):
                    próximamente verás tu avance aquí. Consulta las bases completas en el portal de asesores.
                </p>
            </footer>
        </div>
    );
};

export default Altamar;
