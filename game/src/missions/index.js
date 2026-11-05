// Реестр миссий. Каждый модуль по умолчанию экспортирует объект { id, drawSite(scene, site), start(ctx) }.
import fire from './fire.js';
import mountain from './mountain.js';
import garden from './garden.js';
import sea from './sea.js';
import night from './night.js';

export const MISSIONS = { fire, mountain, garden, sea, night };
