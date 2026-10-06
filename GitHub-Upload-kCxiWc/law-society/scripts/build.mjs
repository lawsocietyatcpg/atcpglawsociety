import { cp, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { build } from 'vite';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
await build({
  root: join(root, 'dist'),
  build: { outDir: join(root, 'build'), emptyOutDir: true },
});
await mkdir(join(root, 'build', 'assets'), { recursive: true });
await cp(join(root, 'dist', 'theme.js'), join(root, 'build', 'theme.js'));
await cp(join(root, 'dist', 'privacy.html'), join(root, 'build', 'privacy.html'));
await cp(join(root, 'dist', 'terms.html'), join(root, 'build', 'terms.html'));
await cp(join(root, 'dist', 'assets'), join(root, 'build', 'assets'), { recursive: true });
