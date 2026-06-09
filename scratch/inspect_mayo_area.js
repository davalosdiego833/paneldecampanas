import fs from 'fs';

const path = './VENTAS_MENSUALES/mayo_area.json';
if (fs.existsSync(path)) {
    const data = JSON.parse(fs.readFileSync(path, 'utf8'));
    console.log('--- mayo_area.json names count:', data.length);
    console.log(data);
} else {
    console.log('mayo_area.json not found');
}
