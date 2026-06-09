const fs = require('fs');
const path = require('path');

const snapshotPath = './db/resumen_snapshot.json';
if (fs.existsSync(snapshotPath)) {
    const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf-8'));
    const campaigns = snapshot.data.campaigns || {};
    console.log("Campaign keys:", Object.keys(campaigns));
    for (const key of Object.keys(campaigns)) {
        console.log(`\n--- Campaign: ${key} (count: ${campaigns[key]?.length})`);
        if (campaigns[key] && campaigns[key].length > 0) {
            console.log("Sample:", campaigns[key][0]);
        }
    }
} else {
    console.log("Snapshot not found");
}
