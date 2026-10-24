// Pausemenü: was es je Welt zu holen gibt und was schon geschafft ist (im Comic-Stil des HUD)
import { BONES, TOTAL_BONES, WORLD_NAMES, LEVELS, BACKTRACK } from './levels.js';
import { ABILITIES, UPGRADES } from './abilities.js';
import { ICON, GOAL_ICON } from './hud.js';

// Ab wie vielen Goldknochen das Portal im Garten aufgeht (garten.js baut die Portale damit)
export const PORTAL_NEED = { kueche: 0, strasse: 3, buero: 8, park: 14, rattenrennen: 18, strand: 22, hafen: 30, dorf: 40, kanal: 52 };
// Welche Fähigkeit Opa Bruno in welcher Welt beibringt (Zoomies gibt es für den Sieg im Rattenrennen)
export const WORLD_ABILITY = { hub: 'apportieren', kueche: 'trillern', strasse: 'bellen', buero: 'bauchklatscher', park: 'buddeln', rattenrennen: 'zoomies', hafen: 'gleiten', dorf: 'wandsprung', kanal: 'tornado' };

const NAME = {
  boss: 'Boss', kruemel: 'Alle Krümel', geheim: 'Geheimnis', kletter: 'Kletterweg',
  huegel: 'Hügel', teich: 'Teich', baumhaus: 'Baumhaus', vogelhaus: 'Vogelhaus', gewaechshaus: 'Gewächshaus', schuppen: 'Schuppen', aussicht: 'Aussicht', zwerge: 'Gartenzwerge', apport: 'Apportieren',
  vorrat: 'Vorrat', regal: 'Regal', treppe: 'Treppe', uhr: 'Kuckucksuhr', keller: 'Keller', socken: 'Socken', trillern: 'Trillern',
  daecher: 'Dächer', kaufhaus: 'Kaufhaus', baustelle: 'Baustelle', brunnen: 'Brunnen', eisdiele: 'Eisdiele', bahnhof: 'Bahnhof', bellen: 'Bellen',
  kopierer: 'Kopierer', chef: 'Amtsleiter', server: 'Aktenarchiv', fenster: 'Fenster', tassen: 'Kaffeetassen', antenne: 'Antennenmast', stampfen: 'Bauchklatscher',
  turm: 'Turm', insel: 'Insel', dachsbau: 'Dachsbau', baumkrone: 'Baumkrone', parcours: 'Parcours', picknick: 'Picknick', buddeln: 'Buddeln',
  sieg: 'Rennen gewonnen', gierig: 'Vielfraß',
  riesenrad: 'Riesenrad', schatz: 'Schatz', leuchtturm: 'Leuchtturm', ringe: 'Ringe', sandburg: 'Sandburg', rennen: 'Wettrennen', muscheln: 'Muscheln',
  kran: 'Kran', markt: 'Fischmarkt', mole: 'Mole', laderaum: 'Laderaum', anker: 'Anker', bojen: 'Bojen', gleiten: 'Gleiten',
  muehle: 'Mühle', scheune: 'Scheune', huehner: 'Hühner', burg: 'Burg', baecker: 'Bäcker', wand: 'Wandsprung',
  pumpe: 'Pumpe', rohre: 'Rohre', becken: 'Becken', gully: 'Gully', nest: 'Rattennest', lampen: 'Lampen', tornado: 'Tornado',
};
// Knochen, die man mit der neuen Fähigkeit der Welt holt
const ABILITY_BONE = { apport: 'apportieren', trillern: 'trillern', bellen: 'bellen', stampfen: 'bauchklatscher', buddeln: 'buddeln', gleiten: 'gleiten', wand: 'wandsprung', tornado: 'tornado' };
const TASKS = ['boss', 'sieg', 'gierig', 'kruemel', ...Object.keys(ABILITY_BONE)];
const name = id => NAME[id] || id[0].toUpperCase() + id.slice(1);
const tag = id => id === 'boss' ? '👑' : id === 'geheim' ? '👃' : ABILITY_BONE[id] ? ABILITIES[ABILITY_BONE[id]].icon : id === 'kruemel' ? '✦' : '';

// Rückkehr-Knochen: brauchen eine Fähigkeit aus einer späteren Welt (oder ein Upgrade aus Opas Laden)
function backTile(g, key, id) {
  const need = BACKTRACK[key][id], a = ABILITIES[need] || UPGRADES.find(u => u.id === need), ok = g.hasBone(key, id), can = g.has(need);
  return `<div class="bt back ${ok ? 'ok' : can ? 'can' : ''}">${ICON.bone(ok)}<span>${ok ? 'Geholt' : can ? 'Jetzt holen!' : 'Braucht'} ${a.name}</span><i>${can || ok ? a.icon : '🔒'}</i></div>`;
}
function boneTile(g, key, id) {
  const ok = g.hasBone(key, id), t = tag(id);
  return `<div class="bt ${ok ? 'ok' : ''}">${ICON.bone(ok)}<span>${name(id)}</span>${t ? `<i>${t}</i>` : ''}</div>`;
}
const chip = (icon, label, val, done) => `<div class="chip ${done ? 'ok' : ''}">${icon}<span><small>${label}</small><b>${val}</b></span></div>`;

export function pauseHTML(g) {
  const L = g.level, key = L && !L.isRunner && BONES[L.key] ? L.key : null, bones = g.boneCount();
  let html = `<div class="pz"><div class="pzHead"><span class="pzTitle">Pause</span>`
    + `<span class="pill">${ICON.bone(true)}<b>${bones}</b>/${TOTAL_BONES}</span><span class="pill">${ICON.crumb()}<b>${g.save.crumbs}</b></span></div>`;
  if (key) {
    const chips = [];
    if (L.goal.need) chips.push(chip(ICON.badge(GOAL_ICON[L.goal.kind] || '⭐'), 'Futter für den Boss', `${L.goal.have}/${L.goal.need}`, L.goal.have >= L.goal.need));
    chips.push(chip(ICON.crumb(), 'Krümel', `${L.crumbHave}/${L.crumbTotal}`, L.crumbHave >= L.crumbTotal));
    const alive = (L.foes?.length || 0) - (L.foesGone || 0);
    if (alive > 0) chips.push(chip(ICON.badge('💥'), 'Gegner besiegt', `${L.foesDown}/${alive}`, L.foesDown >= alive));
    const ab = WORLD_ABILITY[key];
    if (ab) chips.push(chip(ICON.badge(ABILITIES[ab].icon), g.has(ab) ? 'Fähigkeit gelernt' : 'Bei Opa Bruno lernen', ABILITIES[ab].name, g.has(ab)));
    const back = Object.keys(BACKTRACK[key] || {}), ids = BONES[key].filter(id => !back.includes(id)), tasks = ids.filter(id => TASKS.includes(id)), rest = ids.filter(id => !TASKS.includes(id)).sort((a, b) => (a === 'geheim') - (b === 'geheim'));
    const p = g.levelProgress(key);
    html += `<div class="pzWorld"><h4>${WORLD_NAMES[key]} <span>${p.have}/${p.total} ${ICON.bone(true)}</span></h4><div class="chips">${chips.join('')}</div>`
      + `<div class="lbl">Aufgaben</div><div class="bones">${tasks.map(id => boneTile(g, key, id)).join('')}</div>`
      + `<div class="lbl">Entdecken</div><div class="bones">${rest.map(id => boneTile(g, key, id)).join('')}</div>`
      + (back.length ? `<div class="lbl">Später zurückkommen</div><div class="bones">${back.map(id => backTile(g, key, id)).join('')}</div>` : '') + '</div>';
  }
  html += `<div class="lbl">Alle Welten</div><div class="worlds">${Object.keys(BONES).map(k => {
    const p = g.levelProgress(k), need = PORTAL_NEED[k] ?? 0, locked = bones < need, st = g.save.worlds[k], def = LEVELS[k];
    const crumbs = st?.crumbTotal ? `${ICON.crumb()} ${st.crumbs.length}/${st.crumbTotal}` : '';
    const food = def?.need && st?.goals ? ` ${ICON.badge(GOAL_ICON[def.goalKind] || '⭐')} ${Math.min(st.goals.length, def.need)}/${def.need}` : '';
    return `<div class="wc ${p.have === p.total ? 'ok' : ''} ${locked ? 'lock' : ''} ${k === key ? 'here' : ''}"><b>${WORLD_NAMES[k]}</b>`
      + (locked ? `<small>🔒 ab ${need} ${ICON.bone(true)}</small>` : `<div class="bar"><i style="width:${p.have / p.total * 100}%"></i></div><small>${ICON.bone(true)} ${p.have}/${p.total}${food} ${crumbs}</small>`) + '</div>';
  }).join('')}</div></div>`;
  return html;
}
