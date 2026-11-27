// v104-sets (1.0.4): the strength sets — tractor tire overhead, weight room with a mirror wall, climbing gym, a stadium light
// tower that snaps and leans in a storm (caught at the leg), the livestream corner, and a row of unbolted lockers toppling.
import { registerShot } from '/engine/core.js';
import { HERO, NORA, MINA, THEO } from '../cast.js';
const PI = Math.PI, R2 = PI / 2;
const man = (s, pos, look, fov = 34) => { const c = s.st.camera; c.position.set(...pos); c.lookAt(...look); if (c.fov !== fov) { c.fov = fov; c.updateProjectionMatrix(); } };
const lerp = (a, b, k) => a + (b - a) * k, cl = (x) => Math.max(0, Math.min(1, x)), sm = (x) => { x = cl(x); return x * x * (3 - 2 * x); };

registerShot('tire', {
  init(T) { const st = T.stage({ mood: 'day', fov: 32, fog: [20, 90] }); T.W.schoolYard(st, {});
    const hero = st.add(T.character(HERO).place(0, 0, 0, 0)), theo = st.add(T.character(THEO).place(1.6, 0, 0.6, -0.5));
    const tire = T.W.tractorTire({ stand: true }); st.add(tire); return { st, hero, theo, tire }; },
  draw(s, t, info, T) { const k = sm((t - 0.6) / 1.4), r = s.tire.userData.radius;
    s.tire.position.set(0, lerp(0, 2.15 - r * 0.2, k), lerp(0.45, 0.05, k));
    const low = T.reachPose({ grip: [0.32, 0.42], squat: 1, width: 0.7 });
    s.hero.pose(T.flow3(t, [[0, low], [0.6, low], [2.0, 'liftOverhead']])).face({ expr: k > 0.8 ? 'smug' : 'determined', t, blink: true });
    s.theo.pose(T.idle3('relaxed', t)).face({ expr: k > 0.5 ? 'shocked' : 'neutral', t, blink: true });
    man(s, [0.8, 0.9, 5.2], [0.3, 1.3, 0], 36); },
});
registerShot('weights', {
  init(T) { const st = T.stage({ mood: 'interiorCool', fov: 34, fog: [12, 40] }); const w = T.W.weightRoom(st, {});
    const r = w.rack(1), theo = st.add(T.character(THEO).place(r[0], 0, r[1] - 0.35, r[2])); const bar = w.bar(1);
    const hero = st.add(T.character(HERO).place(r[0] - 1.7, 0, r[1] + 0.9, 2.6)); return { st, w, theo, hero, bar, r }; },
  draw(s, t, info, T) { const k = sm((t - 0.5) / 1.6), y = lerp(1.45, 2.1, k); s.bar.position.set(s.r[0], y, s.r[1] - 0.27);
    s.theo.pose(T.body3(T.reachPose({ grip: [y, 0.08], width: 0.9 }), t, 'strain', k < 1 ? 1 : 0.2)).face({ expr: k > 0.95 ? 'surprised' : 'determined', t, blink: true });
    s.hero.pose(T.idle3('relaxed', t)).face({ expr: 'smile', t, blink: true });
    man(s, [s.r[0] + 1.6, 1.35, s.r[1] + 2.6], [s.r[0] - 0.3, 1.5, s.r[1] - 0.4], 40); },
});
registerShot('climb', {
  init(T) { const st = T.stage({ mood: 'interiorCool', fov: 34, fog: [14, 50] }); const c = T.W.climbingGym(st, {});
    const sp = c.wallSpot(1), mina = st.add(T.character(MINA).place(sp[0], 0, sp[1] - 0.35, PI)); const nora = st.add(T.character(NORA).place(sp[0] - 1.6, c.matTop, sp[1] + 2.2, PI - 0.5));
    return { st, c, mina, nora, sp }; },
  draw(s, t, info, T) { const h = s.c.hold(1, 6); const lift = Math.min(1.1, h[1] - 1.9);
    s.mina.place(h[0] - 0.05, lift, h[2] + 0.42, PI);
    s.mina.pose({ ...T.reachPose({ grip: [1.95, 0.32], width: 0.55 }), legL: [40, 10, 60, 0], legR: [-5, 10, 20, 0] }).face({ expr: 'determined', t, blink: true });
    s.nora.pose(T.idle3('relaxed', t)).face({ expr: 'smile', t, blink: true });
    man(s, [s.sp[0] + 1.2, 2.0, s.sp[1] + 7.5], [s.sp[0], 2.0, s.sp[1] - 0.6], 46); },
});
const towerInit = (T) => { const st = T.stage({ ...T.W.schoolTime('storm'), fov: 34, fog: [30, 160] }); T.W.footballField(st, { crowd: 200 });
  const L = T.W.lightTower(st, { at: [24, 21], yaw: 0, night: true }); const rain = T.FX3.rain(st, { area: [20, 60, -5, 30] });
  const hero = st.add(T.character(HERO)); return { st, L, hero, rain }; };
registerShot('tower', {
  init(T) { return towerInit(T); },
  draw(s, t, info, T) { s.rain?.update?.(t); s.L.update(t, { snap: sm(t / 0.8), cable: t > 1.9 ? 1 : sm((t - 0.6) / 1.2) * 0.9, lean: 0.16 * sm((t - 1.4) / 1.4) });
    s.hero.visible = false; man(s, [-6, 1.6, 4], [24, 12, 22], 44); },
});
registerShot('towerClose', {
  init(T) { const o = towerInit(T); o.L.update(0, { snap: 1, cable: 1, lean: 0.16 }); return o; },
  draw(s, t, info, T) { s.rain?.update?.(t); const lean = 0.16 - 0.05 * sm((t - 1) / 1.6); s.L.update(t, { snap: 1, cable: 1, lean }); const g = s.L.leg;
    s.hero.place(g[0], 0, g[2] + 0.42, PI);
    s.hero.pose(T.body3(T.reachPose({ grip: [g[1], 0.38], width: 0.3, lean: 8 }), t, 'strain', 1)).face({ expr: 'determined', t, blink: true });
    man(s, [g[0] + 2.6, 1.1, g[2] - 0.2], [g[0] + 0.1, 1.45, g[2] + 0.3], 42); },
});
registerShot('stream', {
  init(T) { const st = T.stage({ mood: 'night', fov: 32, fog: [8, 30] }); T.W.room(st, { kind: 'bedroom', window: 'back' });
    const l = T.W.streamCorner(st, { at: [0.8, -1.2], yaw: 0, viewers: 48000 });
    const ch = T.W.chair({ color: '#1a1a20', h: 0.47 }); ch.position.set(l.chair[0], 0, l.chair[1] + 0.1); ch.rotation.y = l.chair[2]; st.add(ch);
    const hero = st.add(T.character(HERO).place(l.chair[0], 0, l.chair[1], l.chair[2])); return { st, l, hero }; },
  draw(s, t, info, T) { s.l.update(t, 48000 + t * 4200); s.hero.pose(T.idle3('sit', t)).face({ expr: 'smile', t, blink: true });
    man(s, [s.l.chair[0] + 1.5, 1.2, s.l.chair[1] - 0.75], [s.l.chair[0] - 0.2, 1.05, s.l.chair[1] - 0.2], 42); },
});
registerShot('lockers', {
  init(T) { const st = T.stage({ mood: 'interiorCool', fov: 34, fog: [12, 40] }); T.W.lockerRoom(st, {});
    const row = T.W.lockerRow({ n: 6 }); row.position.set(1.2, 0, -1.6); st.add(row); const theo = st.add(T.character(THEO).place(1.2, 0, -0.2, PI)); return { st, row, theo }; },
  draw(s, t, info, T) { s.row.shake(t, t < 1 ? 1 : 0); s.row.tip(sm((t - 0.9) / 0.9) * 0.62);
    s.theo.pose(T.flow3(t, [[0, 'sit'], [1.2, 'sit'], [1.6, 'fall']])).face({ expr: t > 1.2 ? 'scared' : 'neutral', t, blink: true });
    man(s, [4.2, 1.4, 2.6], [1.2, 1.0, -0.8], 38); },
});
