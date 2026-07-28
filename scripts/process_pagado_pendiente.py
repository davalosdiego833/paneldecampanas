import sys
import os
import msoffcrypto
import xlrd
import openpyxl
import re

def process_file(xls_path):
    print(f"[PROCESS] Recibido archivo para procesar: {xls_path}")
    if not os.path.exists(xls_path):
        print(f"[PROCESS] Error: El archivo no existe en {xls_path}")
        return False
        
    decrypted_path = xls_path.replace(".xls", "_decrypted_temp.xls")
    
    # 1. Desencriptar usando VelvetSweatshop
    print("[PROCESS] Desencriptando PagPend.xls...")
    try:
        with open(xls_path, "rb") as f:
            office_file = msoffcrypto.OfficeFile(f)
            office_file.load_key(password="VelvetSweatshop")
            with open(decrypted_path, "wb") as f_dec:
                office_file.decrypt(f_dec)
        print("[PROCESS] Desencriptación exitosa.")
    except Exception as e:
        print(f"[PROCESS] Error al desencriptar: {e}")
        if os.path.exists(decrypted_path):
            os.remove(decrypted_path)
        return False
        
    # 2. Leer con xlrd y filtrar
    print("[PROCESS] Leyendo y filtrando datos...")
    try:
        wb = xlrd.open_workbook(decrypted_path)
        
        # Extraer fecha de corte desde la hoja Resumen
        cutoff_date_str = ""
        if 'Resumen' in wb.sheet_names():
            res_sheet = wb.sheet_by_name('Resumen')
            for r in range(min(50, res_sheet.nrows)):
                for c in range(res_sheet.ncols):
                    val = res_sheet.cell_value(r, c)
                    if val:
                        val_str = str(val).strip()
                        if re.search(r'(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)', val_str, re.IGNORECASE):
                            match = re.search(r'([a-zA-ZáéíóúñÁÉÍÓÚÑ]+),?\s+(\d{1,2}),?\s+(\d{4})', val_str)
                            if match:
                                month = match.group(1).lower()
                                day = int(match.group(2))
                                year = match.group(3)
                                cutoff_date_str = f"{day} de {month} de {year}"
                                break
                if cutoff_date_str:
                    break
        print(f"[PROCESS] Fecha de corte extraída: {cutoff_date_str}")

        # Detectar si es un archivo de Reclutas
        is_reclutas = 'Res_lp_rt' in wb.sheet_names() or 'recluta' in xls_path.lower() or 'reclutas' in xls_path.lower()
        sheet_name = 'Res_lp_rt' if ('Res_lp_rt' in wb.sheet_names()) else 'Res_lp'

        if sheet_name not in wb.sheet_names():
            print(f"[PROCESS] Error: No se encontró la hoja {sheet_name}.")
            os.remove(decrypted_path)
            return False

        ws = wb.sheet_by_name(sheet_name)
        print(f"[PROCESS] Leyendo de la hoja: {sheet_name} (Es Reclutas: {is_reclutas})")

        # Obtener cabeceras
        headers = [ws.cell_value(0, j) for j in range(ws.ncols)]

        idx_matriz = headers.index('MATRIZ') if 'MATRIZ' in headers else 6
        idx_name = headers.index('NOMAGTE') if 'NOMAGTE' in headers else 8
        idx_clave = headers.index('NUM_AGTE') if 'NUM_AGTE' in headers else 7

        # Columnas de datos de pólizas y prima
        idx_pol_pag = headers.index('POLPAG')
        idx_pri_pag_ini = headers.index('PRIPAGINI')
        idx_pri_pag_ord = headers.index('PRIPAGORD')
        idx_prim_pag = headers.index('PRIMPAG')

        idx_pol_pen = headers.index('POLPEN')
        idx_pri_pen_ini = headers.index('PRIPENINI')
        idx_pri_pen_ord = headers.index('PRIPENORD')
        idx_prim_pen = headers.index('PRIMPEN')

        # Filtros de la promotoría
        PROMO_SUCURSALES = ['2043', '2856', '2511']

        filtered_rows = []
        for i in range(1, ws.nrows):
            row = [ws.cell_value(i, j) for j in range(ws.ncols)]

            matriz_val = row[idx_matriz]
            matriz = str(int(matriz_val)).strip() if isinstance(matriz_val, float) else str(matriz_val).strip()

            if is_reclutas:
                # En Reclutas, filtramos por las sucursales de la promotoría (2043, 2856, 2511)
                if matriz in PROMO_SUCURSALES:
                    clave_val = row[idx_clave]
                    clave = str(int(clave_val)) if isinstance(clave_val, float) else str(clave_val).strip()
                    filtered_rows.append({
                        'Clave': clave,
                        'Sucursal': matriz,
                        'Nombre Asesor': row[idx_name],
                        'Dummy1': '',
                        'Dummy2': '',
                        'POLPAG': float(row[idx_pol_pag] or 0),
                        'PRIPAGINI': float(row[idx_pri_pag_ini] or 0),
                        'PRIPAGORD': float(row[idx_pri_pag_ord] or 0),
                        'PRIMPAG': float(row[idx_prim_pag] or 0),
                        'POLPEN': float(row[idx_pol_pen] or 0),
                        'PRIPENINI': float(row[idx_pri_pen_ini] or 0),
                        'PRIPENORD': float(row[idx_pri_pen_ord] or 0),
                        'PRIMPEN': float(row[idx_prim_pen] or 0),
                    })
            else:
                idx_ramo = headers.index('OPERACION')
                idx_divta = headers.index('DIVTA')
                idx_geren = headers.index('GEREN')
                ramo = str(row[idx_ramo]).strip()
                divta = str(row[idx_divta]).strip()
                geren = str(row[idx_geren]).strip()

                suc_val = row[25]
                sucursal = str(int(suc_val)).strip() if isinstance(suc_val, float) else str(suc_val).strip()

                if ramo == 'VIDA' and divta == 'DOP' and geren == 'GUADALAJARA (A. RODRIGUEZ)' and matriz == '2043':
                    if sucursal in PROMO_SUCURSALES:
                        clave_val = row[idx_clave]
                        clave = str(int(clave_val)) if isinstance(clave_val, float) else str(clave_val).strip()
                        filtered_rows.append({
                            'Clave': clave,
                            'Sucursal': sucursal,
                            'Nombre Asesor': row[idx_name],
                            'Dummy1': '',
                            'Dummy2': '',
                            'POLPAG': float(row[idx_pol_pag] or 0),
                            'PRIPAGINI': float(row[idx_pri_pag_ini] or 0),
                            'PRIPAGORD': float(row[idx_pri_pag_ord] or 0),
                            'PRIMPAG': float(row[idx_prim_pag] or 0),
                            'POLPEN': float(row[idx_pol_pen] or 0),
                            'PRIPENINI': float(row[idx_pri_pen_ini] or 0),
                            'PRIPENORD': float(row[idx_pri_pen_ord] or 0),
                            'PRIMPEN': float(row[idx_prim_pen] or 0),
                        })

        print(f"[PROCESS] Filtrado completado. {len(filtered_rows)} registros de la promotoría encontrados.")

        # 3. Construir el archivo Excel final usando openpyxl directamente
        wb_new = openpyxl.Workbook()
        ws_new = wb_new.active

        ws_new.append([cutoff_date_str] + [''] * 12)
        ws_new.append([''] * 13)
        ws_new.append([''] * 13)

        for row in filtered_rows:
            ws_new.append([
                row['Clave'],
                row['Sucursal'],
                row['Nombre Asesor'],
                row['Dummy1'],
                row['Dummy2'],
                row['POLPAG'],
                row['PRIPAGINI'],
                row['PRIPAGORD'],
                row['PRIMPAG'],
                row['POLPEN'],
                row['PRIPENINI'],
                row['PRIPENORD'],
                row['PRIMPEN']
            ])

        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        dest_dir1 = os.path.join(base_dir, 'administrador', 'pagado_emitido')
        dest_dir2 = os.path.join(base_dir, 'administrador', 'pagado_emitidido')

        os.makedirs(dest_dir1, exist_ok=True)
        os.makedirs(dest_dir2, exist_ok=True)

        output_filename = 'pagado_emitido_reclutas.xlsx' if is_reclutas else 'pagado_emitido.xlsx'
        path1 = os.path.join(dest_dir1, output_filename)
        path2 = os.path.join(dest_dir2, output_filename)

        wb_new.save(path1)
        wb_new.save(path2)

        print(f"[PROCESS] Guardado exitosamente en:\n  - {path1}\n  - {path2}")
        return True

    except Exception as e:
        print(f"[PROCESS] Error al procesar datos: {e}")
        return False
    finally:
        if os.path.exists(decrypted_path):
            os.remove(decrypted_path)

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Uso: python process_pagado_pendiente.py <ruta_a_PagPend.xls>")
        sys.exit(1)
    
    success = process_file(sys.argv[1])
    sys.exit(0 if success else 1)
