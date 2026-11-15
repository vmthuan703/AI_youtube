# Shot templates (2.3): routine shots as data

Most shots of a video are routine coverage: establishing a place, wides, two-person dialogue, reactions, eye macros, inserts,
walks and the purple explainer stage. Since 2.3 those are one data line each (`engine/templates3d.js`); only the special shots are
hand-written in batches. Measured on "Helping the Wrong Way" (215 shots): 124 template shots for 12M tokens and 91 hand-made in
batches at ~0.2M per shot, against ~0.76M per shot when every shot was hand-written; the template port renders pixel-identical.

## Files of one video
| File | Who writes it | What |
|---|---|---|
| `scenes/_places.js` | kit-builder | `makeTemplates({...})`: places, cast ids, props, fx, hooks. Starts with `_`, so the loader skips it. |
| `story/tpl_spec.py` | kit-builder | `MANUAL` (special shots and why) + `SPEC` (template entry per routine shot) |
| `scenes/shots/auto_<place>.js` | `tools/gen_shots.py` | one `shotT(id, tpl)` per routine shot. Never edit: rewritten every run. |
| `story/batches.json`, `story/slices/<bid>.json` | `gen_shots.py --batches` | manual shots in batches, each slice with its shots and the template shots around them |
| `story/CHEATSHEET.md` | kit-builder | the only API page the shot batches read (`cheatsheet-template.md`) |

## scenes/_places.js
```js
import { makeTemplates } from '/engine/templates3d.js';
import * as C from './cast.js';
import * as K from './_kit.js';
import { bankAlley } from './sets/bankAlley.js';
const PI = Math.PI, H = PI / 2;
const places = {
  // spot = [x, z, yaw]; y = floor height (or yAt(x, z)); focus = establish target; estDist = establish distance;
  // est = two camera points for interiors [[pos], [pos]]; nightByDefault: night mood when the shot has no look; smokeAt: [x, y, z]
  mainStreet: { y: 0.16, focus: [0, 1.2, -0.6], estDist: 1, spots: { A: [-0.6, -0.5, 0.25], B: [0.6, -0.5, -0.25], C: [1.8, -0.9, -0.4] },
    build(T, st, o, sh) { return T.usa.mainStreet(st, { season: 'fall', wet: sh.weather === 'rain' }); } },
  cafe: { indoor: true, est: [[2.6, 2.5, 4.6], [1.5, 1.7, 3.0]], y: 0, focus: [0, 1.3, 0], estDist: 0.45, spots: { A: [0.2, 1.0, PI] },
    build(T, st) { const set = T.W.cafe(st, {}); const b = set.barista || [-0.6, -1.5, 0]; this.spots.BARISTA = [b[0], b[1] - 0.3, b[2] ?? 0]; return set; } },
  alley: { y: 0, focus: [0, 1.3, -2.5], estDist: 0.75, spots: { A: [-0.6, 1.6, -0.25], DOOR: [-2.0, -2.4, -0.9] },
    build(T, st, o, sh) { return bankAlley(T, st, { wet: sh.weather === 'rain', ...o }); } },   // a project set: return its anchors
  // 'stage' (the purple explainer stage) is built in; define it only to change its spots
};
export const { shotT, PLACES, CAST, EXPR, who } = makeTemplates({
  places,
  cast: { KAI: C.KAI, MIA: C.MIA, OFFICER: C.OFFICER },   // ids used in SPEC and manual shots
  crowd: C.CROWD,                                           // extras: X1, X2, … map onto these roles
  expr: { skeptical: 'unimpressed', soft: 'smile' },       // bible words → engine expressions (optional)
  props: { phone: (T, o) => T.W.phone(o), map: K.upsideMap },   // tpl.prop / cast.hold names
  fx: { police: (T, st) => K.policeLights(T, st, { pos: [0, 3.7, -6.5] }) },   // tpl.fx names ('smoke' and 'dust' are built in)
  glow: (T, st, ch, o) => K.redGlow(T, st, ch, o),          // optional: cast.glow → this video's glow device (o = { k, light, seed })
  bed: { place: K.placeInBed, pose: K.lieInBed },           // optional: cast.bed needs a place whose set returns bedTop
  hero: 'KAI', heroExpr: 'deadpan',                         // the hero idles less and has his own default face
  rec: { cam: 'CAM 03', clock: [22, 7, 0] },                // optional: tpl.rec security-camera frame
});
```
Manual shots import the same things: `import { PLACES, CAST } from '../_places.js'` and build the place with
`const set = PLACES.alley.build.call(PLACES.alley, T, st, {}, info.shot)`, so a place looks the same in every shot.

## story/tpl_spec.py
```python
from gen_shots import c, PI, H          # c(id, at='A', **kw) = one cast entry
MANUAL = {
 's002': 'glass shards macro (slow motion)',
 's048': 'helps her up (hands in contact)',
}
SPEC = {
 's001': dict(kind='establish', fx=['smoke'], cast=[c('KAI', [-4.6, -4.7, 0.3], expr='shocked'), c('MIA', 'B', expr='worried')]),
 's005': dict(kind='dialogue', cam='ots', a='KAI', b='MIA', cast=[c('KAI', face='MIA', expr='determined'), c('MIA', 'B', face='KAI', expr='worried')]),
 's007': dict(kind='reaction', cam='pushIn', cast=[c('KAI', expr=[[0, 'worried'], [1.5, 'sad']])]),
 's010': dict(kind='stage', cast=[c('KAI', 'C', pose='think')], heading='THE RULE', items=[{'kind': 'icon', 'icon': 'eye', 'x': 1460, 'y': 520, 'at': 0.4}]),
 's032': dict(kind='walk', a='KAI', cast=[c('KAI', walk={'from': [-4.0, -0.6], 'to': [3.0, -0.6], 't0': 0, 't1': 5.6}, expr='smile')],
              pills=[{'str': '6 BLOCKS', 'x': 1640, 'y': 150, 'icon': 'house', 'word': 'six'}]),
 's054': dict(kind='insert', at={'anchor': 'billboard'}, dist=6),
}
```
The place comes from the shot's `place` (or `set`) in shots.json; `stage` shots go to the stage.

## tpl fields
| Field | Values |
|---|---|
| `kind` | `establish` `wide` `dialogue` `reaction` `xcu` `insert` `walk` `stage` |
| `cam` | camShot name: `establish` `craneDown` `craneUp` `wide` `full` `high` `lowHero` `medium` `twoShot` `ots` `orbit` `closeup` `pushIn` `xcu` `insert` `track` … (establish/reaction/dialogue keep to their family) |
| `a`, `b` | subject ids (b = second face for twoShot/ots) |
| `side`, `dist`, `fov`, `focus` | camera side (1/−1), distance scale, field of view, establish target `[x, y, z]` |
| `crash`, `punch` | time of a crash zoom / a punch-in |
| `fx` | `smoke`, `dust` (built in) and the project's `fx` names |
| `setOpts` | passed to the place's `build(T, st, setOpts, shot)` |
| `prop` | `{ name, on, hand, wrist, at, yaw, rot, scale, opts }`; insert target `at`: `{hand: 'ID'}`, `{anchor: 'name'}` or `[x, y, z]` |
| `label`, `heading`, `title`, `rec` | day label pill, stage heading, big title, security-camera frame |
| `pills`, `items` | pills `{ str, at, word, x, y, gold, icon, size, end, count }`; items `meter` / `icon` / `tag` |

Cast entry: `{ id, at: 'A' | [x, z, yaw], y, sit, pose: 'stand' | [[t, pose], …], expr: name | [[t, name], …], glow: k | [[t, k], …],
face: '<id>', walk: { from, to, t0, t1, run }, turn: [[t, yaw], …], bed, hold: propSpec, talk: false, still, lookFixed }`.

## What stays hand-made
The first shot, the hook (about the first 20 s), the climax, reveals and twists, anything where hands meet props or people
(help up, hand-over, hug), effects that carry the story (blast, trail, glow change on a beat), screens with footage, and
diagrams beyond a stage with pills. Aim for 45–60% template shots; more makes the video feel samey. Two template shots in a
row should differ in camera, side or distance.

## Known template limits (from the pilot)
- `ots` frames a twoShot from a's side (the shoulder filled half the frame at these head sizes).
- Inserts on a wrist prop and walks shorter than ~1 s were unreliable: make those manual.
- A flashback look halves glows; close framings scale them by 0.55, so the glow does not bloom white.
