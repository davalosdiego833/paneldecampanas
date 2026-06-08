import msoffcrypto
import os

file_path = '/Users/diego/Desktop/panel de campañas/administrador/pagado_emitido/PagPend.xls'
passwords = [
    "VelvetSweatshop", "", "Velox", "velox", "Velox1", "velox1", "SMNY", "smny", "SMNY2043", "smny2043",
    "smny2024", "smny2025", "smny2026", "2043", "ADA181016KD6"
]

try:
    with open(file_path, "rb") as f:
        office_file = msoffcrypto.OfficeFile(f)
        if not office_file.is_encrypted():
            print("File is not encrypted.")
        else:
            print("File is encrypted. Trying common passwords...")
            for pwd in passwords:
                try:
                    office_file.load_key(password=pwd)
                    decrypted_path = file_path.replace(".xls", "_decrypted_test.xls")
                    with open(decrypted_path, "wb") as f_dec:
                        office_file.decrypt(f_dec)
                    print(f"SUCCESS! Password is: '{pwd}'")
                    os.remove(decrypted_path)
                    break
                except Exception as e:
                    # print(f"Failed '{pwd}': {e}")
                    continue
            else:
                print("All common passwords failed.")
except Exception as e:
    print(f"Error checking encryption: {e}")
