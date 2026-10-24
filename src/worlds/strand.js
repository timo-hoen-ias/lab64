// Die Badebucht: Strand mit Promenade, Dünen, Pier mit Riesenrad, Sandbank, Korallenriff, Wrack und Leuchtturm-Insel.
// Meeresgrund bei y = -12, Wasser bei y = 0, das Land sind große Hügel. Fähigkeit dieser Welt: Tauchen (Taucherbrille am Eingang).
import * as THREE from 'three';
import { Crab, BeachCrab, Jelly } from '../bosses.js';
import { box, cyl, cone, sphere, makeLabel, makeClam, makeNpcDog, animateDog } from '../models.js';
import { FX, toonGradient } from '../fx.js';

const SAND = 0xf2dca2, WET = 0xd9c084, ROCK = 0x9a9183;

// Strandkorb als Schnellreise-Punkt
function strandkorb() {
  const g = new THREE.Group();
  g.add(box(1.8, 0.5, 1.2, 0xffffff, 0, 0.25, 0)); g.add(box(1.8, 1.6, 0.25, 0x3fa9f5, 0, 1.3, -0.5));
  g.add(box(0.2, 1.2, 1.2, 0x3fa9f5, -0.9, 1.1, 0)); g.add(box(0.2, 1.2, 1.2, 0x3fa9f5, 0.9, 1.1, 0));
  const roof = box(1.9, 0.25, 1.3, 0xffffff, 0, 2.2, -0.15); roof.rotation.x = -0.3; g.add(roof);
  for (let i = 0; i < 4; i++) g.add(box(0.12, 1.61, 0.02, 0xffffff, -0.6 + i * 0.4, 1.3, -0.36));
  return g;
}
function umbrella(color) {
  const g = new THREE.Group(); g.add(cyl(0.05, 0.05, 2.6, 0xffffff, 0, 1.3, 0, 6));
  const top = cone(1.4, 0.6, color, 0, 2.7, 0, 8); g.add(top); return g;
}
function palm(h = 6) {
  const g = new THREE.Group();
  for (let i = 0; i < 6; i++) { const s = cyl(0.25 - i * 0.02, 0.28 - i * 0.02, h / 6, 0x9c7a4a, Math.sin(i * 0.4) * 0.3, h / 12 + i * h / 6, 0, 6); s.rotation.z = -0.06 * i; g.add(s); }
  for (let i = 0; i < 6; i++) { const l = box(0.6, 0.08, 2.6, i % 2 ? 0x4caf50 : 0x3e9a45, 0, 0, 1.2); const p = new THREE.Group(); p.add(l); p.position.set(Math.sin(2.4) * 0.3, h, 0); p.rotation.set(0.5, i / 6 * Math.PI * 2, 0); g.add(p); }
  g.userData.sway = true; return g;
}
function coral(color, h) { const g = new THREE.Group(); for (let i = 0; i < 4; i++) { const c = cyl(0.12, 0.2, h * (0.6 + Math.random() * 0.5), color, (Math.random() - 0.5) * 0.8, 0, (Math.random() - 0.5) * 0.8, 6); c.position.y = c.geometry.parameters.height / 2; c.rotation.z = (Math.random() - 0.5) * 0.6; g.add(c); g.add(sphere(0.22, color, c.position.x, c.geometry.parameters.height, c.position.z, 6)); } return g; }
function seaweed(h) { const g = new THREE.Group(); for (let i = 0; i < 3; i++) { const s = box(0.15, h, 0.05, 0x2e8b57, (i - 1) * 0.25, h / 2, 0); s.rotation.y = i; g.add(s); } g.userData.weed = true; return g; }

export const STRAND = {
  name: 'Die Badebucht', time: 'mittag', prints: 0xa8874f, backdrop: 'meer', sky: 0x6ec9ff, ground: 0xc9b27a, floorY: -12, killY: -40,
  size: 150, need: 8, goalKind: 'fries', camFloor: -Infinity, grass: [0xb8c66a, 0x9fb558, 0xc9d17a], waterFog: 0x1aa0c8, waterView: 42,
  music: { scale: 'major', root: 262, bpm: 112, seed: 64, swing: 0.12, style: 'beach' },
  build(l) {
    const g = l.game, H = (x, z) => Math.max(l.heightAt(x, z), -12);
    l.spawn.set(0, 6.5, -128); l.spawnYaw = 0;
    l.sea(0, 0x2bb3e8);

    // ---- Land: Bucht, Promenade, Dünen, Sandbank mit Furt, Felsinsel
    l.hill(0, -100, 150, 14, { rz: 62, flat: 0.55, y0: -12, color: SAND, side: WET });
    l.hill(0, -133, 125, 4, { rz: 20, flat: 0.72, y0: 2, color: 0xe3d2b0, side: 0xcbb68c }); // Promenade
    [[-112, -118, 14, 6], [-86, -142, 12, 5], [-132, -94, 10, 4], [-100, -92, 9, 3.5], [-70, -112, 8, 3]].forEach(([x, z, r, h]) => l.hill(x, z, r, h, { flat: 0.2, y0: 2, color: 0xf5e2ad, side: 0xe8cf91 }));
    [[-40, -46], [-40, -26], [-40, -7], [-40, 11]].forEach(([x, z]) => l.hill(x, z, 12, 11.8, { flat: 0.5, y0: -12, color: WET, side: WET })); // Furt zur Sandbank (knietief)
    l.hill(-40, 32, 20, 12.6, { flat: 0.62, y0: -12, color: SAND, side: WET }); // Sandbank (Boss-Arena)
    l.hill(100, 0, 22, 16, { flat: 0.45, y0: -12, color: ROCK, side: 0x7d756a }); // Felsinsel
    [[55, 55, 9, 6], [80, 75, 7, 5], [65, 95, 8, 4], [105, 60, 6, 6]].forEach(([x, z, r, h]) => l.hill(x, z, r, h, { flat: 0.3, y0: -12, color: 0xc78f6a, side: 0xa8745a })); // Riff-Felsen

    // ---- Promenade: Kiosk, Rettungsschwimmer mit Taucherbrille, Schilder
    l.zone(0, -128, 60, () => {
      l.box(-30, 6, -134, 9, 4, 6, 0xffffff); l.box(-30, 10, -134, 10, 0.4, 7, 0xe74c3c);
      l.deco(box(9.2, 0.5, 0.4, 0xffd34d), -30, 9, -130.9); const sign = makeLabel('POMMES · EIS'); sign.scale.set(5, 1.2, 1); l.deco(sign, -30, 11.6, -131);
      [[-24, 6, -129], [-22, 7.3, -131], [-24.5, 8.6, -133]].forEach(([x, y, z]) => l.box(x, y, z, 1.6, 1.3, 1.6, 0xc0905a)); // Kistenstapel aufs Kioskdach
      l.pickup(-30, 10.7, -134, 'fries', { goal: true });
      for (let x = -110; x <= 110; x += 10) { l.deco(cyl(0.12, 0.12, 3.2, 0x2d3436, 0, 0, 0, 6), x, 7.6, -122); l.deco(sphere(0.35, 0xfff3a0, 0, 0, 0, 8), x, 9.3, -122); } // Laternen
      const lg = makeNpcDog(0xd9a441, 0xe74c3c); l.deco(lg, 7, 6, -121, Math.PI); l.lifeguard = lg;
      const s1 = makeLabel('Rettungsschwimmer Rex'); s1.scale.set(5, 1.2, 1); l.deco(s1, 7, 9, -121);
      l.abilityItem(4, 7, -118, 'tauchen', 'TAUCHERBRILLE! Im Wasser NASE halten = tauchen, SPRUNG = hoch. Achte auf die Luft!');
      l.trigger(4, 6, -120, 7, () => g.toast(g.has('tauchen') ? 'Rex: „Viel Spaß im Wasser! Fordere mich am Strand zum Wettschwimmen heraus!“' : 'Rex: „Nimm die Taucherbrille – unter Wasser liegen die besten Sachen!“', 5000), false);
      l.warp(14, 6, -128, 'Promenade', strandkorb());
    });

    // ---- Strand: Schirme, Liegen, Sandburg mit Burg-Bauer, Krabben, Palmen
    l.zone(0, -75, 90, () => {
      [[-60, -78, 0xe74c3c], [-20, -80, 0xfeca57], [10, -74, 0x48dbfb], [-75, -95, 0xff9ff3], [85, -82, 0x1dd1a1], [-5, -98, 0xff7675]].forEach(([x, z, c]) => { l.deco(umbrella(c), x, H(x, z), z); l.box(x + 1.8, H(x, z), z, 1.2, 0.35, 2.6, 0xffffff); });
      [[-95, -80], [-50, -105], [40, -100], [95, -95], [120, -70], [-120, -70]].forEach(([x, z]) => l.deco(palm(6 + Math.random() * 2), x, H(x, z), z));
      // Sandburg: Stufen zum Erklimmen, Pommes ganz oben
      const bx = 25, bz = -80, by = H(bx, bz);
      l.box(bx, by, bz, 8, 1.5, 8, 0xe8cf91); l.box(bx, by + 1.5, bz, 5.5, 1.5, 5.5, 0xe8cf91); l.box(bx, by + 3, bz, 3, 1.5, 3, 0xe8cf91);
      [[-4, -4], [4, -4], [-4, 4], [4, 4]].forEach(([dx, dz]) => { l.box(bx + dx, by, bz + dz, 1.6, 3.2, 1.6, 0xdcc07e); l.deco(cone(1, 1, 0xe74c3c, 0, 0, 0, 6), bx + dx, by + 3.7, bz + dz); });
      l.box(bx - 5, by, bz, 2, 0.8, 2, 0xe8cf91); // Treppenstufe
      l.pickup(bx, by + 4.8, bz, 'fries', { goal: true });
      const bauer = makeNpcDog(0xf5f0e1, 0x1dd1a1); l.deco(bauer, bx - 7, by, bz + 3, Math.PI / 2);
      const s2 = makeLabel('Burg-Bauer Bello'); s2.scale.set(5, 1.2, 1); l.deco(s2, bx - 7, by + 3, bz + 3);
      l.shellsHave = 0;
      l.interactable(bx - 7, by, bz + 3, 1.8, it => {
        if (l.game.hasBone('strand', 'sandburg')) { g.toast('Bello: „Danke nochmal für die Muscheln!“'); it.used = false; return; }
        if (l.shellsHave >= 5) { g.toast('Bello: „Fünf Muscheln! Meine Burg ist perfekt!“'); l.spawnGoldbone(bx - 7, by + 1, bz + 5, 'sandburg'); }
        else { g.toast(`Bello: „Bring mir 5 Muscheln für die Burg!“ (${l.shellsHave}/5)`, 3500); it.used = false; }
      }, 'BISS = reden');
      // Muscheln: Strand, Dünen, unter dem Pier, Riff, Insel
      [[-55, -60], [-120, -128], [62, -40], [70, 65], [106, 12]].forEach(([x, z]) => l.pickup(x, H(x, z) + 0.3, z, 'shell', { special: true, onTake: () => { l.shellsHave++; g.toast(`Muschel ${l.shellsHave}/5 – bring sie zu Bello`); }, onRestore: () => l.shellsHave++ }));
      [[-30, -70], [0, -66], [45, -72], [-65, -65], [80, -75]].forEach(([x, z]) => l.addEnemy(new BeachCrab(g, x, z)));
      l.warp(-80, 2, -70, 'Weststrand', strandkorb());
    });

    // ---- Dünen: Geheim-Knochen und versteckte Pommes
    l.zone(-105, -115, 45, () => {
      l.goldbone('geheim', -96, H(-96, -104) + 0.5, -104, { hidden: true });
      l.pickup(-126, H(-126, -116) + 0.4, -116, 'fries', { goal: true, hidden: true });
      for (let i = 0; i < 30; i++) { const x = -140 + Math.random() * 80, z = -150 + Math.random() * 60; l.deco(seaweed(0.8), x, H(x, z), z); } // Strandhafer
    });

    // ---- Pier mit Riesenrad
    l.zone(60, -20, 70, () => {
      l.ramp(60, -86, 60, -78, 6, 2, 3, 0xb08355);
      l.box(60, 2, -26, 6, 1, 104, 0xb08355); // Steg von z -78 bis 26
      for (let z = -74; z <= 22; z += 8) [-2.6, 2.6].forEach(dx => l.deco(cyl(0.3, 0.3, 15, 0x7a5a3a, 0, 0, 0, 6), 60 + dx, -5.5, z));
      for (let z = -78; z <= 26; z += 2) [-3, 3].forEach(dx => l.deco(box(0.12, 1, 0.12, 0xffffff), 60 + dx, 3.5, z));
      l.box(60, 2, 34, 18, 1, 16, 0xb08355); // Plattform
      l.pickup(57.5, H(57.5, -62) + 0.4, -62, 'fries', { goal: true }); // unterm Pier im flachen Wasser
      // Riesenrad (steht still): 24 Gondeln im Kreis = Kletterweg nach oben
      const cx = 60, cy = 17, cz = 38, R = 12, wheel = new THREE.Group(); wheel.position.set(cx, cy, cz);
      wheel.add(new THREE.Mesh(new THREE.TorusGeometry(R, 0.3, 6, 48), new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: toonGradient() })));
      for (let i = 0; i < 12; i++) { const sp = box(0.2, R * 2, 0.2, 0xff7675); sp.rotation.z = i / 12 * Math.PI; wheel.add(sp); }
      l.group.add(wheel); [-1, 1].forEach(s => { const leg = box(0.6, 17, 0.6, 0x636e72, s * 4, -8.5, -0.8); leg.rotation.z = s * 0.25; wheel.add(leg); });
      const cols = [0xe74c3c, 0xfeca57, 0x48dbfb, 0x1dd1a1, 0xff9ff3, 0xa29bfe];
      for (let i = 0; i < 24; i++) {
        const a = -Math.PI / 2 + i / 24 * Math.PI * 2, x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R;
        if (y < 4.5) continue; l.box(x, y - 0.4, cz - 1.6, 2.4, 0.4, 2.2, cols[i % cols.length]);
      }
      l.goldbone('riesenrad', cx, cy + R + 0.6, cz - 1.6);
      l.pickup(cx - R, cy + 0.6, cz - 1.6, 'fries', { goal: true });
      l.box(cx + 2.5, 3, cz - 6, 2, 1.6, 2, 0xc0905a); // Einstieg zur untersten Gondel
      l.warp(60, 3, -70, 'Pier', strandkorb());
    });

    // ---- Sandbank (Boss-Arena) mit Leuchtfeuer
    l.zone(-40, 20, 40, () => {
      l.deco(umbrella(0xe74c3c), -50, 0.6, 38); l.deco(palm(5), -30, 0.6, 42);
      const flag = cyl(0.08, 0.08, 4, 0xffffff, 0, 2, 0, 6); l.deco(flag, -40, 0.6, 32); l.deco(box(1.4, 0.9, 0.05, 0xe74c3c), -39.3, 4.1, 32);
    });

    // ---- Korallenriff: Riesenmuscheln, Ringe, Quallen, Luftblasen
    l.zone(75, 75, 55, () => {
      for (let i = 0; i < 40; i++) { const x = 30 + Math.random() * 90, z = 35 + Math.random() * 80, y = H(x, z); if (y > -2) continue; l.deco(Math.random() < 0.6 ? coral([0xff7675, 0xfd79a8, 0xfdcb6e, 0xa29bfe, 0x55efc4][i % 5], 1 + Math.random() * 1.5) : seaweed(2 + Math.random() * 2), x, y, z); }
      l.clamsOpen = 0;
      [[45, 70], [70, 50], [90, 90], [110, 80], [60, 110]].forEach(([x, z], i) => {
        const y = H(x, z), c = makeClam(); l.deco(c, x, y + 0.3, z, i);
        l.interactable(x, y + 0.5, z, 2, () => {
          c.userData.lid.rotation.x = -0.9; l.clamsOpen++; g.audio.sfx('collect'); FX.crumb(g.fx, { x, y: y + 1, z });
          g.player.air = g.player.airMax; g.toast(`Muschel offen – Luft getankt! (${l.clamsOpen}/5)`);
          if (l.clamsOpen === 5) l.spawnGoldbone(x, y + 2, z, 'muscheln');
        });
      });
      l.ringCourse([[40, -5, 40], [55, -8, 52], [72, -7, 62], [88, -9, 58], [100, -6, 46]], 'ringe', 14);
      [[50, -6, 85], [75, -5, 100], [95, -7, 70], [35, -6, 60]].forEach(([x, y, z]) => l.addEnemy(new Jelly(g, x, y, z)));
      [[40, 50], [85, 80], [62, 100]].forEach(([x, z]) => l.airBubbles(x, H(x, z), z, -H(x, z)));
      l.pickup(78, H(78, 88) + 0.4, 88, 'fries', { goal: true });
      for (const [x, z] of [[48, 92], [95, 52], [70, 80], [102, 100], [38, 75], [58, 62]]) l.pickup(x, H(x, z) + 0.4, z, 'crumb');
    });

    // ---- Schiffswrack: innen tauchen, Schatztruhe
    l.zone(-80, 80, 35, () => {
      const y = -12, wood = 0x6d4c2f;
      l.box(-80, y, 73, 24, 6, 1, wood); l.box(-80, y, 87, 24, 4.5, 1, wood); // Bordwände (eine eingebrochen)
      l.box(-92.5, y, 80, 1, 6, 15, wood); l.box(-67.5, y, 80, 1, 3, 15, wood); // Heck ganz, Bug eingebrochen
      l.box(-86, y + 6, 80, 12, 0.5, 15, 0x7a5a3a); // halbes Deck
      const mast = cyl(0.4, 0.4, 16, wood, 0, 0, 0, 6); mast.rotation.z = 1.1; l.deco(mast, -72, -6, 92);
      l.airBubbles(-75, y, 80, 12); l.airBubbles(-88, y, 80, 6);
      const chest = new THREE.Group(); chest.add(box(1.6, 0.9, 1, 0x8e5b2e, 0, 0.45, 0)); const lid = box(1.6, 0.35, 1, 0xa0692f, 0, 1.05, 0); chest.add(lid); chest.add(box(0.3, 0.3, 0.1, 0xffd34d, 0, 0.8, 0.52));
      l.deco(chest, -84, y, 82);
      l.interactable(-84, y, 82, 1.8, () => { lid.position.set(0, 1.3, -0.4); lid.rotation.x = -1; g.audio.sfx('big'); l.spawnGoldbone(-84, y + 1.6, 82, 'schatz'); }, 'BISS = Truhe öffnen');
      l.pickup(-88, y + 0.4, 77, 'fries', { goal: true });
      for (const [x, z] of [[-76, 76], [-82, 85], [-90, 84]]) l.pickup(x, y + 0.4, z, 'crumb');
    });

    // ---- Felsinsel mit Leuchtturm: außen Wendeltreppe hoch
    l.zone(100, 0, 40, () => {
      const top = H(100, 0);
      l.box(100, top, 0, 4.4, 18, 4.4, 0xffffff, { cam: true });
      for (let i = 0; i < 6; i++) l.deco(cyl(2.35, 2.35, 1.5, 0xe74c3c, 0, 0, 0, 12), 100, top + 1.5 + i * 3, 0);
      l.deco(cyl(2.6, 2.6, 0.4, 0x2d3436, 0, 0, 0, 12), 100, top + 18.25, 0); l.deco(sphere(1.2, 0xfff3a0, 0, 0, 0, 10), 100, top + 19.6, 0);
      for (let i = 0; i < 12; i++) { const a = i * 0.62, r = 3.8; l.box(100 + Math.cos(a) * r, top + 1.1 + i * 1.45, Math.sin(a) * r, 2, 0.4, 2, 0x95a5a6); }
      l.box(100, top + 18, 0, 6, 0.4, 6, 0x95a5a6);
      l.goldbone('leuchtturm', 100, top + 19, 2.5);
      l.pickup(112, H(112, 10) + 0.4, 10, 'fries', { goal: true });
      l.warp(88, H(88, -8), -8, 'Insel', strandkorb());
      const flag = cyl(0.08, 0.08, 3, 0xffffff, 0, 1.5, 0, 6); l.deco(flag, 86, H(86, 4), 4); l.deco(box(1.2, 0.8, 0.05, 0x1dd1a1), 86.6, H(86, 4) + 2.6, 4);
    });

    // ---- Wettschwimmen mit Rex: vom Strand zur Inselflagge
    const rex = makeNpcDog(0xd9a441, 0xe74c3c); l.deco(rex, 40, H(40, -66), -66, 0); l.rex = { mesh: rex, state: 'wait', path: [[40, -66], [70, -30], [86, 4]], i: 0 };
    l.interactable(40, H(40, -66), -66, 2, it => {
      it.used = false; if (l.rex.state !== 'wait' || g.hasBone('strand', 'rennen')) return;
      if (!g.has('tauchen')) { g.toast('Rex: „Hol dir erst die Taucherbrille an der Promenade!“'); return; }
      l.rex.state = 'race'; l.rex.i = 0; g.toast('Rex: „Wettschwimmen zur Inselflagge! Los!“ (Tipp: Der Pier ist schneller)', 4000); g.audio.sfx('portal');
    }, 'BISS = Wettschwimmen');
    l.trigger(86, H(86, 4), 4, 3, () => { if (l.rex.state === 'race') { l.rex.state = 'lost'; g.toast('Gewonnen! Rex: „Du bist ja schneller als ein Seehund!“'); l.spawnGoldbone(86, H(86, 4) + 1, 6, 'rennen'); } }, false);

    // Krümel an Land
    l.scatter(45);
    l.label('Kneifer, die Riesenkrabbe, hat 8 Pommes geklaut! Hol dir zuerst die Taucherbrille bei Rex.', 0, 9, -120);
  },
  update(l, dt) {
    const g = l.game, pl = g.player;
    // Rex schwimmt beim Rennen die Wegpunkte ab
    const r = l.rex; if (r.state === 'race') {
      const [tx, tz] = r.path[r.i], p = r.mesh.position, dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz);
      if (d < 0.6) { r.i++; if (r.i >= r.path.length) { r.state = 'won'; g.toast('Rex war schneller! Sprich ihn am Strand nochmal an.', 3500); r.mesh.position.set(40, l.groundAt(40, -66, 30), -66); r.state = 'wait'; } }
      else { p.x += dx / d * 5 * dt; p.z += dz / d * 5 * dt; r.mesh.rotation.y = Math.atan2(dx, dz); }
      const wy = l.waterAt(p.x, p.z); p.y = wy !== null ? wy - 0.8 : l.groundAt(p.x, p.z, 30);
      animateDog(r.mesh, 1, false, dt, 0, 0, 0, wy !== null);
    } else animateDog(r.mesh, 0, false, dt);
    animateDog(l.lifeguard, 0, false, dt);
  },
  onGoal(l) {
    l.game.toast('KNACK KNACK! Kneifer, die Riesenkrabbe, kommt auf die Sandbank!', 4000);
    l.game.later(1500, () => { const b = new Crab(l.game, -40, 32, { x: -40, z: 62 }); l.setBoss(b); });
  },
};
