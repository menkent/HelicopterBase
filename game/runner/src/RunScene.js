// Раннер «Спасательный полёт»: вертолёт летит вперёд над тремя полосами,
// ребёнок только перестраивается влево/вправо. Круг/крюк спускаются и спасают сами.
import { FONT, TEST } from '../../src/config.js';
import { sfx } from '../../src/sfx.js';
import { ANIMAL_KEYS } from './art.js';
import { LaneInput } from './input.js';

// Кадр подстраивается под пропорции экрана: короткая сторона всегда 1080.
// Альбомный (компьютер, телевизор, телефон боком) и портретный (телефон вертикально) — со своей камерой.
export const VIEW = { w: 1920, h: 1080, portrait: false };

// ---------- псевдо-3D: камера сзади-сверху, мир в метрах ----------
let F, PITCH, SIN, COS; // фокус и наклон камеры вниз
let CX, CY, HOR; // центр кадра и линия горизонта на экране
let CAMH; // высота камеры над землёй
let HZ; // на сколько впереди камеры летит вертолёт
const ALT = 3.6; // высота полёта
let HK; // масштаб вертолёта на экране: корпус ~3.3 м шириной

/** aspect = ширина / высота окна */
export function setLayout(aspect) {
  const portrait = aspect < 0.95;
  const clamp = (v, a, b) => Math.round(Math.min(b, Math.max(a, v)));
  Object.assign(VIEW, portrait ? { w: 1080, h: clamp(1080 / aspect, 1600, 2400), portrait } : { w: clamp(1080 * aspect, 1440, 2400), h: 1080, portrait });
  // на телефоне вертикально камера круче и ближе: три полосы во всю ширину, вертолёт на 2/3 высоты
  const cam = portrait ? { deg: 36, F: 1055, CAMH: 12, HZ: 10, hor: 0.3 * VIEW.h } : { deg: 18, F: 780, CAMH: 8, HZ: 13, hor: null };
  PITCH = (cam.deg * Math.PI) / 180; SIN = Math.sin(PITCH); COS = Math.cos(PITCH);
  F = cam.F; CAMH = cam.CAMH; HZ = cam.HZ;
  CX = VIEW.w / 2;
  CY = cam.hor === null ? 580 : cam.hor + F * Math.tan(PITCH);
  HOR = CY - F * Math.tan(PITCH);
  HK = (3.3 * proj(0, ALT, HZ, 0).s) / 290;
}
const LW = 5.5; // ширина полосы
const ZNEAR = 1.5, ZMAX = 240;
const BAND = 6; // полосы-«шпалы» на земле, дают ощущение скорости
const SEG = 420; // длина участка «море»/«суша»
const APPROACH = 22; // за сколько метров до зверька начинает спускаться круг/крюк
const GOAL = 10; // столько зверят спасти за полёт
const SPEED0 = 15, SPEED_MAX = 22;

function proj(x, y, z, camX) {
  const yr = y - CAMH;
  const s = F / (z * COS - yr * SIN);
  return { sx: CX + (x - camX) * s, sy: CY - (yr * COS + z * SIN) * s, s };
}
setLayout(16 / 9);
const biomeAt = (d) => (Math.floor(d / SEG) % 2 === 0 ? 'sea' : 'land');
const nearShore = (d, m) => { const r = ((d % SEG) + SEG) % SEG; return r < m || r > SEG - m; };

const COLORS = {
  sea: [0x4dabf7, 0x43a0ee], land: [0x8ce99a, 0x7bd88a], sand: [0xffe8a3, 0xf8dc8c],
  sky: 0xd0ebff, fog: 0xe7f5ff,
};
const mix = (a, b, t) => {
  const r = ((a >> 16) & 255) + (((b >> 16) & 255) - ((a >> 16) & 255)) * t;
  const g = ((a >> 8) & 255) + (((b >> 8) & 255) - ((a >> 8) & 255)) * t;
  const bl = (a & 255) + ((b & 255) - (a & 255)) * t;
  return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(bl);
};
const TXT = (size, color = '#3b3640') => ({ fontFamily: FONT, fontSize: `${size}px`, fontStyle: 'bold', color });
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export class RunScene extends Phaser.Scene {
  constructor() { super('run'); }

  create(data = {}) {
    sfx.setMuted(TEST);
    this.inp = new LaneInput(this, VIEW.w);
    this.drawSky();
    this.ground = this.add.graphics().setDepth(1);
    this.fx = this.add.graphics().setDepth(2); // подсветка полосы, тени
    this.ropeG = this.add.graphics().setDepth(100000 - HZ * 100 + 3);
    this.lines = this.add.graphics().setDepth(95000); // линии скорости
    this.speedLines = Array.from({ length: 22 }, () => this.newSpeedLine(true));

    // вертолёт: корпус + винт в сплющенном контейнере (винт сверху в перспективе)
    this.heli = this.add.container(CX, 0).setDepth(100000 - HZ * 100);
    this.rotorBox = this.add.container(0, -128 * HK).setScale(1, 0.22);
    this.rotor = this.add.image(0, 0, 'heli_rotor').setDisplaySize(400 * HK, 400 * HK);
    this.rotorBox.add(this.rotor);
    this.heliImg = this.add.image(0, 0, 'heli_back').setDisplaySize(290 * HK, 290 * HK);
    this.heli.add([this.heliImg, this.rotorBox]);
    this.tool = this.add.image(0, 0, 'buoy').setDepth(100000 - HZ * 100 + 4).setVisible(false);
    this.hint = this.add.graphics().setDepth(96000);

    this.sparks = this.add.particles(0, 0, 'dot', {
      speed: { min: 150, max: 420 }, lifespan: 700, scale: { start: 1.2, end: 0 }, gravityY: 300,
      tint: [0xffd43b, 0xff5fae, 0x69db7c, 0x4dabf7, 0xffffff], emitting: false,
    }).setDepth(97000);
    this.trail = this.add.particles(0, 0, 'dot', {
      speedY: { min: 80, max: 160 }, speedX: { min: -40, max: 40 }, lifespan: 500, scale: { start: 0.9, end: 0 },
      alpha: { start: 0.8, end: 0 }, tint: [0xff8fc7, 0xffd43b, 0x9775fa, 0x74c0fc], frequency: 40,
    }).setDepth(99000);

    this.buildHud();
    this.resetRun();
    this.setState('title');
    if (data.keep) this.restore(data.keep);
    this.installDebug();
  }

  /** Повернули телефон: пересобрать сцену под новый кадр, сохранив спасённых и звёзды. */
  relayout() {
    const keep = { state: this.state, rescuedList: this.rescuedList, stars: this.stars, speed: this.speed };
    this.scene.restart({ keep });
  }

  restore(k) {
    this.rescuedList = k.rescuedList; this.rescued = k.rescuedList.length;
    this.stars = k.stars; this.speed = k.speed;
    this.refreshHud();
    if (k.state === 'finish') this.fillFinish();
    this.setState(k.state);
    this.stateAt -= 900; // сразу принимать нажатия
  }

  // ---------- мир ----------
  resetRun() {
    for (const e of this.ents || []) this.killEnt(e);
    this.ents = [];
    this.travel = 0;
    this.speed = SPEED0;
    this.lane = 0; this.heliX = 0; this.camX = 0;
    this.rescued = 0; this.stars = 0; this.rescuedList = [];
    this.genD = 45; this.decD = 0; this.cloudD = 0;
    this.lastLane = 0;
    this.ropeT = 0; this.ropeTool = 'buoy';
    this.finishSpawned = false;
    this.t = 0;
    this.refreshHud();
    this.fillAhead();
  }

  addEnt(kind, d, x, y, w, tex, extra = {}) {
    const img = this.add.image(0, 0, tex).setOrigin(0.5, 1).setVisible(false);
    const fr = img.frame;
    const e = { kind, d, x, y, w, h: (w * fr.height) / fr.width, img, state: 'live', ...extra };
    this.ents.push(e);
    return e;
  }

  killEnt(e) {
    e.img.destroy();
    if (e.sos) e.sos.destroy();
    e.dead = true;
  }

  fillAhead() {
    const horizon = this.travel + ZMAX + 10;
    // зверята и звёздочки — «куски» трассы
    while (this.genD < horizon) {
      const live = this.ents.filter((e) => e.kind === 'target' && e.state !== 'missed').length;
      if (this.rescued + live >= GOAL) {
        if (!this.finishSpawned && live === 0) {
          this.finishSpawned = true;
          this.addEnt('arch', this.genD + 40, 0, 0, LW * 3.6, 'arch');
        }
        break;
      }
      const len = rnd(70, 92);
      let d = this.genD + len;
      if (nearShore(d, 22)) d += 44;
      const lane = Math.random() < 0.25 ? this.lastLane : pick([-1, 0, 1].filter((l) => l !== this.lastLane));
      // дорожка из звёзд: сначала в старой полосе, потом перетекает в новую и ведёт к зверьку
      for (let i = 0; i < 6; i++) {
        const sd = this.genD + 16 + i * 8;
        if (sd > d - 12) break;
        const l = i < 2 ? this.lastLane : lane;
        this.addEnt('star', sd, l * LW, ALT + 0.3, 2.1, 'star');
      }
      const biome = biomeAt(d);
      const animal = pick(ANIMAL_KEYS);
      const e = this.addEnt('target', d, lane * LW, 0, 2.6, `t_${biome}_${animal}`, { biome, animal });
      e.sos = this.add.image(0, 0, 'sos').setOrigin(0.5, 1).setVisible(false);
      this.lastLane = lane;
      this.genD = d;
    }
    // декорации по бокам
    while (this.decD < horizon) {
      this.decD += rnd(4, 8);
      const d = this.decD;
      for (const side of [-1, 1]) {
        if (Math.random() < 0.35) continue;
        const x = side * rnd(LW * 1.5 + 2.5, LW * 1.5 + 18);
        if (nearShore(d, 6)) { this.addEnt('decor', d, x, 0, rnd(1.4, 2.2), 'rock'); continue; }
        if (biomeAt(d) === 'sea') {
          const r = Math.random();
          // острова с пальмами крупные, поэтому стоят подальше — край не заходит на трассу
          if (r < 0.3) this.addEnt('decor', d, side * (LW * 1.5 + rnd(11, 26)), 0, rnd(14, 20), 'island');
          else if (r < 0.37) this.addEnt('decor', d, side * (LW * 1.5 + rnd(30, 50)), 0, rnd(26, 36), pick(['liner', 'cargo']));
          else if (r < 0.55) this.addEnt('decor', d, x, 0, rnd(2.6, 3.4), 'boat');
          else if (r < 0.62) this.addEnt('decor', d, x + side * 6, 0, 4, 'lighthouse');
          else if (r < 0.8) this.addEnt('decor', d, x, 0, rnd(1.2, 2), 'rock');
        } else {
          const r = Math.random();
          if (r < 0.35) this.addEnt('decor', d, x, 0, rnd(3, 4.4), 'tree');
          else if (r < 0.6) this.addEnt('decor', d, x, 0, rnd(2.6, 3.6), 'pine');
          else if (r < 0.8) this.addEnt('decor', d, x, 0, rnd(1.6, 2.4), 'bush');
          else if (r < 0.88) this.addEnt('decor', d, x * 1.6 + side * 20, 0, rnd(26, 40), 'mount');
          else this.addEnt('decor', d, x, 0, rnd(1.4, 2), 'rock');
        }
      }
    }
    // облака на высоте, иногда пролетаем совсем рядом
    while (this.cloudD < horizon) {
      this.cloudD += rnd(10, 18);
      const side = pick([-1, 1]);
      this.addEnt('cloud', this.cloudD, side * rnd(LW * 1.2, LW * 6), rnd(4.5, 9), rnd(4, 7), 'cloud');
    }
  }

  // ---------- состояние ----------
  setState(s) {
    this.state = s;
    this.titleBox.setVisible(s === 'title');
    this.finishBox.setVisible(s === 'finish');
    this.hudBox.setVisible(s === 'run');
    this.heli.setVisible(s === 'run');
    this.trail.emitting = s === 'run';
    this.stateAt = this.time.now;
  }

  startRun() {
    sfx.unlock();
    sfx.ready();
    this.resetRun();
    this.setState('run');
  }

  // ---------- кадр ----------
  update(_, dtMs) {
    const dt = Math.min(dtMs, 50) / 1000;
    this.t += dt;
    const ev = this.inp.poll();
    const canPress = this.time.now - this.stateAt > 900;

    if (this.state === 'title') {
      if (ev.length && canPress) this.startRun();
      this.travel += 8 * dt;
      this.titleHeli.y = this.titleY + Math.sin(this.t * 2.2) * 16;
      this.titleHeli.rotation = Math.sin(this.t * 1.3) * 0.04;
    } else if (this.state === 'finish') {
      if (ev.length && canPress) this.startRun();
      this.travel += 8 * dt;
      this.finishHeli.y = this.finishY + Math.sin(this.t * 2.2) * 14;
    } else {
      for (const dir of ev) {
        if (dir === 0) continue;
        const nl = Phaser.Math.Clamp(this.lane + dir, -1, 1);
        if (nl !== this.lane) { this.lane = nl; sfx.whoosh(); }
        else sfx.bonk();
      }
      this.travel += this.speed * dt;
    }

    // вертолёт плавно догоняет свою полосу, камера — вертолёт
    const tx = this.lane * LW;
    const prevX = this.heliX;
    this.heliX += (tx - this.heliX) * Math.min(1, dt * 11);
    this.camX += (this.heliX * 0.55 - this.camX) * Math.min(1, dt * 6);
    const vx = (this.heliX - prevX) / Math.max(dt, 1e-3);

    this.fillAhead();
    this.drawGround();
    this.updateEnts(dt);
    this.updateHeli(dt, vx);
    this.updateSpeedLines(dt);
  }

  drawGround() {
    const g = this.ground.clear();
    // полосы земли от горизонта к нам
    const d0 = this.travel + ZNEAR, d1 = this.travel + ZMAX;
    let d = Math.floor(d1 / BAND) * BAND;
    let prevY = HOR;
    for (; d + BAND > d0; d -= BAND) {
      const za = Math.max(ZNEAR, d - this.travel);
      const zb = Math.min(ZMAX, d + BAND - this.travel);
      const ya = proj(0, 0, za, 0).sy;
      const yb = Math.max(HOR, proj(0, 0, zb, 0).sy);
      const parity = Math.floor(d / BAND) & 1;
      const pal = nearShore(d, 8) ? COLORS.sand : COLORS[biomeAt(d)];
      const fog = Math.min(1, Math.pow(zb / ZMAX, 0.8));
      g.fillStyle(mix(pal[parity], COLORS.fog, fog * 0.75), 1);
      g.fillRect(0, Math.floor(yb), VIEW.w, Math.ceil(Math.min(ya, VIEW.h) - yb) + 1);
      prevY = ya;
    }
    if (prevY < VIEW.h) { g.fillStyle(COLORS.sea[0], 1); g.fillRect(0, prevY, VIEW.w, VIEW.h - prevY); }

    // трасса: светлая дорожка из трёх полос + разделители
    const quad = (x0, x1, za, zb, color, alpha) => {
      const a = proj(x0, 0, za, this.camX), b = proj(x1, 0, za, this.camX);
      const c = proj(x1, 0, zb, this.camX), e = proj(x0, 0, zb, this.camX);
      g.fillStyle(color, alpha);
      g.fillPoints([{ x: a.sx, y: a.sy }, { x: b.sx, y: b.sy }, { x: c.sx, y: c.sy }, { x: e.sx, y: e.sy }], true);
    };
    quad(-LW * 1.5, LW * 1.5, ZNEAR, ZMAX, 0xffffff, 0.16);
    const DASH = 4;
    let k = Math.floor(d0 / DASH);
    for (let dd = k * DASH; dd < d1; dd += DASH, k++) {
      const za = Math.max(ZNEAR, dd - this.travel), zb = Math.min(ZMAX, dd + DASH * 0.8 - this.travel);
      if (zb <= za) continue;
      const sea = biomeAt(dd) === 'sea' && !nearShore(dd, 8);
      // на воде — поплавки красно-белые, как в бассейне; на суше — белые штрихи
      const color = sea ? (k & 1 ? 0xffffff : 0xf03e3e) : 0xffffff;
      if (!sea && (k & 1)) continue;
      for (const lx of [-LW * 0.5, LW * 0.5]) quad(lx - 0.13, lx + 0.13, za, zb, color, 0.9);
      for (const lx of [-LW * 1.5, LW * 1.5]) quad(lx - 0.1, lx + 0.1, za, zb, color, 0.55);
    }
  }

  updateEnts(dt) {
    const fx = this.fx.clear();
    let next = null; // ближайший живой зверёк впереди
    for (const e of this.ents) {
      if (e.dead) continue;
      const z = e.d - this.travel;
      if (e.state === 'lift') { this.updateLift(e); continue; }
      if (z < 2.2) { this.killEnt(e); continue; }
      if (z > ZMAX) { e.img.setVisible(false); if (e.sos) e.sos.setVisible(false); continue; }
      const p = proj(e.x, e.y, z, this.camX);
      const fade = Phaser.Math.Clamp((ZMAX - z) / 45, 0, 1);
      e.img.setVisible(true).setPosition(p.sx, p.sy).setDisplaySize(e.w * p.s, e.h * p.s)
        .setDepth(100000 - z * 100).setAlpha(fade);

      if (e.kind === 'star') {
        e.img.setOrigin(0.5, 0.5);
        e.img.scaleX *= Math.abs(Math.cos(this.t * 4 + e.d));
        if (this.state === 'run' && z <= HZ + 0.6 && Math.abs(this.heliX - e.x) < LW * 0.55) this.grabStar(e, p);
      } else if (e.kind === 'cloud') {
        e.img.setAlpha(fade * (z < 14 ? Math.max(0, (z - 4) / 10) : 0.92));
      } else if (e.kind === 'target') {
        const bob = Math.sin(this.t * 6 + e.d) * 0.04;
        if (z < HZ + APPROACH && p.sy > this.heliScreen().belly + 40) e.img.setDepth(100000 - HZ * 100 + 2);
        e.img.setRotation(e.state === 'live' ? bob : 0);
        if (e.sos) {
          e.sos.setVisible(e.state === 'live' && z > HZ + 10).setPosition(p.sx + e.w * p.s * 0.28, p.sy - e.h * p.s * 0.92 + Math.sin(this.t * 5) * 6)
            .setDisplaySize(Math.max(70, 1.6 * p.s), Math.max(48, 1.1 * p.s)).setDepth(100000 - z * 100 + 1).setAlpha(fade);
        }
        if (e.state === 'live') {
          if (this.state === 'run' && z <= HZ) {
            if (Math.abs(this.heliX - e.x) < LW * 0.5) this.catchTarget(e, p);
            else e.state = 'missed';
          } else if (z > HZ && (!next || z < next.d - this.travel)) next = e;
        }
      } else if (e.kind === 'arch' && this.state === 'run' && z <= HZ) {
        e.kind = 'arch_passed';
        this.finish();
      }
    }
    this.ents = this.ents.filter((e) => !e.dead);
    this.updateRope(next);
    this.drawHint(next);
    // тень вертолёта на земле
    if (this.state === 'run') {
      const p = proj(this.heliX, 0, HZ, this.camX);
      fx.fillStyle(0x000000, 0.14).fillEllipse(p.sx, p.sy, 3.4 * p.s, 0.9 * p.s);
    }
  }

  /** подсветка полосы, где ждёт следующий зверёк, и стрелка, если вертолёт не там */
  drawHint(next) {
    const h = this.hint.clear();
    if (this.state !== 'run' || !next) return;
    const z = next.d - this.travel;
    if (z > 120) return;
    const pulse = 0.5 + 0.5 * Math.sin(this.t * 7);
    const g = this.fx;
    const a = proj(next.x - LW * 0.45, 0, HZ, this.camX), b = proj(next.x + LW * 0.45, 0, HZ, this.camX);
    const c = proj(next.x + LW * 0.45, 0, z, this.camX), dd = proj(next.x - LW * 0.45, 0, z, this.camX);
    g.fillStyle(0xffd43b, 0.22 + 0.14 * pulse);
    g.fillPoints([{ x: a.sx, y: a.sy }, { x: b.sx, y: b.sy }, { x: c.sx, y: c.sy }, { x: dd.sx, y: dd.sy }], true);
    const dir = Math.sign(next.x - this.lane * LW);
    if (!dir || z > 90) return;
    const hp = proj(this.heliX, ALT, HZ, this.camX);
    const x0 = hp.sx + dir * (200 * HK + 60 + pulse * 26), y0 = hp.sy;
    h.fillStyle(0xffd43b, 1).lineStyle(8, 0xe8590c, 1);
    const pts = [[-50, -24], [10, -24], [10, -54], [64, 0], [10, 54], [10, 24], [-50, 24]].map(([x, y]) => ({ x: x0 + dir * x, y: y0 + y }));
    h.fillPoints(pts, true).strokePoints(pts, true);
  }

  catchTarget(e, p) {
    e.state = 'lift';
    e.liftAt = this.time.now;
    e.sos.setVisible(false);
    e.from = { dx: p.sx - this.heliScreen().x, y: p.sy, w: e.w * p.s, h: e.h * p.s };
    this.ropeTool = e.biome === 'sea' ? 'buoy' : 'hook';
    sfx.ding();
    if (e.biome === 'sea') sfx.splash();
  }

  updateLift(e) {
    const hs = this.heliScreen();
    const k = Phaser.Math.Clamp((this.time.now - e.liftAt) / 650, 0, 1);
    const ease = Phaser.Math.Easing.Cubic.InOut(k);
    const scale = 1 - 0.6 * ease;
    const w = e.from.w * scale, h = e.from.h * scale;
    const x = hs.x + e.from.dx * (1 - ease);
    const bottom = Phaser.Math.Linear(e.from.y, hs.belly + h * 0.95, ease);
    e.img.setPosition(x, bottom).setDisplaySize(w, h).setDepth(100000 - HZ * 100 + 2).setRotation(Math.sin(this.t * 14) * 0.08 * (1 - k));
    e.liftTop = { x, y: bottom - h * (e.biome === 'sea' ? 0.55 : 0.75) };
    if (k >= 1) this.rescue(e, x, bottom - h * 0.5);
  }

  rescue(e, x, y) {
    this.killEnt(e);
    this.rescued++;
    this.rescuedList.push(e.animal);
    this.speed = Math.min(SPEED_MAX, this.speed + 0.65);
    sfx.success();
    this.sparks.explode(40, x, y);
    const heart = this.add.image(x, y, 'heart').setDisplaySize(90, 90).setDepth(98000);
    this.tweens.add({ targets: heart, y: y - 160, alpha: 0, scale: heart.scale * 1.6, duration: 900, onComplete: () => heart.destroy() });
    const slot = this.slots[this.rescued - 1];
    const face = this.add.image(x, y, `face_${e.animal}`).setDisplaySize(120, 120).setDepth(98500);
    this.tweens.add({
      targets: face, x: slot.x, y: slot.y, displayWidth: 66, displayHeight: 66, duration: 700, ease: 'Cubic.easeIn',
      onComplete: () => { face.destroy(); this.refreshHud(); this.tweens.add({ targets: this.slotImgs[this.rescued - 1], scale: '*=1.3', yoyo: true, duration: 150 }); },
    });
  }

  grabStar(e, p) {
    e.dead = true;
    this.stars++;
    sfx.pop();
    const img = e.img;
    img.setOrigin(0.5).setScale(img.scaleY).setDepth(98000);
    this.tweens.add({
      targets: img, x: this.starIcon.x, y: this.starIcon.y, displayWidth: 60, displayHeight: 60, duration: 500, ease: 'Cubic.easeIn',
      onComplete: () => { img.destroy(); this.refreshHud(); },
    });
  }

  heliScreen() {
    const p = proj(this.heliX, ALT, HZ, this.camX);
    const y = p.sy + Math.sin(this.t * 3) * 6;
    return { x: p.sx, y, belly: y + 40 * HK };
  }

  /** трос с кругом/крюком: опускается, когда зверёк в нашей полосе подлетает */
  updateRope(next) {
    const hs = this.heliScreen();
    const lifting = this.ents.find((e) => e.state === 'lift' && !e.dead);
    const g = this.ropeG.clear();
    let goal = 0;
    if (this.state === 'run' && next) {
      const z = next.d - this.travel;
      if (z < HZ + APPROACH && Math.abs(this.heliX - next.x) < LW * 0.5) {
        goal = Phaser.Math.Clamp(1 - (z - HZ) / APPROACH, 0, 1);
        this.ropeTool = next.biome === 'sea' ? 'buoy' : 'hook';
        // круг/крюк тянется прямо к зверьку: к поясу на плоту, к макушке на скале
        const p = proj(next.x, 0, z, this.camX);
        // трос только опускается: пока зверёк на экране выше брюха (крутая камера на телефоне), круг висит под вертолётом
        this.ropeAim = { x: p.sx, y: Math.max(hs.belly + 90, p.sy - next.h * p.s * (next.biome === 'sea' ? 0.3 : 0.72)) };
      }
    }
    if (lifting && lifting.liftTop) {
      this.ropeT = 1;
      this.drawRope(g, hs, lifting.liftTop.x, lifting.liftTop.y);
      return;
    }
    this.ropeT += (Phaser.Math.Easing.Sine.Out(goal) - this.ropeT) * 0.25;
    if (this.ropeT < 0.03) { this.tool.setVisible(false); return; }
    const aim = this.ropeAim || { x: hs.x, y: hs.belly + 150 };
    const sway = Math.sin(this.t * 4) * 10 * (1 - this.ropeT);
    this.drawRope(g, hs, Phaser.Math.Linear(hs.x, aim.x, this.ropeT) + sway, Phaser.Math.Linear(hs.belly, aim.y, this.ropeT));
  }

  drawRope(g, hs, x, y) {
    g.lineStyle(5, 0x8d6542, 1).lineBetween(hs.x, hs.belly - 10, x, y);
    const buoy = this.ropeTool === 'buoy';
    this.tool.setTexture(this.ropeTool).setVisible(true).setOrigin(0.5, buoy ? 0.5 : 0.05)
      .setPosition(x, y).setDisplaySize(buoy ? 84 : 70, buoy ? 84 : 70);
  }

  updateHeli(dt, vx) {
    if (this.state !== 'run') { this.tool.setVisible(false); return; }
    const hs = this.heliScreen();
    this.heli.setPosition(hs.x, hs.y);
    this.heli.rotation = Phaser.Math.Clamp(vx * 0.018, -0.3, 0.3);
    this.rotor.rotation += dt * 22;
    this.trail.setPosition(hs.x, hs.y + 120 * HK);
  }

  newSpeedLine(init) {
    return { a: rnd(0, Math.PI * 2), r: init ? rnd(300, 1400) : rnd(300, 500), len: rnd(60, 160) };
  }

  updateSpeedLines(dt) {
    const g = this.lines.clear();
    if (this.state !== 'run') return;
    const k = this.speed / SPEED0;
    g.lineStyle(4, 0xffffff, 0.45);
    for (let i = 0; i < this.speedLines.length; i++) {
      const l = this.speedLines[i];
      l.r += l.r * dt * 1.8 * k;
      if (l.r > 1500) { this.speedLines[i] = this.newSpeedLine(false); continue; }
      const c = Math.cos(l.a), s = Math.sin(l.a);
      if (l.r < 420) continue;
      g.lineBetween(CX + c * l.r, HOR + s * l.r * 0.8, CX + c * (l.r + l.len), HOR + s * (l.r + l.len) * 0.8);
    }
  }

  finish() {
    this.trail.emitting = false;
    sfx.celebrate();
    this.sparks.explode(120, CX, VIEW.h * 0.4);
    this.time.delayedCall(700, () => {
      this.fillFinish();
      this.setState('finish');
    });
  }

  // ---------- небо, HUD, заставка, финиш ----------
  drawSky() {
    const g = this.add.graphics().setDepth(0);
    g.fillGradientStyle(0x74c0fc, 0x74c0fc, COLORS.fog, COLORS.fog, 1).fillRect(0, 0, VIEW.w, HOR + 2);
    this.add.image(VIEW.portrait ? VIEW.w - 170 : VIEW.w - 400, VIEW.portrait ? 330 : 120, 'sun').setDisplaySize(170, 170).setDepth(0);
    // дальние горы на горизонте
    const m = this.add.graphics().setDepth(0);
    m.fillStyle(0xb8c9dd, 1);
    const pts = [{ x: 0, y: HOR }];
    for (let x = 0; x <= VIEW.w; x += 80) pts.push({ x, y: HOR - 40 - 40 * Math.abs(Math.sin(x * 0.004) + Math.sin(x * 0.011)) });
    pts.push({ x: VIEW.w, y: HOR });
    m.fillPoints(pts, true);
  }

  buildHud() {
    this.hudBox = this.add.container(0, 0).setDepth(200000);
    const g = this.add.graphics();
    const w = 40 + GOAL * 82;
    g.fillStyle(0xffffff, 0.9).fillRoundedRect(24, 20, w, 110, 34).lineStyle(4, 0xffc9de, 1).strokeRoundedRect(24, 20, w, 110, 34);
    // звёзды: справа сверху, а на телефоне — под рядом зверят
    const sx = VIEW.portrait ? 24 : VIEW.w - 264, sy = VIEW.portrait ? 146 : 20;
    g.fillStyle(0xffffff, 0.9).fillRoundedRect(sx, sy, 240, 110, 34).lineStyle(4, 0xffe066, 1).strokeRoundedRect(sx, sy, 240, 110, 34);
    this.hudBox.add(g);
    this.slots = []; this.slotImgs = [];
    for (let i = 0; i < GOAL; i++) {
      const x = 85 + i * 82, y = 75;
      this.slots.push({ x, y });
      const c = this.add.graphics().fillStyle(0xf1f3f5, 1).fillCircle(x, y, 34);
      const img = this.add.image(x, y, 'face_bunny').setDisplaySize(66, 66).setVisible(false);
      this.slotImgs.push(img);
      this.hudBox.add([c, img]);
    }
    this.starIcon = this.add.image(sx + 64, sy + 55, 'star').setDisplaySize(76, 76);
    this.starText = this.add.text(sx + 114, sy + 55, '0', TXT(60)).setOrigin(0, 0.5);
    this.hudBox.add([this.starIcon, this.starText]);

    // заставка
    this.titleBox = this.add.container(0, 0).setDepth(200000);
    const tg = this.add.graphics().fillStyle(0xffffff, 0.55).fillRect(0, 0, VIEW.w, VIEW.h);
    const P = VIEW.portrait;
    const ty = (P ? [300, 820, 1330, 1560] : [150, 470, 800, 960]).map((y) => (y * VIEW.h) / (P ? 1920 : 1080)); // заголовок, вертолёт, стрелки, «нажми»
    this.titleY = ty[1];
    this.titleHeli = this.add.image(CX, ty[1], 'heli_front').setDisplaySize(P ? 560 : 420, P ? 560 : 420);
    const title = this.add.text(CX, ty[0], P ? 'Спасательный\nполёт' : 'Спасательный полёт', TXT(P ? 110 : 96, '#d63384'))
      .setOrigin(0.5).setAlign('center').setLineSpacing(-10).setStroke('#ffffff', 14);
    const arrows = this.add.graphics();
    for (const dir of [-1, 1]) {
      const x0 = CX + dir * 380, y0 = ty[2];
      const pts = [[-70, -34], [14, -34], [14, -76], [90, 0], [14, 76], [14, 34], [-70, 34]].map(([x, y]) => ({ x: x0 + dir * x, y: y0 + y }));
      arrows.fillStyle(0xffd43b, 1).lineStyle(10, 0xe8590c, 1).fillPoints(pts, true).strokePoints(pts, true);
    }
    const lanes = this.add.graphics();
    for (let i = 0; i < 3; i++) lanes.fillStyle(i === 1 ? 0xff5fae : 0xffffff, 1).lineStyle(6, 0xd63384, 1).fillRoundedRect(CX - 165 + i * 115, ty[2] - 50, 100, 100, 22).strokeRoundedRect(CX - 165 + i * 115, ty[2] - 50, 100, 100, 22);
    const go = this.add.text(CX, ty[3], P ? 'Нажми, чтобы лететь!' : 'Нажми любую кнопку!', TXT(56, '#3b3640')).setOrigin(0.5).setStroke('#ffffff', 10);
    this.tweens.add({ targets: go, scale: 1.08, yoyo: true, repeat: -1, duration: 600 });
    this.titleBox.add([tg, title, this.titleHeli, arrows, lanes, go]);

    // финиш
    this.finishBox = this.add.container(0, 0).setDepth(200000);
  }

  refreshHud() {
    this.slotImgs.forEach((img, i) => {
      const a = this.rescuedList[i];
      img.setVisible(!!a);
      if (a) img.setTexture(`face_${a}`).setDisplaySize(66, 66);
    });
    this.starText.setText(String(this.stars));
  }

  fillFinish() {
    const b = this.finishBox;
    b.removeAll(true);
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 0.6).fillRect(0, 0, VIEW.w, VIEW.h);
    const P = VIEW.portrait;
    // y: вертолёт, надпись, зверята, звёзды, «ещё раз»; на телефоне зверята в два ряда по 5
    const dy = (VIEW.h - (P ? 1920 : 1080)) / 2; // панель по центру по высоте
    const fy = (P ? [560, 860, 1010, 1330, 1640] : [360, 580, 710, 840, 1020]).map((y) => y + dy);
    const box = P ? [60, 260 + dy, VIEW.w - 120, 1200] : [CX - 700, 120 + dy, 1400, 840];
    g.fillStyle(0xffffff, 1).fillRoundedRect(...box, 60).lineStyle(10, 0xff5fae, 1).strokeRoundedRect(...box, 60);
    this.finishY = fy[0];
    this.finishHeli = this.add.image(CX, fy[0], 'heli_front').setDisplaySize(340, 340);
    b.add([g, this.finishHeli]);
    b.add(this.add.text(CX, fy[1], P ? 'Ура!\nВсе спасены!' : 'Ура! Все спасены!', TXT(80, '#d63384')).setOrigin(0.5).setAlign('center'));
    this.rescuedList.forEach((a, i) => {
      const per = P ? 5 : 10, col = i % per, row = Math.floor(i / per);
      const x = CX - ((per - 1) / 2) * (P ? 170 : 120) + col * (P ? 170 : 120);
      const img = this.add.image(x, fy[2] + row * 150, `face_${a}`).setDisplaySize(104, 104).setScale(0);
      b.add(img);
      this.tweens.add({ targets: img, scale: (104 / img.width), delay: 200 + i * 120, duration: 300, ease: 'Back.easeOut', onStart: () => sfx.pop() });
    });
    b.add(this.add.image(CX - 60, fy[3], 'star').setDisplaySize(80, 80));
    b.add(this.add.text(CX - 6, fy[3], String(this.stars), TXT(64)).setOrigin(0, 0.5));
    const again = this.add.text(CX, fy[4], P ? 'Нажми — ещё раз' : 'Ещё раз — любая кнопка', TXT(48, '#3b3640')).setOrigin(0.5).setStroke('#ffffff', 10);
    b.add(again);
    this.tweens.add({ targets: again, scale: 1.06, yoyo: true, repeat: -1, duration: 600 });
  }

  // ---------- автотесты ----------
  installDebug() {
    const self = this;
    window.__run = {
      ready: true,
      state: () => self.state,
      press(dir) { self.inp.events.push(dir); },
      info: () => ({ lane: self.lane, rescued: self.rescued, stars: self.stars, travel: self.travel, speed: self.speed }),
      /** ближайший живой зверёк: полоса и расстояние */
      next() {
        const e = self.ents.filter((x) => x.kind === 'target' && x.state === 'live' && x.d - self.travel > HZ)
          .sort((a, b) => a.d - b.d)[0];
        return e ? { lane: Math.round(e.x / LW), z: e.d - self.travel, biome: e.biome } : null;
      },
      setSpeed(v) { self.speed = v; },
      skip(m) { self.travel += m; },
    };
  }
}
