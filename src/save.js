/**
 * Save/Load system using localStorage.
 */

const SAVE_KEY = 'ccgquest_save';
const AUTO_SAVE_KEY = 'ccgquest_autosave';

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

export function saveToSlot(state, slot = 'manual') {
  const data = saveGame(state);
  const key = slot === 'auto' ? AUTO_SAVE_KEY : `${SAVE_KEY}_${slot}`;
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('Save failed:', e);
    return false;
  }
}

export function loadFromSlot(slot = 'manual') {
  const key = slot === 'auto' ? AUTO_SAVE_KEY : `${SAVE_KEY}_${slot}`;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Load failed:', e);
    return null;
  }
}

export function hasSave(slot = 'manual') {
  const key = slot === 'auto' ? AUTO_SAVE_KEY : `${SAVE_KEY}_${slot}`;
  return localStorage.getItem(key) !== null;
}

export function deleteSave(slot = 'manual') {
  const key = slot === 'auto' ? AUTO_SAVE_KEY : `${SAVE_KEY}_${slot}`;
  localStorage.removeItem(key);
}

export function getSaveInfo(slot = 'manual') {
  const data = loadFromSlot(slot);
  if (!data) return null;
  return {
    class: data.selectedClass,
    gold: data.gold,
    deckSize: data.masterDeck.length,
    node: data.currentNodeId,
    date: new Date(data.timestamp).toLocaleString(),
  };
}
