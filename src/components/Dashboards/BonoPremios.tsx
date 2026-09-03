import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    parseCabecera, parseDetalleTA, parseDetalleVida, parseResumenBonos,
    limpiarNumero, CabeceraPremios, DetalleTA, DetalleVida, FilaResumenBono
} from '../../utils/parsePremiosDetalle';
import {
    calcularBonoTA, calcularBonoVida, TABLA_TA, semestreDeMes,
    cumpleCandadoPolizasVida, pctBonoPorGrupoYLimra, primaFaltantePorGrupo,
} from '../../utils/bonoTablas';
import SelectorCalculadoraGenerica from './CalculadorasGenericas';

const MESES_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

interface Props {
    advisor: string;
}

interface PremiosData {
    clave: string;
    resumen: { cabecera: { _raw: string[] }, resumenBonos: string[][] | null };
    detalleModalTexto: string;
}

export const fmt = (v: number) => v.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });
export const fmtPct = (v: number) => `${v.toLocaleString('es-MX', { maximumFractionDigits: 1 })}%`;

function mesesEntre(fechaInicioDDMMYYYY: string, fechaFinDDMMYYYY: string): number {
    const [d1, m1, y1] = fechaInicioDDMMYYYY.split('/').map(Number);
    const [d2, m2, y2] = fechaFinDDMMYYYY.split('/').map(Number);
    if (!y1 || !y2) return 1;
    let meses = (y2 - y1) * 12 + (m2 - m1) + 1;
    if (d2 < d1) meses -= 1;
    return Math.max(1, meses);
}

export const Stat: React.FC<{ label: string; value: string; sub?: string }> = ({ label, value, sub }) => (
    <div className="glass-card" style={{ textAlign: 'center', padding: '18px 12px' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{label}</p>
        <p style={{ fontSize: '1.4rem', fontWeight: 700 }}>{value}</p>
        {sub && <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{sub}</p>}
    </div>
);

export const Gate: React.FC<{ ok: boolean; label: string }> = ({ ok, label }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
        <span>{ok ? '✅' : '🔴'}</span>
        <span style={{ color: ok ? 'inherit' : 'var(--text-secondary)' }}>{label}</span>
    </div>
);

// Fila de un "recibo" paso a paso: etiqueta + operador (+/−/×/=) + valor.
// Úsalo para justificar de dónde sale cada cantidad de la calculadora.
export const FilaRecibo: React.FC<{ label: string; valor: string; operador?: '+' | '−' | '×' | '='; final?: boolean; nota?: string }> = ({ label, valor, operador, final, nota }) => (
    <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '12px',
        padding: final ? '10px 0 0' : '4px 0',
        borderTop: final ? '1px solid var(--border, rgba(255,255,255,0.1))' : 'none',
        marginTop: final ? '6px' : 0
    }}>
        <span style={{ fontSize: final ? '0.9rem' : '0.82rem', fontWeight: final ? 700 : 400, color: final ? 'inherit' : 'var(--text-secondary)' }}>
            {operador && <span style={{ display: 'inline-block', width: '18px', color: 'var(--text-secondary)' }}>{operador}</span>}
            {label}
            {nota && <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginLeft: operador ? '18px' : 0 }}>{nota}</span>}
        </span>
        <span style={{ fontSize: final ? '1.1rem' : '0.88rem', fontWeight: final ? 800 : 600, color: final ? 'var(--accent-gold)' : 'inherit', whiteSpace: 'nowrap' }}>{valor}</span>
    </div>
);

export const ResumenBonosTabla: React.FC<{ filas: FilaResumenBono[]; activo: string }> = ({ filas, activo }) => (
    <div className="glass-card" style={{ padding: '20px' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px', opacity: 0.8 }}>Resumen de bonos</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', fontSize: '0.72rem', color: 'var(--text-secondary)', padding: '4px 8px', textTransform: 'uppercase' }}>
                <span>Bono</span><span style={{ textAlign: 'right' }}>Este mes</span><span style={{ textAlign: 'right' }}>Acumulado</span>
            </div>
            {filas.map(f => {
                const esActivo = f.nombre === activo;
                return (
                    <div key={f.nombre} style={{
                        display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '8px',
                        borderRadius: '8px',
                        background: esActivo ? 'rgba(212,175,55,0.1)' : 'transparent',
                        border: esActivo ? '1px solid var(--accent-gold)' : '1px solid transparent',
                        fontSize: '0.85rem', fontWeight: esActivo ? 700 : 400
                    }}>
                        <span>{esActivo && '🏆 '}{f.nombre}</span>
                        <span style={{ textAlign: 'right' }}>{fmt(f.bonoMes)}</span>
                        <span style={{ textAlign: 'right', color: esActivo ? 'var(--accent-gold)' : 'inherit' }}>{fmt(f.bonoAcumulado)}</span>
                    </div>
                );
            })}
        </div>
    </div>
);

// ---------------------------------------------------------------------------
// BONO TA
// ---------------------------------------------------------------------------
const VistaBonoTA: React.FC<{ cab: CabeceraPremios; det: DetalleTA }> = ({ cab, det }) => {
    const mes = det.mes || 1;
    const fila = TABLA_TA.find(f => f.mes === mes) || TABLA_TA[0];
    const sem = semestreDeMes(mes);

    const [primaExtra, setPrimaExtra] = useState(0);
    const [polizasExtra, setPolizasExtra] = useState(0);

    const proyeccion = useMemo(() => {
        const nuevaComision = det.comisionPagoSem + primaExtra;
        const nuevasPolizasSemVIGMMI = det.polizasSemVIGMMI + polizasExtra;
        // Aproximación: sumamos las pólizas extra a ambos conteos (vida y vida+gmmi)
        const nuevasPolizasSemVI = det.polizasSemVI + polizasExtra;
        // ignorarCandadoPolizas=true: la calculadora siempre proyecta el monto,
        // aunque las pólizas no alcancen — la advertencia de abajo avisa cuando
        // el resultado es hipotético.
        return calcularBonoTA(mes, nuevaComision, nuevasPolizasSemVIGMMI, nuevasPolizasSemVI, true);
    }, [primaExtra, polizasExtra, det, mes]);

    const faltaComision = Math.max(0, fila.comisionMeta - det.comisionPagoSem);
    const faltaPolizas = Math.max(0, fila.polizasAcumVidaGmmi - det.polizasSemVIGMMI);
    const faltaPolizasVida = Math.max(0, fila.minPolizasVida - det.polizasSemVI);

    const bonoAcumulado = det.bonoCalculado || 0;
    const bonoAnticipado = det.bonosAnticipados || 0;
    const bonoAPagarReal = det.bonoAPagar || Math.max(0, bonoAcumulado - bonoAnticipado);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Lo primero que debe ver: cuánto lleva, cuánto ya le dieron, cuánto le toca ahora */}
            <div className="glass-card" style={{ padding: '20px', border: '1px solid var(--accent-gold)', background: 'rgba(212,175,55,0.06)' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px' }}>💰 Tu Bono TA de este corte</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', textAlign: 'center' }}>
                    <div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Bono TA acumulado (semestre)</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 800 }}>{fmt(bonoAcumulado)}</p>
                    </div>
                    <div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Ya te habían anticipado</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 800 }}>− {fmt(bonoAnticipado)}</p>
                    </div>
                    <div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Bono a pagar este mes</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-gold)' }}>= {fmt(bonoAPagarReal)}</p>
                    </div>
                </div>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '12px', textAlign: 'center' }}>
                    Cada mes se te va adelantando parte del bono del semestre. Lo que cobras ahora es la diferencia entre lo que ya llevas acumulado y lo que ya te habían dado antes.
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                <Stat label="Mes del semestre" value={`${mes} / ${sem === 1 ? 6 : 12}`} sub={`Semestre ${sem}`} />
                <Stat label="Comisión acum. sem." value={fmt(det.comisionPagoSem)} sub={`Meta: ${fmt(fila.comisionMeta)}`} />
                <Stat label="Pólizas Vida+GMMI" value={det.polizasSemVIGMMI.toString()} sub={`Meta: ${fila.polizasAcumVidaGmmi}`} />
                <Stat label="Pólizas Vida mín." value={det.polizasSemVI.toString()} sub={`Meta: ${fila.minPolizasVida}`} />
                <Stat label="Bono tope del mes" value={fmt(fila.premioMaximo)} />
            </div>

            <div className="glass-card" style={{ padding: '20px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px', opacity: 0.8 }}>¿Qué te falta para cobrar completo?</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <Gate ok={faltaComision === 0} label={faltaComision === 0 ? 'Meta de comisión del semestre cumplida' : `Te faltan ${fmt(faltaComision)} de comisión acumulada`} />
                    <Gate ok={faltaPolizas === 0} label={faltaPolizas === 0 ? 'Meta de pólizas Vida+GMMI cumplida' : `Te faltan ${faltaPolizas} pólizas Vida+GMMI`} />
                    <Gate ok={faltaPolizasVida === 0} label={faltaPolizasVida === 0 ? 'Mínimo de pólizas Vida cumplido' : `Te faltan ${faltaPolizasVida} pólizas Vida`} />
                </div>
                {det.bonoExcedente > 0 && (
                    <p style={{ marginTop: '12px', fontSize: '0.82rem', color: 'var(--accent-gold)' }}>
                        Ya superaste el tope de {fmt(fila.premioMaximo)} — el excedente se paga solo al 35%, por eso tu bono calculado ({fmt(bonoAcumulado)}) es mayor al tope.
                    </p>
                )}
            </div>

            {/* Calculadora */}
            <div className="glass-card" style={{ padding: '20px', border: '1px dashed var(--accent-gold)' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '4px' }}>🧮 Calculadora — ¿si vendo más este mes?</h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    Simula comisión y pólizas adicionales a lo que ya llevas acumulado en el semestre.
                </p>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '18px' }}>
                    <label style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        Comisión adicional
                        <input type="number" min={0} value={primaExtra || ''} placeholder="0"
                            onChange={e => setPrimaExtra(Number(e.target.value) || 0)}
                            style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border, #444)', background: 'transparent', color: 'inherit', width: '160px' }} />
                    </label>
                    <label style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        Pólizas adicionales
                        <input type="number" min={0} value={polizasExtra || ''} placeholder="0"
                            onChange={e => setPolizasExtra(Number(e.target.value) || 0)}
                            style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border, #444)', background: 'transparent', color: 'inherit', width: '160px' }} />
                    </label>
                </div>
                {!proyeccion.cumplePolizas && (
                    <p style={{ fontSize: '0.8rem', color: '#ff6b6b', marginBottom: '12px' }}>
                        ⚠️ Con esas pólizas todavía no cumplirías el mínimo del mes, así que en la realidad tu bono seguiría en $0. <strong>El cálculo de abajo es una simulación</strong> asumiendo que sí llegas al mínimo — ajusta "Pólizas adicionales" si quieres ver el escenario real.
                    </p>
                )}

                {/* Desglose paso a paso: de dónde sale cada número */}
                <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '10px', padding: '16px 18px' }}>
                    <FilaRecibo
                        label="Comisión acumulada (con lo nuevo)"
                        nota={primaExtra > 0 ? `${fmt(det.comisionPagoSem)} + ${fmt(primaExtra)}` : 'Lo que ya llevas, sin agregar nada todavía'}
                        valor={fmt(det.comisionPagoSem + primaExtra)}
                    />
                    <FilaRecibo
                        label="Bono Base (100% de esa comisión)"
                        valor={fmt(proyeccion.bonoBase)}
                        operador="="
                    />
                    {proyeccion.bonoExcedente > 0 ? (
                        <>
                            <FilaRecibo
                                label={`Se topa en el Bono Tope del mes ${mes}`}
                                nota="La comisión superó el tope, así que el bono no crece 1:1 después de este punto"
                                valor={fmt(fila.premioMaximo)}
                            />
                            <FilaRecibo
                                label="Excedente sobre el tope"
                                nota={`${fmt(proyeccion.bonoBase)} − ${fmt(fila.premioMaximo)}`}
                                valor={fmt(proyeccion.bonoBase - fila.premioMaximo)}
                            />
                            <FilaRecibo
                                label="Bono por excedente (solo al 35%)"
                                nota={`${fmt(proyeccion.bonoBase - fila.premioMaximo)} × 35%`}
                                valor={fmt(proyeccion.bonoExcedente)}
                                operador="+"
                            />
                            <FilaRecibo
                                label="Bono Total Calculado"
                                nota={`${fmt(fila.premioMaximo)} + ${fmt(proyeccion.bonoExcedente)}`}
                                valor={fmt(proyeccion.bonoTotalCalculado)}
                                operador="="
                            />
                        </>
                    ) : (
                        <FilaRecibo
                            label="Bono Total Calculado"
                            nota="No superaste el tope, así que el Bono Base es el total"
                            valor={fmt(proyeccion.bonoTotalCalculado)}
                        />
                    )}
                    <FilaRecibo
                        label="Menos: lo que ya te habían anticipado en meses anteriores"
                        valor={`− ${fmt(bonoAnticipado)}`}
                        operador="−"
                    />
                    <FilaRecibo
                        label="Bono a pagar este mes (estimado)"
                        valor={fmt(Math.max(0, proyeccion.bonoTotalCalculado - bonoAnticipado))}
                        operador="="
                        final
                    />
                </div>
            </div>
        </div>
    );
};

// Tabla "Prima Faltante": para cada Grupo (1=mejor % de bono, 16=peor) muestra
// cuánta prima le falta al asesor para calificar ahí en cada mes restante del
// semestre, y el % de Bono Inicial que le tocaría según su LIMRA actual si
// calificara en ese grupo. Resalta el Grupo Tope (techo de sus anticipos) y el
// Grupo Calculado real (si ya tiene uno).
const TablaPrimaFaltante: React.FC<{
    primaActual: number; mesEnSemestre: number; esSegundoSemestreDelAnio: boolean;
    limra: number; grupoCalculado: number; grupoTope: number;
}> = ({ primaActual, mesEnSemestre, esSegundoSemestreDelAnio, limra, grupoCalculado, grupoTope }) => {
    const mesesRestantes: number[] = [];
    for (let m = mesEnSemestre; m <= 6; m++) mesesRestantes.push(m);
    const calMes = (m: number) => esSegundoSemestreDelAnio ? 6 + m : m;

    return (
        <div className="glass-card" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '4px', opacity: 0.8 }}>📊 Prima faltante por grupo</h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                Cuánta prima inicial más necesitas acumular (desde hoy) para calificar en cada grupo, y el % de Bono Inicial que pagaría ese grupo según tu LIMRA actual.
            </p>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', minWidth: '560px' }}>
                    <thead>
                        <tr style={{ color: 'var(--text-secondary)', textAlign: 'right' }}>
                            <th style={{ textAlign: 'left', padding: '6px 8px' }}>Grupo</th>
                            {mesesRestantes.map(m => <th key={m} style={{ padding: '6px 8px' }}>{MESES_ES[calMes(m) - 1]}</th>)}
                            <th style={{ padding: '6px 8px' }}>% Bono</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: 16 }, (_, i) => i + 1).map(g => {
                            const esTope = g === grupoTope;
                            const esCalculado = g === grupoCalculado && grupoCalculado > 0;
                            return (
                                <tr key={g} style={{
                                    background: esCalculado ? 'rgba(212,175,55,0.18)' : esTope ? 'rgba(255,255,255,0.06)' : 'transparent',
                                    fontWeight: (esTope || esCalculado) ? 700 : 400
                                }}>
                                    <td style={{ padding: '4px 8px' }}>
                                        {g}{esCalculado && ' 🏆'}{esTope && !esCalculado && ' (tope)'}
                                    </td>
                                    {mesesRestantes.map(m => (
                                        <td key={m} style={{ padding: '4px 8px', textAlign: 'right' }}>
                                            {fmt(primaFaltantePorGrupo(primaActual, g, m))}
                                        </td>
                                    ))}
                                    <td style={{ padding: '4px 8px', textAlign: 'right', color: 'var(--accent-gold)' }}>
                                        {fmtPct(pctBonoPorGrupoYLimra(g, limra))}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '10px' }}>
                🏆 = tu Grupo Calculado real hoy · (tope) = el Grupo Tope que limita tus anticipos este semestre (heredado del semestre anterior).
            </p>
        </div>
    );
};

// ---------------------------------------------------------------------------
// BONO VIDA
// ---------------------------------------------------------------------------
const VistaBonoVida: React.FC<{ cab: CabeceraPremios; det: DetalleVida }> = ({ cab, det }) => {
    const avanceAlMes = Number((cab.avanceAl.split('-')[1] || cab.indicadores['Avance Al']?.split('-')[1] || '1'));
    const mesEnSemestre = ((avanceAlMes - 1) % 6) + 1;
    const esSegundoSemestreDelAnio = avanceAlMes > 6;
    const antiguedadMeses = mesesEntre(cab.fechaConcurso, cab.avanceAl || cab.indicadores['Avance Al'] || cab.fechaConcurso);

    const candado = cumpleCandadoPolizasVida(mesEnSemestre, esSegundoSemestreDelAnio, det.polizaMes, det.polizasSemestre, det.polizasAnual);

    const [primaExtra, setPrimaExtra] = useState(0);

    const proyeccion = useMemo(() => calcularBonoVida({
        primaIniAcumulada: det.primaMetaSem + primaExtra,
        primaPagoIniAcumulada: det.primaPagoSem + primaExtra,
        primaRenovacionAcumulada: det.primaRenovacionSem,
        mesEnSemestre,
        limra: det.limra,
        igc: det.igc,
        antiguedadMeses,
        grupoTopeAnticipo: det.grupoTope || null,
        esSegundoSemestreDelAnio,
        polizaMes: det.polizaMes,
        polizasSemestre: det.polizasSemestre,
        polizasAnual: det.polizasAnual,
        // La calculadora siempre proyecta el monto asumiendo que sí cumples
        // pólizas — `cumplePolizas` en el resultado nos dice si eso es real o
        // hipotético, y lo avisamos aparte (ver aviso debajo).
        ignorarCandadoPolizas: true,
    }), [primaExtra, det, mesEnSemestre, antiguedadMeses, esSegundoSemestreDelAnio]);

    const bonoSemestralTotal = det.montoBonoInicial + det.montoBonoRenovacion;
    const bonoAnticipado = det.bonosAnticipados || 0;
    const bonoAPagarReal = det.bonosAPagar || Math.max(0, bonoSemestralTotal - bonoAnticipado);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* ============ BONO INICIAL ============ */}
            <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px' }}>📋 Bono Inicial</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                    <Stat label="Bono Inicial" value={fmt(det.montoBonoInicial)} />
                    <Stat label="Pólizas del mes" value={`${det.polizaMes}`} sub={candado.metaMensual !== null ? `Meta: ${candado.metaMensual}` : 'No aplica (cierre)'} />
                    <Stat label="Pólizas del semestre" value={`${det.polizasSemestre}`} sub={`Meta: ${candado.metaSemestral}`} />
                    {esSegundoSemestreDelAnio && <Stat label="Pólizas del año" value={`${det.polizasAnual}`} sub={`Meta: ${candado.metaAnual}`} />}
                    <Stat label="Prima Meta Mes" value={fmt(det.primaMetaMes)} />
                    <Stat label="Prima Meta Sem" value={fmt(det.primaMetaSem)} />
                    <Stat label="Grupo Calculado" value={det.grupoCalculado ? `Grupo ${det.grupoCalculado}` : 'Sin grupo'} sub={`Tope anticipo: Grupo ${det.grupoTope}`} />
                    <Stat label="LIMRA" value={fmtPct(det.limra)} />
                    <Stat label="% Bono Inicial" value={fmtPct(det.pctBonoInicial)} sub="Sobre tu prima pagada" />
                </div>
            </div>

            <TablaPrimaFaltante
                primaActual={det.primaMetaSem}
                mesEnSemestre={mesEnSemestre}
                esSegundoSemestreDelAnio={esSegundoSemestreDelAnio}
                limra={det.limra}
                grupoCalculado={det.grupoCalculado}
                grupoTope={det.grupoTope}
            />

            {/* ============ ¿QUÉ TE FALTA? — resumen específico y accionable ============ */}
            <div className="glass-card" style={{ padding: '20px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '4px', opacity: 0.8 }}>¿Qué te falta para ganar bono?</h4>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                    El candado de pólizas necesita: la meta del mes SIEMPRE, más la del semestre {esSegundoSemestreDelAnio ? 'o la del año (la que cumplas primero)' : ''}.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <Gate ok={candado.cumpleMensual} label={candado.cumpleMensual
                        ? `Mínimo del mes cumplido (${det.polizaMes}/${candado.metaMensual ?? '—'})`
                        : `Te falta vender en este mes específico (llevas ${det.polizaMes} de ${candado.metaMensual})`} />
                    {esSegundoSemestreDelAnio ? (
                        <Gate ok={candado.cumpleSemestral || candado.cumpleAnual} label={
                            (candado.cumpleSemestral || candado.cumpleAnual)
                                ? `Cumples por ${candado.cumpleSemestral ? 'semestre' : 'año'} (${candado.cumpleSemestral ? `${det.polizasSemestre}/${candado.metaSemestral} sem.` : `${det.polizasAnual}/${candado.metaAnual} año`})`
                                : `Te faltan ${Math.max(0, candado.metaSemestral - det.polizasSemestre)} pólizas del semestre O ${Math.max(0, (candado.metaAnual || 0) - det.polizasAnual)} del año (con cualquiera de las dos desbloqueas)`
                        } />
                    ) : (
                        <Gate ok={candado.cumpleSemestral} label={candado.cumpleSemestral
                            ? `Mínimo del semestre cumplido (${det.polizasSemestre}/${candado.metaSemestral})`
                            : `Te faltan ${Math.max(0, candado.metaSemestral - det.polizasSemestre)} pólizas del semestre`} />
                    )}
                    <Gate ok={det.grupoCalculado > 0} label={det.grupoCalculado > 0
                        ? `Calificaste en Grupo ${det.grupoCalculado} de prima`
                        : `Aún no calificas en ningún grupo — revisa la tabla de arriba para ver cuánta prima falta`} />
                    <Gate ok={det.montoBonoInicial > 0} label={det.montoBonoInicial > 0
                        ? 'Bono Inicial ganado (esto desbloquea el Bono Renovación)'
                        : 'Sin Bono Inicial todavía — mientras no lo ganes, tampoco cobras Bono Renovación'} />
                </div>
            </div>

            {/* ============ BONO RENOVACIÓN ============ */}
            <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px' }}>🔁 Bono Renovación</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                    <Stat label="Bono Renovación" value={fmt(det.montoBonoRenovacion)} />
                    <Stat label="IGC" value={fmtPct(det.igc)} />
                    <Stat label="Prima Renovación Sem" value={fmt(det.primaRenovacionSem)} />
                    <Stat label="% Bono Renovación" value={fmtPct(det.pctBonoRenovacion)} sub="Sobre tu prima de renovación" />
                </div>
            </div>

            {/* ============ RESUMEN DE PAGO (Inicial + Renovación) ============ */}
            <div className="glass-card" style={{ padding: '20px', border: '1px solid var(--accent-gold)', background: 'rgba(212,175,55,0.06)' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px' }}>💰 Tu Bono Vida de este corte</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', textAlign: 'center' }}>
                    <div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Bono Semestral (Inicial + Renovación)</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 800 }}>{fmt(bonoSemestralTotal)}</p>
                    </div>
                    <div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Ya te habían anticipado</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 800 }}>− {fmt(bonoAnticipado)}</p>
                    </div>
                    <div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Bono a pagar este mes</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-gold)' }}>= {fmt(bonoAPagarReal)}</p>
                    </div>
                </div>
            </div>

            {/* ============ CALCULADORA (Bono Inicial, + Renovación al final) ============ */}
            <div className="glass-card" style={{ padding: '20px', border: '1px dashed var(--accent-gold)' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '4px' }}>🧮 Calculadora — ¿si vendo más prima inicial?</h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    Simula prima inicial adicional (a lo que ya llevas acumulado en el semestre) y mira paso a paso cómo se calcularía tu bono.
                </p>
                <label style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '18px', maxWidth: '220px' }}>
                    Prima adicional
                    <input type="number" min={0} value={primaExtra || ''} placeholder="0"
                        onChange={e => setPrimaExtra(Number(e.target.value) || 0)}
                        style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border, #444)', background: 'transparent', color: 'inherit' }} />
                </label>

                {!proyeccion.cumplePolizas && (
                    <p style={{ fontSize: '0.8rem', color: '#ff6b6b', marginBottom: '12px' }}>
                        ⚠️ Con tus pólizas actuales todavía no cumplirías el candado (mes {esSegundoSemestreDelAnio ? '+ semestre o año' : '+ semestre'}), así que en la realidad tu bono seguiría en $0 con esa prima. <strong>El cálculo de abajo es una simulación</strong> asumiendo que sí llegas al mínimo de pólizas — así ves cuánto ganarías si cumples ambas cosas.
                    </p>
                )}
                {proyeccion.cumplePolizas && !proyeccion.limraElegible && (
                    <p style={{ fontSize: '0.8rem', color: '#ff6b6b', marginBottom: '12px' }}>
                        ⚠️ Tu LIMRA está por debajo del mínimo requerido para tu antigüedad — no calificarías para bono aunque subas de grupo.
                    </p>
                )}

                {/* Desglose paso a paso: de dónde sale cada número */}
                <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '10px', padding: '16px 18px' }}>
                    <FilaRecibo
                        label="Nueva prima inicial acumulada"
                        nota={primaExtra > 0 ? `${fmt(det.primaMetaSem)} + ${fmt(primaExtra)}` : 'Lo que ya llevas, sin agregar nada todavía'}
                        valor={fmt(det.primaMetaSem + primaExtra)}
                    />
                    <FilaRecibo
                        label="Nuevo Grupo calificado"
                        nota={det.grupoTope ? `Tus anticipos se topan al Grupo ${det.grupoTope} (el de tu semestre anterior)` : 'Es tu primer semestre, sin tope de anticipo'}
                        valor={proyeccion.grupo ? `Grupo ${proyeccion.grupo}` : 'Sin grupo'}
                    />
                    <FilaRecibo
                        label="% Bono Inicial"
                        nota={`Grupo × tu banda de LIMRA (${fmtPct(det.limra)})`}
                        valor={fmtPct(proyeccion.pctBonoInicialAplicado)}
                        operador="×"
                    />
                    <FilaRecibo
                        label="Bono Inicial estimado"
                        nota={`${fmtPct(proyeccion.pctBonoInicialAplicado)} × ${fmt(det.primaPagoSem + primaExtra)} de prima pagada`}
                        valor={fmt(proyeccion.bonoInicialCalculado)}
                        operador="="
                    />
                    <FilaRecibo
                        label="+ Bono Renovación (mismo grupo, tu IGC actual)"
                        nota={proyeccion.bonoInicialCalculado > 0
                            ? `${fmtPct(proyeccion.pctBonoRenovacion)} × ${fmt(det.primaRenovacionSem)} de prima de renovación`
                            : 'No se activa: primero necesitas ganar Bono Inicial'}
                        valor={fmt(proyeccion.bonoRenovacionCalculado)}
                        operador="+"
                    />
                    <FilaRecibo
                        label="Bono Semestral estimado (Inicial + Renovación)"
                        valor={fmt(proyeccion.bonoTotalCalculado)}
                        operador="="
                        final
                    />
                </div>
            </div>
        </div>
    );
};

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------
const BonoPremios: React.FC<Props> = ({ advisor }) => {
    const [data, setData] = useState<PremiosData | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        setLoading(true);
        setNotFound(false);
        fetch(`/api/premios/${encodeURIComponent(advisor)}`)
            .then(async res => {
                if (res.status === 404) { setNotFound(true); return null; }
                if (!res.ok) throw new Error('Error de red');
                return res.json();
            })
            .then(d => { if (d) setData(d); })
            .catch(() => setNotFound(true))
            .finally(() => setLoading(false));
    }, [advisor]);

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-gold)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        </div>
    );

    if (notFound || !data) return <SelectorCalculadoraGenerica />;

    const cab = parseCabecera(data.resumen.cabecera._raw);
    const resumenBonos = parseResumenBonos(data.resumen.resumenBonos);
    const esTA = /training/i.test(cab.tipo);
    const activo = resumenBonos.reduce((a, b) => (b.bonoAcumulado > (a?.bonoAcumulado || 0) ? b : a), resumenBonos[0]);

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <header className="glass-card" style={{ padding: '28px', display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>🏆 Reporte de <span className="text-gold">Premios</span></h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
                        {cab.tipo} · Fecha de concurso: {cab.fechaConcurso} · Corte: {cab.avanceAl}
                    </p>
                </div>
            </header>

            <ResumenBonosTabla filas={resumenBonos} activo={activo?.nombre || ''} />

            {esTA
                ? <VistaBonoTA cab={cab} det={parseDetalleTA(data.detalleModalTexto)} />
                : <VistaBonoVida cab={cab} det={parseDetalleVida(data.detalleModalTexto)} />
            }
        </motion.div>
    );
};

export default BonoPremios;
