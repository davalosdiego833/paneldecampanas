import xlrd

file_path = '/Users/diego/Desktop/panel de campañas/administrador/pagado_emitido/PagPend_decrypted.xls'
wb = xlrd.open_workbook(file_path)
ws = wb.sheet_by_name('Res_lp')

headers = [ws.cell_value(0, j) for j in range(ws.ncols)]
idx_ramo = headers.index('OPERACION')
idx_divta = headers.index('DIVTA')
idx_geren = headers.index('GEREN')
idx_matriz = headers.index('MATRIZ')
idx_name = headers.index('NOMAGTE')
idx_clave = headers.index('NUM_AGTE')

print("Advisors filtered by Ramo=VIDA, Div=DOP, Geren=GUADALAJARA (A. RODRIGUEZ), Matriz=2043:")
for i in range(1, ws.nrows):
    row = [ws.cell_value(i, j) for j in range(ws.ncols)]
    ramo = str(row[idx_ramo]).strip()
    divta = str(row[idx_divta]).strip()
    geren = str(row[idx_geren]).strip()
    
    matriz_val = row[idx_matriz]
    if isinstance(matriz_val, float):
        matriz = str(int(matriz_val)).strip()
    else:
        matriz = str(matriz_val).strip()
        
    if ramo == 'VIDA' and divta == 'DOP' and geren == 'GUADALAJARA (A. RODRIGUEZ)' and matriz == '2043':
        suc_val = row[25]
        if isinstance(suc_val, float):
            suc = str(int(suc_val))
        else:
            suc = str(suc_val)
        print(f"Name: {row[idx_name]:35s} | Clave: {int(row[idx_clave])} | Column 25 (Sucursal): {suc} | PolPag: {row[12]}")
