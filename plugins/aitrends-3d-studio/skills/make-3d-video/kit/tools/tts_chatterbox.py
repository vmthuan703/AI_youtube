#!/usr/bin/env python3
"""Script -> voiceover with Chatterbox (Resemble AI, MIT). Same outputs as tools/tts.py, so the rest of the studio is unchanged.

Run with the Chatterbox venv, not the system Python:
  .venvs/chatterbox/Scripts/python tools/tts_chatterbox.py --script scripts/x_VO.txt --out-dir build_voice/x \
      --voices "NARRATOR=am_michael,MOM=af_sarah" --lexicon scripts/x.lex --preview 6

Outputs in --out-dir: voiceover.wav/.mp3, words.json, lines.json, script.txt, tts_report.json, qc.json, chunks/ (cache).

--voices values, per speaker:
  am_michael ...   a Kokoro voice: its timbre is cloned from a clip made locally with tools/tts.py (refs/<voice>.wav)
  default          Chatterbox's built-in voice
  path/to/x.wav    your own recording (10+ s, one speaker, no music). Only clone a voice you have the right to use.

Every chunk is transcribed back with faster-whisper: that gives real word timings and catches dropped or invented words.
A chunk that fails is regenerated with another seed (--tries). Whatever still fails is listed in qc.json and printed.
Chunks are cached by content, so a re-run only redoes what changed.
"""
from __future__ import annotations

import argparse
import difflib
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from tts import load_lexicon, normalize, parse_script, parse_voice_map, split_sentences  # noqa: E402

ROOT = os.path.dirname(HERE)
os.environ.setdefault("HF_HOME", os.path.join(ROOT, ".cache", "hf"))   # models stay with the studio


def brand_voice() -> dict:
    """channel/brand.json -> voice: the choices already made for this channel."""
    try:
        return json.load(open(os.path.join(ROOT, "channel", "brand.json"), encoding="utf-8")).get("voice", {})
    except (OSError, ValueError):
        return {}


REF_TEXT = ("I wasn't sure what to say at first, so I just told her the truth. We talked for a while about school, "
            "about home, about nothing at all. And somehow, by the end of it, everything felt a little bit easier. "
            "Funny how that works, isn't it?")
ONES = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen " \
       "seventeen eighteen nineteen".split()
TENS = "_ _ twenty thirty forty fifty sixty seventy eighty ninety".split()


def spell(n: int) -> str:
    if n < 20:
        return ONES[n]
    if n < 100:
        return TENS[n // 10] + ("" if n % 10 == 0 else " " + ONES[n % 10])
    if n < 1000:
        return ONES[n // 100] + " hundred" + ("" if n % 100 == 0 else " " + spell(n % 100))
    for size, name in ((10**12, "trillion"), (10**9, "billion"), (10**6, "million"), (1000, "thousand")):
        if n >= size:
            return spell(n // size) + " " + name + ("" if n % size == 0 else " " + spell(n % size))
    return str(n)


def tokens(text: str) -> list[str]:
    """Comparable spoken tokens: lower case, no punctuation, digits written out."""
    t = text.lower().replace("’", "'")
    t = re.sub(r"\$", " ", t)
    t = re.sub(r"(\d),(\d)", r"\1\2", t)
    t = re.sub(r"\b(\d{1,2})[:.](\d{2})\b", lambda m: f"{spell(int(m.group(1)))} {spell(int(m.group(2)))}", t)
    t = re.sub(r"\d+", lambda m: f" {spell(int(m.group(0)))} ", t)
    t = t.replace("-", " ")
    return re.sub(r"[^a-z' ]", " ", t).split()


def chunk_line(text: str, max_chars: int, min_chars: int) -> list[str]:
    """Sentences merged greedily: very short ones sound odd alone, very long ones drift."""
    out: list[str] = []
    for s in split_sentences(text):
        if out and (len(out[-1]) < min_chars or (len(s) < min_chars and len(out[-1]) + len(s) < max_chars)) \
                and len(out[-1]) + len(s) + 1 <= max_chars:
            out[-1] += " " + s
        else:
            out.append(s)
    return out


def make_ref(voice: str, ref_dir: str) -> str:
    wav = os.path.join(ref_dir, f"{voice}.wav")
    if os.path.exists(wav):
        return wav
    tmp = os.path.join(ref_dir, "_tmp")
    os.makedirs(tmp, exist_ok=True)
    txt = os.path.join(tmp, "ref.txt")
    open(txt, "w", encoding="utf-8").write(REF_TEXT)
    py = os.environ.get("KOKORO_PYTHON", "py -3.12").split()
    subprocess.run([*py, os.path.join(HERE, "tts.py"), "--script", txt, "--narrator-voice", voice, "--out-dir", tmp,
                    "--no-mp3", "--sentence-pause", "0.2"], check=True, stdout=subprocess.DEVNULL, env={**os.environ, "PYTHONIOENCODING": "utf-8"})
    shutil.move(os.path.join(tmp, "voiceover.wav"), wav)
    shutil.rmtree(tmp, ignore_errors=True)
    return wav


def map_words(orig_words: list[str], spoken: list[tuple[str, float, float]], dur: float, lex: dict):
    """Give every script word a time, from the matched Whisper words; the unmatched are interpolated by length."""
    per = [tokens(normalize(w, lex)) or [w.lower()] for w in orig_words]
    exp = [t for p in per for t in p]
    owner = [i for i, p in enumerate(per) for _ in p]
    sm = difflib.SequenceMatcher(a=exp, b=[s[0] for s in spoken], autojunk=False)
    start: list[float | None] = [None] * len(orig_words)
    end: list[float | None] = [None] * len(orig_words)
    for bl in sm.get_matching_blocks():
        for k in range(bl.size):
            i = owner[bl.a + k]
            _, s, e = spoken[bl.b + k]
            start[i] = s if start[i] is None else min(start[i], s)
            end[i] = e if end[i] is None else max(end[i], e)
    w8 = [max(len(re.sub(r"\W", "", w)), 1) + 1 for w in orig_words]
    n, i, out = len(orig_words), 0, []
    while i < n:
        if start[i] is not None:
            out.append((start[i], end[i]))
            i += 1
            continue
        j = i
        while j < n and start[j] is None:
            j += 1
        a = out[-1][1] if out else 0.0
        b = start[j] if j < n else dur
        b = max(a, b)
        tot = sum(w8[i:j]) or 1
        t = a
        for k in range(i, j):
            d = (b - a) * w8[k] / tot
            out.append((t, t + d))
            t += d
        i = j
    fixed, prev = [], 0.0
    for s, e in out:
        s = max(s, prev)
        e = max(e, s + 0.02)
        fixed.append((round(s, 3), round(e, 3)))
        prev = s
    return fixed


def main(argv=None):
    B = brand_voice()
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--script", required=True)
    p.add_argument("--out-dir", default="build_voice/x")
    p.add_argument("--voices", help="NARRATOR=am_michael,MOM=af_sarah,JAY=default,KAYLA=me.wav")
    p.add_argument("--voice-map", help="JSON file {SPEAKER: voice}")
    p.add_argument("--narrator-voice", default=B.get("narrator", "am_puck"))
    p.add_argument("--ref-dir", default=os.path.join(ROOT, "refs"))
    p.add_argument("--lexicon", help="file of 'word=how to say it' lines")
    p.add_argument("--exaggeration", type=float, default=float(B.get("exaggeration", 0.75)), help="0.25 flat .. 1 dramatic")
    p.add_argument("--speaker-exaggeration", help="JAY=0.6,MOM=0.45")
    p.add_argument("--cfg", type=float, default=float(B.get("cfg", 0.3)), help="lower = looser, slower pacing")
    p.add_argument("--temperature", type=float, default=0.8)
    p.add_argument("--seed", type=int, default=7)
    p.add_argument("--pace", type=float, default=1.0, help="final time-stretch, pitch kept (e.g. 1.06)")
    p.add_argument("--sentence-pause", type=float, default=0.16)
    p.add_argument("--line-pause", type=float, default=0.34)
    p.add_argument("--max-chars", type=int, default=210)
    p.add_argument("--min-chars", type=int, default=28)
    p.add_argument("--tries", type=int, default=3)
    p.add_argument("--redo", default="", help="Comma-separated phrases: make those chunks again with new seeds, keeping only a take heard word for word")
    p.add_argument("--min-match", type=float, default=0.86, help="share of words Whisper must hear for a chunk to pass")
    p.add_argument("--asr-model", default="small.en")
    p.add_argument("--preview", type=int, default=0, help="only the first N script paragraphs")
    p.add_argument("--lines", help="only these paragraph indexes, e.g. 0,5,12 (for comparisons)")
    p.add_argument("--no-mp3", action="store_true")
    a = p.parse_args(argv)

    lines = parse_script(open(a.script, encoding="utf-8").read())
    speakers = {s for s, _, _ in lines}
    vmap = {"NARRATOR": a.narrator_voice}
    vmap.update(parse_voice_map(a.voices, a.voice_map))
    missing = sorted(speakers - set(vmap))
    if missing:
        sys.exit(f"No voice for: {', '.join(missing)}. Add with --voices NAME=voice")
    sexag = {k.upper(): float(v) for k, v in (kv.split("=") for kv in (a.speaker_exaggeration or "").split(",") if "=" in kv)}
    lex = load_lexicon(a.lexicon)
    if a.lines:
        keep = {int(x) for x in a.lines.split(",")}
        lines = [l for i, l in enumerate(lines) if i in keep]
    elif a.preview:
        lines = lines[: a.preview]

    os.makedirs(a.ref_dir, exist_ok=True)
    cache = os.path.join(a.out_dir, "chunks")
    os.makedirs(cache, exist_ok=True)

    import numpy as np
    import time
    import soundfile as sf
    import torch
    import pyloudnorm as ln
    from chatterbox.tts import ChatterboxTTS
    from faster_whisper import WhisperModel

    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"device: {device}" + (f" ({torch.cuda.get_device_name(0)})" if device == "cuda" else ""), flush=True)
    model = None
    conds: dict[str, object] = {}
    builtin = None

    def load():
        nonlocal model, builtin
        if model is None:
            model = ChatterboxTTS.from_pretrained(device=device)
            builtin = model.conds
            if device == "cuda":
                print(f"model VRAM: {torch.cuda.memory_allocated() / 2**30:.2f} GB", flush=True)

    def set_voice(speaker: str, ex: float):
        load()
        v = vmap[speaker]
        if v == "default":
            model.conds = builtin
            return
        if v not in conds:
            ref = v if os.path.exists(v) else make_ref(v, a.ref_dir)
            model.prepare_conditionals(ref, exaggeration=ex)
            conds[v] = model.conds
        model.conds = conds[v]

    asr = WhisperModel(a.asr_model, device="cpu", compute_type="int8", cpu_threads=8)
    meter_cache = {}

    def level(w: np.ndarray, sr: int) -> np.ndarray:
        """Same loudness for every chunk, so speakers and takes don't jump."""
        if len(w) > 0.5 * sr:
            m = meter_cache.setdefault(sr, ln.Meter(sr))
            with np.errstate(all="ignore"):
                l = m.integrated_loudness(w)
            if np.isfinite(l):
                return np.clip(w * 10 ** ((-20 - l) / 20), -1, 1)
        rms = float(np.sqrt((w ** 2).mean())) or 1e-4
        return np.clip(w * (0.1 / rms), -1, 1)

    def trim(w: np.ndarray, sr: int, last_end: float | None) -> tuple[np.ndarray, float]:
        """Cut leading silence and anything after the last spoken word (stray breaths and noise). Returns audio, head cut."""
        env = np.abs(w)
        win = int(sr * 0.02)
        smooth = np.convolve(env, np.ones(win) / win, mode="same")
        on = np.where(smooth > max(0.004, smooth.max() * 0.02))[0]
        if not len(on):
            return w, 0.0
        s = max(0, on[0] - int(0.03 * sr))
        e = on[-1] + int(0.08 * sr)
        if last_end is not None:
            e = min(e, int((last_end + 0.22) * sr))
        out = w[s:max(e, s + 1)].copy()
        fade = min(int(0.03 * sr), len(out))
        if fade:
            out[-fade:] *= np.linspace(1, 0, fade)
        return out, s / sr

    def transcribe(w: np.ndarray, sr: int):
        import librosa
        w16 = librosa.resample(w.astype(np.float32), orig_sr=sr, target_sr=16000)
        segs, _ = asr.transcribe(w16, language="en", beam_size=1, word_timestamps=True, vad_filter=False,
                                 condition_on_previous_text=False)
        out = []
        for seg in segs:
            for x in seg.words or []:
                for tk in tokens(x.word) or []:
                    out.append((tk, float(x.start), float(x.end)))
        return out

    stage: dict[str, float] = {}

    def clock(obj, name: str, label: str):
        fn = getattr(obj, name)
        stage[label] = 0.0

        def run(*k, **kw):
            t0 = time.perf_counter()
            try:
                return fn(*k, **kw)
            finally:
                stage[label] += time.perf_counter() - t0
        setattr(obj, name, run)

    chunks_audio, words, line_meta, qc = [], [], [], []
    t = 0.0
    SR = 24000
    gap = lambda s: np.zeros(int(SR * s), dtype=np.float32)
    for li, (sp, note, txt) in enumerate(lines):
        v = vmap[sp]
        ex = sexag.get(sp, a.exaggeration)
        l_start = t
        pieces = chunk_line(txt, a.max_chars, a.min_chars)
        for ci, piece in enumerate(pieces):
            say = normalize(piece, lex).replace(",,", ",")
            say = re.sub(r"\bu\b", "you", say)
            key = hashlib.sha1(json.dumps([say, v, ex, a.cfg, a.temperature, a.seed, 2]).encode()).hexdigest()[:16]
            wav_p, js_p = os.path.join(cache, key + ".wav"), os.path.join(cache, key + ".json")
            redo = any(r.strip() and r.strip().lower() in say.lower() for r in a.redo.split(","))
            if os.path.exists(wav_p) and os.path.exists(js_p) and not redo:
                w, _ = sf.read(wav_p, dtype="float32")
                info = json.load(open(js_p, encoding="utf-8"))
            else:
                expect = tokens(say)
                best = None
                for attempt in range(8 if redo else a.tries):
                    set_voice(sp, ex)
                    if not stage:
                        clock(model.t3, "inference", "t3")
                        clock(model.s3gen, "inference", "s3")
                        clock(model.watermarker, "apply_watermark", "wm")
                    torch.manual_seed(a.seed + attempt * 101 + (5000 if redo else 0))
                    raw = model.generate(say, exaggeration=ex, cfg_weight=a.cfg, temperature=a.temperature)
                    w = raw.squeeze(0).cpu().numpy().astype(np.float32)
                    del raw
                    # Windows slows down badly once the card is over-committed, so hand back what this take no longer needs.
                    torch.cuda.empty_cache()
                    SR = model.sr
                    w, _ = trim(w, SR, None)
                    t_asr = time.perf_counter()
                    heard = transcribe(w, SR)
                    stage["asr"] = stage.get("asr", 0.0) + time.perf_counter() - t_asr
                    match = difflib.SequenceMatcher(a=expect, b=[h[0] for h in heard], autojunk=False).ratio() if heard else 0.0
                    extra = max(0, len(heard) - len(expect))
                    dur = len(w) / SR
                    wps = len(expect) / max(dur, 0.1)
                    # Normal speech is about 2-3.5 words a second. Outside a wide band something went wrong.
                    sane = 1.2 <= wps <= 5.5 or len(expect) <= 3
                    score = match - 0.02 * extra - (0 if sane else 0.25)
                    if best is None or score > best[0]:
                        best = (score, w, heard, match, attempt, wps)
                    if (match >= 0.999 and extra == 0 and sane) if redo else (match >= a.min_match and extra <= 1 and sane):
                        break
                score, w, heard, match, attempt, wps = best
                print("   time " + " ".join(f"{k}={v:.1f}s" for k, v in stage.items()) + f" audio={len(w) / SR:.1f}s", flush=True)
                for k in stage:
                    stage[k] = 0.0
                last = heard[-1][2] if heard else None
                w2, head = trim(w, SR, last)
                heard = [(h, max(0.0, s - head), max(0.0, e - head)) for h, s, e in heard]
                w = level(w2, SR).astype(np.float32)
                info = {"heard": heard, "match": round(match, 3), "attempt": attempt, "wps": round(wps, 2)}
                sf.write(wav_p, w, SR)
                json.dump(info, open(js_p, "w", encoding="utf-8"), ensure_ascii=False)
            heard = [tuple(h) for h in info["heard"]]
            if note.upper() == "MEMORY":
                # A remembered voice: thinner and a little distant. Same length, so timings hold.
                tmp_i, tmp_o = wav_p + ".m.wav", wav_p + ".mo.wav"
                sf.write(tmp_i, w, SR)
                subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", tmp_i, "-af",
                                "highpass=f=260,lowpass=f=5200,aecho=0.8:0.55:70|140:0.28|0.16", tmp_o], check=True)
                w, _ = sf.read(tmp_o, dtype="float32")
                os.remove(tmp_i)
                os.remove(tmp_o)
            dur = len(w) / SR
            ow = piece.split()
            for wd, (s, e) in zip(ow, map_words(ow, heard, dur, lex)):
                words.append({"word": wd, "start": round(t + s, 3), "end": round(t + min(e, dur), 3), "speaker": sp})
            qc.append({"line": li, "chunk": ci, "speaker": sp, "start": round(t, 2), "dur": round(dur, 2), "match": info["match"],
                       "attempt": info["attempt"], "wps": info["wps"], "text": piece, "heard": " ".join(h[0] for h in heard)})
            chunks_audio += [w, gap(a.sentence_pause)]
            t += dur + a.sentence_pause
            flag = "" if info["match"] >= a.min_match else "  <-- CHECK"
            print(f"[{li + 1}/{len(lines)}.{ci + 1}] {sp:<11} {t:7.1f}s match={info['match']:.2f} try={info['attempt'] + 1} {piece[:52]}{flag}", flush=True)
        line_meta.append({"i": li, "speaker": sp, "note": note, "voice": v, "start": round(l_start, 3),
                          "end": round(t - a.sentence_pause, 3), "text": txt})
        chunks_audio.append(gap(a.line_pause))
        t += a.line_pause

    full = np.concatenate(chunks_audio)
    peak = float(np.abs(full).max()) or 1.0
    full = (full * (0.891 / peak)).astype(np.float32)
    wav = os.path.join(a.out_dir, "voiceover.wav")
    pace = a.pace
    if abs(pace - 1) > 1e-3:
        raw = os.path.join(a.out_dir, "voiceover_raw.wav")
        sf.write(raw, full, SR)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", raw, "-af", f"atempo={pace}", wav], check=True)
        for w in words:
            w["start"], w["end"] = round(w["start"] / pace, 3), round(w["end"] / pace, 3)
        for m in line_meta:
            m["start"], m["end"] = round(m["start"] / pace, 3), round(m["end"] / pace, 3)
        t /= pace
    else:
        sf.write(wav, full, SR)
    if not a.no_mp3:
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wav, "-b:a", "192k", os.path.join(a.out_dir, "voiceover.mp3")], check=True)
    join = lambda n, o: json.dump(o, open(os.path.join(a.out_dir, n), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    join("words.json", {"words": words})
    join("lines.json", line_meta)
    join("qc.json", qc)
    open(os.path.join(a.out_dir, "script.txt"), "w", encoding="utf-8").write("\n".join(f"{m['speaker']}: {m['text']}" for m in line_meta) + "\n")
    bad = [q for q in qc if q["match"] < a.min_match]
    wpm = round(len(words) / max(t, 1) * 60)
    lo, hi = B.get("targetWpm", [160, 175])
    pace_hint = round(a.pace * ((lo + hi) / 2) / max(wpm, 1), 3) if not (lo <= wpm <= hi) else None
    join("tts_report.json", {"duration_s": round(t, 2), "lines": len(line_meta), "words": len(words), "wpm": wpm, "wpm_target": [lo, hi], "pace_hint": pace_hint,
                             "chars": sum(len(m["text"]) for m in line_meta), "voices": {s: vmap[s] for s in sorted(speakers) if s in vmap},
                             "pace": pace, "exaggeration": a.exaggeration, "cfg": a.cfg, "chunks": len(qc), "chunks_below_match": len(bad),
                             "model": "Chatterbox 0.5B (Resemble AI, MIT, includes the Perth audio watermark)"})
    if device == "cuda" and model is not None:
        print(f"peak VRAM: {torch.cuda.max_memory_allocated() / 2**30:.2f} GB")
    m, s = divmod(int(t), 60)
    print(f"\nDone: {wav} ({m}:{s:02d}), {len(words)} words, {len(qc)} chunks, {len(bad)} below match {a.min_match}.")
    print(f"Pace: {wpm} words/min (target {lo}-{hi})." + (f" Re-run with --pace {pace_hint} (cached chunks are reused, pitch stays)." if pace_hint else ""))
    for q in bad:
        print(f"  line {q['line']} ({q['speaker']}) match {q['match']}\n    said : {q['text']}\n    heard: {q['heard']}")


if __name__ == "__main__":
    main()
