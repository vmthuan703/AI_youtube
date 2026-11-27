# Rulebook and director's notes

## Rulebook (`rules/`)
- `rules/RULES.md`: the rules for people (R01 every hit leaves a mark, R02 damage stays, R03 character size, R04 HUD inside the
  frame, R05 no lip-sync on narration, R06 flying reads as flying), each with what must be visible, the helper and the source.
- `rules/rules.json`: the machine side: `triggers` (regex on the spoken words + the shot's scene text) and `helper` (the shot code
  must contain one of them). Rules without triggers are checked by eye.
- **Before production** (Phase A step 6): `python tools/rules_check.py --project projects/<slug> --plan` writes `"rules": [...]`
  into every shot of shots.json and prints only the rules this episode uses. R02 is added to later shots in a set after an R01 shot.
  Hand-added ids ending in `!` (`"R06!"`) survive re-runs.
- **Before render** (Phase B gate): `python tools/rules_check.py --project projects/<slug>` prints `MISSING sXXX: R01 …` for a
  tagged shot whose code lacks the helper, `NOTE …` for every open director's note, and one `RESULT` line. Shot code = the
  `registerShot` body, or a table call (`auto('s045', …)`, `bk('s054', …)`) plus the functions and constants it names, two levels deep.
- Triggers must be narrow: a broad word ("hits") tagged a bunker line in the pilot and spread R02 to 44 shots. Test a new trigger
  with `--plan` and read the counts it prints.

## Director's notes (`tools/review.mjs` + `review.html`)
`node tools/review.mjs --project projects/<slug> [--port 5178] [--video out/x.mp4]` serves a page (no dependencies) with the
newest of `out/*.mp4`, `build/preview.mp4` or `build/video_silent.mp4`, a strip of shots, and the notes.
- Keys: **N** pauses and focuses the note box at the current second (the note is tied to the shot under it), **Ctrl+Enter** saves,
  Space plays/pauses, `,` and `.` step one frame.
- Each note has a scope (`shot` = this shot only, `rule` = a general rule for every episode) and a kind (fx, acting, camera,
  colour, timing, sound, character, story). Saved in `story/notes.json`.
- Fixing: work by shot id, re-render only the changed shots (`--sheet --changed`, `--qc --only`), then mark the note done with how
  it was fixed (the page's "xong" box, or `"status": "done"` in notes.json; add how it was fixed to the note text).
- A `rule` note becomes a rulebook entry only with the user's yes: a new id in RULES.md (text, what must be visible, helper,
  source `U <date>: "<their words>"`) + rules.json (narrow triggers, helper). Write a helper in `engine/` when the fix is reusable
  (as `engine/consequence.js` came from "every hit must leave a mark").
- The user is often on a phone over Remote Control: the page works narrow (stacked below 900 px), but the server runs on this
  machine; if they can't reach it, collect notes in chat as `mm:ss note` and write them into notes.json yourself.
