import xlrd

file_path = '/Users/diego/Desktop/panel de campañas/administrador/pagado_emitido/PagPend_decrypted.xls'
wb = xlrd.open_workbook(file_path)

ws = wb.sheet_by_name('Res_lp')
print(f"Sheet: Res_lp, Rows: {ws.nrows}, Cols: {ws.ncols}")

# Print the first few rows (headers and samples)
for i in range(min(15, ws.nrows)):
    row = [ws.cell_value(i, j) for j in range(ws.ncols)]
    print(f"Row {i:2d}: {[str(x) for x in row]}")
