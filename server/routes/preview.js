import { Router } from 'express';
import { buildHTML } from '../renderers/htmlBuilder.js';

const router = Router();

router.post('/', (req, res) => {
  try {
    const { doc, options } = req.body;

    if (!doc || !doc.sections) {
      return res.status(400).json({ error: 'Missing document data' });
    }

    const html = buildHTML(doc, options || {});
    res.json({ success: true, html });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
