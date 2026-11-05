// Миссия «Пожар в лесу»: на поляне горят 3 дерева. Зависнуть над огнём и нажать кнопку —
// из вертолёта льётся вода. Первое нажатие — огонь уменьшается, второе — гаснет, дерево снова зелёное.
import { DEPTH } from '../config.js';
import { registerSvg } from '../art.js';
import { svgDoc, starPoints } from '../icons.js';

// ---------- текстуры ----------

// крупное лиственное дерево сверху (несколько «шапок»)
const bigTree = (c1, c2, hl, extra = '') =>
  svgDoc(
    '<circle cx="104" cy="108" r="84" fill="#000" opacity=".13"/>' +
      `<circle cx="70" cy="74" r="44" fill="${c1}"/><circle cx="130" cy="70" r="42" fill="${c1}"/>` +
      `<circle cx="132" cy="130" r="44" fill="${c1}"/><circle cx="70" cy="132" r="42" fill="${c1}"/>` +
      `<circle cx="100" cy="100" r="58" fill="${c1}"/>` +
      `<circle cx="118" cy="120" r="34" fill="${c2}" opacity=".6"/><circle cx="84" cy="84" r="22" fill="${hl}"/>` +
      `<circle cx="132" cy="66" r="12" fill="${hl}" opacity=".8"/><circle cx="62" cy="130" r="10" fill="${hl}" opacity=".7"/>` +
      extra,
    '0 0 200 200',
  );
registerSvg('fire_tree', bigTree('#96b672', '#7a9a5c', '#b2cd91'), 220);
registerSvg(
  'fire_tree_burnt',
  bigTree('#5a5048', '#3d3631', '#776a5f',
    '<circle cx="80" cy="110" r="7" fill="#c2410c" opacity=".8"/><circle cx="126" cy="84" r="6" fill="#c2410c" opacity=".7"/>' +
      '<circle cx="112" cy="138" r="5" fill="#ea580c" opacity=".7"/>'),
  220,
);

// ёлка сверху: многолучевая звезда слоями
const pine = (c1, c2, c3) =>
  svgDoc(
    `<polygon points="${starPoints(54, 56, 46, 30, 9)}" fill="#000" opacity=".12"/>` +
      `<polygon points="${starPoints(50, 50, 46, 30, 9)}" fill="${c1}"/>` +
      `<polygon points="${starPoints(50, 50, 32, 20, 9)}" fill="${c2}" transform="rotate(20 50 50)"/>` +
      `<polygon points="${starPoints(50, 50, 18, 11, 7)}" fill="${c3}"/>`,
  );
registerSvg('fire_pine', pine('#7f9e6a', '#93b17c', '#a9c58f'), 160);
registerSvg('fire_pine2', pine('#8aa872', '#9fbb86', '#b5cd9a'), 160);

// язык пламени (основание внизу)
registerSvg(
  'fire_flame',
  svgDoc(
    '<path d="M50 4 C62 26 90 44 88 82 C86 112 70 126 50 126 C30 126 12 112 12 82 C12 60 26 48 32 26 C40 40 44 46 47 52 C50 34 54 20 50 4Z" fill="#f03e3e"/>' +
      '<path d="M50 36 C60 54 78 64 76 90 C75 110 64 120 50 120 C36 120 24 110 24 92 C24 78 32 70 38 58 C42 66 45 70 48 72 C51 62 52 50 50 36Z" fill="#ff922b"/>' +
      '<path d="M50 70 C57 82 64 88 63 102 C62 112 56 117 50 117 C44 117 37 112 37 102 C37 92 45 84 50 70Z" fill="#ffd43b"/>' +
      '<ellipse cx="50" cy="106" rx="7" ry="9" fill="#fff6bf"/>',
    '0 0 100 130',
  ),
  100, 130,
);

// мягкие пятна: свечение, дым/пар (белое — подкрашиваем tint)
registerSvg(
  'fire_glow',
  svgDoc('<defs><radialGradient id="g"><stop offset="0" stop-color="#ffd43b" stop-opacity=".9"/><stop offset=".45" stop-color="#ff922b" stop-opacity=".5"/><stop offset="1" stop-color="#ff6b00" stop-opacity="0"/></radialGradient></defs><circle cx="50" cy="50" r="50" fill="url(#g)"/>'),
  256,
);
registerSvg(
  'fire_puff',
  svgDoc('<defs><radialGradient id="g"><stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset=".6" stop-color="#fff" stop-opacity=".7"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><circle cx="50" cy="50" r="50" fill="url(#g)"/>'),
  128,
);
// капля воды
registerSvg(
  'fire_drop',
  svgDoc('<path d="M50 4 C50 4 16 48 16 66 A34 34 0 0 0 84 66 C84 48 50 4 50 4Z" fill="#4dabf7" stroke="#1c7ed6" stroke-width="5"/><ellipse cx="38" cy="64" rx="7" ry="12" fill="#fff" opacity=".7"/>'),
  64,
);
// кольцо всплеска
registerSvg('fire_ring', svgDoc('<circle cx="50" cy="50" r="44" fill="#a5d8ff" fill-opacity=".45" stroke="#339af0" stroke-width="8"/><circle cx="50" cy="50" r="30" fill="none" stroke="#fff" stroke-width="4" opacity=".8"/>'), 256);

// ---------- раскладка ----------

// три горящих дерева на поляне (смещения от центра места)
const SPOTS = [
  { dx: -190, dy: -110 },
  { dx: 185, dy: -125 },
  { dx: 5, dy: 185 },
];
const TREE_SIZE = 210;
const HIT_R = 150; // радиус «можно тушить»
const CLEARING_R = 340;

// зелёные/обугленные деревья, нарисованные в drawSite (их перекрашивает start)
let siteTrees = [];

export default {
  id: 'fire',

  drawSite(scene, site) {
    const rnd = new Phaser.Math.RandomDataGenerator(['hb-fire-forest']);
    const g = scene.add.graphics().setDepth(DEPTH.site);
    // лесная подстилка — неровный тёмный круг
    g.fillStyle(0xc2d1a0, 1).fillCircle(site.x, site.y, site.r + 30);
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2;
      g.fillCircle(site.x + Math.cos(a) * (site.r + 30), site.y + Math.sin(a) * (site.r + 30), rnd.between(50, 90));
    }
    // светлая поляна в центре (несколько кругов — неровный край)
    g.fillStyle(0xe3ebcb, 1).fillCircle(site.x, site.y, CLEARING_R - 30);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + 0.3;
      g.fillCircle(site.x + Math.cos(a) * (CLEARING_R - 110), site.y + Math.sin(a) * (CLEARING_R - 110), rnd.between(110, 150));
    }
    // травинки на поляне
    for (let i = 0; i < 40; i++) {
      const a = rnd.realInRange(0, Math.PI * 2), d = Math.sqrt(rnd.frac()) * (CLEARING_R - 60);
      const x = site.x + Math.cos(a) * d, y = site.y + Math.sin(a) * d;
      g.fillStyle(i % 2 ? 0xd2deb6 : 0xccd9ae, 1).fillEllipse(x, y, rnd.between(24, 46), rnd.between(12, 22));
    }

    // густой лес вокруг поляны
    const trees = [];
    for (let i = 0; i < 3000 && trees.length < 150; i++) {
      const a = rnd.realInRange(0, Math.PI * 2);
      const d = rnd.realInRange(CLEARING_R + 10, site.r + 70);
      const x = site.x + Math.cos(a) * d, y = site.y + Math.sin(a) * d;
      const s = rnd.between(100, 165);
      if (trees.some((t) => Math.hypot(t.x - x, t.y - y) < (t.s + s) * 0.3)) continue;
      trees.push({ x, y, s, key: rnd.pick(['tree_top', 'tree_top2', 'fire_pine', 'fire_pine2', 'fire_pine']) });
    }
    trees.sort((p, q) => p.y - q.y);
    for (const t of trees) scene.add.image(t.x, t.y, t.key).setDepth(DEPTH.site).setDisplaySize(t.s, t.s).setRotation(rnd.realInRange(0, 6.28));

    // три больших дерева на поляне (будут гореть)
    siteTrees = SPOTS.map(({ dx, dy }) => {
      const x = site.x + dx, y = site.y + dy;
      const burnt = scene.add.image(x, y, 'fire_tree_burnt').setDepth(DEPTH.site + 1).setDisplaySize(TREE_SIZE, TREE_SIZE).setAlpha(0);
      const green = scene.add.image(x, y, 'fire_tree').setDepth(DEPTH.site + 1).setDisplaySize(TREE_SIZE, TREE_SIZE);
      return { green, burnt, scale: green.scale };
    });
  },

  start(ctx) {
    const { scene, site, heli, input, sfx } = ctx;
    const objs = []; // всё, что создали — уничтожим в destroy
    const timers = [];
    const keep = (o) => (objs.push(o), o);
    const later = (ms, fn) => timers.push(scene.time.delayedCall(ms, fn));
    let t = 0, finished = false, sprayCd = 0;

    // ---- огни ----
    const fires = SPOTS.map(({ dx, dy }, i) => {
      const x = site.x + dx, y = site.y + dy;
      const tree = siteTrees[i];
      if (tree) {
        scene.tweens.add({ targets: tree.green, alpha: 0, duration: 500 });
        scene.tweens.add({ targets: tree.burnt, alpha: 1, duration: 500 });
      }
      const glow = keep(scene.add.image(x, y + 10, 'fire_glow').setDepth(DEPTH.missionLow).setDisplaySize(300, 300).setBlendMode('ADD'));
      const box = keep(scene.add.container(x, y + 55).setDepth(DEPTH.missionLow + 1));
      // языки пламени: сзади поменьше, спереди крупный
      const layout = [
        [-40, -50, 84], [42, -54, 90], [0, -70, 100],
        [-66, -4, 110], [66, -2, 114], [0, 8, 168],
      ];
      const flames = layout.map(([fx, fy, h], k) => {
        const im = scene.add.image(fx, fy, 'fire_flame').setOrigin(0.5, 0.95);
        im.setDisplaySize(h * 0.77, h);
        box.add(im);
        return { im, base: im.scale, phase: k * 1.7 + i * 2.3, speed: 9 + (k % 3) * 2.5 };
      });
      const smoke = keep(scene.add.particles(x, y - 70, 'fire_puff', {
        x: { min: -40, max: 40 }, speedX: { min: 10, max: 50 }, speedY: { min: -130, max: -70 },
        scale: { start: 0.5, end: 1.7 }, alpha: { start: 0.5, end: 0 }, lifespan: 2000, frequency: 170,
        tint: [0x6b6f75, 0x868e96, 0x5c5f66],
      }).setDepth(DEPTH.missionHigh));
      const embers = keep(scene.add.particles(x, y - 20, 'dot', {
        x: { min: -60, max: 60 }, speedX: { min: -30, max: 30 }, speedY: { min: -200, max: -90 },
        scale: { start: 0.7, end: 0 }, lifespan: 900, frequency: 110, tint: [0xffd43b, 0xff922b, 0xff6b00],
        blendMode: 'ADD',
      }).setDepth(DEPTH.missionHigh + 1));
      box.setScale(0);
      return { x, y, level: 2, size: 0, target: 1, glow, box, flames, smoke, embers, tree };
    });
    sfx.whoosh();

    // ---- подсветка цели ----
    const ring = keep(scene.add.graphics().setDepth(DEPTH.missionLow - 1));
    const hint = keep(scene.add.image(0, 0, 'btn_a').setDisplaySize(110, 110).setDepth(DEPTH.missionHigh + 2).setVisible(false));

    const burning = () => fires.filter((f) => f.level > 0);
    const nearest = (list) => {
      let best = null, bd = Infinity;
      for (const f of list) {
        const d = Math.hypot(f.x - heli.x, f.y - heli.y);
        if (d < bd) { bd = d; best = f; }
      }
      return best;
    };

    // ---- вода ----
    function spray(tx, ty, hit) {
      sfx.spray();
      // moveTo — в локальных координатах эмиттера
      const ox = heli.x, oy = heli.y;
      const drops = keep(scene.add.particles(ox, oy, 'fire_drop', {
        x: { min: -50, max: 50 }, y: { min: -35, max: 35 },
        moveToX: { min: tx - ox - 190, max: tx - ox + 190 }, moveToY: { min: ty - oy - 150, max: ty - oy + 190 },
        scale: { start: 1.3, end: 0.7 }, alpha: { start: 1, end: 0.9 },
        lifespan: 450, frequency: 14, quantity: 4,
      }).setDepth(DEPTH.carried));
      later(480, () => drops.stop());
      later(1100, () => drops.destroy());
      later(330, () => {
        sfx.splash();
        const r = keep(scene.add.image(tx, ty, 'fire_ring').setDepth(DEPTH.heli + 3).setDisplaySize(140, 140));
        const s = r.scale;
        scene.tweens.add({ targets: r, scale: s * (hit ? 3.4 : 2.2), alpha: 0, duration: 700, ease: 'Sine.easeOut', onComplete: () => r.destroy() });
        const burst = keep(scene.add.particles(tx, ty, 'fire_drop', {
          speed: { min: 220, max: 460 }, scale: { start: 1, end: 0.2 }, lifespan: 600, emitting: false,
        }).setDepth(DEPTH.heli + 3));
        burst.explode(hit ? 28 : 12);
        later(700, () => burst.destroy());
      });
    }

    function steam(x, y, n, scale = 1) {
      const em = keep(scene.add.particles(x, y - 20, 'fire_puff', {
        x: { min: -60, max: 60 }, speedX: { min: -60, max: 60 }, speedY: { min: -170, max: -60 },
        scale: { start: 0.8 * scale, end: 2.4 * scale }, alpha: { start: 0.9, end: 0 }, lifespan: 1300,
        tint: [0xffffff, 0xf1f3f5, 0xe7f5ff], emitting: false,
      }).setDepth(DEPTH.missionHigh + 2));
      em.explode(n);
      later(1500, () => em.destroy());
    }

    function douse(f) {
      f.level--;
      later(380, () => {
        if (f.level === 1) {
          f.target = 0.55;
          f.smoke.frequency = 260;
          f.embers.frequency = 220;
          steam(f.x, f.y, 8, 0.8);
          sfx.pop();
        } else {
          f.target = 0;
          f.smoke.stop();
          f.embers.stop();
          steam(f.x, f.y, 16, 1.1);
          scene.tweens.add({ targets: f.glow, alpha: 0, duration: 500 });
          if (f.tree) {
            const tr = f.tree;
            scene.tweens.add({ targets: tr.burnt, alpha: 0, duration: 600, delay: 150 });
            scene.tweens.add({ targets: tr.green, alpha: 1, duration: 600, delay: 150 });
            scene.tweens.add({ targets: tr.green, scale: tr.scale * 1.15, duration: 260, delay: 500, yoyo: true, ease: 'Sine.easeOut' });
          }
          later(600, () => { sfx.sparkle(); ctx.fx.sparkle(f.x, f.y, [0x8ce99a, 0xffd43b, 0xffffff, 0x74c0fc], 30); });
          if (!burning().length && !finished) {
            finished = true;
            later(1300, () => ctx.done());
          }
        }
      });
    }

    return {
      update(dt) {
        t += dt;
        sprayCd -= dt;
        // огонь: плавный размер + мерцание
        for (const f of fires) {
          f.size += (f.target - f.size) * Math.min(1, dt * 4);
          if (f.target === 0 && f.size < 0.02) f.size = 0;
          const sz = f.size;
          f.box.setScale(sz).setVisible(sz > 0.01);
          for (const fl of f.flames) {
            const w = Math.sin(t * fl.speed + fl.phase), h = Math.sin(t * (fl.speed * 1.3) + fl.phase * 0.7);
            fl.im.scaleX = fl.base * (1 + 0.07 * w);
            fl.im.scaleY = fl.base * (1 + 0.14 * h);
            fl.im.rotation = 0.07 * Math.sin(t * 5 + fl.phase);
          }
          if (f.level > 0) f.glow.setAlpha((0.55 + 0.2 * Math.sin(t * 7 + f.x)) * Math.min(1, sz * 1.4));
        }

        const live = burning();
        const over = live.find((f) => heli.isOver(f.x, f.y, HIT_R));
        ctx.pointAt(live.length ? nearest(live) : null);

        // подсветка: пульсирующее кольцо + кнопка
        ring.clear();
        if (over) {
          const p = 0.5 + 0.5 * Math.sin(t * 8);
          ring.fillStyle(0x74c0fc, 0.16 + 0.1 * p).fillCircle(over.x, over.y, 140 + 8 * p);
          ring.lineStyle(12, 0x4dabf7, 0.85).strokeCircle(over.x, over.y, 140 + 8 * p);
          ring.lineStyle(5, 0xffffff, 0.9).strokeCircle(over.x, over.y, 140 + 8 * p);
          hint.setVisible(true).setPosition(over.x + 150, over.y - 140 - 10 * Math.abs(Math.sin(t * 5)));
        } else {
          hint.setVisible(false);
        }

        if (input.actionPressed() && sprayCd <= 0 && !finished) {
          sprayCd = 0.45;
          if (over) {
            spray(over.x, over.y, true);
            douse(over);
          } else {
            spray(heli.x, heli.y + 40, false); // мимо — просто водичка, без наказания
          }
        }
      },
      targets: () => burning().map((f) => ({ x: f.x, y: f.y })),
      destroy() {
        for (const tm of timers) tm.remove(false);
        for (const o of objs) {
          scene.tweens.killTweensOf(o);
          if (o.scene) o.destroy();
        }
        for (const tr of siteTrees) {
          scene.tweens.killTweensOf(tr.green);
          scene.tweens.killTweensOf(tr.burnt);
          tr.green.setAlpha(1).setScale(tr.scale);
          tr.burnt.setAlpha(0);
        }
        ctx.pointAt(null);
      },
    };
  },
};
