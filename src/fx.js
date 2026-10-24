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

// Himmelskuppel mit Verlauf: Zenit kräftig, Horizont hell (Nebel nutzt die Horizontfarbe)
export function makeSky(color, dark = false) {
  const base = new THREE.Color(color), hsl = {}; base.getHSL(hsl);
  const top = new THREE.Color().setHSL(hsl.h, Math.min(1, hsl.s * 1.1), Math.max(0, hsl.l * (dark ? 0.55 : 0.72)));
  const horizon = new THREE.Color().setHSL(hsl.h, hsl.s * 0.7, Math.min(0.94, hsl.l + (dark ? 0.06 : 0.14)));
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: top }, horizon: { value: horizon } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 top; uniform vec3 horizon; varying vec3 vP; void main(){ float h = clamp(vP.y * 1.6, 0.0, 1.0); gl_FragColor = vec4(mix(horizon, top, pow(h, 0.8)), 1.0); }',
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(250, 24, 12), mat);
  sky.renderOrder = -1; sky.frustumCulled = false; sky.userData.follow = true;
  return { mesh: sky, horizon };
}

// Low-Poly-Wolken, die langsam ziehen
export function makeClouds(n, radius, height) {
  const g = new THREE.Group(), geo = new THREE.IcosahedronGeometry(1, 0);
  const mat = new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true, emissive: 0x9fb4c8, emissiveIntensity: 0.35 });
  for (let i = 0; i < n; i++) {
    const c = new THREE.Group(), puffs = 3 + Math.floor(Math.random() * 3);
    for (let k = 0; k < puffs; k++) {
      const m = new THREE.Mesh(geo, mat), s = 2.2 + Math.random() * 2.2;
      m.scale.set(s * 1.3, s * 0.75, s); m.position.set((k - puffs / 2) * 2.6, Math.random() * 1.2, (Math.random() - 0.5) * 2.5); c.add(m);
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
    sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\n transformed.z += sin(position.x * 0.35 + uTime * 1.6) * 0.18 + cos(position.y * 0.3 + uTime * 1.2) * 0.14;');
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
        g: o.gravity ?? -12, drag: o.drag ?? 2, rx: Math.random() * 6, ry: Math.random() * 6, spin: (Math.random() - 0.5) * 12,
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
      q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt; if (q.y < 0.02 && q.vy < 0) { q.y = 0.02; q.vy *= -0.3; }
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
