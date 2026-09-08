import { useState } from "react";
import type { Game, Command } from "../sim/game";
import {
  ingredients,
  recipes,
  skills,
  upgrades,
  itemName,
} from "../content/hospitality";
import {
  clockPhase,
  skillPoints,
  hasSkill,
  hasUpgrade,
  pantryUsage,
  pantryCapacity,
  stockUsage,
  stockCapacity,
  guestCapacity,
  sellingPrice,
  brewingVessels,
  brewingBells,
  recipeSupplies,
} from "../sim/hospitality";
export function Hospitality({
  game,
  send,
}: {
  game: Game;
  send: (c: Command) => boolean;
}) {
  const [quantity, setQuantity] = useState(5),
    [section, setSection] = useState("Grow the tavern"),
    [recipeFilter, setRecipeFilter] = useState("all"),
    [search, setSearch] = useState("");
  const h = game.hospitality;
  return (
    <div className="hospitality">
      <section className="paper-panel hospitality-summary">
        <div>
          <h2>A home for hungry travelers</h2>
          <p>
            Day {game.day} · {clockPhase(game)} · bell {(h.bell % 48) + 1}/48
          </p>
          <progress
            aria-label="Day and night cycle"
            max={48}
            value={h.bell % 48}
          />
        </div>
        <div>
          <button
            aria-pressed={h.auto}
            onClick={() => send({ type: "auto-shop", enabled: !h.auto })}
          >
            Automatic hours: {h.auto ? "On" : "Off"}
          </button>
          <p>
            Open at dawn, close at nightfall. Each bell is 4 seconds; 38
            daylight bells (2m 32s) and 10 night bells (40s). Cellar work
            continues at night. Manual sign changes disable automatic hours.
          </p>
        </div>
        <p>
          {stockUsage(game)}/{stockCapacity(game)} sealed spaces (including
          deliveries) · {pantryUsage(game)}/{pantryCapacity(game)} pantry spaces
          (including brewing output) · {guestCapacity(game)} guest places
        </p>
        <p>
          {h.xp} service experience · {skillPoints(game)} skill points ·{" "}
          {h.mealsSold} meals served · {h.drinksSold} drinks poured. Start with
          2 points; every 5 completed NPC purchases earns another.
        </p>
      </section>
      <nav className="hospitality-tabs" aria-label="Tavern management">
        {[
          "Grow the tavern",
          "Skill tree",
          "Marketplace",
          "Kitchen & cellar",
        ].map((s) => (
          <button
            key={s}
            aria-pressed={section === s}
            onClick={() => setSection(s)}
          >
            {s}
          </button>
        ))}
      </nav>
      {section === "Grow the tavern" && (
        <div className="hospitality-grid">
          {upgrades.map((u) => (
            <section className="paper-panel" key={u.id}>
              <div className="eyebrow">
                {u.requires
                  ? `AFTER ${upgrades.find((x) => x.id === u.requires)!.name}`
                  : "ROOM TO GROW"}
              </div>
              <h3>{u.name}</h3>
              <p>{u.detail}</p>
              {!hasUpgrade(game, u.id) && (
                <p className="unlock-hint">
                  {u.requires && !hasUpgrade(game, u.requires)
                    ? `First build ${upgrades.find((x) => x.id === u.requires)!.name}.`
                    : game.gold < u.cost
                      ? `${u.cost - game.gold} more crowns needed.`
                      : "Ready to build."}
                </p>
              )}
              <button
                disabled={
                  hasUpgrade(game, u.id) ||
                  (!!u.requires && !hasUpgrade(game, u.requires)) ||
                  game.gold < u.cost
                }
                onClick={() => send({ type: "upgrade-tavern", id: u.id })}
              >
                {hasUpgrade(game, u.id)
                  ? "Built"
                  : `Build ${u.name} · ${u.cost} crowns`}
              </button>
            </section>
          ))}
        </div>
      )}
      {section === "Skill tree" && (
        <div className="hospitality-grid">
          {["Stewardship", "Hospitality", "Craft"].map((branch) => (
            <section className="paper-panel skill-branch" key={branch}>
              <h3>{branch}</h3>
              {skills
                .filter((k) => k.branch === branch)
                .map((k) => (
                  <div
                    className={`skill-node ${hasSkill(game, k.id) ? "learned" : ""}`}
                    key={k.id}
                  >
                    <span>{k.requires ? "↓" : "✦"}</span>
                    <h4>{k.name}</h4>
                    <p>{k.detail}</p>
                    <button
                      disabled={
                        hasSkill(game, k.id) ||
                        (!!k.requires && !hasSkill(game, k.requires)) ||
                        skillPoints(game) < k.cost
                      }
                      onClick={() => send({ type: "learn-skill", id: k.id })}
                    >
                      {hasSkill(game, k.id)
                        ? "Learned"
                        : `Learn ${k.name} · ${k.cost} points`}
                    </button>
                  </div>
                ))}
            </section>
          ))}
        </div>
      )}
      {section === "Marketplace" && (
        <>
          <p>
            Buy pantry supplies from the Grey Weir market. Finished dishes and
            drinks are bought by visiting guests at the listed menu price.
          </p>
          <label>
            Purchase quantity{" "}
            <select
              aria-label="Ingredient quantity"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            >
              {[1, 5, 10, 20].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </label>
          <div className="hospitality-grid market-grid">
            {ingredients.map((i) => (
              <section key={i.id} className="paper-panel">
                <h3>{i.name}</h3>
                <p>
                  {h.pantry[i.id] ?? 0} in pantry · {i.price} crowns each
                </p>
                <button
                  disabled={
                    game.gold < quantity * i.price ||
                    pantryUsage(game) + quantity > pantryCapacity(game)
                  }
                  onClick={() =>
                    send({ type: "buy-ingredient", id: i.id, quantity })
                  }
                >
                  Buy {quantity} {i.name} · {quantity * i.price} crowns
                </button>
              </section>
            ))}
          </div>
        </>
      )}
      {section === "Kitchen & cellar" && (
        <>
          <section className="paper-panel">
            <h3>
              Cellar watch · {h.batches.length}/{brewingVessels(game)} vessels
            </h3>
            {h.batches.length ? (
              h.batches.map((b, i) => (
                <p key={i}>
                  {itemName(b.recipe)} ×{b.quantity} ·{" "}
                  {Math.max(0, b.readyAt - h.bell)} bells remaining · ready day{" "}
                  {game.day +
                    Math.floor(((h.bell % 48) + b.readyAt - h.bell) / 48)}
                </p>
              ))
            ) : (
              <p>
                No batches fermenting. Brewing reserves space for its finished
                drinks.
              </p>
            )}
          </section>
          <div className="recipe-tools paper-panel">
            <label>
              Find a recipe{" "}
              <input
                aria-label="Find a recipe"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name or ingredient…"
              />
            </label>
            <label>
              Show{" "}
              <select
                aria-label="Recipe filter"
                value={recipeFilter}
                onChange={(e) => setRecipeFilter(e.target.value)}
              >
                <option value="all">All recipes</option>
                <option value="meal">Meals</option>
                <option value="drink">Drinks</option>
                <option value="ready">Ready to prepare</option>
                <option value="unlocked">Unlocked</option>
              </select>
            </label>
            <p>
              Guests buy ready servings automatically while the shop is open.
              Buy missing market supplies here; cooked ingredients and finished
              brews must be prepared first.
            </p>
          </div>
          <div className="hospitality-grid recipe-list">
            {recipes
              .filter((r) => {
                const supplies = recipeSupplies(game, r.id);
                return (
                  (r.name + " " + Object.keys(r.inputs).map(itemName).join(" "))
                    .toLowerCase()
                    .includes(search.toLowerCase()) &&
                  (recipeFilter === "all" ||
                    recipeFilter === r.type ||
                    (recipeFilter === "unlocked" &&
                      hasUpgrade(game, r.requires)) ||
                    (recipeFilter === "ready" &&
                      hasUpgrade(game, r.requires) &&
                      !supplies.missing.length &&
                      (!r.bells || h.batches.length < brewingVessels(game)) &&
                      pantryUsage(game) -
                        Object.values(r.inputs).reduce((a, n) => a + n, 0) +
                        r.yield <=
                        pantryCapacity(game)))
                );
              })
              .map((r) => {
                const missing = Object.entries(r.inputs).some(
                  ([id, n]) => (h.pantry[id] ?? 0) < n,
                );
                const locked = !hasUpgrade(game, r.requires);
                const supplies = recipeSupplies(game, r.id);
                const full =
                  !!r.bells && h.batches.length >= brewingVessels(game);
                const noSpace =
                  pantryUsage(game) -
                    Object.values(r.inputs).reduce((a, n) => a + n, 0) +
                    r.yield >
                  pantryCapacity(game);
                const reason = locked
                  ? `Build ${upgrades.find((u) => u.id === r.requires)!.name} to unlock.`
                  : missing
                    ? `Missing: ${supplies.missing.map((m) => `${m.quantity} ${itemName(m.id)}`).join(", ")}.`
                    : full
                      ? "All vessels are busy; wait for a batch to finish."
                      : noSpace
                        ? "Make pantry space for this batch."
                        : "Ready to prepare.";
                return (
                  <section className="paper-panel recipe" key={r.id}>
                    <div className="eyebrow">
                      {r.type === "meal" ? "KITCHEN" : "FERMENTATION"} ·{" "}
                      {r.requires}
                    </div>
                    <h3>{r.name}</h3>
                    <p>
                      {Object.entries(r.inputs)
                        .map(
                          ([id, n]) =>
                            `${n} ${itemName(id)} (${h.pantry[id] ?? 0} owned)`,
                        )
                        .join(" + ")}
                    </p>
                    <p>
                      Creates {r.yield} ·{" "}
                      {r.bells
                        ? `${brewingBells(game, r.bells)} bells across day/night`
                        : "Ready immediately"}
                    </p>
                    <strong>
                      {h.pantry[r.id] ?? 0} ready · sells for{" "}
                      {sellingPrice(game, r.id)} crowns each
                    </strong>
                    <p className="recipe-hint" id={`recipe-hint-${r.id}`}>
                      {reason}
                    </p>
                    {!locked && supplies.purchases.length > 0 && (
                      <button
                        disabled={
                          game.gold < supplies.cost ||
                          pantryUsage(game) + supplies.space >
                            pantryCapacity(game)
                        }
                        onClick={() =>
                          send({ type: "buy-recipe-supplies", id: r.id })
                        }
                      >
                        Buy missing supplies · {supplies.cost} crowns
                      </button>
                    )}
                    <button
                      disabled={locked || missing || full || noSpace}
                      aria-describedby={`recipe-hint-${r.id}`}
                      onClick={() => send({ type: "craft-recipe", id: r.id })}
                    >
                      {locked
                        ? `Requires ${r.requires}`
                        : `${r.bells ? "Brew" : "Cook"} ${r.name}`}
                    </button>
                  </section>
                );
              })}
          </div>
          <p className="recipe-empty">
            No recipes match. Try another name or choose All recipes.
          </p>
        </>
      )}
    </div>
  );
}
