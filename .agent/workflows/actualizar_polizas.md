---
description: Proceso Diario de Actualización de Estatus de Pólizas (Manual de Operación)
---

# 🛡️ Manual de Operación: Actualización Diaria de Estatus de Pólizas

Este manual define el procedimiento estándar para actualizar diariamente el estatus de las pólizas en el **Panel Ambriz Asesores**, con la nueva tecnología de **paginación ilimitada multi-página** y **reportes ejecutivos PDF**.

---

## 📋 Requisitos Previos

1. Tener el navegador Chrome en el puerto 9222 abierto en la sesión de **Línea Monterrey** (sección **Consulta de pólizas**).
2. Confirmar a la IA: *"Listo, ya está logueado en la sección de consulta de pólizas"*.

---

## 🚀 Pasos de Ejecución Operativa

### 1. Barrido de Asesores ACTIVOS (Paginación Ilimitada)
- **Descarga Inteligente**: `node descargar_polizas.js`
  - *Función*: Recorre automáticamente todas las páginas (1 a 100+) detectando los botones `...` y `>` de ASP.NET GridView.
  - *Garantía*: Elimina falsas cancelaciones o deserciones por corte de página.
- **Consolidación y Comparativo**: `node consolidar_polizas.js`
  - Compara la foto completa de hoy contra el historial para detectar:
    - 🟢 **Pólizas Nuevas (Emisiones)**.
    - 🔴 **Cancelaciones Reales** (`En Vigor` ➔ `Anulada` / `Cancelada`).
    - 🟢 **Recuperaciones** (`Anulada` ➔ `En Vigor`).
    - ⚠️ **Desaparecidas Reales** (Pólizas que Seguros Monterrey borró del portal).

### 2. Barrido de Asesores INACTIVOS
- **Descarga**: `node descargar_polizas.js --inactivos`
- **Consolidación**: `node consolidar_polizas.js --inactivos`

### 3. Sincronización y Despliegue a Producción
- **Ejecutar Despliegue**: `./deploy.sh`
  - Compila la aplicación web, respalda los datos del usuario (`comentarios_polizas.json`, `push_subscriptions.json`, etc.) y reinicia el servidor remoto en **panel.ambrizydavalos.com**.

---

## 📄 Características del Reporte PDF Ejecutivo

En el panel (**Estatus de Pólizas ➔ Comparativo**), el botón **`[ 📄 Descargar Reporte PDF de Cancelaciones ]`** genera al instante un documento con las siguientes especificaciones:

1. **Encabezado Institucional**:
   - Membrete: `AMBRIZ ASESORES - PROMOTORÍA 2043`.
   - Subtítulo: `REPORTE DE CANCELACIONES Y ANULADAS (GPS)`.
   - **Barra de Indicadores Desglosados**:
     - `Total Pólizas`: Conteo total de pólizas en el reporte.
     - `Vida (VI)`: Pólizas de Vida (que inician con `VI`).
     - `GMM (GM)`: Pólizas de Gastos Médicos (que inician con `GM`).
     - `Desaparecidas`: Pólizas borradas por la aseguradora del portal.
     - `Total Asesores`: Cantidad de asesores con cancelaciones.

2. **Tablas Agrupadas por Asesor**:
   - Bloque rojo con Nombre Completo y Clave del Asesor.
   - Tabla con columnas: `Póliza`, `Contratante / Cliente`, `Producto`, `Estatus Anterior`, `Estatus Nuevo`.

3. **Pie de Página Oficial**:
   - `Ambriz Asesores - Sistema Fortresse  |  Página X de Y`.

---

## 🛑 Reglas de Oro Operativas

1. **Estatus Real Preservado**: NUNCA se fuerza el estatus de una póliza a `En Vigor`. Cada póliza conserva exactamente la palabra con la que aparece en Línea Monterrey (`En Vigor`, `Anulada`, `Cancelada`, `Vigor Prorrogado`, `Siniestro`, `DESAPARECIDA`).
2. **Histórico Protegido**: Las interacciones y notas de seguimiento escritas en el panel por el equipo no se sobreescriben al desplegar.
3. **Comandos rápidos en chat**: Basta con decir *"Actualizar pólizas"* o utilizar `/actualizar_polizas` para iniciar el flujo completo.

---
// turbo-all
