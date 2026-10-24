// Nischen-Test: Moll rennt, springt und fällt mit grobem Zeitschritt (dt 0,05 wie bei Ruckeln) durch einen Parcours
// aus dünnen Wänden, engen Spalten und Ecken. Sie darf nie in einem Körper stecken oder durch eine Wand/Platte rutschen.
// Server auf Port 8077.
import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 640, height: 360 } });
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto('http://localhost:8077/index.html'); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(1200);
await p.click('#btnStart'); await p.waitForTimeout(300);

const res = await p.evaluate(() => {
  const g = window.game, pl = g.player, l = g.level, real = pl.game, mv = real.input.move;
  g.paused = true; l.bounds = { min: { x: -1e9, z: -1e9 }, max: { x: 1e9, z: 1e9 } };
  // Zufall mit festem Startwert, damit Fehler reproduzierbar sind
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const X = 4000, Z = 4000, start = l.solids.length;
  l.box(X, -1, Z, 60, 1, 60, 0x999999);                     // Boden
  [[-30, 0], [30, 0], [0, -30], [0, 30]].forEach(([dx, dz]) => l.box(X + dx, 0, Z + dz, dx ? 0.4 : 60, 25, dz ? 0.4 : 60, 0x777777)); // Rand (hoch genug, dass man nicht drüberspringt)
  for (let i = 0; i < 70; i++) { // dünne Wände, Pfosten, enge Spalten
    const thin = rnd() < 0.5, w = thin ? 0.15 + rnd() * 0.25 : 0.5 + rnd() * 3, d = thin ? 1 + rnd() * 5 : 0.5 + rnd() * 3;
    const sw = rnd() < 0.5; l.box(X - 26 + rnd() * 52, rnd() < 0.2 ? 0.9 + rnd() : 0, Z - 26 + rnd() * 52, sw ? w : d, 0.3 + rnd() * 3, sw ? d : w, 0x888888);
  }
  for (let i = 0; i < 12; i++) { const x = X - 20 + rnd() * 40, z = Z - 20 + rnd() * 40, gap = 0.86 + rnd() * 0.3; // U-Nischen knapp so breit wie Moll
    l.box(x - gap / 2 - 0.2, 0, z, 0.4, 2.5, 3, 0x666666); l.box(x + gap / 2 + 0.2, 0, z, 0.4, 2.5, 3, 0x666666); l.box(x, 0, z + 1.7, gap + 0.8, 2.5, 0.4, 0x666666); }
  for (let i = 0; i < 10; i++) l.box(X - 24 + rnd() * 48, 3 + rnd() * 6, Z - 24 + rnd() * 48, 2 + rnd() * 4, 0.2, 2 + rnd() * 4, 0xaaaaaa); // dünne Platten in der Luft
  const mine = l.solids.slice(start);
  const inside = () => { const q = pl.pos, H = 0.42, e = 0.03; return mine.find(s => q.x + H > s.min.x + e && q.x - H < s.max.x - e && q.z + H > s.min.z + e && q.z - H < s.max.z - e && q.y + 1.15 > s.min.y + e && q.y < s.max.y - e); };
  const cam = { getWorldDirection: v => v.set(0, 0, 1) }; pl.game = Object.create(real, { camera: { value: cam } });
  let pressJump = false; const inp = real.input, pressed0 = inp.pressed.bind(inp), held0 = inp.held.bind(inp);
  inp.pressed = k => k === 'jump' ? pressJump : false; inp.held = k => k === 'jump' ? pressJump : false;
  const out = []; let t = 0, ang = 0;
  for (let run = 0; run < 40 && out.length < 5; run++) {
    // Start an freier Stelle
    for (let k = 0; k < 50; k++) { pl.pos.set(X - 25 + rnd() * 50, 0, Z - 25 + rnd() * 50); if (!inside()) break; }
    pl.vel.set(0, 0, 0); pl.onGround = true; pl.hurtT = 0; pl.zoomT = 0;
    for (let f = 0; f < 400; f++, t++) {
      if (f % 25 === 0) ang = rnd() * Math.PI * 2;
      mv.x = Math.sin(ang); mv.y = Math.cos(ang); pressJump = rnd() < 0.04;
      if (f % 150 === 149) { pl.pos.y += 12; pl.vel.y = -30; } // tiefer Fall auf Platten/Kanten
      const before = pl.pos.clone(); pl.update(0.05, l);
      const s = inside(); if (s) { out.push({ run, f, von: before.toArray().map(v => +v.toFixed(2)), nach: pl.pos.toArray().map(v => +v.toFixed(2)), box: [s.min, s.max] }); break; }
      if (pl.pos.y < -0.5) { out.push({ run, f, durchgefallen: pl.pos.toArray().map(v => +v.toFixed(2)) }); break; }
    }
  }
  mv.x = mv.y = 0; inp.pressed = pressed0; inp.held = held0; pl.game = real;
  return { frames: t, fehler: out };
});
console.log('Frames:', res.frames, 'Fehler:', res.fehler.length ? JSON.stringify(res.fehler, null, 0) : 'keine', 'ERR', errs);
await b.close();
process.exit(res.fehler.length || errs.length ? 1 : 0);
