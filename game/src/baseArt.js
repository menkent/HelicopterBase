// Картинка базы 1800x1000 (локальные координаты базы), в стиле бумажной базы.
import { I, place, svgDoc } from './icons.js';

const FONT = "'PT Sans','Helvetica Neue',Arial,sans-serif";
const INK = '#5a5560';
const ROAD = '#dcd7ce';
const ROAD_EDGE = '#c4beb3';

function plate(cx, y, label, stroke, size = 30) {
  const w = label.length * size * 0.56 + 44;
  return (
    `<rect x="${cx - w / 2}" y="${y}" width="${w}" height="${size + 16}" rx="${(size + 16) / 2}" fill="#fff" fill-opacity=".9" stroke="${stroke}" stroke-width="3"/>` +
    `<text x="${cx}" y="${y + size + 3}" font-family="${FONT}" font-size="${size}" font-weight="bold" fill="${INK}" text-anchor="middle">${label}</text>`
  );
}

function building(x, y, w, h, fill, stroke) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="${fill}" stroke="${stroke}" stroke-width="6"/>`;
}

export function baseSvg() {
  const s = [];
  const C = [900, 560];
  s.push(`<rect x="4" y="4" width="1792" height="992" rx="40" fill="#e6edd5" stroke="#b9c79a" stroke-width="8" stroke-dasharray="34 20"/>`);

  // дороги
  const doors = [[430, 560], [900, 250], [1450, 350], [1460, 620], [1460, 800]];
  for (const [x, y] of doors) s.push(`<line x1="${C[0]}" y1="${C[1]}" x2="${x}" y2="${y}" stroke="${ROAD_EDGE}" stroke-width="66"/>`);
  s.push(`<circle cx="${C[0]}" cy="${C[1]}" r="240" fill="none" stroke="${ROAD_EDGE}" stroke-width="66"/>`);
  for (const [x, y] of doors) s.push(`<line x1="${C[0]}" y1="${C[1]}" x2="${x}" y2="${y}" stroke="${ROAD}" stroke-width="56"/>`);
  s.push(`<circle cx="${C[0]}" cy="${C[1]}" r="240" fill="none" stroke="${ROAD}" stroke-width="56"/>`);
  s.push(`<circle cx="${C[0]}" cy="${C[1]}" r="240" fill="none" stroke="#fff" stroke-width="4" stroke-dasharray="22 18"/>`);
  for (const [x, y] of doors) {
    const dx = x - C[0], dy = y - C[1], L = Math.hypot(dx, dy);
    const sx = C[0] + (dx / L) * 275, sy = C[1] + (dy / L) * 275;
    s.push(`<line x1="${sx}" y1="${sy}" x2="${x}" y2="${y}" stroke="#fff" stroke-width="4" stroke-dasharray="22 18"/>`);
  }
  // островок и площадка
  s.push(`<circle cx="${C[0]}" cy="${C[1]}" r="208" fill="#dde6c8" stroke="${ROAD_EDGE}" stroke-width="4"/>`);
  s.push(`<circle cx="${C[0]}" cy="${C[1]}" r="150" fill="#ecd5dc" stroke="#c993a3" stroke-width="7"/>`);
  s.push(`<circle cx="${C[0]}" cy="${C[1]}" r="128" fill="none" stroke="#fff" stroke-width="7" stroke-dasharray="26 18"/>`);
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    s.push(`<circle cx="${C[0] + 140 * Math.cos(a)}" cy="${C[1] + 140 * Math.sin(a)}" r="7" fill="#f6e7aa" stroke="#cdb46a" stroke-width="2"/>`);
  }
  const hp = [[-43, -50], [-24, -50], [-24, -9], [24, -9], [24, -50], [43, -50], [43, 50], [24, 50], [24, 9], [-24, 9], [-24, 50], [-43, 50]];
  s.push(`<polygon points="${hp.map(([x, y]) => `${C[0] + x * 1.15},${C[1] + y * 1.15}`).join(' ')}" fill="#fff" stroke="#c993a3" stroke-width="5" stroke-linejoin="round"/>`);
  s.push(`<path id="arc" d="M${C[0] - 178} ${C[1]} A178 178 0 0 1 ${C[0] + 178} ${C[1]}" fill="none"/>`);
  s.push(`<text font-family="${FONT}" font-size="30" font-weight="bold" fill="#9c7484" letter-spacing="6"><textPath href="#arc" startOffset="50%" text-anchor="middle">БАЗА СПАСЕНИЯ</textPath></text>`);

  // склад: ячейки рисуем пустыми, предметы — спрайты игры
  s.push(building(70, 80, 360, 840, '#ede1c8', '#c8b086'));
  s.push(plate(250, 96, 'Склад', '#c8b086'));
  for (let i = 0; i < 5; i++) {
    s.push(`<rect x="180" y="${150 + i * 140}" width="140" height="130" rx="18" fill="#fff" fill-opacity=".7" stroke="#c8b086" stroke-width="4" stroke-dasharray="12 8"/>`);
  }
  // больница
  s.push(building(1380, 60, 360, 290, '#edf3f0', '#a9c7bb'));
  s.push(plate(1560, 72, 'Больница', '#a9c7bb'));
  s.push(place(I.cross('#d9776f'), 1396, 170, 84, 0.7));
  for (const bx of [1550, 1670]) {
    s.push(`<rect x="${bx - 48}" y="${140}" width="96" height="196" rx="12" fill="#fff" stroke="#a9c7bb" stroke-width="4"/>`);
    s.push(`<rect x="${bx - 34}" y="152" width="68" height="34" rx="10" fill="#e6f0ec" stroke="#a9c7bb" stroke-width="3"/>`);
    s.push(`<rect x="${bx - 42}" y="200" width="84" height="130" rx="10" fill="#cfe3f0"/>`);
  }
  // доска героя
  s.push(building(560, 30, 680, 225, '#f5ecd6', '#d9c28a'));
  for (const dx of [-260, -130, 0, 130, 260]) {
    s.push(`<circle cx="${900 + dx}" cy="150" r="58" fill="#fff" fill-opacity=".6" stroke="#d9c28a" stroke-width="4" stroke-dasharray="12 9"/>`);
    s.push(place(I.star('#f3e3b0', '#e2cd8c'), 900 + dx - 28, 122, 56, 0.8));
  }
  s.push(plate(900, 40, 'Доска героя', '#d9c28a', 24));
  // заправка
  s.push(building(1460, 430, 300, 340, '#f1e6c0', '#cdb46a'));
  s.push(plate(1610, 444, 'Заправка', '#cdb46a'));
  s.push(`<circle cx="1600" cy="620" r="100" fill="#fff" fill-opacity=".5" stroke="#cdb46a" stroke-width="5" stroke-dasharray="16 10"/>`);
  s.push(place(I.pump(), 1550, 570, 100, 0.55));
  // диспетчерская
  s.push(building(1380, 800, 380, 170, '#e0d8ea', '#ab9dc4'));
  s.push(plate(1570, 812, 'Диспетчер', '#ab9dc4'));
  s.push(place(I.radio(), 1530, 866, 84, 0.6));
  // цветочки внизу
  let seed = 3;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < 40; i++) {
    const x = 500 + rnd() * 820, y = 860 + rnd() * 110;
    const c = ['#f3c6d3', '#fff3bf', '#d0ebff'][i % 3];
    s.push(`<circle cx="${x}" cy="${y}" r="7" fill="${c}"/><circle cx="${x}" cy="${y}" r="2.5" fill="#f7e08a"/>`);
  }
  return svgDoc(s.join(''), '0 0 1800 1000');
}
