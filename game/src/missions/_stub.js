// Заглушка миссии: одна звёздочка, зависнуть над ней и нажать A.
// Используется, пока настоящая миссия не написана. Образец реализации интерфейса из MISSIONS.md.
import { DEPTH, MISSION_META } from '../config.js';

export function makeStub(id) {
  return {
    id,
    drawSite(scene, site) {
      const g = scene.add.graphics().setDepth(DEPTH.site);
      g.fillStyle(MISSION_META[id].color, 0.15).fillCircle(site.x, site.y, site.r * 0.8);
      g.lineStyle(8, MISSION_META[id].color, 0.4).strokeCircle(site.x, site.y, site.r * 0.8);
    },
    start(ctx) {
      const { scene, site, heli, input, sfx } = ctx;
      const tx = site.x + 120, ty = site.y;
      const star = scene.add.image(tx, ty, 'icon_star').setDisplaySize(160, 160).setDepth(DEPTH.missionLow);
      scene.tweens.add({ targets: star, scale: star.scale * 1.15, yoyo: true, repeat: -1, duration: 500 });
      let finished = false;
      return {
        update() {
          if (finished) return;
          if (heli.isOver(tx, ty, 110) && input.actionPressed()) {
            finished = true;
            sfx.sparkle();
            ctx.fx.sparkle(tx, ty);
            scene.tweens.killTweensOf(star);
            scene.tweens.add({ targets: star, scale: 0, duration: 400 });
            ctx.done();
          }
        },
        targets: () => (finished ? [] : [{ x: tx, y: ty }]),
        destroy() { star.destroy(); },
      };
    },
  };
}
