import type { Game } from "../sim/game";
import { TomeDialog } from "./TomeDialog";
export function Notifications({
  game,
  close,
  read,
}: {
  game: Game;
  close: () => void;
  read: () => void;
}) {
  return (
    <TomeDialog title="Tavern notices" close={close}>
      <p>
        Deliveries, sales, upgrades and learned recipes. Your latest 60 notices
        stay in this browser's ledger.
      </p>
      <button onClick={read} disabled={!game.notices.some((n) => !n.read)}>
        Mark all as read
      </button>
      <ol className="notice-list">
        {game.notices.map((n) => (
          <li key={n.id} className={n.read ? "" : "unread"}>
            <small>
              Day {n.day}
              {!n.read && " · New"}
            </small>
            <p>{n.text}</p>
          </li>
        ))}
      </ol>
      {!game.notices.length && (
        <p>No notices yet. Open the shop or begin a friendly duel.</p>
      )}
    </TomeDialog>
  );
}
