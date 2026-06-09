const https = require('https');

https.get('https://panel.ambrizydavalos.com/api/daniela/datos', (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            const convenciones = json.campaigns.convenciones;
            const zeroCredits = convenciones.filter(c => c.creditos === 0);
            console.log('Advisors in Convenciones with creditos === 0:', zeroCredits);
        } catch (e) {
            console.error('Parsing error:', e);
        }
    });
}).on('error', (err) => {
    console.error('Request error:', err);
});
