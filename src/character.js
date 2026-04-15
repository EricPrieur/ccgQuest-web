import { StatusEffect } from './constants.js';

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
    this.buffDisplayOrder = [];
    this.heroism = 0;
    this.shield = 0;
    this.rage = 0;
    this.ignite = 0;
    this.poisonBuff = 0;
    this.unpreventableBuff = 0;
    this.level = 1;
    this.perks = [];
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
    if (!this.deck) return 0;
    if (amount <= 0) return 0;
    // Outside combat, ensure there's a draw pile for non-combat damage events.
    if (!this.deck.drawPile.length && !this.deck.hand.length && !this.deck.rechargePile.length) {
      this.deck.initializeForAdventure();
    }
    let taken = 0;
    for (let i = 0; i < amount; i++) {
      // Draw pile first, then recharge pile (via damageFromDrawPile).
      const card = this.deck.damageFromDrawPile();
      if (card) { taken++; continue; }
      // No more cards in deck — pull from hand instead (random card).
      if (this.deck.hand.length > 0) {
        const idx = Math.floor(Math.random() * this.deck.hand.length);
        const handCard = this.deck.hand.splice(idx, 1)[0];
        handCard.exhausted = false;
        this.deck.discardPile.push(handCard);
        taken++;
        continue;
      }
      // No cards anywhere — character is dead
      break;
    }
    return taken;
  }

  takeDamageWithDefense(amount) {
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
    // Block absorbs next
    const blockAbsorb = Math.min(this.currentBlock, remaining);
    this.currentBlock -= blockAbsorb;
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

  addCreature(creature) {
    creature.owner = this;
    // Assign the lowest free slot so creatures fill 2 rows of 6 in display order
    const used = new Set(this.creatures.map(c => c.slot).filter(s => s >= 0));
    let slot = 0;
    while (used.has(slot)) slot++;
    creature.slot = slot;
    this.creatures.push(creature);
    return true;
  }

  readyCreatures() {
    for (const c of this.creatures) {
      c.ready();
    }
  }

  removeDeadCreatures() {
    const dead = this.creatures.filter(c => !c.isAlive);
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
            logs.push({ text: `  ${buff.name}: +${buff.effectValue} Heroism`, color: '#ffd700', token: 'Heroism', tokenAmount: buff.effectValue, tokenColor: '#ffd700' });
            break;
          case 'gain_shield':
            this.shield += buff.effectValue;
            logs.push({ text: `  ${buff.name}: +${buff.effectValue} Shield`, color: '#64b4dc', token: 'Shield', tokenAmount: buff.effectValue, tokenColor: '#64b4dc' });
            break;
          case 'draw_card':
            if (this.deck) {
              const drawn = this.deck.draw(buff.effectValue, 10);
              for (const d of drawn) logs.push({ text: `  ${buff.name}: Draw ${d.name}`, color: '#3c3cc8' });
            }
            break;
          case 'heal':
            if (this.deck && this.deck.discardPile.length > 0) {
              const card = this.deck.discardPile.pop();
              this.deck.addToRechargePile(card);
              logs.push({ text: `  ${buff.name}: Healed 1 (${card.name})`, color: '#3cc83c', card, healed: 1 });
            }
            break;
        }
        if (buff.turnsRemaining > 0) {
          buff.turnsRemaining--;
        }
      }
    }
    // Remove expired turn-based buffs
    this.combatBuffs = this.combatBuffs.filter(b => b.turnsRemaining !== 0 || b.trigger !== 'start_of_turn');
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

export function createToughPerk() {
  return new Perk({
    id: 'tough', name: 'Tough',
    description: '+1 Shield at start of each combat.',
    imageId: 'tough_perk', effectType: 'combat_start_shield', effectValue: 1,
  });
}

export function createPreparedPerk() {
  return new Perk({
    id: 'prepared', name: 'Prepared',
    description: '+1 Heroism at start of each combat.',
    imageId: 'prepared_perk', effectType: 'combat_start_heroism', effectValue: 1,
  });
}

export function createGritPerk() {
  return new Perk({
    id: 'grit', name: 'Grit',
    description: 'Heal 1 at end of each combat.',
    imageId: 'grit_perk', effectType: 'combat_end_heal', effectValue: 1,
  });
}

export function createArsenalPerk() {
  return new Perk({
    id: 'arsenal', name: 'Arsenal',
    description: 'Draw 1 at start of turn if no weapon in hand.',
    imageId: 'arsenal_perk', effectType: 'turn_start_no_weapon_draw', effectValue: 1,
  });
}

export function createTalentedPerk() {
  return new Perk({
    id: 'talented', name: 'Talented',
    description: 'Draw 1 at start of turn if no ability in hand.',
    imageId: 'talented_perk', effectType: 'turn_start_no_ability_draw', effectValue: 1,
  });
}

export function createFirstStrikePerk() {
  return new Perk({
    id: 'first_strike', name: 'First Strike',
    description: 'Deal 1 unpreventable damage to random enemy at combat start.',
    imageId: 'first_strike_perk', effectType: 'combat_start_first_strike', effectValue: 1,
    unique: true,
  });
}

export function getPerkChoices(existingPerks = [], count = 2) {
  const allPerks = [
    createToughPerk(), createPreparedPerk(), createGritPerk(),
    createArsenalPerk(), createTalentedPerk(), createFirstStrikePerk(),
  ];
  // Filter out unique perks already owned
  const ownedUniqueIds = new Set(existingPerks.filter(p => p.unique).map(p => p.id));
  const available = allPerks.filter(p => !p.unique || !ownedUniqueIds.has(p.id));
  // Shuffle and pick
  const shuffled = available.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
