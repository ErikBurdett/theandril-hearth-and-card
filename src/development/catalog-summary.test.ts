import { it, expect } from "vitest";
import summary from "./catalog-summary.json";
import { catalogSummary } from "./catalog-summary";

it("keeps the helper page's committed catalog counts in step with the live catalog", () => {
  // Run npm run site:build-data after adding or removing sets, cards or recipes.
  expect(summary).toEqual(catalogSummary());
});
