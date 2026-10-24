// Vorschaubilder für die Portale im Garten: rendert jede Welt vom Startpunkt aus (ohne HUD und ohne Moll) nach previews/<welt>.jpg.
// Aufruf: node tests/previews.mjs   Server auf Port 8077.
import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 384, height: 384 } });
await p.goto('http://localhost:8077/index.html'); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(1200);
await p.evaluate(() => window.game.intro.skip()); await p.click('#btnStart');
await p.evaluate(() => { window.game.dialog.auto = true; window.game.save.settings.quality = 'hoch'; });
await p.addStyleTag({ content: 'body * { visibility: hidden !important } canvas { visibility: visible !important }' });
for (const key of ['kueche', 'strasse', 'buero', 'park', 'rattenrennen', 'strand', 'hafen', 'dorf', 'kanal']) {
  await p.evaluate(k => window.game.enterLevel(k, true), key); await p.waitForTimeout(2500);
  await p.evaluate(() => { const g = window.game; [g.player.mesh, g.player.shadow].forEach(m => m && m.traverse(o => o.layers.set(1))); g.camPitch = 0.28; g.snapCam = true; });
  await p.waitForTimeout(1200);
  await p.screenshot({ path: `previews/${key}.jpg`, type: 'jpeg', quality: 72 });
  console.log(key);
}
await b.close();
