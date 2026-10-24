// Deko-Requisiten als Low-Poly-Modelle aus Blender (assets/requisiten, ein GLB je Funktion aus props.js).
// Gleiche Namen und Parameter wie props.js; die Welten importieren von hier. Größen-Parameter (s) skalieren das Modell,
// Farb-Parameter färben die Standardfarbe samt Schattierungen um. Weicht ein anderer Parameter (Länge, Höhe, Anzahl …)
// vom Standard ab oder fehlt das Modell, kommt das alte Grundkörper-Modell aus props.js.
import * as P from './props.js';
import { propAsset } from './assets.js';
export * from './props.js';

// Name → [[Standardwert, Art], …] je Parameter. Art: 's' = Maßstab, 'c' = Farbe, '=' = nur der Standard passt zum Modell.
const SPEC = {
  rock: [[1, 's'], [P.STONE, 'c']],
  rocks: [[1, 's'], [P.STONE, 'c']],
  stump: [[1, 's']],
  log: [[3, '=']],
  logPile: [],
  mushrooms: [[4, '='], [0xe74c3c, 'c']],
  tallGrass: [[7, '='], [0x6ab04c, 'c']],
  reeds: [[5, '=']],
  flowerPatch: [[2, '=']],
  hedge: [[4, '='], [1.2, '=']],
  birch: [[1, 's']],
  palmTree: [[6, 's']],
  cactus: [],
  fence: [[4, '='], [P.WHITE, 'c'], [1, '=']],
  woodFence: [[4, '=']],
  bench: [],
  picnicTable: [],
  birdbath: [],
  wheelbarrow: [],
  pot: [[0xd35400, 'c'], [0x3d9a3d, 'c'], [1, 's']],
  bigPlant: [[1, 's']],
  wateringCan: [],
  steppingStones: [[5, '='], [1.2, '=']],
  scarecrow: [],
  pumpkin: [[1, 's']],
  veggieRow: [[6, '='], [0x27ae60, 'c'], [0xe74c3c, 'c']],
  field: [[12, '='], [8, '='], [0xe1b12c, 'c']],
  hayBale: [[true, '=']],
  well: [],
  cart: [],
  beehive: [],
  tent: [[0xe17055, 'c']],
  campfire: [],
  signpost: [[P.LWOOD, 'c']],
  lantern: [[2.6, '='], [P.DARK, 'c']],
  pinwheel: [[0xff7675, 'c']],
  cottage: [[6, '='], [5, '='], [3, '='], [P.WALLS[0], 'c'], [P.ROOFS[0], 'c']],
  shed: [[3, '='], [2.5, '='], [P.WOOD, 'c']],
  cityBlock: [[10, '='], [8, '='], [12, '='], [0xdfe6e9, 'c'], [0x74b9ff, 'c'], [P.DSTONE, 'c']],
  awningShop: [[8, '='], [6, '='], [0xffeaa7, 'c'], [0xe74c3c, 'c']],
  warehouse: [[16, '='], [10, '='], [7, '='], [0x95a5a6, 'c']],
  beachHut: [[0x48dbfb, 'c']],
  kiosk: [[0x1dd1a1, 'c']],
  marketStall: [[0xef5350, 'c']],
  streetLamp: [[4.5, '=']],
  car: [[0xe74c3c, 'c']],
  van: [[0xecf0f1, 'c']],
  bin: [[0x27ae60, 'c']],
  hydrant: [],
  planterTree: [[1, 's']],
  busStop: [],
  cone3: [[0xff7f27, 'c']],
  bikeRack: [],
  bike: [[0x0984e3, 'c']],
  cafeTable: [[0xe74c3c, 'c']],
  billboard: [[0xfeca57, 'c']],
  fountainSmall: [],
  barrel: [[0x8d6e4a, 'c']],
  crate: [[1, 's'], [P.LWOOD, 'c']],
  crates: [],
  pallet: [],
  palletStack: [[4, '='], [true, '=']],
  ropeCoil: [],
  fishNet: [],
  lobsterPot: [],
  bollard: [],
  anchorDeco: [],
  lifebuoyStand: [],
  rowboat: [[0xe17055, 'c']],
  fishingBoat: [[0x0984e3, 'c']],
  sailboat: [[P.WHITE, 'c']],
  buoyBob: [[0xff7675, 'c']],
  umbrella: [[0xe74c3c, 'c']],
  towel: [[0x48dbfb, 'c']],
  deckChair: [[0x1dd1a1, 'c']],
  sandcastle: [[1, 's']],
  surfboard: [[0xfeca57, 'c']],
  starfish: [[0xff7f50, 'c']],
  lifeguardTower: [],
  volleyNet: [],
  iceCart: [],
  flagPole: [[0xe74c3c, 'c']],
  armchair: [[0x6c5ce7, 'c']],
  sofa: [[0x2980b9, 'c'], [3.4, '=']],
  table: [[2.4, '='], [1.4, '='], [1, '='], [P.LWOOD, 'c']],
  chair: [[P.WOOD, 'c']],
  diningSet: [],
  floorLamp: [],
  rug: [[3, '='], [2, '='], [0xe17055, 'c']],
  shelf: [[2, '='], [2.4, '='], [P.WOOD, 'c']],
  tvStand: [],
  plantBox: [[2, '=']],
  toys: [],
  coatRack: [],
  shoeRack: [],
  boxes: [[3, '=']],
  sack: [[0xd7ccc8, 'c']],
  jarShelf: [],
  waterCooler: [],
  officeChair: [[P.DARK, 'c']],
  cabinet: [[0x95a5a6, 'c'], [1.4, '=']],
  acUnit: [],
  solarPanel: [],
  pipeStack: [],
  toxicBarrel: [],
  junk: [],
  trashBags: [],
  glowShrooms: [],
  rubberDuck: [],
  tire: [],
  cart2: [],
};
// bewegliche Teile (deko/index.js dreht userData.spin/wave), Wind im Laub
const EXTRA = {
  pinwheel: { keep: ['spin'], set: (g, n) => { g.userData.spin = n.spin; g.userData.axis = 'z'; } },
  flagPole: { keep: ['wave'], set: (g, n) => { g.userData.wave = n.wave; } },
  buoyBob: { set: g => { g.userData.bob = true; } },
  planterTree: { sway: { laub: 0.06 } },
};
const SKIP = new Set(['glowShrooms']); // leuchtende Pilze bleiben Grundkörper (eigenes Leucht-Material)

const glb = name => (...args) => {
  const spec = SPEC[name], o = { scale: 1, recolor: [] };
  for (let i = 0; i < spec.length; i++) {
    const [d, kind] = spec[i], v = args[i] ?? d;
    if (kind === 's') o.scale *= v / d;
    else if (kind === 'c') { if (v !== d) o.recolor.push([d, v]); }
    else if (v !== d) return P[name](...args);
  }
  const x = EXTRA[name] || {}, g = SKIP.has(name) ? null : propAsset(name, { ...o, keep: x.keep, sway: x.sway });
  if (!g) return P[name](...args);
  if (x.set) { const n = {}; g.children.forEach(c => { if (c.name) n[c.name] = c; }); x.set(g, n); }
  return g;
};

export const rock = glb('rock'), rocks = glb('rocks'), stump = glb('stump'), log = glb('log'), logPile = glb('logPile'), mushrooms = glb('mushrooms');
export const tallGrass = glb('tallGrass'), reeds = glb('reeds'), flowerPatch = glb('flowerPatch'), hedge = glb('hedge'), birch = glb('birch'), palmTree = glb('palmTree');
export const cactus = glb('cactus'), fence = glb('fence'), woodFence = glb('woodFence'), bench = glb('bench'), picnicTable = glb('picnicTable'), birdbath = glb('birdbath');
export const wheelbarrow = glb('wheelbarrow'), pot = glb('pot'), bigPlant = glb('bigPlant'), wateringCan = glb('wateringCan'), steppingStones = glb('steppingStones'), scarecrow = glb('scarecrow');
export const pumpkin = glb('pumpkin'), veggieRow = glb('veggieRow'), field = glb('field'), hayBale = glb('hayBale'), well = glb('well'), cart = glb('cart');
export const beehive = glb('beehive'), tent = glb('tent'), campfire = glb('campfire'), signpost = glb('signpost'), lantern = glb('lantern'), pinwheel = glb('pinwheel');
export const cottage = glb('cottage'), shed = glb('shed'), cityBlock = glb('cityBlock'), awningShop = glb('awningShop'), warehouse = glb('warehouse'), beachHut = glb('beachHut');
export const kiosk = glb('kiosk'), marketStall = glb('marketStall'), streetLamp = glb('streetLamp'), car = glb('car'), van = glb('van'), bin = glb('bin');
export const hydrant = glb('hydrant'), planterTree = glb('planterTree'), busStop = glb('busStop'), cone3 = glb('cone3'), bikeRack = glb('bikeRack'), bike = glb('bike');
export const cafeTable = glb('cafeTable'), billboard = glb('billboard'), fountainSmall = glb('fountainSmall'), barrel = glb('barrel'), crate = glb('crate'), crates = glb('crates');
export const pallet = glb('pallet'), palletStack = glb('palletStack'), ropeCoil = glb('ropeCoil'), fishNet = glb('fishNet'), lobsterPot = glb('lobsterPot'), bollard = glb('bollard');
export const anchorDeco = glb('anchorDeco'), lifebuoyStand = glb('lifebuoyStand'), rowboat = glb('rowboat'), fishingBoat = glb('fishingBoat'), sailboat = glb('sailboat'), buoyBob = glb('buoyBob');
export const umbrella = glb('umbrella'), towel = glb('towel'), deckChair = glb('deckChair'), sandcastle = glb('sandcastle'), surfboard = glb('surfboard'), starfish = glb('starfish');
export const lifeguardTower = glb('lifeguardTower'), volleyNet = glb('volleyNet'), iceCart = glb('iceCart'), flagPole = glb('flagPole'), armchair = glb('armchair'), sofa = glb('sofa');
export const table = glb('table'), chair = glb('chair'), diningSet = glb('diningSet'), floorLamp = glb('floorLamp'), rug = glb('rug'), shelf = glb('shelf');
export const tvStand = glb('tvStand'), plantBox = glb('plantBox'), toys = glb('toys'), coatRack = glb('coatRack'), shoeRack = glb('shoeRack'), boxes = glb('boxes');
export const sack = glb('sack'), jarShelf = glb('jarShelf'), waterCooler = glb('waterCooler'), officeChair = glb('officeChair'), cabinet = glb('cabinet'), acUnit = glb('acUnit');
export const solarPanel = glb('solarPanel'), pipeStack = glb('pipeStack'), toxicBarrel = glb('toxicBarrel'), junk = glb('junk'), trashBags = glb('trashBags'), glowShrooms = glb('glowShrooms');
export const rubberDuck = glb('rubberDuck'), tire = glb('tire'), cart2 = glb('cart2');
