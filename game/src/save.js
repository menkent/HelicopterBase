import { MISSION_ORDER, TEST } from './config.js';

const KEY = TEST ? 'hb-save-test' : 'hb-save-v1';

export function load() {
  if (TEST) localStorage.removeItem(KEY);
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && Array.isArray(s.medals)) return { rounds: 0, last: null, ...s };
  } catch (e) { /* пусто */ }
  return { medals: [], rounds: 0, last: null };
}

export function save(s) {
  localStorage.setItem(KEY, JSON.stringify(s));
}

/** «Мешок»: случайная миссия из ещё не пройденных в этом круге, по возможности не та же, что в прошлый раз. */
export function pickNext(s) {
  let pool = MISSION_ORDER.filter((id) => !s.medals.includes(id));
  if (!pool.length) pool = [...MISSION_ORDER];
  if (pool.length > 1) pool = pool.filter((id) => id !== s.last);
  const id = pool[Math.floor(Math.random() * pool.length)];
  s.last = id;
  return id;
}
