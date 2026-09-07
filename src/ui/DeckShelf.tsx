import { useState } from "react";
import type { Game, Command } from "../sim/game";
import { cardById, isResource } from "../content/catalog";
export function DeckShelf({
  game,
  send,
}: {
  game: Game;
  send: (cmd: Command) => boolean;
}) {
  const [name, setName] = useState(""),
    [message, setMessage] = useState("");
  return (
    <section className="deck-shelf" aria-label="Saved decks">
      <div>
        <h3>The deck shelf</h3>
        <p>
          Keep up to twelve named 100-card recipes. Books remember your list;
          they do not reserve spare cards.
        </p>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (send({ type: "save-deck", name })) {
            setMessage(`Saved “${name.trim()}”.`);
            setName("");
          }
        }}
      >
        <label>
          Deck name
          <input
            value={name}
            maxLength={32}
            onChange={(e) => setName(e.target.value)}
            placeholder="A name for these hundred stories"
          />
        </label>
        <button
          className="primary"
          disabled={game.deck.length !== 100 || !name.trim()}
        >
          {(game.savedDecks ?? []).some(
            (d) => d.name.toLowerCase() === name.trim().toLowerCase(),
          )
            ? "Update saved deck"
            : "Save current deck"}
        </button>
      </form>
      {message && <p role="status">{message}</p>}
      <div className="saved-deck-books">
        {(game.savedDecks ?? []).map((d) => {
          const missing = [...new Set(d.cards)].reduce(
            (n, id) =>
              n +
              Math.max(
                0,
                d.cards.filter((c) => c === id).length -
                  (game.collection[id] ?? 0),
              ),
            0,
          );
          return (
            <article key={d.name}>
              <h4>{d.name}</h4>
              <p>
                {d.cards.filter((id) => isResource(cardById[id])).length}{" "}
                resources · 100 cards
              </p>
              <small>
                {missing
                  ? `${missing} missing copies in your collection`
                  : "All cards in your collection"}
              </small>
              <button
                disabled={!!missing}
                onClick={() => {
                  if (send({ type: "load-deck", name: d.name }))
                    setMessage(`Prepared “${d.name}”.`);
                }}
              >
                Prepare {d.name}
              </button>
              <button
                onClick={() => {
                  if (send({ type: "delete-deck", name: d.name }))
                    setMessage(
                      `Removed the recipe “${d.name}”. Your cards remain in the collection.`,
                    );
                }}
                aria-label={`Remove saved recipe ${d.name}`}
              >
                Remove recipe
              </button>
            </article>
          );
        })}
      </div>
      {!(game.savedDecks ?? []).length && (
        <small>Your shelf is waiting for its first book.</small>
      )}
    </section>
  );
}
