import Anthropic from '@anthropic-ai/sdk';
import { parseMarkdown } from './parsers/parseMarkdown.js';

let client;
function getClient() {
  if (!client) client = new Anthropic();
  return client;
}

function astToMarkdown(doc) {
  const parts = [];
  if (doc.metadata.title) parts.push(`# ${doc.metadata.title}`);
  if (doc.metadata.subtitle) parts.push(`*${doc.metadata.subtitle}*`);
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

export async function qaReview(doc) {
  const markdown = astToMarkdown(doc);

  const response = await getClient().messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 8192,
    messages: [
      {
        role: 'user',
        content: `You are a document structure QA agent. You receive a parsed document and must fix its structure for professional formatting.

Review this document and fix ALL of these issues:

## Heading Hierarchy
- The document MUST have clear heading hierarchy: ## for major sections, ### for subsections, #### for minor labels
- If text looks like a section title but is formatted as a paragraph, PROMOTE it to the correct heading level
- Common section titles: "The Problem", "The Solution", "Executive Summary", "Use Cases", "How It Works", "Implementation", "Timeline", "Cost", "Sources", "Citations", "Conclusion", "Bottom Line", "Key Findings", "Recommendations", etc.
- ALL-CAPS phrases that are clearly section labels should be ### headings
- Short bold phrases at the start of a paragraph that act as labels should be split into a heading + paragraph
- Never let a heading be indented or formatted less prominently than body text

## Content Flow
- Body paragraphs should flow naturally under their section heading
- If a paragraph is clearly a continuation of the previous one (no topic change), merge them
- If a single long paragraph contains multiple distinct topics, split it at topic boundaries
- Remove redundant repeated content (like a title appearing both as h1 and as body text)

## Lists
- If body text contains items separated by semicolons or that follow a pattern like "Item — description", convert to a bullet list
- Numbered sequences should be ordered lists

## Tables
- If tabular data is mashed into a paragraph (common with PDF extraction), try to reconstruct the table
- Preserve all data — never drop numbers or statistics

## Cleanup
- Remove artifacts from PDF extraction (page numbers, headers/footers that got mixed into body text)
- Remove duplicate titles or subtitles that appear in both the metadata and the body
- If the first paragraph just restates the title/subtitle, remove it
- Ensure "Bottom Line", "Conclusion", or "Summary" sections are properly marked as ## headings

## What NOT to change
- Do not rewrite the actual content — preserve the author's words exactly
- Do not add content that wasn't there
- Do not change the meaning of anything
- Preserve all bold (**text**) and italic (*text*) formatting
- Preserve all tables exactly as they are (only fix structure, not data)

Here is the document:

${markdown}

Output the FIXED document as clean markdown. Output ONLY the markdown, nothing else.`,
      },
    ],
  });

  const fixedMarkdown = response.content[0].text;
  const fixedDoc = parseMarkdown(fixedMarkdown);

  // Preserve original metadata fields the QA agent shouldn't change
  fixedDoc.metadata.sourceFile = doc.metadata.sourceFile;
  fixedDoc.metadata.sourceFormat = doc.metadata.sourceFormat;
  fixedDoc.metadata.org = doc.metadata.org;
  fixedDoc.metadata.confidentiality = doc.metadata.confidentiality;
  // Use QA-fixed title/subtitle if they changed, otherwise keep original
  if (!fixedDoc.metadata.title) fixedDoc.metadata.title = doc.metadata.title;
  if (!fixedDoc.metadata.subtitle) fixedDoc.metadata.subtitle = doc.metadata.subtitle;
  fixedDoc.metadata.date = doc.metadata.date;

  return fixedDoc;
}
