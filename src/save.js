/**
 * Save/Load system using localStorage.
 */

const SAVE_KEY = 'ccgquest_save';
const AUTO_SAVE_KEY = 'ccgquest_autosave';

export const MANUAL_SLOT_COUNT = 10;
export const AUTO_SLOT_COUNT = 10;

function slotKey(slot) {
  // Slot can be 'manual_1', 'manual_2', ..., 'auto_1', 'auto_2', ...
  // For backward compat: 'auto' === 'auto_1', plain numbers === manual
  if (slot === 'auto') return AUTO_SAVE_KEY;
  if (typeof slot === 'string' && slot.startsWith('auto_')) return `${AUTO_SAVE_KEY}_${slot.slice(5)}`;
  if (typeof slot === 'string' && slot.startsWith('manual_')) return `${SAVE_KEY}_${slot.slice(7)}`;
  return `${SAVE_KEY}_${slot}`;
}

export function saveGame(state, saveName = '') {
  const data = {
    version: 1,
    timestamp: Date.now(),
    saveName: saveName,
    selectedClass: state.selectedClass,
    gold: state.gold,
    // Player deck (master deck card IDs)
    masterDeck: state.player.deck.masterDeck.map(c => c.id),
    // Persistent piles (survive between combats)
    hand: state.player.deck.hand.map(c => c.id),
    discardPile: state.player.deck.discardPile.map(c => c.id),
    // Map state
    mapId: state.currentMap.id,
    currentNodeId: state.currentMap.currentNodeId,
    visitedNodes: [...state.visitedNodes],
    // Player progression
    level: state.player.level || 1,
    perks: (state.player.perks || []).map(p => p.id),
    deckLimitBonuses: state.player.deckLimitBonuses || {},
    // Backpack
    backpack: (state.backpack || []).map(c => c.id),
    // Story flags that drive later encounters (kitchen choice gates the
    // prison barrel snatch chance; barrel-looted flag skips the post-combat
    // rummage phase).
    kitchenChoiceMade: state.kitchenChoiceMade || null,
    prisonBarrelLooted: !!state.prisonBarrelLooted,
    shownDeckTutorial: !!state.shownDeckTutorial,
    calmGroveRaenaJoined: !!state.calmGroveRaenaJoined,
    calmGroveBreadTaken: !!state.calmGroveBreadTaken,
    // Antiquity shop: monster cleared yet? + buyback ledger.
    antiquityShopCleared: !!state.antiquityShopCleared,
    soldCardsHistory: Array.isArray(state.soldCardsHistory) ? state.soldCardsHistory.slice() : [],
    // Filibaf Forest maze state — drives the post-clear teleport pair
    // and the in-loop counters when saving mid-maze.
    forestCleared: !!state.forestCleared,
    forestLoopLevel: typeof state.forestLoopLevel === 'number' ? state.forestLoopLevel : 1,
    forestCorrectPath: state.forestCorrectPath === 'right' ? 'right' : 'left',
    // Tharnag siege gauntlet — progress is reset on bail (handled at
    // arrive-time in main.js), siegeComplete latches on for good once
    // the third line falls.
    siegeProgress: typeof state.siegeProgress === 'number' ? state.siegeProgress : 0,
    siegeComplete: !!state.siegeComplete,
    // Tharnag interior — throne audience gates the side-exit, the
    // quarters rest unlocks it, and Valdrisa joins on the first
    // post-rest exit through the hallway.
    throneAudienceComplete: !!state.throneAudienceComplete,
    quartersRested: !!state.quartersRested,
    valdrisaJoined: !!state.valdrisaJoined,
    upperStairsReturnSeen: !!state.upperStairsReturnSeen,
    tharnagExitSeen: !!state.tharnagExitSeen,
    // Globally completed encounter ids — persisted as a flat list so
    // a one-shot encounter (north_crossroad, etc.) stays done after a
    // cross-map hop, even when the destination map's cache was wiped
    // by a load. arriveAtNode forces node.isDone for any node whose
    // encounterId is in this set.
    completedEncounters: state.completedEncounters instanceof Set
      ? Array.from(state.completedEncounters)
      : (Array.isArray(state.completedEncounters) ? state.completedEncounters.slice() : []),
    // Obsidian Wastes labyrinth — seed + state so the same layout is
    // regenerated on load.
    labyrinthGenerated: !!state.labyrinthGenerated,
    labyrinthSeed: typeof state.labyrinthSeed === 'number' ? state.labyrinthSeed : 0,
    labyrinthEncounterChance: typeof state.labyrinthEncounterChance === 'number' ? state.labyrinthEncounterChance : 0.2,
    labyrinthComplete: !!state.labyrinthComplete,
    // Node states
    nodeStates: {},
  };

  // Save each node's done/locked state
  for (const [id, node] of Object.entries(state.currentMap.nodes)) {
    data.nodeStates[id] = {
      isDone: node.isDone,
      isLocked: node.isLocked,
      canRevisit: node.canRevisit,
      // Persist the hidden labels so unlocking via a story flag
      // (north_pass clearing "???" after the throne audience, etc.)
      // survives a load. Only carries through when the node was
      // unlocked at save time and its label was cleared.
      hiddenName: node.hiddenName || '',
      hiddenDescription: node.hiddenDescription || '',
      exhaustedChoices: Array.isArray(node.exhaustedChoices) ? node.exhaustedChoices.slice() : [],
    };
  }

  return data;
}

export function saveToSlot(state, slot = 'manual_1', saveName = '') {
  const data = saveGame(state, saveName);
  try {
    localStorage.setItem(slotKey(slot), JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('Save failed:', e);
    return false;
  }
}

// Save to next available auto slot, rolling over when full
export function saveToAutoSlot(state) {
  // Find oldest auto slot to overwrite, or first empty
  let oldestSlot = 'auto_1';
  let oldestTime = Infinity;
  let firstEmpty = null;
  for (let i = 1; i <= AUTO_SLOT_COUNT; i++) {
    const slotName = `auto_${i}`;
    if (!hasSave(slotName)) {
      firstEmpty = slotName;
      break;
    }
    const info = getSaveInfo(slotName);
    if (info && info.timestamp < oldestTime) {
      oldestTime = info.timestamp;
      oldestSlot = slotName;
    }
  }
  return saveToSlot(state, firstEmpty || oldestSlot);
}

export function loadFromSlot(slot = 'manual_1') {
  try {
    const raw = localStorage.getItem(slotKey(slot));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Load failed:', e);
    return null;
  }
}

export function hasSave(slot = 'manual_1') {
  return localStorage.getItem(slotKey(slot)) !== null;
}

export function deleteSave(slot = 'manual_1') {
  localStorage.removeItem(slotKey(slot));
}

export function getSaveInfo(slot = 'manual_1') {
  const data = loadFromSlot(slot);
  if (!data) return null;
  return {
    class: data.selectedClass,
    gold: data.gold,
    deckSize: data.masterDeck.length,
    node: data.currentNodeId,
    level: data.level || 1,
    timestamp: data.timestamp,
    date: new Date(data.timestamp).toLocaleString(),
    saveName: data.saveName || '',
  };
}

// Check if any save exists (manual or auto)
export function hasAnySave() {
  for (let i = 1; i <= MANUAL_SLOT_COUNT; i++) {
    if (hasSave(`manual_${i}`)) return true;
  }
  for (let i = 1; i <= AUTO_SLOT_COUNT; i++) {
    if (hasSave(`auto_${i}`)) return true;
  }
  return false;
}
