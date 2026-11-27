// cast.js — roles for the ink demo, all from the channel roster (/channel/cast.js). The hero plays "you".
import { HERO as CH_HERO, MOM as CH_MOM, GRANDPA } from '/channel/cast.js';
export const HERO = { ...CH_HERO, speaker: 'HERO' };
export const MOM = { ...CH_MOM, speaker: 'MOM' };
export const NEIGHBOUR = { ...GRANDPA, head: 'beanie', headColor: '#c8323a' };
