#!/usr/bin/env python3
"""Script -> voiceover bằng Kokoro-82M (mã nguồn mở, Apache-2.0, chạy CPU).

Đầu vào: kịch bản dạng
  - có tên người nói:  "NARRATOR: ...", "MOM: ...", "MOM (MEMORY): ..." (mỗi đoạn một người nói), hoặc
  - văn bản thường: toàn bộ do NARRATOR đọc.

Đầu ra (trong --out-dir):
  voiceover.wav / voiceover.mp3   giọng đọc hoàn chỉnh
  words.json                      {"words":[{word,start,end,speaker}]}: dùng thẳng với
                                  aitrends-3d-studio `tools/parse_script.py` (không cần Whisper)
  lines.json                      từng dòng: speaker, voice, start, end, text (để lip-sync nhân vật)
  script.txt                      lời đọc thuần theo thứ tự (để đối chiếu)
  tts_report.json                 thời lượng, số ký tự, giọng theo nhân vật

Ví dụ:
  python tools/tts.py --download
  python tools/tts.py --script scripts/x_VO.txt --list-speakers
  python tools/tts.py --script scripts/x_VO.txt --out-dir out/x \
      --voices NARRATOR=am_michael,MOM=af_sarah --speed 1.0
"""
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import urllib.request

MODEL_URL = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/"
MODEL_FILES = ("kokoro-v1.0.onnx", "voices-v1.0.bin")
DEFAULT_MODEL_DIR = os.environ.get("KOKORO_MODEL_DIR", os.path.expanduser("~/.cache/kokoro"))
SR = 24000

# Giọng tiếng Anh của Kokoro v1.0 (a = Mỹ, b = Anh; f = nữ, m = nam).
VOICES = {
    "af_heart": "Mỹ, nữ, ấm (chất lượng cao nhất)", "af_bella": "Mỹ, nữ, trẻ, nhiều cảm xúc",
    "af_nicole": "Mỹ, nữ, thì thầm/nhẹ", "af_sarah": "Mỹ, nữ, trưởng thành",
    "af_sky": "Mỹ, nữ, trẻ", "af_nova": "Mỹ, nữ, chuyên nghiệp", "af_alloy": "Mỹ, nữ, trung tính",
    "af_aoede": "Mỹ, nữ", "af_jessica": "Mỹ, nữ", "af_kore": "Mỹ, nữ", "af_river": "Mỹ, nữ",
    "am_michael": "Mỹ, nam, trầm ấm (hợp người dẫn)", "am_fenrir": "Mỹ, nam, mạnh",
    "am_puck": "Mỹ, nam, trẻ, lém lỉnh", "am_echo": "Mỹ, nam", "am_eric": "Mỹ, nam",
    "am_liam": "Mỹ, nam, trẻ", "am_onyx": "Mỹ, nam, trầm", "am_adam": "Mỹ, nam",
    "am_santa": "Mỹ, nam, già",
    "bf_emma": "Anh, nữ", "bf_isabella": "Anh, nữ", "bf_alice": "Anh, nữ", "bf_lily": "Anh, nữ",
    "bm_george": "Anh, nam, trầm", "bm_fable": "Anh, nam", "bm_lewis": "Anh, nam", "bm_daniel": "Anh, nam",
}

SPEAKER_RX = re.compile(r"^\s*([A-Z][A-Z0-9 .'\-]{0,30}?)(?:\s*\(([^)]*)\))?\s*:\s+(.*)$")
ONES = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen " \
       "sixteen seventeen eighteen nineteen".split()
TENS = "_ _ twenty thirty forty fifty sixty seventy eighty ninety".split()


def num2words(n: int) -> str:
    if n < 20:
        return ONES[n]
    if n < 100:
        return TENS[n // 10] + ("" if n % 10 == 0 else "-" + ONES[n % 10])
    return str(n)  # số lớn hơn để espeak tự đọc


# ---------------------------------------------------------------- chuẩn hoá cách đọc
def normalize(text: str, lexicon: dict[str, str]) -> str:
    """Chỉ đổi CÁCH ĐỌC (đưa cho TTS). Chữ gốc vẫn dùng cho words.json/caption."""
    t = text
    for k, v in lexicon.items():
        t = re.sub(rf"(?<![\w$]){re.escape(k)}(?!\w)", v, t)

    def clock(m):
        h, mm = int(m.group(1)), m.group(2)
        if mm == "00":
            return f"{num2words(h)} o'clock" if not m.group(3) else num2words(h)
        if mm.startswith("0"):
            return f"{num2words(h)} oh {num2words(int(mm))}"
        return f"{num2words(h)} {num2words(int(mm))}"
    t = re.sub(r"\b(\d{1,2}):(\d{2})\b(?=(\s*[ap]\.m\.)?)", clock, t)
    t = re.sub(r"\b([ap])\.m\.", lambda m: f"{m.group(1).upper()} M,", t)
    t = re.sub(r"\$(\d[\d,.]*)\s*(million|billion|thousand|trillion)\b", r"\1 \2 dollars", t)
    t = re.sub(r"\$(\d[\d,.]*)", r"\1 dollars", t)
    t = re.sub(r"\b911\b", "nine one one", t)
    t = re.sub(r"\bMr\.", "Mister", t)
    t = re.sub(r"\bMrs\.", "Missus", t)
    t = re.sub(r"\bDr\.", "Doctor", t)
    t = re.sub(r"\bvs\.", "versus", t)
    t = re.sub(r"(\d)%", r"\1 percent", t)
    t = re.sub(r"\.\.\.|…", ",", t)
    return t


# ---------------------------------------------------------------- đọc kịch bản
def parse_script(text: str):
    """Trả list (speaker, note, text). Đoạn không có tên -> nối vào đoạn trước, hoặc NARRATOR."""
    paras = [p.strip() for p in re.split(r"\n\s*\n|\n(?=[A-Z][A-Z0-9 .'\-]{0,30}(?:\s*\([^)]*\))?\s*:\s)", text) if p.strip()]
    out = []
    for p in paras:
        p = re.sub(r"\s+", " ", p)
        m = SPEAKER_RX.match(p)
        if m:
            out.append((m.group(1).strip(), (m.group(2) or "").strip(), m.group(3).strip()))
        elif out:
            sp, note, prev = out[-1]
            out[-1] = (sp, note, prev + " " + p)
        else:
            out.append(("NARRATOR", "", p))
    return out


def split_sentences(text: str):
    # tách sau . ! ? nhưng không tách a.m. / p.m. / Mr. / số thập phân
    protected = re.sub(r"\b([ap])\.m\.", r"\1<D>m<D>", text)
    protected = re.sub(r"\b(Mr|Mrs|Dr|Ms|St|vs|U\.S)\.", r"\1<D>", protected)
    protected = re.sub(r"(\d)\.(\d)", r"\1<D>\2", protected)
    parts = re.split(r"(?<=[.!?])\s+", protected)
    return [p.replace("<D>", ".").strip() for p in parts if p.strip()]


def word_spans(sentence: str, start: float, end: float):
    """Chia thời lượng câu cho từng từ theo độ dài ĐỌC (sau chuẩn hoá) của từ."""
    words = sentence.split()
    weights = [max(len(re.sub(r"[^\w]", "", normalize(w, {}))), 1) + 1 for w in words]
    tot = sum(weights)
    t, out = start, []
    for w, k in zip(words, weights):
        d = (end - start) * k / tot
        out.append((w, round(t, 3), round(t + d, 3)))
        t += d
    return out


# ---------------------------------------------------------------- tiện ích
def download(model_dir: str):
    os.makedirs(model_dir, exist_ok=True)
    for f in MODEL_FILES:
        p = os.path.join(model_dir, f)
        if os.path.exists(p) and os.path.getsize(p) > 1_000_000:
            print(f"đã có {p}")
            continue
        print(f"tải {f} ...")
        urllib.request.urlretrieve(MODEL_URL + f, p)
    print("xong:", model_dir)


def parse_voice_map(s: str | None, path: str | None):
    m = {}
    if path:
        m.update({k.upper(): v for k, v in json.load(open(path, encoding="utf-8")).items()})
    if s:
        for kv in s.split(","):
            if "=" in kv:
                k, v = kv.split("=", 1)
                m[k.strip().upper()] = v.strip()
    return m


def load_lexicon(path: str | None):
    if not path:
        return {}
    lex = {}
    for line in open(path, encoding="utf-8"):
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            lex[k.strip()] = v.strip()
    return lex


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--script", help="file kịch bản (.txt/.md)")
    p.add_argument("--out-dir", default="out/voiceover")
    p.add_argument("--model-dir", default=DEFAULT_MODEL_DIR)
    p.add_argument("--download", action="store_true", help="tải model Kokoro (~350 MB) từ GitHub Releases")
    p.add_argument("--list-voices", action="store_true")
    p.add_argument("--list-speakers", action="store_true", help="liệt kê người nói trong kịch bản rồi thoát")
    p.add_argument("--voices", help="vd: NARRATOR=am_michael,MOM=af_sarah")
    p.add_argument("--voice-map", help="file JSON {SPEAKER: voice}")
    p.add_argument("--narrator-voice", default="am_michael")
    p.add_argument("--speed", type=float, default=1.0, help="0.8–1.2; 1.0 ≈ 165 từ/phút")
    p.add_argument("--speaker-speed", help="vd: SAM=1.1,PRIYA=0.95")
    p.add_argument("--sentence-pause", type=float, default=0.28)
    p.add_argument("--line-pause", type=float, default=0.45, help="nghỉ giữa các đoạn/người nói")
    p.add_argument("--lexicon", help="file 'chữ=cách đọc' mỗi dòng, vd: Okafor=oh KAH for")
    p.add_argument("--lang", default="en-us")
    p.add_argument("--preview", type=int, default=0, help="chỉ đọc N đoạn đầu để nghe thử")
    p.add_argument("--no-mp3", action="store_true")
    p.add_argument("--accept-script-check", action="store_true", help="1.0.7: go ahead after the user has read the script check")
    a = p.parse_args(argv)

    if a.download:
        download(a.model_dir)
        if not a.script:
            return
    if a.list_voices:
        for k, v in VOICES.items():
            print(f"{k:12} {v}")
        return
    if not a.script:
        p.error("cần --script")
    lines = parse_script(open(a.script, encoding="utf-8").read())
    speakers = {}
    for sp, _, txt in lines:
        speakers.setdefault(sp, [0, 0])
        speakers[sp][0] += 1
        speakers[sp][1] += len(txt)
    if a.list_speakers:
        print(json.dumps({k: {"lines": v[0], "chars": v[1]} for k, v in speakers.items()}, ensure_ascii=False, indent=1))
        return
    if not a.preview:
        from script_check import gate
        gate(a.script, a.out_dir, a.accept_script_check)

    vmap = {"NARRATOR": a.narrator_voice, **parse_voice_map(a.voices, a.voice_map)}
    missing = [s for s in speakers if s not in vmap]
    if missing:
        sys.exit(f"Chưa có giọng cho: {', '.join(missing)}. Thêm bằng --voices TEN=giong (xem --list-voices).")
    bad = {v for v in vmap.values() if v not in VOICES}
    if bad:
        sys.exit(f"Giọng không tồn tại: {bad}. Xem --list-voices.")
    sspeed = {k.upper(): float(v) for k, v in (kv.split("=") for kv in (a.speaker_speed or "").split(",") if "=" in kv)}
    lex = load_lexicon(a.lexicon)

    import numpy as np
    import soundfile as sf
    from kokoro_onnx import Kokoro
    mp = [os.path.join(a.model_dir, f) for f in MODEL_FILES]
    if not all(os.path.exists(x) for x in mp):
        sys.exit(f"Thiếu model trong {a.model_dir}. Chạy: python tools/tts.py --download")
    k = Kokoro(*mp)

    if a.preview:
        lines = lines[: a.preview]
    os.makedirs(a.out_dir, exist_ok=True)
    chunks, words, line_meta, t = [], [], [], 0.0
    gap = lambda s: np.zeros(int(SR * s), dtype=np.float32)
    for i, (sp, note, txt) in enumerate(lines):
        voice, speed = vmap[sp], sspeed.get(sp, a.speed)
        l_start = t
        for sent in split_sentences(txt):
            audio, sr = k.create(normalize(sent, lex), voice=voice, speed=speed, lang=a.lang)
            assert sr == SR
            dur = len(audio) / SR
            for w, ws, we in word_spans(sent, t, t + dur):
                words.append({"word": w, "start": ws, "end": we, "speaker": sp})
            chunks += [audio, gap(a.sentence_pause)]
            t += dur + a.sentence_pause
        line_meta.append({"i": i, "speaker": sp, "note": note, "voice": voice,
                          "start": round(l_start, 3), "end": round(t - a.sentence_pause, 3), "text": txt})
        chunks.append(gap(a.line_pause))
        t += a.line_pause
        print(f"[{i + 1}/{len(lines)}] {sp:<12} {voice:<11} {l_start:7.1f}s  {txt[:60]}")

    wav = os.path.join(a.out_dir, "voiceover.wav")
    full = np.concatenate(chunks)
    peak = float(np.abs(full).max()) or 1.0
    full = (full * (0.891 / peak)).astype(np.float32)   # đỉnh -1 dBFS, tránh vỡ tiếng khi ghi PCM16
    sf.write(wav, full, SR)
    if not a.no_mp3 and shutil.which("ffmpeg"):
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wav, "-b:a", "192k",
                        os.path.join(a.out_dir, "voiceover.mp3")], check=True)
    json.dump({"words": words}, open(os.path.join(a.out_dir, "words.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    json.dump(line_meta, open(os.path.join(a.out_dir, "lines.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    open(os.path.join(a.out_dir, "script.txt"), "w", encoding="utf-8").write("\n".join(f"{m['speaker']}: {m['text']}" for m in line_meta) + "\n")
    report = {"duration_s": round(t, 2), "lines": len(line_meta), "words": len(words),
              "chars": sum(len(m["text"]) for m in line_meta), "voices": {s: vmap[s] for s in speakers},
              "speed": a.speed, "peak_before_norm": round(peak, 3), "model": "Kokoro-82M v1.0 (ONNX), Apache-2.0"}
    json.dump(report, open(os.path.join(a.out_dir, "tts_report.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    m, s = divmod(int(t), 60)
    print(f"\nXong: {wav} ({m}:{s:02d}), {len(words)} từ. Mốc thời gian: words.json")


if __name__ == "__main__":
    main()
