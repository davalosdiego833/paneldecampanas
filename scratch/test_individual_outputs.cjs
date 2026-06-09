const https = require('https');

function getJSON(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

async function runTests() {
    try {
        console.log('=== RUNNING LIVE VERIFICATION FOR NEW QUERY FILTERING ===');

        // Test 1: Monica
        const t1 = await getJSON('https://panel.ambrizydavalos.com/api/daniela/datos?msg_id=v1&query=como%20va%20monica%20en%20convenciones');
        console.log('\n--- TEST 1: Query "como va monica en convenciones" ---');
        console.log('Status:', t1.statusCode);
        console.log('JSON size:', JSON.stringify(t1.body).length, 'chars');
        console.log('Convenciones for Monica:', t1.body.campaigns.convenciones);
        console.log('MDRT for Monica:', t1.body.campaigns.mdrt);
        console.log('Proactivos Activos for Monica:', t1.body.resumen_general.proactivos_activos);

        // Test 2: Fan Fest
        const t2 = await getJSON('https://panel.ambrizydavalos.com/api/daniela/datos?msg_id=v2&query=quien%20va%20ganando%20fanfest');
        console.log('\n--- TEST 2: Query "quien va ganando fanfest" ---');
        console.log('Status:', t2.statusCode);
        console.log('JSON size:', JSON.stringify(t2.body).length, 'chars');
        console.log('Fan Fest array length:', t2.body.campaigns.fanfest?.length || 0);
        console.log('Other campaigns returned:', Object.keys(t2.body.campaigns).filter(k => k !== 'fanfest'));
        console.log('Proactivos Activos length:', t2.body.resumen_general.proactivos_activos.length);

        // Test 3: Empty (fallback)
        const t3 = await getJSON('https://panel.ambrizydavalos.com/api/daniela/datos?msg_id=v3&query=');
        console.log('\n--- TEST 3: Query "" (No Filter) ---');
        console.log('Status:', t3.statusCode);
        console.log('JSON size:', JSON.stringify(t3.body).length, 'chars');
        console.log('Total Convenciones length:', t3.body.campaigns.convenciones?.length || 0);

    } catch (e) {
        console.error('Test run failed:', e);
    }
}

runTests();
