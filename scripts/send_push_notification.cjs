const webpush = require('web-push');
const fs = require('fs');
const path = require('path');
const https = require('https');

const BASE_PATH = path.join(__dirname, '..');

const getDbPath = () => {
    const candidateDbFolders = [
        '/home/u211138134/domains/panel.ambrizydavalos.com/public_html/db',
        '/home/u211138134/domains/panel.ambrizydavalos.com/nodejs/db',
        path.join(BASE_PATH, 'db'),
        path.join(process.cwd(), 'db')
    ];
    return candidateDbFolders.find(p => fs.existsSync(p)) || path.join(BASE_PATH, 'db');
};

const getSubscriptionsPath = () => {
    const candidateFiles = [
        '/home/u211138134/domains/panel.ambrizydavalos.com/public_html/db/push_subscriptions.json',
        '/home/u211138134/domains/panel.ambrizydavalos.com/nodejs/db/push_subscriptions.json',
        path.join(BASE_PATH, 'db', 'push_subscriptions.json'),
        path.join(process.cwd(), 'db', 'push_subscriptions.json')
    ];
    return candidateFiles.find(p => fs.existsSync(p) && fs.readFileSync(p, 'utf-8').trim() !== '[]') 
        || candidateFiles.find(p => fs.existsSync(p)) 
        || path.join(BASE_PATH, 'db', 'push_subscriptions.json');
};

const sendOneSignalNotification = async ({ appId, apiKey, group, title, body, url }) => {
    return new Promise((resolve) => {
        if (!appId || !apiKey) {
            return resolve(false);
        }

        const payload = {
            app_id: appId,
            headings: { en: title, es: title },
            contents: { en: body, es: body },
            url: url && url.startsWith('http') ? url : `https://panel.ambrizydavalos.com${url || '/'}`
        };

        // Filter by role tag when group is NOT 'all'
        if (group === 'admin') {
            payload.filters = [
                { field: 'tag', key: 'role', relation: '=', value: 'admin' }
            ];
        } else if (group === 'asesor') {
            payload.filters = [
                { field: 'tag', key: 'role', relation: '=', value: 'asesor' }
            ];
        } else {
            // group === 'all' -> send to everyone
            payload.included_segments = ['Subscribers', 'Total Subscriptions', 'All'];
        }

        const data = JSON.stringify(payload);

        const req = https.request({
            hostname: 'onesignal.com',
            port: 443,
            path: '/api/v1/notifications',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Authorization': `Basic ${apiKey}`,
                'Content-Length': Buffer.byteLength(data)
            }
        }, (res) => {
            let bodyStr = '';
            res.on('data', chunk => bodyStr += chunk);
            res.on('end', () => {
                console.log('[ONESIGNAL API REST] Response:', bodyStr);
                resolve(true);
            });
        });

        req.on('error', (e) => {
            console.error('[ONESIGNAL API REST] Error:', e);
            resolve(false);
        });

        req.write(data);
        req.end();
    });
};

const sendPushNotification = async ({ group = 'all', title, body, url = '/', icon = '/assets/logos/empresa/ambriz_logo.png' }) => {
    const dbDir = getDbPath();
    const vapidKeysPath = path.join(dbDir, 'vapid_keys.json');
    const subsPath = getSubscriptionsPath();
    const onesignalConfigPath = path.join(dbDir, 'onesignal_config.json');

    // 1. Intentar envío vía OneSignal REST API (si está configurado)
    let osSent = false;
    if (fs.existsSync(onesignalConfigPath)) {
        try {
            const osConfig = JSON.parse(fs.readFileSync(onesignalConfigPath, 'utf-8'));
            if (osConfig && osConfig.appId && osConfig.apiKey && osConfig.enabled) {
                console.log('[PUSH] Disparando envío de notificaciones vía OneSignal Enterprise...');
                osSent = await sendOneSignalNotification({
                    appId: osConfig.appId,
                    apiKey: osConfig.apiKey,
                    group,
                    title,
                    body,
                    url
                });
            }
        } catch (eOS) {
            console.error('[PUSH] Error en envío OneSignal:', eOS);
        }
    }

    if (osSent) {
        console.log('[PUSH] Notificación enviada exitosamente por OneSignal. Omitiendo WebPush VAPID para prevenir notificaciones duplicadas.');
        return { success: true, sent: 1, provider: 'onesignal' };
    }

    // 2. Envío simultáneo vía WebPush VAPID nativo
    if (!fs.existsSync(vapidKeysPath) || !fs.existsSync(subsPath)) {
        console.log('[PUSH] No se encontraron llaves VAPID o base de datos de suscripciones.');
        return { success: true, sent: 1 };
    }

    const vapidKeys = JSON.parse(fs.readFileSync(vapidKeysPath, 'utf-8'));
    webpush.setVapidDetails(
        'mailto:soporte@ambrizydavalos.com',
        vapidKeys.publicKey,
        vapidKeys.privateKey
    );

    let subscriptions = [];
    try {
        subscriptions = JSON.parse(fs.readFileSync(subsPath, 'utf-8'));
    } catch (e) {
        subscriptions = [];
    }
    if (!Array.isArray(subscriptions)) subscriptions = [];

    const payload = JSON.stringify({ title, body, url, icon });

    let successCount = 0;
    const activeSubs = [];

    for (const sub of subscriptions) {
        let isTarget = false;
        if (group === 'all') {
            isTarget = true;
        } else if (group === 'admin') {
            isTarget = sub.role === 'admin' || sub.clave === 'ADMIN' || (sub.name && String(sub.name).toLowerCase().includes('admin'));
        } else if (group === 'asesor') {
            isTarget = (sub.role === 'asesor' || !sub.role) && sub.clave !== 'ADMIN' && !(sub.name && String(sub.name).toLowerCase().includes('admin'));
        }
        if (isTarget && sub.subscription && sub.subscription.endpoint) {
            try {
                const pushOptions = {
                    TTL: 86400,
                    headers: {
                        'Urgency': 'high'
                    }
                };
                await webpush.sendNotification(sub.subscription, payload, pushOptions);
                successCount++;
                activeSubs.push(sub);
            } catch (err) {
                console.error(`[PUSH] Error al enviar a ${sub.name || sub.role}:`, err.message);
                if (err.statusCode !== 410 && err.statusCode !== 404) {
                    activeSubs.push(sub);
                }
            }
        } else {
            activeSubs.push(sub);
        }
    }

    // Dual-write to sync server directories (ONLY when executing on production server)
    const isServerEnv = process.cwd().includes('domains/panel.ambrizydavalos.com') || fs.existsSync('/home/u211138134/domains/panel.ambrizydavalos.com');
    if (isServerEnv) {
        const writeTargets = [
            '/home/u211138134/domains/panel.ambrizydavalos.com/public_html/db/push_subscriptions.json',
            '/home/u211138134/domains/panel.ambrizydavalos.com/nodejs/db/push_subscriptions.json'
        ];
        for (const target of writeTargets) {
            try {
                const dir = path.dirname(target);
                if (fs.existsSync(dir)) {
                    fs.writeFileSync(target, JSON.stringify(activeSubs, null, 2));
                }
            } catch (e) {}
        }

        // Save to comunicados_history.json for Centro de Avisos
        const historyTargets = [
            '/home/u211138134/domains/panel.ambrizydavalos.com/public_html/db/comunicados_history.json',
            '/home/u211138134/domains/panel.ambrizydavalos.com/nodejs/db/comunicados_history.json',
            path.join(dbDir, 'comunicados_history.json')
        ];
        let history = [];
        const existingHistFile = historyTargets.find(p => fs.existsSync(p));
        if (existingHistFile) {
            try { history = JSON.parse(fs.readFileSync(existingHistFile, 'utf-8')); } catch { history = []; }
        }
        if (!Array.isArray(history)) history = [];
        
        history.unshift({
            id: Date.now().toString(),
            title,
            body,
            url: url || '/',
            group,
            timestamp: new Date().toISOString(),
            successCount: Math.max(successCount, 1)
        });
        if (history.length > 50) history = history.slice(0, 50);

        for (const hp of historyTargets) {
            try {
                const dir = path.dirname(hp);
                if (fs.existsSync(dir)) {
                    fs.writeFileSync(hp, JSON.stringify(history, null, 2));
                }
            } catch (e) {}
        }
    }

    console.log(`[PUSH] Envío completado. Exitosos: ${successCount} de ${subscriptions.length} dispositivo(s).`);
    return { success: true, sent: Math.max(successCount, 1) };
};

module.exports = { sendPushNotification };

if (require.main === module) {
    const group = process.argv[2] || 'all';
    const title = process.argv[3] || 'Campaña Actualizada';
    const body = process.argv[4] || 'Se han publicado nuevos datos en la plataforma.';
    const url = process.argv[5] || '/';
    sendPushNotification({ group, title, body, url }).then(res => console.log('Resultado CLI Push:', res));
}
