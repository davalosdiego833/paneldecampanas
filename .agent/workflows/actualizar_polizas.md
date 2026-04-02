---
description: Proceso de Actualización de Estatus de Pólizas (Manual de Operación)
---

# 🛡️ Workflow: Actualización de Estatus de Pólizas

Este manual define el proceso exacto que yo, como tu AI Partner, seguiré cada vez que solicites una actualización de los estatus de pólizas.

## 📋 Requisitos Previos
1. El usuario debe abrir el portal de **Línea Monterrey** en una pestaña del navegador con el puerto 9222 activo (o correr `node lanzar_navegador.js`).
2. Iniciar sesión y navegar a cualquier página del portal.
3. Confirmar a la IA: "Ya está logueado".

## 🚀 Pasos de Ejecución

### 1. Actualización de Asesores ACTIVOS
- **Extracción**: `node descargar_polizas.js`
- **Consolidación y Comparativo**: `node consolidar_polizas.js`
    - Esto genera el reporte del día y detecta cambios (Nuevas, Anuladas, Cambios de Ramo) contra el día anterior.

### 2. Actualización de Asesores INACTIVOS
- **Extracción**: `node descargar_polizas.js --inactivos`
    - **Nota**: El script ahora re-selecciona "Inactivos" para cada asesor para evitar reseteos de sesión.
- **Consolidación y Comparativo**: `node consolidar_polizas.js --inactivos`
    - Genera `reporte_YYYY-MM-DD_inactivos.json` y su versión `_summary.json`.

### 3. Validación en Dashboard
- Entrar a **Estatus de Pólizas** en localhost:3000.
- Alternar entre las pestañas **Activos** y **Inactivos**.
- Verificar que las fechas mostradas sean las de hoy y que los totales coincidan con los logs de los scripts.

## 🛑 Reglas de Oro
- **No retroceder totales**: El historial es acumulativo.
- **Limpieza**: Los archivos XLS temporales se mueven a `respaldo_previo` automáticamente para asegurar una descarga limpia cada día.
- **Multi-Ramo**: Los scripts capturan Vida, GMM, AP, etc., sin necesidad de filtros manuales.

---
// turbo-all

