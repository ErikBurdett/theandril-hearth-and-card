import { useState } from "react";
import { milestones } from "../content/milestones";
import type { Game, Command } from "../sim/game";
export function KeeperJourney({
  game,
  send,
  visit,
  compact = false,
}: {
  game: Game;
  send: (cmd: Command) => boolean;
  visit: (tab: string) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const complete = (game.claimedMilestones ?? []).length;
  if (compact && complete === milestones.length) return null;
  return (
    <section
      className={`keeper-journey ${compact ? "journey-room" : "paper-panel"}`}
      aria-label="Keeper’s first chapters"
    >
      {compact ? (
        <button
          className="journey-toggle"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
        >
          ✦ First chapters · {complete}/{milestones.length}{" "}
          <span>{open ? "Close" : "Open journal"}</span>
        </button>
      ) : (
        <>
          <div className="eyebrow">A TAVERN WORTH REMEMBERING</div>
          <h2>The keeper’s first chapters</h2>
          <p>
            A few small beginnings. Claim each reward once, in your own time.
          </p>
        </>
      )}
      {(!compact || open) && (
        <div className="journey-chapters">
          {milestones.map((m) => {
            const claimed = (game.claimedMilestones ?? []).includes(m.id),
              ready = m.ready(game);
            return (
              <article key={m.id} className={claimed ? "chapter-complete" : ""}>
                <strong>
                  {claimed ? "✓ " : ""}
                  {m.title}
                </strong>
                <p>{m.detail}</p>
                <small>
                  {claimed ? "Recorded in your journal" : `${m.reward} crowns`}
                </small>
                {!claimed &&
                  (ready ? (
                    <button
                      className="primary"
                      onClick={() =>
                        send({ type: "claim-milestone", id: m.id })
                      }
                    >
                      Claim {m.reward} crowns
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        visit(m.tab);
                        setOpen(false);
                      }}
                    >
                      Go to{" "}
                      {m.tab === "Tavern"
                        ? "the shop floor"
                        : m.tab.toLowerCase()}
                    </button>
                  ))}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
