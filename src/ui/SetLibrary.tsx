import { factionById, setFactions, setContinuities } from "../content/factions";
import { cardById } from "../content/catalog";
import { Art } from "./CardView";
import { cardIllustration } from "../content/artwork";
import { useState, type CSSProperties } from "react";
import {
  sets,
  cards,
  setById,
  setIdentities,
  manaNames,
} from "../content/catalog";
import { setLore, setCompletion } from "../content/lore";
import { useCardInspect } from "./CardInspectContext";
export function SetLibrary({
  collection,
  onBrowse,
  initialSet = "rekindled",
}: {
  collection: Record<string, number>;
  initialSet?: string;
  onBrowse: (id: string) => void;
}) {
  const [active, setActive] = useState(initialSet),
    set = setById[active],
    lore = setLore[active],
    completion = setCompletion(collection, active),
    inspect = useCardInspect();
  return (
    <section className="set-library">
      <div className="section-heading">
        <div>
          <div className="eyebrow">EIGHT VOLUMES · ONE BROKEN WORLD</div>
          <h2>The keeper’s collected histories</h2>
        </div>
        <span>
          {Object.values(collection).filter((n) => n > 0).length} /{" "}
          {cards.length} stories found
        </span>
      </div>
      <div className="set-spines" aria-label="Set histories">
        {sets.map((s) => {
          const c = setCompletion(collection, s.id);
          return (
            <button
              key={s.id}
              className={active === s.id ? "selected" : ""}
              style={
                {
                  "--accent": s.color,
                  "--volume-art": `url(${cardIllustration(`${s.id}.16`)})`,
                } as CSSProperties
              }
              aria-pressed={active === s.id}
              onClick={() => setActive(s.id)}
            >
              <span>{s.symbol}</span>
              <strong>{s.name}</strong>
              <small>
                {s.code} · {c.owned}/{c.total}
              </small>
              <i style={{ "--completion": `${c.percent}%` } as CSSProperties} />
            </button>
          );
        })}
      </div>
      <div
        className="set-record"
        style={{ "--accent": set.color } as CSSProperties}
      >
        <div>
          <div className="volume-illustration">
            <Art set={set} />
            <span>{set.name}</span>
          </div>
          <span className="eyebrow">
            VOLUME {set.release} · {set.era}
          </span>
          <h3>{lore.question}</h3>
          <p>{lore.account}</p>
          <small className="uncertain-record">{lore.uncertainty}</small>
        </div>
        <aside>
          <strong>{setIdentities[active].archetype}</strong>
          <small>
            {setIdentities[active].colors.map((c) => manaNames[c]).join(" & ")}
          </small>
          <p>{setIdentities[active].plan}</p>
          <span>
            {completion.owned} of {completion.total} cards recorded ·{" "}
            {completion.percent}%
          </span>
          <button onClick={() => onBrowse(active)}>Browse this volume</button>
          <button
            className="text-link"
            onClick={() => inspect?.(`${active}.16`)}
          >
            Meet {cards.find((c) => c.id === `${active}.16`)!.name} →
          </button>
        </aside>
      </div>
      <section className="faction-folio paper-panel">
        <h2>Peoples behind the promises</h2>
        <p>{setContinuities[active]}</p>
        <p className="uncertain-record">
          Present-day faction notes are collector comparisons for older volumes.
          Character proposals remain proposals; the causes of the Ashfall remain
          disputed.
        </p>
        <div className="faction-grid">
          {setFactions[active].map((id) => {
            const f = factionById[id];
            return (
              <details key={id} className="faction-entry">
                <summary>
                  {f.name}
                  <small>{f.era}</small>
                </summary>
                <p>
                  <strong>{f.place}</strong> · {f.summary}
                </p>
                <h4>A bargain under strain</h4>
                <p>{f.tension}</p>
                <p>{f.relations}</p>
                <small>{f.materials}</small>
                <h4>Reading the cards</h4>
                <p>{f.lens}</p>
                <div className="faction-card-links">
                  {f.cards.map((id) => (
                    <button key={id} onClick={() => inspect?.(id)}>
                      {cardById[id].name} →
                    </button>
                  ))}
                </div>
              </details>
            );
          })}
        </div>
      </section>
    </section>
  );
}
