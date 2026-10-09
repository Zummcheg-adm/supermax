'use strict';
/* =========================================================
   Супер-Макс: тренажёр букв. Один файл, без внешних библиотек.
   ========================================================= */

/* ---------- utils ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const nextFrame = () => new Promise(r => requestAnimationFrame(() => r()));
const rnd = (a, b) => a + Math.random() * (b - a);
const ri = (a, b) => Math.floor(rnd(a, b + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const easeOut = t => 1 - Math.pow(1 - t, 3);
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function plural(n, one, few, many) { const m10 = n % 10, m100 = n % 100; if (m10 === 1 && m100 !== 11) return one; if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few; return many; }
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const STOP = { stop: true };

/* ---------- letters ---------- */
// [буква, тип (v гласная / c согласная / s знак), имя-звук, имя по алфавиту, слова]
const LDATA = [
  ['А', 'v', 'а', 'а', [['арбуз', '🍉'], ['ананас', '🍍'], ['автобус', '🚌'], ['акула', '🦈']]],
  ['Б', 'c', 'бэ', 'бэ', [['банан', '🍌'], ['бабочка', '🦋'], ['белка', '🐿️'], ['барабан', '🥁']]],
  ['В', 'c', 'вэ', 'вэ', [['волк', '🐺'], ['велосипед', '🚲'], ['вишня', '🍒'], ['верблюд', '🐫']]],
  ['Г', 'c', 'гэ', 'гэ', [['гриб', '🍄'], ['гитара', '🎸'], ['груша', '🍐'], ['горилла', '🦍']]],
  ['Д', 'c', 'дэ', 'дэ', [['дом', '🏠'], ['дельфин', '🐬'], ['динозавр', '🦖'], ['дерево', '🌳']]],
  ['Е', 'v', 'е', 'е', [['единорог', '🦄'], ['енот', '🦝']]],
  ['Ё', 'v', 'ё', 'ё', [['ёж', '🦔'], ['ёлка', '🎄']]],
  ['Ж', 'c', 'жэ', 'жэ', [['жираф', '🦒'], ['жук', '🪲']]],
  ['З', 'c', 'зэ', 'зэ', [['зебра', '🦓'], ['заяц', '🐰'], ['зонтик', '☂️'], ['звезда', '⭐']]],
  ['И', 'v', 'и', 'и', [['индюк', '🦃'], ['инопланетянин', '👽'], ['иголка', '🪡']]],
  ['Й', 'c', 'и краткое', 'и краткое', [['попугай', '🦜'], ['трамвай', '🚋'], ['чай', '☕']]],
  ['К', 'c', 'кэ', 'ка', [['кот', '🐱'], ['корова', '🐄'], ['ключ', '🔑'], ['корона', '👑'], ['кенгуру', '🦘']]],
  ['Л', 'c', 'лэ', 'эль', [['лев', '🦁'], ['лиса', '🦊'], ['лимон', '🍋'], ['луна', '🌙']]],
  ['М', 'c', 'мэ', 'эм', [['машина', '🚗'], ['мороженое', '🍦'], ['медведь', '🐻'], ['мёд', '🍯']]],
  ['Н', 'c', 'нэ', 'эн', [['носорог', '🦏'], ['нос', '👃'], ['носки', '🧦'], ['ножницы', '✂️']]],
  ['О', 'v', 'о', 'о', [['облако', '☁️'], ['огурец', '🥒'], ['обезьяна', '🐒'], ['олень', '🦌']]],
  ['П', 'c', 'пэ', 'пэ', [['пингвин', '🐧'], ['пчела', '🐝'], ['пицца', '🍕'], ['паук', '🕷️']]],
  ['Р', 'c', 'рэ', 'эр', [['ракета', '🚀'], ['робот', '🤖'], ['радуга', '🌈'], ['рыба', '🐟']]],
  ['С', 'c', 'сэ', 'эс', [['слон', '🐘'], ['сова', '🦉'], ['солнце', '☀️'], ['самолёт', '✈️']]],
  ['Т', 'c', 'тэ', 'тэ', [['тигр', '🐯'], ['трактор', '🚜'], ['торт', '🎂'], ['тыква', '🎃']]],
  ['У', 'v', 'у', 'у', [['утка', '🦆'], ['улитка', '🐌'], ['ухо', '👂'], ['удочка', '🎣']]],
  ['Ф', 'c', 'фэ', 'эф', [['фламинго', '🦩'], ['фонарик', '🔦'], ['флаг', '🚩'], ['футболка', '👕']]],
  ['Х', 'c', 'хэ', 'ха', [['хомяк', '🐹'], ['хлеб', '🍞'], ['хоккей', '🏒']]],
  ['Ц', 'c', 'цэ', 'цэ', [['цыплёнок', '🐤'], ['цветок', '🌷'], ['цирк', '🎪']]],
  ['Ч', 'c', 'че', 'че', [['черепаха', '🐢'], ['часы', '⌚'], ['чемодан', '🧳'], ['черника', '🫐']]],
  ['Ш', 'c', 'шэ', 'ша', [['шарик', '🎈'], ['шоколад', '🍫'], ['шляпа', '🎩'], ['шарф', '🧣']]],
  ['Щ', 'c', 'щэ', 'ща', [['щенок', '🐶'], ['щит', '🛡️'], ['щётка', '🪥']]],
  ['Ъ', 's', 'твёрдый знак', 'твёрдый знак', [['подъёмный кран', '🏗️']]],
  ['Ы', 'v', 'ы', 'ы', [['сыр', '🧀'], ['дыня', '🍈'], ['мышь', '🐭']]],
  ['Ь', 's', 'мягкий знак', 'мягкий знак', [['конь', '🐴'], ['соль', '🧂'], ['пальто', '🧥']]],
  ['Э', 'v', 'э', 'э', [['экскаватор', '#p_excavator'], ['экран', '📺'], ['эльф', '🧝']]],
  ['Ю', 'v', 'ю', 'ю', [['юла', '#p_yula'], ['юпитер', '🪐']]],
  ['Я', 'v', 'я', 'я', [['яблоко', '🍎'], ['яйцо', '🥚'], ['якорь', '⚓'], ['ящерица', '🦎']]],
];
const ALPHA = LDATA.map(d => d[0]);
const LET = {};
LDATA.forEach(([c, type, sname, aname, words]) => {
  LET[c] = { c, type, sname, aname, words: words.map(([w, e]) => ({ w, e, i: w.toUpperCase().indexOf(c) })) };
});
const BASE_ORDER = ['А', 'М', 'О', 'У', 'С', 'Н', 'Т', 'И', 'Л', 'К', 'Р', 'Ы', 'П', 'Е', 'В', 'Д', 'З', 'Б', 'Я', 'Г', 'Ш', 'Ж', 'Х', 'Ч', 'Й', 'Ю', 'Ё', 'Ф', 'Ц', 'Э', 'Щ', 'Ь', 'Ъ'];
const SIMILAR = {
  'А': ['Л', 'Д'], 'Б': ['В', 'Ь', 'Ъ', 'Р'], 'В': ['Б', 'Р', 'З', 'Ь'], 'Г': ['Т', 'П'], 'Д': ['Л', 'Ц', 'А'],
  'Е': ['Ё', 'З', 'Э'], 'Ё': ['Е'], 'Ж': ['Х', 'К'], 'З': ['Э', 'В', 'Е'], 'И': ['Й', 'Н', 'П'], 'Й': ['И'],
  'К': ['Ж', 'Х'], 'Л': ['П', 'Д', 'А'], 'М': ['Н', 'Л'], 'Н': ['И', 'П'], 'О': ['С', 'Ю', 'Ф'], 'П': ['Л', 'Н', 'Г'],
  'Р': ['Ь', 'В', 'Я'], 'С': ['О', 'Э', 'Е'], 'Т': ['Г', 'П'], 'У': ['Ч', 'Х'], 'Ф': ['О'], 'Х': ['Ж', 'К'],
  'Ц': ['Щ', 'Д', 'Ш'], 'Ч': ['У', 'Ц'], 'Ш': ['Щ', 'Ц', 'Ж'], 'Щ': ['Ш', 'Ц'], 'Ъ': ['Ь', 'Ы'], 'Ы': ['Ь', 'Ъ'],
  'Ь': ['Ъ', 'Ы', 'Р', 'Б'], 'Э': ['З', 'С', 'Ю'], 'Ю': ['О', 'Ы', 'Ь'], 'Я': ['Р', 'Ь'],
};

/* strokes for tracing: letter box 0..100 tall (y down) */
const ARC = (cx, cy, rx, ry, a0, a1) => { const n = Math.max(6, Math.ceil(Math.abs(a1 - a0) / 8)); const o = []; for (let i = 0; i <= n; i++) { const a = (a0 + (a1 - a0) * i / n) * Math.PI / 180; o.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); } return o; };
const CAT = (...parts) => { const o = []; parts.forEach(p => { if (typeof p[0] === 'number') o.push(p); else o.push(...p); }); return o; };
const STROKES = {
  'А': [[[36, 0], [6, 100]], [[36, 0], [66, 100]], [[18, 64], [54, 64]]],
  'Б': [[[10, 0], [10, 100]], [[10, 0], [58, 0]], CAT([10, 44], [36, 44], ARC(36, 72, 26, 28, -90, 90), [10, 100])],
  'В': [[[10, 0], [10, 100]], CAT([10, 0], [34, 0], ARC(34, 23, 20, 23, -90, 90), [10, 46]), CAT([10, 46], [38, 46], ARC(38, 73, 24, 27, -90, 90), [10, 100])],
  'Г': [[[10, 0], [10, 100]], [[10, 0], [58, 0]]],
  'Д': [[[24, 0], [10, 100]], [[24, 0], [62, 0]], [[62, 0], [62, 100]], [[0, 118], [0, 100], [72, 100], [72, 118]]],
  'Е': [[[10, 0], [10, 100]], [[10, 0], [58, 0]], [[10, 50], [50, 50]], [[10, 100], [58, 100]]],
  'Ё': [[[10, 0], [10, 100]], [[10, 0], [58, 0]], [[10, 50], [50, 50]], [[10, 100], [58, 100]], [[22, -18]], [[46, -18]]],
  'Ж': [[[4, 0], [44, 50], [4, 100]], [[44, 0], [44, 100]], [[84, 0], [44, 50], [84, 100]]],
  'З': [CAT(ARC(34, 25, 24, 25, -155, 90), ARC(36, 74, 27, 26, -90, 155))],
  'И': [[[10, 0], [10, 100]], [[10, 100], [62, 0]], [[62, 0], [62, 100]]],
  'Й': [[[10, 0], [10, 100]], [[10, 100], [62, 0]], [[62, 0], [62, 100]], ARC(36, -22, 13, 9, 180, 0)],
  'К': [[[10, 0], [10, 100]], [[58, 0], [12, 52], [60, 100]]],
  'Л': [[[4, 100], [24, 0], [62, 0], [62, 100]]],
  'М': [[[8, 100], [8, 0], [42, 64], [76, 0], [76, 100]]],
  'Н': [[[10, 0], [10, 100]], [[62, 0], [62, 100]], [[10, 50], [62, 50]]],
  'О': [ARC(36, 50, 32, 50, -90, -450)],
  'П': [[[10, 100], [10, 0], [62, 0], [62, 100]]],
  'Р': [[[10, 0], [10, 100]], CAT([10, 0], [34, 0], ARC(34, 26, 24, 26, -90, 90), [10, 52])],
  'С': [ARC(40, 50, 34, 50, -40, -320)],
  'Т': [[[4, 0], [70, 0]], [[37, 0], [37, 100]]],
  'У': [[[4, 0], [40, 58]], [[70, 0], [16, 100]]],
  'Ф': [[[45, 0], [45, 100]], ARC(45, 46, 38, 30, -90, -450)],
  'Х': [[[6, 0], [66, 100]], [[66, 0], [6, 100]]],
  'Ц': [[[10, 0], [10, 100]], [[60, 0], [60, 100]], [[10, 100], [72, 100], [72, 118]]],
  'Ч': [CAT([10, 0], [10, 30], ARC(34, 30, 24, 22, 180, 90), [58, 52]), [[58, 0], [58, 100]]],
  'Ш': [[[8, 0], [8, 100], [84, 100], [84, 0]], [[46, 0], [46, 100]]],
  'Щ': [[[8, 0], [8, 100], [84, 100], [84, 0]], [[46, 0], [46, 100]], [[84, 100], [94, 100], [94, 118]]],
  'Ъ': [[[0, 0], [18, 0], [18, 100]], CAT([18, 44], [42, 44], ARC(42, 72, 24, 28, -90, 90), [18, 100])],
  'Ы': [[[8, 0], [8, 100]], CAT([8, 44], [30, 44], ARC(30, 72, 22, 28, -90, 90), [8, 100]), [[78, 0], [78, 100]]],
  'Ь': [[[10, 0], [10, 100]], CAT([10, 44], [36, 44], ARC(36, 72, 26, 28, -90, 90), [10, 100])],
  'Э': [ARC(30, 50, 34, 50, -140, 140), [[22, 50], [63, 50]]],
  'Ю': [[[8, 0], [8, 100]], [[8, 50], [31, 50]], ARC(60, 50, 29, 50, -90, -450)],
  'Я': [CAT([60, 0], [32, 0], ARC(32, 26, 24, 26, -90, -270), [60, 52]), [[60, 0], [60, 100]], [[36, 52], [8, 100]]],
};

/* ---------- build mode: blocks & blueprints ---------- */
const BCH = { g: 'grass', d: 'dirt', s: 'stone', c: 'cobble', p: 'planks', l: 'log', b: 'brick', w: 'glass', f: 'leaves', y: 'gold', i: 'gemb', r: 'red', W: 'white', u: 'blue', k: 'dark', D: 'door', a: 'sand', o: 'orange', Y: 'ylw' };
const TCH = Object.fromEntries(Object.entries(BCH).map(([k, v]) => [v, k]));
const BLOCKS = [
  { t: 'planks', name: 'Доски' }, { t: 'brick', name: 'Кирпичик' }, { t: 'stone', name: 'Камень' }, { t: 'cobble', name: 'Булыжник' },
  { t: 'glass', name: 'Стекло' }, { t: 'door', name: 'Дверка' }, { t: 'log', name: 'Бревно' }, { t: 'leaves', name: 'Листья' },
  { t: 'grass', name: 'Трава' }, { t: 'sand', name: 'Песок' }, { t: 'gold', name: 'Золото' }, { t: 'gemb', name: 'Алмазный блок' },
  { t: 'red', name: 'Красный блок' }, { t: 'blue', name: 'Синий блок' }, { t: 'white', name: 'Белый блок' }, { t: 'dark', name: 'Чёрный блок' },
];
const WW = 16, WH = 10;      // the building grid: columns × rows above the ground
const BONUS = 10;            // diamonds for the first finished blueprint of each kind
const BP = [
  { name: 'Домик', acc: 'домик', done: 'Ура! Домик построен!', rows: [
    '...b...',
    '..bbb..',
    '.bbbbb.',
    'bbbbbbb',
    '.pwpDp.',
    '.pppDp.',
    '.ccccc.'] },
  { name: 'Башня', acc: 'башню', done: 'Ура! Башня построена!', rows: [
    '..lrr..',
    '..l....',
    's.s.s.s',
    'sssssss',
    '.swsws.',
    '.sssss.',
    '.swsws.',
    '.ssDss.',
    '.ssDss.',
    'ccccccc'] },
  { name: 'Замок', acc: 'замок', done: 'Ура! Замок построен!', rows: [
    '..lrr.......lrr',
    '..l.........l..',
    's.s.s.....s.s.s',
    'sssss.....sssss',
    'swsws.s.s.swsws',
    'sssssssssssssss',
    'sssssssysssssss',
    'swssssDDDssssws',
    'ssssssDDDssssss',
    'ccccccDDDcccccc'] },
  { name: 'Ракета', acc: 'ракету', done: 'Ракета построена! Пуск!', rocket: true, rows: [
    '....r....',
    '...rrr...',
    '..WWWWW..',
    '..WwiwW..',
    '..WWWWW..',
    '..WrrrW..',
    '..WWWWW..',
    '.rWWWWWr.',
    'rrWkkkWrr',
    'rr.kkk.rr'] },
];
BP.forEach(b => {
  b.h = b.rows.length; b.w = Math.max(...b.rows.map(r => r.length)); b.cells = [];
  b.ox = Math.floor((WW - b.w) / 2); b.oy = WH - b.h; b.set = new Set();
  for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) { const ch = b.rows[y][x]; if (ch && ch !== '.') { b.cells.push({ x, y, t: BCH[ch] }); b.set.add((b.oy + y) * WW + b.ox + x); } }
  b.n = b.cells.length;
});

/* ---------- heroes (костюмы Супер-Макса) ---------- */
const HEROES = [
  { id: 'hero', name: 'Супер-Макс', price: 0 },
  { id: 'h_cosmo', name: 'Космонавт', price: 20 },
  { id: 'h_ninja', name: 'Ниндзя', price: 35 },
  { id: 'h_robot', name: 'Робот', price: 55 },
  { id: 'h_builder', name: 'Строитель', price: 80 },
  { id: 'h_dino', name: 'Динозаврик', price: 110 },
  { id: 'h_knight', name: 'Рыцарь', price: 145 },
  { id: 'h_pirate', name: 'Пират', price: 185 },
  { id: 'h_wizard', name: 'Волшебник', price: 230 },
];

/* ---------- state ---------- */
const KEY = 'supermax-letters-v1';
const DEF = () => ({ v: 1, name: 'Максим', hero: 'Супер-Макс', boy: true, mode: 'sound', lower: false, voiceURI: '', rate: 0.9, sfx: true, sysVoice: false, len: 8, gems: 0, placed: 0, missions: 0, skin: 'hero', owned: ['hero'], spent: 0, world: '', bp: -1, bpDone: [], btool: 'planks', buildSeen: 0, L: {} });
let S = DEF();
function load() {
  try { const raw = localStorage.getItem(KEY); if (raw) { const o = JSON.parse(raw); if (o && typeof o === 'object') { S = Object.assign(DEF(), o); S.L = o.L || {}; } } } catch (e) { /* storage unavailable */ }
  ALPHA.forEach(c => { S.L[c] = Object.assign({ u: 0, sc: 0, n: 0, ok: 0, st: 0, t: 0, intro: 0 }, S.L[c] || {}); });
  const w = typeof S.world === 'string' ? S.world : '';
  S.world = w.length === WW * WH ? [...w].map(ch => (ch !== '.' && BCH[ch]) ? ch : '.').join('') : '.'.repeat(WW * WH);
  if (!(S.bp >= -1 && S.bp < BP.length)) S.bp = -1;
  if (!Array.isArray(S.bpDone)) S.bpDone = [];
  if (S.btool !== 'pick' && !BLOCKS.some(b => b.t === S.btool)) S.btool = 'planks';
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignore */ } }

const lv = c => { const s = S.L[c].sc; return s >= 90 ? 3 : s >= 55 ? 2 : s >= 25 ? 1 : 0; };
function order() { const first = (S.name || '').trim().charAt(0).toUpperCase(); const o = BASE_ORDER.slice(); const i = o.indexOf(first); if (i > 1 && LET[first].type !== 's') { o.splice(i, 1); o.splice(1, 0, first); } return o; }
const unlocked = () => order().filter(c => S.L[c].u);
const nextLocked = () => order().find(c => !S.L[c].u);
function canUnlock() { const u = unlocked(); if (!u.length) return true; if (u.length >= ALPHA.length) return false; if (u.some(c => lv(c) < 1)) return false; return u.filter(c => lv(c) < 2).length <= 2; }
const hasPic = c => LET[c].words.some(w => w.i === 0);
const isSign = c => LET[c].type === 's';
const nm = c => S.mode === 'alpha' ? LET[c].aname : LET[c].sname;
const nom = c => isSign(c) ? nm(c) : `буква ${nm(c)}`;
const acc = c => isSign(c) ? nm(c) : `букву ${nm(c)}`;
const needPh = c => isSign(c) ? `А нам нужен ${nm(c)}.` : `А нам нужна буква ${nm(c)}.`;
const vb = (m, f) => S.boy ? m : f;

function record(c, good, kind) {
  const d = S.L[c]; d.t = Date.now();
  if (kind === 'trace') d.sc = Math.min(100, d.sc + 5);
  else if (kind === 'match') { d.n++; if (good) { d.ok++; d.sc = Math.min(100, d.sc + 6); } else d.sc = Math.max(0, d.sc - 4); }
  else { d.n++; if (good) { d.ok++; d.st++; d.sc = Math.min(100, d.sc + 10 + Math.min(d.st, 4) * 2); } else { d.st = 0; d.sc = Math.max(0, d.sc - 10); } }
  save();
}
function boost(c, v) { S.L[c].sc = Math.min(100, S.L[c].sc + v); S.L[c].t = Date.now(); save(); }

/* ---------- sprites & textures ---------- */
const SPRITES = /*SPRITES*/{};
const PAL = SPRITES.pal, SPR = SPRITES.spr;
const SPRC = {}, SPRU = {};
function buildSprites() {
  for (const [name, rows] of Object.entries(SPR)) {
    const w = rows[0].length, h = rows.length;
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d');
    rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) { const ch = r[x]; if (ch !== '.' && PAL[ch]) { g.fillStyle = PAL[ch]; g.fillRect(x, y, 1, 1); } } });
    SPRC[name] = c; SPRU[name] = c.toDataURL();
  }
}
const owns = id => (S.owned || []).includes(id);
const heroKey = () => (owns(S.skin) && SPRU[S.skin]) ? S.skin : 'hero';
const sprKey = name => name === 'hero' ? heroKey() : name;
const sprImg = (name, cls = '') => `<img class="spr ${cls}" src="${SPRU[sprKey(name)]}" alt="">`;
function applySprites(root = document) { $$('img[data-spr]', root).forEach(im => { const k = sprKey(im.dataset.spr); if (SPRU[k]) im.src = SPRU[k]; }); }

const TEX = {};
const CRACK = [];
function genTextures() {
  const R = mulberry32(20261009);
  const make = (name, fn) => { const c = document.createElement('canvas'); c.width = c.height = 16; const g = c.getContext('2d'); fn(g); TEX[name] = { cv: c, url: c.toDataURL(), cols: colorsOf(c) }; };
  const px = (g, x, y, col) => { g.fillStyle = col; g.fillRect(x, y, 1, 1); };
  const speck = (g, base, sp, d) => { g.fillStyle = base; g.fillRect(0, 0, 16, 16); for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (R() < d) px(g, x, y, sp[Math.floor(R() * sp.length)]); };
  const bevel = (g, light, dark) => { g.fillStyle = light; g.fillRect(0, 0, 16, 1); g.fillRect(0, 0, 1, 16); g.fillStyle = dark; g.fillRect(0, 15, 16, 1); g.fillRect(15, 0, 1, 16); };
  make('dirt', g => speck(g, '#8a5a34', ['#6d4426', '#a36d3f', '#5a371d', '#7b4f2c'], .45));
  make('grass', g => { speck(g, '#8a5a34', ['#6d4426', '#a36d3f', '#5a371d'], .45); for (let x = 0; x < 16; x++) { const h = 3 + (R() < .5 ? 1 : 0) + (R() < .25 ? 1 : 0); for (let y = 0; y < h; y++) px(g, x, y, ['#5cb84a', '#4fa63e', '#6fcf5a', '#5cb84a'][Math.floor(R() * 4)]); } });
  make('stone', g => speck(g, '#8e8e98', ['#7b7b85', '#a3a3ad', '#6c6c76', '#8e8e98'], .55));
  make('cobble', g => { g.fillStyle = '#5e5e68'; g.fillRect(0, 0, 16, 16); [[0, 0, 6, 5], [6, 0, 5, 4], [11, 0, 5, 6], [0, 5, 4, 6], [4, 4, 7, 6], [11, 6, 5, 5], [0, 11, 7, 5], [7, 10, 5, 6], [12, 11, 4, 5]].forEach(([x, y, w, h]) => { g.fillStyle = ['#9a9aa4', '#8a8a94', '#a8a8b2'][Math.floor(R() * 3)]; g.fillRect(x + 1, y + 1, w - 1, h - 1); g.fillStyle = '#bdbdc6'; g.fillRect(x + 1, y + 1, Math.max(1, w - 2), 1); }); });
  make('planks', g => { speck(g, '#b9854b', ['#a8763f', '#c8955a', '#a06d38'], .3); g.fillStyle = '#7d5530'; [3, 7, 11, 15].forEach(y => g.fillRect(0, y, 16, 1)); [[5, 0], [12, 4], [3, 8], [9, 12]].forEach(([x, y]) => g.fillRect(x, y, 1, 3)); });
  make('log', g => { g.fillStyle = '#6b4a2b'; g.fillRect(0, 0, 16, 16); for (let x = 0; x < 16; x++) if (x % 4 === 1 || R() < .15) { g.fillStyle = '#4f361f'; g.fillRect(x, 0, 1, 16); } for (let i = 0; i < 22; i++) px(g, Math.floor(R() * 16), Math.floor(R() * 16), '#7d5a36'); });
  make('brick', g => { g.fillStyle = '#d6cbbd'; g.fillRect(0, 0, 16, 16); for (let row = 0; row < 4; row++) { const off = row % 2 ? 4 : 0; for (let bx = -1; bx < 3; bx++) { g.fillStyle = ['#b5473a', '#a83e33', '#c25244'][Math.floor(R() * 3)]; g.fillRect(bx * 8 + off, row * 4, 7, 3); } } });
  make('glass', g => { g.fillStyle = '#b4e8f6'; g.fillRect(0, 0, 16, 16); g.fillStyle = '#e9fbff'; g.fillRect(0, 0, 16, 1); g.fillRect(0, 0, 1, 16); g.fillRect(0, 15, 16, 1); g.fillRect(15, 0, 1, 16); g.fillStyle = '#ffffff'; for (let i = 0; i < 4; i++) { g.fillRect(3 + i, 7 - i, 1, 1); g.fillRect(9 + i, 13 - i, 1, 1); } });
  make('leaves', g => speck(g, '#3f8f35', ['#2d6b25', '#59ad48', '#357a2c', '#4a9e3e'], .6));
  make('gold', g => { speck(g, '#f5c518', ['#ffe066', '#e3b012', '#fff2a8'], .3); bevel(g, '#fff2a8', '#c8961a'); });
  make('gemb', g => { speck(g, '#3fd9d2', ['#a6fff9', '#22b8b1', '#7af0ea'], .35); bevel(g, '#c9fffb', '#159690'); });
  make('red', g => speck(g, '#d8343c', ['#c42c34', '#e4474f'], .3));
  make('white', g => speck(g, '#ececf2', ['#dcdce6', '#fafaff'], .3));
  make('blue', g => speck(g, '#2f5bd8', ['#284fc0', '#3d6be6'], .3));
  make('ylw', g => speck(g, '#f2c12e', ['#e0ae20', '#f8d050'], .3));
  make('dark', g => speck(g, '#2b2440', ['#3b2f5c', '#1e1930', '#4a3a78'], .4));
  make('door', g => { speck(g, '#7a5230', ['#6a4628', '#8a5e38'], .3); g.fillStyle = '#4e3218'; g.fillRect(0, 0, 16, 1); g.fillRect(0, 15, 16, 1); g.fillRect(0, 0, 1, 16); g.fillRect(15, 0, 1, 16); g.fillRect(7, 0, 2, 16); g.fillStyle = '#ffc62e'; g.fillRect(11, 8, 2, 2); });
  make('sand', g => speck(g, '#e8d69a', ['#d9c486', '#f2e3ae', '#cdb877'], .4));
  make('orange', g => speck(g, '#ff8a1f', ['#ffb14a', '#e86f0c'], .35));
  // cracks (3 stages, accumulating)
  const c = document.createElement('canvas'); c.width = c.height = 16; const g = c.getContext('2d'); g.fillStyle = 'rgba(27,21,48,.9)';
  const RC = mulberry32(42);
  for (let stage = 0; stage < 3; stage++) {
    for (let w = 0; w < 3 + stage * 2; w++) { let x = 8, y = 8; const n = 3 + Math.floor(RC() * 5); for (let i = 0; i < n; i++) { x = clamp(x + Math.round(RC() * 2 - 1), 1, 14); y = clamp(y + Math.round(RC() * 2 - 1), 1, 14); g.fillRect(x, y, 1, 1); } }
    CRACK.push(c.toDataURL());
  }
}
function colorsOf(c) { const d = c.getContext('2d').getImageData(0, 0, 16, 16).data; const set = new Set(); for (let i = 0; i < d.length; i += 4 * 9) set.add(`rgb(${d[i]},${d[i + 1]},${d[i + 2]})`); return [...set].slice(0, 6); }
const BLOCK_TEX = ['planks', 'stone', 'gold', 'gemb', 'brick', 'sand', 'cobble', 'grass', 'log', 'leaves', 'blue', 'red', 'ylw'];

/* ---------- voice: built-in neural clips (offline) + system TTS fallback ---------- */
const CLIPS = /*CLIPS*/{};
const PWA = /*PWA*/false;
let onVoices = null;

const TTS = (() => {
  const synth = ('speechSynthesis' in window) ? window.speechSynthesis : null;
  let voice = null, token = 0, busy = false, unlockedV = false;
  function ruVoices() { let v = []; try { v = synth ? synth.getVoices() : []; } catch (e) { v = []; } return (v || []).filter(x => /^ru([-_]|$)/i.test(x.lang || '') || /russian|русск/i.test(x.name || '')); }
  function choose() {
    const ru = ruVoices();
    voice = ru.find(v => v.voiceURI === S.voiceURI) || null;
    if (!voice) {
      const pref = [/google/i, /milena/i, /katya|катя/i, /irina|ирина/i, /svetlana|светлана/i, /dariya|дария/i, /alena|алёна/i];
      for (const re of pref) { voice = ru.find(v => re.test(v.name) && v.localService) || ru.find(v => re.test(v.name)); if (voice) break; }
    }
    if (!voice) voice = ru.find(v => v.localService) || ru[0] || null;
    if (typeof onVoices === 'function') onVoices();
  }
  if (synth) {
    try { synth.addEventListener('voiceschanged', choose); } catch (e) { synth.onvoiceschanged = choose; }
    [0, 300, 1200, 3000].forEach(t => setTimeout(choose, t));
  }
  function say(text, o = {}) {
    return new Promise(res => {
      const my = ++token;
      if (!synth || !text) { busy = false; setTimeout(res, Math.min(1500, 250 + (text || '').length * 35)); return; }
      let wasBusy = false;
      try { wasBusy = !!(synth.speaking || synth.pending); } catch (e) { /* ignore */ }
      if (wasBusy) { try { synth.cancel(); } catch (e) { /* ignore */ } }
      busy = true;
      let u;
      try { u = new SpeechSynthesisUtterance(text); } catch (e) { busy = false; res(); return; }
      u.lang = 'ru-RU'; try { if (voice) u.voice = voice; } catch (e) { /* ignore */ }
      u.rate = clamp((S.rate || 0.9) * (o.rate || 1), 0.5, 1.6); u.pitch = o.pitch || 1.05; u.volume = 1;
      let done = false;
      const fin = () => { if (done) return; done = true; clearTimeout(tm); if (my === token) busy = false; res(); };
      u.onend = fin; u.onerror = fin;
      const tm = setTimeout(fin, 1800 + text.length * 95 / u.rate);
      const go = () => { if (my !== token) { fin(); return; } try { synth.speak(u); } catch (e) { fin(); } };
      if (wasBusy) setTimeout(go, 60); else go();
    });
  }
  function stop() { token++; busy = false; try { if (synth) synth.cancel(); } catch (e) { /* ignore */ } }
  function unlock() { if (unlockedV || !synth) return; unlockedV = true; try { if (synth.speaking || synth.pending) return; const u = new SpeechSynthesisUtterance(''); u.volume = 0; u.lang = 'ru-RU'; synth.speak(u); } catch (e) { /* ignore */ } }
  return { say, stop, unlock, choose, ruVoices, get voice() { return voice; }, get busy() { return busy; }, get ok() { return !!synth; } };
})();


const Voice = (() => {
  let token = 0, busy = false, cur = null;
  const lru = new Map();
  const has = t => !!t && Object.prototype.hasOwnProperty.call(CLIPS, t);
  function decode(t) {
    if (lru.has(t)) { const p = lru.get(t); lru.delete(t); lru.set(t, p); return p; }
    const ctx = Sfx.context(); if (!ctx) return Promise.reject(new Error('no audio'));
    const p = new Promise((res, rej) => {
      try {
        const bin = atob(CLIPS[t]); const u8 = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
        const r = ctx.decodeAudioData(u8.buffer, res, rej); if (r && r.catch) r.catch(rej);
      } catch (e) { rej(e); }
    });
    lru.set(t, p); if (lru.size > 40) lru.delete(lru.keys().next().value);
    p.catch(() => lru.delete(t));
    return p;
  }
  function stopCur() { if (cur) { const c = cur; cur = null; try { c.src.onended = null; c.src.stop(); } catch (e) { /* ignore */ } c.done(); } }
  function playClip(t, my) {
    return new Promise(res => {
      const quiet = ms => { if (my === token) busy = false; setTimeout(res, ms); };
      decode(t).then(buf => {
        if (my !== token) { res(); return; }
        const ctx = Sfx.context();
        const go = () => {
          if (my !== token) { res(); return; }
          const src = ctx.createBufferSource(); src.buffer = buf; src.connect(Sfx.voiceOut());
          const rate = window.__voiceRate || 1; if (rate !== 1) src.playbackRate.value = rate;
          let fin = false;
          const done = () => { if (fin) return; fin = true; clearTimeout(tm); if (cur && cur.src === src) cur = null; if (my === token) busy = false; res(); };
          const tm = setTimeout(done, buf.duration * 1000 / rate + 1500);
          src.onended = done; cur = { src, done };
          try { src.start(); } catch (e) { done(); }
        };
        if (ctx.state === 'running') { go(); return; }
        let started = false;
        const tryGo = () => { if (!started && ctx.state === 'running') { started = true; go(); } };
        try { const pr = ctx.resume(); if (pr && pr.then) pr.then(tryGo, () => {}); } catch (e) { /* ignore */ }
        setTimeout(() => { if (started) return; started = true; if (ctx.state === 'running') go(); else quiet(Math.min(2500, buf.duration * 1000)); }, 450);
      }, () => {
        if (my !== token) { res(); return; }
        TTS.say(t).then(() => { if (my === token) busy = false; res(); });
      });
    });
  }
  function say(t, o = {}) {
    const my = ++token; stopCur(); TTS.stop(); busy = true;
    if (window.__said) window.__said.push(t);
    if (has(t) && !S.sysVoice) return playClip(t, my);
    if (window.__missing) window.__missing.push(t);
    return TTS.say(t, o).then(() => { if (my === token) busy = false; });
  }
  function sayAll(list, o) {
    return (async () => {
      let expect = null;
      for (const t of list) {
        if (!t) continue;
        if (expect !== null && token !== expect) return;
        const pr = say(t, o); expect = token; await pr;
      }
    })();
  }
  function sayPick(list, o) { const t = (S.sysVoice ? list[0] : list.find(x => has(x))) || list[list.length - 1]; return say(t, o); }
  function stop() { token++; stopCur(); TTS.stop(); busy = false; }
  function unlock() { TTS.unlock(); }
  return { say, sayAll, sayPick, stop, unlock, has, get busy() { return busy || TTS.busy; } };
})();
const say = (t, o) => Array.isArray(t) ? Voice.sayAll(t, o) : Voice.say(t, o);
const sayPick = (list, o) => Voice.sayPick(list, o);
const hasVoice = () => !S.sysVoice || (TTS.ok && TTS.ruVoices().length > 0);

/* ---------- everything the game says ---------- */
const T = {
  newLetter: 'Новая буква!',
  matchQ: 'Найди такую же букву!',
  matchLowQ: 'Найди такую же маленькую букву!',
  yourTurn: 'Теперь ты!',
  alongPath: 'Веди пальцем по дорожке!',
  listenAgain: 'Послушай ещё!',
  final: 'Финальный бой!',
  shot3: 'Отличная стрельба!', shot2: 'Хорошо стреляешь!', shot1: 'Неплохо!',
  again1: 'Глюк снова прячет буквы! В бой!', again2: 'Миссия начинается! Вперёд!',
  win: 'Победа! Глюк убежал!', gemsLook: 'Смотри, сколько алмазов!',
  newStars: 'Новые звёзды!', threeStars: 'Ты знаешь новую букву на три звезды!',
  nextNew: 'В следующей миссии — новая буква!', buildNow: 'Пора на стройку! Жми на замок!',
  tir: 'Тир! Сбивай только нужные буквы!', tirNext: 'Следующая буква!',
  pickWrite: 'Выбери букву, которую будем писать!', abc: 'Это твоя азбука! Нажми на букву.',
  allHidden: 'Все буквы спрятаны! Нажми «Играть», чтобы их найти.',
  locked: 'Эту букву ещё прячет Глюк! Играй, и ты её найдёшь.',
  playFirst: 'Сначала нажми «Играть»!',
  build: 'Это твоя стройка! Выбери блок внизу и нажми, куда его поставить.',
  buildCost: 'Каждый блок стоит один алмаз.',
  buildHi: 'Строим!',
  buildEmpty: 'Нужны алмазы! Сыграй миссию, и будет из чего строить.',
  pick: 'Кирка! Нажми на блок, и он превратится обратно в алмаз.',
  pickShort: 'Кирка!',
  planPick: 'Что будем строить? Выбери картинку!',
  planOff: 'Строй что хочешь!',
  bonus: 'Держи десять алмазов в подарок!',
  rocketBack: 'Ракета слетала в космос и вернулась!',
  hello0: 'Привет! Злой Глюк спрятал все буквы. Вперёд! Найдём их!',
  heroTap0: 'Привет! Нажми «Играть», и пойдём искать буквы!',
  nameLetter0: 'С неё начинается твоё имя!',
  villain: 'Ха-ха! Я спрятал все буквы! Не найдёшь!',
  rateTest: 'Вот так я говорю.',
  heroes: 'Это твои герои! Выбери, кем ты будешь.',
  newHero: 'Ура! Новый герой!',
  needMore: 'Собери ещё алмазов в миссиях!',
  canBuy: 'Можно открыть нового героя!',
};
const VILLAIN = [T.villain];
const N = {
  hello: () => `Привет, ${S.name}! Злой Глюк спрятал все буквы. Вперёд, ${S.hero}! Найдём их!`,
  heroTap: () => `Привет, ${S.name}! Я ${S.hero}! Нажми «Играть», и пойдём искать буквы!`,
  fight: () => `${S.hero}, в бой!`,
  praise: () => `Молодец, ${S.name}!`,
  nameLetter: () => `С неё начинается твоё имя! ${S.name}!`,
};
const instr = c => c === 'Ъ' ? 'твёрдым знаком' : 'мягким знаком';
const P = {
  thisIs: c => isSign(c) ? `Это ${nm(c)}.` : `Это буква ${nm(c)}.`,
  nomEx: c => isSign(c) ? `${cap(nm(c))}!` : `Буква ${nm(c)}!`,
  introWords: c => { const ws = LET[c].words, st = ws.filter(w => w.i === 0).slice(0, 2); return st.length ? `${cap(nm(c))}: ${st.map(w => w.w).join(', ')}!` : `${isSign(c) ? 'Он прячется' : 'Она прячется'} в слове ${ws[0].w}!`; },
  find: (c, k) => isSign(c) ? [`Найди ${nm(c)}!`, `Где ${nm(c)}?`, `Разбей блок с ${instr(c)}!`][k] : [`Найди букву ${nm(c)}!`, `Где буква ${nm(c)}?`, `Разбей блок с буквой ${nm(c)}!`][k],
  findLow: c => isSign(c) ? `Найди маленький ${nm(c)}!` : `Найди маленькую букву ${nm(c)}!`,
  need: c => isSign(c) ? `А нам нужен ${nm(c)}.` : `А нам нужна буква ${nm(c)}.`,
  here: c => isSign(c) ? `Вот он, ${nm(c)}!` : `Вот она, буква ${nm(c)}!`,
  watch: c => `Смотри, как пишется ${nom(c)}!`,
  trace: c => `Обведи пальцем ${acc(c)}!`,
  catchIt: c => isSign(c) ? `Лови ${nm(c)}!` : `Лови букву ${nm(c)}!`,
  wordEx: w => `${cap(w.w)}!`,
  picQ: w => `${cap(w.w)}! С какой буквы начинается слово ${w.w}?`,
  picAns: (w, c) => `${cap(w.w)} начинается с буквы ${nm(c)}!`,
  plan: i => `Строим ${BP[i].acc}! Ставь блоки на подсказки.`,
  block: b => `${b.name}!`,
  heroNow: h => `Теперь ты — ${h.name}!`,
};
function allPhrases() {
  const keep = { mode: S.mode, name: S.name, hero: S.hero };
  const out = new Set(Object.values(T)); PRAISE.forEach(x => out.add(x));
  S.name = DEF().name; S.hero = DEF().hero;
  Object.values(N).forEach(f => out.add(f()));
  for (const mode of ['sound', 'alpha']) {
    S.mode = mode;
    for (const c of ALPHA) {
      ['thisIs', 'nomEx', 'introWords', 'findLow', 'need', 'here', 'watch', 'trace', 'catchIt'].forEach(k => out.add(P[k](c)));
      [0, 1, 2].forEach(k => out.add(P.find(c, k)));
      for (const w of LET[c].words) { out.add(P.wordEx(w)); if (w.i === 0) { out.add(P.picQ(w)); out.add(P.picAns(w, c)); } }
    }
  }
  BP.forEach((b, i) => { out.add(P.plan(i)); out.add(b.done); });
  BLOCKS.forEach(b => out.add(P.block(b)));
  HEROES.forEach(h => out.add(P.heroNow(h)));
  Object.assign(S, keep);
  return [...out];
}

/* ---------- 8-bit sound ---------- */
const Sfx = (() => {
  let ctx = null, master = null, noiseBuf = null;
  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
      try { ctx = new AC(); } catch (e) { return null; }
      try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* ignore */ }
      master = ctx.createGain(); master.gain.value = .3; master.connect(ctx.destination);
      noiseBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * .6), ctx.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) { /* ignore */ } }
    return ctx;
  }
  function tone(f, d, o = {}) {
    if (!S.sfx) return; const c = ensure(); if (!c) return;
    const t0 = c.currentTime + (o.at || 0), osc = c.createOscillator(), g = c.createGain();
    osc.type = o.type || 'square'; osc.frequency.setValueAtTime(f, t0); if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t0 + d);
    const v = o.v || .2; g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(v, t0 + .008); g.gain.exponentialRampToValueAtTime(.0001, t0 + d);
    osc.connect(g); g.connect(master); osc.start(t0); osc.stop(t0 + d + .03);
  }
  function noise(d, o = {}) {
    if (!S.sfx) return; const c = ensure(); if (!c) return;
    const t0 = c.currentTime + (o.at || 0), src = c.createBufferSource(); src.buffer = noiseBuf;
    const f = c.createBiquadFilter(); f.type = o.lp ? 'lowpass' : 'bandpass'; f.frequency.value = o.f || 1200; f.Q.value = o.q || .8;
    const g = c.createGain(); g.gain.setValueAtTime(o.v || .3, t0); g.gain.exponentialRampToValueAtTime(.0001, t0 + d);
    src.connect(f); f.connect(g); g.connect(master); src.start(t0); src.stop(t0 + d + .02);
  }
  let voiceGain = null;
  function voiceOut() { const c = ensure(); if (!voiceGain) { voiceGain = c.createGain(); voiceGain.gain.value = 1; voiceGain.connect(c.destination); } return voiceGain; }
  return {
    unlock: ensure, context: ensure, voiceOut,
    tap() { tone(760, .05, { v: .09 }); },
    good() { [523, 659, 784, 1047].forEach((f, i) => tone(f, .13, { at: i * .07, v: .15 })); },
    bad() { tone(220, .22, { to: 110, type: 'sawtooth', v: .13 }); },
    crack() { noise(.16, { v: .5, f: 900 }); noise(.08, { v: .3, f: 2600, at: .05 }); },
    gem() { tone(1175, .07, { v: .1, type: 'triangle' }); tone(1568, .16, { at: .07, v: .1, type: 'triangle' }); },
    zap() { tone(1500, .2, { to: 160, type: 'sawtooth', v: .11 }); },
    boom() { noise(.4, { v: .45, f: 320, lp: 1 }); tone(140, .3, { to: 40, v: .2 }); },
    place() { tone(170, .07, { v: .16 }); noise(.05, { v: .18, f: 1800 }); },
    ding() { tone(1319, .12, { v: .11, type: 'triangle' }); tone(1760, .1, { at: .06, v: .08, type: 'triangle' }); },
    fanfare() { [[523, 0], [659, .12], [784, .24], [1047, .36], [784, .52], [1047, .64]].forEach(([f, a]) => tone(f, .2, { at: a, v: .14 })); },
    whoosh() { noise(1.2, { v: .35, f: 500, q: .4 }); },
  };
})();

/* ---------- effects ---------- */
const FX = (() => {
  const cv = $('#fx'), g = cv.getContext('2d'), layer = $('#fxl');
  let parts = [], raf = 0, last = 0, dpr = 1;
  function resize() { dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = Math.round(innerWidth * dpr); cv.height = Math.round(innerHeight * dpr); }
  function tick(ts) {
    const dt = Math.min(.05, (ts - (last || ts)) / 1000); last = ts;
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, innerWidth, innerHeight);
    parts = parts.filter(p => (p.t += dt) < p.life);
    for (const p of parts) { p.vy += p.gr * dt; p.x += p.vx * dt; p.y += p.vy * dt; g.globalAlpha = clamp(1 - p.t / p.life, 0, 1); g.fillStyle = p.c; g.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s); }
    g.globalAlpha = 1;
    if (parts.length) raf = requestAnimationFrame(tick); else { raf = 0; last = 0; g.clearRect(0, 0, innerWidth, innerHeight); }
  }
  function spawn(x, y, cols, n = 22, o = {}) {
    const sp = o.speed || 1;
    for (let i = 0; i < n; i++) parts.push({ x: x + rnd(-10, 10), y: y + rnd(-10, 10), vx: rnd(-1, 1) * 300 * sp, vy: (o.up ? rnd(-1.6, -.6) : rnd(-1.3, .1)) * 340 * sp, s: rnd(6, 13) * (o.size || 1), c: pick(cols), life: rnd(.45, .9) * (o.life || 1), t: 0, gr: o.gr ?? 1100 });
    if (parts.length > 600) parts.splice(0, parts.length - 600);
    if (!raf) raf = requestAnimationFrame(tick);
  }
  function confetti() { const cols = ['#ffc62e', '#e8363f', '#2a6cf0', '#39e3dc', '#5cb84a', '#ffffff', '#8e4fe0']; for (let k = 0; k < 6; k++) spawn(innerWidth * (k + .5) / 6, innerHeight * .25, cols, 16, { speed: 1.2, up: true, gr: 700, life: 1.5 }); }
  function starPts(n, r1, r2) { const pts = []; for (let i = 0; i < n * 2; i++) { const a = Math.PI * i / n - Math.PI / 2; const r = i % 2 ? r2 * rnd(.85, 1.08) : r1 * rnd(.9, 1.04); pts.push((Math.cos(a) * r).toFixed(1) + ',' + (Math.sin(a) * r).toFixed(1)); } return pts.join(' '); }
  function burst(x, y, text, o = {}) {
    const el = document.createElement('div'); el.className = 'burst'; el.style.left = x + 'px'; el.style.top = y + 'px';
    const fs = Math.round(o.fs || 40); const w = Math.max(fs * 2.4, text.length * fs * .78 + fs);
    el.innerHTML = `<div class="burst-in" style="--rot:${(o.rot ?? rnd(-12, 12)).toFixed(1)}deg;--fs:${fs}px;--w:${Math.round(w)}px;--bf:${o.bf || '#ffffff'};--bt:${o.bt || 'var(--sun)'}"><svg viewBox="-100 -100 200 200" preserveAspectRatio="none"><polygon points="${starPts(o.n || 13, 96, 66)}"/></svg><span>${esc(text)}</span></div>`;
    layer.append(el); setTimeout(() => el.remove(), 1000);
  }
  function center(el) { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }
  function flyGem(from, n = 1) {
    const counter = visibleGemCounter(); if (!counter || !counter.getClientRects().length) { bumpGems(); return; }
    const [x0, y0] = Array.isArray(from) ? from : center(from); const [x1, y1] = center(counter.querySelector('img'));
    for (let k = 0; k < n; k++) {
      const im = new Image(); im.src = SPRU.gem; im.className = 'flygem'; layer.append(im);
      const mx = (x0 + x1) / 2 + rnd(-60, 60), my = Math.min(y0, y1) - rnd(40, 110);
      if (!im.animate) { im.remove(); bumpGems(); Sfx.gem(); continue; }
      const a = im.animate([{ transform: `translate(${x0 - 17}px,${y0 - 15}px) scale(1)` }, { transform: `translate(${mx - 17}px,${my - 15}px) scale(1.7)`, offset: .45 }, { transform: `translate(${x1 - 17}px,${y1 - 15}px) scale(.9)` }], { duration: 760, easing: 'ease-in-out', delay: k * 80, fill: 'backwards' });
      a.onfinish = () => { im.remove(); Sfx.gem(); bumpGems(); };
    }
  }
  return { resize, spawn, burst, center, flyGem, confetti };
})();

/* ---------- screens & HUD ---------- */
let CUR = 'home';
function show(name) { CUR = name; $$('.screen').forEach(s => { s.hidden = s.id !== 'scr-' + name; }); gemsText(); }
const usedBlocks = () => { const w = S.world || ''; let n = 0; for (let i = 0; i < w.length; i++) if (w[i] !== '.') n++; return n; };
const wallet = () => Math.max(0, (S.gems || 0) - (S.spent || 0) - usedBlocks());
const nextHero = () => HEROES.find(h => !owns(h.id));
const canBuyAny = () => { const h = nextHero(); return !!h && HEROES.some(x => !owns(x.id) && x.price <= wallet()); };
function gemsText() {
  $$('.gemcount b').forEach(b => { b.textContent = wallet(); });
  const t = $('#tile-heroes'); if (t) t.classList.toggle('has-new', canBuyAny());
  const r = $('#rw-heroes'); if (r) r.hidden = !canBuyAny();
  const bp = $('#build-play'); if (bp) bp.hidden = wallet() > 0;
}
function visibleGemCounter() { const scr = $(`#scr-${CUR}`); return scr ? scr.querySelector('.gemcount') : null; }
function bumpGems() { gemsText(); const c = visibleGemCounter(); if (c) { c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); } }
function addGems(n, from) { S.gems += n; save(); if (from) FX.flyGem(from, Math.min(n, 5)); else bumpGems(); }

function fitLogo() {
  const el = $('#logo-name'); if (!el) return; const txt = el.textContent || '';
  const byW = (Math.min(innerWidth, 1400) - 60) / Math.max(4, txt.length * .86);
  el.style.fontSize = Math.round(clamp(Math.min(byW, innerHeight * .12, 112), 28, 112)) + 'px';
}
function applyNames() { $('#logo-name').textContent = (S.hero || 'Супер-Герой').toUpperCase(); fitLogo(); }

/* ---------- modal ---------- */
let MODAL_CB = null;
function modal(html, cb) { const m = $('#modal'), box = $('#modal-box'); box.innerHTML = html; applySprites(box); m.hidden = false; MODAL_CB = cb || null; }
function closeModal() { $('#modal').hidden = true; MODAL_CB = null; }

/* ---------- runs (missions / free modes) ---------- */
let RUN = null, TR = null, curFit = null;
function newRun(kind) { endRun(); const run = RUN = { kind, alive: true, earned: 0, before: {}, tasks: [], i: 0, prompt: null }; ALPHA.forEach(c => { run.before[c] = lv(c); }); return run; }
function endRun() { if (RUN) RUN.alive = false; RUN = null; Voice.stop(); curFit = null; if (TR) { TR.destroy(); TR = null; } buildStop(); }
async function rs(run, text, o) { if (!run.alive) throw STOP; await say(text, o); if (!run.alive) throw STOP; }
async function rsPick(run, list) { if (!run.alive) throw STOP; await sayPick(list); if (!run.alive) throw STOP; }
async function rsleep(run, ms) { if (!run.alive) throw STOP; await sleep(ms); if (!run.alive) throw STOP; }
const stageEl = () => $('#stage');
function setStage(html) { const st = stageEl(); curFit = null; st.innerHTML = html; st.dataset.ti = RUN && RUN.i != null ? RUN.i : ''; applySprites(st); return st.firstElementChild; }
function waitClick(el) { return new Promise(r => el.addEventListener('click', () => { Sfx.tap(); r(); }, { once: true })); }

function promptHTML(text, extra = '', tools = '') {
  return `<div class="prompt"><img class="spr hero-mini" data-spr="hero" alt="" data-act="say"><div class="bubble"><span class="ptext">${text}</span>${extra}<button class="pbtn" data-act="say" aria-label="Повторить" style="--c:var(--cape)"><img class="spr" data-spr="i_sound" alt=""></button>${tools}</div></div>`;
}
function blockHTML(ch, low, tex) {
  const t = tex || pick(BLOCK_TEX);
  return `<button class="lb" data-c="${ch}" data-tex="${t}" style="--tex:url(${TEX[t].url})" aria-label="${ch}"><span class="face"><span>${low ? ch.toLowerCase() : ch}</span></span></button>`;
}
function emoHTML(w) { return w.e.charAt(0) === '#' ? `<span class="emo"><img class="spr" src="${SPRU[w.e.slice(1)]}" alt=""></span>` : `<span class="emo">${w.e}</span>`; }
function wordHTML(w, c, hide) {
  const W = w.w.toUpperCase();
  if (w.i < 0) return esc(W);
  return esc(W.slice(0, w.i)) + (hide ? '<span class="q">?</span>' : `<b>${W[w.i]}</b>`) + esc(W.slice(w.i + 1));
}
function fitOpts(box, n, maxBs = 200) {
  const W = box.clientWidth, H = box.clientHeight; if (!W || !H) return;
  const gap = clamp(Math.round(Math.min(W, H) * .05), 12, 30);
  let best = 0, bc = n;
  for (let cols = 1; cols <= n; cols++) { const rows = Math.ceil(n / cols); const s = Math.min((W - gap * (cols - 1) - 10) / cols, (H - gap * (rows - 1) - 10) / rows); if (s > best + .5) { best = s; bc = cols; } }
  const bs = Math.floor(clamp(best - 8, 58, maxBs));
  box.style.setProperty('--bs', bs + 'px'); box.style.setProperty('--gap', gap + 'px'); box.style.gridTemplateColumns = `repeat(${bc}, ${bs}px)`;
}
function distractors(c, n, L) {
  const sim = SIMILAR[c] || [];
  const out = L >= 2 ? shuffle(sim).slice(0, L >= 3 ? 2 : 1) : [];
  const ok = x => x !== c && !out.includes(x) && (L >= 2 || !sim.includes(x));
  const known = shuffle(unlocked().filter(ok));
  const half = Math.ceil(n / 2) + (L >= 2 ? 1 : 0);
  while (out.length < n && known.length && out.length < half) out.push(known.pop());
  const rest = shuffle(ALPHA.filter(ok));
  while (out.length < n && rest.length) out.push(rest.pop());
  return out.slice(0, n);
}
const PRAISE = ['Молодец!', 'Супер!', 'Ура!', 'Класс!', 'Здорово!', 'Вот это да!', 'Точно!', 'Ты супергерой!', 'Правильно!', 'Отлично!'];
const praise = () => (S.name && Math.random() < .3 && (S.sysVoice || Voice.has(N.praise()))) ? N.praise() : pick(PRAISE);
const BOOM = ['БАМ!', 'БУМ!', 'БАЦ!', 'ВЖУХ!', 'ПЫЩ!', 'ХРЯСЬ!', 'ТЫДЫЩ!', 'ДЗЫНЬ!', 'ПОУ!'];

async function breakBlock(b) {
  Sfx.crack();
  const cr = document.createElement('span'); cr.className = 'crack'; b.append(cr);
  for (let k = 0; k < 3; k++) { cr.style.backgroundImage = `url(${CRACK[k]})`; await sleep(55); }
  const [x, y] = FX.center(b); const t = TEX[b.dataset.tex];
  FX.spawn(x, y, (t ? t.cols : []).concat(['#fff4d6', '#1b1530']), 26);
  FX.burst(x, y - b.offsetHeight * .55, pick(BOOM), { fs: clamp(b.offsetWidth * .26, 26, 52) });
  Sfx.good();
  b.classList.add('gone');
  await sleep(260);
}

function choiceRound(run, o) {
  return new Promise(resolve => {
    const box = o.box, texs = shuffle(BLOCK_TEX);
    box.innerHTML = o.letters.map((ch, i) => blockHTML(ch, o.low, texs[i % texs.length])).join('');
    curFit = () => fitOpts(box, o.letters.length, o.maxBs || 200); curFit();
    let wrong = 0, done = false, lastAct = Date.now(), nags = 0;
    const idle = setInterval(() => {
      if (done || !run.alive || !box.isConnected) { clearInterval(idle); return; }
      if (!Voice.busy && Date.now() - lastAct > 13000 && nags < 3) { lastAct = Date.now(); nags++; if (run.prompt) run.prompt(); }
    }, 1000);
    box.addEventListener('click', async e => {
      lastAct = Date.now();
      const b = e.target.closest('.lb'); if (!b || done || !run.alive || b.classList.contains('dead')) return;
      const ch = b.dataset.c;
      if (ch === o.target) {
        done = true; clearInterval(idle); $$('.lb', box).forEach(x => x.classList.remove('hint'));
        await breakBlock(b);
        addGems(1, b); run.earned++;
        resolve({ first: wrong === 0, wrong });
      } else {
        wrong++; Sfx.bad(); b.classList.add('shake'); setTimeout(() => b.classList.add('dead'), 400);
        if (wrong >= 2) { const t = box.querySelector(`.lb[data-c="${o.target}"]`); if (t) t.classList.add('hint'); }
        say(o.wrongSay ? o.wrongSay(ch, wrong) : [P.thisIs(ch), wrong >= 2 ? P.here(o.target) : P.need(o.target)]);
      }
    });
  });
}

/* ---------- tasks ---------- */
async function tIntro(t, run) {
  const c = t.c, D = LET[c], ws = D.words.slice(0, 3);
  const root = setStage(`<div class="task intro"><div class="banner">НОВАЯ БУКВА!</div><div class="intro-main"><button class="bigletter ${D.type}" data-act="letter" aria-label="${c}"><span>${c}</span>${S.lower ? `<span class="low">${c.toLowerCase()}</span>` : ''}</button><div class="pics">${ws.map((w, i) => `<button class="pic" data-w="${i}">${emoHTML(w)}<span class="word">${wordHTML(w, c)}</span></button>`).join('')}</div></div><button class="pbtn big next" hidden style="--c:var(--good)"><img class="spr" data-spr="i_play" alt=""><span>Дальше</span></button></div>`);
  Sfx.fanfare();
  const big = $('.bigletter', root); const [x, y] = FX.center(big); FX.spawn(x, y, ['#ffc62e', '#e8363f', '#2a6cf0', '#39e3dc', '#ffffff'], 40, { speed: 1.3 });
  root.addEventListener('click', e => {
    if (!run.alive) return;
    if (e.target.closest('[data-act=letter]')) { big.animate && big.animate([{ scale: 1 }, { scale: 1.08 }, { scale: 1 }], { duration: 300 }); say(P.nomEx(c)); return; }
    const p = e.target.closest('.pic'); if (p) { const w = ws[+p.dataset.w]; say(P.wordEx(w)); }
  });
  const intro = async () => {
    await rs(run, T.newLetter);
    await rs(run, P.thisIs(c));
    const first = (S.name || '').trim().charAt(0).toUpperCase();
    if (S.name && first === c) await rsPick(run, [N.nameLetter(), T.nameLetter0]);
    await rs(run, P.introWords(c));
  };
  run.prompt = () => intro().catch(() => {});
  await intro();
  const nx = $('.next', root); nx.hidden = false; nx.classList.add('pulse');
  await waitClick(nx);
  if (!run.alive) throw STOP;
  S.L[c].intro = 1; save();
}

async function tMatch(t, run) {
  const c = t.c, L = lv(c);
  const low = S.lower && L >= 2;
  const letters = shuffle([c, ...distractors(c, (L === 0 ? 3 : 4) - 1, Math.min(L, 1))]);
  const root = setStage(`<div class="task match">${promptHTML(low ? 'Найди такую же маленькую' : 'Найди такую же')}<div class="sample">${blockHTML(c, false, 'gold')}</div><div class="opts"></div></div>`);
  const sample = $('.sample .lb', root); sample.tabIndex = -1;
  sample.addEventListener('click', () => say(P.nomEx(c)));
  run.prompt = () => say([low ? T.matchLowQ : T.matchQ, P.thisIs(c)]);
  run.prompt();
  const r = await choiceRound(run, { target: c, letters, low, box: $('.opts', root), maxBs: 170 });
  if (!run.alive) throw STOP;
  record(c, r.first, 'match');
  await rs(run, [praise(), P.nomEx(c)]);
}

async function tFind(t, run) {
  const c = t.c, L = lv(c);
  const n = [3, 4, 4, 6][L];
  const low = S.lower && L >= 2 && Math.random() < .45;
  const letters = shuffle([c, ...distractors(c, n - 1, L)]);
  const visual = !hasVoice();
  const extra = visual ? `<span class="tgt">${low ? c.toLowerCase() : c}</span>` : '';
  const root = setStage(`<div class="task find">${promptHTML(isSign(c) ? 'Найди знак' : low ? 'Найди маленькую букву' : 'Найди букву', extra)}<div class="opts"></div></div>`);
  const phr = low ? P.findLow(c) : P.find(c, ri(0, 2));
  run.prompt = () => say(phr);
  run.prompt();
  const r = await choiceRound(run, { target: c, letters, low, box: $('.opts', root) });
  if (!run.alive) throw STOP;
  record(c, r.first, 'find');
  await rs(run, [praise(), P.nomEx(c)]);
}

async function tPic(t, run) {
  const c = t.c, L = lv(c);
  const w = pick(LET[c].words.filter(x => x.i === 0));
  const letters = shuffle([c, ...distractors(c, (L >= 2 ? 4 : 3) - 1, Math.min(L, 1))]);
  const root = setStage(`<div class="task picq">${promptHTML('С какой буквы?')}<div class="pic-body"><div class="pic-row"><button class="pic-card" data-act="say">${emoHTML(w)}<span class="word">${wordHTML(w, c, true)}</span></button></div><div class="opts"></div></div></div>`);
  run.prompt = () => say(P.picQ(w));
  run.prompt();
  const r = await choiceRound(run, {
    target: c, letters, box: $('.opts', root), maxBs: 170,
    wrongSay: (ch, k) => k >= 2 ? [P.thisIs(ch), P.picAns(w, c)] : [P.thisIs(ch), T.listenAgain, P.wordEx(w)],
  });
  if (!run.alive) throw STOP;
  $('.pic-card .word', root).innerHTML = wordHTML(w, c);
  record(c, r.first, 'find');
  await rs(run, [praise(), P.picAns(w, c)]);
}

async function tTrace(t, run) {
  const c = t.c;
  const tools = `<button class="pbtn" data-act="demo" aria-label="Показать" style="--c:var(--sun)"><img class="spr" data-spr="i_eye" alt=""></button><button class="pbtn" data-act="clear" aria-label="Заново" style="--c:var(--grass)"><img class="spr" data-spr="i_reset" alt=""></button>`;
  const root = setStage(`<div class="task trace">${promptHTML(isSign(c) ? 'Обведи знак' : 'Обведи букву', `<span class="tgt">${c}</span>`, tools)}<div class="trace-wrap"><canvas class="trace-cv"></canvas></div></div>`);
  let resolveDone; const done = new Promise(r => { resolveDone = r; });
  if (TR) TR.destroy();
  TR = new Tracer($('.trace-cv', root), $('.trace-wrap', root), c, { onDone: () => resolveDone() });
  const tr = TR;
  root.addEventListener('click', e => {
    const a = e.target.closest('[data-act]'); if (!a || !run.alive) return;
    if (a.dataset.act === 'demo') { Sfx.tap(); tr.reset(); tr.demo(); say(P.watch(c)); }
    if (a.dataset.act === 'clear') { Sfx.tap(); tr.reset(); }
  });
  run.prompt = () => say(P.trace(c));
  let nags = 0;
  const idle = setInterval(() => {
    if (tr.dead || tr.finished || !run.alive) { clearInterval(idle); return; }
    if (!Voice.busy && !tr.demoS && !tr.drawing && performance.now() - tr.lastTouch > 15000 && nags < 3) { tr.lastTouch = performance.now(); nags++; run.prompt(); }
  }, 1000);
  await Promise.all([rs(run, P.watch(c)), tr.demo()]);
  if (!tr.finished) await rs(run, [T.yourTurn, P.trace(c)]);
  await done;
  if (!run.alive) throw STOP;
  const [x, y] = FX.center(tr.cv); FX.spawn(x, y, ['#ffc62e', '#e8363f', '#2a6cf0', '#39e3dc'], 44, { speed: 1.4 });
  FX.burst(x, y - tr.cv.offsetHeight * .3, 'СУПЕР!', { fs: 50 }); Sfx.good();
  addGems(1, tr.cv); run.earned++;
  record(c, true, 'trace');
  await rs(run, [praise(), P.thisIs(c)]);
  tr.destroy(); if (TR === tr) TR = null;
}

function arcadeRound(run, target, o = {}) {
  const need = o.need || 6, T = o.time || 30;
  const pool = (o.pool || unlocked()).filter(x => x !== target);
  const others = pool.length >= 2 ? pool : ALPHA.filter(x => x !== target && !(SIMILAR[target] || []).includes(x));
  const root = setStage(`<div class="task arcade"><div class="arc-top">${promptHTML(isSign(target) ? 'Лови' : 'Лови букву', `<span class="tgt">${target}</span>`)}<div class="timer"><i></i></div><div class="stars">${Array.from({ length: need }, () => sprImg('star')).join('')}</div></div><div class="arena"><svg class="zaps"></svg>${sprImg('hero', 'arc-hero')}</div></div>`);
  const arena = $('.arena', root), svg = $('.zaps', root), bar = $('.timer i', root), stars = $$('.stars img', root), hero = $('.arc-hero', root);
  run.prompt = () => say(P.catchIt(target));
  return new Promise(resolve => {
    let hits = 0, el = 0, last = 0, spawnT = .2, lastTarget = -9, alive = true, raf = 0, nagT = 0;
    const drones = [];
    const W = () => arena.clientWidth, H = () => arena.clientHeight;
    function spawn(isT) {
      const ch = isT ? target : pick(others);
      const d = document.createElement('div'); d.className = 'drone';
      const tex = pick(BLOCK_TEX); d.innerHTML = blockHTML(ch, false, tex);
      arena.append(d);
      const size = d.offsetWidth || 100, fromLeft = Math.random() < .5;
      const o2 = { el: d, ch, tex, size, x: fromLeft ? -size - 10 : W() + 10, y0: rnd(H() * .1, Math.max(H() * .1 + 1, H() - size - 30)), vx: (fromLeft ? 1 : -1) * rnd(.11, .18) * Math.max(W(), 500), ph: rnd(0, 6.3), amp: rnd(8, 24), dead: false };
      if (isT) lastTarget = el;
      d.style.transform = `translate(${o2.x}px,${o2.y0}px)`;
      d.addEventListener('pointerdown', ev => { ev.preventDefault(); tap(o2); });
      drones.push(o2);
    }
    function frame(ts) {
      if (!alive) return;
      if (!run.alive) { stopAll(); return; }
      const dt = Math.min(.05, (ts - (last || ts)) / 1000); last = ts; el += dt; spawnT -= dt; nagT += dt;
      const live = drones.filter(d => !d.dead);
      const hasT = live.some(d => d.ch === target);
      if (live.length < 6 && (spawnT <= 0 || (!hasT && el - lastTarget > 1.4))) { spawn(!hasT || Math.random() < .42); spawnT = rnd(.85, 1.3); }
      for (const d of drones) {
        if (d.dead) continue;
        d.x += d.vx * dt; const y = d.y0 + Math.sin(el * 2.2 + d.ph) * d.amp;
        d.el.style.transform = `translate(${d.x.toFixed(1)}px,${y.toFixed(1)}px)`;
        if ((d.vx > 0 && d.x > W() + 20) || (d.vx < 0 && d.x < -d.size - 20)) { d.dead = true; d.el.remove(); }
      }
      for (let i = drones.length - 1; i >= 0; i--) if (drones[i].dead && !drones[i].el.isConnected) drones.splice(i, 1);
      bar.style.transform = `scaleX(${Math.max(0, 1 - el / T).toFixed(3)})`;
      if (nagT > 9 && !Voice.busy) { nagT = 0; run.prompt(); }
      if (el >= T) { finish(); return; }
      raf = requestAnimationFrame(frame);
    }
    function zap(x, y) {
      const hr = hero.getBoundingClientRect(), ar = arena.getBoundingClientRect();
      const x0 = hr.left - ar.left + hr.width * .78, y0 = hr.top - ar.top + hr.height * .42;
      const ns = 'http://www.w3.org/2000/svg';
      const mk = (col, w) => { const l = document.createElementNS(ns, 'line'); l.setAttribute('x1', x0); l.setAttribute('y1', y0); l.setAttribute('x2', x); l.setAttribute('y2', y); l.setAttribute('stroke', col); l.setAttribute('stroke-width', w); svg.append(l); return l; };
      const ls = [mk('#1b1530', 14), mk('#ffc62e', 7), mk('#ffffff', 2)];
      setTimeout(() => ls.forEach(l => l.remove()), 170);
    }
    function tap(d) {
      if (d.dead || !alive) return;
      if (d.ch === target) {
        d.dead = true; hits++; nagT = 0;
        const r = d.el.getBoundingClientRect(), ar = arena.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        zap(cx - ar.left, cy - ar.top); Sfx.zap(); setTimeout(() => Sfx.crack(), 60);
        FX.spawn(cx, cy, TEX[d.tex].cols.concat(['#ffc62e', '#ffffff']), 24);
        FX.burst(cx, cy - 40, pick(['ПИУ!', 'БАМ!', 'ВЖУХ!', 'ПЫЩ!', 'БАЦ!']), { fs: 32 });
        d.el.remove();
        if (stars[hits - 1]) stars[hits - 1].classList.add('on');
        addGems(1, [cx, cy]); run.earned++;
        if (hits >= need) { alive = false; cancelAnimationFrame(raf); setTimeout(() => { drones.forEach(x => x.el.remove()); resolve(hits); }, 500); }
      } else {
        Sfx.bad(); d.el.classList.remove('nope'); void d.el.offsetWidth; d.el.classList.add('nope');
        if (!Voice.busy) say(P.thisIs(d.ch));
      }
    }
    function stopAll() { alive = false; cancelAnimationFrame(raf); drones.forEach(d => d.el.remove()); }
    function finish() { if (!alive) return; stopAll(); resolve(hits); }
    run.prompt();
    raf = requestAnimationFrame(frame);
  });
}

async function tArcade(t, run) {
  const hits = await arcadeRound(run, t.c, { need: 6, time: 30 });
  if (!run.alive) throw STOP;
  boost(t.c, Math.min(10, hits * 2));
  await rs(run, hits >= 6 ? T.shot3 : hits >= 3 ? T.shot2 : T.shot1);
}

const TASKS = { intro: tIntro, match: tMatch, find: tFind, pic: tPic, trace: tTrace, arcade: tArcade };

/* ---------- mission planning ---------- */
function pickLetter(pool, avoid, fresh) {
  const now = Date.now();
  const ws = pool.map(c => {
    const d = S.L[c]; let w = 1 + (100 - d.sc) / 22;
    if (fresh.includes(c)) w += 2.5;
    w += Math.min(2.5, (d.t ? (now - d.t) / 3600000 : 48) / 24);
    if (c === avoid && pool.length > 1) w = .01;
    return w;
  });
  let r = Math.random() * ws.reduce((a, b) => a + b, 0);
  for (let i = 0; i < pool.length; i++) { r -= ws[i]; if (r <= 0) return pool[i]; }
  return pool[pool.length - 1];
}
function planMission() {
  const tasks = [];
  if (!unlocked().length) { order().slice(0, 2).forEach(c => { S.L[c].u = 1; }); save(); }
  else if (!unlocked().some(c => !S.L[c].intro) && canUnlock()) { const nx = nextLocked(); if (nx) { S.L[nx].u = 1; save(); } }
  const fresh = unlocked().filter(c => !S.L[c].intro).slice(0, 2);
  fresh.forEach((c, k) => { tasks.push({ t: 'intro', c }, { t: 'match', c }); if (k === fresh.length - 1) tasks.push({ t: 'trace', c }); });
  const pool = unlocked();
  const practice = Math.max(4, (S.len || 8) - tasks.length);
  let traced = tasks.some(x => x.t === 'trace'), last = fresh[fresh.length - 1] || null;
  for (let k = 0; k < practice; k++) {
    const c = pickLetter(pool, last, fresh); last = c;
    const L = lv(c); let t;
    if (!traced && k === Math.floor(practice / 2)) { t = 'trace'; traced = true; }
    else if (L === 0) t = pick(['match', 'find', 'find']);
    else t = hasPic(c) ? pick(L === 1 ? ['find', 'find', 'pic'] : ['find', 'pic', 'find']) : 'find';
    tasks.push({ t, c });
  }
  const weak = pool.slice().sort((a, b) => S.L[a].sc - S.L[b].sc);
  tasks.push({ t: 'arcade', c: pick(weak.slice(0, Math.min(3, weak.length))) });
  return tasks;
}

function renderHP(run) { $('#hp').innerHTML = run.tasks.map(() => '<i></i>').join(''); }
function hitBoss(run) {
  const segs = $$('#hp i'); const s = segs[run.i]; if (s) s.classList.add('off');
  const b = $('#boss-img'); b.classList.remove('hit'); void b.offsetWidth; b.classList.add('hit');
}

async function startMission() {
  closeModal();
  const run = newRun('mission');
  run.tasks = planMission();
  show('game'); $('#boss').hidden = false; $('#free-title').hidden = true;
  renderHP(run);
  try {
    if (S.missions === 0) await rsPick(run, [S.name ? N.hello() : T.hello0, T.hello0]);
    else await rsPick(run, [pick([T.again1, T.again2, N.fight()]), T.again2]);
    for (run.i = 0; run.i < run.tasks.length; run.i++) {
      const t = run.tasks[run.i];
      if (t.t === 'arcade') { setStage(`<div class="task splash"><div class="banner">ФИНАЛЬНЫЙ БОЙ!</div>${sprImg('glitch', 'boss-big glitchy')}</div>`); Sfx.boom(); await rs(run, T.final); }
      await TASKS[t.t](t, run);
      if (!run.alive) return;
      hitBoss(run); Sfx.boom();
      await rsleep(run, 450);
    }
    await finishMission(run);
  } catch (e) { if (e !== STOP) console.error(e); }
}

function slotHTML(c, up) {
  const d = S.L[c], L = lv(c);
  if (!d.u) return `<button class="slot locked" data-c="${c}" aria-label="Закрытая буква">${sprImg('i_lock', 'lock')}</button>`;
  return `<button class="slot ${LET[c].type} lv${L}${up ? ' up' : ''}" data-c="${c}" aria-label="${c}"><span class="ch">${c}</span><span class="st">${[1, 2, 3].map(k => sprImg('star', k <= L ? 'on' : '')).join('')}</span></button>`;
}

async function finishMission(run) {
  S.missions++; save();
  show('reward');
  const practiced = [...new Set(run.tasks.map(t => t.c))];
  const ups = practiced.filter(c => lv(c) > (run.before[c] || 0));
  $('#rw-n').textContent = '+' + run.earned;
  $('#rw-title').textContent = pick(['ПОБЕДА!', 'УРА!', 'СУПЕР!']);
  $('#rw-letters').innerHTML = practiced.map(c => slotHTML(c, ups.includes(c))).join('');
  Sfx.fanfare(); FX.confetti();
  await rs(run, [T.win, T.gemsLook]);
  const top = ups.filter(c => lv(c) === 3);
  if (top.length) await rs(run, T.threeStars);
  else if (ups.length) await rs(run, T.newStars);
  if (canUnlock() && nextLocked()) await rs(run, T.nextNew);
  if (canBuyAny()) await rs(run, T.canBuy);
  await rs(run, T.buildNow);
}

/* ---------- tracer ---------- */
function resample(pts, step) {
  if (pts.length === 1) return [{ x: pts[0].x, y: pts[0].y }];
  const out = [{ x: pts[0].x, y: pts[0].y }]; let carry = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], L = Math.hypot(b.x - a.x, b.y - a.y); if (!L) continue;
    let d = step - carry;
    while (d <= L) { out.push({ x: a.x + (b.x - a.x) * d / L, y: a.y + (b.y - a.y) * d / L }); d += step; }
    carry = L - (d - step);
  }
  const last = pts[pts.length - 1], lo = out[out.length - 1];
  if (Math.hypot(last.x - lo.x, last.y - lo.y) > step * .3) out.push({ x: last.x, y: last.y });
  return out;
}
class Tracer {
  constructor(cv, wrap, c, o) {
    this.cv = cv; this.wrap = wrap; this.c = c; this.o = o || {}; this.g = cv.getContext('2d');
    const strokes = STROKES[c].map(s => s.map(p => ({ x: p[0], y: p[1] })));
    let x0 = 1e9, y0 = 0, x1 = -1e9, y1 = 100;
    strokes.flat().forEach(p => { x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y); });
    this.bb = { x0, y0, x1, y1 };
    this.cps = strokes.map(s => resample(s, 3).map(p => ({ x: p.x, y: p.y, hit: false })));
    this.done = this.cps.map(() => false);
    this.trail = []; this.drawing = false; this.demoS = null; this.finished = false; this.dead = false; this.off = 0; this.lastNag = 0; this.lastTouch = performance.now();
    this.onDown = this.onDown.bind(this); this.onMove = this.onMove.bind(this); this.onUp = this.onUp.bind(this); this.loop = this.loop.bind(this);
    cv.addEventListener('pointerdown', this.onDown); cv.addEventListener('pointermove', this.onMove);
    window.addEventListener('pointerup', this.onUp); window.addEventListener('pointercancel', this.onUp);
    this.layout();
    this.raf = requestAnimationFrame(this.loop);
  }
  layout() {
    const W = this.wrap.clientWidth, H = this.wrap.clientHeight; if (!W || !H) return;
    const h = Math.max(150, H - 14), w = Math.max(150, Math.min(W - 14, h * 1.5));
    const dpr = this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.cw = w; this.ch = h;
    this.cv.style.width = w + 'px'; this.cv.style.height = h + 'px'; this.cv.width = Math.round(w * dpr); this.cv.height = Math.round(h * dpr);
    const bw = this.bb.x1 - this.bb.x0, bh = this.bb.y1 - this.bb.y0;
    this.sc = Math.min((w * .8) / bw, (h * .76) / bh);
    this.ox = (w - bw * this.sc) / 2 - this.bb.x0 * this.sc; this.oy = (h - bh * this.sc) / 2 - this.bb.y0 * this.sc;
    this.tw = Math.max(24, 15 * this.sc); this.R = Math.max(24, this.tw * .95);
    this.cps.forEach(s => s.forEach(p => { p.sx = p.x * this.sc + this.ox; p.sy = p.y * this.sc + this.oy; }));
  }
  reset() { this.cps.forEach(s => s.forEach(p => { p.hit = false; })); this.done = this.cps.map(() => false); this.finished = false; this.trail = []; this.off = 0; }
  demo() {
    if (this.demoS && this.demoS.res) this.demoS.res();
    return new Promise(res => { this.demoS = { si: 0, t0: performance.now() + 250, k: 0, res }; });
  }
  stopDemo() { if (this.demoS) { const r = this.demoS.res; this.demoS = null; r && r(); } }
  plen(s) { let L = 0; for (let i = 1; i < s.length; i++) L += Math.hypot(s[i].sx - s[i - 1].sx, s[i].sy - s[i - 1].sy); return L; }
  stepDemo(ts) {
    const D = this.demoS; const s = this.cps[D.si];
    const dur = s.length === 1 ? 350 : Math.max(500, this.plen(s) * 3.4);
    D.k = clamp((ts - D.t0) / dur, 0, 1);
    if (D.k >= 1) { D.si++; D.t0 = ts + 220; D.k = 0; if (D.si >= this.cps.length) this.stopDemo(); }
  }
  pathOf(s, upto) {
    const g = this.g; g.beginPath(); g.moveTo(s[0].sx, s[0].sy);
    if (upto === undefined) { for (let i = 1; i < s.length; i++) g.lineTo(s[i].sx, s[i].sy); return { x: s[s.length - 1].sx, y: s[s.length - 1].sy }; }
    const total = this.plen(s) * upto; let acc = 0, hx = s[0].sx, hy = s[0].sy;
    for (let i = 1; i < s.length; i++) {
      const seg = Math.hypot(s[i].sx - s[i - 1].sx, s[i].sy - s[i - 1].sy);
      if (acc + seg >= total) { const f = seg ? (total - acc) / seg : 0; hx = s[i - 1].sx + (s[i].sx - s[i - 1].sx) * f; hy = s[i - 1].sy + (s[i].sy - s[i - 1].sy) * f; g.lineTo(hx, hy); return { x: hx, y: hy }; }
      acc += seg; g.lineTo(s[i].sx, s[i].sy); hx = s[i].sx; hy = s[i].sy;
    }
    return { x: hx, y: hy };
  }
  draw() {
    const g = this.g, d = this.dpr; if (!this.cw) return;
    g.setTransform(d, 0, 0, d, 0, 0); g.clearRect(0, 0, this.cw, this.ch);
    // notebook squares
    const cell = Math.max(12, this.sc * 12.5);
    g.strokeStyle = '#dde9f9'; g.lineWidth = 1; g.beginPath();
    for (let x = ((this.ox % cell) + cell) % cell; x < this.cw; x += cell) { g.moveTo(Math.round(x) + .5, 0); g.lineTo(Math.round(x) + .5, this.ch); }
    for (let y = ((this.oy % cell) + cell) % cell; y < this.ch; y += cell) { g.moveTo(0, Math.round(y) + .5); g.lineTo(this.cw, Math.round(y) + .5); }
    g.stroke();
    g.strokeStyle = '#a9c6ee'; g.lineWidth = 2;
    [0, 100].forEach(v => { const y = Math.round(v * this.sc + this.oy) + .5; g.beginPath(); g.moveTo(0, y); g.lineTo(this.cw, y); g.stroke(); });
    g.strokeStyle = '#f1a7a7'; g.beginPath(); g.moveTo(Math.round(this.cw * .05) + .5, 0); g.lineTo(Math.round(this.cw * .05) + .5, this.ch); g.stroke();
    g.lineCap = 'round'; g.lineJoin = 'round';
    const dotR = this.tw * .6;
    // track outline, then fill
    this.cps.forEach(s => { if (s.length === 1) { g.fillStyle = '#1b1530'; g.beginPath(); g.arc(s[0].sx, s[0].sy, dotR + 3, 0, 7); g.fill(); return; } this.pathOf(s); g.strokeStyle = '#1b1530'; g.lineWidth = this.tw + 6; g.stroke(); });
    this.cps.forEach(s => { if (s.length === 1) { g.fillStyle = '#eef3fb'; g.beginPath(); g.arc(s[0].sx, s[0].sy, dotR, 0, 7); g.fill(); return; } this.pathOf(s); g.strokeStyle = '#eef3fb'; g.lineWidth = this.tw; g.stroke(); });
    // dashed guide
    g.setLineDash([2, 11]); g.strokeStyle = '#8f9bb3'; g.lineWidth = 3;
    this.cps.forEach((s, i) => { if (this.done[i] || s.length === 1) return; this.pathOf(s); g.stroke(); });
    g.setLineDash([]);
    // painted progress
    g.strokeStyle = '#e8363f'; g.fillStyle = '#e8363f'; g.lineWidth = this.tw * .74;
    this.cps.forEach(s => {
      if (s.length === 1) { if (s[0].hit) { g.beginPath(); g.arc(s[0].sx, s[0].sy, dotR * .78, 0, 7); g.fill(); } return; }
      g.beginPath(); let on = false;
      for (let k = 0; k < s.length; k++) { const p = s[k]; if (p.hit) { if (!on) { g.moveTo(p.sx, p.sy); g.lineTo(p.sx + .01, p.sy); on = true; } else g.lineTo(p.sx, p.sy); } else on = false; }
      g.stroke();
    });
    // demo
    if (this.demoS) {
      const D = this.demoS; let head = null;
      g.strokeStyle = 'rgba(42,108,240,.85)'; g.fillStyle = 'rgba(42,108,240,.85)'; g.lineWidth = this.tw * .5;
      for (let i = 0; i <= Math.min(D.si, this.cps.length - 1); i++) {
        const s = this.cps[i];
        if (s.length === 1) { if (i < D.si || D.k > 0) { g.beginPath(); g.arc(s[0].sx, s[0].sy, dotR * .6, 0, 7); g.fill(); head = { x: s[0].sx, y: s[0].sy }; } continue; }
        head = this.pathOf(s, i < D.si ? 1 : D.k); g.stroke();
      }
      if (head) { const sz = this.tw * 1.5; g.imageSmoothingEnabled = false; g.drawImage(SPRC.star, head.x - sz / 2, head.y - sz / 2, sz, sz * 9 / 11); }
    } else {
      // start marker of next stroke
      const ni = this.done.indexOf(false);
      if (ni >= 0) {
        const s = this.cps[ni], p = s[0], pulse = 1 + Math.sin(performance.now() / 170) * .12;
        if (s.length > 1) {
          const q = s[Math.min(5, s.length - 1)]; const dx = q.sx - p.sx, dy = q.sy - p.sy, L = Math.hypot(dx, dy) || 1; const ux = dx / L, uy = dy / L;
          const ax = p.sx + ux * this.tw * 1.25, ay = p.sy + uy * this.tw * 1.25, a = this.tw * .42;
          g.fillStyle = '#2fa84f'; g.strokeStyle = '#1b1530'; g.lineWidth = 3; g.beginPath();
          g.moveTo(ax + ux * a, ay + uy * a); g.lineTo(ax - ux * a * .6 - uy * a, ay - uy * a * .6 + ux * a); g.lineTo(ax - ux * a * .6 + uy * a, ay - uy * a * .6 - ux * a); g.closePath(); g.fill(); g.stroke();
        }
        g.fillStyle = '#2fa84f'; g.strokeStyle = '#1b1530'; g.lineWidth = 3; g.beginPath(); g.arc(p.sx, p.sy, this.tw * .52 * pulse, 0, 7); g.fill(); g.stroke();
        g.fillStyle = '#ffffff'; g.font = `700 ${Math.round(this.tw * .55)}px Rubik, Arial, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(ni + 1), p.sx, p.sy + 1);
      }
    }
    // finger trail
    if (this.trail.length > 1) {
      g.strokeStyle = 'rgba(255,198,46,.95)'; g.lineWidth = Math.max(8, this.tw * .3); g.beginPath();
      this.trail.forEach((p, i) => i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)); g.stroke();
    }
  }
  loop(ts) {
    if (this.dead) return;
    if (this.demoS) this.stepDemo(ts);
    if (!this.drawing && this.trail.length) this.trail.splice(0, Math.max(1, Math.ceil(this.trail.length / 5)));
    this.draw();
    this.raf = requestAnimationFrame(this.loop);
  }
  pos(e) { const r = this.cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  onDown(e) {
    if (this.finished || this.dead) return; e.preventDefault();
    try { this.cv.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
    this.drawing = true; this.pid = e.pointerId; this.stopDemo(); this.lastTouch = performance.now();
    const p = this.pos(e); this.last = p; this.trail = [p]; this.hitAt(p);
  }
  onMove(e) {
    if (!this.drawing || e.pointerId !== this.pid) return; e.preventDefault();
    const p = this.pos(e), L = this.last, dist = Math.hypot(p.x - L.x, p.y - L.y), steps = Math.max(1, Math.ceil(dist / 5));
    for (let k = 1; k <= steps; k++) this.hitAt({ x: L.x + (p.x - L.x) * k / steps, y: L.y + (p.y - L.y) * k / steps });
    this.last = p; this.lastTouch = performance.now(); this.trail.push(p); if (this.trail.length > 60) this.trail.shift();
  }
  onUp(e) {
    if (!this.drawing || (e && e.pointerId !== undefined && e.pointerId !== this.pid)) return;
    this.drawing = false;
    if (!this.finished && this.off > 500 && performance.now() - this.lastNag > 7000) { this.lastNag = performance.now(); this.off = 0; say(T.alongPath); }
  }
  hitAt(p) {
    if (this.finished) return;
    let near = false;
    this.cps.forEach((s, i) => {
      if (this.done[i]) return;
      const R = s.length === 1 ? this.tw * .8 : this.R;
      for (const q of s) if (Math.hypot(q.sx - p.x, q.sy - p.y) < R) { q.hit = true; near = true; }
    });
    if (!near) this.off += 5;
    this.cps.forEach((s, i) => {
      if (this.done[i]) return;
      const h = s.reduce((a, q) => a + (q.hit ? 1 : 0), 0);
      if (h / s.length >= (s.length === 1 ? 1 : .86)) {
        this.done[i] = true; s.forEach(q => { q.hit = true; }); Sfx.ding();
        const e = s[s.length - 1], r = this.cv.getBoundingClientRect(); FX.spawn(r.left + e.sx, r.top + e.sy, ['#ffc62e', '#e8363f', '#ffffff'], 12, { speed: .6 });
      }
    });
    if (!this.finished && this.done.every(Boolean)) { this.finished = true; this.drawing = false; setTimeout(() => { if (!this.dead && this.o.onDone) this.o.onDone(); }, 280); }
  }
  destroy() {
    this.dead = true; cancelAnimationFrame(this.raf); this.stopDemo();
    this.cv.removeEventListener('pointerdown', this.onDown); this.cv.removeEventListener('pointermove', this.onMove);
    window.removeEventListener('pointerup', this.onUp); window.removeEventListener('pointercancel', this.onUp);
  }
}

/* ---------- free modes ---------- */
function freeHUD(title) { $('#boss').hidden = true; const ft = $('#free-title'); ft.hidden = false; ft.textContent = title; }
function afterPanel(btns) {
  const st = stageEl(); curFit = null;
  st.innerHTML = `<div class="task after" style="justify-content:center"><div class="modal-row">${btns.map((b, i) => `<button class="pbtn big" data-i="${i}" style="--c:${b.c}">${sprImg(b.icon)}${b.label ? `<span>${b.label}</span>` : ''}</button>`).join('')}</div></div>`;
  st.firstElementChild.addEventListener('click', e => { const b = e.target.closest('[data-i]'); if (b) { Sfx.tap(); btns[+b.dataset.i].act(); } });
}
function needFirstMission() { if (unlocked().length) return false; say(T.playFirst); const p = $('#btn-play'); p.classList.add('pulse'); setTimeout(() => p.classList.remove('pulse'), 4000); return true; }

async function startTrace(c) {
  closeModal();
  const run = newRun('trace');
  show('game'); freeHUD('ПРОПИСЬ');
  try {
    await tTrace({ c }, run);
    afterPanel([
      { icon: 'i_reset', label: 'Ещё раз', c: 'var(--grass)', act: () => startTrace(c) },
      { icon: 'i_pencil', label: 'Другая', c: 'var(--sun)', act: () => openABC('write') },
      { icon: 'i_home', label: '', c: 'var(--cape)', act: goHome },
    ]);
  } catch (e) { if (e !== STOP) console.error(e); }
}

async function startTir() {
  if (needFirstMission()) return;
  const run = newRun('tir');
  show('game'); freeHUD('ТИР');
  try {
    const pool = unlocked();
    const sorted = pool.slice().sort((a, b) => S.L[a].sc - S.L[b].sc);
    const targets = shuffle(sorted.slice(0, Math.max(3, Math.ceil(sorted.length / 2)))).slice(0, 3);
    while (targets.length < 3) targets.push(pick(pool));
    let total = 0;
    for (let k = 0; k < targets.length; k++) {
      setStage('<div class="task"></div>');
      await rs(run, k === 0 ? T.tir : T.tirNext);
      const hits = await arcadeRound(run, targets[k], { need: 5, time: 25, pool });
      if (!run.alive) throw STOP;
      total += hits; boost(targets[k], Math.min(8, hits * 2));
    }
    Sfx.fanfare(); FX.confetti();
    afterPanel([
      { icon: 'i_target', label: 'Ещё', c: 'var(--hero)', act: startTir },
      { icon: 'i_home', label: '', c: 'var(--cape)', act: goHome },
    ]);
    await rs(run, T.shot3);
  } catch (e) { if (e !== STOP) console.error(e); }
}

/* ---------- ABC / collection ---------- */
let ABC_MODE = 'abc';
function openABC(mode) {
  endRun(); closeModal(); ABC_MODE = mode;
  if (mode === 'write' && needFirstMission()) return;
  show('abc');
  $('#abc-title').textContent = mode === 'write' ? 'ПРОПИСЬ' : 'АЗБУКА';
  $('#abc-grid').innerHTML = ALPHA.map(c => slotHTML(c)).join('');
  say(mode === 'write' ? T.pickWrite : unlocked().length ? T.abc : T.allHidden);
}
function openCard(c) {
  const D = LET[c];
  modal(`<div class="card-top"><button class="bigletter ${D.type}" data-act="letter"><span>${c}</span><span class="low">${c.toLowerCase()}</span></button><div class="pics">${D.words.slice(0, 4).map((w, i) => `<button class="pic" data-w="${i}">${emoHTML(w)}<span class="word">${wordHTML(w, c)}</span></button>`).join('')}</div></div><div class="modal-row"><button class="pbtn big" data-act="sound" aria-label="Послушать" style="--c:var(--cape)">${sprImg('i_sound')}</button><button class="pbtn big" data-act="write" style="--c:var(--grass)">${sprImg('i_pencil')}<span>Написать</span></button><button class="pbtn big" data-act="close" aria-label="Закрыть" style="--c:var(--hero)">${sprImg('i_check')}</button></div>`, a => {
    if (a.dataset.w !== undefined) { say(P.wordEx(D.words[+a.dataset.w])); return; }
    const act = a.dataset.act;
    if (act === 'letter' || act === 'sound') speakCard(c);
    if (act === 'write') startTrace(c);
    if (act === 'close') { Voice.stop(); closeModal(); }
  });
  speakCard(c);
}
function speakCard(c) { say([P.nomEx(c), P.introWords(c)]); }

/* ---------- build mode (Стройка): ребёнок строит сам, 1 алмаз = 1 блок ---------- */
const HERO_W = 2.2;          // cells reserved left of the grid for the hero
const BV = { g: null, raf: 0, anims: [], press: null, hop: 0, lift: 0, busy: false, done: false, token: { alive: false }, pickTold: false, emptyAt: 0, badAt: 0, saveT: 0 };
const cellCh = i => (S.world || '')[i] || '.';
function setCell(i, ch) { const w = S.world; S.world = w.slice(0, i) + ch + w.slice(i + 1); }
function bSave() { clearTimeout(BV.saveT); BV.saveT = setTimeout(save, 250); }
const curBP = () => (S.bp >= 0 && BP[S.bp]) ? BP[S.bp] : null;
function bpProgress(b = curBP()) { if (!b) return [0, 0]; let d = 0; b.set.forEach(i => { if (cellCh(i) !== '.') d++; }); return [d, b.n]; }
function drawBlock(g, t, x, y, s, ghost) {
  g.drawImage(TEX[t].cv, x, y, s, s);
  if (ghost) return;
  const e = Math.max(2, Math.round(s * .08));
  g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x, y + s - e, s, e); g.fillRect(x + s - e, y, e, s);
  g.strokeStyle = 'rgba(27,21,48,.55)'; g.lineWidth = 1; g.strokeRect(x + .5, y + .5, s - 1, s - 1);
}
function bLayout() {
  const cv = $('#build-cv'); if (!cv) return null;
  const W = cv.clientWidth, H = cv.clientHeight; if (!W || !H) return (BV.g = null);
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  const cs = Math.max(8, Math.floor(Math.min(W / (WW + HERO_W + .3), H / (WH + 1.75), 76)));
  const ox = Math.round((W - (WW + HERO_W) * cs) / 2 + HERO_W * cs), gy = Math.round(H - 1.75 * cs);
  return (BV.g = { W, H, dpr, cs, ox, gy, oy: gy - WH * cs });
}
function bReq() { if (!BV.raf) BV.raf = requestAnimationFrame(bDraw); }
function bDraw() {
  BV.raf = 0;
  if (CUR !== 'build') return;
  const G = BV.g || bLayout(); if (!G) return;
  const g = $('#build-cv').getContext('2d'), { cs, ox, oy, gy } = G, now = performance.now();
  g.setTransform(G.dpr, 0, 0, G.dpr, 0, 0); g.imageSmoothingEnabled = false; g.clearRect(0, 0, G.W, G.H);
  // building area + dots on the cell corners
  g.fillStyle = 'rgba(255,255,255,.16)'; g.fillRect(ox, oy, WW * cs, WH * cs);
  const d = Math.max(2, Math.round(cs * .07)); g.fillStyle = 'rgba(255,255,255,.6)';
  for (let y = 0; y <= WH; y++) for (let x = 0; x <= WW; x++) g.fillRect(ox + x * cs - d / 2, oy + y * cs - d / 2, d, d);
  // ground across the whole width
  for (let k = Math.floor(-ox / cs) - 1; ox + k * cs < G.W; k++) { drawBlock(g, 'grass', ox + k * cs, gy, cs); drawBlock(g, 'dirt', ox + k * cs, gy + cs, cs); }
  // blueprint hints on empty cells
  const b = curBP();
  if (b && !BV.lift) {
    g.setLineDash([Math.max(3, cs * .12), Math.max(3, cs * .1)]); g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 1.5;
    for (const c of b.cells) {
      const x = b.ox + c.x, y = b.oy + c.y; if (cellCh(y * WW + x) !== '.') continue;
      const px = ox + x * cs, py = oy + y * cs, m = Math.round(cs * .2);
      g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(px + 2, py + 2, cs - 4, cs - 4);
      g.globalAlpha = .85; drawBlock(g, c.t, px + m, py + m, cs - 2 * m, true); g.globalAlpha = 1; g.strokeRect(px + 2.5, py + 2.5, cs - 5, cs - 5);
    }
    g.setLineDash([]);
  }
  // hero (hops when a block lands)
  const hp = clamp((now - BV.hop) / 320, 0, 1), hop = hp < 1 ? Math.sin(hp * Math.PI) * cs * .45 : 0;
  const hh = cs * 2.5, hw = hh * 16 / 24;
  g.drawImage(SPRC[heroKey()], Math.round(ox - HERO_W * cs + (HERO_W * cs - hw) / 2), Math.round(gy - hh - hop), Math.round(hw), Math.round(hh));
  let busy = hp < 1;
  // blocks
  BV.anims = BV.anims.filter(a => now - a.t0 < a.dur);
  const am = new Map(BV.anims.map(a => [a.i, a])), w = S.world;
  for (let i = 0; i < w.length; i++) {
    const ch = w[i]; if (ch === '.') continue;
    let px = ox + (i % WW) * cs, py = oy + Math.floor(i / WW) * cs, s = cs;
    if (BV.lift && b && b.set.has(i)) py -= BV.lift;
    const a = am.get(i);
    if (a) { const p = easeOut(clamp((now - a.t0) / a.dur, 0, 1)); s = cs * (1 + a.k * (1 - p)); px -= (s - cs) / 2; py -= (s - cs) / 2 + a.k * (1 - p) * cs; busy = true; }
    drawBlock(g, BCH[ch], px, py, s);
  }
  // finger position
  const P = BV.press;
  if (P && P.cur) { g.strokeStyle = '#ffffff'; g.lineWidth = 3; g.strokeRect(ox + P.cur.x * cs + 1.5, oy + P.cur.y * cs + 1.5, cs - 3, cs - 3); }
  // very first time: blink where to tap
  if (!BV.lift && !usedBlocks() && wallet() > 0 && !b) {
    const p = (Math.sin(now / 170) + 1) / 2, hx = ox + (WW >> 1) * cs, hy = oy + (WH - 1) * cs;
    if (S.btool !== 'pick') { g.globalAlpha = .25 + .4 * p; drawBlock(g, S.btool, hx, hy, cs, true); g.globalAlpha = 1; }
    g.strokeStyle = `rgba(255,198,46,${.5 + .5 * p})`; g.lineWidth = 3 + 3 * p; g.strokeRect(hx + 3, hy + 3, cs - 6, cs - 6); busy = true;
  }
  if (busy) bReq();
}
function bCell(e) {
  const G = BV.g; if (!G) return null;
  const r = $('#build-cv').getBoundingClientRect();
  const x = Math.floor((e.clientX - r.left - G.ox) / G.cs), y = Math.floor((e.clientY - r.top - G.oy) / G.cs);
  return (x < 0 || y < 0 || x >= WW || y >= WH) ? null : { x, y, i: y * WW + x };
}
function cellPt(i) { const G = BV.g, r = $('#build-cv').getBoundingClientRect(); return [r.left + G.ox + (i % WW + .5) * G.cs, r.top + G.oy + (Math.floor(i / WW) + .5) * G.cs]; }
function bNoGems() {
  const now = Date.now();
  if (now - BV.badAt > 700) { BV.badAt = now; Sfx.bad(); const c = visibleGemCounter(); if (c) { c.classList.remove('shake'); void c.offsetWidth; c.classList.add('shake'); } }
  if (now - BV.emptyAt > 6000) { BV.emptyAt = now; say(T.buildEmpty); }
  gemsText();
}
function bPlace(i, t) {
  const cur = cellCh(i), ch = TCH[t];
  if (cur === ch) return false;
  if (cur === '.' && wallet() <= 0) { bNoGems(); return false; }
  setCell(i, ch); bSave();
  BV.anims.push({ i, t0: performance.now(), dur: 180, k: .3 }); BV.hop = performance.now();
  Sfx.place();
  const [x, y] = cellPt(i); FX.spawn(x, y + BV.g.cs * .45, TEX[t].cols, 6, { speed: .3, size: .55 });
  if (cur === '.') bumpGems();
  bCheck(true); bReq(); return true;
}
function bRemove(i) {
  const cur = cellCh(i); if (cur === '.') return false;
  setCell(i, '.'); bSave(); Sfx.crack();
  const [x, y] = cellPt(i); FX.spawn(x, y, TEX[BCH[cur]].cols.concat(['#ffffff']), 14, { speed: .55 });
  FX.flyGem([x, y], 1);
  bCheck(false); bReq(); return true;
}
function bApply(i, mode) {
  const cur = cellCh(i), t = S.btool;
  if (mode === 'remove') return bRemove(i);
  if (cur === '.') return bPlace(i, t);
  if (mode === 'paint' && BCH[cur] !== t) return bPlace(i, t);
  return false;
}
function bDown(e) {
  if (BV.busy || CUR !== 'build' || (e.button !== undefined && e.button > 0)) return;
  if (!BV.g) bLayout();
  const c = bCell(e); if (!c) return;
  e.preventDefault();
  try { e.currentTarget.setPointerCapture(e.pointerId); } catch (er) { /* ignore */ }
  const cur = cellCh(c.i), tool = S.btool;
  const mode = tool === 'pick' ? 'remove' : (cur === '.' || BCH[cur] === tool) ? 'place' : 'paint';
  BV.press = { id: e.pointerId, mode, last: c, cur: c };
  if (!bApply(c.i, mode) && mode !== 'remove' && cur !== '.') { BV.anims.push({ i: c.i, t0: performance.now(), dur: 160, k: .12 }); Sfx.tap(); }
  bReq();
}
function bMove(e) {
  const P = BV.press; if (!P || P.id !== e.pointerId || BV.busy) return;
  const c = bCell(e); if (!c) { if (P.cur) { P.cur = null; bReq(); } return; }
  if (P.cur && c.i === P.cur.i) return;
  // walk every cell between the last one and this one, so a fast finger leaves no gaps
  let x = P.last.x, y = P.last.y; const dx = Math.abs(c.x - x), dy = Math.abs(c.y - y), sx = c.x > x ? 1 : -1, sy = c.y > y ? 1 : -1; let err = dx - dy;
  while (x !== c.x || y !== c.y) { const e2 = 2 * err; if (e2 > -dy) { err -= dy; x += sx; } if (e2 < dx) { err += dx; y += sy; } bApply(y * WW + x, P.mode); }
  P.last = c; P.cur = c; bReq();
}
function bUp(e) { const P = BV.press; if (!P || P.id !== e.pointerId) return; BV.press = null; clearTimeout(BV.saveT); save(); bReq(); }
function bHeader() {
  const b = curBP(), nm2 = $('#build-name'), bw = $('#build-barw'), cnt = $('#build-count');
  if (!b) { nm2.textContent = 'СТРОЙКА'; bw.hidden = cnt.hidden = true; return; }
  const [d, n] = bpProgress(b);
  nm2.textContent = b.name.toUpperCase(); bw.hidden = cnt.hidden = false;
  $('#build-bar').style.width = (d / n * 100).toFixed(1) + '%'; cnt.textContent = `${d}/${n}`;
}
function bCheck(added) {
  bHeader();
  const b = curBP(); if (!b) return;
  const [d, n] = bpProgress(b);
  if (d < n) { BV.done = false; return; }
  if (BV.done || !added) return;
  BV.done = true; bCelebrate(S.bp);
}
async function bCelebrate(i) {
  const token = BV.token, b = BP[i], G = BV.g, r = $('#build-cv').getBoundingClientRect();
  const first = !(S.bpDone || []).includes(i);
  const cx = r.left + G.ox + (b.ox + b.w / 2) * G.cs, cy = r.top + G.oy + (b.oy + b.h / 2) * G.cs;
  if (first) { S.bpDone = [...(S.bpDone || []), i]; S.gems += BONUS; save(); }
  Sfx.fanfare(); FX.confetti(); FX.burst(cx, Math.max(r.top + 70, r.top + G.oy + b.oy * G.cs), 'ПОСТРОЕНО!', { fs: 46 });
  await say(b.done); if (!token.alive) return;
  if (b.rocket) { await rocketFly(b, token); if (!token.alive) return; }
  if (first) { FX.flyGem([cx, cy], 5); await say(T.bonus); }
}
function bAnim(dur, fn, token) {
  return new Promise(res => { const t0 = performance.now(); const f = ts => { if (!token.alive) { res(); return; } const p = clamp((ts - t0) / dur, 0, 1); fn(p); bDraw(); if (p < 1) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); });
}
async function rocketFly(b, token) {
  BV.busy = true; BV.press = null;
  try {
    const far = () => BV.g.H + 60;
    const flame = () => { const G = BV.g, r = $('#build-cv').getBoundingClientRect(); FX.spawn(r.left + G.ox + (b.ox + b.w / 2) * G.cs, r.top + G.oy + (b.oy + b.h) * G.cs - BV.lift, ['#ff8a1f', '#ffc62e', '#e8363f', '#ffffff'], 5, { speed: .45, gr: -200, life: .8 }); };
    Sfx.whoosh();
    await bAnim(1900, p => { BV.lift = Math.pow(p, 2.1) * far(); flame(); }, token); if (!token.alive) return;
    await sleep(600); if (!token.alive) return;
    Sfx.whoosh();
    await bAnim(1800, p => { BV.lift = (1 - easeOut(p)) * far(); if (p < .97) flame(); }, token); if (!token.alive) return;
    BV.lift = 0; bDraw(); Sfx.boom();
    const G = BV.g, r = $('#build-cv').getBoundingClientRect();
    FX.spawn(r.left + G.ox + (b.ox + b.w / 2) * G.cs, r.top + G.gy, ['#d6cbbd', '#ffffff', '#a3a3ad'], 26, { speed: .7 });
    await say(T.rocketBack);
  } finally { BV.lift = 0; BV.busy = false; bReq(); }
}
function bHotbar() {
  const hb = $('#hotbar');
  if (!hb.childElementCount) {
    hb.innerHTML = `<button class="hb pick" data-t="pick" aria-label="Кирка">${sprImg('i_pick')}</button>` +
      BLOCKS.map(b => `<button class="hb" data-t="${b.t}" aria-label="${b.name}" style="background-image:url(${TEX[b.t].url})"></button>`).join('');
  }
  $$('.hb', hb).forEach(b => b.classList.toggle('sel', b.dataset.t === S.btool));
}
function bTool(t) {
  if (BV.busy) return;
  S.btool = t; save(); bHotbar(); Sfx.tap();
  if (t === 'pick') { say(BV.pickTold ? T.pickShort : T.pick); BV.pickTold = true; return; }
  const b = BLOCKS.find(x => x.t === t); if (b) say(P.block(b));
}
const THUMB = {};
function bpThumb(rows, key) {
  if (THUMB[key]) return THUMB[key];
  const h = rows.length, w = Math.max(...rows.map(r => r.length)), s = 8, c = document.createElement('canvas');
  c.width = w * s; c.height = h * s; const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) { const ch = r[x]; if (ch !== '.' && BCH[ch]) drawBlock(g, BCH[ch], x * s, y * s, s); } });
  return (THUMB[key] = c.toDataURL());
}
const FREE_ROWS = ['.fff.', 'fffff', 'fffff', '.fff.', '..l..', '..l..'];
function openPlans() {
  if (BV.busy) return;
  const cards = [{ i: -1, name: 'Сам', rows: FREE_ROWS }].concat(BP.map((b, i) => ({ i, name: b.name, rows: b.rows })));
  modal(`<h3>Что строим?</h3><div class="plans">${cards.map(c => `<button class="plan-card${S.bp === c.i ? ' sel' : ''}" data-act="plan" data-i="${c.i}" aria-label="${c.name}">${(S.bpDone || []).includes(c.i) ? sprImg('star', 'pc-done') : ''}<span class="th"><img src="${bpThumb(c.rows, 'k' + c.i)}" alt=""></span><span class="pc-name">${c.name}</span></button>`).join('')}</div>`, el => {
    if (el.dataset.act !== 'plan') return;
    closeModal(); bSetPlan(+el.dataset.i);
  });
  say(T.planPick);
}
function bSetPlan(i) {
  S.bp = i; save();
  const b = curBP(); BV.done = !!b && bpProgress(b)[0] === b.n;
  bHeader(); bReq();
  say(i < 0 ? T.planOff : P.plan(i));
}
async function openBuild() {
  endRun(); closeModal();
  BV.token = { alive: true }; BV.press = null; BV.busy = false; BV.lift = 0; BV.anims = [];
  show('build'); bHotbar(); bHeader();
  await nextFrame();
  bLayout();
  const b = curBP(); BV.done = !!b && bpProgress(b)[0] === b.n;
  bReq();
  if (!S.buildSeen) { S.buildSeen = 1; save(); say(wallet() > 0 ? [T.build, T.buildCost] : [T.build, T.buildEmpty]); }
  else if (wallet() <= 0 && !usedBlocks()) say(T.buildEmpty);
  else say(T.buildHi);
}
function buildStop() { BV.token.alive = false; BV.press = null; BV.lift = 0; BV.busy = false; }

/* ---------- heroes screen ---------- */
function openHeroes() {
  endRun(); closeModal(); show('heroes'); renderHeroes();
  say(T.heroes);
}
function renderHeroes() {
  const w = wallet(), cur = heroKey();
  $('#hero-grid').innerHTML = HEROES.map(h => {
    const own = owns(h.id), sel = own && h.id === cur, can = !own && h.price <= w;
    const cls = sel ? 'sel' : own ? 'own' : can ? 'can' : 'locked';
    const tag = sel ? '<span class="hc-tag ok">ВЫБРАН</span>'
      : own ? '<span class="hc-tag">ВЫБРАТЬ</span>'
      : `<span class="hc-tag price">${sprImg('gem')}<b>${h.price}</b></span>${can ? '' : `<span class="hc-bar"><i style="width:${Math.round(Math.min(1, w / h.price) * 100)}%"></i></span>`}`;
    return `<button class="hcard ${cls}" data-h="${h.id}" aria-label="${h.name}">${!own && !can ? sprImg('i_lock', 'hc-lock') : ''}<img class="spr hc-img" src="${SPRU[h.id]}" alt=""><span class="hc-name">${h.name}</span>${tag}</button>`;
  }).join('');
}
function refreshHero() { applySprites(document); const im = $('#home-hero-img'); if (im) im.src = SPRU[heroKey()]; }
function tapHero(id, card) {
  const h = HEROES.find(x => x.id === id); if (!h) return;
  const [x, y] = FX.center(card);
  if (owns(id)) {
    S.skin = id; save(); refreshHero(); renderHeroes(); Sfx.good();
    FX.spawn(x, y, ['#ffc62e', '#ffffff', '#39e3dc'], 20);
    say(P.heroNow(h));
    return;
  }
  if (h.price <= wallet()) {
    S.spent = (S.spent || 0) + h.price; S.owned = [...(S.owned || ['hero']), id]; S.skin = id; save();
    gemsText(); refreshHero(); renderHeroes(); Sfx.fanfare(); FX.confetti();
    FX.burst(x, y - 40, 'НОВЫЙ ГЕРОЙ!', { fs: 40 });
    say([T.newHero, P.heroNow(h)]);
    return;
  }
  Sfx.bad(); card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake');
  say(T.needMore);
}

/* ---------- parent ---------- */
function openGate() {
  const a = ri(4, 9), b = ri(5, 9), ans = a + b;
  const opts = shuffle([ans, ans + 1, ans - 1, ans + 2]);
  modal(`<h3>Для взрослых</h3><div class="gate-q">${a} + ${b} = ?</div><div class="modal-row">${opts.map(v => `<button class="pbtn gate-a" data-ans="${v}" style="--c:var(--cape)">${v}</button>`).join('')}</div>`, el => {
    if (el.dataset.ans === undefined) return;
    if (+el.dataset.ans === ans) { closeModal(); openParent(); } else { Sfx.bad(); closeModal(); }
  });
}
function openParent() { endRun(); show('parent'); renderParent(); }
function renderParent() {
  const PE = $('#parent'), ru = TTS.ruVoices();
  const un = unlocked().length, learned = ALPHA.filter(c => S.L[c].u && lv(c) >= 2).length;
  const tot = ALPHA.reduce((a, c) => a + S.L[c].n, 0), ok = ALPHA.reduce((a, c) => a + S.L[c].ok, 0);
  const cur = TTS.voice ? TTS.voice.voiceURI : '';
  PE.innerHTML = `
  <section>
    <h3>Прогресс</h3>
    <div class="pstat">
      <div><b>${S.missions}</b>${plural(S.missions, 'миссия', 'миссии', 'миссий')}</div>
      <div><b>${un} из 33</b>букв открыто</div>
      <div><b>${learned}</b>узнаёт уверенно (★★ и выше)</div>
      <div><b>${tot ? Math.round(ok / tot * 100) + '%' : '—'}</b>верно с первой попытки</div>
    </div>
    <div class="pgrid" style="margin-top:14px">${ALPHA.map(c => { const d = S.L[c], L = lv(c); return `<div class="pcell l${L}${d.u ? '' : ' lk'}"><b>${c}</b>${d.u ? (L ? '★'.repeat(L) : 'новая') : 'закрыта'}${d.n ? `<br>${d.ok} из ${d.n}` : ''}</div>`; }).join('')}</div>
    <p class="muted" style="margin-top:10px">«3 из 4» — сколько раз буква угадана с первой попытки из всех заданий с ней.</p>
    <div class="row" style="margin-top:6px">
      <button class="pbtn" id="p-next" style="--c:var(--good)">Открыть следующую букву</button>
      <button class="pbtn" id="p-all" style="--c:var(--cape)">Открыть все буквы</button>
      <button class="pbtn" id="p-reset" style="--c:var(--hero)">Сбросить прогресс</button>
    </div>
  </section>
  <section>
    <h3>Ребёнок</h3>
    <div class="row">
      <label>Имя <input type="text" id="p-name" value="${esc(S.name)}" maxlength="20" autocomplete="off"></label>
      <label>Герой <input type="text" id="p-hero" value="${esc(S.hero)}" maxlength="18" autocomplete="off"></label>
    </div>
    <div class="row">
      <label><input type="radio" name="p-sex" id="p-boy" ${S.boy ? 'checked' : ''}> мальчик</label>
      <label><input type="radio" name="p-sex" id="p-girl" ${S.boy ? '' : 'checked'}> девочка</label>
    </div>
  </section>
  <section>
    <h3>Как называть буквы</h3>
    <label><input type="radio" name="p-mode" id="p-sound" ${S.mode === 'sound' ? 'checked' : ''}> Как звуки: «мэ», «лэ», «сэ» — так легче потом читать слоги</label>
    <label><input type="radio" name="p-mode" id="p-alpha" ${S.mode === 'alpha' ? 'checked' : ''}> Как в алфавите: «эм», «эль», «эс»</label>
    <p class="muted">Лучше выбрать так, как называют буквы в саду или на подготовке к школе.</p>
    <label><input type="checkbox" id="p-lower" ${S.lower ? 'checked' : ''}> Добавлять маленькие (строчные) буквы, когда большая выучена на ★★</label>
  </section>
  <section>
    <h3>Голос и звук</h3>
    <p>Голос встроен в игру и работает без интернета.</p>
    <div class="row"><button class="pbtn" id="p-test" style="--c:var(--cape)">Проверить голос</button></div>
    <label><input type="checkbox" id="p-sys" ${S.sysVoice ? 'checked' : ''}> Говорить голосом планшета вместо встроенного</label>
    ${S.sysVoice ? (ru.length ? `<div class="row"><select id="p-voice" aria-label="Голос планшета">${ru.map(v => `<option value="${esc(v.voiceURI)}"${v.voiceURI === cur ? ' selected' : ''}>${esc(v.name)}</option>`).join('')}</select></div><label>Скорость речи <input type="range" id="p-rate" min="0.6" max="1.2" step="0.05" value="${S.rate}"></label>` : '<div class="warn">Русский голос планшета не найден. Оставьте встроенный голос.</div>') : ''}
    <label><input type="checkbox" id="p-sfx" ${S.sfx ? 'checked' : ''}> Игровые звуки</label>
    ${(S.name && S.name !== DEF().name) || S.hero !== DEF().hero ? '<p class="muted">Встроенный голос знает имена «Максим» и «Супер-Макс». С другими именами игра обращается без имени.</p>' : ''}
  </section>
  <section>
    <h3>Миссия</h3>
    <div class="row">${[[6, 'короткая', 3], [8, 'обычная', 5], [10, 'длинная', 7]].map(([n, t, m]) => `<label><input type="radio" name="p-len" value="${n}" ${S.len === n ? 'checked' : ''}> ${t} (~${m} мин)</label>`).join('')}</div>
    <div class="row"><button class="pbtn" id="p-fs" style="--c:var(--glitch)">На весь экран</button></div>
  </section>
  <section>
    <h3>Как это работает</h3>
    <p>Миссия — это несколько коротких заданий: найти букву на слух, найти такую же, угадать первую букву слова по картинке, обвести букву пальцем по дорожке и финальный «тир». Новая буква открывается, когда прошлые уже узнаются. За правильные ответы — алмазы.</p>
    <p>На «Стройке» ребёнок сам строит из блоков: один алмаз — один блок, кирка убирает блок и возвращает алмаз. Есть чертежи (домик, башня, замок, ракета) — за первую постройку по чертежу +10 алмазов. Алмазы также открывают новых героев.</p>
    <p>Ошибки не наказываются: игра называет букву, на которую нажал ребёнок, а после второй ошибки подсвечивает нужную.</p>
    <p>Лучше одна-две миссии в день, чем час подряд. Прогресс хранится в этом браузере на этом устройстве.</p>
  </section>`;
  const on = (id, ev, fn) => { const el = $('#' + id); if (el) el.addEventListener(ev, fn); };
  on('p-name', 'input', e => { S.name = e.target.value.trim(); save(); });
  on('p-hero', 'input', e => { S.hero = e.target.value.trim() || 'Супер-Герой'; save(); applyNames(); });
  on('p-boy', 'change', () => { S.boy = true; save(); });
  on('p-girl', 'change', () => { S.boy = false; save(); });
  on('p-sound', 'change', () => { S.mode = 'sound'; save(); });
  on('p-alpha', 'change', () => { S.mode = 'alpha'; save(); });
  on('p-lower', 'change', e => { S.lower = e.target.checked; save(); });
  on('p-voice', 'change', e => { S.voiceURI = e.target.value; save(); TTS.choose(); });
  on('p-test', 'click', () => { Voice.unlock(); Sfx.unlock(); say([P.thisIs('М'), P.find('А', 0)]); });
  on('p-rate', 'change', e => { S.rate = parseFloat(e.target.value) || .9; save(); say(T.rateTest); });
  on('p-sys', 'change', e => { S.sysVoice = e.target.checked; save(); renderParent(); });
  on('p-sfx', 'change', e => { S.sfx = e.target.checked; save(); Sfx.good(); });
  $$('input[name=p-len]').forEach(r => r.addEventListener('change', e => { S.len = +e.target.value; save(); }));
  on('p-fs', 'click', () => { const el = document.documentElement; try { const r = (el.requestFullscreen || el.webkitRequestFullscreen).call(el); if (r && r.catch) r.catch(() => {}); } catch (e) { /* not supported */ } });
  on('p-next', 'click', () => { const nx = nextLocked(); if (nx) { S.L[nx].u = 1; save(); } renderParent(); });
  on('p-all', 'click', () => { ALPHA.forEach(c => { S.L[c].u = 1; }); save(); renderParent(); });
  let armed = false;
  on('p-reset', 'click', e => {
    if (!armed) { armed = true; e.target.textContent = 'Точно сбросить? Нажмите ещё раз'; setTimeout(() => { armed = false; const b = $('#p-reset'); if (b) b.textContent = 'Сбросить прогресс'; }, 4000); return; }
    const keep = { name: S.name, hero: S.hero, boy: S.boy, mode: S.mode, lower: S.lower, voiceURI: S.voiceURI, rate: S.rate, sfx: S.sfx, len: S.len };
    S = Object.assign(DEF(), keep); ALPHA.forEach(c => { S.L[c] = { u: 0, sc: 0, n: 0, ok: 0, st: 0, t: 0, intro: 0 }; }); save(); gemsText(); renderParent();
  });
}

/* ---------- home ---------- */
let UPDATE_READY = false;
function maybeReload() { if (UPDATE_READY && CUR === 'home' && !RUN) { try { location.reload(); } catch (e) { /* ignore */ } } }
function goHome() { endRun(); closeModal(); show('home'); applyNames(); maybeReload(); }
let heroFrame = 0;
function animHero() { heroFrame ^= 1; const im = $('#home-hero-img'); if (!im || CUR !== 'home') return; const k = heroKey(); im.src = SPRU[k === 'hero' && heroFrame ? 'hero2' : k]; }

/* ---------- boot ---------- */
function boot() {
  load(); buildSprites(); genTextures(); applySprites();
  const rs2 = document.documentElement.style;
  rs2.setProperty('--tex-grass', `url(${TEX.grass.url})`); rs2.setProperty('--tex-dirt', `url(${TEX.dirt.url})`);
  FX.resize(); applyNames(); gemsText(); show('home');
  setInterval(animHero, 420);

  document.addEventListener('pointerdown', () => { Sfx.unlock(); }, { capture: true });
  ['click', 'touchend', 'keydown'].forEach(ev => document.addEventListener(ev, () => { Voice.unlock(); Sfx.unlock(); }, { capture: true, passive: true }));
  document.addEventListener('visibilitychange', () => { if (document.hidden) Voice.stop(); });
  window.addEventListener('resize', () => {
    FX.resize(); fitLogo(); if (curFit) curFit(); if (TR) TR.layout();
    if (CUR === 'build') { bLayout(); bReq(); }
  });

  $('#btn-play').addEventListener('click', () => { Sfx.tap(); startMission(); });
  $('#home-hero').addEventListener('click', () => {
    Sfx.tap(); const im = $('#home-hero-img'); if (im.animate) im.animate([{ translate: '0 0' }, { translate: '0 -40px' }, { translate: '0 0' }], { duration: 450, easing: 'ease-out' });
    sayPick([S.name ? N.heroTap() : T.heroTap0, T.heroTap0]);
  });
  $('#peek').addEventListener('click', () => { Sfx.bad(); say(T.villain, { pitch: .55, rate: 1.05 }); });
  $$('[data-go]').forEach(b => b.addEventListener('click', () => {
    Sfx.tap(); const g = b.dataset.go;
    if (g === 'abc') openABC('abc'); else if (g === 'write') openABC('write'); else if (g === 'tir') startTir(); else if (g === 'build') openBuild(); else if (g === 'heroes') openHeroes();
  }));
  $('#btn-parent').addEventListener('click', () => { Sfx.tap(); openGate(); });
  $$('[data-home]').forEach(b => b.addEventListener('click', () => { Sfx.tap(); goHome(); }));
  $('#btn-exit').addEventListener('click', () => {
    Sfx.tap();
    if (!RUN || RUN.kind !== 'mission') { goHome(); return; }
    modal(`<h3>Выйти из миссии?</h3><div class="modal-row"><button class="pbtn big" data-act="stay" style="--c:var(--good)">${sprImg('i_play')}<span>Играть</span></button><button class="pbtn big" data-act="leave" style="--c:var(--hero)">${sprImg('i_home')}<span>Выйти</span></button></div>`, a => {
      if (a.dataset.act === 'stay') closeModal(); if (a.dataset.act === 'leave') goHome();
    });
  });
  $('#stage').addEventListener('click', e => { const a = e.target.closest('[data-act=say]'); if (a && RUN && RUN.prompt) { Sfx.tap(); RUN.prompt(); } });
  $('#modal').addEventListener('click', e => { if (e.target.id === 'modal') { closeModal(); return; } const a = e.target.closest('[data-act],[data-w],[data-ans]'); if (a && MODAL_CB) { Sfx.tap(); MODAL_CB(a, e); } });
  $('#abc-grid').addEventListener('click', e => {
    const s = e.target.closest('.slot'); if (!s) return; const c = s.dataset.c;
    if (!S.L[c].u) { Sfx.bad(); say(T.locked); return; }
    Sfx.tap(); if (ABC_MODE === 'write') startTrace(c); else openCard(c);
  });
  $('#rw-build').addEventListener('click', () => { Sfx.tap(); openBuild(); });
  $('#rw-again').addEventListener('click', () => { Sfx.tap(); startMission(); });
  $('#rw-home').addEventListener('click', () => { Sfx.tap(); goHome(); });
  $('#rw-heroes').addEventListener('click', () => { Sfx.tap(); openHeroes(); });
  $('#hero-grid').addEventListener('click', e => { const c = e.target.closest('.hcard'); if (c) tapHero(c.dataset.h, c); });
  $('#build-play').addEventListener('click', () => { Sfx.tap(); startMission(); });
  $('#btn-plan').addEventListener('click', () => { Sfx.tap(); openPlans(); });
  $('#hotbar').addEventListener('click', e => { const b = e.target.closest('.hb'); if (b) bTool(b.dataset.t); });
  const bcv = $('#build-cv');
  bcv.addEventListener('pointerdown', bDown); bcv.addEventListener('pointermove', bMove);
  bcv.addEventListener('pointerup', bUp); bcv.addEventListener('pointercancel', bUp); bcv.addEventListener('lostpointercapture', bUp);
  if (window.ResizeObserver) new ResizeObserver(() => { if (CUR === 'build') { bLayout(); bReq(); } }).observe($('#build-stage'));
  onVoices = () => { if (CUR === 'parent' && S.sysVoice && !$('#p-voice') && TTS.ruVoices().length) renderParent(); };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitLogo).catch(() => {});
  if (PWA && 'serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    const hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController) { UPDATE_READY = true; maybeReload(); } });
    window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {}); } catch (e) { /* ignore */ }
  }
  window.__game = { S: () => S, LET, STROKES, BP, HEROES, BLOCKS, WW, WH, BV, lv, unlocked, allPhrases, wallet, usedBlocks, bpProgress, get RUN() { return RUN; }, get TR() { return TR; }, save };
}
const startApp = () => { try { boot(); } catch (e) { console.error(e); } };
if (window.claude && window.claude.hot && window.claude.hot.ready) window.claude.hot.ready(startApp); else startApp();
