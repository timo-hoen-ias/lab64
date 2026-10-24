// Kanalsystem: Gerümpel, Fässer, Reifen, Müllsäcke und leuchtende Pilze in allen Ecken, Rohre an den Wänden
// und eine Quietscheente, die jemand hier unten verloren hat.
import { cyl } from '../models.js';
import * as P from '../requisiten.js';

export function kanal(d, l) {
  const junk = i => [[P.toxicBarrel(), P.barrel(0x57606f), P.crates(), P.tire(), P.trashBags(), P.junk(), P.glowShrooms(), P.pipeStack(), P.cart2(), P.boxes(2)][i % 10], { s: 1.4, solid: [[1, 1.1, 1], [1, 1.1, 1], [2.6, 2.2, 1.4], undefined, [1.6, 1, 1.2], [2, 0.8, 1.4], undefined, [1.7, 1.5, 3], [1.4, 1.2, 0.9], [0.9, 1.2, 0.7]][i % 10], w: 1, d: 1 }];
  [[-59, -27, -59, -27], [-59, -27, 27, 59], [27, 59, -59, -27], [27, 59, 27, 59], [27, 59, -27, 27], [-25, 25, -59, -27], [-25, 25, 27, 59]].forEach((r, k) => d.scatter(r, 9, i => junk(i + k * 3)));
  d.scatter([-19, -5, -26, 26], 5, i => junk([0, 4, 6, 3, 9][i]));
  d.scatter([5, 19, -26, 26], 5, i => junk([1, 6, 4, 9, 3][i]));
  d.put(P.rubberDuck(), 22, 30, { s: 2, w: 0.6, d: 0.6 });
  // Rohre an den Außenwänden
  const pipe = (x, z, len, rx, y = 8.5) => { const p = cyl(0.5, 0.5, len, 0x8395a7, 0, 0, 0, 8); p.rotation[rx ? 'x' : 'z'] = Math.PI / 2; p.userData.merge = true; l.deco(p, x, y, z); };
  pipe(-59, 0, 110, true); pipe(59, 0, 110, true); pipe(0, -59, 110, false); pipe(0, 59, 110, false);
  pipe(-59, 0, 110, true, 7.2); pipe(0, 59, 110, false, 7.2);
}
