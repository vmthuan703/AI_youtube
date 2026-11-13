// Every character is a roster role from /channel/cast.js with the script's name. Never write an outfit from scratch.
import { HERO as H, BRO_2, BESTIE, CLASSMATE, CLASSMATE_2, RIVAL_2 } from '/channel/cast.js';
export const HERO = { ...H, speaker: 'KAI' };
export const THEO = { ...BRO_2, speaker: 'THEO' };
export const NORA = { ...BESTIE, speaker: 'NORA' };
export const EXTRAS = [CLASSMATE, CLASSMATE_2, RIVAL_2];
