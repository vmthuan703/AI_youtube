# Style bible: the aiTrends 3D look

Follow this closely. It describes the target look of the channel's 3D "What if…" story videos. It was written from six full
reference videos of the genre (10–11 min each) and compared with the channel's own first videos. No reference images are bundled; this
text is the spec. The section "Measured from the reference videos" at the end has the numbers. Learn the structure, keep the channel's own identity:
never copy a reference's devices, gags or wording.

## The channel's identity (does not change between videos)
- **Hero:** quilted lime puffer and platinum anime hair (`channel/cast.js`). The rest of the cast is calmer, so the eye always finds the hero. Near-white, silver or pale blond hair belongs to the hero only: give everyone else a clearly darker or warmer colour, so the hero is recognisable from the hair alone.
- **Voice:** the emotional `am_puck` narrator through Chatterbox.
- **Picture:** a 2:1 frame with black bars (`bars: "cine"`), soft contrast, lifted shadows (`pearl`).
- **Purple stage:** muted aubergine with a faint grid and warm gold labels, the same in every palette.
- **One signature device per video:** a visual invented for that story's power (a search bar above every head, a counter, a meter).
  The script's power decides it; it recurs all video and is what people remember.

## The look in one paragraph
Toy-like 3D stick characters with **huge round heads** (pearly ivory with soft lavender shading, or
pure black with big white eyes in the `ink` style) on a thin neck, **chunky saturated tops** (hoodies with a bunched hood and
white drawstrings, the hero's puffer), thick sleeves ending in **ball hands**, and **bare thin stick legs with round feet**. Faces are minimal and drawn: two dot
eyes with a tiny highlight, short brows only when angry or worried, a small mouth. They act inside **simple, solid 3D
sets** (school hallways with lockers, bedrooms, night streets, classrooms, offices, stores) built from clean shapes and
flat-coloured surfaces, lit like a film: a **pastel dusk or a colour world picked for this story** (`config.palette`), **warm practical lights** (lit windows,
street lamps, screens, ceiling lamps) and a warm rim on the heads. Shadows stay lifted: mostly mid values, almost no pure black inside the picture. Low and wide camera angles, constant slow camera
motion, shallow depth of field on close-ups, light bloom and grain. The tone is "a cartoon shot by a cinematographer":
simple characters, real staging, real light.

## Characters
- **Proportions** are fixed by the rig (`T.character`), in thirds like the references: head ≈ ⅓ of the height
  (0.54 m wide on a 1.75 m figure), boxy hoodie ≈ ⅓ (shoulders to upper thigh), bare stick legs ≈ ⅓, a thin visible
  neck, big ball hands hanging just below the hem. Kids: `kid: true`. Big/bully characters: `scale: 1.15–1.3`.
- **Skin**: the style decides (`pearl`, `cinematic`, `soft`, `toon`, `golden`, `neon`, `noir` → pale ivory/lavender + dot eyes;
  `cinematic` adds a thin dark outline like the "crush" video, `soft` has none like the "luck" video; `ink` → black +
  big white eyes + lavender rim). Pale heads glow faintly so they never go muddy, even back-lit. Don't mix skins
  inside one video unless the story needs it (a ghost, an alien, the "real you" vs a clone).
- **Girls and variety** (as in the references): soft bob, `fringe`, long, ponytail or `sidePony` hair (`hair`, `hairColor`), a bow,
  `lashes`, a `skirt` under a tee or hoodie, or a `dress`. Boys: `curls`, `quiff`, `sidePart`, `slick`, short hair, caps (`cap`/`capBack`), beanies.
  Adults: `suit` + `tie`, `vest` (dealer, waiter), `labcoat`, `scale` 1.1–1.2. `blush` only on a character the story calls for, not by default.
- **Legs:** bare stick legs and round feet by default, hero included. Add `legs` or `shoes` only when the story needs them (a suit, a uniform, sports).
- **Identity = own hair + one outfit detail.** Each recurring character has a hair shape nobody else has and one outfit detail (`bag`, `sleeves`, `collar`, `stripe`, `scarf`, `tie`, glasses),
  identical all video. Start from `channel/cast.js`. Colours stay deep and muted: brick `#7a3a34`, navy `#2c3e6e`, plum `#8d4a6b`, teal `#2f6f6a`, forest `#3f6a58`, olive `#5f6a2e`, charcoal `#33313f`.
  Only the hero wears a loud, bright colour. Background people: `T.W.crowd` or plain characters in muted colours.
- **Faces are the acting, and the comedy.** The hero's resting face is `deadpan` (two flat dashes) or `unimpressed` (heavy lids); it plays against
  chaos around them. Big expressions are saved for the beats that earn them. Change `expr` on the beat of the words, not randomly. Blink (`blink: true, t`). Look where
  the attention is (`look: [x, y]` or `.lookAt3`). Talk only on quoted dialogue (`talkFor`). Narrator: never lip-synced.
- **Bodies must read as silhouettes**: clear poses from `POSES3`, blended with `posesAt3`, wrapped in `breathe3` so
  nobody is frozen (except during a time-freeze where only the hero moves). Contact: feet on the floor, hands on the
  object they touch (IK `{to:[x,y,z]}`), sitting on the seat.
- **Super-human moments** (speed, strength, powers): sprint pose + forward lean, `FX3.speedLines`, `FX3.ghosts`
  afterimages in the hero's colour, `FX3.trail`, `mblur: 3`, camera shake, a `whoosh` SFX.

## Sets and environments
- Build every location once as `scenes/sets/<name>.js` from `T.W.*` (city, suburb, room kinds, park, studio) plus
  invented props (boxes, rounded boxes, cylinders). Keep geometry simple and **surfaces flat-coloured** with light
  texture (tiles, planks, asphalt, window grids). No photos, no realism, no clutter for its own sake: 4–8 signature props.
- **Value structure:** mostly mid-dark surfaces, 1–3 bright accents (a window, lamps, a screen, neon). Stage the hero
  against a lighter area or give them a rim so the head separates from the background.
- **Signature elements:** lit windows (warm, some cool), lamps with glow + cone + floor pool, neon signs, lockers,
  big night windows with a city skyline, a moon. Sets extend beyond the frame so camera moves never reveal edges.
- **Atmosphere in most shots:** `FX3.dust` indoors, `FX3.rain` for storms, `FX3.bokeh` behind close-ups, fog (stage
  fog), `FX3.frozen` droplets for time-stop.

## Light and colour
- One mood per location: `T.stage({ mood })` → `st.M` (night, dusk, golden, day, storm, interiorWarm, interiorCool,
  void). Take colours from `st.M` and the cast so a style switch re-themes everything.
- **Key + practicals:** the stage gives a key, a back/rim light and a hemisphere ambient; add 1–4 practical lights
  (`T.lamp`, `T.spot`, lamps inside `T.W` props) where the set shows a source. Fake extra sources with `T.glow`.
- The story drives the light: tension → darker, cooler, harder contrast (`look: "danger"`, `noir` moments);
  wonder/triumph → warm, more bloom; time-stop → `look: "freeze"`; memories → `look: "flashback"`.
- The final grade (lift/gamma/gain, saturation, vignette, grain) comes from the style and applies to every frame.

## Camera (never static)
Every shot moves: slow push-in, lateral truck, orbit, crane up/down, follow, or handheld shake for action.
Use real lenses: wide (fov 45–60) low angles for drama and kids-in-a-big-world; normal (35–40) for dialogue;
long (20–28) for close-ups with `dof`.

**Keep a hard variety of size.** Besides the list below, the reference look depends on: **a giant head in the foreground** taking a third of the frame
while the action plays behind it; **macro shots** (one eye, one hand, a foot, a dropped object filling the frame, under a second); **crowds from above**; **two big
heads almost touching** for comedy. Recipes in engine-api.md.

**Shot vocabulary** (use all across a video, roughly in these proportions):
1. **Establishing wide** (10%): the location with small figures, slow push or crane. Opens each new scene.
2. **Medium two-shot** (25%): characters facing each other, side or 3/4 view.
3. **Over-the-shoulder** (10%): one character's head/shoulder big and soft in the foreground (`dof`).
4. **Close-up / face** (15%): head and shoulders fill the frame, background soft (`dof`, `bokeh`), expression on the beat.
5. **Insert** (10%): hands, a phone screen (`T.W.phone` + `screen.update`), a clock, a door handle, a soda can.
6. **Low-angle hero shot** (5%): camera near the floor looking up, wide lens (fov 55–65).
7. **Action / speed** (as needed): follow cam, speed lines, afterimages, motion blur.
8. **Freeze / time-stop** (1–3 per video): world frozen, droplets hanging, `look: "freeze"`, only the hero moves,
   entered with a `flash` transition and a `freeze` SFX.
9. **Top-down / map** (5%): the scene from above for geography or plans.
10. **Data card / UI** (as needed): any number the narrator says appears on screen (2D overlay, `wordTime()`).
11. **Title card**: big glowing title over a cinematic wide, **silent: the narrator does not read it**, between about 0:30 and 1:15, after the cold open.
12b. **Macro insert** (5–10%): under a second, an object or body part filling the frame, cut on the word.
12. **End screen**: the question, a comment bubble, a subscribe pill, the cast lined up in 3D.

Continuity: same outfits, same screen direction within a scene (hero on the left facing right in conversations), same
set geometry and time of day in every shot of a scene.

## Editing and transitions
Frame: 16:9 with `bars: "cine"`, so the picture is 2:1. Keep important things and text between y = 90 and y = 990.

Hard **cut** by default (80%+). **flash** (white) into freezes, powers and realisations. **dip** (black) for time skips
and chapters. **fade** for dreamy moments and the title. **whip** for energetic jumps between places. **zoom** into an
explanation.

## On-screen graphics and typography
- Fonts: Fredoka Bold for titles and big lines (ALL CAPS), Nunito Black for labels and numbers, Playfair Display Black
  Italic for the end-screen question. Colours: `S().ui.gold` key numbers, `ui.accent` alarming values, `ui.cream` labels.
- Every number the narrator says appears, synced with `wordTime()`. Keep text minimal (1–2 short labels at once).
- **Explainers show, they don't caption.** Every explainer has a moving picture from `engine/diagrams2d.js`: cut a house open, weigh the thing, draw the path, count the slots.
  Two presentations, alternated: **on the scene** (the story's own set blurred and dimmed behind the diagram, `backdrop`, with a flat 2D figure) so the viewer never leaves the moment;
  **on the purple stage** for rules and the big numbers, with a small figure on the floor line reacting. Never an empty stage with only a label.
- **Speech bubbles:** every line of a named character shows in a white bubble over their head while spoken (automatic, `speaker` on the character).
- Captions (`captions: true`, default for 9:16): word-by-word, current word highlighted.

## Story conventions ("What if…?" narratives; use only what the script contains)
Cold open in one physical moment → flash-forward (what this turns into, and the danger) → back to the small present moment → silent title card → the rule → escalation with
concrete moments → the cost or twist → the climax → the resolution → (optional reality check) → a last small mystery → question and call to action.

## Don't
No realism, photos, emoji or clip-art. No copying a reference's devices or wording. No empty purple stage. No static shots. No floating feet or hands passing through objects. No narrator
lip-sync. No walls of text. No more than ~4 characters in focus at once (crowds are fine). No outfit colour changes.
No hard-coded colours that ignore `st.M`/`S()` for set dressing (character signature colours are the exception). No
`Math.random()`/`Date.now()` or state that carries between frames in `draw()`. No more than ~5 real lights per shot.

## 9:16 vertical rules
The logical overlay stage is 1080×1920 (`E.vertical === true`); use `V(landscape, vertical)` for fov, camera distance
and overlay positions. Frame closer (medium and close-ups dominate), keep faces in the middle third and text inside
the central ~900×1500, captions at ~79% of the height. Check with `--sheet` in 9:16 before rendering.

## Measured from the reference videos
Six videos of the genre, 10–11 minutes each, mostly from one channel, so this is one winning template, not a rule of the genre. Measured frame by frame and from transcripts:
- **Pacing:** median shot 2.2–2.5 s (p25 1.3–1.5 s, p75 3.3–3.9 s), 17–21 shots per minute, 18–33 in the first minute, 8–16% of shots under 1 s, 4–7% over 8 s.
  Explainer segments hold longer (5–11 s) while their graphics build up.
- **Picture (bars excluded):** 2:1 in all six. Median brightness 0.20–0.40, near-black pixels 3–20%, mean saturation 0.35–0.44. `tools/qc_metrics.py` compares with these.
- **Purple stage:** 10–31% of the runtime.
- **Script:** 1,730–1,800 words, 159–177 words per minute, 7–9 numbers per minute. All six open on "you" and an action, flash forward, drop back to the present, and never read the title.
- **Mid-video:** a silent subscribe gag at about 1:30 in all six. A pixel-ripple transition in only two (about 11% of cuts), so it isn't part of the template.
- **Mix of shots:** ~15% extreme face close-ups (the head fills the frame, background soft), ~25% medium two/three-shots,
  ~10% over-the-shoulder with a huge soft head in the foreground, ~10% inserts (hands with phone/money/coin, a roulette
  wheel, a claw machine), ~20% explainer segments, ~10% big wides (arena, stadium, city, plane), title and end screen.
- **Explainer segments** (`T.W.explainer` + overlays): a flat purple stage with a faint fine grid and a thin light floor
  line; one or a few small characters standing on the line (fov 18–28, front-on); graphics around them: dark rounded
  pills with bold numbers (`UI.pill`: "1 IN 1,000", "40,000", "$10,000"), a stat card ("TRIES / 1,000", `UI.statCard`),
  check tags ("✓ SMARTER", `UI.tag`), a letter-spaced heading ("THE RULES", `UI.heading`), name labels under characters
  ("JAKE", "MAYA", "YOU", `UI.nameLabel`), coins, scales, arrows, glowing lines between characters. Variant: the real
  set blurred and darkened behind the small characters (`dof` + `T.W.veil`).
- **Recurring UI:** white speech bubbles with bold dark text for single lines of dialogue (`UI.speech`), a pink heart
  counter pill on screen or above a character (`UI.heartPill`), number balls (`UI.numberBall`), a stream-chat panel
  (`UI.chatPanel`). Rounded heavy sans in the "luck" look (`soft` style), letter-spaced serif small caps in the "crush"
  look (`cinematic` style); the style's `ui.labelFont` switches every label.
- **Faces:** small glossy black oval eyes with a white highlight, set wide and a little below the middle of the head;
  a tiny mouth; most of the acting comes from a heavy upper lid (smug, unimpressed, sleepy), "^ ^" happy eyes, a single
  thin brow for anger/worry, and a round "o" mouth for surprise.
- **Sets seen:** casino (roulette, felt table, slot machines: `T.W.casino`), diner with checkered floor and red booths
  (`T.W.diner`), school hallway with teal/red lockers and strip lights, classroom, gym/basketball court with bleachers
  and crowds (`T.W.gym`), game-show stage with numbered doors (`T.W.gameshow`), store aisle (`T.W.store`), bedrooms,
  living rooms, night streets, a dusk highway with power poles, a stadium, an airport and a plane cabin.
- **Light:** purple ambient everywhere, warm top/side key, white-warm rim on the heads, bloom on lamps and screens,
  strong vignette, visible grain; close-ups use shallow depth of field.
- **End screen:** the cast lined up on the explainer stage (relaxed poses, faces visible), a subscribe pill and a like
  button above them, "MORE WHAT IFS" (`UI.subscribeRow`).
