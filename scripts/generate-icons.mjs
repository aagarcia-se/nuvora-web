import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// La N está dentro de la zona segura circular del icono maskable (80%).
const source = new URL('../public/favicon.svg', import.meta.url);
const output = new URL('../public/icons/', import.meta.url);
await mkdir(output, { recursive: true });

for (const [name, size] of [
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['icon-maskable-512.png', 512],
  ['apple-touch-icon.png', 180],
]) {
  await sharp(fileURLToPath(source))
    .resize(size, size)
    .png()
    .toFile(fileURLToPath(new URL(name, output)));
}
