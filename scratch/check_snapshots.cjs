const fs = require('fs');

const snap = JSON.parse(fs.readFileSync('/Users/diego/Desktop/panel de campañas/db/resumen_snapshot.json', 'utf8'));
const prev = JSON.parse(fs.readFileSync('/Users/diego/Desktop/panel de campañas/db/resumen_snapshot_prev.json', 'utf8'));

console.log('resumen_snapshot.json date:', snap.date);
if (snap.data && snap.data.resumen_general && snap.data.resumen_general.pagado_pendiente) {
    const total = snap.data.resumen_general.pagado_pendiente.reduce((sum, r) => {
        return sum + Math.max(Number(r['Total _Prima_Pagada']) || 0, 0);
    }, 0);
    console.log('resumen_snapshot.json total prima pagada:', total);
}

console.log('resumen_snapshot_prev.json date:', prev.date);
if (prev.data && prev.data.resumen_general && prev.data.resumen_general.pagado_pendiente) {
    const totalPrev = prev.data.resumen_general.pagado_pendiente.reduce((sum, r) => {
        return sum + Math.max(Number(r['Total _Prima_Pagada']) || 0, 0);
    }, 0);
    console.log('resumen_snapshot_prev.json total prima pagada:', totalPrev);
}
