import { marked } from 'marked';

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function parseMarkdown(content) {
  const tokens = marked.lexer(content);
  const sections = [];
  const metadata = {
    title: '',
    subtitle: '',
    author: '',
    date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    org: 'Baptist Health',
    confidentiality: 'Internal Use Only',
    sourceFormat: 'markdown',
  };

  let foundTitle = false;
  let foundSubtitle = false;

  for (const token of tokens) {
    switch (token.type) {
      case 'heading': {
        if (!foundTitle && token.depth === 1) {
          metadata.title = token.text;
          foundTitle = true;
        } else if (!foundSubtitle && token.depth === 2 && sections.length === 0) {
          metadata.subtitle = token.text;
          foundSubtitle = true;
        } else {
          sections.push({
            type: 'heading',
            level: token.depth,
            text: token.text,
            id: slugify(token.text),
          });
        }
        break;
      }
      case 'paragraph': {
        const text = token.text?.trim();
        if (text) sections.push({ type: 'paragraph', text });
        break;
      }
      case 'list': {
        sections.push({
          type: 'list',
          ordered: token.ordered,
          items: token.items.map(i => i.text),
        });
        break;
      }
      case 'table': {
        sections.push({
          type: 'table',
          headers: token.header.map(h => h.text),
          rows: token.rows.map(row => row.map(cell => cell.text)),
        });
        break;
      }
      case 'blockquote': {
        const innerText = token.tokens
          ?.map(t => t.text || t.raw || '')
          .join(' ')
          .trim();
        sections.push({ type: 'blockquote', text: innerText || token.raw.replace(/^>\s*/gm, '').trim() });
        break;
      }
      case 'code': {
        sections.push({
          type: 'code',
          language: token.lang || '',
          text: token.text,
        });
        break;
      }
      case 'hr': {
        // Skip consecutive HRs
        if (sections.length === 0 || sections[sections.length - 1].type !== 'hr') {
          sections.push({ type: 'hr' });
        }
        break;
      }
      case 'space':
      case 'html':
        break;
      default:
        if (token.raw && token.raw.trim()) {
          sections.push({ type: 'paragraph', text: token.raw.trim() });
        }
        break;
    }
  }

  // Remove leading/trailing HRs
  while (sections.length > 0 && sections[0].type === 'hr') sections.shift();
  while (sections.length > 0 && sections[sections.length - 1].type === 'hr') sections.pop();

  if (!metadata.title && sections.length > 0) {
    const firstHeading = sections.find(s => s.type === 'heading');
    if (firstHeading) {
      metadata.title = firstHeading.text;
      sections.splice(sections.indexOf(firstHeading), 1);
    } else {
      metadata.title = 'Untitled Document';
    }
  }

  return { metadata, sections };
}
