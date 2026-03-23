const XLSX = require('xlsx');
const wb = XLSX.readFile('./administrador/pagado_emitidido/pagado_emitido.xlsx');
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

const MONTHS_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const formatExcelDate = (val) => {
    const monthsNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    if (typeof val === 'number') {
        const d = XLSX.SSF.parse_date_code(val);
        if (d) {
            const year = d.y < 100 ? (d.y < 30 ? 2000 + d.y : 1900 + d.y) : d.y;
            return `${d.d} de ${monthsNames[d.m - 1]} de ${year}`;
        }
    }
    return String(val || '');
};

const parseSpanishDate = (str) => {
    if (!str) return '';
    const match = String(str).toLowerCase().match(/(\d{1,2})\s+de\s+([a-z]+)(\s+de)?\s+(\d{4})/i);
    if (match) {
        const day = match[1].padStart(2, '0');
        const monthStr = match[2].toLowerCase();
        let mIdx = MONTHS_ES.indexOf(monthStr);
        if (mIdx === -1) {
            mIdx = MONTHS_ES.findIndex(m => m.startsWith(monthStr) || monthStr.startsWith(m.substring(0, 3)));
        }
        const month = (mIdx !== -1 ? mIdx + 1 : 1).toString().padStart(2, '0');
        const year = match[4];
        return `${year}-${month}-${day}`;
    }
    return '';
};

const rawVal = data[0]?.[1] || data[0]?.[0] || ws?.['A1']?.v || "";
console.log('raw:', rawVal);
console.log('formatted:', formatExcelDate(rawVal));
console.log('parsed:', parseSpanishDate(formatExcelDate(rawVal)));
