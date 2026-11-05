// Миссия «Спасение в горах»: на вершине самой высокой горы сидит зайка с флажком SOS.
// Зависнуть над зайкой, нажать — спускается трос с крючком, зайка цепляется и летит с вертолётом домой.
import { DEPTH } from '../config.js';
import { registerSvg } from '../art.js';
import { I, svgDoc } from '../icons.js';

// ---------- текстуры ----------

// флажок SOS на палочке (низ палочки — точка вращения)
registerSvg(
  'mountain_sos',
  svgDoc(
    '<rect x="8" y="6" width="7" height="112" rx="3.5" fill="#8b5e3c"/>' +
      '<circle cx="11.5" cy="7" r="6" fill="#ffd43b"/>' +
      '<path d="M15 12 C40 4 60 22 92 12 L92 58 C60 68 40 50 15 58 Z" fill="#e5484d" stroke="#a61e24" stroke-width="3"/>' +
      '<text x="53" y="45" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="26" fill="#fff" text-anchor="middle">SOS</text>',
    '0 0 100 120',
  ),
  150,
  180,
);

// зайка радуется: лапки вверх, глазки-дужки, улыбка
registerSvg(
  'mountain_bunny_joy',
  svgDoc(
    '<ellipse cx="20" cy="46" rx="7" ry="13" transform="rotate(-35 20 46)" fill="#f8f0e3" stroke="#a07d6a" stroke-width="2.5"/>' +
      '<ellipse cx="80" cy="46" rx="7" ry="13" transform="rotate(35 80 46)" fill="#f8f0e3" stroke="#a07d6a" stroke-width="2.5"/>' +
      I.bunny() +
      '<circle cx="40" cy="57" r="5.5" fill="#f8f0e3"/><circle cx="60" cy="57" r="5.5" fill="#f8f0e3"/>' +
      '<path d="M35 59 Q40 52 45 59" stroke="#333" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '<path d="M55 59 Q60 52 65 59" stroke="#333" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '<path d="M43 73 Q50 81 57 73" stroke="#a07d6a" stroke-width="3" fill="#ff8fab" stroke-linecap="round"/>',
  ),
  256,
);

// крючок троса
registerSvg(
  'mountain_hook',
  svgDoc(
    '<rect x="38" y="4" width="24" height="22" rx="6" fill="#ffd43b" stroke="#b08900" stroke-width="4"/>' +
      '<path d="M50 26 V54 C50 76 78 76 78 56" stroke="#6c757d" stroke-width="10" fill="none" stroke-linecap="round"/>',
  ),
  90,
);

// ---------- рисование гор (вид сверху, гранёные «пирамидки») ----------

const lerpColor = (a, b, t) => {
  const c = Phaser.Display.Color.Interpolate.ColorWithColor(
    Phaser.Display.Color.ValueToColor(a), Phaser.Display.Color.ValueToColor(b), 100, Math.round(t * 100));
  return Phaser.Display.Color.GetColor(c.r, c.g, c.b);
};
const LIGHT = { x: -0.62, y: -0.78 }; // свет сверху-слева

/** Нарисовать гору: тень, гранёные склоны, снежная шапка. Возвращает точку вершины. */
function drawMountain(g, rnd, cx, cy, R, { snow = 0.42, flat = 0 } = {}) {
  const n = 9 + Math.round(R / 60);
  const a0 = rnd.realInRange(0, Math.PI * 2);
  const ring = [];
  for (let i = 0; i < n; i++) {
    const a = a0 + (i / n) * Math.PI * 2 + rnd.realInRange(-0.12, 0.12);
    const r = R * (i % 2 ? rnd.realInRange(0.8, 0.9) : rnd.realInRange(0.96, 1.06));
    ring.push({ a, r });
  }
  // вершина чуть сдвинута к свету — склоны неодинаковые
  const px = cx - R * 0.06, py = cy - R * 0.08;
  const at = (k, s) => ({ x: cx + Math.cos(ring[k].a) * ring[k].r * s, y: cy + Math.sin(ring[k].a) * ring[k].r * s });

  // тень на земле
  g.fillStyle(0x5c5f66, 0.22);
  g.fillPoints(ring.map((_, k) => { const p = at(k, 1.04); return { x: p.x + R * 0.16, y: p.y + R * 0.2 }; }), true);
  // подножие (тёмная кайма)
  g.fillStyle(0x7d7f80, 1).fillPoints(ring.map((_, k) => at(k, 1.03)), true);

  // грани склона: треугольник вершина–ребро, яркость от направления на свет
  for (let k = 0; k < n; k++) {
    const p1 = at(k, 1), p2 = at((k + 1) % n, 1);
    const mx = (p1.x + p2.x) / 2 - px, my = (p1.y + p2.y) / 2 - py;
    const d = Math.hypot(mx, my) || 1;
    const lit = ((mx / d) * LIGHT.x + (my / d) * LIGHT.y + 1) / 2; // 0..1
    g.fillStyle(lerpColor(0x7e858c, 0xc5cad0, lit), 1);
    g.fillTriangle(px, py, p1.x, p1.y, p2.x, p2.y);
  }
  // снежная шапка: рваный край, тоже гранёная
  const sn = [];
  for (let k = 0; k < n; k++) {
    const s = snow * (k % 2 ? 0.88 : 1.1) * rnd.realInRange(0.85, 1.12);
    const p = at(k, 1);
    sn.push({ x: px + (p.x - px) * s, y: py + (p.y - py) * s });
  }
  for (let k = 0; k < n; k++) {
    const p1 = sn[k], p2 = sn[(k + 1) % n];
    const mx = (p1.x + p2.x) / 2 - px, my = (p1.y + p2.y) / 2 - py;
    const d = Math.hypot(mx, my) || 1;
    const lit = ((mx / d) * LIGHT.x + (my / d) * LIGHT.y + 1) / 2;
    g.fillStyle(lerpColor(0xc9d6e3, 0xffffff, lit), 1);
    g.fillTriangle(px, py, p1.x, p1.y, p2.x, p2.y);
  }
  // ребро-хребет от вершины (лёгкие линии)
  g.lineStyle(3, 0x6b7177, 0.35);
  for (let k = 0; k < n; k += 2) {
    const p = at(k, 0.98);
    g.lineBetween(px + (p.x - px) * snow * 1.1, py + (p.y - py) * snow * 1.1, p.x, p.y);
  }
  if (flat > 0) {
    // ровная площадка на вершине
    g.fillStyle(0x9aa7b4, 0.35).fillEllipse(px + 8, py + 12, flat * 2.1, flat * 1.75);
    g.fillStyle(0xf4f7fa, 1).fillEllipse(px, py, flat * 2, flat * 1.7);
    g.lineStyle(6, 0xb9c6d3, 1).strokeEllipse(px, py, flat * 2, flat * 1.7);
    // камушки по краю площадки
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + 0.3;
      const x = px + Math.cos(a) * flat * 1.02, y = py + Math.sin(a) * flat * 0.86;
      g.fillStyle(0x868e96, 1).fillCircle(x, y, 11);
      g.fillStyle(0xadb5bd, 1).fillCircle(x - 3, y - 3, 6);
    }
  }
  return { x: px, y: py };
}

function drawRock(g, x, y, r) {
  g.fillStyle(0x5c5f66, 0.2).fillEllipse(x + r * 0.3, y + r * 0.35, r * 2, r * 1.6);
  g.fillStyle(0x868e96, 1).fillEllipse(x, y, r * 2, r * 1.6);
  g.fillStyle(0xb5bbc1, 1).fillEllipse(x - r * 0.25, y - r * 0.25, r * 1.1, r * 0.8);
}

// вершина главной горы (относительно центра места) — там сидит зайка
const PEAK = { dx: 20, dy: -10, R: 300 };
let summit = null; // мировая точка площадки, вычисляется в drawSite

export default {
  id: 'mountain',

  drawSite(scene, site) {
    const rnd = new Phaser.Math.RandomDataGenerator(['mountain-site']);
    const g = scene.add.graphics().setDepth(DEPTH.site);
    // каменистая земля
    g.fillStyle(0xd3d0c2, 0.55).fillCircle(site.x, site.y, site.r * 0.98);
    g.fillStyle(0xcac6b6, 0.7).fillCircle(site.x, site.y, site.r * 0.88);
    for (let i = 0; i < 40; i++) {
      const a = rnd.realInRange(0, Math.PI * 2), d = rnd.realInRange(0.2, 0.92) * site.r;
      g.fillStyle(0xbdb8a6, 0.6).fillEllipse(site.x + Math.cos(a) * d, site.y + Math.sin(a) * d, rnd.between(30, 70), rnd.between(18, 40));
    }
    // маленькие горы вокруг, потом главная (поверх)
    const others = [
      [-310, -250, 175], [300, -280, 185], [-350, 210, 180], [330, 250, 165],
      [-30, 390, 120], [-460, -20, 105], [455, -10, 110], [40, -420, 100],
    ];
    for (const [dx, dy, R] of others) drawMountain(g, rnd, site.x + dx, site.y + dy, R, { snow: R > 150 ? 0.38 : 0.3 });
    for (let i = 0; i < 22; i++) {
      const a = rnd.realInRange(0, Math.PI * 2), d = rnd.realInRange(0.55, 0.95) * site.r;
      drawRock(g, site.x + Math.cos(a) * d, site.y + Math.sin(a) * d, rnd.between(10, 24));
    }
    summit = drawMountain(g, rnd, site.x + PEAK.dx, site.y + PEAK.dy, PEAK.R, { snow: 0.5, flat: 105 });
  },

  start(ctx) {
    const { scene, site, heli, input, sfx } = ctx;
    const pos = summit || { x: site.x + PEAK.dx, y: site.y + PEAK.dy };
    const bx = pos.x, by = pos.y - 10;
    const SIZE = 165;

    const shadow = scene.add.ellipse(bx + 6, by + 70, 120, 34, 0x5c6670, 0.3);
    const calls = scene.add.graphics();
    const ring = scene.add.graphics();
    ctx.layer.add([calls, shadow, ring]);

    // зайка — отдельный объект сцены (потом уедет в больницу)
    const bunny = scene.add.image(bx, by, 'bunny').setDepth(DEPTH.missionLow + 2);
    bunny.setDisplaySize(SIZE, SIZE);
    const baseScale = bunny.scale;
    const flag = scene.add.image(bx + 72, by + 40, 'mountain_sos').setOrigin(0.1, 0.97).setDisplaySize(115, 138)
      .setDepth(DEPTH.missionLow + 3).setAngle(10);
    const paw = scene.add.circle(bx + 72, by + 22, 13, 0xf8f0e3).setStrokeStyle(3, 0xa07d6a).setDepth(DEPTH.missionLow + 4);
    const rope = scene.add.graphics().setDepth(DEPTH.carried - 1);
    const hook = scene.add.image(bx, by, 'mountain_hook').setDepth(DEPTH.carried).setVisible(false);

    // «помогите!»: подпрыгивает и машет флажком
    const hop = scene.tweens.add({ targets: [bunny, paw, flag], y: '-=22', duration: 260, yoyo: true, repeat: -1, repeatDelay: 380, ease: 'Sine.easeOut' });
    const wave = scene.tweens.add({ targets: flag, angle: -18, duration: 320, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const tilt = scene.tweens.add({ targets: bunny, angle: { from: -6, to: 6 }, duration: 640, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    ctx.pointAt({ x: bx, y: by });

    let phase = 'wait'; // wait -> rescue -> gone
    let t = 0;
    let carried = false;
    const hookPos = { x: 0, y: 0 };
    const R_OVER = 140;

    function rescue() {
      phase = 'rescue';
      ctx.pointAt(null);
      ring.clear();
      calls.clear();
      sfx.whoosh();
      heli.locked = true; heli.vx = 0; heli.vy = 0;
      // вертолёт аккуратно встаёт над зайкой, чуть выше точки подвеса heli.carry (+150) — трос виден, потом зайку «подтягивает»
      scene.tweens.add({ targets: heli, x: bx, y: by - 250, duration: 450, ease: 'Sine.easeOut' });
      hookPos.x = heli.x; hookPos.y = heli.y + 20;
      hook.setPosition(hookPos.x, hookPos.y).setVisible(true).setScale(0.6);
      scene.tweens.add({
        targets: hookPos, x: bx, y: by - 70, duration: 900, delay: 150, ease: 'Sine.easeIn',
        onUpdate: () => hook.setScale(0.6 + 0.6 * Phaser.Math.Clamp((hookPos.y - heli.y) / 180, 0, 1)),
        onComplete: grab,
      });
    }

    function grab() {
      sfx.ding();
      ctx.fx.sparkle(bx, by - 40, 0xffd43b, 18);
      scene.time.delayedCall(150, () => ctx.fx.sparkle(bx, by, 0xff8fab, 14));
      hop.stop(); wave.stop(); tilt.stop();
      bunny.setTexture('mountain_bunny_joy').setAngle(0).setPosition(bx, by);
      bunny.setDisplaySize(SIZE, SIZE);
      // флажок падает в снег
      scene.tweens.add({ targets: flag, angle: 80, alpha: 0.85, duration: 400, ease: 'Bounce.easeOut' });
      scene.tweens.add({ targets: paw, alpha: 0, duration: 150 });
      // радостный подскок, потом отрывается от земли
      scene.tweens.chain({
        targets: bunny,
        tweens: [
          { scale: baseScale * 1.2, duration: 180, ease: 'Back.easeOut' },
          { scale: baseScale, y: by - 20, duration: 380, ease: 'Sine.easeInOut' },
        ],
        onComplete: lift,
      });
      scene.tweens.add({ targets: shadow, scaleX: 0.6, scaleY: 0.6, alpha: 0.12, duration: 500 });
    }

    function lift() {
      phase = 'gone';
      carried = true;
      hook.setVisible(false);
      rope.clear();
      heli.locked = false;
      heli.carry(bunny);
      scene.tweens.add({ targets: shadow, alpha: 0, duration: 600 });
      ctx.done();
    }

    return {
      update(dt) {
        t += dt;
        if (phase === 'wait') {
          // волны «зову на помощь» от зайки
          calls.clear();
          for (let i = 0; i < 2; i++) {
            const k = (t * 0.6 + i * 0.5) % 1;
            calls.lineStyle(8, 0xffffff, 0.55 * (1 - k)).strokeCircle(bx, by, 95 + k * 120);
          }
          ring.clear();
          if (heli.isOver(bx, by, R_OVER)) {
            const p = 0.5 + 0.5 * Math.sin(t * 9);
            ring.lineStyle(14, 0xffd43b, 0.65 + 0.35 * p).strokeCircle(bx, by, 112 + 10 * p);
            ring.fillStyle(0xffd43b, 0.14).fillCircle(bx, by, 112);
            if (input.actionPressed()) rescue();
          }
        } else if (phase === 'rescue') {
          heli.vx = 0; heli.vy = 0;
          rope.clear();
          rope.lineStyle(12, 0x6b4a2e, 1).lineBetween(heli.x, heli.y + 20, hookPos.x, hookPos.y - 30);
          rope.lineStyle(6, 0xd9a066, 1).lineBetween(heli.x, heli.y + 20, hookPos.x, hookPos.y - 30);
          hook.setPosition(hookPos.x, hookPos.y);
        }
      },
      targets: () => (phase === 'wait' ? [{ x: bx, y: by }] : []),
      destroy() {
        for (const o of [bunny, flag, paw, hook, hookPos, shadow]) scene.tweens.killTweensOf(o);
        if (phase === 'rescue') { scene.tweens.killTweensOf(heli); heli.locked = false; }
        if (!carried) bunny.destroy();
        flag.destroy(); paw.destroy(); rope.destroy(); hook.destroy();
      },
    };
  },
};
