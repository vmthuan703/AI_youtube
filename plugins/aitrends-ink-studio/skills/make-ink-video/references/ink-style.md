# Ink Pastel: the look and the edit
Measured on a reference What If channel (a 9:18 episode, 232 shots, plus a 5-hour compilation). We learn its visual language;
we never copy its characters, art or episodes. Engine side in brackets.

## Characters
- Big sphere heads (~45% of the height), pale lavender skin (`paleSkin #e6e1f0`); flat decal faces: dot eyes with a highlight,
  **thick curved brows carry most of the emotion** (`inkFace`), the mouth is one line.
- Thin bodies in tube clothes; each role = one hair shape + one shirt colour + one accessory (glasses, beard, cap, scarf).
- Crowds of 10–30 from the same rig, varied hair/skin/clothes, soft in DOF.
- Channel hero: the lime puffer (`channel/cast.js` HERO, scale 0.9 so the hero is as tall as other adults, rule R03).

## Light and colour
- Soft light, few hard shadows: weak key + strong ambient, a clear contact shadow under the feet. **Shadows lean lavender**, never
  grey: the channel's colour signature (toon ramp `[95,175,235,255]`, `setSat 1.0`).
- Pastel palette (lavender, mint, brick pink, wood beige, cream yellow); one tone per place. Only yellow and green "shout".
- Warm practicals for emotion; night = deep violet-blue with one yellow source. Flat milky skies, no god rays or weather.
- Looks: `inkDay`, `inkRuin` (smoky outdoors, light fog), `inkDark` (night, underground), `inkWarm` (warm interiors).

## Texture
- **A dark ink line (#1c1830) round every object** (InkPass: depth edges, width 2 px × height/1080, inner creases thinner).
  This is the biggest difference from 3D Studio's `cine`, where only characters are outlined.
- Flat 2–3 step cel shading, no reflections; hand-drawn details as dark slivers (cracks, wood grain) so the ink pass draws them.
- Light paper grain, vignette on inner moments, soft bloom on light sources.

## Camera
- Wide lens, often low and looking up (toy-like). Close/medium close ~35%, medium/full in the set ~35%, top-down ~6%, inserts
  ~10%, flashback cards ~7%, black stage ~4%, POV hand ~3%.
- Mostly still + slow push-in (3–8%); a whip or zoom with motion blur only on a reveal. No handheld. Shallow DOF, OTS foregrounds.

## Edit and timing
- 232 shots in 9:18: mean 2.41 s, **median 1.9 s, ~25 cuts/min**; under 1 s 21%, 1–2 s 33%, 2–3 s 21%, 3–5 s 16%, 5–8 s 6%, ≥ 8 s 3%.
- Hook: the first picture holds ~7 s (the rule shown by image), then a burst of 0.3–0.7 s cuts as the rule is revealed.
- Hard cuts; big transitions cut to a black stage (pill + speech bubble on black) or a sepia card sliding in.
- **Cut on the picture, not the sentence:** 64% of cuts land mid-word.

## Acting and mouths
- Few, clear changes: brows + one gesture (point, raise a hand, tap a finger, chin on hand). Poses change by cutting.
- **Nobody lip-syncs the narrator** (rule R05): narrated close-ups keep the mouth still; life comes from blinks, brow changes,
  small head moves. Speaking characters use 2–3 mouth shapes.

## Story devices (what makes the channel)
1. **A HUD pill over every head** (white pill with a tail, dark digits, red for the last seconds), its number changing with the
   story. One HUD rule per episode.
2. Sepia flashback cards with rounded frames. 3. Inserts with text (phone, sticky note, calendar). 4. Top-down map views with the
   pills still visible. 5. Black stage for the rule. 6. POV hand of "you".

## Narration
- 185 words/min (197 without pauses), only ~1 pause over 1.5 s per minute; **second person, present tense**, short sentences,
  concrete numbers ("five hours 36 minutes").
- Hook: cold line → the rule by ~5 s through the number over a head → a mystery → **three promises** ("Tonight… by Friday… on
  Sunday…") → "But right now…", all in ~45 s. One real science fact mid-video. End on a quiet image and an open question.
- Sound: −14 LUFS integrated, loudness range ~3 LU (flat, voice in front).
