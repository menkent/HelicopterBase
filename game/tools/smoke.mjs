// Дымовой тест полного цикла: диспетчер -> склад (сначала не тот предмет) -> заправка -> вылет -> миссия -> домой -> медаль.
// node smoke.mjs <mission> <outdir>
import { openGame, solveMission, tapUntilState } from './hb.mjs';
import fs from 'node:fs';

const id = process.argv[2] || 'fire';
const out = process.argv[3] || '/tmp/hb-smoke';
fs.mkdirSync(out, { recursive: true });
const g = await openGame({ query: `test=1&mission=${id}` });
const step = async (name) => { await g.shot(`${out}/${name}.png`); console.log('state', name, await g.hb('__hb.state()'), JSON.stringify(await g.hb('__hb.heli()'))); };
try {
  await g.wait(800); await step('01-dispatch');
  await tapUntilState(g, 'prep', 80);
  const need = await g.ev(() => window.__hb.scene.meta.item);
  const slots = await g.ev(() => window.__hb.warehouse.slots);
  const wrong = slots.find((s) => s.key !== need), right = slots.find((s) => s.key === need);
  await g.ev(() => window.__hb.hold(0, -1)); await g.wait(300); await g.ev(() => window.__hb.release());
  await g.ev((p) => window.__hb.teleport(p.x, p.y), wrong); await g.wait(300); await g.hb('__hb.tap()'); await g.wait(200);
  await step('02-wrong-item');
  await g.ev((p) => window.__hb.teleport(p.x, p.y), right); await g.wait(300); await g.hb('__hb.tap()'); await g.wait(500);
  await g.ev((p) => window.__hb.teleport(p.x, p.y), await g.ev(() => window.__hb.fuel)); await g.wait(1000);
  await step('03-fueling');
  await g.page.waitForFunction(() => window.__hb.heli().fuel >= 1, null, { timeout: 30000 }); await g.wait(300); await step('04-ready');
  const site = await g.ev((m) => window.__hb.sites[m], id);
  await g.ev(() => window.__hb.teleport(window.__hb.pad.x - 1000, window.__hb.pad.y)); await g.wait(1500);
  await step('05-flight');
  await g.ev((s) => window.__hb.teleport(s.x - s.r * 0.6, s.y), site); await g.wait(1500);
  await step('06-mission');
  const ok = await solveMission(g);
  console.log('mission done:', ok);
  await g.wait(800); await step('07-done');
  await g.hb('__hb.goHome()'); await g.wait(400);
  await step('08-home');
  await g.ev(() => window.__hb.teleport(window.__hb.pad.x, window.__hb.pad.y)); await g.wait(1800);
  await step('09-reward');
  await g.wait(3500); await step('10-medal');
} finally {
  console.log('LOGS:\n' + g.logs.join('\n'));
  await g.close();
}
