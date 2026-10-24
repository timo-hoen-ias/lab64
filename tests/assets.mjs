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
// Requisiten (src/requisiten.js): Standard-Aufruf = GLB, Farbe färbt um, abweichende Länge = altes Grundkörper-Modell;
// in der Welt landen alle Requisiten in einem einzigen Vertexfarben-Mesh (Level._mergeStatic)
const q = await p.evaluate(async () => {
  const R = await import('./src/requisiten.js'), P = await import('./src/props.js'), A = await import('./src/assets.js');
  const vc = g => { let v = false; g.traverse(o => { if (o.isMesh && o.material.vertexColors) v = true; }); return v; };
  const col = g => { const c = g.children[0].geometry.attributes.color; let r = 0, b = 0; for (let i = 0; i < c.count; i++) { r += c.getX(i); b += c.getZ(i); } return b > r; };
  const pw = R.pinwheel(), fl = R.flagPole(), l = window.game.level;
  let merged = 0; l.group.children.forEach(m => { if (m.isMesh && m.material.vertexColors && m.material.color.getHex() === 0xffffff && m.geometry.attributes.color && m.geometry.attributes.position.count > 5000) merged++; });
  return { glb: A.PROPS.filter(k => vc(R[k]())).length, all: A.PROPS.length, blue: col(R.car(0x0984e3)) && !col(R.car()), fence: !vc(R.fence(9)), spin: !!pw.userData.spin && pw.userData.spin.children.length === 1, wave: !!fl.userData.wave, merged };
});
ok('Requisiten als GLB', q.glb === q.all - 1, `${q.glb}/${q.all} (glowShrooms bleibt Grundkörper)`);
ok('Farbparameter färbt um (blaues Auto)', q.blue);
ok('andere Länge → altes Modell', q.fence);
ok('Windrad dreht, Fahne weht', q.spin && q.wave);
const x = await p.evaluate(async () => {
  const { X } = await import('./src/requisiten.js'), A = await import('./src/assets.js'), sw = X('park/schaukel'), pu = X('dorf/schwengelpumpe');
  return { all: A.EXTRAS.every(k => A.hasAsset('prop-' + k)), n: A.EXTRAS.length, swing: sw.userData.moves.length, body: pu.userData.body.geometry.attributes.position.count > 100 && pu.userData.moves[0].n.name === 'schwengel' };
});
ok('Extra-Requisiten je Welt geladen', x.all, `${x.n}`);
ok('bewegliche Teile (Schaukel 2 Sitze, Pumpenschwengel)', x.swing === 2 && x.body);
ok('Requisiten der Welt zusammengefasst', q.merged >= 1, `${q.merged} Mesh(es)`);
console.log(errs.length ? 'ERR ' + JSON.stringify(errs) : 'ERR []');
console.log(bad ? `${bad} FEHLER` : 'alles ok');
await b.close(); process.exit(bad || errs.length ? 1 : 0);
