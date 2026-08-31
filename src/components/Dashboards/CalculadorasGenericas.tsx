import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Stat, Gate, FilaRecibo, fmt, fmtPct } from './BonoPremios';
import {
    calcularBonoTA, TABLA_TA, semestreDeMes,
    calcularBonoVida, calcularGrupoVida, cumpleCandadoPolizasVida,
    primaFaltantePorGrupo, limraMinimoPorAntiguedad, bandaIgc,
} from '../../utils/bonoTablas';

const AyudaFooter: React.FC = () => (
    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '4px', lineHeight: 1.6 }}>
        ¿Necesitas más ayuda con tus proyecciones? Consulta tu Reporte de Premios oficial en el portal, o acércate con <strong>Diego</strong> para que te apoye.
    </p>
);

const inputStyle: React.CSSProperties = {
    padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border, #444)',
    background: 'transparent', color: 'inherit', width: '100%'
};
const labelStyle: React.CSSProperties = { fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '4px' };

// ---------------------------------------------------------------------------
// Calculadora genérica — Asesor en Desarrollo (Bono TA), 100% manual
// ---------------------------------------------------------------------------
export const CalculadoraGenericaTA: React.FC = () => {
    const [mes, setMes] = useState(1);
    const [comision, setComision] = useState(0);
    const [polizasVida, setPolizasVida] = useState(0);
    const [polizasGmm, setPolizasGmm] = useState(0);

    const fila = TABLA_TA.find(f => f.mes === mes) || TABLA_TA[0];
    const sem = semestreDeMes(mes);
    const polizasCombinadas = polizasVida + polizasGmm * 0.5;

    const resultado = useMemo(
        () => calcularBonoTA(mes, comision, polizasCombinadas, polizasVida, true),
        [mes, comision, polizasCombinadas, polizasVida]
    );

    const faltaComision = Math.max(0, fila.comisionMeta - comision);
    const faltaCombinadas = Math.max(0, fila.polizasAcumVidaGmmi - polizasCombinadas);
    const faltaVida = Math.max(0, fila.minPolizasVida - polizasVida);

    return (
        <div className="glass-card" style={{ padding: '20px', border: '1px dashed var(--accent-gold)', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '4px' }}>🧮 Calculadora Bono TA (Asesor en Desarrollo)</h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Como todavía no tenemos tu Reporte de Premios descargado, captura tus números a mano y te mostramos cómo se calcularía tu bono.
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px' }}>
                <label style={labelStyle}>
                    Mes del concurso (1-12)
                    <select value={mes} onChange={e => setMes(Number(e.target.value))} style={inputStyle}>
                        {TABLA_TA.map(f => <option key={f.mes} value={f.mes}>Mes {f.mes} (Semestre {semestreDeMes(f.mes)})</option>)}
                    </select>
                </label>
                <label style={labelStyle}>
                    Comisión acumulada del semestre
                    <input type="number" min={0} value={comision || ''} placeholder="0" onChange={e => setComision(Number(e.target.value) || 0)} style={inputStyle} />
                </label>
                <label style={labelStyle}>
                    Pólizas de Vida acumuladas
                    <input type="number" min={0} value={polizasVida || ''} placeholder="0" onChange={e => setPolizasVida(Number(e.target.value) || 0)} style={inputStyle} />
                </label>
                <label style={labelStyle}>
                    Pólizas de GMM acumuladas
                    <input type="number" min={0} value={polizasGmm || ''} placeholder="0" onChange={e => setPolizasGmm(Number(e.target.value) || 0)} style={inputStyle} />
                </label>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '-8px' }}>
                Cada póliza de GMM cuenta 0.5 en el acumulado combinado Vida+GMMI. Con lo que llevas: {polizasCombinadas.toFixed(1)} pólizas combinadas.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <Gate ok={faltaComision === 0} label={faltaComision === 0
                    ? `Meta de comisión del mes ${mes} cumplida (${fmt(comision)} / ${fmt(fila.comisionMeta)})`
                    : `No cumples con la comisión meta del mes ${mes}: te faltan ${fmt(faltaComision)} (llevas ${fmt(comision)}, necesitas ${fmt(fila.comisionMeta)})`} />
                <Gate ok={faltaCombinadas === 0} label={faltaCombinadas === 0
                    ? `Mínimo de pólizas Vida+GMMI cumplido (${polizasCombinadas.toFixed(1)} / ${fila.polizasAcumVidaGmmi})`
                    : `No cumples con el mínimo de pólizas Vida+GMMI del mes ${mes}: te faltan ${faltaCombinadas.toFixed(1)} (llevas ${polizasCombinadas.toFixed(1)}, necesitas ${fila.polizasAcumVidaGmmi})`} />
                <Gate ok={faltaVida === 0} label={faltaVida === 0
                    ? `Mínimo de pólizas de Vida cumplido (${polizasVida} / ${fila.minPolizasVida})`
                    : `No cumples con el mínimo de pólizas de Vida del mes ${mes}: te faltan ${faltaVida} (llevas ${polizasVida}, necesitas ${fila.minPolizasVida})`} />
            </div>

            {!resultado.cumplePolizas && (
                <p style={{ fontSize: '0.8rem', color: '#ff6b6b' }}>
                    ⚠️ Con esas pólizas no cumplirías los mínimos del mes {mes}, así que en la realidad tu bono sería $0. <strong>El cálculo de abajo es una simulación</strong> asumiendo que sí llegas al mínimo — corrige los números de arriba si quieres ver tu escenario real.
                </p>
            )}

            <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '10px', padding: '16px 18px' }}>
                <FilaRecibo label="Comisión acumulada capturada" valor={fmt(comision)} />
                <FilaRecibo label="Bono Base (100% de esa comisión)" valor={fmt(resultado.bonoBase)} operador="=" />
                {resultado.bonoExcedente > 0 ? (
                    <>
                        <FilaRecibo label={`Se topa en el Bono Tope del mes ${mes}`} nota="La comisión superó el tope, así que el bono no crece 1:1 después de este punto" valor={fmt(fila.premioMaximo)} />
                        <FilaRecibo label="Excedente sobre el tope" nota={`${fmt(resultado.bonoBase)} − ${fmt(fila.premioMaximo)}`} valor={fmt(resultado.bonoBase - fila.premioMaximo)} />
                        <FilaRecibo label="Bono por excedente (solo al 35%)" nota={`${fmt(resultado.bonoBase - fila.premioMaximo)} × 35%`} valor={fmt(resultado.bonoExcedente)} operador="+" />
                        <FilaRecibo label="Bono Total Calculado" nota={`${fmt(fila.premioMaximo)} + ${fmt(resultado.bonoExcedente)}`} valor={fmt(resultado.bonoTotalCalculado)} operador="=" final />
                    </>
                ) : (
                    <FilaRecibo label="Bono Total Calculado (estimado)" nota="No superaste el tope, así que el Bono Base es el total" valor={fmt(resultado.bonoTotalCalculado)} operador="=" final />
                )}
            </div>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                No incluye "Bonos Anticipados" porque no tenemos tu reporte real descargado — este total es el bono del semestre completo, no lo que te tocaría cobrar este mes.
            </p>
            <AyudaFooter />
        </div>
    );
};

// ---------------------------------------------------------------------------
// Calculadora genérica — Asesor Profesional (Bono Vida), 100% manual
// El Grupo siempre se DERIVA de la prima capturada (nunca se elige a mano),
// y las pólizas se piden como un único acumulado semestral (sin desglose
// mensual/anual) para simplificar la captura.
// ---------------------------------------------------------------------------
export const CalculadoraGenericaVida: React.FC = () => {
    const [mes, setMes] = useState(1); // mes del concurso 1-12; la prima y las pólizas SIEMPRE se reinician cada semestre
    const [prima, setPrima] = useState(0);
    const [polizasSemestre, setPolizasSemestre] = useState(0);
    const [limra, setLimra] = useState(0);
    const [primaRenovacion, setPrimaRenovacion] = useState(0);
    const [igc, setIgc] = useState(0);

    const mesEnSemestre = semestreDeMes(mes) === 1 ? mes : mes - 6; // 1-6 dentro del semestre
    const esSegundoSemestreDelAnio = semestreDeMes(mes) === 2;

    // Ya no pedimos antigüedad real: como este bono aplica a Asesores Profesionales
    // (mes 13+), asumimos un punto medio típico (24 meses) solo para el mínimo de
    // LIMRA exigible y el piso del 9.8% — si Diego quiere precisión exacta aquí,
    // se puede volver a exponer como campo aparte.
    const ANTIGUEDAD_ASUMIDA = 24;

    const grupoReal = calcularGrupoVida(prima, mesEnSemestre);
    const candado = cumpleCandadoPolizasVida(mesEnSemestre, esSegundoSemestreDelAnio, 0, polizasSemestre, 0);
    const limraMinimo = limraMinimoPorAntiguedad(ANTIGUEDAD_ASUMIDA);
    const limraElegible = limra >= limraMinimo;
    const igcCalifica = bandaIgc(igc) !== null;

    const resultado = useMemo(() => calcularBonoVida({
        primaIniAcumulada: prima,
        primaPagoIniAcumulada: prima,
        primaRenovacionAcumulada: primaRenovacion,
        mesEnSemestre,
        limra, igc, antiguedadMeses: ANTIGUEDAD_ASUMIDA,
        grupoTopeAnticipo: null,
        esSegundoSemestreDelAnio,
        polizaMes: 0, polizasSemestre, polizasAnual: 0,
        ignorarCandadoPolizas: true,
    }), [prima, primaRenovacion, limra, igc, polizasSemestre, mesEnSemestre, esSegundoSemestreDelAnio]);

    return (
        <div className="glass-card" style={{ padding: '20px', border: '1px dashed var(--accent-gold)', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '4px' }}>🧮 Calculadora Bono Vida (Asesor Profesional)</h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Captura tus números del semestre y el Grupo se calcula solo, según tu prima — igual que en el reporte real. La prima y las pólizas se reinician cada semestre, por eso primero elige en qué mes vas.
                </p>
            </div>

            <div>
                <h5 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '10px', opacity: 0.85 }}>Bono Inicial</h5>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px' }}>
                    <label style={labelStyle}>
                        Mes del concurso (1-12)
                        <select value={mes} onChange={e => setMes(Number(e.target.value))} style={inputStyle}>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                <option key={m} value={m}>Mes {m} (Semestre {semestreDeMes(m)})</option>
                            ))}
                        </select>
                    </label>
                    <label style={labelStyle}>
                        Prima acumulada del semestre
                        <input type="number" min={0} value={prima || ''} placeholder="0" onChange={e => setPrima(Number(e.target.value) || 0)} style={inputStyle} />
                    </label>
                    <label style={labelStyle}>
                        Pólizas del semestre
                        <input type="number" min={0} value={polizasSemestre || ''} placeholder="0" onChange={e => setPolizasSemestre(Number(e.target.value) || 0)} style={inputStyle} />
                    </label>
                    <label style={labelStyle}>
                        LIMRA (%)
                        <input type="number" min={0} max={100} value={limra || ''} placeholder="0" onChange={e => setLimra(Number(e.target.value) || 0)} style={inputStyle} />
                    </label>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <Gate ok={grupoReal !== null} label={grupoReal !== null
                    ? `Con esa prima en el mes ${mes} calificas en Grupo ${grupoReal}`
                    : `No cumples con la prima mínima del mes ${mes} para calificar en ningún grupo: te faltan ${fmt(primaFaltantePorGrupo(prima, 16, mesEnSemestre))} para el Grupo 16 (el más bajo)`} />
                <Gate ok={candado.cumpleSemestral} label={candado.cumpleSemestral
                    ? `Mínimo de pólizas del semestre cumplido para el mes ${mes} (${polizasSemestre} / ${candado.metaSemestral})`
                    : `No cumples con el mínimo de pólizas del semestre para el mes ${mes}: te faltan ${Math.max(0, candado.metaSemestral - polizasSemestre)} (llevas ${polizasSemestre}, necesitas ${candado.metaSemestral})`} />
                <Gate ok={limraElegible} label={limraElegible
                    ? `Tu LIMRA (${fmtPct(limra)}) cumple el mínimo requerido (${fmtPct(limraMinimo)})`
                    : `No cumples con el índice LIMRA mínimo: necesitas al menos ${fmtPct(limraMinimo)}, tienes ${fmtPct(limra)}`} />
            </div>

            {(grupoReal === null || !candado.cumpleSemestral) && (
                <p style={{ fontSize: '0.8rem', color: '#ff6b6b' }}>
                    ⚠️ Con esos números todavía no calificarías a Bono Inicial, así que en la realidad sería $0. <strong>El cálculo de abajo es una simulación</strong> asumiendo que sí llegas al mínimo de prima y pólizas — corrige los datos de arriba si quieres ver tu escenario real.
                </p>
            )}
            {grupoReal !== null && candado.cumpleSemestral && !limraElegible && (
                <p style={{ fontSize: '0.8rem', color: '#ff6b6b' }}>
                    ⚠️ Aunque calificaste en Grupo {grupoReal}, tu LIMRA está debajo del mínimo requerido — no calificarías para bono. El cálculo de abajo es una simulación.
                </p>
            )}

            <h5 style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: '4px', marginBottom: '10px', opacity: 0.85 }}>Bono Renovación (mismo Grupo)</h5>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px' }}>
                <label style={labelStyle}>
                    Prima de renovación del semestre
                    <input type="number" min={0} value={primaRenovacion || ''} placeholder="0" onChange={e => setPrimaRenovacion(Number(e.target.value) || 0)} style={inputStyle} />
                </label>
                <label style={labelStyle}>
                    IGC (%)
                    <input type="number" min={0} max={100} value={igc || ''} placeholder="0" onChange={e => setIgc(Number(e.target.value) || 0)} style={inputStyle} />
                </label>
            </div>
            {!igcCalifica && igc > 0 && (
                <p style={{ fontSize: '0.8rem', color: '#ff6b6b' }}>
                    ⚠️ Con un IGC de {fmtPct(igc)} no calificas a Bono Renovación (mínimo 91%).
                </p>
            )}

            <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '10px', padding: '16px 18px' }}>
                <FilaRecibo label="Prima acumulada capturada" valor={fmt(prima)} />
                <FilaRecibo label="Grupo que alcanzas con esa prima" valor={grupoReal ? `Grupo ${grupoReal}` : 'Sin grupo aún'} operador="=" />
                <FilaRecibo
                    label="% Bono Inicial (Grupo × tu LIMRA)"
                    nota={`Según tu banda de LIMRA (${fmtPct(limra)})`}
                    valor={fmtPct(resultado.pctBonoInicialAplicado)}
                    operador="×"
                />
                <FilaRecibo label="Bono Inicial estimado" nota={`${fmtPct(resultado.pctBonoInicialAplicado)} × ${fmt(prima)} de prima`} valor={fmt(resultado.bonoInicialCalculado)} operador="=" />
                <FilaRecibo
                    label="+ Bono Renovación (mismo grupo, tu IGC)"
                    nota={resultado.bonoInicialCalculado > 0
                        ? (igcCalifica ? `${fmtPct(resultado.pctBonoRenovacion)} × ${fmt(primaRenovacion)} de prima de renovación` : 'No se activa: tu IGC no califica')
                        : 'No se activa: primero necesitas ganar Bono Inicial'}
                    valor={fmt(resultado.bonoRenovacionCalculado)}
                    operador="+"
                />
                <FilaRecibo label="Bono Semestral estimado (Inicial + Renovación)" valor={fmt(resultado.bonoTotalCalculado)} operador="=" final />
            </div>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                No incluye "Bonos Anticipados" porque no tenemos tu reporte real descargado — este total es el estimado del semestre completo.
            </p>
            <AyudaFooter />
        </div>
    );
};

// ---------------------------------------------------------------------------
// Selector: se muestra cuando el asesor no tiene Reporte de Premios descargado
// ---------------------------------------------------------------------------
export const SelectorCalculadoraGenerica: React.FC = () => {
    const [tipo, setTipo] = useState<'TA' | 'VIDA' | null>(null);

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '760px', margin: '0 auto' }}>
            <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>🏆</div>
                <h2 className="text-gold" style={{ fontSize: '1.4rem', marginBottom: '12px', fontWeight: 800 }}>Tu Reporte de Premios aún no está disponible</h2>
                <p className="text-muted" style={{ fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '24px' }}>
                    Mientras se descarga, puedes usar esta calculadora manual para estimar tu bono. Elige tu tipo de asesor:
                </p>
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button className="btn-primary" style={{ opacity: tipo === 'TA' ? 1 : 0.7 }} onClick={() => setTipo('TA')}>
                        Soy Asesor en Desarrollo (Bono TA)
                    </button>
                    <button className="btn-primary" style={{ opacity: tipo === 'VIDA' ? 1 : 0.7 }} onClick={() => setTipo('VIDA')}>
                        Soy Asesor Profesional (Bono Vida)
                    </button>
                </div>
            </div>

            {tipo === 'TA' && <CalculadoraGenericaTA />}
            {tipo === 'VIDA' && <CalculadoraGenericaVida />}
        </motion.div>
    );
};

export default SelectorCalculadoraGenerica;
