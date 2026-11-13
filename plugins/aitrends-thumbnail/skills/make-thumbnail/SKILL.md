---
name: make-thumbnail
description: "This skill should be used when the user runs /make-thumbnail or asks to \"make a thumbnail from this script\", \"design thumbnails for this video\", \"tạo thumbnail từ script\", \"làm thumbnail cho video\", \"thiết kế thumbnail\", \"redo the thumbnail\", or \"give me thumbnail options\" for the What If channel. It reads the script, finds the video's rule and its winning moment, composes each option freely for that script (smug channel hero, the rule as one game-UI layer, roster characters reacting, bright background, at most 3 words), draws them as flat 2D SVG and renders 1280×720 JPGs with a contact sheet and a rule check.\n"
metadata:
  version: "0.1.0"
  author: aiTrends
---

# aiTrends Thumbnail: script → thumbnail options

Every thumbnail is drawn by code: a spec file composes SVG with the kit's helpers, and headless Chromium renders it. No image
model, no stock art, no other channel's characters.

- Rules: `references/thumbnail_rules.md`. Read it before composing.
- Kit: `kit/thumb_kit.mjs` (drawing helpers), `kit/render_thumbs.mjs` (render, sheet, rule check), `kit/example_spec.mjs` (a worked example).
- `${CLAUDE_PLUGIN_ROOT}/skills/make-thumbnail` is this folder.

## 1. Input

Take the script from, in this order: the path the user gave; `<project>/input/script.txt` when they named a studio project;
the script pasted in the chat. Also note the video title if there is one. If there is no script, ask for it; do not compose
from a title alone.

Follow the user's standing instruction on previews: say in a few lines which ideas will be drawn and ask before rendering,
unless they already said to go ahead.

## 2. Read the script

Write these down (in the chat, short) before drawing:

| Item | What to find |
|---|---|
| Rule | The one rule or power, in ≤ 10 words, and how a game would display it (counter, bar, label, price, level, command, timer) |
| Winning moments | 3–5 moments where the hero enjoys the rule with other people watching. Quote the line |
| Reactions | Who reacts in those moments and how. Map each person to a roster role (`ROSTER` in the kit): best friend → `BESTIE`, girl friend → `BRO`, rival → `RIVAL`, classmates → `CLASSMATE*`, `BRO_2`, `RIVAL_2`, adults by job |
| Numbers | Concrete numbers from the script that fit a label (200 kg, ×11, 1 hour, LIVES 1) |
| Words | A ≤ 3-word spoken phrase from the script that is not the title, or none |
| Avoid | The twist or ending (do not spoil), anything in the "Do not" list |

## 3. Compose the options

Draw **3 or 4 options, each a different idea** (a different moment, a different way to show the rule, or a different
reaction). There are no fixed layouts: arrange each picture the way its idea reads fastest. Use a contrast only when the
script has a before/after or me/them, a crowd only when the script has one, a game window only when the rule works like a system.

For every option decide, in this order:
1. Where the hero goes and how big (scale 1.4–1.8; head centre `x, y`; main hero is `smug`, `grin` or `wink`).
2. The single UI layer that states the rule (one kind per picture: labels, or bars, or a window. Not all three).
3. Who reacts, where, with which face, looking at the hero (`look: -1 | 1`).
4. One script prop at most, drawn in the kit's look.
5. Big text, or none.
6. Background that fits the mood and keeps lime readable (not green).

## 4. Write the spec

Create `<project>/thumbs/spec.mjs` (or `D:\aitrends-3d-studio\projects\thumb-2d\<slug>\spec.mjs` when there is no project) by
copying `kit/example_spec.mjs`. A spec does not import the kit; each `draw` receives it as `K`.

```js
export default {
  title: 'What If …?',
  options: [
    { name: 'A', idea: 'which moment and why, one line', bigText: '', bg: 'sun',
      draw: K => `${K.mate({ x: 1090, y: 500, s: 1.15, role: 'BRO_2', face: 'shock', look: -1 })}
                  ${K.hero({ x: 400, y: 440, s: 1.7, expr: 'smug', arms: 'raiseR' })}
                  ${K.tag(1090, 345, 'STR 0', { fg: K.C.RED, size: 56 })}` },
  ],
};
```

Kit helpers (all return SVG strings; frame is 1280×720; characters are placed by the centre of the head):

| Helper | Use |
|---|---|
| `K.hero({ x, y, s, expr, arms, flip })` | `expr`: `smug` `grin` `wink` (main hero), `awe` `sad` (only the "before" half of a contrast). `arms`: `pointR` `pointL` `raiseR` `both` `shh` `chin` `shrug` `crossed`, or `{ R: [from, control, to], L: [...] }` in hero units (shoulders at ±100,170) |
| `K.mate({ x, y, s, role, face, look, flip })` | Roster character. `face`: `shock` `smile` `love` `angry` `meh` `jealous` |
| `K.crowd({ x0, x1, y, n, s, roles, face, lookAt })` | A row of roster extras looking at one point |
| `K.tag(x, y, str, { bg, fg, size, ptr })` | Label over a head. `ptr: false` for a plain plate or a button |
| `K.pill(x, y, str, { icon, bg, fg, size, delta })` | Label with a `heart` / `coin` / `star` icon and an optional "+99" / "-8" |
| `K.bar(x, y, w, pct, { name, col, label })` | Stat or HP bar |
| `K.ring(x, y, n, { r, col, caption })` | Countdown or number ring |
| `K.panel(x, y, w, h, { title, head })` | Game window; draw its content on top |
| `K.cmd(x, y, '/command')` · `K.meter(x, y, lit, { n, name })` · `K.icons(x, y, n, filled, { icon })` | Command line, segmented meter, row of hearts/stars/coins |
| `K.text(str, x, y, size, fill, { anchor, rot })` | Big text with a dark outline |
| `K.split(col, x0, x1, side)` · `K.floor(y, col)` | Put in `under: K => …` for a contrast panel or a floor |
| `K.pile(x, y, w, h, icon)` · `K.sparkle` · `K.glow` · `K.arrow` · `K.glitch()` | Accents |
| `K.prop(svg, x, y, s, rot)` | Places a script-specific prop you draw: flat fills, `K.C.OUT` outline 7–10 px, round joins |
| `bg` | `'sun'` `'sky'` `'candy'` `'royal'` `'mint'` `'fire'` or `{ c1, c2, rays, raysAt: [x, y] }` |

Composition pitfalls (learned on the example):
- Paint order is draw order. Back row first, then the hero, then labels, so labels are never hidden behind hair or arms.
- A raised hand ends at about `x ± 220·s, y − 70·s`. Put the thing it holds or points at there, and keep labels out of the arm's path.
- A label over a supporting head sits at `y_head − 150·s` (size 44–56). Stagger neighbouring labels by 40–50 px.
- `crossed` arms are only in frame when the hero's head is at `y ≤ 330`.
- Keep text and labels ≥ 40 px from the edges and out of the bottom-right corner (the duration badge covers it).
- Supporting characters stay at `s` 0.7–1.2, always smaller than the hero.
- Roles outside `ROSTER` throw an error. Do not invent outfits; pick the nearest roster role.

## 5. Render and check

```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/make-thumbnail/kit/render_thumbs.mjs" --spec <spec.mjs> --out <project>/out --studio D:/aitrends-3d-studio
```

- `--studio` is any folder with `node_modules/playwright` (the aiTrends studio). `--only A,C` re-renders some options.
- Output: `Thumbnail_<name>.jpg` (1280×720) for each option and `thumbnails_sheet.jpg` (every option large, then at 320 px).
- The script prints `OK` or `RED` per option. Fix every red line (`✗`) and re-render; read every warning (`!`).
- Then **look at the sheet yourself** and fix what the check cannot see: a label over a face, a hidden character, a prop
  that does not read, a face that is unreadable in the 320 px row, two options that tell the same idea.

Only show the user the sheet after the check is clean and you have looked at it.

## 6. Hand over

Send `thumbnails_sheet.jpg` with one line per option (the idea and the script line it comes from) and your pick with the
reason. After the user chooses, copy the chosen JPG next to the video's MP4 as `Thumbnail.jpg`, and move the other
renders to the clean-up folder if the user keeps one. Suggest testing 2–3 options with YouTube Studio "Test & Compare".

## Extending the kit

When a script needs something the kit lacks (a new roster role, a new UI element, a hero expression), add it to
`kit/thumb_kit.mjs` in the plugin source (`D:\AI_youtube\plugins\aitrends-thumbnail`) rather than only in the spec, so the
next video has it. A one-off prop stays in the spec.
