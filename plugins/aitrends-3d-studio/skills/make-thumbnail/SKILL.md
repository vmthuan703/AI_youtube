---
name: make-thumbnail
description: "This skill should be used when the user runs /make-thumbnail or asks to \"make a thumbnail from this script\", \"design thumbnails for this video\", \"tạo thumbnail từ script\", \"làm thumbnail cho video\", \"thiết kế thumbnail\", \"thumbnail điện ảnh\", \"redo the thumbnail\", or \"give me thumbnail options\" for an aiTrends 3D Studio video or a script on its own. It stages 3–4 moments of the script as cinematic 3D stills on the studio engine (film light, depth of field, weather, low angle, the channel hero large in the foreground, roster characters reacting, text only where the script needs it), renders 1280×720 JPGs with a picking sheet and checks. /make-3d-video already runs this as its last stage; use this skill to make or redo thumbnails on their own.\n"
metadata:
  version: "2.1.1"
  author: aiTrends
---

# aiTrends 3D Studio: thumbnails on their own

The same thumbnail stage that `/make-3d-video` runs after the MP4 (Stage 9), for a video that is already finished, a redo, or a
script with no video yet. Everything is in `${CLAUDE_PLUGIN_ROOT}/skills/make-3d-video/references/thumbnails.md`: **read it
first** and follow it section by section (rules, reading the script, building the project, render and check, hand-over).

1. **Input.** A studio project (`projects/<slug>`: its script, cast and sets are reused), or a script path, or a script pasted
   in the chat. With no script, ask for it; do not compose from a title alone.
2. **Studio.** It lives at `D:\aitrends-3d-studio` unless the user says otherwise and must be 2.1 or newer (`tools/new_thumbs.mjs`
   exists). If it is older, sync it first: `python "${CLAUDE_PLUGIN_ROOT}/skills/make-3d-video/kit/tools/sync_kit.py" --to <studio>`.
3. **Preview rule.** Say in a few lines which moments will be staged and ask before rendering, unless the user already said to go ahead.
4. **Build, render, check, hand over** as the reference says. Only show the sheet after `--qc` reports 0 red, `thumb_sheet.mjs`
   prints no `✗`, and you have looked at it yourself.

Engine details (stages, looks, sets, poses, faces, effects): `${CLAUDE_PLUGIN_ROOT}/skills/make-3d-video/references/engine-api.md`.
