import { Game } from './game.js';
import { loadAssets } from './assets.js';
await loadAssets(); // heruntergeladene Low-Poly-Modelle vor dem Start laden (scheitert es, bauen die Welten ihre Grundkörper)
window.game = new Game();
