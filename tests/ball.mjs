// Ball-Test im Garten: Ball rollt (Anstupsen, Reibung, Hang, Abprallen an Kisten), und im Maul steckt er nie in Molls Kopf,
// auch nicht im Trab, im Galopp, beim Biss, beim Kopf-Tracking oder an einer Wand. Feste 1/30 s pro Bild.
// Aufruf: node tests/ball.mjs [screenshot-ordner]   Server auf Port 8077.
import { chromium } from 'playwright';
const out = process.argv[2];
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 800, height: 450 } });
const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto('http://localhost:8077/index.html'); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(1200);
await p.evaluate(() => window.game.intro.skip()); await p.click('#btnStart'); await p.waitForTimeout(300);
const ev = (f, a) => p.evaluate(f, a);
await ev(() => { window.game.loop = () => { }; window.game.dialog.auto = true; window.game.save.abilities.apportieren = true; });
await ev(() => window.game.enterLevel('hub'));
// n Bilder; jedes Bild misst, wie tief der Ball (falls getragen) in Molls Kopf und Schnauze steckt
const sim = (n, held = {}, move = [0, 0]) => ev(([n, held, move]) => {
  const g = window.game, i = g.input, T = window.THREE_ || null; let worst = 0;
  for (let k = 0; k < n; k++) {
    Object.assign(i._held, { jump: false, act: false, sniff: false, spin: false, bark: false, up: false, down: false }, held); i.update(); i.move.x = move[0]; i.move.y = move[1];
    g.player.update(1 / 30, g.level); g.level.update(1 / 30); g.updateCamera(1 / 30); g.fx.update(1 / 30);
    const it = g.player.carry; if (!it || !it.spin) continue;
    const head = g.player.mesh.userData.head; g.player.mesh.updateMatrixWorld(true);
    const c = it.spin.getWorldPosition(it.spin.position.clone()); head.worldToLocal(c); // Ballmitte im Kopf-System
    const r = 0.26; // Kopf, Schnauze und Nase (wie in makeDog)
    const boxes = [[0, 0, 0, 0.35, 0.3, 0.325], [0, -0.1, 0.5, 0.2, 0.175, 0.25]];
    for (const [x, y, z, hx, hy, hz] of boxes) { const dx = Math.max(0, Math.abs(c.x - x) - hx), dy = Math.max(0, Math.abs(c.y - y) - hy), dz = Math.max(0, Math.abs(c.z - z) - hz); worst = Math.max(worst, r - Math.hypot(dx, dy, dz)); }
    worst = Math.max(worst, 0.12 + r - Math.hypot(c.x, c.y + 0.02, c.z - 0.78));
    if (!g.level._ballFree(it, it.x, it.y, it.z)) worst = Math.max(worst, 9);
  }
  return worst;
}, [n, held, move]);
const tp = (x, y, z, yaw) => ev(([x, y, z, yaw]) => { const pl = window.game.player, l = window.game.level; pl.pos.set(x, y, z); pl.vel.set(0, 0, 0); pl.hurtT = 0; pl.biteCd = 0; if (yaw !== undefined) pl.yaw = yaw; l.bounds = l.areaAt(x, z); window.game.snapCam = true; }, [x, y, z, yaw]);
const ball = () => ev(() => { const it = window.game.level.fetchItems.find(i => i.kind === 'ball'); return { x: +it.x.toFixed(2), y: +it.y.toFixed(2), z: +it.z.toFixed(2), v: +Math.hypot(it.vx, it.vz).toFixed(2), carried: it.carried }; });
const putBall = (x, y, z) => ev(([x, y, z]) => { const it = window.game.level.fetchItems.find(i => i.kind === 'ball'); Object.assign(it, { x, y, z, vx: 0, vy: 0, vz: 0 }); }, [x, y, z]);
const shot = async name => { if (!out) return; await ev(() => { const g = window.game; g.renderer.render(g.level.scene, g.camera); }); await p.screenshot({ path: `${out}/${name}.png` }); };
const res = {};

// 1) Anstupsen: Moll läuft in den Ball, er rollt weg und bleibt durch Reibung irgendwann liegen
const b0 = await ball(); await putBall(b0.x, 0, b0.z); await tp(b0.x - 3, 0.2, b0.z, Math.PI / 2);
await ev(() => { window.game.camYaw = -Math.PI / 2; window.game.snapCam = true; }); // Stick vor = +x
await sim(25, {}, [0, 1]); const b1 = await ball(); await sim(150); const b2 = await ball();
res.stupsen = b1.x > b0.x + 0.5 && b2.v === 0 && b2.x > b1.x; console.log('  Anstupsen:', b0.x, '→', b1.x, '→ liegt bei', b2.x, '| Tempo', b2.v, res.stupsen);
await shot('ball_rollt');

// 2) Hang: auf einen Hügel gelegt rollt der Ball bergab
const hill = await ev(() => { const t = window.game.level.terrain.find(t => t.kind === 'hill' && t.h > 0.8 && !t.bridge); return t && { x: t.x, z: t.z, rx: t.rx, flat: t.flat, y0: t.y0, h: t.h }; });
if (hill) {
  const sx = hill.x + hill.rx * (hill.flat + (1 - hill.flat) * 0.45), sy = await ev(([x, z]) => window.game.level.groundAt(x, z, 1e6), [sx, hill.z]);
  await tp(hill.x + 40, 0.2, hill.z); await putBall(sx, sy, hill.z); await sim(60); const bh = await ball();
  res.hang = bh.x > sx + 0.5 && bh.y < sy - 0.2; console.log('  Hang:', sx.toFixed(1), sy.toFixed(1), '→', bh.x, bh.y, res.hang);
} else { res.hang = true; console.log('  Hang: kein Hügel im Garten, übersprungen'); }

// 3) Abprallen: mit Schwung gegen eine Kiste/Wand, der Ball steckt danach nicht darin
const wall = await ev(() => { const l = window.game.level; const s = l.solids.find(s => s.active && s !== l.groundSolid && s.max.y > 1 && s.max.y - s.min.y < 8 && s.max.x - s.min.x > 1.5 && s.max.z - s.min.z > 0.3 && s.min.y < 0.2); return s && { x0: s.min.x, x1: s.max.x, z: (s.min.z + s.max.z) / 2, y: s.min.y }; });
await tp(wall.x0 - 6, 0.2, wall.z + 3); await putBall(wall.x0 - 3, Math.max(0, wall.y), wall.z);
await ev(() => { window.game.level.fetchItems.find(i => i.kind === 'ball').vx = 14; }); await sim(20); const bw = await ball();
res.wand = bw.x < wall.x0 && await ev(() => { const l = window.game.level, it = l.fetchItems.find(i => i.kind === 'ball'); return l._ballFree(it, it.x, it.y, it.z); });
console.log('  Wand bei x =', wall.x0.toFixed(2), '→ Ball bei', bw.x, '| zurück mit', bw.v, res.wand);

// 4) Im Maul: aufheben, im Stand, im Trab, im Galopp, mit Biss, mit Kopfdrehen zu einem NPC und gegen eine Wand
const open = await ev(() => { const l = window.game.level; for (let r = 0; r < 30; r += 1) for (let a = 0; a < 6.28; a += 0.5) { const x = Math.cos(a) * r, z = Math.sin(a) * r; let free = l.heightAt(x, z) === -Infinity && l.waterAt(x, z) === null; for (const s of l.solids) if (s.active && s !== l.groundSolid && s.max.y > 0.1 && x + 9 > s.min.x && x - 3 < s.max.x && z + 3 > s.min.z && z - 3 < s.max.z) free = false; if (free) return [x, z]; } }); // freie Wiese, 9 m Auslauf nach +x
await putBall(open[0] + 1.6, 0, open[1]); const bc = await ball(); await tp(bc.x - 1.6, 0.2, bc.z, Math.PI / 2); await sim(2); await sim(1, { act: true }); await sim(1);
res.trag = await ev(() => !!window.game.player.carry); const pen = {};
pen.stand = await sim(20); await shot('ball_maul_stand');
pen.trab = await sim(30, {}, [0, 0.45]); pen.galopp = await sim(30, {}, [0, 1]); await shot('ball_maul_galopp');
await tp(open[0], 0.2, open[1], Math.PI / 2); pen.sprung = Math.max(await sim(1, { jump: true }, [0, 1]), await sim(25, {}, [0, 0.3]));
const npc = await ev(() => { const n = window.game.level.npcs.find(n => n.visible); return n && [n.position.x, n.position.y, n.position.z]; });
if (npc) { await tp(npc[0] + 3, npc[1] + 0.2, npc[2] + 3, 0); pen.kopf = await sim(30); await shot('ball_maul_kopf'); }
await tp(wall.x0 - 3, 0.2, wall.z, Math.PI / 2); pen.wand = await sim(40, {}, [0, 1]); await shot('ball_maul_wand');
const worst = Math.max(...Object.values(pen)); res.maul = worst <= 0.08; // die Kugel darf die Lefzen ein paar cm eindrücken („im Maul“)
console.log('  Eindringtiefe in Kopf/Schnauze (m):', Object.fromEntries(Object.entries(pen).map(([k, v]) => [k, +v.toFixed(3)])), res.maul);
await tp(open[0], 0.2, open[1], Math.PI / 2); await sim(1, { act: true }); await sim(30); const bd = await ball(); res.ablegen = !bd.carried && await ev(() => { const l = window.game.level, it = l.fetchItems.find(i => i.kind === 'ball'); return l._ballFree(it, it.x, it.y, it.z); });
console.log('  Abgelegt, liegt frei:', res.ablegen);

// 5) Weitere Spielzeuge: Quietsche-Knochen aufheben (quer im Maul, frei), Bälle zählen; kein Regen im Haus
const toys = await ev(() => { const f = window.game.level.fetchItems; return { baelle: f.filter(i => i.kind === 'ball').length, knochen: f.filter(i => i.kind === 'quietsch').length }; });
const kn = await ev(() => { const it = window.game.level.fetchItems.find(i => i.kind === 'quietsch'); return [it.x, it.z]; });
await tp(open[0], 0.2, open[1], Math.PI / 2); await ev(([x, z]) => { const it = window.game.level.fetchItems.find(i => i.kind === 'quietsch'); Object.assign(it, { x, y: 0, z, vx: 0, vy: 0, vz: 0 }); }, [open[0] + 1.6, open[1]]);
await sim(2); await sim(1, { act: true }); const penK = await sim(30, {}, [0, 1]);
res.knochen = toys.baelle >= 5 && toys.knochen >= 2 && await ev(() => window.game.player.carry?.kind === 'quietsch') && penK < 1;
console.log('  Spielzeug:', toys, '| Quietsche-Knochen im Maul:', res.knochen);
res.dach = await ev(() => { const l = window.game.level; return l.sheltered(0, 2, -18) && !l.sheltered(0, 2, 5); }); console.log('  Kein Regen im Haus, draußen schon:', res.dach);

// 6) Gemüsegarten: Beißen lässt eine Karotte rausploppen und wegfliegen, Trillern wirbelt einen Kürbis weg
const veg = k => ev(k => { const it = window.game.level.fetchItems.find(i => i.kind === k && i.planted); return it && [it.x, it.y, it.z]; }, k);
const c0 = await veg('karotte'); await ev(() => window.game.player.carry = null);
await tp(c0[0] + 1.3, 0.8, c0[2], -Math.PI / 2); await sim(3); await sim(1, { act: true }); await sim(6);
const cFly = await ev(([x, z]) => { const it = window.game.level.fetchItems.find(i => i.kind === 'karotte' && i.home.x === x && i.home.z === z); return { planted: it.planted, y: it.y }; }, [c0[0], c0[2]]);
await sim(60); const c1 = await ev(([x, z]) => { const it = window.game.level.fetchItems.find(i => i.kind === 'karotte' && i.home.x === x && i.home.z === z); return [it.x, it.y, it.z, Math.hypot(it.vx, it.vz)]; }, [c0[0], c0[2]]);
res.karotte = !cFly.planted && cFly.y > c0[1] + 0.5 && Math.hypot(c1[0] - c0[0], c1[2] - c0[2]) > 1.5;
console.log('  Karotte gebissen: fliegt bis', cFly.y.toFixed(1), '→ liegt bei', c1.map(v => +v.toFixed(1)), res.karotte);
await shot('gemuese');
const k0 = await veg('kuerbis'); await ev(() => { window.game.save.abilities.trillern = true; });
await tp(k0[0] + 1.2, 0.8, k0[2]); await sim(2); await sim(1, { spin: true }); await sim(40);
res.kuerbis = await ev(([x, z]) => { const it = window.game.level.fetchItems.find(i => i.kind === 'kuerbis' && i.home.x === x && i.home.z === z); return !it.planted && Math.hypot(it.x - x, it.z - z) > 1; }, [k0[0], k0[2]]);
console.log('  Kürbis weggetrillert:', res.kuerbis);

// 7) Heribert spielt mit: Ball neben ihm → er stupst ihn zu Moll zurück; Kauknochen direkt vor der Nase → behält ihn
await ev(() => { window.game.player.carry = null; });
const hb = await ev(() => { const b = window.game.level.bruno; return [b.mesh.position.x, b.y, b.mesh.position.z]; });
await tp(hb[0] + 9, hb[1] + 0.2, hb[2]);
await ev(([x, y, z]) => { const it = window.game.level.fetchItems.find(i => i.kind === 'ball'); Object.assign(it, { x, y, z, vx: 0, vy: 0, vz: 0, carried: false, _kicked: -9 }); }, [hb[0] + 1.9, hb[1], hb[2]]);
const dB = () => ev(() => { const it = window.game.level.fetchItems.find(i => i.kind === 'ball'), p = window.game.player.pos; return Math.hypot(it.x - p.x, it.z - p.z); });
const d0 = await dB(); let hmax = 0; for (let i = 0; i < 12; i++) { await sim(5); hmax = Math.max(hmax, await ev(() => window.game.level.fetchItems.find(i => i.kind === 'ball').y)); }
const d1 = await dB(); res.zurueck = d1 < d0 - 3 && hmax > hb[1] + 0.8; console.log('  Heribert schießt Ball zurück: Abstand zu Moll', d0.toFixed(1), '→', d1.toFixed(1), '| Flughöhe', hmax.toFixed(1), res.zurueck);
await ev(([x, y, z]) => { const it = window.game.level.fetchItems.find(i => i.kind === 'quietsch' && !i.carried); Object.assign(it, { x, y, z, vx: 0, vy: 0, vz: 0, _kicked: -9 }); }, [hb[0] + 1.1, hb[1], hb[2]]);
await sim(20); await tp(hb[0] + 2.2, hb[1] + 0.2, hb[2], -Math.PI / 2); await sim(2); await sim(1, { act: true }); await sim(30);
res.meins = await ev(() => { const h = window.game.level.bruno; return !!h.bone && h.bone.heldBy === h && window.game.player.carry !== h.bone; });
console.log('  Kauknochen bei Heribert: behält ihn trotz Biss:', res.meins, '| Sprüche:', await ev(() => window.game.dialog.log.filter(l => l.who === 'Heribert').slice(-2).map(l => l.text)));

console.log('Fehler:', errs.length ? errs : 'keine');
const ok = Object.values(res).every(Boolean) && !errs.length; console.log(ok ? 'BALL OK' : 'BALL FEHLER', res);
await b.close(); process.exit(ok ? 0 : 1);
