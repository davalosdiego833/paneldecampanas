import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    parseCabeceraGeneral, parseResumenBonosDesdeTablas, parseBonoInicialGA, parseApoyoGA, TablaCruda,
} from '../../utils/parsePremiosPromotoria';
import { Stat, Gate, FilaRecibo, ResumenBonosTabla, fmt, fmtPct } from './BonoPremios';

interface RawDataGA {
    resumen: { cabecera: { _raw: string[] } };
    bonoInicialTablas: TablaCruda[];
    apoyoTablas: TablaCruda[];
}

const BonoGerenteAgencia: React.FC = () => {
    const [data, setData] = useState<RawDataGA | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        setLoading(true);
        setNotFound(false);
        fetch('/api/premios-ga')
            .then(async res => {
                if (res.status === 404) { setNotFound(true); return null; }
                if (!res.ok) throw new Error('Error de red');
                return res.json();
            })
            .then(d => { if (d) setData(d); })
            .catch(() => setNotFound(true))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-gold)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        </div>
    );

    if (notFound || !data) return (
        <div className="glass-card" style={{ padding: '60px', textAlign: 'center', maxWidth: '600px', margin: '40px auto' }}>
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🏆</div>
            <h2 className="text-gold" style={{ fontSize: '1.5rem', marginBottom: '16px', fontWeight: 800 }}>Reporte de Premios aún no disponible</h2>
            <p className="text-muted" style={{ fontSize: '0.95rem', lineHeight: 1.6 }}>Pídele al robot que lo actualice y en un momento aparecerá aquí.</p>
        </div>
    );

    const cab = parseCabeceraGeneral(data.resumen.cabecera._raw);
    const resumenBonos = parseResumenBonosDesdeTablas(data.bonoInicialTablas);
    const bi = parseBonoInicialGA(data.bonoInicialTablas);
    const ap = parseApoyoGA(data.apoyoTablas);

    const cumpleGanadoresTA = ap.ganadoresTA >= ap.ganadoresTAMin;
    const cumpleComisiones = ap.comisionesTotales >= ap.comisionesTotalesMin;
    const cumpleApoyo = ap.pctCumplimiento >= 100;

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <header className="glass-card" style={{ padding: '28px', display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>🏆 Reporte de <span className="text-gold">Premios</span> — Gerente de Agencia</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
                        {cab.nombre} · Clave: {cab.clave} · Corte: {cab.avanceAl} · Fecha Conexión: {cab.fechaConexion}
                    </p>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                <Stat label="Asesores" value={cab.indicadores['Asesores'] || '—'} />
                <Stat label="Bono Inicial" value={cab.indicadores['Bono Inicial'] || '—'} />
                <Stat label="% Cumpl. Apoyos" value={cab.indicadores['% Cumpl. Apoyos'] || '—'} />
                <Stat label="Com Inicial VI" value={cab.indicadores['Com Inicial VI'] || '—'} />
                <Stat label="Com Inicial GMMI" value={cab.indicadores['Com Inicial GMMI'] || '—'} />
                <Stat label="LIMRA" value={cab.indicadores['LIMRA'] || '—'} />
                <Stat label="IGC" value={cab.indicadores['IGC'] || '—'} />
            </div>

            <ResumenBonosTabla filas={resumenBonos} activo="" />

            {/* ============ BONO INICIAL — DESGLOSE ============ */}
            <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '4px' }}>📋 Bono Inicial — Desglose</h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    Es la suma de las comisiones iniciales (Vida + GMMI) de todos los asesores del grupo de la Gerente.
                </p>
            </div>

            <div className="glass-card" style={{ padding: '20px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px', opacity: 0.8 }}>Detalle de Asesores</h4>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', minWidth: '760px' }}>
                        <thead>
                            <tr style={{ color: 'var(--text-secondary)', textAlign: 'right' }}>
                                <th style={{ textAlign: 'left', padding: '6px 8px' }}>Clave</th>
                                <th style={{ textAlign: 'left', padding: '6px 8px' }}>Nombre</th>
                                <th style={{ padding: '6px 8px' }}>Estatus</th>
                                <th style={{ padding: '6px 8px' }}>Com VI Mes</th>
                                <th style={{ padding: '6px 8px' }}>Com GMMI Mes</th>
                                <th style={{ padding: '6px 8px' }}>Com VI+GMMI Acum</th>
                                <th style={{ padding: '6px 8px' }}>LIMRA</th>
                                <th style={{ padding: '6px 8px' }}>IGC</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bi.asesores.map(a => (
                                <tr key={a.clave} style={{ opacity: a.estatus === 'Inactivo' ? 0.5 : 1 }}>
                                    <td style={{ padding: '4px 8px' }}>{a.clave}</td>
                                    <td style={{ padding: '4px 8px' }}>{a.nombre}</td>
                                    <td style={{ padding: '4px 8px', textAlign: 'right' }}>{a.estatus}</td>
                                    <td style={{ padding: '4px 8px', textAlign: 'right' }}>{fmt(a.comVIMes)}</td>
                                    <td style={{ padding: '4px 8px', textAlign: 'right' }}>{fmt(a.comGMMIMes)}</td>
                                    <td style={{ padding: '4px 8px', textAlign: 'right' }}>{fmt(a.comVIGMMIAcum)}</td>
                                    <td style={{ padding: '4px 8px', textAlign: 'right' }}>{fmtPct(a.limra)}</td>
                                    <td style={{ padding: '4px 8px', textAlign: 'right' }}>{fmtPct(a.igc)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '10px', padding: '16px 18px', marginTop: '18px' }}>
                    <FilaRecibo label="Bono Mes (suma de Com VI Mes + Com GMMI Mes de todos)" valor={fmt(bi.totalMes)} operador="=" final />
                    <FilaRecibo label="Bono Acumulado (suma de Com VI+GMMI Acum de todos)" valor={fmt(bi.totalAcumulado)} operador="=" final />
                </div>
            </div>

            {/* ============ APOYO — DESGLOSE ============ */}
            <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '4px' }}>🤝 Apoyo — Desglose (Mes {ap.mesActual})</h3>
            </div>

            <div className="glass-card" style={{ padding: '20px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px', opacity: 0.8 }}>Histórico de Cumplimiento</h4>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', minWidth: '480px' }}>
                        <thead>
                            <tr style={{ color: 'var(--text-secondary)' }}>
                                <th style={{ textAlign: 'left', padding: '6px 8px' }}>Mes</th>
                                {ap.historico.map(h => <th key={h.mesNumero} style={{ padding: '6px 8px', textAlign: 'right' }}>{h.mesLabel}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={{ padding: '4px 8px', color: 'var(--text-secondary)' }}>Mes concurso</td>
                                {ap.historico.map(h => <td key={h.mesNumero} style={{ padding: '4px 8px', textAlign: 'right' }}>{h.mesNumero}</td>)}
                            </tr>
                            <tr>
                                <td style={{ padding: '4px 8px', color: 'var(--text-secondary)' }}>% Cumplimiento</td>
                                {ap.historico.map(h => (
                                    <td key={h.mesNumero} style={{ padding: '4px 8px', textAlign: 'right', fontWeight: h.mesNumero === ap.mesActual ? 700 : 400, color: h.gana ? 'var(--accent-gold)' : 'inherit' }}>
                                        {h.gana && '✅ '}{fmtPct(h.pctCump)}
                                    </td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="glass-card" style={{ padding: '20px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px', opacity: 0.8 }}>Cumplimiento del mes {ap.mesActual}</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                    <Stat label="Ganadores TA" value={`${ap.ganadoresTA} / ${ap.ganadoresTAMin}`} />
                    <Stat label="Comisiones Vida" value={fmt(ap.comisionesVida)} />
                    <Stat label="Comisiones GMMI" value={fmt(ap.comisionesGMMI)} />
                    <Stat label="Comisiones Totales" value={fmt(ap.comisionesTotales)} sub={`Meta: ${fmt(ap.comisionesTotalesMin)}`} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                    <Gate ok={cumpleGanadoresTA} label={cumpleGanadoresTA ? `Cumple Ganadores TA (${ap.ganadoresTA}/${ap.ganadoresTAMin})` : `Faltan Ganadores TA (${ap.ganadoresTA}/${ap.ganadoresTAMin})`} />
                    <Gate ok={cumpleComisiones} label={cumpleComisiones ? 'Cumple meta de Comisiones Totales' : `Faltan ${fmt(ap.comisionesTotalesMin - ap.comisionesTotales)} de Comisiones Totales`} />
                    <Gate ok={cumpleApoyo} label={cumpleApoyo ? 'Cumplimiento al 100% — gana el Apoyo del mes' : `Cumplimiento del ${fmtPct(ap.pctCumplimiento)} — se necesita 100% para ganar el Apoyo`} />
                </div>
                <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '10px', padding: '16px 18px' }}>
                    <FilaRecibo label="Comisiones Totales / Meta" nota={`${fmt(ap.comisionesTotales)} ÷ ${fmt(ap.comisionesTotalesMin)}`} valor={fmtPct(ap.pctCumplimiento)} operador="=" />
                    <FilaRecibo label="Apoyo del mes" nota={cumpleApoyo ? 'Cumplimiento ≥ 100%' : 'No aplica: cumplimiento por debajo de 100%'} valor={fmt(ap.apoyoMesFinal)} operador="=" />
                    <FilaRecibo label="Apoyos Recuperados" valor={fmt(ap.apoyosRecuperados)} operador="+" />
                    <FilaRecibo label="Apoyos Acumulados" valor={fmt(ap.apoyosAcumulados)} operador="=" final />
                </div>
            </div>
        </motion.div>
    );
};

export default BonoGerenteAgencia;
