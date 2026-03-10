---
description: Proceso de Actualización de Estatus de Pólizas (Manual de Operación)
---

# 🛡️ Workflow: Actualización de Estatus de Pólizas

Este manual define el proceso exacto que yo, como tu AI Partner, seguiré cada vez que solicites una actualización de los estatus de pólizas.

## 📋 Requisitos Previos
1. El usuario debe abrir el portal de **Línea Monterrey** en una pestaña del navegador.
2. Iniciar sesión y navegar a cualquier página del portal (esto mantiene la cookie activa).
3. Confirmar a la IA: "Ya está logueado".

## 🚀 Pasos de Ejecución

### 1. Extracción de Datos (Scraping)
- **Script**: `descargar_polizas.js`
- **Acción**: Conectarse al navegador por el puerto 9222.
- **Validación**:
    - Verificar si hay más de 100 pólizas por asesor.
    - Si hay paginación, el bot debe hacer clic en "Siguiente" y concatenar los archivos.
    - El bot debe registrar cuántos asesores procesó y cuántos faltaron.

### 2. Consolidación de Reporte
- **Script**: `consolidar_polizas.js`
- **Acción**: Leer todos los archivos `.xls` generados en `estatus polizas/reportes`.
- **Salida**: Generar un archivo JSON en `estatus polizas/reportes/YYYY-MM/reporte_YYYY-MM-DD.json`.
- **Mejora**: Crear una versión "Summary" ligera para carga rápida y una versión "Detail" para la tabla.

### 3. Generación de Comparativos
- Comparar el nuevo reporte con el último disponible en la carpeta.
- Identificar:
    - **Nuevas**: Pólizas que no estaban antes.
    - **Salidas**: Pólizas que desaparecieron.
    - **Cambios de Estatus**: De 'Pendiente' a 'Vigente', etc.

### 4. Verificación de "Ojo de Dios"
- Asegurarse de que los totales mostrados en el Dashboard Administrativo coincidan exactamente con la suma de los reportes individuales.

## 🛑 Reglas de Oro
- **No retroceder totales**: El historial de pólizas es acumulativo. No eliminamos registros, solo actualizamos su estatus.
- **Regla de los 3 Segundos**: La información crítica (pólizas totales, vigentes y diferencia) debe ser visible sin scroll.
- **Blindaje**: No tocar archivos en `/administrador/` o carpetas de otras campañas durante este proceso.

---
// turbo-all
