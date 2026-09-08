import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { assetUrl } from "../content/artwork";
import { cardById } from "../content/catalog";
import type { Battle } from "../sim/battle";

type Point = { x: number; y: number };
export function BattlePresentation({
  battle: b,
  pointer,
  held,
  selected,
  target,
}: {
  battle: Battle;
  pointer: Point | null;
  held?: string;
  selected: number[];
  target?: string;
}) {
  const [lines, setLines] = useState<
    { from: Point; to: Point; kind: string }[]
  >([]);
  useEffect(() => {
    const point = (selector: string) => {
      const r = document.querySelector(selector)?.getBoundingClientRect();
      return r && r.width && r.height
        ? { x: r.x + r.width / 2, y: r.y + r.height / 2 }
        : null;
    };
    const update = () => {
      const next: typeof lines = [];
      const add = (
        from: Point | null | undefined,
        to: Point | null | undefined,
        kind: string,
      ) => {
        if (from && to) next.push({ from, to, kind });
      };
      for (const a of b.combat) {
        add(
          point(`[data-permanent="${a.uid}"]`),
          a.blocker !== null
            ? point(`[data-permanent="${a.blocker}"]`)
            : point(
                `[data-battle-drop="${b.active === "player" ? "enemy" : "player"}:${a.hero === null ? "hearth" : `hero:${a.hero}`}" ]`,
              ),
          a.blocker !== null ? "block" : "attack",
        );
      }
      if (b.phase === "attack")
        for (const uid of selected)
          add(
            point(`[data-permanent="${uid}"]`),
            point(`[data-battle-drop="${target || "enemy:hearth"}"]`),
            "planned",
          );
      if (pointer && held) {
        const zone = document
          .elementFromPoint(pointer.x, pointer.y)
          ?.closest<HTMLElement>("[data-battle-drop]");
        const rect = zone?.getBoundingClientRect();
        add(
          { x: pointer.x - 40, y: pointer.y + 40 },
          rect
            ? { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }
            : pointer,
          "spell",
        );
      } else if (held && target)
        add(
          point(".casting-ribbon"),
          point(`[data-battle-drop="${target}"]`),
          "spell",
        );
      setLines(next);
    };
    update();
    const frame = requestAnimationFrame(update);
    window.addEventListener("resize", update);
    document.addEventListener("scroll", update, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", update);
      document.removeEventListener("scroll", update, true);
    };
  }, [
    b.combat,
    b.phase,
    pointer?.x,
    pointer?.y,
    held,
    selected.join(","),
    target,
  ]);
  return createPortal(
    <>
      <svg className="battle-connections" aria-hidden="true">
        <defs>
          <marker
            id="battle-arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" />
          </marker>
        </defs>
        {lines.map((l, i) => (
          <path
            key={i}
            className={l.kind}
            d={`M ${l.from.x} ${l.from.y} Q ${(l.from.x + l.to.x) / 2 + 20} ${(l.from.y + l.to.y) / 2} ${l.to.x} ${l.to.y}`}
            markerEnd="url(#battle-arrow)"
          />
        ))}
      </svg>
      {pointer && held && (
        <div
          className="lifted-spell"
          style={{ left: pointer.x + 18, top: Math.max(4, pointer.y - 170) }}
        >
          <img src={assetUrl(`/art/cards/${held}.png`)} alt="" />
          <span>{cardById[held].name}</span>
        </div>
      )}
    </>,
    document.body,
  );
}

/** Small synthesized table sounds. No downloads; audio starts only from the player's toggle. */
export function BattleSound({ battle }: { battle: Battle }) {
  const audio = useRef<AudioContext | null>(null),
    ambient = useRef<GainNode | null>(null);
  const [enabled, setEnabled] = useState(false),
    [volume, setVolume] = useState(0.15),
    [roomVolume, setRoomVolume] = useState(0);
  const last = useRef(battle.eventSequence);
  useEffect(
    () => () => {
      void audio.current?.close();
    },
    [],
  );
  useEffect(() => {
    const visibility = () => {
      const ctx = audio.current;
      if (!ctx) return;
      if (document.hidden || !enabled) void ctx.suspend();
      else void ctx.resume();
    };
    visibility();
    document.addEventListener("visibilitychange", visibility);
    return () => document.removeEventListener("visibilitychange", visibility);
  }, [enabled]);
  useEffect(() => {
    if (ambient.current)
      ambient.current.gain.value = enabled ? roomVolume * 0.04 : 0;
  }, [enabled, roomVolume]);
  useEffect(() => {
    const ctx = audio.current;
    if (battle.eventSequence === last.current) return;
    last.current = battle.eventSequence;
    if (!enabled || !ctx || document.hidden) return;
    const event = battle.events.at(-1);
    const osc = ctx.createOscillator(),
      gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value =
      event?.kind === "combat" ? 92 : event?.kind === "cast" ? 330 : 220;
    gain.gain.setValueAtTime(volume * 0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  }, [battle.eventSequence, enabled, volume]);
  return (
    <div className="battle-sound">
      <button
        aria-pressed={enabled}
        onClick={() => {
          if (!audio.current) {
            const ctx = new AudioContext();
            audio.current = ctx;
            const buffer = ctx.createBuffer(
                1,
                ctx.sampleRate * 2,
                ctx.sampleRate,
              ),
              values = buffer.getChannelData(0);
            let previous = 0;
            for (let i = 0; i < values.length; i++) {
              previous = (previous + (Math.random() * 2 - 1) * 0.02) / 1.02;
              values[i] = previous;
            }
            const source = ctx.createBufferSource(),
              filter = ctx.createBiquadFilter(),
              gain = ctx.createGain();
            source.buffer = buffer;
            source.loop = true;
            filter.type = "lowpass";
            filter.frequency.value = 450;
            gain.gain.value = 0;
            source.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);
            source.start();
            ambient.current = gain;
          }
          void audio.current.resume();
          setEnabled(!enabled);
        }}
      >
        Table sounds: {enabled ? "On" : "Off"}
      </button>
      <label>
        Cards
        <input
          aria-label="Card sound volume"
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
        />
      </label>
      <label>
        Hearth
        <input
          aria-label="Hearth sound volume"
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={roomVolume}
          onChange={(e) => setRoomVolume(Number(e.target.value))}
        />
      </label>
    </div>
  );
}
