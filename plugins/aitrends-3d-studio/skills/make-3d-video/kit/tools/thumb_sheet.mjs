#!/usr/bin/env node
// tools/thumb_sheet.mjs — 2.1 check rendered thumbnails and build the picking sheet (references/thumbnails.md). Run in the studio folder.
//   node tools/thumb_sheet.mjs --project projects/thumb-<slug>
// Reads build/thumbs/<id>.jpg (from `render.mjs --thumbs`) and story/shots.json ("idea" and "text" per shot).
// Writes build/thumbs/sheet.jpg: every option large with its idea, then every option at 320 px (the size it is seen at on a phone).
// Prints OK / RED per option; exit code 1 on a red line. The check measures the picture; it cannot judge the idea. Look at the sheet.
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module'; import { fileURLToPath } from 'node:url';
const arg = n => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : null; };
if (!arg('project')) { console.error('usage: node tools/thumb_sheet.mjs --project projects/thumb-<slug>'); process.exit(2); }
const proj = path.resolve(arg('project')), studio = path.resolve(arg('studio') || path.join(path.dirname(fileURLToPath(import.meta.url)), '..')), dir = path.join(proj, 'build', 'thumbs');
if (!fs.existsSync(path.join(studio, 'node_modules', 'playwright'))) { console.error(`playwright not found in ${studio}: run npm install there (Stage 2).`); process.exit(2); }
const { chromium } = createRequire(path.join(studio, 'package.json'))('playwright');
const shots = JSON.parse(fs.readFileSync(path.join(proj, 'story', 'shots.json'), 'utf8')).shots.filter(s => fs.existsSync(path.join(dir, s.id + '.jpg')));
if (!shots.length) { console.error(`no thumbnails in ${dir}. Run: node render.mjs --project ${proj} --thumbs`); process.exit(2); }
const fontFile = path.join(studio, 'node_modules', '@fontsource', 'fredoka', 'files', 'fredoka-latin-700-normal.woff2');
const font = fs.existsSync(fontFile) ? `@font-face{font-family:F;src:url(data:font/woff2;base64,${fs.readFileSync(fontFile).toString('base64')})}` : '';
const img = s => 'data:image/jpeg;base64,' + fs.readFileSync(path.join(dir, s.id + '.jpg')).toString('base64');

const browser = await chromium.launch(), page = await browser.newPage({ viewport: { width: 800, height: 600 } }); let anyRed = false; const rows = [];
for (const s of shots) {
  // brightness, colourfulness and contrast of the whole frame, and how much of it is blown out or crushed
  const m = await page.evaluate(async (src) => {
    const im = new Image(); im.src = src; await im.decode(); const c = document.createElement('canvas'); c.width = 320; c.height = 180; const g = c.getContext('2d'); g.drawImage(im, 0, 0, 320, 180);
    const d = g.getImageData(0, 0, 320, 180).data, n = d.length / 4; let l = 0, l2 = 0, sat = 0, hot = 0, dark = 0;
    for (let i = 0; i < d.length; i += 4) { const y = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]; l += y; l2 += y * y; sat += Math.max(d[i], d[i + 1], d[i + 2]) - Math.min(d[i], d[i + 1], d[i + 2]); if (y > 245) hot++; if (y < 18) dark++; }
    const mean = l / n; return { bright: Math.round(mean / 2.55), contrast: Math.round(Math.sqrt(l2 / n - mean * mean) / 2.55), vivid: Math.round(sat / n), hot: Math.round(hot / n * 100), dark: Math.round(dark / n * 100) };
  }, img(s));
  const red = [], warn = [], words = String(s.text || '').trim().split(/\s+/).filter(Boolean);
  if (words.length > 3) red.push(`text "${s.text}" has ${words.length} words: max 3`);
  if (!s.idea) warn.push('no "idea" in story/shots.json: say which moment of the script this is');
  if (m.bright < 28) red.push(`brightness ${m.bright}/100: too dark to read at small size; lift faceLight / exposure or add a light source in frame`);
  else if (m.bright < 36) warn.push(`brightness ${m.bright}/100 is low: fine for a night scene only if the hero's face is the brightest thing`);
  if (m.hot > 12) red.push(`${m.hot}% of the frame is blown out: lower rimPower / powerGlow intensity / rays`); else if (m.hot > 6) warn.push(`${m.hot}% of the frame is blown out`);
  if (m.dark > 45) warn.push(`${m.dark}% of the frame is near black`);
  if (m.contrast < 14) warn.push(`contrast ${m.contrast}: flat light; put the sun behind or beside the hero, or pick a stronger look`);
  if (m.vivid < 45) warn.push(`colourfulness ${m.vivid}: washed out`);
  if (red.length) anyRed = true; rows.push({ s, m, red, warn });
}
const cols = shots.length <= 2 ? shots.length : 2, cw = 640, ch = 360, nr = Math.ceil(shots.length / cols), smallY = 16 + nr * (ch + 60);
const W = Math.max(cols * (cw + 16) + 16, 16 + shots.length * 336), H = smallY + 180 + 56, esc = t => String(t || '').replace(/</g, '&lt;');
await page.setViewportSize({ width: W, height: H });
await page.setContent(`<style>${font}body{margin:0;background:#17142a;font-family:F,sans-serif;font-weight:700;color:#fff}.c{position:absolute}.l{font-size:21px;height:44px;line-height:44px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.bad{color:#ff8a7a}</style>`
  + rows.map((r, i) => `<div class="c" style="left:${16 + (i % cols) * (cw + 16)}px;top:${16 + Math.floor(i / cols) * (ch + 60)}px;width:${cw}px"><img src="${img(r.s)}" width="${cw}" height="${ch}"><div class="l ${r.red.length ? 'bad' : ''}">${esc(r.s.id)} · ${esc(r.s.idea)}</div></div>`).join('')
  + rows.map((r, i) => `<div class="c" style="left:${16 + i * 336}px;top:${smallY}px"><img src="${img(r.s)}" width="320" height="180"><div class="l">${esc(r.s.id)} @ 320 px</div></div>`).join(''));
await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(150);
await page.screenshot({ path: path.join(dir, 'sheet.jpg'), type: 'jpeg', quality: 90 }); await browser.close();
for (const r of rows) {
  console.log(`${r.red.length ? 'RED ' : 'OK  '} ${r.s.id}  bright ${r.m.bright}  contrast ${r.m.contrast}  vivid ${r.m.vivid}  blown ${r.m.hot}%  → ${path.join(dir, r.s.id + '.jpg')}`);
  r.red.forEach(x => console.log('   ✗ ' + x)); r.warn.forEach(x => console.log('   ! ' + x));
}
console.log(`sheet → ${path.join(dir, 'sheet.jpg')}`); process.exit(anyRed ? 1 : 0);
