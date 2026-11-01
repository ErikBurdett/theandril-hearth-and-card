import { useEffect, useRef } from "react";
import { cardById, isResource, manaNames } from "../content/catalog";
import {
  availableResources,
  stats,
  triggerLabel,
  type Target,
} from "../sim/battle";
import {
  lessons,
  practiceChoices,
  practiceInstruction,
  practiceStatus,
} from "../sim/practice";
import type { Command, Game } from "../sim/game";
import { CardArt } from "./CardView";
import { useCardInspect } from "./CardInspectContext";

type Props = { game: Game; send: (cmd: Command) => boolean };
export function PracticeLessons({ game, send }: Props) {
  return (
    <section className="practice-lessons" aria-label="Practice lessons">
      <h3>Learn at the practice table</h3>
      <p>
        Borrowed cards, no clock. Replay freely. Practice earns lesson
        checkmarks; your collection, crowns and rival record stay unchanged.
      </p>
      <div className="practice-actions">
        {lessons.map((lesson) => (
          <button
            key={lesson.id}
            onClick={() => send({ type: "practice-start", lesson: lesson.id })}
          >
            {lesson.title}
            {game.practice.completed.includes(lesson.id) ? " · Completed" : ""}
          </button>
        ))}
      </div>
    </section>
  );
}

export function PracticeTable({ game, send }: Props) {
  const active = game.practice.active!;
  const { battle: b } = active;
  const lesson = lessons.find((entry) => entry.id === active.lesson)!;
  const status = practiceStatus(active);
  const heading = useRef<HTMLHeadingElement>(null);
  const inspect = useCardInspect();
  useEffect(() => {
    heading.current?.focus();
  }, [active.lesson, active.step, status]);
  function targetLabel(target: Target | null) {
    if (!target) return "awaiting resolution";
    if (target.kind === "stack") return "targets the incoming spell";
    if (target.kind === "hearth")
      return `targets ${target.side === "player" ? "your" : "the opposing"} hearth`;
    const permanent = b[target.side].board.find((p) => p.uid === target.uid);
    return `targets ${permanent ? cardById[permanent.cardId].name : "a card no longer on the table"}`;
  }
  const card = (id: string, key: string, note?: string) => (
    <article className="practice-card" key={key} aria-label={cardById[id].name}>
      <CardArt card={cardById[id]} />
      <strong>{cardById[id].name}</strong>
      <span>
        {note ??
          (isResource(cardById[id])
            ? "Basic Resource"
            : `${cardById[id].type} · ${cardById[id].cost} mana including ${manaNames[cardById[id].color]}`)}
      </span>
      <button onClick={() => inspect?.(id)}>Read {cardById[id].name}</button>
    </article>
  );
  return (
    <section className="practice-table paper-panel" aria-label="Practice table">
      <div className="eyebrow">BORROWED CARDS · UNTIMED PRACTICE</div>
      <h2>{lesson.title}</h2>
      <p>{lesson.goal}</p>
      <section className="practice-instruction" aria-label="Lesson guidance">
        <h3 ref={heading} tabIndex={-1}>
          {status === "complete"
            ? "Lesson complete"
            : status === "retry"
              ? "Try this position again"
              : `Step ${active.step + 1} of ${lesson.steps}`}
        </h3>
        <p role="status">{practiceInstruction(active)}</p>
        <div className="practice-actions">
          {practiceChoices(active).map((choice) => (
            <button
              key={choice.id}
              onClick={() => send({ type: "practice-act", action: choice.id })}
            >
              {choice.label}
            </button>
          ))}
        </div>
      </section>
      <div className="practice-actions">
        <button
          onClick={() =>
            send({ type: "practice-start", lesson: active.lesson })
          }
        >
          Replay lesson
        </button>
        <button onClick={() => send({ type: "practice-exit" })}>
          Return to guest selection
        </button>
      </div>
      <p className="practice-score">
        Your hearth: {b.player.hp} · Opposing hearth: {b.enemy.hp} · Available
        mana: {availableResources(b.player).total}
      </p>
      <section aria-label="Practice stack">
        <h3>Stack · resolves from the top</h3>
        {b.stack.length ? (
          <ol>
            {[...b.stack].reverse().map((item) => (
              <li key={item.uid}>
                {item.owner === "player" ? "Your" : "Opposing"}{" "}
                {item.trigger
                  ? `${triggerLabel(item)} · trigger`
                  : `${cardById[item.cardId].name} · ${targetLabel(item.target)}`}
              </li>
            ))}
          </ol>
        ) : (
          <p>The stack is empty.</p>
        )}
      </section>
      <section aria-label="Practice hand">
        <h3>Your hand</h3>
        <div className="practice-cards">
          {b.player.hand.map((id, i) => card(id, `hand-${i}`))}
        </div>
        {!b.player.hand.length && <p>No cards in hand.</p>}
      </section>
      {(["player", "enemy"] as const).map((owner) => (
        <section
          key={owner}
          aria-label={
            owner === "player"
              ? "Your practice board"
              : "Opposing practice board"
          }
        >
          <h3>{owner === "player" ? "Your table" : "Opposing table"}</h3>
          <div className="practice-cards">
            {b[owner].board.map((p) =>
              card(
                p.cardId,
                String(p.uid),
                isResource(cardById[p.cardId])
                  ? `${p.tapped ? "Exhausted" : "Ready"} resource`
                  : `${stats(b[owner], p).power}/${stats(b[owner], p).toughness} · ${p.damage} damage${p.boost > 0 ? ` · +${p.boost}/+${p.boost} this turn` : ""}${b.stack.some((item) => item.effect === "damage" && item.target?.side === owner && item.target?.uid === p.uid && item.target.kind === "creature") ? " · Incoming damage" : ""}${b.combat.some((a) => a.blockers.includes(p.uid)) ? " · Blocking" : b.combat.some((a) => a.uid === p.uid) ? " · Attacking" : ""}`,
              ),
            )}
          </div>
          {!b[owner].board.length && <p>No cards on the table.</p>}
        </section>
      ))}
    </section>
  );
}
