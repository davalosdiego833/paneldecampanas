const https = require('https');

https.get('https://panel.ambrizydavalos.com/api/daniela/datos', (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log('=== FINDING ALL OCCURRENCES OF MONICA IN JSON ===');
            
            // Search in resumen_general.pagado_pendiente_por_asesor
            const ppList = json.resumen_general.pagado_pendiente_por_asesor || [];
            const ppMonica = ppList.filter(x => x.asesor && x.asesor.includes('MONICA'));
            console.log('pagado_pendiente_por_asesor:', ppMonica);

            // Search in resumen_general.proactivos_activos
            const paList = json.resumen_general.proactivos_activos || [];
            const paMonica = paList.filter(x => x.asesor && x.asesor.includes('MONICA'));
            console.log('proactivos_activos:', paMonica);

            // Search in resumen_general.proactivos_inactivos
            const piList = json.resumen_general.proactivos_inactivos || [];
            const piMonica = piList.filter(x => x.asesor && x.asesor.includes('MONICA'));
            console.log('proactivos_inactivos:', piMonica);

            // Search in campaigns
            for (const campaignName in json.campaigns) {
                const list = json.campaigns[campaignName];
                const found = list.filter(x => x.asesor && x.asesor.includes('MONICA'));
                if (found.length > 0) {
                    console.log(`Campaign [${campaignName}]:`, found);
                }
            }

        } catch (e) {
            console.error('Parsing error:', e);
        }
    });
}).on('error', (err) => {
    console.error('Request error:', err);
});
