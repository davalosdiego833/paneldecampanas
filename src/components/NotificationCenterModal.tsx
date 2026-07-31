import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, X, ExternalLink, Calendar, ShieldCheck, Sparkles, Filter, Info, Smartphone } from 'lucide-react';

export interface ComunicadoItem {
    id: string;
    timestamp: string;
    group: 'all' | 'admin' | 'asesor';
    title: string;
    body: string;
    url?: string;
    sender?: string;
}

interface NotificationCenterModalProps {
    isOpen: boolean;
    onClose: () => void;
    role: 'admin' | 'asesor';
    onUnreadCountChange?: (count: number) => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
    isOpen,
    onClose,
    role,
    onUnreadCountChange
}) => {
    const [comunicados, setComunicados] = useState<ComunicadoItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState<'all' | 'campanas' | 'reportes' | 'avisos'>('all');
    const [readIds, setReadIds] = useState<string[]>(() => {
        try {
            return JSON.parse(localStorage.getItem('read_comunicados_ids') || '[]');
        } catch {
            return [];
        }
    });

    useEffect(() => {
        fetchHistory();
        const interval = setInterval(fetchHistory, 30000); // Polling suave cada 30 seg
        return () => clearInterval(interval);
    }, [role]);

    useEffect(() => {
        const unreadCount = comunicados.filter(c => !readIds.includes(c.id)).length;
        if (onUnreadCountChange) {
            onUnreadCountChange(unreadCount);
        }
    }, [comunicados, readIds]);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/comunicados/history');
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    // Filtrar notificaciones según el rol del usuario
                    const filtered = data.filter((item: ComunicadoItem) => {
                        if (role === 'admin') return true;
                        return item.group === 'all' || item.group === 'asesor';
                    });
                    // Ordenar del más reciente al más antiguo
                    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                    setComunicados(filtered);
                }
            }
        } catch (e) {
            console.error('[NOTIF CENTER] Error cargando historial:', e);
        } finally {
            setLoading(false);
        }
    };

    const markAllAsRead = () => {
        const allIds = comunicados.map(c => c.id);
        setReadIds(allIds);
        localStorage.setItem('read_comunicados_ids', JSON.stringify(allIds));
    };

    const markAsRead = (id: string) => {
        if (!readIds.includes(id)) {
            const updated = [...readIds, id];
            setReadIds(updated);
            localStorage.setItem('read_comunicados_ids', JSON.stringify(updated));
        }
    };

    const handleActionClick = (item: ComunicadoItem) => {
        markAsRead(item.id);
        if (item.url) {
            if (item.url.startsWith('http')) {
                window.open(item.url, '_blank');
            } else {
                window.location.href = item.url;
            }
        }
    };

    if (!isOpen) return null;

    const filteredComunicados = comunicados.filter(item => {
        if (filter === 'campanas') return item.title.toLowerCase().includes('campaña') || item.url?.includes('campanas');
        if (filter === 'reportes') return item.title.toLowerCase().includes('reporte') || item.title.toLowerCase().includes('pagado') || item.url?.includes('promotoria');
        if (filter === 'avisos') return !item.title.toLowerCase().includes('campaña') && !item.title.toLowerCase().includes('reporte');
        return true;
    });

    const unreadCount = comunicados.filter(c => !readIds.includes(c.id)).length;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
            <div className="bg-slate-900 border border-slate-700/60 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] text-slate-100">
                {/* Header */}
                <div className="px-6 py-5 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950">
                            <Bell className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-bold text-white tracking-tight">Centro de Avisos & Comunicados</h3>
                                {unreadCount > 0 && (
                                    <span className="px-2.5 py-0.5 text-xs font-bold bg-amber-500 text-slate-950 rounded-full animate-pulse">
                                        {unreadCount} nuevo{unreadCount > 1 ? 's' : ''}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-400">Canal Oficial de Avisos Promotoría Ambriz & Dávalos S.C.</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Filter Tabs & Actions */}
                <div className="px-6 py-3 bg-slate-800/30 border-b border-slate-700/40 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                                filter === 'all'
                                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                            }`}
                        >
                            Todos ({comunicados.length})
                        </button>
                        <button
                            onClick={() => setFilter('campanas')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                                filter === 'campanas'
                                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                            }`}
                        >
                            🚀 Campañas
                        </button>
                        <button
                            onClick={() => setFilter('reportes')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                                filter === 'reportes'
                                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                            }`}
                        >
                            📊 Reportes
                        </button>
                    </div>

                    {unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="text-xs font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-amber-500/10"
                        >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Marcar todos como leídos
                        </button>
                    )}
                </div>

                {/* Content List */}
                <div className="p-6 overflow-y-auto space-y-3.5 flex-1 custom-scrollbar">
                    {loading && comunicados.length === 0 ? (
                        <div className="py-12 text-center text-slate-400 text-sm">
                            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                            Cargando avisos oficiales...
                        </div>
                    ) : filteredComunicados.length === 0 ? (
                        <div className="py-12 text-center text-slate-400">
                            <Info className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                            <p className="text-sm font-medium text-slate-300">No hay avisos registrados en esta categoría.</p>
                            <p className="text-xs text-slate-500 mt-1">Los nuevos comunicados y alertas aparecerán automáticamente aquí.</p>
                        </div>
                    ) : (
                        filteredComunicados.map(item => {
                            const isRead = readIds.includes(item.id);
                            const formattedDate = new Date(item.timestamp).toLocaleString('es-MX', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                            });

                            return (
                                <div
                                    key={item.id}
                                    onClick={() => markAsRead(item.id)}
                                    className={`p-4 rounded-2xl border transition-all duration-200 ${
                                        isRead
                                            ? 'bg-slate-800/40 border-slate-700/40 opacity-80 hover:opacity-100'
                                            : 'bg-slate-800/90 border-amber-500/40 shadow-lg shadow-amber-500/5'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3 mb-1.5">
                                        <div className="flex items-center gap-2">
                                            {!isRead && (
                                                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                                            )}
                                            <h4 className={`text-sm font-bold ${isRead ? 'text-slate-200' : 'text-amber-300'}`}>
                                                {item.title}
                                            </h4>
                                        </div>
                                        <span className="text-[11px] text-slate-400 flex items-center gap-1 shrink-0">
                                            <Calendar className="w-3 h-3" />
                                            {formattedDate}
                                        </span>
                                    </div>

                                    <p className="text-xs text-slate-300 leading-relaxed mb-3">
                                        {item.body}
                                    </p>

                                    {item.url && (
                                        <div className="flex items-center justify-end">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleActionClick(item);
                                                }}
                                                className="px-3 py-1.5 rounded-xl bg-slate-700/60 hover:bg-amber-500 hover:text-slate-950 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-all"
                                            >
                                                Ver Detalle
                                                <ExternalLink className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-800/60 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-1.5 text-slate-400">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        Canal Seguro Encriptado PWA
                    </div>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};
