// Общие константы игры. Все координаты — в пикселях мира.
export const PARAMS = new URLSearchParams(location.search);
export const TEST = PARAMS.has('test');

export const VIEW = { w: 1920, h: 1080 };
// pad — поле вокруг мира: камера туда заглядывает (чтобы места у края можно было показать по центру), вертолёт — нет
export const WORLD = { w: 7000, h: 5000, pad: 900 };
export const FONT = "'PT Sans','Helvetica Neue',Arial,sans-serif";

// База: прямоугольник 1800x1000, при зуме 1 целиком помещается на экран 1920x1080
export const BASE = { x: 2600, y: 2000, w: 1800, h: 1000, cx: 3500, cy: 2500 };
// перевод локальных координат базы (0..1800, 0..1000) в мир
export const L = (lx, ly) => ({ x: BASE.x + lx, y: BASE.y + ly });

export const ITEM_ORDER = ['water', 'rope', 'seeds', 'buoy', 'light'];
export const ITEMS = {
  water: { label: 'Вода', color: 0x339af0 },
  rope: { label: 'Трос', color: 0xc4874f },
  seeds: { label: 'Семена', color: 0x40c057 },
  buoy: { label: 'Спасательный круг', color: 0xe5484d },
  light: { label: 'Прожектор', color: 0xf59f00 },
};

export const PAD = { ...L(900, 560), r: 150 };
export const WAREHOUSE = {
  center: L(250, 500),
  slots: ITEM_ORDER.map((key, i) => ({ key, ...L(250, 215 + i * 140) })),
};
export const FUEL = { ...L(1600, 620), r: 100 };
export const HOSPITAL_BEDS = [L(1550, 235), L(1670, 235)];
export const BOARD_SLOTS = [-260, -130, 0, 130, 260].map((dx) => L(900 + dx, 150));
export const ROUNDS_TEXT = L(900, 275);

// Места миссий на карте мира (центр и радиус зоны)
export const SITES = {
  fire: { x: 1200, y: 1100, r: 520 },
  mountain: { x: 5800, y: 1000, r: 520 },
  garden: { x: 1150, y: 3900, r: 520 },
  sea: { x: 5850, y: 3950, r: 520 },
  night: { x: 3500, y: 4350, r: 520 },
};

export const MISSION_ORDER = ['fire', 'mountain', 'garden', 'sea', 'night'];
export const MISSION_META = {
  fire: { title: 'Пожар в лесу', item: 'water', color: 0xf03e3e, css: '#f03e3e' },
  mountain: { title: 'Спасение в горах', item: 'rope', color: 0x7048e8, css: '#7048e8' },
  garden: { title: 'Засуха в саду', item: 'seeds', color: 0x37b24d, css: '#37b24d' },
  sea: { title: 'Спасение на озере', item: 'buoy', color: 0x1c7ed6, css: '#1c7ed6' },
  night: { title: 'Ночная миссия', item: 'light', color: 0x364fc7, css: '#364fc7' },
};

// на карте и в зоне миссии зум одинаковый — без резких приближений (решение пользователя)
export const ZOOM = { base: 0.88, map: 0.55, site: 0.55 };
// куда смотрит камера на базе (чуть выше центра — сверху место под панели HUD)
export const BASE_CAM = { x: 3500, y: 2440 };
export const SPEED = { base: 480, map: 850, site: 600 };
export const HELI_SCALE = 0.75; // текстура 256px -> ~190px на экране при зуме 1

export const DEPTH = {
  ground: 0, path: 1, base: 5, decor: 10, site: 12,
  missionLow: 20, missionHigh: 30,
  shadow: 40, carried: 44, heli: 50, fx: 60, overlay: 70,
};
