# DocForge — Document Beautification Engine

## Project Summary
Standalone tool that transforms ugly documents (txt, md, docx, pdf, html) into magazine-grade, Baptist Health branded PDFs and Word documents. Two modes: CLI (`docforge file.md`) and Web UI (`docforge serve`).

- **User:** Michael Mora — not a coder; plain English only
- **Project folder:** `/Users/michaelmora/Desktop/Claude/DocForge/`
- **Dev server:** `npm run dev` (Express on 3001 + Vite on 5173)
- **GitHub:** https://github.com/Mikeymo87/docforge

## Tech Stack
Node.js · Express · Puppeteer (PDF) · docx (Word) · Handlebars (templates) · React + Vite (web UI) · Anthropic SDK (QA + merge agents)

## Brand Colors (Baptist Health — hardcoded, do not change)
- `#2EA84A` Green — primary accent, dividers, bullets
- `#25282A` Black — headings, dark backgrounds
- `#7DE69B` Mint — highlights, table headers, subtitles
- `#59BEC9` Turquoise — secondary accent
- `#FFFFFF` White — body backgrounds

## Architecture
```
INPUT → Parser → QA Agent (Claude) → Document AST → HTML Builder (+ template + cover) → Renderer → OUTPUT
```

## Key Directories
- `server/parsers/` — format-specific parsers, all output the same AST
- `server/templates/` — Handlebars HTML + CSS templates
- `server/templates/covers/` — independent cover page partials (dark, gradient, minimal)
- `server/renderers/` — pdfRenderer (Puppeteer), docxRenderer (docx lib), htmlBuilder
- `server/brand/` — colors, fonts, logo constants
- `server/qaAgent.js` — Claude-powered QA that fixes heading hierarchy on every upload
- `server/mergeAgent.js` — Claude-powered multi-doc merger
- `bin/docforge.js` — CLI entry point
- `client/` — React web UI

## Templates
1. **executive-brief** — clean corporate, single-column, dark header (default)
2. **full-report** — cover page + TOC with page numbers + running headers + body
3. **magazine** — editorial layout (NEEDS WORK — see TODO)

## Cover Pages (independent of template)
- **none** — no cover
- **dark** — black background, title bottom-left, green accent bar
- **gradient** — dark-to-green gradient, pineapple watermark
- **minimal** — white centered, clean divider

## Commands
- `npm run dev` — web UI + hot reload (Express 3001 + Vite 5173)
- `npm run forge -- file.md` — CLI mode
- `npm run serve` — web UI only (production)

## AI Agents
- **QA Agent** (`qaAgent.js`): Runs on every upload. Fixes heading hierarchy, promotes sections, removes duplicates, cleans PDF extraction artifacts. Uses Claude Sonnet.
- **Merge Agent** (`mergeAgent.js`): Reads all uploaded docs and creates a single cohesive document. Eliminates redundancy, writes transitions, preserves all data. Uses Claude Sonnet.

## API Key
`.env` file with `ANTHROPIC_API_KEY` — same key as AI Pulse Dashboard. DO NOT commit.

---

## PICK UP HERE — Next Session TODO

### CRITICAL — Magazine/Editorial Template is Broken
The magazine template looks terrible and needs a complete redesign:
1. **Drop cap broken** — fires on every h2 section (should be first only). Text doesn't wrap properly around the drop cap letter — looks like a giant bullet point instead of editorial. Fix: use `.mag-body > h2:first-of-type + p::first-letter` with `font-size: 64px; line-height: 1;` so text wraps 3+ lines
2. **Missing features from plan:**
   - Hanging section numbers (01, 02, 03 in green above each h2)
   - Two-column body text (paragraphs in two columns, headings span full width)
   - Section cover bands (full-width dark/green alternating bands behind h2 headings)
   - Key stat sidebar boxes (auto-detect numbers, float dark callout boxes)
   - Source strips under tables
3. **Overall visual quality** is far below the Executive Brief — needs the same level of polish

### Other TODO
- Page numbers in PDF footer (Puppeteer `displayHeaderFooter` + `footerTemplate`)
- Landscape mode needs testing — should just swap width/height
- DOCX renderer (Phase 3 — not started, `docx` library is installed)
- Remaining parsers: .docx input (mammoth), .html input (cheerio)
- FeedbackChat component (keyword-based change requests in web UI)
- Word output button (currently disabled in UI)

### What Works Well
- Executive Brief template — clean, professional output
- Full Report template — cover + TOC with page numbers + running header/footer
- QA Agent — properly fixes heading hierarchy on PDFs and text files
- Merge Agent — AI combines multiple docs into cohesive single doc
- Web UI — drag-and-drop, paste text, merge mode, live preview, template/cover switching
- CLI — fully functional with interactive prompts
- Dark UI with page-spaced preview like Word/Google Docs
- Tables fit page width with `table-layout: fixed`

---

## To Continue in a New Session
Say: **"continue with DocForge where we left off"**
Claude will read this file + memory and know exactly what to do.
