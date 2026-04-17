import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readdirSync, statSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('--- Hostinger Production Bridge (V15 - Diagnostic Mode) ---');
console.log('>>> Host Node Version:', process.version);
const builtServer = join(__dirname, 'master_server.js');

if (existsSync(builtServer)) {
    const stats = statSync(builtServer);
    console.log(`>>> Found Master Bundle: ${builtServer} (${stats.size} bytes)`);
    
    const child = spawn(process.execPath, [builtServer], {
        cwd: __dirname,
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: 'production' }
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
