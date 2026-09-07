import { stockCapacity, stockUsage } from "../sim/hospitality";
import { useState, type CSSProperties } from "react";
import { sets, cards, cardById, buyback } from "../content/catalog";
import { setCompletion } from "../content/lore";
import { wholesale, type Game, type Command } from "../sim/game";
import { Art } from "./CardView";
export function InventoryLedger({
  game,
  send,
  onPacks,
}: {
  game: Game;
  send: (c: Command) => void;
  onPacks: () => void;
}) {
  const [lowOnly, setLowOnly] = useState(false),
    [quantity, setQuantity] = useState(5),
    stock = Object.values(game.products).reduce((a, p) => a + p.stock, 0),
    incoming = game.orders.reduce((a, o) => a + o.quantity, 0),
    stockCost = sets.reduce(
      (a, s) => a + game.products[s.id].stock * wholesale(s.id),
      0,
    ),
    spares = Object.entries(game.collection).reduce(
      (a, [id, n]) =>
        a + Math.max(0, n - game.deck.filter((x) => x === id).length),
      0,
    ),
    spareValue = Object.entries(game.collection).reduce(
      (a, [id, n]) =>
        a +
        Math.max(0, n - game.deck.filter((x) => x === id).length) *
          buyback(cardById[id]),
      0,
    );
  return (
    <>
      <div className="ledger-totals">
        <div>
          <small>SEALED ON THE SHELVES</small>
          <strong>
            {stock}
            <em> packs</em>
          </strong>
          <span>
            {stockCost} crowns at current wholesale · {stockUsage(game)}/
            {stockCapacity(game)} spaces reserved
          </span>
        </div>
        <div>
          <small>WITH THE CARAVANS</small>
          <strong>
            {incoming}
            <em> {incoming === 1 ? "pack" : "packs"}</em>
          </strong>
          <span>{game.orders.length} outstanding deliveries</span>
        </div>
        <div>
          <small>SPARE COLLECTION COPIES</small>
          <strong>
            {spares}
            <em> cards</em>
          </strong>
          <span>{spareValue} crowns in spare-copy value</span>
        </div>
      </div>
      <div className="inventory-toolbar">
        <label>
          <input
            type="checkbox"
            checked={lowOnly}
            onChange={(e) => setLowOnly(e.target.checked)}
          />{" "}
          Shelves running low (3 or fewer)
        </label>
        <label>
          Order quantity{" "}
          <select
            aria-label="Restock quantity"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          >
            {[1, 5, 10, 20].map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? "booster" : "boosters"}
              </option>
            ))}
          </select>
        </label>
        <button onClick={onPacks}>Take a pack to the table →</button>
      </div>
      <div className="notice">
        <span>
          Caravans arrive after three open-shop bells. Travelers pay more
          readily for a fair shelf price.
        </span>
        <button className="primary" onClick={() => send({ type: "toggle" })}>
          {game.open ? "Close shop" : "Open shop"}
        </button>
      </div>
      <div className="products">
        {sets
          .filter((s) => !lowOnly || game.products[s.id].stock <= 3)
          .map((set) => {
            const p = game.products[set.id],
              orders = game.orders.filter((o) => o.setId === set.id),
              awaiting = orders.reduce((n, o) => n + o.quantity, 0),
              complete = setCompletion(game.collection, set.id);
            return (
              <section
                className="product paper-panel"
                key={set.id}
                style={{ "--accent": set.color } as CSSProperties}
              >
                <Art set={set} />
                <div className="product-info">
                  <div className="eyebrow">
                    {set.code} · VOLUME {set.release} · 14 CARDS / PACK
                  </div>
                  <h2>{set.name}</h2>
                  <p>{set.era}</p>
                  <div className="product-meta">
                    <span className={p.stock <= 3 ? "stock-low" : ""}>
                      {p.stock} in stock
                    </span>
                    <span>{p.sold} sold</span>
                    {awaiting > 0 && <span>{awaiting} incoming</span>}
                  </div>
                  <small>
                    {complete.owned}/{complete.total} cards in your grimoire ·{" "}
                    {p.price - wholesale(set.id)} crowns gross margin / pack
                  </small>
                  {p.stock === 0 && (
                    <p className="stock-low">
                      An empty shelf. Travelers cannot buy this volume.
                    </p>
                  )}
                </div>
                <div className="product-controls">
                  <label>
                    Shelf price · crowns
                    <input
                      aria-label={`${set.name} price`}
                      type="number"
                      min="1"
                      max="60"
                      value={p.price}
                      onChange={(e) =>
                        send({
                          type: "price",
                          setId: set.id,
                          price: Number(e.target.value),
                        })
                      }
                    />
                  </label>
                  <button
                    className="primary"
                    disabled={
                      game.gold < wholesale(set.id) * quantity ||
                      stockUsage(game) + quantity > stockCapacity(game)
                    }
                    onClick={() =>
                      send({ type: "order", setId: set.id, quantity })
                    }
                  >
                    Order {quantity} · {wholesale(set.id) * quantity} crowns
                  </button>
                  <small>Wholesale: {wholesale(set.id)} crowns / booster</small>
                </div>
              </section>
            );
          })}
      </div>
      {lowOnly && !sets.some((s) => game.products[s.id].stock <= 3) && (
        <div className="empty-ledger">
          <span>✦</span>
          <h3>Every shelf has a little breathing room.</h3>
          <p>No volume has fewer than four sealed packs.</p>
        </div>
      )}
      <section className="delivery-ledger paper-panel">
        <div className="eyebrow">THE CARAVAN BOOK</div>
        <h2>On the road to Grey Weir</h2>
        {game.orders.length ? (
          game.orders.map((o, i) => (
            <div key={`${o.setId}-${i}`}>
              <strong>{sets.find((s) => s.id === o.setId)!.name}</strong>
              <span>{o.quantity} packs</span>
              <small>
                {Math.max(0, o.due - game.tick)} open-shop bells away
              </small>
            </div>
          ))
        ) : (
          <p>No wagons expected. The road is quiet tonight.</p>
        )}
        <small>
          Collection cards and sealed shop stock are kept separately. Opening a
          pack removes it from the shelf and adds its cards to your grimoire.
        </small>
      </section>
    </>
  );
}
