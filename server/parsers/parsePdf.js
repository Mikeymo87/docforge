import pdf from 'pdf-parse';
import { parsePlainText } from './parsePlainText.js';

export async function parsePdf(buffer) {
  const data = await pdf(buffer);

  const doc = parsePlainText(data.text);

  // Override metadata with PDF info if available
  if (data.info?.Title) doc.metadata.title = data.info.Title;
  if (data.info?.Author) doc.metadata.author = data.info.Author;
  if (data.info?.Subject) doc.metadata.subtitle = data.info.Subject;

  doc.metadata.sourceFormat = 'pdf';
  return doc;
}
