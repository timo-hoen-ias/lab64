// Welten-Test: holt in jeder großen Welt alle Goldknochen in einem Besuch (Teleport + Interaktionen), Screenshots.
// Aufruf: node tests/worlds.mjs <ordner> [welt,welt,...]   Server auf Port 8077.
import { chromium } from 'playwright';
import { frames } from './frames.mjs';
const out = process.argv[2] || '.', only = (process.argv[3] || 'park').split(',');
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 800, height: 450 } });
const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto('http://localhost:8077/index.html'); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(1200);
await p.evaluate(() => window.game.intro.skip()); await p.click('#btnStart');
await p.evaluate(() => { window.game.dialog.auto = true; }); // Gespräche sofort überspringen (prüft tests/dialog.mjs)
const { W, kb, draw } = await frames(p); // feste Bilder zu 1/30 s statt Echtzeit: Ergebnis unabhängig von der Last
await p.evaluate(() => { window.game.foesOff = true; }); // Gegner ruhig stellen (Kämpfe prüft tests/gegner.mjs)
const ev = (f, a) => p.evaluate(f, a);
const tp = (x, y, z, yaw) => ev(([x, y, z, yaw]) => { const pl = window.game.player, l = window.game.level; pl.pos.set(x, y, z); pl.vel.set(0, 0, 0); pl.hurtT = 0; pl.biteCd = 0; pl.coyote = 0.3; pl.hp = 3; pl.air = 15; if (yaw !== undefined && yaw !== null) pl.yaw = yaw; l.bounds = l.areaAt(x, z); const wy = l.waterAt(x, z); pl.diving = wy !== null && y < wy - 1.2; window.game.snapCam = true; }, [x, y, z, yaw]);
const bite = async () => { await kb.down('KeyE'); await W(150); await kb.up('KeyE'); await W(350); };
const shot = async (name, yaw, pitch = 0.3) => { await ev(([y, pi]) => { if (y !== null) window.game.camYaw = y; window.game.camPitch = pi; window.game.snapCam = true; document.getElementById('toast').classList.remove('show'); }, [yaw, pitch]); await W(800); await draw(); await p.screenshot({ path: `${out}/${name}.png` }); };
// Standhöhe unter einem Sammelobjekt: auf der Oberseite darunter abstellen statt halb in der Kiste (sonst schiebt die Kollision Moll seitlich weg)
const feet = (q, dy) => ev(([x, y, z, dy]) => { const f = window.game.level.groundAt(x, z, y); return y - f < 1.6 ? f + 0.02 : y - dy; }, [...q, dy]);
const grabBone = async id => { const q = await ev(id => { const q = window.game.level.pickups.find(q => q.boneId === id && !q.taken); return q && [q.x, q.y, q.z]; }, id); if (q) { await tp(q[0], await feet(q, 0.5), q[2]); await W(600); } return !!q; };
const grabAll = async (filter, wait = 380) => { for (let pass = 0; pass < 2; pass++) for (const q of await ev(f => window.game.level.pickups.filter(q => !q.taken && new Function('q', 'return ' + f)(q)).map(q => [q.x, q.y, q.z]), filter)) { await tp(q[0], await feet(q, 0.3), q[2]); await W(pass ? wait + 200 : wait); } };
// Fähigkeit der Welt bei Heribert lernen und das Rätsel dazu direkt auslösen (die Steuerung selbst prüft tests/abilities.mjs)
const bruno = async () => { const br = await ev(() => { const b = window.game.level.bruno; return [b.x, b.y, b.z, b.ability]; }); await tp(br[0] + 2.5, br[1] + 0.2, br[2]); await W(600); console.log(`  Heribert: ${br[3]}`, await ev(a => window.game.has(a), br[3])); };
const talk = async (x, z, yaw = 0) => { const y = await ev(([x, z]) => window.game.level.top(x, z), [x, z]); await tp(x - Math.sin(yaw) * 1.6, y + 0.1, z - Math.cos(yaw) * 1.6, yaw); await W(200); await bite(); };

const STEPS = {
  async hub() {
    await ev(() => window.game.unlock('tauchen', 'Taucherbrille (Test)')); await W(300);
    await bruno(); await ev(() => { const l = window.game.level, it = l.fetchItems[0]; l.dropItem(it, { x: -13, y: 0.2, z: 12.3 }); }); await W(300); await grabBone('apport');
    await tp(0, 1, 40); await W(300); await shot('hub_start', Math.PI, 0.3);
    await grabBone('huegel'); await grabBone('baumhaus'); await shot('hub_baumhaus', -1.6, 0.3);
    await grabBone('vogelhaus'); await grabBone('gewaechshaus'); await shot('hub_gewaechshaus', 1.6, 0.35);
    await grabBone('aussicht'); await shot('hub_aussicht', 0, 0.25);
    await tp(0, 0.2, -56.0); await W(900); console.log('  im Schuppen:', await ev(() => window.game.player.pos.x > 1900));
    await shot('hub_schuppen', null, 0.3); await grabBone('schuppen');
    await grabAll("q.x > 1900 && q.kind !== 'goldbone'");
    await tp(2000, 0.2, 8.7); await W(900); console.log('  wieder draußen:', await ev(() => window.game.player.pos.x < 500));
    await grabAll('q.special'); console.log('  Zwerge:', await ev(() => window.game.level.zwerge)); await W(600); await grabBone('zwerge');
    await grabBone('teich');
    await kb.down('KeyF'); const gq = await ev(() => { const q = window.game.level.pickups.find(q => q.boneId === 'geheim'); return [q.x, q.y, q.z]; }); await tp(gq[0] + 2, gq[1] - 0.5, gq[2]); await W(300); await tp(gq[0], gq[1] - 0.5, gq[2]); await W(500); await kb.up('KeyF');
    await grabAll("!q.special && q.kind !== 'goldbone'"); await W(500); await grabBone('kruemel');
    console.log('  Kompass:', await ev(() => document.getElementById('compass').textContent));
  },
  async kanal() {
    await shot('kanal_start', null, 0.25);
    await bruno(); await grabBone('tornado');
    await grabBone('kletter'); await grabBone('pumpe'); await shot('kanal_pumpwerk', 2.6, 0.3);
    await grabBone('rohre'); await shot('kanal_rohre', 1.0, 0.35);
    await grabBone('becken'); await shot('kanal_becken', -1.6, 0.3);
    await grabBone('gully'); await shot('kanal_gully', 0, 0.5);
    for (const [x, y, z] of [[-10, 9.4, -56], [44, 0.2, 50], [-44, 3.3, -3.4], [-1.5, 20.2, 49]]) { const n0 = await ev(() => window.game.level.switches); for (let k = 0; k < 4 && await ev(() => window.game.level.switches) === n0; k++) { await tp(x, y, z + 1.2, Math.PI); await W(250); await bite(); } }
    console.log('  Schalter:', await ev(() => window.game.level.switches)); await W(600); await grabBone('lampen');
    await tp(-40, 0.2, -58.6); await W(900); console.log('  im Rattennest:', await ev(() => window.game.player.pos.x > 1900));
    await shot('kanal_nest', null, 0.3); await grabBone('nest'); await grabAll("q.x > 1900 && q.kind !== 'goldbone'");
    await tp(2000, 0.2, 9.7); await W(900); console.log('  wieder draußen:', await ev(() => window.game.player.pos.x < 500));
    await kb.down('KeyF'); const gq = await ev(() => { const q = window.game.level.pickups.find(q => q.boneId === 'geheim'); return [q.x, q.y, q.z]; }); await tp(gq[0] + 3, gq[1] - 0.5, gq[2]); await W(300); await tp(gq[0], gq[1] - 0.5, gq[2]); await W(500); await kb.up('KeyF');
    await grabAll("!q.goal && !q.special && q.kind !== 'goldbone'"); await W(500); await grabBone('kruemel');
    await grabAll('q.goal'); console.log('  Käse:', await ev(() => window.game.level.goal.have + '/' + window.game.level.goal.need));
    await W(2500); await tp(-12, 1.2, 10); await W(800); await shot('kanal_boss', 0, 0.3);
    for (let i = 0; i < 3; i++) { await ev(() => { const b = window.game.level.boss; if (b && !b.dead) { b.stun = 1; b.onBite(); } }); await W(1500); }
    await W(3500); console.log('  Albtraum:', await ev(() => window.game.level.key)); await ev(() => { const l = window.game.level; l.score = 35; l.ratScore = 3; l.z = 699; }); await W(9000);
    console.log('  danach in:', await ev(() => window.game.level.key));
  },
  async buero() {
    await shot('buero_start', null, 0.25);
    await bruno(); for (const [x, z] of [[-10, 24], [8, 27], [-22, 6]]) await ev(([x, z]) => window.game.level.onStomp({ x, y: 0.2, z }), [x, z]); await W(300); await grabBone('stampfen');
    for (const c of await ev(() => window.game.level.crates.map(c => [c.x, c.y, c.z]))) await ev(c => window.game.level.onStomp({ x: c[0], y: c[1], z: c[2] + 1.5 }), c);
    // Schubladen aufbeißen
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) { const x = -14 + c * 14 + 1.8, z = -12 + r * 11 + 3.2; await tp(x, 0.2, z, Math.PI); await W(150); await bite(); }
    await grabAll('q.goal'); console.log('  Leckerli:', await ev(() => window.game.level.goal.have + '/' + window.game.level.goal.need));
    await grabBone('kletter'); await grabBone('kopierer'); await shot('buero_stock1', 0.8, 0.3);
    await grabBone('server'); await shot('buero_server', 2.6, 0.3); await grabBone('fenster');
    await grabBone('antenne'); await shot('buero_dach', 0.6, 0.35);
    await tp(10, 12.2, -30.6); await W(900); console.log('  im Chefbüro:', await ev(() => window.game.player.pos.x > 1900));
    await shot('buero_chef', null, 0.3); await grabBone('chef'); await grabAll("q.x > 1900 && q.kind !== 'goldbone'");
    await tp(2000, 0.2, 9.7); await W(900); console.log('  wieder draußen:', await ev(() => window.game.player.pos.x < 500));
    await grabAll('q.special'); console.log('  Tassen:', await ev(() => window.game.level.tassen));
    await tp(12, 24.2, 19.4, 0); await W(200); await bite(); await bite(); await W(600); await grabBone('tassen');
    await kb.down('KeyF'); const gq = await ev(() => { const q = window.game.level.pickups.find(q => q.boneId === 'geheim'); return [q.x, q.y, q.z]; }); await tp(gq[0] - 3, gq[1] - 0.5, gq[2]); await W(300); await tp(gq[0], gq[1] - 0.5, gq[2]); await W(500); await kb.up('KeyF');
    await grabAll("!q.goal && !q.special && q.kind !== 'goldbone'"); await W(500); await grabBone('kruemel');
    await W(2500); await tp(0, 0.2, 14); await W(800); await shot('buero_boss', 0, 0.3);
    for (let i = 0; i < 3; i++) { await ev(() => { const b = window.game.level.boss; if (b && !b.dead) { b.stun = 1; b.onBite(); } }); await W(1500); }
    await W(1500); await grabBone('boss');
  },
  async kueche() {
    await shot('kueche_start', null, 0.25);
    await bruno(); await ev(() => window.game.level.onSpin({ x: 6, y: 0, z: -10.6 }, 2.2, new Set(), false)); await W(300); await grabBone('trillern');
    await grabBone('kletter'); await grabBone('vorrat'); await shot('kueche_vorrat', 2.8, 0.3);
    await grabBone('regal'); await shot('kueche_wohnzimmer', 1.2, 0.35);
    await grabBone('treppe'); await grabBone('uhr'); await shot('kueche_flur', -2.4, 0.35);
    await grabAll('q.special && q.x < 1900'); console.log('  Socken:', await ev(() => window.game.level.socken));
    // Keller
    await tp(58.8, 0.2, -40); await W(900); console.log('  im Keller:', await ev(() => window.game.player.pos.x > 1900));
    await shot('kueche_keller', null, 0.3); await grabBone('keller'); await grabAll("q.x > 1900 && q.kind !== 'goldbone'");
    await tp(2006, 0.2, 7.9, Math.PI); await W(200); await bite(); await bite(); await W(600); await grabBone('socken'); console.log('  Socken:', await ev(() => window.game.level.socken));
    await tp(2000, 0.2, 12.9); await W(900); console.log('  wieder oben:', await ev(() => window.game.player.pos.x < 500));
    await kb.down('KeyF'); const gq = await ev(() => { const q = window.game.level.pickups.find(q => q.boneId === 'geheim'); return [q.x, q.y, q.z]; }); await tp(gq[0], gq[1] - 0.5, gq[2] + 3); await W(300); await tp(gq[0], gq[1] - 0.5, gq[2]); await W(500); await kb.up('KeyF');
    await grabAll('q.goal'); console.log('  Schinken:', await ev(() => window.game.level.goal.have + '/' + window.game.level.goal.need));
    await grabAll("!q.goal && !q.special && q.kind !== 'goldbone'"); await W(500); await grabBone('kruemel');
    await W(2500); await tp(0, 0.2, 12); await W(800); await shot('kueche_boss', 0, 0.3);
    for (let i = 0; i < 3; i++) { await ev(() => { const b = window.game.level.boss; if (b && !b.dead) { b.stun = 1; b.onBite(); } }); await W(1500); }
    await W(1500); await grabBone('boss');
  },
  async strasse() {
    await shot('strasse_start', null, 0.25);
    await bruno(); for (const [x, z] of [[-4, -2], [4, 12], [-4, -20]]) await ev(([x, z]) => window.game.level.onBark({ x, y: 0.2, z: z + 6 }, { x: 0, z: -1 }, 11), [x, z]); await W(300); await grabBone('bellen');
    await grabBone('kletter');
    for (const [x, y, z] of [[24, 7.6, -24], [24, 7.6, 10], [0, 7.6, 10], [-24, 7.6, 10], [-24, 7.6, -24]]) { await tp(x, y - 1.1, z); await W(400); }
    await W(500); await grabBone('daecher'); await shot('strasse_daecher', 0.5, 0.3);
    await grabBone('baustelle'); await shot('strasse_baustelle', -1.4, 0.35);
    await grabBone('bahnhof'); await shot('strasse_bahnhof', 3.4, 0.35);
    await tp(-110, 12.1, 0); await W(400); await grabBone('brunnen'); await shot('strasse_brunnen', -1.6, 0.35);
    // Kaufhaus über die Tür
    await tp(0, 0.2, -97); await W(900); console.log('  im Kaufhaus:', await ev(() => window.game.player.pos.x > 1900));
    await shot('strasse_kaufhaus', null, 0.3); await grabBone('kaufhaus'); await grabAll("q.kind === 'crumb' && q.x > 1900");
    await tp(2000, 0.2, 14.7); await W(900); console.log('  wieder draußen:', await ev(() => window.game.player.pos.x < 500));
    // Eiskugeln + Eisdiele
    await grabAll('q.special'); console.log('  Eiskugeln:', await ev(() => window.game.level.kugeln));
    await tp(-116, 0.2, 15.9, Math.PI); await W(200); await bite(); await bite(); await W(600); await grabBone('eisdiele');
    // Geheim mit Nase
    await kb.down('KeyF'); const gq = await ev(() => { const q = window.game.level.pickups.find(q => q.boneId === 'geheim'); return [q.x, q.y, q.z]; }); await tp(gq[0] + 3, gq[1] - 0.5, gq[2]); await W(300); await tp(gq[0], gq[1] - 0.5, gq[2]); await W(500); await kb.up('KeyF');
    await grabAll('q.goal'); console.log('  Essen:', await ev(() => window.game.level.goal.have + '/' + window.game.level.goal.need));
    await grabAll("!q.goal && !q.special && q.kind !== 'goldbone'"); await W(500); await grabBone('kruemel');
    await W(2500); await tp(0, 0.2, 14); await W(800); await shot('strasse_boss', 0, 0.3);
    for (let i = 0; i < 3; i++) { await ev(() => { const b = window.game.level.boss; if (b && !b.dead) { b.stun = 1; b.onBite(); } }); await W(1500); }
    await W(1500); await grabBone('boss');
  },
  async dorf() {
    await shot('dorf_start', null, 0.25);
    await bruno(); await grabBone('wand');
    await grabBone('kletter'); await grabBone('muehle'); await shot('dorf_muehle', 0.3, 0.3);
    await grabBone('burg'); await shot('dorf_burg', 2.6, 0.35);
    await grabBone('teich'); await shot('dorf_teich', -1.2, 0.3);
    // Scheune über die Tür
    await tp(95.2, 0.2, -16); await W(900); console.log('  in der Scheune:', await ev(() => window.game.player.pos.x > 1900 && window.game.player.pos.x < 2200));
    await shot('dorf_scheune', null, 0.3); await grabBone('scheune'); await grabAll("q.kind === 'crumb' && q.x > 1900 && q.x < 2200");
    await tp(2000, 0.2, 10.6); await W(900); console.log('  wieder draußen:', await ev(() => window.game.player.pos.x < 500));
    // Hühner fangen
    for (let i = 0; i < 5; i++) { const c = await ev(() => { const c = window.game.level.chickens.find(c => !c.caught); return c && [c.x, c.z]; }); if (!c) break; await ev(([x, z]) => { const c = window.game.level.chickens.find(c => !c.caught); c.a = 0; }, c); await tp(c[0], 0.2, c[1] - 1.4, 0); await bite(); }
    console.log('  Hühner:', await ev(() => window.game.level.huhn)); await W(500); await grabBone('huehner'); await shot('dorf_hof', 1.6, 0.3);
    // Kekse + Bäcker
    await grabAll('q.special'); console.log('  Kekse:', await ev(() => window.game.level.kekse));
    await tp(-18.2, 0.2, 0); await W(900); console.log('  in der Bäckerei:', await ev(() => window.game.player.pos.x > 2200));
    await shot('dorf_baeckerei', null, 0.3); await tp(2296, 0.2, 5.6, Math.PI); await W(200); await bite(); await bite(); await W(600); await grabBone('baecker');
    await grabAll("q.kind === 'crumb' && q.x > 2200");
    await tp(2300, 0.2, 8.7); await W(900); console.log('  wieder draußen:', await ev(() => window.game.player.pos.x < 500));
    // Geheim + Brote mit Nase
    await kb.down('KeyF'); const gq = await ev(() => { const q = window.game.level.pickups.find(q => q.boneId === 'geheim'); return [q.x, q.y, q.z]; }); await tp(gq[0] + 3, gq[1] - 0.5, gq[2]); await W(300); await tp(gq[0], gq[1] - 0.5, gq[2]); await W(500);
    for (const q of await ev(() => window.game.level.pickups.filter(q => q.goal).map(q => [q.x, q.y, q.z]))) { await tp(q[0] + 2, q[1] - 0.3, q[2]); await W(250); await tp(q[0], await feet(q, 0.3), q[2]); await W(450); }
    await kb.up('KeyF'); console.log('  Brote:', await ev(() => window.game.level.goal.have + '/' + window.game.level.goal.need));
    await grabAll("!q.goal && !q.special && q.kind !== 'goldbone'"); await W(500); await grabBone('kruemel');
    await W(2500); await tp(0, 0.2, 14); await W(800); await shot('dorf_boss', 0, 0.3);
    for (let i = 0; i < 3; i++) { await ev(() => { const b = window.game.level.boss; if (b && !b.dead) { b.stun = 1; b.onBite(); } }); await W(1500); }
    await W(1500); await grabBone('boss');
  },
  async hafen() {
    await shot('hafen_start', null, 0.25);
    await bruno(); await grabBone('gleiten');
    await tp(5, 2.6, 22); await W(600); console.log('  tauchen:', await ev(() => window.game.has('tauchen')));
    await grabBone('kletter'); await grabBone('kran'); await shot('hafen_kran', -1.2, 0.35);
    await grabBone('mole'); await shot('hafen_mole', 0.4, 0.3);
    // Fischmarkt über die Tür
    await tp(-75.0, 2.2, -15); await W(900); console.log('  im Fischmarkt:', await ev(() => window.game.player.pos.x > 2900));
    await shot('hafen_markt', null, 0.3); await grabBone('markt'); await grabAll("q.kind === 'crumb' && q.x > 2900 && q.x < 3200");
    await tp(3000, 0.2, 13.8); await W(900); console.log('  wieder draußen:', await ev(() => window.game.player.pos.x < 500));
    // Frachter: Laderaum
    await tp(44.6, 6.6, 92); await W(900); console.log('  im Laderaum:', await ev(() => window.game.player.pos.x > 3200));
    await shot('hafen_laderaum', null, 0.3); await grabBone('laderaum'); await grabAll("q.kind === 'crumb' && q.x > 3200");
    await tp(3300, 0.2, 11.8); await W(900); console.log('  an Deck:', await ev(() => window.game.player.pos.x < 500 && window.game.player.pos.y > 5));
    // Anker tauchen
    await grabBone('anker'); await shot('hafen_anker', 0.8, 0.1);
    // Bojen
    for (const [x, z] of [[-5, 45], [10, 60], [25, 72], [15, 88], [-2, 100]]) { await tp(x, 0.6, z); await W(400); }
    await W(500); await grabBone('bojen');
    // Geheim
    await kb.down('KeyF'); const gq = await ev(() => { const q = window.game.level.pickups.find(q => q.boneId === 'geheim'); return [q.x, q.y, q.z]; }); await tp(gq[0] + 3, gq[1] - 0.5, gq[2]); await W(300); await tp(gq[0], gq[1] - 0.5, gq[2]); await W(500);
    // Fische (versteckt) mit Nase
    for (const q of await ev(() => window.game.level.pickups.filter(q => q.goal).map(q => [q.x, q.y, q.z]))) { await tp(q[0] + 2, q[1] - 0.3, q[2]); await W(250); await tp(q[0], await feet(q, 0.3), q[2]); await W(450); }
    await kb.up('KeyF'); console.log('  Fische:', await ev(() => window.game.level.goal.have + '/' + window.game.level.goal.need));
    await grabAll("!q.goal && !q.special && q.kind !== 'goldbone'"); await W(500); await grabBone('kruemel');
    await W(2500); await tp(0, 2.2, 10); await W(800); await shot('hafen_boss', 0, 0.3);
    for (let i = 0; i < 3; i++) { await ev(() => { const b = window.game.level.boss; if (b && !b.dead) { b.stun = 1; b.onBite(); } }); await W(1500); }
    await W(1500); await grabBone('boss');
  },
  async park() {
    await shot('park_start', null, 0.25);
    await bruno(); await ev(() => window.game.level.digSpots.forEach(d => window.game.level.dig(d))); await W(300); await grabBone('buddeln');
    await grabBone('kletter'); await grabBone('turm'); await shot('park_turm', 0.6, 0.35);
    await grabBone('insel'); await grabBone('baumkrone'); await shot('park_wald', 1.2, 0.3);
    // Dachsbau über die Tür
    await tp(18, 0.2, -71.4); await W(900); console.log('  im Dachsbau:', await ev(() => window.game.player.pos.x > 1900));
    await shot('park_dachsbau', null, 0.3); await grabBone('dachsbau');
    await grabAll("q.kind === 'crumb' && q.x > 1900");
    await tp(2000, 0.2, 19.0); await W(900); console.log('  wieder draußen:', await ev(() => window.game.player.pos.x < 500));
    // Parcours
    for (const [x, y, z] of [[84, 3.2, 4], [88, 5.6, 16], [95, 6.2, 1], [95, 3, 10], [112, 2.2, 8]]) { await tp(x, y - 0.5, z); await W(400); }
    await W(500); await grabBone('parcours'); await shot('park_spielplatz', 2.0, 0.3);
    // Picknick
    await grabAll('q.special'); console.log('  Picknick:', await ev(() => window.game.level.picnic), await ev(() => window.game.level.pickups.filter(q => q.special && !q.taken).map(q => [q.x.toFixed(0), q.y.toFixed(1), q.z.toFixed(0)]))); await talk(40, 60, Math.PI); await W(500); await grabBone('picknick');
    // Geheim
    await kb.down('KeyF'); const g = await ev(() => { const q = window.game.level.pickups.find(q => q.boneId === 'geheim'); return [q.x, q.y, q.z]; }); await tp(g[0] + 3, g[1] - 0.5, g[2]); await W(300); await tp(g[0], g[1] - 0.5, g[2]); await W(500); await kb.up('KeyF');
    // Krümel
    await grabAll("!q.goal && !q.special && q.kind !== 'goldbone'"); await W(500); await grabBone('kruemel');
    // Würstchen-Ziel erzwingen (Schleichen wird im Playtest nicht nachgespielt)
    await ev(() => { const l = window.game.level; l.goal.have = l.goal.need; l.checkGoal(); }); await W(1500); await grabBone('boss');
    await tp(0, 1, -60, 0); await shot('park_see', Math.PI, 0.2);
  },
};
for (const key of only) {
  await ev(k => window.game.enterLevel(k), key); await W(1500);
  console.log(key + ':'); await STEPS[key]();
  for (const q of await ev(() => window.game.level.pickups.filter(q => q.boneId && !q.taken && !q.backtrack).map(q => [q.x, q.y, q.z]))) { await tp(q[0], await feet(q, 0.5), q[2]); await W(700); } // Nachlese (ohne Rückkehr-Knochen)
  const res = await ev(k => window.game.levelProgress(k), key);
  console.log(`  Knochen ${res.have}/${res.total}`, await ev(k => Object.keys(window.game.save.bones).filter(b => b.startsWith(k + ':')).map(b => b.split(':')[1]).join(' '), key));
}
// Rückkehr: mit allen Fähigkeiten (und Supernase) noch einmal in jede Welt und die Rückkehr-Knochen holen
await ev(() => { for (const a of ['apportieren', 'trillern', 'bellen', 'bauchklatscher', 'buddeln', 'zoomies', 'tauchen', 'gleiten', 'wandsprung', 'tornado', 'supernase']) window.game.save.abilities[a] = true; });
await W(2000); await p.keyboard.press('KeyF'); await W(300); // Abspann nach der Kanalratte schließen
console.log('Rückkehr:');
for (const key of [...new Set([...only, ...(only.length > 1 ? ['strand'] : [])])].filter(k => k !== 'rattenrennen')) {
  await ev(k => window.game.enterLevel(k), key); await W(1500);
  for (const bb of await ev(() => window.game.level.backbones.map(bb => ({ id: bb.id, kind: bb.kind, x: bb.x, y: bb.y, z: bb.z })))) {
    if (bb.kind === 'nose') { await tp(bb.x + 2, bb.y + 0.2, bb.z); await kb.down('KeyF'); await W(900); await kb.up('KeyF'); }
    else { await tp(bb.x, bb.y + 0.2, bb.z - 2.5, 0); await ev(id => { const b = window.game.level.backbones.find(b => b.id === id); b.act && b.act(); }, bb.id); await W(900); }
    const q = await ev(id => { const p = window.game.level.pickups.find(q => q.boneId === id && !q.taken && q.mesh.visible); return p && [p.x, p.y, p.z]; }, bb.id);
    if (q) { await tp(q[0], q[1] - 0.5, q[2]); await W(700); }
  }
  const res = await ev(k => window.game.levelProgress(k), key);
  console.log(`  ${key}: Knochen ${res.have}/${res.total}`, await ev(k => Object.keys(window.game.save.bones).filter(b => b.startsWith(k + ':r_')).map(b => b.split(':')[1]).join(' '), key));
}
console.log('ERR', JSON.stringify(errs)); await b.close();
