// Musik-Test: Stücke laufen ohne Fehler, Varianten schalten synchron um, Musik läuft nach einem Ruckler weiter.
// Server auf Port 8077.
import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 800, height: 450 } });
const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto('http://localhost:8077/index.html'); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(1200);
await p.evaluate(() => window.game.intro.skip()); await p.click('#btnStart'); await p.waitForTimeout(1500);
const st = () => p.evaluate(() => { const a = window.game.audio; return { step: a.song?.step, mix: a.mix, state: a.ctx.state }; });
console.log('Start:', await st());
// Varianten: getaucht → water (Lage direkt gesetzt, damit der Test nicht an der Teichposition hängt), Zone → anderes Melodie-Instrument
console.log('getaucht:', await p.evaluate(() => { const g = window.game; g.player.diving = true; g._musicMix(); return g.audio.mix; }));
await p.waitForTimeout(600);
console.log('aufgetaucht:', await p.evaluate(() => { const g = window.game; g.player.diving = false; g._musicMix(); return g.audio.mix; }));
console.log('Zonen im Garten:', await p.evaluate(() => window.game.level.zones.length));
// Portal im Hub: nah dran blendet das Stück der Zielwelt herein, beim Betreten läuft es ohne Neustart weiter
const blendAt = async (x, z) => { await p.evaluate(([x, z]) => { const g = window.game; g.player.pos.set(x, g.player.pos.y, z); g.player.vel.set(0, 0, 0); }, [x, z]); await p.waitForTimeout(800);
  return p.evaluate(() => { const a = window.game.audio, b = a.blend; return b ? { key: b.key, k: +b.k.toFixed(2), haupt: +a.song.fader.gain.value.toFixed(2) } : null; }); };
const po = await p.evaluate(() => { const q = window.game.level.portals.find(o => o.target === 'kueche'); return { x: q.x, z: q.z }; });
console.log('weit weg:', await blendAt(po.x + 40, po.z));
console.log('15 m:', await blendAt(po.x + 15, po.z));
console.log('5 m:', await blendAt(po.x + 5, po.z));
console.log('Portal betreten, gleiches Stück weiter:', await p.evaluate(() => { const g = window.game, b = g.audio.blend.song; g.enterLevel('kueche'); return g.audio.song === b && !b.stop; }));
await p.waitForTimeout(500);
console.log('in der Küche kein Portal-Stück mehr:', await p.evaluate(() => window.game.audio.blend === null), 'Regler', await p.evaluate(() => +window.game.audio.song.fader.gain.value.toFixed(2)));
await p.evaluate(() => window.game.enterLevel('hub')); await p.waitForTimeout(300);
// Ruckler: Hauptthread 1,5 s blockieren, danach muss die Musik weiterlaufen
const before = (await st()).step; await p.evaluate(() => { const t = performance.now(); while (performance.now() - t < 1500); }); await p.waitForTimeout(800);
console.log('nach Ruckler weiter:', (await st()).step > before);
// Alle Stücke einmal starten
const styles = await p.evaluate(async () => { const { SONGS } = await import('./src/music.js'); return Object.keys(SONGS); });
for (const s of styles) { await p.evaluate(s => window.game.audio.playTheme({ style: s }), s); await p.waitForTimeout(250); }
console.log('Stücke:', styles.length, await st());
console.log('ERR', errs); await b.close();
