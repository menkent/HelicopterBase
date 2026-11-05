// Ввод: геймпад (стандартная раскладка Xbox/DualSense) + клавиатура + виртуальный ввод для тестов.
const DEAD = 0.22;
const ACTION_BUTTONS = [0, 1, 2, 3, 4, 5, 6, 7]; // любая кнопка/курок = действие

export class Input {
  constructor(scene) {
    const kb = scene.input.keyboard;
    this.keys = kb.addKeys('UP,DOWN,LEFT,RIGHT,W,A,S,D,SPACE,ENTER');
    // виртуальный ввод: window.__hb.hold(x,y), window.__hb.tap()
    this.virtual = { x: 0, y: 0, action: false, tap: false };
    this.move = { x: 0, y: 0 };
    this.prevAction = false;
    this.pressed = false;
    this.padConnected = false;
  }

  poll() {
    let x = 0, y = 0, act = false;
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    this.padConnected = false;
    for (const p of pads) {
      if (!p) continue;
      this.padConnected = true;
      let ax = p.axes[0] || 0, ay = p.axes[1] || 0;
      const m = Math.hypot(ax, ay);
      if (m < DEAD) { ax = 0; ay = 0; }
      else { const k = Math.min(1, (m - DEAD) / (1 - DEAD)) / m; ax *= k; ay *= k; }
      const b = (i) => p.buttons[i] && p.buttons[i].pressed;
      if (b(14)) ax = -1;
      if (b(15)) ax = 1;
      if (b(12)) ay = -1;
      if (b(13)) ay = 1;
      x += ax; y += ay;
      if (ACTION_BUTTONS.some(b)) act = true;
    }
    const k = this.keys;
    if (k.LEFT.isDown || k.A.isDown) x -= 1;
    if (k.RIGHT.isDown || k.D.isDown) x += 1;
    if (k.UP.isDown || k.W.isDown) y -= 1;
    if (k.DOWN.isDown || k.S.isDown) y += 1;
    if (k.SPACE.isDown || k.ENTER.isDown) act = true;

    x += this.virtual.x; y += this.virtual.y;
    if (this.virtual.action) act = true;

    const len = Math.hypot(x, y);
    if (len > 1) { x /= len; y /= len; }
    this.move = { x, y };
    this.pressed = act && !this.prevAction;
    this.prevAction = act;
    if (this.virtual.tap) { this.pressed = true; this.virtual.tap = false; }
  }

  /** true ровно в тот кадр, когда нажали кнопку действия */
  actionPressed() { return this.pressed; }
  /** кнопка действия зажата */
  actionHeld() { return this.prevAction; }
}
