// shots/_tpl.js — shared shot templates (not auto-loaded: starts with "_").
// Each template takes (g, t, info, p) where p comes from the SPEC table in 10_rest.js.
import { E, V, S, mood, layer, blurLayer, veil, ease, prog, clamp, lerp, shake, wordTime, talkAmount, rr, seg, circle, glow, alpha, text, FONTS } from '/engine/core.js';
import { drawFigure, POSES, posesAt, breathe, bigFace, headPos } from '/engine/rig2d.js';
import * as FX from '/engine/fx2d.js';
import * as UI from '/engine/ui2d.js';
import { bedroom, digitalClock, PHONE_BLUE } from '../sets/bedroom.js';
import { stairs } from '../sets/stairs.js';
import { hallway, classroom } from '../sets/school.js';
import { kitchen, livingroom, track, parking, office, busstop, street, hospital } from '../sets/places.js';
import { phone, notifCard, TAG } from '../sets/phoneui.js';
import { WHO } from '../cast.js';

export const SETS = { bedroom, stairs, hallway, classroom, kitchen, livingroom, track, parking, office, busstop, street, hospital };
export const lt = (info, word, fb) => { const w = wordTime(word, info.shot.start - 0.2); return w == null || w > info.shot.end + 0.2 ? fb : w - info.shot.start; };
const RIM = { phone: PHONE_BLUE, warm: '#ffcf8f', red: '#ff5a4a', memory: '#ffd59a' };
const pick = (v, t) => Array.isArray(v) ? (v.filter(([at]) => t >= at).pop() || v[0])[1] : v;   // [[t,val],...] or value

function overlays(g, t, info, p) {
  if (p.badge) UI.badge(g, { str: p.badge, a: ease.out(prog(t, 0.05, 0.4)) });
  if (p.readout) { const r = p.readout, at = r.word ? lt(info, r.word, r.at ?? 0.3) : (r.at ?? 0.3); UI.readout(g, { label: r.label, value: r.value, x: V(120, 80), y: E.H - V(190, 600), color: r.color, a: ease.out(prog(t, at, at + 0.3)) }); }
  if (p.line) UI.bigLine(g, t, { str: p.line, dur: info.dur + 0.4, y: p.lineY ?? E.H * 0.2, size: V(60, 54) });
  if (p.fx === 'dust') FX.dust(g, t, { count: 30, color: '#cfd8ff', a: 0.22 });
  if (p.fx === 'rain') FX.rain(g, t, { count: 200, color: '#c8d4ff', a: 0.45 });
  if (p.tint === 'memory') { g.save(); g.globalCompositeOperation = 'soft-light'; g.fillStyle = 'rgba(255,190,110,.45)'; g.fillRect(0, 0, E.W, E.H); g.restore(); veil(g, '#2a1a0a', 0.12); }
}

// giant face. p: {who, expr | [[t,expr]], bg, bgOpts, talk:[a,b], glow:'phone'|'warm'|'red', look, side, tilt}
export function face(g, t, info, p) {
  const set = SETS[p.bg || 'bedroom'];
  blurLayer(g, 14, (g) => set(g, t, { z: 1.6, x: p.bgX ?? V(300, 200), y: -200 }, p.bgOpts || {})); veil(g, '#05040b', p.veil ?? 0.42);
  const r = V(300, 330) * (1 + 0.04 * t / Math.max(1, info.dur / 3)), cx = E.W / 2 + (p.dx ?? 0) * V(1, 0), cy = E.H * V(0.6, 0.55);
  const rc = RIM[p.glow] || p.rim || mood(p.mood || 'interiorWarm').rim;
  if (p.glow === 'phone') glow(g, cx, cy + r * 1.2, r * 2.2, PHONE_BLUE, 0.38);
  if (p.glow === 'red') glow(g, cx, cy, r * 2.4, '#ff3b30', 0.22 + 0.1 * Math.sin(t * 6));
  const talk = p.talk ? talkAmount(info.globalT, p.talk[0], p.talk[1]) : 0;
  bigFace(g, cx, cy, r * (p.scale ?? 1), { outfit: WHO[p.who], expr: pick(p.expr || 'neutral', t), talk, look: p.look || [0, 0.2], rimColor: rc, rimSide: p.side ?? 1, tilt: p.tilt, blink: (t % (2.6 + (p.who || '').length * 0.1)) > 2.5 });
  if (talk > 0) FX.rings(g, cx, cy, t, { count: 3, r0: r * 1.1, r1: r * 1.6, color: '#fff3e0', a: 0.3 });
  overlays(g, t, info, p);
}

// big TOMORROW card over the dimmed lock screen. p: {sender,msg,time,icon, red, bg}
export function card(g, t, info, p) {
  blurLayer(g, 16, (g) => SETS[p.bg || 'bedroom'](g, t, { z: 1.8, x: V(200, 100), y: -200 }, p.bgOpts || { clock: '11:59', phoneGlow: 1 })); veil(g, '#05040b', 0.5);
  const cy = E.H * 0.52, z = 1 + 0.03 * ease.inOut(t / info.dur);
  g.save(); g.translate(E.W / 2, cy); g.scale(z, z); g.translate(-E.W / 2, -cy);
  phone(g, E.W / 2, cy, V(980, 1500), t, { cards: p.under || [], stamp: 1, scroll: 40, dim: 0.6 }); g.restore();
  const a = ease.outBack(prog(t, 0.05, 0.45)), w = V(1100, 920), x = (E.W - w) / 2, y = E.H * 0.42;
  const sh = p.red ? shake(t, 4 * (1 - prog(t, 0.2, 1.2)), 20) : [0, 0];
  g.save(); g.translate(sh[0], sh[1]);
  glow(g, E.W / 2, y + 90, w * 0.6, p.red ? '#ff3b30' : PHONE_BLUE, (p.red ? 0.4 : 0.25) * a);
  notifCard(g, x, y, w, { ...p, s: V(1.9, 1.6), a: clamp(a), stamp: 1 });
  if (p.strike) { const k = ease.out(prog(t, p.strike, p.strike + 0.3)); if (k > 0) seg(g, [[x + 20, y + 95], [x + 20 + (w - 40) * k, y + 95]], 8, TAG); }
  g.restore();
  overlays(g, t, info, p);
}

// a wide/medium shot in a set with figures. p: {set, opts, cam:{z,dz,x,dx,y}, figs:[{who,x,y,s,facing,pose|poses,expr,prop,talk,look,rot,dim}], fx}
export function wide(g, t, info, p) {
  const c = p.cam || {}, k = ease.inOut(t / info.dur);
  const sh = p.shake ? shake(t, p.shake, 6) : [0, 0];
  const cam = { z: (c.z ?? 1) + (c.dz ?? 0.05) * k, x: (c.x ?? 0) + (c.dx ?? -30) * k + sh[0], y: (c.y ?? 0) + sh[1] };
  const opts = typeof p.opts === 'function' ? p.opts(t) : (p.opts || {});
  const R = SETS[p.set](g, t, cam, opts);
  layer(g, cam, 1, (g) => {
    p.before?.(g, t, R);
    for (const f of p.figs || []) {
      const pose = f.poses ? posesAt(t, f.poses.map(([at, n]) => [at, typeof n === 'string' ? POSES[n] : n])) : (typeof f.pose === 'string' ? POSES[f.pose] : f.pose) || POSES.stand;
      const o = { x: E.W * f.x, y: f.y != null ? R.GY + f.y : R.GY, s: (f.s ?? 1.2) * V(1, 1), facing: f.facing ?? 1, outfit: f.outfit || WHO[f.who] || { top: 'none' }, pose: f.still ? pose : breathe(pose, t, 1, (f.x * 10) | 0), expr: pick(f.expr || 'neutral', t), prop: f.prop, look: f.look, rot: f.rot, dim: f.dim, shadow: f.shadow, blink: (t % 3.3) > 3.2,
        talk: f.talk ? talkAmount(info.globalT, f.talk[0], f.talk[1]) : 0, rim: { color: f.rim || R.M.rim, dir: f.rimDir || [0, -1], w: 4 } };
      if (f.walk) { o.pose = POSES.stand; o.x += f.walk * t * 160; }
      drawFigure(g, o);
      if (o.talk > 0) { const [hx, hy, hr] = headPos(o); FX.rings(g, hx, hy, t, { count: 3, r0: hr * 1.3, r1: hr * 2.6, color: '#fff1e0', a: 0.35 }); }
    }
    p.after?.(g, t, R);
  });
  overlays(g, t, info, p);
}

// lock-screen close-up. p: {cards, stamp, scroll, tally, dim, count:{from,to,label}, shake, bg}
export function lock(g, t, info, p) {
  blurLayer(g, 16, (g) => SETS[p.bg || 'bedroom'](g, t, { z: 1.8, x: V(200, 100), y: -200 }, p.bgOpts || { clock: '11:59', phoneGlow: 1 })); veil(g, '#05040b', 0.5);
  const sh = p.shake ? shake(t, p.shake, 18) : [0, 0], z = (p.z ?? 1) + 0.05 * ease.inOut(t / info.dur), cx = E.W * (p.cx ?? 0.42) + sh[0], cy = E.H * 0.52 + sh[1];
  const cards = (p.cards || []).map((c, i) => ({ ...c, at: c.at ?? (p.drop ? 0.1 + i * p.drop : null) }));
  g.save(); g.translate(cx, cy); g.scale(z, z); g.translate(-cx, -cy);
  phone(g, cx, cy, V(980, 1500), t, { cards, stamp: p.stamp ?? 1, scroll: typeof p.scroll === 'function' ? p.scroll(t) : (p.scroll ?? 40), tally: p.tally, dim: p.dim, time: p.time });
  g.restore();
  if (p.count) { const c = p.count, at = c.word ? lt(info, c.word, 0.3) : (c.at ?? 0.2), q = ease.inOut(prog(t, at, at + (c.dur ?? 1.2)));
    const v = Math.round(lerp(c.from, c.to, q)), a = ease.outBack(prog(t, at - 0.1, at + 0.3));
    if (a > 0) { g.save(); g.translate(E.W * V(0.76, 0.5), E.H * V(0.4, 0.18)); g.scale(a, a);
      text(g, (c.prefix || '') + v.toLocaleString('en-US'), 0, 0, { size: V(150, 140), font: FONTS.ui, weight: 900, color: c.color || '#f2efe8', glow: 30, glowColor: alpha(c.color || PHONE_BLUE, 0.9) });
      if (c.label) text(g, c.label, 0, V(100, 96), { size: V(36, 38), font: FONTS.ui, weight: 900, color: alpha('#f2efe8', 0.75), spacing: 5 }); g.restore(); } }
  overlays(g, t, info, p);
}

// blueprint board with a big line + optional draw fn. p: {line, draw}
export function board(g, t, info, p) { UI.blueprint(g); p.draw?.(g, t, info); if (p.title) UI.bigLine(g, t, { str: p.title, dur: info.dur + 0.4, y: p.titleY ?? E.H / 2, size: p.size }); overlays(g, t, info, { ...p, line: null }); }

export { digitalClock, PHONE_BLUE, TAG, notifCard, phone };
