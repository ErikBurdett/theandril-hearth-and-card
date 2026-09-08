import type { Progression } from "../sim/progression";
import { useEffect, useRef, useState } from "react";
import { cardById, isResource } from "../content/catalog";
import { cardIllustration } from "../content/artwork";
import { tableWords } from "../content/wording";
import { stats, type Battle, type Permanent } from "../sim/battle";

export function AutoBattle({
  battle: b,
  progression,
  onOpen,
  onToggle,
  onClose,
}: {
  battle: Battle;
  progression: Progression;
  onOpen: () => void;
  onToggle: () => void;
  onClose: () => void;
}) {
  const box = useRef<HTMLElement>(null),
    drag = useRef<{ x: number; y: number; left: number; top: number } | null>(
      null,
    );
  const [position, setPosition] = useState({ x: 20, y: 90 });
  const clamp = (x: number, y: number) => ({
    x: Math.max(
      6,
      Math.min(x, innerWidth - (box.current?.offsetWidth ?? 420) - 6),
    ),
    y: Math.max(
      6,
      Math.min(y, innerHeight - (box.current?.offsetHeight ?? 350) - 6),
    ),
  });
  useEffect(() => {
    const resize = () => setPosition((p) => clamp(p.x, p.y));
    resize();
    addEventListener("resize", resize);
    const observer = new ResizeObserver(resize);
    if (box.current) observer.observe(box.current);
    return () => {
      removeEventListener("resize", resize);
      observer.disconnect();
    };
  }, []);
  function face(
    id: string,
    key: string,
    p?: Permanent,
    side: "player" | "enemy" = "player",
  ) {
    const c = cardById[id],
      s = p ? stats(b[side], p) : null;
    return (
      <span
        className={`mini-card ${p?.tapped ? "exhausted" : ""}`}
        key={key}
        title={`${c.name} · ${tableWords(c.rules)}`}
      >
        <img
          src={cardIllustration(id) ?? undefined}
          alt={c.name}
          draggable={false}
        />
        <span>{c.name}</span>
        {s && c.type === "Creature" && (
          <b>
            {s.power}/{s.toughness - (p?.damage ?? 0)}
          </b>
        )}
      </span>
    );
  }
  return (
    <aside
      ref={box}
      className="auto-battle-window"
      aria-label="Autobattle watch window"
      style={{ left: position.x, top: position.y }}
    >
      <header>
        <button
          className="mini-drag"
          aria-label="Move battle window"
          title="Drag to move; arrow keys also move the window"
          onKeyDown={(e) => {
            const delta: Record<string, [number, number]> = {
              ArrowLeft: [-20, 0],
              ArrowRight: [20, 0],
              ArrowUp: [0, -20],
              ArrowDown: [0, 20],
            };
            if (delta[e.key]) {
              e.preventDefault();
              const [x, y] = delta[e.key];
              setPosition((p) => clamp(p.x + x, p.y + y));
            }
          }}
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            drag.current = {
              x: e.clientX,
              y: e.clientY,
              left: position.x,
              top: position.y,
            };
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            const d = drag.current;
            if (d)
              setPosition(
                clamp(d.left + e.clientX - d.x, d.top + e.clientY - d.y),
              );
          }}
          onPointerUp={() => (drag.current = null)}
          onPointerCancel={() => (drag.current = null)}
        >
          ⠿ Erilian’s table{" "}
          <small>
            {b.result !== "playing"
              ? b.result === "won"
                ? "Victory"
                : "Defeat"
              : b.autoplay
                ? "Autoplay"
                : "Paused"}
          </small>
        </button>
        <button onClick={onClose} aria-label="Close battle watch window">
          ×
        </button>
      </header>
      <button
        className="mini-battlefield"
        onClick={onOpen}
        aria-label="Open battle and take control"
      >
        <div className="mini-side">
          <strong>
            {b.opponent.split(" · ")[0]} · ♥ {b.enemy.hp}
          </strong>
          <div
            className="mini-hidden-hand"
            aria-label={`Opponent hand: ${b.enemy.hand.length} hidden cards`}
          >
            {Array.from({ length: b.enemy.hand.length }, (_, i) => (
              <i key={i}>✦</i>
            ))}
          </div>
          <div className="mini-row">
            {b.enemy.board
              .filter((p) => !isResource(cardById[p.cardId]))
              .map((p) => face(p.cardId, String(p.uid), p, "enemy"))}
          </div>
          <div className="mini-row mini-resources">
            {b.enemy.board
              .filter((p) => isResource(cardById[p.cardId]))
              .map((p) => face(p.cardId, String(p.uid), p, "enemy"))}
          </div>
        </div>
        <div className="mini-stack">
          Turn {b.turn} · {b.active === "player" ? "Erilian" : "Guest"}
          {b.stack.map((s) => face(s.cardId, String(s.uid)))}
        </div>
        <div className="mini-side">
          <strong>Erilian · ♥ {b.player.hp}</strong>
          <div className="mini-row">
            {b.player.board
              .filter((p) => !isResource(cardById[p.cardId]))
              .map((p) => face(p.cardId, String(p.uid), p))}
          </div>
          <div className="mini-row mini-resources">
            {b.player.board
              .filter((p) => isResource(cardById[p.cardId]))
              .map((p) => face(p.cardId, String(p.uid), p))}
          </div>
          <div className="mini-row mini-hand">
            {b.player.hand.map((id, i) => face(id, String(i)))}
          </div>
        </div>
      </button>
      <p className="mini-log" aria-live="polite">
        {tableWords(b.log[0] ?? "Shuffling by the hearth…")}
      </p>
      <footer className="circuit-controls">
        <span>
          <b>{progression.totals.wins}</b> wins
        </span>
        <button
          className="circuit-play"
          onClick={onToggle}
          aria-label={b.autoplay ? "Pause autoplay" : "Resume autoplay"}
          title={b.autoplay ? "Pause autoplay" : "Resume autoplay"}
        >
          {b.autoplay ? "Ⅱ" : "▶"}
        </button>
        <span>
          <b>{progression.totals.losses}</b> losses · {progression.totals.draws}{" "}
          draws
        </span>
      </footer>
      {progression.lastDuel && (
        <small className="circuit-result">
          Last:{" "}
          {progression.lastDuel.drawn
            ? "Draw"
            : progression.lastDuel.won
              ? "Victory"
              : "Defeat"}{" "}
          · {progression.lastDuel.opponent.split(" · ")[0]}
        </small>
      )}
      <button className="circuit-open" onClick={onOpen}>
        Open & take control ↗
      </button>
    </aside>
  );
}
