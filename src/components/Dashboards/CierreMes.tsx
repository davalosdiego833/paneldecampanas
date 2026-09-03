import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, FileText, Wallet, Stethoscope, HeartPulse, Award } from 'lucide-react';
import { fmt } from './BonoPremios';

interface FilaVentas {
    asesor: string;
    polizas: number;
    vida: number;
    primaVida: number;
    gmm: number;
    primaGmm: number;
    primaTotal: number;
}

interface Ganador {
    nombre: string | null;
    raw: string;
}

interface CategoriaCampeones {
    key: string;
    categoria: string;
    novato: Ganador | null;
    profesional: Ganador | null;
}

interface ReporteCierre {
    mes: string;
    mesLabel: string;
    generadoEn: string;
    tabla: FilaVentas[];
    totales: {
        primaVida: number; polizasVida: number; primaGmm: number;
        polizasGmm: number; primaTotal: number; polizasTotal: number;
    };
    campeones: CategoriaCampeones[];
}

const CATEGORIA_ICON: Record<string, React.ReactNode> = {
    polizasVida: <FileText size={18} />,
    primaVida: <Wallet size={18} />,
    polizasGmm: <Stethoscope size={18} />,
    primaGmm: <HeartPulse size={18} />,
};

function slugNombre(nombre: string): string {
    return nombre
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

const FotoAsesor: React.FC<{ nombre: string; size?: number }> = ({ nombre, size = 76 }) => {
    const [ext, setExt] = useState<'jpg' | 'png' | null>('jpg');
    const iniciales = nombre.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();

    if (!ext) {
        return (
            <div style={{
                width: size, height: size, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(135deg, rgba(212,175,55,0.28), rgba(212,175,55,0.08))',
                border: '2px solid rgba(212,175,55,0.4)',
                fontWeight: 800, fontSize: size * 0.32, color: 'var(--accent-gold)'
            }}>
                {iniciales || '🙂'}
            </div>
        );
    }

    return (
        <img
            src={`/assets/asesores/${slugNombre(nombre)}.${ext}`}
            alt={nombre}
            style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid rgba(212,175,55,0.4)' }}
            onError={() => setExt(prev => (prev === 'jpg' ? 'png' : null))}
        />
    );
};

const TarjetaGanador: React.FC<{ nivel: string; ganador: Ganador | null }> = ({ nivel, ganador }) => (
    <div style={{
        display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
        borderRadius: '12px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        flex: 1, minWidth: '180px'
    }}>
        {ganador?.nombre ? <FotoAsesor nombre={ganador.nombre} /> : (
            <div style={{ width: 76, height: 76, borderRadius: '50%', flexShrink: 0, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>❓</div>
        )}
        <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 700 }}>{nivel}</p>
            <p style={{ fontSize: '0.92rem', fontWeight: 700, lineHeight: 1.25, overflowWrap: 'break-word' }}>
                {ganador?.nombre || ganador?.raw || '—'}
            </p>
        </div>
    </div>
);

const CierreMes: React.FC = () => {
    const [data, setData] = useState<ReporteCierre | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        fetch('/api/ventas-mensuales/latest')
            .then(res => {
                if (!res.ok) throw new Error('no-data');
                return res.json();
            })
            .then(d => { setData(d); setLoading(false); })
            .catch(() => { setError(true); setLoading(false); });
    }, []);

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', flexDirection: 'column', gap: '20px' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-gold)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <p style={{ color: 'var(--text-secondary)' }}>Cargando cierre de mes...</p>
        </div>
    );

    if (error || !data) return (
        <div className="glass-card" style={{ padding: '60px', textAlign: 'center', maxWidth: '600px', margin: '40px auto' }}>
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🏆</div>
            <h2 className="text-gold" style={{ fontSize: '1.5rem', marginBottom: '16px', fontWeight: 800 }}>Aún no se publica el cierre de este mes</h2>
            <p className="text-muted" style={{ fontSize: '0.95rem', lineHeight: 1.6 }}>
                En cuanto se cierre y valide la producción del mes, aquí aparecerá la tabla de ventas y los campeones de cada categoría.
            </p>
        </div>
    );

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ paddingBottom: '48px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
            <header className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '28px' }}>
                <div style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '14px', padding: '14px', color: 'var(--accent-gold)' }}>
                    <Trophy size={30} />
                </div>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>Cierre de {data.mesLabel}</h1>
                    <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '0.9rem' }}>Producción del mes y campeones de cada categoría</p>
                </div>
            </header>

            {/* Tabla grande de ventas */}
            <div className="glass-card" style={{ padding: '20px', overflowX: 'auto' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '16px' }}>Producción del mes por asesor</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', minWidth: '640px' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.04em' }}>
                            <th style={{ padding: '8px' }}>Asesor</th>
                            <th style={{ padding: '8px', textAlign: 'right' }}>Pólizas</th>
                            <th style={{ padding: '8px', textAlign: 'right' }}>Vida</th>
                            <th style={{ padding: '8px', textAlign: 'right' }}>Prima Pagada Vida</th>
                            <th style={{ padding: '8px', textAlign: 'right' }}>GMM</th>
                            <th style={{ padding: '8px', textAlign: 'right' }}>Prima Pagada GMM</th>
                            <th style={{ padding: '8px', textAlign: 'right' }}>Prima Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.tabla.map((fila, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '8px' }}>{fila.asesor}</td>
                                <td style={{ padding: '8px', textAlign: 'right' }}>{fila.polizas}</td>
                                <td style={{ padding: '8px', textAlign: 'right' }}>{fila.vida}</td>
                                <td style={{ padding: '8px', textAlign: 'right' }}>{fmt(fila.primaVida)}</td>
                                <td style={{ padding: '8px', textAlign: 'right' }}>{fila.gmm}</td>
                                <td style={{ padding: '8px', textAlign: 'right' }}>{fmt(fila.primaGmm)}</td>
                                <td style={{ padding: '8px', textAlign: 'right', color: 'var(--accent-gold)', fontWeight: 700 }}>{fmt(fila.primaTotal)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Campeones por categoría */}
            <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                    <Award size={20} color="var(--accent-gold)" />
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Campeones del mes</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                    {data.campeones.map(cat => (
                        <div key={cat.key} className="glass-card" style={{ padding: '18px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--accent-gold)' }}>
                                {CATEGORIA_ICON[cat.key]}
                                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>{cat.categoria}</h4>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                <TarjetaGanador nivel="Novato" ganador={cat.novato} />
                                <TarjetaGanador nivel="Profesional" ganador={cat.profesional} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

export default CierreMes;
