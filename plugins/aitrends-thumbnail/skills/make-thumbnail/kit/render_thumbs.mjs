#!/usr/bin/env node
// render_thumbs.mjs — render a thumbnail spec to JPGs (1280×720), a contact sheet and a rule check.
//   node render_thumbs.mjs --spec <spec.mjs> [--out <dir>] [--studio <folder with node_modules/playwright>] [--only A,C]
// Spec (ES module, default export):
//   { title: 'video title', out: 'optional output dir', options: [
//       { name: 'A', idea: 'one line: which moment of the script and why', bigText: 'oh yeah.' | '', bg: 'sun' | 'sky' | 'candy' | 'royal' | 'mint' | 'fire' | { c1, c2, rays, raysAt }, under: (K) => '', draw: (K) => '<svg body>' },
//   ] }
// Exit code 1 when a rule check is red; the JPGs are still written so they can be looked at.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath, pathToFileURL } from 'node:url'; import { createRequire } from 'node:module';
import * as K from './thumb_kit.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const arg = n => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : null; };
const specPath = arg('spec'); if (!specPath) { console.error('usage: node render_thumbs.mjs --spec <spec.mjs> [--out <dir>] [--studio <dir>] [--only A,C]'); process.exit(2); }

function loadPlaywright() {
  const tried = [];
  for (const dir of [arg('studio'), process.env.AITRENDS_STUDIO, process.cwd(), path.dirname(path.resolve(specPath)), 'D:/aitrends-3d-studio', 'D:/AI_youtube/aitrends-2d-studio'].filter(Boolean)) {
    let d = path.resolve(dir);
    for (let i = 0; i < 6; i++) {
      tried.push(d);
      if (fs.existsSync(path.join(d, 'node_modules', 'playwright'))) return createRequire(path.join(d, 'package.json'))('playwright');
      const up = path.dirname(d); if (up === d) break; d = up;
    }
  }
  console.error('playwright not found. Pass --studio <folder that has node_modules/playwright> (the aiTrends studio folder), or run `npm i playwright` next to the spec.\nLooked in:\n  ' + [...new Set(tried)].join('\n  ')); process.exit(2);
}

const spec = (await import(pathToFileURL(path.resolve(specPath)).href)).default;
const outDir = path.resolve(arg('out') || spec.out || path.join(path.dirname(path.resolve(specPath)), 'out')); fs.mkdirSync(outDir, { recursive: true });
const only = arg('only') ? arg('only').split(',') : null;
const font = 'data:font/woff2;base64,' + fs.readFileSync(path.join(HERE, 'fonts', 'fredoka-latin-700-normal.woff2')).toString('base64');
const css = `<style>@font-face{font-family:F;src:url(${font})}html,body{margin:0;background:#fff}svg text{font-family:F,sans-serif;font-weight:700}</style>`;

// ---- rule check on the drawn SVG (rules: references/thumbnail_rules.md)
function check(o, svg) {
  const red = [], warn = [];
  const heroes = [...svg.matchAll(/data-k="hero" data-expr="(\w+)" data-s="([\d.]+)"/g)].map(m => ({ expr: m[1], s: +m[2] }));
  if (!heroes.length) red.push('no hero (rule 1)');
  else {
    const main = heroes.reduce((a, b) => (b.s > a.s ? b : a));
    if (!['smug', 'grin', 'wink'].includes(main.expr)) red.push(`main hero face is "${main.expr}": must be smug, grin or wink (rule 1)`);
    if (main.s < 1.3) warn.push(`main hero scale ${main.s} is small: aim for 1.4–1.8 so the hero fills 1/3–1/2 of the frame (rule 4)`);
  }
  if (!/data-k="ui"/.test(svg)) red.push('no game-UI layer: add a label, bar, pill, ring, panel, cmd or meter (rule 2)');
  if (!/data-k="mate"/.test(svg) && heroes.length < 2) red.push('nobody reacts to the hero: add a roster character or a crowd (rule 3)');
  const words = (o.bigText || '').trim().split(/\s+/).filter(Boolean);
  if (words.length > 3) red.push(`big text "${o.bigText}" has ${words.length} words: max 3 (rule 5)`);
  const bigs = [...svg.matchAll(/data-k="text"/g)].length;
  if (bigs > 2) warn.push(`${bigs} big text blocks: keep one phrase (rule 5)`);
  if (spec.title && o.bigText && spec.title.toLowerCase().includes(o.bigText.toLowerCase().replace(/[.?!]+$/, '')) && words.length > 1) warn.push('big text repeats the title (rule 5)');
  return { red, warn };
}

const { chromium } = loadPlaywright();
const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const done = []; let anyRed = false;
for (const o of spec.options) {
  if (only && !only.includes(o.name)) continue;
  const svg = K.frame(o.draw(K), (typeof o.bg === 'string' ? K.BG[o.bg] : o.bg) || K.BG.sun, o.under ? o.under(K) : '');
  const file = path.join(outDir, `Thumbnail_${o.name}.jpg`);
  await page.setContent(css + svg); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(150);
  const buf = await page.screenshot({ path: file, type: 'jpeg', quality: 92 });
  // brightness and colourfulness of the finished picture (rule 4)
  const m = await page.evaluate(async (src) => { const im = new Image(); im.src = src; await im.decode(); const c = document.createElement('canvas'); c.width = 160; c.height = 90; const g = c.getContext('2d'); g.drawImage(im, 0, 0, 160, 90); const d = g.getImageData(0, 0, 160, 90).data; let l = 0, sat = 0; for (let i = 0; i < d.length; i += 4) { const mx = Math.max(d[i], d[i + 1], d[i + 2]), mn = Math.min(d[i], d[i + 1], d[i + 2]); l += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]; sat += mx - mn; } const n = d.length / 4; return { bright: Math.round(l / n / 2.55), vivid: Math.round(sat / n) }; }, 'data:image/jpeg;base64,' + buf.toString('base64'));
  const r = check(o, svg);
  if (m.bright < 45) r.red.push(`picture brightness ${m.bright}/100: too dark, use a brighter background (rule 4, target ≥ 55)`); else if (m.bright < 52) r.warn.push(`brightness ${m.bright}/100: target ≥ 55 (rule 4)`);
  if (m.vivid < 70) r.warn.push(`colourfulness ${m.vivid}: washed out, target ≥ 90 (rule 4)`);
  if (r.red.length) anyRed = true;
  done.push({ o, file, m, r });
}

// ---- contact sheet: every option large, then the same at 320 px (the size it is seen at on a phone)
if (done.length) {
  const cols = done.length <= 2 ? done.length : 2, cw = 640, ch = 360, rows = Math.ceil(done.length / cols), W = cols * cw + (cols + 1) * 16, smallY = rows * (ch + 60) + 16;
  const img = d => 'data:image/jpeg;base64,' + fs.readFileSync(d.file).toString('base64');
  const html = `<style>@font-face{font-family:F;src:url(${font})}body{margin:0;background:#17142a;font-family:F,sans-serif;color:#fff}.c{position:absolute}.l{font-size:22px;height:44px;line-height:44px;white-space:nowrap;overflow:hidden}.bad{color:#ff8a7a}</style>`
    + done.map((d, i) => `<div class="c" style="left:${16 + (i % cols) * (cw + 16)}px;top:${16 + Math.floor(i / cols) * (ch + 60)}px;width:${cw}px"><img src="${img(d)}" width="${cw}" height="${ch}"><div class="l ${d.r.red.length ? 'bad' : ''}">${d.o.name} · ${String(d.o.idea || '').replace(/</g, '&lt;')}</div></div>`).join('')
    + done.map((d, i) => `<div class="c" style="left:${16 + i * 336}px;top:${smallY}px"><img src="${img(d)}" width="320" height="180"><div class="l">${d.o.name} @ 320 px</div></div>`).join('');
  const sw = Math.max(W, 16 + done.length * 336), sh = smallY + 180 + 60;
  await page.setViewportSize({ width: sw, height: sh }); await page.setContent(html); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(150);
  await page.screenshot({ path: path.join(outDir, 'thumbnails_sheet.jpg'), type: 'jpeg', quality: 90 });
}
await browser.close();

for (const d of done) {
  console.log(`${d.r.red.length ? 'RED ' : 'OK  '} ${d.o.name}  bright ${d.m.bright}  vivid ${d.m.vivid}  → ${d.file}`);
  for (const s of d.r.red) console.log('   ✗ ' + s); for (const s of d.r.warn) console.log('   ! ' + s);
}
console.log(`sheet → ${path.join(outDir, 'thumbnails_sheet.jpg')}`);
process.exit(anyRed ? 1 : 0);
