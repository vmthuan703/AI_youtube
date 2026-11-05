# Voiceover from the script (Kokoro-82M, open source, local)

`tools/tts.py` turns the script into a narrated voiceover plus an exact word timeline, so no Whisper is needed.

## Golden rules
- **Never rewrite the script's words.** The TTS only changes pronunciation (11:59 → "eleven fifty-nine", $2 million →
  "two million dollars"). The original words go to `words.json`, captions and on-screen text.
- **Don't guess a character's gender from their name.** Use a male or female voice only when the script makes it explicit
  (Mom, Mrs., brother, "she"/"he", a role the author wrote). Otherwise ask.
- **The user hears a preview before the full voiceover.**

## 1. Script form
- **Speaker-tagged** (best): one paragraph per line of speech, `NARRATOR: ...`, `MOM: ...`, `MOM (MEMORY): ...`
  (the parenthetical is a note; same voice).
- **Plain text**: everything is read by NARRATOR.
- **A table script** (scene / VO / dialogue columns): build a tagged file from the VO column (NARRATOR) and the dialogue
  column (`Name: line`) in row order, save it in the project's `input/`, and show the user the speaker list.
- List speakers: `python tools/tts.py --script <file> --list-speakers`.

## 2. Voices
- Narrator: `am_michael` warm US male (default) · `af_heart` warm US female (the model's best) · `am_fenrir` strong US
  male · `bm_george` deep UK male. `python tools/tts.py --list-voices` prints all 28.
- Character pool (a different voice per character, never the narrator's): women `af_sarah` (mother/adult), `af_bella`
  (teen, emotional), `af_sky` (young), `af_nova` (professional), `af_alloy`, `af_aoede`, `af_kore`; men `am_puck`
  (boy/young, add `--speaker-speed NAME=1.2`), `am_liam` (young), `am_onyx` (deep, coach), `am_eric`, `am_echo`,
  `am_adam`, `am_santa` (old); UK contrast `bf_emma`, `bm_george`, `bm_lewis`.
- Pace: natural 1.12× (≈ 140 words/min with pauses; a 1,400-word script ≈ 9:45), calm 1.0×, fast 1.2×.

## 3. Preview, then the full voiceover
```bash
python tools/tts.py --script <file> --out-dir build_voice/<slug> \
  --voices "NARRATOR=am_michael,JAKE=am_liam" --speed 1.12 --sentence-pause 0.15 --line-pause 0.35 --preview 8
```
Send `build_voice/<slug>/voiceover.mp3` (SendUserFile) and ask whether voices and pace are OK. Adjust `--voices`,
`--speed`, `--speaker-speed`, or a `--lexicon` file (`Okafor=oh KAH for`, one per line) for mispronounced names. Then run
again without `--preview` (CPU ≈ 2× real time; run long scripts in the background). Check `tts_report.json`: change
`--speed` (0.9–1.25) rather than the text to hit a target length.

Outputs: `voiceover.wav/.mp3` (peak −1 dBFS; the mixer normalises to −14 LUFS), `words.json` (`{words:[{word, start, end,
speaker}]}`), `lines.json` (speaker, voice, start, end, text), `script.txt`, `tts_report.json`.

## 4. Into the project
```bash
python tools/new_project.py --name <slug> --voice build_voice/<slug>/voiceover.mp3 --lines build_voice/<slug>/lines.json \
  --script <script file> --aspect 16:9 --resolution 1080p --fps 60 --quality high --title "<title>" [--captions] [--upscale 1440p]
python tools/parse_script.py --project projects/<slug> --script build_voice/<slug>/words.json
```
`parse_script.py` keeps each word's speaker, so shots lip-sync characters with `talkFor('JAKE', info.globalT)`.

## Bringing your own voiceover instead
`new_project.py --voice <file> --script <plain script>` then `python tools/transcribe.py --project projects/<slug>
--script projects/<slug>/input/script.txt --lang en --model small` (needs faster-whisper; ≥ 90% match required), or a
timestamped script with `parse_script.py`.

## Licence
Kokoro-82M weights are Apache-2.0: commercial use (monetised YouTube) is allowed. espeak-ng (phonemizer) is GPL and is
used as a tool, not bundled into the output.
