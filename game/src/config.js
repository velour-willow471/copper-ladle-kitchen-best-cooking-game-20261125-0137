// Copper Ladle Kitchen — every tuning number, colour, ingredient and recipe in one place.
// The playfield is laid out from the canvas size, so the same kitchen fills a 1280x480
// screenshot frame and a tall desktop window alike; no rule below depends on the screen size.

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** One full service: seconds on the clock, hearts lost when an order expires. */
export const DAY_SECONDS = 180;
export const HEARTS = 3;

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'copper-ladle-kitchen.best';

export const CHEF = {
  radius: 26,
  speed: 300,
};

/** Seconds a ticket waits before it expires; later tickets get less patience. */
export const ORDER = {
  startPatience: 50,
  minPatience: 30,
  firstAt: 2,
  spawnInterval: 15,
  minSpawnInterval: 9,
  maxActive: 4,
};

/** Chopping takes this many seconds of holding the interact key; grill and pot times below. */
export const CHOP_SECONDS = 1.4;
export const GRILL_SECONDS = 4;
export const GRILL_BURN_AFTER = 5;
export const POT_SECONDS = 5;

/** A finished dish pays its price plus a tip worth up to half the price, by patience left. */
export const TIP_MAX_FRACTION = 0.5;
/** Each serve in a row without an expired order adds 10% to the tip, up to this. */
export const COMBO_STEP = 0.1;
export const COMBO_MAX = 0.5;

/** An ingredient, its bin colour, what it can become and how it is drawn. */
export const INGREDIENTS = {
  bun: { label: 'Bun', colour: '#e8a95c', chop: false, grill: 'melt-base', price: 0 },
  patty: { label: 'Patty', colour: '#8a5a3b', chop: false, grill: 'grilled-patty', price: 0 },
  tomato: { label: 'Tomato', colour: '#e14b3a', chop: 'chopped-tomato', grill: false, price: 0 },
  lettuce: { label: 'Lettuce', colour: '#5da244', chop: 'chopped-lettuce', grill: false, price: 0 },
  cheese: { label: 'Cheese', colour: '#f2c94c', chop: false, grill: false, price: 0 },
  onion: { label: 'Onion', colour: '#c9a7d8', chop: 'chopped-onion', grill: false, price: 0 },
  'chopped-tomato': { label: 'Tomato', colour: '#e14b3a', chop: false, grill: false, price: 0 },
  'chopped-lettuce': { label: 'Lettuce', colour: '#5da244', chop: false, grill: false, price: 0 },
  'chopped-onion': { label: 'Onion', colour: '#c9a7d8', chop: false, grill: false, price: 0 },
  'grilled-patty': { label: 'Patty', colour: '#6b4226', chop: false, grill: false, price: 0 },
  melt: { label: 'Melt', colour: '#f2c94c', chop: false, grill: false, price: 0 },
  soup: { label: 'Soup', colour: '#c94f2e', chop: false, grill: false, price: 0 },
  burnt: { label: 'Burnt', colour: '#2b2b2b', chop: false, grill: false, price: 0 },
};

/** What a plate may hold, in the order it is stacked, and what each dish pays. */
export const RECIPES = [
  {
    id: 'salad',
    name: 'Garden Salad',
    needs: ['chopped-lettuce', 'chopped-tomato'],
    price: 6,
    blurb: 'Crisp lettuce, ripe tomato.',
  },
  {
    id: 'soup',
    name: 'Tomato Soup',
    needs: ['soup'],
    price: 10,
    blurb: 'Tomato and onion, simmered.',
  },
  {
    id: 'melt',
    name: 'Golden Melt',
    needs: ['bun', 'melt'],
    price: 9,
    blurb: 'Bun, cheese melted on the grill.',
  },
  {
    id: 'burger',
    name: 'Copper Burger',
    needs: ['bun', 'grilled-patty', 'chopped-lettuce', 'chopped-tomato'],
    price: 14,
    blurb: 'The house signature, stacked high.',
  },
];

/** The stations of the kitchen, by id, with the label the player reads. */
export const STATIONS = [
  { id: 'bin-bun', kind: 'bin', gives: 'bun', label: 'Buns' },
  { id: 'bin-patty', kind: 'bin', gives: 'patty', label: 'Patties' },
  { id: 'bin-tomato', kind: 'bin', gives: 'tomato', label: 'Tomatoes' },
  { id: 'bin-lettuce', kind: 'bin', gives: 'lettuce', label: 'Lettuce' },
  { id: 'bin-cheese', kind: 'bin', gives: 'cheese', label: 'Cheese' },
  { id: 'bin-onion', kind: 'bin', gives: 'onion', label: 'Onions' },
  { id: 'plates', kind: 'plates', label: 'Plates' },
  { id: 'trash', kind: 'trash', label: 'Bin' },
  { id: 'board', kind: 'board', label: 'Chopping Board' },
  { id: 'grill', kind: 'grill', label: 'Grill', slots: 2 },
  { id: 'pot', kind: 'pot', label: 'Soup Pot' },
  { id: 'plating', kind: 'plating', label: 'Plating Counter' },
  { id: 'serve', kind: 'serve', label: 'Serving Window' },
];

/**
 * Where each station sits, as fractions of the canvas: [x, y, width, height].
 * Three bands: ingredient bins up top, the hot work in the middle, plating and
 * serving along the bottom, with aisles between them wide enough that a chef
 * standing at one band is out of reach of the next.
 */
export const LAYOUT = {
  'bin-bun': [0.02, 0.19, 0.095, 0.12],
  'bin-patty': [0.125, 0.19, 0.095, 0.12],
  'bin-tomato': [0.23, 0.19, 0.095, 0.12],
  'bin-lettuce': [0.335, 0.19, 0.095, 0.12],
  'bin-cheese': [0.44, 0.19, 0.095, 0.12],
  'bin-onion': [0.545, 0.19, 0.095, 0.12],
  plates: [0.67, 0.19, 0.13, 0.12],
  trash: [0.83, 0.19, 0.13, 0.12],
  board: [0.02, 0.45, 0.27, 0.15],
  grill: [0.33, 0.45, 0.34, 0.15],
  pot: [0.71, 0.45, 0.27, 0.15],
  plating: [0.02, 0.72, 0.52, 0.18],
  serve: [0.60, 0.72, 0.38, 0.18],
};

/** The chef may walk anywhere on the floor below the order board. */
export const FLOOR_TOP_FRACTION = 0.17;

export const PALETTE = {
  wall: '#f3e2c2',
  wallTrim: '#d9b98a',
  floorA: '#e9d3a7',
  floorB: '#dfc491',
  counterWood: '#a4713f',
  counterTop: '#c99a5b',
  counterEdge: '#7d5230',
  steel: '#b9c2cc',
  steelDark: '#8d97a3',
  board: '#e8dcc3',
  grill: '#3c3f45',
  pot: '#5b6b7a',
  serve: '#b4552d',
  plate: '#f7f4ec',
  text: '#3a2a1a',
  muted: '#8a6f4d',
  ticket: '#fff8e6',
  ticketEdge: '#d9c08a',
  danger: '#c0392b',
  good: '#2e7d32',
  gold: '#f2c94c',
  chefCoat: '#f7f4ec',
  chefHat: '#ffffff',
  apron: '#2f6db3',
  hud: '#2b2118',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';
