const fs = require('fs');
let code = fs.readFileSync('procesar_mayo.cjs', 'utf-8');
code = code.replace('XLSX.utils.book_append_sheet(wb, newWs, "MAYO_CORREGIDO");', 'if(wb.Sheets["MAYO_CORREGIDO"]) delete wb.Sheets["MAYO_CORREGIDO"]; wb.SheetNames = wb.SheetNames.filter(s => s !== "MAYO_CORREGIDO"); XLSX.utils.book_append_sheet(wb, newWs, "MAYO_CORREGIDO");');
fs.writeFileSync('procesar_mayo.cjs', code);
