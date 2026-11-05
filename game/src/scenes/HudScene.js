import { FONT, MISSION_META, VIEW } from '../config.js';

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
    o.removeAll(true);
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

  showDispatch(id) {
    const m = MISSION_META[id];
    const { x, y } = this.panel(1320, 760, m.color);
    const o = this.overlay;
    o.add(this.add.text(VIEW.w / 2, y + 70, m.title, TXT(60, m.css)).setOrigin(0.5));
    const av = this.add.image(x + 230, y + 400, 'dispatcher').setDisplaySize(330, 330);
    o.add(av);
    this.tweens.add({ targets: av, angle: { from: -3, to: 3 }, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const card = this.add.image(x + 760, y + 330, 'card_' + id).setDisplaySize(620, 354);
    o.add(card);
    const g = this.add.graphics();
    g.fillStyle(m.color, 0.12).fillRoundedRect(x + 520, y + 540, 480, 190, 40);
    o.add(g);
    o.add(this.add.text(x + 560, y + 635, 'ВОЗЬМИ', TXT(40, m.css)).setOrigin(0, 0.5));
    const it = this.add.image(x + 880, y + 635, 'item_' + m.item).setDisplaySize(170, 170);
    o.add(it);
    this.tweens.add({ targets: it, scale: it.scale * 1.1, duration: 500, yoyo: true, repeat: -1 });
    const btn = this.add.image(x + 1190, y + 640, 'btn_a').setDisplaySize(140, 140);
    o.add(btn);
    this.tweens.add({ targets: btn, scale: btn.scale * 1.15, duration: 450, yoyo: true, repeat: -1 });
    this.popIn();
  }

  hideDispatch() { this.overlay.setVisible(false); this.overlay.removeAll(true); }

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
    if (sx > m && sx < VIEW.w - m && sy > m + 80 && sy < VIEW.h - m) {
      this.arrow.setPosition(sx, sy - 110 - Math.abs(Math.sin(now * 5)) * 30).setRotation(Math.PI / 2);
    } else {
      const cx = VIEW.w / 2, cy = VIEW.h / 2, dx = sx - cx, dy = sy - cy;
      const k = Math.min((cx - m) / Math.abs(dx || 1e-6), (cy - m) / Math.abs(dy || 1e-6));
      const p = 1 + 0.12 * Math.sin(now * 6);
      this.arrow.setPosition(cx + dx * k, cy + dy * k).setRotation(Math.atan2(dy, dx));
      this.arrow.setDisplaySize(160 * p, 96 * p);
    }
  }
}
