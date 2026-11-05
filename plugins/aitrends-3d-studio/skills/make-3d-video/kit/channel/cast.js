// channel/cast.js — the channel's recurring cast. Lives outside projects so it survives project clean-up and is the same in every video.
// In a project: import { HERO } from '/channel/cast.js';   export const JAY = { ...HERO, speaker: 'JAY' };
// `speaker` is the name used in the script: speech bubbles and lip-sync find the character by it.

// The hero: quilted lime puffer and platinum anime hair. This look is the channel's signature. Nobody else gets near-white hair, and the plain outfits around it stay calmer.
export const HERO = { top: 'puffer', color: '#b4f02e', color2: '#6fae1e', hair: 'anime', hairColor: '#e8ecf6', hairShade: '#6f7fb8', legs: null, shoes: null };

// Supporting cast: each has their own hair and one outfit detail, in deep muted colours, so they are easy to tell apart and never outshine the hero.
// Bare stick legs and round feet by default; add legs/shoes only when the story needs them.
export const FRIEND = { top: 'hoodie', color: '#7a3a34', color2: '#622e28', bag: '#a8843c', strings: '#e8dcc8', hair: 'curls', hairColor: '#4a2f24' };
export const RIVAL = { top: 'jacket', color: '#2c3e6e', sleeves: '#b0a68c', shirt: '#243158', hair: 'quiff', hairColor: '#2b2d3c' };
export const GIRL = { top: 'tshirt', color: '#8d4a6b', collar: '#e0d4c8', skirt: '#3e3048', hair: 'fringe', hairColor: '#34262c', bow: '#b89c5c', lashes: true };
export const GIRL2 = { top: 'tshirt', color: '#2f6f6a', stripe: '#d8ccb4', skirt: '#533a78', hair: 'sidePony', hairColor: '#8a4426', lashes: true };
export const PARENT = { top: 'dress', color: '#3f6a58', scarf: '#9c7a3a', hair: 'bun', hairColor: '#4a3226', scale: 1.08 };
export const TEACHER = { top: 'suit', color: '#5f6a2e', shirt: '#d8d0bc', tie: '#6e2c30', hair: 'sidePart', hairColor: '#5c5660', face: 'glasses', scale: 1.08 };
export const STRANGER = { top: 'suit', color: '#33313f', shirt: '#c8c4cc', tie: '#5e2230', hair: 'slick', hairColor: '#26232c', face: 'sunglasses', scale: 1.08 };
