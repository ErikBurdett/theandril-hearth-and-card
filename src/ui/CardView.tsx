import { assetUrl } from "../content/artwork";
import { FoilSheen } from "./FoilSheen";
import { tableWords } from "../content/wording";
import { cardIllustration } from "../content/artwork";
import { Compass, Flame, Shield } from "lucide-react";
import { useCardInspect } from "./CardInspectContext";
import { cardLore } from "../content/lore";
import type { CSSProperties } from "react";
import {
  setById,
  isResource,
  manaSymbols,
  type Card,
  type CardSet,
} from "../content/catalog";
const motifs = [
  "unit.guard",
  "unit.scout",
  "unit.guard.cinder_march",
  "unit.guard.glass_tide",
  "unit.guard.reedbound_council",
  "monster.revenant",
  "unit.mage",
  "settlement.village.ashen_compact",
];
const motif = (set: CardSet) => motifs[set.release - 1];
export function Art({ set, small = false }: { set: CardSet; small?: boolean }) {
  const cover = cardIllustration(`${set.id}.16`);
  return (
    <div
      className={
        "set-art " + (cover ? "custom-set-art " : "") + (small ? "small" : "")
      }
      style={{ "--accent": set.color } as CSSProperties}
    >
      <span className="art-sigil">{set.symbol}</span>
      <img
        src={cover ?? assetUrl(`/art/thumbs/${motif(set)}.png`)}
        alt=""
        loading="lazy"
      />
      <span className="art-stars">✦ · ✧</span>
    </div>
  );
}
export function CardArt({
  card,
  showcase = false,
}: {
  card: Card;
  showcase?: boolean;
}) {
  const custom = cardIllustration(card.id);
  if (custom)
    return (
      <div
        className={`set-art card-illustration custom-illustration aspect-${card.color}`}
      >
        <img
          className="full-card-art"
          draggable={false}
          src={custom}
          loading="lazy"
          decoding="async"
          alt={`${card.name}, an original pixel illustration from ${setById[card.setId].name}`}
        />
        {showcase && <FoilSheen />}
      </div>
    );
  const set = setById[card.setId],
    spell =
      card.type === "Instant" ||
      card.type === "Sorcery" ||
      card.type === "Enchantment",
    hero = card.type === "Hero";
  const RelicIcon =
    card.permanentEffect === "mana-rock"
      ? Compass
      : card.permanentEffect === "sanctuary"
        ? Flame
        : Shield;
  const creatureArt = /Boatwright|Pilot|Sailor/.test(card.name)
    ? "customer.sailor"
    : /Bargainer|Factor|Merchant/.test(card.name)
      ? "customer.merchant"
      : /Journeyman|Mine-master|Forge/.test(card.name)
        ? "customer.smith"
        : /Clerk|Reciter|Scribe/.test(card.name)
          ? "customer.scholar"
          : card.setId === "rekindled"
            ? "unit.guard"
            : card.setId === "deepfen"
              ? "customer.herbalist"
              : motif(set);
  const art = hero
    ? /Ilthen|Ledgerbone|Provost/.test(card.name)
      ? "monster.revenant"
      : "unit.commander"
    : isResource(card)
      ? "settlement.village.ashen_compact"
      : card.type === "Artifact"
        ? "unit.mage"
        : creatureArt;
  return (
    <div
      className={`set-art card-illustration aspect-${card.color} ${spell ? "spell-illustration" : ""} ${isResource(card) ? "resource-illustration" : ""}`}
    >
      <span className="art-sigil">{set.symbol}</span>
      {isResource(card) ? (
        <img
          className="resource-art"
          src={assetUrl(
            `/art/resources/${card.type === "Special Resource" ? "special" : card.color}.png`,
          )}
          alt=""
        />
      ) : card.type === "Artifact" ? (
        <div className="relic-emblem">
          <RelicIcon size={57} strokeWidth={1} />
        </div>
      ) : spell ? (
        <div className="spell-ring">
          <i />
          <b>{manaSymbols[card.color]}</b>
          <i />
        </div>
      ) : (
        <img src={assetUrl(`/art/thumbs/${art}.png`)} alt="" />
      )}
      <span className="illustration-caption">
        {hero
          ? "THE REMEMBERED"
          : isResource(card)
            ? "A PLACE IN THE WORLD"
            : card.type === "Artifact"
              ? "A WORK OF MANY HANDS"
              : spell
                ? card.tradition.toUpperCase()
                : set.code + " · " + card.tradition.toUpperCase()}
      </span>
    </div>
  );
}
export function CardView({
  card,
  children,
  hidden = false,
  foil = false,
  illuminated = false,
  showcase = false,
}: {
  card: Card;
  children?: React.ReactNode;
  hidden?: boolean;
  foil?: boolean;
  illuminated?: boolean;
  showcase?: boolean;
}) {
  const set = setById[card.setId],
    inspect = useCardInspect();
  return (
    <article
      onPointerMove={(e) => {
        if (!foil || matchMedia("(prefers-reduced-motion: reduce)").matches)
          return;
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty(
          "--foil-x",
          `${(100 * (e.clientX - r.left)) / r.width}%`,
        );
        e.currentTarget.style.setProperty(
          "--foil-y",
          `${(100 * (e.clientY - r.top)) / r.height}%`,
        );
      }}
      onPointerLeave={(e) => {
        e.currentTarget.style.removeProperty("--foil-x");
        e.currentTarget.style.removeProperty("--foil-y");
      }}
      data-card-type={card.type}
      className={`playing-card ${cardIllustration(card.id) ? "full-art-card" : ""} aspect-${card.color} ${card.rarity} ${foil ? "foil" : ""} ${illuminated ? "illuminated" : ""} ${hidden ? "unowned" : ""}`}
      style={
        {
          "--accent": set.color,
        } as CSSProperties
      }
    >
      <div className="card-title">
        {inspect ? (
          <button
            className="card-name-button"
            aria-label={`Inspect ${card.name}`}
            onClick={() => inspect(card.id)}
          >
            {card.name}
          </button>
        ) : (
          <strong>{card.name}</strong>
        )}
        <span
          title={`${card.cost - card.colored} generic and ${card.colored} ${card.color} mana`}
        >
          {isResource(card)
            ? "RESOURCE"
            : `${Math.max(0, card.cost - card.colored) || ""}${manaSymbols[card.color].repeat(card.colored)}`}
        </span>
      </div>
      {inspect ? (
        <button
          className="card-art-button"
          aria-label={`Read the story of ${card.name}`}
          onClick={() => inspect(card.id)}
        >
          <CardArt card={card} showcase={foil && showcase} />
        </button>
      ) : (
        <CardArt card={card} showcase={foil && showcase} />
      )}
      <div className="card-type">
        {card.type} · {card.tradition}
        <span>{set.symbol}</span>
      </div>
      {card.type === "Hero" ? (
        <div className="card-rule hero-rules">
          {card.abilities.map((ability, i) => (
            <div key={i}>
              <b>
                {ability.loyalty > 0 ? "+" : ""}
                {ability.loyalty}
              </b>
              <span>
                {tableWords(ability.text.split(": ").slice(1).join(": "))}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="card-rule">{tableWords(card.rules)}</p>
      )}
      <p className="card-flavor">{cardLore(card).flavor}</p>
      <div className="card-bottom">
        <span>
          {set.code} {String(card.number).padStart(3, "0")} · {card.rarity}
          {illuminated ? " · ILLUMINATED" : foil ? " · FOIL" : ""}
        </span>
        {card.type === "Creature" && (
          <b>
            {card.attack} / {card.health}
          </b>
        )}
      </div>
      {card.type === "Hero" && (
        <b className="hero-loyalty">{card.loyalty} devotion</b>
      )}
      {children}
    </article>
  );
}
