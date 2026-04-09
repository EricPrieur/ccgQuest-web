/**
 * Card ID -> art image filename mapping.
 * Complete mapping from the Python game. Images loaded lazily on first use.
 */
const BASE = import.meta.env.BASE_URL || '/';

export const CARD_ART_MAP = {
  // === Starter / Common Cards ===
  wooden_sword: 'WoodenSword.jpg',
  leather_armor: 'LeatherArmor.jpg',
  scraps: 'ScrapsItem.jpg',
  wooden_axe: 'WoodenAxe.jpg',
  wooden_greatsword: 'WoodenGreatsword.jpg',
  rock_mace: 'RockMace.jpg',
  cracked_buckler: 'CrackedBuckler.jpg',
  short_bow: 'ShortBow.jpg',
  short_staff: 'ShortStaff.jpg',
  small_pouch: 'SmallPouch.jpg',
  bone_dagger: 'BoneDagger.jpg',
  cloth_armor: 'ClothArmor.jpg',
  buckler: 'Buckler.jpg',
  sharp_rock: 'SharpRock.jpg',
  chicken_leg: 'ChickenLeg.jpg',

  // === Paladin ===
  heroic_strike: 'HeroicStrikePaladin.jpg',
  holy_light: 'HolyLightPaladin.jpg',
  shield_of_faith: 'ShieldOfFaithPaladin.jpg',
  flash_heal: 'FlashHeal.jpg',
  consecration: 'Consecration.jpg',
  hammer_of_wrath: 'HammerofWrath.jpg',
  holy_sword: 'HolySword.jpg',
  revivify: 'Revivify.jpg',

  // === Ranger ===
  tamed_rat: 'TamedRatAbility.jpg',
  goodberries: 'GoodberriesAbility.jpg',
  goodberry: 'Goodberryitem.jpg',
  multi_shot: 'MultiShotAbility.jpg',
  careful_strike: 'CarefulStrikeAbility.jpg',
  hunters_mark: 'HunterMark.jpg',
  animal_companion: 'AnimalCompanion.jpg',
  piercing_shot: 'PiercingShot.jpg',
  explosive_shot: 'ExplosiveShot.jpg',

  // === Wizard ===
  fire_burst: 'FireBurst.jpg',
  ice_bolt: 'IceBolt.jpg',
  magic_missiles: 'MagicMissile.jpg',
  arcane_shield: 'ArcaneShield.jpg',
  burning_hands: 'BurningHands.jpg',
  ice_nova: 'FrostNova.jpg',
  ice_block: 'IceBlock.jpg',
  arcane_beam: 'ArcaneBeam.jpg',

  // === Rogue ===
  vial_of_poison: 'VialOfPoison.jpg',
  sneak_attack: 'SneakAttack.jpg',
  pet_spider: 'PetSpider.jpg',
  fan_of_blades: 'FanofBlades.jpg',
  backstab: 'Backstab.jpg',
  poisoned_dagger: 'PoisonedDagger.jpg',
  sprint: 'Sprint.jpg',

  // === Warrior ===
  greater_cleave: 'GreaterCleave.jpg',
  reckless_strike: 'RecklessStrike.jpg',
  shield_bash: 'ShieldBash.jpg',
  thunderclap: 'Thunderclap.jpg',
  shield_wall: 'ShieldWall.jpg',
  battle_shout: 'BattleShout.jpg',
  execute: 'Execute.jpg',
  enraged_strike: 'EnragedStrike.jpg',

  // === Druid ===
  wrath: 'WrathDruid.jpg',
  regrowth: 'RegrowthDruid.jpg',
  feral_swipe: 'FeralSwipe.jpg',
  cat_form_token: 'DruidFelineForm.jpg',
  bear_form_token: 'BearForm.jpg',
  feral_form: 'DruidFeralForm.jpg',
  summon_treants: 'Treant.jpg',
  feral_bite: 'FeralBite.jpg',
  starfire: 'Starfire.jpg',
  healing_touch: 'HealingTouch.jpg',

  // === Enemy Cards - Rat ===
  bite: 'BiteRat.jpg',
  skreeeeeeeek: 'Skreeeeeeeek.jpg',
  tough_hide: 'TougHide.jpg',
  dire_rat_bite: 'BigBite.jpg',
  dire_rat_screech: 'Skreeeeeeeek.jpg',

  // === Enemy Cards - Bone Pile ===
  big_bone: 'BigBone.jpg',
  loose_bone: 'LooseBone.jpg',

  // === Enemy Cards - Slime ===
  slime_appendage: 'SlimeAppendage.jpg',
  corroded_armor: 'CorrodedArmor.jpg',
  partially_digested_bone: 'PartiallyDigestedBone.jpg',

  // === Enemy Cards - Kobold ===
  guards: 'KoboldGuard.jpg',
  hide_in_corner: 'HiddingInCorner.jpg',
  motivational_whip: 'WardensWhip.jpg',
  wardens_whip: 'WardensWhip.jpg',
  kobold_spear: 'KoboldSpear.jpg',
  kobold_shield: 'KoboldShield.jpg',
  spear_throw: 'KoboldSpear.jpg',
  icy_breath: 'IceEffectCard.jpg',
  shield_bash_enemy: 'KoboldShield.jpg',
  defensive_formation: 'DefensiveFormation.jpg',
  drake_rider_charge: 'KoboldDrakeRider.jpg',

  // === Enemy Cards - Stone Giant ===
  stone_giant_smash: 'StoneGiant.jpg',
  large_boulder: 'GiantBoulder.jpg',

  // === Enemy Cards - Spider ===
  poisoned_bite: 'PoisonedBite.jpg',
  web_spider: 'WebSpiderCard.jpg',
  web_token: 'WebSpiderCard.jpg',

  // === Enemy Cards - Sahuagin ===
  trident_throw: 'SahuaginTrident.jpg',
  trident_thrust: 'SahuaginTrident.jpg',
  sahuagin_trident: 'SahuaginTrident.jpg',
  scale_armor: 'ScaleArmor.jpg',
  scale_armor_loot: 'ScaleArmor.jpg',
  fish_scale_boots: 'FishScaleBoots.jpg',
  sahuagin_eye: 'SahuaginEye.jpg',
  blood_in_the_water: 'Shark.jpg',
  whirlpool: 'Whirlpool.jpg',
  sahuagin_priest_staff: 'SahuaginPriestStaff.jpg',
  sahuagin_staff_enemy: 'SahuaginPriestStaff.jpg',
  barnacle_encrusted_plate: 'BarnacleEncrustedPlate.jpg',
  barnacle_encrusted_plate_enemy: 'BarnacleEncrustedPlate.jpg',
  barnacle: 'Barnacle.jpg',

  // === Enemy Cards - Siege / Ogre ===
  pulling_back_the_ram: 'OgreSiegeRam.jpg',
  goblin_rocket_boots: 'GoblinRocketBoots.jpg',
  goblin_sapper_charges: 'GoblinSapperCharges.jpg',
  ogre_maul: 'OgreMaul.jpg',

  // === Enemy Cards - Obsidian ===
  crush: 'ObsidianGolem.jpg',
  rocky_appendage: 'ObsidianSlime.jpg',
  obsidian_slime_card: 'ObsidianSlime.jpg',
  obsidian_rock: 'ObsidianRock.jpg',
  obsidian_edge: 'ObsidianEdge.jpg',
  obsidian_staff: 'ObsidianStaff.jpg',
  obsidian_spear: 'ObsidianSpear.jpg',
  obsidian_core: 'ObsidianCore.jpg',
  obsidian_shard: 'ObsidianShard.jpg',
  obsidian_curse: 'ObsidianCurseShard.jpg',
  obsidian_shard_token: 'ObsidianCurseShard.jpg',
  obsidian_candle: 'ObsidianCandle.jpg',

  // === Enemy Cards - Magma / Volcano ===
  tail_swipe: 'MagmaDrake.jpg',
  fire_breath: 'MagmaDrake.jpg',
  molten_bite: 'MagmaDrake.jpg',
  magma_rock: 'MagmaRock.jpg',
  molten_scale_armor: 'MoltenScale.jpg',
  molten_scale_armor_loot: 'MoltenScaleArmor.jpg',
  magma_mephit_summon: 'MagmaMephit.jpg',
  mephit_skin_sandals: 'MephitSkinSandals.jpg',
  mephit_skin_gloves: 'MephitSkinGloves.jpg',

  // === Enemy Cards - Other ===
  mimic_bite: 'MimicInAntiquity.jpg',
  mimic_tongue: 'MimicTongue.jpg',
  drain_essence: 'DwarvenSpecter.jpg',
  specter_ectoplasm: 'SpecterEctoplasm.jpg',
  soul_ward: 'SoulWard.jpg',
  gravechill_shard: 'GravechillShard.jpg',
  spectral_hand: 'SpectralHand.jpg',
  pummel: 'RugaTheSlaveMaster.jpg',
  rugas_spiked_gauntlets: 'RugasSpikedGauntlets.jpg',

  // === Loot / Shop / Equipment ===
  bone_wand: 'BoneWand.jpg',
  bone_club: 'BoneClub.jpg',
  bone_mace: 'BoneMace.jpg',
  bone_staff: 'BoneStaff.jpg',
  bone_storm: 'BoneStorm.jpg',
  torch: 'Torch.jpg',
  sturdy_boots: 'SturdyBoots.jpg',
  bad_rations: 'BadRations.jpg',
  travel_rations: 'TravelRations.jpg',
  bandages: 'Bandages.jpg',
  travelers_clothing: 'TravelersClothing.jpg',
  steel_axe: 'SteelAxe.jpg',
  steel_mace: 'SteelMace.jpg',
  steel_greataxe: 'SteelGreatAxe.jpg',
  steel_sword: 'SteelSword.jpg',
  bow: 'Bow.jpg',
  greatclub: 'Greatclub.jpg',
  quarterstaff: 'Quarterstaff.jpg',
  sack: 'Sack.jpg',
  studded_leather_armor: 'StuddedLeather.jpg',
  ring_mail: 'RingMail.jpg',
  steel_dagger: 'SteelDagger.jpg',
  scroll_of_potency: 'ScrollOfPotency.jpg',
  minor_healing_potion: 'MinorHealingPotion.jpg',
  wand_of_fire: 'WandOfFire.jpg',
  chain_shirt: 'ChainShirt.jpg',
  lambas_bread: 'LambasBread.jpg',
  slime_jar: 'SlimeInJar.jpg',
  white_wolf_cloak: 'WhiteWolfCloak.jpg',
  wolf_teeth: 'WolfTeeth.jpg',
  lucky_pebble: 'LuckyPebble.jpg',
  cave_shroom: 'CaveShroom.jpg',
  frost_drake_scale: 'FrostDrakeScale.jpg',
  white_claw: 'TheWhiteClawZhostSword.jpg',
  white_claw_reforged: 'TheWhiteClawReforged.jpg',
  white_claw_reforged_loot: 'TheWhiteClawReforged.jpg',
  zhosts_buckler: 'ZhostsBuckler.jpg',
  queens_locket: 'TheQueensLocket.jpg',
  ale: 'Ale.jpg',
  dwarven_crossbow: 'DwarvenCrossbow.jpg',
  dwarven_tower_shield: 'DwarvenTowerShield.jpg',
  dwarven_greaves: 'DwarvenGreaves.jpg',
  dwarven_brew: 'DwarvenBrew.jpg',
  dwarven_warhammer: 'DwarvenWarhammer.jpg',
  ironforge_chainmail: 'IronforgeChainmail.jpg',
  dwarven_throwing_axe: 'DwarvenThrowingAxe.jpg',
  miners_pickaxe: 'MinersPickaxe.jpg',
  runeforged_buckler: 'RuneforgedBuckler.jpg',
  sly_blade: 'Slyblade.jpg',
  shadow_cloak: 'ShadowCloak.jpg',
  kobold_smoke_bomb: 'KoboldSmokeBomb.jpg',
  kobold_lockpick_set: 'KoboldLockpickSet.jpg',

  // === Ally Cards ===
  raena_card: 'RaenaAlly.jpg',
  raena_card_2: 'RaenaAlly.jpg',
  thorb_card: 'ThorbAlly.jpg',
  thorb_card_2: 'ThorbAlly.jpg',
  valdrisa_card: 'ValdrisaEmberforge.jpg',
  pet_slime: 'SlimeSummon.jpg',
  dwarven_scout: 'DwarvenScoutAlly.jpg',
  summon_ancestor: 'DurinStoneheart.jpg',

  // === Tokens / Effects ===
  fire_token: 'FireEffectCard.jpg',
  ice_token: 'IceEffectCard.jpg',
  small_faery: 'SmallFaery.jpg',

  // === Character Class Cards (for portraits) ===
  paladin_class: 'PaladinCharacterLevel1.jpg',
  ranger_class: 'RangerCharacter.jpg',
  wizard_class: 'WizardPortrait.jpg',
  rogue_class: 'RogueCharacter.jpg',
  warrior_class: 'WarriorCharacterCard.jpg',
  druid_class: 'DruidCharacterClass.jpg',

  // === Monster portraits ===
  giant_rat: 'GiantRatMonster.jpg',
  bone_pile_monster: 'BonePile.jpg',
  slime_monster: 'Slime.jpg',
  kobold_warden: 'KoboldWarden.jpg',
  kobold_drake_rider: 'KoboldDrakeRider.jpg',
  kobold_dragonshield: 'KoboldDragonShield.jpg',
  kobold_slinger: 'KoboldSlinger.jpg',
  stone_giant: 'StoneGiant.jpg',
  frost_drake: 'FrostDrake.jpg',
  dire_rat: 'DireRat.jpg',
  mimic: 'MimicInAntiquity.jpg',
  forest_spider: 'DeathjumpSpider.jpg',
  sahuagin_sentinel: 'SahuaginSentinel.jpg',
  sahuagin_priest: 'SahuaginPriest.jpg',
  sahuagin_baron: 'SahuaginBaron.jpg',
  obsidian_golem: 'ObsidianGolem.jpg',
  obsidian_slime: 'ObsidianSlime.jpg',
  magma_drake: 'MagmaDrake.jpg',
  general_zhost: 'GeneralZhost.jpg',
  ruga: 'RugaTheSlaveMaster.jpg',
  skeletal_king: 'SkeletalKing.jpg',
  wolf: 'WolfInSnow.jpg',

  // === Creature summons ===
  restless_bone: 'RestlessBoneSummon.jpg',
  goblin_sapper: 'GoblinSapper.jpg',
  elf_warrior: 'ElfWarrior.jpg',
  piranhas: 'PiranhasSwarm.jpg',
  durin_stoneheart: 'DurinStoneheart.jpg',
  balgrim_ironvein: 'BalgrimIronvein.jpg',
  thordak_ashmantle: 'ThordakAshmantle.jpg',
  misha: 'MishaCompanion.jpg',
  huffer: 'HufferCompanion.jpg',
  treant: 'Treant.jpg',
  magma_mephit: 'MagmaMephit.jpg',
};

export const POWER_ART_MAP = {
  cleave: 'CleaveAbility.jpg',
  aimed_shot: 'AimedShot.jpg',
  elemental_infusion: 'ElementalInfusion.jpg',
  quick_strike: 'QuickStrike.jpg',
  battle_fury: 'BattleFuryPower.jpg',
  feral_form: 'DruidFeralForm.jpg',
  chunky_bite: 'BigBite.jpg',
  armor: 'ArmorPower.jpg',
  split: 'SplitSlime.jpg',
  dire_fury: 'DireFury.jpg',
  wolf_pack: 'WolfPackPower.jpg',
  piranhas_swarm: 'PiranhasSwarm.jpg',
  massive_ogre_ram: 'OgreSiegeRam.jpg',
  goblin_sapper_squad: 'GoblinSapper.jpg',
  obsidian_construct: 'ObsidianGolem.jpg',
  obsidian_body: 'ObsidianSlime.jpg',
  lava_floor: 'MagmaFloor.jpg',
  vanish: 'Vanish.jpg',
};

// Lazy-loading image cache
const imageCache = {};
const loadingSet = new Set();

export function getCardArt(cardId) {
  if (imageCache[cardId]) return imageCache[cardId];
  const filename = CARD_ART_MAP[cardId];
  if (!filename) return null;
  if (loadingSet.has(cardId)) return null;

  loadingSet.add(cardId);
  const img = new Image();
  img.onload = () => {
    imageCache[cardId] = img;
    loadingSet.delete(cardId);
  };
  img.onerror = () => loadingSet.delete(cardId);
  img.src = `${BASE}assets/Cards/${filename}`;
  return null;
}

export function getPowerArt(powerId) {
  const key = `power_${powerId}`;
  if (imageCache[key]) return imageCache[key];
  const filename = POWER_ART_MAP[powerId];
  if (!filename) return null;
  if (loadingSet.has(key)) return null;

  loadingSet.add(key);
  const img = new Image();
  img.onload = () => {
    imageCache[key] = img;
    loadingSet.delete(key);
  };
  img.onerror = () => loadingSet.delete(key);
  img.src = `${BASE}assets/Cards/${filename}`;
  return null;
}
