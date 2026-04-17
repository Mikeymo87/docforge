import { Router } from 'express';
import multer from 'multer';
import { extname } from 'path';
import { parse } from '../parsers/index.js';
import { mergeWithAgent } from '../mergeAgent.js';
import { qaReview } from '../qaAgent.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

const router = Router();

// Single file upload — with QA review
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { originalname, buffer } = req.file;
    const ext = extname(originalname).toLowerCase();
    const content = ext === '.pdf' ? buffer : buffer.toString('utf-8');
    let doc = await parse(originalname, content);

    // QA agent reviews and fixes structure
    const skipQA = req.query.skipqa === '1';
    if (!skipQA) {
      try {
        doc = await qaReview(doc);
      } catch (qaErr) {
        console.error('QA review failed, using raw parse:', qaErr.message);
      }
    }

    res.json({ success: true, filename: originalname, doc });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Multi-file merge upload — AI-powered (merge agent already handles structure)
router.post('/merge', upload.array('files', 20), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const docs = [];
    for (const file of req.files) {
      const ext = extname(file.originalname).toLowerCase();
      const content = ext === '.pdf' ? file.buffer : file.buffer.toString('utf-8');
      const doc = await parse(file.originalname, content);
      docs.push({ filename: file.originalname, doc });
    }

    let merged;
    try {
      merged = await mergeWithAgent(docs);
    } catch (aiErr) {
      console.error('AI merge failed, falling back to concatenation:', aiErr.message);
      merged = {
        metadata: {
          ...docs[0].doc.metadata,
          title: docs[0].doc.metadata.title || 'Merged Document',
          sourceFile: docs.map(d => d.filename).join(' + '),
          sourceFormat: 'merged',
        },
        sections: [],
      };
      for (let i = 0; i < docs.length; i++) {
        if (i > 0) {
          merged.sections.push({ type: 'hr' });
          if (docs[i].doc.metadata.title) {
            merged.sections.push({
              type: 'heading', level: 2,
              text: docs[i].doc.metadata.title,
              id: `doc-${i}`,
            });
          }
        }
        merged.sections.push(...docs[i].doc.sections);
      }
    }

    const filenames = docs.map(d => d.filename).join(', ');
    res.json({
      success: true,
      filename: filenames,
      fileCount: docs.length,
      doc: merged,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
