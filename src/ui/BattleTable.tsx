import { assetUrl } from "../content/artwork";
import { createPortal } from "react-dom";
import { tableWords, skillGuide } from "../content/wording";
import { missingDeckCopies } from "../sim/battle";
import { useEffect, useRef, useState } from "react";
import {
  cardById,
  isResource,
  manaColors,
  manaNames,
  manaSymbols,
  type Card,
} from "../content/catalog";
import {
  combatForecast,
  affordable,
  canBlock,
  validateTarget,
  availableResources,
  canAttack,
  creatures,
  heroes,
  resources,
  presets,
  stats,
  type Owner,
  type Target,
  type Permanent,
} from "../sim/battle";
import type { Command, Game } from "../sim/game";
import { CardView, CardArt } from "./CardView";
import { useCardInspect } from "./CardInspectContext";
import { duelists } from "../content/tavern";
import type { PointerEvent, CSSProperties } from "react";
export function BattleTable({
  game,
  send,
  onAutoplay,
}: {
  game: Game;
  send: (cmd: Command) => boolean;
  onAutoplay: () => void;
}) {
  const b = game.battle;
  const [preview, setPreview] = useState<{ id: string; x: number } | null>(
    null,
  );
  const inspect = useCardInspect();
  const [dragged, setDragged] = useState<{ index: number; id: string } | null>(
    null,
  );
  const [blocker, setBlocker] = useState<number | null>(null);
  const [pending, setPending] = useState<{
    index: number;
    id: string;
    destination?: string;
    hero?: number;
    ability?: number;
  } | null>(null);
  useEffect(() => {
    setAttackers([]);
    setAttackHero("");
    setBlocker(null);
    setPending(null);
    setFeedback("");
  }, [b?.turn, b?.phase, b?.result, b?.autoplay]);
  const [feedback, setFeedback] = useState("");
  const touch = useRef<{
    index: number;
    id: string;
    x: number;
    y: number;
    moved: boolean;
  } | null>(null);
  const [target, setTarget] = useState("enemy:hearth"),
    [attackers, setAttackers] = useState<number[]>([]),
    [attackHero, setAttackHero] = useState(""),
    [opponent, setOpponent] = useState("sailor");
  const targetValue = (value = target): Target => {
    const [side, kind, uid] = value.split(":");
    return {
      side: side as Owner,
      kind: kind as Target["kind"],
      ...(uid ? { uid: Number(uid) } : {}),
    };
  };
  if (!b)
    return (
      <section className="duel-welcome paper-panel">
        <img
          className="duel-portrait"
          src={assetUrl(
            `/art/animation/${duelists.find((p) => p.id === opponent)?.art ?? "customer.sailor"}-idle.png`,
          )}
          alt="A traveler at the card table"
        />
        <div className="eyebrow">A FRIENDLY GAME OF BROKEN ROADS</div>
        <h2>“A hundred stories. What will yours become?”</h2>
        <div className="duel-rules">
          <p>
            <strong>100 cards · 20 health.</strong> Play one resource each turn.
            Exhaust resources for colored mana; cards show generic cost plus
            colored pips. Creatures rest until your next turn unless they have
            Quickstep.
          </p>
          <p>
            <strong>Keep your options open.</strong> Cast instants in response,
            declare attackers, assign blockers, and protect your Heroes. The
            stack resolves last in, first out. An empty library loses on the
            next draw.
          </p>
          <p>
            Choose a target before casting a targeted spell or using a Hero
            ability. Sources are exhausted automatically when needed; you can
            also exhaust sources yourself. One free opening redraw. End-of-turn
            excess cards are discarded from the right of your hand.
          </p>
        </div>
        <label>
          Your prepared recipe{" "}
          <select
            aria-label="Prepared recipe"
            defaultValue=""
            onChange={(e) =>
              e.target.value && send({ type: "preset", preset: e.target.value })
            }
          >
            <option value="">Current custom deck</option>
            {presets.map((p) => (
              <option
                key={p.id}
                value={p.id}
                disabled={missingDeckCopies(game.collection, p.id) > 0}
              >
                {p.name}
                {missingDeckCopies(game.collection, p.id)
                  ? ` · ${missingDeckCopies(game.collection, p.id)} missing copies`
                  : " · available"}
              </option>
            ))}
          </select>
        </label>
        <details>
          <summary>Skills at the table</summary>
          <p>{skillGuide}</p>
        </details>
        <label>
          Opponent’s strategy{" "}
          <select
            aria-label="Opponent strategy"
            value={opponent}
            onChange={(e) => setOpponent(e.target.value)}
          >
            {duelists.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {presets.find((d) => d.id === p.deck)!.name}
              </option>
            ))}
          </select>
        </label>
        <p className="opponent-plan">
          {duelists.find((p) => p.id === opponent)?.role} ·{" "}
          {duelists.find((p) => p.id === opponent)?.manner}
          <br />
          {
            presets.find(
              (p) => p.id === duelists.find((d) => d.id === opponent)?.deck,
            )?.plan
          }
        </p>
        <button
          className="primary"
          disabled={game.deck.length !== 100}
          onClick={() => send({ type: "duel", opponent })}
        >
          Sit down & shuffle
        </button>
        <button
          disabled={game.deck.length !== 100}
          onClick={() => {
            if (send({ type: "duel", opponent })) onAutoplay();
          }}
        >
          Shuffle & autoplay
        </button>
        <p className="clock-help">
          Each decision window lasts 60 seconds. The hourglass pauses while
          reading cards or away from the table. Choose Pause clock for untimed
          play; expiry passes priority without spending a card.
        </p>
        <small>Your deck: {game.deck.length} / 100 cards · No entry fee</small>
      </section>
    );
  const playing = b.result === "playing",
    main =
      b.active === "player" &&
      ["main", "second-main"].includes(b.phase) &&
      !b.stack.length;
  function unavailable(c: Card) {
    if (b?.autoplay) return "Take control to play a card.";
    if (!playing) return "The duel has ended.";
    if (isResource(c) && b!.player.landDrops >= 1)
      return "Resource already played this turn.";
    if (c.type !== "Instant" && !main)
      return "Wait for your main phase and an empty stack.";
    if (!affordable(b!.player, c))
      return `Needs ${c.cost} mana, including ${c.colored} ${manaNames[c.color]}.`;
    const targetedEffects = [
      "damage",
      "destroy",
      "bounce",
      "pump",
      "counter",
      "bind",
      "renew",
    ];
    if (
      targetedEffects.includes(c.effect) &&
      (c.type === "Instant" || c.type === "Sorcery")
    ) {
      const targets: Target[] = [
        { side: "enemy", kind: "hearth" },
        { side: "player", kind: "hearth" },
        ...(["player", "enemy"] as const).flatMap((side) =>
          b![side].board.map((p) => ({
            side,
            kind:
              cardById[p.cardId].type === "Hero"
                ? ("hero" as const)
                : ("creature" as const),
            uid: p.uid,
          })),
        ),
        ...b!.stack.map((p) => ({
          side: p.owner,
          kind: "stack" as const,
          uid: p.uid,
        })),
      ];
      if (!targets.some((t) => validateTarget(b!, c.effect, t)))
        return "No legal target on the table.";
    }
    return "";
  }
  function canPlay(c: Card) {
    return !unavailable(c);
  }
  const forecast = combatForecast(b);
  function play(index: number, id: string, destination = target) {
    if (!b || b.player.hand[index] !== id || !canPlay(cardById[id])) {
      setFeedback(
        "That card cannot be played in this window. Inspect it for its cost and rules.",
      );
      return;
    }
    if (
      targeted(cardById[id]) &&
      !validateTarget(b, cardById[id].effect, targetValue(destination))
    ) {
      setFeedback(
        "Choose a highlighted legal target. Your card and mana stay in hand.",
      );
      return;
    }
    if (isResource(cardById[id])) {
      send({ type: "play", index, expectedCardId: id });
      return;
    }
    setPending({ index, id, destination });
    setTarget(destination);
    setFeedback("Target selected. Confirm to cast, or choose another target.");
  }
  function confirmCast() {
    if (!pending || !b) return;
    const effect =
      pending.hero !== undefined
        ? cardById[pending.id].abilities[pending.ability!].effect
        : cardById[pending.id].effect;
    const t = pending.destination ? targetValue(pending.destination) : null;
    if (!validateTarget(b, effect, t)) return;
    if (
      pending.hero === undefined &&
      (b.player.hand[pending.index] !== pending.id ||
        !canPlay(cardById[pending.id]))
    ) {
      setPending(null);
      return;
    }
    const ok = send(
      pending.hero !== undefined
        ? {
            type: "hero",
            uid: pending.hero,
            ability: pending.ability!,
            target: t ?? undefined,
          }
        : {
            type: "play",
            index: pending.index,
            expectedCardId: pending.id,
            target: t ?? undefined,
          },
    );
    if (ok) {
      setPending(null);
      setFeedback("Spell committed · respond or resolve the stack.");
    }
  }
  const heldEffect = (held: { id: string; hero?: number; ability?: number }) =>
    held.hero !== undefined
      ? cardById[held.id].abilities[held.ability!].effect
      : cardById[held.id].effect;

  const targeted = (c: Card) =>
    [
      "damage",
      "destroy",
      "bounce",
      "pump",
      "counter",
      "bind",
      "renew",
    ].includes(c.effect);
  function targetName(value: string) {
    const t = targetValue(value);
    if (t.kind === "hearth")
      return t.side === "player" ? "Your hearth" : "Opposing hearth";
    const p =
      t.kind === "stack"
        ? b!.stack.find((p) => p.uid === t.uid)
        : b![t.side].board.find((p) => p.uid === t.uid);
    return p ? cardById[p.cardId].name : "Target left the table";
  }
  function selectTarget(destination: string) {
    setTarget(destination);
    if (pending) {
      if (validateTarget(b!, heldEffect(pending), targetValue(destination))) {
        setPending({ ...pending, destination });
        setFeedback("Target selected. Confirm to cast.");
      } else setFeedback("That is not a legal target for this effect.");
      return;
    }
    if (b?.active === "player" && b.phase === "attack") {
      const t = targetValue(destination);
      if (t.side === "enemy" && ["hero", "hearth"].includes(t.kind))
        setAttackHero(t.kind === "hero" ? String(t.uid) : "");
    }
  }
  function selectPermanent(p: Permanent, owner: Owner) {
    const c = cardById[p.cardId];
    if (pending)
      return selectTarget(
        `${owner}:${c.type === "Hero" ? "hero" : "creature"}:${p.uid}`,
      );
    if (
      playing &&
      b?.phase === "attack" &&
      b.active === "player" &&
      owner === "player" &&
      c.type === "Creature"
    ) {
      if (canAttack(b, p))
        setAttackers((a) =>
          a.includes(p.uid) ? a.filter((x) => x !== p.uid) : [...a, p.uid],
        );
      else setFeedback("This companion cannot attack yet.");
      return;
    }
    if (
      playing &&
      b?.phase === "block" &&
      b.active === "enemy" &&
      !b.stack.length
    ) {
      if (owner === "player" && c.type === "Creature" && !p.tapped) {
        setBlocker(blocker === p.uid ? null : p.uid);
        setFeedback(
          "Choose an opposing attacker to intercept. Choose an assigned attacker again to release the block.",
        );
        return;
      }
      if (owner === "enemy" && b.combat.some((a) => a.uid === p.uid)) {
        if (send({ type: "block", attacker: p.uid, blocker })) {
          setBlocker(null);
          setFeedback("Block assignment updated.");
        }
        return;
      }
    }
    if (c.type === "Hero" && owner === "enemy" && b?.phase === "attack")
      return selectTarget(`enemy:hero:${p.uid}`);
    if (["Creature", "Hero"].includes(c.type))
      selectTarget(
        `${owner}:${c.type === "Hero" ? "hero" : "creature"}:${p.uid}`,
      );
    else inspect?.(c.id);
  }
  function legalDestination(value: string) {
    const held = dragged ?? pending;
    return (
      !!held &&
      [
        "damage",
        "destroy",
        "bounce",
        "pump",
        "counter",
        "bind",
        "renew",
      ].includes(heldEffect(held)) &&
      validateTarget(b!, heldEffect(held), targetValue(value))
    );
  }
  function dropAt(element: Element | null, held = dragged) {
    const zone = element?.closest<HTMLElement>("[data-battle-drop]");
    if (held && zone)
      if (!zone.dataset.battleDrop && targeted(cardById[held.id]))
        setFeedback("Drop this spell directly onto a highlighted target.");
      else play(held.index, held.id, zone.dataset.battleDrop || target);
    else if (held) setFeedback("Card returned to your hand.");
    setDragged(null);
  }
  function finishTouch(e: PointerEvent<HTMLButtonElement>) {
    const held = touch.current;
    if (held?.moved)
      dropAt(document.elementFromPoint(e.clientX, e.clientY), held);
    touch.current = null;
    setDragged(null);
  }
  function permanent(p: Permanent, owner: Owner) {
    const c = cardById[p.cardId],
      s = b![owner],
      st = stats(s, p),
      selected =
        attackers.includes(p.uid) ||
        blocker === p.uid ||
        pending?.destination ===
          `${owner}:${c.type === "Hero" ? "hero" : "creature"}:${p.uid}`,
      destination = `${owner}:${c.type === "Hero" ? "hero" : "creature"}:${p.uid}`,
      assignment = b!.combat.find((a) =>
        owner === b!.active ? a.uid === p.uid : a.blocker === p.uid,
      ),
      chosenBlocker = b!.player.board.find((x) => x.uid === blocker),
      canIntercept =
        owner === "enemy" &&
        !!assignment &&
        !!chosenBlocker &&
        canBlock(b!, p, chosenBlocker) &&
        !b!.combat.some((a) => a.uid !== p.uid && a.blocker === blocker),
      source = isResource(c) || c.permanentEffect === "mana-rock";
    return (
      <article
        key={p.uid}
        className={`battle-permanent ${c.rarity} ${p.tapped ? "tapped" : ""} ${selected ? "selected" : ""} ${owner === "enemy" && b!.phase === "attack" && attackHero === String(p.uid) ? "attack-destination" : ""} ${legalDestination(destination) || canIntercept ? "legal-target" : ""} ${assignment ? "in-combat" : ""}`}
        onClick={(e) => {
          if (!(e.target as Element).closest("button"))
            selectPermanent(p, owner);
        }}
        onMouseEnter={(e) =>
          setPreview({ id: c.id, x: e.currentTarget.getBoundingClientRect().x })
        }
        onMouseLeave={() => setPreview(null)}
        onFocus={(e) =>
          setPreview({ id: c.id, x: e.currentTarget.getBoundingClientRect().x })
        }
        onBlur={() => setPreview(null)}
        data-battle-drop={
          c.type === "Creature" || c.type === "Hero"
            ? `${owner}:${c.type === "Hero" ? "hero" : "creature"}:${p.uid}`
            : undefined
        }
      >
        <button
          className="permanent-art"
          aria-label={`Select battlefield ${c.name}`}
          onClick={() => selectPermanent(p, owner)}
          onDoubleClick={() => inspect?.(c.id)}
          aria-keyshortcuts="I"
          onKeyDown={(e) => {
            if (e.key.toLowerCase() === "i") {
              e.preventDefault();
              inspect?.(c.id);
            }
          }}
        >
          <CardArt card={c} />
        </button>
        <strong>{c.name}</strong>
        {p.bound ? (
          <span className="binding-badge" title="Skips its next ready step">
            Bound
          </span>
        ) : null}
        {assignment && (
          <span className="combat-link">{`Clash ${b!.combat.indexOf(assignment) + 1} · ${assignment.blocker ? "blocked" : "open"}`}</span>
        )}
        <small>
          {c.type} · {c.rarity}
        </small>
        <p>
          {c.type === "Creature"
            ? `${st.power} / ${st.toughness - p.damage} · ${c.keywords.map((k) => tableWords(k)).join(", ")}`
            : c.type === "Hero"
              ? `${p.loyalty} devotion`
              : source
                ? `${(isResource(c) ? c.produces : [c.color]).map((x) => manaSymbols[x]).join(" / ")} mana`
                : tableWords(c.rules)}
        </p>
        <small>
          {p.bound
            ? "Bound · skips next ready step"
            : p.tapped
              ? "Exhausted"
              : c.type === "Creature" && !canAttack(b!, p)
                ? "Arrival fatigue"
                : "Ready"}
          {p.counters ? ` · ${p.counters} counters` : ""}
        </small>
        {owner === "player" &&
          source &&
          (isResource(c) ? c.produces : [c.color]).map((color) => (
            <button
              key={color}
              disabled={!playing || p.tapped}
              onClick={() => send({ type: "tap", uid: p.uid, color })}
            >
              Exhaust {manaSymbols[color]}
            </button>
          ))}
        {owner === "player" &&
          c.type === "Hero" &&
          c.abilities.map((a, i) => (
            <button
              key={i}
              className="hero-action"
              aria-label={tableWords(a.text)}
              title={tableWords(a.text)}
              disabled={
                !playing ||
                !main ||
                p.used === b!.turn ||
                p.loyalty + a.loyalty < 0
              }
              onClick={() =>
                setPending({
                  index: -1,
                  id: c.id,
                  hero: p.uid,
                  ability: i,
                  ...(validateTarget(b!, a.effect, null)
                    ? { destination: target }
                    : {}),
                })
              }
            >
              {a.loyalty > 0 ? "+" : ""}
              {a.loyalty}
            </button>
          ))}
      </article>
    );
  }
  function side(owner: Owner) {
    const s = b![owner],
      availability = availableResources(s);
    return (
      <section
        className={"battle-side " + owner}
        data-battle-drop={owner === "player" ? "" : undefined}
      >
        <div className="hearth-status">
          <img
            className="hearth-portrait"
            src={assetUrl(
              `/art/animation/${owner === "player" ? "player.erilian" : (duelists.find((p) => b!.opponent.startsWith(p.name))?.art ?? "customer.herbalist")}-idle.png`,
            )}
            alt={
              owner === "player"
                ? "Erilian, your lich shopkeeper"
                : "Your tavern opponent"
            }
          />
          <strong>
            {owner === "player" ? "Erilian’s hearth" : b!.opponent}
          </strong>
          <button
            className={`hearth-life ${owner === "enemy" && b!.phase === "attack" && !attackHero ? "attack-destination" : ""} ${legalDestination(`${owner}:hearth`) ? "legal-target" : ""}`}
            data-battle-drop={`${owner}:hearth`}
            aria-label={`${owner === "player" ? "Your" : "Opponent"} hearth, ${s.hp} life; select target`}
            onClick={() => selectTarget(`${owner}:hearth`)}
          >
            <span className="health-change" key={s.hp}>
              ♥ {s.hp}
            </span>
          </button>
          <span>{s.shield} shield</span>
          <small className="library-count">
            <span className="library-back" aria-hidden="true">
              ✦
            </span>
            {s.draw.length} library · {s.hand.length} hand · {s.grave.length}{" "}
            graveyard
          </small>
        </div>
        <div className="mana-line">
          {owner === "player" &&
            manaColors.map((c) => (
              <span key={c} className={"mana-" + c} title={manaNames[c]}>
                {manaSymbols[c]} {s.mana[c]} floating
              </span>
            ))}
          <small>
            {
              s.board.filter(
                (p) =>
                  !p.tapped &&
                  (isResource(cardById[p.cardId]) ||
                    cardById[p.cardId].permanentEffect === "mana-rock"),
              ).length
            }{" "}
            ready mana sources · {s.landDrops}/1 resource played
          </small>
        </div>
        <div
          className="battle-board"
          style={
            {
              "--count": Math.max(
                1,
                s.board.filter((p) => !isResource(cardById[p.cardId])).length,
              ),
            } as CSSProperties
          }
        >
          {s.board
            .filter((p) => !isResource(cardById[p.cardId]))
            .map((p) => permanent(p, owner))}
          {!s.board.length && (
            <p className="empty-board">
              A quiet table, waiting for its first story.
            </p>
          )}
        </div>
        <details className="resource-row" open>
          <summary>
            {resources(s).length} resources · {availability.total} available
            <span
              className="resource-counters"
              aria-label={`${owner} available resources`}
            >
              {manaColors.map((color) => (
                <span
                  key={color}
                  className={`mana-${color}`}
                  aria-label={`${manaNames[color]}: ${availability.colors[color]} available`}
                  title={`${manaNames[color]}: ready sources plus floating mana`}
                >
                  {manaSymbols[color]} {availability.colors[color]}
                </span>
              ))}
              {availability.flexible > 0 && (
                <small title="Each flexible source can supply one of its colors, not all simultaneously">
                  {" "}
                  · {availability.flexible} flexible
                </small>
              )}
            </span>
          </summary>
          <div
            className="resource-grid"
            style={
              { "--count": Math.max(1, resources(s).length) } as CSSProperties
            }
          >
            {resources(s).map((p) => permanent(p, owner))}
          </div>
        </details>
        <details className="fallen-cards">
          <summary>Fallen ({s.grave.length})</summary>
          <div>
            {s.grave.length ? (
              s.grave.map((id, i) => (
                <button key={`${id}-${i}`} onClick={() => inspect?.(id)}>
                  {cardById[id].name}
                </button>
              ))
            ) : (
              <p>No fallen cards.</p>
            )}
          </div>
        </details>
      </section>
    );
  }
  return (
    <section
      className={`duel arena ${dragged ? "dragging-card" : ""}`}
      onDragOver={(e) => {
        if (dragged && (e.target as Element).closest("[data-battle-drop]")) {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        dropAt(e.target as Element);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape" && (dragged || pending || blocker !== null)) {
          e.stopPropagation();
          setDragged(null);
          setPending(null);
          setBlocker(null);
          touch.current = null;
        }
      }}
    >
      {preview &&
        !dragged &&
        createPortal(
          <aside
            className="card-hover-preview"
            aria-label="Card preview"
            style={{
              left: preview.x > window.innerWidth / 2 ? 12 : undefined,
              right: preview.x <= window.innerWidth / 2 ? 12 : undefined,
            }}
          >
            <CardView card={cardById[preview.id]} />
          </aside>,
          document.body,
        )}
      {pending && (
        <div className="casting-ribbon" role="status">
          <img src={assetUrl(`/art/cards/${pending.id}.png`)} alt="" />
          <span>
            <b>{cardById[pending.id].name}</b>
            <small>
              {pending.destination
                ? `→ ${targetName(pending.destination)}`
                : "Choose a highlighted target"}
            </small>
          </span>
          <button onClick={() => setPending(null)}>Cancel targeting</button>
        </div>
      )}
      <div className="arena-guidance" role="status">
        <span className="phase-track" aria-label="Battle stages">
          {[
            ["main", "Prepare"],
            ["attack", "Attack"],
            ["block", "Defend"],
            ["second-main", "After combat"],
          ].map(([phase, label]) => (
            <span
              key={phase}
              aria-current={
                b.phase === phase || (phase === "block" && b.phase === "damage")
                  ? "step"
                  : undefined
              }
            >
              {label}
            </span>
          ))}
        </span>
        <strong>
          Turn {b.turn} ·{" "}
          {b.active === "player" ? "Your turn" : "Opponent’s turn"} ·{" "}
          {
            {
              main: "Prepare",
              attack: "Choose attackers",
              block: "Choose blocks",
              damage: "Clash",
              "second-main": "After combat",
            }[b.phase]
          }
        </strong>
        {" · "}
        {pending
          ? pending.destination
            ? "Confirm the selected spell, or click another target. Escape cancels."
            : `Choose a glowing target for ${cardById[pending.id].name}. Escape cancels.`
          : feedback ||
            (main
              ? "Your main phase · drag a resource onto your side of the felt, or cast a spell. Hover to read; double-click a table card for its story."
              : "Respond with an instant, or use the next action below to continue.")}
      </div>
      <div className="battle-controls" aria-label="Battle actions">
        <small className="mobile-phase">
          Turn {b.turn} · {b.active === "player" ? "Yours" : "Opponent"} ·{" "}
          {
            {
              main: "Prepare",
              attack: "Choose attackers",
              block: "Choose defenders",
              damage: "Resolve combat",
              "second-main": "After combat",
            }[b.phase]
          }
        </small>

        <div
          className={`action-clock ${b.secondsLeft <= 10 && b.timed ? "urgent" : ""}`}
        >
          <span
            title="60 seconds per decision window. Pauses while reading cards or away from the table. At zero: pass priority or advance combat."
            aria-label="Action time remaining"
          >
            ⌛ {b.timed ? `${b.secondsLeft}s` : "Untimed"}
          </span>
          <button
            disabled={!playing || b.autoplay}
            onClick={() => send({ type: "battle-clock", timed: !b.timed })}
          >
            {b.timed ? "Pause clock" : "Resume clock"}
          </button>
        </div>
        {playing && (
          <button
            className="autoplay-toggle"
            onClick={
              b.autoplay
                ? () => send({ type: "autoplay", enabled: false })
                : onAutoplay
            }
          >
            {b.autoplay ? "Take control" : "Autoplay at the tavern"}
          </button>
        )}
        {pending && (
          <button
            className="primary confirm-action"
            disabled={
              !validateTarget(
                b,
                heldEffect(pending),
                pending.destination ? targetValue(pending.destination) : null,
              )
            }
            onClick={confirmCast}
          >
            Confirm
          </button>
        )}
        {!pending && !playing ? (
          <b role="status">
            {b.result === "won"
              ? "Victory · +35 crowns, +5 renown"
              : "A well-played defeat. Try another strategy."}
          </b>
        ) : !pending && !b.autoplay ? (
          <>
            {b.stack.length > 0 ? (
              <button
                className="primary"
                onClick={() => send({ type: "pass" })}
              >
                Resolve top of stack
              </button>
            ) : b.active === "enemy" &&
              !["block", "damage"].includes(b.phase) ? (
              <button
                className="primary"
                onClick={() => send({ type: "pass" })}
              >
                Pass priority · opponent acts
              </button>
            ) : null}
            {main && b.phase === "main" && (
              <button
                onClick={() => {
                  setAttackers([]);
                  send({ type: "combat" });
                }}
              >
                Begin combat
              </button>
            )}
            {b.active === "player" &&
              !b.stack.length &&
              !["block", "damage"].includes(b.phase) && (
                <button
                  className="primary end-turn-action"
                  onClick={() => send({ type: "end-turn" })}
                >
                  End turn
                </button>
              )}
          </>
        ) : null}
        {!pending &&
          !b.autoplay &&
          playing &&
          b.active === "player" &&
          b.phase === "attack" &&
          !b.stack.length && (
            <div className="attack-shortcuts">
              <button
                onClick={() =>
                  setAttackers(
                    creatures(b.player)
                      .filter((p) => canAttack(b, p))
                      .map((p) => p.uid),
                  )
                }
              >
                Attack with all
              </button>
              <button
                disabled={!attackers.length}
                onClick={() => setAttackers([])}
              >
                Clear
              </button>
            </div>
          )}
        {!pending &&
          !b.autoplay &&
          playing &&
          b.active === "player" &&
          b.phase === "attack" && (
            <button
              className="primary"
              disabled={!!b.stack.length}
              onClick={() =>
                send({
                  type: "declare",
                  attackers: attackers.filter((id) =>
                    creatures(b.player).some(
                      (p) => p.uid === id && canAttack(b, p),
                    ),
                  ),
                  ...(attackHero ? { hero: Number(attackHero) } : {}),
                })
              }
            >
              Declare {attackers.length} attackers
            </button>
          )}
        {!pending &&
          !b.autoplay &&
          playing &&
          ["block", "damage"].includes(b.phase) && (
            <button
              className="primary"
              disabled={!!b.stack.length}
              onClick={() => send({ type: "damage" })}
            >
              Deal combat damage
            </button>
          )}
        <details className="table-options">
          <summary>Table options</summary>
          <button
            disabled={
              b.turn !== 1 ||
              !!b.player.board.length ||
              !!b.stack.length ||
              !!b.mulligans
            }
            onClick={() => send({ type: "mulligan" })}
          >
            Free redraw
          </button>
          <button onClick={() => send({ type: "leave-duel" })}>
            {playing ? "Concede duel" : "Leave table"}
          </button>
        </details>
      </div>
      <div className="battlefield-scroll">
        <details className="target-selector">
          <summary>Target options</summary>
          <label>
            Spell / ability target{" "}
            <select
              aria-label="Spell target"
              value={target}
              onChange={(e) => selectTarget(e.target.value)}
            >
              <option value="enemy:hearth">Opposing hearth</option>
              <option value="player:hearth">Your hearth</option>
              {(["enemy", "player"] as const).flatMap((owner) =>
                b[owner].board
                  .filter((p) =>
                    ["Creature", "Hero"].includes(cardById[p.cardId].type),
                  )
                  .map((p) => (
                    <option
                      key={p.uid}
                      value={`${owner}:${cardById[p.cardId].type === "Hero" ? "hero" : "creature"}:${p.uid}`}
                    >
                      {owner === "player" ? "Your" : "Enemy"}{" "}
                      {cardById[p.cardId].name} #{p.uid}
                    </option>
                  )),
              )}
              {b.stack.map((p) => (
                <option key={p.uid} value={`${p.owner}:stack:${p.uid}`}>
                  Stack: {cardById[p.cardId].name}
                </option>
              ))}
            </select>
          </label>
          <small>
            Damage may target either hearth, a creature, or a Hero.
            Counterspells target the stack.
          </small>
        </details>
        {b.stack.length > 0 && (
          <section className="spell-stack">
            <h3>Stack · respond with an instant, or resolve the top</h3>
            {[...b.stack].reverse().map((s, i) => (
              <div
                key={s.uid}
                className={
                  legalDestination(`${s.owner}:stack:${s.uid}`)
                    ? "legal-target"
                    : ""
                }
                data-battle-drop={`${s.owner}:stack:${s.uid}`}
              >
                <button
                  aria-label={`Target stack ${cardById[s.cardId].name}`}
                  onClick={() => selectTarget(`${s.owner}:stack:${s.uid}`)}
                >
                  Choose target
                </button>
                <img
                  className="stack-card-art"
                  src={assetUrl(`/art/cards/${s.cardId}.png`)}
                  alt={cardById[s.cardId].name}
                  onClick={() => selectTarget(`${s.owner}:stack:${s.uid}`)}
                />
                <b>
                  {i === 0 ? "Next → " : ""}
                  {cardById[s.cardId].name}
                  {s.ability ? " · Hero ability" : ""}
                </b>
                <small>{s.owner === "player" ? "You" : b.opponent}</small>
              </div>
            ))}
          </section>
        )}
        <div
          className="opponent-hand"
          aria-label={`Opponent hand: ${b.enemy.hand.length} face-down cards`}
        >
          {Array.from({ length: Math.min(14, b.enemy.hand.length) }, (_, i) => (
            <div key={i} className="table-card-back" aria-hidden="true">
              <span>✦</span>
            </div>
          ))}
          <span>{b.enemy.hand.length} cards · hidden hand</span>
        </div>
        {side("enemy")}
        <div className="combat-strip" role="status">
          {forecast && (
            <span className="combat-forecast">
              If damage resolves now: your hearth{" "}
              {forecast.playerLife > 0 ? "−" : "+"}
              {Math.abs(forecast.playerLife)} · theirs{" "}
              {forecast.enemyLife > 0 ? "−" : "+"}
              {Math.abs(forecast.enemyLife)} · companions lost{" "}
              {forecast.playerLost} yours / {forecast.enemyLost} theirs.
              Responses can change this.
            </span>
          )}
          {b.phase === "attack"
            ? `${attackers.length} attackers selected · click your ready companions, then the opposing hearth or Hero. Confirm at the lower right.`
            : b.phase === "block" && b.active === "enemy"
              ? "Choose your defender, then click an opposing attacker to block. Click an assigned attacker with no defender selected to release it."
              : b.combat.length
                ? `${b.combat.length} attackers · ${b.combat.filter((a) => a.blocker).length} blocked · respond before damage`
                : "✧ THE HEARTH BETWEEN US ✧"}
        </div>
        {side("player")}
      </div>
      <div className="player-hand-zone">
        <div className="hand-heading">
          <h3>Your hand</h3>
          <span>
            {main
              ? "Main phase · one resource per turn"
              : "Hold mana for instant responses"}
          </span>
        </div>
        <div className="hand">
          {b.player.hand.map((id, i) => (
            <div
              key={`${id}-${i}`}
              onMouseEnter={(e) =>
                setPreview({ id, x: e.currentTarget.getBoundingClientRect().x })
              }
              onMouseLeave={() => setPreview(null)}
              onClickCapture={(e) => {
                if ((e.target as Element).closest(".card-art-button")) {
                  e.preventDefault();
                  e.stopPropagation();
                  if (canPlay(cardById[id]))
                    targeted(cardById[id])
                      ? setPending({ index: i, id })
                      : play(i, id);
                }
              }}
              onFocus={(e) =>
                setPreview({ id, x: e.currentTarget.getBoundingClientRect().x })
              }
              onBlur={() => setPreview(null)}
              title={unavailable(cardById[id]) || "Ready to play"}
              className={`hand-card ${pending?.index === i ? "staged" : ""} ${canPlay(cardById[id]) ? "playable" : "unplayable"}`}
              draggable={canPlay(cardById[id])}
              onDragStart={(e) => {
                setPending(null);
                setDragged({ index: i, id });
                e.dataTransfer.setData("text/plain", id);
                e.dataTransfer.effectAllowed = "move";
              }}
              onDragEnd={() => setDragged(null)}
            >
              <CardView card={cardById[id]}>
                <button
                  className="drag-handle"
                  disabled={!canPlay(cardById[id])}
                  aria-label={`Drag ${cardById[id].name} to the table`}
                  onPointerDown={(e) => {
                    if (e.pointerType === "mouse") return;
                    touch.current = {
                      index: i,
                      id,
                      x: e.clientX,
                      y: e.clientY,
                      moved: false,
                    };
                    e.currentTarget.setPointerCapture(e.pointerId);
                  }}
                  onPointerMove={(e) => {
                    const held = touch.current;
                    if (
                      held &&
                      Math.hypot(e.clientX - held.x, e.clientY - held.y) > 8
                    ) {
                      held.moved = true;
                      setDragged({ index: i, id });
                    }
                  }}
                  onPointerUp={finishTouch}
                  onPointerCancel={() => {
                    touch.current = null;
                    setDragged(null);
                  }}
                  onClick={() =>
                    setFeedback(
                      "Drag this card onto the felt or a spell target. You can also use Play below.",
                    )
                  }
                >
                  ⠿ Drag to table
                </button>
                <button
                  className="primary"
                  disabled={!canPlay(cardById[id])}
                  title={unavailable(cardById[id]) || "Ready to play"}
                  onClick={() => {
                    if (targeted(cardById[id])) {
                      setPending({ index: i, id });
                      setFeedback("Choose a highlighted target.");
                    } else play(i, id);
                  }}
                >
                  {isResource(cardById[id]) ? "Play resource" : "Cast spell"}
                </button>
                {!canPlay(cardById[id]) && (
                  <small className="hand-unavailable">
                    {unavailable(cardById[id])}
                  </small>
                )}
              </CardView>
            </div>
          ))}
        </div>
      </div>
      <details className="battle-log">
        <summary>Table talk · Battle log</summary>
        {b.log.map((m, i) => (
          <p key={i}>{tableWords(m)}</p>
        ))}
      </details>
    </section>
  );
}
