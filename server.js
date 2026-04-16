import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// This is a bridge file to satisfy Hostinger's ".js entry file" requirement.
// It uses 'tsx' to run our main 'server.ts' file.
const tsx = join(__dirname, 'node_modules', '.bin', 'tsx');
const server = join(__dirname, 'server.ts');

console.log('--- Hostinger Bridge Starting ---');
console.log('Executing:', tsx, server);

const child = spawn(tsx, [server], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, NODE_ENV: 'production' }
});

child.on('close', (code) => {
  process.exit(code || 0);
});

child.on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
