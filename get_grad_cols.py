import pandas as pd
df = pd.read_excel("graduacion/Graduacion Asesores.xlsm", sheet_name=0, engine="openpyxl", skiprows=10)
print(df.head(5).to_string())
