// Play-test and screenshot Copper Ladle Kitchen in headless Chrome.
// Usage: node test-and-shoot.mjs [port]
// - loads the game, records every request and console error (must be local only),
// - plays a real serve cycle through the game's own interact() calls,
// - captures the four ?shot= scenes at 1280x480 as JPEGs into screenshots/.
import puppeteer from 'puppeteer-core';
import { accessSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';

const PORT = Number(process.argv[2] ?? 8081);
const REPO = new URL('.', import.meta.url).pathname;
const CHROME = '/opt/meta-chromium/chrome';
const BASE = `http://127.0.0.1:${PORT}`;
const SHOTS = [
  { name: '1-start.jpg', query: '?shot=start&seed=1' },
  { name: '2-play.jpg', query: '?shot=play&seed=1' },
  { name: '3-serve.jpg', query: '?shot=serve&seed=1' },
  { name: '4-end.jpg', query: '?shot=end&seed=1' },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const server = spawn('node', ['serve.ts', '--port', String(PORT)], {
    cwd: REPO,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stdout.on('data', (chunk) => process.stdout.write(`[serve] ${chunk}`));
  server.stderr.on('data', (chunk) => process.stderr.write(`[serve:err] ${chunk}`));
  await sleep(1200);

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--no-proxy-server',
      // Chrome 157 blocks DevTools-driven navigation to loopback (Local Network
      // Access); reclassifying this one test server as public unblocks it.
      `--ip-address-space-overrides=127.0.0.1:${PORT}=public`,
      '--window-size=1280,480',
      '--hatch-webgl-allowed-domains-file=/var/lib/hatch-browser/rootfs-base/usr/share/hatch/chromium/webgl-allowed-domains.txt',
      '--hatch-webgl-allowed-domains-sha256=8097045f0459c96c4cdc76e3a1af4e0f43f640b4b59c43d6db35e3641c0264c6',
    ],
    defaultViewport: { width: 1280, height: 480 },
  });
  const failures = [];
  try {
    const page = await browser.newPage();
    const requests = [];
    page.on('request', (request) => requests.push(request.url()));
    page.on('requestfailed', (request) => failures.push(`${request.url()} :: ${request.failure()?.errorText}`));
    page.on('pageerror', (error) => failures.push(`pageerror :: ${error.message}`));
    page.on('console', (message) => {
      if (message.type() === 'error') failures.push(`console :: ${message.text()}`);
    });

    // ---- 1. Load the title screen and start with a real key press. ----
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle0', timeout: 20000 });
    await sleep(500);
    const titleScreen = await page.evaluate(() => window.__copperLadle.screen());
    console.log('screen on load:', titleScreen);
    await page.keyboard.press('Space');
    await sleep(800);
    const afterStart = await page.evaluate(() => window.__copperLadle.screen());
    console.log('screen after Space:', afterStart);
    if (afterStart !== 'play') failures.push('Space did not start the game');

    // ---- 2. Walk with a real key and confirm the chef moves. ----
    const before = await page.evaluate(() => ({ x: window.__copperLadle.world.state.chef.x, y: window.__copperLadle.world.state.chef.y }));
    await page.keyboard.down('ArrowRight');
    await sleep(600);
    await page.keyboard.up('ArrowRight');
    const after = await page.evaluate(() => ({ x: window.__copperLadle.world.state.chef.x, y: window.__copperLadle.world.state.chef.y }));
    console.log('chef moved:', JSON.stringify(before), '->', JSON.stringify(after));
    if (!(after.x > before.x + 20)) failures.push('chef did not walk right on ArrowRight');

    // ---- 3. Play a full serve cycle through the real interact path. ----
    const play = await page.evaluate(async () => {
      const { world } = window.__copperLadle;
      const state = world.state;
      const log = [];
      const standBy = (id) => {
        const rect = state.stations[id].rect;
        state.chef.x = rect.x + rect.width / 2;
        state.chef.y = rect.y + rect.height + 34 * state.unit;
        state.chef.target = null;
      };
      const stepFor = async (seconds, held) => {
        const steps = Math.round(seconds * 60);
        for (let i = 0; i < steps; i += 1) world.step(1 / 60, null, held === true);
        await new Promise((r) => setTimeout(r, 0));
      };
      // Salad: lettuce + tomato, both chopped, onto a plate, then served.
      standBy('plates'); world.interact();
      log.push(`plate: ${JSON.stringify(state.chef.carrying)}`);
      standBy('plating'); world.interact();
      log.push(`plate on counter: ${JSON.stringify(state.stations.plating.plate)}`);
      standBy('bin-lettuce'); world.interact();
      standBy('board'); world.interact();
      await stepFor(1.6, true);
      log.push(`board after chop: ${state.stations.board.item}`);
      standBy('board'); world.interact();
      log.push(`carrying chopped lettuce: ${JSON.stringify(state.chef.carrying)}`);
      standBy('plating'); world.interact();
      standBy('bin-tomato'); world.interact();
      standBy('board'); world.interact();
      await stepFor(1.6, true);
      standBy('board'); world.interact();
      standBy('plating'); world.interact();
      const plate = state.stations.plating.plate;
      log.push(`plate on counter: ${JSON.stringify(plate)}`);
      // Force a salad order so the serve is testable, then serve it.
      state.orders = [{ id: 99, recipe: { id: 'salad', name: 'Garden Salad', needs: ['chopped-lettuce', 'chopped-tomato'], price: 6 }, patience: 40, maxPatience: 50 }];
      standBy('plating'); world.interact();
      log.push(`carrying plate: ${JSON.stringify(state.chef.carrying)}`);
      standBy('serve');
      const events = world.interact();
      log.push(`serve events: ${events} coins=${state.coins} served=${state.served}`);
      return log;
    });
    for (const line of play) console.log('play:', line);
    if (!/serve events:.*coins=/.test(play[play.length - 1]) || !play[play.length - 1].includes('served=1')) {
      failures.push('full serve cycle did not complete (coins/served)');
    }

    // ---- 4. Orders keep arriving on their own. ----
    await sleep(3000);
    const orders = await page.evaluate(() => window.__copperLadle.world.state.orders.length);
    console.log('orders live after 3s:', orders);

    // ---- 5. Screenshots: the four staged scenes, real renders. ----
    for (const shot of SHOTS) {
      await page.goto(`${BASE}/${shot.query}`, { waitUntil: 'networkidle0', timeout: 20000 });
      await page.waitForFunction(() => window.__shotReady === true, { timeout: 10000 });
      await sleep(150);
      const file = `${REPO}screenshots/${shot.name}`;
      await page.screenshot({ path: file, type: 'jpeg', quality: 82 });
      const bytes = readFileSync(file).length;
      console.log(`shot ${shot.name}: ${bytes} bytes`);
      if (bytes > 262144) failures.push(`${shot.name} over 256 KiB (${bytes})`);
    }

    const external = requests.filter((url) => !url.startsWith(BASE));
    console.log(`requests total: ${requests.length}, external: ${external.length}`);
    if (external.length > 0) failures.push(`external requests: ${external.join(', ')}`);
    console.log('all request URLs:', JSON.stringify(requests, null, 1));
  } finally {
    await browser.close();
    server.kill();
  }

  if (failures.length > 0) {
    console.error('FAILURES:\n- ' + failures.join('\n- '));
    process.exit(1);
  }
  console.log('ALL CHECKS PASSED');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
