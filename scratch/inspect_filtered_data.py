import xlrd

file_path = '/Users/diego/Desktop/panel de campañas/administrador/pagado_emitido/PagPend_decrypted.xls'
wb = xlrd.open_workbook(file_path)
ws = wb.sheet_by_name('Res_lp')

headers = [ws.cell_value(0, j) for j in range(ws.ncols)]
print("Headers:", headers)

# Find column indices
idx_ramo = headers.index('OPERACION')
idx_divta = headers.index('DIVTA')
idx_geren = headers.index('GEREN')
idx_matriz = headers.index('MATRIZ')
idx_name = headers.index('NOMAGTE')
idx_clave = headers.index('NUM_AGTE')

matching_rows = []
for i in range(1, ws.nrows):
    row = [ws.cell_value(i, j) for j in range(ws.ncols)]
    ramo = str(row[idx_ramo]).strip()
    divta = str(row[idx_divta]).strip()
    geren = str(row[idx_geren]).strip()
    
    # MATRIZ could be a float like 2043.0 in xlrd
    matriz_val = row[idx_matriz]
    if isinstance(matriz_val, float):
        matriz = str(int(matriz_val)).strip()
    else:
        matriz = str(matriz_val).strip()
        
    if ramo == 'VIDA' and divta == 'DOP' and geren == 'GUADALAJARA (A. RODRIGUEZ)' and matriz == '2043':
        matching_rows.append({
            'line': i,
            'clave': str(int(row[idx_clave])) if isinstance(row[idx_clave], float) else str(row[idx_clave]),
            'name': row[idx_name],
            'sucursal': row[headers.index('Sucursal')] if 'Sucursal' in headers else 'N/A',
            'pol_pag': row[headers.index('POLPAG')],
            'pri_pag_ini': row[headers.index('PRIPAGINI')],
            'pri_pag_ord': row[headers.index('PRIPAGORD')],
            'prim_pag': row[headers.index('PRIMPAG')],
            'pol_pen': row[headers.index('POLPEN')],
            'pri_pen_ini': row[headers.index('PRIPENINI')],
            'pri_pen_ord': row[headers.index('PRIPENORD')],
            'prim_pen': row[headers.index('PRIMPEN')],
        })

print(f"\nTotal matching rows: {len(matching_rows)}")
print("First 20 matching rows:")
for r in matching_rows[:20]:
    print(r)
