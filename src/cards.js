import { Card, CardEffect, CardMode } from './card.js';
import { CardType, CostType, TargetType } from './constants.js';
import { Creature } from './creature.js';

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
    description: 'Recharge -> Block 2 damage.',
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
    effects: [new CardEffect('multi_damage', 2, TargetType.SINGLE_ENEMY)],
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
    shortDesc: 'R->2 Dmg (+2 Armor)',
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
    description: 'Recharge -> Gain 1 Shield.',
    shortDesc: 'R->Shield 1',
    subtype: 'light_armor',
    cardType: CardType.ABILITY,
    costType: CostType.RECHARGE,
    effects: [new CardEffect('gain_shield', 1, TargetType.SELF)],
  });
}

export function createShortBow() {
  return new Card({
    id: 'short_bow',
    name: 'Short Bow',
    description: 'Recharge +1 Card -> Deal 3 Damage, Draw 1.',
    shortDesc: 'R+1->3 Dmg, Draw 1',
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
    description: 'Recharge +1 Card -> Deal 4 Damage, Gain 1 Shield.',
    shortDesc: 'R+1->4 Dmg, Shield 1',
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
    description: 'Recharge -> Look at top 2 cards, pick one, recharge the other.',
    shortDesc: 'R->Scry 2, Pick 1',
    subtype: 'item',
    cardType: CardType.ITEM,
    costType: CostType.RECHARGE,
    effects: [new CardEffect('scry_pick', 2, TargetType.SELF)],
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
    description: 'Recharge -> Block 1 damage.',
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
    description: 'Recharge -> Deal 1 Damage and Ice, Draw a card.',
    shortDesc: 'R->1 Dmg+Ice, Draw 1',
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
      'Recharge -> Deal 1 Damage, Draw a card. Additionally Recharge another card to deal 1 extra damage twice.',
    shortDesc: 'R->1 Dmg, Draw 1. R1->x3',
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
    description: 'Recharge -> Deal X Damage.\nX = # of attacks this turn.',
    shortDesc: 'R->X Dmg\nX = # attacks',
    subtype: 'ability',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [new CardEffect('sneak_attack_damage', 0, TargetType.SINGLE_ENEMY)],
    characterClass: ['rogue', 'druid'],
    tier: 1,
  });
}

function createSmallSpiderCreature() {
  return new Creature({
    name: 'Small Spider',
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
    description: 'Recharge -> Gain 1 Shield, Deal damage = Shield.',
    shortDesc: 'R->+1 Shld, Dmg=Shld',
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
    description: 'Recharge -> Heal 1, Draw a card.',
    shortDesc: 'R->Heal 1, Draw 1',
    subtype: 'ability',
    cardType: CardType.ABILITY,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('heal', 1, TargetType.SELF),
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
    description: 'Recharge -> Gain 1 Shield, Draw a card.',
    shortDesc: 'R->Shield 1, Draw 1',
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
    description: 'Recharge -> Deal 2 Damage, Gain 1 Shield.',
    shortDesc: 'R->2 Dmg, Shield 1',
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
    description: 'Choose 1:\n3 Damage\nOR 1 Damage, Draw 1',
    shortDesc: 'R->3 Dmg\nOR 1 Dmg+Draw',
    subtype: 'ability',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [],
    modes: [
      new CardMode('Deal 3 Damage', [
        new CardEffect('damage', 3, TargetType.SINGLE_ENEMY),
      ]),
      new CardMode('Deal 1 Damage, Draw 1', [
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
    description: 'Recharge -> Gain 1 Regen.\n(Heal at start of turn)',
    shortDesc: 'R->Regen 1',
    subtype: 'ability',
    cardType: CardType.ABILITY,
    costType: CostType.RECHARGE,
    effects: [new CardEffect('regen', 1, TargetType.SELF)],
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
    effects: [new CardEffect('heal', 3, TargetType.SELF)],
    characterClass: ['paladin'],
    tier: 1,
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
  });
}

// ============================================================
// Ability Choice Lists (Tier 1 only for initial selection)
// ============================================================

export function getPaladinAbilityChoices() {
  return [createHeroicStrike(), createHolyLight(), createShieldOfFaith(), createFlashHeal()];
}

export function getRangerAbilityChoices() {
  return [createTamedRat(), createGoodberries(), createMultiShot(), createCarefulStrike()];
}

export function getWizardAbilityChoices() {
  return [createFireBurst(), createIceBolt(), createMagicMissiles(), createArcaneShield()];
}

export function getRogueAbilityChoices() {
  return [createVialOfPoison(), createSneakAttack(), createPetSpider(), createCarefulStrike()];
}

export function getWarriorAbilityChoices() {
  return [createHeroicStrike(), createGreaterCleave(), createRecklessStrike(), createShieldBash()];
}

export function getDruidAbilityChoices() {
  return [createWrath(), createRegrowth(), createFeralSwipe(), createSneakAttack()];
}

export function getAbilityChoices(className, count = 3) {
  const choiceFns = {
    Paladin: getPaladinAbilityChoices,
    Ranger: getRangerAbilityChoices,
    Wizard: getWizardAbilityChoices,
    Rogue: getRogueAbilityChoices,
    Warrior: getWarriorAbilityChoices,
    Druid: getDruidAbilityChoices,
  };
  const all = (choiceFns[className] || getPaladinAbilityChoices)();
  // Filter tier 1 and pick random sample
  const tier1 = all.filter(c => c.tier === 1);
  const shuffled = tier1.sort(() => Math.random() - 0.5);
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
    description: 'Recharge -> Block 1 damage.',
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

export function createMotivationalWhip() {
  return new Card({
    id: 'motivational_whip',
    name: 'Motivational Whip',
    description: 'Recharge +1 -> Deal 2 damage.',
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
    name: 'Dire Rat Screech',
    description: 'Recharge -> Summon 1-3 Rats.',
    shortDesc: 'R->1-3 Rats',
    subtype: 'allies',
    cardType: CardType.CREATURE,
    costType: CostType.RECHARGE,
    effects: [new CardEffect('summon_random', 3, TargetType.SUMMON)],
  });
}

// ============================================================
// Loot Reward Cards
// ============================================================

export function createBoneWand() {
  return new Card({
    id: 'bone_wand',
    name: 'Bone Wand',
    description: 'Recharge -> Apply Poison, Draw 1.',
    shortDesc: 'R->Poison, Draw 1',
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
    description: 'Recharge +1 -> Deal 4 damage (+2 vs Armor).',
    shortDesc: 'R+1->4 Dmg (+2 Armor)',
    subtype: 'martial_2h',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('damage', 4, TargetType.SINGLE_ENEMY),
      new CardEffect('recharge_extra', 1, TargetType.SELF),
    ],
  });
}

export function createTorch() {
  return new Card({
    id: 'torch',
    name: 'Torch',
    description: 'Discard -> Deal 1 Fire to all. Scry 3.',
    shortDesc: 'D->1 Fire ALL\nScry 3',
    subtype: 'item',
    cardType: CardType.ITEM,
    costType: CostType.DISCARD,
    effects: [
      new CardEffect('apply_fire_all', 1, TargetType.ALL_ENEMIES),
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
    shortDesc: "R->1 Dmg, +1 Hero",
    subtype: 'simple',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('damage', 1, TargetType.SINGLE_ENEMY),
    ],
    rarity: 'uncommon',
  });
}

export function createSharpRock() {
  return new Card({
    id: 'sharp_rock',
    name: 'Sharp Rock',
    description: 'Recharge +1 -> Deal 4 damage.',
    shortDesc: 'R+1->4 Dmg',
    subtype: 'weapon',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('damage', 4, TargetType.SINGLE_ENEMY),
      new CardEffect('recharge_extra', 1, TargetType.SELF),
    ],
    rarity: 'uncommon',
  });
}

// ============================================================
// Shop Cards - General Store
// ============================================================

export function createTravelRations() {
  return new Card({
    id: 'travel_rations',
    name: 'Travel Rations',
    description: 'Banish -> Heal 3.',
    shortDesc: 'B->Heal 3',
    subtype: 'item',
    cardType: CardType.ITEM,
    costType: CostType.BANISH,
    effects: [new CardEffect('heal', 3, TargetType.SELF)],
    rarity: 'common',
  });
}

export function createBandages() {
  return new Card({
    id: 'bandages',
    name: 'Bandages',
    description: 'Banish -> Heal 2, Draw 1.',
    shortDesc: 'B->Heal 2, Draw 1',
    subtype: 'item',
    cardType: CardType.ITEM,
    costType: CostType.BANISH,
    effects: [
      new CardEffect('heal', 2, TargetType.SELF),
      new CardEffect('draw', 1, TargetType.SELF),
    ],
    rarity: 'common',
  });
}

export function createTravelersClothing() {
  return new Card({
    id: 'travelers_clothing',
    name: "Traveler's Clothing",
    description: 'Recharge -> Block 1, Draw 1.',
    shortDesc: 'R->Block 1, Draw 1',
    subtype: 'light_armor',
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
    cardType: CardType.SKILL,
    costType: CostType.RECHARGE,
    effects: [new CardEffect('scry_pick', 3, TargetType.SELF)],
    rarity: 'common',
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
    description: 'Recharge -> Deal 3 damage (+2 vs Armor).',
    shortDesc: 'R->3 Dmg (+2 Armor)',
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
    description: 'Recharge +1 -> Deal 6 damage.',
    shortDesc: 'R+1->6 Dmg',
    subtype: 'martial_2h',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('damage', 6, TargetType.SINGLE_ENEMY),
      new CardEffect('recharge_extra', 1, TargetType.SELF),
    ],
    rarity: 'uncommon',
  });
}

export function createBow() {
  return new Card({
    id: 'bow',
    name: 'Bow',
    description: 'Recharge +1 -> Deal 4 damage, Draw 1.',
    shortDesc: 'R+1->4 Dmg, Draw 1',
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
    description: 'Free -> Deal 2 damage.',
    shortDesc: 'F->2 Dmg',
    subtype: 'martial',
    cardType: CardType.ATTACK,
    costType: CostType.FREE,
    effects: [new CardEffect('damage', 2, TargetType.SINGLE_ENEMY)],
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
    description: 'Recharge -> Block 3.',
    shortDesc: 'R->Block 3',
    subtype: 'light_armor',
    cardType: CardType.DEFENSE,
    costType: CostType.RECHARGE,
    effects: [new CardEffect('block', 3, TargetType.SELF)],
    rarity: 'uncommon',
  });
}

export function createRingMail() {
  return new Card({
    id: 'ring_mail',
    name: 'Ring Mail',
    description: 'Recharge +1 -> Block 4, Gain 1 Shield.',
    shortDesc: 'R+1->Block 4, Shield 1',
    subtype: 'heavy_armor',
    cardType: CardType.DEFENSE,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('block', 4, TargetType.SELF),
      new CardEffect('gain_shield', 1, TargetType.SELF),
      new CardEffect('recharge_extra', 1, TargetType.SELF),
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
    description: 'Banish -> Gain 3 Heroism.',
    shortDesc: 'B->3 Heroism',
    subtype: 'item',
    cardType: CardType.ITEM,
    costType: CostType.BANISH,
    effects: [new CardEffect('gain_heroism', 3, TargetType.SELF)],
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
    rarity: 'uncommon',
  });
}

export function createWandOfFire() {
  return new Card({
    id: 'wand_of_fire',
    name: 'Wand of Fire',
    description: 'Recharge -> Deal 2 damage and 2 Fire.',
    shortDesc: 'R->2 Dmg + 2 Fire',
    subtype: 'wand',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('damage', 2, TargetType.SINGLE_ENEMY),
      new CardEffect('apply_fire', 2, TargetType.SINGLE_ENEMY),
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
    description: 'Recharge +1 -> Deal 2 Damage, Draw 1.',
    shortDesc: 'R+1->2 Dmg, Draw 1',
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
    shortDesc: 'R->+1 Ice',
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
    description: 'Recharge -> Deal 1 Damage, Gain 1 Shield.',
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
    shortDesc: 'R->4 Dmg, 1 Ice',
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
    description: 'Recharge +1 -> Deal 5 Damage.',
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

export function createQuarterstaff() {
  return new Card({
    id: 'quarterstaff',
    name: 'Quarterstaff',
    description: 'Recharge -> Deal 3 Damage, Gain 1 Shield.',
    shortDesc: 'R->3 Dmg, +1 Shield',
    subtype: 'martial_2h',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('damage', 3, TargetType.SINGLE_ENEMY),
      new CardEffect('gain_shield', 1, TargetType.SELF),
    ],
  });
}

export function createAle() {
  return new Card({
    id: 'ale',
    name: 'Ale',
    description: 'Banish -> Gain 2 Heroism, Draw 1.',
    shortDesc: 'B->2 Heroism, Draw 1',
    subtype: 'item',
    cardType: CardType.ITEM,
    costType: CostType.BANISH,
    effects: [
      new CardEffect('gain_heroism', 2, TargetType.SELF),
      new CardEffect('draw', 1, TargetType.SELF),
    ],
  });
}

// ============================================================
// Enemy Cards - Sahuagin
// ============================================================

export function createTridentThrow() {
  return new Card({
    id: 'trident_throw',
    name: 'Trident Throw',
    description: 'Recharge +1 -> Deal 2 Damage, Draw 1.',
    shortDesc: 'R+1->2 Dmg, Draw 1',
    subtype: 'weapon',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('damage', 2, TargetType.SINGLE_ENEMY),
      new CardEffect('recharge_extra', 1, TargetType.SELF),
      new CardEffect('draw', 1, TargetType.SELF),
    ],
  });
}

export function createTridentThrust() {
  return new Card({
    id: 'trident_thrust',
    name: 'Trident Thrust',
    description: 'Recharge -> Deal 1 Damage.',
    shortDesc: 'R->1 Dmg',
    subtype: 'weapon',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [new CardEffect('damage', 1, TargetType.SINGLE_ENEMY)],
  });
}

export function createScaleArmor() {
  return new Card({
    id: 'scale_armor',
    name: 'Scale Armor',
    description: 'Recharge -> Block 2.',
    shortDesc: 'R->Block 2',
    subtype: 'armor',
    cardType: CardType.DEFENSE,
    costType: CostType.RECHARGE,
    effects: [new CardEffect('block', 2, TargetType.SELF)],
  });
}

export function createBloodInTheWater() {
  return new Card({
    id: 'blood_in_the_water',
    name: 'Blood in the Water',
    description: 'Recharge -> Deal 2 Damage to ALL.',
    shortDesc: 'R->2 Dmg ALL',
    subtype: 'weapon',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [new CardEffect('damage_all', 2, TargetType.ALL_ENEMIES)],
  });
}

export function createSahuaginStaffEnemy() {
  return new Card({
    id: 'sahuagin_staff_enemy',
    name: 'Sahuagin Staff',
    description: 'Recharge -> Deal 1 Damage + 1 Fire.',
    shortDesc: 'R->1 Dmg + 1 Fire',
    subtype: 'weapon',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('damage', 1, TargetType.SINGLE_ENEMY),
      new CardEffect('apply_fire', 1, TargetType.SINGLE_ENEMY),
    ],
  });
}

export function createBarnacleEncrustedPlateEnemy() {
  return new Card({
    id: 'barnacle_encrusted_plate_enemy',
    name: 'Barnacle Plate',
    description: 'Recharge -> Block 3 + 1 Shield.',
    shortDesc: 'R->Block 3, Shield 1',
    subtype: 'armor',
    cardType: CardType.DEFENSE,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('block', 3, TargetType.SELF),
      new CardEffect('gain_shield', 1, TargetType.SELF),
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
    shortDesc: 'R->1 Dmg + 1 Poison',
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
    description: 'Recharge -> Block 1.',
    shortDesc: 'R->Block 1',
    subtype: 'armor',
    cardType: CardType.DEFENSE,
    costType: CostType.RECHARGE,
    effects: [new CardEffect('block', 1, TargetType.SELF)],
  });
}

// ============================================================
// Enemy Cards - Obsidian
// ============================================================

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
    description: 'Recharge -> Deal 1 unpreventable damage.',
    shortDesc: 'R->1 True Dmg',
    subtype: 'weapon',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [new CardEffect('unpreventable_damage', 1, TargetType.SINGLE_ENEMY)],
  });
}

// ============================================================
// Enemy Cards - Siege
// ============================================================

export function createPullingBackTheRam() {
  return new Card({
    id: 'pulling_back_the_ram',
    name: 'Pulling Back the Ram',
    description: 'Recharge -> Deal 1 Damage.',
    shortDesc: 'R->1 Dmg',
    subtype: 'weapon',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [new CardEffect('damage', 1, TargetType.SINGLE_ENEMY)],
  });
}

// ============================================================
// Enemy Cards - Drake Rider
// ============================================================

export function createDrakeRiderCharge() {
  return new Card({
    id: 'drake_rider_charge',
    name: 'Drake Rider Charge!',
    description: 'Recharge +1 -> Deal 3 Damage + 1 Ice.',
    shortDesc: 'R+1->3 Dmg + 1 Ice',
    subtype: 'weapon',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('damage', 3, TargetType.SINGLE_ENEMY),
      new CardEffect('apply_ice', 1, TargetType.SINGLE_ENEMY),
      new CardEffect('recharge_extra', 1, TargetType.SELF),
    ],
  });
}

export function createChainShirt() {
  return new Card({
    id: 'chain_shirt',
    name: 'Chain Shirt',
    description: 'Recharge -> Block 2.',
    shortDesc: 'R->Block 2',
    subtype: 'armor',
    cardType: CardType.DEFENSE,
    costType: CostType.RECHARGE,
    effects: [new CardEffect('block', 2, TargetType.SELF)],
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
    shortDesc: 'R->5 Dmg + 1 Ice',
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
    shortDesc: 'R->Block 3, Shield 1',
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
  return new Card({
    id: 'runeforged_buckler',
    name: 'Runeforged Buckler',
    description: 'Recharge -> Block 2, Draw 1.',
    shortDesc: 'R->Block 2, Draw 1',
    subtype: 'armor',
    cardType: CardType.DEFENSE,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('block', 2, TargetType.SELF),
      new CardEffect('draw', 1, TargetType.SELF),
    ],
  });
}

export function createDwarvenTowerShield() {
  return new Card({
    id: 'dwarven_tower_shield',
    name: 'Dwarven Tower Shield',
    description: 'Recharge +1 -> Block 4 + 2 Shield.',
    shortDesc: 'R+1->Block 4, Shield 2',
    subtype: 'armor',
    cardType: CardType.DEFENSE,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('block', 4, TargetType.SELF),
      new CardEffect('gain_shield', 2, TargetType.SELF),
      new CardEffect('recharge_extra', 1, TargetType.SELF),
    ],
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
    shortDesc: 'R->Block 2, Shield 1',
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
  return new Card({
    id: 'defensive_formation',
    name: 'Defensive Formation',
    description: 'Recharge -> Block 1 + 1 Shield.',
    shortDesc: 'R->Block 1, Shield 1',
    subtype: 'armor',
    cardType: CardType.DEFENSE,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('block', 1, TargetType.SELF),
      new CardEffect('gain_shield', 1, TargetType.SELF),
    ],
  });
}

// ============================================================
// Enemy Cards - Mimic
// ============================================================

export function createMimicBite() {
  return new Card({
    id: 'mimic_bite',
    name: 'Bite!',
    description: 'Recharge -> Deal 2 Damage.',
    shortDesc: 'R->2 Dmg',
    subtype: 'weapon',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [new CardEffect('damage', 2, TargetType.SINGLE_ENEMY)],
  });
}

// ============================================================
// Enemy Cards - Bone Storm
// ============================================================

export function createBoneStorm() {
  return new Card({
    id: 'bone_storm',
    name: 'Bone Storm',
    description: 'Recharge -> Deal 1 Damage to ALL.',
    shortDesc: 'R->1 Dmg ALL',
    subtype: 'weapon',
    cardType: CardType.ATTACK,
    costType: CostType.RECHARGE,
    effects: [new CardEffect('damage_all', 1, TargetType.ALL_ENEMIES)],
  });
}

// ============================================================
// Companion Cards
// ============================================================

export function createThorbCard() {
  return new Card({
    id: 'thorb_card',
    name: 'Thorb',
    description: 'Recharge +1 -> Summon Thorb (2/4) to battle!',
    shortDesc: 'R+1->Summon Thorb',
    subtype: 'allies',
    cardType: CardType.CREATURE,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('summon_thorb', 1, TargetType.SUMMON),
      new CardEffect('recharge_extra', 1, TargetType.SELF),
    ],
    rarity: 'rare',
    isUnique: true,
  });
}

export function createThorbUpgradedCard() {
  return new Card({
    id: 'thorb_card_2',
    name: 'Thorb',
    description: 'Recharge +1 -> Summon Thorb (2/5 Sentinel)!',
    shortDesc: 'R+1->Summon Thorb',
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
    description: 'Recharge -> Block 2. Gain 1 Shield.',
    shortDesc: 'R->Block 2, +1 Shield',
    subtype: 'heavy_armor',
    cardType: CardType.DEFENSE,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('block', 2, TargetType.SELF),
      new CardEffect('gain_shield', 1, TargetType.SELF),
    ],
    tier: 2,
  });
}

export function createDwarvenBrew() {
  return new Card({
    id: 'dwarven_brew',
    name: 'Dwarven Brew',
    description: 'Banish -> Heal 2, +1 Shield. +1 Shield/turn for 6 turns.',
    shortDesc: 'B->Heal 2\n+1 Shld/6T',
    subtype: 'item',
    cardType: CardType.ITEM,
    costType: CostType.BANISH,
    effects: [
      new CardEffect('heal', 2, TargetType.SELF),
      new CardEffect('gain_shield', 1, TargetType.SELF),
    ],
    tier: 2,
  });
}

export function createWhiteWolfCloak() {
  return new Card({
    id: 'white_wolf_cloak',
    name: 'White Wolf Cloak',
    description: 'Recharge -> Block 2, Draw 1.',
    shortDesc: 'R->Block 2, Draw 1',
    subtype: 'light_armor',
    cardType: CardType.DEFENSE,
    costType: CostType.RECHARGE,
    effects: [
      new CardEffect('block', 2, TargetType.SELF),
      new CardEffect('draw', 1, TargetType.SELF),
    ],
    rarity: 'uncommon',
  });
}
