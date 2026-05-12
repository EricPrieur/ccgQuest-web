import { Card, CardEffect, CardMode } from './card.js';
import { CardType, CostType, TargetType } from './constants.js';
import { Creature } from './creature.js';

// ============================================================
// Power choice tokens (not real deck cards — used by powers
// like Elemental Infusion / Feral Form to render the choice UI)
// ============================================================

export function createFireToken() {
  return new Card({
    id: 'fire_token', name: 'Fire',
    description: 'Apply 1 Fire to target.',
    shortDesc: 'Fire', subtype: 'ability',
    cardType: CardType.SKILL, costType: CostType.FREE,
    effects: [new CardEffect('apply_fire', 1, TargetType.SINGLE_ENEMY)],
  });
}

export function createIceToken() {
  return new Card({
    id: 'ice_token', name: 'Ice',
    description: 'Apply 1 Ice to target.',
    shortDesc: 'Ice', subtype: 'ability',
    cardType: CardType.SKILL, costType: CostType.FREE,
    effects: [new CardEffect('apply_ice', 1, TargetType.SINGLE_ENEMY)],
  });
}

export function createCatFormToken() {
  return new Card({
    id: 'cat_form_token', name: 'Feline Form',
    description: 'Gain 1 Heroism. Draw.',
    shortDesc: 'Heroism, Draw', subtype: 'ability',
    cardType: CardType.SKILL, costType: CostType.FREE,
    effects: [new CardEffect('cat_form', 1, TargetType.SELF)],
  });
}

export function createBearFormToken() {
  return new Card({
    id: 'bear_form_token', name: 'Bear Form',
    description: 'Gain Shield. Draw.',
    shortDesc: 'Shield, Draw', subtype: 'ability',
    cardType: CardType.SKILL, costType: CostType.FREE,
    effects: [new CardEffect('bear_form', 1, TargetType.SELF)],
  });
}

// ============================================================
// Generic Starter Cards
// ============================================================

export function createWoodenSword() {
  return new Card({
    id: 'wooden_sword',
    name: 'Wooden Sword',
    description: 'Recharge -> Deal 3 damage.',
    shortDesc: 'R->3 Dmg',
    subtype: 'martial',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [new CardEffect('damage', 3, TargetType.SINGLE_ENEMY)],
  });
}

export function createLeatherArmor() {
  return new Card({
    id: 'leather_armor',
    name: 'Leather Armor',
    description: 'Recharge -> Block 2.',
    shortDesc: 'R->Block 2',
    subtype: 'light_armor',
    cardType: CardType.DEFENSE,
    costType: CostType.RECHARGE,
    effects: [new CardEffect('block', 2, TargetType.SELF)],
  });
}

export function createScraps() {
  return new Card({
    id: 'scraps',
    name: 'Scraps',
    description: 'Heal 2 -> Discard.',
    shortDesc: 'Heal 2->D',
    subtype: 'item',
    cardType: CardType.ITEM,
    costType: CostType.DISCARD,
    effects: [new CardEffect('heal', 2, TargetType.SELF)],
  });
}

// ============================================================
// Shared Weapon / Equipment Cards
// ============================================================

export function createWoodenAxe() {
  return new Card({
    id: 'wooden_axe',
    name: 'Wooden Axe',
    description: 'Recharge -> Deal 2 damage to up to 2 targets.',
    shortDesc: 'R->2 Dmg x2',
    subtype: 'martial',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [new CardEffect('multi_damage', 2, TargetType.SINGLE_ENEMY, 2)],
  });
}

export function createWoodenGreatsword() {
  return new Card({
    id: 'wooden_greatsword',
    name: 'Wooden Greatsword',
    description: 'Recharge +1 Card -> Deal 5 Damage.',
    shortDesc: 'R+1->5 Dmg',
    subtype: 'martial_2h',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('damage', 5, TargetType.SINGLE_ENEMY),
      new CardEffect('recharge_extra', 1, TargetType.SELF),
    ],
  });
}

export function createRockMace() {
  return new Card({
    id: 'rock_mace',
    name: 'Rock Mace',
    description: 'Recharge -> Deal 2 damage (+2 vs Armor or Shield).',
    shortDesc: 'R->2 Dmg\n(+2 vs Armor/Shield)',
    subtype: 'martial',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('armor_bonus_damage', 24, TargetType.SINGLE_ENEMY),
    ],
  });
}

export function createCrackedBuckler() {
  return new Card({
    id: 'cracked_buckler',
    name: 'Cracked Buckler',
    description: 'Recharge -> Gain Shield.',
    shortDesc: 'R->Shield',
    subtype: 'light_armor',
    cardType: CardType.ABILITY,
    costType: CostType.RECHARGE,
    effects: [new CardEffect('gain_shield', 1, TargetType.SELF)],
  });
}

export function createBuckler() {
  return new Card({
    id: 'buckler',
    name: 'Buckler',
    description: 'Recharge -> Gain 2 Shield.',
    shortDesc: 'R->Shield 2',
    subtype: 'light_armor',
    cardType: CardType.ABILITY,
    costType: CostType.RECHARGE,
    effects: [new CardEffect('gain_shield', 2, TargetType.SELF)],
    rarity: 'uncommon',
  });
}

export function createShortBow() {
  return new Card({
    id: 'short_bow',
    name: 'Short Bow',
    description: 'Recharge +1 Card -> Deal 3 Damage, Draw.',
    shortDesc: 'R+1->3 Dmg, Draw',
    subtype: 'ranged',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('damage', 3, TargetType.SINGLE_ENEMY),
      new CardEffect('draw', 1, TargetType.SELF),
      new CardEffect('recharge_extra', 1, TargetType.SELF),
    ],
  });
}

export function createShortStaff() {
  return new Card({
    id: 'short_staff',
    name: 'Short Staff',
    description: 'Recharge +1 Card -> Deal 4 Damage, Gain Shield.',
    shortDesc: 'R+1->4 Dmg, Shield',
    subtype: 'staff',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('damage', 4, TargetType.SINGLE_ENEMY),
      new CardEffect('gain_shield', 1, TargetType.SELF),
      new CardEffect('recharge_extra', 1, TargetType.SELF),
    ],
  });
}

export function createSmallPouch() {
  return new Card({
    id: 'small_pouch',
    name: 'Small Pouch',
    description: 'Recharge -> Scry 2.',
    shortDesc: 'R->Scry 2',
    subtype: 'item',
    cardType: CardType.ITEM,
    costType: CostType.RECHARGE,
    effects: [new CardEffect('scry_pick', 2, TargetType.SELF)],
  });
}

export function createKoboldSpear() {
  return new Card({
    id: 'kobold_spear',
    name: 'Kobold Spear',
    description: 'Recharge -> Deal 2 Damage, Draw.',
    shortDesc: 'R->2 Dmg, Draw',
    subtype: 'martial_2h',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('damage', 2, TargetType.SINGLE_ENEMY),
      new CardEffect('draw', 1, TargetType.SELF),
    ],
    rarity: 'uncommon',
  });
}

export function createKoboldShield() {
  return new Card({
    id: 'kobold_shield',
    name: 'Kobold Shield',
    description: 'Recharge -> Deal 1 Damage, gain Shield.',
    shortDesc: 'R->1 Dmg, +Shield',
    subtype: 'light_armor',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('damage', 1, TargetType.SINGLE_ENEMY),
      new CardEffect('gain_shield', 1, TargetType.SELF),
    ],
  });
}

export function createBoneDagger() {
  return new Card({
    id: 'bone_dagger',
    name: 'Bone Dagger',
    description: 'Deal 1 Damage. Stays in hand.',
    shortDesc: '1 Dmg, Stays',
    subtype: 'simple',
    cardType: CardType.ATTACK,
    costType: CostType.FREE,
    effects: [
      new CardEffect('damage', 1, TargetType.SINGLE_ENEMY),
      new CardEffect('stays_in_hand', 0, TargetType.SELF),
    ],
  });
}

// ============================================================
// Wizard Cards
// ============================================================

export function createClothArmor() {
  return new Card({
    id: 'cloth_armor',
    name: 'Cloth Armor',
    description: 'Recharge -> Block 1.',
    shortDesc: 'R->Block 1',
    subtype: 'clothing',
    cardType: CardType.DEFENSE,
    costType: CostType.RECHARGE,
    effects: [new CardEffect('block', 1, TargetType.SELF)],
  });
}

export function createFireBurst() {
  return new Card({
    id: 'fire_burst',
    name: 'Fire Burst',
    description: 'Recharge -> Deal 2 Damage and 1 Fire.',
    shortDesc: 'R->2 Dmg+Fire',
    subtype: 'ability',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('damage', 2, TargetType.SINGLE_ENEMY),
      new CardEffect('apply_fire', 1, TargetType.SINGLE_ENEMY),
    ],
    characterClass: ['wizard'],
    tier: 1,
  });
}

export function createIceBolt() {
  return new Card({
    id: 'ice_bolt',
    name: 'Ice Bolt',
    description: 'Recharge -> Deal 1 Damage and Ice, Draw.',
    shortDesc: 'R->1 Dmg+Ice, Draw',
    subtype: 'ability',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('damage', 1, TargetType.SINGLE_ENEMY),
      new CardEffect('apply_ice', 1, TargetType.SINGLE_ENEMY),
      new CardEffect('draw', 1, TargetType.SELF),
    ],
    characterClass: ['wizard'],
    tier: 1,
  });
}

export function createMagicMissiles() {
  return new Card({
    id: 'magic_missiles',
    name: 'Magic Missiles',
    description:
      'Recharge -> Deal 1 Damage, Draw.\nOptional: Recharge 1 more -> 3 shots of 1 damage each.',
    shortDesc: 'R->1 Dmg, Draw\nOpt R+1->3x1 Dmg',
    subtype: 'ability',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('damage', 1, TargetType.SINGLE_ENEMY),
      new CardEffect('draw', 1, TargetType.SELF),
      new CardEffect('barrage', 2, TargetType.SELF),
    ],
    characterClass: ['wizard'],
    tier: 1,
  });
}

export function createArcaneShield() {
  return new Card({
    id: 'arcane_shield',
    name: 'Arcane Shield',
    description: 'Recharge -> Gain 2 Shield.',
    shortDesc: 'R->Shield 2',
    subtype: 'ability',
    cardType: CardType.ABILITY,
    costType: CostType.RECHARGE,
    effects: [new CardEffect('gain_shield', 2, TargetType.SELF)],
    characterClass: ['wizard'],
    tier: 1,
  });
}

// ============================================================
// Rogue Cards
// ============================================================

export function createVialOfPoison() {
  return new Card({
    id: 'vial_of_poison',
    name: 'Vial of Poison',
    description: 'Recharge -> Next attack applies Poison.',
    shortDesc: 'R->+Poison',
    subtype: 'item',
    cardType: CardType.ITEM,
    costType: CostType.RECHARGE,
    effects: [new CardEffect('grant_poison_buff', 1, TargetType.SELF)],
    characterClass: ['rogue'],
    tier: 1,
  });
}

export function createSneakAttack() {
  return new Card({
    id: 'sneak_attack',
    name: 'Sneak Attack',
    description: 'Recharge -> Deal X Damage.\nX = # of attacks this turn (counts itself).',
    shortDesc: 'R->X Dmg\nX = # attacks',
    subtype: 'ability',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [new CardEffect('sneak_attack', 0, TargetType.SINGLE_ENEMY)],
    characterClass: ['rogue', 'druid'],
    tier: 1,
  });
}

function createSmallSpiderCreature() {
  return new Creature({
    name: 'Pet Spider',
    attack: 0,
    maxHp: 1,
    poisonAttack: true,
  });
}

export function createPetSpider() {
  return new Card({
    id: 'pet_spider',
    name: 'Pet Spider',
    description: 'Recharge -> Summon a 0/1 Spider (Poison Attack).',
    shortDesc: 'R->Summon Spider',
    subtype: 'ability',
    cardType: CardType.CREATURE,
    costType: CostType.RECHARGE,
    effects: [new CardEffect('summon_small_spider', 1, TargetType.SUMMON)],
    characterClass: ['rogue'],
    tier: 1,
    previewCreature: createSmallSpiderCreature(),
  });
}

// ============================================================
// Warrior Cards
// ============================================================

export function createHeroicStrike() {
  return new Card({
    id: 'heroic_strike',
    name: 'Heroic Strike',
    description: 'Recharge -> Gain 3 Heroism.',
    shortDesc: 'R->Heroism 3',
    subtype: 'ability',
    cardType: CardType.ABILITY,
    costType: CostType.RECHARGE,
    effects: [new CardEffect('gain_heroism', 3, TargetType.SELF)],
    characterClass: ['paladin', 'warrior'],
    tier: 1,
  });
}

export function createCharge() {
  return new Card({
    id: 'charge',
    name: 'Charge',
    description: 'Recharge -> Deal 2 Damage. Draw 1 if first attack this turn.',
    shortDesc: 'R->2 Dmg\nDraw 1 if 1st atk',
    subtype: 'ability',
    cardType: CardType.ABILITY,
    costType: CostType.RECHARGE,
    effects: [new CardEffect('charge_attack', 2, TargetType.SINGLE_ENEMY)],
    characterClass: ['warrior'],
    tier: 1,
  });
}

export function createGreaterCleave() {
  return new Card({
    id: 'greater_cleave',
    name: 'Greater Cleave',
    description: 'Recharge -> Next martial weapon hits an extra target.',
    shortDesc: 'R->+1 Target',
    subtype: 'ability',
    cardType: CardType.ABILITY,
    costType: CostType.RECHARGE,
    effects: [new CardEffect('greater_cleave_buff', 1, TargetType.SELF)],
    characterClass: ['warrior'],
    tier: 1,
  });
}

export function createRecklessStrike() {
  return new Card({
    id: 'reckless_strike',
    name: 'Reckless Strike',
    description: 'Discard -> Deal 6 Damage.',
    shortDesc: 'D->6 Dmg',
    subtype: 'ability',
    cardType: CardType.ATTACK,
    costType: CostType.DISCARD,
    effects: [new CardEffect('damage', 6, TargetType.SINGLE_ENEMY)],
    characterClass: ['warrior'],
    tier: 1,
  });
}

export function createShieldBash() {
  return new Card({
    id: 'shield_bash',
    name: 'Shield Bash',
    description: 'Recharge -> Gain Shield, Deal damage = Shield.',
    shortDesc: 'R->+1 Shield\nDmg=Shield',
    subtype: 'ability',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [new CardEffect('shield_bash', 1, TargetType.SINGLE_ENEMY)],
    characterClass: ['warrior'],
    tier: 1,
  });
}

// ============================================================
// Paladin Cards
// ============================================================

export function createHolyLight() {
  return new Card({
    id: 'holy_light',
    name: 'Holy Light',
    description: 'Recharge -> Heal 1, Draw.',
    shortDesc: 'R->Heal 1, Draw',
    subtype: 'ability',
    cardType: CardType.ABILITY,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('heal', 1, TargetType.SINGLE_ALLY),
      new CardEffect('draw', 1, TargetType.SELF),
    ],
    characterClass: ['paladin'],
    tier: 1,
  });
}

export function createShieldOfFaith() {
  return new Card({
    id: 'shield_of_faith',
    name: 'Shield of Faith',
    description: 'Recharge -> Gain Shield, Draw.',
    shortDesc: 'R->Shield, Draw',
    subtype: 'ability',
    cardType: CardType.ABILITY,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('gain_shield', 1, TargetType.SELF),
      new CardEffect('draw', 1, TargetType.SELF),
    ],
    characterClass: ['paladin'],
    tier: 1,
  });
}

// ============================================================
// Ranger Cards
// ============================================================

export function createCarefulStrike() {
  return new Card({
    id: 'careful_strike',
    name: 'Careful Strike',
    description: 'Recharge -> Deal 2 Damage, Gain Shield.',
    shortDesc: 'R->2 Dmg, Shield',
    subtype: 'ability',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('damage', 2, TargetType.SINGLE_ENEMY),
      new CardEffect('gain_shield', 1, TargetType.SELF),
    ],
    characterClass: ['ranger', 'rogue'],
    tier: 1,
  });
}

export function createMultiShot() {
  return new Card({
    id: 'multi_shot',
    name: 'Multi Shot',
    description: 'Recharge -> Deal 1 Damage to up to 3 targets.',
    shortDesc: 'R->1 Dmg x3',
    subtype: 'ability',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [new CardEffect('multi_damage', 1, TargetType.SINGLE_ENEMY, 3)],
    characterClass: ['ranger'],
    tier: 1,
  });
}

export function createGoodberry() {
  return new Card({
    id: 'goodberry',
    name: 'Goodberry',
    description: 'Banish -> Heal 1.',
    shortDesc: 'B->Heal 1',
    subtype: 'item',
    cardType: CardType.ITEM,
    costType: CostType.BANISH,
    effects: [new CardEffect('heal', 1, TargetType.SELF)],
    isToken: true,
  });
}

// Raena — recruited at Calm Grove after the General Zhost fight. Summons
// the multi-attack ranger as a player ally (R+1 cost).
export function createRaenaCard() {
  return new Card({
    id: 'raena_card',
    name: 'Raena',
    description: 'Play -> Call Raena to the battle!',
    shortDesc: 'Call Raena',
    subtype: 'allies',
    cardType: CardType.CREATURE,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('summon_raena', 1, TargetType.SUMMON),
      new CardEffect('recharge_extra', 1, TargetType.SELF),
    ],
    rarity: 'rare',
    isUnique: true,
    previewCreature: createRaenaCreature(),
  });
}

// Raena (tier 2) — upgraded version awarded at the Welcome to Tharnag
// level-up. Stats bump to 3/4 with the same multi-attack profile.
export function createRaenaCard2() {
  return new Card({
    id: 'raena_card_2',
    name: 'Raena',
    description: 'Play -> Call Raena to the battle!',
    shortDesc: 'Call Raena',
    subtype: 'allies',
    cardType: CardType.CREATURE,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('summon_raena_upgraded', 1, TargetType.SUMMON),
      new CardEffect('recharge_extra', 1, TargetType.SELF),
    ],
    rarity: 'rare',
    isUnique: true,
    tier: 2,
    previewCreature: createRaenaUpgradedCreature(),
  });
}

// Lambas Bread — elvish healing item awarded by Raena at Calm Grove.
export function createLambasBread() {
  return new Card({
    id: 'lambas_bread',
    name: 'Lambas Bread',
    description: 'Banish + Recharge 1 -> Heal 6.',
    shortDesc: 'B+R1->Heal 6',
    subtype: 'item',
    cardType: CardType.ITEM,
    costType: CostType.BANISH,
    effects: [
      new CardEffect('heal', 6, TargetType.SELF),
      new CardEffect('recharge_extra', 1, TargetType.SELF),
    ],
    rarity: 'uncommon',
  });
}

// Small Faery — gift from the Calm Stream "Bathe" choice. Banish to heal
// the player and all allies for 3.
export function createSmallFaery() {
  return new Card({
    id: 'small_faery',
    name: 'Small Faery',
    description: 'Banish -> Heal yourself and your allies for 3.',
    shortDesc: 'B->Heal All 3',
    subtype: 'allies',
    cardType: CardType.ABILITY,
    costType: CostType.BANISH,
    effects: [new CardEffect('heal_all', 3, TargetType.SELF)],
    rarity: 'rare',
    tier: 1,
  });
}

export function createGoodberries() {
  return new Card({
    id: 'goodberries',
    name: 'Goodberries',
    description: 'Recharge -> Create 2 Goodberries.',
    shortDesc: 'R->2 Goodberries',
    subtype: 'ability',
    cardType: CardType.ABILITY,
    costType: CostType.RECHARGE,
    effects: [new CardEffect('create_goodberries', 2, TargetType.SELF)],
    characterClass: ['ranger'],
    tier: 1,
    previewCard: createGoodberry(),
  });
}

// ============================================================
// Druid Cards
// ============================================================

export function createWrath() {
  return new Card({
    id: 'wrath',
    name: 'Wrath',
    description: 'Choose 1:\n3 Damage\nOR 1 Damage, Draw.',
    shortDesc: 'R->3 Dmg\nOR 1 Dmg, Draw',
    subtype: 'ability',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [],
    modes: [
      new CardMode('Deal 3 Damage', [
        new CardEffect('damage', 3, TargetType.SINGLE_ENEMY),
      ]),
      new CardMode('Deal 1 Damage, Draw', [
        new CardEffect('damage', 1, TargetType.SINGLE_ENEMY),
        new CardEffect('draw', 1, TargetType.SELF),
      ]),
    ],
    characterClass: ['druid'],
    tier: 1,
  });
}

export function createRegrowth() {
  return new Card({
    id: 'regrowth',
    name: 'Regrowth',
    description: 'Recharge -> Heal 1. Heal 1 at start of turn for 4 turns.',
    shortDesc: 'R->Heal 1\n+Regen 4t',
    subtype: 'ability',
    cardType: CardType.ABILITY,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('heal', 1, TargetType.SELF),
      new CardEffect('regen_buff', 4, TargetType.SELF),
    ],
    characterClass: ['druid'],
    tier: 1,
  });
}

export function createFeralSwipe() {
  return new Card({
    id: 'feral_swipe',
    name: 'Feral Swipe',
    description: 'Recharge -> Gain 2 Shield.\nDeal 1 damage per Shield\nto separate enemies.',
    shortDesc: 'R->Shield 2\n1 Dmg x Shield',
    subtype: 'ability',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('gain_shield', 2, TargetType.SELF),
      new CardEffect('feral_swipe_damage', 1, TargetType.SINGLE_ENEMY),
    ],
    characterClass: ['druid'],
    tier: 1,
  });
}

// ============================================================
// Starter Deck Functions
// ============================================================

export function getPaladinStarterDeck() {
  const cards = [];
  // 2 Wooden Swords
  for (let i = 0; i < 2; i++) cards.push(createWoodenSword());
  // 3 Leather Armors
  for (let i = 0; i < 3; i++) cards.push(createLeatherArmor());
  // 2 Cracked Buckler
  for (let i = 0; i < 2; i++) cards.push(createCrackedBuckler());
  // 2 Wooden Greatsword
  for (let i = 0; i < 2; i++) cards.push(createWoodenGreatsword());
  // 2 Rock Mace
  for (let i = 0; i < 2; i++) cards.push(createRockMace());
  // 1 Scraps
  cards.push(createScraps());
  return cards;
}

export function getRangerStarterDeck() {
  const cards = [];
  // 3 Short Bow
  for (let i = 0; i < 3; i++) cards.push(createShortBow());
  // 2 Wooden Axe
  for (let i = 0; i < 2; i++) cards.push(createWoodenAxe());
  // 2 Wooden Sword
  for (let i = 0; i < 2; i++) cards.push(createWoodenSword());
  // 3 Leather Armor
  for (let i = 0; i < 3; i++) cards.push(createLeatherArmor());
  // 2 Scraps
  for (let i = 0; i < 2; i++) cards.push(createScraps());
  return cards;
}

export function getWizardStarterDeck() {
  const cards = [];
  // 3 Short Staff
  for (let i = 0; i < 3; i++) cards.push(createShortStaff());
  // 2 Cloth Armor
  for (let i = 0; i < 2; i++) cards.push(createClothArmor());
  // 1 Fire Burst
  cards.push(createFireBurst());
  // 1 Ice Bolt
  cards.push(createIceBolt());
  // 1 Magic Missiles
  cards.push(createMagicMissiles());
  // 1 Arcane Shield
  cards.push(createArcaneShield());
  // 3 Scraps
  for (let i = 0; i < 3; i++) cards.push(createScraps());
  return cards;
}

export function getRogueStarterDeck() {
  const cards = [];
  // 2 Wooden Swords
  for (let i = 0; i < 2; i++) cards.push(createWoodenSword());
  // 2 Short Bows
  for (let i = 0; i < 2; i++) cards.push(createShortBow());
  // 2 Bone Daggers
  for (let i = 0; i < 2; i++) cards.push(createBoneDagger());
  // 3 Leather Armors
  for (let i = 0; i < 3; i++) cards.push(createLeatherArmor());
  // 1 Small Pouch
  cards.push(createSmallPouch());
  // 2 Scraps
  for (let i = 0; i < 2; i++) cards.push(createScraps());
  return cards;
}

export function getWarriorStarterDeck() {
  const cards = [];
  // 3 Wooden Axe
  for (let i = 0; i < 3; i++) cards.push(createWoodenAxe());
  // 2 Wooden Greatsword
  for (let i = 0; i < 2; i++) cards.push(createWoodenGreatsword());
  // 2 Rock Mace
  for (let i = 0; i < 2; i++) cards.push(createRockMace());
  // 1 Scraps
  cards.push(createScraps());
  // 3 Leather Armor
  for (let i = 0; i < 3; i++) cards.push(createLeatherArmor());
  // 1 Cracked Buckler
  cards.push(createCrackedBuckler());
  return cards;
}

export function getDruidStarterDeck() {
  const cards = [];
  // 1 Bone Dagger
  cards.push(createBoneDagger());
  // 3 Short Staff
  for (let i = 0; i < 3; i++) cards.push(createShortStaff());
  // 3 Leather Armor
  for (let i = 0; i < 3; i++) cards.push(createLeatherArmor());
  // 1 Cracked Buckler
  cards.push(createCrackedBuckler());
  // 1 Small Pouch
  cards.push(createSmallPouch());
  // 2 Scraps
  for (let i = 0; i < 2; i++) cards.push(createScraps());
  // 1 Wrath
  cards.push(createWrath());
  return cards;
}

// ============================================================
// Additional Ability Cards (not in starter decks)
// ============================================================

export function createFlashHeal() {
  return new Card({
    id: 'flash_heal',
    name: 'Flash Heal',
    description: 'Recharge -> Heal 3.',
    shortDesc: 'R->Heal 3',
    subtype: 'ability',
    cardType: CardType.ABILITY,
    costType: CostType.RECHARGE,
    effects: [new CardEffect('heal', 3, TargetType.SINGLE_ALLY)],
    characterClass: ['paladin'],
    tier: 1,
  });
}

function createTamedRatCreature() {
  return new Creature({
    name: 'Tamed Rat',
    attack: 1,
    maxHp: 1,
  });
}

export function createTamedRat() {
  return new Card({
    id: 'tamed_rat',
    name: 'Tamed Rat',
    description: 'Recharge -> Summon 1-2 Tamed Rats.',
    shortDesc: 'R->Summon 1-2 Rats',
    subtype: 'ability',
    cardType: CardType.CREATURE,
    costType: CostType.RECHARGE,
    effects: [new CardEffect('summon_tamed_rat', 1, TargetType.SUMMON)],
    characterClass: ['ranger'],
    tier: 1,
    previewCreature: createTamedRatCreature(),
  });
}

// ============================================================
// Tier 2 Ability Cards (offered at the Tharnag arrival level-up
// and the Cathedral Shrine prayer). Mirrors PY cards_basic.py.
// ============================================================

// --- Paladin Tier 2 ---
export function createConsecration() {
  return new Card({
    id: 'consecration', name: 'Consecration',
    description: 'Recharge -> Deal 2 Damage to ALL enemies.',
    shortDesc: 'R->2 Dmg ALL', subtype: 'ability',
    cardType: CardType.ATTACK, costType: CostType.RECHARGE,
    effects: [new CardEffect('damage_all', 2, TargetType.ALL_ENEMIES)],
    characterClass: ['paladin'], tier: 2,
  });
}

export function createHammerOfWrath() {
  return new Card({
    id: 'hammer_of_wrath', name: 'Hammer of Wrath',
    description: 'Recharge -> Deal 3 Damage. Draw 1.',
    shortDesc: 'R->3 Dmg, Draw 1', subtype: 'ability',
    cardType: CardType.ATTACK, costType: CostType.RECHARGE,
    effects: [
      new CardEffect('damage', 3, TargetType.SINGLE_ENEMY),
      new CardEffect('draw', 1, TargetType.SELF),
    ],
    characterClass: ['paladin'], tier: 2,
  });
}

export function createHolySword() {
  return new Card({
    id: 'holy_sword', name: 'Holy Sword',
    description: 'Recharge +1 Card -> Deal 6 Damage. Heal 3.',
    shortDesc: 'R+1->6 Dmg, Heal 3', subtype: 'martial',
    cardType: CardType.ATTACK, costType: CostType.RECHARGE,
    effects: [
      new CardEffect('damage', 6, TargetType.SINGLE_ENEMY),
      new CardEffect('heal', 3, TargetType.SELF),
      new CardEffect('recharge_extra', 1, TargetType.SELF),
    ],
    characterClass: ['paladin'], tier: 2,
  });
}

export function createRevivify() {
  return new Card({
    id: 'revivify', name: 'Revivify',
    description: 'Recharge -> Choose 1 of up to 3\ndead allies in your discard pile\nand summon it.',
    shortDesc: 'R->Revive 1 of\nup to 3 Allies', subtype: 'ability',
    cardType: CardType.ABILITY, costType: CostType.RECHARGE,
    effects: [new CardEffect('revivify', 3, TargetType.SELF)],
    characterClass: ['paladin'], tier: 2,
  });
}

// --- Ranger Tier 2 ---
function createMishaCreature() {
  return new Creature({ name: 'Misha', attack: 4, maxHp: 4, sentinel: true, description: 'Sentinel' });
}
function createHufferCreature() {
  return new Creature({ name: 'Huffer', attack: 4, maxHp: 2, haste: true, description: 'Haste' });
}

export function createHuntersMark() {
  return new Card({
    id: 'hunters_mark', name: "Hunter's Mark",
    description: 'Recharge -> Mark an enemy.\nDraw 1. +1 dmg per Mark.',
    shortDesc: 'R->Mark, Draw 1', subtype: 'ability',
    cardType: CardType.ABILITY, costType: CostType.RECHARGE,
    effects: [
      new CardEffect('apply_mark', 1, TargetType.SINGLE_ENEMY),
      new CardEffect('draw', 1, TargetType.SELF),
    ],
    characterClass: ['ranger'], tier: 2,
  });
}

export function createAnimalCompanion() {
  return new Card({
    id: 'animal_companion', name: 'Animal Companion',
    description: 'Recharge -> Summon:\nMisha (4/4 Sentinel)\nOR Huffer (4/2 Haste)',
    shortDesc: 'R->Summon\nMisha or Huffer', subtype: 'ability',
    cardType: CardType.CREATURE, costType: CostType.RECHARGE,
    effects: [],
    modes: [
      new CardMode('Summon Misha (4/4 Sentinel)',
        [new CardEffect('summon_misha', 1, TargetType.SUMMON)]),
      new CardMode('Summon Huffer (4/2 Haste)',
        [new CardEffect('summon_huffer', 1, TargetType.SUMMON)]),
    ],
    characterClass: ['ranger'], tier: 2,
    previewCreatures: [createMishaCreature(), createHufferCreature()],
  });
}

export function createPiercingShot() {
  return new Card({
    id: 'piercing_shot', name: 'Piercing Shot',
    description: 'Recharge -> Deal 4 Unpreventable\nDamage with Overwhelm.',
    shortDesc: 'R->4 Unpreventable\n+Overwhelm', subtype: 'ability',
    cardType: CardType.ATTACK, costType: CostType.RECHARGE,
    effects: [
      new CardEffect('unpreventable_damage', 4, TargetType.SINGLE_ENEMY),
      new CardEffect('player_overwhelm', 0, TargetType.SELF),
    ],
    characterClass: ['ranger'], tier: 2,
  });
}

export function createExplosiveShot() {
  return new Card({
    id: 'explosive_shot', name: 'Explosive Shot',
    description: 'Recharge -> Deal 4 Damage.\n1 Fire to all other enemies.',
    shortDesc: 'R->4 Dmg\n+Fire ALL', subtype: 'ability',
    cardType: CardType.ATTACK, costType: CostType.RECHARGE,
    effects: [
      new CardEffect('damage', 4, TargetType.SINGLE_ENEMY),
      new CardEffect('splash_fire', 1, TargetType.ALL_ENEMIES),
    ],
    characterClass: ['ranger'], tier: 2,
  });
}

// --- Wizard Tier 2 ---
export function createBurningHands() {
  return new Card({
    id: 'burning_hands', name: 'Burning Hands',
    description: 'Recharge -> Deal 1 Damage and 1 Fire to ALL enemies.',
    shortDesc: 'R->1 Dmg+Fire ALL', subtype: 'ability',
    cardType: CardType.ATTACK, costType: CostType.RECHARGE,
    effects: [
      new CardEffect('damage_all', 1, TargetType.ALL_ENEMIES),
      new CardEffect('apply_fire_all', 1, TargetType.ALL_ENEMIES),
    ],
    characterClass: ['wizard'], tier: 2,
  });
}

export function createIceNova() {
  return new Card({
    id: 'ice_nova', name: 'Ice Nova',
    description: 'Recharge -> Deal 1 Damage and 1 Ice to ALL enemies.',
    shortDesc: 'R->1 Dmg+Ice ALL', subtype: 'ability',
    cardType: CardType.ATTACK, costType: CostType.RECHARGE,
    effects: [
      new CardEffect('damage_all', 1, TargetType.ALL_ENEMIES),
      new CardEffect('apply_ice_all', 1, TargetType.ALL_ENEMIES),
    ],
    characterClass: ['wizard'], tier: 2,
  });
}

export function createIceBlock() {
  return new Card({
    id: 'ice_block', name: 'Ice Block',
    description: 'Recharge -> Gain 4 Ice and 8 Shield.',
    shortDesc: 'R->4 Ice, 8 Shield', subtype: 'ability',
    cardType: CardType.ABILITY, costType: CostType.RECHARGE,
    effects: [
      new CardEffect('apply_ice_self', 4, TargetType.SELF),
      new CardEffect('gain_shield', 8, TargetType.SELF),
    ],
    characterClass: ['wizard'], tier: 2,
  });
}

export function createArcaneBeam() {
  return new Card({
    id: 'arcane_beam', name: 'Arcane Beam',
    description: 'Recharge -> Deal 4 Damage. Recharge up to 3 extra cards for +3 damage each.',
    shortDesc: 'R->4-13 Dmg', subtype: 'ability',
    cardType: CardType.ATTACK, costType: CostType.RECHARGE,
    effects: [
      new CardEffect('damage', 4, TargetType.SINGLE_ENEMY),
      new CardEffect('optional_recharge_damage', 3, TargetType.SELF),
    ],
    characterClass: ['wizard'], tier: 2,
  });
}

// --- Rogue Tier 2 ---
export function createFanOfBlades() {
  return new Card({
    id: 'fan_of_blades', name: 'Fan of Blades',
    description: 'Recharge -> Deal 1 Damage to ALL enemies.\nDraw 1.',
    shortDesc: 'R->1 Dmg ALL\nDraw 1', subtype: 'ability',
    cardType: CardType.ATTACK, costType: CostType.RECHARGE,
    effects: [
      new CardEffect('damage_all', 1, TargetType.ALL_ENEMIES),
      new CardEffect('draw', 1, TargetType.SELF),
    ],
    characterClass: ['rogue'], tier: 2,
  });
}

export function createBackstab() {
  return new Card({
    id: 'backstab', name: 'Backstab',
    description: 'Recharge -> Deal 6 Damage. Draw 1.\nMust target an undamaged enemy.',
    shortDesc: 'R->6 Dmg, Draw 1\n(Full HP)', subtype: 'ability',
    cardType: CardType.ATTACK, costType: CostType.RECHARGE,
    effects: [
      new CardEffect('damage', 6, TargetType.SINGLE_ENEMY),
      new CardEffect('draw', 1, TargetType.SELF),
      new CardEffect('backstab_restriction', 0, TargetType.SELF),
    ],
    characterClass: ['rogue'], tier: 2,
  });
}

export function createPoisonedDagger() {
  return new Card({
    id: 'poisoned_dagger', name: 'Poisoned Dagger',
    description: 'Deal 2 Damage + Poison.\nStays in hand.',
    shortDesc: '2 Dmg+Poison\nStays', subtype: 'simple',
    cardType: CardType.ATTACK, costType: CostType.FREE,
    effects: [
      new CardEffect('damage', 2, TargetType.SINGLE_ENEMY),
      new CardEffect('apply_poison', 1, TargetType.SINGLE_ENEMY),
      new CardEffect('stays_in_hand', 0, TargetType.SELF),
    ],
    characterClass: ['rogue'], tier: 2,
  });
}

export function createSprint() {
  return new Card({
    id: 'sprint', name: 'Sprint',
    description: 'Recharge -> Draw 2 cards.',
    shortDesc: 'R->Draw 2', subtype: 'ability',
    cardType: CardType.ABILITY, costType: CostType.RECHARGE,
    effects: [new CardEffect('draw', 2, TargetType.SELF)],
    characterClass: ['rogue'], tier: 2,
  });
}

// --- Warrior Tier 2 ---
export function createThunderclap() {
  return new Card({
    id: 'thunderclap', name: 'Thunderclap',
    description: 'Recharge -> Apply 1 Shock to ALL enemies.',
    shortDesc: 'R->Shock ALL', subtype: 'ability',
    cardType: CardType.ABILITY, costType: CostType.RECHARGE,
    effects: [new CardEffect('apply_shock_all', 1, TargetType.ALL_ENEMIES)],
    characterClass: ['warrior'], tier: 2,
  });
}

export function createShieldWall() {
  return new Card({
    id: 'shield_wall', name: 'Shield Wall',
    description: 'Recharge -> Gain 4 Shield.\nAllies gain 1 Shield.',
    shortDesc: 'R->4 Shld, Ally 1', subtype: 'ability',
    cardType: CardType.ABILITY, costType: CostType.RECHARGE,
    effects: [
      new CardEffect('gain_shield', 4, TargetType.SELF),
      new CardEffect('buff_allies_shield', 1, TargetType.SELF),
    ],
    characterClass: ['warrior'], tier: 2,
  });
}

export function createBattleShout() {
  return new Card({
    id: 'battle_shout', name: 'Battle Shout',
    description: 'Recharge -> Gain 1 Heroism.\nAllies gain 1 Heroism.\nDraw 1.',
    shortDesc: 'R->Hero+Ally Hero\nDraw 1', subtype: 'ability',
    cardType: CardType.ABILITY, costType: CostType.RECHARGE,
    effects: [
      new CardEffect('gain_heroism', 1, TargetType.SELF),
      new CardEffect('buff_allies_heroism', 1, TargetType.SELF),
      new CardEffect('draw', 1, TargetType.SELF),
    ],
    characterClass: ['warrior'], tier: 2,
  });
}

export function createExecute() {
  return new Card({
    id: 'execute', name: 'Execute',
    description: 'Recharge -> Deal 5 Damage. Draw 1.\nMust target enemy below half HP.',
    shortDesc: 'R->5 Dmg, Draw 1\n(<50% HP)', subtype: 'ability',
    cardType: CardType.ATTACK, costType: CostType.RECHARGE,
    effects: [
      new CardEffect('damage', 5, TargetType.SINGLE_ENEMY),
      new CardEffect('draw', 1, TargetType.SELF),
      new CardEffect('execute_restriction', 0, TargetType.SELF),
    ],
    characterClass: ['warrior'], tier: 2,
  });
}

// --- Druid Tier 2 ---
function createTreantCreature() {
  return new Creature({ name: 'Treant', attack: 1, maxHp: 1, haste: true, description: 'Haste' });
}

export function createSummonTreants() {
  return new Card({
    id: 'summon_treants', name: 'Summon Treants',
    description: 'Recharge -> Summon 3-4 Treants.\n(1/1 with Haste)',
    shortDesc: 'R->Summon 3-4\nTreants', subtype: 'ability',
    cardType: CardType.CREATURE, costType: CostType.RECHARGE,
    effects: [new CardEffect('summon_treants', 1, TargetType.SUMMON)],
    characterClass: ['druid'], tier: 2,
    previewCreature: createTreantCreature(),
  });
}

export function createFeralBite() {
  return new Card({
    id: 'feral_bite', name: 'Feral Bite',
    description: 'Recharge -> Deal 3 Damage. Gain 3 Shield.',
    shortDesc: 'R->3 Dmg, 3 Shield', subtype: 'ability',
    cardType: CardType.ATTACK, costType: CostType.RECHARGE,
    effects: [
      new CardEffect('damage', 3, TargetType.SINGLE_ENEMY),
      new CardEffect('gain_shield', 3, TargetType.SELF),
    ],
    characterClass: ['druid'], tier: 2,
  });
}

export function createStarfire() {
  return new Card({
    id: 'starfire', name: 'Starfire',
    description: 'Recharge +1 Card -> Deal 6 Damage. Draw 1.',
    shortDesc: 'R+1->6 Dmg, Draw 1', subtype: 'ability',
    cardType: CardType.ATTACK, costType: CostType.RECHARGE,
    effects: [
      new CardEffect('damage', 6, TargetType.SINGLE_ENEMY),
      new CardEffect('draw', 1, TargetType.SELF),
      new CardEffect('recharge_extra', 1, TargetType.SELF),
    ],
    characterClass: ['druid'], tier: 2,
  });
}

export function createHealingTouch() {
  return new Card({
    id: 'healing_touch', name: 'Healing Touch',
    description: 'Recharge +1 Card -> Heal 8.',
    shortDesc: 'R+1->Heal 8', subtype: 'ability',
    cardType: CardType.ABILITY, costType: CostType.RECHARGE,
    effects: [
      new CardEffect('heal', 8, TargetType.SINGLE_ALLY),
      new CardEffect('recharge_extra', 1, TargetType.SELF),
    ],
    characterClass: ['druid'], tier: 2,
  });
}

// ============================================================
// Ability Choice Lists
// ============================================================

export function getPaladinAbilityChoices() {
  return [createHeroicStrike(), createHolyLight(), createShieldOfFaith(), createFlashHeal(),
          createConsecration(), createHammerOfWrath(), createHolySword(), createRevivify()];
}

export function getRangerAbilityChoices() {
  return [createTamedRat(), createGoodberries(), createMultiShot(), createCarefulStrike(),
          createHuntersMark(), createAnimalCompanion(), createPiercingShot(), createExplosiveShot()];
}

export function getWizardAbilityChoices() {
  return [createFireBurst(), createIceBolt(), createMagicMissiles(), createArcaneShield(),
          createBurningHands(), createIceNova(), createIceBlock(), createArcaneBeam()];
}

export function getRogueAbilityChoices() {
  return [createVialOfPoison(), createSneakAttack(), createPetSpider(), createCarefulStrike(),
          createFanOfBlades(), createBackstab(), createPoisonedDagger(), createSprint()];
}

export function getWarriorAbilityChoices() {
  return [createHeroicStrike(), createCharge(), createRecklessStrike(), createShieldBash(),
          createThunderclap(), createShieldWall(), createBattleShout(), createExecute()];
}

export function getDruidAbilityChoices() {
  return [createWrath(), createRegrowth(), createFeralSwipe(), createSneakAttack(),
          createSummonTreants(), createFeralBite(), createStarfire(), createHealingTouch()];
}

export function getAbilityChoices(className, count = 3, tier = 1) {
  const choiceFns = {
    Paladin: getPaladinAbilityChoices,
    Ranger: getRangerAbilityChoices,
    Wizard: getWizardAbilityChoices,
    Rogue: getRogueAbilityChoices,
    Warrior: getWarriorAbilityChoices,
    Druid: getDruidAbilityChoices,
  };
  const all = (choiceFns[className] || getPaladinAbilityChoices)();
  const tierMatch = all.filter(c => c.tier === tier);
  const shuffled = tierMatch.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

// ============================================================
// Enemy Cards - Giant Rat
// ============================================================

export function createBite() {
  return new Card({
    id: 'bite',
    name: 'Bite',
    description: 'Recharge -> Deal 1 damage.',
    shortDesc: 'R->1 Dmg',
    subtype: 'weapon',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [new CardEffect('damage', 1, TargetType.SINGLE_ENEMY)],
  });
}

export function createToughHide() {
  return new Card({
    id: 'tough_hide',
    name: 'Tough Hide',
    description: 'Recharge -> Block 1.',
    shortDesc: 'R->Block 1',
    subtype: 'armor',
    cardType: CardType.DEFENSE,
    costType: CostType.RECHARGE,
    effects: [new CardEffect('block', 1, TargetType.SELF)],
  });
}

export function createBigBone() {
  return new Card({
    id: 'big_bone',
    name: 'Big Bone',
    description: 'Recharge +1 Card -> Deal 2 damage.',
    shortDesc: 'R+1->2 Dmg',
    subtype: 'weapon',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('damage', 2, TargetType.SINGLE_ENEMY),
      new CardEffect('recharge_extra', 1, TargetType.SELF),
    ],
  });
}

export function createLooseBone() {
  return new Card({
    id: 'loose_bone',
    name: 'Loose Bone',
    description: 'Recharge -> Block 1.',
    shortDesc: 'R->Block 1',
    subtype: 'armor',
    cardType: CardType.DEFENSE,
    costType: CostType.RECHARGE,
    effects: [new CardEffect('block', 1, TargetType.SELF)],
  });
}

export function createSkreeeeeeeek() {
  return new Card({
    id: 'skreeeeeeeek',
    name: 'Skreeeeeeeek!',
    description: 'Recharge -> Summon 1-3 Rats.',
    shortDesc: 'R->1-3 Rats',
    subtype: 'allies',
    cardType: CardType.CREATURE,
    costType: CostType.RECHARGE,
    effects: [new CardEffect('summon_random', 3, TargetType.SUMMON)],
  });
}

// ============================================================
// Enemy Cards - Slime
// ============================================================

export function createSlimeAppendage() {
  return new Card({
    id: 'slime_appendage',
    name: 'Slime Appendage',
    description: 'Recharge -> Deal 1 unpreventable damage.',
    shortDesc: 'R->1 True Dmg',
    subtype: 'weapon',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [new CardEffect('unpreventable_damage', 1, TargetType.SINGLE_ENEMY)],
  });
}

// === Slime Loot Cards ===

export function createPartiallyDigestedBone() {
  return new Card({
    id: 'partially_digested_bone',
    name: 'Partially Digested Bone',
    description: 'Recharge -> Deal 2 Unpreventable Damage.',
    shortDesc: 'R->2 True Dmg',
    subtype: 'martial',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [new CardEffect('unpreventable_damage', 2, TargetType.SINGLE_ENEMY)],
    rarity: 'uncommon',
  });
}

export function createCorrodedArmor() {
  return new Card({
    id: 'corroded_armor',
    name: 'Corroded Armor',
    description: 'Discard -> Block 6.',
    shortDesc: 'D->Block 6',
    subtype: 'heavy_armor',
    cardType: CardType.DEFENSE,
    costType: CostType.DISCARD,
    effects: [new CardEffect('block', 6, TargetType.SELF)],
  });
}

function createPetSlimeCreature() {
  return new Creature({
    name: 'Pet Slime',
    attack: 1,
    maxHp: 1,
    unpreventable: true,
    description: 'Deals Unpreventable Damage',
  });
}

export function createPetSlimeCard() {
  return new Card({
    id: 'pet_slime',
    name: 'Pet Slime',
    description: 'Recharge -> Summon a Pet Slime to the battle!',
    shortDesc: 'R->Summon Slime',
    subtype: 'ally',
    cardType: CardType.CREATURE,
    costType: CostType.RECHARGE,
    effects: [new CardEffect('summon_pet_slime', 1, TargetType.SUMMON)],
    rarity: 'rare',
    previewCreature: createPetSlimeCreature(),
  });
}

export function createSlimeJar() {
  return new Card({
    id: 'slime_jar',
    name: 'Slime Jar',
    description: 'Recharge -> Your next attack is Unpreventable.',
    shortDesc: 'R->Unpreventable',
    subtype: 'item',
    cardType: CardType.ITEM,
    costType: CostType.RECHARGE,
    effects: [new CardEffect('grant_unpreventable_buff', 1, TargetType.SELF)],
    rarity: 'uncommon',
  });
}

// ============================================================
// Enemy Cards - Kobold Warden
// ============================================================

export function createGuards() {
  return new Card({
    id: 'guards',
    name: 'Guards!',
    description: 'Recharge -> Summon 1-2 Kobold Guards.',
    shortDesc: 'R->1-2 Guards',
    subtype: 'allies',
    cardType: CardType.CREATURE,
    costType: CostType.RECHARGE,
    effects: [new CardEffect('summon_random', 2, TargetType.SUMMON)],
  });
}

export function createHideInCorner() {
  return new Card({
    id: 'hide_in_corner',
    name: 'Hide in the Corner',
    description: 'Recharge -> Block 2.',
    shortDesc: 'R->Block 2',
    subtype: 'armor',
    cardType: CardType.DEFENSE,
    costType: CostType.RECHARGE,
    effects: [new CardEffect('block', 2, TargetType.SELF)],
  });
}

// ============================================================
// Enemy Cards - Dire Rat
// ============================================================

export function createDireRatBite() {
  return new Card({
    id: 'dire_rat_bite',
    name: 'Dire Rat Bite',
    description: 'Recharge -> Deal 2 damage.',
    shortDesc: 'R->2 Dmg',
    subtype: 'weapon',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [new CardEffect('damage', 2, TargetType.SINGLE_ENEMY)],
  });
}

export function createDireRatScreech() {
  return new Card({
    id: 'dire_rat_screech',
    name: 'Screech!',
    description: 'Recharge -> Summon 1-2 Rats.',
    shortDesc: 'R->1-2 Rats',
    subtype: 'allies',
    cardType: CardType.CREATURE,
    costType: CostType.RECHARGE,
    effects: [new CardEffect('summon_random', 2, TargetType.SUMMON)],
  });
}

// ============================================================
// Loot Reward Cards
// ============================================================

export function createBoneWand() {
  return new Card({
    id: 'bone_wand',
    name: 'Bone Wand',
    description: 'Recharge -> Apply Poison, Draw.',
    shortDesc: 'R->Poison, Draw',
    subtype: 'wand',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('apply_poison', 1, TargetType.SINGLE_ENEMY),
      new CardEffect('draw', 1, TargetType.SELF),
    ],
    rarity: 'uncommon',
  });
}

export function createBoneClub() {
  return new Card({
    id: 'bone_club',
    name: 'Bone Club',
    description: 'Recharge +1 Card -> Deal 4 damage (+2 vs Armor/Shield).',
    shortDesc: 'R+1->4 Dmg\n(+2 vs Armor/Shield)',
    subtype: 'martial_2h',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('armor_bonus_damage', 46, TargetType.SINGLE_ENEMY), // 4 base, 6 vs armor/shield
      new CardEffect('recharge_extra', 1, TargetType.SELF),
    ],
  });
}

export function createBoneMace() {
  return new Card({
    id: 'bone_mace',
    name: 'Bone Mace',
    description: 'Recharge -> Deal 3 damage (+2 vs Armor/Shield).',
    shortDesc: 'R->3 Dmg\n(+2 vs Armor/Shield)',
    subtype: 'martial',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('armor_bonus_damage', 35, TargetType.SINGLE_ENEMY),
    ],
    rarity: 'uncommon',
  });
}

export function createBoneStaff() {
  return new Card({
    id: 'bone_staff',
    name: 'Bone Staff',
    description: 'Recharge +1 Card -> Deal 3 Damage + Poison, Shield 1.',
    shortDesc: 'R+1->3 Dmg\n+Poison, Shield 1',
    subtype: 'staff',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('damage', 3, TargetType.SINGLE_ENEMY),
      new CardEffect('apply_poison', 1, TargetType.SINGLE_ENEMY),
      new CardEffect('gain_shield', 1, TargetType.SELF),
      new CardEffect('recharge_extra', 1, TargetType.SELF),
    ],
    rarity: 'uncommon',
  });
}

export function createBadRations() {
  return new Card({
    id: 'bad_rations',
    name: 'Bad Rations',
    description: 'Banish + Recharge 1 -> Heal 4, discard 1 card from deck.',
    shortDesc: 'B+R1->Heal 4,\n-1 deck',
    subtype: 'item',
    cardType: CardType.ITEM,
    costType: CostType.BANISH,
    effects: [
      new CardEffect('heal', 4, TargetType.SELF),
      new CardEffect('discard_deck', 1, TargetType.SELF),
      new CardEffect('recharge_extra', 1, TargetType.SELF),
    ],
  });
}

export function createSturdyBoots() {
  return new Card({
    id: 'sturdy_boots',
    name: 'Sturdy Boots',
    // Dual-type per Python: top-level effects fire on player turn (1 Dmg + Draw);
    // the block mode is offered during the defending phase (Block 1 + Draw).
    description: 'Attack: 1 Dmg + Draw\nDefense: Block 1 + Draw',
    shortDesc: 'R->1 Dmg/Block,\nDraw',
    subtype: 'light_armor',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('damage', 1, TargetType.SINGLE_ENEMY),
      new CardEffect('draw', 1, TargetType.SELF),
    ],
    modes: [
      new CardMode('Block 1, Draw a card', [
        new CardEffect('block', 1, TargetType.SELF),
        new CardEffect('draw', 1, TargetType.SELF),
      ]),
    ],
    rarity: 'uncommon',
  });
}

export function createTorch() {
  return new Card({
    id: 'torch',
    name: 'Torch',
    description: 'Discard -> Deal 1 Fire to all. Scry 3.',
    shortDesc: 'D->Fire ALL,\nScry 3',
    subtype: 'item',
    cardType: CardType.ITEM,
    costType: CostType.DISCARD,
    effects: [
      new CardEffect('apply_fire_all', 1, TargetType.ALL_ENEMIES),
      new CardEffect('scry_pick', 3, TargetType.SELF),
    ],
    rarity: 'uncommon',
  });
}

export function createChickenLeg() {
  return new Card({
    id: 'chicken_leg',
    name: 'Chicken Leg',
    description: 'Banish + Recharge 2 -> Heal 5.',
    shortDesc: 'B+R2->Heal 5',
    subtype: 'item',
    cardType: CardType.ITEM,
    costType: CostType.BANISH,
    effects: [
      new CardEffect('heal', 5, TargetType.SELF),
      new CardEffect('recharge_extra', 2, TargetType.SELF),
    ],
  });
}

export function createWardensWhip() {
  return new Card({
    id: 'wardens_whip',
    name: "The Warden's Whip",
    description: 'Recharge -> Deal 1 Damage, Allies gain 1 Heroism.',
    shortDesc: "R->1 Dmg\n+1 Ally Heroism",
    subtype: 'simple',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    // Second effect buffs all player creature allies with +1 Heroism on
    // play. Matches PY: the card was missing this half of its effect list.
    effects: [
      new CardEffect('damage', 1, TargetType.SINGLE_ENEMY),
      new CardEffect('buff_allies_heroism', 1, TargetType.SELF),
    ],
    rarity: 'uncommon',
  });
}

export function createSharpRock() {
  return new Card({
    id: 'sharp_rock',
    name: 'Sharp Rock',
    description: 'Recharge -> Deal 1 Damage, Draw.',
    shortDesc: 'R->1 Dmg, Draw',
    subtype: 'simple',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('damage', 1, TargetType.SINGLE_ENEMY),
      new CardEffect('draw', 1, TargetType.SELF),
    ],
  });
}

// Zhost's Buckler — drops as boss loot. Light armor that hits for 1 damage,
// applies 1 Ice, and grants 1 Shield.
export function createZhostsBuckler() {
  return new Card({
    id: 'zhosts_buckler',
    name: "Zhost's Buckler",
    description: 'Recharge -> Deal 1 Damage and 1 Ice. Gain 1 Shield.',
    shortDesc: 'R->1 Dmg, 1 Ice,\n+1 Shield',
    subtype: 'light_armor',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('damage', 1, TargetType.SINGLE_ENEMY),
      new CardEffect('apply_ice', 1, TargetType.SINGLE_ENEMY),
      new CardEffect('gain_shield', 1, TargetType.SELF),
    ],
    rarity: 'rare',
  });
}

export function createLuckyPebble() {
  return new Card({
    id: 'lucky_pebble',
    name: 'Lucky Pebble',
    description: 'On Discard: Draw 1 Card.',
    shortDesc: 'On Discard:\nDraw 1',
    subtype: 'relic',
    cardType: CardType.RELIC,
    // Plays for free (Recharge cost = no effect when played, just goes into
    // the recharge pile). The "On Discard" trigger fires only when the card
    // is discarded passively (deck damage, hand-discard effects, etc.) —
    // see Character.takeDamageFromDeck for the hook.
    costType: CostType.RECHARGE,
    effects: [new CardEffect('on_discard_draw', 1, TargetType.SELF)],
    rarity: 'rare',
  });
}

// === Buff Pseudo-Cards ===
// Codex-only entries showing each CombatBuff granted by a source card or
// encounter choice. Match Python's image_id (which reuses the source-card
// art) and description text. Never placed in a deck — purely informational.
export function createBuffVialOfPoison() {
  return new Card({
    id: 'buff_vial_of_poison',
    name: 'Vial of Poison',
    description: 'Next attack also applies Poison.',
    shortDesc: 'Next attack:\n+Poison',
    subtype: 'buff', cardType: CardType.ABILITY, costType: CostType.FREE,
    effects: [],
  });
}
export function createBuffSlimeJar() {
  return new Card({
    id: 'buff_slime_jar',
    name: 'Slime Jar',
    description: 'Next weapon attack is Unpreventable.',
    shortDesc: 'Next attack:\nUnpreventable',
    subtype: 'buff', cardType: CardType.ABILITY, costType: CostType.FREE,
    effects: [],
  });
}
export function createBuffScrollOfPotency() {
  return new Card({
    id: 'buff_scroll_of_potency',
    name: 'Scroll of Potency',
    description: 'Start of Turn: +1 Heroism',
    shortDesc: '+1 Heroism/turn',
    subtype: 'buff', cardType: CardType.ABILITY, costType: CostType.FREE,
    effects: [],
  });
}
export function createBuffAle() {
  return new Card({
    id: 'buff_ale',
    name: 'Ale',
    description: 'Start of Turn: +1 Heroism',
    shortDesc: '+1 Heroism/turn',
    subtype: 'buff', cardType: CardType.ABILITY, costType: CostType.FREE,
    effects: [],
  });
}
export function createBuffDwarvenBrew() {
  return new Card({
    id: 'buff_dwarven_brew',
    name: 'Dwarven Brew',
    description: 'Start of Turn: +1 Shield',
    shortDesc: '+1 Shield/turn',
    subtype: 'buff', cardType: CardType.ABILITY, costType: CostType.FREE,
    effects: [],
  });
}
export function createBuffRegrowth() {
  return new Card({
    id: 'buff_regrowth',
    name: 'Regrowth',
    description: 'Start of Turn: Heal 1',
    shortDesc: 'Heal 1/turn',
    subtype: 'buff', cardType: CardType.ABILITY, costType: CostType.FREE,
    effects: [],
  });
}

// === Encounter Buff Cards ===
// Pseudo-cards rendered as `Buff` codex entries. They aren't placed in any
// deck; they describe a CombatBuff granted by an encounter choice and let
// the player browse the buff card art / description in the codex.
export function createBuffElfReinforcements() {
  return new Card({
    id: 'buff_elf_reinforcements',
    name: 'Elf Reinforcements',
    description: 'Start of Turn: Summon 1 Elf Warrior.',
    shortDesc: '+1 Elf/turn',
    subtype: 'buff',
    cardType: CardType.ABILITY,
    costType: CostType.FREE,
    effects: [],
  });
}
export function createBuffBlizzard() {
  // Wolf Pack fight debuff: every turn the player + every alive ally
  // takes one Ice stack. Pseudo-card so the buff appears in the codex.
  return new Card({
    id: 'buff_blizzard',
    name: 'Blizzard',
    description: 'Start of Turn: You and allies get Ice.',
    shortDesc: 'Ice/turn',
    subtype: 'buff',
    cardType: CardType.ABILITY,
    costType: CostType.FREE,
    effects: [],
  });
}

export function createBuffSahuaginEye() {
  // Granted by the Sahuagin Eye relic. Consumed on any attack — adds
  // +1 damage when the target is already wounded.
  return new Card({
    id: 'buff_sahuagin_eye',
    name: 'Sahuagin Eye',
    description: 'Next Attack: +1 damage if target is damaged.',
    shortDesc: 'Next Attack +1\nif damaged',
    subtype: 'buff',
    cardType: CardType.ABILITY,
    costType: CostType.FREE,
    effects: [],
  });
}
export function createBuffObsidianCore() {
  // Granted by playing the Obsidian Core relic. Consumed on the next
  // attack — adds +2 damage when the target has Armor or Shield.
  return new Card({
    id: 'buff_obsidian_core',
    name: 'Obsidian Core',
    description: 'Next Attack: +2 damage vs Armor/Shield.',
    shortDesc: 'Next Attack +2\nvs Armor/Shield',
    subtype: 'buff',
    cardType: CardType.ABILITY,
    costType: CostType.FREE,
    effects: [],
  });
}
export function createBuffOldGodBlessing() {
  // Granted by praying at the Old God Statue. Permanent — projects
  // into combat as a fresh CombatBuff at the start of every Sahuagin
  // fight (Sentinel / Priest / Baron). Every attack against a
  // wounded Sahuagin gets +1. The "Vs Sahuagin" prefix renders as a
  // sea-green pill via the inline badge tokenizer.
  return new Card({
    id: 'buff_old_god_blessing',
    name: "Old God's Blessing",
    description: 'Vs Sahuagin: +1 Damage vs damaged.',
    shortDesc: 'Vs Sahuagin\n+1 vs damaged',
    subtype: 'buff',
    cardType: CardType.ABILITY,
    costType: CostType.FREE,
    effects: [],
    rarity: 'rare',
  });
}
export function createBuffRunning() {
  return new Card({
    id: 'buff_running',
    name: 'Running',
    description: 'Start of Turn: Draw 1',
    shortDesc: 'Draw 1/turn',
    subtype: 'buff',
    cardType: CardType.ABILITY,
    costType: CostType.FREE,
    effects: [],
  });
}
export function createBuffHiding() {
  return new Card({
    id: 'buff_hiding',
    name: 'Hiding',
    description: 'Start of Turn: +1 Shield',
    shortDesc: '+1 Shield/turn',
    subtype: 'buff',
    cardType: CardType.ABILITY,
    costType: CostType.FREE,
    effects: [],
  });
}
export function createBuffCalculating() {
  return new Card({
    id: 'buff_calculating',
    name: 'Calculating',
    description: 'Start of Turn: +1 Heroism',
    shortDesc: '+1 Heroism/turn',
    subtype: 'buff',
    cardType: CardType.ABILITY,
    costType: CostType.FREE,
    effects: [],
  });
}

// Stone Giant summon card — heaves a 6/4/1-armor self-destructing boulder
// into play. Played as a CREATURE summon (priority 10 so it lands before
// sharp rocks).
export function createLargeBoulder() {
  return new Card({
    id: 'large_boulder',
    name: 'Large Boulder',
    description: 'Recharge -> Large Boulder rolling down the mountain!',
    shortDesc: 'R->Summon Boulder',
    subtype: 'allies',
    cardType: CardType.CREATURE,
    costType: CostType.RECHARGE,
    effects: [new CardEffect('summon_large_boulder', 1, TargetType.SUMMON)],
    priority: 10,
    previewCreature: new Creature({
      name: 'Large Boulder', attack: 6, maxHp: 4, armor: 1, selfDestruct: true,
      description: 'Self-Destruct: explodes after attacking.',
    }),
  });
}

// ============================================================
// Shop Cards - General Store
// ============================================================

export function createTravelRations() {
  return new Card({
    id: 'travel_rations',
    name: 'Travel Rations',
    description: 'Banish + Recharge 1 -> Heal 4, Draw.',
    shortDesc: 'B+R1->Heal 4, Draw',
    subtype: 'item',
    cardType: CardType.ITEM,
    costType: CostType.BANISH,
    effects: [
      new CardEffect('heal', 4, TargetType.SELF),
      new CardEffect('draw', 1, TargetType.SELF),
      new CardEffect('recharge_extra', 1, TargetType.SELF),
    ],
    rarity: 'uncommon',
  });
}

export function createBandages() {
  return new Card({
    id: 'bandages',
    name: 'Bandages',
    description: 'Heal 3 -> Discard.',
    shortDesc: 'Heal 3->D',
    subtype: 'item',
    cardType: CardType.ITEM,
    costType: CostType.DISCARD,
    effects: [new CardEffect('heal', 3, TargetType.SELF)],
    rarity: 'uncommon',
  });
}

export function createTravelersClothing() {
  return new Card({
    id: 'travelers_clothing',
    name: "Traveler's Clothing",
    description: 'Recharge -> Block 1, Draw.',
    shortDesc: 'R->Block 1, Draw',
    subtype: 'clothing',
    cardType: CardType.DEFENSE,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('block', 1, TargetType.SELF),
      new CardEffect('draw', 1, TargetType.SELF),
    ],
    rarity: 'common',
  });
}

export function createSack() {
  return new Card({
    id: 'sack',
    name: 'Sack',
    description: 'Recharge -> Scry 3.',
    shortDesc: 'R->Scry 3',
    subtype: 'item',
    cardType: CardType.ITEM,
    costType: CostType.RECHARGE,
    effects: [new CardEffect('scry_pick', 3, TargetType.SELF)],
    rarity: 'uncommon',
  });
}

// ============================================================
// Shop Cards - Weaponsmith
// ============================================================

export function createSteelAxe() {
  return new Card({
    id: 'steel_axe',
    name: 'Steel Axe',
    description: 'Recharge -> Deal 3 damage to up to 2 targets.',
    shortDesc: 'R->3 Dmg x2',
    subtype: 'martial',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [new CardEffect('multi_damage', 3, TargetType.SINGLE_ENEMY, 2)],
    rarity: 'uncommon',
  });
}

export function createSteelMace() {
  return new Card({
    id: 'steel_mace',
    name: 'Steel Mace',
    description: 'Recharge -> Deal 3 damage (+2 vs Armor/Shield).',
    shortDesc: 'R->3 Dmg\n(+2 vs Armor/Shield)',
    subtype: 'martial',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [new CardEffect('armor_bonus_damage', 35, TargetType.SINGLE_ENEMY)],
    rarity: 'uncommon',
  });
}

export function createSteelSword() {
  return new Card({
    id: 'steel_sword',
    name: 'Steel Sword',
    description: 'Recharge -> Deal 4 damage.',
    shortDesc: 'R->4 Dmg',
    subtype: 'martial',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [new CardEffect('damage', 4, TargetType.SINGLE_ENEMY)],
    rarity: 'uncommon',
  });
}

export function createSteelGreataxe() {
  return new Card({
    id: 'steel_greataxe',
    name: 'Steel Greataxe',
    description: 'Recharge +1 Card -> Deal 4 damage and 3 damage to up to 2 other targets.',
    shortDesc: 'R+1->4 Dmg\n+3 Dmg x2',
    subtype: 'martial_2h',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [
      // 4 to primary, 3 to up to 2 other targets (3 total max). Encoded as 43.
      new CardEffect('split_damage', 43, TargetType.SINGLE_ENEMY, 3),
      new CardEffect('recharge_extra', 1, TargetType.SELF),
    ],
    rarity: 'uncommon',
  });
}

export function createBow() {
  return new Card({
    id: 'bow',
    name: 'Bow',
    description: 'Recharge +1 -> Deal 4 damage, Draw.',
    shortDesc: 'R+1->4 Dmg, Draw',
    subtype: 'ranged',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('damage', 4, TargetType.SINGLE_ENEMY),
      new CardEffect('draw', 1, TargetType.SELF),
      new CardEffect('recharge_extra', 1, TargetType.SELF),
    ],
    rarity: 'uncommon',
  });
}

export function createSteelDagger() {
  return new Card({
    id: 'steel_dagger',
    name: 'Steel Dagger',
    description: 'Deal 2 Damage. Stays in hand.',
    shortDesc: '2 Dmg, Stays',
    subtype: 'simple',
    cardType: CardType.ATTACK,
    costType: CostType.FREE,
    effects: [
      new CardEffect('damage', 2, TargetType.SINGLE_ENEMY),
      new CardEffect('stays_in_hand', 0, TargetType.SELF),
    ],
    rarity: 'uncommon',
  });
}

// ============================================================
// Shop Cards - Armorsmith
// ============================================================

export function createStuddedLeatherArmor() {
  return new Card({
    id: 'studded_leather_armor',
    name: 'Studded Leather',
    description: 'Recharge -> Block 2, Gain Shield.',
    shortDesc: 'R->Block 2, Shield',
    subtype: 'light_armor',
    cardType: CardType.DEFENSE,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('block', 2, TargetType.SELF),
      new CardEffect('gain_shield', 1, TargetType.SELF),
    ],
    rarity: 'uncommon',
  });
}

export function createRingMail() {
  return new Card({
    id: 'ring_mail',
    name: 'Ring Mail',
    description: 'Recharge -> Block 4 Damage.',
    shortDesc: 'R->Block 4',
    subtype: 'heavy_armor',
    cardType: CardType.DEFENSE,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('block', 4, TargetType.SELF),
    ],
    rarity: 'uncommon',
  });
}

// ============================================================
// Shop Cards - Arcane Emporium
// ============================================================

export function createScrollOfPotency() {
  return new Card({
    id: 'scroll_of_potency',
    name: 'Scroll of Potency',
    description: 'Recharge -> Gain 1 Heroism now and for the next 3 turns.',
    shortDesc: 'R->+1 Heroism\n3 turns',
    subtype: 'scroll',
    cardType: CardType.ITEM,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('gain_heroism', 1, TargetType.SELF),
      new CardEffect('grant_potency_buff', 3, TargetType.SELF),
    ],
    rarity: 'uncommon',
  });
}

export function createMinorHealingPotion() {
  return new Card({
    id: 'minor_healing_potion',
    name: 'Minor Healing Potion',
    description: 'Banish -> Heal 5.',
    shortDesc: 'B->Heal 5',
    subtype: 'item',
    cardType: CardType.ITEM,
    costType: CostType.BANISH,
    effects: [new CardEffect('heal', 5, TargetType.SELF)],
    rarity: 'rare',
  });
}

export function createWandOfFire() {
  return new Card({
    id: 'wand_of_fire',
    name: 'Wand of Fire',
    description: 'Recharge -> Deal 1 Damage and 1 Fire, Draw.',
    shortDesc: 'R->1 Dmg+Fire, Draw',
    subtype: 'wand',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    characterClass: ['wizard'],
    effects: [
      new CardEffect('damage', 1, TargetType.SINGLE_ENEMY),
      new CardEffect('apply_fire', 1, TargetType.SINGLE_ENEMY),
      new CardEffect('draw', 1, TargetType.SELF),
    ],
    rarity: 'uncommon',
  });
}

export function createMimicTongue() {
  return new Card({
    id: 'mimic_tongue',
    name: 'Mimic Tongue',
    description: 'Recharge -> Apply 1 Poison, Draw a card.',
    shortDesc: 'R->Poison 1,\nDraw 1',
    subtype: 'relic',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('apply_poison', 1, TargetType.SINGLE_ENEMY),
      new CardEffect('draw', 1, TargetType.SELF),
    ],
    rarity: 'rare',
  });
}

// ============================================================
// Enemy Cards - Kobold Patrol
// ============================================================

export function createSpearThrow() {
  return new Card({
    id: 'spear_throw',
    name: 'Spear Throw',
    description: 'Recharge +1 -> Deal 2 Damage, Draw.',
    shortDesc: 'R+1->2 Dmg, Draw',
    subtype: 'weapon',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('damage', 2, TargetType.SINGLE_ENEMY),
      new CardEffect('recharge_extra', 1, TargetType.SELF),
      new CardEffect('draw', 1, TargetType.SELF),
    ],
    priority: 30,
  });
}

export function createIcyBreath() {
  return new Card({
    id: 'icy_breath',
    name: 'Icy Breath',
    description: 'Recharge -> Apply 1 Ice.',
    shortDesc: 'R->+Ice',
    subtype: 'weapon',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [new CardEffect('apply_ice', 1, TargetType.SINGLE_ENEMY)],
    priority: 10,
  });
}

export function createShieldBashEnemy() {
  return new Card({
    id: 'shield_bash_enemy',
    name: 'Shield Bash',
    description: 'Recharge -> Deal 1 Damage, Gain Shield.',
    shortDesc: 'R->1 Dmg, +1 Shield',
    subtype: 'weapon',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('damage', 1, TargetType.SINGLE_ENEMY),
      new CardEffect('gain_shield', 1, TargetType.SELF),
    ],
    priority: 5,
  });
}

// ============================================================
// Loot Cards - Story Rewards
// ============================================================

export function createWhiteClaw() {
  return new Card({
    id: 'white_claw',
    name: 'The White Claw',
    description: 'Recharge -> Deal 4 Damage and 1 Ice.',
    shortDesc: 'R->4 Dmg, Ice',
    subtype: 'martial',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('damage', 4, TargetType.SINGLE_ENEMY),
      new CardEffect('apply_ice', 1, TargetType.SINGLE_ENEMY),
    ],
    rarity: 'rare',
  });
}

export function createGreatclub() {
  return new Card({
    id: 'greatclub',
    name: 'Greatclub',
    description: 'Recharge +1 -> Deal 4 damage (+4 vs Armor/Shield).',
    shortDesc: 'R+1->4 Dmg\n(+4 Armor)',
    subtype: 'martial_2h',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('armor_bonus_damage', 48, TargetType.SINGLE_ENEMY),
      new CardEffect('recharge_extra', 1, TargetType.SELF),
    ],
    rarity: 'uncommon',
  });
}

export function createQuarterstaff() {
  return new Card({
    id: 'quarterstaff',
    name: 'Quarterstaff',
    description: 'Recharge +1 Card -> Deal 4 Damage, Gain 2 Shields.',
    shortDesc: 'R+1->4 Dmg\n+2 Shield',
    subtype: 'simple',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('damage', 4, TargetType.SINGLE_ENEMY),
      new CardEffect('gain_shield', 2, TargetType.SELF),
      new CardEffect('recharge_extra', 1, TargetType.SELF),
    ],
    rarity: 'uncommon',
  });
}

export function createAle() {
  return new Card({
    id: 'ale',
    name: 'Ale',
    description: 'Banish -> Heal 1, Gain 1 Heroism. +1 Heroism/turn for 3 turns.',
    shortDesc: 'B->Heal 1, Heroism\n+Heroism/3T',
    subtype: 'item',
    cardType: CardType.ITEM,
    costType: CostType.BANISH,
    effects: [
      new CardEffect('heal', 1, TargetType.SELF),
      new CardEffect('gain_heroism', 1, TargetType.SELF),
      new CardEffect('ale_buff', 3, TargetType.SELF),
    ],
  });
}

// ============================================================
// Enemy Cards - Sahuagin
// ============================================================

// Mirrors Python create_trident_throw exactly: 1 damage + Draw 1 +
// 1 bonus if target is damaged.
export function createTridentThrow() {
  return new Card({
    id: 'trident_throw',
    name: 'Trident Throw',
    description: 'Recharge -> Deal 1 Damage, Draw 1. +1 if target is damaged.',
    shortDesc: 'R->1 Dmg, Draw 1\n+1 if damaged',
    subtype: 'weapon',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('damage', 1, TargetType.SINGLE_ENEMY),
      new CardEffect('draw', 1, TargetType.SELF),
      new CardEffect('damaged_bonus_damage', 1, TargetType.SINGLE_ENEMY),
    ],
  });
}

// Mirrors Python create_trident_thrust exactly: 3 damage with a
// 1-card recharge cost + 1 bonus if target is damaged.
export function createTridentThrust() {
  return new Card({
    id: 'trident_thrust',
    name: 'Trident Thrust',
    description: 'Recharge +1 -> Deal 3 Damage. +1 if target is damaged.',
    shortDesc: 'R+1->3 Dmg\n+1 if damaged',
    subtype: 'weapon',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('damage', 3, TargetType.SINGLE_ENEMY),
      new CardEffect('recharge_extra', 1, TargetType.SELF),
      new CardEffect('damaged_bonus_damage', 1, TargetType.SINGLE_ENEMY),
    ],
  });
}

export function createScaleArmor() {
  return new Card({
    id: 'scale_armor',
    name: 'Scale Armor',
    description: 'Recharge -> Block 3.',
    shortDesc: 'R->Block 3',
    subtype: 'light_armor',
    cardType: CardType.DEFENSE,
    costType: CostType.RECHARGE,
    effects: [new CardEffect('block', 3, TargetType.SELF)],
    rarity: 'rare',
  });
}

export function createBloodInTheWater() {
  // CREATURE-summon spell that drops 1-2 Sharks (random) into the
  // priest's row + bumps the priest's own Rage by 1 each cast. The
  // Shark itself carries Bloodfrenzy in its creature description so
  // we don't repeat it here.
  return new Card({
    id: 'blood_in_the_water',
    name: 'Blood in the Water',
    description: 'Recharge -> Summon 1-2 Sharks. Gain 1 Rage.',
    shortDesc: 'R->Summon 1-2\nSharks, +1 Rage',
    subtype: 'spell',
    cardType: CardType.CREATURE,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('summon_shark_random', 2, TargetType.SUMMON),
      new CardEffect('gain_rage', 1, TargetType.SELF),
    ],
    priority: 8,
  });
}

export function createSahuaginStaffEnemy() {
  // Mirrors PY create_sahuagin_staff_enemy — Recharge +1, 1 dmg +
  // 1 Ice + summon a Shark. Was incorrectly applying Fire instead
  // of Ice, with no extra recharge cost or shark summon.
  return new Card({
    id: 'sahuagin_staff_enemy',
    name: 'Sahuagin Staff',
    description: 'Recharge +1 -> Deal 1 Damage + Ice, Summon a Shark.',
    shortDesc: 'R+1->1 Dmg+Ice\nSummon Shark',
    subtype: 'staff',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('damage', 1, TargetType.SINGLE_ENEMY),
      new CardEffect('recharge_extra', 1, TargetType.SELF),
      new CardEffect('apply_ice', 1, TargetType.SINGLE_ENEMY),
      new CardEffect('summon_shark', 1, TargetType.SUMMON),
    ],
    priority: 2,
  });
}

// Player-facing Barnacle Encrusted Plate — Sahuagin Baron drop.
// Mirrors PY create_barnacle_encrusted_plate. Heavy armor that
// also creates a Barnacle (banishable Heal 1 token) on every
// recharge, plus a swim-recharge draw.
export function createBarnacleEncrustedPlate() {
  return new Card({
    id: 'barnacle_encrusted_plate',
    name: 'Barnacle Encrusted Plate',
    description: 'Recharge -> Block 4, create 1 Barnacle. On Swim: Draw 2.',
    shortDesc: 'R->Block 4\n+Barnacle, On Swim: Draw 2',
    subtype: 'heavy_armor',
    cardType: CardType.DEFENSE,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('block', 4, TargetType.SELF),
      new CardEffect('create_barnacle', 1, TargetType.SELF),
      new CardEffect('on_swim_recharge_draw', 2, TargetType.SELF),
    ],
    rarity: 'epic',
    // Side-preview the Barnacle token on the full hover card so the
    // player sees what create_barnacle drops into hand.
    previewCard: createBarnacle(),
  });
}

// Barnacle — disposable heal token created by Barnacle Encrusted
// Plate. Banishes for 1 heal. Mirrors PY create_barnacle.
export function createBarnacle() {
  return new Card({
    id: 'barnacle',
    name: 'Barnacle',
    description: 'Banish -> Heal 1.',
    shortDesc: 'B->Heal 1',
    subtype: 'item',
    cardType: CardType.ITEM,
    costType: CostType.BANISH,
    effects: [new CardEffect('heal', 1, TargetType.SELF)],
  });
}

export function createBarnacleEncrustedPlateEnemy() {
  // Mirrors PY create_barnacle_encrusted_plate_enemy — simpler than
  // the player loot version: Block 4 + Heal 1 (no Barnacle, no swim
  // draw). Heal moves cards from the enemy's discard pile back into
  // their recharge pile, so the priest/baron can grind out a fight.
  return new Card({
    id: 'barnacle_encrusted_plate_enemy',
    name: 'Barnacle Plate',
    description: 'Recharge -> Block 4 Damage, Heal 1.',
    shortDesc: 'R->Block 4\nHeal 1',
    subtype: 'heavy_armor',
    cardType: CardType.DEFENSE,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('block', 4, TargetType.SELF),
      new CardEffect('heal', 1, TargetType.SELF),
    ],
  });
}

// ============================================================
// Enemy Cards - Forest Spider
// ============================================================

export function createPoisonedBite() {
  return new Card({
    id: 'poisoned_bite',
    name: 'Poisoned Bite',
    description: 'Recharge -> Deal 1 Damage + 1 Poison.',
    shortDesc: 'R->1 Dmg + Poison',
    subtype: 'weapon',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('damage', 1, TargetType.SINGLE_ENEMY),
      new CardEffect('apply_poison', 1, TargetType.SINGLE_ENEMY),
    ],
  });
}

export function createWebSpider() {
  return new Card({
    id: 'web_spider',
    name: 'Web',
    description: 'Recharge -> Throw a Web at the enemy. Clogs their deck with a Web token.',
    shortDesc: 'R->Web enemy\n+1 clog',
    subtype: 'ability',
    cardType: CardType.ABILITY,
    costType: CostType.RECHARGE,
    effects: [new CardEffect('add_web_token', 1, TargetType.SELF)],
  });
}

// Web token — junk card the spiders shove into the player's draw pile
// at a random position. Banish-cost: pay by recharging another card,
// then it's gone forever (until the next Web hit). On discard it drags
// another card into the discard with it (clogs the deck even when
// "skipped" via damage flow).
export function createWebToken() {
  return new Card({
    id: 'web_token',
    name: 'Web',
    description: 'Recharge another card -> Banish. When discarded, discard a card.',
    shortDesc: 'R1->Banish\nDiscard: -1',
    subtype: 'item',
    cardType: CardType.ITEM,
    costType: CostType.BANISH,
    effects: [
      new CardEffect('recharge_extra', 1, TargetType.SELF),
      new CardEffect('on_discard_discard', 1, TargetType.SELF),
    ],
    isToken: true,
  });
}

// ============================================================
// Enemy Cards - Obsidian
// ============================================================

// Siege Spoils — dropped after the third siege gauntlet falls.
// Common but tier-2 stat lines.
export function createGoblinRocketBoots() {
  return new Card({
    id: 'goblin_rocket_boots',
    name: 'Goblin Rocket Boots',
    description: 'Recharge -> Block 1 Damage, Draw 1 and Deal 1 Fire to a random enemy.',
    shortDesc: 'R->Block 1, Draw 1\n+1 Fire random',
    subtype: 'light_armor',
    cardType: CardType.DEFENSE,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('block', 1, TargetType.SELF),
      new CardEffect('draw', 1, TargetType.SELF),
      new CardEffect('apply_fire_random', 1, TargetType.RANDOM_ENEMY),
    ],
    rarity: 'common',
    tier: 2,
  });
}

export function createGoblinSapperCharges() {
  return new Card({
    id: 'goblin_sapper_charges',
    name: 'Goblin Sapper Charges',
    description: 'Banish -> Deal 1 to 3 Damage + Fire to a random enemy 3 times.',
    shortDesc: 'B->1-3 Dmg+Fire\nrandom x3',
    subtype: 'item',
    cardType: CardType.ITEM,
    costType: CostType.BANISH,
    effects: [
      new CardEffect('sapper_charges', 3, TargetType.RANDOM_ENEMY),
    ],
    rarity: 'common',
    tier: 2,
  });
}

export function createOgreMaul() {
  return new Card({
    id: 'ogre_maul',
    name: 'Ogre Maul',
    description: 'Recharge +3 Cards -> Deal 8 damage (+6 vs Armor/Shield).',
    shortDesc: 'R+3->8 Dmg\n(+6 Armor)',
    subtype: 'martial_2h',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('armor_bonus_damage', 814, TargetType.SINGLE_ENEMY),
      new CardEffect('recharge_extra', 3, TargetType.SELF),
    ],
    rarity: 'common',
    tier: 2,
  });
}

export function createCrush() {
  return new Card({
    id: 'crush',
    name: 'Crush',
    description: 'Recharge -> Deal 3 Damage.',
    shortDesc: 'R->3 Dmg',
    subtype: 'weapon',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [new CardEffect('damage', 3, TargetType.SINGLE_ENEMY)],
  });
}

export function createRockyAppendage() {
  return new Card({
    id: 'rocky_appendage',
    name: 'Rocky Appendage',
    description: 'Recharge -> Deal 1 Damage.\n(+2 vs Armor/Shield)',
    shortDesc: 'R->1 Dmg\n+2 vs Arm/Shd',
    subtype: 'weapon',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    // value 12 = base 1, bonus 2 (armor_bonus_damage value < 100 is base*10+bonus).
    effects: [new CardEffect('armor_bonus_damage', 12, TargetType.SINGLE_ENEMY)],
  });
}

// ============================================================
// Enemy Cards - Siege
// ============================================================

// JS variant: stays-in-hand ABILITY. Each turn the ogre plays one,
// gaining 1 Rage. The played card stays in hand and Rage accumulates
// onto the eventual Massive Ogre Ram swing.
export function createPullingBackTheRam() {
  return new Card({
    id: 'pulling_back_the_ram',
    name: 'Pulling Back the Ram',
    description: 'The ogre heaves the ram backward. Gain 1 Rage. Stays in hand.',
    shortDesc: '+1 Rage\nStays in hand',
    subtype: 'ability',
    cardType: CardType.ABILITY,
    costType: CostType.FREE,
    effects: [
      new CardEffect('gain_rage', 1, TargetType.SELF),
      new CardEffect('stays_in_hand', 1, TargetType.SELF),
    ],
  });
}

// ============================================================
// Enemy Cards - Drake Rider
// ============================================================

export function createDrakeRiderCharge() {
  // Mirrors PY cards_basic.py:create_drake_rider_charge. The rider buffs
  // the warband (+1 Heroism to itself and every ally) then jabs for 2
  // damage, AND a random drake ally on the enemy side gets a free
  // attack (drake_attack effect). The drake doesn't exhaust — it can
  // still swing on its own turn afterward.
  return new Card({
    id: 'drake_rider_charge',
    name: 'Drake Rider Charge!',
    description: 'Recharge +1 -> You and allies gain 1 Heroism. Deal 2 Damage. A random drake attacks.',
    shortDesc: 'R+1->+1 Hero\n2 Dmg, Drake',
    subtype: 'weapon',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('buff_allies_heroism', 1, TargetType.SELF),
      new CardEffect('damage', 2, TargetType.SINGLE_ENEMY),
      new CardEffect('drake_attack', 1, TargetType.SELF),
      new CardEffect('recharge_extra', 1, TargetType.SELF),
    ],
    // The drake's reptilian roar plays alongside the showcase art when
    // the enemy fires this card. Wired via CARD_SFX_OVERRIDES in main.js.
  });
}

export function createChainShirt() {
  return new Card({
    id: 'chain_shirt',
    name: 'Chain Shirt',
    // Matches PY: block 3, heavy_armor, uncommon.
    description: 'Recharge -> Block 3.',
    shortDesc: 'R->Block 3',
    subtype: 'heavy_armor',
    cardType: CardType.DEFENSE,
    costType: CostType.RECHARGE,
    effects: [new CardEffect('block', 3, TargetType.SELF)],
    rarity: 'uncommon',
  });
}

// Frost Drake Scale — relic dropped by the Kobold Drake Rider on the
// Qualibaf Volcano path. Mirrors PY cards_basic.py:create_frost_drake_scale.
export function createFrostDrakeScale() {
  return new Card({
    id: 'frost_drake_scale',
    name: 'Frost Drake Scale',
    description: 'Recharge -> Deal 1 Ice to a random enemy. Draw 1.',
    shortDesc: 'R->Ice random\nDraw 1',
    subtype: 'relic',
    cardType: CardType.ABILITY,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('apply_ice', 1, TargetType.RANDOM_ENEMY),
      new CardEffect('draw', 1, TargetType.SELF),
    ],
    rarity: 'uncommon',
    tier: 2,
  });
}

// ============================================================
// Enemy Cards - Boss
// ============================================================

export function createPummel() {
  return new Card({
    id: 'pummel',
    name: 'Pummel',
    description: 'Recharge -> Deal 2 Damage.',
    shortDesc: 'R->2 Dmg',
    subtype: 'weapon',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [new CardEffect('damage', 2, TargetType.SINGLE_ENEMY)],
  });
}

export function createDrainEssence() {
  return new Card({
    id: 'drain_essence',
    name: 'Drain Essence',
    description: 'Recharge -> Deal 1 unpreventable damage + Heal 1.',
    shortDesc: 'R->1 True Dmg + Heal 1',
    subtype: 'weapon',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('unpreventable_damage', 1, TargetType.SINGLE_ENEMY),
      new CardEffect('heal', 1, TargetType.SELF),
    ],
  });
}

export function createObsidianCurse() {
  return new Card({
    id: 'obsidian_curse',
    name: 'Obsidian Curse',
    description: 'Recharge -> Deal 1 unpreventable damage.',
    shortDesc: 'R->1 True Dmg',
    subtype: 'weapon',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [new CardEffect('unpreventable_damage', 1, TargetType.SINGLE_ENEMY)],
  });
}

// ============================================================
// Enemy Cards - Zhost Revenge
// ============================================================

export function createWhiteClawReforged() {
  return new Card({
    id: 'white_claw_reforged',
    name: 'White Claw Reforged',
    description: 'Recharge -> Deal 5 Damage + 1 Ice.',
    shortDesc: 'R->5 Dmg + Ice',
    subtype: 'weapon',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('damage', 5, TargetType.SINGLE_ENEMY),
      new CardEffect('apply_ice', 1, TargetType.SINGLE_ENEMY),
    ],
    rarity: 'rare',
  });
}

export function createIronforgeChainmail() {
  return new Card({
    id: 'ironforge_chainmail',
    name: 'Ironforge Chainmail',
    description: 'Recharge -> Block 3 + 1 Shield.',
    shortDesc: 'R->Block 3, Shield',
    subtype: 'armor',
    cardType: CardType.DEFENSE,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('block', 3, TargetType.SELF),
      new CardEffect('gain_shield', 1, TargetType.SELF),
    ],
  });
}

export function createDwarvenThrowingAxe() {
  return new Card({
    id: 'dwarven_throwing_axe',
    name: 'Dwarven Throwing Axe',
    description: 'Recharge -> Deal 2 Damage to up to 2 targets.',
    shortDesc: 'R->2 Dmg x2',
    subtype: 'weapon',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [new CardEffect('multi_damage', 2, TargetType.SINGLE_ENEMY, 2)],
  });
}

export function createRuneforgedBuckler() {
  // Mirrors PY create_runeforged_buckler: ABILITY (proactive), grants 2
  // Shield + 2 Heroism. PY had this as ABILITY not DEFENSE — earlier
  // JS port misclassified it.
  return new Card({
    id: 'runeforged_buckler',
    name: 'Runeforged Buckler',
    description: 'Recharge -> Gain 2 Shield and 2 Heroism.',
    shortDesc: 'R->+2 Shield\n+2 Heroism',
    subtype: 'light_armor',
    cardType: CardType.ABILITY,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('gain_shield', 2, TargetType.SELF),
      new CardEffect('gain_heroism', 2, TargetType.SELF),
    ],
    rarity: 'common',
    tier: 2,
  });
}

export function createDwarvenTowerShield() {
  return new Card({
    id: 'dwarven_tower_shield',
    name: 'Dwarven Tower Shield',
    description: 'Recharge -> Gain 4 Shields.',
    shortDesc: 'R->4 Shields',
    subtype: 'heavy_armor',
    // ABILITY (not DEFENSE) so it can only be played proactively on the
    // player's turn, not reactively during the defending phase.
    cardType: CardType.ABILITY,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('gain_shield', 4, TargetType.SELF),
    ],
    tier: 2,
  });
}

// ============================================================
// Enemy Cards - Magma Drake
// ============================================================

export function createTailSwipe() {
  return new Card({
    id: 'tail_swipe',
    name: 'Tail Swipe',
    description: 'Recharge -> Deal 2 Damage to ALL.',
    shortDesc: 'R->2 Dmg ALL',
    subtype: 'weapon',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [new CardEffect('damage_all', 2, TargetType.ALL_ENEMIES)],
  });
}

export function createFireBreath() {
  return new Card({
    id: 'fire_breath',
    name: 'Fire Breath',
    description: 'Recharge -> Apply 3 Fire to ALL.',
    shortDesc: 'R->3 Fire ALL',
    subtype: 'weapon',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [new CardEffect('apply_fire_all', 3, TargetType.ALL_ENEMIES)],
  });
}

export function createMoltenBite() {
  return new Card({
    id: 'molten_bite',
    name: 'Molten Bite',
    description: 'Recharge -> Deal 3 Damage + 2 Fire.',
    shortDesc: 'R->3 Dmg + 2 Fire',
    subtype: 'weapon',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('damage', 3, TargetType.SINGLE_ENEMY),
      new CardEffect('apply_fire', 2, TargetType.SINGLE_ENEMY),
    ],
  });
}

export function createMoltenScaleArmor() {
  return new Card({
    id: 'molten_scale_armor',
    name: 'Molten Scale',
    description: 'Recharge -> Block 2 + 1 Shield.',
    shortDesc: 'R->Block 2, Shield',
    subtype: 'armor',
    cardType: CardType.DEFENSE,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('block', 2, TargetType.SELF),
      new CardEffect('gain_shield', 1, TargetType.SELF),
    ],
  });
}

export function createMagmaMephitSummonCard() {
  return new Card({
    id: 'magma_mephit_summon',
    name: 'Magma Mephit',
    description: 'Recharge -> Summon 1-2 Mephits.',
    shortDesc: 'R->1-2 Mephits',
    subtype: 'allies',
    cardType: CardType.CREATURE,
    costType: CostType.RECHARGE,
    effects: [new CardEffect('summon_random', 2, TargetType.SUMMON)],
  });
}

// ============================================================
// Enemy Cards - Zhost Army
// ============================================================

export function createDefensiveFormation() {
  // Mirrors Python: ability card, on play caster + every alive ally gets
  // +1 Shield. Used by General Zhost's Army to stack shields each turn
  // after kobold_army repopulates the field.
  return new Card({
    id: 'defensive_formation',
    name: 'Defensive Formation',
    description: 'Recharge -> You and allies gain 1 Shield.',
    shortDesc: 'R->Team Shield 1',
    subtype: 'ability',
    cardType: CardType.ABILITY,
    costType: CostType.RECHARGE,
    effects: [new CardEffect('team_shield', 1, TargetType.SELF)],
  });
}

// ============================================================
// Enemy Cards - Mimic
// ============================================================

export function createMimicBite() {
  return new Card({
    id: 'mimic_bite',
    name: 'Bite!',
    description: 'Recharge -> Deal 10 Damage. Apply Poison.',
    shortDesc: 'R->10 Dmg\n+Poison',
    subtype: 'weapon',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('damage', 10, TargetType.SINGLE_ENEMY),
      new CardEffect('apply_poison', 1, TargetType.SINGLE_ENEMY),
    ],
  });
}

// ============================================================
// Enemy Cards - Bone Storm
// ============================================================

export function createBoneStorm() {
  return new Card({
    id: 'bone_storm',
    name: 'Bone Storm',
    description: 'All enemies lose Shields. Deal 1 Damage to all enemies. Allies gain +1 Atk, +1 HP, +1 Shield.',
    shortDesc: 'Strip Shield\n1 Dmg All\nBuff Allies',
    subtype: 'ability',
    cardType: CardType.ABILITY,
    costType: CostType.RECHARGE,
    effects: [new CardEffect('bone_storm', 1, TargetType.ALL_ENEMIES)],
    priority: 15,
  });
}

// ============================================================
// Valdrisa Emberforge — joins the party in the Personal Quarters
// hallway after the rest. Mirrors PY cards_basic.py:create_valdrisa_*.
// ============================================================

export function createValdrisaCreature() {
  return new Creature({
    name: 'Valdrisa', attack: 2, maxHp: 4, isCompanion: true,
    description: '+2 vs Armor/Shield. Turn End: Heal 1 a random damaged ally.',
  });
}

export function createValdrisaCard() {
  return new Card({
    id: 'valdrisa_card',
    name: 'Valdrisa Emberforge',
    description: 'Play -> Call Valdrisa to the battle!',
    shortDesc: 'Call Valdrisa',
    subtype: 'allies',
    cardType: CardType.CREATURE,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('summon_valdrisa', 1, TargetType.SUMMON),
      new CardEffect('recharge_extra', 1, TargetType.SELF),
    ],
    rarity: 'rare',
    tier: 2,
    isUnique: true,
    previewCreature: createValdrisaCreature(),
  });
}

// ============================================================
// Obsidian Wastes Loot — drops from the random labyrinth golem +
// slime encounters. Mirrors PY cards_basic.py:create_obsidian_*.
// All seven cards share the +2 vs Armor/Shield motif (encoded via
// the existing armor_bonus_damage effect).
// ============================================================

export function createObsidianSlimeSummonCreature() {
  return new Creature({
    name: 'Obsidian Slime', attack: 1, maxHp: 1, armor: 5,
    description: '1 ATK (+2 vs Armor/Shield).',
  });
}

export function createObsidianConstructCreature() {
  return new Creature({
    name: 'Obsidian Construct', attack: 2, maxHp: 4, armor: 1, sentinel: true,
    description: 'Sentinel. 2 ATK (+2 vs Armor/Shield).',
  });
}

export function createObsidianRock() {
  return new Card({
    id: 'obsidian_rock', name: 'Obsidian Rock',
    description: 'Recharge -> Deal 1 Damage (+2 vs Armor/Shield). Draw a card.',
    shortDesc: 'R->1 Dmg (+2 vs\nArmor), Draw 1',
    subtype: 'simple', cardType: CardType.ATTACK, costType: CostType.RECHARGE,
    effects: [
      new CardEffect('armor_bonus_damage', 13, TargetType.SINGLE_ENEMY),
      new CardEffect('draw', 1, TargetType.SELF),
    ],
    rarity: 'common', tier: 2,
  });
}

export function createObsidianEdge() {
  return new Card({
    id: 'obsidian_edge', name: 'Obsidian Edge',
    description: 'Recharge -> Deal 4 Damage (+2 vs Armor/Shield) and 1 Fire.',
    shortDesc: 'R->4 Dmg (+2 vs\nArmor), +1 Fire',
    subtype: 'martial', cardType: CardType.ATTACK, costType: CostType.RECHARGE,
    effects: [
      new CardEffect('armor_bonus_damage', 46, TargetType.SINGLE_ENEMY),
      new CardEffect('apply_fire', 1, TargetType.SINGLE_ENEMY),
    ],
    rarity: 'uncommon', tier: 2,
  });
}

export function createObsidianStaff() {
  return new Card({
    id: 'obsidian_staff', name: 'Obsidian Staff',
    description: 'Recharge +1 -> Deal 1 Damage (+2 vs Armor/Shield). Summon a 2/4 Obsidian Construct (Sentinel, 1 Armor).',
    shortDesc: 'R+1->1 Dmg (+2)\nSummon Construct',
    subtype: 'staff', cardType: CardType.ATTACK, costType: CostType.RECHARGE,
    effects: [
      new CardEffect('armor_bonus_damage', 13, TargetType.SINGLE_ENEMY),
      new CardEffect('recharge_extra', 1, TargetType.SELF),
      new CardEffect('summon_obsidian_construct', 1, TargetType.SUMMON),
    ],
    rarity: 'uncommon', tier: 2,
    previewCreature: createObsidianConstructCreature(),
  });
}

export function createObsidianSpear() {
  return new Card({
    id: 'obsidian_spear', name: 'Obsidian Spear',
    description: 'Recharge +1 -> Deal 5 Damage. Draw 1 vs Armor/Shield.',
    shortDesc: 'R+1->5 Dmg\nDraw 1 vs Armor',
    subtype: 'martial_2h', cardType: CardType.ATTACK, costType: CostType.RECHARGE,
    effects: [
      new CardEffect('damage', 5, TargetType.SINGLE_ENEMY),
      new CardEffect('recharge_extra', 1, TargetType.SELF),
      new CardEffect('draw_vs_armor', 1, TargetType.SELF),
    ],
    rarity: 'uncommon', tier: 2,
  });
}

export function createObsidianShard() {
  return new Card({
    id: 'obsidian_shard', name: 'Obsidian Shard',
    description: 'Deal 2 Damage (+2 vs Armor/Shield). Stays in hand.',
    shortDesc: '2 Dmg (+2 vs\nArmor), Stay',
    subtype: 'simple', cardType: CardType.ATTACK, costType: CostType.FREE,
    effects: [
      new CardEffect('armor_bonus_damage', 24, TargetType.SINGLE_ENEMY),
      new CardEffect('stays_in_hand', 0, TargetType.SELF),
    ],
    rarity: 'uncommon', tier: 2,
  });
}

export function createObsidianCore() {
  return new Card({
    id: 'obsidian_core', name: 'Obsidian Core',
    description: 'Recharge -> Your next attack gains: +2 vs Armor/Shield. Draw a card.',
    shortDesc: 'R->+2 vs Armor\nDraw 1',
    subtype: 'relic', cardType: CardType.ABILITY, costType: CostType.RECHARGE,
    effects: [
      new CardEffect('grant_obsidian_buff', 2, TargetType.SELF),
      new CardEffect('draw', 1, TargetType.SELF),
    ],
    rarity: 'rare', tier: 2,
  });
}

export function createObsidianSlimeCard() {
  return new Card({
    id: 'obsidian_slime_card', name: 'Obsidian Slime',
    description: 'Recharge -> Summon 1 Obsidian Slime\n(1 ATK +2 vs Armor/Shield, 1 HP).',
    shortDesc: 'R->Summon\nObsidian Slime',
    subtype: 'allies', cardType: CardType.CREATURE, costType: CostType.RECHARGE,
    effects: [new CardEffect('summon_obsidian_slime', 1, TargetType.SUMMON)],
    rarity: 'rare', tier: 2,
    previewCreature: createObsidianSlimeSummonCreature(),
  });
}

// ============================================================
// Personal Quarters Loot — The Queen's Locket
// Granted by the chest in the Personal Quarters after the throne
// audience. Mirrors PY cards_basic.py:create_queens_locket.
// ============================================================

export function createQueensLocket() {
  return new Card({
    id: 'queens_locket',
    name: "The Queen's Locket",
    description: "Recharge -> Gain the Queen's Gift. Draw 1. A random blessing of Shield, Heroism, Heal, or Draw.",
    shortDesc: 'R->Gift+Draw',
    subtype: 'relic',
    cardType: CardType.ABILITY,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('queens_gift', 1, TargetType.SELF),
      new CardEffect('draw', 1, TargetType.SELF),
    ],
    rarity: 'rare',
    tier: 2,
    isUnique: true,
  });
}

// ============================================================
// Companion Cards
// ============================================================

// Thorb the Dwarf Warrior — player ally summoned by Thorb cards.
// Ready immediately (not exhausted), gains +1 Shield at end of player turn
// (the actual shield-gain hook lives in main.js's endPlayerTurn — keyed by
// creature.name === "Thorb").
export function createThorbCreature() {
  return new Creature({
    name: 'Thorb',
    attack: 2,
    maxHp: 4,
    isCompanion: true,
    description: 'Turn End: +1 Shield',
  });
}

export function createThorbUpgradedCreature() {
  return new Creature({
    name: 'Thorb',
    attack: 2,
    maxHp: 5,
    sentinel: true,
    isCompanion: true,
    description: 'Sentinel. Turn End: +1 Shield',
  });
}

// Raena base creature — recruited at Calm Grove. Attacks 2 targets.
export function createRaenaCreature() {
  return new Creature({
    name: 'Raena', attack: 2, maxHp: 3, multiAttack: 2, isCompanion: true,
    description: 'Attacks 2 targets.',
  });
}

// Raena tier-2 — Welcome to Tharnag upgrade. +1 attack, +1 max HP.
export function createRaenaUpgradedCreature() {
  return new Creature({
    name: 'Raena', attack: 3, maxHp: 4, multiAttack: 2, isCompanion: true,
    description: 'Attacks 2 targets.',
  });
}

export function createThorbCard() {
  return new Card({
    id: 'thorb_card',
    name: 'Thorb',
    description: 'Play -> Call Thorb to the battle!',
    shortDesc: 'Call Thorb',
    subtype: 'allies',
    cardType: CardType.CREATURE,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('summon_thorb', 1, TargetType.SUMMON),
      new CardEffect('recharge_extra', 1, TargetType.SELF),
    ],
    rarity: 'rare',
    isUnique: true,
    previewCreature: createThorbCreature(),
  });
}

export function createThorbUpgradedCard() {
  return new Card({
    id: 'thorb_card_2',
    name: 'Thorb',
    description: 'Play -> Call Thorb to the battle!',
    shortDesc: 'Call Thorb',
    subtype: 'allies',
    cardType: CardType.CREATURE,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('summon_thorb_upgraded', 1, TargetType.SUMMON),
      new CardEffect('recharge_extra', 1, TargetType.SELF),
    ],
    rarity: 'rare',
    isUnique: true,
    tier: 2,
    previewCreature: createThorbUpgradedCreature(),
  });
}

// ============================================================
// Dwarven Shop Cards
// ============================================================

export function createDwarvenCrossbow() {
  return new Card({
    id: 'dwarven_crossbow',
    name: 'Dwarven Crossbow',
    description: 'Recharge +1 -> Deal 5 Unpreventable Damage.',
    shortDesc: 'R+1->5 True Dmg',
    subtype: 'simple',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('recharge_extra', 1, TargetType.SELF),
      new CardEffect('unpreventable_damage', 5, TargetType.SINGLE_ENEMY),
    ],
    tier: 2,
  });
}

export function createDwarvenGreaves() {
  return new Card({
    id: 'dwarven_greaves',
    name: 'Dwarven Greaves',
    description: 'Recharge -> Block 2. On Recharge Gain Shield.',
    shortDesc: 'R->Block 2\nOn R: +Shield',
    subtype: 'heavy_armor',
    cardType: CardType.DEFENSE,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('block', 2, TargetType.SELF),
      new CardEffect('on_recharge_shield', 1, TargetType.SELF),
    ],
    tier: 2,
  });
}

function createDwarvenScoutCreature() {
  return new Creature({
    name: 'Dwarven Scout',
    attack: 2,
    maxHp: 2,
    shield: 1,
    endTurnDamage: 1,
    isCompanion: true,
    description: 'Turn End: 1 Dmg to random enemy',
  });
}

export function createDwarvenScoutCard() {
  return new Card({
    id: 'dwarven_scout',
    name: 'Dwarven Scout',
    description: 'Play -> Call Dwarven Scout to the battle!',
    shortDesc: 'Call Scout',
    subtype: 'allies',
    cardType: CardType.CREATURE,
    costType: CostType.RECHARGE,
    effects: [new CardEffect('summon_dwarven_scout', 1, TargetType.SUMMON)],
    rarity: 'common',
    tier: 2,
    previewCreature: createDwarvenScoutCreature(),
  });
}

export function createDwarvenBrew() {
  return new Card({
    id: 'dwarven_brew',
    name: 'Dwarven Brew',
    description: 'Banish -> Heal 2, Shield. +1 Shield/turn for 6 turns.',
    shortDesc: 'B->Heal 2, Shield\n+Shield/6T',
    subtype: 'item',
    cardType: CardType.ITEM,
    costType: CostType.BANISH,
    effects: [
      new CardEffect('heal', 2, TargetType.SELF),
      new CardEffect('gain_shield', 1, TargetType.SELF),
      new CardEffect('dwarven_brew_buff', 6, TargetType.SELF),
    ],
    tier: 2,
  });
}

export function createWhiteWolfCloak() {
  return new Card({
    id: 'white_wolf_cloak',
    name: 'White Wolf Cloak',
    description: 'Recharge -> Block 2 and clears 1 Ice.',
    shortDesc: 'R->Block 2\nClear Ice',
    subtype: 'clothing',
    cardType: CardType.DEFENSE,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('block', 2, TargetType.SELF),
      new CardEffect('clear_ice', 1, TargetType.SELF),
    ],
    rarity: 'rare',
  });
}

// === Sahuagin Sentinel loot drops (mirrors PY get_sahuagin_sentinel_loot) ===
export function createSahuaginTridentLoot() {
  return new Card({
    id: 'sahuagin_trident',
    name: 'Sahuagin Trident',
    description: 'Recharge +1 -> Deal 3 Damage. +3 if target is damaged.',
    shortDesc: 'R+1->3 Dmg\n+3 if damaged',
    subtype: 'martial_2h',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('damage', 3, TargetType.SINGLE_ENEMY),
      new CardEffect('recharge_extra', 1, TargetType.SELF),
      new CardEffect('damaged_bonus_damage', 3, TargetType.SINGLE_ENEMY),
    ],
    rarity: 'uncommon',
  });
}

export function createFishScaleBoots() {
  return new Card({
    id: 'fish_scale_boots',
    name: 'Fish Scale Boots',
    // Two-line layout: line 1 = recharge / block, line 2 = swim pill.
    // \n is honored by the small + full card renderers, and the
    // "On Swim" prefix renders as a pill thanks to inlineBadgeRe.
    description: 'Recharge -> Block 1.\nOn Swim: Draw 2.',
    shortDesc: 'R->Block 1\nOn Swim: Draw 2',
    subtype: 'light_armor',
    cardType: CardType.DEFENSE,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('block', 1, TargetType.SELF),
      new CardEffect('on_swim_recharge_draw', 2, TargetType.SELF),
    ],
    rarity: 'rare',
  });
}

export function createSahuaginEye() {
  return new Card({
    id: 'sahuagin_eye',
    name: 'Sahuagin Eye',
    description: 'Next Attack: +1 damage if target is damaged. Stays in hand.',
    shortDesc: 'Next Attack +1\nif damaged',
    subtype: 'relic',
    cardType: CardType.RELIC,
    costType: CostType.FREE,
    effects: [
      new CardEffect('grant_eye_buff', 1, TargetType.SELF),
      new CardEffect('stays_in_hand', 0, TargetType.SELF),
    ],
    rarity: 'epic',
  });
}

// Swimming In Current — pseudo-card displayed in the showcase slot
// during the Piranha Pool swim phase (and any future encounter that
// uses the swim mechanic). Not playable. Mirrors PY's swim overlay
// title + description; the visible art is SwimingInCurrent.jpg.
export function createSwimmingShowcase() {
  return new Card({
    id: 'swimming_in_current',
    name: 'Swimming In Current',
    description: 'To Swim: Recharge 1 to 3 cards.',
    shortDesc: 'Swim:\nR 1-3 Cards',
    subtype: 'spell',
    cardType: CardType.ABILITY,
    costType: CostType.RECHARGE,
    effects: [],
    isToken: true,
    rarity: 'rare',
  });
}

// Whirlpool — Sahuagin Priest spell. Mirrors PY create_whirlpool:
// applies one Whirlpool stack on the player. At the start of the
// player's next turn, each stack forces a swim of 1 (one hand-card
// recharge OR 1 deck damage if the hand is empty). On Swim effects
// (Fish Scale Boots / Barnacle Encrusted Plate) fire on each
// recharge. Played by the priest's deck AND by the High Priest
// creature summon — both routes funnel through apply_whirlpool.
export function createWhirlpool() {
  return new Card({
    id: 'whirlpool',
    name: 'Whirlpool',
    description: 'Recharge -> Whirlpool: Player must recharge 1 card or take 1 damage at start of turn.',
    shortDesc: 'R->Whirlpool\nDebuff',
    subtype: 'spell',
    cardType: CardType.ABILITY,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('apply_whirlpool', 1, TargetType.SINGLE_ENEMY),
    ],
    priority: 7,
    rarity: 'rare',
  });
}

// Sahuagin Priest Staff — Sahuagin Priest drop. Mirrors PY
// create_sahuagin_priest_staff: Recharge +1 Card, deal 1 damage +
// apply 1 Ice, summon a Shark.
export function createSahuaginPriestStaffLoot() {
  return new Card({
    id: 'sahuagin_priest_staff',
    name: 'Sahuagin Priest Staff',
    description: 'Recharge +1 -> Deal 1 Damage + Ice, Summon a Shark.',
    shortDesc: 'R+1->1 Dmg+Ice\nSummon Shark',
    subtype: 'staff',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('damage', 1, TargetType.SINGLE_ENEMY),
      new CardEffect('recharge_extra', 1, TargetType.SELF),
      new CardEffect('apply_ice', 1, TargetType.SINGLE_ENEMY),
      new CardEffect('summon_shark', 1, TargetType.SUMMON),
    ],
    rarity: 'epic',
    previewCreature: new Creature({
      name: 'Shark', attack: 1, maxHp: 4, bloodfrenzy: 1,
      description: 'Bloodfrenzy: +1 Rage after attacking.',
    }),
  });
}

// Enraged Strike — auto-added to the enemy's hand on every turn
// from turn 11 onward as a soft pity timer. Mirrors PY
// create_enraged_strike: 1 damage + 1 rage on play, priority 10
// so the AI fires it early in the queued action list.
export function createEnragedStrike() {
  return new Card({
    id: 'enraged_strike',
    name: 'Enraged Strike',
    description: 'Recharge -> Deal 1 Damage, Gain 1 Rage.',
    shortDesc: 'R->1 Dmg\n+1 Rage',
    subtype: 'ability',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('damage', 1, TargetType.SINGLE_ENEMY),
      new CardEffect('gain_rage', 1, TargetType.SELF),
    ],
    priority: 10,
  });
}

// Cave Shroom — healing item found at the cave river landing.
// Mirrors PY create_cave_shroom: BANISH cost, Heal 1 + Scry 2 (look at
// top 2 cards, pick one, recharge the other).
export function createCaveShroom() {
  return new Card({
    id: 'cave_shroom',
    name: 'Cave Shroom',
    // "Scry 2" is rendered as a colored keyword with a hover tooltip
    // (the standard "Look at the top N cards. Pick 1, recharge the
    // rest." description) thanks to the keyword tokenizer.
    description: 'Banish -> Heal 1. Scry 2.',
    shortDesc: 'B->Heal 1\nScry 2, Pick 1',
    subtype: 'item',
    cardType: CardType.ITEM,
    costType: CostType.BANISH,
    effects: [
      new CardEffect('heal', 1, TargetType.SELF),
      new CardEffect('scry_pick', 2, TargetType.SELF),
    ],
    rarity: 'uncommon',
  });
}

// Wolf Fang — relic mirroring PY create_wolf_teeth. The card has no
// active effect when played; instead its Heroism trigger fires every
// time it lands in the recharge pile (paid as cost or self-recharged
// at end of turn). Effect handler lives in main.js (applyOnRechargeHeroism).
export function createWolfFang() {
  return new Card({
    id: 'wolf_teeth',
    name: 'Wolf Fang',
    description: 'On Recharge: Gain 1 Heroism.',
    shortDesc: 'On Recharge:\nHeroism +1',
    subtype: 'relic',
    cardType: CardType.RELIC,
    costType: CostType.RECHARGE,
    effects: [new CardEffect('on_recharge_heroism', 1, TargetType.SELF)],
    rarity: 'rare',
  });
}
