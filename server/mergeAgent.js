import Anthropic from '@anthropic-ai/sdk';
import { parseMarkdown } from './parsers/parseMarkdown.js';

let client;
function getClient() {
  if (!client) client = new Anthropic();
  return client;
}

function astToText(doc) {
  const parts = [];
  if (doc.metadata.title) parts.push(`# ${doc.metadata.title}`);
  if (doc.metadata.subtitle) parts.push(`## ${doc.metadata.subtitle}`);
  parts.push('');

  for (const s of doc.sections) {
    switch (s.type) {
      case 'heading':
        parts.push(`${'#'.repeat(s.level)} ${s.text}`);
        break;
      case 'paragraph':
        parts.push(s.text);
        break;
      case 'list':
        s.items.forEach((item, i) => {
          parts.push(s.ordered ? `${i + 1}. ${item}` : `- ${item}`);
        });
        break;
      case 'table':
        parts.push(`| ${s.headers.join(' | ')} |`);
        parts.push(`| ${s.headers.map(() => '---').join(' | ')} |`);
        s.rows.forEach(row => parts.push(`| ${row.join(' | ')} |`));
        break;
      case 'blockquote':
        parts.push(`> ${s.text}`);
        break;
      case 'code':
        parts.push('```' + (s.language || ''));
        parts.push(s.text);
        parts.push('```');
        break;
      case 'hr':
        parts.push('---');
        break;
    }
    parts.push('');
  }
  return parts.join('\n');
}

export async function mergeWithAgent(docs) {
  // Convert all docs to readable text
  const docTexts = docs.map((d, i) => {
    const text = astToText(d.doc);
    return `<document index="${i + 1}" filename="${d.filename}">\n${text}\n</document>`;
  });

  const allContent = docTexts.join('\n\n');

  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    messages: [
      {
        role: 'user',
        content: `You are a document editor. You have been given ${docs.length} separate documents that need to be merged into a single cohesive document.

Your job:
1. Read all documents carefully
2. Create ONE unified document that combines all the content logically
3. Eliminate redundancy — if multiple docs cover the same topic, merge those sections
4. Create a clear structure with proper heading hierarchy (# for title, ## for major sections, ### for subsections)
5. Preserve ALL data — every table, every statistic, every bullet point must appear in the final document. Do not drop any data.
6. Write smooth transitions between sections that originally came from different documents
7. If documents have different titles/topics, create a unified title and organize by theme
8. Keep the original tone and voice — do not rewrite content unnecessarily, just restructure and connect it

Output the merged document as clean markdown. Include all tables in proper markdown table format. Preserve all bold/italic formatting.

Here are the documents:

${allContent}

Output ONLY the merged markdown document, nothing else.`,
      },
    ],
  });

  const mergedMarkdown = response.content[0].text;

  // Parse the merged markdown back into DocForge AST
  const mergedDoc = parseMarkdown(mergedMarkdown);
  mergedDoc.metadata.sourceFormat = 'merged-ai';
  mergedDoc.metadata.sourceFile = docs.map(d => d.filename).join(' + ');

  return mergedDoc;
}
