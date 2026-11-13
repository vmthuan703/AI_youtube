# Thumbnail rules

Learned from competitor data on 2026-11-07 (40 hand-coded thumbnails of the leading What If channel compared by views, 103 more
from other channels, pixel measurements on 144 images). Small sample, correlation only. The source of truth for the channel is
`D:\AI_youtube\prompts\thumbnail_style.md`; if that file is newer than this one, follow it for the rules below.

These rules describe a motif (what tends to win), not another channel's artwork. Never copy a competitor's character, mascot,
layout or picture. Every thumbnail uses the channel's own hero and roster.

**One sentence:** the hero is winning + the video's rule shown as game interface + other people reacting, on a bright background.

## The 5 rules (all required)

| # | Rule | Evidence (median views) |
|---|---|---|
| 1 | **Smug, confident hero.** Half-closed eyes, smirk, grin, wink, or a finger on the lips. Never a scared or victim face on the main hero | Smug 340k · neutral 56k · scared 31k · no hero 22k |
| 2 | **The video's rule as ONE layer of game UI.** Labels over heads, a stat or HP bar, a counter, a command line, a meter, a game window | Labels/UI 265k · big text 76k · no text 38k |
| 3 | **Social stakes.** At least one supporting character or a crowd reacting to the hero. Muted colours, never competing with the hero | With a girl 400k · crowd or pile 517k |
| 4 | **Bright, vivid background; big hero.** The hero fills 1/3–1/2 of the frame; the face still reads at 320 px wide | Brightness 82/100 vs 51 for rivals |
| 5 | **Few words, spoken tone.** At most one big phrase of ≤ 3 words that does not repeat the title ("oh yeah.", "pick one."). Drop the big text when the labels already tell the story | The top video (1.57 M) had 3 labels and no big text |

## Composition: fitted to the script, no fixed layouts

There is no layout list to fill. Each option starts from the script:

1. **The rule.** What is the one rule or power of this video, and how would a game show it? (a counter, a bar, a label, a price, a level, a command)
2. **The winning moment.** Where in the script does the hero enjoy the rule the most, with other people watching? That moment is the picture.
3. **The reaction.** Who in the script reacts, and how (shock, love, jealousy, anger)? Use those people, from the roster.
4. **The arrangement that tells this moment fastest.** Let the content decide: a contrast (before/after, me/them) only if the script has one; a crowd only if the script has a crowd; a big game window only if the rule is a system. Place the hero where the UI and the reactions point at them.

Options must differ in **idea** (a different moment, a different way to show the rule, a different reaction), not only in
arrangement or colour. Two options that tell the same idea count as one.

Useful patterns seen in winning thumbnails, as a vocabulary rather than a checklist:
- A label that contradicts what a person looks like.
- Two states of one number (27 → 19,342,514).
- The hero calm in the middle while everyone else has a red warning.
- The hero on top of a heap of the thing the rule gives.
- One absurdly maxed stat among normal ones.

## Do not

- Scared, suffering or begging faces on the main hero ("HELP", "MISSING" style: all under 80k).
- Gross or unpleasant subjects.
- Abstract close-ups with no story.
- A small hero, a hero seen from behind, or a hero lost in the scene.
- Blood, a real weapon aimed at a person, anything unfit for a young audience.
- Long text, or text that repeats the title.
- Spoiling the ending or the twist. Show the fun of the rule, hint at the price at most.

## Channel identity (fixed)

- **Hero:** pearl head, spiky platinum hair, lime puffer, flat 2D with a thick outline. Nobody else gets near-white hair or a loud colour.
- **Supporting cast:** roster roles only (`ROSTER` in `kit/thumb_kit.mjs`, mirroring `channel/cast.js`). No invented outfits.
- **Font:** Fredoka 700.
- **Colours:** outline `#241a3a`, lime `#b4f02e`, yellow `#ffe14a`, UI green `#3ddc5a`, UI red `#ee3b2f`, dark label `#14102a`.
- **White text has a dark outline, never a white edge.**
- **Labels:** solid fill, 8 px dark border, 18 px corners, a pointer aimed at the person.
- The hero's lime must not sit on a green background.

## Check before showing

- At 320 px wide (bottom row of the contact sheet): the hero's face and every label still read.
- All 5 rules hold; nothing from "Do not".
- `render_thumbs.mjs` prints no red line.
- Labels do not cover a face; nothing important within 40 px of the edge or in the bottom-right corner (the duration badge).

## After publishing

Use YouTube Studio "Test & Compare" on 2–3 options and write the result into `prompts/thumbnail_style.md`, so the rules come
from the channel's own click-through rate.
