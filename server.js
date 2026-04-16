import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('--- Hostinger Production Bridge ---');
console.log('Node:', process.execPath);
console.log('Port:', process.env.PORT);

// We tell npm to run the "start" script. 
// This is the most reliable way as it handles all paths automatically.
const child = spawn('npm', ['run', 'start'], {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname,
  env: { 
    ...process.env, 
    NODE_ENV: 'production'
  }
});

child.on('error', (err) => {
  console.error('CRITICAL ERROR:', err);
});

child.on('close', (code) => {
  console.log(`Server exited with code ${code}`);
});
