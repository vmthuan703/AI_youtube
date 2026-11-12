// examples/catalog (1.0.5): one shot per set in engine/catalog.json, built from its "demo" recipe, with the hero standing in it for
// scale and the set's Vietnamese name in a pill. `node render.mjs --catalog` rewrites story/shots.json from the catalogue and renders
// the contact sheets (build/sheets), so the user can see what the kit already has before a script's sets are planned.
import { registerShot } from '/engine/core.js';
import { HERO } from '/channel/cast.js';

const CAT = await (await fetch('/engine/catalog.json')).json();
// camera presets: [position, look-at, fov, where the hero stands (null = no hero)]
const CAMS = {
  room:   [[0, 1.75, 5.4], [0, 1.1, -1], 54, [0.9, 1.2]],
  hall:   [[0, 1.7, 6.5], [0, 1.3, -4], 50, [0.5, 2.5]],
  street: [[0, 2.3, 13], [0, 1.6, -2], 48, [1.2, 4.5]],
  beach:  [[0, 1.8, 9], [0, 1.4, -4], 48, [0.8, 3.5]],
  big:    [[0, 4.2, 17], [0, 1.5, -2], 50, [1.5, 6]],
  huge:   [[0, 14, 48], [0, 2, 0], 50, null],
  stage:  [[0, 1.5, 10], [0, 1.2, 0], 30, [1.6, 0]],
  phone:  [[0, 1.25, 1.75], [0, 1.2, 1.2], 26, null],
};
const pill = (g, text, sub) => {
  g.font = '800 46px Nunito'; const w = Math.max(g.measureText(text).width, (g.font = '600 26px Nunito', g.measureText(sub).width)) + 56;
  g.fillStyle = 'rgba(16,12,28,.78)'; g.beginPath(); g.roundRect(40, 40, w, 104, 22); g.fill();
  g.fillStyle = '#ffffff'; g.font = '800 46px Nunito'; g.fillText(text, 68, 92); g.fillStyle = '#b4f02e'; g.font = '600 26px Nunito'; g.fillText(sub, 68, 128);
};

for (const e of CAT.sets) {
  const d = e.demo || {}, cam = CAMS[d.cam] || (Array.isArray(d.cam) ? d.cam : CAMS.room);
  registerShot(e.id, {
    init(T) {
      const so = d.stage?.time ? { ...T.W.schoolTime(d.stage.time) } : { mood: d.stage?.mood || 'day' };
      const st = T.stage({ ...so, fov: cam[2], fog: so.fog || [30, 220] });
      const fn = (e.call || '').replace(/^T\.W\./, ''); const set = T.W[fn](st, { ...(e.opts || {}), ...(d.opts || {}) });
      if (d.extra === 'planet') T.W.planet(st, { r: 2.2, pos: [0, 1.2, -2] });
      let hero = null; if (cam[3]) hero = st.add(T.character(HERO).place(cam[3][0], set?.heightAt ? set.heightAt(cam[3][0], cam[3][1]) : 0, cam[3][1], -0.3));
      return { st, set, hero };
    },
    draw(s, t, info, T) {
      const c = s.st.camera; c.position.set(...cam[0]); c.lookAt(...cam[1]); if (c.fov !== cam[2]) { c.fov = cam[2]; c.updateProjectionMatrix(); }
      s.hero?.pose(T.idle3('relaxed', t)).face({ expr: 'smile', t, blink: true });
    },
    overlay(g) { pill(g, e.vi || e.id, (e.call || '') + (e.since ? `  ·  mới ${e.since}` : '')); },
  });
}
