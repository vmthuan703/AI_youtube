// sets/street.js — the morning street on the way to school (also used at night for the cold open).
// Road along x (lanes z = ±2), near sidewalk z 4..7 (hero side), far sidewalk z -4..-7 (shops, Jake, vending machine).
export function vendingMachine(T, o = {}) {
  const body = T.mat(o.color || '#c8302a', { rough: 0.5, metal: 0.2 });
  const front = T.screen(0.62, 1.15, (g, W, H) => {
    g.fillStyle = '#1a2a3a'; g.fillRect(0, 0, W, H);
    const cols = ['#e0402e', '#3a78e0', '#f2c21a', '#2f9a6a'];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { g.fillStyle = cols[(r + c) % 4]; const x = 30 + c * (W - 60) / 4, y = 40 + r * (H - 120) / 4; g.fillRect(x, y, (W - 60) / 4 - 22, (H - 120) / 4 - 26); g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(x + 6, y + 8, 6, (H - 120) / 4 - 42); }
    g.fillStyle = '#0a0a10'; g.fillRect(30, H - 70, W - 60, 40);
  }, { power: 1.25 });
  front.position.set(-0.08, 1.15, 0.401);
  const g = T.group(T.rbox(0.95, 1.9, 0.8, 0.05, body, 0, 0.95, 0), front, T.box(0.18, 0.5, 0.02, '#202028', 0.33, 1.2, 0.405), T.box(0.6, 0.12, 0.05, '#0a0a10', -0.08, 0.35, 0.42));
  const L = T.lamp('#bfe0ff', 1.2, 2.5, { bulb: false }); L.position.set(0, 1.2, 0.9); g.add(L);
  return g;
}
export function street(T, st, o = {}) {
  const city = T.W.city(st, { seed: 4, cars: 4, props: 6, lights: o.lights ?? 3, focus: o.focus || [0, 0], signs: ['CAFE', 'PIZZA', 'BOOKS', '24/7'], moon: o.night, stars: o.night });
  const light = T.at(T.W.trafficLight({ state: 'red' }), -12, 0.15, 4.5, Math.PI); st.add(light);
  st.add(T.at(T.W.trafficLight({ state: 'red' }), -12, 0.15, -4.5, 0));
  const vend = T.at(vendingMachine(T), 0.4, 0.15, -6.6, 0); st.add(vend);
  st.add(T.at(T.W.trashCan({}), 6, 0.15, 5.6), T.at(T.W.trashCan({ color: '#3a3a2a' }), 6.7, 0.15, 5.7));   // s012 crash target (s001 frames the hero at x 4, clear of them)
  return { ...city, light, vend };
}
