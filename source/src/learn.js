/* =========================================================
   «Читаем»: буква бежит к букве → слоги → слова → предложения → истории
   «Числа»: счёт, десятки, числа до 100, пропущенное число, больше–меньше,
   плюс и минус, состав числа, задачки про семью.
   Уровни S.rl и S.nl (1–10) растут после 4 верных ответов подряд и падают,
   если два задания подряд не получаются.
   ========================================================= */

/* ---------- reading data ---------- */
const VOWELS = 'АОУЫИЭЕЁЮЯ';
const isVow = ch => VOWELS.includes(String(ch).toUpperCase());
const SYL_V = 'АОУЫИ';
const SYL_BAD = new Set(['КЫ', 'ГЫ', 'ХЫ', 'ЖЫ', 'ШЫ', 'ЧЫ', 'ЩЫ']);
const SYL_C = ['МНЛС', 'ТКРП', 'ВДЗБ', 'ГШЖ'];             // consonant groups in the order they come in
// МО и МУ, МЫ и МИ на слух у синтезатора похожи: в заданиях «на слух» их не ставим рядом
const CONF = { 'О': 'У', 'У': 'О', 'Ы': 'И', 'И': 'Ы' };
const confusable = (a, b) => a[0] === b[0] && CONF[a[1]] === b[1];
const sylGrid = cons => [...cons].flatMap(c => [...SYL_V].map(v => c + v)).filter(s => !SYL_BAD.has(s));
const SYL_ALL = sylGrid(SYL_C.join(''));                   // 71 open syllables: МА, МО, МУ, МЫ, МИ…

// [слово, слоги, картинка, ступень]: 1 — два открытых слога, 2 — один закрытый слог, 3 — два-три слога и имена, 4 — длинные
const RWORDS = [
  ['мама', 'ма-ма', '#mom', 1], ['папа', 'па-па', '#dad', 1], ['рыба', 'ры-ба', '🐟', 1], ['луна', 'лу-на', '🌙', 1],
  ['коза', 'ко-за', '🐐', 1], ['сова', 'со-ва', '🦉', 1], ['лиса', 'ли-са', '🦊', 1], ['роза', 'ро-за', '🌹', 1],
  ['нога', 'но-га', '🦵', 1], ['рука', 'ру-ка', '✋', 1], ['пила', 'пи-ла', '🪚', 1], ['муха', 'му-ха', '🪰', 1],
  ['гора', 'го-ра', '⛰️', 1], ['ноты', 'но-ты', '🎵', 1], ['лыжи', 'лы-жи', '🎿', 1], ['сани', 'са-ни', '🛷', 1],
  ['дыня', 'ды-ня', '🍈', 1], ['каша', 'ка-ша', '🥣', 1], ['кино', 'ки-но', '🎬', 1], ['лупа', 'лу-па', '🔍', 1],
  ['юла', 'ю-ла', '#p_yula', 1], ['мыло', 'мы-ло', '🧼', 1],
  ['кот', 'кот', '🐱', 2], ['кит', 'кит', '🐳', 2], ['дом', 'дом', '🏠', 2], ['сок', 'сок', '🧃', 2], ['лук', 'лук', '🧅', 2],
  ['сыр', 'сыр', '🧀', 2], ['нос', 'нос', '👃', 2], ['жук', 'жук', '🪲', 2], ['суп', 'суп', '🍲', 2], ['лев', 'лев', '🦁', 2],
  ['лес', 'лес', '🌲', 2], ['мяч', 'мяч', '⚽', 2], ['ёж', 'ёж', '🦔', 2], ['зуб', 'зуб', '🦷', 2], ['шар', 'шар', '🎈', 2],
  ['танк', 'танк', '#i_tank', 2], ['торт', 'торт', '🎂', 2], ['слон', 'слон', '🐘', 2], ['гриб', 'гриб', '🍄', 2],
  ['хлеб', 'хлеб', '🍞', 2], ['волк', 'волк', '🐺', 2], ['флаг', 'флаг', '🚩', 2], ['чай', 'чай', '☕', 2], ['бант', 'бант', '🎀', 2],
  ['мост', 'мост', '🌉', 2], ['рак', 'рак', '🦞', 2], ['кекс', 'кекс', '🧁', 2], ['щит', 'щит', '🛡️', 2], ['ключ', 'ключ', '🔑', 2],
  ['тигр', 'тигр', '🐯', 2], ['Глюк', 'Глюк', '#glitch', 2],
  ['машина', 'ма-ши-на', '🚗', 3], ['собака', 'со-ба-ка', '🐕', 3], ['корова', 'ко-ро-ва', '🐄', 3], ['лопата', 'ло-па-та', '🪏', 3],
  ['ягода', 'я-го-да', '🍓', 3], ['бананы', 'ба-на-ны', '🍌', 3], ['гитара', 'ги-та-ра', '🎸', 3], ['корона', 'ко-ро-на', '👑', 3],
  ['молоко', 'мо-ло-ко', '🥛', 3], ['ракета', 'ра-ке-та', '🚀', 3], ['панама', 'па-на-ма', '👒', 3], ['самокат', 'са-мо-кат', '🛴', 3],
  ['лимон', 'ли-мон', '🍋', 3], ['паук', 'па-ук', '🕷️', 3], ['робот', 'ро-бот', '🤖', 3], ['пират', 'пи-рат', '🏴‍☠️', 3],
  ['зебра', 'зеб-ра', '🦓', 3], ['панда', 'пан-да', '🐼', 3], ['утка', 'ут-ка', '🦆', 3], ['алмаз', 'ал-маз', '#gem', 3],
  ['будка', 'буд-ка', '#kennel', 3], ['звезда', 'звез-да', '⭐', 3], ['подарок', 'по-да-рок', '🎁', 3], ['самолёт', 'са-мо-лёт', '✈️', 3],
  ['бабочка', 'ба-боч-ка', '🦋', 3], ['ухо', 'у-хо', '👂', 3],
  ['Винни', 'Вин-ни', '#dog_vinni', 3], ['Элли', 'Эл-ли', '#dog_elli', 3], ['Герда', 'Гер-да', '#dog_gerda', 3],
  ['Даниил', 'Да-ни-ил', '#baby', 3], ['Максим', 'Мак-сим', '#hero', 3],
  ['черепаха', 'че-ре-па-ха', '🐢', 4], ['карандаш', 'ка-ран-даш', '✏️', 4], ['вертолёт', 'вер-то-лёт', '🚁', 4],
  ['динозавр', 'ди-но-завр', '🦖', 4], ['помидор', 'по-ми-дор', '🍅', 4], ['единорог', 'е-ди-но-рог', '🦄', 4],
  ['капуста', 'ка-пус-та', '🥬', 4], ['виноград', 'ви-но-град', '🍇', 4], ['мороженое', 'мо-ро-же-но-е', '🍦', 4],
  ['кенгуру', 'кен-гу-ру', '🦘', 4], ['пингвин', 'пинг-вин', '🐧', 4], ['экскаватор', 'экс-ка-ва-тор', '#p_excavator', 4],
  ['велосипед', 'ве-ло-си-пед', '🚲', 4], ['крокодил', 'кро-ко-дил', '🐊', 4], ['светофор', 'све-то-фор', '🚦', 4],
  ['телефон', 'те-ле-фон', '📱', 4], ['снеговик', 'сне-го-вик', '⛄', 4], ['апельсин', 'а-пель-син', '🍊', 4], ['обезьяна', 'о-бе-зья-на', '🐒', 4],
];
const RW = RWORDS.map(([w, s, e, k]) => ({ w, s: s.split('-'), e, k }));
const RW_BY = {}; RW.forEach(x => { RW_BY[x.w.toLowerCase()] = x; });
// картинки, которые ребёнок может назвать иначе («каша» — «миска», «ягода» — «клубника»), не годятся для «слог → картинка»
const SYLPIC_SKIP = new Set(['каша', 'кино', 'лупа', 'кекс', 'рак', 'мыло', 'пила', 'ноты', 'сани', 'панама', 'ягода', 'пальто', 'конь', 'вишня', 'соль', 'бант', 'мост', 'юла', 'будка', 'алмаз', 'зонтик', 'белка', 'гора', 'дерево', 'носки', 'лопата']);
const firstSyl = w => { const u = w.toUpperCase(); return (u.length >= 2 && /[БВГДЖЗЙКЛМНПРСТФХЦЧШЩ]/.test(u[0]) && SYL_V.includes(u[1])) ? u.slice(0, 2) : ''; };
// every picture the game knows (reading words + alphabet words), one picture per word
const PICS = (() => {
  const seen = new Set(), out = [];
  const add = (w, e) => { const k = w.toLowerCase(); if (seen.has(k) || seen.has(e)) return; seen.add(k); seen.add(e); out.push({ w, e, fs: (SYLPIC_SKIP.has(k) || w[0] !== k[0]) ? '' : firstSyl(w) }); };
  RW.forEach(x => add(x.w, x.e)); LDATA.forEach(d => d[4].forEach(([w, e]) => add(w, e)));
  return out;
})();
// [вопрос, ответ (1 — да), уровень]
const YESNO = [
  ['Кот лает?', 0, 7], ['Собака лает?', 1, 7], ['Рыба плавает?', 1, 7], ['Слон летает?', 0, 7], ['Лимон сладкий?', 0, 7],
  ['Снег белый?', 1, 7], ['Ёж колючий?', 1, 7], ['Винни — собака?', 1, 7], ['Элли — кошка?', 0, 7], ['Даниил — малыш?', 1, 7],
  ['Мяч круглый?', 1, 7], ['Танк умеет летать?', 0, 7], ['Луна — это сыр?', 0, 7], ['Рыбы живут в воде?', 1, 7],
  ['Герда живёт на улице?', 1, 8], ['Винни белый?', 1, 8], ['Герда зелёная?', 0, 8], ['У папы есть хвост?', 0, 8],
  ['Сова — это птица?', 1, 8], ['Лев — это птица?', 0, 8], ['Кит живёт в море?', 1, 8], ['Жираф маленький?', 0, 8],
  ['Суп едят ложкой?', 1, 8], ['Ракета летит в космос?', 1, 8], ['Корова говорит «мяу»?', 0, 8], ['У кошки четыре лапы?', 1, 8],
  ['Мама и папа любят Максима?', 1, 8], ['Малыш Даниил водит танк?', 0, 8], ['Супер-Макс победил Глюка?', 1, 8],
  ['Зимой идёт снег?', 1, 8], ['Утка умеет плавать?', 1, 8], ['Арбуз растёт на ёлке?', 0, 8],
];
// [история, вопрос, [верная картинка, неверная, неверная], уровень]
const STORIES = [
  ['Винни нашёл мяч.', 'Что нашёл Винни?', ['⚽', '🦴', '🎁'], 8],
  ['Мама купила яблоки.', 'Что купила мама?', ['🍎', '🍌', '🍉'], 8],
  ['Папа строит дом.', 'Что строит папа?', ['🏠', '🚀', '🚗'], 8],
  ['Малыш Даниил пьёт молоко.', 'Что пьёт Даниил?', ['🥛', '🧃', '☕'], 8],
  ['Кот поймал рыбу.', 'Кого поймал кот?', ['🐟', '🐭', '🦆'], 8],
  ['Максим едет на велосипеде.', 'На чём едет Максим?', ['🚲', '🛴', '🚗'], 9],
  ['Герда живёт в будке. Она охраняет дом.', 'Где живёт Герда?', ['#kennel', '🏠', '🌲'], 9],
  ['Глюк украл алмаз. Супер-Макс догнал Глюка!', 'Что украл Глюк?', ['#gem', '#star', '👑'], 9],
  ['Элли спит на диване. Винни играет.', 'Кто спит?', ['#dog_elli', '#dog_vinni', '#dog_gerda'], 9],
  ['Зимой Максим лепит снеговика.', 'Кого лепит Максим?', ['⛄', '🦖', '🤖'], 9],
  ['У Максима три собаки. Самая большая — Герда.', 'Кто самая большая?', ['#dog_gerda', '#dog_vinni', '#dog_elli'], 10],
  ['Папа и Максим играют в танчики.', 'Во что они играют?', ['#i_tank', '⚽', '🎸'], 10],
  ['Мама печёт пирог. Пахнет яблоками.', 'Что печёт мама?', ['🥧', '🍕', '🍦'], 10],
];
const RD_PLAN = [
  { sylRun: 2, sylEar: 2 },
  { sylRun: 1, sylEar: 2, sylPic: 2 },
  { sylEar: 1, sylPic: 2, wordPic: 2, build: 1 },
  { sylPic: 1, wordPic: 3, wordEar: 2, build: 2 },
  { wordPic: 3, wordEar: 2, build: 2, yesNo: 1 },
  { wordPic: 3, wordEar: 2, build: 2, yesNo: 2 },
  { wordPic: 2, wordEar: 2, build: 1, yesNo: 3 },
  { wordPic: 2, wordEar: 1, yesNo: 3, story: 2 },
  { wordPic: 1, wordEar: 1, yesNo: 2, story: 3 },
  { wordPic: 1, wordEar: 1, yesNo: 2, story: 4 },
];
const RD_DESC = ['слоги из М, Н, Л, С с гласными А, О, У', 'все слоги с Ы и И, слог → картинка', 'слова из двух слогов', 'слова из двух слогов и короткие слова', 'похожие слова (кот — кит)', 'слова из трёх слогов', 'предложения «да или нет»', 'длинные слова, первые истории', 'маленькие истории', 'истории и длинные слова'];

/* ---------- numbers data ---------- */
const N_ONES = ['ноль', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять', 'десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'];
const N_TENS = ['', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'];
function numWord(n) { if (n < 20) return N_ONES[n]; if (n >= 100) return 'сто'; const t = Math.floor(n / 10), o = n % 10; return N_TENS[t] + (o ? ' ' + N_ONES[o] : ''); }
const numKey = n => cap(numWord(+n)) + '!';
const NM_RANGE = [[1, 10], [1, 20], [5, 30], [10, 50], [10, 50], [10, 100], [20, 100], [20, 100], [30, 100], [30, 100]];
const COUNT_ITEMS = ['#gem', '#star', '#i_tank', '🍎', '🎈', '🐟', '🍓', '🦆', '🚗', '🐞', '⚽', '🌸'];
// задачки: текст читает голос, картинки помогают посчитать
const NWP = [
  { t: 'У Винни три косточки. Элли принесла ещё две. Сколько косточек стало у Винни?', a: 3, b: 2, op: '+', e: '🦴', L: 2 },
  { t: 'У Максима четыре шарика. Папа подарил ещё три. Сколько шариков стало?', a: 4, b: 3, op: '+', e: '🎈', L: 3 },
  { t: 'У Максима семь алмазов. Два алмаза он потратил на стройке. Сколько алмазов осталось?', a: 7, b: 2, op: '-', e: '#gem', L: 3 },
  { t: 'У малыша Даниила пять игрушек. Две он уронил. Сколько игрушек осталось у Даниила?', a: 5, b: 2, op: '-', e: '🧸', L: 3 },
  { t: 'В гараже три танка. Приехали ещё четыре. Сколько танков стало в гараже?', a: 3, b: 4, op: '+', e: '#i_tank', L: 3 },
  { t: 'Глюк украл девять звёзд. Супер-Макс вернул шесть. Сколько звёзд ещё у Глюка?', a: 9, b: 6, op: '-', e: '#star', L: 4 },
  { t: 'Папа купил пять яблок, а мама — ещё пять. Сколько всего яблок?', a: 5, b: 5, op: '+', e: '🍎', L: 4 },
  { t: 'Герда нашла шесть палочек, а Винни — две. Сколько палочек нашли собаки?', a: 6, b: 2, op: '+', e: '🪵', L: 4 },
  { t: 'Мама испекла двенадцать печений. Папа съел два. Сколько печений осталось?', a: 12, b: 2, op: '-', e: '🍪', L: 5 },
  { t: 'В пруду плавали десять уточек. Прилетели ещё пять. Сколько уточек стало?', a: 10, b: 5, op: '+', e: '🦆', L: 5 },
  { t: 'На стройке десять блоков. Динамит взорвал четыре. Сколько блоков осталось?', a: 10, b: 4, op: '-', e: '🧱', L: 5 },
  { t: 'У Элли было пятнадцать косточек. Пять она спрятала. Сколько косточек осталось?', a: 15, b: 5, op: '-', e: '🦴', L: 6 },
  { t: 'У Максима двадцать алмазов. Он нашёл ещё десять. Сколько алмазов стало?', a: 20, b: 10, op: '+', e: '#gem', L: 6 },
  { t: 'Максим построил восемь домиков, а папа — ещё пять. Сколько домиков построили вместе?', a: 8, b: 5, op: '+', e: '🏠', L: 7 },
  { t: 'У Глюка было тридцать танков. Супер-Макс подбил двадцать. Сколько танков осталось у Глюка?', a: 30, b: 20, op: '-', e: '#i_tank', L: 7 },
  { t: 'Даниил получил шесть кубиков, а потом ещё семь. Сколько кубиков у Даниила?', a: 6, b: 7, op: '+', e: '🧸', L: 8 },
];
const NM_PLAN = [
  { count: 3, find: 2, compare: 2, arith: 1 },
  { count: 2, find: 2, missing: 2, compare: 1, arith: 2, word: 1 },
  { count: 2, find: 2, missing: 2, compare: 1, arith: 2, word: 1 },
  { count: 2, find: 2, missing: 2, compare: 1, arith: 2, word: 1 },
  { count: 1, find: 2, missing: 2, compare: 1, arith: 3, word: 2 },
  { find: 1, missing: 2, compare: 1, arith: 3, bond: 2, word: 2 },
  { find: 1, missing: 2, compare: 1, arith: 3, bond: 1, word: 2 },
  { missing: 2, compare: 1, arith: 4, bond: 1, word: 2 },
  { missing: 2, compare: 1, arith: 4, bond: 1, word: 2 },
  { missing: 2, compare: 1, arith: 4, bond: 1, word: 2 },
];
const NM_DESC = ['счёт до 10, плюс до 5 с картинками', 'счёт до 15, числа до 20, плюс до 10', 'числа до 30, плюс и минус до 10', 'десятки и единицы до 50', 'плюс и минус до 10 без картинок', 'до 20 без перехода, состав числа, числа до 100', 'круглые десятки, переход через десяток', 'двузначное ± однозначное', '±10, переход через десяток без картинок', 'двузначное ± двузначное'];

/* ---------- phrase keys ---------- */
const sylKey = s => cap(String(s).toLowerCase()) + '!';                    // «Ма!»
const drawKey = s => { const c = s[0].toLowerCase(), v = s.slice(1).toLowerCase(); return c + c + c + '-' + v + v; };   // «ммм-аа»: тянем слог
const wordKey = w => cap(w) + '!';
function learnPhrases(out) {
  SYL_ALL.forEach(s => { out.add(sylKey(s)); out.add(drawKey(s)); });
  RW.forEach(w => { out.add(wordKey(w.w)); w.s.forEach(s => out.add(sylKey(s))); });
  PICS.forEach(p => out.add(wordKey(p.w)));
  YESNO.forEach(q => out.add(q[0]));
  STORIES.forEach(s => { out.add(s[0]); out.add(s[1]); });
  for (let n = 1; n <= 100; n++) out.add(numKey(n));
  NWP.forEach(p => out.add(p.t));
}
// what the speech synthesizer should read instead (the synthesizer stresses the word «сорок» wrongly, digits are read right)
function sayAs() { const o = {}; for (let n = 40; n <= 49; n++) o[numKey(n)] = n + '!'; return o; }

/* ---------- memory & adaptivity ---------- */
function rxRec(k, good) { if (!S.rx) S.rx = {}; const r = S.rx[k] || (S.rx[k] = [0, 0, 0]); r[0]++; if (good) r[1]++; r[2] = Date.now(); }
const rxErr = k => { const r = S.rx && S.rx[k]; return r ? (r[0] - r[1] + 1) / (r[0] + 2) : .5; };
function rxPick(items, keyOf, avoid = []) {
  const now = Date.now();
  const ws = items.map(x => { const k = keyOf(x); if (avoid.includes(k)) return .001; const r = S.rx && S.rx[k]; if (!r) return 3; return .5 + 3 * rxErr(k) + Math.min(2, (now - r[2]) / 864e5); });
  let t = Math.random() * ws.reduce((a, b) => a + b, 0);
  for (let i = 0; i < items.length; i++) { t -= ws[i]; if (t <= 0) return items[i]; }
  return items[items.length - 1];
}
function lvAdapt(k, r) {
  const st = k + 'S', bd = k + 'B';
  if (r.first) { S[bd] = 0; S[st] = (S[st] || 0) + 1; if (S[st] >= 4 && S[k] < 10) { S[k]++; S[st] = 0; save(); return 1; } }
  else { S[st] = 0; if (r.wrong >= 2) { S[bd] = (S[bd] || 0) + 1; if (S[bd] >= 2 && S[k] > 1) { S[k]--; S[bd] = 0; save(); return -1; } } else S[bd] = 0; }
  save(); return 0;
}
function wpick(o) { const ks = Object.keys(o); let r = Math.random() * ks.reduce((s, k) => s + o[k], 0); for (const k of ks) { r -= o[k]; if (r <= 0) return k; } return ks[ks.length - 1]; }
function planKinds(table, n) {
  const out = [];
  for (let i = 0; i < n; i++) { let k, tries = 0; do { k = wpick(table); } while (tries++ < 10 && out.length >= 2 && out[out.length - 1] === k && out[out.length - 2] === k); out.push(k); }
  return out;
}
function remember(run, k) { run.recent.push(k); if (run.recent.length > 12) run.recent.shift(); return k; }

/* ---------- shared visuals ---------- */
const rdUp = () => !(S.lower && S.rl >= 5);                  // большие буквы, пока не выучены строчные
const rdTx = s => rdUp() ? s.toUpperCase() : s;
const vowHTML = s => [...s].map(ch => isVow(ch) ? `<b class="vw">${esc(ch)}</b>` : esc(ch)).join('');
function readHTML(text, o = {}) {
  const color = o.color ?? S.rl <= 6, f = s => color ? vowHTML(rdTx(s)) : esc(rdTx(s));
  if (o.syl) return `<span class="rword${S.rl > 8 ? ' noarc' : ''}">${o.syl.map(s => `<span class="sy" data-s="${esc(s)}">${f(s)}</span>`).join('')}</span>`;
  return `<span class="rtext">${f(text)}</span>`;
}
const picFace = e => e.charAt(0) === '#' ? `<img class="spr" src="${SPRU[sprKey(e.slice(1))]}" alt="">` : esc(e);
const pcardHTML = (k, e) => `<button class="pcard" data-c="${esc(k)}"><span class="emo">${picFace(e)}</span></button>`;
const pboxHTML = e => `<div class="pbox"><span class="emo">${picFace(e)}</span></div>`;
async function popCard(b) {
  const [x, y] = FX.center(b);
  FX.spawn(x, y, ['#ffc62e', '#39e3dc', '#ffffff', '#5cb84a'], 24);
  FX.burst(x, y - b.offsetHeight * .5, pick(['ДА!', 'ЕСТЬ!', 'УРА!', 'ТОЧНО!']), { fs: clamp(b.offsetWidth * .2, 26, 46) });
  Sfx.good(); b.classList.add('ok');
  await sleep(380);
}
// буква бежит к букве и превращается в слог
async function runTo(cb, b, s, low, dur = 650) {
  const a = cb.getBoundingClientRect(), z = b.getBoundingClientRect();
  const dx = z.left + z.width / 2 - (a.left + a.width / 2), dy = z.top + z.height / 2 - (a.top + a.height / 2);
  Sfx.whoosh();
  if (cb.animate) {
    const an = cb.animate([{ transform: 'translate(0,0) scale(1)' }, { transform: `translate(${dx * .55}px,${dy * .55 - 30}px) scale(1.05)`, offset: .55 }, { transform: `translate(${dx}px,${dy}px) scale(${(z.width / (a.width || 1)).toFixed(3)})` }], { duration: dur, easing: 'ease-in', fill: 'forwards' });
    try { await an.finished; } catch (e) { /* cancelled */ }
  } else await sleep(dur);
  cb.style.visibility = 'hidden';
  const f = b.querySelector('.face span'); if (f) f.textContent = low ? s.toLowerCase() : s;
  b.classList.add('w2', 'merged');
  const [x, y] = FX.center(b); FX.spawn(x, y, ['#ffc62e', '#e8363f', '#ffffff', '#2a6cf0'], 28); Sfx.good();
  b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
  await sleep(200);
}
const tileHTML = (key, label, tex) => `<button class="lb${label.length > 1 ? ` w${Math.min(4, label.length)}` : ''}" data-c="${esc(key)}" data-l="${esc(label)}" data-tex="${tex}" style="--tex:url(${TEX[tex].url})" aria-label="${esc(label)}"><span class="face"><span>${esc(label)}</span></span></button>`;

/* ---------- reading tasks ---------- */
const rdKnown = s => [...s.toUpperCase()].every(ch => !LET[ch] || S.L[ch].u);
function rdSylPool(L = S.rl) {
  const cons = L <= 1 ? SYL_C[0] : L <= 2 ? SYL_C[0] + SYL_C[1] : SYL_C.join(''), vows = L <= 1 ? 'АОУ' : SYL_V;
  const p = SYL_ALL.filter(s => cons.includes(s[0]) && vows.includes(s[1]));
  const k = p.filter(rdKnown); return k.length >= 6 ? k : p;
}
const rdSylPick = run => remember(run, rxPick(rdSylPool(), x => x, run.recent));
const rdTiers = L => L <= 3 ? [1] : L === 4 ? [1, 2] : L === 5 ? [2, 3] : L === 6 ? [3] : L === 7 ? [3, 4] : [4, 3];
function sylDecoys(s, n, L) {
  const pool = SYL_ALL.filter(x => x !== s && (rdKnown(x) || unlocked().length < 8));
  const sameC = shuffle(pool.filter(x => x[0] === s[0] && !confusable(s, x))), sameV = shuffle(pool.filter(x => x[1] === s[1] && x[0] !== s[0])), other = shuffle(pool.filter(x => x[0] !== s[0] && x[1] !== s[1]));
  const out = [], take = (arr, k) => { while (out.length < k && arr.length) { const x = arr.pop(); if (!out.includes(x)) out.push(x); } };
  if (L <= 1) take(other, n);
  else if (L === 2) { take(sameC, Math.ceil(n * .6)); take(other, n); }
  else { take(sameC, Math.ceil(n / 2)); take(sameV, n - 1); take(other, n); }
  take(shuffle([...sameC, ...sameV, ...other]), n);
  return out.slice(0, n);
}
async function rdAfter(run, r, key, phr, item) {
  if (!run.alive) throw STOP;
  rxRec(key, r.first); if (item) run.items.push(item);
  const up = lvAdapt('rl', r);
  await rs(run, phr);
  if (up > 0) await lvlUp(run, S.rl);
}

async function rdBlendDemo(run, s) {
  const low = !rdUp(), c = s[0], v = s[1];
  const root = setStage(`<div class="task blend"><div class="banner">БУКВА К БУКВЕ!</div><div class="bl-row"><div class="bl-c">${blockHTML(c, low, 'gold')}</div><div class="bl-road"><i></i></div><div class="bl-v">${blockHTML(v, low, 'red')}</div></div></div>`);
  const cb = $('.bl-c .lb', root), vb = $('.bl-v .lb', root);
  run.prompt = () => say([drawKey(s), sylKey(s)]);
  await rs(run, T.blend);
  const p = rs(run, drawKey(s));
  await runTo(cb, vb, s, low, 1000);
  await p;
  await rs(run, sylKey(s));
  await rsleep(run, 250);
}

async function rdSylRun(t, run) {
  const s = rdSylPick(run), c = s[0], v = s[1], low = !rdUp();
  const vs = [...SYL_V].filter(x => !SYL_BAD.has(c + x) && !confusable(s, c + x));
  const root = setStage(`<div class="task srun">${promptHTML('Помоги букве добежать!')}<div class="srun-body"><div class="srun-c">${blockHTML(c, low, 'gold')}</div><div class="srun-road"><i></i></div><div class="opts srun-v"></div></div></div>`);
  const cb = $('.srun-c .lb', root); cb.tabIndex = -1;
  cb.addEventListener('click', () => { if (run.prompt) run.prompt(); });
  run.prompt = () => say([T.sylRunQ, drawKey(s), sylKey(s)]);
  run.prompt();
  const r = await choiceRound(run, {
    target: v, letters: shuffle(vs), low, box: $('.srun-v', root), maxBs: 120, dog: false,
    wrongSay: ch => [sylKey(c + ch), T.needSyl, sylKey(s)],
    good: b => runTo(cb, b, s, low),
  });
  await rdAfter(run, r, s, [drawKey(s), sylKey(s), praise()], s);
}

async function rdSylEar(t, run) {
  const s = rdSylPick(run), L = S.rl, low = !rdUp();
  if (!(S.rx && S.rx[s]) || (L <= 2 && Math.random() < .3)) await rdBlendDemo(run, s);
  const n = L <= 1 ? 3 : L <= 2 ? 4 : L <= 4 ? 5 : 6;
  const opts = shuffle([s, ...sylDecoys(s, n - 1, L)]);
  const extra = hasVoice() ? '' : `<span class="tgt">${low ? s.toLowerCase() : s}</span>`;
  const root = setStage(`<div class="task find">${promptHTML('Найди слог', extra)}${SPEED}<div class="opts"></div></div>`);
  run.prompt = () => say([T.findSyl, sylKey(s)]);
  run.prompt();
  const fast = L >= 3 ? 4200 + 400 * Math.max(0, 7 - L) : 0;
  const r = await choiceRound(run, { target: s, letters: opts, low, box: $('.opts', root), maxBs: 180, speed: fast ? $('.speed', root) : null, fast, dog: L <= 2,
    wrongSay: ch => [sylKey(ch), T.needSyl, sylKey(s)] });
  await rdAfter(run, r, s, [praise(), sylKey(s)], s);
}

async function rdSylPic(t, run) {
  const L = S.rl, pool = rdSylPool(Math.max(L, 2));
  const cands = PICS.filter(p => p.fs && pool.includes(p.fs));
  const tgt = rxPick(cands, p => p.fs, run.recent), s = tgt.fs; remember(run, s);
  const n = L <= 2 ? 3 : 4;
  const dec = PICS.filter(p => p.fs && p.fs !== s);
  const ds = [], take = (arr, k) => { while (ds.length < k && arr.length) { const p = arr.pop(); if (!ds.some(d => d.fs === p.fs)) ds.push(p); } };
  if (L >= 3) take(shuffle(dec.filter(p => p.fs[0] === s[0])), n - 1);
  take(shuffle(dec.filter(p => p.fs[0] !== s[0] && p.fs[1] !== s[1])), n - 1);
  take(shuffle(dec), n - 1);
  const items = shuffle([tgt, ...ds]);
  const root = setStage(`<div class="task rd">${promptHTML('Прочитай слог')}<div class="rd-show"><div class="rd-word syl">${readHTML(s, { color: L <= 4 })}</div></div><div class="opts"></div></div>`);
  run.prompt = () => say(T.sylPicQ);
  run.prompt();
  const r = await choiceRound(run, { target: tgt.w, letters: items.map(p => p.w), render: k => pcardHTML(k, items.find(p => p.w === k).e), sel: '.pcard', box: $('.opts', root), maxBs: 190, good: popCard, dog: false,
    wrongSay: (k, w) => w >= 2 ? [wordKey(k), T.itsWritten, sylKey(s)] : [wordKey(k), T.readAgain] });
  await rdAfter(run, r, s, [sylKey(s), wordKey(tgt.w), praise()], s);
}

async function rdWordPic(t, run) {
  const L = S.rl, tiers = rdTiers(L);
  const w = remember(run, rxPick(RW.filter(x => tiers.includes(x.k)), x => x.w, run.recent).w), item = RW_BY[w.toLowerCase()];
  const n = L >= 6 ? 4 : 3, first = w[0].toLowerCase();
  const dec = RW.filter(x => x !== item && x.e !== item.e);
  const same = shuffle(dec.filter(x => x.w[0].toLowerCase() === first)), diff = shuffle(dec.filter(x => x.w[0].toLowerCase() !== first));
  const ds = L >= 4 ? same.slice(0, n - 1) : [];
  while (ds.length < n - 1 && diff.length) ds.push(diff.pop());
  const items = shuffle([item, ...ds]);
  const hint = L <= 6;
  const root = setStage(`<div class="task rd">${promptHTML('Прочитай слово')}<div class="rd-show"><div class="rd-word${hint ? ' tap' : ''}">${readHTML(w, { syl: item.s })}</div></div><div class="opts"></div></div>`);
  if (hint) $('.rd-word', root).addEventListener('click', e => { const sy = e.target.closest('.sy'); if (!sy) return; Sfx.tap(); sy.classList.remove('say'); void sy.offsetWidth; sy.classList.add('say'); say(sylKey(sy.dataset.s)); });
  run.prompt = () => say(T.wordPicQ);
  run.prompt();
  const r = await choiceRound(run, { target: w, letters: items.map(x => x.w), render: k => pcardHTML(k, RW_BY[k.toLowerCase()].e), sel: '.pcard', box: $('.opts', root), maxBs: 190, good: popCard, dog: false,
    wrongSay: (k, c) => c >= 2 ? [T.bySyl, ...item.s.map(sylKey), wordKey(w)] : [wordKey(k), T.readAgain] });
  await rdAfter(run, r, w, [wordKey(w), praise()], w);
}

const C_SWAP = { к: 'тгх', т: 'кдп', д: 'тб', б: 'пд', п: 'бт', м: 'нл', н: 'мл', л: 'мр', р: 'лн', с: 'зш', з: 'сж', ш: 'сж', ж: 'шз', в: 'фб', г: 'кх', х: 'кг', ч: 'щц' };
function variants(W) {
  const a = [...W], out = new Set();
  a.forEach((ch, i) => {
    if ('аоуиы'.includes(ch)) for (const v of 'аоуиы') if (v !== ch) { const b = a.slice(); b[i] = v; out.add(b.join('')); }
    if (C_SWAP[ch] && (i === 0 || i === a.length - 1)) for (const c of C_SWAP[ch]) { const b = a.slice(); b[i] = c; out.add(b.join('')); }
  });
  return [...out].filter(x => x !== W && !/[кгхжшчщ]ы|[чщ][яю]|^ы|[ьъ][аоуиы]/.test(x));
}
function wordDecoys(item, n, L) {
  const W = item.w.toLowerCase(), named = item.w[0] !== W[0], out = [];
  const fix = x => named ? cap(x) : x;
  const real = shuffle(RW.filter(x => x !== item && x.k === item.k && x.e !== item.e)).sort((p, q) => (q.w[0].toLowerCase() === W[0]) - (p.w[0].toLowerCase() === W[0])).map(x => x.w);
  const fake = shuffle(variants(W)).map(fix);
  const swap = item.s.length === 2 ? [fix((item.s[1] + item.s[0]).toLowerCase())] : [];
  const add = x => { if (x && x.toLowerCase() !== W && !out.some(y => y.toLowerCase() === x.toLowerCase())) out.push(x); };
  if (L <= 4) real.slice(0, n).forEach(add);
  else { fake.slice(0, L >= 7 ? 2 : 1).forEach(add); if (L >= 6) swap.forEach(add); real.forEach(x => { if (out.length < n) add(x); }); }
  [...fake, ...real].forEach(x => { if (out.length < n) add(x); });
  return out.slice(0, n);
}
async function rdWordEar(t, run) {
  const L = S.rl, tiers = rdTiers(L);
  const item = rxPick(RW.filter(x => tiers.includes(x.k)), x => x.w, run.recent), w = remember(run, item.w);
  const n = L >= 6 ? 4 : 3, showPic = L <= 5;
  const opts = shuffle([w, ...wordDecoys(item, n - 1, L)]);
  const root = setStage(`<div class="task rd">${promptHTML('Найди слово')}${showPic ? `<div class="rd-show">${pboxHTML(item.e)}</div>` : ''}<div class="wopts"></div></div>`);
  run.prompt = () => say([T.findWord, wordKey(w)]);
  run.prompt();
  const r = await choiceRound(run, { target: w, letters: opts, render: k => `<button class="wcard" data-c="${esc(k)}">${readHTML(k, { color: L <= 6 })}</button>`, sel: '.wcard', box: $('.wopts', root), fit: false, good: popCard, dog: false,
    wrongSay: (k, c) => c >= 2 ? [T.bySyl, ...item.s.map(sylKey), wordKey(w)] : [T.readAgain, wordKey(w)] });
  await rdAfter(run, r, w, [praise(), wordKey(w)], w);
}

async function rdBuild(t, run) {
  const L = S.rl, tiers = L <= 4 ? [1] : L <= 6 ? [1, 3] : [3, 4];
  const item = rxPick(RW.filter(x => tiers.includes(x.k) && x.s.length >= 2 && x.s.length <= (L <= 6 ? 3 : 4)), x => x.w, run.recent), w = remember(run, item.w);
  const low = !rdUp(), nd = L <= 4 ? 2 : 3;
  const mine = new Set(item.s.map(x => x.toUpperCase()));
  const all = [...new Set([...SYL_ALL, ...(L <= 4 ? [] : RW.flatMap(x => x.s.map(y => y.toUpperCase())))])].filter(x => !mine.has(x) && x.length <= 4);
  const near = shuffle(all.filter(x => item.s.some(y => { const Y = y.toUpperCase(); return x[0] === Y[0] || x[x.length - 1] === Y[Y.length - 1]; })));
  const ds = near.slice(0, nd); shuffle(all).forEach(x => { if (ds.length < nd && !ds.includes(x)) ds.push(x); });
  const texs = shuffle(BLOCK_TEX);
  const tiles = shuffle([...item.s.map(x => ({ k: x.toUpperCase(), l: low ? x : x.toUpperCase() })), ...ds.map(x => ({ k: x, l: low ? x.toLowerCase() : x }))]);
  const root = setStage(`<div class="task rbuild">${promptHTML('Собери слово')}<div class="rb-top">${pboxHTML(item.e)}<div class="rb-slots">${item.s.map(() => '<span class="rb-slot"></span>').join('')}</div></div><div class="opts rb-opts"></div></div>`);
  const box = $('.rb-opts', root), slots = $$('.rb-slot', root);
  box.innerHTML = tiles.map((x, i) => tileHTML(x.k, x.l, texs[i % texs.length])).join('');
  curFit = () => fitOpts(box, tiles.length, 150); curFit();
  $('.pbox', root).addEventListener('click', () => { Sfx.tap(); say(wordKey(w)); });
  run.prompt = () => say([T.buildQ, wordKey(w)]);
  run.prompt();
  window.__target = item.s.map(x => x.toUpperCase());
  const r = await new Promise(resolve => {
    let idx = 0, wrong = 0, done = false, lastAct = Date.now(), nags = 0;
    const idle = setInterval(() => {
      if (done || !run.alive || !box.isConnected) { clearInterval(idle); return; }
      if (!Voice.busy && Date.now() - lastAct > 13000 && nags < 3) { lastAct = Date.now(); nags++; run.prompt(); }
    }, 1000);
    box.addEventListener('click', e => {
      lastAct = Date.now();
      const b = e.target.closest('.lb'); if (!b || done || !run.alive || b.dataset.used) return;
      const need = item.s[idx].toUpperCase();
      if (b.dataset.c === need) {
        b.dataset.used = '1'; $$('.lb', box).forEach(x => x.classList.remove('hint')); Sfx.place();
        const sl = slots[idx]; sl.textContent = b.dataset.l; sl.classList.add('on'); b.classList.add('used');
        idx++;
        if (idx >= item.s.length) { done = true; clearInterval(idle); resolve({ first: wrong === 0, wrong }); }
        else say(sylKey(need));
      } else {
        wrong++; Sfx.bad(); b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake');
        const ph = [sylKey(b.dataset.c)];
        if (wrong >= 2) { ph.push(T.needSyl, sylKey(need)); const h = $$('.lb', box).find(x => !x.dataset.used && x.dataset.c === need); if (h) h.classList.add('hint'); }
        say(ph);
      }
    });
  });
  if (!run.alive) throw STOP;
  const sw = $('.rb-slots', root); const [x, y] = FX.center(sw);
  FX.spawn(x, y, ['#ffc62e', '#39e3dc', '#ffffff'], 30); FX.burst(x, y - sw.offsetHeight * .7, 'СЛОВО!', { fs: 44 }); Sfx.good();
  sw.classList.add('ok');
  const g = r.first ? 2 : 1; addGems(g, sw); run.earned += g;
  await rdAfter(run, r, w, [wordKey(w), praise()], w);
}

async function rdYesNo(t, run) {
  const L = S.rl, q = rxPick(YESNO.filter(x => x[2] <= Math.max(L, 7)), x => x[0], run.recent); remember(run, q[0]);
  const ans = q[1] ? 'да' : 'нет';
  const root = setStage(`<div class="task rd">${promptHTML('Да или нет?')}<div class="rd-show"><div class="rd-sent">${readHTML(q[0], { color: L <= 7 })}</div></div><div class="yn-row"></div></div>`);
  run.prompt = () => say(T.yesNoQ);
  run.prompt();
  const r = await choiceRound(run, { target: ans, letters: ['да', 'нет'], render: k => `<button class="yn ${k === 'да' ? 'yes' : 'no'}" data-c="${k}">${sprImg(k === 'да' ? 'i_check' : 'i_cross')}<span>${esc(rdTx(k))}</span></button>`, sel: '.yn', box: $('.yn-row', root), fit: false, good: popCard, dog: false,
    wrongSay: () => [T.readAgain] });
  await rdAfter(run, r, q[0], [q[0], q[1] ? T.yes : T.no, praise()], null);
}

async function rdStory(t, run) {
  const L = S.rl, st = rxPick(STORIES.filter(x => x[3] <= Math.max(L, 8)), x => x[0], run.recent); remember(run, st[0]);
  const root = setStage(`<div class="task rd story">${promptHTML('Прочитай и ответь')}<div class="rd-story"><p class="st-text">${readHTML(st[0], { color: false })}</p><p class="st-q">${readHTML(st[1], { color: false })}</p></div><div class="opts"></div></div>`);
  run.prompt = () => say(T.storyQ);
  run.prompt();
  const r = await choiceRound(run, { target: '0', letters: shuffle(['0', '1', '2']), render: k => pcardHTML(k, st[2][+k]), sel: '.pcard', box: $('.opts', root), maxBs: 170, good: popCard, dog: false,
    wrongSay: (k, c) => c >= 2 ? [st[0], st[1]] : [T.readAgain] });
  await rdAfter(run, r, st[0], [praise(), st[0]], null);
}

async function rdArcade(t, run) {
  const all = rdSylPool(Math.max(S.rl, 2)), low = !rdUp();
  const weak = shuffle(all).sort((a, b) => rxErr(b) - rxErr(a));
  const s = pick(weak.slice(0, 5)), pool = all.filter(x => !confusable(s, x));
  const look = shuffle(pool.filter(x => x !== s && (x[0] === s[0] || x[1] === s[1]))).slice(0, 4);
  const r = await arcadeRound(run, s, { boss: true, pool, look, low, label: 'Лови слог', sayIt: () => [T.catchSyl, sylKey(s)], sayThis: ch => sylKey(ch) });
  if (!run.alive) throw STOP;
  rxRec(s, r.hits >= r.need); run.items.push(s);
  const up = arcAdapt(r);
  await rs(run, r.hits >= r.need ? T.shot3 : r.hits >= Math.ceil(r.need / 2) ? T.shot2 : T.shot1);
  if (up > 0) await lvlUp(run, S.al);
}

const RD = { sylRun: rdSylRun, sylEar: rdSylEar, sylPic: rdSylPic, wordPic: rdWordPic, wordEar: rdWordEar, build: rdBuild, yesNo: rdYesNo, story: rdStory, arcade: rdArcade };

/* ---------- number tasks ---------- */
function numPick(run, lo, hi) { let n = ri(lo, hi), k = 0; while (k++ < 12 && run.recent.includes('n' + n)) n = ri(lo, hi); remember(run, 'n' + n); return n; }
function numDecoys(n, k, o = {}) {
  const lo = Math.max(1, o.min ?? 1), hi = o.max ?? 100, out = [];
  const add = v => { if (Number.isInteger(v) && v >= lo && v <= hi && v !== n && !out.includes(v)) out.push(v); };
  if (n >= 12 && n % 10 && n % 10 !== Math.floor(n / 10) && n < 100) add((n % 10) * 10 + Math.floor(n / 10));   // 23 ↔ 32
  (o.extra || []).forEach(add);
  shuffle([n + 1, n - 1]).forEach(add);
  shuffle(n >= 20 || o.tens ? [n + 10, n - 10, n + 2, n - 2] : [n + 2, n - 2, n + 3]).forEach(add);
  let guard = 0; while (out.length < k && guard++ < 200) add(ri(lo, hi));
  return out.slice(0, k);
}
const cells = (n, e, cls) => Array.from({ length: n }, () => `<i class="${cls}">${picFace(e)}</i>`).join('');
function framesHTML(n, e) {   // десятки как в рамке 2×5
  let h = '';
  for (let f = 0; f * 10 < n; f++) { const k = Math.min(10, n - f * 10); h += `<div class="tf">${cells(k, e, 'on cntme')}${'<i></i>'.repeat(10 - k)}</div>`; }
  return `<div class="tfs">${h}</div>`;
}
function rodsHTML(n) {   // палочки-десятки и кубики-единицы
  const t = Math.floor(n / 10), o = n % 10;
  return `<div class="rods">${Array.from({ length: t }, () => `<div class="rod cntme">${'<i></i>'.repeat(10)}</div>`).join('')}${o ? `<div class="ones">${'<i class="cntme"></i>'.repeat(o)}</div>` : ''}</div>`;
}
function groupsHTML(ex, e) {
  if (ex.op === '+') return `<div class="grp">${cells(ex.a, e, 'cntme')}</div><span class="grp-op">+</span><div class="grp">${cells(ex.b, e, 'cntme')}</div>`;
  return `<div class="grp">${Array.from({ length: ex.a }, (_, i) => i >= ex.a - ex.b ? `<i class="x"><span>${picFace(e)}</span></i>` : `<i class="cntme">${picFace(e)}</i>`).join('')}</div>`;
}
// «Давай посчитаем вместе!» — предметы по очереди подсвечиваются, голос считает
async function countAlong(run, root, flag) {
  const els = $$('.cntme', root); if (!els.length) return;
  await say(T.countTogether);
  let k = 0;
  for (const el of els) {
    if (flag.stop || !run.alive || !el.isConnected) return;
    k += el.classList.contains('rod') ? 10 : 1;
    el.classList.add('cnt');
    await say(numKey(k));
  }
}
async function nmAfter(run, r, key, phr, item) {
  if (!run.alive) throw STOP;
  rxRec(key, r.first); if (item != null) run.items.push(String(item));
  const up = lvAdapt('nl', r);
  await rs(run, phr);
  if (up > 0) await lvlUp(run, S.nl);
}
const nmOpts = (ans, decoys) => shuffle([ans, ...decoys]).map(String);

async function nmCount(t, run) {
  const L = S.nl, max = [10, 15, 20, 50, 50, 50, 50, 50, 50, 50][L - 1], min = [1, 3, 5, 11, 15, 21, 21, 21, 21, 21][L - 1];
  const n = numPick(run, min, max), rods = n > 20, e = pick(COUNT_ITEMS);
  const opts = nmOpts(n, numDecoys(n, 3, { min: 1, max: max + 5, tens: rods }));
  const root = setStage(`<div class="task nm">${promptHTML(rods ? 'Сколько кубиков?' : 'Сколько?')}<div class="nm-objs">${rods ? rodsHTML(n) : framesHTML(n, e)}</div><div class="opts nm-opts"></div></div>`);
  run.prompt = () => say(rods ? T.countTensQ : T.countQ);
  run.prompt();
  const flag = { stop: false };
  const r = await choiceRound(run, { target: String(n), letters: opts, box: $('.nm-opts', root), maxBs: 130, dog: false,
    wrongSay: (ch, k) => k >= 2 ? null : [numKey(ch), T.tryAgain],
    onWrong: (ch, k) => { if (k === 2) countAlong(run, root, flag); } });
  flag.stop = true;
  await nmAfter(run, r, 'c' + n, [numKey(n), praise()], n);
}

async function nmFind(t, run) {
  const L = S.nl, [lo, hi] = NM_RANGE[L - 1];
  const n = numPick(run, lo, hi), k = L <= 2 ? 4 : L <= 4 ? 6 : 8;
  const opts = nmOpts(n, numDecoys(n, k - 1, { min: lo, max: hi }));
  const extra = hasVoice() ? '' : `<span class="tgt">${n}</span>`;
  const root = setStage(`<div class="task find">${promptHTML('Найди число', extra)}${SPEED}<div class="opts"></div></div>`);
  run.prompt = () => say([T.findNum, numKey(n)]);
  run.prompt();
  const fast = L >= 3 ? 3600 + 300 * Math.max(0, 8 - L) : 0;
  const r = await choiceRound(run, { target: String(n), letters: opts, box: $('.opts', root), maxBs: 170, speed: fast ? $('.speed', root) : null, fast, dog: false,
    wrongSay: ch => [numKey(ch), T.needNum, numKey(n)] });
  await nmAfter(run, r, 'f' + n, [praise(), numKey(n)], n);
}

async function nmMissing(t, run) {
  const L = S.nl, [lo, hi] = NM_RANGE[L - 1], len = 5;
  const step = L >= 7 ? pick([1, 2, 5, 10, 10]) : L >= 5 ? pick([1, 2, 10]) : 1;
  const down = L >= 6 && Math.random() < .35;
  const span = step * (len - 1), top = Math.max(lo, hi - span);
  let a0 = step === 1 ? ri(lo, top) : step * ri(Math.ceil(lo / step), Math.max(Math.ceil(lo / step), Math.floor(top / step)));
  if (step === 2 && Math.random() < .4 && a0 + span + 1 <= hi) a0++;
  const seq = Array.from({ length: len }, (_, i) => a0 + i * step); if (down) seq.reverse();
  const gap = L <= 2 ? ri(1, len - 2) : ri(1, len - 1), ans = seq[gap];
  remember(run, 'm' + ans);
  const opts = nmOpts(ans, numDecoys(ans, L >= 4 ? 3 : 2, { min: 0, max: 100, extra: step > 1 ? [ans + 1, ans - 1, ans + step + 1] : [] }));
  const root = setStage(`<div class="task nm">${promptHTML('Какое число пропущено?')}<div class="train"><span class="loco">🚂</span>${seq.map((x, i) => `<span class="wagon${i === gap ? ' gap' : ''}"><b>${i === gap ? '?' : x}</b></span>`).join('')}</div><div class="opts nm-opts"></div></div>`);
  run.prompt = () => say(T.missQ);
  run.prompt();
  const r = await choiceRound(run, { target: String(ans), letters: opts, box: $('.nm-opts', root), maxBs: 140, dog: false,
    wrongSay: (ch, k) => k >= 2 ? seq.map(numKey) : [numKey(ch), T.tryAgain] });
  const g = $('.wagon.gap b', root); if (g) { g.textContent = ans; g.parentElement.classList.add('ok'); }
  await nmAfter(run, r, 'm' + step, [numKey(ans), praise()], ans);
}

async function nmCompare(t, run) {
  const L = S.nl, less = L >= 5 && Math.random() < .45, pics = L <= 2;
  let a, b;
  if (pics) { a = ri(1, 10); do { b = ri(1, 10); } while (Math.abs(a - b) < (L <= 1 ? 2 : 1)); }
  else {
    const [lo, hi] = NM_RANGE[L - 1]; a = ri(Math.max(lo, 2), hi);
    const sw = (a % 10) * 10 + Math.floor(a / 10);
    if (L >= 4 && a >= 12 && a % 10 && sw !== a && sw <= 100 && Math.random() < .45) b = sw;
    else { let k = 0; do { b = ri(Math.max(lo, 1), hi); } while (k++ < 50 && (b === a || Math.abs(a - b) > (L >= 6 ? 12 : 40))); if (b === a) b = a + 1; }
  }
  const e = pick(COUNT_ITEMS), tgt = (less ? a < b : a > b) ? 'L' : 'R';
  const card = (k, v) => `<button class="ccard" data-c="${k}">${pics ? framesHTML(v, e) : `<span class="cnum">${v}</span>`}</button>`;
  const root = setStage(`<div class="task nm">${promptHTML(less ? 'Где меньше?' : 'Где больше?')}<div class="cmp"></div></div>`);
  run.prompt = () => say(less ? T.lessQ : T.moreQ);
  run.prompt();
  const r = await choiceRound(run, { target: tgt, letters: ['L', 'R'], render: k => card(k, k === 'L' ? a : b), sel: '.ccard', box: $('.cmp', root), fit: false, good: popCard, dog: false,
    wrongSay: () => pics ? [T.tryAgain] : [numKey(a), numKey(b), T.tryAgain] });
  await nmAfter(run, r, less ? 'lt' : 'gt', [praise()], `${a} ${a > b ? '>' : '<'} ${b}`);
}

function arithGen(L) {
  let a, b, op = '+';
  const coin = p => Math.random() < p;
  if (L <= 1) { a = ri(1, 4); b = ri(1, 5 - a); }
  else if (L === 2) { if (coin(.3)) { op = '-'; a = ri(2, 5); b = ri(1, a - 1); } else { a = ri(1, 9); b = ri(1, 10 - a); } }
  else if (L <= 5) { if (coin(.45)) { op = '-'; a = ri(3, 10); b = ri(1, a - 1); } else { a = ri(1, 9); b = ri(1, 10 - a); } }
  else if (L === 6) { if (coin(.5)) { op = '-'; a = ri(11, 19); b = ri(1, a - 10); } else { a = ri(11, 18); b = ri(1, 19 - a); } }
  else if (L === 7) {
    if (coin(.5)) { if (coin(.5)) { a = 10 * ri(1, 4); b = 10 * ri(1, 5 - a / 10); } else { op = '-'; a = 10 * ri(2, 5); b = 10 * ri(1, a / 10 - 1); } }
    else { a = ri(6, 9); b = ri(11 - a, 9); }
  }
  else if (L === 8) { a = ri(2, 4) * 10 + ri(1, 5); if (coin(.5)) b = ri(1, 9 - a % 10); else { op = '-'; b = ri(1, a % 10); } }
  else if (L === 9) { if (coin(.5)) { a = ri(11, 89); b = 10; if (coin(.5)) { op = '-'; if (a < 20) a += 10; } } else { a = ri(5, 9); b = ri(11 - a, 9); } }
  else { a = ri(2, 5) * 10 + ri(1, 5); if (coin(.4)) { op = '-'; b = ri(1, Math.floor(a / 10) - 1) * 10 + ri(0, a % 10); } else b = ri(1, 3) * 10 + ri(1, 9 - a % 10); }
  const ans = op === '+' ? a + b : a - b;
  const pics = L <= 4 && Math.max(a, b) <= 10 || (L === 7 && op === '+' && a < 10);
  const miss = L >= 8 && coin(.3) ? (coin(.5) ? 'a' : 'b') : '';
  return { a, b, op, ans, pics, miss };
}
const opCh = op => op === '+' ? '+' : '−';
async function nmArith(t, run) {
  const L = S.nl, ex = arithGen(L), hid = ex.miss, ans = hid === 'a' ? ex.a : hid === 'b' ? ex.b : ex.ans;
  remember(run, 'a' + ans);
  const q = '<span class="eqn q">?</span>', num = v => `<span class="eqn">${v}</span>`;
  const eq = `<div class="eq">${hid === 'a' ? q : num(ex.a)}<button class="eqop" data-op="${ex.op}">${opCh(ex.op)}</button>${hid === 'b' ? q : num(ex.b)}<span class="eqop">=</span>${hid ? num(ex.ans) : q}</div>`;
  const pics = ex.pics && !hid, e = pick(COUNT_ITEMS);
  const top = L <= 5 ? Math.max(10, ans + 3) : L === 6 ? 20 : 100;
  const opts = nmOpts(ans, numDecoys(ans, 3, { min: 1, max: top, extra: [ex.a + ex.b, Math.abs(ex.a - ex.b), ...(L >= 7 ? [ans + 10, ans - 10] : [])] }));
  const root = setStage(`<div class="task nm">${promptHTML(hid ? 'Какое число спряталось?' : 'Сколько будет?')}${eq}${pics ? `<div class="nm-objs">${groupsHTML(ex, e)}</div>` : ''}<div class="opts nm-opts"></div></div>`);
  $('.eqop[data-op]', root).addEventListener('click', () => { Sfx.tap(); say(ex.op === '+' ? T.plusIs : T.minusIs); });
  const first = !(S.opSeen || '').includes(ex.op);
  if (first) { S.opSeen = (S.opSeen || '') + ex.op; save(); }
  run.prompt = () => say(hid ? T.missOpQ : T.sumQ);
  const flag = { stop: false };
  const round = choiceRound(run, { target: String(ans), letters: opts, box: $('.nm-opts', root), maxBs: 130, dog: false,
    wrongSay: (ch, k) => (k >= 2 && pics) ? null : [numKey(ch), T.tryAgain],
    onWrong: (ch, k) => { if (k === 2 && pics) countAlong(run, root, flag); } });
  say(first ? [ex.op === '+' ? T.plusIs : T.minusIs, hid ? T.missOpQ : T.sumQ] : (hid ? T.missOpQ : T.sumQ));
  const r = await round;
  flag.stop = true;
  const qe = $('.eqn.q', root); if (qe) { qe.textContent = ans; qe.classList.add('ok'); }
  await nmAfter(run, r, 'ar' + ex.op, [numKey(ans), praise()], `${ex.a} ${opCh(ex.op)} ${ex.b} = ${ex.ans}`);
}

async function nmBond(t, run) {
  const L = S.nl, N = L <= 7 ? ri(4, 10) : ri(8, 20), a = ri(1, N - 1), b = N - a;
  remember(run, 'b' + N);
  const opts = nmOpts(b, numDecoys(b, 3, { min: 0, max: 20, extra: [N, a, b + 1, b - 1] }));
  const root = setStage(`<div class="task nm">${promptHTML('Состав числа')}<div class="house"><div class="roof"><span>${N}</span></div><div class="hbody"><span>${a}</span><span class="q">?</span></div></div><div class="opts nm-opts"></div></div>`);
  run.prompt = () => say(T.bondQ);
  run.prompt();
  const r = await choiceRound(run, { target: String(b), letters: opts, box: $('.nm-opts', root), maxBs: 130, dog: false,
    wrongSay: (ch, k) => k >= 2 ? [numKey(N), T.bondHint] : [numKey(ch), T.tryAgain] });
  const qe = $('.hbody .q', root); if (qe) { qe.textContent = b; qe.classList.add('ok'); }
  await nmAfter(run, r, 'bond', [praise()], `${N} = ${a} + ${b}`);
}

async function nmWord(t, run) {
  const L = S.nl, p = rxPick(NWP.filter(x => x.L <= L), x => x.t, run.recent); remember(run, p.t);
  const ans = p.op === '+' ? p.a + p.b : p.a - p.b, ex = { a: p.a, b: p.b, op: p.op, ans };
  const pics = p.a <= 12 && p.b <= 12 && L <= 6;
  const opts = nmOpts(ans, numDecoys(ans, 3, { min: 1, max: Math.max(10, p.a + p.b + 3), extra: [p.a + p.b, Math.abs(p.a - p.b), p.a, p.b] }));
  const root = setStage(`<div class="task nm">${promptHTML('Задачка')}<div class="nm-objs">${pics ? groupsHTML(ex, p.e) : `<div class="wp-pic">${picFace(p.e)}</div>`}</div><div class="eq hide"><span class="eqn">${p.a}</span><span class="eqop">${opCh(p.op)}</span><span class="eqn">${p.b}</span><span class="eqop">=</span><span class="eqn q">?</span></div><div class="opts nm-opts"></div></div>`);
  run.prompt = () => say(p.t);
  run.prompt();
  const flag = { stop: false };
  const r = await choiceRound(run, { target: String(ans), letters: opts, box: $('.nm-opts', root), maxBs: 130, dog: false,
    wrongSay: (ch, k) => (k >= 2 && pics) ? null : [numKey(ch), T.tryAgain],
    onWrong: (ch, k) => { const eqEl = $('.eq', root); if (eqEl) eqEl.classList.remove('hide'); if (k === 2 && pics) countAlong(run, root, flag); } });
  flag.stop = true;
  const eqEl = $('.eq', root); if (eqEl) { eqEl.classList.remove('hide'); const qe = $('.eqn.q', eqEl); qe.textContent = ans; qe.classList.add('ok'); }
  await nmAfter(run, r, p.t, [numKey(ans), praise()], `${p.a} ${opCh(p.op)} ${p.b} = ${ans}`);
}

async function nmArcade(t, run) {
  const L = S.nl;
  let n, tgt = '', sayIt, pool;
  if (L <= 2) { const [lo, hi] = NM_RANGE[L - 1]; n = ri(Math.max(lo, 1), hi); sayIt = () => [T.catchNum, numKey(n)]; pool = numDecoys(n, 7, { min: lo, max: hi }); }
  else { const ex = arithGen(Math.min(L, 9)); n = ex.ans; tgt = `${ex.a} ${opCh(ex.op)} ${ex.b}`; sayIt = () => T.catchAns; pool = numDecoys(n, 7, { min: 0, max: 100, extra: [ex.a, ex.b, ex.a + ex.b, Math.abs(ex.a - ex.b)] }); }
  pool = pool.map(String);
  const r = await arcadeRound(run, String(n), { boss: true, pool, look: pool.slice(0, 3), tgt: tgt || String(n), label: tgt ? 'Лови ответ' : 'Лови число', sayIt, sayThis: ch => numKey(ch) });
  if (!run.alive) throw STOP;
  run.items.push(tgt ? `${tgt} = ${n}` : String(n));
  const up = arcAdapt(r);
  await rs(run, r.hits >= r.need ? T.shot3 : r.hits >= Math.ceil(r.need / 2) ? T.shot2 : T.shot1);
  if (up > 0) await lvlUp(run, S.al);
}

const NM = { count: nmCount, find: nmFind, missing: nmMissing, compare: nmCompare, arith: nmArith, bond: nmBond, word: nmWord, arcade: nmArcade };
Object.assign(TASKS, { rd: (t, run) => RD[t.k](t, run), nm: (t, run) => NM[t.k](t, run) });

/* ---------- missions «Читаем» и «Числа» ---------- */
function planLearn(kind) {
  const read = kind === 'read', L = read ? S.rl : S.nl;
  const kinds = planKinds((read ? RD_PLAN : NM_PLAN)[L - 1], S.len || 8);
  return [...kinds.map(k => ({ t: read ? 'rd' : 'nm', k })), { t: read ? 'rd' : 'nm', k: 'arcade' }];
}
// в обычную миссию с буквами — одно задание на чтение и одно на счёт
function mixTasks(tasks) {
  if (S.mix === false || unlocked().length < 10) return tasks;
  const idx = tasks.map((t, i) => i).filter(i => i > 0 && ['find', 'pic', 'match'].includes(tasks[i].t) && !tasks.some(x => x.t === 'intro' && x.c === tasks[i].c));
  if (idx.length < 4) return tasks;
  const [i1, i2] = shuffle(idx);
  tasks[i1] = { t: 'rd', k: wpick(RD_PLAN[Math.min(S.rl, 7) - 1]) };
  tasks[i2] = { t: 'nm', k: wpick(NM_PLAN[S.nl - 1]) };
  return tasks;
}
let LAST_KIND = 'mission';
async function startLearn(kind) {
  closeModal(); LAST_KIND = kind;
  const run = newRun(kind);
  if (kind === 'read') S.readSeen = 1; else S.numSeen = 1;
  save(); newBadges();
  run.tasks = planLearn(kind);
  show('game'); $('#boss').hidden = false; $('#free-title').hidden = true;
  renderHP(run);
  try {
    await rs(run, kind === 'read' ? T.readGo : T.numGo);
    for (run.i = 0; run.i < run.tasks.length; run.i++) {
      const t = run.tasks[run.i];
      if (t.k === 'arcade') { setStage(`<div class="task splash"><div class="banner">ФИНАЛЬНЫЙ БОЙ!</div>${sprImg('glitch', 'boss-big glitchy')}</div>`); Sfx.boom(); await rs(run, T.final); }
      await TASKS[t.t](t, run);
      if (!run.alive) return;
      hitBoss(run); Sfx.boom();
      await rsleep(run, 450);
    }
    await finishLearn(run);
  } catch (e) { if (e !== STOP) console.error(e); }
}
async function finishLearn(run) {
  if (run.kind === 'read') S.rMis = (S.rMis || 0) + 1; else S.nMis = (S.nMis || 0) + 1;
  save();
  show('reward');
  $('#rw-n').textContent = '+' + run.earned;
  $('#rw-title').textContent = pick(['ПОБЕДА!', 'УРА!', 'СУПЕР!']);
  const items = [...new Set(run.items)].slice(-12);
  $('#rw-letters').innerHTML = `<span class="chip lvl-chip">${run.kind === 'read' ? 'ЧТЕНИЕ' : 'СЧЁТ'} · УР. ${run.kind === 'read' ? S.rl : S.nl}</span>` + items.map(x => `<span class="chip">${esc(run.kind === 'read' ? rdTx(x) : x)}</span>`).join('');
  Sfx.fanfare(); FX.confetti();
  await rs(run, [T.win, T.gemsLook]);
  await rs(run, run.kind === 'read' ? T.readWin : T.numWin);
  if (canBuyAny()) await rs(run, T.canBuy);
  await rs(run, T.buildNow);
}
function again() { if (LAST_KIND === 'read' || LAST_KIND === 'num') startLearn(LAST_KIND); else startMission(); }
function newBadges() { const r = $('#btn-read'), n = $('#btn-num'); if (r) r.classList.toggle('is-new', !S.readSeen); if (n) n.classList.toggle('is-new', !S.numSeen); }
