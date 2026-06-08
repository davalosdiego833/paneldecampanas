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

        if 'Res_lp' not in wb.sheet_names():
            print("[PROCESS] Error: No se encontró la hoja Res_lp.")
            os.remove(decrypted_path)
            return False
            
        ws = wb.sheet_by_name('Res_lp')
        
        # Obtener cabeceras
        headers = [ws.cell_value(0, j) for j in range(ws.ncols)]
        
        idx_ramo = headers.index('OPERACION')
        idx_divta = headers.index('DIVTA')
        idx_geren = headers.index('GEREN')
        idx_matriz = headers.index('MATRIZ')
        idx_name = headers.index('NOMAGTE')
        idx_clave = headers.index('NUM_AGTE')
        
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
            ramo = str(row[idx_ramo]).strip()
            divta = str(row[idx_divta]).strip()
            geren = str(row[idx_geren]).strip()
            
            # MATRIZ y SUCURSAL (Columna 25)
            matriz_val = row[idx_matriz]
            if isinstance(matriz_val, float):
                matriz = str(int(matriz_val)).strip()
            else:
                matriz = str(matriz_val).strip()
                
            suc_val = row[25]
            if isinstance(suc_val, float):
                sucursal = str(int(suc_val)).strip()
            else:
                sucursal = str(suc_val).strip()
                
            # Aplicar filtros
            if ramo == 'VIDA' and divta == 'DOP' and geren == 'GUADALAJARA (A. RODRIGUEZ)' and matriz == '2043':
                # Validar que la sucursal sea de la promotoría
                if sucursal in PROMO_SUCURSALES:
                    # Extraer clave
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
        
        # 3. Construir el archivo Excel final usando openpyxl directamente (sin pandas/numpy)
        wb_new = openpyxl.Workbook()
        ws_new = wb_new.active
        
        # 3 filas vacías al inicio para cumplir con data.slice(3) en el backend.
        # Ponemos la fecha de corte en A1 para que actualizar_snapshot y el server la puedan leer.
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
            
        # Rutas destino
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        
        dest_dir1 = os.path.join(base_dir, 'administrador', 'pagado_emitido')
        dest_dir2 = os.path.join(base_dir, 'administrador', 'pagado_emitidido')
        
        os.makedirs(dest_dir1, exist_ok=True)
        os.makedirs(dest_dir2, exist_ok=True)
        
        path1 = os.path.join(dest_dir1, 'pagado_emitido.xlsx')
        path2 = os.path.join(dest_dir2, 'pagado_emitido.xlsx')
        
        # Guardar en ambas carpetas
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
