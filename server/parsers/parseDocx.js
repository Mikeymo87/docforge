import mammoth from 'mammoth';
import { parseMarkdown } from './parseMarkdown.js';

export async function parseDocx(buffer) {
  const result = await mammoth.convertToMarkdown({ buffer });
  const doc = parseMarkdown(result.value);
  doc.metadata.sourceFormat = 'docx';
  return doc;
}
