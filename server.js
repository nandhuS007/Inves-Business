import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readdirSync, statSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('--- Hostinger Production Bridge (V12 - Pre-Flight) ---');
const builtServer = join(__dirname, 'server_compiled.js');

if (existsSync(builtServer)) {
    const stats = statSync(builtServer);
    console.log(`Startup: Found root compiled server at ${builtServer} (${stats.size} bytes)`);
    
    if (stats.size < 1000) {
        console.warn('WARNING: server_compiled.js seems too small. Build might have failed.');
    }

    const child = spawn(process.execPath, [builtServer], {
        cwd: __dirname,
        env: { ...process.env, NODE_ENV: 'production' }
    });

    child.stdout.on('data', (data) => {
        process.stdout.write(`[SERVER-OUT]: ${data}`);
    });

    child.stderr.on('data', (data) => {
        process.stdout.write(`[SERVER-ERR]: ${data}`);
    });

    child.on('error', (err) => {
        console.error('CRITICAL: Failed to spawn child process:', err);
    });

    child.on('close', (code) => {
        console.log(`Server exited with code ${code}`);
    });
} else {
    console.error('CRITICAL: server_compiled.js not found in deployment package.');
    console.log('Contents of CWD:', readdirSync(__dirname));
}
