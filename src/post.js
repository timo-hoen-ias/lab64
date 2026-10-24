// Nachbearbeitung (nur Grafik „Hoch“): Bloom (Helles strahlt weich nach), Godrays (Strahlen von der Sonne) und
// Linsenreflex. Alles in Viertel-Auflösung gerechnet und in einem einzigen Schluss-Durchgang zusammengesetzt.
// Die Szene wird ohne Tonwert-Abbildung in ein HDR-Ziel gerendert; der Schluss-Durchgang macht Tone-Mapping und sRGB.
import * as THREE from 'three';

const VERT = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
const quad = new THREE.PlaneGeometry(2, 2);

function pass(frag, uniforms, extra = {}) {
  const m = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: frag, uniforms, depthTest: false, depthWrite: false, ...extra });
  const scene = new THREE.Scene(), mesh = new THREE.Mesh(quad, m); mesh.frustumCulled = false; scene.add(mesh);
  return { m, scene };
}

export class Post {
  constructor(renderer) {
    this.r = renderer; this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const rt = (w, h, o = {}) => new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, ...o });
    this.scene = rt(1, 1, { samples: 4 }); this.bright = rt(1, 1); this.blurA = rt(1, 1); this.blurB = rt(1, 1); this.rays = rt(1, 1);
    this.uSun = { value: new THREE.Vector2(0.5, 0.5) }; this.uSunK = { value: 0 }; this.uTexel = { value: new THREE.Vector2() };
    // Helle Bereiche herausfiltern (weiche Schwelle)
    this.pBright = pass(`uniform sampler2D tDiffuse; varying vec2 vUv;
      void main(){ vec3 c = texture2D(tDiffuse, vUv).rgb; float l = max(c.r, max(c.g, c.b)); gl_FragColor = vec4(c * smoothstep(0.75, 1.4, l), 1.0); }`, { tDiffuse: { value: null } });
    // Weichzeichnen, getrennt waagrecht/senkrecht
    this.pBlur = pass(`uniform sampler2D tDiffuse; uniform vec2 dir; varying vec2 vUv;
      void main(){ vec3 c = texture2D(tDiffuse, vUv).rgb * 0.227;
        c += (texture2D(tDiffuse, vUv + dir * 1.385).rgb + texture2D(tDiffuse, vUv - dir * 1.385).rgb) * 0.316;
        c += (texture2D(tDiffuse, vUv + dir * 3.231).rgb + texture2D(tDiffuse, vUv - dir * 3.231).rgb) * 0.07;
        gl_FragColor = vec4(c, 1.0); }`, { tDiffuse: { value: null }, dir: { value: new THREE.Vector2() } });
    // Godrays: von jedem Pixel Richtung Sonne abtasten (nur Helles, z.B. Himmel um die Sonne, Lücken im Laub)
    this.pRays = pass(`uniform sampler2D tDiffuse; uniform vec2 sun; uniform float sunK; varying vec2 vUv;
      void main(){ if (sunK <= 0.0) { gl_FragColor = vec4(0.0); return; }
        vec2 d = (vUv - sun) * (1.0 / 28.0) * 0.9; vec2 p = vUv; float w = 1.0; vec3 c = vec3(0.0);
        for (int i = 0; i < 28; i++) { p -= d; c += texture2D(tDiffuse, p).rgb * w; w *= 0.95; }
        gl_FragColor = vec4(c * (sunK / 28.0), 1.0); }`, { tDiffuse: { value: null }, sun: this.uSun, sunK: this.uSunK });
    // Zusammensetzen: Szene + Bloom + Strahlen + Linsenreflex, dann Tone-Mapping und sRGB
    this.pFinal = pass(`uniform sampler2D tScene, tBloom, tRays; uniform vec2 sun; uniform float sunK, aspect; varying vec2 vUv;
      float ghost(vec2 uv, vec2 at, float r) { vec2 d = (uv - at) * vec2(aspect, 1.0); return smoothstep(r, r * 0.6, length(d)); }
      void main(){
        vec3 c = texture2D(tScene, vUv).rgb + texture2D(tBloom, vUv).rgb * 0.55 + texture2D(tRays, vUv).rgb * 0.5;
        if (sunK > 0.0) { vec2 axis = vec2(0.5) - sun;
          c += vec3(1.0, 0.85, 0.5) * ghost(vUv, sun + axis * 0.6, 0.05) * 0.06 * sunK + vec3(0.6, 1.0, 0.7) * ghost(vUv, sun + axis * 1.3, 0.09) * 0.05 * sunK + vec3(0.7, 0.75, 1.0) * ghost(vUv, sun + axis * 1.8, 0.03) * 0.08 * sunK; }
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`, { tScene: { value: null }, tBloom: { value: null }, tRays: { value: null }, sun: this.uSun, sunK: this.uSunK, aspect: { value: 1 } }, { toneMapped: true });
    this._v = new THREE.Vector3(); this._f = new THREE.Vector3();
  }
  setSize(w, h) {
    const pr = this.r.getPixelRatio(), W = Math.max(1, Math.floor(w * pr)), H = Math.max(1, Math.floor(h * pr)), q = [Math.max(1, W >> 2), Math.max(1, H >> 2)];
    this.scene.setSize(W, H); this.bright.setSize(...q); this.blurA.setSize(...q); this.blurB.setSize(...q); this.rays.setSize(...q);
    this.uTexel.value.set(1 / q[0], 1 / q[1]); this.pFinal.m.uniforms.aspect.value = W / H;
  }
  _run(p, target) { this.r.setRenderTarget(target); this.r.render(p.scene, this.cam); }
  // sunDir: Richtung zur Sonne (oder null drinnen)
  render(scene, camera, sunDir) {
    const r = this.r;
    r.setRenderTarget(this.scene); r.render(scene, camera);
    this.pBright.m.uniforms.tDiffuse.value = this.scene.texture; this._run(this.pBright, this.bright);
    const b = this.pBlur.m.uniforms;
    b.tDiffuse.value = this.bright.texture; b.dir.value.set(this.uTexel.value.x, 0); this._run(this.pBlur, this.blurA);
    b.tDiffuse.value = this.blurA.texture; b.dir.value.set(0, this.uTexel.value.y); this._run(this.pBlur, this.blurB);
    b.tDiffuse.value = this.blurB.texture; b.dir.value.set(this.uTexel.value.x * 2, 0); this._run(this.pBlur, this.blurA);
    b.tDiffuse.value = this.blurA.texture; b.dir.value.set(0, this.uTexel.value.y * 2); this._run(this.pBlur, this.blurB);
    // Sonne auf dem Bildschirm? Strahlen und Reflex blenden weich aus, je weiter sie vom Blickfeld weg ist
    let k = 0;
    if (sunDir) {
      camera.getWorldDirection(this._f); const facing = this._f.dot(sunDir);
      this._v.copy(camera.position).addScaledVector(sunDir, 400).project(camera); this.uSun.value.set(this._v.x * 0.5 + 0.5, this._v.y * 0.5 + 0.5);
      const off = Math.max(Math.abs(this._v.x), Math.abs(this._v.y));
      k = facing > 0 ? THREE.MathUtils.clamp((1.6 - off) / 0.8, 0, 1) * THREE.MathUtils.clamp(facing * 2, 0, 1) : 0;
    }
    this.uSunK.value = k;
    this.pRays.m.uniforms.tDiffuse.value = this.bright.texture; this._run(this.pRays, this.rays);
    const f = this.pFinal.m.uniforms; f.tScene.value = this.scene.texture; f.tBloom.value = this.blurB.texture; f.tRays.value = this.rays.texture;
    this._run(this.pFinal, null);
  }
}
