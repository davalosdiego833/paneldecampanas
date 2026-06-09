import fs from 'fs';

const path = './VENTAS_MENSUALES/mayo_data.json';
if (fs.existsSync(path)) {
    const data = JSON.parse(fs.readFileSync(path, 'utf8'));
    console.log('Sample entry in mayo_data.json (key 0):', data['0']);
    console.log('Sample entry in mayo_data.json (key 1):', data['1']);
    console.log('Sample entry in mayo_data.json (key 2):', data['2']);
}
