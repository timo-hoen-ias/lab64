// Spielereien-Test (src/details.js): besucht jede Welt und prüft die versteckten Details – Apfelbaum trillern und Apfel essen,
// Kuckucksuhr anbellen, Uhr tickt, Gartenzwerg kichert, Niesen am Blumenbeet, Bodenklavier („Alle meine Entchen“), Toaster,
// Mülltonnen-Katze, Kuh, Ball, Echo im Kanal. Feste 1/30 s pro Bild. Aufruf: node tests/details.mjs [screenshot-ordner]   Server auf Port 8077.
import { chromium } from 'playwright';
const out = process.argv[2];
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 800, height: 450 } });
const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto('http://localhost:8077/index.html'); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(1200);
await p.click('#btnStart'); await p.waitForTimeout(300);
const ev = (f, a) => p.evaluate(f, a);
await ev(() => { window.game.loop = () => { }; const g = window.game; for (const a of ['trillern','bellen','bauchklatscher','buddeln','apportieren']) g.save.abilities[a] = true; window._sfx = []; const o = g.audio.sfx.bind(g.audio); g.audio.sfx = (n, v, d) => { window._sfx.push(n); return o(n, v, d); }; });
const sim = (n, held = {}, move = [0, 0]) => ev(([n, held, move]) => {
  const g = window.game, i = g.input;
  for (let k = 0; k < n; k++) { Object.assign(i._held, { jump: false, act: false, sniff: false, spin: false, bark: false, up: false, down: false }, held); i.update(); i.move.x = move[0]; i.move.y = move[1];
    g.player.update(1 / 30, g.level); g.level.update(1 / 30); g.updateCamera(1 / 30); g.fx.update(1 / 30); }
}, [n, held, move]);
const press = async (key, n = 1) => { await sim(n, { [key]: true }); await sim(1, {}); };
const tp = (x, y, z, yaw) => ev(([x, y, z, yaw]) => { const pl = window.game.player, l = window.game.level; pl.pos.set(x, y, z); pl.vel.set(0, 0, 0); pl.hurtT = 0; pl.spinCd = 0; pl.barkCd = 0; pl.biteCd = 0; if (yaw != null) pl.yaw = yaw; l.bounds = l.areaAt(x, z); }, [x, y, z, yaw]);
const sfx = () => ev(() => { const s = window._sfx; window._sfx = []; return [...new Set(s)].join(','); });
const shot = async name => { if (!out) return; await ev(() => { const g = window.game; g.renderer.render(g.level.scene, g.camera); }); await p.screenshot({ path: `${out}/${name}.png` }); };
const enter = async k => { await ev(k => window.game.enterLevel(k), k); await sim(10); await sfx(); };
const toast = () => ev(() => document.getElementById('toast').textContent);
const res = {}; const ok = (name, v) => { res[name] = !!v; console.log(`  ${v ? '✓' : '✗'} ${name}`); };
for (const k of ['hub','kueche','strasse','buero','park','strand','hafen','dorf','kanal']) {
  await enter(k);
  const info = await ev(() => { const l = window.game.level; return { sh: l.shakeables.length, ap: l.shakeables.filter(s => s.apples).length, fun: l.funs.length, snd: l.sounds.length, fl: l.flowerBeds.length}; });
  console.log(k, JSON.stringify(info)); ok(`${k}: Details gebaut`, info.fun + info.snd > 0);
}
// Garten: Apfelbaum trillern
await enter('hub');
const t = await ev(() => { const s = window.game.level.shakeables.find(s => s.apples && s.x < 30); return [s.x, s.y, s.z]; });
await tp(t[0] + 3.2, 0.2, t[2]); await sim(3); await press('spin'); await sim(20);
const s1 = await sfx(); ok('Baum raschelt beim Trillern', s1.includes('rustle')); ok('Äpfel fallen', await ev(() => window.game.level.drops.length) > 0);
await shot('baum');
await sim(40);
const d = await ev(() => { const d = window.game.level.drops[0]; return d && [d.x, d.y, d.z, d.rest]; }); ok('Apfel liegt am Boden', d && d[3]);
await ev(() => { window.game.player.hp = 1; });
if (d) { await tp(d[0], d[1], d[2]); await sim(3); }
ok('Apfel essen bringt ein Herz', await ev(() => window.game.player.hp) === 2);
// Uhr anbellen
await tp(0, 0.2, -19, Math.PI); await sim(3); await press('bark'); await sim(15); ok('Kuckucksuhr ruft beim Bellen', (await sfx()).includes('cuckoo')); await shot('uhr');
await sim(40); ok('Uhr tickt', /tick|tock/.test(await sfx()));
await tp(3, 0.2, 10.5, 0); await sim(2); await press('bark'); await sim(10); ok('Gartenzwerg kichert', (await sfx()).includes('giggle'));

// Niesen am Blumenbeet
await tp(-4.5, 0.2, -9.4, Math.PI); await sim(2); await sim(50, { sniff: true }); ok('Niesen am Blumenbeet', (await sfx()).includes('sneeze'));
// Erdgeschoss: Klavier
await enter('kueche');
for (const i of [0,1,2,3,4]) { await tp(-50 + i * 1.25, 0.1, -8.5); await sim(4); }
await ev(() => window.game.player.vel.y = 6); await sim(20); await tp(-50 + 5, 0.1, -8.5); await sim(4);
ok('Alle meine Entchen holt die Ente', (await sfx()).includes('quack')); await shot('klavier');
await tp(-15, 0.1, -14.5, Math.PI); await sim(2); await press('act'); await sim(10); ok('Toaster springt', (await sfx()).includes('boing')); await shot('toast');
await enter('strasse'); await tp(-10, 0.6, 4, Math.PI); await sim(2); await press('bark'); await sim(20); ok('Katze in der Mülltonne', (await sfx()).includes('meow')); await shot('tonne');
await enter('dorf'); await tp(86, 0.2, -34, Math.PI); await sim(2); await press('bark'); await sim(20); ok('Kuh muht', (await sfx()).includes('moo')); await shot('kuh');
await enter('park'); await tp(-18, 0.2, 23.4, Math.PI); await sim(30); ok('Ball rollt weg', await ev(() => { const f = window.game.level.funs.find(f => f.nearR); return Math.hypot(f.x + 18, f.z - 22) > 1; }));
await enter('kanal'); await tp(-12, 1.2, 0, 0); await press('bark'); await sim(30); ok('Echo im Kanal', await ev(() => window.game.level.echo));
console.log('Fehler:', errs.slice(0, 10));
await b.close();
process.exit(errs.length || Object.values(res).some(v => !v) ? 1 : 0);
