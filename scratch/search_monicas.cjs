const fs = require('fs');
const path = require('path');

const SNAPSHOT_PATH = path.join(__dirname, '../db/resumen_snapshot.json');

try {
    const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf-8'));
    const conventions = snapshot.data.campaigns.convenciones;
    const monicas = conventions.filter(c => c.Asesor && c.Asesor.toUpperCase().includes('MONICA'));
    console.log('Monicas in Convenciones:', monicas);
} catch (e) {
    console.error('Error:', e);
}
