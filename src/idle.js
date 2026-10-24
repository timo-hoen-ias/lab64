// Molls Leerlauf-Animationen: Wartet der Spieler, wedelt Moll erst mit dem Schwanz, macht dann Platz,
// rollt sich auf den Rücken und schläft schließlich ein. Jede Eingabe bricht sofort ab.
// Läuft nach animateDog() und legt die Pose darüber; fasst nur Teile an, die es selbst jeden Frame setzt.
import * as THREE from 'three';

// Zeitplan in Sekunden Wartezeit
const WAG = 4, DOWN = 8, ROLL = 13, ROLL_END = 17, SLEEP = 22;
const L = THREE.MathUtils.lerp;

// Tiefster Punkt von Rumpf/Bauch (x ±0.45, y 0.38..1.05 im Rig), wenn das Rig um z gedreht ist
function lowest(a) {
  const s = Math.sin(a), c = Math.cos(a);
  return Math.min(...[-0.45, 0.45].flatMap(x => [0.38, 1.05].map(y => x * s + y * c)));
}

function zTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  x.font = 'bold 54px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.lineWidth = 8; x.strokeStyle = '#3a4a7a'; x.strokeText('Z', 32, 34); x.fillStyle = '#ffffff'; x.fillText('Z', 32, 34);
  return new THREE.CanvasTexture(c);
}

// t: Wartezeit in Sekunden (0 = Spieler aktiv)
export function animateIdle(dog, t, dt) {
  const u = dog.userData;
  if (!u.idlePose) {
    const zt = zTexture();
    const zs = [0, 1, 2].map(() => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: zt, transparent: true, depthWrite: false })); s.visible = false; dog.add(s); return s; });
    u.idlePose = { wag: 0, down: 0, roll: 0, sleep: 0, clock: 0, headY: u.head.position.y, zs };
  }
  const p = u.idlePose;
  const target = {
    wag: t > WAG && t < SLEEP ? (t > DOWN ? 0.5 : 1) : 0,
    down: t > DOWN ? 1 : 0,
    roll: t > ROLL && t < ROLL_END ? Math.PI : 0,
    sleep: t > SLEEP ? 1 : 0,
  };
  const k = Math.min(1, dt * (t > 0 ? 3 : 14)); // Eingabe → schnell zurück in den Stand
  p.wag = L(p.wag, target.wag, k); p.down = L(p.down, target.down, k); p.sleep = L(p.sleep, target.sleep, k);
  p.roll = L(p.roll, target.roll, Math.min(1, dt * (t > 0 ? 3.5 : 14)));
  if (t > 0) p.clock += dt; else p.clock = 0;
  const T = p.clock, d = p.down, s = p.sleep, r = (1 - Math.cos(p.roll)) / 2; // r: 0 = Bauch unten, 1 = auf dem Rücken

  // Schwanzwedeln mit Hüftschwung
  const wag = Math.sin(T * 20);
  u.tail.rotation.y = L(L(u.tail.rotation.y, wag * 0.9, p.wag), 1.0, s); // schlafend: Schwanz eingerollt
  u.rig.rotation.y = wag * 0.07 * p.wag * (1 - d);

  // Platz: Rig absenken, Vorderbeine nach vorn, Hinterbeine seitlich angelegt; Rollen dreht um die Längsachse
  u.rig.rotation.z += p.roll;
  u.rig.position.y = L(u.rig.position.y, -lowest(p.roll), d);
  const paddle = Math.sin(T * 7) * 0.35 * r;
  u.legs.forEach((leg, i) => {
    const front = i < 2, side = i % 2 ? -1 : 1;
    const lie = front ? -1.45 : -1.2, back = (front ? -0.7 : -0.3) + paddle * (front === !!(i % 2) ? 1 : -1);
    leg.rotation.x = L(leg.rotation.x, L(lie, back, r), d);
    leg.rotation.z = side * (front ? 0.1 : 0.6) * d * (1 - r);
  });

  // Kopf: beim Rollen tiefer ins Rig (sonst steckt er im Boden), im Schlaf abgelegt
  u.head.position.y = p.headY - r * 0.5 * d - s * 0.3;
  u.head.rotation.x = L(L(u.head.rotation.x, -0.1, d), 0.35, s);
  u.head.rotation.y *= 1 - s;
  u.head.rotation.z = r * Math.sin(T * 1.3) * 0.35 + s * 0.25;
  u.earL.rotation.z = L(u.earL.rotation.z, -2.4, r); u.earR.rotation.z = L(u.earR.rotation.z, 2.4, r);
  if (r > 0.5) u.tongue.visible = true;
  if (s > 0.3) { u.tongue.visible = false; u.eyes.forEach(e => { e.scale.y = 0.12; }); }
  u.body.scale.y = L(u.body.scale.y, 1 + Math.sin(T * 1.6) * 0.05, s); // langsames Atmen

  // Zzz über dem Kopf
  p.zs.forEach((z, i) => {
    const f = (T * 0.45 + i / 3) % 1;
    z.visible = s > 0.8;
    z.position.set(0.25 + f * 0.5, 1.25 + f * 1.1, 1.0 + Math.sin(f * 6 + i) * 0.1);
    z.scale.setScalar(0.18 + f * 0.25); z.material.opacity = Math.sin(f * Math.PI);
  });
}
