# 🐕 MOLL – Der Labrador

Low-Poly-3D-Jump'n'Run im Stil von Mario 64 / Banjo-Kazooie, gebaut mit Three.js. Man spielt Moll, einen braunen Labrador, und frisst sich durch Erdgeschoss, Einkaufsstraße, das Büro (ein Amt), Grillpark, Badestrand, Hafen, Dorf und Kanalsystem – große Welten im Banjo-Kazooie-Format mit vielen Bereichen und Ebenen. Die Bosse: Staubsauger, Kater, Dosenöffner, Möwe, Obertaube und die Ratte, die Moll in einen Albtraum aus Emmentaler schickt.

![Molls Garten](docs/screenshots/garten.png)

## Starten
Ohne Build-Schritt. Irgendeinen statischen Webserver im Repo-Ordner starten:
```bash
python3 -m http.server 8000
# → http://localhost:8000
```
Online spielen: **https://timo-hoen-ias.github.io/lab64/** – wird bei jedem Push auf `main` per GitHub Actions veröffentlicht (`.github/workflows/pages.yml`).

### Als App auf Android installieren
Moll64 ist eine PWA: In Chrome auf Android die Seite öffnen und im Menü auf **„App installieren“** tippen (oder auf den grünen Knopf **📲 App installieren** im Spielmenü). Die App startet dann im Vollbild und quer, läuft nach dem ersten Start auch offline (`manifest.webmanifest`, `sw.js`, `src/pwa.js`).

## Steuerung
| | Tastatur | Gamepad | Touch |
|---|---|---|---|
| Laufen | WASD / Pfeile | linker Stick | Stick links |
| Kamera | Q / R | rechter Stick | rechts wischen |
| Sprung / Doppelsprung | Leertaste | A | SPRUNG |
| Biss | Shift / E | X | BISS |
| Nase (halten) | F | Y | NASE |
| Trillern / Gleiten / Tornado | C | B | 🌀 |
| Bellen | V | RB | 📢 |
| Pause | Esc | Start | II |

![Welten](docs/screenshots/welten-v2.png)

**Stand:** 118 Goldknochen. Jede Welt hat 13 (die Badebucht 12): 11 schafft man beim ersten Besuch (Boss, alle Krümel, Geheimversteck, Knochen in jedem Bereich und eine Fähigkeiten-Prüfung), **2 Rückkehr-Knochen** brauchen eine Fähigkeit aus einer späteren Welt. Dazu 13 im Garten und 2 im Rattenrennen.

### Fähigkeiten
Am Eingang jeder Welt wartet **Heribert** (ein alter Welsh Corgi Pembroke) und bringt Moll die Fähigkeit dieser Welt bei. Jede Welt hat außerdem zwei **Rückkehr-Knochen**, an die man erst mit einer Fähigkeit aus einer späteren Welt kommt – wie in Banjo-Kazooie lohnt sich ein zweiter Besuch. Ein Schild mit dem Fähigkeiten-Symbol zeigt, was fehlt; nach dem Lernen sagt Moll, wo jetzt neue Knochen erreichbar sind. Im Garten verkauft Heribert im **Leckerli-Laden** Upgrades gegen Krümel (4. und 5. Herz, Trillern+, Lange Ohren, Supernase) – nett, aber für keinen Goldknochen nötig.

### Dialoge
Alle Figuren sprechen mit Moll – und brabbeln dabei wie in Banjo-Kazooie: Der Text erscheint Buchstabe für Buchstabe, und an jeder Silbe blubbert die eigene Stimme der Figur (tiefes Corgi-Brummeln, piepsiger Zwergenkönig, Roboter-Kaffeemaschine …), alles live aus Oszillatoren, Lautstärke über den Effekte-Regler. Beim ersten Treffen gibt es ein ganzes Gespräch (Spiel hält an, SPRUNG/BISS/Tippen blättert weiter, Pause überspringt), danach nur noch kurze Sprüche nebenbei. Bosse stellen sich in Reimen vor. Texte und Stimmen: `src/dialog.js`.

### Low-Poly-Modelle (GLB)
Neben den Grundkörper-Modellen aus `src/models.js` gibt es fertige Low-Poly-Modelle als GLB unter `assets/` – selbst in Blender gebaute (`tools/make_cars.py`) und heruntergeladene CC0-Modelle (Kenney, Quaternius, Poly Haven …, Nachweis in [CREDITS.md](CREDITS.md)). `src/assets.js` lädt sie vor dem Start (vendored `GLTFLoader`), macht aus Material- bzw. Palettenfarben Vertexfarben mit dem Toon-Material des Spiels und fasst jedes Modell zu einem Zeichenaufruf zusammen; `placeAsset(l, name, x, y, z, ry, { size, paint, solid: 'car' | 'box' })` stellt eins mit Kollision in eine Welt. Fehlt eine Datei, bauen die Welten ihr altes Modell. Fremde Modelle mit Textur-Palette vorher umwandeln: `python3 tools/lowpoly.py ein.glb assets/…/aus.glb`. Test: `tests/assets.mjs`.

### Pfoten-Geräusche
Molls Schritte klingen je nach Untergrund – Gras raschelt, Holz klopft hohl, auf Fliesen und Stein klicken die Krallen, Sand knirscht, Teppich dämpft, Blech klingt nach, in Pfützen platscht es. Die Schritte sitzen genau auf den Pfotenaufsätzen der Trab-/Galopp-Animation; Absprung und Landung (je tiefer der Sturz, desto wuchtiger) klingen ebenso nach dem Boden. Alles aus Oszillatoren und gefiltertem Rauschen (`src/audio.js`), Lautstärke über den Effekte-Regler. Den Untergrund setzen Welten mit `surface: '…'` (Welt, Raum, Kiste, Hügel, Rampe) oder `l.surface(x, z, w, d, 'tile')`; was nichts angibt, wird aus der Farbe geraten (`src/surface.js`). Test: `tests/pfoten.mjs`.

| Welt | Fähigkeit | Was sie tut | Prüfung |
|---|---|---|---|
| Garten | Apportieren | Ball/Stock mit BISS tragen und ablegen | Ball zur Hundehütte bringen |
| Erdgeschoss | Trillern | Drehung um die eigene Achse, trifft alles ringsum, zieht Krümel an | Drei Herdknöpfe, Ameisenstraßen, Staubsauger benommen wirbeln |
| Einkaufsstraße | Bellen | WUFF nach vorn: verscheucht Tauben, löst Dinge aus | Drei Autos mit Alarmanlage, Kater erschrecken |
| Das Büro | Bauchklatscher | In der Luft BISS: senkrecht runter und stampfen | Drei Riesenstempel, Kartons, Dosenöffner umhauen |
| Grillpark | Buddeln | BISS an Erdhügeln | Fünf Erdhügel, in einem ein Goldknochen |
| Rattenrennen | Zoomies | Nach Vollgas-Anlauf schneller und weiter springen | Belohnung für den Sieg |
| Badebucht | Tauchen | Taucherbrille | (wie bisher) |
| Hafen | Helikopter-Ohren | In der Luft TRILLER halten = gleiten, Aufwinde tragen nach oben | Vom Ausguck zum Möwennest, Möwe aus der Luft holen |
| Dorf | Wandsprung | An Backsteinwänden abstoßen | Alter Schornstein im Zickzack hoch |
| Kanal | Tornado-Trillern | TRILLER halten bis es funkelt, loslassen: Wirbelsturm nach oben | Lüftungsschacht, Kanalratte aus der Rinne wirbeln |

### Rückkehr-Knochen
| Welt | braucht später |
|---|---|
| Garten | Trillern (Rasensprenger-Ventil), Helikopter-Ohren (Säule mit Aufwind) |
| Erdgeschoss | Bellen (Krähe mit Knochen), Wandsprung (Backstein-Schornstein) |
| Einkaufsstraße | Bauchklatscher (Bodenschalter), Helikopter-Ohren (Säule mit Aufwind) |
| Hochhaus | Buddeln (Erdhügel), Tornado (glatter Sockel) |
| Grillpark | Helikopter-Ohren, Wandsprung |
| Badebucht | Helikopter-Ohren, Wandsprung |
| Hafen | Wandsprung, Tornado |
| Dorf | Tornado (Sockel und verrostetes Ventil) |
| Kanal | Supernase aus Heriberts Laden (zwei Geruchs-Verstecke) |

| Welt | Bereiche |
|---|---|
| Garten (Hub, 160 m) | Haus, Teich zum Tauchen, Schuppen mit Werkstatt, Obstwiese mit Baumhaus, Gewächshaus, Aussichtshügel, 5 Gartenzwerge |
| Erdgeschoss | Küche, Speisekammer, Wohnzimmer mit Bücherregal, Flur mit Galerie und Standuhr, Wintergarten, Keller |
| Einkaufsstraße | Dächer-Parcours, Kaufhaus mit 3 Etagen, Baustelle, Brunnenplatz mit Fontänen, Bahnhof |
| Das Büro | Ein Amt auf 4 Ebenen: Wartehalle mit Nummernautomat und Schaltern, Sitzungssaal + Amtsleitung, Aktenarchiv + Kaffeeküche, Dach mit Antennenmast |
| Grillpark | Grillwiese, See mit Insel, Wald mit Baumkronenpfad, Spielplatz, Aussichtsturm, Dachsbau |
| Badebucht | Strand, Riff zum Tauchen, Wrack, Leuchtturm, Riesenrad, Dünen |
| Hafen | Holzkai, Containerterminal mit Kran, Fischmarkt, Mole mit Leuchtturm, Frachter mit Laderaum |
| Dorf | Marktplatz, Windmühle, Burgruine, Bauernhof mit Hühnern, Dorfteich, Bäckerei |
| Kanalsystem | Haupthalle, Pumpwerk, Rohr-Labyrinth, Klärbecken, Gully-Schacht, Rattennest |

### Rätsel
Wie in Banjo-Kazooie hat jede Welt eigene Knobeleien mit einem Goldknochen als Belohnung (27 Stück, `src/puzzles.js`). Ein Holzschild steht an jedem Rätsel und gibt beim Näherkommen einen Tipp. Eins je Welt ist ein **Rückkehr-Rätsel**: Es braucht eine Fähigkeit aus einer späteren Welt (Schild mit Symbol) – wer zu früh kommt, erfährt, wo man sie lernt.

| Welt | Rätsel | Rückkehr mit … |
|---|---|---|
| Garten | Garten-Memory (Platten betreten, Paare finden), Wettlauf (Hahn beißen, 10 s bis zum Käfig) | 💥 Bauchklatscher: morscher Brunnendeckel |
| Erdgeschoss | Festtafel (6 Kerzen gleichzeitig austrillern), Gläser-Konzert (Melodie der Spieluhr nachbeißen) | 🧱 Wandsprung: Kaminschacht |
| Einkaufsstraße | Klingel-Konzert (Leierkasten-Melodie anbellen), Alarm-Wettlauf (Trichter anbellen, 9 s zum Container) | 🚁 Gleiten: Aufwind zum Werbeballon |
| Das Büro | Antrag 27b (A-K-T-E mit Bauchklatschern stempeln), Rohrpost (15 s schwebende Ordner bis aufs Regal) | 🌪️ Tornado: Lüftungsturm auf dem Dach |
| Grillpark | Hau den Maulwurf (8 in 30 s), Hüpfkästchen (Umdreh-Fliesen: alle gelb) | 🤿 Tauchen: Truhe am Seegrund |
| Strand | Muschel-Memory, Rettungsturm (Glocke beißen, 12 s Stufen) | 🚁 Gleiten: Aufwind zum Drachen |
| Hafen | Schiffsglocken (Nebelhorn-Melodie anbellen), Kran-Wettlauf (12 s quer übers Terminal) | 🧱 Wandsprung: alter Speicher |
| Dorf | Zauberpflaster (Umdreh-Fliesen), Kuhglocken (Melodie nachbeißen) | 🌪️ Tornado: Taubenschlag |
| Kanal | Ventil-Folge (Melodie nachtrillern), Rohrpost (Bauchklatscher, 9 s zum Käfig), Gitter-Rätsel (Umdreh-Fliesen) | – |

Bausteine für neue Rätsel (an `Level`): `memory`, `melody`, `flipTiles`, `moles`, `candles`, `letters`, `cage` + `button` + `pzTimer` (Zeitschalter), `tempPlats` (Plattformen auf Zeit), `shaft`, `chest`. Test: `node tests/raetsel.mjs` spielt alle Rätsel mit echten Tasten durch, Rückkehr-Rätsel einmal ohne und einmal mit Fähigkeit.

### Gegner
Wie bei Banjo-Kazooie wimmelt jede Welt von kleinen Gegnern in Gruppen (rund 270 im ganzen Spiel), passend zur Welt:

| Welt | Gegner |
|---|---|
| Garten | Schnecken, Wespen, Frösche (alle mit BISS zu schaffen) |
| Erdgeschoss | Wollmäuse, Kakerlaken, Stubenfliegen |
| Einkaufsstraße | Ratten, Gullyratten, Wespen |
| Hochhaus | Putzroboter, Tacker, Drohnen (auf allen Etagen) |
| Grillpark | Wespen, Maulwürfe, Frösche, Mistkäfer |
| Badebucht | Einsiedlerkrebse, Bremsen, Möwen |
| Hafen | Ratten, Hafenkrebse, Möwen |
| Dorf | Hühner, Gänse, Bienen, Kröten |
| Kanalsystem | Ratten, Kakerlaken, Fledermäuse |

Läufer stürmen nach kurzem Ducken los, Frösche und Tacker hüpfen heran, Flieger kreisen und stoßen herab (unten sind sie beißbar), Maulwürfe und Gullyratten schießen aus dem Boden. **BISS** oder **TRILLERN** besiegt sie; Gepanzerte (Kakerlake, Käfer, Krebse) erst mit Trillern umdrehen, dann beißen. **BELLEN** macht Gegner benommen, der **Bauchklatscher** erledigt alles ringsum. Jeder besiegte Gegner gibt einen Krümel fürs Portemonnaie, ist Moll verletzt, springt oft ein Leckerli heraus, das ein Herz heilt. Die Pause zeigt, wie viele Gegner der Welt besiegt sind; alle besiegt = +25 Krümel.

Schnellreise-Punkte in jeder Welt, ein Kompass zeigt zum nächsten unentdeckten Punkt, die Pause zeigt alle Knochen der aktuellen Welt. Nach der Kanalratte und bei 118/118 läuft ein Abspann.

Tests (Server auf Port 8077, Playwright nötig): `node tests/worlds.mjs <ordner> hub,kueche,strasse,buero,park,hafen,dorf,kanal` spielt jede Welt beim ersten Besuch auf 11/11 und holt danach mit allen Fähigkeiten die Rückkehr-Knochen (13/13), `node tests/abilities.mjs` lernt jede Fähigkeit bei Heribert und spielt sie mit und ohne durch, `node tests/strand.mjs` die Badebucht, `node tests/playtest.mjs` Rattenrennen, Albtraum und Garten, `node tests/kopf.mjs` das Kopf-Tracking zwischen Moll und NPCs, `node tests/ball.mjs` den rollenden Ball und den Ball im Maul, `node tests/dialog.mjs` Gespräche, Stimmen und Schreibmaschinen-Text, `node tests/gegner.mjs` die Gegner (Biss, Trillern, Panzer, Bellen, Flieger, Maulwurf, Leckerli). `node tests/previews.mjs` rendert die Portal-Vorschaubilder (previews/*.jpg) neu, wenn sich der Startpunkt einer Welt ändert.

Spieldesign, Welten und Roadmap stehen in [docs/GDD.md](docs/GDD.md).
