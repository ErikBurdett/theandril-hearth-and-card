import type { CardSet, ManaColor } from "./catalog";

/** Present cultures adopted from Theandril f07024fe. Set groupings and card
 * characters are collector adaptations, not alliances or historical testimony. */
export const livingRevision = "f07024fe";
export const livingSetIdentities: Record<
  string,
  { colors: [ManaColor, ManaColor]; archetype: string; plan: string }
> = {
  "shared-measure": {
    colors: ["dawn", "tide"],
    archetype: "Maintain the common works",
    plan: "Protect a patient hearth, bind an attacker, then ready your own defenders. Recordwork rewards maintained relics with fresh cards.",
  },
  "terms-of-shelter": {
    colors: ["dawn", "grave"],
    archetype: "Service with an ending",
    plan: "Welcome companions, trade protectors and recover them to hand. Gain life through care while measured drain closes a stalled game.",
  },
  "unclaimed-ways": {
    colors: ["grove", "tide"],
    archetype: "A route for every household",
    plan: "Build a broad fellowship around Welcome and Gather. Highguard holds the sky; Rootfast resists return spells while a timely rally opens the way.",
  },
  "unfinished-answer": {
    colors: ["tide", "ember"],
    archetype: "Test, answer, rebuild",
    plan: "Hold mana for a counter or focused damage, grow Spellcraft companions and draw another answer. Recovery returns a traded threat to hand.",
  },
};

export const livingSets: CardSet[] = [
  {
    id: "shared-measure",
    code: "MSR",
    name: "The Shared Measure",
    era: "RR 2447 · present-day folio",
    chapter: "FACTION_BIBLE.md",
    source: "FACTION_BIBLE.md",
    sourceTitle: "Faction Bible · Part II",
    release: 9,
    block: "Living Cultures",
    traditions: ["Oath", "Tide", "Rune"],
    color: "#719899",
    symbol: "≋",
    coverNumber: 18,
    folio: true,
    description:
      "Who may draw from works that everyone must maintain? Cistern Assembly, Red Sluice Directorate and Brine Choir disagree over access, schedules and shared water.",
    names: [],
  },
  {
    id: "terms-of-shelter",
    code: "TRM",
    name: "Terms of Shelter",
    era: "RR 2447 · present-day folio",
    chapter: "FACTION_BIBLE.md",
    source: "FACTION_BIBLE.md",
    sourceTitle: "Faction Bible · Part II",
    release: 10,
    block: "Living Cultures",
    traditions: ["Oath", "Radiance", "Grave"],
    color: "#9d777a",
    symbol: "⌂",
    coverNumber: 12,
    folio: true,
    description:
      "When may a household end its service? The Unsealed Companies, Lantern Hospices and Vesper Court offer sharply different answers about care, protection and inherited obligation.",
    names: [],
  },
  {
    id: "unclaimed-ways",
    code: "WAY",
    name: "The Unclaimed Ways",
    era: "RR 2447 · present-day folio",
    chapter: "FACTION_BIBLE.md",
    source: "FACTION_BIBLE.md",
    sourceTitle: "Faction Bible · Part II",
    release: 11,
    block: "Living Cultures",
    traditions: ["Stone", "Verdancy", "Spirit"],
    color: "#879475",
    symbol: "⋔",
    coverNumber: 6,
    folio: true,
    description:
      "Who keeps a route open for unlike bodies? Cairnwing Concord, Underhush Exchange and Manytrack Moot negotiate the labor, habitability and passage behind a journey.",
    names: [],
  },
  {
    id: "unfinished-answer",
    code: "ANS",
    name: "The Unfinished Answer",
    era: "RR 2447 · present-day folio",
    chapter: "FACTION_BIBLE.md",
    source: "FACTION_BIBLE.md",
    sourceTitle: "Faction Bible · Part II",
    release: 12,
    block: "Living Cultures",
    traditions: ["Star", "Flame", "Rune"],
    color: "#ab8265",
    symbol: "⟐",
    coverNumber: 18,
    folio: true,
    description:
      "Who bears the cost of an uncertain answer? Velvet Meridian, Emberwake Convocation and Margin Observance contest records, renewal and the price of experiments.",
    names: [],
  },
];

const adaptation =
  "These six cards are newly authored collector adaptations of civic roles and disputes. Their people are unnamed additions, their spells are game interpretations, and their Heroes do not establish proposed character biographies.";
export const livingFactions = [
  {
    id: "faction.cistern_assembly",
    name: "Cistern Assembly",
    setId: "shared-measure",
    first: 1,
    era: "Present culture · RR 2447",
    place: "Dry-country wells and shade galleries",
    summary:
      "Well keepers, gardeners and caravan households organize the maintenance of shared water. Membership is a public question about work and drawing rights.",
    tension:
      "Families with inherited drawing rights resist newcomers who claim membership through maintenance. A repaired cistern does not decide who may use it.",
    relations:
      "Synod seed contracts need public terms; Sable camps need temporary access that does not turn a stay into ownership.",
    materials:
      "Human households; limewashed stone, turquoise cloth, rust cord and glazed jars. The public measure has three notches.",
    lens:
      "Dawn protection and Tide recordwork make maintenance a playable choice. Shield protects the hearth, not a water supply. " +
      adaptation,
  },
  {
    id: "faction.red_sluice",
    name: "Red Sluice Directorate",
    setId: "shared-measure",
    first: 7,
    era: "Present culture · RR 2447",
    place: "Canal works and outlying wetland households",
    summary:
      "Waterworks crews and labor boards sustain gates, pumps and difficult common schedules.",
    tension:
      "Central pumping schedules burden marginal households. Emergency boards may prolong the authority that an emergency gave them.",
    relations:
      "Reedbound rejects permanent command over the wetlands. Cinder machinery brings help with expensive obligations attached.",
    materials:
      "Human crews; brick red, celadon, tarred oak, chains, rectangular rain shields and low gantries.",
    lens:
      "Binding and renewal adapt disputed access into companion timing. These cards do not establish a power to flood enemy lands. " +
      adaptation,
  },
  {
    id: "faction.brine_choir",
    name: "Brine Choir",
    setId: "shared-measure",
    first: 13,
    era: "Present culture · RR 2447",
    place: "Paired pool courts and shared shore landings",
    summary:
      "Brinefolk and human shore households hear proposals through a political choir. A hearing procedure is not a shared mind.",
    tension:
      "Permanent quays threaten shared pool rights. An investment can quietly become an enclosure.",
    relations:
      "Saltwind funding may restrict landings; Glass Tide treats navigational charts as goods that can be sold.",
    materials:
      "Brinefolk have matte blue-grey skin, small folded neck fins, two legs and dexterous hands. Eelgrass cloth, coral clay, slate and shell accompany human neighbors.",
    lens:
      "Welcome and a returning tide interpret hospitality and contested access. No innate amphibious access or underwater city is asserted. " +
      adaptation,
  },
  {
    id: "faction.unsealed_companies",
    name: "Unsealed Companies",
    setId: "terms-of-shelter",
    first: 1,
    era: "Present culture · RR 2447",
    place: "Wagon courts and road-town repair yards",
    summary:
      "Veterans and civilian households reject ancestral oath-debt. The people doing the work seek control over its coin.",
    tension:
      "Veterans resist town taxation while resident families demand a say in campaign spending. Ending an old obligation does not settle the next bargain.",
    relations:
      "Cinder distrusts companies without its charters; Ashen settlers still need reliable escorts.",
    materials:
      "Human workers and veterans; faded vermilion, canvas, pewter, reused plate and roll cases. Their broken seal differs from Saltwind's broken keel.",
    lens:
      "Steadfast protection and limited recovery make civilian service matter at the table. There is no automatic mercenary income. " +
      adaptation,
  },
  {
    id: "faction.lantern_hospices",
    name: "Lantern Hospices",
    setId: "terms-of-shelter",
    first: 7,
    era: "Present culture · RR 2447",
    place: "Ventilated care houses and open courts",
    summary:
      "Attendants maintain clean stores and refuge, with paid escorts keeping ordinary supply journeys possible.",
    tension:
      "Open-door attendants resist permanent quarantine becoming a reason to exclude the people a care house should serve.",
    relations:
      "Synod death expertise can help without settling its authority. Wardhall inspection can protect a household or confine it. Lantern attendants contest coerced Vesper blood provisions.",
    materials:
      "Human attendants and escorts; beeswax yellow, washed blue, plain linen, shuttered lamps and open ventilation.",
    lens:
      "Hearth healing and Welcome reward care; renewal readies a companion. These are not disease immunity or automatic resurrection. " +
      adaptation,
  },
  {
    id: "faction.vesper_court",
    name: "Vesper Court",
    setId: "terms-of-shelter",
    first: 13,
    era: "Present culture · RR 2447",
    place: "Shuttered vineyard estates and wooded valleys",
    summary:
      "Blood-dependent arrested-dead patrons live alongside living human households. Their court preserves long memories and contested provisions.",
    tension:
      "Tenants want to revoke blood provisions without losing their homes. Younger patrons challenge the authority of ancestral recollection.",
    relations:
      "Lantern opposes coercion, Synod demands mortuary ranking and Morrow bargains over old woods. Vesper is distinct from the Synod.",
    materials:
      "Living retainers accompany vampiric patrons; garnet, tarnished silver, charcoal velvet, cool ivory and shuttered windows. An open silver vessel sits below unequal dusk bars.",
    lens:
      "Bounded Drain is a paid card effect, not an innate power assigned to every court member. The living retainer is human; the Hero is an imagined vampiric patron. " +
      adaptation,
  },
  {
    id: "faction.cairnwing_concord",
    name: "Cairnwing Concord",
    setId: "unclaimed-ways",
    first: 1,
    era: "Present culture · RR 2447",
    place: "Scree passes, lift halls and lower ports",
    summary:
      "Feathered cairnfolk and human lift-port households depend on maintained passages between high councils and the workers below.",
    tension:
      "Upper roost councils claim precedence; lower workers maintain the lifts that let those councils survive.",
    relations:
      "Rimehorn needs dependable passage. Covenant buyers seek exclusive rights over the lifts.",
    materials:
      "Cairnfolk have short beaks, two legs and two dexterous arms with folded forearm feather fans. Tawny feathers, oxblood cord, copper, pale scree and harnesses.",
    lens:
      "Highguard represents watched approaches, not automatic flight. The lower-port rigger is human; cairnfolk remain tool-using, grounded people. " +
      adaptation,
  },
  {
    id: "faction.underhush_exchange",
    name: "Underhush Exchange",
    setId: "unclaimed-ways",
    first: 7,
    era: "Present culture · RR 2447",
    place: "Habitable galleries and surface markets",
    summary:
      "Burrowfolk and surface traders bargain over repair, smoke, vibration and the price of usable living space.",
    tension:
      "Hot, noisy markets compete with the habitability of the galleries that support them. A lucrative lease can make a home unlivable.",
    relations:
      "Covenant fittings arrive with privileged terms; Morrow contests damage to roots. Burrowfolk are distinct from Covenant deep-folk.",
    materials:
      "Upright, short, compact furred burrowfolk have broad fingered hands, rounded ears and blunt faces. Clay brown, pewter, lime, tally beads, keyhole arches and vents.",
    lens:
      "Rootfast and Recordwork adapt maintained homes and tools. There are no automatic tunnels, secret shortcuts or tremor sight. " +
      adaptation,
  },
  {
    id: "faction.manytrack_moot",
    name: "Manytrack Moot",
    setId: "unclaimed-ways",
    first: 13,
    era: "Present culture · RR 2447",
    place: "Forest-steppe routes and shared thresholds",
    summary:
      "Speaking horned and furred peoples, together with humans, negotiate routes for bodies and households with different needs.",
    tension:
      "Crop fences interrupt seasonal passage. A signature from one household cannot speak for all the people using a path.",
    relations:
      "Sable may mistake nonhuman use for empty land. Morrow seeks cutting agreements that nobody has been delegated to give.",
    materials:
      "Upright deerlike guards, foxlike scouts, boarlike marshals and human neighbors; bark black, tawny hide, moss blue, linen, crossed cords and varied-height doors.",
    lens:
      "Welcome and Rally reward a fellowship of persons. Horned and furred characters are speaking citizens, not beasts with handlers. " +
      adaptation,
  },
  {
    id: "faction.velvet_meridian",
    name: "Velvet Meridian",
    setId: "unfinished-answer",
    first: 1,
    era: "Present culture · RR 2447",
    place: "Weaving schools and low observatories",
    summary:
      "Weavers, navigators and school households maintain measured knowledge through observation, material work and disputed interpretation.",
    tension:
      "Public observers want shared records; patrons claim exclusive interpretations of the same measurements.",
    relations:
      "Glass Tide wants shared charts. Synod claims older measures while resisting their inspection.",
    materials:
      "Human school households; madder, smoke silver, blue-black cloth, weighted hems, calibrated discs and low round observatories.",
    lens:
      "Drawing and countering express provisional answers at the table. No card confirms prophecy or access to unseen knowledge. " +
      adaptation,
  },
  {
    id: "faction.emberwake_convocation",
    name: "Emberwake Convocation",
    setId: "unfinished-answer",
    first: 7,
    era: "Present culture · RR 2447",
    place: "Ash-country gardens and kiln compounds",
    summary:
      "Seed keepers and kiln congregations sustain difficult livelihoods. Their disagreements concern renewal and the people who pay for failure.",
    tension:
      "Traveling teachers advocate abandonment or burning while resident gardeners bear the loss. Renewal is a claim under dispute.",
    relations:
      "Cinder fears threatened routes; Ashen workshops buy ceramics. Neither bargain explains what caused the Ashfall.",
    materials:
      "Human gardeners and kiln workers, not elementals or undead; ash-white ceramic screens, smoked orange, sulfur-green straps, seed jars and low firebreaks.",
    lens:
      "Paid damage and recovery translate opposed approaches to renewal. Mechanics do not prove natural fire powers or resolve the Ashfall. " +
      adaptation,
  },
  {
    id: "faction.margin_observance",
    name: "Margin Observance",
    setId: "unfinished-answer",
    first: 13,
    era: "Present culture · RR 2447",
    place: "Archive stations and disputed sealed works",
    summary:
      "Copyists, custodians and supply households preserve incomplete records while deciding whether a sealed work should be opened.",
    tension:
      "Preservation competes with risky experiment. Supporting households demand accountability for grain spent pursuing an uncertain result.",
    relations:
      "Wardhall wants safeguards and Synod seeks irreplaceable records. Neither demand settles what a lost mechanism once did.",
    materials:
      "Human custodians; parchment grey, cinnabar, ink black, weathered lead, document cases, interrupted stripes and slab roofs.",
    lens:
      "Recordwork and held responses make uncertainty a timing choice. These cards do not restore Witnessry or master the Void. " +
      adaptation,
  },
].map(({ setId, first, ...faction }) => ({
  ...faction,
  cards: Array.from({ length: 6 }, (_, i) => `${setId}.${first + i}`),
}));

export const livingSetFactions = Object.fromEntries(
  livingSets.map((s) => [
    s.id,
    livingFactions
      .filter((f) => f.cards[0].startsWith(s.id + "."))
      .map((f) => f.id),
  ]),
);
export const livingContinuities = Object.fromEntries(
  livingSets.map((s) => [
    s.id,
    "This folio depicts present cultures at RR 2447 from the adopted Faction Bible, Part II. Its grouping compares a civic question; it does not establish an alliance, a founding date or a part in Ilthen's earlier testimony. Card characters and magic are collector adaptations; named character seeds remain proposals.",
  ]),
);

const accounts = [
  [
    "Shared wells, canal works and shore pools",
    "Who may draw from what everyone maintains?",
    "Cistern membership, Directorate schedules and Choir landing rights put different obligations around common water. A public hearing can recognize maintenance without resolving whose household must go without. These societies are neighbors in a collector's argument, not an attested coalition.",
  ],
  [
    "Road towns, care houses and vineyard courts",
    "When can a promise of service end?",
    "Unsealed civilian audits, Lantern care and Vesper blood provisions make the end of an obligation a matter of daily life. Hospices dispute coercion by the Court; setting their cards together preserves that conflict rather than making them allies.",
  ],
  [
    "Scree lifts, ventilated galleries and forest-steppe paths",
    "Who is a road built to admit?",
    "Cairnwing lift workers, Underhush householders and Manytrack speakers each ask who maintains passage and who gets left outside it. Their bodies and homes differ. Roads depend on work, negotiated access and many voices rather than a single natural entitlement.",
  ],
  [
    "Measured skies, seed gardens and archive stations",
    "Who pays when an answer remains uncertain?",
    "Velvet observations, Emberwake renewal teachings and Margin experiments all require other households' time and provision. None is a final explanation of the broken world. A preserved failed result may be more honest than a persuasive complete story.",
  ],
];
export const livingSetLore = Object.fromEntries(
  livingSets.map((s, i) => [
    s.id,
    {
      place: accounts[i][0],
      question: accounts[i][1],
      account: accounts[i][2],
      uncertainty:
        "The current Faction Bible adopts these cultures, but proposed named biographies remain unconfirmed. Their card spells are interpretations. The Roads' mechanisms, disputed origins and cause of the Ashfall remain unresolved.",
      keeperNote:
        "A focused 24-card folio with six cards for each of three cultures and six resources. Combine its two-aspect strategy with older volumes; the grouping is a collector's comparison, not a canonical alliance.",
      typeNotes: {
        "Basic Resource":
          "An imagined view of an ordinary place supporting present households; the resource's mana is a card interpretation.",
        "Special Resource":
          "A collector's imagined place of negotiated access. Flexibility costs time at the table: this resource arrives exhausted.",
        Creature:
          "An unnamed, newly imagined civic worker or protector of a registered culture; this card adds no attested biography.",
        Instant:
          "A collector's imagined intervention in a present civic dispute; the depicted spell is not a historical record.",
        Sorcery:
          "An invented card ritual drawing on a culture's difficult choices, without proving that its society performs this magic.",
        Artifact:
          "An imagined working object made in an adopted culture's material language; the card's ability is an adaptation.",
        Enchantment:
          "A collector's lasting magical interpretation of an ordinary promise; no universal faction power is asserted.",
        Hero: "An unnamed, imagined champion of a present household. The card establishes neither a canonical officeholder nor a proposed biography.",
      },
    },
  ]),
);
