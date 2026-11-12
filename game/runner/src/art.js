// SVG-текстуры раннера. Регистрируются при импорте, BootScene грузит их разом.
import { I, place, svgDoc, starPoints } from '../../src/icons.js';

const REG = new Map();

function reg(key, svg, w, h = w) { REG.set(key, { svg, w, h }); }

export function loadAll(scene) {
  return Promise.all(
    [...REG.entries()].map(
      ([key, { svg, w, h }]) =>
        new Promise((resolve) => {
          if (scene.textures.exists(key)) return resolve();
          const img = new Image();
          img.onload = () => { scene.textures.addImage(key, img); resolve(); };
          img.onerror = () => { console.error('SVG texture failed:', key); resolve(); };
          img.src = 'data:image/svg+xml;charset=utf-8,' +
            encodeURIComponent(svg.replace('<svg ', `<svg width="${w}" height="${h}" preserveAspectRatio="none" `));
        }),
    ),
  );
}

// ---------- вертолёт (розовый, как игрушка из референса) ----------
const PINK = '#ff5fae', PINK_D = '#d63384', PINK_L = '#ff9fd0';

// вид сзади-сверху: хвост смотрит на нас, винт отдельной текстурой
reg(
  'heli_back',
  svgDoc(
    // полозья уходят вдаль
    `<path d="M52 118 L58 150 M148 118 L142 150" stroke="${PINK_D}" stroke-width="7" stroke-linecap="round"/>` +
      `<rect x="40" y="146" width="30" height="12" rx="6" fill="${PINK}" stroke="${PINK_D}" stroke-width="3"/>` +
      `<rect x="130" y="146" width="30" height="12" rx="6" fill="${PINK}" stroke="${PINK_D}" stroke-width="3"/>` +
      // боковые крылышки
      `<rect x="14" y="74" width="34" height="20" rx="6" fill="${PINK}" stroke="${PINK_D}" stroke-width="3"/>` +
      `<rect x="152" y="74" width="34" height="20" rx="6" fill="${PINK}" stroke="${PINK_D}" stroke-width="3"/>` +
      // корпус
      `<ellipse cx="100" cy="86" rx="60" ry="50" fill="${PINK}" stroke="${PINK_D}" stroke-width="4"/>` +
      `<path d="M46 102 C56 132 144 132 154 102 C140 120 60 120 46 102Z" fill="#fff"/>` +
      `<ellipse cx="78" cy="66" rx="18" ry="12" fill="${PINK_L}" opacity=".8"/>` +
      // двигатель-горб и мачта винта
      `<rect x="72" y="28" width="56" height="30" rx="14" fill="${PINK}" stroke="${PINK_D}" stroke-width="3"/>` +
      `<rect x="94" y="14" width="12" height="18" rx="3" fill="${PINK_D}"/>` +
      // сердечко с крылышками
      `<path d="M100 98 C92 88 80 94 88 104 L100 114 L112 104 C120 94 108 88 100 98Z" fill="#fff" stroke="${PINK_D}" stroke-width="2"/>` +
      // хвостовая балка к нам
      `<path d="M90 110 L96 176 L104 176 L110 110Z" fill="${PINK}" stroke="${PINK_D}" stroke-width="3"/>` +
      `<rect x="72" y="166" width="56" height="10" rx="5" fill="${PINK}" stroke="${PINK_D}" stroke-width="3"/>` +
      `<rect x="95" y="150" width="10" height="44" rx="5" fill="${PINK}" stroke="${PINK_D}" stroke-width="3"/>` +
      `<ellipse cx="116" cy="168" rx="5" ry="18" fill="#fff" opacity=".7" stroke="${PINK_D}" stroke-width="2"/>`,
    '0 0 200 200',
  ),
  300,
);

// несущий винт сверху (крутится и сплющивается в контейнере)
reg(
  'heli_rotor',
  svgDoc(
    '<circle cx="120" cy="120" r="116" fill="#fff" opacity=".25"/>' +
      [0, 90, 180, 270]
        .map((a) => `<g transform="rotate(${a} 120 120)"><rect x="126" y="111" width="110" height="18" rx="9" fill="${PINK}" stroke="${PINK_D}" stroke-width="3"/>` +
          `<rect x="196" y="113" width="12" height="14" fill="#fff"/></g>`)
        .join('') +
      `<circle cx="120" cy="120" r="16" fill="${PINK_D}"/>`,
    '0 0 240 240',
  ),
  300,
);

// вид спереди (заставка и финиш): большое лицо с очками-визором
reg(
  'heli_front',
  svgDoc(
    `<rect x="98" y="16" width="14" height="26" fill="${PINK_D}"/>` +
      `<rect x="10" y="10" width="190" height="14" rx="7" fill="${PINK}" stroke="${PINK_D}" stroke-width="3"/>` +
      '<rect x="30" y="12" width="12" height="10" fill="#fff"/><rect x="168" y="12" width="12" height="10" fill="#fff"/>' +
      `<circle cx="105" cy="17" r="9" fill="${PINK_D}"/>` +
      `<path d="M62 168 L52 196 M148 168 L158 196" stroke="${PINK_D}" stroke-width="8" stroke-linecap="round"/>` +
      `<rect x="26" y="190" width="52" height="12" rx="6" fill="${PINK}" stroke="${PINK_D}" stroke-width="3"/>` +
      `<rect x="132" y="190" width="52" height="12" rx="6" fill="${PINK}" stroke="${PINK_D}" stroke-width="3"/>` +
      `<rect x="4" y="96" width="34" height="24" rx="6" fill="${PINK}" stroke="${PINK_D}" stroke-width="3"/>` +
      `<rect x="172" y="96" width="34" height="24" rx="6" fill="${PINK}" stroke="${PINK_D}" stroke-width="3"/>` +
      `<rect x="70" y="36" width="70" height="26" rx="12" fill="${PINK}" stroke="${PINK_D}" stroke-width="3"/>` +
      `<path d="M30 110 C30 54 60 46 105 46 C150 46 180 54 180 110 C180 160 156 178 105 178 C54 178 30 160 30 110Z" fill="${PINK}" stroke="${PINK_D}" stroke-width="4"/>` +
      // белая «мордочка» снизу
      '<path d="M40 126 C46 170 164 170 170 126 C150 140 60 140 40 126Z" fill="#fff"/>' +
      `<path d="M92 148 Q105 158 118 148" stroke="${PINK_D}" stroke-width="4" fill="none" stroke-linecap="round"/>` +
      // визор
      '<rect x="46" y="66" width="118" height="62" rx="26" fill="#a61e70"/>' +
      '<rect x="54" y="72" width="102" height="50" rx="21" fill="#fde4f2"/>' +
      '<path d="M98 72 L105 82 L112 72Z" fill="#a61e70"/>' +
      // глаза
      [80, 130].map((x) =>
        `<ellipse cx="${x}" cy="98" rx="15" ry="18" fill="#fff" stroke="#a61e70" stroke-width="2"/>` +
        `<circle cx="${x + 2}" cy="101" r="10" fill="#c2255c"/><circle cx="${x + 2}" cy="101" r="5" fill="#5c0a33"/>` +
        `<circle cx="${x + 5}" cy="96" r="3.5" fill="#fff"/>` +
        `<path d="M${x - 14} 84 l-5 -5 M${x - 9} 81 l-3 -6" stroke="#5c0a33" stroke-width="2.5" stroke-linecap="round"/>`,
      ).join('') +
      '<ellipse cx="62" cy="140" rx="9" ry="5" fill="#ffc9de"/><ellipse cx="148" cy="140" rx="9" ry="5" fill="#ffc9de"/>',
    '0 0 210 210',
  ),
  420,
);

// ---------- зверята ----------
const kitten = () =>
  '<polygon points="22,40 30,6 50,30" fill="#ffa94d" stroke="#c46a1c" stroke-width="2.5"/>' +
  '<polygon points="78,40 70,6 50,30" fill="#ffa94d" stroke="#c46a1c" stroke-width="2.5"/>' +
  '<polygon points="28,32 32,16 42,28" fill="#ffc9d6"/><polygon points="72,32 68,16 58,28" fill="#ffc9d6"/>' +
  '<circle cx="50" cy="60" r="30" fill="#ffa94d" stroke="#c46a1c" stroke-width="2.5"/>' +
  '<path d="M44 34 L46 44 M50 32 V44 M56 34 L54 44" stroke="#e8590c" stroke-width="3" stroke-linecap="round"/>' +
  '<ellipse cx="50" cy="72" rx="16" ry="11" fill="#fff4e6"/>' +
  '<circle cx="39" cy="56" r="4.5" fill="#333"/><circle cx="61" cy="56" r="4.5" fill="#333"/>' +
  '<circle cx="40.5" cy="54.5" r="1.5" fill="#fff"/><circle cx="62.5" cy="54.5" r="1.5" fill="#fff"/>' +
  '<polygon points="46,66 54,66 50,71" fill="#ff8fab"/>' +
  '<path d="M30 68 H14 M30 73 L15 78 M70 68 H86 M70 73 L85 78" stroke="#c46a1c" stroke-width="1.8"/>';
const puppy = () =>
  '<circle cx="50" cy="56" r="30" fill="#e8c39e" stroke="#9c6b3f" stroke-width="2.5"/>' +
  '<ellipse cx="22" cy="54" rx="11" ry="22" fill="#9c6b3f" transform="rotate(18 22 54)"/>' +
  '<ellipse cx="78" cy="54" rx="11" ry="22" fill="#9c6b3f" transform="rotate(-18 78 54)"/>' +
  '<ellipse cx="62" cy="46" rx="10" ry="9" fill="#c99a6b"/>' +
  '<ellipse cx="50" cy="70" rx="15" ry="11" fill="#fff4e6"/>' +
  '<circle cx="39" cy="50" r="4.5" fill="#333"/><circle cx="61" cy="50" r="4.5" fill="#333"/>' +
  '<circle cx="40.5" cy="48.5" r="1.5" fill="#fff"/><circle cx="62.5" cy="48.5" r="1.5" fill="#fff"/>' +
  '<ellipse cx="50" cy="64" rx="6" ry="4.5" fill="#333"/>' +
  '<path d="M46 74 Q50 84 54 74Z" fill="#ff6b8a"/>';
const ANIMALS = { bunny: [I.bunny, '#f8f0e3', '#a07d6a'], kitten: [kitten, '#ffa94d', '#c46a1c'], puppy: [puppy, '#e8c39e', '#9c6b3f'] };
export const ANIMAL_KEYS = Object.keys(ANIMALS);

for (const [k, [face]] of Object.entries(ANIMALS)) reg(`face_${k}`, svgDoc(face()), 160);

/** зверёк сидит и машет лапками: тельце + поднятые лапы + голова; поле 100x110 */
const sitting = (k) => {
  const [face, fur, line] = ANIMALS[k];
  return (
    `<ellipse cx="50" cy="92" rx="26" ry="18" fill="${fur}" stroke="${line}" stroke-width="2.5"/>` +
    `<ellipse cx="18" cy="40" rx="8" ry="15" fill="${fur}" stroke="${line}" stroke-width="2.5" transform="rotate(-25 18 40)"/>` +
    `<ellipse cx="82" cy="40" rx="8" ry="15" fill="${fur}" stroke="${line}" stroke-width="2.5" transform="rotate(25 82 40)"/>` +
    place(face(), 8, 4, 84)
  );
};

// на воде: бревенчатый плотик
const raft =
  '<ellipse cx="100" cy="186" rx="96" ry="12" fill="#1c7ed6" opacity=".35"/>' +
  [0, 1, 2, 3, 4].map((i) => `<rect x="${14 + i * 35}" y="138" width="32" height="46" rx="14" fill="${i % 2 ? '#b07a4f' : '#c08b5c'}" stroke="#7a5233" stroke-width="3"/>`).join('') +
  '<rect x="8" y="150" width="184" height="7" rx="3" fill="#7a5233"/>' +
  '<path d="M4 182 q16 -10 32 0 t32 0 t32 0 t32 0 t32 0 t32 0" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/>';
// на суше: скала-столбик с травкой
const cliff =
  '<path d="M30 200 L40 128 L62 112 L140 112 L162 130 L172 200Z" fill="#9aa3a8" stroke="#6c757d" stroke-width="4"/>' +
  '<path d="M60 140 L80 150 L76 176 M128 132 L140 160" stroke="#7d868c" stroke-width="5" fill="none" stroke-linecap="round"/>' +
  '<path d="M38 128 C60 104 140 104 164 128 C140 120 60 120 38 128Z" fill="#69db7c"/>';
for (const k of ANIMAL_KEYS) {
  reg(`t_sea_${k}`, svgDoc(raft + place(sitting(k), 52, 50, 96), '0 0 200 200'), 260);
  reg(`t_land_${k}`, svgDoc(cliff + place(sitting(k), 52, 18, 96), '0 0 200 200'), 260);
}

reg(
  'sos',
  svgDoc(
    '<path d="M10 10 H110 a8 8 0 0 1 8 8 V54 a8 8 0 0 1 -8 8 H72 L60 78 L48 62 H10 a8 8 0 0 1 -8 -8 V18 a8 8 0 0 1 8 -8Z" fill="#fff" stroke="#e5484d" stroke-width="5"/>' +
      '<text x="60" y="49" font-family="Arial" font-weight="bold" font-size="32" fill="#e5484d" text-anchor="middle">SOS!</text>',
    '0 0 120 82',
  ),
  180, 123,
);

// ---------- инструменты ----------
reg('buoy', svgDoc(I.buoy()), 160);
reg(
  'hook',
  svgDoc(
    '<rect x="40" y="2" width="20" height="18" rx="4" fill="#ffd43b" stroke="#e8a400" stroke-width="3"/>' +
      '<path d="M50 20 V56 C50 84 82 84 82 62 L74 68" stroke="#868e96" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  ),
  120,
);

// ---------- собираемое ----------
// звезда с белым ореолом — заметна и на воде, и на траве
reg('star', svgDoc(`<circle cx="50" cy="52" r="48" fill="#fff" opacity=".45"/>` +
  `<polygon points="${starPoints(50, 52, 44, 18)}" fill="none" stroke="#fff" stroke-width="12" stroke-linejoin="round"/>` + I.star('#ffd43b', '#e8590c')), 160);
reg('heart', svgDoc('<path d="M50 88 L14 52 C-2 34 14 8 34 14 C42 16 48 22 50 28 C52 22 58 16 66 14 C86 8 102 34 86 52Z" fill="#ff5fae" stroke="#d63384" stroke-width="4"/>'), 120);

// ---------- декорации (билборды, низ = земля) ----------
reg('tree', svgDoc('<rect x="44" y="64" width="12" height="36" rx="2" fill="#8b5e3c"/>' +
  '<circle cx="50" cy="40" r="30" fill="#40c057"/><circle cx="30" cy="56" r="18" fill="#37b24d"/><circle cx="70" cy="56" r="18" fill="#37b24d"/>' +
  '<circle cx="40" cy="30" r="9" fill="#69db7c"/>'), 200);
reg('pine', svgDoc('<rect x="45" y="78" width="10" height="22" fill="#8b5e3c"/>' +
  '<polygon points="50,4 80,44 64,44 88,80 12,80 36,44 20,44" fill="#2f9e44"/><polygon points="50,4 62,20 50,24" fill="#51cf66"/>'), 200);
reg('bush', svgDoc('<circle cx="30" cy="70" r="22" fill="#51cf66"/><circle cx="56" cy="62" r="28" fill="#40c057"/><circle cx="78" cy="74" r="18" fill="#37b24d"/>' +
  '<circle cx="40" cy="60" r="4" fill="#ff8fab"/><circle cx="64" cy="50" r="4" fill="#ffd43b"/><circle cx="76" cy="68" r="4" fill="#ff8fab"/>'), 160);
reg('rock', svgDoc('<path d="M6 96 C4 60 26 34 52 34 C80 34 98 62 94 96Z" fill="#adb5bd" stroke="#868e96" stroke-width="4"/>' +
  '<path d="M28 60 C34 48 46 44 56 46" stroke="#dee2e6" stroke-width="6" fill="none" stroke-linecap="round"/>'), 160);
reg('mount', svgDoc('<polygon points="0,100 48,10 100,100" fill="#a5b4c4"/><polygon points="48,10 34,36 42,32 48,40 56,32 62,36" fill="#fff"/>'), 300);
reg('island', svgDoc('<ellipse cx="100" cy="88" rx="96" ry="14" fill="#ffe8a3" stroke="#e8c36a" stroke-width="3"/>' +
  '<path d="M96 86 C94 60 100 40 112 22" stroke="#9c6b3f" stroke-width="8" fill="none" stroke-linecap="round"/>' +
  '<path d="M112 22 C90 10 72 18 64 32 C80 24 96 24 112 22 C104 6 124 0 140 10 C128 12 118 16 112 22 C134 18 150 30 152 44 C138 32 124 26 112 22 C116 40 108 54 98 60 C102 46 106 32 112 22Z" fill="#40c057"/>',
'0 0 200 100'), 320, 160);
reg('boat', svgDoc('<path d="M10 70 H90 L78 92 H22Z" fill="#fff" stroke="#1c7ed6" stroke-width="4"/>' +
  '<rect x="48" y="8" width="5" height="62" fill="#868e96"/><polygon points="54,10 88,64 54,64" fill="#ffd43b" stroke="#e8a400" stroke-width="2"/>' +
  '<polygon points="46,18 18,64 46,64" fill="#ff8787" stroke="#e5484d" stroke-width="2"/>'), 180);
// большие корабли вдали: лайнер и контейнеровоз (вид сбоку, низ = вода)
reg('liner', svgDoc(
  '<path d="M6 70 H294 L272 112 H30Z" fill="#fff" stroke="#1c4f8a" stroke-width="4"/>' +
  '<path d="M14 86 H288 L282 98 H22Z" fill="#1c7ed6"/><path d="M27 106 H275 L272 112 H30Z" fill="#e5484d"/>' +
  '<rect x="44" y="46" width="214" height="26" rx="4" fill="#fff" stroke="#adb5bd" stroke-width="3"/>' +
  '<rect x="72" y="26" width="160" height="22" rx="4" fill="#fff" stroke="#adb5bd" stroke-width="3"/>' +
  [...Array(18)].map((_, i) => `<circle cx="${56 + i * 11.5}" cy="59" r="3.6" fill="#4dabf7"/>`).join('') +
  [...Array(12)].map((_, i) => `<circle cx="${84 + i * 12.5}" cy="37" r="3.4" fill="#4dabf7"/>`).join('') +
  [...Array(22)].map((_, i) => `<circle cx="${30 + i * 11.5}" cy="78" r="2.8" fill="#1c4f8a"/>`).join('') +
  [120, 170].map((x) => `<path d="M${x} 26 L${x + 4} 2 H${x + 26} L${x + 28} 26Z" fill="#e5484d" stroke="#a61e24" stroke-width="2"/><rect x="${x + 3}" y="6" width="24" height="5" fill="#fff"/>`).join('') +
  '<path d="M4 114 q14 -8 28 0 t28 0 t28 0 t28 0 t28 0 t28 0 t28 0 t28 0 t28 0 t28 0 t28 0" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/>',
  '0 0 300 120'), 600, 240);
{
  const COLS = ['#e5484d', '#1c7ed6', '#40c057', '#f59f00', '#7048e8', '#e64980'];
  let boxes = '';
  for (let row = 0; row < 3; row++) for (let i = 0; i < 9; i++) {
    if (row === 2 && (i < 1 || i > 7)) continue;
    boxes += `<rect x="${30 + i * 22}" y="${62 - row * 15}" width="21" height="14" rx="1.5" fill="${COLS[(i * 7 + row * 3) % COLS.length]}" stroke="#343a40" stroke-width="1.2"/>`;
  }
  reg('cargo', svgDoc(
    boxes +
    '<rect x="236" y="22" width="34" height="56" rx="3" fill="#fff" stroke="#adb5bd" stroke-width="3"/>' +
    '<rect x="232" y="20" width="42" height="12" rx="3" fill="#fff" stroke="#adb5bd" stroke-width="3"/>' +
    [244, 256].map((x) => `<rect x="${x}" y="40" width="8" height="8" fill="#4dabf7"/>`).join('') +
    '<rect x="252" y="4" width="10" height="17" fill="#ffd43b" stroke="#e8a400" stroke-width="2"/>' +
    '<path d="M4 76 H296 L282 112 H22Z" fill="#c92a2a" stroke="#7a1414" stroke-width="4"/>' +
    '<path d="M10 90 H292" stroke="#fff" stroke-width="5"/>' +
    '<path d="M4 114 q14 -8 28 0 t28 0 t28 0 t28 0 t28 0 t28 0 t28 0 t28 0 t28 0 t28 0 t28 0" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/>',
    '0 0 300 120'), 600, 240);
}
reg('lighthouse', svgDoc('<polygon points="36,96 42,26 58,26 64,96" fill="#fff" stroke="#adb5bd" stroke-width="3"/>' +
  '<polygon points="38.5,70 61.5,70 62.8,84 37.2,84" fill="#e5484d"/><polygon points="40.6,44 59.4,44 60.4,56 39.6,56" fill="#e5484d"/>' +
  '<rect x="40" y="14" width="20" height="14" fill="#ffe066" stroke="#495057" stroke-width="3"/><polygon points="38,14 50,4 62,14" fill="#e5484d"/>' +
  '<ellipse cx="50" cy="96" rx="30" ry="6" fill="#adb5bd"/>'), 200);
reg('cloud', svgDoc('<circle cx="30" cy="62" r="22" fill="#fff"/><circle cx="56" cy="50" r="30" fill="#fff"/><circle cx="80" cy="64" r="18" fill="#fff"/>' +
  '<rect x="20" y="62" width="66" height="22" rx="11" fill="#fff"/><ellipse cx="54" cy="82" rx="36" ry="5" fill="#dbe4ff"/>'), 260);
reg('sun', svgDoc(I.sun()), 220);

// финишная арка-радуга
reg(
  'arch',
  svgDoc(
    ['#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#4dabf7', '#9775fa']
      .map((c, i) => `<path d="M${10 + i * 9} 200 A${90 - i * 9} ${150 - i * 9} 0 0 1 ${190 - i * 9} 200" stroke="${c}" stroke-width="9" fill="none"/>`)
      .join('') +
      '<rect x="40" y="24" width="120" height="40" rx="12" fill="#fff" stroke="#ff5fae" stroke-width="5"/>' +
      `<polygon points="${starPoints(100, 44, 16, 7)}" fill="#ffd43b" stroke="#e8a400" stroke-width="2"/>` +
      `<polygon points="${starPoints(66, 44, 10, 4.5)}" fill="#ffd43b"/><polygon points="${starPoints(134, 44, 10, 4.5)}" fill="#ffd43b"/>`,
    '0 0 200 200',
  ),
  600,
);
