// Extra-Requisiten je Welt (assets/extras, Blender): Vogelhaus und Hollywoodschaukel im Garten, Toaster und Topf auf der
// Küchenzeile, Drucker und Lampen auf den Schaltern, Ampeln und Litfaßsäulen an der Straße, Schaukel, Wippe und Karussell
// auf dem Spielplatz, Pumpe und Wetterhahn im Dorf, Container und Gabelstapler im Hafen, Strandkörbe, Ventile im Kanal.
// Bewegliche Teile (Windrad, Schaukeln, Karussell, Warnleuchte …) bewegt animateDeko. Läuft nach der Deko der Welt.
const PI = Math.PI;
// erste freie Stelle aus einer Liste nehmen: spots = [[x, z, ry?], …]
const first = (d, name, spots, o = {}) => { for (const [x, z, ry] of spots) if (d.extra(name, x, z, { ...o, ry: ry ?? o.ry })) return true; return false; };
// an (x, z) oder in Ringen bis r Meter drumherum die erste freie Stelle (Layouts der Welten ändern sich)
const near = (d, name, x, z, r, o = {}) => { for (let k = 0; k <= r; k += 1.5) for (let i = 0, n = k ? Math.ceil(k * 4) : 1; i < n; i++) { const a = i / n * PI * 2; if (d.extra(name, x + Math.cos(a) * k, z + Math.sin(a) * k, o)) return true; } return false; };
// n Stück in einem Rechteck verteilen (zufällige Drehung)
const spread = (d, name, rect, n, o = {}) => { let k = 0; for (let i = 0; i < n * 6 && k < n; i++) if (d.extra(name, d.r(rect[0], rect[1]), d.r(rect[2], rect[3]), { ry: d.r(0, PI * 2), ...o })) k++; return k; };

export const extras = {
  // ---- Garten: Vogelhaus, Schaukel am Teich, Schlauchwagen am Haus, Rasenmäher vorm Schuppen, Pflanztisch am Gewächshaus,
  // Rosenbögen über zwei Gartentoren, Insektenhotel am Zaun, Windrad auf dem Hügel
  hub(d) {
    first(d, 'garten/vogelhaus', [[-18, -7], [-20, 4], [18, 20]], { w: 0.6, d: 0.6 });
    first(d, 'garten/hollywoodschaukel', [[-14.5, 21, PI / 2], [-15, 16, PI / 2], [14.5, 22, -PI / 2]], { solid: [2.3, 2.2, 1.5] });
    first(d, 'garten/schlauchwagen', [[9, -13, -PI / 2], [-9, -13, PI / 2]], { w: 1, d: 0.9, margin: 0.2 });
    first(d, 'garten/rasenmaeher', [[-8, -51, 0.4], [-12, -48, 0.2], [14, -50, -0.3]], { solid: [0.7, 1, 1.1] });
    first(d, 'garten/pflanztisch', [[-56, 6.2, PI], [-64, 6.2, PI], [-48, 10, -PI / 2]], { solid: [1.2, 1.4, 0.6], margin: 0.2 });
    [[-6, -33], [6, 33, PI]].forEach(([x, z, ry]) => d.extraAt('garten/rosenbogen', x, z, { ry, keep: 1 }));
    d.extraAt('garten/insektenhotel', -32.5, -20, { ry: PI / 2, keep: 0.8 });
    d.extraAt('garten/windrad', 17.8, 11, { y: 2.4, keep: 0.8 });
  },
  // ---- Erdgeschoss: Küchengeräte auf Arbeitsplatte, Herd und Kochinsel (Küchen-Maßstab 2,4)
  kueche(d) {
    const S = 2.4, on = (name, x, y, z, ry = 0) => d.extraAt(name, x, z, { s: S, y, ry, keep: 0.6 });
    on('kueche/brotkasten', -16.2, 1, -13.9); on('kueche/toaster', -14.2, 1, -13.7); on('kueche/schneidebrett', -9.8, 1, -13.5, 0.2); on('kueche/wasserkocher', -7.4, 1, -13.8);
    on('kueche/kochtopf', 2.6, 1.8, -14.6); on('kueche/mixer', -3, 1.6, 3.4, PI); on('kueche/obstschale', 3, 1.6, 3.4);
    on('kueche/salz-pfeffer', 0.3, 1.32, 28);
  },
  // ---- Büro (Maßstab 1,7): Lampen und Drucker auf den Schaltern, Kaffeemaschine auf dem Aktenschrank, Kopierer, Ventilatoren
  buero(d) {
    const S = 1.7, F1 = 12, F2 = 24, at = (name, x, y, z, ry = 0) => d.extraAt(name, x, z, { s: S, y, ry, keep: 0.6 });
    [[-14, -12], [0, -1], [14, 10]].forEach(([x, z]) => at('buero/schreibtischlampe', x + 2.5, 1.4, z - 1, -0.4));
    [[14, -12], [-14, 10]].forEach(([x, z]) => at('buero/drucker', x + 2.3, 1.4, z + 0.3, PI));
    at('buero/kaffeemaschine', -6, 2.38, -30.6); at('buero/computer', 14.4, F1 + 0.85, 22.5, PI);
    const on = (name, y, x, z, o) => near(d, name, x, z, 8, { s: S, y, ...o });
    on('buero/kopierer', 0, -10, -25, { solid: [1.2, 0.9, 0.7] }); on('buero/kopierer', F1, 0, -25, { solid: [1.2, 0.9, 0.7] });
    on('buero/ventilator', 0, -24, 6, { w: 0.6, d: 0.6 }); on('buero/ventilator', F1, 22, 20, { w: 0.6, d: 0.6 });
    on('buero/pinnwand', F2, -4, 25, { ry: PI, solid: [1, 1.6, 0.45] });
    on('buero/aktenstapel', F1, -10, -25, { solid: [0.7, 0.35, 0.6] }); on('buero/aktenstapel', F2, 14, -12, { solid: [0.7, 0.35, 0.6] });
  },
  // ---- Kanal: Ventilrad und Manometer am Pumpwerk, Warnleuchten, Schaltschrank, Absperrbaken an der Rinne, Steigleiter, Mausefalle im Nest
  kanal(d) {
    const at = (name, x, z, ry = 0, s = 1.4) => d.extraAt(name, x, z, { s, ry, keep: 1 });
    at('kanal/ventilrad', 7, -55); at('kanal/manometer', -7, -58.7); at('kanal/manometer', 21, -58.7);
    at('kanal/warnleuchte', -22, -48); at('kanal/warnleuchte', 22, -52);
    at('kanal/stromkasten', -58.6, 18, PI / 2); at('kanal/wandleiter', 58.6, -22, -PI / 2);
    first(d, 'kanal/absperrbake', [[-7.6, 32, PI / 2], [-7.6, 20, PI / 2]], { s: 1.4, w: 0.8, d: 2.1, margin: 0.2 });
    first(d, 'kanal/absperrbake', [[7.6, -32, -PI / 2], [7.6, -20, -PI / 2]], { s: 1.4, w: 0.8, d: 2.1, margin: 0.2 });
    d.extraAt('kanal/mausefalle', 2000 - 12, 2, { s: 3, ry: 0.6, keep: 1 });
  },
  // ---- Straße: Ampeln an den Kreuzungen, Litfaßsäulen, Briefkästen, Parkuhren, Telefonzelle am Bahnhof, Kaugummiautomaten, Schilder
  strasse(d) {
    [[8.6, -38, -PI / 2], [-8.6, 38, PI / 2], [38, 8.6, PI], [-38, -8.6, 0]].forEach(([x, z, ry]) => d.extra('strasse/ampel', x, z, { ry, w: 0.5, d: 0.5, margin: 0.2 }));
    d.zone(-90, -95, 60, () => { first(d, 'strasse/litfasssaeule', [[-66, -85], [-100, -85], [-83, -68]], { solid: [1.4, 3.3, 1.4] }); spread(d, 'strasse/briefkasten', [-147, -40, -147, -45], 2, { w: 0.5, d: 0.4 }); });
    d.zone(95, -95, 60, () => { [[38.6, -50], [38.6, -70]].forEach(([x, z]) => d.extra('strasse/verkehrsschild', x, z, { ry: -PI / 2, w: 0.6, d: 0.3 })); spread(d, 'strasse/parkuhr', [40, 80, -80, -40], 3, { w: 0.4, d: 0.4 }); });
    d.zone(-95, 95, 60, () => { first(d, 'strasse/kaugummiautomat', [[-128, 33, PI], [-100, 33, PI], [-120, 40]], { w: 0.5, d: 0.5 }); first(d, 'strasse/litfasssaeule', [[-70, 46], [-96, 46], [-60, 66]], { solid: [1.4, 3.3, 1.4] }); spread(d, 'strasse/briefkasten', [-147, -40, 40, 147], 2, { w: 0.5, d: 0.4 }); });
    d.zone(95, 95, 60, () => { spread(d, 'strasse/kaugummiautomat', [40, 147, 40, 147], 2, { w: 0.5, d: 0.5 }); spread(d, 'strasse/verkehrsschild', [40, 147, 40, 147], 2, { w: 0.6, d: 0.3 }); });
    for (const z of [56, 74, 88]) d.extra('strasse/parkuhr', 7.8, z, { ry: -PI / 2, w: 0.4, d: 0.4 });
    for (const z of [-56, -74]) d.extra('strasse/parkuhr', -7.8, z, { ry: PI / 2, w: 0.4, d: 0.4 });
    d.zone(0, 108, 50, () => { first(d, 'strasse/telefonzelle', [[-24, 128, PI / 2], [24, 130, -PI / 2], [-30, 112]], { solid: [1.1, 2.7, 1.1] }); first(d, 'strasse/briefkasten', [[-18, 124], [18, 124]], { w: 0.5, d: 0.4 }); });
  },
  // ---- Park: Spielplatz (Schaukel, Wippe, Karussell, Rutsche), Kugelgrills an Grillwiese und Zeltplatz, Picknickkörbe, Trinkbrunnen
  park(d) {
    d.zone(100, 0, 60, () => {
      first(d, 'park/schaukel', [[122, -8], [124, 14], [104, -24]], { s: 1.3, solid: [2.7, 2.4, 1.7] });
      first(d, 'park/wippe', [[76, -15], [82, -16], [76, -4]], { s: 1.3, solid: [3.3, 0.9, 0.5] });
      first(d, 'park/karussell', [[76, -5], [84, -14], [74, -12]], { s: 1.3, solid: [2.2, 1, 2.2] });
      first(d, 'park/rutsche', [[104, -20, PI / 2], [122, 20, PI], [70, -26]], { s: 1.3, solid: [0.9, 2.7, 3.4] });
      first(d, 'park/trinkbrunnen', [[66, 6, -PI / 2], [66, -6, -PI / 2]], { solid: [0.7, 1.1, 0.6] });
    });
    d.zone(95, -95, 60, () => { spread(d, 'park/kugelgrill', [50, 120, -90, -45], 2, { solid: [0.9, 0.9, 0.6] }); spread(d, 'park/picknickkorb', [50, 120, -90, -45], 3, { w: 0.5, d: 0.4 }); });
    d.zone(-100, 100, 55, () => { first(d, 'park/kugelgrill', [[-86, 104], [-104, 86], [-84, 88]], { solid: [0.9, 0.9, 0.6] }); first(d, 'park/picknickkorb', [[-104, 90], [-100, 102]], { w: 0.5, d: 0.4 }); });
    [[5.6, -47, -PI / 2], [-5.6, 47, PI / 2], [47, 5.6, PI], [-47, -5.6, 0]].forEach(([x, z, ry]) => d.extra('park/trinkbrunnen', x, z, { ry, solid: [0.7, 1.1, 0.6] }));
  },
  // ---- Dorf: Schwengelpumpe und Wetterhahn am Marktplatz, Hof mit Milchkannen, Trog, Hühnerstall und Hofladen, Hackklotz im Försterwald
  dorf(d) {
    near(d, 'dorf/schwengelpumpe', 9, -9, 10, { ry: PI / 4, solid: [0.7, 1.4, 1.3] });
    first(d, 'dorf/wetterhahn', [[-9, 9], [9, -9], [-16, -16]], { w: 0.8, d: 0.8 });
    d.zone(105, 0, 55, () => {
      first(d, 'dorf/milchkannen', [[96, -3, -PI / 2], [92, 2], [98, 6]], { solid: [1.5, 1.2, 0.5] });
      first(d, 'dorf/wassertrog', [[100, 14], [104, 14], [96, 20, PI / 2]], { solid: [1.6, 0.6, 0.7] });
      first(d, 'dorf/huehnerstall', [[128, 30, -PI / 2], [128, 20, -PI / 2], [110, 42, PI]], { s: 1.2, solid: [1.9, 1.6, 1.9] });
    });
    near(d, 'dorf/hofladen', 7, -72, 10, { ry: -PI / 2, solid: [1.9, 2, 1] });
    d.zone(-100, -100, 55, () => { first(d, 'dorf/hackklotz', [[-86, -73], [-98, -72], [-84, -86]], { solid: [1.5, 1, 1.3] }); });
  },
  // ---- Hafen: Container und Gabelstapler am Terminal, Fischkisten am Markt, Glocke und Steuerrad am Kai, Ankerspill, Seesäcke
  hafen(d) {
    d.zone(90, -10, 60, () => {
      [[100, -30], [100, 0], [80, 20]].forEach(([x, z]) => near(d, 'hafen/container', x, z, 15, { solid: [6.2, 2.6, 2.5] }));
      first(d, 'hafen/gabelstapler', [[108, -40, -PI / 2], [108, -24, -PI / 2], [86, -40]], { solid: [1.3, 2.4, 3] });
    });
    d.zone(-88, -15, 50, () => {
      spread(d, 'hafen/fischkiste', [-70, -58, -30, 24], 4, { w: 0.7, d: 0.5 }); spread(d, 'hafen/seesack', [-128, -48, -58, 28], 3, { w: 0.6, d: 0.6 });
      first(d, 'hafen/seilwinde', [[-126, -16], [-126, 0], [-110, 26]], { solid: [1.5, 1, 1.3] });
    });
    near(d, 'hafen/schiffsglocke', 16, 27, 8, { w: 1, d: 0.4 });
    d.zone(-20, 90, 55, () => { first(d, 'hafen/steuerrad', [[-20, 56], [-20, 88], [-20, 120]], { w: 1.1, d: 0.5, margin: 0.1 }); });
  },
  // ---- Strand: Strandkörbe, Kühlboxen, Sandeimer, Windschutz, Schwimmringe, Treibholz am Spülsaum, Duschen an der Promenade
  strand(d) {
    d.zone(0, -135, 70, () => { [[-30, -128], [60, -128], [-80, -130]].forEach(([x, z]) => d.extra('strand/strandusche', x, z, { solid: [0.9, 2.3, 0.9] })); });
    d.zone(0, -80, 90, () => {
      spread(d, 'strand/strandkorb', [-120, 130, -118, -70], 8, { solid: [1.3, 1.8, 1.2], ry: 0 });
      spread(d, 'strand/kuehlbox', [-120, 130, -112, -62], 6, { w: 0.9, d: 0.5 });
      spread(d, 'strand/sandeimer', [-120, 130, -100, -55], 6, { w: 0.6, d: 0.5 });
      spread(d, 'strand/windschutz', [-120, 130, -112, -70], 4, { w: 3, d: 0.3 });
      spread(d, 'strand/schwimmring', [-120, 130, -100, -55], 4, { w: 1, d: 1 });
      spread(d, 'strand/treibholz', [-140, 140, -64, -46], 6, { w: 2.1, d: 0.9 });
    });
  },
};
