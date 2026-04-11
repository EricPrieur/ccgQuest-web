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

export function saveGame(state) {
  const data = {
    version: 1,
    timestamp: Date.now(),
    selectedClass: state.selectedClass,
    gold: state.gold,
    // Player deck (master deck card IDs)
    masterDeck: state.player.deck.masterDeck.map(c => c.id),
    // Damage pile size (tracks permanent HP loss)
    damagePileSize: state.player.deck.damagePile.length,
    // Map state
    mapId: state.currentMap.id,
    currentNodeId: state.currentMap.currentNodeId,
    visitedNodes: [...state.visitedNodes],
    // Player progression
    level: state.player.level || 1,
    perks: (state.player.perks || []).map(p => p.id),
    // Backpack
    backpack: (state.backpack || []).map(c => c.id),
    // Node states
    nodeStates: {},
  };

  // Save each node's done/locked state
  for (const [id, node] of Object.entries(state.currentMap.nodes)) {
    data.nodeStates[id] = {
      isDone: node.isDone,
      isLocked: node.isLocked,
    };
  }

  return data;
}

export function saveToSlot(state, slot = 'manual_1') {
  const data = saveGame(state);
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
