// Engine-Test: Hügel, Rampe, Tür-Raum, Fortschritt pro Welt, Grafik-Stufe. Server auf Port 8077.
import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 640, height: 360 } });
const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type()==='error') errs.push(m.text()); });
await p.goto('http://localhost:8077/index.html'); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(1200);
await p.click('#btnStart');
const W = ms => p.waitForTimeout(ms);
// Gelände: Hügel im Garten (rechts), Moll läuft drauf
await p.evaluate(() => { const l = window.game.level; l.hill(36, 4, 8, 4, { flat: 0.4 }); l.ramp(36, -20, 36, -12, 3, 0, 3); l.bounds.max.x = 60; const pl = window.game.player; pl.pos.set(24, 0, 4); pl.yaw = Math.PI / 2; window.game.camYaw = -Math.PI / 2; });
await W(300);
await p.keyboard.down('KeyW'); await W(2000); await p.keyboard.up('KeyW');
console.log('auf Hügel:', await p.evaluate(() => { const q = window.game.player.pos; return [q.x.toFixed(1), q.y.toFixed(2), window.game.level.heightAt(q.x, q.z).toFixed(2)]; }));
await p.screenshot({ path: (process.argv[2] || '.') + '/hill.png' });
// Rampe
await p.evaluate(() => { const pl = window.game.player; pl.pos.set(36, 0, -23); window.game.camYaw = Math.PI; });
await W(200); await p.keyboard.down('KeyW'); await W(1200); await p.keyboard.up('KeyW');
console.log('Rampe:', await p.evaluate(() => { const q = window.game.player.pos; return [q.z.toFixed(1), q.y.toFixed(2)]; }));
// Tür in einen Raum
await p.evaluate(() => { const l = window.game.level; l.room(2000, 0, 20, 20); l.box(2000, -1, 0, 20, 1, 20, 0x999999); l.door(0, 0, 8, { x: 2000, y: 0.5, z: 0 }); window.game.player.pos.set(0, 0, 8.3); });
await W(400);
console.log('Raum:', await p.evaluate(() => { const q = window.game.player.pos, l = window.game.level; return [q.x.toFixed(0), q.y.toFixed(1), l.bounds.room]; }));
// Fortschritt: Krümel in der Küche, raus, wieder rein
await p.evaluate(() => window.game.enterLevel('kueche')); await W(400);
await p.evaluate(async () => { const l = window.game.level, pl = window.game.player; for (const q of l.pickups.filter(q => !q.goal && q.kind !== 'goldbone').slice(0, 3)) { pl.pos.set(q.x, q.y - 0.3, q.z); await new Promise(r => setTimeout(r, 260)); } });
const g = await p.evaluate(async () => { const l = window.game.level, pl = window.game.player, q = l.pickups.find(q => q.goal); pl.pos.set(q.x, q.y - 0.3, q.z); await new Promise(r => setTimeout(r, 300)); return l.goal.have; });
await p.evaluate(() => window.game.enterLevel('hub')); await W(300); await p.evaluate(() => window.game.enterLevel('kueche')); await W(300);
console.log('nach Rückkehr:', await p.evaluate(() => { const l = window.game.level; return { crumbs: l.crumbHave, goal: l.goal.have }; }), 'goal vorher', g);
await p.evaluate(() => { window.game.save.settings.quality = 'niedrig'; window.game.applyQuality(); window.game.pause(); }); await W(300);
await p.screenshot({ path: (process.argv[2] || '.') + '/pause1.png' });
console.log('ERR', errs);
await b.close();
