// engine/styles.js — colour moods + switchable visual styles for the 3D studio.
// A MOOD is the lighting situation of a location (day, golden, dusk, night, storm, interiorWarm, interiorCool, void).
// A STYLE re-grades every mood: palette overrides, light multipliers for the 3D stage, toon or soft shading,
// and a lift/gamma/gain colour grade + vignette + grain on the final frame (2D overlays included).
// Shots must take colours from mood()/S() so a style switch re-themes the whole video.

export const BASE_MOODS = {
  day:          { sky: ['#6f9ce0', '#a9c8f0', '#e6eef6'], ambient: '#9aa8c8', key: '#fff1d8', rim: '#fff4e0', wall: '#b9b2c4', floor: '#7d7488', dark: '#3a3448', practical: '#ffe6b0', grass: '#5d9a52', road: '#5a5866', fog: '#cfdcef', accent: '#2f6fe0' },
  golden:       { sky: ['#4e4a8a', '#c9786e', '#f6b26b', '#ffd9a0'], ambient: '#9a7a96', key: '#ffc27a', rim: '#ffc68a', wall: '#7a4e48', floor: '#4e3430', dark: '#2a1814', practical: '#ffe0a0', grass: '#5a7040', road: '#4a3c44', fog: '#d89a7a', accent: '#ff8a3c' },
  dusk:         { sky: ['#241c4a', '#5a3a78', '#b0607a', '#f09a70'], ambient: '#4a3864', key: '#ffb47a', rim: '#d6a0ff', wall: '#3e2f52', floor: '#2c2238', dark: '#160f22', practical: '#ffc477', grass: '#2f4a44', road: '#2c2640', fog: '#5a3e6e', accent: '#ff7a5a' },
  night:        { sky: ['#0a0820', '#1a1442', '#35286a'], ambient: '#3a3070', key: '#9fb0ff', rim: '#b3a0ff', wall: '#2a2348', floor: '#1c1830', dark: '#0b0918', practical: '#ffb35a', grass: '#1e3a36', road: '#201c34', fog: '#2a2250', accent: '#ffcf5a' },
  storm:        { sky: ['#0d1226', '#222a4a', '#3a4266'], ambient: '#2e3658', key: '#dfe6ff', rim: '#c8d6ff', wall: '#2a3050', floor: '#1a2036', dark: '#0a0d1a', practical: '#bcd0ff', grass: '#20403a', road: '#1e2234', fog: '#3a4466', accent: '#9ad0ff' },
  interiorWarm: { sky: ['#2a1c34', '#4a2f48'], ambient: '#5a4058', key: '#ffcf96', rim: '#ffc9a0', wall: '#5a4050', floor: '#3e2a30', dark: '#1e141a', practical: '#ffd28a', grass: '#3d5a48', road: '#3a3040', fog: '#3a2a38', accent: '#ff9a5a' },
  interiorCool: { sky: ['#141a36', '#28305a'], ambient: '#3a4270', key: '#cbd6ff', rim: '#a8c0ff', wall: '#2e3456', floor: '#20243e', dark: '#0e1024', practical: '#9fe0ff', grass: '#22433a', road: '#24263a', fog: '#262c50', accent: '#5fd0ff' },
  void:         { sky: ['#07070f', '#121428'], ambient: '#26284a', key: '#ffffff', rim: '#a0b8ff', wall: '#121428', floor: '#0c0d1c', dark: '#05050c', practical: '#ffd47e', grass: '#1d3a33', road: '#151a28', fog: '#0c0d1c', accent: '#ffd47e' },
};

const UI = { card: 'rgba(16,14,36,.92)', cardLine: 'rgba(170,150,255,.28)', text: '#c4b8ff', sub: '#8a80b8', accent: '#ff5a6a', gold: '#ffd23a', cream: '#fff4e2', blueprint: '#8fb8ff', bpBg: '#0b0f24', good: '#5fd39a' };

// light: multipliers for the 3D stage (ambient hemisphere, key sun, fill/back light, fresnel rim, practical lamps, exposure)
// skin: default character skin ('pale' ivory heads + dot eyes + outline, or 'ink' black stick figures + big white eyes)
// toon: shading ramp for every material (null = soft PBR); outline/outlineW: character outline colour and width (m)
export const STYLES = {
  pearl: {
    name: 'Pearl Dusk', desc: 'Channel default: lifted blacks, soft contrast, pearly heads that never clip, pastel dusk skies with coloured houses and trees, muted aubergine explainer stage, serif labels. Loud hero outfits stay loud.',
    ink: '#0b0a10', inkFar: '#2b2333', feature: '#f6f2ea', skin: 'pale', paleSkin: '#e6deee', skinGlow: 0.07, outline: '#2a2040', outlineW: 0.006,
    toon: null, ui: { ...UI, labelFont: 'serif', explainBg: '#34264f', explainBg3d: '#463a5c', card: 'rgba(28,20,48,.82)', gold: '#ffd98a', cream: '#fff1dc' },
    light: { ambient: 1.55, key: 0.8, fill: 1.15, rim: 1.0, practical: 0.8, exposure: 1.02 },
    setSat: 0.84,   // sets 16% calmer than the cast: the hero's lime stays the loudest thing
    grade: { contrast: 0.97, sat: 1.12, lift: [0.04, 0.02, 0.06], gamma: [1.02, 1.0, 1.04], gain: [1.0, 0.98, 1.0], vignette: 0.4, grain: 0.04, bloom: 0.42, bloomThreshold: 0.98 },
    moods: {
      day: { sky: ['#7f9fe0', '#b6c8f2', '#f2dcd8'], fog: '#d8d4ec', ambient: '#c8c8e0', key: '#fff0dc', rim: '#fff0e0', wall: '#a79bc4', floor: '#8d8498', dark: '#6a6280', grass: '#86b070', road: '#77708a', houses: ['#e0a98f', '#a99be0', '#e8c47e', '#8fc4b4', '#e096ac'], tree: '#6f9a62', skyline: false },
      golden: { rim: '#ffe0b8', dark: '#5a4048', grass: '#8aa060', houses: ['#e0a080', '#c890a0', '#e8c070', '#a0b090'], tree: '#7a8a50', skyline: false },
      dusk: { sky: ['#5a4a92', '#94689f', '#d898ac', '#f6c8ae'], fog: '#c898a8', ambient: '#a890b8', key: '#ffe2c4', rim: '#ffd8c0', wall: '#6a5070', floor: '#5a4c66', dark: '#54446a', grass: '#7aa868', road: '#6a5e78', houses: ['#e0a98f', '#a99be0', '#e8c47e', '#8fc4b4', '#e096ac'], tree: '#6a9860', skyline: false },
      night: { sky: ['#1a1440', '#3a2a66', '#6a4a86'], ambient: '#5a4a8a', wall: '#3a3058', floor: '#2c2444', dark: '#1a1430', rim: '#ffd8c0', houses: ['#5a4a78', '#4a4a7a', '#6a4a6a', '#4a5a72'], tree: '#2a4a48' },
      interiorWarm: { ambient: '#7a5c78', rim: '#ffe0c8', wall: '#6e5468', floor: '#5a4450', dark: '#2c2030' },
      interiorCool: { ambient: '#5a5888', rim: '#ffe0c8', wall: '#46486e', floor: '#383a58', dark: '#1e2038' },
    },
  },
  cinematic: {
    name: 'Night Toon Cinema', desc: 'Reference look ("crush" video): ivory round heads with lavender shading and a thin dark outline, chunky coloured hoodies, purple night sets lit by warm practicals, serif labels, soft depth of field.',
    ink: '#0b0a10', inkFar: '#2b2333', feature: '#f6f2ea', skin: 'pale', paleSkin: '#e2d9ea', outline: '#1b1430', outlineW: 0.011,
    toon: null, ui: { ...UI, labelFont: 'serif', explainBg: '#3a2a5e' },
    light: { ambient: 0.9, key: 1.1, fill: 0.9, rim: 1.0, practical: 1.0, exposure: 1.0 },
    grade: { contrast: 1.04, sat: 1.08, lift: [0.01, 0.0, 0.035], gamma: [1, 1, 1.02], gain: [1.02, 1.0, 1.02], vignette: 0.4, grain: 0.03, bloom: 0.55 },
    moods: { night: { rim: '#ffc89a' }, dusk: { rim: '#ffc89a' }, interiorCool: { rim: '#ffd0a8' } },
  },
  soft: {
    name: 'Soft Pastel Glow', desc: 'Reference look ("luck" video): no outlines, glossy pastel heads with lavender shadows and warm highlights, dreamy purple grade with glow and grain, rounded bold labels.',
    ink: '#0b0a10', inkFar: '#2b2333', feature: '#f6f2ea', skin: 'pale', paleSkin: '#dcd2ea', outline: false,
    toon: null, ui: { ...UI, labelFont: 'ui', explainBg: '#3b2c63', gold: '#ffcf4a' },
    light: { ambient: 1.0, key: 0.95, fill: 1.0, rim: 1.05, practical: 0.9, exposure: 0.98 },
    grade: { contrast: 0.97, sat: 1.05, lift: [0.035, 0.015, 0.06], gamma: [1.0, 0.98, 1.04], gain: [1.02, 0.99, 1.03], vignette: 0.55, grain: 0.045, bloom: 0.7, bloomThreshold: 0.97 },
    moods: { night: { rim: '#ffd6b0', ambient: '#4a3a7a' }, dusk: { rim: '#ffd0a8' }, interiorCool: { rim: '#ffe0c0' }, interiorWarm: { rim: '#ffe0c0' } },
  },
  ink: {
    name: 'Ink Stickman', desc: 'Black stick figures with big white eyes and a lavender rim light, glossy soft shading, purple night city (thumbnail look).',
    ink: '#0b0a10', inkFar: '#2b2333', feature: '#f6f2ea', skin: 'ink', outline: false, toon: null, ui: UI,
    light: { ambient: 1.0, key: 1.0, fill: 1.0, rim: 1.0, practical: 1.0, exposure: 1.05 },
    grade: { contrast: 1.04, sat: 1.08, lift: [0.01, 0.0, 0.035], gamma: [1, 1, 1.02], gain: [1.02, 1.0, 1.02], vignette: 0.45, grain: 0.04, bloom: 0.65 },
    moods: {},
  },
  toon: {
    name: 'Bright Toon', desc: 'Daylight cel-shaded cartoon: hard colour bands, punchy saturation, bright shadows, clean image. Family-friendly.',
    ink: '#121018', inkFar: '#3a3448', feature: '#ffffff', skin: 'pale', paleSkin: '#fff4ea', outline: '#20182a', outlineW: 0.012, toon: [110, 110, 200, 255], toonHard: true, ui: { ...UI, accent: '#ff5a5a', gold: '#ffd400' },
    light: { ambient: 1.3, key: 1.2, fill: 1.0, rim: 0.7, practical: 0.9, exposure: 1.12 },
    grade: { contrast: 1.03, sat: 1.22, lift: [0.03, 0.03, 0.04], gamma: [1.04, 1.04, 1.02], gain: [1.02, 1.02, 1.0], vignette: 0.2, grain: 0.012, bloom: 0.4 },
    moods: { night: { sky: ['#14164a', '#2a2a7a', '#4a46a0'], ambient: '#6a68b0', wall: '#3a3870' }, dusk: { ambient: '#7a62a0' } },
  },
  golden: {
    name: 'Golden Hour', desc: 'Warm orange-and-teal sunset light, big glows, nostalgic and uplifting.',
    ink: '#120c0a', inkFar: '#3a2a26', feature: '#fff6e6', skin: 'pale', paleSkin: '#fbefe4', outline: '#2a1610', outlineW: 0.011, toon: [80, 160, 220, 255], ui: { ...UI, card: 'rgba(30,22,30,.92)', accent: '#ff6a3a', gold: '#ffd27a' },
    light: { ambient: 1.05, key: 1.25, fill: 0.8, rim: 1.1, practical: 1.0, exposure: 1.05 },
    grade: { contrast: 1.05, sat: 1.15, lift: [0.035, 0.012, 0.0], gamma: [1.08, 1.03, 0.95], gain: [1.1, 1.02, 0.84], vignette: 0.42, grain: 0.035, bloom: 0.8 },
    moods: { night: { sky: ['#14183a', '#2e2c5a', '#6a4a6a'], rim: '#ffcf9a' }, dusk: { sky: ['#3a2e60', '#c0606a', '#f2a060', '#ffd8a0'], rim: '#ffc890' } },
  },
  neon: {
    name: 'Neon Noir', desc: 'Deep blacks, magenta + cyan rims, glowing signage, strong bloom. Sci-fi, tech, crime.',
    ink: '#07060c', inkFar: '#1e1830', feature: '#f6f0ff', skin: 'pale', paleSkin: '#e8e4f4', outline: '#0a0614', outlineW: 0.011, toon: [50, 130, 210, 255], ui: { ...UI, card: 'rgba(12,8,26,.94)', cardLine: 'rgba(255,90,200,.3)', text: '#e0a8ff', accent: '#ff3fa0', gold: '#4ff2e8', blueprint: '#7fe8ff' },
    light: { ambient: 0.8, key: 0.8, fill: 1.2, rim: 1.4, practical: 1.25, exposure: 1.0 },
    grade: { contrast: 1.14, sat: 1.35, lift: [0.01, 0.0, 0.04], gamma: [1.0, 0.92, 1.06], gain: [1.1, 0.88, 1.16], vignette: 0.6, grain: 0.05, bloom: 1.0 },
    moods: { night: { sky: ['#05041a', '#160c3a', '#3a1260'], rim: '#4ff2e8', practical: '#ff3fa0', key: '#c070ff' }, dusk: { rim: '#ff6ac8', practical: '#4ff2e8' }, interiorWarm: { rim: '#ff7ab8', practical: '#4ff2e8', wall: '#2a1e3a' }, day: { rim: '#7ff0ff' } },
  },
  noir: {
    name: 'Cold Thriller', desc: 'Cold steel-blue, desaturated, hard contrast, sodium-orange practicals. Tension, horror, rain.',
    ink: '#08090e', inkFar: '#20242e', feature: '#eef3ff', skin: 'pale', paleSkin: '#e4e8f0', outline: '#0a0c14', outlineW: 0.011, toon: [50, 120, 200, 255], ui: { ...UI, accent: '#ff7a4a', gold: '#ffc66e' },
    light: { ambient: 0.8, key: 1.1, fill: 0.7, rim: 1.15, practical: 1.1, exposure: 0.98 },
    grade: { contrast: 1.12, sat: 0.72, lift: [0.0, 0.02, 0.06], gamma: [0.95, 1.0, 1.06], gain: [0.9, 0.97, 1.1], vignette: 0.62, grain: 0.05, bloom: 0.7 },
    moods: { night: { sky: ['#05080f', '#101a2a', '#1e2c44'], ambient: '#2a3650', rim: '#a8c4ff' }, dusk: { sky: ['#101828', '#2a3650', '#5a6a80'] } },
  },
};
// alias so 2D-studio habits still work
STYLES.dusk = STYLES.cinematic;
export const STYLE_IDS = ['pearl', 'cinematic', 'soft', 'ink', 'toon', 'golden', 'neon', 'noir'];

// A PALETTE gives one video its own colour world on top of the style (config.json "palette"). The purple explainer stage
// stays the same in every palette: it is what the whole series has in common.
export const PALETTES = {
  dusk: { name: 'Pastel dusk', desc: 'Suburbs, parks, outdoor stories: pink-violet sky, coloured houses.', moods: {} },
  cozy: { name: 'Cozy indoors', desc: 'Parties, homes, sleepovers: rosy warm rooms, string-light glow.',
    grade: { gain: [1.03, 0.99, 0.96] },
    moods: { interiorWarm: { sky: ['#4a3040', '#7a5060'], ambient: '#a07880', key: '#ffd8b0', rim: '#ffe4cc', wall: '#8a6470', floor: '#a88068', dark: '#4a3038', practical: '#ffd28a', fog: '#6a4a50' },
      night: { sky: ['#241c48', '#4a3468', '#7a5078'], ambient: '#6a5488', wall: '#4a3a60', rim: '#ffd8c0', dark: '#241c38' } } },
  tropic: { name: 'Tropic', desc: 'Beaches, oceans, survival: sandy floors, teal water, bright pastel sky.',
    grade: { sat: 1.26, gain: [1.0, 1.0, 0.98] },
    moods: { day: { sky: ['#8a7ac8', '#c0a0d0', '#f0c8c0'], fog: '#c8d8d0', ambient: '#c8c8d8', key: '#fff0d0', rim: '#fff0e0', wall: '#c8a880', floor: '#e8c89a', dark: '#6a7a78', grass: '#62a868', road: '#70c4b0', tree: '#4a9a58' },
      dusk: { sky: ['#5a4a98', '#9a70b0', '#e0a0b0', '#f8d0a8'], fog: '#c8a8b0', floor: '#d8b48a', grass: '#62a868', road: '#60b0a4', tree: '#4a8a58' } } },
  alert: { name: 'Red alert', desc: 'Crashes, emergencies, danger: red-lit interiors, deep shadows, cold exteriors.',
    grade: { contrast: 1.03, gain: [1.03, 0.97, 0.97] },
    moods: { interiorWarm: { sky: ['#4a1828', '#8a3040'], ambient: '#a84858', key: '#ff9a88', rim: '#ffb0a0', wall: '#7a2c3c', floor: '#3a1a2a', dark: '#2a0e1c', practical: '#ff6a58', fog: '#5a2030' },
      storm: { sky: ['#2a2a58', '#4a4a80', '#7a78a8'], ambient: '#6a6a98', key: '#e8e8ff', rim: '#d0d8ff', wall: '#3a3a60', floor: '#2a2a48', dark: '#1a1a30' } } },
  school: { name: 'School day', desc: 'Hallways, classrooms, cafeterias: teal lockers, warm tiles, sunset through big windows.',
    moods: { interiorCool: { sky: ['#4a3a70', '#a06a88', '#e8a080'], ambient: '#8a80a8', key: '#ffe0c8', rim: '#ffe0c8', wall: '#5a5470', floor: '#b09a90', dark: '#3a3448', practical: '#fff0d0', fog: '#5a5070' },
      interiorWarm: { ambient: '#90707a', wall: '#7a5c62', floor: '#b09a7c', dark: '#3e2e38', rim: '#ffe4c8' } } },
  midnight: { name: 'Midnight', desc: 'Night streets, secrets, thrillers: the classic purple night with warm practicals.',
    grade: { contrast: 1.0, gain: [1.0, 0.98, 1.02] },
    moods: { night: { sky: ['#120e34', '#2a2058', '#54407c'], ambient: '#4a3e80', wall: '#322a54', floor: '#262040', dark: '#141028', practical: '#ffc070', rim: '#ffd0a8' } } },
};
