import { useCallback, useEffect, useSyncExternalStore } from 'react';

export interface ComunicadoItem {
    id: string;
    timestamp: string;
    group: 'all' | 'admin' | 'asesor';
    title: string;
    body: string;
    url?: string;
    sender?: string;
}

type Role = 'admin' | 'asesor';

const READ_IDS_KEY = 'read_comunicados_ids';

export const cleanEmoji = (text?: string) => {
    if (!text) return '';
    return text.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/gu, '').trim();
};

// Store módulo-global: varios componentes (badge del sidebar, aviso de entrada,
// modal del buzón) muestran los mismos comunicados a la vez y deben verse
// sincronizados de inmediato cuando uno de ellos marca algo como leído — un
// useState local por componente no se entera de lo que hace otra instancia.
const loadReadIds = (): string[] => {
    try {
        return JSON.parse(localStorage.getItem(READ_IDS_KEY) || '[]');
    } catch {
        return [];
    }
};

const readIdsStore = {
    ids: loadReadIds(),
    listeners: new Set<() => void>(),
};

const setReadIds = (ids: string[]) => {
    readIdsStore.ids = ids;
    localStorage.setItem(READ_IDS_KEY, JSON.stringify(ids));
    readIdsStore.listeners.forEach(l => l());
};

const subscribeReadIds = (cb: () => void) => {
    readIdsStore.listeners.add(cb);
    return () => readIdsStore.listeners.delete(cb);
};

interface ComunicadosStore {
    items: ComunicadoItem[];
    loading: boolean;
    fetched: boolean;
    listeners: Set<() => void>;
}

const comunicadosStores: Partial<Record<Role, ComunicadosStore>> = {};

const getComunicadosStore = (role: Role): ComunicadosStore => {
    if (!comunicadosStores[role]) {
        comunicadosStores[role] = { items: [], loading: false, fetched: false, listeners: new Set() };
    }
    return comunicadosStores[role]!;
};

const notifyComunicados = (role: Role) => {
    getComunicadosStore(role).listeners.forEach(l => l());
};

const fetchHistory = async (role: Role) => {
    const store = getComunicadosStore(role);
    if (store.loading) return;
    store.loading = true;
    notifyComunicados(role);
    try {
        const res = await fetch('/api/comunicados/history');
        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
                const filtered = data.filter((item: ComunicadoItem) => {
                    if (role === 'admin') return true;
                    return item.group === 'all' || item.group === 'asesor';
                });
                filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                store.items = filtered;
            }
        }
    } catch (e) {
        console.error('[COMUNICADOS] Error cargando historial:', e);
    } finally {
        store.loading = false;
        store.fetched = true;
        notifyComunicados(role);
    }
};

export const useComunicados = (role: Role) => {
    const store = getComunicadosStore(role);

    const subscribeComunicados = useCallback((cb: () => void) => {
        store.listeners.add(cb);
        return () => store.listeners.delete(cb);
    }, [store]);

    const comunicados = useSyncExternalStore(subscribeComunicados, () => store.items);
    const loading = useSyncExternalStore(subscribeComunicados, () => store.loading);
    const readIds = useSyncExternalStore(subscribeReadIds, () => readIdsStore.ids);

    useEffect(() => {
        if (!store.fetched && !store.loading) fetchHistory(role);
    }, [role]);

    const markAsRead = useCallback((id: string) => {
        if (readIdsStore.ids.includes(id)) return;
        setReadIds([...readIdsStore.ids, id]);
    }, []);

    const markAllAsRead = useCallback(() => {
        const allIds = getComunicadosStore(role).items.map(c => c.id);
        setReadIds(Array.from(new Set([...readIdsStore.ids, ...allIds])));
    }, [role]);

    const unread = comunicados.filter(c => !readIds.includes(c.id));
    const unreadCount = unread.length;

    return { comunicados, unread, unreadCount, loading, readIds, markAsRead, markAllAsRead, refetch: () => fetchHistory(role) };
};
