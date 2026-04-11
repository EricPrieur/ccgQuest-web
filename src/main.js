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
  createSlimeAppendage,
  createGuards, createMotivationalWhip, createHideInCorner,
  createDireRatBite, createDireRatScreech,
  createSharpRock, createBoneWand, createBoneClub, createTorch,
  createChickenLeg, createWardensWhip,
  createWoodenSword, createLeatherArmor, createScraps,
  createWoodenAxe, createWoodenGreatsword, createRockMace,
  createCrackedBuckler, createShortBow, createShortStaff,
  createSmallPouch, createBoneDagger, createClothArmor,
  createHeroicStrike, createHolyLight, createShieldOfFaith, createFlashHeal,
  createFireBurst, createIceBolt, createMagicMissiles, createArcaneShield,
  createVialOfPoison, createSneakAttack, createPetSpider, createCarefulStrike,
  createGreaterCleave, createRecklessStrike, createShieldBash,
  createMultiShot, createGoodberries, createTamedRat,
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
import { getCardArt, getPowerArt } from './card-art.js';
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
let enemyActionTimer = 0;
let enemyActions = [];
let enemyActionIndex = 0;
let abilityChoices = [];

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
let hoveredPowerPreview = null; // a Power to render large

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
  greater_cleave: createGreaterCleave, reckless_strike: createRecklessStrike,
  shield_bash: createShieldBash, multi_shot: createMultiShot,
  goodberries: createGoodberries, tamed_rat: createTamedRat,
  wrath: createWrath, regrowth: createRegrowth, feral_swipe: createFeralSwipe,
  // Loot / Story
  sharp_rock: createSharpRock, bone_wand: createBoneWand,
  bone_club: createBoneClub, torch: createTorch,
  chicken_leg: createChickenLeg, wardens_whip: createWardensWhip,
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

// Hand sizes per class
const CLASS_HAND_SIZE = {
  Paladin: 4, Ranger: 4, Wizard: 5, Rogue: 4, Warrior: 4, Druid: 4,
};
const MAX_HAND_SIZE = 10;

// === Asset Loading ===
const images = {};
let assetsLoaded = false;

function loadImage(id, src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => { images[id] = img; resolve(img); };
    img.onerror = () => resolve(null); // don't block on missing images
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
  ]);
  assetsLoaded = true;
}

// === Input Handling ===
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = SCREEN_WIDTH / rect.width;
  const scaleY = SCREEN_HEIGHT / rect.height;
  mouseX = (e.clientX - rect.left) * scaleX;
  mouseY = (e.clientY - rect.top) * scaleY;
});

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = SCREEN_WIDTH / rect.width;
  const scaleY = SCREEN_HEIGHT / rect.height;
  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top) * scaleY;
  handleClick(x, y);
});

document.addEventListener('keydown', (e) => {
  handleKeyDown(e.key, e);
});

canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const scrollAmount = e.deltaY > 0 ? 40 : -40;
  if (state === GameState.SHOP) shopScrollY = Math.max(0, shopScrollY + scrollAmount);
  if (state === GameState.INVENTORY) inventoryScrollY = Math.max(0, inventoryScrollY + scrollAmount);
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
  if (combatLog.length > 100) combatLog.shift();
  // Auto-spawn damage numbers for damage messages in combat
  if ((state === GameState.COMBAT || state === GameState.TARGETING) && text.includes('dmg to') || text.includes('damage to')) {
    const match = text.match(/(\d+)\s+(?:dmg|damage|true dmg)/);
    if (match) {
      const isToPlayer = text.includes('to you');
      const x = isToPlayer ? 120 : SCREEN_WIDTH / 2;
      const y = isToPlayer ? SCREEN_HEIGHT - 160 : 80;
      spawnDamageNumber(x, y, `-${match[1]}`, color);
    }
  }
}

// Yellow on-screen temporary message
let toastMessage = '';
let toastTimer = 0;
let toastSticky = false;
function showToast(text, durationMs = 2500) {
  toastMessage = text;
  toastTimer = durationMs;
  toastSticky = false;
}
function showStickyToast(text) {
  toastMessage = text;
  toastTimer = 1; // any positive value so drawToast renders
  toastSticky = true;
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
    case GameState.MODAL_SELECT:
      handleModalSelectClick(x, y);
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
      modalCard = null;
      modalTarget = null;
      state = GameState.COMBAT;
    } else if (state === GameState.TARGETING) {
      // Refund any cards spent on recharge_extra cost
      if (cardRechargedCards.length > 0) {
        cancelCardRecharge();
      }
      selectedCardIndex = -1;
      hideToast();
      state = GameState.COMBAT;
    } else if (state === GameState.POWER_TARGETING) {
      cancelPowerTargeting();
    } else if (state === GameState.POWER_CHOICE) {
      cancelPowerChoice();
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

  // Semi-transparent panel behind title for clarity
  const titlePanelW = 600;
  const titlePanelH = 100;
  const titlePanelX = (SCREEN_WIDTH - titlePanelW) / 2;
  const titlePanelY = 40;
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.fillRect(titlePanelX, titlePanelY, titlePanelW, titlePanelH);
  ctx.strokeStyle = Colors.GOLD;
  ctx.lineWidth = 2;
  ctx.strokeRect(titlePanelX, titlePanelY, titlePanelW, titlePanelH);

  // Title with shadow
  ctx.shadowColor = 'rgba(0,0,0,0.9)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = Colors.GOLD;
  ctx.font = 'bold 44px serif';
  ctx.textAlign = 'center';
  ctx.fillText('Choose Your Class', SCREEN_WIDTH / 2, titlePanelY + 60);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  const classArtIds = {
    Paladin: 'paladin_class', Ranger: 'ranger_class', Wizard: 'wizard_class',
    Rogue: 'rogue_class', Warrior: 'warrior_class', Druid: 'druid_class',
  };

  for (const r of getClassRects()) {
    const hovered = hitTest(mouseX, mouseY, r);
    const art = getCardArt(classArtIds[r.name]);

    if (art) {
      const imgAspect = art.width / art.height;
      const cardAspect = r.w / r.h;
      let sx = 0, sy = 0, sw = art.width, sh = art.height;
      if (imgAspect > cardAspect) { sw = art.height * cardAspect; sx = (art.width - sw) / 2; }
      else { sh = art.width / cardAspect; sy = (art.height - sh) / 2; }
      ctx.globalAlpha = hovered ? 1 : 0.85;
      ctx.drawImage(art, sx, sy, sw, sh, r.x, r.y, r.w, r.h);
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = hovered ? r.color : '#2a1a4e';
      ctx.globalAlpha = hovered ? 0.9 : 0.75;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.globalAlpha = 1;
    }

    ctx.strokeStyle = hovered ? Colors.GOLD : '#888';
    ctx.lineWidth = hovered ? 4 : 2;
    ctx.strokeRect(r.x, r.y, r.w, r.h);

    // Name bar at bottom — taller, more opaque
    const nameBarH = 70;
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(r.x, r.y + r.h - nameBarH, r.w, nameBarH);
    // Top edge highlight
    ctx.strokeStyle = hovered ? Colors.GOLD : '#666';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(r.x, r.y + r.h - nameBarH);
    ctx.lineTo(r.x + r.w, r.y + r.h - nameBarH);
    ctx.stroke();

    // Class name with shadow
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 4;
    ctx.fillStyle = hovered ? Colors.GOLD : Colors.WHITE;
    ctx.font = 'bold 24px serif';
    ctx.textAlign = 'center';
    ctx.fillText(r.name, r.x + r.w / 2, r.y + r.h - 40);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Description — brighter, larger
    ctx.fillStyle = '#e0e0e0';
    ctx.font = '14px sans-serif';
    ctx.fillText(r.desc, r.x + r.w / 2, r.y + r.h - 15);
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
  // Back button (matches character select style)
  const backBtn = { x: 40, y: SCREEN_HEIGHT - 100, w: 200, h: 70 };
  if (hitTest(x, y, backBtn)) {
    state = GameState.CHARACTER_SELECT;
    return;
  }

  const rects = getAbilityCardRects();
  for (let i = 0; i < rects.length; i++) {
    if (hitTest(x, y, rects[i])) {
      if (player) {
        // Level-up ability selection (mid-game)
        const ability = abilityChoices[i];
        player.deck.addCard(ability);
        player.level++;
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
  ctx.fillText('Choose Your Starting Ability', SCREEN_WIDTH / 2, 80);

  ctx.fillStyle = '#e0e0e0';
  ctx.font = '20px sans-serif';
  ctx.fillText(`${selectedClass} — Pick one ability card to add to your deck`, SCREEN_WIDTH / 2, 120);

  const rects = getAbilityCardRects();
  for (let i = 0; i < abilityChoices.length; i++) {
    const card = abilityChoices[i];
    const r = rects[i];
    const hovered = hitTest(mouseX, mouseY, r);
    drawCard(card, r.x, r.y, r.w, r.h, hovered, hovered, 'full');

    if (hovered) {
      ctx.fillStyle = Colors.GOLD;
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Click to select', r.x + r.w / 2, r.y + r.h + 18);
    }
  }

  // Back button (matches character select style)
  drawStyledButton(40, SCREEN_HEIGHT - 100, 200, 70, '< Back', () => { state = GameState.CHARACTER_SELECT; }, 'large', 22);

  ctx.textAlign = 'left';
}

// ============================================================
// MAP
// ============================================================

function getMapNodeRects() {
  if (!currentMap) return [];
  const currentArea = currentMap.getCurrentNode()?.mapArea || '';
  const rects = [];
  for (const [id, node] of Object.entries(currentMap.nodes)) {
    if (node.mapArea !== currentArea) continue;
    const [nx, ny] = node.position;
    rects.push({ x: nx - 18, y: ny - 18, w: 36, h: 36, nodeId: id, node });
  }
  return rects;
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
    // Auto-save
    saveToAutoSlot({ selectedClass, gold, player, currentMap, visitedNodes, backpack });
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
        const creator = CARD_REGISTRY[cardId];
        if (creator) {
          const card = creator();
          player.deck.addCard(card);
          phase._lootedCards.push(card);
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

  if (mapImg) {
    ctx.drawImage(mapImg, 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  } else {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  }

  // Draw connections
  ctx.strokeStyle = 'rgba(200,200,200,0.3)';
  ctx.lineWidth = 2;
  for (const [id, node] of Object.entries(currentMap.nodes)) {
    if (node.mapArea !== currentArea) continue;
    for (const connId of node.connections) {
      const conn = currentMap.getNode(connId);
      if (!conn || conn.mapArea !== currentArea) continue;
      ctx.beginPath();
      ctx.moveTo(node.position[0], node.position[1]);
      ctx.lineTo(conn.position[0], conn.position[1]);
      ctx.stroke();
    }
  }

  // Draw nodes
  const accessible = currentMap.getAccessibleNodes().map(n => n.id);
  for (const [id, node] of Object.entries(currentMap.nodes)) {
    if (node.mapArea !== currentArea) continue;
    const [nx, ny] = node.position;
    const isCurrent = id === currentMap.currentNodeId;
    const isAccessible = accessible.includes(id);
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

  // Fog of war overlay for dark areas
  drawFogOfWar(currentArea);

  // Current node description panel
  if (currentNode) {
    const panelY = SCREEN_HEIGHT - 120;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
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
        if (val > 0) player.takeDamageFromDeck(val);
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
        // Heal val HP (move cards from damage pile back)
        healPlayer(val);
        break;

      case 'search_camp':
        // Give a random small reward
        gold += Math.floor(Math.random() * 6) + 1;
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
        player.deck.addCard(leg);
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

      case 'try_squeeze':
        // Recharge a random card (take 1 damage)
        player.takeDamageFromDeck(1);
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
        // No effect or unknown effect
        break;
    }

    currentEncounter.advancePhase();
    advanceEncounterPhase();
    return;
  }

  const rects = getChoiceRects();
  for (const r of rects) {
    if (hitTest(x, y, r)) {
      encounterChoiceResult = r.choice;
      return;
    }
  }
}

function drawEncounterChoice() {
  drawEncounterBg();

  ctx.fillStyle = Colors.GOLD;
  ctx.font = 'bold 28px serif';
  ctx.textAlign = 'center';
  ctx.fillText(currentEncounter.name, SCREEN_WIDTH / 2, 60);

  if (encounterChoiceResult) {
    // Show result
    const boxX = 100, boxY = 200, boxW = SCREEN_WIDTH - 200, boxH = 300;
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = Colors.GOLD;
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    ctx.fillStyle = Colors.WHITE;
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    const lines = wrapTextLong(encounterChoiceResult.resultText, boxW - 40, 16);
    let textY = boxY + 40;
    for (const line of lines) {
      ctx.fillText(line, boxX + 20, textY);
      textY += 22;
    }

    if (encounterChoiceResult.effectType === 'damage' && encounterChoiceResult.effectValue > 0) {
      ctx.fillStyle = Colors.RED;
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`You take ${encounterChoiceResult.effectValue} damage!`, SCREEN_WIDTH / 2, textY + 20);
    }

    ctx.fillStyle = Colors.GRAY;
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Click to continue', SCREEN_WIDTH / 2, boxY + boxH - 20);
  } else {
    // Show choices
    ctx.fillStyle = Colors.WHITE;
    ctx.font = '22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('What do you do?', SCREEN_WIDTH / 2, 140);

    const rects = getChoiceRects();
    for (const r of rects) {
      const hovered = hitTest(mouseX, mouseY, r);
      ctx.fillStyle = hovered ? '#4a3a6e' : '#2a1a4e';
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = hovered ? Colors.GOLD : Colors.GRAY;
      ctx.lineWidth = 2;
      ctx.strokeRect(r.x, r.y, r.w, r.h);
      ctx.fillStyle = hovered ? Colors.GOLD : Colors.WHITE;
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(r.choice.text, r.x + r.w / 2, r.y + r.h / 2);
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
  ctx.font = 'bold 48px serif';
  ctx.textAlign = 'center';
  ctx.fillText('Loot!', SCREEN_WIDTH / 2, 150);

  const phase = currentEncounter.currentPhase;
  let y = 230;

  if (phase._lootGoldAmount > 0) {
    ctx.fillStyle = Colors.GOLD;
    ctx.font = '24px sans-serif';
    ctx.fillText(`+${phase._lootGoldAmount} Gold  (Total: ${gold})`, SCREEN_WIDTH / 2, y);
    y += 50;
  }

  // Draw looted cards with art
  const lootedCards = phase._lootedCards || [];
  if (lootedCards.length > 0) {
    ctx.fillStyle = Colors.WHITE;
    ctx.font = '20px sans-serif';
    ctx.fillText('Cards added to your deck:', SCREEN_WIDTH / 2, y);
    y += 20;
    const cardW = 120;
    const cardH = 170;
    const gap = 20;
    const totalW = lootedCards.length * (cardW + gap) - gap;
    const startX = (SCREEN_WIDTH - totalW) / 2;
    for (let i = 0; i < lootedCards.length; i++) {
      const card = lootedCards[i];
      drawCard(card, startX + i * (cardW + gap), y, cardW, cardH, true, false);
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
  isPlayerTurn = true;
  selectedCardIndex = -1;
  enemyActions = [];
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
  }
  // Heroism perk
  const heroismStacks = player.getPerkStacks('combat_start_heroism');
  if (heroismStacks > 0) {
    player.heroism += heroismStacks;
    addLog(`  Prepared: +${heroismStacks} Heroism!`, Colors.GOLD);
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
// Players use 1 row of 6 placed above the player hand (in the empty space at the top of the player area).
function getCreatureSlotRect(ownerIsPlayer, slot) {
  const charRect = getCharacterCardRect(ownerIsPlayer);
  const startX = charRect.x + charRect.w + 16;
  const startY = ownerIsPlayer
    ? COMBAT_PLAYER_AREA.y + 8 // top of the player area, above the hand and the char card
    : charRect.y;              // top of the enemy character card
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
  poison: { iconKey: 'icon_poison', label: 'Poison', desc: 'Deals 1 unpreventable damage per turn' },
  shock: { iconKey: 'icon_shock', label: 'Shock', desc: '-1 dmg dealt and +1 dmg taken per stack' },
  rage: { iconKey: 'icon_rage', label: 'Rage', desc: 'Permanent bonus damage to all attacks' },
};

// Tokenize text into words and inline icons
// Returns array of { type: 'text'|'icon', text?, keyword?, iconKey? }
function tokenizeKeywordText(text) {
  // Split into words while preserving delimiters
  const tokens = [];
  // Match keywords (case-insensitive whole word) - longest first to avoid partial matches
  const keywords = ['Heroism', 'Shields', 'Shield', 'Armor', 'Fire', 'Ice', 'Poison', 'Shock', 'Rage'];
  const pattern = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g');
  let lastIdx = 0;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIdx) {
      tokens.push({ type: 'text', text: text.slice(lastIdx, match.index) });
    }
    const kw = match[1].toLowerCase();
    const info = KEYWORD_ICONS[kw];
    if (info) {
      tokens.push({ type: 'icon', keyword: kw, iconKey: info.iconKey });
    } else {
      tokens.push({ type: 'text', text: match[1] });
    }
    lastIdx = match.index + match[1].length;
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
    if (tok.type === 'icon') {
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
    if (tok.type === 'icon') {
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
function getCardBorderColor(card) {
  if (card.subtype && SUBTYPE_COLORS[card.subtype]) return SUBTYPE_COLORS[card.subtype];
  return CARD_COLORS[card.cardType] || '#666';
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

  // 2. Tight name box at top — auto-sized to wrap around the text (no colored border)
  const nameFont = 'bold ' + Math.max(8, Math.floor(w * 0.085)) + 'px sans-serif';
  ctx.font = nameFont;
  const nameMetrics = ctx.measureText(card.name);
  const nameW = Math.min(w - 4, nameMetrics.width + 12);
  const nameH = Math.max(14, Math.floor(w * 0.13));
  const nameX = x + (w - nameW) / 2;
  const nameY = y + 8;
  ctx.fillStyle = 'rgba(0,0,0,0.8)';
  ctx.fillRect(nameX, nameY, nameW, nameH);
  ctx.fillStyle = Colors.GOLD;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(card.name, x + w / 2, nameY + nameH / 2 + 1);
  ctx.textBaseline = 'alphabetic';

  // 3. Description box at bottom
  if (isFullSize) {
    // Full size: fixed 1/4 card height box with full description, inset from edges
    const inset = 6;
    const descBoxH = Math.floor(h / 4);
    const descBoxX = x + inset;
    const descBoxY = y + h - descBoxH - inset;
    const descBoxW = w - inset * 2;

    ctx.fillStyle = 'rgba(0,0,0,0.78)';
    ctx.fillRect(descBoxX, descBoxY, descBoxW, descBoxH);
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(descBoxX, descBoxY, descBoxW, descBoxH);

    const descFontSize = Math.max(11, Math.floor(w * 0.058));
    const descText = card.description || card.shortDesc || '';
    // Center vertically by computing height first
    const lines = countWrappedLines(descText, descBoxW - 16, descFontSize);
    const iconSize = Math.floor(descFontSize * 1.3);
    const lineH = Math.max(descFontSize + 4, iconSize + 2);
    const totalH = lines * lineH;
    const startY = descBoxY + (descBoxH - totalH) / 2;
    drawIconText(descText, x + w / 2, startY, descBoxW - 16, descFontSize, '#f0f0f0');
  } else if (card.shortDesc || card.description) {
    // Small size: tight auto-sized box with short desc
    const descText = card.shortDesc || card.description;
    const descFontSize = Math.max(8, Math.floor(w * 0.085));
    const lines = countWrappedLines(descText, w - 12, descFontSize);
    const linesToShow = Math.min(2, lines);
    const iconSize = Math.floor(descFontSize * 1.3);
    const lineH = Math.max(descFontSize + 2, iconSize + 1);
    const descBoxH = linesToShow * lineH + 4;
    const descBoxY = y + h - descBoxH - 2;
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(x + 2, descBoxY, w - 4, descBoxH);
    drawIconText(descText, x + w / 2, descBoxY + 2, w - 12, descFontSize, '#eee');
  }

  // 3b. Tier and rarity badge (bottom-right, full size only)
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
    const badgeY = y + h - badgeH - 6;

    // Background
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(badgeX, badgeY, totalW, badgeH);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.strokeRect(badgeX, badgeY, totalW, badgeH);

    // Rarity letter (left half)
    const codeBoxW = codeW + padX * 2;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(code, badgeX + codeBoxW / 2, badgeY + badgeH / 2 + 1);

    // Separator line
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(badgeX + codeBoxW + sepW / 2, badgeY + 2);
    ctx.lineTo(badgeX + codeBoxW + sepW / 2, badgeY + badgeH - 2);
    ctx.stroke();

    // Tier label (right half)
    const tierBoxX = badgeX + codeBoxW + sepW;
    const tierBoxW = tierW + padX * 2;
    ctx.fillStyle = '#e0e0e0';
    ctx.fillText(tierText, tierBoxX + tierBoxW / 2, badgeY + badgeH / 2 + 1);
    ctx.textBaseline = 'alphabetic';

    // Register hover hit areas for tooltips
    cardBadgeHitAreas.push({
      x: badgeX, y: badgeY, w: codeBoxW, h: badgeH,
      label: RARITY_LABELS[rarity] || 'Common',
    });
    cardBadgeHitAreas.push({
      x: tierBoxX, y: badgeY, w: tierBoxW, h: badgeH,
      label: `Tier ${tier}`,
    });
  }

  // 4. Border — uses subtype color (or gold when highlighted)
  ctx.strokeStyle = highlighted ? Colors.GOLD : (hovered ? '#fff' : borderColor);
  ctx.lineWidth = highlighted ? 4 : (hovered ? 3 : 2);
  ctx.strokeRect(x, y, w, h);

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
  const d = character.deck;
  return d.drawPile.length + d.hand.length + d.rechargePile.length;
}

function getMaxHP(character) {
  return character.deck.masterDeck.length;
}

function getDamage(character) {
  return character.deck.damagePile.length;
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
  drawCharacterPanel(enemy, 'enemy');

  // Enemy creatures (grid up to 2 rows of 6 to the right of the enemy character card)
  const creatureRects = getEnemyCreatureRects();
  for (let i = 0; i < enemy.creatures.length; i++) {
    const c = enemy.creatures[i];
    const r = creatureRects[i];
    drawCreatureCard(c, r, false);
  }

  // --- Player area (bottom) ---
  drawCharacterPanel(player, 'player');

  // --- Player hand ---
  hoveredCardPreview = null;
  hoveredPowerPreview = null;

  // (Log/panel hover detection runs at the end of drawCombat after everything is populated.)
  const handRects = getHandCardRects(player.deck.hand);
  // Determine which card is hovered first (use visible-portion hit areas, topmost first)
  // Topmost card visually is the LAST one (drawn last so rendered on top).
  let hoveredHandIndex = -1;
  for (let i = player.deck.hand.length - 1; i >= 0; i--) {
    const hr = getHandCardHoverRect(handRects, i);
    if (hitTest(mouseX, mouseY, hr)) { hoveredHandIndex = i; break; }
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
    hoveredCardPreview = card;
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
    // Draw red targeting arrow from selected card center to cursor
    if (selectedCardIndex >= 0 && selectedCardIndex < player.deck.hand.length) {
      const handRects = getHandCardRects(player.deck.hand);
      const r = handRects[selectedCardIndex];
      const startX = r.x + r.w / 2;
      const startY = r.y + r.h / 2 - 20; // -20 because selected card lifts up
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
  }

  // --- Right column buttons (End Turn, Inventory, Help) ---
  drawCombatButtons();

  // --- Combat log ---
  drawCombatLog();

  // --- Log/panel hover detection (must run after both panels and log have populated) ---
  // Hovering a log entry, a discard pile label, or any panel hit area shows the full card preview.
  // Only override the hand-card hover (set above) if the user is actually pointing at a panel/log area.
  for (const area of logCardHitAreas) {
    if (hitTest(mouseX, mouseY, area)) {
      if (area.card instanceof Power) {
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

// Draw a full-size preview card following the cursor (top-right of cursor by default)
function drawHoverPreview() {
  if (!hoveredCardPreview && !hoveredPowerPreview) return;

  // Preview card size (~py 312x438, scaled smaller for our screen)
  const previewW = 240;
  const previewH = 336;
  const margin = 12;

  // Default position: above and right of cursor
  let x = mouseX + 24;
  let y = mouseY - previewH - 16;

  // Flip to left if too close to right edge
  if (x + previewW + margin > SCREEN_WIDTH) {
    x = mouseX - previewW - 24;
  }
  // Flip below if too close to top
  if (y < margin) {
    y = mouseY + 24;
  }
  // Clamp to screen bounds
  x = Math.max(margin, Math.min(x, SCREEN_WIDTH - previewW - margin));
  y = Math.max(margin, Math.min(y, SCREEN_HEIGHT - previewH - margin));

  if (hoveredCardPreview) {
    // Draw a full-size version of the card
    drawCard(hoveredCardPreview, x, y, previewW, previewH, false, false, 'full');
  } else if (hoveredPowerPreview) {
    drawPowerPreviewCard(hoveredPowerPreview, x, y, previewW, previewH);
  }
}

// Draw a full-size preview of a power card (similar to a card but without modes/etc)
function drawPowerPreviewCard(power, x, y, w, h) {
  const art = getPowerArt(power.id);

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

  // Draw description with inline keyword icons
  const descText = power.effectDescription || power.fullDescription || '';
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
  // Fade out in last 400ms
  const alpha = (!toastSticky && toastTimer < 400) ? toastTimer / 400 : 1;
  ctx.font = 'bold 22px Georgia, serif';
  ctx.textAlign = 'center';
  const tw = ctx.measureText(toastMessage).width;
  const padX = 24, padY = 12;
  const boxW = tw + padX * 2;
  const boxH = 22 + padY * 2;
  const x = (SCREEN_WIDTH - boxW) / 2;
  const y = SCREEN_HEIGHT / 2 - 100;

  ctx.fillStyle = `rgba(0,0,0,${0.8 * alpha})`;
  ctx.fillRect(x, y, boxW, boxH);
  ctx.strokeStyle = `rgba(255, 215, 0, ${alpha})`;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, boxW, boxH);

  ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
  ctx.textBaseline = 'middle';
  ctx.fillText(toastMessage, x + boxW / 2, y + boxH / 2);
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
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
  if ((state === GameState.TARGETING || state === GameState.POWER_TARGETING) && !isPlayer) {
    ctx.strokeStyle = Colors.RED;
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
  ctx.fillText(deckText, rect.x + rect.w / 2, infoTop + 22);

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
  const targetingNow = state === GameState.TARGETING || state === GameState.POWER_TARGETING;
  const isTargetable = targetingNow && !isPlayer;
  const isPicked = state === GameState.POWER_TARGETING && powerTargets.includes(creature);

  // Outer highlight
  if (isPicked) {
    ctx.fillStyle = Colors.GOLD;
    ctx.fillRect(rect.x - 4, rect.y - 4, rect.w + 8, rect.h + 8);
  } else if (isTargetable) {
    ctx.strokeStyle = Colors.RED;
    ctx.lineWidth = 3;
    ctx.strokeRect(rect.x - 3, rect.y - 3, rect.w + 6, rect.h + 6);
  }

  // Try creature art first (image keyed off snake-cased creature name)
  const artKey = (creature.name || '').toLowerCase().replace(/ /g, '_');
  const art = getCardArt(artKey);
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
  ctx.font = 'bold 14px sans-serif';
  ctx.fillStyle = Colors.WHITE;
  ctx.textAlign = 'left';
  ctx.fillText(`${creature.attack}`, rect.x + 6, hpBarY + hpBarH / 2 + 1);

  // Status badges row (above HP/attack): shield, heroism on the left; fire/ice/poison stacked
  const badgeY = hpBarY - 16;
  let bx = rect.x + 6;
  ctx.font = 'bold 10px sans-serif';
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
  // Right side: fire / ice / poison
  let rx = rect.x + rect.w - 6;
  if (creature.fireStacks > 0) {
    ctx.fillStyle = Colors.ORANGE;
    ctx.textAlign = 'right';
    ctx.fillText(`F${creature.fireStacks}`, rx, badgeY + 6);
    rx -= 20;
  }
  if (creature.iceStacks > 0) {
    ctx.fillStyle = Colors.ICE_BLUE;
    ctx.textAlign = 'right';
    ctx.fillText(`I${creature.iceStacks}`, rx, badgeY + 6);
    rx -= 20;
  }
  if (creature.poisonStacks > 0) {
    ctx.fillStyle = Colors.GREEN;
    ctx.textAlign = 'right';
    ctx.fillText(`P${creature.poisonStacks}`, rx, badgeY + 6);
  }

  // Exhausted overlay (Zzz) — primarily for player allies
  if (creature.exhausted && isPlayer) {
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = Colors.ORANGE;
    ctx.font = 'bold 18px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Zzz', rect.x + rect.w / 2, rect.y + rect.h / 2);
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

  // (logCardHitAreas is cleared at the start of drawCombat — don't clear here.)

  ctx.font = '12px sans-serif';
  ctx.textAlign = 'left';
  const lineH = 15;
  const maxWidth = logW - 12;

  // Build wrapped lines from bottom up to fill the visible area
  const wrappedEntries = [];
  for (let i = combatLog.length - 1; i >= 0; i--) {
    const entry = combatLog[i];
    const lines = wrapTextLong(entry.text, maxWidth, 12);
    // Push lines in order so the entry stays in reading order
    for (let j = lines.length - 1; j >= 0; j--) {
      wrappedEntries.unshift({
        text: lines[j], color: entry.color, card: entry.card,
        isFirstLine: j === 0, arrow: entry.arrow && j === 0,
      });
    }
    // Stop when we have enough lines
    if (wrappedEntries.length * lineH > logH) break;
  }

  // Render bottom-aligned (newest at bottom)
  const visibleLines = Math.floor((logH - 4) / lineH);
  const startIdx = Math.max(0, wrappedEntries.length - visibleLines);
  let y = logY + 14;
  for (let i = startIdx; i < wrappedEntries.length; i++) {
    const e = wrappedEntries[i];
    if (e.arrow && e.text.startsWith('→ ')) {
      // Render arrow in orange, rest in entry color (white by default)
      ctx.fillStyle = Colors.ORANGE;
      ctx.fillText('→', logX + 6, y);
      const arrowW = ctx.measureText('→ ').width;
      ctx.fillStyle = e.color;
      ctx.fillText(e.text.slice(2), logX + 6 + arrowW, y);
    } else {
      ctx.fillStyle = e.color;
      ctx.fillText(e.text, logX + 6, y);
    }
    if (e.card && e.isFirstLine) {
      // Register hit area for this log entry's card
      logCardHitAreas.push({
        x: logX + 4, y: y - 12, w: maxWidth + 4, h: lineH,
        card: e.card,
      });
    }
    y += lineH;
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
  if (hovered) hoveredPowerPreview = power;
  const art = getPowerArt(power.id);
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
            addLog(`Not enough cards in hand to pay Recharge +${rechargeNeeded} cost.`, Colors.RED);
            selectedCardIndex = -1;
            return;
          }
          cardRechargeMode = true;
          cardRechargeNeeded = rechargeNeeded;
          cardRechargedCards = [];
          pendingRechargeNames = [];
          showStickyToast(`Recharge: Click another card to recharge as cost (${rechargeNeeded} more, ESC to cancel)`);
          return;
        }
        // No extra recharge cost: proceed normally
        if (canPlayWithoutTarget(card)) {
          playCardSelf(i);
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
        } else {
          state = GameState.TARGETING;
          showStickyToast('Click on an enemy to attack (or click elsewhere to cancel)');
        }
      } else {
        showStickyToast(`Recharge: Click another card to recharge as cost (${cardRechargeNeeded} more, ESC to cancel)`);
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
    if (card.cardType !== CardType.DEFENSE) {
      showToast('Only defense cards can be played here.');
      return;
    }
    // Play the defense card
    player.deck.playCard(card);
    addLog(`You play ${card.name}`, Colors.GREEN, card);
    for (const eff of card.currentEffects) {
      if (eff.effectType === 'block') {
        player.addBlock(eff.value);
        addLog(`  +${eff.value} Block`, Colors.BLUE);
      } else if (eff.effectType === 'gain_shield') {
        player.shield += eff.value;
        addLog(`  +${eff.value} Shield (S:${player.shield})`, Colors.ALLY_BLUE);
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
      showStickyToast(`Incoming ${pendingIncomingDamage} damage. Click defense cards or pass.`);
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
  return { x: SCREEN_WIDTH / 2 - 110, y: COMBAT_DIVIDER_Y + 35, w: 220, h: 44 };
}

function cancelCardRecharge() {
  // Refund any recharged cards back to hand (they were placed in the recharge pile)
  for (const c of cardRechargedCards) {
    const idx = player.deck.rechargePile.indexOf(c);
    if (idx !== -1) player.deck.rechargePile.splice(idx, 1);
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
  // Click on enemy character card to target enemy directly
  const enemyCardRect = getCharacterCardRect(false);
  if (hitTest(x, y, enemyCardRect)) {
    const names = pendingRechargeNames.slice();
    cardRechargedCards = []; // commit recharged cards
    pendingRechargeNames = [];
    hideToast();
    playCardOnEnemy(selectedCardIndex);
    for (const n of names) addLog(`  Recharge: ${n}`);
    return;
  }

  // Click on enemy creatures
  const creatureRects = getEnemyCreatureRects();
  for (let i = 0; i < creatureRects.length; i++) {
    if (hitTest(x, y, creatureRects[i])) {
      const names = pendingRechargeNames.slice();
      cardRechargedCards = []; // commit recharged cards
      pendingRechargeNames = [];
      hideToast();
      playCardOnCreature(selectedCardIndex, enemy.creatures[i]);
      for (const n of names) addLog(`  Recharge: ${n}`);
      return;
    }
  }

  // Click elsewhere → cancel and refund recharged cards
  if (cardRechargedCards.length > 0) {
    cancelCardRecharge();
  }
  hideToast();
  selectedCardIndex = -1;
  state = GameState.COMBAT;
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
     e.effectType === 'sneak_attack' || e.effectType === 'multi_damage')
  );
}

// Reactively play any defense cards still in the enemy's hand (during player turn).
// Called just before player damage lands on the enemy character.
function enemyAutoPlayDefenses() {
  if (!enemy || !enemy.deck) return;
  const defenseCards = enemy.deck.hand.filter(c => c.cardType === CardType.DEFENSE);
  for (const card of defenseCards) {
    enemy.deck.playCard(card);
    addLog(`${enemy.name} plays ${card.name}`, Colors.RED, card);
    for (const eff of card.currentEffects) {
      if (eff.effectType === 'block') {
        enemy.addBlock(eff.value);
        addLog(`  +${eff.value} Block`, Colors.BLUE);
      } else if (eff.effectType === 'gain_shield') {
        enemy.shield += eff.value;
        addLog(`  +${eff.value} Shield (S:${enemy.shield})`, Colors.ALLY_BLUE);
      }
    }
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
      // Enemy reactively plays defense cards before damage lands on enemy character
      if (!(target instanceof Creature) && target === enemy) {
        enemyAutoPlayDefenses();
      }
      if (target instanceof Creature) {
        const before = target.shield + target.currentHp;
        const actual = target.takeDamage(dmg);
        const blocked = Math.max(0, dmg - actual);
        const blockedSuffix = blocked > 0 ? ` (blocked ${blocked})` : '';
        addLog(`  ${target.name}: ${actual} dmg${blockedSuffix}`, Colors.RED);
        if (!target.isAlive) { addLog(`  ${target.name} destroyed!`, Colors.GOLD); countAndRemoveDeadCreatures(); }
      } else {
        const [blocked, taken] = target.takeDamageWithDefense(dmg);
        const blockedSuffix = blocked > 0 ? ` (blocked ${blocked})` : '';
        addLog(`  ${target.name}: ${taken} dmg${blockedSuffix}`, Colors.RED);
      }
      attacksThisTurn++;
      break;
    }
    case 'unpreventable_damage': {
      const dmg = eff.value;
      if (target instanceof Creature) {
        target.takeUnpreventableDamage(dmg);
        addLog(`  ${dmg} true dmg to ${target.name}`, Colors.RED);
        if (!target.isAlive) { addLog(`  ${target.name} destroyed!`, Colors.GOLD); countAndRemoveDeadCreatures(); }
      } else {
        target.takeDamageFromDeck(dmg);
        addLog(`  ${dmg} true dmg to ${target.name}`, Colors.RED);
      }
      attacksThisTurn++;
      break;
    }
    case 'armor_bonus_damage': {
      // value encodes base+bonus: e.g. 46 = 4 base, 6 vs armor
      const base = Math.floor(eff.value / 10);
      const bonus = eff.value % 10;
      const heroism = caster.heroism;
      if (heroism > 0) { caster.heroism = 0; }
      let dmg = base + heroism;
      if (target.armor > 0 || target.shield > 0) dmg = bonus + heroism;
      if (target instanceof Creature) {
        const actual = target.takeDamage(dmg);
        addLog(`  ${actual} dmg to ${target.name}`, Colors.RED);
        if (!target.isAlive) { addLog(`  ${target.name} destroyed!`, Colors.GOLD); countAndRemoveDeadCreatures(); }
      } else {
        const [blocked, taken] = target.takeDamageWithDefense(dmg);
        addLog(`  ${taken} dmg to ${target.name}`, Colors.RED);
      }
      attacksThisTurn++;
      break;
    }
    case 'sneak_attack': {
      const dmg = attacksThisTurn + caster.heroism;
      if (caster.heroism > 0) { addLog(`  (Heroism +${caster.heroism})`, Colors.GOLD); caster.heroism = 0; }
      addLog(`  Sneak Attack x${attacksThisTurn}!`, Colors.GOLD);
      if (target instanceof Creature) {
        const actual = target.takeDamage(dmg);
        addLog(`  ${actual} dmg to ${target.name}`, Colors.RED);
        if (!target.isAlive) { addLog(`  ${target.name} destroyed!`, Colors.GOLD); countAndRemoveDeadCreatures(); }
      } else {
        const [blocked, taken] = target.takeDamageWithDefense(dmg);
        addLog(`  ${taken} dmg to ${target.name}`, Colors.RED);
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
      // Hit the clicked target first
      if (target instanceof Creature) {
        const actual = target.takeDamage(dmg);
        addLog(`  ${actual} dmg to ${target.name}`, Colors.RED);
        if (!target.isAlive) addLog(`  ${target.name} destroyed!`, Colors.GOLD);
        hits++;
      } else {
        const [blocked, taken] = target.takeDamageWithDefense(dmg);
        addLog(`  ${taken} dmg to ${target.name}`, Colors.RED);
        hits++;
      }
      // Hit additional targets
      const others = [...enemy.creatures.filter(c => c.isAlive && c !== target)];
      for (const c of others) {
        if (hits >= maxT) break;
        const actual = c.takeDamage(dmg);
        addLog(`  ${actual} dmg to ${c.name}`, Colors.RED);
        if (!c.isAlive) addLog(`  ${c.name} destroyed!`, Colors.GOLD);
        hits++;
      }
      if (hits < maxT && !(target === enemy)) {
        const [blocked, taken] = enemy.takeDamageWithDefense(dmg);
        addLog(`  ${taken} dmg to ${enemy.name}`, Colors.RED);
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
      break;
    }
    case 'apply_ice': {
      if (target instanceof Creature) {
        target.iceStacks += eff.value;
        addLog(`  +${eff.value} Ice on ${target.name}`, Colors.ICE_BLUE);
      } else {
        target.applyStatus('ICE', eff.value);
        addLog(`  +${eff.value} Ice on ${target.name}`, Colors.ICE_BLUE);
      }
      break;
    }
    case 'apply_fire': {
      if (target instanceof Creature) {
        target.fireStacks += eff.value;
        addLog(`  +${eff.value} Fire on ${target.name}`, Colors.RED);
      } else {
        target.applyStatus('FIRE', eff.value);
        addLog(`  +${eff.value} Fire on ${target.name}`, Colors.RED);
      }
      break;
    }
    case 'apply_fire_all': {
      enemy.applyStatus('FIRE', eff.value);
      addLog(`  +${eff.value} Fire on ${enemy.name}`, Colors.RED);
      for (const c of enemy.creatures) {
        c.fireStacks += eff.value;
        addLog(`  +${eff.value} Fire on ${c.name}`, Colors.RED);
      }
      break;
    }
    case 'block':
      caster.addBlock(eff.value);
      addLog(`  +${eff.value} Block`, Colors.BLUE);
      break;
    case 'gain_shield':
      caster.shield += eff.value;
      addLog(`  +${eff.value} Shield (S:${caster.shield})`, Colors.ALLY_BLUE);
      break;
    case 'heal':
      healPlayer(eff.value);
      break;
    case 'draw': {
      const drawn = caster.deck.draw(eff.value, MAX_HAND_SIZE);
      for (const d of drawn) addLog(`  Draw: ${d.name}`, Colors.BLUE, d);
      break;
    }
    case 'gain_heroism':
      caster.heroism += eff.value;
      addLog(`  +${eff.value} Heroism`, Colors.GOLD);
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
      thorb.ready();
      addLog(`  Thorb joins the fight!`, Colors.GREEN);
      break;
    }
    case 'summon_thorb_upgraded': {
      const thorb = new Creature({ name: 'Thorb', attack: 2, maxHp: 5, sentinel: true, isCompanion: true });
      player.addCreature(thorb);
      thorb.ready();
      addLog(`  Thorb (Sentinel) joins the fight!`, Colors.GREEN);
      break;
    }
    case 'summon_tamed_rat': {
      const count = Math.floor(Math.random() * 2) + 1;
      for (let i = 0; i < count; i++) {
        const rat = new Creature({ name: 'Tamed Rat', attack: 1, maxHp: 1 });
        player.addCreature(rat);
        rat.ready();
        addLog(`  Summoned Tamed Rat!`, Colors.GREEN);
      }
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
    // Effects we acknowledge but don't fully implement yet
    case 'scry_pick':
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

function playCardSelf(handIndex) {
  const card = player.deck.hand[handIndex];
  const stays = cardStaysInHand(card);
  if (stays) {
    card.exhausted = true;
  } else {
    player.deck.playCard(card);
  }
  addLog(stays ? `You use ${card.name} (stays in hand)` : `You play ${card.name}`, Colors.GREEN, card);

  for (const eff of card.currentEffects) {
    if (eff.effectType === 'stays_in_hand') continue;
    resolveEffect(eff, player, enemy);
  }

  selectedCardIndex = -1;
  state = GameState.COMBAT;
  checkCombatEnd();
}

function playCardOnEnemy(handIndex) {
  const card = player.deck.hand[handIndex];
  const stays = cardStaysInHand(card);
  if (stays) {
    card.exhausted = true;
  } else {
    player.deck.playCard(card);
  }
  addLog(stays ? `You use ${card.name} (stays in hand)` : `You play ${card.name}`, Colors.GREEN, card);

  for (const eff of card.currentEffects) {
    if (eff.effectType === 'stays_in_hand') continue;
    resolveEffect(eff, player, enemy);
  }

  selectedCardIndex = -1;
  state = GameState.COMBAT;
  checkCombatEnd();
}

function playCardOnCreature(handIndex, creature) {
  const card = player.deck.hand[handIndex];
  const stays = cardStaysInHand(card);
  if (stays) {
    card.exhausted = true;
  } else {
    player.deck.playCard(card);
  }
  addLog(
    stays
      ? `You use ${card.name} on ${creature.name} (stays in hand)`
      : `You play ${card.name} on ${creature.name}`,
    Colors.GREEN, card,
  );

  for (const eff of card.currentEffects) {
    if (eff.effectType === 'stays_in_hand') continue;
    if (eff.target === TargetType.SINGLE_ENEMY || eff.target === TargetType.RANDOM_ENEMY) {
      resolveEffect(eff, player, creature);
    } else {
      resolveEffect(eff, player, enemy);
    }
  }

  selectedCardIndex = -1;
  state = GameState.COMBAT;
  checkCombatEnd();
}

function dealDamageToEnemy(amount, target) {
  if (target === 'all') {
    const [blocked, taken] = enemy.takeDamageWithDefense(amount);
    addLog(`  ${taken} dmg to ${enemy.name}`, Colors.RED);
    for (const c of [...enemy.creatures]) {
      const actual = c.takeDamage(amount);
      addLog(`  ${actual} dmg to ${c.name}`, Colors.RED);
      if (!c.isAlive) addLog(`  ${c.name} destroyed!`, Colors.GOLD);
    }
    countAndRemoveDeadCreatures();
  } else {
    const [blocked, taken] = enemy.takeDamageWithDefense(amount);
    if (blocked > 0) addLog(`  (${blocked} blocked)`, Colors.BLUE);
    addLog(`  ${taken} dmg to ${enemy.name}`, Colors.RED);
  }
}

function healPlayer(amount) {
  // Move cards from damage pile back to draw pile
  let healed = 0;
  for (let i = 0; i < amount && player.deck.damagePile.length > 0; i++) {
    const card = player.deck.damagePile.pop();
    player.deck.addToDrawPile(card, 'random');
    healed++;
  }
  if (healed > 0) addLog(`  Healed ${healed} HP`, Colors.GREEN);
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
    showStickyToast(`${power.name}: Click ${power.rechargeCost} card(s) to ${verb} (ESC to cancel)`);
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
        showStickyToast(`${selectedPower.name}: Click ${powerRechargeCardsNeeded} more card(s) to ${verb} (ESC to cancel)`);
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
  const cardY = 160;

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
  return power.id === 'cleave';
}

function powerTargetCount(power) {
  if (power.id === 'cleave') return 2;
  if (power.id === 'elemental_infusion') return 1;
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
    const dmg = 1 + player.heroism;
    if (player.heroism > 0) { addLog(`  (Heroism +${player.heroism})`, Colors.GOLD); player.heroism = 0; }
    for (const t of targets) {
      if (t === enemy) {
        enemyAutoPlayDefenses();
        const [blocked, taken] = enemy.takeDamageWithDefense(dmg);
        const blockedSuffix = blocked > 0 ? ` (blocked ${blocked})` : '';
        addLog(`  ${enemy.name}: ${taken} dmg${blockedSuffix}`, Colors.RED);
      } else {
        const actual = t.takeDamage(dmg);
        const blocked = Math.max(0, dmg - actual);
        const blockedSuffix = blocked > 0 ? ` (blocked ${blocked})` : '';
        addLog(`  ${t.name}: ${actual} dmg${blockedSuffix}`, Colors.RED);
        if (!t.isAlive) { addLog(`  ${t.name} destroyed!`, Colors.GOLD); }
      }
    }
    countAndRemoveDeadCreatures();
  } else if (power.id === 'elemental_infusion') {
    // Apply Fire or Ice based on the picked choice
    const t = targets[0];
    const isIce = chosenPowerEffect === 'ice_token';
    if (isIce) {
      addLog(`  Mode: Ice`);
      if (t === enemy) {
        enemy.applyStatus('ICE', 1);
        addLog(`  +1 Ice on ${enemy.name}`, Colors.ICE_BLUE);
      } else {
        t.iceStacks = (t.iceStacks || 0) + 1;
        addLog(`  +1 Ice on ${t.name}`, Colors.ICE_BLUE);
      }
    } else {
      addLog(`  Mode: Fire`);
      if (t === enemy) {
        enemy.applyStatus('FIRE', 1);
        addLog(`  +1 Fire on ${enemy.name}`, Colors.RED);
      } else {
        t.fireStacks = (t.fireStacks || 0) + 1;
        addLog(`  +1 Fire on ${t.name}`, Colors.RED);
      }
    }
    chosenPowerEffect = null;
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
      const drawn = player.deck.draw(1, MAX_HAND_SIZE);
      for (const d of drawn) addLog(`  Draw: ${d.name}`, Colors.BLUE, d);
      break;
    }
    case 'elemental_infusion': {
      // Simplified: apply 1 fire to enemy
      const stacks = 1;
      enemy.applyStatus('FIRE', stacks);
      addLog(`  Applied 1 Fire to ${enemy.name}`, Colors.RED);
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
      const drawn = player.deck.draw(2, MAX_HAND_SIZE);
      for (const d of drawn) addLog(`  Draw: ${d.name}`, Colors.BLUE, d);
      break;
    }
    case 'feral_form': {
      // Simplified: gain 1 heroism + draw 1 (cat form default)
      player.heroism += 1;
      addLog(`  Feline Form! +1 Heroism`, Colors.GOLD);
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
  showStickyToast(`Incoming ${dmg} damage!`);
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
    showStickyToast(`Incoming ${remaining} damage. Click defense cards or pass.`);
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
    showStickyToast(`Deck empty! Click ${pendingIncomingDamage} card(s) from hand to discard.`);
  } else {
    showStickyToast(`Take ${pendingIncomingDamage} damage: click hand card to discard, or "Take from Deck"`);
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
      addLog(`  Took ${milled.length} from deck:`);
      // One sub-line per card so each is hoverable in the log
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
    addLog(`  Discarded: ${card.name}`, Colors.WHITE, card);
    pendingIncomingDamage--;
    if (pendingIncomingDamage <= 0) finishIncomingDamage();
    else enterTakeDamagePhase();
    return;
  }
}

function getTakeFromDeckBtnRect() {
  return { x: SCREEN_WIDTH / 2 - 110, y: COMBAT_DIVIDER_Y + 35, w: 220, h: 44 };
}

function drawDamageSourceOverlay() {
  // Flashing red glow on hand cards to indicate they're clickable to discard
  const pulse = (Math.sin(performance.now() / 200) + 1) / 2; // 0..1
  const glowAlpha = 0.4 + 0.45 * pulse;
  const handRects = getHandCardRects(player.deck.hand);
  for (let i = 0; i < handRects.length; i++) {
    const r = handRects[i];
    ctx.save();
    ctx.shadowColor = `rgba(255, 60, 60, ${glowAlpha})`;
    ctx.shadowBlur = 18;
    ctx.strokeStyle = `rgba(255, 60, 60, ${glowAlpha})`;
    ctx.lineWidth = 4;
    ctx.strokeRect(r.x - 2, r.y - 2, r.w + 4, r.h + 4);
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
    ? `Deck empty — discard ${pendingIncomingDamage} from hand`
    : `Take ${pendingIncomingDamage} from Deck`;
  ctx.fillText(label, r.x + r.w / 2, r.y + r.h / 2);
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
}

function endPlayerTurn() {
  if (!isPlayerTurn) return;
  if (powerRechargeMode) return; // can't end turn mid-recharge
  addLog('--- End of Your Turn ---', Colors.GRAY);

  // Player ally attacks
  processPlayerAllyAttacks();
  if (checkCombatEnd()) return;

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
  // Fire: deal damage equal to stacks, then reduce by 1
  const fire = character.getStatus('FIRE');
  if (fire > 0) {
    character.takeDamageFromDeck(fire);
    addLog(`  ${label} takes ${fire} Fire damage!`, Colors.RED);
    character.removeStatus('FIRE', 1);
  }
  // Poison: deal 1 unpreventable damage per stack
  const poison = character.getStatus('POISON');
  if (poison > 0) {
    character.takeDamageFromDeck(1);
    addLog(`  ${label} takes 1 Poison damage! (${poison} stacks)`, Colors.GREEN);
    character.removeStatus('POISON', 1);
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
      c.takeUnpreventableDamage(c.fireStacks);
      addLog(`  ${c.name} takes ${c.fireStacks} Fire damage!`, Colors.RED);
      c.fireStacks = Math.max(0, c.fireStacks - 1);
      if (!c.isAlive) { addLog(`  ${c.name} destroyed!`, Colors.GOLD); }
    }
    if (c.poisonStacks > 0) {
      c.takeUnpreventableDamage(1);
      addLog(`  ${c.name} takes 1 Poison damage!`, Colors.GREEN);
      c.poisonStacks = Math.max(0, c.poisonStacks - 1);
      if (!c.isAlive) { addLog(`  ${c.name} destroyed!`, Colors.GOLD); }
    }
  }
  character.removeDeadCreatures();
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
    if (!ally.isAlive || ally.exhausted || ally.attack <= 0) continue;
    // Ally attacks a random enemy creature, or enemy if no creatures
    const targets = enemy.creatures.filter(c => c.isAlive);
    if (targets.length > 0) {
      const target = targets[Math.floor(Math.random() * targets.length)];
      const actual = target.takeDamage(ally.attack);
      addLog(`  ${ally.name} attacks ${target.name} for ${actual}!`, Colors.GREEN);
      if (!target.isAlive) { addLog(`  ${target.name} destroyed!`, Colors.GOLD); }
    } else if (enemy.isAlive) {
      const [blocked, taken] = enemy.takeDamageWithDefense(ally.attack);
      addLog(`  ${ally.name} attacks ${enemy.name} for ${taken}!`, Colors.GREEN);
    }
    ally.exhaust();
  }
  countAndRemoveDeadCreatures();
}

// --- Enemy AI ---
let enemyDamageAccumulator = 0; // total damage from enemy attacks this turn (cards + creatures)
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

  // Plan enemy actions
  enemyActions = [];
  const hand = [...enemy.deck.hand];
  // Sort by priority descending
  hand.sort((a, b) => b.priority - a.priority);

  for (const card of hand) {
    if (card.cardType === CardType.ATTACK) {
      enemyActions.push({ type: 'play', card, action: 'attack' });
    } else if (card.cardType === CardType.CREATURE) {
      enemyActions.push({ type: 'play', card, action: 'summon' });
    }
    // DEFENSE cards are not queued — they auto-play reactively when player attacks the enemy
  }
  enemyActions.push({ type: 'end' });

  enemyActionIndex = 0;
  enemyActionTimer = 500; // ms before first action
}

function updateEnemyTurn(dt) {
  if (isPlayerTurn) return;
  if (enemyActionIndex >= enemyActions.length) return;

  enemyActionTimer -= dt;
  if (enemyActionTimer > 0) return;

  const action = enemyActions[enemyActionIndex];
  enemyActionIndex++;
  enemyActionTimer = 600; // delay between actions

  if (action.type === 'end') {
    finishEnemyTurn();
    return;
  }

  const card = action.card;
  // Check card is still in hand
  if (!enemy.deck.hand.includes(card)) return;

  enemy.deck.playCard(card);

  if (action.action === 'attack') {
    addLog(`${enemy.name} plays ${card.name}`, Colors.RED, card);
    for (const eff of card.currentEffects) {
      if (eff.effectType === 'damage') {
        let dmg = Math.max(0, eff.value + enemy.heroism + enemy.rage + getDamageModifier(enemy));
        dmg += getIncomingDamageModifier(player);
        dmg = Math.max(0, dmg);
        if (enemy.heroism > 0) enemy.heroism = 0;
        // Accumulate damage; the full damage flow runs once at end of enemy turn
        enemyDamageAccumulator += dmg;
        addLog(`  ${dmg} damage incoming`, Colors.RED);
      } else if (eff.effectType === 'unpreventable_damage') {
        // Unpreventable damage still applies immediately (bypasses defense flow)
        player.takeDamageFromDeck(eff.value);
        addLog(`  ${eff.value} true damage to you!`, Colors.RED);
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
        for (let i = 0; i < count; i++) {
          const creature = isGuard
            ? new Creature({ name: 'Kobold Guard', attack: 2, maxHp: 1 })
            : new Creature({ name: 'Rat', attack: 1, maxHp: 1 });
          enemy.addCreature(creature);
        }
        addLog(`  ${count} ${baseName}${count > 1 ? 's' : ''} summoned`, Colors.ORANGE);
      }
    }
  }

  checkCombatEnd();
}

function finishEnemyTurn() {
  // Creature attacks — accumulate damage instead of applying immediately.
  // Creatures summoned this turn are still exhausted (default for new Creatures)
  // and skip the attack here. They'll ready at the start of the next enemy turn.
  for (const c of enemy.creatures) {
    if (c.isAlive && !c.exhausted) {
      const dmg = c.attack;
      addLog(`${c.name} attacks`, Colors.RED);
      addLog(`  ${dmg} damage incoming`, Colors.RED);
      enemyDamageAccumulator += dmg;
      c.exhaust();
    }
  }

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
  for (const log of buffLogs) addLog(log.text, log.color);

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
  // Normal victory
  if (!enemy._invulnerable && !enemy.isAlive && enemy.creatures.filter(c => c.isAlive).length === 0) {
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
  player.deck.endCombat();
  // Clear player creatures from combat
  player.creatures = [];
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

function getModalRects() {
  if (!modalCard || !modalCard.modes) return [];
  const count = modalCard.modes.length;
  const btnW = 400;
  const btnH = 60;
  const gap = 20;
  const startY = SCREEN_HEIGHT / 2 - ((count * (btnH + gap)) / 2);
  const startX = (SCREEN_WIDTH - btnW) / 2;
  return modalCard.modes.map((m, i) => ({
    x: startX, y: startY + i * (btnH + gap), w: btnW, h: btnH, mode: m, index: i,
  }));
}

function handleModalSelectClick(x, y) {
  const rects = getModalRects();
  for (const r of rects) {
    if (hitTest(x, y, r)) {
      // Play the card with the chosen mode's effects
      const handIndex = player.deck.hand.indexOf(modalCard);
      if (handIndex === -1) { state = GameState.COMBAT; return; }
      player.deck.playCard(modalCard);
      addLog(`You play ${modalCard.name}`, Colors.GREEN, modalCard);
      addLog(`  Mode: ${r.mode.description}`);

      // Check if mode needs a target
      const needsT = r.mode.effects.some(e => e.target === TargetType.SINGLE_ENEMY);
      if (needsT) {
        // Use effects on enemy directly (simplified - no creature targeting for modals)
        for (const eff of r.mode.effects) {
          resolveEffect(eff, player, enemy);
        }
      } else {
        for (const eff of r.mode.effects) {
          resolveEffect(eff, player, enemy);
        }
      }

      modalCard = null;
      modalTarget = null;
      selectedCardIndex = -1;
      state = GameState.COMBAT;
      checkCombatEnd();
      return;
    }
  }

  // Click elsewhere: cancel
  modalCard = null;
  modalTarget = null;
  selectedCardIndex = -1;
  state = GameState.COMBAT;
}

function drawModalOverlay() {
  // Dim overlay
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

  ctx.fillStyle = Colors.GOLD;
  ctx.font = 'bold 28px serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${modalCard.name} - Choose a Mode`, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 100);

  const rects = getModalRects();
  for (const r of rects) {
    const hov = hitTest(mouseX, mouseY, r);
    ctx.fillStyle = hov ? '#4a3a6e' : '#2a1a4e';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = hov ? Colors.GOLD : Colors.GRAY;
    ctx.lineWidth = 2;
    ctx.strokeRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = hov ? Colors.GOLD : Colors.WHITE;
    ctx.font = '18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(r.mode.description, r.x + r.w / 2, r.y + r.h / 2);
    ctx.textBaseline = 'alphabetic';
  }

  ctx.fillStyle = Colors.GRAY;
  ctx.font = '14px sans-serif';
  ctx.fillText('ESC to cancel', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 120);
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
const INV_BOTTOM_Y = SCREEN_HEIGHT - 10;
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

function getDeckCardRects() {
  const s = getInvSections();
  const cardW = 96, cardH = 134, gap = 10, cols = 4;
  const startX = s.deck.x + 20;
  const startY = s.deck.y + 50 - inventoryScrollY;
  return player.deck.masterDeck.map((_, i) => ({
    x: startX + (i % cols) * (cardW + gap),
    y: startY + Math.floor(i / cols) * (cardH + 12),
    w: cardW, h: cardH, index: i,
  }));
}

function getBackpackCardRects() {
  const s = getInvSections();
  const cardW = 96, cardH = 134, gap = 10, cols = 4;
  const startX = s.backpack.x + 20;
  const startY = s.backpack.y + 50 - inventoryScrollY;
  return backpack.map((_, i) => ({
    x: startX + (i % cols) * (cardW + gap),
    y: startY + Math.floor(i / cols) * (cardH + 12),
    w: cardW, h: cardH, index: i,
  }));
}

function exitInventory() {
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
}

function handleInventoryClick(x, y) {
  // Equip/unequip only allowed in rest mode
  if (!restMode) return;

  const sections = getInvSections();

  // Click backpack cards to equip (add to deck)
  const bpRects = getBackpackCardRects();
  for (const r of bpRects) {
    if (r.y + r.h < sections.backpack.y || r.y > sections.backpack.y + sections.backpack.h - 60) continue;
    if (hitTest(x, y, r)) {
      const card = backpack[r.index];
      backpack.splice(r.index, 1);
      player.deck.addCard(card);
      addLog(`Equipped: ${card.name}`, Colors.GREEN);
      return;
    }
  }

  // Click deck cards to unequip (move to backpack)
  const deckRects = getDeckCardRects();
  for (const r of deckRects) {
    if (r.y + r.h < sections.deck.y || r.y > sections.deck.y + sections.deck.h - 60) continue;
    if (hitTest(x, y, r)) {
      const card = player.deck.masterDeck[r.index];
      if (player.deck.masterDeck.length > 5) {
        player.deck.masterDeck.splice(r.index, 1);
        backpack.push(card);
        addLog(`Unequipped: ${card.name}`, Colors.GRAY);
      }
      return;
    }
  }
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

  if (restMode) {
    ctx.fillStyle = '#bbb';
    ctx.font = '11px sans-serif';
    ctx.fillText('click to unequip', sections.deck.x + sections.deck.w / 2, sections.deck.y + 42);
    ctx.fillText('click to equip', sections.backpack.x + sections.backpack.w / 2, sections.backpack.y + 42);
  }

  // Track hovered card for the full-card cursor preview
  hoveredCardPreview = null;
  hoveredPowerPreview = null;

  // --- Deck cards (with clipping for scroll) ---
  const deckClipY = sections.deck.y + 50;
  const deckClipH = sections.deck.h - 60;
  ctx.save();
  ctx.beginPath();
  ctx.rect(sections.deck.x + 4, deckClipY, sections.deck.w - 8, deckClipH);
  ctx.clip();
  const deckRects = getDeckCardRects();
  for (let i = 0; i < player.deck.masterDeck.length; i++) {
    const r = deckRects[i];
    if (r.y + r.h < deckClipY || r.y > deckClipY + deckClipH) continue;
    const card = player.deck.masterDeck[i];
    const hov = hitTest(mouseX, mouseY, r);
    drawCard(card, r.x, r.y, r.w, r.h, false, hov);
    if (hov && r.y >= deckClipY && r.y + r.h <= deckClipY + deckClipH) {
      hoveredCardPreview = card;
    }
  }
  ctx.restore();

  // --- Backpack cards (with clipping) ---
  const bpClipY = sections.backpack.y + 50;
  const bpClipH = sections.backpack.h - 60;
  ctx.save();
  ctx.beginPath();
  ctx.rect(sections.backpack.x + 4, bpClipY, sections.backpack.w - 8, bpClipH);
  ctx.clip();
  const bpRects = getBackpackCardRects();
  for (let i = 0; i < backpack.length; i++) {
    const r = bpRects[i];
    if (r.y + r.h < bpClipY || r.y > bpClipY + bpClipH) continue;
    const card = backpack[i];
    const hov = hitTest(mouseX, mouseY, r);
    drawCard(card, r.x, r.y, r.w, r.h, false, hov);
    if (hov && r.y >= bpClipY && r.y + r.h <= bpClipY + bpClipH) {
      hoveredCardPreview = card;
    }
  }
  ctx.restore();

  // --- Character section: portrait + class info ---
  drawInventoryCharacter(sections.character);

  if (restMode) {
    // Rest mode: keep the Done button at the bottom of the character section
    const doneBtnW = sections.character.w - 40;
    const doneBtnH = 56;
    const doneBtnX = sections.character.x + 20;
    const doneBtnY = sections.character.y + sections.character.h - doneBtnH - 16;
    drawStyledButton(doneBtnX, doneBtnY, doneBtnW, doneBtnH, 'Done', exitInventory, 'large', 22);
  } else {
    // Normal mode: close hint at the bottom of the character section
    ctx.fillStyle = Colors.GOLD;
    ctx.font = '14px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('Press I or ESC to Close', sections.character.x + sections.character.w / 2, sections.character.y + sections.character.h - 18);
    ctx.textAlign = 'left';
  }

  // Full card hover preview (follows cursor, same as combat)
  drawHoverPreview();
}

function drawInventoryCharacter(rect) {
  // Class portrait
  const portraitW = rect.w - 40;
  const portraitH = 280;
  const portraitX = rect.x + 20;
  const portraitY = rect.y + 60;
  const portraitArtId = `${selectedClass.toLowerCase()}_class`;
  const portrait = getCardArt(portraitArtId);

  if (portrait) {
    const imgAspect = portrait.width / portrait.height;
    const cardAspect = portraitW / portraitH;
    let sx = 0, sy = 0, sw = portrait.width, sh = portrait.height;
    if (imgAspect > cardAspect) { sw = portrait.height * cardAspect; sx = (portrait.width - sw) / 2; }
    else { sh = portrait.width / cardAspect; sy = (portrait.height - sh) / 2; }
    ctx.drawImage(portrait, sx, sy, sw, sh, portraitX, portraitY, portraitW, portraitH);
    ctx.strokeStyle = Colors.GOLD;
    ctx.lineWidth = 2;
    ctx.strokeRect(portraitX, portraitY, portraitW, portraitH);
  }

  // Character info below portrait
  const infoY = portraitY + portraitH + 16;
  ctx.fillStyle = Colors.GOLD;
  ctx.font = 'bold 22px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(selectedClass, rect.x + rect.w / 2, infoY);

  ctx.fillStyle = Colors.WHITE;
  ctx.font = '14px sans-serif';
  ctx.fillText(`Level ${player.level}`, rect.x + rect.w / 2, infoY + 22);

  // HP info
  const hp = (player.deck.drawPile?.length || 0) + (player.deck.hand?.length || 0) +
             (player.deck.rechargePile?.length || 0) + player.deck.masterDeck.length;
  const totalHp = player.deck.masterDeck.length + (player.deck.damagePile?.length || 0);
  ctx.fillStyle = '#aef';
  ctx.fillText(`HP: ${player.deck.masterDeck.length} / ${totalHp}`, rect.x + rect.w / 2, infoY + 42);

  // Perks
  if (player.perks && player.perks.length > 0) {
    ctx.fillStyle = Colors.GOLD;
    ctx.font = 'bold 14px Georgia, serif';
    ctx.fillText('Perks', rect.x + rect.w / 2, infoY + 72);
    ctx.fillStyle = '#ddd';
    ctx.font = '12px sans-serif';
    let py = infoY + 92;
    for (const perk of player.perks.slice(0, 5)) {
      ctx.fillText(`• ${perk.name}`, rect.x + rect.w / 2, py);
      py += 16;
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
const SL_SLOT_H = 44;
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
  if (info) {
    const badge = isAuto ? '[Auto] ' : '';
    // Single line: "[Auto] Slot 1   Paladin Lv1 • 12 cards • 0 gold"
    ctx.fillStyle = Colors.WHITE;
    ctx.font = 'bold 14px Georgia, serif';
    ctx.fillText(`${badge}Slot ${displayNum}`, rect.x + 14, rect.y + 18);
    ctx.fillStyle = '#bbb';
    ctx.font = '12px sans-serif';
    ctx.fillText(`${info.class} Lv${info.level} • ${info.deckSize} cards • ${info.gold} gold`, rect.x + 14, rect.y + 34);
    // Date on the right
    ctx.fillStyle = '#888';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(info.date, rect.x + rect.w - 14, rect.y + 28);
  } else {
    ctx.fillStyle = '#777';
    ctx.font = 'italic 13px sans-serif';
    ctx.fillText(`Slot ${displayNum}: -- Empty --`, rect.x + 14, rect.y + 26);
  }
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
      drawCombat();
      if (state === GameState.MODAL_SELECT) drawModalOverlay();
      if (state === GameState.DEFENDING) drawDefendingOverlay();
      if (state === GameState.DAMAGE_SOURCE) drawDamageSourceOverlay();
      if (state === GameState.POWER_CHOICE) drawPowerChoiceOverlay();
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
  ]},
  { title: 'Status Effects', items: [
    { text: 'Fire: deals damage equal to stacks at start of turn, decays by 1.', color: '#dc8c28' },
    { text: 'Ice: reduces damage dealt by stacks, decays by 1 per turn.', color: '#78c8ff' },
    { text: 'Poison: deals 1 unpreventable damage per turn, decays by 1.', color: '#3cc83c' },
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

function spawnDamageNumber(x, y, text, color = Colors.RED) {
  damageNumbers.push({
    x: x + (Math.random() - 0.5) * 30,
    y,
    text,
    color,
    timer: 1200, // ms lifetime
    vy: -1.5, // float upward
  });
}

function updateDamageNumbers(dt) {
  for (const dn of damageNumbers) {
    dn.timer -= dt;
    dn.y += dn.vy * (dt / 16);
  }
  damageNumbers = damageNumbers.filter(dn => dn.timer > 0);
}

function drawDamageNumbers() {
  for (const dn of damageNumbers) {
    const alpha = Math.min(1, dn.timer / 400);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = dn.color;
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(dn.text, dn.x, dn.y);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}

// ============================================================
// FOG OF WAR
// ============================================================

function drawFogOfWar(currentArea) {
  if (!currentMap) return;
  const currentNode = currentMap.getCurrentNode();
  if (!currentNode) return;

  // Only apply fog to dark maps
  const darkMaps = ['cave', 'filibaf_forest', 'obsidian_wastes', 'flood_temple', 'flood_temple_boss_wing'];
  if (!darkMaps.includes(currentArea)) return;

  // Create fog overlay
  ctx.fillStyle = 'rgba(0,0,0,0.85)';
  ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

  // Reveal around current node
  const [cx, cy] = currentNode.position;
  drawRevealCircle(cx, cy, 360, 1);

  // Dim reveal on visited nodes
  const accessible = currentMap.getAccessibleNodes().map(n => n.id);
  for (const [id, node] of Object.entries(currentMap.nodes)) {
    if (node.mapArea !== currentArea) continue;
    if (id === currentMap.currentNodeId) continue;
    const [nx, ny] = node.position;
    if (visitedNodes.has(id)) {
      drawRevealCircle(nx, ny, 240, 0.6);
    } else if (accessible.includes(id)) {
      drawRevealCircle(nx, ny, 120, 0.3);
    }
  }
}

function drawRevealCircle(x, y, radius, intensity) {
  // Use destination-out compositing to punch holes in the fog
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, `rgba(0,0,0,${intensity})`);
  gradient.addColorStop(0.7, `rgba(0,0,0,${intensity * 0.5})`);
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  ctx.restore();
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

  draw();

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
