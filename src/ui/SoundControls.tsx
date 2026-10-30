import { useEffect, useRef, useSyncExternalStore } from "react";
import type { Battle } from "../sim/battle";
import {
  cuesSince,
  ensureSoundscape,
  soundStore,
  tableSnapshot,
  type TableSnapshot,
} from "./soundscape";

export function useSoundSettings() {
  return useSyncExternalStore(soundStore.subscribe, soundStore.get);
}

/** Tavern sounds toggle and the three layer volumes, shared by the menu and the duel table. */
export function SoundControls() {
  const s = useSoundSettings();
  // After a reload with sounds on, build the graph now; browsers keep it
  // suspended until the next gesture, which the soundscape listens for.
  useEffect(() => {
    if (s.enabled) ensureSoundscape();
  }, [s.enabled]);
  const slider = (
    key: "cards" | "hearth" | "room",
    label: string,
    aria: string,
  ) => (
    <label>
      {label}
      <input
        aria-label={aria}
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={s[key]}
        onChange={(e) => soundStore.set({ [key]: Number(e.target.value) })}
      />
    </label>
  );
  return (
    <div className="battle-sound">
      <button
        aria-pressed={s.enabled}
        onClick={() => soundStore.set({ enabled: !s.enabled })}
      >
        Tavern sounds: {s.enabled ? "On" : "Off"}
      </button>
      {slider("cards", "Cards", "Card sound volume")}
      {slider("hearth", "Hearth", "Hearth sound volume")}
      {slider("room", "Room", "Room sound volume")}
      <small>
        Synthesized in the browser; nothing downloads and sounds never change
        the game.
      </small>
    </div>
  );
}

/** Plays table cues for public battle changes and shows the sound controls. */
export function BattleSound({ battle }: { battle: Battle }) {
  const s = useSoundSettings();
  const last = useRef<TableSnapshot | null>(null);
  useEffect(() => {
    const cues = cuesSince(last.current, battle);
    last.current = tableSnapshot(battle);
    if (!cues.length || !s.enabled || document.hidden) return;
    const scape = ensureSoundscape();
    if (!scape) return;
    // A rival's whole turn can land in one render; keep the first few cues.
    for (const cue of cues.slice(0, 4)) scape.play(cue);
  }, [
    battle.eventSequence,
    battle.player.hp,
    battle.enemy.hp,
    battle.player.board.length,
    battle.enemy.board.length,
    battle.result,
  ]);
  return <SoundControls />;
}
