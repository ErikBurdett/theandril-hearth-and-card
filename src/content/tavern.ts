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
/** Original tavern guests; adaptations, not canonical historical people. */
export const duelists = [
  {
    customer: "herbalist",
    deck: "recursion",
    manner: "Patient · trades and recovery",
  },
  {
    customer: "sailor",
    deck: "tempo",
    manner: "Tricky · Skyborne and responses",
  },
  {
    customer: "smith",
    deck: "cinder",
    manner: "Direct · quick creature pressure",
  },
  {
    customer: "scholar",
    deck: "witness",
    manner: "Studious · answers and card draw",
  },
  { customer: "knight", deck: "cinder", manner: "Bold · combat and burn" },
  {
    customer: "merchant",
    deck: "embers",
    manner: "Relentless · removal and recovery",
  },
  {
    customer: "courier",
    deck: "lantern",
    manner: "Watchful · protection and responses",
  },
  {
    customer: "warden",
    deck: "fellowship",
    manner: "Welcoming · healing and growth",
  },
  {
    customer: "antiquarian",
    deck: "embers",
    manner: "Persistent · mourning and removal",
  },

  {
    customer: "bard",
    deck: "shelter",
    manner: "Welcoming · arrivals, recovery and rally",
  },
  {
    customer: "beekeeper",
    deck: "wildfire",
    manner: "Brisk · growth and early pressure",
  },
  {
    customer: "ferryman",
    deck: "river",
    manner: "Flowing · evasion and recovery",
  },
  {
    customer: "mason",
    deck: "relics",
    manner: "Deliberate · relics and lasting defenders",
  },
  {
    customer: "archivist",
    deck: "binding",
    manner: "Measured · answers and remembered threats",
  },
  {
    customer: "lamplighter",
    deck: "candlewatch",
    manner: "Watchful · protection and evasion",
  },
  {
    customer: "potter",
    deck: "kiln",
    manner: "Impatient · quick pressure and growth",
  },
  {
    customer: "mourner",
    deck: "funeral",
    manner: "Gentle · defense and recovery",
  },
  {
    customer: "glasswright",
    deck: "mirror",
    manner: "Cunning · spellcraft and responses",
  },
  {
    customer: "hedger",
    deck: "thicket",
    manner: "Stubborn · trades and recursion",
  },
  {
    customer: "winterguest",
    deck: "winter",
    manner: "Patient · restraint and drain",
  },
].map((p) => ({ ...p, ...customerTypes.find((c) => c.id === p.customer)! }));
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
