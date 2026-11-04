// sets/stairs.js — home staircase at sunrise: landing window at the top right, banister, warm floor.
import { E, V, mood, layer, rr, seg, poly, linGrad, glow, alpha, shade } from '/engine/core.js';
import * as FX from '/engine/fx2d.js';

export const stairsGround = () => E.H * V(0.82, 0.7);
export function stairs(g, t, cam, o = {}) {
  const M = mood(o.mood || 'golden'), GY = stairsGround(), CX = E.W / 2;
  const wall = shade(M.wall, -0.32), wallDark = shade(M.wall, -0.6);
  const sx0 = CX - V(60, 120), steps = 9, sw = V(78, 60), sh = V(52, 70);        // stairs rise to the right
  layer(g, cam, 0.45, (g) => {
    g.fillStyle = linGrad(g, 0, -E.H, 0, GY, [wallDark, wall]); g.fillRect(-E.W, -E.H, E.W * 3, GY + E.H);
    const wx = sx0 + steps * sw - V(40, 60), wy = GY - steps * sh - V(380, 420);
    FX.windowFrame(g, { x: wx, y: wy, w: V(300, 240), h: V(360, 340), cols: 2, rows: 2, frame: wallDark, bar: 9 }, (g, x, y, w, h) => {
      g.fillStyle = linGrad(g, 0, y, 0, y + h, M.sky); g.fillRect(x, y, w, h); FX.sun(g, x + w * 0.35, y + h * 0.7, 40, '#fff3dc', M.key, 4);
      FX.hills(g, { y: y + h * 0.82, amp: 20, color: alpha(wallDark, 0.8), seed: 3 }); });
    FX.godRays(g, wx + V(120, 100), wy + V(240, 220), { color: M.key, a: 0.1, angle: 2.4, spread: 0.7, len: 1500, t });
    for (const [px, py] of [[CX - V(620, 420), GY - V(520, 760)], [CX - V(380, 250), GY - V(560, 800)]]) {  // family photos
      rr(g, px, py, 110, 140, 4); g.fillStyle = shade(wallDark, -0.2); g.fill(); g.fillStyle = alpha(M.practical, 0.18); g.fillRect(px + 10, py + 10, 90, 120); }
  });
  layer(g, cam, 0.8, (g) => {
    g.fillStyle = linGrad(g, 0, GY, 0, GY + 500, [shade(M.floor, 0.05), shade(M.dark, -0.2)]); g.fillRect(-E.W, GY, E.W * 3, E.H * 2);
    FX.floorLines(g, GY, GY + 600, 'rgba(0,0,0,.25)', 0.08);
    const pts = [[sx0, GY]]; for (let i = 0; i < steps; i++) { pts.push([sx0 + i * sw, GY - (i + 1) * sh]); pts.push([sx0 + (i + 1) * sw, GY - (i + 1) * sh]); }
    pts.push([sx0 + steps * sw + 2000, GY - steps * sh]); pts.push([sx0 + steps * sw + 2000, GY]);
    poly(g, pts, shade(wallDark, -0.1));
    for (let i = 0; i < steps; i++) { g.fillStyle = alpha(M.key, 0.12); g.fillRect(sx0 + i * sw, GY - (i + 1) * sh, sw, 4); }
    seg(g, [[sx0 - 10, GY - 160], [sx0 + steps * sw, GY - steps * sh - 160]], 7, shade(wallDark, -0.35));          // banister
    for (let i = 0; i <= steps; i += 1) seg(g, [[sx0 + i * sw, GY - i * sh - 156], [sx0 + i * sw, GY - i * sh - (i ? sh : 0)]], 4, shade(wallDark, -0.35));
    FX.pool(g, sx0 + steps * sw * 0.6, GY - steps * sh * 0.6, 500, 90, M.key, 0.14);
  });
  return { GY, CX, M, bottomX: sx0 - V(180, 140), topX: sx0 + steps * sw, topY: GY - steps * sh };
}
