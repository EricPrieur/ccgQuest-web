// === Game Version ===
export const GAME_VERSION = '0.1.7';

// === Screen Dimensions ===
export const SCREEN_WIDTH = 1280;
export const SCREEN_HEIGHT = 960;

// === Game States ===
export const GameState = Object.freeze({
  MENU: 'MENU',
  CHARACTER_SELECT: 'CHARACTER_SELECT',
  ABILITY_SELECT: 'ABILITY_SELECT',
  MAP: 'MAP',
  ENCOUNTER_TEXT: 'ENCOUNTER_TEXT',
  ENCOUNTER_CHOICE: 'ENCOUNTER_CHOICE',
  ENCOUNTER_LOOT: 'ENCOUNTER_LOOT',
  COMBAT: 'COMBAT',
  TARGETING: 'TARGETING',
  MULTI_TARGETING: 'MULTI_TARGETING',
  POWER_TARGETING: 'POWER_TARGETING',
  POWER_RECHARGE: 'POWER_RECHARGE',
  POWER_CHOICE: 'POWER_CHOICE',
  CARD_RECHARGE: 'CARD_RECHARGE',
  MODAL_SELECT: 'MODAL_SELECT',
  DEFENDING: 'DEFENDING',
  DAMAGE_SOURCE: 'DAMAGE_SOURCE',
  DAMAGE_SELECT_HAND: 'DAMAGE_SELECT_HAND',
  DAMAGE_ALL_ANIM: 'DAMAGE_ALL_ANIM',
  RESOLVING_ACTIONS: 'RESOLVING_ACTIONS',
  INGAME_MENU: 'INGAME_MENU',
  ALLY_TARGETING: 'ALLY_TARGETING',
  BUFF_TARGETING: 'BUFF_TARGETING',
  SCRY_SELECT: 'SCRY_SELECT',
  INVENTORY: 'INVENTORY',
  DECK_TUTORIAL: 'DECK_TUTORIAL',
  HELP_SCREEN: 'HELP_SCREEN',
  CHAPTER_END: 'CHAPTER_END',
  FADING: 'FADING',
  OPTIONS_SCREEN: 'OPTIONS_SCREEN',
  SAVE_GAME: 'SAVE_GAME',
  LOAD_GAME: 'LOAD_GAME',
  PERK_SELECT: 'PERK_SELECT',
  PERK_FLASH_GENIUS: 'PERK_FLASH_GENIUS',
  SWIMMING: 'SWIMMING',
  WHIRLPOOL: 'WHIRLPOOL',
  SHOP: 'SHOP',
  TITLE_CARD: 'TITLE_CARD',
  COMPANION_UPGRADE: 'COMPANION_UPGRADE',
  VOLCANO_SACRIFICE: 'VOLCANO_SACRIFICE',
  FORGE_WEAPON: 'FORGE_WEAPON',
  FORGE_ARMOR: 'FORGE_ARMOR',
  GAME_OVER: 'GAME_OVER',
  VICTORY: 'VICTORY',
});

// === Card Enums ===
export const CardType = Object.freeze({
  ATTACK: 'ATTACK',
  DEFENSE: 'DEFENSE',
  SKILL: 'SKILL',
  POWER: 'POWER',
  CREATURE: 'CREATURE',
  ABILITY: 'ABILITY',
  ITEM: 'ITEM',
  RELIC: 'RELIC',
});

export const CostType = Object.freeze({
  FREE: 'FREE',
  RECHARGE: 'RECHARGE',
  DISCARD: 'DISCARD',
  BANISH: 'BANISH',
});

export const TargetType = Object.freeze({
  SELF: 'SELF',
  SINGLE_ENEMY: 'SINGLE_ENEMY',
  ALL_ENEMIES: 'ALL_ENEMIES',
  RANDOM_ENEMY: 'RANDOM_ENEMY',
  SUMMON: 'SUMMON',
});

// === Status Effects ===
export const StatusEffect = Object.freeze({
  STRENGTH: 'STRENGTH',
  WEAK: 'WEAK',
  FIRE: 'FIRE',
  ICE: 'ICE',
  POISON: 'POISON',
  SHOCK: 'SHOCK',
  MARK: 'MARK',
});

// === Colors (CSS format) ===
export const Colors = Object.freeze({
  WHITE: '#ffffff',
  BLACK: '#000000',
  GRAY: '#808080',
  DARK_GRAY: '#404040',
  RED: '#c83c3c',
  GREEN: '#3cc83c',
  BLUE: '#3c3cc8',
  GOLD: '#ffd700',
  YELLOW: '#ffff00',
  BROWN: '#8b5a2b',
  PURPLE: '#8c3c8c',
  ORANGE: '#dc8c28',
  ALLY_BLUE: '#64b4dc',
  ICE_BLUE: '#78c8ff',
  SHOCK_YELLOW: '#ffe650',
});

// === Card Type Colors ===
export const CARD_COLORS = Object.freeze({
  [CardType.ATTACK]: '#b43c3c',
  [CardType.DEFENSE]: '#3c3cb4',
  [CardType.SKILL]: '#3cb43c',
  [CardType.POWER]: '#b4b43c',
  [CardType.CREATURE]: '#645038',
  [CardType.ITEM]: '#808080',
  [CardType.ABILITY]: '#8c3c8c',
  [CardType.RELIC]: '#ffd700',
});

// === Subtype Colors (matches Python game) ===
export const SUBTYPE_COLORS = Object.freeze({
  weapon: '#b43c3c',        // Red
  armor: '#3c3cb4',         // Blue
  heavy_armor: '#3c3cb4',   // Blue
  light_armor: '#3c3cb4',   // Blue
  clothing: '#3c3cb4',      // Blue
  martial: '#b43c3c',       // Red (weapon)
  simple: '#b43c3c',        // Red
  martial_2h: '#b43c3c',    // Red
  ranged: '#b43c3c',        // Red
  ranged_2h: '#b43c3c',     // Red
  wand: '#b43c3c',          // Red
  staff: '#b43c3c',         // Red
  ability: '#8c3c8c',       // Purple
  item: '#808080',          // Grey
  allies: '#645038',        // Brown
  relic: '#c0c0dc',         // Silver
});
