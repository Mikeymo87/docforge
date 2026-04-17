import { extname } from 'path';
import { parseMarkdown } from './parseMarkdown.js';
import { parsePlainText } from './parsePlainText.js';
import { parsePdf } from './parsePdf.js';

const SYNC_PARSERS = {
  '.md': parseMarkdown,
  '.markdown': parseMarkdown,
  '.txt': parsePlainText,
};

const ASYNC_PARSERS = {
  '.pdf': parsePdf,
};

const PENDING_PARSERS = {
  '.docx': null,  // Phase 4
  '.html': null,  // Phase 4
  '.htm': null,   // Phase 4
};

export async function parse(filePath, content) {
  const ext = extname(filePath).toLowerCase();

  if (ext in SYNC_PARSERS) {
    const doc = SYNC_PARSERS[ext](content);
    doc.metadata.sourceFile = filePath;
    return doc;
  }

  if (ext in ASYNC_PARSERS) {
    const parser = ASYNC_PARSERS[ext];
    const doc = await parser(content);
    doc.metadata.sourceFile = filePath;
    return doc;
  }

  if (ext in PENDING_PARSERS) {
    throw new Error(`Parser for ${ext} files is not yet implemented. Supported: .md, .txt, .pdf`);
  }

  throw new Error(`Unsupported file type: ${ext}. Supported: .md, .txt, .pdf, .docx, .html`);
}

export const SUPPORTED_EXTENSIONS = [
  ...Object.keys(SYNC_PARSERS),
  ...Object.keys(ASYNC_PARSERS),
  ...Object.keys(PENDING_PARSERS),
];
