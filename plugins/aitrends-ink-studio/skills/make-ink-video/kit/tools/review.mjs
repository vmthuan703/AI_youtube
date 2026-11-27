// tools/review.mjs — the director's notes page. Watch a cut, pause anywhere, write what must change; each note is stamped with
// the time and the shot under it and saved to projects/<slug>/story/notes.json. No dependencies.
//   node tools/review.mjs --project projects/<slug> [--port 5178] [--video out/x.mp4]
// Notes: { id, t, shot, scope: 'shot' | 'rule', kind, text, status: 'open' | 'done', created, done_note }
// scope 'rule' = "luật chung": it is turned into a rulebook entry (rules/RULES.md + rules.json) only with the user's yes.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const PROJ = path.resolve(ROOT, arg('--project', ''));
if (!fs.existsSync(path.join(PROJ, 'story', 'shots.json'))) { console.error('no story/shots.json in', PROJ); process.exit(1); }
const PORT = +arg('--port', 5178);
const NOTES = path.join(PROJ, 'story', 'notes.json');
const pickVideo = () => {
  const v = arg('--video'); if (v) return path.resolve(PROJ, v);
  const outs = fs.existsSync(path.join(PROJ, 'out')) ? fs.readdirSync(path.join(PROJ, 'out')).filter(f => f.endsWith('.mp4')).map(f => path.join(PROJ, 'out', f)) : [];
  const cands = [...outs, path.join(PROJ, 'build', 'preview.mp4'), path.join(PROJ, 'build', 'video_silent.mp4')].filter(f => fs.existsSync(f));
  return cands.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0];
};
const readNotes = () => fs.existsSync(NOTES) ? JSON.parse(fs.readFileSync(NOTES, 'utf8')) : { notes: [] };
const send = (res, code, body, type = 'application/json') => { res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store' }); res.end(body); };

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/') return send(res, 200, fs.readFileSync(path.join(ROOT, 'tools', 'review.html')), 'text/html; charset=utf-8');
  if (url.pathname === '/api/project') {
    const shots = JSON.parse(fs.readFileSync(path.join(PROJ, 'story', 'shots.json'), 'utf8'));
    const cfg = fs.existsSync(path.join(PROJ, 'config.json')) ? JSON.parse(fs.readFileSync(path.join(PROJ, 'config.json'), 'utf8')) : {};
    const v = pickVideo();
    return send(res, 200, JSON.stringify({ title: cfg.title || path.basename(PROJ), slug: path.basename(PROJ), video: v ? path.relative(PROJ, v) : null,
      shots: shots.shots.map(s => ({ id: s.id, start: s.start, end: s.end, scene: s.scene || '', rules: s.rules || [] })), ...readNotes() }));
  }
  if (url.pathname === '/api/notes' && req.method === 'POST') {
    let body = ''; req.on('data', c => body += c); req.on('end', () => {
      try { const notes = JSON.parse(body).notes; fs.writeFileSync(NOTES, JSON.stringify({ notes }, null, 1)); send(res, 200, '{"ok":true}'); }
      catch (e) { send(res, 400, JSON.stringify({ error: String(e) })); } });
    return;
  }
  if (url.pathname === '/video') {
    const v = pickVideo(); if (!v) return send(res, 404, 'no video');
    const size = fs.statSync(v).size, range = req.headers.range;
    if (range) { const [a, b] = range.replace('bytes=', '').split('-'); const start = +a, end = b ? +b : Math.min(start + 4e6, size - 1);
      res.writeHead(206, { 'Content-Range': `bytes ${start}-${end}/${size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1, 'Content-Type': 'video/mp4' });
      return fs.createReadStream(v, { start, end }).pipe(res); }
    res.writeHead(200, { 'Content-Length': size, 'Content-Type': 'video/mp4', 'Accept-Ranges': 'bytes' }); return fs.createReadStream(v).pipe(res);
  }
  send(res, 404, 'not found', 'text/plain');
}).listen(PORT, '127.0.0.1', () => console.log(`Review: http://localhost:${PORT}  (${path.basename(PROJ)}; notes -> story/notes.json)`));
