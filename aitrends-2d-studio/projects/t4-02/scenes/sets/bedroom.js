// sets/bedroom.js — Maya's bedroom at night. Key light: cold moonlight from the window (left);
// the phone's blue glow is the second, story light. Red digital clock on the nightstand.
import { E, V, mood, layer, backdrop, rr, seg, circle, linGrad, glow, alpha, shade, text, FONTS } from '/engine/core.js';
import * as FX from '/engine/fx2d.js';

export const bedGround = () => E.H * V(0.8, 0.68);
export const PHONE_BLUE = '#8fd3ff';
export const CLOCK_RED = '#ff4a3a';

// digital clock (red LED) — reusable in inserts
export function digitalClock(g, x, y, s, str = '11:59', o = {}) {
  rr(g, x - 70 * s, y - 34 * s, 140 * s, 60 * s, 10 * s); g.fillStyle = o.body || '#0c0a12'; g.fill();
  glow(g, x, y - 4 * s, 120 * s, CLOCK_RED, 0.22 * (o.glow ?? 1));
  text(g, str, x, y - 3 * s, { size: 40 * s, font: FONTS.ui, weight: 900, color: CLOCK_RED, glow: 14, glowColor: alpha(CLOCK_RED, 0.8) });
  if (o.pm !== false) text(g, 'PM', x + 58 * s, y + 16 * s, { size: 11 * s, font: FONTS.ui, weight: 900, color: alpha(CLOCK_RED, 0.8) });
}

export function bedroom(g, t, cam, o = {}) {
  const M = mood(o.mood || 'night'), GY = bedGround(), CX = E.W / 2;
  const wall = shade(M.wall, -0.35), wallDark = shade(M.wall, -0.62);
  layer(g, cam, 0.4, (g) => {                                         // back wall + window
    g.fillStyle = linGrad(g, 0, -E.H, 0, GY, [shade(wallDark, -0.2), wall]); g.fillRect(-E.W, -E.H, E.W * 3, GY + E.H);
    const wx = CX - V(760, 420), wy = GY - V(640, 1000), ww = V(420, 360), wh = V(380, 460);
    FX.windowFrame(g, { x: wx, y: wy, w: ww, h: wh, cols: 2, rows: 2, frame: wallDark, bar: 10 }, (g, x, y, w, h) => {
      g.fillStyle = linGrad(g, 0, y, 0, y + h, M.sky); g.fillRect(x, y, w, h);
      FX.stars(g, t, { area: [x, y, w, h * 0.6], count: 40, seed: 9 });
      FX.moon(g, x + w * 0.7, y + h * 0.28, 28);
      FX.skyline(g, { x, y: y + h, w, maxH: h * 0.45, color: alpha(wallDark, 0.9), windowColor: alpha(M.practical, 0.7), lit: 0.25, seed: 5 });
    });
    FX.godRays(g, wx + ww * 0.6, wy + wh * 0.3, { color: M.key, a: 0.07, count: 5, len: V(1100, 1300), angle: 0.6 });
    for (const [px, ph, c] of [[CX + V(260, 180), 170, '#3a2c52'], [CX + V(470, 330), 120, '#2c3e52']]) {   // posters
      rr(g, px, GY - V(620, 980), V(150, 120), ph, 4); g.fillStyle = shade(c, -0.25); g.fill();
      g.fillStyle = alpha('#ffffff', 0.06); g.fillRect(px + 14, GY - V(600, 960), V(120, 92), 6);
    }
  });
  layer(g, cam, 0.8, (g) => {                                         // floor, bed, nightstand
    g.fillStyle = linGrad(g, 0, GY, 0, GY + 500, [shade(M.floor, -0.15), shade(M.dark, -0.3)]); g.fillRect(-E.W, GY, E.W * 3, E.H * 2);
    FX.floorLines(g, GY, GY + 600, 'rgba(0,0,0,.25)', 0.08);
    FX.pool(g, CX - V(420, 240), GY + 40, 380, 60, M.key, 0.12);       // moonlight patch on the floor
    FX.bed(g, { x: CX - V(330, 260), y: GY, w: V(700, 520), color: shade('#3a3f7a', -0.35), frame: shade(wallDark, -0.2), pillow: shade('#cfd4ee', -0.35) });
    const nx = CX + V(470, 300);                                       // nightstand
    rr(g, nx - 80, GY - 150, 160, 150, 6); g.fillStyle = shade(wallDark, -0.15); g.fill();
    g.fillStyle = alpha('#000', 0.35); g.fillRect(nx - 70, GY - 90, 140, 4);
    digitalClock(g, nx - 20, GY - 182, 0.8, o.clock || '11:59', { glow: 0.8 });
    if (o.phoneGlow) glow(g, nx + 40, GY - 160, 260 * o.phoneGlow, PHONE_BLUE, 0.35 * o.phoneGlow);
  });
  return { GY, CX, M, nightstandX: CX + V(470, 300), bedX: CX - V(330, 260) };
}
