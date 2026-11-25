// Copper Ladle Kitchen — the whole simulation: the chef, the stations, the orders and
// the dishes. Pure state and rules: no drawing, no sound, no browser calls, so the
// screenshot stager can drive it with the same functions the player uses.

import {
  CHOP_SECONDS,
  COMBO_MAX,
  COMBO_STEP,
  DAY_SECONDS,
  FLOOR_TOP_FRACTION,
  GRILL_BURN_AFTER,
  GRILL_SECONDS,
  HEARTS,
  INGREDIENTS,
  LAYOUT,
  ORDER,
  POT_SECONDS,
  RECIPES,
  STATIONS,
  STEP,
  TIP_MAX_FRACTION,
} from './config.js';
import { pick } from './random.js';

export const EVENT_NEW_ORDER = 1;
export const EVENT_SERVED = 2;
export const EVENT_EXPIRED = 4;
export const EVENT_OVER = 8;
export const EVENT_CHOP = 16;
export const EVENT_CHOP_DONE = 32;
export const EVENT_COOK_DONE = 64;
export const EVENT_BURNT = 128;
export const EVENT_ERROR = 256;
export const EVENT_PICKUP = 512;
export const EVENT_PLACE = 1024;
export const EVENT_COIN = 2048;

/** How close the chef must be to a station, in pixels at the 1280x720 design size. */
const REACH = 46;

/** The chef's radius and walk speed at the 1280x720 design size. */
const CHEF_RADIUS = 26;
const CHEF_SPEED = 300;

/** Build the station rectangles for a canvas of this size. */
export function computeLayout(width, height) {
  const rects = {};
  for (const station of STATIONS) {
    const [fx, fy, fw, fh] = LAYOUT[station.id];
    rects[station.id] = {
      x: fx * width,
      y: fy * height,
      width: fw * width,
      height: fh * height,
    };
  }
  return rects;
}

/** A carried thing: one loose ingredient, or a plate holding a stack of them. */
function looseItem(name) {
  return { type: 'item', name };
}

function emptyPlate() {
  return { type: 'plate', items: [] };
}

function isPlate(carried) {
  return carried !== null && carried.type === 'plate';
}

/** Do the plate's items match this recipe, as a multiset, in any order? */
function plateMatches(recipe, items) {
  if (items.length !== recipe.needs.length) return false;
  const remaining = [...recipe.needs];
  for (const item of items) {
    const index = remaining.indexOf(item);
    if (index === -1) return false;
    remaining.splice(index, 1);
  }
  return remaining.length === 0;
}

function findMatchingOrder(orders, items) {
  for (const order of orders) {
    if (plateMatches(order.recipe, items)) return order;
  }
  return null;
}

/** Distance from a point to a rectangle (0 when the point is inside it). */
function distanceToRect(x, y, rect) {
  const dx = Math.max(rect.x - x, 0, x - (rect.x + rect.width));
  const dy = Math.max(rect.y - y, 0, y - (rect.y + rect.height));
  return Math.hypot(dx, dy);
}

/** The station the chef can reach right now, or null. */
function nearestStation(state) {
  let best = null;
  let bestDistance = Infinity;
  for (const station of Object.values(state.stations)) {
    const distance = distanceToRect(state.chef.x, state.chef.y, station.rect);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = station;
    }
  }
  return bestDistance <= REACH * state.unit ? best : null;
}

/** Push a circle out of a rectangle it overlaps; returns the corrected centre. */
function pushOutOfRect(x, y, radius, rect) {
  const closestX = Math.max(rect.x, Math.min(x, rect.x + rect.width));
  const closestY = Math.max(rect.y, Math.min(y, rect.y + rect.height));
  const dx = x - closestX;
  const dy = y - closestY;
  const distance = Math.hypot(dx, dy);
  if (distance >= radius || distance === 0) {
    // Centres inside a counter are shoved out along the shorter side.
    if (distance === 0) {
      const left = x - rect.x;
      const right = rect.x + rect.width - x;
      const top = y - rect.y;
      const bottom = rect.y + rect.height - y;
      const smallest = Math.min(left, right, top, bottom);
      if (smallest === left) return { x: rect.x - radius, y };
      if (smallest === right) return { x: rect.x + rect.width + radius, y };
      if (smallest === top) return { x, y: rect.y - radius };
      return { x, y: rect.y + rect.height + radius };
    }
    return { x, y };
  }
  return { x: x + (dx / distance) * (radius - distance), y: y + (dy / distance) * (radius - distance) };
}

export function createWorld(random) {
  const state = {
    width: 1280,
    height: 720,
    unit: 1,
    timeLeft: DAY_SECONDS,
    elapsed: 0,
    coins: 0,
    hearts: HEARTS,
    combo: 0,
    bestCombo: 0,
    served: 0,
    expired: 0,
    burntCount: 0,
    orders: [],
    nextOrderId: 1,
    spawnIn: ORDER.firstAt,
    chef: { x: 640, y: 460, target: null, carrying: null, facing: 1, moving: false },
    stations: {},
    floaters: [],
    over: false,
    overReason: '',
    chopSoundIn: 0,
  };

  function layoutStations() {
    const rects = computeLayout(state.width, state.height);
    for (const definition of STATIONS) {
      const station = state.stations[definition.id] ?? { id: definition.id, kind: definition.kind };
      station.rect = rects[definition.id];
      station.label = definition.label;
      if (definition.kind === 'bin') station.gives = definition.gives;
      if (definition.kind === 'board') station.item = station.item ?? null;
      if (definition.kind === 'board') station.progress = station.progress ?? 0;
      if (definition.kind === 'grill') station.slots = station.slots ?? [null, null];
      if (definition.kind === 'pot') {
        station.contents = station.contents ?? [];
        station.progress = station.progress ?? 0;
        station.ready = station.ready ?? false;
      }
      if (definition.kind === 'plating') station.plate = station.plate ?? null;
      state.stations[definition.id] = station;
    }
  }

  function relayout(width, height) {
    state.width = width;
    state.height = height;
    state.unit = Math.min(width / 1280, height / 720);
    layoutStations();
    const chef = state.chef;
    chef.x = Math.max(30, Math.min(width - 30, chef.x));
    chef.y = Math.max(FLOOR_TOP_FRACTION * height + 30, Math.min(height - 30, chef.y));
  }

  function addFloater(x, y, text, colour) {
    state.floaters.push({ x, y, text, colour: colour ?? '#3a2a1a', life: 1.4 });
  }

  function spawnOrder() {
    const unlocked = RECIPES.filter((recipe) => state.elapsed >= 45 || recipe.id !== 'burger');
    const recipe = pick(random, unlocked);
    const patience = Math.max(ORDER.minPatience, ORDER.startPatience - state.elapsed * 0.12);
    state.orders.push({
      id: state.nextOrderId,
      recipe,
      patience,
      maxPatience: patience,
    });
    state.nextOrderId += 1;
    return EVENT_NEW_ORDER;
  }

  function reset() {
    state.timeLeft = DAY_SECONDS;
    state.elapsed = 0;
    state.coins = 0;
    state.hearts = HEARTS;
    state.combo = 0;
    state.bestCombo = 0;
    state.served = 0;
    state.expired = 0;
    state.burntCount = 0;
    state.orders = [];
    state.nextOrderId = 1;
    state.spawnIn = ORDER.firstAt;
    state.chef = { x: state.width / 2, y: state.height * 0.64, target: null, carrying: null, facing: 1, moving: false };
    state.floaters = [];
    state.over = false;
    state.overReason = '';
    state.chopSoundIn = 0;
    for (const station of Object.values(state.stations)) {
      if (station.kind === 'board') {
        station.item = null;
        station.progress = 0;
      }
      if (station.kind === 'grill') station.slots = [null, null];
      if (station.kind === 'pot') {
        station.contents = [];
        station.progress = 0;
        station.ready = false;
      }
      if (station.kind === 'plating') station.plate = null;
    }
  }

  /**
   * Use the station the chef is standing at. Called once per key press or click;
   * holding the key near the chopping board is handled by step() instead.
   */
  function interact() {
    const station = nearestStation(state);
    if (!station) return 0;
    const chef = state.chef;
    const carried = chef.carrying;
    let events = 0;

    if (station.kind === 'bin') {
      if (carried) return EVENT_ERROR;
      chef.carrying = looseItem(station.gives);
      return EVENT_PICKUP;
    }

    if (station.kind === 'plates') {
      if (carried) return EVENT_ERROR;
      chef.carrying = emptyPlate();
      return EVENT_PICKUP;
    }

    if (station.kind === 'trash') {
      if (!carried) return 0;
      chef.carrying = null;
      addFloater(chef.x, chef.y - 40, 'Tossed', '#8a6f4d');
      return EVENT_PLACE;
    }

    if (station.kind === 'board') {
      if (station.item === null) {
        if (!carried || carried.type !== 'item') return EVENT_ERROR;
        const chopped = INGREDIENTS[carried.name].chop;
        if (!chopped) {
          addFloater(chef.x, chef.y - 40, "Can't chop that", '#c0392b');
          return EVENT_ERROR;
        }
        station.item = carried.name;
        station.progress = 0;
        chef.carrying = null;
        return EVENT_PLACE;
      }
      if (!carried) {
        chef.carrying = looseItem(station.item);
        station.item = null;
        station.progress = 0;
        return EVENT_PICKUP;
      }
      return EVENT_ERROR;
    }

    if (station.kind === 'grill') {
      // Cheese onto a bun already on the grill makes a melt.
      if (carried && carried.type === 'item' && carried.name === 'cheese') {
        const bunSlot = station.slots.find((slot) => slot && slot.item === 'bun' && !slot.done);
        if (bunSlot) {
          bunSlot.item = 'melt';
          bunSlot.progress = 0;
          bunSlot.done = false;
          bunSlot.overTime = 0;
          chef.carrying = null;
          return EVENT_PLACE;
        }
        return EVENT_ERROR;
      }
      const emptySlot = station.slots.findIndex((slot) => slot === null);
      if (carried && carried.type === 'item' && INGREDIENTS[carried.name].grill) {
        if (emptySlot === -1) return EVENT_ERROR;
        station.slots[emptySlot] = { item: carried.name, progress: 0, done: false, overTime: 0 };
        chef.carrying = null;
        return EVENT_PLACE;
      }
      if (!carried) {
        const fullSlot = station.slots.findIndex((slot) => slot !== null);
        if (fullSlot === -1) return EVENT_ERROR;
        const slot = station.slots[fullSlot];
        if (slot.item === 'patty') chef.carrying = looseItem(slot.done ? 'grilled-patty' : 'patty');
        else if (slot.item === 'melt' && !slot.done) {
          chef.carrying = looseItem('bun');
          addFloater(chef.x, chef.y - 40, 'The cheese slid off', '#8a6f4d');
        } else chef.carrying = looseItem(slot.item);
        station.slots[fullSlot] = null;
        return EVENT_PICKUP;
      }
      return EVENT_ERROR;
    }

    if (station.kind === 'pot') {
      if (station.ready) {
        if (!isPlate(carried) || carried.items.length > 0) return EVENT_ERROR;
        carried.items.push('soup');
        station.contents = [];
        station.progress = 0;
        station.ready = false;
        return EVENT_PLACE;
      }
      if (carried && carried.type === 'item' && (carried.name === 'chopped-tomato' || carried.name === 'chopped-onion')) {
        if (station.contents.includes(carried.name)) return EVENT_ERROR;
        station.contents.push(carried.name);
        chef.carrying = null;
        if (station.contents.length === 2) station.progress = 0;
        return EVENT_PLACE;
      }
      return EVENT_ERROR;
    }

    if (station.kind === 'plating') {
      if (carried && carried.type === 'plate' && station.plate === null) {
        station.plate = carried;
        chef.carrying = null;
        return EVENT_PLACE;
      }
      if (!carried && station.plate !== null) {
        chef.carrying = station.plate;
        station.plate = null;
        return EVENT_PICKUP;
      }
      if (carried && carried.type === 'item' && station.plate !== null) {
        if (station.plate.items.includes(carried.name)) {
          addFloater(chef.x, chef.y - 40, 'Already on the plate', '#c0392b');
          return EVENT_ERROR;
        }
        station.plate.items.push(carried.name);
        chef.carrying = null;
        return EVENT_PLACE;
      }
      return EVENT_ERROR;
    }

    if (station.kind === 'serve') {
      if (!isPlate(carried)) return EVENT_ERROR;
      const order = findMatchingOrder(state.orders, carried.items);
      if (!order) {
        addFloater(chef.x, chef.y - 40, 'No order for this dish', '#c0392b');
        return EVENT_ERROR;
      }
      const tipFraction = TIP_MAX_FRACTION * (order.patience / order.maxPatience);
      const comboBonus = 1 + Math.min(COMBO_MAX, state.combo * COMBO_STEP);
      const earned = Math.round((order.recipe.price + order.recipe.price * tipFraction) * comboBonus);
      state.coins += earned;
      state.served += 1;
      state.combo += 1;
      state.bestCombo = Math.max(state.bestCombo, state.combo);
      state.orders.splice(state.orders.indexOf(order), 1);
      chef.carrying = null;
      addFloater(station.rect.x + station.rect.width / 2, station.rect.y - 10, `+$${earned}`, '#2e7d32');
      events = EVENT_SERVED | EVENT_COIN;
      return events;
    }

    return 0;
  }

  /** Advance the simulation one fixed step. `move` is {x, y} (-1..1) or a click target. */
  function step(dt, move, interactHeld) {
    if (state.over) return 0;
    let events = 0;
    state.elapsed += dt;
    state.timeLeft = Math.max(0, DAY_SECONDS - state.elapsed);

    // Orders arrive on a quickening schedule, up to four at once.
    state.spawnIn -= dt;
    if (state.spawnIn <= 0 && state.orders.length < ORDER.maxActive) {
      events |= spawnOrder();
      const interval = Math.max(ORDER.minSpawnInterval, ORDER.spawnInterval - state.elapsed * 0.03);
      state.spawnIn = interval;
    }

    // Patience drains; an expired ticket costs a heart and breaks the combo.
    for (let index = state.orders.length - 1; index >= 0; index -= 1) {
      const order = state.orders[index];
      order.patience -= dt;
      if (order.patience <= 0) {
        state.orders.splice(index, 1);
        state.hearts -= 1;
        state.expired += 1;
        state.combo = 0;
        events |= EVENT_EXPIRED;
        addFloater(state.width / 2, 90, 'Order expired!', '#c0392b');
      }
    }

    // The grill cooks on its own; a finished piece burns if it is forgotten.
    const grill = state.stations.grill;
    if (grill) {
      for (const slot of grill.slots) {
        if (!slot) continue;
        if (!slot.done) {
          slot.progress += dt / GRILL_SECONDS;
          if (slot.progress >= 1) {
            slot.progress = 1;
            slot.done = true;
            slot.overTime = 0;
            events |= EVENT_COOK_DONE;
          }
        } else if (slot.item !== 'burnt') {
          slot.overTime += dt;
          if (slot.overTime >= GRILL_BURN_AFTER) {
            slot.item = 'burnt';
            state.burntCount += 1;
            events |= EVENT_BURNT;
          }
        }
      }
    }

    // The pot simmers once both chopped vegetables are in.
    const pot = state.stations.pot;
    if (pot && !pot.ready && pot.contents.length === 2) {
      pot.progress += dt / POT_SECONDS;
      if (pot.progress >= 1) {
        pot.progress = 1;
        pot.ready = true;
        events |= EVENT_COOK_DONE;
      }
    }

    // Holding interact at the board chops, one thock per third of a second.
    const board = state.stations.board;
    if (interactHeld && board && board.item !== null && INGREDIENTS[board.item].chop) {
      state.chopSoundIn -= dt;
      board.progress += dt / CHOP_SECONDS;
      if (state.chopSoundIn <= 0) {
        state.chopSoundIn = 0.35;
        events |= EVENT_CHOP;
      }
      if (board.progress >= 1) {
        board.item = INGREDIENTS[board.item].chop;
        board.progress = 0;
        events |= EVENT_CHOP_DONE;
      }
    }

    // The chef walks: keys steer directly, a click sets a target to walk to.
    const chef = state.chef;
    let dx = 0;
    let dy = 0;
    if (move) {
      if (move.target) {
        const tx = move.target.x - chef.x;
        const ty = move.target.y - chef.y;
        const distance = Math.hypot(tx, ty);
        if (distance > 6) {
          dx = tx / distance;
          dy = ty / distance;
        } else {
          chef.target = null;
        }
      } else {
        dx = move.x;
        dy = move.y;
      }
    }
    const length = Math.hypot(dx, dy);
    chef.moving = length > 0.01;
    if (chef.moving) {
      dx /= length;
      dy /= length;
      chef.facing = dx < -0.1 ? -1 : dx > 0.1 ? 1 : chef.facing;
      const speed = CHEF_SPEED * state.unit;
      let nextX = chef.x + dx * speed * dt;
      let nextY = chef.y + dy * speed * dt;
      const radius = CHEF_RADIUS * state.unit;
      nextX = Math.max(radius + 4, Math.min(state.width - radius - 4, nextX));
      nextY = Math.max(FLOOR_TOP_FRACTION * state.height + radius, Math.min(state.height - radius - 4, nextY));
      for (const station of Object.values(state.stations)) {
        const corrected = pushOutOfRect(nextX, nextY, radius, station.rect);
        nextX = corrected.x;
        nextY = corrected.y;
      }
      chef.x = nextX;
      chef.y = nextY;
    }

    // Floating labels drift up and fade.
    for (let index = state.floaters.length - 1; index >= 0; index -= 1) {
      const floater = state.floaters[index];
      floater.y -= 22 * dt;
      floater.life -= dt;
      if (floater.life <= 0) state.floaters.splice(index, 1);
    }

    if (state.timeLeft <= 0 || state.hearts <= 0) {
      state.over = true;
      state.overReason = state.hearts <= 0 ? 'The kitchen lost its temper — three orders walked out.' : 'Service is over — the dinner rush is done.';
      events |= EVENT_OVER;
    }
    return events;
  }

  /** Anything sizzling right now, for the sound loop. */
  function isSizzling() {
    const grill = state.stations.grill;
    const pot = state.stations.pot;
    const grillOn = grill ? grill.slots.some((slot) => slot !== null && !slot.done) : false;
    const potOn = pot ? pot.contents.length === 2 && !pot.ready : false;
    return grillOn || potOn;
  }

  layoutStations();
  reset();
  return { state, reset, step, interact, relayout, nearestStation, isSizzling };
}

export { STEP };
