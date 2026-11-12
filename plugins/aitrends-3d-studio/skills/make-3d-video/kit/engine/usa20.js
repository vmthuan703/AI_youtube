// engine/usa20.js — 2.0 American sets built for depth: a foreground to frame the shot, a detailed middle, rows that
// run to a vanishing point, and far layers (tree line, hills, water tower, power lines) that fade into the air.
//   const ms = T.usa.mapleStreet(st, { season: 'fall' | 'summer' | 'winter', night, wet, lit, xmas });
// Layout (metres): the street runs along x. Near sidewalk z = -1..1, curb at z = 1, road z = 1..9, far curb 9, far sidewalk
// z = 10..12. Near houses stand at z = -11 and face +z; far houses at z = 22 and face -z.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { rng, shade, mix, lerp, noise } from './core.js';
import { mat, box, rbox, cyl, cone, sphere, plane, group, glow, glowMat, canvasTex, cached, textTex, lightCone, basic, color } from './kit3d.js';

const R2 = Math.PI / 2;
const put = (o, x, y, z, ry = 0, s = 1) => { o.position.set(x, y, z); o.rotation.y = ry; if (s !== 1) o.scale.setScalar(s); return o; };

// ---------------------------------------------------------------- textures (cached per colour)
const siding = (c) => cached('siding' + c, () => canvasTex(256, 256, (g, w, h) => { g.fillStyle = c; g.fillRect(0, 0, w, h); for (let i = 0; i < 8; i++) { const y = i * 32; const gr = g.createLinearGradient(0, y, 0, y + 32); gr.addColorStop(0, 'rgba(255,255,255,.10)'); gr.addColorStop(0.8, 'rgba(0,0,0,.05)'); gr.addColorStop(1, 'rgba(0,0,0,.32)'); g.fillStyle = gr; g.fillRect(0, y, w, 32); } }, [1, 1]));
const shingles = (c) => cached('shingle' + c, () => canvasTex(256, 256, (g, w, h) => { g.fillStyle = c; g.fillRect(0, 0, w, h); const r = rng(9); for (let j = 0; j < 8; j++) for (let i = -1; i < 8; i++) { const x = i * 32 + (j % 2) * 16, y = j * 32; g.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '255,255,255'},${0.04 + r() * 0.1})`; g.fillRect(x + 1, y + 1, 30, 30); g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(x, y + 29, 32, 3); } }, [1, 1]));
const lawnTex = (c, leaves) => cached('lawn' + c + leaves, () => canvasTex(512, 512, (g, w, h) => { g.fillStyle = c; g.fillRect(0, 0, w, h); const r = rng(4);
  for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '20,40,10' : '220,255,160'},${0.03 + r() * 0.07})`; g.fillRect(r() * w, r() * h, 2, 5); }
  if (leaves) for (let i = 0; i < 260; i++) { g.fillStyle = leaves[(r() * leaves.length) | 0]; g.globalAlpha = 0.85; g.save(); g.translate(r() * w, r() * h); g.rotate(r() * 6); g.beginPath(); g.ellipse(0, 0, 5, 2.6, 0, 0, 7); g.fill(); g.restore(); } g.globalAlpha = 1; }, [1, 1]));
const roadTex = (c, snow) => cached('road' + c + snow, () => canvasTex(1024, 512, (g, w, h) => { g.fillStyle = c; g.fillRect(0, 0, w, h); const r = rng(11);
  for (let i = 0; i < 14000; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '255,255,255'},${0.02 + r() * 0.06})`; g.fillRect(r() * w, r() * h, 2, 2); }
  for (let i = 0; i < 9; i++) { g.strokeStyle = 'rgba(0,0,0,.3)'; g.lineWidth = 1.5; g.beginPath(); let x = r() * w, y = r() * h; g.moveTo(x, y); for (let k = 0; k < 8; k++) { x += (r() - 0.5) * 90; y += (r() - 0.5) * 50; g.lineTo(x, y); } g.stroke(); }
  for (let i = 0; i < 5; i++) { g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(r() * w, r() * h, 60 + r() * 120, 30 + r() * 50); }   // patches
  if (snow) { g.fillStyle = 'rgba(244,246,255,.92)'; g.fillRect(0, 0, w, h); for (const y of [0.3, 0.42, 0.6, 0.72]) { const gr = g.createLinearGradient(0, h * y - 22, 0, h * y + 22); gr.addColorStop(0, 'rgba(90,96,120,0)'); gr.addColorStop(0.5, 'rgba(90,96,120,.55)'); gr.addColorStop(1, 'rgba(90,96,120,0)'); g.fillStyle = gr; g.fillRect(0, h * y - 22, w, 44); } }
  else { g.fillStyle = '#e8b830'; g.fillRect(0, h * 0.5 - 9, w, 5); g.fillRect(0, h * 0.5 + 4, w, 5); } }, [1, 1]));
const walkTex = (c) => cached('walk' + c, () => canvasTex(256, 256, (g, w, h) => { g.fillStyle = c; g.fillRect(0, 0, w, h); const r = rng(6); for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '255,255,255'},${0.02 + r() * 0.05})`; g.fillRect(r() * w, r() * h, 2, 2); } g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(0, 0, 3, h); g.fillRect(0, h / 2 - 1, w, 2); }, [1, 1]));
const flagTex = () => cached('usflag', () => canvasTex(380, 200, (g, w, h) => { for (let i = 0; i < 13; i++) { g.fillStyle = i % 2 ? '#f2f0ea' : '#b22234'; g.fillRect(0, (i * h) / 13, w, h / 13 + 1); } g.fillStyle = '#2a3a78'; g.fillRect(0, 0, w * 0.4, (h * 7) / 13); g.fillStyle = '#f2f0ea'; for (let j = 0; j < 5; j++) for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(14 + i * 24, 12 + j * 21, 3.4, 0, 7); g.fill(); } }));
const winTex = (lit, seed) => cached('win20' + lit + seed, () => canvasTex(128, 192, (g, w, h) => { const r = rng(seed);
  if (lit) { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#ffe2a0'); gr.addColorStop(1, '#ffb45e'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(120,50,20,.35)'; g.fillRect(0, 0, w * (0.18 + r() * 0.14), h); g.fillRect(w * (0.72 - r() * 0.1), 0, w, h); g.fillStyle = 'rgba(60,20,10,.4)'; g.fillRect(w * 0.3 + r() * 20, h * 0.62, 26, h); }
  else { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#6a84a8'); gr.addColorStop(0.5, '#2a3850'); gr.addColorStop(1, '#4a6488'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,.2)'; g.beginPath(); g.moveTo(0, h * 0.5); g.lineTo(w * 0.6, 0); g.lineTo(w, 0); g.lineTo(0, h); g.fill(); }
  g.fillStyle = '#f4f0e8'; g.fillRect(w / 2 - 4, 0, 8, h); g.fillRect(0, h / 2 - 4, w, 8); }));

// a prism roof along x: base depth d, height rh, length len
function gable(len, d, rh, material) { const s = new THREE.Shape(); s.moveTo(-d / 2, 0); s.lineTo(d / 2, 0); s.lineTo(0, rh); s.closePath(); const g = new THREE.ExtrudeGeometry(s, { depth: len, bevelEnabled: false }); g.translate(0, 0, -len / 2); g.rotateY(R2);
  const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 0.5, uv.getY(i) * 0.5); const m = new THREE.Mesh(g, material); m.castShadow = m.receiveShadow = true; return m; }
function tex(material, t, rx, ry) { const m = t.clone(); m.needsUpdate = true; m.wrapS = m.wrapT = THREE.RepeatWrapping; m.repeat.set(rx, ry); material.map = m; return material; }

// ---------------------------------------------------------------- an American house (faces +z, front wall at z = d/2)
// o: { w, d, h, color, trim, roof, door, porch, garage (-1 left | 1 right | 0), lit, flag, snow, xmas, pumpkins, seed, floors }
export function usHouse(o = {}) {
  const r = rng(o.seed || 1), w = o.w || 9, d = o.d || 8, floors = o.floors || (r() < 0.45 ? 2 : 1), h = o.h || floors * 2.9, c = o.color || '#e8e2d4', trim = o.trim || '#f6f2ea', roofC = o.roof || '#4a4448', F = 0.45;
  const g = group(), wall = mat('#ffffff', { rough: 0.9, map: null }); const st = siding(c).clone(); st.needsUpdate = true; st.wrapS = st.wrapT = THREE.RepeatWrapping; st.repeat.set(1, h / 1.6); wall.map = st;
  const trimM = mat(trim, { rough: 0.8 }), roofM = mat('#ffffff', { rough: 0.95 }); const rt = shingles(roofC).clone(); rt.needsUpdate = true; rt.wrapS = rt.wrapT = THREE.RepeatWrapping; rt.repeat.set(2.2, 2.2); roofM.map = rt;
  const snowM = mat('#f4f6ff', { rough: 0.85 });
  g.add(box(w + 0.1, F, d + 0.1, mat('#8a8480', { rough: 0.95 }), 0, F / 2, 0), box(w, h, d, wall, 0, F + h / 2, 0));
  g.add(box(0.16, h, 0.16, trimM, -w / 2, F + h / 2, d / 2), box(0.16, h, 0.16, trimM, w / 2, F + h / 2, d / 2), box(w + 0.2, 0.18, 0.1, trimM, 0, F + h - 0.02, d / 2 + 0.02));
  const rh = d * 0.36, roof = gable(w + 1.0, d + 1.1, rh, roofM); roof.position.y = F + h; g.add(roof);
  g.add(box(0.06, 0.2, d + 1.14, trimM, -w / 2 - 0.5, F + h + 0.02, 0), box(0.06, 0.2, d + 1.14, trimM, w / 2 + 0.5, F + h + 0.02, 0));
  if (o.snow) { const sn = gable(w + 1.1, d + 1.2, rh + 0.05, snowM); sn.position.y = F + h + 0.1; g.add(sn); }
  // front cross gable over the entrance
  const ex = (o.garage || 0) * -w * 0.12, gw = w * 0.42, gd = 1.6; const fg = gable(gd, gw, gw * 0.42, roofM); fg.rotation.y = R2; fg.position.set(ex, F + h - 0.05, d / 2 + gd / 2 - 0.3); g.add(fg);
  const gf = new THREE.Shape(); gf.moveTo(-gw / 2 + 0.25, 0); gf.lineTo(gw / 2 - 0.25, 0); gf.lineTo(0, gw * 0.42 - 0.2); gf.closePath(); const gfm = new THREE.Mesh(new THREE.ShapeGeometry(gf), mat(shade(c, -0.08), { rough: 0.9 })); gfm.position.set(ex, F + h, d / 2 + gd - 0.28); g.add(gfm);
  if (o.snow) { const sg = gable(gd + 0.1, gw + 0.1, gw * 0.42 + 0.04, snowM); sg.rotation.y = R2; sg.position.set(ex, F + h + 0.04, d / 2 + gd / 2 - 0.3); g.add(sg); }
  g.add(box(0.7, 1.5, 0.7, mat('#8a4a3c', { rough: 0.95 }), w * 0.28, F + h + rh * 0.75, -d * 0.12));   // chimney
  // windows
  const lit = o.lit ?? 0, glows = [];
  const win = (x, y, ww = 1.0, wh = 1.5, on = false) => { const gm = on ? new THREE.MeshBasicMaterial({ map: winTex(true, 1 + ((r() * 5) | 0)), color: new THREE.Color(1.7, 1.5, 1.25), toneMapped: false }) : mat('#ffffff', { map: winTex(false, 1), rough: 0.12, metal: 0.4 });
    const p = new THREE.Mesh(new THREE.PlaneGeometry(ww, wh), gm); p.position.set(x, y, d / 2 + 0.03); g.add(p);
    g.add(box(ww + 0.22, 0.12, 0.1, trimM, x, y + wh / 2 + 0.06, d / 2 + 0.04), box(ww + 0.3, 0.1, 0.16, trimM, x, y - wh / 2 - 0.05, d / 2 + 0.06), box(0.1, wh, 0.08, trimM, x - ww / 2 - 0.05, y, d / 2 + 0.04), box(0.1, wh, 0.08, trimM, x + ww / 2 + 0.05, y, d / 2 + 0.04));
    if (o.shutters !== false) { const sm = mat(o.shutter || shade(c, -0.55), { rough: 0.8 }); g.add(box(0.34, wh, 0.05, sm, x - ww / 2 - 0.3, y, d / 2 + 0.03), box(0.34, wh, 0.05, sm, x + ww / 2 + 0.3, y, d / 2 + 0.03)); }
    if (on) { const gl = glow('#ffb860', 2.4, 0.22); gl.position.set(x, y, d / 2 + 0.3); g.add(gl); glows.push([x, y]); } };
  const wy = F + 1.55, side = o.garage || 0, wxs = side ? [-side * w * 0.3] : [-w * 0.3, w * 0.3];
  for (const x of wxs) win(x, wy, 1.15, 1.5, r() < lit);
  if (floors > 1) for (const x of [-w * 0.3, 0, w * 0.3]) win(x, F + 2.9 + 1.45, 0.95, 1.3, r() < lit * 0.8);
  // door + porch
  const doorC = o.door || ['#8a2a2a', '#2a4a6a', '#2a5a48', '#3a2a24'][(r() * 4) | 0];
  g.add(rbox(1.0, 2.1, 0.08, 0.03, mat(doorC, { rough: 0.5, clearcoat: 0.4 }), ex, F + 1.05, d / 2 + 0.04), box(1.24, 0.14, 0.1, trimM, ex, F + 2.17, d / 2 + 0.05), box(0.12, 2.2, 0.1, trimM, ex - 0.56, F + 1.1, d / 2 + 0.05), box(0.12, 2.2, 0.1, trimM, ex + 0.56, F + 1.1, d / 2 + 0.05));
  g.add(sphere(0.045, mat('#d8b860', { metal: 0.9, rough: 0.3 }), ex + 0.36, F + 1.02, d / 2 + 0.1));
  const pl = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), glowMat('#ffd9a0', lit > 0 ? 3 : 0.6)); pl.position.set(ex + 0.85, F + 1.95, d / 2 + 0.12); g.add(pl); if (lit > 0) { const gl = glow('#ffc878', 1.6, 0.5); gl.position.copy(pl.position); g.add(gl); }
  if (o.porch !== false) { const pw = gw + 0.6, pd = 1.9, pz = d / 2 + pd / 2; g.add(box(pw, 0.18, pd, mat('#b8ac9c', { rough: 0.85 }), ex, F - 0.09, pz));
    for (let i = 0; i < 3; i++) g.add(box(1.5, F / 3, 0.32, mat('#c8beb0', { rough: 0.9 }), ex, F - (i + 0.5) * F / 3 - 0.0, d / 2 + pd + 0.16 + i * 0.3));
    for (const sx of [-1, 1]) { g.add(box(0.2, 2.35, 0.2, trimM, ex + sx * (pw / 2 - 0.15), F + 1.17, d / 2 + pd - 0.15)); g.add(box(0.06, 0.06, pd - 0.3, trimM, ex + sx * (pw / 2 - 0.15), F + 0.85, pz)); for (let k = 0; k < 6; k++) g.add(box(0.045, 0.82, 0.045, trimM, ex + sx * (pw / 2 - 0.15), F + 0.42, d / 2 + 0.2 + k * 0.28)); }
    g.add(box(pw + 0.3, 0.14, pd + 0.3, roofM, ex, F + 2.42, pz));
    if (o.snow) g.add(box(pw + 0.34, 0.1, pd + 0.34, snowM, ex, F + 2.54, pz));
    if (o.flag !== false && r() < 0.6) { const pole = cyl(0.018, 0.018, 1.7, mat('#d8d4cc', { metal: 0.6, rough: 0.4 }), 0, 0.85, 0, 6), fl = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.55, 8, 1), new THREE.MeshStandardMaterial({ map: flagTex(), side: THREE.DoubleSide, roughness: 0.8 }));
      const pa = fl.geometry.attributes.position; for (let i = 0; i < pa.count; i++) pa.setZ(i, Math.sin(pa.getX(i) * 7) * 0.05); fl.geometry.computeVertexNormals(); fl.position.set(0.52, 1.4, 0); fl.castShadow = true;
      const fgp = group(pole, fl); fgp.position.set(ex - pw / 2 + 0.15, F + 1.5, d / 2 + pd - 0.05); fgp.rotation.set(0.65, -0.3, 0); fgp.userData.dynamic = true; g.add(fgp); }
    if (o.pumpkins) for (let k = 0; k < 3; k++) { const s = 0.16 + r() * 0.1, p = sphere(s, mat(['#e8842a', '#d86a1c', '#f0a040'][k], { rough: 0.6 }), ex + (k - 1) * 0.42 + 0.9, F + s * 0.8, d / 2 + pd - 0.4 + r() * 0.2, 12, 8); p.scale.y = 0.8; g.add(p, cyl(0.015, 0.02, 0.07, mat('#4a5a2a'), p.position.x, F + s * 1.6, p.position.z, 5)); }
    if (o.xmas) g.xmas = [[ex - pw / 2 - 0.15, F + 2.36, d / 2 + pd + 0.16], [ex + pw / 2 + 0.15, F + 2.36, d / 2 + pd + 0.16]];
  }
  // garage
  if (side) { const gx = side * (w / 2 + 2.1), gh = 2.7, gW = 4.2, gD = d * 0.8; const gw2 = mat('#ffffff', { rough: 0.9 }); const s2 = siding(c).clone(); s2.needsUpdate = true; s2.wrapS = s2.wrapT = THREE.RepeatWrapping; s2.repeat.set(1, gh / 1.6); gw2.map = s2;
    g.add(box(gW, gh, gD, gw2, gx, gh / 2 + 0.1, d / 2 - gD / 2)); const gr = gable(gW + 0.6, gD + 0.8, gD * 0.3, roofM); gr.position.set(gx, gh + 0.1, d / 2 - gD / 2); g.add(gr);
    if (o.snow) { const sn = gable(gW + 0.7, gD + 0.9, gD * 0.3 + 0.04, snowM); sn.position.set(gx, gh + 0.18, d / 2 - gD / 2); g.add(sn); }
    const gdoor = box(3.3, 2.15, 0.08, mat('#f0ece4', { rough: 0.7 }), gx, 1.18, d / 2 + 0.03); g.add(gdoor); for (let k = 1; k < 4; k++) g.add(box(3.3, 0.03, 0.1, mat('#b8b2a8'), gx, 0.1 + k * 0.54, d / 2 + 0.04));
    g.add(box(3.6, 0.14, 0.1, trimM, gx, 2.33, d / 2 + 0.05));
    // basketball hoop above the garage door
    g.add(box(0.9, 0.6, 0.05, mat('#f4f4f4', { rough: 0.5 }), gx, 3.0, d / 2 + 0.25)); const rim = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.015, 6, 16), mat('#e8501c')); rim.rotation.x = R2; rim.position.set(gx, 2.82, d / 2 + 0.5); g.add(rim);
    g.driveX = gx; }
  g.traverse(m => { if (m.isMesh && !m.material.isMeshBasicMaterial) { m.castShadow = true; m.receiveShadow = true; } });
  g.glows = glows; g.size = [w, h, d]; return g;
}

// ---------------------------------------------------------------- trees with a real canopy (one merged mesh, vertex colours)
// maple({ h, r, colors: [dark, mid, bright], seed, bare, snow }) — trunk, forked branches, and ~34 soft leaf clumps shaded from below
export function maple(o = {}) {
  const r = rng(o.seed || 3), H = o.h || 7.5, R = o.r || 3.0, cols = (o.colors || ['#b8441c', '#e8862a', '#f6c040']).map(c => new THREE.Color(c));
  const g = group(), bark = mat(o.bark || '#3a2a26', { rough: 0.95 }); g.userData.dynamic = true;
  const th = H * 0.5; const trunk = cyl(0.16, 0.3, th, bark, 0, th / 2, 0, 9); g.add(trunk); g.add(cone(0.42, 0.5, bark, 0, 0.2, 0, 9));
  const tips = [];
  const branch = (from, dir, len, rad, depth) => { const to = from.clone().addScaledVector(dir, len); const b = cyl(rad * 0.6, rad, len, bark, 0, 0, 0, 6); b.position.copy(from).lerp(to, 0.5); b.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir); g.add(b);
    if (depth <= 0) { tips.push(to); return; } const n = o.bare ? 3 : 2; for (let i = 0; i < n; i++) { const nd = dir.clone().add(new THREE.Vector3((r() - 0.5) * 1.5, r() * 0.5, (r() - 0.5) * 1.5)).normalize(); branch(to, nd, len * (0.62 + r() * 0.15), rad * 0.6, depth - 1); } };
  for (let i = 0; i < 4; i++) { const a = (i / 4) * 6.283 + r(); branch(new THREE.Vector3(0, th * (0.8 + r() * 0.2), 0), new THREE.Vector3(Math.cos(a) * 0.75, 0.75, Math.sin(a) * 0.75).normalize(), H * 0.2, 0.11, o.bare ? 3 : 1); }
  if (!o.bare) { const geos = [], n = o.clumps || 34;
    for (let i = 0; i < n; i++) { const a = r() * 6.283, el = Math.acos(lerp(-0.35, 1, r())), rad = R * (0.35 + 0.65 * Math.cbrt(r())); const cx = Math.cos(a) * Math.sin(el) * rad, cy = H * 0.68 + Math.cos(el) * rad * 0.72, cz = Math.sin(a) * Math.sin(el) * rad, s = R * (0.3 + r() * 0.2);
      const ge = new THREE.IcosahedronGeometry(s, 3); const p = ge.attributes.position, col = new Float32Array(p.count * 3); const hue = r(), base = hue < 0.5 ? cols[0].clone().lerp(cols[1], hue * 2) : cols[1].clone().lerp(cols[2], (hue - 0.5) * 2);
      for (let k = 0; k < p.count; k++) { const x = p.getX(k), y = p.getY(k), z = p.getZ(k), nn = 1 + 0.16 * Math.sin(x * 3.1 / s + i) * Math.sin(y * 2.7 / s + i * 1.3) + 0.1 * Math.sin(z * 4.3 / s + x * 2 / s + i * 0.7); p.setXYZ(k, x * nn + cx, y * nn * 0.82 + cy, z * nn + cz); { const il = 1 / Math.hypot(x, y, z); ge.attributes.normal.setXYZ(k, x * il, y * il, z * il); }
        const sh = 0.7 + 0.42 * THREE.MathUtils.smoothstep((y / s) * 0.5 + 0.5 + (cy - H * 0.68) / (R * 1.6), 0.0, 1.0); col[k * 3] = base.r * sh; col[k * 3 + 1] = base.g * sh; col[k * 3 + 2] = base.b * sh; }
      ge.setAttribute('color', new THREE.BufferAttribute(col, 3)); geos.push(ge); }
    const merged = mergeGeometries(geos, false); geos.forEach(x => x.dispose()); const canopy = new THREE.Mesh(merged, mat('#ffffff', { vertexColors: true, rough: 0.9 })); canopy.castShadow = true; canopy.receiveShadow = true; g.add(canopy); g.canopy = canopy; }
  else if (o.snow) for (const t of tips) { const s = sphere(0.16 + r() * 0.1, mat('#f4f6ff', { rough: 0.8 }), t.x, t.y, t.z, 8, 6); s.scale.y = 0.5; g.add(s); }
  g.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  return g;
}
export function pine(o = {}) { const r = rng(o.seed || 2), H = o.h || 7, g = group(), c = new THREE.Color(o.color || '#2f5a48'); g.userData.dynamic = true; g.add(cyl(0.12, 0.2, H * 0.3, mat('#3a2a26', { rough: 0.95 }), 0, H * 0.15, 0, 7));
  const n = 5; for (let k = 0; k < n; k++) { const kk = k / (n - 1), rad = H * 0.3 * (1 - kk * 0.72), y = H * (0.22 + kk * 0.62); g.add(cone(rad, H * 0.3, mat(c.clone().multiplyScalar(0.8 + kk * 0.4), { rough: 0.9 }), 0, y + H * 0.1, 0, 10));
    if (o.snow) { const s = cone(rad * 0.86, H * 0.2, mat('#f4f6ff', { rough: 0.85 }), 0, y + H * 0.165, 0, 10); g.add(s); } }
  g.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); return g; }

// ---------------------------------------------------------------- street furniture
export function mailbox(o = {}) { const g = group(box(0.09, 1.05, 0.09, mat('#6a4a36', { rough: 0.9 }), 0, 0.52, 0)); const b = rbox(0.22, 0.24, 0.48, 0.09, mat(o.color || '#2a3038', { rough: 0.4, metal: 0.6 }), 0, 1.15, 0.05); g.add(b, box(0.02, 0.16, 0.06, mat('#d8342a'), 0.12, 1.24, 0.12)); if (o.snow) g.add(rbox(0.24, 0.07, 0.5, 0.03, mat('#f4f6ff'), 0, 1.3, 0.05)); return g; }
export function stopSign(o = {}) { const g = group(cyl(0.035, 0.035, 2.4, mat('#8a8e94', { metal: 0.7, rough: 0.4 }), 0, 1.2, 0, 6)); const f = cyl(0.38, 0.38, 0.03, mat('#c8202a', { rough: 0.5 }), 0, 2.25, 0.03, 8); f.rotation.set(R2, Math.PI / 8, 0); g.add(f);
  const t = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.26), new THREE.MeshStandardMaterial({ map: textTex(o.text || 'STOP', { w: 256, h: 110, size: 92, color: '#ffffff', font: 'Nunito', weight: 900 }), transparent: true, roughness: 0.5 })); t.position.set(0, 2.25, 0.05); g.add(t); return g; }
export function busStopSign() { const g = group(cyl(0.03, 0.03, 2.5, mat('#8a8e94', { metal: 0.7, rough: 0.4 }), 0, 1.25, 0, 6)); g.add(rbox(0.5, 0.62, 0.03, 0.04, mat('#f2c21a', { rough: 0.5 }), 0, 2.2, 0.03));
  const t = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.5), new THREE.MeshStandardMaterial({ map: textTex('SCHOOL\nBUS\nSTOP', { w: 256, h: 280, size: 62, color: '#1a1a1e', font: 'Nunito', weight: 900 }), transparent: true, roughness: 0.5 })); t.position.set(0, 2.2, 0.05); g.add(t); return g; }
export function powerPole(o = {}) { const h = o.h || 9, wd = mat('#4a3a30', { rough: 0.95 }); return group(cyl(0.11, 0.15, h, wd, 0, h / 2, 0, 8), box(0.1, 0.1, 2.2, wd, 0, h - 0.6, 0), box(0.08, 0.08, 1.6, wd, 0, h - 1.3, 0), cyl(0.16, 0.16, 0.5, mat('#7a7e86', { metal: 0.5, rough: 0.5 }), 0.25, h - 1.9, 0, 8)); }
export function lampUS(o = {}) { const h = o.h || 6.4, m = mat('#3a3e46', { metal: 0.6, rough: 0.45 }), g = group(cyl(0.07, 0.11, h, m, 0, h / 2, 0, 8)); const arm = cyl(0.04, 0.04, 2.0, m, 0, h - 0.1, 0.95, 6); arm.rotation.x = R2 - 0.12; g.add(arm, rbox(0.3, 0.12, 0.62, 0.05, m, 0, h + 0.0, 2.0));
  if (o.on) { const c = o.color || '#ffc888'; const b = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.03, 0.46), glowMat(c, 4)); b.position.set(0, h - 0.07, 2.0); g.add(b); const gl = glow(c, 3.4, 0.5); gl.position.set(0, h - 0.15, 2.0); g.add(gl); const lc = lightCone(3.0, h, c, o.cone ?? 0.045); lc.position.set(0, h - 0.05, 2.0); g.add(lc); g.head = [0, h - 0.1, 2.0]; }
  return g; }
function fence(x0, x1, z, o = {}) { const g = group(), m = mat(o.color || '#f2efe8', { rough: 0.8 }); const n = Math.round((x1 - x0) / 0.16); for (let i = 0; i <= n; i++) { const x = x0 + i * 0.16; g.add(box(0.09, 0.9, 0.025, m, x, 0.5, z)); const tip = cone(0.064, 0.1, m, x, 1.0, z, 4); tip.rotation.y = Math.PI / 4; tip.scale.z = 0.3; g.add(tip); } g.add(box(x1 - x0, 0.07, 0.04, m, (x0 + x1) / 2, 0.32, z - 0.03), box(x1 - x0, 0.07, 0.04, m, (x0 + x1) / 2, 0.76, z - 0.03)); g.traverse(q => { if (q.isMesh) q.castShadow = true; }); return g; }
export function waterTower(o = {}) { const g = group(), m = mat(o.color || '#dfe6ea', { rough: 0.5, metal: 0.2 }), H = 26; g.add(cyl(5, 5, 6, m, 0, H, 0, 20)); const top = cone(5.2, 2.2, m, 0, H + 4.1, 0, 20), bot = sphere(5, m, 0, H - 3, 0, 20, 10); bot.scale.y = 0.45; g.add(top, bot, cyl(0.6, 0.6, H - 4, m, 0, (H - 4) / 2, 0, 8));
  for (let i = 0; i < 6; i++) { const a = (i / 6) * 6.283; const leg = cyl(0.22, 0.22, H - 1, m, Math.cos(a) * 5.4, (H - 1) / 2, Math.sin(a) * 5.4, 6); leg.rotation.set(Math.sin(a) * -0.09, 0, Math.cos(a) * 0.09); g.add(leg); }
  const t = new THREE.Mesh(new THREE.CylinderGeometry(5.03, 5.03, 3, 20, 1, true, -0.9, 1.8), new THREE.MeshStandardMaterial({ map: textTex(o.text || 'MAPLE FALLS', { w: 1024, h: 256, size: 150, color: '#2a4a7a', font: 'Nunito', weight: 900 }), transparent: true, roughness: 0.6 })); t.position.y = H; g.add(t); return g; }
function wires(st, pts, sag = 0.7, offs = [-1, 0, 1]) { const m = new THREE.MeshBasicMaterial({ color: '#15131a' }); for (let i = 0; i + 1 < pts.length; i++) for (const dz of offs) { const a = new THREE.Vector3(pts[i][0], pts[i][1], pts[i][2] + dz), b = new THREE.Vector3(pts[i + 1][0], pts[i + 1][1], pts[i + 1][2] + dz), P = []; for (let k = 0; k <= 12; k++) { const q = k / 12, p = a.clone().lerp(b, q); p.y -= sag * 4 * q * (1 - q); P.push(p); } const t = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(P), 12, 0.018, 4), m); t.userData.dynamic = true; st.scene.add(t); } }

// ---------------------------------------------------------------- Maple Street: the American suburb
export function mapleStreet(st, o = {}) {
  st.outdoor = true; const season = o.season || 'fall', winter = season === 'winter', fall = season === 'fall', night = !!o.night, lit = o.lit ?? (night ? 0.75 : winter ? 0.8 : 0.3), r = rng(o.seed || 21), Lx = o.length || 150, add = (...a) => { a.forEach(x => x && st.scene.add(x)); return a[0]; };
  const leafCols = fall ? [['#a8381a', '#e07a24', '#f4b83a'], ['#8a2a1c', '#c8442a', '#ee8a3a'], ['#c88a1c', '#f0c23a', '#fbe07a'], ['#5a7a2a', '#a8a02a', '#e8c040']] : [['#2f6a34', '#4f9a44', '#8ac85a'], ['#2a5a3a', '#3f8a48', '#7ab85a']];
  const grassC = winter ? '#eef0fa' : fall ? '#7f9a48' : '#5fa04a', roadC = o.wet ? '#22242c' : '#4a4a52', walkC = winter ? '#e4e6f2' : '#b8b2a8';
  const R = (m, t, rx, ry) => tex(m, t, rx, ry), rec = (m) => { m.receiveShadow = true; m.castShadow = false; return m; };
  // ground layers
  const lawn = plane(Lx + 200, 320, R(mat('#ffffff', { rough: 0.95 }), lawnTex(grassC, fall ? ['#c8642a', '#e0a030', '#a8381a', '#e8c850'] : null), (Lx + 200) / 6, 320 / 6)); lawn.rotation.x = -R2; lawn.position.set(0, -0.02, -20); add(rec(lawn));
  const road = plane(Lx + 200, 8, R(mat('#ffffff', { rough: o.wet ? 0.18 : winter ? 0.8 : 0.9, metal: o.wet ? 0.25 : 0 }), roadTex(roadC, winter), (Lx + 200) / 16, 1)); road.rotation.x = -R2; road.position.set(0, 0.0, 5); add(rec(road));
  for (const z of [0, 11]) { add(rec(box(Lx + 200, 0.16, 2, R(mat('#ffffff', { rough: o.wet ? 0.45 : 0.9 }), walkTex(walkC), (Lx + 200) / 1.6, 1), 0, 0.08, z))); }
  for (const z of [1.08, 8.92]) add(box(Lx + 200, 0.18, 0.16, mat(winter ? '#eceef8' : '#c8c2b8', { rough: 0.85 }), 0, 0.09, z));
  if (winter) for (const z of [1.5, 8.5]) { const bank = box(Lx + 200, 0.34, 0.9, mat('#f2f4ff', { rough: 0.85 }), 0, 0.12, z); add(bank); }
  // houses: near row faces +z, far row faces -z
  const palette = [['#e9e3d2', '#f6f2ea', '#4a4448'], ['#9fb6c8', '#f6f2ea', '#3a4250'], ['#d9c58a', '#fbf6e8', '#5a4038'], ['#b8c8a8', '#f6f2ea', '#4a4a44'], ['#c8847a', '#f6eee4', '#3a3438'], ['#f2efe8', '#2a3038', '#2a2e36'], ['#8a9aa8', '#eef0f0', '#2e3238'], ['#e8d8c0', '#7a2a24', '#5a3a30']];
  const houses = [], xmasRuns = [];
  const row = (z, ry, seed0, gap) => { let x = -Lx / 2; let i = 0; while (x < Lx / 2) { const p = palette[(seed0 + i * 3) % palette.length], side = [1, -1, 0, 1, -1][(i + seed0) % 5], w = 8.5 + ((i * 7 + seed0) % 3);
      const hs = usHouse({ w, color: p[0], trim: p[1], roof: p[2], garage: side, seed: seed0 * 13 + i, lit, snow: winter, pumpkins: fall, xmas: winter, floors: (i + seed0) % 3 === 0 ? 1 : 2 }); const cx = x + (side < 0 ? 4.4 : 0) + w / 2;
      put(hs, cx, 0, z, ry); add(hs); houses.push(hs); hs.cx = cx;
      const s = ry ? -1 : 1, fz = z + s * 4;   // front wall z
      // front walk + driveway
      add(rec(box(1.2, 0.05, Math.abs(fz - (ry ? 12 : -1)) - 2.2, mat(walkC, { rough: 0.9 }), cx + s * (hs.children.length ? 0 : 0) - s * side * w * 0.12, 0.02, (fz + s * 2.2 + (ry ? 12 : -1)) / 2)));
      if (side) add(rec(box(3.6, 0.05, Math.abs(fz - (ry ? 9 : 1)), mat(winter ? '#dfe2ee' : '#8f8a84', { rough: 0.9 }), cx + s * hs.driveX, 0.02, (fz + (ry ? 9 : 1)) / 2)));
      if (hs.xmas) xmasRuns.push(hs.xmas.map(([px, py, pz]) => [cx + s * px, py, z + s * pz]));
      // hedges and a yard tree
      for (const hx of [-w * 0.3, w * 0.3]) { const hd = rbox(2.2, 0.7, 0.8, 0.3, mat(winter ? '#e8ecf8' : '#3f6a3a', { rough: 0.95 }), cx + hx, 0.5, fz + s * 0.7); hd.castShadow = true; add(hd); }
      x += w + (side ? 4.4 : 0) + gap + ((i * 5) % 3); i++; } };
  row(-11, 0, 1, 4.5); row(22, Math.PI, 4, 5);
  // street trees: a row on each verge (the vanishing line), plus yard trees
  const trees = [];
  for (let x = -Lx / 2 + 4; x < Lx / 2; x += 13) for (const [z, sd] of [[-2.6, 1], [13.6, 2]]) { const k = Math.round(x * 7 + sd * 31), cols = leafCols[Math.abs(k) % leafCols.length];
    const t = winter ? maple({ bare: true, snow: true, h: 7 + (Math.abs(k) % 3), seed: Math.abs(k) + 1 }) : maple({ colors: cols, h: 7.5 + (Math.abs(k) % 3) * 0.8, r: 3.1 + (Math.abs(k) % 4) * 0.25, seed: Math.abs(k) + 1 });
    put(t, x + ((Math.abs(k) % 5) - 2) * 0.5, 0, z + ((Math.abs(k) % 3) - 1) * 0.3, (Math.abs(k) % 7)); add(t); trees.push(t); }
  for (let i = 0; i < 9; i++) { const x = -Lx / 2 + 10 + i * 17, t = (i % 3 === 1 || winter) ? pine({ h: 8 + (i % 3) * 2, snow: winter, seed: i + 2 }) : maple({ colors: leafCols[(i + 1) % leafCols.length], h: 10 + (i % 3), r: 4.2, seed: 40 + i, clumps: 40 }); put(t, x, 0, -19 - (i % 3) * 3); add(t); }
  // far layers: a tree line, hills, a water tower
  for (let i = 0; i < 46; i++) { const x = -150 + i * 6.8 + r() * 3, z = -42 - r() * 16, big = 9 + r() * 7, cols = leafCols[(i * 3) % leafCols.length];
    const t = winter ? pine({ h: big, snow: true, seed: i + 60, color: '#2a4a48' }) : (i % 4 === 0 ? pine({ h: big * 1.1, seed: i + 60 }) : maple({ colors: cols, h: big, r: big * 0.42, seed: 80 + i, clumps: 14 })); put(t, x, 0, z); add(t); }
  const hillC = winter ? ['#cfd6f0', '#b8c2e6', '#a0acd8'] : fall ? ['#8a7a4a', '#9a6a44', '#7a7a6a'] : ['#5a8a4a', '#4a7a4a', '#5a7a6a'];
  for (let i = 0; i < 9; i++) { const hsp = sphere(1, mat(hillC[i % 3], { rough: 1 }), -220 + i * 55 + r() * 20, -6, -110 - (i % 3) * 45, 24, 12); hsp.scale.set(60 + r() * 30, 22 + r() * 16, 40); hsp.castShadow = false; add(hsp); }
  const wt = waterTower({ text: o.town || 'MAPLE FALLS' }); put(wt, o.towerX ?? 34, 0, -64, 0.3); add(wt);
  // power poles and wires along the far verge
  const pp = []; for (let x = -Lx / 2; x <= Lx / 2; x += 24) { const p = powerPole({}); put(p, x, 0, 14.6); add(p); pp.push([x, 8.4, 14.6]); } wires(st, pp, 0.8);
  // street furniture
  const lamps = []; for (let x = 6 - 26 * 3; x < Lx / 2; x += 26) { const l = lampUS({ on: night || winter || o.lamps, color: o.lampColor }); put(l, x, 0, -1.3); l.userData.dynamic = true; add(l); lamps.push(l); }
  for (const h of houses) { if (Math.abs(h.cx - (h.rotation.y ? -1 : 1) * 2.6) < (o.clear ?? 5)) continue; const s = h.rotation.y ? -1 : 1; const mb = mailbox({ snow: winter }); put(mb, h.cx - s * 2.6, 0, s > 0 ? -1.25 + 2.0 : 9.6, s > 0 ? R2 : -R2); mb.traverse(q => { if (q.isMesh) q.castShadow = true; }); add(mb); }
  add(put(fence(-9.5, -3.2, -1.6), 0, 0, 0)); add(put(fence(3.4, 9.2, -1.6), 0, 0, 0));
  const hyd = group(cyl(0.13, 0.15, 0.6, mat('#c8302a', { rough: 0.45, clearcoat: 0.5 }), 0, 0.3, 0), sphere(0.13, mat('#c8302a', { rough: 0.45 }), 0, 0.62, 0), cyl(0.05, 0.05, 0.42, mat('#c8302a'), 0, 0.42, 0)); hyd.children[2].rotation.z = R2; put(hyd, 5.4, 0.16, 0.55); hyd.traverse(q => { if (q.isMesh) q.castShadow = true; }); add(hyd);
  const sign = stopSign(); put(sign, -14, 0.16, 0.6, R2); add(sign);
  return { houses, trees, lamps, xmasRuns, season, leafCols };
}
