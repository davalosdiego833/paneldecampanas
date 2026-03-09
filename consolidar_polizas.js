import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directorios base
const BASE_DIR = path.join(__dirname, 'estatus polizas');
const DOWNLOADS_DIR = path.join(BASE_DIR, 'reportes');
const OUTPUT_DIR = path.join(BASE_DIR, 'reportes');
const CAMBIOS_DIR = path.join(BASE_DIR, 'cambios');
const SEGUIMIENTO_DIR = path.join(BASE_DIR, 'seguimiento');

// Garantizar que existan los directorios
[OUTPUT_DIR, CAMBIOS_DIR, SEGUIMIENTO_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

async function consolidate() {
    console.log('📂 Iniciando consolidación de reportes acumulativa...');
    const hoy = new Date().toISOString().split('T')[0];
    const mesActual = hoy.substring(0, 7);

    // 1. Cargar el historial (último reporte generado)
    const reportesMesDir = path.join(OUTPUT_DIR, mesActual);
    if (!fs.existsSync(reportesMesDir)) fs.mkdirSync(reportesMesDir, { recursive: true });

    const existingReports = fs.readdirSync(reportesMesDir)
        .filter(f => f.startsWith('reporte_') && f.endsWith('.json') && !f.includes('summary') && !f.includes(hoy))
        .sort((a, b) => b.localeCompare(a));

    let historialReport = null;
    if (existingReports.length > 0) {
        console.log(`📜 Cargando historial desde: ${existingReports[0]}`);
        historialReport = JSON.parse(fs.readFileSync(path.join(reportesMesDir, existingReports[0]), 'utf-8'));

        // LIMPIEZA DE HISTORIAL: Purgar basura de ejecuciones previas (póliza "1", "2", etc.)
        historialReport.asesores.forEach(a => {
            if (a.polizas) {
                a.polizas = a.polizas.filter(p => p.poliza && String(p.poliza).trim().length >= 5);
            }
        });
    }

    // 2. Leer archivos XLS descargados hoy
    const files = fs.readdirSync(DOWNLOADS_DIR).filter(f => /_P\d+\.xls[x]?$/.test(f));
    console.log(`📊 Encontrados ${files.length} archivos XLS para procesar.`);

    const groupedFiles = {};
    for (const file of files) {
        const match = file.match(/^(\d+)_(.+?)(?:_P\d+)?\.xls[x]?$/);
        if (match) {
            const clave = match[1];
            if (!groupedFiles[clave]) groupedFiles[clave] = { nombre: match[2].replace(/_/g, ' '), files: [] };
            groupedFiles[clave].files.push(file);
        }
    }

    // Preparar el nuevo reporte maestro (copia del historial o nuevo)
    const masterReport = historialReport ? JSON.parse(JSON.stringify(historialReport)) : {
        fecha_reporte: hoy,
        asesores: []
    };
    masterReport.fecha_reporte = hoy;

    // Mapa para acceso rápido
    const masterAsesoresMap = {};
    masterReport.asesores.forEach(a => {
        masterAsesoresMap[a.clave] = a;
        a._polizasMap = {};
        if (!a.polizas) a.polizas = []; // Garantizar que exista el array
        a.polizas.forEach(p => a._polizasMap[p.poliza] = p);
    });

    const cambiosDeEstatus = [];

    // 3. Procesar cada asesor encontrado en el portal
    for (const clave of Object.keys(groupedFiles)) {
        const advInfo = groupedFiles[clave];
        let asesorObj = masterAsesoresMap[clave];

        if (!asesorObj) {
            asesorObj = { nombre: advInfo.nombre, clave: clave, total_polizas: 0, estatus: {}, polizas: [] };
            masterAsesoresMap[clave] = asesorObj;
            masterReport.asesores.push(asesorObj);
            asesorObj._polizasMap = {};
        }

        console.log(`👤 Procesando: ${asesorObj.nombre} (${clave})`);

        for (const file of advInfo.files) {
            try {
                const workbook = XLSX.readFile(path.join(DOWNLOADS_DIR, file));
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

                rows.forEach(row => {
                    // Extraer datos normalizados
                    const keys = Object.keys(row);
                    const numPol = String(row[keys.find(k => k.toLowerCase().includes('liza'))] || '').trim();
                    // Filtro inteligente: Si no hay póliza o es ruido (números cortos como "1" o "2" que mete el Excel en totales)
                    if (!numPol || numPol.length < 5) return;

                    const estatus = row[keys.find(k => k.toLowerCase() === 'estatus')] || 'Desconocido';
                    // Ignorar la fila si el estatus es sospechoso (ruido del Excel)
                    if (estatus === 'Desconocido' && !row[keys.find(k => k.toLowerCase() === 'contratante')]) return;

                    const contratanteKey = keys.find(k => k.toLowerCase().includes('contratante'));
                    const aseguradoKey = keys.find(k => k.toLowerCase().includes('asegurado principal'));
                    const contratante = (row[contratanteKey] || row[aseguradoKey] || '').trim();
                    const producto = row[keys.find(k => k.toLowerCase() === 'producto')] || '';

                    const pExistente = asesorObj._polizasMap[numPol];
                    if (!asesorObj._vistasHoy) asesorObj._vistasHoy = new Set();
                    asesorObj._vistasHoy.add(numPol);

                    if (pExistente) {
                        // Cruce: ¿Cambió el estatus?
                        if (pExistente.estatus !== estatus) {
                            cambiosDeEstatus.push({
                                asesor: asesorObj.nombre,
                                clave: asesorObj.clave,
                                poliza: numPol,
                                contratante: contratante,
                                producto: producto,
                                estatus_anterior: pExistente.estatus,
                                estatus_nuevo: estatus,
                                fecha: hoy,
                                tipo: 'CAMBIO'
                            });
                            pExistente.estatus = estatus;
                        }
                    } else {
                        // Alta de Póliza
                        const newPol = { poliza: numPol, contratante, producto, estatus };
                        asesorObj.polizas.push(newPol);
                        asesorObj._polizasMap[numPol] = newPol;

                        if (historialReport) {
                            cambiosDeEstatus.push({
                                asesor: asesorObj.nombre,
                                clave: asesorObj.clave,
                                poliza: numPol,
                                contratante: contratante,
                                producto: producto,
                                estatus_anterior: 'NUEVA (No en historial)',
                                estatus_nuevo: estatus,
                                fecha: hoy,
                                tipo: 'ALTA'
                            });
                        }
                    }
                });
            } catch (e) {
                console.error(`❌ Error en archivo ${file}:`, e.message);
            }
        }
    }

    // Bajas: ¿Pólizas que ya no aparecen en el portal?
    if (historialReport) {
        masterReport.asesores.forEach(a => {
            // Solo si procesamos archivos para este asesor hoy
            if (groupedFiles[a.clave] && a._vistasHoy) {
                // Iterar sobre las pólizas que estaban en el historial para este asesor
                // y que no fueron vistas en los archivos de hoy
                a.polizas.forEach(p => {
                    if (!a._vistasHoy.has(p.poliza)) {
                        // Esta póliza desapareció del portal (aunque la guardamos en el histórico)
                        // Solo reportamos si no estaba ya marcada como anulada/cancelada/desaparecida
                        if (p.estatus !== 'DESAPARECIDA' && p.estatus !== 'Anulada' && p.estatus !== 'Cancelada') {
                            cambiosDeEstatus.push({
                                asesor: a.nombre,
                                clave: a.clave,
                                poliza: p.poliza,
                                contratante: p.contratante,
                                producto: p.producto,
                                estatus_anterior: p.estatus,
                                estatus_nuevo: 'DESAPARECIDA (No en portal)',
                                fecha: hoy,
                                tipo: 'BAJA'
                            });
                            p.estatus = 'DESAPARECIDA'; // Marcarla en el reporte maestro
                        }
                    }
                });
            }
            delete a._vistasHoy; // Limpiar el set temporal
        });
    }

    // 4. Actualizar totales y limpiar mapas
    masterReport.resumen_general = { total_asesores: masterReport.asesores.length, total_polizas: 0, por_estatus: {} };

    masterReport.asesores.forEach(a => {
        a.total_polizas = a.polizas.length;
        a.estatus = {};
        a.polizas.forEach(p => {
            // Limpia estatus numéricos raros si aparecen (ej. "5" -> "Desconocido" o ignorar)
            let s = String(p.estatus).trim();
            if (s === '5') s = 'Anulada'; // Suposición común si es el código de sistema, o dejar como Desconocido
            if (!s || s === 'undefined') s = 'Desconocido';

            a.estatus[s] = (a.estatus[s] || 0) + 1;
        });

        masterReport.resumen_general.total_polizas += a.total_polizas;
        Object.keys(a.estatus).forEach(es => {
            masterReport.resumen_general.por_estatus[es] = (masterReport.resumen_general.por_estatus[es] || 0) + a.estatus[es];
        });
        delete a._polizasMap;
    });

    // 5. Generar Cambios y Seguimiento
    const resumenCambios = {
        resumen: {
            fecha_anterior: historialReport ? historialReport.fecha_reporte : 'Ninguna',
            fecha_nuevo: hoy,
            total_anterior: historialReport ? historialReport.resumen_general.total_polizas : 0,
            total_nuevo: masterReport.resumen_general.total_polizas,
            diferencia_total: masterReport.resumen_general.total_polizas - (historialReport ? historialReport.resumen_general.total_polizas : 0),
            cambios_estatus_general: {}
        },
        lista_cambios: cambiosDeEstatus
    };

    // Calcular diferencias por estatus para el hero del frontend
    const stsHoy = masterReport.resumen_general.por_estatus;
    const stsAnt = historialReport ? historialReport.resumen_general.por_estatus : {};

    const todosEstatus = [...new Set([...Object.keys(stsHoy), ...Object.keys(stsAnt)])];
    todosEstatus.forEach(es => {
        const h = stsHoy[es] || 0;
        const a = stsAnt[es] || 0;
        resumenCambios.resumen.cambios_estatus_general[es] = {
            anterior: a,
            nuevo: h,
            diferencia: h - a,
            emoji: (h - a) > 0 ? '🟢' : (h - a) < 0 ? '🔴' : '⚪'
        };
    });

    // 6. Guardar todo
    const cambiosHoyDir = path.join(CAMBIOS_DIR, mesActual);
    if (!fs.existsSync(cambiosHoyDir)) fs.mkdirSync(cambiosHoyDir, { recursive: true });
    fs.writeFileSync(path.join(cambiosHoyDir, `cambios_${hoy}.json`), JSON.stringify(resumenCambios, null, 2));

    fs.writeFileSync(path.join(reportesMesDir, `reporte_${hoy}.json`), JSON.stringify(masterReport, null, 2));

    // Resumen ligero para el frontend
    const summaryReport = {
        ...masterReport,
        asesores: masterReport.asesores.map(a => ({ nombre: a.nombre, clave: a.clave, total_polizas: a.total_polizas, estatus: a.estatus }))
    };
    fs.writeFileSync(path.join(reportesMesDir, `reporte_${hoy}_summary.json`), JSON.stringify(summaryReport, null, 2));

    // Seguimiento activo (Cancelaciones recientes)
    const seguimiento = {
        ultima_actualizacion: hoy,
        pendientes_recuperar: cambiosDeEstatus.filter(c => c.estatus_nuevo === 'Anulada' || c.estatus_nuevo === 'Cancelada'),
        recuperadas_este_mes: cambiosDeEstatus.filter(c => c.estatus_anterior === 'Anulada' && c.estatus_nuevo === 'En Vigor')
    };
    fs.writeFileSync(path.join(SEGUIMIENTO_DIR, 'seguimiento_activo.json'), JSON.stringify(seguimiento, null, 2));

    console.log(`\n✅ Proceso completado con éxito!`);
    console.log(`📈 Diferencia total: ${resumenCambios.resumen.diferencia_total}`);
    console.log(`📉 Cambios de estatus detectados: ${cambiosDeEstatus.length}`);
}

consolidate();
