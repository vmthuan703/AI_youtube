// Example spec: "What If You Could Borrow Your Friends' Strength?"
// Rule of the video: hold a friend's hand, they say "Take it", you get all their strength for one hour and they go weak.
// Each option is a different IDEA from the script, arranged the way that idea reads fastest. Copy this file and rewrite `options`.

// script prop, drawn in the kit's look: flat fill, dark outline, round joins
const tire = K => `<circle r="150" fill="#2a2634" stroke="${K.C.OUT}" stroke-width="10"/><circle r="78" fill="#55506a" stroke="${K.C.OUT}" stroke-width="9"/><circle r="44" fill="#8a84a0" stroke="${K.C.OUT}" stroke-width="7"/>${Array.from({ length: 14 }, (_, i) => `<path transform="rotate(${i * 360 / 14})" d="M0,-146 L0,-112" stroke="#14101c" stroke-width="16" stroke-linecap="round"/>`).join('')}`;

export default {
  title: "What If You Could Borrow Your Friends' Strength?",
  options: [
    {
      name: 'A', bigText: '',
      idea: 'The cold open: hero lifts the 200 kg tire one-handed while the linebacker has 0 strength',
      bg: { c1: '#ffe14a', c2: '#ff8a1a', rays: '#fff3b0', raysAt: [470, 300] },
      draw: K => `
        ${K.mate({ x: 1090, y: 500, s: 1.15, role: 'BRO_2', face: 'shock', look: -1 })}
        ${K.prop(tire(K), 790, 185, 0.95, 12)}
        ${K.hero({ x: 400, y: 440, s: 1.7, expr: 'smug', arms: 'raiseR' })}
        ${K.tag(1090, 345, 'STR 0', { fg: K.C.RED, size: 56 })}
        ${K.bar(50, 36, 500, 1, { name: 'STR', col: K.C.GRN, label: '200%' })}
        ${K.sparkle(1010, 110, 26)}${K.sparkle(150, 300, 20)}`,
    },
    {
      name: 'B', bigText: 'take it.',
      idea: 'The rule as numbers: every friend at 0, the hero at ×11',
      bg: 'sky',
      draw: K => `
        ${K.crowd({ x0: 100, x1: 400, y: 500, n: 3, s: 0.8, face: 'meh', lookAt: 640, roles: ['BRO_2', 'CLASSMATE', 'RIVAL_2'] })}
        ${K.crowd({ x0: 880, x1: 1180, y: 500, n: 3, s: 0.8, face: 'meh', lookAt: 640, roles: ['CLASSMATE_2', 'BESTIE', 'CLASSMATE_3'] })}
        ${K.hero({ x: 640, y: 400, s: 1.5, expr: 'grin', arms: 'crossed' })}
        ${[100, 250, 400, 880, 1030, 1180].map((x, i) => K.tag(x, 366 + (i % 2 ? 46 : 0), '0', { fg: K.C.RED, size: 50 })).join('')}
        ${K.pill(640, 66, 'STR ×11', { size: 68, bg: K.C.GRN, fg: '#fff', ptr: false })}
        ${K.text('take it.', 60, 690, 100, '#fff')}`,
    },
    {
      name: 'C', bigText: '',
      idea: 'The offer as a game prompt: the best friend says "take it", the linebacker goes weak',
      bg: { c1: '#ffb0d4', c2: '#e8327e', rays: '#ffe0ee' },
      draw: K => `
        ${K.panel(660, 40, 580, 300, { title: 'BORROW STRENGTH?', head: K.C.GRN, titleSize: 50 })}
        ${K.tag(820, 240, 'TAKE IT', { bg: K.C.GRN, size: 60, ptr: false })}${K.tag(1100, 240, 'NO', { bg: K.C.SLOT, size: 60, ptr: false })}
        ${K.mate({ x: 1180, y: 560, s: 0.95, role: 'BRO_2', face: 'shock', look: -1 })}
        ${K.mate({ x: 990, y: 580, s: 0.95, role: 'BESTIE', face: 'smile', look: -1 })}
        ${K.tag(1180, 425, 'STR 0', { fg: K.C.RED, size: 40 })}
        ${K.hero({ x: 330, y: 450, s: 1.75, expr: 'wink', arms: { R: ['100,170', '250,190', '280,-20'] } })}`,
    },
  ],
};
