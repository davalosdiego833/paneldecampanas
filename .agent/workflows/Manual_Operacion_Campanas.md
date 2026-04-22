# Manual de Operación: Procesamiento de Campañas y Administración (Cerebro Autónomo)

Este documento contiene las reglas de negocio inmutables para la actualización de datos del panel. Cualquier agente o proceso de automatización **debe** consultar este manual antes de modificar la lógica de extracción.

## 1. Reglas Generales de Filtrado
- **Sucursal Obligatoria:** `2043` (Matriz).
- **Filtro de Seguridad:** Todos los reportes deben filtrar por la columna de Sucursal para mostrar exclusivamente la información de la promotoria 2043.

## 2. Orígenes y Hojas de Datos

### A. Pagado y Pendiente
- **Archivo:** `administrador/pagado_emitidido/pagado_emitido.xlsx`
- **Pestaña:** Primera pestaña.
- **Rango:** Datos comienzan en la fila 4 (índice 3).
- **Columnas Clave:** 
  - `Col 1`: Sucursal (ID 2043).
  - `Col 2`: Nombre Asesor.

### B. Asesores sin Emisión
- **Archivo:** `administrador/asesores_sin_emision/Asesores sin Emision.xls`
- **Pestaña Resumen:** `Promotores` (Filtrar por Col A o Col D = 2043).
- **Pestaña Detalle:** `Asesores` (Filtrar por Col C o Col D = 2043).
- **Fecha de Corte:** Extraer de la celda `A2` de la pestaña `Direccion`.

### C. Proactivos
- **Archivo:** `administrador/proactivos/Proactivos.xlsx`
- **Pestaña:** `Detalle Asesores`.
- **Rango:** Datos comienzan en la fila 5 (índice 4).
- **Filtro:** Columna 2 o 3 = 2043.

### D. Comparativo de Vida
- **Archivo:** `administrador/comparativo_vida/comparativo vida.xlsx`
- **Pestaña Resumen:** `promotoria`.
- **Pestaña Detalle:** `asesores`.
- **Filtro Asesores:** Columna 3 o 4 = 2043.

## 3. Extracción de Fechas de Corte
- El sistema debe buscar en las primeras 5 filas de las primeras 3 hojas.
- Debe aceptar tanto números de fecha Excel (rango 45000-47000) como strings con formato "DD de MES de YYYY".

## 4. Infraestructura Blindada (Hostinger)
- **Ejecución:** El servidor corre desde `public_html/app.js`.
- **Datos Seguros:** Todas las rutas de datos deben resolverse hacia `../nodejs/` o `../db/` para evitar la volatilidad de `public_html`.
- **Snapshot:** El archivo `db/resumen_snapshot.json` es la fuente de verdad absoluta para la carga instantánea.
