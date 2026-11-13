# Cinematic thumbnail rules

Version 0.2.1 (2026-11-13). Replaces the flat 2D rules of 0.1. 0.2.1: the hero's expression follows the moment (user feedback), not always smug.

## Where these come from

- **The leading What If channel, looked at again on 2026-11-13** (its videos page, latest and older rows). What its thumbnails
  share: a real scene with depth instead of a flat background; soft shaded characters with light on them; one light effect that
  shows the power (fire, lightning, an aura, glowing money); a very large face; saturated colour; one UI element or ≤ 3 words,
  often none.
- **The 2026-11-07 view data** on 40 of that channel's thumbnails: a smug hero had a median of 340k views against 31k for a scared
  one (correlation on another channel; the user found all-smug faces did not fit the story, so rule 2 follows the moment); a girl or a crowd reacting, 400–517k; a label or UI element, 265k against 38k for none. Small sample, correlation only.
- **Film poster practice**: one moment, one light source that means something, a low camera, a shallow lens.

These describe what tends to work, not another channel's artwork. Never copy a competitor's character, mascot, scene or picture.
Every thumbnail uses this channel's hero, roster and sets.

**One sentence:** a film still of the moment the rule pays off, with the hero's face large and lit, the power visible as light,
and other people caught reacting.

## The rules

| # | Rule | How to check |
|---|---|---|
| 1 | **One moment, one read.** The frame shows a single instant from the script that a stranger understands in a second | Cover the title: can you say what the video is about? |
| 2 | **The hero's face is the first thing seen, with the expression of that moment.** Head 35–45 % of the frame height, on a third line, eyes toward the lens or the thing that matters. Pick the face the moment calls for: hurt when the best friend turns away, confused between two sides, joy when winning, worried at a bad number. Smug / smirk only when the hero is winning or holds the upper hand. Never from behind | The 320 px row of the sheet: does the face match the moment? |
| 3 | **Depth in three layers.** Hero in the foreground, reactions in the mid-ground, a real place behind, out of focus | Background blurred, mid-ground faces still readable |
| 4 | **Light tells the mood and comes from somewhere.** The sun behind the hero, a lit window, the power's own glow. Always a bright edge on the hero (rim light) and a readable face | The hero separates from the background even in greyscale |
| 5 | **The power is visible as light or as an impossible sight.** A glow in the power's colour, weather that obeys, a 200 kg thing in one hand | Remove the text: is the power still there? |
| 6 | **Someone reacts.** 1–3 roster characters with clear faces turned to the hero. Their feeling is the audience's feeling | Faces ≥ 15 % of frame height |
| 7 | **Text only if the script needs it.** Nothing, or one label / number, or one phrase of ≤ 3 words that does not repeat the title. Across the options at least one has no text | `sheet.mjs` counts the words |
| 8 | **Low camera, long lens, full frame.** Camera below the face looking up, fov 26–34, no black bars, saturated colour | — |

## Options

3 or 4 per video, **different moments or different ways of seeing the rule**: another place, another hour, another distance,
another reaction. Two frames of the same moment from two angles count as one option.

## Do not

- A scared, suffering or begging hero when the moment does not call for it (pick the face by rule 2).
- A small hero, a hero seen from behind, a hero lost in the set.
- Flat noon light with everything sharp (the old 3D thumbnails: readable, not wanted).
- A black or grey frame. Night scenes need one saturated light and lit windows.
- More than one text element; long text; text repeating the title.
- Gross or unpleasant subjects; blood; a real weapon aimed at a person; anything unfit for a young audience.
- Spoiling the twist or the ending. Show the fun of the rule, hint at the price at most.
- Blown-out white areas on the hero's face or jacket.

## Channel identity (fixed)

- **Hero:** the channel's hero from `channel/cast.js` (platinum spiky hair, lime puffer). Nobody else gets near-white hair or a loud colour.
- **Cast:** roster roles only.
- **Text style** (when used): Fredoka 700, white or yellow with a dark outline `#241a3a`, labels on a dark plate `#14102a`.
- The hero's lime must not sit on a green background (a lawn right behind the jacket): move the camera or the hero.

## After publishing

Use YouTube Studio "Test & Compare" on 2–3 options and record the result in `D:\AI_youtube\prompts\thumbnail_style.md`, so the
rules come from this channel's own click-through rate.
