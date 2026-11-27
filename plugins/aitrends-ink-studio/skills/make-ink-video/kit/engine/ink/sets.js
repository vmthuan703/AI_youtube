// engine/ink/sets.js — Ink Pastel ready-made sets (from the pilot). Each adds itself to the stage and returns { ...spots, update(t) }.
// Facing: yaw 0 looks toward +z; everything stands on y = 0. Spots (BK, SW, PK, CT, DN) are exported for blocking.
//   ruins(T, st, {seed, smoke})  ruined pastel street with a drain gap (DRAIN), smoke columns; facadeHit(set, side, z, y) -> {pos, normal}
//   bunker(T, st, {night})       underground shelter: map wall, radio table, steel door + corridor, mirror, flickering bulbs (BK)
//   sewer(T, st)                 round tunnel along -z (SW) · park(T, st, {lights}) ruined fairground: Ferris wheel, carousel, coaster (PK)
//   ctrl(T, st)                  small control room with a panel and generator (CT) · doorN(T, st) shelter door outside at night (DN)
//   sky(T, st)                   high over the ruins (SKY_Y)
// The logo on the steel doors reads INK_SET.logo (set it per video: INK_SET.logo = 'SHELTER 7').
export const INK_SET = { logo: 'SHELTER 7' };

// ---------------------------------------------------------------- the ruined street
// The street runs along -z from the camera side. Buildings stand on both sides (x = ±7.5..), broken at the top.
// The drain hole is at DRAIN. Everything sits on y = 0.
export const DRAIN = [1.6, 0, -2.2];
export function ruins(T, st, o = {}) {
  const r = T.rng(o.seed ?? 7), THREE = T.THREE;
  const asphalt = T.mat('#7a7486', { rough: 0.95 }), walk = T.mat('#9a92a6'), kerb = T.mat('#b4acbe');
  // road with a square gap at the drain (so people can drop through it); a dark shaft below the gap
  const [dx, , dz] = DRAIN, gap = 1.0;
  st.add(T.box(14, 0.02, (dz - gap) + 120, asphalt, 0, -0.01, (dz - gap - 120) / 2));   // far part (z -120 .. dz-gap)
  st.add(T.box(14, 0.02, 20 - (dz + gap), asphalt, 0, -0.01, (dz + gap + 20) / 2));     // near part (z dz+gap .. 20)
  st.add(T.box(7 + dx - gap, 0.02, gap * 2, asphalt, (-7 + dx - gap) / 2, -0.01, dz));
  st.add(T.box(7 - dx - gap, 0.02, gap * 2, asphalt, (7 + dx + gap) / 2, -0.01, dz));
  const shaftM = T.mat('#0b0a12', { rough: 1, side: THREE.DoubleSide });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 4, 24, 1, true), shaftM); shaft.position.set(dx, -2, dz); st.add(shaft);
  st.add(T.box(gap * 2.2, 0.05, gap * 2.2, '#0b0a12', dx, -4, dz));
  const lip = T.mat('#0b0a12', { rough: 1 });   // dark collar between the round shaft and the square gap
  for (const [w, d, ox, oz] of [[2, 0.1, 0, -0.98], [2, 0.1, 0, 0.98], [0.1, 2, -0.98, 0], [0.1, 2, 0.98, 0]]) st.add(T.box(w, 0.3, d, lip, dx + ox, -0.16, dz + oz));
  for (const sx of [-1, 1]) { st.add(T.box(3.2, 0.16, 140, walk, sx * 8.6, 0.08, -50)); st.add(T.box(0.22, 0.18, 140, kerb, sx * 7.0, 0.09, -50)); }
  // cracks on the road: thin dark slivers (the ink pass turns their edges into drawn lines)
  const crack = T.mat('#4a4458', { rough: 1 });
  for (let i = 0; i < 26; i++) { const c = T.box(0.05 + r() * 0.05, 0.012, 0.8 + r() * 2.4, crack, -6 + r() * 12, 0.004, 4 - r() * 50); c.rotation.y = (r() - 0.5) * 1.6; st.add(c); }
  // buildings: pastel blocks with window rows, top floors broken off in steps
  const cols = ['#d99282', '#8fb0d8', '#e0c690', '#b49ad6', '#86c2a8', '#e0a0b8', '#c98a6e'], winM = T.mat('#3a3450', { rough: 0.6 });
  const blocks = [];
  for (const sx of [-1, 1]) {
    let z = 6;
    while (z > -110) {
      const w = 5 + r() * 4, d = 6 + r() * 5, h = 7 + r() * 16, x = sx * (10.4 + w / 2 + r() * 0.6), m = T.mat(cols[Math.floor(r() * cols.length)], { rough: 0.9 });
      const g = new THREE.Group(); g.position.set(x, 0, z - d / 2);
      const broken = r() < 0.8, cut = broken ? h * (0.45 + r() * 0.35) : h;
      g.add(T.box(w, cut, d, m, 0, cut / 2, 0));
      if (broken) {   // jagged top: a few stepped stubs of the missing floors
        for (let k = 0; k < 4; k++) { const bw = w * (0.2 + r() * 0.35), bh = (h - cut) * (0.2 + r() * 0.6), bx = (r() - 0.5) * (w - bw), bd = d * (0.3 + r() * 0.6);
          const b = T.box(bw, bh, bd, m, bx, cut + bh / 2, (r() - 0.5) * (d - bd)); b.rotation.z = (r() - 0.5) * 0.25; g.add(b); }
      }
      const face = -sx;   // the side facing the street
      for (let fy = 1.6; fy < cut - 1.2; fy += 2.4) for (let fz = -d / 2 + 1; fz < d / 2 - 0.8; fz += 1.6) {
        if (r() < 0.12) continue; g.add(T.box(0.08, 1.2, 0.85, winM, face * (w / 2 + 0.03), fy, fz)); }
      g.userData.box = { w, d, h: cut, face }; st.add(g); blocks.push(g); z -= d + 0.4 + r() * 1.5;
    }
  }
  // rubble heaps and loose chunks along both kerbs and in the road
  const rub = [T.mat('#a89eb2'), T.mat('#8e86a0'), T.mat('#bfae9e')];
  for (let i = 0; i < 70; i++) { const s = 0.15 + r() * (i < 20 ? 0.9 : 0.4), sx = r() < 0.5 ? -1 : 1, x = i < 20 ? sx * (6 + r() * 1.5) : -6 + r() * 12, z = 5 - r() * 60;
    if (Math.hypot(x - DRAIN[0], z - DRAIN[2]) < 2.4 || (Math.abs(x) < 2.6 && z > -6 && z < 3)) continue;
    const c = T.box(s, s * (0.4 + r() * 0.5), s * (0.6 + r() * 0.7), rub[i % 3], x, s * 0.2, z); c.rotation.set(r() * 0.5, r() * 3, r() * 0.5); st.add(c); }
  // a burnt-out car on its side and a bent street lamp
  const pole = T.cyl(0.07, 0.07, 4.5, '#4a4458', 5.9, 2.2, -6); pole.rotation.z = -0.5; st.add(pole);
  // the broken drain: a dark hole with chunks round its lip
  for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2, s = 0.18 + r() * 0.16; const c = T.box(s, s * 0.6, s, rub[i % 3], DRAIN[0] + Math.cos(a) * 1.05, s * 0.3, DRAIN[2] + Math.sin(a) * 1.05); c.rotation.y = a; st.add(c); }
  // smoke columns far down the street (transparent: no ink line, just soft shapes)
  const smokes = o.smoke === false ? [] : [[-9, -30], [12, -48], [-14, -70], [6, -90]].map(([x, z], i) => T.FX3.smoke(st, { pos: [x, 4, z], t0: -8, dur: 999, rate: 6, size: 3.2, grow: 2.2, rise: 1.4, color: i % 2 ? '#8a8298' : '#6e6780', opacity: 0.55 }));
  return { blocks, smokes, update: (t) => smokes.forEach(s => s.update?.(t)) };
}

// a point on the street-facing wall of the building nearest to z on one side (sx = -1 left, +1 right), and the wall's normal
export function facadeHit(set, sx, z, y) {
  const b = set.blocks.filter(g => Math.sign(g.position.x) === sx).sort((a, c) => Math.abs(a.position.z - z) - Math.abs(c.position.z - z))[0], u = b.userData.box;
  const zz = Math.max(b.position.z - u.d / 2 + 0.6, Math.min(b.position.z + u.d / 2 - 0.6, z));
  return { pos: [b.position.x + u.face * u.w / 2, Math.min(y, u.h - 0.8), zz], normal: [u.face, 0, 0] };
}


const noShadow = (m) => { m.traverse?.(o => { o.castShadow = false; }); m.castShadow = false; return m; };

// ---------------------------------------------------------------- BUNKER: the shelter
// Room x -8..8, z -6..5, ceiling 3.3. Back wall (z = -6): the map. Left wall (x = -8): the radio table, the broken mirror.
// Right wall (x = 8): the steel door. Corner x 7, z -5: the old man's blanket. Bulbs hang from the ceiling and flicker.
export const BK = {
  W: 8, D0: -6, D1: 5, H: 3.3,
  MAP: [-1.0, 1.9, -5.9], RADIO: [-7.35, 0.93, -3.3], DOOR: [7.95, 1.15, -0.4], MIRROR: [-7.92, 1.55, 2.4],
  BULBS: [[-2.6, 2.55, -2.2], [2.8, 2.55, -1.6], [0.2, 2.55, 2.6]],
};
function mapTex(T) {
  return T.canvasTex(512, 320, (g, w, h) => {
    g.fillStyle = '#e8dcc4'; g.fillRect(0, 0, w, h); g.fillStyle = '#b8c8a8';
    const r = T.rng(5);
    for (const [x, y, rx, ry] of [[130, 120, 110, 70], [330, 150, 120, 95], [420, 70, 60, 40], [200, 250, 70, 40]]) { g.beginPath(); g.ellipse(x, y, rx, ry, r() * 1.5, 0, Math.PI * 2); g.fill(); }
    g.strokeStyle = '#1c1830'; g.lineWidth = 3; g.strokeRect(4, 4, w - 8, h - 8);
    for (let i = 0; i < 16; i++) { const x = 60 + r() * 400, y = 50 + r() * 230; g.fillStyle = '#1c1830'; g.beginPath(); g.arc(x, y, 5, 0, Math.PI * 2); g.fill();
      if (i % 2 === 0) { g.strokeStyle = '#d0303a'; g.lineWidth = 7; g.beginPath(); g.moveTo(x - 14, y - 14); g.lineTo(x + 14, y + 14); g.moveTo(x + 14, y - 14); g.lineTo(x - 14, y + 14); g.stroke(); } }
  });
}
function logoTex(T) {
  return T.canvasTex(512, 256, (g, w, h) => {
    g.fillStyle = '#8a92a0'; g.fillRect(0, 0, w, h); const r = T.rng(9);
    for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '40,30,40' : '220,210,200'},${0.05 + r() * 0.08})`; g.fillRect(r() * w, r() * h, 3, 3); }
    g.globalAlpha = 0.55; g.strokeStyle = '#2c3e6e'; g.lineWidth = 10; g.beginPath(); g.arc(w / 2, 100, 60, 0, Math.PI * 2); g.stroke();
    g.fillStyle = '#2c3e6e'; g.font = '900 54px Nunito, sans-serif'; g.textAlign = 'center'; g.fillText(INK_SET.logo, w / 2, 220); g.globalAlpha = 1;
  });
}
export function bunker(T, st, o = {}) {
  const night = !!o.night, r = T.rng(o.seed ?? 21), THREE = T.THREE, { W, D0, D1, H } = BK;
  const conc = T.mat('#a49cb0', { rough: 0.95 }), concD = T.mat('#8e86a0', { rough: 0.95 }), floorM = T.mat('#7e7690', { rough: 0.95 });
  // shell: walls and ceiling cast no shadow so the key light still models the people inside
  st.add(T.box(W * 2, 0.1, D1 - D0, floorM, 0, -0.05, (D0 + D1) / 2));
  for (const m of [T.box(W * 2, H, 0.2, conc, 0, H / 2, D0 - 0.1), T.box(W * 2, H, 0.2, conc, 0, H / 2, D1 + 0.1),
    T.box(0.2, H, D1 - D0, concD, -W - 0.1, H / 2, (D0 + D1) / 2),
    // right wall in three pieces around the doorway (z dz-0.7 … dz+0.7, 2.36 high), so the open door shows the dark corridor behind
    T.box(0.2, H, (BK.DOOR[2] - 0.7) - D0, concD, W + 0.1, H / 2, (D0 + BK.DOOR[2] - 0.7) / 2), T.box(0.2, H, D1 - (BK.DOOR[2] + 0.7), concD, W + 0.1, H / 2, (D1 + BK.DOOR[2] + 0.7) / 2),
    T.box(0.2, H - 2.36, 1.4, concD, W + 0.1, (H + 2.36) / 2, BK.DOOR[2]),
    T.box(2.4, 0.1, 2.2, '#1a1824', W + 1.2, -0.05, BK.DOOR[2]), T.box(0.1, H, 2.2, '#0e0c16', W + 2.4, H / 2, BK.DOOR[2]),
    T.box(2.4, H, 0.1, '#16141e', W + 1.2, H / 2, BK.DOOR[2] - 1.1), T.box(2.4, H, 0.1, '#16141e', W + 1.2, H / 2, BK.DOOR[2] + 1.1),
    T.box(W * 2, 0.15, D1 - D0, T.mat('#6e6680', { rough: 1 }), 0, H + 0.07, (D0 + D1) / 2)]) st.add(noShadow(m));
  // wall seams and a dado band (drawn lines give the concrete its panels)
  for (let x = -W + 2; x < W; x += 2.6) st.add(noShadow(T.box(0.04, H, 0.04, concD, x, H / 2, D0 + 0.01)));
  st.add(noShadow(T.box(W * 2, 0.12, 0.05, T.mat('#6a6280'), 0, 1.05, D0 + 0.02)));
  // pipes along the ceiling
  for (const [z, rr, c] of [[-5.4, 0.09, '#6a7488'], [-5.1, 0.06, '#8a6a5a'], [3.9, 0.08, '#6a7488']]) { const p = T.cyl(rr, rr, W * 2, c, 0, H - 0.25, z); p.rotation.z = Math.PI / 2; st.add(noShadow(p)); }
  // the map on the back wall
  st.add(T.plane(2.4, 1.5, T.mat('#ffffff', { map: mapTex(T), rough: 1 }), BK.MAP[0], BK.MAP[1], D0 + 0.03));
  for (const [dx, dy] of [[-1.15, 0.7], [1.15, 0.7], [-1.15, -0.7], [1.15, -0.7]]) st.add(T.sphere(0.04, '#c8323a', BK.MAP[0] + dx, BK.MAP[1] + dy, D0 + 0.05));
  // the radio table on the left wall: table, the old radio (dial + grille), papers, a mug
  const [rx, ry, rz] = BK.RADIO;
  st.add(T.box(0.9, 0.06, 1.6, T.mat('#7a5a44'), -7.4, 0.76, rz)); for (const [dx, dz] of [[-0.38, -0.72], [0.38, -0.72], [-0.38, 0.72], [0.38, 0.72]]) st.add(T.box(0.06, 0.76, 0.06, '#5a4234', -7.4 + dx, 0.38, rz + dz));
  const radio = T.group(T.rbox(0.36, 0.26, 0.5, 0.03, T.mat('#5a6a5a')), T.cyl(0.06, 0.06, 0.03, '#e8dcc4', 0.19, 0.02, 0.1), T.box(0.02, 0.14, 0.2, '#2a2830', 0.18, 0, -0.1));
  radio.children[1].rotation.z = Math.PI / 2; radio.position.set(rx, ry, rz); st.add(radio);
  const ant = T.cyl(0.006, 0.006, 0.6, '#3a3640', rx - 0.05, ry + 0.4, rz - 0.15); ant.rotation.x = 0.3; st.add(ant);
  st.add(T.box(0.3, 0.01, 0.42, '#e8e0d0', -7.5, 0.8, rz + 0.55)); st.add(T.cyl(0.05, 0.045, 0.1, '#c86a4a', -7.2, 0.84, rz - 0.6));
  st.add(T.rbox(0.5, 0.42, 0.5, 0.04, T.mat('#6a5a48'), -6.7, 0.21, rz));   // the crate seat
  // shelves of cans and crates on the right part of the back wall
  for (let k = 0; k < 3; k++) { st.add(T.box(2.2, 0.05, 0.45, '#6a5a48', 5.2, 0.6 + k * 0.62, D0 + 0.3));
    for (let i = 0; i < 6; i++) if (r() < 0.75) st.add(T.cyl(0.07, 0.07, 0.16, ['#c8a85a', '#8a9aa8', '#c86a4a'][i % 3], 4.3 + i * 0.36, 0.71 + k * 0.62, D0 + 0.3)); }
  for (const [x, z, s] of [[6.8, -2.6, 0.7], [6.9, -1.85, 0.55], [-6.9, 4.1, 0.7], [-6.2, 4.3, 0.5], [3.6, 4.3, 0.6]]) { const c = T.rbox(s, s * 0.8, s, 0.04, T.mat(['#7a6a52', '#6a5a48'][Math.round(s * 10) % 2]), x, s * 0.4, z); c.rotation.y = r() * 0.4; st.add(c); }
  // the steel door with the faded logo (right wall)
  const [dx0, , dz0] = BK.DOOR, door = new THREE.Group(); door.position.set(dx0, 0, dz0 + 0.7); st.add(door);   // hinge at the +z edge
  const slab = T.box(0.12, 2.3, 1.4, T.mat('#8a92a0', { metal: 0.3, rough: 0.6 }), 0, 1.15, -0.7); door.add(slab);
  const logo = T.plane(1.1, 0.55, T.mat('#ffffff', { map: logoTex(T), rough: 0.8 }), -0.07, 1.6, -0.7); logo.rotation.y = -Math.PI / 2; door.add(logo);
  for (const y of [0.4, 1.15, 1.9]) door.add(T.box(0.04, 0.06, 1.3, '#5a6270', -0.07, y, -0.7));
  st.add(noShadow(T.box(0.1, 2.5, 0.12, '#5a6270', 7.9, 1.25, dz0 + 0.76))); st.add(noShadow(T.box(0.1, 2.5, 0.12, '#5a6270', 7.9, 1.25, dz0 - 0.76))); st.add(noShadow(T.box(0.1, 0.12, 1.64, '#5a6270', 7.9, 2.42, dz0)));
  // the broken mirror on the left wall: a pale panel with crack lines from one hit point
  const mir = T.plane(0.8, 1.1, T.mat('#ffffff', { rough: 0.15, metal: 0.4, map: T.canvasTex(256, 352, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#c8d4e8'); gr.addColorStop(1, '#8a96b4'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#1c1830'; g.lineWidth = 3; const cx = w * 0.62, cy = h * 0.38; for (let i = 0; i < 9; i++) { const a = i * 0.7 + 0.3; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * 60, cy + Math.sin(a) * 60); g.lineTo(cx + Math.cos(a + 0.15) * 200, cy + Math.sin(a + 0.15) * 200); g.stroke(); } }) }), BK.MIRROR[0], BK.MIRROR[1], BK.MIRROR[2]);
  mir.rotation.y = Math.PI / 2; st.add(mir); st.add(noShadow(T.box(0.05, 1.2, 0.9, '#5a4a3a', -7.97, BK.MIRROR[1], BK.MIRROR[2])));
  // blankets on the floor, and sleeping lumps (people under blankets) to make the room feel full
  const blank = ['#7a5a6a', '#5a6a7a', '#7a6a4a', '#6a7a5a', '#8a5a4a', '#5a5a7a', '#7a4a5a'].map(c => T.mat(c, { rough: 1 }));
  const mats = [[0.6, -5.1, 0], [1.9, -4.6, 0.2], [-0.5, -4.9, -0.1], [3.7, -1.9, 0.5], [-3.2, -1.0, -0.4], [7.0, -5.1, 0.1], [-4.5, 1.5, 0.3], [-1.5, 2.8, -0.2], [2.0, 1.6, 0.1], [5.0, 2.6, -0.3],
    [-2.4, -3.6, 0.6], [4.6, -3.9, -0.2], [-5.4, 3.6, 0.2], [0.6, 4.0, 0.4], [5.8, 0.4, -0.5]];
  mats.forEach(([x, z, a], i) => { const m = T.rbox(1.0, 0.05, 1.9, 0.02, blank[i % blank.length], x, 0.025, z); m.rotation.y = a + Math.PI / 2 * (i % 2); st.add(m); });
  for (const [x, z, a] of [[-2.4, -3.6, 0.6], [4.6, -3.9, -0.2], [-5.4, 3.6, 0.2], [0.6, 4.0, 0.4], [5.8, 0.4, -0.5]]) {   // lumps under blankets
    const body = T.capsule(0.26, 1.1, blank[Math.abs(Math.round(x * 7)) % blank.length]); body.rotation.x = Math.PI / 2; body.position.y = 0.22;
    const gg = T.group(body, T.sphere(0.2, T.mat('#efe8f4'), 0, 0.2, 0.9)); gg.rotation.y = a; gg.position.set(x, 0, z); st.add(gg); }
  // hanging bulbs: cord + bulb + light; the first one flickers
  const lights = BK.BULBS.map(([x, y, z], i) => {
    st.add(noShadow(T.cyl(0.008, 0.008, H - y, '#2a2830', x, (H + y) / 2, z)));
    const bulb = T.sphere(0.07, T.glowMat('#ffd27a', night ? 1.2 : 2.2), x, y - 0.06, z); bulb.castShadow = false; st.add(bulb);
    st.add(noShadow(T.cone(0.16, 0.12, T.mat('#4a4458'), x, y + 0.04, z)));
    const Lg = T.lamp('#ffcf80', night ? 2.2 : 5.5, night ? 6 : 9, { bulb: false }); Lg.position.set(x, y - 0.12, z); st.add(Lg); const L = Lg.light;
    const halo = T.glow('#ffcf80', night ? 0.9 : 1.3, night ? 0.35 : 0.55); halo.position.set(x, y - 0.06, z); st.add(halo);
    return { L, bulb, halo, base: L.intensity, col: bulb.material.color.clone(), op: halo.material?.opacity ?? 0.5, i };
  });
  // the first bulb drops to a quarter for a few frames now and then (pure function of t)
  const flick = (t, i) => (i === 0 && Math.sin(t * 1.7) > 0.86 && Math.sin(t * 23) * Math.sin(t * 7.3 + 1) > 0.2) ? 0.25 : 1;
  const update = (t) => lights.forEach(o => { const k = flick(t, o.i); o.L.intensity = o.base * k; if (o.halo.material) o.halo.material.opacity = o.op * k; o.bulb.material.color.copy(o.col).multiplyScalar(k < 1 ? 0.35 : 1); });
  return { door, radio, mirror: mir, lights, update, spots: BK };
}


const logo = (T) => T.canvasTex(512, 256, (g, w, h) => { g.fillStyle = '#8a92a0'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(40,40,60,.55)'; g.lineWidth = 10;
  g.beginPath(); g.arc(w / 2, 92, 54, 0, Math.PI * 2); g.stroke(); g.fillStyle = 'rgba(40,40,60,.55)'; g.font = '700 58px Fredoka'; g.textAlign = 'center'; g.fillText(INK_SET.logo, w / 2, 210); });
function steelDoor(T, st, x, y0, z, rotY = 0) {   // a closed steel door with the faded logo, facing +z before rotY
  const g = T.group(T.box(1.5, 2.4, 0.14, T.mat('#8a92a0', { metal: 0.3, rough: 0.6 }), 0, 1.2, 0));
  const lg = T.plane(1.1, 0.55, T.mat('#ffffff', { map: logo(T), rough: 0.8 }), 0, 1.65, 0.075); g.add(lg);
  for (const yy of [0.45, 1.2, 1.95]) g.add(T.box(1.36, 0.06, 0.04, '#5a6270', 0, yy, 0.08));
  g.position.set(x, y0, z); g.rotation.y = rotY; st.add(g); return g;
}

// ---------------------------------------------------------------- SEWER: a round tunnel running along -z; you fell in at z 0
export const SW = { DROP: [0, 0], END: -30, W: 2.3 };
export function sewer(T, st) {
  const THREE = T.THREE, R = SW.W, L = 44, r = T.rng(31);
  const wall = T.mat('#5a6a72', { rough: 0.9, side: THREE.BackSide }), brick = T.mat('#4a565e', { rough: 1 });
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(R, R, L, 28, 1, true), wall); tube.rotation.x = Math.PI / 2; tube.position.set(0, 0.9, -L / 2 + 8); st.add(noShadow(tube));
  st.add(T.box(R * 2, 0.1, L, T.mat('#3c464e', { rough: 1 }), 0, -0.4, -L / 2 + 8));
  const water = T.box(R * 1.9, 0.02, L, T.mat('#4e6a78', { rough: 0.08, metal: 0.35, transparent: true, opacity: 0.85 }), 0, 0.06, -L / 2 + 8); water.receiveShadow = true; st.add(water);
  for (let z = 6; z > -L + 8; z -= 3) { const ring = T.torus(R - 0.02, 0.07, brick, 0, 0.9, z); st.add(noShadow(ring)); }
  for (const [x, y, rr, c] of [[-1.75, 1.9, 0.12, '#6a7488'], [1.85, 1.6, 0.09, '#8a6a5a'], [-1.95, 0.9, 0.07, '#6a6a5a']]) { const p = T.cyl(rr, rr, L, c, x, y, -L / 2 + 8); p.rotation.x = Math.PI / 2; st.add(noShadow(p)); }
  // grime streaks + floating bits
  for (let i = 0; i < 40; i++) { const c = T.box(0.04 + r() * 0.08, 0.02, 0.4 + r(), '#2e383e', (r() - 0.5) * 3.2, 0.075, 6 - r() * 40); c.rotation.y = r() * 3; st.add(c); }
  // the broken drain above z 0: a light shaft + rubble that fell in
  const shaft = T.glow('#cfd8ff', 2.2, 0.5); shaft.position.set(0, 2.8, 0); st.add(shaft);
  for (let i = 0; i < 9; i++) { const s = 0.15 + r() * 0.25, c = T.box(s, s * 0.6, s, T.mat('#8e86a0'), (r() - 0.5) * 1.6, s * 0.3, 0.3 + r() * 0.9); c.rotation.y = r() * 3; st.add(c); }
  // dim work lamps every 9 m
  for (let z = 3; z > -L + 8; z -= 9) { const lp = T.lamp('#a8e0c0', 2.4, 7); lp.position.set(1.7, 2.1, z); st.add(lp); st.add(T.box(0.18, 0.12, 0.18, '#3a4048', 1.75, 2.18, z)); }
  // the end: a steel door with a faded logo
  st.add(T.box(R * 2, 3.4, 0.3, T.mat('#4a565e', { rough: 1 }), 0, 1.0, SW.END - 0.2));
  const door = steelDoor(T, st, 0, 0, SW.END); const dl = T.lamp('#ffd8a0', 3.5, 6); dl.position.set(0, 2.6, SW.END + 1.2); st.add(dl);
  return { door, water, update() {} };
}

// ---------------------------------------------------------------- PARK: the dead amusement park
export const PK = { WHEEL: [0, 0, -26], HUB: 12.5, WR: 10.5, BOOTH: [-6.2, 4.5], CAROUSEL: [15, -5], COASTER: [-20, -9], CTRL: [5.4, -21.2], SQUARE: [0, 0] };
export function park(T, st, o = {}) {
  const THREE = T.THREE, r = T.rng(41);
  st.add(T.box(160, 0.1, 160, T.mat('#8e869a', { rough: 0.95 }), 0, -0.05, 0));
  st.add(T.cyl(9, 9, 0.04, T.mat('#a49cae', { rough: 0.9 }), 0, 0.01, 0, 40));   // the square
  const crack = T.mat('#5a5468', { rough: 1 });
  for (let i = 0; i < 40; i++) { const c = T.box(0.05, 0.012, 0.8 + r() * 2.6, crack, (r() - 0.5) * 30, 0.012, (r() - 0.5) * 30); c.rotation.y = r() * 3; st.add(c); }
  // --- the Ferris wheel (rim, spokes, gondolas, bulbs that light up), on an A-frame
  const [wx, , wz] = PK.WHEEL, H = PK.HUB, WR = PK.WR, steel = T.mat('#d8d2e0', { metal: 0.2, rough: 0.5 }), dark = T.mat('#6a6478', { rough: 0.7 });
  for (const sz of [-1.6, 1.6]) for (const sx of [-1, 1]) { const leg = T.cyl(0.18, 0.24, H * 1.08, dark, wx + sx * 3.2, H / 2, wz + sz); leg.rotation.z = sx * 0.26; st.add(leg); }
  const wheel = new THREE.Group(); wheel.position.set(wx, H, wz); st.add(wheel);
  wheel.add(T.cyl(0.5, 0.5, 3.4, dark, 0, 0, 0)); wheel.children[0].rotation.x = Math.PI / 2;
  for (const dz of [-0.8, 0.8]) wheel.add(T.torus(WR, 0.11, steel, 0, 0, dz));
  const N = 16, bulbsOff = T.mat('#7a7486', { rough: 0.5 }), bulbsOn = T.glowMat('#ffd27a', 4.5), bulbs = [], gond = [];
  for (let i = 0; i < N; i++) { const a = (i / N) * Math.PI * 2;
    for (const dz of [-0.8, 0.8]) { const sp = T.cyl(0.05, 0.05, WR, steel, Math.cos(a) * WR / 2, Math.sin(a) * WR / 2, dz); sp.rotation.z = a - Math.PI / 2; wheel.add(sp); }
    const gg = T.group(T.rbox(1.1, 0.9, 1.2, 0.12, T.mat(['#d99282', '#8fb0d8', '#e0c690', '#b49ad6'][i % 4], { rough: 0.8 }), 0, -0.85, 0), T.cyl(0.03, 0.03, 0.5, dark, 0, -0.25, 0));
    gg.position.set(Math.cos(a) * WR, Math.sin(a) * WR, 0); wheel.add(gg); gond.push(gg);
    if (i % 5 === 2) gg.rotation.z = 0.5;   // a few hang crooked (dead park)
  }
  for (let i = 0; i < 64; i++) { const a = (i / 64) * Math.PI * 2; for (const dz of [-0.95, 0.95]) { const b = T.sphere(0.2, bulbsOff, Math.cos(a) * WR, Math.sin(a) * WR, dz, 8, 6); b.castShadow = false; wheel.add(b); bulbs.push(b); } }
  for (let i = 0; i < N; i++) { const a = (i / N) * Math.PI * 2; for (let k = 1; k < 4; k++) { const b = T.sphere(0.16, bulbsOff, Math.cos(a) * WR * k / 4, Math.sin(a) * WR * k / 4, 0.9, 8, 6); b.castShadow = false; wheel.add(b); bulbs.push(b); } }
  const halo = T.glow('#ffd27a', WR * 2.9, 0.0); halo.position.set(wx, H, wz + 0.2); st.add(halo);
  const wheelGlow = T.lamp('#ffcf80', 0, 40, { bulb: false }); wheelGlow.position.set(wx, H, wz + 4); st.add(wheelGlow);
  // --- the control room hut at the wheel's foot
  st.add(T.box(4.2, 2.9, 3.6, T.mat('#9a8e7a', { rough: 0.9 }), PK.CTRL[0], 1.45, PK.CTRL[1] - 1.8));
  st.add(T.box(1.1, 2.1, 0.06, '#1a1622', PK.CTRL[0] - 0.8, 1.05, PK.CTRL[1] + 0.02));   // its dark doorway
  const ctrlWin = T.box(1.2, 0.7, 0.06, T.mat('#3a3450'), PK.CTRL[0] + 1.0, 1.7, PK.CTRL[1] + 0.02); st.add(ctrlWin);
  // --- the snapped roller coaster: a hump of track on pillars, broken in the middle, one end hanging
  const [cx, cz] = PK.COASTER, rail = T.mat('#c86a5a', { rough: 0.6 });
  const pathPt = (u) => [cx - 14 + u * 28, 2 + 9 * Math.sin(Math.PI * u), cz - 6 * u];
  for (let i = 0; i < 28; i++) { const u0 = i / 28, u1 = (i + 1) / 28; if (u0 > 0.47 && u0 < 0.58) continue;   // the gap
    const a = new THREE.Vector3(...pathPt(u0)), b = new THREE.Vector3(...pathPt(u1)); let bb = b.clone();
    if (u0 >= 0.58 && u0 < 0.62) bb = a.clone().add(new THREE.Vector3(0.3, -4.5, 0.2));   // the hanging piece
    const len = a.distanceTo(bb), m = a.clone().lerp(bb, 0.5);
    for (const off of [-0.45, 0.45]) { const rl = T.cyl(0.08, 0.08, len, rail, m.x, m.y, m.z + off); rl.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), bb.clone().sub(a).normalize()); st.add(rl); }
    if (i % 3 === 0 && !(u0 >= 0.58 && u0 < 0.62)) st.add(T.cyl(0.14, 0.18, a.y, dark, a.x, a.y / 2, a.z)); }
  // --- the carousel: faded horses under a striped roof
  const [qx, qz] = PK.CAROUSEL, faded = ['#e8d8c8', '#d8c0b0', '#c8b8d0', '#e0d0a8'];
  st.add(T.cyl(4.2, 4.2, 0.3, T.mat('#b49a86', { rough: 0.8 }), qx, 0.15, qz, 32)); st.add(T.cyl(0.25, 0.25, 4, T.mat('#e0c690'), qx, 2, qz));
  const roofTex = T.canvasTex(512, 64, (g, w, h) => { for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? '#e0a0b8' : '#efe4d8'; g.fillRect(i * w / 16, 0, w / 16, h); } });
  const roof = T.cone(4.8, 1.6, T.mat('#ffffff', { map: roofTex, rough: 0.8 }), qx, 4.6, qz, 24); st.add(roof); roof.rotation.z = 0.05;   // a little tilted
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2, x = qx + Math.cos(a) * 3.1, z = qz + Math.sin(a) * 3.1, m = T.mat(faded[i % 4], { rough: 0.9 });
    st.add(T.cyl(0.04, 0.04, 3.7, '#d8c890', x, 2.15, z));
    const horse = T.group(T.rbox(0.9, 0.38, 0.3, 0.12, m, 0, 0, 0), T.rbox(0.22, 0.42, 0.22, 0.08, m, 0.42, 0.25, 0), T.rbox(0.32, 0.18, 0.2, 0.06, m, 0.58, 0.45, 0));
    for (const [lx, lz] of [[-0.3, -0.09], [-0.3, 0.09], [0.3, -0.09], [0.3, 0.09]]) horse.add(T.cyl(0.04, 0.04, 0.45, m, lx, -0.38, lz));
    horse.position.set(x, 1.2 + (i % 2) * 0.3, z); horse.rotation.y = -a; st.add(horse); }
  // --- the ticket booth (a hiding spot)
  const [bx, bz] = PK.BOOTH; st.add(T.rbox(1.8, 2.3, 1.5, 0.05, T.mat('#c87a6a', { rough: 0.8 }), bx, 1.15, bz));
  st.add(T.box(1.0, 0.6, 0.05, T.mat('#2a2436'), bx, 1.5, bz - 0.76)); st.add(T.box(2.1, 0.12, 1.8, T.mat('#efe4d8'), bx, 2.36, bz));
  const sign = T.plane(1.5, 0.4, T.mat('#ffffff', { map: T.textTex('TICKETS', { bg: '#efe4d8', color: '#c8323a', size: 80 }) }), bx, 2.66, bz - 0.5); st.add(sign);
  // --- speakers on poles + bulb strings on lamp posts round the square (light up with the wheel)
  const speakers = [], posts = [];
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + 0.3, x = Math.cos(a) * 10.5, z = Math.sin(a) * 10.5;
    st.add(T.cyl(0.07, 0.09, 4.2, dark, x, 2.1, z)); const hb = T.sphere(0.24, bulbsOff, x, 4.3, z, 10, 8); hb.castShadow = false; st.add(hb); bulbs.push(hb); posts.push([x, z]);
    if (i % 2 === 0) { const hn = T.cone(0.3, 0.5, T.mat('#5a5468'), x, 3.7, z, 12); hn.rotation.x = Math.PI / 2; hn.rotation.y = -a + Math.PI / 2; st.add(hn); speakers.push(hn); } }
  // --- the dead city round the park: broken pastel blocks
  const cols = ['#d99282', '#8fb0d8', '#e0c690', '#b49ad6', '#86c2a8', '#c98a6e'];
  for (let i = 0; i < 30; i++) { const a = (i / 30) * Math.PI * 2, d = 48 + r() * 14, w = 6 + r() * 6, h = 8 + r() * 22, m = T.mat(cols[i % cols.length], { rough: 0.9 });
    const b = T.box(w, h * (0.5 + r() * 0.4), w, m, Math.cos(a) * d, 0, Math.sin(a) * d); b.position.y = b.geometry.parameters.height / 2; b.rotation.y = r(); st.add(noShadow(b)); }
  const smokes = o.smoke === false ? [] : [[-30, -50], [34, -44], [-44, 10]].map(([x, z]) => T.FX3.smoke(st, { pos: [x, 6, z], t0: -8, dur: 999, rate: 5, size: 4, grow: 2.2, rise: 1.4, color: '#7a7290', opacity: 0.5 }));
  let lit = o.lit ?? 0, spin = 0;
  const set = { wheel, bulbs, speakers, posts, smokes,
    setLit(k) { lit = k; const on = k > 0.5; bulbs.forEach((b, i) => { b.material = (k >= 1 || (on && (i * 7919) % 13 < 13 * k)) ? bulbsOn : bulbsOff; }); wheelGlow.light.intensity = 14 * k; halo.material.opacity = 0.28 * k; },
    setSpin(a) { spin = a; wheel.rotation.z = a; gond.forEach(g => { g.rotation.z = -a + (g.userData.tilt ?? 0); }); },
    update(t) { smokes.forEach(s => s.update?.(t)); } };
  gond.forEach((g, i) => { g.userData.tilt = i % 5 === 2 ? 0.5 : 0; });
  set.setLit(lit); set.setSpin(0);
  return set;
}

// ---------------------------------------------------------------- CTRL: the control room under the wheel (its own little interior)
export const CT = { PANEL: [0, 1.35, -1.85], GEN: [-1.5, 0, -0.9], WIN: [2.45, 1.55, 0.2], DOOR: [0.4, 0, 1.95] };
export function ctrl(T, st, o = {}) {
  const W = 2.5, D = 2.0, Hh = 2.8, conc = T.mat('#7a7068', { rough: 1 }), r = T.rng(51);
  st.add(T.box(W * 2, 0.1, D * 2, T.mat('#5e564e', { rough: 1 }), 0, -0.05, 0)); st.add(noShadow(T.box(W * 2, 0.12, D * 2, conc, 0, Hh + 0.06, 0)));
  st.add(noShadow(T.box(W * 2, Hh, 0.15, conc, 0, Hh / 2, -D - 0.07))); st.add(noShadow(T.box(0.15, Hh, D * 2, conc, -W - 0.07, Hh / 2, 0)));
  // right wall with the window (cracked glass, the park outside), front wall with the doorway
  st.add(noShadow(T.box(0.15, Hh, 1.4, conc, W + 0.07, Hh / 2, -1.3))); st.add(noShadow(T.box(0.15, Hh, 1.1, conc, W + 0.07, Hh / 2, 1.45)));
  st.add(noShadow(T.box(0.15, 1.15, 1.5, conc, W + 0.07, 0.57, 0.15))); st.add(noShadow(T.box(0.15, 0.6, 1.5, conc, W + 0.07, Hh - 0.3, 0.15)));
  const glassTex = T.canvasTex(256, 192, (g, w, h) => { g.fillStyle = 'rgba(200,210,235,0.18)'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(30,26,48,.9)'; g.lineWidth = 2.5;
    for (let i = 0; i < 8; i++) { const a = i * 0.8 + 0.2; g.beginPath(); g.moveTo(w * 0.4, h * 0.45); g.lineTo(w * 0.4 + Math.cos(a) * 140, h * 0.45 + Math.sin(a) * 140); g.stroke(); } });
  const glass = T.plane(1.5, 1.05, T.mat('#ffffff', { map: glassTex, transparent: true, rough: 0.05, metal: 0.6 }), CT.WIN[0], CT.WIN[1], CT.WIN[2]); glass.rotation.y = -Math.PI / 2; st.add(glass);
  const outside = T.plane(6, 4, T.mat('#2a2640', { rough: 1 }), W + 2.5, 1.6, 0.2); outside.rotation.y = -Math.PI / 2; st.add(outside);
  const outBulbs = []; for (let i = 0; i < 30; i++) { const b = T.sphere(0.035, T.mat('#5a5560'), W + 2.4, 1.0 + r() * 2.2, 0.2 + (r() - 0.5) * 3.2, 6, 4); st.add(b); outBulbs.push(b); }
  st.add(noShadow(T.box(1.7, Hh, 0.15, conc, -W + 0.85, Hh / 2, D + 0.07))); st.add(noShadow(T.box(1.75, Hh, 0.15, conc, W - 0.875, Hh / 2, D + 0.07))); st.add(noShadow(T.box(1.6, 0.6, 0.15, conc, CT.DOOR[0], Hh - 0.3, D + 0.07)));
  st.add(T.box(1.6, 0.1, 3, T.mat('#2a2640'), CT.DOOR[0], -0.04, D + 1.6));
  // the switchboard under dust (back wall): a panel with dials, switches and lamps
  const [px, py, pz] = CT.PANEL, dust = T.mat('#a8a094', { rough: 1 }), panel = T.group(T.box(2.6, 1.3, 0.35, T.mat('#7e8a86', { rough: 0.8 }), 0, 0, 0), T.box(2.6, 0.5, 0.7, T.mat('#7e8a86', { rough: 0.8 }), 0, -0.85, 0.18));
  const lamps = [], lampOff = T.mat('#4a4450'), lampOn = T.glowMat('#ff9a5a', 2.2), lampOn2 = T.glowMat('#8affb0', 2.2);
  for (let i = 0; i < 6; i++) { const d = T.cyl(0.11, 0.11, 0.04, '#e8e2d8', -1.0 + i * 0.4, 0.25, 0.18); d.rotation.x = Math.PI / 2; panel.add(d); panel.add(T.box(0.015, 0.09, 0.01, '#1c1830', -1.0 + i * 0.4, 0.28, 0.21)); }
  for (let i = 0; i < 10; i++) { const s = T.box(0.06, 0.12, 0.08, '#2a2830', -1.08 + i * 0.24, -0.18, 0.2); panel.add(s); const l = T.sphere(0.035, lampOff, -1.08 + i * 0.24, -0.38, 0.19, 8, 6); panel.add(l); lamps.push(l); }
  panel.add(T.box(2.62, 0.05, 0.38, dust, 0, 0.67, 0)); panel.add(T.box(2.62, 0.03, 0.72, dust, 0, -0.58, 0.18));
  panel.position.set(px, py, pz); st.add(panel);
  // backup generator with a pull cord
  const [gx, , gz] = CT.GEN, gen = T.group(T.rbox(0.9, 0.6, 0.6, 0.06, T.mat('#c8a24a', { rough: 0.6 }), 0, 0.42, 0), T.box(0.95, 0.1, 0.65, '#3a3640', 0, 0.08, 0), T.cyl(0.12, 0.12, 0.2, '#3a3640', 0.32, 0.8, 0));
  const grip = T.box(0.12, 0.04, 0.04, '#c8323a', 0.5, 0.62, 0.32); gen.add(grip); gen.position.set(gx, 0, gz); gen.rotation.y = 0.5; st.add(gen);
  // clutter: dusty crates, a fallen chair, cables
  for (const [x, z, s] of [[2.0, -1.5, 0.5], [1.6, 1.5, 0.45], [-2.1, 1.4, 0.55]]) st.add(T.rbox(s, s * 0.8, s, 0.03, T.mat('#6a5a48'), x, s * 0.4, z));
  // lights: a dim grey work light; after the generator starts a warm bulb comes on
  const work = T.lamp('#b8c0ff', 2.0, 7, { bulb: false }); work.position.set(0.5, 2.6, 0.8); st.add(work);
  const bulb = T.lamp('#ffcf80', 0, 8); bulb.position.set(0, 2.5, -0.4); st.add(bulb); st.add(T.cyl(0.01, 0.01, 0.3, '#2a2830', 0, 2.65, -0.4));
  const set = { gen, grip, panel, glass,
    setOn(k) { lamps.forEach((l, i) => { l.material = k > (i % 5) / 6 ? (i % 3 ? lampOn : lampOn2) : lampOff; }); bulb.light.intensity = 7 * k;
      outBulbs.forEach((b, i) => { b.material = k >= 1 || (i * 37) % 10 < 10 * k ? T.glowMat('#ffd27a', 2.6) : b.material; }); },
    update() {} };
  set.setOn(o.on ?? 0);
  return set;
}

// ---------------------------------------------------------------- DOOR_N: the bunker entrance in the ruined street, at night
export const DN = { DOOR: [0, 0, -10.45], STEP: [0.9, -10.0] };
export function doorN(T, st, o = {}) {
  const set = ruins(T, st, { smoke: o.smoke });
  const conc = T.mat('#7a7486', { rough: 1 });
  st.add(T.rbox(6, 3.2, 4, 0.2, conc, 0, 1.6, -12.5)); st.add(T.rbox(7, 0.5, 4.6, 0.15, T.mat('#6a6478'), 0, 3.3, -12.5));
  for (const [x, z, s] of [[-3.6, -10.6, 1.1], [3.8, -11.2, 0.9], [-2.6, -9.6, 0.5], [3.1, -9.9, 0.6]]) { const c = T.box(s, s * 0.6, s, T.mat('#8e86a0'), x, s * 0.3, z); c.rotation.y = x; st.add(c); }
  st.add(T.box(2.4, 0.45, 0.7, conc, 0, 0.225, -10.0));   // the concrete ledge a hero sits on
  const door = steelDoor(T, st, 0, 0, -10.45);
  const lamp = T.lamp('#ffcf80', 3.0, 7); lamp.position.set(1.1, 2.7, -10.0); st.add(lamp);
  return { ...set, door, update: set.update };
}

// ---------------------------------------------------------------- SKY: high over the ruins (the street far below)
export const SKY_Y = 34;
export function sky(T, st, o = {}) {
  const set = ruins(T, st, { smoke: o.smoke });
  const lines = T.FX3.speedLines(st, { axis: 'z', dir: 1, around: [0, SKY_Y + 1, -6], radius: [1.2, 6], length: [2, 6], span: 50, speed: 70, c: '#ffffff', opacity: 0.35 });
  return { ...set, lines, update: (t) => { set.update(t); lines.update(t); } };
}
