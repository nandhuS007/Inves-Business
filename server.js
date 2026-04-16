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

const start = () => {
  console.log('Attempting to start server with tsx loader...');
  
  // Use process.execPath to ensure we use the same node binary that is running this script
  // This solves the 'spawn node ENOENT' error on some hosting environments
  const nodeBinary = process.execPath;
  console.log('Using Node Binary:', nodeBinary);

  const args = [
    '--import', 'tsx',
    'server.ts'
  ];

  console.log('Command:', nodeBinary, args.join(' '));

  const child = spawn(nodeBinary, args, {
    stdio: 'inherit',
    cwd: __dirname,
    env: { 
      ...process.env, 
      NODE_ENV: 'production',
      PORT: process.env.PORT || '3000'
    }
  });

  child.on('error', (err) => {
    console.error('CRITICAL: Failed to spawn process:', err);
  });

  child.on('close', (code) => {
    console.log(`Server process exited with code ${code}`);
    if (code !== 0) {
      console.log('Restarting in 10 seconds...');
      setTimeout(start, 10000);
    }
  });
};

start();
