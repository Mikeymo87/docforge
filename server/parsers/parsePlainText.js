function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// Only treat ALL CAPS as a heading if it looks like a real section title:
// - At least 2 words (or a known pattern like "SECTION 1")
// - Not just a data label like "ZIP" or "TOTAL"
// - Preceded by a blank line (which means it starts a new block)
function isLikelyHeading(trimmed, prevWasBlank) {
  if (!prevWasBlank) return false;
  if (trimmed.length < 5 || trimmed.length > 100) return false;
  // Must be ALL CAPS with at least one letter
  if (trimmed !== trimmed.toUpperCase() || !/[A-Z]/.test(trimmed)) return false;
  // Must have at least 2 words (to filter out "ZIP", "TOTAL", etc.)
  const words = trimmed.split(/\s+/).filter(w => w.length > 0);
  if (words.length < 2) return false;
  // Skip if it looks like data (starts with a number, contains lots of numbers/symbols)
  if (/^\d/.test(trimmed)) return false;
  if ((trimmed.match(/\d/g) || []).length > trimmed.length * 0.3) return false;
  // Skip common table headers that get extracted as lines
  if (/^(ZIP|TOTAL|COUNT|PERCENT|NUMBER|AMOUNT)\b/.test(trimmed) && words.length <= 3) return false;
  return true;
}

export function parsePlainText(content) {
  const lines = content.split(/\r?\n/);
  const sections = [];
  const metadata = {
    title: '',
    subtitle: '',
    author: '',
    date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    org: 'Baptist Health',
    confidentiality: 'Internal Use Only',
    sourceFormat: 'plaintext',
  };

  let i = 0;

  // Skip leading blank lines
  while (i < lines.length && !lines[i].trim()) i++;

  // First non-empty line = title
  if (i < lines.length) {
    metadata.title = lines[i].trim().replace(/^#+\s*/, '');
    i++;
    // Skip underline if present (=== or ---)
    if (i < lines.length && /^[=\-]{3,}$/.test(lines[i].trim())) i++;
    // Skip blank lines after title
    while (i < lines.length && !lines[i].trim()) i++;
    // Second line could be subtitle if short and followed by blank
    if (i < lines.length && lines[i].trim().length < 100 && (i + 1 >= lines.length || !lines[i + 1]?.trim())) {
      metadata.subtitle = lines[i].trim().replace(/^#+\s*/, '');
      i++;
    }
  }

  let buffer = [];
  let prevWasBlank = true;

  function flushBuffer() {
    const text = buffer.join(' ').trim();
    if (text) {
      sections.push({ type: 'paragraph', text });
    }
    buffer = [];
  }

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Blank line — flush paragraph
    if (!trimmed) {
      flushBuffer();
      prevWasBlank = true;
      i++;
      continue;
    }

    // Underlined heading (next line is === or ---)
    if (i + 1 < lines.length && /^[=]{3,}$/.test(lines[i + 1].trim())) {
      flushBuffer();
      sections.push({ type: 'heading', level: 1, text: trimmed, id: slugify(trimmed) });
      i += 2;
      prevWasBlank = false;
      continue;
    }
    if (i + 1 < lines.length && /^[-]{3,}$/.test(lines[i + 1].trim())) {
      flushBuffer();
      sections.push({ type: 'heading', level: 2, text: trimmed, id: slugify(trimmed) });
      i += 2;
      prevWasBlank = false;
      continue;
    }

    // ALL CAPS heading — conservative detection
    if (isLikelyHeading(trimmed, prevWasBlank)) {
      flushBuffer();
      sections.push({ type: 'heading', level: 2, text: titleCase(trimmed), id: slugify(trimmed) });
      i++;
      prevWasBlank = false;
      continue;
    }

    // Bullet list
    if (/^[\-\*\u2022\u2013\u2014]\s+/.test(trimmed)) {
      flushBuffer();
      const items = [];
      while (i < lines.length && /^[\-\*\u2022\u2013\u2014]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[\-\*\u2022\u2013\u2014]\s+/, ''));
        i++;
      }
      sections.push({ type: 'list', ordered: false, items });
      prevWasBlank = false;
      continue;
    }

    // Numbered list
    if (/^\d+[\.\)]\s+/.test(trimmed)) {
      flushBuffer();
      const items = [];
      while (i < lines.length && /^\d+[\.\)]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+[\.\)]\s+/, ''));
        i++;
      }
      sections.push({ type: 'list', ordered: true, items });
      prevWasBlank = false;
      continue;
    }

    // Regular text — accumulate into paragraph (join with space, not newline)
    buffer.push(trimmed);
    prevWasBlank = false;
    i++;
  }

  flushBuffer();

  if (!metadata.title) metadata.title = 'Untitled Document';

  return { metadata, sections };
}

function titleCase(str) {
  const small = new Set(['a','an','and','as','at','but','by','for','in','nor','of','on','or','so','the','to','up','yet']);
  return str
    .toLowerCase()
    .split(/\s+/)
    .map((w, i) => (i === 0 || !small.has(w)) ? w.charAt(0).toUpperCase() + w.slice(1) : w)
    .join(' ');
}
