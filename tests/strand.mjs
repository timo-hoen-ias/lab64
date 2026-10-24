// Strand-Test: alle 10 Goldknochen der Badebucht in einem Besuch, Screenshots. Server auf Port 8077.
import { chromium } from 'playwright';
const out = process.argv[2] || '.';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 800, height: 450 } });
const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto('http://localhost:8077/index.html'); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(1200);
await p.click('#btnStart');
const W = ms => p.waitForTimeout(ms);
const tp = (x, y, z) => p.evaluate(([x, y, z]) => { const pl = window.game.player; pl.pos.set(x, y, z); pl.vel.set(0, 0, 0); pl.hurtT = 0; pl.biteCd = 0; pl.hp = 3; pl.air = 15; const wy = window.game.level.waterAt(x, z); pl.diving = wy !== null && y < wy - 1.2; }, [x, y, z]);
const shot = async (name, yaw, pitch = 0.25) => { await p.evaluate(([y, pi]) => { if (y !== null) window.game.camYaw = y; window.game.camPitch = pi; window.game.snapCam = true; document.getElementById('toast').classList.remove('show'); }, [yaw, pitch]); await W(700); await p.screenshot({ path: `${out}/strand_${name}.png` }); };
const bite = async () => { await p.keyboard.down('KeyE'); await W(150); await p.keyboard.up('KeyE'); await W(300); };
await p.evaluate(() => window.game.enterLevel('strand')); await W(1500);
console.log('Spawn:', await p.evaluate(() => { const q = window.game.player.pos; return [q.x.toFixed(1), q.y.toFixed(2), q.z.toFixed(1)]; }));
await shot('spawn', null, 0.2);
// Taucherbrille
await tp(4, 6.5, -118); await W(500); console.log('tauchen:', await p.evaluate(() => window.game.has('tauchen')));
const L = () => window.game.level;
const pos = (f, a) => p.evaluate(f, a);
// Geheim (Dünen) mit Nase
const gh = await pos(() => { const q = window.game.level.pickups.find(q => q.boneId === 'geheim'); return [q.x, q.y, q.z]; });
await p.keyboard.down('KeyF'); await tp(gh[0] + 3, gh[1], gh[2]); await W(400); await tp(gh[0], gh[1] - 0.4, gh[2]); await W(500); await p.keyboard.up('KeyF');
// Riesenrad + Leuchtturm per Teleport
for (const id of ['riesenrad', 'leuchtturm']) { const q = await pos(id => { const q = window.game.level.pickups.find(q => q.boneId === id); return [q.x, q.y, q.z]; }, id); await tp(q[0], q[1] - 0.5, q[2]); await W(500); }
await shot('leuchtturm', 2.2, 0.35);
// Truhe im Wrack
await tp(-84, -11.5, 80.3); await p.evaluate(() => { window.game.player.yaw = 0; }); await bite(); await W(600);
const sb = await pos(() => { const q = window.game.level.pickups.find(q => q.boneId === 'schatz'); return q && [q.x, q.y, q.z]; }); if (sb) { await tp(sb[0], sb[1] - 0.5, sb[2]); await W(500); }
await shot('wrack', 1.0, 0.3);
// Muscheln am Riff
for (const [x, z] of [[45, 70], [70, 50], [90, 90], [110, 80], [60, 110]]) { const y = await pos(([x, z]) => window.game.level.groundAt(x, z, 30), [x, z]); await tp(x, y + 0.2, z - 1.9); await p.evaluate(() => { window.game.player.yaw = 0; }); await bite(); }
console.log('Muscheln offen:', await pos(() => window.game.level.clamsOpen)); await W(600); const mb = await pos(() => { const q = window.game.level.pickups.find(q => q.boneId === 'muscheln'); return q && [q.x, q.y, q.z]; }); if (mb) { await tp(mb[0], mb[1] - 0.5, mb[2]); await W(500); }
await shot('riff', 0.5, 0.15);
// Ringe
for (const [x, y, z] of [[40, -5, 40], [55, -8, 52], [72, -7, 62], [88, -9, 58], [100, -6, 46]]) { await tp(x, y - 0.5, z); await W(350); }
await W(500); const rb = await pos(() => { const q = window.game.level.pickups.find(q => q.boneId === 'ringe'); return q && [q.x, q.y, q.z]; }); if (rb) { await tp(rb[0], rb[1] - 0.5, rb[2]); await W(500); }
// Muscheln (Sammeln) + Bello
for (const q of await pos(() => window.game.level.pickups.filter(q => q.kind === 'shell').map(q => [q.x, q.y, q.z]))) { await tp(q[0], q[1] - 0.3, q[2]); await W(350); }
await tp(18, await pos(() => window.game.level.groundAt(18, -77.5, 30)), -77.5 - 0.1); await p.evaluate(() => { window.game.player.yaw = Math.PI / 2; }); await W(200); await bite(); await W(500);
const bb = await pos(() => { const q = window.game.level.pickups.find(q => q.boneId === 'sandburg'); return q && [q.x, q.y, q.z]; }); if (bb) { await tp(bb[0], bb[1] - 0.5, bb[2]); await W(500); }
// Wettschwimmen: Rex ansprechen, dann zur Flagge
const ry = await pos(() => window.game.level.groundAt(40, -66, 30)); await tp(40, ry, -68); await p.evaluate(() => { window.game.player.yaw = 0; }); await bite(); await W(300);
const fy = await pos(() => window.game.level.groundAt(86, 4, 30)); await tp(86, fy, 4); await W(600);
const rn = await pos(() => { const q = window.game.level.pickups.find(q => q.boneId === 'rennen'); return q && [q.x, q.y, q.z]; }); if (rn) { await tp(rn[0], rn[1] - 0.5, rn[2]); await W(500); }
// Alle Krümel
for (let pass = 0; pass < 2; pass++) for (const q of await pos(() => window.game.level.pickups.filter(q => !q.goal && !q.special && q.kind !== 'goldbone' && !q.taken).map(q => [q.x, q.y, q.z]))) { await tp(q[0], q[1] - 0.3, q[2]); await W(pass ? 500 : 330); }
await W(600); const kb = await pos(() => { const q = window.game.level.pickups.find(q => q.boneId === 'kruemel'); return q && [q.x, q.y, q.z]; }); if (kb) { await tp(kb[0], kb[1] - 0.5, kb[2]); await W(500); }
// Pommes (Hauptziel, teils versteckt) → Boss
await p.keyboard.down('KeyF');
for (const q of await pos(() => window.game.level.pickups.filter(q => q.goal).map(q => [q.x, q.y, q.z]))) { await tp(q[0] + 2, q[1] - 0.3, q[2]); await W(250); await tp(q[0], q[1] - 0.3, q[2]); await W(450); }
await p.keyboard.up('KeyF');
console.log('Pommes:', await pos(() => window.game.level.goal.have + '/' + window.game.level.goal.need));
await W(2500); await tp(-40, 1, 25); await W(800);
await shot('boss', 0, 0.3);
for (let i = 0; i < 3; i++) { await p.evaluate(() => { const b = window.game.level.boss; if (b && !b.dead) { b.stun = 1; b.onBite(); } }); await W(1500); }
await W(1500); const bo = await pos(() => { const q = window.game.level.pickups.find(q => q.boneId === 'boss'); return q && [q.x, q.y, q.z]; }); if (bo) { await tp(bo[0], bo[1] - 0.5, bo[2]); await W(800); }
for (const q of await pos(() => window.game.level.pickups.filter(q => q.boneId && !q.taken).map(q => [q.x, q.y, q.z]))) { await tp(q[0], q[1] - 0.5, q[2]); await W(700); } // Nachlese
const res = await pos(() => ({ prog: window.game.levelProgress('strand'), bones: Object.keys(window.game.save.bones).filter(k => k.startsWith('strand')), lvl: window.game.level.key }));
console.log('Strand:', JSON.stringify(res));
// Unterwasser-Ansicht
await tp(70, -6, 70); await p.evaluate(() => { const pl = window.game.player; pl.diving = true; }); await W(300); await shot('unterwasser', 0.3, 0.05);
await tp(60, 3.2, -40); await shot('pier', 0, 0.25);
console.log('ERR', JSON.stringify(errs)); await b.close();
