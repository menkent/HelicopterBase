// Реестр SVG-текстур. Модули (в т.ч. миссии) вызывают registerSvg() при импорте,
// BootScene загружает всё разом через loadAll().
import { I, ITEM_ICON, place, svgDoc, starPoints } from './icons.js';
import { ITEM_ORDER, MISSION_META, MISSION_ORDER } from './config.js';
import { baseSvg } from './baseArt.js';

const REG = new Map();

/** Зарегистрировать SVG как текстуру key размером w x h пикселей. */
export function registerSvg(key, svg, w, h = w) {
  REG.set(key, { svg, w, h });
}

export function loadAll(scene) {
  const jobs = [...REG.entries()].map(
    ([key, { svg, w, h }]) =>
      new Promise((resolve) => {
        if (scene.textures.exists(key)) return resolve();
        const sized = svg.replace('<svg ', `<svg width="${w}" height="${h}" preserveAspectRatio="none" `);
        const img = new Image();
        img.onload = () => {
          scene.textures.addImage(key, img);
          resolve();
        };
        img.onerror = () => {
          console.error('SVG texture failed:', key);
          resolve();
        };
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(sized);
      }),
  );
  return Promise.all(jobs);
}

// ---------- Общие текстуры (ими могут пользоваться и миссии) ----------

// иконки 0..100
const ICONS = {
  icon_flame: I.flame(), icon_drop: I.drop(), icon_cross: I.cross(), icon_rope: I.rope(), icon_buoy: I.buoy(),
  icon_sprout: I.sprout(), icon_flashlight: I.flashlight(), icon_medkit: I.medkit(), icon_pump: I.pump(),
  icon_radio: I.radio(), icon_star: I.star(), icon_tree: I.tree(), icon_mountain: I.mountain(),
  icon_sun: I.sun(), icon_wilted: I.wilted(), icon_bloom: I.bloom(), icon_waves: I.waves(), bunny: I.bunny(),
  icon_moon: I.moon('#22305a'),
};
for (const [k, v] of Object.entries(ICONS)) registerSvg(k, svgDoc(v), 256);

// предметы: иконка на белом круге с цветным ободком
const ITEM_RING = { water: '#339af0', rope: '#c4874f', seeds: '#40c057', buoy: '#e5484d', light: '#f59f00' };
for (const k of ITEM_ORDER) {
  registerSvg(
    `item_${k}`,
    svgDoc(`<circle cx="60" cy="60" r="56" fill="#fff" stroke="${ITEM_RING[k]}" stroke-width="6"/>` + place(ITEM_ICON[k](), 22, 22, 76), '0 0 120 120'),
    200,
  );
}

// медали
const MEDAL_ICON = { fire: I.flame(), mountain: I.mountain(), garden: I.sprout(), sea: I.buoy(), night: I.flashlight() };
for (const id of MISSION_ORDER) {
  const c = MISSION_META[id].css;
  let stars = '';
  for (const a of [-50, 0, 50]) {
    const sx = 30 + 25.3 * Math.sin((a * Math.PI) / 180);
    const sy = 30 - 25.3 * Math.cos((a * Math.PI) / 180);
    stars += place(I.star('#fff', '#e8a400'), sx - 3.5, sy - 3.5, 7);
  }
  registerSvg(
    `medal_${id}`,
    svgDoc(
      `<circle cx="30" cy="30" r="28.5" fill="#ffd43b" stroke="#e8a400" stroke-width="1.6"/>` +
        `<circle cx="30" cy="30" r="22.5" fill="${c}"/><circle cx="30" cy="30" r="17" fill="#fff"/>` +
        place(MEDAL_ICON[id], 17.5, 17.5, 25) + stars,
      '0 0 60 60',
    ),
    240,
  );
}

// карточки миссий (сцена 84x48, как на бумажных карточках)
const CARD_SCENE = {
  fire: ['#fff8e6', place(I.tree(), 2, 4, 40) + place(I.tree(), 26, 0, 46) + place(I.tree(), 54, 6, 38) +
    place(I.flame(), 12, 6, 20) + place(I.flame(), 40, 2, 22) + place(I.flame(), 64, 10, 18)],
  mountain: ['#e7f5ff', place(I.mountain(), 12, 0, 48) + place(I.bunny(), 26, -2, 17) +
    `<text x="70" y="18" font-family="Arial" font-weight="bold" font-size="8" fill="#e5484d" text-anchor="middle">SOS!</text>`],
  garden: ['#fff9db', place(I.sun(), 62, 1, 20) + place(I.wilted(), 0, 14, 32) + place(I.wilted(), 22, 16, 30) + place(I.wilted(), 44, 18, 28)],
  sea: ['#d0ebff', place(I.bunny(), 34, 2, 22) + place(I.waves(), 4, 10, 37) + place(I.waves(), 41, 10, 37)],
  night: ['#22305a', place(I.moon('#22305a'), 4, 2, 26) +
    [[36, 6], [52, 14], [70, 4], [44, 30]].map(([x, y]) => place(I.star('#ffe066', '#ffe066'), x, y, 7)).join('') +
    place(I.bunny(), 62, 22, 18, 0.45)],
};
for (const id of MISSION_ORDER) {
  const [bg, inner] = CARD_SCENE[id];
  registerSvg(`card_${id}`, svgDoc(`<rect width="84" height="48" rx="3" fill="${bg}"/>` + inner, '0 0 84 48'), 560, 320);
}

// вертолёт (вид сверху, нос вправо; втулка винта в x=110 -> origin 0.55)
registerSvg(
  'heli',
  svgDoc(
    '<rect x="70" y="60" width="96" height="7" rx="3.5" fill="#adb5bd"/><rect x="70" y="133" width="96" height="7" rx="3.5" fill="#adb5bd"/>' +
      '<rect x="88" y="62" width="5" height="76" fill="#adb5bd"/><rect x="138" y="62" width="5" height="76" fill="#adb5bd"/>' +
      '<rect x="10" y="92" width="80" height="16" rx="8" fill="#e8669a"/>' +
      '<rect x="4" y="76" width="16" height="48" rx="6" fill="#f783ac" stroke="#d6336c" stroke-width="3"/>' +
      '<ellipse cx="12" cy="70" rx="10" ry="4" fill="#868e96"/>' +
      '<ellipse cx="112" cy="100" rx="58" ry="42" fill="#f783ac" stroke="#d6336c" stroke-width="4"/>' +
      '<ellipse cx="146" cy="100" rx="22" ry="27" fill="#a5d8ff" stroke="#4dabf7" stroke-width="3"/>' +
      '<ellipse cx="152" cy="90" rx="6" ry="9" fill="#fff" opacity=".7"/>' +
      '<circle cx="84" cy="100" r="13" fill="#fff"/>' +
      `<polygon points="${starPoints(84, 101, 10, 4.2)}" fill="#ffd43b"/>`,
    '0 0 200 200',
  ),
  256,
);
registerSvg(
  'rotor',
  svgDoc(
    '<circle cx="120" cy="120" r="115" fill="#fff" opacity=".22"/>' +
      '<rect x="6" y="113" width="228" height="14" rx="7" fill="#868e96" opacity=".9"/>' +
      '<rect x="113" y="6" width="14" height="228" rx="7" fill="#868e96" opacity=".9"/>' +
      '<circle cx="120" cy="120" r="13" fill="#495057"/>',
    '0 0 240 240',
  ),
  300,
);
registerSvg('heli_shadow', svgDoc('<ellipse cx="100" cy="100" rx="80" ry="48" fill="#000"/><rect x="10" y="92" width="90" height="16" rx="8" fill="#000"/>', '0 0 200 200'), 256);

// деревья сверху
const treeTop = (c1, c2, hl) =>
  svgDoc(`<circle cx="54" cy="56" r="40" fill="#000" opacity=".12"/><circle cx="50" cy="50" r="40" fill="${c1}"/>` +
    `<circle cx="62" cy="62" r="22" fill="${c2}" opacity=".6"/><circle cx="38" cy="38" r="14" fill="${hl}"/>`);
registerSvg('tree_top', treeTop('#a9c08a', '#8fa872', '#bdd09f'), 160);
registerSvg('tree_top2', treeTop('#9bb77c', '#7f9a64', '#b3c994'), 160);

// стрелка-подсказка (смотрит вправо)
registerSvg('arrow', svgDoc('<polygon points="4,20 62,20 62,4 96,30 62,56 62,40 4,40" fill="#ffd43b" stroke="#e8590c" stroke-width="5" stroke-linejoin="round"/>', '0 0 100 60'), 200, 120);
// кнопка A
registerSvg('btn_a', svgDoc('<circle cx="50" cy="50" r="46" fill="#40c057" stroke="#2b8a3e" stroke-width="5"/><text x="50" y="67" font-family="Arial" font-weight="bold" font-size="48" fill="#fff" text-anchor="middle">A</text>'), 200);
// диспетчер
registerSvg(
  'dispatcher',
  svgDoc(
    '<circle cx="50" cy="50" r="48" fill="#e7f5ff"/>' +
      '<ellipse cx="50" cy="54" rx="30" ry="34" fill="#7a4b2a"/>' +
      '<circle cx="50" cy="50" r="24" fill="#ffd8bf"/>' +
      '<path d="M26 46 C28 26 72 26 74 46 C66 36 40 34 26 46Z" fill="#7a4b2a"/>' +
      '<circle cx="41" cy="50" r="3" fill="#333"/><circle cx="59" cy="50" r="3" fill="#333"/>' +
      '<path d="M42 60 Q50 67 58 60" stroke="#c0392b" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '<circle cx="35" cy="57" r="4" fill="#ffb3a7" opacity=".7"/><circle cx="65" cy="57" r="4" fill="#ffb3a7" opacity=".7"/>' +
      '<path d="M24 50 C24 18 76 18 76 50" stroke="#495057" stroke-width="5" fill="none"/>' +
      '<rect x="19" y="44" width="11" height="18" rx="4" fill="#7048e8"/><rect x="70" y="44" width="11" height="18" rx="4" fill="#7048e8"/>' +
      '<path d="M25 60 C26 72 36 74 44 72" stroke="#495057" stroke-width="3" fill="none"/><circle cx="45" cy="72" r="3.5" fill="#495057"/>' +
      '<path d="M22 100 C24 80 76 80 78 100Z" fill="#7048e8"/>',
  ),
  320,
);

// база
registerSvg('base', baseSvg(), 1800, 1000);
