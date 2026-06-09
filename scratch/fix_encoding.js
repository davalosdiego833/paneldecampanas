import fs from 'fs';
import path from 'path';

const BASE_PATH = process.cwd();

function walkDir(dir, callback) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file === 'node_modules' || file === '.git' || file === '.venv' || file === '.cache') {
                continue;
            }
            walkDir(fullPath, callback);
        } else {
            callback(fullPath);
        }
    }
}

console.log('🔍 Iniciando escaneo de archivos para reparar caracteres corruptos...');
let fixedCount = 0;

walkDir(BASE_PATH, (filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.json' || ext === '.js' || ext === '.cjs' || ext === '.txt' || ext === '.html' || ext === '.sh') {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            if (content.includes('Ñ') || content.includes('ñ')) {
                // Reemplazar Ñ con Ñ y ñ con ñ
                const repaired = content.replace(/Ñ/g, 'Ñ').replace(/ñ/g, 'ñ');
                fs.writeFileSync(filePath, repaired, 'utf8');
                console.log(`✅ Reparado: ${path.relative(BASE_PATH, filePath)}`);
                fixedCount++;
            }
        } catch (e) {
            console.error(`❌ Error al procesar ${filePath}:`, e.message);
        }
    }
});

console.log(`\n🎉 Proceso completado. Se repararon ${fixedCount} archivos.`);
