import { cards, sets } from "../content/catalog";
import { presets } from "../sim/battle";

/** Counts shown on the public helper page. `site:build-data` writes them to
 * catalog-summary.json so the helper does not bundle the card catalog. */
export const catalogSummary = () => ({
  sets: sets.length,
  cards: cards.length,
  volumes: sets.filter((s) => !s.folio).length,
  folios: sets.filter((s) => s.folio).length,
  recipes: presets.length,
});
