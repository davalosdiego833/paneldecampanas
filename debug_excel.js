
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const BASE_PATH = '/home/u211138134/domains/panel.ambrizydavalos.com/nodejs';
const compPath = path.join(BASE_PATH, 'administrador/comparativo_vida.xlsx');

if (fs.existsSync(compPath)) {
    const wb = XLSX.readFile(compPath);
    const ws = wb.Sheets['promotoria'];
    if (ws) {
        const raw = XLSX.utils.sheet_to_json(ws, { header: 1 });
        console.log('--- RAW ROW 5 (Index 4) ---');
        console.log(JSON.stringify(raw[4], null, 2));
        
        const parseVal = (v) => {
            if (v === undefined || v === null || v === '') return 'EMPTY';
            if (typeof v === 'number') return v;
            return `STRING: "${v}"`;
        };
        
        const dataRow = raw[4];
        if (dataRow) {
            console.log('--- PARSED VALUES ---');
            for(let i=0; i<16; i++) {
                console.log(`Col ${i}: ${parseVal(dataRow[i])}`);
            }
        }
    } else {
        console.log('Sheet "promotoria" not found');
    }
} else {
    console.log('File not found at ' + compPath);
}
