# Characters — `T.character(outfit, {pose, expr, seed})` (engine/rig3d.js)

Part of the engine reference (`../engine-api.md`). Grep it for the call you need instead of reading it all.

Outfit (put them in `scenes/cast.js`, one per recurring character, never change them mid-video). The channel hero lives in `/channel/cast.js`; add the script's name for them:
```js
import { HERO as CHANNEL_HERO } from '/channel/cast.js';
export const HERO = { ...CHANNEL_HERO, speaker: 'JAY' };                                   // quilted lime puffer, platinum anime hair; 'speaker' = name in the script
export const NOAH = { ...RIVAL, speaker: 'NOAH' };                                         // import { HERO as CHANNEL_HERO, RIVAL, NURSE } from '/channel/cast.js'
export const PATEL = { ...NURSE, speaker: 'NURSE PATEL' };                                 // a role from the roster: the costume already says the job
export const MAYA = { top: 'hoodie', color: '#8d4a6b', hair: 'fringe', hairColor: '#34262c', scarf: '#9c7a3a', lashes: true };   // a new character: own hair, one detail, a deep muted colour
export const BOSS = { top: 'suit', color: '#22222a', tie: '#5e2230', face: 'sunglasses', legs: '#22222a', shoes: '#111111', scale: 1.15 };
```
`skin` 'pale' | 'ink' | '#hex' (default from the style) · `eyes` 'dot' | 'big' · `top` hoodie | tshirt | jacket | suit |
dress | labcoat | vest | puffer | none · `color`, `color2` (trim, quilting seams), `shirt`, `tie`, `strings` · `pop` 0–1 self-lit cloth, keeps a loud outfit loud in dim sets (puffer default 0.35) · `speaker` name in the script (bubbles) · `legs` pants colour | 'shorts:#hex' |
null (bare stick legs) · `shoes` colour | null (round feet), `shoeSole` · `gloves` colour (default: ball hands in skin) ·
`head` cap | capBack | beanie | hood | headband | tophat | crown, `headColor` · `hair` anime (tall crown, the hero's) | animeLow (same look, lower) | short | messy | spiky | curls | quiff | sidePart | slick | bob | fringe | long | sidePony |
ponytail | pigtails | bun (soft hairlines, `engine/hair3d.js`), `hairColor`, `hairShade` (anime only: the shadow between locks), `bow` (colour) · `skirt` (colour, any top) · one-detail accents, each a colour: `sleeves`, `stripe`, `scarf`, `collar`, `bag` · `blush`
(true | colour) · `lashes: true` · `face` glasses | sunglasses · `kid: true` (74% size) · `scale` · `outline` (colour | false) · `pose` (the resting pose when none is given).

**Role roster** (`/channel/cast.js`, all in muted colours next to the hero): friends and family `BESTIE` (the hero's best friend, a girl), `BRO` (1.0: girl friend, long black hair, pink dress, slightly self-lit), `RIVAL`, `CLASSMATE`,
`MOM`, `DAD`, `GRANDPA`, `GRANDMA`, `LITTLE_SIB`; school `TEACHER_F`, `TEACHER_M`, `TEACHER_VN` (áo dài), `PRINCIPAL`, `COACH`; hospital and emergency `DOCTOR`, `NURSE`,
`PARAMEDIC`, `POLICE`, `FIREFIGHTER`; town `GUARD`, `CHEF`, `CASHIER`, `SCIENTIST`, `WORKER`, `REPORTER`, `SHADY`. `ROLES` maps script words to a role
("nurse" → `NURSE`). Old names still work (`FRIEND` = `BRO`, `GIRL` = `CLASSMATE`, `GIRL2` = `BESTIE`, `STRANGER` = `SHADY`, `PARENT`, `TEACHER`).
More teens: `CLASSMATE_2` (navy, bob, scarf), `CLASSMATE_3` (olive, bun, glasses), `BRO_2`, `RIVAL_2`, and `STUDENTS` (six background kids, pick by index).
**Every character, named or not, is a roster role**: `{ ...ROLE, speaker }`, changing a colour or the hair only when two of them share a scene and look alike.
Never write an outfit from scratch; `python tools/cast_check.py --project P` fails on one.

**Role details** (engine/costume3d.js; colours unless noted): `top` scrubs (V-neck, matching pants) | aodai (long tunic, mandarin collar, over `legs`) ·
`labcoat` is muted off-white `#d2d3da` (set `color` to change) · `head` nurseCap | policeCap | chefHat | hardhat | fireHelmet (all hats, caps included, cast no shadow on the face) ·
`hair` balding (a grey ring in `hairColor`) | lowBun · `mustache`, `beard`, `brows` (3D brows that stay on: older faces) · `lanyard` + `card`, `whistle`, `stethoscope: true`,
`badge` (gold shield), `nameTag`, `patch` ('SECURITY', 'EMS': text on the chest), `epaulettes`, `belt` + `radio: true`, `bands` (two reflective torso bands), `hiVis` (vest),
`apron`, `buttons` + `buttonRows: 2` + `buttonsTop`, `vee`, `goggles: true` (on the forehead) · `belly` (1.1–1.2) · `skirtLen` (longer skirt or shorter coat, e.g. 1.7 / 0.72) ·
`prop` cane | book | clipboard | mic | torch | medbag, `propHand` 'L' | 'R' (the cane stands on the floor: use pose `hunchCane`).

Methods (all return the character, so they chain):
- `.place(x, y, z, yaw)` (yaw 0 faces +z, toward a default camera; π/2 faces +x), `.faceTo(x, z)`.
- `.pose(p)`: a name from `T.POSES3`, a pose object, `T.posesAt3(t, [[0,'stand'],[0.8,'point'],[2,'shrug']], blend, { lively })`: each change
  dips back a little first, passes the target and settles (`ease.back`), and the body moves in order (hips and legs, then the spine 35 ms
  later, the arms 60 ms, the head 90 ms). `lively` 0 = the old even blend, 1 default, 1.5 cartoon snap. It also carries the pose 0.1 s
  earlier, so the hair lags a turn of the head and the body stretches a little on fast rises and drops.
  `T.walkPose3(phase, {run, sprint, lean})`, `T.breathe3(pose, t, k, seed)`, `T.blendPose3(a, b, k)`.
- **2.0.1 body (build 2, the default on `cine`):** same head and face, longer legs (`T.BODY2`: hips 0.74, about 3.45 heads), wider
  shoulders, a waist, tapered thighs and shins. Gait (`T.walkPose2`, picked by `walkPose3`/`walkTo`): planted feet with heel strike →
  toe-off, hip drop and sway, chest counter-turn, pendulum arm swing (walk +16°/-20°, elbow 10–30°; run elbow ~90°, hands to chest),
  a flight phase when running, speed-up/settle at the ends of `walkTo`, step-turns in `turn3`, weight shift in `idle3`. Seated and
  low poses keep their seat height. Old body: `{ ...outfit, build: 1 }`, style `pearl` or `render.mjs --legacy`; `walkPose3(ph, { v2: false })`.
  Known limit: `sitDown` into a seat with a desk right in front can clip the thighs; place the character seated instead.
- Body and contact helpers (engine/motion3d.js, 0.2.8):
  `T.body3(pose, t, kind, amount, { t0 })` layers living movement on any pose: 'pant' (out of breath), 'sob', 'laugh', 'shiver', 'nod', 'shake' (no), 'sigh' (once from t0),
  'strain' (trembling effort), 'fidget' (nervous). Use it in every held emotional beat instead of a frozen pose.
  `T.reachPose({ grip: [height, distance], width, squat, scale, lean })` → hands gripping something in front (lifting a car, pushing a door, holding a beam).
  **Contact rule:** whoever lifts, pushes or holds a thing must stand within reach of it (0.25–0.45 m in front), with the grip on its real edge; if the
  object moves, recompute the grip from it every frame. A character a metre away with hands in the air reads as "nothing is being lifted".
  `T.armWrestle(k, { t, strain, reach })` → { a, b } seated poses, right hands gripped over the table, k −1..1 (+1 a wins). Sit them at tableZ ∓ 0.6 and film
  from the side, low and level with the table (camera ~3 m away, y ≈ 1.0); from behind a player the big heads hide the hands.
- Acting helpers (engine/motion3d.js): `T.idle3(pose, t, {seed, k, weight, glance})` (breathing plus a weight shift between the legs and a
  slow glance now and then: use it on everyone standing or sitting, `k: 0.5` for the hero's deadpan holds) · `T.speak3(pose, speaker,
  globalT, {k, hand})` (a nod on each of the speaker's words, a bigger one and a free-hand beat on long words and numbers) ·
  `T.lookAtSpeaker(ch, {MIA: s.mia, …}, globalT, {blend})` (after `.pose`: the head turns to whoever talks and back, never snapping) ·
  `T.walkTo(ch, t, {from, to | path, t0, t1, run, sprint, idle, end, yaw0, yaw1, y, accel})` (moves and turns the character and returns the
  pose: speeds up and slows down, cadence from the distance covered so the feet don't slide, the stride grows out of `idle` and settles into `end`).
- `.face({ expr, talk, blink: true, t, look: [x, y], speaker, gt, saccade })`: expressions `neutral smile happy joy smirk smug determined
  angry surprised shocked scared worried nervous sad cry sleepy thinking confused awe evil dead deadpan unimpressed`, or a custom
  `{eye:{open, lid, low, pupil, closed, sparkle, tears}, mouth:{type, w, open, curve}}`. **`expr` may be keys** `[[0, 'deadpan'], [1.2, 'shocked']]`
  (with `t`): each change blends in 0.16 s (`exprBlend`), eyes close down and open through a squint, and the eyes blink on the change.
  `blink: true` blinks 2.2–5.5 s apart with the odd double blink (a number 0..1 closes the eyes that far). Without `look` the eyes make small
  darts every 0.7–2 s (`saccade: false` holds them still, a number scales them). `speaker` + `gt` (= `info.globalT`) shape the mouth from the
  letters being spoken (a/e/i open, o/u/w round, m/b/p closed); `talk` still takes a number or `T.talkShape(...)`.
- `.lookAt3([x, y, z], k)` turns the head toward a world point (after `.pose`; `k` < 1 blends from the pose's head angle). `.lookAngles(p)`
  returns the [pitch, yaw] it would use.
- `.hold(obj, 'L'|'R', {pos, rot})` attaches a prop to a hand. `.headWorld()`, `.handWorld('L')`, `.chestWorld()`.
- `.setOpacity(a)`; `.parts` = { body, pelvis, chest, head, neck, hands, feet, … } for special effects.

Poses: `stand relaxed confident handsInPockets talk explain point pointUp pointAtViewer wave cheer fistPump handsOnHead
facepalm think crossArms crossArmsAngry crossArmsLean armsBehindHead shrug scared shocked sad phone phoneEar holdFront reach ready fight punch kick crouch kneel kneelBoth kneelSad kneelPlead sitBed sitBedSad sitBedPhone sitFloor hugKnees liftSquat liftOverhead pushHeavy
sit sitBack sitDesk lie jump fall superLand flexL hunch hunchCane handsOnHips handsOnBelt holdMic`; 1.0.1 school: `raiseHand sitRaiseHand sleepDesk passNote
copyPeek sitSlouch writeBoard holdBooks holdTray oneStrap dialLocker slamLocker holdUmbrella shareUmbrella throwWind throwRelease carryBall pomHigh pomLow
capToss duckCover sitBleacher sitBooth atPodium` (seated ones at chair height 0.42; sitBooth / sitBleacher rest the hands on a table / the knees). `ch.wear(obj)` puts a
grad cap, crown or party hat on the head. Blends between an angle limb and an IK limb (`{ to }`) are smooth since 1.0.1; keep pose
changes at 0.35 s or more (posesAt3 blend) and walk at 1.2–1.5 m/s (walkTo distance / time) or the feet slide. A pose object:
`{ y, hips:[pitch,yaw,roll], spine:[…], head:[…], armL:[raise, az, bend, twist] | {to:[x,y,z], pole}, armR, legL:[lift, side,
knee, twist] | {to}, legR, handL:'fist'|'open'|'point'|'relaxed', handR }` in degrees. Pitch + leans/nods forward, yaw +
turns to the character's left, arm raise 0 = hanging, 90 = horizontal, 180 = up; az 0 = forward, 90 = sideways. `{to}`
uses IK in character space (metres, +z forward, y up; shoulders at y ≈ 1.02 and x ≈ ±0.18, hips at 0.62). Copy and edit:
`{ ...T.POSES3.sit, armL: { to: [0.1, 0.95, 0.35] }, handL: 'open' }`.

Walking/running: phase = t × 2π × cadence (walk 0.9, run 1.4, sprint 1.9 Hz); move the character at about 1.3 / 4 / 9
m/s × scale. Super-speed: sprint + `T.FX3.speedLines` + `T.FX3.ghosts` + camera shake.

Lip-sync: only characters who speak a quoted line, with `face({ speaker: 'JAKE', gt: info.globalT })` (or `talk: talkFor('JAKE',
info.globalT)`, the mouth opening alone). The TTS word timeline knows who speaks each word; `speakerAt(globalT)` (core.js) says who is
talking now and since when. The narrator is never lip-synced.

Body: 1.75 m tall incl. a 0.54 m head (≈ ⅓); hips 0.62 m; head centre ≈ 1.45 m; a seat is 0.4 m high (`T.W.chair`),
a table 0.76 m. Raised-arm poses (cheer, wave, pointUp) open sideways so the big head stays visible.


## 2.2: a new role for this video (cast match ❌ / 🟡)
`tools/cast_match.py` prints the line to start from. Write it in `projects/<slug>/scenes/roles_new.js`, one role per line, always
spreading a roster role first, and import it in `scenes/cast.js` like a roster role:
```js
import { WORKER, GRANDMA } from '/channel/cast.js';
export const ASTRONAUT = { ...WORKER, top: 'jacket', color: '#e8e8ec', legs: '#e8e8ec', head: null, hiVis: null, patch: 'NASA', scale: 1.1 };   // role: astronaut
export const QUEEN = { ...GRANDMA, color: '#5a2a6a', skirt: '#5a2a6a', head: 'crown' };   // role: queen
```
Then `node render.mjs --project projects/<slug> --roles` (one still per new role: front, ¾, side, next to the hero) and open
`build/sheets/roles.png` once. Keep the cast's muted colours: only the hero is loud. Set a key to `null` to drop what the base had.

**Every outfit key** (all optional; colours are hex strings):
- body: `top` hoodie | tshirt | jacket | puffer | suit | dress | jersey | tracksuit | trench | labcoat | scrubs | aodai · `color`, `color2`,
  `sleeves`, `stripe`, `collar`, `shirt`, `tie`, `vee`, `yoke`, `quilt` ('puff'), `crop`, `edge`, `hood`, `strings`, `scarf`, `bow`, `bag`,
  `skirt`, `skirtLen`, `legs`, `legCuff`, `shoes`, `shoeSole`, `shoeToe`, `shoeStripe`, `shoeCollar`, `laces`, `gloves`, `belly`, `scale`, `kid`, `build`
- head: `hair` anime | animeLow | spiky | messy | short | curls | quiff | sidePart | slick | bob | fringe | long | sidePony | ponytail |
  pigtails | bun | lowBun | balding · `hairColor`, `hairShade`, `head` cap | capBack | beanie | headband | hood | tophat | crown | nurseCap |
  policeCap | chefHat | hardhat | fireHelmet · `headColor`, `face` glasses | sunglasses, `goggles`, `mustache`, `beard`, `brows`, `lashes`, `blush`, `eyes`, `skin`
- role details (engine/costume3d.js): `apron`, `badge`, `bands`, `belt` + `radio`, `buttons`, `buttonRows`, `buttonsTop`, `capBadge`, `capCross`,
  `lanyard` + `card`, `epaulettes`, `hiVis` + `hiVisBand`, `nameTag`, `patch` (chest text) + `patchBg` / `patchColor`, `stethoscope`, `whistle`
- in the hand: `prop` book | cane | clipboard | medbag | mic | torch · `propColor`, `propHand`; `pose` (a default pose), `pop` (a little self-lit)
Something no key gives (a space helmet, a cape): build it as a mesh in the shot and attach it to `ch.parts.head` / `ch.parts.chest`, and
say so in the promote proposal (it is a costume part the plugin could add).
