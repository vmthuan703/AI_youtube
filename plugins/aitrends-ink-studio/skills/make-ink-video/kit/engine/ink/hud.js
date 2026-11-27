// engine/ink/hud.js — Ink Pastel overlays (2D, drawn in a shot's overlay(g, t, info, s)):
//   clockAt(T, s, ch, cam, key, lift)  store a head's screen position after the camera is set (call in draw)
//   pill(g, x, y, text, {size, red})   the white HUD pill with a tail · headPill(g, s[key], text, o) sized by distance
//   hms(sec) -> '00:00:47' · lids(g, t, t0, dur) eyelids opening from black · sepia(g, t, {k, tint, scan}) flashback card look
import { E } from '/engine/core.js';

// ---------------------------------------------------------------- the life clock over a head
// Reference device: a white pill with a little tail under it, dark digits, sitting over every head. `red` for the last seconds.
export function clockAt(T, s, ch, cam, key = 'clk', lift = 0.62) {
  cam.updateMatrixWorld(); const p = ch.headWorld().add(new T.THREE.Vector3(0, lift, 0)); const v = p.clone().project(cam);
  s[key] = v.z < 1 ? [(v.x * 0.5 + 0.5) * E.W, (1 - (v.y * 0.5 + 0.5)) * E.H, p.distanceTo(cam.position)] : null;
}
export function pill(g, x, y, str, o = {}) {
  const size = o.size ?? 34, pad = size * 0.55, red = !!o.red;
  g.save(); g.font = `700 ${size}px Nunito, Fredoka, sans-serif`; const w = g.measureText(str).width + pad * 2, h = size * 1.45;
  const x0 = x - w / 2, y0 = y - h; g.lineWidth = Math.max(2, size * 0.1); g.strokeStyle = '#1c1830';
  g.fillStyle = red ? '#ff5a5a' : '#fbf8f4';
  g.beginPath(); g.roundRect(x0, y0, w, h, h / 2); g.moveTo(x - size * 0.22, y0 + h - 1); g.lineTo(x, y0 + h + size * 0.32); g.lineTo(x + size * 0.22, y0 + h - 1);
  g.fill(); g.stroke(); g.fillStyle = red ? '#fff' : '#1c1830'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(str, x, y0 + h / 2 + size * 0.04); g.restore();
}
// a pill drawn at a stored head position, sized by distance (far heads get small pills, never under the readable floor)
export function headPill(g, at, str, o = {}) { if (!at) return; const [x, y, d] = at; const size = Math.max(20, Math.min(70, (o.size ?? 38) * 4.2 / Math.max(1.5, d))); pill(g, x, y, str, { ...o, size }); }

// "00:00:47" from seconds
export const hms = (sec) => { const s = Math.max(0, Math.floor(sec)); const p = (n) => String(n).padStart(2, '0'); return `${p(Math.floor(s / 3600))}:${p(Math.floor(s / 60) % 60)}:${p(s % 60)}`; };

// eyelids opening from black (POV wake-up): two soft dark lids that part over `dur` seconds
export function lids(g, t, t0, dur) {
  const k = Math.min(1, Math.max(0, (t - t0) / dur)), e = k * k * (3 - 2 * k), open = e * E.H * 0.62;
  g.save(); g.fillStyle = '#05040a';
  g.beginPath(); g.ellipse(E.W / 2, -E.H * 0.1 - open * 0.55, E.W * 0.9, E.H * 0.62, 0, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.ellipse(E.W / 2, E.H * 1.1 + open * 0.55, E.W * 0.9, E.H * 0.62, 0, 0, Math.PI * 2); g.fill(); g.restore();
}

// sepia flashback card look, drawn over the 3D frame (overlay runs after the 3D image is in the canvas): sepia tone, paper, vignette, frame
export function sepia(g, t, o = {}) {
  const W = E.W, H = E.H, k = o.k ?? 0.92;
  g.save(); g.globalCompositeOperation = 'color'; g.globalAlpha = k; g.fillStyle = o.tint || '#a8794a'; g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'multiply'; g.globalAlpha = 1; g.fillStyle = '#f3e2c4'; g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'source-over'; const vg = g.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95); vg.addColorStop(0, 'rgba(40,24,10,0)'); vg.addColorStop(1, 'rgba(40,24,10,0.55)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
  g.globalAlpha = 0.07 + 0.03 * Math.sin(t * 23); g.fillStyle = '#2a1a0a'; for (let i = 0; i < 9; i++) { const x = ((i * 397 + Math.floor(t * 8) * 131) % W); g.fillRect(x, 0, 1.5, H); }   // film scratches
  g.globalAlpha = 1; g.lineWidth = 26; g.strokeStyle = '#efe2c8'; g.strokeRect(13, 13, W - 26, H - 26); g.lineWidth = 3; g.strokeStyle = '#5a3e22'; g.strokeRect(30, 30, W - 60, H - 60);
  if (o.scan) { g.globalAlpha = 0.12; g.fillStyle = '#1a1008'; for (let y = 0; y < H; y += 6) g.fillRect(0, y, W, 2); }   // old-anime scanlines
  g.restore();
}
