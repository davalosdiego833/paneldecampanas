import msoffcrypto
import xlrd
import os

file_path = '/Users/diego/Desktop/panel de campañas/administrador/pagado_emitido/PagPend.xls'
passwords = ['2043', 'ADA181016KD6']

print("Starting decryption check...")
try:
    with open(file_path, "rb") as f:
        office_file = msoffcrypto.OfficeFile(f)
        if not office_file.is_encrypted():
            print("File is not encrypted.")
        else:
            print("File is encrypted. Trying passwords...")
            decrypted = False
            for pwd in passwords:
                try:
                    office_file.load_key(password=pwd)
                    decrypted_path = file_path.replace(".xls", "_decrypted.xls")
                    with open(decrypted_path, "wb") as f_dec:
                        office_file.decrypt(f_dec)
                    print(f"Decrypted successfully with password: {pwd}")
                    file_path = decrypted_path
                    decrypted = True
                    break
                except Exception as e:
                    print(f"Failed password {pwd}: {e}")
                    continue
            
            if not decrypted:
                print("Could not decrypt with any password.")
                exit(1)
except Exception as e:
    print(f"Error: {e}")
    exit(1)

# Now inspect with xlrd
print(f"Opening {file_path} with xlrd...")
try:
    wb = xlrd.open_workbook(file_path)
    print("Sheets in workbook:", wb.sheet_names())
    ws = wb.sheet_by_index(0)
    print(f"Total rows: {ws.nrows}, Total cols: {ws.ncols}")
    
    print("Printing first 25 rows:")
    for i in range(min(25, ws.nrows)):
        print(f"Row {i}:", [ws.cell_value(i, j) for j in range(min(15, ws.ncols))])
        
except Exception as e:
    print(f"Error reading decrypted xls: {e}")
finally:
    # Cleanup decrypted file
    if "_decrypted.xls" in file_path and os.path.exists(file_path):
        os.remove(file_path)
        print("Cleaned up temporary decrypted file.")
