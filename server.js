import { spawn, execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('--- Hostinger Production Bridge (V6 - Auto-Build) ---');
const builtServer = join(__dirname, 'dist', 'server.js');

const startApp = () => {
    console.log('Starting compiled server:', builtServer);
    const child = spawn(process.execPath, [builtServer], {
        stdio: 'inherit',
        cwd: __dirname,
        env: { ...process.env, NODE_ENV: 'production' }
    });
    child.on('close', (code) => {
        console.log(`Server exited with code ${code}`);
        if (code !== 0) setTimeout(startApp, 10000);
    });
};

if (!existsSync(builtServer)) {
    console.log('CRITICAL: dist/server.js NOT FOUND. Attempting manual build...');
    try {
        // Try to run the build command defined in package.json
        console.log('Executing: npm run build');
        execSync('npm run build', { stdio: 'inherit', cwd: __dirname });
        console.log('Build successful!');
    } catch (error) {
        console.error('Build failed directly. Trying fallback compilation...');
        try {
            // Fallback: Just try to run server.ts directly if build fails
            console.log('Fallback: Starting server.ts with node loader...');
            const child = spawn(process.execPath, ['--import', 'tsx', 'server.ts'], {
                stdio: 'inherit',
                cwd: __dirname,
                env: { ...process.env, NODE_ENV: 'production' }
            });
            child.on('close', (code) => console.log(`Fallback exited with code ${code}`));
            process.exit(0); // Let the child take over
        } catch (fallbackError) {
            console.error('All startup methods failed.');
        }
    }
}

if (existsSync(builtServer)) {
    startApp();
} else {
    console.error('Initialization failed. Please check Hostinger Build Logs.');
}
