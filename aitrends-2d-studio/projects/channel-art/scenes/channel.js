// channel.js — channel avatar + banner, learned from Jeremy Bearimy (33k subs in ~1 month):
//   - ONE mascot ("you") appears in the avatar, the banner and every thumbnail → instant recognition.
//   - Avatar: mascot head close-up, smug expression, flat bright circle background, no text.
//   - Banner: the mascot repeated in 5 hoodie colours, each with a different power, on a rainbow of
//     slanted colour panels; centre copy is the biggest; no text.
// We keep OUR video's look (black head, cream features, rim light) so channel art matches the videos.
import { E, registerShot, rr, circle, seg, glow, alpha, text, radGrad, linGrad, shade, FONTS } from '/engine/core.js';
import { bigFace } from '/engine/rig2d.js';
import * as FX from '/engine/fx2d.js';
import { TAG } from '/projects/t4-02/scenes/sets/phoneui.js';

export const MASCOT = { top: 'hoodie', color: '#e2502f', head: 'hood' };          // brand colour: red-orange hood
const hoodie = (color) => ({ top: 'hoodie', color, head: 'hood' });

// YouTube banner: 2560x1440 file. In our 1920x1080 logical frame:
//   desktop shows the full-width band y 381..699; the safe area for every device is x 380..1540 of that band.
const BAND = { y0: 381, y1: 699 }, SAFE = { x0: 380, x1: 1540 };

function panel(g, x0, x1, c1, c2, slant = 120) {
  g.save(); g.beginPath();
  g.moveTo(x0 + slant, 0); g.lineTo(x1 + slant, 0); g.lineTo(x1 - slant, E.H); g.lineTo(x0 - slant, E.H); g.closePath(); g.clip();
  g.fillStyle = linGrad(g, x0, 0, x1, E.H, [c1, c2]); g.fillRect(x0 - slant, 0, x1 - x0 + slant * 2, E.H);
  const cx = (x0 + x1) / 2, cy = (BAND.y0 + BAND.y1) / 2;
  g.fillStyle = radGrad(g, cx, cy, 0, 420, [alpha('#ffffff', 0.35), alpha('#ffffff', 0)]); g.fillRect(x0 - slant, 0, x1 - x0 + slant * 2, E.H);
  // sunburst rays
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2; g.fillStyle = alpha('#ffffff', 0.05); g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, 900, a, a + 0.08); g.closePath(); g.fill(); }
  g.restore(); g.restore();
}

// one "power" per copy of the mascot
const POWERS = {
  speed(g, x, y) {                                     // 100x faster: streaks + after-images
    for (let i = 1; i <= 3; i++) { g.save(); g.globalAlpha = 0.18 / i * 2; bigFace(g, x - i * 55, y, 78, { outfit: hoodie('#e23b3b'), expr: 'smirk', face: { brows: 'angry' } }); g.restore(); }
    for (let i = 0; i < 9; i++) seg(g, [[x - 300, y - 90 + i * 24], [x - 130 - (i % 3) * 40, y - 90 + i * 24]], 5, alpha('#fff3e0', 0.7));
  },
  labels(g, x, y) {                                    // see everyone's ___: floating neon tags
    const tag = (str, tx, ty, c) => { rr(g, tx - 95, ty - 34, 190, 68, 18); g.fillStyle = alpha('#0b1a12', 0.85); g.fill(); g.strokeStyle = c; g.lineWidth = 5; g.stroke(); text(g, str, tx, ty + 2, { size: 46, font: FONTS.ui, weight: 900, color: c, glow: 18, glowColor: c }); };
    tag('999+', x - 175, y - 40, '#7dff8a'); tag('160 IQ', x + 185, y - 70, '#7dff8a');
  },
  phone(g, x, y) {                                     // tomorrow's notifications: glowing phone
    glow(g, x + 150, y + 20, 260, '#8fd3ff', 0.7);
    g.save(); g.translate(x + 150, y + 30); g.rotate(0.15); g.scale(0.8, 0.8);
    rr(g, -60, -110, 120, 220, 22); g.fillStyle = '#07060b'; g.fill();
    rr(g, -52, -100, 104, 200, 16); g.fillStyle = linGrad(g, 0, -100, 0, 100, ['#2a3a8a', '#6a3a7a']); g.fill();
    rr(g, -46, -40, 92, 40, 10); g.fillStyle = alpha('#151a2c', 0.95); g.fill();
    rr(g, -40, -34, 52, 14, 7); g.fillStyle = TAG; g.fill();
    g.restore();
  },
  time(g, x, y) {                                      // rewind time: clock rings
    for (let i = 0; i < 3; i++) { g.strokeStyle = alpha('#e9d7ff', 0.6 - i * 0.15); g.lineWidth = 8 - i * 2; g.beginPath(); g.arc(x, y, 130 + i * 26, Math.PI * 0.85, Math.PI * 2.05); g.stroke(); }
    FX.clock(g, x + 165, y - 50, 52, 4 * 3600 + 20 * 60, { face: '#f4ecff', ink: '#2a1648' });
    text(g, '⟲', x - 175, y - 50, { size: 100, color: '#f4ecff', glow: 24, glowColor: '#c08aff' });
  },
  energy(g, x, y) {                                    // 100x stronger: lightning + sparks
    FX.lightning(g, { seed: 4, x1: x + 120, y1: BAND.y0 - 40, x2: x + 260, y2: BAND.y1, color: '#fff08a', w: 7 });
    FX.lightning(g, { seed: 11, x1: x - 260, y1: BAND.y0 - 20, x2: x - 150, y2: BAND.y1, color: '#ffd23f', w: 5 });
    for (const [dx, dy, s] of [[-130, -60, 28], [140, -50, 24], [130, 60, 20]]) FX.sparkle(g, x + dx, y + dy, s, '#fff6c0');
  },
};

registerShot('banner', { draw(g) {
  const cols = [['#ff5a4a', '#b8122a'], ['#3fe07a', '#0f7a4a'], ['#ffb04a', '#e2502f'], ['#b77bff', '#5a2ab8'], ['#ffe14a', '#f08a1a']];
  const xs = [0, 384, 768, 1152, 1536, 1920];
  // centre panel (brand) is wider: pull the edges in
  const edges = [-200, 300, 690, 1230, 1620, 2120];
  cols.forEach(([a, b], i) => panel(g, edges[i], edges[i + 1], a, b));
  const cy = 545;
  const people = [
    { x: 170, power: 'speed', color: '#e23b3b', expr: 'smirk', face: { brows: 'angry' }, r: 78 },
    { x: 540, power: 'labels', color: '#2fb35a', expr: 'smirk', r: 80 },
    { x: 960, power: 'phone', color: MASCOT.color, expr: 'smirk', r: 98, look: [0.3, 0] },
    { x: 1400, power: 'time', color: '#8a4ae0', expr: 'awe', r: 80 },
    { x: 1770, power: 'energy', color: '#f2a51a', expr: 'joy', r: 78 },
  ];
  for (const p of people) {
    const y = cy + (p.r > 90 ? -5 : 10);
    if (p.power !== 'speed') POWERS[p.power](g, p.x, y);
    else POWERS.speed(g, p.x, y);
    bigFace(g, p.x, y, p.r, { outfit: hoodie(p.color), expr: p.expr, face: p.face, look: p.look || [0, 0], rimColor: '#ffffff', rimSide: p.x < 960 ? -1 : 1 });
  }
} });

registerShot('avatar', { draw(g) {
  const cx = 960, cy = 540;
  g.fillStyle = '#0d1030'; g.fillRect(0, 0, E.W, E.H);
  g.fillStyle = radGrad(g, cx, cy - 60, 0, 620, ['#ffb04a', '#ff6a3a', '#b8183a']); g.beginPath(); g.arc(cx, cy, 540, 0, Math.PI * 2); g.fill();
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; g.fillStyle = alpha('#ffffff', 0.06); g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, 540, a, a + 0.12); g.closePath(); g.fill(); }
  g.restore();
  glow(g, cx + 280, cy + 220, 460, '#8fd3ff', 0.55);                                  // phone glow from the lower right
  bigFace(g, cx, cy + 40, 390, { outfit: MASCOT, expr: 'smirk', look: [0.25, 0.05], rimColor: '#bfe6ff', rimSide: 1, tilt: -0.08 });
} });
