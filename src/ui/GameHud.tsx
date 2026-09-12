import { useState } from "react";
import { TomeDialog } from "./TomeDialog";
import { assetUrl } from "../content/artwork";
import { SpriteOrnament } from "./SpriteOrnament";
import { keeperLevel } from "../sim/progression";
import { clockPhase } from "../sim/hospitality";
import {
  BookOpen,
  Package,
  Layers,
  Swords,
  ScrollText,
  Coins,
  Sun,
  Moon,
  Flame,
  Check,
  DoorOpen,
  DoorClosed,
  Soup,
  Menu,
  Bell,
} from "lucide-react";
import type { Game } from "../sim/game";
const actions = [
  ["Stockroom", "Counter", Package, "1"],
  ["Card collection", "Grimoire", BookOpen, "2"],
  ["Booster packs", "Boosters", Layers, "3"],
  ["Duel table", "Card table", Swords, "4"],
  ["Hospitality", "Tavern", Soup, "5"],
  ["Chronicle", "Ledger", ScrollText, ""],
] as const;
export function GameHud({
  game,
  tab,
  onVisit,
  onToggle,
  onAuto,
  saved,
  unread,
  onNotices,
}: {
  game: Game;
  tab: string;
  onVisit: (name: string) => void;
  onToggle: () => void;
  onAuto: () => void;
  saved: boolean;
  unread: number;
  onNotices: () => void;
}) {
  const [menu, setMenu] = useState(false);
  return (
    <>
      <header className="game-hud-top">
        <button
          className="mobile-menu-toggle"
          aria-label="Open tavern menu"
          aria-expanded={menu}
          onClick={() => setMenu(true)}
        >
          <Menu size={22} />
          <span>Menu</span>
        </button>
        <button
          className="notice-bell"
          aria-label={`Tavern notices${unread ? `, ${unread} unread` : ""}`}
          onClick={onNotices}
        >
          <Bell size={20} />
          {unread > 0 && <b>{unread}</b>}
        </button>
        <button
          className="save-chip"
          onClick={() => onVisit("Chronicle")}
          aria-label="Open local save controls"
        >
          {saved ? "✓ Saved" : "Save status"}
        </button>
        <div className="tavern-identity">
          <Flame size={25} />
          <div>
            <h1>
              Theandril: Hearth <i>&</i> Card
            </h1>
            <span>GREY WEIR · THEANDRIL · RR 2447</span>
          </div>
        </div>
        <div className="game-day">
          {clockPhase(game) === "Night" ? (
            <Moon size={18} />
          ) : (
            <Sun size={18} />
          )}
          <span>
            Day {game.day}
            <small>
              {clockPhase(game)} · {(game.hospitality.bell % 48) + 1}/48
            </small>
          </span>
        </div>
        <button
          className="auto-hours"
          aria-pressed={game.hospitality.auto}
          onClick={onAuto}
        >
          Auto hours: {game.hospitality.auto ? "On" : "Off"}
        </button>
        <div className="game-crowns">
          <Coins size={18} />
          <strong data-testid="gold">{game.gold.toLocaleString()}</strong>
          <small>crowns</small>
          <button
            className="keeper-level-chip"
            onClick={() => onVisit("Chronicle")}
            aria-label="Open XP and missions"
          >
            Lv {keeperLevel(game.progression.xp)} · XP
          </button>
        </div>
        <button
          className={"shop-sign " + (game.open ? "open" : "")}
          onClick={onToggle}
        >
          {game.open ? <DoorOpen size={18} /> : <DoorClosed size={18} />}
          <span>
            {game.open ? "Close the shop" : "Open the shop"}
            <small>
              {game.open
                ? `${game.room.customers.length} guests inside`
                : "Turn the sign · welcome travelers"}
            </small>
          </span>
        </button>
      </header>
      {menu && (
        <TomeDialog title="Tavern menu" close={() => setMenu(false)}>
          <p>
            Day {game.day} · {clockPhase(game)} · {game.gold.toLocaleString()}{" "}
            crowns
          </p>
          <nav className="mobile-stations" aria-label="Choose a station">
            <button
              onClick={() => {
                onVisit("Tavern");
                setMenu(false);
              }}
            >
              Return to the room
            </button>
            {actions.map(([name, label, Icon]) => (
              <button
                key={name}
                onClick={() => {
                  onVisit(name);
                  setMenu(false);
                }}
              >
                <Icon size={22} />
                {label}
              </button>
            ))}
          </nav>
          <button onClick={onToggle}>
            {game.open ? "Close the shop" : "Open the shop"}
          </button>
          <button aria-pressed={game.hospitality.auto} onClick={onAuto}>
            Auto hours: {game.hospitality.auto ? "On" : "Off"}
          </button>
          <p>
            {saved
              ? "Progress saved on this device."
              : "Check your local save in the Ledger."}
          </p>
          <p>
            <a
              className="development-link"
              href={`${import.meta.env.BASE_URL}updates/`}
            >
              Development journal &amp; roadmap ↗
            </a>
          </p>
        </TomeDialog>
      )}
      {tab === "Tavern" && (
        <>
          <div className="room-time">
            <span className={game.open ? "lit-dot" : "unlit-dot"} />
            {game.open ? "The doors are open" : "Your tavern, your pace"}
            <small>
              {game.room.customers.length
                ? `${game.room.customers.length} travelers are here`
                : "A little peace beside the Sallow"}
            </small>
          </div>
          <div className="lich-identity">
            <img
              src={assetUrl("/art/animation/player.erilian-idle.png")}
              alt="Erilian Kantonine, a lich in black robes carrying a staff"
            />
            <div>
              <small>THE LICH’S TALE</small>
              <strong>Erilian Kantonine</strong>
              <span>Lorekeeper & shopkeeper</span>
            </div>
          </div>
          <div className="hearth-whisper">
            <small>THE TAVERN REMEMBERS</small>
            <p key={game.journal[0]}>{game.journal[0]}</p>
            <span>
              {game.reputation} renown · {game.visitors} travelers welcomed
            </span>
          </div>
        </>
      )}
      <div className="game-dock-wrap">
        <nav className="game-dock" aria-label="Tavern interactions">
          {actions.map(([name, label, Icon, key]) => (
            <button
              aria-label={name}
              className={tab === name ? "active" : ""}
              key={name}
              onClick={() => onVisit(name)}
            >
              {name === "Card collection" || name === "Chronicle" ? (
                <SpriteOrnament kind="book" />
              ) : name === "Booster packs" ? (
                <SpriteOrnament kind="pack" />
              ) : name === "Duel table" ? (
                <SpriteOrnament kind="card" />
              ) : (
                <SpriteOrnament
                  kind={name === "Stockroom" ? "barrel" : "cauldron"}
                />
              )}
              <span>{label}</span>
              {key && <kbd>{key}</kbd>}
            </button>
          ))}
        </nav>
        <div className="game-control-hint">
          <span>
            CLICK TO WALK <b>·</b> WASD / ARROWS <b>·</b> E TO INTERACT
          </span>
          <small>
            <Check size={10} />
            {saved ? "Ledger saved" : "Local session"}
          </small>
        </div>
      </div>
    </>
  );
}
