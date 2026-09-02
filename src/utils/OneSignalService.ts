declare global {
    interface Window {
        OneSignalDeferred?: any[];
        OneSignal?: any;
    }
}

export interface OneSignalConfig {
    appId: string;
    restApiKey?: string;
    enabled: boolean;
}

let isInitialized = false;

export const initOneSignal = (appId: string) => {
    if (typeof window === 'undefined' || !appId || isInitialized) return;

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal: any) => {
        try {
            await OneSignal.init({
                appId: appId,
                notifyButton: {
                    enable: false,
                },
                allowLocalhostAsSecureOrigin: true
            });
            isInitialized = true;
            console.log('[ONESIGNAL] SDK inicializado con éxito.');

            if (typeof window.Notification !== 'undefined' && window.Notification.permission === 'granted') {
                try {
                    await OneSignal.User.PushSubscription.optIn();
                    console.log('[ONESIGNAL] PushSubscription optIn activado.');
                } catch (eOpt) {
                    console.warn('[ONESIGNAL] optIn fallback:', eOpt);
                }
            }
        } catch (e) {
            console.error('[ONESIGNAL] Error en init:', e);
        }
    });
};

// Vincula este dispositivo a una identidad real de OneSignal (login).
// Esto es lo que evita que cada reinstalación/reregistro cree un dispositivo
// "fantasma" nuevo — al hacer login con el mismo id, OneSignal reconoce que
// es la misma persona en vez de tratarla como un anónimo distinto cada vez.
export const loginOneSignalIdentity = (externalId: string) => {
    if (typeof window === 'undefined' || !externalId || externalId === 'UNKNOWN') return;

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal: any) => {
        try {
            await OneSignal.login(externalId);
            console.log('[ONESIGNAL] Identidad vinculada (login):', externalId);
        } catch (e) {
            console.warn('[ONESIGNAL] Error en login:', e);
        }
    });
};

export const setOneSignalUserTags = (role: 'admin' | 'asesor', clave?: string, name?: string) => {
    if (typeof window === 'undefined') return;

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal: any) => {
        try {
            const tags: Record<string, string> = {
                role: role,
                clave: clave || 'UNKNOWN',
                name: name || (role === 'admin' ? 'Administrador' : 'Asesor')
            };
            await OneSignal.User.addTags(tags);
            console.log('[ONESIGNAL] Tags asignados:', tags);
        } catch (e) {
            console.warn('[ONESIGNAL] Error guardando tags:', e);
        }
    });
};

export const requestOneSignalOptIn = async () => {
    if (typeof window === 'undefined') return false;

    return new Promise<boolean>((resolve) => {
        window.OneSignalDeferred = window.OneSignalDeferred || [];
        window.OneSignalDeferred.push(async (OneSignal: any) => {
            try {
                const permission = await OneSignal.Notifications.requestPermission();
                resolve(permission === 'granted' || permission === true);
            } catch (e) {
                console.error('[ONESIGNAL] Error pidiendo permisos:', e);
                resolve(false);
            }
        });
    });
};
