import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Log environment state for debugging
console.log('--- Hostinger Deployment Diagnostic ---');
console.log('Node Version:', process.version);
console.log('Directory:', __dirname);
console.log('Port:', process.env.PORT);

// Try to find tsx. We prefer the one in node_modules, but fallback to 'npx tsx'
const serverPath = join(__dirname, 'server.ts');

const start = () => {
  console.log('Attempting to start server with tsx...');
  
  // Use 'npx' as it handles pathing for binaries automatically
  const child = spawn('npx', ['tsx', 'server.ts'], {
    stdio: 'inherit',
    shell: true,
    cwd: __dirname,
    env: { ...process.env, NODE_ENV: 'production' }
  });

  child.on('error', (err) => {
    console.error('CRITICAL: Failed to spawn process:', err);
  });

  child.on('close', (code) => {
    console.log(`Server process exited with code ${code}`);
    if (code !== 0) {
      console.log('Restarting in 5 seconds...');
      setTimeout(start, 5000);
    }
  });
};

start();
