const https = require('https');

https.get('https://panel.ambrizydavalos.com/api/daniela/datos', (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log('Total JSON length:', JSON.stringify(json).length);
            console.log('fechas_corte length:', JSON.stringify(json.fechas_corte).length);
            console.log('pagado_pendiente_consolidado length:', JSON.stringify(json.resumen_general.pagado_pendiente_consolidado).length);
            console.log('pagado_pendiente_por_asesor length:', JSON.stringify(json.resumen_general.pagado_pendiente_por_asesor).length);
            console.log('proactivos_activos length:', JSON.stringify(json.resumen_general.proactivos_activos).length);
            console.log('proactivos_inactivos length:', JSON.stringify(json.resumen_general.proactivos_inactivos).length);
            console.log('campaigns length:', JSON.stringify(json.campaigns).length);
            for (const key in json.campaigns) {
                console.log(`- campaign ${key} length:`, JSON.stringify(json.campaigns[key]).length);
            }
        } catch (e) {
            console.error('Parsing error:', e);
        }
    });
}).on('error', (err) => {
    console.error('Request error:', err);
});
