// sets/bedroom.js — the hero's bedroom on a sunny morning. Bed against the back wall (head at -z), nightstand left.
export function bedroom(T, st, o = {}) {
  const room = T.W.room(st, { kind: 'empty', w: 7, d: 6, mood: 'day', window: 'back', windowX: 1.2, windowLight: 26, wall: '#6a5a7a', floor: '#5a4048', curtain: '#3a78e0' });
  const bed = T.at(T.W.bed({ color: '#3a78e0' }), -1.5, 0, -1.6); st.add(bed);
  const stand = T.at(T.W.table({ w: 0.5, d: 0.45, h: 0.55, color: '#4a3438' }), -2.7, 0, -2.4); st.add(stand);
  st.add(T.at(T.W.deskLamp({ intensity: 1.5 }), -2.86, 0.575, -2.58));
  st.add(T.at(T.W.desk({}), 2.4, 0, -2.6), T.at(T.W.chair({}), 2.3, 0, -1.9, Math.PI), T.at(T.W.shelf({}), 3.25, 0, -0.6, -Math.PI / 2));
  st.add(T.at(T.W.poster({ text: 'SPEED', c1: '#f2c21a', c2: '#e0402e' }), -3.48, 1.7, -0.6, Math.PI / 2), T.at(T.W.rug({ color: '#8a5ad6' }), 0.5, 0, 0));
  st.add(T.at(T.W.plant({}), 3.0, 0, -2.7));
  return { ...room, bed, standTop: [-2.62, 0.585, -2.3] };
}
