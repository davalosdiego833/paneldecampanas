import os
import glob
import msoffcrypto
import pandas as pd
import warnings
warnings.filterwarnings('ignore', category=UserWarning, module='openpyxl')

SUCURSALES_ADMIN = ['2043', '2856', '2692', '2511', '313']
PASSWORDS = ['2043', 'ADA181016KD6']

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CAMPAIGN_DIRS = ['mdrt', 'camino_cumbre', 'graduacion', 'reto_por_ciento']

def decrypt_excel(file_path):
    try:
        with open(file_path, "rb") as f:
            office_file = msoffcrypto.OfficeFile(f)
            if not office_file.is_encrypted():
                return file_path
                
            print(f"[{os.path.basename(file_path)}] Está protegido. Intentando desencriptar...")
            for pwd in PASSWORDS:
                try:
                    office_file.load_key(password=pwd)
                    decrypted_path = file_path.replace(".xlsx", "_decrypted.xlsx").replace(".xlsm", "_decrypted.xlsm")
                    with open(decrypted_path, "wb") as f_dec:
                        office_file.decrypt(f_dec)
                    print(f"[{os.path.basename(file_path)}] Desencriptado correctamente.")
                    return decrypted_path
                except Exception:
                    continue
            print(f"[{os.path.basename(file_path)}] No se pudo desencriptar con ninguna contraseña.")
            return None
    except Exception as e:
        print(f"[{os.path.basename(file_path)}] Error al desencriptar: {e}")
        return None

def clean_campaign_file(file_path):
    print(f"\nLimpiando con Pandas {os.path.basename(file_path)}...")
    try:
        xl = pd.ExcelFile(file_path, engine='openpyxl')
        output_path = file_path.replace(".xlsx", "_cleaned.xlsx").replace(".xlsm", "_cleaned.xlsx")
        
        with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
            for sheet_name in xl.sheet_names:
                df = xl.parse(sheet_name)
                if df.empty:
                    df.to_excel(writer, sheet_name=sheet_name, index=False)
                    continue
                
                # Check column headers for 'MAT'
                header_idx = -1
                mat_col = None
                
                for i, row in df.head(30).iterrows():
                    row_str = row.astype(str).str.lower().str.strip()
                    if any(x in ['asesor', 'mat', 'mat / unidad', 'nombre del asesor', 'prom_mat', 'suc', 'sucursal', 'matriz'] for x in row_str):
                        header_idx = i
                        for col_name, val in row.items():
                            val_str = str(val).strip().lower()
                            if val_str in ['mat', 'mat / unidad', 'suc', 'sucursal', 'matriz', 'prom_mat', 'dir / zona']:
                                if val_str == 'dir / zona':
                                    pass # Alta de Partner has it elsewhere
                                if val_str in ['mat', 'mat / unidad', 'suc', 'sucursal', 'matriz', 'prom_mat']:
                                    mat_col = col_name
                                    break
                        break
                        
                if header_idx == -1 or mat_col is None:
                    if "graduacion" in file_path.lower() and sheet_name.lower() == "encuentroii":
                        mat_col = df.columns[3]
                        header_idx = 1
                    elif "alta de partner" in sheet_name.lower():
                        mat_col = df.columns[4]
                        header_idx = 9
                    else:
                        df.to_excel(writer, sheet_name=sheet_name, index=False)
                        continue
                
                # Split header and data
                header_data = df.iloc[:header_idx+1]
                data_rows = df.iloc[header_idx+1:]
                
                # Filter data rows
                mask = data_rows[mat_col].astype(str).str.strip().isin(SUCURSALES_ADMIN) | data_rows[mat_col].astype(str).str.strip().str.lower().str.contains('total', na=False)
                filtered_data = data_rows[mask]
                
                cleaned_df = pd.concat([header_data, filtered_data])
                cleaned_df.to_excel(writer, sheet_name=sheet_name, index=False)
                print(f"[{sheet_name}] Filas originales: {len(df)}, Filas mantenidas: {len(cleaned_df)}")
        
        # Guardar éxito
        os.replace(output_path, file_path)
        print(f"[{os.path.basename(file_path)}] Limpieza finalizada.")
        
    except Exception as e:
        print(f"Error procesando {file_path}: {e}")

def main():
    for d in CAMPAIGN_DIRS:
        folder_path = os.path.join(BASE_DIR, d)
        if not os.path.exists(folder_path):
            continue
            
        excel_files = glob.glob(os.path.join(folder_path, '*.xls*'))
        for f in excel_files:
            if "decrypted" in f or "cleaned" in f:
                continue
                
            working_file = decrypt_excel(f)
            if working_file:
                clean_campaign_file(working_file)
                if working_file != f:
                    os.replace(working_file, f)

if __name__ == '__main__':
    main()
