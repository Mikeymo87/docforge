import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadSvg(filename) {
  return readFileSync(join(__dirname, '..', '..', 'assets', filename), 'utf-8');
}

function toDataUri(svg) {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

function imgTag(uri, width, height, alt = 'Baptist Health') {
  return `<img src="${uri}" width="${width}" height="${height}" alt="${alt}" style="display:block;" />`;
}

// ── Logo variants ──────────────────────────────────────────────────────────────

// Square pineapple mark (160×160 viewBox)
const markSvg   = loadSvg('bh-pineapple.svg');
export const logoDataUri = toDataUri(markSvg);
export const logoImgTag  = (size = 28) => imgTag(logoDataUri, size, size);

// Horizontal lockup — black text (652×160 viewBox)
const hBlackSvg = loadSvg('bh-horizontal-black.svg');
const hBlackUri = toDataUri(hBlackSvg);
// rendered at height h; width scales proportionally (652/160 ≈ 4.075)
export const logoHorizontalBlack = (h = 28) => imgTag(hBlackUri, Math.round(h * 4.075), h);

// Horizontal lockup — white text (same proportions, used on dark bg)
// Falls back to black until white version is provided
let hWhiteSvg, hWhiteUri;
try {
  hWhiteSvg = loadSvg('bh-horizontal-white.svg');
  hWhiteUri = toDataUri(hWhiteSvg);
} catch {
  hWhiteUri = hBlackUri; // fallback
}
export const logoHorizontalWhite = (h = 28) => imgTag(hWhiteUri, Math.round(h * 4.075), h);

// Stacked lockup — white text (486×184 viewBox, ratio ≈ 2.64)
const sWhiteSvg = loadSvg('bh-stacked-white.svg');
const sWhiteUri = toDataUri(sWhiteSvg);
export const logoStackedWhite = (h = 48) => imgTag(sWhiteUri, Math.round(h * 2.64), h);

// Stacked lockup — black text
const sBlackSvg = loadSvg('bh-stacked-black.svg');
const sBlackUri = toDataUri(sBlackSvg);
export const logoStackedBlack = (h = 48) => imgTag(sBlackUri, Math.round(h * 2.64), h);
