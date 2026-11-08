// engine/diagrams2d.js — animated explainer pictures, drawn on top of the purple stage or a blurred scene.
// Import in a shot: import * as D from '/engine/diagrams2d.js';  then in overlay() or a 2D draw(): D.scale(g, { x, y, value: 0.7, t, start: 0.2 })
// Every function takes logical coordinates (1920x1080 / 1080x1920), a size, t (shot time) and start (pop-in time).
// Look: flat fills, a dark outline, small letter-spaced labels. Colours come from S().ui so a style switch re-themes them.
import { E, V, S, FONTS, clamp, ease, lerp, prog, rr, text, circle, ring, alpha, shade, measure, hash01 } from './core.js';

const LINE = '#241a38', PAPER = '#f6efe4', SOFT = 'rgba(255,241,220,.92)', MUTE = 'rgba(255,241,220,.45)';
const gold = () => S().ui?.gold || '#ffd98a', accent = () => S().ui?.accent || '#ff5a6a', good = () => S().ui?.good || '#5fd39a';
const LF = () => (S().ui?.labelFont === 'serif' ? FONTS.serif : FONTS.ui);
const pop = (t, start = 0, d = 0.35) => (t == null ? 1 : ease.outBack(prog(t, start, start + d)));
const inK = (t, start = 0, d = 0.5) => (t == null ? 1 : ease.out(prog(t, start, start + d)));
export const label = (g, str, x, y, o = {}) => { const f = LF(); text(g, str, x, y, { size: o.size || 28, font: f, weight: f === FONTS.serif ? 700 : 900, color: o.color || SOFT, spacing: o.spacing ?? 3, align: o.align || 'center', alpha: o.a ?? 1 }); };
function enter(g, t, start, x, y, s, fn) { const k = pop(t, start); if (k <= 0.001) return; g.save(); g.globalAlpha *= clamp(k * 1.4); g.translate(x, y); g.scale(k * s, k * s); fn(); g.restore(); }
const stroke = (g, w = 4, c = LINE) => { g.lineWidth = w; g.strokeStyle = c; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(); };
const fillStroke = (g, f, w = 4, c = LINE) => { g.fillStyle = f; g.fill(); stroke(g, w, c); };

// the purple stage painted in 2D, for 2D shots without a 3D set: stage2d(g, { floor: true })
export function stage2d(g, o = {}) {
  const c = o.color || S().ui?.explainBg || '#34264f', fy = o.floorY ?? E.H - 190, gr = g.createRadialGradient(E.W / 2, E.H * 0.45, 40, E.W / 2, E.H * 0.45, E.W * 0.62);
  gr.addColorStop(0, shade(c, 0.12)); gr.addColorStop(1, shade(c, -0.35)); g.fillStyle = gr; g.fillRect(0, 0, E.W, E.H);
  g.strokeStyle = 'rgba(255,255,255,.035)'; g.lineWidth = 1.5; for (let x = 0; x <= E.W; x += 48) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, E.H); g.stroke(); } for (let y = 0; y <= E.H; y += 48) { g.beginPath(); g.moveTo(0, y); g.lineTo(E.W, y); g.stroke(); }
  if (o.floor !== false) { g.fillStyle = 'rgba(10,6,24,.28)'; g.fillRect(0, fy, E.W, E.H - fy); g.fillStyle = 'rgba(255,241,220,.3)'; g.fillRect(0, fy, E.W, 2); }
  if (o.live !== false) stageLife(g, o.t ?? E.shotT ?? 0, { floorY: fy, ...o });
}
// the stage never sits still: a warm light pool drifts slowly across the back and dust motes float up through it
// (stage2d does this by itself; call it alone on a backdrop shot). The time comes from the shot, so it is deterministic.
export function stageLife(g, t, o = {}) {
  const px = E.W / 2 + Math.sin(t * 0.21) * E.W * 0.14, py = E.H * 0.42 + Math.cos(t * 0.16) * E.H * 0.05, R = E.W * 0.4;
  g.save(); g.globalCompositeOperation = 'lighter';
  const lg = g.createRadialGradient(px, py, 0, px, py, R); lg.addColorStop(0, 'rgba(255,224,186,.085)'); lg.addColorStop(1, 'rgba(255,224,186,0)'); g.fillStyle = lg; g.fillRect(0, 0, E.W, E.H);
  const n = o.motes ?? 48, H = E.H + 60;
  for (let i = 0; i < n; i++) {
    const h1 = hash01(i, 3), h2 = hash01(i, 5), h3 = hash01(i, 7), x = h1 * E.W + Math.sin(t * 0.5 + i * 1.7) * 22, y = E.H + 30 - ((h2 * H + t * (12 + h3 * 22)) % H);
    const near = Math.hypot(x - px, y - py) < R ? 1 : 0.5;
    g.fillStyle = `rgba(255,240,222,${((0.08 + 0.2 * h2) * near).toFixed(3)})`; g.beginPath(); g.arc(x, y, 1.4 + h3 * 2.8, 0, Math.PI * 2); g.fill();
  }
  g.restore();
}
// ---------------------------------------------------------------- people
// flat 2D stand-in for a cast member: flatFigure(g, { x, y, h: 420, color, hairColor, hair: 'anime'|'spiky'|'short'|'bob'|'none', expr: 'neutral'|'deadpan'|'happy'|'shock', pose: 'stand'|'point'|'cheer'|'shrug', mirror })
export function flatFigure(g, o = {}) {
  const { x = 300, y = E.H - 150, h = 420, color = '#b4f02e', hairColor = null, hair = hairColor ? 'short' : 'none', skin = '#efe8f0', expr = 'neutral', pose = 'stand', mirror = false, t = null, start = 0, seams = false } = o;
  enter(g, t, start, x, y, (h / 180) * (mirror ? 1 : 1), () => {
    if (mirror) g.scale(-1, 1); g.lineCap = 'round'; g.lineJoin = 'round';
    g.strokeStyle = skin; g.lineWidth = 7; g.beginPath(); g.moveTo(-11, -46); g.lineTo(-13, -3); g.moveTo(11, -46); g.lineTo(13, -3); g.stroke();
    g.fillStyle = skin; g.beginPath(); g.ellipse(-15, 0, 9, 5, 0, 0, 7); g.ellipse(15, 0, 9, 5, 0, 0, 7); g.fill();
    g.strokeStyle = color; g.lineWidth = 11; const arms = { stand: [[25, -92, 33, -58], [-25, -92, -33, -58]], point: [[25, -92, 62, -84], [-25, -92, -33, -58]], cheer: [[25, -92, 40, -128], [-25, -92, -40, -128]], shrug: [[25, -92, 44, -96], [-25, -92, -44, -96]] }[pose] || [[25, -92, 33, -58], [-25, -92, -33, -58]];
    for (const [a, b, c, d] of arms) { g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke(); circle(g, c + (c > 0 ? 3 : -3), d + (pose === 'cheer' ? -3 : 2), 7, skin); }
    rr(g, -25, -100, 50, 58, 12); g.fillStyle = color; g.fill(); stroke(g, 2.5);
    if (seams) { g.strokeStyle = shade(color, -0.28); g.lineWidth = 2.5; for (const yy of [-88, -76, -64, -52]) { g.beginPath(); g.moveTo(-24, yy); g.lineTo(24, yy); g.stroke(); } }
    g.strokeStyle = skin; g.lineWidth = 6; g.beginPath(); g.moveTo(0, -100); g.lineTo(0, -112); g.stroke();
    g.beginPath(); g.arc(0, -138, 30, 0, 7); fillStroke(g, skin, 2.5);
    if (hair === 'anime') { g.beginPath(); [[-31, -138], [-44, -146], [-32, -156], [-43, -176], [-25, -170], [-26, -194], [-10, -178], [0, -202], [10, -178], [26, -194], [25, -170], [43, -176], [32, -156], [44, -146], [31, -138], [24, -152], [15, -145], [8, -155], [0, -146], [-8, -155], [-15, -145], [-24, -152]].forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py))); g.closePath(); fillStroke(g, hairColor || '#e8ecf6', 2.5); }
    else if (hair !== 'none') { g.fillStyle = hairColor || '#6a3f26'; if (hair === 'spiky') for (const [sx, hh] of [[-20, 10], [-11, 15], [-2, 18], [7, 15], [16, 12]]) { g.beginPath(); g.moveTo(sx - 7, -158); g.lineTo(sx, -158 - hh); g.lineTo(sx + 7, -158); g.fill(); } g.beginPath(); g.ellipse(0, -158, 24, 8, 0, 0, 7); g.fill(); if (hair === 'bob') { g.beginPath(); g.arc(0, -140, 32, Math.PI * 0.95, Math.PI * 2.05); g.fill(); rr(g, -32, -142, 10, 30, 5); g.fill(); rr(g, 22, -142, 10, 30, 5); g.fill(); } }
    g.fillStyle = '#1a1420'; g.strokeStyle = '#1a1420'; g.lineWidth = 2.4;
    if (expr === 'deadpan') { g.beginPath(); g.moveTo(-16, -138); g.lineTo(-5, -138); g.moveTo(6, -138); g.lineTo(17, -138); g.stroke(); }
    else if (expr === 'happy') { g.beginPath(); g.arc(-10, -136, 4.5, Math.PI * 1.1, Math.PI * 1.9); g.moveTo(16, -136); g.arc(11, -136, 4.5, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }
    else { g.beginPath(); g.arc(-10, -137, expr === 'shock' ? 4 : 3, 0, 7); g.arc(11, -137, expr === 'shock' ? 4 : 3, 0, 7); g.fill(); }
    g.beginPath(); if (expr === 'shock') { g.arc(0, -122, 4.5, 0, 7); g.fill(); } else if (expr === 'happy') { g.arc(0, -126, 8, 0.2, Math.PI - 0.2); g.stroke(); } else { g.moveTo(-4, -122); g.lineTo(5, -122); g.stroke(); }
  });
}

// ---------------------------------------------------------------- objects and instruments
// a house cut open: pipes run from the ground up to a sink. crossSection(g, { x, y, s, left: 'WATER', right: 'SEWER', title, t })
export function crossSection(g, o = {}) {
  const { x = E.W / 2, y = 760, s = 1, left = 'WATER', right = 'SEWER', title = null, t = null, start = 0, cut = 0, leftC = '#6ab8f2', rightC = '#b9915f', groundW = 4400 } = o;
  enter(g, t, start, x, y, s, () => {
    const W = groundW;
    g.fillStyle = '#4c3a3c'; g.fillRect(-W / 2, 0, W, 330); g.fillStyle = '#5f8a58'; g.fillRect(-W / 2, -5, W, 8);
    g.beginPath(); g.moveTo(-270, -380); g.lineTo(0, -560); g.lineTo(270, -380); g.closePath(); fillStroke(g, '#4d3b63', 6);
    rr(g, -210, -380, 420, 380, 4); fillStroke(g, '#2d2140', 8, '#a98fa8');
    rr(g, -130, -130, 170, 130, 4); fillStroke(g, '#d7ccb4', 3); rr(g, -115, -152, 150, 18, 6); fillStroke(g, '#e8e4ee', 3);
    g.strokeStyle = '#d8d4e0'; g.lineWidth = 8; g.beginPath(); g.moveTo(-40, -152); g.lineTo(-40, -196); g.lineTo(-10, -196); g.stroke();
    for (const [px, c, off] of [[-60, leftC, 0], [-16, rightC, 1]]) { const shift = off ? cut * 34 : cut * -22; g.fillStyle = c; g.fillRect(px - 8, -130, 16, 160); g.fillRect(px - 8 + shift, 30, 16, 300); }
    if (left) label(g, left, -110, 110, { size: 30, align: 'right' }); if (right) label(g, right, 34, 110, { size: 30, align: 'left' });
  });
  if (title) label(g, title, x, y - 590 * s, { size: 44, a: inK(t, start + 0.2) });
}
// weighing scale with a needle and a load on top: scale(g, { x, y, s, value: 0..1, label: '15 LB', load: 'box'|null, t })
export function scale(g, o = {}) {
  const { x = E.W / 2, y = 760, s = 1, value = 0.5, label: lab = null, load = 'box', loadColor = '#c9a06a', t = null, start = 0 } = o; const k = inK(t, start + 0.25, 0.7), v = value * k;
  enter(g, t, start, x, y, s, () => {
    rr(g, -150, -46, 300, 46, 8); fillStroke(g, '#3a2f55', 4); rr(g, -170, -62, 340, 18, 8); fillStroke(g, '#d8d4e0', 4);
    g.beginPath(); g.arc(0, -22, 19, 0, 7); fillStroke(g, PAPER, 3); const a = -Math.PI / 2 + (v - 0.5) * 2.4; g.strokeStyle = accent(); g.lineWidth = 3; g.beginPath(); g.moveTo(0, -22); g.lineTo(Math.cos(a) * 15, -22 + Math.sin(a) * 15); g.stroke();
    if (load === 'box') { const dy = (1 - ease.outBack(prog(t ?? 9, start + 0.1, start + 0.45))) * -60; rr(g, -62, -170 + dy, 124, 108, 6); fillStroke(g, loadColor, 4); g.fillStyle = shade(loadColor, -0.18); g.fillRect(-10, -170 + dy, 20, 108); }
  });
  if (lab) label(g, lab, x, y + 56 * s, { size: 34, a: inK(t, start + 0.4), color: gold() });
}
// tear-off calendar card: calendarCard(g, { x, y, s, head: 'MONTH', value: 5, t })
export function calendarCard(g, o = {}) {
  const { x = 400, y = 300, s = 1, head = 'MONTH', value = 1, t = null, start = 0 } = o;
  enter(g, t, start, x, y, s, () => { rr(g, -90, -100, 180, 200, 18); fillStroke(g, '#1d1730', 4, 'rgba(255,241,220,.3)'); g.save(); rr(g, -90, -100, 180, 54, 18); g.clip(); g.fillStyle = accent(); g.fillRect(-90, -100, 180, 54); g.restore(); text(g, head, 0, -74, { size: 28, font: FONTS.ui, weight: 900, color: '#fff', spacing: 3 }); text(g, String(value), 0, 30, { size: 96, font: LF(), weight: 900, color: PAPER }); });
}
// bars that grow one after the other: growthBars(g, { x, y, w, h, values: [0.1, 0.2, 0.5, 1], labels, highlightLast, t, rate })
export function growthBars(g, o = {}) {
  const { x = E.W / 2, y = 800, w = 800, h = 420, values = [0.1, 0.18, 0.32, 0.56, 1], labels = null, t = null, start = 0, rate = 0.14, highlightLast = true } = o;
  const n = values.length, bw = (w / n) * 0.68, gap = (w - bw * n) / Math.max(1, n - 1);
  values.forEach((v, i) => { const k = t == null ? 1 : ease.outBack(prog(t, start + i * rate, start + i * rate + 0.4)), bh = Math.max(4, v * h * k), bx = x - w / 2 + i * (bw + gap), last = i === n - 1; rr(g, bx, y - bh, bw, bh, 6); g.fillStyle = last && highlightLast ? gold() : 'rgba(186,160,226,.7)'; g.fill(); if (labels?.[i]) label(g, labels[i], bx + bw / 2, y + 34, { size: 24, a: clamp(k) }); });
  g.strokeStyle = MUTE; g.lineWidth = 3; g.beginPath(); g.moveTo(x - w / 2 - 20, y); g.lineTo(x + w / 2 + 20, y); g.stroke();
}
// stopwatch with a sweeping hand and a readout: stopwatch(g, { x, y, r, value: '9.58', label: 'WORLD RECORD', p: 0..1, t })
export function stopwatch(g, o = {}) {
  const { x = 1200, y = 420, r = 110, value = null, label: lab = null, p = null, t = null, start = 0 } = o; const hand = p != null ? p : (t ?? 0) * 0.6;
  enter(g, t, start, x, y, 1, () => { rr(g, -14, -r - 34, 28, 24, 5); fillStroke(g, '#d8d4e0', 3); g.beginPath(); g.arc(0, 0, r, 0, 7); fillStroke(g, PAPER, 6); for (let i = 0; i < 12; i++) { const a = (i / 12) * 6.283; g.strokeStyle = 'rgba(36,26,56,.5)'; g.lineWidth = i % 3 ? 2 : 4; g.beginPath(); g.moveTo(Math.sin(a) * r * 0.82, -Math.cos(a) * r * 0.82); g.lineTo(Math.sin(a) * r * 0.93, -Math.cos(a) * r * 0.93); g.stroke(); } const a = hand * 6.283; g.strokeStyle = accent(); g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.sin(a) * r * 0.78, -Math.cos(a) * r * 0.78); g.stroke(); circle(g, 0, 0, 7, LINE); });
  if (value) label(g, value, x, y + r + 54, { size: 44, color: gold(), a: inK(t, start + 0.2) }); if (lab) label(g, lab, x, y - r - 72, { size: 28, a: inK(t, start + 0.2) });
}
// sweeping radar with blips: radar(g, { x, y, r, blips: [[angle, dist]], label, t })
export function radar(g, o = {}) {
  const { x = E.W / 2, y = 540, r = 260, blips = [[0.6, 0.6]], label: lab = null, t = 0, start = 0 } = o; const a = (t ?? 0) * 2.2;
  enter(g, t, start, x, y, 1, () => { g.beginPath(); g.arc(0, 0, r, 0, 7); fillStroke(g, '#123d33', 5, PAPER); g.strokeStyle = 'rgba(160,240,190,.35)'; g.lineWidth = 2; for (const k of [0.33, 0.66]) { g.beginPath(); g.arc(0, 0, r * k, 0, 7); g.stroke(); } g.beginPath(); g.moveTo(-r, 0); g.lineTo(r, 0); g.moveTo(0, -r); g.lineTo(0, r); g.stroke(); g.save(); g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, r, a - 0.6, a); g.closePath(); g.fillStyle = 'rgba(120,240,160,.28)'; g.fill(); g.restore(); for (const [ba, bd] of blips) { circle(g, Math.cos(ba) * bd * r, Math.sin(ba) * bd * r, 9, accent()); } });
  if (lab) label(g, lab, x, y - r - 40, { size: 36, a: inK(t, start + 0.2) });
}
// seismograph trace with one spike: seismo(g, { x, y, w, h, amp: 0..1, spikeAt: 0..1, label, t })
export function seismo(g, o = {}) {
  const { x = E.W / 2, y = 420, w = 1000, h = 180, amp = 0.8, spikeAt = 0.5, label: lab = null, t = null, start = 0, color = '#ff6a8a' } = o; const k = inK(t, start, 1.2);
  rr(g, x - w / 2, y - h / 2, w, h, 12); g.fillStyle = 'rgba(22,14,42,.8)'; g.fill(); g.strokeStyle = 'rgba(255,241,220,.25)'; g.lineWidth = 2; g.stroke();
  g.save(); g.beginPath(); g.rect(x - w / 2, y - h / 2, w * k, h); g.clip(); g.strokeStyle = color; g.lineWidth = 3; g.beginPath(); for (let i = 0; i <= 240; i++) { const u = i / 240, env = Math.exp(-(((u - spikeAt) * 12) ** 2)), yy = Math.sin(u * 190) * (2 + 0.42 * h * amp * env) + Math.sin(u * 53) * 2; const px = x - w / 2 + u * w; i ? g.lineTo(px, y + yy) : g.moveTo(px, y + yy); } g.stroke(); g.restore();
  if (lab) label(g, lab, x, y - h / 2 - 34, { size: 32, a: inK(t, start) });
}
// street grid with pins dropping in: mapPins(g, { x, y, w, h, pins: 40, seed, label, t, rate })
export function mapPins(g, o = {}) {
  const { x = E.W / 2, y = 540, w = 760, h = 520, pins = 30, seed = 7, label: lab = null, t = null, start = 0, rate = 0.04, pinColor = '#ff5a6a' } = o; let s = seed * 9301 + 49297; const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  enter(g, t, start, x, y, 1, () => { rr(g, -w / 2, -h / 2, w, h, 10); fillStroke(g, '#2b2342', 4, 'rgba(255,241,220,.35)'); g.strokeStyle = 'rgba(255,241,220,.75)'; g.lineWidth = 7; for (let i = 1; i < 6; i++) { const xx = -w / 2 + (i * w) / 6; g.beginPath(); g.moveTo(xx, -h / 2 + 4); g.lineTo(xx, h / 2 - 4); g.stroke(); } for (let i = 1; i < 5; i++) { const yy = -h / 2 + (i * h) / 5; g.beginPath(); g.moveTo(-w / 2 + 4, yy); g.lineTo(w / 2 - 4, yy); g.stroke(); } for (const [px, py] of [[-0.3, -0.25], [0.28, 0.2], [0.05, -0.08]]) { g.beginPath(); g.ellipse(px * w, py * h, 62, 44, 0, 0, 7); g.fillStyle = 'rgba(95,150,95,.78)'; g.fill(); } for (let i = 0; i < pins; i++) { const px = (rnd() - 0.5) * w * 0.92, py = (rnd() - 0.5) * h * 0.9, kk = t == null ? 1 : ease.outBack(prog(t, start + 0.2 + i * rate, start + 0.45 + i * rate)); if (kk <= 0.01) continue; g.save(); g.translate(px, py); g.scale(kk, kk); g.fillStyle = pinColor; g.beginPath(); g.arc(0, -13, 8, Math.PI, 0); g.lineTo(0, 0); g.closePath(); g.fill(); circle(g, 0, -13, 3, '#fff'); g.restore(); } });
  if (lab) label(g, lab, x, y - h / 2 - 34, { size: 34, a: inK(t, start) });
}
// simple map of the US with animated dots: usMap(g, { x, y, s, dots: 20, label, t })
const US = [[-.5, -.28], [-.2, -.3], [.1, -.29], [.2, -.24], [.27, -.28], [.33, -.2], [.43, -.28], [.48, -.33], [.5, -.26], [.44, -.15], [.38, -.06], [.36, .05], [.39, .2], [.37, .24], [.33, .1], [.2, .13], [.14, .22], [.04, .15], [-.07, .16], [-.12, .25], [-.2, .15], [-.3, .13], [-.44, .05], [-.49, -.1]];
export function usMap(g, o = {}) {
  const { x = E.W / 2, y = 500, s = 1, w = 900, color = '#6e5c98', dots = 0, label: lab = null, t = null, start = 0, seed = 3 } = o; let r = seed * 7919; const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
  enter(g, t, start, x, y, s, () => { g.beginPath(); US.forEach(([a, b], i) => (i ? g.lineTo(a * w, b * w) : g.moveTo(a * w, b * w))); g.closePath(); fillStroke(g, color, 5, 'rgba(255,241,220,.55)'); for (let i = 0; i < dots; i++) { const px = (rnd() - 0.5) * 0.8 * w, py = (rnd() - 0.55) * 0.42 * w, kk = t == null ? 1 : ease.outBack(prog(t, start + 0.3 + i * 0.03, start + 0.5 + i * 0.03)); if (kk > 0) circle(g, px, py, 7 * kk, gold()); } });
  if (lab) label(g, lab, x, y - 0.42 * w * s, { size: 34, a: inK(t, start) });
}
// slowly turning globe: globe(g, { x, y, r, t })
export function globe(g, o = {}) {
  const { x = E.W / 2, y = 500, r = 200, t = 0, start = 0, land = '#6ea868', sea = '#3f6fb8' } = o; const spin = (t ?? 0) * 0.25;
  enter(g, t, start, x, y, 1, () => { g.beginPath(); g.arc(0, 0, r, 0, 7); fillStroke(g, sea, 5, 'rgba(255,241,220,.6)'); g.save(); g.beginPath(); g.arc(0, 0, r - 2, 0, 7); g.clip(); for (const [lon, lat, sz] of [[0.2, -0.4, 0.42], [1.5, -0.3, 0.3], [2.6, 0.2, 0.34], [3.8, -0.2, 0.46], [5, 0.35, 0.28], [5.8, -0.5, 0.22]]) { const a = lon + spin, cx = Math.sin(a), cz = Math.cos(a); if (cz < -0.2) continue; g.beginPath(); g.ellipse(cx * r * 0.92, lat * r, sz * r * Math.max(0.25, cz), sz * r * 0.68, 0.3, 0, 7); g.fillStyle = land; g.fill(); } g.restore(); });
}
// organ pictograms: organ(g, { kind: 'brain'|'lungs'|'kidneys'|'heart', x, y, r, pulse, t })
export function organ(g, o = {}) {
  const { kind = 'brain', x = E.W / 2, y = 400, r = 100, pulse = 0, t = null, start = 0 } = o; const b = 1 + pulse * 0.06 * Math.sin((t ?? 0) * 7);
  enter(g, t, start, x, y, b, () => {
    if (kind === 'brain') { g.fillStyle = '#f3b48a'; g.beginPath(); for (let i = 0; i < 12; i++) { const an = (i / 12) * 6.283, q = r * (1 + 0.12 * Math.cos(i * 2)), px = Math.cos(an) * q * 1.12, py = Math.sin(an) * q * 0.9; g.moveTo(px + r * 0.3, py); g.arc(px, py, r * 0.3, 0, 7); } g.fill(); g.beginPath(); g.ellipse(0, 0, r * 1.12, r * 0.9, 0, 0, 7); g.fill(); g.strokeStyle = '#9a5a48'; g.lineWidth = r * 0.06; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, -r * 0.8); g.bezierCurveTo(r * 0.2, -r * 0.3, -r * 0.2, r * 0.2, 0, r * 0.85); g.moveTo(-r * 0.7, -r * 0.2); g.quadraticCurveTo(-r * 0.3, -r * 0.35, -r * 0.3, r * 0.1); g.moveTo(r * 0.7, -r * 0.1); g.quadraticCurveTo(r * 0.3, -r * 0.3, r * 0.32, r * 0.2); g.stroke(); }
    if (kind === 'lungs') { g.fillStyle = '#f08a9a'; for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(sx * r * 0.1, -r * 0.7); g.bezierCurveTo(sx * r * 0.95, -r * 0.5, sx * r * 1.05, r * 0.95, sx * r * 0.55, r * 0.95); g.bezierCurveTo(sx * r * 0.2, r * 0.95, sx * r * 0.15, r * 0.4, sx * r * 0.1, -r * 0.7); fillStroke(g, '#f08a9a', 4); } rr(g, -r * 0.07, -r * 1.15, r * 0.14, r * 0.62, r * 0.05); fillStroke(g, PAPER, 3); }
    if (kind === 'kidneys') { for (const sx of [-1, 1]) { g.save(); g.scale(sx, 1); g.beginPath(); g.moveTo(r * 0.3, -r * 0.2); g.bezierCurveTo(r * 0.3, -r * 0.95, r * 1.2, -r * 0.8, r * 1.1, 0); g.bezierCurveTo(r * 1.05, r * 0.85, r * 0.3, r * 0.9, r * 0.32, r * 0.2); g.quadraticCurveTo(r * 0.55, 0, r * 0.3, -r * 0.2); fillStroke(g, '#c8505a', 4); g.restore(); } }
    if (kind === 'heart') { g.beginPath(); g.moveTo(0, r * 0.95); g.bezierCurveTo(-r * 1.5, -r * 0.1, -r * 0.7, -r * 1.1, 0, -r * 0.4); g.bezierCurveTo(r * 0.7, -r * 1.1, r * 1.5, -r * 0.1, 0, r * 0.95); fillStroke(g, '#e8506a', 4); }
  });
}
// ---------------------------------------------------------------- screens
function phoneBody(g, w, h) { rr(g, -w / 2, -h / 2, w, h, w * 0.12); fillStroke(g, '#14102a', 6, '#3a3058'); rr(g, -w * 0.45, -h * 0.47, w * 0.9, h * 0.94, w * 0.08); g.fillStyle = '#231b42'; g.fill(); rr(g, -w * 0.13, -h * 0.455, w * 0.26, h * 0.02, h * 0.01); g.fillStyle = '#0c0a18'; g.fill(); }
// phone with chat bubbles arriving: phoneChat(g, { x, y, h, title, msgs: [{ me: false, str }], t, rate })
export function phoneChat(g, o = {}) {
  const { x = E.W / 2, y = 540, h = 760, title = 'CHAT', msgs = [{ str: 'look outside' }], t = null, start = 0, rate = 0.8 } = o, w = h * 0.5;
  enter(g, t, start, x, y, 1, () => { phoneBody(g, w, h); text(g, title, 0, -h * 0.385, { size: h * 0.034, font: FONTS.ui, weight: 900, color: SOFT, spacing: 2 }); g.strokeStyle = 'rgba(255,255,255,.14)'; g.lineWidth = 2; g.beginPath(); g.moveTo(-w * 0.42, -h * 0.345); g.lineTo(w * 0.42, -h * 0.345); g.stroke(); let yy = -h * 0.3; const sz = h * 0.04; msgs.forEach((m, i) => { const kk = t == null ? 1 : ease.outBack(prog(t, start + 0.2 + i * rate, start + 0.45 + i * rate)); if (kk <= 0.01) return; const words = m.str.split(' '), lines = []; let cur = ''; for (const wd of words) { const n = cur ? cur + ' ' + wd : wd; if (measure(g, n, sz, FONTS.ui, 800) > w * 0.62 && cur) { lines.push(cur); cur = wd; } else cur = n; } lines.push(cur); const bw = Math.max(...lines.map(l => measure(g, l, sz, FONTS.ui, 800))) + sz * 1.4, bh = lines.length * sz * 1.25 + sz * 0.8, bx = m.me ? w * 0.4 - bw : -w * 0.4; g.save(); g.translate(bx + bw / 2, yy + bh / 2); g.scale(kk, kk); rr(g, -bw / 2, -bh / 2, bw, bh, sz * 0.7); g.fillStyle = m.me ? '#2f86f0' : '#ffffff'; g.fill(); lines.forEach((l, li) => text(g, l, 0, -bh / 2 + sz * 0.4 + sz * 1.25 * (li + 0.5), { size: sz, font: FONTS.ui, weight: 800, color: m.me ? '#fff' : '#16121e' })); g.restore(); yy += bh + sz * 0.5; }); });
}
// phone with one big number: phoneStat(g, { x, y, h, head: 'VIEWS', value: '2,000,000', t })
export function phoneStat(g, o = {}) {
  const { x = E.W / 2, y = 540, h = 640, head = 'VIEWS', value = '2,000,000', t = null, start = 0 } = o, w = h * 0.5;
  enter(g, t, start, x, y, 1, () => { phoneBody(g, w, h); g.fillStyle = '#ff5a6a'; g.beginPath(); g.moveTo(-h * 0.03, -h * 0.13); g.lineTo(h * 0.04, -h * 0.09); g.lineTo(-h * 0.03, -h * 0.05); g.closePath(); g.fill(); const sz = Math.min(h * 0.17, (w * 0.8) / Math.max(1, value.length * 0.58)); text(g, value, 0, h * 0.02 + sz * 0.1, { size: sz, font: FONTS.ui, weight: 900, color: '#fff' }); text(g, head, 0, h * 0.02 + sz * 0.1 + sz * 0.5 + h * 0.03, { size: h * 0.032, font: FONTS.ui, weight: 900, color: MUTE, spacing: 3 }); });
}
// a framed clip with a view counter or LIVE badge: videoFrame(g, { x, y, w, views: '10,092,021', live: false, viewers: 1824, p, t }) (draw the scene behind it)
export function videoFrame(g, o = {}) {
  const { x = E.W / 2, y = 540, w = 1500, h = w * 0.5625, views = null, live = false, viewers = null, p = 0.3, t = null, start = 0 } = o; const k = inK(t, start, 0.3); if (k <= 0) return;
  g.save(); g.globalAlpha *= k; rr(g, x - w / 2, y - h / 2, w, h, 16); g.strokeStyle = 'rgba(255,241,220,.85)'; g.lineWidth = 5; g.stroke();
  g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(x - w / 2 + 24, y + h / 2 - 22, w - 48, 6); g.fillStyle = '#ff3a4a'; g.fillRect(x - w / 2 + 24, y + h / 2 - 22, (w - 48) * clamp(p), 6);
  const px = x - w / 2 + 28, py = y - h / 2 + 28;
  if (live) { rr(g, px, py, 92, 44, 8); g.fillStyle = '#e8263a'; g.fill(); text(g, 'LIVE', px + 46, py + 23, { size: 26, font: FONTS.ui, weight: 900, color: '#fff', spacing: 2 }); if (viewers != null) { rr(g, px + 104, py, 170, 44, 8); g.fillStyle = 'rgba(16,12,30,.75)'; g.fill(); text(g, Number(viewers).toLocaleString('en-US'), px + 189, py + 23, { size: 26, font: FONTS.ui, weight: 800, color: '#fff' }); } }
  else if (views != null) { const str = `${views} views`, tw = measure(g, str, 26, FONTS.ui, 800) + 62; rr(g, px, py, tw, 44, 8); g.fillStyle = 'rgba(16,12,30,.78)'; g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(px + 18, py + 13); g.lineTo(px + 34, py + 22); g.lineTo(px + 18, py + 31); g.closePath(); g.fill(); text(g, str, px + 44, py + 23, { size: 26, font: FONTS.ui, weight: 800, color: '#fff', align: 'left' }); }
  g.restore();
}
// ---------------------------------------------------------------- lists, stamps, meters
// clipboard checklist, items tick off one by one: checklist(g, { x, y, s, title, items: ['MAKEUP', 'OUTFITS'], done: 2, t, rate })
export function checklist(g, o = {}) {
  const { x = E.W / 2, y = 540, s = 1, title = 'THE PLAN', items = ['ONE', 'TWO', 'THREE'], done = items.length, t = null, start = 0, rate = 0.45 } = o, h = 170 + items.length * 74, w = 480;
  enter(g, t, start, x, y, s, () => { rr(g, -w / 2, -h / 2, w, h, 16); fillStroke(g, '#8a6a48', 5); rr(g, -w / 2 + 24, -h / 2 + 34, w - 48, h - 58, 8); g.fillStyle = PAPER; g.fill(); rr(g, -70, -h / 2 - 16, 140, 44, 8); fillStroke(g, '#3a3058', 4); text(g, title, 0, -h / 2 + 76, { size: 32, font: LF(), weight: 900, color: LINE, spacing: 3 }); items.forEach((it, i) => { const yy = -h / 2 + 140 + i * 74, k = t == null ? 1 : prog(t, start + 0.3 + i * rate, start + 0.5 + i * rate); rr(g, -w / 2 + 56, yy - 18, 36, 36, 6); g.fillStyle = '#fff'; g.fill(); stroke(g, 3); text(g, it, -w / 2 + 112, yy + 2, { size: 30, font: LF(), weight: 700, color: LINE, align: 'left' }); if (i < done && k > 0) { g.strokeStyle = accent(); g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); const x0 = -w / 2 + 62, x1 = x0 + 10, x2 = x0 + 32; g.moveTo(x0, yy - 2); if (k < 0.4) g.lineTo(lerp(x0, x1, k / 0.4), lerp(yy - 2, yy + 10, k / 0.4)); else { g.lineTo(x1, yy + 10); g.lineTo(lerp(x1, x2, (k - 0.4) / 0.6), lerp(yy + 10, yy - 16, (k - 0.4) / 0.6)); } g.stroke(); } }); });
}
// rubber stamp that slams down: stamp(g, { str: 'DISQUALIFIED', x, y, rot: -0.2, t, start })
export function stamp(g, o = {}) {
  const { str = 'DENIED', x = E.W / 2, y = E.H / 2, size = 84, rot = -0.2, color = '#e8324a', t = null, start = 0 } = o; const p = t == null ? 1 : prog(t, start, start + 0.16); if (p <= 0) return; const k = lerp(2.3, 1, ease.in(p)), f = LF(), w = measure(g, str, size, f, 900) + size;
  g.save(); g.globalAlpha *= clamp(p * 2.5) * 0.92; g.translate(x, y); g.rotate(rot); g.scale(k, k); rr(g, -w / 2, -size * 0.85, w, size * 1.7, size * 0.16); g.lineWidth = size * 0.11; g.strokeStyle = color; g.stroke(); text(g, str, 0, size * 0.04, { size, font: f, weight: 900, color, spacing: 2 }); g.restore();
}
// glowing scoreboard: scoreboard(g, { x, y, s, head: 'COOL', value: 2, t })  or two sides: left: ['HOME', 3], right: ['AWAY', 4]
export function scoreboard(g, o = {}) {
  const { x = E.W / 2, y = 360, s = 1, head = null, value = null, left = null, right = null, color = '#ff6aa8', t = null, start = 0 } = o;
  enter(g, t, start, x, y, s, () => { rr(g, -300, -120, 600, 240, 22); fillStroke(g, '#150f28', 7, color); g.save(); g.shadowColor = color; g.shadowBlur = 20; rr(g, -280, -100, 560, 200, 14); g.strokeStyle = alpha(color, 0.55); g.lineWidth = 2; g.stroke(); g.restore(); g.fillStyle = 'rgba(255,255,255,.07)'; for (let i = 0; i < 26; i++) for (let j = 0; j < 8; j++) { g.beginPath(); g.arc(-260 + i * 21, -84 + j * 24, 3, 0, 7); g.fill(); } if (left && right) { text(g, left[0], -140, -60, { size: 30, font: LF(), weight: 900, color: SOFT, spacing: 3 }); text(g, right[0], 140, -60, { size: 30, font: LF(), weight: 900, color: SOFT, spacing: 3 }); text(g, String(left[1]), -140, 30, { size: 110, font: FONTS.ui, weight: 900, color: gold() }); text(g, String(right[1]), 140, 30, { size: 110, font: FONTS.ui, weight: 900, color: gold() }); text(g, ':', 0, 24, { size: 90, font: FONTS.ui, weight: 900, color: MUTE }); } else { if (head) text(g, head, 0, -66, { size: 32, font: LF(), weight: 900, color, spacing: 4 }); text(g, String(value ?? 0), 0, 26, { size: 120, font: FONTS.ui, weight: 900, color: gold() }); } });
}
// ring that fills: progressRing(g, { x, y, r, p: 0..1, center: '3 MIN', label: 'AIR', color, t })
export function progressRing(g, o = {}) {
  const { x = 400, y = 400, r = 110, p = 0.7, center = null, label: lab = null, color = null, t = null, start = 0 } = o; const k = inK(t, start, 0.9) * p;
  enter(g, t, start, x, y, 1, () => { ring(g, 0, 0, r, r * 0.13, 'rgba(255,241,220,.14)'); g.strokeStyle = color || gold(); g.lineWidth = r * 0.13; g.lineCap = 'round'; g.beginPath(); g.arc(0, 0, r, -Math.PI / 2, -Math.PI / 2 + k * 6.283); g.stroke(); if (center) text(g, center, 0, 2, { size: r * 0.42, font: LF(), weight: 900, color: PAPER }); });
  if (lab) label(g, lab, x, y + r * 1.4, { size: 28, a: inK(t, start + 0.2) });
}
// horizontal meter: meterBar(g, { x, y, w, p, label, color, t })
export function meterBar(g, o = {}) {
  const { x = E.W / 2, y = 300, w = 560, h = 34, p = 0.5, label: lab = null, color = null, t = null, start = 0 } = o; const k = inK(t, start, 0.8) * p;
  rr(g, x - w / 2, y - h / 2, w, h, h / 2); g.fillStyle = '#1c1630'; g.fill(); stroke(g, 2, 'rgba(255,241,220,.35)'); if (k > 0.005) { rr(g, x - w / 2 + 4, y - h / 2 + 4, (w - 8) * clamp(k), h - 8, (h - 8) / 2); g.fillStyle = color || gold(); g.fill(); }
  if (lab) label(g, lab, x, y - h - 12, { size: 26, a: inK(t, start) });
}
// jar that fills (a resource that builds up or runs out): jar(g, { x, y, h, p: 0..1, label: 'LUCK BANK', color, t })
export function jar(g, o = {}) {
  const { x = E.W / 2, y = 560, h = 380, p = 0.5, label: lab = null, color = null, t = null, start = 0 } = o, w = h * 0.68, k = inK(t, start + 0.2, 0.9) * p;
  enter(g, t, start, x, y, 1, () => { g.save(); rr(g, -w / 2, -h / 2, w, h, w * 0.18); g.clip(); const fh = (h - 12) * clamp(k); g.fillStyle = color || gold(); g.fillRect(-w / 2, h / 2 - 6 - fh, w, fh); g.restore(); rr(g, -w / 2, -h / 2, w, h, w * 0.18); stroke(g, 7, PAPER); rr(g, -w * 0.42, -h / 2 - 34, w * 0.84, 40, 10); fillStroke(g, '#ffe8c0', 4); });
  if (lab) label(g, lab, x, y + h / 2 + 52, { size: 36, a: inK(t, start + 0.2) });
}
// thermometer: thermometer(g, { x, y, h, p, t })
export function thermometer(g, o = {}) {
  const { x = 1400, y = 540, h = 420, p = 0.6, color = '#e8324a', t = null, start = 0 } = o, k = inK(t, start + 0.2, 0.9) * p;
  enter(g, t, start, x, y, 1, () => { rr(g, -22, -h / 2, 44, h, 22); fillStroke(g, PAPER, 5); g.beginPath(); g.arc(0, h / 2, 42, 0, 7); fillStroke(g, color, 5); const fh = (h - 40) * clamp(k); rr(g, -11, h / 2 - fh, 22, fh + 10, 8); g.fillStyle = color; g.fill(); });
}
// row of chips, the first `lit` stay bright: chips(g, { x, y, items: ['DATE', ...], lit: 4, litAt: 2.2, w: 100, t, rate })
export function chips(g, o = {}) {
  const { x = E.W / 2, y = 560, items = ['A', 'B', 'C'], lit = null, litAt = 0, w = 112, h = 80, gap = 16, size = 25, t = null, start = 0, rate = 0.1 } = o, total = items.length * w + (items.length - 1) * gap;
  items.forEach((it, n) => { const a = t == null ? 1 : clamp((t - start - n * rate) / 0.25), kept = lit == null || n < lit, past = lit != null && (t == null || t >= litAt), cx = x - total / 2 + w / 2 + n * (w + gap); if (a <= 0) return; g.save(); g.globalAlpha *= a * (past && !kept ? 0.22 : 1); rr(g, cx - w / 2, y - h / 2, w, h, 14); g.fillStyle = kept && past ? gold() : SOFT; g.fill(); stroke(g, 4); text(g, String(it), cx, y + 1, { size, font: LF(), weight: 700, color: LINE }); g.restore(); });
}
// arrow or dashed flight path that draws itself: arrow(g, { from: [x, y], to: [x, y], bend: 0.2, dashed, color, t, start, dur })
export function arrow(g, o = {}) {
  const { from = [300, 500], to = [800, 500], bend = 0, dashed = false, color = null, width = 7, t = null, start = 0, dur = 0.5, head = true } = o; const k = t == null ? 1 : ease.inOut(prog(t, start, start + dur)); if (k <= 0) return;
  const mx = (from[0] + to[0]) / 2 - (to[1] - from[1]) * bend, my = (from[1] + to[1]) / 2 + (to[0] - from[0]) * bend, pt = (u) => [(1 - u) ** 2 * from[0] + 2 * (1 - u) * u * mx + u * u * to[0], (1 - u) ** 2 * from[1] + 2 * (1 - u) * u * my + u * u * to[1]];
  g.save(); g.strokeStyle = color || '#ffc27a'; g.lineWidth = width; g.lineCap = 'round'; if (dashed) g.setLineDash([width * 2.4, width * 2.2]); g.beginPath(); for (let i = 0; i <= 40; i++) { const [a, b] = pt((i / 40) * k); i ? g.lineTo(a, b) : g.moveTo(a, b); } g.stroke(); g.setLineDash([]);
  if (head && k > 0.9) { const [a, b] = pt(k), [c, d] = pt(k - 0.04), an = Math.atan2(b - d, a - c), hs = width * 3.2; g.fillStyle = color || '#ffc27a'; g.beginPath(); g.moveTo(a + Math.cos(an) * hs, b + Math.sin(an) * hs); g.lineTo(a + Math.cos(an + 2.4) * hs, b + Math.sin(an + 2.4) * hs); g.lineTo(a + Math.cos(an - 2.4) * hs, b + Math.sin(an - 2.4) * hs); g.closePath(); g.fill(); } g.restore();
}
// two framed panels to compare things: compare(g, { y, w, h, left: 'GUYS', right: 'GIRLS', t })  (draw the contents yourself inside each panel)
export function compare(g, o = {}) {
  const { x = E.W / 2, y = 560, w = 620, h = 620, gap = 60, left = 'A', right = 'B', leftC = '#6ab8f2', rightC = '#ff8ac0', t = null, start = 0 } = o;
  [[-1, left, leftC, 0], [1, right, rightC, 0.15]].forEach(([sx, str, c, d]) => enter(g, t, start + d, x + sx * (w + gap) / 2, y, 1, () => { rr(g, -w / 2, -h / 2, w, h, 18); g.fillStyle = 'rgba(20,14,40,.72)'; g.fill(); stroke(g, 4, alpha(c, 0.8)); label(g, str, 0, -h / 2 + 50, { size: 34 }); }));
}
