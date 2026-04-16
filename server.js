import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('--- Hostinger Production Bridge (V4) ---');
console.log('Node Binary:', process.execPath);
console.log('CWD:', __dirname);

// Verification checks
const serverTs = join(__dirname, 'server.ts');
const nodeModules = join(__dirname, 'node_modules');

console.log('Checking files...');
console.log('server.ts exists:', existsSync(serverTs));
console.log('node_modules exists:', existsSync(nodeModules));

const start = () => {
    console.log('Starting server process...');
    
    // Use npx tsx directly to handle path resolution
    // Setting shell: true often helps on shared hosting providers like Hostinger
    const child = spawn('npx', ['tsx', 'server.ts'], {
        stdio: 'inherit',
        shell: true,
        cwd: __dirname,
        env: { 
            ...process.env, 
            NODE_ENV: 'production'
        }
    });

    child.on('error', (err) => {
        console.error('FAILED TO SPAWN:', err);
    });

    child.on('close', (code) => {
        console.log(`Server process closed with code ${code}`);
        if (code !== 0) {
            console.log('Standard error might contain clues. Restarting in 15 seconds...');
            setTimeout(start, 15000);
        }
    });
};

start();
