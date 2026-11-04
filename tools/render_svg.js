// Render SVG -> PNG bằng Playwright. Dùng: node tools/render_svg.js <dir>
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const dir = process.argv[2] || 'reports/2026-11-04/branding';
  const b = await chromium.launch();
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.svg'))) {
    const svg = fs.readFileSync(path.join(dir, f), 'utf8');
    const [, w, h] = svg.match(/width="(\d+)" height="(\d+)"/);
    const pg = await b.newPage({ viewport: { width: +w, height: +h } });
    await pg.setContent(`<body style="margin:0">${svg}</body>`);
    await pg.screenshot({ path: path.join(dir, f.replace('.svg', '.png')) });
    await pg.close();
  }
  await b.close();
})();
