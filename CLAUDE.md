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
   118069, 118246, 47116, 80122, 87538, 90355, 94156, --promotoria`) y luego
   `sincronizar_premios.sh` (publica los datos al sitio real vía rsync/ssh).

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
- `educar_es_creer` y `poder_elegirte` — **NO se archivan** (Diego no tiene
  carpeta para esas todavía; decisión explícita, no un olvido).

## Proyecto hermano

`/Users/diego/Desktop/ESTATUS DE POLIZAS` — mismo patrón (login automático +
captcha manual), pero para el reporte de cambios de estatus de pólizas, con
su propio `CLAUDE.md`/`README.md`. Comparten credenciales en el Llavero.
