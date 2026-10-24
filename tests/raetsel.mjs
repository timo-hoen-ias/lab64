// Rätsel-Test: spielt jedes Rätsel aus src/puzzles.js Bild für Bild (feste 1/30 s) mit echten Tasten durch –
// Memory (inkl. falschem Paar), Zeitschalter (einmal zu langsam, einmal schnell), Plattformen auf Zeit, Melodien (inkl. Fehler),
// Umdreh-Fliesen, Maulwürfe, Kerzen, Stempel-Wort. Rückkehr-Rätsel laufen erst OHNE die spätere Fähigkeit (darf nicht klappen),
// dann MIT. Wandsprung-Schacht, Aufwind und glatte Säule werden wirklich hochgesprungen/-geglitten/-getrillert.
// Aufruf: node tests/raetsel.mjs [screenshot-ordner] [welt,welt,...]   Server auf Port 8077.
import { chromium } from 'playwright';
const out = process.argv[2] && process.argv[2] !== '-' ? process.argv[2] : null;
const only = (process.argv[3] || 'hub,kueche,strasse,buero,park,strand,hafen,dorf,kanal').split(',');
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 800, height: 450 } });
const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto('http://localhost:8077/index.html'); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(1200);
await p.evaluate(() => window.game.intro.skip()); await p.click('#btnStart'); await p.waitForTimeout(300);
const ev = (f, a) => p.evaluate(f, a);
await ev(() => { window.game.loop = () => { }; window.game.dialog.auto = true; window.game.foesOff = true; });
const sim = (n, held = {}, move = [0, 0]) => ev(([n, held, move]) => {
  const g = window.game, i = g.input;
  for (let k = 0; k < n; k++) {
    Object.assign(i._held, { jump: false, act: false, sniff: false, spin: false, bark: false, up: false, down: false }, held); i.update(); i.move.x = move[0]; i.move.y = move[1];
    g.player.update(1 / 30, g.level); g.level.update(1 / 30); g.updateCamera(1 / 30); g.fx.update(1 / 30);
  }
}, [n, held, move]);
const press = async (key, n = 1, move) => { await sim(n, { [key]: true }, move); await sim(1, {}, move); };
// Teleport auf den Boden bei (x,z) (höchster Boden unter yHint), Blick nach yaw
const tp = (x, yHint, z, yaw) => ev(([x, yHint, z, yaw]) => { const pl = window.game.player, l = window.game.level, g = l.groundAt(x, z, yHint + 0.5);
  pl.pos.set(x, (g > -1e9 ? g : yHint) + 0.02, z); pl.vel.set(0, 0, 0); pl.hurtT = 0; pl.hp = 3; pl.spinCd = 0; pl.barkCd = 0; pl.biteCd = 0; pl.stomp = false; pl.air = 15; pl.onGround = false;
  if (yaw !== undefined && yaw !== null) pl.yaw = yaw; l.bounds = l.areaAt(x, z); window.game.snapCam = true; }, [x, yHint, z, yaw]);
const air = (x, y, z) => ev(([x, y, z]) => { const pl = window.game.player; pl.pos.set(x, y, z); pl.vel.set(0, 0, 0); pl.onGround = false; pl.coyote = 0; pl.stomp = false; pl.hurtT = 0; }, [x, y, z]);
const cam = yaw => ev(y => { window.game.camYaw = y; window.game.snapCam = true; }, yaw);
const pos = () => ev(() => { const q = window.game.player.pos; return [q.x, q.y, q.z].map(v => +v.toFixed(1)); });
const shot = async name => { if (!out) return; await ev(() => { const g = window.game; document.getElementById('toast').classList.remove('show'); g.renderer.render(g.level.scene, g.camera); }); await p.screenshot({ path: `${out}/${name}.png` }); };
const enter = async k => { await ev(k => window.game.enterLevel(k), k); await sim(10); };
const setAb = (a, on) => ev(([a, on]) => { window.game.save.abilities[a] = on; }, [a, on]);
const Z = (id, f) => ev(([id, f]) => { const z = window.game.level.puzzles.find(z => z.id === id); return new Function('z', 'l', 'return ' + f)(z, window.game.level); }, [id, f]);
const has = id => ev(id => window.game.hasBone(window.game.level.key, id), id);
const grab = async id => { const q = await ev(id => { const q = window.game.level.pickups.find(q => q.boneId === id && !q.taken && !q.buried); return q && [q.x, q.y, q.z]; }, id); if (q) { await ev(q => { const pl = window.game.player; pl.pos.set(q[0], q[1] - 0.5, q[2]); pl.vel.set(0, 0, 0); }, q); await sim(6); } return has(id); };
// Aktionen genau vor einem Ziel: BISS (von +z, Blick nach −z), BELLEN aus 4 m, TRILLERN daneben, Bauchklatscher von oben
const bite = async (x, y, z) => { await tp(x, y + 1, z + 1.2, Math.PI); await sim(2); await press('act'); await sim(4); };
const bark = async (x, y, z) => { await tp(x, y + 1, z + 4, Math.PI); await sim(2); await press('bark'); await sim(4); };
const spin = async (x, y, z) => { await tp(x, y + 1, z + 1.1, Math.PI); await sim(2); await press('spin'); await sim(12); };
const stomp = async (x, y, z) => { await air(x, y + 3, z); await sim(3); await press('act'); for (let i = 0; i < 40 && !(await ev(() => window.game.player.onGround)); i++) await sim(1); await sim(3); };
const step = async (x, y, z) => { await tp(x, y + 0.6, z); await sim(4); };
const act = { bite, bark, spin, stomp };
const res = {};
let world = ''; const ok = (name, v, ...info) => { res[world + ':' + name] = !!v; console.log(`  ${v ? '✓' : '✗'} ${name}`, ...info); };

// ---- Löser je Rätselart
async function memory(id) {
  const tiles = await Z(id, 'z.tiles.map(t => [t.x, t.z, t.sym])'), y = await Z(id, 'z.bone.y - 1.2');
  const [a, b2] = [tiles[0], tiles.find(t => t[2] !== tiles[0][2])];
  await step(a[0], y, a[1]); await step(b2[0], y, b2[1]); await sim(40);
  const zu = await Z(id, 'z.tiles.every(t => !t.shown)');
  for (const s of [...new Set(tiles.map(t => t[2]))]) for (const t of tiles.filter(t => t[2] === s)) await step(t[0], y, t[1]);
  await sim(30); ok(`${id}: falsches Paar klappt zu, alle Paare → Knochen`, zu && await grab(id));
}
async function race(id, by) {
  const [bx, by0, bz, sec] = await Z(id, '[z.button.x, z.button.y, z.button.z, z.sec]');
  await act[by](bx, by0, bz); const auf = await Z(id, 'z.cage.open');
  await sim(Math.round(sec * 30) + 20); const zu = await Z(id, '!z.cage.open && !z.button.down');
  await act[by](bx, by0, bz); await sim(15); const got = await grab(id);
  ok(`${id}: Schalter öffnet, zu langsam schließt, schnell genug → Knochen`, auf && zu && got);
}
async function plats(id, by) {
  const [bx, by0, bz] = await Z(id, '[z.button.x, z.button.y, z.button.z]'), vorher = await Z(id, 'z.plats.ps.some(s => s.active)');
  await act[by](bx, by0, bz); const an = await Z(id, 'z.plats.ps.every(s => s.active)');
  const last = await Z(id, '(s => [(s.min.x + s.max.x) / 2, s.max.y, (s.min.z + s.max.z) / 2])(z.plats.ps[z.plats.ps.length - 1])');
  await tp(last[0], last[1] + 0.5, last[2]); await sim(4); const drauf = (await pos())[1] > last[1] - 0.2;
  ok(`${id}: Plattformen erst nach dem Schalter, Moll steht auf der letzten, Knochen`, !vorher && an && drauf && await grab(id));
}
async function melody(id) {
  const [items, seq, by, st] = await Z(id, '[z.items.map(i => [i.x, i.y, i.z]), z.seq, z.by, (it => [it.x, it.y, it.z])(l.interact.find(it => it.hintText.startsWith("BISS = ") && it.cb.toString().includes("play()")))]');
  const play = async () => { await bite(st[0], st[1], st[2]); await sim(Math.round((0.6 + seq.length * 0.7) * 30)); };
  await play(); const wrong = (seq[0] + 1) % items.length; await act[by](...items[wrong]); await sim(Math.round((1.5 + seq.length * 0.7) * 30)); // Fehler → spielt nochmal vor
  for (const k of seq) { await act[by](...items[k]); await sim(4); }
  await sim(25); ok(`${id}: Melodie (${by}) nach Fehler richtig nachgespielt → Knochen`, await grab(id));
}
async function flip(id) {
  const [tiles, presses] = await Z(id, '[z.tiles.map(t => [t.x, t.z]), z.presses]'), y = await Z(id, 'z.bone.y - 0.9');
  await step(tiles[0][0] + 8, y, tiles[0][1]); await sim(2);
  for (const i of presses) await step(tiles[i][0], y, tiles[i][1]);
  await sim(20); ok(`${id}: Fliesen in ${presses.length} Schritten gelöst → Knochen`, await grab(id));
}
async function moles(id) {
  const st = await ev(() => { const it = window.game.level.interact.find(it => it.hintText === 'BISS = Spiel starten'); return [it.x, it.y, it.z]; });
  await bite(st[0], st[1], st[2]);
  for (let i = 0; i < 160 && !(await has(id)) && !(await Z(id, 'z.won')); i++) { const m = await Z(id, '(m => m && [m.x, m.y, m.z])(z.moles.find(m => m.t > 0.5))'); if (m) await bite(m[0], m[1] - 0.3, m[2]); else await sim(5); }
  await sim(20); ok(`${id}: ${await Z(id, 'z.count')} Maulwürfe in der Zeit → Knochen`, await grab(id));
}
async function candles(id) {
  const cs = await Z(id, 'z.candles.map(c => [c.x, c.y, c.z])'), ohne = await Z(id, 'z.won');
  for (const k of [0, 2, 4]) { const [x, , z] = cs[k]; await tp((x + cs[k + 1][0]) / 2, 1, z + 1.6, Math.PI); await sim(2); await press('spin'); await sim(14); }
  await sim(15); ok(`${id}: alle Kerzen zugleich ausgetrillert → Knochen`, !ohne && await grab(id));
}
async function letters(id) {
  const [tiles, word] = await Z(id, '[z.tiles.map(t => [t.x, t.z, t.ch]), z.word]'), y = await Z(id, 'z.bone.y - 0.8');
  const wrong = tiles.find(t => !word.includes(t[2])); await stomp(wrong[0], y + 0.2, wrong[1]);
  for (const ch of word) { const t = tiles.find(t => t[2] === ch); await stomp(t[0], y + 0.2, t[1]); }
  await sim(20); ok(`${id}: falscher Stempel, dann ${word} gestempelt → Knochen`, await grab(id));
}
// Rückkehr-Rätsel: Versuch ohne Fähigkeit (Knochen darf nicht kommen), dann mit
async function back(id, ab, tryIt) {
  await setAb(ab, false); await tryIt(); const ohne = await has(id); await setAb(ab, true); await tryIt(); await sim(10);
  const mit = await has(id);
  ok(`${id} [${ab}]: ohne ✗, mit ✓`, !ohne && mit, mit ? '' : '(Moll endet bei ' + (await pos()).join(', ') + ')');
}
const stompAt = id => async () => { const at = await Z(id, 'z.at'); await stomp(at[0], at[1], at[2]); };
const chestAt = id => async () => { const at = await Z(id, 'z.at'); await ev(at => { const pl = window.game.player; pl.pos.set(at[0], at[1] + 0.3, at[2] + 1.6); pl.yaw = Math.PI; pl.vel.set(0, 0, 0); pl.air = 15; }, at); await sim(2); await press('act'); await sim(10); await grab(id); };
const shaftRun = (x0, z0, y0) => async () => { // wie der Dorf-Schornstein: im Schacht zickzack hoch, oben nach links aufs Sims
  await tp(x0, y0 + 1, z0, 0); await cam(Math.PI); await sim(3); await press('jump', 3);
  for (let i = 0; i < 260; i++) {
    const s = await ev(() => { const pl = window.game.player; return { near: !!pl._wallNear(window.game.level), y: pl.pos.y, vy: pl.vel.y, vx: pl.vel.x, g: pl.onGround }; });
    if (s.y > y0 + 11 && s.vx < 0) { await sim(5, {}, [1, 0]); await sim(3, { jump: true }, [1, 0]); await sim(40, {}, [1, 0]); break; }
    if (s.near && s.vy < 2) await press('jump', 2); else await sim(1);
    if (s.g && i > 20) break;
  }
  await sim(20);
};
const glideRun = (x, z, y0, h) => async () => { // in den Aufwind, TRILLER halten, oben nach −z zum Ziel gleiten
  await tp(x, y0 + 1, z, Math.PI); await cam(0); await sim(3); await sim(6, { jump: true }); await sim(4); await sim(3, { jump: true });
  for (let i = 0; i < 150; i++) { const y = (await pos())[1]; if (y > y0 + h - 1.5) break; await sim(2, { spin: true }); }
  for (let i = 0; i < 120; i++) { await sim(2, { spin: true }, [0, 1]); if (await ev(() => window.game.player.onGround)) break; }
  await sim(15);
};
const tornadoRun = (x, z, y0) => async () => { // Tornado-Trillern neben der Säule, am höchsten Punkt Doppelsprung und rüber
  await tp(x, y0 + 1, z + 2.8, Math.PI); await cam(0); await sim(5); await sim(45, { spin: true }); await sim(1);
  for (let i = 0; i < 45; i++) { if (i === 16) await sim(3, { jump: true }); await sim(1, {}, i > 12 ? [0, 1] : [0, 0]); }
  await sim(20);
};

const ALL = ['apportieren', 'trillern', 'bellen', 'bauchklatscher', 'buddeln', 'zoomies', 'tauchen', 'gleiten', 'wandsprung', 'tornado'];
await ev(A => A.forEach(a => window.game.save.abilities[a] = true), ALL);
const W = {
  async hub() { await memory('memory'); await shot('rz_hub_memory'); await race('wettlauf', 'bite'); await back('brunnen', 'bauchklatscher', stompAt('brunnen')); await shot('rz_hub_brunnen'); },
  async kueche() { await candles('kerzen'); await shot('rz_kueche_kerzen'); await melody('glaeser'); await back('kamin', 'wandsprung', shaftRun(-49.4, -50, 0)); await shot('rz_kueche_kamin'); },
  async strasse() { await melody('klingeln'); await shot('rz_strasse_klingeln'); await race('rolltor', 'bark'); await back('ballon', 'gleiten', glideRun(-75, -33, 0, 17)); await shot('rz_strasse_ballon'); },
  async buero() { await letters('akte'); await shot('rz_buero_akte'); await plats('ordner', 'bite'); await shot('rz_buero_ordner'); await back('luefter', 'tornado', tornadoRun(8, 12, 36)); await shot('rz_buero_luefter'); },
  async park() { await moles('maulwurf'); await shot('rz_park_maulwurf'); await flip('huepfen'); await shot('rz_park_huepfen'); await back('seegrund', 'tauchen', chestAt('seegrund')); },
  async strand() { await memory('memory'); await shot('rz_strand_memory'); await plats('rettungsturm', 'bite'); await shot('rz_strand_turm'); const y = await Z('drachen', 'z.bone.y - 14.8'); await back('drachen', 'gleiten', glideRun(60, -100, y, 16)); },
  async hafen() { await melody('glocken'); await shot('rz_hafen_glocken'); await race('container', 'bite'); await back('speicher', 'wandsprung', shaftRun(-101.4, -38, 2)); await shot('rz_hafen_speicher'); },
  async dorf() { await flip('pflaster'); await shot('rz_dorf_pflaster'); await melody('kuhglocken'); await shot('rz_dorf_kuh'); const y = await Z('taubenschlag', 'z.bone.y - 6.4'); await back('taubenschlag', 'tornado', tornadoRun(-70, 45, y)); await shot('rz_dorf_taube'); },
  async kanal() { await melody('ventile'); await shot('rz_kanal_ventile'); await race('rohrpost', 'stomp'); await flip('gitter'); await shot('rz_kanal_gitter'); },
};
for (const k of only) {
  world = k; await enter(k); console.log(k + ':', await ev(() => window.game.level.puzzles.map(z => z.id + (z.need ? `(${z.need})` : '')).join(' ')));
  await W[k](); const n = await ev(k => window.game.level.puzzles.filter(z => window.game.hasBone(k, z.id)).length + '/' + window.game.level.puzzles.length, k);
  console.log(`  Rätsel-Knochen ${n}`);
}
const bad = Object.entries(res).filter(([, v]) => !v).map(([k]) => k);
console.log(bad.length ? 'FEHLGESCHLAGEN: ' + bad.join(', ') : `ALLE ${Object.keys(res).length} RÄTSEL OK`);
console.log('ERR', JSON.stringify(errs)); await b.close();
