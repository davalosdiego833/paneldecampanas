const XLSX = require('xlsx');

const formatExcelDate = (serial) => {
    const excelEpoch = new Date(1899, 11, 30);
    const dt = new Date(excelEpoch.getTime() + serial * 86400000);
    const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    return `${dt.getDate()} de ${months[dt.getMonth()]} de ${dt.getFullYear()}`;
};

const extractCutoffDate = (filePath) => {
    try {
        const wb = XLSX.readFile(filePath, { bookSheets: true });
        // Load target sheet only (sheet 0)
        const fullWb = XLSX.readFile(filePath, { sheets: [wb.SheetNames[0]] });
        const ws = fullWb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1, range: 0 });
        for (let r = 0; r < Math.min(30, data.length); r++) {
            const row = data[r];
            if (!row) continue;
            for (const val of row) {
                if (!val) continue;
                if (typeof val === 'number' && val > 45000 && val < 47000) {
                    return formatExcelDate(val);
                }
                const str = String(val);
                const match = str.match(/\d{1,2}\s+(?:de\s+)?[a-záéíóúñ]{3,}\s+(?:de\s+)?\d{4}/i);
                if (match) {
                    return match[0].toLowerCase();
                }
            }
        }
    } catch (e) {
        console.error('Error reading date from ' + filePath, e);
    }
    return 'Not found';
};

console.log('Proactivos Date:', extractCutoffDate('/Users/diego/Downloads/Proactivos.xlsx'));
console.log('Comparativo Vida Date:', extractCutoffDate('/Users/diego/Downloads/Comparativo Vida.xlsm'));
