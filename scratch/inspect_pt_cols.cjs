const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const ptPath = '/Users/diego/Desktop/panel de campañas/proactivatech';
const files = fs.readdirSync(ptPath).filter(f => f.endsWith('.xlsx'));
if (files.length > 0) {
    const filePath = path.join(ptPath, files[0]);
    const wb = XLSX.readFile(filePath, { bookSheets: true });
    const targetSheet = wb.SheetNames.find(n => n.toLowerCase().includes('asesores'));
    if (targetSheet) {
        const fullWb = XLSX.readFile(filePath, { sheets: [targetSheet] });
        const ws = fullWb.Sheets[targetSheet];
        const data = XLSX.utils.sheet_to_json(ws, { range: 6 });
        const advisorsData = data.slice(1);
        
        const getExcelYear = (val) => {
            if (!val) return 0;
            const num = Number(val);
            if (!isNaN(num)) {
                // Add a half day buffer to avoid timezone issues pulling dates to previous days
                const date = new Date(Math.round((num - 25569) * 86400 * 1000));
                return date.getUTCFullYear();
            }
            const str = String(val).trim();
            const match = str.match(/\b(20\d{2})\b/);
            if (match) {
                return parseInt(match[1], 10);
            }
            return 0;
        };

        console.log('Matriz 2043 Advisors:');
        advisorsData.filter(r => String(r.MATRIZ || '').trim() === '2043').forEach(r => {
            const conVal = r['CONEXIÓN'];
            const year = getExcelYear(conVal);
            console.log(`Asesor: ${r.ASESOR} | Conexión Raw: ${conVal} | Year: ${year} | Included: ${year >= 2023}`);
        });
    }
}
