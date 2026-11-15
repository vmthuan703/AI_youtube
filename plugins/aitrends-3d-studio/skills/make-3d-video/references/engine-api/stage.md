# Stage, materials, lights — `T` (engine/kit3d.js)

Part of the engine reference (`../engine-api.md`). Grep it for the call you need instead of reading it all.

- `T.stage({ mood, fov, fog:[near,far]|false, fogColor, sky:[top..bottom]|colour, keyPos, keyColor, keyIntensity, ambient,
  fill, fillPos, rim, rimStrength, bloom, bloomThreshold, exposure, dof:{focus, aperture, maxblur}, shadowSize, shadows, faceLight })`
  Moods: `day golden dusk night storm interiorWarm interiorCool void` and, for the nature sets, `beach` (bright tropical day, turquoise sea), `sunrise`
  (dawn sea and sky), `snow` (high-key white day), `arctic` (snow at night under an aurora) and `underwater` (teal, use fog [4, 30]). Outdoor sets want a long fog: `fog: [30, 150]`.
  Night, storm and arctic moods add a soft light from the camera that lifts faces off the dark set (`faceLight` 0.55; 0 turns it off,
  any mood can set it) and a stronger rim. `st.add(obj)` animates objects that carry `obj.tick(t)` (crowds, heart monitors, clocks);
  the player calls `st.tick(t)` every frame, so shots no longer need to.
  → `st = { scene, camera, composer, sun, hemi, fill, M, add(...objs), onTick(fn), tick(t), focus(d), focusOn(obj|[x,y,z]),
  exposure(x), render() }`. `M = st.M` is the mood palette (sky, ambient, key, rim, wall, floor, dark, practical, grass,
  road, fog, accent). Default fog [14, 70], fov 35 (16:9) / 50 (9:16).
- `dof` (depth of field) re-renders depth: ~40% slower. Use it on close-ups and over-the-shoulder shots, then call
  `st.focusOn(hero.headWorld())` in `draw()`.
- `T.rim({ color, strength, power, dir })` changes the fresnel rim on every character material for this shot.
- Materials: `T.mat(colour, { rough, metal, rim, emissive, map, transparent, opacity, side, toon:false })` (follows the
  style: soft PBR or toon), `T.basic(c)`, `T.glowMat(c, power)` (emissive, blooms).
- Shapes (all cast/receive shadows): `T.box(w,h,d,mat,x,y,z)`, `T.rbox(w,h,d,radius,mat,…)`, `T.cyl(rt,rb,h,mat,…)`,
  `T.cone(r,h,mat,…)`, `T.sphere(r,mat,…)`, `T.torus(r,tube,mat,…)`, `T.capsule(r,len,mat,…)`, `T.plane(w,h,mat,…)`,
  `T.ground(w,d,colour,texture,{y, rough, metal})`, `T.group(...kids)`, `T.at(obj, x,y,z, yaw, scale)`. `mat` may be a
  hex string.
- Textures: `T.tiles(base,n,repeat)`, `T.planks(base,n,repeat)`, `T.carpet`, `T.asphalt`, `T.stripes`,
  `T.textTex(str, {w,h,bg,color,size,font,glow})`, `T.canvasTex(w,h,draw,repeat)`,
  `T.screen(w, h, (g, W, H, t) => {...})` → a glowing panel; call `panel.update(t)` in `draw()` to animate it.
- Lights: `T.lamp(colour, intensity, dist, {shadow, bulb})` (point + glowing bulb), `T.spot(colour, intensity, {pos,
  target, angle, penumbra})`, `T.lightCone(r,h,colour,opacity)` (fake volumetric cone), `T.glow(colour, size, opacity)`
  (additive sprite). Every real point/spot light costs render time; keep ≤ 4–5 per shot and fake the rest with glows.
- Cameras (`camera = st.camera`): `T.dolly(camera, t, [[0,{pos,look,fov,roll}],[3,{…}]])` (one smooth curve through every key: eases out
  of the first, flows through the middle keys, eases into the last; two equal keys hold; pass `T.ease.inOut` as a 4th argument for the
  old stop-at-every-key move), `T.push(camera, t, {from,to, look | lookFrom/lookTo, dur, roll})`, `T.orbit(camera, t, {target, radius,
  height, from, to, dur})`, `T.follow(camera, obj, {offset, look, roll})` (rigid), `T.chase(camera, t, tt => [x,y,z], {offset, look,
  lag, ahead})` (an operator following a runner: trails by `lag` s, aims a little ahead), `T.aim(camera, [x,y,z], {dist, yaw, pitch, fov})`
  (close-ups, macro), `T.shake(camera, t, amp, freq, rot)`, `T.setFov(camera, fov)`.
- Camera accents, called after the camera is placed: `T.crashZoom(camera, t, {at, dur: 0.2, to, push})` (snap onto a face on a word),
  `T.punch(camera, t, at, {amp, dur})` (impact bump and dying shake), `T.dutch(camera, deg)` (tilted horizon for tension),
  `T.handheld(camera, t, amount, seed)` (the player already adds `config.handheld`), `T.rackFocus(st, t, [[0, mia], [1.6, leo]], 0.45)`
  (focus moves from one subject to the next; needs `dof`).
- **First person** (0.2.7): `T.pov(camera, ch, t, { look, ahead, drop, fov: 64, walk, bob, roll })` puts the camera at the character's eyes and hides
  their head and hair; pose the arms forward with `T.povArms({ reach: 0.5, height: 1.12, spread: 0.36, hands, base })` so the hero's own lime sleeves and
  ball hands come into frame (holding a gift, a wheel, a phone). `walk: true` adds a step bob. Hold props at about y 1.1, 0.5 m in front.
- `T.headTag(ch, camera, { lift, ref })` → `{ x, y, s, on }`: where a tag over a head goes on screen and how big (s = 1 at `ref` 4.5 m).
- Utils: `T.THREE`, `T.v3`, `T.worldPos(obj)`, `T.rng(seed)`, `T.key`, `T.smoothKey` (key() as one smooth curve), `T.ease` (adds
  `ease.back(x, a)`: anticipation + overshoot), `T.clamp`, `T.lerp`, `T.noise`,
  `T.optimize(st, keep)` (called automatically).

**1.0 motion** (engine/motion3d.js): `T.climb(ch, t, { path, t0, t1, run })` walks a 3D path (stairs, stoops) with higher knees and a lean on slopes;
`T.jump3(ch, t, { t0, from, to, h, air, end })` crouch → stretch → arc → squash on landing → springy recovery (sets position and scale);
`T.sitDown(ch, t, { seat: [x, z, yaw], y, t0, dur, to, up, back })` stand ↔ sit: start at `T.sitDown.front(seat)` (0.32 m in front; 0.2 at desks), the legs fold first, the chest leans forward and the hips travel back onto the seat (`up: true` = stand up, ending at the front point); seated clothes adapt by themselves (jacket hems gather onto the seat, skirts and dresses spread over it instead of passing through); `T.turn3(ch, t, { t0, from, to, dur, pose })` turn on the spot,
head first, two small steps; `T.squash(ch, k)` volume-keeping squash/stretch from the feet.

**1.0 named cameras** (engine/camera10.js): `T.camShot(st.camera, t, info.shot.camera, { a, b, side, yaw, dist, dur: info.dur })` with shots.json
`"camera"`: `wide` · `full` · `medium` · `closeup` · `xcu` · `ots` (over a's shoulder onto b) · `twoShot` · `lowHero` · `high` · `dutch` · `pushIn` ·
`pullBack` · `orbit` · `track` · `reveal` · `insert` (o.at). Each framing works from the subject's own facing and drifts a little over the shot.
**1.0.1 school cameras** (same call): `hallwayWalk` (backs up ahead of a walker, long lens) · `lockerPeek` (from beside the lockers at o.at onto a) ·
`bleachers` (high from the stands) · `cafeteriaWide` (high establishing, o.height under the ceiling, default 2.4) · `backRow` (behind a's head toward the
board) · `teacherView` (from the front down the rows) · `doorWindow` (long lens from the classroom door at o.at). `high` takes o.height too. Heights follow
the subject's floor, so `lowHero` / `full` work on a stage or riser.
**1.0.2 smart camera**: every `T.camShot` framing now dodges by itself: if a wall, a car, a prop or a person sits between the
lens and the subject's face (or the lens would be inside something, or a head is right on the lens), it swings round the
subject / comes closer until the face is clear, preferring views that see the face. The dodge is decided once per shot (from
its first frame) so the camera never hops mid-shot. 180° rule: with config.json `"lineRule": true` (or `line: true`) two-person
framings (`b` given) keep the camera on one side of the line between them (the side is fixed by the two names, so a conversation
cuts cleanly; `lineSide: -1` takes the other side). `avoid: false` keeps the exact framing.
**1.0.2 actions** (`T.act.*`, engine/act10.js — whole actions as one flowing movement, hands riding what they touch):
`door(ch, T.W.swingDoor(), t, { t0, close })` · `carry(ch, obj, t, { from, pickAt, putAt, to, walk })` (poses ch itself) ·
`sitOn(ch, t, { seat: [x, z, yaw, seatY] })` (any seat height) · `runStop` · `trip` · `vault(ch, t, { from, to, t0, h, at })` ·
`climbOn(ch, t, { from, onto })` · two people → [poseA, poseB]: `hug`, `highFive`, `armAround`, `pullRun` (moves both),
`catchFall` (b faints back into a's arms). `T.flow3(t, [[t, pose], …])` is the spline under them: use it instead of posesAt3 for
any movement that must not stop at each key (swings, throws, reaches).
**1.0.2 acting**: `T.act.gaze(ch, pose, target, k)` → `{ pose, look }` (head + a little chest turned to a point / person; pass
`look` to `face`), `T.act.react(ch, pose, t, { t0, from, kind: 'startle' | 'turn' | 'hit' })`, `T.act.busyCrowd(st, { cast, spots,
acts: ['talk', 'listen', 'laugh', 'phone', 'lean'] })` (roster extras that glance at each other and tick themselves).
**1.0.3 talking**: `ch.face({ expr, t, blink: true, gt: info.globalT })` lip-syncs by the character's own `speaker` name (no
`speaker`/`talk` needed). Every mouth follows the sounds now, also grins, teeth, open and o mouths (m/b/p close them, o/u/w round
them, e/i widen them); stressed words (long words, numbers, ! ?, CAPS) lift the brows. `T.listen3(pose, me, globalT, { who })` gives
a listener small nods on the speaker's stressed words and line ends; chain it with speak3: `T.speak3(T.listen3(p, 'MAYA', gt), 'MAYA', gt)`.
**1.0.3 fingers**: hand modes `count1`…`count5`, `peace`, `pointUp`, `spread`, `rock`, `thumbsUp`, `thumbsDown` (real fingers, the
wrist bends so they stand up, the thumb on the right side for each hand); poses `showCount` (set `handR: 'count3'`), `thumbsUp`,
`peaceSign`. `T.FINGERS` lists the modes.
**1.0.3 contact**: hands rest on desk, table, podium, counter and seat tops by themselves (lifted onto the surface, the arm re-solved;
`rest: false` in an outfit or `noRest: true` in a pose turns it off). Walks ease in and out with the feet planted (the step rate
follows the real leg swing). QC treats a hand or elbow touching a surface (under 4 cm) as contact, not clipping.
**1.0.3 cloth**: scarf ends swing with the steps and flutter in the wind (`scene.userData.wind` 0..1; fallDay and pumpkinStreet set
it, leafGust gusts it); the hood is a real folded hood seen from behind; a puffer bunches on the lap when seated.
**1.0.4 strength** (engine/strength12.js): `T.W.weightRoom(st)` (mirror wall at −z; w.rack(i) stand spot, w.bar(i) the rack's dynamic
barbell, w.bench(i) [x, z, yaw, seatY]), `T.W.climbingGym(st)` (c.wallSpot(i), c.hold(i, k) → world [x, y, z] of hold k on route i —
put the climber with `ch.place(x, y, z + 0.42, PI)` and `T.reachPose`, c.mat(i), c.judges, c.matTop), `T.W.lightTower(st, { at, yaw, h })`
(L.update(t, { lean, snap, cable }) tips it toward local +z; L.leg = world point to catch, L.top), `T.W.tractorTire({ stand })` (dynamic),
`T.W.barbell({ plates })`, `T.W.streamCorner(st, { at, yaw, viewers })` (l.update(t, viewers), l.chair), `T.W.lockerRow({ n })` (r.tip(k),
r.shake(t, a), r.topEdge(x)). Hold spots are stored at build time because `optimize()` merges static meshes.
**1.0.3 November** (engine/fall11.js): `T.W.thanksgivingDinner(st)` (d.seat(i) → [x, z, yaw, seatY] for T.act.sitOn, d.carve,
d.turkey), `T.W.pumpkinStreet(st)` (s.walk(i), s.porch(i)), `T.W.leafGust(st, { at: [x, z], t0, dur, r })`, props pumpkin({ face,
lit }), hayBale, cornStalks, turkey, pie, candle, fallWreath. Friday-night football = T.W.footballField under schoolTime('night').
**1.0.3 lessons**: `tools/retro.mjs` (run by the final render) keeps `channel/lessons.json` and writes `channel/LESSONS.md`:
problems by kind across videos (QC red / amber, shot errors, the user's notes in projects/<slug>/feedback.md), what the plugin has
already fixed, the checklist for the next video (`--next`), and proposals for it: seasonal sets (built but unused lately, and new
ones to add), graphics (from build/qc_scorecard.json and the engine backlog) and effects (T.FX3 / camera effects left unused, new ones). `--note "..."` adds feedback; `--name slug --note` for a video with
no project folder left.
**2.1 cinematic thumbnails** (`references/thumbnails.md`): `import { frameHead, placeAt, watch, heroLights, powerGlow, screenOf } from
'/engine/thumbcine.js'` composes a still in screen space: `frameHead(T, st, hero, { u, v, size, yaw, pitch })` puts the camera so the
head lands at (u, v) with that height, `placeAt(T, st, ch, { u, size, ground, face })` stands anyone else where they should appear,
`heroLights` adds a rim and a face fill that follow the camera, `powerGlow` the power's light. Text: `T.thumb.tag / tagOn / bar / big /
panel` in the shot's `overlay(g, t, info, state)`. `node tools/new_thumbs.mjs --project P` starts `projects/thumb-<slug>` with the
video's cast; `node render.mjs --project P --thumbs` writes build/thumbs/<shot>.jpg (1280×720, the frame at shots.json `thumbAt`);
`node tools/thumb_sheet.mjs --project P` checks them and writes sheet.jpg. Example: examples/thumb-cine.
**1.0.2 hero look**: the channel HERO now wears a waist-length puffer (`crop: true`, `quilt: 'puff'`, `edge`, `hood` colours),
charcoal joggers (`legs`, `legCuff`) and detailed sneakers (`shoeToe`, `shoeStripe`, `shoeCollar`, `laces: true`). Any outfit can use
these keys; puffer also takes `yoke` (dark shoulders) and `stripe` (one quilted row in another colour). `HERO` is the fall look
(`HERO_FALL`: grey hood, mustard scarf, olive joggers) on top of `HERO_BASE`; `HERO_CLASSIC` in channel/cast.js is the old look (no
trousers) for re-rendering a video made before 1.0.2 unchanged.
**1.0.2 body**: arms are 25 % longer (`arms: 1` in an outfit or `S().arms = 1` for the 1.0 body) so a raised hand clears the big
head; elbows and knees never bend backwards; hands: `grip` (a handle, a pole, an umbrella), `pinch` (a pen, chalk, a note),
`cup` (a ball, a phone, a cup) besides fist / open / point / relaxed; skirts, dresses and coats swing with the walk.
**1.0.1 school motion**: `T.throw3(t, { t0, wind, idle, end })` wind-up → release (football, snowball); `T.toss(obj, t, { from, to, h, t0, dur, spin, hide })`
flies a prop on an arc; `T.lockerDoor(h.locker(i, side).door, t, { t0, open, slam })` opens a locker and slams it with a rattle.
**Motion blur**: shots.json `"mblur": "action"` (5 sub-frames, 300° shutter) for runs, punches, falls, a train going by; `T.FX3.swoosh(st, { pos, axis, from,
to, r, w, t0, dur })` draws the cartoon smear arc of a punch or kick (tilt `axis` toward the camera so the band is not edge-on).
**Secondary motion** is automatic: walkTo / climb / jump3 / turn3 make the hair bounce and sweep, hoodie strings and the bag swing a beat behind the steps.
**Lip-sync**: `face({ speaker, gt })` reads timeline/words.json and shapes the mouth per sound: open a, wide e/i/ee, round o/u/w/oo, pressed m/b/p, top teeth on
the lip for f/v, 8 levels of opening.

