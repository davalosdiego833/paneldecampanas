const fs = require('fs');
const path = require('path');

const SNAPSHOT_PATH = path.join(__dirname, '../db/resumen_snapshot.json');

function normalizeString(str) {
    return str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : '';
}

function runSimulatedAPI(queryText) {
    if (!fs.existsSync(SNAPSHOT_PATH)) {
        console.error('Snapshot not found');
        return;
    }
    const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf-8'));
    const originalData = snapshot.data || {};
    const rg = originalData.resumen_general || {};
    const originalCampaigns = originalData.campaigns || {};

    const fechas_corte = originalData.fechas_corte || {};

    const queryNorm = normalizeString(queryText);

    let filterAdvisor = null;
    let filterCampaign = null;
    let filterProactivos = false;

    if (queryNorm) {
        const allAdvisors = new Set();
        if (originalCampaigns.convenciones) originalCampaigns.convenciones.forEach((c) => { if (c.Asesor) allAdvisors.add(c.Asesor); });
        if (originalCampaigns.mdrt) originalCampaigns.mdrt.forEach((c) => { if (c.Asesor) allAdvisors.add(c.Asesor); });
        if (rg.proactivos) rg.proactivos.forEach((p) => { if (p.ASESOR) allAdvisors.add(p.ASESOR); });
        if (rg.pagado_pendiente) rg.pagado_pendiente.forEach((r) => { if (r['Nombre Asesor']) allAdvisors.add(r['Nombre Asesor']); });

        const nicknames = {
            'moni': 'MONICA ANDREA AMBRIZ GOMEZ',
            'monica': 'MONICA ANDREA AMBRIZ GOMEZ',
            'desiree': 'DESIREE DE LA PEÑA OROZCO',
            'desy': 'DESIREE DE LA PEÑA OROZCO',
            'desire': 'DESIREE DE LA PEÑA OROZCO',
            'darinka': 'DARINKA UREÑA CASILLAS',
            'dary': 'DARINKA UREÑA CASILLAS',
            'rafa': 'RAFAEL ALBERTO SUAREZ BAQUEDANO',
            'rafael': 'RAFAEL ALBERTO SUAREZ BAQUEDANO',
            'teresa': 'MARIA TERESA ASENCIO LOZANO',
            'tere': 'MARIA TERESA ASENCIO LOZANO',
            'paulina': 'PAULINA LIZBETH SOTO MUÑIZ',
            'pau': 'PAULINA LIZBETH SOTO MUÑIZ',
            'gabriela': 'GABRIELA CASTAÑEDA SALAZAR',
            'gaby': 'GABRIELA CASTAÑEDA SALAZAR',
            'sofia': 'SOFIA CAMPILLO VASCONCELOS',
            'sofi': 'SOFIA CAMPILLO VASCONCELOS',
            'monserrat': 'MONSERRAT VELASCO SANTOS',
            'monse': 'MONSERRAT VELASCO SANTOS',
            'anais': 'ANAIS LUA MORENO',
            'paula': 'PAULA ANGELICA LOMELI CAZARES'
        };

        // Try nickname matching with word boundary
        for (const nick in nicknames) {
            const regex = new RegExp('\\b' + nick + '\\b', 'i');
            if (regex.test(queryNorm)) {
                filterAdvisor = nicknames[nick];
                break;
            }
        }

        // Try word boundary matching on full names
        if (!filterAdvisor) {
            for (const advisor of allAdvisors) {
                const advNorm = advisor.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
                const words = advNorm.split(/\s+/).filter(w => w.length > 2 && w !== 'del' && w !== 'las' && w !== 'los' && w !== 'maria');
                for (const word of words) {
                    const regex = new RegExp('\\b' + word + '\\b', 'i');
                    if (regex.test(queryNorm)) {
                        filterAdvisor = advisor;
                        break;
                    }
                }
                if (filterAdvisor) break;
            }
        }

        // Campaign matching
        if (!filterAdvisor) {
            if (queryNorm.includes('fanfest') || queryNorm.includes('fan fest')) {
                filterCampaign = 'fanfest';
            } else if (queryNorm.includes('pasion') || queryNorm.includes('pasión')) {
                filterCampaign = 'vive_tu_pasion';
            } else if (queryNorm.includes('mdrt')) {
                filterCampaign = 'mdrt';
            } else if (queryNorm.includes('convencion') || queryNorm.includes('convenciones')) {
                filterCampaign = 'convenciones';
            } else if (queryNorm.includes('legion') || queryNorm.includes('legión') || queryNorm.includes('centurion') || queryNorm.includes('centurión')) {
                filterCampaign = 'legion_centurion';
            } else if (queryNorm.includes('cumbre')) {
                filterCampaign = 'camino_cumbre';
            } else if (queryNorm.includes('graduacion') || queryNorm.includes('graduación')) {
                filterCampaign = 'graduacion';
            } else if (queryNorm.includes('proactivo') || queryNorm.includes('proactivos') || queryNorm.includes('activo') || queryNorm.includes('activos')) {
                filterProactivos = true;
            }
        }
    }

    const matchAsesor = (name) => {
        if (!filterAdvisor) return true;
        const n1 = name ? name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : '';
        const n2 = filterAdvisor.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        return n1 === n2;
    };

    const includeCampaign = (name) => {
        if (filterAdvisor) return true;
        if (filterCampaign) return name === filterCampaign;
        if (filterProactivos) return false;
        return true;
    };

    const includeProactivos = () => {
        if (filterAdvisor) return true;
        if (filterCampaign) return false;
        if (filterProactivos) return true;
        return true;
    };

    const includePagadoPendiente = () => {
        if (filterAdvisor) return true;
        if (filterCampaign) return false;
        if (filterProactivos) return false;
        return true;
    };

    const pag = rg.pagado_pendiente || [];
    let polPag = 0, riPag = 0, roPag = 0, totPag = 0;
    let polPend = 0, riPend = 0, roPend = 0, totPend = 0;
    
    pag.forEach((r) => {
        polPag += Number(r['Pólizas-Pagadas']) || 0;
        riPag += Number(r['Recibo_Inicial_Pagado']) || 0;
        roPag += Number(r['Recibo_Ordinario_Pagado']) || 0;
        totPag += Number(r['Total _Prima_Pagada']) || 0;
        
        polPend += Number(r['Pólizas_Pendinetes']) || 0;
        riPend += Number(r['Recibo_Inicial_Pendiente']) || 0;
        roPend += Number(r['Recibo_Ordinario_Pendiente']) || 0;
        totPend += Number(r['Total _Prima_Pendiente']) || 0;
    });

    const pagado_pendiente_consolidado = {
        pagado: { polizas: polPag, recibo_inicial: riPag, recibo_ordinario: roPag, total_prima: totPag },
        pendiente: { polizas: polPend, recibo_inicial: riPend, recibo_ordinario: roPend, total_prima: totPend }
    };

    const pagado_pendiente_por_asesor = includePagadoPendiente()
        ? pag.map((r) => ({
            asesor: r['Nombre Asesor'],
            pagado: { polizas: Number(r['Pólizas-Pagadas']) || 0, total_prima: Number(r['Total _Prima_Pagada']) || 0 },
            pendiente: { polizas: Number(r['Pólizas_Pendinetes']) || 0, total_prima: Number(r['Total _Prima_Pendiente']) || 0 }
        })).filter((r) => (r.pagado.polizas > 0 || r.pendiente.polizas > 0) && matchAsesor(r.asesor))
        : [];

    const proactivos_list = rg.proactivos || [];
    const proactivos_activos = includeProactivos()
        ? proactivos_list
            .filter((p) => String(p.Proactivo_al_mes).trim().toUpperCase() === 'SÍ' && matchAsesor(p.ASESOR))
            .map((p) => ({
                asesor: p.ASESOR,
                sucursal: p.SUC,
                polizas_del_mes: p.Polizas_Del_mes,
                polizas_acumuladas: p.Polizas_Acumuladas_Total,
                faltantes_mes: p.Pólizas_Faltantes,
                faltantes_dic: p.Pólizas_Faltantes_Para_Dic,
                fecha_conexion: p.Fecha_Conexion
            }))
        : [];

    const proactivos_inactivos = includeProactivos()
        ? proactivos_list
            .filter((p) => String(p.Proactivo_al_mes).trim().toUpperCase() !== 'SÍ' && matchAsesor(p.ASESOR))
            .map((p) => ({
                asesor: p.ASESOR,
                sucursal: p.SUC,
                polizas_del_mes: p.Polizas_Del_mes,
                polizas_acumuladas: p.Polizas_Acumuladas_Total,
                faltantes_mes: p.Pólizas_Faltantes,
                faltantes_dic: p.Pólizas_Faltantes_Para_Dic,
                fecha_conexion: p.Fecha_Conexion
            }))
        : [];

    const campaigns = {};
    
    if (originalCampaigns.mdrt && includeCampaign('mdrt')) {
        campaigns.mdrt = originalCampaigns.mdrt
            .filter((c) => Number(c.PA_Acumulada) > 0 && matchAsesor(c.Asesor))
            .map((c) => ({ asesor: c.Asesor, clave: c.Clave, pa_acumulada: c.PA_Acumulada }));
    }
    if (originalCampaigns.convenciones && includeCampaign('convenciones')) {
        campaigns.convenciones = originalCampaigns.convenciones
            .filter((c) => (Number(c.PA_Total) > 0 || Number(c.Polizas) > 0) && matchAsesor(c.Asesor))
            .map((c) => ({
                asesor: c.Asesor,
                clave: c.Clave,
                creditos: Number(c.PA_Total || 0),
                polizas: Number(c.Polizas || 0),
                lugar_ranking: Number(c.Lugar || 9999),
                meta_creditos_lugar_480: Number(c.Lugar_480 || 0),
                meta_creditos_lugar_228: Number(c.Lugar_228 || 0),
                meta_creditos_lugar_108: Number(c.Lugar_108 || 0),
                meta_creditos_lugar_28: Number(c.Lugar_28 || 0)
            }));
    }
    if (originalCampaigns.legion_centurion && includeCampaign('legion_centurion')) {
        campaigns.legion_centurion = originalCampaigns.legion_centurion
            .filter((c) => Number(c.Total_Polizas) > 0 && matchAsesor(c.Asesor))
            .map((c) => ({
                asesor: c.Asesor,
                clave: c.Clave,
                total_polizas: c.Total_Polizas,
                mes_actual: c.Mes_Actual,
                nivel: c.Nivel,
                en_meta: c.EnMeta
            }));
    }
    if (originalCampaigns.camino_cumbre && includeCampaign('camino_cumbre')) {
        campaigns.camino_cumbre = originalCampaigns.camino_cumbre
            .filter((c) => Number(c.Polizas_Totales) > 0 && matchAsesor(c.Asesor))
            .map((c) => ({
                asesor: c.Asesor,
                clave: c.Clave,
                mes_asesor: c.Mes_Asesor,
                polizas_totales: c.Polizas_Totales
            }));
    }
    if (originalCampaigns.fanfest && includeCampaign('fanfest')) {
        campaigns.fanfest = originalCampaigns.fanfest
            .filter((c) => (Number(c.Total_Polizas) > 0 || String(c.Premio).trim() === 'GANADO') && matchAsesor(c.Asesor))
            .map((c) => ({
                asesor: c.Asesor,
                clave: c.Clave,
                total_polizas: c.Total_Polizas,
                premio: c.Premio
            }));
    }
    if (originalCampaigns.vive_tu_pasion && includeCampaign('vive_tu_pasion')) {
        campaigns.vive_tu_pasion = originalCampaigns.vive_tu_pasion
            .filter((c) => (Number(c.Polizas) > 0 || String(c.Premio).trim() !== '') && matchAsesor(c.Asesor))
            .map((c) => ({
                asesor: c.Asesor,
                clave: c.Clave,
                polizas: c.Polizas,
                premio: c.Premio
            }));
    }
    if (originalCampaigns.graduacion && includeCampaign('graduacion')) {
        campaigns.graduacion = originalCampaigns.graduacion
            .filter((c) => matchAsesor(c.Asesor))
            .map((c) => ({
                asesor: c.Asesor,
                clave: c.Clave,
                mes_asesor: c.Mes_Asesor,
                polizas_totales: c.Polizas_Totales,
                fecha_limite: c.Fecha_Limite_Meta,
                comisiones: c.Comisones
            }));
    }

    const output = {
        fechas_corte,
        resumen_general: {
            pagado_pendiente_consolidado,
            pagado_pendiente_por_asesor,
            proactivos_activos,
            proactivos_inactivos
        },
        campaigns
    };

    console.log(`\n============================`);
    console.log(`QUERY: "${queryText}"`);
    console.log(`Matched Advisor: ${filterAdvisor}`);
    console.log(`Matched Campaign: ${filterCampaign}`);
    console.log(`Filter Proactivos: ${filterProactivos}`);
    console.log(`Output JSON character length: ${JSON.stringify(output).length}`);
    
    // Log sample metrics
    if (filterAdvisor) {
        console.log(`Filtered Advisor details in Convenciones:`, output.campaigns.convenciones);
        console.log(`Filtered Advisor details in MDRT:`, output.campaigns.mdrt);
    } else if (filterCampaign) {
        console.log(`Campaign ${filterCampaign} item count:`, output.campaigns[filterCampaign]?.length || 0);
        console.log(`Other campaigns present:`, Object.keys(output.campaigns).filter(k => k !== filterCampaign));
    } else if (filterProactivos) {
        console.log(`Proactivos Activos count:`, output.resumen_general.proactivos_activos.length);
        console.log(`Campaigns present:`, Object.keys(output.campaigns));
    } else {
        console.log(`Total conventions items:`, output.campaigns.convenciones.length);
    }
}

// Execute test cases
runSimulatedAPI("como va monica?");
runSimulatedAPI("dame los datos de desiree");
runSimulatedAPI("quienes son los proactivos de la promotoria?");
runSimulatedAPI("quien ha ganado la campana de fan fest");
runSimulatedAPI(""); // General backup case
