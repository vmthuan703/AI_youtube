# Voiceover from the script

`tools/tts_chatterbox.py` turns the script into a narrated voiceover plus an exact word timeline. It runs Chatterbox (Resemble AI, MIT), cloning the timbre of a
Kokoro voice, because the channel wants an emotional young narrator. `tools/tts.py` (Kokoro-82M) makes the reference clips and is the fallback when there is no GPU or a quick draft is enough.

## Golden rules
- **Never rewrite the script's words.** The TTS only changes pronunciation (11:59 → "eleven fifty-nine", $2 million →
  "two million dollars"). The original words go to `words.json`, captions and on-screen text.
- **Don't guess a character's gender from their name.** Use a male or female voice only when the script makes it explicit
  (Mom, Mrs., brother, "she"/"he", a role the author wrote). Otherwise ask.
- **The user hears a preview before the full voiceover.**
- **Keep the GPU free while Chatterbox runs.** On a 6 GB card, a render running at the same time pushes video memory over the limit and sampling falls from over 20 to under 2 steps/s. No renders, no test stills.
- **Measure before quoting a time.** Expect about 2–3 s of wall time per second of audio on a GTX 1660 Super, but time one full-length sentence first: short samples are misleadingly fast.

## 1. Script form
- **Speaker-tagged** (best): one paragraph per line of speech, `NARRATOR: ...`, `MOM: ...`, `MOM (MEMORY): ...`
  (the parenthetical is a note; same voice).
- **Plain text**: everything is read by NARRATOR.
- **A table script** (scene / VO / dialogue columns): build a tagged file from the VO column (NARRATOR) and the dialogue
  column (`Name: line`) in row order, save it in the project's `input/`, and show the user the speaker list.
- List speakers: `python tools/tts.py --script <file> --list-speakers`.

## 2. Voices
- **Narrator:** `am_puck+1.5` (lively young male, pitch raised 1.5 semitones so he sounds younger) at exaggeration **1.0**, cfg 0.3. These are the channel's choices in `channel/brand.json` and the script's defaults (approved 2026-11-08; 0.75 was too flat). `am_michael` was tried and found not emotional enough.
- **Roster voices** (`channel/brand.json` → `voice.roles`): the hero `am_liam+3` (sounds about 15, the audience's age), the curly-haired BRO speaks with a girl's voice `af_nova` (the look stays), BESTIE `af_sky`, RIVAL `am_onyx`, MOM `af_sarah`, COACH `am_fenrir`, SHADY `am_echo`. Give each speaker the voice of the roster role that plays them unless the script's `.voices` says otherwise.
- **Younger / older voices:** append semitones to any voice name: `am_liam+3`, `af_sky+1`, `am_onyx-2`. The clone clip is pitch-shifted once and cached as `refs/<name>.wav`. +1..+3 sounds younger without chipmunk; more than +4 is a cartoon.
- Character pool (a different voice per character, never the narrator's): women `af_sarah` (mother/adult), `af_bella`
  (teen, emotional), `af_sky` (young), `af_nova` (professional), `af_aoede`, `af_kore`; men `am_liam` (young), `am_onyx` (deep, coach), `am_eric`, `am_echo`,
  `am_fenrir` (strong), `am_michael` (warm). `python tools/tts.py --list-voices` prints all 28.
- A voice name means "clone this Kokoro voice": the clip is made once with `tools/tts.py` and kept in `refs/<voice>.wav`. `default` is Chatterbox's own voice. A path uses your own recording (10+ s, one speaker, no music; only a voice you have the right to use).
- **Pace target: 160–175 words per minute** (references: 159–177). Chatterbox at cfg 0.3 can run slow; the run prints the pace and suggests a `--pace` value when it is off. It re-stretches the finished audio with the pitch kept, and cached chunks are reused.

## 3. Preview, then the full voiceover
```bash
.venvs/chatterbox/Scripts/python tools/tts_chatterbox.py --script <file> --out-dir build_voice/<slug> \
  --voices "NARRATOR=am_puck,JAKE=am_liam" --lexicon scripts/<slug>.lex --preview 6
```
Send `build_voice/<slug>/voiceover.mp3` (SendUserFile) and ask whether voices and pace are OK. Adjust `--voices`,
`--exaggeration`, `--speaker-exaggeration JAKE=0.6`, `--cfg`, or a `--lexicon` file (`Okafor=oh KAH for`, one per line, spoken only) for mispronounced names. Then run
again without `--preview`, in the background for long scripts.

Every chunk is transcribed back with faster-whisper: that gives the word timings and catches dropped or invented words. A chunk that fails is regenerated with another seed. Whatever still fails is listed at the end and in `qc.json`; listen to those, and use `--redo "phrase"` to make a chunk again. Restarting is cheap because finished chunks are cached. If sampling slows down, check `nvidia-smi` first.

Outputs: `voiceover.wav/.mp3` (peak −1 dBFS; the mixer normalises to −14 LUFS), `words.json` (`{words:[{word, start, end,
speaker}]}`), `lines.json` (speaker, voice, start, end, text), `script.txt`, `qc.json`, `tts_report.json` (duration, `wpm`, `pace_hint`, voices).

**Kokoro fallback** (no GPU, or a quick draft): `python tools/tts.py --script <file> --out-dir build_voice/<slug> --voices "NARRATOR=am_puck,JAKE=am_liam" --speed 1.12 --sentence-pause 0.15 --line-pause 0.35 --preview 8`. Same outputs. Less emotional; say so if you use it.

## 4. Into the project
```bash
python tools/new_project.py --name <slug> --voice build_voice/<slug>/voiceover.mp3 --lines build_voice/<slug>/lines.json \
  --script <script file> --title "<title>"
python tools/parse_script.py --project projects/<slug> --script build_voice/<slug>/words.json
```
Style, bars, resolution, fps, quality and upscale come from `channel/brand.json`. `parse_script.py` keeps each word's speaker, so shots lip-sync characters with `talkFor('JAKE', info.globalT)`, and `lines.json` drives the speech bubbles.

## Bringing your own voiceover instead
`new_project.py --voice <file> --script <plain script>` then `python tools/transcribe.py --project projects/<slug>
--script projects/<slug>/input/script.txt --lang en --model small` (needs faster-whisper; ≥ 90% match required), or a
timestamped script with `parse_script.py`.

## Licence
Chatterbox is MIT and adds Resemble's Perth audio watermark. Kokoro-82M weights are Apache-2.0: commercial use (monetised YouTube) is allowed. espeak-ng (phonemizer) is GPL and is
used as a tool, not bundled into the output.
