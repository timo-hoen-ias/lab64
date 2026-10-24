// Fähigkeiten-Test: lernt jede Fähigkeit bei Opa Bruno und spielt sie Bild für Bild durch (feste 1/30 s, unabhängig von der
// Rechnergeschwindigkeit): Apportieren, Laden, Trillern, Bellen, Bauchklatscher, Buddeln, Zoomies, Gleiten, Wandsprung, Tornado.
// Jede Probe läuft einmal MIT und – wo es geht – einmal OHNE die Fähigkeit, damit klar ist, dass die Stelle sie wirklich braucht.
// Aufruf: node tests/abilities.mjs [screenshot-ordner]   Server auf Port 8077.
import { chromium } from 'playwright';
const out = process.argv[2];
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 800, height: 450 } });
const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto('http://localhost:8077/index.html'); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(1200);
await p.evaluate(() => window.game.intro.skip()); await p.click('#btnStart'); await p.waitForTimeout(300);
const ev = (f, a) => p.evaluate(f, a);
await ev(() => { window.game.loop = () => { }; window.game.dialog.auto = true; }); // eigene Spielschleife anhalten, ab hier steuert der Test jedes Bild
// n Bilder simulieren; held = gedrückte Tasten, move = Stick (x rechts, y vor), relativ zur Kamera
const sim = (n, held = {}, move = [0, 0]) => ev(([n, held, move]) => {
  const g = window.game, i = g.input;
  for (let k = 0; k < n; k++) {
    Object.assign(i._held, { jump: false, act: false, sniff: false, spin: false, bark: false, up: false, down: false }, held); i.update(); i.move.x = move[0]; i.move.y = move[1];
    if (g.shopOpen) { g._shopInput(); continue; }
    g.player.update(1 / 30, g.level); g.level.update(1 / 30); g.updateCamera(1 / 30); g.fx.update(1 / 30);
  }
}, [n, held, move]);
const press = async (key, n = 1, move) => { await sim(n, { [key]: true }, move); await sim(1, {}, move); };
const tp = (x, y, z, yaw) => ev(([x, y, z, yaw]) => { const pl = window.game.player, l = window.game.level; pl.pos.set(x, y, z); pl.vel.set(0, 0, 0); pl.hurtT = 0; pl.hp = 3; pl.spinCd = 0; pl.barkCd = 0; pl.biteCd = 0; if (yaw !== undefined && yaw !== null) pl.yaw = yaw; l.bounds = l.areaAt(x, z); window.game.snapCam = true; }, [x, y, z, yaw]);
const cam = yaw => ev(y => { window.game.camYaw = y; window.game.snapCam = true; }, yaw); // camYaw = PI: Stick vor läuft nach +z, camYaw = 0: nach −z
const pos = () => ev(() => { const q = window.game.player.pos; return [q.x, q.y, q.z].map(v => +v.toFixed(1)); });
const shot = async name => { if (!out) return; await ev(() => { const g = window.game; document.getElementById('toast').classList.remove('show'); document.getElementById('learn').classList.remove('show'); g.renderer.render(g.level.scene, g.camera); }); await p.screenshot({ path: `${out}/${name}.png` }); };
const enter = async k => { await ev(k => window.game.enterLevel(k), k); await sim(10); };
const setAb = (a, on) => ev(([a, on]) => { window.game.save.abilities[a] = on; }, [a, on]);
const learnAt = async () => { const br = await ev(() => { const b = window.game.level.bruno; return [b.x, b.y, b.z, b.ability]; }); await tp(br[0] + 2.5, br[1] + 0.2, br[2]); await sim(6); const ok = await ev(a => window.game.has(a), br[3]); console.log(`  Opa Bruno bringt ${br[3]} bei:`, ok, '| Karte:', await ev(() => document.getElementById('learn').classList.contains('show'))); return ok; };
const boneHere = id => ev(id => window.game.hasBone(window.game.level.key, id), id);
const grab = async id => { const q = await ev(id => { const q = window.game.level.pickups.find(q => q.boneId === id && !q.taken && !q.buried); return q && [q.x, q.y, q.z]; }, id); if (q) { await tp(q[0], q[1] - 0.5, q[2]); await sim(8); } return boneHere(id); };
const exists = id => ev(id => window.game.level.pickups.some(q => q.boneId === id && !q.buried), id);
const res = {};

// ---- Garten: Apportieren + Laden
await enter('hub'); res.apportieren = await learnAt(); await shot('ab_bruno_garten');
await tp(7, 0.2, 7.6, 0); await sim(3); await press('act'); res.ball = await ev(() => !!window.game.player.carry);
await tp(-13, 0.2, 13.4, Math.PI); await sim(3); await press('act'); await sim(3);
res.apport = await grab('apport'); console.log('  Ball im Maul:', res.ball, '→ abgegeben, Goldknochen:', res.apport);
await ev(() => { window.game.save.crumbs = 500; }); await tp(-9, 0.2, 11.2, Math.PI); await sim(3); await press('act');
console.log('  Laden offen:', await ev(() => window.game.shopOpen)); await shot('ab_laden');
await press('jump'); for (let i = 0; i < 4; i++) await press('down'); await press('jump');
res.laden = await ev(() => window.game.maxHp() === 4 && window.game.has('supernase') && window.game.save.crumbs === 230);
await press('act'); console.log('  4. Herz + Supernase gekauft, Krümel übrig:', await ev(() => window.game.save.crumbs), res.laden, '| Laden zu:', !(await ev(() => window.game.shopOpen)));

// ---- Erdgeschoss: Trillern
await enter('kueche'); res.trillern = await learnAt();
await setAb('trillern', false); await tp(6, 0.2, -10.6, Math.PI); await sim(3); await press('spin'); await sim(20);
const herdOhne = await ev(() => window.game.level.herd); await setAb('trillern', true);
await tp(6, 0.2, -10.6, Math.PI); await sim(3); await press('spin'); await sim(20); await shot('ab_trillern_herd');
console.log('  Herdknöpfe ohne/mit Trillern:', herdOhne, await ev(() => window.game.level.herd));
res.trillernKnochen = herdOhne === 0 && await grab('trillern'); console.log('  Goldknochen Trillern:', res.trillernKnochen);
const ants = () => ev(() => window.game.level.enemies.filter(e => e.ants && !e.dead).length);
const a0 = await ants(); await tp(-14, 0.2, -47.2, Math.PI); await press('act'); await sim(15); const a1 = await ants(); await tp(-14, 0.2, -47.2, Math.PI); await press('spin'); await sim(15);
res.ameisen = a1 === a0 && (await ants()) === a0 - 1; console.log('  Ameisen: Biss hilft nicht, Trillern schon:', res.ameisen);
await ev(() => { const l = window.game.level; l.goal.have = l.goal.need; l.checkGoal(); }); await p.waitForTimeout(1500);
await ev(() => { const b = window.game.level.boss, pl = window.game.player; b.state = 'hunt'; b.stun = 0; pl.pos.set(b.pos.x + 3, 0.2, b.pos.z); pl.hurtT = 5; pl.spinCd = 0; }); await press('spin'); await sim(2);
res.sauger = await ev(() => window.game.level.boss.stun > 0); console.log('  Staubsauger benommen durch Trillern:', res.sauger);

// ---- Einkaufsstraße: Bellen
await enter('strasse'); res.bellen = await learnAt();
for (const [x, z] of [[-4, -2], [4, 12], [-4, -20]]) { await tp(x, 0.2, z + 6.5, Math.PI); await sim(3); await press('bark'); await sim(25); }
console.log('  Alarmanlagen:', await ev(() => window.game.level.alarms)); await shot('ab_bellen');
res.bellenKnochen = await grab('bellen'); console.log('  Goldknochen Bellen:', res.bellenKnochen);
const pig = () => ev(() => window.game.level.enemies.filter(e => e.home && e.y0 !== undefined && !e.dead).length);
const pg0 = await pig(); await ev(() => { const e = window.game.level.enemies.find(e => e.y0 !== undefined && !e.dead), pl = window.game.player; pl.pos.set(e.mesh.position.x, 0.6, e.mesh.position.z + 5); pl.yaw = Math.PI; pl.barkCd = 0; pl.hurtT = 5; }); await press('bark'); await sim(2);
res.tauben = (await pig()) === pg0 - 1; console.log('  Taube weggebellt:', res.tauben);

// ---- Hochhaus: Bauchklatscher
await enter('buero'); res.bauchklatscher = await learnAt();
await setAb('bauchklatscher', false); await tp(-10, 3, 24); await sim(4); await press('act'); await sim(30); const knOhne = await ev(() => window.game.level.knoepfe); await setAb('bauchklatscher', true);
for (const [x, z] of [[-10, 24], [8, 27], [-22, 6]]) { await tp(x, 3, z); await sim(4); await press('act'); await sim(30); }
console.log('  Knöpfe ohne/mit Bauchklatscher:', knOhne, await ev(() => window.game.level.knoepfe));
res.stampfen = knOhne === 0 && await grab('stampfen'); console.log('  Goldknochen Bauchklatscher:', res.stampfen);
await tp(24, 4.5, -2); await sim(4); await press('act'); await sim(30);
res.kiste = await ev(() => window.game.level.crates.find(c => c.x === 24).broken); console.log('  Karton zerbrochen:', res.kiste); await shot('ab_bauchklatscher');
await ev(() => { const l = window.game.level; l.goal.have = l.goal.need; l.checkGoal(); }); await p.waitForTimeout(1500);
await ev(() => { const b = window.game.level.boss, pl = window.game.player; b.state = 'hover'; b.stun = 0; pl.pos.set(b.pos.x + 2, 3.5, b.pos.z); pl.vel.set(0, 0, 0); pl.hurtT = 5; }); await sim(6); await press('act'); await sim(25);
res.dosenoeffner = await ev(() => window.game.level.boss.stun > 0); console.log('  Dosenöffner umgehauen:', res.dosenoeffner);

// ---- Grillpark: Buddeln + Zoomies
await enter('park'); res.buddeln = await learnAt();
await setAb('buddeln', false); await tp(-70, 0.2, -31.5, 0); await sim(3); await press('act'); await sim(10); const digOhne = await exists('buddeln'); await setAb('buddeln', true);
await tp(-70, 0.2, -31.5, 0); await sim(3); await press('act'); await sim(10); await shot('ab_buddeln');
res.buddelKnochen = !digOhne && await grab('buddeln'); console.log('  Goldknochen ausgebuddelt (vorher unsichtbar:', !digOhne, '):', res.buddelKnochen);
await ev(() => window.game.learn('zoomies')); await tp(-20, 0.2, 30, Math.PI / 2); await cam(-Math.PI / 2); await sim(2);
await sim(45, {}, [0, 1]); const zs = await ev(() => Math.hypot(window.game.player.vel.x, window.game.player.vel.z));
res.zoomies = zs > 12; console.log('  Zoomies-Tempo:', zs.toFixed(1), 'm/s', res.zoomies);

// ---- Hafen: Gleiten vom Ausguck zum Möwennest
const glideRun = async () => {
  await tp(13.5, 10.2, 25.4, 0); await cam(Math.PI); await sim(3);
  const f = [0, 1]; await sim(6, { jump: true }, f); await sim(4, {}, f); await sim(3, { jump: true }, f); await sim(4, {}, f);
  for (let i = 0; i < 110; i++) { await sim(1, { spin: true }, f); if (await ev(() => window.game.player.onGround || window.game.player.swimming)) break; }
  await sim(10); return pos();
};
await enter('hafen'); res.gleiten = await learnAt();
await setAb('gleiten', false); const without = await glideRun(); const gleitOhne = await ev(() => window.game.hasBone('hafen', 'gleiten')); await setAb('gleiten', true); const withG = await glideRun(); await shot('ab_gleiten');
console.log('  ohne Gleiten landet Moll bei', without, '| mit Gleiten bei', withG);
res.gleitWeit = without[2] < 42 && withG[2] > 42; res.gleitKnochen = !gleitOhne && await ev(() => window.game.hasBone('hafen', 'gleiten'));
console.log('  weiter geflogen als ohne:', res.gleitWeit, '| Goldknochen:', res.gleitKnochen);
await ev(() => { const l = window.game.level; l.goal.have = l.goal.need; l.checkGoal(); }); await p.waitForTimeout(2200);
await ev(() => { const b = window.game.level.boss, pl = window.game.player; b.stun = 0; b.state = 'circle'; pl.pos.set(b.pos.x, b.pos.y - 1, b.pos.z); pl.vel.set(0, 2, 0); pl.hurtT = 5; pl.spinCd = 0; pl.onGround = false; }); await press('spin'); await sim(2);
res.moewe = await ev(() => window.game.level.boss.stun > 0); console.log('  Möwe aus der Luft geholt:', res.moewe);

// ---- Dorf: Wandsprung im Schornstein (zwischen zwei Backsteinwänden)
const chimney = async () => {
  await tp(-14.4, 0.2, 14, 0); await cam(Math.PI); await sim(3); await press('jump', 3); let top = 0;
  for (let i = 0; i < 260; i++) {
    const s = await ev(() => { const pl = window.game.player; return { near: !!pl._wallNear(window.game.level), y: pl.pos.y, vy: pl.vel.y, vx: pl.vel.x, g: pl.onGround }; });
    top = Math.max(top, s.y);
    if (s.y > 12 && s.vx < 0) { await sim(5, {}, [1, 0]); await sim(3, { jump: true }, [1, 0]); await sim(40, {}, [1, 0]); top = Math.max(top, (await pos())[1]); break; } // oben: nach links rüber aufs Nest (Doppelsprung)
    if (s.near && s.vy < 2) await press('jump', 2); else await sim(1);
    if (s.g && i > 20) break;
  }
  await sim(20); return +top.toFixed(1);
};
await enter('dorf'); res.wandsprung = await learnAt();
await setAb('wandsprung', false); const topOhne = await chimney(); await setAb('wandsprung', true); const topMit = await chimney(); await shot('ab_wandsprung');
console.log('  höchster Punkt im Schornstein ohne/mit Wandsprung:', topOhne, topMit); res.wandHoch = topOhne < 5 && topMit > 11;
res.wandKnochen = await boneHere('wand'); console.log('  Goldknochen Wandsprung:', res.wandKnochen);

// ---- Kanal: Tornado-Trillern auf den Lüftungsschacht
const tornadoRun = async charge => {
  await tp(-12, 1.2, 8.8, Math.PI); await cam(0); await sim(5);
  await sim(charge, { spin: true }); await sim(1);
  let peak = 0; for (let i = 0; i < 40; i++) { const y = (await pos())[1]; peak = Math.max(peak, y); if (i === 16) await sim(3, { jump: true }); await sim(1, {}, i > 19 ? [0, 1] : [0, 0]); }
  await sim(20); return [+peak.toFixed(1), (await pos())[1]];
};
await enter('kanal'); res.tornado = await learnAt();
const tShort = await tornadoRun(4), tFull = await tornadoRun(45); await shot('ab_tornado');
console.log('  kurz getrillert: höchster Punkt/Ende', tShort, '| Tornado:', tFull); res.tornadoHoch = tShort[0] < 6.5 && tFull[0] > 7.1;
res.tornadoKnochen = await boneHere('tornado'); console.log('  Goldknochen Tornado:', res.tornadoKnochen);

const bad = Object.entries(res).filter(([, v]) => !v).map(([k]) => k);
console.log(bad.length ? 'FEHLGESCHLAGEN: ' + bad.join(', ') : `ALLE ${Object.keys(res).length} PROBEN OK`);
console.log('ERR', JSON.stringify(errs)); await b.close();
