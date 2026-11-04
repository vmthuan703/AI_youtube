import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(__file__)), "tools", "tts"))
import kokoro_tts as kt


def test_normalize_reading_only():
    assert kt.normalize("It's 11:59 p.m.", {}) == "It's eleven fifty-nine P M,"
    assert kt.normalize("7:02 a.m.", {}) == "seven oh two A M,"
    assert kt.normalize("6:00 a.m.", {}) == "six A M,"
    assert kt.normalize("$2 million", {}) == "2 million dollars"
    assert kt.normalize("Call 911.", {}) == "Call nine one one."
    assert kt.normalize("Mr. Okafor", {"Okafor": "oh KAH for"}) == "Mister oh KAH for"


def test_parse_script_speakers_and_notes():
    s = "NARRATOR: Hello there.\n\nMOM (MEMORY): Put me in your favorites.\nMRS. ALVAREZ: I'm going!\n\ncontinued line"
    lines = kt.parse_script(s)
    assert [l[0] for l in lines] == ["NARRATOR", "MOM", "MRS. ALVAREZ"]
    assert lines[1][1] == "MEMORY"
    assert lines[2][2] == "I'm going! continued line"
    assert kt.parse_script("Just plain text.")[0][0] == "NARRATOR"


def test_split_sentences_keeps_abbreviations():
    assert kt.split_sentences("It's 11:59 p.m. Your phone. Mr. Okafor said 1.9 million. Done!") == \
        ["It's 11:59 p.m. Your phone.", "Mr. Okafor said 1.9 million.", "Done!"]


def test_word_spans_cover_sentence():
    spans = kt.word_spans("You flip it over.", 2.0, 4.0)
    assert spans[0][1] == 2.0 and abs(spans[-1][2] - 4.0) < 1e-6
    assert all(a[2] <= b[1] + 1e-9 for a, b in zip(spans, spans[1:]))
