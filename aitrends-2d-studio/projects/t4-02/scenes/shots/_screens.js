// shots/_screens.js — custom phone screens (chat, settings, contacts, weather, incoming call) + lock-screen helper.
import { E, V, S, blurLayer, veil, ease, prog, clamp, lerp, shake, rr, seg, circle, glow, alpha, text, FONTS } from '/engine/core.js';
import { SETS } from './_tpl.js';
import { PHONE_BLUE } from '../sets/bedroom.js';
import { TAG } from '../sets/phoneui.js';

const CREAM = '#f2efe8';
// draw a phone frame and run content(g, x, y, w, h, k) clipped to the screen (k = width/400 design units)
export function phoneScreen(g, t, info, content, o = {}) {
  if (o.bg !== false) { blurLayer(g, 16, (g) => SETS[o.bg || 'bedroom'](g, t, { z: 1.8, x: V(200, 100), y: -200 }, o.bgOpts || { clock: '11:59', phoneGlow: 1 })); veil(g, '#05040b', 0.5); }
  const sh = o.shake ? shake(t, o.shake, 18) : [0, 0], z = (o.z ?? 1) + 0.05 * ease.inOut(t / info.dur);
  const h = V(980, 1500) * (o.size ?? 1), w = h * 0.49, cx = E.W * (o.cx ?? 0.5) + sh[0], cy = E.H * (o.cy ?? 0.52) + sh[1];
  g.save(); g.translate(cx, cy); g.scale(z, z); if (o.rot) g.rotate(o.rot); g.translate(-cx, -cy);
  const x = cx - w / 2, y = cy - h / 2, r = w * 0.14, k = w / 400;
  glow(g, cx, cy, h * 0.95, o.glowC || PHONE_BLUE, 0.22);
  rr(g, x - w * 0.04, y - w * 0.04, w * 1.08, h + w * 0.08, r * 1.1); g.fillStyle = '#07060b'; g.fill();
  g.save(); rr(g, x, y, w, h, r); g.clip(); g.fillStyle = o.screenBg || '#10131f'; g.fillRect(x, y, w, h); content(g, x, y, w, h, k); g.restore();
  rr(g, cx - w * 0.16, y + 14 * k, w * 0.32, 26 * k, 13 * k); g.fillStyle = '#07060b'; g.fill();
  g.restore();
  return { cx, cy, w, h };
}
export const header = (g, x, y, w, k, title, sub) => { text(g, title, x + w / 2, y + 90 * k, { size: 30 * k, font: FONTS.ui, weight: 900, color: CREAM }); if (sub) text(g, sub, x + w / 2, y + 124 * k, { size: 18 * k, font: FONTS.ui, weight: 800, color: alpha(CREAM, 0.6) }); seg(g, [[x, y + 150 * k], [x + w, y + 150 * k]], 2, alpha(CREAM, 0.12)); };
// chat bubble list: msgs [{str, at, me}]
export function chat(g, t, x, y, w, k, msgs, top = 180) {
  let yy = y + top * k;
  for (const m of msgs) { const a = m.at == null ? 1 : ease.outBack(prog(t, m.at, m.at + 0.35)); if (a <= 0) { yy += 84 * k; continue; }
    const bw = Math.min(w - 80 * k, (m.str.length * 13 + 40) * k), bx = m.me ? x + w - 20 * k - bw : x + 20 * k;
    g.save(); g.translate(bx + bw / 2, yy + 30 * k); g.scale(a, a); g.translate(-(bx + bw / 2), -(yy + 30 * k));
    rr(g, bx, yy, bw, 60 * k, 26 * k); g.fillStyle = m.me ? '#2f7bff' : '#2a2e40'; g.fill();
    text(g, m.str, bx + 20 * k, yy + 31 * k, { size: 22 * k, font: FONTS.ui, weight: 800, color: CREAM, align: 'left' }); g.restore(); yy += 84 * k; }
}
// settings-style rows: [{label, value, on, star, at}]
export function rows(g, t, x, y, w, k, list, top = 190) {
  list.forEach((r, i) => { const yy = y + (top + i * 92) * k, a = r.at == null ? 1 : ease.out(prog(t, r.at, r.at + 0.3));
    g.save(); g.globalAlpha *= a; rr(g, x + 18 * k, yy, w - 36 * k, 76 * k, 18 * k); g.fillStyle = r.hi ? alpha(PHONE_BLUE, 0.25) : '#1c2032'; g.fill();
    if (r.hi) { g.strokeStyle = PHONE_BLUE; g.lineWidth = 3 * k; g.stroke(); }
    text(g, r.label, x + 44 * k, yy + 39 * k, { size: 24 * k, font: FONTS.ui, weight: 800, color: CREAM, align: 'left' });
    if (r.on != null) { const on = typeof r.on === 'number' ? r.on : r.on ? 1 : 0; rr(g, x + w - 120 * k, yy + 20 * k, 76 * k, 38 * k, 19 * k); g.fillStyle = on > 0.5 ? '#3fb950' : '#4a4e60'; g.fill(); circle(g, x + w - 101 * k + 38 * k * on, yy + 39 * k, 15 * k, CREAM); }
    if (r.star != null) { const s = typeof r.star === 'number' ? r.star : r.star ? 1 : 0; star(g, x + w - 72 * k, yy + 38 * k, 18 * k * (0.6 + 0.4 * ease.outBack(s)), s > 0.5 ? S().ui.gold : alpha(CREAM, 0.3)); }
    if (r.value) text(g, r.value, x + w - 44 * k, yy + 39 * k, { size: 22 * k, font: FONTS.ui, weight: 800, color: alpha(CREAM, 0.6), align: 'right' });
    g.restore(); });
}
export function star(g, x, y, r, c) { g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr2 = i % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * rr2, y + Math.sin(a) * rr2); } g.closePath(); g.fillStyle = c; g.fill(); }
// incoming call screen
export function callScreen(g, t, x, y, w, h, k, o = {}) {
  const bg = g.createLinearGradient(0, y, 0, y + h); bg.addColorStop(0, '#1a3a2a'); bg.addColorStop(1, '#0c1a14'); g.fillStyle = bg; g.fillRect(x, y, w, h);
  text(g, o.name || 'Mom', x + w / 2, y + 230 * k, { size: 56 * k, font: FONTS.ui, weight: 900, color: CREAM });
  text(g, o.sub || 'calling…', x + w / 2, y + 290 * k, { size: 24 * k, font: FONTS.ui, weight: 800, color: alpha(CREAM, 0.7) });
  circle(g, x + w / 2, y + 420 * k, 70 * k, '#3a6ea5'); circle(g, x + w / 2, y + 400 * k, 28 * k, alpha('#0c0a12', 0.6));
  if (o.silent) { rr(g, x + w / 2 - 110 * k, y + 540 * k, 220 * k, 44 * k, 22 * k); g.fillStyle = alpha('#000', 0.4); g.fill(); text(g, 'SILENCED · DND', x + w / 2, y + 562 * k, { size: 18 * k, font: FONTS.ui, weight: 900, color: alpha(CREAM, 0.7), spacing: 2 }); }
  for (const [dx, c] of [[-1, '#e0302a'], [1, '#3fb950']]) circle(g, x + w / 2 + dx * 110 * k, y + h - 160 * k, 46 * k, c);
}
export { TAG, CREAM };
