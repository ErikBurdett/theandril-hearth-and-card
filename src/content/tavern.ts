export const roomNodes = {
  dining: { x: 410, y: 811, label: "The dining wing" },
  kitchen: { x: 315, y: 725, label: "The kitchen hearth" },
  serving: { x: 1100, y: 880, label: "The bar passage" },
  bar: { x: 1220, y: 920, label: "The brewer’s bar" },
  entrance: { x: 800, y: 865, label: "The front door" },
  foyer: { x: 900, y: 795, label: "The welcome rug" },
  east: { x: 1040, y: 737, label: "The counter aisle" },
  counter: { x: 1135, y: 663, label: "The shop counter" },
  middle: { x: 940, y: 645, label: "The center aisle" },
  shelves: { x: 829, y: 532, label: "Booster shelves" },
  north: { x: 667, y: 580, label: "The back aisle" },
  west: { x: 535, y: 637, label: "The reading corner" },
  book: { x: 404, y: 605, label: "The collection lectern" },
  table: { x: 725, y: 755, label: "The dueling table" },
  hearth: { x: 614, y: 791, label: "Beside the hearth" },
} as const;
export type RoomNode = keyof typeof roomNodes;
export const roomLinks: Record<RoomNode, RoomNode[]> = {
  dining: ["hearth", "kitchen"],
  kitchen: ["dining"],
  serving: ["entrance", "bar"],
  bar: ["serving"],
  entrance: ["foyer", "hearth", "serving"],
  foyer: ["entrance", "east", "table"],
  east: ["foyer", "counter", "middle"],
  counter: ["east"],
  middle: ["east", "shelves", "table"],
  shelves: ["middle", "north"],
  north: ["shelves", "west"],
  west: ["north", "book", "hearth"],
  book: ["west"],
  table: ["foyer", "middle", "hearth"],
  hearth: ["table", "entrance", "west", "dining"],
};
export const customerTypes = [
  {
    id: "smith",
    name: "Bera Kilnhand",
    role: "Dwarven smith",
    art: "customer.smith",
    greeting: "A good card is like a good tool. You keep it for years.",
  },
  {
    id: "merchant",
    name: "Orren Sallow",
    role: "Traveling merchant",
    art: "customer.merchant",
    greeting: "The roads brought me three rumors and a little spending money.",
  },
  {
    id: "herbalist",
    name: "Lethiel Fernwake",
    role: "Elven herbalist",
    art: "customer.herbalist",
    greeting:
      "Something from the Deepfen, perhaps. There are stories in those roots.",
  },
  {
    id: "knight",
    name: "Ser Hadrin Fell",
    role: "Cinder March knight",
    art: "customer.knight",
    greeting:
      "I have guarded that pass all winter. Tonight, let us guard a hearth.",
  },
  {
    id: "scholar",
    name: "Mara Quill",
    role: "Traveling scholar",
    art: "customer.scholar",
    greeting:
      "Master Kantonine. I hoped there might be a new chapter on your shelves.",
  },
  {
    id: "sailor",
    name: "Daven Greyquay",
    role: "Glass Tide sailor",
    art: "customer.sailor",
    greeting:
      "Solid ground, a warm room, and a fresh pack. That will do nicely.",
  },
  {
    id: "courier",
    name: "Nessa Reedpath",
    role: "Witness-road courier",
    art: "customer.courier",
    greeting: "One more bridge behind me. A quiet hand before the next.",
  },
  {
    id: "warden",
    name: "Tora Ashward",
    role: "Compact hearth warden",
    art: "customer.warden",
    greeting: "Keep the kettle warm. I brought a few stubborn old stories.",
  },
  {
    id: "antiquarian",
    name: "Vey Mossglass",
    role: "Itinerant antiquarian",
    art: "customer.antiquarian",
    greeting: "Even a broken promise leaves something worth remembering.",
  },

  {
    id: "bard",
    name: "Pella Copperstring",
    role: "Roadside balladeer",
    art: "customer.bard",
    greeting: "A song for the room, a story for my deck.",
  },
  {
    id: "beekeeper",
    name: "Adra Honeyreed",
    role: "Reedbound beekeeper",
    art: "customer.beekeeper",
    greeting:
      "My hives survived the rain. Let us see whether my defenders fare as well.",
  },
  {
    id: "ferryman",
    name: "Hobb Lanternwake",
    role: "Sallow ferryman",
    art: "customer.ferryman",
    greeting: "The last crossing is done. Deal me a little dry land.",
  },
  {
    id: "mason",
    name: "Dorr Slatefoot",
    role: "Covenant stone mason",
    art: "customer.mason",
    greeting: "I build slowly, but my walls tend to stay built.",
  },
  {
    id: "archivist",
    name: "Ysra Paleink",
    role: "Keeper of lost accounts",
    art: "customer.archivist",
    greeting: "Nothing is lost while someone remembers its place.",
  },
  {
    id: "lamplighter",
    name: "Mira Wickward",
    role: "Grey Weir lamplighter",
    art: "customer.courier",
    greeting:
      "Every lamp is lit. Now let us see whose small light lasts longest.",
  },
  {
    id: "potter",
    name: "Jory Claythumb",
    role: "Roadside potter",
    art: "customer.mason",
    greeting: "Clay remembers every careless touch. So does a good opponent.",
  },
  {
    id: "mourner",
    name: "Sella Bellrest",
    role: "Traveling memorial keeper",
    art: "customer.archivist",
    greeting:
      "I carry names, not omens. There is room for joy beside remembrance.",
  },
  {
    id: "glasswright",
    name: "Iven Shardwake",
    role: "Glass Tide glasswright",
    art: "customer.antiquarian",
    greeting: "A little heat, a steady hand, and the river becomes a mirror.",
  },
  {
    id: "hedger",
    name: "Branna Briarstitch",
    role: "Sallow hedge tender",
    art: "customer.herbalist",
    greeting:
      "The path grows back if nobody walks it. Shall we keep a few stories alive?",
  },
  {
    id: "winterguest",
    name: "Odel Rimefolio",
    role: "Northern guestbook scribe",
    art: "customer.scholar",
    greeting:
      "Snow makes every road a blank page. I have come to borrow some ink.",
  },
] as const;
/** Public tactical personalities for rivals; the engine never reads hidden cards for them. */
export const rivalProfiles = [
  "steady",
  "aggressive",
  "defensive",
  "reactive",
  "recursive",
  "evasive",
  "hero",
] as const;
export type RivalProfile = (typeof rivalProfiles)[number];
/** Original tavern guests; adaptations, not canonical historical people. */
export const duelists = (
  [
    {
      customer: "herbalist",
      rivalry: {
        first:
          "Roots come back after a hard winter. So do my companions. Let us see which of us is more patient.",
        won: "You cleared my table twice, and twice it grew back. Patience is a kind of strength.",
        lost: "Well pruned. I will let the fallen rest a while before I ask them to return.",
        drawn:
          "Both gardens bare at once. The ground will keep the seeds for next time.",
      },
      profile: "recursive",
      deck: "recursion",
      manner: "Patient · trades and recovery",
    },
    {
      customer: "sailor",
      rivalry: {
        first:
          "Keep your eyes on the sky, keeper. The river has taught me to go around things.",
        won: "Nothing of yours could reach my gulls. Next time, bring a net.",
        lost: "You found the one wall I could not fly over. Fair sailing, that.",
        drawn:
          "Two ships, one tide, and neither reaches shore first. I have seen stranger crossings.",
      },
      profile: "evasive",
      deck: "tempo",
      manner: "Tricky · Skyborne and responses",
    },
    {
      customer: "smith",
      rivalry: {
        first: "I do not wait for the iron to cool. Expect me early.",
        won: "Struck while it was hot. You will want blockers on the table sooner.",
        lost: "You held the line until my hammer tired. That is good work.",
        drawn: "We both hit the anvil at once. Nobody got the blade.",
      },
      profile: "aggressive",
      deck: "cinder",
      manner: "Direct · quick creature pressure",
    },
    {
      customer: "scholar",
      rivalry: {
        first:
          "I read before I write, and I answer before I act. Cast carefully.",
        won: "Every important spell of yours met a footnote. Perhaps bait me with a lesser one first.",
        lost: "I held my answers too long and the question moved on. Noted, keeper.",
        drawn: "An unfinished chapter. I will bring a sharper pen.",
      },
      profile: "reactive",
      deck: "witness",
      manner: "Studious · answers and card draw",
    },
    {
      customer: "knight",
      rivalry: {
        first:
          "A charge decides more than a siege. I intend to prove it at your table.",
        won: "Your gate opened a turn too late. Hold your defenders back when the March rides.",
        lost: "A charge broken on a patient wall. I salute the wall.",
        drawn: "Two banners down together. The pass has seen such days.",
      },
      profile: "aggressive",
      deck: "cinder",
      manner: "Bold · combat and burn",
    },
    {
      customer: "merchant",
      rivalry: {
        first:
          "Every threat has a price, and I usually carry the coin to remove it.",
        won: "I bought every piece you put down. Bring more than one good bargain.",
        lost: "You offered more than I could buy. A merchant knows when the market has turned.",
        drawn: "Even trade. The ledger balances and nobody profits.",
      },
      profile: "reactive",
      deck: "embers",
      manner: "Relentless · removal and recovery",
    },
    {
      customer: "courier",
      rivalry: {
        first:
          "I keep what I carry. You will have to come through my companions to reach me.",
        won: "You spent your strength on my shields. Try going around them next time.",
        lost: "The bridge held until you found the far bank. A fair delivery.",
        drawn: "Both letters lost in the same river. We will write again.",
      },
      profile: "defensive",
      deck: "lantern",
      manner: "Watchful · protection and responses",
    },
    {
      customer: "warden",
      rivalry: {
        first: "A warm hearth and ready defenders. Come in, and come slowly.",
        won: "My companions outlasted yours. Growth beats haste over a long evening.",
        lost: "You struck before my hearth was warm. Well timed.",
        drawn: "Two tired households. There is still bread for both.",
      },
      profile: "defensive",
      deck: "fellowship",
      manner: "Welcoming · healing and growth",
    },
    {
      customer: "antiquarian",
      rivalry: {
        first:
          "What falls at my table tends to be remembered, and what is remembered tends to return.",
        won: "Every companion you removed came back with a grudge. Answer the memory, not just the card.",
        lost: "You left nothing worth recovering. A tidy, cruel victory.",
        drawn: "Two empty shelves. Something will be found for next time.",
      },
      profile: "recursive",
      deck: "embers",
      manner: "Persistent · mourning and removal",
    },

    {
      customer: "bard",
      rivalry: {
        first:
          "My songs need a lead. Expect a Hero on the table before the second verse.",
        won: "The chorus carried it. Strike the singer before the song gets going.",
        lost: "You silenced my lead early. The rest of the band could not carry it.",
        drawn: "A duet with no ending. Audiences hate those.",
      },
      profile: "hero",
      deck: "shelter",
      manner: "Welcoming · arrivals, recovery and rally",
    },
    {
      customer: "beekeeper",
      rivalry: {
        first: "The hive swarms before the keeper is ready. So do I.",
        won: "A swarm early is worth a dragon late. Block small, block early.",
        lost: "You smoked the hive calm before it could sting. Clever keeper.",
        drawn: "Both of us stung out at once. The honey keeps.",
      },
      profile: "aggressive",
      deck: "wildfire",
      manner: "Brisk · growth and early pressure",
    },
    {
      customer: "ferryman",
      rivalry: {
        first:
          "I take the quiet crossings. Watch for what comes over the water, not across it.",
        won: "You guarded the road and I took the river. A ferryman's habit.",
        lost: "You met me at the landing with a lantern. Nothing to be done about that.",
        drawn: "The current took both boats. We will meet on the far bank.",
      },
      profile: "evasive",
      deck: "river",
      manner: "Flowing · evasion and recovery",
    },
    {
      customer: "mason",
      rivalry: {
        first: "I lay each stone where it will stay. Try moving one.",
        won: "You wore yourself out on my wall. Walls are what I do.",
        lost: "You found the loose stone. Every wall has one, if you are patient.",
        drawn: "Two walls, no roof. Still a dry night.",
      },
      profile: "defensive",
      deck: "relics",
      manner: "Deliberate · relics and lasting defenders",
    },
    {
      customer: "archivist",
      rivalry: {
        first: "I keep an account of every threat. Most of them end up filed.",
        won: "Each of your important spells was noted and answered. Vary the ledger.",
        lost: "I answered the wrong page. The account is yours this time.",
        drawn: "A ledger closed in balance. Rare, and oddly satisfying.",
      },
      profile: "reactive",
      deck: "binding",
      manner: "Measured · answers and remembered threats",
    },
    {
      customer: "lamplighter",
      rivalry: {
        first:
          "A small light that cannot be reached outlasts a big one that can.",
        won: "You never reached my lamps. Bring something that can climb.",
        lost: "You had the reach to snuff every wick. Dark, but fair.",
        drawn: "Both lamps out together. Dawn will come anyway.",
      },
      profile: "evasive",
      deck: "candlewatch",
      manner: "Watchful · protection and evasion",
    },
    {
      customer: "potter",
      rivalry: {
        first: "I shape fast and fire early. Slow hands lose the pot.",
        won: "Fired before you set. Keep a blocker for the first kiln.",
        lost: "You let my clay cool. A patient hand beats a quick one, sometimes.",
        drawn: "Both pots cracked in the kiln. There is more clay.",
      },
      profile: "aggressive",
      deck: "kiln",
      manner: "Impatient · quick pressure and growth",
    },
    {
      customer: "mourner",
      rivalry: {
        first:
          "I defend what I carry, and I carry a great deal. Take your time.",
        won: "Each companion you sent was met and remembered. Try the air, or many at once.",
        lost: "You broke through the quiet. I will add this evening to my names.",
        drawn: "Both bells rung at once. A strange, fair silence.",
      },
      profile: "defensive",
      deck: "funeral",
      manner: "Gentle · defense and recovery",
    },
    {
      customer: "glasswright",
      rivalry: {
        first:
          "My Hero is the mirror; my spells are the light. Watch which one you answer.",
        won: "You spent your answers on my spells, and my Hero finished the work. Mind the mirror.",
        lost: "You broke the mirror before it caught the light. Cleanly done.",
        drawn:
          "Two mirrors facing. Nobody can tell which reflection fell first.",
      },
      profile: "hero",
      deck: "mirror",
      manner: "Cunning · spellcraft and responses",
    },
    {
      customer: "hedger",
      rivalry: {
        first: "Cut my hedge if you like. Hedges grow back thicker.",
        won: "Every trade favored the briar. Do not fight me stem for stem.",
        lost: "You went over rather than through. The hedge admits defeat.",
        drawn: "Both paths overgrown. We will cut them again.",
      },
      profile: "recursive",
      deck: "thicket",
      manner: "Stubborn · trades and recursion",
    },
    {
      customer: "winterguest",
      rivalry: {
        first:
          "I write slowly and answer only what matters. Do not expect me to waste ink.",
        won: "I answered the few spells that counted and let the rest drift. Keep your ink dry.",
        lost: "I held my answers for a storm that never came. A page for you, keeper.",
        drawn: "Snow on both ledgers. The season decides nothing.",
      },
      profile: "reactive",
      deck: "winter",
      manner: "Patient · restraint and drain",
    },
  ] satisfies {
    customer: string;
    profile: RivalProfile;
    deck: string;
    manner: string;
    /** Original tavern lines, chosen by the saved record: first meeting, after the guest won, after the guest lost, after a draw. */
    rivalry: { first: string; won: string; lost: string; drawn: string };
  }[]
).map((p) => ({ ...p, ...customerTypes.find((c) => c.id === p.customer)! }));
export const stations: {
  id: RoomNode;
  tab: string;
  title: string;
  hint: string;
  key: string;
}[] = [
  {
    id: "counter",
    tab: "Stockroom",
    title: "Shop counter",
    hint: "Order stock & set prices",
    key: "1",
  },
  {
    id: "book",
    tab: "Card collection",
    title: "Your grimoire",
    hint: "Collection & deck building",
    key: "2",
  },
  {
    id: "shelves",
    tab: "Booster packs",
    title: "Booster shelves",
    hint: "Break a seal",
    key: "3",
  },
  {
    id: "table",
    tab: "Duel table",
    title: "The card table",
    hint: "Meet the tavern’s card players",
    key: "4",
  },
];

const tableTalk = [
  "A warm seat is worth more than a hurried bargain.",
  "Have any travelers brought a new tale today?",
  "One pack for the road. Perhaps two, if the rain holds.",
  "I keep my favorite card wrapped in spare wool.",
  "The kettle makes a kinder sound than the weather outside.",
  "Even an ordinary story can win the right hand.",
  "I promised myself I would sort my collection before buying more.",
  "There is always room for one more good tale.",
];
export function customerDialogue(
  customer: { kind: number; id: number; phase: string; purchased: boolean },
  day: number,
) {
  const person = customerTypes[customer.kind];
  if (customer.purchased)
    return [
      "A fair trade. Keep a seat for my next visit.",
      "Safely wrapped, thank you. I shall open this by the fire.",
      "May the next guest find something just as lovely.",
    ][(customer.id + day) % 3];
  if (customer.phase === "checkout")
    return [
      "These stories, please. I have counted my crowns twice.",
      "I have made my choice. That seal has been calling to me.",
      "Could you keep the wrapping? The road is wet tonight.",
    ][(customer.id + day) % 3];
  return (customer.id + day) % 3 === 0
    ? person.greeting
    : tableTalk[(customer.id * 3 + customer.kind + day) % tableTalk.length];
}
