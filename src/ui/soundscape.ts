/**
 * Synthesized tavern soundscape and table cues. Interface only: it reads
 * battle snapshots and settings, never issues commands, and every sound is
 * generated in the browser, so muted or unsupported audio changes nothing in
 * the game. Settings are a device preference, not part of the save.
 */
import { cardById } from "../content/catalog";
import type { Battle } from "../sim/battle";

export type SoundSettings = {
  enabled: boolean;
  cards: number;
  hearth: number;
  room: number;
};
export const defaultSoundSettings: SoundSettings = {
  enabled: false,
  cards: 0.5,
  hearth: 0.4,
  room: 0.3,
};
export const soundSettingsKey = "hearth-card.sound";
type KeyStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};
const level = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.min(1, Math.max(0, value))
    : fallback;
export function readSoundSettings(storage?: KeyStorage | null): SoundSettings {
  try {
    const raw = storage?.getItem(soundSettingsKey);
    if (!raw) return defaultSoundSettings;
    const parsed = JSON.parse(raw) as Partial<SoundSettings>;
    return {
      enabled: parsed.enabled === true,
      cards: level(parsed.cards, defaultSoundSettings.cards),
      hearth: level(parsed.hearth, defaultSoundSettings.hearth),
      room: level(parsed.room, defaultSoundSettings.room),
    };
  } catch {
    return defaultSoundSettings;
  }
}
export function writeSoundSettings(
  storage: KeyStorage | null | undefined,
  settings: SoundSettings,
) {
  try {
    storage?.setItem(soundSettingsKey, JSON.stringify(settings));
  } catch {
    // Private windows and blocked storage keep the session setting only.
  }
}

/** Table cues, derived from public battle events and state changes. */
export type Cue =
  | "payment"
  | "arrival"
  | "cast"
  | "response"
  | "countered"
  | "resolve"
  | "combat"
  | "hurt"
  | "heal"
  | "fallen"
  | "turn"
  | "won"
  | "lost"
  | "drawn";
export type TableSnapshot = {
  sequence: number;
  turn: number;
  hp: [number, number];
  creatures: [number, number];
  result: Battle["result"];
};
const creatureCount = (side: Battle["player"]) =>
  side.board.filter((p) => cardById[p.cardId]?.type === "Creature").length;
export function tableSnapshot(b: Battle): TableSnapshot {
  return {
    sequence: b.eventSequence ?? 0,
    turn: b.turn,
    hp: [b.player.hp, b.enemy.hp],
    creatures: [creatureCount(b.player), creatureCount(b.enemy)],
    result: b.result,
  };
}
/** Cues for what changed between a snapshot and the battle now, in table order. */
export function cuesSince(before: TableSnapshot | null, b: Battle): Cue[] {
  if (!before) return [];
  const now = tableSnapshot(b),
    cues: Cue[] = [];
  // A fresh duel at the same table starts its count over; nothing to compare.
  if (now.sequence < before.sequence || now.turn < before.turn) return [];
  for (const e of b.events ?? []) {
    if (e.id <= before.sequence) continue;
    if (e.kind === "cast" || e.kind === "response" || e.kind === "combat")
      cues.push(e.kind);
    else if (e.kind === "payment") cues.push("payment");
    else if (e.text.includes("was countered")) cues.push("countered");
    else if (e.kind === "resolve")
      cues.push(
        e.cardId && ["Creature", "Hero"].includes(cardById[e.cardId]?.type)
          ? "arrival"
          : "resolve",
      );
    else if (e.text.includes("turn: untap")) cues.push("turn");
  }
  if (now.hp[0] < before.hp[0] || now.hp[1] < before.hp[1]) cues.push("hurt");
  else if (now.hp[0] > before.hp[0] || now.hp[1] > before.hp[1])
    cues.push("heal");
  if (
    now.creatures[0] < before.creatures[0] ||
    now.creatures[1] < before.creatures[1]
  )
    cues.push("fallen");
  if (now.result !== before.result && now.result !== "playing")
    cues.push(now.result);
  return cues;
}

type Note = { f: number; at: number; dur: number; type?: OscillatorType };
/** Each cue is a few short notes: short and low for impacts, brighter for spells. */
export const cueNotes: Record<Cue, Note[]> = {
  payment: [{ f: 520, at: 0, dur: 0.06, type: "square" }],
  arrival: [{ f: 196, at: 0, dur: 0.16 }],
  cast: [{ f: 330, at: 0, dur: 0.18 }],
  response: [
    { f: 440, at: 0, dur: 0.1 },
    { f: 587, at: 0.09, dur: 0.16 },
  ],
  countered: [
    { f: 494, at: 0, dur: 0.1 },
    { f: 247, at: 0.1, dur: 0.22 },
  ],
  resolve: [{ f: 262, at: 0, dur: 0.14 }],
  combat: [{ f: 92, at: 0, dur: 0.2 }],
  hurt: [{ f: 70, at: 0, dur: 0.28, type: "sine" }],
  heal: [
    { f: 392, at: 0, dur: 0.12 },
    { f: 523, at: 0.11, dur: 0.2 },
  ],
  fallen: [{ f: 147, at: 0, dur: 0.3, type: "sawtooth" }],
  turn: [{ f: 294, at: 0, dur: 0.08 }],
  won: [
    { f: 392, at: 0, dur: 0.14 },
    { f: 494, at: 0.14, dur: 0.14 },
    { f: 587, at: 0.28, dur: 0.14 },
    { f: 784, at: 0.42, dur: 0.5 },
  ],
  lost: [
    { f: 294, at: 0, dur: 0.22 },
    { f: 247, at: 0.22, dur: 0.22 },
    { f: 185, at: 0.44, dur: 0.6 },
  ],
  drawn: [
    { f: 330, at: 0, dur: 0.2 },
    { f: 330, at: 0.3, dur: 0.4 },
  ],
};

function noiseBuffer(ctx: AudioContext, seconds: number, brown: boolean) {
  const buffer = ctx.createBuffer(
      1,
      Math.max(1, Math.floor(ctx.sampleRate * seconds)),
      ctx.sampleRate,
    ),
    values = buffer.getChannelData(0);
  let previous = 0;
  for (let i = 0; i < values.length; i++) {
    const white = Math.random() * 2 - 1;
    previous = brown ? (previous + white * 0.02) / 1.02 : white;
    values[i] = brown ? previous * 3.5 : white;
  }
  return buffer;
}

/**
 * Three layers with their own gains: card cues, the hearth (low fire with
 * crackles) and the room (a slow murmur with an occasional cup set down).
 */
export class Soundscape {
  private readonly cards: GainNode;
  private readonly hearth: GainNode;
  private readonly room: GainNode;
  private timers: ReturnType<typeof setTimeout>[] = [];
  private closed = false;
  constructor(private readonly ctx: AudioContext) {
    this.cards = ctx.createGain();
    this.hearth = ctx.createGain();
    this.room = ctx.createGain();
    for (const g of [this.cards, this.hearth, this.room]) {
      g.gain.value = 0;
      g.connect(ctx.destination);
    }
    const fire = ctx.createBufferSource(),
      fireFilter = ctx.createBiquadFilter();
    fire.buffer = noiseBuffer(ctx, 2, true);
    fire.loop = true;
    fireFilter.type = "lowpass";
    fireFilter.frequency.value = 420;
    fire.connect(fireFilter);
    fireFilter.connect(this.hearth);
    fire.start();
    const murmur = ctx.createBufferSource(),
      murmurFilter = ctx.createBiquadFilter(),
      sway = ctx.createGain(),
      lfo = ctx.createOscillator(),
      depth = ctx.createGain();
    murmur.buffer = noiseBuffer(ctx, 3, true);
    murmur.loop = true;
    murmurFilter.type = "bandpass";
    murmurFilter.frequency.value = 360;
    murmurFilter.Q.value = 0.8;
    sway.gain.value = 0.6;
    lfo.frequency.value = 0.17;
    depth.gain.value = 0.35;
    lfo.connect(depth);
    depth.connect(sway.gain);
    murmur.connect(murmurFilter);
    murmurFilter.connect(sway);
    sway.connect(this.room);
    murmur.start();
    lfo.start();
    this.crackle();
    this.clink();
  }
  /** A short bright burst from the fire every fraction of a second. */
  private crackle() {
    if (this.closed) return;
    // A suspended context (hidden tab, sounds off) queues nothing: bursts
    // started now would all sound at once on resume.
    if (this.ctx.state !== "running") {
      this.timers.push(setTimeout(() => this.crackle(), 500));
      return;
    }
    const ctx = this.ctx,
      burst = ctx.createBufferSource(),
      filter = ctx.createBiquadFilter(),
      gain = ctx.createGain();
    burst.buffer = noiseBuffer(ctx, 0.03, false);
    filter.type = "bandpass";
    filter.frequency.value = 2400 + Math.random() * 1800;
    filter.Q.value = 2;
    gain.gain.setValueAtTime(0.15 + Math.random() * 0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.03);
    burst.connect(filter);
    filter.connect(gain);
    gain.connect(this.hearth);
    burst.start();
    burst.onended = () => {
      burst.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
    this.timers.push(
      setTimeout(() => this.crackle(), 180 + Math.random() * 900),
    );
  }
  /** A cup set down somewhere in the room every several seconds. */
  private clink() {
    if (this.closed) return;
    if (this.ctx.state !== "running") {
      this.timers.push(setTimeout(() => this.clink(), 1000));
      return;
    }
    this.tone(this.room, [
      { f: 1800 + Math.random() * 900, at: 0, dur: 0.09 },
      { f: 2600 + Math.random() * 600, at: 0.004, dur: 0.05 },
    ]);
    this.timers.push(
      setTimeout(() => this.clink(), 5000 + Math.random() * 9000),
    );
  }
  private tone(out: GainNode, notes: Note[]) {
    const ctx = this.ctx;
    for (const n of notes) {
      const osc = ctx.createOscillator(),
        gain = ctx.createGain(),
        start = ctx.currentTime + n.at;
      osc.type = n.type ?? "triangle";
      osc.frequency.value = n.f;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.25, start + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + n.dur);
      osc.connect(gain);
      gain.connect(out);
      osc.start(start);
      osc.stop(start + n.dur + 0.02);
      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    }
  }
  apply(s: SoundSettings) {
    const t = this.ctx.currentTime;
    this.cards.gain.setTargetAtTime(s.enabled ? s.cards * 0.5 : 0, t, 0.05);
    this.hearth.gain.setTargetAtTime(s.enabled ? s.hearth * 0.12 : 0, t, 0.3);
    this.room.gain.setTargetAtTime(s.enabled ? s.room * 0.1 : 0, t, 0.3);
  }
  play(cue: Cue) {
    if (!this.closed) this.tone(this.cards, cueNotes[cue]);
  }
  get state() {
    return this.ctx.state;
  }
  resume() {
    return this.ctx.state === "suspended"
      ? this.ctx.resume()
      : Promise.resolve();
  }
  suspend() {
    return this.ctx.state === "running"
      ? this.ctx.suspend()
      : Promise.resolve();
  }
  close() {
    this.closed = true;
    for (const t of this.timers) clearTimeout(t);
    this.timers = [];
    return this.ctx.close();
  }
}

/** One soundscape per page, shared by the tavern menu and the duel table. */
const listeners = new Set<() => void>();
/** Reading the storage object itself can throw in sandboxed documents. */
function storage() {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}
let settings = readSoundSettings(storage());
let scape: Soundscape | null = null;
function wake() {
  if (!scape || document.hidden) return;
  void scape.resume();
}
/** Creates the audio graph on demand; browsers may keep it suspended until a gesture. */
export function ensureSoundscape(): Soundscape | null {
  if (!settings.enabled) return null;
  if (!scape) {
    try {
      scape = new Soundscape(new AudioContext());
    } catch {
      return null;
    }
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) void scape?.suspend();
      else wake();
    });
    document.addEventListener("pointerdown", wake, { passive: true });
    document.addEventListener("keydown", wake);
  }
  scape.apply(settings);
  wake();
  return scape;
}
export const soundStore = {
  get: () => settings,
  set(next: Partial<SoundSettings>) {
    settings = { ...settings, ...next };
    writeSoundSettings(storage(), settings);
    if (settings.enabled) ensureSoundscape();
    else if (scape) {
      scape.apply(settings);
      void scape.suspend();
    }
    for (const l of listeners) l();
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};
