import {
  branches,
  keeperLevel,
  xpThreshold,
  mission,
} from "../sim/progression";
import { cardById } from "../content/catalog";
import type { Game, Command } from "../sim/game";
export function Progression({
  game,
  send,
}: {
  game: Game;
  send: (cmd: Command) => boolean;
}) {
  const p = game.progression,
    level = keeperLevel(p.xp),
    base = xpThreshold(level),
    next = xpThreshold(level + 1);
  return (
    <section
      className="keeper-progression paper-panel"
      aria-label="Endless keeper progression"
    >
      <header>
        <div>
          <span className="eyebrow">THE UNENDING CHRONICLE</span>
          <h2>Keeper level {level}</h2>
        </div>
        <strong>{p.xp.toLocaleString()} lifetime XP</strong>
      </header>
      <progress
        aria-label="Keeper level progress"
        max={next - base}
        value={p.xp - base}
      />
      <p>
        {p.xp - base} / {next - base} XP toward level {level + 1}. Battles,
        booster sales, and meals or drinks served earn XP. Every level grants
        crowns and collectible cards.
      </p>
      {p.lastReward && (
        <div className="progression-reward" role="status">
          <b>
            {p.lastReward.label} · +{p.lastReward.crowns} crowns
          </b>
          <span>
            {Object.entries(p.lastReward.cards)
              .map(([id, n]) => `${n} × ${cardById[id].name}`)
              .join(" · ")}
          </span>
        </div>
      )}
      <h3>The endless mission tree</h3>
      <p>
        Choose a path in each branch. Only activity after choosing counts. Claim
        its reward to reveal the next chapter; there is no final chapter.
      </p>
      <div className="mission-tree">
        {branches.map((key) => {
          const b = p.missions[key],
            m = mission(p, key),
            done = Math.max(0, m.current - b.baseline),
            ready = !!b.choice && done >= m.target;
          return (
            <article
              className={`mission-branch ${ready ? "ready" : ""}`}
              key={key}
              aria-label={`${key} mission branch`}
            >
              <h3>
                {key === "battle"
                  ? "⚔ The duelist"
                  : key === "trade"
                    ? "◇ The merchant"
                    : key === "craft"
                      ? "⚒ The artisan"
                      : "♨ The host"}
              </h3>
              <span className="chapter-root">Chapter {b.tier}</span>
              {b.choice ? (
                <div className="mission-node">
                  <b>{m.title}</b>
                  <p>{m.detail}</p>
                  <progress
                    max={m.target}
                    value={Math.min(done, m.target)}
                    aria-label={`${key} mission progress`}
                  />
                  <small>
                    {Math.min(done, m.target)} / {m.target}
                  </small>
                  <button
                    disabled={!ready}
                    onClick={() => send({ type: "claim-mission", branch: key })}
                  >
                    Claim {key} mission
                  </button>
                </div>
              ) : (
                <div className="mission-fork">
                  {(["steady", "bold"] as const).map((choice) => {
                    const option = mission(p, key, choice);
                    return (
                      <button
                        key={choice}
                        onClick={() =>
                          send({ type: "choose-mission", branch: key, choice })
                        }
                      >
                        <b>{option.title}</b>
                        <span>
                          {option.detail} · {option.target}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
              <small className="mission-prize">
                {40 + 20 * b.tier} XP · {30 + 10 * b.tier} crowns ·{" "}
                {1 + Math.floor(b.tier / 5)}{" "}
                {b.tier % 10 === 0
                  ? "mythic"
                  : b.tier % 5 === 0
                    ? "rare"
                    : "uncommon"}{" "}
                card(s)
              </small>
              <div className="mission-future" aria-label="More chapters follow">
                │<br />◇ Chapter {b.tier + 1}
                <br />│<br />∞
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
