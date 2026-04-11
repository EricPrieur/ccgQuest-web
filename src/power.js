import { createFireToken, createIceToken, createCatFormToken, createBearFormToken } from './cards.js';

/**
 * A character power that can be used once per turn.
 */
export class Power {
  constructor({
    id,
    name,
    costDescription,
    effectDescription,
    rechargeCost,
    exhausted = false,
    isPassive = false,
    shortDesc = '',
    choices = null,
    costIsDiscard = false,
  }) {
    this.id = id;
    this.name = name;
    this.costDescription = costDescription;
    this.effectDescription = effectDescription;
    this.rechargeCost = rechargeCost;
    this.exhausted = exhausted;
    this.owner = null;
    this.isPassive = isPassive;
    this.shortDesc = shortDesc;
    this.choices = choices;
    this.costIsDiscard = costIsDiscard;
  }

  get fullDescription() {
    return `${this.costDescription}: ${this.effectDescription}`;
  }

  canUse() {
    if (this.isPassive) return false;
    if (this.exhausted) return false;
    if (!this.owner || !this.owner.deck) return false;
    return this.owner.deck.hand.length >= this.rechargeCost;
  }

  use() {
    if (!this.canUse()) return false;
    this.exhausted = true;
    return true;
  }

  ready() {
    this.exhausted = false;
  }

  toString() {
    return `${this.name}: ${this.fullDescription}`;
  }
}

// === Class Power Creators ===

export function createCleave() {
  return new Power({
    id: 'cleave',
    name: 'Cleave',
    costDescription: 'Recharge 1 Card',
    effectDescription: 'Deal 1 Damage to up to 2 Creatures.',
    rechargeCost: 1,
    shortDesc: '1 Dmg x2',
  });
}

export function createAimedShot() {
  return new Power({
    id: 'aimed_shot',
    name: 'Aimed Shot',
    costDescription: 'Recharge 1 Card',
    effectDescription: 'Gain 1 Heroism, Draw 1.',
    rechargeCost: 1,
    shortDesc: '+1 Heroism\nDraw 1',
  });
}

export function createElementalInfusion() {
  return new Power({
    id: 'elemental_infusion',
    name: 'Elemental Infusion',
    costDescription: 'Recharge 1 Card',
    effectDescription: 'Apply 1 Fire or 1 Ice to target.',
    rechargeCost: 1,
    shortDesc: '+1 Fire/Ice',
    choices: [createFireToken(), createIceToken()],
  });
}

export function createQuickStrike() {
  return new Power({
    id: 'quick_strike',
    name: 'Quick Strike',
    costDescription: 'Recharge 1 Card',
    effectDescription: 'Deal 1 Damage, Draw 1.',
    rechargeCost: 1,
    shortDesc: '1 Dmg\nDraw 1',
  });
}

export function createBattleFury() {
  return new Power({
    id: 'battle_fury',
    name: 'Battle Fury',
    costDescription: 'Discard 1 Card',
    effectDescription: 'Gain 1 Heroism, 1 Shield, Draw 2.',
    rechargeCost: 1,
    costIsDiscard: true,
    shortDesc: '+1 Heroism\n+1 Shield, Draw 2',
  });
}

export function createFeralForm() {
  return new Power({
    id: 'feral_form',
    name: 'Feral Form',
    costDescription: 'Recharge 1 Card',
    effectDescription: 'Gain 1 Heroism or 1 Shield. Draw 1.',
    rechargeCost: 1,
    shortDesc: '+1 Heroism or\n+1 Shield, Draw 1',
    choices: [createCatFormToken(), createBearFormToken()],
  });
}

// === Enemy Powers ===

export function createChunkyBite() {
  return new Power({
    id: 'chunky_bite',
    name: 'Chunky Bite',
    costDescription: 'Passive',
    effectDescription: 'Bites deal +1 damage.',
    rechargeCost: 0,
    isPassive: true,
    shortDesc: 'Bite +1',
  });
}

export function createDireFury() {
  return new Power({
    id: 'dire_fury',
    name: 'Dire Fury',
    costDescription: 'Passive',
    effectDescription: 'Gains rage on damage.',
    rechargeCost: 0,
    isPassive: true,
    shortDesc: '+Rage on hit',
  });
}

export function createSplit() {
  return new Power({
    id: 'split',
    name: 'Split',
    costDescription: 'Passive',
    effectDescription: 'Splits when damaged.',
    rechargeCost: 0,
    isPassive: true,
    shortDesc: 'Split on hit',
  });
}

export function createArmorPower() {
  return new Power({
    id: 'armor',
    name: 'Armor',
    costDescription: 'Passive',
    effectDescription: '+1 Armor.',
    rechargeCost: 0,
    isPassive: true,
    shortDesc: '+1 Armor',
  });
}

export function getClassPower(className) {
  const powers = {
    Paladin: createCleave,
    Ranger: createAimedShot,
    Wizard: createElementalInfusion,
    Rogue: createQuickStrike,
    Warrior: createBattleFury,
    Druid: createFeralForm,
  };
  return (powers[className] || createCleave)();
}
