// Copper Ladle Kitchen — everything the player sees, drawn on one canvas with plain
// 2D shapes: the tiled kitchen, the order board, the stations and their food, the
// chef, and the title, pause and game-over screens. No images, no fonts to load.

import { DAY_SECONDS, FLOOR_TOP_FRACTION, INGREDIENTS, PALETTE, FONT, RECIPES } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

/** Round a rectangle path, then fill or stroke it. */
function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
}

function circle(ctx, x, y, radius) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
}

/** Draw one ingredient at (x, y), about `size` pixels across. */
export function drawIngredient(ctx, name, x, y, size) {
  const s = size / 2;
  ctx.save();
  ctx.translate(x, y);
  if (name === 'bun') {
    ctx.fillStyle = '#e8a95c';
    roundRect(ctx, -s, -s * 0.25, s * 2, s * 0.7, s * 0.3);
    ctx.fill();
    ctx.fillStyle = '#f2c078';
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.25, s, s * 0.55, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#fff3d6';
    for (const [dx, dy] of [[-s * 0.45, -s * 0.4], [0, -s * 0.6], [s * 0.45, -s * 0.4], [-s * 0.2, -s * 0.3], [s * 0.25, -s * 0.3]]) {
      ellipse(ctx, dx, dy, s * 0.09, s * 0.06);
      ctx.fill();
    }
  } else if (name === 'patty') {
    ctx.fillStyle = '#a06a45';
    roundRect(ctx, -s, -s * 0.35, s * 2, s * 0.7, s * 0.3);
    ctx.fill();
    ctx.fillStyle = '#8a5a3b';
    for (const [dx, dy] of [[-s * 0.5, 0], [0, -s * 0.1], [s * 0.5, 0]]) {
      circle(ctx, dx, dy, s * 0.12);
      ctx.fill();
    }
  } else if (name === 'grilled-patty') {
    ctx.fillStyle = '#6b4226';
    roundRect(ctx, -s, -s * 0.35, s * 2, s * 0.7, s * 0.3);
    ctx.fill();
    ctx.strokeStyle = '#4a2c17';
    ctx.lineWidth = Math.max(1, s * 0.1);
    for (const dx of [-s * 0.5, 0, s * 0.5]) {
      ctx.beginPath();
      ctx.moveTo(dx, -s * 0.3);
      ctx.lineTo(dx, s * 0.3);
      ctx.stroke();
    }
  } else if (name === 'tomato') {
    ctx.fillStyle = '#e14b3a';
    circle(ctx, 0, 0, s * 0.9);
    ctx.fill();
    ctx.fillStyle = '#3f7d2e';
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.9);
    ctx.lineTo(-s * 0.25, -s * 1.15);
    ctx.lineTo(s * 0.25, -s * 1.15);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f28b7a';
    circle(ctx, -s * 0.3, -s * 0.3, s * 0.2);
    ctx.fill();
  } else if (name === 'chopped-tomato') {
    for (const dx of [-s * 0.45, s * 0.45]) {
      ctx.fillStyle = '#e14b3a';
      circle(ctx, dx, 0, s * 0.5);
      ctx.fill();
      ctx.fillStyle = '#f28b7a';
      circle(ctx, dx, 0, s * 0.28);
      ctx.fill();
      ctx.fillStyle = '#ffd9d0';
      circle(ctx, dx - s * 0.1, -s * 0.08, s * 0.07);
      ctx.fill();
      circle(ctx, dx + s * 0.12, s * 0.1, s * 0.07);
      ctx.fill();
    }
  } else if (name === 'lettuce') {
    ctx.fillStyle = '#5da244';
    for (const [dx, dy, r] of [[-s * 0.4, s * 0.2, s * 0.55], [s * 0.4, s * 0.2, s * 0.55], [0, -s * 0.35, s * 0.6]]) {
      circle(ctx, dx, dy, r);
      ctx.fill();
    }
    ctx.strokeStyle = '#7cbf5e';
    ctx.lineWidth = Math.max(1, s * 0.08);
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.8);
    ctx.lineTo(0, s * 0.6);
    ctx.stroke();
  } else if (name === 'chopped-lettuce') {
    ctx.strokeStyle = '#5da244';
    ctx.lineCap = 'round';
    ctx.lineWidth = Math.max(2, s * 0.16);
    for (const [x1, y1, x2, y2] of [
      [-s * 0.8, -s * 0.4, -s * 0.1, -s * 0.55],
      [-s * 0.6, s * 0.1, s * 0.2, -s * 0.1],
      [-s * 0.5, s * 0.55, s * 0.3, s * 0.4],
      [s * 0.1, -s * 0.6, s * 0.8, -s * 0.4],
      [s * 0.3, s * 0.2, s * 0.85, s * 0.45],
    ]) {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  } else if (name === 'cheese') {
    ctx.fillStyle = '#f2c94c';
    ctx.beginPath();
    ctx.moveTo(-s * 0.9, s * 0.6);
    ctx.lineTo(s * 0.9, s * 0.6);
    ctx.lineTo(0, -s * 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#d9a521';
    for (const [dx, dy] of [[-s * 0.3, s * 0.25], [s * 0.25, s * 0.3], [0, -s * 0.25]]) {
      circle(ctx, dx, dy, s * 0.13);
      ctx.fill();
    }
  } else if (name === 'onion') {
    ctx.fillStyle = '#e8ddf2';
    circle(ctx, 0, 0, s * 0.85);
    ctx.fill();
    ctx.strokeStyle = '#b48ec9';
    ctx.lineWidth = Math.max(1, s * 0.09);
    for (const r of [0.65, 0.42, 0.2]) {
      circle(ctx, 0, 0, s * r);
      ctx.stroke();
    }
  } else if (name === 'chopped-onion') {
    ctx.strokeStyle = '#e8ddf2';
    ctx.lineWidth = Math.max(2, s * 0.14);
    for (const [cx, cy, r] of [[-s * 0.4, -s * 0.2, s * 0.35], [s * 0.4, s * 0.15, s * 0.35], [0, s * 0.45, s * 0.3]]) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (name === 'melt') {
    ctx.fillStyle = '#e8a95c';
    roundRect(ctx, -s, -s * 0.25, s * 2, s * 0.7, s * 0.3);
    ctx.fill();
    ctx.fillStyle = '#f2c94c';
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.3, s * 0.95, s * 0.4, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#f2c94c';
    for (const dx of [-s * 0.6, -s * 0.1, s * 0.5]) {
      roundRect(ctx, dx - s * 0.12, -s * 0.3, s * 0.24, s * 0.55, s * 0.1);
      ctx.fill();
    }
  } else if (name === 'soup') {
    ctx.fillStyle = '#f7f4ec';
    ctx.beginPath();
    ctx.ellipse(0, s * 0.15, s, s * 0.55, 0, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = '#c94f2e';
    ellipse(ctx, 0, s * 0.1, s * 0.82, s * 0.28);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = Math.max(1, s * 0.08);
    ctx.beginPath();
    ctx.moveTo(-s * 0.3, -s * 0.5);
    ctx.quadraticCurveTo(-s * 0.1, -s * 0.8, -s * 0.3, -s * 1.05);
    ctx.moveTo(s * 0.25, -s * 0.5);
    ctx.quadraticCurveTo(s * 0.45, -s * 0.8, s * 0.25, -s * 1.05);
    ctx.stroke();
  } else if (name === 'burnt') {
    ctx.fillStyle = '#2b2b2b';
    for (const [dx, dy, r] of [[-s * 0.35, s * 0.15, s * 0.5], [s * 0.35, s * 0.15, s * 0.5], [0, -s * 0.3, s * 0.55]]) {
      circle(ctx, dx, dy, r);
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(120,120,120,0.8)';
    ctx.lineWidth = Math.max(1, s * 0.08);
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.7);
    ctx.quadraticCurveTo(s * 0.2, -s * 1.0, 0, -s * 1.25);
    ctx.stroke();
  }
  ctx.restore();
}

/** A plate with its stack of ingredients, drawn from above. */
function drawPlate(ctx, x, y, size, items) {
  const s = size / 2;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#d8d2c2';
  ellipse(ctx, 0, s * 0.08, s, s * 0.72);
  ctx.fill();
  ctx.fillStyle = PALETTE.plate;
  ellipse(ctx, 0, 0, s * 0.92, s * 0.66);
  ctx.fill();
  ctx.strokeStyle = '#c9c2ae';
  ctx.lineWidth = Math.max(1, s * 0.05);
  ellipse(ctx, 0, 0, s * 0.68, s * 0.46);
  ctx.stroke();
  ctx.restore();
  if (items && items.length > 0) {
    const spread = Math.min(size * 0.32, 26);
    items.forEach((item, index) => {
      const offset = (index - (items.length - 1) / 2) * spread * 0.5;
      drawIngredient(ctx, item, x + offset, y - size * 0.06 - index * 2, size * 0.52);
    });
  }
}

/** A progress bar above a station: chopping, grilling or simmering. */
function drawProgress(ctx, x, y, width, progress, done, colour) {
  const height = 9;
  ctx.fillStyle = 'rgba(43,33,24,0.55)';
  roundRect(ctx, x - width / 2, y, width, height, height / 2);
  ctx.fill();
  ctx.fillStyle = done ? '#2e7d32' : colour;
  if (progress > 0) {
    roundRect(ctx, x - width / 2, y, Math.max(height, width * progress), height, height / 2);
    ctx.fill();
  }
}

function drawStationBase(ctx, station, highlight) {
  const rect = station.rect;
  const u = Math.min(rect.width / 200, rect.height / 120);
  ctx.save();
  if (station.kind === 'board' || station.kind === 'plating') {
    ctx.fillStyle = PALETTE.counterWood;
    roundRect(ctx, rect.x, rect.y, rect.width, rect.height, 10);
    ctx.fill();
    ctx.fillStyle = station.kind === 'board' ? PALETTE.board : PALETTE.counterTop;
    roundRect(ctx, rect.x + 4, rect.y + 4, rect.width - 8, rect.height - 8, 8);
    ctx.fill();
  } else if (station.kind === 'grill') {
    ctx.fillStyle = PALETTE.steelDark;
    roundRect(ctx, rect.x, rect.y, rect.width, rect.height, 10);
    ctx.fill();
    ctx.fillStyle = PALETTE.grill;
    roundRect(ctx, rect.x + 6, rect.y + 6, rect.width - 12, rect.height - 12, 8);
    ctx.fill();
    ctx.strokeStyle = '#5a5e66';
    ctx.lineWidth = 2;
    for (let i = 1; i < 8; i += 1) {
      const gx = rect.x + (rect.width / 8) * i;
      ctx.beginPath();
      ctx.moveTo(gx, rect.y + 10);
      ctx.lineTo(gx, rect.y + rect.height - 10);
      ctx.stroke();
    }
  } else if (station.kind === 'pot') {
    ctx.fillStyle = PALETTE.counterWood;
    roundRect(ctx, rect.x, rect.y, rect.width, rect.height, 10);
    ctx.fill();
    ctx.fillStyle = PALETTE.counterTop;
    roundRect(ctx, rect.x + 4, rect.y + 4, rect.width - 8, rect.height - 8, 8);
    ctx.fill();
  } else if (station.kind === 'serve') {
    ctx.fillStyle = PALETTE.serve;
    roundRect(ctx, rect.x, rect.y, rect.width, rect.height, 10);
    ctx.fill();
    ctx.fillStyle = '#c96a3f';
    roundRect(ctx, rect.x + 4, rect.y + 4, rect.width - 8, rect.height - 8, 8);
    ctx.fill();
  } else if (station.kind === 'bin') {
    ctx.fillStyle = PALETTE.counterWood;
    roundRect(ctx, rect.x, rect.y, rect.width, rect.height, 10);
    ctx.fill();
    ctx.fillStyle = '#f3e9d2';
    roundRect(ctx, rect.x + 5, rect.y + 5, rect.width - 10, rect.height - 10, 8);
    ctx.fill();
  } else {
    ctx.fillStyle = PALETTE.counterWood;
    roundRect(ctx, rect.x, rect.y, rect.width, rect.height, 10);
    ctx.fill();
    ctx.fillStyle = PALETTE.counterTop;
    roundRect(ctx, rect.x + 4, rect.y + 4, rect.width - 8, rect.height - 8, 8);
    ctx.fill();
  }
  if (highlight) {
    ctx.strokeStyle = '#ffd54a';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#ffd54a';
    ctx.shadowBlur = 14;
    roundRect(ctx, rect.x - 3, rect.y - 3, rect.width + 6, rect.height + 6, 12);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
  ctx.restore();

  // The station's name, small and tucked at its foot, clear of the progress bar.
  ctx.fillStyle = PALETTE.text;
  ctx.font = `600 ${Math.max(10, 13 * u)}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(station.label, rect.x + rect.width / 2, rect.y + rect.height - 5);
}

/** The food and progress sitting on one station. */
function drawStationContents(ctx, station, state) {
  const rect = station.rect;
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2 - 8;
  const size = Math.min(rect.width * 0.42, rect.height * 0.62);
  if (station.kind === 'bin') {
    drawIngredient(ctx, station.gives, cx, cy, size * 1.15);
    ctx.fillStyle = 'rgba(58,42,26,0.55)';
    ctx.font = `700 ${Math.max(10, size * 0.28)}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('∞', cx, rect.y + rect.height - 20);
  } else if (station.kind === 'plates') {
    for (let i = 0; i < 3; i += 1) drawPlate(ctx, cx, cy - i * 5, size * 1.1, []);
  } else if (station.kind === 'trash') {
    ctx.fillStyle = '#5b6b7a';
    roundRect(ctx, cx - size * 0.4, cy - size * 0.45, size * 0.8, size * 0.9, 6);
    ctx.fill();
    ctx.fillStyle = '#7d8b99';
    roundRect(ctx, cx - size * 0.48, cy - size * 0.55, size * 0.96, size * 0.16, 6);
    ctx.fill();
  } else if (station.kind === 'board') {
    if (station.item) {
      drawIngredient(ctx, station.item, cx, cy, size * 1.2);
      if (INGREDIENTS[station.item].chop) {
        drawProgress(ctx, cx, rect.y + rect.height - 30, rect.width * 0.7, station.progress, false, '#e8a95c');
      }
    } else {
      ctx.fillStyle = 'rgba(58,42,26,0.35)';
      ctx.font = `600 ${Math.max(11, size * 0.24)}px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('chop here', cx, cy);
    }
  } else if (station.kind === 'grill') {
    station.slots.forEach((slot, index) => {
      const sx = rect.x + rect.width * (0.28 + index * 0.44);
      if (!slot) return;
      drawIngredient(ctx, slot.item, sx, cy, size * 1.05);
      const colour = slot.item === 'burnt' ? '#2b2b2b' : '#e8833a';
      drawProgress(ctx, sx, rect.y + rect.height - 30, rect.width * 0.36, slot.progress, slot.done, colour);
      if (slot.done && slot.item !== 'burnt') {
        ctx.fillStyle = '#2e7d32';
        ctx.font = `700 ${Math.max(11, size * 0.26)}px ${FONT}`;
        ctx.textAlign = 'center';
        ctx.fillText('READY', sx, rect.y + 18);
      }
      if (slot.item === 'burnt') {
        ctx.fillStyle = '#c0392b';
        ctx.font = `700 ${Math.max(11, size * 0.26)}px ${FONT}`;
        ctx.textAlign = 'center';
        ctx.fillText('BURNT!', sx, rect.y + 18);
      }
    });
  } else if (station.kind === 'pot') {
    const px = cx;
    const py = cy + 6;
    ctx.fillStyle = '#3d4a57';
    ctx.beginPath();
    ctx.ellipse(px, py + size * 0.3, size * 0.62, size * 0.3, 0, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = PALETTE.pot;
    roundRect(ctx, px - size * 0.62, py - size * 0.35, size * 1.24, size * 0.62, 8);
    ctx.fill();
    if (station.contents.length === 2 && !station.ready) {
      ctx.fillStyle = '#c94f2e';
      ellipse(ctx, px, py - size * 0.28, size * 0.5, size * 0.16);
      ctx.fill();
      drawProgress(ctx, px, rect.y + rect.height - 30, rect.width * 0.7, station.progress, false, '#c94f2e');
    } else if (station.ready) {
      ctx.fillStyle = '#c94f2e';
      ellipse(ctx, px, py - size * 0.28, size * 0.5, size * 0.16);
      ctx.fill();
      ctx.fillStyle = '#2e7d32';
      ctx.font = `700 ${Math.max(11, size * 0.26)}px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('SOUP READY — ladle it!', px, rect.y + 18);
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.font = `600 ${Math.max(11, size * 0.24)}px ${FONT}`;
      ctx.textAlign = 'center';
      const missing = [];
      if (!station.contents.includes('chopped-tomato')) missing.push('tomato');
      if (!station.contents.includes('chopped-onion')) missing.push('onion');
      ctx.fillText(missing.length === 2 ? 'tomato + onion' : `+ ${missing[0]}`, px, py - size * 0.5);
      station.contents.forEach((item, index) => {
        drawIngredient(ctx, item, px + (index - 0.5) * size * 0.5, py - size * 0.28, size * 0.4);
      });
    }
  } else if (station.kind === 'plating') {
    if (station.plate) drawPlate(ctx, cx, cy, size * 1.25, station.plate.items);
    else {
      ctx.fillStyle = 'rgba(58,42,26,0.35)';
      ctx.font = `600 ${Math.max(11, size * 0.24)}px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('build the dish here', cx, cy);
    }
  } else if (station.kind === 'serve') {
    ctx.fillStyle = '#ffd54a';
    circle(ctx, cx, cy - size * 0.1, size * 0.34);
    ctx.fill();
    ctx.fillStyle = '#b48a1d';
    circle(ctx, cx, cy - size * 0.1, size * 0.2);
    ctx.fill();
    ctx.fillStyle = '#3a2a1a';
    ctx.font = `700 ${Math.max(11, size * 0.24)}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('RING THE BELL', cx, cy + size * 0.55);
  }
}

/** The chef: white coat, blue apron, tall hat, and whatever they are carrying. */
function drawChef(ctx, chef, unit) {
  const r = 26 * unit;
  const x = chef.x;
  const y = chef.y;
  const bob = chef.moving ? Math.sin(performance.now() / 90) * 2 * unit : 0;

  ctx.save();
  // Soft shadow.
  ctx.fillStyle = 'rgba(43,33,24,0.25)';
  ellipse(ctx, x, y + r * 0.85, r * 0.9, r * 0.28);
  ctx.fill();

  // Coat and apron.
  ctx.fillStyle = PALETTE.chefCoat;
  circle(ctx, x, y + bob, r);
  ctx.fill();
  ctx.fillStyle = PALETTE.apron;
  ctx.beginPath();
  ctx.ellipse(x, y + r * 0.35 + bob, r * 0.62, r * 0.55, 0, 0, Math.PI);
  ctx.fill();
  ctx.fillStyle = '#f7f4ec';
  roundRect(ctx, x - r * 0.5, y - r * 0.55 + bob, r, r * 0.4, r * 0.2);
  ctx.fill();

  // Face and hat.
  ctx.fillStyle = '#f2c9a0';
  circle(ctx, x + chef.facing * r * 0.08, y - r * 0.55 + bob, r * 0.52);
  ctx.fill();
  ctx.fillStyle = '#3a2a1a';
  circle(ctx, x - r * 0.2 + chef.facing * r * 0.1, y - r * 0.6 + bob, r * 0.07);
  ctx.fill();
  circle(ctx, x + r * 0.2 + chef.facing * r * 0.1, y - r * 0.6 + bob, r * 0.07);
  ctx.fill();
  ctx.strokeStyle = '#3a2a1a';
  ctx.lineWidth = Math.max(1, r * 0.05);
  ctx.beginPath();
  ctx.arc(x + chef.facing * r * 0.08, y - r * 0.42 + bob, r * 0.16, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();

  // The tall chef's hat.
  ctx.fillStyle = PALETTE.chefHat;
  roundRect(ctx, x - r * 0.62, y - r * 1.55 + bob, r * 1.24, r * 0.75, r * 0.3);
  ctx.fill();
  circle(ctx, x - r * 0.45, y - r * 1.35 + bob, r * 0.34);
  ctx.fill();
  circle(ctx, x + r * 0.45, y - r * 1.35 + bob, r * 0.34);
  ctx.fill();
  circle(ctx, x, y - r * 1.5 + bob, r * 0.38);
  ctx.fill();

  // Whatever is carried rides above the hat.
  const carried = chef.carrying;
  if (carried) {
    if (carried.type === 'plate') drawPlate(ctx, x, y - r * 2.15 + bob, r * 1.9, carried.items);
    else drawIngredient(ctx, carried.name, x, y - r * 2.05 + bob, r * 1.5);
  }
  ctx.restore();
}

/** One order ticket pinned to the board, with its recipe and its patience. */
function drawTicket(ctx, order, x, y, width, height, unit) {
  const fraction = Math.max(0, order.patience / order.maxPatience);
  ctx.save();
  ctx.fillStyle = PALETTE.ticket;
  roundRect(ctx, x, y, width, height, 8);
  ctx.fill();
  ctx.strokeStyle = PALETTE.ticketEdge;
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, width, height, 8);
  ctx.stroke();
  // The pin.
  ctx.fillStyle = '#c0392b';
  circle(ctx, x + width / 2, y + 5, 4);
  ctx.fill();

  ctx.fillStyle = PALETTE.text;
  ctx.font = `700 ${Math.max(11, 15 * unit)}px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(`#${order.id} ${order.recipe.name}`, x + 10, y + height * 0.32);
  ctx.font = `600 ${Math.max(10, 13 * unit)}px ${FONT}`;
  ctx.fillStyle = PALETTE.muted;
  ctx.fillText(`$${order.recipe.price}`, x + 10, y + height * 0.58);

  // The dish, as a row of little ingredients.
  let iconX = x + width - 14;
  for (let index = order.recipe.needs.length - 1; index >= 0; index -= 1) {
    drawIngredient(ctx, order.recipe.needs[index], iconX, y + height * 0.52, 26 * unit);
    iconX -= 28 * unit;
  }

  // Patience: green to red as the ticket ages.
  const barY = y + height - 12;
  ctx.fillStyle = 'rgba(43,33,24,0.25)';
  roundRect(ctx, x + 10, barY, width - 20, 6, 3);
  ctx.fill();
  ctx.fillStyle = fraction > 0.5 ? '#5da244' : fraction > 0.25 ? '#e8a13a' : '#c0392b';
  roundRect(ctx, x + 10, barY, Math.max(6, (width - 20) * fraction), 6, 3);
  ctx.fill();
  ctx.restore();
}

/** The top strip: the clock, the order board, the coins, hearts and combo. */
function drawHud(ctx, state, width, height, unit) {
  const hudHeight = FLOOR_TOP_FRACTION * height;
  ctx.fillStyle = PALETTE.hud;
  ctx.fillRect(0, 0, width, hudHeight);
  ctx.fillStyle = '#3d2f22';
  ctx.fillRect(0, hudHeight - 4, width, 4);

  // The clock: minutes and seconds, plus a bar of the day.
  const minutes = Math.floor(state.timeLeft / 60);
  const seconds = Math.floor(state.timeLeft % 60);
  const clock = `${minutes}:${String(seconds).padStart(2, '0')}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = state.timeLeft <= 30 ? '#ff8a7a' : '#f7f4ec';
  ctx.font = `700 ${Math.max(16, 30 * unit)}px ${FONT}`;
  ctx.fillText(clock, 14, hudHeight * 0.48);
  ctx.fillStyle = '#cbb894';
  ctx.font = `600 ${Math.max(10, 13 * unit)}px ${FONT}`;
  ctx.fillText('DINNER SERVICE', 14, hudHeight * 0.82);
  const barWidth = Math.min(190 * unit, width * 0.14);
  ctx.fillStyle = 'rgba(247,244,236,0.25)';
  roundRect(ctx, 14, hudHeight * 0.56, barWidth, 6, 3);
  ctx.fill();
  ctx.fillStyle = '#f2c94c';
  roundRect(ctx, 14, hudHeight * 0.56, Math.max(6, barWidth * (state.timeLeft / DAY_SECONDS)), 6, 3);
  ctx.fill();

  // Hearts under the clock.
  for (let index = 0; index < 3; index += 1) {
    const hx = 20 + index * 24 * unit;
    const hy = hudHeight * 0.48 + 26 * unit;
    ctx.fillStyle = index < state.hearts ? '#e14b3a' : 'rgba(247,244,236,0.25)';
    ctx.beginPath();
    ctx.moveTo(hx, hy + 5 * unit);
    ctx.bezierCurveTo(hx - 9 * unit, hy - 4 * unit, hx - 4 * unit, hy - 12 * unit, hx, hy - 5 * unit);
    ctx.bezierCurveTo(hx + 4 * unit, hy - 12 * unit, hx + 9 * unit, hy - 4 * unit, hx, hy + 5 * unit);
    ctx.fill();
  }

  // The order board: tickets in a row across the middle.
  const ticketWidth = Math.min(200 * unit, width * 0.15);
  const ticketHeight = hudHeight - 16;
  const gap = 10;
  const totalWidth = state.orders.length * ticketWidth + Math.max(0, state.orders.length - 1) * gap;
  let ticketX = (width - totalWidth) / 2;
  if (state.orders.length === 0) {
    ctx.fillStyle = '#cbb894';
    ctx.font = `600 ${Math.max(12, 16 * unit)}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('Orders will appear here — keep the board clear!', width / 2, hudHeight * 0.55);
  }
  for (const order of state.orders) {
    drawTicket(ctx, order, ticketX, 8, ticketWidth, ticketHeight, unit);
    ticketX += ticketWidth + gap;
  }

  // Coins and combo on the right.
  ctx.textAlign = 'right';
  ctx.fillStyle = '#f2c94c';
  ctx.font = `700 ${Math.max(16, 28 * unit)}px ${FONT}`;
  ctx.fillText(`$${state.coins}`, width - 14, hudHeight * 0.46);
  ctx.fillStyle = '#cbb894';
  ctx.font = `600 ${Math.max(10, 13 * unit)}px ${FONT}`;
  ctx.fillText(`served ${state.served}`, width - 14, hudHeight * 0.78);
  if (state.combo >= 2) {
    ctx.fillStyle = '#ffb347';
    ctx.font = `700 ${Math.max(12, 17 * unit)}px ${FONT}`;
    ctx.fillText(`COMBO x${state.combo}`, width - 14, hudHeight * 0.46 - 30 * unit);
  }
}

/** The kitchen floor: warm tiles and the wall behind the counters. */
function drawKitchen(ctx, width, height) {
  const floorTop = FLOOR_TOP_FRACTION * height;
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(0, 0, width, floorTop);
  ctx.fillStyle = PALETTE.wallTrim;
  ctx.fillRect(0, floorTop - 10, width, 10);

  const tile = 64;
  for (let y = floorTop; y < height; y += tile) {
    for (let x = 0; x < width; x += tile) {
      const even = (Math.floor(x / tile) + Math.floor(y / tile)) % 2 === 0;
      ctx.fillStyle = even ? PALETTE.floorA : PALETTE.floorB;
      ctx.fillRect(x, y, tile, tile);
    }
  }
  // A copper rail along the wall, with hanging pans.
  ctx.strokeStyle = '#8a6a3f';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, floorTop - 26);
  ctx.lineTo(width, floorTop - 26);
  ctx.stroke();
  for (let index = 0; index < 5; index += 1) {
    const px = width * (0.08 + index * 0.05);
    ctx.fillStyle = '#7d5230';
    ctx.fillRect(px - 2, floorTop - 26, 4, 12);
    ctx.fillStyle = index % 2 === 0 ? '#b9c2cc' : '#c97e4a';
    circle(ctx, px, floorTop - 6, 11);
    ctx.fill();
  }
}

/** The menu of dishes, for the title screen and the pause screen. */
function drawMenuCard(ctx, width, height, unit) {
  const cardWidth = Math.min(560, width * 0.62);
  const cardHeight = 30 + RECIPES.length * 44 * unit + 30;
  const x = (width - cardWidth) / 2;
  const y = height * 0.52;
  ctx.fillStyle = 'rgba(43,33,24,0.82)';
  roundRect(ctx, x, y, cardWidth, cardHeight, 12);
  ctx.fill();
  ctx.fillStyle = '#f7f4ec';
  ctx.font = `700 ${Math.max(13, 18 * unit)}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText('— TONIGHT’S MENU —', width / 2, y + 26);
  RECIPES.forEach((recipe, index) => {
    const rowY = y + 52 + index * 44 * unit;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f7f4ec';
    ctx.font = `600 ${Math.max(12, 16 * unit)}px ${FONT}`;
    ctx.fillText(recipe.name, x + 20, rowY);
    ctx.fillStyle = '#cbb894';
    ctx.font = `${Math.max(11, 13 * unit)}px ${FONT}`;
    ctx.fillText(recipe.blurb, x + 20, rowY + 17);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#f2c94c';
    ctx.font = `700 ${Math.max(12, 16 * unit)}px ${FONT}`;
    ctx.fillText(`$${recipe.price}`, x + cardWidth - 20, rowY);
    let iconX = x + cardWidth - 70;
    for (let i = recipe.needs.length - 1; i >= 0; i -= 1) {
      drawIngredient(ctx, recipe.needs[i], iconX, rowY - 4, 22 * unit);
      iconX -= 24 * unit;
    }
  });
  return y + cardHeight;
}

function drawTitle(ctx, state, width, height, unit, best) {
  ctx.fillStyle = 'rgba(43,33,24,0.45)';
  ctx.fillRect(0, 0, width, height);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f7f4ec';
  ctx.font = `700 ${Math.max(28, 54 * unit)}px ${FONT}`;
  ctx.fillText('COPPER LADLE KITCHEN', width / 2, height * 0.24);
  ctx.fillStyle = '#f2c94c';
  ctx.font = `600 ${Math.max(14, 22 * unit)}px ${FONT}`;
  ctx.fillText('One chef. One rush. Dinner service starts now.', width / 2, height * 0.24 + 36 * unit);
  const cardBottom = drawMenuCard(ctx, width, height, unit);
  ctx.fillStyle = '#f7f4ec';
  ctx.font = `700 ${Math.max(14, 20 * unit)}px ${FONT}`;
  const blink = Math.floor(performance.now() / 500) % 2 === 0;
  if (blink) ctx.fillText('Press SPACE or click to start cooking', width / 2, cardBottom + 28);
  ctx.fillStyle = '#cbb894';
  ctx.font = `${Math.max(11, 14 * unit)}px ${FONT}`;
  ctx.fillText('WASD / arrows to walk · E or click a station to work it · hold E to chop · P pauses · M mutes', width / 2, height - 10);
  if (best > 0) {
    ctx.fillStyle = '#f2c94c';
    ctx.font = `700 ${Math.max(12, 16 * unit)}px ${FONT}`;
    ctx.fillText(`Best service so far: $${best}`, width / 2, height * 0.24 + 66 * unit);
  }
}

function drawPaused(ctx, width, height, unit) {
  ctx.fillStyle = 'rgba(43,33,24,0.55)';
  ctx.fillRect(0, 0, width, height);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f7f4ec';
  ctx.font = `700 ${Math.max(24, 40 * unit)}px ${FONT}`;
  ctx.fillText('Paused — the stove waits', width / 2, height / 2 - 10);
  ctx.font = `${Math.max(12, 16 * unit)}px ${FONT}`;
  ctx.fillStyle = '#cbb894';
  ctx.fillText('Press P or Space to get back to the pass', width / 2, height / 2 + 26);
}

function drawOver(ctx, state, width, height, unit, best) {
  ctx.fillStyle = 'rgba(43,33,24,0.6)';
  ctx.fillRect(0, 0, width, height);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f7f4ec';
  ctx.font = `700 ${Math.max(26, 46 * unit)}px ${FONT}`;
  ctx.fillText('Service complete!', width / 2, height * 0.26);
  ctx.fillStyle = '#f2c94c';
  ctx.font = `700 ${Math.max(20, 34 * unit)}px ${FONT}`;
  ctx.fillText(`You earned $${state.coins}`, width / 2, height * 0.26 + 48 * unit);
  ctx.fillStyle = '#f7f4ec';
  ctx.font = `${Math.max(13, 18 * unit)}px ${FONT}`;
  const lines = [
    `Dishes served: ${state.served}`,
    `Orders expired: ${state.expired} · Dishes burnt: ${state.burntCount}`,
    `Best combo: x${state.bestCombo}`,
    state.overReason,
  ];
  lines.forEach((line, index) => {
    ctx.fillText(line, width / 2, height * 0.42 + index * 30 * unit);
  });
  if (state.coins >= best && state.coins > 0) {
    ctx.fillStyle = '#f2c94c';
    ctx.font = `700 ${Math.max(13, 18 * unit)}px ${FONT}`;
    ctx.fillText('A new best service!', width / 2, height * 0.42 + 4 * 30 * unit);
  }
  const blink = Math.floor(performance.now() / 500) % 2 === 0;
  if (blink) {
    ctx.fillStyle = '#f7f4ec';
    ctx.font = `700 ${Math.max(14, 20 * unit)}px ${FONT}`;
    ctx.fillText('Press SPACE to cook again', width / 2, height * 0.42 + 5 * 30 * unit + 20);
  }
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  /** Paint the whole kitchen for this screen. `ui` carries the nearest station and hints. */
  function draw(state, screen, best, ui) {
    const width = canvas.width;
    const height = canvas.height;
    const unit = Math.min(width / 1280, height / 720);
    ctx.clearRect(0, 0, width, height);
    drawKitchen(ctx, width, height);

    const nearest = ui && ui.nearest ? ui.nearest : null;
    for (const station of Object.values(state.stations)) {
      drawStationBase(ctx, station, nearest !== null && station.id === nearest.id);
      drawStationContents(ctx, station, state);
    }

    // The "E" key hint above the station in reach.
    if (nearest && screen === SCREEN_PLAY) {
      const rect = nearest.rect;
      ctx.fillStyle = '#ffd54a';
      ctx.strokeStyle = '#3a2a1a';
      ctx.lineWidth = 2;
      roundRect(ctx, rect.x + rect.width / 2 - 14, rect.y - 30, 28, 24, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#3a2a1a';
      ctx.font = `700 15px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('E', rect.x + rect.width / 2, rect.y - 12);
    }

    drawChef(ctx, state.chef, unit);

    // Floating labels: tips, warnings and earnings.
    ctx.textAlign = 'center';
    for (const floater of state.floaters) {
      ctx.globalAlpha = Math.max(0, Math.min(1, floater.life));
      ctx.fillStyle = floater.colour;
      ctx.font = `700 ${Math.max(13, 18 * unit)}px ${FONT}`;
      ctx.fillText(floater.text, floater.x, floater.y);
    }
    ctx.globalAlpha = 1;

    drawHud(ctx, state, width, height, unit);

    // The bottom hint line, so a first-time cook is never lost.
    if (screen === SCREEN_PLAY) {
      ctx.fillStyle = 'rgba(43,33,24,0.55)';
      ctx.fillRect(0, height - 26, width, 26);
      ctx.fillStyle = '#f3e9d2';
      ctx.font = `${Math.max(11, 13 * unit)}px ${FONT}`;
      ctx.textAlign = 'center';
      const carried = state.chef.carrying;
      const hint = carried
        ? carried.type === 'plate'
          ? `Plate: ${carried.items.length === 0 ? 'empty — add ingredients at the plating counter' : carried.items.join(' + ')}`
          : `Carrying ${INGREDIENTS[carried.name].label} — take it to the board, grill, pot or plating counter`
        : 'Pick up an ingredient from a bin, or a plate from the stack';
      ctx.fillText(hint, width / 2, height - 8);
    }

    if (screen === SCREEN_TITLE) drawTitle(ctx, state, width, height, unit, best);
    else if (screen === SCREEN_PAUSED) drawPaused(ctx, width, height, unit);
    else if (screen === SCREEN_OVER) drawOver(ctx, state, width, height, unit, best);
  }

  return { draw, resize };
}
