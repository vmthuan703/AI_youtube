# Story breakdown (the creative pass)

Read the whole transcript (`timeline/transcript.txt`) twice. Then write `story/bible.md` (short, practical):
- **Logline and tone** (wonder / suspense / comedy / drama), and who "you" is if the script is in second person (the
  hero character the viewer identifies with — usually a blue-hoodie kid or teen).
- **Cast table.** For each recurring character: id, role, outfit (see engine-api.md, Characters), signature colour,
  personality, the expressions they use most, and their TTS voice. Put the outfits in `scenes/cast.js`.
- **Locations (sets).** For each: name, the `T.W` base (city, suburb, room kind, park, studio) or custom build, mood
  (`day|golden|dusk|night|storm|interiorWarm|interiorCool|void`), time of day, key light and practicals, 4–8 signature
  props, where the camera usually sits. One `scenes/sets/<name>.js` each.
- **Motifs:** recurring devices tied to the story (a corner multiplier badge "10x", a ticking clock, the hero's colour
  as the colour of the power, a freeze look for slowed time).
- **Act / music plan:** sections with a mood and intensity (sound-design.md).

Then **rewrite `story/shots.json`** (schema in engine-api.md). For every shot set:
`id, start, end, line, scene` (one concrete sentence: shot type, framing, action, camera move, e.g. "LOW WIDE: hero
sprints past camera left→right, car frozen behind, speed lines, follow cam + shake"), `set`, `in` (transition), `look`,
`mblur`, `sfx`, `amb`, `notes`.

Pacing rules:
- Shots are **contiguous**: each `end` equals the next `start`. The first starts at 0, the last ends at `duration`
  (voiceover length + ~1.5 s).
- Cut on phrase boundaries, starting a shot **0.1–0.2 s before** the phrase it illustrates.
- Target a **median of 2.5–3 s** (the reference videos: 2.6–2.7 s). Fast action: 1–2 s cuts. Emotional or dialogue
  holds: 4–7 s. Explainer segments: 5–10 s while graphics build. Never hold beyond ~8 s without a new action, graphic
  or camera move.
- Plan **explainer segments** for rules, numbers, odds and science (≈ 15–25% of the runtime in the references).
- Every new location opens with an establishing shot.
- Expect roughly **12–16 shots per minute** of narration (measured in the references).
- Reuse sets: a scene of 6 shots in one location is cheap; 6 locations in 6 shots is expensive to build and render.

Give the user a 5–10 line summary: the cast (with colours), the locations, the number of shots, and the visual
highlights per act. Continue unless they object.
