// Hauptmenü und Optionen: Lautstärke Musik/Effekte, Grafikstufe, Vibration, Spielstand löschen.
// Die Einstellungen liegen im Spielstand (save.settings) und werden sofort gespeichert.
const QUALITY_HINT = {
  hoch: 'Volle Auflösung, weiche Schatten, große Sichtweite.',
  mittel: 'Etwas weniger Auflösung und Sichtweite – gut fürs Handy.',
  niedrig: 'Ohne Schatten und Effekte, kurze Sichtweite – für schwache Geräte.',
};
const $ = id => document.getElementById(id);

export class Menu {
  constructor(game) {
    this.game = game; this.card = document.querySelector('#menu .card'); this.options = false;
    const st = game.save.settings;
    st.music ??= 100; st.sfx ??= 100; st.vibration ??= true;
    this._slider('optMusic', 'music'); this._slider('optSfx', 'sfx');
    $('optQuality').addEventListener('click', e => {
      const q = e.target.closest('button')?.dataset.q; if (!q) return;
      game.save.settings.quality = q; game.persist(); game.applyQuality(); this.sync();
    });
    $('optVibe').addEventListener('click', e => {
      const v = e.target.closest('button')?.dataset.v; if (v === undefined) return;
      game.save.settings.vibration = v === '1'; game.persist(); this.apply(); this.sync();
      if (v === '1') game.input.vibrate(120);
    });
    $('btnOptions').addEventListener('click', () => this.show(true));
    $('btnBack').addEventListener('click', () => this.show(false));
    // Löschen braucht ein zweites Tippen; die Einstellungen bleiben erhalten
    const reset = $('btnReset');
    reset.addEventListener('click', () => {
      if (!reset.classList.contains('armed')) {
        reset.classList.add('armed'); reset.textContent = '⚠️ Wirklich löschen?';
        clearTimeout(this._resetT); this._resetT = setTimeout(() => this._disarm(), 3000); return;
      }
      this._disarm();
      const settings = game.save.settings;
      game.save = game.loadSave(true); Object.assign(game.save.settings, settings); game.persist(); game.updateCounter(); game.updateAbilityButtons?.();
      game.toast('Spielstand gelöscht');
    });
    this.apply(); this.sync();
  }
  _disarm() { const r = $('btnReset'); clearTimeout(this._resetT); r.classList.remove('armed'); r.textContent = '🗑️ Spielstand löschen'; }
  _slider(id, key) {
    const el = $(id);
    el.addEventListener('input', () => { this.game.save.settings[key] = +el.value; this.apply(); this.sync(); });
    el.addEventListener('change', () => { this.game.persist(); if (key === 'sfx') { this.game.audio.init(); this.game.audio.resume(); this.game.audio.sfx('collect'); } });
  }
  // Einstellungen an Ton und Eingabe weitergeben
  apply() {
    const st = this.game.save.settings;
    this.game.audio.setVolume(st.music / 100, st.sfx / 100);
    this.game.input.noVibrate = !st.vibration;
  }
  // Anzeige an den Spielstand anpassen
  sync() {
    const st = this.game.save.settings;
    for (const [id, key] of [['optMusic', 'music'], ['optSfx', 'sfx']]) {
      const el = $(id); el.value = st[key]; el.style.setProperty('--v', `${st[key]}%`);
      $(id + 'V').textContent = st[key] ? `${st[key]} %` : 'Aus';
    }
    $('optQuality').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.q === st.quality));
    $('optQualityHint').textContent = QUALITY_HINT[st.quality] || '';
    $('optVibe').querySelectorAll('button').forEach(b => b.classList.toggle('on', (b.dataset.v === '1') === !!st.vibration));
  }
  show(options) {
    this.options = options; this.card.classList.toggle('opts', options); this.card.scrollTop = 0;
    if (!options) this._disarm();
    this.sync(); (options ? $('btnBack') : $('btnStart')).focus({ preventScroll: true });
  }
}
