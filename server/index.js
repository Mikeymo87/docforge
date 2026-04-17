import { config } from 'dotenv';
import express from 'express';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

// Load .env from project root
const __dirnameServer = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirnameServer, '..', '.env') });

import uploadRoute from './routes/upload.js';
import previewRoute from './routes/preview.js';
import renderRoute from './routes/render.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;
const app = express();

app.use(express.json({ limit: '200mb' }));

// API routes
app.use('/api/upload', uploadRoute);
app.use('/api/preview', previewRoute);
app.use('/api/render', renderRoute);

// Serve built React app if it exists
const distPath = join(__dirname, '..', 'client', 'dist');
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`\n  DocForge server running at http://localhost:${PORT}\n`);
});
