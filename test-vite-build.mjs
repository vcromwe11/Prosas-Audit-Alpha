import { build } from 'vite';
await build({
  root: process.cwd(),
  build: { outDir: 'dist-test' }
});
