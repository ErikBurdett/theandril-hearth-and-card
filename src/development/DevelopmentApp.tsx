import { useEffect, useState, type CSSProperties } from "react";
import changes from "./changes.json";
import { filterChanges } from "./changelog";
import {
  baseline,
  filterRoadmap,
  phases,
  repository,
  reviewedOn,
  roadmap,
  sourceUrl,
  statuses,
  statusLabel,
  type Status,
} from "./roadmap";

type Page = "overview" | "roadmap" | "changes";
const base = import.meta.env.BASE_URL;
const site = (page: Page = "overview") =>
  `${base}updates/${page === "overview" ? "" : `${page}/`}`;
const art = (path: string) => `${base}art/optimized/${path}.webp`;
const pages: { id: Page; name: string }[] = [
  { id: "overview", name: "Overview" },
  { id: "roadmap", name: "Roadmap" },
  { id: "changes", name: "Change ledger" },
];
const date = (value: string) =>
  new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));

function useFilters() {
  const read = () => {
    const params = new URLSearchParams(location.search);
    const value = params.get("status");
    return {
      q: params.get("q") ?? "",
      status: statuses.includes(value as Status) ? value! : "all",
    };
  };
  const [filters, setFilters] = useState(read);
  useEffect(() => {
    const sync = () => setFilters(read());
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);
  const update = (next: typeof filters) => {
    const url = new URL(location.href);
    for (const key of ["q", "status"] as const) {
      if (next[key] && next[key] !== "all")
        url.searchParams.set(key, next[key]);
      else url.searchParams.delete(key);
    }
    // Filters have their own URL; clear an old item anchor that could be hidden.
    url.hash = "";
    history.replaceState(null, "", url);
    setFilters(next);
  };
  return [filters, update] as const;
}

function StatusMark({ status }: { status: Status }) {
  return (
    <span className={`dev-status ${status}`}>
      <span aria-hidden="true">
        {status === "completed" ? "✓" : status === "in-progress" ? "◐" : "○"}
      </span>{" "}
      {statusLabel[status]}
    </span>
  );
}

function Overview() {
  return (
    <>
      <section className="dev-hero">
        <div>
          <p className="dev-eyebrow">A keeper's record · Development journal</p>
          <h1>
            A little tavern.
            <br />A world still growing.
          </h1>
          <p className="dev-lead">
            Follow the making of <em>Theandril: Hearth &amp; Card</em>: what you
            can play today, what changed, and what still needs work.
          </p>
          <div className="dev-actions">
            <a className="dev-button" href={site("roadmap")}>
              Explore the roadmap <span aria-hidden="true">→</span>
            </a>
            <a href={base}>Enter the tavern ↗</a>
          </div>
          <p className="dev-fine">
            Pre-1.0 · Single player · Local browser saves
          </p>
        </div>
        <figure>
          <img
            src={art("tavern")}
            alt="The illustrated card shop with its counter, card table and shelves beside the Sallow"
            width="1536"
            height="1024"
          />
          <figcaption>
            The current tavern illustration. Dining and bar upgrades unlock
            separate wings.
          </figcaption>
        </figure>
      </section>
      <section className="dev-section" aria-labelledby="current-state">
        <p className="dev-eyebrow">The playable chapter</p>
        <h2 id="current-state">What is in the game now?</h2>
        <div className="dev-columns">
          <article>
            <span className="dev-chapter">I</span>
            <h3>Keep the hearth</h3>
            <p>
              Order stock, set pack prices, welcome travelers and grow an
              illustrated tavern. Cook, brew, learn skills and follow keeper
              missions.
            </p>
            <a href={`${site("roadmap")}#hospitality`}>
              Shop &amp; hospitality checkpoints →
            </a>
          </article>
          <article>
            <span className="dev-chapter">II</span>
            <h3>Collect the world</h3>
            <p>
              Eight sets, 640 individually illustrated cards, fourteen-card
              packs and a saved deck shelf. Read histories and earn challenge
              recipes from your guests.
            </p>
            <a href={`${site("roadmap")}#collecting`}>
              Collection checkpoints →
            </a>
          </article>
          <article>
            <span className="dev-chapter">III</span>
            <h3>Take a seat</h3>
            <p>
              Build a 100-card deck and duel with colored resources, spells,
              companions and Heroes. Watch autoplay or take over the same
              battle.
            </p>
            <a href={`${site("roadmap")}#duel-foundation`}>
              Duel checkpoints →
            </a>
          </article>
        </div>
      </section>
      <section className="dev-section dev-split" aria-labelledby="next-chapter">
        <div>
          <p className="dev-eyebrow">The next chapter</p>
          <h2 id="next-chapter">
            Working foundations.
            <br />
            Unfinished depth.
          </h2>
          <p>
            Deeper combat rules, distinct rival strategies and tactical
            tutorials are the next proposed priorities. Human balance,
            real-device testing and final release scope still need acceptance.
          </p>
          <p>
            This is a development demo. No release date or completion percentage
            is implied by the checked items.
          </p>
          <a href={`${site("roadmap")}?status=pending`}>See pending work →</a>
        </div>
        <ol className="dev-priorities">
          {roadmap
            .filter((item) => item.phase === "next")
            .slice(0, 3)
            .map((item) => (
              <li key={item.id}>
                <StatusMark status={item.status} />
                <h3>
                  <a href={`${site("roadmap")}#${item.id}`}>{item.title}</a>
                </h3>
                <p>{item.current}</p>
              </li>
            ))}
        </ol>
      </section>
      <section className="dev-section" aria-labelledby="dispatches">
        <p className="dev-eyebrow">Recent dispatches</p>
        <h2 id="dispatches">Changes you can feel at the table</h2>
        <div className="dev-columns">
          <article>
            <p className="dev-fine">September 12, 2026 · This increment</p>
            <h3>A public keeper's record</h3>
            <p>
              The current-state guide, checked roadmap and automatic Git change
              ledger now have a home of their own. Use item permalinks and
              evidence links to follow a feature from working behavior to
              remaining acceptance.
            </p>
            <a href={sourceUrl("docs/development/README.md", "main")}>
              Contributor handoff →
            </a>
          </article>
          <article>
            <p className="dev-fine">September 8, 2026</p>
            <h3>More deliberate duels</h3>
            <p>
              Saved response control, resource-payment previews, touch casting,
              combat tethers and a quieter action layout make existing decisions
              easier to follow. Broader combat rules and strategic personalities
              remain open.
            </p>
            <a href={`${repository}/commit/78cbea0`}>
              Read the battle-polish change →
            </a>
          </article>
          <article>
            <p className="dev-fine">September 7, 2026</p>
            <h3>A safer ledger, familiar rivals</h3>
            <p>
              Recoverable saves, six earned guest recipes, notices and a phone
              station menu make it easier to return to your tavern. Progress
              remains local; twenty named visitors use fourteen visual families.
            </p>
            <a href={`${repository}/commit/b81d1a1`}>
              Read the save and guest change →
            </a>
          </article>
        </div>
        <p>
          <a href={site("changes")}>
            Browse the full main-branch change ledger →
          </a>
        </p>
      </section>
      <section className="dev-section" aria-labelledby="reference">
        <p className="dev-eyebrow">On the writing desk</p>
        <h2 id="reference">Understand the game. Find the source.</h2>
        <div className="dev-reference">
          {[
            [
              "Rules & deck building",
              "Pack odds, supported mechanics and explicit duel simplifications.",
              "docs/CARD_RULES.md",
            ],
            [
              "The world & the sets",
              "Eight eras, the adopted lore snapshot and original tavern additions. Open Set histories in the in-game grimoire for the illustrated library.",
              "docs/WORLD_AND_SETS.md",
            ],
            [
              "Implementation status",
              "Detailed system notes, compatibility and remaining limitations. Earlier dated checkpoints remain historical evidence.",
              "docs/IMPLEMENTATION_STATUS.md",
            ],
            [
              "Release readiness",
              "Scoped acceptance and the open work before a single-player 1.0.",
              "docs/RELEASE_READINESS.md",
            ],
            [
              "Contribute a change",
              "Run the project, verify behavior and update this development record alongside the implementation.",
              "CONTRIBUTING.md",
            ],
            [
              "Hosting & saves",
              "The static demo, browser-local progress and future service boundaries.",
              "docs/HOSTING.md",
            ],
          ].map(([title, detail, path]) => (
            <a key={path} href={sourceUrl(path, "main")}>
              <strong>{title} ↗</strong>
              <span>{detail}</span>
            </a>
          ))}
        </div>
      </section>
    </>
  );
}

function Roadmap() {
  const [filters, update] = useFilters();
  const items = filterRoadmap(filters.status, filters.q);
  return (
    <>
      <p className="dev-eyebrow">
        The road ahead · Reviewed {date(reviewedOn)}
      </p>
      <h1>The development roadmap</h1>
      <p className="dev-lead">
        A checked record of what is playable, what has a working foundation, and
        what remains to be built or verified.
      </p>
      <div className="dev-legend">
        <p>
          <StatusMark status="completed" /> The named behavior works within its
          stated limits.
        </p>
        <p>
          <StatusMark status="in-progress" /> A working part exists; listed
          acceptance is still open. This does not imply an active assignment
          today.
        </p>
        <p>
          <StatusMark status="pending" /> Not implemented or not yet verified.
        </p>
      </div>
      <p className="dev-fine">
        Checkmarks are scoped checkpoints, not a percentage of 1.0. Status is
        maintained from reviewed code and evidence; it is separate from your
        personal game progress. Gameplay baseline:{" "}
        <a href={`${repository}/commit/${baseline}`}>{baseline.slice(0, 7)}</a>.
      </p>
      <div className="dev-filters" role="search" aria-label="Filter roadmap">
        <label>
          Search roadmap
          <input
            type="search"
            value={filters.q}
            placeholder="Try saves, rivals, or brewing"
            onChange={(e) => update({ ...filters, q: e.target.value })}
          />
        </label>
        <label>
          Status
          <select
            aria-label="Status"
            value={filters.status}
            onChange={(e) => update({ ...filters, status: e.target.value })}
          >
            <option value="all">All statuses ({roadmap.length})</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {statusLabel[status]} (
                {roadmap.filter((item) => item.status === status).length})
              </option>
            ))}
          </select>
        </label>
        <button onClick={() => update({ q: "", status: "all" })}>
          Reset filters
        </button>
      </div>
      <p role="status" className="dev-result">
        Showing {items.length} of {roadmap.length} checkpoints ·{" "}
        <a href={sourceUrl("docs/ROADMAP.md", "main")}>GitHub checklist ↗</a>
      </p>
      {!items.length && (
        <div className="dev-empty">
          <h2>No matching checkpoints</h2>
          <p>
            Try another phrase or reset the filters to see the complete roadmap.
          </p>
        </div>
      )}
      <nav className="dev-phase-nav" aria-label="Roadmap chapters">
        {phases
          .filter((phase) => items.some((item) => item.phase === phase.id))
          .map((phase) => (
            <a key={phase.id} href={`#phase-${phase.id}`}>
              {phase.title.slice(5)}
            </a>
          ))}
      </nav>
      {phases.map((phase) => {
        const rows = items.filter((item) => item.phase === phase.id);
        if (!rows.length) return null;
        return (
          <section
            className="dev-section"
            key={phase.id}
            aria-labelledby={`phase-${phase.id}`}
          >
            <h2 id={`phase-${phase.id}`}>{phase.title}</h2>
            <p>{phase.description}</p>
            <ol className="dev-checklist">
              {rows.map((item) => (
                <li
                  id={item.id}
                  className={`dev-checkpoint ${item.status}`}
                  key={item.id}
                  data-status={item.status}
                >
                  <span className="dev-check" aria-hidden="true">
                    {item.status === "completed"
                      ? "✓"
                      : item.status === "in-progress"
                        ? "◐"
                        : "○"}
                  </span>
                  <div>
                    <div className="dev-checkpoint-heading">
                      <h3>
                        <a href={`${site("roadmap")}#${item.id}`}>
                          {item.title}
                        </a>
                      </h3>
                      <StatusMark status={item.status} />
                    </div>
                    <p>{item.current}</p>
                    <div className="dev-acceptance">
                      <strong>
                        {item.status === "completed"
                          ? "Completion boundary"
                          : "Still needed"}
                      </strong>
                      <p>{item.acceptance}</p>
                    </div>
                    <details>
                      <summary>
                        Source &amp; evidence · {item.evidence.length}{" "}
                        references
                      </summary>
                      <ul>
                        {item.evidence.map((path) => (
                          <li key={path}>
                            <a href={sourceUrl(path, item.sourceRef)}>
                              {path} ↗
                            </a>
                          </li>
                        ))}
                      </ul>
                    </details>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        );
      })}
    </>
  );
}

function Changes() {
  const [filters, update] = useFilters();
  const entries = filterChanges(changes, filters.q);
  return (
    <>
      <p className="dev-eyebrow">From the repository to the tavern</p>
      <h1>The change ledger</h1>
      <p className="dev-lead">
        Every first-parent commit leading to this build, newest first. Open a
        change to see its full message and affected areas.
      </p>
      <p>
        Generated from Git history at build time. Commit dates describe
        repository changes, not feature acceptance or deployment dates.{" "}
        <a href={site("roadmap")}>The roadmap</a> explains current completion
        and remaining work.
      </p>
      <div
        className="dev-filters"
        role="search"
        aria-label="Filter change ledger"
      >
        <label>
          Search changes
          <input
            type="search"
            placeholder="Find a feature, source area, or commit"
            value={filters.q}
            onChange={(e) => update({ ...filters, q: e.target.value })}
          />
        </label>
        <button onClick={() => update({ q: "", status: "all" })}>
          Reset search
        </button>
      </div>
      <p role="status" className="dev-result">
        Showing {entries.length} of {changes.length} changes · Feed revision{" "}
        <a href={`${repository}/commit/${changes[0]?.sha}`}>
          {changes[0]?.sha.slice(0, 7)}
        </a>
      </p>
      {!entries.length && (
        <div className="dev-empty">
          <h2>No matching changes</h2>
          <p>Try another phrase or reset the search.</p>
        </div>
      )}
      <ol className="dev-changes">
        {entries.map((entry) => (
          <li id={`commit-${entry.sha.slice(0, 7)}`} key={entry.sha}>
            <div className="dev-change-meta">
              <time dateTime={entry.date}>{date(entry.date)}</time>
              <a href={`${site("changes")}#commit-${entry.sha.slice(0, 7)}`}>
                {entry.sha.slice(0, 7)}
              </a>
            </div>
            <h2>{entry.subject}</h2>
            <p className="dev-fine">
              {entry.files} files changed · {entry.areas.join(" · ")}
            </p>
            <details>
              <summary>Read change details</summary>
              {entry.body ? (
                <p className="dev-commit-body">{entry.body}</p>
              ) : (
                <p>
                  This commit has no extended message. Open its source diff for
                  the exact changes.
                </p>
              )}
              <a href={`${repository}/commit/${entry.sha}`}>
                View exact commit &amp; diff on GitHub ↗
              </a>
            </details>
          </li>
        ))}
      </ol>
    </>
  );
}

export function DevelopmentApp({ page }: { page: Page }) {
  useEffect(() => {
    const reveal = () => {
      let id: string;
      try {
        id = decodeURIComponent(location.hash.slice(1));
      } catch {
        return;
      }
      document.getElementById(id)?.scrollIntoView();
    };
    reveal();
    window.addEventListener("hashchange", reveal);
    return () => window.removeEventListener("hashchange", reveal);
  }, []);
  const materials = {
    "--dev-parchment": `url("${art("materials/parchment")}")`,
    "--dev-wood": `url("${art("materials/wood")}")`,
  } as CSSProperties;
  return (
    <div className="dev-site" style={materials}>
      <a className="dev-skip" href="#main">
        Skip to content
      </a>
      <header className="dev-header">
        <a className="dev-wordmark" href={site()}>
          <span aria-hidden="true">H</span>
          <div>
            <small>Theandril</small>
            <strong>Hearth &amp; Card</strong>
          </div>
        </a>
        <nav aria-label="Development navigation">
          {pages.map((item) => (
            <a
              key={item.id}
              href={site(item.id)}
              aria-current={page === item.id ? "page" : undefined}
            >
              {item.name}
            </a>
          ))}
          <a className="dev-play" href={base}>
            Play the demo ↗
          </a>
        </nav>
      </header>
      <main id="main" tabIndex={-1} className="dev-book">
        {page === "roadmap" ? (
          <Roadmap />
        ) : page === "changes" ? (
          <Changes />
        ) : (
          <Overview />
        )}
      </main>
      <footer className="dev-footer">
        <p>
          <strong>Theandril: Hearth &amp; Card</strong>
          <br />A single-player tavern in a world still growing. Pre-1.0.
        </p>
        <div>
          <a href={repository}>Source repository ↗</a>
          <a href={sourceUrl("docs/IMPLEMENTATION_STATUS.md", "main")}>
            Implementation status ↗
          </a>
          <a href="https://erikburdett.github.io/Theandril/updates/roadmap/">
            Theandril strategy roadmap ↗
          </a>
        </div>
      </footer>
    </div>
  );
}
