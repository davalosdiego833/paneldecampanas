import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BASE_PATH = __dirname;

const HIST_PATH = path.join(BASE_PATH, 'db', 'historico_metas.json');
const SNAP_PATH = path.join(BASE_PATH, 'db', 'resumen_snapshot.json');

const monthKey = process.argv[2]; // e.g. "abr"
const yearKey = process.argv[3] || "2026";

if (!monthKey) {
    console.error("❌ Error: Debes especificar el mes a cerrar (ej: node cerrar_mes.js abr)");
    process.exit(1);
}

const run = async () => {
    try {
        if (!fs.existsSync(SNAP_PATH)) throw new Error("Snapshot no encontrado.");
        if (!fs.existsSync(HIST_PATH)) fs.writeFileSync(HIST_PATH, JSON.stringify({ [yearKey]: {} }));

        const snap = JSON.parse(fs.readFileSync(SNAP_PATH, 'utf8'));
        const hist = JSON.parse(fs.readFileSync(HIST_PATH, 'utf8'));

        // Calcular total actual del snapshot (Pagado y Emitido)
        const total = (snap.data.resumen_general?.pagado_pendiente || []).reduce((sum, r) => {
            return sum + Math.max(Number(r['Total _Prima_Pagada']) || 0, 0);
        }, 0);

        if (!hist[yearKey]) hist[yearKey] = {};
        hist[yearKey][monthKey.toLowerCase()] = Math.round(total);

        fs.writeFileSync(HIST_PATH, JSON.stringify(hist, null, 2));

        console.log(`✅ Mes "${monthKey}" cerrado exitosamente con $${total.toLocaleString()} en el histórico.`);
    } catch (e) {
        console.error("❌ Error al cerrar mes:", e.message);
    }
};

run();
