#!/usr/bin/env node
// tools/new_thumbs.mjs — 2.1 start the cinematic thumbnail project of a video (references/thumbnails.md). Run in the studio folder.
//   node tools/new_thumbs.mjs --project projects/<slug>            thumbnails of that video: same cast (re-exported), its script and title
//   node tools/new_thumbs.mjs --slug <name> [--script script.txt]   thumbnails with no video project (an old video, a script only)
// Creates projects/thumb-<slug>/ from examples/thumb-cine: config.json, story/shots.json, scenes/cast.js, scenes/shots/thumbs.js,
// input/script.txt. An existing thumbnail project is left as it is.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), arg = n => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : null; };
const video = arg('project') ? path.resolve(arg('project')) : null, slug = (arg('slug') || (video && path.basename(video)) || '').replace(/^thumb-/, '');
if (!slug) { console.error('usage: node tools/new_thumbs.mjs --project projects/<slug>   |   --slug <name> [--script <script.txt>]'); process.exit(2); }
if (video && !fs.existsSync(path.join(video, 'config.json'))) { console.error(`not a project: ${video}`); process.exit(2); }
const tpl = path.join(ROOT, 'examples', 'thumb-cine'), dst = path.join(ROOT, 'projects', 'thumb-' + slug), rel = p => path.relative(ROOT, p).split(path.sep).join('/');
if (fs.existsSync(dst)) { console.log(`kept ${rel(dst)} (already there)`); process.exit(0); }
fs.cpSync(tpl, dst, { recursive: true, filter: p => !/[\\/]build([\\/]|$)/.test(p) });
const cfgPath = path.join(dst, 'config.json'), cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
let script = arg('script') ? path.resolve(arg('script')) : null;
if (video) {
  const vc = JSON.parse(fs.readFileSync(path.join(video, 'config.json'), 'utf8')); cfg.title = 'Thumbnails: ' + (vc.title || slug); if (vc.palette) cfg.palette = vc.palette;
  if (!script) { const s = path.join(video, vc.script || 'input/script.txt'); if (fs.existsSync(s) && fs.statSync(s).isFile()) script = s; }
  // the video's own cast, so every face and outfit is the one in the video (the video project must sit inside this studio)
  if (fs.existsSync(path.join(video, 'scenes', 'cast.js')) && !rel(video).startsWith('..'))
    fs.writeFileSync(path.join(dst, 'scenes', 'cast.js'), `// The cast of the video, unchanged. Add roster extras for thumbnails below if a moment needs them.\nexport * from '/${rel(video)}/scenes/cast.js';\n`);
} else cfg.title = 'Thumbnails: ' + slug;
fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 1) + '\n');
if (script) { fs.mkdirSync(path.join(dst, 'input'), { recursive: true }); fs.copyFileSync(script, path.join(dst, 'input', 'script.txt')); }
console.log(`created ${rel(dst)}${video ? ` (cast from ${rel(video)})` : ''}${script ? ', script copied' : ''}`);
console.log(`edit story/shots.json and scenes/shots/thumbs.js, then:\n  node render.mjs --project ${rel(dst)} --qc\n  node render.mjs --project ${rel(dst)} --thumbs\n  node tools/thumb_sheet.mjs --project ${rel(dst)}`);
