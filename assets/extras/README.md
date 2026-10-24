# Extra-Deko je Welt

66 zusätzliche Low-Poly-Requisiten, gebaut mit `tools/make_extras.py` (Blender headless, Bausteine aus
`tools/blender_lib.py` und `tools/make_deko.py`):

```
blender --background --factory-startup --python tools/make_extras.py            # alle
blender --background --factory-startup --python tools/make_extras.py -- kueche  # eine Welt
blender --background --factory-startup --python tools/make_extras.py -- park/wippe
```

- Maße in echten Metern (1 Einheit = 1 m), Ursprung unten mittig, Vorderseite +Z.
- Einfarbige Materialien, keine Texturen (werden in `src/assets.js` zu Vertexfarben).
- Mesh-Knoten heißen `…-m`. Bewegliche Teile sind eigene Knoten ohne `-m`; ihr Ursprung ist der Drehpunkt,
  das Mesh darunter (`<name>-m`) ist relativ dazu gebaut. Alle stehen in Ruhelage (Drehung 0).
- Drinnen wie die übrigen Requisiten skalieren: Erdgeschoss/Küche etwa `s: 2.4`, Büro etwa `s: 1.7`
  (siehe `src/deko/kueche.js`, `src/deko/buero.js`). Kleine Küchengeräte dürfen auch größer (3–5) als Kletterhilfe.
- Budget: kleine Dinge < 400 Dreiecke, größere < 1200.

| Datei | Welt | Beschreibung | Maße B×H×T (m) | Dreiecke | Bewegliche Knoten (Drehachse) | Platzierung |
|---|---|---|---|---|---|---|
| garten/vogelhaus.glb | Garten | Vogelfutterhaus auf Pfahl mit Streben, Körnern und Sitzstange | 0.50×1.95×0.50 | 508 | – | frei auf Wiese, an Beeten |
| garten/hollywoodschaukel.glb | Garten | Hollywoodschaukel mit gestreiftem Sonnendach, Polstern und Kissen | 2.34×2.23×1.54 | 1016 | `schaukel` (x, Pendel ±0,2) | Terrasse, am Teich |
| garten/schlauchwagen.glb | Garten | Schlauchwagen mit aufgerolltem Gartenschlauch und Spritze | 1.04×1.03×0.84 | 1174 | `trommel` (x) | an Hauswand, bei Beeten |
| garten/rasenmaeher.glb | Garten | Roter Rasenmäher mit Grasfangsack | 0.64×0.97×1.08 | 754 | – | frei auf Wiese, vor dem Schuppen |
| garten/pflanztisch.glb | Garten | Pflanztisch mit Töpfen, Anzuchtschale, Kelle und Erdsack | 1.20×1.45×0.58 | 1188 | – | am Gewächshaus, an Wänden |
| garten/rosenbogen.glb | Garten | Weißer Rosenbogen mit Blattwerk und Rosen | 1.68×2.44×0.56 | 1052 | – | über Wegen, an Gartentoren |
| garten/insektenhotel.glb | Garten | Insektenhotel mit Holzklötzen, Bambus, Zapfen, Stroh, Lochziegeln | 0.63×1.14×0.28 | 1124 | – | am Zaun, auf der Obstwiese |
| garten/windrad.glb | Garten | Bunter Garten-Windrad-Propeller mit Windfahne | 0.72×1.82×0.91 | 248 | `rad` (z) | im Beet, auf dem Hügel |
| kueche/toaster.glb | Küche | Chrom-Toaster mit zwei Toastscheiben | 0.28×0.28×0.20 | 276 | – | auf Arbeitsplatte |
| kueche/kochtopf.glb | Küche | Roter Kochtopf mit Deckel und Griffen | 0.44×0.25×0.34 | 338 | – | auf dem Herd, im Regal |
| kueche/mixer.glb | Küche | Rosa Küchenmaschine mit Rührschüssel und Teig | 0.23×0.41×0.38 | 368 | – | auf Arbeitsplatte |
| kueche/salz-pfeffer.glb | Küche | Salz- und Pfefferstreuer auf Holzbrettchen | 0.20×0.12×0.10 | 352 | – | auf Tischen |
| kueche/brotkasten.glb | Küche | Roter Brotkasten mit Rollklappe, Brotlaib obendrauf | 0.44×0.36×0.28 | 356 | – | auf Arbeitsplatte, Speisekammer |
| kueche/wasserkocher.glb | Küche | Hellblauer Wasserkocher mit Sockel | 0.19×0.24×0.31 | 374 | – | auf Arbeitsplatte |
| kueche/obstschale.glb | Küche | Holzschale mit Äpfeln, Birne, Orange, Banane, Trauben | 0.34×0.21×0.32 | 396 | – | auf Tischen |
| kueche/schneidebrett.glb | Küche | Schneidebrett mit Karotte, Scheiben, Messer, Tomate | 0.47×0.09×0.26 | 360 | – | auf Arbeitsplatte |
| buero/kopierer.glb | Büro | Großer Kopierer mit Schubladen, Bedienfeld und Papierablage | 1.18×0.89×0.69 | 432 | – | an Wänden, Kopierer-Ecke |
| buero/kaffeemaschine.glb | Büro | Filterkaffeemaschine mit Glaskanne | 0.22×0.43×0.30 | 396 | – | Kaffeeküche, auf Tischen |
| buero/drucker.glb | Büro | Tischdrucker mit Papier in Ein- und Ausgabe | 0.45×0.41×0.59 | 160 | – | auf Schreibtischen |
| buero/aktenstapel.glb | Büro | Fünf Ordner und ein Papierstapel mit Mappen | 0.70×0.33×0.59 | 328 | – | auf Tischen, Aktenarchiv, Boden |
| buero/ventilator.glb | Büro | Standventilator mit Schutzgitter | 0.50×1.33×0.37 | 716 | `fluegel` (z) | Ecken, neben Schreibtischen |
| buero/schreibtischlampe.glb | Büro | Grüne Gelenk-Schreibtischlampe | 0.16×0.41×0.31 | 304 | – | auf Schreibtischen |
| buero/pinnwand.glb | Büro | Kork-Pinnwand auf Ständer mit Zetteln und Faden | 1.02×1.60×0.45 | 440 | – | Sitzungssaal, Flure |
| buero/computer.glb | Büro | Röhrenmonitor mit Tastatur und Maus | 0.53×0.39×0.64 | 358 | – | auf Schreibtischen |
| strasse/ampel.glb | Straße | Fußgängerampel (rot) mit Drückerkasten | 0.42×3.35×0.45 | 424 | – | an Kreuzungen, Bordstein |
| strasse/litfasssaeule.glb | Straße | Grüne Litfaßsäule mit sechs bunten Plakaten | 1.44×3.29×1.44 | 640 | – | Plätze, Gehwegecken |
| strasse/briefkasten.glb | Straße | Gelber Briefkasten mit Posthorn auf Pfahl | 0.44×1.53×0.32 | 262 | – | am Gehweg, vor Läden |
| strasse/parkuhr.glb | Straße | Parkuhr mit Zifferblatt und Münzschlitz | 0.26×1.42×0.21 | 184 | – | am Straßenrand, Parkplatz |
| strasse/telefonzelle.glb | Straße | Gelbe Telefonzelle mit Glasfeldern und Telefon | 1.11×2.68×1.11 | 918 | – | am Gehweg, Bahnhof |
| strasse/kaugummiautomat.glb | Straße | Roter Kaugummiautomat mit bunter Kugel | 0.40×1.42×0.39 | 920 | – | vor Läden, Eisdiele |
| strasse/verkehrsschild.glb | Straße | Rundes Schild mit Pfote, darunter Parkschild | 0.60×2.40×0.11 | 412 | – | Straßenrand, Parkplatz |
| park/kugelgrill.glb | Park | Kugelgrill mit Würstchen und seitlich gehängtem Deckel | 0.92×0.91×0.62 | 842 | – | Grillwiese, Zeltplatz |
| park/schaukel.glb | Park | Holzschaukelgerüst mit zwei Sitzen | 2.65×2.33×1.61 | 316 | `schaukel1`, `schaukel2` (x, Pendel) | Spielplatz |
| park/wippe.glb | Park | Wippe mit Griffen, Sitzpolstern und Reifenpuffern | 3.30×0.91×0.50 | 512 | `brett` (z, Neigung ±0,25) | Spielplatz |
| park/rutsche.glb | Park | Kinderrutsche mit Leiter, Podest und Spitzdach | 0.90×2.66×3.43 | 374 | – | Spielplatz (Rutsche zeigt nach +Z) |
| park/picknickkorb.glb | Park | Offener Picknickkorb mit Karotuch, Baguette, Flasche | 0.47×0.49×0.33 | 344 | – | auf Decken, Picknicktischen |
| park/trinkbrunnen.glb | Park | Trinkbrunnen aus Stein mit rotem Hundenapf unten | 0.70×1.11×0.56 | 488 | – | an Wegen, Spielplatz |
| park/karussell.glb | Park | Spielplatz-Drehscheibe mit Haltebügeln | 2.14×1.08×2.20 | 402 | `dreh` (y) | Spielplatz |
| dorf/milchkannen.glb | Dorf | Milchbank mit drei Milchkannen | 1.51×1.16×0.50 | 920 | – | an Hofeinfahrten, Straßenrand |
| dorf/wassertrog.glb | Dorf | Steintrog mit Wasser, Seerosenblatt und Brett | 1.62×0.59×0.70 | 508 | – | Bauernhof, Weiler |
| dorf/huehnerstall.glb | Dorf | Roter Hühnerstall auf Stelzen mit Rampe, Legenest, Eiern | 1.85×1.60×1.86 | 516 | – | Bauernhof (Rampe zeigt nach +Z) |
| dorf/schwengelpumpe.glb | Dorf | Grüne Schwengelpumpe mit Holzeimer auf Steinplatte | 0.70×1.36×1.29 | 624 | `schwengel` (x) | Marktplatz, Hof, am Teich |
| dorf/hofladen.glb | Dorf | Hofladen-Stand mit Äpfeln, Salat, Karotten, Eiern, Kasse | 1.90×1.95×1.00 | 1080 | – | an Wegen, Bauernhof |
| dorf/hackklotz.glb | Dorf | Hackklotz mit Axt, Holzscheiten und Spänen | 1.48×0.96×1.25 | 364 | – | Försterwald, Holzfällerhütte |
| dorf/wetterhahn.glb | Dorf | Wetterhahn mit Windrose auf Steinsockel | 0.80×2.70×0.76 | 338 | `hahn` (y) | Marktplatz, auf Dächern |
| hafen/fischkiste.glb | Hafen | Blaue Fischkiste mit Eis und vier Fischen | 0.65×0.32×0.43 | 372 | – | Fischmarkt, Kai |
| hafen/gabelstapler.glb | Hafen | Gelber Gabelstapler mit Schutzdach | 1.26×2.40×3.02 | 1160 | `gabel` (Verschiebung entlang y, 0–1,6 m) | Containerterminal, Lagerhallen |
| hafen/schiffsglocke.glb | Hafen | Messing-Schiffsglocke im Holzgestell | 1.00×1.70×0.40 | 578 | `glocke` (x) | Kai, Mole |
| hafen/container.glb | Hafen | Roter 20-Fuß-Container mit Wellblech und Türverschlüssen (+X) | 6.14×2.59×2.46 | 844 | – | Containerterminal (stapelbar, 2,59 m) |
| hafen/steuerrad.glb | Hafen | Steuerrad auf Holzsäule | 1.13×1.56×0.45 | 848 | `rad` (z) | Kai, Schiffsdeck |
| hafen/seilwinde.glb | Hafen | Ankerspill mit Spaken und Tau | 1.56×1.01×1.30 | 776 | `winde` (y) | Kai, Mole, Frachtschiff |
| hafen/seesack.glb | Hafen | Blauer Seesack mit Tau und Abzeichen | 0.53×0.91×0.53 | 392 | – | Kai, an Kisten |
| strand/strandkorb.glb | Strand | Strandkorb mit gestreiftem Innenstoff und Fußstützen | 1.27×1.79×1.21 | 574 | – | Strand, Promenade |
| strand/sandeimer.glb | Strand | Sandeimer, Schaufel, Sandburg mit Fähnchen, Seestern-Förmchen | 0.56×0.35×0.50 | 390 | – | Strand, Sandbank |
| strand/kuehlbox.glb | Strand | Kühlbox mit Getränkedosen | 0.88×0.50×0.43 | 296 | – | neben Handtüchern, Schirmen |
| strand/strandusche.glb | Strand | Strandusche mit Holzrost und Fußbrause | 0.90×2.33×0.91 | 314 | – | Promenade, Strandzugang |
| strand/windschutz.glb | Strand | Gestreifter Windschutz an fünf Stäben | 3.05×1.19×0.23 | 308 | – | Strand (hinter Handtüchern) |
| strand/schwimmring.glb | Strand | Donut-Schwimmring mit Glasur und Streuseln | 1.00×0.30×1.00 | 392 | – | Strand, auf dem Wasser |
| strand/treibholz.glb | Strand | Gebleichtes Treibholz mit Seetang und Muschel | 2.11×0.53×0.86 | 286 | – | Spülsaum, Dünen |
| kanal/ventilrad.glb | Kanal | Absperrschieber mit rotem Handrad und Abzweig | 0.69×1.05×0.44 | 664 | `rad` (y) | an Rohren, Pumpwerk |
| kanal/manometer.glb | Kanal | Kupferrohr mit Druckanzeige und Ventil | 0.28×1.20×0.34 | 496 | `zeiger` (z) | an Wänden, Pumpwerk |
| kanal/stromkasten.glb | Kanal | Schaltschrank mit Warnschild, Hebel und Kabeln | 0.88×1.13×0.55 | 280 | – | an Wänden (Kabel nach hinten) |
| kanal/mausefalle.glb | Kanal | Große Schlagfalle mit Käse | 0.18×0.09×0.40 | 228 | `buegel` (x, schnappt um ≈ π) | Rattennest, Ecken |
| kanal/absperrbake.glb | Kanal | Rot-weiße Absperrbake mit Warnlampe | 1.50×1.23×0.55 | 300 | – | vor Brühe-Rinne, Gully-Schacht |
| kanal/warnleuchte.glb | Kanal | Orange Rundumleuchte auf gestreiftem Pfahl | 0.30×1.43×0.30 | 290 | `licht` (y) | Pumpwerk, Gänge |
| kanal/wandleiter.glb | Kanal | Steigleiter mit Rückenschutz, Halter nach hinten (−Z bis −0,24) | 0.67×3.01×0.70 | 468 | – | an Wänden, Gully-Schacht |
