// channel/cast.js — the channel's recurring cast. Lives outside projects so it survives project clean-up and is the same in every video.
// In a project: import { HERO } from '/channel/cast.js';   export const JAY = { ...HERO, speaker: 'JAY' };
// `speaker` is the name used in the script: speech bubbles and lip-sync find the character by it.

// The hero: quilted lime puffer and copper hair. This look is the channel's signature; the plain outfits around it stay calmer.
export const HERO = { top: 'puffer', color: '#b4f02e', color2: '#6fae1e', hair: 'spiky', hairColor: '#e0632a', legs: null, shoes: null };

// Starting points for supporting characters. Bare stick legs and round feet by default; add legs/shoes only when the story needs them.
export const FRIEND = { top: 'hoodie', color: '#e0402e', head: 'capBack', headColor: '#f2c21a' };
export const GIRL = { top: 'hoodie', color: '#ee7aa8', hair: 'bob', hairColor: '#7a4a2e', lashes: true };
export const PARENT = { top: 'dress', color: '#3ab0c0', hair: 'bun', hairColor: '#5a3a2a', scale: 1.1 };
export const TEACHER = { top: 'jacket', color: '#2f9a6a', color2: '#247a54', hair: 'bob', hairColor: '#4a3020', scale: 1.1 };
export const STRANGER = { top: 'suit', color: '#4a4658', shirt: '#e8e4ee', tie: '#2a2838', face: 'sunglasses', scale: 1.1 };
