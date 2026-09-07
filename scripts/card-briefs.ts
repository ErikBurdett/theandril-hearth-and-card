import { mkdir, writeFile, readFile } from "node:fs/promises";
import { cards, sets } from "../src/content/catalog";
import { cardLore } from "../src/content/lore";
const settings: Record<string, string> = {
  "first-oaths":
    "Cold Ford beside the river Sallow in the Age of First Oaths: small timber hearth settlements, grain shares, tally sticks, oath stones, humble wool and leather, gold dawn and sage green. The first standing service was jointly established by nineteen hearths; whether the stones listen is disputed.",
  "witness-roads":
    "The late Witness Roads: paved stone causeways, seal-cutting waystations, scholarly travelers, bound ledgers and astronomical brass instruments, weathered slate, mist blue and candle ivory. Show witnessed practice, not proof of a cosmic network.",
  "iron-covenant":
    "The Iron Covenant in the Anvil heights: basalt mountain halls, smiths, waterwheels, iron tools and rune-cut stone; copper orange furnaces against slate and brass. Medieval skilled craft, not steampunk or modern industry.",
  saltwind:
    "The Saltwind League and Outer Isles: medieval sea quays, salt-worn timber, charts, rope, small sailing vessels and mercantile debt seals; deep teal water, indigo storms and amber lanterns.",
  deepfen:
    "The Mire Courts of Deepfen before their recorded withdrawal in RR 2289: willow roots, reed paths, quiet marsh water, moss courts and verdant spirit traditions. Jade, muted violet and firefly gold. Their reasons for withdrawing remain unknown.",
  reckoning:
    "The Reckoning, RR 2291–2311: chalk terraces, witness records, abandoned halls, oath severance and grave traditions; bone ivory, muted plum and blue flame. Do not explain disputed motives or the cause of the later Ashfall.",
  ashfall:
    "The Long Ash, RR 2313–2443: weathered ruins, ember-lit shelters and fragile survivors preserving memory, russet ash, charcoal, twilight violet and one stubborn warm light. Depict aftermath only: the cause of Ashfall is unknown.",
  rekindled:
    "Modern Theandril RR 2447: rebuilt ford towns and warm hearths beside the Sallow, new charters and traveling craftspeople. Ashen Compact hearth gold, Reedbound reed green, Cinder March burned rose and Glass Tide sea grey. A cozy world rebuilding, not proof the old network returned.",
};
const action: Record<string, string> = {
  damage:
    "Show a focused magical strike with a clear source and destination, embers or aspect-colored energy; no gore.",
  heal: "Show a protective or restorative act with warm living light and a visibly comforted subject.",
  draw: "Show discovery of a remembered account: illuminated pages, witnesses, a revealed chart or knowledge brought into light; no readable text.",
  destroy:
    "Show an opposing magical creature losing cohesion into harmless motes, a clear severed tether, no gore.",
  bounce:
    "Show a traveler or creature drawn back along a luminous path or through a rippling ford.",
  counter:
    "Show an incoming spell broken against a raised seal, with distinct opposing arcs of energy.",
  pump: "Show allies gathering strength together, a brighter silhouette and a shared protective or martial gesture.",
  recall:
    "Show an ancestral creature or remembered companion reforming from a lantern-lit memorial, gentle ghostly light.",
  shield:
    "Show a translucent protective boundary sheltering a small hearth against danger outside.",
  bind: "Show magical bands of light gently arresting a moving companion or ship escort, with a clear tether and opposing gesture.",
  renew:
    "Show a tired guardian rising to their feet as restricting cords dissolve in warm light.",
  drain:
    "Show a measured stream of ghostly light flowing from an opposing cold hearth toward a living lantern, no gore.",
  rally:
    "Show several distinct allies lifting tools or shields together beneath a shared banner.",
  none: "Show the tangible subject named in the card with a clear readable focal silhouette.",
};
const overrides: Record<string, string> = JSON.parse(
  await readFile("assets/art/card-briefs/overrides.json", "utf8").catch(
    () => "{}",
  ),
);
const briefs = await Promise.all(
  cards.map(async (c) => {
    const retained = await readFile(
      `assets/art/approved/cards/${c.id}.json`,
      "utf8",
    )
      .then((text) => JSON.parse(text).prompt as string)
      .catch(() => undefined);
    const set = sets.find((s) => s.id === c.setId)!;
    let subject =
      c.type === "Hero"
        ? "A memorable full figure or three-quarter portrait of the named champion, with meaningful clothing, a personal tool, and a lived-in setting. This is an original collector interpretation, not an authenticated historical likeness."
        : c.type === "Creature"
          ? `A living character or creature accurately embodying the card title and role, doing something in its setting. ${c.keywords.includes("flying") ? "Express flight through an airborne creature, a companion with wings, or subtle spirit magic appropriate to the subject." : ""}`
          : c.type.includes("Resource")
            ? "A richly layered place matching the resource title; a physical source of magical energy, with no large foreground character."
            : c.type === "Artifact"
              ? "A close but contextual view of the specific handmade object in the title, its materials and function clearly visible on a workshop bench, in a traveler’s hand or at its place of use."
              : c.type === "Enchantment"
                ? "A lasting magical bond or sanctuary represented as an event affecting people and architecture, not a floating abstract logo."
                : `${c.type === "Instant" ? "One decisive moment of magical intervention, dynamic close composition." : "A deliberately performed ritual in a broader setting, with preparation visible."} ${action[c.effect]}`;
    if (c.name.includes("Ledgerbone") || c.name.includes("Ilthen"))
      subject +=
        " Ilthen Vael is the skeletal Third Recorder known as Ledgerbone, preserving a record in a tower; a book and recorder’s tools, distinct from the player Erilian in black robes with a staff.";
    const scene = `${c.name}. ${subject} ${c.type === "Creature" && c.effect !== "none" ? action[c.effect] : ""}`;
    const prompt = `Create ONE original full-art collectible card illustration for Hearth & Hollow in Theandril. Card title (subject guidance only; DO NOT write it): ${c.name}. Type: ${c.type}. Scene: ${scene} Setting: ${settings[c.setId]} Gameplay inspiration: ${c.rules}. Interpret mechanics visually without text or numbers. Mana aspect ${c.color}; ${c.tradition} tradition. Crisp deliberately clustered pixel art in the style of a detailed 16-bit medieval fantasy illustration. Strong silhouette, coherent anatomy and materials, restrained earthy colors, atmospheric depth and carefully placed luminous accents. PORTRAIT 2:3 composition, full bleed art only. Place the key subject in the middle and upper-middle; bottom quarter can be quieter for an in-game rules overlay. No frame, border, lettering, logo, watermark, card pips, interface, modern objects, generic floating icon or borrowed franchise characters. This illustration must be its own composition, not a recolor of another card.`;
    return {
      id: c.id,
      setId: c.setId,
      title: c.name,
      type: c.type,
      chapter: set.chapter,
      era: set.era,
      scene,
      prompt: overrides[c.id] ?? retained ?? prompt,
      status: "briefed",
    };
  }),
);
await mkdir("assets/art/card-briefs", { recursive: true });
for (const set of sets) {
  await readFile(
    `docs/lore/theandril/The Book of Broken Roads/${set.chapter}`,
    "utf8",
  );
  await writeFile(
    `assets/art/card-briefs/${set.id}.json`,
    JSON.stringify(
      briefs.filter((b) => b.setId === set.id),
      null,
      2,
    ) + "\n",
  );
}
await writeFile(
  "assets/art/card-briefs/catalog.json",
  JSON.stringify(briefs, null, 2) + "\n",
);
console.log(
  `${briefs.length} individual card briefs in ${sets.length} lore-linked sets.`,
);
