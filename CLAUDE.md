# Panel de Campañas — Contexto para Claude

Este proyecto es una app grande (React + Express, deploy en `panel.ambrizydavalos.com`).
Esta nota cubre específicamente la **automatización del login para el Reporte de Premios**,
agregada en sesión aparte (proyecto hermano: "ESTATUS DE POLIZAS" en el Escritorio).

## Qué se agregó y por qué

- **`correr_premios_automatico.js`**: automatiza el login del Portal de Asesores
  (`asesordeseguros.com.mx`) antes de correr el flujo que ya existía
  (`descargar_premios.js` + `sincronizar_premios.sh`). No se tocó la lógica de
  descarga ni de publicación — solo se agregó el login automático al inicio.
- **`/Users/diego/Desktop/Correr Reporte Premios.command`**: ícono de doble clic
  en el Escritorio que corre todo el flujo.

## Cómo funciona el login automático

1. Lee usuario/contraseña del **Llavero de macOS** (Keychain), servicio
   `asesores-portal-smnyl`, cuenta `P2043`. **Esta credencial es compartida con
   el proyecto de pólizas** — es el mismo portal, mismo usuario.
2. Abre Chrome real (puppeteer-core, no headless) con remote debugging en el
   puerto 9223, llena usuario y contraseña solo.
3. **El captcha se lo pide al usuario por Terminal** — por política, la
   automatización nunca resuelve/completa captchas, sin excepción. Es el único
   paso manual (2-3 segundos).
4. Tras login exitoso, corre automáticamente `descargar_premios.js` con la
   lista de claves de asesores (`104750, 110453, 116876, 116883, 117440,
   118069, 118246, 47116, 80122, 87538, 90355, 94156, 119447, 118915, --promotoria`) y luego
   `sincronizar_premios.sh` (publica los datos al sitio real vía rsync/ssh).
   - **Solo algunas claves:** `node correr_premios_automatico.js 119447` procesa ÚNICAMENTE esas
     claves (sin Promotoría/Karen) con el mismo login y sincronización. Sin argumentos = flujo completo.
     Para agregar un asesor nuevo: ponerlo en `CLAVES_TODAS` del script (el nombre sale del
     `administrador/directorio_asesores.xlsx`; `119447` = Luis Antonio Salazar Espinosa y `118915` = Humberto Emmanuel Sandoval Molins, agregados 2026-10-14).
   - **Revisa primero si hay corte nuevo (agregado 2026-10-16, SIN PROBAR contra el portal real):** sin argumentos,
     tras el login corre `descargar_premios.js --solo-fecha`, que lee el "Avance Al" del dashboard de la
     Promotoría (no baja ni guarda nada) y lo compara (`lib_premios.js`) contra el corte MÁS VIEJO guardado en
     `premios/*/data.json` (asesores + PROMOTORIA + GA_KAREN). Si el portal trae uno más nuevo —o falta algún
     `data.json`— corre el trabajo completo; si no, avisa "No hay actualización" (terminal + notificación de macOS)
     y cierra Chrome sin descargar. Si el portal no da fecha válida (está actualizando) tampoco descarga (sale con código 3).
     Flags: `--forzar` (descarga todo sin revisar), `--solo-consultar` (nunca descarga), `<claves>` (solo esas, sin revisar),
     `--promotoria` (con claves: las suma; sin claves: SOLO Promotoría/Karen; nunca revisa la fecha).
     Si hay capturas con `pareceVacio` pendientes lo avisa y da el comando para reintentarlas (no las reintenta solo).
     La primera corrida real conviene hacerla con `--solo-consultar`.
   - **Reintento por asesor (2026-10-19, SIN PROBAR contra el portal real):** `descargar_premios.js` repite el recorrido
     completo de un asesor una vez si falla. Causa que se vio dos veces (corridas del 1 y del 19 de octubre; 8 de 14 la 1ª vez):
     la búsqueda encuentra la fila pero el clic en el ícono ↗ no abre la ventana del asesor (queda en `3_busqueda`).
   - **Desglose Inicial/Renovación del anticipado (`anticiposDesglosados` en cada data.json de Bono Vida):** el portal solo da el
     "Bonos Anticipados" combinado; lo reconstruimos. Cuando sube (hubo pago), a cada bono se le asigna lo que tenía PENDIENTE
     en el corte anterior (calculado − anticipado de ese bono), o sea que su anticipado queda igual a lo que el reporte calculaba
     en ese cierre (ej. Desi, septiembre: Inicial $43,122 + Renovación $79,650 = $122,772). Confirmado por Diego con la foto del
     portal. Se muestra TAL CUAL el reporte: si luego el Inicial calculado baja (bajó de grupo y se recalculó), no se maquilla nada.
   - **Promotoría en $0 NO es error:** en el corte 13-10 hojameta mismo muestra la Promotoría con Bono Vida/Subsidios $0 y
     Total $0 / $10,000 (los bonos del mes nuevo aún no se generan). Confirmado contra la captura del portal.
   - **Promotoría/Karen ya no se sobreescriben con datos vacíos:** el 2026-10-16 hojameta entregó la Promotoría con
     "Avance Al: -" y todo en 0 y el script lo guardó encima de lo bueno (y guardó la página de la Promotoría como si
     fuera la de Karen). Ahora `procesarPromotoria` espera a que cargue, y si no llega fecha de corte válida lanza
     error SIN escribir; GA_KAREN solo se escribe si el dashboard es realmente el de Karen (clave distinta de 2043).

## ⚠️ Gotcha importante: NO uses `source archivo.env` para leer credenciales

La contraseña real tiene caracteres especiales de shell (`$`, `*`). Si algún
día se necesita releer/migrar la contraseña desde un `.env`, **nunca uses
`source .env`** en bash/zsh — el `$` se interpreta como expansión de shell y
corrompe el valor silenciosamente (ya pasó una vez, costó tiempo diagnosticar).
Para (re)guardar la contraseña en el Llavero, usa esto — el usuario la escribe
directo, nunca pasa por Claude ni por un archivo:

```bash
echo -n "Escribe tu contraseña del portal: "
read -s CLAVE_TEMP
security add-generic-password -a "P2043" -s "asesores-portal-smnyl" -w "$CLAVE_TEMP" -U
unset CLAVE_TEMP
```

Para leerla desde código (sin verla nunca en el chat):
```bash
security find-generic-password -s "asesores-portal-smnyl" -w   # password
security find-generic-password -s "asesores-portal-smnyl"       # incluye "acct"=usuario en stdout
```

## ⚠️ Este proyecto vive en el Escritorio con iCloud activo

Si algún día `correr_premios_automatico.js` "no hace nada" (se queda colgado
sin ningún mensaje, sin abrir Chrome), la causa más probable es la misma que
tuvimos en el proyecto de pólizas: iCloud Drive ("Escritorio y Documentos")
se traba tratando de sincronizar `node_modules/` u otros archivos pesados
(hay un `.git/objects/pack/*.pack` de 745MB ahí también). La solución que
funcionó en pólizas fue mover el entorno pesado fuera del Escritorio — no se
ha hecho aquí todavía porque el proyecto es grande y activo; si pasa, hay que
diagnosticarlo con `ps`/`lsof` sobre el proceso colgado antes de mover nada.

## Estructura relevante

```
panel de campañas/
├── correr_premios_automatico.js   # login auto + orquesta todo lo demás
├── lanzar_navegador_premios.js    # (sin tocar) abre Chrome, login era 100% manual antes
├── descargar_premios.js           # (sin tocar) scraping de premios por clave de asesor
├── sincronizar_premios.sh         # (sin tocar) rsync a panel.ambrizydavalos.com
└── premios/                       # datos descargados, uno por clave de asesor
```

## Segunda automatización: Campañas + Reportes Admin

- **`correr_campanas_admin_automatico.js`**: mismo patrón de login automático
  (Llavero + captcha manual) que premios, pero apuntando a
  `ComoVamos/Reportesdeventas/ReportePromotor.aspx` y puerto **9222** (no 9223 —
  ese es el de premios). Después del login corre, en orden:
  1. `descargar_campanas.js` — **ya se auto-despliega solo** (detecta qué
     campañas cambiaron, publica solo esas carpetas vía `deploy_datos.sh`,
     y notifica). No hace falta hacer nada más para esa parte.
  2. `run_admin_download.js` — descarga Proactivos / Sin Emisión / Comparativo
     Vida a `administrador/*`. Este NO se auto-despliega solo, así que el
     script corre `deploy_datos.sh` después con esas 3 carpetas.
     Solo baja esos 3 (filtro por `CARPETAS_DESTINO`, 2026-10-16): con `pageSize=100` la lista de
     "Informativos" trae además filas de otras carpetas (Eureka, Legión Centurión, MENTORES MDRT...) y
     antes cada una gastaba 60 s esperando una descarga que nunca llegaba (~11 min de más).
     Si un reporte no aparece avisa "No apareció en el portal" (por si cambió de nombre).
- Ícono de doble clic: `/Users/diego/Desktop/Correr Reporte Campañas y Admin.command`
- Mismas credenciales del Llavero (`asesores-portal-smnyl`) que pólizas/premios.

## Archivo histórico mensual

`archivar_historial_mensual.js` corre al final de `correr_campanas_admin_automatico.js`.
Copia el archivo actual de cada campaña/reporte admin a la carpeta real donde
Diego ya archivaba esto a mano: **`/Users/diego/Desktop/AVANCE DE CAMPAÑAS/`**
(fuera de este proyecto, no se toca en git ni en el deploy).

⚠️ **El mes del nombre de archivo sale de la fecha de cierre REAL del reporte
(leída de `db/resumen_snapshot.json`), NUNCA de la fecha en que se corre el
script.** Cada campaña/reporte tiene su propia fecha de corte y pueden estar
en meses distintos entre sí en un mismo día (ej. corriendo en septiembre,
"Asesores sin Emisión" puede tener cierre de AGOSTO todavía). Las fechas
vienen en texto español con formato inconsistente pero siempre contienen el
nombre del mes, completo o abreviado a 3 letras ("11 de septiembre de 2026",
"27 de AGO de 2026") — `extraerMesAnio()` lo reconoce por regex, sin parsear
la fecha completa. Si una campaña no tiene fecha reconocible, **se omite**
(no se archiva con una fecha adivinada).

Llaves de fecha en el snapshot: `data.campaignDates` para las campañas
principales, `data.fechas_corte` para los reportes admin y Convenciones
Promotoría/Gerente (mismo objeto, dos secciones distintas del snapshot).

Mapeo carpeta origen → destino (nombres exactos ya acordados con Diego):
- `camino_cumbre` → `CC/<año>/<MES>.ext`
- `legion_centurion` → `LEGION/<año>/<MES>.ext`
- `graduacion` → `GRADUACION/<año>/<MES>.ext`
- `mdrt` → `MDRT/<año>/<MES>.ext`
- `convenciones` (separa por nombre de archivo: contiene "promotor" o no; cada
  una usa SU PROPIA fecha de cierre — `campaignDates.convenciones` para
  Asesores, `campaignDates.convenciones_promotores` para Promotoría) →
  `CONVENCIONES/<año>/<temporada Jul-Jun, ej. 2026-2027>/ASESORES|PROMO/<MES>.ext`
- `administrador/proactivos` → `PROMO/proactivos/<año>/<MES>.ext`
- `administrador/asesores_sin_emision` → `PROMO/asesores sin emision/<año>/<MES>.ext`
- `administrador/comparativo_vida` → `PROMO/comparativo vida/<año>/<MES>.ext`
- `administrador/pagado_emitido` → `PROMO/PAG & EMI/<año>/<MES>.ext` — usa
  específicamente `PagPend.xls` (el crudo; confirmado con Diego, NO el
  procesado `pagado_emitido.xlsx` que también vive en esa carpeta).
- `administrador/QsQ Vida` → `PROMO/QsQ asesores/<año>/<MES>.ext`
- `administrador/QsQ GMM` → `PROMO/QSQ GMM/<año>/<MES>.ext`
- `poder_elegirte` y `pagado_pendiente_reclutas` — **NO se archivan** (decisión explícita, no un olvido).
- **Educar es Creer: ELIMINADA el 2026-10-21** (la campaña terminó). Se quitó de descargas, snapshot, selector y dashboard,
  y se borró la carpeta `educar_es_creer/` (sigue en el historial de git). Quedan solo las tarjetas/PDF informativos de bases.

## Quién es Quién (agregado 2026-09-18, SIN PROBAR contra el portal real)

`descargar_campanas.js` ahora incluye `'Quién es quién'` en `CARPETAS_PORTAL`
y 2 reglas nuevas (`qsq.*vida`, `qsq.*gmm`) que renombran a exactamente lo que
`actualizar_snapshot.js` ya esperaba leer desde antes (`QsQ Asesores Vida.xlsm`,
`QsQ GMM.xlsx`) — ese código de lectura ya existía, solo faltaba la descarga.
**Ojo:** no se pudo verificar el nombre exacto de la carpeta "Quién es quién"
ni de los archivos contra el portal real (necesita sesión logueada). En la
próxima corrida real, revisar el log — si dice que no encontró la carpeta o
que hay archivos en "sin regla / ignorados", hay que ajustar el texto exacto
o el regex.

**Notificaciones**: `qsq_vida` y `qsq_gmm` SÍ están en `ADMIN_REPORT_NAMES`
(grupo `admin`) — notifican cuando cambian. `ranking_promotores` deliberadamente
NO está en ninguna lista de notificación (ni CAMPAIGN_NAMES ni ADMIN_REPORT_NAMES)
porque todavía no tiene apartado en el panel — decisión explícita de Diego.

## Ranking Promotores (agregado 2026-09-18, SIN PROBAR contra el portal real)

Confirmado por Diego: vive en la misma página "Reporte Promotor" que QsQ, así
que ya está en `CARPETAS_PORTAL` (mismo folder "Quién es quién" en el portal)
con una regla nueva. A diferencia de QsQ, no había código previo que lo leyera
para nada — así que en `actualizar_snapshot.js` solo se agregó un bloque
AISLADO y mínimo que extrae la fecha de corte (para poder archivarlo por mes)
sin tocar `rg`/dashboards del panel — Ranking Promotores NO aparece en
ninguna vista del sitio, solo se descarga y se archiva. Si en el futuro se
quiere mostrar en el panel, es un trabajo aparte (parsear columnas reales del
archivo, que no se ha visto todavía).

## Tercera automatización: solo Pagado / Pendiente (agregado 2026-10-09)

Consulta ÚNICAMENTE el reporte Pagado y Emitido (PagPend + PagPendReclutas, carpeta
"Pagado Pendiente" del portal) sin correr toda la rutina de campañas/admin.
- **`correr_pagado_automatico.js`** + ícono `/Users/diego/Desktop/Correr Reporte Pagado y Emitido.command`.
  Mismo login (Llavero + captcha manual, puerto 9222; si el Chrome ya traía sesión vigente ni pide captcha).
- Descarga a `tmp_pagado/`, lee la fecha de corte SIN escribir nada
  (`scripts/process_pagado_pendiente.py --solo-fecha`, desencripta con VelvetSweatshop) y la compara
  contra `fechas_corte` del snapshot. Avisa en terminal **y** con notificación de macOS si hay novedad o no.
- Si hay novedad: respalda estado → copia archivos → `actualizar_snapshot.js` (silencioso) →
  `deploy_datos.sh administrador/pagado_emitido` con reintentos → `actualizar_snapshot.js --notify` →
  **verifica contra `/api/comunicados/history` que el aviso sí llegó** → archiva (`archivar_historial_mensual.js --solo=pagado_emitido`).
  Si la publicación falla, regresa TODO a como estaba (no deja datos locales sin publicar ni avisos perdidos).
  Si los datos se publican pero el aviso no llega, deja listo el estado para reenviarlo con `node actualizar_snapshot.js --notify`.
- Si el portal trae un corte MÁS VIEJO que la app, no lo aplica. No hace commit ni push a git (igual que las otras).
- Flags: `--solo-consultar` (nunca cambia ni publica nada) y `--desde-carpeta=/ruta` (usa archivos ya
  descargados a mano, sin portal ni captcha). Códigos de salida: 0 ok, 1 error/revertido, 2 servidor caído,
  3 archivo no encontrado/ilegible, 4 publicado pero el aviso no llegó, 5 todo bien pero el archivado mensual falló.
  El archivado tiene tope de 2 min (el 2026-10-20 se trabó 28 min copiando a `AVANCE DE CAMPAÑAS`, que está en iCloud, y dejó
  `OCTUBRE.xls` en 0 bytes); `archivar_historial_mensual.js` ahora copia a `.parcial` y renombra para no vaciar el destino.
  `actualizar_snapshot.js` reconstruye TODO el snapshot (campañas incluidas, ~97 MB de Excel, ~90-100 s por corrida), así que este
  script usa su **modo rápido `--solo-pagado`** (2026-10-20): reutiliza todo lo ya calculado en `db/resumen_snapshot.json` y solo recalcula
  Pagado/Pendiente (+ Reclutas) — 0 s. Probado: rápido == completo == snapshot publicado, campo por campo. Si no hay un snapshot completo
  previo cae solo a la reconstrucción completa. Se puede usar a mano: `node actualizar_snapshot.js --solo-pagado [--notify]`.

## ⚠️ iCloud también "evicta" node_modules (visto 2026-10-20)

`node_modules/xlsx/dist/cpexcel.js` quedó `compressed,dataless` (movido a la nube) y entonces `XLSX.readFile` de cualquier `.xls` viejo
(p. ej. `Asesores sin Emision.xls`) falla con `Cannot read properties of undefined (reading 'decode')`; `actualizar_snapshot.js` captura el error
("⚠️ Asesores sin emisión skip") y **publica el snapshot SIN esa sección**. Diagnóstico: `ls -laTO node_modules/xlsx/dist/cpexcel.js` (si dice `dataless`)
y arreglo inmediato: `brctl download "$PWD/node_modules/xlsx/dist/cpexcel.js"`. Había ~19,500 archivos dataless en `node_modules`. Antes de una
reconstrucción completa conviene revisar que `Asesores sin Emisión` salga en el snapshot (o usar la corrida solo-Pagado, que no relee esos Excel).
- Funciones puras (fechas, respaldo/restauración, verificación de avisos) en `lib_pagado.js`.

⚠️ Probado: lectura de fecha, comparación (nuevo/igual/más viejo/ilegible), respaldo-restauración, modos
`--solo-consultar` y `--desde-carpeta`. **No** se ha corrido aún contra el portal real ni con una publicación real:
la primera corrida real conviene hacerla con `--solo-consultar`.

## Trampa de avisos (aprendida 2026-09/10)

`actualizar_snapshot.js` decide avisar comparando contra `db/resumen_snapshot_prev.json`, que se reescribe en
CADA corrida. `descargar_campanas.js` corre primero silencioso y luego `--notify` tras desplegar; si el
despliegue falla (servidor caído) se aborta antes del `--notify` y la comparación se pierde: los datos quedan
locales y el aviso nunca sale. Además `sendPush` no reporta si el POST al servidor falló. Siempre verificar
contra `https://panel.ambrizydavalos.com/api/comunicados/history`, no contra `db/notified_dates.json`.
El Buzón de Avisos del perfil Asesor oculta por diseño los avisos de grupo `admin`.

## Proyecto hermano

`/Users/diego/Desktop/ESTATUS DE POLIZAS` — mismo patrón (login automático +
captcha manual), pero para el reporte de cambios de estatus de pólizas, con
su propio `CLAUDE.md`/`README.md`. Comparten credenciales en el Llavero.
