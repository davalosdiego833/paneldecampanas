import xlrd
import os

xls_path = "administrador/pagado_emitido/PagPend_decrypted.xls"
if os.path.exists(xls_path):
    try:
        wb = xlrd.open_workbook(xls_path)
        sheet = wb.sheet_by_name('Resumen')
        print("Columns 0 to 18 for rows 5 to 15 in 'Resumen':")
        for i in range(5, 16):
            row_vals = [sheet.cell_value(i, j) for j in range(sheet.ncols)]
            print(f"Row {i:2d}: {row_vals}")
    except Exception as e:
        print(f"Error: {e}")
else:
    print(f"File {xls_path} not found.")
