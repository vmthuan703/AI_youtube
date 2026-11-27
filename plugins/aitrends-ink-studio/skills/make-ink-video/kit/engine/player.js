// engine/player.js — loads a project, maps global time -> shot, renders frames deterministically.
// window.renderFrame(frameIndex) draws one frame onto #main. Used by render.mjs (headless).
// 3D shots render with Three.js (engine/kit3d.js) into a WebGL canvas, then 2D overlays, grade, captions and bars are composited.
import { E, V, setStyle, getShot, clamp, ease, prog, alpha, text, FONTS } from './core.js';
import { STYLES } from './styles.js';
import { captions, speech, hud as drawHud, counter } from './ui2d.js';
import { prepareGag, drawGag } from './gag.js';

const q = new URLSearchParams(location.search);
const PROJ = '/project';
const RES = { '720p': 720, '1080p': 1080, '1440p': 1440, '2160p': 2160, '4k': 2160 };
let main, mg, bufA, bufB, glCanvas, accA, grainTiles = [], three = null;
const errors = (window.ERRORS = []);
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

async function loadFonts() {
  const F = [['Fredoka', '600', 'fredoka/files/fredoka-latin-600-normal.woff2'], ['Fredoka', '700', 'fredoka/files/fredoka-latin-700-normal.woff2'],
    ['Nunito', '800', 'nunito/files/nunito-latin-800-normal.woff2'], ['Nunito', '900', 'nunito/files/nunito-latin-900-normal.woff2'],
    ['Playfair Display', '900', 'playfair-display/files/playfair-display-latin-900-italic.woff2', 'italic'],
    ['Playfair Display', '700', 'playfair-display/files/playfair-display-latin-700-normal.woff2'], ['Playfair Display', '900', 'playfair-display/files/playfair-display-latin-900-normal.woff2']];
  for (const [fam, w, file, style] of F) { try { const ff = new FontFace(fam, `url(/node_modules/@fontsource/${file})`, { weight: w, style: style || 'normal' }); await ff.load(); document.fonts.add(ff); } catch (e) { console.log('font missing', fam, w); } }
}
async function boot() {
  const cfg = await (await fetch(`${PROJ}/config.json`)).json();
  const story = await (await fetch(`${PROJ}/story/shots.json`)).json();
  let words = []; try { const r = await fetch(`${PROJ}/timeline/words.json`); if (r.ok) words = await r.json(); } catch {}
  let lines = []; try { const r = await fetch(`${PROJ}/timeline/lines.json`); if (r.ok) lines = await r.json(); } catch {}
  const vertical = (cfg.aspect || '16:9') === '9:16';
  const short = RES[cfg.resolution || '1080p'] || 1080, long = Math.round((short * 16) / 9 / 2) * 2;
  const scale = +(q.get('scale') || 1) * +(q.get('ss') || 1);   // ss = supersampling factor (render.mjs downsizes with lanczos)
  const outW = Math.round(((vertical ? short : long) * scale) / 2) * 2, outH = Math.round(((vertical ? long : short) * scale) / 2) * 2;
  Object.assign(E, { vertical, W: vertical ? 1080 : 1920, H: vertical ? 1920 : 1080, fps: +(q.get('fps') || cfg.fps || 24), cfg, words: words.words || words, lines: Array.isArray(lines) ? lines : [], shots: story.shots, story, outW, outH });
  E.PX = outW / E.W; E.quality = q.get('quality') || cfg.quality || 'high';
  setStyle(q.get('style') || cfg.style || 'pearl', q.get('palette') || cfg.palette || null);
  await loadFonts();
  main = document.getElementById('main'); main.width = outW; main.height = outH; mg = main.getContext('2d', { willReadFrequently: true });
  LUT = buildLUT(E.style.grade || {});
  bufA = mk(outW, outH); bufB = mk(outW, outH);
  const gw = Math.ceil(outW / 2), gh = Math.ceil(outH / 2);
  for (let k = 0; k < 4; k++) { const c = mk(gw, gh), x = c.getContext('2d'), id = x.createImageData(gw, gh); let s = 1234 + k * 999; for (let i = 0; i < id.data.length; i += 4) { s = (s * 1664525 + 1013904223) >>> 0; const v = s >>> 24; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; } x.putImageData(id, 0, 0); grainTiles.push(c); }
  const list = await (await fetch(`/__manifest`)).json();
  for (const f of list) { try { await import(f); } catch (e) { errors.push(`import ${f}: ${e.message}`); console.log('IMPORT ERROR', f, e.message); } }
  if (E.shots.some(s => getShot(s.id)?.kind === '3d' || s.backdrop || getShot(s.id)?.backdrop)) { three = await import('./kit3d.js'); glCanvas = mk(outW, outH); three.getRenderer(glCanvas); accA = mk(outW, outH); }
  await prepareGag(three, mk);
  const dur = story.duration || E.shots[E.shots.length - 1].end;
  window.DURATION = dur; window.TOTAL_FRAMES = Math.ceil(dur * E.fps); window.OUT = [outW, outH];
  globalThis.E3D_LINE_RULE = E.cfg.lineRule ?? false;   // 1.0.2: camera 180° rule (camera10.js)
  window.SHOT_LIST = E.shots.map(s => ({ id: s.id, start: s.start, end: s.end, ok: !!getShot(s.id), thumbAt: s.thumbAt }));
  window.READY = true;
}

// colour grade: per-channel lift/gamma/gain + contrast as LUTs, saturation per pixel.
// A shot can change the grade with "look": "freeze" | "flashback" | "dream" | "danger" | {grade overrides}.
const LOOKS = { freeze: { sat: 0.35, lift: [0.02, 0.05, 0.12], gain: [0.85, 0.98, 1.18], contrast: 1.06 }, flashback: { sat: 0.45, lift: [0.06, 0.04, 0.0], gain: [1.08, 1.0, 0.82], contrast: 0.95, vignette: 0.7 },
  dream: { sat: 0.8, lift: [0.08, 0.05, 0.1], gamma: [1.1, 1.06, 1.12], contrast: 0.9 }, danger: { sat: 0.9, lift: [0.06, 0.0, 0.0], gain: [1.15, 0.9, 0.88], contrast: 1.12, vignette: 0.7 } };
let LUT = null; const LUTS = new Map();
function buildLUT(gr) {
  const lift = gr.lift || [0, 0, 0], gam = gr.gamma || [1, 1, 1], gain = gr.gain || [1, 1, 1], con = gr.contrast ?? 1, sat = gr.sat ?? 1;
  const ident = con === 1 && lift.every(v => v === 0) && gam.every(v => v === 1) && gain.every(v => v === 1);
  if (ident && sat === 1) return null;
  const L = [0, 1, 2].map(c => { const a = new Uint8ClampedArray(256); for (let i = 0; i < 256; i++) { let x = i / 255; x = clamp((x - 0.5) * con + 0.5); x = clamp(gain[c] * (x + lift[c] * (1 - x))); x = Math.pow(x, 1 / gam[c]); a[i] = Math.round(x * 255); } return a; });
  L.sat = sat; return L;
}
function gradeFor(shot) {
  if (!shot.look) return { grade: E.style.grade, lut: LUT };
  const k = typeof shot.look === 'string' ? shot.look : JSON.stringify(shot.look);
  if (!LUTS.has(k)) { const over = typeof shot.look === 'string' ? LOOKS[shot.look] || {} : shot.look; const g = { ...E.style.grade, ...over }; LUTS.set(k, { grade: g, lut: buildLUT(g) }); }
  return LUTS.get(k);
}
function applyGrade(W, H, LUTx) {
  if (!LUTx) return; const img = mg.getImageData(0, 0, W, H), d = img.data, [R, G, B] = LUTx, s = LUTx.sat;
  for (let i = 0; i < d.length; i += 4) {
    let r = R[d[i]], g = G[d[i + 1]], b = B[d[i + 2]];
    if (s !== 1) { const l = 0.2126 * r + 0.7152 * g + 0.0722 * b; r = l + (r - l) * s; g = l + (g - l) * s; b = l + (b - l) * s; }
    d[i] = r; d[i + 1] = g; d[i + 2] = b;
  }
  mg.putImageData(img, 0, 0);
}
function shotIndexAt(t) { const S = E.shots; for (let i = 0; i < S.length; i++) if (t < S[i].end) return i; return S.length - 1; }
const cache3D = new Map();
function state3D(shot, def, info) {
  if (cache3D.has(shot.id)) return cache3D.get(shot.id);
  for (const [k, v] of cache3D) if (cache3D.size >= 2) { v.dispose?.(); (v.stage || v.st)?.dispose?.(); cache3D.delete(k); }
  E.curShot = shot;   // 2.0: T.stage reads the shot's "look" and "weather"
  const st = def.init(three, info); const stg = st.stage || st.st || st;
  if (def.optimize !== false && three.optimize && stg.scene) { const r = three.optimize(stg, st); if (q.has('prof')) console.log(`ERROR-INFO optimize ${shot.id}: ${r.before} -> ${r.after} static meshes`); }
  cache3D.set(shot.id, st); return st;
}
// A 2D shot can sit on the scene being told: a still of another shot, blurred and dimmed ("backdrop" on the shot or its module).
//   { "shot": "s009", "at": 1.5, "blur": 14, "dim": 0.5, "sat": 0.9, "tint": "#1c1432" }. The still is built once per worker.
const backdrops = new Map();
function drawBackdrop(g, bd, p) {
  const key = `${bd.shot}@${bd.at ?? ''}`; let c = backdrops.get(key);
  if (!c) {
    c = mk(main.width, main.height); const ref = E.shots.find(s => s.id === bd.shot);
    if (ref) drawShot(c, ref, bd.at ?? (ref.end - ref.start) / 2, { noOverlay: true }); else { const x = c.getContext('2d'); x.fillStyle = E.style.ui?.explainBg || '#34264f'; x.fillRect(0, 0, c.width, c.height); }
    if (backdrops.size >= 3) backdrops.delete(backdrops.keys().next().value);
    backdrops.set(key, c);
  }
  const W = c.width, H = c.height, k = 1.07 + 0.02 * p, dw = W * k, dh = H * k;   // scaled up so the blur never shows an edge; a very slow push keeps it alive
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.filter = `blur(${(bd.blur ?? 14) * E.PX}px) brightness(${1 - (bd.dim ?? 0.5)}) saturate(${bd.sat ?? 0.9})`;
  g.drawImage(c, (W - dw) / 2, (H - dh) / 2, dw, dh); g.filter = 'none';
  if (bd.tint) { g.globalAlpha = bd.tintA ?? 0.28; g.fillStyle = bd.tint; g.fillRect(0, 0, W, H); }
  g.restore();
}
// Auto speech bubbles: every line of a named character (timeline/lines.json) gets a bubble while it is spoken.
// Characters created with { speaker: 'JAKE' } get it above their head; otherwise it sits top-centre. shot.bubbles = false turns it off,
// shot.bubble = {x, y, tx, ty} places it by hand.
function bubbleText(L, t) {
  const str = String(L.text || '').trim(); if (str.length <= 70) return { str, start: L.start };
  const parts = str.match(/[^.!?]+[.!?]+["']?|[^.!?]+$/g) || [str]; const total = parts.reduce((a, b) => a + b.length, 0); let at = L.start;
  for (const part of parts) { const d = (L.end - L.start) * part.length / total; if (t < at + d) return { str: part.trim(), start: at }; at += d; }
  return { str: parts[parts.length - 1].trim(), start: L.end };
}
function speakersOf(st, stg) {
  if (st.__speakers) return st.__speakers; const m = new Map();
  stg.scene?.traverse(o => { if (o.userData?.speaker) m.set(o.userData.speaker, o); });
  st.__speakers = m; return m;
}
// Head of the speaker on screen, or null when off screen / behind the camera.
function headOnScreen(who, stg) {
  const v = who.headWorld(); v.y += 0.4; const [hx, hy, hz] = three.toScreen(v, stg.camera);
  return hz < 1 && hx > -120 && hx < E.W + 120 && hy > -240 && hy < E.H ? [hx, hy] : null;
}
// The bubble box is placed ONCE per line and per shot, from where the head is when the line (or the shot) starts, and then stays put:
// following the head every frame made it jitter with walk bobs and camera shake. Only the tail tip follows the live head.
// The anchor is found by re-running draw() at that start time, so it is the same in every worker (draw is a pure function of t).
function bubbleAnchor(shot, L, st, stg, def, info, who, top) {
  const key = L.start + '|' + L.speaker, cache = st.__bubbleAnchors || (st.__bubbleAnchors = new Map());
  if (cache.has(key)) return cache.get(key);
  const t0 = clamp(L.start - shot.start, 0, shot.end - shot.start);
  def.draw(st, t0, { ...info, globalT: shot.start + t0, p: clamp(t0 / (shot.end - shot.start)) }, three);
  const h = headOnScreen(who, stg); let a = null;
  if (h) { const [hx, hy] = h; a = { x: clamp(hx + (hx > E.W / 2 ? -150 : 150), V(330, 300), E.W - V(330, 300)), y: Math.max(top + 30, hy - V(90, 110)) }; }
  cache.set(key, a); return a;
}
function drawBubble(g, shot, lt, st, stg, def, info) {
  if (!E.cfg.speechBubbles || shot.bubbles === false || !E.lines.length) return;
  const t = shot.start + lt, L = E.lines.find(l => String(l.speaker).toUpperCase() !== 'NARRATOR' && t >= l.start - 0.05 && t <= l.end + 0.25); if (!L) return;
  const { str, start } = bubbleText(L, t), top = barVal(shot) + V(70, 110); let x = E.W / 2, y = top + 30, tx = null, ty = null;
  const who = st && stg?.camera && three ? speakersOf(st, stg).get(String(L.speaker).toUpperCase()) : null;
  if (who) {
    const h = headOnScreen(who, stg);   // live head first: the anchor below re-runs draw() and moves the scene
    if (h) { tx = clamp(h[0], 40, E.W - 40); ty = Math.max(h[1], top + 60); }
    const a = def ? bubbleAnchor(shot, L, st, stg, def, info, who, top) : null;
    if (a) ({ x, y } = a); else if (h) { x = clamp(h[0] + (h[0] > E.W / 2 ? -150 : 150), V(330, 300), E.W - V(330, 300)); y = Math.max(top + 30, h[1] - V(90, 110)); }
  }
  if (shot.bubble) ({ x = x, y = y, tx = tx, ty = ty } = shot.bubble);
  g.save(); speech(g, { str, x, y, tx, ty, t: t - start, start: 0 }); g.restore();
}
// Game HUD over heads: any character with userData.hud = { name, level, hp, bars, start, end, lift, ref } gets a glass panel above the head,
// sized by distance (small far away: bar only). Numbers may be a value, a function of shot time, or keys [[t, v], …]. shots.json "hud": false hides them.
const valAt = (v, t) => (typeof v === 'function' ? v(t) : Array.isArray(v) && Array.isArray(v[0]) ? keyVal(v, t) : v);
function keyVal(K, t) { if (t <= K[0][0]) return K[0][1]; for (let i = 1; i < K.length; i++) if (t < K[i][0]) { const [t0, a] = K[i - 1], [t1, b] = K[i]; return typeof a === 'number' && typeof b === 'number' ? a + (b - a) * ease.inOut(clamp((t - t0) / (t1 - t0))) : a; } return K[K.length - 1][1]; }
function drawHuds(g, shot, lt, st, stg) {
  if (shot.hud === false || !stg?.scene || !three) return;
  const list = st.__hudChars || (st.__hudChars = (() => { const L = []; stg.scene.traverse(o => { if (o.name === 'character' && o.headWorld) L.push(o); }); return L; })());
  const on = list.filter(c => c.userData.hud && c.visible).map(c => ({ c, h: c.userData.hud, tag: three.headTag(c, stg.camera, c.userData.hud) })).filter(x => x.tag.on).sort((a, b) => a.tag.s - b.tag.s);
  for (const { h, tag } of on) drawHud(g, { ...h, x: tag.x, y: tag.y, s: tag.s * (h.size ?? 1), hp: valAt(h.hp ?? 1, lt), level: valAt(h.level, lt), name: valAt(h.name, lt), bars: (h.bars || []).map(b => ({ ...b, value: valAt(b.value, lt) })), t: lt, start: h.start ?? 0, end: h.end ?? null });
}
// shots.json "counters": [{ "from": 12, "to": 95, "kind": "pill"|"score"|"bar", "label": "DAY", "keys": [[12, "1"], [40, "15"]], "corner": "tr", "max": 50, "icon": "star" }]
// A tracker of the story's variable that stays on screen across cuts (under the grade, like the subscribe gag). It fades in and out at
// from/to, swells for a beat on every change, and numbers count between keys. A shot can hide it with "counters": false.
function drawCounters(g, t, shot) {
  const C = E.story?.counters; if (!C || shot.counters === false) return;
  for (const c of C) { if (t < c.from || t > c.to) continue; const a = clamp(Math.min((t - c.from) / 0.3, (c.to - t) / 0.3)); const K = c.keys || [[c.from, c.value]];
    let i = 0; while (i + 1 < K.length && t >= K[i + 1][0]) i++; const since = t - K[i][0], prev = i > 0 ? K[i - 1][1] : null; let v = K[i][1];
    if (typeof v === 'number' && typeof prev === 'number' && c.kind === 'bar') v = prev + (v - prev) * ease.out(clamp(since / 0.6));
    else if (c.count !== false && prev != null && /^\d+$/.test(String(v)) && /^\d+$/.test(String(prev))) v = String(Math.round(+prev + (+v - +prev) * ease.out(clamp(since / 0.5))));
    counter(g, { ...c, value: v, a, bump: i > 0 ? clamp(since / 0.35) : 0, top: barVal(shot) }); }
}
// shots.json "ramp": [[0, 1], [0.8, 0.25], [2.2, 0.25], [2.6, 1]] — speed keys (shot-local seconds → playback speed, linear
// between keys): the shot's animation slows down or speeds up while the voice runs on. Returns the animation time.
function rampT(shot, lt) {
  const R = shot.ramp; if (!Array.isArray(R) || !R.length) return lt;
  const pts = [[0, R[0][0] <= 0 ? R[0][1] : R[0][1]], ...R.filter(r => r[0] > 0)]; let acc = 0;
  for (let i = 0; i < pts.length; i++) {
    const [t0, s0] = pts[i], [t1, s1] = pts[i + 1] || [Infinity, s0];
    if (lt <= t1) { const d = lt - t0, sl = isFinite(t1) ? (s1 - s0) / (t1 - t0) : 0; return acc + s0 * d + 0.5 * sl * d * d; }
    acc += (s0 + s1) / 2 * (t1 - t0);
  }
  return acc;
}
function drawShot(buf, shot, lt, opts = {}) {
  const g = buf.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.filter = 'none';
  g.fillStyle = '#000'; g.fillRect(0, 0, buf.width, buf.height); g.setTransform(E.PX, 0, 0, E.PX, 0, 0);
  const def = getShot(shot.id); const dur = shot.end - shot.start;
  const info = { ...(shot.params || {}), shot, dur, globalT: shot.start + lt, p: clamp(lt / dur), line: shot.line };
  E.shotT = lt; E.shotDur = dur; globalThis.E3D_T = shot.start + lt;   // 1.0.3: cloth flutter reads the global time   // overlays read these for exits (end: 'shot') and the living purple stage
  if (!def) { g.fillStyle = '#20141c'; g.fillRect(0, 0, E.W, E.H); text(g, `MISSING SHOT ${shot.id}`, E.W / 2, E.H / 2 - 30, { size: 60, color: '#ff6f61' }); text(g, (shot.line || '').slice(0, 80), E.W / 2, E.H / 2 + 50, { size: 30, color: '#fff', font: FONTS.ui, weight: 800 }); return; }
  try {
    if (def.kind === '3d') {
      const st = state3D(shot, def, info); const stg = st.stage || st.st || st; stg.activate?.(); if (!opts.noQcMark) window.CUR3D = { st, stg, shot, def, lt };
      // mblur: sub-frames (2–4) over a 180° shutter; 'action' (1.0) = 5 sub-frames over a 300° shutter for runs, punches and falls
      const mbv = shot.mblur ?? def.mblur ?? 1, nb = mbv === 'action' ? 5 : Math.max(1, Math.round(+mbv || 1)), shutter = mbv === 'action' ? 0.83 : 0.5;
      // a light hand-held drift on every 3D shot (config.handheld, shots.json/shot "handheld"), added only for the render
      const hh = shot.handheld ?? def.handheld ?? E.cfg.handheld ?? 0.35, cam = stg.camera, hseed = 1 + Math.round(shot.start * 7) % 97;
      const render = (gt) => { let sv = null; if (hh && cam && three.handheld) { sv = [cam.position.clone(), cam.quaternion.clone()]; three.handheld(cam, gt, hh, hseed); cam.updateMatrixWorld(); } stg.render(); if (sv) { cam.position.copy(sv[0]); cam.quaternion.copy(sv[1]); cam.updateMatrixWorld(); } };
      if (nb <= 1) { const a = performance.now(); const at = rampT(shot, lt); def.draw(st, at, info, three); stg.tick?.(at); const b = performance.now(); render(shot.start + lt); g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(glCanvas, 0, 0, buf.width, buf.height); g.restore(); PROF.anim = b - a; PROF.gl = performance.now() - b; PROF.calls = stg.calls; PROF.tris = stg.tris; }
      else {   // motion blur: average nb sub-frames across a 180° shutter
        const ax = accA.getContext('2d'); ax.globalAlpha = 1;
        for (let k = 0; k < nb; k++) { const st_ = Math.max(0, lt - (shutter / E.fps) * (1 - k / (nb - 1))), at = rampT(shot, st_); def.draw(st, at, { ...info, globalT: shot.start + st_ }, three); stg.tick?.(at); render(shot.start + st_); ax.globalAlpha = 1 / (k + 1); ax.drawImage(glCanvas, 0, 0, accA.width, accA.height); }
        ax.globalAlpha = 1; g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(accA, 0, 0, buf.width, buf.height); g.restore();
      }
      if (def.overlay && !opts.noOverlay) { g.save(); def.overlay(g, lt, info, st); g.restore(); }
      if (!opts.noOverlay) { g.save(); drawHuds(g, shot, lt, st, stg); g.restore(); }
      if (!opts.noOverlay) drawBubble(g, shot, lt, st, stg, def, info);
    } else {
      const bd = shot.backdrop || def.backdrop; if (bd) drawBackdrop(g, bd, info.p);
      g.save(); def.draw(g, lt, info); g.restore(); if (!opts.noOverlay) drawBubble(g, shot, lt, null, null);
    }
  } catch (e) { const msg = `${shot.id}@${lt.toFixed(2)}: ${e.message}`; if (!errors.includes(msg) && errors.length < 200) errors.push(msg); console.log('SHOT ERROR', msg, e.stack?.split('\n')[1]);
    g.setTransform(E.PX, 0, 0, E.PX, 0, 0); text(g, 'ERROR ' + msg.slice(0, 90), E.W / 2, E.H / 2, { size: 34, color: '#ff4040', font: FONTS.ui, weight: 900 }); }
}
const BARS = () => ({ none: 0, cine: V(68, 0), wide: V(60, 0), scope: V(138, 170), thin: V(30, 60) });   // cine = 2:1 picture in a 16:9 frame
const barVal = (s) => (typeof (s?.bars ?? E.cfg.bars) === 'number' ? (s.bars ?? E.cfg.bars) : BARS()[s?.bars ?? E.cfg.bars ?? 'none'] ?? 0);

const PROF = (window.PROF = {});
window.renderFrame = function (f) {
  const T0 = performance.now();
  const t = f / E.fps, i = shotIndexAt(t), shot = E.shots[i], lt = t - shot.start;
  drawShot(bufA, shot, lt);
  const tr = shot.in || { type: 'cut' }, tdur = tr.dur ?? (tr.type === 'whip' ? 0.35 : tr.type === 'smash' ? 0.3 : 0.5);
  const W = main.width, H = main.height; mg.setTransform(1, 0, 0, 1, 0, 0); mg.globalAlpha = 1; mg.globalCompositeOperation = 'source-over';
  const GL = gradeFor(shot), grade = GL.grade; mg.filter = grade.filter && grade.filter !== 'none' ? grade.filter : 'none';
  if (tr.type === 'smash' && i > 0 && lt < tdur) {   // smash cut: one white frame, then the new shot lands with a punch and a dying shake
    const k = lt / tdur, d = (1 - k) ** 2, sh = Math.sin(lt * 70) * 0.012 * d * W, sc = 1 + 0.07 * d;
    mg.translate(W / 2 + sh, H / 2 + Math.cos(lt * 83) * 0.008 * d * H); mg.scale(sc, sc); mg.drawImage(bufA, -W / 2, -H / 2); mg.setTransform(1, 0, 0, 1, 0, 0);
    if (lt < 1.5 / E.fps) { mg.filter = 'none'; mg.fillStyle = '#fff'; mg.fillRect(0, 0, W, H); }
  } else if (tr.type !== 'cut' && i > 0 && lt < tdur) {
    const prev = E.shots[i - 1], k = ease.inOut(lt / tdur); drawShot(bufB, prev, t - prev.start);
    if (tr.type === 'fade') { mg.drawImage(bufB, 0, 0); mg.globalAlpha = k; mg.drawImage(bufA, 0, 0); }
    else if (tr.type === 'dip' || tr.type === 'dipWhite') { const c = tr.type === 'dip' ? '#000' : '#fff'; mg.drawImage(k < 0.5 ? bufB : bufA, 0, 0); mg.filter = 'none'; mg.globalAlpha = k < 0.5 ? k * 2 : (1 - k) * 2; mg.fillStyle = c; mg.fillRect(0, 0, W, H); }
    else if (tr.type === 'flash') { mg.drawImage(bufA, 0, 0); mg.filter = 'none'; mg.globalAlpha = (1 - lt / tdur) ** 2; mg.fillStyle = '#fff'; mg.fillRect(0, 0, W, H); }
    else if (tr.type === 'whip') {   // a real whip pan: both shots slide together, smeared along the move (strongest mid-way)
      const dir = tr.dir || 1, N = 10, smear = W * 0.22 * Math.sin(Math.PI * clamp(lt / tdur));
      for (let s = 0; s < N; s++) { const o = (s / (N - 1) - 0.5) * smear * dir; mg.globalAlpha = 1 / (s + 1); mg.drawImage(bufB, -dir * k * W + o, 0); mg.drawImage(bufA, dir * (1 - k) * W + o, 0); }
    }
    else if (tr.type === 'zoom') { mg.drawImage(bufB, 0, 0); const s = 1.15 - 0.15 * k; mg.globalAlpha = k; mg.translate(W / 2, H / 2); mg.scale(s, s); mg.drawImage(bufA, -W / 2, -H / 2); mg.setTransform(1, 0, 0, 1, 0, 0); }
    else mg.drawImage(bufA, 0, 0);
  } else mg.drawImage(bufA, 0, 0);
  mg.globalAlpha = 1; mg.filter = 'none'; mg.setTransform(1, 0, 0, 1, 0, 0);
  drawGag(mg, t);   // the subscribe gag runs across cuts, under the grade so it sits in the picture
  mg.save(); mg.setTransform(E.PX, 0, 0, E.PX, 0, 0); drawCounters(mg, t, shot); mg.restore(); mg.setTransform(1, 0, 0, 1, 0, 0);
  if (q.has('prof')) mg.getImageData(0, 0, 1, 1);
  const T1 = performance.now(); applyGrade(W, H, GL.lut); PROF.grade = performance.now() - T1; PROF.before = T1 - T0;
  if (grade.tint) { mg.globalCompositeOperation = grade.tint[1]; mg.fillStyle = alpha(grade.tint[0], grade.tint[2]); mg.fillRect(0, 0, W, H); mg.globalCompositeOperation = 'source-over'; }
  if (shot.vignette !== false && grade.vignette > 0) { const v = mg.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.62); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `rgba(0,0,0,${grade.vignette})`); mg.fillStyle = v; mg.fillRect(0, 0, W, H); }
  if (grade.grain > 0) { mg.save(); mg.globalAlpha = grade.grain; mg.globalCompositeOperation = 'overlay'; mg.drawImage(grainTiles[f % 4], 0, 0, W, H); mg.restore(); }
  mg.setTransform(E.PX, 0, 0, E.PX, 0, 0);
  if (E.cfg.captions && shot.captions !== false) captions(mg, t, E.cfg.captionStyle || {});
  const cur = barVal(shot), prevB = i > 0 ? barVal(E.shots[i - 1]) : cur, bar = prevB + (cur - prevB) * ease.inOut(prog(lt, 0, 0.6));
  if (bar > 0) { mg.fillStyle = '#000'; mg.fillRect(0, 0, E.W, bar); mg.fillRect(0, E.H - bar, E.W, bar); }
  const fi = E.cfg.fadeIn ?? 0.5, fo = E.cfg.fadeOut ?? 0.8, dur = window.DURATION, fade = Math.max(fi > 0 ? 1 - t / fi : 0, fo > 0 ? 1 - (dur - t) / fo : 0);
  if (fade > 0) { mg.fillStyle = `rgba(0,0,0,${clamp(fade)})`; mg.fillRect(0, 0, E.W, E.H); }
  if (q.has('debug')) { mg.fillStyle = 'rgba(0,0,0,.6)'; mg.fillRect(0, E.H - 54, E.W, 54); text(mg, `${shot.id}  ${t.toFixed(2)}s  (${lt.toFixed(2)}/${(shot.end - shot.start).toFixed(2)})  ${(shot.line || '').slice(0, 70)}`, 20, E.H - 27, { size: 26, color: '#fff', font: FONTS.ui, weight: 800, align: 'left' }); }
  mg.setTransform(1, 0, 0, 1, 0, 0);
};
boot().catch(e => { window.BOOT_ERROR = e.message + '\n' + e.stack; console.log('BOOT ERROR', e.message); });

// 1.0.2 motion QC (engine/qc3d.js): window.qcFrame(f) renders frame f and returns the probe (issues + a joint snapshot)
import('./qc3d.js').then(Q => {
  window.qcFrame = (f) => { window.CUR3D = null; window.renderFrame(f); const c = window.CUR3D; if (!c) return { issues: [], snap: {}, shot: null };
    const subject = c.shot.qcSubject ?? c.def.qcSubject ?? 'YOU'; const r = Q.probe(c.stg, { subject }); const ign = new Set([...(c.shot.qcIgnore || []), ...(c.def.qcIgnore || [])]);
    return { issues: r.issues.filter(i => !ign.has(i.kind)), snap: r.snap, shot: c.shot.id, lt: c.lt, ignore: [...ign] }; };
  // one sample: frames f-1, f, f+1 of the same shot → geometry issues at f + motion issues across the three
  window.qcSample = (f) => { const a = window.qcFrame(Math.max(0, f - 1)), c0 = window.qcFrame(f + 1), b = window.qcFrame(f);
    const mo = a.shot === b.shot && c0.shot === b.shot ? Q.motion(a.snap, b.snap, c0.snap, 1 / E.fps).filter(i => !(b.ignore || []).includes(i.kind)) : [];
    return { shot: b.shot, t: +(f / E.fps).toFixed(2), lt: +(b.lt ?? 0).toFixed(2), issues: [...b.issues, ...mo] }; };
});
