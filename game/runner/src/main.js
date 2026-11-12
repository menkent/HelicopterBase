import { FONT } from '../../src/config.js';
import { installMenuExit } from '../../src/menuExit.js';
import { loadAll } from './art.js';
import { RunScene, VIEW } from './RunScene.js';

class BootScene extends Phaser.Scene {
  constructor() { super('boot'); }

  create() {
    this.add.text(VIEW.w / 2, VIEW.h / 2, 'Загрузка…', { fontFamily: FONT, fontSize: '48px', color: '#5a5560' }).setOrigin(0.5);
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffffff, 1).fillCircle(8, 8, 8);
    g.generateTexture('dot', 16, 16);
    g.destroy();
    loadAll(this).then(() => this.scene.start('run'));
  }
}

installMenuExit();

new Phaser.Game({
  type: Phaser.AUTO,
  width: VIEW.w,
  height: VIEW.h,
  backgroundColor: '#a5d8ff',
  parent: 'game',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  input: { gamepad: false },
  scene: [BootScene, RunScene],
});
