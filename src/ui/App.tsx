import { readLocalSave, writeLocalSave, SaveConflict } from "../sim/local-save";
import { Notifications } from "./Notifications";
import { Progression } from "./Progression";
import { AutoBattle } from "./AutoBattle";
import { cardFactionLenses } from "../content/factions";
import { Hospitality } from "./Hospitality";
import { tableWords } from "../content/wording";
import { KeeperJourney } from "./KeeperJourney";
import { DeckShelf } from "./DeckShelf";
import { CardInspectContext } from "./CardInspectContext";
import { CardDetail } from "./CardDetail";
import { SetLibrary } from "./SetLibrary";
import { InventoryLedger } from "./InventoryLedger";
import { PackTable } from "./PackTable";
import { CardView } from "./CardView";
import { BattleTable } from "./BattleTable";
import { presets, missingDeckCopies, recipeUnlocked } from "../sim/battle";
import {
  isResource,
  copyLimit,
  buyback,
  manaColors,
  manaSymbols,
} from "../content/catalog";
import { useEffect, useRef, useState } from "react";
import { Sun, Plus, Minus, Download, Upload } from "lucide-react";
import { sets, cards, cardById, DECK_SIZE } from "../content/catalog";
import {
  applyCommand,
  decodeSave,
  SAVE_KEY,
  type Game,
  type Command,
} from "../sim/game";
import { Tavern } from "../render/Tavern";
import { GameHud } from "./GameHud";
import { stations, duelists } from "../content/tavern";
export function App() {
  const [initial] = useState(() =>
    readLocalSave({ getItem: (key) => localStorage.getItem(key) }),
  );
  const lastRaw = useRef(initial.raw);
  const [noticesOpen, setNoticesOpen] = useState(false);
  const [saveError, setSaveError] = useState(initial.error);
  const [lastSavedAt, setLastSavedAt] = useState("");
  const [game, setGame] = useState<Game>(initial.game),
    [tab, setTab] = useState("Tavern"),
    [toast, setToast] = useState(initial.error),
    [saveBlocked, setSaveBlocked] = useState(initial.blocked),
    [saved, setSaved] = useState(false);
  const [watchBattle, setWatchBattle] = useState(
    !!initial.game.battle?.autoplay,
  );
  const [inspected, setInspected] = useState<string | null>(null);
  const inspectionRef = useRef(inspected);
  inspectionRef.current = inspected;
  const panelRef = useRef<HTMLElement>(null);
  useEffect(() => {
    panelRef.current?.scrollTo(0, 0);
  }, [tab]);
  const activeTabRef = useRef(tab);
  activeTabRef.current = tab;
  const gameRef = useRef(game);
  gameRef.current = game;
  const blockedRef = useRef(saveBlocked);
  blockedRef.current = saveBlocked;
  const persist = (replace = false) => {
    if (blockedRef.current && !replace) return false;
    try {
      lastRaw.current = writeLocalSave(
        localStorage,
        gameRef.current,
        lastRaw.current,
        replace,
      );
      setSaved(true);
      setSaveError("");
      setLastSavedAt(new Date().toLocaleTimeString());
      return true;
    } catch (e) {
      setSaved(false);
      const message =
        e instanceof SaveConflict
          ? e.message
          : "Browser storage is unavailable or full. Export your ledger now to keep your progress.";
      setSaveError(message);
      if (e instanceof SaveConflict) {
        blockedRef.current = true;
        setSaveBlocked(true);
      }
      return false;
    }
  };
  const send = (cmd: Command) => {
    if (blockedRef.current) return false;
    try {
      const next = applyCommand(gameRef.current, cmd);
      gameRef.current = next;
      setGame(next);
      if (
        !blockedRef.current &&
        !["room-step", "walk", "battle-tick"].includes(cmd.type)
      ) {
        persist();
      }
      if (cmd.type === "order")
        setToast("Order placed. The caravan arrives after 3 open-shop bells.");
      if (cmd.type === "sell")
        setToast("Spare card sold to the traveling factor.");
      return true;
    } catch (e) {
      setToast(tableWords((e as Error).message));
      return false;
    }
  };
  useEffect(() => {
    const timer = window.setInterval(() => {
      const b = gameRef.current.battle;
      if (
        activeTabRef.current === "Duel table" &&
        !inspectionRef.current &&
        !document.querySelector("dialog[open]") &&
        !document.hidden &&
        b?.result === "playing" &&
        b.timed &&
        !b.autoplay
      )
        send({ type: "battle-tick" });
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    const timer = setInterval(() => {
      if (
        !document.hidden &&
        !inspectionRef.current &&
        !document.querySelector("dialog[open]") &&
        gameRef.current.battle?.autoplay
      )
        send({ type: "auto-step" });
    }, 850);
    return () => clearInterval(timer);
  }, []);
  const startAuto = () => {
    if (gameRef.current.battle && gameRef.current.battle.result !== "playing") {
      if (!send({ type: "leave-duel" })) return;
    }
    if (!gameRef.current.battle && !send({ type: "duel" })) return;
    if (send({ type: "autoplay", enabled: true })) {
      setWatchBattle(true);
      setTab("Tavern");
    }
  };
  const takeControl = () => {
    if (gameRef.current.battle?.result === "playing")
      send({ type: "autoplay", enabled: false });
    setTab("Duel table");
  };
  useEffect(() => {
    if (saveBlocked) return;
    const id = setInterval(() => persist(), 1200);
    const checkpoint = () => {
      persist();
    };
    const storageChanged = (event: StorageEvent) => {
      if (
        (event.key === SAVE_KEY || event.key === null) &&
        event.newValue !== lastRaw.current
      )
        persist();
    };
    const visibility = () => {
      if (document.hidden) persist();
    };
    window.addEventListener("storage", storageChanged);
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pagehide", checkpoint);
    persist();
    return () => {
      clearInterval(id);
      window.removeEventListener("pagehide", checkpoint);
      window.removeEventListener("storage", storageChanged);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [saveBlocked]);
  useEffect(() => {
    const id = setInterval(() => {
      if (!document.hidden) send({ type: "tick" });
    }, 4000);
    const motion = setInterval(() => {
      const g = gameRef.current;
      if (
        !document.hidden &&
        (g.open || g.room.player.route.length || g.room.customers.length)
      )
        send({ type: "room-step" });
    }, 100);
    return () => {
      clearInterval(id);
      clearInterval(motion);
    };
  }, []);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 5500);
    return () => clearTimeout(id);
  }, [toast, saveBlocked]);
  const announced = useRef(initial.game.noticeSequence);
  useEffect(() => {
    if (game.noticeSequence > announced.current) {
      const fresh = game.notices.filter((n) => n.id > announced.current);
      const highlight =
        fresh.find((n) => n.text.startsWith("Learned ")) ??
        fresh.find((n) =>
          /delivered|is ready|Completed|Won a friendly/.test(n.text),
        );
      if (highlight) setToast(highlight.text);
    }
    announced.current = game.noticeSequence;
  }, [game.noticeSequence]);
  const [page, setPage] = useState(0),
    [filter, setFilter] = useState("all"),
    [query, setQuery] = useState(""),
    [onlyOwned, setOnlyOwned] = useState(true),
    [deckMode, setDeckMode] = useState(false),
    [rarity, setRarity] = useState("all"),
    [holdings, setHoldings] = useState("all"),
    [collectionView, setCollectionView] = useState("cards");
  const filteredCards = cards.filter(
    (c) =>
      (filter === "all" || c.setId === filter) &&
      (rarity === "all" || c.rarity === rarity) &&
      (!onlyOwned || (game.collection[c.id] ?? 0) > 0) &&
      (holdings !== "foils" || (game.foils[c.id] ?? 0) > 0) &&
      (holdings !== "illuminated" || (game.illuminated[c.id] ?? 0) > 0) &&
      (holdings !== "spares" ||
        (game.collection[c.id] ?? 0) >
          game.deck.filter((id) => id === c.id).length) &&
      `${c.name} ${c.tradition} ${c.type} ${c.color} ${c.rules} ${cardFactionLenses(
        c.id,
      )
        .map((f) => f.name)
        .join(" ")}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  useEffect(() => setPage(0), [query, filter, onlyOwned, rarity, holdings]);
  const fileInput = useRef<HTMLInputElement>(null);
  const exportSave = (original = false) => {
    const blob = new Blob(
        [
          original
            ? (initial.raw ?? JSON.stringify(game))
            : JSON.stringify(game, null, 2),
        ],
        {
          type: "application/json",
        },
      ),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = `hearth-hollow-day-${game.day}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setToast("Ledger exported. Keep it somewhere safe.");
  };
  const visit = (name: string) => {
    const station = stations.find((s) => s.tab === name);
    if (station) send({ type: "walk", destination: station.id });
    setTab(name);
  };
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (document.querySelector("dialog[open]")) return;
      if (inspectionRef.current) {
        if (e.key === "Escape") setInspected(null);
        return;
      }
      if (e.key === "Escape") {
        setTab("Tavern");
        return;
      }
      if (
        e.target instanceof HTMLElement &&
        e.target.closest("input,textarea,select")
      )
        return;
      if (e.key === "5" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        visit("Hospitality");
        e.preventDefault();
      }
      const station = stations.find((s) => s.key === e.key);
      if (station && !e.ctrlKey && !e.metaKey) {
        visit(station.tab);
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  return (
    <CardInspectContext.Provider value={setInspected}>
      <div className="game-shell">
        <div className="tavern-interface" inert={inspected !== null}>
          <Tavern
            game={game}
            onAutoplay={startAuto}
            onVisit={visit}
            onMove={(destination) => send({ type: "walk", destination })}
            blocked={tab !== "Tavern"}
          />
          {game.battle &&
            tab === "Tavern" &&
            (watchBattle || game.battle.autoplay) && (
              <AutoBattle
                progression={game.progression}
                battle={game.battle}
                onOpen={takeControl}
                onToggle={() =>
                  send({ type: "autoplay", enabled: !game.battle!.autoplay })
                }
                onClose={() => {
                  if (game.battle?.result === "playing")
                    send({ type: "autoplay", enabled: false });
                  setWatchBattle(false);
                }}
              />
            )}
          <GameHud
            game={game}
            tab={tab}
            onVisit={visit}
            onToggle={() => send({ type: "toggle" })}
            onAuto={() =>
              send({ type: "auto-shop", enabled: !game.hospitality.auto })
            }
            saved={saved && !saveBlocked}
            unread={game.notices.filter((n) => !n.read).length}
            onNotices={() => setNoticesOpen(true)}
          />
          {tab !== "Tavern" && (
            <div
              className="panel-dismiss-zone"
              onClick={() => setTab("Tavern")}
            />
          )}
          {tab === "Tavern" && (
            <KeeperJourney compact game={game} send={send} visit={setTab} />
          )}
          <main
            ref={panelRef}
            className={`game-panel station-${tab.toLowerCase().replaceAll(" ", "-")}`}
            hidden={tab === "Tavern"}
            role="dialog"
            aria-label={tab}
          >
            <button
              className="close-game-panel"
              aria-label="Return to tavern"
              onClick={() => setTab("Tavern")}
            >
              × <span>ESC</span>
            </button>

            <div className="tome-ornaments" aria-hidden="true">
              <i />
              <i />
            </div>
            <div className="page-heading">
              <div>
                <div className="eyebrow">
                  {tab === "Tavern"
                    ? "A LITTLE COMMERCE. A LITTLE MAGIC."
                    : tab === "Duel table"
                      ? "A FRIENDLY RIVAL. A FRESH HAND."
                      : "STORIES WORTH KEEPING."}
                </div>
                <h1>
                  {{
                    Stockroom: "The stock ledger",
                    "Card collection": "Erilian’s grimoire",
                    "Booster packs": "The sealed stories",
                    "Duel table": "A hand by the hearth",
                    Chronicle: "The keeper’s chronicle",
                    Hospitality: "Hearth, kitchen & cellar",
                  }[tab] ?? tab}
                </h1>
                <p>
                  {tab === "Tavern"
                    ? "The kettle is warm. The shelves are full of stories. Let’s see who wanders in."
                    : tab === "Stockroom"
                      ? "A well-kept shelf is a promise to the next traveler."
                      : tab === "Card collection"
                        ? "Every card holds a little piece of the world before—and the world to come."
                        : tab === "Booster packs"
                          ? "Break a seal. Discover a story from the Book of Broken Roads."
                          : tab === "Duel table"
                            ? "No stakes but a story. Win a friendly duel for 35 crowns and 5 renown."
                            : "An honest record of a small life beside the Sallow."}
                </p>
              </div>
              <div className="day-chip">
                <Sun size={21} />
                <div>
                  <strong>
                    Day {game.day} ·{" "}
                    {game.tick % 24 < 12 ? "Morning" : "Afternoon"}
                  </strong>
                  <small>
                    {game.open ? "The doors are open" : "The hearth is yours"}
                  </small>
                </div>
              </div>
            </div>
            {saveBlocked && (
              <div className="notice">
                {saveError}
                <button
                  onClick={() => {
                    if (
                      !window.confirm(
                        "Replace the browser ledger with this session? Export a backup first if you need the existing progress.",
                      )
                    )
                      return;
                    if (persist(true)) {
                      blockedRef.current = false;
                      setSaveBlocked(false);
                      setToast("This ledger is now saved.");
                    }
                  }}
                >
                  Save this session instead
                </button>
              </div>
            )}
            {tab === "Stockroom" && (
              <InventoryLedger
                game={game}
                send={send}
                onPacks={() => visit("Booster packs")}
              />
            )}
            {tab === "Card collection" && (
              <>
                <div
                  className="collection-view-tabs"
                  aria-label="Grimoire sections"
                >
                  <button
                    aria-pressed={collectionView === "cards"}
                    className={collectionView === "cards" ? "selected" : ""}
                    onClick={() => setCollectionView("cards")}
                  >
                    Card binder
                  </button>
                  <button
                    aria-pressed={collectionView === "sets"}
                    className={collectionView === "sets" ? "selected" : ""}
                    onClick={() => setCollectionView("sets")}
                  >
                    Set histories
                  </button>
                  <span>
                    {Object.values(game.collection).filter((n) => n > 0).length}{" "}
                    stories ·{" "}
                    {Object.values(game.foils).reduce((n, v) => n + v, 0)} foils
                  </span>
                </div>
                {collectionView === "sets" ? (
                  <SetLibrary
                    collection={game.collection}
                    initialSet={filter === "all" ? "rekindled" : filter}
                    onBrowse={(id) => {
                      setFilter(id);
                      setCollectionView("cards");
                      setHoldings("all");
                      setOnlyOwned(false);
                      setRarity("all");
                      setQuery("");
                      requestAnimationFrame(() =>
                        document
                          .querySelector(".collection-toolbar")
                          ?.scrollIntoView({ block: "start" }),
                      );
                    }}
                  />
                ) : (
                  <>
                    <div className="collection-toolbar">
                      <input
                        aria-label="Search cards"
                        placeholder="Search names, traditions, types…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                      <select
                        aria-label="Filter expansion"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                      >
                        <option value="all">All eight expansions</option>
                        {sets.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                      <select
                        aria-label="Filter rarity"
                        value={rarity}
                        onChange={(e) => setRarity(e.target.value)}
                      >
                        <option value="all">All rarities</option>
                        {["common", "uncommon", "rare", "mythic"].map((r) => (
                          <option key={r} value={r}>
                            {r[0].toUpperCase() + r.slice(1)}
                          </option>
                        ))}
                      </select>
                      <select
                        aria-label="Card holdings"
                        value={holdings}
                        onChange={(e) => setHoldings(e.target.value)}
                      >
                        <option value="all">All copies</option>
                        <option value="spares">Spare copies</option>
                        <option value="foils">Foil collection</option>
                        <option value="illuminated">
                          Illuminated editions
                        </option>
                      </select>
                      <label>
                        <input
                          type="checkbox"
                          checked={onlyOwned}
                          onChange={(e) => setOnlyOwned(e.target.checked)}
                        />{" "}
                        Owned only
                      </label>
                      <button
                        className={deckMode ? "primary" : ""}
                        onClick={() => setDeckMode(!deckMode)}
                      >
                        {deckMode
                          ? "Finish deck editing"
                          : `Build deck · ${game.deck.length}/${DECK_SIZE}`}
                      </button>
                    </div>
                    {deckMode && (
                      <div className="notice">
                        100 cards per deck. Up to 4 copies; unlimited basic
                        resources. Aim for 38–42 resources. The three starter
                        recipes are included in your collection.
                      </div>
                    )}
                    {deckMode && (
                      <section className="deck-summary paper-panel">
                        <h2>Your grimoire · {game.deck.length}/100</h2>
                        <p>
                          {
                            game.deck.filter((id) => isResource(cardById[id]))
                              .length
                          }{" "}
                          resources ·{" "}
                          {
                            game.deck.filter(
                              (id) => cardById[id].type === "Creature",
                            ).length
                          }{" "}
                          creatures ·{" "}
                          {
                            game.deck.filter(
                              (id) => cardById[id].type === "Hero",
                            ).length
                          }{" "}
                          Heroes
                        </p>
                        <div className="mana-line">
                          {manaColors.map((color) => (
                            <span key={color}>
                              {manaSymbols[color]}{" "}
                              {
                                game.deck.filter((id) =>
                                  cardById[id].produces.includes(color),
                                ).length
                              }{" "}
                              sources
                            </span>
                          ))}
                        </div>
                        <div
                          className="mana-curve"
                          aria-label="Deck mana curve"
                        >
                          {[1, 2, 3, 4, 5, 6].map((n) => (
                            <span key={n}>
                              <b>
                                {
                                  game.deck.filter(
                                    (id) =>
                                      !isResource(cardById[id]) &&
                                      (n === 6
                                        ? cardById[id].cost >= 6
                                        : cardById[id].cost === n),
                                  ).length
                                }
                              </b>
                              <small>{n === 6 ? "6+" : n} mana</small>
                            </span>
                          ))}
                        </div>
                        <DeckShelf game={game} send={send} />
                        <div className="deck-recipes">
                          {presets.map((p) => (
                            <button
                              key={p.id}
                              title={p.plan}
                              disabled={
                                !recipeUnlocked(game, p.id) ||
                                missingDeckCopies(game.collection, p.id) > 0
                              }
                              onClick={() =>
                                send({ type: "preset", preset: p.id })
                              }
                            >
                              {p.name}
                              <small>{p.plan}</small>
                              <small>
                                {!recipeUnlocked(game, p.id)
                                  ? `Defeat ${duelists.find((d) => d.deck === p.id)?.name ?? "its guest"} to learn this recipe`
                                  : missingDeckCopies(game.collection, p.id)
                                    ? `${missingDeckCopies(game.collection, p.id)} missing copies`
                                    : "Ready to prepare"}
                              </small>
                            </button>
                          ))}
                        </div>
                      </section>
                    )}
                    <div className="collection-pagination">
                      <span>
                        {filteredCards.length} cards · page {page + 1} of{" "}
                        {Math.max(1, Math.ceil(filteredCards.length / 80))}
                      </span>
                      <button
                        disabled={page === 0}
                        onClick={() => setPage(page - 1)}
                      >
                        Previous cards
                      </button>
                      <button
                        disabled={(page + 1) * 80 >= filteredCards.length}
                        onClick={() => setPage(page + 1)}
                      >
                        More cards
                      </button>
                    </div>
                    <div className="card-grid">
                      {filteredCards
                        .slice(page * 80, (page + 1) * 80)
                        .map((c) => {
                          const n = game.collection[c.id] ?? 0,
                            d = game.deck.filter((id) => id === c.id).length;
                          return (
                            <CardView
                              key={c.id}
                              card={c}
                              hidden={!n}
                              illuminated={(game.illuminated[c.id] ?? 0) > 0}
                              foil={
                                !(game.illuminated[c.id] ?? 0) &&
                                (game.foils[c.id] ?? 0) > 0
                              }
                            >
                              <div className="card-actions">
                                <small>
                                  {n} owned · {d} in deck ·{" "}
                                  {game.foils[c.id] ?? 0} foil ·{" "}
                                  {game.illuminated[c.id] ?? 0} illuminated
                                </small>
                                {deckMode ? (
                                  <div>
                                    <button
                                      aria-label={`Remove ${c.name}`}
                                      disabled={!d}
                                      onClick={() =>
                                        send({
                                          type: "deck",
                                          cardId: c.id,
                                          add: false,
                                        })
                                      }
                                    >
                                      <Minus size={14} />
                                    </button>
                                    <button
                                      aria-label={`Add ${c.name}`}
                                      disabled={
                                        d >= n ||
                                        d >= copyLimit(c) ||
                                        game.deck.length >= 100
                                      }
                                      onClick={() =>
                                        send({
                                          type: "deck",
                                          cardId: c.id,
                                          add: true,
                                        })
                                      }
                                    >
                                      <Plus size={14} />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    disabled={n <= d}
                                    onClick={() =>
                                      send({ type: "sell", cardId: c.id })
                                    }
                                  >
                                    Sell spare · {buyback(c)}c
                                  </button>
                                )}
                              </div>
                            </CardView>
                          );
                        })}
                    </div>
                  </>
                )}
              </>
            )}
            {tab === "Booster packs" && (
              <PackTable
                game={game}
                send={send}
                onCollection={() => visit("Card collection")}
              />
            )}
            {tab === "Hospitality" && <Hospitality game={game} send={send} />}
            {tab === "Duel table" && (
              <BattleTable game={game} send={send} onAutoplay={startAuto} />
            )}
            {tab === "Chronicle" && (
              <>
                <Progression game={game} send={send} />
                <KeeperJourney game={game} send={send} visit={setTab} />
              </>
            )}
            {tab === "Chronicle" && (
              <div className="chronicle-grid">
                <section className="paper-panel">
                  <div className="eyebrow">THE HONEST LEDGER</div>
                  <h2>Life beside the Sallow</h2>
                  <div className="journal">
                    {game.journal.map((msg, i) => (
                      <p key={i}>
                        <span>✧</span>
                        {msg}
                      </p>
                    ))}
                  </div>
                </section>
                <aside>
                  <section className="paper-panel">
                    <h2>Keep your record</h2>
                    <p>
                      Your ledger saves in this browser after every action.
                      Export a copy to carry it to another browser.
                    </p>
                    <p role="status">
                      {saved && !saveBlocked
                        ? `Saved on this device · ${lastSavedAt}`
                        : "Progress is not being saved"}
                    </p>
                    <p>
                      Keep using this browser and site address. Clearing site
                      data removes local saves. Export before switching devices.
                    </p>
                    <button
                      disabled={saveBlocked}
                      onClick={() => {
                        if (persist()) setToast("Local ledger saved.");
                      }}
                    >
                      Save now
                    </button>
                    <button onClick={() => exportSave()}>
                      <Download size={16} /> Export ledger
                    </button>
                    {initial.blocked && initial.raw && (
                      <button onClick={() => exportSave(true)}>
                        Export unreadable original
                      </button>
                    )}
                    <button onClick={() => fileInput.current?.click()}>
                      <Upload size={16} /> Import ledger
                    </button>
                    <input
                      type="file"
                      accept="application/json,.json"
                      hidden
                      ref={fileInput}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          if (file.size > 1_000_000)
                            throw Error("Save is too large.");
                          const next = decodeSave(await file.text());
                          if (
                            !window.confirm(
                              "Import this ledger and replace the current session? Export your current progress first if you want to keep it.",
                            )
                          ) {
                            e.target.value = "";
                            return;
                          }
                          gameRef.current = next;
                          setGame(next);
                          blockedRef.current = false;
                          setSaveBlocked(false);
                          if (persist(true))
                            setToast("Ledger restored. Welcome home.");
                        } catch {
                          setToast(
                            "This ledger is invalid or from an unsupported version. Your current game is unchanged.",
                          );
                        }
                        e.target.value = "";
                      }}
                    />
                  </section>
                  <section className="paper-panel lore-note">
                    <div className="eyebrow">A WORLD SHARED WITH THEANDRIL</div>
                    <h2>The light at Grey Weir</h2>
                    <p>
                      In RR 2447, wagons cross the Sallow again. Ilthen Vael
                      keeps his record in the tower. A little downstream, your
                      tavern gives travelers somewhere to trade stories—and the
                      cards that carry them.
                    </p>
                    <p>
                      The historical eras and traditions come from{" "}
                      <em>The Book of Broken Roads</em>. Theandril: Hearth &
                      Card, its tavern regulars, and the card game are new
                      additions to that world.
                    </p>
                    <small>Kept beside the Sallow · RR 2447</small>
                  </section>
                </aside>
              </div>
            )}
          </main>

          {saveError && (
            <div className="save-warning" role="alert">
              {saveError}
              <button onClick={() => visit("Chronicle")}>
                Open save controls
              </button>
            </div>
          )}
          {noticesOpen && (
            <Notifications
              game={game}
              close={() => setNoticesOpen(false)}
              read={() => send({ type: "read-notices" })}
            />
          )}
          {toast && (
            <div className="toast" role="status" onClick={() => setToast("")}>
              {toast}
              <button aria-label="Dismiss notification">×</button>
            </div>
          )}
        </div>
        {inspected && (
          <CardDetail
            id={inspected}
            game={game}
            onClose={() => setInspected(null)}
          />
        )}
      </div>
    </CardInspectContext.Provider>
  );
}
