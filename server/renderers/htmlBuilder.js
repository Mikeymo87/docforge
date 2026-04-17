import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import Handlebars from 'handlebars';
import { marked } from 'marked';
import {
  logoImgTag, logoDataUri,
  logoHorizontalBlack, logoHorizontalWhite,
  logoStackedBlack, logoStackedWhite,
} from '../brand/logo.js';
import { processPageBreaks } from '../utils/pageBreaks.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = join(__dirname, '..', 'templates');

// Register Handlebars helpers
Handlebars.registerHelper('ifEquals', function (a, b, options) {
  return a === b ? options.fn(this) : options.inverse(this);
});
Handlebars.registerHelper('tocIndent', function (level) {
  return (level - 2) * 20;
});
Handlebars.registerHelper('isFirst', function (index, options) {
  return index === 0 ? options.fn(this) : options.inverse(this);
});
Handlebars.registerHelper('gt', function (a, b) {
  return a > b;
});

function loadCSS(filename) {
  return readFileSync(join(TEMPLATES_DIR, filename), 'utf-8');
}

function loadTemplate(name) {
  const html = readFileSync(join(TEMPLATES_DIR, `${name}.html`), 'utf-8');
  return Handlebars.compile(html);
}

function loadCover(style) {
  if (!style || style === 'none') return null;
  const coverPath = join(TEMPLATES_DIR, 'covers', `${style}.html`);
  try {
    return readFileSync(coverPath, 'utf-8');
  } catch {
    return null;
  }
}

function prepareTemplateSections(flatSections) {
  const prepared = [];

  for (const node of flatSections) {
    switch (node.type) {
      case 'paragraph':
        prepared.push({
          ...node,
          html: marked.parseInline(node.text || ''),
        });
        break;
      case 'list':
        prepared.push({
          ...node,
          items: node.items.map(item => marked.parseInline(item)),
        });
        break;
      case 'table':
        prepared.push({
          ...node,
          headers: node.headers.map(h => marked.parseInline(h || '')),
          rows: node.rows.map(row => row.map(cell => marked.parseInline(cell || ''))),
        });
        break;
      case 'blockquote':
        prepared.push({
          ...node,
          html: marked.parseInline(node.text || ''),
        });
        break;
      default:
        prepared.push(node);
    }
  }

  return prepared;
}

// Detect a "bottom line" — last blockquote or a section titled "Bottom Line" / "Summary" / "Conclusion"
function extractBottomLine(sections) {
  const conclusionIdx = sections.findLastIndex(
    s => s.type === 'heading' && /^(bottom line|summary|conclusion|takeaway|key takeaway)/i.test(s.text)
  );

  if (conclusionIdx >= 0) {
    const removed = sections.splice(conclusionIdx);
    const textParts = removed
      .filter(s => s.type === 'paragraph')
      .map(s => s.text);
    return textParts.join(' ') || removed[0]?.text || '';
  }

  // Fall back to last blockquote
  const lastBqIdx = sections.findLastIndex(s => s.type === 'blockquote');
  if (lastBqIdx >= 0 && lastBqIdx >= sections.length - 3) {
    const bq = sections.splice(lastBqIdx, 1)[0];
    return bq.text;
  }

  return '';
}

// Generate @page CSS based on page size and orientation
function pageCSS(options) {
  const size = options.pageSize || 'Letter';
  const landscape = options.orientation === 'landscape';
  const sizeValue = landscape ? `${size} landscape` : size;

  // Page dimensions for preview simulation
  const DIMS = {
    Letter: { w: 8.5, h: 11 },
    Legal: { w: 8.5, h: 14 },
    A4: { w: 8.27, h: 11.69 },
  };
  const dim = DIMS[size] || DIMS.Letter;
  const pageW = landscape ? dim.h : dim.w;
  const pageH = landscape ? dim.w : dim.h;
  const bodyW = pageW - 0.5; // subtract 0.25in margins each side
  const bodyH = pageH - 0.5;

  return `
    @page { size: ${sizeValue}; margin: 0.75in 0.25in; }
    @page :first { margin-top: 0.25in; margin-bottom: 0.75in; }
    /* Preview: simulate pages like Word/Google Docs */
    body {
      max-width: ${pageW}in;
      margin: 0 auto;
      background: #2a2a2a;
      padding: 32px 0;
    }
    .page {
      background: #fff;
      min-height: ${pageH}in;
      width: ${pageW}in;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      margin: 0 auto 32px;
      border-radius: 4px;
      padding-bottom: 24px;
    }
    /* Cover pages */
    .cover-dark, .cover-gradient, .cover-minimal {
      width: ${pageW}in;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      margin: 0 auto 32px;
      border-radius: 4px;
      overflow: hidden;
    }
    @media print {
      body { background: #fff; padding: 0; }
      .page { box-shadow: none; margin-bottom: 0; border-radius: 0; width: 100%; }
      .cover-dark, .cover-gradient, .cover-minimal { box-shadow: none; margin-bottom: 0; border-radius: 0; width: 100%; }
    }
  `;
}

export function buildHTML(doc, options = {}) {
  const {
    template = 'executive-brief',
    showHeader = true,
    showFooter = true,
    docType = 'Report',
  } = options;

  const baseCSS = loadCSS('base.css');
  const compiledTemplate = loadTemplate(template);

  // Work on a copy so we don't mutate the original
  const sections = [...doc.sections];
  const bottomLine = extractBottomLine(sections);
  const withBreaks = processPageBreaks(sections);
  const prepared = prepareTemplateSections(withBreaks);

  const pageSizeCSS = pageCSS(options);

  // Build TOC from headings with estimated page numbers
  const hasCoverPage = options.coverStyle && options.coverStyle !== 'none';
  let pageEstimate = hasCoverPage ? 3 : 2; // cover + TOC + first content page, or TOC + first
  let contentCount = 0;
  const toc = [];
  for (const s of prepared) {
    if (s.type === 'heading' && s.level <= 3) {
      if (s.level === 2 && toc.length > 0) {
        pageEstimate++; // each major section roughly adds a page
      }
      toc.push({ level: s.level, text: s.text, id: s.id, page: pageEstimate });
    }
    contentCount++;
  }

  // Find first blockquote for pull-quote usage in magazine template
  const firstBlockquote = prepared.find(s => s.type === 'blockquote');

  // Cover page — independent of template
  const coverStyle = options.coverStyle || 'none';
  const coverRaw = loadCover(coverStyle);
  const coverHtml = coverRaw ? Handlebars.compile(coverRaw)({
    logoImg: logoImgTag(24),
    logoImgLg: logoImgTag(48),
    logoDataUri,
    title: options.title || doc.metadata.title || 'Untitled Document',
    subtitle: options.subtitle || doc.metadata.subtitle || '',
    date: options.date || doc.metadata.date || '',
    org: doc.metadata.org || 'Baptist Health',
    docType,
    confidentiality: doc.metadata.confidentiality || 'Internal Use Only',
  }) : '';

  const data = {
    baseCSS: baseCSS + '\n' + pageSizeCSS,
    coverHtml,
    hasCover: !!coverHtml,
    logoImg: logoImgTag(24),
    logoImgLg: logoImgTag(72),
    logoDataUri,
    logoHorizWhite: logoHorizontalWhite(28),
    logoHorizBlack: logoHorizontalBlack(28),
    logoHorizWhiteLg: logoHorizontalWhite(40),
    logoHorizBlackLg: logoHorizontalBlack(36),
    logoStackedWhite: logoStackedWhite(44),
    logoStackedBlack: logoStackedBlack(44),
    title: options.title || doc.metadata.title || 'Untitled Document',
    subtitle: options.subtitle || doc.metadata.subtitle || '',
    date: options.date || doc.metadata.date || '',
    org: doc.metadata.org || 'Baptist Health',
    docType,
    confidentiality: doc.metadata.confidentiality || 'Internal Use Only',
    sections: prepared,
    toc,
    hasToc: toc.length >= 3,
    bottomLine,
    pullQuote: firstBlockquote?.html || firstBlockquote?.text || '',
    footnote: showFooter
      ? `Generated by DocForge · ${doc.metadata.org} · ${doc.metadata.date}`
      : '',
  };

  return compiledTemplate(data);
}
