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
            console.log('First 3 Convenciones:', convenciones.slice(0, 3));
        } catch (e) {
            console.error('Parsing error:', e);
        }
    });
}).on('error', (err) => {
    console.error('Request error:', err);
});
