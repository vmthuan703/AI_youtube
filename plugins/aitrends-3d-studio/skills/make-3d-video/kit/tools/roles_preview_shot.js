// 2.2: `node render.mjs --project P --roles` copies this file and the project's scenes/roles_new.js into build/roles_preview and
// renders one still per new role: front, three-quarter and side view, with the channel hero on the right for scale.
import { registerShot } from '/engine/core.js';
import { HERO } from '/channel/cast.js';
import * as R from './_roles_new.js';

const pill = (g, text, sub) => {
  g.font = '800 46px Nunito'; const w = Math.max(g.measureText(text).width, (g.font = '600 26px Nunito', g.measureText(sub).width)) + 56;
  g.fillStyle = 'rgba(16,12,28,.78)'; g.beginPath(); g.roundRect(40, 40, w, 104, 22); g.fill();
  g.fillStyle = '#ffffff'; g.font = '800 46px Nunito'; g.fillText(text, 68, 92); g.fillStyle = '#b4f02e'; g.font = '600 26px Nunito'; g.fillText(sub, 68, 128);
};

for (const [id, outfit] of Object.entries(R)) {
  if (!outfit || typeof outfit !== 'object' || Array.isArray(outfit)) continue;
  registerShot(id, {
    init(T) {
      const st = T.stage({ mood: 'day', fov: 30 });
      const views = [-1.7, 0, 1.7].map((x, i) => st.add(T.character(outfit).place(x, 0, 0, [0, -0.8, -1.57][i])));
      const hero = st.add(T.character(HERO).place(3.5, 0, 0.2, -0.3));
      return { st, views, hero };
    },
    draw(s, t, info, T) {
      const c = s.st.camera; c.position.set(0.9, 1.3, 8); c.lookAt(0.9, 0.95, 0);
      for (const k of s.views) k.pose(T.idle3('relaxed', t)).face({ expr: 'smile', t, blink: true });
      s.hero.pose(T.idle3('relaxed', t)).face({ expr: 'smile', t, blink: true });
    },
    overlay(g) { pill(g, id, 'vai mới của video · trước · ¾ · nghiêng · cạnh HERO'); },
  });
}
