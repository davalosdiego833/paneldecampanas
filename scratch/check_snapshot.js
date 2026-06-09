import fs from 'fs';
import path from 'path';

const snapshotPath = './db/resumen_snapshot.json';
if (!fs.existsSync(snapshotPath)) {
    console.log('Snapshot file does not exist');
    process.exit(1);
}

const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
console.log('Keys in snapshot.data:', Object.keys(snapshot.data || {}));
console.log('Keys in snapshot.data.campaigns:', Object.keys(snapshot.data.campaigns || {}));
console.log('Keys in snapshot.data.resumen_general:', Object.keys(snapshot.data.resumen_general || {}));
console.log('Campaign dates:', snapshot.data.campaignDates);

const vtpData = snapshot.data.campaigns.vive_tu_pasion;
console.log('Vive tu pasion entries count:', vtpData ? vtpData.length : 'none');
if (vtpData && vtpData.length > 0) {
    console.log('Sample entry for vive_tu_pasion:', vtpData.slice(0, 3));
}
