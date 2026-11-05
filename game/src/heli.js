import { DEPTH, HELI_SCALE, SPEED, WORLD } from './config.js';

/** Вертолёт: управление, взлёт/посадка, значок предмета, груз на тросе. */
export class Heli {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x; this.y = y; this.vx = 0; this.vy = 0;
    this.angle = -Math.PI / 2;
    this.alt = 0; // 0 — стоит на земле, 1 — летит
    this.rotorV = 0;
    this.maxSpeed = SPEED.base;
    this.locked = true;
    this.landing = false;
    this.bounds = null; // {x,y,w,h} — мягкая стенка
    this.boundsCircle = null; // {x,y,r}
    this.bumped = false; // упёрся в стенку в этом кадре
    this.carried = null;
    this.t = 0;

    this.shadow = scene.add.image(x, y, 'heli_shadow').setDepth(DEPTH.shadow).setAlpha(0.2);
    this.rope = scene.add.graphics().setDepth(DEPTH.carried - 1);
    this.body = scene.add.image(x, y, 'heli').setDepth(DEPTH.heli).setOrigin(0.55, 0.5);
    this.rotor = scene.add.image(x, y, 'rotor').setDepth(DEPTH.heli + 1);
    this.badge = scene.add.image(x, y, 'item_water').setDepth(DEPTH.heli + 2).setVisible(false);
  }

  get flying() { return this.alt > 0.6; }

  setItem(key) {
    if (!key) { this.badge.setVisible(false); return; }
    this.badge.setTexture('item_' + key).setDisplaySize(70, 70).setVisible(true);
  }

  /** Подвесить объект на трос под вертолётом (с этого момента объектом владеет игра). */
  carry(obj) {
    this.carried = obj;
    if (obj.setDepth) obj.setDepth(DEPTH.carried);
  }

  releaseCarried() {
    const o = this.carried;
    this.carried = null;
    this.rope.clear();
    return o;
  }

  isOver(x, y, r = 90) { return Math.hypot(this.x - x, this.y - y) < r; }

  placeLanded(x, y) {
    this.x = x; this.y = y; this.vx = 0; this.vy = 0; this.alt = 0; this.angle = -Math.PI / 2;
  }

  land(x, y, onDone) {
    this.locked = true; this.landing = true; this.vx = 0; this.vy = 0;
    const tw = this.scene.tweens;
    tw.add({ targets: this, x, y, duration: 700, ease: 'Sine.easeOut' });
    tw.add({
      targets: this, alt: 0, delay: 450, duration: 700, ease: 'Sine.easeInOut',
      onComplete: () => { this.landing = false; onDone && onDone(); },
    });
  }

  update(dt, move) {
    this.t += dt;
    this.bumped = false;
    if (!this.locked && !this.landing) {
      const mag = Math.hypot(move.x, move.y);
      if (mag > 0.05 && this.alt < 1) this.alt = Math.min(1, this.alt + dt * 2.2);
      const k = this.alt;
      const tx = move.x * this.maxSpeed * k, ty = move.y * this.maxSpeed * k;
      const a = Math.min(1, dt * 5);
      this.vx += (tx - this.vx) * a;
      this.vy += (ty - this.vy) * a;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
    }
    const b = this.bounds;
    if (b) {
      if (this.x < b.x) { this.x = b.x; this.vx = 0; this.bumped = true; }
      if (this.x > b.x + b.w) { this.x = b.x + b.w; this.vx = 0; this.bumped = true; }
      if (this.y < b.y) { this.y = b.y; this.vy = 0; this.bumped = true; }
      if (this.y > b.y + b.h) { this.y = b.y + b.h; this.vy = 0; this.bumped = true; }
    }
    const c = this.boundsCircle;
    if (c) {
      const dx = this.x - c.x, dy = this.y - c.y, d = Math.hypot(dx, dy);
      if (d > c.r) { this.x = c.x + (dx / d) * c.r; this.y = c.y + (dy / d) * c.r; this.vx *= 0.3; this.vy *= 0.3; this.bumped = true; }
    }
    this.x = Math.max(80, Math.min(WORLD.w - 80, this.x));
    this.y = Math.max(80, Math.min(WORLD.h - 80, this.y));

    const sp = Math.hypot(this.vx, this.vy);
    if (sp > 40) {
      const d = Phaser.Math.Angle.Wrap(Math.atan2(this.vy, this.vx) - this.angle);
      this.angle += d * Math.min(1, dt * 6);
    }
    const spin = this.locked && this.alt === 0 && !this.landing ? 0 : 1;
    this.rotorV += (spin - this.rotorV) * Math.min(1, dt * 2);
    this.rotor.rotation += this.rotorV * dt * 22;

    const s = HELI_SCALE * (1 + 0.12 * this.alt);
    const bob = Math.sin(this.t * 3) * 3 * this.alt;
    this.body.setPosition(this.x, this.y + bob).setRotation(this.angle).setScale(s);
    this.rotor.setPosition(this.x, this.y + bob).setScale(s);
    this.shadow
      .setPosition(this.x + 8 + 30 * this.alt, this.y + 12 + 44 * this.alt)
      .setRotation(this.angle)
      .setScale(HELI_SCALE * (1 - 0.15 * this.alt));
    this.badge.setPosition(this.x - Math.cos(this.angle) * 70 * s, this.y + bob - Math.sin(this.angle) * 70 * s);

    this.rope.clear();
    const o = this.carried;
    if (o) {
      const tx = this.x, ty = this.y + 200;
      const a = Math.min(1, dt * 5);
      o.x += (tx - o.x) * a;
      o.y += (ty - o.y) * a;
      if ('rotation' in o) o.rotation = Phaser.Math.Clamp((o.x - this.x) * -0.006, -0.5, 0.5);
      const top = o.displayHeight ? o.displayHeight * 0.4 : 50;
      this.rope.lineStyle(5, 0x8d6e53, 1).lineBetween(this.x, this.y + 10, o.x, o.y - top);
    }
  }
}
