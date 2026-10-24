# 🐕 MOLL – Der Labrador

Low-Poly-3D-Jump'n'Run im Stil von Mario 64 / Banjo-Kazooie, gebaut mit Three.js. Man spielt Moll, einen braunen Labrador, und frisst sich durch Küche, Einkaufsstraße, Büro, Grillpark, Hafen, Dorf und Kanal. Die Bosse: Staubsauger, Kater, Dosenöffner, Möwe, Obertaube und die Ratte, die Moll in einen Albtraum aus Emmentaler schickt.

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

**Stand:** 32 Goldknochen in 9 Bereichen (Boss, alle Krümel, Geheimversteck, Kletterweg), 6 Bosse plus Ratten-Albtraum.

Test: `node tests/playtest.mjs` (Server auf Port 8077, Playwright nötig).

Spieldesign, Welten und Roadmap stehen in [docs/GDD.md](docs/GDD.md).
