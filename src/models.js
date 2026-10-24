// Low-Poly-Modelle aus Grundkörpern. Alle Figuren sind Gruppen mit benannten Teilen für Animationen.
import * as THREE from 'three';
import { toonGradient } from './fx.js';

const mat = (color, extra = {}) => new THREE.MeshToonMaterial({ color, gradientMap: toonGradient(), ...extra });
export const box = (w, h, d, color, x = 0, y = 0, z = 0) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m;
};
export const sphere = (r, color, x = 0, y = 0, z = 0, seg = 8) => {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, seg, seg), mat(color)); m.position.set(x, y, z); m.castShadow = true; return m;
};
export const cyl = (rt, rb, h, color, x = 0, y = 0, z = 0, seg = 10) => {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat(color)); m.position.set(x, y, z); m.castShadow = true; return m;
};
export const cone = (r, h, color, x = 0, y = 0, z = 0, seg = 8) => {
  const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), mat(color)); m.position.set(x, y, z); m.castShadow = true; return m;
};

// ---------- Moll, der braune Labrador ------------------------------------
export function makeDog() {
  const g = new THREE.Group();
  const brown = 0x8b5a2b, dark = 0x5a3715, light = 0xa8743f, nose = 0x2a1a0e;
  const rig = new THREE.Group(); g.add(rig); // alles außer Schatten hängt am Rig → Squash/Stretch und Neigung
  const body = box(0.9, 0.6, 1.5, brown, 0, 0.75, 0); rig.add(body);
  const chest = box(0.95, 0.5, 0.5, brown, 0, 0.72, 0.55); rig.add(chest);
  rig.add(box(0.7, 0.12, 1.2, light, 0, 0.44, 0)); // Bauch
  const neck = box(0.5, 0.5, 0.45, brown, 0, 1.05, 0.75); rig.add(neck);
  rig.add(box(0.58, 0.14, 0.5, 0xd63031, 0, 1.1, 0.78)); // Halsband
  const tag = cyl(0.09, 0.09, 0.04, 0xffcc33, 0, 0.98, 1.05, 10); tag.rotation.x = Math.PI / 2; rig.add(tag); // Hundemarke
  const head = new THREE.Group(); head.position.set(0, 1.3, 0.95);
  head.add(box(0.7, 0.6, 0.65, brown));
  head.add(box(0.4, 0.35, 0.5, light, 0, -0.1, 0.5)); // Schnauze
  head.add(box(0.72, 0.08, 0.2, dark, 0, 0.27, 0.25)); // Stirn / Augenbrauen
  head.add(sphere(0.12, nose, 0, -0.02, 0.78)); // Nase
  const eyes = [];
  [0.22, -0.22].forEach(x => {
    const e = new THREE.Group(); e.position.set(x, 0.12, 0.3);
    e.add(sphere(0.085, 0x111111)); e.add(sphere(0.03, 0xffffff, x > 0 ? 0.025 : -0.025, 0.035, 0.065, 6)); // Glanzpunkt
    head.add(e); eyes.push(e);
  });
  const earL = box(0.18, 0.5, 0.3, dark, 0.4, -0.05, -0.05); earL.rotation.z = -0.25; head.add(earL);
  const earR = box(0.18, 0.5, 0.3, dark, -0.4, -0.05, -0.05); earR.rotation.z = 0.25; head.add(earR);
  const tongue = box(0.16, 0.05, 0.3, 0xff6b8a, 0, -0.3, 0.62); head.add(tongue);
  rig.add(head);
  const legs = [];
  [[0.3, 0.45], [-0.3, 0.45], [0.3, -0.5], [-0.3, -0.5]].forEach(([x, z]) => {
    const leg = new THREE.Group(); leg.position.set(x, 0.55, z);
    leg.add(box(0.26, 0.6, 0.28, brown, 0, -0.3, 0)); leg.add(box(0.28, 0.14, 0.34, dark, 0, -0.6, 0.03));
    rig.add(leg); legs.push(leg);
  });
  const tail = new THREE.Group(); tail.position.set(0, 0.95, -0.75);
  const tailMesh = box(0.18, 0.18, 0.7, brown, 0, 0.15, -0.3); tailMesh.rotation.x = -0.6; tail.add(tailMesh);
  rig.add(tail);
  g.userData = { rig, head, legs, tail, body, earL, earR, tongue, eyes, t: 0, idle: 0, blink: 2, lean: 0, look: 0 };
  return g;
}

// Hundeanimation: speed (0..1), airborne, dt, bite (0..1), vy (Fallgeschwindigkeit), turn (Drehrate)
export function animateDog(dog, speed, airborne, dt, bite = 0, vy = 0, turn = 0, swim = false) {
  const u = dog.userData; u.t += dt * (4 + speed * 10);
  if (swim) { // Hundepaddeln: Kopf hoch, Beine strampeln, Schwanz als Ruder
    u.t += dt * 6; u.idle = 0;
    u.legs.forEach((leg, i) => { leg.rotation.x = Math.sin(u.t * 1.5 + (i % 2 ? Math.PI : 0) + (i > 1 ? 1 : 0)) * 0.7 - 0.3; });
    u.rig.position.y = Math.sin(u.t * 0.8) * 0.05; u.rig.rotation.x = -0.18; u.rig.rotation.z = Math.sin(u.t * 0.4) * 0.05;
    u.head.rotation.set(-0.25, 0, 0); u.tail.rotation.y = Math.sin(u.t * 0.9) * 0.6; u.tail.rotation.x = 0.4;
    u.earL.rotation.z = -0.6; u.earR.rotation.z = 0.6; u.tongue.visible = false; u.body.scale.y = 1; u.head.position.z = 0.95;
    return;
  }
  const s = airborne ? 0 : speed;
  // Galopp: Vorder- und Hinterbeine versetzt, dazu Körper-Wippen
  u.legs.forEach((leg, i) => { leg.rotation.x = Math.sin(u.t + (i % 2 ? 0.5 : 0) + (i > 1 ? Math.PI : 0)) * 0.9 * s; });
  if (airborne) {
    const k = THREE.MathUtils.clamp(vy / 10, -1, 1); // hoch: Beine gestreckt, runter: zum Landen bereit
    u.legs[0].rotation.x = u.legs[1].rotation.x = -0.6 - k * 0.5; u.legs[2].rotation.x = u.legs[3].rotation.x = 0.4 + k * 0.5;
  }
  u.rig.position.y = airborne ? 0 : Math.abs(Math.sin(u.t)) * 0.1 * s;
  u.rig.rotation.x = airborne ? -THREE.MathUtils.clamp(vy * 0.03, -0.35, 0.35) : Math.sin(u.t * 2) * 0.04 * s;
  // In Kurven reinlehnen
  u.lean += (THREE.MathUtils.clamp(-turn * 0.08, -0.3, 0.3) * speed - u.lean) * Math.min(1, dt * 8); u.rig.rotation.z = u.lean;
  // Leerlauf: Atmen, Umschauen, Schwanzwedeln
  u.idle = speed < 0.05 && !airborne ? u.idle + dt : 0;
  const idle = Math.min(1, u.idle * 2);
  u.look = idle * Math.sin(u.idle * 0.9) * 0.5 * (Math.sin(u.idle * 0.33) > 0 ? 1 : 0.3);
  u.head.rotation.y = u.look;
  u.tail.rotation.y = Math.sin(u.t * 1.7 + u.idle * 14 * idle) * (0.5 + s * 0.4 + idle * 0.3);
  u.tail.rotation.x = airborne ? 0.5 : -0.1 * idle;
  u.head.rotation.x = airborne ? -0.3 : Math.sin(u.t) * 0.06 * s + Math.sin(u.idle * 2.2) * 0.04 * idle;
  u.earL.rotation.z = -0.25 - (airborne ? 0.4 + vy * 0.04 : Math.abs(Math.sin(u.t)) * 0.3 * s);
  u.earR.rotation.z = 0.25 + (airborne ? 0.4 + vy * 0.04 : Math.abs(Math.sin(u.t)) * 0.3 * s);
  u.body.scale.y = 1 + Math.sin(u.t * 2) * 0.03 * s + Math.sin(u.idle * 3) * 0.03 * idle;
  u.tongue.visible = speed > 0.5 || bite > 0 || idle > 0.9;
  u.tongue.position.y = -0.3 + Math.sin(u.idle * 6) * 0.015;
  // Blinzeln
  u.blink -= dt; const closed = u.blink < 0.12; if (u.blink < 0) u.blink = 2 + Math.random() * 3;
  u.eyes.forEach(e => { e.scale.y = closed ? 0.15 : 1; });
  if (bite > 0) { u.head.rotation.x = -0.4 + bite * 0.9; u.head.position.z = 0.95 + bite * 0.5; }
  else u.head.position.z = 0.95;
}

// ---------- Gegner / Figuren -------------------------------------------
export function makeCat(color = 0x3b3b3b) {
  const g = new THREE.Group();
  g.add(box(1.0, 0.7, 1.7, color, 0, 0.85, 0));
  const head = new THREE.Group(); head.position.set(0, 1.4, 1.0);
  head.add(box(0.75, 0.65, 0.6, color)); head.add(cone(0.16, 0.35, color, 0.25, 0.45, 0)); head.add(cone(0.16, 0.35, color, -0.25, 0.45, 0));
  head.add(sphere(0.09, 0xd8ff50, 0.2, 0.08, 0.3)); head.add(sphere(0.09, 0xd8ff50, -0.2, 0.08, 0.3));
  head.add(sphere(0.05, 0x111111, 0.2, 0.08, 0.37)); head.add(sphere(0.05, 0x111111, -0.2, 0.08, 0.37));
  head.add(sphere(0.08, 0xff9aa9, 0, -0.12, 0.33)); g.add(head);
  const legs = [];
  [[0.35, 0.6], [-0.35, 0.6], [0.35, -0.6], [-0.35, -0.6]].forEach(([x, z]) => { const l = new THREE.Group(); l.position.set(x, 0.55, z); l.add(box(0.26, 0.7, 0.28, color, 0, -0.35, 0)); g.add(l); legs.push(l); });
  const tail = cyl(0.08, 0.1, 1.2, color, 0, 1.2, -1.2); tail.rotation.x = 0.7; g.add(tail);
  g.userData = { head, legs, tail, t: 0 };
  return g;
}

export function makeVacuum() {
  const g = new THREE.Group();
  const body = cyl(0.9, 1.0, 0.9, 0xcc3333, 0, 0.5, 0, 14); g.add(body);
  g.add(cyl(0.6, 0.9, 0.3, 0xa62828, 0, 1.1, 0, 14));
  g.add(sphere(0.3, 0x333333, 0, 1.3, 0));
  const hose = cyl(0.12, 0.12, 2.2, 0x444444, 0, 0.9, 1.3); hose.rotation.x = Math.PI / 2 - 0.3; g.add(hose);
  const nozzle = box(1.4, 0.3, 0.5, 0x222222, 0, 0.15, 2.3); g.add(nozzle);
  g.add(sphere(0.14, 0xffffff, 0.35, 0.85, 0.85)); g.add(sphere(0.14, 0xffffff, -0.35, 0.85, 0.85));
  g.add(sphere(0.07, 0x111111, 0.35, 0.85, 0.98)); g.add(sphere(0.07, 0x111111, -0.35, 0.85, 0.98));
  [[0.6, 0.6], [-0.6, 0.6], [0, -0.7]].forEach(([x, z]) => { const w = cyl(0.2, 0.2, 0.15, 0x222222, x, 0.2, z); w.rotation.z = Math.PI / 2; g.add(w); });
  g.userData = { nozzle, body, t: 0 };
  return g;
}

export function makeCanOpener() {
  const g = new THREE.Group();
  const armL = box(0.5, 4.5, 0.4, 0xbfc5cc, -0.6, 2.5, 0); const armR = box(0.5, 4.5, 0.4, 0xbfc5cc, 0.6, 2.5, 0);
  armL.rotation.z = 0.12; armR.rotation.z = -0.12; g.add(armL, armR);
  g.add(box(1.4, 0.9, 0.6, 0x8a9099, 0, 4.9, 0));
  const blade = cyl(0.6, 0.6, 0.15, 0xdfe6ee, 0, 0.5, 0.2, 16); blade.rotation.x = Math.PI / 2; g.add(blade);
  const knob = cyl(0.25, 0.25, 0.9, 0x555555, 0, 4.9, 0.8); knob.rotation.x = Math.PI / 2; g.add(knob);
  g.add(sphere(0.18, 0xffffff, 0.3, 5.1, 0.35)); g.add(sphere(0.18, 0xffffff, -0.3, 5.1, 0.35));
  g.add(sphere(0.09, 0x111111, 0.3, 5.1, 0.5)); g.add(sphere(0.09, 0x111111, -0.3, 5.1, 0.5));
  g.userData = { blade, knob, t: 0 };
  return g;
}

export function makeBird(kind = 'seagull') {
  const g = new THREE.Group();
  const c = kind === 'seagull' ? 0xf4f4f4 : 0x7d8aa0, wing = kind === 'seagull' ? 0xd9d9d9 : 0x5b6880, beak = kind === 'seagull' ? 0xffb21c : 0x333333;
  const s = kind === 'seagull' ? 1.6 : 1.0;
  g.add(box(0.5 * s, 0.4 * s, 1.0 * s, c, 0, 0.4 * s, 0));
  const head = sphere(0.28 * s, c, 0, 0.7 * s, 0.55 * s); g.add(head);
  g.add(cone(0.1 * s, 0.4 * s, beak, 0, 0.68 * s, 0.9 * s).rotateX(Math.PI / 2));
  g.add(sphere(0.06 * s, 0x111111, 0.15 * s, 0.78 * s, 0.7 * s)); g.add(sphere(0.06 * s, 0x111111, -0.15 * s, 0.78 * s, 0.7 * s));
  const wL = box(1.2 * s, 0.08 * s, 0.6 * s, wing, 0.8 * s, 0.5 * s, 0); const wR = box(1.2 * s, 0.08 * s, 0.6 * s, wing, -0.8 * s, 0.5 * s, 0);
  const pivL = new THREE.Group(); pivL.position.set(0.25 * s, 0.5 * s, 0); wL.position.set(0.6 * s, 0, 0); pivL.add(wL);
  const pivR = new THREE.Group(); pivR.position.set(-0.25 * s, 0.5 * s, 0); wR.position.set(-0.6 * s, 0, 0); pivR.add(wR);
  g.add(pivL, pivR);
  g.add(box(0.3 * s, 0.05 * s, 0.4 * s, wing, 0, 0.45 * s, -0.6 * s));
  g.add(cyl(0.03, 0.03, 0.3 * s, beak, 0.12 * s, 0.1 * s, 0)); g.add(cyl(0.03, 0.03, 0.3 * s, beak, -0.12 * s, 0.1 * s, 0));
  g.userData = { wings: [pivL, pivR], t: 0 };
  return g;
}

export function makeRat(scale = 1) {
  const g = new THREE.Group();
  const c = 0x6f6f72;
  g.add(box(0.7, 0.5, 1.2, c, 0, 0.45, 0)); g.add(box(0.5, 0.45, 0.6, c, 0, 0.55, 0.8));
  g.add(cone(0.18, 0.45, 0xffb6c1, 0, 0.5, 1.3).rotateX(Math.PI / 2));
  g.add(sphere(0.18, 0xffb6c1, 0.28, 0.85, 0.65)); g.add(sphere(0.18, 0xffb6c1, -0.28, 0.85, 0.65));
  g.add(sphere(0.07, 0xff2222, 0.18, 0.65, 1.05)); g.add(sphere(0.07, 0xff2222, -0.18, 0.65, 1.05));
  const tail = cyl(0.03, 0.08, 1.4, 0xffb6c1, 0, 0.35, -1.2); tail.rotation.x = Math.PI / 2 + 0.3; g.add(tail);
  const legs = [];
  [[0.25, 0.5], [-0.25, 0.5], [0.25, -0.4], [-0.25, -0.4]].forEach(([x, z]) => { const l = box(0.15, 0.35, 0.15, 0xffb6c1, x, 0.18, z); g.add(l); legs.push(l); });
  g.scale.setScalar(scale);
  g.userData = { legs, tail, t: 0 };
  return g;
}

export function makeFatMan() {
  const g = new THREE.Group();
  g.add(cyl(0.5, 0.9, 1.5, 0x3a5fa8, 0, 1.0, 0, 12)); // Hose
  g.add(cyl(1.0, 0.95, 1.3, 0xf2c744, 0, 2.3, 0, 12)); // Hemd / Bauch
  g.add(sphere(0.55, 0xf5c9a2, 0, 3.4, 0, 10)); // Kopf
  g.add(cyl(0.6, 0.6, 0.2, 0x8b1e1e, 0, 3.85, 0, 12)); g.add(cyl(0.35, 0.35, 0.3, 0x8b1e1e, 0, 4.05, 0, 12)); // Mütze
  g.add(sphere(0.07, 0x111111, 0.2, 3.5, 0.5)); g.add(sphere(0.07, 0x111111, -0.2, 3.5, 0.5));
  g.add(box(0.25, 0.08, 0.1, 0x3b2412, 0, 3.2, 0.52)); // Schnurrbart
  const armL = box(0.35, 1.3, 0.35, 0xf2c744, 1.05, 2.3, 0); const armR = box(0.35, 1.3, 0.35, 0xf2c744, -1.05, 2.3, 0);
  g.add(armL, armR);
  const bag = box(0.9, 1.0, 0.6, 0xd9a066, 1.1, 1.3, 0.3); g.add(bag); // Einkaufstüte
  g.add(box(0.5, 0.2, 0.5, 0xffe08a, 1.1, 1.9, 0.3)); g.add(cyl(0.18, 0.18, 0.5, 0xe8a04a, 0.9, 2.0, 0.3)); // Brot + Wurst oben in der Tüte
  const legs = [];
  [[0.35], [-0.35]].forEach(([x]) => { const l = box(0.4, 0.9, 0.4, 0x3a5fa8, x, 0.45, 0); g.add(l); legs.push(l); });
  g.userData = { legs, arms: [armL, armR], t: 0 };
  return g;
}

export function makeLabel(text, color = '#fff8e7', bg = 'rgba(59,36,18,.75)', size = 44) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128;
  const x = c.getContext('2d');
  x.fillStyle = bg; x.beginPath(); x.roundRect(10, 20, 492, 88, 30); x.fill();
  x.font = `900 ${size}px Trebuchet MS, sans-serif`; while (x.measureText(text).width > 460 && size > 16) { size -= 2; x.font = `900 ${size}px Trebuchet MS, sans-serif`; } x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = color;
  x.fillText(text, 256, 66);
  const tex = new THREE.CanvasTexture(c);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  sp.scale.set(4, 1, 1); return sp;
}

// Sammelobjekte
export function makeFood(kind) {
  const g = new THREE.Group();
  switch (kind) {
    case 'ham': g.add(cyl(0.35, 0.4, 0.45, 0xf08c8c, 0, 0.25, 0, 10)); g.add(cyl(0.12, 0.12, 0.9, 0xfff2cc, 0, 0.25, 0, 8).rotateZ(Math.PI / 2)); break;
    case 'treat': g.add(box(0.7, 0.2, 0.25, 0xd9a066, 0, 0.2, 0)); g.add(sphere(0.16, 0xd9a066, 0.35, 0.2, 0.1)); g.add(sphere(0.16, 0xd9a066, 0.35, 0.2, -0.1)); g.add(sphere(0.16, 0xd9a066, -0.35, 0.2, 0.1)); g.add(sphere(0.16, 0xd9a066, -0.35, 0.2, -0.1)); break;
    case 'fish': g.add(box(0.8, 0.3, 0.2, 0x7fb6d8, 0, 0.2, 0)); g.add(cone(0.2, 0.35, 0x7fb6d8, -0.55, 0.2, 0).rotateZ(Math.PI / 2)); g.add(sphere(0.05, 0x111111, 0.25, 0.25, 0.11)); break;
    case 'bread': g.add(box(0.6, 0.35, 0.4, 0xe8b86d, 0, 0.2, 0)); g.add(box(0.5, 0.1, 0.35, 0xc98a3e, 0, 0.42, 0)); break;
    case 'sausage': g.add(cyl(0.14, 0.14, 0.8, 0xc8502e, 0, 0.2, 0, 8).rotateZ(Math.PI / 2)); break;
    case 'cheese': g.add(box(0.6, 0.35, 0.5, 0xffd94a, 0, 0.2, 0)); g.add(sphere(0.08, 0xd9b300, 0.15, 0.4, 0.1)); g.add(sphere(0.06, 0xd9b300, -0.18, 0.3, -0.15)); break;
    case 'bone': g.add(box(0.7, 0.18, 0.18, 0xffe9a8, 0, 0.3, 0)); [[0.35, 0.1], [0.35, -0.1], [-0.35, 0.1], [-0.35, -0.1]].forEach(([x, z]) => g.add(sphere(0.14, 0xffe9a8, x, 0.3, z))); break;
    case 'goldbone': {
      g.add(box(0.9, 0.22, 0.22, 0xffcc33, 0, 0.5, 0)); [[0.45, 0.12], [0.45, -0.12], [-0.45, 0.12], [-0.45, -0.12]].forEach(([x, z]) => g.add(sphere(0.18, 0xffcc33, x, 0.5, z)));
      g.traverse(o => { if (o.material) { o.material.emissive = new THREE.Color(0x8a5a00); } });
      const halo = new THREE.Mesh(new THREE.RingGeometry(0.75, 1.0, 24), new THREE.MeshBasicMaterial({ color: 0xfff3a0, transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false }));
      halo.position.y = 0.5; g.add(halo); g.userData.halo = halo;
      break;
    }
    case 'fries': { // Pommes-Tüte
      g.add(cyl(0.22, 0.16, 0.45, 0xe74c3c, 0, 0.25, 0, 8));
      for (let i = 0; i < 7; i++) g.add(box(0.06, 0.4, 0.06, 0xffd34d, Math.cos(i * 0.9) * 0.12, 0.6 + (i % 3) * 0.04, Math.sin(i * 0.9) * 0.12).rotateZ((i - 3) * 0.06));
      break;
    }
    case 'ice': { // Eiskugel in der Waffel
      g.add(cone(0.22, 0.6, 0xd9a066, 0, 0.3, 0, 8).rotateX(Math.PI)); g.add(sphere(0.26, 0xffb3c6, 0, 0.66, 0)); break;
    }
    case 'shell': { // Muschel zum Sammeln
      for (let i = 0; i < 5; i++) { const r = box(0.12, 0.08, 0.5, i % 2 ? 0xffd1dc : 0xffb3c6, (i - 2) * 0.1, 0.18, 0); r.rotation.y = (i - 2) * 0.3; g.add(r); }
      g.add(sphere(0.08, 0xffb3c6, 0, 0.18, -0.25)); break;
    }
    default: g.add(sphere(0.18, 0xd98c4a, 0, 0.2, 0)); // Krümel
  }
  g.userData.spin = Math.random() * Math.PI * 2;
  return g;
}

export function makeTree(scale = 1) {
  const g = new THREE.Group();
  g.add(cyl(0.25 * scale, 0.35 * scale, 1.5 * scale, 0x7a4a1f, 0, 0.75 * scale, 0, 7));
  g.add(cone(1.3 * scale, 2 * scale, 0x4caa4c, 0, 2.3 * scale, 0, 7)); g.add(cone(1.0 * scale, 1.6 * scale, 0x5fc25f, 0, 3.3 * scale, 0, 7));
  return g;
}
export function makeBush(w = 2) {
  const g = new THREE.Group();
  for (let i = 0; i < 4; i++) g.add(sphere(w * 0.45, i % 2 ? 0x3d9a3d : 0x4fb24f, (Math.random() - 0.5) * w * 0.6, 0.5 + Math.random() * 0.3, (Math.random() - 0.5) * w * 0.6, 6));
  return g;
}

// Laubbaum mit runder Krone (optional mit Äpfeln)
export function makeRoundTree(scale = 1, apples = false) {
  const g = new THREE.Group();
  g.add(cyl(0.3 * scale, 0.4 * scale, 2 * scale, 0x7a4a1f, 0, scale, 0, 7));
  const leaf = [0x4caa4c, 0x5fc25f, 0x3d9a3d];
  [[0, 3, 0, 1.6], [0.9, 2.6, 0.3, 1.1], [-0.8, 2.7, -0.4, 1.2], [0.2, 3.8, -0.3, 1.1]].forEach(([x, y, z, r], i) => {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r * scale, 0), mat(leaf[i % 3], { flatShading: true })); m.position.set(x * scale, y * scale, z * scale); m.castShadow = true; g.add(m);
  });
  if (apples) for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; g.add(sphere(0.16 * scale, 0xe53935, Math.cos(a) * 1.45 * scale, (2.6 + (i % 3) * 0.5) * scale, Math.sin(a) * 1.45 * scale, 6)); }
  return g;
}

// Blumenbeet: bunte Blüten auf Stielen
export function makeFlowers(w = 3, d = 1, n = 12) {
  const g = new THREE.Group(), cols = [0xff6b9d, 0xffd93d, 0xffffff, 0xa29bfe, 0xff7675, 0xfd9644];
  g.add(box(w, 0.25, d, 0x6d4c2f, 0, 0.12, 0));
  for (let i = 0; i < n; i++) {
    const x = (Math.random() - 0.5) * (w - 0.3), z = (Math.random() - 0.5) * (d - 0.2), h = 0.45 + Math.random() * 0.35;
    g.add(cyl(0.03, 0.03, h, 0x3d9a3d, x, 0.25 + h / 2, z, 4));
    const c = cols[Math.floor(Math.random() * cols.length)], f = sphere(0.13, c, x, 0.3 + h, z, 6); f.scale.y = 0.6; g.add(f);
    g.add(sphere(0.05, 0xffd93d, x, 0.36 + h, z, 4));
  }
  return g;
}

// Schmetterling: zwei Flügel an Gelenken
export function makeButterfly(color = 0xff9ff3) {
  const g = new THREE.Group();
  g.add(box(0.05, 0.05, 0.25, 0x333333));
  const wings = [1, -1].map(sx => { const p = new THREE.Group(); const w = new THREE.Mesh(new THREE.CircleGeometry(0.18, 6), mat(color, { side: THREE.DoubleSide })); w.rotation.x = -Math.PI / 2; w.position.x = sx * 0.17; p.add(w); g.add(p); return p; });
  g.userData = { wings, t: Math.random() * 10 };
  return g;
}

// Gartenzwerg
export function makeGnome() {
  const g = new THREE.Group();
  g.add(cyl(0.25, 0.3, 0.5, 0x2e86de, 0, 0.25, 0, 8)); g.add(sphere(0.2, 0xf5c9a2, 0, 0.65, 0, 8));
  g.add(cone(0.22, 0.5, 0xe74c3c, 0, 1.0, 0, 8)); const beard = cone(0.18, 0.35, 0xffffff, 0, 0.5, 0.12, 6); beard.rotation.x = Math.PI; g.add(beard);
  return g;
}

// Taucherbrille: zwei Gläser, Steg und Gummiband
export function makeGoggles() {
  const g = new THREE.Group(), glass = new THREE.MeshLambertMaterial({ color: 0x9be7ff, transparent: true, opacity: 0.7, emissive: 0x2d9cdb, emissiveIntensity: 0.5 });
  [-0.32, 0.32].forEach(x => { const f = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.07, 6, 16), mat(0xff7f27)); f.position.x = x; g.add(f); const l = new THREE.Mesh(new THREE.CircleGeometry(0.24, 16), glass); l.position.set(x, 0, 0.01); g.add(l); });
  g.add(box(0.2, 0.08, 0.08, 0xff7f27));
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.04, 4, 20, Math.PI), mat(0x2d3436)); band.rotation.set(Math.PI / 2, 0, 0); band.position.z = -0.05; g.add(band);
  g.scale.setScalar(1.3); return g;
}

// Riesenkrabbe Kneifer: Panzer, zwei Scheren, sechs Beine, Stielaugen
export function makeCrab(color = 0xe0503a) {
  const g = new THREE.Group(), dark = new THREE.Color(color).multiplyScalar(0.7).getHex();
  const body = sphere(0.8, color, 0, 0.7, 0, 10); body.scale.set(1.3, 0.55, 1); g.add(body);
  const claws = [-1, 1].map(sx => {
    const c = new THREE.Group(); c.position.set(sx * 1.0, 0.8, 0.7);
    c.add(box(0.25, 0.25, 0.7, dark, 0, 0, 0.3)); const pin = new THREE.Group(); pin.position.z = 0.75; c.add(pin);
    pin.add(sphere(0.32, color, 0, 0, 0.15, 8)); pin.add(cone(0.14, 0.45, color, 0, 0.12, 0.45).rotateX(Math.PI / 2)); pin.add(cone(0.12, 0.4, dark, 0, -0.12, 0.42).rotateX(Math.PI / 2));
    g.add(c); return c;
  });
  const legs = []; for (let i = 0; i < 6; i++) { const sx = i < 3 ? -1 : 1, k = i % 3; const l = new THREE.Group(); l.position.set(sx * 0.85, 0.6, -0.3 + k * 0.35); const seg = box(0.9, 0.12, 0.12, dark, sx * 0.4, -0.15, 0); seg.rotation.z = sx * -0.6; l.add(seg); g.add(l); legs.push(l); }
  [-0.25, 0.25].forEach(x => { g.add(box(0.07, 0.4, 0.07, dark, x, 1.15, 0.55)); g.add(sphere(0.11, 0xffffff, x, 1.38, 0.55, 8)); g.add(sphere(0.06, 0x111111, x, 1.4, 0.64, 6)); });
  g.userData = { claws, legs, t: 0 }; return g;
}

// Qualle: halbe Glocke, schwingende Tentakel, leuchtet leicht
export function makeJelly() {
  const g = new THREE.Group(), m = new THREE.MeshLambertMaterial({ color: 0xff9ff3, transparent: true, opacity: 0.7, emissive: 0xff6fd8, emissiveIntensity: 0.5 });
  const bell = new THREE.Mesh(new THREE.SphereGeometry(0.6, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), m); g.add(bell);
  const tent = []; for (let i = 0; i < 6; i++) { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.02, 1.2, 4), m); const a = i / 6 * Math.PI * 2; t.position.set(Math.cos(a) * 0.35, -0.6, Math.sin(a) * 0.35); g.add(t); tent.push(t); }
  g.userData = { bell, tent }; return g;
}

// Riesenmuschel am Riff: Schale klappt beim Biss auf
export function makeClam() {
  const g = new THREE.Group(), lid = new THREE.Group();
  const lo = sphere(1.0, 0x8e7cc3, 0, 0, 0, 10); lo.scale.set(1.2, 0.35, 1); g.add(lo);
  const up = sphere(1.0, 0xa593e0, 0, 0, 0.9, 10); up.scale.set(1.2, 0.35, 1); lid.add(up); lid.position.set(0, 0.15, -0.9); g.add(lid);
  g.add(sphere(0.25, 0xffffff, 0, 0.3, 0, 10)); // Perle
  g.userData.lid = lid; return g;
}

// Ein anderer Hund (Rettungsschwimmer, Burg-Bauer …): Moll in anderer Fellfarbe mit Mütze
export function makeNpcDog(fur = 0xd9a441, cap = 0xe74c3c) {
  const g = makeDog(), from = [0x8b5a2b, 0x5a3715, 0xa8743f], to = new THREE.Color(fur);
  g.traverse(o => { if (o.material && o.material.color) { const h = o.material.color.getHex(), i = from.indexOf(h); if (i >= 0) { o.material = o.material.clone(); o.material.color.copy(to).multiplyScalar([1, 0.7, 1.15][i]); } } });
  const u = g.userData; if (u.head) { const c = cyl(0.32, 0.36, 0.2, cap, 0, 0.5, 0, 10); u.head.add(c); }
  return g;
}
