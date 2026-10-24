// Tauch-Test im Gartenteich: Taucherbrille, Abtauchen, Luft, Unterwasser-Look. Server auf Port 8077.
import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 800, height: 450 } });
const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto('http://localhost:8077/index.html'); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(1200);
await p.evaluate(() => window.game.intro.skip()); await p.click('#btnStart');
const W = ms => p.waitForTimeout(ms), st = () => p.evaluate(() => { const pl = window.game.player; return { y: +pl.pos.y.toFixed(2), swim: pl.swimming, dive: pl.diving, air: +(pl.air ?? 0).toFixed(1) }; });
// Ohne Brille: Nase halten im Teich → bleibt oben
await p.evaluate(() => { window.game.player.pos.set(-3, -0.5, 20); window.game.camYaw = 0; }); await W(500);
await p.keyboard.down('KeyF'); await W(800); console.log('ohne Brille:', await st()); await p.keyboard.up('KeyF');
// Brille einsammeln
await p.evaluate(() => { const l = window.game.level; l.abilityItem(-6, 0.8, 8, 'tauchen', 'Taucherbrille!'); window.game.player.pos.set(-6, 0, 8); }); await W(400);
console.log('Brille:', await p.evaluate(() => window.game.has('tauchen')));
await p.evaluate(() => { window.game.player.pos.set(-3, -0.5, 20); }); await W(500);
await p.keyboard.down('KeyF'); await W(1200); console.log('getaucht:', await st()); await p.keyboard.up('KeyF');
await W(1500); console.log('unten, Krümel:', await p.evaluate(() => window.game.level.crumbHave), await st());
await p.screenshot({ path: (process.argv[2] || '.') + '/unterwasser.png' });
await p.evaluate(() => { window.game.player.air = 1; }); await W(1500); console.log('Luft leer:', await st(), 'hp', await p.evaluate(() => window.game.player.hp));
await p.keyboard.down('Space'); await W(1500); await p.keyboard.up('Space'); console.log('aufgetaucht:', await st());
console.log('ERR', errs); await b.close();
