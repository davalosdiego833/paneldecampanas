const webpush = require('web-push');
const fs = require('fs');
const path = require('path');

const BASE_PATH = path.join(__dirname, '..');
const vapidKeysPath = path.join(BASE_PATH, 'db', 'vapid_keys.json');
const subscriptionsPath = path.join(BASE_PATH, 'db', 'push_subscriptions.json');

const sendPushNotification = async ({ group = 'all', title, body, url = '/', icon = '/assets/logos/empresa/ambriz_logo.png' }) => {
    if (!fs.existsSync(vapidKeysPath) || !fs.existsSync(subscriptionsPath)) {
        console.log('[PUSH] No se encontraron llaves VAPID o base de datos de suscripciones.');
        return { success: false, sent: 0 };
    }

    const vapidKeys = JSON.parse(fs.readFileSync(vapidKeysPath, 'utf-8'));
    webpush.setVapidDetails(
        'mailto:soporte@ambrizydavalos.com',
        vapidKeys.publicKey,
        vapidKeys.privateKey
    );

    let subscriptions = [];
    try {
        subscriptions = JSON.parse(fs.readFileSync(subscriptionsPath, 'utf-8'));
    } catch (e) {
        subscriptions = [];
    }
    if (!Array.isArray(subscriptions)) subscriptions = [];

    const payload = JSON.stringify({ title, body, url, icon });

    let successCount = 0;
    const activeSubs = [];

    for (const sub of subscriptions) {
        const isTarget = group === 'all' || (group === 'admin' && sub.role === 'admin') || (group === 'asesor' && sub.role === 'asesor');
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

    try {
        fs.writeFileSync(subscriptionsPath, JSON.stringify(activeSubs, null, 2));
    } catch (e) {
        console.error('[PUSH] Error guardando suscripciones:', e.message);
    }
    console.log(`[PUSH] Envío completado. Exitosos: ${successCount} de ${subscriptions.length} dispositivo(s).`);
    return { success: true, sent: successCount };
};

module.exports = { sendPushNotification };

if (require.main === module) {
    const group = process.argv[2] || 'all';
    const title = process.argv[3] || 'Campaña Actualizada';
    const body = process.argv[4] || 'Se han publicado nuevos datos en la plataforma.';
    sendPushNotification({ group, title, body }).then(res => console.log('Resultado CLI Push:', res));
}
