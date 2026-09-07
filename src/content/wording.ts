/** Player-facing vocabulary. Stable engine keys remain compatible with saved games. */
export const skillNames: Record<string, string> = {
  flying: "Skyborne",
  haste: "Quickstep",
  vigilance: "Steadfast",
  lifelink: "Hearthbond",
  deathtouch: "Doommarked",
  trample: "Overrun",
  reach: "Highguard",
  rootfast: "Rootfast",
  daunt: "Daunt",
};
export function tableWords(text: string): string {
  const words: Record<string, string> = {
    ...skillNames,
    tapped: "exhausted",
    untapped: "ready",
    tap: "exhaust",
    loyalty: "devotion",
    "summoning sickness": "arrival fatigue",
  };
  return text
    .replace(/^reach\b|(?<=\bor )reach\b|(?<=\/)reach\b/gi, "Highguard")
    .replace(
      /summoning sickness|\b(?:rootfast|daunt|flying|haste|vigilance|lifelink|deathtouch|trample|untapped|tapped|tap|loyalty)\b/gi,
      (word) => words[word.toLowerCase()] ?? word,
    );
}
export const skillGuide =
  "Skyborne: only Skyborne or Highguard can intercept. Quickstep: attack on arrival. Steadfast: attacking does not exhaust. Hearthbond: combat damage restores health. Doommarked: any combat damage defeats a companion. Overrun: excess damage reaches the hearth. Highguard: can intercept Skyborne attackers. Rootfast: cannot be returned to hand by spells. Daunt: companions with power 1 or less cannot block it. Welcome: gain life when another companion arrives. Recordwork: draw for the first artifact arriving each turn. Binding: skips the next ready step; Renew removes it.";
