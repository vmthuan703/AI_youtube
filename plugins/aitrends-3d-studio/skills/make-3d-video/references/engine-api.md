# Engine reference (3D)

## Folder layout
```
aitrends-3d-studio/
  render.mjs  player.html  package.json
  engine/   core.js styles.js kit3d.js rig3d.js world3d.js fx3d.js player.js   (+ ui2d.js fx2d.js rig2d.js for 2D overlays/cards)
  tools/    doctor.py verify_kit.py tts.py new_project.py parse_script.py transcribe.py beats.py common.py
  audio/    dsp.py sfx.py music.py mix.py
  examples/speed-demo/   (reference project: a finished 32 s video — cast, sets, shots, story, timeline)
  examples/look-demo/    (one shot per reference-video situation: explainer stage + UI, diner, gym, game show, casino)
  projects/<slug>/
     config.json   input/ (voiceover, script, music)   timeline/ (words, sentences, beats, lines)
     story/shots.json  story/bible.md   scenes/cast.js  scenes/sets/*.js  scenes/shots/*.js
     build/ (sheets, stills, styles, parts, music.wav, mix.wav, video_silent.mp4)   out/<title>.mp4
```
Every `.js` under `scenes/` is loaded automatically (files starting with `_` are skipped). Import the engine with absolute
paths (`'/engine/core.js'`) and project files relatively (`'../cast.js'`, `'../sets/city.js'`).

## config.json
```json
{ "title": "…", "aspect": "16:9", "resolution": "1080p", "fps": 30, "quality": "high", "style": "cinematic",
  "voiceover": "input/voiceover.mp3", "script": null, "duration": 312.4, "captions": false, "captionStyle": null,
  "bars": null, "fadeIn": 0.5, "fadeOut": 0.8, "music": {"enabled": true, "gainDb": -17}, "sfx": {"enabled": true, "gainDb": -6},
  "loudness": -14, "export": {"upscale": "1440p"} }
```
- `resolution` 720p | 1080p | 1440p | 2160p. `fps` 24 | 30 | 60. `quality` draft | standard | high | max (render-qc.md).
- `export.upscale` 1440p | 2160p: the final MP4 is upscaled for YouTube (better VP9/AV1 encodes). Optional.
- `bars`: null/"none" (default, full frame) | "wide" | "scope" | number.

## story/shots.json
```json
{ "title": "…", "duration": 312.4,
  "shots": [ { "id": "s001", "start": 0, "end": 3.4, "line": "spoken words", "scene": "what we see", "set": "city",
               "in": {"type": "cut|fade|dip|dipWhite|flash|whip|zoom", "dur": 0.4, "dir": 1},
               "look": null, "mblur": 1, "bars": null,
               "sfx": [{"at": 0.4, "name": "whoosh", "gain": -10}], "amb": {"name": "city", "gain": -24},
               "params": {}, "captions": true, "notes": "" } ],
  "music": [ {"start": 0, "end": 42, "mood": "mystery", "intensity": 0.4} ] }
```
- `look`: `freeze` (cold, desaturated time-stop), `flashback`, `dream`, `danger`, or an object of grade overrides
  (`{sat, contrast, lift:[r,g,b], gamma, gain, vignette}`). Applied on top of the style.
- `mblur`: sub-frames per frame for motion blur (2–4). Multiplies render time; use only on fast action shots.

## Shot modules
```js
import { E, V, registerShot, ease, prog, key, wordTime, talkFor, clamp } from '/engine/core.js';
import * as UI from '/engine/ui2d.js';            // optional 2D overlays (titles, badges, data cards, captions)
import { HERO, JAKE } from '../cast.js';
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
registerShot('s013', { kind: '2d', draw(g, t, info) { UI.blueprint(g); /* 2D card: diagrams, data, end screen */ } });
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
  fill, fillPos, rim, rimStrength, bloom, bloomThreshold, exposure, dof:{focus, aperture, maxblur}, shadowSize, shadows })`
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
- Cameras (`camera = st.camera`): `T.dolly(camera, t, [[0,{pos,look,fov,roll}],[3,{…}]])`, `T.push(camera, t, {from,to,
  look | lookFrom/lookTo, dur, roll})`, `T.orbit(camera, t, {target, radius, height, from, to, dur})`,
  `T.follow(camera, obj, {offset, look, roll})`, `T.aim(camera, [x,y,z], {dist, yaw, pitch, fov})` (close-ups),
  `T.shake(camera, t, amp, freq, rot)`, `T.setFov(camera, fov)`.
- Utils: `T.THREE`, `T.v3`, `T.worldPos(obj)`, `T.rng(seed)`, `T.key`, `T.ease`, `T.clamp`, `T.lerp`, `T.noise`,
  `T.optimize(st, keep)` (called automatically).

## Characters — `T.character(outfit, {pose, expr, seed})` (engine/rig3d.js)
Outfit (put them in `scenes/cast.js`, one per recurring character, never change them mid-video):
```js
export const HERO = { top: 'hoodie', color: '#3a78e0' };                                   // pale skin, dot eyes (style default)
export const JAKE = { top: 'tshirt', color: '#e0402e', head: 'capBack', headColor: '#f2c21a', legs: '#2a3a5a', shoes: '#f4f4f4' };
export const MOM  = { top: 'dress', color: '#c05a8a', hair: 'bun', hairColor: '#5a3a2a' };
export const MAYA = { top: 'hoodie', color: '#ee7aa8', hair: 'bob', hairColor: '#7a4a2e', bow: '#ff5a8a', blush: true, lashes: true };
export const LILY = { top: 'tshirt', color: '#f0b030', skirt: '#7a4ab0', hair: 'long', hairColor: '#e8c060', blush: true };
export const BOSS = { top: 'suit', color: '#22222a', tie: '#c02a2a', face: 'sunglasses', legs: '#22222a', shoes: '#111111', scale: 1.15 };
```
`skin` 'pale' | 'ink' | '#hex' (default from the style) · `eyes` 'dot' | 'big' · `top` hoodie | tshirt | jacket | suit |
dress | labcoat | vest | none · `color`, `color2` (trim), `shirt`, `tie`, `strings` · `legs` pants colour | 'shorts:#hex' |
null (bare stick legs) · `shoes` colour | null (round feet), `shoeSole` · `gloves` colour (default: ball hands in skin) ·
`head` cap | capBack | beanie | hood | headband | tophat | crown, `headColor` · `hair` short | messy | spiky | bob | long |
ponytail | pigtails | bun (helmet shells with bangs), `hairColor`, `bow` (colour) · `skirt` (colour, any top) · `blush`
(true | colour) · `lashes: true` · `face` glasses | sunglasses · `kid: true` (74% size) · `scale` · `outline` (colour | false).

Methods (all return the character, so they chain):
- `.place(x, y, z, yaw)` (yaw 0 faces +z, toward a default camera; π/2 faces +x), `.faceTo(x, z)`.
- `.pose(p)`: a name from `T.POSES3`, a pose object, `T.posesAt3(t, [[0,'stand'],[0.8,'point'],[2,'shrug']], blend)`,
  `T.walkPose3(phase, {run, sprint, lean})`, `T.breathe3(pose, t, k, seed)`, `T.blendPose3(a, b, k)`.
- `.face({ expr, talk, blink: true, t, look: [x, y] })`: expressions `neutral smile happy joy smirk smug determined
  angry surprised shocked scared worried nervous sad cry sleepy thinking confused awe evil dead`, or a custom
  `{eye:{open, lid, low, pupil, closed, sparkle, tears}, mouth:{type, w, open, curve}}`. `look` moves the eyes (−1..1).
- `.lookAt3([x, y, z])` turns the head toward a world point (after `.pose`).
- `.hold(obj, 'L'|'R', {pos, rot})` attaches a prop to a hand. `.headWorld()`, `.handWorld('L')`, `.chestWorld()`.
- `.setOpacity(a)`; `.parts` = { body, pelvis, chest, head, neck, hands, feet, … } for special effects.

Poses: `stand relaxed confident handsInPockets talk explain point pointUp pointAtViewer wave cheer fistPump handsOnHead
facepalm think crossArms shrug scared shocked sad phone phoneEar holdFront reach ready fight punch kick crouch kneel
sit sitBack sitDesk lie jump fall superLand flexL`. A pose object:
`{ y, hips:[pitch,yaw,roll], spine:[…], head:[…], armL:[raise, az, bend, twist] | {to:[x,y,z], pole}, armR, legL:[lift, side,
knee, twist] | {to}, legR, handL:'fist'|'open'|'point'|'relaxed', handR }` in degrees. Pitch + leans/nods forward, yaw +
turns to the character's left, arm raise 0 = hanging, 90 = horizontal, 180 = up; az 0 = forward, 90 = sideways. `{to}`
uses IK in character space (metres, +z forward, y up; shoulders at y ≈ 1.02 and x ≈ ±0.18, hips at 0.62). Copy and edit:
`{ ...T.POSES3.sit, armL: { to: [0.1, 0.95, 0.35] }, handL: 'open' }`.

Walking/running: phase = t × 2π × cadence (walk 0.9, run 1.4, sprint 1.9 Hz); move the character at about 1.3 / 4 / 9
m/s × scale. Super-speed: sprint + `T.FX3.speedLines` + `T.FX3.ghosts` + camera shake.

Lip-sync: only characters who speak a quoted line, with `talk: talkFor('JAKE', info.globalT)` (the TTS word timeline
knows who speaks each word). The narrator is never lip-synced.

Body: 1.75 m tall incl. a 0.54 m head (≈ ⅓); hips 0.62 m; head centre ≈ 1.45 m; a seat is 0.4 m high (`T.W.chair`),
a table 0.76 m. Raised-arm poses (cheer, wave, pointUp) open sideways so the big head stays visible.

## Sets and props — `T.W.*` (engine/world3d.js)
Sets build into the stage and return anchors:
- `T.W.city(st, { seed, length, lights, focus:[x,z], cars, props, signs, front, wet, crosswalk, moon, stars })` → night
  street along x: road z ∈ [−4, 4], sidewalks to ±7 at y = 0.15, building row behind z < −7, street lamps, parked cars,
  skyline, moon. Returns `{ lamps, lane:[-2, 2], sidewalk: 0.15 }`.
- `T.W.suburb(st, { seed, length, lights, focus, fence })` → houses with lit windows, lawns, fences, trees, road along x.
- `T.W.room(st, { kind: bedroom|living|office|classroom|kitchen|hallway|empty, w, d, h, wall, floor, window:
  'back'|'left'|'right'|false, ceiling, curtains, lockerColor, boardText, desks })` → floor centred at the origin, back wall
  at z = −d/2, side walls at x = ±w/2, open toward +z. Returns `{ w, d, h, window, lamps, backZ }`.
- `T.W.explainer(st, { color, lineZ, light, line })` → the purple diagram stage of the references: flat backdrop with a
  fine faint grid, a floor meeting it in a thin light line at z = lineZ (default 0). Stand characters on the line, frame
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
  `money({n})`, `ball`, `crowd({n, area:[x0,x1,z0,z1], colors, s, yaw, rise, riseFrom, y0})` (instanced mini people in the
style's skin with coloured hoodies; `rise` lifts rows for bleachers: y = y0 + (riseFrom − z) × rise).
- Project sets: write `scenes/sets/<name>.js` exporting `function build(T, st, o)` that composes these, so every shot in
  a location uses the same geometry. Invent new props from boxes/cylinders/rounded boxes when the script needs them.

## Effects — `T.FX3.*` (engine/fx3d.js)
Build in `init`, then `fx.update(t)` in `draw` (or `st.onTick(fx.update)` once + `st.tick(t)`):
`dust(st,{area,c,size,rise})`, `rain(st,{area, snow})`, `speedLines(st,{axis, dir, around, radius, length, speed})`,
`ghosts(st, outfit, n, {c, opacity, gap})` → `.update(t, tt => ({pos, yaw, pose}))` afterimages,
`shockwave(st,{pos, t0, r1, c})`, `bokeh(st,{area, colors})`, `frozen(st,{area})` (droplets hanging in time-stop),
`burst(st,{pos, t0, confetti})`, `aura(st, target, {c})`, `trail(st,{c, width})` → `.update(t, tt => [x,y,z])`.

## 2D overlays (engine/ui2d.js, fx2d.js) — logical 1920×1080 (16:9) or 1080×1920 (9:16)
`overlay(g, t, info, s)` draws on top of the 3D frame. Reference-style graphics (all accept `t` + `start` for a pop-in):
- `UI.pill(g, { str: '1 IN 1,000', x, y, size, gold, icon: 'check'|'heart'|'star'|'x'|'up'|'down', color, bg, line })`
- `UI.statCard(g, { label: 'TRIES', value: '1,000', x, y })`, `UI.tag(g, { str: 'SMARTER', x, y })` (✓ tag),
  `UI.heartPill(g, { n: 26, x, y })`, `UI.numberBall(g, { n: 17, x, y })`, `UI.heading(g, { str: 'THE RULES' })`,
  `UI.nameLabel(g, { str: 'JAKE', x, y })`, `UI.speech(g, { str, x, y, tx, ty })` (bubble with a tail toward tx, ty),
  `UI.chatPanel(g, { lines: [['dev', 'FIRST TRY???'], …], t })`, `UI.subscribeRow(g, { y, t, done })`, `UI.drawIcon`.
- Older helpers: `UI.titleCard`, `bigLine`, `badge`, `readout`, `callout`, `dimension`, `dataCard`, `compareBars`,
  `meter`, `blueprint`, `bubble`, `captions`; `FX.speedLines`, `FX.rings`, `FX.sparkle`, `FX.lensStreak`.
- Helpers from core.js: `text(g, str, x, y, {size, font, weight, color, glow, spacing})`, `V(h, v)`, `FONTS` (Fredoka,
  Nunito, Playfair Display 700/900).
- Pin a label to a 3D point: `const [x, y] = T.toScreen(s.hero.headWorld().add(new T.THREE.Vector3(0, 0.45, 0)),
  s.st.camera)` in `draw`, store it on `s`, then use it in `overlay` (e.g. a heart pill above a head).

## Debug
`node render.mjs --project P --stills 3.2 --debug` stamps shot id and time. Player query flags (for profiling with a
custom page): `nodof`, `nobloom`, `noshadow`, `noenv`, `msaa=0`.
