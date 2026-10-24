// Dialog-Test: Gibt es jedes Gespräch, das der Code aufruft, und hat jeder Sprecher eine Stimme?
// Dann im Spiel: Opa Bruno im Garten anquatschen – Spiel hält an, Text tippt sich, die Stimme blubbert, SPRUNG blättert weiter,
// am Ende kommt die Fähigkeitskarte. Beim zweiten Mal nur ein kurzer Spruch nebenbei. Platzhalter {n} werden ersetzt.
// Aufruf: node tests/dialog.mjs [screenshot-ordner]   Server auf Port 8077.
import { readFileSync, readdirSync } from 'fs';
import { chromium } from 'playwright';
const out = process.argv[2];
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 800, height: 450 } });
const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' || /Dialog fehlt/.test(m.text())) errs.push(m.text()); });
await p.goto('http://localhost:8077/index.html'); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(1200);
const ev = (f, a) => p.evaluate(f, a), W = ms => p.waitForTimeout(ms);
// Tasten lange genug halten: der Software-Renderer schafft nur wenige Bilder pro Sekunde
const frames = (n = 2) => ev(n => new Promise(r => { const f = () => --n ? requestAnimationFrame(f) : r(); requestAnimationFrame(f); }), n);
const key = async k => { await p.keyboard.down(k); await frames(3); await p.keyboard.up(k); await frames(2); };
const fails = []; const check = (name, ok, info = '') => { console.log(`${ok ? '✓' : '✗'} ${name}`, info); if (!ok) fails.push(name); };

// ---- Statisch: alle aufgerufenen IDs vorhanden, alle Sprecher mit Stimme
const src = ['src/game.js', 'src/level.js', 'src/bosses.js', 'src/runner.js', 'src/abilities.js', ...readdirSync('src/worlds').map(f => 'src/worlds/' + f)].map(f => readFileSync(f, 'utf8')).join('\n');
const ids = new Set([...src.matchAll(/talk\('([\w.]+)'/g)].map(m => m[1]).filter(id => !id.endsWith('.')));
for (const m of src.matchAll(/talk\(g\.has\('\w+'\) \? '([\w.]+)' : '([\w.]+)'/g)) { ids.add(m[1]); ids.add(m[2]); }
const info = await ev(async ids => {
  const D = await import('./src/dialog.js'), A = await import('./src/abilities.js');
  const all = [...ids, ...Object.keys(A.ABILITIES).filter(a => a !== 'tauchen').map(a => 'bruno.' + a), ...['kueche', 'strasse', 'buero', 'strand', 'hafen', 'dorf', 'kanal'].map(k => 'boss.' + k)];
  const missing = all.filter(id => !D.TALKS[id]);
  const speakers = new Set(Object.values(D.TALKS).flatMap(t => [...(t.first || []), ...(t.again || [])]).map(l => l[0]));
  return { n: Object.keys(D.TALKS).length, lines: Object.values(D.TALKS).reduce((s, t) => s + (t.first || []).length + (t.again || []).length, 0), missing, mute: [...speakers].filter(s => !D.VOICES[s]), speakers: speakers.size };
}, [...ids]);
check('alle Gespräche vorhanden', !info.missing.length, `${info.n} Gespräche, ${info.lines} Zeilen, ${info.speakers} Sprecher ${info.missing.join(' ')}`);
check('jeder Sprecher hat eine Stimme', !info.mute.length, info.mute.join(', '));

// ---- Im Spiel: Opa Bruno im Garten
await p.evaluate(() => window.game.intro.skip()); await p.click('#btnStart'); await W(300);
await ev(() => { const a = window.game.audio; a.init(); window.blubs = []; const o = a.blub.bind(a); a.blub = (v, vo, st, l, t) => { window.blubs.push([v.base, vo, st]); o(v, vo, st, l, t); }; });
const br = await ev(() => { const b = window.game.level.bruno; return [b.x, b.y, b.z]; });
await ev(([x, y, z]) => { const pl = window.game.player; pl.pos.set(x + 2.5, y + 0.2, z); pl.vel.set(0, 0, 0); }, br); await W(800);
const st = () => ev(() => { const d = window.game.dialog, el = document.getElementById('dialog'); return { open: d.open, cls: el.className, name: el.querySelector('.name').textContent, shown: el.querySelector('.shown').textContent, full: d.line?.text || '', i: d.i, q: d.queue.length }; });
let s = await st();
check('Gespräch mit Opa Bruno startet', s.open && s.name === 'Opa Bruno', s.cls);
const p0 = await ev(() => window.game.player.pos.toArray().map(v => +v.toFixed(2)).join());
await p.keyboard.down('KeyW'); await W(600); await p.keyboard.up('KeyW');
check('Spiel steht während des Gesprächs', p0 === await ev(() => window.game.player.pos.toArray().map(v => +v.toFixed(2)).join()));
s = await st(); check('Text erscheint Buchstabe für Buchstabe', s.shown.length > 0 && s.shown.length <= s.full.length, `${s.shown.length}/${s.full.length}`);
const nb = await ev(() => window.blubs.length); check('Stimme blubbert pro Silbe', nb >= 3, `${nb} Silben, Grundton ${await ev(() => window.blubs[0]?.[0])} Hz`);
if (out) await p.screenshot({ path: `${out}/dialog_bruno.png` });
// Erster Druck zeigt alles, zweiter blättert weiter
await key('Space'); s = await st(); check('SPRUNG zeigt den ganzen Satz', s.shown === s.full);
await key('Space'); s = await st(); check('nächste Zeile: Moll antwortet', s.name === 'Moll', s.shown);
await W(1500); if (out) await p.screenshot({ path: `${out}/dialog_moll.png` });
const voices = await ev(() => new Set(window.blubs.map(b => b[0])).size); check('Moll hat eine andere Stimme als Opa', voices >= 2);
for (let k = 0; k < 30 && (await st()).open; k++) { await key('Space'); }
s = await st(); check('Gespräch zu Ende', !s.open);
check('danach Fähigkeitskarte + Fähigkeit', await ev(() => document.getElementById('learn').classList.contains('show') && window.game.has('apportieren')));
await p.keyboard.down('KeyW'); await W(900); await p.keyboard.up('KeyW');
check('Spiel läuft wieder', p0 !== await ev(() => window.game.player.pos.toArray().map(v => +v.toFixed(2)).join()));
// Zweites Mal: nur Spruch nebenbei
await ev(() => window.game.learn('apportieren', true, window.game.level.bruno.mesh)); await W(300);
s = await st(); check('zweites Mal: kurzer Spruch, Spiel läuft', !s.open && s.cls.includes('chat'), s.full);
await W(8000); check('Spruch blendet sich aus', !(await st()).cls.includes('show'));
// Platzhalter
await ev(() => { window.game.save.talked.zwerge = 1; window.game.talk('zwerge', { vars: { n: 2, r: 3 } }); }); await W(200);
s = await st(); check('Platzhalter ersetzt', /[23]/.test(s.full) && !s.full.includes('{'), s.full);
// Boss-Begrüßung beim ersten Mal, Lautstärke über den Effekte-Regler
await ev(() => window.game.enterLevel('kueche')); await W(400);
await ev(() => { const l = window.game.level; l.goal.have = l.goal.need; l.checkGoal(); }); await W(2500);
s = await st(); check('Boss stellt sich in Reimen vor', s.open && s.name === 'Der Staubsauger', s.full);
if (out) { await W(1200); await p.screenshot({ path: `${out}/dialog_boss.png` }); }
const g0 = await ev(() => { const a = window.game.audio; a.setVolume(1, 0); return new Promise(r => setTimeout(() => r(a.sfxGain.gain.value), 300)); });
check('Effekte-Regler auf 0 macht das Blubbern stumm', g0 < 0.01, g0.toFixed(3));
check('keine Fehler', !errs.length, JSON.stringify(errs.slice(0, 5)));
await b.close();
if (fails.length) { console.log('FEHLER:', fails.join(', ')); process.exit(1); }
