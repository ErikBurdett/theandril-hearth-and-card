import type { Game } from "../sim/game";
export const milestones = [
  {
    id: "first-pack",
    title: "Break the first seal",
    detail: "Open a booster from the sealed stories shelf.",
    reward: 10,
    tab: "Booster packs",
    ready: (g: Game) => g.lastPack.length > 0,
  },
  {
    id: "first-deck",
    title: "Bind a hundred stories",
    detail: "Save a complete named deck in your grimoire.",
    reward: 15,
    tab: "Card collection",
    ready: (g: Game) => (g.savedDecks?.length ?? 0) > 0,
  },
  {
    id: "first-sale",
    title: "Welcome a paying guest",
    detail: "Open the shop and complete a customer checkout.",
    reward: 25,
    tab: "Tavern",
    ready: (g: Game) => Object.values(g.products).some((p) => p.sold > 0),
  },
  {
    id: "first-win",
    title: "A hand worth remembering",
    detail: "Win a friendly duel at the card table.",
    reward: 40,
    tab: "Duel table",
    ready: (g: Game) => g.wins > 0,
  },
] as const;
