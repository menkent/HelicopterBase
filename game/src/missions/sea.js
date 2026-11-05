// Миссия «Спасение на озере»: зайка бултыхается посреди озера на бревнышке.
// Зависнуть над зайкой → кнопка → падает спасательный круг → зайка в круге → висит на тросе и летит в больницу.
import { DEPTH } from '../config.js';
import { registerSvg } from '../art.js';
import { svgDoc } from '../icons.js';

// ---------- текстуры ----------

// бревнышко (вид сверху)
registerSvg(
  'sea_log',
  svgDoc(
    '<rect x="4" y="16" width="192" height="48" rx="24" fill="#b07a4f" stroke="#7a5233" stroke-width="4"/>' +
      '<path d="M30 30 H110 M60 48 H160" stroke="#8d5f3b" stroke-width="4" stroke-linecap="round"/>' +
      '<ellipse cx="180" cy="40" rx="14" ry="22" fill="#e2b98a" stroke="#7a5233" stroke-width="4"/>' +
      '<ellipse cx="180" cy="40" rx="6" ry="11" fill="none" stroke="#b07a4f" stroke-width="3"/>',
    '0 0 200 80',
  ),
  220, 88,
);

// мостки сверху (доски поперёк, сваи по краям)
{
  let planks = '';
  for (let i = 0; i < 8; i++) {
    planks += `<rect x="${8 + i * 30}" y="10" width="26" height="60" rx="3" fill="${i % 2 ? '#c99a6b' : '#d4a777'}" stroke="#8d6542" stroke-width="2"/>`;
  }
  let posts = '';
  for (const x of [14, 120, 226]) for (const y of [6, 74]) posts += `<circle cx="${x}" cy="${y}" r="7" fill="#7a5233"/>`;
  registerSvg('sea_pier', svgDoc(planks + posts, '0 0 250 80'), 300, 96);
}

// камень сверху
registerSvg(
  'sea_rock',
  svgDoc(
    '<path d="M14 58 C8 36 26 14 50 12 C76 10 94 30 90 56 C86 80 66 90 46 88 C26 86 18 76 14 58Z" fill="#a3a9a6" stroke="#7d8481" stroke-width="3"/>' +
      '<path d="M30 40 C36 28 50 24 62 28" stroke="#c4cac7" stroke-width="6" fill="none" stroke-linecap="round"/>',
  ),
  200,
);

// кувшинка: лист с вырезом (+ цветок)
const lily = (flower) =>
  '<path d="M50 50 L92 38 A44 44 0 1 1 88 28 Z" fill="#7fb069" stroke="#5e8f4b" stroke-width="3"/>' +
  '<path d="M50 50 L20 70 M50 50 L30 22 M50 50 L72 82" stroke="#6a9c56" stroke-width="2"/>' +
  (flower
    ? [0, 72, 144, 216, 288]
        .map((a) => `<ellipse cx="50" cy="50" rx="9" ry="18" fill="#ffc2d4" stroke="#f08fb0" stroke-width="2" transform="rotate(${a} 50 50) translate(0 -12)"/>`)
        .join('') + '<circle cx="50" cy="50" r="8" fill="#ffd43b"/>'
    : '');
registerSvg('sea_lily', svgDoc(lily(false)), 120);
registerSvg('sea_lily_flower', svgDoc(lily(true)), 120);

// пучок камышей сверху
registerSvg(
  'sea_reeds',
  svgDoc(
    [[10, 4], [80, 14], [30, 86], [92, 62], [4, 70], [66, 2]]
      .map(([x, y]) => `<path d="M50 50 L${x} ${y}" stroke="#7d9a52" stroke-width="5" stroke-linecap="round"/>`)
      .join('') +
      [[14, 10], [76, 18], [34, 80], [86, 60]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="6" ry="9" fill="#8b5e3c"/>`).join('') +
      '<circle cx="50" cy="50" r="10" fill="#6b8a45"/>',
  ),
  140,
);

// кольцо-рябь
registerSvg('sea_ripple', svgDoc('<circle cx="50" cy="50" r="44" fill="none" stroke="#fff" stroke-width="5"/>'), 200);

// лапка зайки
registerSvg('sea_paw', svgDoc('<ellipse cx="50" cy="50" rx="30" ry="40" fill="#f8f0e3" stroke="#a07d6a" stroke-width="7"/>'), 64);

// ---------- геометрия места (всё относительно site) ----------

// радиус берега озера по направлению a: неправильная округлая форма, ~385..500
const lakeR = (a) => 440 + 32 * Math.sin(2 * a + 0.7) + 20 * Math.sin(3 * a + 1.9) + 12 * Math.sin(5 * a);

/** Точки контура озера вокруг (cx, cy): радиус = lakeR * k + add. */
function ring(cx, cy, k = 1, add = 0, n = 120) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const r = lakeR(a) * k + add;
    pts.push(new Phaser.Math.Vector2(cx + Math.cos(a) * r, cy + Math.sin(a) * r));
  }
  return pts;
}

// зайка — в глубокой воде, недалеко от середины
const BUNNY_OFF = { x: 70, y: 60 };
// направление на базу (сверху-слева) — там мостки
const PIER_A = Math.atan2(-1450, -2350);

export default {
  id: 'sea',

  drawSite(scene, site) {
    const { x: cx, y: cy } = site;
    const rnd = new Phaser.Math.RandomDataGenerator(['hb-lake']);
    const at = (a, r) => ({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
    const img = (p, key, w, h = w, rot = 0) =>
      scene.add.image(p.x, p.y, key).setDisplaySize(w, h).setRotation(rot).setDepth(DEPTH.site + 1);

    // статичную графику рисуем во временный Graphics и запекаем в RenderTexture (дёшево каждый кадр)
    const g = scene.make.graphics({}, false);

    // берег: трава потемнее по краю, песок, мокрый песок
    g.fillStyle(0xcfdcb2, 1).fillPoints(ring(cx, cy, 1, 120), true);
    g.fillStyle(0xeee0b8, 1).fillPoints(ring(cx, cy, 1, 70), true);
    for (const p of ring(cx, cy, 1, 80, 48)) g.fillCircle(p.x + rnd.between(-8, 8), p.y + rnd.between(-8, 8), rnd.between(20, 34));
    g.fillStyle(0xdccb98, 1).fillPoints(ring(cx, cy, 1, 22), true);

    // вода: у берега светлее, к середине глубже
    g.fillStyle(0x9fd3ef, 1).fillPoints(ring(cx, cy, 1, 0), true);
    g.fillStyle(0x86c3e8, 1).fillPoints(ring(cx + 10, cy + 10, 0.8, 0), true);
    g.fillStyle(0x73b6e1, 1).fillPoints(ring(cx + 30, cy + 25, 0.52, 0), true);
    g.lineStyle(10, 0xffffff, 0.7).strokePoints(ring(cx, cy, 1, 0), true, true);

    // рябь-штрихи (не возле зайки и не у мостков)
    const bx = cx + BUNNY_OFF.x, by = cy + BUNNY_OFF.y;
    for (let i = 0, placed = 0; i < 400 && placed < 22; i++) {
      const a = rnd.realInRange(0, Math.PI * 2), r = rnd.realInRange(0.15, 0.78) * lakeR(a);
      const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
      if (Math.hypot(x - bx, y - by) < 210 || Math.abs(Phaser.Math.Angle.Wrap(a - PIER_A)) < 0.35) continue;
      const w = rnd.between(34, 56);
      g.lineStyle(6, 0xffffff, 0.5).beginPath();
      g.arc(x - w / 2, y, w / 2, Math.PI * 0.15, Math.PI * 0.85, false);
      g.arc(x + w / 2, y, w / 2, Math.PI * 0.15, Math.PI * 0.85, false);
      g.strokePath();
      placed++;
    }

    const ox = cx - 650, oy = cy - 650;
    scene.add.renderTexture(ox, oy, 1300, 1300).setOrigin(0).setDepth(DEPTH.site).draw(g, -ox, -oy);
    g.destroy();

    // мостки со стороны базы: от берега в воду
    img(at(PIER_A, lakeR(PIER_A) - 60), 'sea_pier', 260, 84, PIER_A);

    // камыши по берегу (снизу и справа, подальше от мостков)
    for (const a of [0.25, 0.42, 0.6, 1.55, 1.72, 2.6, 2.78, -0.95, -0.78]) {
      img(at(a, lakeR(a) + rnd.between(-10, 25)), 'sea_reeds', rnd.between(95, 130), undefined, rnd.realInRange(0, 6.28));
    }
    // кувшинки
    for (const [a, k, flower, s] of [[0.95, 0.74, true, 105], [1.12, 0.82, false, 85], [2.95, 0.66, true, 100], [4.3, 0.72, false, 80], [-0.25, 0.68, false, 90], [2.15, 0.56, false, 75]]) {
      img(at(a, lakeR(a) * k), flower ? 'sea_lily_flower' : 'sea_lily', s, s, rnd.realInRange(0, 6.28));
    }
    // камни у кромки воды
    for (const [a, s] of [[-0.4, 120], [-0.24, 75], [2.3, 100]]) img(at(a, lakeR(a) + 5), 'sea_rock', s, s * 0.9);
  },

  start(ctx) {
    const { scene, site, heli, input, sfx } = ctx;
    const bx = site.x + BUNNY_OFF.x, by = site.y + BUNNY_OFF.y;
    const HOVER_R = 140;
    const timers = [];
    const later = (ms, fn) => timers.push(scene.time.delayedCall(ms, fn));

    // зайка на бревнышке
    const raft = scene.add.container(bx, by).setDepth(DEPTH.missionLow);
    const log = scene.add.image(0, 46, 'sea_log').setDisplaySize(250, 100);
    const pawL = scene.add.image(-84, 4, 'sea_paw').setDisplaySize(44, 56);
    const pawR = scene.add.image(84, 4, 'sea_paw').setDisplaySize(44, 56);
    const bunny = scene.add.image(0, -12, 'bunny').setDisplaySize(185, 185);
    raft.add([log, pawL, pawR, bunny]);
    ctx.layer.add(raft);

    const bob = scene.tweens.add({ targets: raft, y: by + 10, angle: 4, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    // машет лапками — «помогите!»
    scene.tweens.add({ targets: pawL, y: -40, angle: -30, duration: 260, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    scene.tweens.add({ targets: pawR, y: -40, angle: 30, duration: 260, yoyo: true, repeat: -1, delay: 130, ease: 'Sine.easeInOut' });
    scene.tweens.add({ targets: bunny, angle: { from: -6, to: 6 }, duration: 420, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // рябь и брызги вокруг
    const ripples = [];
    for (let i = 0; i < 3; i++) {
      const r = scene.add.image(bx, by + 30, 'sea_ripple').setDepth(DEPTH.missionLow - 1).setAlpha(0);
      ctx.layer.addAt(r, 0);
      ripples.push(r);
      scene.tweens.add({
        targets: r, delay: i * 700, duration: 2100, repeat: -1,
        props: { displayWidth: { from: 180, to: 420 }, displayHeight: { from: 130, to: 320 }, alpha: { from: 0.9, to: 0 } },
      });
    }
    const drops = [];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.3;
      const d = scene.add.image(bx, by, 'dot').setTint(0xffffff).setScale(1.2).setAlpha(0);
      ctx.layer.add(d);
      drops.push(d);
      scene.tweens.add({
        targets: d, delay: i * 160, duration: 650, repeat: -1, repeatDelay: 300,
        props: {
          x: { from: bx + Math.cos(a) * 70, to: bx + Math.cos(a) * 140 },
          y: { from: by + Math.sin(a) * 50, to: by + Math.sin(a) * 110 - 30 },
          alpha: { from: 1, to: 0 },
        },
      });
    }

    // подсветка «жми сейчас»
    const glow = scene.add.graphics().setDepth(DEPTH.missionHigh);

    let phase = 'wait'; // wait → drop → happy → gone
    let t = 0;
    let buoy = null, saved = null;

    const pressed = () => {
      phase = 'drop';
      glow.clear();
      ctx.pointAt(null);
      sfx.whoosh();
      // круг падает с вертолёта: сверху крупный, у воды — нормальный
      buoy = scene.add.image(heli.x, heli.y, 'icon_buoy').setDepth(DEPTH.missionHigh).setDisplaySize(300, 300).setAlpha(0.9);
      scene.tweens.add({
        targets: buoy, x: bx, y: by + 10, displayWidth: 175, displayHeight: 175, angle: 200, alpha: 1,
        duration: 650, ease: 'Quad.easeIn', onComplete: splash,
      });
    };

    const splash = () => {
      sfx.splash();
      ctx.fx.sparkle(bx, by, [0xffffff, 0x74c0fc, 0xa5d8ff, 0x339af0], 34);
      for (let i = 0; i < 2; i++) {
        const r = scene.add.image(bx, by, 'sea_ripple').setDepth(DEPTH.missionLow);
        ctx.layer.add(r);
        scene.tweens.add({
          targets: r, delay: i * 180, duration: 800, alpha: { from: 1, to: 0 },
          displayWidth: { from: 200, to: 520 }, displayHeight: { from: 160, to: 420 },
        });
      }
      // бревнышко уплывает, зайка «запрыгивает» в круг
      bob.stop();
      scene.tweens.killTweensOf([pawL, pawR, bunny]);
      for (const r of ripples) scene.tweens.killTweensOf(r);
      for (const d of drops) { scene.tweens.killTweensOf(d); d.setAlpha(0); }
      for (const r of ripples) scene.tweens.add({ targets: r, alpha: 0, duration: 300 });
      raft.remove([pawL, pawR, bunny], true);
      scene.tweens.add({ targets: raft, x: bx + 260, y: by + 160, angle: 25, alpha: 0, duration: 1600, ease: 'Sine.easeOut' });
      buoy.destroy();
      buoy = null;

      // «зайка в круге» — отдельный объект, им потом владеет игра (трос → больница)
      const ring = scene.add.image(0, 8, 'icon_buoy').setDisplaySize(175, 175);
      const b = scene.add.image(0, -12, 'bunny').setDisplaySize(140, 140);
      saved = scene.add.container(bx, by, [ring, b]).setDepth(DEPTH.missionHigh);
      phase = 'happy';
      later(250, () => {
        sfx.ding();
        ctx.fx.sparkle(bx, by - 40, [0xffd43b, 0xffffff, 0xff8fab], 28);
        scene.tweens.add({ targets: b, y: -50, duration: 220, yoyo: true, repeat: 1, ease: 'Quad.easeOut' });
        scene.tweens.add({ targets: b, scale: b.scale * 1.12, duration: 220, yoyo: true, repeat: 1 });
      });
      later(1300, () => {
        sfx.sparkle();
        ctx.fx.sparkle(saved.x, saved.y, undefined, 18);
        heli.carry(saved);
        phase = 'gone';
        ctx.done();
      });
    };

    return {
      update(dt) {
        t += dt;
        if (phase !== 'wait') return;
        ctx.pointAt({ x: bx, y: by });
        const over = heli.flying && heli.isOver(bx, by, HOVER_R);
        glow.clear();
        if (over) {
          const k = 0.5 + 0.5 * Math.sin(t * 9);
          glow.lineStyle(12, 0xffd43b, 0.6 + 0.4 * k).strokeCircle(bx, by, 125 + 12 * k);
          glow.lineStyle(5, 0xffffff, 0.8).strokeCircle(bx, by, 108 + 12 * k);
          if (input.actionPressed()) pressed();
        }
      },
      targets: () => (phase === 'wait' ? [{ x: bx, y: by }] : []),
      destroy() {
        for (const tm of timers) tm.remove(false);
        scene.tweens.killTweensOf([raft, pawL, pawR, bunny, ...ripples, ...drops]);
        if (buoy) { scene.tweens.killTweensOf(buoy); buoy.destroy(); }
        glow.destroy();
        raft.destroy();
        for (const o of [...ripples, ...drops]) o.destroy();
        // saved (зайка в круге) принадлежит игре — не трогаем
      },
    };
  },
};
