#!/usr/bin/env node

import { config } from 'dotenv';
import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, basename, extname, join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __cliDir = dirname(fileURLToPath(import.meta.url));
config({ path: join(__cliDir, '..', '.env') });

import { parse } from '../server/parsers/index.js';
import { buildHTML } from '../server/renderers/htmlBuilder.js';
import { renderPdf, closeBrowser } from '../server/renderers/pdfRenderer.js';
import { qaReview } from '../server/qaAgent.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const VERSION = '1.0.0';

const program = new Command();

program
  .name('docforge')
  .description(chalk.green('DocForge') + ' — Transform documents into magazine-grade branded reports')
  .version(VERSION);

program
  .command('forge', { isDefault: true })
  .argument('[input]', 'Input file path')
  .option('-t, --template <name>', 'Template: executive-brief | full-report | magazine', 'executive-brief')
  .option('-o, --output <path>', 'Output file path')
  .option('-f, --format <type>', 'Output format: pdf | docx | both', 'pdf')
  .option('--title <text>', 'Document title (overrides auto-detected)')
  .option('--subtitle <text>', 'Document subtitle')
  .option('--doc-type <text>', 'Document type label', 'Report')
  .option('--no-footer', 'Skip footer')
  .option('--open', 'Open file after rendering')
  .action(async (input, opts) => {
    try {
      // If no input provided, go interactive
      if (!input) {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'input',
            message: 'Path to input file:',
            validate: v => existsSync(resolve(v)) || 'File not found',
          },
        ]);
        input = answers.input;
      }

      const inputPath = resolve(input);
      if (!existsSync(inputPath)) {
        console.error(chalk.red(`File not found: ${inputPath}`));
        process.exit(1);
      }

      // Read and parse
      const spinner = ora('Reading file...').start();
      const ext = extname(inputPath).toLowerCase();
      const content = ext === '.pdf' ? readFileSync(inputPath) : readFileSync(inputPath, 'utf-8');
      let doc = await parse(inputPath, content);
      spinner.succeed(`Parsed ${chalk.cyan(basename(inputPath))} — ${doc.sections.length} sections found`);

      // QA review
      const qaSpinner = ora('QA agent reviewing structure...').start();
      try {
        doc = await qaReview(doc);
        qaSpinner.succeed(`QA passed — ${doc.sections.length} sections, hierarchy fixed`);
      } catch (err) {
        qaSpinner.warn('QA review skipped: ' + err.message);
      }

      // Interactive prompts for missing options
      const prompts = [];
      if (!opts.title && !doc.metadata.title) {
        prompts.push({
          type: 'input',
          name: 'title',
          message: 'Document title:',
          default: basename(inputPath, extname(inputPath)),
        });
      }
      if (prompts.length > 0) {
        const answers = await inquirer.prompt(prompts);
        if (answers.title) opts.title = answers.title;
      }

      // Show what we're about to do
      const title = opts.title || doc.metadata.title;
      console.log('');
      console.log(chalk.green('  DocForge'));
      console.log(chalk.gray('  ─────────────────────────────'));
      console.log(`  Title:     ${chalk.white.bold(title)}`);
      if (opts.subtitle || doc.metadata.subtitle) {
        console.log(`  Subtitle:  ${chalk.gray(opts.subtitle || doc.metadata.subtitle)}`);
      }
      console.log(`  Template:  ${chalk.cyan(opts.template)}`);
      console.log(`  Format:    ${chalk.cyan(opts.format)}`);
      console.log('');

      // Build HTML
      const buildSpinner = ora('Building document...').start();
      const html = buildHTML(doc, {
        template: opts.template,
        title: opts.title,
        subtitle: opts.subtitle,
        docType: opts.docType,
        showFooter: opts.footer !== false,
      });
      buildSpinner.succeed('Document built');

      // Determine output path
      const slug = (title || 'document')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const outputDir = opts.output
        ? dirname(resolve(opts.output))
        : join(dirname(inputPath), 'output');
      if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

      // Render PDF
      if (opts.format === 'pdf' || opts.format === 'both') {
        const pdfSpinner = ora('Rendering PDF (Puppeteer)...').start();
        const pdfBuffer = await renderPdf(html);
        const pdfPath = opts.output || join(outputDir, `${slug}.pdf`);
        writeFileSync(pdfPath, pdfBuffer);
        pdfSpinner.succeed(`PDF saved: ${chalk.green(pdfPath)}`);

        if (opts.open) {
          const open = (await import('open')).default;
          await open(pdfPath);
        }
      }

      // DOCX (Phase 3 — not yet implemented)
      if (opts.format === 'docx' || opts.format === 'both') {
        console.log(chalk.yellow('  Word output coming in Phase 3'));
      }

      await closeBrowser();
      console.log('');
      console.log(chalk.green.bold('  Done.'));
      process.exit(0);
    } catch (err) {
      console.error(chalk.red(`\nError: ${err.message}`));
      await closeBrowser();
      process.exit(1);
    }
  });

program
  .command('serve')
  .description('Start the DocForge web UI')
  .option('-p, --port <number>', 'Port number', '3001')
  .action(async (opts) => {
    console.log(chalk.yellow('  Web UI coming in Phase 5'));
    // Will import and start server/index.js
  });

program.parse();
