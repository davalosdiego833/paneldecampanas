import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    parseCabeceraGeneral, parseResumenBonosDesdeTablas, parseBonoVidaPromotoria,
    parsePrimaFaltantePromotoria, parseSubsidiosPromotoria, TablaCruda,
} from '../../utils/parsePremiosPromotoria';
import { Stat, Gate, FilaRecibo, ResumenBonosTabla, fmt, fmtPct } from './BonoPremios';

interface RawDataPromotoria {
    resumen: { cabecera: { _raw: string[] } };
    bonoVidaTexto: string;
    bonoVidaTablas: TablaCruda[];
    primaFaltanteTablas: TablaCruda[];
    subsidiosTexto: string;
    subsidiosTablas: TablaCruda[];
}

// Tabla "Prima Faltante Nueva Organización": Grupo × meses restantes del
// semestre, resaltando el grupo que ya se alcanzó con la producción actual.
const TablaPrimaFaltantePromotoria: React.FC<{
    meses: string[]; filas: { grupo: number; faltantePorMes: (number | null)[]; pctBono: number }[]; grupoActual: number | null;
}> = ({ meses, filas, grupoActual }) => (
    <div className="glass-card" style={{ padding: '20px' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '4px', opacity: 0.8 }}>📊 Prima faltante por grupo (Nueva Organización)</h4>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
            Cuánta prima meta más necesita la promotoría para calificar en cada grupo, en cada mes restante del semestre.
        </p>
        <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', minWidth: '560px' }}>
                <thead>
                    <tr style={{ color: 'var(--text-secondary)', textAlign: 'right' }}>
                        <th style={{ textAlign: 'left', padding: '6px 8px' }}>Grupo</th>
                        {meses.map(m => <th key={m} style={{ padding: '6px 8px' }}>{m}</th>)}
                        <th style={{ padding: '6px 8px' }}>% Bono</th>
                    </tr>
                </thead>
                <tbody>
                    {filas.map(f => {
                        const esActual = f.grupo === grupoActual;
                        return (
                            <tr key={f.grupo} style={{ background: esActual ? 'rgba(212,175,55,0.18)' : 'transparent', fontWeight: esActual ? 700 : 400 }}>
                                <td style={{ padding: '4px 8px' }}>{f.grupo}{esActual && ' 🏆'}</td>
                                {f.faltantePorMes.map((v, i) => (
                                    <td key={i} style={{ padding: '4px 8px', textAlign: 'right' }}>{v === null ? '—' : fmt(v)}</td>
                                ))}
                                <td style={{ padding: '4px 8px', textAlign: 'right', color: 'var(--accent-gold)' }}>{fmtPct(f.pctBono)}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '10px' }}>
            🏆 = grupo calculado actual · "—" = ese grupo ya se alcanzó ese mes (el portal no marca la meta faltante).
        </p>
    </div>
);

const BonoPromotoria: React.FC = () => {
    const [data, setData] = useState<RawDataPromotoria | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        setLoading(true);
        setNotFound(false);
        fetch('/api/premios-promotoria')
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
    const resumenBonos = parseResumenBonosDesdeTablas(data.bonoVidaTablas);
    const bv = parseBonoVidaPromotoria(data.bonoVidaTexto);
    const pf = parsePrimaFaltantePromotoria(data.primaFaltanteTablas);
    const sub = parseSubsidiosPromotoria(data.subsidiosTexto, data.subsidiosTablas);

    // El portal solo da el % y las primas de cada libro (Nva Org / Consolidados)
    // por separado, pero NO el monto en pesos que aporta cada uno — eso lo
    // calculamos nosotros: Prima Pago × % Bono de cada libro.
    const montoInicialNO = bv.primaPagoNOSem * bv.pctBonoInicialNO / 100;
    const montoInicialCons = bv.primaPagoConsSem * bv.pctBonoInicialCons / 100;
    const montoRenovacionNO = bv.primaPagoRenovacionNOSem * bv.pctBonoRenovacionNO / 100;
    const montoRenovacionCons = bv.primaPagoRenovacionConsSem * bv.pctBonoRenovacionCons / 100;

    const cumpleGanadoresTA = bv.ganadoresTA >= bv.ganadoresTAMin;
    const cumpleProactivos = sub.asesoresProactivosSemAnt >= 5;

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <header className="glass-card" style={{ padding: '28px', display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>🏆 Reporte de <span className="text-gold">Premios</span> — Promotoría</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
                        {cab.nombre} · Clave: {cab.clave} · {cab.tipo} · Corte: {cab.avanceAl} · Fecha Conexión: {cab.fechaConexion}
                    </p>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                <Stat label="Asesores" value={cab.indicadores['Asesores'] || '—'} />
                <Stat label="Prima Nva Org." value={cab.indicadores['Prima Nva Org.'] || '—'} />
                <Stat label="Prima Cons" value={cab.indicadores['Prima Cons'] || '—'} />
                <Stat label="Prima Renov" value={cab.indicadores['Prima Renov'] || '—'} />
                <Stat label="LIMRA" value={cab.indicadores['LIMRA'] || '—'} />
                <Stat label="IGC" value={cab.indicadores['IGC'] || '—'} />
                <Stat label="Gerentes de Agencia" value={cab.indicadores['GA'] || '0'} />
            </div>

            <ResumenBonosTabla filas={resumenBonos} activo="" />

            {/* ============ BONO VIDA — DESGLOSE ============ */}
            <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '4px' }}>🧬 Bono Vida — Desglose (Mes {bv.mes})</h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>Se desglosa en 3 partes: Inicial, Crecimiento y Renovación.</p>
            </div>

            {/* Bono Inicial */}
            <div className="glass-card" style={{ padding: '20px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px' }}>1️⃣ Bono Inicial</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                    <Stat label="Prima Meta NO (mes)" value={fmt(bv.primaMetaNOMes)} />
                    <Stat label="Prima Meta NO (sem)" value={fmt(bv.primaMetaNOSem)} sub={bv.grupo ? `Grupo ${bv.grupo}` : 'Sin grupo'} />
                    <Stat label="Ganadores TA" value={`${bv.ganadoresTA} / ${bv.ganadoresTAMin}`} />
                    <Stat label="LIMRA" value={fmtPct(bv.limra)} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                    <Gate ok={bv.grupo !== null} label={bv.grupo !== null ? `Calificó en Grupo ${bv.grupo}` : 'No alcanzó ningún grupo con la Prima Meta de Nueva Organización'} />
                    <Gate ok={cumpleGanadoresTA} label={cumpleGanadoresTA ? `Cumple Ganadores TA (${bv.ganadoresTA}/${bv.ganadoresTAMin})` : `Faltan Ganadores TA (${bv.ganadoresTA}/${bv.ganadoresTAMin})`} />
                </div>
                <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '10px', padding: '16px 18px' }}>
                    <FilaRecibo label="Prima Pago Nueva Organización (sem)" valor={fmt(bv.primaPagoNOSem)} />
                    <FilaRecibo label="% Bono Inicial Nueva Organización" nota={bv.grupo ? `Según Grupo ${bv.grupo}` : 'Sin grupo calificado'} valor={fmtPct(bv.pctBonoInicialNO)} operador="×" />
                    <FilaRecibo label="Aporte Nueva Organización" nota={`${fmt(bv.primaPagoNOSem)} × ${fmtPct(bv.pctBonoInicialNO)}`} valor={fmt(montoInicialNO)} operador="=" />
                    <FilaRecibo label="Prima Pago Consolidados (sem)" valor={fmt(bv.primaPagoConsSem)} />
                    <FilaRecibo label="% Bono Inicial Consolidados" valor={fmtPct(bv.pctBonoInicialCons)} operador="×" />
                    <FilaRecibo label="Aporte Consolidados" nota={`${fmt(bv.primaPagoConsSem)} × ${fmtPct(bv.pctBonoInicialCons)}`} valor={fmt(montoInicialCons)} operador="=" />
                    <FilaRecibo label="Bono Inicial (Nueva Org + Consolidados)" valor={fmt(bv.bonoInicialTotal || (montoInicialNO + montoInicialCons))} operador="=" final />
                </div>
            </div>

            {/* Bono Crecimiento */}
            <div className="glass-card" style={{ padding: '20px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px' }}>2️⃣ Bono Crecimiento</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                    <Stat label="Prima Meta NO (sem año ant.)" value={fmt(bv.primaMetaNOSemAnoAnt)} />
                    <Stat label="Prima Meta NO (sem año act.)" value={fmt(bv.primaMetaNOSemAnoAct)} />
                    <Stat label="Crecimiento" value={fmtPct(bv.crecimientoPct)} />
                    <Stat label="Altas del semestre" value={`${bv.altasSemestre}`} />
                </div>
                <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '10px', padding: '16px 18px' }}>
                    <FilaRecibo label="Prima Pago Nueva Organización (sem)" valor={fmt(bv.primaPagoNOSem)} />
                    <FilaRecibo label="% Bono de Crecimiento" nota={`Según % de crecimiento (${fmtPct(bv.crecimientoPct)}) y ${bv.altasSemestre} altas del semestre`} valor={fmtPct(bv.pctBonoCrecimiento)} operador="×" />
                    <FilaRecibo label="Bono Crecimiento" valor={fmt(bv.bonoCrecimientoTotal)} operador="=" final />
                </div>
            </div>

            {/* Bono Renovación */}
            <div className="glass-card" style={{ padding: '20px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px' }}>3️⃣ Bono Renovación</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                    <Stat label="IGC" value={fmtPct(bv.igc)} />
                    <Stat label="Grupo (heredado de Inicial)" value={bv.grupo && bv.grupo <= 14 ? `Grupo ${bv.grupo}` : 'Sin grupo / fuera de rango'} />
                </div>
                <div style={{ marginBottom: '16px' }}>
                    <Gate ok={!!bv.grupo && bv.grupo <= 14} label={bv.grupo && bv.grupo <= 14 ? 'Grupo dentro del 1 al 14 (genera Renovación)' : 'Grupos 15-17 no generan Bono Renovación'} />
                </div>
                <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '10px', padding: '16px 18px' }}>
                    <FilaRecibo label="Prima Pago Renovación Nueva Org (sem)" valor={fmt(bv.primaPagoRenovacionNOSem)} />
                    <FilaRecibo label="% Bono Renovación Nueva Org" valor={fmtPct(bv.pctBonoRenovacionNO)} operador="×" />
                    <FilaRecibo label="Aporte Nueva Organización" nota={`${fmt(bv.primaPagoRenovacionNOSem)} × ${fmtPct(bv.pctBonoRenovacionNO)}`} valor={fmt(montoRenovacionNO)} operador="=" />
                    <FilaRecibo label="Prima Pago Renovación Consolidados (sem)" valor={fmt(bv.primaPagoRenovacionConsSem)} />
                    <FilaRecibo label="% Bono Renovación Consolidados" valor={fmtPct(bv.pctBonoRenovacionCons)} operador="×" />
                    <FilaRecibo label="Aporte Consolidados" nota={`${fmt(bv.primaPagoRenovacionConsSem)} × ${fmtPct(bv.pctBonoRenovacionCons)}`} valor={fmt(montoRenovacionCons)} operador="=" />
                    <FilaRecibo label="Bono Renovación (Nueva Org + Consolidados)" valor={fmt(bv.bonoRenovacionTotal || (montoRenovacionNO + montoRenovacionCons))} operador="=" final />
                </div>
            </div>

            {/* Totales de Bono Vida */}
            <div className="glass-card" style={{ padding: '20px', border: '1px solid var(--accent-gold)', background: 'rgba(212,175,55,0.06)' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px' }}>💰 Tu Bono Vida de este corte</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', textAlign: 'center' }}>
                    <div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Bono Semestral (Inicial + Crecimiento + Renovación)</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 800 }}>{fmt(bv.bonoSemestral)}</p>
                    </div>
                    <div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Ya te habían anticipado</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 800 }}>− {fmt(bv.bonosAnticipados)}</p>
                    </div>
                    <div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Bono a pagar este mes</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-gold)' }}>= {fmt(bv.bonosAPagar)}</p>
                    </div>
                </div>
            </div>

            {pf && <TablaPrimaFaltantePromotoria meses={pf.meses} filas={pf.filas} grupoActual={bv.grupo} />}

            {/* ============ SUBSIDIOS — DESGLOSE ============ */}
            <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '4px' }}>🏠 Subsidios de Renta — Desglose</h3>
            </div>

            <div className="glass-card" style={{ padding: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                    <Stat label="Renta mensual" value={fmt(sub.rentaMensual)} />
                    <Stat label="Asesores Proactivos (sem. ant.)" value={`${sub.asesoresProactivosSemAnt}`} sub="Mínimo: 5" />
                    <Stat label="Asesores Proactivos (mes)" value={`${sub.asesoresProactivosMes}`} sub="Solo informativo" />
                    <Stat label="Prima Meta Recluta (6 meses)" value={fmt(sub.primaMetaRecluta6m)} />
                </div>

                <div style={{ marginBottom: '16px' }}>
                    <Gate ok={cumpleProactivos} label={cumpleProactivos ? `Cumple mínimo de Asesores Proactivos (${sub.asesoresProactivosSemAnt}/5)` : `Faltan Asesores Proactivos (${sub.asesoresProactivosSemAnt}/5)`} />
                </div>

                <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '10px', padding: '16px 18px' }}>
                    <FilaRecibo label="Prima Pago Nueva Organización (6 meses)" valor={fmt(sub.primaPagoNO6m)} />
                    <FilaRecibo label="Promedio mensual" nota={`${fmt(sub.primaPagoNO6m)} ÷ 6`} valor={fmt(sub.promPrimaPagoNO)} operador="=" />
                    <FilaRecibo label="% Subsidio" nota={`Según Prima Meta Recluta de ${fmt(sub.primaMetaRecluta6m)} (últimos 6 meses)`} valor={fmtPct(sub.pctSubsidio)} operador="×" />
                    <FilaRecibo label="Subsidio de Renta" nota={`${fmtPct(sub.pctSubsidio)} × ${fmt(sub.promPrimaPagoNO)}`} valor={fmt(sub.subsidioRenta)} operador="=" final />
                    <FilaRecibo label="% Subsidio vs Renta mensual" nota={`${fmt(sub.subsidioRenta)} ÷ ${fmt(sub.rentaMensual)}`} valor={fmtPct(sub.pctSubsidioVsRenta)} />
                </div>
            </div>
        </motion.div>
    );
};

export default BonoPromotoria;
