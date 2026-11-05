// Обвязка для автотестов: открывает игру в headless Chrome.
// Сервер должен быть запущен: python3 -m http.server 8765 --directory <game>
import { chromium } from 'playwright-core';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

export async function openGame({ query = 'test=1', port = 8765, w = 1920, h = 1080 } = {}) {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--autoplay-policy=no-user-gesture-required', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  const logs = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(`[${m.type()}] ${m.text()}`); });
  page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
  await page.goto(`http://localhost:${port}/?${query}`);
  await page.waitForFunction(() => window.__hb && window.__hb.ready && window.__hb.state() !== 'boot', null, { timeout: 20000 });
  const api = {
    browser, page, logs,
    ev: (fn, arg) => page.evaluate(fn, arg),
    hb: (code) => page.evaluate(code),          // строка JS, например "__hb.state()"
    shot: (path) => page.screenshot({ path }),
    wait: (ms) => page.waitForTimeout(ms),
    async waitState(s, timeout = 15000) { await page.waitForFunction((st) => window.__hb.state() === st, s, { timeout }); },
    close: () => browser.close(),
  };
  return api;
}

/** Нажимать кнопку, пока игра не перейдёт в состояние state (нажатие может потеряться, пока окно ещё не принимает ввод). */
export async function tapUntilState(g, state, tries = 20) {
  for (let i = 0; i < tries && (await g.hb('__hb.state()')) !== state; i++) { await g.hb('__hb.tap()'); await g.wait(300); }
  return (await g.hb('__hb.state()')) === state;
}

/** Решить текущую миссию через targets(): телепорт к цели + нажатие, пока не done. */
export async function solveMission(g, { maxSteps = 30, stepWait = 700 } = {}) {
  for (let i = 0; i < maxSteps; i++) {
    if (await g.hb('__hb.missionDone()')) return true;
    const t = await g.hb('__hb.targets()');
    if (!t.length) { await g.wait(stepWait); continue; }
    await g.ev((p) => window.__hb.teleport(p.x, p.y), t[0]);
    await g.wait(250);
    await g.hb('__hb.tap()');
    await g.wait(stepWait);
  }
  return g.hb('__hb.missionDone()');
}
