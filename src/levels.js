// Leveldefinitionen. Jedes Level: name, sky, ground, size, need (Zielanzahl), goalKind, music, build(lvl), optional update/onGoal.
import * as THREE from 'three';
import { Vacuum, Cat, CanOpener, BirdBoss, Pigeon, FatMan, RatBoss } from './bosses.js';
import { box, cyl, cone, sphere } from './models.js';

const rnd = (a, b) => a + Math.random() * (b - a);

export const LEVELS = {
  // ------------------------------------------------------------------ HUB
  hub: {
    name: 'Molls Garten', sky: 0x7fd0ff, ground: 0x6bbf59, size: 34, music: { scale: 'major', root: 262, bpm: 118, seed: 7 },
    build(l) {
      l.spawn.set(0, 1, 6);
      // Haus
      l.box(0, 0, -16, 12, 6, 9, 0xf3d9a6); l.deco(cone(9, 4, 0xc0392b, 0, 8, -16, 4), 0, 8, -16, Math.PI / 4);
      l.box(0, 0, -11.5, 2.2, 3.2, 0.4, 0x7a4a1f); l.label('Molls Haus', 0, 9.5, -16);
      // Hundehütte
      l.box(-12, 0, 8, 3, 2.2, 3, 0xb5651d); l.deco(cone(2.4, 1.5, 0x8b1e1e, -12, 2.9, 8, 4), -12, 2.9, 8, Math.PI / 4);
      // Zaun
      for (let i = -32; i <= 32; i += 2) { l.box(i, 0, -33, 0.3, 1.2, 0.3, 0xd9c7a0); l.box(i, 0, 33, 0.3, 1.2, 0.3, 0xd9c7a0); l.box(-33, 0, i, 0.3, 1.2, 0.3, 0xd9c7a0); l.box(33, 0, i, 0.3, 1.2, 0.3, 0xd9c7a0); }
      // Bäume & Plattform-Hügel
      [[-22, -20], [22, -22], [-26, 18], [25, 15], [10, 26], [-8, 26]].forEach(([x, z]) => l.tree(x, z, rnd(1, 1.5)));
      l.box(16, 0, -2, 4, 1.2, 4, 0x8fd17a); l.box(19, 0, 2, 4, 2.4, 4, 0x8fd17a); l.box(22, 0, -2, 4, 3.6, 4, 0x8fd17a);
      l.pickup(22, 4.2, -2, 'bone', { value: 5 });
      for (let i = 0; i < 12; i++) l.pickup(rnd(-28, 28), 0.3, rnd(-6, 28), 'crumb');
      // Portale
      l.portal(-10, -4, 'Küche', 'kueche', 0xff9f43, 0);
      l.portal(10, -4, 'Einkaufsstraße', 'strasse', 0x54a0ff, 1);
      l.portal(-20, 4, 'Büro', 'buero', 0x9b9b9b, 2);
      l.portal(20, 10, 'Grillpark', 'park', 0x5f27cd, 3);
      l.portal(-18, 20, 'Hafen', 'hafen', 0x48dbfb, 4);
      l.portal(0, 22, 'Dorf', 'dorf', 0xfeca57, 5);
      l.portal(-26, -10, 'Rattenrennen', 'rattenrennen', 0xff7675, 3);
      l.portal(18, 24, 'Kanal', 'kanal', 0x2f3542, 7);
      l.label('Lauf in einen Ring!', 0, 3.2, 2);
    }
  },

  // ---------------------------------------------------------------- KÜCHE
  kueche: {
    name: 'Die Küche', sky: 0xfff1c9, ground: 0xe7d2a8, size: 18, need: 8, goalKind: 'ham', music: { scale: 'mixo', root: 294, bpm: 132, seed: 3 },
    build(l) {
      l.spawn.set(0, 1, 12); l.wallRing(18, 7, 0xfdf4e3);
      // Fliesenmuster
      for (let x = -16; x < 16; x += 4) for (let z = -16; z < 16; z += 4) if ((x + z) % 8 === 0) { const t = box(4, 0.05, 4, 0xd6bf94, x + 2, 0.03, z + 2); l.group.add(t); }
      // Küchenzeile mit Treppen aus Schubladen
      l.box(-12, 0, -14, 12, 1, 4, 0xa0522d); l.box(-12, 1, -16.5, 12, 0.4, 2, 0xf5f5f5);
      l.box(-16, 0, -11, 3, 0.6, 2, 0xa0522d); l.box(-13.5, 0, -11, 2, 1.0, 2, 0xa0522d); // Treppe
      l.box(6, 0, -14, 10, 1.5, 4, 0xa0522d); l.box(6, 1.5, -14, 10, 0.3, 4, 0x777777); // Herd
      l.box(14, 0, -10, 4, 4, 6, 0xf0f0f0); l.box(14, 4, -10, 4, 0.3, 6, 0xdddddd); // Kühlschrank
      l.box(11, 0, -5, 2, 1, 2, 0xc9a66b); l.box(13, 0, -2.5, 2, 2, 2, 0xc9a66b); l.box(15, 0, 0, 2, 3, 2, 0xc9a66b); // Hocker-Treppe zum Kühlschrank
      l.box(0, 0, 2, 8, 1.6, 5, 0xd2b48c); // Tisch
      l.box(-5, 0, 6, 1.4, 0.9, 1.4, 0x8b5a2b); l.box(5, 0, 6, 1.4, 0.9, 1.4, 0x8b5a2b); // Stühle
      l.deco(cyl(1.2, 1.0, 0.6, 0xd63031, 6, 1.8, -14, 14), 6, 1.8, -14); // Topf
      // Schinken
      [[-12, 1.5, -16], [-6, 1.5, -16], [6, 1.9, -14], [14, 4.4, -10], [0, 1.7, 2], [-16, 0.3, 10], [16, 0.3, 14], [-15, 0.3, -2]].forEach(([x, y, z]) => l.pickup(x, y, z, 'ham', { goal: true }));
      for (let i = 0; i < 14; i++) l.pickup(rnd(-15, 15), 0.3, rnd(-8, 15), 'crumb');
      l.label('Sammle 8 Schinken!', 0, 4, 10);
    },
    onGoal(l) { l.game.toast('Was brummt da?! Der STAUBSAUGER!'); l.game.audio.sfx('vacuum'); setTimeout(() => l.setBoss(new Vacuum(l.game, 0, 8, 13)), 1200); }
  },

  // -------------------------------------------------------- EINKAUFSSTRASSE
  strasse: {
    name: 'Die Einkaufsstraße', sky: 0x8fd3ff, ground: 0x9a9a9a, size: 36, need: 12, goalKind: 'bread', music: { scale: 'major', root: 330, bpm: 140, seed: 11 },
    build(l) {
      l.spawn.set(0, 1, 30); l.wallRing(36, 10, 0xc7c7c7);
      // Straße & Bürgersteige
      l.group.add(box(16, 0.06, 72, 0x5a5a5a, 0, 0.03, 0));
      for (let z = -34; z < 34; z += 6) l.group.add(box(0.6, 0.07, 3, 0xffffff, 0, 0.04, z));
      l.box(-18, 0, 0, 20, 0.5, 72, 0xbdbdbd); l.box(18, 0, 0, 20, 0.5, 72, 0xbdbdbd);
      // Läden
      const shops = [[-24, -24, 'Metzger', 0xe17055], [-24, -8, 'Bäcker', 0xfdcb6e], [-24, 10, 'Fischladen', 0x74b9ff], [24, -24, 'Café', 0xa29bfe], [24, -8, 'Döner', 0x55efc4], [24, 10, 'Imbiss', 0xff7675]];
      shops.forEach(([x, z, n, c]) => { l.box(x, 0.5, z, 12, 6, 12, c); l.box(x + (x < 0 ? 6.2 : -6.2), 0.5, z, 0.4, 3, 8, 0x3b2412); l.label(n, x, 7.5, z); });
      // Markise-Plattformen und Bänke
      [[-15.5, 2.8, -24], [-15.5, 2.8, -8], [15.5, 2.8, -8]].forEach(([x, y, z]) => l.box(x, y, z, 5, 0.3, 8, 0xffffff));
      [[-12, 20], [12, 20], [-12, -30], [12, -30]].forEach(([x, z]) => { l.box(x, 0.5, z, 3, 0.6, 1, 0x7a4a1f); l.box(x, 1.1, z + 0.4, 3, 0.5, 0.2, 0x7a4a1f); });
      // Mülleimer (Treppen) und Autos
      [[-10, 0], [10, 0]].forEach(([x, z]) => l.deco(cyl(0.7, 0.6, 1.4, 0x2d3436, x, 0.7, z, 10), x, 0.7, z));
      [[-4, -20, 0xd63031], [4, 12, 0x0984e3]].forEach(([x, z, c]) => { l.box(x, 0, z, 4, 1.4, 7, c); l.box(x, 1.4, z, 3.2, 1.1, 4, 0x3b2412); });
      // Essensreste (12 Ziele)
      [[-24, 3.3, -24, 'sausage'], [-24, 3.3, -8, 'bread'], [-12, 1.2, 20, 'bread'], [12, 1.2, 20, 'sausage'], [-4, 2.7, -20, 'bread'], [4, 2.7, 12, 'sausage'], [-12, 1.2, -30, 'fish'], [12, 1.2, -30, 'bread'], [15.5, 3.3, -8, 'sausage'], [-30, 0.8, 24, 'fish'], [30, 0.8, 24, 'bread'], [0, 0.3, -32, 'sausage']].forEach(([x, y, z, k]) => l.pickup(x, y, z, k, { goal: true }));
      for (let i = 0; i < 20; i++) l.pickup(rnd(-30, 30), 0.8, rnd(-30, 30), 'crumb');
      l.label('12 Essensreste finden – Vorsicht, Kater!', 0, 4, 26);
    },
    onGoal(l) { l.game.toast('Ein Fauchen vom Dach … DER KATER!'); setTimeout(() => l.setBoss(new Cat(l.game, 0, 0, 13)), 1000); }
  },

  // ----------------------------------------------------------------- BÜRO
  buero: {
    name: 'Das Büro', sky: 0xdfe6e9, ground: 0x636e72, size: 26, need: 6, goalKind: 'treat', music: { scale: 'dorian', root: 247, bpm: 112, seed: 21 },
    build(l) {
      l.spawn.set(0, 1, 18); l.wallRing(26, 6, 0xf5f6fa);
      // Teppich
      l.group.add(box(50, 0.04, 50, 0x4a6fa5, 0, 0.02, 0));
      // Schreibtische in Reihen, jede mit Schublade
      const desks = [];
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
        const x = -14 + c * 14, z = -12 + r * 11;
        l.box(x, 0, z, 6, 1.4, 3, 0xdcdde1); l.box(x + 1.8, 0, z, 2.2, 1.3, 2.8, 0xb2bec3);
        l.box(x - 1, 1.4, z - 0.6, 1.6, 1.0, 0.2, 0x2d3436); // Monitor
        l.box(x + 2.2, 0, z + 3, 1.4, 1.0, 1.4, 0x2d3436); // Stuhl
        desks.push({ x, z });
      }
      // Schubladen: 6 mit Leckerli, 3 leer
      desks.forEach((d, i) => {
        const drawer = box(1.6, 0.4, 0.2, 0x636e72, d.x + 1.8, 1.0, d.z + 1.5); l.group.add(drawer);
        l.interactable(d.x + 1.8, 1, d.z + 1.5, 1.5, it => {
          l.game.audio.sfx('drawer'); drawer.position.z += 0.8; drawer.scale.z = 6;
          if (i !== 2 && i !== 4 && i !== 7) { l.pickup(d.x + 1.8, 1.5, d.z + 2.2, 'treat', { goal: true }); l.game.toast('Leckerli in der Schublade!'); }
          else l.game.toast('Nur Büroklammern. Bäh.');
        }, 'SCHUBLADE: BISS');
      });
      // Aktenschrank-Treppe + Regal mit Krümeln
      l.box(-22, 0, -20, 3, 1.5, 3, 0x95a5a6); l.box(-22, 0, -16, 3, 3, 3, 0x95a5a6); l.box(-22, 0, -12, 3, 4.5, 3, 0x95a5a6);
      l.pickup(-22, 5, -12, 'bone', { value: 5 });
      // Kantine: Dose
      l.box(22, 0, 18, 6, 0.8, 6, 0xd63031); l.label('Kantine', 22, 3.5, 18);
      for (let i = 0; i < 16; i++) l.pickup(rnd(-22, 22), 0.3, rnd(-22, 22), 'crumb');
      l.label('6 Leckerli in Schubladen – beiß dran!', 0, 4, 16);
    },
    onGoal(l) { l.game.toast('Aus der Kantine: ein Klappern. DER DOSENÖFFNER!'); setTimeout(() => { const b = new CanOpener(l.game, 10, 8); l.group.add(b.can); l.setBoss(b); }, 1000); }
  },

  // -------------------------------------------------------- GRILLPARK (Schleichen)
  park: {
    name: 'Der Grillpark', sky: 0xa7e8ff, ground: 0x58b04f, size: 36, need: 10, goalKind: 'sausage', music: { scale: 'major', root: 220, bpm: 96, seed: 5, swing: 0.1 },
    build(l) {
      l.spawn.set(-28, 1, 28); l.wallRing(36, 4, 0x6b8e23);
      // Weg
      const path = [{ x: -20, z: 20 }, { x: -20, z: -10 }, { x: 0, z: -20 }, { x: 20, z: -10 }, { x: 20, z: 15 }, { x: 0, z: 22 }];
      for (let i = 0; i < path.length; i++) { const a = path[i], b = path[(i + 1) % path.length]; const n = 8; for (let k = 0; k < n; k++) l.group.add(box(2.5, 0.05, 2.5, 0xc9b58c, a.x + (b.x - a.x) * k / n, 0.03, a.z + (b.z - a.z) * k / n)); }
      // Büsche zum Verstecken, Bäume, Grills
      [[-14, 14], [-24, 4], [-12, -14], [8, -14], [24, 0], [14, 12], [-4, 10], [8, 20], [-22, -20], [26, -22]].forEach(([x, z]) => l.bush(x, z, 2.6));
      [[-30, -30], [30, -30], [30, 30], [-10, -28], [12, -30], [-32, 10]].forEach(([x, z]) => l.tree(x, z, 1.6));
      [[-6, -6], [6, 6]].forEach(([x, z]) => { l.box(x, 0, z, 2, 1.2, 1.2, 0x2d3436); l.deco(box(2.2, 0.1, 1.4, 0x636e72), x, 1.25, z); });
      // Der dicke Mann
      l.addEnemy(new FatMan(l.game, path, (x, z) => { l.pickup(x, 0.3, z, 'sausage', { goal: true }); l.game.audio.sfx('collect'); }));
      for (let i = 0; i < 10; i++) l.pickup(rnd(-30, 30), 0.3, rnd(-30, 30), 'crumb');
      l.label('Folge ihm leise. Sammle, was er verliert. Büsche = Versteck.', -20, 4, 26);
    },
    onGoal(l) { l.game.toast('Seine Tüte ist leer – und er hat nichts gemerkt!'); l.spawnGoldbone(0, 1, 0); }
  },

  // ---------------------------------------------------------------- HAFEN
  hafen: {
    name: 'Der Hafen', sky: 0x74b9ff, ground: 0x1e90ff, size: 36, need: 8, goalKind: 'fish', music: { scale: 'mixo', root: 262, bpm: 124, seed: 42 },
    build(l) {
      l.spawn.set(0, 2.5, 26);
      // Kai (Holz) – alles darunter ist Wasser
      l.box(0, 0, 10, 50, 2, 36, 0x8d6e4a); l.box(-26, 0, -14, 14, 2, 20, 0x8d6e4a); l.box(20, 0, -16, 20, 2, 16, 0x8d6e4a);
      l.box(0, 0, -20, 6, 2, 30, 0x8d6e4a); // Steg
      // Kisten-Stapel (Verstecke) und Kran
      const crates = [[-10, 2, 4], [-7, 2, 4], [-8.5, 4.5, 4], [12, 2, 12], [15, 2, 12], [12, 2, 15], [13.5, 4.5, 13.5], [-20, 2, -10], [-20, 4.5, -10], [-20, 7, -10], [24, 2, -18], [20, 2, -22]];
      crates.forEach(([x, y, z]) => l.box(x, y, z, 2.5, 2.5, 2.5, 0xc0905a));
      l.box(28, 2, 0, 2, 14, 2, 0xf1c40f); l.box(24, 14, -4, 12, 1, 1.4, 0xf1c40f); // Kran
      l.box(-20, 2, 20, 8, 1.6, 8, 0x2d3436); // Poller-Plattform
      [[-16, 2, 0], [-16, 2, 20], [16, 2, 0], [16, 2, 20]].forEach(([x, y, z]) => l.deco(cyl(0.5, 0.6, 1.2, 0x2d3436, x, y + 0.6, z, 8), x, y + 0.6, z));
      // Boot
      l.box(0, 1.2, -36, 8, 1.5, 5, 0xd63031); l.box(0, 2.7, -36, 1, 6, 1, 0xffffff);
      l.deco(box(5, 0.2, 5, 0xffffff), 0, 6, -36);
      // Versteckte Fische (per Nase) – hinter Kisten, auf Kran, im Boot
      [[-8.5, 7.2, 4], [13.5, 7.2, 13.5], [-20, 9.7, -10], [22, 2.3, -22], [19, 15.3, -4], [-20, 3.8, 20], [0, 2.9, -36], [-30, 2.3, -22]].forEach(([x, y, z]) => l.pickup(x, y, z, 'fish', { goal: true, hidden: true }));
      for (let i = 0; i < 14; i++) l.pickup(rnd(-22, 22), 2.3, rnd(-6, 26), 'crumb');
      l.label('Die Möwe hat 8 Fische versteckt. Halte NASE gedrückt!', 0, 6, 20);
      // Möwe kreist zur Deko
      l.gull = new BirdBoss(l.game, 'seagull', 0, 0, 'Die Möwe'); l.gull.decor = true; l.group.add(l.gull.mesh);
    },
    update(l, dt) {
      if (l.gull && !l.gullActive) { const g = l.gull; g.t += dt; g.mesh.position.set(Math.cos(g.t * 0.5) * 20, 12 + Math.sin(g.t) * 2, Math.sin(g.t * 0.5) * 20); g.mesh.rotation.y = -g.t * 0.5 + Math.PI; g.mesh.userData.wings.forEach((w, i) => w.rotation.z = Math.sin(g.t * 10) * 0.5 * (i ? -1 : 1)); }
      // ins Wasser gefallen?
      if (l.game.player.pos.y < 1.5) { l.game.toast('Platsch! Nass bis auf die Knochen.'); l.game.player.hurt(1); l.game.player.respawn(); }
    },
    onGoal(l) { l.game.toast('KREEEE! Die Möwe will ihre Beute zurück!'); l.gullActive = true; l.group.remove(l.gull.mesh); setTimeout(() => { const b = new BirdBoss(l.game, 'seagull', 0, 10, 'Die Möwe'); b.pos.y = 8; l.setBoss(b); }, 1000); }
  },

  // ----------------------------------------------------------------- DORF
  dorf: {
    name: 'Das Dorf', sky: 0xffe0a3, ground: 0x9ccc65, size: 36, need: 8, goalKind: 'bread', music: { scale: 'major', root: 294, bpm: 126, seed: 77, swing: 0.09 },
    build(l) {
      l.spawn.set(0, 1, 28); l.wallRing(36, 5, 0xa1887f);
      // Marktplatz
      l.group.add(box(24, 0.05, 24, 0xbcaaa4, 0, 0.03, 0)); l.deco(cyl(2.5, 2.8, 1.2, 0x90a4ae, 0, 0.6, 0, 12), 0, 0.6, 0); l.deco(cyl(0.4, 0.4, 3, 0x90a4ae, 0, 2.5, 0, 8), 0, 2.5, 0); // Brunnen
      // Häuser mit Dächern (begehbar über Fässer/Karren)
      const houses = [[-24, -20, 0xffccbc], [-24, 0, 0xc5e1a5], [-24, 20, 0xb3e5fc], [24, -20, 0xfff59d], [24, 0, 0xd1c4e9], [24, 20, 0xffab91], [-8, -28, 0xf8bbd0], [10, -28, 0xb2dfdb]];
      houses.forEach(([x, z, c]) => { l.box(x, 0, z, 10, 5, 10, c); l.box(x, 5, z, 10.5, 0.4, 10.5, 0x8d6e63); l.deco(cone(7.5, 3.5, 0xb71c1c, 0, 0, 0, 4), x, 7.1, z, Math.PI / 4); });
      // Aufstiege: Fässer + Karren
      [[-18, -20], [18, 0], [-14, -28]].forEach(([x, z]) => { l.box(x, 0, z, 2, 1.6, 2, 0x795548); l.box(x + (x < 0 ? -2.3 : 2.3), 0, z, 2, 3.2, 2, 0x795548); });
      l.box(16, 0, 20, 4, 1.5, 3, 0x6d4c41); l.box(16, 1.5, 21, 4, 1.5, 1, 0x6d4c41); // Karren
      // Marktstände
      [[-8, 8], [8, 8], [-8, -8], [8, -8]].forEach(([x, z]) => { l.box(x, 0, z, 4, 1.2, 2, 0x8d6e63); l.box(x, 3.2, z, 4.6, 0.2, 3, (x + z) % 16 ? 0xef5350 : 0x42a5f5); });
      // Versteckte Brote (Tauben-Verstecke): auf Dächern, unter Ständen, im Brunnen
      [[-24, 5.6, -20, 'bread'], [24, 5.6, 0, 'bread'], [-8, 5.6, -28, 'bread'], [-8, 1.5, 8, 'bread'], [8, 1.5, -8, 'bread'], [0, 1.5, 0, 'bread'], [16, 3.3, 20, 'bread'], [30, 0.3, 30, 'bread']].forEach(([x, y, z, k]) => l.pickup(x, y, z, k, { goal: true, hidden: true }));
      // Taubenschwärme
      [[-12, 0], [12, 12], [0, -14], [14, -10]].forEach(([x, z]) => l.addEnemy(new Pigeon(l.game, x, z)));
      for (let i = 0; i < 16; i++) l.pickup(rnd(-30, 30), 0.3, rnd(-30, 30), 'crumb');
      l.label('Die Tauben haben 8 Brote versteckt. NASE benutzen, Tauben beißen!', 0, 5, 24);
    },
    onGoal(l) { l.game.toast('Von der Kirchturmspitze: GURR! Die Obertaube!'); setTimeout(() => { const b = new BirdBoss(l.game, 'pigeon', 0, 0, 'Die Obertaube'); b.mesh.scale.setScalar(2.2); b.radius = 1.8; l.setBoss(b); }, 1000); }
  },

  // ---------------------------------------------------------------- KANAL
  kanal: {
    name: 'Der Kanal', sky: 0x2f3542, ground: 0x3d3d3d, size: 26, need: 6, goalKind: 'cheese', fogNear: 15, fogFar: 60, music: { scale: 'minor', root: 196, bpm: 120, seed: 13 },
    build(l) {
      l.spawn.set(-12, 2, 20); l.wallRing(26, 8, 0x57606f);
      // Abwasserrinne in der Mitte, Gehwege links/rechts
      l.group.add(box(10, 0.05, 52, 0x2e5d3a, 0, 0.03, 0));
      l.box(-12, 0, 0, 14, 1, 52, 0x747d8c); l.box(12, 0, 0, 14, 1, 52, 0x747d8c);
      // Rohre als Brücken
      [[-10], [4], [16]].forEach(([z]) => { const p = cyl(0.9, 0.9, 10, 0x8395a7, 0, 1.4, z, 10); p.rotation.z = Math.PI / 2; l.deco(p, 0, 1.4, z); l.solids.push({ min: { x: -5, y: 0.5, z: z - 0.7 }, max: { x: 5, y: 2.1, z: z + 0.7 }, active: true }); });
      // Laternen
      [[-18, -20], [18, -20], [-18, 0], [18, 0], [-18, 20], [18, 20]].forEach(([x, z]) => { l.box(x, 1, z, 0.4, 5, 0.4, 0x2f3542); const lamp = new THREE.PointLight(0x9ad7ff, 1.2, 14); lamp.position.set(x, 6.2, z); l.scene.add(lamp); l.deco(sphere(0.5, 0x9ad7ff, x, 6.2, z, 6), x, 6.2, z); });
      // Käse (die Ratte hortet)
      [[-16, 1.3, -22], [16, 1.3, -22], [-10, 1.3, 10], [10, 1.3, -6], [0, 2.4, 4], [16, 1.3, 22]].forEach(([x, y, z]) => l.pickup(x, y, z, 'cheese', { goal: true }));
      for (let i = 0; i < 12; i++) l.pickup(rnd(-22, 22), 1.3, rnd(-22, 22), 'crumb');
      l.label('Käse sammeln. Hier unten wohnt etwas Großes …', 0, 4, 18);
    },
    update(l) { if (l.game.player.pos.y < 0.6 && Math.abs(l.game.player.pos.x) < 5) { l.game.toast('Igitt – Kanalbrühe!'); l.game.player.hurt(1); l.game.player.respawn(); } },
    onGoal(l) { l.game.toast('Rote Augen im Dunkeln. DIE KANALRATTE!'); setTimeout(() => l.setBoss(new RatBoss(l.game, 0, -4)), 1000); }
  },
};
