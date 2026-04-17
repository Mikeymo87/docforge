import { Router } from 'express';
import { buildHTML } from '../renderers/htmlBuilder.js';
import { renderPdf } from '../renderers/pdfRenderer.js';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { doc, options, format = 'pdf' } = req.body;

    if (!doc || !doc.sections) {
      return res.status(400).json({ error: 'Missing document data' });
    }

    const html = buildHTML(doc, options || {});

    if (format === 'pdf' || format === 'preview') {
      const pdfOpts = {
        format: options?.pageSize || 'Letter',
        landscape: options?.orientation === 'landscape',
      };
      const pdfBuffer = await renderPdf(html, pdfOpts);
      const slug = (doc.metadata?.title || 'document')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const disposition = format === 'preview'
        ? 'inline'
        : `attachment; filename="BH-${slug}.pdf"`;

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': disposition,
        'Content-Length': pdfBuffer.length,
      });
      return res.send(pdfBuffer);
    }

    if (format === 'docx') {
      return res.status(501).json({ error: 'Word export coming in Phase 3' });
    }

    res.status(400).json({ error: `Unknown format: ${format}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
