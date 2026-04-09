import { GAME_VERSION, SCREEN_WIDTH, SCREEN_HEIGHT, GameState, Colors, CARD_COLORS, CardType, CostType, TargetType } from './constants.js';

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
import { getClassPower } from './power.js';
import { saveToSlot, loadFromSlot, hasSave, getSaveInfo } from './save.js';

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
}, { passive: false });

// === Utility ===
function addLog(text, color = Colors.WHITE) {
  combatLog.push({ text, color });
  if (combatLog.length > 50) combatLog.shift();
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
    case GameState.TITLE_CARD:
      dismissTitleCard();
      break;
    case GameState.FADING:
      // clicks during fade are ignored
      break;
  }
}

function handleKeyDown(key, event) {
  if (key === 'Escape') {
    if (powerRechargeMode) {
      cancelPowerRecharge();
    } else if (state === GameState.MODAL_SELECT) {
      modalCard = null;
      modalTarget = null;
      state = GameState.COMBAT;
    } else if (state === GameState.TARGETING) {
      selectedCardIndex = -1;
      state = GameState.COMBAT;
    } else if (state === GameState.COMBAT) {
      selectedCardIndex = -1;
    } else if (state === GameState.SAVE_GAME || state === GameState.LOAD_GAME) {
      state = GameState.MAP;
    } else if (state === GameState.SHOP || state === GameState.INVENTORY) {
      state = GameState.MAP;
    }
  }
  if (key === 's' || key === 'S') {
    if (state === GameState.MAP) state = GameState.SAVE_GAME;
  }
  if (key === 'l' || key === 'L') {
    if (state === GameState.MAP) state = GameState.LOAD_GAME;
  }
  if (key === 'i' || key === 'I') {
    if (state === GameState.MAP) state = GameState.INVENTORY;
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
  ctx.fillStyle = Colors.GOLD;
  ctx.font = 'bold 64px serif';
  ctx.textAlign = 'center';
  ctx.fillText('CCG Quest', SCREEN_WIDTH / 2, 200);
  ctx.fillStyle = Colors.WHITE;
  ctx.font = '24px serif';
  ctx.fillText('A Collectible Card Game RPG', SCREEN_WIDTH / 2, 250);
  ctx.fillStyle = Colors.GRAY;
  ctx.font = '16px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`v${GAME_VERSION}`, 10, 24);

  menuButtons.length = 0;
  const btnW = 240, btnH = 50;
  const btnX = (SCREEN_WIDTH - btnW) / 2;
  drawButton(btnX, 360, btnW, btnH, 'New Game', startNewGame);
  if (hasSave('1') || hasSave('2') || hasSave('3')) {
    drawButton(btnX, 430, btnW, btnH, 'Load Game', () => { state = GameState.LOAD_GAME; });
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
  showTitleCard('Part 1: The White Claw', 'Chapter 1: The Prison', () => {
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
  ctx.fillStyle = Colors.GOLD;
  ctx.font = 'bold 36px serif';
  ctx.textAlign = 'center';
  ctx.fillText('Choose Your Class', SCREEN_WIDTH / 2, 100);

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
      ctx.globalAlpha = hovered ? 1 : 0.8;
      ctx.drawImage(art, sx, sy, sw, sh, r.x, r.y, r.w, r.h);
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = hovered ? r.color : '#2a1a4e';
      ctx.globalAlpha = hovered ? 0.9 : 0.75;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.globalAlpha = 1;
    }

    ctx.strokeStyle = hovered ? Colors.GOLD : Colors.GRAY;
    ctx.lineWidth = hovered ? 3 : 2;
    ctx.strokeRect(r.x, r.y, r.w, r.h);

    // Name bar at bottom
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(r.x, r.y + r.h - 55, r.w, 55);
    ctx.fillStyle = Colors.WHITE;
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(r.name, r.x + r.w / 2, r.y + r.h - 30);
    ctx.font = '13px sans-serif';
    ctx.fillStyle = Colors.GRAY;
    ctx.fillText(r.desc, r.x + r.w / 2, r.y + r.h - 10);
  }
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
  // Back button
  const backBtn = { x: 40, y: SCREEN_HEIGHT - 80, w: 150, h: 50 };
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

  ctx.fillStyle = Colors.GRAY;
  ctx.font = '18px sans-serif';
  ctx.fillText(`${selectedClass} - Pick one ability card to add to your deck`, SCREEN_WIDTH / 2, 120);

  const rects = getAbilityCardRects();
  for (let i = 0; i < abilityChoices.length; i++) {
    const card = abilityChoices[i];
    const r = rects[i];
    const hovered = hitTest(mouseX, mouseY, r);
    const art = getCardArt(card.id);

    if (art) {
      // Draw art filling card area (crop to fit)
      const imgAspect = art.width / art.height;
      const cardAspect = r.w / r.h;
      let sx = 0, sy = 0, sw = art.width, sh = art.height;
      if (imgAspect > cardAspect) { sw = art.height * cardAspect; sx = (art.width - sw) / 2; }
      else { sh = art.width / cardAspect; sy = (art.height - sh) / 2; }
      ctx.globalAlpha = hovered ? 1 : 0.9;
      ctx.drawImage(art, sx, sy, sw, sh, r.x, r.y, r.w, r.h);
      ctx.globalAlpha = 1;
    } else {
      const typeColor = CARD_COLORS[card.cardType] || '#444';
      ctx.fillStyle = typeColor;
      ctx.globalAlpha = hovered ? 1 : 0.85;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.globalAlpha = 1;
    }

    // Border
    ctx.strokeStyle = hovered ? Colors.GOLD : '#888';
    ctx.lineWidth = hovered ? 3 : 2;
    ctx.strokeRect(r.x, r.y, r.w, r.h);

    // Name bar at top
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(r.x, r.y, r.w, 40);
    ctx.fillStyle = Colors.WHITE;
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(card.name, r.x + r.w / 2, r.y + 26);

    // Description panel at bottom
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(r.x, r.y + r.h - 90, r.w, 90);

    const costLabels = { RECHARGE: 'Recharge', EXHAUST: 'Exhaust', BANISH: 'Banish', DISCARD: 'Discard', FREE: 'Free' };
    ctx.fillStyle = Colors.GOLD;
    ctx.font = '12px sans-serif';
    ctx.fillText(`${card.subtype || card.cardType}  •  ${costLabels[card.costType] || card.costType}`, r.x + r.w / 2, r.y + r.h - 72);

    ctx.fillStyle = '#eee';
    ctx.font = '14px sans-serif';
    const descLines = wrapText(card.description, r.w - 20, 14);
    let descY = r.y + r.h - 52;
    for (const line of descLines.slice(0, 3)) {
      ctx.fillText(line, r.x + r.w / 2, descY);
      descY += 18;
    }

    if (hovered) {
      ctx.fillStyle = Colors.GOLD;
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('Click to select', r.x + r.w / 2, r.y + r.h - 5);
    }
  }

  // Back button
  const backBtn = { x: 40, y: SCREEN_HEIGHT - 80, w: 150, h: 50 };
  const backHov = hitTest(mouseX, mouseY, backBtn);
  ctx.fillStyle = backHov ? '#4a3a6e' : '#2a1a4e';
  ctx.fillRect(backBtn.x, backBtn.y, backBtn.w, backBtn.h);
  ctx.strokeStyle = backHov ? Colors.GOLD : Colors.GRAY;
  ctx.lineWidth = 2;
  ctx.strokeRect(backBtn.x, backBtn.y, backBtn.w, backBtn.h);
  ctx.fillStyle = backHov ? Colors.GOLD : Colors.WHITE;
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('< Back', backBtn.x + backBtn.w / 2, backBtn.y + backBtn.h / 2);
  ctx.textBaseline = 'alphabetic';

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

function getEncounterBg() {
  // Try to use current map area's background for encounters
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
    saveToSlot({ selectedClass, gold, player, currentMap, visitedNodes, backpack }, 'auto');
    return;
  }

  const phase = currentEncounter.currentPhase;
  switch (phase.phaseType) {
    case EncounterPhase.TEXT:
      encounterTextIndex = 0;
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
    },
    bone_pile: () => {
      enemy = new Character('Bone Pile');
      enemy.deck = new Deck();
      for (let i = 0; i < 6; i++) enemy.deck.addCard(createBigBone());
      for (let i = 0; i < 4; i++) enemy.deck.addCard(createLooseBone());
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
  encounterTextIndex++;
  if (encounterTextIndex >= phase.texts.length) {
    currentEncounter.advancePhase();
    advanceEncounterPhase();
  }
}

function drawEncounterText() {
  drawEncounterBg();

  const phase = currentEncounter.currentPhase;
  if (!phase || encounterTextIndex >= phase.texts.length) return;

  const entry = phase.texts[encounterTextIndex];
  const boxY = SCREEN_HEIGHT - 280;
  const boxH = 240;
  const boxX = 60;
  const boxW = SCREEN_WIDTH - 120;

  // Text box
  ctx.fillStyle = 'rgba(0,0,0,0.8)';
  ctx.fillRect(boxX, boxY, boxW, boxH);
  ctx.strokeStyle = Colors.GOLD;
  ctx.lineWidth = 2;
  ctx.strokeRect(boxX, boxY, boxW, boxH);

  // Speaker
  if (entry.speaker) {
    ctx.fillStyle = Colors.GOLD;
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(entry.speaker === '!' ? '!!!' : entry.speaker, boxX + 20, boxY + 30);
  }

  // Text (word-wrapped)
  ctx.fillStyle = Colors.WHITE;
  ctx.font = '16px sans-serif';
  ctx.textAlign = 'left';
  const maxWidth = boxW - 40;
  const lines = wrapTextLong(entry.text, maxWidth, 16);
  let textY = boxY + (entry.speaker ? 55 : 35);
  for (const line of lines) {
    ctx.fillText(line, boxX + 20, textY);
    textY += 22;
  }

  // Continue prompt
  ctx.fillStyle = Colors.GRAY;
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`Click to continue (${encounterTextIndex + 1}/${phase.texts.length})`, SCREEN_WIDTH / 2, boxY + boxH - 15);

  // Encounter title
  ctx.fillStyle = Colors.GOLD;
  ctx.font = 'bold 28px serif';
  ctx.textAlign = 'center';
  ctx.fillText(currentEncounter.name, SCREEN_WIDTH / 2, 60);

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
  enemy.deck.startCombat(enemy._handSize || 2, 10);

  addLog('--- Combat Start ---', Colors.GOLD);
  addLog(`${player.name} vs ${enemy.name}`, Colors.WHITE);

  // Apply perk effects at combat start
  applyPerksCombatStart();

  addLog(`Your turn! Play cards from your hand.`, Colors.GREEN);
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
      for (const d of drawn) addLog(`  Arsenal: Draw ${d.name}`, Colors.BLUE);
    }
  }
  // Talented: draw if no ability in hand
  const talentedStacks = player.getPerkStacks('turn_start_no_ability_draw');
  if (talentedStacks > 0) {
    const hasAbility = hand.some(c => c.cardType === CardType.ABILITY || c.subtype === 'ability');
    if (!hasAbility) {
      const drawn = player.deck.draw(talentedStacks, MAX_HAND_SIZE);
      for (const d of drawn) addLog(`  Talented: Draw ${d.name}`, Colors.BLUE);
    }
  }
}

// --- Card layout ---
const CARD_W = 100;
const CARD_H = 140;
const CARD_GAP = 8;

function getHandCardRects(hand) {
  const totalW = hand.length * (CARD_W + CARD_GAP) - CARD_GAP;
  const startX = (SCREEN_WIDTH - totalW) / 2;
  const y = SCREEN_HEIGHT - CARD_H - 20;
  return hand.map((_, i) => ({
    x: startX + i * (CARD_W + CARD_GAP),
    y, w: CARD_W, h: CARD_H,
  }));
}

function getEnemyCreatureRects() {
  const creatures = enemy.creatures;
  if (creatures.length === 0) return [];
  const totalW = creatures.length * (70 + 6) - 6;
  const startX = (SCREEN_WIDTH - totalW) / 2;
  const y = 200;
  return creatures.map((_, i) => ({
    x: startX + i * 76, y, w: 70, h: 90,
  }));
}

// --- Drawing cards ---
function drawCard(card, x, y, w, h, highlighted = false, hovered = false) {
  const typeColor = CARD_COLORS[card.cardType] || '#444';
  const art = getCardArt(card.id);

  if (art) {
    // Draw card art filling the card area
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
    ctx.globalAlpha = hovered ? 1 : 0.9;
    ctx.drawImage(art, sx, sy, sw, sh, x, y, w, h);
    ctx.globalAlpha = 1;

    // Name bar at top
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(x, y, w, 22);
    ctx.fillStyle = Colors.WHITE;
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(card.name, x + w / 2, y + 15);

    // Desc bar at bottom
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(x, y + h - 30, w, 30);
    ctx.fillStyle = '#ddd';
    ctx.font = '10px sans-serif';
    const descLines = wrapText(card.shortDesc || card.description, w - 8, 10);
    let descY = y + h - 20;
    for (const line of descLines.slice(0, 2)) {
      ctx.fillText(line, x + w / 2, descY);
      descY += 12;
    }
  } else {
    // Fallback: colored rectangle
    ctx.fillStyle = typeColor;
    ctx.globalAlpha = hovered ? 1 : 0.9;
    ctx.fillRect(x, y, w, h);
    ctx.globalAlpha = 1;

    ctx.fillStyle = Colors.WHITE;
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    const nameLines = wrapText(card.name, w - 8, 12);
    let textY = y + 16;
    for (const line of nameLines) {
      ctx.fillText(line, x + w / 2, textY);
      textY += 14;
    }

    ctx.fillStyle = '#ddd';
    ctx.font = '11px sans-serif';
    const descLines = wrapText(card.shortDesc || card.description, w - 10, 11);
    let descY = y + h / 2 + 5;
    for (const line of descLines) {
      ctx.fillText(line, x + w / 2, descY);
      descY += 13;
    }
  }

  // Cost type badge (top-left)
  const costLabels = { RECHARGE: 'R', EXHAUST: 'X', BANISH: 'B', DISCARD: 'D', FREE: 'F' };
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(x, y, 16, 16);
  ctx.font = 'bold 10px sans-serif';
  ctx.fillStyle = Colors.GOLD;
  ctx.textAlign = 'left';
  ctx.fillText(costLabels[card.costType] || '', x + 3, y + 12);

  // Border
  ctx.strokeStyle = highlighted ? Colors.GOLD : (hovered ? Colors.WHITE : '#666');
  ctx.lineWidth = highlighted ? 3 : (hovered ? 2 : 1);
  ctx.strokeRect(x, y, w, h);

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

  // --- Enemy area (top) ---
  drawCharacterPanel(enemy, 'enemy');

  // Enemy creatures
  const creatureRects = getEnemyCreatureRects();
  for (let i = 0; i < enemy.creatures.length; i++) {
    const c = enemy.creatures[i];
    const r = creatureRects[i];
    const hov = hitTest(mouseX, mouseY, r);
    ctx.fillStyle = hov ? '#5a3030' : '#3a2020';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = state === GameState.TARGETING ? Colors.RED : '#666';
    ctx.lineWidth = state === GameState.TARGETING ? 2 : 1;
    ctx.strokeRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = Colors.WHITE;
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(c.name, r.x + r.w / 2, r.y + 20);
    ctx.font = '11px sans-serif';
    ctx.fillText(`${c.attack}/${c.currentHp}`, r.x + r.w / 2, r.y + 40);
    if (c.shield > 0) {
      ctx.fillStyle = Colors.ALLY_BLUE;
      ctx.fillText(`S:${c.shield}`, r.x + r.w / 2, r.y + 55);
    }
  }

  // --- Player area (bottom) ---
  drawCharacterPanel(player, 'player');

  // --- Player hand ---
  const handRects = getHandCardRects(player.deck.hand);
  for (let i = 0; i < player.deck.hand.length; i++) {
    const card = player.deck.hand[i];
    const r = handRects[i];
    const hov = hitTest(mouseX, mouseY, r);
    const selected = i === selectedCardIndex;
    drawCard(card, r.x, selected ? r.y - 20 : r.y, r.w, r.h, selected, hov);
  }

  // --- Player Allies ---
  if (player.creatures.length > 0) {
    const allyStartX = 240;
    const allyY = SCREEN_HEIGHT - 200;
    for (let i = 0; i < player.creatures.length; i++) {
      const ally = player.creatures[i];
      const ax = allyStartX + i * 76;
      const aw = 70, ah = 90;
      const hov = hitTest(mouseX, mouseY, { x: ax, y: allyY, w: aw, h: ah });
      ctx.fillStyle = hov ? '#2a5a3a' : '#1a3a2a';
      ctx.fillRect(ax, allyY, aw, ah);
      ctx.strokeStyle = ally.exhausted ? '#555' : Colors.GREEN;
      ctx.lineWidth = ally.exhausted ? 1 : 2;
      ctx.strokeRect(ax, allyY, aw, ah);
      ctx.fillStyle = Colors.WHITE;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(ally.name, ax + aw / 2, allyY + 20);
      ctx.font = '11px sans-serif';
      ctx.fillText(`${ally.attack}/${ally.currentHp}`, ax + aw / 2, allyY + 40);
      if (!ally.exhausted) {
        ctx.fillStyle = Colors.GREEN;
        ctx.font = '9px sans-serif';
        ctx.fillText('Ready', ax + aw / 2, allyY + 55);
      }
    }
  }

  // --- Player Power ---
  if (player.powers.length > 0) {
    drawPowerArea();
  }

  // --- Power Recharge mode hint ---
  if (powerRechargeMode) {
    ctx.fillStyle = Colors.GOLD;
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Select ${powerRechargeCardsNeeded} card(s) from hand to recharge (ESC to cancel)`, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 30);
  }

  // --- End Turn button ---
  if (isPlayerTurn && !powerRechargeMode) {
    const btnX = SCREEN_WIDTH - 160, btnY = SCREEN_HEIGHT - 180, btnW = 130, btnH = 40;
    drawButton(btnX, btnY, btnW, btnH, 'End Turn', endPlayerTurn);
  }

  // --- Turn indicator ---
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  if (isPlayerTurn) {
    ctx.fillStyle = Colors.GREEN;
    ctx.fillText('Your Turn', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 5);
  } else {
    ctx.fillStyle = Colors.RED;
    ctx.fillText('Enemy Turn...', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 5);
  }

  // --- Targeting hint ---
  if (state === GameState.TARGETING) {
    ctx.fillStyle = Colors.GOLD;
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Click enemy or creature to attack (ESC to cancel)', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 30);
  }

  // --- Combat log ---
  drawCombatLog();

  // --- Tooltip on hovered card ---
  drawCardTooltip();

  ctx.textAlign = 'left';
}

function drawCardTooltip() {
  // Find hovered hand card
  const handRects = getHandCardRects(player.deck.hand);
  for (let i = 0; i < handRects.length; i++) {
    const r = handRects[i];
    if (hitTest(mouseX, mouseY, r)) {
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

function drawCharacterPanel(character, side) {
  const isPlayer = side === 'player';
  const panelX = 20;
  const panelY = isPlayer ? SCREEN_HEIGHT - 200 : 20;
  const panelW = 200;
  const panelH = 100;

  // Portrait art (left side of panel)
  const portraitW = 60;
  const portraitArtId = isPlayer
    ? `${selectedClass.toLowerCase()}_class`
    : character.name.toLowerCase().replace(/ /g, '_');
  const portrait = getCardArt(portraitArtId);

  if (portrait) {
    const imgAspect = portrait.width / portrait.height;
    const pAspect = portraitW / panelH;
    let sx = 0, sy = 0, sw = portrait.width, sh = portrait.height;
    if (imgAspect > pAspect) { sw = portrait.height * pAspect; sx = (portrait.width - sw) / 2; }
    else { sh = portrait.width / pAspect; sy = (portrait.height - sh) / 2; }
    ctx.drawImage(portrait, sx, sy, sw, sh, panelX, panelY, portraitW, panelH);
  }

  // Panel background (right of portrait)
  const infoX = panelX + (portrait ? portraitW : 0);
  const infoW = panelW - (portrait ? portraitW : 0);
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(infoX, panelY, infoW, panelH);
  ctx.strokeStyle = isPlayer ? Colors.GREEN : Colors.RED;
  ctx.lineWidth = 2;
  ctx.strokeRect(panelX, panelY, panelW, panelH);

  ctx.fillStyle = Colors.WHITE;
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(character.name, infoX + 6, panelY + 18);

  const hp = getHP(character);
  const maxHp = getMaxHP(character);
  const dmg = getDamage(character);

  // HP bar
  const barX = infoX + 6, barY = panelY + 28, barW = infoW - 12, barH = 14;
  ctx.fillStyle = '#333';
  ctx.fillRect(barX, barY, barW, barH);
  const hpPct = maxHp > 0 ? hp / maxHp : 0;
  ctx.fillStyle = hpPct > 0.5 ? Colors.GREEN : (hpPct > 0.25 ? Colors.GOLD : Colors.RED);
  ctx.fillRect(barX, barY, barW * hpPct, barH);
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barW, barH);
  ctx.fillStyle = Colors.WHITE;
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`HP: ${hp}/${maxHp}`, barX + barW / 2, barY + 12);

  // Stats
  ctx.textAlign = 'left';
  ctx.font = '11px sans-serif';
  let statY = panelY + 55;
  ctx.fillStyle = '#aaa';
  ctx.fillText(`Hand:${character.deck.hand.length} Draw:${character.deck.drawPile.length} Dmg:${dmg}`, infoX + 6, statY);
  statY += 14;
  if (character.shield > 0) {
    ctx.fillStyle = Colors.ALLY_BLUE;
    ctx.fillText(`Shield: ${character.shield}`, infoX + 6, statY);
  }
  if (character.heroism > 0) {
    ctx.fillStyle = Colors.GOLD;
    ctx.fillText(`Heroism: ${character.heroism}`, infoX + 75, statY);
  }
}

function drawCombatLog() {
  const logX = SCREEN_WIDTH - 320;
  const logY = 20;
  const logW = 300;
  const logH = 300;

  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(logX, logY, logW, logH);
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 1;
  ctx.strokeRect(logX, logY, logW, logH);

  ctx.font = '12px sans-serif';
  ctx.textAlign = 'left';
  const maxLines = Math.floor(logH / 16);
  const start = Math.max(0, combatLog.length - maxLines);
  for (let i = start; i < combatLog.length; i++) {
    const entry = combatLog[i];
    ctx.fillStyle = entry.color;
    ctx.fillText(entry.text, logX + 6, logY + 14 + (i - start) * 16);
  }
}

// --- Power rendering ---
const POWER_W = 100;
const POWER_H = 70;

function getPowerRect() {
  // Power card positioned left of hand area
  return { x: 20, y: SCREEN_HEIGHT - CARD_H - 55, w: POWER_W, h: POWER_H };
}

function drawPowerArea() {
  for (let i = 0; i < player.powers.length; i++) {
    const power = player.powers[i];
    const baseRect = getPowerRect();
    const r = { ...baseRect, x: baseRect.x + i * (POWER_W + 6) };
    const hovered = hitTest(mouseX, mouseY, r);
    const art = getPowerArt(power.id);
    const usable = power.canUse() && isPlayerTurn && !powerRechargeMode;

    if (art) {
      const imgAspect = art.width / art.height;
      const cardAspect = r.w / r.h;
      let sx = 0, sy = 0, sw = art.width, sh = art.height;
      if (imgAspect > cardAspect) { sw = art.height * cardAspect; sx = (art.width - sw) / 2; }
      else { sh = art.width / cardAspect; sy = (art.height - sh) / 2; }
      ctx.globalAlpha = power.exhausted ? 0.4 : (hovered ? 1 : 0.85);
      ctx.drawImage(art, sx, sy, sw, sh, r.x, r.y, r.w, r.h);
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = power.exhausted ? '#333' : (usable ? '#5a2a7a' : '#3a1a4a');
      ctx.globalAlpha = hovered ? 1 : 0.85;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.globalAlpha = 1;
    }

    // Name overlay
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(r.x, r.y, r.w, 18);
    ctx.fillStyle = usable ? Colors.GOLD : Colors.GRAY;
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(power.name, r.x + r.w / 2, r.y + 13);

    // Short desc
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(r.x, r.y + r.h - 20, r.w, 20);
    ctx.fillStyle = '#ccc';
    ctx.font = '9px sans-serif';
    ctx.fillText(power.shortDesc.split('\n')[0], r.x + r.w / 2, r.y + r.h - 7);

    // Border
    ctx.strokeStyle = usable ? Colors.GOLD : (power.exhausted ? '#444' : '#666');
    ctx.lineWidth = usable && hovered ? 3 : 1;
    ctx.strokeRect(r.x, r.y, r.w, r.h);

    // Exhausted overlay
    if (power.exhausted) {
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.fillStyle = Colors.GRAY;
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('Zzz', r.x + r.w / 2, r.y + r.h / 2 + 5);
    }
  }
  ctx.textAlign = 'left';
}

// --- Combat click handling ---
function handleCombatClick(x, y) {
  if (!isPlayerTurn) return;

  // Power recharge mode: clicking hand cards to recharge
  if (powerRechargeMode) {
    handlePowerRechargeClick(x, y);
    return;
  }

  // Check power card click
  for (let i = 0; i < player.powers.length; i++) {
    const power = player.powers[i];
    const baseRect = getPowerRect();
    const r = { ...baseRect, x: baseRect.x + i * (POWER_W + 6) };
    if (hitTest(x, y, r)) {
      handlePowerClick(power);
      return;
    }
  }

  // Check End Turn button
  const btnX = SCREEN_WIDTH - 160, btnY = SCREEN_HEIGHT - 180, btnW = 130, btnH = 40;
  if (hitTest(x, y, { x: btnX, y: btnY, w: btnW, h: btnH })) {
    endPlayerTurn();
    return;
  }

  // Check hand cards
  const handRects = getHandCardRects(player.deck.hand);
  for (let i = 0; i < handRects.length; i++) {
    const r = handRects[i];
    if (hitTest(x, y, r)) {
      if (selectedCardIndex === i) {
        const card = player.deck.hand[i];
        if (canPlayWithoutTarget(card)) {
          playCardSelf(i);
        } else {
          selectedCardIndex = -1;
        }
      } else {
        selectedCardIndex = i;
        const card = player.deck.hand[i];
        if (card.isModal) {
          // Modal card: enter mode selection, then target
          modalCard = card;
          modalTarget = null;
          state = GameState.MODAL_SELECT;
        } else if (canPlayWithoutTarget(card)) {
          playCardSelf(i);
        } else if (needsTarget(card)) {
          state = GameState.TARGETING;
        }
      }
      return;
    }
  }

  // Clicked elsewhere — deselect
  selectedCardIndex = -1;
}

function handleTargetingClick(x, y) {
  // Click on enemy panel to target enemy directly
  const enemyPanelRect = { x: 20, y: 20, w: 200, h: 100 };
  if (hitTest(x, y, enemyPanelRect)) {
    playCardOnEnemy(selectedCardIndex);
    return;
  }

  // Click on enemy creatures
  const creatureRects = getEnemyCreatureRects();
  for (let i = 0; i < creatureRects.length; i++) {
    if (hitTest(x, y, creatureRects[i])) {
      playCardOnCreature(selectedCardIndex, enemy.creatures[i]);
      return;
    }
  }

  // ESC or click elsewhere to cancel
  selectedCardIndex = -1;
  state = GameState.COMBAT;
}

let attacksThisTurn = 0; // for sneak_attack scaling

function canPlayWithoutTarget(card) {
  if (card.cardType === CardType.DEFENSE) return true;
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
      if (target instanceof Creature) {
        const actual = target.takeDamage(dmg);
        addLog(`  ${actual} dmg to ${target.name}`, Colors.RED);
        if (!target.isAlive) { addLog(`  ${target.name} destroyed!`, Colors.GOLD); countAndRemoveDeadCreatures(); }
      } else {
        const [blocked, taken] = target.takeDamageWithDefense(dmg);
        if (blocked > 0) addLog(`  (${blocked} blocked)`, Colors.BLUE);
        addLog(`  ${taken} dmg to ${target.name}`, Colors.RED);
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
      addLog(`  +${eff.value} Shield`, Colors.ALLY_BLUE);
      break;
    case 'heal':
      healPlayer(eff.value);
      break;
    case 'draw': {
      const drawn = caster.deck.draw(eff.value, MAX_HAND_SIZE);
      for (const d of drawn) addLog(`  Draw: ${d.name}`, Colors.BLUE);
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
      // Already handled by cost system; extra recharge from hand
      // For simplicity, auto-recharge top card from hand
      if (caster.deck.hand.length > 0) {
        const rechargeCard = caster.deck.hand[caster.deck.hand.length - 1];
        caster.deck.hand.pop();
        caster.deck.drawPile.unshift(rechargeCard);
        addLog(`  Recharged: ${rechargeCard.name}`, Colors.GRAY);
      }
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
function playCardSelf(handIndex) {
  const card = player.deck.hand[handIndex];
  player.deck.playCard(card);
  addLog(`Played: ${card.name}`, Colors.GREEN);

  for (const eff of card.currentEffects) {
    resolveEffect(eff, player, enemy);
  }

  selectedCardIndex = -1;
  state = GameState.COMBAT;
  checkCombatEnd();
}

function playCardOnEnemy(handIndex) {
  const card = player.deck.hand[handIndex];
  player.deck.playCard(card);
  addLog(`Played: ${card.name}`, Colors.GREEN);

  for (const eff of card.currentEffects) {
    resolveEffect(eff, player, enemy);
  }

  selectedCardIndex = -1;
  state = GameState.COMBAT;
  checkCombatEnd();
}

function playCardOnCreature(handIndex, creature) {
  const card = player.deck.hand[handIndex];
  player.deck.playCard(card);
  addLog(`Played: ${card.name} on ${creature.name}`, Colors.GREEN);

  for (const eff of card.currentEffects) {
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
    addLog('Power already used this turn.', Colors.GRAY);
    return;
  }
  if (!power.canUse()) {
    addLog(`Need ${power.rechargeCost} card(s) in hand to use ${power.name}.`, Colors.RED);
    return;
  }

  selectedPower = power;
  if (power.rechargeCost > 0) {
    // Enter recharge mode
    powerRechargeMode = true;
    powerRechargeCardsNeeded = power.rechargeCost;
    powerRechargeCardsSelected = [];
    selectedCardIndex = -1;
    addLog(`${power.name}: Select ${power.rechargeCost} card(s) to recharge.`, Colors.GOLD);
  } else {
    executePower(power);
  }
}

function handlePowerRechargeClick(x, y) {
  // ESC check is in handleKeyDown
  const handRects = getHandCardRects(player.deck.hand);
  for (let i = 0; i < handRects.length; i++) {
    if (hitTest(x, y, handRects[i])) {
      const card = player.deck.hand[i];
      // Remove card from hand and recharge/discard it
      player.deck.hand.splice(i, 1);
      if (selectedPower.costIsDiscard) {
        player.deck.discardPile.push(card);
        addLog(`  Discarded: ${card.name}`, Colors.GRAY);
      } else {
        player.deck.drawPile.unshift(card); // bottom of draw pile
        addLog(`  Recharged: ${card.name}`, Colors.BLUE);
      }
      powerRechargeCardsNeeded--;

      if (powerRechargeCardsNeeded <= 0) {
        powerRechargeMode = false;
        executePower(selectedPower);
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
    player.deck.hand.push(card);
  }
  powerRechargeMode = false;
  powerRechargeCardsNeeded = 0;
  powerRechargeCardsSelected = [];
  selectedPower = null;
  addLog('Power cancelled.', Colors.GRAY);
}

function executePower(power) {
  power.use();
  addLog(`Used power: ${power.name}`, Colors.GOLD);

  switch (power.id) {
    case 'cleave': {
      // Deal 1 damage to up to 2 creatures
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
      // If fewer than 2 creatures, hit enemy with remaining
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
      for (const d of drawn) addLog(`  Draw: ${d.name}`, Colors.BLUE);
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
      for (const d of drawn) addLog(`  Draw: ${d.name}`, Colors.BLUE);
      break;
    }
    case 'battle_fury': {
      player.heroism += 1;
      player.shield += 1;
      addLog(`  +1 Heroism, +1 Shield`, Colors.GOLD);
      const drawn = player.deck.draw(2, MAX_HAND_SIZE);
      for (const d of drawn) addLog(`  Draw: ${d.name}`, Colors.BLUE);
      break;
    }
    case 'feral_form': {
      // Simplified: gain 1 heroism + draw 1 (cat form default)
      player.heroism += 1;
      addLog(`  Feline Form! +1 Heroism`, Colors.GOLD);
      const drawn = player.deck.draw(1, MAX_HAND_SIZE);
      for (const d of drawn) addLog(`  Draw: ${d.name}`, Colors.BLUE);
      break;
    }
    default:
      addLog(`  (Power effect not yet implemented)`, Colors.GRAY);
  }

  selectedPower = null;
  checkCombatEnd();
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
  player.shield = 0; // Shield clears at end of turn
  const drawn = player.deck.endTurn(getPlayerHandSize(), MAX_HAND_SIZE);
  for (const d of drawn) addLog(`  Draw: ${d.name}`, Colors.BLUE);

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
function startEnemyTurn() {
  enemyTurnNumber++;
  addLog('--- Enemy Turn ---', Colors.RED);
  if (survivalRounds > 0) addLog(`  Round ${enemyTurnNumber}/${survivalRounds}`, Colors.GRAY);
  enemy.clearBlock();

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
    } else if (card.cardType === CardType.DEFENSE) {
      enemyActions.push({ type: 'play', card, action: 'defend' });
    } else if (card.cardType === CardType.CREATURE) {
      enemyActions.push({ type: 'play', card, action: 'summon' });
    }
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
    addLog(`${enemy.name} plays ${card.name}`, Colors.RED);
    for (const eff of card.currentEffects) {
      if (eff.effectType === 'damage') {
        let dmg = Math.max(0, eff.value + enemy.heroism + enemy.rage + getDamageModifier(enemy));
        dmg += getIncomingDamageModifier(player);
        dmg = Math.max(0, dmg);
        if (enemy.heroism > 0) enemy.heroism = 0;
        const [blocked, taken] = player.takeDamageWithDefense(dmg);
        if (blocked > 0) addLog(`  (${blocked} blocked)`, Colors.BLUE);
        addLog(`  ${taken} damage to you!`, Colors.RED);
      } else if (eff.effectType === 'unpreventable_damage') {
        player.takeDamageFromDeck(eff.value);
        addLog(`  ${eff.value} true damage to you!`, Colors.RED);
      }
    }
  } else if (action.action === 'defend') {
    addLog(`${enemy.name} plays ${card.name}`, Colors.BLUE);
    for (const eff of card.currentEffects) {
      if (eff.effectType === 'block') {
        enemy.addBlock(eff.value);
        addLog(`  +${eff.value} Block`, Colors.BLUE);
      }
    }
  } else if (action.action === 'summon') {
    addLog(`${enemy.name} plays ${card.name}`, Colors.ORANGE);
    for (const eff of card.currentEffects) {
      if (eff.effectType === 'summon_random') {
        const count = Math.floor(Math.random() * eff.value) + 1;
        // Determine creature type based on card
        const isGuard = card.id === 'guards';
        for (let i = 0; i < count; i++) {
          const creature = isGuard
            ? new Creature({ name: 'Kobold Guard', attack: 2, maxHp: 1 })
            : new Creature({ name: 'Rat', attack: 1, maxHp: 1 });
          enemy.addCreature(creature);
          addLog(`  Summoned ${creature.name}!`, Colors.ORANGE);
        }
      }
    }
  }

  checkCombatEnd();
}

function finishEnemyTurn() {
  // Enemy draws
  const drawn = enemy.deck.endTurn(enemy._handSize || 2, 10);
  for (const d of drawn) addLog(`  ${enemy.name} draws`, Colors.GRAY);

  // Ready creatures
  for (const c of enemy.creatures) c.ready();

  // Creature attacks
  for (const c of enemy.creatures) {
    if (c.isAlive && !c.exhausted) {
      const dmg = c.attack;
      const [blocked, taken] = player.takeDamageWithDefense(dmg);
      addLog(`${c.name} attacks for ${taken}!`, Colors.RED);
      c.exhaust();
    }
  }

  addLog('--- Your Turn ---', Colors.GREEN);
  isPlayerTurn = true;
  player.clearBlock();
  player.readyPowers();
  player.readyCreatures();
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
  countAndRemoveDeadCreatures();
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
      addLog(`Played: ${modalCard.name} (${r.mode.description})`, Colors.GREEN);

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

function handleInventoryClick(x, y) {
  const backBtn = { x: SCREEN_WIDTH - 180, y: SCREEN_HEIGHT - 70, w: 150, h: 50 };
  if (hitTest(x, y, backBtn)) {
    if (restMode) {
      restMode = false;
      if (currentEncounter && !currentEncounter.isComplete) {
        currentEncounter.advancePhase();
        advanceEncounterPhase();
      } else {
        state = GameState.MAP;
      }
    } else {
      state = GameState.MAP;
    }
    return;
  }

  // Click backpack cards to equip (add to deck)
  const bpRects = getBackpackCardRects();
  for (const r of bpRects) {
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
    if (hitTest(x, y, r)) {
      const card = player.deck.masterDeck[r.index];
      if (player.deck.masterDeck.length > 5) { // don't allow removing all cards
        player.deck.masterDeck.splice(r.index, 1);
        backpack.push(card);
        addLog(`Unequipped: ${card.name}`, Colors.GRAY);
      }
      return;
    }
  }
}

function getBackpackCardRects() {
  const cardW = 90, cardH = 126, gap = 8, cols = 6;
  const startX = SCREEN_WIDTH / 2 + 30;
  const startY = 130 - inventoryScrollY;
  return backpack.map((_, i) => ({
    x: startX + (i % cols) * (cardW + gap),
    y: startY + Math.floor(i / cols) * (cardH + 20),
    w: cardW, h: cardH, index: i,
  }));
}

function getDeckCardRects() {
  const cardW = 90, cardH = 126, gap = 8, cols = 6;
  const startX = 30;
  const startY = 130 - inventoryScrollY;
  return player.deck.masterDeck.map((_, i) => ({
    x: startX + (i % cols) * (cardW + gap),
    y: startY + Math.floor(i / cols) * (cardH + 20),
    w: cardW, h: cardH, index: i,
  }));
}

function drawInventory() {
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

  ctx.fillStyle = Colors.GOLD;
  ctx.font = 'bold 32px serif';
  ctx.textAlign = 'center';
  ctx.fillText(restMode ? 'Rest — Rebalance Your Deck' : 'Inventory', SCREEN_WIDTH / 2, 50);

  ctx.fillStyle = Colors.WHITE;
  ctx.font = '16px sans-serif';
  ctx.fillText(`Gold: ${gold}  |  Deck: ${player.deck.masterDeck.length} cards  |  Backpack: ${backpack.length} cards`, SCREEN_WIDTH / 2, 80);

  // Divider
  ctx.strokeStyle = Colors.GRAY;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(SCREEN_WIDTH / 2 + 10, 100);
  ctx.lineTo(SCREEN_WIDTH / 2 + 10, SCREEN_HEIGHT - 90);
  ctx.stroke();

  // Deck label (left)
  ctx.fillStyle = Colors.GREEN;
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Deck (${player.deck.masterDeck.length}) — click to unequip`, 30, 115);

  // Backpack label (right)
  ctx.fillStyle = Colors.ALLY_BLUE;
  ctx.textAlign = 'left';
  ctx.fillText(`Backpack (${backpack.length}) — click to equip`, SCREEN_WIDTH / 2 + 30, 115);

  // Draw deck cards
  const deckRects = getDeckCardRects();
  for (let i = 0; i < player.deck.masterDeck.length; i++) {
    const r = deckRects[i];
    if (r.y > SCREEN_HEIGHT - 90) continue;
    const card = player.deck.masterDeck[i];
    const hov = hitTest(mouseX, mouseY, r);
    drawCard(card, r.x, r.y, r.w, r.h, false, hov);
  }

  // Draw backpack cards
  const bpRects = getBackpackCardRects();
  for (let i = 0; i < backpack.length; i++) {
    const r = bpRects[i];
    if (r.y > SCREEN_HEIGHT - 90) continue;
    const card = backpack[i];
    const hov = hitTest(mouseX, mouseY, r);
    drawCard(card, r.x, r.y, r.w, r.h, false, hov);
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
  ctx.fillText(restMode ? 'Done' : 'Back', backBtn.x + backBtn.w / 2, backBtn.y + backBtn.h / 2);
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';

  // Inventory tooltip
  const allInvRects = [...getDeckCardRects().map((r, i) => ({ ...r, card: player.deck.masterDeck[i] })),
    ...getBackpackCardRects().map((r, i) => ({ ...r, card: backpack[i] }))];
  for (const r of allInvRects) {
    if (r.y > 100 && r.y + r.h < SCREEN_HEIGHT - 80 && hitTest(mouseX, mouseY, r) && r.card) {
      drawTooltipBox(r.card, r.x + r.w + 10, r.y);
      break;
    }
  }
}

// ============================================================
// SAVE / LOAD
// ============================================================

function handleSaveClick(x, y) {
  const rects = getSaveSlotRects();
  for (const r of rects) {
    if (hitTest(x, y, r)) {
      const success = saveToSlot({
        selectedClass, gold, player, currentMap, visitedNodes, backpack,
      }, r.slot);
      if (success) addLog(`Game saved to slot ${r.slot}!`, Colors.GREEN);
      state = GameState.MAP;
      return;
    }
  }
  // Back button
  const backBtn = { x: SCREEN_WIDTH / 2 - 75, y: SCREEN_HEIGHT - 80, w: 150, h: 50 };
  if (hitTest(x, y, backBtn)) { state = GameState.MAP; }
}

function handleLoadClick(x, y) {
  const rects = getSaveSlotRects();
  for (const r of rects) {
    if (hitTest(x, y, r) && r.hasData) {
      const data = loadFromSlot(r.slot);
      if (data) {
        restoreFromSave(data);
        state = GameState.MAP;
      }
      return;
    }
  }
  const backBtn = { x: SCREEN_WIDTH / 2 - 75, y: SCREEN_HEIGHT - 80, w: 150, h: 50 };
  if (hitTest(x, y, backBtn)) {
    state = player ? GameState.MAP : GameState.MENU;
  }
}

function getSaveSlotRects() {
  const slots = ['1', '2', '3'];
  const btnW = 400, btnH = 60, gap = 20;
  const startY = 200;
  const startX = (SCREEN_WIDTH - btnW) / 2;
  return slots.map((slot, i) => ({
    x: startX, y: startY + i * (btnH + gap), w: btnW, h: btnH,
    slot, hasData: hasSave(slot), info: getSaveInfo(slot),
  }));
}

function drawSaveLoad(mode) {
  ctx.fillStyle = '#1a0a2e';
  ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

  ctx.fillStyle = Colors.GOLD;
  ctx.font = 'bold 36px serif';
  ctx.textAlign = 'center';
  ctx.fillText(mode === 'save' ? 'Save Game' : 'Load Game', SCREEN_WIDTH / 2, 100);
  ctx.fillStyle = Colors.GRAY;
  ctx.font = '16px sans-serif';
  ctx.fillText(mode === 'save' ? 'Choose a slot to save' : 'Choose a save to load', SCREEN_WIDTH / 2, 140);

  const rects = getSaveSlotRects();
  for (const r of rects) {
    const hov = hitTest(mouseX, mouseY, r);
    const canClick = mode === 'save' || r.hasData;
    ctx.fillStyle = hov && canClick ? '#4a3a6e' : '#2a1a4e';
    ctx.globalAlpha = canClick ? 1 : 0.5;
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = hov && canClick ? Colors.GOLD : Colors.GRAY;
    ctx.lineWidth = 2;
    ctx.strokeRect(r.x, r.y, r.w, r.h);

    ctx.textAlign = 'left';
    ctx.fillStyle = Colors.WHITE;
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(`Slot ${r.slot}`, r.x + 15, r.y + 25);

    if (r.info) {
      ctx.fillStyle = Colors.GRAY;
      ctx.font = '14px sans-serif';
      ctx.fillText(`${r.info.class} | ${r.info.deckSize} cards | ${r.info.gold} gold | ${r.info.date}`, r.x + 15, r.y + 45);
    } else {
      ctx.fillStyle = '#666';
      ctx.font = '14px sans-serif';
      ctx.fillText('Empty', r.x + 15, r.y + 45);
    }
  }

  // Back button
  const backBtn = { x: SCREEN_WIDTH / 2 - 75, y: SCREEN_HEIGHT - 80, w: 150, h: 50 };
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
  ctx.fillText('Back', backBtn.x + backBtn.w / 2, backBtn.y + backBtn.h / 2);
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
      drawCombat();
      if (state === GameState.MODAL_SELECT) drawModalOverlay();
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
  ctx.globalAlpha = alpha;
  ctx.fillStyle = Colors.GOLD;
  ctx.font = 'bold 48px serif';
  ctx.textAlign = 'center';
  ctx.fillText(titleCardText, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 20);

  if (titleCardSubtitle) {
    ctx.fillStyle = Colors.WHITE;
    ctx.font = '24px serif';
    ctx.fillText(titleCardSubtitle, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 30);
  }

  ctx.fillStyle = Colors.GRAY;
  ctx.font = '14px sans-serif';
  ctx.fillText('Click to continue', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 80);

  ctx.globalAlpha = 1;
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

  // Update fade
  updateFade(dt);

  // Update title card
  updateTitleCard(dt);

  // Update damage numbers
  updateDamageNumbers(dt);

  draw();

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
