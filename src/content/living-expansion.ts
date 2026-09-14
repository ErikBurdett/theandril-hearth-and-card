import type { LivingEntry } from "./living-expansion-tools";
import { sharedMeasureExpansion } from "./living-shared-measure";
import { termsOfShelterExpansion } from "./living-terms-of-shelter";
import { unclaimedWaysExpansion } from "./living-unclaimed-ways";
import { unfinishedAnswerExpansion } from "./living-unfinished-answer";

export const livingExpansionEntries: Record<string, LivingEntry[]> = {
  "shared-measure": sharedMeasureExpansion,
  "terms-of-shelter": termsOfShelterExpansion,
  "unclaimed-ways": unclaimedWaysExpansion,
  "unfinished-answer": unfinishedAnswerExpansion,
};
/** The two additional, unnamed Heroes belong to the indicated culture blocks. */
export const livingExpansionHeroOwners: Record<string, [number, number]> = {
  "shared-measure": [1, 7],
  "terms-of-shelter": [7, 13],
  "unclaimed-ways": [1, 7],
  "unfinished-answer": [7, 13],
};
