// sets/places.js — the rest of the world: kitchen, living room, track, parking lot, office, bus stop,
// night street, hospital. Each returns { GY, CX, M } and is anchored to GY = E.H * V(0.8, 0.68).
import { E, V, mood, layer, backdrop, rr, seg, circle, poly, linGrad, glow, alpha, shade, text, FONTS } from '/engine/core.js';
import * as FX from '/engine/fx2d.js';

const G = () => E.H * V(0.8, 0.68);
const room = (g, M, GY, top = 0.32, bot = -0.62) => { g.fillStyle = linGrad(g, 0, -E.H, 0, GY, [shade(M.wall, bot), shade(M.wall, -top)]); g.fillRect(-E.W, -E.H, E.W * 3, GY + E.H); };
const floor = (g, M, GY, pool = null) => { g.fillStyle = linGrad(g, 0, GY, 0, GY + 500, [shade(M.floor, 0.02), shade(M.dark, -0.25)]); g.fillRect(-E.W, GY, E.W * 3, E.H * 2); FX.floorLines(g, GY, GY + 600, 'rgba(0,0,0,.24)', 0.08); if (pool) FX.pool(g, pool[0], GY + 30, pool[1], 60, pool[2], 0.16); };
const win = (g, M, x, y, w, h, wallDark, extra) => FX.windowFrame(g, { x, y, w, h, cols: 2, rows: 2, frame: wallDark, bar: 9 }, (g, X, Y, W, H) => { g.fillStyle = linGrad(g, 0, Y, 0, Y + H, M.sky); g.fillRect(X, Y, W, H); extra?.(g, X, Y, W, H); });

// KITCHEN — home, dawn (or night with o.mood). Window left, counter, fridge, radio.
export function kitchen(g, t, cam, o = {}) {
  const M = mood(o.mood || 'golden'), GY = G(), CX = E.W / 2, wallDark = shade(M.wall, -0.62);
  layer(g, cam, 0.45, (g) => {
    room(g, M, GY);
    const wx = CX - V(700, 420), wy = GY - V(640, 980);
    win(g, M, wx, wy, V(380, 320), V(330, 380), wallDark, (g, X, Y, W, H) => { FX.sun(g, X + W * 0.4, Y + H * 0.75, 38, '#fff3dc', M.key, 4); FX.hills(g, { y: Y + H * 0.85, amp: 16, color: alpha(wallDark, 0.8), seed: 7 }); });
    FX.godRays(g, wx + V(190, 160), wy + V(200, 220), { color: M.key, a: 0.09, angle: 0.75, spread: 0.6, len: 1400, t });
    for (let i = 0; i < 5; i++) { rr(g, CX - V(180, 150) + i * V(150, 110), GY - V(640, 980), V(130, 96), V(150, 160), 6); g.fillStyle = shade(wallDark, 0.06); g.fill(); }   // cabinets
    rr(g, CX + V(620, 380), GY - V(560, 760), V(200, 160), V(560, 760), 10); g.fillStyle = shade(wallDark, 0.12); g.fill();   // fridge
    g.fillStyle = alpha('#000', 0.3); g.fillRect(CX + V(640, 395), GY - V(380, 520), 8, 90);
    FX.clock(g, CX + V(280, 170), GY - V(720, 1100), 30, (o.clockH ?? 7) * 3600 + (o.clockM ?? 0) * 60 + t, { face: '#e9e2ea' });
  });
  layer(g, cam, 0.8, (g) => {
    floor(g, M, GY, [CX - V(380, 220), 420, M.key]);
    FX.counter(g, { x: CX - V(200, 160), y: GY - 6, w: V(760, 560), h: 150, color: shade(wallDark, -0.1), top: shade(wallDark, 0.25), doors: 6 });
    if (o.radio !== false) { rr(g, CX + V(420, 270), GY - 196, 90, 46, 8); g.fillStyle = '#2a2230'; g.fill(); circle(g, CX + V(445, 292), GY - 173, 12, '#c8b8a0'); }
  });
  return { GY, CX, M, counterTop: GY - 156 };
}

// LIVING ROOM — night, a couch, a coffee table with envelopes, a warm lamp.
export function livingroom(g, t, cam, o = {}) {
  const M = mood(o.mood || 'night'), GY = G(), CX = E.W / 2, wallDark = shade(M.wall, -0.6);
  layer(g, cam, 0.45, (g) => {
    room(g, M, GY, 0.3, -0.65);
    win(g, M, CX + V(380, 220), GY - V(640, 980), V(360, 300), V(340, 380), wallDark, (g, X, Y, W, H) => { FX.stars(g, t, { area: [X, Y, W, H * 0.6], count: 30, seed: 4 }); FX.skyline(g, { x: X, y: Y + H, w: W, maxH: H * 0.4, color: alpha(wallDark, 0.9), windowColor: alpha(M.practical, 0.7), lit: 0.2, seed: 6 }); });
    const lx = CX - V(560, 360), ly = GY - V(330, 380);             // floor lamp
    seg(g, [[lx, GY], [lx, ly]], 6, '#15121c'); poly(g, [[lx - 50, ly], [lx + 50, ly], [lx + 30, ly - 70], [lx - 30, ly - 70]], '#e9c890');
    glow(g, lx, ly - 20, 420, M.practical, 0.35); FX.lightCone(g, lx, ly, { angle: Math.PI / 2, spread: 0.9, len: 500, color: M.practical, a: 0.12 });
  });
  layer(g, cam, 0.8, (g) => {
    floor(g, M, GY, [CX - V(400, 260), 520, M.practical]);
    const cx = CX - V(140, 100);                                     // couch
    rr(g, cx - 330, GY - 210, 660, 120, 26); g.fillStyle = shade('#3a3050', -0.2); g.fill();
    rr(g, cx - 350, GY - 120, 700, 110, 22); g.fillStyle = shade('#3a3050', -0.05); g.fill();
    rr(g, cx - 380, GY - 170, 70, 160, 20); g.fill(); rr(g, cx + 310, GY - 170, 70, 160, 20); g.fill();
    rr(g, CX + V(330, 200), GY - 90, 300, 20, 6); g.fillStyle = shade(wallDark, 0.1); g.fill();   // coffee table
    for (const lx2 of [CX + V(350, 215), CX + V(600, 390)]) seg(g, [[lx2, GY - 70], [lx2, GY]], 6, shade(wallDark, 0.05));
    if (o.envelopes !== false) for (let i = 0; i < 5; i++) { rr(g, CX + V(370, 230) + i * 34, GY - 104 - i * 3, 96, 20, 3); g.fillStyle = i === 1 || i === 3 ? '#c0392b' : '#e8e2d6'; g.fill(); }
  });
  return { GY, CX, M, couchX: CX - V(140, 100), tableX: CX + V(480, 300) };
}

// TRACK — school track & bleachers; mood 'day' (clear) or 'storm' (rain, lightning).
export function track(g, t, cam, o = {}) {
  const M = mood(o.mood || 'day'), GY = G(), CX = E.W / 2;
  layer(g, cam, 0.15, (g) => { backdrop(g, M.sky); if (o.mood === 'storm') { FX.clouds(g, { y: GY - V(700, 1200), h: 260, color: '#2a3050', a: 0.6, count: 9, seed: 5 }); if (o.flash) { g.fillStyle = alpha('#e8eeff', 0.5 * o.flash); g.fillRect(-E.W, -E.H, E.W * 3, E.H * 3); } } else { FX.sun(g, CX + V(600, 300), GY - V(700, 1100), 56, '#fff6e0', M.key, 4); FX.clouds(g, { y: GY - V(700, 1100), h: 160, color: '#ffffff', a: 0.35, seed: 3 }); } });
  layer(g, cam, 0.45, (g) => {
    FX.hills(g, { y: GY - V(200, 300), amp: 40, color: shade(M.grass, -0.35), seed: 9 });
    for (let r = 0; r < 5; r++) { g.fillStyle = shade(M.wall, -0.25 - r * 0.05); g.fillRect(CX - V(900, 600), GY - V(110, 160) - r * 38, V(1100, 900), 30); }   // bleachers
    for (const x of [CX - V(1000, 700), CX + V(1100, 700)]) { seg(g, [[x, GY], [x, GY - V(560, 800)]], 8, '#15121c'); rr(g, x - 60, GY - V(600, 840), 120, 50, 6); g.fillStyle = '#20202c'; g.fill(); }
    if (o.sign) { rr(g, CX + V(260, 160), GY - V(260, 320), 300, 90, 8); g.fillStyle = '#e8e2d6'; g.fill(); text(g, o.sign, CX + V(410, 310), GY - V(215, 275), { size: 34, font: FONTS.ui, weight: 900, color: '#2a2a40' }); seg(g, [[CX + V(410, 310), GY - V(170, 230)], [CX + V(410, 310), GY]], 6, '#2a2a40'); }
  });
  layer(g, cam, 0.85, (g) => {
    g.fillStyle = linGrad(g, 0, GY - 20, 0, GY + 500, [shade('#8a3a2e', o.mood === 'storm' ? -0.55 : -0.25), shade('#5a2620', -0.5)]); g.fillRect(-E.W, GY - 20, E.W * 3, E.H * 2);
    for (let i = 1; i < 6; i++) { g.fillStyle = alpha('#ffffff', 0.35); g.fillRect(-E.W, GY - 20 + i * 34 + i * i * 3, E.W * 3, 3); }
  });
  if (o.mood === 'storm') FX.rain(g, t, { count: 260, color: '#c8d4ff', a: 0.5 });
  return { GY, CX, M };
}

// PARKING LOT — school lot at night, lamp posts, orange cones, Jordan's car.
export function parking(g, t, cam, o = {}) {
  const M = mood('night'), GY = G(), CX = E.W / 2;
  layer(g, cam, 0.15, (g) => { backdrop(g, M.sky); FX.stars(g, t, { count: 90, seed: 2 }); FX.moon(g, CX - V(600, 300), GY - V(760, 1200), 30); });
  layer(g, cam, 0.4, (g) => { FX.facade(g, { x: CX - V(1100, 800), y: GY - V(120, 160), w: V(2200, 1600), h: V(330, 420), color: shade(M.wall, -0.3), win: M.practical, cols: 14, rows: 2, lit: 0.3, seed: 8 }); });
  layer(g, cam, 0.8, (g) => {
    g.fillStyle = linGrad(g, 0, GY, 0, GY + 500, [shade(M.road, -0.05), shade(M.dark, -0.3)]); g.fillRect(-E.W, GY, E.W * 3, E.H * 2);
    for (let i = -6; i < 8; i++) { g.fillStyle = alpha('#e8e2d6', 0.35); g.fillRect(CX + i * 240, GY + 30, 10, 140); }
    for (const x of [CX - V(700, 420), CX + V(700, 420)]) { FX.lampPost(g, x, GY, V(420, 560), { light: M.practical, a: 0.2 }); FX.pool(g, x + 30, GY + 40, 260, 50, M.practical, 0.3); }
    const cones = o.cones ?? [-300, -120, 60, 240]; cones.forEach((dx) => { poly(g, [[CX + dx - 18, GY + 70], [CX + dx + 18, GY + 70], [CX + dx, GY + 18]], '#ff7a2a'); g.fillStyle = '#ffffff'; g.fillRect(CX + dx - 9, GY + 44, 18, 6); });
    if (o.car !== false) { const cx = CX + (o.carX ?? -40); rr(g, cx - 170, GY - 30, 340, 70, 22); g.fillStyle = '#2a3a5a'; g.fill(); rr(g, cx - 100, GY - 80, 190, 60, 18); g.fill(); g.fillStyle = alpha('#9fc8ff', 0.35); g.fillRect(cx - 86, GY - 72, 160, 40); circle(g, cx - 110, GY + 42, 26, '#0c0a12'); circle(g, cx + 110, GY + 42, 26, '#0c0a12'); glow(g, cx + 170, GY, 120, '#fff3c0', 0.4); }
  });
  return { GY, CX, M };
}

// OFFICE — Hindsight Labs, 22nd floor: glass wall, dusk city, long table.
export function office(g, t, cam, o = {}) {
  const M = mood(o.mood || 'dusk'), GY = G(), CX = E.W / 2, wallDark = shade(M.wall, -0.65);
  layer(g, cam, 0.15, (g) => { backdrop(g, M.sky); FX.sun(g, CX + V(400, 200), GY - V(260, 400), 60, '#fff3dc', M.key, 4); });
  layer(g, cam, 0.3, (g) => FX.skyline(g, { x: -E.W, y: GY - V(120, 200), w: E.W * 3, minH: 120, maxH: V(560, 800), color: shade(M.wall, -0.45), windowColor: alpha(M.practical, 0.6), lit: 0.3, seed: 14 }));
  layer(g, cam, 0.55, (g) => {
    for (let x = -E.W; x < E.W * 2; x += 360) seg(g, [[x, -E.H], [x, GY]], 10, wallDark);     // glass mullions
    g.fillStyle = alpha(wallDark, 0.9); g.fillRect(-E.W, -E.H, E.W * 3, V(140, 220) - 0);
    g.fillStyle = alpha('#9fb8ff', 0.05); g.fillRect(-E.W, -E.H, E.W * 3, GY + E.H);
    text(g, 'HINDSIGHT LABS', CX - V(560, 300), V(80, 140), { size: V(30, 32), font: FONTS.ui, weight: 900, color: alpha('#e8eeff', 0.5), spacing: 8 });
  });
  layer(g, cam, 0.85, (g) => {
    floor(g, mood('interiorCool'), GY, [CX, 700, M.key]);
    if (o.table !== false) { rr(g, CX - V(560, 400), GY - 120, V(1120, 800), 22, 8); g.fillStyle = shade(wallDark, 0.3); g.fill(); g.fillStyle = alpha(M.key, 0.25); g.fillRect(CX - V(550, 390), GY - 120, V(1100, 780), 3);
      for (const dx of [-V(500, 360), V(500, 360)]) seg(g, [[CX + dx, GY - 100], [CX + dx, GY]], 8, shade(wallDark, 0.1)); }
  });
  return { GY, CX, M };
}

// BUS STOP — street at dawn, facades, shelter.
export function busstop(g, t, cam, o = {}) {
  const M = mood('golden'), GY = G(), CX = E.W / 2;
  layer(g, cam, 0.15, (g) => { backdrop(g, M.sky); FX.sun(g, CX - V(500, 200), GY - V(420, 700), 60, '#fff3dc', M.key, 5); });
  layer(g, cam, 0.4, (g) => FX.facade(g, { x: -E.W, y: GY - V(60, 90), w: E.W * 3, h: V(520, 760), color: shade(M.wall, -0.3), win: M.practical, cols: 22, rows: 4, lit: 0.25, seed: 21 }));
  layer(g, cam, 0.8, (g) => {
    g.fillStyle = linGrad(g, 0, GY, 0, GY + 500, [shade(M.floor, -0.1), shade(M.dark, -0.3)]); g.fillRect(-E.W, GY, E.W * 3, E.H * 2);
    const sx = CX + V(160, 100); seg(g, [[sx - 220, GY], [sx - 220, GY - 300]], 7, '#1a1420'); seg(g, [[sx + 220, GY], [sx + 220, GY - 300]], 7, '#1a1420');
    rr(g, sx - 240, GY - 320, 480, 26, 6); g.fillStyle = '#1a1420'; g.fill(); g.fillStyle = alpha('#c8e0ff', 0.08); g.fillRect(sx - 214, GY - 294, 428, 250);
    rr(g, sx + 260, GY - 380, 70, 70, 35); g.fillStyle = '#2a6ab0'; g.fill(); text(g, 'BUS', sx + 295, GY - 345, { size: 20, font: FONTS.ui, weight: 900, color: '#fff' }); seg(g, [[sx + 295, GY - 310], [sx + 295, GY]], 6, '#1a1420');
    FX.pool(g, CX - V(300, 150), GY + 30, 600, 60, M.key, 0.2);
  });
  return { GY, CX, M };
}

// STREET — Mom's street at night, houses, porch light; o.siren (0..1) adds red/blue flashing.
export function street(g, t, cam, o = {}) {
  const M = mood('night'), GY = G(), CX = E.W / 2;
  const s = o.siren || 0, ph = Math.sin(t * 10) > 0;
  layer(g, cam, 0.15, (g) => { backdrop(g, M.sky); FX.stars(g, t, { count: 80, seed: 7 }); });
  layer(g, cam, 0.45, (g) => {
    for (const [x, w, h] of [[-900, 520, 360], [-280, 600, 420], [420, 560, 380], [1060, 520, 350]]) {
      poly(g, [[CX + x, GY - h], [CX + x + w / 2, GY - h - 160], [CX + x + w, GY - h]], shade(M.wall, -0.45));
      FX.facade(g, { x: CX + x, y: GY, w, h, color: shade(M.wall, -0.3), win: M.practical, cols: 3, rows: 2, lit: 0.5, seed: 30 + x, door: true });
    }
    glow(g, CX + 20, GY - 220, 220, M.practical, 0.35);
  });
  layer(g, cam, 0.85, (g) => {
    g.fillStyle = linGrad(g, 0, GY, 0, GY + 500, [shade(M.road, 0.05), shade(M.dark, -0.3)]); g.fillRect(-E.W, GY, E.W * 3, E.H * 2);
    FX.lampPost(g, CX - V(620, 400), GY, V(420, 560), { light: M.practical, a: 0.2 }); FX.pool(g, CX - V(590, 370), GY + 40, 260, 50, M.practical, 0.3);
    if (o.ambulance) { const ax = CX + (o.ambX ?? 520); rr(g, ax - 200, GY - 150, 400, 160, 16); g.fillStyle = '#e8e4f0'; g.fill(); g.fillStyle = '#c0392b'; g.fillRect(ax - 200, GY - 80, 400, 22); rr(g, ax - 60, GY - 178, 120, 28, 8); g.fillStyle = ph ? '#ff3b30' : '#3b7bff'; g.fill(); circle(g, ax - 120, GY + 10, 30, '#0c0a12'); circle(g, ax + 120, GY + 10, 30, '#0c0a12'); }
  });
  if (s > 0) { glow(g, E.W * 0.75, E.H * 0.35, E.W * 0.6, ph ? '#ff3b30' : '#3b7bff', 0.28 * s); g.save(); g.globalCompositeOperation = 'soft-light'; g.fillStyle = alpha(ph ? '#ff3b30' : '#3b7bff', 0.3 * s); g.fillRect(-E.W, -E.H, E.W * 3, E.H * 3); g.restore(); }
  return { GY, CX, M };
}

// HOSPITAL — room at night: bed, heart monitor, window.
export function hospital(g, t, cam, o = {}) {
  const M = mood('interiorCool'), GY = G(), CX = E.W / 2, wallDark = shade(M.wall, -0.55);
  layer(g, cam, 0.45, (g) => {
    room(g, M, GY, 0.2, -0.55);
    win(g, mood('night'), CX - V(720, 440), GY - V(640, 980), V(360, 300), V(340, 380), wallDark, (g, X, Y, W, H) => FX.skyline(g, { x: X, y: Y + H, w: W, maxH: H * 0.5, color: alpha(wallDark, 0.9), windowColor: alpha(M.practical, 0.6), lit: 0.25, seed: 3 }));
    FX.screen(g, { x: CX + V(380, 240), y: GY - V(520, 760), w: 180, h: 120, glowC: '#7fffb0', a: 0.25 }, (g, x, y, w, h) => { g.strokeStyle = '#7fffb0'; g.lineWidth = 3; g.beginPath(); for (let i = 0; i < 40; i++) { const u = (i / 40 + t * 0.5) % 1, spike = Math.abs(u - 0.5) < 0.03 ? -30 : 0; g.lineTo(x + 6 + i * 4.2, y + h / 2 + spike); } g.stroke(); });
  });
  layer(g, cam, 0.8, (g) => {
    floor(g, M, GY, [CX, 520, M.key]);
    const bx = CX - V(260, 200); rr(g, bx, GY - 110, V(620, 460), 40, 10); g.fillStyle = '#cfd6e6'; g.fill(); rr(g, bx + 10, GY - 140, 120, 40, 14); g.fillStyle = '#eef2fa'; g.fill();
    seg(g, [[bx, GY - 70], [bx, GY]], 8, '#6a7088'); seg(g, [[bx + V(620, 460), GY - 70], [bx + V(620, 460), GY]], 8, '#6a7088'); seg(g, [[bx - 10, GY - 190], [bx - 10, GY - 60]], 10, '#6a7088');
  });
  return { GY, CX, M, bedX: CX - V(260, 200) };
}
