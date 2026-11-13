#!/usr/bin/env node
// new_thumb_project.mjs — start a cinematic thumbnail project inside the aiTrends 3D studio from the kit's template.
//   node new_thumb_project.mjs --slug borrow-strength [--script path/to/script.txt] [--studio D:/aitrends-3d-studio]
// Creates <studio>/projects/thumb-<slug>/ (config.json, story/shots.json, scenes/cast.js, scenes/_thumb.js, scenes/shots/thumbs.js, input/script.txt).
// An existing project keeps its shots and cast; only scenes/_thumb.js is refreshed to the kit's version.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), arg = n => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : null; };
const slug = arg('slug'), studio = path.resolve(arg('studio') || process.env.AITRENDS_STUDIO || 'D:/aitrends-3d-studio');
if (!slug) { console.error('usage: node new_thumb_project.mjs --slug <video-slug> [--script <script.txt>] [--studio <studio folder>]'); process.exit(2); }
if (!fs.existsSync(path.join(studio, 'render.mjs')) || !fs.existsSync(path.join(studio, 'engine', 'cine20.js'))) { console.error(`"${studio}" is not an aiTrends 3D studio 2.0+ (render.mjs and engine/cine20.js are needed). Pass --studio.`); process.exit(2); }
const dst = path.join(studio, 'projects', 'thumb-' + slug.replace(/^thumb-/, '')), tpl = path.join(HERE, 'template'), fresh = !fs.existsSync(dst);
if (fresh) fs.cpSync(tpl, dst, { recursive: true }); else fs.copyFileSync(path.join(tpl, 'scenes', '_thumb.js'), path.join(dst, 'scenes', '_thumb.js'));
const script = arg('script'); if (script) { fs.mkdirSync(path.join(dst, 'input'), { recursive: true }); fs.copyFileSync(path.resolve(script), path.join(dst, 'input', 'script.txt')); }
console.log(`${fresh ? 'created' : 'kept (helpers refreshed)'} ${dst}`);
console.log(`render: node render.mjs --project projects/${path.basename(dst)} --thumbs   (run in ${studio})`);
