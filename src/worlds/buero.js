// Das Büro: ein Amt auf vier Ebenen, verbunden durch lange Treppen an den Außenwänden.
// EG Wartehalle mit Nummernautomat, Anzeigetafel und Schaltern (Schubladen, Kantine), 1. Stock Sitzungssaal + Kopierer
// + Amtsleitung (Raum), 2. Stock Aktenarchiv, Kaffeeküche und Fensterbänke, oben das Dach mit Landeplatz und Antennenmast.
import * as THREE from 'three';
import { CanOpener, Pigeon } from '../bosses.js';
import { box, cyl, sphere, makeSign, makeNpcDog, makeRoundTree } from '../models.js';

const WALL = 0xece2c6, SLAB = 0xb2bec3, STAIR = 0x7f8c8d, F1 = 12, F2 = 24, ROOF = 36, S = 32;

// Leuchtanzeige (rote LED-Schrift auf Schwarz), von beiden Seiten lesbar; setText() schreibt neu
function makeDisplay(text, w = 3, color = '#ff4d3d') {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128;
  const x = c.getContext('2d'), tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const draw = t => {
    x.fillStyle = '#111'; x.fillRect(0, 0, 512, 128);
    let size = 76; x.font = `700 ${size}px Courier New, monospace`;
    while (x.measureText(t).width > 480 && size > 16) { size -= 2; x.font = `700 ${size}px Courier New, monospace`; }
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.shadowColor = color; x.shadowBlur = 14; x.fillStyle = color; x.fillText(t, 256, 66);
    tex.needsUpdate = true;
  };
  draw(text);
  const g = new THREE.Group(), h = w / 4, mat = new THREE.MeshBasicMaterial({ map: tex });
  g.add(box(w + 0.16, h + 0.16, 0.14, 0x2d3436));
  [1, -1].forEach(s => { const f = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); f.position.z = s * 0.1; if (s < 0) f.rotation.y = Math.PI; g.add(f); });
  g.userData.setText = draw; return g;
}

export const BUERO = {
  name: 'Das Büro', surface: 'stone', time: 'abend', backdrop: 'stadt', sky: 0xdfe6e9, ground: 0x636e72, size: S, need: 6, goalKind: 'treat',
  music: { scale: 'dorian', root: 247, bpm: 112, seed: 21, style: 'office' },
  build(l) {
    const g = l.game, slab = (x0, x1, z0, z1, y, c = SLAB) => { const s = l.box((x0 + x1) / 2, y - 0.6, (z0 + z1) / 2, x1 - x0, 0.6, z1 - z0, c, { cam: true, dynamic: true }); s.mesh.castShadow = false; }; // Decken werfen keinen Schatten, sonst wäre es drinnen stockdunkel
    const md = (m, x, y, z, ry = 0) => { l.deco(m, x, y, z, ry); m.userData.merge = true; }; // Deko ohne Kollision, wird zu wenigen Meshes verbacken
    const crumbs = (y, pts) => pts.forEach(([x, z]) => l.pickup(x, y + 0.3, z, 'crumb'));
    l.spawn.set(0, 1, 18); l.wallRing(S, ROOF + 1.2, WALL);
    l.solids.slice(-4).forEach(w => { w.mesh.visible = false; w.mesh.userData.merge = false; }); // nur Kollision; sichtbar sind die Wände mit Fensterlöchern unten
    for (const y of [0, F1, F2]) for (const [x, z] of [[-14, -14], [14, -14], [-14, 14], [14, 14]]) l.deco(box(4, 0.15, 1, 0xfffbe6), x, y + 11.25, z); // Deckenlampen
    // Außenwände mit echten Glasfenstern: Pfeiler zwischen den Fenstern, Brüstung darüber, Scheiben aus durchsichtigem Glas.
    // Hinter Whiteboard und Amtsleitungs-Tür (Nordwand, 1. Stock) bleibt die Wand zu.
    const shut = (side, f, i) => side === 0 && f === 1 && (i === 0 || i === 1);
    const wallPiece = (side, a0, a1, y0, y1) => { const len = a1 - a0, c = (a0 + a1) / 2, h = y1 - y0, m = side < 2 ? box(len, h, 1, WALL) : box(1, h, len, WALL); m.castShadow = false; md(m, side < 2 ? c : (side === 2 ? -S : S), y0 + h / 2, side < 2 ? (side === 0 ? -S : S) : c); };
    const panes = [];
    for (let side = 0; side < 4; side++) {
      const e = side < 2 ? S + 0.5 : S - 0.5; // Nord/Süd laufen über die Ecken, Ost/West stoßen innen an
      for (let f = 0; f < 3; f++) {
        const y = f * 12; let a = -e;
        for (let i = -3; i <= 3; i++) {
          if (shut(side, f, i)) continue;
          wallPiece(side, a, i * 8 - 2.5, y, y + 6); a = i * 8 + 2.5;
          const fx = side < 2 ? i * 8 : (side === 2 ? -S : S), fz = side < 2 ? (side === 0 ? -S : S) : i * 8, r = side < 2 ? 0 : Math.PI / 2;
          panes.push([fx, y + 3, fz, r]);
          md(box(5.2, 0.25, 1.1, 0xb2bec3), fx, y + 0.12, fz, r); md(box(5.2, 0.2, 1.1, 0xb2bec3), fx, y + 5.9, fz, r); md(box(0.18, 6, 0.3, 0xb2bec3), fx, y + 3, fz, r); // Rahmen, Sprosse
        }
        wallPiece(side, a, e, y, y + 6); wallPiece(side, -e, e, y + 6, y + 12.3); // ragt etwas in die Ebene darüber, damit keine Fläche mit der Decke zusammenfällt
      }
      wallPiece(side, -e, e, ROOF, ROOF + 1.2);
    }
    const glass = new THREE.InstancedMesh(new THREE.BoxGeometry(5, 5.6, 0.06), new THREE.MeshBasicMaterial({ color: 0xcfeeff, transparent: true, opacity: 0.16, depthWrite: false }), panes.length), o = new THREE.Object3D();
    panes.forEach(([x, y, z, r], k) => { o.position.set(x, y, z); o.rotation.set(0, r, 0); o.updateMatrix(); glass.setMatrixAt(k, o.matrix); });
    glass.renderOrder = 2; l.group.add(glass);
    // Draußen: Straße und Nachbarhäuser, damit man durch die Fenster in die Stadt schaut
    md(box(400, 0.2, 400, 0x7b7f84), 0, -0.2, 0); md(box(400, 0.05, 6, 0xdcdde1), 0, -0.07, 48); md(box(6, 0.05, 400, 0xdcdde1), 48, -0.07, 0);
    for (let k = 0; k < 16; k++) {
      const a = k / 16 * Math.PI * 2 + 0.2, d = 62 + (k * 37) % 25, w = 14 + (k * 7) % 10, h = 14 + (k * 23) % 44, x = Math.cos(a) * d, z = Math.sin(a) * d;
      const hb = box(w, h, w, [0xb8a99a, 0xa4b0be, 0xd1ccc0, 0x8395a7][k % 4]); hb.castShadow = false; md(hb, x, h / 2, z, a);
      for (let y = 4; y < h - 2; y += 5) { const st = box(w + 0.1, 1.6, w + 0.1, k % 3 ? 0x34495e : 0xf6e58d); st.castShadow = false; md(st, x, y, z, a); } // Fensterreihen
    }
    // Treppen: Ost EG→1, West 1→2, Ost 2→Dach (dünne Rampen, man kann drunter durch)
    l.ramp(28.5, 22, 28.5, -28, 4.5, 0, F1, STAIR, { bridge: true });
    l.ramp(-28.5, -28, -28.5, 28, 4.5, F1, F2, STAIR, { bridge: true });
    l.ramp(28.5, 28, 28.5, -28, 4.5, F2, ROOF, STAIR, { bridge: true });
    slab(-26, 26, -S, S, F1); slab(26, S, -S, -28, F1); slab(-S, -26, -S, -28, F1);
    slab(-26, 26, -S, S, F2); slab(-S, -26, 28, S, F2); slab(26, S, 28, S, F2);
    slab(-S, 26, -S, S, ROOF, 0x95a5a6); slab(26, S, -S, -28, ROOF, 0x95a5a6);
    [[30, 0, 'Treppe ↑ Sitzungssaal'], [-30, F1, 'Treppe ↑ Aktenarchiv'], [30, F2, 'Treppe ↑ Dach']].forEach(([x, y, t]) => { l.deco(makeSign(t, { w: 2.4, post: 1.2 }), x - Math.sign(x) * 4, y, x > 0 ? 18 : -18); });

    // ---- EG: Wartehalle mit Schaltern (Schubladen = Hauptziel), Aktenschrank, Kantine
    l.group.add(box(50, 0.04, 60, 0x9aa57a, 0, 0.02, 0)); // Linoleum, amtsgrün
    for (let i = -2; i <= 2; i++) md(box(50, 0.045, 0.3, 0x7f8c5e), 0, 0.05, i * 12); // Fugen im Linoleum
    const desks = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      const x = -14 + c * 14, z = -12 + r * 11;
      l.box(x, 0, z, 6, 1.4, 3, 0xdcdde1); l.box(x + 1.8, 0, z, 2.2, 1.3, 2.8, 0xb2bec3);
      l.box(x - 1, 1.4, z - 0.6, 1.6, 1.0, 0.2, 0x2d3436); l.box(x + 2.2, 0, z + 3, 1.4, 1.0, 1.4, 0x2d3436);
      desks.push({ x, z });
      // Aktenberge auf jedem Schalter, schief gestapelt; dazu die Schalternummer als Leuchtanzeige
      const n = r * 3 + c;
      for (let k = 0, hh = 1.4; k < 2 + (n * 5) % 4; k++) { const t = 0.25 + ((n + k) % 3) * 0.12; md(box(1.1, t, 0.8, k % 2 ? 0xfdfdf5 : 0xf5e9c8), x - 2.3 + Math.sin(n + k * 2) * 0.12, hh + t / 2, z + 0.7, Math.sin(n * 3 + k) * 0.25); hh += t; }
      l.deco(makeDisplay(String(n + 1), 0.9), x, 2.25, z - 1.55); md(box(0.08, 0.75, 0.08, 0x636e72), x, 1.75, z - 1.55); // Anzeige auf Stange
      md(cyl(0.25, 0.25, 0.08, 0x2d3436, 0, 0.04, 0, 10), x + 0.4, 1.44, z + 0.3); md(box(0.12, 0.35, 0.12, 0x6d4c41), x + 0.4, 1.66, z + 0.3); // Stempel
    }
    desks.forEach((d, i) => {
      const drawer = box(1.6, 0.4, 0.2, 0x636e72, d.x + 1.8, 1.0, d.z + 1.5); l.group.add(drawer);
      l.interactable(d.x + 1.8, 1, d.z + 1.5, 1.5, () => {
        g.audio.sfx('drawer'); drawer.position.z += 0.8; drawer.scale.z = 6;
        if (i !== 2 && i !== 4 && i !== 7) { l.pickup(d.x + 1.8, 1.5, d.z + 2.2, 'treat', { goal: true }); g.toast(`Leckerli in Schalter ${i + 1}! (Formlos beantragt.)`); }
        else g.toast({ 2: 'Nur Büroklammern. Bäh.', 4: 'Nur Formular A38 in dreifacher Ausfertigung. Bäh.', 7: 'Ein Stempelkissen. Schmeckt nach Tinte. Bäh.' }[i]);
      }, 'SCHUBLADE: BISS');
    });
    l.box(-22, 0, -20, 3, 1.5, 3, 0x95a5a6); l.box(-22, 0, -16, 3, 3, 3, 0x95a5a6); l.box(-22, 0, -12, 3, 4.5, 3, 0x95a5a6);
    l.goldbone('kletter', -22, 5.2, -12);
    // Wartebereich: Nummernautomat, Anzeigetafel und Plastikstühle an der Südwand
    l.deco(makeSign('Bitte Nummer ziehen!', { w: 2.6, post: 1.4 }), -3.4, 0, 23);
    l.box(3, 0, 23, 1.1, 1.6, 0.8, 0xc0392b); md(box(0.6, 0.06, 0.3, 0xfdfdf5), 3, 1.25, 22.58); l.deco(makeDisplay('ZIEHEN', 0.9, '#55efc4'), 3, 1.8, 22.55);
    l.wartenr = 4711;
    l.interactable(3, 0.8, 23, 1.8, it => {
      it.used = false; g.audio.sfx('click'); l.wartenr++;
      g.toast(`Ihre Nummer: ${l.wartenr}. Aufgerufen: ${l.aufgerufen}. Geschätzte Wartezeit: ${3 + (l.wartenr % 5)} Hundejahre.`);
    }, 'NUMMER ZIEHEN: BISS');
    l.aufgerufen = 12; l.tafel = makeDisplay('Nr. 12 → Schalter 3', 7); l.deco(l.tafel, 0, 8.2, -3); [-3, 3].forEach(x => md(box(0.06, 2.4, 0.06, 0x636e72), x, 10.2, -3));
    for (const x of [-16, -14.6, -13.2, -11.8, -4.2, -2.8, 2.8, 4.2, 11.8, 13.2, 14.6, 16]) { l.box(x, 0, 30.4, 1.2, 0.8, 1.2, 0xe67e22); md(box(1.2, 1.1, 0.15, 0xe67e22), x, 1.35, 30.95); }
    // ---- Fähigkeit dieser Welt: Bauchklatscher. Drei Riesenstempel am Boden genehmigen die Anträge, dann öffnet die Poststelle; Kartons zerbrechen
    l.teacher(-5, 20, 'bauchklatscher', { y: 0 });
    // Rückkehr-Knochen im Erdgeschoss (später mit Buddeln bzw. Tornado wiederkommen)
    l.backbone('r_buddeln', 'buddeln', 'dig', 1, -23, { from: 1 }); l.backbone('r_tornado', 'tornado', 'ledge', 25, 5, { from: 1 });
    l.knoepfe = 0;
    [[-10, 24], [8, 27], [-22, 6]].forEach(([x, z]) => l.stompPad(x, 0, z, () => {
      l.knoepfe++; if (l.knoepfe < 3) { g.toast(`STEMPEL! Antrag ${l.knoepfe}/3 genehmigt.`); return; }
      if (!g.hasBone(l.key, 'stampfen')) { g.toast('GENEHMIGT, GENEHMIGT, GENEHMIGT! Die Poststelle öffnet ihr Fach!'); l.spawnGoldbone(-24, 1.2, 24, 'stampfen'); }
    }));
    l.box(-26.5, 0, 24, 2, 3.2, 5, 0xf1c40f); l.deco(makeSign('Poststelle', { w: 2.2 }), -26.5, 3.2, 24, Math.PI / 2);
    [[-24, -2], [24, -2], [0, -27]].forEach(([x, z]) => l.crate(x, 0, z, 1.8, [l.pickup(x, 0.4, z, 'bone', { value: 5 })]));
    l.goldbone('geheim', 24, 0.6, -24, { hidden: true });
    l.box(20, 0, 20, 6, 0.8, 6, 0xd63031); l.deco(makeSign('Kantine', { w: 2.2, post: 1.4 }), 20, 0, 16.2);
    l.pickup(-20, 0.3, 26, 'cup', { special: true, onTake: () => l.tasse(), onRestore: () => l.tassen++ });
    crumbs(0, [[-24, 24], [-8, 24], [8, 24], [-24, 4], [20, 4], [0, -24], [-12, -26], [12, -26]]);

    // ---- 1. Stock: Sitzungssaal, Kopierer-Ecke, Tür zur Amtsleitung
    l.group.add(box(52, 0.04, 64, 0x8e7cc3, 0, F1 + 0.02, 0));
    l.box(0, F1, -12, 16, 1.6, 5, 0x6d4c41); [-6, -2, 2, 6].forEach(x => [-16, -8].forEach(z => l.box(x, F1, z, 1.4, 1, 1.4, 0x2d3436)));
    md(box(10, 5, 0.2, 0xffffff), 0, F1 + 2, -31.2); // Whiteboard mit Organigramm: alle Kästchen zeigen aufeinander
    [[0, 3.9], [-3, 2.6], [3, 2.6], [-4, 1.3], [-1.4, 1.3], [1.4, 1.3], [4, 1.3]].forEach(([x, y], i) => md(box(1.6, 0.7, 0.05, [0x74b9ff, 0xfdcb6e, 0x55efc4, 0xfab1a0][i % 4]), x, F1 + 2 + y, -31.08));
    md(box(6.6, 0.08, 0.05, 0x2d3436), 0, F1 + 2 + 3.25, -31.06); md(box(8.4, 0.08, 0.05, 0x2d3436), 0, F1 + 2 + 1.95, -31.06);
    l.box(-12, F1, 18, 3, 2, 3, 0xdfe6e9); l.box(-15, F1, 20.5, 3, 4, 3, 0xffffff); l.box(-18, F1, 23, 3, 6, 3, 0x95a5a6); l.box(-21, F1, 25.5, 3, 8, 3, 0x6d4c41); // Kopierer, Papier, Ordner, Aktenregal
    l.goldbone('kopierer', -21, F1 + 8.8, 25.5);
    l.door(10, F1, -31.2, { x: 2000, y: 0.2, z: 8, yaw: Math.PI }, { label: 'Amtsleitung', frame: 0x2d3436 });
    l.deco(makeRoundTree(1.2), 20, F1, 0); l.deco(makeRoundTree(1.2), -20, F1, -4);
    crumbs(F1, [[-20, 0], [-10, 6], [0, 6], [10, 6], [20, 10], [16, -20], [-16, -24], [0, 24], [12, 24]]);
    // Amtsleitung (Raum): Schreibtisch mit Riesenstempel, Sessel, Pokalschrank
    const cx = 2000; l.room(cx, 0, 30, 22);
    l.box(cx, -1, 0, 30, 1, 22, 0x6d4c41); l.box(cx, 9, 0, 30, 1, 22, 0x3d3d3d);
    l.box(cx, 0, -11, 30, 9, 1, 0xdcdde1); l.box(cx, 0, 11, 30, 9, 1, 0xdcdde1); l.box(cx - 15, 0, 0, 1, 9, 22, 0xdcdde1); l.box(cx + 15, 0, 0, 1, 9, 22, 0xdcdde1);
    l.box(cx, 0, -4, 10, 1.8, 4, 0x4e342e); l.box(cx, 0, -8, 3, 3, 2, 0x2d3436); // Schreibtisch, Sessel
    md(cyl(0.7, 0.7, 0.3, 0x2d3436, 0, 0, 0, 12), cx + 2.5, 1.95, -4); md(cyl(0.22, 0.3, 1.1, 0x6d4c41, 0, 0, 0, 8), cx + 2.5, 2.65, -4); md(sphere(0.38, 0x6d4c41, 0, 0, 0, 8), cx + 2.5, 3.35, -4); // Riesenstempel
    for (let k = 0; k < 6; k++) md(box(1.4, 0.3, 1, k % 2 ? 0xfdfdf5 : 0xf5e9c8), cx - 3 + Math.sin(k) * 0.15, 1.95 + k * 0.3, -4, Math.sin(k * 2) * 0.2); // Unterschriftenmappe
    l.box(cx + 6, 0, -9, 3, 4.6, 3, 0x6d4c41); l.box(cx + 10.5, 0, -9, 4, 6.6, 3, 0x6d4c41); // Bücherschrank, Pokalschrank
    for (let i = 0; i < 3; i++) l.deco(cyl(0.3, 0.2, 0.9, 0xf1c40f, 0, 0.45, 0, 8), cx + 9.5 + i, 6.6, -9.3);
    l.goldbone('chef', cx + 11.5, 7.4, -8.6);
    l.deco(box(4, 2.4, 1.6, 0x74b9ff), cx - 10, 1.2, -9); // Aquarium
    l.pickup(cx - 10, 2.7, -9, 'cup', { special: true, onTake: () => l.tasse(), onRestore: () => l.tassen++ });
    l.solids.push({ min: { x: cx - 12, y: 0, z: -9.8 }, max: { x: cx - 8, y: 2.4, z: -8.2 }, active: true });
    crumbs(0, [[cx - 6, 4], [cx + 6, 4], [cx, 6]]);
    const boss = makeNpcDog(0x2d3436, 0xc0392b); l.deco(boss, cx - 4, 0, 6, Math.PI);
    l.trigger(cx - 4, 0, 6, 4, () => g.talk('chef', { mesh: boss }), false);
    l.door(cx, 0, 10.4, { x: 10, y: F1 + 0.2, z: -29, yaw: 0 }, { label: 'Flur', ry: Math.PI });

    // ---- 2. Stock: Aktenarchiv, Kaffeeküche, Fensterbänke
    l.group.add(box(52, 0.04, 64, 0x6d6255, 0, F2 + 0.02, 0));
    const racks = [[-16, -20, 3], [-12, -20, 5], [-8, -16, 7], [-4, -20, 8.5], [0, -16, 10], [4, -20, 6], [8, -16, 3], [12, -20, 5]];
    const FOLDER = [0xc0392b, 0x2980b9, 0xf1c40f, 0x27ae60, 0x8e44ad];
    racks.forEach(([x, z, h], j) => { l.box(x, F2, z, 2.6, h, 2.6, 0x8d6e63); for (let k = 0; k < h; k += 1) { md(box(2.64, 0.08, 0.12, 0x5d4037), x, F2 + k + 0.04, z + 1.3); md(box(2.3, 0.78, 0.1, FOLDER[(j + k) % 5]), x, F2 + k + 0.48, z + 1.32); } }); // Aktenregale mit Ordnerrücken
    l.goldbone('server', 0, F2 + 10.8, -16);
    l.box(10, F2, 22, 10, 1.6, 4, 0xdfe6e9); const machine = box(1.6, 2, 1.4, 0x2d3436, 0, 1, 0); l.deco(machine, 12, F2 + 1.6, 22);
    l.tassen = 0;
    l.interactable(12, F2 + 1.6, 22, 2.2, it => {
      it.used = false;
      if (l.tassen >= 4 && !g.hasBone(l.key, 'tassen')) { it.used = true; g.talk('kaffee.fertig'); l.spawnGoldbone(10, F2 + 0.6, 18.5, 'tassen'); }
      else if (!g.hasBone(l.key, 'tassen')) g.talk('kaffee', { vars: { n: l.tassen } });
    }, 'KAFFEE: BISS');
    [[-22, 29.4, 2], [-16, 29.4, 4], [-10, 29.4, 6], [-4, 29.4, 8], [2, 29.4, 10]].forEach(([x, z, h]) => { l.box(x, F2 + h - 0.4, z + 0.55, 3.4, 0.4, 3.7, 0xecf0f1); [-1.2, 1.2].forEach(d => md(box(0.2, 0.7, 1.4, 0xb2bec3), x + d, F2 + h - 0.75, 30.7)); }); // Wandbretter bis zur Wand, auf Konsolen
    l.goldbone('fenster', 2, F2 + 10.8, 29.4);
    l.pickup(-4, F2 + 8.3, 29.4, 'cup', { special: true, onTake: () => l.tasse(), onRestore: () => l.tassen++ });
    crumbs(F2, [[-20, 0], [-10, 8], [0, 0], [10, 8], [20, -6], [-16, -26], [16, -26], [-20, 20], [20, 14]]);

    // ---- Dach: Landeplatz, Lüftungen, Antennenmast
    const hp = cyl(8, 8, 0.05, 0x2d3436, 0, 0, 0, 24); l.deco(hp, 0, ROOF + 0.02, 6); l.deco(box(1, 0.06, 6, 0xf1c40f), -2, ROOF + 0.05, 6); l.deco(box(1, 0.06, 6, 0xf1c40f), 2, ROOF + 0.05, 6); l.deco(box(3, 0.06, 1, 0xf1c40f), 0, ROOF + 0.05, 6);
    [[-20, 20, 4, 2.4, 4], [18, 18, 6, 3, 4], [-12, -24, 5, 2, 3]].forEach(([x, z, w, h, d]) => l.box(x, ROOF, z, w, h, d, 0xb2bec3));
    l.box(-22, ROOF, -10, 1.4, 16, 1.4, 0x636e72); l.box(14, ROOF, 18, 2, 1.5, 2, 0xb2bec3);
    for (let i = 0; i < 9; i++) { const a = i * 0.8, r = 1.9; l.box(-22 + Math.cos(a) * r, ROOF + 1.2 + i * 1.6, -10 + Math.sin(a) * r, 1.6, 0.3, 1.6, 0xe74c3c); md(box(0.9, 0.2, 0.3, 0x636e72), -22 + Math.cos(a) * 0.95, ROOF + 1.1 + i * 1.6, -10 + Math.sin(a) * 0.95, -a); } // Trittstufen mit Trägern am Mast
    l.box(-22, ROOF + 16, -10, 3, 0.3, 3, 0x636e72); l.deco(sphere(0.4, 0xff3838, 0, 0, 0, 6), -22, ROOF + 17.6, -10);
    l.goldbone('antenne', -21, ROOF + 16.8, -9);
    l.pickup(18, ROOF + 3.3, 18, 'cup', { special: true, onTake: () => l.tasse(), onRestore: () => l.tassen++ });
    l.tasse = () => { l.tassen++; g.toast(`Kaffeetasse ${l.tassen}/4 – zur Kaffeemaschine im 2. Stock!`); };
    [[10, -10], [-10, 14]].forEach(([x, z]) => l.addEnemy(new Pigeon(g, x, z, ROOF)));
    crumbs(ROOF, [[-24, 0], [-8, -16], [8, -16], [24, -10], [-24, 26], [10, 26], [0, -26]]);

    l.label('Bitte eine Nummer ziehen! 6 Leckerli stecken in den Schalter-Schubladen – beiß dran! Dann hoch bis aufs Dach.', 0, 4, 16);
  },
  // Anzeigetafel: alle paar Sekunden springt die Nummer, mit Ding-Dong
  update(l, dt) {
    l.tafelT = (l.tafelT ?? 6) - dt; if (l.tafelT > 0) return;
    l.tafelT = 7 + Math.random() * 5; l.aufgerufen += 1 + Math.floor(Math.random() * 3);
    l.tafel.userData.setText(`Nr. ${l.aufgerufen} → Schalter ${1 + Math.floor(Math.random() * 9)}`);
    const p = l.game.player.pos; if (p.y < F1 - 1 && Math.abs(p.x) < 1000) l.game.audio.sfx('bell', 0.4);
  },
  onGoal(l) { l.tafel.userData.setText('Nr. 0 → KANTINE'); l.game.toast('Durchsage: „Die Nummer null bitte zur Kantine.“ Ein Klappern … DER DOSENÖFFNER!'); l.game.later(1000, () => { const b = new CanOpener(l.game, 10, 8); l.group.add(b.can); l.setBoss(b); }); },
};
