// Keyboard and mouse for the kitchen: WASD or arrows to walk, E or Space to work a
// station (hold it at the chopping board), click the floor to walk there, click a
// station to walk to it and work it on arrival, P or Escape to pause, M to mute.

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_MUTE = 4;

const MOVE_KEYS = {
  ArrowUp: [0, -1],
  KeyW: [0, -1],
  ArrowDown: [0, 1],
  KeyS: [0, 1],
  ArrowLeft: [-1, 0],
  KeyA: [-1, 0],
  ArrowRight: [1, 0],
  KeyD: [1, 0],
};

/**
 * Listen on the canvas and the window. `onInteract` fires once per press; the held
 * state is read every frame for chopping. `onClickStation` gets a station id when
 * the player clicks one; `onClickFloor` gets canvas coordinates for a walk target.
 */
export function createInput(canvas, hooks) {
  const keys = new Set();
  let actions = 0;
  let interactHeld = false;
  let interactPressed = false;

  function isInteractKey(code) {
    return code === 'KeyE' || code === 'Space';
  }

  window.addEventListener('keydown', (event) => {
    if (event.repeat) {
      if (isInteractKey(event.code)) event.preventDefault();
      return;
    }
    keys.add(event.code);
    if (isInteractKey(event.code)) {
      interactHeld = true;
      interactPressed = true;
      event.preventDefault();
    }
    if (event.code === 'KeyP' || event.code === 'Escape') actions |= ACTION_PAUSE;
    if (event.code === 'KeyM') actions |= ACTION_MUTE;
    if (event.code === 'Enter') actions |= ACTION_CONFIRM;
    if (event.code === 'Space' || event.code.startsWith('Arrow')) event.preventDefault();
  });

  window.addEventListener('keyup', (event) => {
    keys.delete(event.code);
    if (isInteractKey(event.code)) interactHeld = false;
  });

  window.addEventListener('blur', () => {
    keys.clear();
    interactHeld = false;
  });

  canvas.addEventListener('mousedown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    const station = hooks.stationAt ? hooks.stationAt(x, y) : null;
    if (station) hooks.onClickStation(station);
    else if (hooks.onClickFloor) hooks.onClickFloor({ x, y });
  });

  canvas.addEventListener('contextmenu', (event) => event.preventDefault());

  /** The walk direction from the keys held right now, normalised. */
  function direction() {
    let x = 0;
    let y = 0;
    for (const code of keys) {
      const move = MOVE_KEYS[code];
      if (move) {
        x += move[0];
        y += move[1];
      }
    }
    const length = Math.hypot(x, y);
    if (length === 0) return { x: 0, y: 0 };
    return { x: x / length, y: y / length };
  }

  /** One-shot actions since the last call, plus whether interact was just pressed. */
  function takeActions() {
    const taken = actions;
    actions = 0;
    const pressed = interactPressed;
    interactPressed = false;
    return { actions: taken, interactPressed: pressed };
  }

  return { direction, takeActions, isInteractHeld: () => interactHeld };
}
