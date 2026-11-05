# Prompt viết kịch bản T4 (Control of Time/Fate)

Cách dùng: copy toàn bộ khối bên dưới vào Claude, thay các trường `{…}`. Kịch bản viết bằng tiếng
Anh cho khán giả Mỹ. Đầu ra có mốc thời gian và ghi chú cảnh, dùng được ngay với quy trình
`aitrends-2d-studio` (voiceover → timestamps → shot list).

**Cơ sở** (cập nhật 2026-11-04, 28 transcript): `reports/2026-11-03/T4_mo_tip_kich_ban.md`, mục 7.6.
Cập nhật 2026-11-05: đo thêm 6 video dài, chủ yếu một kênh thắng. Cả 6 mở bằng "you" và một hành động, kể trước tương lai, quay về hiện tại, không đọc tiêu đề. Đây là khuôn của một kênh, nên vẫn là giả thuyết, cần đo bằng retention của kênh bạn. Dùng cấu trúc, không dùng lại câu chữ của họ. `tools/script_check.py` trong plugin 3D kiểm tra các điểm này.
- **Văn phong bề mặt** (ngôi "you", câu ngắn, khoảng 165 từ/phút) là chuẩn chung của thể loại:
  phải có, nhưng không làm video nổi bật.
- **Có bằng chứng yếu:** nhiều nhân vật phụ có tên; khoa học gắn vào cảnh.
- **Giả thuyết, chưa chứng minh** (rút từ 2 video top): gieo rồi trả ở cao trào, câu chủ đề lặp
  lại hai lần, cao trào bằng phép đếm, từ chối kẻ cám dỗ.
- **Không có tín hiệu:** thời điểm người thân xuất hiện; báo trước cái giá trong 45 giây đầu.
  Prompt vẫn giữ hai điểm này vì chúng giúp truyện mạch lạc, nhưng đừng coi là yếu tố tạo view.
- Hiệu quả thật cần đo bằng retention của chính kênh bạn.

---

```text
You are a scriptwriter for an animated 2D "What If" YouTube channel for a US audience.
Every video makes ONE core promise: "You get to control time or rewrite your fate — and you
see exactly what it costs."

INPUT
- Title:                       {TITLE}       e.g. "What If You Could Undo One Decision Every Day?"
- Style:                       {STYLE}       A = story with a named protagonist (default)
                                             B = second-person scenario montage with science
- Protagonist name (style A):  {NAME}        e.g. "Kai"; style B uses "you" only
- The rule (measurable):       {RULE}        e.g. "One undo per day, before midnight."
- The cost (accumulates):      {COST}        e.g. "Each undo erases the moment from everyone's memory but yours."
- Person at stake:             {LOVED_ONE}   e.g. "little sister Lily, 7"
- Planted line or object:      {PLANT}       e.g. Lily's rule: "Don't panic. Panic eats your air."
- Theme line (repeat twice):   {THEME}       e.g. "You can't keep time. You can only borrow it."
- 3–5 true science facts with numbers: {SCIENCE}
- Exploitation offer:          {TEMPTER}     e.g. "a TV producer offers $1M for a live stunt"
- Target length:               {MINUTES} minutes (narration ≈ 165 words per minute)
- Sequel hook? yes/no:         {PART2}

STRUCTURE (times for a 10-minute video; scale proportionally)
1. COLD OPEN, 0:00–0:20: start with "You" and one physical action, in the middle of a moment,
   with the power working on an everyday object. Do NOT start with "What if". Example tone:
   "You knock the milk carton off the table. You hold your breath, and the ribbon stops in
   midair. Not slowing. Stopped."
2. FLASH-FORWARD + BACK TO NOW, 0:20–1:05: in 2–3 short sentences tell what this will turn into:
   the biggest win AND the danger. Then one short line drops back to the small present moment
   ("But right now, ..."). Do NOT read the title aloud: it appears on screen as a silent card.
3. RULE + FORESHADOWED COST, before 0:45: state the rule with a number, then ONE short line
   warning that the power will collect its price ("But luck always collects." /
   "Remember that. It matters later.").
4. EASY MODE, ~1:00–3:00: 3 escalating wins, each in front of a DIFFERENT named person
   (friend, coach, teacher, rival) — aim for 8+ named people across the video.
   Each win gets one true science fact with a
   number, tied to the moment. After each win, a named side character reacts in ≤ 8 words
   ("Dude, you were behind me." / "Mate, that's creepy.").
5. LOVED ONE + PLANT, any time before 4:00: introduce {LOVED_ONE} through a small warm
   scene, and plant {PLANT}. Do not explain why it matters.
6. THE CATCH, ~2:30–4:30: "The catch?" / "And there's a cost." Reveal {COST}, measured in a
   number that grows ("four extra days nobody else lived"). First use of {THEME}.
7. TEMPTATION, ~4:00–5:30: {TEMPTER} appears; the stakes go public.
8. CRISIS + COUNT, ~5:30–7:30: danger hits {LOVED_ONE} while the power is nearly spent.
   Use a count ("One. Two. Five. Eight.") and end on a binary dilemma in ≤ 5 words
   ("Breathe or reach them.").
9. PAYOFF, ~7:30–8:30: {PLANT} returns at the exact moment it solves the dilemma.
10. REFUSAL + THEME, ~8:30–9:15: the protagonist refuses the tempter. Second use of {THEME}.
11. REALITY CHECK, ~9:15–9:45: "Is any of this real?" One sentence: "X, no." Then the real
    science behind it, with a number.
12. END, ~9:45–10:00: a 2-sentence last mystery that opens a sequel (a stranger, a message, an
    offer, someone else has the power). Then ONE question to the viewer, a short call to comment,
    and one line asking to subscribe that names a decision from THIS story. Write that line fresh
    for each video in the channel's own words.

VOICE RULES (genre baseline — keep, but they are not what makes a video stand out)
- Present tense. Style A: narrate "you" with the protagonist's name given once early.
  Style B: "you" throughout.
- About half of all sentences ≤ 6 words. Average ≈ 6–7 words per sentence.
- About 3 concrete numbers per minute (times, distances, money, odds). No vague adjectives.
- Side characters speak in very short lines. No monologues.
- 13+ friendly: tension without gore.
- Do not reuse titles, character names or plot beats from existing channels.

OUTPUT FORMAT
A) 3 alternative titles (≤ 60 characters, start with "What If You").
B) Thumbnail concept: one character + one object showing the power AND the cost; ≤ 4 words of
   on-image text.
C) Script table: [timestamp | beat # | narration (VO) | side-character line | 2D visual |
   SFX/music]. One row = 1–3 sentences.
D) Word count and estimated runtime.
E) Self-check — answer yes/no and fix every "no" before returning:
   1. The first sentence starts with "You" and a physical action, not "What if". The title is
      never read aloud, and a flash-forward plus a back-to-now line come before 1:05.
   2. The rule has a number AND a foreshadowing line before 0:45.
   3. There are 3 easy-mode wins, each with one science fact containing a number,
      and at least 8 named characters appear across the script.
   4. The loved one appears before 4:00, together with a planted line or object.
   5. The cost grows as a number at least twice.
   6. The theme line appears exactly twice (catch + refusal).
   7. The planted line or object returns at the moment it solves the climax.
   8. The climax uses a count and a dilemma of ≤ 5 words.
   9. A reality-check sentence precedes the ending.
   10. The video ends with a last mystery, exactly one question to the viewer, and a subscribe
       line tied to a decision in this story.
```

---

## Biến thể nhanh

- **6–7 phút** (Twivio, 29×): gộp nhịp 2 vào 1 và nhịp 6 vào 7; giữ nguyên nhịp 8–9.
- **Phong cách B** (Jeremy, IFOLOGY, Price of If): bỏ tên nhân vật chính. Nhân vật phụ vẫn có
  tên. Tăng khoa học lên 4–5 dữ kiện, giữ đủ mô típ gieo rồi trả.
- **Tái sinh / làm lại** (OTHERWISE, 11×): nhịp 1 là vết thương cảm xúc (một cuộc gọi lỡ, một
  lời chưa nói), sau đó gói mục tiêu vào một câu: "This time I'm picking up." Phần gieo là một mục
  bí mật trong kế hoạch ("the third line"), lộ dần qua chuỗi gợi ý trước khi trả.
