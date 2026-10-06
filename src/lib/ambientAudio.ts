/* =========================================================================
   DAEKON soundscape — egyetlen, folyamatos háttér-atmoszféra az egész
   oldalon: generatív, puha „felt” zongora + nagyon halk ambient pad,
   közös térhatású zengetőn át. Nincs hangfájl és nincs fix loop: a hangok
   egy lassú, hosszú akkordmeneten belül véletlenszerűen, ritkán szólalnak
   meg, így ismétlődés és vágás nem hallható.

   - Csak akkor szól, ha a user bekapcsolta (SOUND / ON), a döntés
     localStorage-ben marad.
   - Autoplay policy: a kontextus csak user gesture-ből indul biztosan.
     Ha korábban bekapcsolta, betöltéskor megpróbáljuk; ha a böngésző
     tiltja, az első interakciónál (kattintás / billentyű / érintés) úszik be.
   - A menü nem indít új zenét: csak enyhe szűrő- és hangerő-eltolás.
   ========================================================================= */

const PREF_KEY = "daekon:sound";

const MUSIC_LEVEL = 0.32; // master — szándékosan nagyon halk
const FADE_IN_S = 3.2; // első beúszás (loader → hero)
const FADE_OUT_S = 1.2; // SOUND / OFF
const MENU_SHIFT_S = 0.7;

const FILTER_BASE = 3800;
const FILTER_MENU = 7200;
const GAIN_MENU = 1.12;

/* Hosszú, lebegő akkordmenet (D-dúr / lídiai színek), akkordonként 24–34 s.
   piano: a zongora ebből válogat · pad: halk, mély fekvésű hangok */
const CHORDS: { piano: number[]; pad: number[] }[] = [
  { piano: [62, 66, 69, 73, 76, 78], pad: [50, 57, 64] }, // Dmaj9
  { piano: [59, 62, 66, 69, 73, 74], pad: [47, 54, 62] }, // Bm9
  { piano: [67, 71, 74, 78, 73, 81], pad: [43, 50, 59] }, // Gmaj7#11
  { piano: [64, 69, 71, 73, 76, 78], pad: [45, 52, 61] }, // A6/9 sus
  { piano: [66, 69, 73, 76, 78, 81], pad: [42, 49, 57] }, // F#m11
  { piano: [67, 71, 74, 76, 78, 83], pad: [43, 50, 62] }, // Gmaj9
];

const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let tone: BiquadFilterNode | null = null;
let musicBus: GainNode | null = null; // piano + pad → tone → master
let uiBus: GainNode | null = null; // UI jelzések (szűrő nélkül)
let running = false;
let menuOpen = false;
let chordIdx = 0;
let padNodes: { gain: GainNode; stop: (at: number) => void } | null = null;
let noteTimer: number | undefined;
let chordTimer: number | undefined;
let suspendTimer: number | undefined;
let armed = false;

/* ---------- preferencia ---------- */

export function getSoundPref(): boolean {
  try {
    return localStorage.getItem(PREF_KEY) === "on";
  } catch {
    return false;
  }
}

const listeners = new Set<(on: boolean) => void>();
export function onSoundPref(fn: (on: boolean) => void) {
  listeners.add(fn);
  return () => void listeners.delete(fn);
}

/** User gesture-ből hívd (a kapcsoló kattintása). */
export function setSoundPref(on: boolean) {
  try {
    localStorage.setItem(PREF_KEY, on ? "on" : "off");
  } catch {
    /* privát mód — erre a munkamenetre él */
  }
  listeners.forEach((fn) => fn(on));
  if (on) {
    startMusic(1.6);
    playUiTone(true);
  } else {
    stopMusic();
  }
}

/* ---------- graph ---------- */

function makeImpulse(c: AudioContext, seconds: number, decay: number) {
  const len = Math.floor(c.sampleRate * seconds);
  const buf = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    // enyhe előkésleltetés + lassú lecsengés → tágas, puha tér
    const pre = Math.floor(c.sampleRate * 0.02);
    for (let i = pre; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
  }
  return buf;
}

function ensureContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();

    master = ctx.createGain();
    master.gain.value = 0;

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20;
    comp.ratio.value = 2.5;

    tone = ctx.createBiquadFilter();
    tone.type = "lowpass";
    tone.frequency.value = FILTER_BASE;
    tone.Q.value = 0.4;

    musicBus = ctx.createGain();
    uiBus = ctx.createGain();

    const dry = ctx.createGain();
    dry.gain.value = 0.5;
    const verb = ctx.createConvolver();
    verb.buffer = makeImpulse(ctx, 6, 3);
    const wet = ctx.createGain();
    wet.gain.value = 0.9;

    musicBus.connect(dry).connect(tone);
    musicBus.connect(verb).connect(wet).connect(tone);
    // UI jelzés akkor is hallható, ha a zene épp el van halkítva
    uiBus.connect(comp);
    tone.connect(master).connect(comp).connect(ctx.destination);
  }
  return ctx;
}

function glide(param: AudioParam, value: number, seconds: number) {
  const now = ctx!.currentTime;
  param.cancelScheduledValues(now);
  param.setValueAtTime(param.value, now);
  param.setTargetAtTime(value, now, seconds / 3);
}

/* ---------- hangszerek ---------- */

/** Puha, „felt” jellegű zongorahang: enyhén inharmonikus szinusz-felhangok,
    gyors, de nem kattanó attack, hosszú exponenciális lecsengés, tompa
    kalapácszaj. */
function pianoNote(c: AudioContext, out: AudioNode, midi: number, when: number, vel: number) {
  const f = mtof(midi);
  const len = 5 + (84 - midi) * 0.08; // mélyebb hang tovább cseng
  const note = c.createGain();
  note.gain.value = 0;

  const felt = c.createBiquadFilter();
  felt.type = "lowpass";
  felt.frequency.setValueAtTime(900 + vel * 1600, when);
  felt.frequency.exponentialRampToValueAtTime(500, when + len * 0.6);
  felt.Q.value = 0.3;

  const pan = c.createStereoPanner();
  pan.pan.value = Math.max(-0.6, Math.min(0.6, (midi - 68) / 22 + rand(-0.1, 0.1)));

  note.connect(felt).connect(pan).connect(out);

  const partials = [
    [1, 1],
    [2.003, 0.38],
    [3.008, 0.12],
    [4.016, 0.05],
  ];
  partials.forEach(([mul, amp], k) => {
    const o = c.createOscillator();
    o.type = "sine";
    o.frequency.value = f * mul;
    o.detune.value = rand(-3, 3);
    const g = c.createGain();
    const peak = amp * vel * 0.11;
    const decay = len / (1 + k * 0.9);
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(peak, when + 0.012);
    g.gain.setTargetAtTime(peak * 0.35, when + 0.012, 0.35);
    g.gain.setTargetAtTime(0, when + 0.4, decay / 4);
    o.connect(g).connect(note);
    o.start(when);
    o.stop(when + len + 0.5);
  });
  note.gain.setValueAtTime(1, when);

  // filc kalapács: nagyon rövid, mély, szűrt zajimpulzus
  const n = c.createBufferSource();
  const nb = c.createBuffer(1, Math.floor(c.sampleRate * 0.04), c.sampleRate);
  const nd = nb.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = (Math.random() * 2 - 1) * (1 - i / nd.length);
  n.buffer = nb;
  const nf = c.createBiquadFilter();
  nf.type = "lowpass";
  nf.frequency.value = 1200;
  const ng = c.createGain();
  ng.gain.value = 0.012 * vel;
  n.connect(nf).connect(ng).connect(pan);
  n.start(when);
}

function makePad(c: AudioContext, out: AudioNode, notes: number[]) {
  const gain = c.createGain();
  gain.gain.value = 0;
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 520;
  lp.Q.value = 0.5;
  lp.connect(gain).connect(out);

  const stops: ((at: number) => void)[] = [];
  notes.forEach((m, i) => {
    const pan = c.createStereoPanner();
    pan.pan.value = (i - 1) * 0.45;
    pan.connect(lp);
    [-6, 6].forEach((cents, k) => {
      const o = c.createOscillator();
      o.type = k ? "sine" : "triangle";
      o.frequency.value = mtof(m);
      o.detune.value = cents;
      const g = c.createGain();
      g.gain.value = 0.05 / notes.length;
      o.connect(g).connect(pan);
      o.start();
      stops.push((at) => o.stop(at));
    });
  });
  // lassú lélegzés a szűrőn
  const l = c.createOscillator();
  l.frequency.value = rand(0.03, 0.06);
  const lg = c.createGain();
  lg.gain.value = 160;
  l.connect(lg).connect(lp.frequency);
  l.start();
  stops.push((at) => l.stop(at));

  return { gain, stop: (at: number) => stops.forEach((s) => s(at)) };
}

/* ---------- generatív ütemező ---------- */

function setChord(i: number) {
  const c = ctx!;
  chordIdx = i % CHORDS.length;
  const old = padNodes;
  padNodes = makePad(c, musicBus!, CHORDS[chordIdx].pad);
  glide(padNodes.gain.gain, 1, 7);
  if (old) {
    glide(old.gain.gain, 0, 7);
    old.stop(c.currentTime + 10);
  }
}

function scheduleChord() {
  chordTimer = window.setTimeout(() => {
    if (!running) return;
    // néha visszalép / átugrik — a menet nem lesz kiszámítható
    const step = Math.random() < 0.8 ? 1 : Math.random() < 0.5 ? 2 : CHORDS.length - 1;
    setChord(chordIdx + step);
    scheduleChord();
  }, rand(24, 34) * 1000);
}

let lastNote = -1;
function scheduleNote(first = false) {
  noteTimer = window.setTimeout(() => {
    if (!running || !ctx) return;
    const c = ctx;
    const pool = CHORDS[chordIdx].piano.filter((m) => m !== lastNote);
    const t = c.currentTime + 0.05;
    const roll = Math.random();
    if (roll < 0.14) {
      // ritka, lassan „gördülő” kettős-hármas hangzat
      const n = Math.random() < 0.5 ? 2 : 3;
      const notes = [...pool].sort(() => Math.random() - 0.5).slice(0, n).sort((a, b) => a - b);
      notes.forEach((m, k) => pianoNote(c, musicBus!, m, t + k * rand(0.09, 0.18), rand(0.4, 0.6)));
      lastNote = notes[notes.length - 1];
    } else if (roll < 0.9) {
      const m = pick(pool);
      pianoNote(c, musicBus!, m, t, rand(0.38, 0.7));
      lastNote = m;
    } // különben: csend — a szünet is a zene része
    scheduleNote();
  }, (first ? rand(0.8, 1.6) : rand(2.6, 6.8)) * 1000);
}

/* ---------- életciklus ---------- */

function startMusic(fadeS = FADE_IN_S) {
  if (!getSoundPref()) return;
  const c = ensureContext();
  if (!c || !master) return;
  window.clearTimeout(suspendTimer);
  const go = () => {
    if (!getSoundPref() || c.state !== "running") return;
    if (!running) {
      running = true;
      if (!padNodes) setChord(chordIdx);
      scheduleChord();
      scheduleNote(true);
    }
    glide(master!.gain, MUSIC_LEVEL * (menuOpen ? GAIN_MENU : 1), fadeS);
  };
  if (c.state === "running") go();
  else c.resume().then(go, () => {});
}

function stopMusic() {
  if (!ctx || !master) return;
  running = false;
  window.clearTimeout(noteTimer);
  window.clearTimeout(chordTimer);
  glide(master.gain, 0, FADE_OUT_S);
  const c = ctx;
  window.clearTimeout(suspendTimer);
  suspendTimer = window.setTimeout(() => {
    if (running) return;
    if (padNodes) {
      padNodes.stop(c.currentTime + 0.05);
      padNodes = null;
    }
    void c.suspend();
  }, (FADE_OUT_S + 0.6) * 1000);
}

/** Egyszer hívd az app indulásakor (a loader alatt). */
export function initSoundscape() {
  if (armed || typeof window === "undefined") return;
  armed = true;

  // ha engedélyezte korábban: próbáljuk már a loader alatt — ha a böngésző
  // engedi, ott úszik be; ha nem, az első valódi interakció indítja
  if (getSoundPref()) startMusic();

  const unlock = () => {
    if (getSoundPref() && !running) startMusic();
  };
  ["pointerdown", "keydown", "touchend"].forEach((ev) =>
    window.addEventListener(ev, unlock, { passive: true }),
  );

  document.addEventListener("visibilitychange", () => {
    if (!getSoundPref()) return;
    if (document.hidden) stopMusic();
    else if (ctx) startMusic(1.5);
  });
}

/** Menü: ugyanaz a zene szól tovább, csak enyhe szűrő- és hangerő-eltolás. */
export function setMenuAtmosphere(open: boolean) {
  menuOpen = open;
  playUiTone(open);
  if (!ctx || !tone || !master || !running) return;
  glide(tone.frequency, open ? FILTER_MENU : FILTER_BASE, MENU_SHIFT_S);
  glide(master.gain, MUSIC_LEVEL * (open ? GAIN_MENU : 1), MENU_SHIFT_S);
}

/* ---------- UI feedback ---------- */

/** Nagyon halk, rövid, üveges jelzés. `up` = nyitás, különben zárás. */
export function playUiTone(up: boolean) {
  if (!getSoundPref()) return;
  const c = ensureContext();
  if (!c || !uiBus) return;
  if (c.state !== "running") void c.resume();
  const t = c.currentTime + 0.01;
  const base = up ? 1174.66 : 880;
  [1, 2.01].forEach((mul, k) => {
    const o = c.createOscillator();
    o.type = "sine";
    o.frequency.value = base * mul;
    const g = c.createGain();
    const peak = k === 0 ? 0.018 : 0.005;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    o.connect(g).connect(uiBus!);
    o.start(t);
    o.stop(t + 0.32);
  });
}
