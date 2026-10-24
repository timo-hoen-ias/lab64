import { Game } from './game.js';
import { loadAssets } from './assets.js';
// Schriften gleich mitladen: die Holzschilder in den Welten werden einmalig auf Canvas gemalt
const fonts = Promise.all(['700 40px Fredoka', '40px "Luckiest Guy"'].map(f => document.fonts.load(f))).catch(() => {});
await loadAssets(); // heruntergeladene Low-Poly-Modelle vor dem Start laden (scheitert es, bauen die Welten ihre Grundkörper)
await fonts;
window.game = new Game();
