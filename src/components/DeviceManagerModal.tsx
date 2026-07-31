import React, { useState, useEffect } from 'react';
import { Smartphone, ShieldCheck, X, RefreshCw, Trash2, CheckCircle2, AlertTriangle, Monitor, Laptop, UserCheck } from 'lucide-react';

export interface DeviceSubscriptionItem {
    endpoint: string;
    role: 'admin' | 'asesor';
    clave?: string;
    name?: string;
    deviceInfo?: string;
    subscribedAt?: string;
}

interface DeviceManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const DeviceManagerModal: React.FC<DeviceManagerModalProps> = ({ isOpen, onClose }) => {
    const [devices, setDevices] = useState<DeviceSubscriptionItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [statusMsg, setStatusMsg] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchDevices();
        }
    }, [isOpen]);

    const fetchDevices = async () => {
        try {
            setLoading(true);
            setStatusMsg('');
            const res = await fetch('/api/push/devices');
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    setDevices(data);
                }
            } else {
                setStatusMsg('No se pudo cargar la lista de dispositivos.');
            }
        } catch (e) {
            console.error('[DEVICE MANAGER] Error:', e);
            setStatusMsg('Error al conectar con el servidor.');
        } finally {
            setLoading(false);
        }
    };

    const handleRevoke = async (endpoint: string) => {
        if (!window.confirm('¿Estás seguro de desvincular este dispositivo? Ya no recibirá notificaciones.')) {
            return;
        }

        try {
            setLoading(true);
            const res = await fetch('/api/push/revoke', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ endpoint })
            });

            if (res.ok) {
                setDevices(prev => prev.filter(d => d.endpoint !== endpoint));
                setStatusMsg('Dispositivo desvinculado con éxito.');
            } else {
                setStatusMsg('No se pudo revocar la suscripción.');
            }
        } catch (e) {
            setStatusMsg('Error al procesar la desvinculación.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const getDeviceIcon = (deviceInfo?: string) => {
        if (!deviceInfo) return <Smartphone className="w-4 h-4 text-amber-400" />;
        if (deviceInfo.includes('iPhone') || deviceInfo.includes('iOS')) return <Smartphone className="w-4 h-4 text-emerald-400" />;
        if (deviceInfo.includes('Android')) return <Smartphone className="w-4 h-4 text-cyan-400" />;
        if (deviceInfo.includes('Mac')) return <Laptop className="w-4 h-4 text-indigo-400" />;
        return <Monitor className="w-4 h-4 text-slate-400" />;
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
            <div className="bg-slate-900 border border-slate-700/60 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh] text-slate-100">
                {/* Header */}
                <div className="px-6 py-5 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-slate-950">
                            <Smartphone className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white tracking-tight">Directorio de Dispositivos Conectados</h3>
                            <p className="text-xs text-slate-400">Celulares y Laptops registrados en la Red Ambriz & Dávalos</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Status & Refresh Bar */}
                <div className="px-6 py-3 bg-slate-800/30 border-b border-slate-700/40 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300">
                        Dispositivos Activos: <span className="text-cyan-400">{devices.length}</span>
                    </span>
                    <button
                        onClick={fetchDevices}
                        disabled={loading}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        Actualizar Lista
                    </button>
                </div>

                {statusMsg && (
                    <div className="mx-6 mt-4 p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/50 text-cyan-300 text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                        {statusMsg}
                    </div>
                )}

                {/* Device List */}
                <div className="p-6 overflow-y-auto space-y-3 flex-1 custom-scrollbar">
                    {loading && devices.length === 0 ? (
                        <div className="py-12 text-center text-slate-400 text-sm">
                            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                            Consultando directorio de dispositivos...
                        </div>
                    ) : devices.length === 0 ? (
                        <div className="py-12 text-center text-slate-400">
                            <AlertTriangle className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                            <p className="text-sm font-medium text-slate-300">No hay dispositivos registrados en este momento.</p>
                        </div>
                    ) : (
                        devices.map((item, index) => {
                            const formattedDate = item.subscribedAt
                                ? new Date(item.subscribedAt).toLocaleString('es-MX', {
                                      day: '2-digit',
                                      month: 'short',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                  })
                                : 'Fecha no disponible';

                            return (
                                <div
                                    key={index}
                                    className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 hover:border-slate-600 transition-all flex flex-wrap items-center justify-between gap-4"
                                >
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0">
                                            {getDeviceIcon(item.deviceInfo)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-sm font-bold text-white">
                                                    {item.name || 'Usuario Promotoría'}
                                                </h4>
                                                <span
                                                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                                        item.role === 'admin'
                                                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                                    }`}
                                                >
                                                    {item.role === 'admin' ? 'Administrador' : 'Asesor'}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mt-0.5">
                                                <span className="text-slate-300 font-medium">
                                                    {item.deviceInfo || 'Dispositivo Web'}
                                                </span>
                                                {item.clave && <span>Clave: {item.clave}</span>}
                                                <span className="text-slate-500">Conectado: {formattedDate}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleRevoke(item.endpoint)}
                                        className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-all border border-rose-500/20"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        Desvincular
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-800/60 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-1.5 text-slate-400">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        Control de Accesos SSL & APNs
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
