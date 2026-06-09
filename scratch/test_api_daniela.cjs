const fs = require('fs');
const path = require('path');

const SNAPSHOT_PATH = path.join(__dirname, '../db/resumen_snapshot.json');

try {
    if (!fs.existsSync(SNAPSHOT_PATH)) {
        console.error('Snapshot not found at:', SNAPSHOT_PATH);
        process.exit(1);
    }
    const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf-8'));
    const originalData = snapshot.data || {};
    const rg = originalData.resumen_general || {};
    const originalCampaigns = originalData.campaigns || {};

    // 1. Fechas de corte
    const fechas_corte = originalData.fechas_corte || {};

    // 2. Resumen Pagado / Pendiente
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

    const pagado_pendiente_por_asesor = pag.map((r) => ({
        asesor: r['Nombre Asesor'],
        pagado: { polizas: Number(r['Pólizas-Pagadas']) || 0, total_prima: Number(r['Total _Prima_Pagada']) || 0 },
        pendiente: { polizas: Number(r['Pólizas_Pendinetes']) || 0, total_prima: Number(r['Total _Prima_Pendiente']) || 0 }
    })).filter((r) => r.pagado.polizas > 0 || r.pendiente.polizas > 0);

    // 3. Proactivos
    const proactivos_list = rg.proactivos || [];
    const proactivos_activos = proactivos_list
        .filter((p) => String(p.Proactivo_al_mes).trim().toUpperCase() === 'SÍ')
        .map((p) => ({
            asesor: p.ASESOR,
            sucursal: p.SUC,
            polizas_del_mes: p.Polizas_Del_mes,
            polizas_acumuladas: p.Polizas_Acumuladas_Total,
            faltantes_mes: p.Pólizas_Faltantes,
            faltantes_dic: p.Pólizas_Faltantes_Para_Dic,
            fecha_conexion: p.Fecha_Conexion
        }));

    const proactivos_inactivos = proactivos_list
        .filter((p) => String(p.Proactivo_al_mes).trim().toUpperCase() !== 'SÍ')
        .map((p) => ({
            asesor: p.ASESOR,
            sucursal: p.SUC,
            polizas_del_mes: p.Polizas_Del_mes,
            polizas_acumuladas: p.Polizas_Acumuladas_Total,
            faltantes_mes: p.Pólizas_Faltantes,
            faltantes_dic: p.Pólizas_Faltantes_Para_Dic,
            fecha_conexion: p.Fecha_Conexion
        }));

    // 4. Campañas simplificadas
    const campaigns = {};
    
    if (originalCampaigns.mdrt) {
        campaigns.mdrt = originalCampaigns.mdrt
            .filter((c) => Number(c.PA_Acumulada) > 0)
            .map((c) => ({ asesor: c.Asesor, clave: c.Clave, pa_acumulada: c.PA_Acumulada }));
    }
    if (originalCampaigns.convenciones) {
        campaigns.convenciones = originalCampaigns.convenciones
            .filter((c) => Number(c.PA_Total) > 0 || Number(c.Polizas) > 0)
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
    if (originalCampaigns.legion_centurion) {
        campaigns.legion_centurion = originalCampaigns.legion_centurion
            .filter((c) => Number(c.Total_Polizas) > 0)
            .map((c) => ({
                asesor: c.Asesor,
                clave: c.Clave,
                total_polizas: c.Total_Polizas,
                mes_actual: c.Mes_Actual,
                nivel: c.Nivel,
                en_meta: c.EnMeta
            }));
    }
    if (originalCampaigns.camino_cumbre) {
        campaigns.camino_cumbre = originalCampaigns.camino_cumbre
            .filter((c) => Number(c.Polizas_Totales) > 0)
            .map((c) => ({
                asesor: c.Asesor,
                clave: c.Clave,
                mes_asesor: c.Mes_Asesor,
                polizas_totales: c.Polizas_Totales
            }));
    }
    if (originalCampaigns.fanfest) {
        campaigns.fanfest = originalCampaigns.fanfest
            .filter((c) => Number(c.Total_Polizas) > 0 || String(c.Premio).trim() === 'GANADO')
            .map((c) => ({
                asesor: c.Asesor,
                clave: c.Clave,
                total_polizas: c.Total_Polizas,
                premio: c.Premio
            }));
    }
    if (originalCampaigns.vive_tu_pasion) {
        campaigns.vive_tu_pasion = originalCampaigns.vive_tu_pasion
            .filter((c) => Number(c.Polizas) > 0 || String(c.Premio).trim() !== '')
            .map((c) => ({
                asesor: c.Asesor,
                clave: c.Clave,
                polizas: c.Polizas,
                premio: c.Premio
            }));
    }
    if (originalCampaigns.graduacion) {
        campaigns.graduacion = originalCampaigns.graduacion.map((c) => ({
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

    console.log('=== DATA FOR MONICA ===');
    for (const key in output.campaigns) {
        const list = output.campaigns[key];
        const found = list.find(x => x.asesor && x.asesor.includes('MONICA'));
        console.log(`Campaign ${key}:`, found || 'Not Found');
    }

} catch (e) {
    console.error('Error running test:', e);
}
