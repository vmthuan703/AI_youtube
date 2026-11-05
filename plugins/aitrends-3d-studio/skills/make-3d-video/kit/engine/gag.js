// engine/gag.js — the mid-video subscribe gag: the channel's hero leans in from the frame edge, holds up a button, presses it,
// winks and leaves. No narration. It runs across cuts, so it lives outside the shots, with its own small transparent 3D canvas.
//   config.json: "subscribeGag": { "enabled": true, "at": 90, "dur": 5, "label": "SUBSCRIBE", "done": "SUBSCRIBED" }
// The outfit comes from channel/cast.js (HERO). audio/mix.py adds the pop and click cues from the same settings.
import { E, clamp, ease, prog, lerp } from './core.js';
import { pill, pillWidth } from './ui2d.js';

let G = null, three = null, make = null, cfg = null, outfit = null;
const LW = 620, LH = 880;   // logical size of the gag canvas, anchored bottom-right

export async function prepareGag(t3, mk) {
  cfg = E.cfg.subscribeGag; if (!cfg || !cfg.enabled || E.vertical) { cfg = null; return; }
  make = mk; three = t3 || await import('./kit3d.js');
  try { outfit = (await import('/channel/cast.js')).HERO; } catch { outfit = null; }
  outfit = outfit || { top: 'puffer', color: '#b4f02e', color2: '#6fae1e', hair: 'anime', hairColor: '#e8ecf6', hairShade: '#6f7fb8' };
}

function setup() {
  const { THREE } = three, w = Math.round(LW * E.PX), h = Math.round(LH * E.PX), canvas = make(w, h);
  const r = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  r.setPixelRatio(1); r.setSize(w, h, false); r.setClearColor(0x000000, 0); r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05; r.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene(); scene.add(new THREE.HemisphereLight(0xfff0f0, 0x8a78a8, 1.9));
  const key = new THREE.DirectionalLight(0xfff0dc, 1.7); key.position.set(-3, 4, 6); scene.add(key);
  const back = new THREE.DirectionalLight(0xffd8c0, 0.9); back.position.set(3, 3, -5); scene.add(back);
  const camera = new THREE.PerspectiveCamera(22, LW / LH, 0.1, 50); camera.position.set(0, 1.02, 6.1); camera.lookAt(0, 1.02, 0);
  const hero = three.character(outfit, { seed: 3 }); scene.add(hero);
  G = { r, canvas, scene, camera, hero, v: new THREE.Vector3() };
}

// t = global time. Pure function of t, like every shot.
export function drawGag(mg, t) {
  if (!cfg) return; const at = cfg.at ?? 90, dur = cfg.dur ?? 5, lt = t - at; if (lt < 0 || lt > dur) return;
  if (!G) setup();
  const { hero, camera, r, scene, canvas, v } = G;
  const inK = ease.outBack(prog(lt, 0, 0.45)), outK = ease.in(prog(lt, dur - 0.5, dur)), press = ease.inOut(prog(lt, 1.7, 2.05)) * (1 - ease.inOut(prog(lt, 2.2, 2.55))), done = lt >= 2.05;
  const reach = ease.out(prog(lt, 0.25, 0.65));
  // character space: viewer's left is the hero's right hand (-x). The right hand holds the button out, the left comes across to press it.
  const holdX = lerp(-0.1, -0.5, reach), holdY = lerp(0.72, 1.0, reach);
  hero.place(lerp(1.5, 0.42, inK) + 1.2 * outK, -0.42, 0, -0.34);
  hero.pose({ ...three.POSES3.relaxed, spine: [2, -6, 7], head: [0, -8, -7],
    armR: { to: [holdX, holdY, 0.26] }, handR: 'open',
    armL: done && press < 0.05 ? [8, 18, 14, 0] : { to: [lerp(0.22, holdX + 0.05, press), lerp(0.62, holdY + 0.02, press), lerp(0.1, 0.38, press)] }, handL: press > 0.2 ? 'point' : 'relaxed' });
  hero.face({ expr: done ? 'happy' : 'smile', t, blink: true, look: done ? [0, 0] : [-0.5, 0.1] });
  r.render(scene, camera);
  const px = E.W - LW, py = E.H - LH, hand = hero.handWorld('R'); hand.project(camera);
  const hx = px + ((hand.x + 1) / 2) * LW, hy = py + ((1 - hand.y) / 2) * LH;
  // the button sits in the hand, under the hero's fingers
  mg.save(); mg.setTransform(E.PX, 0, 0, E.PX, 0, 0);
  const label = done ? (cfg.done || 'SUBSCRIBED') : (cfg.label || 'SUBSCRIBE');
  const icon = done ? 'check' : null;
  pill(mg, { str: label, x: hx - 24 - pillWidth(mg, label, 38, icon) / 2, y: hy + 6, size: 38, icon, t: lt, start: 0.3, a: clamp(1 - outK * 3), bg: done ? 'rgba(96,92,110,.95)' : '#d81e3f', line: 'rgba(255,255,255,.4)', color: '#ffffff' });
  mg.restore();
  mg.save(); mg.setTransform(1, 0, 0, 1, 0, 0); mg.drawImage(canvas, Math.round(px * E.PX), Math.round(py * E.PX)); mg.restore();
}
