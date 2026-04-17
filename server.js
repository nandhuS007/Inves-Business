import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('--- Hostinger Production Bridge (V5 - Compiled) ---');
const builtServer = join(__dirname, 'dist', 'server.js');

if (existsSync(builtServer)) {
    console.log('Built server found at:', builtServer);
    const child = spawn(process.execPath, [builtServer], {
        stdio: 'inherit',
        cwd: __dirname,
        env: { 
            ...process.env, 
            NODE_ENV: 'production'
        }
    });

    child.on('error', (err) => {
        console.error('FAILED TO START BUILT SERVER:', err);
    });

    child.on('close', (code) => {
        console.log(`Server exited with code ${code}`);
    });
} else {
    console.error('CRITICAL ERROR: dist/server.js not found!');
    try {
        const contents = readdirSync(__dirname);
        console.log('CWD Contents:', contents);
        if (contents.includes('dist')) {
            console.log('Dist folder contents:', readdirSync(join(__dirname, 'dist')));
        }
    } catch (e) {
        console.error('Failed to list directory contents');
    }
}
