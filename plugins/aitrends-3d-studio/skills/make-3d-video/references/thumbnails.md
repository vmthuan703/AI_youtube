# Cinematic thumbnails (2.1)

A thumbnail is a **film still**: one moment of the script staged in a real place with depth, lit like a movie, the channel hero
large in the foreground. It is rendered by the same engine as the video (style `cine`), from the video's own cast and sets, so
nothing on it differs from what the viewer then watches. No flat 2D drawing, no image model, no other channel's characters.

The channel's own rule file is `D:\AI_youtube\prompts\thumbnail_style.md`; where it is newer than this page, it wins.

**One sentence:** a film still of the moment the rule bites, the hero's face large and lit, the power visible as light or as an
impossible sight, and other people caught reacting.

## Rules

| # | Rule | How to check |
|---|---|---|
| 1 | **One moment, one read.** A single instant from the script that a stranger understands in a second | Cover the title: can you say what the video is about? |
| 2 | **The hero's face is the first thing seen, and it is the face of that moment.** Head 35–45 % of the frame height, on a third line. Smug or a smirk only when the hero is winning; hurt, confused, worried or joyful when the moment is that. Never from behind | The 320 px row of the sheet |
| 3 | **Depth in three layers.** Hero in the foreground, reactions in the mid-ground, a real place behind, out of focus | Background blurred, mid-ground faces still readable |
| 4 | **Light tells the mood and comes from somewhere.** The sun behind the hero, a lit window, the power's own glow. Always a bright edge on the hero and a readable face | The hero separates from the background even in greyscale |
| 5 | **The power is visible** as light in its colour, weather that obeys, or an impossible sight (a 200 kg tire in one hand) | Remove the text: is the power still there? |
| 6 | **Someone reacts.** 1–3 roster characters with clear faces turned to the hero | Faces ≥ 15 % of the frame height |
| 7 | **Text only if the script needs it.** Nothing, or one label / number, or one phrase of ≤ 3 words that does not repeat the title. Across the options at least one has no text | `thumb_sheet.mjs` counts the words |
| 8 | **Low camera, long lens, full frame.** Camera below the face looking up, fov 26–34, no bars, saturated colour | — |

**Options:** 3 or 4 per video, different moments or different ways of seeing the rule (another place, hour, distance, reaction).
Two frames of one moment from two angles count as one option.

**Do not:** a small hero, a hero from behind or lost in the set · flat noon light with everything sharp · a black or grey frame
(night needs one saturated light and lit windows) · more than one text element, long text, the title repeated · gross subjects,
blood, a real weapon aimed at a person · the twist or the ending · blown-out white on the hero's face or jacket · the hero's
lime jacket against a green lawn.

Where the rules come from: the leading What If channel's videos page looked at again on 2026-11-13 (lit scenes with depth, one
light effect that shows the power, a very large face, little or no text), the 2026-11-07 view data on 40 of its thumbnails
(a reacting girl or crowd 400–517k median views, a label 265k against 38k for none; small sample, correlation only), film poster
practice, and the user's note of 2026-11-13 that the hero's face must fit the moment. These describe what tends to work; never
copy a competitor's character, scene or picture.

## 1. Read the script like a poster designer

Write this down (short, in the chat) before building:

| Item | What to find |
|---|---|
| Rule | The one rule or power of the video in ≤ 10 words |
| Poster moments | 3–5 moments where the rule is visible in ONE frame. Quote the line. Prefer the impossible sight over a talking scene |
| Place and hour | Where each happens and which look makes it strongest (table below). Reuse the video's sets |
| The power, visible | What in the frame shows it: a prop held wrong, a glow, weather, a crowd's state |
| Faces | What the hero feels in that moment, who watches and what they feel |
| Text | Does the moment read without words? If not, the one label, number or ≤ 3-word phrase that completes it |
| Avoid | The twist or ending, and the "Do not" list |

## 2. Build the thumbnail project (in the studio folder)

```bash
node tools/new_thumbs.mjs --project projects/<slug>
```

Creates `projects/thumb-<slug>/` from `examples/thumb-cine`, with the video's cast re-exported (`scenes/cast.js`), its script and
title. Without a video project: `node tools/new_thumbs.mjs --slug <name> --script <script.txt>`, then write `scenes/cast.js` from
roster roles. Then edit:

- `story/shots.json`: one shot per option (3 s each, `"thumbAt": 2.5`, `"camera": "manual"`, `"hud": false`) with `"idea"` (the
  moment, one line) and `"text"` (the words on the picture, or `""`). `duration` = 3 × the number of options.
- `scenes/shots/thumbs.js`: one `registerShot` per option; replace the two worked examples. Import the video's sets with
  absolute paths (`import { hallway } from '/projects/<slug>/scenes/sets/school.js'`) so the place is the one in the video.

### The order inside `draw()` (always)

```js
import { frameHead, placeAt, watch, heroLights, powerGlow } from '/engine/thumbcine.js';
const still = { t: 0, blink: false, saccade: false };   // one frozen frame: no blinks, no eye darts
s.hero.pose(...).face({ expr: 'smug', look: [0.35, -0.1], ...still });                             // 1 pose the hero
frameHead(T, s.st, s.hero, { u: 0.34, v: 0.56, size: 0.38, yaw: 0.25, pitch: -0.2 });             // 2 the camera, from where the head should be
s.theo.pose('shocked'); placeAt(T, s.st, s.theo, { u: 0.71, size: 0.22, face: s.hero });            // 3 everyone else, by position in the frame
watch(s.theo, s.hero).face({ expr: 'shocked', ...still });                                         // 4 heads turn to the hero, then faces
s.lights.aim(s.st, s.hero, { side: -1 }); s.power?.update();                                       // 5 lights follow the camera
```

| Helper (`engine/thumbcine.js`) | Use |
|---|---|
| `frameHead(T, st, ch, { u, v, size, yaw, pitch, roll })` | Camera placed so `ch`'s head is at screen `(u, v)` (0..1 from top-left), `size` of the frame height tall. `yaw` orbits round the face (0 front, ± 0.2–0.6 three-quarter), `pitch` negative = low angle. Focuses the lens on the head |
| `placeAt(T, st, ch, { u, size, ground, face, turn })` | Stands `ch` on the ground so its head appears at screen x `u` with head height `size` (depth: 0.3 right behind the hero, 0.2 mid-ground, 0.12 far). `ground` = floor height (0.16 on `T.usa` sidewalks) |
| `watch(ch, target)` | Turns `ch`'s head to the target's head. After `.pose()`, before `.face()` |
| `heroLights(T, st, { rim, rimPower, fill, fillPower })` → `.aim(st, hero, { side })` | A rim light from behind the hero and a soft face fill, following the camera. A rim in the power's colour (`#b4f02e`, cyan, violet) makes the hero look charged. Powers above 60 blow out |
| `powerGlow(T, st, hero, { color, intensity, halo })` → `.update()` | A coloured light on the hero and a halo behind the head. Intensity 0.8–1.5 |
| `screenOf(st, point)` | Where a world point lands on screen, to place a label by hand |

Text, when an option has it: in the shot's `overlay(g, t, info, s)` with `s.T.thumb.tagOn(g, character, s.st.camera, 'STR 0', { fg, size })`,
`.tag`, `.bar`, `.big`, `.panel` (return `T` from `init`).

### Looks

| Feeling | Stage | Notes |
|---|---|---|
| Winning, warm | `look: 'goldenHour'`, `sun: [-0.5, 0.34, -0.8]`, `rays: 1.1` | Sun behind or beside the hero for the flare and the rim; `T.wx.motes`, in fall `T.wx.leaves` |
| Power, secret, danger at night | `look: 'rainNight'` + one `T.W.mirror`, lamps as spots | The hero's own light carries the frame; `faceLight: 0.75` |
| Magic hour, romance, loss | `look: 'dusk'` / `'snowDusk'` | Lit windows and string lights behind, warm rim |
| Bright, open, funny | `look: 'clearDay'` | Needs a strong shape and colour; the weakest look for drama |
| Eerie, time stopped | `look: 'fogMorning'`, shot `"look": "freeze"` | Sun shafts through fog; `T.FX3.frozen` |

Always: `fov` 26–34, `dof: { focus: 2.6, aperture: 0.003, maxblur: 0.016 }`, `faceLight` 0.6–0.8 when the sun is behind the hero,
`"bars": "none"`, `st.fitShadow` on the hero's spot.

### Pitfalls

- A prop in a raised hand must sit clear of the head: offset it from `handWorld('R')` until `--qc` stops reporting "head inside a prop".
- `placeAt` only knows the ground height you give it. A reactor dropped onto a porch, a bush or a car clips: change `u` or `size`.
- Reactors smaller than `size` 0.15 are unreadable at 320 px. Three clear faces beat eight tiny ones.
- Keep the hero's face out of the bottom-right corner (the duration badge) and at least 6 % from any edge.
- Night frames drift to grey: one saturated light (the power's colour) and lit windows.
- If the hero's jacket turns white, halve `rimPower` / `intensity` before touching anything else.

## 3. Render and check

```bash
node render.mjs --project projects/thumb-<slug> --qc
node render.mjs --project projects/thumb-<slug> --thumbs
node tools/thumb_sheet.mjs --project projects/thumb-<slug>
```

- `--qc`: 0 red (bodies through props, heads inside things) before anything else.
- `--thumbs`: `build/thumbs/<id>.jpg` at 1280×720. The project renders at 1440p `max`; while composing set `"resolution": "1080p"`,
  `"quality": "high"` in its `config.json` (about 4× faster) and switch back for the last render.
- `thumb_sheet.mjs`: `build/thumbs/sheet.jpg` (each option large with its idea, then at 320 px) and `OK` / `RED` per option with
  brightness, contrast, colour and blown-out area. Fix every `✗`, read every `!`.
- Then **look at the sheet** against the rules: would a stranger want to know what happens next? Is the hero's face the first
  thing seen at 320 px? Are the options really different? Re-stage weak ones before showing anything.

## 4. Hand over

Send `build/thumbs/sheet.jpg` with one line per option (the moment and the script line) and your pick with the reason. After the
user chooses, copy that JPG to the video's `out/` as `Thumbnail.jpg` (next to the MP4). Suggest testing 2–3 options with YouTube
Studio "Test & Compare" and record the result in `prompts/thumbnail_style.md`.
