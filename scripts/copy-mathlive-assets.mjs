import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcBase = path.join(rootDir, 'node_modules', 'mathlive', 'dist');
const dstBase = path.join(rootDir, 'public', 'mathlive');

if (!fs.existsSync(srcBase)) {
  console.log('mathlive/dist non trovato, copia asset saltata.');
  process.exit(0);
}

fs.mkdirSync(dstBase, { recursive: true });

for (const folder of ['fonts', 'sounds']) {
  const src = path.join(srcBase, folder);
  const dst = path.join(dstBase, folder);
  if (fs.existsSync(src)) {
    fs.cpSync(src, dst, { recursive: true, force: true });
  }
}

console.log('Asset MathLive copiati in public/mathlive.');
