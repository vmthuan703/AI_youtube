// tools/retro.mjs — 1.0.3 lessons after every video. Gathers what went wrong in a project (motion QC issues, shot errors, missing
// shots, the user's review feedback) into the channel's lesson book (channel/lessons.json, outside projects so it survives
// clean-up) and rewrites channel/LESSONS.md: recurring problems ranked across videos and a checklist for the next video.
// The full render (node render.mjs --project P) runs this by itself at the end; it can also be run by hand:
//   node tools/retro.mjs --project projects/<slug>                      record / refresh this video's entry
//   node tools/retro.mjs --project projects/<slug> --note "tay bị gập"  add one piece of the user's feedback (kept in P/feedback.md)
//   node tools/retro.mjs --next                                         print the checklist for the next video
//   node tools/retro.mjs --name <slug> --date 2026-11-08 --note "..."     a lesson for a video whose project folder is gone
//   --channel DIR                                                       another studio's channel folder (default: this kit's)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let CH = path.join(KIT, 'channel'), BOOK = path.join(CH, 'lessons.json'), MD = path.join(CH, 'LESSONS.md');
export function setChannel(dir) { CH = path.resolve(dir); BOOK = path.join(CH, 'lessons.json'); MD = path.join(CH, 'LESSONS.md'); }
const today = () => new Date().toISOString().slice(0, 10);

// what each kind of problem means and how to avoid it next time (the user reads LESSONS.md in Vietnamese)
export const CATS = {
  clip:   { vi: 'Xuyên vật / xuyên người', tip: 'Đặt ghế, bục, bàn bằng anchor của bối cảnh (seat(), podium) và dùng T.act.sitOn; giữ khoảng cách 0,5 m giữa hai người trừ khi ôm / đập tay; chạy --qc trước khi render.', kw: /xuyên|lún|chui|clip|inside|through/i },
  jerk:   { vi: 'Chuyển động giật, khựng', tip: 'Dùng T.flow3 cho mọi động tác vung, ném, với tay; không nối posesAt3 với khoảng < 0,3 s; xem GIF (--gif) từng cảnh có người cử động.', kw: /giật|khựng|cứng|đơ|jerk|snap|stiff|không tự nhiên/i },
  slide:  { vi: 'Chân trượt', tip: 'Đi bằng T.walkTo với t0 / t1 đủ dài (≥ 0,8 s cho 1 m); không dời ch.position bằng tay khi chân đang đứng.', kw: /trượt|slide|skat/i },
  camera: { vi: 'Máy quay (trong tường, nhảy, che mặt)', tip: 'Để máy quay thông minh tự né (đừng tắt avoid), tránh đặt máy quay tay sau tường hoặc bàn; một cảnh hai người dùng twoShot / ots.', kw: /camera|máy quay|góc quay|khung hình|framing/i },
  occluded: { vi: 'Mặt nhân vật bị che', tip: 'Đưa nhân vật chính lên trước, xoay nửa mặt về máy quay; vật ở tiền cảnh đặt thấp hơn cằm.', kw: /che mặt|bị che|không thấy mặt|occlu/i },
  hands:  { vi: 'Tay và ngón tay', tip: 'Dùng tư thế có sẵn (showCount, thumbsUp, peaceSign, raiseHand) và hand mode (count1–5, grip, pinch); oneStrap chỉ dùng khi có ba lô.', kw: /tay|ngón|bàn tay|hand|finger|arm/i },
  face:   { vi: 'Mặt, miệng, khẩu hình', tip: 'Gọi face({ gt: info.globalT }) cho người đang nói; biểu cảm đổi theo nhịp bằng expr: [[t, tên], …].', kw: /mặt|miệng|mắt|khẩu hình|biểu cảm|face|mouth|lip/i },
  cloth:  { vi: 'Trang phục', tip: 'Lấy trang phục từ channel/cast.js (HERO theo mùa); không tự chế màu cho nhân vật chính.', kw: /áo|quần|giày|khăn|váy|mũ|trang phục|outfit/i },
  set:    { vi: 'Bối cảnh, ánh sáng', tip: 'Chọn bối cảnh Mỹ có sẵn (school10, fall11) và schoolTime(); cảnh tối thì tăng lamp hoặc dùng mood sáng hơn.', kw: /bối cảnh|cảnh nền|ánh sáng|tối quá|sáng quá|set|light/i },
  story:  { vi: 'Kịch bản, nhịp kể', tip: 'Đọc prompts/QUY_TAC_VIET_SCRIPT_KENH.md và SCRIPT_CHECKLIST.md trước khi viết; mỗi cảnh một ý.', kw: /kịch bản|script|thoại|nhịp|cốt truyện|story/i },
  sound:  { vi: 'Âm thanh, nhạc, giọng', tip: 'Chạy /3d-video-sound sau khi duyệt hình; nghe lại chỗ nhạc đè giọng.', kw: /nhạc|âm thanh|giọng|tiếng|sound|music|voice/i },
  render: { vi: 'Lỗi render / thiếu cảnh', tip: 'Xem lỗi "shot error" trong log; dựng đủ mọi cảnh trong shots.json trước khi render bản cuối.', kw: /lỗi render|thiếu cảnh|crash|error|missing/i },
};
// problems the plugin itself has already addressed (version, date): later feedback of that kind reopens them
export const FIXED = { jerk: ['1.0.2 flow3 + QC giật', '2026-11-12'], clip: ['1.0.2 QC + 1.0.3 tay đặt lên mặt bàn', '2026-11-12'], hands: ['1.0.3 ngón tay, tư thế cử chỉ', '2026-11-12'],
  cloth: ['1.0.2 áo phao, quần, giày, bộ thu', '2026-11-12'], slide: ['1.0.3 chân bám đất', '2026-11-12'], camera: ['1.0.2 máy quay tự né', '2026-11-12'], face: ['1.0.3 khẩu hình mọi kiểu miệng', '2026-11-12'] };
const fixedNote = (r) => { const f = FIXED[r.k]; return f && r.last <= f[1] ? f : null; };
const catOf = (txt) => Object.entries(CATS).filter(([, c]) => c.kw.test(txt)).map(([k]) => k);

// ---------------------------------------------------------------- sets and graphics (proposals for the next video)
// sets a video used: every T.W.<name>( call in its scene code
function setsOf(P) { const out = new Set(), walk = (d) => { if (!fs.existsSync(d)) return; for (const f of fs.readdirSync(d)) { const q = path.join(d, f); if (fs.statSync(q).isDirectory()) walk(q); else if (/\.m?js$/.test(f)) for (const m of fs.readFileSync(q, 'utf8').matchAll(/\bT\.W\.([a-zA-Z]\w*)\s*\(/g)) out.add(m[1]); } }; walk(path.join(P, 'scenes')); return [...out]; }
// the sets this kit can build (functions taking the stage), read from the engine
export function catalogue() { const out = new Set(), dir = path.join(KIT, 'engine'); for (const f of fs.readdirSync(dir)) if (/\.js$/.test(f)) for (const m of fs.readFileSync(path.join(dir, f), 'utf8').matchAll(/^export function ([a-zA-Z]\w*)\(st\b/gm)) out.add(m[1]); return out; }
// American sets by season (month 1-12) with a Vietnamese label; ideas the engine does not have yet are proposed as new sets
const SEASON = {
  fall: { months: [9, 10, 11], vi: 'mùa thu', sets: { pumpkinStreet: 'phố bí ngô', thanksgivingDinner: 'bữa tối Lễ Tạ ơn', footballField: 'trận bóng tối thứ Sáu', suburbStop: 'trạm xe buýt khu dân cư', schoolFront: 'cổng trường', studentLot: 'bãi đỗ xe học sinh', library: 'thư viện', dinerUS: 'quán diner' },
    ideas: [['Siêu thị ngày Black Friday: xe đẩy, kệ giảm giá, đám đông chen lấn', [11]], ['Trận bóng bầu dục ngày Lễ Tạ ơn ở sân sau nhà, cả nhà cổ vũ', [11]], ['Sân nhà ngập lá: đống lá cào, nhảy vào đống lá, máy thổi lá', [10, 11]],
      ['Đêm Halloween đi xin kẹo: hiên nhà treo đèn bí ngô, trẻ em hoá trang', [10]], ['Hội chợ mùa thu: vòng quay, quầy bán táo, mê cung bắp', [9, 10]], ['Diễu hành Homecoming: xe hoa, ban nhạc trường', [9, 10]]] },
  winter: { months: [12, 1, 2], vi: 'mùa đông', sets: { studentLot: 'bãi xe phủ tuyết', schoolFront: 'cổng trường ngày tuyết', suburbStop: 'phố tuyết', lockerHall: 'hành lang tủ đồ', gym: 'nhà thi đấu' },
    ideas: ['Phòng khách đêm Giáng sinh: cây thông, lò sưởi, quà dưới cây', 'Sân trượt băng ngoài trời với đèn dây', 'Đồi trượt tuyết bằng ván, người tuyết', 'Trung tâm thương mại mùa lễ: ông già Noel, hàng người chụp ảnh'] },
  spring: { months: [3, 4, 5], vi: 'mùa xuân', sets: { schoolYard: 'sân trường', promHall: 'dạ hội prom', chemLab: 'phòng thí nghiệm', auditorium: 'hội trường', court: 'sân bóng rổ' },
    ideas: ['Hội chợ khoa học: bàn trưng bày, núi lửa mô hình, giám khảo', 'Lễ tốt nghiệp ngoài trời: ghế xếp, sân khấu, mũ tung', 'Cuộc thi chính tả trên sân khấu', 'Công viên picnic với hồ và vịt'] },
  summer: { months: [6, 7, 8], vi: 'mùa hè', sets: { dinerUS: 'quán diner', suburbStop: 'phố khu dân cư', court: 'sân bóng rổ' },
    ideas: ['Hồ bơi công cộng: cầu nhảy, ghế cứu hộ, phao', 'Trại hè: lửa trại, lều, hồ nước', 'Pháo hoa ngày 4/7 trên bãi cỏ', 'Công viên giải trí: tàu lượn, quầy kẹo bông'] },
};
const seasonOf = (d = new Date()) => Object.entries(SEASON).find(([, v]) => v.months.includes(d.getMonth() + 1))?.[0] || 'fall';
// graphics: visual scorecard (tools/qc_metrics.py → build/qc_scorecard.json) outside these ranges, and the upgrade backlog
const LOOK = { luma: [0.19, 0.40, 'Hình tối', 'Hình quá sáng', 'tăng ambient / dùng style pearl, tường sáng hơn'], sat: [0.35, 0.47, 'Màu nhạt', 'Màu quá rực', 'chỉ giữ áo nhân vật chính rực, nền trầm hơn'],
  murky: [0, 0.12, '', 'Nhiều khung tối khó nhìn', 'cảnh đêm bật faceLight, thêm đèn gần mặt'], gloss: [0.008, 0.06, 'Bề mặt phẳng, thiếu bóng', 'Quá bóng', 'thêm sàn gương / đường ướt, đèn viền'],
  empty: [0, 0.02, '', 'Khung trống', 'nhân vật to hơn, thêm đạo cụ tiền cảnh'], still: [0, 0.10, '', 'Nhiều đoạn đứng yên', 'máy quay trôi nhẹ, idle3 cho người'], median: [2.0, 2.7, 'Cảnh quá ngắn', 'Cảnh dài, nhịp chậm', 'cắt ngắn, thêm cảnh chèn 1 s'] };
export const GFX = [
  ['Ánh sáng thể tích: tia nắng qua cửa sổ, bụi bay trong nắng', 'shafts'], ['Sàn và đường ướt phản chiếu đèn sau mưa', 'wetStreet'], ['Bóng đổ mềm và ánh sáng dội (GI giả) trong phòng', 'softGI'],
  ['Hơi thở, khói, hơi nước có ánh sáng đi qua', 'breath'], ['Viền sáng nhân vật theo màu nguồn sáng trong cảnh', 'rimMatch'], ['Mây và bầu trời chuyển động theo giờ trong ngày', 'skyAnim'],
  ['Chiều sâu: lớp sương xa và DOF theo mặt nhân vật', 'depthHaze'], ['Cỏ, lá cây lay theo gió cùng khăn và tóc', 'foliageWind'],
];
function gfxDone() { const src = fs.readdirSync(path.join(KIT, 'engine')).filter(f => /\.js$/.test(f)).map(f => fs.readFileSync(path.join(KIT, 'engine', f), 'utf8')).join('\n');
  return new Set(GFX.filter(([, key]) => new RegExp(`\\bexport (function|const) ${key}\\b`).test(src)).map(([, key]) => key)); }
function metricsOf(P) { const m = load(path.join(P, 'build', 'qc_scorecard.json'), null); if (!m) return null; const o = {}; for (const k of Object.keys(LOOK)) if (typeof m[k] === 'number') o[k] = +m[k].toFixed(3); return o; }

function load(f, d) { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } }
function feedbackOf(P) { const f = path.join(P, 'feedback.md'); if (!fs.existsSync(f)) return [];
  return fs.readFileSync(f, 'utf8').split(/\r?\n/).filter(l => /^\s*-\s+/.test(l)).map(l => { const m = l.match(/^\s*-\s+(?:\[(\d{4}-\d\d-\d\d)\]\s*)?(.*)$/); return { date: m[1] || null, text: m[2].trim(), cats: catOf(m[2]) }; }); }

// one project's entry: QC issues by kind (with the worst shots), shot errors, missing shots, feedback
export function collect(P, extra = {}) {
  const qc = load(path.join(P, 'build', 'qc_motion.json'), null), slug = path.basename(P);
  const byKind = {}, shots = {};
  for (const i of qc?.issues || []) { const k = i.kind === 'clip' && /hand|elbow/.test(i.msg) ? 'hands' : i.kind; byKind[k] = byKind[k] || { red: 0, amber: 0, n: 0 }; byKind[k][i.sev === 'red' ? 'red' : 'amber']++; byKind[k].n += i.times?.length || 1;
    shots[i.shot] = (shots[i.shot] || 0) + (i.sev === 'red' ? 3 : 1); }
  const errs = (extra.errors || []).map(e => String(e)); if (errs.length) byKind.render = { red: errs.length, amber: 0, n: errs.length };
  if (extra.missing?.length) byKind.render = { ...(byKind.render || { red: 0, amber: 0, n: 0 }), red: (byKind.render?.red || 0) + extra.missing.length };
  return { project: slug, date: today(), qc: qc ? { samples: qc.samples, red: qc.red, amber: qc.amber } : null, byKind,
    sets: setsOf(P), look: metricsOf(P),
    worstShots: Object.entries(shots).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([s]) => s), errors: errs.slice(0, 20), missing: extra.missing || [], feedback: feedbackOf(P), renderSec: extra.renderSec ?? null };
}

export function record(P, extra = {}) {
  fs.mkdirSync(CH, { recursive: true }); const book = load(BOOK, { videos: [] }), e = collect(P, extra);
  const old = book.videos.find(v => v.project === e.project); if (old && old.renderSec && e.renderSec == null) e.renderSec = old.renderSec;
  if (old && old.date && !e.qc) e.date = old.date;
  if (old) { const have = new Set(e.feedback.map(f => f.text)); e.feedback = (old.feedback || []).filter(f => !have.has(f.text)).concat(e.feedback); if (!e.sets.length) e.sets = old.sets || []; if (!e.look) e.look = old.look || null; }   // keep notes recorded with --name
  book.videos = book.videos.filter(v => v.project !== e.project).concat(e); fs.writeFileSync(BOOK, JSON.stringify(book, null, 1)); writeMd(book); return e;
}

// rank: how many videos had the problem (recent videos count more), red issues and the user's own feedback weigh most
export function rank(book) {
  const vids = book.videos.slice().sort((a, b) => a.date.localeCompare(b.date)), N = vids.length, score = {};
  vids.forEach((v, i) => { const w = 0.5 + 0.5 * ((i + 1) / N), seen = new Set();
    for (const [k, c] of Object.entries(v.byKind || {})) { const s = score[k] || (score[k] = { k, vids: 0, red: 0, amber: 0, fb: 0, last: v.date, s: 0 }); s.red += c.red; s.amber += c.amber; s.s += w * (c.red * 3 + Math.min(c.amber, 6) * 0.5); seen.add(k); s.last = v.date; }
    for (const f of v.feedback || []) for (const k of f.cats.length ? f.cats : ['story']) { const s = score[k] || (score[k] = { k, vids: 0, red: 0, amber: 0, fb: 0, last: v.date, s: 0 }); s.fb++; s.s += w * 4; seen.add(k); s.last = v.date; }
    for (const k of seen) score[k].vids++; });
  return Object.values(score).sort((a, b) => b.s - a.s);
}

function writeMd(book) {
  const R = rank(book), N = book.videos.length, last = book.videos.slice().sort((a, b) => b.date.localeCompare(a.date));
  const L = [`# Sổ bài học của kênh`, ``, `Tự cập nhật sau mỗi lần render bản cuối (plugin 1.0.3, \`tools/retro.mjs\`). ${N} video, cập nhật ${today()}.`, ``,
    `## Việc cần chú ý cho video tiếp theo`, ``];
  R.slice(0, 5).forEach((r, i) => { const f = fixedNote(r); L.push(`${i + 1}. **${CATS[r.k]?.vi || r.k}** (gặp ở ${r.vids}/${N} video${r.fb ? `, ${r.fb} góp ý của bạn` : ''}${f ? `; plugin đã xử lý ở ${f[0]}, kiểm tra lại` : ''}): ${CATS[r.k]?.tip || ''}`); });
  if (!R.length) L.push('Chưa có lỗi nào được ghi.');
  L.push('', '## Lỗi lặp lại theo loại', '', '| Loại | Số video gặp | Đỏ | Vàng | Góp ý | Gần nhất | Plugin |', '|---|---|---|---|---|---|---|');
  for (const r of R) { const f = fixedNote(r); L.push(`| ${CATS[r.k]?.vi || r.k} | ${r.vids}/${N} | ${r.red} | ${r.amber} | ${r.fb} | ${r.last} | ${f ? 'đã xử lý ' + f[0].split(' ')[0] : '—'} |`); }
  const engine = R.filter(r => (r.vids >= 3 || r.fb >= 2) && !fixedNote(r));
  L.push('', '## Nên sửa trong plugin (lặp lại ở ≥ 3 video hoặc bạn đã nhắc ≥ 2 lần, chưa có bản sửa)', ''); if (engine.length) for (const r of engine) L.push(`- ${CATS[r.k]?.vi || r.k}`); else L.push('- Không có: mọi lỗi lặp lại đều đã có bản sửa trong plugin.');
  // proposals for the next video: sets for the season (built ones not used lately, new ones to add), graphics to improve
  const sea = SEASON[seasonOf()], cat = catalogue(), recent = new Set(last.slice(0, 3).flatMap(v => v.sets || [])), everUsed = new Set(last.flatMap(v => v.sets || []));
  const fresh = Object.entries(sea.sets).filter(([k]) => cat.has(k) && !recent.has(k)).sort((a, b) => (everUsed.has(a[0]) ? 1 : 0) - (everUsed.has(b[0]) ? 1 : 0)).slice(0, 4);
  L.push('', `## Đề xuất khung cảnh và đồ hoạ cho video tiếp theo (${sea.vi})`, '', '**Bối cảnh có sẵn hợp mùa, chưa dùng gần đây:**', '');
  if (fresh.length) for (const [k, vi] of fresh) L.push(`- ${vi} (\`T.W.${k}\`)${everUsed.has(k) ? '' : ' — kênh chưa dùng lần nào'}`); else L.push('- Đã dùng hết bối cảnh hợp mùa trong 3 video gần nhất.');
  const mo = new Date().getMonth() + 1, ideas = sea.ideas.map(x => Array.isArray(x) ? x : [x, sea.months]).sort((p, q) => (q[1].includes(mo) ? 1 : 0) - (p[1].includes(mo) ? 1 : 0));
  L.push('', '**Bối cảnh mới nên thêm vào plugin:**', ''); for (const [idea] of ideas.slice(0, 3)) L.push(`- ${idea}`);
  const lv = last.find(v => v.look), lookBad = lv ? Object.entries(LOOK).filter(([k, [lo, hi]]) => lv.look[k] != null && (lv.look[k] < lo || lv.look[k] > hi)) : [];
  L.push('', '**Đồ hoạ nên cải thiện:**', '');
  for (const [k, [lo, hi, low, high, fix]] of lookBad) L.push(`- ${lv.look[k] < lo ? low : high} ở ${lv.project} (${k} ${lv.look[k]}, nên ${lo}–${hi}): ${fix}.`);
  const done = gfxDone(); for (const [t] of GFX.filter(([, key]) => !done.has(key)).slice(0, Math.max(2, 4 - lookBad.length))) L.push(`- Nâng cấp engine: ${t}.`);
  const fb = last.flatMap(v => (v.feedback || []).map(f => ({ ...f, project: v.project, date: f.date || v.date }))).slice(0, 10);
  if (fb.length) { L.push('', '## Góp ý gần đây của bạn', ''); for (const f of fb) L.push(`- ${f.date} · ${f.project}: ${f.text}`); }
  L.push('', '## Từng video', '', '| Video | Ngày | QC đỏ / vàng | Cảnh nhiều lỗi nhất |', '|---|---|---|---|');
  for (const v of last) L.push(`| ${v.project} | ${v.date} | ${v.qc ? `${v.qc.red} / ${v.qc.amber}` : '—'} | ${(v.worstShots || []).join(', ') || '—'} |`);
  fs.writeFileSync(MD, L.join('\n') + '\n');
}

// ---------------------------------------------------------------- CLI
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const a = {}; for (let i = 2; i < process.argv.length; i++) { const k = process.argv[i]; if (k.startsWith('--')) { const v = process.argv[i + 1]; if (v && !v.startsWith('--')) { a[k.slice(2)] = v; i++; } else a[k.slice(2)] = true; } }
  if (a.channel) setChannel(a.channel);
  if (a.next) { if (fs.existsSync(BOOK)) writeMd(load(BOOK, { videos: [] })); if (!fs.existsSync(MD)) console.log('No lessons yet (channel/LESSONS.md is written after the first full render).'); else { const t = fs.readFileSync(MD, 'utf8'); console.log(t.split('\n## Lỗi lặp lại')[0]); } }
  else if (a.project) { const P = path.resolve(a.project);
    if (a.note) { const f = path.join(P, 'feedback.md'); if (!fs.existsSync(f)) fs.writeFileSync(f, `# Góp ý của bạn cho ${path.basename(P)}\n\n`); fs.appendFileSync(f, `- [${today()}] ${String(a.note).trim()}\n`); }
    const e = record(P); console.log(`Lessons: ${e.project} recorded (${Object.keys(e.byKind).length} problem kinds, ${e.feedback.length} feedback notes) → ${path.relative(KIT, MD)}`); }
  else if (a.name) { fs.mkdirSync(CH, { recursive: true }); const book = load(BOOK, { videos: [] }); let e = book.videos.find(v => v.project === a.name);
    if (!e) { e = { project: a.name, date: a.date || today(), qc: null, byKind: {}, worstShots: [], errors: [], missing: [], feedback: [] }; book.videos.push(e); }
    if (a.note) e.feedback.push({ date: a.date || today(), text: String(a.note).trim(), cats: catOf(String(a.note)) });
    fs.writeFileSync(BOOK, JSON.stringify(book, null, 1)); writeMd(book); console.log(`Lessons: ${a.name} (${e.feedback.length} notes) -> ${MD}`); }
  else console.log('usage: node tools/retro.mjs --project P [--note "..."] | --next');
}
