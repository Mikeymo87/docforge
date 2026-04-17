import puppeteer from 'puppeteer';

let browserInstance = null;

async function getBrowser() {
  if (!browserInstance || !browserInstance.connected) {
    browserInstance = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }
  return browserInstance;
}

export async function renderPdf(htmlString, options = {}) {
  const {
    format = 'Letter',
    landscape = false,
    margin = { top: '0.25in', bottom: '0.25in', left: '0.25in', right: '0.25in' },
  } = options;

  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setContent(htmlString, { waitUntil: 'networkidle0', timeout: 30000 });

    const pdfBuffer = await page.pdf({
      format,
      landscape,
      printBackground: true,
      preferCSSPageSize: false,
      margin,
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await page.close();
  }
}

export async function closeBrowser() {
  if (browserInstance && browserInstance.connected) {
    await browserInstance.close();
    browserInstance = null;
  }
}
