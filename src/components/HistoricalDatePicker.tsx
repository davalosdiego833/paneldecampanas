import React, { useState, useEffect } from 'react';
import { Calendar, ChevronDown, History } from 'lucide-react';

interface Props {
    reportId: string;
    onDateSelect: (date: string | null) => void;
    selectedDate: string | null;
    label?: string;
    themeMode: 'dark' | 'light';
}

const HistoricalDatePicker: React.FC<Props> = ({ reportId, onDateSelect, selectedDate, label, themeMode }) => {
    const [availableDates, setAvailableDates] = useState<string[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch('/api/admin/available-reports')
            .then(res => res.json())
            .then(data => {
                const dates = data[reportId] || [];
                setAvailableDates(dates);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching available dates:', err);
                setLoading(false);
            });
    }, [reportId]);

    const formatDate = (isoDate: string) => {
        if (!isoDate) return 'Última versión';
        const [year, month, day] = isoDate.split('-');
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        return `${day} ${monthNames[parseInt(month) - 1]} ${year}`;
    };

    if (loading) return <div style={{ opacity: 0.5, fontSize: '0.8rem' }}>Cargando historial...</div>;
    if (availableDates.length <= 1 && !selectedDate) return null;

    return (
        <div style={{ position: 'relative', display: 'inline-block' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 12px',
                    background: themeMode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '20px',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    outline: 'none'
                }}
            >
                <History size={14} />
                <span>{label || 'Corte'}: <b>{selectedDate ? formatDate(selectedDate) : 'Actual'}</b></span>
                <ChevronDown size={14} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            {isOpen && (
                <>
                    <div
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 }}
                        onClick={() => setIsOpen(false)}
                    />
                    <div style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        marginTop: '8px',
                        background: themeMode === 'dark' ? '#1a1a2e' : '#fff',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '12px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                        zIndex: 999,
                        minWidth: '200px',
                        maxHeight: '300px',
                        overflowY: 'auto',
                        padding: '8px'
                    }}>
                        <button
                            onClick={() => { onDateSelect(null); setIsOpen(false); }}
                            style={{
                                width: '100%',
                                textAlign: 'left',
                                padding: '10px 14px',
                                background: !selectedDate ? 'var(--accent-gold)' : 'transparent',
                                color: !selectedDate ? '#000' : 'var(--text-primary)',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                marginBottom: '4px'
                            }}
                        >
                            Última versión (Actual)
                        </button>
                        {availableDates.map(date => (
                            <button
                                key={date}
                                onClick={() => { onDateSelect(date); setIsOpen(false); }}
                                style={{
                                    width: '100%',
                                    textAlign: 'left',
                                    padding: '10px 14px',
                                    background: selectedDate === date ? 'var(--accent-gold)' : 'transparent',
                                    color: selectedDate === date ? '#000' : 'var(--text-primary)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    marginBottom: '4px'
                                }}
                            >
                                {formatDate(date)}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default HistoricalDatePicker;
