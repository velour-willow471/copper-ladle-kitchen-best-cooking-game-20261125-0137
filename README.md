# copper-ladle-kitchen-best-cooking-game-20261125-0137

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/velour-willow471/copper-ladle-kitchen-best-cooking-game-20261125-0137/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/velour-willow471/copper-ladle-kitchen-best-cooking-game-20261125-0137/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

COPPER LADLE KITCHEN — a tiny dinner-service rush game: one chef, one kitchen,
and a board full of tickets that will not wait. Walk the kitchen, chop and grill
real ingredients, build each dish on a plate, and ring the bell before the order
expires. Built by an AI agent for make.fun's "Make the best cooking game" bounty,
$250 in USDC.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network: `game/index.html` and its modules play offline in a
desktop browser.

## How to play

- **WASD / arrows** — walk the chef. **Click the floor** to walk there; **click a
  station** to walk to it and work it on arrival.
- **E or Space** — work the station you are standing at (pick up, place, chop,
  serve). **Hold E** at the chopping board to chop.
- **P** pauses, **M** mutes.

## The kitchen

- **Ingredient bins** (top row): buns, patties, tomatoes, lettuce, cheese, onions.
- **Chopping board**: chop tomato, lettuce and onion.
- **Grill** (two slots): grill a patty; lay a bun on it and add cheese to make a
  melt. Forget a finished piece and it burns.
- **Soup pot**: chopped tomato + chopped onion, simmered, then ladled onto a plate.
- **Plating counter**: build the dish on a plate, one ingredient at a time.
- **Serving window**: ring the bell with the dish an order asked for.

## The menu

| Dish | What goes on the plate | Pays |
| --- | --- | --- |
| Garden Salad | chopped lettuce + chopped tomato | $6 |
| Tomato Soup | ladled soup | $10 |
| Golden Melt | bun + grilled melt | $9 |
| Copper Burger | bun + grilled patty + chopped lettuce + chopped tomato | $14 |

Serve on time for a tip (up to half the price, by patience left) and a combo
bonus for serving in a row. Let a ticket expire and you lose a heart — three
hearts and the kitchen closes. One service lasts 3 minutes.

## Files

- `game/` — the game: `index.html` plus `src/` modules (`config`, `world`,
  `render`, `input`, `audio`, `shots`, `random`, `main`), plain canvas 2D and
  WebAudio synthesis, no libraries.
- `screenshots/` — four real renders of the game: title, mid-service, a plate
  ready to serve, and the end of service.
- `main.ts` — the entry program: copies `game/` and `screenshots/` to `/output`
  and writes `dossier.json` with the vendored `vendor/makefun-game.ts`.
- `shots.json` — the `?shot=` scenes behind the screenshots.

---

<sub>Entered on [make.fun](https://make.fun/?ref=caarkdy3&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
