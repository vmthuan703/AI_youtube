// engine/templates3d.js — 2.3 shot templates: every ROUTINE shot of a video is one data line instead of a hand-written file.
// A project writes scenes/_places.js once (places with stand spots, cast ids, props, effects) and gets back shotT(id, tpl);
// tools/gen_shots.py turns story/tpl_spec.py into scenes/shots/auto_<place>.js (one shotT call per routine shot).
// Special shots (blasts, rescues, hands on props, diagrams, the hook, the climax, reveals) stay hand-written and import the
// same PLACES / CAST from ../_places.js, so auto and manual shots of a place use the same set build (continuity).
//
//   import { makeTemplates } from '/engine/templates3d.js';
//   export const { shotT, PLACES, CAST, EXPR, who } = makeTemplates({ places, cast, crowd, expr, props, fx, glow, bed, hero, heroExpr, indoor, rec });
//
// tpl = { kind, place, setOpts, fx, cast: [castSpec], a, b, cam, side, dist, fov, focus, at, crash, punch, prop, label, pills, heading, title, rec, items }
//   kind  : establish | wide | dialogue | reaction | xcu | insert | walk | stage   (all share one builder; kind picks the camera default)
//   place : a key of places ('stage' is the purple explainer stage, built in when the project has none)
//   cast  : [{ id, at: 'A' | [x, z, yaw], y, sit, pose: 'stand' | [[t, pose], …], expr: 'sad' | [[t, expr], …], glow: k | [[t, k], …],
//             face: '<id>' (turn toward), walk: { from: [x, z], to: [x, z], t0, t1, run }, turn: [[t, yaw], …], bed: true, hold: propSpec,
//             talk: false, still: true, lookFixed: true }]
//   cam   : engine camShot name (establish craneDown craneUp wide full medium twoShot ots orbit closeup pushIn xcu insert track lowHero high …)
//   prop  : { name: <key of props>, on: '<id>', hand: 'R', wrist: true, at: [x, y, z], yaw, rot, scale, opts }
//   pills : [{ str, at, word, x, y, gold, icon, size, end, count }]   items: [{ kind: meter|icon|tag, … }]   label / heading / title / rec
// Shot non-negotiables (render-qc.md) handled here: a camera move every shot, feet on the place's floor y (place.y or place.yAt),
// ≤ 5 lights (only the first glowing character may own a real light), dof only from camShot close framings, draw() pure in t,
// dust indoors, the shot's look/weather from shots.json (applied by the stage).
import { E, V, registerShot, ease, clamp, lerp, wordTime, text } from './core.js';
import * as UI from './ui2d.js';
import * as D from './diagrams2d.js';

const NIGHT = /night|rain|dusk/i;
const STAGE = { y: 0, focus: [0, 1.0, 0], spots: { A: [-1.2, 0.3, 0.15], B: [1.2, 0.3, -0.15], C: [0, 0.3, 0], L1: [-2.4, 0.3, 0.1], L2: [-0.8, 0.3, 0], L3: [0.8, 0.3, 0], L4: [2.4, 0.3, -0.1] },
  build(T, st) { return T.W.explainer(st, {}); } };

// keyframes [[t, v], …] → eased value at t (a number passes through)
export function val(spec, t, d = 0) {
  if (spec == null) return d;
  if (typeof spec === 'function') return spec(t);
  if (Array.isArray(spec)) {
    if (!spec.length) return d; if (t <= spec[0][0]) return spec[0][1];
    for (let i = 1; i < spec.length; i++) if (t < spec[i][0]) { const [a, va] = spec[i - 1], [b, vb] = spec[i]; return lerp(va, vb, ease.inOut(clamp((t - a) / Math.max(1e-6, b - a)))); }
    return spec[spec.length - 1][1];
  }
  return spec;
}

export function makeTemplates(cfg = {}) {
  const PLACES = cfg.places || {}; if (!PLACES.stage) PLACES.stage = STAGE;
  const CAST = { ...(cfg.cast || {}) }, crowd = cfg.crowd || [];
  crowd.forEach((c, i) => { if (!CAST['X' + (i + 1)]) CAST['X' + (i + 1)] = c; });
  const who = (id) => { const r = CAST[id] || (crowd.length ? crowd[(parseInt(String(id).slice(1), 10) || 1) % crowd.length] : null);
    if (!r) throw new Error(`templates3d: unknown cast id ${id} (add it to cast: in scenes/_places.js)`); return r; };
  const EXPR = { ...(cfg.expr || {}) };
  const xp = (e, dflt) => (Array.isArray(e) ? e.map(([a, b]) => [a, EXPR[b] || b]) : EXPR[e] || e || dflt);
  const PROPS = cfg.props || {}, FX = cfg.fx || {}, HERO = cfg.hero || null, HERO_EXPR = cfg.heroExpr || 'neutral';
  const INDOOR = new Set(cfg.indoor || Object.keys(PLACES).filter((k) => PLACES[k].indoor));
  const FX_ORDER = [...new Set(['smoke', ...Object.keys(FX)])].filter((k) => k !== 'dust');
  const REC = { cam: 'CAM 03', clock: [22, 7, 0], ...(cfg.rec || {}) };

  function makeProp(T, st, p) {
    const mk = PROPS[p.name]; if (!mk) throw new Error(`templates3d: unknown prop ${p.name} (add it to props: in scenes/_places.js)`);
    const obj = mk(T, p.opts || {}); if (p.scale) obj.scale.setScalar(p.scale); obj.userData.dynamic = true; return obj;
  }
  function spot(pl, at) { if (Array.isArray(at)) return [at[0], at[1], at[2] ?? 0]; return pl.spots[at] || pl.spots.A; }

  function build(id, tpl) {
    registerShot(id, {
      init(T, info) {
        const pl = PLACES[tpl.place]; if (!pl) throw new Error('templates3d: unknown place ' + tpl.place);
        const sh = info.shot || {}, night = NIGHT.test(sh.look || '') || sh.look == null && !!pl.nightByDefault;
        const st = T.stage({ mood: tpl.place === 'stage' ? 'night' : night ? 'night' : 'day', fov: V(36, 50) });
        const set = pl.build.call(pl, T, st, tpl.setOpts || {}, sh) || {};
        const s = { st, set, pl, c: {}, specs: [], props: [] };
        let lit = false;
        (tpl.cast || []).forEach((cs, i) => {
          const w0 = cs.walk, [x, z, yaw] = spot(pl, w0 ? w0.from.concat([w0.yaw0 ?? Math.atan2(w0.to[0] - w0.from[0], w0.to[1] - w0.from[1])]) : cs.at);   // walkers start facing their way
          const y = cs.y ?? (cs.sit && pl.seatY != null ? pl.seatY : pl.yAt ? pl.yAt(x, z) : pl.y);
          const ch = T.character(who(cs.id), { seed: i + 3 }).place(x, y, z, yaw); st.add(ch);
          if (cs.bed) { if (!cfg.bed || !set.bedTop) throw new Error(`templates3d: ${id} puts ${cs.id} in bed, but the place has no bedTop or _places.js has no bed:`); cfg.bed.place(ch, set.bedTop); }
          s.c[cs.id] = ch; s.specs.push(cs);
          if (cs.glow != null && cfg.glow) {   // close framings and flashbacks bloom white at full glow: scale k down there
            const sc = (/closeup|xcu|insert|pushIn|ots/.test(tpl.cam || '') ? 0.55 : 1) * (sh.look === 'flashback' ? 0.5 : 1), g0 = cs.glow;
            const k = sc === 1 ? g0 : typeof g0 === 'number' ? g0 * sc : g0.map(([a, v]) => [a, v * sc]);
            cfg.glow(T, st, ch, { k, light: !lit, seed: i + 1 }); lit = true; }
          if (cs.hold) { const o = makeProp(T, st, cs.hold); if (cs.hold.wrist) st.add(o); else ch.hold(o, cs.hold.hand || 'R', { rot: cs.hold.rot || [0, 0, 0] }); s.props.push([o, cs.hold, ch]); }
        });
        (tpl.cast || []).forEach((cs) => { if (cs.face && s.c[cs.face] && !cs.walk) { const o = s.c[cs.face].position; s.c[cs.id].faceTo(o.x, o.z); } });
        if (tpl.prop) { const p = tpl.prop, o = makeProp(T, st, p); const host = p.on && s.c[p.on];
          if (host && !p.wrist) host.hold(o, p.hand || 'R', { rot: p.rot || [0, 0, 0] }); else { st.add(o); if (p.at) { o.position.set(...p.at); o.rotation.y = p.yaw || 0; } }
          s.prop = o; s.props.push([o, p, host]); }
        // establish on a walker: aim at where the subject STARTS (a live target made the smart camera jump mid-shot)
        if (tpl.a && s.c[tpl.a]) { const q = s.c[tpl.a].position; s.a0 = [q.x, q.y + 1.4, q.z]; }
        const fx = new Set(tpl.fx || []);
        for (const name of FX_ORDER) if (fx.has(name)) {
          if (FX[name]) FX[name](T, st, s, tpl, sh);
          else if (name === 'smoke') T.FX3.smoke(st, { pos: pl.smokeAt || [0, 1.6, -4], t0: -6, dur: 99, rate: 5, size: 1.3, grow: 2.4, rise: 1.0, color: '#26262c', opacity: 0.7 });
        }
        for (const name of fx) if (name !== 'dust' && !FX_ORDER.includes(name)) console.log(`[templates3d] ${id}: unknown fx ${name} (add it to fx: in scenes/_places.js)`);
        if (INDOOR.has(tpl.place) || tpl.place === 'stage' || fx.has('dust')) T.FX3.dust(st, { area: [-3, 3, 0.3, 2.6, -2, 3] });
        s.noAvoid = tpl.kind === 'establish' || tpl.kind === 'walk' || tpl.cam === 'ots' || (tpl.cast || []).some((c) => c.walk);   // a moving subject made the smart camera hop
        return s;
      },
      draw(s, t, info, T) { if (!s.__pre) { s.__pre = 1; drawOnce(s, t, info, T, tpl); } drawOnce(s, t, info, T, tpl); },   // the rig's first solve is not its settled one
      overlay(g, t, info, s) { overlay(g, t, info, s, tpl); },
    });
  }

  function drawOnce(s, t, info, T, tpl) {
    const gt = info.globalT, talkers = {};
    for (const cs of s.specs) { const sp = who(cs.id).speaker; if (sp && cs.talk !== false) talkers[sp] = s.c[cs.id]; }
    for (const cs of s.specs) {
      const ch = s.c[cs.id]; ch.updateMatrixWorld(true);
      let p = cs.bed ? cfg.bed.pose(T, t, { arms: 'side' }) : Array.isArray(cs.pose) ? T.posesAt3(t, cs.pose) : (cs.pose || 'stand');
      if (!cs.still) p = T.idle3(p, t, { seed: s.specs.indexOf(cs) + 2, k: cs.id === HERO ? 0.6 : 1 });
      // speak3: keep the nods, drop its free-hand beat (it toggles 22° in one frame when the arm crosses 70° → QC 'arm snaps')
      const spk = who(cs.id).speaker; if (spk && cs.talk !== false) { const base = typeof p === 'string' ? T.POSES3[p] : p, q = T.speak3(p, spk, gt);
        p = base ? { ...q, armL: base.armL, armR: base.armR, handL: base.handL, handR: base.handR } : q; }
      if (cs.walk) { const w = cs.walk; p = T.walkTo(ch, t, { from: w.from, to: w.to, t0: (w.t0 ?? 0) === 0 ? 0.25 : w.t0, t1: w.t1 ?? info.dur, run: w.run, idle: p, end: p }); }   // never start ON frame 0 (snap); a negative t0 enters mid-stride
      if (cs.turn) ch.rotation.y = val(cs.turn, t);
      ch.pose(p);
      if (!cs.walk && !cs.lookFixed) T.lookAtSpeaker(ch, talkers, gt);
      ch.face({ expr: xp(cs.expr, cs.id === HERO ? HERO_EXPR : 'neutral'), t, blink: true, ...(spk && cs.talk !== false ? { speaker: spk, gt } : {}) });
    }
    for (const [o, p, host] of s.props) {
      if (p.wrist && host) { host.updateMatrixWorld(true); const h = host.handWorld(p.hand || 'L'); o.position.set(h.x, h.y + 0.05, h.z); o.rotation.set(-0.6, host.rotation.y, 0); }
      if (o.update) o.update(t);
    }
    camera(s, t, info, T, tpl);
  }

  function camera(s, t, info, T, tpl) {
    const cam = s.st.camera, dur = info.dur, pl = s.pl, k = tpl.cam || 'medium';
    const a = (tpl.a ? s.c[tpl.a] : null) || (tpl.focus ? null : Object.values(s.c)[0]) || tpl.focus || pl.focus, b = tpl.b ? s.c[tpl.b] : null;
    if (tpl.kind === 'stage') {   // front-on explainer framing, slow push (fov 24)
      T.dolly(cam, t, [[0, { pos: [0.3, 1.45, 12.6], look: [0, 1.0, 0], fov: 24 }], [dur, { pos: [0.05, 1.35, 11.4], look: [0, 1.0, 0], fov: 23 }]]);
    } else if (k === 'establish' || k === 'craneDown' || k === 'craneUp') {
      const f = tpl.focus || s.a0 || pl.focus, tt = k === 'craneUp' ? dur - t : t;
      if (pl.est) { const look = [f[0], f[1] - 0.15, f[2]];   // interiors: a fixed dolly between two camera points (place.est)
        T.dolly(cam, tt, [[0, { pos: pl.est[0], look, fov: 40 }], [dur, { pos: pl.est[1], look, fov: 38 }]]); }
      else T.camShot(cam, tt, k === 'craneUp' ? 'craneDown' : k, { a: f || a, dur, side: tpl.side ?? 1, dist: tpl.dist ?? pl.estDist ?? 1, avoid: false });
    } else if (k === 'insert') {
      let at = tpl.at; if (at && at.hand) { const h = s.c[at.hand]; h.updateMatrixWorld(true); at = h.handWorld(at.side || 'R'); } else if (at && at.anchor) at = s.set[at.anchor]; else if (!at && s.prop) at = s.prop;
      T.camShot(cam, t, 'insert', { at: at || a, a, dur, side: tpl.side ?? 1, dist: tpl.dist ?? 1 });
    } else {
      // camShot 'ots' put the shoulder over half the frame at these head sizes: frame the pair as a twoShot from a's side instead
      T.camShot(cam, t, k === 'ots' && b ? 'twoShot' : k, { a, b: b || undefined, dur, side: tpl.side ?? 1, dist: tpl.dist ?? (k === 'ots' ? 1.45 : 1), ...(tpl.fov ? { fov: tpl.fov } : {}), ...(s.noAvoid ? { avoid: false } : {}) });
    }
    if (tpl.crash != null) T.crashZoom(cam, t, { at: tpl.crash, dur: 0.2 });
    if (tpl.punch != null) T.punch(cam, t, tpl.punch, { amp: 0.8 });
  }

  // overlays: day label, pills (synced with wordTime), heading, title, REC frame, stage items
  function startOf(p, info, t) { if (p.word) { const g0 = info.globalT - t, w = wordTime(p.word, g0 - 0.3); if (w != null) return w - g0; } return p.at ?? 0.2; }
  function overlay(g, t, info, s, tpl) {
    if (tpl.rec) { const r = typeof tpl.rec === 'object' ? { ...REC, ...tpl.rec } : REC, c0 = r.clock;
      text(g, '● REC', 220, 150, { size: 40, color: '#ff3a3a', weight: 900 }); const sec = c0[0] * 3600 + c0[1] * 60 + (c0[2] || 0) + Math.floor(t);
      text(g, `${r.cam}  ${String(Math.floor(sec / 3600) % 24).padStart(2, '0')}:${String(Math.floor(sec / 60) % 60).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`, E.W - 360, 150, { size: 36, color: '#ffffff', weight: 800 });
      g.save(); g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 4; for (const [x, y, dx, dy] of [[120, 110, 1, 1], [E.W - 120, 110, -1, 1], [120, E.H - 110, 1, -1], [E.W - 120, E.H - 110, -1, -1]]) { g.beginPath(); g.moveTo(x, y + dy * 60); g.lineTo(x, y); g.lineTo(x + dx * 60, y); g.stroke(); } g.restore(); }
    if (tpl.label) UI.pill(g, { str: tpl.label, x: 330, y: 150, size: 44, gold: true, t, start: 0.25, icon: 'calendar' });
    if (tpl.heading) UI.heading(g, { str: tpl.heading, t, start: 0.15 });
    if (tpl.title) { const k = ease.out(clamp((t - 0.6) / 0.9)); text(g, tpl.title, E.W / 2, E.H / 2, { size: 120, weight: 900, color: '#ffe2b0', alpha: k, glow: 30, glowColor: 'rgba(255,60,70,.6)', spacing: 8 }); }
    for (const p of tpl.pills || []) UI.pill(g, { str: p.str, x: p.x ?? E.W / 2, y: p.y ?? 200, gold: p.gold ?? true, icon: p.icon || null, size: p.size ?? 52, t, start: startOf(p, info, t), end: p.end ?? null, count: p.count });
    for (const it of tpl.items || []) {
      const st0 = startOf(it, info, t);
      if (it.kind === 'meter') UI.meter(g, t, { label: it.str, start: st0, speed: it.speed ?? 0.5, x: 360, y: it.y ?? 900, w: E.W - 720, color: it.color || '#ff4a4a' });
      else if (it.kind === 'icon') D.icon(g, { kind: it.icon, x: it.x, y: it.y, r: it.r ?? 70, label: it.label, t, start: st0, check: it.check, cross: it.cross, pulse: it.pulse });
      else if (it.kind === 'tag') UI.tag(g, { str: it.str, x: it.x, y: it.y, t, start: st0 });
    }
  }

  // the 8 makers (all take (id, tpl); kind picks the camera default)
  const withCam = (cam) => (id, tpl) => build(id, { ...tpl, cam: tpl.cam || cam });
  const M = {
    establish: withCam('establish'),   // establish / craneDown / craneUp of a place (tpl.focus or a)
    wide: withCam('wide'),             // wide / full / high / lowHero group shots
    dialogue: withCam('medium'),       // medium / twoShot / ots (a = shoulder, b = face) / orbit
    reaction: withCam('closeup'),      // closeup / pushIn, expr keys on the beat, crash/punch accents
    xcu: withCam('xcu'),               // eyes / mouth macro
    insert: withCam('insert'),         // prop insert: tpl.prop or tpl.at ({hand:'ID'} | {anchor:'name'} | [x,y,z])
    walk: withCam('track'),            // track / follow a walker (cast.walk)
    stage: (id, tpl) => build(id, { ...tpl, kind: 'stage', place: 'stage' }),   // purple stage: 3D figures + glows + pills/meter/icons
  };
  const shotT = (id, tpl) => (M[tpl.kind] || M.dialogue)(id, tpl);
  return { shotT, PLACES, CAST, EXPR, who, val, makers: M };
}
