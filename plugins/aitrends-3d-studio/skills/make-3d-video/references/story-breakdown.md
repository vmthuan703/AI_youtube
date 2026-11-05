# Story breakdown (the creative pass)

## Before the voice: the script check
`python tools/script_check.py --script <file> --title "<title>"` compares the script with what six reference videos do. It never edits anything. Show the table and let the user decide:
| Part | What the references do (six videos) |
|---|---|
| Opening | "You" and one physical action, in the middle of a moment (6/6) |
| Flash-forward | Within about 20–65 s: what this turns into, the big win and the danger (6/6) |
| Back to now | One line that drops to the small present moment (6/6) |
| Title | On screen only, as a silent card (6/6 never read it in the first 100 s) |
| Science | Told from inside the scene, often against what a normal person can do |
| Ending | A last small mystery, one question to the viewer, a call to comment (5/5 measurable) |
| Call | The like and subscribe line names one decision from this story (5/5 measurable). Use the channel's own wording, never theirs. |
Length: 1,500–1,650 words is the channel plan; references run 1,730–1,800.

Read the whole transcript (`timeline/transcript.txt`) twice. Then write `story/bible.md` (short, practical):
- **Logline and tone** (wonder / suspense / comedy / drama). The "you" of the script is the channel's hero from `channel/cast.js`, whatever their name in this story.
- **Palette:** this video's colour world (`dusk`, `cozy`, `tropic`, `alert`, `school`, `midnight`, or a new one). Pick from where most of the story happens. Set `config.json` → `palette`.
- **Signature device:** one visual invented for this story's power, built in the first minute and recurring all video, with the UI part that draws it. Don't reuse one from a reference.
- **Cast table.** For each recurring character: id, role, outfit (see engine-api.md, Characters), signature colour,
  personality, the expressions they use most, and their TTS voice. Put the outfits in `scenes/cast.js`: import the hero (`import { HERO } from '/channel/cast.js'`), give every speaking character `speaker: 'NAME'` as written in the script, so bubbles and lip-sync find them.
- **Locations (sets).** For each: name, the `T.W` base (city, suburb, room kind, park, studio) or custom build, mood
  (`day|golden|dusk|night|storm|interiorWarm|interiorCool|void`), time of day, key light and practicals, 4–8 signature
  props, where the camera usually sits. One `scenes/sets/<name>.js` each.
- **Motifs:** recurring devices tied to the story (a corner multiplier badge "10x", a ticking clock, the hero's colour
  as the colour of the power, a freeze look for slowed time).
- **Act / music plan:** sections with a mood and intensity (sound-design.md).

Then **rewrite `story/shots.json`** (schema in engine-api.md). For every shot set:
`id, start, end, line, scene` (one concrete sentence: shot type, framing, action, camera move, e.g. "LOW WIDE: hero
sprints past camera left→right, car frozen behind, speed lines, follow cam + shake"), `set`, `in` (transition), `look`,
`mblur`, `sfx`, `amb`, `notes`, and `backdrop` on 2D diagram shots that sit on a blurred scene.

Pacing rules:
- Shots are **contiguous**: each `end` equals the next `start`. The first starts at 0, the last ends at `duration`
  (voiceover length + ~1.5 s).
- Cut on phrase boundaries, starting a shot **0.1–0.2 s before** the phrase it illustrates.
- Target a **median of 2.2–2.5 s**, with a quarter of the shots under about 1.5 s (add macro inserts and reaction cuts). First minute at least 20 shots. Fast action: 1–2 s cuts. Emotional or dialogue
  holds: 4–7 s. Explainer segments: 5–10 s while graphics build. Never hold beyond ~8 s without a new action, graphic
  or camera move.
- Plan **explainer segments** for rules, numbers, odds and science (10–30% of the runtime in the references). Each one names its diagram in `scene`. Mix: about half on the blurred scene, half on the purple stage.
- Every new location opens with an establishing shot.
- Expect roughly **17–21 shots per minute** of narration (measured in the references).
- Title card: a silent shot of its own between about 0:30 and 1:15, on a wide of the story's first big image.
- The subscribe gag plays by itself at about 1:30 over whatever is on screen. Keep the right edge free of important things during those 5 s, or move `subscribeGag.at`.
- Reuse sets: a scene of 6 shots in one location is cheap; 6 locations in 6 shots is expensive to build and render.

Give the user a 5–10 line summary: the cast (with colours), the locations, the number of shots, and the visual
highlights per act. Continue unless they object.
