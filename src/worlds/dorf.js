// Das Dorf: Marktplatz mit Kirchturm in der Mitte, Windmühle auf dem Nordhügel, Burgruine im Süden,
// Bauernhof mit Scheune und Hühnern im Osten, Dorfteich mit Seerosen im Westen, Bäckerei als Innenraum.
import * as THREE from 'three';
import { BirdBoss, Pigeon } from '../bosses.js';
import { box, cyl, cone, sphere, makeNpcDog, makeRoundTree, makeFlowers } from '../models.js';

const WOOD = 0x8d6e63, STONE = 0xb0a99f, ROOF = 0xb71c1c, PATH = 0xcdb994;

function bench() { const g = new THREE.Group(); g.add(box(2.4, 0.15, 0.7, WOOD, 0, 0.55, 0)); g.add(box(2.4, 0.6, 0.12, WOOD, 0, 0.95, -0.3)); [-1, 1].forEach(s => g.add(box(0.12, 0.55, 0.6, 0x2d3436, s, 0.27, 0))); return g; }
function chicken() { const g = new THREE.Group(); g.add(box(0.7, 0.55, 0.9, 0xfafafa, 0, 0.45, 0)); g.add(box(0.4, 0.4, 0.4, 0xfafafa, 0, 0.85, 0.45)); g.add(box(0.12, 0.18, 0.25, 0xe53935, 0, 1.1, 0.45)); g.add(box(0.15, 0.1, 0.2, 0xffb300, 0, 0.8, 0.72)); [-0.18, 0.18].forEach(x => g.add(box(0.08, 0.3, 0.08, 0xffb300, x, 0.15, 0))); return g; }
function house(l, x, z, c, y = 0, w = 10, h = 5) { l.box(x, y, z, w, h, w, c); l.box(x, y + h, z, w + 0.5, 0.4, w + 0.5, WOOD); l.deco(cone(w * 0.75, 3.5, ROOF, 0, 0, 0, 4), x, y + h + 2.1, z, Math.PI / 4); }

export const DORF = {
  name: 'Das Dorf', surface: 'grass', time: 'abend', backdrop: 'berge', grass: true, sky: 0x9fc8f0, ground: 0x9ccc65, size: 150, need: 8, goalKind: 'bread',
  music: { scale: 'major', root: 294, bpm: 126, seed: 77, swing: 0.09, style: 'village' },
  build(l) {
    const g = l.game, T = (x, z) => l.top(x, z);
    l.spawn.set(0, 1, 28);
    // ---- Marktplatz (Kern) – Stadtmauer mit Toren in alle Richtungen
    l.wallRing(36, 5, 0xa1887f, 10);
    l.group.add(box(24, 0.05, 24, 0xbcaaa4, 0, 0.03, 0)); l.deco(cyl(2.5, 2.8, 1.2, 0x90a4ae, 0, 0.6, 0, 12), 0, 0.6, 0); l.deco(cyl(0.4, 0.4, 3, 0x90a4ae, 0, 2.5, 0, 8), 0, 2.5, 0);
    [[-24, -20, 0xffccbc], [-24, 20, 0xb3e5fc], [24, -20, 0xfff59d], [24, 20, 0xffab91], [-8, -28, 0xf8bbd0], [10, -28, 0xb2dfdb]].forEach(([x, z, c]) => house(l, x, z, c));
    [[-15.6, -17.8, -20], [15.6, 17.8, -20], [-16.4, -14.2, -28]].forEach(([lx, hx, z]) => { l.box(lx, 0, z, 2, 1.6, 2, 0x795548); l.box(hx, 0, z, 2, 3.4, 2, 0x795548); });
    l.box(30, 0, -30, 4, 8, 4, 0xbcaaa4); l.deco(cone(3, 4, 0x5d4037, 0, 0, 0, 4), 30, 10, -30, Math.PI / 4); // Kirchturm
    l.box(28.5, 8, -30, 1, 0.3, 4, 0xbcaaa4);
    l.goldbone('kletter', 30, 8.8, -30);
    l.goldbone('geheim', -33, 0.6, 33, { hidden: true });
    l.box(16, 0, 20, 4, 1.5, 3, 0x6d4c41); l.box(16, 1.5, 21, 4, 1.5, 1, 0x6d4c41); // Karren
    [[-8, 8], [8, 8], [-8, -8], [8, -8]].forEach(([x, z]) => { l.box(x, 0, z, 4, 1.2, 2, WOOD); l.box(x, 3.2, z, 4.6, 0.2, 3, (x + z) % 16 ? 0xef5350 : 0x42a5f5); });
    [[-12, 0], [12, 12], [0, -14], [14, -10]].forEach(([x, z]) => l.addEnemy(new Pigeon(g, x, z)));
    l.warp(-4, 0, 24, 'Marktplatz', bench());
    // ---- Fähigkeit dieser Welt: Wandsprung. Alter Backstein-Schornstein: zwischen den Wänden im Zickzack hoch
    l.teacher(5, 26, 'wandsprung');
    l.climbWall(-16, 0, 14, 2, 14, 4); l.climbWall(-10.5, 0, 14, 1, 14, 4);
    l.box(-18.5, 13.6, 14, 3, 0.4, 4, 0x8d4a3b); l.goldbone('wand', -18, 14.8, 14); // oben links vom Schornstein: Nest mit Goldknochen
    l.label('Schornstein', -13, 17, 14);
    // Wege aus den Toren
    [[0, -60, 4, 48], [0, 60, 4, 48], [60, 0, 48, 4], [-54, 0, 36, 4]].forEach(([x, z, w, d]) => l.group.add(box(w, 0.05, d, PATH, x, 0.03, z)));

    // ---- Bäckerei (Haus am Marktplatz, innen eigener Raum)
    house(l, -24, 0, 0xffe0b2);
    l.door(-18.7, 0, 0, { x: 2300, y: 0.2, z: 7, yaw: Math.PI }, { label: 'Bäckerei', ry: Math.PI / 2 });
    const bx = 2300; l.room(bx, 0, 30, 20);
    l.box(bx, -1, 0, 30, 1, 20, 0xd7ccc8); l.box(bx, 7, 0, 30, 1, 20, 0x8d6e63);
    l.box(bx, 0, -10, 30, 7, 1, 0xffe0b2); l.box(bx, 0, 10, 30, 7, 1, 0xffe0b2); l.box(bx - 15, 0, 0, 1, 7, 20, 0xffe0b2); l.box(bx + 15, 0, 0, 1, 7, 20, 0xffe0b2);
    l.box(bx - 9, 0, -7, 7, 3.4, 4, 0x6d4c41); l.deco(box(3, 1.4, 0.2, 0xff7043), bx - 9, 1.4, -4.9); // Ofen
    l.box(bx + 4, 0, -2, 12, 1.1, 2.4, 0xbcaaa4); for (let i = 0; i < 6; i++) l.deco(box(0.7, 0.35, 0.4, 0xe8b86d), bx - 1 + i * 2, 1.3, -2);
    [[8, -8, 1.4], [11, -8, 2.8], [13.5, -6, 4.2]].forEach(([x, z, h]) => l.box(bx + x, 0, z, 2.4, h, 2.4, 0xa1887f)); // Mehlsäcke
    [-12, -6, 0, 6].forEach(x => l.pickup(bx + x, 0.3, 6, 'crumb')); l.pickup(bx + 13.5, 4.5, -6, 'crumb');
    const baker = makeNpcDog(0xffffff, 0xffffff); l.deco(baker, bx - 4, 0, 4, Math.PI);
    l.deco(box(0.6, 0.8, 0.6, 0xffffff), bx - 4, 2.1, 4.3); // Bäckermütze
    l.kekse = 0;
    l.interactable(bx - 4, 0, 4, 2, it => {
      it.used = false;
      if (l.kekse >= 5 && !g.hasBone(l.key, 'baecker')) { it.used = true; g.talk('baecker.fertig', { mesh: baker }); l.spawnGoldbone(bx - 4, 0.6, 1.5, 'baecker'); }
      else if (!g.hasBone(l.key, 'baecker')) g.talk('baecker', { mesh: baker, vars: { n: l.kekse, r: 5 - l.kekse } });
    });
    l.door(bx, 0, 9.4, { x: -16.5, y: 0.2, z: 0, yaw: -Math.PI / 2 }, { label: 'Ausgang', ry: Math.PI });

    // ---- Norden: Mühlenhügel mit Windmühle
    l.zone(0, -105, 60, () => {
      l.hill(0, -105, 40, 14, { flat: 0.35, color: 0x8bc34a });
      l.hill(-40, -130, 18, 6, { flat: 0.3, color: 0x8bc34a }); l.hill(38, -128, 16, 5, { flat: 0.3, color: 0x8bc34a });
      l.box(0, 14, -105, 7, 12, 7, 0xeeeeee); l.deco(cone(5.2, 4.5, 0x5d4037, 0, 0, 0, 8), 0, 28.2, -105);
      for (let i = 0; i < 14; i++) { const a = i * 0.45 + Math.PI / 2, r = 5.4; l.box(Math.cos(a) * r, 14 + 0.6 + i * 0.7, -105 + Math.sin(a) * r, 2, 0.4, 2, WOOD); }
      l.box(0, 23.6, -100.2, 7, 0.4, 2.6, WOOD); // Galerie
      l.mill = new THREE.Group(); for (let i = 0; i < 4; i++) { const s = box(1.4, 9, 0.2, 0xf5f5dc, 0, 4.8, 0); const arm = new THREE.Group(); arm.add(s); arm.rotation.z = i * Math.PI / 2; l.mill.add(arm); }
      l.deco(l.mill, 0, 22, -108.8);
      l.goldbone('muehle', -2, 24.8, -100.2);
      [[-14, -82], [16, -86], [-22, -118], [24, -116], [0, -132]].forEach(([x, z], i) => l.tree(x, z, 1.4 + (i % 2) * 0.3, makeRoundTree(1.4 + (i % 2) * 0.3)));
      l.pickup(-40, T(-40, -130) + 0.3, -130, 'bread', { goal: true, hidden: true });
      l.pickup(38, T(38, -128) + 0.3, -128, 'treat', { special: true, onTake: () => l.keks(), onRestore: () => l.kekse++ });
      l.warp(6, T(6, -80), -80, 'Mühlenhügel', bench());
    });

    // ---- Osten: Bauernhof mit Scheune und Hühnern
    l.zone(105, 0, 55, () => {
      l.box(108, 0, -16, 26, 10, 18, 0xc62828); l.deco(cone(18.5, 6, 0x5d4037, 0, 0, 0, 4), 108, 13, -16, Math.PI / 4);
      l.door(94.4, 0, -16, { x: 2000, y: 0.2, z: 8, yaw: Math.PI }, { label: 'Scheune', ry: -Math.PI / 2 });
      // Hühnergehege
      const px = 110, pz = 28;
      [[px, pz - 9, 24, 0.4], [px, pz + 9, 24, 0.4], [px - 12, pz, 0.4, 18], [px + 12, pz, 0.4, 18]].forEach(([x, z, w, d]) => l.box(x, 0, z, w, 1.0, d, 0xd7ccc8));
      l.box(px + 8, 0, pz - 5, 4, 2.5, 3, 0x8d6e63); // Hühnerstall
      l.huhn = 0; l.chickens = [];
      if (!g.hasBone(l.key, 'huehner')) for (let i = 0; i < 5; i++) {
        const m = chicken(); const c = { x: px - 8 + i * 4, z: pz + (i % 2 ? 4 : -3), a: i, m, caught: false };
        l.deco(m, c.x, 0, c.z);
        c.it = { x: c.x, y: 0.5, z: c.z, r: 1, hintText: 'BISS', used: false, cb: () => { c.caught = true; m.position.set(px + 8 + (l.huhn - 2) * 0.9, 2.5, pz - 5); l.huhn++; g.audio.sfx('collect'); if (l.huhn >= 5) { g.talk('bauer.fertig'); l.spawnGoldbone(px, 1, pz, 'huehner'); } else g.toast(`Huhn ${l.huhn}/5 eingefangen!`, 1500); } };
        l.interact.push(c.it); l.chickens.push(c);
      }
      const farmer = makeNpcDog(0x795548, 0x388e3c); l.deco(farmer, 92, 0, 20, Math.PI / 2);
      l.trigger(92, 0, 20, 5, () => { if (!g.hasBone(l.key, 'huehner') && l.huhn < 5) g.talk('bauer', { mesh: farmer }); }, false);
      // Heuballen-Stapel und Traktor
      [[128, 0, 2], [131, 0, 2], [129.5, 1.6, 2]].forEach(([x, y, z]) => l.box(x, y, z, 2.8, 1.6, 2, 0xffd54f));
      l.box(80, 0, 40, 4, 2, 3, 0x2e7d32); l.deco(cyl(1, 1, 0.6, 0x212121, 0, 0, 0, 10).rotateZ(Math.PI / 2), 79, 1, 41.6);
      for (let i = 0; i < 4; i++) for (let k = 0; k < 6; k++) l.deco(makeFlowers(), 120 + i * 5, 0, -50 + k * 3);
      l.pickup(129.5, 3.5, 2, 'bread', { goal: true, hidden: true });
      l.pickup(80, 2.3, 40, 'treat', { special: true, onTake: () => l.keks(), onRestore: () => l.kekse++ });
      l.warp(86, 0, 6, 'Bauernhof', bench());
    });
    // Scheune innen: Heuballen-Kletterei bis zum Heuboden
    const sx = 2000; l.room(sx, 0, 36, 24);
    l.box(sx, -1, 0, 36, 1, 24, 0x8d6e63); l.box(sx, 12, 0, 36, 1, 24, 0x5d4037);
    l.box(sx, 0, -12, 36, 12, 1, 0xa1887f); l.box(sx, 0, 12, 36, 12, 1, 0xa1887f); l.box(sx - 18, 0, 0, 1, 12, 24, 0xa1887f); l.box(sx + 18, 0, 0, 1, 12, 24, 0xa1887f);
    [[-12, 6, 1.6], [-14, 2, 3.2], [-12, -2, 4.8], [-8, -6, 6.4]].forEach(([x, z, h]) => l.box(sx + x, 0, z, 3, h, 3, 0xffd54f));
    l.box(sx + 6, 6.4, -8, 22, 0.5, 7, WOOD); // Heuboden
    l.box(sx + 14, 6.9, -8, 3, 1.6, 3, 0xffd54f);
    l.goldbone('scheune', sx + 14, 9.3, -8);
    [[-6, 6], [6, 6], [12, 0], [0, -8]].forEach(([x, z]) => l.pickup(sx + x, z === -8 ? 7.2 : 0.3, z, 'crumb'));
    l.pickup(sx + 8, 7.2, -10, 'bread', { goal: true, hidden: true });
    l.door(sx, 0, 11.4, { x: 92.5, y: 0.2, z: -16, yaw: Math.PI / 2 }, { label: 'Ausgang', ry: Math.PI });

    // ---- Süden: Burgruine auf dem Hügel
    l.zone(0, 108, 55, () => {
      l.hill(0, 108, 38, 10, { flat: 0.45, color: 0x7cb342 });
      const y = 10;
      [[-12, 98, 1, 12, 8], [12, 96, 1, 8, 6], [0, 120, 20, 1, 7], [-6, 92, 8, 1, 4]].forEach(([x, z, w, d, h]) => l.box(x, y, z, w, h, d, STONE));
      // Treppe aus Mauerresten hoch auf den Wehrgang
      [[-6, 104, 1.5], [-9, 106, 3], [-12, 108, 4.5], [-12, 112, 6]].forEach(([x, z, h]) => l.box(x, y, z, 2.6, h, 2.6, STONE));
      l.box(-4, y + 6, 116, 18, 0.6, 3, STONE); // Wehrgang
      l.ramp(5, 116, 9, 108.5, 2, y + 6.6, y + 8.4, WOOD, { bridge: true }); // Holzsteg zum Turm
      l.box(9, y, 106, 5, 8.4, 5, STONE); // Turm unten
      for (let i = 0; i < 8; i++) { const a = i * 0.6 - Math.PI / 2, r = 4.2; l.box(9 + Math.cos(a) * r, y + 9 + i * 1.1, 106 + Math.sin(a) * r, 1.9, 0.4, 1.9, STONE); }
      l.box(9, y + 8.4, 106, 4, 9.4, 4, 0x9e968c); l.box(9, y + 17.8, 106, 6, 0.5, 6, STONE);
      [[-2.5, -2.5], [2.5, -2.5], [-2.5, 2.5], [2.5, 2.5]].forEach(([dx, dz]) => l.box(9 + dx, y + 18.3, 106 + dz, 1, 1, 1, STONE));
      l.goldbone('burg', 9, y + 19, 106);
      l.pickup(-12, y + 6.3, 98, 'bread', { goal: true, hidden: true });
      l.pickup(-6, y + 4.3, 92, 'treat', { special: true, onTake: () => l.keks(), onRestore: () => l.kekse++ });
      [[-30, 90], [30, 128], [-26, 130], [32, 88]].forEach(([x, z]) => l.tree(x, z, 1.5, makeRoundTree(1.5)));
      l.warp(-6, T(-6, 76), 76, 'Burgruine', bench());
    });

    // ---- Westen: Dorfteich mit Seerosen und Weideninsel
    l.zone(-100, 0, 55, () => {
      l.pond(-105, 0, 30, 22, 4);
      l.hill(-112, 4, 7, 5.6, { flat: 0.5, y0: -4, color: 0x7cb342, side: 0x8a6b3f });
      [[-78, -2], [-84, 2], [-90, -1], [-96, 3], [-102, 0]].forEach(([x, z]) => { l.box(x, -0.2, z, 2.4, 0.3, 2.4, 0x43a047); l.deco(sphere(0.25, 0xf8bbd0, 0, 0, 0, 6), x + 0.6, 0.25, z + 0.4); });
      l.deco(makeRoundTree(1.8), -112, 1.6, 6);
      l.goldbone('teich', -112, 2.4, 2);
      l.pickup(-120, 0.3, -30, 'bread', { goal: true, hidden: true });
      l.pickup(-112, 1.9, 7, 'treat', { special: true, onTake: () => l.keks(), onRestore: () => l.kekse++ });
      // Steg mit Angler
      l.box(-100, -0.1, 20, 3, 0.4, 8, WOOD); const fisher = makeNpcDog(0xbcaaa4, 0x1565c0); l.deco(fisher, -100, 0.3, 17, Math.PI);
      l.trigger(-100, 0.3, 18, 4, () => g.talk('angler', { mesh: fisher }), false);
      [[-130, -40], [-80, -40], [-135, 35], [-75, 40]].forEach(([x, z]) => l.tree(x, z, 1.6, makeRoundTree(1.6)));
      l.warp(-70, 0, 8, 'Dorfteich', bench());
    });
    l.pickup(60, 0.3, 60, 'treat', { special: true, onTake: () => l.keks(), onRestore: () => l.kekse++ });
    l.keks = () => { l.kekse++; g.toast(`Hundekeks ${l.kekse}/5 – zurück zu Bäcker Bruno!`); };
    // Restliche Brote am Marktplatz
    [[-24, 5.6, -20], [24, 5.6, -20], [0, 1.5, 0]].forEach(([x, y, z]) => l.pickup(x, y, z, 'bread', { goal: true, hidden: true }));

    l.scatter(70);
    l.label('Die Tauben haben 8 Brote im ganzen Dorf versteckt. NASE benutzen!', 0, 5, 24);
  },
  update(l, dt) {
    if (l.mill) l.mill.rotation.z += dt * 0.6;
    const pp = l.game.player.pos;
    for (const c of l.chickens || []) {
      if (c.caught) continue;
      c.a += dt * 1.3; const dx = c.x - pp.x, dz = c.z - pp.z, d = Math.hypot(dx, dz);
      let vx = Math.cos(c.a) * 1.2, vz = Math.sin(c.a * 0.7) * 1.2;
      if (d < 4) { vx = dx / d * 3.2; vz = dz / d * 3.2; }
      c.x = Math.max(99, Math.min(121, c.x + vx * dt)); c.z = Math.max(20, Math.min(36, c.z + vz * dt));
      c.m.position.set(c.x, 0, c.z); c.m.rotation.y = Math.atan2(vx, vz); c.it.x = c.x; c.it.z = c.z;
    }
  },
  onGoal(l) { l.game.toast('Von der Kirchturmspitze: GURR! Die Obertaube!'); l.game.later(1000, () => { const b = new BirdBoss(l.game, 'pigeon', 0, 0, 'Die Obertaube'); b.mesh.scale.setScalar(2.2); b.radius = 1.8; l.setBoss(b); }); },
};
