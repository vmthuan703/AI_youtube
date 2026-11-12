// channel/cast.js — the channel's recurring cast. Lives outside projects so it survives project clean-up and is the same in every video.
// In a project: import { HERO, NURSE } from '/channel/cast.js';   export const JAY = { ...HERO, speaker: 'JAY' };   export const PATEL = { ...NURSE, speaker: 'NURSE PATEL' };
// `speaker` is the name used in the script: speech bubbles and lip-sync find the character by it.
// `pose` is the role's resting pose (T.character uses it when no pose is given); shots still pose every frame.

// The hero: quilted lime puffer and platinum anime hair. This look is the channel's signature. Nobody else gets near-white hair, and the plain outfits around it stay calmer.
// 1.0.2 (2026-11-12, chosen by the user): waist-length puffer with fat quilted rows, charcoal edges (collar, cuffs, hem, zip) and a
// charcoal hood folded behind the neck; charcoal joggers with ribbed cuffs; white sneakers with a grey toe cap, a lime side stripe,
// a charcoal collar and laces (HERO_BASE). HERO_CLASSIC is the old look (no trousers, round feet) for re-rendering old videos unchanged.
export const HERO_CLASSIC = { top: 'puffer', color: '#b4f02e', color2: '#6fae1e', hair: 'anime', hairColor: '#e8ecf6', hairShade: '#6f7fb8', legs: null, shoes: null };
export const HERO_BASE = { ...HERO_CLASSIC, crop: true, quilt: 'puff', edge: '#2b2f3a', hood: '#2b2f3a', legs: '#33363f', legCuff: '#23252c',
  shoes: '#f4f4f2', shoeSole: '#ffffff', shoeToe: '#8a90a0', shoeStripe: '#b4f02e', shoeCollar: '#2b2f3a', laces: true };
// Fall (Sep–Nov, chosen 2026-11-12): heather-grey hoodie hood under the puffer, mustard scarf, olive-brown joggers.
export const HERO_FALL = { ...HERO_BASE, hood: '#9a9ea8', scarf: '#d9a441', legs: '#4a4636', legCuff: '#38352a' };
// The default hero follows the season the channel is publishing in; set it back to HERO_BASE (or a later HERO_WINTER) when it changes.
export const HERO = HERO_FALL;

// ---------------------------------------------------------------- supporting cast by role
// Rules (style-bible.md → Characters): the costume tells the job at a glance; colours stay deep and muted; whites are dimmed
// (#d2d3da, never pure white); the only loud colour and the only near-white hair belong to the hero. Older people get ash-grey
// hair (#8e8a94, mid value), balding, grey brows, glasses, a cane or a stoop, never white hair.
const GREY = '#8e8a94';

// friends and family
export const BESTIE = { top: 'tshirt', color: '#2f6f6a', stripe: '#d8ccb4', skirt: '#533a78', hair: 'sidePony', hairColor: '#8a4426', lashes: true };   // the hero's best friend (a girl)
export const BRO = { top: 'dress', color: '#f29ab4', collar: '#fff4f6', bow: '#ffffff', hair: 'long', hairColor: '#17131a', lashes: true, blush: true, bag: '#f4ead8', shoes: '#f2ece4', pop: 0.15 };   // 1.0 (2026-11-11): the hero's girl friend: long black hair, pink dress, a little self-lit so she stands out among the extras; voice af_nova (brand.json voice.roles BRO)
export const RIVAL = { top: 'jacket', color: '#2c3e6e', sleeves: '#b0a68c', shirt: '#243158', hair: 'quiff', hairColor: '#2b2d3c' };
export const CLASSMATE = { top: 'tshirt', color: '#8d4a6b', collar: '#e0d4c8', skirt: '#3e3048', hair: 'fringe', hairColor: '#34262c', bow: '#b89c5c', lashes: true };
export const MOM = { top: 'dress', color: '#3f6a58', scarf: '#9c7a3a', hair: 'bob', hairColor: '#4a3226', lashes: true, shoes: '#3a2a26', scale: 1.06 };
export const DAD = { top: 'tshirt', color: '#2c4470', collar: '#3c5688', legs: '#8a7a5e', shoes: '#3a2a20', hair: 'short', hairColor: '#3a2a20', beard: '#6a5040', scale: 1.12 };
export const GRANDPA = { top: 'jacket', color: '#6a4a36', shirt: '#c8b8a0', buttons: '#c8b8a0', buttonsTop: 0.26, legs: '#5a5050', shoes: '#3a2a20', face: 'glasses',
  hair: 'balding', hairColor: GREY, mustache: GREY, brows: GREY, prop: 'cane', pose: 'hunchCane' };
export const GRANDMA = { top: 'jacket', color: '#6a4a5e', shirt: '#d8ccb8', buttons: '#d8ccb8', buttonsTop: 0.26, skirt: '#4a4048', skirtLen: 1.7, shoes: '#3a2a26', face: 'glasses',
  hair: 'bun', hairColor: GREY, brows: GREY, lashes: true, scale: 0.97, pose: 'hunch' };
// more teens: a second or third girl/boy in the same scenes and background students. Roster roles with one colour or hair change each,
// so a video never needs an outfit written from scratch (tools/cast_check.py flags any that is).
export const CLASSMATE_2 = { ...CLASSMATE, color: '#2c3e6e', collar: '#c8b8a0', hair: 'bob', hairColor: '#24181a', bow: null, scarf: '#9c7a3a' };   // navy tee, bob, gold scarf
export const CLASSMATE_3 = { ...CLASSMATE, color: '#5f6a2e', hair: 'bun', hairColor: '#2a1e1a', bow: null, face: 'glasses' };                     // olive tee, bun, glasses
export const BRO_2 = { top: 'hoodie', color: '#3f6a58', color2: '#2f5244', strings: '#e8dcc8', hair: 'short', hairColor: '#3a2a20' };                               // forest hoodie, short hair
export const RIVAL_2 = { ...RIVAL, color: '#2f6f6a', shirt: '#24504c', hair: 'sidePart', hairColor: '#2a2420' };                                    // teal jacket, side part
export const STUDENTS = [   // background students (crowds of named-less kids), in this order: pick by index, never invent new ones
  BRO_2,
  { ...CLASSMATE, color: '#7a3a34', hair: 'ponytail', hairColor: '#2a1e1a', bow: null },
  { ...RIVAL, color: '#33313f', shirt: '#26242e', hair: 'messy', hairColor: '#4a3226' },
  { ...BESTIE, color: '#5f6a2e', hair: 'fringe', hairColor: '#34262c' },
  RIVAL_2,
  { ...CLASSMATE, color: '#6a4a5e', hair: 'pigtails', hairColor: '#3a2620', bow: null },
];
export const LITTLE_SIB = { top: 'tshirt', color: '#a8843c', skirt: '#3e3048', hair: 'pigtails', hairColor: '#4a3226', lashes: true, kid: true };

// school
export const TEACHER_F = { top: 'jacket', color: '#5f6a2e', shirt: '#e0d4c8', skirt: '#33313f', shoes: '#2a2228', hair: 'lowBun', hairColor: '#34262c', face: 'glasses', lashes: true,
  lanyard: '#2c3e6e', prop: 'book', scale: 1.06 };
export const TEACHER_M = { top: 'suit', color: '#7a3a34', shirt: '#c8d0dc', sleeves: '#c8d0dc', tie: '#2c3e6e', legs: '#4a4a52', shoes: '#2a2228', hair: 'sidePart', hairColor: '#4a4450',
  lanyard: '#2c3e6e', prop: 'clipboard', scale: 1.1 };   // sweater vest over a shirt
export const TEACHER_VN = { top: 'aodai', color: '#5a6a9a', shirt: '#5a6a9a', legs: '#d4d2d8', shoes: '#2a2228', hair: 'long', hairColor: '#24181a', lashes: true, scale: 1.06 };   // áo dài, for Vietnamese stories
export const PRINCIPAL = { top: 'suit', color: '#3a3a4a', tie: '#6e2c30', legs: '#2a2a34', shoes: '#18181e', hair: 'balding', hairColor: '#3a3440', mustache: '#3a3440', belly: 1.18, scale: 1.14 };
export const COACH = { top: 'jacket', color: '#3f6a58', stripe: '#d8d0bc', legs: '#3f6a58', shoes: '#d8d4cc', head: 'cap', headColor: '#2f5244', hair: 'short', hairColor: '#2e241e',
  whistle: '#2a2a34', scale: 1.12, pose: 'handsOnHips' };

// hospital and emergency
export const DOCTOR = { top: 'labcoat', shirt: '#3f6a8a', tie: '#2c3e6e', legs: '#3a3a44', shoes: '#2a2228', hair: 'short', hairColor: '#2a2420', skirtLen: 0.72,
  stethoscope: true, nameTag: '#d8d4cc', scale: 1.08 };
export const NURSE = { top: 'scrubs', color: '#4a6a8a', shoes: '#c8c8d0', hair: 'ponytail', hairColor: '#3a2620', lashes: true, head: 'nurseCap', nameTag: '#d8d4cc', scale: 1.04 };
export const PARAMEDIC = { top: 'jacket', color: '#3a5a4a', legs: '#3a5a4a', shoes: '#1e1e24', hair: 'short', hairColor: '#2a2420', bands: '#b8b49a', patch: 'EMS', prop: 'medbag', scale: 1.1 };
export const POLICE = { top: 'tshirt', color: '#2a3a60', collar: '#2a3a60', legs: '#1c2440', shoes: '#141418', hair: 'short', hairColor: '#24201e', head: 'policeCap',
  badge: '#c8a85a', epaulettes: '#1c2848', belt: '#1e1e26', radio: true, buttons: '#1c2848', buttonsTop: 0.38, scale: 1.12, pose: 'handsOnBelt' };
export const FIREFIGHTER = { top: 'jacket', color: '#6a5a3a', legs: '#6a5a3a', shoes: '#18181e', head: 'fireHelmet', bands: '#c0b478', scale: 1.14 };

// work and town
export const GUARD = { top: 'tshirt', color: '#33313f', collar: '#33313f', legs: '#26242e', shoes: '#141418', head: 'cap', headColor: '#26242e', hair: 'short', hairColor: '#24201e',
  patch: 'SECURITY', belt: '#1e1e26', radio: true, prop: 'torch', scale: 1.12 };
export const CHEF = { top: 'jacket', color: '#bdb8b0', scarf: '#7a3a34', legs: '#3a3640', shoes: '#18181e', head: 'chefHat', buttons: '#8a8478', buttonRows: 2, belly: 1.12, scale: 1.1 };
export const CASHIER = { top: 'tshirt', color: '#8a5a3a', collar: '#8a5a3a', legs: '#3a3640', hair: 'fringe', hairColor: '#2a1e1a', lashes: true, apron: '#3f6a58', nameTag: '#d8d4cc', scale: 1.04 };
export const SCIENTIST = { top: 'labcoat', shirt: '#5f6a2e', legs: '#3a3a44', shoes: '#2a2228', hair: 'messy', hairColor: '#4a3a30', skirtLen: 0.72, goggles: true, scale: 1.06 };
export const WORKER = { top: 'tshirt', color: '#5a5a62', legs: '#3a4258', shoes: '#4a3626', head: 'hardhat', hiVis: '#b8743a', scale: 1.12 };
export const REPORTER = { top: 'suit', color: '#6a3a4a', shirt: '#e0d4c8', legs: '#33313f', shoes: '#2a2228', hair: 'bob', hairColor: '#3a2a24', lashes: true, prop: 'mic', scale: 1.04, pose: 'holdMic' };
export const SHADY = { top: 'suit', color: '#33313f', shirt: '#c8c4cc', tie: '#5e2230', hair: 'slick', hairColor: '#26232c', face: 'sunglasses', scale: 1.08 };   // stranger, shady boss

// Script words → role. The script check and the story breakdown use this to dress a named character for their job.
export const ROLES = {
  BESTIE: ['best friend', 'bestie'], BRO: ['buddy', 'bro'], RIVAL: ['rival', 'bully'], CLASSMATE: ['classmate', 'crush', 'popular girl'],
  CLASSMATE_2: ['new girl', 'second girl'], CLASSMATE_3: ['lab partner', 'third girl'], BRO_2: ['second boy', 'teammate'], RIVAL_2: ['third boy'], STUDENTS: ['students', 'kids', 'crowd'],
  MOM: ['mom', 'mum', 'mother'], DAD: ['dad', 'father'], GRANDPA: ['grandpa', 'grandfather', 'old man'], GRANDMA: ['grandma', 'grandmother', 'old woman', 'old lady'],
  LITTLE_SIB: ['little sister', 'little brother', 'baby sister', 'baby brother'],
  TEACHER_F: ['teacher', 'miss', 'mrs.', 'ms.'], TEACHER_M: ['teacher', 'mr.', 'sir'], TEACHER_VN: ['cô giáo', 'thầy giáo'], PRINCIPAL: ['principal', 'headmaster'], COACH: ['coach'],
  DOCTOR: ['doctor', 'dr.', 'surgeon'], NURSE: ['nurse'], PARAMEDIC: ['paramedic', 'ambulance', 'emt'], POLICE: ['police', 'cop', 'officer', 'detective'], FIREFIGHTER: ['firefighter', 'fireman'],
  GUARD: ['guard', 'security'], CHEF: ['chef', 'cook'], CASHIER: ['cashier', 'shopkeeper', 'clerk', 'waiter', 'waitress'], SCIENTIST: ['scientist', 'professor', 'researcher'],
  WORKER: ['worker', 'builder', 'construction'], REPORTER: ['reporter', 'journalist', 'news anchor'], SHADY: ['stranger', 'boss', 'scammer', 'dealer'],
};

// ---------------------------------------------------------------- old names (projects made before 0.2.3 import these; looks unchanged)
export const FRIEND = BRO;
export const GIRL = CLASSMATE;
export const GIRL2 = BESTIE;
export const PARENT = { top: 'dress', color: '#3f6a58', scarf: '#9c7a3a', hair: 'bun', hairColor: '#4a3226', scale: 1.08 };
export const TEACHER = { top: 'suit', color: '#5f6a2e', shirt: '#d8d0bc', tie: '#6e2c30', hair: 'sidePart', hairColor: '#5c5660', face: 'glasses', scale: 1.08 };
export const STRANGER = SHADY;
