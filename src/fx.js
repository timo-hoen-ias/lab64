// Grafik-Effekte: Toon-Shading, Himmel mit Verlauf, Wolken, Wasser, Partikel, Blob-Schatten.
import * as THREE from 'three';

// Farbstimmung: Filmischer Tonwert (ACES) plus „Vibrance“ – blasse Farben werden kräftiger, schon bunte bleiben wie sie sind.
// Wirkt als eigener Tone-Mapper in jedem Material (kein zusätzlicher Bildschirm-Durchgang, kostet aufs Handy nichts).
THREE.ShaderChunk.tonemapping_pars_fragment = THREE.ShaderChunk.tonemapping_pars_fragment.replace('vec3 CustomToneMapping( vec3 color ) { return color; }', `vec3 CustomToneMapping( vec3 color ) {
  vec3 c = ACESFilmicToneMapping( color * 1.05 );
  float l = dot( c, vec3( 0.2126, 0.7152, 0.0722 ) ), sat = max( c.r, max( c.g, c.b ) ) - min( c.r, min( c.g, c.b ) );
  return saturate( mix( vec3( l ), c, 1.06 + 0.28 * ( 1.0 - sat ) ) );
}`);

// Höhennebel: tief liegender Boden in der Ferne verschwimmt früher im Dunst als Hohes (mehr Tiefe, Täler wirken dunstig)
THREE.ShaderChunk.fog_pars_vertex = '#ifdef USE_FOG\n\tvarying float vFogDepth;\n\tvarying float vFogY;\n#endif';
THREE.ShaderChunk.fog_vertex = '#ifdef USE_FOG\n\tvFogDepth = - mvPosition.z;\n\tvFogY = cameraPosition.y + ( transpose( mat3( viewMatrix ) ) * mvPosition.xyz ).y;\n#endif';
THREE.ShaderChunk.fog_pars_fragment = THREE.ShaderChunk.fog_pars_fragment.replace('varying float vFogDepth;', 'varying float vFogDepth;\n\tvarying float vFogY;');
THREE.ShaderChunk.fog_fragment = THREE.ShaderChunk.fog_fragment.replace('float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );', 'float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );\n\t\tfogFactor = max( fogFactor, ( 1.0 - smoothstep( -1.0, 12.0, vFogY ) ) * smoothstep( fogNear * 0.4, fogFar, vFogDepth ) * 0.55 );');

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
    uniforms: { top: { value: top }, horizon: { value: horizon }, sunDir: { value: sunDir }, glow: { value: new THREE.Color(T ? T.glow : 0xffffff) }, sunOn: { value: T ? 1 : 0 }, dim: { value: 0 } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform vec3 top; uniform vec3 horizon; uniform vec3 sunDir; uniform vec3 glow; uniform float sunOn; uniform float dim; varying vec3 vP;
      void main(){
        float h = clamp(vP.y * 1.6, 0.0, 1.0);
        vec3 c = mix(horizon, top, pow(h, 0.8));
        c = mix(c, horizon * 1.04, smoothstep(0.12, 0.0, abs(vP.y)) * 0.5 * sunOn); // Dunstband am Horizont
        float d = max(dot(normalize(vP), sunDir), 0.0);
        c += glow * (pow(d, 8.0) * 0.35 + pow(d, 64.0) * 0.6) * sunOn; // Schein
        c = mix(c, vec3(3.2, 3.0, 2.6), smoothstep(0.9975, 0.999, d) * sunOn); c += glow * pow(d, 400.0) * 1.5 * sunOn; // Scheibe, HDR-hell für Bloom und Strahlen
        c = mix(c, vec3(dot(c, vec3(0.3, 0.59, 0.11))) * vec3(0.72, 0.76, 0.84), dim); // Regenwetter: grau
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(480, 32, 16), mat);
  sky.renderOrder = -1; sky.frustumCulled = false; sky.userData.follow = true;
  return { mesh: sky, horizon, top, sunDir, T };
}

// Gras und Blumen als Instanzen; wiegen sich im Wind (Vertex-Shader). points = [[x,y,z], ...]
// Halme biegen sich von Moll weg (GRASS.uPlayer setzt das Level jedes Bild)
export const GRASS = { uPlayer: { value: new THREE.Vector3(0, -999, 0) } };
export function makeGrass(points, colors = [0x7ccf5a, 0x8fdc66, 0x69bd4c], flowers = 0.07) {
  const g = new THREE.Group(), uni = { uTime: { value: 0 } };
  const wind = mat => { mat.onBeforeCompile = sh => { sh.uniforms.uTime = uni.uTime; sh.uniforms.uPlayer = GRASS.uPlayer; sh.vertexShader = 'uniform float uTime;\nuniform vec3 uPlayer;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vec4 wp = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);\n transformed.x += sin(uTime * 2.0 + wp.x * 0.3 + wp.z * 0.2) * 0.12 * position.y;\n transformed.z += cos(uTime * 1.6 + wp.x * 0.2) * 0.06 * position.y;\n vec2 gd = wp.xz - uPlayer.xz; float gk = (1.0 - smoothstep(0.4, 1.5, length(gd))) * step(abs(wp.y - uPlayer.y), 1.2);\n vec3 push = vec3(normalize(gd + 0.0001).x, 0.0, normalize(gd + 0.0001).y) * gk * 0.45 * position.y;\n transformed += (inverse(mat3(instanceMatrix)) * push); transformed.y *= 1.0 - gk * 0.45;'); }; return mat; };
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

// Low-Poly-Wolken, die langsam ziehen (scale > 1 = große, ferne Wolkenbänke). Alle Wolkenbäusche einer Schicht sind
// ein einziges InstancedMesh (ein Zeichenaufruf statt einer pro Bausch)
export function makeClouds(n, radius, height, scale = 1) {
  const g = new THREE.Group(), geo = new THREE.IcosahedronGeometry(1, 0);
  const mat = new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true, emissive: 0x9fb4c8, emissiveIntensity: 0.35 });
  const clouds = [], puffs = [];
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, r = radius * (0.5 + Math.random() * 0.6);
    const c = new THREE.Object3D(); c.position.set(Math.cos(a) * r, height + Math.random() * 14, Math.sin(a) * r); c.rotation.y = Math.random() * Math.PI;
    c.userData.speed = 0.6 + Math.random() * 0.8; c.userData.range = radius * 1.2; clouds.push(c);
    const k = 3 + Math.floor(Math.random() * 3);
    for (let j = 0; j < k; j++) {
      const m = new THREE.Object3D(), s = (2.2 + Math.random() * 2.2) * scale;
      m.scale.set(s * 1.3, s * 0.75, s); m.position.set((j - k / 2) * 2.6 * scale, Math.random() * 1.2 * scale, (Math.random() - 0.5) * 2.5 * scale); c.add(m); puffs.push(m);
    }
  }
  const inst = new THREE.InstancedMesh(geo, mat, Math.max(1, puffs.length)); inst.count = puffs.length; inst.frustumCulled = false; g.add(inst);
  const place = () => { clouds.forEach(c => c.updateMatrixWorld(true)); puffs.forEach((m, i) => inst.setMatrixAt(i, m.matrixWorld)); inst.instanceMatrix.needsUpdate = true; };
  place();
  g.userData.update = dt => { clouds.forEach(c => { c.position.x += c.userData.speed * dt; if (c.position.x > c.userData.range) c.position.x = -c.userData.range; }); place(); };
  return g;
}

// ---- Wasser-Look für Meer, Kanal und Teiche: Fresnel (flach betrachtet spiegelt es den Himmel, von oben sieht man hinein),
// Sonnen-Glanzlicht auf feinen Kräuselwellen und Wellenringe (WATER.ripple), wenn Moll schwimmt, etwas hineinspringt oder es regnet.
const RIPS = 12;
export const WATER = {
  uWT: { value: 0 }, uWSky: { value: new THREE.Color(0xbfe3ff) }, uWSun: { value: new THREE.Vector3(0.4, 0.8, 0.3).normalize() }, uWSunK: { value: 0 },
  uRip: { value: Array.from({ length: RIPS }, () => new THREE.Vector4(0, 0, 9, 0)) }, _i: 0,
  ripple(x, z, s = 1) { const r = this.uRip.value[this._i++ % RIPS]; r.set(x, z, 0, s); },
  update(dt) { this.uWT.value += dt; for (const r of this.uRip.value) if (r.w > 0) { r.z += dt; if (r.z > 1.8) r.w = 0; } },
};
function waterLook(sh) {
  Object.assign(sh.uniforms, { uWT: WATER.uWT, uWSky: WATER.uWSky, uWSun: WATER.uWSun, uWSunK: WATER.uWSunK, uRip: WATER.uRip });
  sh.vertexShader = 'varying vec3 vWw;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n vWw = (modelMatrix * vec4(transformed, 1.0)).xyz;');
  sh.fragmentShader = `varying vec3 vWw; uniform float uWT, uWSunK; uniform vec3 uWSky, uWSun; uniform vec4 uRip[${RIPS}];\n` + sh.fragmentShader.replace('#include <opaque_fragment>', `
    vec3 wN = normalize(cross(dFdx(vWw), dFdy(vWw))); if (wN.y < 0.0) wN = -wN;
    vec2 q = vWw.xz;
    wN = normalize(wN + vec3(sin(q.x * 2.1 + uWT * 2.3) * 0.05 + sin(q.y * 3.7 - uWT * 1.7) * 0.035, 0.0, cos(q.y * 2.4 + uWT * 2.0) * 0.05 + cos(q.x * 3.3 + uWT * 1.3) * 0.035));
    float rip = 0.0;
    for (int i = 0; i < ${RIPS}; i++) { vec4 r = uRip[i]; if (r.w <= 0.0) continue;
      float d = length(q - r.xy), rad = 0.25 + r.z * 2.2, fade = (1.0 - r.z / 1.8) * r.w, e1 = (d - rad) * 6.0, e2 = (d - rad * 0.55) * 7.0;
      rip += (exp(-e1 * e1) + exp(-e2 * e2) * 0.5) * fade; }
    vec3 V = normalize(cameraPosition - vWw);
    float top = gl_FrontFacing ? 1.0 : 0.0, F = top * (0.05 + 0.95 * pow(1.0 - max(dot(wN, V), 0.0), 4.0));
    outgoingLight = mix(outgoingLight, uWSky, F * 0.6);
    float rs = max(dot(reflect(-V, wN), uWSun), 0.0);
    outgoingLight += vec3(1.0, 0.95, 0.8) * (pow(rs, 220.0) * 3.0 + pow(rs, 14.0) * 0.1) * uWSunK * top;
    outgoingLight += vec3(0.92, 0.97, 1.0) * min(rip, 1.0) * 0.5;
    diffuseColor.a = min(1.0, mix(diffuseColor.a, 1.0, F) + rip * 0.25);
    #include <opaque_fragment>`);
}

// Wasser mit Wellen (Vertex-Animation im Shader des Lambert-Materials)
export function makeWater(color, size) {
  const geo = new THREE.PlaneGeometry(size * 2.4, size * 2.4, 48, 48);
  const mat = new THREE.MeshLambertMaterial({ color, flatShading: true, emissive: color, emissiveIntensity: 0.15 });
  const uni = { uTime: { value: 0 } };
  mat.onBeforeCompile = sh => {
    sh.uniforms.uTime = uni.uTime; waterLook(sh);
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
  food: (pt, pos) => { pt.burst(pos, { n: 22, color: [0xffd93d, 0xff6b6b, 0xffffff, 0x6bcbff], speed: 5, up: 6, life: 0.9, size: 0.22 }); pt.rings?.spawn(pos, 0xfff0a0, 3, 0.5); },
  crumbRing: (pt, pos) => pt.rings?.spawn(pos, 0xfff6d0, 1.3, 0.3),
  land: (pt, pos, k) => pt.rings?.spawn({ x: pos.x, y: pos.y + 0.06, z: pos.z }, 0xfff3dc, 1.4 + k, 0.35),
  gold: (pt, pos) => { pt.burst(pos, { n: 40, color: [0xffcc33, 0xfff3a0, 0xffd700], speed: 7, up: 8, life: 1.4, size: 0.18, gravity: -6 }); pt.burst(pos, { n: 16, color: 0xffffff, speed: 10, up: 1, life: 0.5, size: 0.1, gravity: 0, flat: true }); pt.rings?.spawn(pos, 0xffd84a, 4.5, 0.7); pt.rings?.spawn(pos, 0xffffff, 2.5, 0.45); FX.confetti(pt, pos); },
  hit: (pt, pos) => { pt.burst(pos, { n: 18, color: [0xffffff, 0xffe066, 0xff6b6b], speed: 8, up: 3, life: 0.45, size: 0.22, gravity: -4 }); pt.rings?.spawn(pos, 0xffe066, 3.2, 0.35); },
  bite: (pt, pos) => pt.burst(pos, { n: 5, color: 0xffffff, speed: 3, up: 1, life: 0.25, size: 0.14, gravity: 0 }),
  splash: (pt, pos) => { pt.burst(pos, { n: 20, color: [0x9ad7ff, 0xffffff, 0x4fa3ff], speed: 3, up: 7, life: 0.8, size: 0.22, gravity: -18 }); pt.burst(pos, { n: 14, color: 0xffffff, speed: 4.5, up: 3, life: 0.5, size: 0.1, gravity: -12 }); pt.burst(pos, { n: 10, color: 0xe8f6ff, speed: 2.4, up: 0.4, life: 0.6, size: 0.18, gravity: 0, drag: 3, flat: true }); WATER.ripple(pos.x, pos.z, 1.2); setTimeout(() => WATER.ripple(pos.x, pos.z, 0.7), 260); },
  confetti: (pt, pos) => pt.burst(pos, { n: 45, color: [0xff6b6b, 0xfeca57, 0x48dbfb, 0x1dd1a1, 0xff9ff3, 0xa29bfe, 0xffffff], speed: 7, up: 9, life: 2.2, size: 0.2, gravity: -5, drag: 2.5 }),
  petals: (pt, pos) => pt.burst(pos, { n: 2, color: [0xff9ff3, 0xffffff, 0xfeca57, 0x9ccc65], speed: 1.5, up: 2.2, life: 1.0, size: 0.12, gravity: -3, drag: 2.5 }),
  sparkle: (pt, pos) => pt.burst(pos, { n: 1, color: [0xfff3a0, 0xffffff], speed: 0.6, up: 1.2, life: 0.8, size: 0.14, gravity: 0, spread: 0.6 }),
};

// Teich: Wasserfläche als Ellipse mit leichten Wellen, dazu Becken (Wand + Grund)
export function makePond(rx, rz, depth = 1.8) {
  const g = new THREE.Group(), uni = { uTime: { value: 0 } };
  const wm = new THREE.MeshLambertMaterial({ color: 0x3fa9f5, transparent: true, opacity: 0.82, emissive: 0x1e6fb0, emissiveIntensity: 0.25, flatShading: true, side: THREE.DoubleSide }); // von unten sichtbar beim Tauchen
  wm.onBeforeCompile = sh => {
    sh.uniforms.uTime = uni.uTime; waterLook(sh);
    sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\n transformed.z += sin(position.x * 4.0 + uTime * 2.0) * 0.012 + cos(position.y * 5.0 + uTime * 1.5) * 0.01;');
  };
  const water = new THREE.Mesh(new THREE.RingGeometry(0, 1, 48, 6), wm); // Ring mit Radius 0 = Scheibe mit mehr Vertices für Wellen
  water.rotation.x = -Math.PI / 2; water.scale.set(rx, rz, 1); water.position.y = -0.25; water.renderOrder = 2; g.add(water);
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, depth, 40, 1, true), new THREE.MeshToonMaterial({ color: 0x8d7b5a, gradientMap: toonGradient(), side: THREE.BackSide }));
  wall.scale.set(rx, 1, rz); wall.position.y = -depth / 2; g.add(wall);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(1, 40), new THREE.MeshToonMaterial({ color: 0xd8c38a, gradientMap: toonGradient() }));
  floor.rotation.x = -Math.PI / 2; floor.scale.set(rx, rz, 1); floor.position.y = -depth + 0.01; g.add(floor);
  addCaustics(floor.material, 'all'); addCaustics(wall.material, 'all');
  // Schaumkante am Ufer: weißer Ring, der leicht pulsiert
  const foam = new THREE.Mesh(new THREE.RingGeometry(0.955, 1.0, 64, 1), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide }));
  foam.rotation.x = -Math.PI / 2; foam.scale.set(rx, rz, 1); foam.position.y = -0.2; foam.renderOrder = 3; g.add(foam);
  let t = 0; g.userData.update = dt => { uni.uTime.value += dt; t += dt; foam.material.opacity = 0.45 + Math.sin(t * 1.5) * 0.18; const k = 1 - (Math.sin(t * 1.5) * 0.5 + 0.5) * 0.012; foam.scale.set(rx * k, rz * k, 1); };
  return g;
}

// Portal-Scheibe: Spiralstrudel in der Weltfarbe (Shader)
// Portal-Scheibe: Strudel in der Weltfarbe; mit preview (Bild-URL) sieht man in der Mitte die Zielwelt, leicht verwirbelt
export function makePortalDisk(color, r = 1.45, preview = null) {
  const mat = new THREE.ShaderMaterial({
    transparent: true, side: THREE.DoubleSide, depthWrite: false,
    uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(color) }, uLocked: { value: 0 }, uTex: { value: null }, uMix: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform float uTime; uniform vec3 uColor; uniform float uLocked; uniform sampler2D uTex; uniform float uMix; varying vec2 vUv;
      void main(){
        vec2 p = vUv * 2.0 - 1.0; float r = length(p); if (r > 1.0) discard;
        float a = atan(p.y, p.x);
        float sp = sin(a * 3.0 + r * 10.0 - uTime * 3.0) * 0.5 + 0.5;
        float sp2 = sin(a * 5.0 - r * 14.0 + uTime * 2.0) * 0.5 + 0.5;
        vec3 c = mix(uColor * 0.6, mix(uColor, vec3(1.0), 0.6), sp * 0.7 + sp2 * 0.3);
        // Vorschau der Zielwelt: zum Rand hin immer stärker in den Strudel gedreht
        float tw = r * r * 0.9 + sin(uTime * 0.8) * 0.05 * r; vec2 q = mat2(cos(tw), -sin(tw), sin(tw), cos(tw)) * p;
        q += vec2(sin(r * 13.0 - uTime * 2.2), cos(a * 4.0 + uTime * 1.3)) * 0.012;
        vec3 img = texture2D(uTex, q * 0.5 + 0.5).rgb;
        c = mix(c, img, uMix * (1.0 - smoothstep(0.5, 0.95, r)));
        c += vec3(1.0) * pow(1.0 - r, 3.0) * mix(0.8, 0.12, uMix);
        vec3 grey = vec3(dot(c, vec3(0.3, 0.59, 0.11))) * mix(0.45, 0.7, uMix);
        c = mix(c, grey, uLocked);
        float alpha = mix(0.92, 0.6, uLocked * (1.0 - uMix * 0.6)) * smoothstep(1.0, 0.85, r);
        gl_FragColor = vec4(c, alpha);
      }`,
  });
  if (preview) new THREE.TextureLoader().load(preview, t => { mat.uniforms.uTex.value = t; mat.uniforms.uMix.value = 1; });
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

// ---- Figuren-Look: dunkle Konturlinie (umgedrehte Hülle) und warmes Randlicht
// Kontur = Kopie jedes Teils, etwas größer, nur Rückseiten in Dunkelbraun. Teilt die Geometrie, kostet nur Zeichenaufrufe;
// bei Grafik „Niedrig“ wird das gemeinsame Material unsichtbar geschaltet.
export const OUTLINE_MAT = new THREE.MeshBasicMaterial({ color: 0x24160c, side: THREE.BackSide });
export function setOutlines(on) { OUTLINE_MAT.visible = on; }
const RIM = { uRim: { value: new THREE.Color(0xfff1d0) } };
function addRim(mat) {
  if (mat.userData.rim || !mat.isMeshToonMaterial) return; mat.userData.rim = true;
  const prev = mat.onBeforeCompile, prevKey = mat.customProgramCacheKey;
  mat.onBeforeCompile = (sh, r) => {
    prev.call(mat, sh, r); sh.uniforms.uRim = RIM.uRim;
    sh.fragmentShader = 'uniform vec3 uRim;\n' + sh.fragmentShader.replace('#include <dithering_fragment>', `#include <dithering_fragment>
 float rimK = 1.0 - max(dot(normalize(normal), normalize(vViewPosition)), 0.0);
 gl_FragColor.rgb += uRim * smoothstep(0.62, 0.8, rimK) * 0.22;`);
  };
  mat.customProgramCacheKey = () => (prevKey ? prevKey.call(mat) : '') + '|rim';
}
export function characterLook(root, thick = 0.035) {
  const list = []; root.traverse(o => { if (o.isMesh && !o.userData.isOutline) list.push(o); });
  const bb = new THREE.Box3(), size = new THREE.Vector3(), c = new THREE.Vector3();
  for (const m of list) {
    [].concat(m.material).forEach(addRim);
    if (m.material.transparent || m.userData.noOutline) continue;
    if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
    bb.copy(m.geometry.boundingBox); bb.getSize(size); bb.getCenter(c);
    if (Math.min(size.x, size.y, size.z) < 0.01 || Math.max(size.x, size.y, size.z) < 0.09) continue; // flache Scheiben, Glanzpunkte
    const o = new THREE.Mesh(m.geometry, OUTLINE_MAT); o.userData.isOutline = true;
    o.scale.set((size.x + thick * 2) / size.x, (size.y + thick * 2) / size.y, (size.z + thick * 2) / size.z);
    o.position.set(c.x * (1 - o.scale.x), c.y * (1 - o.scale.y), c.z * (1 - o.scale.z)); // um die Mitte skalieren
    o.castShadow = o.receiveShadow = false; o.frustumCulled = m.frustumCulled; o.raycast = () => {};
    m.add(o);
  }
  return root;
}

// ---- Wind für Laub: Kronen und Büsche wiegen sich leicht (gemeinsame Zeit für alle Welten)
export const WIND = { uWind: { value: 0 } };
// Durchschütteln (Trillern am Baum): bis zu 3 Stellen gleichzeitig, je (x, z, Stärke, Radius) – wackelt nur das Laub in der Nähe
export const SHAKE = { uShake: { value: [new THREE.Vector4(), new THREE.Vector4(), new THREE.Vector4()] } };
export function addSway(mat, amp = 0.07) {
  if (mat.userData.sway) return mat; mat.userData.sway = true;
  const prev = mat.onBeforeCompile, prevKey = mat.customProgramCacheKey;
  mat.onBeforeCompile = (sh, r) => {
    prev.call(mat, sh, r); sh.uniforms.uWind = WIND.uWind; sh.uniforms.uShake = SHAKE.uShake;
    sh.vertexShader = 'uniform float uWind;\nuniform vec4 uShake[3];\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
 vec4 swW = modelMatrix * vec4(transformed, 1.0);
 float swP = uWind * 1.4 + swW.x * 0.21 + swW.z * 0.17;
 transformed.x += sin(swP + swW.y * 0.6) * ${amp.toFixed(3)}; transformed.z += cos(swP * 0.8 + swW.y * 0.5) * ${(amp * 0.7).toFixed(3)};
 for (int i = 0; i < 3; i++) { vec4 sk = uShake[i]; float k = sk.z * max(0.0, 1.0 - distance(swW.xz, sk.xy) / max(sk.w, 0.01)); transformed.x += sin(uWind * 31.0 + swW.y * 1.7) * k; transformed.z += cos(uWind * 27.0 + swW.y * 1.3) * k * 0.8; }`);
  };
  mat.customProgramCacheKey = () => (prevKey ? prevKey.call(mat) : '') + '|sway';
  return mat;
}

// ---- Lichtflecken (Kaustik) auf Flächen unter Wasser: wanderndes Netz aus hellen Linien
export const CAUSTIC = { uCaT: { value: 0 }, uSeaY: { value: -1e9 } };
const CAUSTIC_GLSL = `
 float caW(vec2 p, float t) { vec2 q = p + vec2(sin(p.y * 0.9 + t), cos(p.x * 0.8 - t * 0.8)) * 0.8; return abs(sin(q.x * 1.3 + t * 0.6) + sin(q.y * 1.5 - t * 0.5)); }
 vec3 caustic(vec3 wp, float t) { float c = 1.0 - smoothstep(0.0, 0.35, caW(wp.xz * 0.9, t)) * 0.7 - smoothstep(0.0, 0.3, caW(wp.zx * 1.3 + 4.0, t * 1.2)) * 0.5; return vec3(0.65, 0.9, 1.0) * max(0.0, 0.6 - c) * 0.9; }`;
// Für Materialien mit eigener Weltposition: mode 'sea' = nur unter uSeaY, 'all' = immer (Teichgrund)
export function addCaustics(mat, mode = 'sea') {
  if (mat.userData.caustic) return mat; mat.userData.caustic = true;
  const prev = mat.onBeforeCompile, prevKey = mat.customProgramCacheKey;
  mat.onBeforeCompile = (sh, r) => {
    prev.call(mat, sh, r); Object.assign(sh.uniforms, CAUSTIC);
    sh.vertexShader = 'varying vec3 vCaW;\n' + sh.vertexShader.replace('#include <project_vertex>', `#include <project_vertex>
 vec4 caP = vec4(transformed, 1.0);
 #ifdef USE_INSTANCING
 caP = instanceMatrix * caP;
 #endif
 vCaW = (modelMatrix * caP).xyz;`);
    sh.fragmentShader = 'uniform float uCaT, uSeaY;\nvarying vec3 vCaW;\n' + CAUSTIC_GLSL + '\n' + sh.fragmentShader.replace('#include <dithering_fragment>', `#include <dithering_fragment>
 ${mode === 'all' ? 'float caK = 1.0;' : 'float caK = smoothstep(uSeaY - 0.15, uSeaY - 0.6, vCaW.y) * (1.0 - smoothstep(10.0, 22.0, uSeaY - vCaW.y));'}
 #ifdef USE_FOG
 caK *= 1.0 - fogFactor;
 #endif
 if (caK > 0.0) gl_FragColor.rgb += caustic(vCaW, uCaT) * caK * 0.22;`);
  };
  mat.customProgramCacheKey = () => (prevKey ? prevKey.call(mat) : '') + '|ca' + mode;
  return mat;
}

// ---- Schaum am Ufer: weiche weiße Flecken entlang der Linie, an der das Gelände die Wasserfläche schneidet
let _foamTex;
function foamTex() {
  if (_foamTex) return _foamTex;
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  const gr = x.createRadialGradient(32, 32, 4, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,0.95)'); gr.addColorStop(0.55, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
  x.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 14; i++) { x.beginPath(); x.arc(8 + Math.random() * 48, 8 + Math.random() * 48, 2 + Math.random() * 5, 0, 7); x.fillStyle = 'rgba(0,0,0,0.6)'; x.fill(); }
  return (_foamTex = new THREE.CanvasTexture(c));
}
// points = [[x, z, Richtung]], y = Wasserhöhe
export function makeShoreFoam(points, y) {
  const n = points.length, mat = new THREE.MeshBasicMaterial({ map: foamTex(), transparent: true, depthWrite: false, opacity: 0.8, polygonOffset: true, polygonOffsetFactor: -4 });
  const m = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), mat, Math.max(1, n));
  const M = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  const base = points.map(([x, z, a], i) => { const w = 3.4 + (i * 7 % 5) * 0.4; return { x, z, a, w, ph: i * 1.7 }; });
  m.count = n; m.renderOrder = 3; m.frustumCulled = false;
  m.userData.update = t => {
    for (let i = 0; i < n; i++) { const b = base[i], k = 0.75 + Math.sin(t * 1.6 + b.ph) * 0.25; q.setFromAxisAngle(up, b.a); M.compose(p.set(b.x, y + 0.2, b.z), q, s.set(b.w * k, 1, b.w * 0.6 * k)); m.setMatrixAt(i, M); }
    m.instanceMatrix.needsUpdate = true; mat.opacity = 0.8 + Math.sin(t * 1.1) * 0.15;
  };
  m.userData.update(0); return m;
}

// ---- Umgebungspartikel rund um die Kamera: Pollen, fallende Blätter, Glühwürmchen, Staub, Tropfen, Schwebeteilchen
const AMBIENT = {
  pollen: { colors: [0xffffff, 0xfff6c4, 0xfff0a0], size: 0.07, add: false, fall: 0.05, wob: 0.5 },
  leaves: { colors: [0x6fb53b, 0x9ccc65, 0xe1a43a, 0xd9762b], size: 0.2, add: false, fall: -0.7, wob: 1.2, flat: true },
  fireflies: { colors: [0xfff27a, 0xd8ff6a], size: 0.1, add: true, fall: 0, wob: 0.8, blink: true },
  dust: { colors: [0xfff8e6, 0xffffff], size: 0.045, add: true, fall: -0.03, wob: 0.25 },
  drips: { colors: [0xbfe9ff, 0x9fd8ff], size: 0.06, add: false, fall: -9, wob: 0, streak: true },
  rain: { colors: [0xcfe6ff, 0xe8f2ff], size: 0.05, add: false, fall: -22, wob: 0.3, streak: true },
  plankton: { colors: [0xe9fbff, 0xbff0ff], size: 0.06, add: true, fall: 0.1, wob: 0.4 },
};
export function makeAmbient(kind, n, radius = 14, height = 8) {
  const K = AMBIENT[kind], geo = K.flat ? new THREE.PlaneGeometry(1, 0.6) : new THREE.OctahedronGeometry(0.5, 0);
  const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: K.add ? 0.85 : 0.9, depthWrite: false, side: THREE.DoubleSide, fog: !K.add, blending: K.add ? THREE.AdditiveBlending : THREE.NormalBlending });
  const m = new THREE.InstancedMesh(geo, mat, n); m.frustumCulled = false; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const col = new THREE.Color(), P = [];
  for (let i = 0; i < n; i++) { P.push({ x: (Math.random() * 2 - 1) * radius, y: Math.random() * height, z: (Math.random() * 2 - 1) * radius, ph: Math.random() * 7, sp: 0.6 + Math.random() * 0.8, r: Math.random() * 6 }); m.setColorAt(i, col.set(K.colors[i % K.colors.length])); }
  const M = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), p = new THREE.Vector3();
  let t = 0; const ox = { v: 0 }, oz = { v: 0 };
  m.userData.update = (dt, c, floor = 0, hide = null) => { // hide(x, y, z): Teilchen dort nicht zeigen (z.B. Regen unter einem Dach)
    t += dt;
    for (let i = 0; i < n; i++) {
      const a = P[i];
      a.y += (K.fall * a.sp) * dt; a.x += Math.sin(t * 0.7 * a.sp + a.ph) * K.wob * dt; a.z += Math.cos(t * 0.6 * a.sp + a.ph) * K.wob * dt;
      if (a.y < -1) a.y += height; if (a.y > height) a.y -= height;
      // in einer Kiste rund um die Kamera halten (springt auf die andere Seite)
      let wx = a.x - c.x, wz = a.z - c.z; if (wx > radius) a.x -= radius * 2; else if (wx < -radius) a.x += radius * 2; if (wz > radius) a.z -= radius * 2; else if (wz < -radius) a.z += radius * 2;
      let sz = K.size * (0.7 + a.sp * 0.4);
      if (K.blink) sz *= Math.max(0.15, Math.sin(t * 2.2 * a.sp + a.ph));
      a.r += dt * (K.flat ? 3 : 1) * a.sp;
      q.setFromEuler(e.set(K.flat ? a.r : 0.3, a.r * 0.6, K.flat ? Math.sin(a.r) : 0));
      if (hide && hide(a.x, floor + a.y, a.z)) sz = 0;
      M.compose(p.set(a.x, floor + a.y, a.z), q, K.streak ? s.set(sz * 0.5, sz * 7, sz * 0.5) : s.set(sz, sz, sz)); m.setMatrixAt(i, M);
    }
    m.instanceMatrix.needsUpdate = true;
  };
  // Startpositionen relativ zur ersten Kameraposition
  m.userData.place = c => { for (const a of P) { a.x += c.x; a.z += c.z; } };
  return m;
}

// ---- Pfotenabdrücke (z.B. im Sand): kleiner Ring-Puffer flacher Ovale, die langsam verblassen
export class Prints {
  constructor(n = 48) {
    this.n = n; this.i = 0; this.age = new Float32Array(n).fill(99); this.pos = [];
    this.mat = new THREE.MeshBasicMaterial({ color: 0x8a6a3a, transparent: true, opacity: 0.4, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3 });
    const g = new THREE.CircleGeometry(0.14, 8).rotateX(-Math.PI / 2); g.scale(1, 1, 1.35);
    this.mesh = new THREE.InstancedMesh(g, this.mat, n); this.mesh.frustumCulled = false; this.mesh.count = 0; this._M = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._s = new THREE.Vector3(); this._p = new THREE.Vector3(); this._up = new THREE.Vector3(0, 1, 0);
    for (let k = 0; k < n; k++) this.pos.push({ x: 0, y: 0, z: 0, yaw: 0 });
  }
  attach(scene, color) { this.age.fill(99); this.mesh.count = 0; scene.add(this.mesh); if (color !== undefined) this.mat.color.set(color); }
  detach() { this.mesh.removeFromParent(); }
  add(x, y, z, yaw) { const k = this.i++ % this.n; Object.assign(this.pos[k], { x, y, z, yaw }); this.age[k] = 0; this.mesh.count = Math.min(this.n, this.i); }
  update(dt) {
    if (!this.mesh.parent) return;
    for (let k = 0; k < this.mesh.count; k++) {
      this.age[k] += dt; const a = this.pos[k], f = Math.max(0, 1 - this.age[k] / 9); // nach 9 s weg
      this._q.setFromAxisAngle(this._up, a.yaw); this._M.compose(this._p.set(a.x, a.y + 0.03, a.z), this._q, this._s.setScalar(f > 0 ? 0.6 + f * 0.4 : 0.0001)); this.mesh.setMatrixAt(k, this._M);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}

// ---- Stoßwellen-Ringe (Einsammeln, Landen, Boss-Treffer): wenige wiederverwendete flache Ringe
export class Rings {
  constructor(n = 8) {
    this.group = new THREE.Group(); this.list = [];
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(new THREE.RingGeometry(0.82, 1, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
      m.visible = false; m.frustumCulled = false; this.group.add(m); this.list.push({ m, t: 1, life: 1, size: 1 });
    }
  }
  attach(scene) { this.list.forEach(r => { r.t = r.life; r.m.visible = false; }); scene.add(this.group); }
  detach() { this.group.removeFromParent(); }
  spawn(pos, color = 0xffffff, size = 2.5, life = 0.5) {
    const r = this.list.reduce((a, b) => (b.t / b.life > a.t / a.life ? b : a)); // ältesten nehmen
    r.t = 0; r.life = life; r.size = size; r.m.position.set(pos.x, pos.y, pos.z); r.m.material.color.set(color); r.m.visible = true;
  }
  update(dt) {
    for (const r of this.list) {
      if (!r.m.visible) continue; r.t += dt; const k = r.t / r.life;
      if (k >= 1) { r.m.visible = false; continue; }
      const e = 1 - (1 - k) ** 3; r.m.scale.setScalar(0.2 + e * r.size); r.m.material.opacity = (1 - k) * 0.8;
    }
  }
}


// ---- Weicher Lichtschein (additives Sprite) für Goldknochen, Portale, Laternen
let _glowTex;
export function glowTex() {
  if (_glowTex) return _glowTex;
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,0.45)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64); return (_glowTex = new THREE.CanvasTexture(c));
}
export function makeGlow(color, size = 2, opacity = 0.6) {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, fog: true }));
  sp.scale.setScalar(size); sp.userData.base = opacity; return sp;
}

// ---- Wolkenschatten: große, langsam ziehende dunklere Flecken auf allem Boden (Außenwelten)
export const CLOUDS = { uCloudT: { value: 0 }, uCloudK: { value: 0 } };
export function addCloudShadow(mat) {
  if (mat.userData.cloud || mat.transparent) return mat; mat.userData.cloud = true;
  const prev = mat.onBeforeCompile, prevKey = mat.customProgramCacheKey;
  mat.onBeforeCompile = (sh, r) => {
    prev.call(mat, sh, r); Object.assign(sh.uniforms, CLOUDS);
    sh.vertexShader = 'varying vec2 vClW;\n' + sh.vertexShader.replace('#include <project_vertex>', `#include <project_vertex>
 vec4 clP = vec4(transformed, 1.0);
 #ifdef USE_INSTANCING
 clP = instanceMatrix * clP;
 #endif
 vClW = (modelMatrix * clP).xz;`);
    sh.fragmentShader = 'uniform float uCloudT, uCloudK;\nvarying vec2 vClW;\n' + sh.fragmentShader.replace('#include <fog_fragment>', `vec2 clq = vClW * 0.018 + vec2(uCloudT * 0.035, uCloudT * 0.012);
 float cl = sin(clq.x * 3.1) * sin(clq.y * 2.7 + 1.3) + sin(clq.x * 1.3 - clq.y * 1.9) * 0.6;
 gl_FragColor.rgb *= 1.0 - smoothstep(0.35, 0.8, cl) * uCloudK;
 #include <fog_fragment>`);
  };
  mat.customProgramCacheKey = () => (prevKey ? prevKey.call(mat) : '') + '|cloud';
  return mat;
}

// ---- Regenbogen: großer Bogen weit weg, gegenüber der Sonne, blendet ein und aus
export function makeRainbow() {
  const geo = new THREE.TorusGeometry(160, 9, 2, 48, Math.PI), pos = geo.attributes.position, col = new Float32Array(pos.count * 3), c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) { const r = Math.hypot(pos.getX(i), pos.getY(i)), k = THREE.MathUtils.clamp((r - 151) / 18, 0, 1); c.setHSL(0.78 * k, 1.0, 0.5); col.set([c.r, c.g, c.b], i * 3); }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0, depthWrite: false, fog: false, side: THREE.DoubleSide, toneMapped: false }));
  m.frustumCulled = false; m.renderOrder = -0.5; return m;
}

// ---- Sternschnuppe: heller Strich, der über den Abendhimmel zischt
export function makeShootingStar() {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(14, 0.35), new THREE.MeshBasicMaterial({ color: 0xfffbe0, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, side: THREE.DoubleSide }));
  m.frustumCulled = false; m.renderOrder = -0.5; m.userData.k = 1; return m;
}

// ---- Rauch aus dem Schornstein: ein paar Wölkchen, die aufsteigen, wachsen und verblassen
export function makeSmoke(n = 7) {
  const g = new THREE.Group(), mat = new THREE.MeshLambertMaterial({ color: 0xf2f2f2, transparent: true, opacity: 0.7, depthWrite: false, flatShading: true });
  for (let i = 0; i < n; i++) { const p = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 0), mat.clone()); p.userData.k = i / n; g.add(p); }
  g.userData.update = dt => g.children.forEach((p, i) => {
    const u = p.userData; u.k = (u.k + dt * 0.18) % 1; const k = u.k;
    p.position.set(Math.sin(k * 5 + i) * 0.4 + k * 1.5, k * 6, Math.cos(k * 4 + i) * 0.3); p.scale.setScalar(0.4 + k * 1.6); p.rotation.set(k * 3, k * 2, 0); p.material.opacity = Math.sin(k * Math.PI) * 0.65;
  });
  return g;
}
