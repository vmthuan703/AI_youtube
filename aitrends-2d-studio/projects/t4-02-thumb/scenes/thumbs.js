// thumbs.js — 3 thumbnail variants for T4 #2, drawn with the video's own cast and phone UI.
// Rules distilled from competitor thumbnails (docs/THUMBNAIL_PLAYBOOK.md):
//   1 face close-up with a strong emotion + 1 "data object" that states the premise + ≤ 3 words of big text.
//   Text adds stakes, never repeats the title. Bright warm/cool contrast, readable at 168x94 px.
import { E, registerShot, rr, circle, seg, glow, alpha, text, radGrad, FONTS } from '/engine/core.js';
import { bigFace } from '/engine/rig2d.js';
import { phone, TAG } from '/projects/t4-02/scenes/sets/phoneui.js';
import { MAYA } from '/projects/t4-02/scenes/cast.js';

const YELLOW = '#ffd23f', WHITE = '#ffffff';

function backdrop(g, { top, bottom, hot, hx, hy, hr = 900, bokeh = '#8fd3ff', seed = 3 }) {
  const gr = g.createLinearGradient(0, 0, 0, E.H); gr.addColorStop(0, top); gr.addColorStop(1, bottom);
  g.fillStyle = gr; g.fillRect(0, 0, E.W, E.H);
  g.fillStyle = radGrad(g, hx, hy, 0, hr, [alpha(hot, 0.85), alpha(hot, 0.25), alpha(hot, 0)]); g.fillRect(0, 0, E.W, E.H);
  let s = seed * 9301; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 26; i++) circle(g, r() * E.W, r() * E.H, 10 + r() * 40, alpha(bokeh, 0.05 + r() * 0.08));
}

// big outlined headline; words: [[str, color], ...] on one line
function headline(g, words, x, y, size) {
  g.save(); g.font = `700 ${size}px "${FONTS.title}"`;
  let xx = x;
  for (const [str, col] of words) {
    const w = g.measureText(str + ' ').width;
    text(g, str, xx + 10, y + 12, { size, align: 'left', color: alpha('#000', 0.55) });                 // drop shadow
    text(g, str, xx, y, { size, align: 'left', color: col, stroke: size * 0.2, strokeColor: '#0a0712' });
    xx += w;
  }
  g.restore();
}

// oversized notification: must stay readable when YouTube shrinks the thumbnail to ~168 px wide
function bigNotif(g, x, y, w, o) {
  const h = 230, glowC = o.glow || TAG;
  glow(g, x + w / 2, y + h / 2, w * 0.75, glowC, 0.45);
  rr(g, x, y, w, h, 40); g.fillStyle = alpha('#121628', 0.95); g.fill();
  g.strokeStyle = alpha(glowC, 0.9); g.lineWidth = 6; g.stroke();
  rr(g, x + 34, y + 45, 140, 140, 32); g.fillStyle = o.iconColor || '#3a6ea5'; g.fill();
  text(g, o.icon || '✆', x + 104, y + 118, { size: 90, font: FONTS.ui, weight: 900, color: WHITE });
  text(g, o.sender, x + 206, y + 75, { size: 62, font: FONTS.ui, weight: 900, color: alpha(WHITE, 0.85), align: 'left' });
  text(g, o.msg, x + 206, y + 160, { size: o.msgSize || 84, font: FONTS.ui, weight: 900, color: o.msgColor || WHITE, align: 'left' });
  // TOMORROW tag sitting on the card's top edge
  const ts = 46; g.save(); g.font = `900 ${ts}px "${FONTS.ui}"`; const tw = g.measureText(o.tag).width + 60; g.restore();
  rr(g, x + w - tw - 30, y - 38, tw, 76, 38); g.fillStyle = TAG; g.fill();
  text(g, o.tag, x + w - tw / 2 - 30, y + 2, { size: ts, font: FONTS.ui, weight: 900, color: WHITE, spacing: 2 });
}

// A — the cost: Mom's missed calls, tomorrow. Shocked Maya, phone glow on her face.
registerShot('thA', { draw(g) {
  backdrop(g, { top: '#0c1030', bottom: '#2a0f2a', hot: '#ff3b3b', hx: 1450, hy: 560, hr: 950 });
  glow(g, 560, 640, 700, '#8fd3ff', 0.35);
  bigFace(g, 600, 720, 330, { outfit: MAYA, expr: 'shocked', look: [0.35, 0.1], rimColor: '#9fdcff', rimSide: 1, tilt: -0.06 });
  g.save(); g.translate(1420, 640); g.rotate(0.07); phone(g, 0, 0, 980, 0, { time: '11:59', date: 'Tonight', cards: [], glowA: 1.4 }); g.restore();
  bigNotif(g, 860, 470, 1010, { sender: 'Mom', msg: '14 missed calls', msgColor: '#ff6b5a', tag: 'TOMORROW 6:12 PM', icon: '☎' });
  headline(g, [['TOO', WHITE], ['LATE?', YELLOW]], 60, 175, 230);
} });

// B — the power: she already knows tomorrow's pop quiz. Smug Maya, 20/20.
registerShot('thB', { draw(g) {
  backdrop(g, { top: '#1a0f3a', bottom: '#0e2a3a', hot: '#ffb347', hx: 1450, hy: 600, hr: 850, bokeh: '#ffd59a' });
  glow(g, 1450, 640, 650, '#ffd59a', 0.3);
  bigFace(g, 1450, 700, 330, { outfit: MAYA, expr: 'smirk', look: [-0.45, 0.05], rimColor: '#ffd59a', rimSide: -1, tilt: 0.05 });
  // quiz paper
  g.save(); g.translate(560, 820); g.rotate(-0.1);
  rr(g, -250, -150, 500, 330, 18); g.fillStyle = '#f7f4ee'; g.fill();
  for (let i = 0; i < 5; i++) { seg(g, [[-200, -90 + i * 50], [110, -90 + i * 50]], 8, '#c9c4d6'); seg(g, [[150, -95 + i * 50], [165, -80 + i * 50], [195, -112 + i * 50]], 9, '#e0443a'); }
  text(g, '20/20', 120, 125, { size: 120, color: '#e0443a', stroke: 10, strokeColor: '#f7f4ee' });
  g.restore();
  bigNotif(g, 50, 400, 1080, { sender: 'Mr. Okafor', msg: 'POP QUIZ', msgSize: 96, msgColor: YELLOW, tag: 'TOMORROW 8:05 AM', icon: '✎', iconColor: '#8a5ad6', glow: '#ffb347' });
  headline(g, [['I', WHITE], ['KNOW.', YELLOW]], 60, 190, 240);
} });

// C — the escalation: tomorrow keeps count. 46 → 312 notifications. Scared Maya.
registerShot('thC', { draw(g) {
  backdrop(g, { top: '#08122e', bottom: '#2a0c1e', hot: '#ff5a3c', hx: 620, hy: 600, hr: 900 });
  g.save(); g.translate(640, 600); g.rotate(-0.06);
  phone(g, 0, 0, 1000, 0, { time: '11:59', date: 'Tomorrow', cards: [], glowA: 1.4, tally: 1 });
  text(g, '312', 0, 30, { size: 230, color: TAG, glow: 40, glowColor: alpha(TAG, 0.9), stroke: 14, strokeColor: '#1a0a14' });
  text(g, 'NEW', 0, 170, { size: 70, font: FONTS.ui, weight: 900, color: '#f2efe8', spacing: 8 });
  g.restore();
  // "+2" badge like a notification bump
  g.save(); g.translate(930, 300); g.rotate(0.12); rr(g, -110, -70, 220, 140, 70); g.fillStyle = TAG; g.fill();
  text(g, '+2', 0, 6, { size: 110, color: WHITE, stroke: 10, strokeColor: '#5a0f14' }); g.restore();
  bigFace(g, 1480, 760, 300, { outfit: MAYA, expr: 'shocked', face: { brows: null, mouth: 'wavy', sweat: true }, look: [-0.5, -0.1], rimColor: '#ff8a6a', rimSide: -1, tilt: 0.04 });
  headline(g, [['IT', WHITE], ['KEEPS', WHITE]], 1080, 150, 150);
  headline(g, [['COUNT.', YELLOW]], 1080, 300, 150);
} });
