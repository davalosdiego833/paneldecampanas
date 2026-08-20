import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AdvisorData } from '../../types';
import { Gift, Award, Calendar, CheckCircle2, PackageCheck, Sparkles, FileText, ArrowUpRight, Percent, Zap } from 'lucide-react';

interface Props {
    data: AdvisorData;
}

export const EducarEsCreer: React.FC<Props> = ({ data }) => {
    const [activeTab, setActiveTab] = useState<'convenciones' | 'clientes'>('convenciones');

    const puntosDoble = Number(data.Puntos_Doble || data.Puntos_Extra || 0);
    const polizasDetalle: any[] = Array.isArray(data.Polizas_Detalle) ? data.Polizas_Detalle : [];
    const clientesKits: any[] = Array.isArray(data.Clientes_Kits) ? data.Clientes_Kits : [];

    const kitsGanadosNacional = Number(data.Kits_Ganados_Nacional || 50);
    const kitsRestantesNacional = Number(data.Kits_Restantes_Nacional || 950);
    const totalKitsNacional = 1000;
    const progressPct = Math.min(100, Math.round((kitsGanadosNacional / totalKitsNacional) * 100));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Banner de Navegación por Pestañas */}
            <div className="glass-card" style={{ padding: '16px', display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <button
                    onClick={() => setActiveTab('convenciones')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '14px 28px',
                        borderRadius: '12px',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        background: activeTab === 'convenciones'
                            ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.25), rgba(212, 175, 55, 0.08))'
                            : 'transparent',
                        color: activeTab === 'convenciones' ? 'var(--accent-gold, #d4af37)' : 'var(--text-secondary)',
                        border: activeTab === 'convenciones' ? '1px solid rgba(212, 175, 55, 0.4)' : '1px solid transparent'
                    }}
                >
                    <Award size={20} />
                    <span>Convenciones al Doble (Asesores)</span>
                </button>

                <button
                    onClick={() => setActiveTab('clientes')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '14px 28px',
                        borderRadius: '12px',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        background: activeTab === 'clientes'
                            ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(59, 130, 246, 0.08))'
                            : 'transparent',
                        color: activeTab === 'clientes' ? '#60a5fa' : 'var(--text-secondary)',
                        border: activeTab === 'clientes' ? '1px solid rgba(96, 165, 250, 0.4)' : '1px solid transparent'
                    }}
                >
                    <Gift size={20} />
                    <span>Kits Escolares (Clientes)</span>
                </button>
            </div>

            {/* PESTAÑA 1: CONVENCIONES AL DOBLE */}
            {activeTab === 'convenciones' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    {/* Tarjetas Informativas de Ponderación */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                        <div className="glass-card" style={{ padding: '24px', borderLeft: '4px solid #d4af37' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Cuaderno UDIS</span>
                                <Percent size={20} color="#d4af37" />
                            </div>
                            <h3 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-gold, #d4af37)', margin: 0 }}>120%</h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '6px' }}>Sube de 80% a 120% en Prima Meta y Pago</p>
                        </div>

                        <div className="glass-card" style={{ padding: '24px', borderLeft: '4px solid #3b82f6' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Cuaderno Dólares</span>
                                <Zap size={20} color="#60a5fa" />
                            </div>
                            <h3 style={{ fontSize: '2rem', fontWeight: 800, color: '#60a5fa', margin: 0 }}>75%</h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '6px' }}>Sube de 50% a 75% en Prima Meta y Pago</p>
                        </div>

                        <div className="glass-card" style={{ padding: '24px', borderLeft: '4px solid #10b981' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Convenciones</span>
                                <Sparkles size={20} color="#34d399" />
                            </div>
                            <h3 style={{ fontSize: '2rem', fontWeight: 800, color: '#34d399', margin: 0 }}>200% (AL DOBLE)</h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '6px' }}>Ponderación al doble en UDIS y Dólares</p>
                        </div>
                    </div>

                    {/* Resumen Individual del Asesor */}
                    <div className="glass-card" style={{ padding: '32px', background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.08), transparent)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
                            <div>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                    Puntos / Créditos Extra de Convención Acumulados
                                </span>
                                <h2 style={{ fontSize: '2.8rem', fontWeight: 900, color: 'var(--accent-gold, #d4af37)', margin: '8px 0 0 0' }}>
                                    {puntosDoble.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} pts
                                </h2>
                            </div>
                            <div style={{ padding: '12px 20px', background: 'rgba(212, 175, 55, 0.15)', borderRadius: '12px', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', margin: 0, fontWeight: 600 }}>
                                    Vigencia: 1 de Agosto al 30 de Septiembre 2026
                                </p>
                                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                                    Segubeca plazos plazos ≥ 9 años
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Tabla de Detalle de Pólizas del Asesor */}
                    <div className="glass-card" style={{ padding: '28px' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <FileText size={20} color="var(--accent-gold)" />
                            <span>Pólizas Emitidas y Pagadas en Campaña</span>
                        </h3>

                        {polizasDetalle.length === 0 ? (
                            <div style={{ padding: '40px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                                <Award size={36} color="var(--accent-gold)" style={{ opacity: 0.6, marginBottom: '12px' }} />
                                <p style={{ fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Aún no registras pólizas de Segubeca emitidas en agosto/septiembre</p>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                                    Todas tus pólizas Segubeca plazos ≥ 9 años emitidas y pagadas en este periodo sumarán créditos al doble automáticamente aquí.
                                </p>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                                            <th style={{ padding: '12px' }}>Póliza</th>
                                            <th style={{ padding: '12px' }}>Plan</th>
                                            <th style={{ padding: '12px' }}>F. Emisión</th>
                                            <th style={{ padding: '12px' }}>F. Pago</th>
                                            <th style={{ padding: '12px' }}>Forma Pago</th>
                                            <th style={{ padding: '12px', textAlign: 'right' }}>Prima Recibo</th>
                                            <th style={{ padding: '12px', textAlign: 'right' }}>Crédito Doble</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {polizasDetalle.map((p, idx) => (
                                            <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <td style={{ padding: '12px', fontWeight: 700, color: 'var(--accent-gold)' }}>{p.Poliza || p.POL}</td>
                                                <td style={{ padding: '12px' }}>{p.Plan || p.DESC_PLAN || 'SEGUBECA'}</td>
                                                <td style={{ padding: '12px' }}>{p.F_Emision || p.Emisión || 'N/A'}</td>
                                                <td style={{ padding: '12px' }}>{p.F_Pago || p.Pago || 'N/A'}</td>
                                                <td style={{ padding: '12px' }}>{p.Forma_Pago || p.Forma_de_Pago || 'N/A'}</td>
                                                <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>
                                                    ${Number(p.Prima_Recibo || p.Pma_Recibo || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: '#34d399' }}>
                                                    ${Number(p.Comisiones || p.Credito_Doble || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}

            {/* PESTAÑA 2: KITS PARA CLIENTES */}
            {activeTab === 'clientes' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    {/* Contador Nacional de Kits */}
                    <div className="glass-card" style={{ padding: '32px', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), transparent)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', marginBottom: '24px' }}>
                            <div>
                                <span style={{ fontSize: '0.85rem', color: '#93c5fd', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                    Contador Nacional de Kits de Regreso a Clases
                                </span>
                                <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#60a5fa', margin: '6px 0 0 0' }}>
                                    {kitsRestantesNacional} KITS RESTANTES
                                </h2>
                                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                    De 1,000 Kits disponibles a nivel nacional • ¡Ya se han entregado {kitsGanadosNacional} kits!
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <div style={{ padding: '16px 24px', background: 'rgba(59, 130, 246, 0.15)', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, textTransform: 'uppercase' }}>Ganados Nacional</p>
                                    <p style={{ fontSize: '1.6rem', fontWeight: 800, color: '#60a5fa', margin: 0 }}>{kitsGanadosNacional}</p>
                                </div>
                                <div style={{ padding: '16px 24px', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, textTransform: 'uppercase' }}>Disponibles</p>
                                    <p style={{ fontSize: '1.6rem', fontWeight: 800, color: '#34d399', margin: 0 }}>{kitsRestantesNacional}</p>
                                </div>
                            </div>
                        </div>

                        {/* Barra de progreso */}
                        <div style={{ width: '100%', height: '14px', background: 'rgba(255,255,255,0.08)', borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
                            <div style={{ width: `${progressPct}%`, height: '100%', background: 'linear-gradient(90deg, #3b82f6, #60a5fa)', borderRadius: '10px', transition: 'width 1s ease' }} />
                        </div>
                    </div>

                    {/* Ficha Informativa del Kit */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                        <div className="glass-card" style={{ padding: '28px' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#60a5fa', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Gift size={22} />
                                <span>¿Qué incluye el Kit para el Cliente?</span>
                            </h3>
                            <ul style={{ paddingLeft: '20px', color: 'var(--text-primary)', lineHeight: 1.8, fontSize: '0.92rem' }}>
                                <li>🎒 <b>Lonchera exclusiva</b> para regreso a clases.</li>
                                <li>📘 <b>Libreta institucional</b>.</li>
                                <li>✏️ <b>Caja de colores</b>.</li>
                            </ul>
                        </div>

                        <div className="glass-card" style={{ padding: '28px' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#60a5fa', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <CheckCircle2 size={22} />
                                <span>Requisitos para Obtenerlo</span>
                            </h3>
                            <ul style={{ paddingLeft: '20px', color: 'var(--text-primary)', lineHeight: 1.8, fontSize: '0.92rem' }}>
                                <li> Contratar póliza <b>Segubeca</b> durante agosto o septiembre 2026.</li>
                                <li> Prima recibo anualizada <b>≥ $30,000 MXN</b>.</li>
                                <li> Formas de pago participantes: <b>Anual, Semestral y Trimestral</b>.</li>
                                <li> Válido para los primeros <b>1,000 clientes a nivel nacional</b>.</li>
                            </ul>
                        </div>
                    </div>

                    {/* Pólizas del Asesor con Kit Ganado */}
                    <div className="glass-card" style={{ padding: '28px' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <PackageCheck size={20} color="#60a5fa" />
                            <span>Kits Ganados por tus Clientes</span>
                        </h3>

                        {clientesKits.length === 0 ? (
                            <div style={{ padding: '40px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                                <Gift size={36} color="#60a5fa" style={{ opacity: 0.6, marginBottom: '12px' }} />
                                <p style={{ fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Tus clientes aún pueden llevarse kits escolares</p>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                                    ¡Quedan 950 kits disponibles! Emite Segubecas desde $30,000 anuales para que tus clientes aseguren su regalo.
                                </p>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                                            <th style={{ padding: '12px' }}>Póliza</th>
                                            <th style={{ padding: '12px' }}>F. Emisión</th>
                                            <th style={{ padding: '12px' }}>Forma Pago</th>
                                            <th style={{ padding: '12px', textAlign: 'right' }}>Prima Recibo</th>
                                            <th style={{ padding: '12px', textAlign: 'center' }}>Estatus Kit</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {clientesKits.map((k, idx) => (
                                            <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <td style={{ padding: '12px', fontWeight: 700, color: '#60a5fa' }}>{k.Poliza || k.POL}</td>
                                                <td style={{ padding: '12px' }}>{k.F_Emision || k.Emisión || 'N/A'}</td>
                                                <td style={{ padding: '12px' }}>{k.Forma_Pago || 'N/A'}</td>
                                                <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>
                                                    ${Number(k.Prima_Recibo || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                    <span style={{ padding: '4px 12px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700 }}>
                                                        🎁 Kit Asignado
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default EducarEsCreer;
