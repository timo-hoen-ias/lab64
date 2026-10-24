// PWA: Service Worker, Installieren-Knopf, Vollbild + Querformat beim Spielstart.
const standalone = matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches || navigator.standalone;
const touch = matchMedia('(pointer: coarse)').matches;

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

// Vollbild + Querformat geht nur nach einer Nutzeraktion, also beim Tippen auf „Spielen“ / „Weiter“.
async function goFullscreen() {
  if (!touch && !standalone) return; // am Desktop nicht ungefragt in Vollbild springen
  const el = document.documentElement;
  try {
    if (!document.fullscreenElement && el.requestFullscreen) await el.requestFullscreen({ navigationUI: 'hide' });
  } catch (e) { /* z. B. iOS-Safari: kein Fullscreen-API */ }
  try { await screen.orientation?.lock?.('landscape'); } catch (e) { /* nur im Vollbild / installiert erlaubt */ }
}
document.getElementById('btnStart').addEventListener('click', goFullscreen);

// Installieren-Knopf im Menü (Chrome/Android liefert beforeinstallprompt)
const btn = document.getElementById('btnInstall');
let deferred = null;
addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; btn.style.display = ''; });
btn.addEventListener('click', async () => {
  if (!deferred) return;
  deferred.prompt();
  await deferred.userChoice.catch(() => {});
  deferred = null; btn.style.display = 'none';
});
addEventListener('appinstalled', () => { deferred = null; btn.style.display = 'none'; });
