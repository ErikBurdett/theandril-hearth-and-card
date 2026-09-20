import type { Card, CardSet, ManaColor, Rarity, Tradition } from "./catalog";
import { composeCard } from "./living-cards";
import { C, S, P, R, H, type LivingEntry } from "./living-expansion-tools";

/** Release 13 · The Quiet (RR 2311–2313), from Book chapter VII. The people,
 * scenes and Heroes are collector additions; the set depicts the attested
 * sequence of the Failing and never chooses among its claimed causes. */
export const quietSet: CardSet = {
  id: "the-quiet",
  code: "QUI",
  name: "The Quiet",
  era: "RR 2311–2313",
  chapter: "VII. The Failing and the Ashfall.md",
  release: 13,
  block: "The Broken Cycle",
  traditions: ["Oath", "Verdancy", "Flame"],
  color: "#a08f62",
  symbol: "◌",
  coverNumber: 22,
  authored: true,
  description:
    "The stones went quiet. Every stranger became a stranger again, and every bargain became local.",
  names: [],
};

export const quietIdentity: {
  colors: [ManaColor, ManaColor];
  archetype: string;
  plan: string;
} = {
  colors: ["grove", "ember"],
  archetype: "Every bargain local",
  plan: "Grow Gather companions with each resource and hold the ground with Rootfast neighbors. Quickstep riders and beacon fires carry the pressure where no stone can.",
};

const at = (rarity: Rarity, entry: Omit<LivingEntry, "rarity">) =>
  ({ ...entry, rarity }) as LivingEntry;
const strand = (tradition: Tradition, entries: LivingEntry[]) =>
  entries.map((entry) => ({ ...entry, tradition }));

/** Collector numbers 1–22 The Quiet Stones, 23–44 The Near Fields, 45–66 Beacon
 * and Rider, 67–72 basics, 73–76 special resources, 77–78 shared cards and
 * 79–80 further Heroes. */
const entries: LivingEntry[] = [
  ...strand("Oath", [
    at(
      "common",
      C(
        "Stone-side Night Keeper",
        "grove",
        1,
        1,
        3,
        "A station keeper sits wrapped in a blanket beside the waystone, lamp lit, listening for an answer that has not come in nine nights.",
        { keywords: ["rootfast"] },
      ),
    ),
    at(
      "common",
      C(
        "Unanswered-seal Courier",
        "ember",
        2,
        2,
        2,
        "A courier gallops from the station with a freshly cut seal in her satchel, carrying by hand the word the stone no longer carries.",
        { keywords: ["haste"] },
      ),
    ),
    at(
      "common",
      C(
        "Hand-clasp Elder",
        "grove",
        2,
        2,
        3,
        "Two neighbors clasp hands over a split tally stick beside the silent stone; the old woman standing between them, not the stone, will remember.",
        { trigger: "gather" },
      ),
    ),
    at(
      "common",
      C(
        "Toll-gate Watchman",
        "ember",
        3,
        3,
        3,
        "At the Grey Weir toll-gate a watchman keeps the bar lowered, turning a stranger's distant seal over in his fingers.",
        { keywords: ["vigilance"] },
      ),
    ),
    at(
      "common",
      C(
        "Waystation Roof-watch",
        "grove",
        4,
        3,
        5,
        "A station hand crouches on the slate roof with a horn, watching the road both ways beneath a signal mast that hangs silent.",
        { keywords: ["reach"] },
      ),
    ),
    at(
      "uncommon",
      C(
        "Rushlight Debt-keeper",
        "grove",
        2,
        1,
        3,
        "By rushlight a keeper notches a new tally for the village's own small debts; the station ledger of distant credit lies closed beside her.",
        { effect: "draw", amount: 1 },
      ),
    ),
    at(
      "uncommon",
      C(
        "Post-horse Messenger",
        "ember",
        3,
        3,
        2,
        "A rider swings onto a fresh horse at a riverside waystation; the message she carries is held in her satchel and her memory.",
        { keywords: ["haste"] },
      ),
    ),
    at(
      "uncommon",
      C(
        "Weigh-clerk of the Quiet Market",
        "grove",
        3,
        2,
        4,
        "A weigh-clerk balances barley against a slab of salt on brass scales in a crowded market, settling a bargain no stone will record.",
        { keywords: ["vigilance"], effect: "heal", amount: 2 },
      ),
    ),
    at(
      "uncommon",
      C(
        "Stranger at the Barred Gate",
        "ember",
        4,
        4,
        3,
        "A mailed traveler waits outside a barred village gate with a sword across his back; no one can say anymore whether he is a merchant or a marcher.",
        { keywords: ["daunt"] },
      ),
    ),
    at(
      "rare",
      C(
        "Warden of the Cold Ford Stone",
        "grove",
        5,
        4,
        6,
        "At Cold Ford an old warden sets her back against the first stone and still swears the village's small bargains before it, for the habit of the thing.",
        { keywords: ["vigilance", "rootfast"], trigger: "gather" },
      ),
    ),
    at(
      "common",
      S(
        "Bar the Station Door",
        "Instant",
        "grove",
        1,
        "shield",
        3,
        "Station hands drag an oak bar across the waystation door as dusk falls on a road that no longer brings news.",
      ),
    ),
    at(
      "common",
      S(
        "Into the Brazier",
        "Instant",
        "ember",
        2,
        "damage",
        3,
        "A keeper flings a forged seal into the brazier; blue wax spits and flares while the forger runs out into the rain.",
      ),
    ),
    at(
      "uncommon",
      S(
        "Take the Lamp at Midnight",
        "Instant",
        "ember",
        1,
        "renew",
        1,
        "A relief keeper takes the lamp from a watchman who has not slept since the stone went quiet and sends him home to bed.",
      ),
    ),
    at(
      "rare",
      S(
        "The Young Smith's Promise",
        "Instant",
        "grove",
        4,
        "pump",
        5,
        "A young smith lays a scarred hand on the quiet waystone and swears to hold the ford; the promise steadies him more than any answer could.",
      ),
    ),
    at(
      "common",
      S(
        "Copy the Station Ledgers",
        "Sorcery",
        "grove",
        3,
        "draw",
        2,
        "Clerks copy the station ledgers by candlelight in a crowded loft, making duplicates to bury in three different places.",
      ),
    ),
    at(
      "uncommon",
      S(
        "Open the Station Stores",
        "Sorcery",
        "grove",
        2,
        "heal",
        5,
        "The station keeper unlocks storerooms meant for travelers and hands out bread and blankets to the village instead.",
      ),
    ),
    at(
      "rare",
      S(
        "Call In the Local Debts",
        "Sorcery",
        "ember",
        4,
        "drain",
        4,
        "With distant credit gone, a moneylender walks the village lane collecting what neighbors can actually pay: grain, iron, a season of labor.",
      ),
    ),
    at(
      "common",
      P(
        "Two Matching Halves",
        "Artifact",
        "grove",
        2,
        "mana-rock",
        "On a market table, a hazel tally stick notched for a whole village's debts is split lengthwise so each neighbor keeps a matching half.",
      ),
    ),
    at(
      "uncommon",
      P(
        "Lamp Kept at the Quiet Stone",
        "Enchantment",
        "grove",
        3,
        "sanctuary",
        "A small clay lamp burns in a niche of the silent waystone; someone refills it every night, though no one says who.",
      ),
    ),
    at(
      "uncommon",
      P(
        "Station Warning Bell",
        "Artifact",
        "ember",
        3,
        "watchfire",
        "Beside the silent waystone a keeper hauls the rope of a bronze bell in a timber frame, sending alarm down the valley instead of attestation.",
      ),
    ),
    at(
      "rare",
      P(
        "For the Habit of the Thing",
        "Enchantment",
        "grove",
        4,
        "anthem",
        "Villagers keep swearing their little bargains at a stone that answers nothing, and the habit holds the valley together.",
      ),
    ),
    H(
      "The Keeper Who Stayed",
      "grove",
      5,
      4,
      [
        [1, "heal", 2],
        [-2, "pump", 3],
        [-6, "rally", 2],
      ],
      "An invented keeper who stayed at her station after the answer stopped, lamp and staff in hand, witnessing her neighbors' bargains by memory alone.",
    ),
  ]),
  ...strand("Verdancy", [
    at(
      "common",
      C(
        "Hedge-gap Forager",
        "grove",
        1,
        1,
        2,
        "A forager slips through a gap in the hawthorn with a basket of sloes and hazelnuts; the market that sold spices now sells what the hedgerow gives.",
        { trigger: "gather" },
      ),
    ),
    at(
      "common",
      C(
        "Flatboat Grower of the Margin",
        "grove",
        2,
        2,
        2,
        "A tenant on the Reedfen margin poles a flat boat heaped with turnips through tall reeds; no warning ever came from upstream.",
        { trigger: "gather" },
      ),
    ),
    at(
      "common",
      C(
        "Granary Stair Keeper",
        "grove",
        3,
        3,
        3,
        "A keeper climbs the outside stair of a timber granary with a lamp, counting the sacks the village must make last until spring.",
        { effect: "heal", amount: 2 },
      ),
    ),
    at(
      "common",
      C(
        "Stubble-field Burner",
        "ember",
        3,
        3,
        2,
        "A farmer drags a burning brand along the stubble at dusk, clearing the field for a second sowing no distant market will buy.",
        { effect: "damage", amount: 1 },
      ),
    ),
    at(
      "common",
      C(
        "Common Pasture Drove",
        "grove",
        4,
        4,
        4,
        "A herd of shaggy cattle shoulders through a broken toll-fence onto the common pasture, driven by children with willow switches.",
        { keywords: ["trample"] },
      ),
    ),
    at(
      "uncommon",
      C(
        "Rook-scare of the Barley Rows",
        "grove",
        2,
        2,
        2,
        "A girl with a sling and a wooden rattle guards the ripening barley from wheeling rooks; the village's winter depends on her aim.",
        { keywords: ["reach"] },
      ),
    ),
    at(
      "uncommon",
      C(
        "Seed-grain Steward",
        "grove",
        3,
        2,
        4,
        "In a cool cellar, a steward seals clay jars of seed-grain with plain village wax, marking each with the household that will sow it.",
        { keywords: ["rootfast"], trigger: "gather" },
      ),
    ),
    at(
      "uncommon",
      C(
        "Market-day Carter",
        "ember",
        3,
        3,
        3,
        "A carter drives a two-wheeled cart piled with cabbages toward the next village's market day before the rain closes the road.",
        { keywords: ["haste"] },
      ),
    ),
    at(
      "uncommon",
      C(
        "Willow-bank Herbalist",
        "grove",
        4,
        3,
        5,
        "An herbalist ties willow-bark cord around a feverish child's wrist in a reed hut; no physician travels upriver now.",
        { keywords: ["lifelink"] },
      ),
    ),
    at(
      "rare",
      C(
        "Sallow Reach Plough Team",
        "grove",
        5,
        4,
        5,
        "Two great horses and a ploughwoman break new ground beside a silent waystation, turning the old toll-meadow into a field.",
        { keywords: ["trample"], trigger: "gather" },
      ),
    ),
    at(
      "common",
      S(
        "All Shoulders to the Wheel",
        "Instant",
        "grove",
        1,
        "pump",
        2,
        "Neighbors put their shoulders to a harvest cart sunk to the axles and heave it free as the first rain falls.",
      ),
    ),
    at(
      "common",
      S(
        "Burn the Blighted Row",
        "Instant",
        "ember",
        1,
        "damage",
        2,
        "A farmer sets a torch to a row of blackened barley before the blight can spread to the rest of the field.",
      ),
    ),
    at(
      "uncommon",
      S(
        "Share the Last Loaf",
        "Instant",
        "grove",
        2,
        "heal",
        4,
        "At a plain table, a family breaks its last loaf into more pieces than there are people in the family.",
      ),
    ),
    at(
      "rare",
      S(
        "Hedge the Field Overnight",
        "Instant",
        "grove",
        2,
        "shield",
        8,
        "By lantern, villagers weave thorn and hazel through the night; by dawn a living hedge stands between the fields and the road.",
      ),
    ),
    at(
      "common",
      S(
        "Bring the Harvest In Early",
        "Sorcery",
        "grove",
        3,
        "rally",
        1,
        "Every hand in the village, old and young, cuts barley by lantern light to beat the first frost.",
      ),
    ),
    at(
      "uncommon",
      S(
        "Carry the Wounded Home",
        "Sorcery",
        "grove",
        2,
        "recall",
        1,
        "Neighbors carry an injured herder home on a wattle hurdle, promising she will walk the hills again by spring.",
      ),
    ),
    at(
      "rare",
      S(
        "Sow the Old Toll-meadow",
        "Sorcery",
        "grove",
        4,
        "draw",
        3,
        "With no tolls left to collect, the whole village ploughs and sows the station meadow, children scattering seed behind the harrow.",
      ),
    ),
    at(
      "common",
      P(
        "Sealed Seed Jar",
        "Artifact",
        "grove",
        2,
        "mana-rock",
        "On a cellar shelf a squat clay jar of seed-grain waits for spring, its lid sealed with a thumbprint in plain village wax instead of a station seal.",
      ),
    ),
    at(
      "uncommon",
      P(
        "Staddle-stone Granary",
        "Artifact",
        "grove",
        3,
        "sanctuary",
        "A timber granary raised on mushroom-shaped staddle stones keeps rats and damp away from the village's winter.",
      ),
    ),
    at(
      "uncommon",
      P(
        "Village Bread Oven",
        "Artifact",
        "ember",
        2,
        "mana-rock",
        "A shared clay oven on the village green, fired once a week while every household waits its turn with trays of dough.",
      ),
    ),
    at(
      "rare",
      P(
        "Room at the Winter Table",
        "Enchantment",
        "grove",
        4,
        "welcome",
        "Every household sets one extra place at the winter table for whoever comes in from the road, and leaves the door on the latch.",
      ),
    ),
    H(
      "Warden of the Reedfen Granaries",
      "grove",
      5,
      4,
      [
        [1, "shield", 2],
        [-2, "recall", 1],
        [-7, "rally", 3],
      ],
      "An invented warden in a reed-green cloak stands on a granary causeway above the Reedfen margin, sickle at her belt and a ledger of shares under her arm.",
    ),
  ]),
  ...strand("Flame", [
    at(
      "common",
      C(
        "Beacon-hill Runner",
        "ember",
        1,
        2,
        1,
        "A barefoot runner races down from the beacon hill, the fire roaring behind him, to tell the valley what the flame means.",
        { keywords: ["haste"] },
      ),
    ),
    at(
      "common",
      C(
        "Middle Reach Outrider",
        "ember",
        2,
        2,
        2,
        "An outrider in a faded Throne tabard reins in at a crossroads, no longer sure whose orders he carries.",
        { keywords: ["daunt"] },
      ),
    ),
    at(
      "common",
      C(
        "Beacon Stoker",
        "ember",
        4,
        4,
        3,
        "A stoker heaves pitch-soaked logs into a hilltop beacon while a second fire flares up on the next ridge.",
        { effect: "damage", amount: 1 },
      ),
    ),
    at(
      "common",
      C(
        "Forge-cart Smith",
        "ember",
        4,
        4,
        4,
        "A traveling smith's cart, forge still glowing, rolls into a village that can no longer order ironwork from the closed mountains.",
        { keywords: ["trample"] },
      ),
    ),
    at(
      "common",
      C(
        "Pass-fort Crossbow Watch",
        "ember",
        2,
        1,
        3,
        "A crossbowman keeps watch from the arrow slit of a small upland pass-fort, the switchback road empty below.",
        { keywords: ["reach"] },
      ),
    ),
    at(
      "uncommon",
      C(
        "Marcher Levy Sergeant",
        "ember",
        3,
        3,
        3,
        "A sergeant musters farm boys with spears at a crossroads, promising pay in grain he has not yet taken.",
        { keywords: ["daunt"] },
      ),
    ),
    at(
      "uncommon",
      C(
        "Relay Captain of the Beacon Line",
        "ember",
        4,
        4,
        3,
        "The captain of a beacon line reads fires on three ridges from the watch-house door, then rides out herself where the brightest flame points.",
        { keywords: ["haste"] },
      ),
    ),
    at(
      "uncommon",
      C(
        "Charcoal Burner of the Old Wood",
        "grove",
        3,
        2,
        4,
        "A charcoal burner tends a smoking earth clamp in an oak wood, making fuel for every forge and beacon in the valley.",
        { trigger: "gather" },
      ),
    ),
    at(
      "uncommon",
      C(
        "Pilot Who Logged the Silence",
        "ember",
        3,
        2,
        3,
        "A League pilot writes by lantern in a moored ship's log, recording only that the Anchorage stone went quiet at dawn, mid-attestation.",
        { effect: "draw", amount: 1 },
      ),
    ),
    at(
      "rare",
      C(
        "Night-ride Torchbearer",
        "ember",
        5,
        5,
        4,
        "The first rider out when every beacon on the Sallow Reach is lit at once, cloak streaming and torch held high.",
        { keywords: ["haste", "daunt"] },
      ),
    ),
    at(
      "common",
      S(
        "Spur the Tired Horse",
        "Instant",
        "ember",
        2,
        "pump",
        3,
        "A courier drives her lathered horse through the last dark mile, the ford lamps finally in sight.",
      ),
    ),
    at(
      "common",
      S(
        "Loose the Fire Arrows",
        "Instant",
        "ember",
        2,
        "damage",
        3,
        "Archers on a pass-fort wall loose flaming arrows into the brush where raiders crouch on the switchback below.",
      ),
    ),
    at(
      "uncommon",
      S(
        "Pull the Rider from the Ford",
        "Instant",
        "ember",
        2,
        "recall",
        1,
        "Villagers wade into a flooded ford with ropes and haul an unhorsed courier back to the bank.",
      ),
    ),
    at(
      "rare",
      S(
        "Burn the Toll Bridge",
        "Instant",
        "ember",
        4,
        "destroy",
        1,
        "Villagers fire the timber toll-bridge rather than let marchers cross; sparks rise into the night above the river.",
      ),
    ),
    at(
      "common",
      S(
        "Rain Pitch from the Pass-fort",
        "Sorcery",
        "ember",
        3,
        "damage",
        4,
        "Defenders tip a cauldron of burning pitch from the pass-fort's gate tower onto the battering ram below.",
      ),
    ),
    at(
      "uncommon",
      S(
        "The Covenant Gate Grinds Shut",
        "Sorcery",
        "ember",
        2,
        "bind",
        1,
        "Behind the last trader through, a great Covenant gate in the mountainside grinds shut; the high road is simply closed.",
      ),
    ),
    at(
      "rare",
      S(
        "The Anchorage Burns",
        "Sorcery",
        "ember",
        5,
        "damage",
        6,
        "In the spring riots, warehouses and pledged ships burn along the Anchorage quays while crowds flee down the harbor wall.",
      ),
    ),
    at(
      "common",
      P(
        "Beacon Flint and Steel",
        "Artifact",
        "ember",
        2,
        "mana-rock",
        "At the foot of a hilltop fire-basket, a beacon watchman strikes flint on steel over a pouch of dry tinder.",
      ),
    ),
    at(
      "uncommon",
      P(
        "The Beacon Line",
        "Enchantment",
        "ember",
        3,
        "watchfire",
        "Fires on a chain of hilltops pass a single warning down the valley faster than any rider.",
      ),
    ),
    at(
      "uncommon",
      P(
        "Banner of the Beacon Watch",
        "Artifact",
        "ember",
        4,
        "anthem",
        "A scorched banner flies over the beacon watch-house; the families who tend the fire sew on a new stripe for every season they hold.",
      ),
    ),
    at(
      "rare",
      P(
        "The Hilltop Fire-basket",
        "Artifact",
        "ember",
        4,
        "watchfire",
        "An iron fire-basket the size of a hut crowns the tallest hill on the reach, stacked with a winter's worth of timber.",
      ),
    ),
    H(
      "Beacon-master of the Sallow Reach",
      "ember",
      5,
      4,
      [
        [1, "damage", 1],
        [-3, "damage", 4],
        [-6, "rally", 2],
      ],
      "An invented beacon-master in a soot-blackened coat stands before a roaring hilltop fire, horn at her hip, reading the answering fires across the dark valley.",
    ),
  ]),
  ...(
    [
      [
        "Sunlit Waystation Yard",
        "dawn",
        "Radiance",
        "Morning sun on the swept yard of a waystation, its stable doors open and its signal mast bare.",
      ],
      [
        "Eel-trap Shallows",
        "tide",
        "Tide",
        "Cold shallows at a river ford, stepping stones and eel traps in the current, a toll-house on the far bank.",
      ],
      [
        "Hillside Cairns of Grey Weir",
        "grave",
        "Grave",
        "Old burial cairns on the hill above the toll-town, heather growing over the stones in the evening mist.",
      ],
      [
        "Beacon Ridge Heath",
        "ember",
        "Flame",
        "A windswept heath ridge of gorse and bracken, a cold beacon basket waiting at its summit.",
      ],
      [
        "Hedged Common Field",
        "grove",
        "Verdancy",
        "A patchwork of strip fields edged with hawthorn hedges, a village and its smoke in the valley beyond.",
      ],
      [
        "Reedfen Margin Plots",
        "grove",
        "Verdancy",
        "Raised vegetable plots between reed channels at the fen's edge, flat boats tied to willow stakes.",
      ],
    ] as const
  ).map(([name, color, tradition, flavor]) => ({
    ...R(name, color, [color], "common", flavor),
    tradition,
  })),
  {
    ...R(
      "Cordwood Clearing",
      "ember",
      ["ember", "grove"],
      "uncommon",
      "A clearing in the oak wood where turf-covered charcoal clamps smoke beside neatly stacked cordwood.",
    ),
    tradition: "Flame",
  },
  {
    ...R(
      "Barter Stalls at the Quiet Stone",
      "grove",
      ["grove", "ember"],
      "uncommon",
      "Market stalls crowd around a plain, unlit standing stone where two roads meet, trading cabbages, cloth and iron nails hand to hand.",
    ),
    tradition: "Oath",
  },
  {
    ...R(
      "Reopened Mill Race",
      "grove",
      ["grove", "dawn"],
      "rare",
      "Morning light on a village mill whose silted race has been dug out again, the wheel turning for the first time in years.",
    ),
    tradition: "Verdancy",
  },
  {
    ...R(
      "Grey Weir Tower, Held Alone",
      "ember",
      ["ember", "grave"],
      "rare",
      "The station tower at Grey Weir above the Sallow at dusk, one high window lit, the road beneath it empty of travelers.",
    ),
    tradition: "Grave",
  },
  {
    ...at(
      "rare",
      P(
        "The Last Morning's Seal",
        "Artifact",
        "grove",
        4,
        "archive",
        "By lamplight a farm family opens a lined wooden box to look at the seal cut on the last morning of RR 2311, never answered.",
      ),
    ),
    tradition: "Oath",
  },
  {
    ...at(
      "rare",
      S(
        "Every Bargain Local",
        "Sorcery",
        "grove",
        5,
        "rally",
        3,
        "On a crowded market day at the ford, farmers, smiths and weavers shake hands over carts and stalls; no station seal is in sight, and every bargain is kept.",
      ),
    ),
    tradition: "Oath",
  },
  {
    ...H(
      "Rider of the Last Relay",
      "ember",
      5,
      4,
      [
        [1, "pump", 2],
        [-2, "damage", 3],
        [-6, "draw", 3],
      ],
      "An invented relay rider in a dust-caked cloak, a satchel of hand-carried letters across his chest, reins in at a ruined waystation at sunset.",
    ),
    tradition: "Flame",
  },
  {
    ...H(
      "Hedge-mother of the Sallow Valley",
      "grove",
      5,
      5,
      [
        [1, "pump", 1],
        [-2, "heal", 5],
        [-6, "rally", 3],
      ],
      "An invented hedge-mother with grey braids and a hazel staff weaves a living hedge around a village while children carry cuttings to her.",
    ),
    tradition: "Verdancy",
  },
];

export const quietCards: Card[] = entries.map((entry, i) =>
  composeCard(quietSet, entry, i, entry.tradition ?? "Oath"),
);

export const quietLore = {
  place: "Grey Weir · the Sallow Reach",
  question:
    "When the far stones fall silent, what can a neighbor still promise?",
  account:
    "On the last day of RR 2311 forty thousand bargains stood attested; by midwinter none did. The great junction stones went quiet first, and every station that routed through them found itself alone. Seals still cut and wax still cooled, but nothing answered. Credit vanished, the League failed, the Throne's word could not outrun rumor, the Covenant closed its passes, and every bargain became local. Ilthen held the Grey Weir tower alone.",
  uncertainty:
    "Three named sources give contradictory first causes: a Throne anchor-working, a lattice drawn past its floor, or only a stone falling silent at dawn. This set depicts the attested sequence, not a cause. The Ashfall of RR 2313 lies at its edge; its cause remains unresolved.",
  keeperNote: "When the far voice stops, listen to the near one.",
  typeNotes: {
    "Basic Resource":
      "When distance failed, a field, a ford and a hedge became the edges of the world again.",
    "Special Resource":
      "A meeting place belongs to more than one road. Its bargains are only as good as the neighbors who keep them.",
    Creature:
      "Keepers, farmers and riders made small promises carry the weight the stones had borne.",
    Instant:
      "A decision made at the gate, the ford or the hedge, with no distant authority to ask.",
    Sorcery:
      "A village's work, done together because no one else would come to do it.",
    Artifact:
      "Tally sticks, jars and beacons: ordinary tools that took up the stones' abandoned work.",
    Enchantment:
      "A habit kept by many hands holds better than a wonder no one can explain.",
    Hero: "A collector's figure for the unnamed people who kept their valleys together.",
  },
};

export const quietContinuity =
  "The Quiet remains RR 2311–2313. The Saltwind Remnant, Wardhall work halls and the Cinder March's pass-forts are later answers to the collapse shown here, and Reedbound memory of the margin began in these years; none of them undoes the Failing or explains its cause.";

export const quietFactions = [
  "faction.saltwind_remnant",
  "faction.wardhall_remnant",
  "faction.iron_covenant",
  "faction.reedbound_council",
  "faction.cinder_march",
] as const;

/** Four card-specific notes, as for every historical volume. */
export const quietNotes: Record<string, string> = {
  "the-quiet.3":
    "A remembered witness replaced an attested seal. The Book records that hearthfolk kept swearing little bargains at quiet stones; this card imagines one of them, not a named event.",
  "the-quiet.24":
    "The Book says the Reedfen tenants fared worse than the Deepfen and remembered who had not warned them. Their heirs appear among the Reedbound; the card does not assign blame.",
  "the-quiet.53":
    "The League pilot's log is one of three sources on the Failing's first hours and names no cause. The pilot is unnamed in the record, and so on this card.",
  "the-quiet.76":
    "Ilthen held the Grey Weir tower alone after the chapter fled. The painting shows the tower, not the recorder, and depicts no attestation after the silence.",
};

/** Ordinary-card recipes: forty basics and fifteen four-copy choices, no mythics. */
export const quietRecipes = [
  {
    id: "near-fields",
    name: "Keep the Near Fields",
    colors: ["grove", "ember"] as ManaColor[],
    sets: ["the-quiet", "rekindled"],
    plan: "Grow Gather companions with each resource, clear a blocker with Ember fire, then rally a wide board. Remove the growing companions early; Skyborne attackers pass over the hedge.",
    basics: ["the-quiet.71", "the-quiet.70"],
    choices: [
      "the-quiet.23",
      "the-quiet.3",
      "the-quiet.24",
      "the-quiet.29",
      "the-quiet.52",
      "the-quiet.25",
      "the-quiet.26",
      "the-quiet.27",
      "the-quiet.32",
      "the-quiet.33",
      "the-quiet.37",
      "the-quiet.12",
      "the-quiet.59",
      "the-quiet.45",
      "rekindled.7",
    ],
  },
  {
    id: "beacon-to-beacon",
    name: "Beacon to Beacon",
    colors: ["ember", "grove"] as ManaColor[],
    sets: ["the-quiet", "ashfall"],
    plan: "Quickstep riders strike before blockers settle, Grove drovers push through, and a beacon fire taxes the opposing hearth each turn. Shields and early lifegain blunt the fire; trade with the riders before Daunt makes blocks awkward.",
    basics: ["the-quiet.70", "the-quiet.71"],
    choices: [
      "the-quiet.45",
      "the-quiet.2",
      "the-quiet.46",
      "the-quiet.28",
      "the-quiet.24",
      "the-quiet.7",
      "the-quiet.50",
      "the-quiet.51",
      "the-quiet.48",
      "the-quiet.27",
      "the-quiet.55",
      "the-quiet.56",
      "the-quiet.12",
      "the-quiet.63",
      "ashfall.39",
    ],
  },
];

export const quietRecipeDeck = (id: string): string[] | undefined => {
  const p = quietRecipes.find((p) => p.id === id);
  return (
    p && [
      ...p.basics.flatMap((id) => Array<string>(20).fill(id)),
      ...p.choices.flatMap((id) => Array<string>(4).fill(id)),
    ]
  );
};
