// engine/screens3d.js — screens and signs inside the world (exposed as T.W.* through world3d.js, 0.2.7).
// Draw functions (g, W, H, t) for T.screen / T.W.tv / T.W.phone / T.W.laptop, and ready-made objects that animate themselves:
//   T.W.newsWall(st, { cols: 3, rows: 3, items: [{ tag: 'BREAKING', text: 'TEEN CUTS CAR IN HALF' }] })   a wall of news TVs
//   T.W.scoreboard3d({ title: 'FINAL · HEAT 1', rows: [['1', 'REYES', '14.20'], ['2', 'YOU', '12.85', true]], timer: '0:24' })
//   T.W.billboard({ title: 'BURGERS', sub: '100% PLANT', icon: 'leaf', color: '#3a8a4a' })
//   T.W.phone({ draw: T.W.feedDraw({ title: 'WILL IT CUT? A CAR', views: [0, 1668358], t0: 0.5 }) })
// Text on screens uses the channel fonts; colours are muted so a screen never outshines the hero.
import * as THREE from 'three';
import { S, clamp, lerp, ease, prog } from './core.js';
import { mat, box, rbox, cyl, group, at, glow, glowMat, screen, lightCone } from './kit3d.js';
import { drawGlyph } from './icons2d.js';

const R2 = Math.PI / 2;
const rr = (g, x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
const T_ = (g, s, x, y, size, o = {}) => { g.font = `${o.w ?? 900} ${size}px "${o.font || 'Nunito'}"`; g.textAlign = o.align || 'center'; g.textBaseline = 'middle'; g.fillStyle = o.color || '#fff'; if (o.max) { const m = g.measureText(s).width; if (m > o.max) { g.font = `${o.w ?? 900} ${size * o.max / m}px "${o.font || 'Nunito'}"`; } } g.fillText(s, x, y); };
const fmt = (v) => Math.round(v).toLocaleString('en-US');
// a little flat anchor/host face (the cast's look in 2D), for news screens and video thumbnails
function face(g, x, y, r, o = {}) { g.fillStyle = o.body || '#5a6a9a'; rr(g, x - r * 1.1, y + r * 0.9, r * 2.2, r * 1.6, r * 0.5); g.fill(); g.fillStyle = o.skin || '#ece4f2'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
  g.fillStyle = '#1a1424'; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(x + s * r * 0.32, y - r * 0.05, r * 0.09, r * 0.13, 0, 0, 7); g.fill(); } g.fillRect(x - r * 0.2, y + r * 0.38, r * 0.4, r * 0.07); if (o.hair) { g.fillStyle = o.hair; g.beginPath(); g.arc(x, y - r * 0.15, r * 1.02, Math.PI * 1.05, Math.PI * 1.95); g.fill(); } }

// ---------------------------------------------------------------- draw functions
// newsDraw({ tag, text, ticker, channel, color, face }) → a news broadcast: studio backdrop, host, red tag + headline bar, moving ticker
export function newsDraw(o = {}) {
  return (g, W, H, t = 0) => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#1e2a5a'); gr.addColorStop(1, '#0e1430'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(120,160,255,.12)'; for (let i = 0; i < 8; i++) g.fillRect((i * W) / 8 + ((t * 20) % (W / 8)), 0, 2, H * 0.62);
    if (o.face !== false) face(g, W * 0.5, H * 0.32, H * 0.14, o.face || {});
    const by = H * 0.64, bh = H * 0.17; g.fillStyle = o.color || '#c8303a'; g.fillRect(0, by, W * 0.3, bh); T_(g, o.tag || 'BREAKING', W * 0.15, by + bh / 2, bh * 0.42, { max: W * 0.27 });
    g.fillStyle = '#f2ede6'; g.fillRect(W * 0.3, by, W * 0.7, bh); T_(g, o.text || 'HEADLINE', W * 0.65, by + bh / 2, bh * 0.4, { color: '#1a1424', max: W * 0.66 });
    g.fillStyle = '#0a0c1c'; g.fillRect(0, by + bh, W, H - by - bh); const tk = (o.ticker || 'MORE AT 11 · EXPERTS STUNNED · WORLD REACTS · ') .repeat(3); g.font = `800 ${bh * 0.3}px "Nunito"`; g.textAlign = 'left'; g.fillStyle = '#c8d0ff'; g.fillText(tk, W - ((t * W * 0.25) % (g.measureText(tk).width / 2 + W)), by + bh * 1.55);
    if (o.channel) { g.fillStyle = 'rgba(255,255,255,.85)'; T_(g, o.channel, W * 0.9, H * 0.08, H * 0.06); } };
}
// feedDraw({ title, user, views: [from, to] | n, t0, dur, likes, live, thumb }) → a phone/laptop showing a video post whose view count
// climbs: a thumbnail with a play button, the title, a big counting number, a heart.
export function feedDraw(o = {}) {
  return (g, W, H, t = 0) => { g.fillStyle = '#121018'; g.fillRect(0, 0, W, H); const pad = W * 0.06;
    g.fillStyle = '#2a2236'; g.fillRect(0, 0, W, H * 0.07); T_(g, o.app || '▶ feed', pad, H * 0.035, H * 0.03, { align: 'left', color: '#ff5a6a' });
    const th = H * 0.32, ty = H * 0.1; const gr = g.createLinearGradient(0, ty, 0, ty + th); gr.addColorStop(0, o.thumbTop || '#4a3a7a'); gr.addColorStop(1, o.thumbBottom || '#c86a7a'); g.fillStyle = gr; rr(g, pad, ty, W - 2 * pad, th, W * 0.03); g.fill();
    if (o.thumb) o.thumb(g, pad, ty, W - 2 * pad, th, t); else face(g, W / 2, ty + th * 0.42, th * 0.2, { body: '#b4f02e' });
    g.fillStyle = 'rgba(0,0,0,.45)'; g.beginPath(); g.arc(W / 2, ty + th / 2, th * 0.14, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(W / 2 - th * 0.05, ty + th / 2 - th * 0.07); g.lineTo(W / 2 + th * 0.08, ty + th / 2); g.lineTo(W / 2 - th * 0.05, ty + th / 2 + th * 0.07); g.closePath(); g.fill();
    if (o.live) { g.fillStyle = '#e8303a'; rr(g, pad * 1.4, ty + pad * 0.4, W * 0.18, H * 0.035, H * 0.008); g.fill(); T_(g, 'LIVE', pad * 1.4 + W * 0.09, ty + pad * 0.4 + H * 0.0175, H * 0.024); }
    T_(g, o.title || 'NEW VIDEO', pad, ty + th + H * 0.05, H * 0.032, { align: 'left', max: W - 2 * pad }); T_(g, '@' + (o.user || 'you'), pad, ty + th + H * 0.09, H * 0.024, { align: 'left', color: '#9a90b8', w: 800 });
    const [a, b] = Array.isArray(o.views) ? o.views : [0, o.views ?? 1000000], k = ease.out(prog(t, o.t0 ?? 0.3, (o.t0 ?? 0.3) + (o.dur ?? 2.5))), v = lerp(a, b, k);
    T_(g, fmt(v), W / 2, H * 0.66, H * 0.075, { color: S().ui?.gold || '#ffd98a', max: W - 2 * pad }); T_(g, 'VIEWS', W / 2, H * 0.72, H * 0.026, { color: '#c8c0e0', w: 800 });
    drawGlyph(g, 'heart', W * 0.3, H * 0.84, H * 0.03); T_(g, fmt((o.likes ?? 0.08) * v), W * 0.42, H * 0.84, H * 0.03, { align: 'left', w: 800 }); };
}
// boardDraw({ title, rows: [[rank, name, value, highlight?, colour?]], timer }) → a results / leaderboard screen
export function boardDraw(o = {}) {
  return (g, W, H, t = 0) => { g.fillStyle = '#0e0c1c'; g.fillRect(0, 0, W, H); const rows = o.rows || [], pad = W * 0.04, rh = (H * 0.78) / Math.max(4, rows.length), gold = S().ui?.gold || '#ffd98a';
    T_(g, o.title || 'RESULTS', pad, H * 0.1, H * 0.075, { align: 'left', color: '#f2ede6', font: 'Nunito' }); if (o.timer) T_(g, typeof o.timer === 'function' ? o.timer(t) : o.timer, W - pad, H * 0.1, H * 0.08, { align: 'right', color: '#ff5a6a' });
    g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(pad, H * 0.18, W - 2 * pad, 2);
    rows.forEach(([rank, name, val, hi, col], i) => { const y = H * 0.2 + i * rh, k = clamp((t - (o.t0 ?? 0) - i * 0.12) / 0.3); if (k <= 0) return; g.globalAlpha = k;
      if (hi) { g.fillStyle = 'rgba(180,240,46,.16)'; g.fillRect(pad * 0.6, y, W - pad * 1.2, rh * 0.92); }
      T_(g, String(rank), pad + rh * 0.3, y + rh * 0.46, rh * 0.5, { color: '#c8c0e0' }); g.fillStyle = col || ['#c8603a', '#3a6ac8', '#c83a5a', '#3a9a6a', '#9a6ac8'][i % 5]; g.fillRect(pad + rh * 0.75, y + rh * 0.22, rh * 0.48, rh * 0.48);
      T_(g, String(name), pad + rh * 1.45, y + rh * 0.46, rh * 0.5, { align: 'left', color: hi ? '#ffffff' : '#e8e2f0' }); T_(g, String(val), W - pad, y + rh * 0.46, rh * 0.5, { align: 'right', color: hi ? gold : '#e8e2f0' }); g.globalAlpha = 1; }); };
}
// ---------------------------------------------------------------- objects
// newsWall(st, { cols, rows, w, gap, items: [{ tag, text, face }], pos, yaw }) → a wall of TVs all showing news about the story. Animates itself.
export function newsWall(st, o = {}) {
  const cols = o.cols ?? 3, rows = o.rows ?? 3, w = o.w ?? 1.6, h = w * 0.5625, gap = o.gap ?? 0.12, items = o.items || [{ tag: 'BREAKING', text: 'NOBODY CAN EXPLAIN IT' }, { tag: 'LIVE', text: 'CROWDS GATHER' }, { tag: 'VIRAL', text: '10 MILLION VIEWS' }];
  const g = group(); g.userData.dynamic = true; const scr = [], hues = [{ body: '#5a6a9a' }, { body: '#8a4a5a', hair: '#3a2620' }, { body: '#3a6a5a', hair: '#1a1416' }, { body: '#6a5a3a' }];
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const k = j * cols + i, it = items[k % items.length], tv = group(rbox(w + 0.08, h + 0.08, 0.08, 0.02, mat('#16141e', { rough: 0.4 }), 0, 0, 0));
    const s = screen(w, h, newsDraw({ ...it, face: it.face ?? hues[k % hues.length], color: it.color || (k % 3 === 1 ? '#3a5ac8' : '#c8303a') }), { px: 384, power: 1.05 }); s.position.z = 0.045; tv.add(s); scr.push([s, k * 0.37]);
    tv.position.set((i - (cols - 1) / 2) * (w + gap), (rows - 1 - j) * (h + gap) + (o.y ?? 1.0), 0); g.add(tv); }
  g.position.set(...(o.pos || [0, 0, -3])); g.rotation.y = o.yaw || 0; g.tick = (t) => scr.forEach(([s, ph]) => s.update(t + ph)); g.tick(0); st.add(g); return g;
}
// scoreboard3d({ title, rows, timer, w, h, legs, pos }) → a big results board on two legs (a race, a contest, a ranking). Animates itself (st.add).
export function scoreboard3d(o = {}) {
  const w = o.w ?? 4, h = o.h ?? 2.4, g = group(); g.userData.dynamic = true; const frame = mat('#22202c', { rough: 0.5 });
  g.add(rbox(w + 0.3, h + 0.3, 0.25, 0.05, frame, 0, 0, 0)); const s = screen(w, h, boardDraw(o), { px: 768, power: 1.15 }); s.position.z = 0.13; g.add(s);
  if (o.legs !== false) for (const x of [-w * 0.35, w * 0.35]) g.add(box(0.18, o.legH ?? 2.6, 0.18, frame, x, -h / 2 - (o.legH ?? 2.6) / 2, -0.02));
  g.add(at(glow('#a8b8ff', w * 1.6, 0.12), 0, 0, 0.2)); g.position.y = (o.legs === false ? 0 : (o.legH ?? 2.6)) + h / 2;
  const out = group(g); out.userData.dynamic = true; out.tick = (t) => s.update(t); out.screenMesh = s; return out;   // the outer group stands on y = 0, so T.at can place it
}
// billboard({ title, sub, icon, color, bg, w, h, posts, lamps }) → a roadside billboard with a lit panel. Static.
export function billboard(o = {}) {
  const w = o.w ?? 6, h = o.h ?? 3, g = group(), ui = S().ui || {};
  const s = screen(w, h, (c, W, H) => { const gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, o.bg || '#f2e8d0'); gr.addColorStop(1, o.bg2 || '#e2d2b0'); c.fillStyle = gr; c.fillRect(0, 0, W, H);
    c.fillStyle = o.color || '#3a8a4a'; rr(c, W * 0.03, H * 0.06, W * 0.94, H * 0.88, H * 0.06); c.fill(); const ix = o.icon ? H * 0.5 : 0;
    if (o.icon) { c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.arc(W * 0.16, H / 2, H * 0.3, 0, 7); c.fill(); drawGlyph(c, o.icon, W * 0.16, H / 2, H * 0.24, { color: '#fff6e6' }); }
    T_(c, o.title || 'BILLBOARD', W / 2 + ix * 0.5, H * (o.sub ? 0.42 : 0.5), H * 0.3, { font: 'Fredoka', w: 700, color: '#fff6e6', max: W * 0.7 }); if (o.sub) T_(c, o.sub, W / 2 + ix * 0.5, H * 0.72, H * 0.13, { color: 'rgba(255,246,230,.85)', max: W * 0.66 }); }, { px: 1024, power: o.power ?? 1.0 });
  s.position.z = 0.08; g.add(rbox(w + 0.25, h + 0.25, 0.14, 0.04, mat('#3a3440', { rough: 0.6 }), 0, 0, 0), s);
  if (o.posts !== false) for (const x of [-w * 0.3, w * 0.3]) g.add(cyl(0.12, 0.14, o.postH ?? 4, mat('#5a5464', { metal: 0.4, rough: 0.5 }), x, -h / 2 - (o.postH ?? 4) / 2, -0.1, 10));
  if (o.lamps !== false) for (const x of [-w * 0.3, w * 0.3]) { const l = group(box(0.5, 0.08, 0.3, mat('#2a2830'), 0, 0, 0)); l.add(at(glow('#fff2d0', 0.8, 0.6), 0, -0.05, 0.1)); l.position.set(x, h / 2 + 0.3, 0.6); g.add(l); }
  g.position.y = (o.posts === false ? 0 : (o.postH ?? 4)) + h / 2; return group(g);
}
