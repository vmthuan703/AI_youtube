// engine/ink/auto.js — Ink Pastel table-driven shots: a place + a blocking (who stands where doing what) + a framing + HUD pills.
// Built on the pilot (228 shots, most of them one auto() line). Usage in a project's scenes/shots/*.js:
//   import { auto, BLOCK, CAST, PILL } from '/engine/ink/auto.js';  import * as C from '../cast.js';
//   Object.assign(CAST, C); Object.assign(PILL, { MOM: '17 YEARS' });
//   BLOCK.arrive = { HERO: { at: [0, 2], yaw: Math.PI }, MOM: { at: [-1, -1], pose: 'sit', expr: 'tired' } };
//   auto('s045', { block: 'arrive', a: 'MOM', cam: 'medium', expr: { MOM: 'surprised' } });
// Fields (all optional; place/look/cam default from shots.json set/look/camera):
//   place: key of PLACES · block: name in BLOCK · cast: { ROLE: {...} | null } adds/overrides/removes roles · only: [roles] keeps just these
//   a / b: subject roles (or [x,y,z]) · cam: camShot name | 'hud' | keys [[t,{pos,look}],..] | fn(s,t,info,T) · side, yaw, dist, fov, at
//   pose / expr / look2: { ROLE: pose | [[t, pose], ..] } · pills: { ROLE: text | fn(info,t) | null } · red: [roles] · pillSize · hide: [roles]
//   card: true | {k, tint, scan} draws the sepia flashback look · init(s,T,info) / act(s,t,info,T) / overlay(g,t,info,s): extra per shot
//   blocking entry: { at: [x, z], y, yaw, pose, expr, look, o: outfit, oneArm: true }
// Rule R05: face({ gt }) opens a mouth only for the role whose speaker name owns the line. Rule R04: close framings lift the camera
// so the subject's pill stays inside the frame; xcu hides the subject's pill; tight framings show only a's and b's pills.
import { E, V, registerShot, getShot } from '/engine/core.js';
import { clockAt, headPill, sepia } from './hud.js';
import * as SETS from './sets.js';
export { sepia };

// hide a character's left forearm and hand (an arm lost in the story); needs the rig's root.limbs (rig3d.js)
export function oneArm(ch) { for (const k of ['loL', 'cuffL']) if (ch.limbs?.[k]) ch.limbs[k].visible = false; const h = ch.parts?.hands?.L; if (h?.g) h.g.visible = false; else if (h) h.visible = false; return ch; }

const FRAMING = { wide: 'wide', med: 'medium', cu: 'closeup', xcu: 'xcu', insert: 'insert', low: 'lowHero', track: 'track', ots: 'ots', hud: 'hud', top: 'high', pov: 'medium' };
const MOOD = { inkWarm: 'interiorWarm', inkDark: 'night', inkRuin: 'storm', inkDay: 'day' };
export const PLACES = {   // set name in shots.json -> builder; a project adds its own: PLACES.LAB = (T, st) => myLab(T, st)
  RUIN: (T, st) => SETS.ruins(T, st, {}), FIELD: (T, st) => SETS.ruins(T, st, {}),
  BUNKER: (T, st) => SETS.bunker(T, st, {}), BUNKER_N: (T, st) => SETS.bunker(T, st, { night: true }),
  SEWER: (T, st) => SETS.sewer(T, st), PARK: (T, st) => SETS.park(T, st, {}), CTRL: (T, st) => SETS.ctrl(T, st, {}),
  DOOR_N: (T, st) => SETS.doorN(T, st, {}), SKY: (T, st) => SETS.sky(T, st, {}),
};
// default pill text per role (shots override with pills: {...}); HERO never shows one (the hero can't see their own)
export const PILL = {};   // the project fills it: Object.assign(PILL, { MOM: '17 YEARS 4 MONTHS', ... })
export const CAST = {};   // role -> outfit; the project fills it: Object.assign(CAST, { HERO, MOM, ... }) from its scenes/cast.js
export const BLOCK = {};   // filled by the shot files: BLOCK.arrive = { ROLE: { at: [x, z], yaw, y, pose, expr, look, o } }

const outfitOf = (role, b) => b.o || CAST[role] || null;
const pick = (v, t) => Array.isArray(v) ? v : v;
const subj = (s, a) => (a == null ? null : typeof a === 'string' ? s.ch[a] : a);

export function auto(id, sp = {}) {
  registerShot(id, {
    mblur: sp.mblur, qcIgnore: sp.qcIgnore,
    init(T, info) {
      const sh = info.shot, look = sp.look || sh.look || 'inkWarm';
      const st = T.stage({ mood: MOOD[look] || 'night', fov: sp.fov || V(34, 50), look });
      const s = { st, ch: {}, b: {}, sp };
      const mk = PLACES[sp.place || sh.set]; if (!mk) throw new Error(`no place "${sp.place || sh.set}": pass place: (a PLACES key) for 2D/CARD shots, or add PLACES.${sh.set}`);
      s.set = mk(T, st);
      let blk = { ...(BLOCK[sp.block] || {}) };
      for (const [k, v] of Object.entries(sp.cast || {})) blk[k] = v === null ? null : { ...(blk[k] || {}), ...v };
      if (sp.only) blk = Object.fromEntries(Object.entries(blk).filter(([k]) => sp.only.includes(k)));
      for (const [role, b] of Object.entries(blk)) { if (!b) continue; const o = outfitOf(role, b); if (!o) continue;
        const ch = st.add(T.character(o).place(b.at[0], b.y || 0, b.at[1], b.yaw || 0)); if (b.oneArm) oneArm(ch); s.ch[role] = ch; s.b[role] = b; }
      sp.init?.(s, T, info);
      return s;
    },
    draw(s, t, info, T) {
      const sh = info.shot, cam = s.st.camera; s.set.update?.(sh.start + t);
      let i = 0;
      for (const [role, ch] of Object.entries(s.ch)) { const b = s.b[role]; i++;
        const p = sp.pose?.[role] ?? b.pose ?? 'stand', e = sp.expr?.[role] ?? b.expr ?? 'neutral';
        ch.pose(Array.isArray(p) ? T.posesAt3(t, p) : T.breathe3(p, t + i * 0.7, 1, i));
        ch.face({ expr: Array.isArray(e) ? T.exprAt(t, e) : e, t: t + i * 0.37, blink: true, look: sp.look2?.[role] ?? b.look ?? [0, 0], gt: info.globalT });
      }
      sp.act?.(s, t, info, T);
      // framing
      const A = subj(s, sp.a), name = typeof sp.cam === 'string' ? sp.cam : FRAMING[sh.camera] || 'medium';
      if (typeof sp.cam === 'function') sp.cam(s, t, info, T);
      else if (Array.isArray(sp.cam)) T.dolly(cam, t, sp.cam.map(([k, v]) => [k === 'end' ? info.dur : k, v]));
      else if (name === 'hud' && A) { const h = A.headWorld(), sd = sp.side ?? 1, k = Math.min(1, t / info.dur), d = 2.1 - 0.6 * k, yw = A.rotation.y + sd * 0.45 + (sp.yaw ?? 0);
        cam.position.set(h.x + Math.sin(yw) * d, h.y + 0.12, h.z + Math.cos(yw) * d); cam.lookAt(h.x, h.y + 0.42, h.z); }
      else { T.camShot(cam, t, name, { a: A || sp.at, b: subj(s, sp.b), dur: info.dur, side: sp.side, yaw: sp.yaw, dist: (sp.dist ?? 1) * (this.pillOn(s, sp.a) ? { closeup: 1.25, medium: 1.15 }[name] || 1 : 1), fov: sp.fov2, at: sp.at });
        if (A?.headWorld && this.pillOn(s, sp.a) && (name === 'closeup' || name === 'medium')) { const h = A.headWorld(); cam.lookAt(h.x, h.y + (name === 'closeup' ? 0.2 : -0.12), h.z); } }
      if (A?.headWorld && /closeup|xcu|hud/.test(name)) s.st.focusOn?.(A.headWorld());
      // pills: measure every visible role's head after the camera is set
      for (const role of Object.keys(s.ch)) if (this.pillText(s, role, info, t) != null) clockAt(T, s, s.ch[role], cam, 'p_' + role, 0.62 * (s.ch[role].scale?.y || 1));
    },
    pillOn(s, role) { return typeof role === 'string' && role !== 'HERO' && (sp.pills?.[role] !== undefined ? sp.pills[role] !== null : PILL[role] != null) && !(sp.hide || []).includes(role); },
    pillText(s, role, info, t) { if (!this.pillOn(s, role)) return null; if (role === sp.a && (info.shot.camera === 'xcu' || sp.cam === 'xcu')) return null;
      const fr = typeof sp.cam === 'string' ? sp.cam : sp.cam == null ? FRAMING[info.shot.camera] : null;   // tight framings show only the subject's (and b's) pill:
      if (sp.a && role !== sp.a && sp.pills?.[role] === undefined && (fr === 'hud' || (role !== sp.b && /closeup|medium|xcu|lowHero|ots/.test(fr || '')))) return null;   // far pills land on near bodies
      const v = sp.pills?.[role] !== undefined ? sp.pills[role] : PILL[role]; return typeof v === 'function' ? v(info, t) : v; },
    overlay(g, t, info, s) {
      if (sp.card) sepia(g, t, sp.card === true ? {} : sp.card);
      for (const role of Object.keys(s.ch)) { const txt = this.pillText(s, role, info, t); if (txt == null) continue;
        const big = role === sp.a && (info.shot.camera === 'hud' || sp.cam === 'hud');
        headPill(g, s['p_' + role], txt, { red: (sp.red || []).includes(role), size: big ? 48 : (sp.pillSize ?? 34) }); }
      sp.overlay?.(g, t, info, s);
    },
  });
}
export const has = (id) => !!getShot(id);
