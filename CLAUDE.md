# Project notes for Claude

This file is auto-loaded into Claude's context. Keep it short and focused on
things that aren't obvious from the code alone.

## Codex (debug `C` key)

The codex is mostly **auto-generated** from the same data the game uses at
runtime — adding a card / enemy / loot table to the right registry usually
makes it appear in the codex with no extra work. The cache is built lazily
on first codex access and stored in module-level `_codexSourceCache` in
`src/main.js`. A page reload refreshes it.

### What auto-discovers (do nothing extra)

| You added… | And it appears in the codex via… |
|---|---|
| A card creator in `CARD_REGISTRY` (main.js) | Player Cards tab + correct subtype filter |
| A card to a starter deck function (cards.js) | Starter source line + Decks tab section |
| A card to a class ability-choice list (cards.js) | Lost Shrine source line (if `tier === 1`) |
| An entry in `LOOT_TABLES` (main.js) | Loot Tables tab section + per-card `Loot: X (n%)` source line |
| An entry in `SHOP_INVENTORIES` (main.js) | `Shop: <Name> (<price>g)` source line |
| `lootCards: ['x']` on an encounter (encounter.js) | `Drop: <Encounter Name>` source line |
| `previewCreature: ...` on a card (cards.js) | Summons tab entry, side stamped `player` |
| `enemy.addCreature(new Creature(...))` in `setupEnemyForCombat` | Summons tab entry, side stamped `enemy` |
| A new card in an enemy's `enemy.deck.addCard(...)` calls | Enemy Cards tab + Decks tab section + `Enemy: X` source line |

### What needs a manual touch

When adding any of these, also update the listed file:

1. **A new enemy id** in `setupEnemyForCombat` (main.js ~2009) →
   - Add the id to `enemyIds = [...]` in `buildCodexSourceCache`
     (main.js ~12517) so the sandbox scan picks it up.
   - If you want a portrait under **Heroes & Monsters**, add the id to
     `getCodexMonsterIds()` (main.js ~12260) **and** ensure
     `assets/Cards/<EnemyArt>.jpg` is loaded as `creature_<id>` in
     `loadAssets()`.
2. **A new shop** in `SHOP_INVENTORIES` →
   - Add a friendly label to `shopLabels = {...}` in
     `buildCodexSourceCache` (main.js ~12480), otherwise the source line
     falls back to a title-cased id.
3. **A new loot table** in `LOOT_TABLES` →
   - Optional but recommended: add to `LOOT_TABLE_LABELS` and
     `LOOT_TABLE_NOTES` (main.js ~371) for a friendly title and the
     one-line description shown under the section header.
4. **A new non-persistent player card** (token-like, never in
   `CARD_REGISTRY`) → add the creator to `ALL_EXTRA_CARD_CREATORS`
   (main.js ~11492). Currently used for `Goodberry` and the four
   power-choice cards (`Fire`, `Ice`, `Feline Form`, `Bear Form`).
5. **A new player class power** → add the power id to
   `PLAYER_POWER_IDS` (main.js ~11500) so the codex classifies it as
   player-side (otherwise it's tagged `enemy`).
6. **A new player summon that no card has `previewCreature` for**
   (e.g. spawned only by an effect handler) → add an explicit
   `addCreature(new Creature({...}), 'Summoned by: <source>')` block in
   `buildCodexSourceCache` (main.js, near the existing Restless Bone /
   Thorb additions). Set:
   - `_codexSide = 'player'` (Decks/Summons side filter)
   - `_sourceRarity = '<rarity of source card>'` (drives frame asset —
     `uncommon`+ uses the ornate frame)
   - `_sourceSubtype = '<subtype of source card>'` (drives frame tint —
     `'ability'` = purple, `'allies'` = brown, etc., via `SUBTYPE_COLORS`)

   For creatures from a card's `previewCreature`, all three fields are
   stamped automatically from the parent card by `buildCodexSourceCache`
   and by the side-preview call sites in `drawHoverPreview`,
   `drawClassCard`, and the loot-modal preview.

### Source-line linking

Source entries in the right-side stats panel are objects
`{ text, link? }`. `link` is optional metadata for click-to-navigate.
Currently supported link types:

- `{ type: 'loot', id: '<table_id>' }` — jumps to the Loot Tables tab and
  highlights that table.
- `{ type: 'deck', id: '<deck_id>' }` — jumps to the Decks tab and
  highlights that deck. Deck ids: `starter_<class>` for starter decks,
  `enemy_<enemyId>` for monster decks.

When adding a new source category that should be navigable, follow the
same pattern: add the `link` field where the source is recorded in
`buildCodexSourceCache`, then handle the `link.type` in the `goto-link`
case of `handleCodexClick`.

### Sanity check after a content change

1. Reload the page (cache is module-level and lazy).
2. Press `C` (debug mode required).
3. Check Player or Enemy tab for the new card / power / creature.
4. Click it and verify the right-side **Sources** list looks correct
   (class restriction, starter, ability choice, loot, drop, shop,
   enemy, etc.).
5. If it's a deck or loot member, follow the blue link in Sources to
   confirm the navigation lands on the right section.
