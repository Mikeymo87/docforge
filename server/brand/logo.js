import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const svgPath = join(__dirname, '..', '..', 'assets', 'bh-pineapple.svg');

export const logoSvg = readFileSync(svgPath, 'utf-8');

const base64 = Buffer.from(logoSvg).toString('base64');
export const logoDataUri = `data:image/svg+xml;base64,${base64}`;

export const logoImgTag = (size = 28) =>
  `<img src="${logoDataUri}" width="${size}" height="${size}" alt="Baptist Health" style="display:block;" />`;
