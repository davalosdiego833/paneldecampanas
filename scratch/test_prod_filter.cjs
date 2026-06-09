const https = require('https');

function testProdURL(url, description) {
    https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        res.on('end', () => {
            try {
                const json = JSON.parse(data);
                console.log(`\n============================`);
                console.log(`TEST: ${description}`);
                console.log(`URL: ${url}`);
                console.log(`Status Code: ${res.statusCode}`);
                console.log(`Output length: ${JSON.stringify(json).length} chars`);
                
                if (json.campaigns) {
                    console.log(`Campaigns present:`, Object.keys(json.campaigns));
                    if (json.campaigns.convenciones) {
                        console.log(`Convenciones item count:`, json.campaigns.convenciones.length);
                        console.log(`Convenciones items:`, json.campaigns.convenciones);
                    }
                    if (json.campaigns.mdrt) {
                        console.log(`MDRT items:`, json.campaigns.mdrt);
                    }
                }
            } catch (e) {
                console.error(`Parsing error for ${description}:`, e);
            }
        });
    }).on('error', (err) => {
        console.error(`Request error for ${description}:`, err);
    });
}

// 1. Query for Monica
testProdURL('https://panel.ambrizydavalos.com/api/daniela/datos?msg_id=test_moni&query=como%20va%20monica%20en%20convenciones', 'Filter Monica');

// 2. Query for Fan Fest campaign
setTimeout(() => {
    testProdURL('https://panel.ambrizydavalos.com/api/daniela/datos?msg_id=test_fanfest&query=quien%20va%20ganando%20fanfest', 'Filter Campaign Fan Fest');
}, 1500);

// 3. Query general (no filter)
setTimeout(() => {
    testProdURL('https://panel.ambrizydavalos.com/api/daniela/datos?msg_id=test_general&query=', 'General No Filter');
}, 3000);
