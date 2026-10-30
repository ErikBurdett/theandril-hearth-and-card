import type { BattleMoment } from "../sim/battle-moments";

export function BattleMoments({ moments }: { moments: BattleMoment[] }) {
  return (
    <details className="battle-moments">
      <summary>Key moments ({moments.length})</summary>
      {moments.length ? (
        <>
          <p>
            The latest five notable exchanges, showing what changed at the
            table.
          </p>
          <ol>
            {moments.map((moment, i) => (
              <li key={i}>
                <strong>
                  Turn {moment.turn} · {moment.title}
                </strong>
                {moment.facts.map((fact, j) => (
                  <p key={j}>{fact}</p>
                ))}
              </li>
            ))}
          </ol>
        </>
      ) : (
        <p>No key moments were saved for this meeting.</p>
      )}
    </details>
  );
}
