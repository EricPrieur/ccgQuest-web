import { StatusEffect } from './constants.js';
import { Creature } from './creature.js';

/**
 * Buff applied to a character.
 */
export class Buff {
  constructor(buffType, value, duration = 'next_attack') {
    this.buffType = buffType;
    this.value = value;
    this.duration = duration; // 'next_attack', 'end_of_turn', 'start_of_turn'
  }
}

/**
 * Multi-combat buff persisting across encounters.
 */
export class CombatBuff {
  constructor({ id, name, description, imageId, effectType, effectValue, trigger = 'start_of_turn', combatsRemaining = 1, turnsRemaining = 0 }) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.imageId = imageId;
    this.effectType = effectType;
    this.effectValue = effectValue;
    this.trigger = trigger;
    this.combatsRemaining = combatsRemaining;
    this.turnsRemaining = turnsRemaining;
  }
}

/**
 * Permanent character-sheet buff. Lives on the player forever (no
 * combats_remaining decrement) and projects into combat as a fresh
 * CombatBuff at combat start when its `condition` matches the
 * current enemy. Mirrors PY's persistent buff concept (Old God's
 * Blessing, etc.).
 *
 * `condition` shapes:
 *   { type: 'always' }                           — always active
 *   { type: 'enemyName', includes: ['Sahuagin'] }— active when
 *      enemy.name contains ANY of the given substrings (case-insensitive).
 *   { type: 'enemyId', oneOf: ['sahuagin_baron'] } — exact enemy id match.
 */
export class PersistentBuff {
  constructor({ id, name, description, imageId, effectType, effectValue,
    trigger = 'on_attack', condition = { type: 'always' } }) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.imageId = imageId;
    this.effectType = effectType;
    this.effectValue = effectValue;
    this.trigger = trigger;
    this.condition = condition;
  }
  matches(enemy, enemyId) {
    const cond = this.condition || { type: 'always' };
    if (cond.type === 'always') return true;
    if (cond.type === 'enemyName' && Array.isArray(cond.includes)) {
      const name = (enemy && enemy.name || '').toLowerCase();
      return cond.includes.some(s => name.includes(String(s).toLowerCase()));
    }
    if (cond.type === 'enemyId' && Array.isArray(cond.oneOf)) {
      return cond.oneOf.includes(enemyId);
    }
    return false;
  }
}

/**
 * A perk chosen during character progression.
 */
export class Perk {
  constructor({ id, name, description, imageId, effectType, effectValue, unique = false, tier = 1 }) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.imageId = imageId;
    this.effectType = effectType;
    this.effectValue = effectValue;
    this.unique = unique;
    this.tier = tier;
  }
}

/**
 * Base class for any entity in combat. Health = deck + hand cards.
 */
export class Character {
  constructor(name) {
    this.name = name;
    this.deck = null;
    this.statusEffects = {};
    this.creatures = [];
    this.powers = [];
    this.baseArmor = 0;
    this.currentBlock = 0;
    this.pendingSummons = [];
    this.buffs = [];
    this.combatBuffs = [];
    // Persistent (character-sheet) buffs. Survive end-of-combat
    // cleanup; project into combatBuffs at combat start when their
    // condition matches the current enemy.
    this.persistentBuffs = [];
    this.buffDisplayOrder = [];
    this.heroism = 0;
    this.shield = 0;
    this.rage = 0;
    this.ignite = 0;
    this.poisonBuff = 0;
    this.unpreventableBuff = 0;
    this.level = 1;
    this.perks = [];
    // Level-up deck-limit bonuses: { weapon: N, armor: N, ... }
    // Each key can hold up to +3 total across all level-ups.
    this.deckLimitBonuses = {};
  }

  get armor() {
    let a = this.baseArmor;
    for (const p of this.powers) {
      if (p.id === 'armor' && !p.exhausted) a += (p.armorLevel || 1);
    }
    return a;
  }

  get isAlive() {
    if (!this.deck) return false;
    return (this.deck.drawPile.length + this.deck.hand.length + this.deck.rechargePile.length) > 0;
  }

  get totalCards() {
    if (!this.deck) return 0;
    return this.deck.drawPile.length + this.deck.hand.length +
      this.deck.rechargePile.length + this.deck.discardPile.length +
      this.deck.damagePile.length + this.deck.playPile.length;
  }

  // --- Buffs ---

  addBuff(buffType, value, duration = 'next_attack') {
    this.buffs.push(new Buff(buffType, value, duration));
  }

  getBuffValue(buffType) {
    return this.buffs
      .filter(b => b.buffType === buffType)
      .reduce((sum, b) => sum + b.value, 0);
  }

  consumeBuff(buffType, duration = null) {
    let total = 0;
    this.buffs = this.buffs.filter(b => {
      if (b.buffType === buffType && (duration === null || b.duration === duration)) {
        total += b.value;
        return false;
      }
      return true;
    });
    return total;
  }

  clearBuffsByDuration(duration) {
    this.buffs = this.buffs.filter(b => b.duration !== duration);
  }

  // --- Defense ---

  getDefenseCards() {
    if (!this.deck) return [];
    return this.deck.hand
      .filter(c => c.cardType === 'DEFENSE')
      .map((c, i) => [c, i]);
  }

  addBlock(amount) {
    this.currentBlock += amount;
  }

  clearBlock() {
    this.currentBlock = 0;
  }

  // --- Damage ---

  takeDamageFromDeck(amount) {
    if (this._invulnerable) return 0;
    if (!this.deck) return 0;
    if (amount <= 0) return 0;
    // Outside combat, ensure there's a draw pile for non-combat damage events.
    if (!this.deck.drawPile.length && !this.deck.hand.length && !this.deck.rechargePile.length) {
      this.deck.initializeForAdventure();
    }
    let taken = 0;
    // Use a while-loop so token discards don't consume the damage
    // counter — Web tokens (and any other isToken card sitting in the
    // draw pile) get dragged out without counting as HP, and the loop
    // tries again for a real card to absorb the hit.
    while (taken < amount) {
      const card = this.deck.damageFromDrawPile();
      if (card) {
        // damageFromDrawPile pushes the card to discardPile directly, so the
        // generic discardCard hook didn't fire — re-check the on-discard
        // passives here (Lucky Pebble draw, Web token cascade).
        const effects = (card.effects || []);
        if (effects.some(e => e && e.effectType === 'on_discard_draw')) {
          this.deck.draw(1, this.maxHandSize || 10);
        }
        for (const e of effects) {
          if (e && e.effectType === 'on_discard_discard') {
            const n = Math.max(1, e.value || 1);
            for (let k = 0; k < n; k++) {
              if (this.deck.drawPile.length === 0) break;
              const dragged = this.deck.drawPile.pop();
              this.deck.discardCard(dragged);
            }
          }
        }
        // Tokens (Web token most importantly) are clog, not lifeforce —
        // they discard without absorbing the swing.
        if (!card.isToken) taken++;
        continue;
      }
      // No more cards in deck — pull from hand instead (random card).
      // Tokens in hand (Goodberries, etc.) similarly skip the HP cost.
      if (this.deck.hand.length > 0) {
        const idx = Math.floor(Math.random() * this.deck.hand.length);
        const handCard = this.deck.hand.splice(idx, 1)[0];
        handCard.exhausted = false;
        this.deck.discardCard(handCard);
        if (!handCard.isToken) taken++;
        continue;
      }
      // No cards anywhere — character is dead
      break;
    }
    return taken;
  }

  takeDamageWithDefense(amount) {
    if (this._invulnerable) return [amount, 0];
    // Shield absorbs first
    let remaining = amount;
    if (this.shield > 0) {
      const shieldAbsorb = Math.min(this.shield, remaining);
      this.shield -= shieldAbsorb;
      remaining -= shieldAbsorb;
    }
    // Armor absorbs next
    const blocked = Math.min(this.armor, remaining);
    remaining -= blocked;
    // Block absorbs next. Block is a one-attack absorber: whatever block the
    // target had at the start of this hit is consumed (or wasted) on this
    // attack only — leftover doesn't carry over to the next swing.
    const blockAbsorb = Math.min(this.currentBlock, remaining);
    this.currentBlock = 0;
    remaining -= blockAbsorb;
    const totalBlocked = blocked + blockAbsorb + (amount - remaining - (amount - blocked - blockAbsorb - remaining));
    const taken = this.takeDamageFromDeck(remaining);
    return [amount - remaining, taken];
  }

  // --- Status Effects ---

  applyStatus(status, stacks) {
    this.statusEffects[status] = (this.statusEffects[status] || 0) + stacks;
  }

  removeStatus(status, stacks = null) {
    if (stacks === null) {
      delete this.statusEffects[status];
    } else {
      this.statusEffects[status] = Math.max(0, (this.statusEffects[status] || 0) - stacks);
      if (this.statusEffects[status] === 0) delete this.statusEffects[status];
    }
  }

  getStatus(status) {
    return this.statusEffects[status] || 0;
  }

  // --- Creatures ---

  // Hard cap on simultaneous allies. Mirrors PY (player + enemy max_creatures
  // = 12 in this build) — anything past the cap is silently refused so
  // callers can branch on the return value to short-circuit summon effects.
  static MAX_CREATURES = 12;

  addCreature(creature) {
    if (this.creatures.length >= Character.MAX_CREATURES) return false;
    creature.owner = this;
    // Assign the lowest free slot so creatures fill 2 rows of 6 in display order
    const used = new Set(this.creatures.map(c => c.slot).filter(s => s >= 0));
    let slot = 0;
    while (used.has(slot)) slot++;
    creature.slot = slot;
    this.creatures.push(creature);
    return true;
  }

  canSummonMore() {
    return this.creatures.length < Character.MAX_CREATURES;
  }

  readyCreatures() {
    for (const c of this.creatures) {
      c.ready();
    }
  }

  removeDeadCreatures() {
    const dead = this.creatures.filter(c => !c.isAlive);
    // Companion cards (e.g. Thorb) are linked to a sourceCard sitting in the
    // play pile while alive. When the companion dies, route its source card
    // to the discard pile so the player visibly loses it (PY parity).
    if (this.deck) {
      for (const c of dead) {
        if (c.isCompanion && c.sourceCard) {
          this.deck.playPileToDiscard(c.sourceCard);
        }
      }
    }
    this.creatures = this.creatures.filter(c => c.isAlive);
    return dead;
  }

  // --- Powers ---

  addPower(power) {
    power.owner = this;
    this.powers.push(power);
  }

  readyPowers() {
    for (const p of this.powers) {
      if (!p.isPassive) p.ready();
    }
  }

  getUsablePowers() {
    return this.powers.filter(p => p.canUse());
  }

  // --- Combat Buffs ---
  addCombatBuff(buff) {
    this.combatBuffs.push(buff);
  }

  processCombatBuffs() {
    const logs = [];
    for (const buff of this.combatBuffs) {
      if (buff.trigger === 'start_of_turn') {
        switch (buff.effectType) {
          case 'gain_heroism':
            this.heroism += buff.effectValue;
            logs.push({ text: `  ${buff.name}: +${buff.effectValue} Heroism`, color: '#ffd700', token: 'Heroism', tokenAmount: buff.effectValue, tokenColor: '#ffd700', buff });
            break;
          case 'gain_shield':
            this.shield += buff.effectValue;
            logs.push({ text: `  ${buff.name}: +${buff.effectValue} Shield`, color: '#64b4dc', token: 'Shield', tokenAmount: buff.effectValue, tokenColor: '#64b4dc', buff });
            break;
          case 'draw_card':
            if (this.deck) {
              const drawn = this.deck.draw(buff.effectValue, 10);
              for (const d of drawn) logs.push({ text: `  ${buff.name}: Draw ${d.name}`, color: '#3c3cc8', card: d, buff });
            }
            break;
          case 'heal':
            if (this.deck && this.deck.discardPile.length > 0) {
              const card = this.deck.discardPile.pop();
              this.deck.addToRechargePile(card);
              logs.push({ text: `  ${buff.name}: Healed 1 (${card.name})`, color: '#3cc83c', card, healed: 1, buff });
            }
            break;
          case 'apply_ice': {
            // Blizzard buff (Wolf Pack fight): every turn, the player
            // and every alive ally takes one Ice stack. Mirrors PY's
            // start_of_turn handler.
            this.applyStatus('ICE', buff.effectValue);
            for (const ally of (this.creatures || [])) {
              if (!ally.isAlive) continue;
              ally.iceStacks = (ally.iceStacks || 0) + buff.effectValue;
            }
            logs.push({
              text: `  ${buff.name}: +${buff.effectValue} Ice on you and all allies`,
              color: '#7ec8e3',
              token: 'Ice', tokenAmount: buff.effectValue, tokenColor: '#7ec8e3',
              buff,
            });
            break;
          }
          case 'summon_elf_warrior': {
            // Elf Reinforcements buff (General Zhost army fight): summon 1
            // Elf Warrior at start of turn, only when fewer than 6 living
            // allies. Default summoning-sickness rule applies — the elf
            // can't attack until next turn.
            const aliveAllies = (this.creatures || []).filter(c => c.isAlive).length;
            if (aliveAllies < 6) {
              const elf = new Creature({ name: 'Elf Warrior', attack: 2, maxHp: 2 });
              if (this.addCreature(elf)) {
                logs.push({ text: `  ${buff.name}: Elf Warrior reinforces!`, color: '#3cc83c', creature: elf, buff });
              }
            }
            break;
          }
        }
        if (buff.turnsRemaining > 0) {
          buff.turnsRemaining--;
          if (buff.turnsRemaining === 0) buff._expired = true;
        }
      }
    }
    // Remove only buffs whose turn count just ran out. Buffs with
    // turnsRemaining === 0 from the start (no per-turn limit) stay until
    // endCombatBuffCleanup() drops them at end of combat.
    this.combatBuffs = this.combatBuffs.filter(b => !b._expired);
    return logs;
  }

  endCombatBuffCleanup() {
    this.combatBuffs = this.combatBuffs.filter(b => {
      b.combatsRemaining--;
      return b.combatsRemaining > 0;
    });
  }

  // --- Perks ---
  getPerkStacks(effectType) {
    return this.perks
      .filter(p => p.effectType === effectType)
      .reduce((sum, p) => sum + p.effectValue, 0);
  }

  hasPerk(perkId) {
    return this.perks.some(p => p.id === perkId);
  }
}

// ============================================================
// Perk Creators
// ============================================================

// All perk descriptions follow the "Trigger: Effect." convention so the
// in-game text line reads the same as the overlay badge. Triggers used:
//   Combat Start, Combat End, Turn Start, Turn End.

// ----- Common (repeatable) -----

export function createToughPerk() {
  return new Perk({
    id: 'tough', name: 'Tough',
    description: 'Combat Start: +1 Shield.',
    imageId: 'tough_perk', effectType: 'combat_start_shield', effectValue: 1,
  });
}

export function createPreparedPerk() {
  return new Perk({
    id: 'prepared', name: 'Prepared',
    description: 'Combat Start: +1 Heroism.',
    imageId: 'prepared_perk', effectType: 'combat_start_heroism', effectValue: 1,
  });
}

export function createFlashOfGeniusPerk() {
  return new Perk({
    id: 'flash_of_genius', name: 'Flash of Genius',
    description: 'Combat Start: You may recharge a card to draw.',
    imageId: 'flash_of_genius_perk', effectType: 'combat_start_flash', effectValue: 1,
  });
}

export function createGritPerk() {
  return new Perk({
    id: 'grit', name: 'Grit',
    description: 'Combat End: Heal 1.',
    imageId: 'grit_perk', effectType: 'combat_end_heal', effectValue: 1,
  });
}

export function createLuckyFindPerk() {
  return new Perk({
    id: 'lucky_find', name: 'Lucky Find',
    // Triggers at loot time (combat-end gold award) — not combat start.
    // Uses the "Loot" trigger (yellow badge).
    description: 'Loot: When gaining gold, gain an extra 1d6.',
    imageId: 'lucky_find_perk', effectType: 'loot_bonus_gold', effectValue: 1,
  });
}

// ----- Uncommon (unique) -----

export function createArsenalPerk() {
  return new Perk({
    id: 'arsenal', name: 'Arsenal',
    description: 'Turn Start: If no weapon in hand, draw 1.',
    imageId: 'arsenal_perk', effectType: 'turn_start_no_weapon_draw', effectValue: 1,
    unique: true,
  });
}

export function createTalentedPerk() {
  return new Perk({
    id: 'talented', name: 'Talented',
    description: 'Turn Start: If no ability in hand, draw 1.',
    imageId: 'talented_perk', effectType: 'turn_start_no_ability_draw', effectValue: 1,
    unique: true,
  });
}

export function createFirstStrikePerk() {
  return new Perk({
    id: 'first_strike', name: 'First Strike',
    description: 'Combat Start: Deal 1 unpreventable damage to a random enemy.',
    imageId: 'first_strike_perk', effectType: 'combat_start_first_strike', effectValue: 1,
    unique: true,
  });
}

export function createSecondWindPerk() {
  return new Perk({
    id: 'second_wind', name: 'Second Wind',
    description: 'Turn Start: If you took 4+ damage last turn, Heal 1.',
    imageId: 'second_wind_perk', effectType: 'turn_start_second_wind', effectValue: 1,
    unique: true,
  });
}

export function createAmbushPerk() {
  return new Perk({
    id: 'ambush', name: 'Ambush',
    description: 'Combat Start: Your first attack this combat is unpreventable.',
    imageId: 'ambush_perk', effectType: 'combat_first_unpreventable', effectValue: 1,
    unique: true,
  });
}

export function createArmoredPerk() {
  return new Perk({
    id: 'armored', name: 'Armored',
    description: 'Turn End: If no armor in hand, draw 1.',
    imageId: 'armored_perk', effectType: 'turn_end_no_armor_draw', effectValue: 1,
    unique: true,
  });
}

export function createPowerSurgePerk() {
  return new Perk({
    id: 'power_surge', name: 'Power Surge',
    // Uses the "Combat" trigger (not "Combat Start") — the effect fires
    // when the player *first applies a debuff* during combat, not at the
    // opening bell. Shorter label reflects that gate.
    description: 'Combat: Your first debuff also hits a random enemy.',
    imageId: 'power_surge_perk', effectType: 'combat_first_debuff_spread', effectValue: 1,
    unique: true,
  });
}

export function createBalancedPerk() {
  return new Perk({
    id: 'balanced', name: 'Balanced',
    description: 'Turn Start: If 1 Weapon, 1 Armor and 1 Ability in hand, draw 1.',
    imageId: 'balanced_perk', effectType: 'turn_start_balanced_draw', effectValue: 1,
    unique: true,
  });
}

// Druid-flavored unique: tops up a Goodberry in hand on combat start,
// mirroring the Druid's starter ally-food card. Uses the Druid-themed
// "Harvest" art.
export function createHarvestPerk() {
  return new Perk({
    id: 'harvest', name: 'Harvest',
    description: 'Combat Start: Add a Goodberry to your hand.',
    imageId: 'harvest_perk', effectType: 'combat_start_goodberry', effectValue: 1,
    unique: true,
  });
}

// Per-class perk weights at each level-up tier. Mirrors PY's
// `CLASS_PERK_WEIGHTS` dict. Tier 2 is currently empty (reserved for
// future expansion) — falls back to tier 1 if empty for a class.
export const CLASS_PERK_WEIGHTS = {
  1: {
    Warrior: { tough: 0.5,  prepared: 0.5,  flash_of_genius: 0.25, grit: 1.0,  arsenal: 0.5,  second_wind: 0.25, lucky_find: 0.5 },
    Rogue:   { tough: 0.5,  prepared: 1.0,  flash_of_genius: 0.5,  grit: 0.25, arsenal: 0.5,  ambush: 0.25,      lucky_find: 0.5 },
    Wizard:  { tough: 0.5,  prepared: 0.5,  flash_of_genius: 1.0,  grit: 0.25, talented: 0.5, power_surge: 0.25, lucky_find: 0.5 },
    Ranger:  { tough: 0.5,  prepared: 1.0,  flash_of_genius: 0.25, grit: 0.5,  arsenal: 0.5,  first_strike: 0.25, lucky_find: 0.5 },
    Paladin: { tough: 1.0,  prepared: 0.5,  flash_of_genius: 0.25, grit: 0.5,  arsenal: 0.5,  armored: 0.25,     lucky_find: 0.5 },
    Druid:   { tough: 0.75, prepared: 0.75, flash_of_genius: 0.25, grit: 0.5,  balanced: 0.5, harvest: 0.25,     lucky_find: 0.5 },
  },
  2: {
    // Tier 2 rolls currently empty; getPerkChoices falls back to tier 1.
  },
};

// id → creator map. Lets getPerkChoices look up a creator by string id
// (the weights tables only reference ids, not functions).
export const PERK_REGISTRY = {
  tough:           createToughPerk,
  prepared:        createPreparedPerk,
  flash_of_genius: createFlashOfGeniusPerk,
  grit:            createGritPerk,
  lucky_find:      createLuckyFindPerk,
  arsenal:         createArsenalPerk,
  talented:        createTalentedPerk,
  second_wind:     createSecondWindPerk,
  ambush:          createAmbushPerk,
  first_strike:    createFirstStrikePerk,
  armored:         createArmoredPerk,
  power_surge:     createPowerSurgePerk,
  balanced:        createBalancedPerk,
  harvest:         createHarvestPerk,
};

// Pick `count` unique perks via weighted random without replacement from
// the class + tier pool. Falls back to tier 1 when the requested tier is
// empty for this class. Filters out unique perks the player already owns.
export function getPerkChoices(existingPerks = [], count = 2, characterClass = '', tier = 1) {
  let weights = (CLASS_PERK_WEIGHTS[tier] || {})[characterClass];
  if (!weights && tier > 1) weights = (CLASS_PERK_WEIGHTS[1] || {})[characterClass];
  if (!weights) {
    // Unknown class — fall back to "all perks equal weight" so the flow
    // never breaks (matches the old pre-class behavior).
    weights = {};
    for (const id of Object.keys(PERK_REGISTRY)) weights[id] = 1.0;
  }
  const ownedUniqueIds = new Set(existingPerks.filter(p => p.unique).map(p => p.id));
  let ids = Object.keys(weights).filter(id => {
    const creator = PERK_REGISTRY[id];
    if (!creator) return false;
    const sample = creator();
    return !sample.unique || !ownedUniqueIds.has(id);
  });
  let w = ids.map(id => weights[id]);
  const chosen = [];
  for (let k = 0; k < Math.min(count, ids.length); k++) {
    const total = w.reduce((s, v) => s + v, 0);
    if (total <= 0) break;
    let roll = Math.random() * total;
    let picked = 0;
    for (let j = 0; j < ids.length; j++) {
      roll -= w[j];
      if (roll <= 0) { picked = j; break; }
    }
    chosen.push(PERK_REGISTRY[ids[picked]]());
    ids.splice(picked, 1);
    w.splice(picked, 1);
  }
  return chosen;
}
