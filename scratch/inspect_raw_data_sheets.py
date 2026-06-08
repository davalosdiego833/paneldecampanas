import xlrd

file_path = '/Users/diego/Desktop/panel de campañas/administrador/pagado_emitido/PagPend_decrypted.xls'
wb = xlrd.open_workbook(file_path)

sheets = ['Res_lp', 'Apo1_lp', 'Apo2_lp', 'Apo3_lp', 'Apo4_lp', 'Apo5_lp']

for s_name in sheets:
    if s_name in wb.sheet_names():
        ws = wb.sheet_by_name(s_name)
        print(f"\n================ Sheet: {s_name} (rows: {ws.nrows}, cols: {ws.ncols}) ================")
        # Print first 5 rows to see what it is
        for i in range(min(10, ws.nrows)):
            row = [ws.cell_value(i, j) for j in range(ws.ncols)]
            print(f"Row {i:2d}: {[str(x)[:30] for x in row[:15]]}")
