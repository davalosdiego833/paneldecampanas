import xlrd

file_path = '/Users/diego/Desktop/panel de campañas/administrador/pagado_emitido/PagPend_decrypted.xls'
wb = xlrd.open_workbook(file_path)

# 1. Print first 20 rows of 'Listas' sheet to understand mappings
if 'Listas' in wb.sheet_names():
    ws = wb.sheet_by_name('Listas')
    print("\n--- Sheet: Listas ---")
    for i in range(min(50, ws.nrows)):
        row = [ws.cell_value(i, j) for j in range(ws.ncols)]
        if any(x != '' for x in row):
            print(f"Row {i:2d}: {[str(x)[:40] for x in row if x != '']}")

# 2. Print non-empty rows of 'Resumen' sheet starting from row 40
ws_res = wb.sheet_by_name('Resumen')
print("\n--- Sheet: Resumen (non-empty rows from 40 onwards) ---")
count = 0
for i in range(40, ws_res.nrows):
    row = [ws_res.cell_value(i, j) for j in range(ws_res.ncols)]
    # Check if there is actual advisor data (e.g. name or sucursal is present)
    if row[4] != '' or row[5] != '' or row[6] != '':
        print(f"Row {i:3d}: {[str(x)[:40] for x in row[:15]]}")
        count += 1
        if count >= 30:
            break
            
# 3. Print first 20 rows of 'Apoyos' sheet
if 'Apoyos' in wb.sheet_names():
    ws = wb.sheet_by_name('Apoyos')
    print("\n--- Sheet: Apoyos ---")
    for i in range(min(30, ws.nrows)):
        row = [ws.cell_value(i, j) for j in range(ws.ncols)]
        if any(x != '' for x in row):
            print(f"Row {i:2d}: {[str(x)[:40] for x in row[:15] if x != '']}")
