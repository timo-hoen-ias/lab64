# 🐕 MOLL – Der Labrador

Low-Poly-3D-Jump'n'Run im Stil von Mario 64 / Banjo-Kazooie, gebaut mit Three.js. Man spielt Moll, einen braunen Labrador, und frisst sich durch Erdgeschoss, Einkaufsstraße, Hochhaus, Grillpark, Badestrand, Hafen, Dorf und Kanalsystem – große Welten im Banjo-Kazooie-Format mit vielen Bereichen und Ebenen. Die Bosse: Staubsauger, Kater, Dosenöffner, Möwe, Obertaube und die Ratte, die Moll in einen Albtraum aus Emmentaler schickt.

![Molls Garten](docs/screenshots/garten.png)

## Starten
Ohne Build-Schritt. Irgendeinen statischen Webserver im Repo-Ordner starten:
```bash
python3 -m http.server 8000
# → http://localhost:8000
```
Online spielen: **https://timo-hoen-ias.github.io/lab64/** – wird bei jedem Push auf `main` per GitHub Actions veröffentlicht (`.github/workflows/pages.yml`).

## Steuerung
| | Tastatur | Gamepad | Touch |
|---|---|---|---|
| Laufen | WASD / Pfeile | linker Stick | Stick links |
| Kamera | Q / R | rechter Stick | rechts wischen |
| Sprung / Doppelsprung | Leertaste | A | SPRUNG |
| Biss | Shift / E | X | BISS |
| Nase (halten) | F | Y | NASE |
| Pause | Esc | Start | II |

![Welten](docs/screenshots/welten-v2.png)

**Stand:** 92 Goldknochen. Jede Welt hat 10, alle in **einem Besuch** zu holen (Boss, alle Krümel, Geheimversteck und Knochen in jedem Bereich), dazu 10 im Garten und 2 im Rattenrennen.

| Welt | Bereiche |
|---|---|
| Garten (Hub, 160 m) | Haus, Teich zum Tauchen, Schuppen mit Werkstatt, Obstwiese mit Baumhaus, Gewächshaus, Aussichtshügel, 5 Gartenzwerge |
| Erdgeschoss | Küche, Speisekammer, Wohnzimmer mit Bücherregal, Flur mit Galerie und Standuhr, Wintergarten, Keller |
| Einkaufsstraße | Dächer-Parcours, Kaufhaus mit 3 Etagen, Baustelle, Brunnenplatz mit Fontänen, Bahnhof |
| Hochhaus | 4 Ebenen: Großraumbüro, Konferenz + Chefbüro, Serverraum + Kaffeeküche, Dach mit Antennenmast |
| Grillpark | Grillwiese, See mit Insel, Wald mit Baumkronenpfad, Spielplatz, Aussichtsturm, Dachsbau |
| Badebucht | Strand, Riff zum Tauchen, Wrack, Leuchtturm, Riesenrad, Dünen |
| Hafen | Holzkai, Containerterminal mit Kran, Fischmarkt, Mole mit Leuchtturm, Frachter mit Laderaum |
| Dorf | Marktplatz, Windmühle, Burgruine, Bauernhof mit Hühnern, Dorfteich, Bäckerei |
| Kanalsystem | Haupthalle, Pumpwerk, Rohr-Labyrinth, Klärbecken, Gully-Schacht, Rattennest |

Schnellreise-Punkte in jeder Welt, ein Kompass zeigt zum nächsten unentdeckten Punkt, die Pause zeigt alle Knochen der aktuellen Welt. Nach der Kanalratte und bei 92/92 läuft ein Abspann.

Tests (Server auf Port 8077, Playwright nötig): `node tests/worlds.mjs <ordner> hub,kueche,strasse,buero,park,hafen,dorf,kanal` spielt jede Welt in einem Besuch auf 10/10, `node tests/strand.mjs` die Badebucht, `node tests/playtest.mjs` Rattenrennen, Albtraum und Garten.

Spieldesign, Welten und Roadmap stehen in [docs/GDD.md](docs/GDD.md).
