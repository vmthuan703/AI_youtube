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

The check also flags these: **Hero name fits the hero** (a girl's name for the boy hero), **Weekdays run in order**, **Day count adds up**
(a "thirty days to ..." deadline that ends after the story's last day) and **Punchlines land when heard** (a 1–4 word answer such as
"You say YouTube."). It also checks the opening rules from the 2026-11-11 retention review: **Rule stated early** (the "Here's the rule" line before word 70, about 26 s) and **Name, age and flash-forward are short** (25 words or fewer from "Your name is"). Story-logic question 10 asks for the first consequence of the power before word 120. These are a trial: the channel compares the 11/11-12/11 videos with the 13/11 ones. Under the table it lists the **Story logic** questions. Answer each one in writing before the voice.

## Hooks and retention (2.0)
- Write three openings of about 28 words (10 seconds). Each one starts inside an action the viewer can picture, speaks to "you", shows
  what can be lost or the catch, and leaves one question open. No name, age or welcome in the first 10 seconds. Rank them with
  `python tools/retention.py --hooks <file>` and keep the best; show all three with their scores at the script checkpoint.
- `python tools/retention.py --script <file>` scores every 30 seconds (a turn, an open question, stakes, a number, a second voice, short
  sentences). A window under 5 is FLAT: add the thing it names. No two FLAT windows in a row, and none in the first two minutes.

## Writing a script (when the user asks you to write or rewrite one)
These rules come from the Memory 100x v2 review (logic 6.5/10) and the user's notes on the finished video. Follow them from the first draft:
- **Cast.** The hero ("you") is a **boy**, with a boy's name and he/him. The **best friend is a girl**. Write a cast table (name, gender,
  role, the outfit from `channel/cast.js`) at the top, and keep names and pronouns matching the models.
- **One power rule, stated once and early.** Say when it starts, whether it reaches back to the past, how fast it takes things in, how
  accurate it is, and what it costs. Every use of the power must fit that rule. Never add a hidden second power (perfect memory is
  not speed reading). Keep big numbers possible under the rule and in the time the story has.
- **One calendar.** Plan story days in a table before writing (Day 1–7 set-up, 8–10 escalation, the full challenge period, the climax
  day, the aftermath). Use one day count. Every deadline lands where the event happens. Weekdays move forward, and a jump gets a line
  such as "Next week." or "Three days later."
- **Climax by cause and effect.** Locate the danger, add real time pressure, show a mental obstacle, a turn, and an objective cost
  under rules stated earlier (the hero misses the deadline because they stayed on the call). Then show the rescue confirmed on screen,
  and a thematic payoff. The sacrifice must follow from the choice. If the person is already safe and the prize is still offered,
  the choice means nothing.
- **Change through action.** The hero wins by choosing what to do while the problem is still there, not by a symptom vanishing.
- **Set up the twist** at least once before it lands.
- **Safe advice only.** In a rescue the hero describes landmarks and the rescuers lead; no "walk toward the water".
- **Science.** Use terms correctly (HSAM = memory of one's own life; working memory = limited attention, not physical slots). Check
  every name and figure. Keep explainers out of the climax.
- **Jokes are heard, not read.** A punchline must make sense on first listen to a young viewer. Don't end a joke on a lone 1–3 word
  answer whose meaning is hidden ("You say YouTube."). Say it in full: "You tell him the truth: one weekend of YouTube videos."
- **Name only props you can show.** If the narration names a prop (headphones, a receipt), plan the shot that shows it clearly.
- Keep what worked: a hook that gives the power, its cost and the danger in the first lines, a motif planted early and paid off at the
  end, and one warm anchor character (a grandparent).

Read the whole transcript (`timeline/transcript.txt`) twice. Then write `story/bible.md` (short, practical):
- **Logline and tone** (wonder / suspense / comedy / drama). The "you" of the script is the channel's hero from `channel/cast.js`: a boy. If the script gives him a girl's name or she/her, raise it at the script check, before the voice.
- **Props list:** every prop the narration names, with the shot that shows it and the one detail that makes it readable (a receipt's printed lines and torn edge, headphones in a contrasting colour).
- **Palette:** this video's colour world (`dusk`, `cozy`, `tropic`, `alert`, `school`, `midnight`, or a new one). Pick from where most of the story happens. Set `config.json` → `palette`.
- **Game layer (if the power is game-like):** what the HUD over heads shows and which story variable the corner counter tracks (shots.json `counters`).
- **Signature device:** one visual invented for this story's power, built in the first minute and recurring all video, with the UI part that draws it. Don't reuse one from a reference.
- **Cast table.** For each recurring character: id, role, outfit (see engine-api.md, Characters), signature colour,
  personality, the expressions they use most, and their TTS voice. Put the outfits in `scenes/cast.js`: import the hero and the supporting roles (`import { HERO, NURSE, GRANDPA } from '/channel/cast.js'`; `ROLES` maps script words such as "nurse" or "grandpa" to a role, so the costume matches the job and the age), give every speaking character `speaker: 'NAME'` as written in the script, so bubbles and lip-sync find them. **Every character comes from the roster, extras included:** a second or third girl is `CLASSMATE_2` / `CLASSMATE_3`, a second or third boy `BRO_2` / `RIVAL_2`, nameless students `STUDENTS[i]`; change one colour or the hair at most and never write an outfit from scratch. `python tools/cast_check.py --project projects/<slug>` must pass before the style samples.
- **Locations (sets).** Start from `story/set_match.json` (1.0.5): every place already has a catalogue set (`use`) or the user's choice
  (plugin / project / use:<id>); do not swap in a different set without saying so. For each: name, the `T.W` base (city, suburb, room kind, park, studio, beach, island, snow, farm, underwater, space) or custom build, mood
  (`day|golden|dusk|night|storm|interiorWarm|interiorCool|void|beach|sunrise|snow|arctic|underwater`), and at least one bright or outdoor location when the story allows, time of day, key light and practicals, 4–8 signature
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
