// Pestaña "Índices" del reporte de Bono Vida (solo Asesores Nuevos Profesionales).
// Muestra la salud de LIMRA/IGC como gauges (igual que el widget de hojameta),
// el monitoreo de si subieron/bajaron desde la actualización anterior, y dos
// gráficas de barras mostrando cuánto % de bono paga cada Grupo según tu LIMRA/IGC.
import React from 'react';
import {
    LIMRA_BANDAS, IGC_BANDAS, limraMinimoPorAntiguedad,
    pctBonoPorGrupoYLimra, pctBonoRenovacionPorGrupoYIgc,
} from '../../utils/bonoTablas';
import { DetalleVida } from '../../utils/parsePremiosDetalle';

const fmtPct1 = (v: number) => `${v.toLocaleString('es-MX', { maximumFractionDigits: 1 })}%`;

export interface IndicesAnteriores {
    limra: number;
    igc: number;
    fecha?: string;
}

function puntoEnArco(cx: number, cy: number, r: number, valor: number) {
    const angulo = 180 - (Math.min(Math.max(valor, 0), 100) / 100) * 180;
    const rad = (angulo * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
}

// Paleta ordenada de "riesgo" a "salud": rojo, amarillo, y una rampa de verdes
// cada vez más saturados — se recorta según cuántos segmentos tenga el gauge.
const PALETA_SALUD = ['#e5484d', '#f0b429', '#9ccb8f', '#78bd7e', '#57a860', '#2f8f4e'];

const Gauge: React.FC<{ valor: number; boundaries: number[] }> = ({ valor, boundaries }) => {
    const cx = 120, cy = 128, r = 92, grosor = 22;
    const cortes = boundaries.slice(1, -1); // sin el 0 y el 100 de los extremos
    return (
        <div>
            <svg viewBox="0 0 240 150" style={{ width: '100%', maxWidth: '280px' }}>
                {boundaries.slice(0, -1).map((v0, i) => {
                    const v1 = boundaries[i + 1];
                    const p0 = puntoEnArco(cx, cy, r, v0);
                    const p1 = puntoEnArco(cx, cy, r, v1);
                    const span = ((v1 - v0) / 100) * 180;
                    const largeArc = span > 180 ? 1 : 0;
                    return (
                        <path
                            key={i}
                            d={`M ${p0.x} ${p0.y} A ${r} ${r} 0 ${largeArc} 1 ${p1.x} ${p1.y}`}
                            stroke={PALETA_SALUD[i % PALETA_SALUD.length]}
                            strokeWidth={grosor}
                            fill="none"
                        />
                    );
                })}
                {(() => {
                    const punta = puntoEnArco(cx, cy, r - grosor / 2 - 8, valor);
                    return (
                        <g>
                            <line x1={cx} y1={cy} x2={punta.x} y2={punta.y} stroke="var(--text-primary, #f1eee4)" strokeWidth={3} strokeLinecap="round" />
                            <circle cx={cx} cy={cy} r={7} fill="var(--text-primary, #f1eee4)" />
                        </g>
                    );
                })()}
                <text x={cx} y={cy - 20} textAnchor="middle" fontSize="26" fontWeight="800" fill="var(--text-primary, #f1eee4)">
                    {fmtPct1(valor)}
                </text>
            </svg>
            {/* Los cortes reales quedan muy juntos en ángulo dentro del arco (todos
                por arriba de 80), así que en vez de encimarlos ahí los listamos aquí
                debajo, en el mismo orden en que aparecen de izquierda a derecha. */}
            <p style={{ fontSize: '0.68rem', fontFamily: 'monospace', color: 'var(--text-secondary)', marginTop: '-6px' }}>
                Cortes: {cortes.map(c => fmtPct1(c)).join(' · ')}
            </p>
        </div>
    );
};

type TipoDelta = 'subio' | 'bajo' | 'igual' | 'sin-datos';

function calcularDelta(actual: number, anterior?: number): { tipo: TipoDelta; texto: string } {
    if (anterior === undefined || anterior === null || Number.isNaN(anterior)) {
        return { tipo: 'sin-datos', texto: 'Todavía no hay una actualización anterior para comparar — este es tu primer corte registrado.' };
    }
    const diff = actual - anterior;
    if (Math.abs(diff) < 0.05) {
        return { tipo: 'igual', texto: `Se mantuvo igual desde el corte anterior (${fmtPct1(actual)}).` };
    }
    if (diff > 0) {
        return { tipo: 'subio', texto: `Subió ${fmtPct1(diff)} desde el corte anterior (${fmtPct1(anterior)} → ${fmtPct1(actual)}).` };
    }
    return { tipo: 'bajo', texto: `Bajó ${fmtPct1(Math.abs(diff))} desde el corte anterior (${fmtPct1(anterior)} → ${fmtPct1(actual)}).` };
}

const DELTA_ESTILO: Record<TipoDelta, { icono: string; color: string }> = {
    subio: { icono: '▲', color: '#3ecf7e' },
    bajo: { icono: '▼', color: '#e8635e' },
    igual: { icono: '●', color: 'var(--text-secondary)' },
    'sin-datos': { icono: 'ℹ️', color: 'var(--text-secondary)' },
};

const MensajeDelta: React.FC<{ delta: { tipo: TipoDelta; texto: string } }> = ({ delta }) => {
    const estilo = DELTA_ESTILO[delta.tipo];
    return (
        <p style={{ fontSize: '0.8rem', color: estilo.color, marginTop: '10px', lineHeight: 1.4 }}>
            <span style={{ marginRight: '4px' }}>{estilo.icono}</span>{delta.texto}
        </p>
    );
};

const BarraPorGrupo: React.FC<{ valores: number[]; grupoActual: number | null; color: string }> = ({ valores, grupoActual, color }) => {
    const max = Math.max(...valores, 1);
    return (
        <div style={{ overflowX: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', minWidth: '520px', height: '160px', paddingTop: '20px' }}>
                {valores.map((v, i) => {
                    const grupo = i + 1;
                    const esActual = grupo === grupoActual;
                    return (
                        <div key={grupo} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                            <span style={{ fontSize: '0.65rem', color: esActual ? 'var(--accent-gold)' : 'var(--text-secondary)', fontWeight: esActual ? 700 : 400, marginBottom: '4px' }}>
                                {fmtPct1(v)}
                            </span>
                            <div style={{
                                width: '100%',
                                height: `${Math.max((v / max) * 100, 3)}%`,
                                background: esActual ? 'var(--accent-gold)' : color,
                                opacity: esActual ? 1 : 0.55,
                                borderRadius: '4px 4px 0 0',
                                transition: 'height 0.3s ease'
                            }} />
                            <span style={{ fontSize: '0.68rem', color: esActual ? 'var(--accent-gold)' : 'var(--text-secondary)', fontWeight: esActual ? 700 : 400, marginTop: '6px' }}>
                                {grupo}{esActual && ' 🏆'}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export const PestanaIndices: React.FC<{
    det: DetalleVida;
    antiguedadMeses: number;
    indicesAnteriores?: IndicesAnteriores | null;
}> = ({ det, antiguedadMeses, indicesAnteriores }) => {
    const limraMinimo = limraMinimoPorAntiguedad(antiguedadMeses);
    const limraBoundaries = [0, limraMinimo, ...LIMRA_BANDAS, 100];
    const igcBoundaries = [0, ...IGC_BANDAS, 100];

    const deltaLimra = calcularDelta(det.limra, indicesAnteriores?.limra);
    const deltaIgc = calcularDelta(det.igc, indicesAnteriores?.igc);

    const grupoActual = det.grupoCalculado > 0 ? det.grupoCalculado : null;
    const gruposArr = Array.from({ length: 16 }, (_, i) => i + 1);
    const valoresLimra = gruposArr.map(g => pctBonoPorGrupoYLimra(g, det.limra));
    const valoresIgc = gruposArr.map(g => pctBonoRenovacionPorGrupoYIgc(g, det.igc));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                <div className="glass-card" style={{ padding: '20px 20px 24px', textAlign: 'center' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '4px' }}>LIMRA</h4>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        Mínimo requerido por tu antigüedad: {fmtPct1(limraMinimo)}
                    </p>
                    <Gauge valor={det.limra} boundaries={limraBoundaries} />
                    <MensajeDelta delta={deltaLimra} />
                </div>
                <div className="glass-card" style={{ padding: '20px 20px 24px', textAlign: 'center' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '4px' }}>IGC</h4>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        Por debajo de 91% no genera Bono Renovación
                    </p>
                    <Gauge valor={det.igc} boundaries={igcBoundaries} />
                    <MensajeDelta delta={deltaIgc} />
                </div>
            </div>

            <div className="glass-card" style={{ padding: '20px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '4px', opacity: 0.8 }}>% Bono Inicial por Grupo, según tu LIMRA actual</h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                    Con tu LIMRA de hoy ({fmtPct1(det.limra)}), así se ve el % de Bono Inicial que pagaría cada uno de los 16 grupos.
                </p>
                <BarraPorGrupo valores={valoresLimra} grupoActual={grupoActual} color="var(--accent-gold)" />
            </div>

            <div className="glass-card" style={{ padding: '20px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '4px', opacity: 0.8 }}>% Bono Renovación por Grupo, según tu IGC actual</h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                    Con tu IGC de hoy ({fmtPct1(det.igc)}), así se ve el % de Bono Renovación que pagaría cada uno de los 16 grupos.
                </p>
                <BarraPorGrupo valores={valoresIgc} grupoActual={grupoActual} color="#4fd1c5" />
            </div>
        </div>
    );
};

export default PestanaIndices;
