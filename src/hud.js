// HUD im Banjo-Kazooie-Stil: kleine gezeichnete Symbole (SVG) und Zähler, die hereinrutschen,
// beim Sammeln hüpfen und nach ein paar Sekunden wieder verschwinden.
const INK = '#3b2412';
// Erst alle Formen dick in Tinte, dann dieselben Formen in Farbe darüber: ergibt eine saubere Umrandung
const outlined = (shapes, fill, w = 3.2) => `<g fill="${INK}" stroke="${INK}" stroke-width="${w}" stroke-linejoin="round">${shapes}</g><g fill="${fill}">${shapes}</g>`;
const svg = (body, cls = '') => `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;

const HEART = 'M12 21.2s-7.6-4.7-9.7-9.4C.8 8.3 2.9 4.3 6.7 4.3c2.1 0 3.6 1.2 4.4 2.6h1.8c.8-1.4 2.3-2.6 4.4-2.6 3.8 0 5.9 4 4.4 7.5C19.6 16.5 12 21.2 12 21.2z';
const BONE = '<circle cx="5.2" cy="8.6" r="3.1"/><circle cx="5.2" cy="15.4" r="3.1"/><circle cx="18.8" cy="8.6" r="3.1"/><circle cx="18.8" cy="15.4" r="3.1"/><rect x="5.2" y="9" width="13.6" height="6" rx="2"/>';

export const GOAL_ICON = { ham: '🍖', bread: '🥖', treat: '🦴', sausage: '🌭', fish: '🐟', cheese: '🧀', fries: '🍟' };

export const ICON = {
  heart: full => svg(full
    ? outlined(`<path d="${HEART}"/>`, '#ef4b3c') + `<path d="M5.4 7.6c.9-1.4 2.6-1.8 3.8-1" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" opacity=".85"/><path d="M12 19.2c2.8-1.9 6.2-4.8 7.3-7.6" fill="none" stroke="#b42a22" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>`
    : outlined(`<path d="${HEART}"/>`, '#7c5c45') + `<path d="M5.4 7.6c.9-1.4 2.6-1.8 3.8-1" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" opacity=".3"/>`, full ? 'heart' : 'heart off'),
  bone: (gold = true) => svg(gold ? outlined(BONE, '#ffd34d') + '<path d="M7 11h9" stroke="#fff6c8" stroke-width="1.6" stroke-linecap="round"/><circle cx="4.4" cy="7.6" r="1" fill="#fff6c8"/>' : outlined(BONE, '#bba48c'), gold ? '' : 'off'),
  crumb: () => svg(outlined('<path d="M12 2.8c4.7 0 9.2 3.6 9.2 8.8 0 5.4-4.1 9.6-9.4 9.6-5 0-9-3.9-9-9 0-5.6 4.4-9.4 9.2-9.4z"/>', '#e3a857')
    + '<g fill="#6b3a1a"><circle cx="8.4" cy="9" r="1.5"/><circle cx="14.6" cy="7.6" r="1.2"/><circle cx="15.8" cy="13.4" r="1.6"/><circle cx="9.6" cy="15.2" r="1.3"/><circle cx="12.4" cy="11.6" r=".9"/></g><path d="M6.2 7.2c1-1.6 2.6-2.4 4-2.6" fill="none" stroke="#ffe2a8" stroke-width="1.4" stroke-linecap="round"/>'),
  // Futter der Welt (Schinken, Brot …) und Sonstiges: Emoji in einem runden Abzeichen
  badge: emoji => `<span class="ico badge">${emoji}</span>`,
};

// rows: [{ k: Schlüssel, icon: HTML, text: Anzeige, quiet: nicht hüpfen }] – nur geänderte Zeilen hüpfen
export class Counters {
  constructor(el) { this.el = el; this.last = ''; this.vals = {}; this.sig = ''; this.t = 0; this.stay = false; }
  set(rows, { stay = false } = {}) {
    this.stay = stay; if (stay) this.el.classList.add('show');
    const key = rows.map(r => r.k + ':' + r.text).join('|'); if (key === this.last) return; this.last = key;
    const sig = rows.map(r => r.k + r.icon).join(), sameRows = sig === this.sig; this.sig = sig;
    const old = this.vals, changed = sameRows ? rows.filter(r => !r.quiet && old[r.k] !== r.text) : [];
    this.vals = Object.fromEntries(rows.map(r => [r.k, r.text]));
    // gleiche Zeilen: nur Zahlen tauschen, damit laufende Hüpfer nicht abbrechen
    if (sameRows) for (const r of rows) this.el.querySelector(`[data-k="${r.k}"] .num`).textContent = r.text;
    else this.el.innerHTML = rows.map(r => `<div class="cnt" data-k="${r.k}"><span class="num">${r.text}</span>${r.icon}</div>`).join('');
    for (const r of changed) { const row = this.el.querySelector(`[data-k="${r.k}"]`); row.classList.remove('bump'); void row.offsetWidth; row.classList.add('bump'); }
    if (changed.length && !stay) this.show();
  }
  // Hereinrutschen lassen und nach ms wieder verstecken
  show(ms = 4500) {
    this.el.classList.add('show'); clearTimeout(this.t);
    if (!this.stay) this.t = setTimeout(() => this.el.classList.remove('show'), ms);
  }
}
