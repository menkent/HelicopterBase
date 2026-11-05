// Ночная миссия: на поляне вечер, зайка спрятался за одним из кустов.
// Прожектор вертолёта — мягкий круг света в лёгкой синей темноте. Подлетаешь к кусту — зайка выглядывает,
// жмёшь кнопку — рассвет, зайка на тросе летит домой.
import { DEPTH } from '../config.js';
import { registerSvg } from '../art.js';
import { svgDoc, starPoints } from '../icons.js';

const ID = 'night';
const BUSH_SIZE = 190;
const LIGHT_R = 280; // радиус круга света прожектора
const PEEK_R = 220; // свет так близко к нужному кусту — зайка выглядывает
const ACT_R = 170; // зона «можно нажать»
const DARK_ALPHA = 0.55;
// кусты (смещения от центра места)
const BUSHES = [
  { dx: -170, dy: -250 },
  { dx: 250, dy: -110 },
  { dx: -210, dy: 230 },
  { dx: 200, dy: 260 },
];

// ---------- текстуры ----------
// куст сверху: крупные округлые листья, приглушённо-зелёные (ночью они не яркие)
registerSvg(
  'night_bush',
  svgDoc(
    '<circle cx="50" cy="54" r="40" fill="#2f5d50"/>' +
      '<circle cx="30" cy="40" r="22" fill="#3d7a5f"/><circle cx="68" cy="36" r="22" fill="#3d7a5f"/>' +
      '<circle cx="74" cy="64" r="20" fill="#37705a"/><circle cx="28" cy="68" r="20" fill="#37705a"/>' +
      '<circle cx="50" cy="52" r="24" fill="#4a8a6a"/>' +
      '<circle cx="40" cy="42" r="7" fill="#6aa883" opacity=".7"/><circle cx="62" cy="58" r="6" fill="#6aa883" opacity=".6"/>',
  ),
  256,
);
// подсказка: кончики ушей и глазки зайки — видны даже в темноте
registerSvg(
  'night_peek',
  svgDoc(
    '<ellipse cx="37" cy="24" rx="8" ry="18" fill="#fff6ea" stroke="#a07d6a" stroke-width="2.5"/>' +
      '<ellipse cx="63" cy="24" rx="8" ry="18" fill="#fff6ea" stroke="#a07d6a" stroke-width="2.5"/>' +
      '<ellipse cx="37" cy="26" rx="3.5" ry="11" fill="#ffc9d6"/><ellipse cx="63" cy="26" rx="3.5" ry="11" fill="#ffc9d6"/>' +
      '<circle cx="40" cy="62" r="7" fill="#fff"/><circle cx="60" cy="62" r="7" fill="#fff"/>' +
      '<circle cx="41" cy="63" r="4" fill="#333"/><circle cx="61" cy="63" r="4" fill="#333"/>' +
      '<circle cx="42.5" cy="61" r="1.5" fill="#fff"/><circle cx="62.5" cy="61" r="1.5" fill="#fff"/>',
  ),
  200,
);
// мягкое пятно ночи (диск с плавным краем) — для затемнения
registerSvg(
  'night_dark',
  svgDoc(
    '<defs><radialGradient id="g"><stop offset="0.82" stop-color="#18224f" stop-opacity="1"/>' +
      '<stop offset="1" stop-color="#18224f" stop-opacity="0"/></radialGradient></defs>' +
      '<circle cx="50" cy="50" r="50" fill="url(#g)"/>',
  ),
  1200,
);
// мягкая кисть света (белый центр, плавный край)
registerSvg(
  'night_light',
  svgDoc(
    '<defs><radialGradient id="g"><stop offset="0" stop-color="#fff" stop-opacity="1"/>' +
      '<stop offset="0.6" stop-color="#fff" stop-opacity="1"/>' +
      '<stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>' +
      '<circle cx="50" cy="50" r="50" fill="url(#g)"/>',
  ),
  LIGHT_R * 2,
);
// «рассвет»: светлое пятно, которое закрывает ночную поляну после спасения
registerSvg(
  'night_dawn',
  svgDoc(
    '<defs><radialGradient id="g"><stop offset="0" stop-color="#fff4c2"/><stop offset="0.55" stop-color="#eef0c8"/>' +
      '<stop offset="0.85" stop-color="#dde6c8"/><stop offset="1" stop-color="#dde6c8" stop-opacity="0"/></radialGradient></defs>' +
      '<circle cx="50" cy="50" r="50" fill="url(#g)"/>',
  ),
  1100,
);
// ночная поляна для drawSite: тёмно-синее пятно с мягким краем, звёзды, луна
{
  let stars = '';
  const rnd = new Phaser.Math.RandomDataGenerator(['night-stars']);
  for (let i = 0; i < 26; i++) {
    const a = rnd.realInRange(0, Math.PI * 2), d = rnd.realInRange(8, 40);
    const x = 50 + Math.cos(a) * d, y = 50 + Math.sin(a) * d, s = rnd.realInRange(1, 2.2);
    stars += `<polygon points="${starPoints(x, y, s, s * 0.45)}" fill="#fff3bf" opacity="${rnd.realInRange(0.6, 1).toFixed(2)}"/>`;
  }
  registerSvg(
    'night_glade',
    svgDoc(
      '<defs><radialGradient id="g"><stop offset="0" stop-color="#3b4a7a"/><stop offset="0.75" stop-color="#2f3e6e"/>' +
        '<stop offset="0.9" stop-color="#2b3a67" stop-opacity="0.85"/><stop offset="1" stop-color="#2b3a67" stop-opacity="0"/></radialGradient></defs>' +
        '<circle cx="50" cy="50" r="50" fill="url(#g)"/>' +
        stars +
        // луна
        '<mask id="m"><rect width="100" height="100" fill="#fff"/><circle cx="87.4" cy="60.7" r="5.6" fill="#000"/></mask>' +
        '<circle cx="83.9" cy="63.7" r="6.5" fill="#ffe066" mask="url(#m)"/>',
    ),
    1100,
  );
}

const bushPos = (site, i) => ({ x: site.x + BUSHES[i].dx, y: site.y + BUSHES[i].dy });

export default {
  id: ID,

  drawSite(scene, site) {
    scene.add.image(site.x, site.y, 'night_glade').setDisplaySize(site.r * 2.1, site.r * 2.1).setDepth(DEPTH.site);
    BUSHES.forEach((_, i) => {
      const p = bushPos(site, i);
      scene.add.image(p.x, p.y, 'night_bush').setDisplaySize(BUSH_SIZE, BUSH_SIZE).setDepth(DEPTH.site);
    });
  },

  start(ctx) {
    const { scene, site, heli, input, sfx } = ctx;
    const tw = scene.tweens;
    const objs = []; // всё, что надо убрать в destroy (кроме зайки после carry)
    const add = (o) => { objs.push(o); return o; };

    const hideAt = Phaser.Math.Between(0, BUSHES.length - 1);
    const home = bushPos(site, hideAt);

    // зайка (отдельный Image — потом уедет на тросе); прячется под кустом
    const bunnySize = 160;
    const bunny = scene.add.image(home.x, home.y, 'bunny').setDisplaySize(bunnySize, bunnySize).setDepth(DEPTH.missionLow);
    const bunnyScale = bunny.scale;
    let bunnyCarried = false;

    // кусты-копии поверх статичных (чтобы шевелить и прятать за ними зайку)
    const bushes = BUSHES.map((_, i) => {
      const p = bushPos(site, i);
      const img = add(scene.add.image(p.x, p.y, 'night_bush').setDisplaySize(BUSH_SIZE, BUSH_SIZE).setDepth(DEPTH.missionLow + 1));
      return { ...p, img, scale: img.scale, lit: false, rustleCd: 0 };
    });
    const target = bushes[hideAt];

    const rustle = (b, loud = false) => {
      tw.killTweensOf(b.img);
      b.img.setScale(b.scale).setAngle(0);
      tw.add({ targets: b.img, angle: { from: -7, to: 7 }, duration: 90, yoyo: true, repeat: 3, onComplete: () => b.img.setAngle(0) });
      tw.add({ targets: b.img, scale: b.scale * 1.06, duration: 180, yoyo: true });
      if (loud) ctx.fx.sparkle(b.x, b.y - 40, 0x8ce99a, 6);
    };

    // ---- темнота: RenderTexture над зоной, в ней «вырезается» свет прожектора ----
    const size = Math.ceil(site.r * 2.3);
    const rt = add(scene.add.renderTexture(site.x, site.y, size, size).setDepth(DEPTH.missionHigh + 4));
    const darkImg = scene.make.image({ key: 'night_dark', add: false }).setDisplaySize(size, size).setPosition(size / 2, size / 2);
    const brush = scene.make.image({ key: 'night_light', add: false }).setDisplaySize(LIGHT_R * 2, LIGHT_R * 2);
    objs.push(darkImg, brush);
    const state = { dark: 0 }; // плавно «наступает» вечер при влёте
    tw.add({ targets: state, dark: DARK_ALPHA, duration: 900, ease: 'Sine.easeOut' });

    // тёплый отсвет прожектора (поверх темноты, мягкий)
    const glow = add(
      scene.add.image(heli.x, heli.y, 'night_light').setDepth(DEPTH.missionHigh + 5).setDisplaySize(LIGHT_R * 2, LIGHT_R * 2).setTint(0xffe9a8).setBlendMode(Phaser.BlendModes.ADD),
    );
    // отсвет — только в пределах поляны
    const glowMaskG = add(scene.make.graphics({ add: false }));
    glowMaskG.fillStyle(0xffffff).fillCircle(site.x, site.y, site.r * 1.02);
    glow.setMask(glowMaskG.createGeometryMask());

    // рассвет (появится после спасения)
    const dawn = add(scene.add.image(site.x, site.y, 'night_dawn').setDisplaySize(site.r * 2.5, site.r * 2.5).setDepth(DEPTH.site + 1).setAlpha(0));
    const sun = add(scene.add.image(site.x + 370, site.y + 150, 'icon_sun').setDisplaySize(170, 170).setDepth(DEPTH.missionLow + 2).setScale(0));

    // ---- подсказки: глазки и ушки из-за куста, видны в темноте ----
    const peekY = target.y - BUSH_SIZE * 0.42;
    const peek = add(scene.add.image(target.x, peekY, 'night_peek').setDisplaySize(140, 140).setDepth(DEPTH.missionHigh + 6).setAlpha(0));
    const peekScale = peek.scale;
    let hintT = 1.2;

    // светлячки — для уюта
    const flies = [];
    for (let i = 0; i < 12; i++) {
      const a = Math.random() * Math.PI * 2, d = 80 + Math.random() * (site.r - 140);
      const f = add(
        scene.add.image(site.x + Math.cos(a) * d, site.y + Math.sin(a) * d, 'dot')
          .setDepth(DEPTH.missionHigh + 6).setTint(0xfff176).setBlendMode(Phaser.BlendModes.ADD).setScale(0.9),
      );
      flies.push({ f, bx: f.x, by: f.y, ph: Math.random() * 10, sp: 0.4 + Math.random() * 0.5, amp: 30 + Math.random() * 40 });
    }

    // кольцо «жми сейчас»
    const ring = add(scene.add.graphics().setDepth(DEPTH.missionHigh + 6));

    let peeked = false;
    let found = false;
    let t = 0;

    const setPeeked = (v) => {
      if (v === peeked) return;
      peeked = v;
      tw.killTweensOf(bunny);
      if (v) {
        sfx.pop();
        rustle(target);
        tw.add({ targets: peek, alpha: 0, duration: 150 });
        tw.add({ targets: bunny, y: target.y - 120, duration: 380, ease: 'Back.easeOut' });
        tw.add({ targets: bunny, scale: { from: bunnyScale * 0.85, to: bunnyScale }, duration: 380, ease: 'Back.easeOut' });
      } else {
        tw.add({ targets: bunny, y: target.y, duration: 450, ease: 'Sine.easeIn' });
      }
    };

    const win = () => {
      found = true;
      ring.clear();
      sfx.ding();
      ctx.fx.sparkle(bunny.x, bunny.y, 0xffd43b, 18);
      peek.setVisible(false);
      tw.killTweensOf(bunny);
      bunny.setScale(bunnyScale).setY(target.y - 120);
      // радостный прыжок
      tw.add({ targets: bunny, y: target.y - 190, duration: 220, ease: 'Sine.easeOut', yoyo: true, repeat: 1 });
      // рассвет: темнота плавно уходит
      tw.killTweensOf(state);
      tw.add({ targets: state, dark: 0, duration: 1600, ease: 'Sine.easeInOut' });
      tw.add({ targets: flies.map((o) => o.f), alpha: 0, duration: 1600 });
      tw.add({ targets: dawn, alpha: 1, duration: 1800, ease: 'Sine.easeInOut' });
      const sunScale = 170 / 256;
      tw.add({ targets: sun, scale: sunScale, duration: 900, delay: 500, ease: 'Back.easeOut' });
      tw.add({ targets: sun, angle: 360, duration: 12000, repeat: -1 });
      scene.time.delayedCall(950, () => {
        sfx.sparkle();
        heli.carry(bunny);
        bunnyCarried = true;
      });
      scene.time.delayedCall(1500, () => ctx.done());
    };

    ctx.pointAt(null);
    let searchT = 0, helped = false;

    return {
      update(dt) {
        t += dt;
        const lx = heli.x, ly = heli.y;

        // темнота
        rt.clear();
        const a = state.dark;
        if (a > 0.01) {
          rt.draw(darkImg);
          brush.setPosition(lx - site.x + size / 2, ly - site.y + size / 2);
          rt.erase(brush);
          rt.setAlpha(a).setVisible(true);
        } else rt.setVisible(false);
        glow.setPosition(lx, ly).setAlpha(0.42 * (a / DARK_ALPHA));

        // светлячки
        for (const o of flies) {
          const k = t * o.sp + o.ph;
          o.f.setPosition(o.bx + Math.sin(k) * o.amp, o.by + Math.cos(k * 0.7) * o.amp * 0.6);
          if (!found) o.f.setAlpha(0.45 + 0.55 * Math.abs(Math.sin(k * 2.3)));
        }

        if (found) return;

        // подсказки: периодически глазки-ушки и шевеление нужного куста
        hintT -= dt;
        searchT += dt;
        // долго не находит (4 года!) — подсказываем чаще и показываем стрелку
        if (searchT > 12 && !helped) { helped = true; ctx.pointAt({ x: target.x, y: target.y }); }
        if (hintT <= 0 && !peeked) {
          hintT = helped ? 1.8 : 3.2;
          tw.killTweensOf(peek);
          peek.setScale(peekScale * 0.9);
          tw.add({ targets: peek, alpha: 1, scale: peekScale, duration: 350, ease: 'Back.easeOut', hold: 1300, yoyo: true });
          // моргнуть посередине
          tw.add({ targets: peek, scaleY: peekScale * 0.88, delay: 900, duration: 80, yoyo: true });
          scene.time.delayedCall(600, () => { if (!peeked && !found) rustle(target); });
        }

        // свет над кустами
        for (const b of bushes) {
          const near = Math.hypot(lx - b.x, ly - b.y) <= PEEK_R;
          b.rustleCd -= dt;
          if (near && !b.lit && b !== target && b.rustleCd <= 0) {
            rustle(b, true);
            b.rustleCd = 1.2;
          }
          b.lit = near;
        }
        setPeeked(target.lit);

        // кольцо «жми сейчас»
        ring.clear();
        if (peeked) {
          const pulse = 1 + 0.08 * Math.sin(t * 7);
          ring.lineStyle(10, 0xffd43b, 0.95).strokeCircle(target.x, target.y - 50, 135 * pulse);
          ring.lineStyle(4, 0xffffff, 0.8).strokeCircle(target.x, target.y - 50, 150 * pulse);
        }

        if (input.actionPressed()) {
          if (Math.hypot(lx - target.x, ly - target.y) <= ACT_R || Math.hypot(lx - bunny.x, ly - bunny.y) <= ACT_R) {
            setPeeked(true);
            win();
          } else {
            const b = bushes.find((o) => Math.hypot(lx - o.x, ly - o.y) <= ACT_R);
            if (b) { rustle(b, true); sfx.pop(); }
          }
        }
      },
      targets: () => (found ? [] : [{ x: target.x, y: target.y }]),
      destroy() {
        glow.clearMask(true);
        for (const o of objs) { tw.killTweensOf(o); o.destroy(); }
        if (!bunnyCarried) { tw.killTweensOf(bunny); bunny.destroy(); }
      },
    };
  },
};
