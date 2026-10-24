// Intro-Test: „MOLLY“ → Y fällt → „MOLL“, Überspringen startet nicht gleich das Spiel. Server auf Port 8077.
import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 800, height: 450 } });
const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
const st = () => p.evaluate(() => ({ st: window.game.intro.state, h1: [...document.querySelector('#menu h1').childNodes].filter(n => !n.matches?.('small,.gone')).map(n => n.textContent).join(''), paused: window.game.paused, fallY: !!document.querySelector('.fallY') }));
await p.goto('http://localhost:8077/index.html'); await p.waitForTimeout(1200);
console.log('wartet:', await st());
// Ablauf Schritt für Schritt (Uhr festhalten, der Software-Renderer ist zu langsam für Echtzeit)
await p.mouse.click(400, 225); await p.evaluate(() => { const i = window.game.intro; i._now = () => i.pos; });
for (const s of [10, 25, 31, 36]) { await p.evaluate(s => { window.game.intro.pos = s; }, s); await p.waitForTimeout(1000); console.log(`Achtel ${s}:`, await st()); }
// Echtzeit mit Ton, dann per Leertaste überspringen
await p.reload(); await p.waitForTimeout(1200); await p.keyboard.press('Space'); await p.waitForTimeout(1500);
console.log('Musik läuft:', await p.evaluate(() => ({ step: window.game.audio.song?.step, ctx: window.game.audio.ctx.state })));
await p.keyboard.press('Space'); await p.waitForTimeout(600);
console.log('übersprungen:', await st(), 'Menü-Musik:', await p.evaluate(async () => { const { SONGS } = await import('./src/music.js'); return window.game.audio.song?.def === SONGS.menu; }));
await p.click('#btnStart'); await p.waitForTimeout(800);
console.log('Spiel gestartet → Level-Musik:', await p.evaluate(async () => { const { SONGS } = await import('./src/music.js'); return { paused: window.game.paused, garten: window.game.audio.song?.def === SONGS.garden }; }));
// Ohne Überspringen: nach dem Schlussakkord geht es in die Menü-Musik über, die in Schleife läuft
await p.reload(); await p.waitForTimeout(1200); await p.mouse.click(400, 225);
await p.waitForFunction(() => window.game.audio.song?.def.bpm === 116, null, { timeout: 40000 }); // Menü-Stück (116 bpm)
console.log('Menü-Musik nach dem Intro:', await p.evaluate(() => window.game.intro.state)); await p.waitForTimeout(4000);
console.log('Menü-Musik läuft weiter (Schleife, kein once):', await p.evaluate(() => ({ step: window.game.audio.song.step, once: !!window.game.audio.song.def.once })));
console.log('ERR', errs); await b.close();
