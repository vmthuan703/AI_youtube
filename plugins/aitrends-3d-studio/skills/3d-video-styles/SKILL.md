---
name: 3d-video-styles
description: "This skill should be used when the user runs /3d-video-styles or asks to \"show me 3D style options\", \"compare the looks\", \"pick a style for my 3D video\", \"make it warmer / darker / more neon\", \"use black stickmen instead\", \"create a custom style\", or \"change the colour grade\" for an aiTrends 3D Studio video. It renders the same shots of the user's story in the preset styles (pearl, cinematic, soft, ink, toon, golden, neon, noir) and palettes as a comparison grid, records the choice, and builds custom styles.\n"
metadata:
  version: "0.2.0"
  author: aiTrends
---

# /3d-video-styles: render style options and lock the look

Work inside `aitrends-3d-studio/` on the active project (`projects/<slug>`; ask if several exist). References are in
`../make-3d-video/references/`.

## 1. Something representative to show
The grid uses the user's own shots, never the bundled example. If fewer than 3 shots exist, first build (following
`style-bible.md` and `engine-api.md`) `scenes/cast.js`, the 1–2 most-used sets, and: a wide with ≥ 2 characters, a
face close-up with `dof`, and an action or night-exterior shot. Pick one time ~45% into each.

## 2. Render the grid
```bash
node render.mjs --project projects/<slug> --styles pearl,cinematic,soft --at <t1>,<t2>,<t3> --scale 0.5      # add the others if asked: ink,toon,golden,neon,noir
node render.mjs --project projects/<slug> --style pearl --palette tropic --stills <t1>,<t2>,<t3> --scale 0.5   # one palette at a time: dusk, cozy, tropic, alert, school, midnight
```
Open `build/styles/style_grid.png` (one row per style), check it, send it, one line each:
- **pearl — Pearl Dusk:** the channel's look: soft contrast, lifted shadows, pastel dusk, coloured houses, a loud hero.
- **cinematic — Night Toon Cinema:** ivory round heads with lavender shading and an outline, chunky hoodies, purple
  night, warm practicals, serif labels (the "crush" reference).
- **soft — Soft Pastel Glow:** no outline, glossy pastel heads, dreamy purple grade with glow, rounded bold labels (the
  "luck" reference).
- **ink — Ink Stickman:** black stick figures with big white eyes and a lavender rim light.
- **toon — Bright Toon:** cel-shaded daylight cartoon, punchy colours, family-friendly.
- **golden — Golden Hour:** warm orange-and-teal sunset light, nostalgic.
- **neon — Neon Noir:** deep blacks, magenta and cyan rims, glowing signs.
- **noir — Cold Thriller:** cold, desaturated, hard contrast.
Ask which they want (AskUserQuestion).

## 3. Save or customise
- Preset → set `"style"` and `"palette"` in `projects/<slug>/config.json`. To change it for every video, set them in `channel/brand.json`.
- New palette → add an entry to `PALETTES` in `engine/styles.js`: `moods` overrides for the moods this story uses, optional `grade`. The purple stage stays as it is.
- Tweaks → add an entry to `STYLES` in `engine/styles.js`: copy the closest preset, new id + `name`/`desc`, then adjust
  `skin` ('pale'|'ink'|hex), `paleSkin`, `outline`/`outlineW`, `toon` (grey-level ramp or null for soft shading),
  `light` multipliers (ambient, key, fill, rim, practical, exposure), `moods` overrides (sky, ambient, key, rim, wall,
  floor, practical…), `grade` (lift/gamma/gain [r,g,b], sat, contrast, vignette, grain, bloom) and `ui` colours.
  Re-render with `--styles <newid>,<closest> --at …`, iterate, then set it in config.json. `tools/verify_kit.py` will
  report `engine/styles.js` as changed; that's expected.
Shots only follow a style switch if their set colours come from `st.M`/`S()`; fix any hard-coded set colours.
