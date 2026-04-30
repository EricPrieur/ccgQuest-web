/**
 * Sound system for CCG Quest.
 * Plays .ogg files from public/assets/Sounds/ via Web Audio API.
 * No external libraries needed.
 */

const BASE = import.meta.env.BASE_URL || '/';

let audioCtx = null;
let masterVolume = 0.5;
let soundEnabled = true;

// Music — separate from SFX so the player can mute one without the
// other. Music auto-loops with a small gap between repeats.
let musicEnabled = true;
let musicVolume = 0.4;
let _currentMusicKey = null;     // pack/file currently looping (null = no music wanted)
let _currentMusicSource = null;  // active AudioBufferSourceNode
let _currentMusicGain = null;    // active GainNode (for live volume changes)
let _musicRestartTimer = null;   // setTimeout handle between loops
const MUSIC_LOOP_GAP_MS = 1800;

// Cache decoded AudioBuffers so each file is fetched + decoded once.
const bufferCache = {};
const loadingSet = new Set();

// All available sound files, grouped by pack. Used by the codex Sound tab
// to list every file with a Play button.
export const SOUND_PACKS = {
  UIAudio: [
    'click1','click2','click3','click4','click5',
    'mouseclick1','mouserelease1',
    'rollover1','rollover2','rollover3','rollover4','rollover5','rollover6',
    'switch1','switch2','switch3','switch4','switch5','switch6','switch7','switch8','switch9','switch10',
    'switch11','switch12','switch13','switch14','switch15','switch16','switch17','switch18','switch19','switch20',
    'switch21','switch22','switch23','switch24','switch25','switch26','switch27','switch28','switch29','switch30',
    'switch31','switch32','switch33','switch34','switch35','switch36','switch37','switch38',
  ],
  RpgAudio: [
    'beltHandle1','beltHandle2',
    'bookClose','bookFlip1','bookFlip2','bookFlip3','bookOpen','bookPlace1','bookPlace2','bookPlace3',
    'chop',
    'cloth1','cloth2','cloth3','cloth4','clothBelt','clothBelt2',
    'creak1','creak2','creak3',
    'doorClose_1','doorClose_2','doorClose_3','doorClose_4',
    'doorOpen_1','doorOpen_2',
    'drawKnife1','drawKnife2','drawKnife3',
    'dropLeather',
    'footstep00','footstep01','footstep02','footstep03','footstep04',
    'footstep05','footstep06','footstep07','footstep08','footstep09',
    'handleCoins','handleCoins2',
    'handleSmallLeather','handleSmallLeather2',
    'knifeSlice','knifeSlice2',
    'metalClick','metalLatch','metalPot1','metalPot2','metalPot3',
  ],
  CasinoAudio: [
    'card-fan-1','card-fan-2',
    'card-place-1','card-place-2','card-place-3','card-place-4',
    'card-shove-1','card-shove-2','card-shove-3','card-shove-4',
    'card-shuffle',
    'card-slide-1','card-slide-2','card-slide-3','card-slide-4','card-slide-5','card-slide-6','card-slide-7','card-slide-8',
    'cards-pack-open-1','cards-pack-open-2',
    'cards-pack-take-out-1','cards-pack-take-out-2',
    'chip-lay-1','chip-lay-2','chip-lay-3',
    'chips-collide-1','chips-collide-2','chips-collide-3','chips-collide-4',
    'chips-handle-1','chips-handle-2','chips-handle-3','chips-handle-4','chips-handle-5','chips-handle-6',
    'chips-stack-1','chips-stack-2','chips-stack-3','chips-stack-4','chips-stack-5','chips-stack-6',
    'dice-grab-1','dice-grab-2',
    'dice-shake-1','dice-shake-2','dice-shake-3',
    'dice-throw-1','dice-throw-2','dice-throw-3',
    'die-throw-1','die-throw-2','die-throw-3','die-throw-4',
  ],
  // Epidemic Sound weapon-impact pack — axes, swords, blunts, wooden,
  // metal-on-metal clangs. Auditioned via the codex Sound tab to pick
  // the right "weapon hits enemy" / "blocked by armor" cues.
  Weapons: [
    'armor_light_step_01',
    'arrow_flesh_01','arrow_metal_01',
    'bow_draw_01',
    'axe_heavy_2h_flesh_01','axe_heavy_2h_flesh_02','axe_heavy_2h_flesh_03',
    'axe_light_1h_flesh_01',
    'axe_light_1h_hit_01','axe_light_1h_hit_02','axe_light_1h_hit_03',
    'bat_wooden_hit_01',
    'baton_hit_01',
    'dagger_gore_flesh_01','dagger_stab_01',
    'hammer_small_flesh_01',
    'mace_heavy_flesh_01',
    'rocks_heavy_debris_01','rocks_shatter_01',
    'shield_hit_01','shield_hit_02',
    'spear_stab_flesh_01','spear_throw_flesh_01',
    'sword_axe_heavy_whoosh_impact_01',
    'sword_clang_01','sword_clang_02',
    'sword_heavy_2h_flesh_01','sword_heavy_2h_hit_01',
    'sword_light_1h_flesh_01',
    'sword_rock_wall_01',
    'whip_crack_01',
  ],
  ImpactAudio: [
    'footstep_carpet_000','footstep_carpet_001','footstep_carpet_002','footstep_carpet_003','footstep_carpet_004',
    'footstep_concrete_000','footstep_concrete_001','footstep_concrete_002','footstep_concrete_003','footstep_concrete_004',
    'footstep_grass_000','footstep_grass_001','footstep_grass_002','footstep_grass_003','footstep_grass_004',
    'footstep_snow_000','footstep_snow_001','footstep_snow_002','footstep_snow_003','footstep_snow_004',
    'footstep_wood_000','footstep_wood_001','footstep_wood_002','footstep_wood_003','footstep_wood_004',
    'impactBell_heavy_000','impactBell_heavy_001','impactBell_heavy_002','impactBell_heavy_003','impactBell_heavy_004',
    'impactGeneric_light_000','impactGeneric_light_001','impactGeneric_light_002','impactGeneric_light_003','impactGeneric_light_004',
    'impactGlass_heavy_000','impactGlass_heavy_001','impactGlass_heavy_002','impactGlass_heavy_003','impactGlass_heavy_004',
    'impactGlass_light_000','impactGlass_light_001','impactGlass_light_002','impactGlass_light_003','impactGlass_light_004',
    'impactGlass_medium_000','impactGlass_medium_001','impactGlass_medium_002','impactGlass_medium_003','impactGlass_medium_004',
    'impactMetal_heavy_000','impactMetal_heavy_001','impactMetal_heavy_002','impactMetal_heavy_003','impactMetal_heavy_004',
    'impactMetal_light_000','impactMetal_light_001','impactMetal_light_002','impactMetal_light_003','impactMetal_light_004',
    'impactMetal_medium_000','impactMetal_medium_001','impactMetal_medium_002','impactMetal_medium_003','impactMetal_medium_004',
    'impactMining_000','impactMining_001','impactMining_002','impactMining_003','impactMining_004',
    'impactPlank_medium_000','impactPlank_medium_001','impactPlank_medium_002','impactPlank_medium_003','impactPlank_medium_004',
    'impactPlate_heavy_000','impactPlate_heavy_001','impactPlate_heavy_002','impactPlate_heavy_003','impactPlate_heavy_004',
    'impactPlate_light_000','impactPlate_light_001','impactPlate_light_002','impactPlate_light_003','impactPlate_light_004',
    'impactPlate_medium_000','impactPlate_medium_001','impactPlate_medium_002','impactPlate_medium_003','impactPlate_medium_004',
    'impactPunch_heavy_000','impactPunch_heavy_001','impactPunch_heavy_002','impactPunch_heavy_003','impactPunch_heavy_004',
    'impactPunch_medium_000','impactPunch_medium_001','impactPunch_medium_002','impactPunch_medium_003','impactPunch_medium_004',
    'impactSoft_heavy_000','impactSoft_heavy_001','impactSoft_heavy_002','impactSoft_heavy_003','impactSoft_heavy_004',
    'impactSoft_medium_000','impactSoft_medium_001','impactSoft_medium_002','impactSoft_medium_003','impactSoft_medium_004',
    'impactTin_medium_000','impactTin_medium_001','impactTin_medium_002','impactTin_medium_003','impactTin_medium_004',
    'impactWood_heavy_000','impactWood_heavy_001','impactWood_heavy_002','impactWood_heavy_003','impactWood_heavy_004',
    'impactWood_light_000','impactWood_light_001','impactWood_light_002','impactWood_light_003','impactWood_light_004',
    'impactWood_medium_000','impactWood_medium_001','impactWood_medium_002','impactWood_medium_003','impactWood_medium_004',
  ],
  // Epidemic Sound magic / spell pack — fire, ice, water, wind, dark,
  // angelic buff, shimmers, vanish puffs. Use for spell cards, status
  // applications, and magical loot triggers. Also holds a few
  // armor/shield impact + gore samples that live with the magic
  // assets even though they're physical hits.
  Magic: [
    'buff_angelic_01','buff_angelic_02','buff_angelic_03',
    'buff_powerup_01','buff_powerup_02',
    'cold_whoosh_01',
    'dark_crystals_01','dark_crystals_02',
    'dark_glitch_wood_01','dark_glitch_wood_02',
    'dark_impact_deep_01','dark_impact_deep_02','dark_impact_deep_03','dark_impact_deep_04',
    'dark_slime_gore_01',
    'dark_spell_01',
    'dark_warp_01','dark_warp_02',
    'fire_blast_01',
    'fireball_whoosh_01','fire_spell_01',
    'heal_angelic_01','heal_angelic_02','heal_angelic_03',
    'ice_blast_01',
    'light_buff_01','light_buff_02','light_buff_03',
    'lightning_impact_01',
    'magic_sword_01',
    'potion_use_01','potion_use_02',
    'protection_buff_01',
    'shimmer_buff_02','shimmer_buff_03',
    'shimmer_chime_01',
    'shimmer_glimmer_01',
    'sparkle_spell_01',
    'spell_bright_delayed_01','spell_bright_delayed_02',
    'spell_burst_01','spell_chimes_01',
    'vanish_poof_01',
    'wand_shimmer_01',
    'water_splash_01',
    'wind_blast_01','windy_spell_01',
  ],
  // Monster pack — sounds played by enemy creature attacks. Add new
  // entries here as creatures get bespoke audio (slime squelches,
  // bone-amalgam crunches, dragon roars, etc.).
  Monster: [
    'bones_clatter_01',
    'gore_ooze_01',
    'monster_alien_scream_01',
    'monster_bite_01','monster_bite_02',
    'monster_breath_deep_01',
    'monster_chew_01','monster_chew_02','monster_chew_03','monster_chew_04',
    'monster_chew_rip_01','monster_chew_rip_02','monster_chew_rip_03','monster_chew_rip_04',
    'monster_demon_screech_01',
    'monster_growl_breathy_01',
    'monster_scream_01',
    'monster_snort_01',
    'reptilian_chuff_01',
    'reptilian_hiss_01','reptilian_hiss_02','reptilian_hiss_03',
    'rocks_rolling_01',
    'rodent_squeak_01',
    'spider_scuttle_01',
    'wolf_howl_distant_01',
  ],
  // Music pack — full-length cinematic tracks (loops + phrases).
  // Long-form audio for room/encounter beds, victory swells, etc.
  Music: [
    'ambience_campfire_01',
    'ambience_cave_dripping_01',
    'ambience_cave_water_01',
    'ambience_forest_01',
    'ambience_mountain_creek_01',
    'ambience_mountain_wind_01',
    'ambience_prison_01',
    'ambience_shrine_drone_01',
    'music_ambient_dune_01',
    'music_dark_tension_01',
    'music_eerie_choir_01',
    'music_heroic_01',
    'music_orchestra_piano_01',
    'music_sentimental_01',
    'music_tension_01',
    'music_thriller_brass_01',
  ],
  // Heroes pack — player-character voice grunts and pain cries.
  Heroes: [
    'hero_female_grunt_01','hero_female_grunt_02','hero_female_grunt_03',
    'hero_female_pain_01','hero_female_pain_02','hero_female_pain_03',
    'hero_female_pain_04','hero_female_pain_05','hero_female_pain_06',
    'hero_female_pain_07','hero_female_pain_08','hero_female_pain_09',
    'hero_male_grunt_01','hero_male_grunt_02','hero_male_grunt_03',
    'hero_male_pain_01',
  ],
  // Misc pack — odds and ends that don't fit weapons/magic/monster
  // (food, ambient, etc.).
  Misc: [
    'bear_growl_01',
    'bone_crack_01',
    'bone_skull_crush_01','bone_skull_crush_02',
    'branch_snap_01',
    'ceramic_pot_lid_01',
    'cloth_handle_01',
    'leaf_fall_01',
    'door_unlock_01',
    'eat_popcorn_01',
    'human_scream_01',
    'leather_bag_01',
    'lion_roar_01',
    'male_warrior_hit_01',
    'water_bodyfall_01',
  ],
};

// Game event → sound file mapping. Updated via the codex Sound tab or
// manually here. Keys are game event names, values are "Pack/filename".
// Empty string = no sound wired for that event.
export const SOUND_MAP = {
  click:        'UIAudio/click1',
  card_draw:    'RpgAudio/drawKnife2',
  card_play:    'UIAudio/click1',
  card_shuffle: '',
  damage:       '',
  heal:         '',
  shield:       '',
  block_clothing: 'RpgAudio/cloth2',
  block_light:  'ImpactAudio/impactPlate_heavy_000',
  block_heavy:  'ImpactAudio/impactPlate_heavy_002',
  // Generic "blocked / no damage got through" thud — used when an attack
  // is fully absorbed by shield / armor / block and no specific
  // defense-card sound (cloth/light/heavy) was triggered.
  hit_blocked:  'ImpactAudio/impactPlate_heavy_004',
  // Weapon-specific hit cues. Flesh sounds play when the swing landed
  // for 1+ damage; *_blocked plays when the swing was fully absorbed.
  axe_1h_flesh:   'Weapons/axe_light_1h_flesh_01',
  axe_2h_flesh:   'Weapons/axe_heavy_2h_flesh_01',
  axe_blocked:    'Weapons/axe_light_1h_hit_01',
  sword_1h_flesh: 'Weapons/sword_light_1h_flesh_01',
  sword_2h_flesh: 'Weapons/sword_heavy_2h_flesh_01',
  sword_blocked:  'Weapons/sword_rock_wall_01',
  // Blunts (hammer + mace) — small hammer thwack for 1H, heavy mace
  // crunch for 2H, wooden bat thump for both blocked variants.
  blunt_1h_flesh: 'Weapons/hammer_small_flesh_01',
  blunt_2h_flesh: 'Weapons/mace_heavy_flesh_01',
  blunt_blocked:  'Weapons/bat_wooden_hit_01',
  // Bows + crossbows — flesh on landed shots, metal clang when blocked.
  bow_flesh:      'Weapons/arrow_flesh_01',
  bow_blocked:    'Weapons/arrow_metal_01',
  // Daggers — gore on landed flesh, clean stab when fully blocked.
  dagger_flesh:   'Weapons/dagger_gore_flesh_01',
  dagger_blocked: 'Weapons/dagger_stab_01',
  // Weapons below have no dedicated block sample — playAttackHitSfx
  // falls back to the generic 'hit_blocked' thud when sfx.blocked is
  // absent, so blocked swings still get audible feedback.
  rock_flesh:        'Weapons/rocks_shatter_01',
  boulder_flesh:     'Weapons/rocks_heavy_debris_01',
  whip_flesh:        'Weapons/whip_crack_01',
  staff_flesh:       'Weapons/baton_hit_01',
  spear_flesh:       'Weapons/spear_stab_flesh_01',
  spear_throw_flesh: 'Weapons/spear_throw_flesh_01',
  // Spells. Block sample left unwired so a fully-absorbed magic hit
  // falls back to the generic thud, same pattern as spears/staves.
  missile_flesh: 'Magic/spell_burst_01',
  fire_flesh:    'Magic/fireball_whoosh_01',
  ice_flesh:     'Magic/ice_blast_01',
  // Fires whenever Ice actually lands on any character or creature
  // (player attacks, enemy Icy Breath, blizzard buffs). Not a hit cue.
  ice_apply:     'Magic/cold_whoosh_01',
  // Same idea for Fire — every fresh Fire stack puffs the fireball
  // whoosh. Suppressed when the source card already played fire_flesh
  // (avoid double-up on Fire Burst / Wand of Fire).
  fire_apply:    'Magic/fireball_whoosh_01',
  // Boots-as-weapon (Sturdy Boots) — light leather step.
  boots_flesh:    'Weapons/armor_light_step_01',
  // Shields used as attacks (Zhost's Buckler, Kobold Shield).
  shield_flesh:   'Weapons/shield_hit_02',
  shield_blocked: 'Weapons/shield_hit_01',
  // Ooze creatures (Slime / Pet Slime) attacking + slime split.
  ooze_attack:    'Monster/gore_ooze_01',
  // Bone Wand — eerie crystal twang.
  bone_wand_cast: 'Magic/dark_crystals_01',
  // Plate-on-strap — picking up / equipping a shield for shields-only
  // play (Cracked Buckler etc.).
  shield_grab:    'ImpactAudio/impactPlate_medium_000',
  // Rat / vermin screech (Giant Rat + Dire Rat summon cards) — same
  // squeak fires when a rat fight kicks off (combat-intro splash).
  rat_screech:    'Monster/rodent_squeak_01',
  // Bite from rats (player Tamed Rat creatures, enemy Bite card).
  rat_bite_flesh: 'Monster/monster_chew_01',
  // Big Bite power (Giant Rat / Dire Rat / Bone Pile chunky_bite).
  big_bite:       'Monster/monster_chew_rip_01',
  // Big Bone (enemy 2H club card) — heavy skull crunch.
  big_bone_hit:   'Misc/bone_skull_crush_02',
  // Spider scuttle — Pet Spider summon + every spider creature swing.
  spider_scuttle: 'Monster/spider_scuttle_01',
  // Kobold Warden — louder hiss for fight start / death + the warden's
  // Guards! / Hide in the Corner card plays.
  warden_hiss:    'Monster/reptilian_hiss_01',
  // Generic Kobold creature swing — Guard / Slinger / Dragonshield etc.
  kobold_attack:  'Monster/reptilian_hiss_02',
  // General Zhost — beefier reptilian hiss for the army + boss fights.
  zhost_hiss:     'Monster/reptilian_hiss_03',
  // Wolf creature swing (Wolf Pack fight) — chunky chew shared by flesh
  // and blocked outcomes.
  wolf_attack:    'Monster/monster_chew_02',
  // Wolf Pack — distant pack howl for fight start AND end.
  wolf_howl:      'Monster/wolf_howl_distant_01',
  // Wrath (druid) — leaf-fall on cast for both modal options.
  wrath_cast:     'Misc/leaf_fall_01',
  // Reckless Strike (warrior) — heavier 2H axe variant.
  reckless_axe_hit: 'Weapons/axe_heavy_2h_flesh_02',
  // Heroic Strike (warrior/paladin) — angelic buff swell on cast.
  heroic_strike_cast: 'Magic/buff_angelic_03',
  // Stone Giant — heavy rock tumbling on fight start + death.
  stone_giant_roll: 'Monster/rocks_rolling_01',
  // Bones rattling — fight-intro splash + death rattle for the
  // bone-pile / bone-amalgam family.
  bones_clatter:  'Monster/bones_clatter_01',
  // Battle Fury (warrior power) — guttural battle grunt.
  battle_fury:    'Misc/male_warrior_hit_01',
  // Thorb summon (ally card play) — same warrior shout as Battle Fury.
  thorb_shout:    'Misc/male_warrior_hit_01',
  // Raena summon (ally card play) — female battle yell.
  raena_summon:   'Heroes/hero_female_pain_04',
  // Aimed Shot (ranger power) — bowstring draw before the shot.
  aimed_shot:     'Weapons/bow_draw_01',
  // Druid wild-shape attack cues.
  bear_form_attack: 'Misc/bear_growl_01',
  cat_form_attack:  'Misc/lion_roar_01',
  // Cloth rustle — bandages, scraps.
  cloth_use:        'Misc/cloth_handle_01',
  // Leather bag squish — sacks, pouches.
  bag_use:          'Misc/leather_bag_01',
  // Ceramic pot lid — slime jar / vial of poison "pop the lid".
  jar_use:          'Misc/ceramic_pot_lid_01',
  // Torch ignition — fireball whoosh.
  torch_use:        'Magic/fireball_whoosh_01',
  // Scroll of Potency unfurls — magical sword shimmer.
  scroll_use:       'Magic/magic_sword_01',
  // Arcane Shield + protection buffs (Shield of Faith, Defensive
  // Formation, etc.) — protective buff cast.
  arcane_shield:    'Magic/protection_buff_01',
  // Goodberries (druid ability) — angelic chime when berries are
  // conjured. The eaten Goodberry token plays the eat cue instead.
  goodberries_cast: 'Magic/buff_angelic_01',
  // Card-play "ambient" cues — these fire on play (not on hit), so
  // they don't slot into the flesh/blocked pair. Used by getCardSfx
  // for the third "Play" row in the codex Sounds section.
  eat:            'Misc/eat_popcorn_01',
  drink:          'Magic/potion_use_02',
  heal_spell:     'Magic/heal_angelic_01',
  faery_cast:     'Magic/wand_shimmer_01',
  // Meta / progression cues — fired by UI transitions, not card play.
  level_up_screen: 'Magic/buff_powerup_02',
  perk_pick:       'Magic/buff_powerup_01',
  splash_dive:     'Misc/water_bodyfall_01',
  door_unlock:     'Misc/door_unlock_01',
  // Hero pain cries — class gender → file, damage tier → variant.
  // 1–2 dmg = low, 3–5 = mid, 6+ = high. Male grunts cover low/mid;
  // the loud scream is reserved for high-tier hits.
  hero_male_pain_low:    'Heroes/hero_male_grunt_01',
  hero_male_pain_mid:    'Heroes/hero_male_grunt_02',
  hero_male_pain_high:   'Heroes/hero_male_pain_01',
  hero_female_pain_low:  'Heroes/hero_female_pain_01',
  hero_female_pain_mid:  'Heroes/hero_female_pain_02',
  hero_female_pain_high: 'Heroes/hero_female_pain_03',
  book_open:    'RpgAudio/bookOpen',
  book_close:   'RpgAudio/bookClose',
  gold:         'RpgAudio/handleCoins',
  victory:      '',
  defeat:       '',
  level_up:     '',
  error:        '',
  footstep:     'RpgAudio/footstep09',
  buff:         '',
  fire:         '',
  poison:       '',
};

/** Initialize AudioContext. Call on first user gesture. */
export function initSound() {
  if (audioCtx) return;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  } catch (e) {
    console.warn('Web Audio not available:', e);
    soundEnabled = false;
  }
}

/**
 * Play a sound file by its pack-relative path (e.g. "UIAudio/click1").
 * Loads + decodes on first call, then plays from cache.
 */
export function playSoundFile(packAndFile, volumeScale = 1) {
  if (!soundEnabled || !audioCtx || masterVolume <= 0) return;

  // When the browser suspends the AudioContext (tab switch, background),
  // resume() returns a promise. Schedule the sound to play AFTER the
  // context is running so the first click back isn't silent/muffled.
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().then(() => _playCached(packAndFile, volumeScale));
    return;
  }

  _playCached(packAndFile, volumeScale);
}

function _playCached(packAndFile, volumeScale) {
  const key = packAndFile;
  if (bufferCache[key]) {
    _playBuffer(bufferCache[key], volumeScale, key);
    return;
  }
  if (loadingSet.has(key)) return;
  loadingSet.add(key);

  const url = `${BASE}assets/Sounds/${packAndFile}.ogg`;
  fetch(url)
    .then(r => r.arrayBuffer())
    .then(ab => audioCtx.decodeAudioData(ab))
    .then(buffer => {
      bufferCache[key] = buffer;
      loadingSet.delete(key);
      _playBuffer(buffer, volumeScale, key);
    })
    .catch(() => loadingSet.delete(key));
}

/**
 * Play a named game event sound (looks up SOUND_MAP).
 */
export function playSound(name, volumeScale = 1) {
  const mapped = SOUND_MAP[name];
  if (!mapped) return; // not wired yet
  playSoundFile(mapped, volumeScale);
}

// Active source tracker — keyed by pack/file path. Lets the caller stop
// a long-running track (music) or every running source at once.
const activeSources = new Map(); // path → Set<AudioBufferSourceNode>

function _playBuffer(buffer, volumeScale, key) {
  if (!audioCtx || !buffer) return null;
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  const gain = audioCtx.createGain();
  gain.gain.value = masterVolume * volumeScale;
  source.connect(gain);
  gain.connect(audioCtx.destination);
  // Track this source so stopSoundFile / stopAllSounds can find it.
  if (key) {
    let set = activeSources.get(key);
    if (!set) { set = new Set(); activeSources.set(key, set); }
    set.add(source);
    source.onended = () => {
      set.delete(source);
      if (set.size === 0) activeSources.delete(key);
    };
  }
  source.start(0);
  return source;
}

/**
 * Stop every active source for one packAndFile path. No-op if nothing
 * is currently playing for that path.
 */
export function stopSoundFile(packAndFile) {
  const set = activeSources.get(packAndFile);
  if (!set) return;
  for (const src of set) {
    try { src.stop(0); } catch (_) {}
  }
  activeSources.delete(packAndFile);
}

/**
 * Stop every active source across every path.
 */
export function stopAllSounds() {
  for (const [key, set] of activeSources) {
    for (const src of set) {
      try { src.stop(0); } catch (_) {}
    }
  }
  activeSources.clear();
}

export function setSoundVolume(v) { masterVolume = Math.max(0, Math.min(1, v)); }
export function getSoundVolume() { return masterVolume; }
export function toggleSound() { soundEnabled = !soundEnabled; return soundEnabled; }
export function isSoundEnabled() { return soundEnabled; }

// ============================================================
// MUSIC
// ============================================================

/**
 * Start (or switch to) a looping music track. Stays running until
 * stopMusic() is called or another playMusic() replaces it. When the
 * source finishes a play, we wait MUSIC_LOOP_GAP_MS then restart.
 */
export function playMusic(packAndFile) {
  if (!packAndFile) return;
  // Same track already looping → nothing to do.
  if (_currentMusicKey === packAndFile && _currentMusicSource) return;
  _currentMusicKey = packAndFile;
  _scheduleMusicPlay();
}

function _scheduleMusicPlay() {
  if (!musicEnabled || !audioCtx || !_currentMusicKey) return;
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().then(() => _startMusicNow());
    return;
  }
  _startMusicNow();
}

function _startMusicNow() {
  const key = _currentMusicKey;
  if (!key) return;
  if (bufferCache[key]) {
    _playMusicBuffer(bufferCache[key], key);
    return;
  }
  const url = `${BASE}assets/Sounds/${key}.ogg`;
  fetch(url)
    .then(r => r.arrayBuffer())
    .then(ab => audioCtx.decodeAudioData(ab))
    .then(buffer => {
      bufferCache[key] = buffer;
      // Only play if the same track is still wanted — a stopMusic /
      // playMusic(other) might have happened during the fetch.
      if (_currentMusicKey === key) _playMusicBuffer(buffer, key);
    })
    .catch(() => {});
}

function _playMusicBuffer(buffer, key, fadeInMs = 0) {
  if (!audioCtx) return;
  _stopCurrentMusicSource();
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  const gain = audioCtx.createGain();
  if (_musicPaused) {
    // Started while paused (e.g. loop restart in pause menu) — leave
    // it silent; resumeMusic ramps the gain back up.
    gain.gain.value = 0;
  } else if (fadeInMs > 0) {
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(musicVolume, now + fadeInMs / 1000);
  } else {
    gain.gain.value = musicVolume;
  }
  source.connect(gain);
  gain.connect(audioCtx.destination);
  source.onended = () => {
    // Bail if we've been replaced (stop / track-switch).
    if (_currentMusicSource !== source) return;
    _currentMusicSource = null;
    _currentMusicGain = null;
    if (!musicEnabled || !_currentMusicKey) return;
    _musicRestartTimer = setTimeout(() => {
      _musicRestartTimer = null;
      _scheduleMusicPlay();
    }, MUSIC_LOOP_GAP_MS);
  };
  _currentMusicSource = source;
  _currentMusicGain = gain;
  source.start(0);
}

function _stopCurrentMusicSource() {
  if (_currentMusicSource) {
    try { _currentMusicSource.onended = null; _currentMusicSource.stop(0); } catch (_) {}
    _currentMusicSource = null;
    _currentMusicGain = null;
  }
  if (_musicRestartTimer) {
    clearTimeout(_musicRestartTimer);
    _musicRestartTimer = null;
  }
}

/**
 * Smoothly transition from the currently playing track to a new one.
 * Fades the current source's gain to 0 over `fadeOutMs`, then starts
 * the new track at gain 0 and ramps it up to musicVolume over
 * `fadeInMs`. Idempotent on the same target track. No-op if music is
 * disabled or audio isn't initialized.
 */
export function crossfadeMusic(toKey, fadeOutMs = 1500, fadeInMs = 2500) {
  if (!toKey) return;
  if (_currentMusicKey === toKey && _currentMusicSource) return;
  // Always update the target key — even if music is disabled, so when
  // it's re-enabled later the right track plays.
  _currentMusicKey = toKey;
  if (!audioCtx) return;
  if (_musicRestartTimer) {
    clearTimeout(_musicRestartTimer);
    _musicRestartTimer = null;
  }
  // Fade out the active source, if any.
  const oldSource = _currentMusicSource;
  const oldGain = _currentMusicGain;
  if (oldSource && oldGain) {
    const now = audioCtx.currentTime;
    try {
      oldGain.gain.cancelScheduledValues(now);
      oldGain.gain.setValueAtTime(oldGain.gain.value, now);
      oldGain.gain.linearRampToValueAtTime(0, now + fadeOutMs / 1000);
    } catch (_) {}
    // Suppress the ended-handler so it doesn't auto-restart the OLD
    // track during/after the fade.
    oldSource.onended = null;
    setTimeout(() => {
      try { oldSource.stop(0); } catch (_) {}
      if (_currentMusicSource === oldSource) {
        _currentMusicSource = null;
        _currentMusicGain = null;
      }
    }, fadeOutMs + 80);
  }
  // Start the new track after the fadeOut window.
  setTimeout(() => {
    if (!musicEnabled || !audioCtx) return;
    if (_currentMusicKey !== toKey) return;
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().then(() => _startFadeInTrack(toKey, fadeInMs));
    } else {
      _startFadeInTrack(toKey, fadeInMs);
    }
  }, fadeOutMs);
}

function _startFadeInTrack(key, fadeInMs) {
  if (bufferCache[key]) {
    _playMusicBuffer(bufferCache[key], key, fadeInMs);
    return;
  }
  const url = `${BASE}assets/Sounds/${key}.ogg`;
  fetch(url)
    .then(r => r.arrayBuffer())
    .then(ab => audioCtx.decodeAudioData(ab))
    .then(buffer => {
      bufferCache[key] = buffer;
      if (_currentMusicKey === key) _playMusicBuffer(buffer, key, fadeInMs);
    })
    .catch(() => {});
}

/**
 * Stop the currently looping music. Future playMusic() calls re-arm.
 */
export function stopMusic() {
  _currentMusicKey = null;
  _stopCurrentMusicSource();
}

/**
 * Fade the active music out over fadeOutMs and stop it. Use when
 * leaving a scene without an immediate replacement track.
 */
export function fadeOutMusic(fadeOutMs = 1500) {
  _currentMusicKey = null;
  if (!audioCtx) return;
  if (_musicRestartTimer) {
    clearTimeout(_musicRestartTimer);
    _musicRestartTimer = null;
  }
  const oldSource = _currentMusicSource;
  const oldGain = _currentMusicGain;
  if (!oldSource || !oldGain) return;
  const now = audioCtx.currentTime;
  try {
    oldGain.gain.cancelScheduledValues(now);
    oldGain.gain.setValueAtTime(oldGain.gain.value, now);
    oldGain.gain.linearRampToValueAtTime(0, now + fadeOutMs / 1000);
  } catch (_) {}
  oldSource.onended = null;
  setTimeout(() => {
    try { oldSource.stop(0); } catch (_) {}
    if (_currentMusicSource === oldSource) {
      _currentMusicSource = null;
      _currentMusicGain = null;
    }
  }, fadeOutMs + 80);
}

// Pause-state for the active music — when paused, the source keeps
// playing but the gain is muted to 0. resumeMusic restores it. This
// avoids the precision work of stopping + restarting at an offset.
let _musicPaused = false;

/**
 * Soft-pause the music: mute the active source's gain to 0 (and any
 * future source created while paused). The source keeps running so
 * resumeMusic() returns audio at the same point in the track.
 */
export function pauseMusic() {
  if (_musicPaused) return;
  _musicPaused = true;
  if (_currentMusicGain && audioCtx) {
    const now = audioCtx.currentTime;
    try {
      _currentMusicGain.gain.cancelScheduledValues(now);
      _currentMusicGain.gain.setValueAtTime(_currentMusicGain.gain.value, now);
      _currentMusicGain.gain.linearRampToValueAtTime(0, now + 0.15);
    } catch (_) {}
  }
}

/**
 * Resume previously paused music. Ramps the gain back to musicVolume.
 * No-op if music isn't paused or there's no active source.
 */
export function resumeMusic() {
  if (!_musicPaused) return;
  _musicPaused = false;
  if (_currentMusicGain && audioCtx) {
    const now = audioCtx.currentTime;
    try {
      _currentMusicGain.gain.cancelScheduledValues(now);
      _currentMusicGain.gain.setValueAtTime(0, now);
      _currentMusicGain.gain.linearRampToValueAtTime(musicVolume, now + 0.25);
    } catch (_) {}
  }
}

export function isMusicPaused() { return _musicPaused; }

export function setMusicVolume(v) {
  musicVolume = Math.max(0, Math.min(1, v));
  if (_currentMusicGain) _currentMusicGain.gain.value = musicVolume;
}
export function getMusicVolume() { return musicVolume; }
export function isMusicEnabled() { return musicEnabled; }
export function toggleMusic() {
  musicEnabled = !musicEnabled;
  if (musicEnabled) {
    // Re-start whatever was playing before — or do nothing if no track
    // was ever requested.
    if (_currentMusicKey) _scheduleMusicPlay();
  } else {
    _stopCurrentMusicSource();
  }
  return musicEnabled;
}
