---
name: make-thumbnail
description: "This skill should be used when the user runs /make-thumbnail or asks to \"make a thumbnail from this script\", \"design thumbnails for this video\", \"tạo thumbnail từ script\", \"làm thumbnail cho video\", \"thiết kế thumbnail\", \"thumbnail điện ảnh\", \"redo the thumbnail\", or \"give me thumbnail options\" for the What If channel. It reads the script, picks the moments worth a poster, and stages each one as a cinematic 3D still on the aiTrends 3D engine (film light, depth of field, weather, low angle, the channel hero large in the foreground, roster characters reacting behind), with text only where the script needs it, then renders 1280×720 JPGs with a picking sheet and checks.\n"
metadata:
  version: "0.2.1"
  author: aiTrends
---

# aiTrends Thumbnail: script → cinematic thumbnail options

A thumbnail here is a **film still**: one moment of the script staged in a real place with depth, lit like a movie, with the
channel hero large in the foreground. It is rendered by the aiTrends 3D engine (style `cine`, 2.0 or newer), so the hero, the cast
and the sets are the same as in the video. No flat 2D drawing, no image model, no other channel's characters.

- Rules: `references/thumbnail_rules.md`. Read it before composing.
- Kit: `kit/template/` (project skeleton with a worked example), `kit/template/scenes/_thumb.js` (composition and light helpers),
  `kit/new_thumb_project.mjs`, `kit/sheet.mjs`.
- Engine reference: the `make-3d-video` skill's `references/engine-api.md` (stages, looks, sets, poses, faces, effects).
- `${CLAUDE_PLUGIN_ROOT}/skills/make-thumbnail` is this folder. The studio is `D:\aitrends-3d-studio` unless the user says otherwise.

## 1. Input

Take the script from, in this order: the path the user gave; `<project>/input/script.txt` when they named a studio project; the
script pasted in the chat. Note the video title. With no script, ask for it; do not compose from a title alone.

Follow the user's standing instruction on previews: say in a few lines which moments will be staged and ask before rendering,
unless they already said to go ahead.

## 2. Read the script like a poster designer

Write this down (short, in the chat) before building anything:

| Item | What to find |
|---|---|
| Rule | The one rule or power of the video in ≤ 10 words |
| Poster moments | 3–5 moments where the rule is visible in ONE frame and the hero is on top. Quote the line. Prefer the impossible sight (a tire in one hand, a street of people frozen) over a talking scene |
| Place and hour | Where each moment happens and which light makes it strongest (see the looks table) |
| The power, visible | What in the frame shows the power: a prop held wrong, a glow, a colour on the hero, weather, a crowd's state |
| Hero's face | What the hero feels at that moment (rule 2): joy, smug only when winning, hurt, confused, worried… |
| Reactions | Who watches and what they feel. Map each to a roster role |
| Text | Does this moment read without words? If not, the one label, number or ≤ 3-word phrase that completes it |
| Avoid | The twist or ending, and the "Do not" list |

## 3. Choose the options

Stage **3 or 4 options, each a different moment or a different way of seeing the rule**. Vary place, hour and distance, not
just the camera. Text is decided per option from the script: at least one option carries no text at all, and no option carries
more than one text element.

For each option decide: the moment → the set and look → where the hero's head sits and how big → who reacts and where in the
frame → the one light or effect that shows the power → text or none.

## 4. Build the project

```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/make-thumbnail/kit/new_thumb_project.mjs" --slug <video-slug> --script <script.txt> --studio D:/aitrends-3d-studio
```

This creates `<studio>/projects/thumb-<slug>/`. Then edit three files:

- `scenes/cast.js`: the hero and every other character as roster roles with the script's names. Never write an outfit from scratch.
- `story/shots.json`: one shot per option (3 s each, `"thumbAt": 2.5`, `"camera": "manual"`, `"hud": false`), with `"idea"` (the
  moment, one line) and `"text"` (the words on the picture, or `""`). Keep `duration` = 3 × the number of options.
- `scenes/shots/thumbs.js`: one `registerShot` per option. Copy the worked example and change it.

### The order inside `draw()` (always)

```js
s.hero.pose(...).face({ expr: 'smug', look: [0.35, -0.1], t: 0, blink: false, saccade: false });   // 1 pose the hero (expr = the moment's feeling, rule 2)
frameHead(T, s.st, s.hero, { u: 0.34, v: 0.56, size: 0.38, yaw: 0.25, pitch: -0.2 });             // 2 the camera, from where the head should be
s.theo.pose('shocked'); placeAt(T, s.st, s.theo, { u: 0.71, size: 0.22, face: s.hero });            // 3 everyone else, by position in the frame
watch(s.theo, s.hero).face({ expr: 'shocked', t: 0, blink: false, saccade: false });               // 4 heads turn to the hero, then faces
s.lights.aim(s.st, s.hero, { side: -1 }); s.power?.update();                                       // 5 lights follow the camera
```

### Helpers (`scenes/_thumb.js`)

| Helper | Use |
|---|---|
| `frameHead(T, st, ch, { u, v, size, yaw, pitch, roll })` | Puts the camera so `ch`'s head is at screen `(u, v)` (0..1 from top-left) and `size` of the frame height tall. `yaw` orbits round the face (0 = front, ± 0.2–0.6 for a three-quarter view), `pitch` negative = low angle. Focuses the lens on the head |
| `placeAt(T, st, ch, { u, size, ground, face, turn })` | Stands `ch` on the ground so its head appears at screen x `u` with head height `size`. Size is depth: 0.3 right behind the hero, 0.2 mid-ground, 0.12 far. `ground` = the set's floor height (0.16 on `T.usa` sidewalks) |
| `watch(ch, target)` | Turns `ch`'s head to the target's head. Call after `.pose()`, before `.face()` |
| `heroLights(T, st, { rim, rimPower, fill, fillPower })` → `.aim(st, hero, { side })` | A rim light from behind the hero (the bright edge on hair and shoulders) and a soft face fill, both following the camera. `rim` in a power colour (`#b4f02e`, cyan, violet) makes the hero look charged. Powers above 60 blow out |
| `powerGlow(T, st, hero, { color, intensity, halo })` → `.update()` | A coloured light on the hero and a halo behind the head. Intensity 0.8–1.5 |
| `screenOf(st, point)` | Where a world point lands on screen, to place a label by hand |

Text, when an option has it, goes in the shot's `overlay(g, t, info, s)` with the engine's `s.T.thumb.tagOn(g, character, s.st.camera, 'STR 0', { fg, size })`,
`.tag`, `.bar`, `.big` or `.panel` (return `T` from `init` to reach it).

### Looks (pick by the feeling of the moment)

| Feeling | Stage | Notes |
|---|---|---|
| Winning, warm, "life is good" | `look: 'goldenHour'`, `sun: [-0.5, 0.34, -0.8]`, `rays: 1.1` | Put the sun behind or beside the hero for the flare and the rim; add `T.wx.motes` and, in fall, `T.wx.leaves` |
| Power, secret, danger at night | `look: 'rainNight'` + `T.W.mirror` on the road, lamps as spots | The hero's own light (`powerGlow`, a coloured rim) carries the frame; `faceLight: 0.75` |
| Magic hour, romance | `look: 'dusk'` or `'snowDusk'` | Lit windows and string lights behind, warm rim |
| Bright, open, funny | `look: 'clearDay'` | Needs a strong shape and colour in frame; the weakest look for drama |
| Eerie, time stopped | `look: 'fogMorning'`, shot `"look": "freeze"` | Sun shafts through fog; `T.FX3.frozen` droplets |

Always: `fov` 26–34 (a longer lens flatters the big heads), `dof: { focus: 2.6, aperture: 0.003, maxblur: 0.016 }`, `faceLight` 0.6–0.8
when the sun is behind the hero, `bars: "none"`, `st.fitShadow` on the hero's spot.

### Pitfalls (learned on the example)

- A prop in a raised hand must sit clear of the head: offset it from `handWorld('R')` until `--qc` stops reporting "head inside a prop".
- `placeAt` only knows the ground height you give it. A reactor dropped onto a porch, a bush or a car clips: change `u` or `size`.
- Reactors smaller than `size` 0.15 are unreadable at 320 px. Three clear faces beat eight tiny ones.
- Keep the hero's face out of the bottom-right corner (the duration badge) and at least 6 % from any edge.
- Night frames wash out toward grey: give them one saturated light (the power colour) and lit windows.
- Raw light powers are sensitive. If the hero's jacket turns white, halve `rimPower` / `intensity` before touching anything else.

## 5. Render and check (in the studio folder)

```bash
node render.mjs --project projects/thumb-<slug> --qc
```

```bash
node render.mjs --project projects/thumb-<slug> --thumbs
```

```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/make-thumbnail/kit/sheet.mjs" --project projects/thumb-<slug>
```

- `--qc` must report 0 red (bodies through props, heads inside things). Fix and re-run before anything else.
- `--thumbs` writes `build/thumbs/<id>.jpg` at 1280×720. The template renders at 1440p `max` for the final pass; while composing,
  set `"resolution": "1080p"`, `"quality": "high"` in `config.json` (about 4× faster) and switch back for the last render.
- `sheet.mjs` writes `build/thumbs/sheet.jpg` (each option large with its idea, then at 320 px) and prints `OK` / `RED` with
  brightness, contrast, colour and blown-out area. Fix every `✗`; read every `!`.
- Then **look at the sheet** and judge it against `references/thumbnail_rules.md`: does each option make someone want to
  know what happens next? Is the hero's face the first thing seen at 320 px? Are the options really different? Re-stage weak ones.

Only show the user the sheet after QC is clean and you have looked at it.

## 6. Hand over

Send `build/thumbs/sheet.jpg` with one line per option (the moment and the script line it comes from) and your pick with the
reason. After the user chooses, copy that JPG next to the video's MP4 as `Thumbnail.jpg`. Suggest testing 2–3 options with
YouTube Studio "Test & Compare".

## Extending

A helper every thumbnail could use goes into `kit/template/scenes/_thumb.js` in the plugin source
(`D:\AI_youtube\plugins\aitrends-thumbnail`); re-running `new_thumb_project.mjs` on an existing project refreshes only that file.
A set, prop or effect the engine lacks belongs in the 3D studio plugin, not here.
