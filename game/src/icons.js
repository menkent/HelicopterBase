// Векторные иконки (поле 0..100), те же, что на бумажной базе (build.py).
export const place = (icon, x, y, size, opacity = 1) =>
  `<g transform="translate(${x},${y}) scale(${size / 100})"${opacity !== 1 ? ` opacity="${opacity}"` : ''}>${icon}</g>`;

export const svgDoc = (inner, vb = '0 0 100 100') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${inner}</svg>`;

export function starPoints(cx, cy, rOut, rIn, n = 5) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 === 0 ? rOut : rIn;
    const a = -Math.PI / 2 + (i * Math.PI) / n;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(' ');
}

export const I = {
  flame: () =>
    '<path d="M50 4 C60 22 84 36 82 62 C80 84 66 96 50 96 C34 96 18 84 18 62 C18 46 28 38 34 22 C40 32 44 36 47 40 C50 28 52 16 50 4Z" fill="#f05a28"/>' +
    '<path d="M50 34 C58 48 72 56 70 72 C69 86 60 92 50 92 C40 92 31 86 31 74 C31 64 38 58 42 50 C45 56 47 58 49 60 C51 52 52 44 50 34Z" fill="#ff9f1c"/>' +
    '<path d="M50 62 C55 70 60 74 59 80 C58 86 54 89 50 89 C46 89 42 86 42 80 C42 74 47 70 50 62Z" fill="#ffd23f"/>',
  drop: () =>
    '<path d="M50 6 C50 6 18 46 18 64 A32 32 0 0 0 82 64 C82 46 50 6 50 6Z" fill="#339af0"/>' +
    '<ellipse cx="37" cy="64" rx="6" ry="11" fill="#fff" opacity=".6"/>',
  cross: (c = '#e5484d') =>
    `<rect x="35" y="10" width="30" height="80" rx="4" fill="${c}"/><rect x="10" y="35" width="80" height="30" rx="4" fill="${c}"/>`,
  rope: () => {
    const c = '#c4874f';
    return (
      `<circle cx="42" cy="58" r="32" stroke="${c}" stroke-width="7" fill="none"/>` +
      `<circle cx="42" cy="58" r="21" stroke="${c}" stroke-width="7" fill="none"/>` +
      `<circle cx="42" cy="58" r="10" stroke="${c}" stroke-width="7" fill="none"/>` +
      `<path d="M74 58 V22" stroke="${c}" stroke-width="7"/>` +
      '<path d="M74 22 C74 8 94 8 94 20 C94 30 84 32 82 26" stroke="#6c757d" stroke-width="6" fill="none" stroke-linecap="round"/>'
    );
  },
  buoy: () => {
    const seg = ((2 * Math.PI * 32) / 8).toFixed(2);
    return (
      '<circle cx="50" cy="50" r="32" stroke="#fff" stroke-width="22" fill="none"/>' +
      `<circle cx="50" cy="50" r="32" stroke="#e5484d" stroke-width="22" fill="none" stroke-dasharray="${seg} ${seg}"/>` +
      '<circle cx="50" cy="50" r="43" stroke="#9b1c1c" stroke-width="2" fill="none"/>' +
      '<circle cx="50" cy="50" r="21" stroke="#9b1c1c" stroke-width="2" fill="none"/>'
    );
  },
  sprout: () =>
    '<ellipse cx="50" cy="86" rx="36" ry="10" fill="#8b5e3c"/>' +
    '<path d="M50 86 V46" stroke="#2f9e44" stroke-width="6"/>' +
    '<path d="M50 58 C30 60 16 46 18 30 C36 28 50 40 50 58Z" fill="#51cf66"/>' +
    '<path d="M50 48 C66 50 82 36 80 20 C62 18 50 30 50 48Z" fill="#40c057"/>' +
    '<ellipse cx="30" cy="84" rx="4" ry="3" fill="#f2d49b"/><ellipse cx="68" cy="85" rx="4" ry="3" fill="#f2d49b"/>',
  flashlight: () =>
    '<polygon points="56,36 98,12 98,88 56,64" fill="#ffe066" opacity=".85"/>' +
    '<polygon points="38,32 58,27 58,73 38,68" fill="#495057"/>' +
    '<rect x="4" y="38" width="36" height="24" rx="6" fill="#f59f00"/>' +
    '<rect x="16" y="33" width="10" height="6" rx="2" fill="#495057"/>',
  medkit: () =>
    '<path d="M36 26 V18 a7 7 0 0 1 7-7 h14 a7 7 0 0 1 7 7 V26" stroke="#a61e24" stroke-width="6" fill="none"/>' +
    '<rect x="8" y="24" width="84" height="66" rx="10" fill="#e5484d"/>' +
    '<rect x="42" y="38" width="16" height="38" rx="2" fill="#fff"/><rect x="31" y="49" width="38" height="16" rx="2" fill="#fff"/>',
  pump: () =>
    '<rect x="18" y="18" width="44" height="70" rx="6" fill="#f08c00"/>' +
    '<rect x="26" y="27" width="28" height="18" rx="3" fill="#fff3bf"/>' +
    '<rect x="12" y="86" width="56" height="8" rx="2" fill="#495057"/>' +
    '<path d="M62 40 H74 a8 8 0 0 1 8 8 V68" stroke="#495057" stroke-width="5" fill="none"/>' +
    '<rect x="76" y="64" width="12" height="18" rx="3" fill="#495057"/>',
  radio: () => {
    const c = '#7048e8';
    return (
      `<path d="M50 32 L30 94 M50 32 L70 94 M38 68 H62 M34 82 H66" stroke="${c}" stroke-width="5" stroke-linecap="round" fill="none"/>` +
      `<circle cx="50" cy="26" r="7" fill="${c}"/>` +
      `<path d="M30 10 A24 24 0 0 0 30 42 M70 10 A24 24 0 0 1 70 42 M39 17 A13 13 0 0 0 39 35 M61 17 A13 13 0 0 1 61 35" stroke="${c}" stroke-width="4" fill="none" stroke-linecap="round"/>`
    );
  },
  star: (fill = '#ffd43b', stroke = '#e8a400') =>
    `<polygon points="${starPoints(50, 52, 46, 19)}" fill="${fill}" stroke="${stroke}" stroke-width="3" stroke-linejoin="round"/>`,
  tree: () =>
    '<rect x="44" y="60" width="12" height="34" rx="2" fill="#8b5e3c"/>' +
    '<circle cx="50" cy="40" r="30" fill="#40c057"/><circle cx="30" cy="54" r="18" fill="#37b24d"/><circle cx="70" cy="54" r="18" fill="#37b24d"/>',
  mountain: () =>
    '<polygon points="2,94 38,26 74,94" fill="#868e96"/><polygon points="40,94 68,44 98,94" fill="#adb5bd"/>' +
    '<polygon points="38,26 27.2,47 33,43 39,49 45,43 48.8,47" fill="#fff"/>',
  bunny: () =>
    '<ellipse cx="37" cy="26" rx="8" ry="20" fill="#f8f0e3" stroke="#a07d6a" stroke-width="2.5"/>' +
    '<ellipse cx="63" cy="26" rx="8" ry="20" fill="#f8f0e3" stroke="#a07d6a" stroke-width="2.5"/>' +
    '<ellipse cx="37" cy="28" rx="3.5" ry="13" fill="#ffc9d6"/><ellipse cx="63" cy="28" rx="3.5" ry="13" fill="#ffc9d6"/>' +
    '<circle cx="50" cy="62" r="28" fill="#f8f0e3" stroke="#a07d6a" stroke-width="2.5"/>' +
    '<circle cx="40" cy="57" r="4" fill="#333"/><circle cx="60" cy="57" r="4" fill="#333"/>' +
    '<circle cx="50" cy="67" r="3.5" fill="#ff8fab"/>' +
    '<circle cx="33" cy="70" r="5" fill="#ffc9d6" opacity=".7"/><circle cx="67" cy="70" r="5" fill="#ffc9d6" opacity=".7"/>',
  moon: (bg) => `<circle cx="46" cy="52" r="34" fill="#ffe066"/><circle cx="62" cy="40" r="30" fill="${bg}"/>`,
  waves: (c = '#1c7ed6') =>
    [36, 58, 80]
      .map((y) => `<path d="M2 ${y} q12 -12 24 0 t24 0 t24 0 t24 0" stroke="${c}" stroke-width="6" fill="none" stroke-linecap="round"/>`)
      .join(''),
  sun: () => {
    let rays = '';
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      rays += `<line x1="${50 + 30 * Math.cos(a)}" y1="${50 + 30 * Math.sin(a)}" x2="${50 + 44 * Math.cos(a)}" y2="${50 + 44 * Math.sin(a)}" stroke="#fab005" stroke-width="6" stroke-linecap="round"/>`;
    }
    return rays + '<circle cx="50" cy="50" r="22" fill="#ffd43b"/>';
  },
  wilted: () =>
    '<path d="M44 96 C44 72 50 52 68 50" stroke="#a9a26a" stroke-width="5" fill="none"/>' +
    '<path d="M45 80 C34 80 26 86 22 94 C34 94 42 90 45 80Z" fill="#b8b07a"/>' +
    [0, 60, 120, 180, 240, 300]
      .map((a) => `<ellipse cx="70" cy="62" rx="7" ry="13" fill="#c9b28a" transform="rotate(${a} 70 62) translate(0 12)"/>`)
      .join('') +
    '<circle cx="70" cy="62" r="8" fill="#8d7b5a"/>',
  bloom: () =>
    '<path d="M50 96 V44" stroke="#2f9e44" stroke-width="5"/>' +
    '<path d="M50 74 C36 72 26 78 22 88 C36 90 46 84 50 74Z" fill="#40c057"/>' +
    '<path d="M50 66 C64 64 74 70 78 80 C64 82 54 76 50 66Z" fill="#51cf66"/>' +
    [0, 60, 120, 180, 240, 300]
      .map((a) => `<ellipse cx="50" cy="34" rx="9" ry="15" fill="#ff6b9a" transform="rotate(${a} 50 34) translate(0 -14)"/>`)
      .join('') +
    '<circle cx="50" cy="34" r="10" fill="#ffd43b"/>',
  wrench: (bg) =>
    '<path d="M22 80 L58 44" stroke="#868e96" stroke-width="15" stroke-linecap="round"/>' +
    `<circle cx="64" cy="36" r="22" fill="#868e96"/><circle cx="75" cy="25" r="11" fill="${bg}"/>`,
};

export const ITEM_ICON = {
  water: I.drop,
  rope: I.rope,
  seeds: I.sprout,
  buoy: I.buoy,
  light: I.flashlight,
};
