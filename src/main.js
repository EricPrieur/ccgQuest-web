import { GAME_VERSION, SCREEN_WIDTH, SCREEN_HEIGHT, GameState, Colors, CARD_COLORS, SUBTYPE_COLORS, CardType, CostType, TargetType } from './constants.js';

// Base path for assets (matches vite.config.js base)
const BASE = import.meta.env.BASE_URL || '/';
import { Character, CombatBuff, getPerkChoices, createToughPerk, createPreparedPerk, createGritPerk, createArsenalPerk, createTalentedPerk, createFirstStrikePerk } from './character.js';
import { Deck } from './deck.js';
import { Creature } from './creature.js';
import {
  getPaladinStarterDeck, getRangerStarterDeck, getWizardStarterDeck,
  getRogueStarterDeck, getWarriorStarterDeck, getDruidStarterDeck,
  getAbilityChoices,
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
  createSmallPouch, createBoneDagger, createClothArmor,
  createHeroicStrike, createHolyLight, createShieldOfFaith, createFlashHeal,
  createFireBurst, createIceBolt, createMagicMissiles, createArcaneShield,
  createVialOfPoison, createSneakAttack, createPetSpider, createCarefulStrike,
  createGreaterCleave, createCharge, createRecklessStrike, createShieldBash,
  createMultiShot, createGoodberries, createGoodberry, createTamedRat,
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
import { getCardArt, POWER_ART_MAP } from './card-art.js';
import { Power, getClassPower, createChunkyBite, createDireFury, createSplit, createArmorPower } from './power.js';
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
let encounterTextScrollY = 0; // scroll offset for accumulated encounter text
let encounterTextOverflow = 0; // how much the text overflows the box (set during draw)

// Debug mode (toggle with backtick `)
let debugMode = false;
let previousState = null; // state before help/ingame menu
let saveLoadReturnState = null; // state to return to from save/load screens
let helpScrollY = 0;
let loadTab = 'manual'; // 'manual' or 'auto'
let loadSelectedIndex = -1;
let loadConfirmDelete = false;
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

// Ally manual-attack state
let selectedAlly = null;

// Multi-target attack state (Wooden Axe etc.)
let multiTargets = [];
let multiMaxTargets = 0;
let multiCardIndex = -1;

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
  scroll_of_potency: createScrollOfPotency, minor_healing_potion: createMinorHealingPotion,
  wand_of_fire: createWandOfFire,
  greatclub: createGreatclub, quarterstaff: createQuarterstaff, ale: createAle,
  thorb_card: createThorbCard, thorb_card_2: createThorbUpgradedCard,
  dwarven_crossbow: createDwarvenCrossbow, dwarven_tower_shield: createDwarvenTowerShield,
  dwarven_greaves: createDwarvenGreaves, dwarven_brew: createDwarvenBrew,
  white_wolf_cloak: createWhiteWolfCloak,
};

// Loot tables: special loot IDs that pick one card from a weighted pool
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
  ]);
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
    case GameState.INGAME_MENU:
      handleIngameMenuClick(x, y);
      break;
    case GameState.TITLE_CARD:
      dismissTitleCard();
      break;
    case GameState.FADING:
      break;
  }
}

function handleKeyDown(key, event) {
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
    } else if (state === GameState.HELP_SCREEN) {
      state = previousState || GameState.MAP;
    } else if (state === GameState.INGAME_MENU) {
      // Close the menu (resume)
      state = previousState || GameState.MAP;
    } else if (state === GameState.SAVE_GAME || state === GameState.LOAD_GAME) {
      state = saveLoadReturnState || (player ? GameState.MAP : GameState.MENU);
    } else if (state === GameState.SHOP) {
      state = GameState.MAP;
    } else if (state === GameState.INVENTORY) {
      // Return to where we came from (combat, map, or rest mode flow)
      if (restMode) {
        restMode = false;
        if (currentEncounter && !currentEncounter.isComplete) {
          currentEncounter.advancePhase();
          advanceEncounterPhase();
        } else {
          state = GameState.MAP;
        }
      } else {
        state = previousState || GameState.MAP;
      }
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
    if (state === GameState.MAP || state === GameState.COMBAT) {
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
    } else if (state === GameState.COMBAT || state === GameState.MAP) {
      previousState = state;
      helpScrollY = 0;
      state = GameState.HELP_SCREEN;
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
  state = GameState.CHARACTER_SELECT;
}

function drawMenu() {
  if (images.menu_bg) {
    ctx.drawImage(images.menu_bg, 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  } else {
    ctx.fillStyle = '#1a0a2e';
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
    ctx.fillStyle = '#1a0a2e';
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
  if (!shrineAbilityMode) {
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
          perkChoices = getPerkChoices(player.perks, 2);
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
  if (images.char_select_bg) {
    ctx.drawImage(images.char_select_bg, 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  } else {
    ctx.fillStyle = '#1a0a2e';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  }

  ctx.fillStyle = Colors.GOLD;
  ctx.font = 'bold 36px serif';
  ctx.textAlign = 'center';
  const titleText = shrineAbilityMode ? "The Shrine's Blessing" : 'Choose Your Starting Ability';
  ctx.fillText(titleText, SCREEN_WIDTH / 2, 80);

  ctx.fillStyle = '#e0e0e0';
  ctx.font = '20px sans-serif';
  const subtitleText = shrineAbilityMode
    ? `${selectedClass} — Choose one card. It joins your hand immediately.`
    : `${selectedClass} — Pick one ability card to add to your deck`;
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
        drawCreatureMiniCard(card.previewCreature, { x: sx, y: sy, w: sideW, h: sideH }, true);
      }
    }
  }

  // Back button (matches character select style) — hidden in shrine mode
  if (!shrineAbilityMode) {
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

function moveToMapNode(node) {
  if (!node || !currentMap) return;
  if (node.isLocked) return;
  const current = currentMap.getCurrentNode();
  if (!current || !current.connections.includes(node.id)) return;
  if (node.isDone && !node.canRevisit) {
    currentMap.currentNodeId = node.id;
  } else {
    startNodeEncounter(node.id);
  }
}

function handleMapClick(x, y) {
  const rects = getMapNodeRects();
  for (const r of rects) {
    if (!hitTest(x, y, r)) continue;
    const node = r.node;

    // Clicking current node
    if (r.nodeId === currentMap.currentNodeId) {
      if (node.canRevisit && node.encounterId) {
        startNodeEncounter(r.nodeId);
      }
      return;
    }

    // Clicking connected node
    const current = currentMap.getCurrentNode();
    if (!current.connections.includes(r.nodeId)) continue;
    if (node.isLocked) continue;

    if (node.isDone && !node.canRevisit) {
      // Just move there
      currentMap.currentNodeId = r.nodeId;
    } else {
      // Move and start encounter
      startNodeEncounter(r.nodeId);
    }
    return;
  }
}

// Encounter ID → background image key mapping
const ENCOUNTER_BG_MAP = {
  // Prison
  giant_rat: 'bg_prison', locked_door: 'bg_prison', bone_pile: 'bg_prison',
  crack: 'bg_prison', prison_entrance: 'bg_prison_entrance', prison_wing: 'bg_prison_wing',
  corner_cell: 'bg_prison', kitchen: 'bg_kitchen', leave_prison: 'bg_leaving_prison',
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
    ctx.fillStyle = '#1a0a2e';
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

  if (!node.encounterId || !ENCOUNTER_REGISTRY[node.encounterId]) {
    // No encounter defined — just mark done and stay on map
    currentMap.completeCurrentNode();
    state = GameState.MAP;
    return;
  }

  currentEncounter = ENCOUNTER_REGISTRY[node.encounterId]();
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
      gold += lootGoldAmount;
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
      for (let i = 0; i < 4; i++) enemy.deck.addCard(createSkreeeeeeeek());
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
      enemy.addCreature(new Creature({ name: 'Kobold Guard', attack: 2, maxHp: 1 }));
      enemy.addCreature(new Creature({ name: 'Kobold Guard', attack: 2, maxHp: 1 }));
    },
    dire_rat: () => {
      enemy = new Character('Dire Rat');
      enemy.deck = new Deck();
      for (let i = 0; i < 6; i++) enemy.deck.addCard(createDireRatBite());
      for (let i = 0; i < 4; i++) enemy.deck.addCard(createToughHide());
      for (let i = 0; i < 4; i++) enemy.deck.addCard(createDireRatScreech());
      // 2 rat creatures
      enemy.addCreature(new Creature({ name: 'Rat', attack: 2, maxHp: 2 }));
      enemy.addCreature(new Creature({ name: 'Rat', attack: 2, maxHp: 2 }));
    },
  };

  ENEMY_DECKS.kobold_patrol = () => {
    enemy = new Character('Kobold Patrol');
    enemy.deck = new Deck();
    for (let i = 0; i < 5; i++) enemy.deck.addCard(createSpearThrow());
    for (let i = 0; i < 5; i++) enemy.deck.addCard(createIcyBreath());
    for (let i = 0; i < 5; i++) enemy.deck.addCard(createShieldBashEnemy());
    enemy.addCreature(new Creature({ name: 'Kobold Guard', attack: 2, maxHp: 1 }));
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
      enemy.addCreature(new Creature({ name: 'Kobold Guard', attack: 2, maxHp: 1 }));
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

    // Node circle
    let color;
    if (isCurrent) color = Colors.GREEN;
    else if (isAccessible && !node.isLocked) color = Colors.GOLD;
    else if (node.isDone) color = Colors.DARK_GRAY;
    else color = '#333';

    ctx.beginPath();
    ctx.arc(nx, ny, 18, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.globalAlpha = (hovered && (isCurrent || isAccessible)) ? 1 : 0.8;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = isCurrent ? Colors.WHITE : '#888';
    ctx.lineWidth = isCurrent ? 3 : 1;
    ctx.stroke();

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

    // Speaker
    if (entry.speaker) {
      ctx.fillStyle = Colors.GOLD;
      ctx.font = 'bold 23px Georgia, serif';
      ctx.fillText(entry.speaker === '!' ? '!!!' : entry.speaker, innerX, cursorY + 22);
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
        const kitchen = currentMap.getNode('kitchen');
        if (kitchen) kitchen.isLocked = false;
        currentMap.completeCurrentNode();
        currentMap.currentNodeId = 'kitchen';
        startNodeEncounter('kitchen');
        return;
      }

      case 'kitchen_attack':
        // Cook flees, player takes 1 damage from pot
        player.takeDamageFromDeck(1);
        break;

      case 'kitchen_talk': {
        // Cook gives chicken leg
        const leg = createChickenLeg();
        player.deck.addCard(leg, true);
        break;
      }

      case 'kitchen_sneak':
        // Successfully sneak out, no consequence
        break;

      case 'investigate_prison_wing': {
        // Unlock corner cell, move there
        const corner = currentMap.getNode('corner_cell');
        if (corner) corner.isLocked = false;
        currentMap.completeCurrentNode();
        currentMap.currentNodeId = 'corner_cell';
        startNodeEncounter('corner_cell');
        return;
      }

      case 'leave_prison':
        currentMap.completeCurrentNode();
        showTitleCard('Chapter 2: The Mountain Path', 'Freedom at last...', () => {
          currentMap = createMountainPathMap();
          visitedNodes = new Set();
          startNodeEncounter('mountain_camp');
        });
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

      case 'prison_fight':
      case 'prison_snatch':
        // Both lead to combat (handled by next phase)
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
      encounterChoiceResult = null;
      currentEncounter = null;
      state = GameState.MAP;
      if (nodeDeactivated) autosaveNow();
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
      return;
    }
  }
}

// Safe autosave — wraps try/catch so a save failure never crashes the game
function autosaveNow() {
  try {
    if (!player || !currentMap) return;
    saveToAutoSlot({ selectedClass, gold, player, currentMap, visitedNodes, backpack });
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
  const lootPool = [
    { creator: createSmallPouch, weight: 1.0 },
    { creator: createBadRations, weight: 1.0 },
    { creator: createTorch, weight: 0.5 },
    { creator: createSturdyBoots, weight: 0.5 },
    { creator: createScrollOfPotency, weight: 0.5 },
    { creator: createWandOfFire, weight: 0.5 },
    { creator: createMinorHealingPotion, weight: 0.25 },
  ];
  // Draw 2 distinct entries from the pool (weighted without replacement)
  const available = lootPool.slice();
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

function resolveShortRest(choice) {
  // Out of combat: just reduce discard pile (simulates healing for next combat)
  const amount = choice.effectValue || 5;
  const healed = [];
  for (let i = 0; i < amount && player.deck.discardPile.length > 0; i++) {
    const card = player.deck.discardPile.pop();
    healed.push(card.name);
  }
  if (healed.length > 0) {
    choice.resultText = `You rest and feel strength returning. Recovered ${healed.length} card${healed.length > 1 ? 's' : ''}.`;
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
      // Gold banner above the cards
      if (encounterChoiceResult._lootGold > 0) {
        ctx.fillStyle = Colors.GOLD;
        ctx.font = 'bold 22px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText(`+${encounterChoiceResult._lootGold} Gold  (Total: ${gold})`, SCREEN_WIDTH / 2, lootY - 4);
      }
      for (let i = 0; i < lootItems.length; i++) {
        const cx = startX + i * (cardW + gap);
        drawCard(lootItems[i], cx, lootY + 16, cardW, cardH, false, false, 'full');
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
    y += 50;
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
    addLog(`  Tough: +${shieldStacks} Shield!`, Colors.ALLY_BLUE);
    spawnTokenOnTarget(player, shieldStacks, 'Shield', Colors.ALLY_BLUE);
  }
  // Heroism perk
  const heroismStacks = player.getPerkStacks('combat_start_heroism');
  if (heroismStacks > 0) {
    player.heroism += heroismStacks;
    addLog(`  Prepared: +${heroismStacks} Heroism!`, Colors.GOLD);
    spawnTokenOnTarget(player, heroismStacks, 'Heroism', Colors.GOLD);
  }
  // First Strike perk
  const firstStrike = player.getPerkStacks('combat_start_first_strike');
  if (firstStrike > 0) {
    // Deal damage to random enemy creature or enemy
    const targets = enemy.creatures.filter(c => c.isAlive);
    if (targets.length > 0) {
      const t = targets[Math.floor(Math.random() * targets.length)];
      t.takeUnpreventableDamage(firstStrike);
      addLog(`  First Strike: ${firstStrike} dmg to ${t.name}!`, Colors.GOLD);
      if (!t.isAlive) { addLog(`  ${t.name} destroyed!`, Colors.GOLD); countAndRemoveDeadCreatures(); }
    } else if (enemy.isAlive) {
      enemy.takeDamageFromDeck(firstStrike);
      addLog(`  First Strike: ${firstStrike} dmg to ${enemy.name}!`, Colors.GOLD);
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
// Hand cards are 2/3 the size of the character card (220x300 → 147x200)
const CARD_W = 147;
const CARD_H = 200;
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
    ? charRect.y - CREATURE_CARD_H - 6 // aligned with the power row, just above the char card
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
};

// Tokenize text into words and inline icons
// Returns array of { type: 'text'|'icon', text?, keyword?, iconKey? }
function tokenizeKeywordText(text) {
  // Split into words while preserving delimiters
  const tokens = [];
  // Match keywords (case-insensitive whole word) - longest first to avoid partial matches.
  // "Scry N" and "Heal N" are captured as a single token (number stays with the keyword).
  const keywords = ['Scry\\s+\\d+', 'Heal\\s+\\d+', 'Heroism', 'Shields', 'Shield', 'Armor', 'Fire', 'Ice', 'Poison', 'Shock', 'Rage'];
  const pattern = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g');
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

// Count how many lines text would wrap to (matches drawIconText layout)
function countWrappedLines(text, maxWidth, fontSize) {
  const tokens = tokenizeKeywordText(text);
  const iconSize = Math.floor(fontSize * 1.3);
  ctx.font = `${fontSize}px sans-serif`;
  const units = [];
  for (const tok of tokens) {
    if (tok.type === 'icon') {
      units.push({ type: 'icon', width: iconSize });
    } else {
      const parts = tok.text.split(/(\s+)/);
      for (const p of parts) {
        if (p) units.push({ type: 'text', text: p, width: ctx.measureText(p).width });
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
function drawIconText(text, centerX, startY, maxWidth, fontSize, color = '#eee') {
  const tokens = tokenizeKeywordText(text);
  const iconSize = Math.floor(fontSize * 1.3);
  const lineH = Math.max(fontSize + 4, iconSize + 2);
  ctx.font = `${fontSize}px sans-serif`;

  // Build word-level units (split text tokens on whitespace)
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

  // Measure unit widths
  for (const u of units) {
    if (u.type === 'icon') u.width = iconSize;
    else u.width = ctx.measureText(u.text).width;
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

// Which frame asset to use for a given card. Returns the image key or null to
// skip frame rendering. For now every non-rare card uses frame_common; we can
// branch on rarity/class later as more frame PNGs land.
function getCardFrameKey(card) {
  return 'frame_common';
}

// Blend a hex tint color with gold (40/60) to approximate the visible color of
// the tinted frame — used for UI accents (name bar stroke, description box
// outline, subtype label) so they read as part of the same theme.
function getFrameAccentColorFromHex(tintHex) {
  if (!tintHex) return Colors.GOLD;
  const tr = parseInt(tintHex.slice(1, 3), 16);
  const tg = parseInt(tintHex.slice(3, 5), 16);
  const tb = parseInt(tintHex.slice(5, 7), 16);
  // Gold #ffd700 → 255, 215, 0
  const r = Math.round(255 * 0.4 + tr * 0.6);
  const g = Math.round(215 * 0.4 + tg * 0.6);
  const b = Math.round(0   * 0.4 + tb * 0.6);
  return `rgb(${r},${g},${b})`;
}

// Convenience wrapper for cards: look up the subtype's hex and call the
// hex-based helper.
function getFrameAccentColor(subtype) {
  const tintHex = subtype ? SUBTYPE_COLORS[subtype] : null;
  return getFrameAccentColorFromHex(tintHex);
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
    ctx.fillStyle = borderColor;
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

    // Measure the wrapped text FIRST so we can auto-expand the box if the
    // description doesn't fit its base height (e.g. Magic Missiles at 4 lines).
    const descFontSize = Math.max(11, Math.floor(w * 0.058));
    let descText = card.description || card.shortDesc || '';
    if (card.id === 'sneak_attack' && isCombatContext()) descText = descText.replace(/X/g, String(attacksThisTurn + 1));
    const iconSize = Math.floor(descFontSize * 1.3);
    const lineH = Math.max(descFontSize + 4, iconSize + 2);
    const lines = countWrappedLines(descText, descBoxW - 16, descFontSize);
    const totalH = lines * lineH;
    const textPadding = 14; // internal padding: 7 px top + 7 px bottom
    const baseBoxH = Math.floor(h / 5);
    // Grow the box only when the text won't fit the base height.
    const descBoxH = Math.max(baseBoxH, totalH + textPadding);

    const descBoxX = x + leftInset;
    const descBoxY = y + h - descBoxH - bottomInset;

    ctx.fillStyle = 'rgba(0,0,0,0.78)';
    ctx.fillRect(descBoxX, descBoxY, descBoxW, descBoxH);
    ctx.strokeStyle = getFrameAccentColor(card.subtype);
    ctx.lineWidth = 1;
    ctx.strokeRect(descBoxX, descBoxY, descBoxW, descBoxH);

    const startY = descBoxY + (descBoxH - totalH) / 2;
    drawIconText(descText, x + w / 2, startY, descBoxW - 16, descFontSize, '#f0f0f0');
  } else if (card.shortDesc || card.description) {
    // Small size: auto-sized box. Sides 6 px inside frame (was 2), bottom
    // inset 6 (was 2) to lift it off the frame's bottom filigree.
    let descText = card.shortDesc || card.description;
    if (card.id === 'sneak_attack' && isCombatContext()) descText = descText.replace(/X/g, String(attacksThisTurn + 1));
    const descFontSize = Math.max(8, Math.floor(w * 0.085));
    const sideInset = 6;
    const bottomInset = 10; // lifted another 4 px off the bottom filigree
    const lines = countWrappedLines(descText, w - sideInset * 2 - 4, descFontSize);
    const linesToShow = Math.min(2, lines);
    const iconSize = Math.floor(descFontSize * 1.3);
    const lineH = Math.max(descFontSize + 2, iconSize + 1);
    const descBoxH = linesToShow * lineH + 4;
    const descBoxY = y + h - descBoxH - bottomInset;
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(x + sideInset, descBoxY, w - sideInset * 2, descBoxH);
    drawIconText(descText, x + w / 2, descBoxY + 2, w - sideInset * 2 - 4, descFontSize, '#eee');
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
      const accentColor = getFrameAccentColor(card.subtype);
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
  // Draw all cards in order so later cards overlap earlier ones,
  // EXCEPT the hovered (and selected) cards — draw them last so they sit on top.
  for (let i = 0; i < player.deck.hand.length; i++) {
    if (i === hoveredHandIndex || i === selectedCardIndex) continue;
    const card = player.deck.hand[i];
    const r = handRects[i];
    drawCard(card, r.x, r.y, r.w, r.h, false, false);
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
  const bannerH = 28;
  const bannerY = COMBAT_DIVIDER_Y - bannerH / 2;
  const bannerColor = isPlayerTurn ? 'rgba(60, 160, 60, 0.85)' : 'rgba(180, 60, 60, 0.85)';
  ctx.fillStyle = bannerColor;
  ctx.fillRect(0, bannerY, COMBAT_LEFT_W, bannerH);
  ctx.strokeStyle = isPlayerTurn ? Colors.GREEN : Colors.RED;
  ctx.lineWidth = 2;
  ctx.strokeRect(0, bannerY, COMBAT_LEFT_W, bannerH);

  ctx.font = 'bold 18px Georgia, serif';
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
    // Arrow from the power card to the cursor
    const idx = player.powers.indexOf(selectedPower);
    if (idx !== -1) {
      const r = getCharacterPowerRect(true, idx);
      const startX = r.x + r.w / 2;
      const startY = r.y + r.h / 2;
      drawTargetingArrow(startX, startY, mouseX, mouseY, Colors.RED);
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
  const isPlayerOwned = creature.owner === player;

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

  // 2. Name banner at top — gold text on a dark backing
  const nameFontSize = Math.max(14, Math.floor(w * 0.085));
  ctx.font = `bold ${nameFontSize}px Georgia, serif`;
  const nameLines = wrapText(creature.name, w - 16, nameFontSize);
  const nameLineH = nameFontSize + 4;
  let maxNameW = 0;
  for (const line of nameLines) {
    const m = ctx.measureText(line).width;
    if (m > maxNameW) maxNameW = m;
  }
  const nameBoxW = Math.min(w - 8, maxNameW + 16);
  const nameBoxH = nameLines.length * nameLineH + 8;
  const nameBoxX = x + (w - nameBoxW) / 2;
  const nameBoxY = y + 8;
  ctx.fillStyle = 'rgba(0,0,0,0.78)';
  ctx.fillRect(nameBoxX, nameBoxY, nameBoxW, nameBoxH);
  ctx.fillStyle = Colors.GOLD;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let nameY = nameBoxY + nameLineH / 2 + 4;
  for (const line of nameLines) {
    ctx.fillText(line, x + w / 2, nameY);
    nameY += nameLineH;
  }

  // 3. Bottom box — ~1/5 of card height by default. Contains the description text
  // (if any) at the top of the box and a stats row (attack number + HP bar) at the
  // bottom. Grows slightly when there's a description that wouldn't otherwise fit.
  let boxH = Math.floor(h / 5);
  if (creature.description) {
    // Reserve enough room for the stats row plus at least one description line
    const minDescH = 20;
    const minStatsH = 28;
    boxH = Math.max(boxH, minDescH + minStatsH);
  }
  const boxX = x + 8;
  const boxY = y + h - boxH - 8;
  const boxW = w - 16;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
  ctx.fillRect(boxX, boxY, boxW, boxH);
  ctx.strokeStyle = isPlayerOwned ? Colors.ALLY_BLUE : Colors.BROWN;
  ctx.lineWidth = 1;
  ctx.strokeRect(boxX, boxY, boxW, boxH);

  // Stats row inside the bottom box
  const statsRowH = Math.max(20, Math.floor(boxH * 0.45));
  const statsTop = boxY + boxH - statsRowH;
  const statsBottom = boxY + boxH - 4;

  // HP bar (right half of stats row)
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

  // Attack number (left half of stats row)
  ctx.font = `bold ${Math.floor(statsRowH * 0.85)}px sans-serif`;
  ctx.fillStyle = Colors.WHITE;
  ctx.textAlign = 'left';
  ctx.fillText(`${creature.attack}`, boxX + 8, hpBarY + hpBarH / 2 + 1);
  if (creature.poisonAttack) {
    const atkTextW = ctx.measureText(`${creature.attack}`).width;
    const poisonImg = images['icon_poison'];
    const pIconSize = Math.max(12, Math.floor(statsRowH * 0.75));
    const px = boxX + 8 + atkTextW + 3;
    const py = hpBarY + (hpBarH - pIconSize) / 2;
    if (poisonImg) ctx.drawImage(poisonImg, px, py, pIconSize, pIconSize);
  }

  // Description text inside the box, above the stats row
  const descText = creature.description || (creature.unpreventable ? 'Deals Unpreventable Damage' : '');
  if (descText) {
    ctx.fillStyle = '#f0f0f0';
    const dFont = 13;
    ctx.font = `${dFont}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const descAreaH = statsTop - boxY - 6;
    const lines = wrapText(descText, boxW - 12, dFont);
    let dy = boxY + 4;
    const maxLines = Math.max(1, Math.floor(descAreaH / (dFont + 3)));
    for (const line of lines.slice(0, maxLines)) {
      ctx.fillText(line, x + w / 2, dy);
      dy += dFont + 3;
    }
  }

  // 4. Outer border
  ctx.strokeStyle = isPlayerOwned ? Colors.ALLY_BLUE : Colors.BROWN;
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

// Draw a full-size preview of a power card (similar to a card but without modes/etc)
function drawPowerPreviewCard(power, x, y, w, h) {
  const art = images[`power_${power.id}`];

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

  // Tight name box at top — auto-sized to wrap around the text (matches drawCard full size)
  const nameFontSize = Math.max(11, Math.floor(w * 0.085));
  ctx.font = `bold ${nameFontSize}px sans-serif`;
  const nameLines = wrapText(power.name, w - 16, nameFontSize);
  const nameLineH = nameFontSize + 4;
  let maxLineW = 0;
  for (const line of nameLines) {
    const m = ctx.measureText(line).width;
    if (m > maxLineW) maxLineW = m;
  }
  const nameBoxW = Math.min(w - 8, maxLineW + 16);
  const nameBoxH = nameLines.length * nameLineH + 6;
  const nameBoxX = x + (w - nameBoxW) / 2;
  const nameBoxY = y + 8;
  ctx.fillStyle = 'rgba(0,0,0,0.8)';
  ctx.fillRect(nameBoxX, nameBoxY, nameBoxW, nameBoxH);
  ctx.fillStyle = Colors.GOLD;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let nLy = nameBoxY + nameLineH / 2 + 3;
  for (const line of nameLines) {
    ctx.fillText(line, x + w / 2, nLy);
    nLy += nameLineH;
  }
  ctx.textBaseline = 'alphabetic';

  // Description box at bottom (about 1/4 of card height like full size cards)
  const descBoxH = Math.floor(h / 4);
  const descBoxX = x + 8;
  const descBoxY = y + h - descBoxH - 8;
  const descBoxW = w - 16;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
  ctx.fillRect(descBoxX, descBoxY, descBoxW, descBoxH);
  ctx.strokeStyle = '#8c3c8c';
  ctx.lineWidth = 1;
  ctx.strokeRect(descBoxX, descBoxY, descBoxW, descBoxH);

  // Draw the full description with cost on the full preview:
  // "Recharge 2 Cards -> Deal 3 Damage." instead of just the effect.
  let descText;
  if (power.costDescription && power.costDescription !== 'Passive') {
    descText = `${power.costDescription} -> ${power.effectDescription || ''}`.trim();
  } else {
    descText = power.effectDescription || power.fullDescription || '';
  }
  const fontSize = 14;
  const lineCount = countWrappedLines(descText, descBoxW - 12, fontSize);
  const iconSize = Math.floor(fontSize * 1.3);
  const lineH = Math.max(fontSize + 4, iconSize + 2);
  const totalH = lineCount * lineH;
  const startY = descBoxY + (descBoxH - totalH) / 2;
  drawIconText(descText, x + w / 2, startY, descBoxW - 12, fontSize, '#f0f0f0');
  ctx.textBaseline = 'alphabetic';

  // Purple border
  ctx.strokeStyle = '#8c3c8c';
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);

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
      'Kobold Patrol': 'kobold_warden',
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

  // Message higher up on the image (about 1/4 from the top)
  const msgY = Math.round(SCREEN_HEIGHT * 0.22);
  ctx.font = 'bold 42px Georgia, serif';
  ctx.textAlign = 'center';
  const tw = ctx.measureText(combatIntroMessage).width;
  // Black semi-transparent backing (no border)
  ctx.fillStyle = `rgba(0,0,0,${0.8 * alpha})`;
  ctx.fillRect(SCREEN_WIDTH / 2 - tw / 2 - 20, msgY - 36, tw + 40, 56);
  ctx.shadowColor = `rgba(0,0,0,${alpha})`;
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
  ctx.fillText(combatIntroMessage, SCREEN_WIDTH / 2, msgY);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

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
const COMBAT_CHAR_W = 220;
const COMBAT_CHAR_H = 300;
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
  // Character card takes ~2/3 of the area height (300/480 ≈ 0.625)
  const x = area.x + 16;
  const y = isPlayer
    ? area.y + (area.h - COMBAT_CHAR_H) - 16  // anchored toward bottom (1/3 of height above for power)
    : area.y + 16;                             // anchored toward top (1/3 of height below for power)
  return { x, y, w: COMBAT_CHAR_W, h: COMBAT_CHAR_H };
}

// Get the rect for the i-th power card (smaller, above player or below enemy)
// Powers laid out left-to-right, left-aligned with the character card.
function getCharacterPowerRect(isPlayer, index = 0) {
  const charRect = getCharacterCardRect(isPlayer);
  const x = charRect.x + index * (COMBAT_POWER_W + 8);
  const y = isPlayer
    ? charRect.y - COMBAT_POWER_H - 6  // above the player card (2px closer)
    : charRect.y + COMBAT_CHAR_H + 6;  // below the enemy card (2px closer)
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

  if (hasArt) {
    const imgAspect = portrait.width / portrait.height;
    const cardAspect = rect.w / rect.h;
    let sx = 0, sy = 0, sw = portrait.width, sh = portrait.height;
    if (imgAspect > cardAspect) { sw = portrait.height * cardAspect; sx = (portrait.width - sw) / 2; }
    else { sh = portrait.width / cardAspect; sy = (portrait.height - sh) / 2; }
    ctx.drawImage(portrait, sx, sy, sw, sh, rect.x, rect.y, rect.w, rect.h);
  } else {
    ctx.fillStyle = isPlayer ? '#1a3a4e' : '#3a1a1a';
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  }

  // White border (matches py game)
  ctx.strokeStyle = Colors.WHITE;
  ctx.lineWidth = 3;
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);

  // Semi-transparent overlay inside the border for text readability (matches py: alpha 120)
  if (hasArt) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.47)';
    ctx.fillRect(rect.x + 3, rect.y + 3, rect.w - 6, rect.h - 6);
  }

  // Character name (with level only for player) at top, white
  ctx.fillStyle = Colors.WHITE;
  ctx.font = 'bold 18px Georgia, serif';
  ctx.textAlign = 'center';
  const displayName = isPlayer && player
    ? `${character.name} (${player.level || 1})`
    : character.name;
  ctx.fillText(displayName, rect.x + rect.w / 2, rect.y + 26);

  // Card counts: Hand / Deck / Discard centered
  const infoTop = rect.y + 50;
  const handCount = character.deck.hand.length;
  const deckCount = character.deck.drawPile.length;
  const rechargeCount = character.deck.rechargePile.length;
  const discardCount = character.deck.discardPile.length;

  ctx.font = '15px sans-serif';
  ctx.fillStyle = Colors.WHITE;
  ctx.fillText(`Hand: ${handCount}`, rect.x + rect.w / 2, infoTop);

  let deckText = `Deck: ${deckCount}`;
  if (rechargeCount > 0) deckText += `(${rechargeCount})`;
  // In debug mode, highlight deck count as clickable (draw 1 card)
  if (debugMode && isPlayer) ctx.fillStyle = '#8f8';
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
    ctx.fillStyle = Colors.WHITE;
  }

  // "Discard: N" — hover the row to preview the top discarded card
  ctx.fillStyle = '#aaa';
  const discardLabel = `Discard: ${discardCount}`;
  ctx.fillText(discardLabel, rect.x + rect.w / 2, infoTop + 44);
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

  // Status icons row (shield, heroism, etc.) above the HP bar
  const iconRowY = rect.y + rect.h - 70;
  let iconX = rect.x + 10;
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
    ctx.fillStyle = color;
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(value.toString(), iconX, iconRowY + 17);
    iconX += ctx.measureText(value.toString()).width + 8;
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

  // HP bar at the bottom of the card (green)
  const hp = getHP(character);
  const maxHp = getMaxHP(character);
  const barX = rect.x + 10, barW = rect.w - 20, barH = 22;
  const barY = rect.y + rect.h - barH - 10;
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
function drawCreatureCard(creature, rect, isPlayer) {
  const targetingNow =
    state === GameState.TARGETING ||
    state === GameState.POWER_TARGETING ||
    state === GameState.ALLY_TARGETING ||
    state === GameState.MULTI_TARGETING;
  const isTargetable = targetingNow && !isPlayer;
  const isPicked =
    (state === GameState.POWER_TARGETING && powerTargets.includes(creature)) ||
    (state === GameState.MULTI_TARGETING && multiTargets.includes(creature));
  // Highlight a ready ally that's selected for ally-targeting
  const isSelectedAlly = isPlayer && state === GameState.ALLY_TARGETING && selectedAlly === creature;
  const isReadyAlly = isPlayer && !creature.exhausted && state === GameState.COMBAT;

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

  // Border (blue for player ally, brown for enemy)
  ctx.strokeStyle = isPlayer ? Colors.ALLY_BLUE : Colors.BROWN;
  ctx.lineWidth = 2;
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);

  // Name at top — wrap to 2 lines if needed
  const nameFontSize = 11;
  ctx.font = `bold ${nameFontSize}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const maxNameW = rect.w - 6;
  const nameLines = wrapText(creature.name, maxNameW, nameFontSize);
  // Subtle backing for readability
  const nameBgH = Math.min(nameLines.length, 2) * (nameFontSize + 2) + 4;
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(rect.x + 2, rect.y + 2, rect.w - 4, nameBgH);
  ctx.fillStyle = Colors.GOLD;
  let ny = rect.y + 4;
  for (let i = 0; i < Math.min(nameLines.length, 2); i++) {
    ctx.fillText(nameLines[i], rect.x + rect.w / 2, ny);
    ny += nameFontSize + 2;
  }

  // HP bar (right half of bottom row)
  const rowBottom = rect.y + rect.h - 4;
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

  // Attack number on the left of the bottom row
  ctx.font = 'bold 16px sans-serif';
  ctx.fillStyle = Colors.WHITE;
  ctx.textAlign = 'left';
  ctx.fillText(`${creature.attack}`, rect.x + 6, hpBarY + hpBarH / 2 + 1);
  // Poison-attack indicator (icon beside the attack number)
  if (creature.poisonAttack) {
    const atkTextW = ctx.measureText(`${creature.attack}`).width;
    const poisonImg = images['icon_poison'];
    const pIconSize = 14;
    const px = rect.x + 6 + atkTextW + 2;
    const py = hpBarY + (hpBarH - pIconSize) / 2;
    if (poisonImg) {
      ctx.drawImage(poisonImg, px, py, pIconSize, pIconSize);
    } else {
      // Fallback dot
      ctx.fillStyle = Colors.GREEN;
      ctx.beginPath(); ctx.arc(px + 6, py + 7, 4, 0, Math.PI * 2); ctx.fill();
    }
  }

  // Status badges row (above HP/attack): shield, heroism, armor, fire/ice/poison
  const badgeY = hpBarY - 18;
  let bx = rect.x + 4;
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  if (creature.shield > 0) {
    ctx.fillStyle = Colors.ALLY_BLUE;
    ctx.fillText(`S${creature.shield}`, bx, badgeY + 6);
    bx += 18;
  }
  if (creature.heroism > 0) {
    ctx.fillStyle = Colors.GOLD;
    ctx.fillText(`H${creature.heroism}`, bx, badgeY + 6);
    bx += 18;
  }
  if (creature.armor > 0) {
    ctx.fillStyle = Colors.GRAY;
    ctx.fillText(`A${creature.armor}`, bx, badgeY + 6);
    bx += 18;
  }
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

  // Exhausted overlay (Zzz) for any exhausted creature (player ally or freshly summoned enemy)
  if (creature.exhausted) {
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

  // Register hover hit area so hovering shows the full-size preview
  logCardHitAreas.push({
    x: rect.x, y: rect.y, w: rect.w, h: rect.h,
    creature: creature,
  });
}

// Visual-only creature mini card (no hit area registration). Used for the side
// preview that appears next to a hovered card with a previewCreature, so hovering
// over it doesn't try to chain another preview.
function drawCreatureMiniCard(creature, rect, isPlayer) {
  // Try creature art first
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

  // Border
  ctx.strokeStyle = isPlayer ? Colors.ALLY_BLUE : Colors.BROWN;
  ctx.lineWidth = 2;
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);

  // Name banner at top
  const nameFontSize = 11;
  ctx.font = `bold ${nameFontSize}px sans-serif`;
  const nameLines = wrapText(creature.name, rect.w - 6, nameFontSize);
  const nameLineH = nameFontSize + 2;
  const nameBgH = Math.min(nameLines.length, 2) * nameLineH + 4;
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(rect.x + 2, rect.y + 2, rect.w - 4, nameBgH);
  ctx.fillStyle = Colors.GOLD;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  let ny = rect.y + 4;
  for (let i = 0; i < Math.min(nameLines.length, 2); i++) {
    ctx.fillText(nameLines[i], rect.x + rect.w / 2, ny);
    ny += nameLineH;
  }

  // Bottom box: attack number on left, HP bar on right
  const boxH = Math.floor(rect.h / 5) + 4;
  const boxY = rect.y + rect.h - boxH - 2;
  ctx.fillStyle = 'rgba(0,0,0,0.78)';
  ctx.fillRect(rect.x + 2, boxY, rect.w - 4, boxH);

  // HP bar (right half)
  const hpBarX = rect.x + rect.w / 2 + 2;
  const hpBarW = rect.w / 2 - 6;
  const hpBarH = Math.floor(boxH * 0.6);
  const hpBarY = boxY + (boxH - hpBarH) / 2;
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

  // Attack number (left half)
  ctx.font = 'bold 14px sans-serif';
  ctx.fillStyle = Colors.WHITE;
  ctx.textAlign = 'left';
  ctx.fillText(`${creature.attack}`, rect.x + 6, hpBarY + hpBarH / 2 + 1);
  if (creature.poisonAttack) {
    const atkTextW = ctx.measureText(`${creature.attack}`).width;
    const poisonImg = images['icon_poison'];
    const pIconSize = 12;
    const px = rect.x + 6 + atkTextW + 2;
    const py = hpBarY + (hpBarH - pIconSize) / 2;
    if (poisonImg) ctx.drawImage(poisonImg, px, py, pIconSize, pIconSize);
  }

  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
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

  // Tight name box at top — auto-sized to wrap around the text (matches drawCard style)
  const nameFontSize = Math.max(9, Math.floor(r.w * 0.11));
  ctx.font = `bold ${nameFontSize}px sans-serif`;
  const nameLines = wrapText(power.name, r.w - 8, nameFontSize);
  const nameLineH = nameFontSize + 2;
  // Find widest line so the box is sized to text width
  let maxLineW = 0;
  for (const line of nameLines) {
    const m = ctx.measureText(line).width;
    if (m > maxLineW) maxLineW = m;
  }
  const nameBoxW = Math.min(r.w - 4, maxLineW + 10);
  const nameBoxH = nameLines.length * nameLineH + 4;
  const nameBoxX = r.x + (r.w - nameBoxW) / 2;
  const nameBoxY = r.y + 4;
  ctx.fillStyle = 'rgba(0,0,0,0.8)';
  ctx.fillRect(nameBoxX, nameBoxY, nameBoxW, nameBoxH);
  ctx.fillStyle = Colors.GOLD;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let nameLineY = nameBoxY + nameLineH / 2 + 2;
  for (const line of nameLines) {
    ctx.fillText(line, r.x + r.w / 2, nameLineY);
    nameLineY += nameLineH;
  }
  ctx.textBaseline = 'alphabetic';

  // Short desc box at bottom (with inline keyword icons)
  if (power.shortDesc) {
    const descLines = power.shortDesc.split('\n');
    const fontSize = 10;
    const iconSize = Math.floor(fontSize * 1.3);
    const lineH = Math.max(fontSize + 2, iconSize + 1);
    const descBoxH = descLines.length * lineH + 6;
    const descBoxY = r.y + r.h - descBoxH - 2;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(r.x + 2, descBoxY, r.w - 4, descBoxH);
    let dy = descBoxY + 3;
    for (const line of descLines) {
      drawIconText(line, r.x + r.w / 2, dy, r.w - 6, fontSize, '#eee');
      dy += lineH;
    }
  }

  // Purple border (matches py game)
  const PURPLE = '#8c3c8c';
  ctx.strokeStyle = PURPLE;
  ctx.lineWidth = 2;
  ctx.strokeRect(r.x, r.y, r.w, r.h);

  // White border when this power is the selected one (matches selected card style)
  if (clickable && selectedPower === power) {
    ctx.strokeStyle = Colors.WHITE;
    ctx.lineWidth = 3;
    ctx.strokeRect(r.x - 2, r.y - 2, r.w + 4, r.h + 4);
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
          state = GameState.TARGETING;
          showStyledToast('Recharge 1 card for 3 shots, or click enemy for 1 shot', 'recharge');
          return;
        }
        // No extra recharge cost: proceed normally
        if (canPlayWithoutTarget(card)) {
          playCardSelf(i);
        } else if (cardIsMultiTarget(card)) {
          enterMultiTargeting(i);
        } else if (needsTarget(card)) {
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
    const idx = player.deck.rechargePile.indexOf(c);
    if (idx !== -1) player.deck.rechargePile.splice(idx, 1);
    // Restore pre-recharge exhausted state (addToRechargePile had reset it)
    c.exhausted = !!c._preRechargeExhausted;
    delete c._preRechargeExhausted;
    player.deck.hand.push(c);
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
    player.deck.hand.push(barrageRechargedCard);
    addLog('  Barrage cancelled, card refunded.', Colors.GRAY);
  }
  barrageRechargedCard = null;
  barrageMode = false;
  barrageShotsLeft = 0;
  barrageShotsFired = 0;
  barrageCardIndex = -1;
}

let attacksThisTurn = 0; // for sneak_attack scaling

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
     e.effectType === 'shield_bash' || e.effectType === 'charge_attack')
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
      const thorb = new Creature({ name: 'Thorb', attack: 2, maxHp: 4, isCompanion: true });
      player.addCreature(thorb);
      // Newly summoned creatures stay exhausted (Zzz) and ready next turn
      addLog(`  Thorb joins the fight!`, Colors.GREEN);
      break;
    }
    case 'summon_thorb_upgraded': {
      const thorb = new Creature({ name: 'Thorb', attack: 2, maxHp: 5, sentinel: true, isCompanion: true });
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
        state = GameState.SCRY_SELECT;
        showStyledToast(`Scry ${revealed.length}: pick 1 card to draw, the rest are recharged`, 'scry');
      }
      break;
    }
    // Effects we acknowledge but don't fully implement yet
    case 'buff_allies_heroism':
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
  if (stays) {
    card.exhausted = true;
    addLog(`You use ${card.name} (stays in hand)`, Colors.GREEN, card);
  } else {
    // Lift the card OUT of hand BEFORE resolving effects so it can't interact with itself
    // (e.g. Scraps must not heal itself back from the discard pile).
    liftCardFromHand(handIndex);
    addLog(`You play ${card.name}`, Colors.GREEN, card);
  }

  for (const eff of card.currentEffects) {
    if (eff.effectType === 'stays_in_hand') continue;
    resolveEffect(eff, player, enemy);
  }

  // Pay the cost AFTER effects resolve
  if (!stays) player.deck.placeByCost(card);

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
    showStyledToast(`-${toClear} Poison (healed)`, 'scry', 2000);
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
    showStyledToast(`+${healed} Healed`, 'heal', 2000);
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
    // Pull back from wherever we placed it (recharge pile or discard pile for discard-cost powers)
    const rcIdx = player.deck.rechargePile.indexOf(card);
    if (rcIdx !== -1) player.deck.rechargePile.splice(rcIdx, 1);
    const discIdx = player.deck.discardPile.indexOf(card);
    if (discIdx !== -1) player.deck.discardPile.splice(discIdx, 1);
    // Restore the pre-cost exhausted state
    card.exhausted = !!card._preRechargeExhausted;
    delete card._preRechargeExhausted;
    player.deck.hand.push(card);
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
      const rcIdx = player.deck.rechargePile.indexOf(card);
      if (rcIdx !== -1) player.deck.rechargePile.splice(rcIdx, 1);
      const discIdx = player.deck.discardPile.indexOf(card);
      if (discIdx !== -1) player.deck.discardPile.splice(discIdx, 1);
      card.exhausted = !!card._preRechargeExhausted;
      delete card._preRechargeExhausted;
      player.deck.hand.push(card);
    }
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
  // We refund the recharged cards back to hand and reset exhausted state.
  if (selectedPower) {
    selectedPower.exhausted = false;
    for (const card of powerRechargeCardsSelected) {
      const rcIdx = player.deck.rechargePile.indexOf(card);
      if (rcIdx !== -1) player.deck.rechargePile.splice(rcIdx, 1);
      const discIdx = player.deck.discardPile.indexOf(card);
      if (discIdx !== -1) player.deck.discardPile.splice(discIdx, 1);
      card.exhausted = !!card._preRechargeExhausted;
      delete card._preRechargeExhausted;
      player.deck.hand.push(card);
    }
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

  {
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
    if (dmg > 0) enemyAutoPlayDefenses(dmg);
    const [blocked, taken] = enemy.takeDamageWithDefense(dmg);
    const blockedSuffix = blocked > 0 ? ` (blocked ${blocked})` : '';
    addLog(`  ${enemy.name}: ${taken} dmg${blockedSuffix}`, Colors.RED);
    if (taken > 0) { spawnDamageOnTarget(enemy, taken); triggerSplitPower(enemy); }
    maybeApplyAttackPoison(ally, enemy, taken);
  } else {
    const actual = target.takeDamage(dmg);
    if (actual > 0) spawnDamageOnTarget(target, actual);
    const blocked = Math.max(0, dmg - actual);
    const blockedSuffix = blocked > 0 ? ` (blocked ${blocked})` : '';
    addLog(`  ${target.name}: ${actual} dmg${blockedSuffix}`, Colors.RED);
    maybeApplyAttackPoison(ally, target, actual);
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
  } else {
    showStickyToast(`${selectedPower.name}: Click target (${powerMaxTargets - powerTargets.length} left, click elsewhere to finish)`);
  }
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
      recharged.push(c.name);
    }
    power.use();
    addLog(`${enemy.name} uses ${power.name}`, Colors.RED, power);
    if (recharged.length > 0) addLog(`  Recharge: ${recharged.join(', ')}`);
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
            ? new Creature({ name: 'Kobold Guard', attack: 2, maxHp: 1 })
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
    addLog(`  Grit: Healed ${gritHeal}!`, Colors.GREEN);
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
  const cardW = 280;
  const cardH = 200;
  const gap = 40;
  const totalW = count * cardW + (count - 1) * gap;
  const startX = (SCREEN_WIDTH - totalW) / 2;
  const y = SCREEN_HEIGHT / 2 - cardH / 2;
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
      // Open rest mode inventory to rebalance deck
      restMode = true;
      state = GameState.INVENTORY;
      return;
    }
  }
}

function drawPerkSelect() {
  ctx.fillStyle = '#1a0a2e';
  ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

  ctx.fillStyle = Colors.GOLD;
  ctx.font = 'bold 36px serif';
  ctx.textAlign = 'center';
  ctx.fillText('Choose a Perk', SCREEN_WIDTH / 2, 100);

  ctx.fillStyle = Colors.WHITE;
  ctx.font = '18px sans-serif';
  ctx.fillText(`Level ${player.level} — Pick one perk to keep permanently`, SCREEN_WIDTH / 2, 140);

  const rects = getPerkRects();
  for (let i = 0; i < perkChoices.length; i++) {
    const perk = perkChoices[i];
    const r = rects[i];
    const hov = hitTest(mouseX, mouseY, r);

    ctx.fillStyle = hov ? '#4a3a6e' : '#2a1a4e';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = hov ? Colors.GOLD : '#888';
    ctx.lineWidth = hov ? 3 : 2;
    ctx.strokeRect(r.x, r.y, r.w, r.h);

    // Perk name
    ctx.fillStyle = Colors.GOLD;
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(perk.name, r.x + r.w / 2, r.y + 40);

    // Description
    ctx.fillStyle = Colors.WHITE;
    ctx.font = '16px sans-serif';
    const descLines = wrapTextLong(perk.description, r.w - 30, 16);
    let descY = r.y + 75;
    for (const line of descLines) {
      ctx.fillText(line, r.x + r.w / 2, descY);
      descY += 22;
    }

    // Stack count
    const stacks = player.perks.filter(p => p.id === perk.id).length;
    if (stacks > 0) {
      ctx.fillStyle = Colors.GRAY;
      ctx.font = '13px sans-serif';
      ctx.fillText(`(Already have ${stacks} stack${stacks > 1 ? 's' : ''})`, r.x + r.w / 2, r.y + r.h - 20);
    }

    if (hov) {
      ctx.fillStyle = Colors.GOLD;
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('Click to select', r.x + r.w / 2, r.y + r.h - 5);
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
  if (type === 'ABILITY' || sub === 'ability') return 'Abilities';
  if (sub.includes('armor') || sub === 'shield' || sub === 'clothing') return 'Armor';
  if (sub === 'item' || sub === 'potion' || sub === 'food' || sub === 'scroll') return 'Items';
  if (sub.includes('martial') || sub === 'weapon' || sub === 'simple' || sub.includes('2h') || sub === 'staff' || sub === 'wand' || sub === 'ranged') return 'Weapons';
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

function exitInventory() {
  if (restMode) {
    // Rebalance: merge everything back, heal all damage, shuffle, draw fresh hand
    player.deck.rebalance(getPlayerHandSize(), MAX_HAND_SIZE);
    restMode = false;
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

  // Equip/unequip only allowed in rest mode
  if (!restMode) return;

  // Click backpack cards to equip (move one from the stack to deck)
  const bpRects = getBackpackCardRects();
  for (const r of bpRects) {
    if (r.y + r.h < sections.backpack.y || r.y > sections.backpack.y + sections.backpack.h - 60) continue;
    if (hitTest(x, y, r)) {
      const idx = r.group.indices[0]; // take first card from the stack
      const card = backpack.splice(idx, 1)[0];
      player.deck.addCard(card);
      addLog(`Equipped: ${card.name}`, Colors.GREEN);
      return;
    }
  }

  // Click deck cards to unequip (move one from the stack to backpack)
  const deckRects = getDeckCardRects();
  for (const r of deckRects) {
    if (r.y + r.h < sections.deck.y || r.y > sections.deck.y + sections.deck.h - 60) continue;
    if (hitTest(x, y, r)) {
      if (player.deck.masterDeck.length > 5) {
        const idx = r.group.indices[0];
        const card = player.deck.masterDeck.splice(idx, 1)[0];
        backpack.push(card);
        addLog(`Unequipped: ${card.name}`, Colors.GRAY);
      }
      return;
    }
  }
}

function drawFilterTabs(section, filters, showEquipFilter = false) {
  const tabY = section.y + 30;
  const tabH = 18;
  ctx.font = '10px sans-serif';
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
  const tabH = 18;
  ctx.font = '10px sans-serif';
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

  // Track hovered card for the full-card cursor preview
  hoveredCardPreview = null;
  hoveredPowerPreview = null;

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
    drawStyledButton(doneBtnX, doneBtnY, doneBtnW, doneBtnH, 'Done', exitInventory, 'large', 22);
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

  if (hasArt) {
    const imgAspect = portrait.width / portrait.height;
    const cardAspect = cardW / cardH;
    let sx = 0, sy = 0, sw = portrait.width, sh = portrait.height;
    if (imgAspect > cardAspect) { sw = portrait.height * cardAspect; sx = (portrait.width - sw) / 2; }
    else { sh = portrait.width / cardAspect; sy = (portrait.height - sh) / 2; }
    ctx.drawImage(portrait, sx, sy, sw, sh, cardX, cardY, cardW, cardH);
  } else {
    ctx.fillStyle = '#1a3a4e';
    ctx.fillRect(cardX, cardY, cardW, cardH);
  }

  // White border
  ctx.strokeStyle = Colors.WHITE;
  ctx.lineWidth = 3;
  ctx.strokeRect(cardX, cardY, cardW, cardH);

  // Dark overlay for readability
  if (hasArt) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.47)';
    ctx.fillRect(cardX + 3, cardY + 3, cardW - 6, cardH - 6);
  }

  // Character name + level at top
  ctx.fillStyle = Colors.WHITE;
  ctx.font = 'bold 16px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${selectedClass} (${player.level || 1})`, cardX + cardW / 2, cardY + 22);

  // Card counts
  const infoTop = cardY + 44;
  const totalCards = player.deck.masterDeck.length;
  const handCount = player.deck.hand.length;
  const dmgCount = player.deck.discardPile.length;
  const deckCount = totalCards - handCount - dmgCount;

  ctx.font = '13px sans-serif';
  ctx.fillStyle = Colors.WHITE;
  ctx.fillText(`Hand: ${handCount}`, cardX + cardW / 2, infoTop);
  ctx.fillText(`Deck: ${deckCount}`, cardX + cardW / 2, infoTop + 18);
  ctx.fillStyle = dmgCount > 0 ? '#e88' : '#aaa';
  ctx.fillText(`Discard: ${dmgCount}`, cardX + cardW / 2, infoTop + 36);

  // HP bar at bottom of card
  const hp = totalCards - dmgCount;
  const maxHp = totalCards;
  const barX = cardX + 8, barW = cardW - 16, barH = 18;
  const barY = cardY + cardH - barH - 8;
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

  // Perks section (below the character card)
  let nextY = cardY + cardH + 12;
  if (player.perks && player.perks.length > 0) {
    ctx.fillStyle = Colors.GOLD;
    ctx.font = 'bold 13px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('Perks', cardX + cardW / 2, nextY);
    nextY += 16;
    ctx.fillStyle = '#ddd';
    ctx.font = '12px sans-serif';
    for (const perk of player.perks.slice(0, 5)) {
      ctx.fillText(`• ${perk.name}`, cardX + cardW / 2, nextY);
      nextY += 15;
    }
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
// Slot row dimensions (tighter for fitting more)
const SL_SLOT_H = 52;
const SL_SLOT_GAP = 6;
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

function handleSaveClick(x, y) {
  const rects = getSaveSlotRects();
  for (const r of rects) {
    if (hitTest(x, y, r)) {
      const success = saveToSlot({
        selectedClass, gold, player, currentMap, visitedNodes, backpack,
      }, r.slot);
      if (success) addLog(`Game saved to slot ${r.displayNum}!`, Colors.GREEN);
      state = saveLoadReturnState || GameState.MAP;
      return;
    }
  }
  // Cancel button
  const cancelBtn = getLoadActionBtnRects().cancel;
  if (hitTest(x, y, cancelBtn)) {
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

function drawSlotEntry(rect, info, displayNum, isAuto, selected, canClick) {
  const hov = hitTest(mouseX, mouseY, rect);
  // Background
  if (selected) {
    ctx.fillStyle = 'rgba(60, 50, 20, 0.9)';
  } else {
    ctx.fillStyle = canClick ? 'rgba(40, 40, 50, 0.85)' : 'rgba(30, 30, 35, 0.6)';
  }
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.strokeStyle = selected ? Colors.GOLD : (hov && canClick ? '#bb9' : '#555');
  ctx.lineWidth = selected ? 2 : 1;
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const midY = rect.y + rect.h / 2;
  if (info) {
    const badge = isAuto ? '[Auto] ' : '';
    // All on one line: "[Auto] Slot 1 — Paladin Lv1 • 12 cards • 0 gold              date"
    ctx.fillStyle = Colors.WHITE;
    ctx.font = 'bold 18px Georgia, serif';
    const slotLabel = `${badge}Slot ${displayNum}`;
    ctx.fillText(slotLabel, rect.x + 14, midY);
    const slotW = ctx.measureText(slotLabel).width;
    ctx.fillStyle = '#bbb';
    ctx.font = '15px sans-serif';
    ctx.fillText(`— ${info.class} Lv${info.level} • ${info.deckSize} cards • ${info.gold} gold`, rect.x + 14 + slotW + 4, midY);
    // Date on the right
    ctx.fillStyle = '#888';
    ctx.font = '13px sans-serif';
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
    ctx.fillText('Choose a slot to save', SCREEN_WIDTH / 2, SL_BOX_Y + 92);

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
      drawSlotEntry(r, r.info, r.displayNum, false, false, true);
    }
    ctx.restore();

    // Scrollbar
    drawSaveLoadScrollbar(listBounds, MANUAL_SLOT_COUNT);

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

  // Restore level and perks
  player.level = data.level || 1;
  const perkCreators = {
    tough: createToughPerk, prepared: createPreparedPerk, grit: createGritPerk,
    arsenal: createArsenalPerk, talented: createTalentedPerk, first_strike: createFirstStrikePerk,
  };
  for (const perkId of (data.perks || [])) {
    const fn = perkCreators[perkId];
    if (fn) player.perks.push(fn());
  }

  // Restore backpack
  backpack = [];
  for (const cardId of (data.backpack || [])) {
    const creator = CARD_REGISTRY[cardId];
    if (creator) backpack.push(creator());
  }

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

  // Restore node states
  for (const [id, nodeState] of Object.entries(data.nodeStates || {})) {
    const node = currentMap.getNode(id);
    if (node) {
      node.isDone = nodeState.isDone;
      node.isLocked = nodeState.isLocked;
      if (typeof nodeState.canRevisit === 'boolean') node.canRevisit = nodeState.canRevisit;
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

  // Clear per-frame button list
  menuButtons.length = 0;
  cardBadgeHitAreas.length = 0;
  iconHitAreas.length = 0;

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
    case GameState.INGAME_MENU:
      drawIngameMenu();
      break;
    case GameState.TITLE_CARD:
      drawTitleCard();
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
    { text: 'Summoned creatures attack at the end of your turn.' },
    { text: 'Allies ready at the start of your turn.' },
    { text: 'Companions (like Thorb) persist between combats.' },
    { text: 'Losing a summon does not cost you HP.' },
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
// IN-GAME MENU
// ============================================================

function getIngameMenuBtnRects() {
  const btnW = 280, btnH = 56, gap = 16;
  const items = [
    { label: 'Resume', action: 'resume' },
    { label: 'Save Game', action: 'save', enabled: previousState === GameState.MAP },
    { label: 'Load Game', action: 'load' },
    { label: 'Main Menu', action: 'quit' },
  ];
  const totalH = items.length * (btnH + gap) - gap;
  const startX = (SCREEN_WIDTH - btnW) / 2;
  const startY = (SCREEN_HEIGHT - totalH) / 2 + 30;
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
  const boxW = 440, boxH = 420;
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
  const fogScale = areaNodeCount <= 5 ? 1.4 : 1.0;

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

// === Init ===
loadAssets().then(() => {
  requestAnimationFrame(gameLoop);
});
