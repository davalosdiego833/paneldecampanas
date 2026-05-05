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

export const generateAlerts = () => {
    console.log('🔔 Generando alertas inteligentes...');

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
    const fechasCorte = currData.fechas_corte || {};

    const alerts = [];
    const uid = () => crypto.randomUUID();

    // ===================== 1. PROACTIVOS =====================
    const prevPro = prevRG.proactivos || [];
    const currPro = currRG.proactivos || [];

    const prevProMap = {};
    prevPro.forEach(r => { prevProMap[r.ASESOR] = r; });

    currPro.forEach(r => {
        const name = r.ASESOR;
        const firstName = name ? name.split(' ')[0] : 'Asesor';
        const firstNameCap = firstName.charAt(0) + firstName.slice(1).toLowerCase();
        const old = prevProMap[name];
        const fecha = fechasCorte.proactivos || 'hoy';

        if (!old) return; // Asesor nuevo, no hay comparación

        // Positivo: pasó de inactivo a proactivo
        if (old.Proactivo_al_mes === 'i' && r.Proactivo_al_mes === 'p') {
            alerts.push({
                id: uid(), asesor: name, firstName: firstNameCap,
                campaign: 'proactivos', type: 'positive',
                event: '¡Ya es Proactivo del mes!',
                message: `Hola ${firstNameCap}, ¿cómo estás? 👋\n¡Excelentes noticias! 🎉\n\nAl revisar nuestro cierre del ${fecha}, noté que *ya figuras en la Lista de Proactivos* de la promotoría.\n\n¡Felicidades! Esto demuestra tu compromiso y constancia. Sigue así, ¡eres un ejemplo para todo el equipo! 🏆\n\ndéjame un pulgarcito arriba de enterad@ 🙂`,
                sent: false
            });
        }

        // Negativo: pasó de proactivo a inactivo
        if (old.Proactivo_al_mes === 'p' && r.Proactivo_al_mes === 'i') {
            const faltantes = Number(r['Pólizas_Faltantes'] || 0);
            // Determinar mes del corte para calcular requisito
            const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
            let monthIndex = new Date().getMonth() + 1;
            const words = fecha.replace(/,/g, '').split(' ');
            for (const word of words) {
                const idx = months.indexOf(word.toLowerCase());
                if (idx !== -1) { monthIndex = idx + 1; break; }
            }
            const mesNombre = months[monthIndex - 1];
            const mesCap = mesNombre.charAt(0).toUpperCase() + mesNombre.slice(1);

            alerts.push({
                id: uid(), asesor: name, firstName: firstNameCap,
                campaign: 'proactivos', type: 'risk',
                event: `Perdió estatus de Proactivo (faltan ${faltantes} pólizas)`,
                message: `AVISO DE PROACTIVOS\n\nEspero que estés teniendo un excelente día.\n\nTe escribo personalmente porque, al revisar nuestro cierre del ${fecha}, noté que todavía no figuras en la Lista de Proactivos de la promotoria.\n\nComo sabes, para nosotros en Ambriz Asesores, mantener un ritmo constante de producción no es solo una métrica; es la garantía de que tu negocio sigue sano y protegiendo familias.\n\nAl cierre de cada semestre del año haremos evaluación de proactivos y con esto se considerara seguir teniendo derecho a:\n - TENER PRP INDIVIDUAL CON EMMANUEL (PARA ASESORES +2AÑOS)\n - HACER USO DE HERRAMIENTAS DE LA PROMOTORIA PARA TU NEGOCIO (PANEL DE CAMPAÑAS, PAGINA DE ANF, ETC)\n\nPara el mes de ${mesCap}, el requisito mínimo es contar con ${monthIndex} pólizas vendidas para mantener el estatus de proactivo.\n\nActualmente:\nTe hacen falta: ${faltantes} póliza(s) para ser asesor proactivo en ${mesCap}.\n\ndéjame un pulgarcito arriba de enterad@ 🙂`,
                sent: false
            });
        }
    });

    // ===================== 2. PAGADO Y EMITIDO =====================
    const prevPag = prevRG.pagado_pendiente || [];
    const currPag = currRG.pagado_pendiente || [];
    const fecha_pag = fechasCorte.pagado_pendiente || 'hoy';

    const prevPagMap = {};
    prevPag.forEach(r => { prevPagMap[r['Nombre Asesor']] = r; });

    currPag.forEach(r => {
        const name = r['Nombre Asesor'];
        const firstName = name ? name.split(' ')[0] : 'Asesor';
        const firstNameCap = firstName.charAt(0) + firstName.slice(1).toLowerCase();
        const old = prevPagMap[name];
        if (!old) return;

        const oldPrima = Number(old['Total _Prima_Pagada'] || 0);
        const newPrima = Number(r['Total _Prima_Pagada'] || 0);
        const diff = newPrima - oldPrima;

        // Solo alertar cambios significativos (más de $5k de diferencia)
        if (diff > 5000) {
            alerts.push({
                id: uid(), asesor: name, firstName: firstNameCap,
                campaign: 'pagado_emitido', type: 'positive',
                event: `Prima pagada subió ${formatCurrency(diff)}`,
                message: `Hola ${firstNameCap}, ¿cómo estás? 👋\n¡Grandes noticias! 🎉\n\nAl revisar los números al ${fecha_pag}, noté que tu prima pagada subió *${formatCurrency(diff)}*. Ahora llevas un total de *${formatCurrency(newPrima)}*.\n\n¡Excelente trabajo, sigue con ese ritmo! 💪\n\ndéjame un pulgarcito arriba de enterad@ 🙂`,
                sent: false
            });
        }
    });

    // ===================== 3. COMPARATIVO DE VIDA =====================
    const prevCV = (prevRG.comparativo_vida || {}).individuals || [];
    const currCV = (currRG.comparativo_vida || {}).individuals || [];
    const fecha_cv = fechasCorte.comparativo_vida || 'hoy';

    const prevCVMap = {};
    prevCV.forEach(r => { prevCVMap[r['Nombre del Asesor']] = r; });

    currCV.forEach(r => {
        const name = r['Nombre del Asesor'];
        const firstName = name ? name.split(' ')[0] : 'Asesor';
        const firstNameCap = firstName.charAt(0) + firstName.slice(1).toLowerCase();
        const old = prevCVMap[name];
        if (!old) return;

        const oldPols = Number(old.Polizas_Pagadas_Año_Actual || 0);
        const newPols = Number(r.Polizas_Pagadas_Año_Actual || 0);
        const polDiff = newPols - oldPols;

        if (polDiff >= 3) {
            alerts.push({
                id: uid(), asesor: name, firstName: firstNameCap,
                campaign: 'comparativo_vida', type: 'positive',
                event: `+${polDiff} pólizas pagadas vs corte anterior`,
                message: `Hola ${firstNameCap}, ¿cómo estás? 👋\n¡Oye, excelentes noticias! 📈\n\nRevisando tu Comparativo de Vida al ${fecha_cv}, veo que subiste *${polDiff} pólizas pagadas* desde el último corte. Ahora llevas ${newPols} pólizas en el año actual.\n\n¡Gran esfuerzo, sigue así! 🔥\n\ndéjame un pulgarcito arriba de enterad@ 🙂`,
                sent: false
            });
        }

        // Riesgo: bajó significativamente vs año anterior
        const crecPct = Number(r['%_Crec_Polizas_Pagadas'] || 0);
        const oldCrecPct = Number(old['%_Crec_Polizas_Pagadas'] || 0);
        if (crecPct < -0.3 && oldCrecPct >= -0.3 && newPols > 0) {
            alerts.push({
                id: uid(), asesor: name, firstName: firstNameCap,
                campaign: 'comparativo_vida', type: 'risk',
                event: `Decrecimiento de ${(crecPct * 100).toFixed(0)}% vs año anterior`,
                message: `Hola ${firstNameCap}, ¿cómo estás? 👋\nOye, estuve checando tu Comparativo de Vida al ${fecha_cv} y noté que estás un *${(Math.abs(crecPct) * 100).toFixed(0)}% por debajo* de lo que traías el año pasado en pólizas pagadas.\n\nEl año pasado a estas fechas traías ${Number(r.Polizas_Pagadas_Año_Anterior || 0)} y ahora llevas ${newPols}.\n\n¡Sé que puedes revertir esto! ¿En qué te podemos apoyar para retomar el ritmo? 💪\n\ndéjame un pulgarcito arriba de enterad@ 🙂`,
                sent: false
            });
        }
    });

    // ===================== GUARDAR ALERTAS =====================
    // Cargar alertas existentes para preservar el estado "sent"
    let existingAlerts = [];
    if (fs.existsSync(ALERTS_FILE)) {
        try {
            const existing = JSON.parse(fs.readFileSync(ALERTS_FILE, 'utf-8'));
            existingAlerts = (existing.alerts || []).filter(a => a.sent); // Conservar solo las ya enviadas
        } catch { }
    }

    const output = {
        generatedAt: new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' }),
        totalNew: alerts.length,
        alerts: [...alerts, ...existingAlerts]
    };

    fs.writeFileSync(ALERTS_FILE, JSON.stringify(output, null, 2));
    console.log(`🔔 ${alerts.length} alertas generadas (${alerts.filter(a => a.type === 'positive').length} positivas, ${alerts.filter(a => a.type === 'risk').length} de riesgo).`);
};

// Ejecutar si se llama directamente
if (process.argv[1] && process.argv[1].includes('generar_alertas')) {
    generateAlerts();
}
