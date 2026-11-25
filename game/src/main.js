// Boot and the one loop: input is read every frame, the world advances in fixed 1/60 s
// steps (several in a slow frame, none in a fast one), and the renderer paints what is
// there. The game moves between four screens: title, play, paused and game over.
//
// ?seed=N fixes the order pattern. ?shot=start|play|serve|end (with &seed=N) stages
// that scene instead of running the loop, paints it twice and sets window.__shotReady
// for a screenshot.
import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import {
  createWorld,
  EVENT_BURNT,
  EVENT_CHOP,
  EVENT_CHOP_DONE,
  EVENT_COIN,
  EVENT_COOK_DONE,
  EVENT_ERROR,
  EVENT_EXPIRED,
  EVENT_NEW_ORDER,
  EVENT_OVER,
  EVENT_PICKUP,
  EVENT_PLACE,
  EVENT_SERVED,
} from './world.js';
import { ACTION_CONFIRM, ACTION_MUTE, ACTION_PAUSE, createInput } from './input.js';
import {
  createRenderer,
  SCREEN_OVER,
  SCREEN_PAUSED,
  SCREEN_PLAY,
  SCREEN_TITLE,
} from './render.js';
import { stageShot } from './shots.js';
import {
  ensureAudio,
  playBurnt,
  playChop,
  playChopDone,
  playClick,
  playCoin,
  playCookDone,
  playError,
  playExpired,
  playNewOrder,
  playPickup,
  playPlace,
  playServe,
  resumeAudio,
  setSizzle,
  startMusic,
  stopMusic,
} from './audio.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

/** Turn the world's event bits into the sounds they stand for. */
function soundEvents(events) {
  if (events & EVENT_NEW_ORDER) playNewOrder();
  if (events & EVENT_SERVED) playServe();
  if (events & EVENT_COIN) playCoin();
  if (events & EVENT_EXPIRED) playExpired();
  if (events & EVENT_CHOP) playChop();
  if (events & EVENT_CHOP_DONE) playChopDone();
  if (events & EVENT_COOK_DONE) playCookDone();
  if (events & EVENT_BURNT) playBurnt();
  if (events & EVENT_ERROR) playError();
  if (events & EVENT_PICKUP) playPickup();
  if (events & EVENT_PLACE) playPlace();
}

function runShot(name) {
  renderer.resize();
  world.relayout(canvas.width, canvas.height);
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    // Only a live play scene highlights the station in reach.
    const nearest = scene.screen === SCREEN_PLAY ? world.nearestStation(world.state) : null;
    renderer.draw(world.state, scene.screen, scene.best, { nearest });
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  renderer.resize();
  world.relayout(canvas.width, canvas.height);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();
  let pendingInteract = null;
  let muted = false;

  // Clicking a station walks the chef to it; the work happens on arrival.
  function stationAt(x, y) {
    for (const station of Object.values(world.state.stations)) {
      const rect = station.rect;
      if (x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height) return station;
    }
    return null;
  }

  const input = createInput(canvas, {
    stationAt,
    onClickStation(station) {
      if (screen === SCREEN_TITLE || screen === SCREEN_OVER) {
        startGame();
        return;
      }
      if (screen !== SCREEN_PLAY) return;
      ensureAudio();
      resumeAudio();
      world.state.chef.target = {
        x: station.rect.x + station.rect.width / 2,
        y: station.rect.y + station.rect.height + 40 * world.state.unit,
      };
      pendingInteract = station.id;
      playClick();
    },
    onClickFloor(point) {
      if (screen === SCREEN_TITLE || screen === SCREEN_OVER) {
        startGame();
        return;
      }
      if (screen !== SCREEN_PLAY) return;
      ensureAudio();
      resumeAudio();
      world.state.chef.target = point;
      pendingInteract = null;
    },
  });

  window.addEventListener('resize', () => {
    renderer.resize();
    world.relayout(canvas.width, canvas.height);
  });

  // Screen readers (and anyone watching the page's text) hear the screen changes.
  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    ensureAudio();
    resumeAudio();
    startMusic();
    world.reset();
    accumulator = 0;
    pendingInteract = null;
    screen = SCREEN_PLAY;
    announce('Playing. Dinner service has started. First orders are coming in.');
  }

  function endGame() {
    screen = SCREEN_OVER;
    setSizzle(false);
    stopMusic();
    if (world.state.coins > best) {
      best = world.state.coins;
      saveBest(best);
    }
    announce(`Service over. You earned $${world.state.coins}. Best $${best}.`);
  }

  function handleActions() {
    const { actions, interactPressed } = input.takeActions();
    if (actions & ACTION_MUTE) {
      muted = !muted;
      if (muted) {
        stopMusic();
        setSizzle(false);
      } else if (screen === SCREEN_PLAY) {
        startMusic();
      }
      announce(muted ? 'Muted.' : 'Sound on.');
      return;
    }
    if (actions & ACTION_CONFIRM && (screen === SCREEN_TITLE || screen === SCREEN_OVER)) {
      startGame();
      return;
    }
    if (interactPressed && (screen === SCREEN_TITLE || screen === SCREEN_OVER)) {
      startGame();
      return;
    }
    if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      setSizzle(false);
      announce('Paused.');
      return;
    }
    if ((actions & ACTION_PAUSE || interactPressed) && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Playing.');
      return;
    }
    if (interactPressed && screen === SCREEN_PLAY) {
      const events = world.interact();
      soundEvents(events);
    }
  }

  function step() {
    if (screen === SCREEN_TITLE) return;
    const keys = input.direction();
    const chef = world.state.chef;
    let move = null;
    if (keys.x !== 0 || keys.y !== 0) {
      chef.target = null;
      pendingInteract = null;
      move = keys;
    } else if (chef.target) {
      move = { target: chef.target };
    }
    const events = world.step(STEP, move, input.isInteractHeld());
    soundEvents(events);
    setSizzle(world.isSizzling() && !muted);
    if (events & EVENT_OVER) endGame();
    else if (events & EVENT_EXPIRED) announce(`An order expired. ${world.state.hearts} hearts left.`);
    else if (events & EVENT_SERVED) announce(`Served! $${world.state.coins} so far.`);

    // Arrived at a clicked station: work it once.
    if (pendingInteract && chef.target === null) {
      const station = world.state.stations[pendingInteract];
      pendingInteract = null;
      if (station && world.nearestStation(world.state) === station) {
        soundEvents(world.interact());
      }
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    if (screen === SCREEN_TITLE || screen === SCREEN_PLAY) {
      while (accumulator >= STEP && (screen === SCREEN_TITLE || screen === SCREEN_PLAY)) {
        step();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    const nearest = screen === SCREEN_PLAY ? world.nearestStation(world.state) : null;
    renderer.draw(world.state, screen, best, { nearest });
  }

  // Leaving the tab pauses a running game rather than letting orders expire unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      setSizzle(false);
      announce('Paused.');
    }
  });

  announce('Copper Ladle Kitchen. Press Space or click to start.');
  // A handle for automated play-testing: the live world and the current screen.
  window.__copperLadle = { world, screen: () => screen };
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
