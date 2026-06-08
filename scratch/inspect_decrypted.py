import xlrd

file_path = '/Users/diego/Desktop/panel de campañas/administrador/pagado_emitido/PagPend_decrypted.xls'
print(f"Opening {file_path} with xlrd...")
try:
    wb = xlrd.open_workbook(file_path)
    print("Sheets in workbook:", wb.sheet_names())
    
    ws = wb.sheet_by_index(0)
    print(f"Sheet 0: {ws.name} (rows: {ws.nrows}, cols: {ws.ncols})")
    
    # Let's print the first 40 rows
    print("\n--- Printing first 40 rows ---")
    for i in range(min(40, ws.nrows)):
        row_vals = [ws.cell_value(i, j) for j in range(ws.ncols)]
        # Check if row is not entirely empty
        if any(x != '' for x in row_vals):
            # Print index and non-empty values
            print(f"Row {i:2d}: {[str(x)[:40] for x in row_vals[:15]]}")
            
except Exception as e:
    print(f"Error: {e}")
