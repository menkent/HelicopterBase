import { loadAll } from '../art.js';
import { FONT, VIEW } from '../config.js';

export class BootScene extends Phaser.Scene {
  constructor() { super('boot'); }

  create() {
    this.add.text(VIEW.w / 2, VIEW.h / 2, 'Загрузка…', { fontFamily: FONT, fontSize: '48px', color: '#5a5560' }).setOrigin(0.5);
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffffff, 1).fillCircle(8, 8, 8);
    g.generateTexture('dot', 16, 16);
    g.destroy();
    loadAll(this).then(() => this.scene.start('game'));
  }
}
