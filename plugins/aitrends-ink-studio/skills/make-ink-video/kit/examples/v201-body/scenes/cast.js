import { HERO as H, BRO as B, BESTIE as F } from '/channel/cast.js';
export const HERO = { ...H, speaker: 'YOU' };
export const OLD = { ...H, build: 1 };      // the 2.0.0 body, for comparison
export const MIA = { ...B, speaker: 'MIA' };
export const ZOE = { ...F, speaker: 'ZOE' };
