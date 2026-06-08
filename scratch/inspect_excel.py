import xlrd
import os
import re

xls_path = "administrador/pagado_emitido/PagPend_decrypted.xls"
if os.path.exists(xls_path):
    try:
        wb = xlrd.open_workbook(xls_path)
        sheet = wb.sheet_by_name('Resumen')
        
        # Look for cutoff date in the Resumen sheet
        cutoff_date = None
        for r in range(min(50, sheet.nrows)):
            for c in range(sheet.ncols):
                val = sheet.cell_value(r, c)
                if val:
                    val_str = str(val).strip()
                    # Check if it matches a month name followed by a date
                    if re.search(r'(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)', val_str, re.IGNORECASE):
                        print(f"Found candidate cell at ({r}, {c}): {repr(val)}")
                        match = re.search(r'([a-zA-ZáéíóúñÁÉÍÓÚÑ]+),?\s+(\d{1,2}),?\s+(\d{4})', val_str)
                        if match:
                            month = match.group(1).lower()
                            day = int(match.group(2))
                            year = match.group(3)
                            cutoff_date = f"{day} de {month} de {year}"
                            print(f"Parsed cutoff date: {cutoff_date}")
                            break
            if cutoff_date:
                break
        print(f"Final extracted cutoff date: {cutoff_date}")
    except Exception as e:
        print(f"Error: {e}")
else:
    print(f"File {xls_path} not found.")
