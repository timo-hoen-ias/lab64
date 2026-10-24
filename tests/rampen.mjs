// Rampen-Test: Moll läuft jede Rampe und jeden Hügel in jeder Welt hoch und runter und darf an den Übergängen
// Schräge ↔ Ebene nicht hängen bleiben. Dazu ein künstlicher Fall: Rampe auf eine Kiste. Server auf Port 8077.
import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 640, height: 360 } });
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto('http://localhost:8077/index.html'); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(1200);
await p.click('#btnStart'); await p.waitForTimeout(300);

// Läuft Moll in festen Schritten (ohne Echtzeit) von a nach b; liefert, wie weit sie gekommen ist.
await p.evaluate(() => {
  window.__walk = (ax, az, ay, bx, bz) => {
    const g = window.game, pl = g.player, l = g.level, len = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / len, uz = (bz - az) / len;
    g.paused = true; const bounds = l.bounds; l.bounds = { min: { x: -1e9, z: -1e9 }, max: { x: 1e9, z: 1e9 } };
    const cam = { getWorldDirection: v => v.set(ux, 0, uz) }, real = pl.game;
    pl.game = Object.create(real, { camera: { value: cam } });
    pl.pos.set(ax, ay, az); pl.vel.set(0, 0, 0); pl.yaw = Math.atan2(ux, uz); pl.onGround = true; pl.hurtT = 0; pl.stomp = false;
    const mv = real.input.move; mv.x = 0; mv.y = 1;
    let best = 0, still = 0, prog = 0, minY = Infinity;
    for (let i = 0; i < 60 * 12 && prog < len; i++) {
      pl.update(1 / 60, l);
      prog = (pl.pos.x - ax) * ux + (pl.pos.z - az) * uz;
      if (prog > best + 0.01) { best = prog; still = 0; } else if (++still > 30) break;
    }
    mv.y = 0; pl.game = real; l.bounds = bounds;
    return { prog: +prog.toFixed(2), len: +len.toFixed(2), y: +pl.pos.y.toFixed(2), x: +pl.pos.x.toFixed(2), z: +pl.pos.z.toFixed(2) };
  };
});

const fails = [];
const check = (name, r) => { const ok = r.prog >= r.len - 0.05; if (!ok) fails.push(name + ' ' + JSON.stringify(r)); return ok; };

// Künstlich (abseits, auf eigenem Boden): Rampe 0→2 auf eine Kiste, steile Rampe 0→3 auf eine Kiste, Hügel; je hin und zurück
await p.evaluate(() => {
  const l = window.game.level; l.box(3010, -1, 3000, 60, 1, 50, 0x999999);
  l.ramp(3000, 2990, 3008, 2990, 3, 0, 2); l.box(3012, 0, 2990, 8, 2, 6, 0x999999);
  l.ramp(3000, 3000, 3006, 3000, 3, 0, 3); l.box(3010, 0, 3000, 8, 3, 6, 0x999999);
  l.hill(3010, 3010, 5, 2, { flat: 0.3 });
});
for (const [n, a, b] of [['Rampe→Kiste', [2996, 2990, 0], [3015, 2990, 2]], ['steile Rampe→Kiste', [2996, 3000, 0], [3013, 3000, 3]], ['Hügel', [3002, 3010, 0], [3018, 3010, 0]]]) {
  console.log('Kunst', n, 'hin', check(n + ' hin', await p.evaluate(([a, b]) => window.__walk(a[0], a[1], a[2], b[0], b[1]), [a, b])));
  console.log('Kunst', n, 'zurück', check(n + ' zurück', await p.evaluate(([a, b]) => window.__walk(b[0], b[1], b[2], a[0], a[1]), [a, b])));
}
// Kanten über STEP bleiben Wände: Kiste mit 0,6 m ohne Rampe
await p.evaluate(() => window.game.level.box(3010, 0, 3020, 4, 0.6, 6, 0x999999));
const wall = await p.evaluate(() => window.__walk(3000, 3020, 0, 3012, 3020));
console.log('0,6 m Kante bleibt Wand:', wall.x < 3007.6, JSON.stringify(wall)); if (wall.x >= 3007.6) fails.push('0,6 m Kante wird hochgestiegen');

// Alle Welten: jede Rampe der Länge nach (2 m Anlauf/Auslauf), beide Richtungen; Hügel quer drüber
const keys = ['hub', 'kueche', 'strasse', 'buero', 'park', 'strand', 'hafen', 'dorf', 'kanal'];
for (const k of keys) {
  await p.evaluate(k => window.game.enterLevel(k, true), k); await p.waitForTimeout(150);
  const res = await p.evaluate(() => {
    const l = window.game.level, out = [];
    const ground = (x, z, y) => { const g = l.groundAt(x, z, y + 0.6); return g > -Infinity ? g : 0; };
    l.terrain.forEach((t, i) => {
      if (t.kind !== 'ramp') return;
      const x0 = t.x0 - t.ux * 2, z0 = t.z0 - t.uz * 2, x1 = t.x0 + t.ux * (t.len + 2), z1 = t.z0 + t.uz * (t.len + 2);
      const xe = t.x0 + t.ux * t.len, ze = t.z0 + t.uz * t.len;
      // Nur prüfen, wo vor/hinter der Rampe ebener Boden in Rampenhöhe liegt (sonst ist dort eine Wand oder Abgrund gewollt)
      const gA = ground(x0, z0, t.h0), gB = ground(x1, z1, t.h1);
      const name = `Rampe ${i} (${t.x0},${t.z0})→(${xe.toFixed(0)},${ze.toFixed(0)}) ${t.h0}→${t.h1}`;
      if (Math.abs(gA - t.h0) < 0.3 && Math.abs(gB - t.h1) < 0.3) {
        out.push([name + ' hoch', window.__walk(x0, z0, gA, x1, z1)]);
        out.push([name + ' runter', window.__walk(x1, z1, gB, x0, z0)]);
      } else out.push([name + ' übersprungen', { prog: 0, len: 0, gA, gB }]);
    });
    return out;
  });
  for (const [n, r] of res) { const ok = n.endsWith('übersprungen') || check(k + ': ' + n, r); console.log(k, ok ? 'ok ' : 'HÄNGT', n, JSON.stringify(r)); }
}
console.log('FEHLER:', fails.length ? fails : 'keine', 'ERR', errs);
await b.close();
process.exit(fails.length || errs.length ? 1 : 0);
