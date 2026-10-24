// Musik-Test: Stücke laufen ohne Fehler, Varianten schalten synchron um, Musik läuft nach einem Ruckler weiter.
// Server auf Port 8077.
import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 800, height: 450 } });
const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto('http://localhost:8077/index.html'); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(1200);
await p.click('#btnStart'); await p.waitForTimeout(1500);
const st = () => p.evaluate(() => { const a = window.game.audio; return { step: a.song?.step, mix: a.mix, state: a.ctx.state }; });
console.log('Start:', await st());
// Unter Wasser im Gartenteich → Variante water
await p.evaluate(() => { const g = window.game; g.level.abilityItem(-6, 0.8, 8, 'tauchen', 'Taucherbrille!'); g.player.pos.set(-6, 0, 8); }); await p.waitForTimeout(400); await p.evaluate(() => { const g = window.game; g.player.pos.set(-3, -0.5, 20); });
await p.waitForTimeout(500); await p.keyboard.down('KeyF'); await p.waitForTimeout(1500);
console.log('getaucht:', await st(), await p.evaluate(() => ({ uw: window.game.level._uw, y: window.game.player.pos.y, dive: window.game.player.diving, cam: window.game.camera.position.y }))); await p.keyboard.up('KeyF');
await p.evaluate(() => window.game.player.pos.set(0, 1, 0)); await p.waitForTimeout(1500);
console.log('aufgetaucht:', await st());
// Ruckler: Hauptthread 1,5 s blockieren, danach muss die Musik weiterlaufen
const before = (await st()).step; await p.evaluate(() => { const t = performance.now(); while (performance.now() - t < 1500); }); await p.waitForTimeout(800);
console.log('nach Ruckler weiter:', (await st()).step > before);
// Alle Stücke einmal starten
const styles = await p.evaluate(async () => { const { SONGS } = await import('./src/music.js'); return Object.keys(SONGS); });
for (const s of styles) { await p.evaluate(s => window.game.audio.playTheme({ style: s }), s); await p.waitForTimeout(250); }
console.log('Stücke:', styles.length, await st());
console.log('ERR', errs); await b.close();
