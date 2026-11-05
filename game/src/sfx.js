// Звуки синтезируются WebAudio — без файлов. Музыки нет, только короткие эффекты.
let ac = null, master = null, muted = false, noiseBuf = null;

function A() {
  if (muted) return null;
  if (!ac) {
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      master = ac.createGain();
      master.gain.value = 0.5;
      master.connect(ac.destination);
    } catch (e) { return null; }
  }
  if (ac.state === 'suspended') ac.resume();
  return ac;
}

function tone(f, t, d, { type = 'sine', vol = 0.22, f2 = null, attack = 0.01 } = {}) {
  const a = A(); if (!a) return;
  const t0 = a.currentTime + t;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t0);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + d);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
  o.connect(g).connect(master);
  o.start(t0); o.stop(t0 + d + 0.05);
}

function noise(t, d, { vol = 0.2, f = 1200, f2 = null, type = 'bandpass', q = 0.8 } = {}) {
  const a = A(); if (!a) return;
  if (!noiseBuf) {
    noiseBuf = a.createBuffer(1, a.sampleRate, a.sampleRate);
    const ch = noiseBuf.getChannelData(0);
    for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
  }
  const t0 = a.currentTime + t;
  const src = a.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
  const fl = a.createBiquadFilter(); fl.type = type; fl.Q.value = q;
  fl.frequency.setValueAtTime(f, t0);
  if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t0 + d);
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.03);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
  src.connect(fl).connect(g).connect(master);
  src.start(t0); src.stop(t0 + d + 0.05);
}

export const sfx = {
  setMuted(m) { muted = m; },
  unlock() { A(); },
  click() { tone(660, 0, 0.08, { type: 'triangle', vol: 0.15 }); },
  /** взяли предмет / что-то получилось */
  ding() { tone(988, 0, 0.18, { type: 'triangle' }); tone(1319, 0.09, 0.3, { type: 'triangle' }); },
  /** не то / нельзя — мягко */
  bonk() { tone(200, 0, 0.14, { type: 'triangle', vol: 0.25, f2: 140 }); tone(170, 0.16, 0.18, { type: 'triangle', vol: 0.25, f2: 110 }); },
  glug() { tone(280 + Math.random() * 200, 0, 0.1, { vol: 0.2, f2: 560 + Math.random() * 200 }); },
  whoosh() { noise(0, 0.7, { vol: 0.22, f: 300, f2: 1800 }); },
  splash() { noise(0, 0.55, { vol: 0.3, f: 2500, f2: 400, type: 'lowpass' }); },
  spray() { noise(0, 0.35, { vol: 0.18, f: 3000, f2: 1500, type: 'highpass' }); },
  pop() { tone(420, 0, 0.09, { vol: 0.22, f2: 900 }); },
  sparkle() { [1568, 2093, 2637, 3136].forEach((f, i) => tone(f, i * 0.05, 0.22, { vol: 0.09 })); },
  /** миссия выполнена */
  success() { [784, 988, 1175, 1568].forEach((f, i) => tone(f, i * 0.09, 0.28, { type: 'triangle', vol: 0.18 })); },
  /** вызов диспетчера */
  call() { for (let i = 0; i < 3; i++) tone(1200, i * 0.18, 0.1, { type: 'square', vol: 0.06 }); },
  ready() { tone(523, 0, 0.15, { type: 'triangle' }); tone(784, 0.12, 0.28, { type: 'triangle' }); },
  fanfare() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.14, 0.3, { type: 'triangle', vol: 0.22 }));
    [523, 659, 784, 1047].forEach((f) => tone(f, 0.62, 1.0, { type: 'triangle', vol: 0.12 }));
  },
  celebrate() {
    this.fanfare();
    [659, 784, 1047, 1319, 1568].forEach((f, i) => tone(f, 1.5 + i * 0.12, 0.35, { type: 'triangle', vol: 0.2 }));
    [523, 784, 1047, 1568].forEach((f) => tone(f, 2.2, 1.4, { type: 'triangle', vol: 0.1 }));
    for (let i = 0; i < 6; i++) setTimeout(() => this.sparkle(), 300 + i * 450);
  },
};
