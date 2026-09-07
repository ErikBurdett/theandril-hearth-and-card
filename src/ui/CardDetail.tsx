import { assetUrl } from "../content/artwork";
import { useEffect, useRef } from "react";
import { cardById, setById, buyback, manaNames } from "../content/catalog";
import { cardLore } from "../content/lore";
import type { Game } from "../sim/game";
import { CardView } from "./CardView";
import { CardInspectContext } from "./CardInspectContext";
export function CardDetail({
  id,
  game,
  onClose,
}: {
  id: string;
  game: Game;
  onClose: () => void;
}) {
  const box = useRef<HTMLDivElement>(null),
    close = useRef<HTMLButtonElement>(null),
    card = cardById[id],
    set = setById[card.setId],
    lore = cardLore(card),
    n = game.collection[id] ?? 0,
    d = game.deck.filter((x) => x === id).length;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    close.current?.focus();
    return () => {
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  return (
    <div
      ref={box}
      className="card-detail-scrim"
      role="dialog"
      aria-modal="true"
      aria-label={`Inspect ${card.name}`}
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          onClose();
        }
        if (e.key === "Tab") {
          const controls = Array.from(
            box.current!.querySelectorAll<HTMLElement>(
              'button, a, input, select, [tabindex="0"]',
            ),
          ).filter((el) => !el.hasAttribute("disabled"));
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
      <button
        ref={close}
        className="detail-close"
        onClick={onClose}
        aria-label="Close card inspection"
      >
        ×
      </button>
      <div className="card-detail" onClick={(e) => e.stopPropagation()}>
        <div className="detail-card">
          <CardInspectContext.Provider value={null}>
            <CardView
              card={card}
              showcase
              illuminated={(game.illuminated[id] ?? 0) > 0}
              foil={!(game.illuminated[id] ?? 0) && (game.foils[id] ?? 0) > 0}
            />
          </CardInspectContext.Provider>
          <span className="eyebrow">
            {set.code} · {String(card.number).padStart(3, "0")} / 080 ·{" "}
            {card.rarity}
          </span>
        </div>
        <div className="detail-record">
          <div className="eyebrow">FROM ERILIAN’S PRIVATE GRIMOIRE</div>
          <h2>{card.name}</h2>
          <p className="detail-subtitle">
            {card.type} · {card.tradition} · {manaNames[card.color]}
          </p>
          <blockquote>{lore.flavor}</blockquote>
          <div className="detail-inventory">
            <span>
              <b>{n}</b> owned
            </span>
            <span>
              <b>{d}</b> in your deck
            </span>
            <span>
              <b>{game.foils[id] ?? 0}</b> foil ·{" "}
              <b>{game.illuminated[id] ?? 0}</b> illuminated
            </span>
            <span>
              <b>{Math.max(0, n - d)}</b> spare
            </span>
          </div>
          <section>
            <h3>{set.name}</h3>
            <small>
              {set.era} · {lore.place}
            </small>
            <p>{lore.account}</p>
            {card.id === "ashfall.16" && (
              <p>
                Ilthen is the chronicler known as Ledgerbone. Erilian, your
                tavern’s keeper, is a different lich.
              </p>
            )}
            <p className="uncertain-record">{lore.uncertainty}</p>
          </section>
          {lore.collectorNote && (
            <section className="collector-marginalia">
              <h3>A closer reading</h3>
              <p>{lore.collectorNote}</p>
            </section>
          )}
          {lore.factions.length > 0 && (
            <section className="collector-marginalia">
              <h3>Faction connections</h3>
              <small>Collector comparisons · RR 2447</small>
              {lore.factions.map((f) => (
                <div key={f.id}>
                  <h4>{f.name}</h4>
                  <p>{f.lens}</p>
                  <p>{f.tension}</p>
                </div>
              ))}
            </section>
          )}
          <details>
            <summary>History and present-day continuity</summary>
            <p>{lore.continuity}</p>
            <small>
              Book of Broken Roads and Faction Bible · {lore.revision}. Faction
              comparisons do not change this card’s era, rules or original
              illustration.
            </small>
          </details>
          <div className="keeper-note">
            <img
              src={assetUrl("/art/animation/player.erilian-idle.png")}
              alt=""
            />
            <div>
              <small>ERILIAN’S MARGIN NOTE</small>
              <p>“{lore.keeperNote}”</p>
            </div>
          </div>
          <footer>
            <span>The Book of Broken Roads · {lore.chapter}</span>
            <small>
              Collector’s retelling · spare-copy value {buyback(card)} crowns
            </small>
          </footer>
        </div>
      </div>
    </div>
  );
}
