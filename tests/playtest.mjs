import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 480, height: 270 } });
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto('http://localhost:8077/index.html'); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(1200);
await p.click('#btnStart');
const W = ms => p.waitForTimeout(ms);
const tp = (x, y, z) => p.evaluate(([x, y, z]) => { const pl = window.game.player; pl.pos.set(x, y, z); pl.vel.set(0, 0, 0); pl.hurtT = 0; pl.hp = 3; }, [x, y, z]);
const report = [];
// Große Welten (Strand, Grillpark, …) testen tests/strand.mjs und tests/worlds.mjs
for (const key of ['kueche', 'buero', 'kanal']) {
  await p.evaluate(k => window.game.enterLevel(k), key); await W(400);
  const info = await p.evaluate(() => { const l = window.game.level; return { crumbs: l.crumbTotal, cr: l.pickups.filter(q => !q.goal && q.kind !== 'goldbone').map(q => [q.x, q.y, q.z]) }; });
  // alle Krümel einsammeln
  for (const [x, y, z] of info.cr) { await tp(x, y - 0.3, z); await W(380); }
  // zweiter Durchgang für Krümel, die der langsame Software-Renderer verpasst hat
  for (const [x, y, z] of await p.evaluate(() => window.game.level.pickups.filter(q => !q.goal && q.kind !== 'goldbone' && !q.taken).map(q => [q.x, q.y, q.z]))) { await tp(x, y - 0.3, z); await W(500); }
  await W(300);
  const k = await p.evaluate(() => { const l = window.game.level; const b = l.pickups.find(q => q.boneId === 'kruemel'); return { have: l.crumbHave, b: b && [b.x, b.y, b.z] }; });
  if (k.b) { await tp(k.b[0], k.b[1] - 0.5, k.b[2]); await W(300); }
  // Geheim-Knochen: Nase halten
  const g = await p.evaluate(() => { const q = window.game.level.pickups.find(q => q.boneId === 'geheim'); return [q.x, q.y, q.z]; });
  await p.keyboard.down('KeyF'); await tp(g[0] + 3, g[1] - 0.5, g[2]); await W(200); await tp(g[0], g[1] - 0.5, g[2]); await W(300); await p.keyboard.up('KeyF');
  const kl = await p.evaluate(() => { const q = window.game.level.pickups.find(q => q.boneId === 'kletter'); return [q.x, q.y, q.z]; });
  await tp(kl[0], kl[1] - 0.6, kl[2]); await W(300);
  // Hauptziel erzwingen → Boss
  await p.evaluate(() => { const l = window.game.level; const goals = l.pickups.filter(q => q.goal); goals.forEach(q => { q.taken = true; q.mesh.visible = false; }); l.goal.have = l.goal.need; l.checkGoal(); });
  await W(1800);
  let boss = await p.evaluate(() => !!window.game.level.boss);
  if (boss) for (let i = 0; i < 3; i++) { await p.evaluate(() => { const b = window.game.level.boss; if (!b.dead) { b.stun = 1; b.onBite(); } }); await W(250); }
  await W(1500);
  const after = await p.evaluate(() => ({ lvl: window.game.level.key, bone: (window.game.level.pickups || []).filter(q => q.boneId === 'boss').map(q => [q.x, q.y, q.z]) }));
  if (after.lvl === key && after.bone.length) { const [x, y, z] = after.bone[0]; await tp(x, y - 0.5, z); await W(3200); }
  const res = await p.evaluate(k => ({ prog: window.game.levelProgress(k), now: window.game.level.key }), key);
  report.push(`${key}: Krümel ${k.have}/${info.crumbs}  Boss:${boss}  Knochen ${res.prog.have}/${res.prog.total}  → jetzt in ${res.now}`);
}
for (const mode of ['rattenrennen', 'albtraum']) {
  await p.evaluate(m => window.game.enterLevel(m), mode); await W(500);
  await p.evaluate(() => { const l = window.game.level; l.score = 35; l.ratScore = 3; l.z = 699; });
  await W(6000);
  report.push(`${mode}: danach in ${await p.evaluate(() => window.game.level.key)}`);
}
await p.evaluate(() => window.game.enterLevel('hub')); await W(500);
for (const id of ['huegel', 'geheim']) { const q = await p.evaluate(id => { const q = window.game.level.pickups.find(q => q.boneId === id); return [q.x, q.y, q.z]; }, id); await p.keyboard.down('KeyF'); await tp(q[0], q[1] - 0.6, q[2]); await W(400); await p.keyboard.up('KeyF'); }
const tot = await p.evaluate(() => window.game.boneCount());
console.log(report.join('\n')); console.log(await p.evaluate(() => Object.keys(window.game.save.bones).join(' '))); console.log('Knochen gesamt:', tot, 'ERR:', JSON.stringify(errs));
await p.evaluate(() => window.game.enterLevel('hub')); await W(800); await p.screenshot({ path: process.argv[2] + '/hub_progress.png' });
await p.evaluate(() => window.game.pause()); await W(300); await p.screenshot({ path: process.argv[2] + '/pause.png' });
await b.close();
