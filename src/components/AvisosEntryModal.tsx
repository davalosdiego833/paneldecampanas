import React from 'react';
import { Bell } from 'lucide-react';
import { ComunicadoItem, cleanEmoji } from '../hooks/useComunicados';

interface Props {
    unread: ComunicadoItem[];
    onVerAvisos: () => void;
    onDismiss: () => void;
}

export const AvisosEntryModal: React.FC<Props> = ({ unread, onVerAvisos, onDismiss }) => {
    const count = unread.length;
    const preview = unread.slice(0, 3);

    return (
        <div
            onClick={onDismiss}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9998,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px',
                backgroundColor: 'rgba(15, 23, 42, 0.75)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    backgroundColor: '#0F172A',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '20px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
                    width: '100%',
                    maxWidth: '360px',
                    padding: '24px',
                    color: '#F8FAFC',
                    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{
                        position: 'relative',
                        width: '40px',
                        height: '40px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#0F172A',
                        flexShrink: 0,
                    }}>
                        <Bell size={20} />
                        <span style={{
                            position: 'absolute',
                            top: '-6px',
                            right: '-6px',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: '#EF4444',
                            color: '#FFF',
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '2px solid #0F172A',
                        }}>
                            {count}
                        </span>
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF' }}>
                        Tienes {count} aviso{count > 1 ? 's' : ''} nuevo{count > 1 ? 's' : ''}
                    </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                    {preview.map(item => (
                        <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#F59E0B', marginTop: '6px', flexShrink: 0 }} />
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#CBD5E1', lineHeight: 1.4 }}>
                                {cleanEmoji(item.title)}
                            </p>
                        </div>
                    ))}
                    {count > preview.length && (
                        <p style={{ margin: '2px 0 0 14px', fontSize: '0.78rem', color: '#64748B' }}>
                            y {count - preview.length} más...
                        </p>
                    )}
                </div>

                <button
                    onClick={onVerAvisos}
                    style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '12px',
                        border: 'none',
                        background: '#F59E0B',
                        color: '#0F172A',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        marginBottom: '8px',
                    }}
                >
                    Ver avisos
                </button>
                <button
                    onClick={onDismiss}
                    style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '12px',
                        border: 'none',
                        background: 'transparent',
                        color: '#94A3B8',
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                    }}
                >
                    Ver después
                </button>
            </div>
        </div>
    );
};
