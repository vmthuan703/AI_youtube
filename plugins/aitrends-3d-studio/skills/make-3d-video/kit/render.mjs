// render.mjs — deterministic frame renderer (headless Chromium + Three.js -> ffmpeg), parallel workers.
//   node render.mjs --project projects/my-video                      full video  -> build/video_silent.mp4
//   node render.mjs --project P --from 30 --to 45 --scale 0.5         preview a range
//   node render.mjs --project P --sheet                               one still per shot -> build/sheets/*.png
//   node render.mjs --project P --stills 3.5,12,40                    stills at times -> build/stills
//   node render.mjs --project P --styles cinematic,ink,toon,golden,neon,noir --at 3.5,12,40   style comparison grid
//   node render.mjs --project P --bench                               time this machine (GPU or CPU) and estimate the full render
// --legacy renders with the 0.2.x look (before/after comparisons).
//   node render.mjs --project P --thumbs                              1.0.3 a 1280x720 JPG per shot + 2x2 grid (thumbnail projects)
//   node render.mjs --project P --gif [id,id]                         1.0.2 a small looping GIF per shot (build/gifs) to check motion
//   node render.mjs --catalog [id,id]                                  1.0.5 one still per ready-made set -> examples/catalog/build/sheets
//   node render.mjs --project P --qc [--every 0.5]                   1.0.2 motion QC: clipping, hidden faces, camera in walls, sliding feet, snapping joints
// Options: --workers N  --scale K  --fps N  --style ID  --quality draft|standard|high|max  --debug  --format png|jpeg  --crf N  --preset X
//          --gl auto|gpu|swiftshader  --angle d3d11|gl|vulkan|metal  --encoder auto|x264|nvenc  --out FILE  --chrome PATH
// Quality (config.json "quality", default high): draft = no anti-aliasing, fast encode; standard = FXAA, CRF 18;
// high = 4x MSAA, CRF 14 slow x264; max = 4x MSAA + 1.5x supersampling, PNG capture, CRF 10 (~2.5x slower than high). Output is H.264 High, yuv420p,
// BT.709, GOP = fps/2 — the settings YouTube recommends for uploads (pair with config fps 60 for 1080p60).
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const args = {}; { const a = process.argv.slice(2); for (let i = 0; i < a.length; i++) { if (a[i].startsWith('--')) { const k = a[i].slice(2); const v = a[i + 1] && !a[i + 1].startsWith('--') ? a[++i] : true; args[k] = v; } } }
// 1.0.5: --catalog renders one still per ready-made set (engine/catalog.json) into examples/catalog/build/sheets
if (args.catalog) { const C = JSON.parse(fs.readFileSync(path.join(ROOT, 'engine', 'catalog.json'), 'utf8')); const only = typeof args.catalog === 'string' ? new Set(args.catalog.split(',')) : null;
  const sets = C.sets; args.project = path.join(ROOT, 'examples', 'catalog'); args.sheet = true; args.only = only;   // shots.json always lists every set; --catalog id,id renders only those and keeps the other stills
  fs.writeFileSync(path.join(args.project, 'story', 'shots.json'), JSON.stringify({ title: 'catalog', duration: sets.length * 2, shots: sets.map((e, i) => ({ id: e.id, start: i * 2, end: i * 2 + 2, line: '', camera: 'manual' })) }, null, 1));
  const cf = path.join(args.project, 'config.json'), cfg = JSON.parse(fs.readFileSync(cf, 'utf8')); cfg.duration = sets.length * 2; fs.writeFileSync(cf, JSON.stringify(cfg, null, 1)); }
if (!args.project) { console.error('usage: node render.mjs --project projects/<name> [options]'); process.exit(1); }
const PROJECT = path.resolve(args.project);
const BUILD = path.join(PROJECT, 'build'); fs.mkdirSync(BUILD, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };

function listScenes(dir, base) { let out = []; if (!fs.existsSync(dir)) return out; for (const f of fs.readdirSync(dir).sort()) { const p = path.join(dir, f); if (fs.statSync(p).isDirectory()) out = out.concat(listScenes(p, `${base}/${f}`)); else if (f.endsWith('.js') && !f.startsWith('_')) out.push(`${base}/${f}`); } return out; }
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  if (url === '/__manifest') { res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); return res.end(JSON.stringify(listScenes(path.join(PROJECT, 'scenes'), '/project/scenes'))); }
  const p = url.startsWith('/project/') ? path.join(PROJECT, url.slice(9)) : path.join(ROOT, url);
  if (!(p.startsWith(ROOT) || p.startsWith(PROJECT)) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); fs.createReadStream(p).pipe(res);
}).listen(0);
const PORT = server.address().port;
// GPU: Windows/macOS use the graphics card by default (--gl auto); Linux defaults to SwiftShader (CPU) unless --gl gpu.
// GPU mode launches the full Chromium in new-headless mode (channel 'chromium'), which keeps hardware WebGL.
const gl = args.gl || (process.platform === 'linux' ? 'swiftshader' : 'auto');
const GPU_MODE = gl !== 'swiftshader';
const ANGLE = { win32: 'd3d11', darwin: 'metal', linux: 'gl' }[process.platform] || 'default';
const LAUNCH = { args: ['--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage',
  ...(GPU_MODE ? ['--enable-gpu', '--enable-gpu-rasterization', `--use-angle=${args.angle || ANGLE}`] : ['--use-angle=swiftshader'])] };
if (GPU_MODE && !args.chrome && !process.env.CHROME_PATH) LAUNCH.channel = 'chromium';
async function launch() {
  try { return await chromium.launch(LAUNCH); }
  catch (e) { if (!LAUNCH.channel) throw e; delete LAUNCH.channel; return chromium.launch(LAUNCH); }   // full Chromium missing -> headless shell
}
// Encoder: x264 (CPU, best quality per bit) or NVENC (NVIDIA hardware encoder; frees the CPU when frames render on the GPU).
// --encoder / config.json "encoder": auto (NVENC when the GPU renders and ffmpeg has it) | x264 | nvenc
function nvencWorks() { const r = spawnSync('ffmpeg', ['-hide_banner', '-v', 'error', '-f', 'lavfi', '-i', 'color=c=black:s=320x240:d=0.2', '-c:v', 'h264_nvenc', '-f', 'null', '-'], { timeout: 20000 }); return r.status === 0; }
// Browser: Playwright's own Chromium; else CHROME_PATH / --chrome; else a pre-installed one (cloud images ship /opt/pw-browsers).
{ const own = (() => { try { return chromium.executablePath(); } catch { return ''; } })();
  const pick = args.chrome || process.env.CHROME_PATH || (own && fs.existsSync(own) ? '' : findChrome());
  if (pick) LAUNCH.executablePath = pick; }
function findChrome() {
  const roots = [process.env.PLAYWRIGHT_BROWSERS_PATH, '/opt/pw-browsers', path.join(os.homedir(), '.cache', 'ms-playwright')].filter(Boolean);
  for (const r of roots) { if (!fs.existsSync(r)) continue;
    for (const d of fs.readdirSync(r).sort().reverse()) { for (const rel of ['chrome-linux/chrome', 'chrome-linux64/chrome', 'chrome-mac/Chromium.app/Contents/MacOS/Chromium', 'chrome-win/chrome.exe']) { const p = path.join(r, d, rel); if (fs.existsSync(p)) return p; } } }
  return '';
}
const CFG = JSON.parse(fs.readFileSync(path.join(PROJECT, 'config.json'), 'utf8'));
const FPS = +(args.fps || CFG.fps || 24);   // --fps overrides config.json (e.g. 30 for a quick preview of a 60 fps project)
const QUALITY = {
  draft: { crf: 23, preset: 'veryfast', ss: 1, format: 'jpeg' },
  standard: { crf: 18, preset: 'medium', ss: 1, format: 'jpeg' },
  high: { crf: 14, preset: 'slow', ss: 1, format: 'jpeg' },
  max: { crf: 10, preset: 'slower', ss: 1.5, format: 'png' },
};
const QN = QUALITY[args.quality] ? args.quality : QUALITY[CFG.quality] ? CFG.quality : 'high', Q = QUALITY[QN];
if (args.gif && !args.scale) args.scale = '0.35';
const PREVIEW = !!(args.from || args.to || (args.scale && +args.scale < 1));
const SS = PREVIEW || args.sheet || args.stills || args.styles || args.gif || args.thumbs ? 1 : +(args.ss || Q.ss);
const FORMAT = (args.format || (PREVIEW ? 'jpeg' : Q.format)) === 'jpeg' ? 'jpeg' : 'png';

async function openPlayer(browser, style) {
  const qs = new URLSearchParams(); if (args.scale) qs.set('scale', args.scale); qs.set('quality', PREVIEW && !args.quality ? 'standard' : QN); if (SS > 1) qs.set('ss', SS); if (args.fps) qs.set('fps', args.fps); if (args.palette) qs.set('palette', args.palette); if (args.legacy) qs.set('legacy', '1'); if (style || args.style) qs.set('style', style || args.style); if (args.debug) qs.set('debug', '1'); if (args.bench) qs.set('prof', '1');
  const page = await browser.newPage({ viewport: { width: 640, height: 360 } });
  page.on('pageerror', e => console.log('[pageerror]', e.message));
  page.on('console', m => { const t = m.text(); if (/ERROR|missing/i.test(t)) console.log('[page]', t); });
  await page.goto(`http://localhost:${PORT}/player.html?${qs}`);
  await page.waitForFunction('window.READY === true || !!window.BOOT_ERROR', null, { timeout: 120000 });
  const boot = await page.evaluate('window.BOOT_ERROR'); if (boot) throw new Error('Player failed to boot: ' + boot);
  if (!RENDERER) { RENDERER = await page.evaluate(() => { const c = document.createElement('canvas'); const g = c.getContext('webgl2') || c.getContext('webgl'); if (!g) return 'no WebGL'; const e = g.getExtension('WEBGL_debug_renderer_info'); return String(e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : g.getParameter(g.RENDERER)); });
    const cpu = /swiftshader|llvmpipe|software|basic render/i.test(RENDERER);
    console.log(`WebGL: ${RENDERER}  ${cpu ? '(CPU rendering — slow)' : '(GPU)'}`);
    if (cpu && GPU_MODE) console.log('  GPU not in use: update the graphics driver, try --gl gpu --angle d3d11|gl|vulkan, or --chrome "<path to Chrome>". Run with --bench to compare.'); }
  const [w, h] = await page.evaluate('window.OUT'); await page.setViewportSize({ width: w, height: h });
  return page;
}
// capture: JPEG q96 is visually lossless under x264 and ~10x faster to grab than PNG; quality max uses PNG
const shot = (page, f) => page.evaluate(i => window.renderFrame(i), f).then(() => page.screenshot({ type: FORMAT, ...(FORMAT === 'jpeg' ? { quality: 96 } : {}) }));
let OUTW = 0, OUTH = 0, RENDERER = '';
const ENCODER = (() => { const e = args.encoder || CFG.encoder || 'auto'; if (e === 'x264' || args.sheet || args.stills || args.styles || args.bench && e !== 'nvenc') return 'x264';
  if (e === 'nvenc') { if (nvencWorks()) return 'nvenc'; console.log('NVENC requested but ffmpeg cannot use it here (no NVIDIA GPU/driver, or an ffmpeg build without nvenc): using x264.'); return 'x264'; }
  return GPU_MODE && nvencWorks() ? 'nvenc' : 'x264'; })();
const NV_CQ = { draft: 28, standard: 22, high: 18, max: 15 };
const fmtT = s => `${Math.floor(s / 60)}m${String(Math.round(s % 60)).padStart(2, '0')}s`;

// --qc (1.0.2): motion QC over sampled frames (engine/qc3d.js) → build/qc_motion.json + a table. Red issues block the full render
// (renderVideo runs this first) unless --force. --every S sets the sampling step (default 0.5 s), --from/--to a range.
async function runQC(quiet = false) {
  const browser = await launch(); const page = await openPlayer(browser); const fps = FPS, total = await page.evaluate('window.TOTAL_FRAMES');
  await page.waitForFunction('typeof window.qcSample === "function"', null, { timeout: 20000 });
  const step = Math.max(1, Math.round((+args.every || 0.5) * fps)), f0 = Math.max(1, Math.round((+args.from || 0) * fps)), f1 = Math.min(total - 2, args.to ? Math.round(+args.to * fps) : total - 2);
  const groups = new Map(); let n = 0;
  for (let f = f0; f <= f1; f += step) { const r = await page.evaluate(i => window.qcSample(i), f); n++;
    for (const is of r.issues) { const k = `${r.shot}|${is.kind}|${is.msg.replace(/[\d.]+/g, '#')}`; const g = groups.get(k) || { shot: r.shot, kind: is.kind, sev: is.sev, msg: is.msg, times: [] };
      if (is.sev === 'red') g.sev = 'red'; g.times.push(r.t); groups.set(k, g); } }
  await browser.close();
  const issues = [...groups.values()].sort((a, b) => (a.sev === b.sev ? 0 : a.sev === 'red' ? -1 : 1) || a.times[0] - b.times[0]);
  const red = issues.filter(i => i.sev === 'red').length, amber = issues.length - red;
  fs.writeFileSync(path.join(BUILD, 'qc_motion.json'), JSON.stringify({ samples: n, step: step / fps, red, amber, issues }, null, 1));
  if (!quiet || red) { console.log(`Motion QC: ${n} samples, ${red} red, ${amber} amber  (build/qc_motion.json)`);
    for (const i of issues.slice(0, 60)) console.log(`  ${i.sev === 'red' ? 'RED  ' : 'amber'} ${String(i.shot).padEnd(14)} ${i.kind.padEnd(8)} ${i.msg}  @ ${i.times.slice(0, 5).join(', ')}${i.times.length > 5 ? ' …' : ''}s`); }
  return { red, amber };
}
async function renderVideo() {
  const b0 = await launch(); const p0 = await openPlayer(b0);
  const total = await p0.evaluate('window.TOTAL_FRAMES'), fps = FPS; [OUTW, OUTH] = await p0.evaluate('window.OUT');
  const missing = (await p0.evaluate('window.SHOT_LIST')).filter(s => !s.ok); if (missing.length) console.log(`WARNING: ${missing.length} shots have no scene file yet: ${missing.slice(0, 12).map(s => s.id).join(', ')}${missing.length > 12 ? ' …' : ''}`);
  await b0.close();
  if (!args.from && !args.to && !args['no-qc'] && !PREVIEW) { const q = await runQC(true); if (q.red && !args.force) throw new Error(`motion QC found ${q.red} red issue(s): fix them (node render.mjs --project P --qc) or render anyway with --force`); }
  const f0 = Math.max(0, Math.round((+args.from || 0) * fps)), f1 = Math.min(total, args.to ? Math.round(+args.to * fps) : total);
  // default workers: half the CPU threads (max 8); on a GPU, cap by video memory (≈0.5 GB/worker at 1080p, 1.2 GB at 4K on a 6 GB card)
  const vramCap = GPU_MODE ? ({ '1440p': 5, '2160p': 3, '4k': 3 }[CFG.resolution] || 8) : 8;
  const W = Math.max(1, Math.min(+(args.workers || Math.max(1, Math.min(vramCap, Math.floor(os.cpus().length / 2)))), Math.ceil((f1 - f0) / 24)));
  const partsDir = path.join(BUILD, 'parts'); fs.rmSync(partsDir, { recursive: true, force: true }); fs.mkdirSync(partsDir, { recursive: true });
  const chunk = Math.ceil((f1 - f0) / W); let done = 0; const t0 = Date.now(); const errs = new Set();
  console.log(`Rendering frames ${f0}-${f1} (${((f1 - f0) / fps).toFixed(1)} s @ ${fps} fps, ${Math.round(OUTW / SS)}x${Math.round(OUTH / SS)}, quality ${PREVIEW && !args.quality ? 'preview' : QN}${SS > 1 ? `, ${SS}x supersampled` : ''}, encoder ${ENCODER}) with ${W} worker(s)…`);
  const work = async (k) => {
    const a = f0 + k * chunk, b = Math.min(f1, a + chunk); if (a >= b) return null;
    const browser = await launch(); const page = await openPlayer(browser);
    const out = path.join(partsDir, `part_${String(k).padStart(3, '0')}.mp4`);
    const enc = PREVIEW && !args.quality ? QUALITY.draft : Q;
    const vf = SS > 1 ? ['-vf', `scale=${Math.round(OUTW / SS / 2) * 2}:${Math.round(OUTH / SS / 2) * 2}:flags=lanczos`] : [];
    const qn = PREVIEW && !args.quality ? 'draft' : QN, gop = String(Math.max(1, Math.round(fps / 2)));
    const codec = ENCODER === 'nvenc'
      ? ['-c:v', 'h264_nvenc', '-preset', qn === 'draft' ? 'p3' : qn === 'standard' ? 'p5' : 'p7', '-tune', 'hq', '-rc', 'vbr', '-cq', String(args.cq || NV_CQ[qn]), '-b:v', '0', '-maxrate', '80M', '-bufsize', '160M', '-spatial-aq', '1', '-profile:v', 'high', '-bf', '2']
      : ['-c:v', 'libx264', '-preset', args.preset || enc.preset, '-crf', String(args.crf || enc.crf), '-profile:v', 'high', '-tune', 'animation', '-bf', '2', '-x264-params', 'aq-mode=3'];
    const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-', ...vf, ...codec, '-pix_fmt', 'yuv420p', '-g', gop,
      '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-r', String(fps), out], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let f = a; f < b; f++) {
      const img = await shot(page, f); if (!ff.stdin.write(img)) await new Promise(r => ff.stdin.once('drain', r)); done++;
      if (done % 48 === 0) { const el = (Date.now() - t0) / 1000, eta = (el / done) * (f1 - f0 - done); process.stdout.write(`  ${done}/${f1 - f0} frames  ${(done / el).toFixed(2)} fps  elapsed ${fmtT(el)}  eta ${fmtT(eta)}\n`); }
    }
    (await page.evaluate('window.ERRORS')).forEach(e => errs.add(e));
    ff.stdin.end(); await new Promise(r => ff.on('close', r)); await browser.close(); return out;
  };
  const parts = (await Promise.all([...Array(W)].map((_, k) => work(k)))).filter(Boolean);
  const list = path.join(partsDir, 'list.txt'); fs.writeFileSync(list, parts.map(p => `file '${p.replace(/\\/g, '/').replace(/'/g, "'\\''")}'`).join('\n'));
  // --out: absolute, or relative to the project (build/fix.mp4), or a path already inside the project
  const outArg = args.out ? path.resolve(args.out) : null;
  const out = !args.out ? path.join(BUILD, args.from || args.to ? 'preview.mp4' : 'video_silent.mp4') : (path.isAbsolute(args.out) || outArg.startsWith(PROJECT + path.sep)) ? outArg : path.join(PROJECT, args.out);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await new Promise((res, rej) => spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', '-movflags', '+faststart', out], { stdio: 'inherit' }).on('close', c => (c ? rej(new Error('concat failed')) : res())));
  if (errs.size) { console.log(`\n${errs.size} shot error(s):`); [...errs].slice(0, 40).forEach(e => console.log('  ' + e)); }
  console.log(`\nDone: ${out}  (${fmtT((Date.now() - t0) / 1000)})`);
  // 1.0.4: the picture scorecard (tools/qc_metrics.py: brightness, colour, dark / empty / still frames, shot pace) runs on the
  // finished video by itself, writes build/qc_scorecard.md + .json, and feeds the lesson book below. --no-scorecard skips it.
  if (!PREVIEW && !args.from && !args.to && !args['no-scorecard']) { const py = process.env.PYTHON || (process.platform === 'win32' ? 'python' : 'python3');
    const r = spawnSync(py, [path.join(ROOT, 'tools', 'qc_metrics.py'), '--video', out, '--project', PROJECT], { encoding: 'utf8', cwd: ROOT });
    if (r.status) console.log('Scorecard not written: ' + String(r.stderr || r.error || '').trim().split('\n').pop());
    else { const md = String(r.stdout || ''), bad = (md.match(/\| CHECK/g) || []).length; console.log(`Scorecard: ${bad ? bad + ' number(s) to check' : 'all in range'} → build/qc_scorecard.md`);
      for (const row of md.split('\n').filter(l => l.includes('| CHECK')).slice(0, 8)) console.log('  ' + row.replace(/\s*\|\s*/g, ' | ').trim()); } }
  // 1.0.3: after every final render, record this video's problems in the channel lesson book (channel/LESSONS.md)
  if (!PREVIEW && !args.from && !args.to && !args.out && !args['no-lessons']) { try { const { record } = await import('./tools/retro.mjs');
    const e = record(PROJECT, { errors: [...errs], missing: missing.map(s => s.id), renderSec: Math.round((Date.now() - t0) / 1000) });
    console.log(`Lessons: ${e.project} recorded → channel/LESSONS.md (checklist for the next video)`); } catch (err) { console.log('Lessons not recorded: ' + err.message); } }
}
// grid of labelled images, laid out by the browser (works on every OS)
async function contactSheet(browser, items, outFile, cols = 4, cellW = 480) {
  const page = await browser.newPage({ viewport: { width: cols * (cellW + 12) + 12, height: 400 } });
  const html = `<html><body style="margin:0;background:#111;font:600 15px sans-serif;color:#eee"><div style="display:grid;grid-template-columns:repeat(${cols},${cellW}px);gap:12px;padding:12px">${items.map(it => `<div><img src="data:image/${FORMAT};base64,${it.img.toString('base64')}" style="width:${cellW}px;display:block;border-radius:4px"><div style="padding:5px 2px">${it.label.replace(/</g, '&lt;')}</div></div>`).join('')}</div></body></html>`;
  await page.setContent(html); await page.screenshot({ path: outFile, fullPage: true }); await page.close();
}
async function renderStills() {
  const browser = await launch(); const styles = args.styles ? String(args.styles).split(',') : [args.style || null];
  const dir = path.join(BUILD, args.styles ? 'styles' : args.sheet ? 'sheets' : 'stills'); if (!args.only) fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const all = [];
  for (const st of styles) {
    const page = await openPlayer(browser, st); const fps = FPS;
    let targets;
    if (args.sheet) targets = (await page.evaluate('window.SHOT_LIST')).filter(s => !args.only || args.only.has(s.id)).map(s => ({ t: s.start + (s.end - s.start) * 0.45, label: `${s.id}  ${s.start.toFixed(1)}s${s.ok ? '' : '  (MISSING)'}` }));
    else targets = String(args.stills || args.at || '1').split(',').map(Number).map(t => ({ t, label: `${t}s` }));
    for (const tg of targets) { const img = await shot(page, Math.round(tg.t * fps)); const name = `${st ? st + '_' : ''}${tg.label.split(' ')[0].replace(/[^\w.]/g, '')}_${tg.t.toFixed(2)}.${FORMAT}`; fs.writeFileSync(path.join(dir, name), img); all.push({ img, label: `${st ? `[${st}] ` : ''}${tg.label}`, st }); }
    (await page.evaluate('window.ERRORS')).forEach(e => console.log('  shot error:', e)); await page.close();
  }
  if (args.styles) { const n = all.length / styles.length; await contactSheet(browser, all, path.join(dir, 'style_grid.png'), n, 420); }
  else { const per = 24; for (let i = 0; i < all.length; i += per) await contactSheet(browser, all.slice(i, i + per), path.join(dir, `sheet_${String(i / per + 1).padStart(2, '0')}.png`), 4, 440); }
  await browser.close(); console.log(`Wrote ${all.length} stills + contact sheet(s) to ${dir}`);
}
// --thumbs (1.0.3): one JPG per shot (1280×720, the frame at shotsjson "thumbAt" or just before the shot ends) + a 2×2 grid to pick from.
async function renderThumbs() {
  const browser = await launch(); const page = await openPlayer(browser); const fps = FPS;
  const list = await page.evaluate('window.SHOT_LIST'), dir = path.join(BUILD, 'thumbs'); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const outs = [];
  for (const sh of list) { const t = sh.thumbAt != null ? sh.start + sh.thumbAt : sh.end - 2 / fps; await page.evaluate(i => window.renderFrame(i), Math.round(t * fps));
    const png = path.join(dir, `_${sh.id}.png`), out = path.join(dir, `${sh.id}.jpg`); fs.writeFileSync(png, await page.screenshot({ type: 'png' }));
    spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', png, '-vf', 'scale=1280:720:flags=lanczos', '-q:v', '2', out]); fs.rmSync(png, { force: true }); outs.push(out); }
  if (outs.length >= 2) { const n = Math.min(4, outs.length), ins = outs.slice(0, n).flatMap(f => ['-i', f]), lay = ['0_0', 'w0_0', '0_h0', 'w0_h0'].slice(0, n).join('|');
    spawnSync('ffmpeg', ['-v', 'error', '-y', ...ins, '-filter_complex', `xstack=inputs=${n}:layout=${lay}:fill=black`, '-q:v', '3', path.join(dir, 'grid.jpg')]); }
  (await page.evaluate('window.ERRORS')).forEach(e => console.log('  shot error:', e));
  await browser.close(); console.log(`Wrote ${outs.length} thumbnail(s) + grid to ${dir}`);
}
// --gif [ids] (1.0.2): a looping GIF per shot (10 fps, small) to judge motion — stills hide jerks and sliding feet.
// ids: comma-separated shot ids, default all. --gifFps N, --scale K (default 0.35). Output build/gifs/<id>.gif.
async function renderGifs() {
  const browser = await launch(); const page = await openPlayer(browser); const fps = FPS, gfps = +(args.gifFps || 10);
  const list = (await page.evaluate('window.SHOT_LIST')).filter(s => args.gif === true || String(args.gif).split(',').includes(s.id));
  const dir = path.join(BUILD, 'gifs'); fs.mkdirSync(dir, { recursive: true });
  for (const sh of list) {
    const tmp = path.join(dir, '_' + sh.id); fs.rmSync(tmp, { recursive: true, force: true }); fs.mkdirSync(tmp, { recursive: true }); let k = 0;
    for (let t = sh.start; t < sh.end - 1e-6; t += 1 / gfps) { await page.evaluate(i => window.renderFrame(i), Math.round(t * fps)); fs.writeFileSync(path.join(tmp, `f${String(k++).padStart(4, '0')}.png`), await page.screenshot({ type: 'png' })); }
    const out = path.join(dir, `${sh.id}.gif`);
    const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-framerate', String(gfps), '-i', path.join(tmp, 'f%04d.png'), '-vf', 'split[a][b];[a]palettegen=max_colors=128[p];[b][p]paletteuse=dither=bayer:bayer_scale=4', '-loop', '0', out]);
    if (r.status) console.log('  gif failed:', sh.id, String(r.stderr).slice(0, 200)); fs.rmSync(tmp, { recursive: true, force: true });
  }
  await browser.close(); console.log(`Wrote ${list.length} GIF(s) to ${dir}`);
}
// --bench: time one worker on frames spread across the video, then estimate the full render for this machine
async function bench() {
  const browser = await launch(); const page = await openPlayer(browser); const total = await page.evaluate('window.TOTAL_FRAMES'); [OUTW, OUTH] = await page.evaluate('window.OUT');
  const n = +(args.frames || 12), picks = [...Array(n)].map((_, i) => Math.floor(((i + 0.5) / n) * (total - 2)));
  let tr = 0, tc = 0, gl3 = 0, gr = 0, k = 0;
  for (const f of picks) {
    await page.evaluate(i => window.renderFrame(i), f);                     // warm-up (builds the shot)
    const a = Date.now(); await page.evaluate(i => window.renderFrame(i), f + 1); const b = Date.now();
    const pr = await page.evaluate('window.PROF'); await page.screenshot({ type: FORMAT, ...(FORMAT === 'jpeg' ? { quality: 96 } : {}) }); const c = Date.now();
    tr += b - a; tc += c - b; gl3 += (pr.anim || 0) + (pr.gl || 0); gr += pr.grade || 0; k++;
  }
  await browser.close();
  const per = (tr + tc) / k, fpsW = 1000 / per, cores = os.cpus().length;
  const W = +(args.workers || Math.max(1, Math.min(8, Math.floor(cores / 2)))), cpu = /swiftshader|llvmpipe|software/i.test(RENDERER);
  const eff = cpu ? Math.min(W, cores / 2) * 0.75 : W * 0.8;    // CPU rendering shares cores between workers; GPU scales better
  const est = total / (fpsW * eff);
  console.log(`\nBench (${n} frames at ${OUTW}x${OUTH}, quality ${QN}, ${FPS} fps project):`);
  console.log(`  per frame: ${per.toFixed(0)} ms  (3D + 2D ${(tr / k - gr / k).toFixed(0)} ms, colour grade ${(gr / k).toFixed(0)} ms, capture ${(tc / k).toFixed(0)} ms)`);
  console.log(`  one worker ≈ ${fpsW.toFixed(2)} frames/s; ${W} workers ≈ ${(fpsW * eff).toFixed(2)} frames/s (estimate)`);
  console.log(`  this video: ${total} frames ≈ ${fmtT(est)} to render (+ encode). Encoder: ${ENCODER}. CPU threads: ${cores}.`);
}
// 1.0.5: building shots needs a finished set match (every missing set decided, every shots.json set known). Projects made before
// 1.0.5 have no story/set_match.json and pass with a note. --force renders anyway.
function setGate() {
  if (args.catalog || args.bench || args.force || PROJECT.startsWith(path.join(ROOT, 'examples'))) return;
  if (!fs.existsSync(path.join(PROJECT, 'story', 'set_match.json'))) { console.log('set match: none for this project (made before 1.0.5), skipped'); return; }
  const py = process.env.PYTHON || (process.platform === 'win32' ? 'python' : 'python3');
  const r = spawnSync(py, [path.join(ROOT, 'tools', 'set_match.py'), '--project', PROJECT, '--check', '--shots', '--quiet'], { encoding: 'utf8', cwd: ROOT });
  if (r.status) { console.error((r.stdout || '') + (r.stderr || '')); console.error('set match not ready: decide the missing sets (tools/set_match.py --decide) or render anyway with --force'); process.exit(3); }
}
setGate();
try { if (args.bench) await bench(); else if (args.qc) { const q = await runQC(); if (q.red) process.exitCode = 2; } else if (args.thumbs) await renderThumbs(); else if (args.gif) await renderGifs(); else if (args.sheet || args.stills || args.styles) await renderStills(); else await renderVideo(); }
catch (e) { console.error('RENDER FAILED:', e.message); process.exitCode = 1; }
finally { server.close(); }
