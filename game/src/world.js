import { BASE, DEPTH, SITES, WORLD } from './config.js';

/** Земля, тропинки к местам миссий, деревья, база и статичные декорации мест. */
export function buildWorld(scene, missions) {
  const rnd = new Phaser.Math.RandomDataGenerator(['hb-world']);
  const g = scene.add.graphics().setDepth(DEPTH.ground);
  const P = WORLD.pad;
  g.fillStyle(0xdde6c8, 1).fillRect(-P, -P, WORLD.w + 2 * P, WORLD.h + 2 * P);
  for (let i = 0; i < 220; i++) {
    g.fillStyle(i % 3 ? 0xe5ecd3 : 0xd3dfba, 1)
      .fillEllipse(rnd.between(-P, WORLD.w + P), rnd.between(-P, WORLD.h + P), rnd.between(180, 460), rnd.between(110, 280));
  }

  // тропинки-точки от базы к каждому месту
  const pathPts = [];
  const p = scene.add.graphics().setDepth(DEPTH.path);
  for (const site of Object.values(SITES)) {
    const sx = BASE.cx, sy = BASE.cy;
    const dx = site.x - sx, dy = site.y - sy, len = Math.hypot(dx, dy);
    const nx = -dy / len, ny = dx / len, bend = rnd.between(-260, 260);
    const curve = new Phaser.Curves.QuadraticBezier(
      new Phaser.Math.Vector2(sx, sy),
      new Phaser.Math.Vector2(sx + dx / 2 + nx * bend, sy + dy / 2 + ny * bend),
      new Phaser.Math.Vector2(site.x, site.y),
    );
    const n = Math.floor(curve.getLength() / 75);
    curve.getSpacedPoints(n).forEach((pt) => {
      pathPts.push(pt);
      const inBase = pt.x > BASE.x - 20 && pt.x < BASE.x + BASE.w + 20 && pt.y > BASE.y - 20 && pt.y < BASE.y + BASE.h + 20;
      const inSite = Math.hypot(pt.x - site.x, pt.y - site.y) < site.r * 0.9;
      if (!inBase && !inSite) p.fillStyle(0xeadfc6, 1).fillCircle(pt.x, pt.y, 22);
    });
  }

  // деревья
  const free = (x, y) => {
    if (x > BASE.x - 160 && x < BASE.x + BASE.w + 160 && y > BASE.y - 160 && y < BASE.y + BASE.h + 160) return false;
    for (const s of Object.values(SITES)) if (Math.hypot(x - s.x, y - s.y) < s.r + 90) return false;
    for (const pt of pathPts) if (Math.hypot(x - pt.x, y - pt.y) < 90) return false;
    return true;
  };
  for (let i = 0, placed = 0; i < 4000 && placed < 380; i++) {
    const x = rnd.between(-P + 60, WORLD.w + P - 60), y = rnd.between(-P + 60, WORLD.h + P - 60);
    if (!free(x, y)) continue;
    scene.add.image(x, y, rnd.pick(['tree_top', 'tree_top2'])).setDepth(DEPTH.decor).setDisplaySize(...Array(2).fill(rnd.between(90, 150)));
    placed++;
  }

  scene.add.image(BASE.x, BASE.y, 'base').setOrigin(0).setDepth(DEPTH.base);

  for (const [id, m] of Object.entries(missions)) {
    try { m.drawSite(scene, SITES[id]); } catch (e) { console.error('drawSite failed', id, e); }
  }
}
