// Welten-Test: holt in jeder großen Welt alle Goldknochen in einem Besuch (Teleport + Interaktionen), Screenshots.
// Aufruf: node tests/worlds.mjs <ordner> [welt,welt,...]   Server auf Port 8077.
import { chromium } from 'playwright';
const out = process.argv[2] || '.', only = (process.argv[3] || 'park').split(',');
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 800, height: 450 } });
const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto('http://localhost:8077/index.html'); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(1200);
await p.click('#btnStart');
const W = ms => p.waitForTimeout(ms), ev = (f, a) => p.evaluate(f, a);
const tp = (x, y, z, yaw) => ev(([x, y, z, yaw]) => { const pl = window.game.player, l = window.game.level; pl.pos.set(x, y, z); pl.vel.set(0, 0, 0); pl.hurtT = 0; pl.biteCd = 0; pl.hp = 3; pl.air = 15; if (yaw !== undefined && yaw !== null) pl.yaw = yaw; l.bounds = l.areaAt(x, z); const wy = l.waterAt(x, z); pl.diving = wy !== null && y < wy - 1.2; window.game.snapCam = true; }, [x, y, z, yaw]);
const bite = async () => { await p.keyboard.down('KeyE'); await W(150); await p.keyboard.up('KeyE'); await W(350); };
const shot = async (name, yaw, pitch = 0.3) => { await ev(([y, pi]) => { if (y !== null) window.game.camYaw = y; window.game.camPitch = pi; window.game.snapCam = true; document.getElementById('toast').classList.remove('show'); }, [yaw, pitch]); await W(800); await p.screenshot({ path: `${out}/${name}.png` }); };
const grabBone = async id => { const q = await ev(id => { const q = window.game.level.pickups.find(q => q.boneId === id && !q.taken); return q && [q.x, q.y, q.z]; }, id); if (q) { await tp(q[0], q[1] - 0.5, q[2]); await W(600); } return !!q; };
const grabAll = async (filter, wait = 380) => { for (let pass = 0; pass < 2; pass++) for (const q of await ev(f => window.game.level.pickups.filter(q => !q.taken && new Function('q', 'return ' + f)(q)).map(q => [q.x, q.y, q.z]), filter)) { await tp(q[0] + (pass ? 0 : 0), q[1] - 0.3, q[2]); await W(pass ? wait + 200 : wait); } };
const talk = async (x, z, yaw = 0) => { const y = await ev(([x, z]) => window.game.level.top(x, z), [x, z]); await tp(x - Math.sin(yaw) * 1.6, y + 0.1, z - Math.cos(yaw) * 1.6, yaw); await W(200); await bite(); };

const STEPS = {
  async dorf() {
    await shot('dorf_start', null, 0.25);
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
    await p.keyboard.down('KeyF'); const gq = await ev(() => { const q = window.game.level.pickups.find(q => q.boneId === 'geheim'); return [q.x, q.y, q.z]; }); await tp(gq[0] + 3, gq[1] - 0.5, gq[2]); await W(300); await tp(gq[0], gq[1] - 0.5, gq[2]); await W(500);
    for (const q of await ev(() => window.game.level.pickups.filter(q => q.goal).map(q => [q.x, q.y, q.z]))) { await tp(q[0] + 2, q[1] - 0.3, q[2]); await W(250); await tp(q[0], q[1] - 0.3, q[2]); await W(450); }
    await p.keyboard.up('KeyF'); console.log('  Brote:', await ev(() => window.game.level.goal.have + '/' + window.game.level.goal.need));
    await grabAll("!q.goal && !q.special && q.kind !== 'goldbone'"); await W(500); await grabBone('kruemel');
    await W(2500); await tp(0, 0.2, 14); await W(800); await shot('dorf_boss', 0, 0.3);
    for (let i = 0; i < 3; i++) { await ev(() => { const b = window.game.level.boss; if (b && !b.dead) { b.stun = 1; b.onBite(); } }); await W(1500); }
    await W(1500); await grabBone('boss');
  },
  async hafen() {
    await shot('hafen_start', null, 0.25);
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
    await p.keyboard.down('KeyF'); const gq = await ev(() => { const q = window.game.level.pickups.find(q => q.boneId === 'geheim'); return [q.x, q.y, q.z]; }); await tp(gq[0] + 3, gq[1] - 0.5, gq[2]); await W(300); await tp(gq[0], gq[1] - 0.5, gq[2]); await W(500);
    // Fische (versteckt) mit Nase
    for (const q of await ev(() => window.game.level.pickups.filter(q => q.goal).map(q => [q.x, q.y, q.z]))) { await tp(q[0] + 2, q[1] - 0.3, q[2]); await W(250); await tp(q[0], q[1] - 0.3, q[2]); await W(450); }
    await p.keyboard.up('KeyF'); console.log('  Fische:', await ev(() => window.game.level.goal.have + '/' + window.game.level.goal.need));
    await grabAll("!q.goal && !q.special && q.kind !== 'goldbone'"); await W(500); await grabBone('kruemel');
    await W(2500); await tp(0, 2.2, 10); await W(800); await shot('hafen_boss', 0, 0.3);
    for (let i = 0; i < 3; i++) { await ev(() => { const b = window.game.level.boss; if (b && !b.dead) { b.stun = 1; b.onBite(); } }); await W(1500); }
    await W(1500); await grabBone('boss');
  },
  async park() {
    await shot('park_start', null, 0.25);
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
    await p.keyboard.down('KeyF'); const g = await ev(() => { const q = window.game.level.pickups.find(q => q.boneId === 'geheim'); return [q.x, q.y, q.z]; }); await tp(g[0] + 3, g[1] - 0.5, g[2]); await W(300); await tp(g[0], g[1] - 0.5, g[2]); await W(500); await p.keyboard.up('KeyF');
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
  for (const q of await ev(() => window.game.level.pickups.filter(q => q.boneId && !q.taken).map(q => [q.x, q.y, q.z]))) { await tp(q[0], q[1] - 0.5, q[2]); await W(700); } // Nachlese
  const res = await ev(k => window.game.levelProgress(k), key);
  console.log(`  Knochen ${res.have}/${res.total}`, await ev(k => Object.keys(window.game.save.bones).filter(b => b.startsWith(k + ':')).map(b => b.split(':')[1]).join(' '), key));
}
console.log('ERR', JSON.stringify(errs)); await b.close();
