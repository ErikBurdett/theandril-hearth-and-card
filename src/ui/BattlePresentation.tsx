import { useEffect, useState } from "react";
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
        const blockers = a.blockers?.length
          ? a.blockers
          : a.blocker !== null
            ? [a.blocker]
            : [];
        if (!blockers.length)
          add(
            point(`[data-permanent="${a.uid}"]`),
            point(
              `[data-battle-drop="${b.active === "player" ? "enemy" : "player"}:${a.hero === null ? "hearth" : `hero:${a.hero}`}" ]`,
            ),
            "attack",
          );
        for (const blocker of blockers)
          add(
            point(`[data-permanent="${a.uid}"]`),
            point(`[data-permanent="${blocker}"]`),
            "block",
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
