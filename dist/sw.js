// Ambriz Asesores — Service Worker para Notificaciones Push (iOS & Android 100% Compatible + OneSignal)
importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');

self.addEventListener('install', function(event) {
    self.skipWaiting();
});

self.addEventListener('activate', function(event) {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('push', function(event) {
    if (!event.data) return;

    let payload = null;
    try {
        payload = event.data.json();
    } catch (e) {}

    // Si la notificación proviene de OneSignal, OneSignalSDK.sw.js la muestra automáticamente.
    // Evitamos mostrar una segunda notificación duplicada.
    if (payload && (payload.custom || payload.onesignalData || payload.notificationId || payload.app_id)) {
        return;
    }

    if (payload && payload.title && payload.body) {
        const origin = self.location.origin || 'https://panel.ambrizydavalos.com';
        let iconUrl = payload.icon || '/assets/logos/empresa/ambriz_logo.png';
        if (iconUrl.startsWith('/')) {
            iconUrl = origin + iconUrl;
        }

        const options = {
            body: payload.body,
            icon: iconUrl,
            data: { url: payload.url || '/' }
        };

        event.waitUntil(
            self.registration.showNotification(payload.title, options)
        );
    }
});
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    const targetUrl = event.notification.data && event.notification.data.url ? event.notification.data.url : '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    if ('navigate' in client) {
                        client.navigate(targetUrl);
                    }
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
