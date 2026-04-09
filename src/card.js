import { CardType, CostType, TargetType } from './constants.js';

let nextUid = 1;
function generateUid() {
  return `c${nextUid++}`;
}

/**
 * A single effect on a card.
 */
export class CardEffect {
  constructor(effectType, value, target = TargetType.SINGLE_ENEMY, maxTargets = 0) {
    this.effectType = effectType;
    this.value = value;
    this.target = target;
    this.maxTargets = maxTargets;
  }

  copy() {
    return new CardEffect(this.effectType, this.value, this.target, this.maxTargets);
  }
}

/**
 * A mode option for modal cards (choose one).
 */
export class CardMode {
  constructor(description, effects = []) {
    this.description = description;
    this.effects = effects;
  }

  copy() {
    return new CardMode(this.description, this.effects.map(e => e.copy()));
  }
}

/**
 * A card in the game.
 */
export class Card {
  constructor({
    id,
    name,
    description,
    cardType,
    costType = CostType.FREE,
    effects = [],
    shortDesc = '',
    subtype = '',
    upgraded = false,
    upgradeEffects = null,
    modes = null,
    priority = 0,
    characterClass = [],
    tier = 1,
    rarity = 'common',
    previewCard = null,
    previewCreature = null,
    previewCreatures = [],
    isToken = false,
    isUnique = false,
  }) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.cardType = cardType;
    this.costType = costType;
    this.effects = effects;
    this.shortDesc = shortDesc;
    this.subtype = subtype;
    this.uid = generateUid();
    this.upgraded = upgraded;
    this.upgradeEffects = upgradeEffects;
    this.modes = modes;
    this.priority = priority;
    this.characterClass = characterClass;
    this.tier = tier;
    this.rarity = rarity;
    this.previewCard = previewCard;
    this.previewCreature = previewCreature;
    this.previewCreatures = previewCreatures;
    this.isToken = isToken;
    this.isUnique = isUnique;
    this.exhausted = false;
  }

  get isModal() {
    return this.modes !== null && this.modes.length > 0;
  }

  get currentEffects() {
    if (this.upgraded && this.upgradeEffects) {
      return this.upgradeEffects;
    }
    return this.effects;
  }

  canPlay() {
    return !this.exhausted;
  }

  copy(preserveUid = false) {
    const c = new Card({
      id: this.id,
      name: this.name,
      description: this.description,
      cardType: this.cardType,
      costType: this.costType,
      effects: this.effects.map(e => e.copy()),
      shortDesc: this.shortDesc,
      subtype: this.subtype,
      upgraded: this.upgraded,
      upgradeEffects: this.upgradeEffects ? this.upgradeEffects.map(e => e.copy()) : null,
      modes: this.modes ? this.modes.map(m => m.copy()) : null,
      priority: this.priority,
      characterClass: [...this.characterClass],
      tier: this.tier,
      rarity: this.rarity,
      previewCard: this.previewCard,
      previewCreature: this.previewCreature,
      previewCreatures: [...this.previewCreatures],
      isToken: this.isToken,
      isUnique: this.isUnique,
    });
    if (preserveUid) c.uid = this.uid;
    return c;
  }

  toString() {
    return `${this.name} (${this.cardType}/${this.costType})`;
  }
}
