import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const node = process.execPath;
const args = [
  '--import', 'tsx',
  'server.ts'
];

console.log('--- Hostinger Production Bridge (V3) ---');
console.log('Node Binary:', node);
console.log('Arguments:', args.join(' '));
console.log('CWD:', __dirname);

const child = spawn(node, args, {
  stdio: 'inherit',
  cwd: __dirname,
  env: { 
    ...process.env, 
    NODE_ENV: 'production'
  }
});

child.on('error', (err) => {
  console.error('CRITICAL ERROR spawning child:', err);
});

child.on('close', (code) => {
  console.log(`Server exited with code ${code}`);
});
