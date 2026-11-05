import { VIEW } from './config.js';
import './missions/index.js'; // миссии регистрируют свои текстуры до загрузки
import { BootScene } from './scenes/BootScene.js';
import { GameScene } from './scenes/GameScene.js';
import { HudScene } from './scenes/HudScene.js';

new Phaser.Game({
  type: Phaser.AUTO,
  width: VIEW.w,
  height: VIEW.h,
  backgroundColor: '#dde6c8',
  parent: 'game',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [BootScene, GameScene, HudScene],
});
