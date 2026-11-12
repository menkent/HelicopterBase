// Дымовой тест раннера: заставка -> полёт, автопилот держит полосу ближайшего зверька -> финиш.
// node runner-smoke.mjs <outdir>   (сервер: python3 -m http.server 8765 --directory <game>)
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const out = process.argv[2] || '/tmp/hb-runner';
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const logs = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
const ev = (fn, a) => page.evaluate(fn, a);
const shot = (n) => page.screenshot({ path: `${out}/${n}.png` });
try {
  await page.goto('http://localhost:8765/runner/?test=1');
  await page.waitForFunction(() => window.__run && window.__run.ready, null, { timeout: 20000 });
  await page.waitForTimeout(1200); await shot('01-title');
  await ev(() => window.__run.press(0));
  await page.waitForFunction(() => window.__run.state() === 'run');
  await page.waitForTimeout(1500); await shot('02-run');
  let shots = 0, missedOnce = false;
  for (let i = 0; i < 1200 && (await ev(() => window.__run.state())) === 'run'; i++) {
    const n = await ev(() => window.__run.next());
    const info = await ev(() => window.__run.info());
    if (n) {
      // первого зверька нарочно пропускаем — проверить, что он вернётся позже
      const want = !missedOnce && info.rescued === 0 ? (n.lane === 1 ? 0 : 1) : n.lane;
      if (n.z < 16) missedOnce = missedOnce || want !== n.lane;
      if (want !== info.lane) await ev((d) => window.__run.press(d), Math.sign(want - info.lane));
      if (shots < 4 && n.z < 19 && n.z > 15 && want === n.lane) { await shot(`03-rope-${n.biome}-${shots++}`); }
    }
    if (i === 30) await shot('02b-hint');
    await page.waitForTimeout(100);
  }
  console.log('state', await ev(() => window.__run.state()), JSON.stringify(await ev(() => window.__run.info())), 'missedOnce', missedOnce);
  await page.waitForTimeout(2500); await shot('09-finish');
} finally {
  console.log('LOGS:\n' + logs.join('\n'));
  await browser.close();
}
