# MOLL – Der Labrador · Game Design Document (Entwurf v0.1)

3D-Collect-a-thon im Stil von Super Mario 64 / Banjo-Kazooie. Man spielt **Moll**, einen braunen Labrador, der sich durch die Hindernisse eines Hundelebens frisst.

- **Engine:** Three.js (Browser, kein Build-Schritt), später optional Electron/Steam-Wrapper
- **Plattformen:** Desktop, Mobile (Touch), Gamepad. Alle drei sind gleichwertig und überall voll spielbar.
- **Grafik:** Low-Poly, kräftige Farben, keine Texturen (Vertex-/Materialfarben), weiche Schatten
- **Audio:** fröhliche, hüpfende Chiptune-/Holzbläser-Musik pro Welt (prozedural, später komponiert), Effekte zum Mitwippen
- **Ziel-Spielzeit:** ca. 5 Stunden bis 100 %

---

## 1. Kern-Mechaniken

| Aktion | Tastatur | Gamepad | Touch |
|---|---|---|---|
| Laufen | WASD / Pfeile | linker Stick | virtueller Stick links |
| Kamera | Q / R | rechter Stick | auf der rechten Bildhälfte wischen |
| Springen / Doppelsprung (Salto) | Leertaste | A | SPRUNG |
| Biss (Angriff, Schubladen, Schalter) | Shift / E | X / B | BISS |
| Nase (versteckte Items aufspüren) | F (halten) | Y / RB | NASE (halten) |
| Pause | Esc | Start | II |
| Runner: Spurwechsel / Sprung | A/D, Leertaste | Stick / D-Pad, A | wischen links/rechts/hoch |

**Später geplante Moves** (werden im Spielverlauf freigeschaltet, à la Banjo):
- **Bauchrutscher** über glatte Böden (Küche, Eis im Kühlhaus)
- **Buddeln** an weichen Stellen: Geheimgänge, vergrabene Knochen
- **Bellen** (Schockwelle): betäubt kleine Gegner, löst Schalter aus
- **Schwimmen** (Hafen-Update)
- **Hundeblick** (Betteln): NPCs geben einmalig Futter, wenn sie nicht gestresst sind
- **Zoomies**: kurzer Sprint nach 10 gesammelten Krümeln in Folge

## 2. Sammelobjekte

| Objekt | Anzahl (Endausbau) | Zweck |
|---|---|---|
| 🦴 **Goldknochen** | 60 (6 pro Welt) | Hauptwährung, öffnet Welten (wie die Sterne in Mario 64) |
| ✦ **Krümel** | 100 pro Welt | 100 Stück = 1 Bonus-Goldknochen |
| 🍖 **Levelfutter** (Schinken, Brote, Fische …) | 6–12 pro Auftrag | Missionsziel, danach erscheint der Boss oder ein Goldknochen |
| 🎾 **Tennisbälle** | 5 pro Welt | Minispiele beim Hundetrainer im Garten |
| 🏷️ **Hundemarken** | 3 pro Welt | Kostüme (Halstuch, Pilotenbrille, Partyhut, Taucherbrille …) |
| 🐾 **Pfotenabdrücke** | 1 Geheimweg pro Welt | Führt zu einem versteckten Raum |

## 3. Welten & Bosse

Jede Welt hat 6 Goldknochen: 1 Hauptmission mit Boss, 4 Nebenmissionen, 1 für 100 Krümel.

| # | Welt | Hauptmission | Boss | Spielzeit |
|---|---|---|---|---|
| 0 | **Molls Garten** (Hub) | Tutorial, Ringe zu den Welten | – | 10 min |
| 1 | **Die Küche** | 8 Schinken sammeln | **Der Staubsauger**: saugt Moll an, rammt, bleibt an der Wand stecken | 25 min |
| 2 | **Die Einkaufsstraße** | 12 Essensreste finden | **Der große Kater**: lauert, springt mit Vorwarnung, ist nach der Landung benommen | 30 min |
| 3 | **Das Büro** | Leckerli in Schubladen erschnüffeln und herausbeißen | **Der Dosenöffner**: bewacht die Thunfischdose, schlägt mit der Klinge zu, steckt danach im Boden fest | 30 min |
| 4 | **Der Grillpark** | Dem dicken Mann folgen, aufheben, was er verliert, nicht erwischt werden (Büsche = Versteck) | Schleich-Finale: Würstchen aus seiner Tüte stibitzen | 25 min |
| 5 | **Rattenrennen** | Runner auf 3 Spuren gegen die Ratte (Moll links, Ratte rechts), mehr Futter sammeln als sie | Die Ratte | 15 min |
| 6 | **Der Hafen** | Die Möwe hat Essen gestohlen und versteckt → mit der Nase suchen | **Die Möwe**: kreist, stürzt herab, muss verschnaufen | 30 min |
| 7 | **Das Dorf** | Tauben haben Brote versteckt → finden, Taubenschwärme verscheuchen | **Die Obertaube** | 30 min |
| 8 | **Der Kanal** | Käse der Ratte stehlen | **Die Kanalratte**: nicht zu besiegen, schlägt Moll k.o. → | 20 min |
| 8b | **Albtraum: Emmentaler-Höhlen** | Moll erwacht im Käselabyrinth: Runner durch Käsetunnel und -höhlen gegen die Ratte | Die Albtraum-Ratte (Sieg = Aufwachen) | 20 min |
| 9 | **Tierarztpraxis** *(geplant)* | Spritzen ausweichen, aus dem Wartezimmer fliehen | **Das Fieberthermometer** | 30 min |
| 10 | **Die Badewanne** *(Finale, geplant)* | Durch das ganze Haus fliehen | **Die Badewanne mit Shampoo-Flasche**, 3 Phasen | 35 min |

**Bonus/Endgame** (ca. 45 min): Zeitrennen in jeder Welt, „Leckerli-Lieferdienst“-Missionen im Hub, Kostüme, Krümel-Jagd bis 100 %.

**Summe:** etwa 5 h für die Hauptpfade plus Sammeln.

### Story-Rahmen
Frauchen hat den Kühlschrank abgeschlossen. Der Staubsauger, eigentlich ein Wachroboter, hat sich zum „Chef der Ordnung“ erklärt und alle Leckerli des Viertels an seine Handlanger (Kater, Möwe, Tauben, Ratte) verteilt. Moll holt sich jeden Krümel zurück. Twist im Kanal: Die Ratte schlägt Moll k.o., und der Albtraum im Käselabyrinth ist der Wendepunkt. Danach weiß Moll, wo das Versteck des Staubsaugers ist (Finale im Bad).

## 4. Boss-Designregeln
- Jeder Boss hat ein lesbares Muster: **Vorwarnung → Angriff → Verwundbarkeitsfenster** (benommen = beißen)
- 3 Treffer, ab Treffer 2 schneller
- Lustig statt gruselig: Glupschaugen, Quietsch-Sounds, Slapstick bei der Niederlage

## 5. Präsentation
- **Kamera:** 3rd-Person mit Wandkollision, frei drehbar; im Runner fest hinter Moll
- **Animationen:** schwingender Schwanz, flatternde Ohren beim Sprung, Squash & Stretch bei der Landung, Salto beim Doppelsprung, hechelnde Zunge beim Rennen
- **Musik:** pro Welt eigene Tonart/Tempo (Küche Mixolydisch 132 BPM, Kanal Moll 120 BPM, Albtraum „spooky“ 150 BPM). Geplant: dynamische Instrumentierung wie in Banjo (unter Wasser gedämpft, beim Boss Pauken dazu)

## 6. Technik
```
index.html        – HUD, Touch-Buttons, Menü
src/main.js       – Einstieg
src/game.js       – Spielzustand, Kamera, HUD, Speicherstand (localStorage)
src/input.js      – Tastatur + Touch + Gamepad zu einer Eingabe vereint
src/player.js     – Moll: Physik, Sprung, Biss, Nase, AABB-Kollision
src/level.js      – Level-Baukasten (Blöcke, Pickups, Portale, Interaktionen)
src/levels.js     – alle 3D-Welten
src/bosses.js     – Bosse und Gegner-KI
src/runner.js     – Runner-Modus (Rattenrennen + Albtraum)
src/models.js     – Low-Poly-Modelle aus Grundkörpern
src/audio.js      – prozedurale Musik und Effekte (WebAudio)
vendor/           – three.js r160 (lokal, offline-fähig)
```

## 7. Stand Prototyp (v0.2)

32 Goldknochen sind spielbar:

| Welt | Knochen | Wie |
|---|---|---|
| Garten | 2 | Hügel-Plattformen · hinter dem Haus erschnüffeln |
| Küche, Straße, Büro, Grillpark, Hafen, Dorf, Kanal | je 4 | **Boss** (bzw. Hauptmission) · **alle Krümel** · **Geheimversteck** (Nase) · **Kletterweg** |
| Rattenrennen | 2 | gewinnen · gewinnen mit 30+ Würstchen |
| Kanal-Boss | – | kommt erst durch den Sieg im Albtraum |

Kletterwege: Küche Wandregale, Straße Ladenschild aufs Dach, Büro Aktenschränke, Grillpark Holzstapel, Hafen Containertreppe auf den Kranarm, Dorf Kirchturm, Kanal Mauervorsprünge.

Portalkosten: Küche 0 · Straße 2 · Büro 4 · Grillpark 7 · Rattenrennen 9 · Hafen 12 · Dorf 15 · Kanal 19.

Bosse werden nach jedem Treffer ca. 30 % schneller (Phase 2/3). Bereits gesammelte Knochen erscheinen durchsichtig.

`tests/playtest.mjs` (Playwright) holt automatisch alle 32 Knochen, besiegt alle Bosse und gewinnt beide Rennen.

## Fähigkeiten-Progression
Moll lernt in jeder Welt **eine** neue Fähigkeit bei Heribert direkt am Eingang (wie Bottles bei Banjo-Kazooie). Regeln:
- Beim ersten Besuch schafft man 11 Knochen je Welt mit den bis dahin gelernten Fähigkeiten.
- **Backtracking:** Jede Welt hat 2 Rückkehr-Knochen (`BACKTRACK` in `src/levels.js`), die eine Fähigkeit aus einer *späteren* Welt brauchen (im Kanal: die Supernase aus dem Laden). Man sieht sie schon beim ersten Besuch, ein Schild mit dem Fähigkeiten-Symbol zeigt, was fehlt. Nach dem Lernen nennt das Spiel die Welten, in denen jetzt neue Knochen warten. Gesamt: 118 Goldknochen. Die Portalschwellen (max. 52) sind ohne Rückkehr-Knochen erreichbar.
- Dazu je Welt ein **Rückkehr-Rätsel** (`NEEDS` in `src/puzzles.js`, wird in `BACKTRACK` eingetragen) – siehe Abschnitt Rätsel.
- Der Boss jeder Welt reagiert auf ihre Fähigkeit (Trillern → Staubsauger, Bellen → Kater, Bauchklatscher → Dosenöffner, Gleiten → Möwe, Tornado → Kanalratte).
- Krümel sind die Währung für reine Werte-Upgrades in Heriberts Leckerli-Laden im Garten.

Übersicht und Steuerung: README, Code: `src/abilities.js` (Texte, Laden, Bausteine wie `teacher`, `spinTarget`, `barkTarget`, `stompPad`, `crate`, `digSpot`, `climbWall`, `updraft`, `fetchItem`, `backbone` für Rückkehr-Knochen) und `src/player.js` (`_abilities`). Test: `tests/abilities.mjs`.

## Rätsel
Je Welt zwei bis drei Banjo-Kazooie-Knobeleien mit eigenem Goldknochen (`PUZZLES` in `src/puzzles.js`, Liste im README): Memory, Melodie nachspielen (beißen, bellen oder trillern), Umdreh-Fliesen, Maulwurf-Klopfen, Kerzen auspusten, Wort stempeln, Zeitschalter mit Käfig oder Plattformen auf Zeit. Gebaut wird nach `def.build` mit festen Koordinaten (wie `details.js`) – wer eine Welt umbaut, muss die Rätsel-Koordinaten mitziehen. Deko und Gegner halten Abstand. Test: `tests/raetsel.mjs`.

## 8. Roadmap
1. **Prototyp (jetzt):** alle Welten spielbar, je 1 Hauptmission + Boss
2. **Vertical Slice Küche:** 6 Goldknochen, Bauchrutscher, Feinschliff
3. **Modelle:** Blender-Low-Poly (glTF) statt Grundkörpern, richtige Rigs für Moll
4. **Musik:** komponierte Tracks pro Welt
5. Welten 9–10, Kostüme, Zeitrennen
6. Steam-Build (Electron), Steam-Input-Gamepad, Achievements
