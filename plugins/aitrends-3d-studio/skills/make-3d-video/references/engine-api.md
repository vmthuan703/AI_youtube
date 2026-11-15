# Engine reference (3D)

## 2.0 film picture (style `cine`, the channel default)
Every `T.stage({ mood })` is now a film stage: the mood (and the shot's `"look"` / `"weather"` in shots.json) picks a **look** that sets the
sun, sky, ambient light, haze, god rays, bloom, exposure and the lens grade. Rooms are found by themselves (rays from the camera hit a
ceiling) and keep their own lamps; they only gain contact shadows and the lens. `--legacy`, `?nocine`, `cine: false` on a stage or the
`pearl` style give the old picture.

| look | when | mood it replaces |
|---|---|---|
| `goldenHour` | low warm sun, long shadows, god rays | golden, sunrise |
| `clearDay` | blue sky, white clouds | day, beach |
| `dusk` | pink-violet sky, first stars | dusk |
| `night` | moonlit blue, stars, lamps carry the scene | night, arctic |
| `overcast` / `rainDay` | flat grey light; rain by day | storm |
| `rainNight` | wet night: reflections, glowing windows | night + `"weather": "rain"` |
| `snowDay` / `snowDusk` | bright snow; pink snowy evening with lit windows | snow |
| `fogMorning` | thick low fog, strong sun shafts | `"weather": "fog"` |

```js
// shots.json: { "id": "s012", "look": "goldenHour", "weather": "leaves", "camera": "establish" }
const st = T.stage({ mood: 'golden', sun: [-0.9, 0.15, -0.4], shadowSize: 28 });   // sun: direction TO the sun; put it in frame for openings
const st = T.cine.stage(T, { look: 'rainNight', dof: { focus: 2.8, aperture: 0.0011, maxblur: 0.008 } });   // the same, look named in code
// stage options (2.0): look, weather, sun, rays (0..1.2), ao (0..1), cover (clouds 0..1), stars, fogCine: [density, falloff, max],
// wxAt: [x, z] (where the weather falls), wxSize, weatherFx: false (light only, no particles), indoor: true | false, sss (skin 0..1)
```
- **Weather** (`"weather"` in shots.json or `weather:` on the stage; particles are a pure function of time): `rain` (streaks + splash
  rings; add `T.W.mirror(st, { w, d, z, strength: 0.7, blur: 0.9, res: 0.85 })` on the road and `wet: true` on the set), `storm` (harder rain,
  wind, lightning), `snow` (far flakes + soft big ones near the lens), `leaves`, `wind` (many fast leaves), `fog`. By hand:
  `T.wx.leaves(st, { area: [x0, x1, y0, y1, z0, z1], n, colors, wind: [x, 0, z] })`, `T.wx.rain`, `T.wx.snow`, `T.wx.motes` (dust in the sun).
- **American sets with depth** (`engine/usa20.js`; people stand on the sidewalk at `y = set.heightAt(x, z)` = 0.16):
  `T.usa.mapleStreet(st, { season: 'fall' | 'summer' | 'winter', night, wet, lit, town })` (road z 1..9, near sidewalk z -1..1, houses with
  porches, garages, flags and pumpkins, street trees to the vanishing point, power lines, tree line, hills, water tower; returns `houses,
  trees, lamps, xmasRuns`), `T.usa.mainStreet(st, { season, night, wet, clearX: [x0, x1] })` (brick shop fronts with awnings and signs, a
  diner, a cinema marquee, parked cars, lamps with banners; road z 1..11, sidewalk z -2.6..1; returns `fronts, lamps, cars`),
  `T.usa.highSchool(st, { name, season, night, buses })` (brick school with columns and steps, flag on a pole that waves, buses at the curb,
  lawn; returns `building, buses, trees, door, flag`), `T.usa.backdrop(st, { season, z })` (far layers behind any older outdoor set),
  pieces: `usHouse`, `storefront`, `maple`, `pine`, `mailbox`, `stopSign`, `busStopSign`, `powerPole`, `lampUS`, `waterTower`.
  A set that calls these sets `st.outdoor`; never put a lamp's cone between the lens and the subject.
- **Cameras**: `"camera": "establish"` (starts high and far, comes down to the subject) and `"craneDown"` for the first shot of a place.
  On a film stage `closeup`, `xcu`, `ots`, `insert`, `medium` and `pushIn` blur the background by themselves (`{ dof: false }` keeps it
  sharp, `{ dof: 2 }` doubles it); with a hand-made camera call `st.focusOn(hero.headWorld())` and `st.focus(dist, 0.0011)`.
- **Characters**: unchanged design. Skin takes a warm light at the shadow edge from the sun's side, the rim light follows the sun, and
  contact shadows sit under chins, collars and feet. Keep faces toward the sun's side or use `faceLight: 0.4` at night.
- **Video memory**: a film stage holds a 4096 shadow map and several full-frame targets. The renderer sizes its workers from the card's free
  memory; a shot with `T.W.mirror` renders the scene twice, so keep one mirror per shot.

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
  examples/thumb-cine/   (2.1: two cinematic thumbnail options, golden hour and wet night)
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
Moved to `engine-api/stage.md` (14 KB). Topics: 1.0 motion, 1.0 named cameras, 1.0.1 school cameras, 1.0.2 smart camera, 1.0.2 actions, 1.0.2 acting, 1.0.3 talking, 1.0.3 fingers, 1.0.3 contact, 1.0.3 cloth, 1.0.4 strength, 1.0.3 November, 1.0.3 lessons, 2.1 cinematic thumbnails, 1.0.2 hero look, 1.0.2 body, 1.0.1 school motion, Motion blur, Secondary motion, Lip-sync. Grep it for the call or topic you need (`grep -n "<name>" references/engine-api/stage.md`), read only those lines.

## Characters — `T.character(outfit, {pose, expr, seed})` (engine/rig3d.js)
Moved to `engine-api/characters.md` (11 KB). Topics: Role roster, Role details. Grep it for the call or topic you need (`grep -n "<name>" references/engine-api/characters.md`), read only those lines.

## Sets and props — `T.W.*` (engine/world3d.js)
Moved to `engine-api/sets.md` (18 KB): every `T.W.*` / `T.usa.*` set and prop builder with its options. The ready-made sets are listed by `python tools/set_match.py --list sets` (and `props`, `fx`, `actions`), with the call to use. Grep it for the call or topic you need (`grep -n "<name>" references/engine-api/sets.md`), read only those lines.

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
