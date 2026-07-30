// Ambriz Asesores — Service Worker para Notificaciones Push (iOS & Android Compatible)
self.addEventListener('push', function(event) {
    if (!event.data) return;

    let payload = {
        title: 'Ambriz Asesores',
        body: 'Notificación de actualización de campañas',
        icon: '/assets/logos/empresa/ambriz_logo.png',
        url: '/'
    };

    try {
        payload = Object.assign(payload, event.data.json());
    } catch (e) {
        payload.body = event.data.text();
    }

    // Opciones estándar compatibles 100% con iOS Apple APNs y Android Chrome
    const options = {
        body: payload.body,
        icon: payload.icon || '/assets/logos/empresa/ambriz_logo.png',
        data: {
            url: payload.url || '/'
        },
        tag: 'ambriz-push-' + Date.now(),
        renotify: true
    };

    event.waitUntil(
        self.registration.showNotification(payload.title, options)
    );
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
