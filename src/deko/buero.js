// Hochhaus: Pflanzen, Wasserspender, Aktenschränke, Sofas und Bürostühle auf allen Etagen, Klimageräte und
// Solarzellen auf dem Dach. Die Treppen-Rampen an den Außenwänden bleiben frei (siehe Deko.free).
import * as P from '../props.js';

const F1 = 12, F2 = 24, ROOF = 36;

export function buero(d, l) {
  const on = (y, mesh, x, z, o = {}) => d.put(mesh, x, z, { s: 1.7, ...o, y }); // Büro-Maßstab: etwa 1,7-fach
  // ---- EG: Lobby, Kantine, Druckerecke
  [[-24, 14], [22, 10], [-24, -27], [12, -28]].forEach(([x, z]) => on(0, P.bigPlant(1.3), x, z, { solid: [1.1, 1.8, 1.1] }));
  on(0, P.waterCooler(), -20, -28, { solid: [0.6, 1.8, 0.6] });
  for (const x of [-6, -3.5, 3.5, 6]) on(0, P.cabinet(0x95a5a6, 1.4), x, -30.6, { solid: [0.8, 1.4, 0.7] });
  on(0, P.sofa(0x0984e3, 3.4), 18, 28, { ry: Math.PI, solid: [3.4, 1.4, 1.3] });
  [[15.8, 20, Math.PI / 2], [20, 15.8, 0], [20, 24.2, Math.PI]].forEach(([x, z, ry]) => on(0, P.chair(0xe74c3c), x, z, { ry, solid: [0.6, 1.3, 0.6], margin: 0.1 }));
  // ---- 1. Stock: Sitzecke, Pflanzen, Aktenschränke
  on(F1, P.sofa(0x6c5ce7, 3.4), 14, 26, { ry: Math.PI, solid: [3.4, 1.4, 1.3] }); on(F1, P.table(1.6, 1, 0.5, P.DWOOD), 14, 22.5, { solid: [1.6, 0.6, 1] });
  [[-23, -28], [23, 28], [-4, 28], [23, -28]].forEach(([x, z]) => on(F1, P.bigPlant(1.2), x, z, { solid: [1, 1.6, 1] }));
  on(F1, P.waterCooler(), 22, -16, { solid: [0.6, 1.8, 0.6] });
  for (const x of [-20, -17.5, -15]) on(F1, P.cabinet(0x7f8c8d, 1.8), x, -30.6, { solid: [0.8, 1.8, 0.7] });
  // ---- 2. Stock: Kartons, Pflanzen, Sitzecke
  on(F2, P.boxes(3), 18, -8, { solid: [0.9, 1.8, 0.7] }); on(F2, P.boxes(2), 20, -10, { solid: [0.9, 1.2, 0.7], ry: 0.5 });
  [[20, -27], [-22, 8], [22, 4]].forEach(([x, z]) => on(F2, P.bigPlant(1.2), x, z, { solid: [1, 1.6, 1] }));
  on(F2, P.sofa(0xe17055, 3.4), -12, 20, { solid: [3.4, 1.4, 1.3] }); on(F2, P.rug(6, 4, 0x00b894), -12, 24.5, { s: 1, w: 6, d: 4, margin: 0, dy: 0.06 });
  on(F2, P.officeChair(0x0984e3), 2.5, 20, { w: 0.6, d: 0.6 });
  // ---- Dach: Klimageräte, Solarzellen, Rohre (Landeplatz bleibt frei)
  d.keepOut(0, 6, 9); d.keepOut(-22, -10, 4);
  [[14, -6], [20, -22]].forEach(([x, z]) => on(ROOF, P.acUnit(), x, z, { solid: [2, 1.3, 1.4] }));
  for (const x of [-6, 0, 6]) on(ROOF, P.solarPanel(), x, -22, { solid: [3, 1, 1.8] });
  on(ROOF, P.pipeStack(), -24, 16, { ry: Math.PI / 2, solid: [3, 1.5, 1.7] });
}
