# Set match (1.0.5): what the kit has before any shot is built

## The catalogue
`engine/catalog.json` lists everything ready-made: `sets` (66), `props`, `actions` (T.act, motion helpers, named poses) and `fx`
(time of day, weather, effects). Each entry has an `id`, the `call`, a Vietnamese name `vi`, `aliases` in English and Vietnamese
(the words a script uses), `tags`, the `anchors` it returns, signature `props`, and for sets a `demo` recipe (stage mood or
`time`, options, camera preset). `names` holds the short names past videos gave their own versions (`hall`, `frontPm`); they only
help `--scan-projects`. `prefer` on a basic entry points to the richer set (room kind bedroom → `teenBedroom`).

- `python tools/set_match.py --list sets|props|actions|fx` prints it.
- `node render.mjs --catalog` renders one still per set into `examples/catalog/build/sheets` (24 per contact sheet, with the
  Vietnamese name and the call). `--catalog id,id` renders only those.
- `python tools/set_match.py --verify-catalog` checks every call exists in the engine and every set has a demo; `verify_kit.py`
  runs it. **Whenever a set, prop or action is added to the engine, add its catalogue entry in the same commit.**

## needs.json (Claude writes it after reading the script)
```json
{"places":  [{"name": "abandoned warehouse", "quote": "You hide in the old warehouse by the river.", "desc": "dark, crates, one hanging bulb, river door"}],
 "props":   [{"name": "pickle jar", "quote": "You open every jar in the kitchen."}],
 "actions": [{"name": "carry three people", "quote": "carrying three defenders at once"}],
 "fx":      [{"name": "rain storm", "quote": "A storm is rolling in"}]}
```
- One entry per distinct place (a school kitchen and a home kitchen are two). Name it in plain English, the way the script would.
- Props: only those the narration names or the story turns on. Actions: only movements beyond walk / talk / stand.
- `desc` is what makes it readable on screen; it also drives the substitutes for a missing place.

## Reading the report
| Mark | Meaning | What happens |
|---|---|---|
| ✅ | an alias covers most of the name | use the entry as it is (`use` id) |
| 🟡 | one entry covers part of it | use it and adjust in the video (colours, props, light), or pick one of the `alts` |
| ❌ | nothing close | the user chooses: plugin, project or use:<id> |

The tool matches words, so read every line: a ✅ can still be wrong for the story (a "cafeteria kitchen" is not a home kitchen).
Change needs.json or decide `use:<id>` yourself for 🟡 items; ❌ items are the user's call.

## Decisions and gates
```bash
python tools/set_match.py --project P --decide "abandoned warehouse=plugin" --decide "pickle jar=project" --decide "bike=use:scooter"
python tools/set_match.py --project P --added "abandoned warehouse=warehouse"   # after the plugin update brought T.W.warehouse
python tools/set_match.py --project P --check    # exit 1 while a ❌ has no decision, or a plugin item is not in the catalogue yet
python tools/set_match.py --project P --shots    # every shots.json "set" is a catalogue set or a project set
```
Decisions survive a re-run of the match (they are kept by name).

## Adding a set to the plugin
- Put it in an engine module for its theme (or a new `engine/<topic>15.js` exported from `world3d.js`), returning anchors like
  the other sets (`seat(i)` → [x, z, yaw, seatY], tops [x, y, z]); mark moving parts `userData.dynamic`.
- The 1.0 look: contact shadows, `aoStrip`, practical lights, a mirror floor where it shines; 4–8 signature props.
- Catalogue entry with aliases in both languages and a demo recipe; `--verify-catalog`; `--catalog <id>` stills for the user.
- Document it in `references/engine-api.md`; add the file to `tools/verify_kit.py`.

## The wishlist (`channel/set_wishlist.json`)
"Build only in this video" and "plugin" choices are written there with the video's name. The report lists items wanted by two or
more videos as "should move into the plugin". `python tools/set_match.py --scan-projects` reads the `set` names of past videos'
shots.json, shows which the catalogue already covers, and adds uncovered ones used by ≥ 2 videos. The lesson book
(`tools/retro.mjs`) shows the wishlist next to its seasonal set ideas.
