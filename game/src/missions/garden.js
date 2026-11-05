// Миссия «Засуха в саду»: три сухие грядки с увядшими цветами.
// Зависнуть над грядкой и нажать кнопку — сыплются семена, земля темнеет, вырастают цветы.
import { DEPTH } from '../config.js';
import { registerSvg } from '../art.js';
import { svgDoc } from '../icons.js';

// ---------- раскладка (смещения от центра места) ----------
const BED_W = 220, BED_H = 200;
const BEDS = [
  { dx: -265, dy: 95 },
  { dx: 0, dy: 95 },
  { dx: 265, dy: 95 },
];
const HOUSE = { dx: -215, dy: -230, w: 230, h: 160 };
const SUN = { dx: 245, dy: -245 };
const OVER_R = 150; // радиус «можно нажать»

// ---------- текстуры ----------
const FLOWER_COLORS = [
  ['#ff6b9a', '#ffd43b'],
  ['#ffd43b', '#ff922b'],
  ['#b197fc', '#ffe066'],
  ['#ff6b6b', '#ffe066'],
  ['#ff922b', '#fff3bf'],
];
const flowerSvg = (petal, center) =>
  '<path d="M50 98 V44" stroke="#2f9e44" stroke-width="6"/>' +
  '<path d="M50 76 C34 72 22 80 18 92 C34 94 46 88 50 76Z" fill="#40c057"/>' +
  '<path d="M50 66 C66 62 78 70 82 82 C66 84 54 78 50 66Z" fill="#51cf66"/>' +
  [0, 60, 120, 180, 240, 300]
    .map((a) => `<ellipse cx="50" cy="34" rx="10" ry="16" fill="${petal}" transform="rotate(${a} 50 34) translate(0 -15)"/>`)
    .join('') +
  `<circle cx="50" cy="34" r="11" fill="${center}"/>` +
  '<circle cx="46" cy="31" r="2.6" fill="#333"/><circle cx="55" cy="31" r="2.6" fill="#333"/>' +
  '<path d="M45 37 Q50 42 55 37" stroke="#333" stroke-width="2" fill="none" stroke-linecap="round"/>';
FLOWER_COLORS.forEach(([p, c], i) => registerSvg(`garden_flower${i}`, svgDoc(flowerSvg(p, c)), 160));

// сухая потрескавшаяся земля
registerSvg(
  'garden_dry',
  svgDoc(
    '<rect x="3" y="3" width="214" height="194" rx="22" fill="#ecdcae" stroke="#cdb27a" stroke-width="6"/>' +
      [
        'M20 40 L60 58 L72 96 L110 104',
        'M60 58 L96 36 L130 46',
        'M110 104 L150 88 L196 110',
        'M72 96 L50 140 L68 176',
        'M150 88 L170 50 L200 40',
        'M110 104 L118 150 L160 168 L190 180',
        'M50 140 L18 156',
        'M118 150 L90 186',
      ]
        .map((d) => `<path d="${d}" stroke="#bf9c62" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`)
        .join(''),
    '0 0 220 200',
  ),
  BED_W, BED_H,
);
// политая тёмная земля с бороздами
registerSvg(
  'garden_wet',
  svgDoc(
    '<rect x="3" y="3" width="214" height="194" rx="22" fill="#6e4a2c" stroke="#553620" stroke-width="6"/>' +
      [40, 80, 120, 160].map((y) => `<rect x="18" y="${y - 6}" width="184" height="12" rx="6" fill="#583a22"/>`).join('') +
      [[40, 28], [150, 64], [90, 104], [180, 146], [36, 140], [120, 182]]
        .map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="12" ry="5" fill="#a5d8ff" opacity=".45"/>`)
        .join(''),
    '0 0 220 200',
  ),
  BED_W, BED_H,
);
// подсветка «жми сейчас»
registerSvg(
  'garden_hl',
  svgDoc('<rect x="8" y="8" width="244" height="224" rx="34" fill="#fff3bf" fill-opacity=".25" stroke="#ffd43b" stroke-width="12"/>', '0 0 260 240'),
  260, 240,
);
// зёрнышко
registerSvg('garden_seed', svgDoc('<ellipse cx="20" cy="20" rx="9" ry="14" fill="#c08a3e" stroke="#7a5320" stroke-width="3"/><ellipse cx="17" cy="15" rx="3" ry="5" fill="#f2d49b"/>', '0 0 40 40'), 40);
// жаркое марево
registerSvg('garden_haze', svgDoc('<path d="M6 30 q14 -20 28 0 t28 0 t28 0 t28 0 t28 0" stroke="#ffa94d" stroke-width="7" fill="none" stroke-linecap="round"/>', '0 0 150 60'), 150, 60);
// солнце: лучи (крутятся) и лицо (не крутится)
registerSvg(
  'garden_sunrays',
  svgDoc(
    Array.from({ length: 12 }, (_, i) => {
      const a = (i * Math.PI) / 6;
      return `<line x1="${50 + 30 * Math.cos(a)}" y1="${50 + 30 * Math.sin(a)}" x2="${50 + 46 * Math.cos(a)}" y2="${50 + 46 * Math.sin(a)}" stroke="#fab005" stroke-width="6" stroke-linecap="round"/>`;
    }).join(''),
  ),
  256,
);
registerSvg(
  'garden_sunface',
  svgDoc(
    '<circle cx="50" cy="50" r="26" fill="#ffd43b" stroke="#fab005" stroke-width="3"/>' +
      '<circle cx="41" cy="46" r="3" fill="#7a4b00"/><circle cx="59" cy="46" r="3" fill="#7a4b00"/>' +
      '<path d="M41 58 Q50 64 59 58" stroke="#7a4b00" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '<circle cx="35" cy="55" r="4" fill="#ff922b" opacity=".6"/><circle cx="65" cy="55" r="4" fill="#ff922b" opacity=".6"/>',
  ),
  256,
);
// бабочка (вид сверху, голова вправо)
registerSvg(
  'garden_butterfly',
  svgDoc(
    '<ellipse cx="44" cy="28" rx="20" ry="24" fill="#ff8fab" stroke="#d6336c" stroke-width="3"/>' +
      '<ellipse cx="44" cy="72" rx="20" ry="24" fill="#ff8fab" stroke="#d6336c" stroke-width="3"/>' +
      '<ellipse cx="66" cy="34" rx="13" ry="16" fill="#ffd43b" stroke="#f08c00" stroke-width="3"/>' +
      '<ellipse cx="66" cy="66" rx="13" ry="16" fill="#ffd43b" stroke="#f08c00" stroke-width="3"/>' +
      '<circle cx="42" cy="26" r="6" fill="#fff"/><circle cx="42" cy="74" r="6" fill="#fff"/>' +
      '<rect x="30" y="45" width="50" height="10" rx="5" fill="#5c3d2e"/>' +
      '<path d="M80 48 Q90 40 94 34 M80 52 Q90 60 94 66" stroke="#5c3d2e" stroke-width="3" fill="none" stroke-linecap="round"/>',
  ),
  160,
);

export default {
  id: 'garden',

  drawSite(scene, site) {
    const { x: cx, y: cy } = site;
    const g = scene.add.graphics().setDepth(DEPTH.site);
    // лужайка за заборчиком
    const fx = cx - 410, fy = cy - 380, fw = 820, fh = 690, fr = 160;
    g.fillStyle(0xe6edd2, 1).fillRoundedRect(fx, fy, fw, fh, fr);
    // заборчик: две жерди + столбики по прямым участкам
    g.lineStyle(9, 0xc9a27a, 1).strokeRoundedRect(fx, fy, fw, fh, fr);
    g.lineStyle(4, 0xa47551, 1).strokeRoundedRect(fx + 9, fy + 9, fw - 18, fh - 18, fr - 9);
    g.fillStyle(0x8b5e3c, 1);
    for (let x = fx + fr; x <= fx + fw - fr; x += 50) {
      g.fillRect(x - 7, fy - 7, 14, 14);
      g.fillRect(x - 7, fy + fh - 7, 14, 14);
    }
    for (let y = fy + fr; y <= fy + fh - fr; y += 50) {
      g.fillRect(fx - 7, y - 7, 14, 14);
      g.fillRect(fx + fw - 7, y - 7, 14, 14);
    }
    // дорожка из плиток: от домика вниз и вдоль грядок
    g.fillStyle(0xeadfc6, 1);
    const hx = cx + HOUSE.dx, hy = cy + HOUSE.dy;
    for (let y = hy + HOUSE.h / 2 + 30; y <= cy - 30; y += 44) g.fillRoundedRect(hx - 24, y - 16, 48, 32, 10);
    for (let x = cx - 360; x <= cx + 360; x += 48) g.fillRoundedRect(x - 18, cy - 40, 36, 30, 10);
    // домик: крыша сверху (два ската), труба, крылечко
    const { w, h } = HOUSE;
    g.fillStyle(0x000000, 0.08).fillRoundedRect(hx - w / 2 + 10, hy - h / 2 + 12, w, h, 10);
    g.fillStyle(0xe8795a, 1).fillRoundedRect(hx - w / 2, hy - h / 2, w, h / 2, { tl: 10, tr: 10, bl: 0, br: 0 });
    g.fillStyle(0xcf5c42, 1).fillRoundedRect(hx - w / 2, hy, w, h / 2, { tl: 0, tr: 0, bl: 10, br: 10 });
    g.lineStyle(3, 0xb34a35, 0.6);
    for (let x = hx - w / 2 + 28; x < hx + w / 2; x += 28) g.lineBetween(x, hy - h / 2 + 6, x, hy + h / 2 - 6);
    g.lineStyle(8, 0x9c3b28, 1).lineBetween(hx - w / 2, hy, hx + w / 2, hy);
    g.fillStyle(0x868e96, 1).fillRect(hx + 50, hy - 62, 32, 32);
    g.fillStyle(0x495057, 1).fillRect(hx + 56, hy - 56, 20, 20);
    g.fillStyle(0xc9a27a, 1).fillRect(hx - 34, hy + h / 2, 68, 18);
    // кустики у домика
    g.fillStyle(0xa9c08a, 1).fillCircle(hx + w / 2 + 40, hy + 20, 34).fillCircle(hx + w / 2 + 70, hy - 20, 26);
    // три грядки с бороздами
    for (const b of BEDS) {
      const bx = cx + b.dx - BED_W / 2, by = cy + b.dy - BED_H / 2;
      g.fillStyle(0x000000, 0.08).fillRoundedRect(bx + 6, by + 8, BED_W, BED_H, 22);
      g.fillStyle(0xa47551, 1).fillRoundedRect(bx, by, BED_W, BED_H, 22);
      g.fillStyle(0x8a5f3f, 1);
      for (let y = 40; y <= 160; y += 40) g.fillRoundedRect(bx + 18, by + y - 6, BED_W - 36, 12, 6);
    }
  },

  start(ctx) {
    const { scene, site, heli, input, sfx, fx, layer } = ctx;
    const tw = scene.tweens;
    const extra = []; // объекты вне layer (частицы, бабочка)
    let finished = false;
    let flight = null; // объект-счётчик полёта бабочки

    // солнце печёт
    const sx = site.x + SUN.dx, sy = site.y + SUN.dy;
    const glow = scene.add.circle(sx, sy, 150, 0xffe066, 0.35);
    const sun = scene.add.image(sx, sy, 'garden_sunrays').setDisplaySize(230, 230);
    const face = scene.add.image(sx, sy, 'garden_sunface').setDisplaySize(230, 230);
    layer.add([glow, sun, face]);
    tw.add({ targets: sun, angle: 360, duration: 12000, repeat: -1 });
    tw.add({ targets: glow, scale: 1.18, alpha: 0.18, yoyo: true, repeat: -1, duration: 900, ease: 'Sine.easeInOut' });

    const beds = BEDS.map((b, i) => {
      const x = site.x + b.dx, y = site.y + b.dy;
      const wet = scene.add.image(x, y, 'garden_wet').setDisplaySize(BED_W, BED_H).setAlpha(0);
      const dry = scene.add.image(x, y, 'garden_dry').setDisplaySize(BED_W, BED_H);
      const hl = scene.add.image(x, y, 'garden_hl').setDisplaySize(BED_W + 40, BED_H + 40).setVisible(false);
      layer.add([wet, dry]);
      // увядшие цветы
      const wilted = [-60, 0, 60].map((ox, k) => {
        const w = scene.add.image(x + ox, y - 10 + (k % 2) * 34, 'icon_wilted').setDisplaySize(112, 112);
        layer.add(w);
        tw.add({ targets: w, angle: { from: -4, to: 4 }, yoyo: true, repeat: -1, duration: 1400 + k * 230, ease: 'Sine.easeInOut' });
        return w;
      });
      // марево над грядкой
      const haze = [0, 1].map((k) => {
        const hz = scene.add.image(x + (k ? 40 : -40), y - 40, 'garden_haze').setDisplaySize(110, 44).setAlpha(0);
        layer.add(hz);
        tw.add({
          targets: hz, y: y - 150, alpha: { from: 0.7, to: 0 }, duration: 1800, repeat: -1, delay: k * 900 + i * 300,
        });
        return hz;
      });
      layer.add(hl);
      return { i, x, y, wet, dry, hl, wilted, haze, seeded: false, hlOn: false };
    });

    const remaining = () => beds.filter((b) => !b.seeded);

    function setHighlight(b, on) {
      if (b.hlOn === on) return;
      b.hlOn = on;
      tw.killTweensOf(b.hl);
      if (on) {
        b.hl.setVisible(true).setAlpha(1).setDisplaySize(BED_W + 40, BED_H + 40);
        const s = b.hl.scaleX;
        tw.add({ targets: b.hl, scaleX: s * 1.08, scaleY: b.hl.scaleY * 1.08, alpha: 0.55, yoyo: true, repeat: -1, duration: 420, ease: 'Sine.easeInOut' });
      } else {
        b.hl.setVisible(false);
      }
    }

    function seed(b) {
      b.seeded = true;
      setHighlight(b, false);
      sfx.pop();
      // зёрнышки летят от вертолёта на грядку и «падают» (уменьшаются)
      const seeds = [];
      for (let k = 0; k < 16; k++) {
        const s = scene.add.image(heli.x, heli.y, 'garden_seed').setDepth(DEPTH.fx).setScale(2.6).setAngle(Phaser.Math.Between(0, 360));
        extra.push(s);
        seeds.push(s);
        tw.add({
          targets: s,
          x: b.x + Phaser.Math.Between(-95, 95), y: b.y + Phaser.Math.Between(-85, 85),
          scale: 1.1, angle: s.angle + 180,
          duration: 420 + k * 25, ease: 'Quad.easeIn',
          onComplete: () => { if (k % 5 === 0) sfx.pop(); },
        });
      }
      // земля темнеет
      tw.add({ targets: b.dry, alpha: 0, delay: 450, duration: 500 });
      tw.add({ targets: b.wet, alpha: 1, delay: 450, duration: 500 });
      for (const hz of b.haze) { tw.killTweensOf(hz); tw.add({ targets: hz, alpha: 0, duration: 300 }); }
      for (const w of b.wilted) {
        tw.killTweensOf(w);
        tw.add({ targets: w, scale: 0, alpha: 0, delay: 400, duration: 350, ease: 'Back.easeIn' });
      }
      tw.add({ targets: seeds, alpha: 0, delay: 900, duration: 300 });
      // весело вырастают цветы
      const spots = [[-68, -48], [0, -58], [68, -48], [-68, 42], [0, 32], [68, 42]];
      spots.forEach(([ox, oy], k) => {
        const f = scene.add.image(b.x + ox, b.y + oy, `garden_flower${(k + b.i) % FLOWER_COLORS.length}`)
          .setDisplaySize(104, 104).setOrigin(0.5, 0.95);
        const full = f.scale;
        f.setScale(0);
        layer.add(f);
        tw.add({
          targets: f, scale: full, delay: 900 + k * 120, duration: 650, ease: 'Back.easeOut', easeParams: [2.6],
          onStart: () => { if (k === 0 || k === 3) sfx.sparkle(); },
          onComplete: () => {
            tw.add({ targets: f, angle: { from: -6, to: 6 }, yoyo: true, repeat: -1, duration: 700 + k * 60, ease: 'Sine.easeInOut' });
          },
        });
      });
      scene.time.delayedCall(950, () => fx.sparkle(b.x, b.y - 20, [0xff6b9a, 0xffd43b, 0xb197fc, 0x69db7c, 0xffffff], 30));

      if (!remaining().length) {
        finished = true;
        ctx.pointAt(null);
        // солнышко улыбается мягче — гаснет жар
        tw.add({ targets: glow, alpha: 0, duration: 800, delay: 1200 });
        scene.time.delayedCall(1900, () => { ctx.done(); flyButterfly(); });
      }
    }

    function flyButterfly() {
      const bf = scene.add.image(site.x - 520, site.y + 260, 'garden_butterfly').setDisplaySize(110, 110).setDepth(DEPTH.missionHigh);
      extra.push(bf);
      const sy0 = bf.scaleY;
      tw.add({ targets: bf, scaleY: sy0 * 0.35, yoyo: true, repeat: -1, duration: 130 });
      const path = new Phaser.Curves.Spline([
        site.x - 520, site.y + 260,
        beds[0].x, beds[0].y - 20,
        beds[1].x - 40, beds[1].y + 90,
        beds[1].x + 30, beds[1].y - 60,
        beds[2].x, beds[2].y + 40,
        site.x + 300, site.y - 200,
        site.x + 560, site.y - 420,
      ]);
      const st = { t: 0 };
      flight = st;
      tw.add({
        targets: st, t: 1, duration: 6500, ease: 'Linear',
        onUpdate: () => {
          const p = path.getPoint(st.t), q = path.getPoint(Math.min(1, st.t + 0.01));
          bf.setPosition(p.x, p.y);
          if (q.x !== p.x || q.y !== p.y) bf.setRotation(Math.atan2(q.y - p.y, q.x - p.x));
        },
        onComplete: () => bf.setVisible(false),
      });
    }

    return {
      update() {
        if (finished) return;
        const left = remaining();
        let near = null, nd = Infinity;
        for (const b of left) {
          const d = Math.hypot(heli.x - b.x, heli.y - b.y);
          if (d < nd) { nd = d; near = b; }
        }
        for (const b of left) setHighlight(b, b === near && nd < OVER_R);
        ctx.pointAt(near ? { x: near.x, y: near.y } : null);
        if (near && nd < OVER_R && input.actionPressed()) seed(near);
      },
      targets: () => remaining().map((b) => ({ x: b.x, y: b.y })),
      destroy() {
        for (const o of [...layer.list]) tw.killTweensOf(o);
        for (const b of beds) tw.killTweensOf(b.hl);
        tw.killTweensOf(sun); tw.killTweensOf(glow);
        for (const o of extra) { tw.killTweensOf(o); o.destroy(); }
        extra.length = 0;
        if (flight) tw.killTweensOf(flight);
        layer.removeAll(true);
      },
    };
  },
};
