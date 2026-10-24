// Flacker-Test (Z-Fighting): sucht in jeder Welt gleich ausgerichtete, deckungsgleiche Flächen verschiedener Farbe.
// Aufruf: node tests/flackern.mjs [maxAbstand=0.012] [minFläche=0.3]   Server auf Port 8077. Bleibt leer, wenn nichts flackern kann.
// Treffer im Inneren von Körpern (z. B. Rampenenden, Mauerecken) sieht man nicht – nur sichtbare Stellen beheben.
import { chromium } from 'playwright';
const GAP = +(process.argv[2] || 0.012), MIN = +(process.argv[3] || 0.3);
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 400, height: 225 } });
p.on('pageerror', e => console.log('ERR', e.message));
await p.goto('http://localhost:8077/index.html'); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(1200);
await p.evaluate(() => window.game.intro.skip()); await p.click('#btnStart'); await p.waitForTimeout(300);
for (const key of ['hub','kueche','strasse','buero','park','strand','hafen','dorf','kanal']) {
  await p.evaluate(k => window.game.enterLevel(k, true), key); await p.waitForTimeout(300);
  const res = await p.evaluate(GAP => {
    const scene = window.game.level.scene, faces = [], v = [0,1,2].map(() => new window.game.camera.position.constructor());
    scene.updateMatrixWorld(true);
    scene.traverse(o => {
      if (!o.isMesh || o.isInstancedMesh || !o.visible) return; const isG = o === window.game.level.groundMesh || !!o.material.polygonOffset;
      let vis = true; o.traverseAncestors(a => { if (!a.visible) vis = false; }); if (!vis) return;
      const g = o.geometry, pos = g.attributes.position, idx = g.index, n = idx ? idx.count : pos.count;
      const mat = [].concat(o.material)[0]; const ds = mat.side === 2;
      let prev = null;
      for (let t = 0; t < n; t += 3) {
        for (let k = 0; k < 3; k++) v[k].fromBufferAttribute(pos, idx ? idx.getX(t + k) : t + k).applyMatrix4(o.matrixWorld);
        const nn = v[1].clone().sub(v[0]).cross(v[2].clone().sub(v[0])); const area = nn.length() / 2; if (area < 1e-6) { prev = null; continue; }
        nn.normalize(); const ax = [0,1,2].find(a => Math.abs(nn.getComponent(a)) > 0.9999); if (ax === undefined) { prev = null; continue; }
        const sg = ds ? 0 : Math.sign(nn.getComponent(ax)), val = v[0].getComponent(ax), [a1, a2] = [0,1,2].filter(a => a !== ax);
        const mn = [Math.min(...v.map(q => q.getComponent(a1))), Math.min(...v.map(q => q.getComponent(a2)))], mx = [Math.max(...v.map(q => q.getComponent(a1))), Math.max(...v.map(q => q.getComponent(a2)))];
        if (prev && prev.ax === ax && prev.sg === sg && Math.abs(prev.val - val) < 1e-4 && prev.mesh === o.id && !prev.paired) {
          const umn = [Math.min(mn[0], prev.mn[0]), Math.min(mn[1], prev.mn[1])], umx = [Math.max(mx[0], prev.mx[0]), Math.max(mx[1], prev.mx[1])];
          if (Math.abs((umx[0]-umn[0])*(umx[1]-umn[1]) - (area + prev.area)) < 1e-3) { prev.mn = umn; prev.mx = umx; prev.area += area; prev.paired = true; prev.poly = [[umn[0],umn[1]],[umx[0],umn[1]],[umx[0],umx[1]],[umn[0],umx[1]]]; continue; }
        }
        prev = { id: faces.length, ax, sg, val, mn, mx, area, poly: v.map(q => [q.getComponent(a1), q.getComponent(a2)]), mesh: o.id, name: (o.parent && o.parent !== scene ? 'grp:' : '') + (mat.type) + '#' + mat.color?.getHexString(), paired: false, tri: true, ground: isG };
        faces.push(prev);
      }
    });
    const sat = (A, B) => { for (const P of [A, B]) for (let i = 0; i < P.length; i++) { const p0 = P[i], p1 = P[(i + 1) % P.length], nx = p1[1] - p0[1], ny = p0[0] - p1[0], L = Math.hypot(nx, ny); if (L < 1e-9) continue; const pr = Q => Q.map(q => (q[0] * nx + q[1] * ny) / L); const a = pr(A), b = pr(B); const ov = Math.min(Math.max(...a), Math.max(...b)) - Math.max(Math.min(...a), Math.min(...b)); if (ov < 0.03) return false; } return true; };
    const out = [], buckets = new Map();
    for (const f of faces) { const k = f.ax + ':' + Math.round(f.val * 10); (buckets.get(k) || buckets.set(k, []).get(k)).push(f); }
    for (const f of faces) for (const d of [-1, 0, 1]) {
      const L = buckets.get(f.ax + ':' + (Math.round(f.val * 10) + d)); if (!L) continue;
      for (const h of L) {
        if (h === f || h.id < f.id) continue; if (f.sg && h.sg && f.sg !== h.sg) continue;
        const gap = Math.abs(f.val - h.val); if (gap > GAP) continue;
        const ox = Math.min(f.mx[0], h.mx[0]) - Math.max(f.mn[0], h.mn[0]), oy = Math.min(f.mx[1], h.mx[1]) - Math.max(f.mn[1], h.mn[1]);
        if (ox > 0.02 && oy > 0.02 && ox * oy > 0.01 && sat(f.poly, h.poly) && !(f.sg < 0 && f.ax === 1) && f.name.split('#')[1] !== h.name.split('#')[1] && !f.ground && !h.ground) out.push({ gap: +gap.toFixed(4), ax: 'xyz'[f.ax], val: +f.val.toFixed(3), a: f.name, b: h.name, at: [((Math.max(f.mn[0], h.mn[0]) + Math.min(f.mx[0], h.mx[0])) / 2).toFixed(1), ((Math.max(f.mn[1], h.mn[1]) + Math.min(f.mx[1], h.mx[1])) / 2).toFixed(1)], area: +(ox*oy).toFixed(2) });
      }
    }
    return out;
  }, GAP).catch(e => 'ERR ' + e.message);

  if (!Array.isArray(res)) console.log(key, res);
  else if (res.some(r => r.area >= MIN)) console.log('==', key);
  if (Array.isArray(res)) { res.splice(0, res.length, ...res.filter(r => r.area >= MIN)); const seen = new Set(); for (const r of res.sort((a, b) => b.area - a.area)) { const k = r.a + r.b + r.ax + r.val; if (seen.has(k)) continue; seen.add(k); console.log(JSON.stringify(r)); } }
}
await b.close();
