# Shot plan → shots.json → shots (Phase A step 5, Phase B)

## 1. The plan file (`scripts/<slug>_plan.txt`)
One line per picture change: `para | anchor | SET | cam | scene`
- `para`: paragraph index of the VO script (0-based, the order of `timeline/lines.json`).
- `anchor`: the words the shot starts on (`^` = the paragraph's first word). Use 2–3 word phrases: one word matches too early
  ("your" in "open your eyes"). Anchors are searched in order inside the paragraph.
- `SET`: a key of `PLACES` (see §4) or a 2D kind: `BLACK` (black stage, pill only), `CARD` (sepia flashback card), `LAB` (science card).
- `cam`: `wide low med cu xcu ots top insert hud black pov track card`.
- `scene`: what we see, for humans and for the rule triggers (write "beam", "explodes", "flying" when it happens).

```
# header comments list the sets and cams of this episode
0|^|RUIN|pov|black, eyelids open on a tilted view from the ground
2|So why|RUIN|hud|push in on the clock over the boy's head
2|forty-seven seconds|BLACK|black|clock pill 00:00:47 alone on black
5|A beam|RUIN|low|road level: the beam sweeps where his head was, breaks the walls (R01)
```

Pacing (measured on the reference channel): ~25 cuts/min, median 1.9 s, ~20% under 1 s; the hook holds the first picture 5–7 s,
then a burst of 0.3–0.7 s cuts when the rule is revealed; long holds (5–8 s) only for top-down reveals, quiet emotion, flashbacks.
Write ~90% of the cuts yourself (where the picture changes); the tool adds the rest.

## 2. `tools/plan_to_shots.py`
`python tools/plan_to_shots.py --project projects/<slug> --plan scripts/<slug>_plan.txt --cpm 25`
- Each cut lands 0.06 s before its anchor word, mid-sentence where the picture changes (64% of the reference cuts are mid-word).
- Then the longest shots (> 2.6 s, not `black`) are split at the word nearest their middle with a tighter camera (`wide→med→cu→xcu`)
  until the cut rate is reached; split shots get `"split": true` and "(closer)" in the scene text.
- Writes `id, start, end, line, scene, set, camera, look (from the set), split`; prints cuts/min, median, % under 1 s, longest shot.
  Pilot: 216 plan lines → 228 shots, 25.0 cuts/min, median 2.37 s, 4% under 1 s (slower than the reference: write more short
  cuts into the plan for the hook and the climax instead of relying on splits).
- Re-running rewrites shots.json from the plan: do it before any shot code depends on ids.

## 3. `auto()` shots (`engine/ink/auto.js`)
Most shots are one line: a place, a blocking, a framing and the pills. Per project:
```js
import { auto, BLOCK, CAST, PILL } from '/engine/ink/auto.js';
import * as C from '../cast.js';
Object.assign(CAST, C);                                   // role name -> outfit
Object.assign(PILL, { MOM: '17 YEARS 4 MONTHS' });        // default pill text per role (HERO never has one)
BLOCK.radio = { MOM: { at: [-6.7, -3.3], yaw: 0.9, pose: 'sit' }, HERO: { at: [-4.4, -1.4], yaw: -2.3, expr: 'nervous' } };
auto('s045', { block: 'radio', a: 'MOM', b: 'HERO', expr: { MOM: 'surprised' } });
auto('s046', { block: 'radio', a: 'MOM', cam: 'closeup', pills: { MOM: (info, t) => t < 1 ? '17 YEARS' : '2 DAYS' }, red: ['MOM'] });
auto('s047', { place: 'BUNKER', block: 'radio', a: 'MOM', cam: 'closeup', card: true });   // sepia flashback over a 3D frame
```
- The camera name defaults from shots.json (`med → medium`, `cu → closeup`, `low → lowHero`, `top → high`, `hud` = push-in on a's
  pill). Override with `cam: 'xcu'`, keyframes `cam: [[0, {pos, look}], ['end', {pos, look}]]` or a function.
- `cast: { ROLE: {...} | null }` changes one shot's blocking; `only: ['ROLE']` keeps just those roles (cleaner HUD close-ups).
- Pills: tight framings show only a's and b's pills (far pills land on near bodies); xcu hides a's pill; close framings lift the
  camera so the pill stays in frame (R04). `hide: ['ROLE']` hides a pill; `pillSize` sets the size.
- Extras per shot: `init(s, T, info)`, `act(s, t, info, T)` (props, movement), `overlay(g, t, info, s)` (2D on top).
- Wrap repeated patterns in the project (`const bk = (id, sp) => auto(id, { block: 'night', ...sp })`); `rules_check` follows
  wrappers two levels deep.
- People lying down: the named cameras aim at standing heads; use keyframes near the head instead.

## 4. Sets (`engine/ink/sets.js`, `PLACES`)
Ready: `RUIN`/`FIELD` ruined pastel street (`DRAIN` gap, `facadeHit(set, side, z, y)` → a wall point for hits), `BUNKER`/`BUNKER_N`
shelter (spots `BK`: MAP, RADIO, DOOR, MIRROR, BULBS; bulb 0 flickers; a doorway + corridor on the right wall), `SEWER` (`SW`),
`PARK` ruined fairground with a Ferris wheel whose bulbs can light (`PK`), `CTRL` control room (`CT`), `DOOR_N` shelter door at
night (`DN`), `SKY` (`SKY_Y`). The steel-door logo reads `INK_SET.logo` (set it per episode). An episode's own set: a function
`(T, st, o) => { ...build...; return { spots, update(t) } }` in `scenes/_places.js`, then `PLACES.LAB = (T, st) => lab(T, st)`.
Every look comes from the set: `inkRuin` outdoors, `inkWarm` warm interiors, `inkDark` night/underground, `inkDay` daylight.

## 5. HUD and 2D (`engine/ink/hud.js`)
- `clockAt(T, s, ch, cam, key, lift)` in `draw` **after** the camera is placed (it updates the camera matrix), then
  `headPill(g, s[key], text, { red, size })` in `overlay`. `hms(sec)` → `00:00:47`. Numbers change exactly on the spoken word:
  take the time from `timeline/words.json` (`info.globalT`).
- `BLACK`: draw the pill alone, large, on black. `CARD`: `auto(..., { card: true })` or `sepia(g, t)` over any frame. `LAB`:
  a hand-drawn diagram in `overlay` (stopwatch, bars, a net), flat colours with the ink colour `#1c1830` for lines.
- `lids(g, t, t0, dur)`: eyelids opening from black (POV wake-up).

## 6. Hits and damage (`T.CQ`, rules R01/R02)
`T.CQ.impact(T, st, { pos, normal, t0, size, linger })` → flash, breach, chunks, dust, `hit.shake(cam, t)` after the camera.
`T.CQ.beamSweep(T, st, { from, to, t0, dur, origin, hits: [{ pos, normal, size }] })` breaks every wall it crosses.
`T.CQ.scar(T, st, { pos, normal, size })` in every later shot of the same place. Example: `examples/ink-demo` s003/s004.

## 7. QC
`node render.mjs --project projects/<slug> --qc --only s045,s046` → 0 red per batch. Intended cases go in the shot:
`registerShot(id, { qcIgnore: ['clip'] })` / `auto(id, { qcIgnore: ['clip'] })` (a dive through a drain, a body in a bed).
Sprints: `T.walkPose3(phase, { run: true })` at ~1.4 Hz; slower walks ~1.2 Hz, or the motion QC flags foot slides and jerks.
