# Engine reference (3D)

## Folder layout
```
aitrends-3d-studio/
  render.mjs  player.html  package.json
  channel/  brand.json cast.js        (the channel's choices and hero; updates never overwrite this folder)
  engine/   core.js styles.js kit3d.js rig3d.js motion3d.js costume3d.js world3d.js nature3d.js animals3d.js sports3d.js screens3d.js school3d.js fx3d.js player.js gag.js   (+ ui2d.js diagrams2d.js icons2d.js fx2d.js rig2d.js for 2D overlays/cards)
  tools/    doctor.py verify_kit.py tts_chatterbox.py tts.py script_check.py new_project.py parse_script.py transcribe.py beats.py qc_metrics.py tidy_project.py common.py
  audio/    dsp.py sfx.py music.py mix.py
  examples/speed-demo/   (reference project: a finished 32 s video — cast, sets, shots, story, timeline)
  examples/look-demo/    (one shot per reference-video situation: explainer stage + UI, diner, gym, game show, casino)
  examples/diagram-gallery/ (every picture in diagrams2d.js and a diagram on a blurred scene)
  examples/worlds-demo/  (0.2.7: beach, sunrise wading, island, snow, aurora, farm, underwater, campfire, blade, torch, phone light, game HUD + counters, POV, icons, versus, planet;
                          wave2.js: slice, debris, pool splash, farm animals, beach critters, stadium, boxing ring, track + results board, clone army, news wall, billboard, phone feed)
  examples/school-demo/  (0.2.8: bus stop, inside the bus, locker hall, school front, cafeteria arm wrestling, outdoor court, PE yard, bed and floor poses, car lift, body3)
  projects/<slug>/
     config.json   input/ (voiceover, script, music)   timeline/ (words, sentences, beats, lines)
     story/shots.json  story/bible.md   scenes/cast.js  scenes/sets/*.js  scenes/shots/*.js
     build/ (sheets, stills, styles, parts, music.wav, mix.wav, video_silent.mp4)   out/<title>.mp4
```
Every `.js` under `scenes/` is loaded automatically (files starting with `_` are skipped). Import the engine with absolute
paths (`'/engine/core.js'`) and project files relatively (`'../cast.js'`, `'../sets/city.js'`).

## config.json
```json
{ "title": "…", "aspect": "16:9", "resolution": "1080p", "fps": 60, "quality": "high", "style": "pearl", "palette": "dusk",
  "voiceover": "input/voiceover.mp3", "script": null, "duration": 312.4, "captions": false, "captionStyle": null,
  "bars": "cine", "fadeIn": 0.5, "fadeOut": 0.8, "speechBubbles": true,
  "subscribeGag": {"enabled": true, "at": 90, "dur": 5, "label": "SUBSCRIBE", "done": "SUBSCRIBED"},
  "music": {"enabled": true, "gainDb": -15, "duckDb": -6, "releaseS": 0.16}, "sfx": {"enabled": true, "gainDb": -6},
  "loudness": -14, "export": {"upscale": "1440p"}, "handheld": 0.35 }
```
- `resolution` 720p | 1080p | 1440p | 2160p. `fps` 24 | 30 | 60. `quality` draft | standard | high | max (render-qc.md).
- `export.upscale` 1440p | 2160p: the final MP4 is upscaled for YouTube (better VP9/AV1 encodes). Optional.
- `bars`: "cine" (channel default: 68 px, a 2:1 picture) | null/"none" (full frame) | "wide" | "scope" | number. Keep text between y = 90 and y = 990.
- `palette`: dusk | cozy | tropic | alert | school | midnight (engine/styles.js `PALETTES`), this video's colour world on top of the style. Add your own there.
- `handheld`: a light hand-held drift the player adds to every 3D shot at render time (0 = locked-off tripod, 0.35 default, 1 = documentary).
  It never changes what `draw()` set, so shots stay deterministic; a shot can override it in shots.json (`"handheld": 0` for macros and diagrams on a 3D stage).
- `speechBubbles`: every line of a named character gets a bubble while spoken (from `timeline/lines.json`). `subscribeGag`: the hero's silent mid-video button gag, drawn across cuts by `engine/gag.js`; audio/mix.py adds its small sounds.

## story/shots.json
```json
{ "title": "…", "duration": 312.4,
  "shots": [ { "id": "s001", "start": 0, "end": 3.4, "line": "spoken words", "scene": "what we see", "set": "city",
               "in": {"type": "cut|fade|dip|dipWhite|flash|whip|zoom|smash", "dur": 0.4, "dir": 1},
               "look": null, "mblur": 1, "bars": null, "handheld": 0.35, "ramp": [[0, 1], [0.8, 0.25], [2.2, 0.25], [2.6, 1]],
               "sfx": [{"at": 0.4, "name": "whoosh", "gain": -10}], "amb": {"name": "city", "gain": -24},
               "params": {}, "captions": true, "notes": "",
               "bubbles": true, "bubble": {"x": 900, "y": 240, "tx": 1000, "ty": 400},
               "backdrop": {"shot": "s009", "at": 1.5, "blur": 14, "dim": 0.5, "sat": 0.9, "tint": "#1c1432"} } ],
  "music": [ {"start": 0, "end": 42, "mood": "mystery", "intensity": 0.4} ] }
```
- `look`: `freeze` (cold, desaturated time-stop), `flashback`, `dream`, `danger`, or an object of grade overrides
  (`{sat, contrast, lift:[r,g,b], gamma, gain, vignette}`). Applied on top of the style.
- `mblur`: sub-frames per frame for motion blur (2–4). Multiplies render time; use only on fast action shots.
- `in`: `whip` slides both shots together smeared along the move (a real whip pan, `dir` 1 or −1); `smash` is a smash cut: one white
  frame, then the new shot lands with a small punch-in and a dying shake (impacts, a punchline, "and then it happened"). Cut is still the default.
- `ramp`: speed keys `[shot-local seconds, playback speed]`, linear between keys. The shot's animation slows (0.2–0.35 = slow motion) or
  speeds up while the voice runs on: the dive in slow motion, the fall that hangs in the air. `draw()` receives the ramped time; overlays,
  bubbles and lip-sync keep real time. Keep it to 1–3 moments a video.
- `backdrop` (2D shots): a still of another shot, without its overlays, blurred and dimmed behind this shot's drawing. Built once per worker, so it costs almost nothing.
- `bubbles: false` turns the automatic speech bubble off for one shot; `bubble` places it by hand.
- `hud: false` hides the game HUD over heads in one shot; `counters: false` hides the corner counters in one shot.
- Top-level `counters` (next to `shots`): trackers of the story's variable that stay on screen across cuts, drawn under the grade like the subscribe gag:
  `[{ "from": 12, "to": 95, "kind": "pill", "label": "DAY", "keys": [[12, "1"], [40, "15"]], "corner": "tr", "icon": "calendar" },
  { "from": 200, "to": 260, "kind": "bar", "label": "BALLS CUT", "max": 50, "keys": [[200, 0.1], [240, 0.78]], "corner": "tl" },
  { "from": 300, "to": 330, "kind": "score", "left": "YOU", "right": "THEM", "keys": [[300, "3 - 4"], [318, "15 - 4"]], "corner": "tc" }]`.
  It fades in and out at from/to, swells for a beat on every change, and whole numbers count up between keys (`count: false` to jump). Corners `tr tl br bl tc`, kept clear of the bars.

## Shot modules
```js
import { E, V, registerShot, ease, prog, key, wordTime, talkFor, clamp } from '/engine/core.js';
import * as UI from '/engine/ui2d.js';            // optional 2D overlays (titles, badges, data cards, captions)
import * as D from '/engine/diagrams2d.js';       // animated explainer pictures
import { HERO, JAKE } from '../cast.js';            // scenes/cast.js re-exports the hero from /channel/cast.js
import { cityNight } from '../sets/city.js';

registerShot('s012', {
  init(T, info) {                                 // build once per shot
    const st = T.stage({ mood: 'night', fov: V(38, 55) });
    cityNight(T, st, { focus: [0, 4] });
    const hero = st.add(T.character(HERO).place(0, 0.15, 5, Math.PI / 2));
    const car = st.add(T.at(T.W.car({ color: '#d63a2a', type: 'sports' }), -20, 0, 2, Math.PI / 2));
    const lines = T.FX3.speedLines(st, { axis: 'x', dir: -1, around: [0, 1.2, 5] });
    return { st, hero, car, lines };              // keep EVERY object that moves in the returned state
  },
  draw(s, t, info, T) {                           // pure function of t: set everything that animates, every frame
    const run = T.walkPose3(t * Math.PI * 2 * 1.9, { sprint: true });
    s.hero.pose(run); s.hero.position.x = -2 + t * 9;
    s.hero.face({ expr: 'smirk', t, blink: true });
    s.car.position.x = -20 + t * 3;
    s.lines.update(t);
    T.follow(s.st.camera, s.hero, { offset: [1.5, 0.6, 4.5], look: [0.5, 1.2, 0] });
    T.shake(s.st.camera, t, 0.02);
  },
  overlay(g, t, info, s) { UI.badge(g, { str: '10x' }); },   // optional, 2D in logical units (1920×1080 or 1080×1920)
  // optimize: false,  mblur: 3
});
registerShot('s013', { kind: '2d', draw(g, t, info) { D.stage2d(g); D.scale(g, { value: 0.7, label: '15 LB', t }); } });   // 2D card; add "backdrop" in shots.json to sit on a blurred scene
```

**Acting recipe** (what makes people look alive; every helper is a pure function of time):
```js
const p = T.posesAt3(t, [[0, 'stand'], [0.9, 'point'], [2.2, 'shrug']]);   // dips back, overshoots, hips → spine → arms → head
s.mia.pose(T.speak3(T.idle3(p, t, { seed: 2 }), 'MIA', info.globalT));     // weight shifts + glances, nods and hand beats on her words
s.mia.face({ expr: [[0, 'smile'], [1.4, 'worried']], t, blink: true, speaker: 'MIA', gt: info.globalT });   // blended faces, letter-shaped mouth
T.lookAtSpeaker(s.leo, { MIA: s.mia, MOM: s.mom }, info.globalT);         // after .pose(): Leo's head follows whoever talks
s.leo.pose(T.walkTo(s.leo, t, { path: [[-3, 2], [0, 1], [2, 1]], t0: 0.3, t1: 3.2, end: 'handsOnHips' }));   // no skating, real start and stop
```

**Size and comedy recipes** (tested numbers; head centre ≈ y 1.45, eyes ≈ y 1.40, face toward +z):
```js
// macro on one eye, deadpan
s.h.face({ expr: 'deadpan', t }); T.aim(s.st.camera, [hx - 0.075, 1.405, hz], { dist: 0.86 - t * 0.02, yaw: 0.03, pitch: 0 });   // stage: fov 24, dof focus 0.5
// giant head in the foreground: hero's back to the camera at the frame edge, target beyond
hero.place(-1.3, 0, 5.6, 2.6); T.dolly(cam, t, [[0, { pos: [-1.4, 1.55, 6.9], look: [0.3, 1.32, 3.2] }], [3, { pos: [-1.36, 1.53, 6.7], look: [0.3, 1.32, 3.2] }]]); st.focusOn(other.headWorld());   // fov 34, dof
// low wide: camera near the floor, looking up
T.dolly(cam, t, [[0, { pos: [0.2, 0.45, 9], look: [0, 1.35, 3] }], [3, { pos: [0.1, 0.42, 8.5], look: [0, 1.35, 3] }]]);   // fov 48
```
- `info = { dur, globalT, p, line, shot, ...shot.params }`. An exception inside a shot prints to the console and draws
  red text on the frame; check the render output.
- **Determinism:** each render worker starts at a different frame, so `draw()` must set every animated property from
  `t` alone (no `+=`, no state carried between frames, no `Math.random`/`Date.now`; use `T.rng(seed)` in `init`).
- **Static merge:** after `init`, the player merges every static opaque mesh into a few draw calls (5–10× faster on
  CPU). Objects in the returned state, characters and anything with `userData.dynamic = true` stay movable. If a prop
  moves but isn't returned, it will be frozen: return it or flag it.

## Stage, materials, lights — `T` (engine/kit3d.js)
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
**1.0.3 November** (engine/fall11.js): `T.W.thanksgivingDinner(st)` (d.seat(i) → [x, z, yaw, seatY] for T.act.sitOn, d.carve,
d.turkey), `T.W.pumpkinStreet(st)` (s.walk(i), s.porch(i)), `T.W.leafGust(st, { at: [x, z], t0, dur, r })`, props pumpkin({ face,
lit }), hayBale, cornStalks, turkey, pie, candle, fallWreath. Friday-night football = T.W.footballField under schoolTime('night').
**1.0.3 lessons**: `tools/retro.mjs` (run by the final render) keeps `channel/lessons.json` and writes `channel/LESSONS.md`:
problems by kind across videos (QC red / amber, shot errors, the user's notes in projects/<slug>/feedback.md), what the plugin has
already fixed, and the checklist for the next video (`--next`). `--note "..."` adds feedback; `--name slug --note` for a video with
no project folder left.
**1.0.3 thumbnails**: `T.thumb.tag / tagOn / bar / big / panel` draw the channel's thumbnail UI (prompts/thumbnail_style.md) in a
shot's `overlay(g, t, info, state)`; `node render.mjs --project P --thumbs` writes build/thumbs/<shot>.jpg (1280×720, the frame
at shots.json `thumbAt`) and grid.jpg. Example: examples/v103-thumb (layouts A–D).
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

## Characters — `T.character(outfit, {pose, expr, seed})` (engine/rig3d.js)
Outfit (put them in `scenes/cast.js`, one per recurring character, never change them mid-video). The channel hero lives in `/channel/cast.js`; add the script's name for them:
```js
import { HERO as CHANNEL_HERO } from '/channel/cast.js';
export const HERO = { ...CHANNEL_HERO, speaker: 'JAY' };                                   // quilted lime puffer, platinum anime hair; 'speaker' = name in the script
export const NOAH = { ...RIVAL, speaker: 'NOAH' };                                         // import { HERO as CHANNEL_HERO, RIVAL, NURSE } from '/channel/cast.js'
export const PATEL = { ...NURSE, speaker: 'NURSE PATEL' };                                 // a role from the roster: the costume already says the job
export const MAYA = { top: 'hoodie', color: '#8d4a6b', hair: 'fringe', hairColor: '#34262c', scarf: '#9c7a3a', lashes: true };   // a new character: own hair, one detail, a deep muted colour
export const BOSS = { top: 'suit', color: '#22222a', tie: '#5e2230', face: 'sunglasses', legs: '#22222a', shoes: '#111111', scale: 1.15 };
```
`skin` 'pale' | 'ink' | '#hex' (default from the style) · `eyes` 'dot' | 'big' · `top` hoodie | tshirt | jacket | suit |
dress | labcoat | vest | puffer | none · `color`, `color2` (trim, quilting seams), `shirt`, `tie`, `strings` · `pop` 0–1 self-lit cloth, keeps a loud outfit loud in dim sets (puffer default 0.35) · `speaker` name in the script (bubbles) · `legs` pants colour | 'shorts:#hex' |
null (bare stick legs) · `shoes` colour | null (round feet), `shoeSole` · `gloves` colour (default: ball hands in skin) ·
`head` cap | capBack | beanie | hood | headband | tophat | crown, `headColor` · `hair` anime (tall crown, the hero's) | animeLow (same look, lower) | short | messy | spiky | curls | quiff | sidePart | slick | bob | fringe | long | sidePony |
ponytail | pigtails | bun (soft hairlines, `engine/hair3d.js`), `hairColor`, `hairShade` (anime only: the shadow between locks), `bow` (colour) · `skirt` (colour, any top) · one-detail accents, each a colour: `sleeves`, `stripe`, `scarf`, `collar`, `bag` · `blush`
(true | colour) · `lashes: true` · `face` glasses | sunglasses · `kid: true` (74% size) · `scale` · `outline` (colour | false) · `pose` (the resting pose when none is given).

**Role roster** (`/channel/cast.js`, all in muted colours next to the hero): friends and family `BESTIE` (the hero's best friend, a girl), `BRO` (1.0: girl friend, long black hair, pink dress, slightly self-lit), `RIVAL`, `CLASSMATE`,
`MOM`, `DAD`, `GRANDPA`, `GRANDMA`, `LITTLE_SIB`; school `TEACHER_F`, `TEACHER_M`, `TEACHER_VN` (áo dài), `PRINCIPAL`, `COACH`; hospital and emergency `DOCTOR`, `NURSE`,
`PARAMEDIC`, `POLICE`, `FIREFIGHTER`; town `GUARD`, `CHEF`, `CASHIER`, `SCIENTIST`, `WORKER`, `REPORTER`, `SHADY`. `ROLES` maps script words to a role
("nurse" → `NURSE`). Old names still work (`FRIEND` = `BRO`, `GIRL` = `CLASSMATE`, `GIRL2` = `BESTIE`, `STRANGER` = `SHADY`, `PARENT`, `TEACHER`).
More teens: `CLASSMATE_2` (navy, bob, scarf), `CLASSMATE_3` (olive, bun, glasses), `BRO_2`, `RIVAL_2`, and `STUDENTS` (six background kids, pick by index).
**Every character, named or not, is a roster role**: `{ ...ROLE, speaker }`, changing a colour or the hair only when two of them share a scene and look alike.
Never write an outfit from scratch; `python tools/cast_check.py --project P` fails on one.

**Role details** (engine/costume3d.js; colours unless noted): `top` scrubs (V-neck, matching pants) | aodai (long tunic, mandarin collar, over `legs`) ·
`labcoat` is muted off-white `#d2d3da` (set `color` to change) · `head` nurseCap | policeCap | chefHat | hardhat | fireHelmet (all hats, caps included, cast no shadow on the face) ·
`hair` balding (a grey ring in `hairColor`) | lowBun · `mustache`, `beard`, `brows` (3D brows that stay on: older faces) · `lanyard` + `card`, `whistle`, `stethoscope: true`,
`badge` (gold shield), `nameTag`, `patch` ('SECURITY', 'EMS': text on the chest), `epaulettes`, `belt` + `radio: true`, `bands` (two reflective torso bands), `hiVis` (vest),
`apron`, `buttons` + `buttonRows: 2` + `buttonsTop`, `vee`, `goggles: true` (on the forehead) · `belly` (1.1–1.2) · `skirtLen` (longer skirt or shorter coat, e.g. 1.7 / 0.72) ·
`prop` cane | book | clipboard | mic | torch | medbag, `propHand` 'L' | 'R' (the cane stands on the floor: use pose `hunchCane`).

Methods (all return the character, so they chain):
- `.place(x, y, z, yaw)` (yaw 0 faces +z, toward a default camera; π/2 faces +x), `.faceTo(x, z)`.
- `.pose(p)`: a name from `T.POSES3`, a pose object, `T.posesAt3(t, [[0,'stand'],[0.8,'point'],[2,'shrug']], blend, { lively })`: each change
  dips back a little first, passes the target and settles (`ease.back`), and the body moves in order (hips and legs, then the spine 35 ms
  later, the arms 60 ms, the head 90 ms). `lively` 0 = the old even blend, 1 default, 1.5 cartoon snap. It also carries the pose 0.1 s
  earlier, so the hair lags a turn of the head and the body stretches a little on fast rises and drops.
  `T.walkPose3(phase, {run, sprint, lean})`, `T.breathe3(pose, t, k, seed)`, `T.blendPose3(a, b, k)`.
- Body and contact helpers (engine/motion3d.js, 0.2.8):
  `T.body3(pose, t, kind, amount, { t0 })` layers living movement on any pose: 'pant' (out of breath), 'sob', 'laugh', 'shiver', 'nod', 'shake' (no), 'sigh' (once from t0),
  'strain' (trembling effort), 'fidget' (nervous). Use it in every held emotional beat instead of a frozen pose.
  `T.reachPose({ grip: [height, distance], width, squat, scale, lean })` → hands gripping something in front (lifting a car, pushing a door, holding a beam).
  **Contact rule:** whoever lifts, pushes or holds a thing must stand within reach of it (0.25–0.45 m in front), with the grip on its real edge; if the
  object moves, recompute the grip from it every frame. A character a metre away with hands in the air reads as "nothing is being lifted".
  `T.armWrestle(k, { t, strain, reach })` → { a, b } seated poses, right hands gripped over the table, k −1..1 (+1 a wins). Sit them at tableZ ∓ 0.6 and film
  from the side, low and level with the table (camera ~3 m away, y ≈ 1.0); from behind a player the big heads hide the hands.
- Acting helpers (engine/motion3d.js): `T.idle3(pose, t, {seed, k, weight, glance})` (breathing plus a weight shift between the legs and a
  slow glance now and then: use it on everyone standing or sitting, `k: 0.5` for the hero's deadpan holds) · `T.speak3(pose, speaker,
  globalT, {k, hand})` (a nod on each of the speaker's words, a bigger one and a free-hand beat on long words and numbers) ·
  `T.lookAtSpeaker(ch, {MIA: s.mia, …}, globalT, {blend})` (after `.pose`: the head turns to whoever talks and back, never snapping) ·
  `T.walkTo(ch, t, {from, to | path, t0, t1, run, sprint, idle, end, yaw0, yaw1, y, accel})` (moves and turns the character and returns the
  pose: speeds up and slows down, cadence from the distance covered so the feet don't slide, the stride grows out of `idle` and settles into `end`).
- `.face({ expr, talk, blink: true, t, look: [x, y], speaker, gt, saccade })`: expressions `neutral smile happy joy smirk smug determined
  angry surprised shocked scared worried nervous sad cry sleepy thinking confused awe evil dead deadpan unimpressed`, or a custom
  `{eye:{open, lid, low, pupil, closed, sparkle, tears}, mouth:{type, w, open, curve}}`. **`expr` may be keys** `[[0, 'deadpan'], [1.2, 'shocked']]`
  (with `t`): each change blends in 0.16 s (`exprBlend`), eyes close down and open through a squint, and the eyes blink on the change.
  `blink: true` blinks 2.2–5.5 s apart with the odd double blink (a number 0..1 closes the eyes that far). Without `look` the eyes make small
  darts every 0.7–2 s (`saccade: false` holds them still, a number scales them). `speaker` + `gt` (= `info.globalT`) shape the mouth from the
  letters being spoken (a/e/i open, o/u/w round, m/b/p closed); `talk` still takes a number or `T.talkShape(...)`.
- `.lookAt3([x, y, z], k)` turns the head toward a world point (after `.pose`; `k` < 1 blends from the pose's head angle). `.lookAngles(p)`
  returns the [pitch, yaw] it would use.
- `.hold(obj, 'L'|'R', {pos, rot})` attaches a prop to a hand. `.headWorld()`, `.handWorld('L')`, `.chestWorld()`.
- `.setOpacity(a)`; `.parts` = { body, pelvis, chest, head, neck, hands, feet, … } for special effects.

Poses: `stand relaxed confident handsInPockets talk explain point pointUp pointAtViewer wave cheer fistPump handsOnHead
facepalm think crossArms crossArmsAngry crossArmsLean armsBehindHead shrug scared shocked sad phone phoneEar holdFront reach ready fight punch kick crouch kneel kneelBoth kneelSad kneelPlead sitBed sitBedSad sitBedPhone sitFloor hugKnees liftSquat liftOverhead pushHeavy
sit sitBack sitDesk lie jump fall superLand flexL hunch hunchCane handsOnHips handsOnBelt holdMic`; 1.0.1 school: `raiseHand sitRaiseHand sleepDesk passNote
copyPeek sitSlouch writeBoard holdBooks holdTray oneStrap dialLocker slamLocker holdUmbrella shareUmbrella throwWind throwRelease carryBall pomHigh pomLow
capToss duckCover sitBleacher sitBooth atPodium` (seated ones at chair height 0.42; sitBooth / sitBleacher rest the hands on a table / the knees). `ch.wear(obj)` puts a
grad cap, crown or party hat on the head. Blends between an angle limb and an IK limb (`{ to }`) are smooth since 1.0.1; keep pose
changes at 0.35 s or more (posesAt3 blend) and walk at 1.2–1.5 m/s (walkTo distance / time) or the feet slide. A pose object:
`{ y, hips:[pitch,yaw,roll], spine:[…], head:[…], armL:[raise, az, bend, twist] | {to:[x,y,z], pole}, armR, legL:[lift, side,
knee, twist] | {to}, legR, handL:'fist'|'open'|'point'|'relaxed', handR }` in degrees. Pitch + leans/nods forward, yaw +
turns to the character's left, arm raise 0 = hanging, 90 = horizontal, 180 = up; az 0 = forward, 90 = sideways. `{to}`
uses IK in character space (metres, +z forward, y up; shoulders at y ≈ 1.02 and x ≈ ±0.18, hips at 0.62). Copy and edit:
`{ ...T.POSES3.sit, armL: { to: [0.1, 0.95, 0.35] }, handL: 'open' }`.

Walking/running: phase = t × 2π × cadence (walk 0.9, run 1.4, sprint 1.9 Hz); move the character at about 1.3 / 4 / 9
m/s × scale. Super-speed: sprint + `T.FX3.speedLines` + `T.FX3.ghosts` + camera shake.

Lip-sync: only characters who speak a quoted line, with `face({ speaker: 'JAKE', gt: info.globalT })` (or `talk: talkFor('JAKE',
info.globalT)`, the mouth opening alone). The TTS word timeline knows who speaks each word; `speakerAt(globalT)` (core.js) says who is
talking now and since when. The narrator is never lip-synced.

Body: 1.75 m tall incl. a 0.54 m head (≈ ⅓); hips 0.62 m; head centre ≈ 1.45 m; a seat is 0.4 m high (`T.W.chair`),
a table 0.76 m. Raised-arm poses (cheer, wave, pointUp) open sideways so the big head stays visible.

## Sets and props — `T.W.*` (engine/world3d.js)
Sets build into the stage and return anchors:
- `T.W.city(st, { seed, length, lights, focus:[x,z], cars, props, signs, front, wet, crosswalk, moon, stars })` → night
  street along x: road z ∈ [−4, 4], sidewalks to ±7 at y = 0.15, building row behind z < −7, street lamps, parked cars,
  skyline, moon. Returns `{ lamps, lane:[-2, 2], sidewalk: 0.15 }`.
- `T.W.suburb(st, { seed, length, lights, focus, fence, moon, stars })` → houses with lit windows, lawns, fences, trees, road along x. Colours follow the stage mood (`M.houses`, `M.tree`); moon and stars only at night unless asked.
- `T.W.room(st, { kind: bedroom|living|office|classroom|kitchen|hallway|hospital|empty, w, d, h, wall, floor, window:
  'back'|'left'|'right'|false, view: 'day'|'night', ceiling, curtains, lockerColor, boardText, desks, clock, wainscot, contact })` → floor centred at the origin, back wall
  at z = −d/2, side walls at x = ±w/2, open toward +z. Returns `{ w, d, h, window, lamps, backZ, bedTop, monitor }`.
  Walls have a light falloff, baseboards and a crown moulding; hospital, classroom and office add a two-tone wainscot. Every floor-standing
  prop gets a soft contact shadow (`contact: false` skips them). **Location kits:** `hospital` builds a bed with rails (`bedX`, `bedZ`,
  `bedColor`), a heart monitor (`bpm`, `bpmText`), a drip stand, a privacy curtain, a bedside cabinet, a visitor chair, a sink and a clock;
  `classroom` adds a wall clock, a cork board, a poster and a bookcase. The props alone: `T.W.hospitalBed`, `heartMonitor`, `ivPole`,
  `curtain`, `bedsideCabinet`, `wallClock({time: '10:10' | t => minutes})`, `bulletinBoard`. `T.contactShadow(obj)` gives any prop a soft
  shadow on the floor (add it with `st.add`).
- `T.W.explainer(st, { color, lineZ, light, line, dust })` → the purple diagram stage of the references: flat backdrop with a
  fine faint grid, a floor meeting it in a thin light line at z = lineZ (default 0), fine dust floating up through the light (`dust: false` off). Stand characters on the line, frame
  front-on with fov 18–28 (`T.dolly` from z ≈ 10–13), and add `UI.pill/statCard/tag/heading/nameLabel` in `overlay`.
- `T.W.veil(st, { pos, w, h, opacity, color, lookAt })` → a dark transparent sheet that pushes a busy set back behind
  small foreground characters (the "blurred scene" explainer variant, with `dof`).
- `T.W.gym(st, { floor, rows, crowd, crowdN })` → basketball court (lines, hoops at x = ±13), bleachers with a crowd at
  z < −8, strip lights. `T.W.diner(st, { booths, booth, wall, trim })` → checkered floor, red booths + white tables along
  the window wall (returns `booths: [[x, z], …]`; seat characters at z ± 0.75 with `sitDesk`), counter + stools.
  `T.W.gameshow(st, { doorColors })` → stage, three numbered doors at z = −4.2 (`doors`), spotlights, bulb marquee.
  `T.W.casino(st, { tableX, tableZ, slots, carpet })` → roulette table with a spinning `wheel` (call
  `wheel.update(t, { speed, settle })`), chips, slot machines along the back wall. `T.W.rouletteWheel()` alone.
  `T.W.store(st, {})` → shop aisle with colourful shelves and strip lights.
- `T.W.room(st, { kind: 'hallway', lockerColors: ['#2f6a72', '#b8403a'], lockerRun: 8, strips })` → lockers in colour
  runs and fluorescent strip lights (the reference hallway).
- `T.W.park(st, { seed, trees, lights, focus })`, `T.W.studio(st, { color, intensity, pos, target, gloss, bg })` (dark
  void + spotlight pool: explanations, "imagine…", title reveals), `T.W.house(o)`, `T.W.skyline(o)`, `T.W.stars(n)`,
  `T.W.moon(o)`.
- Props (stand on y = 0, face +z): `building(w,h,d,{color, lit, sign, shop})`, `neonSign(text,{color,w})`,
  `streetLamp({light})`, `trafficLight({state:'red'|'yellow'|'green'})`, `tree({s, type:'pine'})`, `bench`, `hydrant`,
  `trashCan`, `car({color, type: sedan|sports|suv|taxi|police|van, lights, headlights, driver})` (front = +z), `table`,
  `desk`, `chair({h})`, `officeChair`, `bed({color})`, `sofa`, `shelf`, `door`, `tv({w, draw})`, `laptop({draw})`,
  `phone({draw})` (screen = `phone.screen.update(t)`), `cup`, `bottle({color, label})`, `book`, `plant`, `deskLamp`,
  `ceilingLamp`, `whiteboard({text, dark, draw})`, `locker({color})`, `counter`, `fridge`, `rug`, `poster({text})`,
  `money({n})`, `ball`, `crowd({n, area:[x0,x1,z0,z1], colors, hairColors, s, yaw, rise, riseFrom, y0, cheer, still})` (instanced mini people in the
style's skin with hair, arms and muted tops; `rise` lifts rows for bleachers: y = y0 + (riseFrom − z) × rise). Added with `st.add`, they bob, sway
and raise their arms in waves; `cheer` 0–1 (or a function of t) sets how many cheer, `still: true` freezes them).
- **Nature** (engine/nature3d.js, 0.2.7; every set returns `heightAt(x, z)`: stand people with `ch.place(x, set.heightAt(x, z), z)`):
  `T.W.beach(st, { seed, shoreZ: -2, bay, palms, framePalms, rocks, bushes, sun, sunPos })` → dry sand toward the camera, the sea beyond (a bay, so the sides
  curve away), lapping foam, two palms that frame a shot from z ≈ 8 looking out to sea; with mood `sunrise`/`golden`/`dusk` a low sun and a glittering
  path on the water. Wading: place a character at `heightAt` below 0 and the water shows the legs. `T.W.island(st, { r: 9, cx, cz, palms })` → a round
  island in open sea (aerial and stranded shots). `T.W.snow(st, { slope: 0.12, pines, mountains, falling, aurora, tracks, stars })` → a snowy slope rising
  away from camera, snow-capped pines, peaks, falling snow; `aurora: true` for arctic nights. `T.W.farm(st, { barn: [x, z], silo, fence, fields, hay })` →
  red barn, silo, white fences, crop rows, hay bales. `T.W.underwater(st, { depth: 9, rays, fish, weeds, coral, bubbles, surface })` → sea floor at y 0,
  god rays, swaying seaweed, caustic light, a fish school. `T.W.space(st)` + `T.W.planet(st, { r, pos, spin, tilt, sea, land, clouds, atmosphere })` →
  a toy Earth in deep space (mood `void`). Props: `palm({ h, lean, dir })`, `pine({ s, snow })`, `rock({ s })`, `bush({ s })`, `mountain({ h, r })`,
  `campfire(st, { pos, size })`, `fishSchool(st, { n, center, radius })`, `seaweed(st, { pos, h })`, `aurora(st)`, `sun(st, { pos })`, `water(st, {...})`,
  `foam(st, { path | ring })`, `terrain(w, d, seg, h(x, z), colour(x, z, y))`. Everything that moves animates itself.
- **Animals** (engine/animals3d.js): `T.W.cow()`, `sheep`, `pig`, `dog`, `cat`, `bird`, `crab`, `bee`, `fish` (or `T.W.animal(kind, { color, seed })`) — toy shapes with the
  cast's glossy dot eyes, standing on y 0, facing +z. Call `a.update(t, { walk | run: 0..1, look, nod, wag, fly, snap, raise, blink })` every frame and move them yourself
  (`a.position.x = …`); legs swing, tails wag, wings flap, eyes blink. Sizes match a 1.75 m person (cow 1.5 m, dog 0.75 m, cat 0.55 m).
- **Sports and big crowds** (engine/sports3d.js): `T.W.stadium(st, { kind: 'football'|'soccer', n: 5000, cheer, lights })` → a 100 × 64 m pitch at the origin, stands
  on four sides full of instanced people, floodlight towers. `T.W.boxingRing(st, { crowd: 700 })` → raised ring (canvas at y = `top` 1.1), ropes, corner pads, a hard
  spotlight, stepped seats all round. `T.W.track(st, { lanes, length, crowd })` → straight track along x, `laneZ(i)`, start and finish lines, bleachers.
  `T.W.pool(st, { lanes, length, depth })` → tiled pool, lane ropes, blocks, ladders; the surface is y 0 and see-through, a swimmer stands at y ≈ −0.95.
  `T.W.stand({ len, rows, n })` → one block of stepped seats with people (rotate/move it). `T.W.formation(st, { cols, rows, gap, pos, colors, hairColors, same })` →
  people in a grid (an army of clones: `colors: [HERO.color], hairColors: [HERO.hairColor], same: true`). `T.W.crowd({ positions: [[x, z], …] })` places a crowd exactly.
- **Screens and signs** (engine/screens3d.js): `T.W.newsWall(st, { cols, rows, w, items: [{ tag, text }], pos, yaw })` → a wall of TVs running news with a host, a tag,
  a headline and a ticker. `T.W.scoreboard3d({ title, rows: [[rank, name, value, highlight, colour]], timer, w, h })` → a results board on legs (rows pop in).
  `T.W.billboard({ title, sub, icon, color })` → a lit roadside billboard on posts. Draw functions for any screen (`T.screen`, `T.W.tv/phone/laptop({ draw })`):
  `T.W.newsDraw({ tag, text, ticker })`, `T.W.feedDraw({ title, user, views: [from, to], t0, dur, live })` (a post whose view count climbs), `T.W.boardDraw({...})`.
  Animate a phone screen with `phone.screen.update(t)`.
- **School sets, ready-made** (engine/school3d.js, 0.2.8). Use these before writing a project set: every teen story goes through them.
  `T.W.busStop(st, { busX, door })` → sidewalk z −2..1 (top y 0.15 = `walk`), road z 1..8, a school bus at the curb, door open; `step[0]`, `step[1]` are the two
  step positions [x, y, z] for getting off (move the character down them with a small hop, then onto `walk`), `door` the top of the steps.
  `T.W.schoolBus({ door })` → the bus alone (front +x, door on +z, `.door` swings). `T.W.busInside(st, { rows, moving, night })` → aisle along x, front +x,
  `seat(row, side)` → [x, z] for pose 'sit' with yaw π/2 (facing the front); call `b.update(t)` in draw so the street slides past the windows.
  `T.W.lockerHall(st, { w, d, banner })` → lockers on both walls; `locker(i, side)` → { x, z, yaw, door, front }: stand at `front` facing the locker, open with `door.rotation.y = −1.7`.
  `T.W.schoolFront(st, { name, bus })` → facade with the name, steps, flag, path, sidewalk and bus (as busStop). `T.W.cafeteria(st, { tables })` → long tables (top 0.76),
  benches at z ± 0.72, `seat(table, side, i)`. `T.W.court(st)` → outdoor basketball court, hoops at x ±11.5 (rim 3.05), fence, benches; `T.W.hoop()` alone.
  `T.W.schoolYard(st)` → PE field 40 × 24 with a running lane, goals at x ±18, coach bench `coach`, school behind. Indoor basketball / dodgeball: `T.W.gym`.
- **Everyday places, ready-made** (engine/places10.js, 1.0). Reach for these before writing a project set; they already use the 1.0 look.
  `T.W.stairwell(st, { n, floorLabel })` → two flights + landing with a window and light shafts; `up` (whole climb), `upA`, `upB` are paths for `T.climb`,
  `landing`, `H1` (landing height). `T.W.classroom(st, { board: [lines], boardDraw, rows, cols, clock })` → desks facing the board at z = −d/2;
  `seat(row, col)` → [x, z, yaw] for pose 'sitStudy' (desks 0.645 high: forearms rest on the top; 'sitDesk' is for 0.76 office desks); `teacher`, `board`. `T.W.cityBusStop(st, { busX, shelterX, wet, ad, route })` → shelter with a lit ad,
  bench (`bench(i)` → [x, z, yaw], y 0.15), city bus (`bus`, `door`, `step`), sidewalk top `walk` 0.15. `T.W.shopStreet(st, { names, wet, tables, scooters })` →
  shophouses with lit fronts, awnings, signs, balconies, string lights; `shops[i].door`, `table(i)`. `T.W.residential(st, { houses, cars, wet })` → brownstones;
  `stoops[i] = { base, top, door, up }`. `T.W.streetFood(st, { name, menu, tables, wet })` → food stall with steam and bulbs; `vendor`, `seat(i)`, `counter`.
  `T.W.cafe(st, { rain, menu, tables })` → counter, espresso machine, pendants, big window; `seat(i)`, `barista`, `counter`.
  Props: `T.W.stairs({ n, rise, run, w, rails })` (`.path(x)` → climb path once placed), `cityBus`, `awning`, `stool`, `lowTable`, `pendantLamp`, `scooter`,
  `menuBoard`, `aFrame`, `acUnit`, `planter`. Extras: `T.W.passersby(st, { cast: [roster outfits], lane: [x0, x1, z], n })` walk the sidewalk on their own.
  These sets animate through `st.onTick` (dust in light shafts, steam, rain on glass, passers-by, the sky dome); the player ticks them after draw().
- **More places** (engine/places10b.js, 1.0): `T.W.supermarket(st, { aisles, names, checkouts, name })` → shelves along z; `aisle(i)` → x of aisle i,
  `checkout(i)` → [x, z], `cashier(i)` → [x, z, yaw]. `T.W.hospitalHall(st, { sign, room })` → corridor along z; `door(i, side)` → { x, z, yaw, n },
  `station`, `panels` / `lights` (flicker them). `T.W.rooftop(st, { lights })` → roof at y 0 with parapet, water tank, vents, stair hut, city below; `edge`,
  `ledge(i)`, `door`. `T.W.trainStation(st, { board, name, line, trainX })` → platform along x (top y 0), `train` (move `.position.x`; arriving: ease out),
  `edgeZ`, `doorZ`, `bench(i)`. Props: `shelfUnit`, `cart`, `gurney`, `wheelchair`, `waterTank`, `trainCar`.
- **American high school** (engine/school10.js, 1.0.1; with school3d.js lockerHall / cafeteria / schoolFront / schoolBus / court, `T.W.gym`, `T.W.classroom`,
  `T.W.stairwell` it covers a whole US high-school story). Each returns anchors `[x, z, yaw]` (4th value = floor height when not 0):
  `library` → `seat(table, side, i)`, `aisle(i)`, `desk`, `librarian` · `chemLab` → `station(i)` (stand), `teacher`, `flask` (glowing reaction) ·
  `auditorium` → `stageY`, `stage(x)`, `podium`, `seat(row, i)`, `spots` · `footballField` (Friday night: `{ home, score: { home, guest, quarter, clock },
  crowd, lights }`) → `sideline(i)`, `bleacher(row, i)`, `board` · `lockerRoom` → `bench(i)`, `locker(i)`, `shower` · `bandRoom` → `seat(row, i)` (risers),
  `podium`, `piano` · `principalOffice` → `principal`, `guest(i)`, `door` (flag, trophy case, test paper with a red F) · `detention` (the classroom after
  school, low sun, the board says DETENTION; classroom anchors + `teacher` chair) · `nurseOffice` → `bed` (pose 'sit' at its y), `nurse` · `restroom` →
  `sink(i)` facing a real wall mirror, `stall(i)` · `studentLot` (`{ wet, buses, cars, gap: [x0, x1] }` keeps a strip free for the camera) → `car(i)`,
  `busDoor` · `promHall` (the gym with a balloon arch, banner, disco ball and moving light dots) → `arch`, `punch` · `dinerUS` (50s diner: booths,
  stools, jukebox, neon) → `booth(i, side)`, `stool(i)`, `jukebox` · `suburbStop` (porch houses, mailboxes, stop sign, the yellow bus: move
  `bus.position.x`; `{ autumn, wet }`) → `stop`, `busDoor`, `porch(i)`. Props: `bookcase bankerLamp labBench beaker trophyCase usFlag bleachers scoreboard
  goalPost musicStand drumKit piano examBed mailbox stopSign pickup jukebox discoBall balloon balloonArch paSpeaker testPaper tray milkshake umbrella gradCap
  football pompom newspaper ballotBox sinkUnit`, `T.W.bell(st, { pos, yaw, t0, dur })` (rings), `T.W.LETTERMAN` (spread into an outfit for a varsity jacket).
- **swingDoor** (1.0.2): `T.W.swingDoor({ w, h, color, hinge: 'L' | 'R' })` a door on a real hinge (`.setAngle(a)`, `.handle`); open it
  with `T.act.door`.
- **School weather, seasons, time of day** (engine/season10.js, 1.0.1, all tick themselves): `T.stage({ ...T.W.schoolTime('afterSchool') })` (morning ·
  noon · afterSchool · evening · night · storm · snow); `T.W.fallDay(st, { area, y })` maple leaves + piles; `T.W.snowDay(st, { area, groundY })` snow caps +
  snowfall (after the set); `T.W.breath(st, ch, { every })` cold breath; `T.W.windowRain(st, { pos, w, h, yaw })` drops running down a window (inside);
  `T.W.fogGlass(st, { pos, w, h, yaw, draw: 'heart' | 'smile' | text })`; `T.W.powerCut(st, { t0, room })` blackout (lightning still flashes);
  `T.W.alarmLight(st, { pos, t0 })` rotating red beacon (tornado drill); `T.W.capToss(st, { at, n, t0 })` graduation caps; `T.W.confetti(st, { area, t0 })`;
  `T.W.haze(st, { area, opacity })` (stadium lights, morning fog); `T.W.blowingPaper(st, { area, wind })`.
- **Dramatic light and weather** (engine/weather10.js, 1.0, all tick themselves): `T.W.lightning(st, { times })` double-strobe flashes;
  `T.W.cloudShadows(st, { at: [x, z] })` cloud shadows sliding over the ground, the sun dims when one passes; `T.W.headlights(st, { from, to, aim, t0, dur,
  power, angle, shadow })` a sweeping car beam (indoors: start at the window, `shadow: false`); `T.W.flicker(t, { rate, depth })` multiplier for a failing
  tube (`L.intensity = base * flicker`). `T.W.snowCover(st, { amount, groundY })` after the set: snow caps on every upward surface + patchy ground;
  `T.W.puddles(st, { area: [x0, x1, z0, z1], n, y })` mirror puddles in one reflection pass; `T.W.leaves(st, { area: [x0, x1, y0, y1, z0, z1], n, ground })`.
- **1.0 look helpers** (engine/look10.js; all switch off with `render.mjs --legacy` for before/after): `T.W.mirror(st, { w, d, x, z, y, strength, blur })`
  polished/wet floors (fresnel, blurred; ~0.15 indoors, 0.4–0.5 wet streets); `T.W.skyDome(st, { clouds, sun, seed })` painted sky with clouds and a sun glow;
  `T.W.shafts(st, { pos, dir, len, w, h, n, gap, along, opacity, motes })` light beams with dust; `T.W.aoStrip(st, { from, to, yaw, up, out })` soft
  darkening where a wall meets the floor; `T.W.stringLights({ from, to, n, sag, lights, colors })`.
  Materials: `T.mat(c, { clearcoat, clearcoatRough, sheen, sheenRough, sheenColor })` switches to the physical material. Characters get a clearcoat on
  skin, hair and shoes and a sheen on cloth automatically (`style.gloss` 0..1.5, 0 = the matte 0.2 look). `T.stage` lights every standard material with
  the mood's own sky/ground/sun (`env` 0..1, default 0.42; `style.env`). `st.fitShadow([x,y,z], size)` tightens the sun's shadow box around the action.
- Project sets: write `scenes/sets/<name>.js` exporting `function build(T, st, o)` that composes these, so every shot in
  a location uses the same geometry. Invent new props from boxes/cylinders/rounded boxes when the script needs them.

## Effects — `T.FX3.*` (engine/fx3d.js)
Build in `init`, then `fx.update(t)` in `draw` (or `st.onTick(fx.update)` once + `st.tick(t)`):
`dust(st,{area,c,size,rise})`, `rain(st,{area, snow})`, `speedLines(st,{axis, dir, around, radius, length, speed})`,
`ghosts(st, outfit, n, {c, opacity, gap})` → `.update(t, tt => ({pos, yaw, pose}))` afterimages,
`shockwave(st,{pos, t0, r1, c})`, `bokeh(st,{area, colors})`, `frozen(st,{area})` (droplets hanging in time-stop),
`burst(st,{pos, t0, confetti})`, `aura(st, target, {c})`, `trail(st,{c, width})` → `.update(t, tt => [x,y,z])`.

**Light from props** (0.2.7): the thing that glows in the story lights the faces near it, and the light moves with it. One real light each.
- `T.FX3.fire(st, { pos, size, colors, intensity: 9, dist, smoke, embers, shadow })` → licking flames, embers, smoke, a flickering warm light (animates itself).
  `T.W.campfire(st, { pos, size })` puts it on logs in a ring of stones.
- `T.FX3.blade({ color, len: 1, width, intensity: 8, dist: 5 })` → an energy blade on a hilt; `hero.hold(b, 'R', { rot: [Math.PI, 0, 0] })` holds it upright
  out of the fist; `b.update(t, { on: 0..1, hum })` ignites/retracts it.
- `T.FX3.torch({ color, angle, dist, intensity: 40, beam, shadow })` → a flashlight with a real spotlight and a soft beam along its +y; held with `rot: [0, 0, 0]`
  it points where the forearm points (`armR` raised 80° = straight ahead). `f.update(t, { on })`.
- `T.FX3.glowLight(obj, { color, intensity, dist, at, flicker, halo })` → a light on any object: a phone screen in the dark (`at: [0, 0, -0.15]` lights the face),
  a lantern, an orb. Night shots that use it: lower `ambient`/`keyIntensity` on the stage so the prop is the key light.
**Things that break, burn and splash** (0.2.7): `T.FX3.slice(st, obj, { t0, normal, gap, tilt, drop, capColor, glow })` → cuts a prop in two along a plane: the halves
slide apart at t0, the cut faces glow white-hot then cool to `capColor` (the inside). `T.FX3.sparks(st, { pos, t0, dur, dir, spread, rate })`, `T.FX3.smoke(st, { pos, t0,
dur, rate, size, grow, rise, color, opacity })`, `T.FX3.debris(st, { pos, t0, n, size, colors, floorY })` (chunks fly, tumble and settle), `T.FX3.splash(st, { pos, t0,
size })` (droplets and rings on a water surface). All tick themselves and are pure functions of t.
Held props follow the hand: the object's +y runs out of the fist along the forearm, so `rot: [Math.PI, 0, 0]` turns it back up.

## Diagrams (engine/diagrams2d.js) — `import * as D from '/engine/diagrams2d.js'`
Flat animated pictures for explainers, in `overlay()` or a 2D `draw()`. All take logical `x, y`, a size, `t` and `start` (pop-in); `examples/diagram-gallery` shows every call.
- Base: `D.stage2d(g, {floor, live})` (the purple stage in 2D; it is alive by itself: a warm light pool drifts across the back and dust
  motes float up, `live: false` freezes it; `D.stageLife(g, t)` adds the same life to any 2D shot), `D.flatFigure(g, {x, y, h, color, hairColor, hair: anime|spiky|short|bob|none, seams, pose: stand|point|cheer|shrug, expr: neutral|deadpan|happy|shock})` (a cast member as a 2D figure, for diagrams on a blurred scene), `D.label(g, str, x, y, {size, color})`.
- **Pictograms** (0.2.7, engine/icons2d.js): `D.icon(g, { kind, x, y, r, label, t, start, badge, glow, cross, check, pulse })` → one of 47 flat icons on a round
  glass badge, `cross`/`check` stamp a red ✗ / green ✓ at a time; `D.iconRow(g, { items: [{ kind, label }], x, y, r, gap, t, start, stagger })`; `D.ICON_KINDS`:
  brain bone eye clock calendar sun moon drop fire bolt leaf tree fish cow house city car plane phone money coin pill virus atom globe skull trophy lock key
  book music bulb shield warning snow wave person people crown gift target dna flag hourglass chart heart kidneys lungs muscle. Every pill, tag and HUD
  takes the same names as `icon`. `D.versus(g, { left: { title, value, icon | figure, note }, right: {...}, winner: 'right', t, start })` → "NORMAL PERSON" vs "YOU".
- Things: `crossSection` (a house cut open, pipes, `cut` 0–1 snaps them), `scale`, `calendarCard`, `growthBars`, `stopwatch`, `radar`, `seismo`, `mapPins`, `usMap`, `globe`, `organ` (`kind`: brain, lungs, kidneys, heart; `pulse`), `thermometer`, `jar`.
- Screens: `phoneChat` (messages arrive), `phoneStat` (one big number), `videoFrame` (view counter or LIVE badge around the scene, `views`, `live`, `viewers`).
- Lists and meters: `checklist`, `stamp` (slams down), `scoreboard` (`head` + `value`, or `left` + `right`), `progressRing`, `meterBar`, `chips` (items, the first `lit` stay bright from `litAt`), `arrow` (`bend`, `dashed`, draws itself), `compare` (two panels).

## 2D overlays (engine/ui2d.js, fx2d.js) — logical 1920×1080 (16:9) or 1080×1920 (9:16)
`overlay(g, t, info, s)` draws on top of the 3D frame. Reference-style graphics (all accept `t` + `start` for a pop-in, and `end` for an
exit: a time, or `'shot'` to shrink away in the 0.22 s before the cut instead of vanishing with it; leave `end` off a label that carries on
into the next shot). `count: true` on `pill`/`statCard` counts the first number up from 0 as it pops in ("$5,000", "40,000 FT"):
- `UI.pill(g, { str: '1 IN 1,000', x, y, size, gold, icon: 'check'|'heart'|'star'|'x'|'up'|'down', color, bg, line })`
- `UI.statCard(g, { label: 'TRIES', value: '1,000', x, y })`, `UI.tag(g, { str: 'SMARTER', x, y })` (✓ tag),
  `UI.heartPill(g, { n: 26, x, y })`, `UI.numberBall(g, { n: 17, x, y })`, `UI.heading(g, { str: 'THE RULES' })`,
  `UI.nameLabel(g, { str: 'JAKE', x, y })`, `UI.speech(g, { str, x, y, tx, ty })` (bubble with a tail toward tx, ty),
  `UI.chatPanel(g, { lines: [['dev', 'FIRST TRY???'], …], t })`, `UI.subscribeRow(g, { y, t, done })`, `UI.drawIcon`.
- Older helpers: `UI.titleCard`, `bigLine`, `badge`, `readout`, `callout`, `dimension`, `dataCard`, `compareBars`,
  `meter`, `blueprint`, `bubble`, `captions`; `FX.speedLines`, `FX.rings`, `FX.sparkle`, `FX.lensStreak`.
- Helpers from core.js: `text(g, str, x, y, {size, font, weight, color, glow, spacing})`, `V(h, v)`, `FONTS` (Fredoka,
  Nunito, Playfair Display 700/900).
- **Game HUD** (0.2.7): set `ch.userData.hud = { name: 'BRICK', level: 17, hp: 0.9, bars: [{ label: 'STR', value: 0.8, color }], start, end, lift, ref, size }` in
  `init` and the player draws a dark-glass panel over that head every frame (name, gold level chip, green life bar that turns red under 30%).
  Far away it shrinks to the level chip and bar, then to a bare bar, so text never drops under the readable floor. `hp`, `level`, `name` and bar values
  can be numbers, `t => …` or keys `[[0, 0.9], [2.4, 0.2]]` (shot time). `UI.hud(g, {...})` draws one yourself; `UI.counter(g, {...})` one corner tracker.
- Pin a label to a 3D point: `const [x, y] = T.toScreen(s.hero.headWorld().add(new T.THREE.Vector3(0, 0.45, 0)),
  s.st.camera)` in `draw`, store it on `s`, then use it in `overlay` (e.g. a heart pill above a head).

## Debug
`node render.mjs --project P --stills 3.2 --debug` stamps shot id and time. Player query flags (for profiling with a
custom page): `nodof`, `nobloom`, `noshadow`, `noenv`, `msaa=0`.
