const fs = require('fs');
const snap = JSON.parse(fs.readFileSync('/Users/diego/Desktop/panel de campañas/db/resumen_snapshot.json', 'utf8'));
console.log('Root keys:', Object.keys(snap));
if (snap.metadata) console.log('Metadata:', snap.metadata);
