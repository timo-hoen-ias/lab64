// GLB-Modelle (src/assets.js): alle laden, Autos in der Einkaufsstraße stehen als Modell mit Kollision, Dach-Essen liegt obenauf.
import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 480, height: 270 } });
const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'warning' && m.text().startsWith('Modell fehlt')) errs.push(m.text()); });
await p.goto('http://localhost:8077/index.html'); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(1500);
await p.evaluate(() => window.game.intro.skip()); await p.click('#btnStart');
await p.evaluate(() => { window.game.dialog.auto = true; window.game.enterLevel('strasse'); }); await p.waitForTimeout(800);
let bad = 0; const ok = (name, v, info = '') => { console.log(`  ${v ? 'ok ' : 'FEHLT'} ${name} ${info}`); if (!v) bad++; };
const r = await p.evaluate(async () => {
  const A = await import('./src/assets.js'), l = window.game.level, found = {};
  l.group.traverse(o => { if (o.userData.asset) found[o.userData.asset] = (found[o.userData.asset] || 0) + 1; });
  l.zones.forEach(z => z.group.traverse(o => { if (o.userData.asset) found[o.userData.asset] = (found[o.userData.asset] || 0) + 1; }));
  const roofFood = l.pickups.filter(q => q.goal && Math.abs(q.x) === 4).map(q => [q.x, +q.y.toFixed(2), q.z, +l.groundAt(q.x, q.z, q.y + 0.5).toFixed(2)]);
  return { loaded: Object.keys(A.ASSETS).filter(A.hasAsset), all: Object.keys(A.ASSETS), found, roofFood };
});
ok('alle Modelle geladen', r.loaded.length === r.all.length, `${r.loaded.length}/${r.all.length}`);
for (const k of ['auto-rot', 'auto-blau', 'auto-gelb', 'lieferwagen', 'police']) ok(`${k} in der Straße`, r.found[k] >= 1);
ok('Essen liegt auf den Autodächern', r.roofFood.length === 2 && r.roofFood.every(([x, y, z, top]) => top > 2 && y > top && y - top < 0.6), JSON.stringify(r.roofFood));
// Auf ein Dach springen: Moll landet oben (Kollision aus Unterbau + Fahrgastzelle)
await p.evaluate(() => { const pl = window.game.player; pl.pos.set(-4, 6, -20); pl.vel.set(0, 0, 0); }); await p.waitForTimeout(1200);
const y = await p.evaluate(() => window.game.player.pos.y);
ok('Moll steht auf dem roten Auto', y > 2, y.toFixed(2));
console.log(errs.length ? 'ERR ' + JSON.stringify(errs) : 'ERR []');
console.log(bad ? `${bad} FEHLER` : 'alles ok');
await b.close(); process.exit(bad || errs.length ? 1 : 0);
