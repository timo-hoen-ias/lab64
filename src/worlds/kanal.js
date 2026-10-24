// Das Kanalsystem: Haupthalle mit Brühe-Rinne in der Mitte, Pumpwerk im Norden, Rohr-Labyrinth im Osten,
// Klärbecken im Westen, Gully-Schacht nach oben im Süden und das Rattennest (eigener Raum).
import * as THREE from 'three';
import { RatBoss } from '../bosses.js';
import { box, cyl, sphere, makeLabel, makeNpcDog } from '../models.js';
import { FX } from '../fx.js';

const WALL = 0x57606f, WALK = 0x747d8c, PIPE = 0x8395a7, RUST = 0xb87333, H = 12;

function wallZ(l, z, x0, x1, gaps = []) { let a = x0; for (const [g0, g1] of [...gaps, [x1, x1]]) { if (g0 > a) l.box((a + g0) / 2, 0, z, g0 - a, H, 1, WALL); a = g1; } }
function wallX(l, x, z0, z1, gaps = []) { let a = z0; for (const [g0, g1] of [...gaps, [z1, z1]]) { if (g0 > a) l.box(x, 0, (a + g0) / 2, 1, H, g0 - a, WALL); a = g1; } }

export const KANAL = {
  name: 'Das Kanalsystem', indoor: true, sky: 0x2f3542, ground: 0x3d3d3d, size: 60, hazard: (x, z) => Math.abs(x) < 5.6 && Math.abs(z) < 26, need: 6, goalKind: 'cheese', fogNear: 18, fogFar: 70,
  music: { scale: 'minor', root: 196, bpm: 120, seed: 13, style: 'sewer' },
  build(l) {
    const g = l.game;
    const lamp = (x, y, z, on = true) => { const li = new THREE.PointLight(0x9ad7ff, on ? 1.2 : 0, 16); li.position.set(x, y, z); l.scene.add(li); const b = sphere(0.5, on ? 0x9ad7ff : 0x2d3436, 0, 0, 0, 6); l.deco(b, x, y, z); return { li, b }; };
    l.spawn.set(-12, 2, 20); l.wallRing(60, H, WALL);
    wallX(l, -26, -60, 60, [[-44, -38], [-4, 4], [38, 44]]); wallX(l, 26, -60, 60, [[-44, -38], [-4, 4], [38, 44]]);
    wallZ(l, -26, -26, 26, [[-14, -8]]); wallZ(l, 26, -26, 26, [[8, 14]]);

    // ---- Haupthalle (Kern, wie bisher)
    l.group.add(box(10, 0.05, 52, 0x2e5d3a, 0, 0.03, 0));
    l.box(-12, 0, 0, 14, 1, 52, WALK); l.box(12, 0, 0, 14, 1, 52, WALK);
    [[-10], [4], [16]].forEach(([z]) => { const p = cyl(0.9, 0.9, 10, PIPE, 0, 1.4, z, 10); p.rotation.z = Math.PI / 2; l.deco(p, 0, 1.4, z); l.solids.push({ min: { x: -5, y: 0.5, z: z - 0.7 }, max: { x: 5, y: 2.1, z: z + 0.7 }, active: true }); });
    [[-18, -20], [18, -20], [-18, 0], [18, 0], [-18, 20], [18, 20]].forEach(([x, z]) => { l.box(x, 1, z, 0.4, 5, 0.4, 0x2f3542); lamp(x, 6.2, z); });
    l.box(22, 1, -10, 3, 1.5, 3, WALL); l.box(22, 1, -14, 3, 3, 3, WALL); l.box(22, 1, -18, 3, 4.5, 3, WALL);
    l.goldbone('kletter', 22, 6.8, -18);
    // ---- Fähigkeit dieser Welt: Tornado-Trillern. Der Lüftungsschacht über dem Gehweg ist zu hoch zum Springen
    l.teacher(-16, 23, 'tornado');
    l.box(-12, 6.6, 6, 4, 0.5, 3, RUST); l.deco(box(4, 2.6, 0.3, 0x2f3542), -12, 8.4, 4.6);
    l.goldbone('tornado', -12, 7.9, 6);
    l.goldbone('geheim', -24, 1.6, 24, { hidden: true });
    [[-16, 1.3, -22], [16, 1.3, -22], [0, 2.4, 4]].forEach(([x, y, z]) => l.pickup(x, y, z, 'cheese', { goal: true }));
    // Notlampen-Rätsel: 4 Schalter in den Seitengängen, dann leuchtet die Halle und gibt etwas frei
    l.switches = 0; const hall = [[-6, 8, -24], [6, 8, -24], [-6, 8, 24], [6, 8, 24]].map(([x, y, z]) => lamp(x, y, z, false));
    l.lever = (x, y, z, i) => {
      const s = box(0.4, 1.4, 0.4, 0xe74c3c, 0, 0.7, 0); l.deco(s, x, y, z); s.rotation.z = 0.6;
      l.interactable(x, y, z, 1.6, () => {
        s.rotation.z = -0.6; s.material = s.material.clone(); s.material.color.set(0x2ecc71); g.audio.sfx('drawer');
        hall[i].li.intensity = 1.6; hall[i].b.material = hall[i].b.material.clone(); hall[i].b.material.color.set(0xfff3a0); l.switches++;
        if (l.switches >= 4) { g.toast('Alle Notlampen an! In der Haupthalle glitzert etwas.'); if (!g.hasBone(l.key, 'lampen')) l.spawnGoldbone(-12, 1.2, -4, 'lampen'); }
        else g.toast(`Notlampe ${l.switches}/4 an!`, 1500);
      }, 'SCHALTER: BISS');
    };

    // ---- Norden: Pumpwerk mit Laufstegen
    l.zone(0, -43, 40, () => {
      l.group.add(box(52, 0.05, 34, 0x4b4b4b, 0, 0.03, -43));
      l.pumps = [];
      [[-14, -46], [0, -50], [14, -46]].forEach(([x, z]) => { l.box(x, 0, z, 6, 5, 6, 0x34495e); const w = cyl(2.6, 2.6, 0.5, RUST, 0, 0, 0, 12); w.rotation.x = Math.PI / 2; l.pumps.push(l.deco(w, x, 5, z + 3.3)); });
      [[-22, -32, 1.5], [-22, -36, 3], [-22, -40, 4.5], [-22, -44, 6], [-22, -48, 7.5], [-18, -52, 9]].forEach(([x, z, h]) => l.box(x, 0, z, 3, h, 3, WALL));
      l.box(2, 9, -56, 36, 0.4, 4, RUST); // Laufsteg
      l.box(18, 9.4, -56, 4, 1.8, 3, 0x2d3436); l.deco(box(3, 0.8, 0.2, 0x55efc4), 18, 10.4, -54.4); // Steuerpult
      l.goldbone('pumpe', 14, 10.2, -56);
      l.pickup(0, 5.3, -50, 'cheese', { goal: true });
      l.lever(-10, 9.4, -56, 0);
      l.door(-40, 0, -59.4, { x: 2000, y: 0.2, z: 9, yaw: Math.PI }, { label: 'Rattennest', frame: 0x3d2b1f });
      lamp(-10, 8, -34); lamp(10, 8, -34);
      const s = makeLabel('Pumpwerk'); s.scale.set(4, 1, 1); l.deco(s, -11, 5, -27);
    });

    // ---- Osten: Rohr-Labyrinth auf drei Höhen
    l.zone(43, 0, 45, () => {
      const pipe = (x0, z0, x1, z1, y) => { const len = Math.hypot(x1 - x0, z1 - z0), c = cyl(0.9, 0.9, len, PIPE, 0, 0, 0, 10); c.rotation.set(Math.PI / 2, 0, 0); const grp = new THREE.Group(); grp.add(c); grp.rotation.y = Math.atan2(x1 - x0, z1 - z0); l.deco(grp, (x0 + x1) / 2, y, (z0 + z1) / 2); l.box((x0 + x1) / 2, y - 0.9, (z0 + z1) / 2, Math.abs(x1 - x0) + 1.6, 1.8, Math.abs(z1 - z0) + 1.6, PIPE, { dynamic: true }).mesh.visible = false; };
      pipe(30, 8, 56, 8, 1.2); pipe(52, 8, 52, -16, 2.6); pipe(52, -20, 32, -20, 4.4); pipe(32, -24, 32, -44, 6.2); pipe(36, -48, 54, -48, 8);
      l.box(56, 0, -48, 4, 8.9, 4, RUST); l.goldbone('rohre', 56, 9.7, -48);
      for (let i = 0; i < 6; i++) l.box(30 + i * 5, 0, 30 + (i % 2) * 6, 3, 1 + i * 0.6, 3, WALL);
      l.pickup(32, 7.4, -34, 'cheese', { goal: true });
      l.lever(44, 0.2, 50, 1);
      lamp(40, 8, -10); lamp(40, 8, 30); lamp(55, 8, -40);
      [[44, -2], [36, 20], [50, 34]].forEach(([x, z]) => l.pickup(x, 0.3, z, 'crumb'));
      const s = makeLabel('Rohre'); s.scale.set(3, 1, 1); l.deco(s, 30, 5, 0);
    });

    // ---- Westen: Klärbecken mit Fässern und Ventilturm
    l.zone(-43, 0, 45, () => {
      l.pond(-43, 0, 13, 22, 4);
      [[-31, 4, 1], [-35, 8, 1], [-38, 3, 1.6], [-41, -1, 2.3]].forEach(([x, z, h]) => { l.box(x, -0.4, z, 2, h, 2, 0x1e3799); l.deco(box(2.05, 0.15, 2.05, 0xfad390), x, h - 0.65, z); l.pickup(x, h - 0.1, z, 'crumb'); });
      l.box(-44, -4, -2, 3, 7, 3, WALL); l.box(-44, 3, -2, 4, 0.3, 4, RUST);
      l.goldbone('becken', -44, 4.1, -2);
      l.lever(-44, 3.3, -3.4, 2);
      [[-50, -40], [-34, -50], [-50, 40], [-34, 50]].forEach(([x, z]) => l.pickup(x, 0.3, z, 'crumb'));
      const worker = makeNpcDog(0xf39c12, 0xf1c40f); l.deco(worker, -32, 0, -10, -Math.PI / 2);
      l.trigger(-32, 0, -10, 5, () => g.talk('karl', { mesh: worker }), false);
      lamp(-30, 8, 20); lamp(-56, 8, -20); lamp(-56, 8, 20);
      const s = makeLabel('Klärbecken'); s.scale.set(4, 1, 1); l.deco(s, -30, 5, 0);
    });

    // ---- Süden: Gully-Schacht nach oben ans Tageslicht
    l.zone(0, 43, 40, () => {
      l.group.add(box(52, 0.05, 34, 0x4b4b4b, 0, 0.03, 43));
      for (let i = 0; i < 12; i++) l.box((i % 2 ? 1.6 : -1.6), 1.2 + i * 1.6, 57.6, 2.2, 0.3, 1.6, RUST); // Sprossen
      l.box(0, 19.8, 51, 6, 0.4, 6, 0x2d3436); for (let k = -2; k <= 2; k++) l.deco(box(0.2, 0.1, 6, 0x111111), k, 20.25, 51);
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 3.6, 20, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff6d5, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide })); beam.position.set(0, 10, 51); l.group.add(beam);
      const sun = new THREE.PointLight(0xfff1c9, 2, 26); sun.position.set(0, 18, 51); l.scene.add(sun);
      l.goldbone('gully', 1.5, 20.8, 51);
      l.lever(-1.5, 20.2, 49, 3);
      [[-20, 34], [20, 34], [-20, 54], [20, 54], [-8, 44], [8, 44]].forEach(([x, z]) => l.pickup(x, 0.3, z, 'crumb'));
      [[-16, 50], [12, 48]].forEach(([x, z]) => l.box(x, 0, z, 4, 1.4, 4, 0x6d4c41));
      const s = makeLabel('Gully ↑'); s.scale.set(3, 1, 1); l.deco(s, 4, 4, 52);
    });

    // ---- Rattennest (Raum): Käseberg
    const rx = 2000; l.room(rx, 0, 32, 22);
    l.box(rx, -1, 0, 32, 1, 22, 0x3d2b1f); l.box(rx, 8, 0, 32, 1, 22, 0x2d1f16);
    l.box(rx, 0, -11, 32, 8, 1, 0x4e3626); l.box(rx, 0, 11, 32, 8, 1, 0x4e3626); l.box(rx - 16, 0, 0, 1, 8, 22, 0x4e3626); l.box(rx + 16, 0, 0, 1, 8, 22, 0x4e3626);
    [[-8, -4, 1.4], [-4, -6, 2.8], [0, -8, 4.2], [4, -6, 5.6]].forEach(([x, z, h]) => l.box(rx + x, 0, z, 3.4, h, 3.4, 0xffd94a));
    l.goldbone('nest', rx + 4, 6.4, -6);
    l.pickup(rx + 0, 4.5, -8, 'cheese', { goal: true });
    [[-12, 6], [-4, 6], [4, 6], [12, 6], [12, -6]].forEach(([x, z]) => l.pickup(rx + x, 0.3, z, 'crumb'));
    for (let i = 0; i < 12; i++) l.deco(box(0.6, 0.3, 0.6, [0xecf0f1, 0x95a5a6, 0xe67e22][i % 3]), rx - 12 + (i % 6) * 4, 0.15, -9 + Math.floor(i / 6) * 1.2, i);
    const nl = new THREE.PointLight(0xffb347, 1.2, 26); nl.position.set(rx, 6, 0); l.scene.add(nl);
    l.door(rx, 0, 10.4, { x: -40, y: 0.2, z: -57, yaw: 0 }, { label: 'Ausgang', ry: Math.PI, frame: 0x3d2b1f });

    l.scatter(20);
    l.label('Käse sammeln. Hier unten wohnt etwas Großes …', 0, 4, 18);
  },
  update(l, dt) {
    (l.pumps || []).forEach((w, i) => w.rotation.z += dt * (1 + i * 0.3));
    const p = l.game.player.pos;
    if (p.y < 0.6 && Math.abs(p.x) < 5 && Math.abs(p.z) < 26) { FX.splash(l.game.fx, p); l.game.toast('Igitt – Kanalbrühe!'); l.game.player.hurt(1); l.game.player.respawn(); }
  },
  onGoal(l) { l.game.toast('Rote Augen im Dunkeln. DIE KANALRATTE!'); l.game.later(1000, () => l.setBoss(new RatBoss(l.game, 0, -4))); },
};
