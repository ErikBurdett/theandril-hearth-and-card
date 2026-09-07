import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  cardById,
  setById,
  buyback,
  copyLimit,
  DECK_SIZE,
  PACK_SIZE,
} from "../content/catalog";
import {
  illuminationStatus,
  ILLUMINATION_COPIES,
  type Game,
  type Command,
} from "../sim/game";
import { CardView } from "./CardView";

export function BulkOpening({
  game,
  send,
  onClose,
  onCollection,
}: {
  game: Game;
  send: (command: Command) => boolean;
  onClose: () => void;
  onCollection: () => void;
}) {
  const receipt = game.lastBulkOpening!;
  const dialog = useRef<HTMLDivElement>(null),
    close = useRef<HTMLButtonElement>(null);
  const [search, setSearch] = useState(""),
    [rarity, setRarity] = useState("all"),
    [message, setMessage] = useState("");
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    close.current?.focus();
    return () => {
      if (previous?.isConnected && !previous.hasAttribute("disabled"))
        previous.focus();
      else
        document
          .querySelector<HTMLButtonElement>(".review-bulk-opening")
          ?.focus();
    };
  }, []);
  const rows = Object.entries(receipt.cards).sort(
    ([a], [b]) => cardById[a].number - cardById[b].number,
  );
  const visible = rows.filter(
    ([id]) =>
      (rarity === "all" || cardById[id].rarity === rarity) &&
      `${cardById[id].name} ${cardById[id].type} ${cardById[id].rules}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const foil = rows.reduce((n, [, row]) => n + row.foil, 0),
    illuminated = rows.reduce((n, [, row]) => n + row.illuminated, 0);
  function action(command: Command, notice: string) {
    if (send(command)) setMessage(notice);
  }
  return createPortal(
    <div className="bulk-opening-scrim" onClick={onClose}>
      <div
        ref={dialog}
        className="bulk-opening"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-title"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.stopPropagation();
            onClose();
          }
          if (e.key === "Tab") {
            const controls = Array.from(
              dialog.current!.querySelectorAll<HTMLElement>(
                'button:not(:disabled), input, select, [tabindex="0"]',
              ),
            );
            const first = controls[0],
              last = controls.at(-1);
            if (e.shiftKey && document.activeElement === first) {
              e.preventDefault();
              last?.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
              e.preventDefault();
              first?.focus();
            }
          }
        }}
      >
        <header className="bulk-opening-header">
          <div>
            <div className="eyebrow">
              THE OPENED SEALS · {setById[receipt.setId].code}
            </div>
            <h2 id="bulk-title">{setById[receipt.setId].name} · Your haul</h2>
            <p>
              {receipt.packs.toLocaleString()} packs ·{" "}
              {(receipt.packs * PACK_SIZE).toLocaleString()} cards collected ·{" "}
              {foil} foil · {illuminated} Illuminated
            </p>
          </div>
          <button
            ref={close}
            aria-label="Close opening results"
            onClick={onClose}
          >
            ×
          </button>
        </header>
        <div className="bulk-opening-tools">
          <label>
            Find a card
            <input
              aria-label="Search opening results"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, type or skill"
            />
          </label>
          <label>
            Rarity
            <select
              aria-label="Opening rarity"
              value={rarity}
              onChange={(e) => setRarity(e.target.value)}
            >
              <option value="all">All rarities</option>
              {["common", "uncommon", "rare", "mythic"].map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <button onClick={onCollection}>
            Edit deck in grimoire · {game.deck.length}/{DECK_SIZE}
          </button>
          <strong>{game.gold.toLocaleString()} crowns</strong>
        </div>
        <p className="bulk-crafting-guide">
          Bind {ILLUMINATION_COPIES} ordinary spare copies into 1 Illuminated
          edition (4 copies consumed, no crown fee). Active deck copies and
          existing finishes are protected. Sales take ordinary copies first.
        </p>
        <p className="bulk-opening-notice" role="status">
          {message ||
            `${visible.length} of ${rows.length} card designs · duplicates grouped. Pull counts are the original receipt; owned counts update as you trade.`}
        </p>
        <div
          className="bulk-opening-scroll"
          tabIndex={0}
          aria-label="Collected cards"
        >
          <div className="bulk-opening-grid">
            {visible.map(([id, pull]) => {
              const card = cardById[id],
                owned = game.collection[id] ?? 0,
                committed = game.deck.filter((x) => x === id).length;
              const spare = Math.max(0, owned - committed),
                craft = illuminationStatus(game, id);
              return (
                <section
                  key={id}
                  className="bulk-result"
                  aria-label={`Opening result ${card.name}`}
                >
                  <p className="bulk-pull-count">
                    Pulled ×{pull.total} · {pull.foil} foil · {pull.illuminated}{" "}
                    Illuminated
                  </p>
                  <CardView
                    card={card}
                    hidden={!owned}
                    illuminated={(game.illuminated[id] ?? 0) > 0}
                    foil={
                      !(game.illuminated[id] ?? 0) && (game.foils[id] ?? 0) > 0
                    }
                  />
                  <p className="bulk-owned-count">
                    {owned} owned · {committed} in deck · {craft.ordinary}{" "}
                    ordinary · {game.foils[id] ?? 0} foil ·{" "}
                    {game.illuminated[id] ?? 0} Illuminated
                  </p>
                  <div className="bulk-card-actions">
                    <button
                      disabled={!spare}
                      onClick={() =>
                        action(
                          { type: "sell", cardId: id },
                          `Sold one spare ${card.name} for ${buyback(card)} crowns.`,
                        )
                      }
                    >
                      Sell 1 spare · {buyback(card)} crowns
                    </button>
                    <button
                      disabled={!craft.spareOrdinary}
                      onClick={() =>
                        action(
                          {
                            type: "sell",
                            cardId: id,
                            quantity: craft.spareOrdinary,
                          },
                          `Sold ${craft.spareOrdinary} ordinary spares for ${craft.spareOrdinary * buyback(card)} crowns.`,
                        )
                      }
                    >
                      Sell {craft.spareOrdinary} ordinary spares ·{" "}
                      {craft.spareOrdinary * buyback(card)} crowns
                    </button>
                    <button
                      className="illuminate-action"
                      disabled={!craft.canCraft}
                      title={
                        craft.canCraft
                          ? "Consume five ordinary spares; receive one Illuminated edition."
                          : `Need five ordinary spares; ${craft.spareOrdinary} available.`
                      }
                      onClick={() =>
                        action(
                          { type: "craft-illuminated", cardId: id },
                          `Created one Illuminated ${card.name}. Five ordinary spares became one edition.`,
                        )
                      }
                    >
                      Illuminate · {craft.spareOrdinary}/{ILLUMINATION_COPIES}{" "}
                      spares
                    </button>
                    <button
                      disabled={
                        game.deck.length >= DECK_SIZE ||
                        committed >= owned ||
                        committed >= copyLimit(card)
                      }
                      onClick={() =>
                        action(
                          { type: "deck", cardId: id, add: true },
                          `Added ${card.name} to your deck.`,
                        )
                      }
                    >
                      Add to deck
                    </button>
                    <button
                      disabled={!committed}
                      onClick={() =>
                        action(
                          { type: "deck", cardId: id, add: false },
                          `Removed ${card.name} from your deck; it remains owned.`,
                        )
                      }
                    >
                      Remove from deck
                    </button>
                  </div>
                </section>
              );
            })}
          </div>
          {!visible.length && (
            <p className="empty-opening">No cards match these filters.</p>
          )}
        </div>
        <footer>
          Everything is already saved to your grimoire. Closing this window
          keeps your cards and this receipt.
        </footer>
      </div>
    </div>,
    document.body,
  );
}
