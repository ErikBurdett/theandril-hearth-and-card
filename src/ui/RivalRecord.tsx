import { cardById } from "../content/catalog";
import { duelists } from "../content/tavern";
import { presetDeck, presets, recipeUnlocked } from "../sim/battle";
import type { Command, Game } from "../sim/game";
import { BattleMoments } from "./BattleMoments";

const outcome = {
  won: "Victory",
  lost: "Defeat",
  drawn: "Draw",
  conceded: "Conceded",
};

export function RivalRecord({
  game,
  guestId,
  compact = false,
  send,
}: {
  game: Game;
  guestId: string;
  compact?: boolean;
  send?: (command: Command) => boolean;
}) {
  const guest = duelists.find((entry) => entry.id === guestId)!;
  const record = game.rivals[guestId];
  const recipe = presets.find((entry) => entry.id === guest.deck)!;
  const learned = recipeUnlocked(game, guest.deck);
  const needed = new Map<string, number>();
  for (const id of presetDeck(guest.deck))
    needed.set(id, (needed.get(id) ?? 0) + 1);
  const missing = [...needed]
    .map(([id, count]) => ({
      id,
      count: Math.max(0, count - (game.collection[id] ?? 0)),
    }))
    .filter((entry) => entry.count > 0);
  const missingCount = missing.reduce((sum, entry) => sum + entry.count, 0);
  return (
    <section
      className={`rival-record${compact ? " rival-record-compact" : ""}`}
      aria-label={`Table history with ${guest.name}`}
    >
      <h3>{guest.name} · your table history</h3>
      {record ? (
        <>
          <p className="rival-score">
            Wins {record.wins} · Losses {record.losses} · Draws {record.draws} ·
            Conceded {record.concessions}
          </p>
          <p>
            Last meeting: {outcome[record.last.result]} · day {record.last.day}{" "}
            · {record.last.turns} {record.last.turns === 1 ? "turn" : "turns"}
          </p>
          <p>
            {record.last.result === "conceded"
              ? "No duel reward for conceding."
              : `Duel reward: ${record.last.crowns} crowns · ${record.last.renown} renown · ${record.last.xp} keeper XP.`}
          </p>
          {record.last.learnedRecipe && (
            <p>
              Learned{" "}
              {
                presets.find((entry) => entry.id === record.last.learnedRecipe)!
                  .name
              }{" "}
              at this meeting.
            </p>
          )}
          <BattleMoments moments={record.last.moments} />
        </>
      ) : (
        <p>No meetings recorded with this guest yet.</p>
      )}
      <p>
        {learned
          ? `${recipe.name} · recipe learned.`
          : `First victory teaches ${recipe.name}.`}{" "}
        {missingCount
          ? `${missingCount} missing copies to collect.`
          : "You own every required copy."}
      </p>
      {!compact && (
        <>
          {missingCount > 0 && (
            <details className="rival-missing">
              <summary>View missing cards ({missingCount} copies)</summary>
              <ul>
                {missing.map(({ id, count }) => (
                  <li key={id}>
                    {count} × {cardById[id].name}
                  </li>
                ))}
              </ul>
            </details>
          )}
          {send && (
            <button
              disabled={!learned || missingCount > 0}
              onClick={() => send({ type: "preset", preset: guest.deck })}
            >
              Prepare {recipe.name}
            </button>
          )}
          <small>
            Victory earns 35 crowns, 5 renown and 60 keeper XP. A defeat or draw
            earns 25 keeper XP. Collect recipe cards separately.
          </small>
        </>
      )}
    </section>
  );
}
