// Feste Bildschritte für Welten-Tests: hält die eigene Spielschleife an und rechnet jede Wartezeit als Bilder zu 1/30 s.
// So hängt das Ergebnis nicht von der Rechnergeschwindigkeit ab (swiftshader unter Last schafft sonst nur wenige Bilder,
// Bisse und Schnüffeln fallen dann zufällig aus). Wartezeiten laufen zusätzlich mindestens echt ab, damit game.later greift.
// Rückgabe: W(ms) wartet, kb.down/up('KeyE'|'KeyF') hält BISS/NASE wie die Tastatur, draw() zeichnet für Screenshots.
export async function frames(p) {
  await p.evaluate(() => { window.game.loop = () => { }; });
  const KEYS = { KeyE: 'act', KeyF: 'sniff', Space: 'jump' }, held = {};
  const sim = n => p.evaluate(([n, held]) => {
    const g = window.game, i = g.input, dt = 1 / 30;
    for (let k = 0; k < n; k++) {
      Object.assign(i._held, { jump: false, act: false, sniff: false, spin: false, bark: false, up: false, down: false }, held); i.update(); i.move.x = 0; i.move.y = 0;
      g.dialog.update(); if (g.dialog.open) { g.dialog.input(i); continue; }
      if (g.shopOpen) { g._shopInput(); continue; }
      if (!g.level) continue;
      if (g.level.isRunner) g.level.update(dt);
      else { g.player.update(dt, g.level); g.level.update(dt); g.updateCamera(dt); g.updateCompass(dt); }
      g.fx.update(dt); g.rings.update(dt); g.prints.update(dt);
    }
  }, [n, held]);
  const W = async ms => { const t0 = Date.now(); await sim(Math.max(1, Math.round(ms * 0.03))); const rest = ms - (Date.now() - t0); if (rest > 0) await p.waitForTimeout(rest); };
  const kb = { down: async k => { held[KEYS[k]] = true; }, up: async k => { held[KEYS[k]] = false; } };
  const draw = () => p.evaluate(() => { const g = window.game; if (g.level) g.draw(); });
  return { W, kb, draw };
}
