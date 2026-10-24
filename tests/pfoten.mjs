// Pfoten-Test: Untergründe in allen Welten (surfaceAt), Schrittgeräusche im Takt von Trab und Galopp, Absprung und Landung je Untergrund.
// Aufruf: node tests/pfoten.mjs   Server auf Port 8077.
import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 800, height: 450 } });
const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto('http://localhost:8077/index.html'); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(1200);
await p.evaluate(() => window.game.intro.skip()); await p.click('#btnStart'); await p.waitForTimeout(300);
const ev = (f, a) => p.evaluate(f, a);
// Spielschleife anhalten, Geräusch-Aufrufe mitschreiben (die Töne selbst laufen weiter)
await ev(() => {
  const g = window.game, a = g.audio; g.loop = () => { }; g.dialog.auto = true; window.log = [];
  for (const k of ['step', 'jumpOff', 'landOn']) { const f = a[k].bind(a); a[k] = (...x) => { window.log.push([k, ...x]); f(...x); }; }
});
const sim = (n, held = {}, move = [0, 0]) => ev(([n, held, move]) => {
  const g = window.game, i = g.input;
  for (let k = 0; k < n; k++) {
    Object.assign(i._held, { jump: false, act: false, sniff: false, spin: false, bark: false, up: false, down: false }, held); i.update(); i.move.x = move[0]; i.move.y = move[1];
    g.player.update(1 / 30, g.level); g.level.update(1 / 30); g.updateCamera(1 / 30);
  }
}, [n, held, move]);
const tp = (x, y, z) => ev(([x, y, z]) => { const pl = window.game.player, l = window.game.level; pl.pos.set(x, y, z); pl.vel.set(0, 0, 0); pl.hurtT = 0; l.bounds = l.areaAt(x, z); window.game.camYaw = Math.PI; window.game.snapCam = true; }, [x, y, z]);
const log = () => ev(() => { const l = window.log; window.log = []; return l; });
let fail = 0; const check = (name, ok, info = '') => { console.log(ok ? '  ok ' : '  FEHLER', name, info); if (!ok) fail++; };

// ---- Untergründe an bekannten Stellen
const SPOTS = {
  hub: [[15, 0, 5, 'grass'], [0, 0, 0.8, 'stone'], [3, 0, -19, 'wood'], [0, 0, -17, 'carpet'], [0, -0.5, 20, 'water'], [2000, 0, 0, 'wood']],
  kueche: [[0, 0, 12, 'tile'], [-40, 0, 10, 'carpet'], [2000, 0, 0, 'stone']],
  strasse: [[0, 0, 0, 'stone'], [2000, 0, 0, 'tile']],
  buero: [[0, 0, 0, 'carpet']],
  park: [[0, 0, 30, 'grass'], [2000, 0, 0, 'dirt']],
  hafen: [[60, 6.4, 92, 'metal'], [3300, 0, 0, 'metal']],
  kanal: [[2000, 0, 0, 'dirt']],
  dorf: [[2300, 0, 0, 'tile'], [2000, 0, 0, 'wood']],
};
for (const [key, spots] of Object.entries(SPOTS)) {
  await ev(k => window.game.enterLevel(k, true), key); await sim(2);
  const got = await ev(s => s.map(([x, y, z]) => { const l = window.game.level; l.bounds = l.areaAt(x, z); const top = l.groundAt(x, z, y + 0.2); return l.surfaceAt(x, Number.isFinite(top) ? Math.max(top, y) : y, z); }), spots);
  spots.forEach(([x, y, z, want], i) => check(`${key} (${x}|${z}) = ${want}`, got[i] === want, got[i] !== want ? `→ ${got[i]}` : ''));
}
// Jede Welt: Untergrund am Startpunkt (nur Ausgabe)
for (const key of ['hub', 'kueche', 'strasse', 'buero', 'park', 'strand', 'hafen', 'dorf', 'kanal']) {
  await ev(k => window.game.enterLevel(k, true), key); await sim(15);
  console.log(`  ${key}: Start auf`, await ev(() => { const g = window.game, q = g.player.pos; return g.level.surfaceAt(q.x, q.y, q.z); }), '· geratene Flächen:', await ev(() => window.game.level.patches.length));
}

// ---- Schritte im Takt: Trab (halber Stick) und Galopp (voll) auf der Gartenwiese
await ev(() => window.game.enterLevel('hub', true)); await sim(5);
await tp(20, 0.1, -10); await sim(10); await log();
await sim(60, {}, [0, 0.45]); const trot = (await log()).filter(e => e[0] === 'step');
await tp(20, 0.1, -10); await sim(10); await log();
await sim(60, {}, [0, 1]); const gallop = (await log()).filter(e => e[0] === 'step');
console.log(`  Trab: ${trot.length} Pfoten in 2 s, Galopp: ${gallop.length} Pfoten in 2 s`);
check('Trab macht Schritte auf Gras', trot.length >= 6 && trot.every(e => e[1] === 'grass'));
check('Galopp macht Schritte auf Gras', gallop.length >= 10 && gallop.every(e => e[1] === 'grass'));
check('Vorder- und Hinterpfoten', gallop.some(e => e[3]) && gallop.some(e => !e[3]));
await tp(20, 0.1, -10); await sim(10); await log(); await sim(30); check('Stillstehen ist leise', (await log()).length === 0);

// ---- Sprung und Landung: Wiese, Holzboden im Haus, Küchenfliesen
for (const [key, x, z, want] of [['hub', 20, -10, 'grass'], ['hub', 3, -19, 'wood'], ['kueche', 0, 12, 'tile']]) {
  await ev(k => window.game.enterLevel(k, true), key); await sim(3); await tp(x, 0.3, z); await sim(15); await log();
  await sim(2, { jump: true }); await sim(40); const L = await log();
  const j = L.find(e => e[0] === 'jumpOff'), l = L.find(e => e[0] === 'landOn');
  check(`${key}: Absprung + Landung auf ${want}`, j?.[1] === want && l?.[1] === want, JSON.stringify([j, l]));
}
// Tiefer Sturz = kräftigere Landung
await tp(20, 8, -10); await sim(50); const fall = (await log()).find(e => e[0] === 'landOn'); check('Sturz aus 8 m landet hart', fall && fall[2] > 15, JSON.stringify(fall));
// Effekte-Regler auf 0: keine Pfotengeräusche mehr geplant
const muted = await ev(() => { const a = window.game.audio; a.setVolume(1, 0); const n = a.ctx ? 1 : 0; const r = a._pawsOff(); a.setVolume(1, 1); return [n, r]; });
check('Effekte aus = Pfoten stumm', muted[1] === true);
console.log('ERR', errs); console.log(fail ? `${fail} FEHLER` : 'alles ok'); await b.close(); process.exit(fail || errs.length ? 1 : 0);
