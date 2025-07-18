const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');

const app = express();
const PORT = 3003;

// Enable CORS and JSON body parsing
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check route
app.get('/', (req, res) => {
  res.send('🚀 PDF Server is up and running!');
});

// PDF generation route
app.post('/generate-pdf', async (req, res) => {
  try {
    const { html, css } = req.body;

    // Combine HTML + CSS
    const fullHtml = `
      <html>
        <head>
          <meta charset="UTF-8">
          <style>${css}</style>
        </head>
        <body>${html}</body>
      </html>
    `;

    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' }
    });

    await browser.close();

    res.set('Content-Type', 'application/pdf');
    res.send(pdfBuffer);
  } catch (err) {
    console.error('PDF generation error:', err);
    res.status(500).send('PDF generation failed');
  }
});

// Optional test trigger route
app.post('/generate-pdf-trigger', (req, res) => {
  const { html, css, fileName } = req.body;
  const script = `
    <script>
      window.generatePdfFromSalesforce(\`${html}\`, \`${css}\`, \`${fileName}\`);
    <\/script>
  `;
  res.send(`<html><body>${script}</body></html>`);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 PDF Server is running at http://localhost:${PORT}`);
});
