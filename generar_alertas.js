import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DB_PATH = path.join(process.cwd(), 'db');
const SNAPSHOT_FILE = path.join(DB_PATH, 'resumen_snapshot.json');
const PREV_FILE = path.join(DB_PATH, 'resumen_snapshot_prev.json');
const ALERTS_FILE = path.join(DB_PATH, 'alertas_pendientes.json');

const formatCurrency = (val) => {
    if (Math.abs(val) >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
    if (Math.abs(val) >= 1000) return `$${(val / 1000).toFixed(1)}k`;
    return `$${val.toFixed(2)}`;
};

const getFirst = (name) => {
    if (!name) return 'Asesor';
    const f = name.split(' ')[0];
    return f.charAt(0) + f.slice(1).toLowerCase();
};

export const generateAlerts = () => {
    console.log('🔔 Generando alertas inteligentes (NUEVO FORMATO EXCLUSIVO)...');

    if (!fs.existsSync(PREV_FILE) || !fs.existsSync(SNAPSHOT_FILE)) {
        console.log('ℹ️ No hay snapshot anterior para comparar. Se generarán alertas en la próxima actualización.');
        return;
    }

    const prev = JSON.parse(fs.readFileSync(PREV_FILE, 'utf-8'));
    const curr = JSON.parse(fs.readFileSync(SNAPSHOT_FILE, 'utf-8'));

    const prevData = prev.data || prev;
    const currData = curr.data || curr;

    const prevRG = prevData.resumen_general || {};
    const currRG = currData.resumen_general || {};
    const prevCamps = prevData.campaigns || {};
    const currCamps = currData.campaigns || {};

    const alerts = [];
    const uid = () => crypto.randomUUID();

    // ===================== 1. PAGADO Y PENDIENTE =====================
    const prevPag = prevRG.pagado_pendiente || [];
    const currPag = currRG.pagado_pendiente || [];

    const prevPagMap = {};
    prevPag.forEach(r => { prevPagMap[r['Nombre Asesor']] = r; });

    currPag.forEach(r => {
        const name = r['Nombre Asesor'];
        const firstName = getFirst(name);
        const old = prevPagMap[name] || {};

        const newPend = Number(r['Pólizas_Pendinetes'] || 0); // Ojo con typo en JSON original
        const oldPend = Number(old['Pólizas_Pendinetes'] || 0);

        const newPag = Number(r['Pólizas-Pagadas'] || 0);
        const oldPag = Number(old['Pólizas-Pagadas'] || 0);

        // A) Emisión Nueva (entró a pólizas pendientes)
        if (newPend > 0 && oldPend === 0) {
            alerts.push({
                id: uid(), asesor: name, firstName: firstName,
                campaign: 'pagado_emitido', type: 'positive',
                event: '¡Nueva póliza emitida (pendiente de pago)!',
                message: `Hola ${firstName}, ¿cómo estás? 👋\n¡Oye, muy bien! 🎉\n\nAcabo de revisar el reporte más reciente y noté que acabas de emitir póliza(s). Ahora figuras con *${newPend} póliza(s) pendiente(s) de pago*.\n\n¡Excelente trabajo! Vamos a darle seguimiento para que quede pagada pronto. 💪\n\ndéjame un pulgarcito arriba de enterad@ 🙂`,
                sent: false
            });
        }

        // B) Póliza Pagada (entró a asesores con pólizas pagadas, o aumentó)
        if (newPag > oldPag) {
            alerts.push({
                id: uid(), asesor: name, firstName: firstName,
                campaign: 'pagado_emitido', type: 'positive',
                event: '¡Nueva póliza pagada!',
                message: `Hola ${firstName}, ¿cómo estás? 👋\n¡Felicidades! 🎉\n\nAl revisar nuestro reporte más reciente, noté que ya tienes *${newPag} póliza(s) pagada(s)* (¡subiste desde tu corte anterior!).\n\n¡Gran esfuerzo, sigue así, vas con todo! 🚀\n\ndéjame un pulgarcito arriba de enterad@ 🙂`,
                sent: false
            });
        }
    });


    // ===================== 2. CONVENCIONES (Top 10) =====================
    let currConv = currCamps.convenciones || [];
    let prevConv = prevCamps.convenciones || [];
    
    const prevConvMap = {};
    prevConv.forEach(r => { prevConvMap[r.Asesor] = r; });

    // Ordenar por PA_Total descendente y tomar Top 10
    currConv.sort((a, b) => (Number(b.PA_Total || 0) - Number(a.PA_Total || 0)));
    const top10Conv = currConv.slice(0, 10);

    top10Conv.forEach(r => {
        const old = prevConvMap[r.Asesor];
        if (!old) return;

        const name = r.Asesor;
        const firstName = getFirst(name);
        
        const oldLugar = Number(old.Lugar || 999);
        const newLugar = Number(r.Lugar || 999);
        const diffLugar = oldLugar - newLugar; // Positivo = subió lugares
        
        const oldCred = Number(old.PA_Total || 0);
        const newCred = Number(r.PA_Total || 0);
        const diffCred = newCred - oldCred;

        if (diffLugar !== 0 || diffCred !== 0) {
            const upOrDownLugar = diffLugar > 0 ? `subiste ${diffLugar} lugares` : diffLugar < 0 ? `bajaste ${Math.abs(diffLugar)} lugares` : `te mantuviste en el mismo lugar`;
            const upOrDownCred = diffCred > 0 ? `incrementaste ${formatCurrency(diffCred)}` : `tus créditos variaron por ${formatCurrency(diffCred)}`;
            const emoji = diffLugar >= 0 ? '🚀' : '⚠️';

            alerts.push({
                id: uid(), asesor: name, firstName: firstName,
                campaign: 'convenciones', type: diffLugar >= 0 ? 'positive' : 'risk',
                event: `Top 10 Convenciones (Lugar #${newLugar})`,
                message: `Hola ${firstName}, ¿cómo estás? 👋\n¡Estás dentro del TOP 10 de Convenciones de la Promotoría! ${emoji}\n\nRevisando el último corte, actualmente estás en el *Lugar #${newLugar}* de la tabla. Comparado con el reporte anterior, *${upOrDownLugar}* e *${upOrDownCred} créditos*.\n\nLlevas un total de *${formatCurrency(newCred)} créditos*.\n¡Sigue así, estamos muy orgullosos! 💪\n\ndéjame un pulgarcito arriba de enterad@ 🙂`,
                sent: false
            });
        }
    });

    // ===================== 3. MDRT (Top 10) =====================
    let currMdrt = currCamps.mdrt || [];
    let prevMdrt = prevCamps.mdrt || [];

    // Calcular rankings dinámicos en base a PA_Acumulada
    currMdrt.sort((a, b) => (Number(b.PA_Acumulada || 0) - Number(a.PA_Acumulada || 0)));
    prevMdrt.sort((a, b) => (Number(b.PA_Acumulada || 0) - Number(a.PA_Acumulada || 0)));

    // Asignar rank viejo
    const prevMdrtMap = {};
    prevMdrt.forEach((r, idx) => {
        prevMdrtMap[r.Asesor] = { ...r, rank: idx + 1 };
    });

    const top10Mdrt = currMdrt.slice(0, 10);

    top10Mdrt.forEach((r, idx) => {
        const name = r.Asesor;
        const firstName = getFirst(name);
        const newRank = idx + 1;
        const old = prevMdrtMap[name];

        if (!old) return; // Si es nuevo completamente, tal vez no queremos notificarle descenso, pero es Top 10

        const oldRank = old.rank;
        const oldPA = Number(old.PA_Acumulada || 0);
        const newPA = Number(r.PA_Acumulada || 0);
        
        const diffRank = oldRank - newRank; // Positivo = subió lugares en el ranking
        const diffPA = newPA - oldPA;

        if (diffRank !== 0 || diffPA !== 0) {
            const upOrDownRank = diffRank > 0 ? `subiste ${diffRank} posiciones` : diffRank < 0 ? `bajaste ${Math.abs(diffRank)} posiciones` : `te mantuviste en la misma posición`;
            const upOrDownPA = diffPA > 0 ? `sumaste ${formatCurrency(diffPA)}` : `variaste ${formatCurrency(diffPA)}`;
            const emoji = diffRank >= 0 ? '🏆' : '⚠️';

            alerts.push({
                id: uid(), asesor: name, firstName: firstName,
                campaign: 'mdrt', type: diffRank >= 0 ? 'positive' : 'risk',
                event: `Top 10 MDRT (Lugar #${newRank})`,
                message: `Hola ${firstName}, ¿cómo estás? 👋\n¡Perteneces al selecto TOP 10 de MDRT de nuestra promotoría! ${emoji}\n\nEn la última actualización del ranking de MDRT te posicionaste en el *Lugar #${newRank}*. Respecto a la medición anterior, *${upOrDownRank}* y *${upOrDownPA}* a tu meta.\n\nTu Prima Acumulada actual es de *${formatCurrency(newPA)}*.\n¡Vamos con todo por ese reconocimiento internacional! 🌎\n\ndéjame un pulgarcito arriba de enterad@ 🙂`,
                sent: false
            });
        }
    });

    // ===================== GUARDAR ALERTAS =====================
    // Cada nueva actualización reemplaza completamente las alertas anteriores
    // mostrando únicamente los cambios entre la medición pasada y la actual.
    const output = {
        generatedAt: new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' }),
        totalNew: alerts.length,
        alerts: alerts
    };

    fs.writeFileSync(ALERTS_FILE, JSON.stringify(output, null, 2));
    console.log(`🔔 ${alerts.length} alertas generadas (${alerts.filter(a => a.type === 'positive').length} positivas, ${alerts.filter(a => a.type === 'risk').length} de riesgo).`);
};

// Ejecutar si se llama directamente
if (process.argv[1] && process.argv[1].includes('generar_alertas')) {
    generateAlerts();
}
