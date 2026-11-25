// Every sound in the kitchen is synthesised with WebAudio — no audio files, no network.
// The context is created lazily on the first player gesture; screenshot staging never
// touches it, so a headless capture stays silent and deterministic.

let context = null;
let master = null;
let musicTimer = null;
let musicOn = true;
let sizzleNodes = null;

/** Create the audio graph on first use; returns false when audio is unavailable. */
export function ensureAudio() {
  if (context) return true;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    context = new AudioContext();
    master = context.createGain();
    master.gain.value = 0.5;
    master.connect(context.destination);
    return true;
  } catch {
    return false;
  }
}

/** Resume after a gesture (browsers start the context suspended). */
export function resumeAudio() {
  if (context && context.state === 'suspended') context.resume().catch(() => {});
}

/** A short oscillator blip: frequency, seconds, wave, volume, and an optional slide. */
function blip(frequency, seconds, wave, volume, slideTo) {
  if (!context) return;
  const now = context.currentTime;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = wave;
  oscillator.frequency.setValueAtTime(frequency, now);
  if (slideTo) oscillator.frequency.exponentialRampToValueAtTime(slideTo, now + seconds);
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + seconds);
  oscillator.connect(gain);
  gain.connect(master);
  oscillator.start(now);
  oscillator.stop(now + seconds + 0.02);
}

/** A burst of filtered noise: a chop thock, a sizzle pop, a plate clink. */
function noise(seconds, volume, filterFrequency) {
  if (!context) return;
  const now = context.currentTime;
  const length = Math.max(1, Math.floor(context.sampleRate * seconds));
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < length; index += 1) data[index] = Math.random() * 2 - 1;
  const source = context.createBufferSource();
  source.buffer = buffer;
  const filter = context.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = filterFrequency;
  const gain = context.createGain();
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + seconds);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  source.start(now);
}

export function playPickup() {
  blip(520, 0.08, 'triangle', 0.18, 760);
}

export function playPlace() {
  noise(0.06, 0.22, 900);
  blip(220, 0.07, 'sine', 0.15, 160);
}

export function playChop() {
  noise(0.07, 0.35, 1400);
  blip(140, 0.06, 'square', 0.1, 90);
}

export function playChopDone() {
  blip(660, 0.09, 'triangle', 0.2);
  blip(880, 0.12, 'triangle', 0.2);
}

export function playCookDone() {
  blip(740, 0.1, 'sine', 0.22);
  blip(988, 0.16, 'sine', 0.22);
}

export function playBurnt() {
  blip(220, 0.25, 'sawtooth', 0.16, 110);
}

export function playServe() {
  blip(1175, 0.12, 'sine', 0.25);
  blip(1568, 0.2, 'sine', 0.25);
}

export function playCoin() {
  blip(988, 0.08, 'triangle', 0.2);
  blip(1319, 0.14, 'triangle', 0.2);
}

export function playError() {
  blip(160, 0.16, 'square', 0.14, 120);
}

export function playNewOrder() {
  blip(587, 0.09, 'triangle', 0.16);
  blip(784, 0.12, 'triangle', 0.16);
}

export function playExpired() {
  blip(392, 0.2, 'sine', 0.2, 262);
  blip(262, 0.3, 'sine', 0.2, 196);
}

export function playClick() {
  blip(700, 0.05, 'triangle', 0.12);
}

/** A soft looping sizzle while anything is on the grill or in the pot. */
export function setSizzle(on) {
  if (!context) return;
  if (on && !sizzleNodes) {
    const length = context.sampleRate;
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < length; index += 1) data[index] = Math.random() * 2 - 1;
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const filter = context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 5200;
    filter.Q.value = 0.6;
    const gain = context.createGain();
    gain.gain.value = 0.05;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    source.start();
    sizzleNodes = { source, gain };
  } else if (!on && sizzleNodes) {
    try {
      sizzleNodes.source.stop();
    } catch {
      // Already stopped.
    }
    sizzleNodes = null;
  }
}

/** A gentle music-box loop in C major, scheduled a bar ahead so it never stutters. */
const MELODY = [
  523, 0, 659, 784, 880, 784, 659, 523,
  587, 0, 698, 880, 784, 698, 587, 0,
  523, 0, 659, 784, 1047, 880, 784, 659,
  784, 698, 587, 698, 523, 0, 0, 0,
];
const BEAT = 0.22;

export function startMusic() {
  if (!context || musicTimer) return;
  let nextNote = 0;
  let nextTime = context.currentTime + 0.1;
  musicTimer = window.setInterval(() => {
    if (!musicOn) return;
    while (nextTime < context.currentTime + 0.6) {
      const frequency = MELODY[nextNote % MELODY.length];
      if (frequency > 0) {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0.0001, nextTime);
        gain.gain.linearRampToValueAtTime(0.07, nextTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, nextTime + BEAT * 1.8);
        oscillator.connect(gain);
        gain.connect(master);
        oscillator.start(nextTime);
        oscillator.stop(nextTime + BEAT * 2);
      }
      nextNote += 1;
      nextTime += BEAT;
    }
  }, 120);
}

export function stopMusic() {
  if (musicTimer) {
    window.clearInterval(musicTimer);
    musicTimer = null;
  }
}

export function toggleMusic() {
  musicOn = !musicOn;
  return musicOn;
}
