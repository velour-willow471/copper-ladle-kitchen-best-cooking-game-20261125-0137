// The screenshot scenes behind ?shot=start|play|serve|end. Each one stages a game
// state the real rules can reach — orders with real recipes, a board mid-chop, a
// plate mid-assembly, a grill with food on it — and the renderer paints it, so the
// frame is what a short game really looks like. The same seed always gives the same
// frame: nothing here reads the clock or the network.

import { RECIPES } from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

/** An order ticket in the exact shape the world spawns, with a chosen patience. */
function makeOrder(id, recipeId, patienceFraction) {
  const recipe = RECIPES.find((entry) => entry.id === recipeId);
  const patience = 50 * patienceFraction;
  return { id, recipe, patience, maxPatience: 50 };
}

/** Put the chef beside a station, facing it. */
function standBy(state, stationId) {
  const rect = state.stations[stationId].rect;
  state.chef.x = rect.x + rect.width / 2;
  state.chef.y = rect.y + rect.height + 34 * state.unit;
  state.chef.target = null;
  state.chef.moving = false;
}

/**
 * Set `world` to the named scene (start, play, serve or end; any other name is
 * start) and return the screen to draw over it and the best score to show.
 */
export function stageShot(name, world) {
  const state = world.state;
  world.reset();
  if (name === 'play') {
    state.elapsed = 32;
    state.timeLeft = 180 - 32;
    state.coins = 12;
    state.served = 1;
    state.combo = 1;
    state.orders = [
      makeOrder(1, 'salad', 0.6),
      makeOrder(2, 'burger', 0.85),
      makeOrder(3, 'soup', 0.4),
    ];
    state.nextOrderId = 4;
    // A tomato half-chopped on the board, the chef at work beside it.
    state.stations.board.item = 'tomato';
    state.stations.board.progress = 0.55;
    standBy(state, 'board');
    state.chef.carrying = null;
    // A salad mid-assembly on the plating counter: lettuce on, tomato to come.
    state.stations.plating.plate = { type: 'plate', items: ['chopped-lettuce', 'chopped-tomato'] };
    // A patty sizzling on the grill and a tomato waiting in the pot.
    state.stations.grill.slots[0] = { item: 'patty', progress: 0.62, done: false, overTime: 0 };
    state.stations.pot.contents = ['chopped-tomato'];
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'serve') {
    state.elapsed = 84;
    state.timeLeft = 180 - 84;
    state.coins = 38;
    state.served = 3;
    state.combo = 2;
    state.bestCombo = 2;
    state.orders = [
      makeOrder(4, 'burger', 0.75),
      makeOrder(5, 'melt', 0.5),
    ];
    state.nextOrderId = 6;
    // The finished burger, on a plate in the chef's hands at the serving window.
    // The chef stands in the aisle beside the window, so the plate rides clear
    // above the hat instead of being cut off at the frame's edge.
    state.chef.carrying = {
      type: 'plate',
      items: ['bun', 'grilled-patty', 'chopped-lettuce', 'chopped-tomato'],
    };
    const serveRect = state.stations.serve.rect;
    state.chef.x = serveRect.x - 34 * state.unit;
    state.chef.y = serveRect.y + serveRect.height / 2;
    state.chef.target = null;
    state.chef.moving = false;
    state.chef.facing = 1;
    // A melt just finished on the grill and soup ready in the pot behind it.
    state.stations.grill.slots[0] = { item: 'melt', progress: 1, done: true, overTime: 0 };
    state.stations.pot.contents = ['chopped-tomato', 'chopped-onion'];
    state.stations.pot.progress = 1;
    state.stations.pot.ready = true;
    return { screen: SCREEN_PLAY, best: 38 };
  }
  if (name === 'end') {
    state.elapsed = 180;
    state.timeLeft = 0;
    state.coins = 86;
    state.served = 7;
    state.expired = 1;
    state.burntCount = 1;
    state.combo = 0;
    state.bestCombo = 3;
    state.over = true;
    state.overReason = 'Service is over — the dinner rush is done.';
    state.orders = [];
    state.stations.grill.slots[0] = { item: 'burnt', progress: 1, done: true, overTime: 9 };
    // The chef waits in the aisle below the hot work, out of the grill's way.
    state.chef.x = state.width * 0.15;
    state.chef.y = state.height * 0.66;
    return { screen: SCREEN_OVER, best: 64 };
  }
  // start: the title screen over a kitchen with its first orders already pinned up.
  state.orders = [makeOrder(1, 'salad', 1), makeOrder(2, 'soup', 1)];
  state.nextOrderId = 3;
  state.chef.x = state.width / 2;
  state.chef.y = state.height * 0.64;
  return { screen: SCREEN_TITLE, best: 0 };
}
