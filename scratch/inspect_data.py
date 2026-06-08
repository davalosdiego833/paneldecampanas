import msoffcrypto
import xlrd
import os

file_path = '/Users/diego/Desktop/panel de campañas/administrador/pagado_emitido/PagPend.xls'
pwd = 'VelvetSweatshop'

print("Decrypting file with VelvetSweatshop...")
try:
    with open(file_path, "rb") as f:
        office_file = msoffcrypto.OfficeFile(f)
        decrypted_path = file_path.replace(".xls", "_decrypted.xls")
        with open(decrypted_path, "wb") as f_dec:
            office_file.decrypt(f_dec)
        print("Decrypted successfully.")
except Exception as e:
    print(f"Error during decryption: {e}")
    exit(1)

try:
    wb = xlrd.open_workbook(decrypted_path)
    print("Sheets available:", wb.sheet_names())
    
    # We will inspect each sheet
    for sheet_idx, sheet_name in enumerate(wb.sheet_names()):
        ws = wb.sheet_by_index(sheet_idx)
        print(f"\n--- Sheet: {sheet_name} (rows: {ws.nrows}, cols: {ws.ncols}) ---")
        
        # Let's search for headers in the first 50 rows
        for r_idx in range(min(50, ws.nrows)):
            row = [ws.cell_value(r_idx, c_idx) for c_idx in range(ws.ncols)]
            row_str = [str(x).lower().strip() for x in row]
            
            # Check if any keyword matches
            if any('ramo' in x or 'oficina' in x or 'promotor' in x or 'direccion' in x for x in row_str):
                print(f"Header candidates at row {r_idx}:")
                for c_idx, val in enumerate(row):
                    if val:
                        print(f"  Col {c_idx}: '{val}'")
                print("Sample data from next 5 rows:")
                for next_r in range(r_idx+1, min(r_idx+6, ws.nrows)):
                    print(f"  Row {next_r}: {[ws.cell_value(next_r, c) for c in range(ws.ncols)]}")
                break
                
except Exception as e:
    print(f"Error reading decrypted xls: {e}")
finally:
    if os.path.exists(decrypted_path):
        os.remove(decrypted_path)
        print("Removed temp decrypted file.")
