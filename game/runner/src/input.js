// Ввод раннера: только «влево» / «вправо» (+ «любая кнопка» для меню).
// Геймпад: крестовина, стик, LB/RB, LT/RT, X — влево, B — вправо. Клавиатура: ←/→, A/D. Тач/мышь: левая/правая половина экрана.
const LEFT_BTN = [14, 4, 6, 2];
const RIGHT_BTN = [15, 5, 7, 1];
const STICK_ON = 0.55, STICK_OFF = 0.3;

export class LaneInput {
  constructor(scene, viewW) {
    this.events = []; // -1 / +1 / 0 (0 — любая другая кнопка)
    this.prev = new Map(); // index геймпада -> {buttons:[], stick}
    scene.input.keyboard.on('keydown', (e) => {
      if (e.repeat) return;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.events.push(-1);
      else if (e.code === 'ArrowRight' || e.code === 'KeyD') this.events.push(1);
      else this.events.push(0);
    });
    scene.input.on('pointerdown', (p) => this.events.push(p.x < viewW / 2 ? -1 : 1));
  }

  poll() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const p of pads) {
      if (!p) continue;
      const was = this.prev.get(p.index) || { buttons: [], stick: 0 };
      const now = p.buttons.map((b) => b.pressed);
      now.forEach((on, i) => {
        if (!on || was.buttons[i]) return;
        if (i === 8) return; // View/Share — выход в меню (menuExit.js)
        this.events.push(LEFT_BTN.includes(i) ? -1 : RIGHT_BTN.includes(i) ? 1 : 0);
      });
      const ax = p.axes[0] || 0;
      let stick = was.stick;
      if (stick === 0 && Math.abs(ax) > STICK_ON) { stick = Math.sign(ax); this.events.push(stick); }
      else if (stick !== 0 && Math.abs(ax) < STICK_OFF) stick = 0;
      this.prev.set(p.index, { buttons: now, stick });
    }
    const ev = this.events;
    this.events = [];
    return ev;
  }
}
