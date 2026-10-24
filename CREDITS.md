# Credits

Alle Grundkörper-Modelle, Texte, Musik und Geräusche sind für Moll64 selbst gemacht (Code in `src/`).
Fertige Low-Poly-Modelle liegen als GLB unter `assets/` und werden über `src/assets.js` geladen.

## Eigene Modelle
| Dateien | Herkunft |
|---|---|
| `assets/autos/*.glb` (rotes, blaues, gelbes Auto, Lieferwagen) | in Blender gebaut mit `tools/make_cars.py` |
| `assets/figuren/*.glb` (Hund für NPCs, Ratte, Taube, Möwe, Kater, Krabbe, Staubsauger, Dosenöffner, Einkäufer, Riesenmuschel) | in Blender gebaut, bewegliche Teile als Knoten |
| `assets/gegner/*.glb` (kleine Gegner) | in Blender gebaut |
| `assets/tiere/*.glb`, `assets/deko/{ball,kuckucksuhr}.glb` | in Blender gebaut |
| `assets/pflanzen/*.glb`, `assets/deko/gartenzwerg.glb`, `assets/sammeln/{ice,bone,treat,sock,cup}.glb` | in Blender gebaut (einfarbige Materialien) |
| `assets/sammeln/*.glb` (Goldknochen, Keks, Wurst, Brot, Schinken, Käse, Fisch, Pommes, Muschel) | für Moll64 generiert mit Scenario (Meshy, Text-zu-3D), verkleinert mit `tools/shrink_glb.py` |

## Heruntergeladene Modelle (CC0)
| Dateien | Paket | Urheber | Lizenz |
|---|---|---|---|
| `assets/kenney-car/taxi.glb`, `police.glb`, `cone.glb`, `box.glb` | [Car Kit 3.1](https://kenney.nl/assets/car-kit) | Kenney (www.kenney.nl) | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |

Fremde Modelle mit Textur-Palette werden vor dem Einchecken mit `tools/lowpoly.py` umgewandelt
(Palette → Vertexfarben, ohne UVs/Tangenten, Normalen als int8). CC0 verlangt keine Nennung – wir nennen trotzdem alle.

## Bibliotheken
| Datei | Herkunft | Lizenz |
|---|---|---|
| `vendor/three.module.js`, `vendor/GLTFLoader.js`, `vendor/BufferGeometryUtils.js` | [three.js](https://threejs.org) r160 | MIT |
