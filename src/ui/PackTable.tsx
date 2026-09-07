import { SpriteOrnament } from "./SpriteOrnament";
import { BulkOpening } from "./BulkOpening";
import { useRef, useState, type CSSProperties } from "react";
import {
  sets,
  cardById,
  setById,
  setIdentities,
  manaNames,
  ILLUMINATED_CHANCE,
} from "../content/catalog";
import { setLore, setCompletion } from "../content/lore";
import type { Game, Command } from "../sim/game";
import { Art, CardView } from "./CardView";
export function PackTable({
  game,
  send,
  onCollection,
}: {
  game: Game;
  send: (c: Command) => boolean;
  onCollection: () => void;
}) {
  const [selected, setSelected] = useState("rekindled"),
    [showBulk, setShowBulk] = useState(false),
    [shown, setShown] = useState(14),
    [showPack, setShowPack] = useState(game.lastPack.length > 0),
    [seal, setSeal] = useState(0),
    [before, setBefore] = useState<Set<string> | null>(null),
    reveal = useRef<HTMLElement>(null),
    set = setById[selected],
    lore = setLore[selected],
    completion = setCompletion(game.collection, selected),
    opening = showPack && shown < game.lastPack.length;
  const open = () => {
    const owned = new Set(
      Object.entries(game.collection)
        .filter(([, n]) => n > 0)
        .map(([id]) => id),
    );
    if (!send({ type: "open-pack", setId: selected })) return;
    setBefore(owned);
    setSeal((n) => n + 1);
    setShowPack(true);
    setShown(0);
    requestAnimationFrame(() =>
      reveal.current?.scrollIntoView({ block: "start", behavior: "instant" }),
    );
  };
  const openAll = (setId: string) => {
    if (!send({ type: "open-all-packs", setId })) return;
    setSelected(setId);
    setShown(14);
    setShowPack(false);
    setShowBulk(true);
  };
  const revealNext = () => {
    setShown((n) => Math.min(14, n + 1));
    requestAnimationFrame(() =>
      reveal.current
        ?.querySelector(".revealed-card:last-of-type")
        ?.scrollIntoView({ block: "nearest", behavior: "instant" }),
    );
  };
  return (
    <>
      {game.lastBulkOpening && (
        <button
          className="review-bulk-opening"
          onClick={() => setShowBulk(true)}
        >
          Review last haul · {setById[game.lastBulkOpening.setId].name} ·{" "}
          {game.lastBulkOpening.packs} packs
        </button>
      )}
      {showBulk && game.lastBulkOpening && (
        <BulkOpening
          game={game}
          send={send}
          onClose={() => setShowBulk(false)}
          onCollection={() => {
            setShowBulk(false);
            onCollection();
          }}
        />
      )}
      <div className="pack-layout">
        <section className="pack-selector paper-panel">
          <div className="eyebrow">THE BOOK OF BROKEN ROADS</div>
          <h2>Choose your chapter</h2>
          {sets.map((s) => (
            <div key={s.id} className="pack-set-row">
              <button
                className={selected === s.id ? "selected" : ""}
                disabled={opening}
                onClick={() => {
                  setSelected(s.id);
                  setShowPack(false);
                }}
              >
                <span style={{ color: s.color }}>{s.symbol}</span>
                <div>
                  <strong>{s.name}</strong>
                  <small>{s.era}</small>
                </div>
                <b title="Sealed stock">{game.products[s.id].stock}</b>
              </button>
              <button
                className="bulk-open"
                aria-label={`Open all packs of ${s.name}`}
                disabled={opening || game.products[s.id].stock < 1}
                onClick={() => openAll(s.id)}
              >
                Open all {game.products[s.id].stock} packs
              </button>
            </div>
          ))}
        </section>
        <section
          className="pack-stage"
          style={{ "--accent": set.color } as CSSProperties}
        >
          <div className="eyebrow">
            {set.block} · {set.code}
          </div>
          <h2>{set.name}</h2>
          <p>{lore.question}</p>
          <div
            key={`${selected}-${seal}`}
            className={`booster ${seal && showPack ? "seal-broken" : ""}`}
          >
            <div className="booster-crimp" />
            <small>THEANDRIL</small>
            <Art set={set} />
            <h3>{set.name}</h3>
            <SpriteOrnament kind="pack" active={Boolean(seal && showPack)} />
            <div className="wax-seal" aria-hidden="true">
              {set.symbol}
            </div>
            <span>14 STORY CARDS · SEALED AT GREY WEIR</span>
            <div className="booster-crimp" />
          </div>
          <button
            className="primary break-seal"
            disabled={game.products[selected].stock < 1 || opening}
            onClick={open}
          >
            Break the seal
          </button>
          <small>
            {game.products[selected].stock} sealed packs on your shelf · one
            pack opens fourteen stories
          </small>
          <div className="pack-volume-note">
            <strong>{setIdentities[selected].archetype}</strong>
            <span>
              {setIdentities[selected].colors
                .map((c) => manaNames[c])
                .join(" & ")}{" "}
              · {completion.owned}/{completion.total} collected
            </span>
            <p>{lore.keeperNote}</p>
          </div>
        </section>
      </div>
      <details className="pack-odds paper-panel">
        <summary>The seal promises · pack contents & rarity chances</summary>
        <div className="odds-slots">
          {[
            ["7", "Common"],
            ["3", "Uncommon"],
            ["1", "Resource"],
            ["1", "Rare / mythic"],
            ["1", "Wildcard"],
            ["1", "Foil"],
          ].map(([n, label]) => (
            <div key={label}>
              <b>{n}</b>
              <span>{label}</span>
            </div>
          ))}
        </div>
        <p>
          Rare slot: 87.5% rare / 12.5% mythic. Resource slot: 80% basic / 20%
          special resource.
        </p>
        <p>
          Wildcard and foil, each: 70% common / 22% uncommon / 7% rare / 1%
          mythic.
        </p>
        <strong>At least one mythic: 14.24% per pack.</strong>
        <p>
          Every set: 33 common, 26 uncommon, 16 rare and 5 mythic cards. Older
          eras are collectible for their stories, not artificially harder to
          find.
        </p>
        <p>
          Illuminated edition: {ILLUMINATED_CHANCE * 100}% per pack (1 in 20),
          upgrading the rare/mythic slot with gilded framing. The complete
          painting and rules are unchanged; this is a special frame treatment,
          not alternate illustration art. Each rare has a 1 in 320 chance per
          pack of this edition; each mythic, 1 in 640. It is separate from the
          guaranteed foil.
        </p>
        <p>
          Foil is a finish, not a rarity. Each eligible sheet is sampled
          independently; duplicate cards are possible.
        </p>
      </details>
      {showPack && game.lastPack.length > 0 && (
        <section ref={reveal} className="reveal-section">
          <div className="section-heading">
            <div>
              <div className="eyebrow">
                {setById[cardById[game.lastPack[0]].setId].name} · THE OPENED
                SEAL
              </div>
              <h2>
                {shown < 14
                  ? "Fourteen stories beneath your hand."
                  : "Fourteen new stories, yours to keep."}
              </h2>
              <p>
                {Math.min(shown, 14)} / 14 revealed · all cards are safely in
                your grimoire
              </p>
            </div>
            <div className="reveal-controls">
              {shown < 14 ? (
                <>
                  <button className="primary" onClick={revealNext}>
                    Reveal next card
                  </button>
                  <button onClick={() => setShown(14)}>Reveal all cards</button>
                </>
              ) : (
                <button onClick={onCollection}>View collection →</button>
              )}
            </div>
          </div>
          <div className="reveal-grid">
            {game.lastPack.map((id, i) =>
              i < shown ? (
                <div className={`revealed-card ${cardById[id].rarity}`} key={i}>
                  <span className="pull-label">
                    {game.lastPackIlluminated[i]
                      ? "✦ ILLUMINATED · "
                      : game.lastPackFoils[i]
                        ? "✧ FOIL · "
                        : ""}
                    {before && !before.has(id)
                      ? "NEW TO YOUR GRIMOIRE"
                      : `${i + 1} · ${i < 7 ? "Common" : i < 10 ? "Uncommon" : i === 10 ? "Resource" : i === 11 ? "Rare / mythic" : i === 12 ? "Wildcard" : "Foil"}`}
                  </span>
                  <CardView
                    card={cardById[id]}
                    foil={game.lastPackFoils[i]}
                    illuminated={game.lastPackIlluminated[i]}
                  />
                </div>
              ) : (
                <button
                  key={i}
                  className="card-back"
                  aria-label={`Reveal card ${i + 1}`}
                  disabled={i !== shown}
                  onClick={revealNext}
                >
                  <span className="back-border">
                    <small>THE LICH’S TALE</small>
                    <b>☽</b>
                    <strong>
                      HEARTH
                      <br />& CARD
                    </strong>
                    <i>✧</i>
                    <small>
                      {i === 13
                        ? "THE FOIL"
                        : i === 11
                          ? "THE RARE SEAL"
                          : i === 10
                            ? "A PLACE IN THE WORLD"
                            : `STORY ${i + 1}`}
                    </small>
                  </span>
                </button>
              ),
            )}
          </div>
        </section>
      )}
    </>
  );
}
