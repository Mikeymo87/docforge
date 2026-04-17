// Split large tables into chunks that fit on a page.
// Rough estimate: ~25 rows per letter page at standard font size.
const MAX_TABLE_ROWS = 20;

export function processPageBreaks(sections) {
  const result = [];

  for (const node of sections) {
    if (node.type === 'table' && node.rows && node.rows.length > MAX_TABLE_ROWS) {
      // Split into chunks, repeating headers
      for (let i = 0; i < node.rows.length; i += MAX_TABLE_ROWS) {
        const chunk = node.rows.slice(i, i + MAX_TABLE_ROWS);
        result.push({
          ...node,
          rows: chunk,
          continued: i > 0, // flag for template to show "(continued)"
        });
      }
    } else {
      result.push(node);
    }
  }

  return result;
}
