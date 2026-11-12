# Set match (1.0.5)

SKILL.md Stage 1b holds the steps. Read this file only for the needs.json schema or when adding a set to the plugin.

## needs.json
```json
{"places":  [{"name": "abandoned warehouse", "quote": "You hide in the old warehouse by the river.", "desc": "dark, crates, one bulb"}],
 "props":   [{"name": "pickle jar", "quote": "You open every jar in the kitchen."}],
 "actions": [{"name": "carry three people", "quote": "carrying three defenders at once"}],
 "fx":      [{"name": "rain storm", "quote": "A storm is rolling in"}]}
```
- One entry per distinct place (a school kitchen and a home kitchen are two), named in plain English.
- Props the narration names or the story turns on; actions beyond walk / talk / stand; `desc` = what makes it readable on screen.

## Marks
✅ an alias covers most of the name (use it) · 🟡 one entry covers part of it (use it and adjust, or `use:` an alt) · ❌ nothing
close (the user decides). The tool matches words: a ✅ can still be wrong for the story. Decisions are kept by name across re-runs.

## Commands
`--decide "<name>=plugin|project|use:<id>"` · `--added "<name>=<id>"` (set is in the studio) · `--check` / `--shots` (render.mjs
runs both) · `--pending` / `--released` (the one plugin release after the video) · `--scan-projects` (past videos' sets →
wishlist) · `--list sets|props|actions|fx` · `--verify-catalog` (verify_kit runs it).

## Adding a set
- Put it in the engine module for its theme (or a new `engine/<topic>15.js` exported from `world3d.js`). Return anchors like the
  other sets (`seat(i)` → [x, z, yaw, seatY], tops [x, y, z]); mark moving parts `userData.dynamic`.
- The 1.0 look: contact shadows, `aoStrip`, practical lights, a mirror floor where it shines; 4–8 signature props.
- Add the catalogue entry in the same commit: `id`, `call`, `file`, `since`, `vi`, `aliases` (English and Vietnamese script words),
  `tags`, `anchors`, `props`, `demo` (`stage` mood or `time`, `opts`, `cam` preset room|hall|street|beach|big|huge|stage|phone or
  `[[pos], [look], fov, [heroX, heroZ]]`, `hero: false`). Short names past videos used go in `names`.
- `python tools/set_match.py --verify-catalog`, `node render.mjs --catalog <id>`; open that still yourself, fix, send it.
- Document it in `references/engine-api.md`; add the file to `tools/verify_kit.py`.

## Wishlist
`channel/set_wishlist.json`: "project" choices (status wanted, with the videos that needed them), sets in the studio waiting for
release (status studio), released ones (added). The report and the lesson book list items wanted by ≥ 2 videos.
