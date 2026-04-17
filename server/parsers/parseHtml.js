import * as cheerio from 'cheerio';
import { parseMarkdown } from './parseMarkdown.js';

export function parseHtml(content) {
  const $ = cheerio.load(content);

  // Remove script/style noise
  $('script, style, nav, footer, header').remove();

  const lines = [];

  // Walk body elements in document order and convert to markdown
  $('body *').each((_, el) => {
    const tag = el.tagName?.toLowerCase();
    if (!tag) return;

    // Only process direct block-level elements to avoid double-processing nested content
    const parent = el.parent?.tagName?.toLowerCase();
    const blockTags = ['h1','h2','h3','h4','h5','h6','p','li','blockquote','pre','td','th','tr','thead','tbody','table'];
    if (!blockTags.includes(tag)) return;

    const text = $(el).text().trim();
    if (!text) return;

    if (tag === 'h1') lines.push(`# ${text}`);
    else if (tag === 'h2') lines.push(`## ${text}`);
    else if (tag === 'h3') lines.push(`### ${text}`);
    else if (tag === 'h4') lines.push(`#### ${text}`);
    else if (tag === 'h5' || tag === 'h6') lines.push(`##### ${text}`);
    else if (tag === 'p' && !['li','blockquote','td','th'].includes(parent)) lines.push(text);
    else if (tag === 'li') lines.push(`- ${text}`);
    else if (tag === 'blockquote') lines.push(`> ${text}`);
    else if (tag === 'pre') lines.push('```\n' + text + '\n```');
  });

  // Handle tables separately for proper markdown table output
  $('table').each((_, table) => {
    const headers = [];
    $(table).find('thead th, thead td').each((_, th) => headers.push($(th).text().trim()));

    // If no explicit thead, treat the first row as the header
    if (!headers.length) {
      const firstRow = $(table).find('tr').first();
      firstRow.find('th, td').each((_, cell) => headers.push($(cell).text().trim()));
    }

    if (headers.length) {
      lines.push('');
      lines.push(`| ${headers.join(' | ')} |`);
      lines.push(`| ${headers.map(() => '---').join(' | ')} |`);
      // Find all data rows: all tr elements that are NOT the header row
      const headerRow = $(table).find('thead tr').first()[0] ||
                        $(table).find('tr').first()[0];
      $(table).find('tr').each((_, tr) => {
        if (tr === headerRow) return; // skip header row
        const cells = [];
        $(tr).find('td, th').each((_, td) => cells.push($(td).text().trim()));
        if (cells.length) lines.push(`| ${cells.join(' | ')} |`);
      });
      lines.push('');
    }
  });

  const markdown = lines.join('\n\n');
  const doc = parseMarkdown(markdown || $('body').text().trim());
  doc.metadata.sourceFormat = 'html';

  // Try to grab title from <title> tag
  const pageTitle = $('title').text().trim();
  if (pageTitle && !doc.metadata.title) doc.metadata.title = pageTitle;

  return doc;
}
