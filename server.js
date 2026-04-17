import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('--- Hostinger Production Bridge (V7 - Pre-Built) ---');
const builtServer = join(__dirname, 'dist', 'server.js');

if (existsSync(builtServer)) {
    console.log('Startup: Found pre-built server at', builtServer);
    const child = spawn(process.execPath, [builtServer], {
        stdio: 'inherit',
        cwd: __dirname,
        env: { ...process.env, NODE_ENV: 'production' }
    });
    child.on('close', (code) => {
        console.log(`Server exited with code ${code}`);
        // No auto-restart here to prevent loops if it's a code error
    });
} else {
    console.error('CRITICAL: dist/server.js not found in deployment package.');
    console.log('Contents of CWD:', readdirSync(__dirname));
}
