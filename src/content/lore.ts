import { collectorNotes } from "./collector-notes";
import { cardFactionLenses, setContinuities, loreRevision } from "./factions";
import { cards, type Card, setById } from "./catalog";
export interface SetLore {
  place: string;
  question: string;
  account: string;
  uncertainty: string;
  keeperNote: string;
  typeNotes: Record<string, string>;
}
const notes = (
  resource: string,
  creature: string,
  spell: string,
  relic: string,
  hero: string,
) => ({
  "Basic Resource": resource,
  "Special Resource": `A meeting place belongs to more than one road. ${resource}`,
  Creature: creature,
  Instant: spell,
  Sorcery: spell,
  Artifact: relic,
  Enchantment: relic,
  Hero: hero,
});
/** Original collector prose, grounded in the retained Book; these are not quotations. */
export const setLore: Record<string, SetLore> = {
  "first-oaths": {
    place: "Cold Ford · the Sallow",
    question: "How does a hearth learn to trust a stranger?",
    account:
      "At Cold Ford in RR 1, nineteen hearth communities jointly sealed a stone to hold lawful bargains for any traveler. Grain and remembrance paid the toll. Rotating keepers became the Order of Witnesses, and their station became the first of a network.",
    uncertainty:
      "That the oaths were spoken is attested. Whether the stones themselves listened remains disputed.",
    keeperNote: "A small promise, kept often, can outlast the grandest crown.",
    typeNotes: notes(
      "Before the network, a ford and a fire were the edges of a familiar world.",
      "The first keepers held no kingdom. They held a place for the next witness.",
      "A spoken name made a bargain public; remembrance made it endure.",
      "Writing carried a little of the waystone’s work wherever a traveler could carry it.",
      "The First Witness is a collector’s figure for the keepers who served the nineteen hearths.",
    ),
  },
  "witness-roads": {
    place: "Grey Weir · the Witness Roads",
    question: "What travels farther than the cart?",
    account:
      "The Roads linked sealed waystones, toll stations and keepers. A bargain cut in wax and lead at one station could be attested at another, allowing credit and trade between strangers. Ilthen’s surviving Grey Weir ledgers record RR 2210–2231 in his mortal hand.",
    uncertainty:
      "The Order said the stones recorded. Popular belief said the dead carried the words. Ilthen cannot settle the question.",
    keeperNote:
      "Leave a space in the margin for what the witness could not know.",
    typeNotes: notes(
      "The crossing matters because someone on the farther shore will honor the seal.",
      "Keepers, factors and couriers made distant trust an everyday occupation.",
      "A seal may be answered across mountains; an unanswered seal can stop a caravan.",
      "Lead, wax and a careful hand were the ordinary instruments of an extraordinary network.",
      "Ilthen Vael, Third Recorder, preserves the toll ledgers of his mortal service.",
    ),
  },
  "iron-covenant": {
    place: "The Anvilheights",
    question: "What is the price of a work that cannot fail?",
    account:
      "The Iron Covenant joined deep-folk holds and human client valleys through the Kiln faith. Its metallurgy, masonry, Rune craft and Stone craft produced coveted sealed works. Covenant-forged null-anchors later became instruments of the Severing.",
    uncertainty:
      "The Covenant endured behind closed passes. The chronicler cannot attest every hidden council decision or intention.",
    keeperNote:
      "Admire the workmanship. Then ask what the maker was paid to build.",
    typeNotes: notes(
      "Valleys fed the holds; mountain passes carried their sealed work outward.",
      "Discipline passed from workshop to wall, from a master’s hand to an apprentice’s.",
      "Even a silence may be engineered, and every engineered silence has a cost.",
      "Locks, forges and anchors carry the same uncomfortable question: who commands the work?",
      "The Forgekeeper is an imagined representative of the Covenant’s sealed workshops.",
    ),
  },
  saltwind: {
    place: "The Outer Isles · the Anchorage",
    question: "When does a promise become a debt?",
    account:
      "The Saltwind League governed through shipping compacts rather than a single crown. Its masters of Tide, Storm and Star also mastered pledged cargo and insured keels. Aldery, the Debt-Crowned, mortgaged unborn oaths to finance a trade war.",
    uncertainty:
      "A charter records a promise. It cannot prove that the promised future will arrive.",
    keeperNote:
      "Count the keels in the harbor, not merely the keels on the paper.",
    typeNotes: notes(
      "Harbor mouths and island crossings joined the paper sea to the ordinary one.",
      "A fleet needs pilots, witnesses and someone willing to read the smallest clause.",
      "The fastest answer may reach the harbor before the ship that carried the question.",
      "A charter could circulate like coin. Its price was paid by more than its holder.",
      "Aldery’s recorded debts reached beyond the lives of those who swore them.",
    ),
  },
  deepfen: {
    place: "The Deepfen · the Reedfen margin",
    question: "What does patience preserve?",
    account:
      "The Mire Courts governed the southern wetlands by season, ceremony and patience. They joined the Roads late, used them sparingly and withdrew in RR 2289, before the catastrophe. During the Long Ash, the Deepfen sheltered successive waves of Reedfen refugees.",
    uncertainty:
      "Their early withdrawal is recorded. Why the courts chose that moment is not established here.",
    keeperNote: "The marsh is not empty merely because the road has ended.",
    typeNotes: notes(
      "A wetland keeps older boundaries than the lines a surveyor draws across it.",
      "Those who know the reeds know that shelter need not look like a wall.",
      "Recovery is not a return to the same season; something living always changes.",
      "Ceremony carries memory when a written charter has long since rotted.",
      "The Widow belongs to the tales of the Deepfen; even attributed sayings require care.",
    ),
  },
  reckoning: {
    place: "Reed Ford · the severed network",
    question: "Who pays when a lawful bargain becomes a weapon?",
    account:
      "The Reckoning turned debts and attestation into weapons. In RR 2298, Ossric ordered Reed Ford silenced with null-anchors. Other powers followed. During the Hollowing, stations began to fail even where no anchor had touched them.",
    uncertainty:
      "The chronicler records the failures alongside the calling of soul-collateral. He does not claim to prove what the stones consumed or contained.",
    keeperNote: "A ledger can be exact and still record something monstrous.",
    typeNotes: notes(
      "A silent crossing can divide two neighbors more completely than a mountain.",
      "Some fought for their names; others sought erasure to escape what those names owed.",
      "The loss of a seal could unmake bargains far beyond the battlefield.",
      "A tool that cuts a station from the network also cuts every promise routed through it.",
      "The Provost of the Ninth Terrace is recorded without an attested personal name or unveiled face.",
    ),
  },
  ashfall: {
    place: "The ruined hearthlands",
    question: "What remains when no one is left to attest it?",
    account:
      "After the Failing, the working world shrank to valleys and river reaches. Waystations became ruins. Ilthen walked the broken toll-roads with ledgers, recording what survived. Candles appeared at his door, and the name Ledgerbone followed him.",
    uncertainty:
      "The Long Ash is poorly attested. The cause of the Ashfall and the truth behind the lost workings remain unresolved.",
    keeperNote: "Do not mistake a missing page for an empty year.",
    typeNotes: notes(
      "A quiet stone still gave the traveler somewhere to stop and speak.",
      "Pass-fort families kept their watches for generations before anyone paid them again.",
      "A small act of survival rarely asks whether history will remember it.",
      "A copied title-deed could buy lodging when a crown’s old coin could not.",
      "Ledgerbone is Ilthen Vael, the chronicler. Erilian, your tavern’s keeper, is a different lich.",
    ),
  },
  rekindled: {
    place: "The Sallow · the four new powers",
    question: "Can trust be built without repeating the old debt?",
    account:
      "By RR 2447, roads are being paved again and strangers honor new charters. The Ashen Compact, Reedbound Council, Cinder March and Glass Tide rebuild through workshops, river assemblies, pass-forts and reopened sea routes. They inherit the old world’s habits as well as its warnings.",
    uncertainty:
      "New charters do not establish that the old Witness network has returned. The clearing remains small beside the wide ruin.",
    keeperNote:
      "Keep the fire low, the record honest, and a chair for whoever comes next.",
    typeNotes: notes(
      "A reopened route begins with someone trusting the next hearth to welcome them.",
      "Journeymen, boatwrights, shieldmates and pilots make the new age by doing its ordinary work.",
      "A promise offered in an open square has nowhere convenient to hide.",
      "Reusable kiln-forms and carefully kept charters are quiet marvels of rebuilding.",
      "The Charter’s Keeper is a new collector’s archetype, honoring those who witness the rebuilding.",
    ),
  },
};
const cardVignettes: Record<string, string> = {
  "first-oaths.16":
    "Nineteen fires sent their keepers. The stranger was given a place among them.",
  "witness-roads.16":
    "He kept the numbers in his mortal hand, and kept them after the hand was mortal no longer.",
  "iron-covenant.16":
    "The work would outlast its maker. The maker hoped it would deserve to.",
  "saltwind.16":
    "The harbor glittered with keels. The debt reached farther than the horizon.",
  "deepfen.16":
    "The courts measured the world in seasons. Their neighbors preferred deadlines.",
  "reckoning.16":
    "Nine terraces of offices, and at the highest, a face the record does not show.",
  "ashfall.16":
    "His hands could be broken. There were copies of the ledger buried elsewhere.",
  "rekindled.16":
    "The promise was small enough to keep. That was its strength.",
  "first-oaths.1":
    "The toll was grain and remembrance. No traveler was asked to arrive empty-handed.",
  "witness-roads.1":
    "A straight column, a clean seal, and the patience to begin again.",
  "iron-covenant.1":
    "The mountain gave no praise. The finished work was answer enough.",
  "saltwind.1": "The pilot read the stars; the factor read the fine print.",
  "deepfen.1": "Where a road ended, another kind of knowledge began.",
  "reckoning.1":
    "The quiet at the ford traveled farther than any cry of battle.",
  "ashfall.1":
    "Someone still knew the letters. Someone still taught the children.",
  "rekindled.1":
    "A maker’s mark, passed from hand to hand, became a small reason to trust.",
};
export function cardLore(card: Card) {
  return {
    flavor:
      cardVignettes[card.id] ??
      (card.type === "Hero" && card.number !== 16
        ? `A collector’s imagined champion of ${setLore[card.setId].place}, carrying the promises of an age.`
        : setLore[card.setId].typeNotes[card.type]),
    collectorNote: collectorNotes[card.id] ?? null,
    factions: cardFactionLenses(card.id),
    continuity: setContinuities[card.setId],
    revision: loreRevision,
    chapter: setById[card.setId].chapter.replace(/\.md$/, ""),
    ...setLore[card.setId],
  };
}
export function setCompletion(
  collection: Record<string, number>,
  setId: string,
) {
  const pool = cards.filter((c) => c.setId === setId),
    owned = pool.filter((c) => (collection[c.id] ?? 0) > 0).length;
  return {
    owned,
    total: pool.length,
    percent: Math.round((owned / pool.length) * 100),
  };
}
