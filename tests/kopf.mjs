// Kopf-Tracking: NPCs schauen Moll an, Moll schaut NPCs an. Server auf Port 8077.
// Aufruf: node tests/kopf.mjs [screenshot-ordner]
import { chromium } from 'playwright';
const out = process.argv[2];
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 800, height: 450 } });
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto('http://localhost:8077/index.html'); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(1200);
await p.click('#btnStart'); await p.waitForTimeout(500);
await p.evaluate(() => window.game.enterLevel('dorf')); await p.waitForTimeout(800);
const npc = await p.evaluate(() => { const n = window.game.level.npcs[0]; return { x: n.position.x, y: n.position.y, z: n.position.z, ry: n.rotation.y }; });
// Moll steht 4 Einheiten seitlich (rechts vom NPC aus gesehen), schaut in dieselbe Richtung wie der NPC
const sx = Math.cos(npc.ry) * 4, sz = -Math.sin(npc.ry) * 4;
const place = () => p.evaluate(([x, y, z, ry]) => { const pl = window.game.player; pl.pos.set(x, y + 0.2, z); pl.vel.set(0, 0, 0); pl.yaw = ry; pl.hurtT = 0; }, [npc.x + sx, npc.y, npc.z + sz, npc.ry]);
for (let i = 0; i < 12; i++) { await place(); await p.waitForTimeout(150); }
const r = await p.evaluate(() => { const g = window.game, n = g.level.npcs[0]; return { npc: n.userData.head.rotation.y, moll: g.player.mesh.userData.head.rotation.y, mollTrack: g.player.mesh.userData.track }; });
if (out) await p.screenshot({ path: `${out}/kopf.png` });
// weit weg → Köpfe drehen zurück
await p.evaluate(([x, y, z]) => { const pl = window.game.player; pl.pos.set(x + 30, y + 0.2, z + 30); }, [npc.x, npc.y, npc.z]);
await p.waitForTimeout(2500);
const back = await p.evaluate(() => window.game.level.npcs[0].userData.head.rotation.y);
console.log(JSON.stringify({ r, back, errs }));
const ok = Math.abs(r.npc) > 0.6 && Math.abs(r.mollTrack) > 0.5 && Math.abs(back) < 0.1 && !errs.length;
console.log(ok ? 'OK' : 'FEHLER'); await b.close(); process.exit(ok ? 0 : 1);
