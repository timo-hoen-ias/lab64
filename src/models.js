// Low-Poly-Modelle aus Grundkörpern. Alle Figuren sind Gruppen mit benannten Teilen für Animationen.
import * as THREE from 'three';
import { toonGradient, addSway, makeGlow } from './fx.js';
import { texturedAsset } from './assets.js';

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

// Figuren zusammenfassen: In jeder Gruppe werden die Teile, die nicht einzeln animiert werden (nicht in userData),
// zu einem Mesh mit Vertexfarben gebacken. Gleiches Aussehen, aber viel weniger Zeichenaufrufe (wichtig fürs Handy).
export function compact(root) {
  const keep = new Set(), mark = v => { if (v?.isObject3D) keep.add(v); else if (Array.isArray(v)) v.forEach(mark); };
  Object.values(root.userData).forEach(mark);
  const groups = []; root.traverse(o => { if (!o.isMesh) groups.push(o); });
  const c = new THREE.Color();
  for (const grp of groups) {
    const list = grp.children.filter(m => m.isMesh && !keep.has(m) && !m.children.length && m.material.isMeshToonMaterial && !m.material.transparent && !m.material.vertexColors && !(m.material.emissive?.getHex()));
    if (list.length < 2) continue;
    const pos = [], nor = [], col = [];
    for (const m of list) {
      m.updateMatrix(); const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone(); g.applyMatrix4(m.matrix);
      c.copy(m.material.color); pos.push(...g.attributes.position.array); nor.push(...g.attributes.normal.array);
      for (let i = 0; i < g.attributes.position.count; i++) col.push(c.r, c.g, c.b);
      g.dispose(); m.geometry.dispose(); grp.remove(m);
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    const mm = new THREE.Mesh(geo, mat(0xffffff, { vertexColors: true })); mm.castShadow = true; mm.receiveShadow = list[0].receiveShadow; mm.frustumCulled = list[0].frustumCulled; grp.add(mm);
  }
  return root;
}

// ---------- Moll, der braune Labrador ------------------------------------
export function makeDog() {
  const g = new THREE.Group();
  const brown = 0x8b5a2b, dark = 0x5a3715, light = 0xa8743f, nose = 0x2a1a0e;
  const rig = new THREE.Group(); g.add(rig); // alles außer Schatten hängt am Rig → Squash/Stretch und Neigung
  // Rücken in zwei Hälften (Drehpunkt Körpermitte): front = Brust, Hals, Kopf, Vorderbeine; rear = Hüfte, Hinterbeine, Schwanz.
  // So kann sich der Rücken im Galopp krümmen und strecken.
  const front = new THREE.Group(), rear = new THREE.Group(); front.position.y = rear.position.y = 0.75; rig.add(front, rear);
  const on = (grp, o) => { o.position.y -= 0.75; grp.add(o); return o; };
  const body = box(0.9, 0.6, 1.5, brown, 0, 0.75, 0); rig.add(body);
  on(front, box(0.95, 0.5, 0.5, brown, 0, 0.72, 0.55)); // Brust
  rig.add(box(0.7, 0.12, 1.2, light, 0, 0.44, 0)); // Bauch
  on(rear, box(0.96, 0.56, 0.5, brown, 0, 0.8, -0.5)); // Hüfte
  on(front, box(0.5, 0.5, 0.45, brown, 0, 1.05, 0.75)); // Hals
  on(front, box(0.58, 0.14, 0.5, 0xd63031, 0, 1.1, 0.78)); // Halsband
  const tag = cyl(0.09, 0.09, 0.04, 0xffcc33, 0, 0.98, 1.05, 10); tag.rotation.x = Math.PI / 2; on(front, tag); // Hundemarke
  const head = new THREE.Group(); head.position.set(0, 1.3, 0.95);
  head.add(box(0.7, 0.6, 0.65, brown));
  head.add(box(0.4, 0.35, 0.5, light, 0, -0.1, 0.5)); // Schnauze
  head.add(box(0.72, 0.08, 0.2, dark, 0, 0.27, 0.25)); // Stirn / Augenbrauen
  head.add(sphere(0.12, nose, 0, -0.02, 0.78)); // Nase
  [-1, 1].forEach(sx => head.add(box(0.16, 0.2, 0.32, light, sx * 0.17, -0.2, 0.46))); // Lefzen
  head.add(box(0.26, 0.03, 0.04, nose, 0, -0.27, 0.755)); // Maul
  const eyes = [];
  [0.22, -0.22].forEach(x => {
    const e = new THREE.Group(); e.position.set(x, 0.12, 0.3);
    e.add(sphere(0.085, 0x111111)); e.add(sphere(0.03, 0xffffff, x > 0 ? 0.025 : -0.025, 0.035, 0.065, 6)); // Glanzpunkt
    head.add(e); eyes.push(e);
  });
  const earL = box(0.18, 0.5, 0.3, dark, 0.4, -0.05, -0.05); earL.rotation.z = -0.25; head.add(earL);
  const earR = box(0.18, 0.5, 0.3, dark, -0.4, -0.05, -0.05); earR.rotation.z = 0.25; head.add(earR);
  const tongue = box(0.16, 0.05, 0.3, 0xff6b8a, 0, -0.3, 0.62); head.add(tongue);
  on(front, head);
  const legs = [];
  [[0.3, 0.45], [-0.3, 0.45], [0.3, -0.5], [-0.3, -0.5]].forEach(([x, z]) => {
    const leg = new THREE.Group(); leg.position.set(x, 0.55, z);
    leg.add(box(0.26, 0.6, 0.28, brown, 0, -0.3, 0)); leg.add(box(0.28, 0.14, 0.34, dark, 0, -0.6, 0.03));
    on(z > 0 ? front : rear, leg); legs.push(leg);
  });
  const tail = new THREE.Group(); tail.position.set(0, 0.95, -0.75);
  const tailMesh = box(0.18, 0.18, 0.7, brown, 0, 0.15, -0.3); tailMesh.rotation.x = -0.6; tail.add(tailMesh);
  on(rear, tail);
  g.userData = { rig, front, rear, head, legs, tail, body, earL, earR, tongue, eyes, t: 0, idle: 0, blink: 2, lean: 0, look: 0 };
  g.traverse(o => { if (o.isMesh) o.frustumCulled = false; }); // Moll ist immer im Bild; verhindert, dass Kopf oder Schwanz auf manchen Handys weggeschnitten werden
  return g;
}

// Ein Bein über die Schrittphase q (0..1): erst Stand (Pfote am Boden, wandert von vorn nach hinten), dann Schwung nach vorn.
// reach: Winkel vorn (negativ), push: Winkel hinten, lift: wie stark das Bein im Schwung angezogen wird (Knie/Sprunggelenk).
// Liefert [Winkel, Beinlänge]: im Stand wird das schräge Bein etwas länger, damit die Pfote am Boden bleibt.
const plant = a => Math.min(1.12, 1 / Math.cos(a));
function stride(q, duty, reach, push, lift) {
  if (q < duty) { const a = reach + (push - reach) * (q / duty); return [a, plant(a)]; }
  const f = (q - duty) / (1 - duty), e = f * f * (3 - 2 * f);
  return [push + (reach - push) * e, plant(push) + (plant(reach) - plant(push)) * e - Math.sin(f * Math.PI) * lift];
}
const TAU = Math.PI * 2;
const TROT = [0, 0.5, 0.5, 0]; // Trab: diagonale Beinpaare (vorn links + hinten rechts, vorn rechts + hinten links)
const GALLOP = [0.54, 0.42, 0, 0.1]; // Rotationsgalopp: hinten links, hinten rechts, vorn rechts, vorn links

// Hundeanimation: speed (0..1, darüber z. B. Zoomies = schnellere Schritte), airborne, dt, bite (0..1), vy (Fallgeschwindigkeit), turn (Drehrate)
// Langsam trabt Moll, bei Vollgas galoppiert sie mit Rückenbeugung; beide Gangarten werden je nach Tempo überblendet.
export function animateDog(dog, speed, airborne, dt, bite = 0, vy = 0, turn = 0, swim = false) {
  const u = dog.userData; u.t += dt * (4 + Math.min(1, speed) * 10); u.steps = [];
  u.legs.forEach(leg => { leg.scale.y = 1; });
  if (swim) { // Hundepaddeln: Kopf hoch, Beine strampeln, Schwanz als Ruder
    u.t += dt * 6; u.idle = 0; u.sm = 0;
    u.legs.forEach((leg, i) => { leg.rotation.x = Math.sin(u.t * 1.5 + (i % 2 ? Math.PI : 0) + (i > 1 ? 1 : 0)) * 0.7 - 0.3; });
    u.rig.position.y = Math.sin(u.t * 0.8) * 0.05; u.rig.rotation.x = -0.18; u.rig.rotation.z = Math.sin(u.t * 0.4) * 0.05;
    u.front.rotation.set(0, 0, 0); u.rear.rotation.set(0, 0, 0); u.body.scale.z = 1;
    u.head.rotation.set(-0.25, 0, 0); u.tail.rotation.y = Math.sin(u.t * 0.9) * 0.6; u.tail.rotation.x = 0.4;
    u.earL.rotation.z = -0.6; u.earR.rotation.z = 0.6; u.tongue.visible = false; u.body.scale.y = 1; u.head.position.z = 0.95;
    return;
  }
  // Weiche Übergänge: Laufstärke, Gangart und Sprung-Pose werden überblendet statt umgeschaltet
  u.sm = (u.sm ?? 0) + ((airborne ? 0 : speed) - (u.sm ?? 0)) * Math.min(1, dt * 10);
  u.air = (u.air ?? 0) + ((airborne ? 1 : 0) - (u.air ?? 0)) * Math.min(1, dt * (airborne ? 14 : 9));
  const sp = u.sm, s = Math.min(1, sp), A = u.air, k = THREE.MathUtils.clamp(vy / 10, -1, 1); // hoch: Beine gestreckt, runter: zum Landen bereit
  if (!airborne) u.gait = (u.gait ?? 0) + (THREE.MathUtils.smoothstep(sp, 0.62, 0.88) - (u.gait ?? 0)) * Math.min(1, dt * 5);
  const G = u.gait ?? 0, on = Math.min(1, s * 5) * (1 - A); // G: 0 = Trab, 1 = Galopp; on: Laufbewegung sichtbar
  // Schrittphase: Trab 1,5–3 Schritte/s, Galopp längere Sprünge mit ~3 Sprüngen/s
  const ph0 = u.ph ?? 0; u.ph = (ph0 + dt * THREE.MathUtils.lerp(1.5 + 1.6 * sp, 2.6 + 0.6 * sp, G) * (1 - A * 0.7)) % 1;
  const ph = u.ph, ta = 0.22 + 0.28 * s;
  // Pfotenaufsätze dieses Frames (Beinindex, 0/1 = vorn): eine Pfote setzt auf, wenn die Phase ihren Versatz überschreitet → Schrittgeräusche
  const adv = (ph - ph0 + 1) % 1;
  if (!airborne && on > 0.35 && adv > 0) (G < 0.5 ? TROT : GALLOP).forEach((o, i) => { const q = (o - ph0 + 1) % 1; if (q > 0 && q <= adv) u.steps.push(i); });
  u.legs.forEach((leg, i) => {
    const fr = i < 2;
    const [ta0, tl] = stride((ph - TROT[i] + 1) % 1, 0.55, fr ? -ta - 0.05 : -ta + 0.08, fr ? ta - 0.08 : ta + 0.05, 0.2);
    const [ga0, gl] = stride((ph - GALLOP[i] + 1) % 1, 0.34, fr ? -1.05 : -0.55, fr ? 0.5 : 1.05, 0.35);
    const run = THREE.MathUtils.lerp(ta0, ga0, G) * on, jump = fr ? -0.6 - k * 0.5 : 0.4 + k * 0.5;
    leg.rotation.x = run + (jump - run) * A;
    leg.scale.y = 1 + (THREE.MathUtils.lerp(tl, gl, G) - 1) * on;
  });
  // Körper: Trab wippt leicht zweimal pro Schritt und schaukelt seitlich; Galopp hebt und senkt Vorder-/Hinterteil,
  // der Rücken krümmt sich in der Schwebephase (alle Beine unterm Bauch) und streckt sich, wenn die Vorderbeine weit greifen.
  const flex = Math.cos(TAU * (ph - 0.93)) * G * on - 0.4 * A * (k > 0 ? 1 : 0.3); // +1 gekrümmt, -1 gestreckt
  const pitch = THREE.MathUtils.lerp(Math.sin(TAU * 2 * ph) * 0.02, -Math.sin(TAU * (ph - 0.02)) * 0.13, G) * on;
  u.rig.position.y = THREE.MathUtils.lerp(0.035 * (0.5 - 0.5 * Math.cos(TAU * 2 * ph)), 0.13 * (0.5 + 0.5 * Math.cos(TAU * (ph - 0.93))), G) * on;
  u.rig.rotation.x = pitch - THREE.MathUtils.clamp(vy * 0.03, -0.35, 0.35) * A;
  u.front.rotation.x = flex * 0.15; u.rear.rotation.x = -flex * 0.2; u.body.scale.z = 1 - flex * 0.05;
  const sway = Math.sin(TAU * ph) * 0.05 * (1 - G) * on; u.front.rotation.z = -sway; u.rear.rotation.z = sway;
  // In Kurven reinlehnen
  u.lean += (THREE.MathUtils.clamp(-turn * 0.08, -0.3, 0.3) * s - u.lean) * Math.min(1, dt * 8); u.rig.rotation.z = u.lean;
  // Leerlauf: Atmen, Umschauen, Schwanzwedeln
  u.idle = speed < 0.05 && !airborne ? u.idle + dt : 0;
  const idle = Math.min(1, u.idle * 2);
  u.look = idle * Math.sin(u.idle * 0.9) * 0.5 * (Math.sin(u.idle * 0.33) > 0 ? 1 : 0.3);
  u.head.rotation.y = u.look;
  // Schwanz: im Trab locker erhoben und wedelnd, im Galopp lang nach hinten gestreckt als Steuer, wippt mit dem Rücken
  u.tail.rotation.y = Math.sin(u.t * 1.7 + u.idle * 14 * idle) * ((0.45 + s * 0.3) * (1 - 0.75 * G * on) + idle * 0.3);
  u.tail.rotation.x = airborne ? 0.5 : -0.1 * idle + THREE.MathUtils.lerp(0.15, -0.05 + Math.sin(TAU * (ph - 0.15)) * 0.2, G) * on;
  // Kopf: hält den Blick ruhig (gleicht das Nicken des Körpers aus), im Galopp tiefer und nach vorn gestreckt
  u.head.rotation.x = airborne ? -0.3 : -(pitch + u.front.rotation.x) * 0.7 + (Math.sin(TAU * 2 * ph) * 0.05 * (1 - G) + 0.12 * G) * on + Math.sin(u.idle * 2.2) * 0.04 * idle;
  // Ohren schwingen träge nach (Schlappohren)
  const earT = airborne ? 0.4 + vy * 0.04 : THREE.MathUtils.lerp(Math.abs(Math.sin(TAU * 2 * ph)) * 0.15, 0.15 + 0.6 * (0.5 + 0.5 * Math.sin(TAU * (ph - 0.75))), G) * on; // Galopp: Ohren flattern mit jedem Sprung
  u.ear = (u.ear ?? 0) + (earT - (u.ear ?? 0)) * Math.min(1, dt * 12);
  u.earL.rotation.z = -0.25 - u.ear; u.earR.rotation.z = 0.25 + u.ear;
  u.body.scale.y = 1 + Math.sin(TAU * 2 * ph) * 0.02 * on + Math.sin(u.idle * 3) * 0.03 * idle;
  u.tongue.visible = speed > 0.5 || bite > 0 || idle > 0.9;
  u.tongue.position.y = -0.3 + Math.sin(u.idle * 6) * 0.015;
  // Blinzeln
  u.blink -= dt; const closed = u.blink < 0.12; if (u.blink < 0) u.blink = 2 + Math.random() * 3;
  u.eyes.forEach(e => { e.scale.y = closed ? 0.15 : 1; });
  if (bite > 0) { u.head.rotation.x = -0.4 + bite * 0.9; u.head.position.z = 0.95 + bite * 0.5; }
  else u.head.position.z = 0.95;
}

// ---------- Gegner / Figuren -------------------------------------------
// Lebendigkeit für alle Figuren: Blinzeln, Ohrenzucken, Schwanz/Tentakel schwingen weich nach, Atmen.
// Läuft zusätzlich zur jeweiligen Gegner-KI und fasst nur Teile an, die die KI nicht setzt.
export function animateLife(m, dt, speed = 0) {
  const u = m.userData; u.lt = (u.lt ?? Math.random() * 10) + dt; const t = u.lt;
  if (u.eyes) { u.bl = (u.bl ?? 1 + Math.random() * 3) - dt; const c = u.bl < 0.12; if (u.bl < 0) u.bl = 1.5 + Math.random() * 3.5; u.eyes.forEach(e => { e.scale.y = c ? 0.12 : 1; }); }
  if (u.ears) u.ears.forEach((e, i) => { e.rotation.z = (i ? -1 : 1) * Math.max(0, Math.sin(t * 1.3 + i * 2) - 0.92) * 4; });
  if (u.tailSegs) u.tailSegs.forEach((sg, i) => { sg.rotation.y = Math.sin(t * (3 + speed * 6) - i * 0.7) * (0.18 + speed * 0.12); });
  if (u.tentSegs) u.tentSegs.forEach((sg, i) => { sg.rotation.z = Math.sin(t * 2.4 - i * 0.9) * 0.25; });
  if (u.tips) u.tips.forEach((tp, i) => { tp.rotation.z = (i ? 1 : -1) * Math.sin(t * 14 - 1.2) * 0.35; }); // Flügelspitzen schlagen nach
  if (u.belly) u.belly.scale.set(1 + Math.sin(t * 2) * 0.02, 1 - Math.sin(t * 2) * 0.02 + Math.abs(Math.sin(t * 6)) * 0.03 * speed, 1 + Math.sin(t * 2) * 0.02);
  if (u.head) { u.hy ??= u.head.position.y; u.head.position.y = u.hy + Math.sin(t * (2 + speed * 8)) * 0.03 * (1 + speed * 2); }
  if (u.stalks) u.stalks.forEach((e, i) => { e.rotation.z = Math.sin(t * 2.5 + i * 2) * 0.18; e.rotation.x = Math.sin(t * 1.7 + i) * 0.1; });
  if (u.pincers) u.pincers.forEach((p, i) => { p.rotation.x = Math.max(0, Math.sin(t * 3 + i * 1.7)) * 0.5; });
  if (u.lamp) u.lamp.material.emissiveIntensity = 0.6 + Math.sin(t * 8) * 0.4;
  if (u.core) u.core.material.opacity = 0.55 + Math.sin(t * 3) * 0.25;
}
const shade = (hex, k) => new THREE.Color(hex).multiplyScalar(k).getHex();
const thin = (w, h, d, color, x, y, z) => { const m = box(w, h, d, color, x, y, z); m.userData.noOutline = true; m.castShadow = false; return m; };
// Augen mit Glanzpunkt in einer Gruppe (zum Blinzeln über scale.y); brow = böse Augenbraue
function eye(r, iris, x, y, z, o = {}) {
  const e = new THREE.Group(); e.position.set(x, y, z);
  if (o.white) { const w = sphere(r * 1.35, 0xffffff, 0, 0, -r * 0.3, 8); w.scale.z = 0.6; e.add(w); }
  const i = sphere(r, iris, 0, 0, 0, 8); i.scale.z = 0.6; e.add(i);
  if (o.slit) e.add(thin(r * 0.28, r * 1.5, r * 0.2, 0x111111, 0, 0, r * 0.62)); else if (o.pupil !== false) e.add(sphere(r * 0.5, 0x111111, 0, 0, r * 0.45, 6));
  const gl = sphere(r * 0.28, 0xffffff, r * 0.3 * Math.sign(x || 1), r * 0.35, r * 0.7, 4); gl.userData.noOutline = true; e.add(gl);
  return e;
}
function brows(head, x, y, z, color, angry = 0.35, w = 0.26) {
  [-1, 1].forEach(s => { const b = box(w, 0.07, 0.07, color, s * x, y, z); b.rotation.z = -s * angry; head.add(b); });
}
// Kette aus Gliedern (Schwanz, Tentakel): jedes Glied hängt am vorigen → weiches Schwingen
function chain(n, len, r0, r1, color, dir = [0, 0, -1], tip) {
  const root = new THREE.Group(), segs = []; let par = root;
  for (let i = 0; i < n; i++) {
    const k = i / Math.max(1, n - 1), r = r0 + (r1 - r0) * k, seg = new THREE.Group();
    if (i) seg.position.set(dir[0] * len, dir[1] * len, dir[2] * len);
    const m = dir[1] ? cyl(r, r, len * 1.08, i === n - 1 && tip ? tip : color, 0, dir[1] * len / 2, 0, 6) : box(r * 2, r * 2, len * 1.08, i === n - 1 && tip ? tip : color, dir[0] * len / 2, 0, dir[2] * len / 2);
    seg.add(m); par.add(seg); segs.push(seg); par = seg;
  }
  return { root, segs };
}

export function makeCat(color = 0x3b3b3b) {
  const g = new THREE.Group(), dark = shade(color, 0.6), light = shade(color, 1.7), pink = 0xff9aa9;
  const body = new THREE.Group(); g.add(body);
  body.add(box(1.0, 0.7, 1.7, color, 0, 0.85, 0)); body.add(box(0.92, 0.62, 0.5, color, 0, 0.9, 0.72)); // Brust
  body.add(box(1.04, 0.6, 0.55, color, 0, 0.92, -0.62)); // Hüfte
  body.add(box(0.8, 0.12, 1.3, light, 0, 0.5, 0.05)); // Bauch
  for (let i = 0; i < 3; i++) body.add(box(1.06, 0.45, 0.14, dark, 0, 1.0, -0.45 + i * 0.35)); // Streifen
  const head = new THREE.Group(); head.position.set(0, 1.45, 1.0);
  head.add(box(0.8, 0.65, 0.62, color)); head.add(box(0.98, 0.3, 0.42, color, 0, -0.17, 0.04)); // Kopf + Backen
  head.add(box(0.38, 0.2, 0.22, light, 0, -0.17, 0.32)); head.add(sphere(0.07, pink, 0, -0.06, 0.42, 6)); // Schnauze, Nase
  head.add(box(0.2, 0.04, 0.04, 0x1a1a1a, 0, -0.29, 0.43)); // Maul
  const ears = [-1, 1].map(s => { const e = new THREE.Group(); e.position.set(s * 0.25, 0.32, -0.02); e.add(cone(0.18, 0.4, color, 0, 0.16, 0, 4)); const inn = cone(0.1, 0.26, pink, 0, 0.13, 0.07, 4); inn.userData.noOutline = true; e.add(inn); head.add(e); return e; });
  const eyes = [-1, 1].map(s => { const e = eye(0.1, 0xd8ff50, s * 0.2, 0.06, 0.29, { slit: true }); head.add(e); return e; });
  brows(head, 0.2, 0.2, 0.31, dark, 0.3, 0.24);
  [-1, 1].forEach(s => [0.05, -0.05].forEach(dy => { const w = thin(0.55, 0.015, 0.015, 0xeeeeee, s * 0.42, -0.16 + dy, 0.38); w.rotation.z = s * dy * 4; w.rotation.y = s * 0.2; head.add(w); })); // Schnurrhaare
  g.add(head);
  const legs = [];
  [[0.33, 0.6], [-0.33, 0.6], [0.33, -0.62], [-0.33, -0.62]].forEach(([x, z]) => { const l = new THREE.Group(); l.position.set(x, 0.6, z); l.add(box(0.24, 0.62, 0.26, color, 0, -0.3, 0)); l.add(box(0.3, 0.12, 0.36, light, 0, -0.56, 0.04)); g.add(l); legs.push(l); });
  const t = chain(5, 0.3, 0.08, 0.06, color, [0, 0, -1], light); t.root.position.set(0, 1.12, -0.85); t.root.rotation.x = -0.5; t.segs.forEach((sg, i) => { if (i) sg.rotation.x = -0.18; }); g.add(t.root);
  g.userData = { head, legs, tail: t.root, tailSegs: t.segs, ears, eyes, body, t: 0 };
  return compact(g);
}

export function makeVacuum() {
  const g = new THREE.Group(), red = 0xcc3333, dred = 0xa62828, grey = 0x444444;
  const body = cyl(0.9, 1.0, 0.9, red, 0, 0.5, 0, 16); g.add(body);
  const bump = new THREE.Mesh(new THREE.TorusGeometry(0.98, 0.09, 6, 24), mat(0x2d2d2d)); bump.rotation.x = Math.PI / 2; bump.position.y = 0.16; g.add(bump);
  g.add(cyl(0.6, 0.9, 0.3, dred, 0, 1.1, 0, 16)); g.add(cyl(0.62, 0.62, 0.06, 0xe8e8e8, 0, 1.26, 0, 16));
  const dome = sphere(0.32, 0x333333, 0, 1.3, -0.1, 10); g.add(dome);
  const lamp = sphere(0.1, 0x7fffd4, 0, 1.62, -0.1, 6); lamp.material.emissive = new THREE.Color(0x2fbf9f); g.add(lamp);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.07, 6, 14, Math.PI), mat(0x2d2d2d)); handle.position.set(0, 1.3, -0.45); g.add(handle);
  [-1, 1].forEach(s => g.add(box(0.18, 0.08, 0.1, 0xffd34d, s * 0.45, 1.2, 0.55))); // Knöpfe
  const eyes = [-1, 1].map(s => { const e = eye(0.14, 0x111111, s * 0.35, 0.85, 0.92, { white: true, pupil: false }); g.add(e); return e; });
  brows(g, 0.35, 1.08, 0.92, 0x2d2d2d, 0.45, 0.32);
  g.add(box(0.8, 0.16, 0.08, 0x1a1a1a, 0, 0.5, 0.93)); for (let i = 0; i < 4; i++) g.add(thin(0.1, 0.08, 0.04, 0xffffff, -0.28 + i * 0.19, 0.55, 0.97)); // Gitter-Maul mit Zähnen
  const hose = new THREE.Group(); hose.position.set(0, 0.9, 1.3); hose.rotation.x = Math.PI / 2 - 0.3; g.add(hose);
  hose.add(cyl(0.12, 0.12, 2.2, grey, 0, 0, 0, 8)); for (let i = 0; i < 6; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.035, 4, 10), mat(0x333333)); r.rotation.x = Math.PI / 2; r.position.y = -0.9 + i * 0.36; hose.add(r); }
  const nozzle = new THREE.Group(); nozzle.position.set(0, 0.15, 2.3); g.add(nozzle);
  nozzle.add(box(1.4, 0.3, 0.5, 0x222222)); nozzle.add(box(1.3, 0.08, 0.1, 0xffcc33, 0, 0.16, 0.2));
  for (let i = 0; i < 7; i++) nozzle.add(thin(0.06, 0.1, 0.42, 0x888888, -0.6 + i * 0.2, -0.17, 0));
  [[0.6, 0.6], [-0.6, 0.6], [0, -0.7]].forEach(([x, z]) => { const w = cyl(0.2, 0.2, 0.15, 0x222222, x, 0.2, z, 10); w.rotation.z = Math.PI / 2; g.add(w); const h = cyl(0.08, 0.08, 0.17, 0xbbbbbb, x, 0.2, z, 6); h.rotation.z = Math.PI / 2; g.add(h); });
  const cable = cyl(0.04, 0.04, 1.2, 0x222222, 0, 0.3, -1.4, 4); cable.rotation.x = Math.PI / 2 + 0.2; g.add(cable); g.add(box(0.2, 0.15, 0.28, 0xeeeeee, 0, 0.18, -2.0));
  g.userData = { nozzle, body, eyes, lamp, t: 0 };
  return compact(g);
}

export function makeCanOpener() {
  const g = new THREE.Group(), steel = 0xbfc5cc, dsteel = 0x8a9099, grip = 0xd63031;
  const armL = new THREE.Group(), armR = new THREE.Group();
  [[armL, -0.6, 0.12], [armR, 0.6, -0.12]].forEach(([a, x, rz]) => {
    a.position.set(x, 2.5, 0); a.rotation.z = rz; a.add(box(0.5, 4.5, 0.4, steel)); a.add(box(0.6, 2.6, 0.5, grip, 0, 0.6, 0));
    for (let i = 0; i < 4; i++) a.add(thin(0.62, 0.08, 0.52, shade(grip, 0.7), 0, -0.4 + i * 0.6, 0));
    a.add(sphere(0.1, 0xdddddd, 0, -1.9, 0.22, 6)); g.add(a);
  });
  g.add(box(1.4, 0.9, 0.6, dsteel, 0, 4.9, 0)); g.add(box(1.5, 0.15, 0.7, steel, 0, 5.38, 0));
  const blade = new THREE.Group(); blade.position.set(0, 0.5, 0.2); g.add(blade);
  const disk = cyl(0.6, 0.6, 0.15, 0xdfe6ee, 0, 0, 0, 16); disk.rotation.x = Math.PI / 2; blade.add(disk);
  blade.add(cyl(0.2, 0.2, 0.2, dsteel, 0, 0, 0, 8).rotateX(Math.PI / 2));
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2, t = box(0.16, 0.16, 0.08, 0xffffff, Math.cos(a) * 0.62, Math.sin(a) * 0.62, 0); t.rotation.z = a + Math.PI / 4; t.userData.noOutline = true; blade.add(t); }
  const knob = new THREE.Group(); knob.position.set(0, 4.9, 0.8); g.add(knob);
  knob.add(cyl(0.25, 0.25, 0.9, 0x555555, 0, 0, 0, 10).rotateX(Math.PI / 2)); for (let i = 0; i < 3; i++) { const w = box(0.9, 0.14, 0.14, 0x666666, 0, 0, 0.35); w.rotation.z = i / 3 * Math.PI; knob.add(w); }
  const eyes = [-1, 1].map(s => { const e = eye(0.18, 0x111111, s * 0.3, 5.1, 0.32, { white: true, pupil: false }); g.add(e); return e; });
  brows(g, 0.32, 5.38, 0.36, 0x333333, 0.4, 0.34);
  g.add(box(0.6, 0.1, 0.06, 0x222222, 0, 4.66, 0.31));
  g.userData = { blade, knob, eyes, t: 0 };
  return compact(g);
}

export function makeBird(kind = 'seagull') {
  const g = new THREE.Group(), gull = kind === 'seagull';
  const c = gull ? 0xf4f4f4 : 0x7d8aa0, wing = gull ? 0xd9d9d9 : 0x5b6880, tipC = gull ? 0x2d2d2d : 0x3e4859, beak = gull ? 0xffb21c : 0x333333;
  const s = gull ? 1.6 : 1.0;
  g.add(box(0.5 * s, 0.4 * s, 1.0 * s, c, 0, 0.4 * s, 0)); const chest = sphere(0.3 * s, c, 0, 0.42 * s, 0.32 * s, 8); chest.scale.set(0.85, 0.9, 1); g.add(chest);
  const head = new THREE.Group(); head.position.set(0, 0.7 * s, 0.55 * s); g.add(head);
  head.add(sphere(0.28 * s, c, 0, 0, 0, 8));
  if (!gull) { const ring = sphere(0.3 * s, 0x5fa88a, 0, -0.18 * s, -0.04 * s, 8); ring.scale.set(1, 0.45, 1); head.add(ring); } // schillernder Hals
  head.add(cone(0.1 * s, 0.4 * s, beak, 0, -0.02 * s, 0.35 * s).rotateX(Math.PI / 2));
  head.add(cone(0.07 * s, 0.25 * s, shade(beak, 0.8), 0, -0.08 * s, 0.3 * s).rotateX(Math.PI / 2));
  if (gull) head.add(sphere(0.04 * s, 0xe74c3c, 0, -0.08 * s, 0.42 * s, 4));
  const eyes = [-1, 1].map(x => { const e = eye(0.06 * s, gull ? 0xffe066 : 0xff7f27, x * 0.15 * s, 0.08 * s, 0.17 * s); head.add(e); return e; });
  brows(head, 0.14 * s, 0.17 * s, 0.22 * s, tipC, 0.45, 0.16 * s);
  const tips = [];
  const wings = [1, -1].map(sx => {
    const piv = new THREE.Group(); piv.position.set(sx * 0.25 * s, 0.5 * s, 0); g.add(piv);
    piv.add(box(0.7 * s, 0.08 * s, 0.6 * s, wing, sx * 0.35 * s, 0, 0));
    const tip = new THREE.Group(); tip.position.x = sx * 0.7 * s; piv.add(tip); tips.push(tip);
    tip.add(box(0.55 * s, 0.07 * s, 0.5 * s, wing, sx * 0.27 * s, 0, -0.03 * s));
    for (let i = 0; i < 3; i++) tip.add(box(0.3 * s, 0.05 * s, 0.14 * s, tipC, sx * (0.55 + i * 0.05) * s, 0, (0.12 - i * 0.16) * s));
    return piv;
  });
  const tail = new THREE.Group(); tail.position.set(0, 0.45 * s, -0.5 * s); g.add(tail);
  [-1, 0, 1].forEach(i => { const f = box(0.14 * s, 0.05 * s, 0.4 * s, i ? wing : tipC, i * 0.1 * s, 0, -0.18 * s); f.rotation.y = i * 0.3; tail.add(f); });
  [-1, 1].forEach(x => { g.add(cyl(0.03, 0.03, 0.3 * s, beak, x * 0.12 * s, 0.1 * s, 0, 4)); [-0.5, 0, 0.5].forEach(a => { const t = thin(0.03, 0.03, 0.14 * s, beak, x * 0.12 * s + Math.sin(a) * 0.06, 0.0, 0.06 * s); t.rotation.y = a; g.add(t); }); });
  g.userData = { wings, tips, head, tail, eyes, t: 0 };
  return compact(g);
}

export function makeRat(scale = 1) {
  const g = new THREE.Group(), c = 0x6f6f72, light = 0x9a9aa0, pink = 0xffb6c1;
  g.add(box(0.7, 0.5, 1.2, c, 0, 0.45, 0)); g.add(box(0.78, 0.55, 0.55, c, 0, 0.5, -0.4)); g.add(box(0.55, 0.1, 0.9, light, 0, 0.22, 0.05));
  for (let i = 0; i < 3; i++) { const f = box(0.08, 0.14, 0.2, shade(c, 0.75), 0, 0.75, -0.3 + i * 0.25); f.rotation.x = -0.5; g.add(f); } // struppiges Fell
  const head = new THREE.Group(); head.position.set(0, 0.55, 0.8); g.add(head);
  head.add(box(0.5, 0.45, 0.6, c)); head.add(cone(0.18, 0.45, pink, 0, -0.05, 0.5).rotateX(Math.PI / 2)); head.add(sphere(0.07, 0xff6f91, 0, -0.05, 0.74, 6));
  [-1, 1].forEach(s => head.add(thin(0.06, 0.12, 0.04, 0xfff8e0, s * 0.04, -0.2, 0.52))); // Nagezähne
  const ears = [-1, 1].map(s => { const e = new THREE.Group(); e.position.set(s * 0.28, 0.3, -0.15); const o = sphere(0.18, pink, 0, 0, 0, 8); o.scale.z = 0.4; e.add(o); const i2 = sphere(0.11, 0xff8fa3, 0, 0, 0.05, 6); i2.scale.z = 0.3; i2.userData.noOutline = true; e.add(i2); head.add(e); return e; });
  const eyes = [-1, 1].map(s => { const e = eye(0.07, 0xff2222, s * 0.18, 0.1, 0.25, { pupil: false }); e.children[0].material.emissive = new THREE.Color(0x880000); head.add(e); return e; });
  brows(head, 0.17, 0.2, 0.28, 0x3a3a3c, 0.4, 0.18);
  [-1, 1].forEach(s => [0.04, -0.04].forEach(dy => { const w = thin(0.5, 0.012, 0.012, 0xdddddd, s * 0.3, -0.05 + dy, 0.55); w.rotation.z = s * dy * 4; head.add(w); }));
  const t = chain(6, 0.26, 0.06, 0.025, pink); t.root.position.set(0, 0.4, -0.65); t.root.rotation.x = 0.25; g.add(t.root);
  const legs = [];
  [[0.25, 0.5], [-0.25, 0.5], [0.27, -0.45], [-0.27, -0.45]].forEach(([x, z]) => { const l = new THREE.Group(); l.position.set(x, 0.36, z); l.add(box(0.15, 0.32, 0.15, c, 0, -0.16, 0)); l.add(box(0.18, 0.07, 0.22, pink, 0, -0.33, 0.04)); g.add(l); legs.push(l); });
  g.scale.setScalar(scale);
  g.userData = { legs, tail: t.root, tailSegs: t.segs, head, ears, eyes, t: 0 };
  return compact(g);
}

export function makeFatMan() {
  const g = new THREE.Group(), skin = 0xf5c9a2, shirt = 0xf2c744, pants = 0x3a5fa8;
  g.add(cyl(0.5, 0.9, 1.0, pants, 0, 1.3, 0, 12)); // Hose
  const belly = new THREE.Group(); belly.position.y = 2.3; g.add(belly);
  belly.add(cyl(1.0, 0.95, 1.3, shirt, 0, 0, 0, 14)); const tum = sphere(0.85, shirt, 0, -0.15, 0.3, 12); tum.scale.set(1, 0.9, 0.8); belly.add(tum);
  for (let i = 0; i < 3; i++) belly.add(sphere(0.06, 0xffffff, 0, 0.4 - i * 0.35, 0.95 - Math.abs(i - 1) * 0.05, 4)); // Knöpfe
  g.add(cyl(0.97, 0.97, 0.16, 0x4a3020, 0, 1.68, 0, 14)); g.add(box(0.3, 0.2, 0.1, 0xffcc33, 0, 1.68, 0.95)); // Gürtel
  g.add(cyl(0.45, 0.6, 0.2, 0xffffff, 0, 2.98, 0, 12)); // Kragen
  const head = new THREE.Group(); head.position.y = 3.4; g.add(head);
  head.add(sphere(0.55, skin, 0, 0, 0, 12)); head.add(sphere(0.14, 0xf0a888, 0, -0.05, 0.54, 6)); // Nase
  [-1, 1].forEach(s => { head.add(sphere(0.13, skin, s * 0.55, 0, 0, 6)); const ch = sphere(0.12, 0xf7a8a0, s * 0.3, -0.15, 0.42, 6); ch.userData.noOutline = true; head.add(ch); });
  const eyes = [-1, 1].map(s => { const e = eye(0.07, 0x111111, s * 0.2, 0.1, 0.48, { pupil: false }); head.add(e); return e; });
  brows(head, 0.2, 0.25, 0.5, 0x3b2412, -0.15, 0.22);
  const mus = box(0.42, 0.1, 0.12, 0x3b2412, 0, -0.2, 0.5); head.add(mus); // Schnurrbart
  head.add(cyl(0.6, 0.6, 0.2, 0x8b1e1e, 0, 0.45, 0, 12)); head.add(cyl(0.35, 0.35, 0.3, 0x8b1e1e, 0, 0.65, 0, 12)); head.add(box(0.7, 0.06, 0.4, 0x8b1e1e, 0, 0.36, 0.55)); // Mütze mit Schirm
  const arms = [1, -1].map(s => {
    const a = new THREE.Group(); a.position.set(s * 1.05, 2.9, 0); g.add(a);
    a.add(box(0.38, 0.6, 0.38, shirt, 0, -0.25, 0)); a.add(box(0.32, 0.8, 0.32, skin, 0, -0.85, 0)); a.add(sphere(0.2, skin, 0, -1.3, 0, 6)); return a;
  });
  const bag = new THREE.Group(); bag.position.set(0.05, -1.55, 0.3); arms[0].add(bag); // Einkaufstüte in der Hand
  bag.add(box(0.9, 1.0, 0.6, 0xd9a066, 0, -0.1, 0)); bag.add(box(0.5, 0.2, 0.5, 0xffe08a, 0, 0.5, 0)); bag.add(cyl(0.18, 0.18, 0.5, 0xe8a04a, -0.2, 0.6, 0, 8)); bag.add(box(0.06, 0.4, 0.06, 0x2ecc71, 0.25, 0.65, 0.1)); // Brot, Wurst, Lauch
  const legs = [0.35, -0.35].map(x => { const l = new THREE.Group(); l.position.set(x, 0.95, 0); l.add(box(0.42, 0.9, 0.42, pants, 0, -0.45, 0)); l.add(box(0.46, 0.18, 0.62, 0x2d1a10, 0, -0.86, 0.1)); g.add(l); return l; });
  g.userData = { legs, arms, head, belly, eyes, t: 0 };
  return compact(g);
}
// Holzschild mit Schrift: echtes 3D-Objekt (wird von Wänden verdeckt), von beiden Seiten lesbar.
// o.w = Breite, o.post = Pfostenhöhe (0 = ohne Pfosten), o.ink = Schriftfarbe. setText() schreibt das Schild neu.
export function makeSign(text, o = {}) {
  const w = o.w ?? 2.6, h = w / 4, post = o.post ?? 0, dark = 0x5a3715;
  const c = document.createElement('canvas'); c.width = 512; c.height = 128;
  const x = c.getContext('2d'), tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const draw = t => {
    x.fillStyle = '#c8955a'; x.fillRect(0, 0, 512, 128);
    x.strokeStyle = 'rgba(90,55,21,.3)'; x.lineWidth = 3; // Maserung
    for (let i = 0; i < 6; i++) { const y = 14 + i * 21; x.beginPath(); x.moveTo(0, y); for (let k = 1; k <= 8; k++) x.lineTo(k * 64, y + Math.sin(k * 1.7 + i * 2.3) * 4); x.stroke(); }
    let size = 64; x.font = `900 ${size}px Trebuchet MS, sans-serif`;
    while (x.measureText(t).width > 460 && size > 16) { size -= 2; x.font = `900 ${size}px Trebuchet MS, sans-serif`; }
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillStyle = 'rgba(255,236,200,.55)'; x.fillText(t, 257, 68); // eingeschnitzt: helle Kante unten
    x.fillStyle = o.ink ?? '#3b2412'; x.fillText(t, 256, 65);
    tex.needsUpdate = true;
  };
  draw(text);
  const g = new THREE.Group(), board = new THREE.Group(); board.position.y = post + h / 2; g.add(board);
  board.add(box(w + 0.14, h + 0.14, 0.12, dark));
  const face = new THREE.MeshToonMaterial({ map: tex, gradientMap: toonGradient(), polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  [1, -1].forEach(s => { const f = new THREE.Mesh(new THREE.PlaneGeometry(w, h), face); f.position.z = s * 0.064; if (s < 0) f.rotation.y = Math.PI; f.receiveShadow = true; board.add(f); });
  if (post) [-1, 1].forEach(s => g.add(box(0.16, post + h + 0.12, 0.16, dark, s * (w / 2 + 0.15), (post + h + 0.12) / 2, 0)));
  g.userData.setText = draw; return g;
}

// Sammelobjekte: aus Grundkörpern gebaut, dann zu EINEM Mesh mit Vertexfarben gebacken (ein Zeichenaufruf je Objekt,
// Geometrie und Material je Sorte nur einmal im Speicher)
const _baked = new Map();
function bake(key, build, extra = {}) {
  let b = _baked.get(key);
  if (!b) {
    const src = new THREE.Group(); build(src); src.updateMatrixWorld(true);
    const pos = [], nor = [], col = [], c = new THREE.Color();
    src.traverse(o => {
      if (!o.isMesh) return; let gm = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone(); gm.applyMatrix4(o.matrixWorld);
      c.copy(o.material.color); const p = gm.attributes.position.array, n = gm.attributes.normal.array;
      for (let k = 0; k < p.length; k++) { pos.push(p[k]); nor.push(n[k]); } for (let k = 0; k < p.length / 3; k++) col.push(c.r, c.g, c.b);
      gm.dispose(); o.geometry.dispose();
    });
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    b = { geo, mat: mat(0xffffff, { vertexColors: true, ...extra }) }; _baked.set(key, b);
  }
  const m = new THREE.Mesh(b.geo, b.mat); m.castShadow = true; return m;
}
const FOOD = {
  ham: g => { g.add(cyl(0.35, 0.42, 0.45, 0xe9776f, 0, 0.25, 0, 12)); g.add(cyl(0.3, 0.3, 0.47, 0xf7b2a8, 0, 0.25, 0, 12)); g.add(cyl(0.37, 0.4, 0.12, 0xb8524a, 0, 0.4, 0, 12)); g.add(cyl(0.1, 0.1, 0.95, 0xfff2cc, 0, 0.25, 0, 8).rotateZ(Math.PI / 2)); [-1, 1].forEach(s => g.add(sphere(0.12, 0xfff2cc, s * 0.5, 0.25, 0, 6))); },
  treat: g => { g.add(box(0.7, 0.2, 0.25, 0xd9a066, 0, 0.2, 0)); [[0.35, 0.1], [0.35, -0.1], [-0.35, 0.1], [-0.35, -0.1]].forEach(([x, z]) => g.add(sphere(0.16, 0xd9a066, x, 0.2, z, 8))); for (let i = 0; i < 3; i++) g.add(box(0.05, 0.03, 0.18, 0xa86f3a, -0.15 + i * 0.15, 0.31, 0)); },
  fish: g => { const b = sphere(0.4, 0x7fb6d8, 0, 0.22, 0, 10); b.scale.set(1, 0.45, 0.28); g.add(b); const bl = sphere(0.36, 0xdff0fa, 0, 0.17, 0, 8); bl.scale.set(0.95, 0.3, 0.27); g.add(bl); g.add(cone(0.2, 0.3, 0x5a95bd, -0.5, 0.22, 0, 4).rotateZ(Math.PI / 2)); g.add(cone(0.1, 0.2, 0x5a95bd, 0, 0.42, 0, 4)); g.add(sphere(0.05, 0x111111, 0.26, 0.26, 0.1, 6)); g.add(sphere(0.05, 0x111111, 0.26, 0.26, -0.1, 6)); for (let i = 0; i < 3; i++) g.add(box(0.04, 0.2, 0.24, 0x5a95bd, -0.15 + i * 0.12, 0.25, 0)); },
  bread: g => { const l = sphere(0.36, 0xe8b86d, 0, 0.2, 0, 10); l.scale.set(1.15, 0.6, 0.7); g.add(l); const t = sphere(0.33, 0xc98a3e, 0, 0.27, 0, 10); t.scale.set(1.12, 0.5, 0.62); g.add(t); for (let i = 0; i < 3; i++) { const c = box(0.05, 0.05, 0.36, 0xf6dba0, -0.2 + i * 0.2, 0.42, 0); c.rotation.y = 0.5; g.add(c); } },
  sausage: g => { g.add(cyl(0.15, 0.15, 0.75, 0xc8502e, 0, 0.2, 0, 10).rotateZ(Math.PI / 2)); [-1, 1].forEach(s => { g.add(sphere(0.15, 0xc8502e, s * 0.37, 0.2, 0, 8)); g.add(cyl(0.04, 0.02, 0.1, 0xf6e7c8, s * 0.55, 0.2, 0, 4).rotateZ(Math.PI / 2)); }); for (let i = 0; i < 3; i++) g.add(box(0.03, 0.04, 0.2, 0x8e3017, -0.2 + i * 0.2, 0.35, 0)); },
  cheese: g => { g.add(box(0.6, 0.35, 0.5, 0xffd94a, 0, 0.2, 0)); g.add(box(0.62, 0.06, 0.52, 0xffe680, 0, 0.36, 0)); [[0.15, 0.4, 0.1, 0.08], [-0.18, 0.3, -0.15, 0.06], [0.31, 0.25, -0.1, 0.07], [-0.1, 0.15, 0.26, 0.06]].forEach(([x, y, z, r]) => g.add(sphere(r, 0xd9b300, x, y, z, 6))); },
  bone: g => { g.add(cyl(0.09, 0.09, 0.7, 0xffe9a8, 0, 0.3, 0, 8).rotateZ(Math.PI / 2)); [[0.35, 0.1], [0.35, -0.1], [-0.35, 0.1], [-0.35, -0.1]].forEach(([x, z]) => g.add(sphere(0.14, 0xffe9a8, x, 0.3, z, 8))); },
  goldbone: g => { g.add(cyl(0.11, 0.11, 0.9, 0xffcc33, 0, 0.5, 0, 10).rotateZ(Math.PI / 2)); [[0.45, 0.12], [0.45, -0.12], [-0.45, 0.12], [-0.45, -0.12]].forEach(([x, z]) => g.add(sphere(0.18, 0xffcc33, x, 0.5, z, 10))); g.add(box(0.5, 0.04, 0.05, 0xfff6c0, 0, 0.6, 0.06)); },
  fries: g => { g.add(cyl(0.24, 0.16, 0.45, 0xe74c3c, 0, 0.25, 0, 8)); g.add(cyl(0.245, 0.24, 0.08, 0xffffff, 0, 0.42, 0, 8)); for (let i = 0; i < 9; i++) g.add(box(0.06, 0.42, 0.06, i % 3 ? 0xffd34d : 0xf0b93a, Math.cos(i * 0.9) * 0.13, 0.6 + (i % 3) * 0.04, Math.sin(i * 0.9) * 0.13).rotateZ((i - 4) * 0.06)); },
  sock: g => { g.add(box(0.3, 0.6, 0.18, 0xe84393, 0, 0.45, 0)); g.add(box(0.3, 0.2, 0.45, 0xe84393, 0, 0.2, 0.14)); g.add(box(0.32, 0.12, 0.2, 0xffffff, 0, 0.72, 0)); g.add(box(0.31, 0.06, 0.19, 0xffffff, 0, 0.5, 0)); g.add(box(0.31, 0.2, 0.12, 0xfd79a8, 0, 0.2, 0.32)); },
  cup: g => { g.add(cyl(0.25, 0.22, 0.45, 0xffffff, 0, 0.3, 0, 12)); const h = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.04, 5, 10), mat(0xffffff)); h.position.set(0.28, 0.3, 0); g.add(h); g.add(cyl(0.21, 0.21, 0.02, 0x6d4c41, 0, 0.52, 0, 10)); g.add(cyl(0.255, 0.255, 0.06, 0xe74c3c, 0, 0.35, 0, 12)); },
  ice: g => { g.add(cone(0.22, 0.6, 0xd9a066, 0, 0.3, 0, 8).rotateX(Math.PI)); g.add(sphere(0.26, 0xffb3c6, 0, 0.66, 0, 10)); g.add(sphere(0.2, 0xfff3d6, 0.05, 0.88, 0.02, 8)); g.add(sphere(0.06, 0xe74c3c, 0.05, 1.08, 0.02, 6)); },
  shell: g => { for (let i = 0; i < 5; i++) { const r = box(0.12, 0.08, 0.5, i % 2 ? 0xffd1dc : 0xffb3c6, (i - 2) * 0.1, 0.18, 0); r.rotation.y = (i - 2) * 0.3; g.add(r); } g.add(sphere(0.08, 0xffb3c6, 0, 0.18, -0.25)); },
  crumb: g => { const k = cyl(0.2, 0.2, 0.09, 0xd98c4a, 0, 0.2, 0, 9); g.add(k); [[0.08, 0.05], [-0.09, 0.07], [0.02, -0.1]].forEach(([x, z]) => g.add(sphere(0.045, 0x5a3416, x, 0.25, z, 4))); },
};
export function makeFood(kind) {
  const g = new THREE.Group();
  if (kind === 'gnome') { const m = makeGnome(); m.scale.setScalar(0.6); g.add(m); }
  else if (kind === 'goldbone') {
    g.add(texturedAsset('food-goldbone', { emissive: 0x4a3000 }) ?? bake('goldbone', FOOD.goldbone, { emissive: new THREE.Color(0x8a5a00) }));
    const halo = new THREE.Mesh(new THREE.RingGeometry(0.75, 1.0, 24), new THREE.MeshBasicMaterial({ color: 0xfff3a0, transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false }));
    halo.position.y = 0.5; g.add(halo); g.userData.halo = halo;
    const glow = makeGlow(0xffd84a, 2.6, 0.55); glow.position.y = 0.5; g.add(glow);
  } else { const k = FOOD[kind] ? kind : 'crumb'; g.add(texturedAsset('food-' + k) ?? bake(k, FOOD[k])); } // GLB-Modell (assets/sammeln), sonst Grundkörper
  g.userData.spin = Math.random() * Math.PI * 2;
  return g;
}

// ---- Pflanzen. static = reine Deko: das Level backt sie mit den Kisten zu wenigen großen Meshes zusammen
// tree/bush/flowers: Maße für die Spielereien in details.js (Durchschütteln, Fallobst, Niesen)
const leafMat = (c, amp = 0.07) => addSway(mat(c), amp); // Ikosaeder ohne Index → von sich aus flach schattiert
const blob = (r, c, x, y, z, amp) => { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), leafMat(c, amp)); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m; };
export function makeTree(scale = 1) {
  const g = new THREE.Group(), s = scale;
  g.add(cyl(0.2 * s, 0.38 * s, 1.6 * s, 0x7a4a1f, 0, 0.8 * s, 0, 7));
  [[1.5, 1.6, 1.9, 0x3f9a46], [1.2, 1.5, 2.8, 0x4caa4c], [0.9, 1.3, 3.6, 0x5fc25f], [0.55, 1.0, 4.3, 0x6fd06a]].forEach(([r, h, y, c], i) => {
    const k = new THREE.Mesh(new THREE.ConeGeometry(r * s, h * s, 7), leafMat(c, 0.04)); k.position.y = y * s; k.rotation.y = i * 0.45; k.castShadow = true; g.add(k);
  });
  g.userData.static = true; g.userData.tree = { r: 1.5 * s, top: 4.6 * s, fir: true }; return g;
}
export function makeBush(w = 2) {
  const g = new THREE.Group(), cols = [0x3d9a3d, 0x4fb24f, 0x46a646, 0x5cbf55];
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + Math.random(), r = w * (0.3 + Math.random() * 0.12); g.add(blob(r, cols[i % 4], Math.cos(a) * w * 0.28, 0.45 + Math.random() * 0.3, Math.sin(a) * w * 0.28, 0.05)); }
  g.add(blob(w * 0.42, 0x58b84f, 0, 0.75, 0, 0.05));
  for (let i = 0; i < 5; i++) { const a = Math.random() * 7; g.add(sphere(0.09, i % 2 ? 0xffffff : 0xff9ff3, Math.cos(a) * w * 0.45, 0.6 + Math.random() * 0.5, Math.sin(a) * w * 0.45, 4)); } // Blüten
  g.userData.static = true; g.userData.bush = w; return g;
}

// Laubbaum mit runder Krone (optional mit Äpfeln): Wurzeln, Äste, Krone aus mehreren Laubballen
export function makeRoundTree(scale = 1, apples = false) {
  const g = new THREE.Group(), s = scale, bark = 0x7a4a1f, dbark = 0x5e3815;
  g.add(cyl(0.26 * s, 0.42 * s, 2.3 * s, bark, 0, 1.15 * s, 0, 7));
  for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + 0.4, r = cone(0.2 * s, 0.75 * s, dbark, Math.cos(a) * 0.36 * s, 0.25 * s, Math.sin(a) * 0.36 * s, 5); r.rotation.set(-Math.sin(a) * 0.7, 0, Math.cos(a) * 0.7); g.add(r); }
  [[0.6, 1], [-0.7, -0.6]].forEach(([x, z]) => { const b = cyl(0.08 * s, 0.14 * s, 1.3 * s, bark, x * 0.5 * s, 2.4 * s, z * 0.5 * s, 5); b.rotation.set(z * 0.7, 0, -x * 0.7); g.add(b); });
  const leaf = [0x3d9a3d, 0x4caa4c, 0x5fc25f, 0x6ccf62];
  [[0, 3.1, 0, 1.6, 1], [0.95, 2.7, 0.35, 1.1, 0], [-0.85, 2.75, -0.4, 1.2, 0], [0.25, 3.95, -0.3, 1.1, 2], [-0.45, 2.55, 0.95, 1.0, 0], [0.65, 3.45, -0.95, 0.95, 1], [-0.6, 3.7, 0.5, 0.9, 3]].forEach(([x, y, z, r, c]) => g.add(blob(r * s, leaf[c], x * s, y * s, z * s, 0.06)));
  if (apples) for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; g.add(sphere(0.16 * s, 0xe53935, Math.cos(a) * 1.45 * s, (2.6 + (i % 3) * 0.5) * s, Math.sin(a) * 1.45 * s, 6)); }
  g.userData.static = true; g.userData.tree = { r: 1.7 * s, top: 4.5 * s, apples }; return g;
}

// Blumenbeet: Holzrahmen, Erde, Blüten mit Blättern auf Stielen
export function makeFlowers(w = 3, d = 1, n = 12) {
  const g = new THREE.Group(), cols = [0xff6b9d, 0xffd93d, 0xffffff, 0xa29bfe, 0xff7675, 0xfd9644];
  g.add(box(w, 0.25, d, 0x5d3f26, 0, 0.12, 0));
  [-1, 1].forEach(sd => { g.add(box(w + 0.16, 0.32, 0.08, 0xa47148, 0, 0.16, sd * (d / 2 + 0.04))); g.add(box(0.08, 0.32, d, 0xa47148, sd * (w / 2 + 0.04), 0.16, 0)); });
  for (let i = 0; i < n; i++) {
    const x = (Math.random() - 0.5) * (w - 0.3), z = (Math.random() - 0.5) * (d - 0.2), h = 0.45 + Math.random() * 0.35;
    g.add(cyl(0.03, 0.03, h, 0x3d9a3d, x, 0.25 + h / 2, z, 4));
    const lf = box(0.2, 0.03, 0.08, 0x4caa4c, x + 0.08, 0.3 + h * 0.4, z); lf.rotation.z = 0.5; g.add(lf);
    const c = cols[Math.floor(Math.random() * cols.length)], f = cyl(0.17, 0.12, 0.06, c, x, 0.3 + h, z, 5); f.rotation.y = Math.random(); g.add(f);
    g.add(sphere(0.06, 0xffd93d, x, 0.35 + h, z, 4));
  }
  g.userData.static = true; g.userData.flowers = Math.max(w, d) / 2; return g;
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
  const g = new THREE.Group(), skin = 0xf5c9a2;
  g.add(cyl(0.25, 0.3, 0.5, 0x2e86de, 0, 0.25, 0, 8)); g.add(cyl(0.27, 0.27, 0.06, 0x5d3f26, 0, 0.42, 0, 8)); g.add(box(0.08, 0.07, 0.03, 0xffcc33, 0, 0.42, 0.27));
  [-1, 1].forEach(s => { g.add(box(0.14, 0.1, 0.22, 0x5d3f26, s * 0.12, 0.05, 0.08)); g.add(sphere(0.08, skin, s * 0.3, 0.32, 0.08, 5)); });
  g.add(sphere(0.2, skin, 0, 0.65, 0, 8)); g.add(sphere(0.06, 0xf0a888, 0, 0.64, 0.2, 5));
  [-1, 1].forEach(s => g.add(sphere(0.03, 0x111111, s * 0.08, 0.7, 0.17, 4)));
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

// Riesenkrabbe Kneifer: Panzer mit Flecken, zwei Scheren mit beweglicher Zange, sechs zweigliedrige Beine, Stielaugen
export function makeCrab(color = 0xe0503a) {
  const g = new THREE.Group(), dark = shade(color, 0.7), light = shade(color, 1.25);
  const body = sphere(0.8, color, 0, 0.7, 0, 12); body.scale.set(1.3, 0.55, 1); g.add(body);
  const belly = sphere(0.75, 0xf6d7b0, 0, 0.6, 0, 10); belly.scale.set(1.2, 0.4, 0.9); g.add(belly);
  [[0.35, 0.2, 0.12], [-0.4, 0.1, 0.1], [0.05, -0.35, 0.09], [-0.1, 0.35, 0.07], [0.55, -0.25, 0.08]].forEach(([x, z, r]) => { const sp = sphere(r, light, x, 1.1 - Math.abs(x) * 0.25, z, 6); sp.scale.y = 0.5; sp.userData.noOutline = true; g.add(sp); });
  const pincers = [];
  const claws = [-1, 1].map(sx => {
    const c = new THREE.Group(); c.position.set(sx * 1.0, 0.8, 0.7);
    c.add(box(0.25, 0.25, 0.7, dark, 0, 0, 0.3)); const pin = new THREE.Group(); pin.position.z = 0.75; c.add(pin);
    pin.add(sphere(0.34, color, 0, 0, 0.15, 10)); pin.add(cone(0.15, 0.48, color, 0, 0.12, 0.48).rotateX(Math.PI / 2));
    const jaw = new THREE.Group(); jaw.position.set(0, -0.08, 0.25); pin.add(jaw); jaw.add(cone(0.12, 0.42, dark, 0, -0.04, 0.18).rotateX(Math.PI / 2)); pincers.push(jaw);
    for (let i = 0; i < 3; i++) pin.add(thin(0.04, 0.08, 0.04, 0xfff3e0, 0, 0.0, 0.32 + i * 0.1));
    g.add(c); return c;
  });
  const legs = []; for (let i = 0; i < 6; i++) {
    const sx = i < 3 ? -1 : 1, k = i % 3; const l = new THREE.Group(); l.position.set(sx * 0.85, 0.6, -0.3 + k * 0.35);
    const up = box(0.6, 0.13, 0.13, dark, sx * 0.28, 0.08, 0); up.rotation.z = sx * 0.4; l.add(up);
    const lo = new THREE.Group(); lo.position.set(sx * 0.55, 0.2, 0); lo.rotation.z = sx * -1.1; l.add(lo); lo.add(box(0.55, 0.1, 0.1, color, sx * 0.27, 0, 0)); lo.add(cone(0.05, 0.2, dark, sx * 0.6, 0, 0).rotateZ(sx * -Math.PI / 2));
    g.add(l); legs.push(l);
  }
  const eyes = [], stalks = [-0.25, 0.25].map(x => { const e = new THREE.Group(); e.position.set(x, 1.0, 0.55); e.add(box(0.07, 0.4, 0.07, dark, 0, 0.15, 0)); const ey = eye(0.11, 0x111111, 0, 0.38, 0.02, { white: true, pupil: false }); e.add(ey); eyes.push(ey); g.add(e); return e; });
  g.add(box(0.4, 0.12, 0.1, 0x7a1d12, 0, 0.62, 0.78)); for (let i = 0; i < 2; i++) g.add(thin(0.04, 0.16, 0.04, dark, -0.06 + i * 0.12, 0.52, 0.8));
  g.userData = { claws, legs, eyes, stalks, pincers, t: 0 }; return compact(g);
}

// Qualle: halbe Glocke mit leuchtendem Kern und Saum, Tentakel aus Gliedern (schwingen weich nach)
export function makeJelly() {
  const g = new THREE.Group(), m = new THREE.MeshLambertMaterial({ color: 0xff9ff3, transparent: true, opacity: 0.7, emissive: 0xff6fd8, emissiveIntensity: 0.5 });
  const bell = new THREE.Mesh(new THREE.SphereGeometry(0.6, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), m); g.add(bell);
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffd6f6, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false })); core.position.y = 0.05; bell.add(core);
  const frill = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.06, 4, 18), m); frill.rotation.x = Math.PI / 2; bell.add(frill);
  const tent = [], segs = [];
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2, root = new THREE.Group(); root.position.set(Math.cos(a) * 0.38, 0, Math.sin(a) * 0.38); g.add(root); tent.push(root);
    let par = root; for (let k = 0; k < 3; k++) { const s = new THREE.Group(); if (k) s.position.y = -0.42; s.add(new THREE.Mesh(new THREE.CylinderGeometry(0.035 - k * 0.008, 0.03 - k * 0.008, 0.44, 4).translate(0, -0.21, 0), m)); par.add(s); segs.push(s); par = s; }
  }
  g.userData = { bell, tent, tentSegs: segs, core }; return g;
}

// Riesenmuschel am Riff: gerippte Schalen, Schale klappt beim Biss auf, die Perle schimmert
export function makeClam() {
  const g = new THREE.Group(), lid = new THREE.Group();
  const lo = sphere(1.0, 0x8e7cc3, 0, 0, 0, 12); lo.scale.set(1.2, 0.35, 1); g.add(lo);
  const up = sphere(1.0, 0xa593e0, 0, 0, 0.9, 12); up.scale.set(1.2, 0.35, 1); lid.add(up); lid.position.set(0, 0.15, -0.9); g.add(lid);
  for (let i = 0; i < 7; i++) { const a = (i - 3) * 0.32, r = box(0.08, 0.06, 1.7, 0xc2b5ef, Math.sin(a) * 0.55, 0.3, 0.9 + Math.cos(a) * 0.05 - 0.05); r.rotation.y = a; lid.add(r); }
  const pearl = sphere(0.25, 0xffffff, 0, 0.3, 0, 12); pearl.material.emissive = new THREE.Color(0x777777); g.add(pearl);
  g.userData.lid = lid; return g;
}

// Ein anderer Hund (Rettungsschwimmer, Burg-Bauer …): Moll in anderer Fellfarbe mit Mütze
export function makeNpcDog(fur = 0xd9a441, cap = 0xe74c3c) {
  const g = makeDog(), from = [0x8b5a2b, 0x5a3715, 0xa8743f], to = new THREE.Color(fur);
  g.traverse(o => { if (o.material && o.material.color) { const h = o.material.color.getHex(), i = from.indexOf(h); if (i >= 0) { o.material = o.material.clone(); o.material.color.copy(to).multiplyScalar([1, 0.7, 1.15][i]); } } });
  const u = g.userData; if (u.head) { const c = cyl(0.32, 0.36, 0.2, cap, 0, 0.5, 0, 10); u.head.add(c); }
  u.npc = true; // Level sammelt NPCs, damit sie Moll mit dem Kopf nachschauen (Kopf bleibt dank userData beweglich)
  return compact(g);
}

// Kopf weich zu einem Ziel drehen (NPCs schauen Moll an, Moll schaut NPCs an). dx/dz: Richtung zum Ziel in Weltkoordinaten,
// yaw: Blickrichtung des Körpers, on: hinschauen? Ziele hinter dem Rücken werden ignoriert, der Winkel ist auf ±max begrenzt.
export function headTrack(u, dx, dz, yaw, on, dt, max = 1.1) {
  let a = Math.atan2(dx, dz) - yaw; a = Math.atan2(Math.sin(a), Math.cos(a));
  const want = on && Math.abs(a) < 2.3 ? THREE.MathUtils.clamp(a, -max, max) : 0;
  u.track = (u.track ?? 0) + (want - (u.track ?? 0)) * Math.min(1, dt * 5);
  return u.track;
}

// ---------- Kleine Gegner (Banjo-Kazooie-Stil) -------------------------------
// Wenige animierte Teile (in userData), der Rest wird gebacken: pro Gegner nur 1–3 Zeichenaufrufe.
const peepers = (g, s, x, y, z, iris = 0x111111, angry = 0.4, brow = 0x222222) => {
  [-1, 1].forEach(k => { const w = sphere(s, 0xffffff, k * x, y, z, 6); w.scale.z = 0.6; g.add(w); g.add(sphere(s * 0.55, iris, k * x, y, z + s * 0.45, 5)); const b = box(s * 2, s * 0.45, s * 0.45, brow, k * x, y + s * 1.05, z + s * 0.3); b.rotation.z = -k * angry; g.add(b); });
};
export function makeSnail(shell = 0xc8875a) {
  const g = new THREE.Group(), skin = 0xb8d27a, dark = shade(shell, 0.7);
  g.add(box(0.5, 0.25, 1.3, skin, 0, 0.13, 0.05)); g.add(box(0.42, 0.5, 0.36, skin, 0, 0.38, 0.62));
  const sh = sphere(0.52, shell, 0, 0.66, -0.18, 10); sh.scale.set(0.72, 1, 1); g.add(sh);
  [-1, 1].forEach(s => { const sp = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.08, 6, 14), mat(dark)); sp.rotation.y = Math.PI / 2; sp.position.set(s * 0.36, 0.68, -0.18); g.add(sp); g.add(sphere(0.09, dark, s * 0.38, 0.68, -0.18, 6)); });
  [-1, 1].forEach(s => { const st = cyl(0.035, 0.035, 0.45, skin, s * 0.13, 0.8, 0.7, 5); st.rotation.z = -s * 0.25; g.add(st); });
  peepers(g, 0.085, 0.19, 1.04, 0.72, 0x111111, 0.45, 0x3b5323);
  g.add(box(0.22, 0.04, 0.04, 0x3b5323, 0, 0.32, 0.81));
  return compact(g);
}
// Fliegende Insekten: Wespe, Biene, Fliege, Bremse
export function makeBug(kind = 'wespe') {
  const [body, stripe, eyeC] = { wespe: [0xf5c518, 0x222222, 0x222222], biene: [0xf6b93b, 0x3d2b1f, 0x3d2b1f], fliege: [0x2f3640, 0x1e272e, 0xc0392b], bremse: [0x7f6e5d, 0x4b3f35, 0x27ae60] }[kind];
  const g = new THREE.Group(), striped = kind === 'wespe' || kind === 'biene';
  g.add(sphere(0.27, striped ? stripe : body, 0, 0, 0.1, 8));
  const ab = sphere(0.34, body, 0, -0.05, -0.4, 8); ab.scale.set(0.85, 0.85, 1.25); g.add(ab);
  if (striped) for (let i = 0; i < 2; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.29 - i * 0.04, 0.06, 4, 12), mat(stripe)); r.position.set(0, -0.05, -0.32 - i * 0.22); g.add(r); }
  if (kind === 'wespe') g.add(cone(0.06, 0.26, stripe, 0, -0.08, -0.92).rotateX(-Math.PI / 2));
  g.add(sphere(0.23, body, 0, 0.04, 0.42, 8));
  [-1, 1].forEach(s => { g.add(sphere(kind === 'fliege' || kind === 'bremse' ? 0.15 : 0.11, eyeC, s * 0.14, 0.1, 0.52, 6)); g.add(sphere(0.035, 0xffffff, s * 0.17, 0.17, 0.63, 4)); const b = box(0.18, 0.04, 0.04, stripe, s * 0.12, 0.27, 0.56); b.rotation.z = -s * 0.45; g.add(b); });
  [-1, 1].forEach(s => { const a = cyl(0.015, 0.015, 0.36, stripe, s * 0.09, 0.36, 0.56, 4); a.rotation.set(0.5, 0, -s * 0.35); g.add(a); });
  for (let i = 0; i < 3; i++) [-1, 1].forEach(s => { const l = box(0.04, 0.3, 0.04, stripe, s * 0.12, -0.25, 0.2 - i * 0.12); l.rotation.z = s * 0.3; g.add(l); });
  const wm = new THREE.MeshLambertMaterial({ color: 0xeaf6ff, transparent: true, opacity: 0.55 });
  const wings = [-1, 1].map(s => { const w = new THREE.Group(); w.position.set(s * 0.12, 0.24, 0.05); const m = new THREE.Mesh(new THREE.SphereGeometry(0.34, 8, 5), wm); m.scale.set(1, 0.08, 0.5); m.position.x = s * 0.32; w.add(m); g.add(w); return w; });
  g.userData = { wings }; return compact(g);
}
// Käfer/Kakerlake/Krebs mit Panzer (o.spiral = Einsiedlerkrebs mit Schneckenhaus, o.claws = Scheren)
export function makeBeetle(o = {}) {
  const g = new THREE.Group(), shell = o.shell ?? 0x6b3e1f, body = o.body ?? shade(shell, 0.6);
  if (o.spiral) {
    const s1 = sphere(0.55, o.spiral, 0, 0.72, -0.2, 10); s1.scale.set(0.9, 1, 1.05); g.add(s1);
    g.add(cone(0.36, 0.62, shade(o.spiral, 0.85), 0, 1.3, -0.3, 8));
    for (let i = 0; i < 2; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.46 - i * 0.14, 0.05, 4, 14), mat(shade(o.spiral, 0.7))); r.rotation.x = Math.PI / 2; r.position.set(0, 0.95 + i * 0.3, -0.24); g.add(r); }
  } else {
    const sh = sphere(0.6, shell, 0, 0.45, -0.05, 10); sh.scale.set(0.9, 0.55, 1.2); g.add(sh);
    g.add(box(0.03, 0.12, 1.3, shade(shell, 0.55), 0, 0.77, -0.05));
    if (o.spots) [[0.25, 0.2], [-0.25, 0.2], [0.28, -0.35], [-0.28, -0.35]].forEach(([x, z]) => { const p = sphere(0.11, o.spots, x, 0.72, z, 5); p.scale.y = 0.4; g.add(p); });
  }
  g.add(sphere(0.27, body, 0, 0.38, 0.62, 8));
  peepers(g, 0.08, 0.12, 0.52, 0.78, 0x111111, 0.45, shade(body, 0.6));
  if (o.claws) [-1, 1].forEach(s => { const a = box(0.12, 0.12, 0.5, body, s * 0.45, 0.35, 0.7); a.rotation.y = -s * 0.3; g.add(a); g.add(sphere(0.19, o.clawC ?? body, s * 0.55, 0.4, 1.0, 7)); g.add(cone(0.08, 0.28, o.clawC ?? body, s * 0.52, 0.47, 1.2).rotateX(Math.PI / 2)); });
  if (o.antenna) [-1, 1].forEach(s => { const a = box(0.03, 0.03, 0.9, body, s * 0.18, 0.62, 1.1); a.rotation.set(-0.5, s * 0.35, 0); g.add(a); });
  const legs = [-1, 1].map(s => { const L = new THREE.Group(); L.position.set(s * 0.42, 0.32, 0); for (let i = 0; i < 3; i++) { const l = box(0.5, 0.07, 0.07, body, s * 0.2, -0.12, -0.35 + i * 0.35); l.rotation.z = -s * 0.5; L.add(l); } g.add(L); return L; });
  g.userData = { legs }; return compact(g);
}
export function makeFrog(color = 0x6ab04c) {
  const g = new THREE.Group(), belly = 0xe8f5c8, dark = shade(color, 0.7);
  const b = sphere(0.55, color, 0, 0.45, 0, 10); b.scale.set(1.1, 0.75, 1); g.add(b);
  const bl = sphere(0.45, belly, 0, 0.36, 0.14, 8); bl.scale.set(1, 0.6, 0.9); g.add(bl);
  [-1, 1].forEach(s => { g.add(sphere(0.2, color, s * 0.3, 0.8, 0.3, 8)); g.add(box(0.14, 0.32, 0.14, color, s * 0.38, 0.15, 0.42)); g.add(box(0.2, 0.05, 0.22, dark, s * 0.4, 0.02, 0.5)); const sp = sphere(0.09, dark, s * 0.32, 0.72, -0.2, 5); sp.scale.y = 0.4; g.add(sp); });
  peepers(g, 0.12, 0.3, 0.86, 0.42, 0x111111, 0.35, dark);
  g.add(box(0.62, 0.05, 0.05, 0x3b5323, 0, 0.42, 0.56));
  const legs = new THREE.Group(); legs.position.set(0, 0.3, -0.3); [-1, 1].forEach(s => { legs.add(box(0.26, 0.22, 0.6, color, s * 0.5, 0, 0)); legs.add(box(0.3, 0.06, 0.42, dark, s * 0.55, -0.24, 0.14)); }); g.add(legs);
  g.userData = { legs }; return compact(g);
}
// Maulwurf / Gullyratte: schießt aus dem Boden
export function makeMole(color = 0x4a3b33, nose = 0xff9aa9, ears = false) {
  const g = new THREE.Group(), paw = 0xf0c0a8;
  const b = sphere(0.6, color, 0, 0.6, 0, 10); b.scale.set(1, 1.15, 0.9); g.add(b);
  g.add(sphere(0.16, nose, 0, 0.78, 0.56, 8)); g.add(sphere(0.3, shade(color, 1.3), 0, 0.68, 0.38, 8));
  peepers(g, 0.08, 0.18, 0.98, 0.46, 0x111111, 0.5, shade(color, 0.6));
  [-1, 1].forEach(s => { g.add(thin(0.07, 0.12, 0.04, 0xffffff, s * 0.05, 0.55, 0.62)); const c = box(0.36, 0.1, 0.3, paw, s * 0.55, 0.7, 0.32); c.rotation.z = s * 0.5; g.add(c); if (ears) { const e = sphere(0.17, nose, s * 0.34, 1.22, 0, 6); e.scale.z = 0.4; g.add(e); } });
  return compact(g);
}
export function makeDustBunny() {
  const g = new THREE.Group();
  g.add(sphere(0.45, 0xa4b0be, 0, 0.5, 0, 8));
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2, m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.26 + (i % 3) * 0.05, 0), mat(i % 2 ? 0xb2bec3 : 0x8395a7)); m.position.set(Math.cos(a) * 0.36, 0.5 + Math.sin(i * 2.3) * 0.2, Math.sin(a) * 0.36); g.add(m); }
  for (let i = 0; i < 5; i++) { const h = box(0.03, 0.4, 0.03, 0x636e72, (i - 2) * 0.12, 1.0, -0.1); h.rotation.z = (i - 2) * 0.3; g.add(h); }
  peepers(g, 0.13, 0.17, 0.62, 0.48, 0x111111, 0.45, 0x2d3436);
  g.add(box(0.26, 0.05, 0.05, 0x2d3436, 0, 0.36, 0.56));
  return compact(g);
}
export function makeMiniRat() {
  const g = new THREE.Group(), c = 0x6f6f72, pink = 0xffb6c1;
  const b = sphere(0.45, c, 0, 0.42, 0, 9); b.scale.set(0.8, 0.75, 1.3); g.add(b);
  g.add(cone(0.28, 0.6, c, 0, 0.48, 0.7).rotateX(Math.PI / 2)); g.add(sphere(0.07, 0xff6f91, 0, 0.48, 1.0, 6));
  [-1, 1].forEach(s => { const e = sphere(0.15, pink, s * 0.22, 0.78, 0.45, 6); e.scale.z = 0.4; g.add(e); g.add(sphere(0.055, 0xd63031, s * 0.11, 0.6, 0.72, 5)); g.add(box(0.12, 0.08, 0.18, pink, s * 0.22, 0.05, 0.35)); g.add(box(0.12, 0.08, 0.18, pink, s * 0.22, 0.05, -0.35)); const br = box(0.13, 0.03, 0.03, 0x3a3a3c, s * 0.11, 0.68, 0.73); br.rotation.z = -s * 0.5; g.add(br); });
  g.add(thin(0.1, 0.1, 0.04, 0xfff8e0, 0, 0.36, 0.92));
  const tail = new THREE.Group(); tail.position.set(0, 0.38, -0.55); tail.add(cyl(0.045, 0.02, 0.9, pink, 0, 0, -0.45, 4).rotateX(Math.PI / 2)); g.add(tail);
  g.userData = { tail }; return compact(g);
}
// Putzroboter (Büro): flache Scheibe mit Visier und Warnlampe
export function makeRobo() {
  const g = new THREE.Group();
  g.add(cyl(0.6, 0.65, 0.3, 0x2d3436, 0, 0.2, 0, 14)); g.add(cyl(0.5, 0.5, 0.06, 0x636e72, 0, 0.37, 0, 14)); g.add(box(0.9, 0.2, 0.16, 0xfdcb6e, 0, 0.16, 0.56));
  g.add(box(0.56, 0.14, 0.05, 0x111111, 0, 0.3, 0.6)); [-1, 1].forEach(s => { g.add(box(0.12, 0.07, 0.03, 0x81ecec, s * 0.14, 0.31, 0.63)); const b = box(0.16, 0.03, 0.03, 0xfdcb6e, s * 0.14, 0.4, 0.62); b.rotation.z = -s * 0.4; g.add(b); });
  [-1, 1].forEach(s => g.add(cyl(0.16, 0.16, 0.03, 0xb2bec3, s * 0.5, 0.05, 0.5, 8)));
  const lamp = sphere(0.09, 0xff5252, 0, 0.46, -0.1, 6); lamp.material.emissive = new THREE.Color(0xd00000); g.add(lamp);
  g.userData = { lamp }; return compact(g);
}
// Tacker: hüpft und schnappt mit dem Oberteil
export function makeStapler() {
  const g = new THREE.Group(), red = 0xd63031;
  g.add(box(0.5, 0.15, 1.3, 0x2d3436, 0, 0.08, 0)); g.add(box(0.3, 0.2, 0.3, 0x636e72, 0, 0.25, -0.5));
  const jaw = new THREE.Group(); jaw.position.set(0, 0.3, -0.55); g.add(jaw);
  jaw.add(box(0.46, 0.28, 1.25, red, 0, 0.16, 0.6)); jaw.add(box(0.48, 0.05, 1.22, 0xb2bec3, 0, 0.0, 0.62));
  peepers(jaw, 0.09, 0.12, 0.38, 1.1, 0x111111, 0.5, 0x2d3436);
  for (let i = 0; i < 4; i++) jaw.add(thin(0.06, 0.08, 0.04, 0xffffff, -0.15 + i * 0.1, -0.06, 1.2));
  g.userData = { jaw }; return compact(g);
}
// Überwachungsdrohne (Büro)
export function makeDrone() {
  const g = new THREE.Group();
  g.add(box(0.6, 0.22, 0.6, 0xdfe6e9, 0, 0, 0)); [Math.PI / 4, -Math.PI / 4].forEach(r => { const a = box(1.5, 0.08, 0.1, 0x636e72); a.rotation.y = r; g.add(a); });
  [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([x, z]) => { g.add(cyl(0.07, 0.07, 0.14, 0x2d3436, x * 0.53, 0.08, z * 0.53, 6)); g.add(cyl(0.3, 0.3, 0.02, 0xc8d6e5, x * 0.53, 0.16, z * 0.53, 10)); });
  g.add(sphere(0.15, 0x111111, 0, -0.12, 0.25, 8)); g.add(sphere(0.05, 0xffffff, 0.05, -0.08, 0.38, 4));
  const lamp = sphere(0.06, 0xff5252, 0, 0.14, 0.25, 5); lamp.material.emissive = new THREE.Color(0xd00000); g.add(lamp);
  g.userData = { lamp }; return compact(g);
}
export function makeBat() {
  const g = new THREE.Group(), c = 0x4b3f5c, inner = 0x8e7cc3;
  const b = sphere(0.3, c, 0, 0, 0, 8); b.scale.set(0.9, 1, 1.1); g.add(b); g.add(sphere(0.24, c, 0, 0.12, 0.26, 8));
  [-1, 1].forEach(s => { g.add(cone(0.09, 0.26, c, s * 0.14, 0.38, 0.22, 4)); g.add(sphere(0.06, 0xffd32a, s * 0.09, 0.17, 0.46, 5)); g.add(thin(0.03, 0.08, 0.03, 0xffffff, s * 0.05, -0.02, 0.48)); });
  const wings = [-1, 1].map(s => { const w = new THREE.Group(); w.position.set(s * 0.22, 0.05, 0); w.add(box(0.8, 0.04, 0.5, c, s * 0.42, 0, 0)); w.add(box(0.6, 0.045, 0.3, inner, s * 0.4, -0.01, -0.05)); for (let i = 0; i < 3; i++) w.add(box(0.05, 0.06, 0.55, shade(c, 0.7), s * (0.25 + i * 0.25), 0.01, -0.02)); g.add(w); return w; });
  g.userData = { wings }; return compact(g);
}
// Huhn (braun) und Gans (weiß, größer, langer Hals)
export function makeFowl(goose = false) {
  const g = new THREE.Group(), c = goose ? 0xf5f6fa : 0xb9773a, light = goose ? 0xffffff : 0xe8c39e, beak = 0xf39c12, s = goose ? 1.25 : 1;
  const b = sphere(0.45 * s, c, 0, 0.62 * s, 0, 9); b.scale.set(0.85, 0.8, 1.15); g.add(b);
  const bl = sphere(0.38 * s, light, 0, 0.55 * s, 0.12 * s, 8); bl.scale.set(0.8, 0.7, 0.9); g.add(bl);
  [-1, 1].forEach(k => { const w = box(0.1, 0.35 * s, 0.6 * s, shade(c, 0.85), k * 0.38 * s, 0.68 * s, -0.05); g.add(w); g.add(cyl(0.04, 0.04, 0.35 * s, beak, k * 0.15, 0.17 * s, 0, 4)); g.add(box(0.16, 0.04, 0.22, beak, k * 0.15, 0.02, 0.06)); });
  [-1, 0, 1].forEach(k => { const f = box(0.1, 0.4 * s, 0.1, shade(c, 0.8), k * 0.1, 0.9 * s, -0.5 * s); f.rotation.x = -0.6; f.rotation.z = k * 0.3; g.add(f); });
  if (goose) g.add(cyl(0.11 * s, 0.13 * s, 0.6 * s, c, 0, 0.98 * s, 0.38 * s, 7));
  const head = new THREE.Group(); head.position.set(0, goose ? 1.32 * s : 1.0, goose ? 0.42 * s : 0.38); g.add(head);
  head.add(sphere(0.2 * s, c, 0, 0, 0, 8)); head.add(cone(0.08 * s, 0.26 * s, beak, 0, -0.03, 0.26 * s).rotateX(Math.PI / 2));
  peepers(head, 0.05 * s, 0.11 * s, 0.06, 0.13 * s, 0x111111, 0.55, 0x2d2d2d);
  if (!goose) { [-0.08, 0.02, 0.12].forEach((z, i) => head.add(box(0.06, 0.14 + (i % 2) * 0.05, 0.1, 0xe74c3c, 0, 0.2, z))); head.add(sphere(0.06, 0xe74c3c, 0, -0.16, 0.18, 5)); }
  g.userData = { head }; return compact(g);
}
export function makeMiniGull() {
  const g = new THREE.Group(), c = 0xf4f4f4, wing = 0xbfc7cc, tip = 0x2d2d2d;
  const b = sphere(0.3, c, 0, 0, 0, 8); b.scale.set(0.8, 0.8, 1.5); g.add(b); g.add(sphere(0.22, c, 0, 0.18, 0.4, 8));
  g.add(cone(0.07, 0.3, 0xffb21c, 0, 0.14, 0.7).rotateX(Math.PI / 2)); g.add(sphere(0.035, 0xe74c3c, 0, 0.1, 0.72, 4));
  peepers(g, 0.05, 0.11, 0.26, 0.55, 0xffe066, 0.5, tip);
  g.add(box(0.3, 0.05, 0.3, wing, 0, 0.02, -0.5));
  const wings = [-1, 1].map(s => { const w = new THREE.Group(); w.position.set(s * 0.18, 0.08, 0); w.add(box(0.9, 0.05, 0.42, wing, s * 0.45, 0, 0)); w.add(box(0.32, 0.055, 0.38, tip, s * 0.95, 0, -0.02)); g.add(w); return w; });
  g.userData = { wings }; return compact(g);
}
