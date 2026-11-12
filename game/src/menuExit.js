// Выход в меню игр (game/): Esc или кнопка «View/Share» (8) на геймпаде.
export function installMenuExit(url = '../') {
  addEventListener('keydown', (e) => { if (e.code === 'Escape') location.href = url; });
  let prev = null; // null — ещё не видели геймпад: зажатая с прошлой страницы кнопка не считается
  const tick = () => {
    let on = false;
    for (const p of navigator.getGamepads ? navigator.getGamepads() : []) if (p && p.buttons[8] && p.buttons[8].pressed) on = true;
    if (on && prev === false) { location.href = url; return; }
    prev = on;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
