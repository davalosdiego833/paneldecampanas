#!/usr/bin/env python3
"""
Script de Comparación de Reportes de Pólizas
=============================================
Compara dos reportes JSON de diferentes días y genera un resumen
de cambios en estatus por asesor.

Uso:
    python3 comparar_reportes.py reporte_anterior.json reporte_nuevo.json
"""

import json
import sys
import os
from datetime import datetime


def cargar_reporte(ruta):
    """Carga un reporte JSON."""
    with open(ruta, 'r', encoding='utf-8') as f:
        return json.load(f)


def comparar_conteos(anterior, nuevo):
    """
    Compara los conteos de estatus entre dos reportes.
    Retorna un diccionario con los cambios por asesor.
    """
    cambios = {
        'resumen': {
            'fecha_anterior': anterior.get('fecha_reporte', 'desconocida'),
            'fecha_nuevo': nuevo.get('fecha_reporte', 'desconocida'),
            'total_anterior': anterior['resumen_general']['total_polizas'],
            'total_nuevo': nuevo['resumen_general']['total_polizas'],
            'diferencia_total': nuevo['resumen_general']['total_polizas'] - anterior['resumen_general']['total_polizas'],
            'cambios_estatus_general': {},
            'total_asesores_con_cambios': 0,
        },
        'asesores_con_cambios': [],
        'asesores_sin_cambios': [],
        'asesores_nuevos': [],
        'asesores_eliminados': [],
    }

    # Comparar estatus generales
    for estatus in ['En Vigor', 'Anulada', 'Vigor Prorrogado', 'En Vigor sin Pago de Primas']:
        ant_val = anterior['resumen_general']['por_estatus'].get(estatus, 0)
        nue_val = nuevo['resumen_general']['por_estatus'].get(estatus, 0)
        diff = nue_val - ant_val
        cambios['resumen']['cambios_estatus_general'][estatus] = {
            'anterior': ant_val,
            'nuevo': nue_val,
            'diferencia': diff,
            'emoji': '🔴' if (estatus == 'En Vigor' and diff < 0) or (estatus == 'Anulada' and diff > 0) else '🟢' if diff != 0 else '⚪'
        }

    # Crear mapas por clave
    mapa_anterior = {a['clave']: a for a in anterior.get('asesores', [])}
    mapa_nuevo = {a['clave']: a for a in nuevo.get('asesores', [])}

    todas_claves = set(mapa_anterior.keys()) | set(mapa_nuevo.keys())

    for clave in sorted(todas_claves):
        if clave not in mapa_anterior:
            cambios['asesores_nuevos'].append(mapa_nuevo[clave])
            continue
        if clave not in mapa_nuevo:
            cambios['asesores_eliminados'].append(mapa_anterior[clave])
            continue

        ant = mapa_anterior[clave]
        nue = mapa_nuevo[clave]

        cambio_asesor = {
            'clave': clave,
            'nombre': nue['nombre'],
            'total_anterior': ant['total_polizas'],
            'total_nuevo': nue['total_polizas'],
            'diferencia_total': nue['total_polizas'] - ant['total_polizas'],
            'cambios_estatus': {}
        }

        tiene_cambios = False
        for estatus in ['En Vigor', 'Anulada', 'Vigor Prorrogado', 'En Vigor sin Pago de Primas']:
            ant_val = ant.get('estatus', {}).get(estatus, 0)
            nue_val = nue.get('estatus', {}).get(estatus, 0)
            diff = nue_val - ant_val

            if diff != 0:
                tiene_cambios = True
                cambio_asesor['cambios_estatus'][estatus] = {
                    'anterior': ant_val,
                    'nuevo': nue_val,
                    'diferencia': diff
                }

        if tiene_cambios:
            cambios['asesores_con_cambios'].append(cambio_asesor)
        else:
            cambios['asesores_sin_cambios'].append({
                'clave': clave,
                'nombre': nue['nombre'],
                'total': nue['total_polizas']
            })

    cambios['resumen']['total_asesores_con_cambios'] = len(cambios['asesores_con_cambios'])

    return cambios


def comparar_polizas_detalle(anterior_data, nuevo_data):
    """
    Compara pólizas a nivel individual usando archivos de datos crudos.
    Detecta:
    - Pólizas que cambiaron de estatus
    - Pólizas nuevas
    - Pólizas que desaparecieron
    
    Los archivos deben tener estructura:
    {
        "fecha_extraccion": "YYYY-MM-DD",
        "asesores": [
            {
                "clave": "XXXXX",
                "nombre": "...",
                "polizas": [
                    {"poliza": "...", "estatus": "...", ...}
                ]
            }
        ]
    }
    """
    cambios_detalle = {
        'polizas_cambiaron_estatus': [],
        'polizas_nuevas': [],
        'polizas_desaparecidas': [],
    }

    # Crear mapa global: poliza -> {estatus, asesor_clave, asesor_nombre}
    def crear_mapa(data):
        mapa = {}
        for asesor in data.get('asesores', []):
            for pol in asesor.get('polizas', []):
                mapa[pol['poliza']] = {
                    'estatus': pol['estatus'],
                    'contratante': pol.get('contratante', ''),
                    'asegurado': pol.get('asegurado', ''),
                    'producto': pol.get('producto', ''),
                    'asesor_clave': asesor['clave'],
                    'asesor_nombre': asesor['nombre']
                }
        return mapa

    mapa_ant = crear_mapa(anterior_data)
    mapa_nue = crear_mapa(nuevo_data)

    # Pólizas que cambiaron de estatus
    for poliza, info_nue in mapa_nue.items():
        if poliza in mapa_ant:
            info_ant = mapa_ant[poliza]
            if info_ant['estatus'] != info_nue['estatus']:
                cambios_detalle['polizas_cambiaron_estatus'].append({
                    'poliza': poliza,
                    'asesor': info_nue['asesor_nombre'],
                    'asesor_clave': info_nue['asesor_clave'],
                    'contratante': info_nue['contratante'],
                    'estatus_anterior': info_ant['estatus'],
                    'estatus_nuevo': info_nue['estatus'],
                })
        else:
            cambios_detalle['polizas_nuevas'].append({
                'poliza': poliza,
                'asesor': info_nue['asesor_nombre'],
                'asesor_clave': info_nue['asesor_clave'],
                'contratante': info_nue['contratante'],
                'estatus': info_nue['estatus'],
            })

    # Pólizas que desaparecieron
    for poliza, info_ant in mapa_ant.items():
        if poliza not in mapa_nue:
            cambios_detalle['polizas_desaparecidas'].append({
                'poliza': poliza,
                'asesor': info_ant['asesor_nombre'],
                'asesor_clave': info_ant['asesor_clave'],
                'contratante': info_ant['contratante'],
                'ultimo_estatus': info_ant['estatus'],
            })

    return cambios_detalle


def imprimir_reporte(cambios):
    """Imprime el reporte de comparación de forma legible."""
    r = cambios['resumen']
    print("=" * 70)
    print(f"  📊 COMPARATIVA DE PÓLIZAS")
    print(f"  {r['fecha_anterior']} → {r['fecha_nuevo']}")
    print("=" * 70)
    print()

    # Resumen general
    diff_total = r['diferencia_total']
    emoji = '🟢 +' if diff_total > 0 else '🔴 ' if diff_total < 0 else '⚪ '
    print(f"  Total pólizas: {r['total_anterior']} → {r['total_nuevo']} ({emoji}{diff_total})")
    print()

    print("  Cambios por estatus:")
    for estatus, info in r['cambios_estatus_general'].items():
        if info['diferencia'] != 0:
            signo = '+' if info['diferencia'] > 0 else ''
            print(f"    {info['emoji']} {estatus}: {info['anterior']} → {info['nuevo']} ({signo}{info['diferencia']})")
    print()

    # Asesores con cambios
    if cambios['asesores_con_cambios']:
        print(f"  ⚡ ASESORES CON CAMBIOS ({len(cambios['asesores_con_cambios'])})")
        print("-" * 70)
        for a in sorted(cambios['asesores_con_cambios'], key=lambda x: abs(x['diferencia_total']), reverse=True):
            diff = a['diferencia_total']
            emoji = '🟢' if diff > 0 else '🔴' if diff < 0 else '⚪'
            signo = '+' if diff > 0 else ''
            print(f"\n  {emoji} {a['nombre']} (Clave: {a['clave']})")
            print(f"     Total: {a['total_anterior']} → {a['total_nuevo']} ({signo}{diff})")
            for est, info in a['cambios_estatus'].items():
                signo_e = '+' if info['diferencia'] > 0 else ''
                print(f"     • {est}: {info['anterior']} → {info['nuevo']} ({signo_e}{info['diferencia']})")
        print()

    # Asesores sin cambios
    sin_cambios = len(cambios['asesores_sin_cambios'])
    print(f"  ✅ ASESORES SIN CAMBIOS: {sin_cambios}")
    print()

    if cambios['asesores_nuevos']:
        print(f"  🆕 ASESORES NUEVOS: {len(cambios['asesores_nuevos'])}")
        for a in cambios['asesores_nuevos']:
            print(f"     • {a['nombre']} (Clave: {a['clave']}) - {a['total_polizas']} pólizas")
        print()

    if cambios['asesores_eliminados']:
        print(f"  ❌ ASESORES ELIMINADOS: {len(cambios['asesores_eliminados'])}")
        for a in cambios['asesores_eliminados']:
            print(f"     • {a['nombre']} (Clave: {a['clave']}) - {a['total_polizas']} pólizas")
        print()

    print("=" * 70)


def imprimir_detalle_polizas(detalle):
    """Imprime el detalle de cambios a nivel póliza."""
    print()
    print("=" * 70)
    print("  📋 DETALLE DE CAMBIOS A NIVEL PÓLIZA")
    print("=" * 70)

    if detalle['polizas_cambiaron_estatus']:
        print(f"\n  🔄 PÓLIZAS QUE CAMBIARON DE ESTATUS ({len(detalle['polizas_cambiaron_estatus'])})")
        print("-" * 70)
        for p in detalle['polizas_cambiaron_estatus']:
            print(f"  • {p['poliza']} — {p['contratante']}")
            print(f"    Asesor: {p['asesor']} ({p['asesor_clave']})")
            print(f"    {p['estatus_anterior']} → {p['estatus_nuevo']}")
            print()
    else:
        print("\n  ✅ No hubo cambios de estatus en pólizas individuales.")

    if detalle['polizas_nuevas']:
        print(f"\n  🆕 PÓLIZAS NUEVAS ({len(detalle['polizas_nuevas'])})")
        print("-" * 70)
        for p in detalle['polizas_nuevas']:
            print(f"  • {p['poliza']} — {p['contratante']}")
            print(f"    Asesor: {p['asesor']} ({p['asesor_clave']}) — Estatus: {p['estatus']}")

    if detalle['polizas_desaparecidas']:
        print(f"\n  ❌ PÓLIZAS QUE DESAPARECIERON ({len(detalle['polizas_desaparecidas'])})")
        print("-" * 70)
        for p in detalle['polizas_desaparecidas']:
            print(f"  • {p['poliza']} — {p['contratante']}")
            print(f"    Asesor: {p['asesor']} ({p['asesor_clave']}) — Último estatus: {p['ultimo_estatus']}")

    print("\n" + "=" * 70)


def main():
    if len(sys.argv) < 3:
        print("Uso: python3 comparar_reportes.py <reporte_anterior.json> <reporte_nuevo.json>")
        print("     python3 comparar_reportes.py <reporte_anterior.json> <reporte_nuevo.json> [datos_ant.json] [datos_nue.json]")
        sys.exit(1)

    ruta_anterior = sys.argv[1]
    ruta_nuevo = sys.argv[2]

    print(f"\n📂 Cargando reportes...")
    print(f"   Anterior: {ruta_anterior}")
    print(f"   Nuevo:    {ruta_nuevo}")

    anterior = cargar_reporte(ruta_anterior)
    nuevo = cargar_reporte(ruta_nuevo)

    # Comparación de conteos
    cambios = comparar_conteos(anterior, nuevo)
    imprimir_reporte(cambios)

    # Si se proporcionan archivos de datos crudos, hacer comparación detallada
    if len(sys.argv) >= 5:
        ruta_datos_ant = sys.argv[3]
        ruta_datos_nue = sys.argv[4]

        if os.path.exists(ruta_datos_ant) and os.path.exists(ruta_datos_nue):
            print(f"\n📂 Comparación detallada de pólizas...")
            datos_ant = cargar_reporte(ruta_datos_ant)
            datos_nue = cargar_reporte(ruta_datos_nue)

            detalle = comparar_polizas_detalle(datos_ant, datos_nue)
            imprimir_detalle_polizas(detalle)

    # Guardar resultados
    result_path = os.path.join(
        os.path.dirname(ruta_nuevo),
        f"comparativa_{anterior.get('fecha_reporte','ant')}_{nuevo.get('fecha_reporte','nue')}.json"
    )
    with open(result_path, 'w', encoding='utf-8') as f:
        json.dump(cambios, f, ensure_ascii=False, indent=4)
    print(f"\n💾 Comparativa guardada en: {result_path}")


if __name__ == '__main__':
    main()
