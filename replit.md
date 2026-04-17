# DocForge - Document Beautification Engine

## Overview
DocForge transforms plain or poorly formatted documents (TXT, MD, DOCX, PDF, HTML) into professional, branded PDF reports and Word documents. It targets Baptist Health brand identity with consistent styling.

## Tech Stack
- **Frontend:** React 18 + Vite (port 5000)
- **Backend:** Node.js + Express (port 3001)
- **AI:** Anthropic Claude Sonnet (via `ANTHROPIC_API_KEY`) for QA and merge agents
- **PDF Rendering:** Puppeteer
- **DOCX:** docx + mammoth libraries
- **Templating:** Handlebars

## Project Structure
- `/bin` — CLI entry point (`docforge.js`)
- `/client` — React frontend source
  - `/src/components` — UploadZone, PreviewPane, OptionsPanel
  - `/src/hooks` — useDocForge.js
- `/server` — Express backend
  - `/parsers` — Input format converters (PDF, DOCX, MD → AST)
  - `/renderers` — AST → HTML → PDF/DOCX
  - `/templates` — Handlebars templates (executive-brief, full-report, magazine)
  - `/routes` — Express API endpoints (upload, preview, render)
  - `qaAgent.js` — AI-powered quality assurance
  - `mergeAgent.js` — AI-powered document merging
- `/assets` — Brand SVG logos and watermarks

## Environment Variables
- `ANTHROPIC_API_KEY` — Required for AI features (QA agent, merge agent)

## Running the App
- **Development:** `npm run dev` — starts both backend and frontend concurrently
- **Backend only:** `npm run start` or `npm run serve`
- **CLI tool:** `npm run forge`
- **Build frontend:** `npm run build`

## Ports
- Frontend (Vite dev server): **5000**
- Backend (Express API): **3001**

## Deployment
- Build command: `npm run build`
- Run command: `node server/index.js`
- The built React app is served statically by the Express server from `client/dist`
