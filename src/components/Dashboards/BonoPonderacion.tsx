// Pestaña "Ponderación Productos" del reporte de Bono Vida (Asesores Profesionales).
// Tabla 1 del Cuaderno de Concursos: cuánto de la prima de cada producto
// realmente cuenta para el Bono Inicial, según la moneda de la póliza.
import React, { useMemo, useState } from 'react';
import {
    PRODUCTOS_PONDERACION, ProductoPonderado, nivelPonderacion, COLOR_NIVEL, nombreCompleto,
} from '../../utils/ponderacionProductos';
import { fmt, fmtPct, FilaRecibo } from './BonoPremios';

const PALETA_ANOTADA: Record<string, string> = {
    verde: 'Cuenta 100% o más — es de los que más te conviene vender',
    amarillo: 'Cuenta entre 50% y 99%',
    rojo: 'Cuenta menos de 50% (o nada)',
};

const Semaforo: React.FC<{ pct: number | null }> = ({ pct }) => {
    const nivel = nivelPonderacion(pct);
    if (pct === null) {
        return <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>No aplica</span>;
    }
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            fontWeight: 700, color: COLOR_NIVEL[nivel]
        }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLOR_NIVEL[nivel], display: 'inline-block' }} />
            {fmtPct(pct)}
        </span>
    );
};

export const PestanaPonderacion: React.FC = () => {
    const [busqueda, setBusqueda] = useState('');
    const [seleccionado, setSeleccionado] = useState<ProductoPonderado | null>(null);
    const [moneda, setMoneda] = useState<'dls' | 'udis'>('dls');
    const [monto, setMonto] = useState<number>(0);

    const filtrados = useMemo(() => {
        const q = busqueda.trim().toLowerCase();
        if (!q) return PRODUCTOS_PONDERACION;
        return PRODUCTOS_PONDERACION.filter(p => nombreCompleto(p).toLowerCase().includes(q));
    }, [busqueda]);

    const seleccionarProducto = (p: ProductoPonderado) => {
        setSeleccionado(p);
        // Si el producto solo existe en una moneda, la seleccionamos automáticamente.
        if (p.dls !== null && p.udis === null) setMoneda('dls');
        else if (p.udis !== null && p.dls === null) setMoneda('udis');
    };

    const pctSeleccionado = seleccionado ? (moneda === 'dls' ? seleccionado.dls : seleccionado.udis) : null;
    const primaQueCuenta = pctSeleccionado !== null ? (monto * pctSeleccionado) / 100 : 0;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* ============ CALCULADORA ============ */}
            <div className="glass-card" style={{ padding: '20px', border: '1px dashed var(--accent-gold)' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '4px' }}>🧮 ¿Cuánto me cuenta esta venta?</h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    Busca el producto, indica la prima, y mira cuánto de esa prima realmente cuenta para tu Bono Vida.
                </p>

                <label style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '14px' }}>
                    Buscar producto
                    <input
                        type="text"
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                        placeholder="Ej. Realiza, ORVI 99, Segubeca..."
                        style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border, #444)', background: 'transparent', color: 'inherit', fontSize: '0.9rem' }}
                    />
                </label>

                {busqueda && !seleccionado && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '14px', maxHeight: '220px', overflowY: 'auto' }}>
                        {filtrados.length === 0 && (
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Sin resultados — revisa el nombre del producto.</p>
                        )}
                        {filtrados.map((p, i) => (
                            <button
                                key={i}
                                onClick={() => seleccionarProducto(p)}
                                style={{
                                    textAlign: 'left', padding: '10px 12px', borderRadius: '8px',
                                    border: '1px solid var(--border, rgba(255,255,255,0.1))', background: 'rgba(255,255,255,0.03)',
                                    color: 'inherit', cursor: 'pointer', fontSize: '0.85rem'
                                }}
                            >
                                {nombreCompleto(p)}
                            </button>
                        ))}
                    </div>
                )}

                {seleccionado && (
                    <>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '16px', padding: '10px 14px', background: 'rgba(212,175,55,0.08)', borderRadius: '8px' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{nombreCompleto(seleccionado)}</span>
                            <button
                                onClick={() => { setSeleccionado(null); setBusqueda(''); setMonto(0); }}
                                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline' }}
                            >
                                Cambiar
                            </button>
                        </div>

                        {seleccionado.dls !== null && seleccionado.udis !== null && (
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                                {(['dls', 'udis'] as const).map(m => (
                                    <button
                                        key={m}
                                        onClick={() => setMoneda(m)}
                                        style={{
                                            padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700,
                                            border: moneda === m ? '1px solid var(--accent-gold)' : '1px solid var(--border, rgba(255,255,255,0.1))',
                                            background: moneda === m ? 'rgba(212,175,55,0.12)' : 'transparent',
                                            color: moneda === m ? 'var(--accent-gold)' : 'var(--text-secondary)'
                                        }}
                                    >
                                        {m === 'dls' ? 'Dólares' : 'UDIS'}
                                    </button>
                                ))}
                            </div>
                        )}

                        {pctSeleccionado === null ? (
                            <p style={{ fontSize: '0.85rem', color: '#e8635e' }}>
                                Este producto no existe en {seleccionado.dls === null && seleccionado.udis === null ? 'ninguna moneda' : 'esa moneda'} — revisa la tabla de abajo.
                            </p>
                        ) : (
                            <>
                                <label style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px', maxWidth: '240px' }}>
                                    Prima de la póliza
                                    <input
                                        type="number" min={0} value={monto || ''} placeholder="0"
                                        onChange={e => setMonto(Number(e.target.value) || 0)}
                                        style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border, #444)', background: 'transparent', color: 'inherit', fontSize: '0.9rem' }}
                                    />
                                </label>

                                <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '10px', padding: '16px 18px' }}>
                                    <FilaRecibo label="Prima de la póliza" valor={fmt(monto)} />
                                    <FilaRecibo label={`% de ponderación (${moneda === 'dls' ? 'Dólares' : 'UDIS'})`} valor={fmtPct(pctSeleccionado)} operador="×" />
                                    <FilaRecibo label="Prima que cuenta para tu Bono Vida" valor={fmt(primaQueCuenta)} operador="=" final />
                                </div>
                                {seleccionado.nota && (
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '10px' }}>ℹ️ {seleccionado.nota}</p>
                                )}
                            </>
                        )}
                    </>
                )}
            </div>

            {/* ============ TABLA DE REFERENCIA COMPLETA ============ */}
            <div className="glass-card" style={{ padding: '20px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '4px', opacity: 0.8 }}>📋 Tabla completa de ponderación</h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                    Aplicable a pólizas iniciales emitidas de enero a diciembre 2026.
                </p>
                {!busqueda && (
                    <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '14px', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        {(['verde', 'amarillo', 'rojo'] as const).map(n => (
                            <span key={n} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLOR_NIVEL[n], display: 'inline-block' }} />
                                {PALETA_ANOTADA[n]}
                            </span>
                        ))}
                    </div>
                )}
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', minWidth: '480px' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.04em' }}>
                                <th style={{ padding: '8px' }}>Producto</th>
                                <th style={{ padding: '8px', textAlign: 'right' }}>Dólares</th>
                                <th style={{ padding: '8px', textAlign: 'right' }}>UDIS</th>
                                <th style={{ padding: '8px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtrados.map((p, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '8px' }}>
                                        {p.categoria && <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{p.categoria} — </span>}
                                        {p.nombre}
                                    </td>
                                    <td style={{ padding: '8px', textAlign: 'right' }}><Semaforo pct={p.dls} /></td>
                                    <td style={{ padding: '8px', textAlign: 'right' }}><Semaforo pct={p.udis} /></td>
                                    <td style={{ padding: '8px', textAlign: 'right' }}>
                                        <button
                                            onClick={() => { seleccionarProducto(p); setBusqueda(''); }}
                                            style={{ background: 'none', border: '1px solid var(--border, rgba(255,255,255,0.15))', borderRadius: '6px', color: 'var(--accent-gold)', padding: '4px 10px', fontSize: '0.75rem', cursor: 'pointer' }}
                                        >
                                            Usar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '14px' }}>
                    Pólizas fuera de esta tabla con prima anualizada mayor a $17,000 cuentan como póliza (Reglas de Conteo) pero no cuentan para Prima Meta ni Prima Pago, excepto Tempo Vida 1 y Star Temporal 1, que nunca cuentan como póliza sin importar el monto.
                </p>
            </div>
        </div>
    );
};

export default PestanaPonderacion;
