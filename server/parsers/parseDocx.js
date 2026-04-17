import mammoth from 'mammoth';
import { parsePlainText } from './parsePlainText.js';

export async function parseDocx(buffer) {
  const result = await mammoth.extractRawText({ buffer });
  const doc = parsePlainText(result.value);
  doc.metadata.sourceFormat = 'docx';
  return doc;
}
