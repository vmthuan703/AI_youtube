// sets/school.js — school hallway (lockers, ceiling strips, red fire-alarm strobe) and classroom.
import { E, V, mood, layer, rr, seg, circle, linGrad, glow, alpha, shade, text, FONTS } from '/engine/core.js';
import * as FX from '/engine/fx2d.js';

export const schoolGround = () => E.H * V(0.8, 0.68);
export const ALARM = '#ff3b30';

export function hallway(g, t, cam, o = {}) {
  const M = mood(o.mood || 'interiorCool'), GY = schoolGround(), CX = E.W / 2;
  const wall = shade(M.wall, -0.25), wallDark = shade(M.wall, -0.55);
  const strobe = o.alarm ? (Math.sin(t * 9) > 0.2 ? 1 : 0.15) : 0;
  layer(g, cam, 0.5, (g) => {
    g.fillStyle = linGrad(g, 0, -E.H, 0, GY, [wallDark, wall]); g.fillRect(-E.W, -E.H, E.W * 3, GY + E.H);
    for (let x = -E.W; x < E.W * 2; x += 520) { rr(g, x, GY - V(760, 1250), 300, 14, 7); g.fillStyle = '#e8f0ff'; g.fill(); glow(g, x + 150, GY - V(750, 1240), 260, M.key, 0.25); }
    const lt = GY - V(470, 620), lh = GY - lt - 30;
    for (let x = -E.W, i = 0; x < E.W * 2; x += 92, i++) {            // locker bank
      rr(g, x, lt, 86, lh, 4); g.fillStyle = i % 2 ? shade('#2f4a6a', -0.35) : shade('#2f4a6a', -0.45); g.fill();
      for (let k = 0; k < 3; k++) g.fillRect(x + 20, lt + 26 + k * 10, 46, 3);
      g.fillStyle = alpha('#000', 0.3); g.fillRect(x + 66, lt + lh * 0.45, 8, 26);
    }
    const ax = CX + V(380, 220), ay = lt - 70;                         // fire alarm box
    rr(g, ax - 34, ay - 24, 68, 48, 8); g.fillStyle = shade(ALARM, -0.35); g.fill();
    circle(g, ax, ay, 14, strobe > 0.5 ? '#fff2ee' : shade(ALARM, -0.1));
    if (strobe > 0) glow(g, ax, ay, 420, ALARM, 0.5 * strobe);
  });
  layer(g, cam, 0.85, (g) => {
    g.fillStyle = linGrad(g, 0, GY, 0, GY + 500, [shade(M.floor, 0.05), shade(M.dark, -0.2)]); g.fillRect(-E.W, GY, E.W * 3, E.H * 2);
    FX.floorLines(g, GY, GY + 600, 'rgba(0,0,0,.22)', 0.07);
    for (let x = -E.W; x < E.W * 2; x += 520) FX.pool(g, x + 150, GY + 30, 260, 40, M.key, 0.12);
  });
  if (strobe > 0) { g.save(); g.globalCompositeOperation = 'soft-light'; g.fillStyle = alpha(ALARM, 0.45 * strobe); g.fillRect(-E.W, -E.H, E.W * 3, E.H * 3); g.restore(); }
  return { GY, CX, M, strobe };
}

export function classroom(g, t, cam, o = {}) {
  const M = mood(o.mood || 'interiorWarm'), GY = schoolGround(), CX = E.W / 2;
  const wall = shade(M.wall, -0.3), wallDark = shade(M.wall, -0.6);
  layer(g, cam, 0.45, (g) => {
    g.fillStyle = linGrad(g, 0, -E.H, 0, GY, [wallDark, wall]); g.fillRect(-E.W, -E.H, E.W * 3, GY + E.H);
    const bx = CX - V(520, 380), by = GY - V(640, 980);               // chalkboard
    rr(g, bx, by, V(860, 700), V(300, 360), 8); g.fillStyle = '#1d2e2a'; g.fill(); g.strokeStyle = shade('#6a4a32', -0.2); g.lineWidth = 12; g.stroke();
    text(g, 'POP QUIZ', bx + V(430, 350), by + V(110, 130), { size: V(64, 60), font: FONTS.title, weight: 700, color: alpha('#e8efe6', 0.85) });
    text(g, 'CH. 7', bx + V(430, 350), by + V(200, 230), { size: V(44, 42), font: FONTS.title, weight: 700, color: alpha('#e8efe6', 0.6) });
    for (const wx of [CX + V(560, 380), CX + V(820, 600)]) FX.windowFrame(g, { x: wx, y: GY - V(640, 980), w: 200, h: V(380, 420), cols: 1, rows: 2, frame: wallDark, bar: 9 }, (g, x, y, w, h) => {
      g.fillStyle = linGrad(g, 0, y, 0, y + h, M.sky); g.fillRect(x, y, w, h); FX.sun(g, x + w * 0.5, y + h * 0.3, 30, '#fff7e6', M.key, 3); });
    FX.godRays(g, CX + V(700, 500), GY - V(560, 900), { color: M.key, a: 0.08, angle: 2.2, spread: 0.6, len: 1400 });
  });
  layer(g, cam, 0.85, (g) => {
    g.fillStyle = linGrad(g, 0, GY, 0, GY + 500, [shade(M.floor, 0.05), M.dark]); g.fillRect(-E.W, GY, E.W * 3, E.H * 2);
    FX.floorLines(g, GY, GY + 600, 'rgba(0,0,0,.2)', 0.07);
    for (const dx of [-600, -200, 200, 600]) { rr(g, CX + dx - 90, GY - 120, 180, 16, 4); g.fillStyle = shade(wallDark, 0.1); g.fill(); seg(g, [[CX + dx - 70, GY - 104], [CX + dx - 70, GY]], 6, shade(wallDark, -0.1)); seg(g, [[CX + dx + 70, GY - 104], [CX + dx + 70, GY]], 6, shade(wallDark, -0.1)); }
    FX.pool(g, CX + V(500, 300), GY + 20, 520, 80, M.key, 0.16);
  });
  return { GY, CX, M };
}
