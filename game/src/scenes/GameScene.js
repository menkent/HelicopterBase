import {
  BASE, BASE_CAM, BOARD_SLOTS, DEPTH, FONT, FUEL, HOSPITAL_BEDS, ITEM_ORDER, MISSION_META, MISSION_ORDER, PAD, PARAMS,
  ROUNDS_TEXT, SITES, SPEED, TEST, WAREHOUSE, WORLD, ZOOM,
} from '../config.js';
import { Input } from '../input.js';
import { sfx } from '../sfx.js';
import { Heli } from '../heli.js';
import { buildWorld } from '../world.js';
import { MISSIONS } from '../missions/index.js';
import * as Save from '../save.js';

const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
const inBase = (x, y) => x >= BASE.x && x <= BASE.x + BASE.w && y >= BASE.y && y <= BASE.y + BASE.h;
const BASE_INNER = { x: BASE.x + 90, y: BASE.y + 90, w: BASE.w - 180, h: BASE.h - 180 };

/*
 Этапы (this.state):
  dispatch — карточка задания от диспетчера, ждём A
  prep     — на базе: взять предмет со склада, заправиться
  flight   — полёт по карте (к месту миссии или домой)
  mission  — внутри зоны активной миссии
  home     — вернулись на базу, летим к площадке
  landing  — посадка
  reward   — медаль, праздник
  next     — ждём A, чтобы получить новое задание
*/
export class GameScene extends Phaser.Scene {
  constructor() { super('game'); }

  create() {
    sfx.setMuted(TEST);
    this.save = Save.load();
    this.inp = new Input(this);
    buildWorld(this, MISSIONS);
    this.createBaseObjects();
    this.heli = new Heli(this, PAD.x, PAD.y);
    this.heli.bounds = BASE_INNER;

    const cam = this.cameras.main;
    cam.setBounds(-WORLD.pad, -WORLD.pad, WORLD.w + 2 * WORLD.pad, WORLD.h + 2 * WORLD.pad).setZoom(ZOOM.base).centerOn(BASE_CAM.x, BASE_CAM.y);

    this.siteRing = this.add.graphics().setDepth(DEPTH.fx);
    this.siteIcon = this.add.image(0, 0, 'medal_fire').setDepth(DEPTH.fx).setVisible(false);
    this.padRing = this.add.graphics().setDepth(DEPTH.base + 1);

    this.state = 'boot';
    this.stateT = 0;
    this.scene.launch('hud');
    this.hud = this.scene.get('hud');
    this.installDebug();
    this.time.delayedCall(150, () => this.toTitle());
  }

  setState(s) { this.state = s; this.stateT = 0; }

  // ---------- объекты базы ----------
  createBaseObjects() {
    this.slots = WAREHOUSE.slots.map((s) => {
      const img = this.add.image(s.x, s.y, 'item_' + s.key).setDisplaySize(110, 110).setDepth(DEPTH.base + 2);
      const ring = this.add.graphics().setDepth(DEPTH.base + 1);
      return { ...s, img, ring, taken: false, baseScale: img.scale };
    });
    this.fuelRing = this.add.graphics().setDepth(DEPTH.base + 1);
    this.storeBlink = this.add.graphics().setDepth(DEPTH.base + 1); // мигающая рамка склада, пока предмет не взят
    this.boardMedals = {};
    MISSION_ORDER.forEach((id, i) => {
      if (this.save.medals.includes(id)) this.placeMedal(id, i);
    });
    this.roundsText = this.add.text(ROUNDS_TEXT.x, ROUNDS_TEXT.y, '', {
      fontFamily: FONT, fontSize: '40px', fontStyle: 'bold', color: '#c99700', stroke: '#fff', strokeThickness: 8,
    }).setOrigin(0.5).setDepth(DEPTH.base + 3);
    this.updateRounds();
    this.patients = [];
  }

  placeMedal(id, i) {
    const s = BOARD_SLOTS[i];
    this.boardMedals[id] = this.add.image(s.x, s.y, 'medal_' + id).setDisplaySize(118, 118).setDepth(DEPTH.base + 3);
  }

  updateRounds() {
    this.roundsText.setText(this.save.rounds > 0 ? `★ × ${this.save.rounds}` : '');
  }

  resetSlots() {
    for (const s of this.slots) {
      this.tweens.killTweensOf(s.img);
      s.taken = false;
      s.img.setPosition(s.x, s.y).setDisplaySize(110, 110).setAlpha(1).setVisible(true);
      s.baseScale = s.img.scale;
    }
  }

  // ---------- эффекты (доступны миссиям через ctx.fx) ----------
  sparkle(x, y, tint = [0xffd43b, 0xffffff, 0xff8fab, 0x74c0fc], count = 22) {
    const em = this.add.particles(x, y, 'dot', {
      speed: { min: 120, max: 380 }, lifespan: 700, scale: { start: 1.4, end: 0 }, tint, emitting: false,
    }).setDepth(DEPTH.fx);
    em.explode(count);
    this.time.delayedCall(900, () => em.destroy());
  }

  // ---------- этапы ----------
  toTitle() {
    this.hud.showTitle();
    this.setState('title');
  }

  toDispatch() {
    const forced = PARAMS.get('mission');
    this.missionId = forced && MISSION_META[forced] && !this.usedForced ? forced : Save.pickNext(this.save);
    this.usedForced = true;
    this.meta = MISSION_META[this.missionId];
    this.item = null; this.fuel = 0; this.ready = false; this.missionDone = false;
    this.run = null; this.ctxGuide = null; this.glugT = 0;
    this.resetSlots();
    const h = this.heli;
    h.placeLanded(PAD.x, PAD.y);
    h.locked = true; h.bounds = BASE_INNER; h.boundsCircle = null; h.maxSpeed = SPEED.base;
    h.setItem(null);
    const cam = this.cameras.main;
    cam.stopFollow(); cam.pan(BASE_CAM.x, BASE_CAM.y, 600, 'Sine.easeInOut', true); cam.zoomTo(ZOOM.base, 600, 'Sine.easeInOut', true);
    this.hud.setItem(null); this.hud.setFuel(0); this.hud.hideMission(); this.hud.hideContinue();
    this.dispatchStep = 0;
    this.callT = 0;
    this.hud.showDispatchStep(this.missionId, 0);
    sfx.call();
    this.setState('dispatch');
  }

  update(time, deltaMs) {
    const dt = Math.min(0.05, deltaMs / 1000);
    this.stateT += dt;
    this.inp.poll();
    if (this.inp.actionPressed()) sfx.unlock();
    if (!this.hud || !this.hud.ready || this.state === 'boot') return;

    const h = this.heli;
    let guide = null;
    switch (this.state) {
      case 'title':
        if (this.stateT > 0.5 && this.inp.actionPressed()) {
          sfx.unlock(); sfx.click();
          this.hud.hideDispatch();
          this.toDispatch();
        }
        break;
      case 'dispatch':
        // сценка из 3 шагов: вызов -> что случилось -> что взять; каждый шаг — кнопкой
        if (this.dispatchStep === 0) {
          this.callT += dt;
          if (this.callT > 1.6) { this.callT = 0; sfx.call(); }
        }
        if (this.stateT > 0.6 && this.inp.actionPressed()) {
          this.dispatchStep += 1;
          this.stateT = 0;
          if (this.dispatchStep < 3) {
            sfx.pop();
            this.hud.showDispatchStep(this.missionId, this.dispatchStep);
          } else {
            sfx.whoosh();
            this.hud.hideDispatch();
            this.hud.flyCardToCorner(this.missionId);
            h.locked = false;
            this.setState('prep');
          }
        }
        break;
      case 'prep': guide = this.updatePrep(dt); break;
      case 'flight': guide = this.updateFlight(dt); break;
      case 'mission': guide = this.updateMission(dt); break;
      case 'home': guide = this.updateHome(dt); break;
      case 'next':
        if (this.stateT > 0.8 && this.inp.actionPressed()) { sfx.click(); this.toDispatch(); }
        break;
    }
    h.update(dt, h.locked ? { x: 0, y: 0 } : this.inp.move);
    if (h.bumped && this.state === 'prep' && !this.ready && (this.bumpT || 0) < this.stateT) {
      sfx.bonk();
      this.bumpT = this.stateT + 0.8;
    }
    this.drawMarkers(time / 1000);
    this.hud.guide(guide, this.cameras.main);
  }

  updatePrep(dt) {
    const h = this.heli;
    // склад
    let hover = null;
    for (const s of this.slots) {
      s.ring.clear();
      if (!s.taken && h.flying && dist(h.x, h.y, s.x, s.y) < 85) hover = s;
    }
    if (hover && !this.item) {
      hover.ring.lineStyle(10, 0xffd43b, 1).strokeCircle(hover.x, hover.y, 74);
      if (this.inp.actionPressed()) {
        if (hover.key === this.meta.item) this.takeItem(hover);
        else this.wrongItem(hover);
      }
    }
    // заправка
    this.fuelRing.clear();
    if (this.fuel < 1) {
      const over = h.flying && dist(h.x, h.y, FUEL.x, FUEL.y) < FUEL.r;
      if (over) {
        this.fuel = Math.min(1, this.fuel + dt / 1.8);
        this.glugT -= dt;
        if (this.glugT <= 0) { sfx.glug(); this.glugT = 0.22; }
        this.fuelRing.lineStyle(10, 0xf59f00, 1).beginPath()
          .arc(FUEL.x, FUEL.y, FUEL.r + 14, -Math.PI / 2, -Math.PI / 2 + this.fuel * Math.PI * 2).strokePath();
        if (this.fuel >= 1) { sfx.ding(); this.sparkle(FUEL.x, FUEL.y); }
      }
      this.hud.setFuel(this.fuel);
    }
    if (!this.ready && this.item && this.fuel >= 1) {
      this.ready = true;
      h.bounds = null;
      sfx.ready();
    }
    if (this.ready && !inBase(h.x, h.y)) this.toFlight();
    this.storeBlink.clear();
    if (!this.item) {
      const a = 0.35 + 0.65 * Math.abs(Math.sin(this.stateT * 4));
      const r = WAREHOUSE.rect;
      this.storeBlink.lineStyle(16, 0xffd43b, a).strokeRoundedRect(r.x - 10, r.y - 10, r.w + 20, r.h + 20, 26);
      return null;
    }
    if (this.fuel < 1) return FUEL;
    return SITES[this.missionId];
  }

  takeItem(slot) {
    slot.taken = true;
    slot.ring.clear();
    this.item = slot.key;
    sfx.ding();
    this.sparkle(slot.x, slot.y);
    this.tweens.add({
      targets: slot.img, x: this.heli.x, y: this.heli.y, scale: slot.baseScale * 0.5, alpha: 0, duration: 350,
      onComplete: () => slot.img.setVisible(false),
    });
    this.heli.setItem(slot.key);
    this.hud.setItem(slot.key);
  }

  wrongItem(slot) {
    sfx.bonk();
    this.tweens.killTweensOf(slot.img);
    slot.img.x = slot.x;
    this.tweens.add({ targets: slot.img, x: slot.x + 16, duration: 60, yoyo: true, repeat: 3, onComplete: () => (slot.img.x = slot.x) });
  }

  toFlight() {
    this.storeBlink.clear();
    this.setState('flight');
    this.heli.maxSpeed = SPEED.map;
    const cam = this.cameras.main;
    cam.startFollow(this.heli.body, false, 0.08, 0.08);
    cam.zoomTo(ZOOM.map, 900, 'Sine.easeInOut', true);
    sfx.whoosh();
  }

  updateFlight() {
    const h = this.heli;
    const site = SITES[this.missionId];
    if (!this.missionDone) {
      if (dist(h.x, h.y, site.x, site.y) < site.r) this.enterSite();
      return site;
    }
    if (inBase(h.x, h.y)) this.toHome();
    return PAD;
  }

  makeCtx(site) {
    const layer = this.add.container(0, 0).setDepth(DEPTH.missionLow);
    return {
      scene: this, site, heli: this.heli, input: this.inp, sfx, layer, meta: this.meta, depth: DEPTH,
      fx: { sparkle: (x, y, tint, count) => this.sparkle(x, y, tint, count) },
      pointAt: (p) => { this.ctxGuide = p; },
      done: () => {
        if (this.missionDone) return;
        this.missionDone = true;
        this.ctxGuide = null;
        this.heli.boundsCircle = null;
        this.time.delayedCall(350, () => sfx.success());
        this.hud.missionComplete();
      },
    };
  }

  enterSite() {
    const site = SITES[this.missionId];
    this.setState('mission');
    this.heli.maxSpeed = SPEED.site;
    // в зоне миссии камера центрируется на месте (зум не меняется)
    const cam = this.cameras.main;
    cam.stopFollow();
    cam.pan(site.x, site.y, 800, 'Sine.easeInOut', true);
    cam.zoomTo(ZOOM.site, 700, 'Sine.easeInOut', true);
    if (!this.run) {
      this.ctx = this.makeCtx(site);
      try { this.run = MISSIONS[this.missionId].start(this.ctx); } catch (e) { console.error(e); this.ctx.done(); }
    }
    if (!this.missionDone) this.heli.boundsCircle = { x: site.x, y: site.y, r: site.r * 1.05 };
  }

  updateMission(dt) {
    const h = this.heli;
    const site = SITES[this.missionId];
    if (this.run && this.run.update) {
      try { this.run.update(dt); } catch (e) { console.error(e); this.ctx.done(); }
    }
    if (this.missionDone && dist(h.x, h.y, site.x, site.y) > site.r * 1.1) {
      if (this.run && this.run.destroy) { try { this.run.destroy(); } catch (e) { console.error(e); } }
      if (this.ctx) this.ctx.layer.destroy();
      this.run = null;
      this.setState('flight');
      this.heli.maxSpeed = SPEED.map;
      const cam = this.cameras.main;
      cam.startFollow(this.heli.body, false, 0.05, 0.05);
      cam.zoomTo(ZOOM.map, 700, 'Sine.easeInOut', true);
      this.time.delayedCall(900, () => cam.setLerp(0.08, 0.08));
      return PAD;
    }
    return this.missionDone ? PAD : this.ctxGuide;
  }

  toHome() {
    this.setState('home');
    this.heli.maxSpeed = SPEED.base;
    const cam = this.cameras.main;
    cam.stopFollow();
    cam.pan(BASE_CAM.x, BASE_CAM.y, 900, 'Sine.easeInOut', true);
    cam.zoomTo(ZOOM.base, 900, 'Sine.easeInOut', true);
  }

  updateHome() {
    const h = this.heli;
    if (!inBase(h.x, h.y)) { this.toFlight(); return PAD; }
    if (h.flying && dist(h.x, h.y, PAD.x, PAD.y) < 80) {
      this.setState('landing');
      h.land(PAD.x, PAD.y, () => this.reward());
    }
    return PAD;
  }

  reward() {
    this.setState('reward');
    sfx.fanfare();
    const id = this.missionId;
    const patient = this.heli.releaseCarried();
    if (patient) this.toHospital(patient);
    this.hud.showReward(id);
    this.time.delayedCall(2300, () => {
      this.hud.hideReward();
      this.flyMedal(id);
    });
  }

  toHospital(obj) {
    const bed = HOSPITAL_BEDS[this.patients.length % 2];
    const old = this.patients.find((p) => p.bed === bed);
    if (old) { old.obj.destroy(); this.patients = this.patients.filter((p) => p !== old); }
    this.patients.push({ bed, obj });
    obj.setDepth(DEPTH.base + 3);
    if (obj.setRotation) obj.setRotation(0);
    // пациент любого размера ложится на кровать ~110px
    const b = obj.getBounds ? obj.getBounds() : null;
    const k = b && b.width > 0 ? 110 / Math.max(b.width, b.height) : 1;
    this.tweens.add({
      targets: obj, x: bed.x, y: bed.y + 20, scaleX: obj.scaleX * k, scaleY: obj.scaleY * k,
      duration: 1200, ease: 'Sine.easeInOut',
    });
  }

  flyMedal(id) {
    const i = MISSION_ORDER.indexOf(id);
    const slot = BOARD_SLOTS[i];
    if (this.boardMedals[id]) this.boardMedals[id].destroy();
    const m = this.add.image(PAD.x, PAD.y - 60, 'medal_' + id).setDepth(DEPTH.fx).setScale(0);
    this.boardMedals[id] = m;
    this.tweens.chain({
      targets: m,
      tweens: [
        { scale: 1.3, duration: 450, ease: 'Back.easeOut' },
        { x: slot.x, y: slot.y, scale: 118 / 240, duration: 1000, ease: 'Sine.easeInOut', delay: 300 },
      ],
      onComplete: () => {
        m.setDepth(DEPTH.base + 3);
        sfx.ding();
        this.sparkle(slot.x, slot.y);
        if (!this.save.medals.includes(id)) this.save.medals.push(id);
        Save.save(this.save);
        this.heli.setItem(null);
        this.hud.setItem(null);
        this.hud.setFuel(0);
        this.hud.hideMission();
        if (MISSION_ORDER.every((x) => this.save.medals.includes(x))) this.celebrate();
        else this.toNext();
      },
    });
  }

  celebrate() {
    sfx.celebrate();
    this.hud.celebrate();
    const medals = Object.values(this.boardMedals);
    medals.forEach((m, i) => this.tweens.add({ targets: m, y: m.y - 30, duration: 260, yoyo: true, repeat: 5, delay: i * 90 }));
    this.time.delayedCall(4200, () => {
      medals.forEach((m) => this.tweens.add({
        targets: m, x: ROUNDS_TEXT.x, y: ROUNDS_TEXT.y, scale: 0, duration: 700, ease: 'Sine.easeIn', onComplete: () => m.destroy(),
      }));
      this.boardMedals = {};
      this.save.medals = [];
      this.save.rounds += 1;
      Save.save(this.save);
      this.time.delayedCall(750, () => { this.updateRounds(); sfx.ding(); this.sparkle(ROUNDS_TEXT.x, ROUNDS_TEXT.y); this.toNext(); });
    });
  }

  toNext() {
    this.setState('next');
    this.hud.showContinue();
  }

  // ---------- маркеры ----------
  drawMarkers(t) {
    const site = SITES[this.missionId];
    this.siteRing.clear();
    const showSite = site && !this.missionDone && ['prep', 'flight'].includes(this.state);
    if (showSite) {
      const k = 1 + 0.04 * Math.sin(t * 4);
      this.siteRing.lineStyle(18, this.meta.color, 0.55).strokeCircle(site.x, site.y, site.r * k);
      this.siteIcon.setTexture('medal_' + this.missionId).setPosition(site.x, site.y - site.r - 60 + Math.sin(t * 3) * 14)
        .setDisplaySize(220, 220).setVisible(true);
    } else this.siteIcon.setVisible(false);
    this.padRing.clear();
    if (this.state === 'home') {
      this.padRing.lineStyle(14, 0xffd43b, 0.6 + 0.4 * Math.sin(t * 5)).strokeCircle(PAD.x, PAD.y, PAD.r + 20);
    }
  }

  // ---------- отладка / автотесты ----------
  installDebug() {
    const self = this;
    window.__hb = {
      ready: true,
      scene: this,
      state: () => self.state,
      mission: () => self.missionId,
      heli: () => ({ x: self.heli.x, y: self.heli.y, alt: self.heli.alt, item: self.item, fuel: self.fuel }),
      teleport(x, y) { const h = self.heli; h.x = x; h.y = y; h.vx = 0; h.vy = 0; if (h.alt < 1 && !h.locked) h.alt = 1; },
      tap() { self.inp.virtual.tap = true; },
      hold(x, y) { self.inp.virtual.x = x; self.inp.virtual.y = y; },
      release() { self.inp.virtual.x = 0; self.inp.virtual.y = 0; },
      targets: () => (self.run && self.run.targets ? self.run.targets() : []),
      missionDone: () => self.missionDone,
      sites: SITES, pad: PAD, fuel: FUEL, warehouse: WAREHOUSE, items: ITEM_ORDER,
      /** Сразу оказаться у места миссии с нужным предметом и полным баком. */
      startMission(id) {
        self.hud.hideDispatch(); self.hud.hideContinue();
        self.missionId = id; self.meta = MISSION_META[id];
        if (self.run && self.run.destroy) self.run.destroy();
        if (self.ctx) self.ctx.layer.destroy();
        self.run = null; self.ctx = null; self.missionDone = false; self.ctxGuide = null;
        self.item = self.meta.item; self.fuel = 1; self.ready = true;
        const h = self.heli;
        const old = h.releaseCarried(); if (old) old.destroy();
        h.locked = false; h.landing = false; h.alt = 1; h.bounds = null; h.boundsCircle = null; h.maxSpeed = SPEED.map;
        h.setItem(self.item);
        self.hud.setItem(self.item); self.hud.setFuel(1); self.hud.showMission(id);
        const s = SITES[id];
        h.x = s.x - s.r * 0.75; h.y = s.y; h.vx = 0; h.vy = 0;
        const cam = self.cameras.main;
        cam.setZoom(ZOOM.map); cam.startFollow(h.body, false, 1, 1); cam.centerOn(h.x, h.y);
        self.time.delayedCall(50, () => cam.setLerp(0.08, 0.08));
        self.setState('flight');
      },
      /** Перелететь (телепортом) на базу над площадкой. */
      goHome() { const h = self.heli; h.x = PAD.x + 300; h.y = PAD.y; h.vx = 0; h.vy = 0; },
    };
  }
}
