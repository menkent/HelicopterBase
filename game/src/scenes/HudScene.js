import { FONT, MISSION_META, VIEW } from '../config.js';
import { sfx } from '../sfx.js';

const TXT = (size, color = '#3b3640') => ({ fontFamily: FONT, fontSize: `${size}px`, fontStyle: 'bold', color });

/** Экранный слой: предмет, топливо, задание, стрелка-подсказка, окна диспетчера. */
export class HudScene extends Phaser.Scene {
  constructor() { super('hud'); }

  create() {
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 0.92).fillRoundedRect(24, 20, 360, 124, 30);
    g.lineStyle(4, 0xe2ddd4, 1).strokeRoundedRect(24, 20, 360, 124, 30);
    g.fillStyle(0xf1f3f5, 1).fillCircle(92, 82, 50);
    this.itemQ = this.add.text(92, 82, '?', TXT(64, '#ced4da')).setOrigin(0.5);
    this.itemImg = this.add.image(92, 82, 'item_water').setVisible(false);
    this.add.image(190, 82, 'icon_pump').setDisplaySize(64, 64);
    this.fuelG = this.add.graphics();
    this.setFuel(0);

    this.mini = this.add.container(0, 0).setVisible(false);
    this.arrow = this.add.image(0, 0, 'arrow').setDisplaySize(160, 96).setVisible(false).setDepth(5);
    this.overlay = this.add.container(0, 0).setDepth(10).setVisible(false);
    this.cont = this.add.container(0, 0).setDepth(9).setVisible(false);
    this.ready = true;
  }

  setFuel(f) {
    const g = this.fuelG.clear();
    g.fillStyle(0xe9ecef, 1).fillRoundedRect(234, 64, 126, 38, 19);
    if (f > 0) g.fillStyle(f >= 1 ? 0x40c057 : 0xf59f00, 1).fillRoundedRect(234, 64, Math.max(38, 126 * f), 38, 19);
  }

  setItem(key) {
    if (!key) { this.itemImg.setVisible(false); this.itemQ.setVisible(true); return; }
    this.itemQ.setVisible(false);
    this.itemImg.setTexture('item_' + key).setDisplaySize(96, 96).setVisible(true);
    this.tweens.add({ targets: this.itemImg, scale: this.itemImg.scale * 1.25, duration: 160, yoyo: true });
  }

  showMission(id) {
    const m = MISSION_META[id];
    this.mini.removeAll(true);
    const x = VIEW.w - 24 - 330, y = 20;
    const g = this.add.graphics();
    g.fillStyle(m.color, 1).fillRoundedRect(x, y, 330, 124, 30);
    this.mini.add(g);
    this.mini.add(this.add.image(x + 14, y + 14, 'card_' + id).setOrigin(0).setDisplaySize(168, 96));
    const gw = this.add.graphics();
    gw.fillStyle(0xffffff, 1).fillCircle(x + 262, y + 62, 50);
    this.mini.add(gw);
    this.mini.add(this.add.image(x + 262, y + 62, 'item_' + m.item).setDisplaySize(94, 94));
    this.mini.setVisible(true);
  }

  hideMission() { this.mini.setVisible(false); }

  panel(w, h, color) {
    const o = this.overlay;
    this.clearOverlay();
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.45).fillRect(0, 0, VIEW.w, VIEW.h);
    const x = (VIEW.w - w) / 2, y = (VIEW.h - h) / 2;
    g.fillStyle(0xffffff, 1).fillRoundedRect(x, y, w, h, 44);
    g.lineStyle(14, color, 1).strokeRoundedRect(x, y, w, h, 44);
    o.add(g);
    return { x, y };
  }

  popIn() {
    const o = this.overlay;
    o.setVisible(true).setAlpha(0);
    this.tweens.add({ targets: o, alpha: 1, duration: 250 });
  }

  /** Кнопка A, которая появляется с задержкой и пульсирует — «жми, чтобы дальше». */
  addNextButton(x, y, delay = 500) {
    const btn = this.add.image(x, y, 'btn_a').setDisplaySize(140, 140).setAlpha(0);
    this.overlay.add(btn);
    const s = btn.scale;
    this.tweens.add({ targets: btn, alpha: 1, delay, duration: 250 });
    this.tweens.add({ targets: btn, scale: s * 1.15, delay, duration: 450, yoyo: true, repeat: -1 });
  }

  clearOverlay() {
    this.tweens.killTweensOf(this.overlay.list);
    this.overlay.removeAll(true);
  }

  /** Заставка при запуске. */
  showTitle() {
    this.clearOverlay();
    const o = this.overlay;
    const g = this.add.graphics();
    g.fillStyle(0xfff0f6, 0.93).fillRect(0, 0, VIEW.w, VIEW.h);
    o.add(g);
    o.add(this.add.text(VIEW.w / 2, 210, 'Вертолётная база спасения', TXT(96, '#d6336c')).setOrigin(0.5).setStroke('#fff', 14));
    const cx = VIEW.w / 2, cy = 600, R = 200;
    const body = this.add.image(cx, cy, 'heli').setOrigin(0.55, 0.5).setDisplaySize(300, 300);
    const rotor = this.add.image(cx, cy, 'rotor').setDisplaySize(350, 350);
    o.add([body, rotor]);
    const st = { a: 0 };
    this.tweens.add({
      targets: st, a: Math.PI * 2, duration: 6000, repeat: -1,
      onUpdate: () => {
        const x = cx + Math.cos(st.a) * R * 1.6, y = cy + Math.sin(st.a) * R * 0.6;
        body.setPosition(x, y).setRotation(st.a + Math.PI / 2);
        rotor.setPosition(x, y).setRotation(rotor.rotation + 0.5);
      },
    });
    this.addNextButton(VIEW.w / 2, 940, 300);
    this.popIn();
  }

  /** Сценка выдачи задания: 0 — вызов, 1 — что случилось, 2 — что взять. */
  showDispatchStep(id, step) {
    const m = MISSION_META[id];
    this.clearOverlay();
    const o = this.overlay;
    const W = 1320, H = 760, x = (VIEW.w - W) / 2, y = (VIEW.h - H) / 2;
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.45).fillRect(0, 0, VIEW.w, VIEW.h);
    g.fillStyle(0xffffff, 1).fillRoundedRect(x, y, W, H, 44);
    g.lineStyle(14, step === 0 ? 0x7048e8 : m.color, 1).strokeRoundedRect(x, y, W, H, 44);
    o.add(g);

    if (step === 0) {
      o.add(this.add.text(VIEW.w / 2, y + 75, 'Вызов!', TXT(72, '#7048e8')).setOrigin(0.5));
      const ax = VIEW.w / 2 - 60, ay = y + 420;
      for (let i = 0; i < 3; i++) {
        const ring = this.add.graphics();
        ring.lineStyle(10, 0x7048e8, 1).strokeCircle(0, 0, 220);
        ring.setPosition(ax, ay).setScale(0.7).setAlpha(0);
        o.add(ring);
        this.tweens.add({ targets: ring, scale: 1.4, alpha: { from: 0.8, to: 0 }, duration: 1500, delay: i * 500, repeat: -1 });
      }
      const av = this.add.image(ax, ay, 'dispatcher').setDisplaySize(380, 380);
      o.add(av);
      this.tweens.add({ targets: av, y: ay - 18, duration: 300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      const bub = this.add.container(ax + 260, ay - 150);
      const bg = this.add.graphics();
      bg.fillStyle(0xffffff, 1).fillCircle(0, 0, 80).lineStyle(8, 0xf03e3e, 1).strokeCircle(0, 0, 80);
      bg.fillStyle(0xffffff, 1).fillTriangle(-60, 40, -30, 70, -110, 110);
      bub.add([bg, this.add.text(0, 4, '!', TXT(120, '#f03e3e')).setOrigin(0.5)]);
      o.add(bub);
      this.tweens.add({ targets: bub, angle: { from: -10, to: 10 }, duration: 220, yoyo: true, repeat: -1 });
    } else {
      o.add(this.add.text(VIEW.w / 2, y + 75, step === 1 ? m.title : 'Что взять?', TXT(64, m.css)).setOrigin(0.5));
      const ax = x + 230, ay = y + 440;
      const av = this.add.image(ax, ay, 'dispatcher').setDisplaySize(300, 300);
      o.add(av);
      this.tweens.add({ targets: av, angle: { from: -4, to: 4 }, duration: 260, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      if (step === 1) {
        const bx = x + 470, by = y + 150, bw = 780, bh = 470;
        const bg = this.add.graphics();
        bg.fillStyle(0xffffff, 1).fillRoundedRect(bx, by, bw, bh, 36).lineStyle(8, m.color, 1).strokeRoundedRect(bx, by, bw, bh, 36);
        bg.fillStyle(0xffffff, 1).fillTriangle(bx + 6, by + 260, bx + 6, by + 340, bx - 70, by + 330);
        bg.lineStyle(8, m.color, 1).lineBetween(bx, by + 260, bx - 70, by + 330).lineBetween(bx - 70, by + 330, bx, by + 340);
        o.add(bg);
        const card = this.add.image(bx + bw / 2, by + bh / 2, 'card_' + id).setDisplaySize(700, 400);
        const s = card.scale;
        card.setScale(0);
        o.add(card);
        this.tweens.add({ targets: card, scale: s, duration: 600, ease: 'Back.easeOut' });
        this.tweens.add({ targets: card, angle: { from: -1.5, to: 1.5 }, delay: 600, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      } else {
        o.add(this.add.image(x + 1080, y + 230, 'card_' + id).setDisplaySize(300, 172));
        const cx = x + 720, cy = y + 450;
        const ring = this.add.graphics();
        ring.fillStyle(m.color, 0.12).fillCircle(cx, cy, 190).lineStyle(8, m.color, 0.6).strokeCircle(cx, cy, 190);
        o.add(ring);
        o.add(this.add.text(cx, cy - 235, 'ВОЗЬМИ', TXT(44, m.css)).setOrigin(0.5));
        const it = this.add.image(ax, ay, 'item_' + m.item).setDisplaySize(60, 60);
        o.add(it);
        const big = 300 / it.width;
        this.tweens.add({
          targets: it, x: cx, y: cy, scale: big, angle: 360, duration: 800, ease: 'Back.easeOut', delay: 200,
          onComplete: () => {
            sfx.ding();
            const em = this.add.particles(cx, cy, 'dot', {
              speed: { min: 150, max: 420 }, lifespan: 700, scale: { start: 1.6, end: 0 },
              tint: [0xffd43b, 0xffffff, m.color], emitting: false,
            }).setDepth(11);
            em.explode(26);
            this.time.delayedCall(900, () => em.destroy());
            this.tweens.add({ targets: it, scale: big * 1.08, duration: 500, yoyo: true, repeat: -1 });
          },
        });
      }
    }
    this.addNextButton(x + W - 120, y + H - 110, step === 2 ? 1000 : 500);
    if (!this.overlay.visible) this.popIn();
  }

  /** Карточка задания улетает из центра в правый верхний угол. */
  flyCardToCorner(id) {
    const card = this.add.image(VIEW.w / 2, VIEW.h / 2, 'card_' + id).setDisplaySize(560, 320).setDepth(12);
    this.tweens.add({
      targets: card, x: VIEW.w - 24 - 330 + 14 + 84, y: 20 + 14 + 48, displayWidth: 168, displayHeight: 96,
      duration: 650, ease: 'Sine.easeInOut',
      onComplete: () => { card.destroy(); this.showMission(id); },
    });
  }

  hideDispatch() { this.overlay.setVisible(false); this.clearOverlay(); }

  showReward(id) {
    const m = MISSION_META[id];
    const { x, y } = this.panel(1000, 620, 0xffd43b);
    const o = this.overlay;
    o.add(this.add.text(VIEW.w / 2, y + 80, 'Молодец!', TXT(76, '#e8590c')).setOrigin(0.5));
    o.add(this.add.image(x + 250, y + 360, 'dispatcher').setDisplaySize(320, 320));
    const medal = this.add.image(x + 700, y + 350, 'medal_' + id).setDisplaySize(340, 340);
    o.add(medal);
    const s = medal.scale;
    medal.setScale(0);
    this.tweens.add({ targets: medal, scale: s, angle: 360, duration: 900, ease: 'Back.easeOut' });
    this.popIn();
    this.confetti(1200);
  }

  hideReward() { this.hideDispatch(); }

  showContinue() {
    const c = this.cont;
    c.removeAll(true);
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 0.92).fillRoundedRect(VIEW.w / 2 - 200, VIEW.h - 200, 400, 160, 40);
    c.add(g);
    c.add(this.add.image(VIEW.w / 2 - 80, VIEW.h - 120, 'dispatcher').setDisplaySize(130, 130));
    const b = this.add.image(VIEW.w / 2 + 90, VIEW.h - 120, 'btn_a').setDisplaySize(110, 110);
    c.add(b);
    this.tweens.add({ targets: b, scale: b.scale * 1.15, duration: 450, yoyo: true, repeat: -1 });
    c.setVisible(true);
  }

  hideContinue() { this.cont.setVisible(false); this.cont.removeAll(true); }

  missionComplete() {
    const t = this.add.image(VIEW.w / 2, VIEW.h / 2 - 120, 'icon_star').setDisplaySize(10, 10).setDepth(8);
    this.tweens.chain({
      targets: t,
      tweens: [
        { displayWidth: 300, displayHeight: 300, angle: 360, duration: 600, ease: 'Back.easeOut' },
        { alpha: 0, duration: 400, delay: 700 },
      ],
      onComplete: () => t.destroy(),
    });
  }

  confetti(ms) {
    const em = this.add.particles(0, -20, 'dot', {
      x: { min: 0, max: VIEW.w }, speedY: { min: 250, max: 520 }, speedX: { min: -140, max: 140 },
      lifespan: 4000, scale: { min: 0.8, max: 1.8 },
      tint: [0xf03e3e, 0x7048e8, 0x37b24d, 0x1c7ed6, 0xffd43b, 0xff8fab], quantity: 3, frequency: 25,
    }).setDepth(20);
    this.time.delayedCall(ms, () => em.stop());
    this.time.delayedCall(ms + 4200, () => em.destroy());
  }

  celebrate() {
    this.confetti(3000);
    const t = this.add.text(VIEW.w / 2, VIEW.h / 2, 'УРА! Все 5 медалей!', TXT(110, '#e8590c'))
      .setOrigin(0.5).setStroke('#fff', 16).setDepth(21).setScale(0);
    this.tweens.chain({
      targets: t,
      tweens: [{ scale: 1, duration: 600, ease: 'Back.easeOut' }, { alpha: 0, delay: 2600, duration: 500 }],
      onComplete: () => t.destroy(),
    });
  }

  /** Стрелка к цели: над целью, если она на экране, иначе — у края экрана. */
  guide(t, cam) {
    if (!t || this.overlay.visible) { this.arrow.setVisible(false); return; }
    const z = cam.zoom, v = cam.worldView;
    const sx = (t.x - v.x) * z, sy = (t.y - v.y) * z;
    const now = this.time.now / 1000;
    const m = 110;
    this.arrow.setVisible(true);
    const TOP = 250; // ниже панелей HUD
    this.arrow.setDisplaySize(160, 96);
    if (t.side) {
      // стрелка сбоку от цели, смотрит на неё и покачивается
      const bob = Math.abs(Math.sin(now * 5)) * 30;
      const dir = t.side === 'right' ? 1 : -1;
      this.arrow.setVisible(true).setPosition(sx + dir * (95 + bob), sy).setRotation(t.side === 'right' ? Math.PI : 0);
      return;
    }
    if (sx > m && sx < VIEW.w - m && sy > TOP + 110 && sy < VIEW.h - m) {
      this.arrow.setPosition(sx, sy - 110 - Math.abs(Math.sin(now * 5)) * 30).setRotation(Math.PI / 2);
    } else {
      // центр «рамки» стрелок смещён вниз, чтобы верхний край был ниже панелей
      const cx = VIEW.w / 2, cy = (TOP + VIEW.h - m) / 2, dx = sx - cx, dy = sy - cy;
      const k = Math.min((cx - m) / Math.abs(dx || 1e-6), (cy - TOP) / Math.abs(dy || 1e-6));
      const p = 1 + 0.12 * Math.sin(now * 6);
      this.arrow.setPosition(cx + dx * k, cy + dy * k).setRotation(Math.atan2(dy, dx));
      this.arrow.setDisplaySize(160 * p, 96 * p);
    }
  }
}
