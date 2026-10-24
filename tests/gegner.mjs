// Gegner-Test: jede Welt hat viele kleine Gegner; Biss, Trillern, Bellen und Bauchklatscher besiegen sie, gepanzerte erst
// umdrehen, Flieger stoßen herab, Maulwürfe schießen aus dem Boden, Gegner treffen Moll, Leckerli heilen. Feste 1/30 s pro Bild.
// Aufruf: node tests/gegner.mjs [screenshot-ordner]   Server auf Port 8077.
import { chromium } from 'playwright';
const out = process.argv[2];
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 800, height: 450 } });
const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto('http://localhost:8077/index.html'); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(1200);
await p.click('#btnStart'); await p.waitForTimeout(300);
const ev = (f, a) => p.evaluate(f, a);
await ev(() => { window.game.loop = () => { }; });
const sim = (n, held = {}) => ev(([n, held]) => {
  const g = window.game, i = g.input;
  for (let k = 0; k < n; k++) { Object.assign(i._held, { jump: false, act: false, sniff: false, spin: false, bark: false }, held); i.update(); i.move.x = 0; i.move.y = 0; g.player.update(1 / 30, g.level); g.level.update(1 / 30); g.updateCamera(1 / 30); g.fx.update(1 / 30); }
}, [n, held]);
const press = async key => { await sim(1, { [key]: true }); await sim(1); };
const enter = async k => { await ev(k => window.game.enterLevel(k), k); await sim(10); };
const setAb = (a, on = true) => ev(([a, on]) => { window.game.save.abilities[a] = on; }, [a, on]);
// Moll vor einen Gegner der Art stellen (schaut ihn an); gibt den Index zurück
const meet = (kind, dist = 1.2) => ev(([kind, dist]) => {
  const l = window.game.level, pl = window.game.player, i = l.foes.findIndex(f => f.kind === kind && !f.dead); if (i < 0) return -1;
  const f = l.foes[i], q = f.mesh.position; pl.pos.set(q.x, f.home.y + 0.05, q.z - dist); pl.vel.set(0, 0, 0); pl.yaw = 0; pl.hurtT = 9; pl.hp = 3; pl.biteCd = 0; pl.spinCd = 0; pl.barkCd = 0; pl.onGround = true;
  l.bounds = l.areaAt(q.x, q.z); window.game.snapCam = true; return i;
}, [kind, dist]);
const foe = i => ev(i => { const f = window.game.level.foes[i]; return { dead: f.dead, flip: f.flip > 0, stun: f.stun > 0, state: f.state, y: +(f.mesh.position.y - f.home.y).toFixed(1) }; }, i);
const res = {};

// ---- Anzahl je Welt
const counts = {};
for (const k of ['hub', 'kueche', 'strasse', 'buero', 'park', 'strand', 'hafen', 'dorf', 'kanal']) { await enter(k); counts[k] = await ev(() => window.game.level.foes.length); }
console.log('  Gegner je Welt:', JSON.stringify(counts)); res.viele = Object.values(counts).every(n => n >= 12) && Object.values(counts).reduce((a, c) => a + c, 0) >= 200;

// ---- Erdgeschoss: Wollmaus beißen, Kakerlake erst trillern, dann beißen
await enter('kueche'); await setAb('trillern'); await setAb('bellen');
let i = await meet('wollmaus'); await press('act'); res.biss = (await foe(i)).dead; console.log('  Wollmaus gebissen:', res.biss);
const crumbs0 = await ev(() => window.game.save.crumbs);
i = await meet('wollmaus', 1.5); await press('spin'); await sim(4); res.trillern = (await foe(i)).dead; console.log('  Wollmaus weggetrillert:', res.trillern);
res.kruemel = await ev(c => window.game.save.crumbs > c, crumbs0);
await sim(25); i = await meet('kakerlake'); await press('act'); const k1 = await foe(i);
await sim(15); await ev(() => { window.game.player.spinCd = 0; }); await press('spin'); await sim(3); const k2 = await foe(i);
await ev(() => { window.game.player.biteCd = 0; }); await meet('kakerlake'); await press('act'); const k3 = await foe(i);
res.panzer = !k1.dead && k2.flip && !k2.dead && k3.dead; console.log('  Kakerlake: Biss prallt ab', !k1.dead, '→ Trillern dreht um', k2.flip, '→ Biss besiegt', k3.dead);
// Bellen: benommen, dann beißen
i = await meet('wollmaus', 3); await press('bark'); const bk = await foe(i); await ev(() => { window.game.player.biteCd = 0; }); await meet('wollmaus'); await press('act');
res.bellen = bk.stun && (await foe(i)).dead; console.log('  Wollmaus angebellt (benommen', bk.stun, ') und gebissen:', res.bellen);
// Angriff: Gegner trifft Moll, Leckerli heilt
i = await meet('wollmaus', 4); await ev(() => { window.game.player.hurtT = 0; }); await sim(70); const hp = await ev(() => window.game.player.hp);
res.angriff = hp < 3; console.log('  Wollmaus greift an, Herzen:', hp);
i = await meet('wollmaus'); await ev(() => { window.game.player.hp = 1; Math.random = () => 0.1; }); await press('act'); await sim(30);
const drop = await ev(() => { const t = window.game.level.enemies.find(e => e.isDrop && !e.dead); return t && [t.mesh.position.x, t.mesh.position.y, t.mesh.position.z]; });
if (drop) await ev(([x, y, z]) => { window.game.player.pos.set(x, y - 0.3, z); }, drop); await sim(5);
res.heilen = !!drop && await ev(() => window.game.player.hp === 2); console.log('  Leckerli fällt:', !!drop, '→ heilt:', res.heilen);
// Flieger stößt herab und ist dann beißbar
i = await meet('fliege', 4); await ev(i => { const f = window.game.level.foes[i]; f.cool = 0; f.state = 'stalk'; f.timer = 0.01; }, i); await ev(() => { window.game.player.hurtT = 9; });
let low = false; for (let k = 0; k < 40 && !low; k++) { await sim(1); const s = await foe(i); low = s.state === 'rest'; }
const fq = await ev(i => { const f = window.game.level.foes[i], q = f.mesh.position; return [q.x, q.y, q.z]; }, i);
await ev(([x, y, z]) => { const pl = window.game.player; pl.pos.set(x, y - 0.6, z - 1.2); pl.yaw = 0; pl.biteCd = 0; }, fq); await press('act');
res.flieger = low && (await foe(i)).dead; console.log('  Fliege stößt herab:', low, '→ gebissen:', res.flieger);
if (out) { await ev(() => { const g = window.game; g.renderer.render(g.level.scene, g.camera); }); await p.screenshot({ path: `${out}/gegner_kueche.png` }); }

// ---- Grillpark: Maulwurf schießt aus dem Boden, Bauchklatscher; Frösche hüpfen
await enter('park'); await setAb('bauchklatscher');
i = await meet('maulwurf', 4); const m0 = await foe(i); await ev(() => { window.game.player.hurtT = 9; }); await sim(20); const m1 = await foe(i);
await meet('maulwurf'); await ev(() => { window.game.player.biteCd = 0; }); await press('act');
res.maulwurf = m0.state === 'under' && m1.state !== 'under' && (await foe(i)).dead; console.log('  Maulwurf: versteckt', m0.state, '→ taucht auf', m1.state, '→ gebissen', res.maulwurf);
i = await meet('frosch', 6); await ev(() => { window.game.player.hurtT = 9; }); let hopped = false; for (let k = 0; k < 20 && !hopped; k++) { await sim(3); hopped = await ev(i => window.game.level.foes[i].air, i); }
await ev(i => window.game.level.onStomp(window.game.level.foes[i].mesh.position.clone()), i); res.frosch = hopped && (await foe(i)).dead; console.log('  Frosch hüpft:', hopped, '→ Bauchklatscher:', res.frosch);

// ---- Hochhaus: Gegner auch auf oberen Etagen
await enter('buero'); res.etagen = await ev(() => new Set(window.game.level.foes.map(f => Math.round(f.home.y / 12))).size >= 3); console.log('  Gegner auf Etagen im Hochhaus:', res.etagen);

const bad = Object.entries(res).filter(([, v]) => !v).map(([k]) => k);
console.log(bad.length ? `FEHLGESCHLAGEN: ${bad.join(', ')}` : `ALLE ${Object.keys(res).length} PROBEN OK`);
console.log('ERR', JSON.stringify(errs)); await b.close();
