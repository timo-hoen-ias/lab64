// Grafik-Effekte: Toon-Shading, Himmel mit Verlauf, Wolken, Wasser, Partikel, Blob-Schatten.
import * as THREE from 'three';

// 3-stufiger Verlauf für MeshToonMaterial → Comic-Look wie bei Banjo-Kazooie
let _grad;
export function toonGradient() {
  if (_grad) return _grad;
  _grad = new THREE.DataTexture(new Uint8Array([90, 90, 90, 255, 175, 175, 175, 255, 255, 255, 255, 255]), 3, 1);
  _grad.minFilter = _grad.magFilter = THREE.NearestFilter; _grad.needsUpdate = true;
  return _grad;
}

// Tageszeiten: Farbstimmung von Himmel, Sonne und Umgebungslicht je Welt
export const TIMES = {
  mittag: { tint: 0xffffff, tintK: 0, sun: 0xfff0d0, sunI: 2.4, hemi: 1.3, sunOff: [18, 34, 12], glow: 0xfff6dd, clouds: 1 },
  nachmittag: { tint: 0xffd9a0, tintK: 0.22, sun: 0xffe2b0, sunI: 2.3, hemi: 1.2, sunOff: [26, 24, 8], glow: 0xffe6b0, clouds: 1 },
  abend: { tint: 0xff9a5a, tintK: 0.5, sun: 0xffa060, sunI: 2.0, hemi: 1.0, sunOff: [34, 13, 6], glow: 0xffb070, clouds: 0.8, topTint: 0x4a5fa8 },
  wolkig: { tint: 0xc8d0d8, tintK: 0.35, sun: 0xf4f0e8, sunI: 1.7, hemi: 1.45, sunOff: [14, 36, 16], glow: 0xffffff, clouds: 2 },
};

// Himmelskuppel mit Verlauf: Zenit kräftig, Horizont hell (Nebel nutzt die Horizontfarbe).
// Mit time (siehe TIMES) zusätzlich Sonnenscheibe mit Schein und Dunst über dem Horizont.
export function makeSky(color, dark = false, time = null) {
  const base = new THREE.Color(color), hsl = {}; base.getHSL(hsl);
  const top = new THREE.Color().setHSL(hsl.h, Math.min(1, hsl.s * 1.1), Math.max(0, hsl.l * (dark ? 0.55 : 0.72)));
  const horizon = new THREE.Color().setHSL(hsl.h, hsl.s * 0.7, Math.min(0.94, hsl.l + (dark ? 0.06 : 0.14)));
  const T = time && TIMES[time];
  if (T) { horizon.lerp(new THREE.Color(T.tint), T.tintK); if (T.topTint) top.lerp(new THREE.Color(T.topTint), 0.45); }
  const sunDir = new THREE.Vector3(...(T ? T.sunOff : [18, 34, 12])).normalize();
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: top }, horizon: { value: horizon }, sunDir: { value: sunDir }, glow: { value: new THREE.Color(T ? T.glow : 0xffffff) }, sunOn: { value: T ? 1 : 0 } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform vec3 top; uniform vec3 horizon; uniform vec3 sunDir; uniform vec3 glow; uniform float sunOn; varying vec3 vP;
      void main(){
        float h = clamp(vP.y * 1.6, 0.0, 1.0);
        vec3 c = mix(horizon, top, pow(h, 0.8));
        c = mix(c, horizon * 1.04, smoothstep(0.12, 0.0, abs(vP.y)) * 0.5 * sunOn); // Dunstband am Horizont
        float d = max(dot(normalize(vP), sunDir), 0.0);
        c += glow * (pow(d, 8.0) * 0.35 + pow(d, 64.0) * 0.6) * sunOn; // Schein
        c = mix(c, vec3(1.0, 0.98, 0.9), smoothstep(0.9975, 0.999, d) * sunOn); // Scheibe
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(480, 32, 16), mat);
  sky.renderOrder = -1; sky.frustumCulled = false; sky.userData.follow = true;
  return { mesh: sky, horizon, top, sunDir, T };
}

// Gras und Blumen als Instanzen; wiegen sich im Wind (Vertex-Shader). points = [[x,y,z], ...]
export function makeGrass(points, colors = [0x7ccf5a, 0x8fdc66, 0x69bd4c], flowers = 0.07) {
  const g = new THREE.Group(), uni = { uTime: { value: 0 } };
  const wind = mat => { mat.onBeforeCompile = sh => { sh.uniforms.uTime = uni.uTime; sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vec4 wp = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);\n transformed.x += sin(uTime * 2.0 + wp.x * 0.3 + wp.z * 0.2) * 0.12 * position.y;\n transformed.z += cos(uTime * 1.6 + wp.x * 0.2) * 0.06 * position.y;'); }; return mat; };
  // Büschel: drei schmale gekreuzte Blätter
  const pos = []; for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI, c = Math.cos(a) * 0.14, s2 = Math.sin(a) * 0.14, lean = (i - 1) * 0.08; pos.push(-c * 0.7, 0, -s2 * 0.7, c * 0.7, 0, s2 * 0.7, lean, 0.34, 0); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.computeVertexNormals();
  const grass = [], flw = []; points.forEach(p => (Math.random() < flowers ? flw : grass).push(p));
  const im = new THREE.InstancedMesh(geo, wind(new THREE.MeshLambertMaterial({ color: 0xffffff, side: THREE.DoubleSide })), Math.max(1, grass.length));
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3(), c = new THREE.Color();
  grass.forEach((p, i) => { const s = 0.6 + Math.random() * 0.6; m4.compose(v.set(...p), q.setFromEuler(e.set(0, Math.random() * 6.3, 0)), sc.set(s, s, s)); im.setMatrixAt(i, m4); im.setColorAt(i, c.set(colors[i % colors.length])); });
  im.count = grass.length; im.receiveShadow = true; g.add(im);
  if (flw.length) {
    const fm = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.09, 0), wind(new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0x222222 })), flw.length), fc = [0xff9ff3, 0xfeca57, 0xffffff, 0xff6b6b, 0x48dbfb];
    flw.forEach((p, i) => { m4.compose(v.set(p[0], p[1] + 0.25, p[2]), q.identity(), sc.set(1, 1, 1)); fm.setMatrixAt(i, m4); fm.setColorAt(i, c.set(fc[i % fc.length])); }); g.add(fm);
  }
  g.userData.update = dt => { uni.uTime.value += dt; };
  return g;
}

// Fernkulisse: Ring aus Silhouetten weit hinter der Karte (Berge, Hügel, Stadt, Meer), in Dunstfarbe getönt
export function makeBackdrop(kind, horizon, top, radius = 400) {
  const g = new THREE.Group(); g.userData.follow = true;
  const tone = { berge: 0x60709a, huegel: 0x5f9a5c, wald: 0x4f8a55, stadt: 0x7a88a6, meer: 0x6f9a70 }[kind] ?? 0x708090;
  const layer = (n, minH, maxH, r, k, build) => {
    const col = new THREE.Color(tone).lerp(horizon, 1 - k * 1.3); // je weiter weg, desto mehr Dunst
    const mat = new THREE.MeshBasicMaterial({ color: col, fog: false });
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + Math.random() * 0.1, m = build(mat, minH + Math.random() * (maxH - minH)); m.position.set(Math.cos(a) * r, 0, Math.sin(a) * r); m.rotation.y = -a; g.add(m); }
  };
  const peak = (mat, h, w = h * 1.6) => { const m = new THREE.Mesh(new THREE.ConeGeometry(w, h, 5), mat); m.position.y = h / 2 - 4; return m; };
  const wrap = (m) => { const o = new THREE.Group(); o.add(m); return o; };
  if (kind === 'berge') { layer(26, 50, 95, radius, 0.35, (m, h) => wrap(peak(m, h))); layer(34, 22, 40, radius * 0.86, 0.55, (m, h) => wrap(peak(m, h, h * 2.4))); }
  if (kind === 'huegel' || kind === 'wald') {
    layer(30, 18, 34, radius, 0.3, (m, h) => { const s = new THREE.Mesh(new THREE.SphereGeometry(h * 1.8, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), m); s.scale.y = 0.55; s.position.y = -3; return wrap(s); });
    if (kind === 'wald') layer(90, 10, 20, radius * 0.85, 0.6, (m, h) => wrap(peak(m, h, h * 0.35)));
  }
  if (kind === 'stadt') {
    layer(70, 18, 70, radius, 0.35, (m, h) => { const b = new THREE.Mesh(new THREE.BoxGeometry(14 + Math.random() * 14, h, 14), m); b.position.y = h / 2 - 3; return wrap(b); });
    layer(24, 20, 30, radius * 1.05, 0.15, (m, h) => wrap(peak(m, h, h * 2.2)));
  }
  if (kind === 'meer') { // Meer bis zum Horizont: große Wasserscheibe unter der Kulisse
    const sea = new THREE.Mesh(new THREE.CircleGeometry(radius * 1.2, 48), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x2d8fd5).lerp(horizon, 0.35), fog: false }));
    sea.rotation.x = -Math.PI / 2; sea.position.y = -0.4; g.add(sea);
    layer(6, 25, 45, radius, 0.3, (m, h) => wrap(peak(m, h, h * 3)));
  }
  return g;
}

// Vogelschwarm, der weit oben kreist, und ab und zu ein Flugzeug mit Kondensstreifen
export function makeSkyLife(radius) {
  const g = new THREE.Group(), birds = [], mat = new THREE.MeshBasicMaterial({ color: 0x2d3436, side: THREE.DoubleSide, fog: false });
  const wingGeo = new THREE.BufferGeometry(); wingGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, -0.9, 0.25, -0.3, 0, 0, -0.5, 0, 0, 0, 0.9, 0.25, -0.3, 0, 0, -0.5], 3));
  for (let i = 0; i < 7; i++) { const b = new THREE.Mesh(wingGeo, mat); b.userData = { a: i * 0.18, r: radius * 0.35 + (i % 3) * 3, h: 45 + (i % 2) * 3, ph: i }; g.add(b); birds.push(b); }
  const plane = new THREE.Group(); plane.add(new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false })), new THREE.Mesh(new THREE.BoxGeometry(7, 0.2, 1.4), new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false })));
  const trail = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 1), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, fog: false })); trail.position.z = -0.5; trail.geometry.translate(0, 0, -0.5);
  plane.add(trail); g.add(plane); let pt = 0;
  g.userData.update = (dt, t) => {
    birds.forEach(b => { const u = b.userData, a = u.a + t * 0.12; b.position.set(Math.cos(a) * u.r, u.h + Math.sin(t + u.ph) * 0.8, Math.sin(a) * u.r); b.rotation.y = -a; b.scale.set(1, 1 + Math.sin(t * 9 + u.ph) * 0.5, 1); });
    pt += dt; const k = (pt % 60) / 40; plane.visible = k < 1; // alle 60 s ein Überflug von 40 s
    plane.position.set(-radius * 1.2 + k * radius * 2.4, 120, radius * 0.4); plane.rotation.y = Math.PI / 2; trail.scale.z = Math.min(160, k * 400) || 0.01;
  };
  return g;
}

// Low-Poly-Wolken, die langsam ziehen (scale > 1 = große, ferne Wolkenbänke)
export function makeClouds(n, radius, height, scale = 1) {
  const g = new THREE.Group(), geo = new THREE.IcosahedronGeometry(1, 0);
  const mat = new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true, emissive: 0x9fb4c8, emissiveIntensity: 0.35 });
  for (let i = 0; i < n; i++) {
    const c = new THREE.Group(), puffs = 3 + Math.floor(Math.random() * 3);
    for (let k = 0; k < puffs; k++) {
      const m = new THREE.Mesh(geo, mat), s = (2.2 + Math.random() * 2.2) * scale;
      m.scale.set(s * 1.3, s * 0.75, s); m.position.set((k - puffs / 2) * 2.6 * scale, Math.random() * 1.2 * scale, (Math.random() - 0.5) * 2.5 * scale); c.add(m);
    }
    const a = Math.random() * Math.PI * 2, r = radius * (0.5 + Math.random() * 0.6);
    c.position.set(Math.cos(a) * r, height + Math.random() * 14, Math.sin(a) * r); c.rotation.y = Math.random() * Math.PI;
    c.userData.speed = 0.6 + Math.random() * 0.8; c.userData.range = radius * 1.2;
    g.add(c);
  }
  g.userData.update = dt => g.children.forEach(c => { c.position.x += c.userData.speed * dt; if (c.position.x > c.userData.range) c.position.x = -c.userData.range; });
  return g;
}

// Wasser mit Wellen (Vertex-Animation im Shader des Lambert-Materials)
export function makeWater(color, size) {
  const geo = new THREE.PlaneGeometry(size * 2.4, size * 2.4, 48, 48);
  const mat = new THREE.MeshLambertMaterial({ color, flatShading: true, emissive: color, emissiveIntensity: 0.15 });
  const uni = { uTime: { value: 0 } };
  mat.onBeforeCompile = sh => {
    sh.uniforms.uTime = uni.uTime;
    sh.vertexShader = 'uniform float uTime;\nvarying vec2 vW;\n' + sh.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\n transformed.z += sin(position.x * 0.35 + uTime * 1.6) * 0.18 + cos(position.y * 0.3 + uTime * 1.2) * 0.14;\n vW = position.xy;');
    // Glitzern: helle Wellenkämme, die über das Wasser wandern
    sh.fragmentShader = 'uniform float uTime;\nvarying vec2 vW;\n' + sh.fragmentShader.replace('#include <dithering_fragment>',
      '#include <dithering_fragment>\n float sp = sin(vW.x * 1.3 + uTime * 1.5) * sin(vW.y * 1.1 - uTime * 1.2) + sin(vW.x * 0.4 - vW.y * 0.5 + uTime * 0.7) * 0.4;\n gl_FragColor.rgb += vec3(0.85, 0.95, 1.0) * smoothstep(1.05, 1.3, sp) * 0.45;');
  };
  const m = new THREE.Mesh(geo, mat); m.rotation.x = -Math.PI / 2; m.position.y = -0.15; m.receiveShadow = true;
  m.userData.update = dt => { uni.uTime.value += dt; };
  return m;
}

// Runder Schatten unter Figuren – zeigt beim Springen, wo man landet
let _blobTex;
export function makeBlobShadow(r = 0.8) {
  if (!_blobTex) {
    const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
    const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(0,0,0,0.4)'); gr.addColorStop(0.6, 'rgba(0,0,0,0.2)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = gr; x.fillRect(0, 0, 64, 64); _blobTex = new THREE.CanvasTexture(c);
  }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 2), new THREE.MeshBasicMaterial({ map: _blobTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
  m.rotation.x = -Math.PI / 2; m.renderOrder = 1;
  return m;
}

// Partikelsystem: ein InstancedMesh für alles (Staub, Krümel-Funken, Sterne, Wasser-Spritzer)
const MAX = 400;
export class Particles {
  constructor() {
    this.mesh = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.5, 0), new THREE.MeshBasicMaterial({ color: 0xffffff, fog: true }), MAX);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); this.mesh.frustumCulled = false; this.mesh.count = 0;
    this.mesh.setColorAt(0, new THREE.Color()); // instanceColor anlegen
    this.p = []; this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._e = new THREE.Euler(); this._s = new THREE.Vector3(); this._c = new THREE.Color();
  }
  attach(scene) { this.p.length = 0; this.mesh.count = 0; if (this.mesh.parent) this.mesh.parent.remove(this.mesh); scene.add(this.mesh); }
  detach() { if (this.mesh.parent) this.mesh.parent.remove(this.mesh); }

  // o: n, color (Zahl oder Liste), speed, up, life, size, gravity, spread (Startradius)
  burst(pos, o = {}) {
    const n = o.n || 10, cols = [].concat(o.color ?? 0xffffff);
    for (let i = 0; i < n && this.p.length < MAX; i++) {
      const a = Math.random() * Math.PI * 2, el = Math.random() * (o.flat ? 0.3 : 1), sp = (o.speed ?? 4) * (0.5 + Math.random() * 0.7);
      this.p.push({
        x: pos.x + Math.cos(a) * (o.spread || 0), y: pos.y, z: pos.z + Math.sin(a) * (o.spread || 0),
        vx: Math.cos(a) * sp * Math.cos(el), vy: (o.up ?? 3) * (0.6 + Math.random() * 0.8) + Math.sin(el) * sp * 0.5, vz: Math.sin(a) * sp * Math.cos(el),
        life: (o.life || 0.7) * (0.7 + Math.random() * 0.6), max: 0, size: (o.size || 0.25) * (0.6 + Math.random() * 0.8),
        g: o.gravity ?? -12, drag: o.drag ?? 2, floor: o.floor ?? 0.02, rx: Math.random() * 6, ry: Math.random() * 6, spin: (Math.random() - 0.5) * 12,
        color: cols[Math.floor(Math.random() * cols.length)],
      });
      const q = this.p[this.p.length - 1]; q.max = q.life;
    }
  }

  update(dt) {
    let w = 0;
    for (const q of this.p) {
      q.life -= dt; if (q.life <= 0) continue;
      q.vy += q.g * dt; const d = Math.max(0, 1 - q.drag * dt); q.vx *= d; q.vz *= d;
      q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt; if (q.y < q.floor && q.vy < 0) { q.y = q.floor; q.vy *= -0.3; }
      q.rx += q.spin * dt; q.ry += q.spin * dt * 0.7;
      const k = q.life / q.max, s = q.size * Math.min(1, k * 2.5);
      this._q.setFromEuler(this._e.set(q.rx, q.ry, 0));
      this._m.makeRotationFromQuaternion(this._q).scale(this._s.set(s, s, s)).setPosition(q.x, q.y, q.z);
      this.mesh.setMatrixAt(w, this._m); this.mesh.setColorAt(w, this._c.set(q.color));
      this.p[w++] = q;
    }
    this.p.length = w; this.mesh.count = w;
    if (w) { this.mesh.instanceMatrix.needsUpdate = true; this.mesh.instanceColor.needsUpdate = true; }
  }
}

// Fertige Effekt-Rezepte
export const FX = {
  dust: (pt, pos, n = 8) => pt.burst(pos, { n, color: [0xe8dcc8, 0xd8c8a8, 0xffffff], speed: 3, up: 1.2, life: 0.5, size: 0.28, gravity: -2, flat: true, spread: 0.3 }),
  crumb: (pt, pos) => pt.burst(pos, { n: 10, color: [0xffe08a, 0xffffff, 0xffb347], speed: 3.5, up: 4, life: 0.6, size: 0.16 }),
  food: (pt, pos) => pt.burst(pos, { n: 22, color: [0xffd93d, 0xff6b6b, 0xffffff, 0x6bcbff], speed: 5, up: 6, life: 0.9, size: 0.22 }),
  gold: (pt, pos) => { pt.burst(pos, { n: 40, color: [0xffcc33, 0xfff3a0, 0xffd700], speed: 7, up: 8, life: 1.4, size: 0.18, gravity: -6 }); pt.burst(pos, { n: 16, color: 0xffffff, speed: 10, up: 1, life: 0.5, size: 0.1, gravity: 0, flat: true }); },
  hit: (pt, pos) => pt.burst(pos, { n: 18, color: [0xffffff, 0xffe066, 0xff6b6b], speed: 8, up: 3, life: 0.45, size: 0.22, gravity: -4 }),
  bite: (pt, pos) => pt.burst(pos, { n: 5, color: 0xffffff, speed: 3, up: 1, life: 0.25, size: 0.14, gravity: 0 }),
  splash: (pt, pos) => pt.burst(pos, { n: 20, color: [0x9ad7ff, 0xffffff, 0x4fa3ff], speed: 3, up: 7, life: 0.8, size: 0.22, gravity: -18 }),
  sparkle: (pt, pos) => pt.burst(pos, { n: 1, color: [0xfff3a0, 0xffffff], speed: 0.6, up: 1.2, life: 0.8, size: 0.14, gravity: 0, spread: 0.6 }),
};

// Teich: Wasserfläche als Ellipse mit leichten Wellen, dazu Becken (Wand + Grund)
export function makePond(rx, rz, depth = 1.8) {
  const g = new THREE.Group(), uni = { uTime: { value: 0 } };
  const wm = new THREE.MeshLambertMaterial({ color: 0x3fa9f5, transparent: true, opacity: 0.82, emissive: 0x1e6fb0, emissiveIntensity: 0.25, flatShading: true, side: THREE.DoubleSide }); // von unten sichtbar beim Tauchen
  wm.onBeforeCompile = sh => {
    sh.uniforms.uTime = uni.uTime;
    sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\n transformed.z += sin(position.x * 4.0 + uTime * 2.0) * 0.012 + cos(position.y * 5.0 + uTime * 1.5) * 0.01;');
  };
  const water = new THREE.Mesh(new THREE.RingGeometry(0, 1, 48, 6), wm); // Ring mit Radius 0 = Scheibe mit mehr Vertices für Wellen
  water.rotation.x = -Math.PI / 2; water.scale.set(rx, rz, 1); water.position.y = -0.25; water.renderOrder = 2; g.add(water);
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, depth, 40, 1, true), new THREE.MeshToonMaterial({ color: 0x8d7b5a, gradientMap: toonGradient(), side: THREE.BackSide }));
  wall.scale.set(rx, 1, rz); wall.position.y = -depth / 2; g.add(wall);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(1, 40), new THREE.MeshToonMaterial({ color: 0xd8c38a, gradientMap: toonGradient() }));
  floor.rotation.x = -Math.PI / 2; floor.scale.set(rx, rz, 1); floor.position.y = -depth + 0.01; g.add(floor);
  g.userData.update = dt => { uni.uTime.value += dt; };
  return g;
}

// Portal-Scheibe: Spiralstrudel in der Weltfarbe (Shader)
export function makePortalDisk(color, r = 1.45) {
  const mat = new THREE.ShaderMaterial({
    transparent: true, side: THREE.DoubleSide, depthWrite: false,
    uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(color) }, uLocked: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform float uTime; uniform vec3 uColor; uniform float uLocked; varying vec2 vUv;
      void main(){
        vec2 p = vUv * 2.0 - 1.0; float r = length(p); if (r > 1.0) discard;
        float a = atan(p.y, p.x);
        float sp = sin(a * 3.0 + r * 10.0 - uTime * 3.0) * 0.5 + 0.5;
        float sp2 = sin(a * 5.0 - r * 14.0 + uTime * 2.0) * 0.5 + 0.5;
        vec3 c = mix(uColor * 0.6, mix(uColor, vec3(1.0), 0.6), sp * 0.7 + sp2 * 0.3);
        c += vec3(1.0) * pow(1.0 - r, 3.0) * 0.8;
        vec3 grey = vec3(dot(c, vec3(0.3, 0.59, 0.11))) * 0.45;
        c = mix(c, grey, uLocked);
        float alpha = mix(0.92, 0.6, uLocked) * smoothstep(1.0, 0.85, r);
        gl_FragColor = vec4(c, alpha);
      }`,
  });
  const m = new THREE.Mesh(new THREE.CircleGeometry(r, 40), mat);
  m.userData.update = (dt, locked) => { mat.uniforms.uTime.value += dt * (locked ? 0.25 : 1); mat.uniforms.uLocked.value = locked ? 1 : 0; };
  return m;
}

// Lichtstrahlen unter Wasser: schräge, schwach leuchtende Bahnen von der Oberfläche nach unten
export function makeLightShafts() {
  const g = new THREE.Group(), mat = new THREE.MeshBasicMaterial({ color: 0xbff0ff, transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
  for (let i = 0; i < 9; i++) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.6 + Math.random() * 0.8, 1.6 + Math.random(), 18, 8, 1, true), mat);
    const a = Math.random() * Math.PI * 2, r = 3 + Math.random() * 12; m.position.set(Math.cos(a) * r, -9, Math.sin(a) * r); m.rotation.z = 0.25; m.userData.ph = Math.random() * 6; g.add(m);
  }
  g.userData.update = t => g.children.forEach(m => { m.scale.x = m.scale.z = 1 + Math.sin(t * 0.8 + m.userData.ph) * 0.25; });
  return g;
}

// Luftblasen-Säule: steigt vom Grund auf, Moll tankt darin Luft
export function makeBubbleColumn(h) {
  const g = new THREE.Group(), mat = new THREE.MeshLambertMaterial({ color: 0xe6fbff, transparent: true, opacity: 0.75, emissive: 0x6fc9e8, emissiveIntensity: 0.4 });
  for (let i = 0; i < 14; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.12 + Math.random() * 0.14, 8, 6), mat); b.userData = { y: Math.random() * h, s: 1.2 + Math.random() * 1.2, ph: Math.random() * 6 }; g.add(b); }
  g.userData.update = (dt, t) => g.children.forEach(b => { const u = b.userData; u.y = (u.y + u.s * dt) % h; b.position.set(Math.sin(t * 2 + u.ph) * 0.25, u.y, Math.cos(t * 1.7 + u.ph) * 0.25); });
  return g;
}

// Durchsicht: Was zwischen Kamera und Moll liegt (Wände, Regale, Decken), bekommt ein gerastertes Loch,
// damit man den Hund immer sieht. Ein Kegel von der Kamera zu Moll, Böden auf Molls Höhe bleiben stehen.
export const SEE_THROUGH = { uCutA: { value: new THREE.Vector3() }, uCutB: { value: new THREE.Vector3() }, uCutR: { value: 0 }, uCutFeet: { value: -1e9 } };
export function addSeeThrough(mat) {
  if (mat.userData.seeThrough || mat.transparent) return; mat.userData.seeThrough = true;
  const prev = mat.onBeforeCompile, prevKey = mat.customProgramCacheKey;
  mat.onBeforeCompile = (sh, r) => {
    prev.call(mat, sh, r); Object.assign(sh.uniforms, SEE_THROUGH);
    sh.vertexShader = 'varying vec3 vCutPos;\n' + sh.vertexShader.replace('#include <project_vertex>', `#include <project_vertex>
 vec4 cutP = vec4(transformed, 1.0);
 #ifdef USE_INSTANCING
 cutP = instanceMatrix * cutP;
 #endif
 vCutPos = (modelMatrix * cutP).xyz;`);
    sh.fragmentShader = 'uniform vec3 uCutA, uCutB;\nuniform float uCutR, uCutFeet;\nvarying vec3 vCutPos;\n' + sh.fragmentShader.replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
 if (uCutR > 0.0 && vCutPos.y > uCutFeet) {
  vec3 ab = uCutB - uCutA; float len = length(ab), t = dot(vCutPos - uCutA, ab) / (len * len);
  if (t > 0.0 && t * len < len - 1.2) {
   float k = length(vCutPos - uCutA - ab * t) / (t * uCutR);
   float dith = fract(dot(floor(gl_FragCoord.xy), vec2(0.5, 0.25)) + floor(gl_FragCoord.y * 0.5) * 0.5);
   if (k < 0.7 || (k < 1.0 && dith < (1.0 - k) / 0.3)) discard;
  }
 }`);
  };
  mat.customProgramCacheKey = () => (prevKey ? prevKey.call(mat) : '') + '|see';
}
