# Theandril: Hearth & Card release readiness

Status: **pre-1.0**. The current [roadmap checklist](ROADMAP.md) and [interactive roadmap](https://erikburdett.github.io/theandril-hearth-and-card/updates/roadmap/) are the maintained view of completed behavior, partial systems and pending acceptance. Every item states its evidence and remaining work. The [development helper](development/README.md) explains how to keep the public site and GitHub checklist synchronized.

Current open release work: broader deck and long-session economy balance, real phones and supported browsers, slow-network and sustained-session performance, agreed single-player scope, and an evidenced final acceptance review. Deeper combat rules, distinct rival strategy profiles and tactical tutorials remain development priorities. Staff/market systems, free building, multiplayer and cloud/offline progression remain proposals or scope decisions, not silently accepted 1.0 obligations.

## Historical feature acceptance

The table and dated verification notes below retain earlier increment results. A completed row certifies only its named behavior at that checkpoint. Later gameplay totals are **640 cards, 18 prepared recipes and 20 visitors using 14 visual families**. Earlier counts below are historical, not the current catalogue or a 1.0 release announcement.

| Requested outcome | Acceptance evidence | Status |
|---|---|---|
| Full-art card presentation | Whole paintings contained in art areas, no crossing inner arches; binder, packs, inspection, hands, battlefield and hover preview | Complete |
| Direct battle interaction | Reversible spell/Hero targeting, drag or click then Confirm; floating animated actions; direct combat and shared simulation legality | Complete |
| Autoplay and takeover | Table arrival, deterministic public-state pilot, save/stack continuity, one-time rewards, draggable desktop/mobile watch window and takeover/resume | Complete |
| Motion and editions | Reduced-motion support, tavern/card/pack feedback, 5% Illuminated frames, finish ownership and save/sale validation | Complete |
| Laptop battle layout | 1366×768 crowded rows fit without board scrolling; resources beneath companions; enlarged hover preview and fallen-card inspector | Complete |
| Prepared decks and guest variety | Twelve recipes with ownership locks, fourteen visually distinct guests, phase-aware dialogue; UI unlock and content tests | Complete |
| Faster duel format and wording | New duels start at 20 health; nine combat skills and Hero devotion; existing saved health retained | Complete |
| Complete custom set artwork | 640 distinct sources and decoded images; 80 exact-hash approvals in each of eight sets; zero missing, stale or shared entries | Complete |
| Bulk booster opening and duplicate crafting | Eight-set seeded equivalence, inventory/finish conservation, 5-to-1 crafting, saved receipt, desktop/mobile haul actions | Complete |
| Automatic tavern hours and day/night | Dawn/night boundaries, manual override, reload and real browser clock checks | Complete |
| Skills, meals, brewing and visible growth | Six skills, six upgrades (three equipment refits), twelve ingredients, fifteen recipes; transactional tests, overnight output, meal sales, exact-reviewed expansion art and desktop/mobile flow | Complete |
| Twelve-culture lore integration | Source snapshot, faction/card references, eight era notes, 32 marginal notes, desktop/mobile reading | Complete |
| Connected expansions and camera | Reviewed stair plates, preserved saved routes, pan/zoom/reset, transformed click and mobile browser checks | Complete |
| Saved deck loadouts | Twelve named recipes; save/update/load/delete; ownership rechecked; reload/import and rejection conservation tested | Complete |
| Guided first-day progression | Four journal chapters with once-only crown rewards; readiness, persistence and repeat-claim rejection tested | Complete |
| Playable shop/battle loop | Twenty Chromium scenarios cover checkout, deliveries, packs, collection, decks, mana, stack, Heroes, drag-to-play and clock | Verified playable slice |
| Walnut and parchment UI | Two generated, factory-reviewed material textures; desktop/mobile workshop, binder and crowded-table screenshots | Complete |
| Artisan progression and recipe shopping | Fourth endless mission branch; completed-batch counters, exact missing-ingredient purchases, filters and save migration | Complete |
| 1.0 balance and usability | Human playtests, physical-device coverage, image-delivery profiling and long-term shop progression | Pending |

Final verification: **91 unit/content/art tests**, **33 Chromium gameplay scenarios**, production build and formatting check pass. The browser suite visits every set and loads all 640 card images. The exact coverage record is [card-art-coverage.json](reports/card-art-coverage.json).

Built-in image generation supplied one retained composition per card. Exact prompts and lore-linked briefs are in `assets/art/card-briefs/`; originals in `assets/art/source/cards/`; reviewed game exports in `public/art/cards/`. Five forager images were replaced after subject review; rejected originals and review evidence remain available. No new Aseprite or Pixel Snapper run is claimed.

Reviewed integration evidence in `docs/screenshots/` includes the full-art reader on desktop/phone, card binder, set history shelf, pack opening, battle table, named deck shelf and keeper journal. Existing saves gain empty deck-book and claimed-journal fields without losing cards, crowns, stock or battle progress.

Before labeling this 1.0: tune uneven deck matchups and repetitive effect patterns, test long sessions and physical touch devices, profile image delivery on slower connections, and define the release scope for shop upgrades/product depth and progression. Other current simplifications remain documented in `IMPLEMENTATION_STATUS.md` and `CARD_RULES.md`.

This increment appends 64 paintings while retaining the earlier 576 reviewed sources. The new diagnostic completed all 360 games (twelve matchups, 30 seeds each), averaging 16.8 alternating turns; uneven matchups and the simple pilot remain limits. See `reports/balance.json`.

Hospitality progression is now playable. Remaining 1.0 work includes long-session economy tuning, staff/market scope decisions and physical touch testing. The current clock advances only while the browser is visible; no offline progress is claimed. Expansion stages retain the illustrated room renderer.

Contribution and deployment tooling are ready for the pre-1.0 demo; the separately licensed content and future commerce boundary are documented in ASSET_LICENSE.md and HOSTING.md. The optimized deployment is approximately 26 MiB.


### Demo retention and guest challenges

This increment adds recoverable local checkpoints and stale-tab detection, six victory-earned challenge recipes (18 total lists), six additional named visitors (20 total, 14 reviewed visual families), persistent notices and phone station dialogs. Current saves are preserved. New automated evidence covers local recovery, unavailable storage/export, competing tabs, unlock/reload/ownership rules and 360px station navigation. These changes do not add cloud saves or new NPC paintings.

Validation for this increment: **91 unit/content/art tests**, **33 Chromium gameplay scenarios**, production build and formatting pass. All **540** diagnostic games completed across eighteen sampled matchups, averaging **17.1 alternating turns**; the simple pilot and uneven matchups remain balance limitations. Reviewed phone evidence: `screenshots/mobile-station-menu.png`, `screenshots/mobile-notices.png`, and `screenshots/expansion-combat-mobile.png`.
