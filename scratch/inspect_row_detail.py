import xlrd

file_path = '/Users/diego/Desktop/panel de campañas/administrador/pagado_emitido/PagPend_decrypted.xls'
wb = xlrd.open_workbook(file_path)
ws = wb.sheet_by_name('Res_lp')

headers = [ws.cell_value(0, j) for j in range(ws.ncols)]

# Find row for ANAIS LUA MORENO
for i in range(1, ws.nrows):
    name = ws.cell_value(i, 8)
    if 'ANAIS LUA' in name or 'LUNA LARA' in name:
        print(f"\nRow {i} - {name}:")
        for j, h in enumerate(headers):
            print(f"  {j:2d} ({h}): {ws.cell_value(i, j)}")
