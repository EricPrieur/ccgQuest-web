import { GAME_VERSION, SCREEN_WIDTH, SCREEN_HEIGHT, GameState, Colors, CARD_COLORS, SUBTYPE_COLORS, CardType, CostType, TargetType } from './constants.js';

// Base path for assets (matches vite.config.js base)
const BASE = import.meta.env.BASE_URL || '/';
import {
  Character, CombatBuff, getPerkChoices, CLASS_PERK_WEIGHTS, PERK_REGISTRY,
  createToughPerk, createPreparedPerk, createGritPerk, createArsenalPerk,
  createTalentedPerk, createFirstStrikePerk, createFlashOfGeniusPerk,
  createSecondWindPerk, createAmbushPerk, createArmoredPerk,
  createPowerSurgePerk, createBalancedPerk,
  createLuckyFindPerk, createHarvestPerk,
} from './character.js';
import { Deck } from './deck.js';
import { Creature } from './creature.js';
import {
  getPaladinStarterDeck, getRangerStarterDeck, getWizardStarterDeck,
  getRogueStarterDeck, getWarriorStarterDeck, getDruidStarterDeck,
  getAbilityChoices,
  getPaladinAbilityChoices, getRangerAbilityChoices, getWizardAbilityChoices,
  getRogueAbilityChoices, getWarriorAbilityChoices, getDruidAbilityChoices,
  createBite, createToughHide, createSkreeeeeeeek,
  createBigBone, createLooseBone,
  createSlimeAppendage, createPartiallyDigestedBone, createCorrodedArmor, createPetSlimeCard, createSlimeJar,
  createGuards, createMotivationalWhip, createHideInCorner,
  createDireRatBite, createDireRatScreech,
  createSharpRock, createBoneWand, createBoneClub, createBoneMace, createTorch,
  createBadRations, createSturdyBoots,
  createChickenLeg, createWardensWhip,
  createWoodenSword, createLeatherArmor, createScraps,
  createWoodenAxe, createWoodenGreatsword, createRockMace,
  createCrackedBuckler, createShortBow, createShortStaff,
  createSmallPouch, createKoboldSpear, createKoboldShield,
  createBoneDagger, createClothArmor,
  createHeroicStrike, createHolyLight, createShieldOfFaith, createFlashHeal,
  createFireBurst, createIceBolt, createMagicMissiles, createArcaneShield,
  createVialOfPoison, createSneakAttack, createPetSpider, createCarefulStrike,
  createGreaterCleave, createCharge, createRecklessStrike, createShieldBash,
  createMultiShot, createGoodberries, createGoodberry, createTamedRat,
  createFireToken, createIceToken, createCatFormToken, createBearFormToken,
  createWrath, createRegrowth, createFeralSwipe,
  createSpearThrow, createIcyBreath, createShieldBashEnemy,
  createWhiteClaw, createGreatclub, createQuarterstaff, createAle,
  createTravelRations, createBandages, createTravelersClothing, createSack,
  createSteelAxe, createSteelMace, createSteelSword, createSteelGreataxe,
  createBow, createSteelDagger,
  createStuddedLeatherArmor, createRingMail,
  createScrollOfPotency, createMinorHealingPotion, createWandOfFire,
  createTridentThrow, createTridentThrust, createScaleArmor,
  createBloodInTheWater, createSahuaginStaffEnemy, createBarnacleEncrustedPlateEnemy,
  createPoisonedBite, createWebSpider,
  createCrush, createRockyAppendage,
  createPullingBackTheRam,
  createDrakeRiderCharge, createChainShirt,
  createPummel, createDrainEssence, createObsidianCurse,
  createWhiteClawReforged, createIronforgeChainmail, createDwarvenThrowingAxe,
  createRuneforgedBuckler, createDwarvenTowerShield,
  createTailSwipe, createFireBreath, createMoltenBite, createMoltenScaleArmor,
  createMagmaMephitSummonCard,
  createDefensiveFormation, createMimicBite, createBoneStorm,
  createThorbCard, createThorbUpgradedCard,
  createDwarvenCrossbow, createDwarvenGreaves, createDwarvenBrew, createWhiteWolfCloak,
} from './cards.js';
import { createPrisonCellMap, createMountainPathMap, createPlainsMap, createCaveMap, createRuinsBasinMap, createNorthQualibafMap, createFilibafForestMap, createTharnagMap, createVolcanoMap, createObsidianWastesMap, createTharnagInteriorMap, createEntryCorridorMap, createGateAreaMap, createHallOfAncestorsMap, createMonumentAlleyMap, createTombOfAncestorMap, createGrandStairsMap, createDwarvenThroneRoomMap, createMapRoomMap, createDeeperTunnelsMap, createArtisanDistrictMap } from './map.js';
import { ENCOUNTER_REGISTRY, EncounterPhase } from './encounter.js';
import { getCardArt, POWER_ART_MAP, preloadAllArt } from './card-art.js';
import {
  Power, getClassPower,
  createCleave, createAimedShot, createElementalInfusion,
  createQuickStrike, createBattleFury, createFeralForm,
  createChunkyBite, createDireFury, createSplit, createArmorPower,
  createKoboldBackup,
} from './power.js';
import { saveToSlot, saveToAutoSlot, loadFromSlot, hasSave, hasAnySave, getSaveInfo, deleteSave, MANUAL_SLOT_COUNT, AUTO_SLOT_COUNT } from './save.js';

// === Canvas Setup ===
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = SCREEN_WIDTH;
canvas.height = SCREEN_HEIGHT;

function resizeCanvas() {
  const windowW = window.innerWidth;
  const windowH = window.innerHeight;
  const gameAspect = SCREEN_WIDTH / SCREEN_HEIGHT;
  const windowAspect = windowW / windowH;
  let displayW, displayH;
  if (windowAspect > gameAspect) {
    displayH = windowH;
    displayW = windowH * gameAspect;
  } else {
    displayW = windowW;
    displayH = windowW / gameAspect;
  }
  canvas.style.width = `${displayW}px`;
  canvas.style.height = `${displayH}px`;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// === Game State ===
let state = GameState.MENU;
let mouseX = 0;
let mouseY = 0;
let lastTime = 0;

// === Player / Enemy ===
let player = null;
let enemy = null;
let selectedClass = '';
let isPlayerTurn = true;
let selectedCardIndex = -1;
let combatLog = [];
let combatLogScrollY = 0; // 0 = pinned to bottom (newest), positive = scrolled up
let enemyActionTimer = 0;
let enemyActions = [];
let enemyActionIndex = 0;
let abilityChoices = [];
let shrineAbilityMode = false; // True when the ability-select screen is triggered by the Lost Shrine

// Map / Encounter state
let currentMap = null;
let currentEncounter = null;
let encounterTextIndex = 0;
let encounterChoiceResult = null; // { text, effectType, effectValue } after choosing
let visitedNodes = new Set();
let gold = 0;
let backpack = []; // Cards not in deck, stored between encounters
// Tracks which choice the player made in the kitchen — drives the prison
// warden "snatch from barrel" success probability (sneak=100%, talk=50%,
// fight=0%). Reset on new game / load.
let kitchenChoiceMade = null; // 'attack' | 'talk' | 'sneak' | null
let prisonBarrelLooted = false;

// Shop state
let shopCards = []; // { card, price, creator }[]
let shopName = '';
let shopScrollY = 0;
let inventoryScrollY = 0;
// Inventory filter tabs (type-based, matching Python game)
const INV_FILTER_TYPES = ['All', 'Abilities', 'Allies', 'Armor', 'Items', 'Relics', 'Weapons'];
let invDeckFilters = new Set(INV_FILTER_TYPES);
let invBpFilters = new Set(INV_FILTER_TYPES);
let invBpEquipFilter = false;

// Class equip rules (only enforced during deck rebalancing, not gameplay loot)
const ARMOR_SUBTYPES = new Set(['heavy_armor', 'light_armor', 'clothing']);
const WEAPON_SUBTYPES = new Set(['martial', 'simple', 'martial_2h', 'ranged', 'ranged_2h', 'wand', 'staff']);
const CLASS_ARMOR = {
  Paladin: new Set(['clothing', 'light_armor', 'heavy_armor']),
  Ranger:  new Set(['clothing', 'light_armor']),
  Wizard:  new Set(['clothing']),
  Rogue:   new Set(['clothing', 'light_armor']),
  Warrior: new Set(['clothing', 'light_armor', 'heavy_armor']),
  Druid:   new Set(['clothing', 'light_armor']),
};
const CLASS_WEAPONS = {
  Paladin: new Set(['martial', 'simple', 'martial_2h']),
  Ranger:  new Set(['martial', 'simple', 'ranged', 'ranged_2h', 'martial_2h']),
  Wizard:  new Set(['simple', 'staff', 'wand']),
  Rogue:   new Set(['martial', 'simple', 'ranged']),
  Warrior: new Set(['martial', 'martial_2h', 'simple']),
  Druid:   new Set(['simple', 'staff', 'wand']),
};
const CLASS_ITEMS = {
  Paladin: new Set(['item', 'potion', 'relic']),
  Ranger:  new Set(['item', 'potion', 'relic']),
  Wizard:  new Set(['item', 'potion', 'relic', 'scroll']),
  Rogue:   new Set(['item', 'potion', 'relic', 'scroll']),
  Warrior: new Set(['item', 'potion', 'relic']),
  Druid:   new Set(['item', 'potion', 'relic']),
};
// Per-class base limits for each card category. Mirrors PY's
// CLASS_DECK_LIMITS. During rest, current counts are color-coded
// against these (blue = room, red = over, white = balanced).
// Level-up bonuses add to these (max +3 per category per run).
const CLASS_DECK_LIMITS = {
  Paladin: { weapon: 6, armor: 5, ability: 3, item: 1, allies: 1, relic: 1 },
  Ranger:  { weapon: 7, armor: 3, ability: 3, item: 2, allies: 1, relic: 1 },
  Wizard:  { weapon: 3, armor: 2, ability: 7, item: 3, allies: 1, relic: 1 },
  Rogue:   { weapon: 6, armor: 3, ability: 3, item: 3, allies: 1, relic: 1 },
  Warrior: { weapon: 7, armor: 4, ability: 3, item: 1, allies: 1, relic: 1 },
  Druid:   { weapon: 4, armor: 4, ability: 4, item: 3, allies: 1, relic: 1 },
};

// Maps category labels to the subtypes they count (used by the inventory
// deck-limit display to tally cards from the masterDeck).
const DECK_LIMIT_CATEGORIES = [
  { id: 'weapon',  label: 'Weapons',   subtypes: WEAPON_SUBTYPES },
  { id: 'armor',   label: 'Armor',     subtypes: ARMOR_SUBTYPES },
  { id: 'ability', label: 'Abilities', subtypes: new Set(['ability']) },
  { id: 'item',    label: 'Items',     subtypes: new Set(['item', 'potion', 'scroll', 'food']) },
  { id: 'allies',  label: 'Allies',    subtypes: new Set(['ally', 'allies', 'companion']) },
  { id: 'relic',   label: 'Relics',    subtypes: new Set(['relic']) },
];

// Friendly names for weapon/armor subtypes (displayed in the "can equip"
// section of the inventory character panel).
const SUBTYPE_LABELS = {
  clothing: 'Clothing', light_armor: 'Light Armor', heavy_armor: 'Heavy Armor',
  martial: 'Martial', simple: 'Simple', martial_2h: '2H Martial',
  ranged: 'Ranged', ranged_2h: '2H Ranged', staff: 'Staff', wand: 'Wand',
};

function canClassEquip(card) {
  const sub = (card.subtype || '').toLowerCase();
  if (ARMOR_SUBTYPES.has(sub)) return (CLASS_ARMOR[selectedClass] || new Set()).has(sub);
  if (WEAPON_SUBTYPES.has(sub)) return (CLASS_WEAPONS[selectedClass] || new Set()).has(sub);
  if (['scroll', 'potion', 'relic', 'item'].includes(sub)) return (CLASS_ITEMS[selectedClass] || new Set()).has(sub);
  return true; // abilities, allies, etc. are always equippable
}

// Level-up / Perk state
let pendingLevelUp = false;
let perkChoices = [];
let restMode = false; // true when inventory opened during level-up rest

// Rest-mode deck-limit bonus: tracks the category the player chose to +1
// during this rest session. null = not yet chosen. Cleared on exit.
let _restBonusCat = null;
// Hit rects for deck-limit +/- buttons (filled during draw, tested on click).
let _deckLimitBtnRects = [];
// Rest-mode validation error shown above the Apply Rest button.
let _restErrorMsg = '';
let _restErrorTimer = 0;

// Chapter-end / post-chapter-1 flow
// chapterEndStage: 0 = freedom narrative, 1 = rest + level-up narrative,
// 2 = handed off to ABILITY_SELECT (chapter end is done)
let chapterEndStage = 0;
// Set while the leave-prison → Chapter 2 sequence is in flight. Causes the
// inventory-exit path to route into the Chapter 2 title card + map switch
// instead of back to the encounter/map.
let pendingChapter2Transition = false;
// One-time deck-balancing tutorial — shown after the first level-up perk
// pick (which is always the leave-prison one). Every subsequent rest skips
// straight to the inventory.
let shownDeckTutorial = false;
let encounterTextScrollY = 0; // scroll offset for accumulated encounter text
let encounterTextOverflow = 0; // how much the text overflows the box (set during draw)

// Debug mode (toggle with backtick `)
let debugMode = false;
let runFast = false; // doubles map movement speed
let optionsReturnState = null; // state to return to from options screen
let previousState = null; // state before help/ingame menu
let saveLoadReturnState = null; // state to return to from save/load screens
let helpScrollY = 0;
let loadTab = 'manual'; // 'manual' or 'auto'
let loadSelectedIndex = -1;
let loadConfirmDelete = false;
// Save-name editor state. When a slot is clicked on the save screen, the
// user can edit the name before committing. null = not editing.
let saveEditingSlot = null;    // the slot id being edited (e.g. 'manual_3')
let saveEditingDisplayNum = 0; // the 1-based slot number (for the default name)
let saveEditingName = '';      // current editable name text
let saveEditingSelectAll = false; // true right after clicking in — typing replaces the full text
let saveEditingCursor = 0;     // caret position (0 = before first char)
let saveEditingAnchor = 0;     // selection anchor (when !== cursor, text between is selected)
let loadEntries = [];
let loadScrollY = 0;

// Fade transition state
let fadeAlpha = 0;
let fadePhase = ''; // 'out', 'in', ''
let fadeCallback = null;
let fadeTargetState = null;
let fadeSpeed = 8;

// Title card state
let titleCardText = '';
let titleCardSubtitle = '';
let titleCardAlpha = 0;
let titleCardPhase = ''; // 'in', 'hold', 'out'
let titleCardTimer = 0;
let titleCardCallback = null;

// Damage number animations
let damageNumbers = []; // { x, y, text, color, timer, vy }

// Card badge hover hit areas (cleared each frame)
let cardBadgeHitAreas = []; // { x, y, w, h, label }

// Inline icon hit areas for keyword tooltips (cleared each frame)
let iconHitAreas = []; // { x, y, w, h, keyword }

// Combat intro state
let combatIntroTimer = 0;       // ms remaining
let combatIntroMessage = '';    // optional message under enemy art

// Character card splash (click on card to view full art)
let characterSplashCharacter = null; // null when no splash
let characterSplashIsPlayer = false;

// Hover preview state (cards/powers in combat)
let hoveredCardPreview = null; // a Card to render large
// Shift-to-freeze preview: while Shift is held, whichever preview is currently
// shown (card, power, or creature) stays pinned on screen so the player can
// mouse over its keyword icons (Scry, Heal, etc.) to read the tooltips without
// the preview changing — and a different card/power/creature hover cannot
// swap it out mid-inspection. Released Shift resumes normal hovering.
let shiftFreezeCard = null;
let shiftFreezePower = null;
let shiftFreezeCreature = null;
let shiftFreezeMouseX = 0;
let shiftFreezeMouseY = 0;
function isShiftFrozen() {
  return !!(shiftFreezeCard || shiftFreezePower || shiftFreezeCreature);
}
let hoveredPowerPreview = null; // a Power to render large
let hoveredCreaturePreview = null; // a Creature to render large

// Hit areas for log entries that have a card attached (for hover preview)
let logCardHitAreas = []; // { x, y, w, h, card }

// === Combat Layout Constants ===
// Left section: 80% width (game area)
// Right section: 20% width (log + buttons)
const COMBAT_LEFT_W = Math.floor(SCREEN_WIDTH * 0.8);   // 1024
const COMBAT_RIGHT_X = COMBAT_LEFT_W;
const COMBAT_RIGHT_W = SCREEN_WIDTH - COMBAT_LEFT_W;    // 256

// Left side split horizontally (enemy on top, player on bottom)
const COMBAT_DIVIDER_Y = Math.floor(SCREEN_HEIGHT / 2); // 480
const COMBAT_ENEMY_AREA = { x: 0, y: 0, w: COMBAT_LEFT_W, h: COMBAT_DIVIDER_Y };
const COMBAT_PLAYER_AREA = { x: 0, y: COMBAT_DIVIDER_Y, w: COMBAT_LEFT_W, h: SCREEN_HEIGHT - COMBAT_DIVIDER_Y };

// Right side: log + button section.
const COMBAT_RIGHT_BTN_H = 160;
const COMBAT_RIGHT_LOG_H = SCREEN_HEIGHT - COMBAT_RIGHT_BTN_H; // 816
const COMBAT_RIGHT_BTN_Y = COMBAT_RIGHT_LOG_H;
const COMBAT_LOG_AREA = { x: COMBAT_RIGHT_X, y: 0, w: COMBAT_RIGHT_W, h: COMBAT_RIGHT_LOG_H };
const COMBAT_BTN_AREA = { x: COMBAT_RIGHT_X, y: COMBAT_RIGHT_BTN_Y, w: COMBAT_RIGHT_W, h: COMBAT_RIGHT_BTN_H };

// Special encounter state
let killCount = 0; // for kill-count encounters (wolf pack, etc.)
let killTarget = 0; // how many kills needed to win
let survivalRounds = 0; // survive N rounds to win
let enemyTurnNumber = 0;

// Modal card state
let modalCard = null; // Card being played in modal mode
let modalTarget = null; // Target for modal card (enemy or creature)

// Scry state
let scryCards = []; // cards revealed for scry_pick

// Power recharge state
let powerRechargeMode = false;
let powerRechargeCardsNeeded = 0;
let powerRechargeCardsSelected = [];
let selectedPower = null;

// Card recharge state (for cards with recharge_extra cost like Bow, Bone Club)
let cardRechargeMode = false;
let cardRechargeNeeded = 0;
let cardRechargedCards = []; // cards already paid as recharge cost
let pendingRechargeNames = []; // names to log after the card resolves
// Snapshot of hand order taken when entering any recharge/barrage/power mode.
// Restored on cancel so the hand returns to exactly the same order.
let _handOrderSnapshot = null;

// Ally manual-attack state
let selectedAlly = null;

// Multi-target attack state (Wooden Axe etc.)
let multiTargets = [];
let multiMaxTargets = 0;
let multiCardIndex = -1;

// Feral Swipe state: multi-target where # targets = player shield
let feralSwipeMode = false;
let feralSwipeShieldGranted = 0;

// Barrage state (Magic Missiles: each shot resolves on click, card stays in hand)
let barrageMode = false;          // true = in barrage flow
let barrageShotsLeft = 0;         // remaining shots (0 = pre-pay phase)
let barrageShotsFired = 0;        // how many shots already fired (for cancel check)
let barrageCardIndex = -1;        // index of MM in hand (stays there until done)
let barrageRechargedCard = null;  // card recharged as cost (for refund if cancelled)

// Card registry: card_id -> creator function (for loot rewards + save/load)
const CARD_REGISTRY = {
  // Starter cards
  wooden_sword: createWoodenSword, leather_armor: createLeatherArmor,
  scraps: createScraps, wooden_axe: createWoodenAxe,
  wooden_greatsword: createWoodenGreatsword, rock_mace: createRockMace,
  cracked_buckler: createCrackedBuckler, short_bow: createShortBow,
  short_staff: createShortStaff, small_pouch: createSmallPouch,
  kobold_spear: createKoboldSpear, kobold_shield: createKoboldShield,
  bone_dagger: createBoneDagger, cloth_armor: createClothArmor,
  // Abilities
  heroic_strike: createHeroicStrike, holy_light: createHolyLight,
  shield_of_faith: createShieldOfFaith, flash_heal: createFlashHeal,
  fire_burst: createFireBurst, ice_bolt: createIceBolt,
  magic_missiles: createMagicMissiles, arcane_shield: createArcaneShield,
  vial_of_poison: createVialOfPoison, sneak_attack: createSneakAttack,
  pet_spider: createPetSpider, careful_strike: createCarefulStrike,
  greater_cleave: createGreaterCleave, charge: createCharge, reckless_strike: createRecklessStrike,
  shield_bash: createShieldBash, multi_shot: createMultiShot,
  goodberries: createGoodberries, tamed_rat: createTamedRat,
  wrath: createWrath, regrowth: createRegrowth, feral_swipe: createFeralSwipe,
  // Loot / Story
  sharp_rock: createSharpRock, bone_wand: createBoneWand,
  bone_club: createBoneClub, bone_mace: createBoneMace, torch: createTorch,
  bad_rations: createBadRations, sturdy_boots: createSturdyBoots,
  chicken_leg: createChickenLeg, wardens_whip: createWardensWhip,
  partially_digested_bone: createPartiallyDigestedBone, corroded_armor: createCorrodedArmor,
  pet_slime: createPetSlimeCard, slime_jar: createSlimeJar,
  white_claw: createWhiteClaw,
  // Shop cards
  travel_rations: createTravelRations, bandages: createBandages,
  travelers_clothing: createTravelersClothing, sack: createSack,
  steel_axe: createSteelAxe, steel_mace: createSteelMace,
  steel_sword: createSteelSword, steel_greataxe: createSteelGreataxe,
  bow: createBow, steel_dagger: createSteelDagger,
  studded_leather_armor: createStuddedLeatherArmor, ring_mail: createRingMail,
  scale_armor: createScaleArmor,
  scroll_of_potency: createScrollOfPotency, minor_healing_potion: createMinorHealingPotion,
  wand_of_fire: createWandOfFire,
  greatclub: createGreatclub, quarterstaff: createQuarterstaff, ale: createAle,
  thorb_card: createThorbCard, thorb_card_2: createThorbUpgradedCard,
  dwarven_crossbow: createDwarvenCrossbow, dwarven_tower_shield: createDwarvenTowerShield,
  dwarven_greaves: createDwarvenGreaves, dwarven_brew: createDwarvenBrew,
  white_wolf_cloak: createWhiteWolfCloak,
};

// Loot tables: special loot IDs that pick one card from a weighted pool.
// Encounter `lootCards` arrays can reference any key here; rollLootTable picks
// one entry weighted by `weight`. The Codex's Loot Tables tab mirrors this
// data so the player can see drop odds.
const LOOT_TABLES = {
  bone_pile_loot: [
    { creator: createBoneClub, weight: 1.0 },
    { creator: createBoneMace, weight: 1.0 },
    { creator: createBoneWand, weight: 0.5 },
  ],
  slime_loot: [
    { creator: createPartiallyDigestedBone, weight: 1.0 },
    { creator: createCorrodedArmor, weight: 1.0 },
    { creator: createPetSlimeCard, weight: 0.25 },
    { creator: createSlimeJar, weight: 0.5 },
  ],
  // Abandoned Camp pool — drawn 2-distinct (without replacement). Codex shows
  // single-pick odds; resolveSearchCamp does the without-replacement sampling.
  abandoned_camp_loot: [
    { creator: createSmallPouch,         weight: 1.0 },
    { creator: createBadRations,         weight: 1.0 },
    { creator: createTorch,              weight: 0.5 },
    { creator: createSturdyBoots,        weight: 0.5 },
    { creator: createScrollOfPotency,    weight: 0.5 },
    { creator: createWandOfFire,         weight: 0.5 },
    { creator: createMinorHealingPotion, weight: 0.25 },
  ],
  // Prison warden gear barrel — matches the Python game's
  // `get_gear_barrel_loot()`: equal-weight random.choice across the three
  // starter weapons/shield they were confiscating from prisoners.
  gear_barrel_loot: [
    { creator: createShortBow,        weight: 1.0 },
    { creator: createShortStaff,      weight: 1.0 },
    { creator: createCrackedBuckler,  weight: 1.0 },
  ],
  // Prison Warden body loot — picked once after the prison_guards combat.
  // Matches PY's `get_prison_warden_loot()`. Awarded *in addition* to the
  // guaranteed Warden's Whip drop.
  prison_warden_loot: [
    { creator: createBadRations,    weight: 1.0 },
    { creator: createKoboldSpear,   weight: 1.0 },
    { creator: createKoboldShield,  weight: 1.0 },
    { creator: createSmallPouch,    weight: 1.0 },
    { creator: createChainShirt,    weight: 0.5 },
  ],
  // Kobold Patrol loot — same pool as the prison warden (PY shares the
  // same `get_kobold_patrol_loot()` entries). Dropped after the mountain
  // camp patrol fight and other kobold encounters.
  kobold_patrol_loot: [
    { creator: createBadRations,    weight: 1.0 },
    { creator: createKoboldSpear,   weight: 1.0 },
    { creator: createKoboldShield,  weight: 1.0 },
    { creator: createSmallPouch,    weight: 1.0 },
    { creator: createChainShirt,    weight: 0.5 },
  ],
};

// Display names for loot tables (shown in the Codex tab + source lines).
const LOOT_TABLE_LABELS = {
  bone_pile_loot:      'Bone Pile',
  slime_loot:          'Slime',
  abandoned_camp_loot: 'Abandoned Camp',
  gear_barrel_loot:    'Prison Gear Barrel',
  prison_warden_loot:  'Prison Warden',
  kobold_patrol_loot:  'Kobold Patrol',
};

// Per-table notes shown under the title in the Loot Tables tab.
const LOOT_TABLE_NOTES = {
  bone_pile_loot:      'Dropped after defeating Bone Pile encounters.',
  slime_loot:          'Dropped after defeating Slime encounters.',
  abandoned_camp_loot: 'Camp search picks 2 distinct items without replacement.',
  gear_barrel_loot:    'Snatched from the prison warden\'s barrel of confiscated gear.',
  prison_warden_loot:  'Looted from the warden\'s body after the prison-entrance fight.',
  kobold_patrol_loot:  'Dropped after defeating Kobold Patrol encounters.',
};

function rollLootTable(id) {
  const table = LOOT_TABLES[id];
  if (!table) return null;
  const totalWeight = table.reduce((s, e) => s + e.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const entry of table) {
    roll -= entry.weight;
    if (roll <= 0) return [entry.creator()];
  }
  return [table[table.length - 1].creator()];
}

// Hand sizes per class
const CLASS_HAND_SIZE = {
  Paladin: 4, Ranger: 4, Wizard: 5, Rogue: 4, Warrior: 4, Druid: 4,
};
const MAX_HAND_SIZE = 10;

// === Asset Loading ===
const images = {};
let assetsLoaded = false;

function loadImage(id, src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      // Force eager decode so the browser doesn't defer bitmap decoding
      // to the first drawImage call (which causes visual glitches on powers)
      if (img.decode) {
        img.decode().then(() => { images[id] = img; resolve(img); })
                     .catch(() => { images[id] = img; resolve(img); });
      } else {
        images[id] = img;
        resolve(img);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function loadAssets() {
  await Promise.all([
    loadImage('menu_bg', `${BASE}assets/Backgrounds/MainScreen.jpg`),
    loadImage('char_select_bg', `${BASE}assets/Backgrounds/CharacterSelection.jpg`),
    loadImage('combat_bg', `${BASE}assets/Backgrounds/PrisonBackground.jpg`),
    loadImage('map_prison_cell', `${BASE}assets/Maps/PrisonCellMap.jpg`),
    loadImage('map_sewers', `${BASE}assets/Maps/SewerMap.jpg`),
    loadImage('map_upper_prison', `${BASE}assets/Maps/KoboldCastlePrisonMap.jpg`),
    loadImage('map_mountain_path', `${BASE}assets/Maps/Chapter2MountainPathMap.jpg`),
    loadImage('map_plains', `${BASE}assets/Maps/PlainsOfNoHopeMap.jpg`),
    loadImage('map_cave', `${BASE}assets/Maps/UndergroundCaveMap.jpg`),
    loadImage('map_ruins_basin', `${BASE}assets/Maps/EndofRiverBasinStartOfRuins.jpg`),
    loadImage('map_flood_temple', `${BASE}assets/Maps/FloodTemple.jpg`),
    loadImage('map_flooded_altar', `${BASE}assets/Maps/SacredAreaFloodedTemple.jpg`),
    loadImage('map_temple_exit', `${BASE}assets/Maps/TempleTowardTheExit.jpg`),
    loadImage('map_arriving_city', `${BASE}assets/Maps/ArrivingAtTheCity.jpg`),
    loadImage('map_qualibaf', `${BASE}assets/Maps/QualibafMap.jpg`),
    loadImage('map_north_qualibaf', `${BASE}assets/Maps/NorthGateQualibafExternalMap.jpg`),
    loadImage('map_filibaf_forest', `${BASE}assets/Maps/FilibafForestMap.jpg`),
    loadImage('map_tharnag', `${BASE}assets/Maps/TharnagMap.jpg`),
    loadImage('map_volcano', `${BASE}assets/Maps/QualibafVolcano.jpg`),
    loadImage('map_obsidian_wastes', `${BASE}assets/Maps/ObsidianWastesMap.jpg`),
    loadImage('map_grand_hall', `${BASE}assets/Maps/TharnagGrandHall.jpg`),
    loadImage('map_artisan_hall', `${BASE}assets/Maps/ArtisanHallMap.jpg`),
    loadImage('map_entry_corridor', `${BASE}assets/Maps/DwarvenCityEntryCorridorMap.jpg`),
    loadImage('map_gate_area', `${BASE}assets/Maps/DwarvenCityGateArea.jpg`),
    loadImage('map_hall_of_ancestors', `${BASE}assets/Maps/DwarvenCityHallofAncestors.jpg`),
    loadImage('map_monument_alley', `${BASE}assets/Maps/DwarvenCityMonumentAlley.jpg`),
    loadImage('map_tomb_of_ancestor', `${BASE}assets/Maps/DwarvenCityTombOfAncestor.jpg`),
    loadImage('map_grand_stairs', `${BASE}assets/Maps/DwarvenCityGrandStairs.jpg`),
    loadImage('map_dwarven_throne_room', `${BASE}assets/Maps/DwarvenCityThroneRoom.jpg`),
    loadImage('map_map_room', `${BASE}assets/Maps/DwarvenCityMapRoom.jpg`),
    loadImage('map_deeper_tunnels', `${BASE}assets/Maps/DwarvenCityDeeperTunnels.jpg`),
    loadImage('map_artisan_district', `${BASE}assets/Maps/DwarvenCityArtisanDistrict.jpg`),
    // UI assets
    loadImage('backpack_bg', `${BASE}assets/Backgrounds/BackpackBackground.jpg`),
    loadImage('btn_large', `${BASE}assets/Icons/ButtonLarge.png`),
    loadImage('btn_play', `${BASE}assets/Icons/PlayButton.png`),
    loadImage('banner_large', `${BASE}assets/Icons/BannerLarge.png`),
    loadImage('banner_small', `${BASE}assets/Icons/BannerSmall.png`),
    // UI icons
    loadImage('icon_backpack', `${BASE}assets/Icons/Backpack.png`),
    loadImage('icon_help', `${BASE}assets/Icons/HelpIcon.png`),
    // Keyword icons
    loadImage('icon_heroism', `${BASE}assets/Icons/HeroismIcon.png`),
    loadImage('icon_shield', `${BASE}assets/Icons/ShieldIcon.png`),
    loadImage('icon_armor', `${BASE}assets/Icons/ArmorIcon.png`),
    loadImage('icon_fire', `${BASE}assets/Icons/FireElementIcon.png`),
    loadImage('icon_ice', `${BASE}assets/Icons/IceElementIcon.png`),
    loadImage('icon_poison', `${BASE}assets/Icons/PoisonIcon.png`),
    loadImage('icon_shock', `${BASE}assets/Icons/LightningIcon.png`),
    loadImage('icon_rage', `${BASE}assets/Icons/RageIcon.png`),
    // Card frame overlays (9-slice stretched per card)
    loadImage('frame_common', `${BASE}assets/Icons/FrameCommon.png`),
    loadImage('frame_uncommon', `${BASE}assets/Icons/FrameUncCommon.png`),
    loadImage('frame_rare',     `${BASE}assets/Icons/FrameRare.png`),
    loadImage('frame_epic',     `${BASE}assets/Icons/FrameEpic.png`), // loaded but not yet wired — no epic cards in-game yet
    // Common creature art (eager preload so summons render immediately)
    loadImage('creature_rat', `${BASE}assets/Cards/SummonRat.jpg`),
    loadImage('creature_tamed_rat', `${BASE}assets/Cards/TamedRatAbility.jpg`),
    loadImage('creature_kobold_guard', `${BASE}assets/Cards/KoboldGuard.jpg`),
    loadImage('creature_thorb', `${BASE}assets/Cards/ThorbAlly.jpg`),
    loadImage('creature_slime', `${BASE}assets/Cards/SlimeSummon.jpg`),
    loadImage('creature_restless_bone', `${BASE}assets/Cards/RestlessBoneSummon.jpg`),
    loadImage('creature_spider', `${BASE}assets/Cards/PetSpider.jpg`),
    loadImage('creature_wolf', `${BASE}assets/Cards/WolfInSnow.jpg`),
    loadImage('creature_goblin_sapper', `${BASE}assets/Cards/GoblinSapper.jpg`),
    // All power art (eager preload — eliminates lazy-load quality flicker on hover)
    ...Object.entries(POWER_ART_MAP).map(([id, file]) =>
      loadImage(`power_${id}`, `${BASE}assets/Cards/${file}`)
    ),
    // Perk art — keyed by the perk's imageId (e.g. 'tough_perk'). Used by
    // the codex Perks tab and the PERK_SELECT screen.
    loadImage('tough_perk',           `${BASE}assets/Cards/ToughPerk.jpg`),
    loadImage('prepared_perk',        `${BASE}assets/Cards/PreparedPerk.jpg`),
    loadImage('flash_of_genius_perk', `${BASE}assets/Cards/FlashOfGeniusPerk.jpg`),
    loadImage('grit_perk',            `${BASE}assets/Cards/GritPerk.jpg`),
    loadImage('arsenal_perk',         `${BASE}assets/Cards/ArsenalPerk.jpg`),
    loadImage('talented_perk',        `${BASE}assets/Cards/TalentedPerk.jpg`),
    loadImage('second_wind_perk',     `${BASE}assets/Cards/SecondWindPerk.jpg`),
    loadImage('ambush_perk',          `${BASE}assets/Cards/AmbushPerk.jpg`),
    loadImage('first_strike_perk',    `${BASE}assets/Cards/FirstStrikePerk.jpg`),
    loadImage('armored_perk',         `${BASE}assets/Cards/ArmoredPerk.jpg`),
    loadImage('power_surge_perk',     `${BASE}assets/Cards/PowerSurgePerk.jpg`),
    loadImage('balanced_perk',        `${BASE}assets/Cards/BalanceDruidPerk.jpg`),
    loadImage('lucky_find_perk',      `${BASE}assets/Cards/LuckyFindPerk.png`),
    loadImage('harvest_perk',         `${BASE}assets/Cards/HarvestDruidSpec.png`),
  ]);
  // Eagerly preload ALL card + power art so getCardArt never returns null
  // for a known id. Without this, the first draw of each card shows a
  // colored fallback rectangle for ~200ms while the image lazy-loads.
  // This runs in parallel after the critical UI assets above are ready,
  // so the menu appears immediately and card art streams in behind it.
  preloadAllArt(); // fire-and-forget — non-blocking
  assetsLoaded = true;
}

// === Input Handling ===
// Drag-to-target state (alternative to click flow). Initiated on mousedown over a
// targeted hand card or a ready ally, tracked through mousemove, finalized on mouseup
// over a target.
let dragSourceCardIndex = -1;   // hand card index when dragging a card
let dragSourceAllyIndex = -1;   // player ally index when dragging an ally
let dragStartX = 0, dragStartY = 0;
let dragMoved = false;
let suppressNextClick = false;
const DRAG_THRESHOLD_PX = 14;

function clearDragState() {
  dragSourceCardIndex = -1;
  dragSourceAllyIndex = -1;
  dragStartX = 0;
  dragStartY = 0;
  dragMoved = false;
}

function canvasPosFromEvent(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = SCREEN_WIDTH / rect.width;
  const scaleY = SCREEN_HEIGHT / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  };
}

canvas.addEventListener('mousedown', (e) => {
  const { x, y } = canvasPosFromEvent(e);
  // Codex scrollbar: thumb-drag start or track page-jump.
  if (state === GameState.CODEX && tryCodexScrollbarMouseDown(x, y)) {
    suppressNextClick = true; // don't let the mouseup translate into a select-card click
    return;
  }
  // Per-section horizontal scrollbar (loot/perk rows in Full mode).
  if (state === GameState.CODEX && tryCodexHScrollbarMouseDown(x, y)) {
    suppressNextClick = true;
    return;
  }
  // Only track drags during the player's normal turn in COMBAT state
  if (state !== GameState.COMBAT || !isPlayerTurn || !player || !player.deck) return;
  if (powerRechargeMode || cardRechargeMode) return;

  // Check player allies first (they sit above the hand row)
  const allyRects = getPlayerCreatureRects();
  for (let i = 0; i < player.creatures.length; i++) {
    if (!allyRects[i]) continue;
    if (hitTest(x, y, allyRects[i])) {
      const ally = player.creatures[i];
      // Allow 0-attack allies that apply poison (Pet Spider) to still attack
      if (!ally.isAlive || ally.exhausted) return;
      if (ally.attack <= 0 && !ally.poisonAttack) return;
      dragSourceAllyIndex = i;
      dragStartX = x;
      dragStartY = y;
      dragMoved = false;
      return;
    }
  }

  // Then hand cards (visible-portion hit areas, topmost first)
  const handRects = getHandCardRects(player.deck.hand);
  for (let i = handRects.length - 1; i >= 0; i--) {
    if (hitTest(x, y, getHandCardHoverRect(handRects, i))) {
      const card = player.deck.hand[i];
      if (card.exhausted) return;
      if (card.cardType === CardType.DEFENSE) return;
      if (card.isModal) return; // modal cards still go through click flow
      // Defer entering targeting until the user actually drags
      dragSourceCardIndex = i;
      dragStartX = x;
      dragStartY = y;
      dragMoved = false;
      return;
    }
  }
});

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = SCREEN_WIDTH / rect.width;
  const scaleY = SCREEN_HEIGHT / rect.height;
  mouseX = (e.clientX - rect.left) * scaleX;
  mouseY = (e.clientY - rect.top) * scaleY;
  // Codex scrollbar drag — bypass the rest of the move handler.
  if (state === GameState.CODEX && tryCodexScrollbarMouseMove(mouseY)) return;
  if (state === GameState.CODEX && tryCodexHScrollbarMouseMove(mouseX)) return;
  // If a drag started on a hand card OR an ally and the user moved past the threshold,
  // promote it to a real targeting state.
  if ((dragSourceCardIndex >= 0 || dragSourceAllyIndex >= 0) && !dragMoved) {
    const dx = mouseX - dragStartX;
    const dy = mouseY - dragStartY;
    if (dx * dx + dy * dy >= DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX) {
      dragMoved = true;
      if (dragSourceAllyIndex >= 0) {
        const ally = player.creatures[dragSourceAllyIndex];
        if (!ally || !ally.isAlive || ally.exhausted) { clearDragState(); return; }
        selectedAlly = ally;
        state = GameState.ALLY_TARGETING;
        showStickyToast(`${ally.name}: release on an enemy to attack`);
      } else {
        const card = player.deck.hand[dragSourceCardIndex];
        if (!card) { clearDragState(); return; }
        // Enter targeting mode (single or multi) so the rest of the flow
        // (arrow drawing, target highlight, click handlers) just works.
        if (canPlayWithoutTarget(card)) {
          // Self-targeted cards don't need a drag — treat as a click on release
        } else if (cardIsMultiTarget(card)) {
          const rechargeNeeded = getCardRechargeExtra(card);
          if (rechargeNeeded > 0) { clearDragState(); return; }
          selectedCardIndex = dragSourceCardIndex;
          enterMultiTargeting(dragSourceCardIndex);
        } else if (needsTarget(card)) {
          const rechargeNeeded = getCardRechargeExtra(card);
          if (rechargeNeeded > 0) { clearDragState(); return; }
          selectedCardIndex = dragSourceCardIndex;
          state = GameState.TARGETING;
          showStickyToast('Release on an enemy to attack');
        }
      }
    }
  }
});

canvas.addEventListener('mouseup', (e) => {
  // Always end any in-progress codex scrollbar drag, regardless of state.
  endCodexScrollbarDrag();
  const { x, y } = canvasPosFromEvent(e);
  if ((dragSourceCardIndex >= 0 || dragSourceAllyIndex >= 0) && dragMoved) {
    // Drag completed — try to fire on the target under the cursor
    suppressNextClick = true;
    if (state === GameState.TARGETING) {
      handleTargetingClick(x, y);
    } else if (state === GameState.MULTI_TARGETING) {
      handleMultiTargetingClick(x, y);
    } else if (state === GameState.ALLY_TARGETING) {
      handleAllyTargetingClick(x, y);
    }
  }
  clearDragState();
});

canvas.addEventListener('click', (e) => {
  if (suppressNextClick) {
    suppressNextClick = false;
    return;
  }
  const { x, y } = canvasPosFromEvent(e);
  handleClick(x, y);
});

document.addEventListener('keydown', (e) => {
  // Ctrl+C in combat: copy full combat log to clipboard
  if (e.ctrlKey && e.key === 'c' && combatLog.length > 0) {
    const text = combatLog.map(e => e.text).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      showToast('Combat log copied to clipboard', 1500);
    });
    return;
  }
  // Shift: freeze whichever preview is currently showing (card, power, or
  // creature) so the user can mouse over its keyword icons (Scry, Heal, …) to
  // read tooltips, and other hovers can't swap the preview while shift is held.
  if (e.key === 'Shift' && !isShiftFrozen() &&
      (hoveredCardPreview || hoveredPowerPreview || hoveredCreaturePreview)) {
    shiftFreezeCard = hoveredCardPreview;
    shiftFreezePower = hoveredPowerPreview;
    shiftFreezeCreature = hoveredCreaturePreview;
    shiftFreezeMouseX = mouseX;
    shiftFreezeMouseY = mouseY;
  }
  handleKeyDown(e.key, e);
});

document.addEventListener('keyup', (e) => {
  if (e.key === 'Shift') {
    shiftFreezeCard = null;
    shiftFreezePower = null;
    shiftFreezeCreature = null;
  }
});

canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const scrollAmount = e.deltaY > 0 ? 40 : -40;
  if (state === GameState.SHOP) shopScrollY = Math.max(0, shopScrollY + scrollAmount);
  if (state === GameState.INVENTORY) inventoryScrollY = Math.max(0, inventoryScrollY + scrollAmount);
  // Combat log scroll (only when mouse is over the log area)
  const isCombat = state === GameState.COMBAT || state === GameState.TARGETING ||
    state === GameState.DEFENDING || state === GameState.DAMAGE_SOURCE ||
    state === GameState.POWER_TARGETING || state === GameState.ALLY_TARGETING ||
    state === GameState.MULTI_TARGETING;
  if (isCombat && mouseX >= COMBAT_LOG_AREA.x && mouseY < COMBAT_LOG_AREA.y + COMBAT_LOG_AREA.h) {
    combatLogScrollY = Math.max(0, combatLogScrollY - scrollAmount); // scroll up = positive
  }
  if (state === GameState.HELP_SCREEN) helpScrollY = Math.max(0, helpScrollY + scrollAmount);
  if (state === GameState.CODEX) codexScrollY = Math.max(0, codexScrollY + scrollAmount);
  if (state === GameState.ENCOUNTER_TEXT) encounterTextScrollY = Math.max(0, encounterTextScrollY + scrollAmount);
  if (state === GameState.LOAD_GAME || state === GameState.SAVE_GAME) {
    loadScrollY = Math.max(0, loadScrollY + scrollAmount);
  }
}, { passive: false });

// === Utility ===
function addLog(text, color = Colors.WHITE, card = null) {
  // Effect sub-lines (indented with two spaces) get a → prefix.
  // The arrow is rendered in orange and the rest in the entry color
  // (defaults to white, but caller may pass a specific color to override).
  // Parenthetical info lines like "  (2 cards recharged)" stay indented without arrow.
  // Lines starting with specific info markers (Mode:, Recharge:, Shield, Armor, All damage)
  // also stay indented as info, not arrow.
  let arrow = false;
  const callerSpecifiedColor = color !== Colors.WHITE;
  if (text.startsWith('  ')) {
    const inner = text.slice(2);
    const isInfo =
      inner.startsWith('(') ||
      inner.startsWith('Mode:') ||
      inner.startsWith('Recharge:') ||
      inner.startsWith('Shield absorbs') ||
      inner.startsWith('Armor absorbs') ||
      inner.startsWith('Block absorbs') ||
      inner.startsWith('All damage absorbed');
    if (isInfo) {
      // Info: keep indent, no arrow, gray (unless caller specified a color)
      text = '  ' + inner;
      if (!callerSpecifiedColor) color = Colors.GRAY;
    } else {
      text = '→ ' + inner;
      if (!callerSpecifiedColor) color = Colors.WHITE;
      arrow = true;
    }
  }
  combatLog.push({ text, color, card, arrow });
  if (combatLog.length > 200) combatLog.shift();
  // Auto-pin to bottom when new entries arrive
  combatLogScrollY = 0;
}

// On-screen temporary message with style variants
let toastMessage = '';
let toastTimer = 0;
let toastSticky = false;
let toastStyle = ''; // '', 'damage', 'recharge', 'multi'
let screenFlashTimer = 0;
function showToast(text, durationMs = 2500) {
  toastMessage = text;
  toastTimer = durationMs;
  toastSticky = false;
  toastStyle = '';
}
function showDamageToast(text, durationMs = 2500) {
  toastMessage = text;
  toastTimer = durationMs;
  toastSticky = false;
  toastStyle = 'damage';
  screenFlashTimer = 300;
}
function showStyledToast(text, style = '', durationMs = null) {
  toastMessage = text;
  if (durationMs && durationMs > 0) {
    toastTimer = durationMs;
    toastSticky = false;
  } else {
    toastTimer = 1;
    toastSticky = true;
  }
  toastStyle = style;
}
function showStickyToast(text) {
  toastMessage = text;
  toastTimer = 1;
  toastSticky = true;
  toastStyle = '';
}
function hideToast() {
  toastMessage = '';
  toastTimer = 0;
  toastSticky = false;
}

function hitTest(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

function getPlayerHandSize() {
  return CLASS_HAND_SIZE[selectedClass] || 4;
}

// === Click Dispatch ===
function handleClick(x, y) {
  switch (state) {
    case GameState.MENU:
      handleMenuClick(x, y);
      break;
    case GameState.CHARACTER_SELECT:
      handleCharSelectClick(x, y);
      break;
    case GameState.ABILITY_SELECT:
      handleAbilitySelectClick(x, y);
      break;
    case GameState.MAP:
      handleMapClick(x, y);
      break;
    case GameState.ENCOUNTER_TEXT:
      handleEncounterTextClick(x, y);
      break;
    case GameState.ENCOUNTER_CHOICE:
      handleEncounterChoiceClick(x, y);
      break;
    case GameState.ENCOUNTER_LOOT:
      handleEncounterLootClick(x, y);
      break;
    case GameState.COMBAT:
      handleCombatClick(x, y);
      break;
    case GameState.TARGETING:
      handleTargetingClick(x, y);
      break;
    case GameState.DEFENDING:
      handleDefendingClick(x, y);
      break;
    case GameState.DAMAGE_SOURCE:
      handleDamageSourceClick(x, y);
      break;
    case GameState.POWER_TARGETING:
      handlePowerTargetingClick(x, y);
      break;
    case GameState.POWER_CHOICE:
      handlePowerChoiceClick(x, y);
      break;
    case GameState.ALLY_TARGETING:
      handleAllyTargetingClick(x, y);
      break;
    case GameState.MULTI_TARGETING:
      handleMultiTargetingClick(x, y);
      break;
    case GameState.MODAL_SELECT:
      handleModalSelectClick(x, y);
      break;
    case GameState.SCRY_SELECT:
      handleScrySelectClick(x, y);
      break;
    case GameState.PERK_SELECT:
      handlePerkSelectClick(x, y);
      break;
    case GameState.SHOP:
      handleShopClick(x, y);
      break;
    case GameState.INVENTORY:
      handleInventoryClick(x, y);
      break;
    case GameState.SAVE_GAME:
      handleSaveClick(x, y);
      break;
    case GameState.LOAD_GAME:
      handleLoadClick(x, y);
      break;
    case GameState.VICTORY:
      // Continue encounter (epilogue text, loot, etc.)
      if (currentEncounter && !currentEncounter.isComplete) {
        currentEncounter.advancePhase();
        advanceEncounterPhase();
      } else {
        currentMap.completeCurrentNode();
        state = GameState.MAP;
      }
      break;
    case GameState.GAME_OVER:
      state = GameState.MENU;
      break;
    case GameState.HELP_SCREEN:
      handleHelpClick(x, y);
      break;
    case GameState.CODEX:
      handleCodexClick(x, y);
      break;
    case GameState.INGAME_MENU:
      handleIngameMenuClick(x, y);
      break;
    case GameState.OPTIONS_SCREEN:
      handleOptionsClick(x, y);
      break;
    case GameState.TITLE_CARD:
      dismissTitleCard();
      break;
    case GameState.CHAPTER_END:
      handleChapterEndClick(x, y);
      break;
    case GameState.DECK_TUTORIAL:
      handleDeckTutorialClick(x, y);
      break;
    case GameState.FADING:
      break;
  }
}

function handleKeyDown(key, event) {
  // Save-name editor has highest priority — once a slot is being edited on
  // the save screen, every printable key types into the name, Backspace
  // deletes, Enter commits, and Escape cancels.
  if (state === GameState.SAVE_GAME && saveEditingSlot) {
    event?.preventDefault?.();
    const shift = !!event?.shiftKey;
    const ctrl  = !!(event?.ctrlKey || event?.metaKey);
    if (key === 'Escape') { cancelSaveEditing(); return; }
    if (key === 'Enter')  { commitSaveEditing(); return; }
    // Ctrl-A: select all text.
    if (key === 'a' && ctrl) {
      saveEditingSelectAll = true;
      saveEditingAnchor = 0;
      saveEditingCursor = saveEditingName.length;
      return;
    }
    // Convert selectAll flag into anchor+cursor range before other keys.
    if (saveEditingSelectAll) {
      saveEditingAnchor = 0;
      saveEditingCursor = saveEditingName.length;
      saveEditingSelectAll = false;
    }
    // Home / End (with optional Shift to extend selection)
    if (key === 'Home') {
      saveEditingCursor = 0;
      if (!shift) saveEditingAnchor = saveEditingCursor;
      return;
    }
    if (key === 'End') {
      saveEditingCursor = saveEditingName.length;
      if (!shift) saveEditingAnchor = saveEditingCursor;
      return;
    }
    // Arrow keys with Shift (extend selection) and Ctrl (word jump)
    if (key === 'ArrowLeft') {
      if (!shift && _saveHasSelection()) {
        saveEditingCursor = _saveSelRange().start;
        saveEditingAnchor = saveEditingCursor;
      } else {
        if (!shift) saveEditingAnchor = saveEditingCursor; // collapse
        saveEditingCursor = ctrl
          ? _prevWordBoundary(saveEditingName, saveEditingCursor)
          : Math.max(0, saveEditingCursor - 1);
        if (!shift) saveEditingAnchor = saveEditingCursor;
      }
      return;
    }
    if (key === 'ArrowRight') {
      if (!shift && _saveHasSelection()) {
        saveEditingCursor = _saveSelRange().end;
        saveEditingAnchor = saveEditingCursor;
      } else {
        if (!shift) saveEditingAnchor = saveEditingCursor;
        saveEditingCursor = ctrl
          ? _nextWordBoundary(saveEditingName, saveEditingCursor)
          : Math.min(saveEditingName.length, saveEditingCursor + 1);
        if (!shift) saveEditingAnchor = saveEditingCursor;
      }
      return;
    }
    // Delete / Backspace
    if (key === 'Delete') {
      if (_saveHasSelection()) { _saveDeleteSelection(); }
      else if (saveEditingCursor < saveEditingName.length) {
        const end = ctrl ? _nextWordBoundary(saveEditingName, saveEditingCursor) : saveEditingCursor + 1;
        saveEditingName = saveEditingName.slice(0, saveEditingCursor) + saveEditingName.slice(end);
      }
      saveEditingAnchor = saveEditingCursor;
      return;
    }
    if (key === 'Backspace') {
      if (_saveHasSelection()) { _saveDeleteSelection(); }
      else if (saveEditingCursor > 0) {
        const start = ctrl ? _prevWordBoundary(saveEditingName, saveEditingCursor) : saveEditingCursor - 1;
        saveEditingName = saveEditingName.slice(0, start) + saveEditingName.slice(saveEditingCursor);
        saveEditingCursor = start;
      }
      saveEditingAnchor = saveEditingCursor;
      return;
    }
    // Printable character — replaces selection if any
    if (key.length === 1 && !ctrl) {
      if (_saveHasSelection()) _saveDeleteSelection();
      if (saveEditingName.length < 60) {
        saveEditingName = saveEditingName.slice(0, saveEditingCursor) + key + saveEditingName.slice(saveEditingCursor);
        saveEditingCursor++;
      }
      saveEditingAnchor = saveEditingCursor;
      return;
    }
    // Consume all other keys so they don't trigger game shortcuts.
    return;
  }

  // Codex search input has highest priority — when the search box is focused
  // we capture printable keys + Backspace before any other handler can
  // interpret them (otherwise typing 'c' would close the codex, etc.).
  if (state === GameState.CODEX && codexSearchActive) {
    if (key === 'Escape') {
      codexSearchActive = false;
      event?.preventDefault?.();
      return;
    }
    if (key === 'Enter') {
      codexSearchActive = false;
      event?.preventDefault?.();
      return;
    }
    if (key === 'Backspace') {
      codexSearchText = codexSearchText.slice(0, -1);
      codexScrollY = 0;
      event?.preventDefault?.();
      return;
    }
    // Single printable character (letters, digits, space, punctuation)
    if (key.length === 1 && !event?.ctrlKey && !event?.metaKey) {
      codexSearchText += key;
      codexScrollY = 0;
      event?.preventDefault?.();
      return;
    }
    // Other keys (arrows, F-keys, etc.) fall through.
  }

  if (key === 'Escape') {
    // First, handle modal/targeting states that ESC should cancel
    if (powerRechargeMode) {
      cancelPowerRecharge();
    } else if (cardRechargeMode) {
      cancelCardRecharge();
    } else if (state === GameState.MODAL_SELECT) {
      cancelModalSelect();
    } else if (state === GameState.TARGETING) {
      if (cardRechargedCards.length > 0) {
        cancelCardRecharge();
      }
      if (barrageMode) {
        cancelBarrage();
      }
      selectedCardIndex = -1;
      hideToast();
      state = GameState.COMBAT;
    } else if (state === GameState.POWER_TARGETING) {
      cancelPowerTargeting();
    } else if (state === GameState.POWER_CHOICE) {
      cancelPowerChoice();
    } else if (state === GameState.ALLY_TARGETING) {
      cancelAllyTargeting();
    } else if (state === GameState.MULTI_TARGETING) {
      cancelMultiTargeting();
    } else if (state === GameState.COMBAT && selectedCardIndex !== -1) {
      // Deselect a selected card first
      selectedCardIndex = -1;
    } else if (state === GameState.CHARACTER_SELECT) {
      // ESC = Back button -> main menu
      state = GameState.MENU;
    } else if (state === GameState.ABILITY_SELECT) {
      // ESC = Back button -> character select (only at game start, not mid-game level-up)
      if (!player) state = GameState.CHARACTER_SELECT;
    } else if (state === GameState.CODEX) {
      state = previousState || GameState.MAP;
    } else if (state === GameState.HELP_SCREEN) {
      state = previousState || GameState.MAP;
    } else if (state === GameState.INGAME_MENU) {
      // Close the menu (resume)
      state = previousState || GameState.MAP;
    } else if (state === GameState.OPTIONS_SCREEN) {
      state = optionsReturnState || GameState.MENU;
    } else if (state === GameState.SAVE_GAME || state === GameState.LOAD_GAME) {
      cancelSaveEditing(); // drop any in-progress name edit
      state = saveLoadReturnState || (player ? GameState.MAP : GameState.MENU);
    } else if (state === GameState.SHOP) {
      state = GameState.MAP;
    } else if (state === GameState.INVENTORY) {
      // Return to where we came from (combat, map, rest mode, or
      // chapter-end flow). Route through exitInventory so the
      // pendingChapter2Transition → Chapter 2 title-card hop fires.
      exitInventory();
    } else if (state === GameState.COMBAT || state === GameState.MAP || state === GameState.ENCOUNTER_TEXT || state === GameState.ENCOUNTER_CHOICE) {
      // Open in-game menu
      previousState = state;
      state = GameState.INGAME_MENU;
    }
  }
  if (key === 's' || key === 'S') {
    if (state === GameState.MAP) {
      saveLoadReturnState = GameState.MAP;
      state = GameState.SAVE_GAME;
    }
  }
  if (key === 'l' || key === 'L') {
    if (state === GameState.MAP) {
      saveLoadReturnState = GameState.MAP;
      loadTab = 'manual';
      loadSelectedIndex = -1;
      loadScrollY = 0;
      refreshLoadEntries();
      state = GameState.LOAD_GAME;
    }
  }
  if (key === 'i' || key === 'I') {
    // Allow inventory from map, combat, AND encounter screens (text, choice,
    // loot). Player can review their deck / discard during story moments.
    const canOpenInv = state === GameState.MAP ||
                       state === GameState.COMBAT ||
                       state === GameState.ENCOUNTER_TEXT ||
                       state === GameState.ENCOUNTER_CHOICE ||
                       state === GameState.ENCOUNTER_LOOT;
    if (canOpenInv) {
      previousState = state;
      state = GameState.INVENTORY;
    } else if (state === GameState.INVENTORY && !restMode) {
      exitInventory();
    }
  }
  if (key === '`') {
    debugMode = !debugMode;
    addLog(`Debug mode ${debugMode ? 'ON' : 'OFF'}`, debugMode ? Colors.GREEN : Colors.GRAY);
  }
  if (key === 'h' || key === 'H') {
    if (state === GameState.HELP_SCREEN) {
      state = previousState || GameState.MAP;
    } else if (state === GameState.COMBAT || state === GameState.MAP ||
               state === GameState.MENU || state === GameState.CHARACTER_SELECT) {
      previousState = state;
      helpScrollY = 0;
      state = GameState.HELP_SCREEN;
    }
  }
  // Codex (debug-only): browse every card / power / character at any size.
  if ((key === 'c' || key === 'C') && debugMode && !event?.ctrlKey) {
    if (state === GameState.CODEX) {
      state = previousState || GameState.MAP;
    } else {
      previousState = state;
      codexScrollY = 0;
      codexSelectedCard = null;
      state = GameState.CODEX;
    }
  }
  // Arrow-key map navigation: pick the accessible connected node whose path
  // best matches the pressed direction (up/down/left/right), then move.
  if (state === GameState.MAP &&
      (key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight')) {
    if (event && typeof event.preventDefault === 'function') event.preventDefault();
    const dir = key === 'ArrowUp' ? 'up'
      : key === 'ArrowDown' ? 'down'
      : key === 'ArrowLeft' ? 'left' : 'right';
    const target = pickMapNodeInDirection(dir);
    if (target) moveToMapNode(target);
  }
}

// ============================================================
// MENU
// ============================================================
const menuButtons = [];

function handleMenuClick(x, y) {
  for (const btn of menuButtons) {
    if (hitTest(x, y, btn)) { btn.action(); return; }
  }
}

function startNewGame() {
  player = null;
  currentMap = null;
  currentEncounter = null;
  // Reset story flags so a fresh run doesn't inherit kitchen/barrel state
  // from a previous save-state snapshot.
  kitchenChoiceMade = null;
  prisonBarrelLooted = false;
  state = GameState.CHARACTER_SELECT;
}

function drawMenu() {
  if (images.menu_bg) {
    ctx.drawImage(images.menu_bg, 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  } else {
    ctx.fillStyle = '#0e0e14';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  }

  // Semi-transparent black panel behind title and buttons
  const panelW = 540;
  const panelH = 540;
  const panelX = (SCREEN_WIDTH - panelW) / 2;
  const panelY = 130;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.fillRect(panelX, panelY, panelW, panelH);

  // Title with shadow
  ctx.shadowColor = 'rgba(0,0,0,0.9)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = Colors.GOLD;
  ctx.font = 'bold 72px serif';
  ctx.textAlign = 'center';
  ctx.fillText('ccgQuest', SCREEN_WIDTH / 2, 230);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Subtitle
  ctx.fillStyle = '#e8d59a';
  ctx.font = 'italic 22px serif';
  ctx.fillText('A Collectible Card Game RPG', SCREEN_WIDTH / 2, 270);

  // Version number
  ctx.fillStyle = Colors.GRAY;
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`v${GAME_VERSION}`, 10, 22);

  menuButtons.length = 0;

  // Styled buttons with sprite art
  const btnW = 400;
  const btnH = 88;
  const btnX = (SCREEN_WIDTH - btnW) / 2;
  let btnY = 340;

  // New Game button (uses PlayButton sprite with "PLAY" baked in)
  drawStyledButton(btnX, btnY, btnW, btnH, 'New Game', startNewGame, 'play');
  btnY += 110;

  // Load Game button (always visible, uses ButtonLarge wooden plank)
  const hasSaves = hasAnySave();
  if (hasSaves) {
    drawStyledButton(btnX, btnY, btnW, btnH, 'Load Game', () => {
      saveLoadReturnState = GameState.MENU;
      loadTab = 'manual';
      loadSelectedIndex = -1;
      refreshLoadEntries();
      state = GameState.LOAD_GAME;
    }, 'large');
  } else {
    // Disabled state: render sprite at lower opacity, no click handler
    ctx.globalAlpha = 0.45;
    drawStyledButton(btnX, btnY, btnW, btnH, 'Load Game', null, 'large');
    ctx.globalAlpha = 1;
    // Remove the click handler we just registered
    menuButtons.pop();
  }

  // Options button (bottom-left)
  const optW = 200, optH = 50;
  const optX = 20, optY = SCREEN_HEIGHT - optH - 20;
  drawStyledButton(optX, optY, optW, optH, 'Options', () => {
    optionsReturnState = GameState.MENU;
    state = GameState.OPTIONS_SCREEN;
  }, 'large', 18);

  // Help icon button (bottom-right, same icon as combat H button)
  const helpRect = { x: SCREEN_WIDTH - 52, y: SCREEN_HEIGHT - 52, w: 36, h: 36 };
  drawIconButton(helpRect, 'icon_help', () => {
    previousState = state; helpScrollY = 0; state = GameState.HELP_SCREEN;
  }, 'H');

  ctx.textAlign = 'left';
}

function drawButton(x, y, w, h, text, action) {
  const hovered = hitTest(mouseX, mouseY, { x, y, w, h });
  ctx.fillStyle = hovered ? '#4a3a6e' : '#2a1a4e';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = hovered ? Colors.GOLD : Colors.GRAY;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = hovered ? Colors.GOLD : Colors.WHITE;
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + w / 2, y + h / 2);
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  menuButtons.push({ x, y, w, h, action });
}

// Draw a styled button using sprite art (ButtonLarge, PlayButton, BannerLarge)
function drawStyledButton(x, y, w, h, text, action, style = 'large', fontSize = 26) {
  const hovered = hitTest(mouseX, mouseY, { x, y, w, h });
  let sprite = null;
  if (style === 'play') sprite = images.btn_play;
  else if (style === 'large') sprite = images.btn_large;
  else if (style === 'banner') sprite = images.banner_large;
  else if (style === 'small') sprite = images.banner_small;

  if (sprite) {
    ctx.drawImage(sprite, x, y, w, h);
    if (hovered) {
      // Brighten on hover
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.15;
      ctx.drawImage(sprite, x, y, w, h);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
  } else {
    // Fallback
    ctx.fillStyle = hovered ? '#5a4a7e' : '#3a2a5e';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = Colors.GOLD;
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);
  }

  // Text overlay (skip for play style which has text baked in)
  if (text && style !== 'play') {
    ctx.fillStyle = hovered ? Colors.GOLD : Colors.WHITE;
    ctx.font = `bold ${fontSize}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Subtle drop shadow
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 2;
    ctx.fillText(text, x + w / 2, y + h / 2);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
  }
  menuButtons.push({ x, y, w, h, action });
}

// ============================================================
// CHARACTER SELECT
// ============================================================
const CLASS_INFO = [
  { name: 'Paladin', color: '#8b6914', desc: 'Holy warrior with healing' },
  { name: 'Ranger', color: '#2e7d32', desc: 'Skilled archer with companions' },
  { name: 'Wizard', color: '#1565c0', desc: 'Arcane wizard with spells' },
  { name: 'Rogue', color: '#616161', desc: 'Cunning assassin with poison' },
  { name: 'Warrior', color: '#c62828', desc: 'Heavy fighter with battle fury' },
  { name: 'Druid', color: '#33691e', desc: 'Nature shapeshifter' },
];

function getClassRects() {
  const cols = 3, cardW = 200, cardH = 280, gap = 30;
  const startX = (SCREEN_WIDTH - (cols * cardW + (cols - 1) * gap)) / 2;
  const startY = 160;
  return CLASS_INFO.map((cls, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    return {
      x: startX + col * (cardW + gap),
      y: startY + row * (cardH + gap),
      w: cardW, h: cardH, ...cls,
    };
  });
}

function handleCharSelectClick(x, y) {
  // Back button
  const backBtn = { x: 40, y: SCREEN_HEIGHT - 100, w: 200, h: 70 };
  if (hitTest(x, y, backBtn)) {
    state = GameState.MENU;
    return;
  }
  // Help icon button (bottom-right)
  const helpBtn = { x: SCREEN_WIDTH - 52, y: SCREEN_HEIGHT - 52, w: 36, h: 36 };
  if (hitTest(x, y, helpBtn)) {
    previousState = state;
    helpScrollY = 0;
    state = GameState.HELP_SCREEN;
    return;
  }

  for (const r of getClassRects()) {
    if (hitTest(x, y, r)) {
      selectClass(r.name);
      return;
    }
  }
}

function selectClass(className) {
  selectedClass = className;
  abilityChoices = getAbilityChoices(className, 3);
  state = GameState.ABILITY_SELECT;
}

function startGameWithAbility(ability) {
  // Create player with starter deck + chosen ability
  player = new Character(selectedClass);
  player.deck = new Deck();
  const deckFns = {
    Paladin: getPaladinStarterDeck,
    Ranger: getRangerStarterDeck,
    Wizard: getWizardStarterDeck,
    Rogue: getRogueStarterDeck,
    Warrior: getWarriorStarterDeck,
    Druid: getDruidStarterDeck,
  };
  const cards = deckFns[selectedClass]();
  for (const c of cards) player.deck.addCard(c);
  player.deck.addCard(ability);
  // Add class power
  const power = getClassPower(selectedClass);
  player.addPower(power);

  // Initialize map
  currentMap = createPrisonCellMap();
  visitedNodes = new Set();
  gold = 0;
  backpack = [];

  // Show title card then start first encounter
  showTitleCard('Part 1: The White Claw', '', () => {
    startNodeEncounter('bed');
  });
}

function drawCharacterSelect() {
  if (images.char_select_bg) {
    ctx.drawImage(images.char_select_bg, 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  } else {
    ctx.fillStyle = '#0e0e14';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  }

  // Title banner (BannerLarge sprite with the header text centered on it)
  const titleBannerW = 640;
  const titleBannerH = 110;
  const titleBannerX = (SCREEN_WIDTH - titleBannerW) / 2;
  const titleBannerY = 30;
  if (images.banner_large) {
    ctx.drawImage(images.banner_large, titleBannerX, titleBannerY, titleBannerW, titleBannerH);
  } else {
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(titleBannerX, titleBannerY, titleBannerW, titleBannerH);
    ctx.strokeStyle = Colors.GOLD;
    ctx.lineWidth = 2;
    ctx.strokeRect(titleBannerX, titleBannerY, titleBannerW, titleBannerH);
  }
  ctx.save();
  // Strong drop shadow: same style as card names so text consistently floats.
  ctx.shadowColor = 'rgba(0,0,0,0.95)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 3;
  ctx.fillStyle = Colors.GOLD;
  ctx.font = 'bold 44px serif';
  ctx.textAlign = 'center';
  ctx.fillText('Choose Your Class', SCREEN_WIDTH / 2, titleBannerY + titleBannerH / 2 + 12);
  ctx.restore();

  const classArtIds = {
    Paladin: 'paladin_class', Ranger: 'ranger_class', Wizard: 'wizard_class',
    Rogue: 'rogue_class', Warrior: 'warrior_class', Druid: 'druid_class',
  };

  const artShift = 10; // push hero art down further so the top filigree clears faces/heads
  const nameBarH = 92;  // was 70 — adds ~1 line of vertical room so the frame's bottom
                        // filigree doesn't chew into the Class Name / description text.
  for (const r of getClassRects()) {
    const hovered = hitTest(mouseX, mouseY, r);
    const art = getCardArt(classArtIds[r.name]);

    // 1. Art — shifted down `artShift` px, clipped to the card rect so the
    // overflow at the bottom doesn't spill past the card.
    ctx.save();
    ctx.beginPath();
    ctx.rect(r.x, r.y, r.w, r.h);
    ctx.clip();
    if (art) {
      const imgAspect = art.width / art.height;
      const cardAspect = r.w / r.h;
      let sx = 0, sy = 0, sw = art.width, sh = art.height;
      if (imgAspect > cardAspect) { sw = art.height * cardAspect; sx = (art.width - sw) / 2; }
      else { sh = art.width / cardAspect; sy = (art.height - sh) / 2; }
      ctx.globalAlpha = hovered ? 1 : 0.85;
      ctx.drawImage(art, sx, sy, sw, sh, r.x, r.y + artShift, r.w, r.h);
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = hovered ? r.color : '#2a1a4e';
      ctx.globalAlpha = hovered ? 0.9 : 0.75;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    // 2. Description / name bar at bottom — drawn BEFORE the frame so the
    // frame's bottom filigree sits on top of the bar. The top-edge stroke
    // matches the class-tinted frame so the bar reads as part of the theme.
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(r.x, r.y + r.h - nameBarH, r.w, nameBarH);
    ctx.strokeStyle = hovered ? Colors.GOLD : getFrameAccentColorFromHex(r.color);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(r.x, r.y + r.h - nameBarH);
    ctx.lineTo(r.x + r.w, r.y + r.h - nameBarH);
    ctx.stroke();

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = hovered ? Colors.GOLD : Colors.WHITE;
    ctx.font = 'bold 24px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle'; // Y coord is the vertical CENTER of the text
    // Class name: fixed near the top of the name bar so it sits in the same
    // place whether the description takes 1 or 2 lines.
    ctx.fillText(r.name, r.x + r.w / 2, r.y + r.h - 74);
    ctx.restore();

    // Description: wrap to at most 2 lines. Longer descriptions (e.g. "Skilled
    // archer with companions") no longer clip off the right edge.
    ctx.font = '14px sans-serif';
    const descLines = wrapText(r.desc, r.w - 20, 14).slice(0, 2);
    ctx.fillStyle = '#e0e0e0';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (descLines.length === 1) {
      ctx.fillText(descLines[0], r.x + r.w / 2, r.y + r.h - 36);
    } else {
      ctx.fillText(descLines[0], r.x + r.w / 2, r.y + r.h - 46);
      ctx.fillText(descLines[1], r.x + r.w / 2, r.y + r.h - 26);
    }
    ctx.textBaseline = 'alphabetic';

    // 3. Ornate 9-slice frame on top of art + name bar, tinted by class color.
    const frameImg = images.frame_common;
    if (frameImg) {
      const corner = CARD_FRAME_CORNERS.frame_common || 24;
      const scaledCorner = Math.max(8, Math.min(corner, Math.floor(Math.min(r.w, r.h) * 0.11)));
      const tinted = getTintedFrameImage(frameImg, 'frame_common', r.color);
      draw9SliceFrame(tinted, r.x, r.y, r.w, r.h, scaledCorner);
      if (hovered) {
        ctx.save();
        ctx.strokeStyle = Colors.GOLD;
        ctx.lineWidth = 3;
        ctx.shadowColor = Colors.GOLD;
        ctx.shadowBlur = 16;
        ctx.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
        ctx.restore();
      }
    } else {
      ctx.strokeStyle = hovered ? Colors.GOLD : '#888';
      ctx.lineWidth = hovered ? 4 : 2;
      ctx.strokeRect(r.x, r.y, r.w, r.h);
    }
  }

  // Back button
  const backBtn = { x: 40, y: SCREEN_HEIGHT - 100, w: 200, h: 70 };
  menuButtons.length = menuButtons.length; // keep menuButtons in scope
  drawStyledButton(backBtn.x, backBtn.y, backBtn.w, backBtn.h, '< Back', () => { state = GameState.MENU; }, 'large', 22);

  // Help icon button (bottom-right, same icon as combat H button)
  const helpRect = { x: SCREEN_WIDTH - 52, y: SCREEN_HEIGHT - 52, w: 36, h: 36 };
  drawIconButton(helpRect, 'icon_help', () => {
    previousState = state; helpScrollY = 0; state = GameState.HELP_SCREEN;
  }, 'H');

  ctx.textAlign = 'left';
}

// ============================================================
// ABILITY SELECT
// ============================================================

function getAbilityCardRects() {
  const cardW = 240;
  const cardH = 340;
  const gap = 40;
  const count = abilityChoices.length;
  const totalW = count * cardW + (count - 1) * gap;
  const startX = (SCREEN_WIDTH - totalW) / 2;
  const y = 180;
  return abilityChoices.map((_, i) => ({
    x: startX + i * (cardW + gap), y, w: cardW, h: cardH,
  }));
}

function handleAbilitySelectClick(x, y) {
  // Back button (matches character select style) — not shown in shrine mode
  // or during the chapter-end level-up (the player must pick an ability to
  // continue, there's no "back" to go to).
  if (!shrineAbilityMode && !pendingChapter2Transition) {
    const backBtn = { x: 40, y: SCREEN_HEIGHT - 100, w: 200, h: 70 };
    if (hitTest(x, y, backBtn)) {
      state = GameState.CHARACTER_SELECT;
      return;
    }
  }

  const rects = getAbilityCardRects();
  for (let i = 0; i < rects.length; i++) {
    if (hitTest(x, y, rects[i])) {
      if (shrineAbilityMode) {
        // Lost Shrine: add the chosen card to master deck and place a copy in hand
        // (overflowing to the top of the draw pile if the hand is full).
        const ability = abilityChoices[i];
        player.deck.addCard(ability); // adds original to masterDeck only
        const copy = ability.copy();
        if (player.deck.hand.length < MAX_HAND_SIZE) {
          player.deck.hand.push(copy);
          addLog(`The shrine bestows ${ability.name} (added to hand).`, Colors.GOLD);
        } else {
          player.deck.drawPile.unshift(copy);
          addLog(`The shrine bestows ${ability.name} (top of deck — hand is full).`, Colors.GOLD);
        }
        shrineAbilityMode = false;
        abilityChoices = [];
        state = GameState.MAP;
        autosaveNow();
        return;
      }
      if (player) {
        // Level-up ability selection (mid-game) — add to deck then rebalance
        const ability = abilityChoices[i];
        player.deck.addCard(ability);
        player.level++;
        // Rebalance: merge everything, heal all, shuffle, draw fresh hand
        player.deck.rebalance(getPlayerHandSize(), MAX_HAND_SIZE);
        addLog(`Level Up! Gained ${ability.name}. Level ${player.level}.`, Colors.GOLD);
        // Upgrade companions at level 3+
        if (player.level >= 3) upgradeCompanions();
        // If level 2+, offer perk selection
        if (player.level >= 2) {
          perkChoices = getPerkChoices(player.perks, 2, selectedClass, 1);
          state = GameState.PERK_SELECT;
        } else {
          // Return to encounter
          if (currentEncounter && !currentEncounter.isComplete) {
            currentEncounter.advancePhase();
            advanceEncounterPhase();
          } else {
            state = GameState.MAP;
          }
        }
      } else {
        // Initial game start
        startGameWithAbility(abilityChoices[i]);
      }
      return;
    }
  }
}

function drawAbilitySelect() {
  // During chapter-end level-up, use the leaving-prison backdrop instead
  // of the character-select one. Otherwise default to char_select_bg.
  const abilityBg = pendingChapter2Transition
    ? getEncounterBgImage('bg_leaving_prison')
    : images.char_select_bg;
  if (abilityBg) {
    ctx.drawImage(abilityBg, 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  } else {
    ctx.fillStyle = '#0e0e14';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  }

  ctx.fillStyle = Colors.GOLD;
  ctx.font = 'bold 36px serif';
  ctx.textAlign = 'center';
  let titleText;
  if (shrineAbilityMode) titleText = "The Shrine's Blessing";
  else if (pendingChapter2Transition) titleText = 'Level Up! Choose a New Ability';
  else titleText = 'Choose Your Starting Ability';
  ctx.fillText(titleText, SCREEN_WIDTH / 2, 80);

  ctx.fillStyle = '#e0e0e0';
  ctx.font = '20px sans-serif';
  let subtitleText;
  if (shrineAbilityMode) subtitleText = `${selectedClass} — Choose one card. It joins your hand immediately.`;
  else if (pendingChapter2Transition) subtitleText = `${selectedClass} — Pick a new ability to add to your deck`;
  else subtitleText = `${selectedClass} — Pick one ability card to add to your deck`;
  ctx.fillText(subtitleText, SCREEN_WIDTH / 2, 120);

  const rects = getAbilityCardRects();
  let hoveredAbilityIdx = -1;
  for (let i = 0; i < abilityChoices.length; i++) {
    const card = abilityChoices[i];
    const r = rects[i];
    const hovered = hitTest(mouseX, mouseY, r);
    drawCard(card, r.x, r.y, r.w, r.h, hovered, hovered, 'full');

    if (hovered) {
      hoveredAbilityIdx = i;
      ctx.fillStyle = Colors.GOLD;
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Click to select', r.x + r.w / 2, r.y + r.h + 18);
    }
  }

  // If the hovered ability has a previewCard or previewCreature, show a small
  // mini-card preview to the right of the hovered card (matches in-combat hover).
  if (hoveredAbilityIdx >= 0) {
    const card = abilityChoices[hoveredAbilityIdx];
    const r = rects[hoveredAbilityIdx];
    if (card.previewCard || card.previewCreature) {
      const sideW = COMBAT_POWER_W;
      const sideH = COMBAT_POWER_H;
      const gap = 10;
      let sx = r.x + r.w + gap;
      // Flip to the left if it would go off-screen
      if (sx + sideW > SCREEN_WIDTH - 10) {
        sx = r.x - sideW - gap;
      }
      const sy = r.y + Math.floor((r.h - sideH) / 2);
      if (card.previewCard) {
        drawCard(card.previewCard, sx, sy, sideW, sideH, false, false);
      } else if (card.previewCreature) {
        // Stamp source rarity + subtype so the creature mini matches the
        // card's frame asset AND tint (purple for ability, blue for armor,
        // brown for ally, etc.).
        card.previewCreature._sourceRarity = card.rarity || 'common';
        card.previewCreature._sourceSubtype = card.subtype || '';
        drawCreatureMiniCard(card.previewCreature, { x: sx, y: sy, w: sideW, h: sideH }, true);
      }
    }
  }

  // Back button (matches character select style) — hidden in shrine mode
  // and in the chapter-end level-up flow (mandatory pick).
  if (!shrineAbilityMode && !pendingChapter2Transition) {
    drawStyledButton(40, SCREEN_HEIGHT - 100, 200, 70, '< Back', () => { state = GameState.CHARACTER_SELECT; }, 'large', 22);
  }

  ctx.textAlign = 'left';
}

// ============================================================
// MAP
// ============================================================

function getMapTransform(area) {
  const mapImg = images[`map_${area}`];
  let scale = 1, offX = 0, offY = 0;
  if (mapImg) {
    scale = Math.min(SCREEN_WIDTH / mapImg.width, SCREEN_HEIGHT / mapImg.height);
    const drawW = mapImg.width * scale;
    const drawH = mapImg.height * scale;
    offX = Math.floor((SCREEN_WIDTH - drawW) / 2);
    offY = Math.floor((SCREEN_HEIGHT - drawH) / 2);
  }
  return {
    scale, offX, offY,
    toScreen: (pos) => ({
      x: Math.round(offX + pos[0] * scale),
      y: Math.round(offY + pos[1] * scale),
    }),
  };
}

function getMapNodeRects() {
  if (!currentMap) return [];
  const currentArea = currentMap.getCurrentNode()?.mapArea || '';
  const { toScreen } = getMapTransform(currentArea);
  const rects = [];
  for (const [id, node] of Object.entries(currentMap.nodes)) {
    if (node.mapArea !== currentArea) continue;
    const { x: nx, y: ny } = toScreen(node.position);
    rects.push({ x: nx - 18, y: ny - 18, w: 36, h: 36, nodeId: id, node });
  }
  return rects;
}

// Pick the best connected, accessible node to move to in a given arrow direction.
// Direction is one of 'up' | 'down' | 'left' | 'right'.
// Returns a node (or null if nothing matches).
//
// How this works: for each accessible connection, we take the vector from the
// current node to the candidate (image-space coords; +y points down). We split
// candidates into primary axes by picking the axis whose delta is larger in
// magnitude — that's the direction the path is "mostly" going. Ties favor the
// horizontal (the map tends to have wider corridors than vertical drops).
// Among candidates that match the requested direction we pick the most-aligned
// one — i.e. the smallest perpendicular drift relative to the primary delta.
function pickMapNodeInDirection(direction) {
  if (!currentMap) return null;
  const current = currentMap.getCurrentNode();
  if (!current) return null;
  const [cx, cy] = current.position;
  let best = null;
  let bestScore = Infinity;
  for (const connId of current.connections) {
    const node = currentMap.getNode(connId);
    if (!node) continue;
    if (node.mapArea !== current.mapArea) continue;
    if (node.isLocked) continue;
    const [nx, ny] = node.position;
    const dx = nx - cx;
    const dy = ny - cy;
    const adx = Math.abs(dx), ady = Math.abs(dy);
    // Primary axis of this connection (>= ties horizontal so roughly-diagonal paths
    // respond to LEFT/RIGHT rather than UP/DOWN — matches most map layouts).
    const horizontal = adx >= ady;
    let matches = false;
    switch (direction) {
      case 'right': matches = horizontal && dx > 0; break;
      case 'left':  matches = horizontal && dx < 0; break;
      case 'down':  matches = !horizontal && dy > 0; break;
      case 'up':    matches = !horizontal && dy < 0; break;
    }
    if (!matches) continue;
    // Score: lower = better match. Use the perpendicular drift (how off-axis the
    // path points). Shorter paths tie-break slightly in favor of nearer nodes.
    const perp = (direction === 'up' || direction === 'down') ? adx : ady;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const score = perp * 1000 + dist; // perp dominates; dist breaks ties
    if (score < bestScore) {
      bestScore = score;
      best = node;
    }
  }
  return best;
}

// Is this node's passthrough teleport currently enabled? The kitchen/upward
// corridor only fast-travels AFTER the player committed to one of the three
// kitchen choices (attack / talk / sneak) — "Leave" doesn't count.
function passthroughEnabledFor(node) {
  if (!node || !node.passthroughTo) return false;
  if (node.id === 'kitchen' || node.id === 'less_deep_sewer') {
    return !!kitchenChoiceMade;
  }
  return true;
}

// Map movement animation state. While animating, the green party circle
// lerps from the old node position to the new one. Clicks are blocked
// until the animation completes.
let mapMoveAnim = null; // { fromPos, toPos, elapsed, duration, destNodeId, callback }

function moveToMapNode(node) {
  if (!node || !currentMap) return;
  if (node.isLocked) return;
  if (mapMoveAnim) return; // already animating
  const current = currentMap.getCurrentNode();
  if (!current || !current.connections.includes(node.id)) return;

  // Compute animation duration from distance (longer path = longer walk).
  const [cx, cy] = current.position;
  const [nx, ny] = node.position;
  const dist = Math.sqrt((nx - cx) ** 2 + (ny - cy) ** 2);
  const speedMul = runFast ? 0.5 : 1;
  const duration = Math.max(150, Math.min(1200, dist * 1.8 * speedMul));

  if (node.isDone && !node.canRevisit) {
    // Silent move (done node, possibly passthrough).
    const target = node.passthroughTo ? currentMap.getNode(node.passthroughTo) : null;
    if (passthroughEnabledFor(node) && target && !target.isLocked && node.passthroughTo !== current.id) {
      // Passthrough: animate to the intermediate node, then instantly hop
      // to the passthrough target.
      mapMoveAnim = {
        fromPos: current.position, toPos: node.position,
        elapsed: 0, duration,
        destNodeId: node.passthroughTo,
        callback: null,
      };
    } else {
      mapMoveAnim = {
        fromPos: current.position, toPos: node.position,
        elapsed: 0, duration,
        destNodeId: node.id,
        callback: null,
      };
    }
  } else {
    // Move + start encounter on arrival.
    mapMoveAnim = {
      fromPos: current.position, toPos: node.position,
      elapsed: 0, duration,
      destNodeId: node.id,
      callback: () => startNodeEncounter(node.id),
    };
  }
}

function updateMapMoveAnim(dt) {
  if (!mapMoveAnim) return;
  mapMoveAnim.elapsed += dt;
  if (mapMoveAnim.elapsed >= mapMoveAnim.duration) {
    // Animation complete — commit the move.
    currentMap.currentNodeId = mapMoveAnim.destNodeId;
    const cb = mapMoveAnim.callback;
    mapMoveAnim = null;
    if (cb) cb();
  }
}

function handleMapClick(x, y) {
  if (mapMoveAnim) return; // block clicks while animating
  const rects = getMapNodeRects();
  for (const r of rects) {
    if (!hitTest(x, y, r)) continue;
    const node = r.node;

    // Clicking current node
    if (r.nodeId === currentMap.currentNodeId) {
      if (node.encounterId && (!node.isDone || node.canRevisit)) {
        startNodeEncounter(r.nodeId);
      } else if (node.isDone && node.passthroughTo && passthroughEnabledFor(node)) {
        const target = currentMap.getNode(node.passthroughTo);
        if (target && !target.isLocked) {
          currentMap.currentNodeId = node.passthroughTo;
        }
      }
      return;
    }

    // Clicking connected node — animate the move
    const current = currentMap.getCurrentNode();
    if (!current.connections.includes(r.nodeId)) continue;
    if (node.isLocked) continue;
    moveToMapNode(node);
    return;
  }
}

// Encounter ID → background image key mapping
const ENCOUNTER_BG_MAP = {
  // Prison
  giant_rat: 'bg_prison', locked_door: 'bg_prison', bone_pile: 'bg_prison',
  crack: 'bg_prison', prison_entrance: 'bg_prison_entrance', prison_wing: 'bg_prison_wing',
  corner_cell: 'bg_prison', kitchen: 'bg_kitchen', leave_prison: 'bg_prison_entrance',
  // Sewers
  splash_point: 'bg_sewer', dead_end: 'bg_sewer', tight_opening: 'bg_sewer',
  sewer_junction: 'bg_sewer', abandoned_camp: 'bg_sewer_camp', lost_shrine: 'bg_lost_shrine',
  upward_passage: 'bg_sewer',
  // Mountain
  mountain_camp: 'bg_leaving_prison', mountain_pass: 'bg_mountain_pass',
  calm_stream: 'bg_small_stream', general_zhost: 'bg_kobold_bridge',
  calm_grove: 'bg_calm_grove', to_the_plains: 'bg_mountain_overlook',
  // Plains / Cave
  bone_valley: 'bg_bone_valley', wolf_blizzard: 'bg_wolf_blizzard',
  cave_entrance: 'bg_cave_entrance', cave_ledge: 'bg_the_ledge',
  cave_river_landing: 'bg_cave_river', underground_river: 'bg_cave_river',
  // Ruins
  piranha_pool: 'bg_cave_waterfall', sahuagin_sentinel: 'bg_temple_pool',
  pool_south: 'bg_temple_pool', pool_exit: 'bg_temple_pool',
  conservatory_wing: 'bg_flood_temple', flooded_passage: 'bg_flood_temple',
  dark_corridor: 'bg_flood_temple', passage_ambush: 'bg_flood_temple',
  cave_exit: 'bg_cave_entrance',
  // City
  river_crossing: 'bg_river_crossing', south_gate: 'bg_south_gate',
  city_square: 'bg_qualibaf', weaponsmith: 'bg_smith', armorsmith: 'bg_smith',
  general_store: 'bg_general_store', inn: 'bg_inn', church: 'bg_church',
  arcane_emporium: 'bg_arcane_emporium', city_north_gate: 'bg_qualibaf',
  guild_hall: 'bg_guild_hall',
  // North / Forest
  north_crossroad: 'bg_north_crossroad', filibaf_entrance: 'bg_filibaf_entrance',
  forest_shadows: 'bg_filibaf_entrance', forest_ambush_left: 'bg_filibaf_entrance',
  forest_ambush_right: 'bg_filibaf_entrance',
  // Tharnag
  tharnag_arrival: 'bg_tharnag_siege', siege_gauntlet_1: 'bg_tharnag_siege',
  siege_gauntlet_2: 'bg_tharnag_siege', siege_gauntlet_3: 'bg_tharnag_siege',
  siege_gauntlet_dialog: 'bg_tharnag_siege', tharnag_side_door: 'bg_tharnag_siege',
  grand_hall_arrival: 'bg_tharnag_quarters', dwarven_tavern: 'bg_dwarven_tavern',
  dwarven_smithy: 'bg_dwarven_smithy',
  // Volcano / Wastes
  volcano_arrival: 'bg_obsidian_wastes', volcano_choice: 'bg_heart_volcano',
  obsidian_wastes_arrival: 'bg_obsidian_wastes', wastes_north: 'bg_obsidian_wastes',
  // Dwarven City
  entry_corridor_arrival: 'bg_obsidian_wastes', corridor_gate_approach: 'bg_obsidian_wastes',
  ruga_slave_master: 'bg_obsidian_wastes', throne_specter: 'bg_obsidian_wastes',
  artisan_workshop: 'bg_dwarven_smithy',
};

// Lazy-load encounter background images
const encounterBgImages = {};
const ENCOUNTER_BG_FILES = {
  bg_prison: 'PrisonBackground.jpg', bg_prison_entrance: 'PrisonEntranceBackground.jpg',
  bg_prison_wing: 'PrisonWingBackground.jpg', bg_kitchen: 'PrisonKitchenBackground.jpg',
  bg_leaving_prison: 'LeavingPrisonBackground.jpg',
  bg_sewer: 'SewerBackground.jpg', bg_sewer_camp: 'SewereCampBackground.jpg',
  bg_lost_shrine: 'LostShrineBackground.jpg',
  bg_mountain_pass: 'MountainPass.jpg', bg_small_stream: 'SmallStream.jpg',
  bg_kobold_bridge: 'KoboldBridgeBackground.jpg', bg_calm_grove: 'CalmGrove.jpg',
  bg_mountain_overlook: 'MountainOverlook.jpg',
  bg_bone_valley: 'BoneValley.jpg', bg_wolf_blizzard: 'WolfInBlizzardBackground.jpg',
  bg_cave_entrance: 'CaveEntrance.jpg', bg_the_ledge: 'TheLedge.jpg',
  bg_cave_river: 'CaveRiverBackground.jpg', bg_cave_waterfall: 'CaveWaterfall.jpg',
  bg_temple_pool: 'TemplePool.jpg', bg_flood_temple: 'FloorTempleAltar.jpg',
  bg_river_crossing: 'RiverCrossing.jpg', bg_south_gate: 'SouthGate.jpg',
  bg_qualibaf: 'QualibafBackground.jpg', bg_smith: 'SmithBackground.jpg',
  bg_general_store: 'GeneralStoreBackground.jpg', bg_inn: 'InnBackground.jpg',
  bg_church: 'ChurchBackground.jpg', bg_arcane_emporium: 'ArcaneEmporium.jpg',
  bg_guild_hall: 'GuildHallBackground.jpg', bg_north_crossroad: 'NorthCrossRoadBG.jpg',
  bg_filibaf_entrance: 'FilibafEntranceBackground.jpg',
  bg_tharnag_siege: 'TharnagSiegeBackground.jpg', bg_tharnag_quarters: 'TharnagPersonalQuartersBG.jpg',
  bg_dwarven_tavern: 'DwarvenTavenBG.jpg', bg_dwarven_smithy: 'DwarvenSmithyBG.jpg',
  bg_obsidian_wastes: 'ObsidianWastesBG.jpg', bg_heart_volcano: 'HeartOfTheVolcanoBG.jpg',
  bg_obsidian_forge: 'ObsidianForgeBG.jpg',
};

function getEncounterBgImage(bgKey) {
  if (encounterBgImages[bgKey]) return encounterBgImages[bgKey];
  const filename = ENCOUNTER_BG_FILES[bgKey];
  if (!filename) return null;
  // Lazy load
  const img = new Image();
  img.onload = () => { encounterBgImages[bgKey] = img; };
  img.src = `${BASE}assets/Backgrounds/${filename}`;
  encounterBgImages[bgKey] = null; // mark as loading
  return null;
}

function getEncounterBg() {
  // 1. Check encounter-specific background
  if (currentEncounter) {
    const bgKey = ENCOUNTER_BG_MAP[currentEncounter.id];
    if (bgKey) {
      const img = getEncounterBgImage(bgKey);
      if (img) return img;
    }
  }
  // 2. Fall back to map area image
  if (currentMap) {
    const node = currentMap.getCurrentNode();
    if (node) {
      const areaImg = images[`map_${node.mapArea}`];
      if (areaImg) return areaImg;
    }
  }
  return images.combat_bg || null;
}

function drawEncounterBg() {
  const bg = getEncounterBg();
  if (bg) {
    ctx.drawImage(bg, 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  } else {
    ctx.fillStyle = '#0e0e14';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  }
}

function transitionToMap(mapCreator, startNode) {
  currentMap = mapCreator();
  visitedNodes = new Set();
  startNodeEncounter(startNode);
}

function startNodeEncounter(nodeId) {
  currentMap.currentNodeId = nodeId;
  const node = currentMap.getNode(nodeId);
  visitedNodes.add(nodeId);

  // Upward Passage skip: once the player has made any Kitchen choice, they
  // already know where this passage leads — don't make them sit through the
  // "the tunnel slopes upward" dialog again. Just mark it done so clicking
  // it in the future routes through the normal passthrough logic.
  if (nodeId === 'less_deep_sewer' && kitchenChoiceMade) {
    currentMap.completeCurrentNode();
    state = GameState.MAP;
    return;
  }

  if (!node.encounterId || !ENCOUNTER_REGISTRY[node.encounterId]) {
    // No encounter defined — just mark done and stay on map
    currentMap.completeCurrentNode();
    state = GameState.MAP;
    return;
  }

  // A few encounter factories want context when instantiated (e.g. the
  // Leave Prison encounter branches on whether Thorb has been rescued).
  // Pass that context via the args below.
  const factory = ENCOUNTER_REGISTRY[node.encounterId];
  if (node.encounterId === 'leave_prison') {
    const cc = currentMap.getNode('corner_cell');
    const thorbRescued = !!(cc && cc.isDone);
    currentEncounter = factory(thorbRescued);
  } else {
    currentEncounter = factory();
  }

  // Dormant-node check: if the node has persisted exhaustedChoices from a
  // previous visit (e.g. Abandoned Camp where the player already rested and
  // searched), and every non-leave choice in the encounter is now exhausted,
  // skip the dialog entirely and mark the node done. This happens on reload
  // when the save restored exhaustedChoices but the encounter re-instantiates.
  const persisted = Array.isArray(node.exhaustedChoices) ? node.exhaustedChoices : [];
  if (persisted.length > 0 && currentEncounter.phases) {
    // Apply persisted exhausted state to every phase's choices up front so
    // the CHOICE phase logic can detect "all done" on first evaluation.
    for (const phase of currentEncounter.phases) {
      if (!phase.choices) continue;
      for (const c of phase.choices) {
        const key = c.effectType || c.text;
        if (key && persisted.includes(key)) c.exhausted = true;
      }
    }
    // Check if the encounter has any CHOICE phase where all repeat choices
    // are already exhausted — if so, deactivate the node entirely.
    const hasDormantChoice = currentEncounter.phases.some(p =>
      p.phaseType === EncounterPhase.CHOICE &&
      Array.isArray(p.choices) &&
      (() => {
        const repeats = p.choices.filter(c => c.returnToChoices);
        return repeats.length > 0 && repeats.every(c => c.exhausted);
      })()
    );
    if (hasDormantChoice) {
      node.isDone = true;
      node.canRevisit = false;
      currentEncounter = null;
      state = GameState.MAP;
      return;
    }
  }

  encounterTextIndex = 0;
  encounterChoiceResult = null;
  advanceEncounterPhase();
}

function advanceEncounterPhase() {
  if (!currentEncounter || currentEncounter.isComplete) {
    // Encounter done — mark node complete
    currentMap.completeCurrentNode();
    currentEncounter = null;

    // Check for map transitions based on completed node
    const nodeId = currentMap.currentNodeId;
    if (nodeId === 'to_the_plains') {
      showTitleCard('Chapter 3: The Plains of No Hope', '', () => {
        currentMap = createPlainsMap();
        visitedNodes = new Set();
        startNodeEncounter('plains_of_no_hope');
      });
      return;
    }
    if (nodeId === 'south_gate' || nodeId === 'city_south_gate') {
      // Already on ruins_basin map with qualibaf nodes, just go to map
    }
    if (nodeId === 'forest_return_left' || nodeId === 'forest_return_right') {
      showTitleCard('The Siege of Tharnag', '', () => {
        currentMap = createTharnagMap();
        visitedNodes = new Set();
        startNodeEncounter('tharnag_entry');
      });
      return;
    }
    // Cave → Ruins Basin
    if (nodeId === 'cave_river_path') {
      showTitleCard('The Flooded Ruins', '', () => {
        currentMap = createRuinsBasinMap();
        visitedNodes = new Set();
        startNodeEncounter('piranha_pool');
      });
      return;
    }
    // Dwarven City area transitions
    if (nodeId === 'corridor_gate_approach') {
      transitionToMap(createGateAreaMap, 'gate_back_to_corridor');
      return;
    }
    if (nodeId === 'gate_passage') {
      showTitleCard('Hall of Ancestors', '', () => {
        transitionToMap(createHallOfAncestorsMap, 'ancestors_entry');
      });
      return;
    }
    if (nodeId === 'ancestors_monument_alley') {
      transitionToMap(createMonumentAlleyMap, 'monument_entry');
      return;
    }
    if (nodeId === 'ancestors_artisan_district') {
      transitionToMap(createArtisanDistrictMap, 'artisan_entry');
      return;
    }
    if (nodeId === 'monument_tomb') {
      transitionToMap(createTombOfAncestorMap, 'tomb_entry');
      return;
    }
    if (nodeId === 'stairs_to_throne') {
      transitionToMap(createDwarvenThroneRoomMap, 'throne_entry');
      return;
    }
    if (nodeId === 'throne_to_map_room') {
      transitionToMap(createMapRoomMap, 'map_room_entry');
      return;
    }
    if (nodeId === 'tunnels_exit') {
      transitionToMap(createArtisanDistrictMap, 'artisan_entry');
      return;
    }

    state = GameState.MAP;
    // Autosave after the full encounter (combat + loot + all dialogs) is done
    autosaveNow();
    return;
  }

  const phase = currentEncounter.currentPhase;
  switch (phase.phaseType) {
    case EncounterPhase.TEXT:
      encounterTextIndex = 0;
      encounterTextScrollY = 0;
      state = GameState.ENCOUNTER_TEXT;
      break;
    case EncounterPhase.CHOICE:
      encounterChoiceResult = null;
      // Prison post-combat barrel choice: skip entirely if the barrel was
      // already looted via the pre-combat snatch (sneak/talk flow).
      if (phase.choices && phase.choices.some(c => c.effectType === 'loot_barrel') && prisonBarrelLooted) {
        currentEncounter.advancePhase();
        advanceEncounterPhase();
        return;
      }
      // Restore persisted exhausted state from the current map node so previous
      // visits' choices remain greyed out across re-entries.
      {
        const node = currentMap ? currentMap.getCurrentNode() : null;
        const persisted = (node && Array.isArray(node.exhaustedChoices)) ? node.exhaustedChoices : [];
        if (persisted.length > 0 && phase.choices) {
          for (const c of phase.choices) {
            const key = c.effectType || c.text;
            if (persisted.includes(key)) c.exhausted = true;
          }
        }
        // If every repeat-choice is already exhausted, the node is dormant — bail out.
        if (phase.choices) {
          const repeatChoices = phase.choices.filter(c => c.returnToChoices);
          const allDone = repeatChoices.length > 0 && repeatChoices.every(c => c.exhausted);
          if (allDone && node) {
            node.isDone = true;
            node.canRevisit = false;
            currentEncounter = null;
            state = GameState.MAP;
            autosaveNow();
            return;
          }
        }
      }
      state = GameState.ENCOUNTER_CHOICE;
      break;
    case EncounterPhase.COMBAT:
      setupEnemyForCombat(phase.enemyId);
      startCombat();
      break;
    case EncounterPhase.LOOT: {
      // Calculate gold
      let lootGoldAmount = phase.lootGold || 0;
      if (phase.lootGoldDice) {
        const [count, sides] = phase.lootGoldDice;
        for (let i = 0; i < count; i++) lootGoldAmount += Math.floor(Math.random() * sides) + 1;
      }
      // Lucky Find perk: if the player actually gained gold, add a bonus
      // 1d6 per perk stack. Stores the bonus separately so the loot screen
      // can show "Lucky Find triggered (+N gold)" as its own line.
      let luckyFindBonus = 0;
      if (lootGoldAmount > 0 && player) {
        const stacks = player.getPerkStacks('loot_bonus_gold');
        if (stacks > 0) {
          for (let i = 0; i < stacks; i++) {
            luckyFindBonus += Math.floor(Math.random() * 6) + 1;
          }
        }
      }
      gold += lootGoldAmount + luckyFindBonus;
      phase._lootLuckyFindBonus = luckyFindBonus;
      if (luckyFindBonus > 0) {
        addLog(`  Lucky Find! +${luckyFindBonus} gold`, Colors.GOLD, perkToCardLike(createLuckyFindPerk()));
      }
      // Add loot cards to player's deck
      phase._lootedCards = [];
      for (const cardId of phase.lootCards) {
        // Loot tables: special IDs that roll a random card
        const lootTableCards = rollLootTable(cardId);
        if (lootTableCards) {
          for (const card of lootTableCards) {
            player.deck.addCard(card, true);
            phase._lootedCards.push(card);
          }
        } else {
          const creator = CARD_REGISTRY[cardId];
          if (creator) {
            const card = creator();
            player.deck.addCard(card, true);
            phase._lootedCards.push(card);
          }
        }
      }
      phase._lootGoldAmount = lootGoldAmount;
      // Check for level-up trigger
      if (phase.triggersLevelUp) {
        pendingLevelUp = true;
      }
      state = GameState.ENCOUNTER_LOOT;
      break;
    }
    default:
      currentEncounter.advancePhase();
      advanceEncounterPhase();
      break;
  }
}

// Enemy hand sizes (how many cards they draw per turn)
const ENEMY_HAND_SIZE = {
  giant_rat: 2,
  bone_pile: 3,
  slime: 1,
  prison_guards: 2,
  dire_rat: 2,
};

function setupEnemyForCombat(enemyId) {
  const ENEMY_DECKS = {
    giant_rat: () => {
      enemy = new Character('Giant Rat');
      enemy.deck = new Deck();
      for (let i = 0; i < 6; i++) enemy.deck.addCard(createBite());
      for (let i = 0; i < 4; i++) enemy.deck.addCard(createToughHide());
      // First rat combat uses the weaker 1-2 rat summon (Screech!) — swapped
      // from the old setup that had Giant Rat on the stronger 1-3 variant.
      for (let i = 0; i < 4; i++) enemy.deck.addCard(createDireRatScreech());
      enemy.addPower(createChunkyBite());
    },
    bone_pile: () => {
      enemy = new Character('Bone Pile');
      enemy.deck = new Deck();
      for (let i = 0; i < 6; i++) enemy.deck.addCard(createBigBone());
      for (let i = 0; i < 4; i++) enemy.deck.addCard(createLooseBone());
      enemy.addPower(createArmorPower());
    },
    slime: () => {
      enemy = new Character('Slime');
      enemy.deck = new Deck();
      for (let i = 0; i < 12; i++) enemy.deck.addCard(createSlimeAppendage());
      enemy.addPower(createSplit());
    },
    prison_guards: () => {
      enemy = new Character('Kobold Warden');
      enemy.deck = new Deck();
      enemy.shield = 4;
      for (let i = 0; i < 6; i++) enemy.deck.addCard(createGuards());
      for (let i = 0; i < 6; i++) enemy.deck.addCard(createMotivationalWhip());
      for (let i = 0; i < 4; i++) enemy.deck.addCard(createHideInCorner());
      // 2 guard creatures
      enemy.addCreature(new Creature({ name: 'Kobold Guard', attack: 2, maxHp: 1, shield: 1 }));
      enemy.addCreature(new Creature({ name: 'Kobold Guard', attack: 2, maxHp: 1, shield: 1 }));
    },
    dire_rat: () => {
      enemy = new Character('Dire Rat');
      enemy.deck = new Deck();
      for (let i = 0; i < 6; i++) enemy.deck.addCard(createDireRatBite());
      for (let i = 0; i < 4; i++) enemy.deck.addCard(createToughHide());
      // Dire Rat uses the stronger Skreeeeeeeek! (1-3 rats) — scaled up
      // from the first rat fight's Screech! (1-2).
      for (let i = 0; i < 4; i++) enemy.deck.addCard(createSkreeeeeeeek());
      // Powers: Big Bite (3 dmg for 2 recharge), Armor: 1 (passive damage
      // reduction), Dire Fury (+1 Rage at end of enemy turn). Matches PY.
      // The Armor:1 power is the *only* source of armor — do NOT also set
      // baseArmor=1, or the character.armor getter sums them and you get 2.
      enemy.addPower(createChunkyBite());
      enemy.addPower(createArmorPower(1));
      enemy.addPower(createDireFury());
      // Starts with 2 Rat creatures (1/1) already ready to attack.
      const rat1 = new Creature({ name: 'Rat', attack: 1, maxHp: 1 });
      const rat2 = new Creature({ name: 'Rat', attack: 1, maxHp: 1 });
      rat1.exhausted = false; rat1.justSummoned = false;
      rat2.exhausted = false; rat2.justSummoned = false;
      enemy.addCreature(rat1);
      enemy.addCreature(rat2);
      // Thorb fights at the player's side in the corner-cell rescue. Matches
      // PY: `if encounter.id == "corner_cell": player.add_creature(thorb)`.
      // He arrives ready to act on the player's first turn (no summoning
      // sickness, since he was already there waiting to be freed).
      if (currentEncounter && currentEncounter.id === 'corner_cell') {
        const thorb = new Creature({
          name: 'Thorb', attack: 2, maxHp: 4, isCompanion: true,
          description: 'Gains +1 Shield at end of your turn',
        });
        thorb.exhausted = false; thorb.justSummoned = false;
        player.addCreature(thorb);
      }
    },
  };

  ENEMY_DECKS.kobold_patrol = () => {
    enemy = new Character('Kobold Patrol');
    enemy.deck = new Deck();
    for (let i = 0; i < 5; i++) enemy.deck.addCard(createSpearThrow());
    for (let i = 0; i < 5; i++) enemy.deck.addCard(createIcyBreath());
    for (let i = 0; i < 5; i++) enemy.deck.addCard(createShieldBashEnemy());
    // Kobold Backup: passive, summons 1 Kobold Guard at start of each
    // enemy turn. Matches PY's create_kobold_backup() power.
    enemy.addPower(createKoboldBackup());
    // Start with 1 Kobold Guard already ready to attack (matches PY).
    const guard = new Creature({ name: 'Kobold Guard', attack: 2, maxHp: 1, shield: 1 });
    guard.exhausted = false;
    guard.justSummoned = false;
    enemy.addCreature(guard);
    // Log so the player sees the guard is present from turn 1.
    setTimeout(() => addLog(`  Kobold Guard is already in position!`, Colors.RED), 50);
  };
  ENEMY_HAND_SIZE.kobold_patrol = 3;

  ENEMY_DECKS.bone_amalgam = () => {
    enemy = new Character('Bone Amalgam');
    enemy.deck = new Deck();
    for (let i = 0; i < 6; i++) enemy.deck.addCard(createBigBone());
    for (let i = 0; i < 4; i++) enemy.deck.addCard(createLooseBone());
    for (let i = 0; i < 4; i++) enemy.deck.addCard(createBoneStorm());
    enemy.addCreature(new Creature({ name: 'Bone Amalgam', attack: 3, maxHp: 3 }));
  };
  ENEMY_HAND_SIZE.bone_amalgam = 2;

  ENEMY_DECKS.sahuagin_sentinel = () => {
    enemy = new Character('Sahuagin Sentinel');
    enemy.deck = new Deck();
    for (let i = 0; i < 4; i++) enemy.deck.addCard(createTridentThrow());
    for (let i = 0; i < 8; i++) enemy.deck.addCard(createTridentThrust());
    for (let i = 0; i < 6; i++) enemy.deck.addCard(createScaleArmor());
  };
  ENEMY_HAND_SIZE.sahuagin_sentinel = 3;

  ENEMY_DECKS.sahuagin_priest = () => {
    enemy = new Character('Sahuagin Priest');
    enemy.deck = new Deck();
    for (let i = 0; i < 5; i++) enemy.deck.addCard(createBloodInTheWater());
    for (let i = 0; i < 5; i++) enemy.deck.addCard(createScaleArmor());
    for (let i = 0; i < 5; i++) enemy.deck.addCard(createSahuaginStaffEnemy());
    for (let i = 0; i < 5; i++) enemy.deck.addCard(createScaleArmor());
    enemy.addCreature(new Creature({ name: 'Sahuagin Sentinel', attack: 2, maxHp: 5, sentinel: true }));
    enemy.addCreature(new Creature({ name: 'Sahuagin Sentinel', attack: 2, maxHp: 5, sentinel: true }));
  };
  ENEMY_HAND_SIZE.sahuagin_priest = 3;

  ENEMY_DECKS.sahuagin_baron = () => {
    enemy = new Character('Sahuagin Baron');
    enemy.deck = new Deck();
    for (let i = 0; i < 4; i++) enemy.deck.addCard(createTridentThrow());
    for (let i = 0; i < 10; i++) enemy.deck.addCard(createTridentThrust());
    for (let i = 0; i < 7; i++) enemy.deck.addCard(createBarnacleEncrustedPlateEnemy());
    enemy.addCreature(new Creature({ name: 'Shark', attack: 1, maxHp: 4, bloodfrenzy: 1 }));
  };
  ENEMY_HAND_SIZE.sahuagin_baron = 3;

  ENEMY_DECKS.forest_spiders = () => {
    enemy = new Character('Deathjump Spiders');
    enemy.deck = new Deck();
    for (let i = 0; i < 7; i++) enemy.deck.addCard(createPoisonedBite());
    for (let i = 0; i < 7; i++) enemy.deck.addCard(createWebSpider());
    enemy.addCreature(new Creature({ name: 'Deathjump Spider', attack: 2, maxHp: 3, poisonAttack: true }));
  };
  ENEMY_HAND_SIZE.forest_spiders = 2;

  ENEMY_DECKS.obsidian_golem = () => {
    enemy = new Character('Obsidian Golem');
    enemy.deck = new Deck();
    for (let i = 0; i < 20; i++) enemy.deck.addCard(createCrush());
    enemy.baseArmor = 5;
  };
  ENEMY_HAND_SIZE.obsidian_golem = 1;

  ENEMY_DECKS.obsidian_slime = () => {
    enemy = new Character('Obsidian Slime');
    enemy.deck = new Deck();
    for (let i = 0; i < 8; i++) enemy.deck.addCard(createRockyAppendage());
    enemy.baseArmor = 5;
  };
  ENEMY_HAND_SIZE.obsidian_slime = 1;

  ENEMY_DECKS.siege_gauntlet_1 = ENEMY_DECKS.siege_gauntlet_2 = ENEMY_DECKS.siege_gauntlet_3 = () => {
    enemy = new Character('Siege Ogre');
    enemy.deck = new Deck();
    for (let i = 0; i < 25; i++) enemy.deck.addCard(createPullingBackTheRam());
    enemy.addCreature(new Creature({ name: 'Goblin Sapper', attack: 1, maxHp: 2, selfDestruct: true, onDeathDamage: 3 }));
  };
  ENEMY_HAND_SIZE.siege_gauntlet_1 = ENEMY_HAND_SIZE.siege_gauntlet_2 = ENEMY_HAND_SIZE.siege_gauntlet_3 = 5;

  ENEMY_DECKS.kobold_drake_rider = () => {
    enemy = new Character('Kobold Drake Rider');
    enemy.deck = new Deck();
    for (let i = 0; i < 5; i++) enemy.deck.addCard(createSpearThrow());
    for (let i = 0; i < 6; i++) enemy.deck.addCard(createShieldBashEnemy());
    for (let i = 0; i < 5; i++) enemy.deck.addCard(createDrakeRiderCharge());
    for (let i = 0; i < 4; i++) enemy.deck.addCard(createChainShirt());
    enemy.addCreature(new Creature({ name: 'Frost Drake', attack: 3, maxHp: 8, iceAttack: 1, armor: 1 }));
  };
  ENEMY_HAND_SIZE.kobold_drake_rider = 2;

  ENEMY_DECKS.piranhas_swarm = () => {
    enemy = new Character('Piranha Swarm');
    enemy.deck = new Deck();
    enemy.deck.addCard(createBite()); // dummy
    enemy._invulnerable = true;
    enemy._killTarget = 5;
    for (let i = 0; i < 5; i++) {
      const piranha = new Creature({ name: 'Piranha', attack: 1, maxHp: 1, swarm: true });
      piranha.ready();
      enemy.addCreature(piranha);
    }
  };
  ENEMY_HAND_SIZE.piranhas_swarm = 0;

  ENEMY_DECKS.general_zhost = () => {
    enemy = new Character("General Zhost's Army");
    enemy.deck = new Deck();
    for (let i = 0; i < 10; i++) enemy.deck.addCard(createDefensiveFormation());
    for (let i = 0; i < 10; i++) enemy.deck.addCard(createMotivationalWhip());
    enemy._invulnerable = true;
    enemy._killTarget = 10;
    for (let i = 0; i < 4; i++) {
      enemy.addCreature(new Creature({ name: 'Kobold Guard', attack: 2, maxHp: 1, shield: 1 }));
    }
    for (let i = 0; i < 2; i++) {
      enemy.addCreature(new Creature({ name: 'Kobold Slinger', attack: 2, maxHp: 1, fireAttack: 1 }));
    }
    enemy.addCreature(new Creature({ name: 'Kobold Dragonshield', attack: 2, maxHp: 2, shield: 2, sentinel: true }));
  };
  ENEMY_HAND_SIZE.general_zhost = 1;

  ENEMY_DECKS.general_zhost_boss = () => {
    enemy = new Character('General Zhost');
    enemy.deck = new Deck();
    for (let i = 0; i < 4; i++) enemy.deck.addCard(createWhiteClaw());
    for (let i = 0; i < 4; i++) enemy.deck.addCard(createChainShirt());
    for (let i = 0; i < 3; i++) enemy.deck.addCard(createSpearThrow());
    for (let i = 0; i < 4; i++) enemy.deck.addCard(createChainShirt());
  };
  ENEMY_HAND_SIZE.general_zhost_boss = 2;

  ENEMY_DECKS.wolf_pack = () => {
    enemy = new Character('Wolf Pack');
    enemy.deck = new Deck();
    enemy.deck.addCard(createBite()); // dummy card
    enemy._invulnerable = true;
    enemy._killTarget = 10;
    for (let i = 0; i < 3; i++) {
      const wolf = new Creature({ name: 'Wolf', attack: 2, maxHp: 2 });
      wolf.ready();
      enemy.addCreature(wolf);
    }
  };
  ENEMY_HAND_SIZE.wolf_pack = 0;

  ENEMY_DECKS.stone_giant = () => {
    enemy = new Character('Stone Giant');
    enemy.deck = new Deck();
    for (let i = 0; i < 20; i++) enemy.deck.addCard(createSharpRock());
    enemy._invulnerable = true;
    enemy._survivalRounds = 5;
    const boulder = new Creature({ name: 'Large Boulder', attack: 6, maxHp: 4, armor: 1, selfDestruct: true });
    boulder.ready();
    enemy.addCreature(boulder);
  };
  ENEMY_HAND_SIZE.stone_giant = 1;

  ENEMY_DECKS.mimic = () => {
    enemy = new Character('Mimic');
    enemy.deck = new Deck();
    for (let i = 0; i < 30; i++) enemy.deck.addCard(createMimicBite());
  };
  ENEMY_HAND_SIZE.mimic = 1;

  ENEMY_DECKS.ruga_slave_master = () => {
    enemy = new Character('Ruga the Slave Master');
    enemy.deck = new Deck();
    for (let i = 0; i < 50; i++) enemy.deck.addCard(createPummel());
  };
  ENEMY_HAND_SIZE.ruga_slave_master = 2;

  ENEMY_DECKS.zhost_revenge = () => {
    enemy = new Character('General Zhost');
    enemy.deck = new Deck();
    for (let i = 0; i < 6; i++) enemy.deck.addCard(createRuneforgedBuckler());
    for (let i = 0; i < 4; i++) enemy.deck.addCard(createDwarvenTowerShield());
    for (let i = 0; i < 16; i++) enemy.deck.addCard(createWhiteClawReforged());
    for (let i = 0; i < 10; i++) enemy.deck.addCard(createIronforgeChainmail());
    for (let i = 0; i < 4; i++) enemy.deck.addCard(createDwarvenThrowingAxe());
  };
  ENEMY_HAND_SIZE.zhost_revenge = 2;

  ENEMY_DECKS.dwarven_specter = () => {
    enemy = new Character('Dwarven Specter');
    enemy.deck = new Deck();
    for (let i = 0; i < 10; i++) enemy.deck.addCard(createDrainEssence());
  };
  ENEMY_HAND_SIZE.dwarven_specter = 1;

  ENEMY_DECKS.kobold_slyblade = () => {
    enemy = new Character('Kobold Slyblade');
    enemy.deck = new Deck();
    for (let i = 0; i < 8; i++) enemy.deck.addCard(createPoisonedBite());
    for (let i = 0; i < 8; i++) enemy.deck.addCard(createWebSpider());
    for (let i = 0; i < 4; i++) enemy.deck.addCard(createSpearThrow());
  };
  ENEMY_HAND_SIZE.kobold_slyblade = 3;

  ENEMY_DECKS.obsidian_oracle = () => {
    enemy = new Character('Obsidian Oracle');
    enemy.deck = new Deck();
    for (let i = 0; i < 15; i++) enemy.deck.addCard(createObsidianCurse());
    enemy.baseArmor = 15;
  };
  ENEMY_HAND_SIZE.obsidian_oracle = 1;

  ENEMY_DECKS.magma_drake = () => {
    enemy = new Character('Magma Drake');
    enemy.deck = new Deck();
    for (let i = 0; i < 4; i++) enemy.deck.addCard(createMagmaMephitSummonCard());
    for (let i = 0; i < 8; i++) enemy.deck.addCard(createMoltenScaleArmor());
    for (let i = 0; i < 8; i++) enemy.deck.addCard(createTailSwipe());
    for (let i = 0; i < 4; i++) enemy.deck.addCard(createFireBreath());
    for (let i = 0; i < 8; i++) enemy.deck.addCard(createMoltenBite());
    enemy.baseArmor = 1;
  };
  ENEMY_HAND_SIZE.magma_drake = 2;

  if (ENEMY_DECKS[enemyId]) {
    ENEMY_DECKS[enemyId]();
  } else {
    // Fallback: generic enemy
    enemy = new Character(enemyId);
    enemy.deck = new Deck();
    for (let i = 0; i < 6; i++) enemy.deck.addCard(createBite());
    for (let i = 0; i < 4; i++) enemy.deck.addCard(createToughHide());
  }

  // Store hand size for this enemy
  enemy._handSize = ENEMY_HAND_SIZE[enemyId] || 2;
}

function drawMap() {
  const currentNode = currentMap.getCurrentNode();
  const currentArea = currentNode?.mapArea || '';
  const mapImg = images[`map_${currentArea}`];

  // Compute image→screen transform so node positions (in image coords) map correctly.
  const { scale: mapScale, offX: mapOffX, offY: mapOffY, toScreen } = getMapTransform(currentArea);
  if (mapImg) {
    const drawW = mapImg.width * mapScale;
    const drawH = mapImg.height * mapScale;
    // Fill background (letterbox)
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    ctx.drawImage(mapImg, mapOffX, mapOffY, drawW, drawH);
  } else {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  }

  // Draw connections (skip lines to/from locked nodes)
  ctx.strokeStyle = 'rgba(200,200,200,0.3)';
  ctx.lineWidth = 2;
  for (const [id, node] of Object.entries(currentMap.nodes)) {
    if (node.mapArea !== currentArea) continue;
    if (node.isLocked) continue;
    for (const connId of node.connections) {
      const conn = currentMap.getNode(connId);
      if (!conn || conn.mapArea !== currentArea || conn.isLocked) continue;
      const a = toScreen(node.position);
      const b = toScreen(conn.position);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }

  // Fog of war overlay (drawn between map background and nodes)
  drawFogOfWar(currentArea);

  // Draw nodes (on top of fog)
  const accessible = currentMap.getAccessibleNodes().map(n => n.id);
  for (const [id, node] of Object.entries(currentMap.nodes)) {
    if (node.mapArea !== currentArea) continue;
    if (node.isLocked) continue;
    const { x: nx, y: ny } = toScreen(node.position);
    const isCurrent = id === currentMap.currentNodeId;
    const isAccessible = accessible.includes(id);
    const isVisible = visitedNodes.has(id) || isAccessible || isCurrent;
    // In fog areas (non-outdoor), only show visible nodes
    const outdoorAreas = new Set(['mountain_path', 'plains', 'arriving_city', 'qualibaf', 'north_qualibaf', 'tharnag', 'grand_hall', 'grand_staircase', 'throne_room', 'artisan_hall', 'personal_quarters', 'volcano']);
    if (!outdoorAreas.has(currentArea) && !isVisible) continue;

    const hovered = hitTest(mouseX, mouseY, { x: nx - 18, y: ny - 18, w: 36, h: 36 });

    // Node circle — skip drawing the current-node green dot here if
    // an animation is in progress (it gets drawn separately at the
    // interpolated position below).
    const skipCurrentDot = isCurrent && mapMoveAnim;
    let color;
    if (isCurrent && !mapMoveAnim) color = Colors.GREEN;
    else if (isAccessible && !node.isLocked) color = Colors.GOLD;
    else if (node.isDone) color = Colors.DARK_GRAY;
    else color = '#333';

    if (!skipCurrentDot) {
      ctx.beginPath();
      ctx.arc(nx, ny, 18, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = (hovered && (isCurrent || isAccessible)) ? 1 : 0.8;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = isCurrent ? Colors.WHITE : '#888';
      ctx.lineWidth = isCurrent ? 3 : 1;
      ctx.stroke();
    }

    // Node label
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    const label = node.displayName;
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    const tw = ctx.measureText(label).width;
    ctx.fillRect(nx - tw / 2 - 4, ny + 22, tw + 8, 18);
    ctx.fillStyle = Colors.WHITE;
    ctx.fillText(label, nx, ny + 36);

    // Locked indicator
    if (node.isLocked) {
      ctx.fillStyle = Colors.RED;
      ctx.font = '14px sans-serif';
      ctx.fillText('🔒', nx, ny + 5);
    }
  }

  // Animated party circle — lerps from old node to new node during move.
  if (mapMoveAnim) {
    const t = Math.min(1, mapMoveAnim.elapsed / mapMoveAnim.duration);
    // Ease-out: 1 - (1-t)^2 for a smooth deceleration feel.
    const ease = 1 - (1 - t) * (1 - t);
    const [fx, fy] = mapMoveAnim.fromPos;
    const [tx, ty] = mapMoveAnim.toPos;
    const lx = fx + (tx - fx) * ease;
    const ly = fy + (ty - fy) * ease;
    const { x: sx, y: sy } = toScreen([lx, ly]);
    ctx.beginPath();
    ctx.arc(sx, sy, 18, 0, Math.PI * 2);
    ctx.fillStyle = Colors.GREEN;
    ctx.globalAlpha = 0.95;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = Colors.WHITE;
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // Current node description panel
  if (currentNode) {
    const panelY = SCREEN_HEIGHT - 120;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, panelY, SCREEN_WIDTH, 120);
    ctx.fillStyle = Colors.GOLD;
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(currentNode.displayName, SCREEN_WIDTH / 2, panelY + 30);
    ctx.fillStyle = Colors.WHITE;
    ctx.font = '15px sans-serif';
    ctx.fillText(currentNode.displayDescription, SCREEN_WIDTH / 2, panelY + 55);
    ctx.fillStyle = Colors.GRAY;
    ctx.font = '13px sans-serif';
    ctx.fillText(`Gold: ${gold}  |  Deck: ${player.deck.masterDeck.length} cards`, SCREEN_WIDTH / 2, panelY + 80);
    ctx.fillStyle = '#aaa';
    ctx.fillText('Click node to move  |  S: Save  |  L: Load  |  I: Inventory', SCREEN_WIDTH / 2, panelY + 100);
  }

  ctx.textAlign = 'left';
}

// ============================================================
// ENCOUNTER TEXT
// ============================================================

// Per-speaker dialog colors. Matches PY's `speaker_colors` dict —
// known allies get distinctive colors, unknown speakers fall back to RED.
// Thorb's dusky red (rgb 200,80,60 ≈ #c85040) matches the PY source.
const SPEAKER_COLORS = {
  Thorb: '#c85040',
  Raena: Colors.GREEN,
};

function handleEncounterTextClick() {
  const phase = currentEncounter.currentPhase;
  if (!phase) return;
  // If there are more paragraphs to reveal, reveal the next one
  if (encounterTextIndex + 1 < phase.texts.length) {
    encounterTextIndex++;
    // Auto-scroll to bottom so the new paragraph is visible
    encounterTextScrollY = encounterTextOverflow;
  } else {
    // All paragraphs shown, advance to next phase
    currentEncounter.advancePhase();
    advanceEncounterPhase();
  }
}

function drawEncounterText() {
  drawEncounterBg();

  const phase = currentEncounter.currentPhase;
  if (!phase) return;

  // Bigger text box, centered
  const boxW = SCREEN_WIDTH - 160;
  const boxH = 460;
  const boxX = (SCREEN_WIDTH - boxW) / 2;
  const boxY = (SCREEN_HEIGHT - boxH) / 2 + 30; // shifted down so title sits higher

  // Encounter title — higher up
  ctx.fillStyle = Colors.GOLD;
  ctx.font = 'bold 40px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0,0,0,0.9)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 2;
  ctx.fillText(currentEncounter.name, Math.round(SCREEN_WIDTH / 2), boxY - 30);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Text box background
  ctx.fillStyle = 'rgba(0,0,0,0.82)';
  ctx.fillRect(boxX, boxY, boxW, boxH);
  ctx.strokeStyle = Colors.GOLD;
  ctx.lineWidth = 2;
  ctx.strokeRect(boxX, boxY, boxW, boxH);

  // Render all revealed paragraphs stacked, top-aligned, scrollable
  const padding = 24;
  const innerX = boxX + padding;
  const innerY = boxY + padding;
  const innerW = boxW - padding * 2;
  const innerH = boxH - padding * 2 - 30; // leave room for continue prompt

  // Clip to inner area
  ctx.save();
  ctx.beginPath();
  ctx.rect(innerX, innerY, innerW, innerH);
  ctx.clip();

  ctx.font = '21px Georgia, serif';
  ctx.textAlign = 'left';
  const lineH = 30;
  const paragraphGap = 18;
  let cursorY = innerY - encounterTextScrollY;

  const visibleCount = Math.min(encounterTextIndex + 1, phase.texts.length);
  for (let i = 0; i < visibleCount; i++) {
    const entry = phase.texts[i];

    // Speaker — color-coded by character name. Mirrors PY's `speaker_colors`
    // dict: known allies get distinctive colors (Thorb dusky red, Raena
    // green, etc.), '!' shouts stay GOLD, and unknown speakers fall back
    // to RED (same as PY's default).
    if (entry.speaker) {
      let speakerColor;
      if (entry.speaker === '!') {
        speakerColor = Colors.GOLD;
      } else {
        speakerColor = SPEAKER_COLORS[entry.speaker] || Colors.RED;
      }
      ctx.fillStyle = speakerColor;
      ctx.font = 'bold 23px Georgia, serif';
      ctx.fillText(entry.speaker === '!' ? '!!!' : `[${entry.speaker}]`, innerX, cursorY + 22);
      cursorY += 32;
      ctx.font = '21px Georgia, serif';
    }

    ctx.fillStyle = Colors.WHITE;
    const lines = wrapTextLong(entry.text, innerW, 21);
    for (const line of lines) {
      cursorY += lineH;
      ctx.fillText(line, innerX, cursorY);
    }
    cursorY += paragraphGap;
  }

  ctx.restore();

  // Calculate overflow for scroll handling
  const totalContentH = (cursorY - paragraphGap) - (innerY - encounterTextScrollY);
  encounterTextOverflow = Math.max(0, totalContentH - innerH);
  // Clamp scroll
  if (encounterTextScrollY > encounterTextOverflow) encounterTextScrollY = encounterTextOverflow;

  // Scrollbar if needed
  if (encounterTextOverflow > 0) {
    const trackX = boxX + boxW - 8;
    const trackY = innerY;
    const trackH = innerH;
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(trackX, trackY, 4, trackH);
    const thumbH = Math.max(20, trackH * (innerH / (innerH + encounterTextOverflow)));
    const thumbY = trackY + (encounterTextScrollY / encounterTextOverflow) * (trackH - thumbH);
    ctx.fillStyle = Colors.GOLD;
    ctx.fillRect(trackX, thumbY, 4, thumbH);
  }

  // Continue prompt at the bottom of the box
  ctx.fillStyle = Colors.GRAY;
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  const promptText = encounterTextIndex + 1 < phase.texts.length
    ? `Click to continue  (${encounterTextIndex + 1}/${phase.texts.length})`
    : `Click to proceed  (${encounterTextIndex + 1}/${phase.texts.length})`;
  ctx.fillText(promptText, SCREEN_WIDTH / 2, boxY + boxH - 16);

  ctx.textAlign = 'left';
}

function wrapTextLong(text, maxWidth, fontSize) {
  const charWidth = fontSize * 0.48;
  const maxChars = Math.floor(maxWidth / charWidth);
  const words = text.split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length > maxChars) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = current ? current + ' ' + word : word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// ============================================================
// ENCOUNTER CHOICE
// ============================================================

function getChoiceRects() {
  const phase = currentEncounter.currentPhase;
  if (!phase) return [];
  const choices = phase.choices;
  const btnW = 500;
  const btnH = 50;
  const gap = 20;
  const startY = SCREEN_HEIGHT / 2 - ((choices.length * (btnH + gap)) / 2);
  const startX = (SCREEN_WIDTH - btnW) / 2;
  return choices.map((c, i) => ({
    x: startX, y: startY + i * (btnH + gap), w: btnW, h: btnH, choice: c,
  }));
}

function handleEncounterChoiceClick(x, y) {
  // If showing result, click to continue
  if (encounterChoiceResult) {
    const eff = encounterChoiceResult.effectType;
    const val = encounterChoiceResult.effectValue;

    // Apply effect based on type
    switch (eff) {
      case 'damage':
        if (val > 0) {
          player.takeDamageFromDeck(val);
        }
        break;

      case 'fall_to_sewers': {
        const splash = currentMap.getNode('splash_point');
        if (splash) splash.isLocked = false;
        currentMap.completeCurrentNode();
        currentMap.currentNodeId = 'splash_point';
        startNodeEncounter('splash_point');
        return;
      }

      case 'short_rest':
      case 'search_camp':
        // Already resolved at selection time — autosave after state change
        autosaveNow();
        break;

      case 'move_to_kitchen': {
        // Climb up to the kitchen. We deliberately do NOT mark the upward
        // passage (less_deep_sewer) done here — only a *committing* kitchen
        // choice (attack/talk/sneak via markKitchenDone) finalizes both
        // nodes. That way, hitting "Leave" in the kitchen leaves the upward
        // passage active so the player can pick a real choice later.
        const kitchen = currentMap.getNode('kitchen');
        if (kitchen) kitchen.isLocked = false;
        currentMap.currentNodeId = 'kitchen';
        startNodeEncounter('kitchen');
        return;
      }

      case 'upward_stay_down': {
        // Stay down on the Upward Passage — bounce back to the map WITHOUT
        // marking the node done so the player can return later and choose
        // "Climb up" instead.
        encounterChoiceResult = null;
        currentEncounter = null;
        state = GameState.MAP;
        return;
      }

      case 'prison_wing_turn_back': {
        // Turn back from the Prison Wing — bounce back to the map WITHOUT
        // marking the node done so the player can return later and choose
        // "Investigate" instead.
        encounterChoiceResult = null;
        currentEncounter = null;
        state = GameState.MAP;
        return;
      }

      case 'kitchen_attack':
      case 'kitchen_talk':
      case 'kitchen_sneak':
      case 'prison_snatch':
      case 'loot_barrel':
        // Already resolved inline at choice-click time (see resolveKitchenAttack
        // / resolveKitchenTalk / resolvePrisonSnatch / resolveLootBarrel); this
        // case just lets the encounter advance normally.
        break;


      case 'prison_fight':
        // Just advance — the next phase is combat.
        break;

      case 'kitchen_leave':
        // Go back down through the trapdoor to the upward passage node.
        // The map node id is 'less_deep_sewer' (encounter id is 'upward_passage').
        currentMap.currentNodeId = 'less_deep_sewer';
        encounterChoiceResult = null;
        currentEncounter = null;
        state = GameState.MAP;
        return;

      case 'investigate_prison_wing': {
        // Unlock corner cell + reveal its real name/description. Return to
        // the map — the player clicks Corner Cell themselves to start the
        // Dire Rat fight.
        const corner = currentMap.getNode('corner_cell');
        if (corner) {
          corner.isLocked = false;
          corner.hiddenName = '';
          corner.hiddenDescription = '';
        }
        currentMap.completeCurrentNode();
        encounterChoiceResult = null;
        currentEncounter = null;
        state = GameState.MAP;
        autosaveNow();
        return;
      }

      case 'leave_prison':
        // End of Chapter 1. Go straight to the chapter-end narrative
        // (no fade — the player clicked "leave", the scene just changes).
        currentMap.completeCurrentNode();
        currentEncounter = null;
        encounterChoiceResult = null;
        pendingChapter2Transition = true;
        chapterEndStage = 0;
        state = GameState.CHAPTER_END;
        return;

      case 'pray_shrine':
        // Heal fully
        healPlayer(99);
        break;

      case 'shrine_ability_card': {
        // Lost Shrine grants a class ability card. Route through ABILITY_SELECT.
        abilityChoices = getAbilityChoices(selectedClass, 3);
        shrineAbilityMode = true;
        // Deactivate the shrine node now — praying is a one-time gift.
        const node = currentMap.getCurrentNode();
        if (node) { node.isDone = true; node.canRevisit = false; }
        encounterChoiceResult = null;
        currentEncounter = null;
        state = GameState.ABILITY_SELECT;
        return;
      }

      case 'try_squeeze':
        // Already resolved at selection time (see resolveTrySqueeze)
        // If squeeze succeeded, complete the encounter and deactivate the node
        if (encounterChoiceResult._squeezeSucceeded) {
          const node = currentMap.getCurrentNode();
          currentMap.completeCurrentNode();
          if (node) { node.canRevisit = false; }
          encounterChoiceResult = null;
          currentEncounter = null;
          state = GameState.MAP;
          autosaveNow();
          return;
        }
        break;

      case 'open_shop': {
        const shopId = encounterChoiceResult.resultText || 'general_store';
        openShop(shopId, shopId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
        return;
      }

      // === Map Transitions ===
      case 'enter_cave': {
        currentMap.completeCurrentNode();
        currentMap = createCaveMap();
        visitedNodes = new Set();
        startNodeEncounter('cave_entrance');
        return;
      }
      case 'leave_city_north': {
        currentMap.completeCurrentNode();
        currentMap = createNorthQualibafMap();
        visitedNodes = new Set();
        startNodeEncounter('north_gate_return');
        return;
      }
      case 'enter_filibaf': {
        currentMap.completeCurrentNode();
        currentMap = createFilibafForestMap();
        visitedNodes = new Set();
        startNodeEncounter('forest_edge');
        return;
      }
      case 'enter_tharnag': {
        currentMap.completeCurrentNode();
        transitionToMap(createTharnagInteriorMap, 'grand_hall_side_entry');
        return;
      }
      case 'enter_volcano': {
        currentMap.completeCurrentNode();
        showTitleCard('The Volcano', '', () => {
          transitionToMap(createVolcanoMap, 'volcano_approach');
        });
        return;
      }
      case 'enter_dwarven_city': {
        currentMap.completeCurrentNode();
        showTitleCard('The Dwarven City of Thorgazad', '', () => {
          transitionToMap(createEntryCorridorMap, 'corridor_entrance');
        });
        return;
      }
      case 'enter_obsidian_wastes': {
        currentMap.completeCurrentNode();
        transitionToMap(createObsidianWastesMap, 'wastes_entry');
        return;
      }

      default:
        break;
    }

    // Deactivate the map node if this choice requires it
    if (encounterChoiceResult.deactivatesNode) {
      const node = currentMap.getCurrentNode();
      if (node) { node.isDone = true; node.canRevisit = false; }
    }

    if (encounterChoiceResult.returnToChoices) {
      // Mark exhausted unless repeatable
      if (!encounterChoiceResult.repeatable) {
        encounterChoiceResult.exhausted = true;
        // Persist to the map node so the option stays greyed out across revisits.
        const node = currentMap.getCurrentNode();
        if (node) {
          if (!Array.isArray(node.exhaustedChoices)) node.exhaustedChoices = [];
          const key = encounterChoiceResult.effectType || encounterChoiceResult.text;
          if (key && !node.exhaustedChoices.includes(key)) {
            node.exhaustedChoices.push(key);
          }
          autosaveNow();
        }
      }
      encounterChoiceResult = null;
      // If every repeat choice is now exhausted, the node becomes dormant and the
      // encounter auto-completes — the player doesn't have to click Leave.
      const phase = currentEncounter && currentEncounter.currentPhase;
      if (phase && phase.choices) {
        const repeats = phase.choices.filter(c => c.returnToChoices);
        const allDone = repeats.length > 0 && repeats.every(c => c.exhausted);
        if (allDone) {
          const node = currentMap.getCurrentNode();
          if (node) { node.isDone = true; node.canRevisit = false; }
          currentEncounter = null;
          state = GameState.MAP;
          autosaveNow();
        }
      }
      return;
    }
    if (encounterChoiceResult.completesEncounter) {
      // Check if all non-leave choices were exhausted — if so, deactivate the node
      const phase = currentEncounter.currentPhase;
      let nodeDeactivated = false;
      if (phase && phase.choices) {
        const nonLeaveChoices = phase.choices.filter(c => c.returnToChoices);
        const allExhausted = nonLeaveChoices.length > 0 && nonLeaveChoices.every(c => c.exhausted);
        if (allExhausted) {
          const node = currentMap.getCurrentNode();
          if (node) { node.isDone = true; node.canRevisit = false; nodeDeactivated = true; }
        }
      }
      // Always mark the node done on a completesEncounter — otherwise one-shot
      // encounters like prison_entrance would re-trigger on the next click.
      currentMap.completeCurrentNode();
      encounterChoiceResult = null;
      currentEncounter = null;
      state = GameState.MAP;
      autosaveNow();
      return;
    }

    currentEncounter.advancePhase();
    advanceEncounterPhase();
    return;
  }

  const rects = getChoiceRects();
  for (const r of rects) {
    if (hitTest(x, y, r)) {
      if (r.choice.exhausted) return;
      // Kitchen sneak is a toast-only path — no dialog page. Resolve the
      // effect inline and complete the encounter immediately.
      if (r.choice.effectType === 'kitchen_sneak') {
        kitchenChoiceMade = 'sneak';
        markKitchenDone();
        showStyledToast('You slipped through unnoticed.', 'recharge', 2500);
        currentEncounter = null;
        encounterChoiceResult = null;
        state = GameState.MAP;
        autosaveNow();
        return;
      }
      encounterChoiceResult = r.choice;
      if (r.choice.effectType === 'damage' && r.choice.effectValue > 0) {
        showDamageToast(`-${r.choice.effectValue} HP!`, 3000);
      }
      // Resolve try_squeeze immediately so result text is dynamic
      if (r.choice.effectType === 'try_squeeze') resolveTrySqueeze(r.choice);
      // Resolve search_camp immediately to generate loot/gold for result text
      if (r.choice.effectType === 'search_camp') resolveSearchCamp(r.choice);
      // Resolve short_rest immediately
      if (r.choice.effectType === 'short_rest') resolveShortRest(r.choice);
      // Kitchen attack: resolve damage + mark kitchen done + toast NOW.
      if (r.choice.effectType === 'kitchen_attack') {
        resolveKitchenAttack(r.choice);
        showDamageToast('-1 HP!', 2500);
      }
      // Kitchen talk: generate the chicken leg reward NOW so the result
      // page renders it on first display (was being generated in the
      // advance handler, too late — player never saw the card).
      if (r.choice.effectType === 'kitchen_talk') resolveKitchenTalk(r.choice);
      // Prison barrel rolls must happen up front too.
      if (r.choice.effectType === 'prison_snatch') resolvePrisonSnatch(r.choice);
      if (r.choice.effectType === 'loot_barrel') resolveLootBarrel(r.choice);
      return;
    }
  }
}

// Safe autosave — wraps try/catch so a save failure never crashes the game
function autosaveNow() {
  try {
    if (!player || !currentMap) return;
    saveToAutoSlot({ selectedClass, gold, player, currentMap, visitedNodes, backpack, kitchenChoiceMade, prisonBarrelLooted });
    addLog('  [Auto-saved]', Colors.GRAY);
  } catch (err) {
    console.warn('Autosave failed:', err);
  }
}

function resolveTrySqueeze(choice) {
  if (!player || !player.deck || player.deck.hand.length === 0) {
    choice.resultText = 'You have no cards to spare for the attempt.';
    choice.exhausted = true;
    return;
  }
  // Recharge a random card (bottom of draw pile)
  const idx = Math.floor(Math.random() * player.deck.hand.length);
  const card = player.deck.hand.splice(idx, 1)[0];
  player.deck.drawPile.unshift(card);
  const succeeded = Math.random() < 0.5;
  // Success → green/heal-styled toast. Failure → plain neutral toast.
  if (succeeded) {
    showStyledToast(`Recharged: ${card.name}`, 'heal', 2500);
  } else {
    showToast(`Recharged: ${card.name}`, 2000);
  }
  if (succeeded) {
    const shrine = currentMap.getNode('lost_shrine');
    if (shrine) {
      shrine.isLocked = false;
      shrine.hiddenName = '';
      shrine.hiddenDescription = '';
    }
    choice.resultText = `You squeeze through to the other side! A faint golden glow beckons from deeper within.`;
    choice._squeezeSucceeded = true;
  } else {
    const left = player.deck.hand.length;
    choice.resultText = `The gap is too tight — you scrape back out. (${left} card${left !== 1 ? 's' : ''} left)`;
  }
}

function resolveSearchCamp(choice) {
  // 2D6 gold + 2 distinct random items from camp loot pool (matches Python table)
  const goldAmt = (Math.floor(Math.random() * 6) + 1) + (Math.floor(Math.random() * 6) + 1);
  gold += goldAmt;
  // Draw 2 distinct entries from the shared abandoned_camp_loot table
  // (weighted without replacement).
  const available = LOOT_TABLES.abandoned_camp_loot.slice();
  const loot = [];
  for (let i = 0; i < 2 && available.length > 0; i++) {
    const total = available.reduce((s, e) => s + e.weight, 0);
    let roll = Math.random() * total;
    let pickedIdx = 0;
    for (let j = 0; j < available.length; j++) {
      roll -= available[j].weight;
      if (roll <= 0) { pickedIdx = j; break; }
    }
    loot.push(available[pickedIdx].creator());
    available.splice(pickedIdx, 1);
  }
  for (const c of loot) player.deck.addCard(c, true);
  choice._lootItems = loot;
  choice._lootGold = goldAmt;
  choice.resultText = `You rummage through the supplies, finding ${goldAmt} gold and useful odds and ends.`;
  showStyledToast(`+${goldAmt} gold`, 'gold', 2500);
}

// Shared: finalize the kitchen node as done (the encounter advance flow does
// this too, but doing it here at choice-click time defends against edge
// cases where the encounter might restart if the player re-enters before
// advancePhase runs).
function markKitchenDone() {
  if (!currentMap) return;
  const kitchen = currentMap.getNode('kitchen');
  if (kitchen) { kitchen.isDone = true; kitchen.canRevisit = false; }
  // Also finalize the upward passage now — once the kitchen choice is
  // committed, both nodes become passthrough teleporters between sewer
  // and kitchen. (We deliberately don't mark less_deep_sewer done at
  // "Climb up" time because the player might just pick Leave.)
  const upward = currentMap.getNode('less_deep_sewer');
  if (upward) { upward.isDone = true; upward.canRevisit = false; }
  const pe = currentMap.getNode('prison_entrance');
  if (pe) { pe.isLocked = false; pe.hiddenName = ''; pe.hiddenDescription = ''; }
}

// Kitchen "talk" choice — hands the player a Chicken Leg card. Called at
// choice-click time so the result page can render the loot on first display.
function resolveKitchenTalk(choice) {
  kitchenChoiceMade = 'talk';
  const leg = createChickenLeg();
  player.deck.addCard(leg, true);
  choice._lootItems = [leg];
  markKitchenDone();
}

// Kitchen "attack" choice — player takes 1 damage from the pot. Damage
// toast fires separately at choice-click time.
function resolveKitchenAttack(choice) {
  kitchenChoiceMade = 'attack';
  player.takeDamageFromDeck(1);
  markKitchenDone();
}

// Prison "snatch barrel" choice — rolls the gear-barrel loot table at click
// time; success chance depends on the earlier kitchen choice
// (sneak → 100 %, talk → 50 %, attack/other → 0 %).
function resolvePrisonSnatch(choice) {
  let chance = 0;
  if (kitchenChoiceMade === 'sneak')      chance = 1.0;
  else if (kitchenChoiceMade === 'talk')  chance = 0.5;
  if (Math.random() < chance) {
    const rolled = rollLootTable('gear_barrel_loot');
    const card = rolled && rolled[0];
    if (card) {
      player.deck.addCard(card, true);
      choice._lootItems = [card];
      prisonBarrelLooted = true;
      choice.resultText = `You slip to the barrel and palm a ${card.name} before the guards notice. They notice now — to arms!`;
    } else {
      choice.resultText = 'The barrel is empty! The guards spot you. To arms!';
    }
  } else {
    if (kitchenChoiceMade === 'attack') {
      choice.resultText = 'The cook\'s shouts alerted these guards too — they\'re already moving. You get nothing from the barrel. To arms!';
    } else {
      choice.resultText = 'You\'re a hair too slow — the guards catch you reaching. The barrel clatters over untouched. To arms!';
    }
  }
}

// Prison "rummage through barrel" choice (post-combat) — rolls the
// gear-barrel loot table at click time so the card renders on first display.
function resolveLootBarrel(choice) {
  const rolled = rollLootTable('gear_barrel_loot');
  const card = rolled && rolled[0];
  if (card) {
    player.deck.addCard(card, true);
    choice._lootItems = [card];
    prisonBarrelLooted = true;
    choice.resultText = `You rummage through the barrel and find: ${card.name}.`;
  } else {
    choice.resultText = 'You rummage through the barrel — but find nothing useful.';
  }
}

function resolveShortRest(choice) {
  // Out of combat: just reduce discard pile (simulates healing for next combat)
  const amount = choice.effectValue || 5;
  const healed = [];
  for (let i = 0; i < amount && player.deck.discardPile.length > 0; i++) {
    const card = player.deck.discardPile.pop();
    healed.push(card.name);
  }
  if (healed.length > 0) {
    choice.resultText = `You rest and feel strength returning. Heal ${healed.length}.`;
    spawnHealOnTarget(player, healed.length);
    showStyledToast(`+${healed.length} Healed`, 'heal', 2500);
  } else {
    choice.resultText = 'You rest, but you weren\'t hurt to begin with.';
  }
}

function drawEncounterChoice() {
  drawEncounterBg();

  // Title — same style as encounter text (40px bold Georgia with shadow)
  ctx.fillStyle = Colors.GOLD;
  ctx.font = 'bold 40px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0,0,0,0.9)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 2;
  ctx.fillText(currentEncounter.name, SCREEN_WIDTH / 2, 60);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  if (encounterChoiceResult) {
    const lootItems = encounterChoiceResult._lootItems;
    const hasLoot = Array.isArray(lootItems) && lootItems.length > 0;

    // Result text box: dynamically size to its content (keeps the loot row close to the text).
    const boxW = SCREEN_WIDTH - 200;
    const boxX = 100;
    const boxY = hasLoot ? 130 : 200;
    const lineHeight = 30;

    ctx.font = '21px Georgia, serif';
    const lines = wrapTextLong(encounterChoiceResult.resultText, boxW - 48, 21);

    // Compute box height: padding + text + optional damage line + bottom padding for "Click to continue"
    const hasDamageLine = encounterChoiceResult.effectType === 'damage' && encounterChoiceResult.effectValue > 0;
    const contentH = lines.length * lineHeight + (hasDamageLine ? 44 : 0);
    const verticalPad = hasLoot ? 28 : 40;
    const continueRowH = hasLoot ? 0 : 36; // continue prompt lives inside the box only when no loot
    const boxH = Math.max(hasLoot ? 100 : 340, contentH + verticalPad * 2 + continueRowH);

    ctx.fillStyle = 'rgba(0,0,0,0.82)';
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = Colors.GOLD;
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    ctx.fillStyle = Colors.WHITE;
    ctx.font = '21px Georgia, serif';
    ctx.textAlign = 'left';
    let textY = boxY + verticalPad + 18;
    for (const line of lines) {
      ctx.fillText(line, boxX + 24, textY);
      textY += lineHeight;
    }

    if (hasDamageLine) {
      ctx.fillStyle = Colors.RED;
      ctx.font = 'bold 21px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(`You take ${encounterChoiceResult.effectValue} damage!`, SCREEN_WIDTH / 2, textY + 20);
    }

    // Show looted cards side-by-side (Abandoned Camp search, etc.)
    if (hasLoot) {
      const cardW = 220;
      const cardH = 308;
      const gap = 32;
      const totalW = lootItems.length * cardW + (lootItems.length - 1) * gap;
      const startX = Math.floor((SCREEN_WIDTH - totalW) / 2);
      const lootY = boxY + boxH + 26;
      // "Received: X!" banner — yellow so it pops, sits above the cards
      // with breathing room below the text box.
      const receivedText = lootItems.length === 1
        ? `Received: ${lootItems[0].name}!`
        : `Received: ${lootItems.map(c => c.name).join(', ')}!`;
      ctx.fillStyle = Colors.GOLD;
      ctx.font = 'bold 24px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.95)';
      ctx.shadowBlur = 5;
      ctx.shadowOffsetY = 2;
      ctx.fillText(receivedText, SCREEN_WIDTH / 2, lootY + 14);
      ctx.restore();
      // Gold banner (only when gold was actually awarded — camp search etc.)
      if (encounterChoiceResult._lootGold > 0) {
        ctx.fillStyle = Colors.GOLD;
        ctx.font = 'bold 18px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText(`+${encounterChoiceResult._lootGold} Gold  (Total: ${gold})`, SCREEN_WIDTH / 2, lootY + 38);
      }
      const cardsStartY = encounterChoiceResult._lootGold > 0 ? lootY + 58 : lootY + 38;
      for (let i = 0; i < lootItems.length; i++) {
        const cx = startX + i * (cardW + gap);
        drawCard(lootItems[i], cx, cardsStartY, cardW, cardH, false, false, 'full');
      }
    }

    ctx.fillStyle = Colors.GRAY;
    ctx.font = '16px Georgia, serif';
    ctx.textAlign = 'center';
    const continueY = hasLoot ? SCREEN_HEIGHT - 40 : boxY + boxH - 24;
    ctx.fillText('Click to continue', SCREEN_WIDTH / 2, continueY);
  } else {
    // Show choices
    ctx.fillStyle = Colors.WHITE;
    ctx.font = '24px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('What do you do?', SCREEN_WIDTH / 2, 140);

    const rects = getChoiceRects();
    for (const r of rects) {
      const choice = r.choice;
      const exhausted = choice.exhausted;
      const hovered = !exhausted && hitTest(mouseX, mouseY, r);

      // Transparent background with white border
      ctx.fillStyle = exhausted ? 'rgba(40,40,40,0.6)' : (hovered ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.3)');
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = exhausted ? '#555' : (hovered ? Colors.WHITE : 'rgba(255,255,255,0.6)');
      ctx.lineWidth = 2;
      ctx.strokeRect(r.x, r.y, r.w, r.h);

      // Text
      ctx.font = '16px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (exhausted) {
        ctx.fillStyle = '#666';
        ctx.fillText(`${choice.text}  (Done)`, r.x + r.w / 2, r.y + r.h / 2);
      } else {
        ctx.fillStyle = hovered ? Colors.WHITE : 'rgba(255,255,255,0.85)';
        ctx.fillText(choice.text, r.x + r.w / 2, r.y + r.h / 2);
      }
      ctx.textBaseline = 'alphabetic';
    }
  }

  ctx.textAlign = 'left';
}

// ============================================================
// ENCOUNTER LOOT
// ============================================================

function handleEncounterLootClick() {
  if (pendingLevelUp) {
    pendingLevelUp = false;
    // Level up: offer ability choices
    abilityChoices = getAbilityChoices(selectedClass, 3);
    state = GameState.ABILITY_SELECT;
    return;
  }
  currentEncounter.advancePhase();
  advanceEncounterPhase();
}

function drawEncounterLoot() {
  drawEncounterBg();

  ctx.fillStyle = Colors.GOLD;
  ctx.font = 'bold 40px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0,0,0,0.9)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 2;
  ctx.fillText('Loot!', SCREEN_WIDTH / 2, 150);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  const phase = currentEncounter.currentPhase;
  let y = 230;

  if (phase._lootGoldAmount > 0) {
    ctx.fillStyle = Colors.GOLD;
    ctx.font = '21px Georgia, serif';
    ctx.fillText(`+${phase._lootGoldAmount} Gold  (Total: ${gold})`, SCREEN_WIDTH / 2, y);
    y += 26;
    // Lucky Find perk flourish: shows as its own line so the player can
    // see that the perk contributed extra gold.
    if (phase._lootLuckyFindBonus > 0) {
      ctx.fillStyle = '#ffe066';
      ctx.font = 'bold 17px Georgia, serif';
      ctx.fillText(`Lucky Find!  +${phase._lootLuckyFindBonus} gold`, SCREEN_WIDTH / 2, y);
      y += 22;
    }
    y += 18;
  }

  // Draw looted cards full-size with art (and side preview for cards that summon).
  const lootedCards = phase._lootedCards || [];
  if (lootedCards.length > 0) {
    ctx.fillStyle = Colors.WHITE;
    ctx.font = '21px Georgia, serif';
    ctx.fillText('Cards added to your deck:', SCREEN_WIDTH / 2, y);
    y += 24;
    const cardW = 240;
    const cardH = 336;
    const sideW = COMBAT_POWER_W;
    const sideH = COMBAT_POWER_H;
    const sideGap = 10;
    // Calculate total width including side previews so the row stays centered
    let totalW = 0;
    for (const c of lootedCards) {
      const has = c.previewCard || c.previewCreature;
      totalW += cardW + (has ? sideGap + sideW : 0);
    }
    const groupGap = 24;
    totalW += (lootedCards.length - 1) * groupGap;
    let cx = Math.floor((SCREEN_WIDTH - totalW) / 2);
    for (let i = 0; i < lootedCards.length; i++) {
      const card = lootedCards[i];
      drawCard(card, cx, y, cardW, cardH, false, false, 'full');
      cx += cardW;
      if (card.previewCard) {
        const sx = cx + sideGap;
        const sy = y + Math.floor((cardH - sideH) / 2);
        drawCard(card.previewCard, sx, sy, sideW, sideH, false, false);
        cx += sideGap + sideW;
      } else if (card.previewCreature) {
        const sx = cx + sideGap;
        const sy = y + Math.floor((cardH - sideH) / 2);
        card.previewCreature._sourceRarity = card.rarity || 'common';
        card.previewCreature._sourceSubtype = card.subtype || '';
        drawCreatureMiniCard(card.previewCreature, { x: sx, y: sy, w: sideW, h: sideH }, true);
        cx += sideGap + sideW;
      }
      cx += groupGap;
    }
    y += cardH + 20;
  } else if (phase.lootCards.length > 0) {
    // Fallback for unregistered card IDs
    ctx.fillStyle = Colors.WHITE;
    ctx.font = '18px sans-serif';
    for (const cardId of phase.lootCards) {
      ctx.fillText(`New card: ${cardId}`, SCREEN_WIDTH / 2, y);
      y += 30;
    }
  }

  ctx.fillStyle = Colors.GRAY;
  ctx.font = '16px sans-serif';
  ctx.fillText('Click to continue', SCREEN_WIDTH / 2, SCREEN_HEIGHT - 100);
  ctx.textAlign = 'left';
}

// ============================================================
// COMBAT
// ============================================================

function startCombat() {
  combatLog = [];
  combatLogScrollY = 0;
  isPlayerTurn = true;
  selectedCardIndex = -1;
  enemyActions = [];
  enemyArrow = null;
  enemyActionIndex = 0;
  enemyActionTimer = 0;
  attacksThisTurn = 0;
  feralSwipeMode = false;
  feralSwipeShieldGranted = 0;
  powerRechargeMode = false;
  killCount = 0;
  killTarget = enemy._killTarget || 0;
  survivalRounds = enemy._survivalRounds || 0;
  enemyTurnNumber = 0;

  const hs = getPlayerHandSize();
  player.deck.startCombat(hs, MAX_HAND_SIZE);
  const enemyStartHand = enemy._handSize || 2;
  enemy.deck.startCombat(enemyStartHand, 10);

  addLog('--- Combat Start ---', Colors.GOLD);
  addLog(`${player.name} vs ${enemy.name}`, Colors.WHITE);
  addLog(`${enemy.name} draws ${enemy.deck.hand.length} cards`, Colors.GRAY);

  // Apply perk effects at combat start
  applyPerksCombatStart();

  addLog(`Your turn! Play cards from your hand.`, Colors.GREEN);

  // Trigger combat intro splash showing the enemy
  combatIntroTimer = 3000; // 3 seconds
  if (killTarget > 0) {
    combatIntroMessage = `Defeat ${killTarget} enemies!`;
  } else if (survivalRounds > 0) {
    combatIntroMessage = `Survive ${survivalRounds} rounds!`;
  } else {
    combatIntroMessage = `Combat with ${enemy.name}!`;
  }

  state = GameState.COMBAT;
}

function upgradeCompanions() {
  // Swap thorb_card → thorb_card_2 in deck and backpack
  const upgrades = { thorb_card: createThorbUpgradedCard };
  for (const [oldId, creator] of Object.entries(upgrades)) {
    // Check master deck
    const deckIdx = player.deck.masterDeck.findIndex(c => c.id === oldId);
    if (deckIdx !== -1) {
      player.deck.masterDeck[deckIdx] = creator();
      addLog(`  Companion upgraded: Thorb!`, Colors.GOLD);
    }
    // Check backpack
    const bpIdx = backpack.findIndex(c => c.id === oldId);
    if (bpIdx !== -1) {
      backpack[bpIdx] = creator();
    }
  }
}

function applyPerksCombatStart() {
  // Shield perk
  const shieldStacks = player.getPerkStacks('combat_start_shield');
  if (shieldStacks > 0) {
    player.shield += shieldStacks;
    addLog(`  Tough: +${shieldStacks} Shield!`, Colors.ALLY_BLUE, perkToCardLike(createToughPerk()));
    spawnTokenOnTarget(player, shieldStacks, 'Shield', Colors.ALLY_BLUE);
  }
  // Heroism perk
  const heroismStacks = player.getPerkStacks('combat_start_heroism');
  if (heroismStacks > 0) {
    player.heroism += heroismStacks;
    addLog(`  Prepared: +${heroismStacks} Heroism!`, Colors.GOLD, perkToCardLike(createPreparedPerk()));
    spawnTokenOnTarget(player, heroismStacks, 'Heroism', Colors.GOLD);
  }
  // First Strike perk
  const firstStrike = player.getPerkStacks('combat_start_first_strike');
  if (firstStrike > 0) {
    const fsPerk = perkToCardLike(createFirstStrikePerk());
    const targets = enemy.creatures.filter(c => c.isAlive);
    if (targets.length > 0) {
      const t = targets[Math.floor(Math.random() * targets.length)];
      t.takeUnpreventableDamage(firstStrike);
      addLog(`  First Strike: ${firstStrike} dmg to ${t.name}!`, Colors.GOLD, fsPerk);
      if (!t.isAlive) { addLog(`  ${t.name} destroyed!`, Colors.GOLD); countAndRemoveDeadCreatures(); }
    } else if (enemy.isAlive) {
      enemy.takeDamageFromDeck(firstStrike);
      addLog(`  First Strike: ${firstStrike} dmg to ${enemy.name}!`, Colors.GOLD, fsPerk);
    }
  }
}

function applyPerksStartOfTurn() {
  const hand = player.deck.hand;
  // Arsenal: draw if no weapon in hand
  const arsenalStacks = player.getPerkStacks('turn_start_no_weapon_draw');
  if (arsenalStacks > 0) {
    const hasWeapon = hand.some(c => c.subtype && (c.subtype.includes('martial') || c.subtype === 'ranged' || c.subtype === 'weapon' || c.subtype === 'simple' || c.subtype === 'wand'));
    if (!hasWeapon) {
      const drawn = player.deck.draw(arsenalStacks, MAX_HAND_SIZE);
      for (const d of drawn) addLog(`  Arsenal: Draw ${d.name}`, Colors.BLUE, d);
    }
  }
  // Talented: draw if no ability in hand
  const talentedStacks = player.getPerkStacks('turn_start_no_ability_draw');
  if (talentedStacks > 0) {
    const hasAbility = hand.some(c => c.cardType === CardType.ABILITY || c.subtype === 'ability');
    if (!hasAbility) {
      const drawn = player.deck.draw(talentedStacks, MAX_HAND_SIZE);
      for (const d of drawn) addLog(`  Talented: Draw ${d.name}`, Colors.BLUE, d);
    }
  }
}

// --- Card layout ---
// Hand cards are 2/3 the size of the character card. Bumped ~7 % for a
// slightly larger visual zoom (was 147x200).
const CARD_W = 157;
const CARD_H = 214;
const CARD_GAP = 8;

function getHandCardRects(hand) {
  // Hand is positioned to the right of the player character card,
  // within the left "game area" (excluding the right column).
  // Cards stack/overlap when there are too many to fit at full spacing,
  // matching the py game's formula.
  const charRect = getCharacterCardRect(true);
  const handAreaX = charRect.x + charRect.w + 24;
  const handAreaW = COMBAT_LEFT_W - handAreaX - 16;
  const total = hand.length;
  const y = SCREEN_HEIGHT - CARD_H - 20;

  if (total === 0) return [];

  // Spacing formula matches the py game: ideal = card width + 12;
  // when too many cards, shrink down to a minimum of ~50 visible px per card.
  const idealSpacing = CARD_W + CARD_GAP;
  const MIN_VISIBLE = 50;
  let spacing;
  if (total <= 1) {
    spacing = idealSpacing;
  } else {
    const maxSpacingForFit = (handAreaW - CARD_W) / (total - 1);
    spacing = Math.min(idealSpacing, Math.max(MIN_VISIBLE, maxSpacingForFit));
  }

  // Center the laid-out hand within its area when there's room.
  const totalW = (total - 1) * spacing + CARD_W;
  const startX = totalW > handAreaW
    ? handAreaX
    : handAreaX + (handAreaW - totalW) / 2;

  return hand.map((_, i) => ({
    x: startX + i * spacing,
    y, w: CARD_W, h: CARD_H,
  }));
}

// Hover/click hit area: only the visible portion of an overlapping card.
// The last card is fully visible; others are clipped to their next neighbor.
function getHandCardHoverRect(rects, index) {
  const r = rects[index];
  if (index === rects.length - 1) return r;
  const next = rects[index + 1];
  return { x: r.x, y: r.y, w: Math.max(8, next.x - r.x), h: r.h };
}

// Compute the (x, y) for a slot in a creature grid placed to the right of a character card.
// Enemies use 2 rows of 6 starting at the top of the enemy character card.
// Players use 1 row of 6 aligned with the player power row (bottom of the row sits
// at the same y as the bottom of the power cards, just above the player character card).
function getCreatureSlotRect(ownerIsPlayer, slot) {
  const charRect = getCharacterCardRect(ownerIsPlayer);
  const startX = charRect.x + charRect.w + 16;
  const startY = ownerIsPlayer
    ? charRect.y - CREATURE_CARD_H - 1 // aligned with the power row, just above the char card (5 px lower than before)
    : charRect.y;                      // top of the enemy character card
  const col = slot % CREATURE_COLS;
  const row = Math.floor(slot / CREATURE_COLS);
  const x = startX + col * (CREATURE_CARD_W + CREATURE_GRID_GAP);
  const y = startY + row * (CREATURE_CARD_H + CREATURE_GRID_GAP);
  return { x, y, w: CREATURE_CARD_W, h: CREATURE_CARD_H };
}

function getEnemyCreatureRects() {
  const creatures = enemy.creatures;
  if (creatures.length === 0) return [];
  return creatures.map((c, i) => {
    const slot = (c.slot >= 0 ? c.slot : i);
    return getCreatureSlotRect(false, slot);
  });
}

function getPlayerCreatureRects() {
  const creatures = player.creatures;
  if (creatures.length === 0) return [];
  return creatures.map((c, i) => {
    const slot = (c.slot >= 0 ? c.slot : i);
    return getCreatureSlotRect(true, slot);
  });
}

// --- Drawing cards ---
// Keyword → icon image key + tooltip definition
const KEYWORD_ICONS = {
  heroism: { iconKey: 'icon_heroism', label: 'Heroism', desc: 'Bonus damage to next attack (consumed)' },
  shield: { iconKey: 'icon_shield', label: 'Shield', desc: 'Absorbs damage before HP. Persists between turns.' },
  shields: { iconKey: 'icon_shield', label: 'Shield', desc: 'Absorbs damage before HP. Persists between turns.' },
  armor: { iconKey: 'icon_armor', label: 'Armor', desc: 'Absorbs damage from each hit (permanent)' },
  fire: { iconKey: 'icon_fire', label: 'Fire', desc: 'Deals damage equal to stacks each turn, decays by 1' },
  ice: { iconKey: 'icon_ice', label: 'Ice', desc: 'Reduces damage dealt by stacks, decays by 1' },
  poison: { iconKey: 'icon_poison', label: 'Poison', desc: 'Deals damage equal to stacks each turn. Only removed by healing.' },
  shock: { iconKey: 'icon_shock', label: 'Shock', desc: '-1 dmg dealt and +1 dmg taken per stack' },
  rage: { iconKey: 'icon_rage', label: 'Rage', desc: 'Permanent bonus damage to all attacks' },
  scry: { isTextKeyword: true, color: '#7ec8ff', label: 'Scry N', desc: 'Look at the top N cards. Pick 1 to draw, recharge the rest.' },
  heal: { isTextKeyword: true, color: '#7cff9c', label: 'Heal N', desc: 'Restore up to N cards from your discard pile. If you have Poison, each stack is cleared first (1 heal = 1 Poison removed); any leftover heals cards.' },
  sentinel: { isTextKeyword: true, color: '#c8a060', label: 'Sentinel', desc: 'Attacks must target this creature first while it is alive.' },
};

// Trigger badges used on perk cards. Emitted as `{ type: 'badge' }` tokens
// from the leading "Combat Start:", "Turn Start:", etc. prefix. Color-
// coded by category: combat (green) vs turn (blue).
const PERK_TRIGGER_BADGES = [
  // NOTE: order matters — "Combat Start" / "Combat End" must be checked
  // before the bare "Combat:" pattern so the more specific prefix wins.
  { re: /^Combat Start:\s*/, label: 'COMBAT START', bg: 'rgba(60,110,80,0.92)',  border: '#7ec89a', fg: '#c8ffd0' },
  { re: /^Combat End:\s*/,   label: 'COMBAT END',   bg: 'rgba(60,110,80,0.92)',  border: '#7ec89a', fg: '#c8ffd0' },
  { re: /^Combat:\s*/,       label: 'COMBAT',       bg: 'rgba(60,110,80,0.92)',  border: '#7ec89a', fg: '#c8ffd0' },
  { re: /^Turn Start:\s*/,   label: 'TURN START',   bg: 'rgba(60,90,130,0.92)',  border: '#9ad6ff', fg: '#d6ecff' },
  { re: /^Turn End:\s*/,     label: 'TURN END',     bg: 'rgba(60,90,130,0.92)',  border: '#9ad6ff', fg: '#d6ecff' },
  // Loot: fires at combat-end gold award (Lucky Find). Yellow/gold palette.
  { re: /^Loot:\s*/,         label: 'LOOT',         bg: 'rgba(130,100,30,0.92)', border: '#ffe066', fg: '#fff3b8' },
];

// Tokenize text into words and inline icons/badges.
// Returns array of { type: 'text'|'icon'|'kwtext'|'badge', ... }
//
// opts.asPerk — when true, detect a leading trigger prefix and emit it as
// a 'badge' token. All other icon/kwtext substitutions still apply EXCEPT
// for "Armor" — on perk cards that word refers to the card category
// (e.g. Balanced: "1 Weapon, 1 Armor and 1 Ability in hand"), so we keep
// it as plain text. Shield / Heroism / Fire / etc. still iconize, and
// Heal N / Scry N still colorize with hover tooltips.
function tokenizeKeywordText(text, opts = {}) {
  const tokens = [];

  if (opts.asPerk) {
    for (const t of PERK_TRIGGER_BADGES) {
      const m = text.match(t.re);
      if (m) {
        tokens.push({ type: 'badge', label: t.label, bg: t.bg, border: t.border, fg: t.fg });
        text = text.slice(m[0].length);
        // The \s* in the regex greedily ate the trailing space, so the
        // remaining text now starts with a word (e.g. "Heal 1.") — the
        // badge would butt right into it. Re-inject a single leading
        // space. It SURVIVES the line-leading-whitespace guard in
        // drawIconText because the badge unit is emitted first, so by
        // the time the space is laid out, line.width > 0.
        text = ' ' + text;
        break;
      }
    }
  }

  // Match keywords (case-sensitive whole word) - longest first to avoid
  // partial matches. "Scry N" and "Heal N" capture the number with the
  // keyword. In perk mode we drop "Armor" from the list so the word
  // stays as literal text (refers to card category).
  const isPerk = !!opts.asPerk;
  const keywordList = ['Scry\\s+\\d+', 'Heal\\s+\\d+', 'Heroism', 'Shields', 'Shield',
    ...(isPerk ? [] : ['Armor']),
    'Fire', 'Ice', 'Poison', 'Shock', 'Rage', 'Sentinel'];
  const pattern = new RegExp(`\\b(${keywordList.join('|')})\\b`, 'g');
  let lastIdx = 0;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIdx) {
      tokens.push({ type: 'text', text: text.slice(lastIdx, match.index) });
    }
    const raw = match[1];
    const kw = raw.toLowerCase().split(/\s/)[0];
    const info = KEYWORD_ICONS[kw];
    if (info && info.isTextKeyword) {
      tokens.push({ type: 'kwtext', keyword: kw, text: raw, color: info.color });
    } else if (info) {
      tokens.push({ type: 'icon', keyword: kw, iconKey: info.iconKey });
    } else {
      tokens.push({ type: 'text', text: raw });
    }
    lastIdx = match.index + raw.length;
  }
  if (lastIdx < text.length) {
    tokens.push({ type: 'text', text: text.slice(lastIdx) });
  }
  return tokens;
}

// Measure the width of a perk trigger badge (pill) — shared by count /
// draw so layout stays in sync with rendering.
// Tighter padding (8 total internal + trailing gap handled separately)
// so the pill doesn't dominate the first line of a short description.
function measurePerkBadgeWidth(label, fontSize) {
  const badgeFont = Math.max(9, Math.floor(fontSize * 0.8));
  ctx.font = `bold ${badgeFont}px sans-serif`;
  return Math.ceil(ctx.measureText(label).width) + 10;
}

// Count how many lines text would wrap to (matches drawIconText layout)
function countWrappedLines(text, maxWidth, fontSize, opts = {}) {
  const tokens = tokenizeKeywordText(text, opts);
  const iconSize = Math.floor(fontSize * 1.3);
  // Reset font before EVERY measureText call — measurePerkBadgeWidth
  // leaves it in bold otherwise, making the layout math disagree with
  // what drawIconText eventually renders. Missing this reset is what
  // caused perk descriptions to collapse spacing between words.
  const bodyFont = `${fontSize}px sans-serif`;
  ctx.font = bodyFont;
  const units = [];
  for (const tok of tokens) {
    if (tok.type === 'icon') {
      units.push({ type: 'icon', width: iconSize });
    } else if (tok.type === 'badge') {
      units.push({ type: 'badge', width: measurePerkBadgeWidth(tok.label, fontSize) + 3 });
    } else if (tok.type === 'kwtext') {
      ctx.font = bodyFont;
      units.push({ type: 'text', text: tok.text, width: ctx.measureText(tok.text).width });
    } else {
      const parts = tok.text.split(/(\s+)/);
      for (const p of parts) {
        if (p) {
          ctx.font = bodyFont;
          units.push({ type: 'text', text: p, width: ctx.measureText(p).width });
        }
      }
    }
  }
  let lines = 1;
  let lineW = 0;
  for (const u of units) {
    if (u.type === 'text' && /^\s+$/.test(u.text || '') && lineW === 0) continue;
    if (lineW + u.width > maxWidth && lineW > 0) {
      lines++;
      lineW = u.type === 'text' && /^\s+$/.test(u.text || '') ? 0 : u.width;
    } else {
      lineW += u.width;
    }
  }
  return lines;
}

// Render text with inline icons, word-wrapped within maxWidth, centered.
// Returns total height used.
// opts.asPerk — tokenize as perk (trigger badge prefix, no keyword icons).
function drawIconText(text, centerX, startY, maxWidth, fontSize, color = '#eee', opts = {}) {
  const tokens = tokenizeKeywordText(text, opts);
  const iconSize = Math.floor(fontSize * 1.3);
  const lineH = Math.max(fontSize + 4, iconSize + 2);
  ctx.font = `${fontSize}px sans-serif`;

  // Build word-level units (split text tokens on whitespace)
  const units = [];
  for (const tok of tokens) {
    if (tok.type === 'icon' || tok.type === 'kwtext' || tok.type === 'badge') {
      units.push(tok);
    } else {
      const parts = tok.text.split(/(\s+)/);
      for (const p of parts) {
        if (p) units.push({ type: 'text', text: p });
      }
    }
  }

  // Measure unit widths. CRITICAL: reset ctx.font BEFORE every text
  // measurement — measurePerkBadgeWidth flips the font to bold to size
  // the pill label, and if we don't reset it, subsequent text units get
  // measured at the wrong weight. That's what caused perk descriptions
  // to render with collapsed word spacing (cx advanced by the bold-
  // metric space width, but fillText drew the regular font, so each
  // word slid over the previous one).
  for (const u of units) {
    if (u.type === 'icon') {
      u.width = iconSize;
    } else if (u.type === 'badge') {
      u.width = measurePerkBadgeWidth(u.label, fontSize) + 3; // +3 = trailing gap after badge (combined with the injected " " → ~7 px total)
    } else {
      ctx.font = `${fontSize}px sans-serif`;
      u.width = ctx.measureText(u.text).width;
    }
  }

  // Lay out into lines
  const lines = []; // each line: { units: [], width }
  let line = { units: [], width: 0 };
  for (const u of units) {
    // Skip leading whitespace on a line
    if (u.type === 'text' && /^\s+$/.test(u.text) && line.width === 0) continue;
    if (line.width + u.width > maxWidth && line.units.length > 0) {
      lines.push(line);
      line = { units: [], width: 0 };
      if (u.type === 'text' && /^\s+$/.test(u.text)) continue;
    }
    line.units.push(u);
    line.width += u.width;
  }
  if (line.units.length > 0) lines.push(line);

  // Draw lines
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    let cx = centerX - ln.width / 2;
    const cy = startY + i * lineH + lineH / 2;
    for (const u of ln.units) {
      if (u.type === 'icon') {
        const img = images[u.iconKey];
        if (img) {
          ctx.drawImage(img, cx, cy - iconSize / 2, iconSize, iconSize);
        } else {
          // Fallback: draw colored box
          ctx.fillStyle = '#888';
          ctx.fillRect(cx, cy - iconSize / 2, iconSize, iconSize);
          ctx.fillStyle = color;
        }
        // Register hit area for tooltip
        iconHitAreas.push({
          x: cx, y: cy - iconSize / 2, w: iconSize, h: iconSize,
          keyword: u.keyword,
        });
        cx += u.width;
      } else if (u.type === 'badge') {
        // Trigger badge rendered inline at the start of a perk description.
        // Pill with tinted background and colored border. Font is ~80% of
        // the body text so the pill tucks into the line without shouting.
        const badgeFont = Math.max(9, Math.floor(fontSize * 0.8));
        const padX = 5;
        const pillW = u.width - 3; // trailing cosmetic gap (~7 px total badge-to-text once the injected leading space is added in)
        // Pill height tracks the body line height exactly — same top + bottom
        // as neighboring text so the baseline of the badge label and the
        // neighboring text sit on the same visual row. Nudged 1 px up so
        // the pill's midline reads slightly above the body-text baseline
        // (the label's vertical weight sits visually higher than lowercase
        // letters otherwise).
        const pillH = fontSize + 2;
        const pillX = cx;
        const pillY = cy - pillH / 2 - 1;
        ctx.fillStyle = u.bg;
        ctx.fillRect(pillX, pillY, pillW, pillH);
        ctx.strokeStyle = u.border;
        ctx.lineWidth = 1;
        ctx.strokeRect(pillX, pillY, pillW, pillH);
        ctx.fillStyle = u.fg;
        ctx.font = `bold ${badgeFont}px sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        // Draw label centered inside the pill. Pill midline is at cy-1
        // (see pillY offset above), so the label's vertical center sits
        // 1 px above the neighboring text's middle — visually aligned
        // without looking sunken.
        ctx.fillText(u.label, pillX + padX, cy - 1);
        // Reset font + color for subsequent units on this line.
        ctx.font = `${fontSize}px sans-serif`;
        ctx.fillStyle = color;
        cx += u.width;
      } else if (u.type === 'kwtext') {
        // Colored keyword text (e.g. "Scry 2") with a hover tooltip
        ctx.fillStyle = u.color || color;
        ctx.fillText(u.text, cx, cy);
        iconHitAreas.push({
          x: cx, y: cy - iconSize / 2, w: u.width, h: iconSize,
          keyword: u.keyword,
        });
        ctx.fillStyle = color;
        cx += u.width;
      } else {
        ctx.fillStyle = color;
        ctx.fillText(u.text, cx, cy);
        cx += u.width;
      }
    }
  }
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  return lines.length * lineH;
}

function drawIconTooltip() {
  for (const area of iconHitAreas) {
    if (!hitTest(mouseX, mouseY, area)) continue;
    const info = KEYWORD_ICONS[area.keyword];
    if (!info) return;
    // Draw 2-line tooltip: bold label + description
    ctx.font = 'bold 13px sans-serif';
    const labelW = ctx.measureText(info.label).width;
    ctx.font = '12px sans-serif';
    const descW = ctx.measureText(info.desc).width;
    const padX = 8, padY = 6;
    const boxW = Math.max(labelW, descW) + padX * 2;
    const boxH = 36 + padY * 2;
    let bx = area.x + area.w / 2 - boxW / 2;
    let by = area.y - boxH - 6;
    if (bx + boxW > SCREEN_WIDTH) bx = SCREEN_WIDTH - boxW - 4;
    if (bx < 4) bx = 4;
    if (by < 4) by = area.y + area.h + 6;

    ctx.fillStyle = 'rgba(10,10,30,0.95)';
    ctx.fillRect(bx, by, boxW, boxH);
    ctx.strokeStyle = Colors.GOLD;
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, boxW, boxH);

    ctx.fillStyle = Colors.GOLD;
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(info.label, bx + boxW / 2, by + padY + 12);

    ctx.fillStyle = '#ddd';
    ctx.font = '12px sans-serif';
    ctx.fillText(info.desc, bx + boxW / 2, by + padY + 30);

    ctx.textAlign = 'left';
    return;
  }
}

// Left-aligned variant of drawIconText for help/multi-line content
function drawIconTextLeft(text, startX, startY, maxWidth, fontSize, color = '#eee') {
  const tokens = tokenizeKeywordText(text);
  const iconSize = Math.floor(fontSize * 1.3);
  const lineH = Math.max(fontSize + 4, iconSize + 2);
  ctx.font = `${fontSize}px Georgia, serif`;

  const units = [];
  for (const tok of tokens) {
    if (tok.type === 'icon' || tok.type === 'kwtext') {
      units.push(tok);
    } else {
      const parts = tok.text.split(/(\s+)/);
      for (const p of parts) {
        if (p) units.push({ type: 'text', text: p });
      }
    }
  }
  for (const u of units) {
    if (u.type === 'icon') u.width = iconSize;
    else u.width = ctx.measureText(u.text).width;
  }

  // Lay out into lines (left aligned with hanging indent of 0)
  const lines = [];
  let line = { units: [], width: 0 };
  for (const u of units) {
    if (u.type === 'text' && /^\s+$/.test(u.text) && line.width === 0) continue;
    if (line.width + u.width > maxWidth && line.units.length > 0) {
      lines.push(line);
      line = { units: [], width: 0 };
      if (u.type === 'text' && /^\s+$/.test(u.text)) continue;
    }
    line.units.push(u);
    line.width += u.width;
  }
  if (line.units.length > 0) lines.push(line);

  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    let cx = startX;
    const cy = startY + i * lineH + lineH / 2;
    for (const u of ln.units) {
      if (u.type === 'icon') {
        const img = images[u.iconKey];
        if (img) {
          ctx.drawImage(img, Math.round(cx), Math.round(cy - iconSize / 2), iconSize, iconSize);
        } else {
          ctx.fillStyle = '#888';
          ctx.fillRect(cx, cy - iconSize / 2, iconSize, iconSize);
          ctx.fillStyle = color;
        }
        iconHitAreas.push({
          x: cx, y: cy - iconSize / 2, w: iconSize, h: iconSize,
          keyword: u.keyword,
        });
        cx += u.width;
      } else if (u.type === 'kwtext') {
        ctx.fillStyle = u.color || color;
        ctx.fillText(u.text, Math.round(cx), Math.round(cy));
        iconHitAreas.push({
          x: cx, y: cy - iconSize / 2, w: u.width, h: iconSize,
          keyword: u.keyword,
        });
        ctx.fillStyle = color;
        cx += u.width;
      } else {
        ctx.fillStyle = color;
        ctx.fillText(u.text, Math.round(cx), Math.round(cy));
        cx += u.width;
      }
    }
  }
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  return lines.length * lineH;
}

function drawBadgeTooltip() {
  for (const area of cardBadgeHitAreas) {
    if (!hitTest(mouseX, mouseY, area)) continue;
    // Draw small tooltip above the badge
    ctx.font = 'bold 13px sans-serif';
    const tw = ctx.measureText(area.label).width;
    const padX = 8, padY = 4;
    const boxW = tw + padX * 2;
    const boxH = 13 + padY * 2;
    let bx = area.x + area.w / 2 - boxW / 2;
    let by = area.y - boxH - 4;
    if (bx + boxW > SCREEN_WIDTH) bx = SCREEN_WIDTH - boxW - 4;
    if (bx < 4) bx = 4;
    if (by < 4) by = area.y + area.h + 4;

    ctx.fillStyle = 'rgba(10,10,30,0.95)';
    ctx.fillRect(bx, by, boxW, boxH);
    ctx.strokeStyle = Colors.GOLD;
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, boxW, boxH);
    ctx.fillStyle = Colors.WHITE;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(area.label, bx + boxW / 2, by + boxH / 2 + 1);
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    return; // only show one tooltip
  }
}

// Get the border color for a card based on subtype (falls back to card type)
function getSubtypeLabel(card) {
  // Perk pseudo-cards override the standard subtype label: they're not
  // abilities the player plays — they're permanent buffs, so show "Perk"
  // (or "Perk — Unique" for the unique-tier perks).
  if (card && card._isPerk) {
    return card._perkUnique ? 'Perk — Unique' : 'Perk';
  }
  const sub = (card.subtype || '').toLowerCase();
  const LABELS = {
    clothing: 'Clothing', light_armor: 'Light Armor', heavy_armor: 'Heavy Armor',
    martial: 'Martial', simple: 'Simple', martial_2h: '2H Martial',
    ranged: 'Ranged', ranged_2h: '2H Ranged',
    staff: 'Staff', wand: 'Wand',
    ability: 'Ability', ally: 'Ally', allies: 'Ally', companion: 'Companion',
    item: 'Item', potion: 'Potion', food: 'Food', scroll: 'Scroll', relic: 'Relic',
    shield: 'Shield', weapon: 'Weapon', buff: 'Buff',
  };
  if (LABELS[sub]) return LABELS[sub];
  // Fallback to cardType
  const type = (card.cardType || '').toUpperCase();
  if (type === 'ATTACK') return 'Attack';
  if (type === 'DEFENSE') return 'Defense';
  if (type === 'ABILITY') return 'Ability';
  if (type === 'CREATURE') return 'Ally';
  if (type === 'ITEM') return 'Item';
  return sub || null;
}

function getCardBorderColor(card) {
  if (card.subtype && SUBTYPE_COLORS[card.subtype]) return SUBTYPE_COLORS[card.subtype];
  return CARD_COLORS[card.cardType] || '#666';
}

// Wrap a card name onto at most 2 lines that fit within maxWidth. Returns an
// array of 1 or 2 strings. If the name can't be split cleanly (single word
// that's too long), returns the original name as a single line — the caller
// can still draw it and let it clip rather than mangle.
// Requires ctx.font to already be set to the name font.
function wrapCardName(name, maxWidth, ctx) {
  if (ctx.measureText(name).width <= maxWidth) return [name];
  const words = name.split(' ');
  if (words.length === 1) return [name]; // single word: just let it draw
  // Pick the split point that best balances line widths while keeping each line
  // under maxWidth.
  let bestSplit = -1;
  let bestDiff = Infinity;
  for (let i = 1; i < words.length; i++) {
    const line1 = words.slice(0, i).join(' ');
    const line2 = words.slice(i).join(' ');
    const w1 = ctx.measureText(line1).width;
    const w2 = ctx.measureText(line2).width;
    if (w1 > maxWidth || w2 > maxWidth) continue;
    const diff = Math.abs(w1 - w2);
    if (diff < bestDiff) { bestDiff = diff; bestSplit = i; }
  }
  if (bestSplit === -1) return [name]; // nothing fit — fall back to single line
  return [words.slice(0, bestSplit).join(' '), words.slice(bestSplit).join(' ')];
}

// Draw a 9-slice stretched frame onto a rect. Corners stay crisp; edges stretch
// along one axis; the center is left as-is from the PNG (transparent in our
// frames, so the underlying card art shows through).
// `corner` is the source-pixel corner size — tune per frame image.
function draw9SliceFrame(img, dx, dy, dw, dh, corner) {
  if (!img) return;
  const iw = img.width, ih = img.height;
  const c = Math.max(1, Math.min(corner, Math.floor(iw / 2), Math.floor(ih / 2)));
  const srcEdgeW = iw - c * 2;
  const srcEdgeH = ih - c * 2;
  const dstEdgeW = Math.max(0, dw - c * 2);
  const dstEdgeH = Math.max(0, dh - c * 2);
  // Corners (no stretch)
  ctx.drawImage(img, 0,      0,      c, c, dx,            dy,            c, c); // TL
  ctx.drawImage(img, iw - c, 0,      c, c, dx + dw - c,   dy,            c, c); // TR
  ctx.drawImage(img, 0,      ih - c, c, c, dx,            dy + dh - c,   c, c); // BL
  ctx.drawImage(img, iw - c, ih - c, c, c, dx + dw - c,   dy + dh - c,   c, c); // BR
  // Horizontal edges (stretch X)
  if (dstEdgeW > 0 && srcEdgeW > 0) {
    ctx.drawImage(img, c, 0,      srcEdgeW, c, dx + c, dy,          dstEdgeW, c);
    ctx.drawImage(img, c, ih - c, srcEdgeW, c, dx + c, dy + dh - c, dstEdgeW, c);
  }
  // Vertical edges (stretch Y)
  if (dstEdgeH > 0 && srcEdgeH > 0) {
    ctx.drawImage(img, 0,      c, c, srcEdgeH, dx,            dy + c, c, dstEdgeH);
    ctx.drawImage(img, iw - c, c, c, srcEdgeH, dx + dw - c,   dy + c, c, dstEdgeH);
  }
}

// Which frame asset to use for a given rarity string. Three tiers:
//   common (or unrated) → frame_common
//   uncommon            → frame_uncommon
//   rare / epic / legendary → frame_rare
const _RARE_OR_HIGHER = new Set(['rare', 'epic', 'legendary']);
function getFrameKeyForRarity(rarity) {
  const r = (rarity || '').toLowerCase();
  if (_RARE_OR_HIGHER.has(r)) return 'frame_rare';
  if (r === 'uncommon')       return 'frame_uncommon';
  return 'frame_common';
}
function getCardFrameKey(card) {
  return getFrameKeyForRarity(card && card.rarity);
}

// Per-frame intrinsic base color — what the frame PNG looks like before the
// subtype tint overlay. The accent helpers blend this with the subtype
// color (75 % base + 25 % tint) so outlines visibly read as the rendered
// frame. Common/uncommon are bronze-gold; rare is a cool blue.
const FRAME_BASE_COLORS = {
  frame_common:   { r: 255, g: 215, b:   0 }, // gold #ffd700
  frame_uncommon: { r: 255, g: 215, b:   0 },
  frame_rare:     { r:  80, g: 130, b: 220 }, // blue baked into FrameRare.png
};

// Approximate the visible color of the tinted frame for UI accents (name
// bar stroke, description box outline, subtype label) so they read as part
// of the same theme. 75/25 frameBase/subtype blend.
function getFrameAccentColorFromHex(tintHex, frameKey = 'frame_common') {
  const base = FRAME_BASE_COLORS[frameKey] || FRAME_BASE_COLORS.frame_common;
  if (!tintHex) return `rgb(${base.r},${base.g},${base.b})`;
  const tr = parseInt(tintHex.slice(1, 3), 16);
  const tg = parseInt(tintHex.slice(3, 5), 16);
  const tb = parseInt(tintHex.slice(5, 7), 16);
  const r = Math.round(base.r * 0.75 + tr * 0.25);
  const g = Math.round(base.g * 0.75 + tg * 0.25);
  const b = Math.round(base.b * 0.75 + tb * 0.25);
  return `rgb(${r},${g},${b})`;
}

// Card wrapper: look up the subtype's hex AND the frame asset for this
// card's rarity, then blend.
function getFrameAccentColor(card) {
  // Backward-compat: callers may still pass a raw subtype string.
  if (typeof card === 'string' || card == null) {
    const tintHex = card ? SUBTYPE_COLORS[card] : null;
    return getFrameAccentColorFromHex(tintHex);
  }
  const tintHex = card.subtype ? SUBTYPE_COLORS[card.subtype] : null;
  return getFrameAccentColorFromHex(tintHex, getCardFrameKey(card));
}

// Tinted-frame cache. Colorizing the frame PNG is the expensive part, so we
// build an offscreen canvas per (frame, tint) pair the first time it's needed
// and reuse it forever. Key: `${frameKey}::${tintColor}`.
const tintedFrameCache = {};
function getTintedFrameImage(frameImg, frameKey, tintColor) {
  if (!tintColor) return frameImg;
  const cacheKey = `${frameKey}::${tintColor}`;
  if (tintedFrameCache[cacheKey]) return tintedFrameCache[cacheKey];
  const off = document.createElement('canvas');
  off.width = frameImg.width;
  off.height = frameImg.height;
  const oCtx = off.getContext('2d');
  // Step 1: draw the original frame (keeps the filigree geometry + gold detail).
  oCtx.drawImage(frameImg, 0, 0);
  // Step 2: 'source-atop' only paints over existing (non-transparent) pixels, so
  // the tint lands on the frame but NOT on the transparent center. Low alpha so
  // the underlying bronze/gold still reads through.
  oCtx.globalCompositeOperation = 'source-atop';
  oCtx.globalAlpha = 0.2;
  oCtx.fillStyle = tintColor;
  oCtx.fillRect(0, 0, frameImg.width, frameImg.height);
  tintedFrameCache[cacheKey] = off;
  return off;
}

// Corner size (in frame-image pixels) for the 9-slice. Tuned by visual inspection
// of each frame PNG — the corner art should stay crisp, edges should stretch.
const CARD_FRAME_CORNERS = {
  // Source-px corner for the 9-slice. Smaller = less of the PNG's decorative
  // border drawn, so more art shows through the transparent center. 38 pulls
  // in just the corner filigree without much of the straight gold band.
  frame_common: 38,
  // Same starting cap as common — tune individually if the rare/uncommon
  // corner ornament needs more or less source area to read clearly.
  frame_uncommon: 38,
  frame_rare: 38,
};

// True when a card rendered now is actually being shown in live combat — used
// to decide whether to substitute dynamic values like Sneak Attack's X with
// the current attack count.
function isCombatContext() {
  return state === GameState.COMBAT || state === GameState.TARGETING ||
    state === GameState.DEFENDING || state === GameState.DAMAGE_SOURCE ||
    state === GameState.POWER_TARGETING || state === GameState.POWER_CHOICE ||
    state === GameState.ALLY_TARGETING || state === GameState.MULTI_TARGETING ||
    state === GameState.SCRY_SELECT || state === GameState.MODAL_SELECT;
}

function drawCard(card, x, y, w, h, highlighted = false, hovered = false, size = 'small') {
  const art = getCardArt(card.id);
  const borderColor = getCardBorderColor(card);
  const isFullSize = size === 'full';

  // 1. Background: full art if available, else colored fill
  if (art) {
    const imgAspect = art.width / art.height;
    const cardAspect = w / h;
    let sx = 0, sy = 0, sw = art.width, sh = art.height;
    if (imgAspect > cardAspect) {
      sw = art.height * cardAspect;
      sx = (art.width - sw) / 2;
    } else {
      sh = art.width / cardAspect;
      sy = (art.height - sh) / 2;
    }
    ctx.drawImage(art, sx, sy, sw, sh, x, y, w, h);
  } else {
    // Neutral dark fallback while art loads (avoids a bright purple/red
    // flash on first draw — the preloader fills the cache quickly, but
    // on cold loads or slow connections this keeps the card subdued).
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(x, y, w, h);
  }

  // Subtype tint is no longer applied to the art. Instead, the frame itself is
  // recolored by subtype (see the 9-slice block below) so the card's theme reads
  // as blue/red/purple/brown on the frame without muddying the art.

  // 2. Card name — no background box. Drop shadow for readability. If the name
  // is too wide for the card (e.g. "Wooden Greatsword") we wrap to 2 lines.
  const nameFont = 'bold ' + Math.max(8, Math.floor(w * 0.085)) + 'px sans-serif';
  ctx.font = nameFont;
  const nameH = Math.max(13, Math.floor(w * 0.12));
  const nameOffset = isFullSize ? 16 : 13;
  // (nameY is computed AFTER we know line count so we can push 2-line names
  // further down below the frame's top filigree.)
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // Usable horizontal space for the name: the whole card minus the frame's
  // top-corner filigree so letters don't slip behind the decoration. The
  // filigree corners themselves draw ~11% of the card on full previews and
  // ~8% on hand cards, and they flare inward a bit past the pure corner, so
  // we budget roughly 2.5× the corner size for safe clearance.
  const filigreeClearance = isFullSize ? 80 : 24;
  const maxNameWidth = w - filigreeClearance;
  const nameLines = wrapCardName(card.name, maxNameWidth, ctx);
  // Push 2-line names further down so the first line clears the frame's top
  // filigree instead of tucking underneath it.
  const twoLineBump = nameLines.length > 1 ? (isFullSize ? 10 : 6) : 0;
  const nameY = y + nameOffset + twoLineBump;
  // Vertical stacking: use 85% of nameH per line for tighter spacing.
  const lineH = Math.floor(nameH * 0.85);
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.95)';
  ctx.shadowBlur = isFullSize ? 4 : 3;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = Colors.GOLD;
  for (let li = 0; li < nameLines.length; li++) {
    const lineCy = nameY + nameH / 2 + 1 + (li - (nameLines.length - 1) / 2) * lineH;
    ctx.fillText(nameLines[li], x + w / 2, lineCy);
  }
  ctx.restore();
  ctx.textBaseline = 'alphabetic';

  // 3. Description box at bottom — sits inside the frame's inner edge
  if (isFullSize) {
    // Full size: ~1/5 card height (was 1/4) so the art gets more real estate.
    // Side inset 14 (was 6) keeps text well clear of the frame's filigree.
    // Bottom inset 14 (was 6) shifts the whole box up the card.
    const leftInset = 13;  // -1 so the box extends 1 px further to the left
    const rightInset = 11; // -1 so the box extends 1 px further to the right
    const bottomInset = 14;
    const descBoxW = w - leftInset - rightInset;

    // Each frame asset has a slightly different inner-filigree thickness, so
    // text needs a different horizontal pad to stay clear of the ornament
    // without changing the box size. Common < Uncommon < Rare.
    const _frameKey = getCardFrameKey(card);
    const textWrapPad = _frameKey === 'frame_rare'     ? 28
                       : _frameKey === 'frame_uncommon' ? 22
                       :                                  16;

    // Measure the wrapped text FIRST so we can auto-expand the box if the
    // description doesn't fit its base height (e.g. Magic Missiles at 4 lines).
    const descFontSize = Math.max(11, Math.floor(w * 0.058));
    let descText = card.description || card.shortDesc || '';
    if (card.id === 'sneak_attack' && isCombatContext()) descText = descText.replace(/X/g, String(attacksThisTurn + 1));
    const tokenizeOpts = card._isPerk ? { asPerk: true } : {};
    const iconSize = Math.floor(descFontSize * 1.3);
    const lineH = Math.max(descFontSize + 4, iconSize + 2);
    const lines = countWrappedLines(descText, descBoxW - textWrapPad, descFontSize, tokenizeOpts);
    const totalH = lines * lineH;
    const textPadding = 14; // internal padding: 7 px top + 7 px bottom
    const baseBoxH = Math.floor(h / 5);
    // Grow the box only when the text won't fit the base height.
    const descBoxH = Math.max(baseBoxH, totalH + textPadding);

    const descBoxX = x + leftInset;
    const descBoxY = y + h - descBoxH - bottomInset;

    ctx.fillStyle = 'rgba(0,0,0,0.78)';
    ctx.fillRect(descBoxX, descBoxY, descBoxW, descBoxH);
    ctx.strokeStyle = getFrameAccentColor(card);
    ctx.lineWidth = 1;
    ctx.strokeRect(descBoxX, descBoxY, descBoxW, descBoxH);

    const startY = descBoxY + (descBoxH - totalH) / 2;
    drawIconText(descText, x + w / 2, startY, descBoxW - textWrapPad, descFontSize, '#f0f0f0', tokenizeOpts);
  } else if (card.shortDesc || card.description) {
    // Small size: auto-sized box that sits flush against the frame's inner
    // bottom edge — no visible gap between the box and the frame border.
    let descText = card.shortDesc || card.description;
    if (card.id === 'sneak_attack' && isCombatContext()) descText = descText.replace(/X/g, String(attacksThisTurn + 1));
    const smallOpts = card._isPerk ? { asPerk: true } : {};
    const descFontSize = Math.max(8, Math.floor(w * 0.085));
    const sideInset = 6;
    const bottomInset = 4; // tight to the frame; was 10 (too high, left a gap)
    const lines = countWrappedLines(descText, w - sideInset * 2 - 4, descFontSize, smallOpts);
    const linesToShow = Math.min(2, lines);
    const iconSize = Math.floor(descFontSize * 1.3);
    const lineH = Math.max(descFontSize + 2, iconSize + 1);
    // +7 (was +4) so the box is 3 px taller — top moves up by 3 px while
    // the bottom stays flush against the frame's inner edge (no gap below).
    const descBoxH = linesToShow * lineH + 7;
    const descBoxY = y + h - descBoxH - bottomInset;
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(x + sideInset, descBoxY, w - sideInset * 2, descBoxH);
    drawIconText(descText, x + w / 2, descBoxY + 2, w - sideInset * 2 - 4, descFontSize, '#eee', smallOpts);
  }

  // Badges (tier/rarity bottom-right + subtype bottom-left) are drawn AFTER
  // the frame so they sit on top of the filigree and stay visible.

  // 4b. Ornate 9-slice frame on every card size. The cap is tiered so hand-size
  // cards get a *much* thinner frame than full-size previews — the filigree
  // still reads, but it doesn't eat half the card.
  const frameKey = getCardFrameKey(card);
  const frameImg = frameKey ? images[frameKey] : null;
  if (frameImg) {
    const corner = CARD_FRAME_CORNERS[frameKey] || 24;
    // Tiered corner caps so the filigree reads similarly at every size:
    //   Full preview → ~11% (was 14% — trimmed 20% so the corners don't dominate).
    //   Small cards  → ~8% with a minimum of 6 (was 7%/4, which was almost invisible).
    const capPct = isFullSize ? 0.11 : 0.08;
    const minCorner = isFullSize ? 8 : 6;
    const scaledCorner = Math.max(minCorner, Math.min(corner, Math.floor(Math.min(w, h) * capPct)));
    // Tint the frame by subtype (blue for armor, red for weapons, etc.). Skip
    // items (neutral grey) — the plain bronze frame reads cleaner for those.
    const tint = (card.subtype && card.subtype !== 'item') ? SUBTYPE_COLORS[card.subtype] : null;
    const drawnFrame = tint ? getTintedFrameImage(frameImg, frameKey, tint) : frameImg;
    draw9SliceFrame(drawnFrame, x, y, w, h, scaledCorner);
    // Gold glow only for SELECTED cards, inset inside the frame.
    if (highlighted) {
      ctx.save();
      ctx.strokeStyle = Colors.GOLD;
      ctx.lineWidth = 2;
      ctx.shadowColor = Colors.GOLD;
      ctx.shadowBlur = 12;
      ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
      ctx.restore();
    }
  } else {
    // No frame registered — fall back to the classic colored border.
    ctx.strokeStyle = highlighted ? Colors.GOLD : (hovered ? '#fff' : borderColor);
    ctx.lineWidth = highlighted ? 4 : (hovered ? 3 : 2);
    ctx.strokeRect(x, y, w, h);
  }

  // 4c. Tier/rarity + subtype badges — drawn on TOP of the frame so the frame's
  // bottom filigree can't hide them.
  if (isFullSize) {
    const RARITY_CODES = { common: 'C', uncommon: 'U', rare: 'R', epic: 'E', legendary: 'L' };
    const RARITY_LABELS = { common: 'Common', uncommon: 'Uncommon', rare: 'Rare', epic: 'Epic', legendary: 'Legendary' };
    const RARITY_COLORS = {
      common: '#8b5a2b', uncommon: '#c0c0c0', rare: '#4682e6',
      epic: '#b482ff', legendary: '#ffd700',
    };
    const rarity = card.rarity || 'common';
    const tier = Math.max(card.tier || 1, 1);
    const code = RARITY_CODES[rarity] || 'C';
    const color = RARITY_COLORS[rarity] || RARITY_COLORS.common;

    const badgeFontSize = Math.max(8, Math.floor(w * 0.045));
    ctx.font = `bold ${badgeFontSize}px sans-serif`;
    const codeW = ctx.measureText(code).width;
    const tierText = `T${tier}`;
    const tierW = ctx.measureText(tierText).width;
    const padX = 4, padY = 2;
    const sepW = 4;
    const totalW = codeW + tierW + padX * 4 + sepW;
    const badgeH = badgeFontSize + padY * 2;
    const badgeX = x + w - totalW - 6;
    const badgeY = y + h - badgeH - 4; // 2 px lower — sits on the frame's bottom filigree

    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(badgeX, badgeY, totalW, badgeH);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.strokeRect(badgeX, badgeY, totalW, badgeH);

    const codeBoxW = codeW + padX * 2;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(code, badgeX + codeBoxW / 2, badgeY + badgeH / 2 + 1);

    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(badgeX + codeBoxW + sepW / 2, badgeY + 2);
    ctx.lineTo(badgeX + codeBoxW + sepW / 2, badgeY + badgeH - 2);
    ctx.stroke();

    const tierBoxX = badgeX + codeBoxW + sepW;
    const tierBoxW = tierW + padX * 2;
    ctx.fillStyle = '#e0e0e0';
    ctx.fillText(tierText, tierBoxX + tierBoxW / 2, badgeY + badgeH / 2 + 1);
    ctx.textBaseline = 'alphabetic';

    cardBadgeHitAreas.push({
      x: badgeX, y: badgeY, w: codeBoxW, h: badgeH,
      label: RARITY_LABELS[rarity] || 'Common',
    });
    cardBadgeHitAreas.push({
      x: tierBoxX, y: badgeY, w: tierBoxW, h: badgeH,
      label: `Tier ${tier}`,
    });

    // Subtype label (bottom-left), colored with the frame-echo color so it
    // matches the description box outline.
    const subLabel = getSubtypeLabel(card);
    if (subLabel) {
      const accentColor = getFrameAccentColor(card);
      ctx.font = `${badgeFontSize}px sans-serif`;
      const slW = ctx.measureText(subLabel).width + padX * 2;
      const slX = x + 6;
      const slY = badgeY;
      ctx.fillStyle = 'rgba(0,0,0,0.85)';
      ctx.fillRect(slX, slY, slW, badgeH);
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(slX, slY, slW, badgeH);
      ctx.fillStyle = accentColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(subLabel, slX + slW / 2, slY + badgeH / 2 + 1);
      ctx.textBaseline = 'alphabetic';
    }
  }

  // 5. Exhausted (stays-in-hand) overlay: dim + Zzz
  if (card.exhausted) {
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = Colors.ORANGE;
    ctx.font = `bold ${Math.max(20, Math.floor(w * 0.28))}px Georgia, serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Zzz', x + w / 2, y + h / 2);
    ctx.textBaseline = 'alphabetic';
  }

  ctx.textAlign = 'left';
}

function wrapText(text, maxWidth, fontSize) {
  // Simple word-wrap approximation
  const charWidth = fontSize * 0.55;
  const maxChars = Math.floor(maxWidth / charWidth);
  if (text.length <= maxChars) return [text];
  const words = text.split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length > maxChars) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = current ? current + ' ' + word : word;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 3);
}

// --- HP display (draw pile + hand + recharge = HP) ---
function getHP(character) {
  // HP = cards still "alive" in the active cycle: draw pile + hand + recharge pile
  const d = character.deck;
  return d.drawPile.length + d.hand.length + d.rechargePile.length;
}

function getMaxHP(character) {
  // During combat, max HP = every card across ALL combat piles (including tokens
  // created mid-combat like Goodberry). Banished cards are removed from all piles
  // so max HP drops when a card is banished.
  const d = character.deck;
  if (d.isInCombat()) {
    return d.drawPile.length + d.hand.length + d.rechargePile.length
         + d.discardPile.length
         + d.damagePile.length + d.playPile.length;
  }
  // Out of combat: master deck is the canonical total
  return d.masterDeck.length;
}

function getDamage(character) {
  // "Damage" = cards that left the active cycle (discard + exhaust + damage piles)
  const d = character.deck;
  return d.discardPile.length + d.damagePile.length;
}

// --- Combat drawing ---
function drawCombat() {
  // Background
  drawEncounterBg();

  // Clear log card hit areas at the start of the frame so panel/log pushes
  // (made later in this frame) are read fresh by the hover pass at the end.
  logCardHitAreas.length = 0;

  // --- Layout panel backgrounds (subtle dividers to delimit sections) ---
  // Right column background (log + buttons)
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(COMBAT_RIGHT_X, 0, COMBAT_RIGHT_W, SCREEN_HEIGHT);
  // Vertical divider line between left and right
  ctx.fillStyle = 'rgba(255,215,0,0.4)';
  ctx.fillRect(COMBAT_RIGHT_X - 1, 0, 2, SCREEN_HEIGHT);
  // Horizontal divider between log and buttons
  ctx.fillRect(COMBAT_RIGHT_X, COMBAT_RIGHT_BTN_Y - 1, COMBAT_RIGHT_W, 2);

  // --- Enemy area (top) ---
  // Shake only the attacking source (creature or enemy card), not the whole field
  const shaking = enemyArrow && enemyArrow.timer > 0;
  const shakeIntensity = shaking ? Math.min(1, enemyArrow.timer / ENEMY_ARROW_DURATION) * 5 : 0;
  const shakeSrc = shaking ? enemyArrow.sourceCreature : null;

  // Shake enemy card only if the attack comes from the enemy itself (no creature source)
  if (shaking && !shakeSrc) {
    const si = shakeIntensity;
    ctx.save();
    ctx.translate(Math.round((Math.random() - 0.5) * si * 2), Math.round((Math.random() - 0.5) * si * 2));
  }
  drawCharacterPanel(enemy, 'enemy');
  if (shaking && !shakeSrc) ctx.restore();

  // Enemy creatures — shake only the one that's attacking
  const creatureRects = getEnemyCreatureRects();
  for (let i = 0; i < enemy.creatures.length; i++) {
    const c = enemy.creatures[i];
    const r = creatureRects[i];
    const isAttacker = shaking && shakeSrc === c;
    if (isAttacker) {
      ctx.save();
      ctx.translate(Math.round((Math.random() - 0.5) * shakeIntensity * 2), Math.round((Math.random() - 0.5) * shakeIntensity * 2));
    }
    drawCreatureCard(c, r, false);
    if (isAttacker) ctx.restore();
  }

  // --- Player area (bottom) ---
  drawCharacterPanel(player, 'player');

  // --- Player hand ---
  // While Shift is held, keep whichever preview was active pinned. New hover
  // detection is skipped (hand cards, panels, log entries, powers) so nothing
  // can swap the preview until Shift is released.
  if (isShiftFrozen()) {
    hoveredCardPreview = shiftFreezeCard;
    hoveredPowerPreview = shiftFreezePower;
    hoveredCreaturePreview = shiftFreezeCreature;
  } else {
    hoveredCardPreview = null;
    hoveredPowerPreview = null;
    hoveredCreaturePreview = null;
  }

  // (Log/panel hover detection runs at the end of drawCombat after everything is populated.)
  const handRects = getHandCardRects(player.deck.hand);
  // Determine which card is hovered first (use visible-portion hit areas, topmost first)
  // Topmost card visually is the LAST one (drawn last so rendered on top).
  let hoveredHandIndex = -1;
  if (!isShiftFrozen()) {
    for (let i = player.deck.hand.length - 1; i >= 0; i--) {
      const hr = getHandCardHoverRect(handRects, i);
      if (hitTest(mouseX, mouseY, hr)) { hoveredHandIndex = i; break; }
    }
  }
  // Draw origin for the slide-in animation: center of the player character
  // card (the deck is conceptually "inside" the character panel).
  const deckOriginRect = getCharacterCardRect(true);
  const deckOriginX = deckOriginRect.x + deckOriginRect.w / 2 - CARD_W / 2;
  const deckOriginY = deckOriginRect.y + deckOriginRect.h / 2 - CARD_H / 2;
  const DRAW_ANIM_DURATION = 200; // ms per card

  // Helper: compute the draw-animation-lerped position for a card. Returns
  // the effective {x, y} — either the final hand position (no anim / done)
  // or an interpolated position between deck origin and hand slot.
  function lerpDrawAnim(card, targetX, targetY) {
    if (!card._drawAnimStart) return { x: targetX, y: targetY };
    const now = performance.now();
    const elapsed = now - card._drawAnimStart;
    if (elapsed >= DRAW_ANIM_DURATION) {
      delete card._drawAnimStart; // animation done, clean up
      return { x: targetX, y: targetY };
    }
    if (elapsed < 0) {
      // Stagger hasn't started yet — sit at deck origin
      return { x: deckOriginX, y: deckOriginY };
    }
    const t = elapsed / DRAW_ANIM_DURATION;
    // Ease-out (decelerate): 1 - (1-t)^2
    const ease = 1 - (1 - t) * (1 - t);
    return {
      x: deckOriginX + (targetX - deckOriginX) * ease,
      y: deckOriginY + (targetY - deckOriginY) * ease,
    };
  }

  // Draw all cards in order so later cards overlap earlier ones,
  // EXCEPT the hovered (and selected) cards — draw them last so they sit on top.
  for (let i = 0; i < player.deck.hand.length; i++) {
    if (i === hoveredHandIndex || i === selectedCardIndex) continue;
    const card = player.deck.hand[i];
    const r = handRects[i];
    const pos = lerpDrawAnim(card, r.x, r.y);
    drawCard(card, pos.x, pos.y, r.w, r.h, false, false);
  }
  // Now draw hovered card on top (and selected one if different)
  if (selectedCardIndex >= 0 && selectedCardIndex < player.deck.hand.length && selectedCardIndex !== hoveredHandIndex) {
    const card = player.deck.hand[selectedCardIndex];
    const r = handRects[selectedCardIndex];
    drawCard(card, r.x, r.y - 20, r.w, r.h, true, false);
  }
  if (hoveredHandIndex >= 0) {
    const card = player.deck.hand[hoveredHandIndex];
    const r = handRects[hoveredHandIndex];
    const selected = hoveredHandIndex === selectedCardIndex;
    drawCard(card, r.x, selected ? r.y - 20 : r.y, r.w, r.h, selected, true);
    // Preview copy without Zzz overlay
    const preview = card.copy ? card.copy() : card;
    preview.exhausted = false;
    hoveredCardPreview = preview;
  }

  // --- Player Allies ---
  if (player.creatures.length > 0) {
    // Allies are drawn as mini cards in 1 row of 6 to the right of the player character card
    const allyRects = getPlayerCreatureRects();
    for (let i = 0; i < player.creatures.length; i++) {
      drawCreatureCard(player.creatures[i], allyRects[i], true);
    }
  }

  // --- Player Power ---
  if (player.powers.length > 0) {
    drawPowerArea();
  }

  // --- Enemy Power ---
  drawEnemyPowerArea();

  // (Power recharge prompt now shown via sticky toast — see handlePowerClick)

  // --- Turn indicator banner on the divider line between enemy/player ---
  const bannerH = 24; // was 28 — trimmed 4 px total to give the character cards more air
  const bannerY = COMBAT_DIVIDER_Y - bannerH / 2;
  const bannerColor = isPlayerTurn ? 'rgba(60, 160, 60, 0.85)' : 'rgba(180, 60, 60, 0.85)';
  ctx.fillStyle = bannerColor;
  ctx.fillRect(0, bannerY, COMBAT_LEFT_W, bannerH);
  ctx.strokeStyle = isPlayerTurn ? Colors.GREEN : Colors.RED;
  ctx.lineWidth = 2;
  ctx.strokeRect(0, bannerY, COMBAT_LEFT_W, bannerH);

  ctx.font = 'bold 16px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = Colors.WHITE;
  ctx.fillText(isPlayerTurn ? 'YOUR TURN' : "ENEMY'S TURN", COMBAT_LEFT_W / 2, COMBAT_DIVIDER_Y);
  ctx.textBaseline = 'alphabetic';

  // --- Targeting arrow (hint shown via toast) ---
  if (state === GameState.TARGETING) {
    if (barrageMode && barrageShotsLeft > 0 && barrageCardIndex >= 0 && barrageCardIndex < player.deck.hand.length) {
      // Barrage shooting: arrow from MM card in hand to cursor
      const handRects = getHandCardRects(player.deck.hand);
      const r = handRects[barrageCardIndex];
      drawTargetingArrow(r.x + r.w / 2, r.y + r.h / 2 - 20, mouseX, mouseY, Colors.ORANGE);
      // Done button
      const doneR = { x: COMBAT_LEFT_W / 2 - 80, y: COMBAT_DIVIDER_Y + 35, w: 160, h: 40 };
      const doneHov = hitTest(mouseX, mouseY, doneR);
      ctx.fillStyle = doneHov ? '#3a8a3a' : '#1c5a1c';
      ctx.fillRect(doneR.x, doneR.y, doneR.w, doneR.h);
      ctx.strokeStyle = Colors.GREEN;
      ctx.lineWidth = 2;
      ctx.strokeRect(doneR.x, doneR.y, doneR.w, doneR.h);
      ctx.fillStyle = Colors.WHITE;
      ctx.font = 'bold 16px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`Done (${barrageShotsFired}/3)`, doneR.x + doneR.w / 2, doneR.y + doneR.h / 2);
      ctx.textBaseline = 'alphabetic';
      ctx.textAlign = 'left';
    } else if (selectedCardIndex >= 0 && selectedCardIndex < player.deck.hand.length) {
      // Normal: arrow from selected card center to cursor
      const handRects = getHandCardRects(player.deck.hand);
      const r = handRects[selectedCardIndex];
      const startX = r.x + r.w / 2;
      const startY = r.y + r.h / 2 - 20;
      drawTargetingArrow(startX, startY, mouseX, mouseY, Colors.RED);
    }
  } else if (state === GameState.POWER_TARGETING && selectedPower) {
    // Sticky gold arrows to already-picked targets (like multi-targeting),
    // plus a red arrow to cursor for the next pick.
    const idx = player.powers.indexOf(selectedPower);
    if (idx !== -1) {
      const r = getCharacterPowerRect(true, idx);
      const sx = r.x + r.w / 2;
      const sy = r.y + r.h / 2;
      for (const t of powerTargets) {
        let tx, ty;
        if (t === enemy) {
          const er = getCharacterCardRect(false);
          tx = er.x + er.w / 2; ty = er.y + er.h / 2;
        } else {
          const crs = getEnemyCreatureRects();
          const ci = enemy.creatures.indexOf(t);
          if (ci !== -1 && crs[ci]) { tx = crs[ci].x + crs[ci].w / 2; ty = crs[ci].y + crs[ci].h / 2; }
        }
        if (tx !== undefined) drawTargetingArrow(sx, sy, tx, ty, Colors.GOLD);
      }
      if (powerTargets.length < powerMaxTargets) {
        drawTargetingArrow(sx, sy, mouseX, mouseY, Colors.RED);
      }
    }
  } else if (state === GameState.ALLY_TARGETING && selectedAlly) {
    // Arrow from the ally mini card to the cursor
    const allyRects = getPlayerCreatureRects();
    const idx = player.creatures.indexOf(selectedAlly);
    if (idx !== -1 && allyRects[idx]) {
      const r = allyRects[idx];
      drawTargetingArrow(r.x + r.w / 2, r.y + r.h / 2, mouseX, mouseY, Colors.RED);
    }
  } else if (state === GameState.MULTI_TARGETING && multiCardIndex >= 0) {
    const handRects = getHandCardRects(player.deck.hand);
    if (handRects[multiCardIndex]) {
      const r = handRects[multiCardIndex];
      const sx = r.x + r.w / 2, sy = r.y + r.h / 2 - 20;
      // Arrows to already-picked targets (gold, persist until done/cancel)
      for (const t of multiTargets) {
        let tx, ty;
        if (t === enemy) {
          const er = getCharacterCardRect(false);
          tx = er.x + er.w / 2; ty = er.y + er.h / 2;
        } else {
          const crs = getEnemyCreatureRects();
          const ci = enemy.creatures.indexOf(t);
          if (ci !== -1 && crs[ci]) { tx = crs[ci].x + crs[ci].w / 2; ty = crs[ci].y + crs[ci].h / 2; }
        }
        if (tx !== undefined) drawTargetingArrow(sx, sy, tx, ty, Colors.GOLD);
      }
      // Arrow from hand card to cursor (only if we can still pick more)
      if (multiTargets.length < multiMaxTargets) {
        drawTargetingArrow(sx, sy, mouseX, mouseY, Colors.RED);
      }
    }
  }

  // --- Enemy showcase card (briefly shown in center when enemy plays a card) ---
  if (showcaseCard && showcaseTimer > 0) {
    const fadeIn = Math.min(1, showcaseFadeIn / SHOWCASE_FADE);
    const fadeOut = Math.min(1, showcaseTimer / SHOWCASE_FADE);
    const alpha = Math.min(fadeIn, fadeOut);
    ctx.globalAlpha = alpha * 0.92;
    const scW = 180, scH = 252;
    const scX = Math.floor((COMBAT_LEFT_W - scW) / 2);
    const scY = Math.floor((SCREEN_HEIGHT - scH) / 2) - 20;
    drawCard(showcaseCard, scX, scY, scW, scH, false, false, 'full');
    // Red tinted border
    ctx.strokeStyle = `rgba(255,60,60,${alpha})`;
    ctx.lineWidth = 3;
    ctx.strokeRect(scX - 2, scY - 2, scW + 4, scH + 4);
    ctx.globalAlpha = 1;
  }

  // --- Enemy attack arrow (animated, fades out) ---
  if (enemyArrow) {
    const a = Math.min(1, enemyArrow.timer / (ENEMY_ARROW_DURATION * 0.3));
    ctx.globalAlpha = a;
    drawTargetingArrow(enemyArrow.x1, enemyArrow.y1, enemyArrow.x2, enemyArrow.y2, Colors.RED);
    ctx.globalAlpha = 1;
  }

  // --- Right column buttons (End Turn, Inventory, Help) ---
  drawCombatButtons();

  // --- Combat log ---
  drawCombatLog();

  // --- Log/panel hover detection (must run after both panels and log have populated) ---
  // Hovering a log entry, a discard pile label, a creature mini card, or any panel hit area
  // shows the full card preview. Only override the hand-card hover (set above) if the user
  // is actually pointing at a panel/log area. Skipped while Shift-freeze is active.
  if (!isShiftFrozen()) for (const area of logCardHitAreas) {
    if (hitTest(mouseX, mouseY, area)) {
      if (area.buff) {
        // Show buff as a card-style hover using the buff's card art
        const buffCard = {
          id: area.buff.imageId,
          name: area.buff.name,
          description: area.buff.description,
          shortDesc: area.buff.turnsRemaining > 0
            ? `${area.buff.description}\n(${area.buff.turnsRemaining} turns left)`
            : area.buff.description,
          cardType: 'ABILITY',
          costType: 'FREE',
          subtype: 'buff',
          effects: [],
          modes: null,
          currentEffects: [],
          copy: () => buffCard,
          exhausted: false,
        };
        hoveredCardPreview = buffCard;
      } else if (area.creature) {
        hoveredCreaturePreview = area.creature;
      } else if (area.card instanceof Power) {
        hoveredPowerPreview = area.card;
      } else if (area.card && typeof area.card.copy === 'function') {
        const fresh = area.card.copy();
        fresh.exhausted = false;
        hoveredCardPreview = fresh;
      } else {
        hoveredCardPreview = area.card;
      }
      break;
    }
  }

  // --- Combat intro splash ---
  if (combatIntroTimer > 0) drawCombatIntro();

  // --- Card / power hover preview (follows cursor) ---
  if (combatIntroTimer <= 0 && !characterSplashCharacter) {
    drawHoverPreview();
  }

  // --- Character card splash overlay ---
  if (characterSplashCharacter) drawCharacterSplash();

  ctx.textAlign = 'left';
}

// Draw a full-size preview card following the cursor (top-right of cursor by default).
// While Shift-freeze is active, the preview pins to wherever the cursor was when
// Shift was first pressed, so the player can mouse over its keyword icons.
function drawHoverPreview() {
  if (!hoveredCardPreview && !hoveredPowerPreview && !hoveredCreaturePreview) return;

  // Preview card size (~py 312x438, scaled smaller for our screen)
  const previewW = 240;
  const previewH = 336;
  const margin = 12;

  // Side preview (smaller — used when a card has a previewCard or previewCreature
  // that shows the summon/produced card next to the main hover preview)
  const sidePreview = hoveredCardPreview && (
    hoveredCardPreview.previewCard ||
    hoveredCardPreview.previewCreature
  );
  const sideW = COMBAT_POWER_W;   // small mini-card size matches in-combat layout
  const sideH = COMBAT_POWER_H;
  const sideGap = 10;
  const totalW = previewW + (sidePreview ? sideGap + sideW : 0);

  // Anchor mouse (frozen if shift-lock, live otherwise).
  const anchorX = isShiftFrozen() ? shiftFreezeMouseX : mouseX;
  const anchorY = isShiftFrozen() ? shiftFreezeMouseY : mouseY;

  // Default position: above and right of anchor
  let x = anchorX + 24;
  let y = anchorY - previewH - 16;

  // Flip to left if too close to right edge
  if (x + totalW + margin > SCREEN_WIDTH) {
    x = anchorX - totalW - 24;
  }

  // Flip below if too close to top
  if (y < margin) {
    y = anchorY + 24;
  }
  // Clamp to screen bounds
  x = Math.max(margin, Math.min(x, SCREEN_WIDTH - totalW - margin));
  y = Math.max(margin, Math.min(y, SCREEN_HEIGHT - previewH - margin));

  if (hoveredCreaturePreview) {
    drawCreaturePreviewCard(hoveredCreaturePreview, x, y, previewW, previewH);
  } else if (hoveredCardPreview) {
    // Draw a full-size version of the card
    drawCard(hoveredCardPreview, x, y, previewW, previewH, false, false, 'full');
    // If the card produces other cards/creatures, show them at the same size as
    // the in-combat mini cards, to the right of the main preview.
    if (sidePreview) {
      const sx = x + previewW + sideGap;
      // Center the side preview vertically against the main preview
      const sy = y + Math.floor((previewH - sideH) / 2);
      if (hoveredCardPreview.previewCard) {
        drawCard(hoveredCardPreview.previewCard, sx, sy, sideW, sideH, false, false);
      } else if (hoveredCardPreview.previewCreature) {
        hoveredCardPreview.previewCreature._sourceRarity = hoveredCardPreview.rarity || 'common';
        hoveredCardPreview.previewCreature._sourceSubtype = hoveredCardPreview.subtype || '';
        drawCreatureMiniCard(hoveredCardPreview.previewCreature, { x: sx, y: sy, w: sideW, h: sideH }, true);
      }
    }
  } else if (hoveredPowerPreview) {
    drawPowerPreviewCard(hoveredPowerPreview, x, y, previewW, previewH);
  }
}

// Draw a full-size preview card for a creature. Mirrors the small mini-card layout
// at a larger size: art fills the card, gold name banner at top, and a single
// semi-transparent box at the BOTTOM (like a weapon card's description box) that
// contains the attack number on the left, the HP bar on the right, and the
// description text above (when present).
function drawCreaturePreviewCard(creature, x, y, w, h) {
  // Codex creatures have owner=null but carry a `_codexSide` hint that tells
  // us whether they're a player summon or an enemy creature. Live combat
  // creatures use creature.owner === player. Both flow into the same blue/
  // brown frame tint so the codex side preview, the Summons tab small card,
  // and the Summons tab full preview all match for the same creature.
  const isPlayerOwned = creature._codexSide
    ? (creature._codexSide === 'player')
    : (creature.owner === player);

  // 1. Art fills the card
  const artKey = (creature.name || '').toLowerCase().replace(/ /g, '_');
  const art = images[`creature_${artKey}`] || getCardArt(artKey);
  if (art) {
    const imgAspect = art.width / art.height;
    const cardAspect = w / h;
    let sx = 0, sy = 0, sw = art.width, sh = art.height;
    if (imgAspect > cardAspect) { sw = art.height * cardAspect; sx = (art.width - sw) / 2; }
    else { sh = art.width / cardAspect; sy = (art.height - sh) / 2; }
    ctx.drawImage(art, sx, sy, sw, sh, x, y, w, h);
  } else {
    ctx.fillStyle = isPlayerOwned ? '#1a3a4e' : '#3a2020';
    ctx.fillRect(x, y, w, h);
  }

  // Resolve the frame's tint up front so both the frame AND the box outline
  // use the same color (subtype tint when known, else player blue / enemy brown).
  const fkey = getFrameKeyForRarity(creature._sourceRarity);
  const subtypeTint = creature._sourceSubtype ? SUBTYPE_COLORS[creature._sourceSubtype] : null;
  const frameTint = subtypeTint || (isPlayerOwned ? Colors.ALLY_BLUE : Colors.BROWN);
  // Outline matches the visible frame: 75 % frame-base color (bronze for
  // common/uncommon, blue for rare) + 25 % subtype tint.
  const accentColor = getFrameAccentColorFromHex(frameTint, fkey);

  // 2. Bottom box — drawn UNDER the frame so the frame's bottom filigree
  // overlaps the top edge of the box (looks intentional, like the box is
  // "tucked into" the frame). Description text also sits under the frame;
  // HP/atk are drawn AFTER the frame so they stay readable.
  const leftInset = 13, rightInset = 11, bottomInset = 14;
  const dFont = 13;
  const lineH = dFont + 3;
  const minStatsH = 28;
  const descBoxW = w - leftInset - rightInset;
  let descLines = 0;
  if (creature.description) {
    descLines = countWrappedLines(creature.description, descBoxW - 12, dFont);
  } else if (creature.unpreventable) {
    descLines = countWrappedLines('Deals Unpreventable Damage', descBoxW - 12, dFont);
  }
  const descContentH = descLines * lineH;
  const baseBoxH = Math.floor(h / 5);
  // Padding budget: small buffer above description + ~4 px gap between
  // description and the (now fixed-size) HP/atk stats row + bottom padding.
  // Now that statsRowH is constant the gap stays consistent across
  // descriptions of different lengths.
  const boxH = Math.max(baseBoxH, minStatsH + descContentH + 16);
  const boxX = x + leftInset;
  const boxY = y + h - boxH - bottomInset;
  const boxW = w - leftInset - rightInset;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
  ctx.fillRect(boxX, boxY, boxW, boxH);
  // Outline matches the frame tint (subtype color + gold blend).
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 1;
  ctx.strokeRect(boxX, boxY, boxW, boxH);

  // 2b. Description text inside the box (also under the frame). Box was
  // pre-sized to fit every wrapped line so nothing is truncated.
  const descText = creature.description || (creature.unpreventable ? 'Deals Unpreventable Damage' : '');
  if (descText) {
    drawIconText(descText, x + w / 2, boxY + 4, boxW - 12, dFont, '#f0f0f0');
  }

  // 3. Frame on top of art + box + description.
  const frameImg = images[fkey];
  if (frameImg) {
    const corner = CARD_FRAME_CORNERS[fkey] || 24;
    const scaledCorner = Math.max(8, Math.min(corner, Math.floor(Math.min(w, h) * 0.11)));
    const tinted = getTintedFrameImage(frameImg, fkey, frameTint);
    draw9SliceFrame(tinted, x, y, w, h, scaledCorner);
  } else {
    ctx.strokeStyle = isPlayerOwned ? Colors.ALLY_BLUE : Colors.BROWN;
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);
  }

  // 4. Name on top of the frame (drop shadow for readability), wraps 2 lines.
  const nameFont = 'bold ' + Math.max(8, Math.floor(w * 0.085)) + 'px sans-serif';
  ctx.font = nameFont;
  const nameH = Math.max(13, Math.floor(w * 0.12));
  const filigreeClearance = 80;
  const maxNameWidth = w - filigreeClearance;
  const nameLines = wrapCardName(creature.name, maxNameWidth, ctx);
  const twoLineBump = nameLines.length > 1 ? 10 : 0;
  const nameY = y + 16 + twoLineBump;
  const nameLineH = Math.floor(nameH * 0.85);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.95)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = Colors.GOLD;
  for (let li = 0; li < nameLines.length; li++) {
    const lineCy = nameY + nameH / 2 + 1 + (li - (nameLines.length - 1) / 2) * nameLineH;
    ctx.fillText(nameLines[li], x + w / 2, lineCy);
  }
  ctx.restore();

  // 5. HP bar + attack — drawn AFTER the frame so they stay fully visible.
  // statsRowH is FIXED (was scaling with boxH, which made the Tier-2 Thorb
  // 2-line description push the HP/atk fonts larger than the 1-line cards).
  // Keeping it constant means the box just grows taller for descriptions,
  // and HP/atk stay the same size on every creature.
  const statsRowH = 28;
  const statsBottom = boxY + boxH - 4 - 10;
  const hpBarX = boxX + boxW / 2 + 4;
  const hpBarW = (boxW / 2) - 8;
  const hpBarH = Math.floor(statsRowH * 0.7);
  const hpBarY = statsBottom - hpBarH;
  ctx.fillStyle = '#222';
  ctx.fillRect(hpBarX, hpBarY, hpBarW, hpBarH);
  const hpPct = creature.maxHp > 0 ? Math.max(0, creature.currentHp) / creature.maxHp : 0;
  ctx.fillStyle = hpPct > 0.5 ? Colors.GREEN : (hpPct > 0.25 ? Colors.GOLD : Colors.RED);
  ctx.fillRect(hpBarX, hpBarY, hpBarW * hpPct, hpBarH);
  ctx.strokeStyle = Colors.WHITE;
  ctx.lineWidth = 1;
  ctx.strokeRect(hpBarX, hpBarY, hpBarW, hpBarH);
  ctx.fillStyle = Colors.WHITE;
  ctx.font = `bold ${Math.floor(hpBarH * 0.7)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${creature.currentHp}/${creature.maxHp}`, hpBarX + hpBarW / 2, hpBarY + hpBarH / 2 + 1);

  // Attack number (left half of stats row) — net 8 px toward center.
  ctx.font = `bold ${Math.floor(statsRowH * 0.85)}px sans-serif`;
  ctx.fillStyle = Colors.WHITE;
  ctx.textAlign = 'left';
  ctx.fillText(`${creature.attack}`, boxX + 8 + 8, hpBarY + hpBarH / 2 + 1);
  if (creature.poisonAttack) {
    const atkTextW = ctx.measureText(`${creature.attack}`).width;
    const poisonImg = images['icon_poison'];
    const pIconSize = Math.max(12, Math.floor(statsRowH * 0.75));
    const px = boxX + 8 + 8 + atkTextW + 3;
    const py = hpBarY + (hpBarH - pIconSize) / 2;
    if (poisonImg) ctx.drawImage(poisonImg, px, py, pIconSize, pIconSize);
  }

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

// Draw a full-size preview of a power card (similar to a card but without modes/etc)
function drawPowerPreviewCard(power, x, y, w, h) {
  const art = images[`power_${power.id}`];

  // 1. Art fills the full card rect.
  if (art) {
    const imgAspect = art.width / art.height;
    const cardAspect = w / h;
    let sx = 0, sy = 0, sw = art.width, sh = art.height;
    if (imgAspect > cardAspect) { sw = art.height * cardAspect; sx = (art.width - sw) / 2; }
    else { sh = art.width / cardAspect; sy = (art.height - sh) / 2; }
    ctx.drawImage(art, sx, sy, sw, sh, x, y, w, h);
  } else {
    ctx.fillStyle = '#643c64';
    ctx.fillRect(x, y, w, h);
  }

  // 2. Power name — no background box, drop shadow for readability, wraps to
  // 2 lines if too wide for the frame's interior.
  const nameFont = 'bold ' + Math.max(8, Math.floor(w * 0.085)) + 'px sans-serif';
  ctx.font = nameFont;
  const nameH = Math.max(13, Math.floor(w * 0.12));
  const filigreeClearance = 80; // full-size: ample clearance from top filigree
  const maxNameWidth = w - filigreeClearance;
  const nameLines = wrapCardName(power.name, maxNameWidth, ctx);
  const twoLineBump = nameLines.length > 1 ? 10 : 0;
  const nameY = y + 16 + twoLineBump;
  const lineH = Math.floor(nameH * 0.85);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.95)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = Colors.GOLD;
  for (let li = 0; li < nameLines.length; li++) {
    const lineCy = nameY + nameH / 2 + 1 + (li - (nameLines.length - 1) / 2) * lineH;
    ctx.fillText(nameLines[li], x + w / 2, lineCy);
  }
  ctx.restore();
  ctx.textBaseline = 'alphabetic';

  // 3. Description box at bottom — same insets as drawCard's full layout.
  // Passive powers with "Start of Turn:" / "End of Turn:" prefixes render
  // an inline badge (same system as perk cards) so the trigger reads the
  // same way across powers and perks.
  const leftInset = 13;
  const rightInset = 11;
  const bottomInset = 14;
  const descBoxW = w - leftInset - rightInset;

  // Build description text.
  let descText;
  if (power.costDescription && power.costDescription !== 'Passive') {
    descText = `${power.costDescription} -> ${power.effectDescription || ''}`.trim();
  } else {
    descText = power.effectDescription || power.fullDescription || '';
  }
  // Detect trigger prefix → enable badge tokenization.
  const hasTriggerBadge = /^(Start of Turn|End of Turn|Combat Start|Combat End|Turn Start|Turn End):/.test(descText);
  const descOpts = hasTriggerBadge ? { asPerk: true } : {};
  // Normalize prefix to match the badge patterns (e.g. "Start of Turn:" → "Turn Start:")
  if (hasTriggerBadge) {
    descText = descText
      .replace(/^Start of Turn:/, 'Turn Start:')
      .replace(/^End of Turn:/, 'Turn End:');
  }
  const descFontSize = Math.max(11, Math.floor(w * 0.058));
  const iconSize = Math.floor(descFontSize * 1.3);
  const descLineH = Math.max(descFontSize + 4, iconSize + 2);
  const lineCount = countWrappedLines(descText, descBoxW - 16, descFontSize, descOpts);
  const totalH = lineCount * descLineH;
  const textPadding = 14;
  const baseBoxH = Math.floor(h / 5);
  const descBoxH = Math.max(baseBoxH, totalH + textPadding);
  const descBoxX = x + leftInset;
  const descBoxY = y + h - descBoxH - bottomInset;

  ctx.fillStyle = 'rgba(0,0,0,0.78)';
  ctx.fillRect(descBoxX, descBoxY, descBoxW, descBoxH);
  ctx.strokeStyle = getFrameAccentColorFromHex('#8c3c8c');
  ctx.lineWidth = 1;
  ctx.strokeRect(descBoxX, descBoxY, descBoxW, descBoxH);

  const startY = descBoxY + (descBoxH - totalH) / 2;
  drawIconText(descText, x + w / 2, startY, descBoxW - 16, descFontSize, '#f0f0f0', descOpts);
  ctx.textBaseline = 'alphabetic';

  // 4. Ornate 9-slice frame with a purple tint, on top of everything else.
  const frameImg = images.frame_common;
  if (frameImg) {
    const corner = CARD_FRAME_CORNERS.frame_common || 24;
    const scaledCorner = Math.max(8, Math.min(corner, Math.floor(Math.min(w, h) * 0.11)));
    const tinted = getTintedFrameImage(frameImg, 'frame_common', '#8c3c8c');
    draw9SliceFrame(tinted, x, y, w, h, scaledCorner);
  } else {
    ctx.strokeStyle = '#8c3c8c';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);
  }

  ctx.textAlign = 'left';
}

// Draw a chunky arrow from start to end (matches py game)
function drawToast() {
  const alpha = (!toastSticky && toastTimer < 400) ? toastTimer / 400 : 1;
  const s = toastStyle;
  const isStyled = s === 'damage' || s === 'recharge' || s === 'multi' || s === 'scry' || s === 'heal' || s === 'gold';
  const fontSize = isStyled ? 24 : 22;
  ctx.font = `bold ${fontSize}px Georgia, serif`;
  ctx.textAlign = 'center';

  // Style palettes: [bgColor, borderColor, textColor, numColor]
  const palettes = {
    damage:   { bg: '60,0,0',   border: '255,60,60',  text: '255,180,80', num: '255,60,60' },
    recharge: { bg: '30,0,50',  border: '160,80,200', text: '200,170,255', num: '200,120,255' },
    scry:     { bg: '0,30,70',  border: '80,160,255', text: '180,220,255', num: '60,150,255' },
    multi:    { bg: '50,40,0',  border: '255,200,50', text: '255,230,150', num: '255,200,50' },
    heal:     { bg: '0,40,10',  border: '80,220,120', text: '180,255,200', num: '100,255,150' },
    gold:     { bg: '50,30,0',  border: '255,200,80', text: '255,230,150', num: '255,215,80' },
  };
  const pal = palettes[s];

  // Split text into tokens: numbers get highlighted when styled
  const tokens = toastMessage.split(/(\d+)/);
  let totalW = 0;
  const measured = tokens.map(t => {
    if (isStyled && /^\d+$/.test(t)) {
      ctx.font = `bold ${fontSize + 8}px Georgia, serif`;
      const w = ctx.measureText(t).width;
      ctx.font = `bold ${fontSize}px Georgia, serif`;
      return { text: t, w, isNum: true };
    }
    return { text: t, w: ctx.measureText(t).width, isNum: false };
  });
  for (const m of measured) totalW += m.w;

  const padX = 24, padY = isStyled ? 14 : 12;
  const boxW = totalW + padX * 2;
  const boxH = fontSize + padY * 2;
  // Center in the combat left area during combat, full screen otherwise
  const isOverlayState = state === GameState.SCRY_SELECT || state === GameState.MODAL_SELECT ||
    state === GameState.POWER_CHOICE;
  const isCombatState = !isOverlayState && (state === GameState.COMBAT || state === GameState.TARGETING ||
    state === GameState.DEFENDING || state === GameState.DAMAGE_SOURCE ||
    state === GameState.POWER_TARGETING ||
    state === GameState.ALLY_TARGETING || state === GameState.MULTI_TARGETING);
  const centerW = isCombatState ? COMBAT_LEFT_W : SCREEN_WIDTH;
  const x = (centerW - boxW) / 2;
  // Position toast above cards for overlay states (scry, modal, power choice)
  const isOverlay = state === GameState.SCRY_SELECT || state === GameState.MODAL_SELECT ||
    state === GameState.POWER_CHOICE;
  const y = isOverlay ? 130 : SCREEN_HEIGHT / 2 - 100;

  // Background
  ctx.fillStyle = pal ? `rgba(${pal.bg},${0.9 * alpha})` : `rgba(0,0,0,${0.8 * alpha})`;
  ctx.fillRect(x, y, boxW, boxH);
  // Border
  ctx.strokeStyle = pal ? `rgba(${pal.border},${alpha})` : `rgba(255,215,0,${alpha})`;
  ctx.lineWidth = isStyled ? 3 : 2;
  ctx.strokeRect(x, y, boxW, boxH);

  // Draw tokens left-to-right
  ctx.textBaseline = 'middle';
  const textY = y + boxH / 2;
  let tx = x + padX;
  for (const m of measured) {
    if (isStyled && m.isNum && pal) {
      ctx.font = `bold ${fontSize + 8}px Georgia, serif`;
      ctx.fillStyle = `rgba(${pal.num},${alpha})`;
    } else {
      ctx.font = `bold ${fontSize}px Georgia, serif`;
      ctx.fillStyle = pal ? `rgba(${pal.text},${alpha})` : `rgba(255,215,0,${alpha})`;
    }
    ctx.textAlign = 'left';
    ctx.fillText(m.text, tx, textY);
    tx += m.w;
  }
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
}

function drawScreenFlash() {
  if (screenFlashTimer <= 0) return;
  const alpha = Math.min(0.25, screenFlashTimer / 300 * 0.25);
  ctx.fillStyle = `rgba(200, 0, 0, ${alpha})`;
  ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
}

function drawTargetingArrow(x1, y1, x2, y2, color = Colors.RED) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  if (length < 10) return;

  const thickness = 6;
  const arrowLength = 25;
  const arrowWidth = 14;

  // Main line
  ctx.strokeStyle = color;
  ctx.lineWidth = thickness;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.lineCap = 'butt';

  // Arrowhead
  const ndx = dx / length;
  const ndy = dy / length;
  const baseX = x2 - ndx * arrowLength;
  const baseY = y2 - ndy * arrowLength;
  const perpX = -ndy * arrowWidth;
  const perpY = ndx * arrowWidth;
  const leftX = baseX + perpX;
  const leftY = baseY + perpY;
  const rightX = baseX - perpX;
  const rightY = baseY - perpY;

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(leftX, leftY);
  ctx.lineTo(rightX, rightY);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = Colors.WHITE;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawCharacterSplash() {
  const c = characterSplashCharacter;
  if (!c) return;

  // Dim background
  ctx.fillStyle = 'rgba(0,0,0,0.78)';
  ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

  // Pick the portrait art id
  const portraitArtId = characterSplashIsPlayer
    ? `${selectedClass.toLowerCase()}_class`
    : c.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  const art = getCardArt(portraitArtId);

  // Compute display rect (max ~85% of screen, preserve aspect)
  let drawW, drawH;
  if (art) {
    const maxH = SCREEN_HEIGHT - 100;
    const maxW = SCREEN_WIDTH - 200;
    const scale = Math.min(maxW / art.width, maxH / art.height);
    drawW = art.width * scale;
    drawH = art.height * scale;
  } else {
    drawH = SCREEN_HEIGHT - 200;
    drawW = drawH * 0.75;
  }
  const x = (SCREEN_WIDTH - drawW) / 2;
  const y = (SCREEN_HEIGHT - drawH) / 2;

  if (art) {
    ctx.drawImage(art, x, y, drawW, drawH);
  } else {
    ctx.fillStyle = characterSplashIsPlayer ? '#1a3a4e' : '#3a1a1a';
    ctx.fillRect(x, y, drawW, drawH);
  }
}

function drawCombatIntro() {
  // Fade out in last 400ms
  const fadeDuration = 400;
  const alpha = combatIntroTimer < fadeDuration ? combatIntroTimer / fadeDuration : 1;

  // Dim background
  ctx.fillStyle = `rgba(0,0,0,${0.78 * alpha})`;
  ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

  // Get monster art (try multiple keys: enemy name lowercased, monster portraits in card art)
  const enemyArtIds = [
    enemy.name.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
    enemy.name.toLowerCase().replace(/ /g, '_').replace(/'/g, ''),
  ];
  let art = null;
  for (const id of enemyArtIds) {
    art = getCardArt(id);
    if (art) break;
  }
  // Fallback: try common monster portraits
  if (!art) {
    const fallbacks = {
      'Giant Rat': 'giant_rat',
      'Bone Pile': 'bone_pile_monster',
      'Slime': 'slime_monster',
      'Kobold Warden': 'kobold_warden',
      'Dire Rat': 'dire_rat',
      'Kobold Patrol': 'kobold_patrol',
    };
    if (fallbacks[enemy.name]) art = getCardArt(fallbacks[enemy.name]);
  }

  if (art) {
    const maxH = SCREEN_HEIGHT - 80;
    const maxW = SCREEN_WIDTH - 120;
    const scale = Math.min(maxW / art.width, maxH / art.height);
    const w = art.width * scale;
    const h = art.height * scale;
    const x = (SCREEN_WIDTH - w) / 2;
    const y = (SCREEN_HEIGHT - h) / 2;
    ctx.globalAlpha = alpha;
    ctx.drawImage(art, x, y, w, h);
    ctx.globalAlpha = 1;

    // Gold border around the art
    ctx.strokeStyle = `rgba(255, 215, 0, ${alpha})`;
    ctx.lineWidth = 4;
    ctx.strokeRect(x, y, w, h);
  }

  // Message higher up on the image (about 1/4 from the top).
  // No black background box — just a strong drop shadow so the gold text
  // reads clearly over any art brightness.
  const msgY = Math.round(SCREEN_HEIGHT * 0.22);
  ctx.font = 'bold 42px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.save();
  ctx.shadowColor = `rgba(0,0,0,${alpha})`;
  ctx.shadowBlur = 12;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 3;
  ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
  // Wrap long titles (e.g. "Combat with Kobold Patrol!") to 2 lines
  // when they exceed ~80% of screen width.
  const maxMsgW = SCREEN_WIDTH * 0.8;
  if (ctx.measureText(combatIntroMessage).width > maxMsgW) {
    const words = combatIntroMessage.split(' ');
    let best = words.length;
    for (let i = 1; i < words.length; i++) {
      const l1 = words.slice(0, i).join(' ');
      const l2 = words.slice(i).join(' ');
      if (ctx.measureText(l1).width <= maxMsgW && ctx.measureText(l2).width <= maxMsgW) {
        best = i; break;
      }
    }
    const line1 = words.slice(0, best).join(' ');
    const line2 = words.slice(best).join(' ');
    ctx.fillText(line1, SCREEN_WIDTH / 2, msgY - 24);
    ctx.fillText(line1, SCREEN_WIDTH / 2, msgY - 24);
    if (line2) { ctx.fillText(line2, SCREEN_WIDTH / 2, msgY + 24); ctx.fillText(line2, SCREEN_WIDTH / 2, msgY + 24); }
  } else {
    ctx.fillText(combatIntroMessage, SCREEN_WIDTH / 2, msgY);
    ctx.fillText(combatIntroMessage, SCREEN_WIDTH / 2, msgY);
  }
  ctx.restore();

  // Click hint
  ctx.font = '14px sans-serif';
  ctx.fillStyle = `rgba(180,180,180,${alpha * 0.8})`;
  ctx.fillText('Click to begin', SCREEN_WIDTH / 2, SCREEN_HEIGHT - 30);
  ctx.textAlign = 'left';
}

function drawCardTooltip() {
  // Find hovered hand card (topmost first)
  const handRects = getHandCardRects(player.deck.hand);
  for (let i = handRects.length - 1; i >= 0; i--) {
    const r = handRects[i];
    if (hitTest(mouseX, mouseY, getHandCardHoverRect(handRects, i))) {
      const card = player.deck.hand[i];
      drawTooltipBox(card, r.x + r.w + 10, r.y - 60);
      return;
    }
  }
}

function drawTooltipBox(card, x, y) {
  const w = 220;
  const padding = 10;

  // Build text lines
  const lines = [];
  lines.push({ text: card.name, font: 'bold 15px sans-serif', color: Colors.WHITE });
  lines.push({ text: `${card.cardType} • ${card.costType}`, font: '12px sans-serif', color: Colors.GOLD });
  if (card.subtype) lines.push({ text: card.subtype, font: '11px sans-serif', color: Colors.GRAY });
  lines.push({ text: '', font: '8px sans-serif', color: Colors.GRAY }); // spacer
  // Description word-wrapped
  const descLines = wrapTextLong(card.description, w - padding * 2, 13);
  for (const dl of descLines) {
    lines.push({ text: dl, font: '13px sans-serif', color: '#ddd' });
  }
  // Effects summary
  if (card.currentEffects.length > 0) {
    lines.push({ text: '', font: '8px sans-serif', color: Colors.GRAY });
    for (const eff of card.currentEffects) {
      let desc = `${eff.effectType}: ${eff.value}`;
      if (eff.target === TargetType.ALL_ENEMIES) desc += ' (ALL)';
      if (eff.maxTargets > 0) desc += ` (x${eff.maxTargets})`;
      lines.push({ text: desc, font: '11px sans-serif', color: '#aaa' });
    }
  }
  // Modal modes
  if (card.isModal && card.modes) {
    lines.push({ text: '', font: '8px sans-serif', color: Colors.GRAY });
    lines.push({ text: 'Choose one:', font: 'bold 11px sans-serif', color: Colors.GOLD });
    for (const mode of card.modes) {
      lines.push({ text: `• ${mode.description}`, font: '11px sans-serif', color: '#ccc' });
    }
  }
  // Creature preview for summon cards
  if (card.cardType === CardType.CREATURE || card.effects.some(e => e.target === TargetType.SUMMON)) {
    lines.push({ text: '', font: '8px sans-serif', color: Colors.GRAY });
    lines.push({ text: 'Summons:', font: 'bold 11px sans-serif', color: Colors.GREEN });
    // Infer creature stats from card
    const summonInfo = getSummonPreview(card);
    if (summonInfo) {
      lines.push({ text: `${summonInfo.name} (${summonInfo.atk}/${summonInfo.hp})`, font: '12px sans-serif', color: '#afc' });
      if (summonInfo.abilities) lines.push({ text: summonInfo.abilities, font: '10px sans-serif', color: '#8a8' });
    }
  }

  const lineH = 17;
  const h = lines.length * lineH + padding * 2;

  // Keep on screen
  if (x + w > SCREEN_WIDTH) x = mouseX - w - 10;
  if (y + h > SCREEN_HEIGHT) y = SCREEN_HEIGHT - h - 5;
  if (y < 5) y = 5;

  // Background
  ctx.fillStyle = 'rgba(10,10,30,0.95)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = Colors.GOLD;
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);

  // Text
  ctx.textAlign = 'left';
  let ty = y + padding + 13;
  for (const line of lines) {
    ctx.font = line.font;
    ctx.fillStyle = line.color;
    ctx.fillText(line.text, x + padding, ty);
    ty += lineH;
  }
}

function getSummonPreview(card) {
  const previews = {
    skreeeeeeeek: { name: 'Rat', atk: 1, hp: 1 },
    tamed_rat: { name: 'Tamed Rat', atk: 1, hp: 1 },
    pet_spider: { name: 'Spider', atk: 0, hp: 1, abilities: 'Poison Attack' },
    guards: { name: 'Kobold Guard', atk: 2, hp: 1 },
    thorb_card: { name: 'Thorb', atk: 2, hp: 4, abilities: 'Companion' },
    thorb_card_2: { name: 'Thorb', atk: 2, hp: 5, abilities: 'Sentinel, Companion' },
    summon_treants: { name: 'Treant', atk: 2, hp: 3 },
    magma_mephit_summon: { name: 'Magma Mephit', atk: 2, hp: 5, abilities: 'Fire Immune' },
  };
  return previews[card.id] || null;
}

// === Combat character/power card sizes (matches py game proportions) ===
const COMBAT_CHAR_W = 235;
const COMBAT_CHAR_H = 321;
const COMBAT_POWER_W = 105;
const COMBAT_POWER_H = 140;
// Creature mini-cards: same size as power cards
const CREATURE_CARD_W = COMBAT_POWER_W;
const CREATURE_CARD_H = COMBAT_POWER_H;
const CREATURE_GRID_GAP = 8;
const CREATURE_COLS = 6;

// Get the rect for the character "big card" inside the player or enemy area
function getCharacterCardRect(isPlayer) {
  const area = isPlayer ? COMBAT_PLAYER_AREA : COMBAT_ENEMY_AREA;
  // Character card takes ~2/3 of the area height. Player section pushed
  // 10 px DOWN and enemy section 10 px UP total (two 5-px iterations) to
  // give the Your Turn / Enemy Turn banner solid breathing room.
  const x = area.x + 16;
  const y = isPlayer
    ? area.y + (area.h - COMBAT_CHAR_H) - 3   // bottom-anchored, +13 down total
    : area.y + 3;                              // top-anchored, -13 up total
  return { x, y, w: COMBAT_CHAR_W, h: COMBAT_CHAR_H };
}

// Get the rect for the i-th power card (smaller, above player or below enemy).
// Powers follow the character card shift and get an extra 2 px nudge toward
// the character (two 1-px iterations) — player power further down, enemy
// power further up — pulling them off the banner.
function getCharacterPowerRect(isPlayer, index = 0) {
  const charRect = getCharacterCardRect(isPlayer);
  const x = charRect.x + index * (COMBAT_POWER_W + 8);
  const y = isPlayer
    ? charRect.y - COMBAT_POWER_H - 2  // above player card, 4 px closer total
    : charRect.y + COMBAT_CHAR_H + 2;  // below enemy card, 4 px closer total
  return { x, y, w: COMBAT_POWER_W, h: COMBAT_POWER_H };
}

function drawCharacterPanel(character, side) {
  const isPlayer = side === 'player';
  const rect = getCharacterCardRect(isPlayer);

  // Targetable highlight (red border outside the card) — drawn first
  if ((state === GameState.TARGETING ||
       state === GameState.POWER_TARGETING ||
       state === GameState.ALLY_TARGETING ||
       state === GameState.MULTI_TARGETING) && !isPlayer) {
    // Gold border if already picked in multi-target
    if (state === GameState.MULTI_TARGETING && multiTargets.includes(enemy)) {
      ctx.strokeStyle = Colors.GOLD;
    } else {
      ctx.strokeStyle = Colors.RED;
    }
    ctx.lineWidth = 4;
    ctx.strokeRect(rect.x - 4, rect.y - 4, rect.w + 8, rect.h + 8);
  }

  // Portrait art fills the card
  const portraitArtId = isPlayer
    ? `${selectedClass.toLowerCase()}_class`
    : character.name.toLowerCase().replace(/ /g, '_');
  const portrait = getCardArt(portraitArtId);
  const hasArt = !!portrait;

  // Shift the portrait art down 10 px (same amount as the class-select cards)
  // so the frame's top filigree stops cropping heads. Clip to the card rect so
  // the overflow at the bottom is trimmed cleanly.
  if (hasArt) {
    const imgAspect = portrait.width / portrait.height;
    const cardAspect = rect.w / rect.h;
    let sx = 0, sy = 0, sw = portrait.width, sh = portrait.height;
    if (imgAspect > cardAspect) { sw = portrait.height * cardAspect; sx = (portrait.width - sw) / 2; }
    else { sh = portrait.width / cardAspect; sy = (portrait.height - sh) / 2; }
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    ctx.drawImage(portrait, sx, sy, sw, sh, rect.x, rect.y + 10, rect.w, rect.h);
    ctx.restore();
  } else {
    ctx.fillStyle = isPlayer ? '#1a3a4e' : '#3a1a1a';
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  }

  // Ornate 9-slice frame, no tint (plain gold reads as "hero / boss" rather
  // than locking the panel to a single subtype color). Easy to tint later —
  // pass a color as the third arg to getTintedFrameImage.
  const frameImg = images.frame_common;
  if (frameImg) {
    const corner = CARD_FRAME_CORNERS.frame_common || 24;
    const scaledCorner = Math.max(8, Math.min(corner, Math.floor(Math.min(rect.w, rect.h) * 0.11)));
    draw9SliceFrame(frameImg, rect.x, rect.y, rect.w, rect.h, scaledCorner);
  } else {
    // Fallback if the frame PNG hasn't loaded yet
    ctx.strokeStyle = Colors.WHITE;
    ctx.lineWidth = 3;
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  }

  // No more dark wash overlay — the art shows through. Text relies on a drop
  // shadow for readability.
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.95)';
  ctx.shadowBlur = 5;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 2;

  // Character name (with level only for player) at top, white
  ctx.fillStyle = Colors.WHITE;
  ctx.font = 'bold 18px Georgia, serif';
  ctx.textAlign = 'center';
  const displayName = isPlayer && player
    ? `${character.name} (${player.level || 1})`
    : character.name;
  ctx.fillText(displayName, rect.x + rect.w / 2, rect.y + 30); // +4 down from frame top

  // Card counts: Hand / Deck / Discard centered — all shifted down 4 px.
  const infoTop = rect.y + 54;
  const handCount = character.deck.hand.length;
  const deckCount = character.deck.drawPile.length;
  const rechargeCount = character.deck.rechargePile.length;
  const discardCount = character.deck.discardPile.length;

  ctx.font = '15px sans-serif';
  ctx.fillStyle = Colors.WHITE;
  ctx.fillText(`Hand: ${handCount}`, rect.x + rect.w / 2, infoTop);

  let deckText = `Deck: ${deckCount}`;
  if (rechargeCount > 0) deckText += `(${rechargeCount})`;
  // Keep the deck text white. Debug-mode click-to-draw still works; we just
  // don't color the text green anymore (confused players who had debug on).
  ctx.fillText(deckText, rect.x + rect.w / 2, infoTop + 22);
  if (debugMode && isPlayer) {
    const deckW = ctx.measureText(deckText).width;
    logCardHitAreas.push({
      x: rect.x + rect.w / 2 - deckW / 2 - 4,
      y: infoTop + 22 - 14,
      w: deckW + 8,
      h: 18,
      debugDraw: true,
    });
  }

  // "Discard: N" — hover the row to preview the top discarded card.
  // Bright red + bold when non-empty so it stands out.
  ctx.fillStyle = discardCount > 0 ? '#ff4444' : '#aaa';
  if (discardCount > 0) ctx.font = 'bold 15px sans-serif';
  const discardLabel = `Discard: ${discardCount}`;
  ctx.fillText(discardLabel, rect.x + rect.w / 2, infoTop + 44);
  if (discardCount > 0) ctx.font = '15px sans-serif';
  ctx.restore(); // end the text-shadow scope started before the name draw
  if (discardCount > 0) {
    const discardW = ctx.measureText(discardLabel).width;
    const topCard = character.deck.discardPile[character.deck.discardPile.length - 1];
    logCardHitAreas.push({
      x: rect.x + rect.w / 2 - discardW / 2 - 4,
      y: infoTop + 44 - 14,
      w: discardW + 8,
      h: 18,
      card: topCard,
    });
  }

  // Status icons row (shield, heroism, etc.) above the HP bar. Left edge
  // aligned with the HP bar start (rect.x + 18) so they sit inside the
  // frame's inner edge.
  const iconRowY = rect.y + rect.h - 74;
  let iconX = rect.x + 18;
  const iconSize = 22;
  const drawStatusIcon = (iconKey, value, color, keyword) => {
    if (value <= 0) return;
    const img = images[iconKey];
    if (img) {
      ctx.drawImage(img, iconX, iconRowY, iconSize, iconSize);
      // Register hover hit area so the keyword tooltip system shows the definition
      if (keyword) {
        iconHitAreas.push({ x: iconX, y: iconRowY, w: iconSize, h: iconSize, keyword });
      }
      iconX += iconSize + 2;
    }
    // Bolder + brighter numbers for readability over the frame background.
    // Double-drawn so the shadow pass builds the text outline.
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.95)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.fillStyle = color;
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(value.toString(), iconX, iconRowY + 17);
    // Measure with the SAME font we just drew with. If we measure after
    // restore() the font reverts to whatever was set before this block
    // (e.g. discardCount sets 15px earlier), so the next icon's x position
    // jitters depending on what was last drawn — the visual "flicker"
    // when hovering between cards.
    const advance = ctx.measureText(value.toString()).width + 8;
    ctx.restore();
    iconX += advance;
  };
  drawStatusIcon('icon_shield', character.shield, Colors.ALLY_BLUE, 'shield');
  drawStatusIcon('icon_heroism', character.heroism, Colors.GOLD, 'heroism');
  drawStatusIcon('icon_armor', character.armor || 0, Colors.GRAY, 'armor');
  drawStatusIcon('icon_rage', character.rage || 0, Colors.RED, 'rage');
  drawStatusIcon('icon_fire', character.getStatus('FIRE') || 0, Colors.ORANGE, 'fire');
  drawStatusIcon('icon_ice', character.getStatus('ICE') || 0, Colors.ICE_BLUE, 'ice');
  drawStatusIcon('icon_poison', character.getStatus('POISON') || 0, Colors.GREEN, 'poison');
  drawStatusIcon('icon_shock', character.getStatus('SHOCK') || 0, Colors.SHOCK_YELLOW, 'shock');

  // Combat buff badges (continue on same row as status icons, using iconX)
  if (character.combatBuffs && character.combatBuffs.length > 0) {
    if (iconX > rect.x + 10) iconX += 4; // small gap after status icons
    const buffSize = iconSize;
    for (const buff of character.combatBuffs) {
      const buffArt = getCardArt(buff.imageId);
      if (buffArt) {
        ctx.drawImage(buffArt, iconX, iconRowY, buffSize, buffSize);
      } else {
        ctx.fillStyle = '#3a6a3a';
        ctx.fillRect(iconX, iconRowY, buffSize, buffSize);
      }
      ctx.strokeStyle = Colors.GREEN;
      ctx.lineWidth = 1;
      ctx.strokeRect(iconX, iconRowY, buffSize, buffSize);
      // Count badge: turns remaining (timed buffs) or stacks (persistent buffs)
      const badgeNum = buff.turnsRemaining > 0
        ? buff.turnsRemaining
        : (buff.stacks && buff.stacks > 1 ? buff.stacks : 0);
      if (badgeNum > 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(iconX + buffSize - 10, iconRowY, 12, 12);
        ctx.fillStyle = Colors.WHITE;
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(badgeNum.toString(), iconX + buffSize - 4, iconRowY + 10);
        ctx.textAlign = 'left';
      }
      logCardHitAreas.push({
        x: iconX, y: iconRowY, w: buffSize, h: buffSize,
        buff,
      });
      iconX += buffSize + 3;
    }
  }

  // HP bar at the bottom of the card (green). Up 4 px and shrunk 8 px off
  // each side so it fits comfortably inside the frame's bottom filigree.
  const hp = getHP(character);
  const maxHp = getMaxHP(character);
  const barX = rect.x + 18, barW = rect.w - 36, barH = 22;
  const barY = rect.y + rect.h - barH - 14;
  ctx.fillStyle = '#222';
  ctx.fillRect(barX, barY, barW, barH);
  const hpPct = maxHp > 0 ? hp / maxHp : 0;
  ctx.fillStyle = hpPct > 0.5 ? Colors.GREEN : (hpPct > 0.25 ? Colors.GOLD : Colors.RED);
  ctx.fillRect(barX, barY, barW * hpPct, barH);
  ctx.strokeStyle = Colors.WHITE;
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barW, barH);
  ctx.fillStyle = Colors.WHITE;
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`HP: ${hp}/${maxHp}`, barX + barW / 2, barY + 16);

  ctx.textAlign = 'left';
}

// Draw a creature as a card-shaped mini card (half of the main character card).
// Player allies use a blue border; enemies use brown. Targetable highlights with red,
// already-picked (multi-target) highlights with gold.
function drawCreatureCard(creature, rect, isPlayer, isPreview = false) {
  // isPreview = true when drawn as a side-preview tile (e.g. next to a hovered
  // card with a previewCreature). Suppresses combat-state highlights and the
  // hover hit area so the preview doesn't pretend to be a clickable creature.
  const targetingNow = !isPreview && (
    state === GameState.TARGETING ||
    state === GameState.POWER_TARGETING ||
    state === GameState.ALLY_TARGETING ||
    state === GameState.MULTI_TARGETING);
  const isTargetable = targetingNow && !isPlayer;
  const isPicked = !isPreview && (
    (state === GameState.POWER_TARGETING && powerTargets.includes(creature)) ||
    (state === GameState.MULTI_TARGETING && multiTargets.includes(creature)));
  // Highlight a ready ally that's selected for ally-targeting
  const isSelectedAlly = !isPreview && isPlayer && state === GameState.ALLY_TARGETING && selectedAlly === creature;
  const isReadyAlly = !isPreview && isPlayer && !creature.exhausted && state === GameState.COMBAT;

  // Outer highlight
  if (isPicked || isSelectedAlly) {
    ctx.fillStyle = Colors.GOLD;
    ctx.fillRect(rect.x - 4, rect.y - 4, rect.w + 8, rect.h + 8);
  } else if (isTargetable) {
    ctx.strokeStyle = Colors.RED;
    ctx.lineWidth = 3;
    ctx.strokeRect(rect.x - 3, rect.y - 3, rect.w + 6, rect.h + 6);
  } else if (isReadyAlly) {
    // Subtle green ring on ready allies so the player knows they can click them
    ctx.strokeStyle = Colors.GREEN;
    ctx.lineWidth = 3;
    ctx.strokeRect(rect.x - 3, rect.y - 3, rect.w + 6, rect.h + 6);
  }

  // Try creature art first (image keyed off snake-cased creature name).
  // Eagerly preloaded creature art lives in the `images` map under `creature_<key>`.
  // Fall back to the lazy getCardArt cache if not preloaded.
  const artKey = (creature.name || '').toLowerCase().replace(/ /g, '_');
  const art = images[`creature_${artKey}`] || getCardArt(artKey);
  if (art) {
    const imgAspect = art.width / art.height;
    const cardAspect = rect.w / rect.h;
    let sx = 0, sy = 0, sw = art.width, sh = art.height;
    if (imgAspect > cardAspect) { sw = art.height * cardAspect; sx = (art.width - sw) / 2; }
    else { sh = art.width / cardAspect; sy = (art.height - sh) / 2; }
    ctx.drawImage(art, sx, sy, sw, sh, rect.x, rect.y, rect.w, rect.h);
  } else {
    ctx.fillStyle = isPlayer ? '#1a3a4e' : '#3a2020';
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  }

  // Frame asset comes from source card's rarity (common / uncommon / rare).
  // Frame TINT comes from source card's subtype if known (purple for ability,
  // brown for ally, etc.) — so a creature reads as part of the same visual
  // family as its source card. Falls back to ownership tint for enemies and
  // live-combat creatures with no source-card hint.
  const cFrameKey = getFrameKeyForRarity(creature._sourceRarity);
  const cFrameImg = images[cFrameKey];
  if (cFrameImg) {
    const corner = CARD_FRAME_CORNERS[cFrameKey] || 24;
    const scaledCorner = Math.max(6, Math.min(corner, Math.floor(Math.min(rect.w, rect.h) * 0.10)));
    const subtypeTint = creature._sourceSubtype ? SUBTYPE_COLORS[creature._sourceSubtype] : null;
    const cTint = subtypeTint || (isPlayer ? Colors.ALLY_BLUE : Colors.BROWN);
    const cTinted = getTintedFrameImage(cFrameImg, cFrameKey, cTint);
    draw9SliceFrame(cTinted, rect.x, rect.y, rect.w, rect.h, scaledCorner);
  } else {
    ctx.strokeStyle = isPlayer ? Colors.ALLY_BLUE : Colors.BROWN;
    ctx.lineWidth = 2;
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  }

  // Name at top — no background box; drop shadow for readability; wraps to 2 lines.
  const nameFont = 'bold ' + Math.max(8, Math.floor(rect.w * 0.085)) + 'px sans-serif';
  ctx.font = nameFont;
  const nameH = Math.max(13, Math.floor(rect.w * 0.12));
  const filigreeClearance = 24; // small-card clearance
  const maxNameWidth = rect.w - filigreeClearance;
  const nameLines = wrapCardName(creature.name, maxNameWidth, ctx);
  const twoLineBump = nameLines.length > 1 ? 6 : 0;
  const nameY = rect.y + 13 + twoLineBump;
  const nameLineH = Math.floor(nameH * 0.85);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.95)';
  ctx.shadowBlur = 3;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = Colors.GOLD;
  for (let li = 0; li < nameLines.length; li++) {
    const lineCy = nameY + nameH / 2 + 1 + (li - (nameLines.length - 1) / 2) * nameLineH;
    ctx.fillText(nameLines[li], rect.x + rect.w / 2, lineCy);
  }
  ctx.restore();
  ctx.textBaseline = 'top';

  // HP bar (right half of bottom row) — original X (no toward-center shift),
  // 10 px up so the stats sit clearly on top of the frame's bottom filigree.
  const rowBottom = rect.y + rect.h - 4 - 10;
  const hpBarH = 12;
  const hpBarX = rect.x + rect.w / 2;
  const hpBarW = rect.w / 2 - 6;
  const hpBarY = rowBottom - hpBarH;
  ctx.fillStyle = '#222';
  ctx.fillRect(hpBarX, hpBarY, hpBarW, hpBarH);
  const hpPct = creature.maxHp > 0 ? Math.max(0, creature.currentHp) / creature.maxHp : 0;
  ctx.fillStyle = hpPct > 0.5 ? Colors.GREEN : (hpPct > 0.25 ? Colors.GOLD : Colors.RED);
  ctx.fillRect(hpBarX, hpBarY, hpBarW * hpPct, hpBarH);
  ctx.strokeStyle = Colors.WHITE;
  ctx.lineWidth = 1;
  ctx.strokeRect(hpBarX, hpBarY, hpBarW, hpBarH);
  ctx.fillStyle = Colors.WHITE;
  ctx.font = 'bold 10px sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${creature.currentHp}/${creature.maxHp}`, hpBarX + hpBarW / 2, hpBarY + hpBarH / 2 + 1);

  // Attack number on the left — net shift: 8 px right (toward center) and
  // up by following hpBarY.
  ctx.font = 'bold 16px sans-serif';
  ctx.fillStyle = Colors.WHITE;
  ctx.textAlign = 'left';
  ctx.fillText(`${creature.attack}`, rect.x + 6 + 8, hpBarY + hpBarH / 2 + 1);
  // Poison-attack indicator (icon beside the attack number)
  if (creature.poisonAttack) {
    const atkTextW = ctx.measureText(`${creature.attack}`).width;
    const poisonImg = images['icon_poison'];
    const pIconSize = 14;
    const px = rect.x + 6 + 8 + atkTextW + 2; // follow attack-number shift
    const py = hpBarY + (hpBarH - pIconSize) / 2;
    if (poisonImg) {
      ctx.drawImage(poisonImg, px, py, pIconSize, pIconSize);
    } else {
      // Fallback dot
      ctx.fillStyle = Colors.GREEN;
      ctx.beginPath(); ctx.arc(px + 6, py + 7, 4, 0, Math.PI * 2); ctx.fill();
    }
  }

  // Status badges row (above HP/attack): shield, heroism, armor, fire/ice/poison.
  // Aligned with the attack number's left edge (rect.x + 14) instead of the
  // card's bare-left, so buffs sit in the same column as the atk value.
  const badgeY = hpBarY - 18;
  let bx = rect.x + 14;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  // Helper: draw an icon + bold, drop-shadowed count (uses the keyword icon
  // assets for Shield / Heroism / Armor so they read the same as cards).
  const drawCreatureBadgeIcon = (iconKey, stacks, color) => {
    if (stacks <= 0) return;
    const img = images[iconKey];
    const ICON = 16;
    if (img) {
      ctx.drawImage(img, bx, badgeY - 2, ICON, ICON);
      bx += ICON + 1;
    }
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.95)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.fillStyle = color;
    ctx.font = 'bold 15px sans-serif';
    const txt = stacks.toString();
    ctx.fillText(txt, bx, badgeY + 6);
    ctx.restore();
    bx += ctx.measureText(txt).width + 6;
  };
  drawCreatureBadgeIcon('icon_shield', creature.shield, '#9ad6ff');
  drawCreatureBadgeIcon('icon_heroism', creature.heroism, Colors.GOLD);
  drawCreatureBadgeIcon('icon_armor', creature.armor, '#cccccc');
  ctx.font = 'bold 12px sans-serif';
  // Status effects: fire / ice / poison / shock — left-aligned with icons
  const cIconSize = 14;
  const drawCreatureStatus = (iconKey, stacks, color) => {
    if (stacks <= 0) return;
    const img = images[iconKey];
    if (img) {
      ctx.drawImage(img, bx, badgeY - 1, cIconSize, cIconSize);
      bx += cIconSize + 1;
    }
    ctx.fillStyle = color;
    ctx.textAlign = 'left';
    ctx.fillText(stacks.toString(), bx, badgeY + 6);
    bx += ctx.measureText(stacks.toString()).width + 4;
  };
  drawCreatureStatus('icon_fire', creature.fireStacks, Colors.ORANGE);
  drawCreatureStatus('icon_ice', creature.iceStacks, Colors.ICE_BLUE);
  drawCreatureStatus('icon_poison', creature.poisonStacks, Colors.GREEN);
  drawCreatureStatus('icon_shock', creature.shockStacks || 0, Colors.SHOCK_YELLOW);

  // Exhausted overlay (Zzz) for any exhausted creature (player ally or
  // freshly summoned enemy). Suppressed on side previews — the spider/slime
  // shown next to a hovered card is informational, not a sleeping creature.
  if (!isPreview && creature.exhausted) {
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = Colors.ORANGE;
    ctx.font = 'bold 18px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Zzz', rect.x + rect.w / 2, rect.y + rect.h / 2);
  }

  // Info badge for creatures with special abilities (centered, below the Zzz area)
  if (creature.unpreventable || creature.description) {
    const ix = rect.x + rect.w / 2;
    const iy = rect.y + rect.h / 2 + 16;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath();
    ctx.arc(ix, iy, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = Colors.ALLY_BLUE;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = Colors.ALLY_BLUE;
    ctx.font = 'bold 13px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('i', ix, iy + 1);
  }

  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';

  // Register hover hit area so hovering shows the full-size preview. Skipped
  // in preview mode — the side-preview tile shouldn't claim hover events.
  if (!isPreview) {
    logCardHitAreas.push({
      x: rect.x, y: rect.y, w: rect.w, h: rect.h,
      creature: creature,
    });
  }
}

// Side-preview tile (e.g. next to a hovered card with a previewCreature).
// Delegates to drawCreatureCard with isPreview=true so the visuals exactly
// match the Summons tab — no second creature card style to keep in sync.
function drawCreatureMiniCard(creature, rect, isPlayer) {
  drawCreatureCard(creature, rect, isPlayer, true);
}

function drawCombatLog() {
  const logX = COMBAT_LOG_AREA.x + 8;
  const logY = COMBAT_LOG_AREA.y + 8;
  const logW = COMBAT_LOG_AREA.w - 16;
  const logH = COMBAT_LOG_AREA.h - 16;

  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(logX, logY, logW, logH);
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 1;
  ctx.strokeRect(logX, logY, logW, logH);

  ctx.font = '12px sans-serif';
  ctx.textAlign = 'left';
  const lineH = 15;
  const sbW = 6; // scrollbar width
  const maxWidth = logW - 12 - sbW;

  // Build ALL wrapped lines
  const wrappedEntries = [];
  for (const entry of combatLog) {
    const lines = wrapTextLong(entry.text, maxWidth, 12);
    for (let j = 0; j < lines.length; j++) {
      wrappedEntries.push({
        text: lines[j], color: entry.color, card: entry.card,
        creature: entry.creature,
        isFirstLine: j === 0, arrow: entry.arrow && j === 0,
      });
    }
  }

  const totalContentH = wrappedEntries.length * lineH;
  const visibleH = logH - 4;
  const maxScroll = Math.max(0, totalContentH - visibleH);

  // Clamp scroll and auto-pin to bottom when new entries arrive
  combatLogScrollY = Math.min(combatLogScrollY, maxScroll);

  // Calculate which line to start from (bottom-aligned with scroll offset)
  const scrollOffset = maxScroll - combatLogScrollY;

  // Clip to log area
  ctx.save();
  ctx.beginPath();
  ctx.rect(logX, logY, logW - sbW, logH);
  ctx.clip();

  let y = logY + 14 - scrollOffset;
  for (let i = 0; i < wrappedEntries.length; i++) {
    if (y + lineH < logY || y > logY + logH) { y += lineH; continue; }
    const e = wrappedEntries[i];
    if (e.arrow && e.text.startsWith('→ ')) {
      ctx.fillStyle = Colors.ORANGE;
      ctx.fillText('→', logX + 6, y);
      const arrowW = ctx.measureText('→ ').width;
      ctx.fillStyle = e.color;
      ctx.fillText(e.text.slice(2), logX + 6 + arrowW, y);
    } else {
      ctx.fillStyle = e.color;
      ctx.fillText(e.text, logX + 6, y);
    }
    if ((e.card || e.creature) && e.isFirstLine && y >= logY && y <= logY + logH) {
      logCardHitAreas.push({
        x: logX + 4, y: y - 12, w: maxWidth + 4, h: lineH,
        card: e.card || null,
        creature: e.creature || null,
      });
    }
    y += lineH;
  }
  ctx.restore();

  // Scrollbar (right edge of log)
  if (totalContentH > visibleH) {
    const sbX = logX + logW - sbW;
    const thumbH = Math.max(16, visibleH * (visibleH / totalContentH));
    const thumbY = logY + (scrollOffset / totalContentH) * (visibleH - thumbH);
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(sbX, logY, sbW, logH);
    ctx.fillStyle = 'rgba(255,215,0,0.5)';
    ctx.fillRect(sbX, thumbY, sbW, thumbH);
  }
}

// --- Combat right-column buttons ---
// Layout: top row has backpack + help icons on the LEFT (and I Win on the right when debug),
// End Turn button (original size) below.
function getCombatButtonRects() {
  const padding = 8;
  const iconSize = 40;
  const rowH = 50; // taller row to give I Win banner some height
  const iconY = COMBAT_BTN_AREA.y + padding + (rowH - iconSize) / 2;
  // Icons aligned to the left
  const backpackX = COMBAT_BTN_AREA.x + padding;
  const helpX = backpackX + iconSize + 8;
  // I Win banner on the right (debug only) — fits inside the button area
  const iconsRightEdge = helpX + iconSize;
  const iWinW = COMBAT_BTN_AREA.w - (iconsRightEdge - COMBAT_BTN_AREA.x) - padding * 2 - 10;
  const iWinX = COMBAT_BTN_AREA.x + COMBAT_BTN_AREA.w - iWinW - padding;
  // End Turn button below the icons
  const endTurnW = COMBAT_BTN_AREA.w - padding * 2;
  const endTurnH = COMBAT_BTN_AREA.h - rowH - padding * 3;
  return {
    backpack: { x: backpackX, y: iconY, w: iconSize, h: iconSize },
    help: { x: helpX, y: iconY, w: iconSize, h: iconSize },
    iWin: { x: iWinX, y: COMBAT_BTN_AREA.y + padding, w: iWinW, h: rowH },
    endTurn: {
      x: COMBAT_BTN_AREA.x + padding,
      y: COMBAT_BTN_AREA.y + padding + rowH + padding,
      w: endTurnW,
      h: endTurnH,
    },
  };
}

// Clean icon button — no background panel, just the icon with optional hover ring
function drawIconButton(rect, iconKey, action, label = '') {
  const hovered = hitTest(mouseX, mouseY, rect);
  const img = images[iconKey];

  if (img) {
    if (hovered) {
      // Subtle gold glow ring on hover
      ctx.shadowColor = Colors.GOLD;
      ctx.shadowBlur = 8;
    }
    ctx.drawImage(img, rect.x, rect.y, rect.w, rect.h);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  } else if (label) {
    ctx.fillStyle = hovered ? Colors.GOLD : Colors.WHITE;
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2);
    ctx.textBaseline = 'alphabetic';
  }

  if (action) menuButtons.push({ ...rect, action });
}

function drawCombatButtons() {
  const rects = getCombatButtonRects();
  const enabled = isPlayerTurn && !powerRechargeMode && combatIntroTimer <= 0;

  // End Turn button (LEFT, large)
  if (enabled) {
    drawStyledButton(rects.endTurn.x, rects.endTurn.y, rects.endTurn.w, rects.endTurn.h, 'End Turn', endPlayerTurn, 'large', 20);
  } else {
    ctx.globalAlpha = 0.4;
    drawStyledButton(rects.endTurn.x, rects.endTurn.y, rects.endTurn.w, rects.endTurn.h, 'End Turn', null, 'large', 20);
    ctx.globalAlpha = 1;
    menuButtons.pop();
  }

  // Backpack icon (right side, top row left)
  drawIconButton(rects.backpack, 'icon_backpack', () => {
    previousState = state;
    state = GameState.INVENTORY;
  }, 'Bag');

  // Help icon (right side, top row right)
  drawIconButton(rects.help, 'icon_help', () => {
    previousState = state;
    helpScrollY = 0;
    state = GameState.HELP_SCREEN;
  }, '?');

  // I Win banner (debug only, right of icons) — uses the wooden plank sprite
  if (debugMode) {
    const r = rects.iWin;
    drawStyledButton(r.x, r.y, r.w, r.h, 'I WIN', () => {
      // Debug: instantly win the combat
      if (enemy) {
        for (const c of enemy.creatures) c.currentHp = 0;
        enemy.creatures = [];
        if (enemy.deck) {
          enemy.deck.drawPile = [];
          enemy.deck.hand = [];
          enemy.deck.rechargePile = [];
        }
        enemy._invulnerable = false;
        killCount = killTarget;
        addLog('Debug: I Win!', Colors.GOLD);
        checkCombatEnd();
      }
    }, 'large', 16);
  }
}

// --- Power rendering ---
const POWER_W = COMBAT_POWER_W;
const POWER_H = COMBAT_POWER_H;

function getPowerRect(index = 0) {
  // Power card(s) sit above the player character card, left-aligned
  return getCharacterPowerRect(true, index);
}

// Draw a single power card at a given rect
function drawPowerCard(power, r, clickable) {
  const hovered = hitTest(mouseX, mouseY, r);
  if (hovered && !isShiftFrozen()) hoveredPowerPreview = power;
  // Check eager preload first to avoid any lazy-load reload flicker on hover
  const art = images[`power_${power.id}`];
  const usable = clickable && power.canUse() && isPlayerTurn && !powerRechargeMode;

  if (art) {
    const imgAspect = art.width / art.height;
    const cardAspect = r.w / r.h;
    let sx = 0, sy = 0, sw = art.width, sh = art.height;
    if (imgAspect > cardAspect) { sw = art.height * cardAspect; sx = (art.width - sw) / 2; }
    else { sh = art.width / cardAspect; sy = (art.height - sh) / 2; }
    if (power.exhausted) ctx.globalAlpha = 0.5;
    ctx.drawImage(art, sx, sy, sw, sh, r.x, r.y, r.w, r.h);
    ctx.globalAlpha = 1;
  } else {
    ctx.fillStyle = power.exhausted ? '#333' : '#643c64'; // (100, 60, 100)
    ctx.fillRect(r.x, r.y, r.w, r.h);
  }

  // Power name — no background box, drop shadow, wraps to 2 lines if needed
  // (mirrors small regular cards in drawCard).
  const nameFont = 'bold ' + Math.max(8, Math.floor(r.w * 0.085)) + 'px sans-serif';
  ctx.font = nameFont;
  const nameH = Math.max(13, Math.floor(r.w * 0.12));
  const filigreeClearance = 24; // small-card clearance
  const maxNameWidth = r.w - filigreeClearance;
  const nameLines = wrapCardName(power.name, maxNameWidth, ctx);
  const twoLineBump = nameLines.length > 1 ? 6 : 0;
  const nameY = r.y + 13 + twoLineBump;
  const lineH = Math.floor(nameH * 0.85);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.95)';
  ctx.shadowBlur = 3;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = Colors.GOLD;
  for (let li = 0; li < nameLines.length; li++) {
    const lineCy = nameY + nameH / 2 + 1 + (li - (nameLines.length - 1) / 2) * lineH;
    ctx.fillText(nameLines[li], r.x + r.w / 2, lineCy);
  }
  ctx.restore();
  ctx.textBaseline = 'alphabetic';

  // Short desc box at bottom (with inline keyword icons). Lifted 6 px off
  // the bottom edge so it doesn't sit right against the frame's filigree.
  if (power.shortDesc) {
    const descLines = power.shortDesc.split('\n');
    const fontSize = 10;
    const iconSize = Math.floor(fontSize * 1.3);
    const lineH = Math.max(fontSize + 2, iconSize + 1);
    const descBoxH = descLines.length * lineH + 6;
    const descBoxY = r.y + r.h - descBoxH - 8;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(r.x + 2, descBoxY, r.w - 4, descBoxH);
    let dy = descBoxY + 3;
    for (const line of descLines) {
      drawIconText(line, r.x + r.w / 2, dy, r.w - 6, fontSize, '#eee');
      dy += lineH;
    }
  }

  // Ornate 9-slice frame with a purple tint (powers = ability school).
  const frameImg = images.frame_common;
  if (frameImg) {
    const corner = CARD_FRAME_CORNERS.frame_common || 24;
    const scaledCorner = Math.max(6, Math.min(corner, Math.floor(Math.min(r.w, r.h) * 0.10)));
    const tinted = getTintedFrameImage(frameImg, 'frame_common', '#8c3c8c');
    draw9SliceFrame(tinted, r.x, r.y, r.w, r.h, scaledCorner);
  } else {
    // Fallback: the old plain purple border
    ctx.strokeStyle = '#8c3c8c';
    ctx.lineWidth = 2;
    ctx.strokeRect(r.x, r.y, r.w, r.h);
  }

  // Gold outer glow when this power is currently selected.
  if (clickable && selectedPower === power) {
    ctx.save();
    ctx.strokeStyle = Colors.GOLD;
    ctx.lineWidth = 2;
    ctx.shadowColor = Colors.GOLD;
    ctx.shadowBlur = 12;
    ctx.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
    ctx.restore();
  }

  // Exhausted: Zzz overlay
  if (power.exhausted) {
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = Colors.ORANGE;
    ctx.font = 'bold 18px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Zzz', r.x + r.w / 2, r.y + r.h / 2);
    ctx.textBaseline = 'alphabetic';
  }

  ctx.textAlign = 'left';
}

function drawPowerArea() {
  for (let i = 0; i < player.powers.length; i++) {
    const power = player.powers[i];
    const r = getCharacterPowerRect(true, i);
    drawPowerCard(power, r, true);
  }
}

function drawEnemyPowerArea() {
  if (!enemy || !enemy.powers || enemy.powers.length === 0) return;
  for (let i = 0; i < enemy.powers.length; i++) {
    const power = enemy.powers[i];
    const r = getCharacterPowerRect(false, i);
    drawPowerCard(power, r, false);
  }
}

// --- Combat click handling ---
function handleCombatClick(x, y) {
  // Click dismisses combat intro splash
  if (combatIntroTimer > 0) {
    combatIntroTimer = 0;
    return;
  }

  // Click dismisses character card splash
  if (characterSplashCharacter) {
    characterSplashCharacter = null;
    return;
  }

  // Debug: click "Deck: N" text to draw 1 card
  if (debugMode && state === GameState.COMBAT && isPlayerTurn) {
    for (const area of logCardHitAreas) {
      if (area.debugDraw && hitTest(x, y, area)) {
        if (player.deck.drawPile.length > 0) {
          const card = player.deck.drawPile.pop();
          player.deck.hand.push(card);
          addLog(`[DBG] Drew: ${card.name}`, Colors.GREEN, card);
        } else {
          showToast('Draw pile empty.');
        }
        return;
      }
    }
  }

  // Click on player or enemy character card → show splash (only if not in targeting/recharge mode)
  if (!powerRechargeMode && state === GameState.COMBAT) {
    const playerCardRect = getCharacterCardRect(true);
    if (hitTest(x, y, playerCardRect)) {
      characterSplashCharacter = player;
      characterSplashIsPlayer = true;
      return;
    }
    const enemyCardRect = getCharacterCardRect(false);
    if (hitTest(x, y, enemyCardRect)) {
      characterSplashCharacter = enemy;
      characterSplashIsPlayer = false;
      return;
    }
  }

  if (!isPlayerTurn) return;

  // Power recharge mode: clicking hand cards to recharge
  if (powerRechargeMode) {
    handlePowerRechargeClick(x, y);
    return;
  }

  // Card recharge mode: clicking hand cards to pay recharge_extra cost
  if (cardRechargeMode) {
    handleCardRechargeClick(x, y);
    return;
  }

  // Check power card click
  for (let i = 0; i < player.powers.length; i++) {
    const power = player.powers[i];
    const r = getCharacterPowerRect(true, i);
    if (hitTest(x, y, r)) {
      handlePowerClick(power);
      return;
    }
  }

  // Check player ally click → enter ally targeting if ready
  const allyRects = getPlayerCreatureRects();
  for (let i = 0; i < player.creatures.length; i++) {
    if (!allyRects[i]) continue;
    if (hitTest(x, y, allyRects[i])) {
      const ally = player.creatures[i];
      if (!ally.isAlive) return;
      if (ally.exhausted) {
        if (ally.justSummoned) {
          showToast(`${ally.name} can't attack the turn it's summoned.`);
        } else {
          showToast(`${ally.name} already attacked this turn.`);
        }
        return;
      }
      selectedAlly = ally;
      state = GameState.ALLY_TARGETING;
      showStickyToast(`${ally.name}: Click an enemy target (or click elsewhere to cancel)`);
      return;
    }
  }

  // Check right-column combat buttons (end turn, inventory, help)
  for (const btn of menuButtons) {
    if (hitTest(x, y, btn) && btn.action) {
      btn.action();
      return;
    }
  }

  // Check hand cards (use visible-portion hit areas, iterate topmost first
  // because later cards in the array are drawn over earlier ones when stacked)
  const handRects = getHandCardRects(player.deck.hand);
  for (let i = handRects.length - 1; i >= 0; i--) {
    const r = getHandCardHoverRect(handRects, i);
    if (hitTest(x, y, r)) {
      const card = player.deck.hand[i];
      // Exhausted (stays-in-hand) cards already used this turn
      if (card.exhausted) {
        showToast(`${card.name} already used this turn.`);
        return;
      }
      // Defense cards can't be played proactively
      if (card.cardType === CardType.DEFENSE) {
        showToast('Defense cards are played when the enemy attacks.');
        return;
      }
      if (selectedCardIndex !== i) {
        selectedCardIndex = i;
        if (card.isModal) {
          modalCard = card;
          modalTarget = null;
          state = GameState.MODAL_SELECT;
          return;
        }
        // Check for recharge_extra cost
        const rechargeNeeded = getCardRechargeExtra(card);
        if (rechargeNeeded > 0) {
          // Need other cards in hand to pay the cost
          const otherCards = player.deck.hand.filter((c, j) => j !== i).length;
          if (otherCards < rechargeNeeded) {
            showToast(`Not enough cards in hand to pay Recharge +${rechargeNeeded} cost.`);
            selectedCardIndex = -1;
            return;
          }
          cardRechargeMode = true;
          cardRechargeNeeded = rechargeNeeded;
          cardRechargedCards = [];
          pendingRechargeNames = [];
          _handOrderSnapshot = [...player.deck.hand];
          showStyledToast(`Recharge: Click another card to recharge as cost (${rechargeNeeded} more, ESC to cancel)`, 'recharge');
          return;
        }
        // Check for barrage (Magic Missiles optional extra recharge)
        const hasBarrage = (card.effects || []).some(e => e.effectType === 'barrage');
        if (hasBarrage && needsTarget(card)) {
          selectedCardIndex = i;
          barrageMode = true;
          barrageShotsLeft = 0;
          barrageShotsFired = 0;
          barrageCardIndex = i;
          barrageRechargedCard = null;
          _handOrderSnapshot = [...player.deck.hand];
          state = GameState.TARGETING;
          showStyledToast('Recharge 1 card for 3 shots, or click enemy for 1 shot', 'recharge');
          return;
        }
        // No extra recharge cost: proceed normally.
        // Feral Swipe check MUST come before canPlayWithoutTarget — its first
        // effect is gain_shield (SELF-targeted), which would otherwise trick
        // the self-play path into firing without letting the player pick
        // multi-targets.
        if (cardIsFeralSwipe(card)) {
          enterFeralSwipeTargeting(i);
        } else if (canPlayWithoutTarget(card)) {
          playCardSelf(i);
        } else if (cardIsMultiTarget(card)) {
          enterMultiTargeting(i);
        } else if (needsTarget(card)) {
          // Snapshot the hand order so Cancel (click elsewhere / ESC)
          // always returns the card to the exact spot it came from —
          // mirrors the recharge-extra/barrage flows. Needed for single-
          // target attacks like Sneak Attack so their slot is preserved.
          _handOrderSnapshot = [...player.deck.hand];
          state = GameState.TARGETING;
          showStickyToast('Click on an enemy to attack (or click elsewhere to cancel)');
        }
      } else {
        // Clicked the same card again
        if (canPlayWithoutTarget(card)) {
          playCardSelf(i);
        } else {
          selectedCardIndex = -1;
        }
      }
      return;
    }
  }

  // Clicked elsewhere — deselect
  selectedCardIndex = -1;
}

// Handle clicks during card recharge mode (paying extra recharge cost)
// When a card is moved to the recharge pile as a recharge cost, fire any
// on_recharge_shield effects it carries (Dwarven Greaves grants 1 Shield this
// way). The granted amount is recorded on the card itself so it can be undone
// if the player cancels the attack/power before it resolves.
function applyOnRechargeShield(card) {
  if (!card || !Array.isArray(card.currentEffects)) return;
  let granted = 0;
  for (const eff of card.currentEffects) {
    if (eff.effectType === 'on_recharge_shield') granted += eff.value;
  }
  if (granted > 0) {
    player.shield += granted;
    card._onRechargeShieldGranted = granted;
    addLog(`  ${card.name}: +${granted} Shield (S:${player.shield})`, Colors.ALLY_BLUE);
    spawnTokenOnTarget(player, granted, 'Shield', Colors.ALLY_BLUE);
  }
}
function refundOnRechargeShield(card) {
  if (!card || !card._onRechargeShieldGranted) return;
  const amt = card._onRechargeShieldGranted;
  player.shield = Math.max(0, player.shield - amt);
  delete card._onRechargeShieldGranted;
  addLog(`  ${card.name}: refund ${amt} Shield (S:${player.shield})`, Colors.GRAY);
}

function handleCardRechargeClick(x, y) {
  // Click another hand card to pay it as recharge cost (topmost first)
  const handRects = getHandCardRects(player.deck.hand);
  for (let i = handRects.length - 1; i >= 0; i--) {
    if (i === selectedCardIndex) continue;
    if (hitTest(x, y, getHandCardHoverRect(handRects, i))) {
      const card = player.deck.hand[i];
      // Remember exhausted state so cancelling restores it (addToRechargePile resets it)
      card._preRechargeExhausted = !!card.exhausted;
      // Move to recharge pile (held until end of turn, then flushed under the deck)
      player.deck.hand.splice(i, 1);
      player.deck.addToRechargePile(card);
      applyOnRechargeShield(card); // Dwarven Greaves etc.
      cardRechargedCards.push(card);
      pendingRechargeNames.push(card.name);

      // Adjust selectedCardIndex if needed (we removed a card)
      if (i < selectedCardIndex) selectedCardIndex--;

      cardRechargeNeeded--;
      if (cardRechargeNeeded <= 0) {
        // Done paying cost — proceed to targeting (or self-play)
        cardRechargeMode = false;
        const selectedCard = player.deck.hand[selectedCardIndex];
        if (canPlayWithoutTarget(selectedCard)) {
          hideToast();
          playCardSelf(selectedCardIndex);
          for (const n of pendingRechargeNames) addLog(`  Recharge: ${n}`);
          pendingRechargeNames = [];
          cardRechargedCards = [];
        } else if (cardIsMultiTarget(selectedCard)) {
          hideToast();
          enterMultiTargeting(selectedCardIndex);
        } else {
          state = GameState.TARGETING;
          showStickyToast('Click on an enemy to attack (or click elsewhere to cancel)');
        }
      } else {
        showStyledToast(`Recharge: Click another card to recharge as cost (${cardRechargeNeeded} more, ESC to cancel)`, 'recharge');
      }
      return;
    }
  }
  // Clicked elsewhere — cancel and refund recharged cards
  cancelCardRecharge();
}

// === DEFENDING phase: prompt player to play defense cards reactively ===
function handleDefendingClick(x, y) {
  // Click defense cards in hand to play them (topmost first)
  const handRects = getHandCardRects(player.deck.hand);
  for (let i = handRects.length - 1; i >= 0; i--) {
    if (!hitTest(x, y, getHandCardHoverRect(handRects, i))) continue;
    const card = player.deck.hand[i];
    // Modal cards (e.g. Sturdy Boots) with a block-mode can also be played for defense.
    const blockMode = (card.isModal && Array.isArray(card.modes))
      ? card.modes.find(m => (m.effects || []).some(e => e.effectType === 'block'))
      : null;
    if (card.cardType !== CardType.DEFENSE && !blockMode) {
      showToast('Only defense cards can be played here.');
      return;
    }
    // Play the defense card (or the block-mode of a modal card)
    player.deck.playCard(card);
    addLog(`You play ${card.name}`, Colors.GREEN, card);
    // Recharge-cost defense cards self-recharge when played, so any
    // on_recharge_shield effects fire here too (Dwarven Greaves).
    if (card.costType === CostType.RECHARGE) {
      applyOnRechargeShield(card);
    }
    const effectsToApply = blockMode ? blockMode.effects : card.currentEffects;
    if (blockMode) addLog(`  Mode: ${blockMode.description}`, Colors.WHITE);
    for (const eff of effectsToApply) {
      if (eff.effectType === 'block') {
        player.addBlock(eff.value);
        addLog(`  +${eff.value} Block`, Colors.BLUE);
        spawnTokenOnTarget(player, eff.value, 'Block', BLOCK_BLUE);
      } else if (eff.effectType === 'gain_shield') {
        player.shield += eff.value;
        addLog(`  +${eff.value} Shield (S:${player.shield})`, Colors.ALLY_BLUE);
        spawnTokenOnTarget(player, eff.value, 'Shield', Colors.ALLY_BLUE);
      } else if (eff.effectType === 'draw') {
        const drawn = player.deck.draw(eff.value, MAX_HAND_SIZE);
        for (const d of drawn) addLog(`  Draw: ${d.name}`, Colors.BLUE, d);
      } else if (eff.effectType === 'clear_ice') {
        // Defense effect (e.g. White Wolf Cloak): remove up to N stacks of Ice
        // when this card blocks.
        const ice = player.getStatus('ICE') || 0;
        if (ice > 0) {
          const cleared = Math.min(ice, eff.value);
          player.removeStatus('ICE', cleared);
          addLog(`  Cleared ${cleared} Ice`, Colors.ICE_BLUE);
        }
      }
    }
    // Re-apply auto-mitigation against the pending damage
    pendingIncomingDamage = autoMitigateDamage(pendingIncomingDamage);
    if (pendingIncomingDamage <= 0) {
      addLog(`  All damage absorbed!`);
      finishIncomingDamage();
    } else {
      // Update toast with new remaining
      showStyledToast(`Incoming ${pendingIncomingDamage} damage. Play defense cards or pass.`, 'damage');
    }
    return;
  }
  // Click a "Pass" / "Take damage" button to skip
  const passBtn = getDefendingPassBtnRect();
  if (hitTest(x, y, passBtn)) {
    enterTakeDamagePhase();
  }
}

function drawDefendingOverlay() {
  // Highlight playable defense cards with a pulsing blue glow. Clipped to the
  // card's visible portion (horizontally) so overlapping cards don't bleed
  // into each other, but padded vertically so the outer glow can extend past
  // the card edges and read as "flashing" rather than a thin outline.
  const pulse = (Math.sin(performance.now() / 150) + 1) / 2;
  const glowAlpha = 0.7 + 0.3 * pulse;
  const handRects = getHandCardRects(player.deck.hand);
  for (let i = 0; i < handRects.length; i++) {
    const card = player.deck.hand[i];
    const hasBlockMode = card.isModal && Array.isArray(card.modes) &&
      card.modes.some(m => (m.effects || []).some(e => e.effectType === 'block'));
    if (card.cardType !== CardType.DEFENSE && !hasBlockMode) continue;
    const hr = handRects[i];
    const visR = getHandCardHoverRect(handRects, i);
    // Let the glow extend off the outer edges of the hand (no neighbor to hide
    // behind), but keep the narrow clip for middle cards so their frames don't
    // bleed over the neighbor stacked on top.
    const padLeft = (i === 0) ? 20 : 0;
    const padRight = (i === handRects.length - 1) ? 20 : 0;
    ctx.save();
    ctx.beginPath();
    ctx.rect(visR.x - padLeft, visR.y - 16, visR.w + padLeft + padRight, visR.h + 32);
    ctx.clip();
    // Outer soft glow — wide, slightly desaturated
    ctx.shadowColor = `rgba(80, 160, 255, ${glowAlpha})`;
    ctx.shadowBlur = 32;
    ctx.strokeStyle = `rgba(80, 160, 255, ${glowAlpha * 0.9})`;
    ctx.lineWidth = 7;
    ctx.strokeRect(hr.x - 3, hr.y - 3, hr.w + 6, hr.h + 6);
    // Bright inner line: near-white blue, no shadow so it pops sharply
    ctx.shadowBlur = 0;
    ctx.strokeStyle = `rgba(200, 230, 255, ${Math.min(1, glowAlpha + 0.15)})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(hr.x, hr.y, hr.w, hr.h);
    ctx.restore();
  }

  // Pass button
  const r = getDefendingPassBtnRect();
  const hov = hitTest(mouseX, mouseY, r);
  ctx.fillStyle = hov ? '#a44' : '#722';
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = Colors.GOLD;
  ctx.lineWidth = 2;
  ctx.strokeRect(r.x, r.y, r.w, r.h);
  ctx.fillStyle = Colors.WHITE;
  ctx.font = 'bold 16px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Pass (take damage)', r.x + r.w / 2, r.y + r.h / 2);
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
}

function getDefendingPassBtnRect() {
  // Centered within the left card area (excluding the right log column)
  return { x: COMBAT_LEFT_W / 2 - 110, y: COMBAT_DIVIDER_Y + 35, w: 220, h: 44 };
}

function cancelCardRecharge() {
  // Refund any recharged cards back to hand (they were placed in the recharge pile)
  for (const c of cardRechargedCards) {
    refundOnRechargeShield(c); // undo Dwarven Greaves shield etc.
    const idx = player.deck.rechargePile.indexOf(c);
    if (idx !== -1) player.deck.rechargePile.splice(idx, 1);
    // Restore pre-recharge exhausted state (addToRechargePile had reset it)
    c.exhausted = !!c._preRechargeExhausted;
    delete c._preRechargeExhausted;
  }
  // Restore the original hand order so the user doesn't see cards jump around.
  if (_handOrderSnapshot) {
    player.deck.hand = _handOrderSnapshot;
    _handOrderSnapshot = null;
  }
  cardRechargedCards = [];
  pendingRechargeNames = [];
  cardRechargeMode = false;
  cardRechargeNeeded = 0;
  selectedCardIndex = -1;
  hideToast();
  addLog('Cancelled.', Colors.GRAY);
}

function handleTargetingClick(x, y) {
  // Barrage shooting phase: each click on enemy resolves 1 shot
  if (barrageMode && barrageShotsLeft > 0) {
    // Check for Done button
    const doneR = { x: COMBAT_LEFT_W / 2 - 80, y: COMBAT_DIVIDER_Y + 35, w: 160, h: 40 };
    if (hitTest(x, y, doneR)) {
      finishBarrage();
      return;
    }
    const target = getClickedEnemyTarget(x, y);
    if (target) {
      resolveBarrageShot(target);
      return;
    }
    return; // ignore other clicks during barrage
  }

  // Barrage pre-pay phase: click hand card to pay, or click enemy for single shot
  if (barrageMode && barrageShotsLeft === 0) {
    const handRects = getHandCardRects(player.deck.hand);
    for (let i = handRects.length - 1; i >= 0; i--) {
      if (i === barrageCardIndex) continue; // can't recharge MM itself
      if (!hitTest(x, y, getHandCardHoverRect(handRects, i))) continue;
      // Pay: recharge the clicked card (MM stays in hand)
      const payCard = player.deck.hand[i];
      player.deck.hand.splice(i, 1);
      player.deck.addToRechargePile(payCard);
      if (i < barrageCardIndex) barrageCardIndex--;
      selectedCardIndex = barrageCardIndex;
      barrageRechargedCard = payCard;
      addLog(`  Recharge: ${payCard.name}`);
      barrageShotsLeft = 3;
      barrageShotsFired = 0;
      showStyledToast(`Magic Missiles: 3 shots left — click a target (or Done)`, 'multi');
      return;
    }
    // Clicked an enemy: single shot, fall through to normal targeting below
  }

  // Normal targeting: click enemy character
  const enemyCardRect = getCharacterCardRect(false);
  if (hitTest(x, y, enemyCardRect)) {
    const names = pendingRechargeNames.slice();
    cardRechargedCards = [];
    pendingRechargeNames = [];
    // Snapshot is only for cancel; successful play consumes it.
    _handOrderSnapshot = null;
    hideToast();
    barrageMode = false;
    playCardOnEnemy(selectedCardIndex);
    for (const n of names) addLog(`  Recharge: ${n}`);
    return;
  }

  // Normal targeting: click enemy creature
  const creatureRects = getEnemyCreatureRects();
  for (let i = 0; i < creatureRects.length; i++) {
    if (hitTest(x, y, creatureRects[i])) {
      const names = pendingRechargeNames.slice();
      cardRechargedCards = [];
      pendingRechargeNames = [];
      _handOrderSnapshot = null;
      hideToast();
      barrageMode = false;
      playCardOnCreature(selectedCardIndex, enemy.creatures[i]);
      for (const n of names) addLog(`  Recharge: ${n}`);
      return;
    }
  }

  // Click elsewhere → cancel
  if (cardRechargedCards.length > 0) {
    cancelCardRecharge();
  }
  cancelBarrage();
  // Restore hand order (snapshot taken when targeting started) so the
  // selected card returns to the exact slot it was in — even for plain
  // single-target attacks like Sneak Attack.
  if (_handOrderSnapshot) {
    player.deck.hand = _handOrderSnapshot;
    _handOrderSnapshot = null;
  }
  hideToast();
  selectedCardIndex = -1;
  state = GameState.COMBAT;
}

// Helper: find which enemy target was clicked (character or creature)
function getClickedEnemyTarget(x, y) {
  const enemyCardRect = getCharacterCardRect(false);
  if (hitTest(x, y, enemyCardRect)) return enemy;
  const creatureRects = getEnemyCreatureRects();
  for (let i = 0; i < creatureRects.length; i++) {
    if (hitTest(x, y, creatureRects[i])) return enemy.creatures[i];
  }
  return null;
}

// Resolve one barrage shot on a target
function resolveBarrageShot(target) {
  barrageShotsLeft--;
  barrageShotsFired++;
  attacksThisTurn++;
  const dmg = 1 + player.heroism + getDamageModifier(player);
  if (player.heroism > 0) {
    addLog(`  (Heroism +${player.heroism})`, Colors.GOLD);
    player.heroism = 0;
  }
  addLog(`  Shot ${barrageShotsFired}:`, Colors.GRAY);
  if (target === enemy) {
    enemyAutoPlayDefenses(dmg);
    const [blocked, taken] = enemy.takeDamageWithDefense(dmg);
    if (taken > 0) { spawnDamageOnTarget(enemy, taken); triggerSplitPower(enemy); }
    const bs = blocked > 0 ? ` (blocked ${blocked})` : '';
    addLog(`  ${enemy.name}: ${taken} dmg${bs}`, Colors.RED);
  } else if (target.isAlive) {
    const actual = target.takeDamage(dmg);
    if (actual > 0) spawnDamageOnTarget(target, actual);
    addLog(`  ${target.name}: ${actual} dmg`, Colors.RED);
    if (!target.isAlive) { spawnDeathAnimation(target); addLog(`  ${target.name} destroyed!`, Colors.GOLD); }
  }
  countAndRemoveDeadCreatures();

  if (barrageShotsLeft <= 0 || checkCombatEnd()) {
    finishBarrage();
  } else {
    showStyledToast(`Magic Missiles: ${barrageShotsLeft} shot${barrageShotsLeft > 1 ? 's' : ''} left — click target or Done`, 'multi');
  }
}

// Finish barrage: draw 1, pay card cost, clean up
function finishBarrage() {
  // Play MM from hand: lift, draw 1, pay cost (recharge)
  if (barrageCardIndex >= 0 && barrageCardIndex < player.deck.hand.length) {
    const card = player.deck.hand[barrageCardIndex];
    if (barrageShotsFired === 0) addLog(`You play ${card.name}`, Colors.GREEN, card);
    player.deck.hand.splice(barrageCardIndex, 1);
    const drawn = player.deck.draw(1, MAX_HAND_SIZE);
    for (const d of drawn) addLog(`  Draw: ${d.name}`, Colors.BLUE, d);
    player.deck.placeByCost(card);
  }
  barrageRechargedCard = null;
  barrageMode = false;
  barrageShotsLeft = 0;
  barrageShotsFired = 0;
  barrageCardIndex = -1;
  selectedCardIndex = -1;
  state = GameState.COMBAT;
  hideToast();
  checkCombatEnd();
}

// Cancel barrage: only if no shots fired yet, refund the recharged card
function cancelBarrage() {
  if (barrageShotsFired > 0) {
    // Can't cancel mid-barrage — finish instead
    finishBarrage();
    return;
  }
  if (barrageRechargedCard) {
    const idx = player.deck.rechargePile.indexOf(barrageRechargedCard);
    if (idx !== -1) player.deck.rechargePile.splice(idx, 1);
    addLog('  Barrage cancelled, card refunded.', Colors.GRAY);
  }
  // Restore the original hand order.
  if (_handOrderSnapshot) {
    player.deck.hand = _handOrderSnapshot;
    _handOrderSnapshot = null;
  }
  barrageRechargedCard = null;
  barrageMode = false;
  barrageShotsLeft = 0;
  barrageShotsFired = 0;
  barrageCardIndex = -1;
}

let attacksThisTurn = 0; // for sneak_attack scaling
let _activePlayCard = null; // the card currently being resolved (set during playCardSelf/etc.)

// Returns the recharge_extra cost for a card (number of cards to recharge as cost beyond base)
function getCardRechargeExtra(card) {
  for (const eff of card.currentEffects || []) {
    if (eff.effectType === 'recharge_extra') return eff.value;
  }
  return 0;
}

function canPlayWithoutTarget(card) {
  // Defense cards can ONLY be played reactively when defending against enemy attacks
  if (card.cardType === CardType.DEFENSE) return false;
  if (card.cardType === CardType.CREATURE) return true; // summons are self-targeting
  if (card.effects.length > 0 && card.effects[0].target === TargetType.SELF) return true;
  if (card.effects.some(e => e.target === TargetType.ALL_ENEMIES)) return true;
  if (card.effects.some(e => e.target === TargetType.SUMMON)) return true;
  return false;
}

function needsTarget(card) {
  return card.effects.some(e =>
    e.target === TargetType.SINGLE_ENEMY &&
    (e.effectType === 'damage' || e.effectType === 'apply_poison' ||
     e.effectType === 'armor_bonus_damage' || e.effectType === 'unpreventable_damage' ||
     e.effectType === 'sneak_attack' || e.effectType === 'multi_damage' ||
     e.effectType === 'shield_bash' || e.effectType === 'charge_attack' ||
     e.effectType === 'split_damage')
  );
}

// Reactively play any defense cards still in the enemy's hand (during player turn).
// Called just before player damage lands on the enemy character.
function enemyAutoPlayDefenses(incomingDmg = null) {
  if (!enemy || !enemy.deck) return;
  // Calculate how much damage would actually land after existing defenses.
  // If incomingDmg is provided, only play defenses when damage would actually hit.
  let landingDmg = incomingDmg;
  if (landingDmg !== null) {
    // Simulate: shield → armor → block
    let remaining = landingDmg;
    remaining = Math.max(0, remaining - (enemy.shield || 0));
    remaining = Math.max(0, remaining - (enemy.armor || 0));
    remaining = Math.max(0, remaining - (enemy.currentBlock || 0));
    landingDmg = remaining;
    if (landingDmg <= 0) return; // fully absorbed, no need to defend
  }

  const defenseCards = enemy.deck.hand.filter(c => c.cardType === CardType.DEFENSE);
  for (const card of defenseCards) {
    enemy.deck.playCard(card);
    addLog(`${enemy.name} plays ${card.name}`, Colors.RED, card);
    for (const eff of card.currentEffects) {
      if (eff.effectType === 'block') {
        enemy.addBlock(eff.value);
        addLog(`  +${eff.value} Block`, Colors.BLUE);
        spawnTokenOnTarget(enemy, eff.value, 'Block', BLOCK_BLUE);
        if (landingDmg !== null) landingDmg = Math.max(0, landingDmg - eff.value);
      } else if (eff.effectType === 'gain_shield') {
        enemy.shield += eff.value;
        addLog(`  +${eff.value} Shield (S:${enemy.shield})`, Colors.ALLY_BLUE);
        spawnTokenOnTarget(enemy, eff.value, 'Shield', Colors.ALLY_BLUE);
        if (landingDmg !== null) landingDmg = Math.max(0, landingDmg - eff.value);
      }
    }
    // Loose Bone: spawn a Restless Bone when it blocks
    if (card.id === 'loose_bone') {
      const bone = new Creature({ name: 'Restless Bone', attack: 1, maxHp: 2 });
      enemy.addCreature(bone);
      addLog(`  Restless Bone rises!`, Colors.ORANGE);
      const lastEntry = combatLog[combatLog.length - 1];
      if (lastEntry) lastEntry.creature = bone;
    }
    // Stop playing defense cards once incoming damage is fully absorbed
    if (landingDmg !== null && landingDmg <= 0) break;
  }
}

// --- Resolve a single effect on a target ---
function resolveEffect(eff, caster, target) {
  switch (eff.effectType) {
    case 'damage': {
      const heroism = caster.heroism;
      if (heroism > 0) { addLog(`  (Heroism +${heroism})`, Colors.GOLD); caster.heroism = 0; }
      let dmg = Math.max(0, eff.value + heroism + caster.rage + getDamageModifier(caster));
      const incomingMod = getIncomingDamageModifier(target instanceof Creature ? enemy : target);
      dmg += incomingMod;
      dmg = Math.max(0, dmg);
      const unpreventable = consumeUnpreventableBuff(caster);
      // Enemy reactively plays defense cards before damage lands on enemy character —
      // skipped when the Slime Jar buff makes this attack unpreventable.
      if (!unpreventable && !(target instanceof Creature) && target === enemy) {
        enemyAutoPlayDefenses(dmg);
      }
      if (target instanceof Creature) {
        if (unpreventable) {
          target.takeUnpreventableDamage(dmg);
          if (dmg > 0) spawnDamageOnTarget(target, dmg, Colors.ORANGE);
          addLog(`  ${target.name}: ${dmg} true dmg`, Colors.ORANGE);
          consumePoisonBuff(caster, target, dmg);
        } else {
          const actual = target.takeDamage(dmg);
          if (actual > 0) spawnDamageOnTarget(target, actual);
          const blocked = Math.max(0, dmg - actual);
          const blockedSuffix = blocked > 0 ? ` (blocked ${blocked})` : '';
          addLog(`  ${target.name}: ${actual} dmg${blockedSuffix}`, Colors.RED);
          consumePoisonBuff(caster, target, actual);
        }
        if (!target.isAlive) { spawnDeathAnimation(target); addLog(`  ${target.name} destroyed!`, Colors.GOLD); countAndRemoveDeadCreatures(); }
      } else {
        if (unpreventable) {
          target.takeDamageFromDeck(dmg);
          if (dmg > 0) { spawnDamageOnTarget(target, dmg, Colors.ORANGE); triggerSplitPower(target); }
          addLog(`  ${target.name}: ${dmg} true dmg`, Colors.ORANGE);
          consumePoisonBuff(caster, target, dmg);
        } else {
          const [blocked, taken] = target.takeDamageWithDefense(dmg);
          if (taken > 0) { spawnDamageOnTarget(target, taken); triggerSplitPower(target); }
          const blockedSuffix = blocked > 0 ? ` (blocked ${blocked})` : '';
          addLog(`  ${target.name}: ${taken} dmg${blockedSuffix}`, Colors.RED);
          consumePoisonBuff(caster, target, taken);
        }
      }
      attacksThisTurn++;
      break;
    }
    case 'charge_attack': {
      // Warrior Charge: Deal N damage. Draw 1 if this was the first attack this turn.
      const wasFirstAttack = (attacksThisTurn === 0);
      const heroism = caster.heroism;
      if (heroism > 0) { addLog(`  (Heroism +${heroism})`, Colors.GOLD); caster.heroism = 0; }
      let dmg = Math.max(0, eff.value + heroism + caster.rage + getDamageModifier(caster));
      const incomingMod = getIncomingDamageModifier(target instanceof Creature ? enemy : target);
      dmg = Math.max(0, dmg + incomingMod);
      const unpreventable = consumeUnpreventableBuff(caster);
      if (!unpreventable && !(target instanceof Creature) && target === enemy) {
        enemyAutoPlayDefenses(dmg);
      }
      if (target instanceof Creature) {
        if (unpreventable) {
          target.takeUnpreventableDamage(dmg);
          if (dmg > 0) spawnDamageOnTarget(target, dmg, Colors.ORANGE);
          addLog(`  ${target.name}: ${dmg} true dmg`, Colors.ORANGE);
          consumePoisonBuff(caster, target, dmg);
        } else {
          const actual = target.takeDamage(dmg);
          if (actual > 0) spawnDamageOnTarget(target, actual);
          const blocked = Math.max(0, dmg - actual);
          const blockedSuffix = blocked > 0 ? ` (blocked ${blocked})` : '';
          addLog(`  ${target.name}: ${actual} dmg${blockedSuffix}`, Colors.RED);
          consumePoisonBuff(caster, target, actual);
        }
        if (!target.isAlive) { spawnDeathAnimation(target); addLog(`  ${target.name} destroyed!`, Colors.GOLD); countAndRemoveDeadCreatures(); }
      } else {
        if (unpreventable) {
          target.takeDamageFromDeck(dmg);
          if (dmg > 0) { spawnDamageOnTarget(target, dmg, Colors.ORANGE); triggerSplitPower(target); }
          addLog(`  ${target.name}: ${dmg} true dmg`, Colors.ORANGE);
          consumePoisonBuff(caster, target, dmg);
        } else {
          const [blocked, taken] = target.takeDamageWithDefense(dmg);
          if (taken > 0) { spawnDamageOnTarget(target, taken); triggerSplitPower(target); }
          const blockedSuffix = blocked > 0 ? ` (blocked ${blocked})` : '';
          addLog(`  ${target.name}: ${taken} dmg${blockedSuffix}`, Colors.RED);
          consumePoisonBuff(caster, target, taken);
        }
      }
      attacksThisTurn++;
      // Conditional card-advantage kicker: draw 1 if this opened the turn.
      if (wasFirstAttack) {
        const drawn = caster.deck.draw(1, MAX_HAND_SIZE);
        for (const d of drawn) addLog(`  Charge! Draw: ${d.name}`, Colors.GREEN, d);
        if (drawn.length === 0) addLog(`  Charge! (no cards to draw)`, Colors.GRAY);
      } else {
        addLog(`  (not first attack — no draw)`, Colors.GRAY);
      }
      break;
    }
    case 'unpreventable_damage': {
      const dmg = eff.value;
      if (target instanceof Creature) {
        target.takeUnpreventableDamage(dmg);
        spawnDamageOnTarget(target, dmg, Colors.ORANGE);
        addLog(`  ${dmg} true dmg to ${target.name}`, Colors.ORANGE);
        consumePoisonBuff(caster, target, dmg);
        if (!target.isAlive) { spawnDeathAnimation(target); addLog(`  ${target.name} destroyed!`, Colors.GOLD); countAndRemoveDeadCreatures(); }
      } else {
        target.takeDamageFromDeck(dmg);
        spawnDamageOnTarget(target, dmg, Colors.ORANGE);
        addLog(`  ${dmg} true dmg to ${target.name}`, Colors.ORANGE);
        consumePoisonBuff(caster, target, dmg);
      }
      attacksThisTurn++;
      break;
    }
    case 'armor_bonus_damage': {
      // value encodes base+bonus: e.g. 46 = 4 base, 6 vs armor
      const base = Math.floor(eff.value / 10);
      const bonus = eff.value % 10;
      const heroism = caster.heroism;
      if (heroism > 0) { addLog(`  (Heroism +${heroism})`, Colors.GOLD); caster.heroism = 0; }
      const hasArmor = target.armor > 0 || target.shield > 0;
      let dmg = base + heroism;
      if (hasArmor) {
        dmg = bonus + heroism;
        addLog(`  Armor bonus: ${bonus} dmg (target has armor/shield)`, Colors.GOLD);
      } else {
        addLog(`  Base: ${base} dmg`, Colors.GRAY);
      }
      const unpreventable = consumeUnpreventableBuff(caster);
      if (target instanceof Creature) {
        if (unpreventable) {
          target.takeUnpreventableDamage(dmg);
          if (dmg > 0) spawnDamageOnTarget(target, dmg, Colors.ORANGE);
          addLog(`  ${target.name}: ${dmg} true dmg`, Colors.ORANGE);
          consumePoisonBuff(caster, target, dmg);
        } else {
          const actual = target.takeDamage(dmg);
          if (actual > 0) spawnDamageOnTarget(target, actual);
          const absorbed = dmg - actual;
          const bs = absorbed > 0 ? ` (${absorbed} absorbed)` : '';
          addLog(`  ${target.name}: ${actual} dmg${bs}`, Colors.RED);
          consumePoisonBuff(caster, target, actual);
        }
        if (!target.isAlive) { spawnDeathAnimation(target); addLog(`  ${target.name} destroyed!`, Colors.GOLD); countAndRemoveDeadCreatures(); }
      } else {
        if (unpreventable) {
          target.takeDamageFromDeck(dmg);
          if (dmg > 0) { spawnDamageOnTarget(target, dmg, Colors.ORANGE); triggerSplitPower(target); }
          addLog(`  ${target.name}: ${dmg} true dmg`, Colors.ORANGE);
          consumePoisonBuff(caster, target, dmg);
        } else {
          if (target === enemy) enemyAutoPlayDefenses(dmg);
          const [blocked, taken] = target.takeDamageWithDefense(dmg);
          if (taken > 0) { spawnDamageOnTarget(target, taken); triggerSplitPower(target); }
          const bs = blocked > 0 ? ` (${blocked} absorbed)` : '';
          addLog(`  ${target.name}: ${taken} dmg${bs}`, Colors.RED);
          consumePoisonBuff(caster, target, taken);
        }
      }
      attacksThisTurn++;
      break;
    }
    case 'sneak_attack': {
      attacksThisTurn++; // count itself first
      const dmg = attacksThisTurn + caster.heroism;
      if (caster.heroism > 0) { addLog(`  (Heroism +${caster.heroism})`, Colors.GOLD); caster.heroism = 0; }
      addLog(`  Sneak Attack x${attacksThisTurn}!`, Colors.GOLD);
      const unpreventable = consumeUnpreventableBuff(caster);
      if (target instanceof Creature) {
        if (unpreventable) {
          target.takeUnpreventableDamage(dmg);
          if (dmg > 0) spawnDamageOnTarget(target, dmg, Colors.ORANGE);
          addLog(`  ${dmg} true dmg to ${target.name}`, Colors.ORANGE);
          consumePoisonBuff(caster, target, dmg);
        } else {
          const actual = target.takeDamage(dmg);
          if (actual > 0) spawnDamageOnTarget(target, actual);
          addLog(`  ${actual} dmg to ${target.name}`, Colors.RED);
          consumePoisonBuff(caster, target, actual);
        }
        if (!target.isAlive) { spawnDeathAnimation(target); addLog(`  ${target.name} destroyed!`, Colors.GOLD); countAndRemoveDeadCreatures(); }
      } else {
        if (unpreventable) {
          target.takeDamageFromDeck(dmg);
          if (dmg > 0) { spawnDamageOnTarget(target, dmg, Colors.ORANGE); triggerSplitPower(target); }
          addLog(`  ${dmg} true dmg to ${target.name}`, Colors.ORANGE);
          consumePoisonBuff(caster, target, dmg);
        } else {
          const [blocked, taken] = target.takeDamageWithDefense(dmg);
          if (taken > 0) { spawnDamageOnTarget(target, taken); triggerSplitPower(target); }
          addLog(`  ${taken} dmg to ${target.name}`, Colors.RED);
          consumePoisonBuff(caster, target, taken);
        }
      }
      break;
    }
    case 'shield_bash': {
      // Gain N shield, then deal damage equal to total shield
      caster.shield += eff.value;
      addLog(`  +${eff.value} Shield (S:${caster.shield})`, Colors.ALLY_BLUE);
      spawnTokenOnTarget(caster, eff.value, 'Shield', Colors.ALLY_BLUE);
      const dmg = caster.shield + caster.heroism;
      if (caster.heroism > 0) { addLog(`  (Heroism +${caster.heroism})`, Colors.GOLD); caster.heroism = 0; }
      const unpreventable = consumeUnpreventableBuff(caster);
      if (!unpreventable && !(target instanceof Creature) && target === enemy) {
        enemyAutoPlayDefenses(dmg);
      }
      if (target instanceof Creature) {
        if (unpreventable) {
          target.takeUnpreventableDamage(dmg);
          if (dmg > 0) spawnDamageOnTarget(target, dmg, Colors.ORANGE);
          addLog(`  ${target.name}: ${dmg} true dmg`, Colors.ORANGE);
          consumePoisonBuff(caster, target, dmg);
        } else {
          const actual = target.takeDamage(dmg);
          if (actual > 0) spawnDamageOnTarget(target, actual);
          addLog(`  ${target.name}: ${actual} dmg`, Colors.RED);
          consumePoisonBuff(caster, target, actual);
        }
        if (!target.isAlive) { spawnDeathAnimation(target); addLog(`  ${target.name} destroyed!`, Colors.GOLD); countAndRemoveDeadCreatures(); }
      } else {
        if (unpreventable) {
          target.takeDamageFromDeck(dmg);
          if (dmg > 0) { spawnDamageOnTarget(target, dmg, Colors.ORANGE); triggerSplitPower(target); }
          addLog(`  ${target.name}: ${dmg} true dmg`, Colors.ORANGE);
          consumePoisonBuff(caster, target, dmg);
        } else {
          const [blocked, taken] = target.takeDamageWithDefense(dmg);
          if (taken > 0) { spawnDamageOnTarget(target, taken); triggerSplitPower(target); }
          const bs = blocked > 0 ? ` (blocked ${blocked})` : '';
          addLog(`  ${target.name}: ${taken} dmg${bs}`, Colors.RED);
          consumePoisonBuff(caster, target, taken);
        }
      }
      attacksThisTurn++;
      break;
    }
    case 'multi_damage': {
      // Deal damage to up to maxTargets enemies (simplified: hit enemy + creatures)
      const dmg = eff.value + caster.heroism;
      if (caster.heroism > 0) { addLog(`  (Heroism +${caster.heroism})`, Colors.GOLD); caster.heroism = 0; }
      let hits = 0;
      const maxT = eff.maxTargets || 2;
      const unpreventable = consumeUnpreventableBuff(caster);
      // Hit the clicked target first
      if (target instanceof Creature) {
        if (unpreventable) {
          target.takeUnpreventableDamage(dmg);
          if (dmg > 0) spawnDamageOnTarget(target, dmg, Colors.ORANGE);
          addLog(`  ${dmg} true dmg to ${target.name}`, Colors.ORANGE);
          consumePoisonBuff(caster, target, dmg);
        } else {
          const actual = target.takeDamage(dmg);
          addLog(`  ${actual} dmg to ${target.name}`, Colors.RED);
          consumePoisonBuff(caster, target, actual);
        }
        if (!target.isAlive) addLog(`  ${target.name} destroyed!`, Colors.GOLD);
        hits++;
      } else {
        if (unpreventable) {
          target.takeDamageFromDeck(dmg);
          if (dmg > 0) { spawnDamageOnTarget(target, dmg, Colors.ORANGE); triggerSplitPower(target); }
          addLog(`  ${dmg} true dmg to ${target.name}`, Colors.ORANGE);
          consumePoisonBuff(caster, target, dmg);
        } else {
          const [blocked, taken] = target.takeDamageWithDefense(dmg);
          addLog(`  ${taken} dmg to ${target.name}`, Colors.RED);
          consumePoisonBuff(caster, target, taken);
        }
        hits++;
      }
      // Hit additional targets (also unpreventable when the buff fired)
      const others = [...enemy.creatures.filter(c => c.isAlive && c !== target)];
      for (const c of others) {
        if (hits >= maxT) break;
        if (unpreventable) {
          c.takeUnpreventableDamage(dmg);
          addLog(`  ${dmg} true dmg to ${c.name}`, Colors.ORANGE);
        } else {
          const actual = c.takeDamage(dmg);
          addLog(`  ${actual} dmg to ${c.name}`, Colors.RED);
        }
        if (!c.isAlive) addLog(`  ${c.name} destroyed!`, Colors.GOLD);
        hits++;
      }
      if (hits < maxT && !(target === enemy)) {
        if (unpreventable) {
          enemy.takeDamageFromDeck(dmg);
          addLog(`  ${dmg} true dmg to ${enemy.name}`, Colors.ORANGE);
        } else {
          const [blocked, taken] = enemy.takeDamageWithDefense(dmg);
          addLog(`  ${taken} dmg to ${enemy.name}`, Colors.RED);
        }
      }
      countAndRemoveDeadCreatures();
      attacksThisTurn++;
      break;
    }
    case 'split_damage': {
      // Encoded value: primary*10 + secondary (e.g. 43 = 4 to chosen target,
      // 3 to up to (maxTargets-1) others). Used by Steel Greataxe.
      const primary = Math.floor(eff.value / 10) + caster.heroism;
      const secondary = (eff.value % 10) + caster.heroism;
      if (caster.heroism > 0) { addLog(`  (Heroism +${caster.heroism})`, Colors.GOLD); caster.heroism = 0; }
      const maxT = eff.maxTargets || 3;
      const hitOne = (t, dmg) => {
        if (t instanceof Creature) {
          const actual = t.takeDamage(dmg);
          if (actual > 0) spawnDamageOnTarget(t, actual);
          addLog(`  ${actual} dmg to ${t.name}`, Colors.RED);
          if (!t.isAlive) { spawnDeathAnimation(t); addLog(`  ${t.name} destroyed!`, Colors.GOLD); }
        } else {
          if (t === enemy) enemyAutoPlayDefenses(dmg);
          const [blocked, taken] = t.takeDamageWithDefense(dmg);
          if (taken > 0) { spawnDamageOnTarget(t, taken); triggerSplitPower(t); }
          addLog(`  ${t.name}: ${taken} dmg`, Colors.RED);
        }
      };
      // Primary
      hitOne(target, primary);
      consumePoisonBuff(caster, target, primary);
      // Secondaries — first try other living creatures, then the enemy character if not already targeted.
      let extraHits = 0;
      const others = enemy.creatures.filter(c => c.isAlive && c !== target);
      for (const c of others) {
        if (extraHits >= maxT - 1) break;
        hitOne(c, secondary);
        extraHits++;
      }
      if (extraHits < maxT - 1 && target !== enemy && enemy.isAlive) {
        hitOne(enemy, secondary);
      }
      countAndRemoveDeadCreatures();
      attacksThisTurn++;
      break;
    }
    case 'apply_poison': {
      if (target instanceof Creature) {
        target.poisonStacks += eff.value;
        addLog(`  +${eff.value} Poison on ${target.name}`, Colors.GREEN);
      } else {
        target.applyStatus('POISON', eff.value);
        addLog(`  +${eff.value} Poison on ${target.name}`, Colors.GREEN);
      }
      spawnTokenOnTarget(target, eff.value, 'Poison', Colors.GREEN);
      break;
    }
    case 'grant_poison_buff': {
      caster.poisonBuff = (caster.poisonBuff || 0) + eff.value;
      // Stacking visual badge on the character. If an existing Vial buff is already
      // present, bump its stacks; otherwise add a fresh one.
      const existing = (caster.combatBuffs || []).find(b => b.id === 'vial_poison');
      if (existing) {
        existing.stacks = (existing.stacks || 1) + eff.value;
      } else {
        caster.addCombatBuff(new CombatBuff({
          id: 'vial_poison',
          name: 'Vial of Poison',
          description: 'Your next attack applies +1 Poison to the target.',
          imageId: 'vial_of_poison',
          effectType: 'grant_poison_buff',
          effectValue: eff.value,
          trigger: 'on_attack',
          combatsRemaining: 1,
          turnsRemaining: 0,
        }));
        const buff = caster.combatBuffs[caster.combatBuffs.length - 1];
        buff.stacks = eff.value;
      }
      addLog(`  ${caster.name}: next attack applies +${eff.value} Poison`, Colors.GREEN);
      break;
    }
    case 'grant_unpreventable_buff': {
      caster.unpreventableBuff = (caster.unpreventableBuff || 0) + eff.value;
      // Stacking visual badge on the character (mirrors Vial of Poison display logic).
      const existing = (caster.combatBuffs || []).find(b => b.id === 'slime_jar_buff');
      if (existing) {
        existing.stacks = (existing.stacks || 1) + eff.value;
      } else {
        caster.addCombatBuff(new CombatBuff({
          id: 'slime_jar_buff',
          name: 'Slime Jar',
          description: 'Your next attack is Unpreventable.',
          imageId: 'slime_jar',
          effectType: 'grant_unpreventable_buff',
          effectValue: eff.value,
          trigger: 'on_attack',
          combatsRemaining: 1,
          turnsRemaining: 0,
        }));
        const buff = caster.combatBuffs[caster.combatBuffs.length - 1];
        buff.stacks = eff.value;
      }
      addLog(`  ${caster.name}: next attack is Unpreventable`, Colors.ORANGE);
      break;
    }
    case 'apply_ice': {
      let appliedIce = 0;
      if (target instanceof Creature) {
        // Ice cancels fire first
        const cancel = Math.min(target.fireStacks, eff.value);
        if (cancel > 0) {
          target.fireStacks -= cancel;
          addLog(`  Ice cancels ${cancel} Fire on ${target.name}`, Colors.ICE_BLUE);
        }
        const remaining = eff.value - cancel;
        if (remaining > 0) {
          target.iceStacks += remaining;
          addLog(`  +${remaining} Ice on ${target.name}`, Colors.ICE_BLUE);
          appliedIce = remaining;
        }
      } else {
        const fire = target.getStatus('FIRE') || 0;
        const cancel = Math.min(fire, eff.value);
        if (cancel > 0) {
          target.removeStatus('FIRE', cancel);
          addLog(`  Ice cancels ${cancel} Fire on ${target.name}`, Colors.ICE_BLUE);
        }
        const remaining = eff.value - cancel;
        if (remaining > 0) {
          target.applyStatus('ICE', remaining);
          addLog(`  +${remaining} Ice on ${target.name}`, Colors.ICE_BLUE);
          appliedIce = remaining;
        }
      }
      if (appliedIce > 0) spawnTokenOnTarget(target, appliedIce, 'Ice', Colors.ICE_BLUE);
      break;
    }
    case 'apply_fire': {
      let appliedFire = 0;
      if (target instanceof Creature) {
        // Fire cancels ice first
        const cancel = Math.min(target.iceStacks, eff.value);
        if (cancel > 0) {
          target.iceStacks -= cancel;
          addLog(`  Fire cancels ${cancel} Ice on ${target.name}`, Colors.ORANGE);
        }
        const remaining = eff.value - cancel;
        if (remaining > 0) {
          target.fireStacks += remaining;
          addLog(`  +${remaining} Fire on ${target.name}`, Colors.RED);
          appliedFire = remaining;
        }
      } else {
        const ice = target.getStatus('ICE') || 0;
        const cancel = Math.min(ice, eff.value);
        if (cancel > 0) {
          target.removeStatus('ICE', cancel);
          addLog(`  Fire cancels ${cancel} Ice on ${target.name}`, Colors.ORANGE);
        }
        const remaining = eff.value - cancel;
        if (remaining > 0) {
          target.applyStatus('FIRE', remaining);
          addLog(`  +${remaining} Fire on ${target.name}`, Colors.RED);
          appliedFire = remaining;
        }
      }
      if (appliedFire > 0) spawnTokenOnTarget(target, appliedFire, 'Fire', Colors.ORANGE);
      break;
    }
    case 'apply_fire_all': {
      enemy.applyStatus('FIRE', eff.value);
      addLog(`  +${eff.value} Fire on ${enemy.name}`, Colors.RED);
      spawnTokenOnTarget(enemy, eff.value, 'Fire', Colors.ORANGE);
      for (const c of enemy.creatures) {
        c.fireStacks += eff.value;
        addLog(`  +${eff.value} Fire on ${c.name}`, Colors.RED);
        spawnTokenOnTarget(c, eff.value, 'Fire', Colors.ORANGE);
      }
      break;
    }
    case 'block':
      caster.addBlock(eff.value);
      addLog(`  +${eff.value} Block`, Colors.BLUE);
      spawnTokenOnTarget(caster, eff.value, 'Block', BLOCK_BLUE);
      break;
    case 'gain_shield':
      caster.shield += eff.value;
      addLog(`  +${eff.value} Shield (S:${caster.shield})`, Colors.ALLY_BLUE);
      spawnTokenOnTarget(caster, eff.value, 'Shield', Colors.ALLY_BLUE);
      break;
    case 'heal':
      healPlayer(eff.value);
      break;
    case 'discard_deck': {
      // Lose N cards from the top of the draw pile (Bad Rations side-effect)
      const before = player.deck.drawPile.length + player.deck.rechargePile.length;
      const taken = player.takeDamageFromDeck(eff.value);
      if (taken > 0) addLog(`  Lost ${taken} card${taken > 1 ? 's' : ''} from deck`, Colors.RED);
      else if (before === 0) addLog(`  (no cards in deck to discard)`, Colors.GRAY);
      break;
    }
    case 'regen_buff': {
      const buff = new CombatBuff({
        id: 'regrowth_regen',
        name: 'Regrowth',
        description: `Heal 1 at start of turn (${eff.value} turns)`,
        imageId: 'regrowth',
        effectType: 'heal',
        effectValue: 1,
        trigger: 'start_of_turn',
        combatsRemaining: 1,
        turnsRemaining: eff.value,
      });
      caster.addCombatBuff(buff);
      addLog(`  Regrowth: Heal 1 for ${eff.value} turns`, Colors.GREEN);
      break;
    }
    case 'grant_potency_buff': {
      // Scroll of Potency: +1 Heroism at start of turn for N turns.
      caster.addCombatBuff(new CombatBuff({
        id: 'scroll_of_potency_buff',
        name: 'Scroll of Potency',
        description: `+1 Heroism at start of turn (${eff.value} turns)`,
        imageId: 'scroll_of_potency',
        effectType: 'gain_heroism',
        effectValue: 1,
        trigger: 'start_of_turn',
        combatsRemaining: 1,
        turnsRemaining: eff.value,
      }));
      addLog(`  Scroll of Potency: +1 Heroism/turn for ${eff.value} turns`, Colors.GOLD);
      break;
    }
    case 'ale_buff': {
      // Ale: +1 Heroism at start of turn for N turns.
      caster.addCombatBuff(new CombatBuff({
        id: 'ale_buff',
        name: 'Ale',
        description: `+1 Heroism at start of turn (${eff.value} turns)`,
        imageId: 'ale',
        effectType: 'gain_heroism',
        effectValue: 1,
        trigger: 'start_of_turn',
        combatsRemaining: 1,
        turnsRemaining: eff.value,
      }));
      addLog(`  Ale: +1 Heroism/turn for ${eff.value} turns`, Colors.GOLD);
      break;
    }
    case 'dwarven_brew_buff': {
      // Dwarven Brew: +1 Shield at start of turn for N turns.
      caster.addCombatBuff(new CombatBuff({
        id: 'dwarven_brew_buff',
        name: 'Dwarven Brew',
        description: `+1 Shield at start of turn (${eff.value} turns)`,
        imageId: 'dwarven_brew',
        effectType: 'gain_shield',
        effectValue: 1,
        trigger: 'start_of_turn',
        combatsRemaining: 1,
        turnsRemaining: eff.value,
      }));
      addLog(`  Dwarven Brew: +1 Shield/turn for ${eff.value} turns`, Colors.ALLY_BLUE);
      break;
    }
    case 'draw': {
      const drawn = caster.deck.draw(eff.value, MAX_HAND_SIZE);
      for (const d of drawn) addLog(`  Draw: ${d.name}`, Colors.BLUE, d);
      break;
    }
    case 'gain_heroism':
      caster.heroism += eff.value;
      addLog(`  +${eff.value} Heroism`, Colors.GOLD);
      spawnTokenOnTarget(caster, eff.value, 'Heroism', Colors.GOLD);
      break;
    case 'summon_random': {
      // Summon 1 to value creatures
      const count = Math.floor(Math.random() * eff.value) + 1;
      for (let i = 0; i < count; i++) {
        const rat = new Creature({ name: 'Rat', attack: 1, maxHp: 1 });
        caster.addCreature(rat);
        addLog(`  Summoned ${rat.name}!`, Colors.ORANGE);
      }
      break;
    }
    case 'summon_thorb': {
      const thorb = new Creature({
        name: 'Thorb', attack: 2, maxHp: 4, isCompanion: true,
        description: 'Gains +1 Shield at end of your turn',
      });
      // Link to the source card so when Thorb dies, the card moves from
      // play pile to discard (costs HP). The card was already lifted from
      // hand by playCardSelf/playCardOnEnemy — we reroute it to the play
      // pile via _companionCard (see placeByCost override below).
      // _activePlayCard is set by playCardSelf/playCardOnEnemy before
      // effects resolve — it's the card instance that was just lifted
      // from hand. We link it to the creature so dying moves it to
      // discard, and flag it so placeByCost routes to playPile.
      thorb.sourceCard = _activePlayCard || null;
      if (_activePlayCard) _activePlayCard._routeToPlayPile = true;
      player.addCreature(thorb);
      addLog(`  Thorb joins the fight!`, Colors.GREEN);
      break;
    }
    case 'summon_thorb_upgraded': {
      const thorb = new Creature({
        name: 'Thorb', attack: 2, maxHp: 5, sentinel: true, isCompanion: true,
        description: 'Sentinel. Gains +1 Shield at end of your turn',
      });
      thorb.sourceCard = _activePlayCard || null;
      if (_activePlayCard) _activePlayCard._routeToPlayPile = true;
      player.addCreature(thorb);
      addLog(`  Thorb (Sentinel) joins the fight!`, Colors.GREEN);
      break;
    }
    case 'summon_tamed_rat': {
      const count = Math.floor(Math.random() * 2) + 1;
      let lastRat;
      for (let i = 0; i < count; i++) {
        lastRat = new Creature({ name: 'Tamed Rat', attack: 1, maxHp: 1 });
        player.addCreature(lastRat);
      }
      // Pass creature for hover preview in the log
      addLog(`  ${count} Tamed Rat${count > 1 ? 's' : ''} summoned`, Colors.ORANGE);
      // Add a hoverable entry for the creature
      if (lastRat) {
        const lastEntry = combatLog[combatLog.length - 1];
        if (lastEntry) lastEntry.creature = lastRat;
      }
      break;
    }
    case 'summon_pet_slime': {
      const slime = new Creature({ name: 'Pet Slime', attack: 1, maxHp: 1, unpreventable: true });
      caster.addCreature(slime);
      addLog(`  Pet Slime summoned!`, Colors.ORANGE);
      const lastEntry = combatLog[combatLog.length - 1];
      if (lastEntry) lastEntry.creature = slime;
      break;
    }
    case 'summon_small_spider': {
      const spider = new Creature({ name: 'Pet Spider', attack: 0, maxHp: 1, poisonAttack: true, isCompanion: true });
      caster.addCreature(spider);
      addLog(`  Pet Spider joins the fight!`, Colors.GREEN);
      const lastEntry = combatLog[combatLog.length - 1];
      if (lastEntry) lastEntry.creature = spider;
      break;
    }
    case 'create_goodberries': {
      // Create N Goodberry token cards directly into the player's hand (capped by MAX_HAND_SIZE)
      const count = eff.value;
      let added = 0;
      for (let i = 0; i < count; i++) {
        if (player.deck.hand.length >= MAX_HAND_SIZE) break;
        const berry = createGoodberry();
        player.deck.hand.push(berry);
        added++;
      }
      addLog(`  ${added} Goodberry created in hand`, Colors.GREEN);
      break;
    }
    case 'recharge_extra':
      // Cost is paid via the card recharge phase before targeting; nothing to do here.
      break;
    case 'damage_all': {
      const dmg = eff.value + caster.heroism;
      if (caster.heroism > 0) { caster.heroism = 0; }
      const [blocked, taken] = enemy.takeDamageWithDefense(dmg);
      addLog(`  ${taken} dmg to ${enemy.name}`, Colors.RED);
      for (const c of [...enemy.creatures]) {
        const actual = c.takeDamage(dmg);
        addLog(`  ${actual} dmg to ${c.name}`, Colors.RED);
        if (!c.isAlive) addLog(`  ${c.name} destroyed!`, Colors.GOLD);
      }
      countAndRemoveDeadCreatures();
      attacksThisTurn++;
      break;
    }
    case 'grant_potency_buff': {
      // Scroll of Potency: +1 Heroism per turn for value turns
      caster.heroism += 1;
      addLog(`  +1 Heroism`, Colors.GOLD);
      caster.addCombatBuff(new CombatBuff({
        id: 'scroll_of_potency', name: 'Scroll of Potency',
        description: '+1 Heroism per turn', imageId: 'scroll_of_potency',
        effectType: 'gain_heroism', effectValue: 1,
        trigger: 'start_of_turn', combatsRemaining: 99, turnsRemaining: eff.value,
      }));
      addLog(`  Potency buff: +1 Heroism/turn for ${eff.value} turns`, Colors.GOLD);
      break;
    }
    case 'ale_buff': {
      // Ale: Heal 1, +1 Heroism, then +1 Heroism/turn for value turns
      healPlayer(1);
      caster.heroism += 1;
      addLog(`  +1 Heroism`, Colors.GOLD);
      caster.addCombatBuff(new CombatBuff({
        id: 'ale_buff', name: 'Ale',
        description: '+1 Heroism per turn', imageId: 'ale',
        effectType: 'gain_heroism', effectValue: 1,
        trigger: 'start_of_turn', combatsRemaining: 99, turnsRemaining: eff.value,
      }));
      addLog(`  Ale buff: +1 Heroism/turn for ${eff.value} turns`, Colors.GOLD);
      break;
    }
    case 'scry_pick': {
      // Reveal top N cards from draw pile, player picks 1 to hand, rest recharge
      const scryCount = eff.value || 2;
      const revealed = [];
      for (let i = 0; i < scryCount && player.deck.drawPile.length > 0; i++) {
        revealed.push(player.deck.drawPile.pop());
      }
      if (revealed.length > 0) {
        scryCards = revealed;
        // If the card that triggered this scry already produced visible
        // animations this play (e.g. Torch's "Fire to all" float numbers),
        // pause briefly so the player sees the hit land before the modal
        // takes focus. Detected by active damageNumbers from this resolve
        // pass — no floats ⇒ scry was the only effect (Small Pouch), so
        // we open immediately and skip the awkward dead pause.
        const openScry = () => {
          state = GameState.SCRY_SELECT;
          showStyledToast(`Scry ${revealed.length}: pick 1 card to draw, the rest are recharged`, 'scry');
        };
        if (damageNumbers.length > 0) {
          setTimeout(openScry, 450);
        } else {
          openScry();
        }
      }
      break;
    }
    case 'buff_allies_heroism': {
      // Grant +N Heroism to every living creature ally of the caster.
      // Used by Warden's Whip, Motivational Whip, and similar rally effects.
      const allies = (caster && caster.creatures) || [];
      let buffed = 0;
      for (const ally of allies) {
        if (!ally.isAlive) continue;
        ally.heroism = (ally.heroism || 0) + eff.value;
        spawnTokenOnTarget(ally, eff.value, 'Heroism', Colors.GOLD);
        buffed++;
      }
      if (buffed > 0) {
        addLog(`  Allies gain +${eff.value} Heroism!`, Colors.GOLD);
      }
      break;
    }
    // Effects we acknowledge but don't fully implement yet
    case 'cat_form':
    case 'bear_form':
      break;
    default:
      break;
  }
}

// --- Playing cards ---
function cardStaysInHand(card) {
  return (card.currentEffects || []).some(e => e.effectType === 'stays_in_hand');
}

// Remove a card from the hand without routing it to its destination yet — used for
// effect-first plays (like Scraps where the card heals from discard before being discarded).
function liftCardFromHand(handIndex) {
  const card = player.deck.hand[handIndex];
  player.deck.hand.splice(handIndex, 1);
  return card;
}

function playCardSelf(handIndex) {
  const card = player.deck.hand[handIndex];
  const stays = cardStaysInHand(card);
  _activePlayCard = card; // visible to summon effects (e.g. summon_thorb)
  if (stays) {
    card.exhausted = true;
    addLog(`You use ${card.name} (stays in hand)`, Colors.GREEN, card);
  } else {
    liftCardFromHand(handIndex);
    addLog(`You play ${card.name}`, Colors.GREEN, card);
  }

  for (const eff of card.currentEffects) {
    if (eff.effectType === 'stays_in_hand') continue;
    resolveEffect(eff, player, enemy);
  }

  // Companion summon cards go to the play pile (not recharge/discard).
  // The flag is set by summon_thorb / summon_thorb_upgraded during
  // resolveEffect above. When the companion dies, its sourceCard ref
  // moves the card from playPile → discardPile (costs HP).
  if (!stays && card._routeToPlayPile) {
    player.deck.playPile.push(card);
    delete card._routeToPlayPile;
  } else if (!stays) {
    player.deck.placeByCost(card);
  }
  _activePlayCard = null;

  selectedCardIndex = -1;
  // Don't overwrite state if an effect (like scry_pick) changed it
  if (state === GameState.COMBAT || state === GameState.TARGETING) {
    state = GameState.COMBAT;
    checkCombatEnd();
  }
}

function playCardOnEnemy(handIndex) {
  const card = player.deck.hand[handIndex];
  const stays = cardStaysInHand(card);
  if (stays) {
    card.exhausted = true;
    addLog(`You use ${card.name} (stays in hand)`, Colors.GREEN, card);
  } else {
    liftCardFromHand(handIndex);
    addLog(`You play ${card.name}`, Colors.GREEN, card);
  }

  // Use modal mode effects if a mode was chosen, otherwise use card's own effects
  const effects = (modalCard && modalCard._chosenMode)
    ? modalCard._chosenMode.effects
    : card.currentEffects;
  if (modalCard && modalCard._chosenMode) {
    addLog(`  Mode: ${modalCard._chosenMode.description}`);
  }
  for (const eff of effects) {
    if (eff.effectType === 'stays_in_hand') continue;
    resolveEffect(eff, player, enemy);
  }

  if (!stays) player.deck.placeByCost(card);

  modalCard = null;
  modalTarget = null;
  selectedCardIndex = -1;
  state = GameState.COMBAT;
  checkCombatEnd();
}

function playCardOnCreature(handIndex, creature) {
  const card = player.deck.hand[handIndex];
  const stays = cardStaysInHand(card);
  if (stays) {
    card.exhausted = true;
    addLog(`You use ${card.name} on ${creature.name} (stays in hand)`, Colors.GREEN, card);
  } else {
    liftCardFromHand(handIndex);
    addLog(`You play ${card.name} on ${creature.name}`, Colors.GREEN, card);
  }

  const effects = (modalCard && modalCard._chosenMode)
    ? modalCard._chosenMode.effects
    : card.currentEffects;
  if (modalCard && modalCard._chosenMode) {
    addLog(`  Mode: ${modalCard._chosenMode.description}`);
  }
  for (const eff of effects) {
    if (eff.effectType === 'stays_in_hand') continue;
    if (eff.target === TargetType.SINGLE_ENEMY || eff.target === TargetType.RANDOM_ENEMY) {
      resolveEffect(eff, player, creature);
    } else {
      resolveEffect(eff, player, enemy);
    }
  }

  if (!stays) player.deck.placeByCost(card);

  modalCard = null;
  modalTarget = null;
  selectedCardIndex = -1;
  state = GameState.COMBAT;
  checkCombatEnd();
}

function dealDamageToEnemy(amount, target) {
  if (target === 'all') {
    const [blocked, taken] = enemy.takeDamageWithDefense(amount);
    if (taken > 0) { spawnDamageOnTarget(enemy, taken); triggerSplitPower(enemy); }
    addLog(`  ${taken} dmg to ${enemy.name}`, Colors.RED);
    for (const c of [...enemy.creatures]) {
      const actual = c.takeDamage(amount);
      if (actual > 0) spawnDamageOnTarget(c, actual);
      addLog(`  ${actual} dmg to ${c.name}`, Colors.RED);
      if (!c.isAlive) { spawnDeathAnimation(c); addLog(`  ${c.name} destroyed!`, Colors.GOLD); }
    }
    countAndRemoveDeadCreatures();
  } else {
    const [blocked, taken] = enemy.takeDamageWithDefense(amount);
    if (taken > 0) { spawnDamageOnTarget(enemy, taken); triggerSplitPower(enemy); }
    if (blocked > 0) addLog(`  (${blocked} blocked)`, Colors.BLUE);
    addLog(`  ${taken} dmg to ${enemy.name}`, Colors.RED);
  }
}

function healPlayer(amount) {
  // Heal = pop the top `amount` cards from the discard pile (most recently
  // damaged cards first). In combat they go to the recharge pile (re-enter
  // the deck at end of turn). Outside combat they are simply removed from
  // the discard pile (the discard shrinks = HP restored for next combat).
  // Each point of poison on the player consumes one point of healing first
  // (clears 1 Poison stack instead of healing 1 card).
  let remaining = amount;
  let poisonCleared = 0;
  const poison = player.getStatus('POISON') || 0;
  if (poison > 0 && remaining > 0) {
    const toClear = Math.min(poison, remaining);
    player.removeStatus('POISON', toClear);
    poisonCleared = toClear;
    remaining -= toClear;
    addLog(`  Healing purges ${toClear} Poison`, Colors.GREEN);
    if (state !== GameState.COMBAT) showStyledToast(`-${toClear} Poison (healed)`, 'scry', 2000);
  }
  let healed = 0;
  for (let i = 0; i < remaining && player.deck.discardPile.length > 0; i++) {
    const card = player.deck.discardPile.pop();
    if (player.deck.drawPile.length > 0 || player.deck.hand.length > 0) {
      player.deck.addToRechargePile(card);
    }
    addLog(`  Healed: ${card.name}`, Colors.GREEN, card);
    healed++;
  }
  if (healed > 0) {
    spawnHealOnTarget(player, healed);
    if (state !== GameState.COMBAT) showStyledToast(`+${healed} Healed`, 'heal', 2000);
  } else if (poisonCleared === 0 && amount > 0) {
    // Nothing to heal
    addLog(`  Nothing to heal.`, Colors.GRAY);
  }
}

// --- End turn ---
// --- Power system ---
function handlePowerClick(power) {
  if (power.isPassive) return;
  if (power.exhausted) {
    showToast('Power already used this turn.');
    return;
  }
  if (!power.canUse()) {
    showToast(`Need ${power.rechargeCost} card(s) in hand to use ${power.name}.`);
    return;
  }

  selectedPower = power;
  if (power.rechargeCost > 0) {
    // Enter recharge mode
    powerRechargeMode = true;
    _handOrderSnapshot = [...player.deck.hand];
    powerRechargeCardsNeeded = power.rechargeCost;
    powerRechargeCardsSelected = [];
    selectedCardIndex = -1;
    const verb = power.costIsDiscard ? 'discard' : 'recharge';
    showStyledToast(`${power.name}: Click ${power.rechargeCost} card(s) to ${verb} (ESC to cancel)`, 'recharge');
  } else if (powerHasChoices(power)) {
    enterPowerChoice(power);
  } else if (powerNeedsTargets(power)) {
    enterPowerTargeting(power);
  } else {
    executePower(power);
  }
}

function handlePowerRechargeClick(x, y) {
  // ESC check is in handleKeyDown
  const handRects = getHandCardRects(player.deck.hand);
  for (let i = handRects.length - 1; i >= 0; i--) {
    if (hitTest(x, y, getHandCardHoverRect(handRects, i))) {
      const card = player.deck.hand[i];
      // Remove card from hand and recharge/discard it
      player.deck.hand.splice(i, 1);
      // Remember pre-cost exhausted flag so cancelling restores it
      card._preRechargeExhausted = !!card.exhausted;
      card.exhausted = false; // leaving hand clears stay-in-hand exhaust
      if (selectedPower.costIsDiscard) {
        player.deck.discardPile.push(card);
      } else {
        player.deck.addToRechargePile(card); // held until end of turn
        applyOnRechargeShield(card); // Dwarven Greaves etc. — only on Recharge cost, not Discard
      }
      powerRechargeCardsSelected.push(card);
      powerRechargeCardsNeeded--;

      if (powerRechargeCardsNeeded <= 0) {
        const paid = powerRechargeCardsSelected.length;
        const verbPast = selectedPower.costIsDiscard ? 'discarded' : 'recharged';
        powerRechargeMode = false;
        hideToast();
        addLog(`  (${paid} card${paid > 1 ? 's' : ''} ${verbPast})`);
        if (powerHasChoices(selectedPower)) {
          enterPowerChoice(selectedPower);
        } else if (powerNeedsTargets(selectedPower)) {
          enterPowerTargeting(selectedPower);
        } else {
          executePower(selectedPower);
        }
      } else {
        const verb = selectedPower.costIsDiscard ? 'discard' : 'recharge';
        showStyledToast(`${selectedPower.name}: Click ${powerRechargeCardsNeeded} more card(s) to ${verb} (ESC to cancel)`, 'recharge');
      }
      return;
    }
  }

  // Click elsewhere: cancel
  cancelPowerRecharge();
}

function cancelPowerRecharge() {
  // Undo recharged cards back to hand
  for (const card of powerRechargeCardsSelected) {
    refundOnRechargeShield(card); // undo Dwarven Greaves shield etc.
    // Pull back from wherever we placed it (recharge pile or discard pile for discard-cost powers)
    const rcIdx = player.deck.rechargePile.indexOf(card);
    if (rcIdx !== -1) player.deck.rechargePile.splice(rcIdx, 1);
    const discIdx = player.deck.discardPile.indexOf(card);
    if (discIdx !== -1) player.deck.discardPile.splice(discIdx, 1);
    // Restore the pre-cost exhausted state
    card.exhausted = !!card._preRechargeExhausted;
    delete card._preRechargeExhausted;
  }
  // Restore the original hand order.
  if (_handOrderSnapshot) {
    player.deck.hand = _handOrderSnapshot;
    _handOrderSnapshot = null;
  }
  powerRechargeMode = false;
  powerRechargeCardsNeeded = 0;
  powerRechargeCardsSelected = [];
  selectedPower = null;
  hideToast();
  addLog('Power cancelled.', Colors.GRAY);
}

// === Powers that need target selection (like weapon attacks) ===
let powerTargets = [];
let powerMaxTargets = 0;
let powerChoices = [];          // current choice card list (e.g. Fire, Ice)
let powerChoiceRects = [];      // hit areas for the rendered choice cards
let powerChoiceCancelRect = null;
let chosenPowerEffect = null;   // which choice the player picked (drives subsequent targeting)

function enterPowerChoice(power) {
  powerChoices = power.choices.slice();
  powerChoiceRects = [];
  state = GameState.POWER_CHOICE;
  // Title is rendered on top of the overlay; no toast needed.
  hideToast();
}

function cancelPowerChoice() {
  // Refund recharged cards back to hand and un-exhaust the power
  if (selectedPower) {
    selectedPower.exhausted = false;
    for (const card of powerRechargeCardsSelected) {
      refundOnRechargeShield(card);
      const rcIdx = player.deck.rechargePile.indexOf(card);
      if (rcIdx !== -1) player.deck.rechargePile.splice(rcIdx, 1);
      const discIdx = player.deck.discardPile.indexOf(card);
      if (discIdx !== -1) player.deck.discardPile.splice(discIdx, 1);
      card.exhausted = !!card._preRechargeExhausted;
      delete card._preRechargeExhausted;
    }
  }
  if (_handOrderSnapshot) {
    player.deck.hand = _handOrderSnapshot;
    _handOrderSnapshot = null;
  }
  powerRechargeCardsSelected = [];
  powerChoices = [];
  powerChoiceRects = [];
  powerChoiceCancelRect = null;
  chosenPowerEffect = null;
  selectedPower = null;
  state = GameState.COMBAT;
  hideToast();
  addLog('Power cancelled.', Colors.GRAY);
}

function handlePowerChoiceClick(x, y) {
  // Card choices
  for (let i = 0; i < powerChoiceRects.length; i++) {
    if (hitTest(x, y, powerChoiceRects[i])) {
      const choice = powerChoices[i];
      onPowerChoicePicked(choice);
      return;
    }
  }
  // Cancel button
  if (powerChoiceCancelRect && hitTest(x, y, powerChoiceCancelRect)) {
    cancelPowerChoice();
  }
}

function onPowerChoicePicked(choice) {
  const power = selectedPower;
  // Self-targeting choices resolve immediately
  if (choice.id === 'cat_form_token') {
    powerChoices = [];
    powerChoiceRects = [];
    power.use();
    addLog(`Used power: ${power.name}`, Colors.GREEN, power);
    addLog(`  Mode: Feline Form`);
    player.heroism += 1;
    addLog(`  +1 Heroism (H:${player.heroism})`, Colors.GOLD);
    spawnTokenOnTarget(player, 1, 'Heroism', Colors.GOLD);
    const drawn = player.deck.draw(1, MAX_HAND_SIZE);
    for (const d of drawn) addLog(`  Draw: ${d.name}`, Colors.BLUE, d);
    selectedPower = null;
    state = GameState.COMBAT;
    hideToast();
    checkCombatEnd();
    return;
  }
  if (choice.id === 'bear_form_token') {
    powerChoices = [];
    powerChoiceRects = [];
    power.use();
    addLog(`Used power: ${power.name}`, Colors.GREEN, power);
    addLog(`  Mode: Bear Form`);
    player.shield += 1;
    addLog(`  +1 Shield (S:${player.shield})`, Colors.ALLY_BLUE);
    spawnTokenOnTarget(player, 1, 'Shield', Colors.ALLY_BLUE);
    const drawn = player.deck.draw(1, MAX_HAND_SIZE);
    for (const d of drawn) addLog(`  Draw: ${d.name}`, Colors.BLUE, d);
    selectedPower = null;
    state = GameState.COMBAT;
    hideToast();
    checkCombatEnd();
    return;
  }
  // Otherwise, the choice needs an enemy target — enter POWER_TARGETING.
  chosenPowerEffect = choice.id;
  powerChoices = [];
  powerChoiceRects = [];
  hideToast();
  enterPowerTargeting(power);
}

function drawPowerChoiceOverlay() {
  // Dark overlay
  ctx.fillStyle = 'rgba(0,0,0,0.78)';
  ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

  // Title
  const title = `${selectedPower ? selectedPower.name : 'Power'}: Choose an effect`;
  ctx.fillStyle = Colors.GOLD;
  ctx.font = 'bold 32px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, SCREEN_WIDTH / 2, 110);

  // Choice cards (full size, side by side)
  const cardW = 240;
  const cardH = 336;
  const gap = 40;
  const totalW = powerChoices.length * cardW + (powerChoices.length - 1) * gap;
  const startX = Math.floor((SCREEN_WIDTH - totalW) / 2);
  const cardY = 200;

  powerChoiceRects = [];
  for (let i = 0; i < powerChoices.length; i++) {
    const cx = startX + i * (cardW + gap);
    const r = { x: cx, y: cardY, w: cardW, h: cardH };
    powerChoiceRects.push(r);
    const hov = hitTest(mouseX, mouseY, r);
    if (hov) {
      ctx.strokeStyle = Colors.GOLD;
      ctx.lineWidth = 4;
      ctx.strokeRect(r.x - 4, r.y - 4, r.w + 8, r.h + 8);
    }
    drawCard(powerChoices[i], r.x, r.y, r.w, r.h, false, false, 'full');
  }

  // Cancel button (red, below)
  const cw = 220, ch = 50;
  const cx = Math.floor((SCREEN_WIDTH - cw) / 2);
  const cy = cardY + cardH + 30;
  powerChoiceCancelRect = { x: cx, y: cy, w: cw, h: ch };
  const cancelHov = hitTest(mouseX, mouseY, powerChoiceCancelRect);
  ctx.fillStyle = cancelHov ? '#642828' : '#3c1818';
  ctx.fillRect(cx, cy, cw, ch);
  ctx.strokeStyle = Colors.RED;
  ctx.lineWidth = 2;
  ctx.strokeRect(cx, cy, cw, ch);
  ctx.fillStyle = Colors.RED;
  ctx.font = 'bold 22px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Cancel (Esc)', cx + cw / 2, cy + ch / 2);
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
}

function powerHasChoices(power) {
  return Array.isArray(power.choices) && power.choices.length > 0;
}

function powerNeedsTargets(power) {
  // Powers that go straight to targeting after paying the cost
  return power.id === 'cleave' || power.id === 'quick_strike';
}

function powerTargetCount(power) {
  if (power.id === 'cleave') return 2;
  if (power.id === 'elemental_infusion') return 1;
  if (power.id === 'quick_strike') return 1;
  return 0;
}

function enterPowerTargeting(power) {
  powerTargets = [];
  powerMaxTargets = powerTargetCount(power);
  state = GameState.POWER_TARGETING;
  showStickyToast(`${power.name}: Click target (${powerMaxTargets - powerTargets.length} left, click elsewhere to finish)`);
}

function cancelPowerTargeting() {
  // Refund the power so it can be used again this turn (its cost was already paid).
  // Pull recharged cards back out of their piles first, then restore the
  // original hand order from the snapshot so they end up in the same spots
  // they came from (not appended at the end).
  if (selectedPower) {
    selectedPower.exhausted = false;
    for (const card of powerRechargeCardsSelected) {
      refundOnRechargeShield(card);
      const rcIdx = player.deck.rechargePile.indexOf(card);
      if (rcIdx !== -1) player.deck.rechargePile.splice(rcIdx, 1);
      const discIdx = player.deck.discardPile.indexOf(card);
      if (discIdx !== -1) player.deck.discardPile.splice(discIdx, 1);
      card.exhausted = !!card._preRechargeExhausted;
      delete card._preRechargeExhausted;
    }
  }
  if (_handOrderSnapshot) {
    player.deck.hand = _handOrderSnapshot;
    _handOrderSnapshot = null;
  }
  powerRechargeCardsSelected = [];
  powerTargets = [];
  powerMaxTargets = 0;
  chosenPowerEffect = null;
  selectedPower = null;
  state = GameState.COMBAT;
  hideToast();
  addLog('Power cancelled.', Colors.GRAY);
}

// === Feral Swipe: multi-target where # targets = player shield ===
function cardIsFeralSwipe(card) {
  return (card.currentEffects || []).some(e => e.effectType === 'feral_swipe_damage');
}

function enterFeralSwipeTargeting(handIndex) {
  const card = player.deck.hand[handIndex];
  // Grant shield first (from gain_shield effects on the card)
  let shieldGain = 0;
  for (const eff of card.currentEffects || []) {
    if (eff.effectType === 'gain_shield') shieldGain += eff.value;
  }
  player.shield += shieldGain;
  feralSwipeShieldGranted = shieldGain;
  feralSwipeMode = true;
  addLog(`Feral Swipe: +${shieldGain} Shield (S:${player.shield})`, Colors.ALLY_BLUE);
  spawnTokenOnTarget(player, shieldGain, 'Shield', Colors.ALLY_BLUE);

  // Enter multi-targeting with targets_needed = player.shield
  const allTargets = getAvailableEnemyTargets();
  const maxTargets = Math.min(player.shield, allTargets.length);
  if (maxTargets <= 0) {
    // No valid targets — revert shield
    player.shield = Math.max(0, player.shield - shieldGain);
    feralSwipeShieldGranted = 0;
    feralSwipeMode = false;
    showToast('No valid targets!');
    return;
  }
  multiCardIndex = handIndex;
  multiTargets = [];
  multiMaxTargets = maxTargets;
  selectedCardIndex = handIndex;
  state = GameState.MULTI_TARGETING;
  showStyledToast(`Feral Swipe! Pick up to ${maxTargets} target(s), then Done`, 'multi');
}

// === Multi-target attacks (Wooden Axe etc.) ===
function cardIsMultiTarget(card) {
  return (card.currentEffects || []).some(e => e.effectType === 'multi_damage');
}

function getMultiTargetMax(card) {
  for (const e of card.currentEffects || []) {
    if (e.effectType === 'multi_damage') return e.maxTargets || 2;
  }
  return 2;
}

function enterMultiTargeting(handIndex) {
  multiCardIndex = handIndex;
  multiTargets = [];
  const card = player.deck.hand[handIndex];
  multiMaxTargets = getMultiTargetMax(card);
  state = GameState.MULTI_TARGETING;
  // The player must always click/drag at least one target to confirm — even if
  // there's only one valid target, we DON'T auto-resolve on entry.
  showStyledToast(`${card.name}: pick up to ${multiMaxTargets} targets, then Done (or Cancel)`, 'multi');
}

function cancelMultiTargeting() {
  if (cardRechargedCards.length > 0) {
    cancelCardRecharge();
  }
  // Revert feral swipe shield if cancelling
  if (feralSwipeMode && player) {
    player.shield = Math.max(0, player.shield - feralSwipeShieldGranted);
    feralSwipeShieldGranted = 0;
    feralSwipeMode = false;
  }
  multiTargets = [];
  multiMaxTargets = 0;
  multiCardIndex = -1;
  selectedCardIndex = -1;
  barrageMode = false;
  state = GameState.COMBAT;
  hideToast();
}

function getMultiDoneBtnRect() {
  return { x: COMBAT_LEFT_W / 2 - 110, y: COMBAT_DIVIDER_Y + 35, w: 220, h: 44 };
}

function getMultiCancelBtnRect() {
  return { x: COMBAT_LEFT_W / 2 - 110, y: COMBAT_DIVIDER_Y + 88, w: 220, h: 40 };
}

function drawMultiTargetingOverlay() {
  // "Done (N/M)" button
  const doneR = getMultiDoneBtnRect();
  const canDone = multiTargets.length > 0;
  const doneHov = canDone && hitTest(mouseX, mouseY, doneR);
  ctx.fillStyle = canDone ? (doneHov ? '#3a8a3a' : '#1c5a1c') : '#444';
  ctx.fillRect(doneR.x, doneR.y, doneR.w, doneR.h);
  ctx.strokeStyle = canDone ? Colors.GREEN : '#777';
  ctx.lineWidth = 2;
  ctx.strokeRect(doneR.x, doneR.y, doneR.w, doneR.h);
  ctx.fillStyle = Colors.WHITE;
  ctx.font = 'bold 16px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`Done (${multiTargets.length}/${multiMaxTargets})`, doneR.x + doneR.w / 2, doneR.y + doneR.h / 2);

  // "Cancel (Esc)" button
  const cancelR = getMultiCancelBtnRect();
  const cancelHov = hitTest(mouseX, mouseY, cancelR);
  ctx.fillStyle = cancelHov ? '#642828' : '#3c1818';
  ctx.fillRect(cancelR.x, cancelR.y, cancelR.w, cancelR.h);
  ctx.strokeStyle = Colors.RED;
  ctx.lineWidth = 2;
  ctx.strokeRect(cancelR.x, cancelR.y, cancelR.w, cancelR.h);
  ctx.fillStyle = Colors.RED;
  ctx.fillText('Cancel (Esc)', cancelR.x + cancelR.w / 2, cancelR.y + cancelR.h / 2);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

function handleMultiTargetingClick(x, y) {
  // Done button
  const doneR = getMultiDoneBtnRect();
  if (hitTest(x, y, doneR) && multiTargets.length > 0) {
    resolveMultiTargeting();
    return;
  }
  // Cancel button
  const cancelR = getMultiCancelBtnRect();
  if (hitTest(x, y, cancelR)) {
    cancelMultiTargeting();
    return;
  }

  // Click enemy character
  const enemyCardRect = getCharacterCardRect(false);
  if (hitTest(x, y, enemyCardRect)) {
    if (multiTargets.length < multiMaxTargets && !multiTargets.includes(enemy)) {
      multiTargets.push(enemy);
      // Auto-fire when max targets reached
      if (multiTargets.length >= multiMaxTargets) {
        resolveMultiTargeting();
      } else {
        checkMultiAutoFire();
      }
    }
    return;
  }
  // Click enemy creature
  const creatureRects = getEnemyCreatureRects();
  for (let i = 0; i < creatureRects.length; i++) {
    if (hitTest(x, y, creatureRects[i])) {
      const c = enemy.creatures[i];
      if (multiTargets.length < multiMaxTargets && !multiTargets.includes(c)) {
        multiTargets.push(c);
        if (multiTargets.length >= multiMaxTargets) {
          resolveMultiTargeting();
        } else {
          checkMultiAutoFire();
        }
      }
      return;
    }
  }
  // Click elsewhere (non-target area) → cancel the whole attack
  cancelMultiTargeting();
}

function getAvailableEnemyTargets() {
  const t = [];
  if (enemy && enemy.isAlive) t.push(enemy);
  for (const c of enemy.creatures) {
    if (c.isAlive) t.push(c);
  }
  return t;
}

function checkMultiAutoFire() {
  // Never auto-fire — always let the player click Done to confirm.
  // Only auto-resolve if there are literally no more valid targets AND we have at least 1.
  const remainingValid = getAvailableEnemyTargets().filter(t => !multiTargets.includes(t));
  if (remainingValid.length === 0 && multiTargets.length > 0) {
    resolveMultiTargeting();
    return;
  }
  const card = player.deck.hand[multiCardIndex];
  if (multiTargets.length >= multiMaxTargets) {
    showStyledToast(`${card.name}: ${multiTargets.length}/${multiMaxTargets} picked — click Done to confirm`, 'multi');
  } else {
    showStyledToast(`${card.name}: ${multiTargets.length}/${multiMaxTargets} picked, click more or press Done`, 'multi');
  }
}

function resolveMultiTargeting() {
  if (multiCardIndex < 0 || multiCardIndex >= player.deck.hand.length) {
    cancelMultiTargeting();
    return;
  }
  const card = player.deck.hand[multiCardIndex];
  const targets = multiTargets.slice();
  // Lift card from hand BEFORE damage
  player.deck.hand.splice(multiCardIndex, 1);
  addLog(`You play ${card.name}`, Colors.GREEN, card);

  if (feralSwipeMode) {
    // Feral Swipe: 1 damage + heroism per target
    let heroismBonus = player.heroism;
    if (heroismBonus > 0) {
      player.heroism = 0;
      addLog(`  Heroism! +${heroismBonus} damage per hit`, Colors.GOLD);
    }
    const hitDmg = 1 + heroismBonus;
    for (const t of targets) {
      if (t === enemy) {
        const [blocked, taken] = enemy.takeDamageWithDefense(hitDmg);
        if (taken > 0) { spawnDamageOnTarget(enemy, taken); triggerSplitPower(enemy); }
        const bs = blocked > 0 ? ` (blocked ${blocked})` : '';
        addLog(`  -> Feral Swipe: ${enemy.name} takes ${taken} dmg${bs}`, Colors.WHITE);
      } else {
        const actual = t.takeDamage(hitDmg);
        if (actual > 0) spawnDamageOnTarget(t, actual);
        const bs = Math.max(0, hitDmg - actual) > 0 ? ` (blocked ${hitDmg - actual})` : '';
        addLog(`  -> Feral Swipe: ${t.name} takes ${actual} dmg${bs}`, Colors.WHITE);
        if (!t.isAlive) { spawnDeathAnimation(t); addLog(`  ${t.name} destroyed!`, Colors.GOLD); }
      }
    }
    showToast(`Feral Swipe hits ${targets.length} target(s)!`);
    attacksThisTurn++;
    feralSwipeMode = false;
    feralSwipeShieldGranted = 0;
  } else {
    // Normal multi_damage (Wooden Axe etc.)
    let dmg = 0;
    for (const eff of card.currentEffects) {
      if (eff.effectType === 'multi_damage') {
        dmg = eff.value + player.heroism;
        if (player.heroism > 0) {
          addLog(`  (Heroism +${player.heroism})`, Colors.GOLD);
          player.heroism = 0;
        }
        break;
      }
    }
    let hitEnemy = false;
    for (const t of targets) {
      if (t === enemy) {
        if (!hitEnemy) { enemyAutoPlayDefenses(dmg); hitEnemy = true; }
        const [blocked, taken] = enemy.takeDamageWithDefense(dmg);
        if (taken > 0) { spawnDamageOnTarget(enemy, taken); triggerSplitPower(enemy); }
        const bs = blocked > 0 ? ` (blocked ${blocked})` : '';
        addLog(`  ${enemy.name}: ${taken} dmg${bs}`, Colors.RED);
      } else {
        const actual = t.takeDamage(dmg);
        if (actual > 0) spawnDamageOnTarget(t, actual);
        const bs = Math.max(0, dmg - actual) > 0 ? ` (blocked ${dmg - actual})` : '';
        addLog(`  ${t.name}: ${actual} dmg${bs}`, Colors.RED);
        if (!t.isAlive) { spawnDeathAnimation(t); addLog(`  ${t.name} destroyed!`, Colors.GOLD); }
      }
    }
    attacksThisTurn++;
  }
  countAndRemoveDeadCreatures();

  player.deck.placeByCost(card);

  for (const n of pendingRechargeNames) addLog(`  Recharge: ${n}`);
  pendingRechargeNames = [];
  cardRechargedCards = [];

  multiTargets = [];
  multiMaxTargets = 0;
  multiCardIndex = -1;
  selectedCardIndex = -1;
  barrageMode = false;
  state = GameState.COMBAT;
  hideToast();
  checkCombatEnd();
}

// === Player ally manual attack ===
function cancelAllyTargeting() {
  selectedAlly = null;
  state = GameState.COMBAT;
  hideToast();
}

function handleAllyTargetingClick(x, y) {
  if (!selectedAlly) { state = GameState.COMBAT; return; }
  // Click enemy character → ally hits enemy
  const enemyCardRect = getCharacterCardRect(false);
  if (hitTest(x, y, enemyCardRect)) {
    resolveAllyAttack(selectedAlly, enemy);
    return;
  }
  // Click enemy creature → ally hits creature
  const creatureRects = getEnemyCreatureRects();
  for (let i = 0; i < creatureRects.length; i++) {
    if (hitTest(x, y, creatureRects[i])) {
      resolveAllyAttack(selectedAlly, enemy.creatures[i]);
      return;
    }
  }
  // Click elsewhere → cancel
  cancelAllyTargeting();
}

function resolveAllyAttack(ally, target) {
  const dmg = ally.attack;
  addLog(`${ally.name} attacks`, Colors.GREEN, ally.sourceCard || null);
  if (target === enemy) {
    if (ally.unpreventable) {
      // Bypass shield/armor/block — go straight to deck damage. Mirrors the
      // unpreventable branch in processPlayerAllyAttacks (auto-attack path).
      const taken = enemy.takeDamageFromDeck(dmg);
      if (taken > 0) { spawnDamageOnTarget(enemy, taken, Colors.ORANGE); triggerSplitPower(enemy); }
      addLog(`  ${enemy.name}: ${taken} unpreventable dmg`, Colors.ORANGE);
      maybeApplyAttackPoison(ally, enemy, dmg);
    } else {
      if (dmg > 0) enemyAutoPlayDefenses(dmg);
      const [blocked, taken] = enemy.takeDamageWithDefense(dmg);
      const blockedSuffix = blocked > 0 ? ` (blocked ${blocked})` : '';
      addLog(`  ${enemy.name}: ${taken} dmg${blockedSuffix}`, Colors.RED);
      if (taken > 0) { spawnDamageOnTarget(enemy, taken); triggerSplitPower(enemy); }
      maybeApplyAttackPoison(ally, enemy, taken);
    }
  } else {
    if (ally.unpreventable) {
      const actual = target.takeUnpreventableDamage(dmg);
      if (actual > 0) spawnDamageOnTarget(target, actual, Colors.ORANGE);
      addLog(`  ${target.name}: ${actual} unpreventable dmg`, Colors.ORANGE);
      maybeApplyAttackPoison(ally, target, dmg);
    } else {
      const actual = target.takeDamage(dmg);
      if (actual > 0) spawnDamageOnTarget(target, actual);
      const blocked = Math.max(0, dmg - actual);
      const blockedSuffix = blocked > 0 ? ` (blocked ${blocked})` : '';
      addLog(`  ${target.name}: ${actual} dmg${blockedSuffix}`, Colors.RED);
      maybeApplyAttackPoison(ally, target, actual);
    }
    if (!target.isAlive) { spawnDeathAnimation(target); addLog(`  ${target.name} destroyed!`, Colors.GOLD); }
    countAndRemoveDeadCreatures();
  }
  ally.exhaust();
  selectedAlly = null;
  state = GameState.COMBAT;
  hideToast();
  checkCombatEnd();
}

// Apply 1 Poison to the target if the attacker has poisonAttack.
// Rule: If the attack was fully absorbed (0 damage), the poison doesn't land.
// Exception: 0-attack poison creatures (Pet Spider) land poison unless the target has armor —
// shields/block are pushed aside; only armor stops the fangs.
function maybeApplyAttackPoison(attacker, target, damageDealt) {
  if (!attacker || !attacker.poisonAttack) return;
  let landed;
  if ((attacker.attack || 0) > 0) {
    landed = damageDealt > 0;
  } else {
    const armorVal = (target && (target.armor || target.baseArmor)) || 0;
    landed = armorVal <= 0;
  }
  if (!landed) {
    addLog(`  (Poison absorbed — no effect)`, Colors.GRAY);
    return;
  }
  if (target instanceof Creature) {
    target.poisonStacks = (target.poisonStacks || 0) + 1;
  } else if (typeof target.applyStatus === 'function') {
    target.applyStatus('POISON', 1);
  }
  addLog(`  +1 Poison on ${target.name}`, Colors.GREEN);
}

function handlePowerTargetingClick(x, y) {
  // Click on enemy character → add as target
  const enemyCardRect = getCharacterCardRect(false);
  if (hitTest(x, y, enemyCardRect)) {
    if (!powerTargets.includes(enemy)) {
      powerTargets.push(enemy);
      checkPowerTargetingComplete();
    }
    return;
  }
  // Click on enemy creature → add as target
  const creatureRects = getEnemyCreatureRects();
  for (let i = 0; i < creatureRects.length; i++) {
    if (hitTest(x, y, creatureRects[i])) {
      const c = enemy.creatures[i];
      if (!powerTargets.includes(c)) {
        powerTargets.push(c);
        checkPowerTargetingComplete();
      }
      return;
    }
  }
  // Click elsewhere → finish with current targets (if any)
  if (powerTargets.length > 0) {
    resolvePowerTargeting();
  } else {
    cancelPowerTargeting();
  }
}

function checkPowerTargetingComplete() {
  if (powerTargets.length >= powerMaxTargets) {
    resolvePowerTargeting();
    return;
  }
  // Auto-fire if no more unpicked targets remain (e.g. only 1 creature and
  // cleave normally wants 2 — don't force the player to "click elsewhere").
  let availableCount = 0;
  if (enemy.isAlive && !powerTargets.includes(enemy)) availableCount++;
  for (const c of enemy.creatures) {
    if (c.isAlive && !powerTargets.includes(c)) availableCount++;
  }
  if (availableCount === 0 && powerTargets.length > 0) {
    resolvePowerTargeting();
    return;
  }
  showStickyToast(`${selectedPower.name}: Click target (${powerMaxTargets - powerTargets.length} left, click elsewhere to finish)`);
}

function resolvePowerTargeting() {
  hideToast();
  const power = selectedPower;
  const targets = powerTargets.slice();
  powerTargets = [];
  powerMaxTargets = 0;
  state = GameState.COMBAT;

  power.use();
  addLog(`Used power: ${power.name}`, Colors.GREEN, power);

  if (power.id === 'cleave') {
    attacksThisTurn++;
    const dmg = 1 + player.heroism;
    if (player.heroism > 0) { addLog(`  (Heroism +${player.heroism})`, Colors.GOLD); player.heroism = 0; }
    const unpreventable = consumeUnpreventableBuff(player);
    let poisonApplied = false;
    for (const t of targets) {
      let dmgLanded = 0;
      if (t === enemy) {
        if (unpreventable) {
          enemy.takeDamageFromDeck(dmg);
          if (dmg > 0) { spawnDamageOnTarget(t, dmg, Colors.ORANGE); triggerSplitPower(t); }
          addLog(`  ${enemy.name}: ${dmg} true dmg`, Colors.ORANGE);
          dmgLanded = dmg;
        } else {
          enemyAutoPlayDefenses(dmg);
          const [blocked, taken] = enemy.takeDamageWithDefense(dmg);
          if (taken > 0) { spawnDamageOnTarget(t, taken); triggerSplitPower(t); }
          const blockedSuffix = blocked > 0 ? ` (blocked ${blocked})` : '';
          addLog(`  ${enemy.name}: ${taken} dmg${blockedSuffix}`, Colors.RED);
          dmgLanded = taken;
        }
      } else {
        if (unpreventable) {
          t.takeUnpreventableDamage(dmg);
          if (dmg > 0) { spawnDamageOnTarget(t, dmg, Colors.ORANGE); triggerSplitPower(t); }
          addLog(`  ${t.name}: ${dmg} true dmg`, Colors.ORANGE);
          if (!t.isAlive) { spawnDeathAnimation(t); addLog(`  ${t.name} destroyed!`, Colors.GOLD); }
          dmgLanded = dmg;
        } else {
          const actual = t.takeDamage(dmg);
          if (actual > 0) { spawnDamageOnTarget(t, actual); triggerSplitPower(t); }
          const blocked = Math.max(0, dmg - actual);
          const blockedSuffix = blocked > 0 ? ` (blocked ${blocked})` : '';
          addLog(`  ${t.name}: ${actual} dmg${blockedSuffix}`, Colors.RED);
          if (!t.isAlive) { spawnDeathAnimation(t); addLog(`  ${t.name} destroyed!`, Colors.GOLD); }
          dmgLanded = actual;
        }
      }
      if (!poisonApplied) { consumePoisonBuff(player, t, dmgLanded); poisonApplied = true; }
    }
    countAndRemoveDeadCreatures();
  } else if (power.id === 'elemental_infusion') {
    // Apply Fire or Ice based on the picked choice
    const t = targets[0];
    const isIce = chosenPowerEffect === 'ice_token';
    if (isIce) {
      addLog(`  Mode: Ice`);
      // Ice cancels fire first
      if (t === enemy) {
        const fire = enemy.getStatus('FIRE') || 0;
        if (fire > 0) { enemy.removeStatus('FIRE', 1); addLog(`  Ice cancels 1 Fire on ${enemy.name}`, Colors.ICE_BLUE); }
        else { enemy.applyStatus('ICE', 1); addLog(`  +1 Ice on ${enemy.name}`, Colors.ICE_BLUE); }
      } else {
        if (t.fireStacks > 0) { t.fireStacks--; addLog(`  Ice cancels 1 Fire on ${t.name}`, Colors.ICE_BLUE); }
        else { t.iceStacks = (t.iceStacks || 0) + 1; addLog(`  +1 Ice on ${t.name}`, Colors.ICE_BLUE); }
      }
    } else {
      addLog(`  Mode: Fire`);
      // Fire cancels ice first
      if (t === enemy) {
        const ice = enemy.getStatus('ICE') || 0;
        if (ice > 0) { enemy.removeStatus('ICE', 1); addLog(`  Fire cancels 1 Ice on ${enemy.name}`, Colors.ORANGE); }
        else { enemy.applyStatus('FIRE', 1); addLog(`  +1 Fire on ${enemy.name}`, Colors.RED); }
      } else {
        if (t.iceStacks > 0) { t.iceStacks--; addLog(`  Fire cancels 1 Ice on ${t.name}`, Colors.ORANGE); }
        else { t.fireStacks = (t.fireStacks || 0) + 1; addLog(`  +1 Fire on ${t.name}`, Colors.RED); }
      }
    }
    chosenPowerEffect = null;
  } else if (power.id === 'quick_strike') {
    // Quick Strike counts as an attack (so Sneak Attack can tally it, Split triggers, etc.)
    attacksThisTurn++;
    const dmg = 1 + player.heroism;
    if (player.heroism > 0) { addLog(`  (Heroism +${player.heroism})`, Colors.GOLD); player.heroism = 0; }
    const unpreventable = consumeUnpreventableBuff(player);
    const t = targets[0];
    if (t === enemy) {
      if (unpreventable) {
        enemy.takeDamageFromDeck(dmg);
        if (dmg > 0) { spawnDamageOnTarget(t, dmg, Colors.ORANGE); triggerSplitPower(t); }
        addLog(`  ${enemy.name}: ${dmg} true dmg`, Colors.ORANGE);
        consumePoisonBuff(player, t, dmg);
      } else {
        enemyAutoPlayDefenses(dmg);
        const [blocked, taken] = enemy.takeDamageWithDefense(dmg);
        if (taken > 0) { spawnDamageOnTarget(t, taken); triggerSplitPower(t); }
        const blockedSuffix = blocked > 0 ? ` (blocked ${blocked})` : '';
        addLog(`  ${enemy.name}: ${taken} dmg${blockedSuffix}`, Colors.RED);
        consumePoisonBuff(player, t, taken);
      }
    } else {
      if (unpreventable) {
        t.takeUnpreventableDamage(dmg);
        if (dmg > 0) { spawnDamageOnTarget(t, dmg, Colors.ORANGE); triggerSplitPower(t); }
        addLog(`  ${t.name}: ${dmg} true dmg`, Colors.ORANGE);
        consumePoisonBuff(player, t, dmg);
        if (!t.isAlive) { spawnDeathAnimation(t); addLog(`  ${t.name} destroyed!`, Colors.GOLD); }
      } else {
        const actual = t.takeDamage(dmg);
        if (actual > 0) { spawnDamageOnTarget(t, actual); triggerSplitPower(t); }
        const blocked = Math.max(0, dmg - actual);
        const blockedSuffix = blocked > 0 ? ` (blocked ${blocked})` : '';
        addLog(`  ${t.name}: ${actual} dmg${blockedSuffix}`, Colors.RED);
        consumePoisonBuff(player, t, actual);
        if (!t.isAlive) { spawnDeathAnimation(t); addLog(`  ${t.name} destroyed!`, Colors.GOLD); }
      }
    }
    countAndRemoveDeadCreatures();
    const drawn = player.deck.draw(1, MAX_HAND_SIZE);
    for (const d of drawn) addLog(`  Draw: ${d.name}`, Colors.BLUE, d);
  }

  selectedPower = null;
  checkCombatEnd();
}

function executePower(power) {
  power.use();
  addLog(`Used power: ${power.name}`, Colors.GREEN, power);

  switch (power.id) {
    case 'cleave': {
      // (Cleave is handled via the targeting flow; this branch is a fallback.)
      const dmg = 1 + player.heroism;
      if (player.heroism > 0) { addLog(`  (Heroism +${player.heroism})`, Colors.GOLD); player.heroism = 0; }
      let hits = 0;
      for (const c of [...enemy.creatures]) {
        if (hits >= 2) break;
        const actual = c.takeDamage(dmg);
        addLog(`  ${actual} dmg to ${c.name}`, Colors.RED);
        if (!c.isAlive) { addLog(`  ${c.name} destroyed!`, Colors.GOLD); }
        hits++;
      }
      if (hits < 2 && enemy.isAlive) {
        const [blocked, taken] = enemy.takeDamageWithDefense(dmg);
        addLog(`  ${taken} dmg to ${enemy.name}`, Colors.RED);
      }
      countAndRemoveDeadCreatures();
      break;
    }
    case 'aimed_shot': {
      player.heroism += 1;
      addLog(`  +1 Heroism (H:${player.heroism})`, Colors.GOLD);
      spawnTokenOnTarget(player, 1, 'Heroism', Colors.GOLD);
      const drawn = player.deck.draw(1, MAX_HAND_SIZE);
      for (const d of drawn) addLog(`  Draw: ${d.name}`, Colors.BLUE, d);
      break;
    }
    case 'elemental_infusion': {
      // Apply 1 fire with ice cancellation
      const ice = enemy.getStatus('ICE') || 0;
      if (ice > 0) {
        enemy.removeStatus('ICE', 1);
        addLog(`  Fire cancels 1 Ice on ${enemy.name}`, Colors.ORANGE);
      } else {
        enemy.applyStatus('FIRE', 1);
        addLog(`  +1 Fire on ${enemy.name}`, Colors.RED);
      }
      break;
    }
    case 'quick_strike': {
      const dmg = 1 + player.heroism;
      if (player.heroism > 0) { addLog(`  (Heroism +${player.heroism})`, Colors.GOLD); player.heroism = 0; }
      const [blocked, taken] = enemy.takeDamageWithDefense(dmg);
      if (blocked > 0) addLog(`  (${blocked} blocked)`, Colors.BLUE);
      addLog(`  ${taken} dmg to ${enemy.name}`, Colors.RED);
      const drawn = player.deck.draw(1, MAX_HAND_SIZE);
      for (const d of drawn) addLog(`  Draw: ${d.name}`, Colors.BLUE, d);
      break;
    }
    case 'battle_fury': {
      player.heroism += 1;
      player.shield += 1;
      addLog(`  +1 Heroism, +1 Shield`, Colors.GOLD);
      spawnTokenOnTarget(player, 1, 'Heroism', Colors.GOLD);
      spawnTokenOnTarget(player, 1, 'Shield', Colors.ALLY_BLUE);
      const drawn = player.deck.draw(2, MAX_HAND_SIZE);
      for (const d of drawn) addLog(`  Draw: ${d.name}`, Colors.BLUE, d);
      break;
    }
    case 'feral_form': {
      // Simplified: gain 1 heroism + draw 1 (cat form default)
      player.heroism += 1;
      addLog(`  Feline Form! +1 Heroism`, Colors.GOLD);
      spawnTokenOnTarget(player, 1, 'Heroism', Colors.GOLD);
      const drawn = player.deck.draw(1, MAX_HAND_SIZE);
      for (const d of drawn) addLog(`  Draw: ${d.name}`, Colors.BLUE, d);
      break;
    }
    default:
      addLog(`  (Power effect not yet implemented)`, Colors.GRAY);
  }

  selectedPower = null;
  checkCombatEnd();
}

// === Player Incoming Damage Flow ===
// Phase 1: auto-mitigation (shield → armor → block)
// Phase 2: DEFENDING (play defense cards or pass)
// Phase 3: DAMAGE_SOURCE (player picks each point: discard hand card OR mill draw pile)

let pendingIncomingDamage = 0; // remaining damage after auto-mitigation in current flow

// Apply auto-mitigation layers (shield/armor/block) and log them.
// Returns remaining damage after auto-mitigation.
function autoMitigateDamage(dmg) {
  let remaining = dmg;
  if (player.shield > 0 && remaining > 0) {
    const absorbed = Math.min(player.shield, remaining);
    player.shield -= absorbed;
    remaining -= absorbed;
    addLog(`  Shield absorbs ${absorbed} damage (S:${player.shield} remaining)`);
  }
  if (player.armor > 0 && remaining > 0) {
    const absorbed = Math.min(player.armor, remaining);
    remaining -= absorbed;
    addLog(`  Armor absorbs ${absorbed} damage`);
  }
  if (player.currentBlock > 0 && remaining > 0) {
    const absorbed = Math.min(player.currentBlock, remaining);
    player.currentBlock -= absorbed;
    remaining -= absorbed;
    addLog(`  Block absorbs ${absorbed} damage`);
  }
  return remaining;
}

// Entry point: player is taking `dmg` incoming damage.
function startIncomingDamage(dmg, label = 'damage to you') {
  if (dmg <= 0) return;
  addLog(`  ${dmg} ${label}`, Colors.RED);
  showStyledToast(`Incoming ${dmg} damage!`, 'damage');
  const remaining = autoMitigateDamage(dmg);
  if (remaining <= 0) {
    addLog(`  All damage absorbed!`);
    hideToast();
    return;
  }
  pendingIncomingDamage = remaining;
  // Phase 2: defending (if defense cards available)
  if (player.deck.hand.some(c => c.cardType === CardType.DEFENSE)) {
    state = GameState.DEFENDING;
    showStyledToast(`Incoming ${remaining} damage. Play defense cards or pass.`, 'damage');
    return;
  }
  // No defenses → straight to take-damage choice
  enterTakeDamagePhase();
}

function enterTakeDamagePhase() {
  if (pendingIncomingDamage <= 0) {
    finishIncomingDamage();
    return;
  }
  // If hand + deck (draw + recharge) both empty → defeat
  const deckAvail = player.deck.deckDamageAvailable();
  if (player.deck.hand.length === 0 && deckAvail === 0) {
    pendingIncomingDamage = 0;
    state = GameState.COMBAT;
    hideToast();
    addLog('DEFEATED!', Colors.RED);
    state = GameState.GAME_OVER;
    return;
  }
  state = GameState.DAMAGE_SOURCE;
  if (deckAvail === 0) {
    showStyledToast(`Deck empty! Discard ${pendingIncomingDamage} from hand.`, 'damage');
  } else {
    showStyledToast(`${pendingIncomingDamage} damage — discard from hand or take from deck`, 'damage');
  }
}

function finishIncomingDamage() {
  pendingIncomingDamage = 0;
  hideToast();
  state = GameState.COMBAT;
  if (checkCombatEnd()) return;
  // If we were resolving the end-of-enemy-turn damage flow, transition to the player turn now.
  if (awaitingEnemyDamage) {
    completePlayerTurnTransition();
  }
}

// Click handler for DAMAGE_SOURCE state
function handleDamageSourceClick(x, y) {
  // "Take from Deck" button (only if deck has any cards across draw + recharge piles).
  // Single click takes ALL remaining damage from the deck (or as much as the deck has).
  const deckBtn = getTakeFromDeckBtnRect();
  const deckAvail = player.deck.deckDamageAvailable();
  if (hitTest(x, y, deckBtn) && deckAvail > 0) {
    const toTake = Math.min(pendingIncomingDamage, deckAvail);
    const milled = [];
    for (let i = 0; i < toTake; i++) {
      const card = player.deck.damageFromDrawPile();
      if (!card) break;
      milled.push(card);
      pendingIncomingDamage--;
    }
    if (milled.length > 0) {
      spawnDamageOnTarget(player, milled.length);
      addLog(`  Took ${milled.length} from deck:`);
      for (const c of milled) addLog(`  Discarded: ${c.name}`, Colors.WHITE, c);
    }
    if (pendingIncomingDamage <= 0) finishIncomingDamage();
    else enterTakeDamagePhase();
    return;
  }
  // Click hand card → discard for 1 damage (topmost first)
  const handRects = getHandCardRects(player.deck.hand);
  for (let i = handRects.length - 1; i >= 0; i--) {
    if (!hitTest(x, y, getHandCardHoverRect(handRects, i))) continue;
    const card = player.deck.hand[i];
    player.deck.hand.splice(i, 1);
    card.exhausted = false;
    player.deck.discardPile.push(card);
    spawnDamageOnTarget(player, 1);
    addLog(`  Discarded: ${card.name}`, Colors.WHITE, card);
    pendingIncomingDamage--;
    if (pendingIncomingDamage <= 0) finishIncomingDamage();
    else enterTakeDamagePhase();
    return;
  }
}

function getTakeFromDeckBtnRect() {
  // Centered within the left card area (excluding the right log column)
  return { x: COMBAT_LEFT_W / 2 - 110, y: COMBAT_DIVIDER_Y + 35, w: 220, h: 44 };
}

function drawDamageSourceOverlay() {
  // Pulsing red warning on each hand card's visible portion. Clipped horizontally
  // to the card's visible slice (no bleed onto neighbors) but padded vertically
  // so the glow can extend above/below the card edges.
  const pulse = (Math.sin(performance.now() / 150) + 1) / 2;
  const glowAlpha = 0.7 + 0.3 * pulse;
  const handRects = getHandCardRects(player.deck.hand);
  for (let i = 0; i < handRects.length; i++) {
    const r = handRects[i];
    const visR = getHandCardHoverRect(handRects, i);
    const padLeft = (i === 0) ? 20 : 0;
    const padRight = (i === handRects.length - 1) ? 20 : 0;
    ctx.save();
    ctx.beginPath();
    ctx.rect(visR.x - padLeft, visR.y - 16, visR.w + padLeft + padRight, visR.h + 32);
    ctx.clip();
    // Outer soft red glow
    ctx.shadowColor = `rgba(255, 70, 70, ${glowAlpha})`;
    ctx.shadowBlur = 32;
    ctx.strokeStyle = `rgba(255, 70, 70, ${glowAlpha * 0.9})`;
    ctx.lineWidth = 7;
    ctx.strokeRect(r.x - 3, r.y - 3, r.w + 6, r.h + 6);
    // Bright inner line
    ctx.shadowBlur = 0;
    ctx.strokeStyle = `rgba(255, 210, 210, ${Math.min(1, glowAlpha + 0.15)})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(r.x, r.y, r.w, r.h);
    ctx.restore();
  }

  // "Take from Deck" button — red themed, label shows damage left to discard
  const r = getTakeFromDeckBtnRect();
  const deckAvail = player.deck.deckDamageAvailable();
  const deckEmpty = deckAvail === 0;
  const hov = !deckEmpty && hitTest(mouseX, mouseY, r);
  ctx.fillStyle = deckEmpty ? '#444' : (hov ? '#9a2828' : '#641818');
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = Colors.RED;
  ctx.lineWidth = 2;
  ctx.strokeRect(r.x, r.y, r.w, r.h);
  ctx.fillStyle = Colors.WHITE;
  ctx.font = 'bold 16px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const label = deckEmpty
    ? `Discard ${pendingIncomingDamage} from hand`
    : `Take ${pendingIncomingDamage} from Deck`;
  ctx.fillText(label, r.x + r.w / 2, r.y + r.h / 2);
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
}

function endPlayerTurn() {
  if (!isPlayerTurn) return;
  if (powerRechargeMode) return; // can't end turn mid-recharge
  addLog('--- End of Your Turn ---', Colors.GRAY);

  // Player allies do NOT auto-attack — the player must click them and pick a target.
  // Unused allies remain ready and will simply re-ready at the start of next turn.

  // Process status effects on player
  processStatusEffects(player, 'You');
  if (checkCombatEnd()) return;

  // Thorb gains +1 Shield at end of player's turn (matches PY behavior).
  for (const ally of player.creatures) {
    if (ally.isAlive && ally.name === 'Thorb') {
      ally.shield += 1;
      addLog(`  Thorb gains +1 Shield (S:${ally.shield})`, Colors.ALLY_BLUE);
      spawnTokenOnTarget(ally, 1, 'Shield', Colors.ALLY_BLUE);
    }
  }

  player.clearBlock();
  // Shield persists between turns — only block clears
  // Flush the recharge pile back under the deck.
  player.deck.flushRechargePile();
  // Refill UP TO hand size — draw nothing if hand is already at or above hand size.
  const handSize = getPlayerHandSize();
  const toDraw = Math.max(0, handSize - player.deck.hand.length);
  if (toDraw > 0) {
    const drawn = player.deck.draw(toDraw, MAX_HAND_SIZE);
    if (drawn.length > 0) addLog(`You draw ${drawn.length} card${drawn.length > 1 ? 's' : ''}`, Colors.GREEN);
  }

  selectedCardIndex = -1;
  isPlayerTurn = false;

  // Start enemy turn after delay
  startEnemyTurn();
}

// --- Status Effects ---
function processStatusEffects(character, label) {
  // Fire: deal damage equal to stacks (reduced by armor/shield), then reduce by 1
  const fire = character.getStatus('FIRE');
  if (fire > 0) {
    const [blocked, taken] = character.takeDamageWithDefense(fire);
    if (taken > 0) spawnDamageOnTarget(character, taken);
    const bs = blocked > 0 ? ` (${blocked} absorbed)` : '';
    addLog(`  ${label} takes ${taken} Fire damage!${bs}`, Colors.RED);
    character.removeStatus('FIRE', 1);
  }
  // Poison: deal damage equal to stacks (unpreventable). Stacks do NOT decay —
  // they can only be removed by healing.
  const poison = character.getStatus('POISON');
  if (poison > 0) {
    character.takeDamageFromDeck(poison);
    spawnDamageOnTarget(character, poison);
    addLog(`  ${label} takes ${poison} Poison damage!`, Colors.GREEN);
  }
  // Ice: reduces damage dealt by stacks, decays by 1 each turn
  const ice = character.getStatus('ICE');
  if (ice > 0) {
    addLog(`  ${label} is Iced (-${ice} damage dealt)`, Colors.ICE_BLUE);
    character.removeStatus('ICE', 1);
  }
  // Shock: -1 damage dealt AND +1 damage taken per stack, decays by 1
  const shock = character.getStatus('SHOCK');
  if (shock > 0) {
    addLog(`  ${label} is Shocked (-${shock} dmg, +${shock} dmg taken)`, Colors.SHOCK_YELLOW);
    character.removeStatus('SHOCK', 1);
  }
  // Process creature status effects
  for (const c of [...character.creatures]) {
    if (c.fireStacks > 0) {
      const fireDmg = c.fireStacks;
      const actual = c.takeDamage(fireDmg); // goes through armor/shield
      if (actual > 0) spawnDamageOnTarget(c, actual);
      const absorbed = fireDmg - actual;
      const bs = absorbed > 0 ? ` (${absorbed} absorbed)` : '';
      addLog(`  ${c.name} takes ${actual} Fire damage!${bs}`, Colors.RED);
      c.fireStacks = Math.max(0, c.fireStacks - 1);
      if (!c.isAlive) { spawnDeathAnimation(c); addLog(`  ${c.name} destroyed!`, Colors.GOLD); }
    }
    if (c.poisonStacks > 0) {
      const dmg = c.poisonStacks;
      c.takeUnpreventableDamage(dmg);
      spawnDamageOnTarget(c, dmg);
      addLog(`  ${c.name} takes ${dmg} Poison damage!`, Colors.GREEN);
      // Stacks persist — only healing removes Poison. Enemies/creatures never heal, so it's permanent for them.
      if (!c.isAlive) { spawnDeathAnimation(c); addLog(`  ${c.name} destroyed!`, Colors.GOLD); }
    }
  }
  // Remove and count dead creatures (kill-count encounters rely on countAndRemoveDeadCreatures)
  countAndRemoveDeadCreatures();
}

// Get damage modifier from ice/shock for a character
function getDamageModifier(character) {
  const ice = character.getStatus('ICE') || 0;
  const shock = character.getStatus('SHOCK') || 0;
  return -(ice + shock); // negative = less damage dealt
}

function getIncomingDamageModifier(character) {
  const shock = character.getStatus('SHOCK') || 0;
  return shock; // positive = takes more damage
}

// --- Player Ally Attacks ---
function processPlayerAllyAttacks() {
  for (const ally of player.creatures) {
    if (!ally.isAlive || ally.exhausted) continue;
    // Allow 0-attack allies if they have a poisonAttack (Pet Spider).
    if ((ally.attack || 0) <= 0 && !ally.poisonAttack) continue;
    const targets = enemy.creatures.filter(c => c.isAlive);
    if (targets.length > 0) {
      const target = targets[Math.floor(Math.random() * targets.length)];
      if (ally.unpreventable) {
        target.takeUnpreventableDamage(ally.attack);
        if (ally.attack > 0) spawnDamageOnTarget(target, ally.attack);
        addLog(`  ${ally.name} attacks ${target.name} for ${ally.attack} unpreventable!`, Colors.ORANGE);
        maybeApplyAttackPoison(ally, target, ally.attack);
      } else {
        const actual = target.takeDamage(ally.attack);
        if (actual > 0) spawnDamageOnTarget(target, actual);
        addLog(`  ${ally.name} attacks ${target.name} for ${actual}!`, Colors.GREEN);
        maybeApplyAttackPoison(ally, target, actual);
      }
      if (!target.isAlive) { spawnDeathAnimation(target); addLog(`  ${target.name} destroyed!`, Colors.GOLD); }
    } else if (enemy.isAlive) {
      if (ally.unpreventable) {
        enemy.takeDamageFromDeck(ally.attack);
        if (ally.attack > 0) spawnDamageOnTarget(enemy, ally.attack);
        addLog(`  ${ally.name} attacks ${enemy.name} for ${ally.attack} unpreventable!`, Colors.ORANGE);
        triggerSplitPower(enemy);
        maybeApplyAttackPoison(ally, enemy, ally.attack);
      } else {
        const [blocked, taken] = enemy.takeDamageWithDefense(ally.attack);
        if (taken > 0) { spawnDamageOnTarget(enemy, taken); triggerSplitPower(enemy); }
        addLog(`  ${ally.name} attacks ${enemy.name} for ${taken}!`, Colors.GREEN);
        maybeApplyAttackPoison(ally, enemy, taken);
      }
    }
    ally.exhaust();
  }
  countAndRemoveDeadCreatures();
}

// --- Enemy AI ---
let enemyDamageAccumulator = 0; // total damage from enemy attacks this turn (cards + creatures)

// Enemy attack arrow animation — shows an arrow from the enemy to the target
// for ~800ms before the damage resolves. Pauses the enemy action queue.
let enemyArrow = null; // { x1, y1, x2, y2, timer, sourceCreature }
const ENEMY_ARROW_DURATION = 875; // ms

// Enemy card showcase — displays the card the enemy is playing (runs alongside the arrow)
let showcaseCard = null;
let showcaseTimer = 0;
let showcaseFadeIn = 0;
const SHOWCASE_DURATION = 875; // same as arrow so they run together
const SHOWCASE_FADE = 125;     // quick fade in/out

// Pick a random target for an enemy attack. The player counts as 2 weights and
// each living ally counts as 1, so a player with two allies has 50%/25%/25% odds.
// Returns either the player Character or a Creature ally.
// Get the screen center of a target for arrow drawing.
function getTargetCenter(target) {
  if (target === player) {
    const r = getCharacterCardRect(true);
    return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
  }
  // Must be a player creature — find its rect
  const allyRects = getPlayerCreatureRects();
  const idx = player.creatures.indexOf(target);
  if (idx !== -1 && allyRects[idx]) {
    const r = allyRects[idx];
    return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
  }
  // Fallback to player card center
  const r = getCharacterCardRect(true);
  return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
}

function getEnemyCenter() {
  const r = getCharacterCardRect(false);
  return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
}

function pickEnemyAttackTarget() {
  if (!player) return null;
  const aliveAllies = (player.creatures || []).filter(a => a.isAlive);
  const PLAYER_WEIGHT = 2;
  const totalWeight = PLAYER_WEIGHT + aliveAllies.length;
  let r = Math.random() * totalWeight;
  for (const ally of aliveAllies) {
    if (r < 1) return ally;
    r -= 1;
  }
  return player;
}

// Apply N damage from an enemy attack to an ally creature immediately.
// Logs the result and removes the creature if it dies.
function applyDamageToAlly(ally, dmg) {
  const actual = ally.takeDamage(dmg);
  if (actual > 0) spawnDamageOnTarget(ally, actual);
  const blocked = Math.max(0, dmg - actual);
  const blockedSuffix = blocked > 0 ? ` (blocked ${blocked})` : '';
  addLog(`  ${ally.name}: ${actual} damage${blockedSuffix}`, Colors.RED);
  if (!ally.isAlive) {
    spawnDeathAnimation(ally);
    addLog(`  ${ally.name} destroyed!`, Colors.GOLD);
    player.removeDeadCreatures();
  }
}

// Route incoming enemy damage to either the player (accumulated for the damage
// flow) or to a randomly picked ally (applied immediately).
// Also fires an attack arrow from the attacker to the target.
// sourceCreature: if provided, arrow originates from this creature's rect.
function routeEnemyDamage(dmg, sourceLabel, sourceCreature = null) {
  if (dmg <= 0) return;
  const target = pickEnemyAttackTarget();
  // Arrow from attacker to target
  let src;
  if (sourceCreature) {
    const creatureRects = getEnemyCreatureRects();
    const ci = enemy.creatures.indexOf(sourceCreature);
    if (ci !== -1 && creatureRects[ci]) {
      const r = creatureRects[ci];
      src = { x: r.x + r.w / 2, y: r.y + r.h / 2 };
    }
  }
  if (!src) src = getEnemyCenter();
  const dst = getTargetCenter(target);
  const arrowDur = sourceCreature ? 550 : ENEMY_ARROW_DURATION; // faster arrows for summons
  enemyArrow = { x1: src.x, y1: src.y, x2: dst.x, y2: dst.y, timer: arrowDur, sourceCreature: sourceCreature || null };
  screenFlashTimer = 150;

  if (target === player) {
    enemyDamageAccumulator += dmg;
    addLog(`  ${dmg} damage incoming`, Colors.RED);
  } else {
    applyDamageToAlly(target, dmg);
  }
}
let awaitingEnemyDamage = false; // true while the player is resolving enemy damage flow

function startEnemyTurn() {
  enemyTurnNumber++;
  addLog('--- Enemy Turn ---', Colors.RED);
  if (survivalRounds > 0) addLog(`  Round ${enemyTurnNumber}/${survivalRounds}`, Colors.GRAY);
  enemy.clearBlock();
  // Ready creatures at the start of their owner's turn — summons made last turn become available now
  for (const c of enemy.creatures) c.ready();
  enemyDamageAccumulator = 0;
  awaitingEnemyDamage = false;

  // Start-of-turn passive powers (e.g. Kobold Backup summons a guard).
  if (enemy && Array.isArray(enemy.powers)) {
    for (const power of enemy.powers) {
      if (power.id === 'kobold_backup') {
        const guard = new Creature({ name: 'Kobold Guard', attack: 2, maxHp: 1, shield: 1 });
        enemy.addCreature(guard);
        addLog(`  Kobold Backup! A new guard joins the fight.`, Colors.RED);
      }
    }
  }

  // Process status effects on enemy at start of their turn
  processStatusEffects(enemy, enemy.name);
  if (checkCombatEnd()) return;

  // Plan enemy actions — respect recharge_extra costs
  enemyActions = [];
  const hand = [...enemy.deck.hand];
  hand.sort((a, b) => (b.priority || 0) - (a.priority || 0));

  // Track how many hand cards are available to pay recharge_extra costs.
  // Each card played uses itself + any recharge_extra from the remaining pool.
  let availableForCost = hand.length; // total hand cards
  let hasAttackOrSummon = false;
  for (const card of hand) {
    if (card.cardType === CardType.DEFENSE) continue; // defense cards are reactive, not queued
    // Check recharge_extra cost
    let extraCost = 0;
    for (const eff of card.effects || []) {
      if (eff.effectType === 'recharge_extra') extraCost += eff.value;
    }
    // Need: 1 (the card itself) + extraCost from remaining hand
    if (availableForCost < 1 + extraCost) continue; // can't afford
    availableForCost -= (1 + extraCost); // reserve cards

    if (card.cardType === CardType.ATTACK) {
      enemyActions.push({ type: 'play', card, action: 'attack' });
      hasAttackOrSummon = true;
    } else if (card.cardType === CardType.CREATURE) {
      enemyActions.push({ type: 'play', card, action: 'summon' });
      hasAttackOrSummon = true;
    }
  }

  // Fallback: if no attack/summon was queued, try to use an active recharge-cost power
  // (e.g. Big Bite for the Giant Rat). The enemy must have enough cards in hand
  // (excluding any defense cards still needed for reactive defense) to pay the cost.
  if (!hasAttackOrSummon) {
    for (const power of (enemy.powers || [])) {
      if (power.isPassive) continue;
      if (power.exhausted) continue;
      if (power.rechargeCost > 0 && enemy.deck.hand.length >= power.rechargeCost) {
        enemyActions.push({ type: 'use_power', power });
        break;
      }
    }
  }

  // Queue creature attacks (staggered via the action queue so arrows show per attack)
  for (const c of enemy.creatures) {
    if (c.isAlive && !c.exhausted && c.attack > 0) {
      enemyActions.push({ type: 'creature_attack', creature: c });
    }
  }

  enemyActions.push({ type: 'end' });

  enemyActionIndex = 0;
  enemyActionTimer = 625; // ms before first action
}

function updateEnemyTurn(dt) {
  if (isPlayerTurn) return;
  if (enemyActionIndex >= enemyActions.length) return;

  // Tick arrow + showcase in parallel — pause actions while either is active
  const animating = !!(enemyArrow || showcaseTimer > 0);
  if (enemyArrow) {
    enemyArrow.timer -= dt;
    if (enemyArrow.timer <= 0) enemyArrow = null;
  }
  if (showcaseTimer > 0) {
    showcaseTimer -= dt;
    showcaseFadeIn += dt;
    if (showcaseTimer <= 0) { showcaseCard = null; showcaseTimer = 0; }
  }
  if (animating) return;

  enemyActionTimer -= dt;
  if (enemyActionTimer > 0) return;

  const action = enemyActions[enemyActionIndex];
  enemyActionIndex++;

  if (action.type === 'creature_attack') {
    enemyActionTimer = 250; // faster for summons
    const c = action.creature;
    if (c.isAlive && !c.exhausted) {
      addLog(`${c.name} attacks`, Colors.RED);
      if (c.unpreventable) {
        // Unpreventable: bypass defense flow, deal directly to deck/hand
        const target = pickEnemyAttackTarget();
        const src2 = (() => { const cr = getEnemyCreatureRects(); const ci = enemy.creatures.indexOf(c); return ci !== -1 && cr[ci] ? { x: cr[ci].x + cr[ci].w / 2, y: cr[ci].y + cr[ci].h / 2 } : getEnemyCenter(); })();
        const dst2 = getTargetCenter(target);
        enemyArrow = { x1: src2.x, y1: src2.y, x2: dst2.x, y2: dst2.y, timer: 550, sourceCreature: c };
        screenFlashTimer = 150;
        if (target === player) {
          player.takeDamageFromDeck(c.attack);
          spawnDamageOnTarget(player, c.attack, Colors.ORANGE);
          addLog(`  ${c.attack} unpreventable damage!`, Colors.ORANGE);
        } else {
          target.takeUnpreventableDamage(c.attack);
          spawnDamageOnTarget(target, c.attack, Colors.ORANGE);
          addLog(`  ${target.name}: ${c.attack} unpreventable dmg`, Colors.ORANGE);
          if (!target.isAlive) { spawnDeathAnimation(target); addLog(`  ${target.name} destroyed!`, Colors.GOLD); player.removeDeadCreatures(); }
        }
      } else {
        routeEnemyDamage(c.attack, c.name, c);
      }
      c.exhaust();
    }
    return;
  }

  enemyActionTimer = 375; // normal speed for monster cards/powers

  if (action.type === 'end') {
    finishEnemyTurn();
    return;
  }

  if (action.type === 'use_power') {
    const power = action.power;
    if (!power || power.exhausted) return;
    if (enemy.deck.hand.length < power.rechargeCost) return;
    // Pay recharge cost: take cards off the top of hand and put them in the recharge pile
    const recharged = [];
    for (let i = 0; i < power.rechargeCost; i++) {
      if (enemy.deck.hand.length === 0) break;
      const c = enemy.deck.hand.shift();
      enemy.deck.addToRechargePile(c);
      recharged.push(c);
    }
    power.use();
    addLog(`${enemy.name} uses ${power.name}`, Colors.RED, power);
    // Log each recharged card on its own line with the card attached so the
    // log entry is hoverable (matches the player-side "Draw: <card>" style).
    for (const c of recharged) {
      addLog(`  Recharge: ${c.name}`, Colors.GRAY, c);
    }
    // Resolve effect — for chunky_bite (Big Bite), deal 3 damage to a chosen target
    if (power.id === 'chunky_bite') {
      let dmg = 3 + (enemy.rage || 0) + getDamageModifier(enemy);
      dmg += getIncomingDamageModifier(player);
      dmg = Math.max(0, dmg);
      routeEnemyDamage(dmg, power.name);
    }
    return;
  }

  const card = action.card;
  // Check card is still in hand
  if (!enemy.deck.hand.includes(card)) return;

  // Pay recharge_extra cost: recharge additional cards from hand
  let extraCost = 0;
  for (const eff of card.effects || []) {
    if (eff.effectType === 'recharge_extra') extraCost += eff.value;
  }
  if (extraCost > 0 && enemy.deck.hand.length < 1 + extraCost) return; // can't afford now

  // Show the card being played in the center of the screen
  showcaseCard = card;
  showcaseTimer = SHOWCASE_DURATION;
  showcaseFadeIn = 0;

  enemy.deck.playCard(card);

  // Pay extra recharge cost from remaining hand
  if (extraCost > 0) {
    const recharged = [];
    for (let i = 0; i < extraCost; i++) {
      if (enemy.deck.hand.length === 0) break;
      const c = enemy.deck.hand.shift();
      enemy.deck.addToRechargePile(c);
      recharged.push(c.name);
    }
    if (recharged.length > 0) addLog(`  Recharge: ${recharged.join(', ')}`);
  }

  if (action.action === 'attack') {
    addLog(`${enemy.name} plays ${card.name}`, Colors.RED, card);
    for (const eff of card.currentEffects) {
      if (eff.effectType === 'damage') {
        let dmg = Math.max(0, eff.value + enemy.heroism + enemy.rage + getDamageModifier(enemy));
        dmg += getIncomingDamageModifier(player);
        dmg = Math.max(0, dmg);
        if (enemy.heroism > 0) enemy.heroism = 0;
        // Pick a target — player (accumulated) or an ally (immediate)
        routeEnemyDamage(dmg, card.name);
      } else if (eff.effectType === 'unpreventable_damage') {
        // Unpreventable damage bypasses defense flow
        player.takeDamageFromDeck(eff.value);
        spawnDamageOnTarget(player, eff.value, Colors.ORANGE);
        addLog(`  ${eff.value} true damage to you!`, Colors.ORANGE);
      }
    }
  } else if (action.action === 'defend') {
    addLog(`${enemy.name} plays ${card.name}`, Colors.RED, card);
    for (const eff of card.currentEffects) {
      if (eff.effectType === 'block') {
        enemy.addBlock(eff.value);
        addLog(`  +${eff.value} Block`, Colors.BLUE);
      }
    }
  } else if (action.action === 'summon') {
    addLog(`${enemy.name} plays ${card.name}`, Colors.RED, card);
    for (const eff of card.currentEffects) {
      if (eff.effectType === 'summon_random') {
        const count = Math.floor(Math.random() * eff.value) + 1;
        const isGuard = card.id === 'guards';
        const baseName = isGuard ? 'Kobold Guard' : 'Rat';
        let lastCreature;
        for (let i = 0; i < count; i++) {
          lastCreature = isGuard
            ? new Creature({ name: 'Kobold Guard', attack: 2, maxHp: 1, shield: 1 })
            : new Creature({ name: 'Rat', attack: 1, maxHp: 1 });
          enemy.addCreature(lastCreature);
        }
        addLog(`  ${count} ${baseName}${count > 1 ? 's' : ''} summoned`, Colors.ORANGE);
        if (lastCreature) {
          const lastEntry = combatLog[combatLog.length - 1];
          if (lastEntry) lastEntry.creature = lastCreature;
        }
      }
    }
  }

  checkCombatEnd();
}

function finishEnemyTurn() {
  // Creature attacks are now queued as 'creature_attack' actions and resolved
  // above — by the time we reach 'end', all creature attacks have already fired.

  // If any damage was accumulated, run the player damage flow once with the total.
  if (enemyDamageAccumulator > 0) {
    awaitingEnemyDamage = true;
    const total = enemyDamageAccumulator;
    enemyDamageAccumulator = 0;
    startIncomingDamage(total, 'total damage to you');
    if (state === GameState.DEFENDING || state === GameState.DAMAGE_SOURCE) {
      // Player needs to resolve — completePlayerTurnTransition() runs after.
      return;
    }
    // Damage was fully auto-mitigated → continue immediately
    awaitingEnemyDamage = false;
  }

  completePlayerTurnTransition();
}

function completePlayerTurnTransition() {
  awaitingEnemyDamage = false;

  // End-of-enemy-turn passive powers. Dire Fury: +1 Rage per turn, stacking
  // so the Dire Rat's attacks grow stronger the longer the fight drags on.
  if (enemy && Array.isArray(enemy.powers)) {
    for (const power of enemy.powers) {
      if (power.id === 'dire_fury') {
        enemy.rage = (enemy.rage || 0) + 1;
        addLog(`  ${enemy.name}'s fury grows! (R:${enemy.rage})`, Colors.RED);
      }
    }
  }

  // Enemy draws (refill its hand) for next turn
  const drawCount = enemy._drawPerTurn || enemy._handSize || 2;
  const drawn = enemy.deck.endTurn(drawCount, enemy._handSize || 10);
  if (drawn.length > 0) {
    addLog(`${enemy.name} draws ${drawn.length} card${drawn.length > 1 ? 's' : ''}`, Colors.GRAY);
  }

  addLog('--- Your Turn ---', Colors.GREEN);
  isPlayerTurn = true;
  player.clearBlock();
  player.readyPowers();
  player.readyCreatures();
  // Ready exhausted stay-in-hand cards
  for (const c of player.deck.hand) c.exhausted = false;
  attacksThisTurn = 0;

  // Process combat buffs at start of player turn
  const buffLogs = player.processCombatBuffs();
  for (const log of buffLogs) {
    addLog(log.text, log.color, log.card || null);
    if (log.healed) spawnHealOnTarget(player, log.healed);
    if (log.token) spawnTokenOnTarget(player, log.tokenAmount, log.token, log.tokenColor);
  }

  // Turn-start perk effects
  applyPerksStartOfTurn();
  checkCombatEnd();
}

// --- Victory/Defeat ---
function checkCombatEnd() {
  // Kill count victory (wolf pack, etc.)
  if (killTarget > 0 && killCount >= killTarget) {
    addLog(`VICTORY! Killed ${killCount}/${killTarget}!`, Colors.GOLD);
    combatVictory();
    return true;
  }
  // Survival victory (stone giant)
  if (survivalRounds > 0 && enemyTurnNumber >= survivalRounds) {
    addLog(`VICTORY! Survived ${survivalRounds} rounds!`, Colors.GOLD);
    combatVictory();
    return true;
  }
  // Normal victory: enemy character is dead. Surviving minions don't matter
  // (matches py game's check_enemy_defeated). Skipped if the boss is invulnerable.
  if (!enemy._invulnerable && !enemy.isAlive) {
    addLog('VICTORY!', Colors.GOLD);
    combatVictory();
    return true;
  }
  if (!player.isAlive) {
    addLog('DEFEATED!', Colors.RED);
    state = GameState.GAME_OVER;
    return true;
  }
  return false;
}

// Consume caster's poisonBuff (one attack) and apply 1 Poison stack per buff charge to target.
// Must be called after damage has been dealt (to avoid applying poison to a dead target before the death log).
// Check-and-consume the caster's Slime Jar buff before an attack resolves.
// Returns true if the buff was active (meaning the attack must be applied as unpreventable).
// Also strips the matching combatBuff from the caster.
function consumeUnpreventableBuff(caster) {
  if (!caster || !(caster.unpreventableBuff > 0)) return false;
  caster.unpreventableBuff = 0;
  if (Array.isArray(caster.combatBuffs)) {
    caster.combatBuffs = caster.combatBuffs.filter(b => b.id !== 'slime_jar_buff');
  }
  addLog(`  Slime Jar! Attack is Unpreventable`, Colors.ORANGE);
  return true;
}

function consumePoisonBuff(caster, target, damageDealt = null) {
  if (!caster || !(caster.poisonBuff > 0)) return;
  const stacks = caster.poisonBuff;
  caster.poisonBuff = 0;
  // Remove the visual buff badge (Vial of Poison) from the character
  if (Array.isArray(caster.combatBuffs)) {
    caster.combatBuffs = caster.combatBuffs.filter(b => b.id !== 'vial_poison');
  }
  if (!target) return;
  // Poison doesn't land if the attack was fully absorbed by defenses.
  if (damageDealt !== null && damageDealt <= 0) {
    addLog(`  (Vial of Poison absorbed — no Poison applied)`, Colors.GRAY);
    return;
  }
  if (target instanceof Creature) {
    target.poisonStacks = (target.poisonStacks || 0) + stacks;
  } else if (typeof target.applyStatus === 'function') {
    target.applyStatus('POISON', stacks);
  } else {
    return;
  }
  addLog(`  (Vial of Poison) +${stacks} Poison on ${target.name}`, Colors.GREEN);
}

// Trigger split power: when a character with "split" power takes damage, spawn a 1/1 Slime
function triggerSplitPower(character) {
  if (!character.powers) return;
  for (const power of character.powers) {
    if (power.id === 'split') {
      const slime = new Creature({ name: 'Slime', attack: 1, maxHp: 1, unpreventable: true });
      character.addCreature(slime);
      addLog(`  -> ${character.name} splits! Slime spawns!`, Colors.ORANGE);
      break;
    }
  }
}

function countAndRemoveDeadCreatures() {
  const deadBefore = enemy.creatures.filter(c => !c.isAlive).length;
  // Before removing dead player creatures, handle companion card flow:
  // companion's sourceCard moves from playPile → discardPile (costs HP).
  for (const c of player.creatures) {
    if (!c.isAlive && c.isCompanion && c.sourceCard && player.deck) {
      if (player.deck.playPileToDiscard(c.sourceCard)) {
        addLog(`  ${c.name}'s card goes to discard.`, Colors.RED);
      }
    }
  }
  enemy.removeDeadCreatures();
  player.removeDeadCreatures();
  if (deadBefore > 0 && killTarget > 0) {
    killCount += deadBefore;
    addLog(`  Kill count: ${killCount}/${killTarget}`, Colors.GOLD);
    // Respawn creatures for kill-count encounters
    if (killCount < killTarget && enemy._invulnerable) {
      const deficit = Math.max(0, 2 - enemy.creatures.length);
      for (let i = 0; i < deficit; i++) {
        const name = enemy.name === 'Wolf Pack' ? 'Wolf' : 'Creature';
        const atk = enemy.name === 'Wolf Pack' ? 2 : 1;
        const hp = enemy.name === 'Wolf Pack' ? 2 : 1;
        const c = new Creature({ name, attack: atk, maxHp: hp });
        c.ready();
        enemy.addCreature(c);
      }
    }
  }
}

function combatVictory() {
  const gritHeal = player.getPerkStacks('combat_end_heal');
  if (gritHeal > 0) {
    healPlayer(gritHeal);
    // Pass a perk pseudo-card so hovering the log entry shows the full
    // Grit card (mirrors how card references in the log produce previews).
    addLog(`  Grit: Healed ${gritHeal}!`, Colors.GREEN, perkToCardLike(createGritPerk()));
  }
  player.endCombatBuffCleanup();
  player.deck.endCombat(getPlayerHandSize(), MAX_HAND_SIZE);
  // Ready all powers and clear creatures for next combat
  player.readyPowers();
  player.creatures = [];
  // Clear combat-only status effects
  player.clearBlock();
  player.shield = 0;
  player.heroism = 0;
  player.rage = 0;
  player.poisonBuff = 0;
  player.unpreventableBuff = 0;
  // Reset per-combat attack counter so Sneak Attack starts fresh next fight
  attacksThisTurn = 0;
  // Clear exhausted flag on all hand cards (daggers etc.)
  for (const c of player.deck.hand) c.exhausted = false;
  state = GameState.VICTORY;
}

// --- Victory / Game Over screens ---
function drawVictory() {
  drawEncounterBg();
  ctx.fillStyle = Colors.GOLD;
  ctx.font = 'bold 64px serif';
  ctx.textAlign = 'center';
  ctx.fillText('Victory!', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 40);
  ctx.fillStyle = Colors.WHITE;
  ctx.font = '24px sans-serif';
  ctx.fillText(`You defeated ${enemy ? enemy.name : 'the enemy'}!`, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 20);
  ctx.font = '18px sans-serif';
  ctx.fillStyle = Colors.GRAY;
  ctx.fillText('Click to continue', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 60);
}

function drawGameOver() {
  ctx.fillStyle = '#1a0a0a';
  ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  ctx.fillStyle = Colors.RED;
  ctx.font = 'bold 64px serif';
  ctx.textAlign = 'center';
  ctx.fillText('Defeated', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 40);
  ctx.fillStyle = Colors.WHITE;
  ctx.font = '24px sans-serif';
  ctx.fillText('Your adventure ends here...', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 20);
  ctx.font = '18px sans-serif';
  ctx.fillStyle = Colors.GRAY;
  ctx.fillText('Click to return to menu', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 60);
}

// ============================================================
// PERK SELECT
// ============================================================

function getPerkRects() {
  const count = perkChoices.length;
  // Match the ability-select layout: same card size, same Y position (180),
  // so the level-up flow reads as a unified sequence.
  const cardW = 240;
  const cardH = 340;
  const gap = 40;
  const totalW = count * cardW + (count - 1) * gap;
  const startX = Math.round((SCREEN_WIDTH - totalW) / 2);
  const y = 180;
  return perkChoices.map((_, i) => ({
    x: startX + i * (cardW + gap), y, w: cardW, h: cardH,
  }));
}

function handlePerkSelectClick(x, y) {
  const rects = getPerkRects();
  for (let i = 0; i < rects.length; i++) {
    if (hitTest(x, y, rects[i])) {
      const perk = perkChoices[i];
      player.perks.push(perk);
      addLog(`Perk gained: ${perk.name}!`, Colors.GOLD);
      // First rest ever: show the deck-balancing tutorial before handing
      // the player the inventory. Later rests skip straight to rebalancing.
      if (!shownDeckTutorial) {
        state = GameState.DECK_TUTORIAL;
      } else {
        restMode = true;
        state = GameState.INVENTORY;
      }
      return;
    }
  }
}

function drawPerkSelect() {
  // Background: use the leaving-prison / chapter-end art when available,
  // matching the ability-select screen that precedes this.
  const bg = getEncounterBgImage('bg_leaving_prison');
  if (bg) {
    ctx.drawImage(bg, 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  } else {
    ctx.fillStyle = '#0e0e14';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  }

  ctx.fillStyle = Colors.GOLD;
  ctx.font = 'bold 36px serif';
  ctx.textAlign = 'center';
  ctx.fillText('Choose a Perk', SCREEN_WIDTH / 2, 80);

  ctx.fillStyle = Colors.WHITE;
  ctx.font = '18px sans-serif';
  ctx.fillText('Perks are permanent and stack!', SCREEN_WIDTH / 2, 120);

  // Render each perk choice as a real framed card (same pseudo-card
  // adapter the codex uses) so the art, frame, and description badge
  // all display consistently.
  const rects = getPerkRects();
  for (let i = 0; i < perkChoices.length; i++) {
    const perk = perkChoices[i];
    const r = rects[i];
    const hov = hitTest(mouseX, mouseY, r);
    const pseudoCard = perkToCardLike(perk);
    drawCard(pseudoCard, r.x, r.y, r.w, r.h, false, hov, 'full');
    drawPerkCardOverlay(perk, r.x, r.y, r.w, r.h, true);

    // Stack count badge below the card
    const stacks = player.perks.filter(p => p.id === perk.id).length;
    if (stacks > 0) {
      ctx.fillStyle = Colors.GREEN;
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`(You have ${stacks})`, r.x + r.w / 2, r.y + r.h + 18);
    }

    if (hov) {
      ctx.fillStyle = Colors.GOLD;
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Click to select', r.x + r.w / 2, r.y + r.h + (stacks > 0 ? 36 : 18));
    }
  }
  ctx.textAlign = 'left';
}

// ============================================================
// MODAL SELECT
// ============================================================

// Build a synthetic Card object representing a single mode of a modal card.
// Uses the parent card's id (so the art lookup matches) and the mode's name+effects.
function buildModeCard(parent, mode) {
  const c = parent.copy();
  c.id = parent.id;          // keep the same art
  c.name = mode.description; // mode label as the card name
  c.description = mode.description;
  c.shortDesc = mode.description;
  c.effects = mode.effects;
  c.upgradeEffects = null;
  c.modes = null;            // not modal anymore
  return c;
}

let modalChoiceRects = [];
let modalCancelRect = null;

function getModalChoiceCardSize() {
  return { w: 240, h: 336 };
}

function layoutModalChoiceRects() {
  if (!modalCard || !modalCard.modes) return [];
  const { w: cw, h: ch } = getModalChoiceCardSize();
  const gap = 40;
  const count = modalCard.modes.length;
  const totalW = count * cw + (count - 1) * gap;
  const startX = Math.floor((SCREEN_WIDTH - totalW) / 2);
  const cardY = 200;
  return modalCard.modes.map((m, i) => ({
    x: startX + i * (cw + gap),
    y: cardY,
    w: cw,
    h: ch,
    mode: m,
    index: i,
  }));
}

function handleModalSelectClick(x, y) {
  // Card choices
  for (const r of modalChoiceRects) {
    if (hitTest(x, y, r)) {
      const chosen = r.mode;
      const handIndex = player.deck.hand.indexOf(modalCard);
      if (handIndex === -1) {
        modalCard = null;
        state = GameState.COMBAT;
        return;
      }
      // If the chosen mode needs a target, enter TARGETING instead of resolving now
      const needsSingleTarget = chosen.effects.some(e =>
        e.target === TargetType.SINGLE_ENEMY &&
        (e.effectType === 'damage' || e.effectType === 'apply_poison' ||
         e.effectType === 'armor_bonus_damage' || e.effectType === 'unpreventable_damage' ||
         e.effectType === 'sneak_attack' || e.effectType === 'charge_attack')
      );
      if (needsSingleTarget) {
        // Store mode on the card so the targeting handler knows which effects to use
        modalCard._chosenMode = chosen;
        selectedCardIndex = handIndex;
        modalChoiceRects = [];
        modalCancelRect = null;
        state = GameState.TARGETING;
        showStickyToast('Click an enemy target');
        return;
      }
      // No target needed — resolve immediately
      const card = modalCard;
      player.deck.hand.splice(handIndex, 1);
      addLog(`You play ${card.name}`, Colors.GREEN, card);
      addLog(`  Mode: ${chosen.description}`);
      for (const eff of chosen.effects) {
        resolveEffect(eff, player, enemy);
      }
      player.deck.placeByCost(card);

      modalCard = null;
      modalTarget = null;
      selectedCardIndex = -1;
      modalChoiceRects = [];
      modalCancelRect = null;
      state = GameState.COMBAT;
      checkCombatEnd();
      return;
    }
  }
  // Cancel button
  if (modalCancelRect && hitTest(x, y, modalCancelRect)) {
    cancelModalSelect();
  }
}

function cancelModalSelect() {
  modalCard = null;
  modalTarget = null;
  selectedCardIndex = -1;
  modalChoiceRects = [];
  modalCancelRect = null;
  state = GameState.COMBAT;
}

// === SCRY SELECT ===
function handleScrySelectClick(x, y) {
  if (scryCards.length === 0) return;
  const rects = layoutScryCardRects();
  for (let i = 0; i < rects.length; i++) {
    if (hitTest(x, y, rects[i])) {
      const picked = scryCards[i];
      player.deck.hand.push(picked);
      addLog(`  Draw: ${picked.name}`, Colors.BLUE, picked);
      // Recharge the rest
      for (let j = 0; j < scryCards.length; j++) {
        if (j !== i) {
          player.deck.addToRechargePile(scryCards[j]);
          addLog(`  Recharged: ${scryCards[j].name}`, Colors.GRAY, scryCards[j]);
        }
      }
      scryCards = [];
      hideToast();
      state = GameState.COMBAT;
      return;
    }
  }
}

function layoutScryCardRects() {
  const cardW = 240, cardH = 336, gap = 40;
  const totalW = scryCards.length * cardW + (scryCards.length - 1) * gap;
  const startX = Math.floor((SCREEN_WIDTH - totalW) / 2);
  const y = 200; // same as modal/wrath/feral form
  return scryCards.map((_, i) => ({
    x: startX + i * (cardW + gap), y, w: cardW, h: cardH,
  }));
}

function drawScryOverlay() {
  if (scryCards.length === 0) return;
  ctx.fillStyle = 'rgba(0,0,0,0.78)';
  ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

  const rects = layoutScryCardRects();
  for (let i = 0; i < scryCards.length; i++) {
    const r = rects[i];
    const hov = hitTest(mouseX, mouseY, r);
    if (hov) {
      ctx.strokeStyle = Colors.GOLD;
      ctx.lineWidth = 4;
      ctx.strokeRect(r.x - 4, r.y - 4, r.w + 8, r.h + 8);
    }
    drawCard(scryCards[i], r.x, r.y, r.w, r.h, false, false, 'full');
  }
}

function drawModalOverlay() {
  if (!modalCard || !modalCard.modes) return;

  // Dark overlay (matches POWER_CHOICE)
  ctx.fillStyle = 'rgba(0,0,0,0.78)';
  ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

  // Title
  ctx.fillStyle = Colors.GOLD;
  ctx.font = 'bold 32px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${modalCard.name}: Choose an effect`, SCREEN_WIDTH / 2, 110);

  // Compute and draw the mode choice cards (full-size, side by side)
  modalChoiceRects = layoutModalChoiceRects();
  for (const r of modalChoiceRects) {
    const hov = hitTest(mouseX, mouseY, r);
    if (hov) {
      ctx.strokeStyle = Colors.GOLD;
      ctx.lineWidth = 4;
      ctx.strokeRect(r.x - 4, r.y - 4, r.w + 8, r.h + 8);
    }
    const synth = buildModeCard(modalCard, r.mode);
    drawCard(synth, r.x, r.y, r.w, r.h, false, false, 'full');
  }

  // Cancel (Esc) button — red, below
  const cw = 220, ch = 50;
  const cx = Math.floor((SCREEN_WIDTH - cw) / 2);
  const firstRect = modalChoiceRects[0];
  const cy = (firstRect ? firstRect.y + firstRect.h : 500) + 30;
  modalCancelRect = { x: cx, y: cy, w: cw, h: ch };
  const cancelHov = hitTest(mouseX, mouseY, modalCancelRect);
  ctx.fillStyle = cancelHov ? '#642828' : '#3c1818';
  ctx.fillRect(cx, cy, cw, ch);
  ctx.strokeStyle = Colors.RED;
  ctx.lineWidth = 2;
  ctx.strokeRect(cx, cy, cw, ch);
  ctx.fillStyle = Colors.RED;
  ctx.font = 'bold 22px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Cancel (Esc)', cx + cw / 2, cy + ch / 2);
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
}

// ============================================================
// SHOP
// ============================================================

const SHOP_INVENTORIES = {
  general_store: [
    { creator: createTravelRations, price: 30 },
    { creator: createBandages, price: 40 },
    { creator: createTravelersClothing, price: 50 },
    { creator: createTorch, price: 60 },
    { creator: createSack, price: 40 },
    { creator: createSmallPouch, price: 30 },
  ],
  weaponsmith: [
    { creator: createSteelDagger, price: 80 },
    { creator: createSteelSword, price: 100 },
    { creator: createSteelAxe, price: 100 },
    { creator: createSteelMace, price: 100 },
    { creator: createSteelGreataxe, price: 120 },
    { creator: createBow, price: 100 },
    { creator: createGreatclub, price: 80 },
    { creator: createQuarterstaff, price: 80 },
  ],
  armorsmith: [
    { creator: createCrackedBuckler, price: 40 },
    { creator: createStuddedLeatherArmor, price: 100 },
    { creator: createRingMail, price: 120 },
  ],
  arcane_emporium: [
    { creator: createScrollOfPotency, price: 80 },
    { creator: createMinorHealingPotion, price: 60 },
    { creator: createWandOfFire, price: 200 },
  ],
  city_square: [
    { creator: createChickenLeg, price: 30 },
    { creator: createAle, price: 40 },
  ],
  dwarven_tavern: [
    { creator: createDwarvenBrew, price: 80 },
    { creator: createAle, price: 40 },
    { creator: createChickenLeg, price: 30 },
    { creator: createTravelRations, price: 30 },
  ],
  dwarven_smithy: [
    { creator: createDwarvenCrossbow, price: 150 },
    { creator: createDwarvenTowerShield, price: 120 },
    { creator: createDwarvenGreaves, price: 100 },
    { creator: createWhiteWolfCloak, price: 120 },
  ],
};

function openShop(shopId, name) {
  shopName = name;
  const inventory = SHOP_INVENTORIES[shopId] || [];
  shopCards = inventory.map(item => ({
    card: item.creator(),
    price: item.price,
    creator: item.creator,
  }));
  shopScrollY = 0;
  state = GameState.SHOP;
}

function getShopCardRects() {
  const cardW = 110;
  const cardH = 155;
  const gap = 12;
  const cols = 6;
  const startX = 50;
  const startY = 130;
  return shopCards.map((_, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    return {
      x: startX + col * (cardW + gap),
      y: startY + row * (cardH + 40) - shopScrollY,
      w: cardW, h: cardH, index: i,
    };
  });
}

function handleShopClick(x, y) {
  // Back button
  const backBtn = { x: SCREEN_WIDTH - 180, y: SCREEN_HEIGHT - 70, w: 150, h: 50 };
  if (hitTest(x, y, backBtn)) {
    state = GameState.MAP;
    return;
  }

  // Shop cards
  const rects = getShopCardRects();
  for (const r of rects) {
    if (hitTest(x, y, r)) {
      const item = shopCards[r.index];
      if (gold >= item.price) {
        gold -= item.price;
        const newCard = item.creator();
        backpack.push(newCard);
        addLog(`Bought ${newCard.name} for ${item.price} gold.`, Colors.GOLD);
      } else {
        addLog(`Not enough gold! Need ${item.price}, have ${gold}.`, Colors.RED);
      }
      return;
    }
  }
}

function drawShop() {
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

  ctx.fillStyle = Colors.GOLD;
  ctx.font = 'bold 32px serif';
  ctx.textAlign = 'center';
  ctx.fillText(shopName, SCREEN_WIDTH / 2, 50);

  ctx.fillStyle = Colors.WHITE;
  ctx.font = '18px sans-serif';
  ctx.fillText(`Gold: ${gold}  |  Backpack: ${backpack.length} cards`, SCREEN_WIDTH / 2, 85);

  // Shop cards
  const rects = getShopCardRects();
  for (let i = 0; i < shopCards.length; i++) {
    const item = shopCards[i];
    const r = rects[i];
    if (r.y + r.h < 100 || r.y > SCREEN_HEIGHT - 80) continue; // clip offscreen
    const hov = hitTest(mouseX, mouseY, r);
    const canAfford = gold >= item.price;

    drawCard(item.card, r.x, r.y, r.w, r.h, false, hov);

    // Price tag
    ctx.fillStyle = canAfford ? 'rgba(0,100,0,0.8)' : 'rgba(100,0,0,0.8)';
    ctx.fillRect(r.x, r.y + r.h, r.w, 28);
    ctx.fillStyle = canAfford ? Colors.GOLD : Colors.RED;
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${item.price}g`, r.x + r.w / 2, r.y + r.h + 18);

    if (!canAfford) {
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = '#000';
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.globalAlpha = 1;
    }
  }

  // Back button
  const backBtn = { x: SCREEN_WIDTH - 180, y: SCREEN_HEIGHT - 70, w: 150, h: 50 };
  const backHov = hitTest(mouseX, mouseY, backBtn);
  ctx.fillStyle = backHov ? '#4a3a6e' : '#2a1a4e';
  ctx.fillRect(backBtn.x, backBtn.y, backBtn.w, backBtn.h);
  ctx.strokeStyle = backHov ? Colors.GOLD : Colors.GRAY;
  ctx.lineWidth = 2;
  ctx.strokeRect(backBtn.x, backBtn.y, backBtn.w, backBtn.h);
  ctx.fillStyle = Colors.WHITE;
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Leave Shop', backBtn.x + backBtn.w / 2, backBtn.y + backBtn.h / 2);
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';

  // Shop tooltip
  for (let i = 0; i < shopCards.length; i++) {
    const r = rects[i];
    if (r.y + r.h < 100 || r.y > SCREEN_HEIGHT - 80) continue;
    if (hitTest(mouseX, mouseY, r)) {
      drawTooltipBox(shopCards[i].card, r.x + r.w + 10, r.y);
      break;
    }
  }
}

// ============================================================
// INVENTORY
// ============================================================

// === Inventory layout (3 sections: Deck | Backpack | Character) ===
const INV_TOP_Y = 95;
const INV_BOTTOM_Y = SCREEN_HEIGHT;
const INV_CHAR_W = 280;

function getInvSections() {
  const charX = SCREEN_WIDTH - INV_CHAR_W;
  const remaining = SCREEN_WIDTH - INV_CHAR_W;
  const deckW = Math.floor(remaining / 2);
  const bpW = remaining - deckW;
  return {
    deck: { x: 0, y: INV_TOP_Y, w: deckW, h: INV_BOTTOM_Y - INV_TOP_Y },
    backpack: { x: deckW, y: INV_TOP_Y, w: bpW, h: INV_BOTTOM_Y - INV_TOP_Y },
    character: { x: charX, y: INV_TOP_Y, w: INV_CHAR_W, h: INV_BOTTOM_Y - INV_TOP_Y },
  };
}

// Categorize a card into a filter type
function getCardFilterType(card) {
  const sub = (card.subtype || '').toLowerCase();
  const type = (card.cardType || '').toUpperCase();
  if (sub === 'relic') return 'Relics';
  if (type === 'CREATURE' || sub === 'ally' || sub === 'companion') return 'Allies';
  // Armor/weapon subtypes MUST be checked before cardType === 'ABILITY' so
  // cards like Cracked Buckler (subtype='light_armor', cardType='ABILITY')
  // land in Armor rather than Abilities.
  if (sub.includes('armor') || sub === 'shield' || sub === 'clothing') return 'Armor';
  if (sub.includes('martial') || sub === 'weapon' || sub === 'simple' || sub.includes('2h') || sub === 'staff' || sub === 'wand' || sub === 'ranged') return 'Weapons';
  if (type === 'ABILITY' || sub === 'ability') return 'Abilities';
  if (sub === 'item' || sub === 'potion' || sub === 'food' || sub === 'scroll') return 'Items';
  if (type === 'ATTACK') return 'Weapons';
  if (type === 'DEFENSE') return 'Armor';
  return 'Items';
}

// Filter cards by active filter set
function filterCards(cards, filters) {
  if (filters.has('All')) return cards;
  return cards.filter((c, i) => filters.has(getCardFilterType(c)));
}

// Group cards by name for stacking display. Returns [{card, count, indices}]
function groupCardsByName(cards) {
  const groups = [];
  const seen = {};
  for (let i = 0; i < cards.length; i++) {
    const name = cards[i].name;
    if (seen[name] !== undefined) {
      groups[seen[name]].count++;
      groups[seen[name]].indices.push(i);
    } else {
      seen[name] = groups.length;
      groups.push({ card: cards[i], count: 1, indices: [i] });
    }
  }
  return groups;
}

function getStackedCardRects(section, groups, scrollY) {
  const cardW = 96, cardH = 134, gap = 10, cols = 4;
  const startX = section.x + 20;
  const startY = section.y + 50 - scrollY;
  return groups.map((g, i) => ({
    x: startX + (i % cols) * (cardW + gap),
    y: startY + Math.floor(i / cols) * (cardH + 12),
    w: cardW, h: cardH, group: g,
  }));
}

function getDeckCardRects() {
  const s = getInvSections();
  const filtered = filterCards(player.deck.masterDeck, invDeckFilters);
  const groups = groupCardsByName(filtered);
  return getStackedCardRects(s.deck, groups, inventoryScrollY);
}

function getBackpackCardRects() {
  const s = getInvSections();
  let filtered = filterCards(backpack, invBpFilters);
  if (invBpEquipFilter) filtered = filtered.filter(c => canClassEquip(c));
  const groups = groupCardsByName(filtered);
  return getStackedCardRects(s.backpack, groups, inventoryScrollY);
}

// Validate the equipped deck before allowing rest exit. Returns an error
// string or '' if valid. Lenient rule: if total available cards in a
// category (deck + backpack) are fewer than the max, allow the shortfall.
function validateRestDeck() {
  // 1. Level-up bonus must be assigned (only during level-up rest).
  if (pendingChapter2Transition && !_restBonusCat) {
    return 'Assign your +1 deck limit bonus first.';
  }
  // 2. No invalid card types equipped.
  for (const card of player.deck.masterDeck) {
    if (!canClassEquip(card)) {
      return `${card.name} cannot be equipped by ${selectedClass}. Move it to backpack.`;
    }
  }
  // 3. Category counts within limits.
  const baseLimits = CLASS_DECK_LIMITS[selectedClass] || {};
  const bonuses = player.deckLimitBonuses || {};
  for (const cat of DECK_LIMIT_CATEGORIES) {
    const max = (baseLimits[cat.id] || 0) + (bonuses[cat.id] || 0);
    const inDeck = player.deck.masterDeck.filter(c => cat.subtypes.has((c.subtype || '').toLowerCase())).length;
    if (inDeck > max) {
      return `Too many ${cat.label} (${inDeck}/${max}). Move some to backpack.`;
    }
    // Under-limit check: if the player has cards in the backpack that
    // could fill this category, they MUST equip them (can't rest with
    // 6/7 weapons when a weapon sits in the backpack). Only allow the
    // shortfall when backpack genuinely has nothing to offer.
    if (inDeck < max) {
      const inBackpack = backpack.filter(c => {
        const sub = (c.subtype || '').toLowerCase();
        return cat.subtypes.has(sub) && canClassEquip(c);
      }).length;
      if (inBackpack > 0) {
        const canFill = Math.min(max - inDeck, inBackpack);
        return `${cat.label}: ${inDeck}/${max} — you have ${inBackpack} in backpack. Equip ${canFill} more.`;
      }
    }
  }
  return '';
}

function exitInventory() {
  if (restMode) {
    // Validate before applying (skipped in debug mode so the developer
    // can freely test any deck configuration).
    if (!debugMode) {
      const err = validateRestDeck();
      if (err) {
        _restErrorMsg = err;
        _restErrorTimer = 4000;
        return; // block exit
      }
    }
    // Rebalance: merge everything back, heal all damage, shuffle, draw fresh hand
    player.deck.rebalance(getPlayerHandSize(), MAX_HAND_SIZE);
    restMode = false;
    _restBonusCat = null;
    _restErrorMsg = '';
    // Chapter 2 transition — the leave-prison flow funnels through here
    // after the level-up / perk / deck-tutorial / rest inventory sequence.
    // Now we finally fade out to Chapter 2 and load the mountain path map.
    if (pendingChapter2Transition) {
      pendingChapter2Transition = false;
      showTitleCard('Chapter 2: The Mountain Path', 'Freedom at last...', () => {
        currentMap = createMountainPathMap();
        visitedNodes = new Set();
        startNodeEncounter('mountain_camp');
      });
      return;
    }
    if (currentEncounter && !currentEncounter.isComplete) {
      currentEncounter.advancePhase();
      advanceEncounterPhase();
    } else {
      state = GameState.MAP;
    }
  } else {
    state = previousState || GameState.MAP;
  }
}

function handleInventoryClick(x, y) {
  const sections = getInvSections();

  // Apply Rest / Done button (bottom of character panel)
  if (restMode) {
    const doneBtnW = sections.character.w - 40;
    const doneBtnH = 50;
    const doneBtnX = sections.character.x + 20;
    const doneBtnY = sections.character.y + sections.character.h - doneBtnH - 12;
    if (hitTest(x, y, { x: doneBtnX, y: doneBtnY, w: doneBtnW, h: doneBtnH })) {
      exitInventory();
      return;
    }
  }

  // Click portrait to show full character splash
  if (characterSplashCharacter) {
    characterSplashCharacter = null;
    return;
  }
  const charCardRect = { x: sections.character.x + 12, y: sections.character.y + 50, w: 160, h: Math.round(160 * (COMBAT_CHAR_H / COMBAT_CHAR_W)) };
  if (hitTest(x, y, charCardRect)) {
    characterSplashCharacter = player;
    characterSplashIsPlayer = true;
    return;
  }

  // Filter tab clicks (always available, not just rest mode)
  if (handleFilterTabClick(sections.deck, invDeckFilters, x, y)) return;
  if (handleFilterTabClick(sections.backpack, invBpFilters, x, y, true)) return;

  // Deck-limit +/- buttons (rest-mode level-up bonus assignment)
  for (const b of _deckLimitBtnRects) {
    if (hitTest(x, y, b)) {
      if (b.kind === 'plus') {
        _restBonusCat = b.catId;
        player.deckLimitBonuses[b.catId] = (player.deckLimitBonuses[b.catId] || 0) + 1;
        addLog(`+1 ${b.catId} limit`, Colors.GREEN);
      } else if (b.kind === 'minus') {
        player.deckLimitBonuses[b.catId] = Math.max(0, (player.deckLimitBonuses[b.catId] || 0) - 1);
        _restBonusCat = null;
      } else if (b.kind === 'debug_rest') {
        restMode = true;
      }
      return;
    }
  }

  // Equip/unequip only allowed in rest mode
  if (!restMode) return;

  // Click backpack cards to equip (move one from the stack to deck).
  // IMPORTANT: r.group.card is the REFERENCE to the actual card object,
  // so we find it by identity (===) in the full array. The old approach
  // used r.group.indices[0] which indexed into the FILTERED array —
  // wrong when a filter was active, causing misidentified splices.
  const bpRects = getBackpackCardRects();
  for (const r of bpRects) {
    if (r.y + r.h < sections.backpack.y || r.y > sections.backpack.y + sections.backpack.h - 60) continue;
    if (hitTest(x, y, r)) {
      const target = r.group.card;
      const idx = backpack.indexOf(target);
      if (idx !== -1) {
        backpack.splice(idx, 1);
        player.deck.addCard(target);
        addLog(`Equipped: ${target.name}`, Colors.GREEN);
      }
      return;
    }
  }

  // Click deck cards to unequip (move one from the stack to backpack).
  const deckRects = getDeckCardRects();
  for (const r of deckRects) {
    if (r.y + r.h < sections.deck.y || r.y > sections.deck.y + sections.deck.h - 60) continue;
    if (hitTest(x, y, r)) {
      if (player.deck.masterDeck.length > 5) {
        const target = r.group.card;
        const idx = player.deck.masterDeck.indexOf(target);
        if (idx !== -1) {
          player.deck.masterDeck.splice(idx, 1);
          backpack.push(target);
          addLog(`Unequipped: ${target.name}`, Colors.GRAY);
        }
      }
      return;
    }
  }
}

function drawFilterTabs(section, filters, showEquipFilter = false) {
  const tabY = section.y + 30;
  const tabH = 24; // was 18 — more breathing room
  ctx.font = 'bold 13px sans-serif'; // was 10 — easier to read
  let tx = section.x + 6;
  for (const type of INV_FILTER_TYPES) {
    const tw = ctx.measureText(type).width + 10;
    const active = filters.has(type);
    const hov = hitTest(mouseX, mouseY, { x: tx, y: tabY, w: tw, h: tabH });
    ctx.fillStyle = active ? (hov ? 'rgba(255,215,0,0.3)' : 'rgba(255,215,0,0.15)') : (hov ? 'rgba(255,255,255,0.1)' : 'transparent');
    ctx.fillRect(tx, tabY, tw, tabH);
    ctx.fillStyle = active ? Colors.GOLD : '#777';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(type, tx + tw / 2, tabY + tabH / 2);
    tx += tw + 2;
  }
  // Equip? filter (backpack only, after a small gap)
  if (showEquipFilter) {
    tx += 6;
    const label = 'Equip?';
    const tw = ctx.measureText(label).width + 10;
    const active = invBpEquipFilter;
    const hov = hitTest(mouseX, mouseY, { x: tx, y: tabY, w: tw, h: tabH });
    ctx.fillStyle = active ? (hov ? 'rgba(100,200,100,0.35)' : 'rgba(100,200,100,0.2)') : (hov ? 'rgba(255,255,255,0.1)' : 'transparent');
    ctx.fillRect(tx, tabY, tw, tabH);
    ctx.fillStyle = active ? Colors.GREEN : '#777';
    ctx.fillText(label, tx + tw / 2, tabY + tabH / 2);
  }
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
}

function handleFilterTabClick(section, filters, x, y, hasEquipFilter = false) {
  const tabY = section.y + 30;
  const tabH = 24; // keep in sync with drawFilterTabs
  ctx.font = 'bold 13px sans-serif';
  let tx = section.x + 6;
  for (const type of INV_FILTER_TYPES) {
    const tw = ctx.measureText(type).width + 10;
    if (hitTest(x, y, { x: tx, y: tabY, w: tw, h: tabH })) {
      if (type === 'All') {
        if (filters.has('All')) {
          filters.clear();
        } else {
          for (const t of INV_FILTER_TYPES) filters.add(t);
        }
      } else {
        filters.delete('All');
        if (filters.has(type)) filters.delete(type);
        else filters.add(type);
        if (INV_FILTER_TYPES.slice(1).every(t => filters.has(t))) {
          filters.add('All');
        }
      }
      inventoryScrollY = 0;
      return true;
    }
    tx += tw + 2;
  }
  // Equip? button
  if (hasEquipFilter) {
    tx += 6;
    const label = 'Equip?';
    const tw = ctx.measureText(label).width + 10;
    if (hitTest(x, y, { x: tx, y: tabY, w: tw, h: tabH })) {
      invBpEquipFilter = !invBpEquipFilter;
      inventoryScrollY = 0;
      return true;
    }
  }
  return false;
}

function drawInventory() {
  _deckLimitBtnRects = []; // cleared each frame, rebuilt by drawInventoryCharacter
  // Background: backpack image scaled to cover the screen
  const bg = images.backpack_bg;
  if (bg) {
    const imgAspect = bg.width / bg.height;
    const screenAspect = SCREEN_WIDTH / SCREEN_HEIGHT;
    let sw = bg.width, sh = bg.height, sx = 0, sy = 0;
    if (imgAspect > screenAspect) {
      sw = bg.height * screenAspect;
      sx = (bg.width - sw) / 2;
    } else {
      sh = bg.width / screenAspect;
      sy = (bg.height - sh) / 2;
    }
    ctx.drawImage(bg, sx, sy, sw, sh, 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    // Darken for readability (matches py game)
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  } else {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  }

  // Outer gold border
  ctx.strokeStyle = Colors.GOLD;
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

  // Title (top center)
  ctx.shadowColor = 'rgba(0,0,0,0.9)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = Colors.GOLD;
  ctx.font = 'bold 38px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(restMode ? 'Rest — Rebalance Your Deck' : 'Inventory', SCREEN_WIDTH / 2, 50);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Stats line
  ctx.fillStyle = '#ddd';
  ctx.font = '14px sans-serif';
  ctx.fillText(`Gold: ${gold}  |  Deck: ${player.deck.masterDeck.length} cards  |  Backpack: ${backpack.length} cards`, SCREEN_WIDTH / 2, 78);

  const sections = getInvSections();

  // Section borders
  ctx.strokeStyle = Colors.GOLD;
  ctx.lineWidth = 2;
  ctx.strokeRect(sections.deck.x, sections.deck.y, sections.deck.w, sections.deck.h);
  ctx.strokeRect(sections.backpack.x, sections.backpack.y, sections.backpack.w, sections.backpack.h);
  ctx.strokeRect(sections.character.x, sections.character.y, sections.character.w, sections.character.h);

  // Section headers
  ctx.fillStyle = Colors.GOLD;
  ctx.font = 'bold 18px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(`Equipped Cards (${player.deck.masterDeck.length})`, sections.deck.x + sections.deck.w / 2, sections.deck.y + 25);
  ctx.fillText(`Cards in Backpack (${backpack.length})`, sections.backpack.x + sections.backpack.w / 2, sections.backpack.y + 25);
  ctx.fillText('Character', sections.character.x + sections.character.w / 2, sections.character.y + 25);

  // Filter tabs for equipped cards
  drawFilterTabs(sections.deck, invDeckFilters);
  drawFilterTabs(sections.backpack, invBpFilters, true);

  // Track hovered card for the full-card cursor preview. Clear all three
  // hover channels — including creature, which would otherwise carry the
  // last combat's creature hover into the inventory overlay (every card
  // hovering as a rat/spider/etc.).
  hoveredCardPreview = null;
  hoveredPowerPreview = null;
  hoveredCreaturePreview = null;

  // --- Draw a stacked card section with scrollbar ---
  function drawCardSection(section, rects, label) {
    const clipY = section.y + 50;
    const clipH = section.h - 60;
    ctx.save();
    ctx.beginPath();
    ctx.rect(section.x + 4, clipY, section.w - 8, clipH);
    ctx.clip();
    for (const r of rects) {
      if (r.y + r.h < clipY || r.y > clipY + clipH) continue;
      const hov = hitTest(mouseX, mouseY, r);
      drawCard(r.group.card, r.x, r.y, r.w, r.h, false, hov);
      // Red border on cards that can't be equipped by the current class
      // (only shown in rest mode so the player knows what to unequip).
      if (restMode && label === 'deck' && !canClassEquip(r.group.card)) {
        ctx.save();
        ctx.strokeStyle = '#ff3333';
        ctx.lineWidth = 2;
        ctx.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
        ctx.restore();
      }
      // Stack count badge
      if (r.group.count > 1) {
        const bx = r.x + r.w - 24, by = r.y + 2;
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(bx, by, 24, 20);
        ctx.strokeStyle = Colors.GOLD;
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, by, 24, 20);
        ctx.fillStyle = Colors.GOLD;
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`x${r.group.count}`, bx + 12, by + 15);
        ctx.textAlign = 'left';
      }
      if (hov && r.y >= clipY && r.y + r.h <= clipY + clipH) {
        hoveredCardPreview = r.group.card;
      }
    }
    ctx.restore();
    // Scrollbar
    if (rects.length > 0) {
      const lastR = rects[rects.length - 1];
      const contentH = (lastR.y + lastR.h + inventoryScrollY) - (section.y + 50);
      if (contentH > clipH) {
        const sbX = section.x + section.w - 10;
        const sbH = Math.max(20, clipH * (clipH / contentH));
        const sbY = clipY + (inventoryScrollY / (contentH - clipH)) * (clipH - sbH);
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(sbX, clipY, 6, clipH);
        ctx.fillStyle = 'rgba(255,215,0,0.5)';
        ctx.fillRect(sbX, sbY, 6, sbH);
      }
    }
  }

  const deckRects = getDeckCardRects();
  drawCardSection(sections.deck, deckRects, 'deck');

  const bpRects = getBackpackCardRects();
  drawCardSection(sections.backpack, bpRects, 'backpack');

  // --- Character section: portrait + class info ---
  drawInventoryCharacter(sections.character);

  if (restMode) {
    const doneBtnW = sections.character.w - 40;
    const doneBtnH = 50;
    const doneBtnX = sections.character.x + 20;
    const doneBtnY = sections.character.y + sections.character.h - doneBtnH - 12;
    // Error message above button (fades out after 4 seconds).
    if (_restErrorMsg && _restErrorTimer > 0) {
      const alpha = Math.min(1, _restErrorTimer / 400);
      // Red background strip for visibility
      ctx.fillStyle = `rgba(80, 20, 20, ${alpha * 0.85})`;
      const errBoxY = doneBtnY - 40;
      ctx.fillRect(doneBtnX, errBoxY, doneBtnW, 34);
      ctx.strokeStyle = `rgba(255, 80, 80, ${alpha})`;
      ctx.lineWidth = 1;
      ctx.strokeRect(doneBtnX, errBoxY, doneBtnW, 34);
      ctx.fillStyle = `rgba(255, 100, 100, ${alpha})`;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const lines = wrapTextLong(_restErrorMsg, doneBtnW - 12, 11);
      let ey = errBoxY + 17 - (lines.length - 1) * 7;
      for (const l of lines) { ctx.fillText(l, doneBtnX + doneBtnW / 2, ey); ey += 14; }
      ctx.textBaseline = 'alphabetic';
    } else {
      // "Click Cards to equip/unequip" hint
      ctx.fillStyle = '#bbb';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Click cards to equip / unequip', doneBtnX + doneBtnW / 2, doneBtnY - 10);
    }
    ctx.textAlign = 'left';
    // Gentle pulsing glow so the button is impossible to miss during rest.
    const pulse = 0.15 + 0.12 * Math.sin(performance.now() / 400);
    ctx.save();
    ctx.shadowColor = Colors.GOLD;
    ctx.shadowBlur = 12 + 6 * Math.sin(performance.now() / 400);
    drawStyledButton(doneBtnX, doneBtnY, doneBtnW, doneBtnH, 'Apply Rest', exitInventory, 'large', 22);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = pulse;
    ctx.fillStyle = Colors.GOLD;
    ctx.fillRect(doneBtnX, doneBtnY, doneBtnW, doneBtnH);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
  } else {
    ctx.fillStyle = Colors.GOLD;
    ctx.font = '14px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('Press I or ESC to Close', sections.character.x + sections.character.w / 2, sections.character.y + sections.character.h - 18);
    ctx.textAlign = 'left';
  }

  // Full card hover preview (follows cursor, same as combat)
  drawHoverPreview();

  // Character splash overlay (click portrait to show)
  if (characterSplashCharacter) drawCharacterSplash();
}

function drawInventoryCharacter(rect) {
  // Character card sized to leave room for a power card to its right (same ratio as combat).
  const cardW = 160;
  const cardH = Math.round(cardW * (COMBAT_CHAR_H / COMBAT_CHAR_W)); // ~218
  const cardX = rect.x + 12;
  const cardY = rect.y + 50;

  // Portrait art fills the card
  const portraitArtId = `${selectedClass.toLowerCase()}_class`;
  const portrait = getCardArt(portraitArtId);
  const hasArt = !!portrait;

  // Art shifted down 10 px to match the combat card recipe, clipped so the
  // bottom overflow is trimmed at the card rect.
  if (hasArt) {
    const imgAspect = portrait.width / portrait.height;
    const cardAspect = cardW / cardH;
    let sx = 0, sy = 0, sw = portrait.width, sh = portrait.height;
    if (imgAspect > cardAspect) { sw = portrait.height * cardAspect; sx = (portrait.width - sw) / 2; }
    else { sh = portrait.width / cardAspect; sy = (portrait.height - sh) / 2; }
    ctx.save();
    ctx.beginPath();
    ctx.rect(cardX, cardY, cardW, cardH);
    ctx.clip();
    ctx.drawImage(portrait, sx, sy, sw, sh, cardX, cardY + 10, cardW, cardH);
    ctx.restore();
  } else {
    ctx.fillStyle = '#1a3a4e';
    ctx.fillRect(cardX, cardY, cardW, cardH);
  }

  // Ornate 9-slice frame (same as combat character card).
  const frameImg = images.frame_common;
  if (frameImg) {
    const corner = CARD_FRAME_CORNERS.frame_common || 24;
    const scaledCorner = Math.max(8, Math.min(corner, Math.floor(Math.min(cardW, cardH) * 0.11)));
    draw9SliceFrame(frameImg, cardX, cardY, cardW, cardH, scaledCorner);
  } else {
    ctx.strokeStyle = Colors.WHITE;
    ctx.lineWidth = 3;
    ctx.strokeRect(cardX, cardY, cardW, cardH);
  }

  // No dark wash — the portrait shows through. Text relies on a drop shadow.
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.95)';
  ctx.shadowBlur = 5;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 2;

  // Character name + level at top (+4 down to match combat card)
  ctx.fillStyle = Colors.WHITE;
  ctx.font = 'bold 16px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${selectedClass} (${player.level || 1})`, cardX + cardW / 2, cardY + 26);

  // Card counts (+4 down, relative offsets preserved)
  const infoTop = cardY + 48;
  const totalCards = player.deck.masterDeck.length;
  const handCount = player.deck.hand.length;
  const dmgCount = player.deck.discardPile.length;
  const deckCount = totalCards - handCount - dmgCount;

  ctx.font = '13px sans-serif';
  ctx.fillStyle = Colors.WHITE;
  ctx.fillText(`Hand: ${handCount}`, cardX + cardW / 2, infoTop);
  ctx.fillText(`Deck: ${deckCount}`, cardX + cardW / 2, infoTop + 18);
  // Bolder/sharper red to match combat treatment.
  if (dmgCount > 0) {
    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 14px sans-serif';
  } else {
    ctx.fillStyle = '#aaa';
  }
  ctx.fillText(`Discard: ${dmgCount}`, cardX + cardW / 2, infoTop + 36);
  ctx.font = '13px sans-serif'; // reset
  ctx.restore();
  // Hoverable discard label — shows the top discarded card on hover (same
  // pattern as the combat character panel).
  if (dmgCount > 0) {
    ctx.font = 'bold 14px sans-serif';
    const discW = ctx.measureText(`Discard: ${dmgCount}`).width;
    const discRect = {
      x: cardX + cardW / 2 - discW / 2 - 4,
      y: infoTop + 36 - 14,
      w: discW + 8,
      h: 18,
    };
    if (hitTest(mouseX, mouseY, discRect)) {
      hoveredCardPreview = player.deck.discardPile[player.deck.discardPile.length - 1];
    }
  }

  // HP bar at bottom — up 4 px, shrunk 8 px off each side (same recipe as
  // the combat character card).
  const hp = totalCards - dmgCount;
  const maxHp = totalCards;
  const barX = cardX + 16, barW = cardW - 32, barH = 18;
  const barY = cardY + cardH - barH - 12;
  ctx.fillStyle = '#222';
  ctx.fillRect(barX, barY, barW, barH);
  const hpPct = maxHp > 0 ? hp / maxHp : 0;
  ctx.fillStyle = hpPct > 0.5 ? Colors.GREEN : (hpPct > 0.25 ? Colors.GOLD : Colors.RED);
  ctx.fillRect(barX, barY, barW * hpPct, barH);
  ctx.strokeStyle = Colors.WHITE;
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barW, barH);
  ctx.fillStyle = Colors.WHITE;
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`HP: ${hp}/${maxHp}`, barX + barW / 2, barY + 13);

  // Power card to the right of the character card (same ratio as combat)
  if (player.powers && player.powers.length > 0) {
    const pwrW = Math.round(cardW * (COMBAT_POWER_W / COMBAT_CHAR_W)); // ~76
    const pwrH = Math.round(pwrW * (COMBAT_POWER_H / COMBAT_POWER_W)); // ~101
    const pwrX = cardX + cardW + 8;
    const pwrY = cardY;
    for (let i = 0; i < player.powers.length; i++) {
      const power = player.powers[i];
      const wasExhausted = power.exhausted;
      power.exhausted = false; // don't show Zzz in inventory
      const py = pwrY + i * (pwrH + 6);
      drawPowerCard(power, { x: pwrX, y: py, w: pwrW, h: pwrH }, false);
      power.exhausted = wasExhausted;
    }
  }

  // ── Deck Limits section ──
  const limitsBaseX = rect.x + 8;
  const limitsW = rect.w - 16;
  let nextY = cardY + cardH + 14;

  // Yellow separator
  ctx.strokeStyle = Colors.GOLD;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(limitsBaseX, nextY);
  ctx.lineTo(limitsBaseX + limitsW, nextY);
  ctx.stroke();
  nextY += 14;

  ctx.fillStyle = Colors.GOLD;
  ctx.font = 'bold 12px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('Deck Limits', limitsBaseX + 2, nextY);

  // Debug-only: "Rest Mode" button next to the header (enters deck
  // rebalancing mode so the developer can move cards freely).
  if (debugMode && !restMode) {
    const dbW = 70, dbH = 14;
    const dbX = limitsBaseX + limitsW - dbW;
    const dbY = nextY - 10;
    const dbHov = hitTest(mouseX, mouseY, { x: dbX, y: dbY, w: dbW, h: dbH });
    ctx.fillStyle = dbHov ? 'rgba(130,80,50,0.9)' : 'rgba(80,50,30,0.8)';
    ctx.fillRect(dbX, dbY, dbW, dbH);
    ctx.strokeStyle = '#e0a060';
    ctx.lineWidth = 1;
    ctx.strokeRect(dbX, dbY, dbW, dbH);
    ctx.fillStyle = '#ffe0b0';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Rest Mode', dbX + dbW / 2, dbY + dbH / 2);
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    _deckLimitBtnRects.push({ x: dbX, y: dbY, w: dbW, h: dbH, kind: 'debug_rest' });
  }

  nextY += 16;

  // Count cards in deck per category
  const baseLimits = CLASS_DECK_LIMITS[selectedClass] || {};
  const bonuses = (player && player.deckLimitBonuses) || {};
  ctx.font = '11px sans-serif';
  for (const cat of DECK_LIMIT_CATEGORIES) {
    const count = (player.deck.masterDeck || []).filter(c => {
      const sub = (c.subtype || '').toLowerCase();
      return cat.subtypes.has(sub);
    }).length;
    const base = baseLimits[cat.id] || 0;
    const bonus = bonuses[cat.id] || 0;
    const max = base + bonus;
    // Color: blue if under, red if over, white if balanced
    if (count < max) ctx.fillStyle = '#78c8ff';
    else if (count > max) ctx.fillStyle = '#ff5555';
    else ctx.fillStyle = '#ffffff';
    const bonusStr = bonus > 0 ? ` (+${bonus})` : '';
    ctx.fillText(`${cat.label}`, limitsBaseX + 4, nextY);
    // Right-aligned count/max. Reserve 18 px at the far right for the +/-
    // button so the text doesn't butt against the panel edge.
    const btnReserve = (restMode && pendingChapter2Transition) ? 18 : 0;
    const rightEdge = limitsBaseX + limitsW - 4 - btnReserve;
    ctx.textAlign = 'right';
    ctx.fillText(`${count} / ${max}${bonusStr}`, rightEdge, nextY);
    // In rest-level-up mode, show +/- buttons to assign the level-up
    // bonus (one +1 pick per level-up, max +3 per category).
    if (restMode && pendingChapter2Transition) {
      const btnSize = 13;
      const btnX = rightEdge + 4;
      const btnY = nextY - 10;
      if (_restBonusCat === cat.id) {
        ctx.fillStyle = 'rgba(200,80,80,0.85)';
        ctx.fillRect(btnX, btnY, btnSize, btnSize);
        ctx.strokeStyle = '#f88';
        ctx.lineWidth = 1;
        ctx.strokeRect(btnX, btnY, btnSize, btnSize);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('−', btnX + btnSize / 2, btnY + btnSize / 2);
        _deckLimitBtnRects.push({ x: btnX, y: btnY, w: btnSize, h: btnSize, kind: 'minus', catId: cat.id });
      } else if (!_restBonusCat && bonus < 3) {
        ctx.fillStyle = 'rgba(80,130,80,0.85)';
        ctx.fillRect(btnX, btnY, btnSize, btnSize);
        ctx.strokeStyle = '#9c9';
        ctx.lineWidth = 1;
        ctx.strokeRect(btnX, btnY, btnSize, btnSize);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('+', btnX + btnSize / 2, btnY + btnSize / 2);
        _deckLimitBtnRects.push({ x: btnX, y: btnY, w: btnSize, h: btnSize, kind: 'plus', catId: cat.id });
      }
    }
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font = '11px sans-serif';
    nextY += 14;
  }

  nextY += 4;

  // ── Equip Types section ──
  ctx.fillStyle = '#bbb';
  ctx.font = '11px sans-serif';
  // Armor types
  const armorTypes = CLASS_ARMOR[selectedClass];
  if (armorTypes) {
    const labels = [...armorTypes].map(s => SUBTYPE_LABELS[s] || s).sort().join(', ');
    ctx.fillText(`Armor: ${labels}`, limitsBaseX + 4, nextY);
    nextY += 14;
  }
  // Weapon types
  const weaponTypes = CLASS_WEAPONS[selectedClass];
  if (weaponTypes) {
    const labels = [...weaponTypes].map(s => SUBTYPE_LABELS[s] || s).sort().join(', ');
    ctx.fillText(`Weapons: ${labels}`, limitsBaseX + 4, nextY);
    nextY += 14;
  }
  // Scrolls
  const canScroll = CLASS_ITEMS[selectedClass] && CLASS_ITEMS[selectedClass].has('scroll');
  ctx.fillText(`Scrolls: ${canScroll ? 'Yes' : 'No'}`, limitsBaseX + 4, nextY);
  nextY += 14;

  nextY += 4;

  // ── Perks section ──
  nextY += 6;
  // Yellow separator
  ctx.strokeStyle = Colors.GOLD;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(limitsBaseX, nextY);
  ctx.lineTo(limitsBaseX + limitsW, nextY);
  ctx.stroke();
  nextY += 14;

  ctx.fillStyle = Colors.GOLD;
  ctx.font = 'bold 12px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('Perks', limitsBaseX + 2, nextY);
  nextY += 16;

  if (player.perks && player.perks.length > 0) {
    ctx.font = '11px sans-serif';
    // Group by id for x2 display, build comma-separated list.
    const perkCounts = {};
    for (const p of player.perks) {
      perkCounts[p.id] = (perkCounts[p.id] || { perk: p, count: 0 });
      perkCounts[p.id].count++;
    }
    const entries = Object.values(perkCounts);
    // Render comma-separated with per-word hover areas.
    let cx = limitsBaseX + 4;
    const maxX = limitsBaseX + limitsW - 4;
    for (let ei = 0; ei < entries.length; ei++) {
      const { perk, count } = entries[ei];
      const label = count > 1 ? `${perk.name} x${count}` : perk.name;
      const suffix = ei < entries.length - 1 ? ', ' : '';
      const text = label + suffix;
      ctx.font = '11px sans-serif';
      const tw = ctx.measureText(text).width;
      // Wrap to next line if needed
      if (cx + tw > maxX && cx > limitsBaseX + 4) {
        nextY += 14;
        cx = limitsBaseX + 4;
      }
      if (nextY > rect.y + rect.h - 20) break;
      // Highlight on hover
      const isHov = hitTest(mouseX, mouseY, { x: cx, y: nextY - 10, w: tw, h: 14 });
      ctx.fillStyle = isHov ? Colors.GOLD : '#ddd';
      ctx.fillText(text, cx, nextY);
      if (isHov) hoveredCardPreview = perkToCardLike(perk);
      cx += tw;
    }
    nextY += 14;
  } else {
    ctx.fillStyle = '#888';
    ctx.font = '11px sans-serif';
    ctx.fillText('None yet', limitsBaseX + 4, nextY);
    nextY += 14;
  }
  ctx.textAlign = 'left';
}

// ============================================================
// SAVE / LOAD
// ============================================================

// === Layout constants for the save/load menu ===
const SL_BOX_W = 760;
const SL_BOX_H = 800;
const SL_BOX_X = (SCREEN_WIDTH - SL_BOX_W) / 2;
const SL_BOX_Y = (SCREEN_HEIGHT - SL_BOX_H) / 2;
// Slot row dimensions. 10 slots × current row height was overflowing the
// action-button row (last slot peeked under Load/Delete/Cancel by ~14 px).
// Tighter row + smaller gap fits all 10 with breathing room above the buttons.
const SL_SLOT_H = 48;
const SL_SLOT_GAP = 5;
const SL_LIST_VISIBLE_ROWS = 10;

function refreshLoadEntries() {
  loadEntries = [];
  if (loadTab === 'manual') {
    for (let i = 1; i <= MANUAL_SLOT_COUNT; i++) {
      const slot = `manual_${i}`;
      loadEntries.push({ slot, info: getSaveInfo(slot), hasData: hasSave(slot), isAuto: false, displayNum: i });
    }
  } else {
    for (let i = 1; i <= AUTO_SLOT_COUNT; i++) {
      const slot = `auto_${i}`;
      loadEntries.push({ slot, info: getSaveInfo(slot), hasData: hasSave(slot), isAuto: true, displayNum: i });
    }
  }
  // Sort: saves with data first (newest by timestamp), then empty slots
  loadEntries.sort((a, b) => {
    if (a.hasData !== b.hasData) return a.hasData ? -1 : 1;
    if (a.hasData && b.hasData) {
      const ta = a.info?.timestamp || 0;
      const tb = b.info?.timestamp || 0;
      return tb - ta; // newest first
    }
    return a.displayNum - b.displayNum;
  });
}

function getSaveSlotRects() {
  // Used for save mode (manual slots only)
  const slotW = SL_BOX_W - 60;
  const startX = SL_BOX_X + 30;
  const startY = SL_BOX_Y + 110 - loadScrollY;
  const slots = [];
  for (let i = 1; i <= MANUAL_SLOT_COUNT; i++) {
    const slot = `manual_${i}`;
    slots.push({
      x: startX, y: startY + (i - 1) * (SL_SLOT_H + SL_SLOT_GAP), w: slotW, h: SL_SLOT_H,
      slot, hasData: hasSave(slot), info: getSaveInfo(slot), displayNum: i,
    });
  }
  return slots;
}

function getLoadSlotRects() {
  const slotW = SL_BOX_W - 60;
  const startX = SL_BOX_X + 30;
  const startY = SL_BOX_Y + 165 - loadScrollY;
  return loadEntries.map((e, i) => ({
    x: startX, y: startY + i * (SL_SLOT_H + SL_SLOT_GAP), w: slotW, h: SL_SLOT_H, ...e,
  }));
}

function getLoadListBounds(forSave) {
  // Visible area for the slot list (used for clipping and scroll)
  const x = SL_BOX_X + 25;
  const y = forSave ? SL_BOX_Y + 105 : SL_BOX_Y + 160;
  const w = SL_BOX_W - 50;
  const h = SL_SLOT_H * SL_LIST_VISIBLE_ROWS + SL_SLOT_GAP * (SL_LIST_VISIBLE_ROWS - 1) + 10;
  return { x, y, w, h };
}

function getLoadMaxScroll(rowCount) {
  const visibleH = SL_SLOT_H * SL_LIST_VISIBLE_ROWS + SL_SLOT_GAP * (SL_LIST_VISIBLE_ROWS - 1);
  const totalH = rowCount * (SL_SLOT_H + SL_SLOT_GAP) - SL_SLOT_GAP;
  return Math.max(0, totalH - visibleH);
}

function getLoadTabRects() {
  const tabW = 220, tabH = 40;
  const tabY = SL_BOX_Y + 100;
  return {
    manual: { x: SL_BOX_X + 80, y: tabY, w: tabW, h: tabH },
    auto: { x: SL_BOX_X + SL_BOX_W - 80 - tabW, y: tabY, w: tabW, h: tabH },
  };
}

function getLoadActionBtnRects() {
  const btnW = 140, btnH = 50;
  const btnY = SL_BOX_Y + SL_BOX_H - btnH - 20;
  return {
    load: { x: SL_BOX_X + 60, y: btnY, w: btnW, h: btnH },
    delete: { x: SCREEN_WIDTH / 2 - btnW / 2, y: btnY, w: btnW, h: btnH },
    cancel: { x: SL_BOX_X + SL_BOX_W - 60 - btnW, y: btnY, w: btnW, h: btnH },
  };
}

function buildDefaultSaveName(slotDisplayNum) {
  const lvl = (player && player.level) || 1;
  const node = currentMap && currentMap.getCurrentNode();
  const area = node && (node.name || node.mapArea || '').trim();
  const base = `${selectedClass} Lv${lvl}`;
  return area ? `${base} — ${area}` : `${base} — Slot ${slotDisplayNum}`;
}

function commitSaveEditing() {
  if (!saveEditingSlot) return;
  const name = (saveEditingName || '').trim() || `Save ${saveEditingDisplayNum}`;
  const success = saveToSlot({
    selectedClass, gold, player, currentMap, visitedNodes, backpack,
    kitchenChoiceMade, prisonBarrelLooted,
  }, saveEditingSlot, name);
  if (success) {
    addLog(`Game saved: ${name}`, Colors.GREEN);
    showToast(`Saved: ${name}`, 1500);
  }
  saveEditingSlot = null;
  saveEditingName = '';
  saveEditingSelectAll = false;
  // Return directly to the game instead of lingering on the save/menu
  // screen. If saved from the in-game menu, go back to whatever state
  // was open before the menu (combat, map, encounter, etc.).
  if (saveLoadReturnState === GameState.INGAME_MENU && previousState) {
    state = previousState;
  } else {
    state = saveLoadReturnState || GameState.MAP;
  }
}

// Word-boundary helpers for Ctrl+Arrow in the save-name editor.
function _prevWordBoundary(text, pos) {
  if (pos <= 0) return 0;
  let i = pos - 1;
  while (i > 0 && text[i - 1] === ' ') i--; // skip trailing spaces
  while (i > 0 && text[i - 1] !== ' ') i--; // skip word chars
  return i;
}
function _nextWordBoundary(text, pos) {
  const len = text.length;
  if (pos >= len) return len;
  let i = pos;
  while (i < len && text[i] !== ' ') i++; // skip word chars
  while (i < len && text[i] === ' ') i++; // skip spaces after
  return i;
}

// Selection range derived from cursor + anchor.
function _saveSelRange() {
  return { start: Math.min(saveEditingCursor, saveEditingAnchor), end: Math.max(saveEditingCursor, saveEditingAnchor) };
}
function _saveHasSelection() { return saveEditingCursor !== saveEditingAnchor; }
// Delete selected text and collapse cursor to start of selection.
function _saveDeleteSelection() {
  const { start, end } = _saveSelRange();
  saveEditingName = saveEditingName.slice(0, start) + saveEditingName.slice(end);
  saveEditingCursor = start;
  saveEditingAnchor = start;
}

function cancelSaveEditing() {
  saveEditingSlot = null;
  saveEditingName = '';
}

function handleSaveClick(x, y) {
  const rects = getSaveSlotRects();
  for (const r of rects) {
    if (hitTest(x, y, r)) {
      // If the clicked row is already in edit mode, clicking the row again
      // is a no-op (the Save button below commits). Clicking a DIFFERENT row
      // switches to editing that one.
      if (saveEditingSlot === r.slot) {
        saveEditingSelectAll = true;
        saveEditingAnchor = 0;
        saveEditingCursor = saveEditingName.length;
        return;
      }
      saveEditingSlot = r.slot;
      saveEditingDisplayNum = r.displayNum;
      saveEditingName = (r.info && r.info.saveName) || buildDefaultSaveName(r.displayNum);
      saveEditingCursor = saveEditingName.length;
      saveEditingAnchor = 0;
      saveEditingSelectAll = true;
      return;
    }
  }
  // Save button (only active while editing)
  if (saveEditingSlot) {
    const saveBtn = getLoadActionBtnRects().load; // reuse leftmost button slot
    if (hitTest(x, y, saveBtn)) { commitSaveEditing(); return; }
  }
  // Cancel button
  const cancelBtn = getLoadActionBtnRects().cancel;
  if (hitTest(x, y, cancelBtn)) {
    cancelSaveEditing();
    state = saveLoadReturnState || GameState.MAP;
  }
}

function handleLoadClick(x, y) {
  // Confirmation overlay for delete
  if (loadConfirmDelete) {
    const cw = 420, ch = 180;
    const cx = (SCREEN_WIDTH - cw) / 2, cy = (SCREEN_HEIGHT - ch) / 2;
    const yesBtn = { x: cx + 40, y: cy + ch - 60, w: 140, h: 44 };
    const noBtn = { x: cx + cw - 40 - 140, y: cy + ch - 60, w: 140, h: 44 };
    if (hitTest(x, y, yesBtn) && loadSelectedIndex >= 0) {
      deleteSave(loadEntries[loadSelectedIndex].slot);
      loadConfirmDelete = false;
      loadSelectedIndex = -1;
      refreshLoadEntries();
    } else if (hitTest(x, y, noBtn)) {
      loadConfirmDelete = false;
    }
    return;
  }

  // Tabs
  const tabs = getLoadTabRects();
  if (hitTest(x, y, tabs.manual)) {
    if (loadTab !== 'manual') { loadTab = 'manual'; loadSelectedIndex = -1; loadScrollY = 0; refreshLoadEntries(); }
    return;
  }
  if (hitTest(x, y, tabs.auto)) {
    if (loadTab !== 'auto') { loadTab = 'auto'; loadSelectedIndex = -1; loadScrollY = 0; refreshLoadEntries(); }
    return;
  }

  // Slot selection
  const rects = getLoadSlotRects();
  for (let i = 0; i < rects.length; i++) {
    if (hitTest(x, y, rects[i]) && rects[i].hasData) {
      loadSelectedIndex = i;
      return;
    }
  }

  // Action buttons
  const btns = getLoadActionBtnRects();
  const hasSelection = loadSelectedIndex >= 0 && loadEntries[loadSelectedIndex] && loadEntries[loadSelectedIndex].hasData;

  if (hitTest(x, y, btns.load) && hasSelection) {
    const data = loadFromSlot(loadEntries[loadSelectedIndex].slot);
    if (data) {
      restoreFromSave(data);
      state = GameState.MAP;
      previousState = null;
      saveLoadReturnState = null;
      loadSelectedIndex = -1;
    }
    return;
  }
  if (hitTest(x, y, btns.delete) && hasSelection) {
    loadConfirmDelete = true;
    return;
  }
  if (hitTest(x, y, btns.cancel)) {
    state = saveLoadReturnState || (player ? GameState.MAP : GameState.MENU);
    loadSelectedIndex = -1;
  }
}

// Draw the underlying state (game) so it shows through
function drawSaveLoadBackground() {
  const ps = saveLoadReturnState;
  if (ps === GameState.MAP) {
    drawMap();
  } else if (ps === GameState.INGAME_MENU) {
    const ipState = previousState;
    if (ipState === GameState.COMBAT || ipState === GameState.TARGETING || ipState === GameState.MODAL_SELECT) {
      drawCombat();
    } else if (ipState === GameState.MAP) {
      drawMap();
    }
  } else if (player && currentMap) {
    drawMap();
  } else if (images.menu_bg) {
    ctx.drawImage(images.menu_bg, 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  } else {
    ctx.fillStyle = '#2a2a30';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  }

  // Block all background interactions: clear hover/click hit areas
  cardBadgeHitAreas.length = 0;
  iconHitAreas.length = 0;
  menuButtons.length = 0;

  // Dim overlay
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
}

function drawSaveLoadPanel(title) {
  // Grey panel with gold border (matches py game)
  ctx.fillStyle = 'rgba(45, 45, 55, 0.95)';
  ctx.fillRect(SL_BOX_X, SL_BOX_Y, SL_BOX_W, SL_BOX_H);
  ctx.strokeStyle = Colors.GOLD;
  ctx.lineWidth = 3;
  ctx.strokeRect(SL_BOX_X, SL_BOX_Y, SL_BOX_W, SL_BOX_H);

  // Title
  ctx.shadowColor = 'rgba(0,0,0,0.9)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = Colors.GOLD;
  ctx.font = 'bold 38px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, SCREEN_WIDTH / 2, SL_BOX_Y + 55);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
}

function drawSlotEntry(rect, info, displayNum, isAuto, selected, canClick, editingSlot) {
  const hov = hitTest(mouseX, mouseY, rect);
  const isEditing = editingSlot && editingSlot === (isAuto ? `auto_${displayNum}` : `manual_${displayNum}`);
  // Background — gold highlight when this row is being edited.
  if (isEditing) {
    ctx.fillStyle = 'rgba(80, 70, 30, 0.95)';
  } else if (selected) {
    ctx.fillStyle = 'rgba(60, 50, 20, 0.9)';
  } else {
    ctx.fillStyle = canClick ? 'rgba(40, 40, 50, 0.85)' : 'rgba(30, 30, 35, 0.6)';
  }
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.strokeStyle = isEditing ? Colors.GOLD : (selected ? Colors.GOLD : (hov && canClick ? '#bb9' : '#555'));
  ctx.lineWidth = (isEditing || selected) ? 2 : 1;
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const midY = rect.y + rect.h / 2;

  // Editing state: render an input field spanning most of the row.
  if (isEditing) {
    ctx.fillStyle = Colors.GOLD;
    ctx.font = 'bold 14px Georgia, serif';
    ctx.fillText(`Slot ${displayNum}:`, rect.x + 14, midY);
    const labelW = ctx.measureText(`Slot ${displayNum}:`).width;
    // Input field
    const inputX = rect.x + 14 + labelW + 10;
    const inputW = rect.w - (14 + labelW + 10) - 14;
    const inputH = rect.h - 12;
    const inputY = rect.y + 6;
    ctx.fillStyle = 'rgba(20, 20, 35, 0.8)';
    ctx.fillRect(inputX, inputY, inputW, inputH);
    ctx.strokeStyle = Colors.GOLD;
    ctx.lineWidth = 1;
    ctx.strokeRect(inputX, inputY, inputW, inputH);
    // Show text with selection highlight + cursor-positioned caret.
    ctx.font = '15px sans-serif';
    ctx.textBaseline = 'middle';
    const textX = inputX + 8;
    const textCy = inputY + inputH / 2;
    // Determine effective selection range (selectAll flag or anchor≠cursor).
    let selS, selE;
    if (saveEditingSelectAll) {
      selS = 0; selE = saveEditingName.length;
    } else {
      selS = Math.min(saveEditingCursor, saveEditingAnchor);
      selE = Math.max(saveEditingCursor, saveEditingAnchor);
    }
    // Draw selection highlight if any.
    if (selS !== selE && saveEditingName) {
      const beforeW = ctx.measureText(saveEditingName.slice(0, selS)).width;
      const selW = ctx.measureText(saveEditingName.slice(selS, selE)).width;
      ctx.fillStyle = 'rgba(80, 120, 200, 0.5)';
      ctx.fillRect(textX + beforeW - 1, inputY + 4, selW + 2, inputH - 8);
    }
    // Draw text.
    ctx.fillStyle = '#fff';
    ctx.fillText(saveEditingName, textX, textCy);
    // Blinking caret (hidden when full selectAll for cleaner look).
    if (!saveEditingSelectAll && Math.floor(performance.now() / 500) % 2 === 0) {
      const beforeCur = saveEditingName.slice(0, saveEditingCursor);
      const caretX = textX + ctx.measureText(beforeCur).width;
      ctx.fillRect(caretX, inputY + 4, 1, inputH - 8);
    }
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    return;
  }

  if (info) {
    const badge = isAuto ? '[Auto] ' : '';
    // First show the user-chosen name (if any), otherwise the default slot label
    const displayName = info.saveName || `Slot ${displayNum}`;
    ctx.fillStyle = Colors.WHITE;
    ctx.font = 'bold 16px Georgia, serif';
    ctx.fillText(`${badge}${displayName}`, rect.x + 14, midY);
    const nameW = ctx.measureText(`${badge}${displayName}`).width;
    ctx.fillStyle = '#bbb';
    ctx.font = '13px sans-serif';
    ctx.fillText(`— ${info.class} Lv${info.level} • ${info.deckSize} cards • ${info.gold} gold`, rect.x + 14 + nameW + 6, midY);
    // Date on the right
    ctx.fillStyle = '#888';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(info.date, rect.x + rect.w - 14, midY);
  } else {
    ctx.fillStyle = '#777';
    ctx.font = 'italic 16px sans-serif';
    ctx.fillText(`Slot ${displayNum}: -- Empty --`, rect.x + 14, midY);
  }
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
}

function drawSaveLoad(mode) {
  drawSaveLoadBackground();

  if (mode === 'save') {
    drawSaveLoadPanel('Save Game');
    ctx.fillStyle = '#ccc';
    ctx.font = '15px Georgia, serif';
    ctx.textAlign = 'center';
    const prompt = saveEditingSlot
      ? 'Edit the name, then press Save (Enter) or ESC to cancel'
      : 'Click a slot to name and save';
    ctx.fillText(prompt, SCREEN_WIDTH / 2, SL_BOX_Y + 92);

    // Clip the list area
    const listBounds = getLoadListBounds(true);
    ctx.save();
    ctx.beginPath();
    ctx.rect(listBounds.x, listBounds.y, listBounds.w, listBounds.h);
    ctx.clip();

    const rects = getSaveSlotRects();
    for (const r of rects) {
      // Skip rows entirely off-screen
      if (r.y + r.h < listBounds.y || r.y > listBounds.y + listBounds.h) continue;
      drawSlotEntry(r, r.info, r.displayNum, false, false, true, saveEditingSlot);
    }
    ctx.restore();

    // Scrollbar
    drawSaveLoadScrollbar(listBounds, MANUAL_SLOT_COUNT);

    // Save button (only while editing) — reuses the "load" button slot so
    // the layout matches the load screen.
    if (saveEditingSlot) {
      const saveBtn = getLoadActionBtnRects().load;
      drawStyledButton(saveBtn.x, saveBtn.y, saveBtn.w, saveBtn.h, 'Save', null, 'large', 18);
      menuButtons.pop();
    }
    // Cancel button
    const cancelBtn = getLoadActionBtnRects().cancel;
    drawStyledButton(cancelBtn.x, cancelBtn.y, cancelBtn.w, cancelBtn.h, 'Cancel', null, 'large', 18);
    menuButtons.pop();
  } else {
    drawSaveLoadPanel('Load Game');

    // Tabs
    const tabs = getLoadTabRects();
    drawTab(tabs.manual, 'Manual Saves', loadTab === 'manual');
    drawTab(tabs.auto, 'Auto Saves', loadTab === 'auto');

    // Refresh entries if needed
    if (loadEntries.length === 0) refreshLoadEntries();

    // Clip the list area
    const listBounds = getLoadListBounds(false);
    ctx.save();
    ctx.beginPath();
    ctx.rect(listBounds.x, listBounds.y, listBounds.w, listBounds.h);
    ctx.clip();

    // Slot list
    const rects = getLoadSlotRects();
    for (let i = 0; i < rects.length; i++) {
      const r = rects[i];
      if (r.y + r.h < listBounds.y || r.y > listBounds.y + listBounds.h) continue;
      drawSlotEntry(r, r.info, r.displayNum, r.isAuto, i === loadSelectedIndex, r.hasData);
    }
    ctx.restore();

    // Scrollbar
    drawSaveLoadScrollbar(listBounds, loadEntries.length);

    // Action buttons (Load, Delete, Cancel)
    const btns = getLoadActionBtnRects();
    const hasSelection = loadSelectedIndex >= 0 && loadEntries[loadSelectedIndex] && loadEntries[loadSelectedIndex].hasData;

    // Load button
    if (hasSelection) {
      drawStyledButton(btns.load.x, btns.load.y, btns.load.w, btns.load.h, 'Load', null, 'large', 18);
    } else {
      ctx.globalAlpha = 0.4;
      drawStyledButton(btns.load.x, btns.load.y, btns.load.w, btns.load.h, 'Load', null, 'large', 18);
      ctx.globalAlpha = 1;
    }
    menuButtons.pop();

    // Delete button
    if (hasSelection) {
      drawStyledButton(btns.delete.x, btns.delete.y, btns.delete.w, btns.delete.h, 'Delete', null, 'large', 18);
    } else {
      ctx.globalAlpha = 0.4;
      drawStyledButton(btns.delete.x, btns.delete.y, btns.delete.w, btns.delete.h, 'Delete', null, 'large', 18);
      ctx.globalAlpha = 1;
    }
    menuButtons.pop();

    // Cancel button
    drawStyledButton(btns.cancel.x, btns.cancel.y, btns.cancel.w, btns.cancel.h, 'Cancel', null, 'large', 18);
    menuButtons.pop();

    // Delete confirmation overlay
    if (loadConfirmDelete) drawDeleteConfirm();
  }

  ctx.textAlign = 'left';
}

function drawSaveLoadScrollbar(bounds, rowCount) {
  const maxScroll = getLoadMaxScroll(rowCount);
  // Clamp current scroll
  if (loadScrollY > maxScroll) loadScrollY = maxScroll;
  if (loadScrollY < 0) loadScrollY = 0;
  if (maxScroll <= 0) return;

  const sbX = bounds.x + bounds.w - 6;
  const sbY = bounds.y;
  const sbW = 5;
  const sbH = bounds.h;

  // Track
  ctx.fillStyle = 'rgba(80, 80, 90, 0.6)';
  ctx.fillRect(sbX, sbY, sbW, sbH);

  // Thumb
  const visibleH = sbH;
  const totalH = visibleH + maxScroll;
  const thumbH = Math.max(20, sbH * (visibleH / totalH));
  const thumbY = sbY + (sbH - thumbH) * (loadScrollY / maxScroll);
  ctx.fillStyle = Colors.GOLD;
  ctx.fillRect(sbX, thumbY, sbW, thumbH);
}

function drawTab(rect, label, active) {
  const hov = hitTest(mouseX, mouseY, rect);
  ctx.fillStyle = active ? 'rgba(80, 70, 30, 0.95)' : (hov ? 'rgba(60, 60, 70, 0.85)' : 'rgba(40, 40, 50, 0.85)');
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.strokeStyle = active ? Colors.GOLD : '#666';
  ctx.lineWidth = active ? 2 : 1;
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);

  ctx.fillStyle = active ? Colors.GOLD : '#aaa';
  ctx.font = `bold ${active ? 18 : 16}px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2);
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
}

function drawDeleteConfirm() {
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

  const cw = 420, ch = 180;
  const cx = (SCREEN_WIDTH - cw) / 2, cy = (SCREEN_HEIGHT - ch) / 2;
  ctx.fillStyle = 'rgba(45, 45, 55, 0.98)';
  ctx.fillRect(cx, cy, cw, ch);
  ctx.strokeStyle = Colors.RED;
  ctx.lineWidth = 3;
  ctx.strokeRect(cx, cy, cw, ch);

  ctx.fillStyle = Colors.RED;
  ctx.font = 'bold 22px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('Delete this save?', SCREEN_WIDTH / 2, cy + 50);
  ctx.fillStyle = '#bbb';
  ctx.font = '14px sans-serif';
  ctx.fillText('This cannot be undone.', SCREEN_WIDTH / 2, cy + 75);

  // Yes / No buttons
  const yesBtn = { x: cx + 40, y: cy + ch - 60, w: 140, h: 44 };
  const noBtn = { x: cx + cw - 40 - 140, y: cy + ch - 60, w: 140, h: 44 };

  const yesHov = hitTest(mouseX, mouseY, yesBtn);
  ctx.fillStyle = yesHov ? '#a44' : '#722';
  ctx.fillRect(yesBtn.x, yesBtn.y, yesBtn.w, yesBtn.h);
  ctx.strokeStyle = yesHov ? Colors.GOLD : '#999';
  ctx.lineWidth = 2;
  ctx.strokeRect(yesBtn.x, yesBtn.y, yesBtn.w, yesBtn.h);
  ctx.fillStyle = Colors.WHITE;
  ctx.font = 'bold 18px sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText('Delete', yesBtn.x + yesBtn.w / 2, yesBtn.y + yesBtn.h / 2);

  const noHov = hitTest(mouseX, mouseY, noBtn);
  ctx.fillStyle = noHov ? '#555' : '#333';
  ctx.fillRect(noBtn.x, noBtn.y, noBtn.w, noBtn.h);
  ctx.strokeStyle = noHov ? Colors.GOLD : '#999';
  ctx.lineWidth = 2;
  ctx.strokeRect(noBtn.x, noBtn.y, noBtn.w, noBtn.h);
  ctx.fillStyle = Colors.WHITE;
  ctx.fillText('Cancel', noBtn.x + noBtn.w / 2, noBtn.y + noBtn.h / 2);

  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
}

function restoreFromSave(data) {
  selectedClass = data.selectedClass;
  gold = data.gold;

  // Recreate player
  player = new Character(selectedClass);
  player.deck = new Deck();
  for (const cardId of data.masterDeck) {
    const creator = CARD_REGISTRY[cardId];
    if (creator) {
      player.deck.addCard(creator());
    }
  }
  // Restore persistent piles (hand + discard survive between combats)
  for (const cardId of (data.hand || [])) {
    const creator = CARD_REGISTRY[cardId];
    if (creator) player.deck.hand.push(creator());
  }
  for (const cardId of (data.discardPile || [])) {
    const creator = CARD_REGISTRY[cardId];
    if (creator) player.deck.discardPile.push(creator());
  }

  // Add class power
  const power = getClassPower(selectedClass);
  player.addPower(power);

  // Restore level, perks, and deck-limit bonuses.
  player.level = data.level || 1;
  player.deckLimitBonuses = data.deckLimitBonuses || {};
  for (const perkId of (data.perks || [])) {
    const fn = PERK_REGISTRY[perkId];
    if (fn) player.perks.push(fn());
  }

  // Restore backpack
  backpack = [];
  for (const cardId of (data.backpack || [])) {
    const creator = CARD_REGISTRY[cardId];
    if (creator) backpack.push(creator());
  }

  // Restore story flags used by later encounters.
  kitchenChoiceMade = data.kitchenChoiceMade || null;
  prisonBarrelLooted = !!data.prisonBarrelLooted;

  // Recreate map
  const MAP_CREATORS = {
    prison_cell: createPrisonCellMap,
    mountain_path: createMountainPathMap,
    plains: createPlainsMap,
    cave: createCaveMap,
    ruins_basin: createRuinsBasinMap,
    north_qualibaf: createNorthQualibafMap,
    filibaf_forest: createFilibafForestMap,
    tharnag: createTharnagMap,
    volcano: createVolcanoMap,
    obsidian_wastes: createObsidianWastesMap,
    tharnag_interior: createTharnagInteriorMap,
    entry_corridor: createEntryCorridorMap,
    gate_area: createGateAreaMap,
    hall_of_ancestors: createHallOfAncestorsMap,
    monument_alley: createMonumentAlleyMap,
    tomb_of_ancestor: createTombOfAncestorMap,
    grand_stairs: createGrandStairsMap,
    dwarven_throne_room: createDwarvenThroneRoomMap,
    map_room: createMapRoomMap,
    deeper_tunnels: createDeeperTunnelsMap,
    artisan_district: createArtisanDistrictMap,
  };
  const mapCreator = MAP_CREATORS[data.mapId] || createPrisonCellMap;
  currentMap = mapCreator();
  currentMap.currentNodeId = data.currentNodeId;
  visitedNodes = new Set(data.visitedNodes);

  // Restore node states. We intentionally DO NOT restore `canRevisit` — it's
  // a static property driven by the map definition, and saves from earlier
  // versions of the game may have stale values (e.g. prison_entrance was
  // canRevisit=true in older builds, which would make its encounter repeat
  // after the fix landed). The map definition is always authoritative.
  for (const [id, nodeState] of Object.entries(data.nodeStates || {})) {
    const node = currentMap.getNode(id);
    if (node) {
      node.isDone = nodeState.isDone;
      node.isLocked = nodeState.isLocked;
      if (Array.isArray(nodeState.exhaustedChoices)) node.exhaustedChoices = nodeState.exhaustedChoices.slice();
    }
  }
}

// ============================================================
// DRAW DISPATCH
// ============================================================
function draw() {
  ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

  if (!assetsLoaded) {
    ctx.fillStyle = Colors.WHITE;
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Loading...', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
    return;
  }

  // Clear per-frame button / hit-area lists so nothing leaks between states.
  menuButtons.length = 0;
  cardBadgeHitAreas.length = 0;
  iconHitAreas.length = 0;
  logCardHitAreas.length = 0;

  switch (state) {
    case GameState.MENU:
      drawMenu();
      break;
    case GameState.CHARACTER_SELECT:
      drawCharacterSelect();
      break;
    case GameState.ABILITY_SELECT:
      drawAbilitySelect();
      break;
    case GameState.MAP:
      drawMap();
      break;
    case GameState.ENCOUNTER_TEXT:
      drawEncounterText();
      break;
    case GameState.ENCOUNTER_CHOICE:
      drawEncounterChoice();
      break;
    case GameState.ENCOUNTER_LOOT:
      drawEncounterLoot();
      break;
    case GameState.COMBAT:
    case GameState.TARGETING:
    case GameState.MODAL_SELECT:
    case GameState.DEFENDING:
    case GameState.DAMAGE_SOURCE:
    case GameState.POWER_TARGETING:
    case GameState.POWER_CHOICE:
    case GameState.ALLY_TARGETING:
    case GameState.MULTI_TARGETING:
    case GameState.SCRY_SELECT:
      drawCombat();
      if (state === GameState.MODAL_SELECT) drawModalOverlay();
      if (state === GameState.DEFENDING) drawDefendingOverlay();
      if (state === GameState.DAMAGE_SOURCE) drawDamageSourceOverlay();
      if (state === GameState.POWER_CHOICE) drawPowerChoiceOverlay();
      if (state === GameState.MULTI_TARGETING) drawMultiTargetingOverlay();
      if (state === GameState.SCRY_SELECT) drawScryOverlay();
      break;
    case GameState.PERK_SELECT:
      drawPerkSelect();
      break;
    case GameState.SHOP:
      drawShop();
      break;
    case GameState.INVENTORY:
      drawInventory();
      break;
    case GameState.SAVE_GAME:
      drawSaveLoad('save');
      break;
    case GameState.LOAD_GAME:
      drawSaveLoad('load');
      break;
    case GameState.VICTORY:
      drawVictory();
      break;
    case GameState.GAME_OVER:
      drawGameOver();
      break;
    case GameState.HELP_SCREEN:
      drawHelpScreen();
      break;
    case GameState.CODEX:
      drawCodex();
      break;
    case GameState.INGAME_MENU:
      drawIngameMenu();
      break;
    case GameState.OPTIONS_SCREEN:
      drawOptionsScreen();
      break;
    case GameState.TITLE_CARD:
      drawTitleCard();
      break;
    case GameState.CHAPTER_END:
      drawChapterEnd();
      break;
    case GameState.DECK_TUTORIAL:
      drawDeckTutorial();
      break;
    case GameState.FADING:
      // Draw nothing special — fade overlay is drawn after
      break;
    default:
      ctx.fillStyle = '#1a0a2e';
      ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
      ctx.fillStyle = Colors.WHITE;
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`State: ${state} (not yet implemented)`, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
      break;
  }
}

// ============================================================
// GAME LOOP
// ============================================================
// ============================================================
// HELP SCREEN
// ============================================================

// Each item: { text, color }. If color omitted, default white is used.
const HELP_WHITE = '#ffffff';
const HELP_CONTENT = [
  { title: 'Life & Cards', items: [
    { text: 'Your HP equals your deck size (draw pile + hand + recharge pile).' },
    { text: 'Damage removes cards from your draw pile (sent to damage pile, not reshuffled).' },
    { text: 'Healing moves cards from damage pile back to draw pile.' },
    { text: 'When draw pile, hand, and recharge pile are all empty, you die.' },
  ]},
  { title: 'Card Costs', items: [
    { text: 'Recharge: card goes to the bottom of the draw pile next turn.' },
    { text: 'Discard: card goes to the discard pile (lost as damage).' },
    { text: 'Banish: card is permanently removed from your deck.' },
    { text: 'Some cards Exhaust for a turn (Zzz overlay) and can be used next turn.' },
  ]},
  { title: 'Combat Keywords', items: [
    { text: 'Armor: permanent damage reduction. Reduces all incoming damage.', color: '#aaaaaa' },
    { text: 'Shield: absorbs damage before HP. Persists between turns.', color: '#6496ff' },
    { text: 'Heroism: bonus damage added to your next attack, then consumed.', color: '#ffd700' },
    { text: 'Rage: permanent bonus damage to all your attacks for this combat.', color: '#dc4040' },
    { text: 'Block: absorbs damage from defense cards. Clears at end of turn.', color: '#ffffff' },
    { text: 'Scry N: look at the top N cards of your deck, pick 1 to draw, recharge the rest.', color: '#7ec8ff' },
    { text: 'Heal N: restore up to N cards from discard. Poison stacks are cleared first (1 heal = 1 Poison removed); the rest heals cards.', color: '#7cff9c' },
  ]},
  { title: 'Status Effects', items: [
    { text: 'Fire: deals damage equal to stacks at start of turn, decays by 1.', color: '#dc8c28' },
    { text: 'Ice: reduces damage dealt by stacks, decays by 1 per turn.', color: '#78c8ff' },
    { text: 'Poison: deals damage equal to stacks each turn. Only removed by healing.', color: '#3cc83c' },
    { text: 'Shock: -1 damage dealt and +1 damage taken per stack, decays by 1.', color: '#ffe650' },
  ]},
  { title: 'Allies & Summons', items: [
    { text: 'Summoned creatures and allies are exhausted the turn they come into play and can attack on the next turn.' },
    { text: 'Losing a summon does not cost you a card — the card was already played and recharged.' },
    { text: 'Losing a companion costs you a card — the companion card goes to your discard pile.' },
    { text: 'Sentinel: attacks must target this creature first while it is alive.', color: '#c8a060' },
  ]},
  { title: 'Controls', items: [
    { text: 'Click cards to play them, click enemies to target.' },
    { text: 'ESC: cancel targeting / open menu.' },
    { text: 'H: toggle help screen.' },
    { text: 'S: save game (on map).' },
    { text: 'L: load game (on map).' },
    { text: 'I: open or close inventory.' },
    { text: '` (backtick): toggle debug mode.' },
    { text: 'Mouse wheel: scroll in shop / inventory / help.' },
  ]},
];

function handleHelpClick(x, y) {
  // Close button positioned at bottom-right of the help panel
  const pw = 900, ph = 620;
  const px = (SCREEN_WIDTH - pw) / 2;
  const py = (SCREEN_HEIGHT - ph) / 2;
  const btnW = 160, btnH = 40;
  const btnX = px + pw - btnW - 16;
  const btnY = py + ph - btnH - 12;
  if (hitTest(x, y, { x: btnX, y: btnY, w: btnW, h: btnH })) {
    state = previousState || GameState.MAP;
  }
}

function drawHelpScreen() {
  // Draw the previous game state underneath so the game shows through
  const ps = previousState;
  if (ps === GameState.COMBAT || ps === GameState.TARGETING || ps === GameState.MODAL_SELECT) {
    drawCombat();
  } else if (ps === GameState.MAP) {
    drawMap();
  } else if (ps === GameState.ENCOUNTER_TEXT) {
    drawEncounterText();
  } else if (ps === GameState.ENCOUNTER_CHOICE) {
    drawEncounterChoice();
  }

  // Block all background interactions
  cardBadgeHitAreas.length = 0;
  iconHitAreas.length = 0;
  menuButtons.length = 0;

  // Dim overlay (matches py game ~78%)
  ctx.fillStyle = 'rgba(0,0,0,0.78)';
  ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

  // Panel — dark brown to match py game (40, 35, 30) with warm gold border (180, 160, 120)
  const pw = 900, ph = 620;
  const px = (SCREEN_WIDTH - pw) / 2;
  const py = (SCREEN_HEIGHT - ph) / 2;
  ctx.fillStyle = 'rgba(40, 35, 30, 0.97)';
  ctx.fillRect(px, py, pw, ph);
  ctx.strokeStyle = '#b4a078'; // warm gold (180, 160, 120)
  ctx.lineWidth = 2;
  ctx.strokeRect(px, py, pw, ph);

  // Title
  ctx.fillStyle = '#dcc896'; // warmer gold (220, 200, 150)
  ctx.font = 'bold 28px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('Game Reference', Math.round(SCREEN_WIDTH / 2), Math.round(py + 40));

  // Content area
  const contentTop = py + 60;
  const contentBottom = py + ph - 60;
  const contentH = contentBottom - contentTop;
  const innerW = pw - 60;

  // Clip
  ctx.save();
  ctx.beginPath();
  ctx.rect(px + 10, contentTop, pw - 20, contentH);
  ctx.clip();

  let y = contentTop + 16 - helpScrollY;
  ctx.textAlign = 'left';
  const sectionGap = 14;
  const lineGap = 3;
  const fontSize = 16;
  for (const section of HELP_CONTENT) {
    // Section header in warm gold, sits adjacent to its description block
    ctx.fillStyle = '#dcc896';
    ctx.font = 'bold 19px Georgia, serif';
    ctx.fillText(`-- ${section.title} --`, Math.round(px + 30), Math.round(y + 14));
    y += 24;
    // Items rendered with inline icons in the item's color
    for (const item of section.items) {
      const itemColor = item.color || HELP_WHITE;
      const usedH = drawIconTextLeft(item.text, px + 50, y, innerW - 40, fontSize, itemColor);
      y += usedH + lineGap;
    }
    y += sectionGap;
  }
  // Calculate max scroll
  const totalH = (y + helpScrollY) - (contentTop + 16);
  const maxScroll = Math.max(0, totalH - contentH);
  if (helpScrollY > maxScroll) helpScrollY = maxScroll;

  ctx.restore();

  // Scrollbar if content overflows
  if (maxScroll > 0) {
    const sbW = 12;
    const sbX = px + pw - sbW - 6;
    ctx.fillStyle = 'rgba(30, 28, 25, 0.9)';
    ctx.fillRect(sbX, contentTop, sbW, contentH);
    const thumbRatio = contentH / totalH;
    const thumbH = Math.max(20, contentH * thumbRatio);
    const thumbY = contentTop + (helpScrollY / maxScroll) * (contentH - thumbH);
    ctx.fillStyle = '#8c8068';
    ctx.fillRect(sbX, thumbY, sbW, thumbH);
    ctx.strokeStyle = '#b4a078';
    ctx.lineWidth = 1;
    ctx.strokeRect(sbX, thumbY, sbW, thumbH);
  }

  // Close button (bottom-right of panel)
  const btnW = 160, btnH = 40;
  const btnX = px + pw - btnW - 16;
  const btnY = py + ph - btnH - 12;
  const hov = hitTest(mouseX, mouseY, { x: btnX, y: btnY, w: btnW, h: btnH });
  ctx.fillStyle = hov ? '#504638' : '#3c3228';
  ctx.fillRect(btnX, btnY, btnW, btnH);
  ctx.strokeStyle = '#b4a078';
  ctx.lineWidth = 2;
  ctx.strokeRect(btnX, btnY, btnW, btnH);
  ctx.fillStyle = Colors.WHITE;
  ctx.font = 'bold 16px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Close (H)', btnX + btnW / 2, btnY + btnH / 2);
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
}

// ============================================================
// OPTIONS SCREEN
// ============================================================

function handleOptionsClick(x, y) {
  const boxW = 440, boxH = 300;
  const boxX = (SCREEN_WIDTH - boxW) / 2, boxY = (SCREEN_HEIGHT - boxH) / 2;
  const btnW = 280, btnH = 50;
  const btnX = boxX + (boxW - btnW) / 2;

  // Run Fast toggle
  const rfY = boxY + 100;
  if (hitTest(x, y, { x: btnX, y: rfY, w: btnW, h: btnH })) {
    runFast = !runFast;
    return;
  }
  // Back button
  const backY = boxY + boxH - btnH - 20;
  if (hitTest(x, y, { x: btnX, y: backY, w: btnW, h: btnH })) {
    state = optionsReturnState || GameState.MENU;
    return;
  }
}

function drawOptionsScreen() {
  // Draw underlying state for context
  if (optionsReturnState === GameState.INGAME_MENU) {
    drawIngameMenu();
  } else if (optionsReturnState === GameState.MENU) {
    drawMenu();
  }
  // Darken
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  // Clear any button rects from underlying draws
  menuButtons.length = 0;

  const boxW = 440, boxH = 300;
  const boxX = (SCREEN_WIDTH - boxW) / 2, boxY = (SCREEN_HEIGHT - boxH) / 2;
  ctx.fillStyle = 'rgba(45, 45, 55, 0.95)';
  ctx.fillRect(boxX, boxY, boxW, boxH);
  ctx.strokeStyle = Colors.GOLD;
  ctx.lineWidth = 3;
  ctx.strokeRect(boxX, boxY, boxW, boxH);

  // Title
  ctx.shadowColor = 'rgba(0,0,0,0.9)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = Colors.GOLD;
  ctx.font = 'bold 34px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('Options', SCREEN_WIDTH / 2, boxY + 50);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  const btnW = 280, btnH = 50;
  const btnX = boxX + (boxW - btnW) / 2;

  // Run Fast toggle
  const rfY = boxY + 100;
  const rfLabel = runFast ? '✓ Run Fast' : 'Run Fast';
  drawStyledButton(btnX, rfY, btnW, btnH, rfLabel, null, 'large', 20);
  menuButtons.pop();
  if (runFast) {
    ctx.strokeStyle = Colors.GREEN;
    ctx.lineWidth = 2;
    ctx.strokeRect(btnX + 1, rfY + 1, btnW - 2, btnH - 2);
  }

  // Back button
  const backY = boxY + boxH - btnH - 20;
  drawStyledButton(btnX, backY, btnW, btnH, '< Back', null, 'large', 20);
  menuButtons.pop();

  ctx.textAlign = 'left';
}

// ============================================================
// IN-GAME MENU
// ============================================================

function getIngameMenuBtnRects() {
  const btnW = 280, btnH = 56, gap = 12;
  const items = [
    { label: 'Resume', action: 'resume' },
    { label: 'Save Game', action: 'save', enabled: previousState === GameState.MAP },
    { label: 'Load Game', action: 'load' },
    { label: 'Options', action: 'options' },
    { label: 'Main Menu', action: 'quit' },
  ];
  const totalH = items.length * (btnH + gap) - gap;
  const startX = (SCREEN_WIDTH - btnW) / 2;
  const startY = (SCREEN_HEIGHT - totalH) / 2 + 20;
  return items.map((item, i) => ({
    x: startX, y: startY + i * (btnH + gap), w: btnW, h: btnH, ...item,
  }));
}

function handleIngameMenuClick(x, y) {
  for (const btn of getIngameMenuBtnRects()) {
    if (!hitTest(x, y, btn)) continue;
    if (btn.action === 'resume') {
      state = previousState || GameState.MAP;
    } else if (btn.action === 'save' && btn.enabled) {
      saveLoadReturnState = GameState.INGAME_MENU;
      state = GameState.SAVE_GAME;
    } else if (btn.action === 'load') {
      saveLoadReturnState = GameState.INGAME_MENU;
      loadTab = 'manual';
      loadSelectedIndex = -1;
      refreshLoadEntries();
      state = GameState.LOAD_GAME;
    } else if (btn.action === 'options') {
      optionsReturnState = state; // remember we came from INGAME_MENU
      state = GameState.OPTIONS_SCREEN;
    } else if (btn.action === 'help') {
      helpScrollY = 0;
      state = GameState.HELP_SCREEN;
    } else if (btn.action === 'quit') {
      state = GameState.MENU;
      player = null;
      currentMap = null;
      currentEncounter = null;
    }
    return;
  }
}

function drawIngameMenu() {
  // Draw the previous game state underneath so the game shows through
  const ps = previousState;
  if (ps === GameState.COMBAT || ps === GameState.TARGETING || ps === GameState.MODAL_SELECT) {
    drawCombat();
  } else if (ps === GameState.MAP) {
    drawMap();
  } else if (ps === GameState.ENCOUNTER_TEXT) {
    drawEncounterText();
  } else if (ps === GameState.ENCOUNTER_CHOICE) {
    drawEncounterChoice();
  }

  // Block all background interactions: clear hover/click hit areas registered by the underlying game
  cardBadgeHitAreas.length = 0;
  iconHitAreas.length = 0;
  menuButtons.length = 0;

  // Full semi-transparent black overlay
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

  // Menu box (grey with gold border, matches load screen)
  const boxW = 440, boxH = 460;
  const boxX = (SCREEN_WIDTH - boxW) / 2, boxY = (SCREEN_HEIGHT - boxH) / 2;
  ctx.fillStyle = 'rgba(45, 45, 55, 0.95)';
  ctx.fillRect(boxX, boxY, boxW, boxH);
  ctx.strokeStyle = Colors.GOLD;
  ctx.lineWidth = 3;
  ctx.strokeRect(boxX, boxY, boxW, boxH);

  // Title in gold with shadow
  ctx.shadowColor = 'rgba(0,0,0,0.9)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = Colors.GOLD;
  ctx.font = 'bold 38px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('PAUSED', SCREEN_WIDTH / 2, boxY + 55);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Buttons using the wooden plank styled button (sprite from End Turn button)
  for (const btn of getIngameMenuBtnRects()) {
    const enabled = btn.enabled !== false;
    if (!enabled) ctx.globalAlpha = 0.45;
    drawStyledButton(btn.x, btn.y, btn.w, btn.h, btn.label, null, 'large', 22);
    if (!enabled) {
      ctx.globalAlpha = 1;
      // Show "(map only)" hint below
      ctx.fillStyle = '#aaa';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('(map only)', btn.x + btn.w / 2, btn.y + btn.h + 12);
    }
    // Click is handled by handleIngameMenuClick using getIngameMenuBtnRects directly
    menuButtons.pop();
  }

  ctx.textAlign = 'left';
}

// ============================================================
// FADE TRANSITIONS
// ============================================================

function startFade(callback, targetState = null, speed = 8) {
  fadeAlpha = 0;
  fadePhase = 'out';
  fadeCallback = callback;
  fadeTargetState = targetState;
  fadeSpeed = speed;
  state = GameState.FADING;
}

function updateFade(dt) {
  if (!fadePhase) return;
  const step = fadeSpeed * (dt / 16); // normalize to ~60fps
  if (fadePhase === 'out') {
    fadeAlpha = Math.min(255, fadeAlpha + step);
    if (fadeAlpha >= 255) {
      if (fadeCallback) fadeCallback();
      fadeCallback = null;
      if (fadeTargetState) state = fadeTargetState;
      fadeTargetState = null;
      fadePhase = 'in';
    }
  } else if (fadePhase === 'in') {
    fadeAlpha = Math.max(0, fadeAlpha - step);
    if (fadeAlpha <= 0) {
      fadePhase = '';
      fadeAlpha = 0;
    }
  }
}

// ============================================================
// TITLE CARDS
// ============================================================

function showTitleCard(title, subtitle = '', callback = null) {
  titleCardText = title;
  titleCardSubtitle = subtitle;
  titleCardAlpha = 0;
  titleCardPhase = 'in';
  titleCardTimer = 0;
  titleCardCallback = callback;
  state = GameState.TITLE_CARD;
}

function updateTitleCard(dt) {
  if (!titleCardPhase) return;
  const step = 4 * (dt / 16);
  if (titleCardPhase === 'in') {
    titleCardAlpha = Math.min(255, titleCardAlpha + step);
    if (titleCardAlpha >= 255) {
      titleCardPhase = 'hold';
      titleCardTimer = 2000; // 2 seconds hold
    }
  } else if (titleCardPhase === 'hold') {
    titleCardTimer -= dt;
    if (titleCardTimer <= 0) {
      titleCardPhase = 'out';
    }
  } else if (titleCardPhase === 'out') {
    titleCardAlpha = Math.max(0, titleCardAlpha - step);
    if (titleCardAlpha <= 0) {
      titleCardPhase = '';
      if (titleCardCallback) titleCardCallback();
      titleCardCallback = null;
    }
  }
}

function dismissTitleCard() {
  if (titleCardPhase === 'hold' || titleCardPhase === 'in') {
    titleCardPhase = 'out';
    titleCardAlpha = 255;
  }
}

// ============================================================
// CHAPTER END SEQUENCE (post-leave-prison → level up)
// ============================================================

// Text blocks shown at each chapter-end stage. Mirrors the PY game's
// `chapter_end_stage` flow — stage 0 is the freedom narrative, stage 1
// is the rest + level-up dialog that flows into ABILITY_SELECT.
const CHAPTER_END_TEXTS = [
  [
    'You step through the door and into the light. The mountain air fills your lungs as you shield your eyes from the sun. Behind you, the dark corridors of the Kobold warren fade into memory.',
    'You are free. But the road to Qualibaf still lies ahead, and the mountains hold many more dangers...',
  ],
  [
    'You start climbing down the mountain path toward the river. After hours of walking, you find a sheltered clearing with a small stream. Apple trees and berry bushes grow wild here.',
    'You gather food, light a small fire, and lay down your weary body. The warmth of the flames and the sound of flowing water eventually lull you to sleep...',
    'You feel stronger. Your experiences in the prison have taught you much.',
    'Level Up!',
  ],
];

function handleChapterEndClick(_x, _y) {
  // Click advances through the chapter-end stages. After the last stage,
  // hand off to the ability-select → perk-select → deck-tutorial → rest
  // inventory flow.
  chapterEndStage++;
  if (chapterEndStage >= CHAPTER_END_TEXTS.length) {
    // Kick off the level-up ability selection (tier 1 — matches the game
    // start). The existing handleAbilitySelectClick routes to PERK_SELECT
    // when level >= 2, and we hook the deck tutorial in at perk-pick time.
    abilityChoices = getAbilityChoices(selectedClass, 3);
    state = GameState.ABILITY_SELECT;
  }
}

function drawChapterEnd() {
  // Background: the "Leaving Prison" art gives the freedom-in-the-mountains
  // vibe. Fall back to deep indigo if the asset hasn't loaded.
  const bg = getEncounterBgImage('bg_leaving_prison');
  if (bg) {
    ctx.drawImage(bg, 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  } else {
    ctx.fillStyle = '#0e0e14';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  }
  // Darkening overlay so the dialog panel reads comfortably.
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

  const stage = Math.min(chapterEndStage, CHAPTER_END_TEXTS.length - 1);
  const texts = CHAPTER_END_TEXTS[stage];

  // Dialog panel centered on screen. Warm brown tone matches the outdoor
  // leaving-prison background (not the cold purple used for dungeon UI).
  const panelW = 960;
  const panelH = 520;
  const panelX = Math.round((SCREEN_WIDTH - panelW) / 2);
  const panelY = Math.round((SCREEN_HEIGHT - panelH) / 2);
  ctx.fillStyle = 'rgba(0,0,0,0.88)';
  ctx.fillRect(panelX, panelY, panelW, panelH);
  ctx.strokeStyle = Colors.GOLD;
  ctx.lineWidth = 2;
  ctx.strokeRect(panelX, panelY, panelW, panelH);

  ctx.textAlign = 'left';
  let cursorY = panelY + 60;
  const innerX = panelX + 40;
  const innerW = panelW - 80;
  const lineH = 30;
  const paragraphGap = 22;
  ctx.font = '21px Georgia, serif';
  ctx.fillStyle = Colors.WHITE;
  for (let i = 0; i < texts.length; i++) {
    const t = texts[i];
    // The dramatic "Level Up!" line gets the gold exclaim treatment.
    const isLevelUp = t === 'Level Up!';
    if (isLevelUp) {
      ctx.font = 'bold 32px Georgia, serif';
      ctx.fillStyle = Colors.GOLD;
      ctx.textAlign = 'center';
      cursorY += 12;
      ctx.fillText(t, panelX + panelW / 2, cursorY + 22);
      cursorY += 38;
      ctx.textAlign = 'left';
      ctx.font = '21px Georgia, serif';
      ctx.fillStyle = Colors.WHITE;
      continue;
    }
    const lines = wrapTextLong(t, innerW, 21);
    for (const line of lines) {
      ctx.fillText(line, innerX, cursorY);
      cursorY += lineH;
    }
    cursorY += paragraphGap;
  }

  // Prompt at the bottom.
  ctx.fillStyle = Colors.GRAY;
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  const promptText = chapterEndStage + 1 < CHAPTER_END_TEXTS.length
    ? 'Click to continue...'
    : 'Click to choose a new ability...';
  ctx.fillText(promptText, panelX + panelW / 2, panelY + panelH - 24);
  ctx.textAlign = 'left';
}

// ============================================================
// DECK TUTORIAL (one-time, before first rest inventory)
// ============================================================

// Bottom-aligned "Continue" button rect — computed during draw so the
// click handler hits the exact pixels the player sees.
let _deckTutorialContinueRect = null;

function handleDeckTutorialClick(x, y) {
  if (_deckTutorialContinueRect && hitTest(x, y, _deckTutorialContinueRect)) {
    shownDeckTutorial = true;
    restMode = true;
    state = GameState.INVENTORY;
  }
}

const DECK_TUTORIAL_LINES = [
  { text: 'Your deck is your life force. Every card in your deck is 1 HP.', color: null },
  { text: '', color: null },
  { text: 'Each card type has a maximum limit for your deck:', color: null },
  { text: '  Weapons, Armor, Abilities, Items, and Allies.', color: null },
  { text: '', color: null },
  { text: 'Blue numbers mean you have room to add more cards of that type.', color: '#78c8ff' },
  { text: 'Red numbers mean you have too many — move some to your backpack.', color: '#c83c3c' },
  { text: 'White numbers mean you are at the limit — perfectly balanced.', color: '#ffffff' },
  { text: '', color: null },
  { text: 'You can move cards between your deck and backpack by clicking them.', color: null },
  { text: 'Cards in your backpack don\'t count as HP but are kept for later.', color: null },
  { text: '', color: null },
  { text: 'Each class can only equip certain armor and weapon types.', color: null },
  { text: 'Check your character sheet to see which gear your class can use.', color: null },
  { text: '', color: null },
  { text: 'You can only have up to 3 copies of the same card in your deck.', color: null },
];

function drawDeckTutorial() {
  // Same moody backdrop as the chapter-end sequence.
  const bg = getEncounterBgImage('bg_leaving_prison');
  if (bg) {
    ctx.drawImage(bg, 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  } else {
    ctx.fillStyle = '#0e0e14';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  }
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

  // Title
  ctx.fillStyle = Colors.GOLD;
  ctx.font = 'bold 44px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('Deck Balancing', SCREEN_WIDTH / 2, 90);

  // Panel
  const panelW = 960;
  const panelH = 620;
  const panelX = Math.round((SCREEN_WIDTH - panelW) / 2);
  const panelY = 140;
  ctx.fillStyle = 'rgba(0,0,0,0.88)';
  ctx.fillRect(panelX, panelY, panelW, panelH);
  ctx.strokeStyle = Colors.GOLD;
  ctx.lineWidth = 2;
  ctx.strokeRect(panelX, panelY, panelW, panelH);

  ctx.textAlign = 'left';
  ctx.font = '20px Georgia, serif';
  let cursorY = panelY + 50;
  const innerX = panelX + 48;
  const lineH = 30;
  for (const entry of DECK_TUTORIAL_LINES) {
    if (entry.text === '') {
      cursorY += 14;
      continue;
    }
    ctx.fillStyle = entry.color || '#e8e4d8';
    ctx.fillText(entry.text, innerX, cursorY);
    cursorY += lineH;
  }

  // Continue button
  const btnW = 240;
  const btnH = 52;
  const btnX = Math.round((SCREEN_WIDTH - btnW) / 2);
  const btnY = panelY + panelH - btnH - 24;
  _deckTutorialContinueRect = { x: btnX, y: btnY, w: btnW, h: btnH };
  const hov = hitTest(mouseX, mouseY, _deckTutorialContinueRect);
  ctx.fillStyle = hov ? '#4a3a6e' : '#2a1a4e';
  ctx.fillRect(btnX, btnY, btnW, btnH);
  ctx.strokeStyle = Colors.GOLD;
  ctx.lineWidth = 2;
  ctx.strokeRect(btnX, btnY, btnW, btnH);
  ctx.fillStyle = Colors.GOLD;
  ctx.font = 'bold 22px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Continue', btnX + btnW / 2, btnY + btnH / 2);
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
}

function drawTitleCard() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

  const alpha = titleCardAlpha / 255;

  // Calculate vertical centering based on what's shown
  const cy = Math.round(SCREEN_HEIGHT / 2);
  const titleY = titleCardSubtitle ? cy - 30 : cy;
  const subY = cy + 36;

  // Title — bigger, crisper using rgba directly (avoids globalAlpha blur)
  const goldRgba = `rgba(255, 215, 0, ${alpha})`;
  ctx.fillStyle = goldRgba;
  ctx.font = 'bold 64px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(titleCardText, Math.round(SCREEN_WIDTH / 2), titleY);

  if (titleCardSubtitle) {
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.font = '28px Georgia, serif';
    ctx.fillText(titleCardSubtitle, Math.round(SCREEN_WIDTH / 2), subY);
  }

  ctx.fillStyle = `rgba(160, 160, 160, ${alpha * 0.8})`;
  ctx.font = '14px sans-serif';
  ctx.fillText('Click to continue', Math.round(SCREEN_WIDTH / 2), SCREEN_HEIGHT - 80);

  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
}

// ============================================================
// DAMAGE NUMBER ANIMATIONS
// ============================================================

// Floats spawned within ~150 ms of each other get auto-staggered in time so
// multi-effect cards (Battle Fury = +1 Heroism + +1 Shield) don't overlap.
// Each float reserves an upcoming "slot" in this shared timeline.
let _floatNextSlotAt = 0;
const FLOAT_SLOT_MS = 180;

// Spawn a damage number at a specific position
function spawnDamageNumber(x, y, text, color = Colors.RED) {
  const now = performance.now();
  const delay = Math.max(0, _floatNextSlotAt - now);
  _floatNextSlotAt = now + delay + FLOAT_SLOT_MS;
  damageNumbers.push({
    x: x + (Math.random() - 0.5) * 20,
    y,
    text,
    color,
    timer: 1500,
    vy: -3.0,
    delay, // ms to wait before showing/animating
  });
}

// Spawn a damage number anchored to the bottom of a target's card rect
function spawnDamageOnTarget(target, amount, color = Colors.RED) {
  let rect;
  if (target === player) {
    rect = getCharacterCardRect(true);
  } else if (target === enemy) {
    rect = getCharacterCardRect(false);
  } else {
    // It's a creature — find its rect
    const playerIdx = player.creatures.indexOf(target);
    if (playerIdx !== -1) {
      const rects = getPlayerCreatureRects();
      rect = rects[playerIdx];
    } else {
      const enemyIdx = enemy.creatures.indexOf(target);
      if (enemyIdx !== -1) {
        const rects = getEnemyCreatureRects();
        rect = rects[enemyIdx];
      }
    }
  }
  if (rect) {
    spawnDamageNumber(rect.x + rect.w / 2, rect.y + rect.h - 10, `-${amount}`, color);
  }
}

// Spawn a token gain/apply float (e.g. "+2", "+1") above the target.
// Color carries the meaning — label param kept for backwards compat but ignored.
function spawnTokenOnTarget(target, amount, _label, color) {
  let rect;
  if (target === player) rect = getCharacterCardRect(true);
  else if (target === enemy) rect = getCharacterCardRect(false);
  else {
    const pi = player.creatures.indexOf(target);
    if (pi !== -1) rect = getPlayerCreatureRects()[pi];
    else {
      const ei = enemy.creatures.indexOf(target);
      if (ei !== -1) rect = getEnemyCreatureRects()[ei];
    }
  }
  if (!rect) return;
  spawnDamageNumber(rect.x + rect.w / 2, rect.y + rect.h - 10, `+${amount}`, color);
}

// Float-only colors that intentionally differ from icon palettes so distinct
// effects don't visually collide (e.g. Block vs. Ice both used ICE_BLUE before).
const HEAL_GREEN = '#7cff9c';
const BLOCK_BLUE = '#cfe8ff';
function spawnHealOnTarget(target, amount) {
  let rect;
  if (target === player) {
    rect = getCharacterCardRect(true);
  } else if (target === enemy) {
    rect = getCharacterCardRect(false);
  } else {
    const pi = player.creatures.indexOf(target);
    if (pi !== -1) rect = getPlayerCreatureRects()[pi];
    else {
      const ei = enemy.creatures.indexOf(target);
      if (ei !== -1) rect = getEnemyCreatureRects()[ei];
    }
  }
  if (rect) {
    spawnDamageNumber(rect.x + rect.w / 2, rect.y + rect.h - 10, `+${amount}`, HEAL_GREEN);
  }
}

// Death animation for creatures
let dyingCreatures = []; // { rect, timer, name }
const DEATH_ANIM_DURATION = 900;

function spawnDeathAnimation(creature) {
  // Find the creature's rect before it's removed
  let rect;
  const playerIdx = player.creatures.indexOf(creature);
  if (playerIdx !== -1) {
    const rects = getPlayerCreatureRects();
    rect = rects[playerIdx];
  } else {
    const enemyIdx = enemy.creatures.indexOf(creature);
    if (enemyIdx !== -1) {
      const rects = getEnemyCreatureRects();
      rect = rects[enemyIdx];
    }
  }
  if (rect) {
    dyingCreatures.push({
      x: rect.x, y: rect.y, w: rect.w, h: rect.h,
      timer: DEATH_ANIM_DURATION,
      name: creature.name,
    });
  }
}

function updateDamageNumbers(dt) {
  for (const dn of damageNumbers) {
    if (dn.delay && dn.delay > 0) {
      dn.delay -= dt;
      continue; // still waiting — don't fade or drift yet
    }
    dn.timer -= dt;
    dn.y += dn.vy * (dt / 16);
  }
  damageNumbers = damageNumbers.filter(dn => dn.timer > 0);
  // Update death animations
  for (const da of dyingCreatures) da.timer -= dt;
  dyingCreatures = dyingCreatures.filter(da => da.timer > 0);
}

function drawDamageNumbers() {
  // Draw death animations first (behind damage numbers)
  for (const da of dyingCreatures) {
    const progress = 1 - da.timer / DEATH_ANIM_DURATION; // 0→1
    const alpha = 1 - progress;
    const shake = (1 - progress) * 6;
    const sx = Math.round((Math.random() - 0.5) * shake * 2);
    const sy = Math.round((Math.random() - 0.5) * shake * 2);
    const scale = 1 - progress * 0.3; // shrink to 70%
    const cx = da.x + da.w / 2, cy = da.y + da.h / 2;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(cx + sx, cy + sy);
    ctx.scale(scale, scale);
    // Red flash overlay
    ctx.fillStyle = `rgba(255, 40, 40, ${alpha * 0.6})`;
    ctx.fillRect(-da.w / 2, -da.h / 2, da.w, da.h);
    ctx.restore();
  }

  // Draw floating damage numbers (skip ones still waiting for their stagger slot)
  for (const dn of damageNumbers) {
    if (dn.delay && dn.delay > 0) continue;
    const alpha = Math.min(1, dn.timer / 500);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#000';
    ctx.font = 'bold 28px Georgia, serif';
    ctx.textAlign = 'center';
    // Shadow for readability
    ctx.fillText(dn.text, dn.x + 2, dn.y + 2);
    ctx.fillStyle = dn.color;
    ctx.fillText(dn.text, dn.x, dn.y);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}

// ============================================================
// FOG OF WAR
// ============================================================

// Offscreen canvas for fog of war compositing
let fogCanvas = null;
let fogCtx = null;

function drawFogOfWar(currentArea) {
  if (!currentMap) return;
  const currentNode = currentMap.getCurrentNode();
  if (!currentNode) return;

  // Fog applies to all non-outdoor areas (matching Python game)
  const outdoorAreas = new Set(['mountain_path', 'plains', 'arriving_city', 'qualibaf', 'north_qualibaf', 'tharnag', 'grand_hall', 'grand_staircase', 'throne_room', 'artisan_hall', 'personal_quarters', 'volcano']);
  if (outdoorAreas.has(currentArea)) return;

  // Create offscreen fog canvas if needed
  if (!fogCanvas) {
    fogCanvas = document.createElement('canvas');
    fogCanvas.width = SCREEN_WIDTH;
    fogCanvas.height = SCREEN_HEIGHT;
    fogCtx = fogCanvas.getContext('2d');
  }

  // Count nodes in this area to pick fog scale (matches Python game)
  const areaNodeCount = Object.values(currentMap.nodes).filter(n => n.mapArea === currentArea).length;
  const fogScale = areaNodeCount <= 5 ? 1.75 : 1.25;

  // Fill fog with near-opaque black
  fogCtx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  fogCtx.fillStyle = 'rgba(0,0,0,1)';
  fogCtx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

  // Punch holes using destination-out on the fog canvas
  fogCtx.globalCompositeOperation = 'destination-out';

  const { scale: mapScale, toScreen } = getMapTransform(currentArea);
  const accessible = currentMap.getAccessibleNodes().map(n => n.id);
  for (const [id, node] of Object.entries(currentMap.nodes)) {
    if (node.mapArea !== currentArea) continue;
    const { x: nx, y: ny } = toScreen(node.position);

    let revealSize;
    if (id === currentMap.currentNodeId) {
      revealSize = Math.round(220 * fogScale * mapScale);
    } else if (visitedNodes.has(id)) {
      revealSize = Math.round(160 * fogScale * mapScale);
    } else if (accessible.includes(id)) {
      revealSize = Math.round(80 * fogScale * mapScale);
    } else {
      continue;
    }

    // Dim outer glow (1.4x, softly reveals surroundings)
    const dimSize = Math.round(revealSize * 1.4);
    drawFogHole(fogCtx, nx, ny, dimSize, 0.3);
    // Bright inner reveal
    drawFogHole(fogCtx, nx, ny, revealSize, 1);
  }

  fogCtx.globalCompositeOperation = 'source-over';

  // Blit fog onto main canvas
  ctx.drawImage(fogCanvas, 0, 0);
}

function drawFogHole(fCtx, x, y, radius, intensity) {
  const gradient = fCtx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, `rgba(0,0,0,${intensity})`);
  gradient.addColorStop(0.4, `rgba(0,0,0,${intensity * 0.7})`);
  gradient.addColorStop(0.7, `rgba(0,0,0,${intensity * 0.2})`);
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  fCtx.fillStyle = gradient;
  fCtx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

// ============================================================
// GAME LOOP
// ============================================================

function gameLoop(timestamp) {
  const dt = timestamp - lastTime;
  lastTime = timestamp;

  // Update enemy turn timer
  if (!isPlayerTurn && (state === GameState.COMBAT || state === GameState.TARGETING)) {
    updateEnemyTurn(dt);
  }

  // Update combat intro timer
  if (combatIntroTimer > 0) combatIntroTimer = Math.max(0, combatIntroTimer - dt);

  // Update toast timer
  if (toastTimer > 0 && !toastSticky) toastTimer = Math.max(0, toastTimer - dt);

  // Update rest error timer
  if (_restErrorTimer > 0) _restErrorTimer = Math.max(0, _restErrorTimer - dt);

  // Update map movement animation
  if (state === GameState.MAP) updateMapMoveAnim(dt);

  // Update fade
  updateFade(dt);

  // Update title card
  updateTitleCard(dt);

  // Update damage numbers
  updateDamageNumbers(dt);

  // Update screen flash timer
  if (screenFlashTimer > 0) screenFlashTimer = Math.max(0, screenFlashTimer - dt);

  draw();

  // Draw screen flash (red overlay for damage events)
  drawScreenFlash();

  // Draw toast message (transient on-screen yellow message)
  if (toastTimer > 0 && toastMessage) drawToast();

  // Draw card badge / icon tooltip (above cards, below fade)
  // Skip when a blocking menu is open — tooltips should not bleed through menus
  // Help screen DOES allow icon tooltips for keyword reference
  const menuOpen = state === GameState.INGAME_MENU || state === GameState.SAVE_GAME ||
                   state === GameState.LOAD_GAME;
  if (!menuOpen) {
    drawBadgeTooltip();
    drawIconTooltip();
  }

  // Draw fade overlay on top of everything
  if (fadeAlpha > 0) {
    ctx.fillStyle = `rgba(0,0,0,${fadeAlpha / 255})`;
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  }

  // Draw damage number animations on top
  drawDamageNumbers();

  requestAnimationFrame(gameLoop);
}

// ============================================================
// CODEX (debug-only card library viewer)
// ============================================================

// State
let codexTab = 'player';           // 'player' | 'enemy' | 'characters' | 'loot' | 'decks' | 'perks'
let codexLootHighlightId = null;   // id of a loot table to spotlight (gold border)
let codexDeckHighlightId = null;   // id of a deck to spotlight
let codexDeckSide = 'all';         // 'all' | 'player' | 'enemy' (Decks-tab subfilter)
let codexSearchText = '';          // current search query (loot/decks tabs)
let codexSearchActive = false;     // input focused (captures keystrokes)
let codexLootRollResults = {};     // tableId -> { card, ts } (last roll, for "Test")
let codexFilter = 'all';
let codexSelectedCard = null;      // selected card or pseudo-card object
let codexShowFull = false;         // false = small format, true = full preview
let codexScrollY = 0;
let codexClickAreas = [];          // refilled each frame (cards, tabs, filters, toggles)

// Power creators (drawn as if they were ability cards via drawPowerCard)
const ALL_POWER_CREATORS = [
  createCleave, createAimedShot, createElementalInfusion,
  createQuickStrike, createBattleFury, createFeralForm,
  createChunkyBite, createDireFury, createSplit,
  () => createArmorPower(1),
];

// Extra player-side cards not in CARD_REGISTRY because they're never
// persistent (Goodberry tokens, the four power-choice cards). The codex
// surfaces them so players can still inspect what their cards/powers spawn.
// Goodberry is a true token (isToken:true → Tokens tab); the four
// power-choice cards are abilities (subtype:'ability' → Ability tab).
const ALL_EXTRA_CARD_CREATORS = [
  createGoodberry,
  createFireToken, createIceToken,
  createCatFormToken, createBearFormToken,
];

// Class powers (player-side). Anything in ALL_POWER_CREATORS not in this set
// is an enemy power.
const PLAYER_POWER_IDS = new Set([
  'cleave', 'aimed_shot', 'elemental_infusion',
  'quick_strike', 'battle_fury', 'feral_form',
]);

// Subtype → category mapping used by the codex filters. Each card has at most
// one subtype, so a card lives in exactly one of these buckets (with token /
// summon overrides handled in passesCodexCardFilter).
const CODEX_SUBTYPE_TO_CATEGORY = {
  // Weapons
  weapon: 'weapons', martial: 'weapons', simple: 'weapons',
  martial_2h: 'weapons', ranged: 'weapons', ranged_2h: 'weapons',
  wand: 'weapons', staff: 'weapons', shield: 'weapons',
  // Armor
  armor: 'armor', heavy_armor: 'armor', light_armor: 'armor', clothing: 'armor',
  // Items
  item: 'items', potion: 'items', food: 'items', scroll: 'items',
  // Ability (what shows in the bottom-left of the card)
  ability: 'ability',
  // Relics
  relic: 'relics',
  // Allies
  ally: 'allies', allies: 'allies', companion: 'allies',
};

// Heroes / monsters for the second tab.
const HERO_NAMES = ['Paladin', 'Ranger', 'Wizard', 'Rogue', 'Warrior', 'Druid'];

function getCodexCardEntries() {
  // Build a rich list from CARD_REGISTRY (cards) + token cards + powers.
  const entries = [];
  const seenIds = new Set();
  for (const [id, creator] of Object.entries(CARD_REGISTRY)) {
    let card; try { card = creator(); } catch (e) { continue; }
    if (!card) continue;
    seenIds.add(id);
    entries.push({ kind: 'card', id, card });
  }
  // Extra non-persistent player-side cards (Goodberry + power-choice cards).
  for (const creator of ALL_EXTRA_CARD_CREATORS) {
    let card; try { card = creator(); } catch (e) { continue; }
    if (!card || seenIds.has(card.id)) continue;
    seenIds.add(card.id);
    entries.push({ kind: 'card', id: card.id, card, side: 'player' });
  }
  // Mark CARD_REGISTRY entries as player-side (they're collected first above
  // without a side tag — patch them now).
  for (const e of entries) if (e.kind === 'card' && !e.side) e.side = 'player';

  const cache = buildCodexSourceCache();

  // Enemy-only cards — collected from enemy deck masterDecks but not in
  // CARD_REGISTRY or extras. The cache stores the actual Card instances.
  for (const [id, card] of Object.entries(cache.enemyOnlyCards)) {
    if (seenIds.has(id)) continue;
    seenIds.add(id);
    entries.push({ kind: 'card', id, card, side: 'enemy' });
  }

  for (const creator of ALL_POWER_CREATORS) {
    let pwr; try { pwr = creator(); } catch (e) { continue; }
    if (!pwr) continue;
    const side = PLAYER_POWER_IDS.has(pwr.id) ? 'player' : 'enemy';
    entries.push({ kind: 'power', id: pwr.id, card: pwr, side });
  }
  // Creatures collected from card previewCreature fields, enemy creature
  // lists, and a few standalone player summons. Side comes from
  // _codexSide stamped during cache building.
  for (const cr of cache.creatures) {
    entries.push({ kind: 'creature', id: `creature_${cr.name}`, card: cr, side: cr._codexSide || 'enemy' });
  }
  return entries;
}

function getCodexCardFilters() {
  // Subtype-driven categories that match what's shown on the bottom-left of
  // the card. Engine cardType (ABILITY vs DEFENSE etc.) does NOT influence
  // categorization — Dwarven Tower Shield is a heavy_armor, so it goes under
  // Armor even though it's mechanically an ABILITY (player-turn-only).
  return [
    { id: 'all',     label: 'All' },
    { id: 'weapons', label: 'Weapons' },
    { id: 'armor',   label: 'Armor' },
    { id: 'items',   label: 'Items' },
    { id: 'ability', label: 'Ability' },
    { id: 'relics',  label: 'Relics' },
    { id: 'allies',  label: 'Allies' },
    { id: 'summons', label: 'Summons' },
    { id: 'powers',  label: 'Powers' },
    { id: 'tokens',  label: 'Tokens' },
  ];
}

function passesCodexCardFilter(entry, filter) {
  if (filter === 'all') return true;
  if (filter === 'powers')  return entry.kind === 'power';
  if (filter === 'summons') return entry.kind === 'creature';
  // All remaining filters target deck cards.
  if (entry.kind !== 'card') return false;
  const c = entry.card;
  if (filter === 'tokens') return c.isToken === true;
  // Subtype-based categories (weapons / armor / items / ability / relics / allies)
  const cat = CODEX_SUBTYPE_TO_CATEGORY[(c.subtype || '').toLowerCase()];
  return cat === filter;
}

function getCodexCharacterFilters() {
  return [
    { id: 'all',     label: 'All' },
    { id: 'heroes',  label: 'Heroes' },
    { id: 'monsters',label: 'Monsters' },
  ];
}

// Layout
const CODEX_TITLE_H = 44;
const CODEX_TAB_H = 40;
const CODEX_FILTER_H = 38;
const CODEX_RIGHT_W = 320;     // stats panel width
const CODEX_PADDING = 16;

function getCodexLayout() {
  const x = 0, y = 0;
  const titleY = 0;
  const tabY = titleY + CODEX_TITLE_H;
  const filterY = tabY + CODEX_TAB_H;
  const gridY = filterY + CODEX_FILTER_H + 8;
  const gridW = SCREEN_WIDTH - CODEX_RIGHT_W - CODEX_PADDING * 2;
  const gridH = SCREEN_HEIGHT - gridY - CODEX_PADDING;
  const gridX = CODEX_PADDING;
  const rightX = gridX + gridW + CODEX_PADDING;
  const rightY = gridY;
  const rightH = gridH;
  return { titleY, tabY, filterY, gridX, gridY, gridW, gridH, rightX, rightY, rightH };
}

// === Drawing ===
function drawCodex() {
  codexClickAreas = [];
  codexHScrollbarBounds = [];
  // Hover previews: while Shift is held, pin whichever preview was active so
  // the player can mouse over keyword icons (Sentinel, Heroism, Shield, …)
  // to read tooltips. Without Shift, reset each frame so previews only
  // reflect what's hovered in the codex.
  if (isShiftFrozen()) {
    hoveredCardPreview = shiftFreezeCard;
    hoveredPowerPreview = shiftFreezePower;
    hoveredCreaturePreview = shiftFreezeCreature;
  } else {
    hoveredCardPreview = null;
    hoveredPowerPreview = null;
    hoveredCreaturePreview = null;
  }

  // Background
  ctx.fillStyle = '#161628';
  ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

  const L = getCodexLayout();

  // Title bar
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, SCREEN_WIDTH, CODEX_TITLE_H);
  ctx.fillStyle = Colors.GOLD;
  ctx.font = 'bold 26px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('Codex (Debug)', 16, CODEX_TITLE_H / 2);
  ctx.fillStyle = Colors.GRAY;
  ctx.font = '13px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('ESC or C to close · scroll to browse', SCREEN_WIDTH - 16, CODEX_TITLE_H / 2);
  ctx.textBaseline = 'alphabetic';

  // Tabs
  drawCodexTabs(L);

  // Filters + (cards-tab) format toggle
  drawCodexFilters(L);

  // Grid — 'player' and 'enemy' tabs show cards/powers/creatures pre-filtered
  // by side. 'characters' shows hero / monster portraits. 'loot' shows each
  // loot table as a row of cards with drop %. 'decks' lists starter decks +
  // monster decks with stack-count badges.
  if      (codexTab === 'characters') drawCodexCharacterGrid(L);
  else if (codexTab === 'loot')       drawCodexLootGrid(L);
  else if (codexTab === 'decks')      drawCodexDecksGrid(L);
  else if (codexTab === 'perks')      drawCodexPerkGrid(L);
  else                                drawCodexCardGrid(L);

  // Right-side stats panel
  drawCodexStatsPanel(L);

  // Hover preview piggybacks on the existing system
  if (hoveredCardPreview || hoveredPowerPreview || hoveredCreaturePreview) drawHoverPreview();

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

function drawCodexTabs(L) {
  const tabs = [
    { id: 'player',     label: 'Player Cards' },
    { id: 'enemy',      label: 'Enemy Cards' },
    { id: 'characters', label: 'Heroes & Monsters' },
    { id: 'loot',       label: 'Loot Tables' },
    { id: 'decks',      label: 'Decks' },
    { id: 'perks',      label: 'Perks' },
  ];
  // Dynamic tab width — fit all tabs across the full width. Added a 6th
  // tab (Perks), so the fixed 220 px width no longer fits; computes the
  // widest value that still leaves a left margin and uniform gaps.
  const leftMargin = 16;
  const gap = 8;
  const available = SCREEN_WIDTH - leftMargin * 2;
  const tabW = Math.floor((available - gap * (tabs.length - 1)) / tabs.length);
  let tx = leftMargin;
  ctx.font = 'bold 15px Georgia, serif';
  for (const t of tabs) {
    const active = codexTab === t.id;
    const r = { x: tx, y: L.tabY + 4, w: tabW, h: CODEX_TAB_H - 6 };
    ctx.fillStyle = active ? 'rgba(60, 80, 130, 0.85)' : 'rgba(20, 20, 35, 0.85)';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = active ? Colors.GOLD : '#555';
    ctx.lineWidth = active ? 2 : 1;
    ctx.strokeRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = active ? Colors.GOLD : '#cdd';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(t.label, r.x + r.w / 2, r.y + r.h / 2);
    codexClickAreas.push({ ...r, kind: 'tab', tabId: t.id });
    tx += tabW + gap;
  }
  ctx.textBaseline = 'alphabetic';
}

function drawCodexFilters(L) {
  // Pick the appropriate filter list per tab (characters has heroes/monsters,
  // decks has player/enemy/all, player+enemy use the subtype filters).
  let filters;
  let activeId, clickKind;
  if (codexTab === 'characters') {
    filters = getCodexCharacterFilters(); activeId = codexFilter; clickKind = 'filter';
  } else if (codexTab === 'decks') {
    filters = [
      { id: 'all',    label: 'All' },
      { id: 'player', label: 'Player' },
      { id: 'enemy',  label: 'Monster' },
    ];
    activeId = codexDeckSide; clickKind = 'deck-side';
  } else if (codexTab === 'loot') {
    filters = []; // loot tab has no category filters; just search + Small/Full
  } else if (codexTab === 'perks') {
    // Perks: "All" / "Repeatable" / "Unique" quick filter.
    filters = [
      { id: 'all',        label: 'All' },
      { id: 'repeatable', label: 'Repeatable' },
      { id: 'unique',     label: 'Unique' },
    ];
    activeId = codexFilter; clickKind = 'filter';
  } else {
    filters = getCodexCardFilters(); activeId = codexFilter; clickKind = 'filter';
  }

  // Layout flows left-to-right: category filter pills → search box → Small/Full
  // toggle. Pills shrink their padding (was 18 → 12) so the row fits on tabs
  // with lots of filters. Search + toggle chase whatever `fx` the pills leave.
  let fx = 16;
  ctx.font = 'bold 13px sans-serif';
  for (const f of filters) {
    const w = Math.max(50, ctx.measureText(f.label).width + 12);
    const active = activeId === f.id;
    const r = { x: fx, y: L.filterY + 4, w, h: CODEX_FILTER_H - 8 };
    ctx.fillStyle = active ? 'rgba(80, 60, 130, 0.85)' : 'rgba(20, 20, 35, 0.7)';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = active ? Colors.GOLD : '#666';
    ctx.lineWidth = active ? 2 : 1;
    ctx.strokeRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = active ? Colors.GOLD : '#cdd';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(f.label, r.x + r.w / 2, r.y + r.h / 2);
    codexClickAreas.push({ ...r, kind: clickKind, filterId: f.id });
    fx += w + 4;
  }

  // Search box — positioned immediately right of the last filter pill.
  const searchW = 170;
  const sx = fx + 6;
  const sr = { x: sx, y: L.filterY + 4, w: searchW, h: CODEX_FILTER_H - 8 };
  ctx.fillStyle = codexSearchActive ? 'rgba(40, 50, 80, 0.95)' : 'rgba(20, 20, 35, 0.85)';
  ctx.fillRect(sr.x, sr.y, sr.w, sr.h);
  ctx.strokeStyle = codexSearchActive ? Colors.GOLD : '#666';
  ctx.lineWidth = codexSearchActive ? 2 : 1;
  ctx.strokeRect(sr.x, sr.y, sr.w, sr.h);
  const placeholder =
    codexTab === 'loot'       ? 'Search tables / cards…' :
    codexTab === 'decks'      ? 'Search decks / cards…'  :
    codexTab === 'characters' ? 'Search heroes / monsters…' :
    codexTab === 'perks'      ? 'Search perks…'          :
    'Search cards…';
  ctx.font = '13px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  if (codexSearchText) {
    ctx.fillStyle = '#fff';
    ctx.fillText(codexSearchText + (codexSearchActive ? '|' : ''), sr.x + 8, sr.y + sr.h / 2);
  } else {
    ctx.fillStyle = '#888';
    ctx.fillText(placeholder, sr.x + 8, sr.y + sr.h / 2);
  }
  codexClickAreas.push({ ...sr, kind: 'search-focus' });
  // Clear (X) button on the right of the search box
  if (codexSearchText) {
    const cx = sr.x + sr.w - 18;
    ctx.fillStyle = '#aaa';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('×', cx, sr.y + sr.h / 2);
    codexClickAreas.push({
      x: cx - 8, y: sr.y, w: 16, h: sr.h,
      kind: 'search-clear',
    });
  }

  // Format toggle (everything except characters and perks): Small / Full —
  // sits right of the search box. Perks are a single consistent layout, no
  // size variants.
  if (codexTab !== 'characters' && codexTab !== 'perks') {
    const tw = 70;
    const trX = sr.x + sr.w + 8;
    const trSmall = { x: trX, y: L.filterY + 4, w: tw, h: CODEX_FILTER_H - 8 };
    const trFull  = { x: trSmall.x + tw + 4, y: L.filterY + 4, w: tw, h: CODEX_FILTER_H - 8 };
    for (const [r, label, val] of [[trSmall, 'Small', false], [trFull, 'Full', true]]) {
      const active = codexShowFull === val;
      ctx.fillStyle = active ? 'rgba(60, 110, 80, 0.85)' : 'rgba(20, 20, 35, 0.7)';
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = active ? Colors.GOLD : '#666';
      ctx.lineWidth = active ? 2 : 1;
      ctx.strokeRect(r.x, r.y, r.w, r.h);
      ctx.fillStyle = active ? Colors.GOLD : '#cdd';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, r.x + r.w / 2, r.y + r.h / 2);
      codexClickAreas.push({ ...r, kind: 'format', value: val });
    }
  }
  ctx.textBaseline = 'alphabetic';
}

function drawCodexCardGrid(L) {
  // Filter — side first (player vs enemy from current tab), then category,
  // then the search-box query (matches card name or id).
  const sideWanted = codexTab; // 'player' or 'enemy'
  const all = getCodexCardEntries();
  const visible = all
    .filter(e => e.side === sideWanted)
    .filter(e => passesCodexCardFilter(e, codexFilter))
    .filter(e => !codexSearchText || _codexSearchMatches(e.card.name) || _codexSearchMatches(e.card.id))
    .sort((a, b) => a.card.name.localeCompare(b.card.name));

  // Card sizes — exact match to in-game so this is a faithful debug view.
  const cardW = codexShowFull ? 240 : 90;
  const cardH = codexShowFull ? 336 : 126;
  const gap   = codexShowFull ? 16 : 10;

  const perRow = Math.max(1, Math.floor((L.gridW + gap) / (cardW + gap)));
  const totalRows = Math.ceil(visible.length / perRow);
  const totalH = totalRows * cardH + (totalRows - 1) * gap;
  const maxScroll = Math.max(0, totalH - L.gridH);
  if (codexScrollY > maxScroll) codexScrollY = maxScroll;

  // Clip to grid area so cards don't draw past it while scrolled.
  ctx.save();
  ctx.beginPath();
  ctx.rect(L.gridX, L.gridY, L.gridW, L.gridH);
  ctx.clip();

  for (let i = 0; i < visible.length; i++) {
    const col = i % perRow;
    const row = Math.floor(i / perRow);
    const x = L.gridX + col * (cardW + gap);
    const y = L.gridY + row * (cardH + gap) - codexScrollY;
    if (y + cardH < L.gridY || y > L.gridY + L.gridH) continue; // off-screen, skip
    const entry = visible[i];
    const hovered = hitTest(mouseX, mouseY, { x, y, w: cardW, h: cardH });
    // Skip hover-preview reassignment while Shift-frozen so the pinned
    // preview survives mouse moves over other cards.
    const canHoverSet = !isShiftFrozen();
    if (entry.kind === 'card') {
      drawCard(entry.card, x, y, cardW, cardH, codexSelectedCard === entry.card, hovered, codexShowFull ? 'full' : 'small');
      if (hovered && canHoverSet) hoveredCardPreview = entry.card;
    } else if (entry.kind === 'power') {
      // Power: render via drawPowerCard at small, drawPowerPreviewCard at full
      if (codexShowFull) drawPowerPreviewCard(entry.card, x, y, cardW, cardH);
      else drawPowerCard(entry.card, { x, y, w: cardW, h: cardH }, false);
      if (hovered && canHoverSet) hoveredPowerPreview = entry.card;
    } else if (entry.kind === 'creature') {
      // Creature: full uses preview card layout, small uses combat creature card.
      // Pass the entry's side so the player/enemy frame tint matches the
      // side preview (blue for player summons, brown for enemy creatures).
      const isPlayerSide = entry.side === 'player';
      if (codexShowFull) drawCreaturePreviewCard(entry.card, x, y, cardW, cardH);
      else drawCreatureCard(entry.card, { x, y, w: cardW, h: cardH }, isPlayerSide);
      if (hovered && canHoverSet) hoveredCreaturePreview = entry.card;
    }
    codexClickAreas.push({ x, y, w: cardW, h: cardH, kind: 'select-card', entry });
  }
  ctx.restore();

  drawCodexScrollbar(L, totalH);

  // Result count footer
  ctx.fillStyle = Colors.GRAY;
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`${visible.length} entr${visible.length === 1 ? 'y' : 'ies'} · scroll to browse`, L.gridX, L.gridY + L.gridH - 4);
}

function drawCodexCharacterGrid(L) {
  // Build entry list: heroes + monsters, optionally filtered by search text.
  let entries = [];
  if (codexFilter === 'all' || codexFilter === 'heroes') {
    for (const name of HERO_NAMES) entries.push({ kind: 'hero', name });
  }
  if (codexFilter === 'all' || codexFilter === 'monsters') {
    for (const id of getCodexMonsterIds()) entries.push({ kind: 'monster', id });
  }
  if (codexSearchText) {
    entries = entries.filter(e => {
      const name = e.kind === 'hero' ? e.name : e.id.replace(/_/g, ' ');
      return _codexSearchMatches(name) || _codexSearchMatches(e.id || '');
    });
  }

  // Character cards rendered at the in-combat size so visuals match exactly.
  const cardW = COMBAT_CHAR_W;
  const cardH = COMBAT_CHAR_H;
  const gap = 18;
  const perRow = Math.max(1, Math.floor((L.gridW + gap) / (cardW + gap)));
  const totalRows = Math.ceil(entries.length / perRow);
  const totalH = totalRows * cardH + (totalRows - 1) * gap;
  const maxScroll = Math.max(0, totalH - L.gridH);
  if (codexScrollY > maxScroll) codexScrollY = maxScroll;

  ctx.save();
  ctx.beginPath();
  ctx.rect(L.gridX, L.gridY, L.gridW, L.gridH);
  ctx.clip();

  for (let i = 0; i < entries.length; i++) {
    const col = i % perRow;
    const row = Math.floor(i / perRow);
    const x = L.gridX + col * (cardW + gap);
    const y = L.gridY + row * (cardH + gap) - codexScrollY;
    if (y + cardH < L.gridY || y > L.gridY + L.gridH) continue;
    const e = entries[i];
    drawCodexCharacterPanel(e, x, y, cardW, cardH);
    codexClickAreas.push({ x, y, w: cardW, h: cardH, kind: 'select-character', entry: e });
  }
  ctx.restore();

  drawCodexScrollbar(L, totalH);

  ctx.fillStyle = Colors.GRAY;
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`${entries.length} entr${entries.length === 1 ? 'y' : 'ies'}`, L.gridX, L.gridY + L.gridH - 4);
}

// Track the most recent scrollbar geometry so the mousedown/mousemove
// handlers can hit-test against the thumb and convert pixel drags into
// codexScrollY deltas. Reset every frame at the start of drawCodex.
let codexScrollbarBounds = null;
let codexScrollDrag = null; // { startMouseY, startScrollY, sbY, sbH, thumbH, totalH, visibleH }

// Per-section horizontal scroll offsets (loot tables in Full mode overflow
// the grid width when they have 5+ cards). Keyed by section id
// (tableId / perk_warrior_t1 / etc.). Each value is a pixel offset from 0.
const codexSectionScrollX = new Map();
// When the user grabs a horizontal scrollbar thumb we remember start
// mouse-x, start offset, and the section id so mousemove can update it.
let codexHScrollDrag = null;
// Bounds of the h-scrollbars drawn this frame — filled during
// drawCodexLootGrid, read by tryCodexHScrollbarMouseDown.
let codexHScrollbarBounds = [];

// Vertical scrollbar drawn in the gap between the grid and the right stats
// panel — keeps it OUT of the content area so section borders / highlight
// rectangles don't overlap it. Mirrors the save/load scrollbar look.
// No-op when content fits.
function drawCodexScrollbar(L, totalH) {
  const visibleH = L.gridH;
  if (totalH <= visibleH) { codexScrollbarBounds = null; return; }
  const sbW = 8;
  // Sit in the unused 16-px gap between grid and right stats panel.
  const sbX = L.gridX + L.gridW + 4;
  const sbY = L.gridY;
  const sbH = visibleH;

  // Track
  ctx.fillStyle = 'rgba(80, 80, 90, 0.55)';
  ctx.fillRect(sbX, sbY, sbW, sbH);

  // Thumb — proportional to visible/total ratio
  const thumbH = Math.max(28, sbH * (visibleH / totalH));
  const maxScroll = totalH - visibleH;
  const thumbY = sbY + (sbH - thumbH) * (codexScrollY / maxScroll);
  // Highlight the thumb when hovered or actively dragged.
  const hoveringThumb = mouseX >= sbX - 2 && mouseX <= sbX + sbW + 2 &&
                        mouseY >= thumbY && mouseY <= thumbY + thumbH;
  const dragging = !!codexScrollDrag;
  ctx.fillStyle = (dragging || hoveringThumb) ? '#ffe066' : Colors.GOLD;
  ctx.fillRect(sbX, thumbY, sbW, thumbH);

  // Stash for the input handlers.
  codexScrollbarBounds = { sbX, sbY, sbW, sbH, thumbY, thumbH, totalH, visibleH };
}

// Returns true if the click was consumed by the codex scrollbar (track jump
// or thumb-drag start). The mousedown event handler calls this before falling
// through to the regular click router so dragging the thumb doesn't also
// fire a select-card or goto-link click.
function tryCodexScrollbarMouseDown(x, y) {
  if (state !== GameState.CODEX || !codexScrollbarBounds) return false;
  const b = codexScrollbarBounds;
  // Hit-test the track (a few px wider than the thumb to make grabbing easy).
  const inTrack = x >= b.sbX - 4 && x <= b.sbX + b.sbW + 4 &&
                  y >= b.sbY && y <= b.sbY + b.sbH;
  if (!inTrack) return false;

  const onThumb = y >= b.thumbY && y <= b.thumbY + b.thumbH;
  const maxScroll = b.totalH - b.visibleH;
  if (onThumb) {
    codexScrollDrag = {
      startMouseY: y,
      startScrollY: codexScrollY,
      sbY: b.sbY, sbH: b.sbH, thumbH: b.thumbH,
      totalH: b.totalH, visibleH: b.visibleH,
    };
  } else {
    // Click on track outside the thumb → page jump toward click.
    if (y < b.thumbY)      codexScrollY = Math.max(0, codexScrollY - b.visibleH * 0.9);
    else                   codexScrollY = Math.min(maxScroll, codexScrollY + b.visibleH * 0.9);
  }
  return true;
}

function tryCodexScrollbarMouseMove(y) {
  if (!codexScrollDrag) return false;
  const d = codexScrollDrag;
  const dy = y - d.startMouseY;
  const trackTravel = d.sbH - d.thumbH;
  if (trackTravel <= 0) return true;
  const maxScroll = d.totalH - d.visibleH;
  const scrollDelta = (dy / trackTravel) * maxScroll;
  codexScrollY = Math.max(0, Math.min(maxScroll, d.startScrollY + scrollDelta));
  return true;
}

function endCodexScrollbarDrag() {
  codexScrollDrag = null;
  codexHScrollDrag = null;
}

// Read + clamp the horizontal scroll offset for a loot/perk section.
// Called during draw so the value self-corrects when the content width
// shrinks (e.g. the section shrinks after a search filter).
function getSectionHScroll(sectionId, contentW, visibleW) {
  const maxScroll = Math.max(0, contentW - visibleW);
  let v = codexSectionScrollX.get(sectionId) || 0;
  if (v < 0) v = 0;
  if (v > maxScroll) v = maxScroll;
  codexSectionScrollX.set(sectionId, v);
  return v;
}

// Draw a small horizontal scrollbar under a loot/perk section's card row.
// Registers its bounds so tryCodexHScrollbarMouseDown can start a drag.
function drawCodexHScrollbar(sectionId, x, y, w, h, contentW, visibleW, scrollX) {
  // Track
  ctx.fillStyle = 'rgba(80, 80, 90, 0.55)';
  ctx.fillRect(x, y, w, h);
  // Thumb
  const thumbW = Math.max(32, w * (visibleW / contentW));
  const maxScroll = contentW - visibleW;
  const thumbX = x + (w - thumbW) * (scrollX / maxScroll);
  const dragging = codexHScrollDrag && codexHScrollDrag.sectionId === sectionId;
  const hoveringThumb = mouseX >= thumbX && mouseX <= thumbX + thumbW &&
                        mouseY >= y && mouseY <= y + h;
  ctx.fillStyle = (dragging || hoveringThumb) ? '#ffe066' : Colors.GOLD;
  ctx.fillRect(thumbX, y, thumbW, h);
  codexHScrollbarBounds.push({
    sectionId, x, y, w, h, thumbX, thumbW, contentW, visibleW,
  });
}

function tryCodexHScrollbarMouseDown(x, y) {
  if (state !== GameState.CODEX) return false;
  for (const b of codexHScrollbarBounds) {
    // Hit-test the track (a bit wider than the bar for easier grabbing).
    if (x < b.x || x > b.x + b.w) continue;
    if (y < b.y - 2 || y > b.y + b.h + 2) continue;
    const onThumb = x >= b.thumbX && x <= b.thumbX + b.thumbW;
    const maxScroll = b.contentW - b.visibleW;
    if (onThumb) {
      codexHScrollDrag = {
        sectionId: b.sectionId,
        startMouseX: x,
        startScrollX: codexSectionScrollX.get(b.sectionId) || 0,
        trackX: b.x, trackW: b.w, thumbW: b.thumbW,
        maxScroll,
      };
    } else {
      // Click outside the thumb → page jump toward the click.
      const cur = codexSectionScrollX.get(b.sectionId) || 0;
      if (x < b.thumbX) codexSectionScrollX.set(b.sectionId, Math.max(0, cur - b.visibleW * 0.9));
      else              codexSectionScrollX.set(b.sectionId, Math.min(maxScroll, cur + b.visibleW * 0.9));
    }
    return true;
  }
  return false;
}

function tryCodexHScrollbarMouseMove(x) {
  if (!codexHScrollDrag) return false;
  const d = codexHScrollDrag;
  const trackTravel = d.trackW - d.thumbW;
  if (trackTravel <= 0) return true;
  const dx = x - d.startMouseX;
  const delta = (dx / trackTravel) * d.maxScroll;
  const newVal = Math.max(0, Math.min(d.maxScroll, d.startScrollX + delta));
  codexSectionScrollX.set(d.sectionId, newVal);
  return true;
}

// Search match helper — case-insensitive substring on a normalized haystack.
function _codexSearchMatches(haystack) {
  if (!codexSearchText) return true;
  const q = codexSearchText.toLowerCase();
  return (haystack || '').toLowerCase().includes(q);
}

// Renders one section per loot table: title bar, optional note, then a row of
// member cards with the drop % overlaid below each card. Honors codexShowFull
// (small / full). Each section ends with a "Test Roll" button that calls
// rollLootTable and stashes the result for display.
function drawCodexLootGrid(L) {
  // Build a unified list of entries: card loot tables first, then perk
  // roll tables (one per class+tier). Both render the same way — header
  // with title/note, row of member thumbnails with % weights below.
  const cardTableIds = Object.keys(LOOT_TABLES);
  const perkTableEntries = [];
  for (const tier of Object.keys(CLASS_PERK_WEIGHTS)) {
    const perTier = CLASS_PERK_WEIGHTS[tier] || {};
    const CLASS_ORDER = ['Paladin', 'Ranger', 'Wizard', 'Rogue', 'Warrior', 'Druid'];
    for (const className of CLASS_ORDER) {
      const weights = perTier[className];
      if (!weights || Object.keys(weights).length === 0) continue;
      perkTableEntries.push({
        kind: 'perk',
        id: `perk_${className.toLowerCase()}_t${tier}`,
        className,
        tier: Number(tier),
        weights,
      });
    }
  }

  // Shape everything into a uniform list for rendering + search.
  const allEntries = [
    ...cardTableIds.map(tid => ({ kind: 'loot', id: tid })),
    ...perkTableEntries,
  ];

  // Apply search: keep tables whose label matches OR that contain a matching member.
  const entries = allEntries.filter(e => {
    if (!codexSearchText) return true;
    if (e.kind === 'loot') {
      const label = LOOT_TABLE_LABELS[e.id] || e.id;
      if (_codexSearchMatches(label)) return true;
      return LOOT_TABLES[e.id].some(x => _codexSearchMatches(x.creator().name));
    } else {
      const label = `Perk Roll — ${e.className} Tier ${e.tier}`;
      if (_codexSearchMatches(label) || _codexSearchMatches(e.className)) return true;
      return Object.keys(e.weights).some(pid => {
        const fn = PERK_REGISTRY[pid];
        return fn && _codexSearchMatches(fn().name);
      });
    }
  });

  const cardW = codexShowFull ? 200 : 90;
  const cardH = codexShowFull ? 280 : 126;
  const gap = codexShowFull ? 14 : 10;
  const headerH = 44;       // title + optional note
  const pctRowH = 18;       // % under each card
  const sectionGap = 18;
  // Horizontal scrollbar track for overflowing rows — reserve space even
  // on non-overflow sections so the layout is consistent (every section
  // occupies the same vertical slot).
  const hScrollbarH = 8;
  const sectionH = headerH + cardH + pctRowH + 8 + hScrollbarH + 2;

  const totalH = entries.length * sectionH + Math.max(0, entries.length - 1) * sectionGap;
  const maxScroll = Math.max(0, totalH - L.gridH);
  if (codexScrollY > maxScroll) codexScrollY = maxScroll;

  ctx.save();
  ctx.beginPath();
  ctx.rect(L.gridX, L.gridY, L.gridW, L.gridH);
  ctx.clip();

  let sy = L.gridY - codexScrollY;
  for (const e of entries) {
    if (sy + sectionH < L.gridY || sy > L.gridY + L.gridH) {
      sy += sectionH + sectionGap;
      continue;
    }

    const isHighlight = codexLootHighlightId === e.id;
    ctx.fillStyle = 'rgba(20, 20, 35, 0.55)';
    ctx.fillRect(L.gridX, sy, L.gridW, sectionH);
    ctx.strokeStyle = isHighlight ? Colors.GOLD : '#444';
    ctx.lineWidth = isHighlight ? 2 : 1;
    ctx.strokeRect(L.gridX, sy, L.gridW, sectionH);

    if (e.kind === 'loot') {
      // --- Card loot table ---
      const table = LOOT_TABLES[e.id];
      const total = table.reduce((s, x) => s + x.weight, 0);
      const label = LOOT_TABLE_LABELS[e.id] || _titleCase(e.id.replace(/_loot$/, ''));
      const note  = LOOT_TABLE_NOTES[e.id] || '';

      // Title + note
      ctx.fillStyle = Colors.GOLD;
      ctx.font = 'bold 16px Georgia, serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(`Loot Table — ${label}`, L.gridX + 12, sy + 8);
      if (note) {
        ctx.fillStyle = '#bcd';
        ctx.font = '12px sans-serif';
        ctx.fillText(note, L.gridX + 12, sy + 28);
      }

      // Test Roll button (top-right)
      const btnW = 100, btnH = 26;
      const btnX = L.gridX + L.gridW - btnW - 12;
      const btnY = sy + 10;
      ctx.fillStyle = 'rgba(60, 100, 60, 0.85)';
      ctx.fillRect(btnX, btnY, btnW, btnH);
      ctx.strokeStyle = '#9c9';
      ctx.lineWidth = 1;
      ctx.strokeRect(btnX, btnY, btnW, btnH);
      ctx.fillStyle = '#dfd';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Test Roll', btnX + btnW / 2, btnY + btnH / 2);
      codexClickAreas.push({ x: btnX, y: btnY, w: btnW, h: btnH, kind: 'loot-roll', tableId: e.id });

      const lastRoll = codexLootRollResults[e.id];
      if (lastRoll) {
        ctx.fillStyle = '#fff';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(`Rolled: ${lastRoll.card.name}`, btnX - 10, btnY + btnH / 2);
      }

      const rowY = sy + headerH;
      const rowX = L.gridX + 12;
      const rowW = L.gridW - 24;
      const contentW = table.length * cardW + Math.max(0, table.length - 1) * gap;
      const scrollX = getSectionHScroll(e.id, contentW, rowW);
      const rowHeight = cardH + pctRowH + 4;
      // Clip the row (card + % label area) so cards outside the visible
      // band are hidden while scrolling.
      ctx.save();
      ctx.beginPath();
      ctx.rect(rowX, rowY, rowW, rowHeight);
      ctx.clip();

      let cx = rowX - scrollX;
      for (const entry of table) {
        // Skip culled off-screen cards so the hover detection doesn't
        // misfire on clipped pixels.
        if (cx + cardW < rowX - 8 || cx > rowX + rowW + 8) {
          cx += cardW + gap;
          continue;
        }
        const card = entry.creator();
        const pct = Math.round((entry.weight / total) * 100);
        // Only register hover if the card is visible inside the clip.
        const fullyOrPartiallyVisible = cx + cardW > rowX && cx < rowX + rowW;
        const hovered = fullyOrPartiallyVisible &&
          hitTest(mouseX, mouseY, { x: cx, y: rowY, w: cardW, h: cardH });
        drawCard(card, cx, rowY, cardW, cardH, false, hovered, codexShowFull ? 'full' : 'small');
        if (hovered && !isShiftFrozen()) hoveredCardPreview = card;

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(`${pct}%`, cx + cardW / 2, rowY + cardH + 3);

        if (fullyOrPartiallyVisible) {
          codexClickAreas.push({
            x: cx, y: rowY, w: cardW, h: cardH,
            kind: 'select-card', entry: { kind: 'card', id: card.id, card },
          });
        }

        cx += cardW + gap;
      }
      ctx.restore();
      // Horizontal scrollbar below the row if content overflows.
      if (contentW > rowW) {
        drawCodexHScrollbar(e.id, rowX, rowY + rowHeight + 2, rowW, hScrollbarH, contentW, rowW, scrollX);
      }
    } else {
      // --- Perk roll table ---
      const total = Object.values(e.weights).reduce((s, v) => s + v, 0);

      // Title + note
      ctx.fillStyle = Colors.GOLD;
      ctx.font = 'bold 16px Georgia, serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(`Perk Roll — ${e.className} Tier ${e.tier}`, L.gridX + 12, sy + 8);
      ctx.fillStyle = '#bcd';
      ctx.font = '12px sans-serif';
      ctx.fillText(`Rolled on ${e.className} level-up (tier ${e.tier}). 2 unique picks, no replacement.`, L.gridX + 12, sy + 28);

      // Test Roll button (mirrors the card-loot-table button) — picks a
      // random perk from this class/tier pool using the weighted roll.
      const btnW = 100, btnH = 26;
      const btnX = L.gridX + L.gridW - btnW - 12;
      const btnY = sy + 10;
      ctx.fillStyle = 'rgba(80, 60, 130, 0.85)';
      ctx.fillRect(btnX, btnY, btnW, btnH);
      ctx.strokeStyle = '#d87cff';
      ctx.lineWidth = 1;
      ctx.strokeRect(btnX, btnY, btnW, btnH);
      ctx.fillStyle = '#f8e8ff';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Test Roll', btnX + btnW / 2, btnY + btnH / 2);
      codexClickAreas.push({
        x: btnX, y: btnY, w: btnW, h: btnH,
        kind: 'perk-roll', tableId: e.id, weights: e.weights,
      });

      const lastRoll = codexLootRollResults[e.id];
      if (lastRoll) {
        ctx.fillStyle = '#fff';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(`Rolled: ${lastRoll.card.name}`, btnX - 10, btnY + btnH / 2);
      }
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      // Perk tiles — same dimensions as the loot-table card rows so both
      // kinds of tables line up visually in the scroll.
      const rowY = sy + headerH;
      const perkW = codexShowFull ? 200 : 90;
      const perkH = codexShowFull ? 280 : 126;
      const perkGap = codexShowFull ? 14 : 10;
      const rowX = L.gridX + 12;
      const rowW = L.gridW - 24;
      const perkIds = Object.keys(e.weights);
      const contentW = perkIds.length * perkW + Math.max(0, perkIds.length - 1) * perkGap;
      const scrollX = getSectionHScroll(e.id, contentW, rowW);
      const rowHeight = perkH + pctRowH + 4;
      ctx.save();
      ctx.beginPath();
      ctx.rect(rowX, rowY, rowW, rowHeight);
      ctx.clip();

      let cx = rowX - scrollX;
      for (const pid of perkIds) {
        const fn = PERK_REGISTRY[pid];
        if (!fn) continue;
        if (cx + perkW < rowX - 8 || cx > rowX + rowW + 8) {
          cx += perkW + perkGap;
          continue;
        }
        const perk = fn();
        const pct = Math.round((e.weights[pid] / total) * 100);
        drawCodexPerkTableThumb(perk, cx, rowY, perkW, perkH);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(`${pct}%`, cx + perkW / 2, rowY + perkH + 3);

        const fullyOrPartiallyVisible = cx + perkW > rowX && cx < rowX + rowW;
        if (fullyOrPartiallyVisible) {
          codexClickAreas.push({
            x: cx, y: rowY, w: perkW, h: perkH,
            kind: 'select-perk', perk,
          });
        }

        cx += perkW + perkGap;
      }
      ctx.restore();
      if (contentW > rowW) {
        drawCodexHScrollbar(e.id, rowX, rowY + rowHeight + 2, rowW, hScrollbarH, contentW, rowW, scrollX);
      }
    }

    sy += sectionH + sectionGap;
  }

  ctx.restore();
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';

  drawCodexScrollbar(L, totalH);

  // Empty-state hint
  if (entries.length === 0) {
    ctx.fillStyle = Colors.GRAY;
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`No tables match "${codexSearchText}".`,
      L.gridX + L.gridW / 2, L.gridY + 40);
  }
}

// Perk thumb for per-class roll tables. Reuses the full-card adapter so
// the thumbnails match the Perks tab and the rest of the codex — frame,
// art, description, and the trigger-chip overlay.
function drawCodexPerkTableThumb(perk, x, y, w, h) {
  const pseudoCard = perkToCardLike(perk);
  const hovered = hitTest(mouseX, mouseY, { x, y, w, h });
  const selected = codexSelectedCard && codexSelectedCard._isPerk && codexSelectedCard.id === perk.id;
  const isFullSize = w >= 160;
  drawCard(pseudoCard, x, y, w, h, selected, hovered, isFullSize ? 'full' : 'small');
  drawPerkCardOverlay(perk, x, y, w, h, isFullSize);
  // Hover preview: surfaces the perk's previewCard (e.g. Goodberry for
  // Harvest) so the full-size side preview shows up the same way it
  // does on the Perks tab.
  if (hovered && !isShiftFrozen()) hoveredCardPreview = pseudoCard;
}

// Decks tab — show each starter / monster deck as a section. Cards in the
// deck are rendered with stack-count badges (x3 in top-right corner) so
// duplicates collapse cleanly.
// Build the full list of Perk objects once per codex session. Pulls from
// PERK_REGISTRY so the codex always mirrors what the level-up rolls can
// offer (all 12 perks — 4 repeatable, 8 unique).
function getCodexPerks() {
  return Object.values(PERK_REGISTRY).map(fn => fn());
}

// Adapt a Perk object into a pseudo-Card so drawCard can render the full
// framed layout (art + name + description + filigree). Repeatable perks
// (Tough, Prepared, Flash of Genius, Grit) use the common/bronze frame;
// the 8 unique perks use the uncommon/gold frame — we reserve rare+
// for future higher-tier perks. The 'ability' subtype gives the purple
// name-bar tint that matches "perk = permanent ability" thematically.
// `_isPerk` flips the bottom-left subtype label from "Ability" to
// "Perk" / "Perk — Unique" (see getSubtypeLabel).
function perkToCardLike(perk) {
  // Some perks grant a specific card on trigger (e.g. Harvest → Goodberry).
  // Exposing that card via `previewCard` lets drawHoverPreview show a
  // smaller side-preview when the perk is hovered, same pattern used by
  // Druid ability cards like Goodberries.
  let previewCard = null;
  if (perk.id === 'harvest') previewCard = createGoodberry();

  return {
    id: perk.id,
    name: perk.name,
    // drawCard reads from card.description (full view) and card.shortDesc
    // (small view). Use the full description everywhere since perks are
    // short-sentence text already.
    description: perk.description,
    shortDesc: perk.description,
    subtype: 'ability',
    cardType: CardType.ABILITY,
    rarity: perk.unique ? 'uncommon' : 'common',
    _isPerk: true,
    _perkUnique: !!perk.unique,
    _perkOriginal: perk,
    previewCard,
    // Default structural fields drawCard occasionally reads — kept safe
    // so nothing crashes when the pseudo-card ends up in a code path
    // that expects a normal Card.
    effects: [],
    currentEffects: [],
    modes: [],
    exhausted: false,
  };
}

// Perk cards used to wear a separate trigger-chip overlay below the name
// bar. The chip is now rendered INLINE inside the description text (see
// the 'badge' token handling in drawIconText / tokenizeKeywordText), so
// a perk card reads "[COMBAT START] +1 Shield." on a single flowed line.
// Kept as a no-op shim so the existing call sites don't need to change.
function drawPerkCardOverlay(_perk, _x, _y, _w, _h, _isFullSize) {
  /* intentionally empty — badge now lives in the description text */
}

// Return an ordered list of every class/tier table this perk appears in,
// with the table's total weight and this perk's weight + percentage.
// Used by drawCodexPerkDetails ("Appears in: Warrior Tier 1 (18%)...").
function getPerkTableAppearances(perkId) {
  const out = [];
  for (const tier of Object.keys(CLASS_PERK_WEIGHTS)) {
    const perTier = CLASS_PERK_WEIGHTS[tier] || {};
    for (const className of Object.keys(perTier)) {
      const weights = perTier[className];
      if (!weights || !(perkId in weights)) continue;
      const total = Object.values(weights).reduce((s, v) => s + v, 0);
      const w = weights[perkId];
      const pct = total > 0 ? Math.round((w / total) * 100) : 0;
      out.push({
        className,
        tier: Number(tier),
        weight: w,
        totalWeight: total,
        pct,
        tableId: `perk_${className.toLowerCase()}_t${tier}`,
      });
    }
  }
  // Sort by class order (fixed) then tier.
  const CLASS_ORDER = ['Paladin', 'Ranger', 'Wizard', 'Rogue', 'Warrior', 'Druid'];
  out.sort((a, b) => {
    const ai = CLASS_ORDER.indexOf(a.className); const bi = CLASS_ORDER.indexOf(b.className);
    if (ai !== bi) return ai - bi;
    return a.tier - b.tier;
  });
  return out;
}

// Friendly labels for the effectType / timing of each perk. Kept in sync
// with the description prefix in character.js (e.g. "Combat Start: ...")
// so the chip and the card text read identically.
const PERK_TRIGGER_LABELS = {
  combat_start_shield:         'Combat Start',
  combat_start_heroism:        'Combat Start',
  combat_start_flash:          'Combat Start',
  combat_start_first_strike:   'Combat Start',
  combat_first_unpreventable:  'Combat Start',
  combat_first_debuff_spread:  'Combat',
  loot_bonus_gold:             'Loot',
  combat_start_goodberry:      'Combat Start',
  combat_end_heal:             'Combat End',
  turn_start_no_weapon_draw:   'Turn Start',
  turn_start_no_ability_draw:  'Turn Start',
  turn_start_second_wind:      'Turn Start',
  turn_start_balanced_draw:    'Turn Start',
  turn_end_no_armor_draw:      'Turn End',
};

function drawCodexPerkGrid(L) {
  const all = getCodexPerks();
  // Filter chips: all / repeatable / unique. Then search.
  const filtered = all.filter(p => {
    if (codexFilter === 'unique') return !!p.unique;
    if (codexFilter === 'repeatable') return !p.unique;
    return true;
  }).filter(p => {
    if (!codexSearchText) return true;
    return _codexSearchMatches(p.name) || _codexSearchMatches(p.description) || _codexSearchMatches(p.id);
  });

  // Header band — a one-liner explaining how the table rolls.
  const headerH = 72;
  ctx.fillStyle = 'rgba(20, 20, 35, 0.55)';
  ctx.fillRect(L.gridX, L.gridY, L.gridW, headerH);
  ctx.strokeStyle = '#444';
  ctx.lineWidth = 1;
  ctx.strokeRect(L.gridX, L.gridY, L.gridW, headerH);
  ctx.fillStyle = Colors.GOLD;
  ctx.font = 'bold 16px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('Perks', L.gridX + 12, L.gridY + 8);
  ctx.fillStyle = '#bcd';
  ctx.font = '13px sans-serif';
  ctx.fillText('On each level-up, 2 perks are drawn from the player\'s class table (weighted roll).', L.gridX + 12, L.gridY + 30);
  ctx.fillText('Unique perks can only be picked once per run; repeatable perks stack. See Loot Tables tab for per-class rolls.', L.gridX + 12, L.gridY + 48);

  // Card grid — full-size perk cards (matching the Full view used on the
  // Player/Enemy tabs). Auto-flow into as many columns as fit.
  const cardW = 240;
  const cardH = 336;
  const gap = 16;
  const perRow = Math.max(1, Math.floor((L.gridW + gap) / (cardW + gap)));
  const gridTop = L.gridY + headerH + 12;
  const gridHeight = L.gridH - headerH - 12;
  const totalRows = Math.ceil(filtered.length / perRow);
  const totalH = totalRows * cardH + Math.max(0, totalRows - 1) * gap;
  const maxScroll = Math.max(0, totalH - gridHeight);
  if (codexScrollY > maxScroll) codexScrollY = maxScroll;

  ctx.save();
  ctx.beginPath();
  ctx.rect(L.gridX, gridTop, L.gridW, gridHeight);
  ctx.clip();

  for (let i = 0; i < filtered.length; i++) {
    const col = i % perRow;
    const row = Math.floor(i / perRow);
    const x = L.gridX + col * (cardW + gap);
    const y = gridTop + row * (cardH + gap) - codexScrollY;
    if (y + cardH < gridTop || y > gridTop + gridHeight) continue;
    const perk = filtered[i];
    const pseudoCard = perkToCardLike(perk);
    const selected = codexSelectedCard && codexSelectedCard._isPerk && codexSelectedCard.id === perk.id;
    const hovered = hitTest(mouseX, mouseY, { x, y, w: cardW, h: cardH });
    drawCard(pseudoCard, x, y, cardW, cardH, selected, hovered, 'full');
    drawPerkCardOverlay(perk, x, y, cardW, cardH, true);
    // Shift-frozen hover preview: wire this perk as the hovered card so
    // the drawHoverPreview side-panel picks up its previewCard (e.g.
    // Harvest → Goodberry). Same mechanism regular codex cards use.
    if (hovered && !isShiftFrozen()) hoveredCardPreview = pseudoCard;
    codexClickAreas.push({ x, y, w: cardW, h: cardH, kind: 'select-perk', perk });
  }

  ctx.restore();
  drawCodexScrollbar(L, totalH + headerH + 12);

  // Empty-state hint
  if (filtered.length === 0) {
    ctx.fillStyle = Colors.GRAY;
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`No perks match "${codexSearchText}".`,
      L.gridX + L.gridW / 2, gridTop + 40);
  }

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  // Footer count
  ctx.fillStyle = Colors.GRAY;
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`${filtered.length} perk${filtered.length === 1 ? '' : 's'} · ${all.length} total in pool`,
    L.gridX, L.gridY + L.gridH - 4);
}

// drawCodexPerkTile was the old custom tile layout. Perks now render via
// drawCard through the pseudo-card adapter (see drawCodexPerkGrid), so
// the Perks tab cards match all other codex cards (frame, art, filigree).

// Full-size perk detail rendered in the codex stats panel (replaces the
// card thumbnail slot). Shows name, unique/repeatable flag, trigger
// chip, description, and raw effect id (handy for debugging / modding).
function drawCodexPerkDetails(sel, x, y, w, h) {
  // Top: the actual perk card so the details panel looks like a zoomed-
  // in version of the grid tile. Card-aspect ~ 240/336.
  const cardW = Math.min(w, 200);
  const cardH = Math.round(cardW * (336 / 240));
  const cardX = x + Math.floor((w - cardW) / 2);
  const cardY = y;
  const perk = sel._perkOriginal || sel;
  const pseudoCard = perkToCardLike(perk);
  drawCard(pseudoCard, cardX, cardY, cardW, cardH, false, false, 'full');
  drawPerkCardOverlay(perk, cardX, cardY, cardW, cardH, true);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  let cy = cardY + cardH + 10;

  // "Gain Perk" debug button — only when a game is in progress. For unique
  // perks the player already owns, the button is disabled (can't stack).
  // Mirrors the "+1 to Hand" button on regular cards.
  if (player && player.perks) {
    const alreadyHasUnique = perk.unique && player.perks.some(p => p.id === perk.id);
    const btnW = w;
    const btnH = 28;
    const btnX = x;
    const btnY = cy;
    const hov = !alreadyHasUnique && hitTest(mouseX, mouseY, { x: btnX, y: btnY, w: btnW, h: btnH });
    ctx.fillStyle = alreadyHasUnique
      ? 'rgba(50, 50, 60, 0.6)'
      : (hov ? 'rgba(120, 80, 160, 0.95)' : 'rgba(80, 60, 130, 0.85)');
    ctx.fillRect(btnX, btnY, btnW, btnH);
    ctx.strokeStyle = alreadyHasUnique ? '#555' : '#d87cff';
    ctx.lineWidth = 1;
    ctx.strokeRect(btnX, btnY, btnW, btnH);
    ctx.fillStyle = alreadyHasUnique ? '#888' : '#f8e8ff';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const btnLabel = alreadyHasUnique ? 'Unique — Already Owned' : 'Gain Perk';
    ctx.fillText(btnLabel, btnX + btnW / 2, btnY + btnH / 2);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    if (!alreadyHasUnique) {
      codexClickAreas.push({
        x: btnX, y: btnY, w: btnW, h: btnH,
        kind: 'add-perk-to-game', perkId: perk.id,
      });
    }
    cy += btnH + 14;
  }

  // "Appears in:" list navigates to the Loot Tables tab and scrolls to the
  // specific class/tier perk table (matches how card sources link to loot
  // tables).
  const appearances = getPerkTableAppearances(perk.id);
  if (appearances.length > 0) {
    ctx.fillStyle = Colors.GOLD;
    ctx.font = 'bold 13px Georgia, serif';
    ctx.fillText('Appears in:', x + 4, cy);
    cy += 18;
    ctx.font = '12px sans-serif';
    for (const a of appearances) {
      if (cy + 16 > y + h - 4) break;
      const label = `• ${a.className} Tier ${a.tier} (${a.pct}%)`;
      ctx.fillStyle = '#9ad6ff';
      ctx.fillText(label, x + 8, cy);
      const tw = ctx.measureText(label).width;
      ctx.strokeStyle = 'rgba(154, 214, 255, 0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + 8, cy + 14);
      ctx.lineTo(x + 8 + tw, cy + 14);
      ctx.stroke();
      codexClickAreas.push({
        x: x + 8, y: cy - 2, w: tw + 4, h: 18,
        kind: 'goto-link',
        link: { type: 'perk-table', id: a.tableId, className: a.className, tier: a.tier },
      });
      cy += 17;
    }
  }

  ctx.textBaseline = 'alphabetic';
}

function drawCodexDecksGrid(L) {
  const cache = buildCodexSourceCache();
  const allDecks = cache.decks
    .filter(d => codexDeckSide === 'all' || d.side === codexDeckSide);
  // Apply search: deck matches if its label OR any card name contains query.
  const decks = allDecks.filter(d => {
    if (!codexSearchText) return true;
    if (_codexSearchMatches(d.label)) return true;
    return d.entries.some(e => _codexSearchMatches(e.card.name));
  }).sort((a, b) => a.label.localeCompare(b.label));

  const cardW = codexShowFull ? 200 : 90;
  const cardH = codexShowFull ? 280 : 126;
  const gap = codexShowFull ? 14 : 10;
  const headerH = 32;
  const sectionGap = 18;
  const innerPadX = 12;

  // Pre-compute each section's height (row count varies by deck size).
  const sections = decks.map(d => {
    const perRow = Math.max(1, Math.floor((L.gridW - innerPadX * 2 + gap) / (cardW + gap)));
    const rows = Math.max(1, Math.ceil(d.entries.length / perRow));
    return { deck: d, perRow, h: headerH + rows * cardH + (rows - 1) * gap + 16 };
  });
  const totalH = sections.reduce((s, x) => s + x.h, 0) + Math.max(0, sections.length - 1) * sectionGap;
  const maxScroll = Math.max(0, totalH - L.gridH);
  if (codexScrollY > maxScroll) codexScrollY = maxScroll;

  ctx.save();
  ctx.beginPath();
  ctx.rect(L.gridX, L.gridY, L.gridW, L.gridH);
  ctx.clip();

  let sy = L.gridY - codexScrollY;
  for (const sec of sections) {
    const { deck, perRow, h } = sec;
    if (sy + h < L.gridY || sy > L.gridY + L.gridH) {
      sy += h + sectionGap;
      continue;
    }

    const isHighlight = codexDeckHighlightId === deck.id;
    ctx.fillStyle = 'rgba(20, 20, 35, 0.55)';
    ctx.fillRect(L.gridX, sy, L.gridW, h);
    ctx.strokeStyle = isHighlight ? Colors.GOLD : '#444';
    ctx.lineWidth = isHighlight ? 2 : 1;
    ctx.strokeRect(L.gridX, sy, L.gridW, h);

    // Header — gold for player, brown for monster, with small badge
    ctx.fillStyle = deck.side === 'player' ? Colors.GOLD : '#d8a070';
    ctx.font = 'bold 16px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const sideTag = deck.side === 'player' ? '[Player]' : '[Monster]';
    const headerLabel = `${sideTag} ${deck.label}`;
    ctx.fillText(headerLabel, L.gridX + innerPadX, sy + 8);
    // Total card count for the deck (sum of stacks so x3 cards count as 3).
    const totalCards = deck.entries.reduce((s, e) => s + (e.count || 1), 0);
    const countLabel = `${totalCards} card${totalCards === 1 ? '' : 's'}`;
    const labelW = ctx.measureText(headerLabel).width;
    ctx.font = '13px sans-serif';
    ctx.fillStyle = '#bcd';
    ctx.fillText(`— ${countLabel}`, L.gridX + innerPadX + labelW + 10, sy + 10);

    // Card grid
    let i = 0;
    for (const entry of deck.entries) {
      const col = i % perRow;
      const row = Math.floor(i / perRow);
      const x = L.gridX + innerPadX + col * (cardW + gap);
      const y = sy + headerH + row * (cardH + gap);
      const hovered = hitTest(mouseX, mouseY, { x, y, w: cardW, h: cardH });
      drawCard(entry.card, x, y, cardW, cardH, false, hovered, codexShowFull ? 'full' : 'small');
      if (hovered && !isShiftFrozen()) hoveredCardPreview = entry.card;
      // Stack-count badge (matches the inventory backpack style)
      if (entry.count > 1) {
        const bx = x + cardW - 24, by = y + 2;
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(bx, by, 24, 20);
        ctx.strokeStyle = Colors.GOLD;
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, by, 24, 20);
        ctx.fillStyle = Colors.GOLD;
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`x${entry.count}`, bx + 12, by + 10);
      }
      codexClickAreas.push({
        x, y, w: cardW, h: cardH,
        kind: 'select-card',
        entry: { kind: 'card', id: entry.card.id, card: entry.card },
      });
      i++;
    }

    sy += h + sectionGap;
  }
  ctx.restore();
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';

  drawCodexScrollbar(L, totalH);

  if (sections.length === 0) {
    ctx.fillStyle = Colors.GRAY;
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      codexSearchText ? `No decks match "${codexSearchText}".` : 'No decks to show.',
      L.gridX + L.gridW / 2, L.gridY + 40);
  }
}

// Hard-coded list of monster art ids known to have a portrait — used so the
// codex shows them in their character-card form. Keeping it explicit avoids
// pulling in the runtime ENEMY_DECKS init plumbing.
function getCodexMonsterIds() {
  return [
    'giant_rat', 'bone_pile', 'slime', 'kobold_warden', 'dire_rat',
    'kobold_patrol', 'sahuagin_sentinel', 'sahuagin_priest', 'sahuagin_baron',
    'forest_spiders', 'obsidian_golem', 'general_zhost', 'wolf_pack',
    'stone_giant', 'bone_amalgam',
  ];
}

// Stand-in for drawCharacterPanel that renders a portrait + name + frame at a
// fixed rect, without needing a real Character object.
function drawCodexCharacterPanel(entry, x, y, w, h) {
  let portraitId, displayName;
  if (entry.kind === 'hero') {
    portraitId = `${entry.name.toLowerCase()}_class`;
    displayName = entry.name;
  } else {
    portraitId = entry.id;
    displayName = entry.id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
  const portrait = getCardArt(portraitId);

  if (portrait) {
    const imgAspect = portrait.width / portrait.height;
    const cardAspect = w / h;
    let sx = 0, sy = 0, sw = portrait.width, sh = portrait.height;
    if (imgAspect > cardAspect) { sw = portrait.height * cardAspect; sx = (portrait.width - sw) / 2; }
    else { sh = portrait.width / cardAspect; sy = (portrait.height - sh) / 2; }
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.drawImage(portrait, sx, sy, sw, sh, x, y + 10, w, h);
    ctx.restore();
  } else {
    ctx.fillStyle = entry.kind === 'hero' ? '#1a3a4e' : '#3a1a1a';
    ctx.fillRect(x, y, w, h);
  }

  // Frame (no tint — same as the in-combat character panel).
  const frameImg = images.frame_common;
  if (frameImg) {
    const corner = CARD_FRAME_CORNERS.frame_common || 24;
    const scaledCorner = Math.max(8, Math.min(corner, Math.floor(Math.min(w, h) * 0.11)));
    draw9SliceFrame(frameImg, x, y, w, h, scaledCorner);
  } else {
    ctx.strokeStyle = Colors.WHITE;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
  }

  // No dark wash — the portrait shows through the frame untouched. The name
  // gets a drop shadow for readability.
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.95)';
  ctx.shadowBlur = 5;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = Colors.WHITE;
  ctx.font = 'bold 18px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(displayName, x + w / 2, y + 22);
  ctx.restore();
  ctx.textBaseline = 'alphabetic';
}

// ---------------------------------------------------------------
// Codex source lookup — builds a reverse index: cardId/powerId -> where the
// card can appear (starter decks, ability choices, shops, loot tables, camp
// pool, encounter drops, enemy decks, enemy powers). Cached on first access.
// ---------------------------------------------------------------
let _codexSourceCache = null;

function _titleCase(s) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function buildCodexSourceCache() {
  if (_codexSourceCache) return _codexSourceCache;
  const cache = {
    byCardId: {},
    byPowerId: {},
    abilityChoiceIds: new Set(), // cards that appear in any class ability list
    creatures: [],               // unique creatures (by name) for Summons tab
    byCreatureName: {},          // creatureName -> source strings
    enemyOnlyCards: {},          // id -> Card (cards seen in enemy decks but NOT in CARD_REGISTRY)
    decks: [],                   // [{ id, label, side, entries: [{ card, count }] }]
  };
  // Snapshot the player-side card id set up front so we can classify enemy
  // deck cards as "enemy-only" if they're not in this set.
  const playerCardIds = new Set(Object.keys(CARD_REGISTRY));
  for (const creator of ALL_EXTRA_CARD_CREATORS) {
    try { playerCardIds.add(creator().id); } catch (e) {}
  }
  // Source entries are objects { text, link? } where link is optional metadata
  // for click-to-navigate (e.g. {type:'loot', id:'bone_pile_loot'}).
  // Strings are accepted too and auto-wrapped — dedupe by text.
  const _normSrc = (s) => (typeof s === 'string') ? { text: s } : s;
  const _hasText = (arr, text) => arr.some(e => e.text === text);
  const addCard = (id, src) => {
    if (!id) return;
    const entry = _normSrc(src);
    if (!cache.byCardId[id]) cache.byCardId[id] = [];
    if (!_hasText(cache.byCardId[id], entry.text)) cache.byCardId[id].push(entry);
  };
  const addPower = (id, src) => {
    if (!id) return;
    const entry = _normSrc(src);
    if (!cache.byPowerId[id]) cache.byPowerId[id] = [];
    if (!_hasText(cache.byPowerId[id], entry.text)) cache.byPowerId[id].push(entry);
  };
  const seenCreatures = new Set();
  const addCreature = (creature, src) => {
    if (!creature || !creature.name) return;
    // Dedup by a richer key so two creatures sharing a name but with
    // different stats / sentinel flag (e.g. Thorb 2/4 vs Thorb 2/5 Sentinel)
    // both appear in the Summons tab.
    const key = `${creature.name}|${creature.attack}|${creature.maxHp}|${creature.sentinel ? 1 : 0}`;
    if (!seenCreatures.has(key)) {
      seenCreatures.add(key);
      // Detach from any prior owner so codex rendering doesn't bleed combat
      // state. Also clear the default just-summoned/exhausted flags so the
      // small-card renderer doesn't paint the Zzz overlay (which dims the
      // card) on a creature that's only being shown for inspection.
      creature.owner = null;
      creature.exhausted = false;
      creature.justSummoned = false;
      cache.creatures.push(creature);
    }
    if (src) {
      const entry = _normSrc(src);
      if (!cache.byCreatureName[key]) cache.byCreatureName[key] = [];
      if (!_hasText(cache.byCreatureName[key], entry.text)) cache.byCreatureName[key].push(entry);
    }
  };

  // Starter decks (with counts)
  const starterDecks = [
    ['Paladin', getPaladinStarterDeck],
    ['Ranger',  getRangerStarterDeck],
    ['Wizard',  getWizardStarterDeck],
    ['Rogue',   getRogueStarterDeck],
    ['Warrior', getWarriorStarterDeck],
    ['Druid',   getDruidStarterDeck],
  ];
  for (const [cls, fn] of starterDecks) {
    const cards = fn();
    // Per-card source line + dedup-by-id deck snapshot for the Decks tab.
    const counts = {};
    const cardById = {};
    for (const c of cards) {
      counts[c.id] = (counts[c.id] || 0) + 1;
      if (!cardById[c.id]) cardById[c.id] = c;
    }
    const deckId = `starter_${cls.toLowerCase()}`;
    const deckLabel = `${cls} — Starter Deck`;
    cache.decks.push({
      id: deckId,
      label: deckLabel,
      side: 'player',
      entries: Object.keys(counts).map(id => ({ card: cardById[id], count: counts[id] }))
        .sort((a, b) => a.card.name.localeCompare(b.card.name)),
    });
    for (const id of Object.keys(counts)) {
      const n = counts[id];
      addCard(id, {
        text: `Starter: ${cls}${n > 1 ? ` x${n}` : ''}`,
        link: { type: 'deck', id: deckId },
      });
    }
  }

  // Player-summon creatures via cards' previewCreature field (Pet Spider,
  // Tamed Rat, Pet Slime, etc.). This populates the Summons tab and stamps
  // both _sourceRarity (frame asset) and _sourceSubtype (frame tint) so the
  // creature card matches the source card's full visual identity.
  for (const [id, creator] of Object.entries(CARD_REGISTRY)) {
    try {
      const card = creator();
      if (card && card.previewCreature) {
        card.previewCreature._codexSide = 'player';
        card.previewCreature._sourceRarity = card.rarity || 'common';
        card.previewCreature._sourceSubtype = card.subtype || '';
        // Tier suffix so identical-name cards (Thorb T1 vs Thorb T2) show
        // distinct source lines on the creature's stats panel.
        const tierSuffix = (card.tier && card.tier > 1) ? ` (Tier ${card.tier})` : '';
        addCreature(card.previewCreature, `Summoned by: ${card.name}${tierSuffix}`);
      }
    } catch (e) { /* skip */ }
  }
  // Standalone summoned creatures spawned by card effects. These don't have
  // a previewCreature anchor on a card so we list them explicitly with the
  // source card's rarity / subtype + the correct side.
  // Restless Bone is spawned by Loose Bone (an enemy defense card in the
  // Bone Pile / Bone Amalgam decks), so it's an enemy creature.
  const restlessBone = new Creature({ name: 'Restless Bone', attack: 1, maxHp: 2 });
  restlessBone._codexSide = 'enemy';
  restlessBone._sourceRarity = 'common';
  restlessBone._sourceSubtype = 'armor'; // Loose Bone is a defense (armor) card
  addCreature(restlessBone, 'Summoned by: Loose Bone');
  const thorbCreature = new Creature({ name: 'Thorb', attack: 2, maxHp: 4, isCompanion: true });
  thorbCreature._codexSide = 'player';
  thorbCreature._sourceRarity = 'rare'; // thorb_card is rare
  thorbCreature._sourceSubtype = 'allies';
  addCreature(thorbCreature, 'Summoned by: Thorb (recruit)');

  // Ability-choice lists (level-up / Lost Shrine pick). We don't surface a
  // "Ability choice: X" line per card — the per-card characterClass already
  // tells the player which classes can pick it. Instead we just record which
  // ids appear in any class's choice list, so getCardSources can decide
  // whether to show the Lost Shrine line.
  const abilityChoiceFns = [
    getPaladinAbilityChoices, getRangerAbilityChoices, getWizardAbilityChoices,
    getRogueAbilityChoices, getWarriorAbilityChoices, getDruidAbilityChoices,
  ];
  for (const fn of abilityChoiceFns) {
    for (const c of fn()) cache.abilityChoiceIds.add(c.id);
  }

  // Loot tables — record per-card drop percent. Source entries are objects so
  // the codex stats panel can make them clickable (jumps to Loot Tables tab).
  for (const tableId of Object.keys(LOOT_TABLES)) {
    const table = LOOT_TABLES[tableId];
    const total = table.reduce((s, e) => s + e.weight, 0);
    const tableLabel = LOOT_TABLE_LABELS[tableId] || _titleCase(tableId.replace(/_loot$/, ''));
    for (const entry of table) {
      const pct = Math.round((entry.weight / total) * 100);
      addCard(entry.creator().id, {
        text: `Loot: ${tableLabel} (${pct}%)`,
        link: { type: 'loot', id: tableId },
      });
    }
  }

  // Shops
  const shopLabels = {
    general_store: 'General Store', weaponsmith: 'Weaponsmith',
    armorsmith: 'Armorsmith', arcane_emporium: 'Arcane Emporium',
    city_square: 'City Square', dwarven_tavern: 'Dwarven Tavern',
    dwarven_smithy: 'Dwarven Smithy',
  };
  for (const [shopId, inv] of Object.entries(SHOP_INVENTORIES)) {
    const label = shopLabels[shopId] || _titleCase(shopId);
    for (const item of inv) {
      addCard(item.creator().id, `Shop: ${label} (${item.price}g)`);
    }
  }

  // Encounter drops — each encounter's LOOT phase lootCards[] lists cardIds
  // or loot-table ids. Expand loot-table ids into their member cards so every
  // droppable card is attributed to the encounter that drops it.
  for (const [encId, fn] of Object.entries(ENCOUNTER_REGISTRY)) {
    try {
      const enc = fn();
      for (const phase of enc.phases || []) {
        if (!Array.isArray(phase.lootCards) || !phase.lootCards.length) continue;
        for (const ref of phase.lootCards) {
          if (LOOT_TABLES[ref]) {
            for (const entry of LOOT_TABLES[ref]) {
              addCard(entry.creator().id, `Drop: ${enc.name}`);
            }
          } else {
            addCard(ref, `Drop: ${enc.name}`);
          }
        }
      }
    } catch (e) { /* encounter fn failed — skip */ }
  }

  // Enemy decks + powers — run each enemy setup in a sandbox and snapshot
  // its masterDeck / powers. We temporarily overwrite the module-level
  // `enemy` but restore it immediately afterward.
  const enemyIds = [
    'giant_rat','bone_pile','slime','prison_guards','dire_rat','kobold_patrol',
    'bone_amalgam','sahuagin_sentinel','sahuagin_priest','sahuagin_baron',
    'forest_spiders','obsidian_golem','obsidian_slime','siege_gauntlet_1',
    'kobold_drake_rider','piranhas_swarm','general_zhost','general_zhost_boss',
    'wolf_pack','stone_giant','mimic','ruga_slave_master','zhost_revenge',
    'dwarven_specter','kobold_slyblade','obsidian_oracle','magma_drake',
  ];
  const savedEnemy = enemy;
  for (const eid of enemyIds) {
    try {
      setupEnemyForCombat(eid);
      if (!enemy) continue;
      const name = enemy.name || _titleCase(eid);
      if (enemy.deck && Array.isArray(enemy.deck.masterDeck)) {
        const counts = {};
        const cardById = {};
        for (const c of enemy.deck.masterDeck) {
          counts[c.id] = (counts[c.id] || 0) + 1;
          cardById[c.id] = c;
        }
        const deckId = `enemy_${eid}`;
        if (Object.keys(counts).length) {
          cache.decks.push({
            id: deckId,
            label: name,
            side: 'enemy',
            entries: Object.keys(counts).map(id => ({ card: cardById[id], count: counts[id] }))
              .sort((a, b) => a.card.name.localeCompare(b.card.name)),
          });
        }
        for (const id of Object.keys(counts)) {
          addCard(id, {
            text: `Enemy: ${name}${counts[id] > 1 ? ` x${counts[id]}` : ''}`,
            link: { type: 'deck', id: deckId },
          });
          // Stash a reference to enemy-only Card instances so the codex can
          // surface them under the Enemy tab (player tab only sees CARD_REGISTRY).
          if (!playerCardIds.has(id) && !cache.enemyOnlyCards[id]) {
            cache.enemyOnlyCards[id] = cardById[id];
          }
        }
      }
      if (Array.isArray(enemy.powers)) {
        for (const p of enemy.powers) addPower(p.id, `Enemy: ${name}`);
      }
      if (Array.isArray(enemy.creatures)) {
        for (const c of enemy.creatures) {
          // First-touch wins for side: if this name was already added by a
          // player-summon source (above), keep it as player.
          if (!c._codexSide) c._codexSide = 'enemy';
          addCreature(c, `Enemy: ${name}`);
        }
      }
    } catch (e) { /* enemy setup failed — skip */ }
  }
  enemy = savedEnemy;

  // Class powers
  const classPowers = [
    ['Paladin', 'Cleave'], ['Ranger', 'Aimed Shot'], ['Wizard', 'Elemental Infusion'],
    ['Rogue', 'Quick Strike'], ['Warrior', 'Battle Fury'], ['Druid', 'Feral Form'],
  ];
  const classPowerIds = { cleave: 'Paladin', aimed_shot: 'Ranger', elemental_infusion: 'Wizard',
                          quick_strike: 'Rogue', battle_fury: 'Warrior', feral_form: 'Druid' };
  for (const [pid, cls] of Object.entries(classPowerIds)) {
    addPower(pid, `Class power: ${cls}`);
  }

  _codexSourceCache = cache;
  return cache;
}

function getCardSources(sel) {
  // Returns an array of { text, link? } entries. `link` is optional metadata
  // for click-to-navigate (e.g. {type:'loot', id:'bone_pile_loot'}).
  const out = [];
  if (!sel) return out;

  // Creature: pull from the byCreatureName index (set when the creature was
  // collected from a card's previewCreature field or an enemy's creature list).
  if (sel._isCreature) {
    const cache = buildCodexSourceCache();
    out.push(...(cache.byCreatureName[sel.name] || []));
    return out;
  }

  // Class restriction from the card itself
  if (Array.isArray(sel.characterClass) && sel.characterClass.length) {
    const classes = sel.characterClass
      .map(c => c.charAt(0).toUpperCase() + c.slice(1));
    out.push({ text: `Class: ${classes.join(', ')}` });
  }

  const cache = buildCodexSourceCache();
  const extras = sel._isPower
    ? (cache.byPowerId[sel.id] || [])
    : (cache.byCardId[sel.id] || []);
  out.push(...extras);

  // Lost Shrine grants a Tier-1 class ability card. Show the line for any
  // card that's tier 1 AND in some class's ability choice pool.
  if (sel.tier === 1 && cache.abilityChoiceIds.has(sel.id)) {
    out.push({ text: 'Lost Shrine: Tier 1 Class Cards' });
  }

  return out;
}

function drawCodexStatsPanel(L) {
  // Background
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(L.rightX, L.rightY, CODEX_RIGHT_W - CODEX_PADDING, L.rightH);
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 1;
  ctx.strokeRect(L.rightX, L.rightY, CODEX_RIGHT_W - CODEX_PADDING, L.rightH);

  ctx.textAlign = 'left';
  ctx.fillStyle = Colors.GOLD;
  ctx.font = 'bold 16px Georgia, serif';
  ctx.fillText('Selected', L.rightX + 12, L.rightY + 24);

  if (!codexSelectedCard) {
    ctx.fillStyle = Colors.GRAY;
    ctx.font = '13px sans-serif';
    ctx.fillText('Click a card or character to inspect.', L.rightX + 12, L.rightY + 56);
    return;
  }
  const sel = codexSelectedCard;
  let py = L.rightY + 56;
  ctx.fillStyle = Colors.WHITE;
  ctx.font = 'bold 16px Georgia, serif';
  ctx.fillText(sel.name || sel.id || 'Unnamed', L.rightX + 12, py);
  py += 22;

  // Render a small thumbnail of the card / character. Perks take the full
  // panel height since they include an art banner, description, and a list
  // of class-table appearances that can be quite tall.
  const thumbW = 200;
  const defaultThumbH = 280;
  const thumbH = sel._isPerk
    ? Math.max(defaultThumbH, L.rightY + L.rightH - py - 24)
    : defaultThumbH;
  const thumbX = L.rightX + (CODEX_RIGHT_W - CODEX_PADDING - thumbW) / 2;
  const thumbY = py;
  if (sel._isCharacter) {
    drawCodexCharacterPanel(sel._charEntry, thumbX, thumbY, thumbW, thumbH);
  } else if (sel._isPower) {
    drawPowerPreviewCard(sel, thumbX, thumbY, thumbW, thumbH);
  } else if (sel._isCreature) {
    drawCreaturePreviewCard(sel, thumbX, thumbY, thumbW, thumbH);
  } else if (sel._isPerk) {
    drawCodexPerkDetails(sel, thumbX, thumbY, thumbW, thumbH);
  } else {
    drawCard(sel, thumbX, thumbY, thumbW, thumbH, false, false, 'full');
  }
  py = thumbY + thumbH + 14;

  // "+1 to hand" debug button — only when a game is in progress and the
  // selected entry is a real card (not a power, creature, character, or perk).
  // Tries to add to hand; falls back to deck if hand is at MAX_HAND_SIZE.
  const isRealCard = sel && !sel._isPower && !sel._isCreature && !sel._isCharacter && !sel._isPerk;
  if (isRealCard && player && player.deck && CARD_REGISTRY[sel.id]) {
    const handFull = player.deck.hand.length >= MAX_HAND_SIZE;
    const btnLabel = handFull ? '+1 to Deck' : '+1 to Hand';
    const btnW = CODEX_RIGHT_W - CODEX_PADDING - 24;
    const btnH = 28;
    const btnX = L.rightX + 12;
    const btnY = py;
    const hov = hitTest(mouseX, mouseY, { x: btnX, y: btnY, w: btnW, h: btnH });
    ctx.fillStyle = hov ? 'rgba(80, 130, 80, 0.95)' : 'rgba(50, 90, 50, 0.85)';
    ctx.fillRect(btnX, btnY, btnW, btnH);
    ctx.strokeStyle = '#9c9';
    ctx.lineWidth = 1;
    ctx.strokeRect(btnX, btnY, btnW, btnH);
    ctx.fillStyle = '#dfd';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(btnLabel, btnX + btnW / 2, btnY + btnH / 2);
    // Reset alignment so the Sources header (and the rest of the panel)
    // doesn't inherit the button's center alignment.
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    codexClickAreas.push({
      x: btnX, y: btnY, w: btnW, h: btnH,
      kind: 'add-card-to-game', cardId: sel.id,
    });
    py += btnH + 16; // extra gap so the Sources header doesn't kiss the button
  }

  // Sources section — where this card/power appears in the game.
  // Skip for character and perk entries (perks show their own details
  // block via drawCodexPerkDetails, not the card-sources scan).
  if (!sel._isCharacter && !sel._isPerk) {
    const sources = getCardSources(sel);
    if (sources.length) {
      ctx.fillStyle = Colors.GOLD;
      ctx.font = 'bold 13px Georgia, serif';
      ctx.fillText('Sources', L.rightX + 12, py);
      py += 16;
      // Force textBaseline='top' so y maps to the top of the line box — that
      // makes the underline math (text occupies py..py+fontSize) reliable
      // regardless of whatever baseline state was left from earlier draws.
      ctx.textBaseline = 'top';
      const fontSize = 12;
      // Line height bumped ~30% for readability (was 14, now 18).
      const lineH = 18;
      ctx.font = `${fontSize}px sans-serif`;
      const maxW = CODEX_RIGHT_W - CODEX_PADDING - 24;
      for (const s of sources) {
        if (py + lineH > L.rightY + L.rightH - 8) break;
        const isLink = !!(s && s.link);
        // Simple horizontal-overflow trim — the panel is narrow.
        let text = s.text;
        if (ctx.measureText(text).width > maxW) {
          while (text.length > 4 && ctx.measureText(text + '…').width > maxW) {
            text = text.slice(0, -1);
          }
          text += '…';
        }
        const display = `• ${text}`;
        const lineX = L.rightX + 12;
        ctx.fillStyle = isLink ? '#9ad6ff' : '#dce6f0';
        ctx.fillText(display, lineX, py);
        if (isLink) {
          // Underline sits 1 px below the text bottom (text spans py..py+12).
          const tw = ctx.measureText(display).width;
          ctx.fillRect(lineX, py + fontSize + 1, tw, 1);
          codexClickAreas.push({
            x: lineX - 2, y: py - 1, w: tw + 4, h: lineH,
            kind: 'goto-link', link: s.link,
          });
        }
        py += lineH;
      }
      ctx.textBaseline = 'alphabetic';
      py += 6;
    }
  }

  // Raw fields (debug)
  ctx.fillStyle = '#cdd';
  ctx.font = '12px monospace';
  const lines = [];
  if (sel._isCreature) {
    lines.push(`name: ${sel.name}`);
    lines.push(`attack: ${sel.attack}`);
    lines.push(`hp: ${sel.maxHp}`);
    if (sel.armor)         lines.push(`armor: ${sel.armor}`);
    if (sel.poisonAttack)  lines.push('poisonAttack: true');
    if (sel.fireAttack)    lines.push(`fireAttack: ${sel.fireAttack}`);
    if (sel.iceAttack)     lines.push(`iceAttack: ${sel.iceAttack}`);
    if (sel.fireImmune)    lines.push('fireImmune: true');
    if (sel.attackAll)     lines.push('attackAll: true');
    if (sel.multiAttack)   lines.push(`multiAttack: ${sel.multiAttack}`);
    if (sel.sentinel)      lines.push('sentinel: true');
    if (sel.selfDestruct)  lines.push('selfDestruct: true');
    if (sel.swarm)         lines.push('swarm: true');
    if (sel.bloodfrenzy)   lines.push(`bloodfrenzy: ${sel.bloodfrenzy}`);
    if (sel.unpreventable) lines.push('unpreventable: true');
    if (sel.isCompanion)   lines.push('companion: true');
  } else {
    if (sel.id)        lines.push(`id: ${sel.id}`);
    if (sel.cardType)  lines.push(`cardType: ${sel.cardType}`);
    if (sel.costType)  lines.push(`cost: ${sel.costType}`);
    if (sel.subtype)   lines.push(`subtype: ${sel.subtype}`);
    if (sel.rarity)    lines.push(`rarity: ${sel.rarity}`);
    if (sel.tier)      lines.push(`tier: ${sel.tier}`);
    if (Array.isArray(sel.effects) && sel.effects.length) {
      lines.push(`effects:`);
      for (const e of sel.effects) lines.push(`  ${e.effectType} ${e.value ?? ''}`);
    }
  }
  for (const ln of lines) {
    if (py + 14 > L.rightY + L.rightH - 8) break;
    ctx.fillText(ln, L.rightX + 12, py);
    py += 14;
  }
}

// === Click handling ===
function handleCodexClick(x, y) {
  // Pre-pass: figure out whether the click landed inside the search box. If
  // not, drop search focus so typing 'c' (etc.) again starts toggling the
  // codex instead of typing into a stale search.
  const hitSearchFocus = codexClickAreas.some(a => a.kind === 'search-focus' && hitTest(x, y, a));
  if (!hitSearchFocus) codexSearchActive = false;
  for (const a of codexClickAreas) {
    if (!hitTest(x, y, a)) continue;
    if (a.kind === 'tab') {
      codexTab = a.tabId;
      codexFilter = 'all';
      codexScrollY = 0;
      // Clear navigation-only highlights when manually switching tabs.
      codexLootHighlightId = null;
      codexDeckHighlightId = null;
      // Clicking any tab also drops search focus.
      codexSearchActive = false;
      return;
    }
    if (a.kind === 'deck-side') {
      codexDeckSide = a.filterId;
      codexScrollY = 0;
      codexDeckHighlightId = null;
      return;
    }
    if (a.kind === 'search-focus') {
      codexSearchActive = true;
      return;
    }
    if (a.kind === 'search-clear') {
      codexSearchText = '';
      codexSearchActive = false;
      codexScrollY = 0;
      return;
    }
    if (a.kind === 'loot-roll') {
      const result = rollLootTable(a.tableId);
      if (result && result[0]) {
        codexLootRollResults[a.tableId] = { card: result[0], ts: Date.now() };
      }
      return;
    }
    if (a.kind === 'perk-roll') {
      // Weighted roll across this class/tier pool. Uses the same
      // codexLootRollResults map so the "Rolled: X" label renders with
      // the same scaffolding. The "card" slot just holds the rolled
      // Perk, which has a .name — enough for display.
      const weights = a.weights || {};
      const ids = Object.keys(weights);
      const totalW = ids.reduce((s, id) => s + weights[id], 0);
      if (totalW > 0) {
        let r = Math.random() * totalW;
        let pickId = ids[0];
        for (const id of ids) {
          r -= weights[id];
          if (r <= 0) { pickId = id; break; }
        }
        const fn = PERK_REGISTRY[pickId];
        if (fn) {
          codexLootRollResults[a.tableId] = { card: fn(), ts: Date.now() };
        }
      }
      return;
    }
    if (a.kind === 'add-card-to-game') {
      const creator = CARD_REGISTRY[a.cardId];
      if (creator && player && player.deck) {
        const card = creator();
        const handHasRoom = player.deck.hand.length < MAX_HAND_SIZE;
        player.deck.addCard(card, handHasRoom);
        showToast(handHasRoom ? `+1 ${card.name} (hand)` : `+1 ${card.name} (deck)`, 1500);
      }
      return;
    }
    if (a.kind === 'add-perk-to-game') {
      const fn = PERK_REGISTRY[a.perkId];
      if (fn && player) {
        const perk = fn();
        // Unique perks: skip if already owned. Repeatable perks stack.
        const hasUnique = perk.unique && player.perks.some(p => p.id === perk.id);
        if (!hasUnique) {
          player.perks.push(perk);
          addLog(`Perk gained: ${perk.name}!`, Colors.GOLD);
          showToast(`Gained perk: ${perk.name}`, 1800);
        }
      }
      return;
    }
    if (a.kind === 'filter') {
      codexFilter = a.filterId;
      codexScrollY = 0;
      return;
    }
    if (a.kind === 'format') {
      codexShowFull = a.value;
      codexScrollY = 0;
      return;
    }
    if (a.kind === 'select-card') {
      const c = a.entry.card;
      // Tag the selection so the stats panel knows how to render the thumbnail.
      if (a.entry.kind === 'power')    c._isPower = true;
      if (a.entry.kind === 'creature') c._isCreature = true;
      codexSelectedCard = c;
      return;
    }
    if (a.kind === 'select-perk') {
      // Pseudo-card wrapper so drawCodexStatsPanel can show the perk
      // details using the existing panel scaffolding.
      const p = a.perk;
      codexSelectedCard = {
        _isPerk: true,
        id: p.id,
        name: p.name,
        description: p.description,
        unique: p.unique,
        effectType: p.effectType,
        effectValue: p.effectValue,
        tier: p.tier,
        imageId: p.imageId,
      };
      return;
    }
    if (a.kind === 'goto-link') {
      // Stats-panel source line was clicked. Navigate based on link.type.
      const link = a.link || {};
      codexSearchText = '';      // clear search so the target is visible
      codexSearchActive = false;
      if (link.type === 'loot') {
        codexTab = 'loot';
        codexFilter = 'all';
        codexScrollY = 0;
        codexLootHighlightId = link.id;
        // Scroll the target table into view (matches drawCodexLootGrid math).
        const tableIds = Object.keys(LOOT_TABLES);
        const idx = tableIds.indexOf(link.id);
        if (idx >= 0) {
          const cardH = codexShowFull ? 280 : 126;
          // Keep in sync with drawCodexLootGrid:
        //   headerH (44) + cardH + pctRowH (18) + 8 + hScrollbarH (8) + 2
        const sectionH = 44 + cardH + 18 + 8 + 8 + 2;
          const sectionGap = 18;
          codexScrollY = Math.max(0, idx * (sectionH + sectionGap) - 8);
        }
      } else if (link.type === 'perk-table') {
        // Jump to the Loot Tables tab and scroll to the class perk table.
        // Perk tables render after all card loot tables in the same grid
        // (see drawCodexLootGrid), so the offset is cardTables.length +
        // perkIndex sections from the top.
        codexTab = 'loot';
        codexFilter = 'all';
        codexScrollY = 0;
        codexLootHighlightId = link.id;
        const cardTableCount = Object.keys(LOOT_TABLES).length;
        // Stable class/tier order matches drawCodexLootGrid.
        const CLASS_ORDER = ['Paladin', 'Ranger', 'Wizard', 'Rogue', 'Warrior', 'Druid'];
        let perkIdx = 0, found = false;
        for (const tier of Object.keys(CLASS_PERK_WEIGHTS).sort()) {
          for (const cls of CLASS_ORDER) {
            const w = (CLASS_PERK_WEIGHTS[tier] || {})[cls];
            if (!w || Object.keys(w).length === 0) continue;
            if (cls === link.className && Number(tier) === link.tier) { found = true; break; }
            perkIdx++;
          }
          if (found) break;
        }
        const cardH = codexShowFull ? 280 : 126;
        // Keep in sync with drawCodexLootGrid:
        //   headerH (44) + cardH + pctRowH (18) + 8 + hScrollbarH (8) + 2
        const sectionH = 44 + cardH + 18 + 8 + 8 + 2;
        const sectionGap = 18;
        const idx = cardTableCount + perkIdx;
        codexScrollY = Math.max(0, idx * (sectionH + sectionGap) - 8);
      } else if (link.type === 'deck') {
        codexTab = 'decks';
        codexDeckSide = 'all';
        codexScrollY = 0;
        codexDeckHighlightId = link.id;
        // Scroll the target deck into view by summing prior section heights.
        const cache = buildCodexSourceCache();
        const decks = cache.decks
          .slice()
          .sort((a, b) => a.label.localeCompare(b.label));
        const cardW = codexShowFull ? 200 : 90;
        const cardH = codexShowFull ? 280 : 126;
        const gap = codexShowFull ? 14 : 10;
        const innerPadX = 12;
        // Use a representative grid width since the layout function would
        // need actual L. Approx with the codex's gridW (recompute here).
        const gridW = SCREEN_WIDTH - CODEX_RIGHT_W - CODEX_PADDING * 2;
        let scroll = 0;
        for (const d of decks) {
          if (d.id === link.id) break;
          const perRow = Math.max(1, Math.floor((gridW - innerPadX * 2 + gap) / (cardW + gap)));
          const rows = Math.max(1, Math.ceil(d.entries.length / perRow));
          scroll += 32 + rows * cardH + (rows - 1) * gap + 16 + 18;
        }
        codexScrollY = Math.max(0, scroll - 8);
      }
      return;
    }
    if (a.kind === 'select-character') {
      // Pseudo-card object so the stats panel can render the character thumbnail.
      const e = a.entry;
      const name = e.kind === 'hero'
        ? e.name
        : e.id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      codexSelectedCard = { name, id: e.kind === 'hero' ? e.name : e.id, _isCharacter: true, _charEntry: e };
      return;
    }
  }
}

// === Init ===
loadAssets().then(() => {
  requestAnimationFrame(gameLoop);
});
