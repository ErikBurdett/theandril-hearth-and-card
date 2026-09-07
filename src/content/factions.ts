/** Part I of Theandril's out-of-world faction bible, snapshot b17900d.
 * Collector lenses are interpretations, not new attestations or card powers. */
export const loreRevision = "b17900d";
export const factions = [
  {
    id: "faction.ashen_compact",
    name: "Ashen Compact",
    era: "Rekindled power",
    place: "Public hearth councils",
    summary:
      "Displaced craft households rebuild through public oaths. A maker’s mark obliges a household to repair work that fails.",
    tension:
      "New frontier hearths need grain and tools; established workshops demand contribution before a share of the store.",
    relations:
      "Cinder ore contracts sustain workshops while contested pass tolls complicate that dependence.",
    materials: "Hearth gold, soot, clay, repaired shields and modular masonry.",
    cards: ["rekindled.1", "rekindled.10", "rekindled.12"],
    lens: "Gather and shared protection turn repeated investment into a stronger hearth. The public oath is political responsibility; the card bonuses are our adaptation.",
  },
  {
    id: "faction.reedbound_council",
    name: "Reedbound Council",
    era: "Rekindled power",
    place: "Reedfen margin",
    summary:
      "Former tributary villages retain seasonal assemblies while rejecting Mire landlords. Boat families, gardens and reed cutters depend on different water levels.",
    tension:
      "Upstream drainage feeds fields but can strand downstream boats. Procedure must give both shores a voice.",
    relations:
      "Independence from the Mire Courts coexists with remembrance of the Deepfen’s shelter during the Long Ash.",
    materials:
      "Reed green, rush weave, river clay, narrow boats and open stilt galleries.",
    cards: ["rekindled.2", "rekindled.7", "rekindled.14"],
    lens: "Healing and fellowship reward mutual support. Neither Tide affinity nor a council vote establishes ownership of a river.",
  },
  {
    id: "faction.cinder_march",
    name: "Cinder March",
    era: "Rekindled power",
    place: "Burnt upland passes",
    summary:
      "Pass-fort households maintained four unpaid generations of watches. Reopened mines now finance the walls and challenge hereditary authority.",
    tension:
      "Wardens, mine owners and workers disagree over who has earned the right to command.",
    relations:
      "Compact workshops need its ore; Covenant suppliers are both competitors and necessary partners.",
    materials:
      "Burnt rose, charcoal, repaired iron, thick gates and short ridge banners.",
    cards: ["rekindled.3", "rekindled.8", "rekindled.13"],
    lens: "Build a defending board before committing to pressure. Flame imagery is no evidence that the March caused the Ashfall.",
  },
  {
    id: "faction.glass_tide",
    name: "Glass Tide",
    era: "Rekindled power",
    place: "The vitrified coast",
    summary:
      "Charter towns reopen hazardous routes and gather sea glass. They inherit the League’s commercial language without a functioning League.",
    tension:
      "Every town wants a new voyage and would prefer another town to bear the first loss.",
    relations:
      "Saltwind successor crews dispute wreck rights and harbor legitimacy; shared voyages can also bring cooperation.",
    materials:
      "Muted blue, sea glass, pale coastal stone and rounded fittings.",
    cards: ["rekindled.4", "rekindled.11", "rekindled.15"],
    lens: "Resources and route support prepare later turns. A promise on paper does not guarantee the ship or its return.",
  },
  {
    id: "faction.iron_covenant",
    name: "Iron Covenant",
    era: "Enduring old power",
    place: "The Anvilheights",
    summary:
      "Deep-folk holds and human client valleys remain bound by Kiln faith and craft obligations. Closed mountain passes did not prove the Covenant’s destruction.",
    tension:
      "Valleys supply food and charcoal while demanding a voice proportionate to their obligations.",
    relations:
      "Wardhall inherits engineering associated with old null-anchors. Surviving works do not explain every hidden council decision.",
    materials: "Aged brass, basalt, forged joints and load-bearing buttresses.",
    cards: ["iron-covenant.1", "iron-covenant.12", "iron-covenant.16"],
    lens: "Relics supply resources and support a durable formation. Dependence on valley provision is the other side of celebrated workmanship.",
  },
  {
    id: "faction.sepulchral_synod",
    name: "Sepulchral Synod",
    era: "Enduring old power",
    place: "Southern chalkland terraces",
    summary:
      "The priest-state ranks and employs the dead. Its seed caravans helped the hungry; its calling of soul-collateral helped make the Hollowing.",
    tension:
      "Living families ask whether a duty can ever end when the office issuing it never dies.",
    relations:
      "Compact and Reedbound households may need seed while refusing obligations over their dead. The Ninth Terrace’s Provost remains unnamed.",
    materials:
      "Bone chalk, muted lilac, bound tablets and measured processional forms.",
    cards: ["reckoning.1", "reckoning.16", "reckoning.33"],
    lens: "Recall and mourning explore the cost of continuity. Card recursion is not an explanation of the stones or a claim that every Synod subject is immortal.",
  },
  {
    id: "faction.mire_courts",
    name: "Mire Courts",
    era: "Enduring old power",
    place: "The Deepfen",
    summary:
      "Elder seasonal courts withdrew from the Roads in RR 2289 and endured. Household rights and ceremony can preserve memory or prolong dependence.",
    tension:
      "Some houses would recognize Reedbound independence; others regard it as surrendering a valid inheritance.",
    relations:
      "The courts sheltered refugees during the Long Ash. Refuge and unresolved grievances both belong in the record.",
    materials:
      "Moss, plum, woven bark, copper bindings and leaf-shaped shields.",
    cards: ["deepfen.1", "deepfen.16", "deepfen.29"],
    lens: "Healing and returning companions express persistence across seasons. They do not turn ceremonial patience into universal wisdom.",
  },
  {
    id: "faction.saltwind_remnant",
    name: "Saltwind Remnant",
    era: "Successor organization",
    place: "Surviving quays and charter households",
    summary:
      "Smaller ship compacts survived the League’s collapse. They restore neither the High Charter nor Aldery’s line.",
    tension:
      "Crews reject unborn obligations sold by vanished offices; charter heirs fear repudiation will erase honest claims too.",
    relations:
      "Glass Tide towns compete for landing rights. Named guarantors can limit risk while excluding partners without security.",
    materials:
      "Petrol sailcloth, auburn canvas, tarred leather and broken-keel seals.",
    cards: ["rekindled.22", "rekindled.30", "saltwind.16"],
    lens: "A modern lens on old pledge cards: distinguish a living crew’s limited promise from the Debt-Crowned’s historical liabilities.",
  },
  {
    id: "faction.wardhall_remnant",
    name: "Wardhall Remnant",
    era: "Successor organization",
    place: "Middle Reach work halls",
    summary:
      "Work halls preserve inspection and defensive engineering after the Null Throne’s fragmentation. Standards can endure without restoring a crown.",
    tension:
      "Hall wardens seek uniform authority; working households want safe works and a right to appeal the inspector.",
    relations:
      "Ashen councils value accountable craft but resist imposed jurisdiction. Covenant contracts recall the responsibility for the Severing.",
    materials:
      "Chalk, slate violet, straight black braces and open-square seals.",
    cards: ["rekindled.19", "rekindled.69", "reckoning.12"],
    lens: "Sentinels and surveyors suggest defensive preparation. Historical Warding is not a blanket immunity or a new card ability.",
  },
  {
    id: "faction.rimehorn_clans",
    name: "Rimehorn Clans",
    era: "Present regional culture",
    place: "High-cold shelter routes",
    summary:
      "Human and giantkin households share shelter, stores and approach maintenance. This is a present society, not a newly discovered ancient empire.",
    tension:
      "Store keepers seek reliable contributions while distant shelters defend reserves they may need to survive.",
    relations:
      "Covenant buyers need timber and passes; Sable travelers negotiate seasonal access. One host cannot bind every household.",
    materials:
      "Weathered ivory, grey fur, dusky blue and crossed shelter beams.",
    cards: ["rekindled.21", "rekindled.32", "rekindled.62"],
    lens: "Shelter and household-defense cards offer a collector’s comparison. Their existing paintings are not authenticated portraits of giantkin.",
  },
  {
    id: "faction.sable_steppe",
    name: "Sable Steppe",
    era: "Present regional culture",
    place: "Open-country camp assemblies",
    summary:
      "Mobile households negotiate grazing, passage and meeting rights. Winter towns supply repairs and stores without speaking for every traveling camp.",
    tension:
      "A fenced field can feed a caravan while blocking its return route. Temporary use is not permanent surrender.",
    relations:
      "Rimehorn shelters and Cinder passes are necessary agreements that can become dependence.",
    materials:
      "Rust felt, ochre, indigo bindings, layered riding shapes and tension roofs.",
    cards: ["rekindled.6", "rekindled.24", "rekindled.58"],
    lens: "Caravans, riders and navigation relics connect movement with preparation. Mobility is not a synonym for lawlessness.",
  },
  {
    id: "faction.morrow_spore",
    name: "Morrow Spore",
    era: "Present regional culture",
    place: "Managed underwood settlements",
    summary:
      "Human and fungal-symbiont households share living records and managed growth. Symbiosis preserves individual privacy, disagreement and refusal.",
    tension:
      "Archive keepers protect mature growth; new settlements need light, timber and room.",
    relations:
      "Mire stewards may respect replenishment but disagree about records; Iron buyers must negotiate more than a timber price.",
    materials:
      "Umber, dusty mauve, pale lichen, grown ribs and individual tools.",
    cards: ["rekindled.17", "rekindled.29", "rekindled.63"],
    lens: "Foraging, groves and returning pacts connect recovery with responsibility. The cards do not assert a universal fungal mind.",
  },
] as const;
export const factionById = Object.fromEntries(factions.map((f) => [f.id, f]));
export const setFactions: Record<string, readonly string[]> = {
  "first-oaths": [
    "faction.ashen_compact",
    "faction.rimehorn_clans",
    "faction.sable_steppe",
  ],
  "witness-roads": [
    "faction.ashen_compact",
    "faction.glass_tide",
    "faction.saltwind_remnant",
  ],
  "iron-covenant": [
    "faction.iron_covenant",
    "faction.wardhall_remnant",
    "faction.cinder_march",
  ],
  saltwind: ["faction.saltwind_remnant", "faction.glass_tide"],
  deepfen: [
    "faction.mire_courts",
    "faction.reedbound_council",
    "faction.morrow_spore",
  ],
  reckoning: [
    "faction.sepulchral_synod",
    "faction.wardhall_remnant",
    "faction.iron_covenant",
  ],
  ashfall: [
    "faction.cinder_march",
    "faction.rimehorn_clans",
    "faction.morrow_spore",
    "faction.wardhall_remnant",
  ],
  rekindled: factions.map((f) => f.id),
};
export const setContinuities: Record<string, string> = {
  "first-oaths":
    "These cards remain in RR 1–800. Modern shelter duties, camp passage and public maker obligations are comparisons across time, not claims that today’s factions attended Cold Ford.",
  "witness-roads":
    "The mortal Grey Weir ledgers remain RR 2210–2231. Modern limited pledges and route charters inherit the problem of distant trust; they do not prove the Witness network has restarted.",
  "iron-covenant":
    "The Covenant endured behind closed passes. Its old sealed works connect to present disputes over valley provision, Cinder ore and Wardhall inspection; the set still depicts the Age of Crowns.",
  saltwind:
    "Aldery belongs to the collapsed League. The Saltwind Remnant’s limited ship pledges and Glass Tide’s town charters are distinct responses to that history, not a restored League.",
  deepfen:
    "The courts withdrew in RR 2289. Later refuge and Reedbound independence explain why the same remembered shelter can support gratitude and a claim to freedom.",
  reckoning:
    "The enduring Synod and the fallen Null Throne have different continuities. Wardhall work halls succeed part of the latter’s practice; they do not undo the Severing or explain Ossric’s end.",
  ashfall:
    "The record of RR 2313–2443 remains incomplete. Northern shelter and underwood stewardship offer present-day comparisons without assigning unattested founding dates to Rimehorn or Morrow.",
  rekindled:
    "RR 2447 includes four rekindled powers, three enduring old powers, two successor organizations and three present regional cultures. The twelve registered cultures are broader than Ilthen’s principal account. Twelve further proposals and proposed named character seeds remain outside this card catalog.",
};
export const cardFactionLenses = (id: string) =>
  factions.filter((f) => (f.cards as readonly string[]).includes(id));
