---
name: script-to-2d-video
description: Use when the user gives a SCRIPT (no voiceover) and wants a narrated 2D video, or asks to "turn my script into a voiceover", "make the voice from the script", "tạo voiceover từ script", "làm video từ kịch bản". Surveys the user once, generates the voiceover locally with the open-source Kokoro-82M TTS (Apache-2.0, multi-voice, word timings), then hands off to the aitrends-2d-studio:make-2d-video pipeline with the voiceover and an exact word timeline (no Whisper needed).
---

# Script → voiceover (Kokoro, open source) → aiTrends 2D video

The aiTrends 2D Studio plugin needs a finished voiceover. This skill makes that voiceover from a
script, so the user only provides text. The tool is `tools/tts/kokoro_tts.py` in this repository.

## Golden rules
- **Never rewrite the script's words.** The TTS only changes how things are pronounced (11:59 →
  "eleven fifty-nine", $2 million → "two million dollars", 911 → "nine one one"). The original
  words go to `words.json`, captions and the video.
- **Don't guess a character's gender from their name.** Assign a male or female voice only when
  the script makes it explicit (Mom, Mrs., brother, "she"/"he", or a role the author wrote).
  Otherwise ask the user.
- **The user hears a preview before the full render.**

## Step 0: Check or install the TTS (once per machine)
```bash
pip install -r requirements-tts.txt          # kokoro-onnx, soundfile, numpy
python tools/tts/kokoro_tts.py --download    # ~350 MB from GitHub Releases into ~/.cache/kokoro
```
- `ffmpeg` must be on PATH to write the mp3. The wav is written either way.
- If the download fails in a cloud session, `github.com` release assets are blocked by the network
  policy. Read the environment network documentation and tell the user what to allow; don't
  substitute another source silently. `KOKORO_MODEL_DIR` can point at an existing model folder.

## Step 1: Get the script into speaker-tagged form
Accepted input:
- **Speaker-tagged** (best), one paragraph per line of speech:
  `NARRATOR: ...`, `MOM: ...`, `MOM (MEMORY): ...` (the parenthetical becomes a note; same voice).
- **Plain text:** everything is read by NARRATOR.
- **A script table** like `scripts/T4_*.md`: use the matching `scripts/*_VO.txt`. If none exists,
  build one from the "Lời dẫn (VO)" column (NARRATOR) and the "Thoại nhân vật" column (`Name: line`)
  in row order.

Then list the speakers:
```bash
python tools/tts/kokoro_tts.py --script <file> --list-speakers
```

## Step 2: Survey the user (one round, AskUserQuestion, up to 4 questions)
Ask together. Put the recommended option first:
1. **Narrator voice:** `am_michael` warm US male (Recommended) · `af_heart` warm US female (the
   model's best) · `am_fenrir` strong US male · `bm_george` deep UK male.
2. **Pace:** Natural 1.12× (Recommended; ≈ 140 words/min with pauses, a 1,400-word script ≈ 9:45) ·
   Calm 1.0× · Fast 1.2×.
3. **Character voices:** Auto by role (Recommended; show the planned mapping in the option
   description) · Let me choose each.
4. **Video format:** 16:9 1080p, captions off (Recommended) · 9:16 1080p, captions on · 16:9 720p
   quick draft.

Also needed by the video pipeline; use defaults unless the user said otherwise, and state them:
generated music + SFX on, style chosen later from rendered samples, title = the script's title.
If the user is away, take every default and say so.

**Voice pool for auto-assignment** (`--list-voices` prints all 28). Use a different voice per
character, and avoid the narrator's voice:
- women: `af_sarah` (mother/adult), `af_bella` (teen, emotional), `af_sky` (young), `af_nova`
  (professional), `af_alloy`, `af_aoede`, `af_kore`;
- men: `am_puck` (boy/young, add `--speaker-speed NAME=1.2`), `am_liam` (young), `am_onyx` (deep,
  coach), `am_eric`, `am_echo`, `am_adam`, `am_santa` (old);
- UK accents for a deliberate contrast: `bf_emma`, `bm_george`, `bm_lewis`.

## Step 3: Preview, then the full voiceover
```bash
python tools/tts/kokoro_tts.py --script <file> --out-dir out/<slug>_voice \
  --voices "NARRATOR=am_michael,MOM=af_sarah,..." --speed 1.12 \
  --sentence-pause 0.15 --line-pause 0.35 --preview 8
```
- Send `out/<slug>_voice/voiceover.mp3` to the user (SendUserFile). Ask whether the voices and pace
  are OK. Adjust `--voices`, `--speed`, `--speaker-speed`, or add a `--lexicon` file
  (`Okafor=oh KAH for`, one entry per line) for mispronounced names.
- Then run again without `--preview`. CPU speed is about 2× real time, so a 10-minute script takes
  about 5 minutes. Run it in the background for long scripts.
- Check `tts_report.json`. If `duration_s` is far from the target length, change `--speed`
  (0.9–1.25) rather than the text.

Outputs in `out/<slug>_voice/`:
- `voiceover.wav` / `voiceover.mp3`: peak −1 dBFS; the mixer later normalises to −14 LUFS;
- `words.json`: `{words:[{word,start,end,speaker}]}`, the exact sentence timings, with word timings
  spread within each sentence;
- `lines.json`: every speech line with speaker, voice, start and end; use it for character
  lip-sync windows;
- `script.txt`, `tts_report.json`.

## Step 4: Hand off to the 2D pipeline
Invoke the Skill tool with `aitrends-2d-studio:make-2d-video`. In the args, say that **Stage 1 is
already done**, and pass:
- the answers from Step 2 (aspect, resolution, captions, music/SFX, title);
- the voiceover path `out/<slug>_voice/voiceover.mp3`;
- the instruction for Stage 3: create the project with `--voice <that mp3>` and import timing with
  `python tools/parse_script.py --project projects/<slug> --script <abs path>/out/<slug>_voice/words.json`.
  This **replaces `transcribe.py`**: no Whisper, and no Hugging Face download;
- for Stage 4/6: character speech windows come from `lines.json`. Only non-NARRATOR lines get
  `talk: talkAmount(...)`. The narrator is never lip-synced.

Then follow make-2d-video from Stage 2 (install or check the studio) onward, with its own
checkpoints: style choice and preview before the final render.

## Notes
- Kokoro has no voice cloning. It can blend two voices (a weighted average of style vectors) if the
  user wants a unique narrator; add that only on request.
- Licence: Kokoro-82M weights are Apache-2.0, so commercial use (monetised YouTube) is allowed.
  espeak-ng (phonemizer) is GPL; it is used as a tool and not bundled into the output.
