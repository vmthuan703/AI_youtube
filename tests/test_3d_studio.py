"""Kiểm thử nhanh cho các công cụ Python của plugin aitrends-3d-studio (không cần trình duyệt)."""
import json, os, shutil, subprocess, sys

import pytest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KIT = os.path.join(ROOT, "plugins", "aitrends-3d-studio", "skills", "make-3d-video", "kit")
PLUGIN = os.path.join(ROOT, "plugins", "aitrends-3d-studio")
need_ffmpeg = pytest.mark.skipif(not shutil.which("ffmpeg"), reason="cần ffmpeg")


def run(args, cwd):
    return subprocess.run([sys.executable, *args], cwd=cwd, capture_output=True, text=True)


def test_kit_files_match_hash_table():
    r = run(["tools/verify_kit.py"], KIT)
    assert r.returncode == 0, r.stdout


def test_manifests_and_skills_have_frontmatter():
    pj = json.load(open(os.path.join(PLUGIN, ".claude-plugin", "plugin.json")))
    assert pj["name"] == "aitrends-3d-studio"
    mk = json.load(open(os.path.join(ROOT, ".claude-plugin", "marketplace.json")))
    assert any(p["name"] == "aitrends-3d-studio" and p["source"] == "./plugins/aitrends-3d-studio" for p in mk["plugins"])
    for name in ["make-3d-video", "new-3d-video", "3d-video-styles", "render-3d-video", "3d-video-sound"]:
        txt = open(os.path.join(PLUGIN, "skills", name, "SKILL.md"), encoding="utf-8").read()
        assert txt.startswith("---\nname: " + name + "\n"), name
        assert "description:" in txt.split("---")[1]


def test_reference_files_mentioned_in_skill_exist():
    skill = open(os.path.join(PLUGIN, "skills", "make-3d-video", "SKILL.md"), encoding="utf-8").read()
    for ref in ["install", "voiceover", "style-bible", "story-breakdown", "engine-api", "sound-design", "render-qc"]:
        assert f"references/{ref}.md" in skill
        assert os.path.exists(os.path.join(PLUGIN, "skills", "make-3d-video", "references", ref + ".md"))


@need_ffmpeg
def test_new_project_and_parse_script_keep_quality_and_speakers(tmp_path):
    ws = tmp_path / "studio"
    shutil.copytree(os.path.join(KIT, "tools"), ws / "tools")
    wav = tmp_path / "v.wav"
    subprocess.run(["ffmpeg", "-v", "error", "-f", "lavfi", "-i", "anullsrc=r=24000:cl=mono", "-t", "3", str(wav)], check=True)
    words = {"words": [{"word": "Hi", "start": 0.1, "end": 0.4, "speaker": "NARRATOR"},
                       {"word": "Dude...", "start": 1.0, "end": 1.5, "speaker": "JAKE"}]}
    wj = tmp_path / "words.json"; wj.write_text(json.dumps(words))
    r = run(["tools/new_project.py", "--name", "t", "--voice", str(wav), "--fps", "60", "--quality", "max",
             "--resolution", "1080p", "--upscale", "1440p", "--title", "T"], ws)
    assert r.returncode == 0, r.stderr
    cfg = json.load(open(ws / "projects" / "t" / "config.json"))
    assert (cfg["fps"], cfg["quality"], cfg["resolution"], cfg["style"]) == (60, "max", "1080p", "cinematic")
    assert cfg["export"] == {"upscale": "1440p"}
    r = run(["tools/parse_script.py", "--project", "projects/t", "--script", str(wj)], ws)
    assert r.returncode == 0, r.stderr
    got = json.load(open(ws / "projects" / "t" / "timeline" / "words.json"))["words"]
    assert [w.get("speaker") for w in got] == ["NARRATOR", "JAKE"]
