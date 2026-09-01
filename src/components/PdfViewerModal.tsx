import React from 'react';
import { ArrowLeft, Download, FileText, X } from 'lucide-react';

interface PdfViewerModalProps {
    isOpen: boolean;
    pdfUrl: string | null;
    title: string | null;
    onClose: () => void;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
    isOpen,
    pdfUrl,
    title,
    onClose
}) => {
    if (!isOpen || !pdfUrl) return null;

    const cleanTitle = title || 'Documento PDF';

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#0F172A',
            color: '#FFFFFF'
        }}>
            {/* Header Flotante / Barra Superior de Navegación en Celular */}
            <div style={{
                padding: '12px 16px',
                backgroundColor: '#1E293B',
                borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                zIndex: 10
            }}>
                {/* Botón Principal: Regresar al Menú */}
                <button
                    onClick={onClose}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 16px',
                        borderRadius: '12px',
                        backgroundColor: '#F59E0B',
                        color: '#0F172A',
                        border: 'none',
                        fontWeight: 800,
                        fontSize: '0.92rem',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(245, 158, 11, 0.4)',
                        transition: 'transform 0.15s ease',
                        flexShrink: 0
                    }}
                >
                    <ArrowLeft size={20} />
                    <span>Regresar al Menú</span>
                </button>

                {/* Título del Documento */}
                <div style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis'
                }}>
                    <FileText size={18} color="#FBBF24" style={{ flexShrink: 0 }} />
                    <span style={{
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        color: '#F8FAFC'
                    }}>
                        {cleanTitle}
                    </span>
                </div>

                {/* Opciones secundarias: Descargar y Cerrar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <a
                        href={pdfUrl}
                        download
                        target="_blank"
                        rel="noreferrer"
                        title="Descargar PDF"
                        style={{
                            padding: '8px 12px',
                            borderRadius: '10px',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            textDecoration: 'none',
                            fontSize: '0.8rem',
                            fontWeight: 600
                        }}
                    >
                        <Download size={16} />
                    </a>

                    <button
                        onClick={onClose}
                        title="Cerrar"
                        style={{
                            padding: '8px',
                            borderRadius: '10px',
                            backgroundColor: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            color: '#94A3B8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* Visor de PDF incorporado */}
            <div style={{
                flex: 1,
                width: '100%',
                height: 'calc(100% - 60px)',
                backgroundColor: '#1E293B',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <object
                    data={`${pdfUrl}#toolbar=1&navpanes=0`}
                    type="application/pdf"
                    width="100%"
                    height="100%"
                    style={{ border: 'none' }}
                >
                    <iframe
                        src={`${pdfUrl}#toolbar=1&navpanes=0`}
                        title={cleanTitle}
                        style={{
                            width: '100%',
                            height: '100%',
                            border: 'none'
                        }}
                    />
                </object>
            </div>
        </div>
    );
};
