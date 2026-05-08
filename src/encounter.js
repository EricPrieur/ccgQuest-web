/**
 * Encounter system — text, choices, combat, loot phases.
 */

export const EncounterPhase = Object.freeze({
  TEXT: 'TEXT',
  CHOICE: 'CHOICE',
  COMBAT: 'COMBAT',
  LOOT: 'LOOT',
  COMPLETE: 'COMPLETE',
});

export class EncounterText {
  constructor(text, speaker = '', bgOverride = '') {
    this.text = text;
    this.speaker = speaker;
    this.bgOverride = bgOverride;
  }
}

export class EncounterChoice {
  constructor(text, resultText = '', effectType = '', effectValue = 0, options = {}) {
    this.text = text;
    this.resultText = resultText;
    this.effectType = effectType;
    this.effectValue = effectValue;
    // If true, after resolving this choice return to the same choice screen
    // instead of advancing the encounter. The choice becomes grayed out (Done).
    this.returnToChoices = options.returnToChoices || false;
    // If true, choosing this option completes the encounter and returns to the map.
    this.completesEncounter = options.completesEncounter || false;
    // If true, deactivate the map node after this choice is used.
    this.deactivatesNode = options.deactivatesNode || false;
    // If true, this choice can be picked multiple times (doesn't exhaust on use).
    this.repeatable = options.repeatable || false;
    this.exhausted = false; // set true after use (grayed out)
  }
}

export class EncounterPhaseData {
  constructor({
    phaseType,
    texts = [],
    choices = [],
    enemyId = '',
    lootGold = 0,
    lootGoldDice = null,
    lootCards = [],
    lootTitle = '',
    triggersLevelUp = false,
    levelUpTier = 1,
    choicePrompt = '',
  }) {
    this.phaseType = phaseType;
    this.texts = texts;
    this.choices = choices;
    this.enemyId = enemyId;
    this.lootGold = lootGold;
    this.lootGoldDice = lootGoldDice;
    this.lootCards = lootCards;
    this.lootTitle = lootTitle;
    this.triggersLevelUp = triggersLevelUp;
    this.levelUpTier = levelUpTier;
    this.choicePrompt = choicePrompt;
  }
}

export class Encounter {
  constructor(id, name, description, phases = [], isMainStory = false) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.phases = phases;
    this.currentPhaseIndex = 0;
    this.isMainStory = isMainStory;
  }

  get currentPhase() {
    if (this.currentPhaseIndex >= 0 && this.currentPhaseIndex < this.phases.length) {
      return this.phases[this.currentPhaseIndex];
    }
    return null;
  }

  get isComplete() {
    return this.currentPhaseIndex >= this.phases.length;
  }

  advancePhase() {
    this.currentPhaseIndex++;
    return this.currentPhase;
  }

  reset() {
    this.currentPhaseIndex = 0;
  }
}

// ============================================================
// Encounter Definitions
// ============================================================

export function createGiantRatEncounter() {
  return new Encounter('giant_rat', 'Chapter 1: The Prison', 'Escape the dungeon', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('You were on your way to Qualibaf, a small city nestled in the mountains, when your party was ambushed by Kobolds. They overwhelmed you, bound your hands, and dragged you into the depths of their warren.'),
        new EncounterText('Days have become a blur of darkness and cold stone. You\'ve lost track of how long you\'ve been in this damp prison cell. The only sounds are the dripping of water and the occasional scurrying in the shadows.'),
        new EncounterText('Something wet touches your foot. Then pain - sharp, sudden. You jerk awake to find beady eyes gleaming in the darkness.'),
        new EncounterText('RATS! And one of them is enormous!', '!'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.COMBAT,
      enemyId: 'giant_rat',
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The giant rat lets out a final squeak and scurries away into the darkness, its smaller companions following close behind.'),
        new EncounterText('In the chaos of the fight, your hands found something on the ground - a sharp rock, its edge honed by years of water erosion. It\'s not much, but it\'s the first weapon you\'ve had since your capture.'),
        new EncounterText('You gained a new card: Sharp Rock!', '!'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.LOOT,
      lootGoldDice: [1, 6],
      lootCards: ['sharp_rock'],
    }),
  ], true);
}

export function createLockedDoorEncounter() {
  return new Encounter('locked_door', 'The Door', 'A heavy iron door blocks your path', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('With the rats scattered, you take stock of your surroundings. The cell is little more than a hole carved into the rock, damp and reeking of mildew. A heavy iron door stands between you and freedom, its rusted hinges groaning as you press against it. Locked, of course.'),
        new EncounterText('Beyond the door, you hear sounds that chill your blood. Screams echo through the corridors - some human, some... not. Shadows flicker past the narrow gap beneath the door, cast by torchlight that wavers and dances.'),
        new EncounterText('You examine the lock more closely. It\'s a crude mechanism, probably Kobold-made, but without proper tools your chances of picking it are slim.'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.CHOICE,
      choices: [
        new EncounterChoice(
          'Try to pick the lock with the sharp rock',
          'You scrape and prod at the mechanism, but without proper tools it\'s hopeless. The rock slips, and you slice your finger on the rusted metal. Blood drips onto the cold stone floor.',
          'damage', 1,
          { returnToChoices: true, deactivatesNode: true }
        ),
        new EncounterChoice(
          'Step back and wait',
          'You take a deep breath and step away from the door. Patience. There will be another way. There has to be.',
          '', 0,
          { completesEncounter: true }
        ),
      ],
    }),
  ], true);
}

export function createBonePileEncounter() {
  return new Encounter('bone_pile', 'Bone Pile', 'An ominous pile of bones...', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('You come across a pile of old bones.'),
        new EncounterText('They look ancient, bleached by time...'),
        new EncounterText('Suddenly, the bones begin to rattle!'),
        new EncounterText('They assemble into a SKELETON!', '!'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.COMBAT,
      enemyId: 'bone_pile',
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The skeleton crumbles to dust.'),
        new EncounterText('Among the remains, you find something useful.'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.LOOT,
      lootGoldDice: [1, 6],
      lootCards: ['bone_pile_loot'],
    }),
  ]);
}

export function createCrackEncounter() {
  return new Encounter('crack', 'The Crack', 'A narrow crack in the floor', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('You kneel beside the crack in the floor where the skeleton once lay. The gap is narrow, barely wide enough for a person to squeeze through.'),
        new EncounterText('Pressing your face close, you feel a faint draft rising from below. It smells of damp and something else... something foul. But it might be a way out.'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.CHOICE,
      choices: [
        new EncounterChoice(
          'Try to squeeze through the crack',
          'You spend what feels like hours digging at the edges. Finally, the gap is just wide enough. You lower yourself down... and then you slip. You plunge into cold, foul water. You\'re in the sewers.',
          'fall_to_sewers', 1
        ),
        new EncounterChoice(
          'Leave it alone and go back',
          'You step back from the crack. It\'s too risky without knowing what\'s below.',
          '', 0
        ),
      ],
    }),
  ]);
}

export function createSplashPointEncounter() {
  return new Encounter('splash_point', 'Splash Point', 'You fall into the sewers', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('You hit the water hard, the impact driving the air from your lungs. The current drags you along a stone channel before depositing you in a shallow pool.'),
        new EncounterText('Coughing and sputtering, you haul yourself onto a narrow ledge. The stench is overwhelming — centuries of filth have seeped into these tunnels. Foul water stretches in every direction.'),
        new EncounterText('As your eyes adjust to the gloom, you can make out two passages leading away from this chamber. Faint light glimmers down one; the other is pitch black.'),
      ],
    }),
  ]);
}

export function createDeadEndEncounter() {
  return new Encounter('dead_end', 'Dead End', 'A gate blocks the way out', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The passage opens into a small chamber. Rusted iron bars form a gate set into the far wall, and beyond it you can see a sliver of sky.'),
        new EncounterText('Fresh air filters through the bars — the first clean breath you\'ve drawn in days. Freedom is tantalizingly close.'),
        new EncounterText('You grip the bars and pull, but the gate is locked tight. A heavy padlock secures the latch, far too sturdy to break with your bare hands.'),
        new EncounterText('A wet, gurgling sound echoes behind you. Something oozes from the drain — a SLIME!', '!'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.COMBAT,
      enemyId: 'slime',
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The slime dissolves into a harmless puddle, leaving behind a faint acidic smell.'),
        new EncounterText('The gate remains locked, but at least the path behind you is clear again.'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.LOOT,
      lootGoldDice: [1, 6],
      lootCards: ['slime_loot'],
    }),
  ]);
}

export function createTightOpeningEncounter() {
  return new Encounter('tight_opening', 'Tight Opening', 'A narrow gap in the wall', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The tunnel narrows until the walls nearly touch. A gap barely wide enough for a person leads onward, darkness pressing in from all sides.'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.CHOICE,
      choices: [
        new EncounterChoice(
          'Try to squeeze through',
          '',
          'try_squeeze', 1,
          { returnToChoices: true, repeatable: true }
        ),
        new EncounterChoice(
          'Leave for now',
          'You back away from the gap. No sense getting stuck in the dark.',
          '', 0,
          { completesEncounter: true }
        ),
      ],
    }),
  ]);
}

export function createLostShrineEncounter() {
  return new Encounter('lost_shrine', 'Lost Shrine', 'A forgotten place of worship', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('Tucked into an alcove off the main tunnel, you discover a small shrine. It must have been here long before the Kobolds claimed these tunnels.'),
        new EncounterText('A warm golden light radiates from a cracked stone altar, casting soft shadows across the walls. The air here feels different — clean, almost peaceful.'),
        new EncounterText('Ancient symbols are carved into the altar\'s surface. You can\'t read them, but they pulse faintly with each beat of your heart.'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.CHOICE,
      choices: [
        new EncounterChoice(
          'Pray at the Shrine',
          'You kneel before the altar and bow your head. Warmth floods through you, and the altar bestows a lost technique — a gift from whoever once tended this place.',
          'shrine_ability_card', 1,
          { completesEncounter: true }
        ),
        new EncounterChoice(
          'Leave for now',
          'You step away from the shrine, its golden glow fading behind you as you return to the tunnels.',
          '', 0,
          { completesEncounter: true }
        ),
      ],
    }),
  ]);
}

export function createSewerJunctionEncounter() {
  return new Encounter('sewer_junction', 'Sewer Junction', 'A crossroads in the sewers', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('Three tunnels converge at a wide circular chamber. Channels of murky water flow beneath grated walkways, merging into a central drain.'),
        new EncounterText('Strange bioluminescent fungi cling to the ceiling, casting an eerie blue-green glow over the stonework. They pulse slowly, almost like breathing.'),
        new EncounterText('Two of the passages seem passable. Before you can choose, the water in the central drain begins to bubble and churn.'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.COMBAT,
      enemyId: 'slime',
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The slime bursts apart, spattering the walls with harmless residue.'),
        new EncounterText('With the creature gone, both passages ahead are clear. The fungi overhead continue their slow, rhythmic glow.'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.LOOT,
      lootGoldDice: [1, 6],
      lootCards: ['slime_loot'],
    }),
  ]);
}

export function createAbandonedCampEncounter() {
  return new Encounter('abandoned_camp', 'Abandoned Camp', 'Someone sheltered here once', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('You stumble upon what looks like an old campsite tucked into a dry alcove. The remains of a small fire sit in a ring of stones, long cold.'),
        new EncounterText('A tattered bedroll is spread against one wall, and a few meager supplies — a waterskin, some dried rations, a stub of candle — are piled nearby. Whoever camped here left in a hurry.'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.CHOICE,
      choices: [
        new EncounterChoice(
          'Take a short rest',
          'You sink onto the bedroll and close your eyes, just for a moment. When you wake, you feel a little stronger.',
          'short_rest', 5,
          { returnToChoices: true }
        ),
        new EncounterChoice(
          'Search the camp',
          'You rummage through the supplies, checking every pocket and fold. There might be something useful hidden here.',
          'search_camp', 1,
          { returnToChoices: true }
        ),
        new EncounterChoice(
          'Leave',
          'You leave the camp. Whoever left these things behind may yet return for them.',
          '', 0,
          { completesEncounter: true }
        ),
      ],
    }),
  ]);
}

export function createUpwardPassageEncounter() {
  return new Encounter('upward_passage', 'Upward Passage', 'A tunnel sloping upward', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The tunnel begins to slope upward, the sewer muck giving way to dry, packed earth. You must be climbing back toward the surface.'),
        new EncounterText('Warm air drifts down from above, carrying with it an unmistakable smell — cooked meat, spices, woodsmoke. Someone is cooking up there.'),
        new EncounterText('You hear the clatter of pots and a guttural voice humming an off-key tune. The sound echoes down from a rough-hewn opening above your head.'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.CHOICE,
      choices: [
        new EncounterChoice(
          'Try to climb up',
          'You find handholds in the rough stone and pull yourself upward, emerging through a trapdoor into a wave of heat and steam.',
          'move_to_kitchen', 1
        ),
        new EncounterChoice(
          'Stay down',
          'You back away from the opening. Better to find another route than walk into a Kobold kitchen.',
          'upward_stay_down', 0
        ),
      ],
    }),
  ]);
}

export function createKitchenEncounter() {
  return new Encounter('kitchen', 'The Kitchen', 'A busy Kobold kitchen', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      // Intro text matches the Python game verbatim.
      texts: [
        new EncounterText('You are in the corner of a large stone kitchen, tucked behind crates in a private area near the grate you climbed through. Copper pots hang from hooks on the ceiling. A massive fireplace dominates one wall, its flames casting dancing shadows across the room.'),
        new EncounterText('There is a small reptilian creature... cooking? And singing. Scaled green skin, a long snout, and small horns curling back from its brow. It wears a stained apron and hums tunelessly as it chops what appears to be a very large chicken. Tables in disarray surround it, covered with discarded food scraps and strange ingredients.'),
        new EncounterText('The creature hasn\'t noticed you yet. A doorway leads out of the kitchen on the far side. What do you do?', '!'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.CHOICE,
      choices: [
        new EncounterChoice(
          'Attack the Cook',
          'You lunge at the creature! It shrieks in terror, grabs a heavy pot and hurls it at your head. The pot connects with a painful CLANG before the cook scrambles away through a back passage, screaming continuously in its strange language. The kitchen is yours, but your head is ringing. You make your way through the doorway.',
          'kitchen_attack', 1
        ),
        new EncounterChoice(
          'Try to talk to the Cook',
          'You clear your throat softly. The creature spins around, eyes wide, cleaver raised — then slowly lowers it as you raise your hands. You try humming along with its song. The creature\'s eyes light up. It seems appeased and no longer sees you as a threat. It points to the table where a big chicken leg sits, still warm, and motions for you to take it and eat.',
          'kitchen_talk', 1
        ),
        new EncounterChoice(
          'Try to sneak out of the kitchen',
          'You crouch low and creep along the wall, keeping to the shadows. The cook continues humming and chopping, completely distracted by its work. You slip through the doorway on the far side without being noticed.',
          'kitchen_sneak', 1
        ),
        new EncounterChoice(
          'Leave',
          'You quietly back away and return the way you came.',
          'kitchen_leave', 0
        ),
      ],
    }),
  ]);
}

export function createPrisonEntranceEncounter() {
  return new Encounter('prison_entrance', 'Prison Entrance', 'The main prison corridor', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The passage widens into a torchlit corridor. Iron-barred cells line both walls, most empty, some containing huddled shapes that don\'t look up as you pass.'),
        new EncounterText('Two Kobold guards stand at the far end, flanking a heavy wooden door. One carries a whip coiled at its belt; the other rattles a ring of keys. They spot you and snarl.'),
        new EncounterText('Behind them, a barrel overflows with confiscated weapons. Your weapons might be in there — if you can get past the guards.'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.CHOICE,
      choicePrompt: 'The guards bar the way. What do you do?',
      choices: [
        new EncounterChoice(
          'Attack the Guards',
          'You charge, weapon raised.',
          'prison_fight', 0,
        ),
        // Snatch result text is filled in by resolvePrisonSnatch at click
        // time, based on whether the roll succeeds or fails.
        new EncounterChoice(
          'Try to snatch a weapon from the barrel',
          '',
          'prison_snatch', 0,
        ),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.COMBAT,
      enemyId: 'prison_guards',
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The warden collapses with a groan. You snatch the whip from its belt and the key ring from the floor. You obtained the Warden\'s Whip and a Prison Key!', '!'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.LOOT,
      lootGoldDice: [2, 6],
      // Two drops: the guaranteed Warden's Whip + one roll from the
      // prison-warden loot table (matches PY's
      // `lootCards=["wardens_whip", "prison_warden_loot"]`).
      lootCards: ['wardens_whip', 'prison_warden_loot'],
    }),
    // Post-combat barrel choice — resolved via `loot_barrel` effect. Skipped
    // entirely if the barrel was already looted via the sneak/talk pre-fight
    // snatch (see prison_snatch handler in main.js).
    new EncounterPhaseData({
      phaseType: EncounterPhase.CHOICE,
      choicePrompt: 'A barrel of confiscated gear sits by the door.',
      choices: [
        // Rummage result text is filled in by resolveLootBarrel at click time.
        new EncounterChoice(
          'Rummage through the gear barrel',
          '',
          'loot_barrel', 0,
          { completesEncounter: true },
        ),
        new EncounterChoice(
          'Leave it',
          'You step past the barrel and continue on.',
          '', 0,
          { completesEncounter: true },
        ),
      ],
    }),
  ]);
}

// Leave Prison — two variants depending on whether Thorb has been rescued
// (mirrors the Python game's `create_leave_prison_encounter(thorb_rescued)`).
// The flag is derived at instantiation time from `corner_cell.isDone` by
// the ENCOUNTER_REGISTRY wrapper below.
export function createLeavePrisonEncounter(thorbRescued = false) {
  if (!thorbRescued) {
    // Blocked exit: TEXT-only, no choice. Clicking through the last text
    // auto-returns to the map. The node IS marked done (standard encounter
    // completion flow), but `leave_prison` is set to canRevisit=true on
    // the map node so clicking it re-runs the encounter — which re-checks
    // thorbRescued each time, so after you free Thorb the normal flow runs.
    return new Encounter('leave_prison', 'Prison Exit', 'A door leading outside', [
      new EncounterPhaseData({
        phaseType: EncounterPhase.TEXT,
        texts: [
          new EncounterText('You stand before the heavy wooden door. Through the gap, you can see daylight streaming in. Freedom is right there.'),
          new EncounterText('But as you reach for the lock, you hear it — faint, echoing from deeper in the prison. Shouting. The clash of metal. Someone is fighting for their life down there.'),
          new EncounterText('You recognize that voice. Gruff, stubborn, unmistakably dwarven. One of your companions from the caravan is still alive in these cells.', '!'),
          new EncounterText('You pocket the key. There\'s no way you\'re leaving someone behind in this place. Not when you can still do something about it.'),
        ],
      }),
    ]);
  }

  // Thorb rescued — normal exit flow leading into the chapter-end transition.
  return new Encounter('leave_prison', 'Prison Exit', 'A door leading outside', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('You stand before the heavy wooden door. Through the gap, you can see daylight streaming in. The Prison Key feels heavy in your hand.'),
        new EncounterText('Beyond this door lies freedom — but also the unknown. You\'ve survived the prison, but what awaits outside?', '!'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.CHOICE,
      choices: [
        new EncounterChoice(
          'Use the Prison Key and leave',
          'The key turns with a satisfying click. The door groans open, and warm sunlight floods in. You step outside, breathing fresh air for the first time in what feels like an eternity.',
          'leave_prison', 1
        ),
        new EncounterChoice(
          'Not yet',
          'You pocket the key. There might still be things to do here.',
          '', 0
        ),
      ],
    }),
  ]);
}

export function createPrisonWingEncounter() {
  return new Encounter('prison_wing', 'Prison Wing', 'A corridor of locked cells', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('You follow a side corridor deeper into the prison wing. Cells stretch along both sides, their iron doors sealed with heavy locks.'),
        new EncounterText('The warden\'s key fits each lock with a satisfying click. Most cells are empty, but signs of recent habitation — scratched tallies, torn cloth — tell a grim story.'),
        new EncounterText('From the far end of the corridor, you hear a familiar voice shouting curses, punctuated by the squealing of something large and angry.'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.CHOICE,
      choices: [
        new EncounterChoice(
          'Investigate the sounds',
          'You rush toward the commotion, key at the ready. The noise grows louder with every step.',
          'investigate_prison_wing', 1
        ),
        new EncounterChoice(
          'Turn back',
          'You hesitate. Whatever is happening down there, it sounds dangerous. You retreat to the main corridor.',
          'prison_wing_turn_back', 0
        ),
      ],
    }),
  ]);
}

export function createCornerCellEncounter() {
  return new Encounter('corner_cell', 'Corner Cell', 'A cell at the end of the wing', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('You round the corner to find the last cell in the wing. The door hangs ajar, its lock shattered from the inside.'),
        new EncounterText('Inside, a stocky dwarf with a braided beard is locked in a desperate struggle with an enormous rat — easily twice the size of the one you faced in your own cell. The dwarf has it by the scruff, but it\'s thrashing wildly.'),
        new EncounterText('"About time ye showed up! Don\'t just stand there — HELP ME!"', 'Thorb'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.COMBAT,
      enemyId: 'dire_rat',
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The dire rat lets out a hideous shriek and collapses, twitching once before going still.'),
        new EncounterText('The dwarf dusts off his hands and fixes you with a gap-toothed grin.'),
        new EncounterText('"Name\'s Thorb. I\'d buy ye an ale if we weren\'t stuck in this blasted hole. Ye got me out of a tight spot — I won\'t forget it."', 'Thorb'),
        new EncounterText('"Right then. Wherever ye\'re headed, I\'m comin\' with ye. Lead on!"', 'Thorb'),
        new EncounterText('Thorb joins your party! He\'ll fight alongside you in future battles.', '!'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.LOOT,
      lootGoldDice: [1, 6],
      lootCards: ['thorb_card'],
    }),
  ]);
}

// ============================================================
// Mountain Path Encounters
// ============================================================

export function createMountainCampEncounter() {
  return new Encounter('mountain_camp', 'Mountain Camp', 'Chapter 2: The Mountain Path', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('You wake to grey dawn, body aching from cold stone. The campfire has burned to embers. You\'re free of the prison, but the mountains stretch endlessly in every direction.'),
        new EncounterText('"Oi. Get up. We\'ve got company," Thorb growls, already on his feet with his weapon drawn. He nods toward the trail below.', 'Thorb'),
        new EncounterText('A Kobold patrol picks its way along the rocks - pale-scaled, shields bearing the sigil of the White Claw clan. One stops, sniffing the air. It turns toward your camp, eyes narrowing. They\'ve spotted you.', '!'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.COMBAT,
      enemyId: 'kobold_patrol',
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.LOOT,
      lootGoldDice: [2, 6],
      lootCards: ['kobold_patrol_loot'],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The last Kobold falls. You catch your breath among the bodies. The White Claw clan - they control these mountain passes.'),
        new EncounterText('"We can\'t take the main road down," Thorb mutters, wiping his blade. "These wretches\'ll have scouts everywhere. Give me a moment - I know these mountains. I\'ll find us a way through."', 'Thorb'),
      ],
    }),
  ], true);
}

export function createMountainPassEncounter() {
  // Mirrors the Python Mountain Pass encounter: rockslide buff choice
  // → text → Stone Giant survival fight → loot → escape narrative.
  return new Encounter('mountain_pass', 'Mountain Pass', 'A treacherous mountain path', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('You continue down the mountain, picking your way carefully along the narrow trail. The day wears on and you keep to the shadows, wary of more Kobold patrols. Twice you spot pale-scaled figures in the distance and press yourself against the rocks until they pass.'),
        new EncounterText('A deep rumbling echoes through the peaks above. At first you mistake it for thunder, but the sky is clear. Giant shadows sweep across the mountainside — something enormous is moving up there, dislodging stone and debris as it goes.'),
        new EncounterText('Then you see them. Boulders, tumbling down the slope toward you. Small ones at first, skipping off the rocks, then larger ones that shake the ground with each impact. The path ahead is about to become very dangerous.', '!'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.CHOICE,
      choices: [
        new EncounterChoice(
          'Run for it!',
          'You sprint down the trail, legs pumping, rocks crashing around you. A boulder clips your shoulder and sends you stumbling, but you keep your footing. Heart hammering, you burst through the worst of it and throw yourself behind an outcrop. Bruised but alive.',
          'boulder_run', 1
        ),
        new EncounterChoice(
          'Take cover behind the rocks',
          'You dive for cover, flattening yourself into a small alcove where the rock wall curves inward. Boulders thunder past, bouncing over your sheltered position. Dust and gravel rain down, but the worst of it sails harmlessly overhead. A solid strategy.',
          'boulder_shelter', 1
        ),
        new EncounterChoice(
          'Methodically navigate your way through',
          'You watch the pattern of the falling rocks, timing your movements between impacts. Step, pause, dash, wait. It\'s nerve-wracking but effective. You weave through the rockslide with calculated precision, emerging on the other side without a scratch. Your focus is sharp.',
          'boulder_navigate', 1
        ),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('As the dust settles, you hear heavy footsteps shaking the ground. A massive figure emerges from behind the rocks — a Stone Giant, its body carved from living granite, eyes glowing like molten rock.'),
        new EncounterText('Thorb goes pale — a rare sight for a dwarf. "Stone Giant," he whispers. "Mortal enemies of the Mountain Dwarves. Killed me grandfather. Killed his grandfather too." He swallows hard. "We need to run. Now."', 'Thorb'),
        new EncounterText('The giant turns its gaze upon you, hefting a boulder in one enormous hand like a weapon.', '!'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.COMBAT,
      enemyId: 'stone_giant',
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.LOOT,
      lootGoldDice: [2, 6],
      lootCards: ['stone_giant_loot'],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('You scramble down the trail as fast as your legs will carry you. The giant\'s thunderous footsteps shake the mountain behind you, but you don\'t look back. You just run.'),
        new EncounterText('"Don\'t stop!" Thorb gasps, stumbling over loose rocks. "Those things don\'t tire. Just keep movin\'!"', 'Thorb'),
        new EncounterText('The rumbling finally fades. You collapse behind a rocky outcrop, gasping. The giant seems content to let you go — you\'ve left its territory. The mountain path continues downward.', '!'),
      ],
    }),
  ]);
}

export function createCalmStreamEncounter() {
  // Mirrors Python create_calm_stream_encounter exactly: the intro narrative,
  // then 4 independent choices that persist between visits (each can be used
  // once per run). Choice handlers in main.js consume them by id.
  return new Encounter('calm_stream', 'Calm Stream', 'A sheltered hollow with a gentle stream', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The path winds down through a grove of ancient trees, their branches draped with soft moss that glows faintly in the dappled light. You hear the gentle murmur of water before you see it - a crystal-clear stream winding through a sheltered hollow.'),
        new EncounterText('The air here feels different. Lighter. Tiny motes of golden light drift lazily through the glade, and wildflowers in impossible colors line the banks. The water itself seems to shimmer with an inner radiance, as though touched by something ancient and kind.'),
        new EncounterText('This place feels safe. Whatever magic lingers here, it means you no harm.', '!'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.CHOICE,
      choices: [
        new EncounterChoice(
          'Drink from the stream',
          'You cup your hands and drink deeply from the stream. The water is impossibly cool and sweet, and warmth spreads through your body as you swallow. Your aches fade and your breathing steadies.',
          'stream_drink', 1, { returnToChoices: true },
        ),
        new EncounterChoice(
          'Search for food along the banks',
          'You forage along the stream banks, pushing aside the luminous wildflowers. Hidden among the roots and moss, you find clusters of plump, glowing berries — Goodberries, gifts of the forest.',
          'stream_search', 1, { returnToChoices: true },
        ),
        new EncounterChoice(
          'Bathe in the stream',
          'You wade into the stream and let the enchanted water wash over you. As you float in the gentle current, you notice a tiny figure watching you from a nearby flower — a Small Faery, no bigger than your thumb, with iridescent wings and curious eyes. It flutters down and lands on your shoulder, chirping softly.',
          'stream_bathe', 1, { returnToChoices: true },
        ),
        new EncounterChoice(
          'Continue on your way',
          'You leave the enchanted hollow behind, feeling refreshed just from the peaceful atmosphere.',
          '', 0,
        ),
      ],
    }),
  ]);
}

export function createGeneralZhostEncounter() {
  // Mirrors Python create_general_zhost_encounter exactly: intro, army fight
  // (kill 20), loot, transition text, boss fight, boss loot, epilogue.
  return new Encounter('general_zhost', "General Zhost's Army", 'A Kobold army camps near the river crossing', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('You follow the road east, staying out of sight. The bridge to Qualibaf comes into view but something is terribly wrong - there\'s a gaping hole in the middle of it, smoke still rising from the rubble. Kobolds swarm across the wreckage like ants.'),
        new EncounterText('Desperate cries ring out from a nearby clearing. Through the trees you see Elf Combatants surrounded by hundreds of Kobolds, fighting for their lives.'),
        new EncounterText('"Elves," Thorb spits. "Not me favorite folk. But even I can\'t stand by and watch \'em get slaughtered by kobold scum."', 'Thorb'),
        new EncounterText('Patrols close in from all directions - there\'s no choice but to fight. In the chaos, you spot the biggest Kobold you\'ve ever seen on the back line, barking orders. He will pay!', '!'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.COMBAT,
      enemyId: 'general_zhost',
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.LOOT,
      lootGoldDice: [2, 6],
      lootCards: ['kobold_patrol_loot'],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('Dozens of Kobolds lie broken around you. Through the carnage, a path opens toward the massive general on the back line. His eyes widen as you lock gazes. It\'s time to finish this!', '!'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.COMBAT,
      enemyId: 'general_zhost_boss',
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.LOOT,
      lootGoldDice: [3, 6],
      lootCards: ['general_zhost_loot'],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('General Zhost staggers back, his weapons clattering to the ground. Before you can finish him, a wave of Kobold reinforcements pours from the treeline. The general snarls and vanishes into the chaos.'),
        new EncounterText('"Leave him! More coming!" Thorb bellows, hauling you back toward the Elves. "We\'ll settle that score another day!"', 'Thorb'),
        new EncounterText('Together you cut a path south and disappear into the forest, leaving the Kobold horde behind.', '!'),
      ],
    }),
  ], true);
}

export function createCalmGroveEncounter() {
  // Mirrors Python create_calm_grove_encounter exactly: post-Zhost flight,
  // Raena joins the party (+ level-up + rest), then a single optional gift
  // (Lambas Bread) before pressing on.
  return new Encounter('calm_grove', 'Calm Grove', 'A hidden grove where Raena and the surviving elves rest.', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('You flee south through the forest with Raena and the surviving elves. After what feels like hours, you stumble into a hidden grove sheltered by ancient oaks. The sounds of pursuit fade.'),
        new EncounterText('Raena slumps against a mossy trunk. "That ambush... so many fell. Without you, none of us would have survived." You tell her you\'re trying to reach Qualibaf.', 'Raena'),
        new EncounterText('"Aye, fought well for an elf," Thorb admits grudgingly, cleaning his weapon. "Suppose they\'re not ALL useless."', 'Thorb'),
        new EncounterText('Raena rises, ignoring Thorb. "Then let me come with you. The Kobold threat is greater than any of us realized. Together we can warn the free peoples before it\'s too late."', 'Raena'),
        new EncounterText('"More the merrier," Thorb shrugs. "Let\'s rest a bit first. Me legs are about to give out."', 'Thorb'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.LOOT,
      lootCards: ['raena_card'],
      lootTitle: 'Raena joins the party!',
      triggersLevelUp: true,
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.CHOICE,
      choicePrompt: 'While resting in the peaceful grove, Raena offers you some bread.',
      choices: [
        new EncounterChoice(
          "Accept Raena's Lambas Bread",
          'Raena reaches into her pack and produces a leaf-wrapped bundle of warm elvish bread. "Lambas," she says softly. "It will restore your strength." The bread is light and fragrant, and warmth spreads through you with every bite.',
          'accept_lambas_card', 0,
          { returnToChoices: true },
        ),
        new EncounterChoice(
          'Press on',
          'After resting a while in the grove\'s shelter, you feel ready to press forward. Raena nods and falls into step beside you.',
          '', 0,
        ),
      ],
    }),
  ]);
}

// Mirrors PY chapter_end_text shown alongside the "Chapter 3" banner —
// here we display the narrative as a brief two-page dialog after the
// title card, before dropping the player onto the plains map.
export function createEnteringPlainsEncounter() {
  return new Encounter('entering_plains', 'The Plains of No Hope', 'A bitter wind, a grey sky.', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText(
          'You leave the forest behind and step onto the barren plains. ' +
          'The wind is bitter and the sky heavy with grey clouds. ' +
          'Snow drifts lazily down around you.'
        ),
        new EncounterText(
          'The path ahead is long and desolate, but Qualibaf waits on the other side.'
        ),
      ],
    }),
  ]);
}

export function createToThePlainsEncounter() {
  return new Encounter('to_the_plains', 'To the Plains', 'The edge of the forest, overlooking a vast desolate plain.', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText(
          'You leave the shelter of the grove and follow the tree line south. ' +
          'The forest thins and the land opens up - a vast, grey expanse ' +
          'stretches to the horizon, flat, barren, and utterly still.'
        ),
        new EncounterText(
          '"The Plains of No Hope," Raena says quietly. "Nothing grows ' +
          'here. Nothing lives here by choice."',
          'Raena'
        ),
        new EncounterText(
          '"Cheerful name," Thorb mutters. "Reminds me of me aunt\'s ' +
          'cooking. Flat, grey, and best avoided."',
          'Thorb'
        ),
        new EncounterText(
          'A few white flakes drift down from the grey sky. Raena frowns. ' +
          '"Snow? It\'s early for that. We should cross the plains heading ' +
          'west - there should be a way to reach Qualibaf on the other ' +
          'side of the river."',
          'Raena'
        ),
        new EncounterText(
          '"Long as we keep movin\', I\'m fine," Thorb says, pulling his ' +
          'collar up. "Standing still in a place called \'No Hope\' seems ' +
          'like bad luck."',
          'Thorb'
        ),
      ],
    }),
  ]);
}

// ============================================================
// Plains Encounters
// ============================================================

export function createBoneValleyEncounter() {
  return new Encounter('bone_valley', 'Bone Valley', 'A desolate valley choked with ancient bones.', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText(
          '"We should cut through there," Raena says, pointing between ' +
          'two looming peaks. "Staying low keeps us less exposed."',
          'Raena'
        ),
        new EncounterText(
          'You descend into a narrow valley. The grass gives way to cracked, ' +
          'sun-bleached earth. No wind. No birds. Nothing.'
        ),
        new EncounterText(
          'Then you notice the bones. Rib cages half-buried in the dust, ' +
          'jawbones jutting from the dirt. As you press deeper, they ' +
          'multiply - skulls, femurs, spines - scattered everywhere.'
        ),
        new EncounterText(
          '"I don\'t like this," Thorb growls, scanning the valley walls. ' +
          '"Dwarves know their bones. These aren\'t natural remains. ' +
          'Something put \'em here."',
          'Thorb'
        ),
        new EncounterText(
          '"Wait..." Raena freezes. "The bones. They weren\'t here a ' +
          'moment ago. They\'re spreading."',
          'Raena'
        ),
        new EncounterText(
          'The ground rumbles. The bones tremble, rattle, then MOVE - ' +
          'dragging themselves across the earth, converging on a single ' +
          'point ahead of you.'
        ),
        new EncounterText(
          '"RUN! We have to-" But there is nowhere to run. The valley ' +
          'walls close in on both sides, the path behind choked with ' +
          'writhing bones.',
          'Raena'
        ),
        new EncounterText(
          'Hundreds of bones fuse together with sickening cracks, twisting ' +
          'into a towering AMALGAM. A dozen skulls stare from its body.',
          '!'
        ),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.COMBAT,
      enemyId: 'bone_amalgam',
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The bone amalgam shatters, its remains collapsing into a lifeless heap.'),
        new EncounterText('Among the wreckage, you find something useful.'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.LOOT,
      lootGoldDice: [3, 6],
      lootCards: ['bone_amalgam_loot'],
    }),
  ]);
}

export function createWolfBlizzardEncounter() {
  // Mirrors Python create_wolf_blizzard_encounter exactly: 6 narrative
  // beats with Raena chiming in, the kill-10 fight, salvage loot, and
  // a 3-block epilogue forcing the cave entrance.
  return new Encounter('wolf_blizzard', 'Wolf Pack', 'A pack of wolves hunts you through the blizzard.', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText("You flee the storm of bones and rocks, running south without thinking. When the dust settles, you realize you've wandered far from your objective. Too far."),
        new EncounterText('The sky darkens. Snow begins to fall — softly at first, then in thick, biting sheets. Within minutes, a dry blizzard swallows everything. Visibility drops to nothing. The wind screams.'),
        new EncounterText('"The rocks — I think they\'re east!" Raena shouts over the howling gale, pulling you toward dark shapes in the white. "We need cover, NOW!"', 'Raena'),
        new EncounterText('Then you hear them. Low growls cutting through the wind. Shadows moving in the snow — too many to count. Yellow eyes flash in the whiteout, circling closer.'),
        new EncounterText('"Wolves..." Raena draws her blade, voice trembling. "A whole pack. They\'ve been tracking us."', 'Raena'),
        new EncounterText('You scramble toward the rocks but the cliff face blocks your escape. Cornered. The pack closes in, snarling, their breath steaming in the frozen air. There is no running from this.', '!'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.COMBAT,
      enemyId: 'wolf_pack',
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The last wolf yelps and retreats into the blizzard. The pack scatters.'),
        new EncounterText('Among the fallen wolves, you find something useful.'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.LOOT,
      lootGoldDice: [3, 6],
      lootCards: ['wolf_pack_loot'],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('You barely catch your breath before more howls pierce the wind. Many more. The blizzard thickens and dark shapes close in from every direction. This isn\'t over.'),
        new EncounterText('"There!" Raena grabs your arm, pointing at a dark opening in the rock face. A cave entrance, half-hidden by snow and ice. "It\'s our only chance!"', 'Raena'),
        new EncounterText('Without thinking, you throw yourselves inside. The wolves snarl at the entrance but don\'t follow. The howling wind fades to an eerie silence as you stumble deeper into the darkness.'),
      ],
    }),
  ]);
}


// ============================================================
// Cave Encounters
// ============================================================

export function createCaveEntranceEncounter() {
  // Mirrors Python create_cave_entrance_encounter — Thorb lights a
  // makeshift torch, Raena resigns to going forward.
  return new Encounter('cave_entrance', 'Cave Entrance', 'The cave entrance, where Thorb lights a makeshift torch.', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The cave mouth swallows the last of the daylight behind you. The howling wind dies to a whisper, replaced by the drip of water echoing in the darkness. You can barely see your own hands.'),
        new EncounterText('"Hold on, I\'ve got something," Thorb grunts. You hear him rummaging through scraps of old clothing scattered on the cave floor. The rasp of flint on steel echoes off the walls.', 'Thorb'),
        new EncounterText('A spark catches. Then another. A strip of cloth wrapped around a broken stalagmite flickers to life, casting dancing shadows across the rough stone walls. The torch\'s warm glow pushes back the darkness just enough to see.'),
        new EncounterText('"That\'ll do for now," Thorb says, raising the makeshift torch higher. The cave stretches deeper ahead, splitting into passages that vanish into the dark. Cool air drifts from somewhere below.', 'Thorb'),
        new EncounterText('Raena peers into the gloom. "We can\'t go back. The wolves will be waiting." She pauses. "Whatever is down here, at least it\'s warmer than that blizzard."', 'Raena'),
        new EncounterText('You press forward, guided by the flickering torchlight. The cave walls glisten with moisture and strange mineral deposits. The air smells of damp stone and something older, deeper. Only way is forward.'),
      ],
    }),
  ]);
}

export function createCaveLedgeEncounter() {
  // Mirrors Python create_cave_ledge_encounter — 4 ways to descend.
  // Each option has a different cost / risk profile:
  //   - Climb: Recharge 1 random hand card; 50% take 2-3 deck damage.
  //   - Rope:  Discard 1 hand card matching clothing / light_armor /
  //            scraps / warden's whip.
  //   - Long:  Recharge up to 4 random hand cards (always safe).
  //   - Jump:  Take 4 deck damage (always works).
  // Result text for each is set dynamically by the resolver in main.js.
  return new Encounter('cave_ledge', 'The Ledge', 'A rocky ledge overlooking an icy darkness below.', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('You move deeper until you nearly topple over an edge. Below, faint reflections glimmer — ice. The sound of running water echoes from somewhere far below.'),
        new EncounterText('The drop is maybe fifteen feet. The walls offer some handholds, but they\'re slick with moisture.', '!'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.CHOICE,
      choicePrompt: 'How do you descend?',
      choices: [
        new EncounterChoice(
          'Climb down carefully  [Recharge a Card to attempt]',
          '', 'cave_climb_down', 1,
        ),
        new EncounterChoice(
          'Use gear as rope  [Require Clothing, Light Armor, Whip or Scraps]',
          '', 'cave_rope_down', 1,
        ),
        new EncounterChoice(
          'Find a longer way around  [Safe]',
          '', 'cave_long_way', 1,
        ),
        new EncounterChoice(
          'Jump!  [Risky]',
          '', 'cave_jump_down', 4,
        ),
      ],
    }),
  ]);
}

export function createCaveRiverLandingEncounter() {
  // Mirrors Python create_cave_river_landing_encounter — Thorb mentions
  // mushrooms, the player loots 2 Cave Shrooms mid-dialog, then the
  // torch dies and the party heads downriver.
  return new Encounter('cave_river_landing', 'River Landing', 'A rocky landing beside an icy underground river.', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('You dust yourself off and take stock of your surroundings. A rocky landing stretches along an underground river, its surface glazed with thin ice. The torch flickers weakly.'),
        new EncounterText('"We should be able to find some cave mushrooms down here," Thorb says, holding the sputtering torch higher. "They glow — should let us see without the torch. Good thing too, this thing won\'t last much longer."', 'Thorb'),
        new EncounterText('On the damp rocks near the water\'s edge, small clusters of mushrooms emit a soft, pale blue glow.'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.LOOT,
      lootCards: ['cave_shroom_loot'],
      lootTitle: 'Cave Shrooms!',
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The torch sputters and dies, but the mushrooms cast an ethereal blue glow that reaches further than you\'d expect.', '!'),
        new EncounterText('"Not bad," Thorb admits, tucking a few mushrooms into his belt. "Now, the river\'s flowing that way. In the mountains, water always finds a way out. I say we follow it."', 'Thorb'),
        new EncounterText('Raena nods. "And these mushrooms... I\'ve read about them. They have healing properties."', 'Raena'),
        new EncounterText('You decide to follow the icy river deeper into the cave.'),
      ],
    }),
  ]);
}

export function createUndergroundRiverEncounter() {
  // Mirrors Python create_underground_river_encounter — long TEXT-only
  // journey: party wades into the river, current sweeps them through a
  // tunnel, plunges over a small waterfall, deposits them on a rocky
  // shelf with an amber glow ahead. NOTE: PY has NO combat here — the
  // sahuagin/piranha fight lives at the next node (piranha_pool, on
  // the ruins basin map).
  return new Encounter('underground_river', 'Underground River', 'The river disappears into a dark tunnel.', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('You follow the river deeper underground. The air grows warmer here — the ice along the banks has given way to slick, dark stone. The pale glow of cave mushrooms reflects off the water\'s surface.'),
        new EncounterText('The passage narrows ahead. The river fills the entire tunnel — there\'s no way forward along the banks. You\'ll have to wade in.'),
        new EncounterText('"I don\'t like this," Thorb mutters, eyeing the dark water. "But I don\'t see another way."', 'Thorb'),
        new EncounterText('You step into the river. The water is surprisingly warm, rising to your waist. The current is gentle at first, guiding you forward through the tunnel. The mushroom light fades behind you.'),
        // Beat where the river takes over — switch bg to InTheRiverCurrent
        // (PY's underground_rapids_bg) and the renderer side fires the
        // fast-flowing rapids cue. See handleEncounterTextClick.
        new EncounterText('The current picks up. What was a gentle pull becomes an insistent tug. The water rises to your chest. The tunnel walls rush past faster now.', '', 'bg_underground_rapids'),
        new EncounterText('"Grab onto something!" Thorb shouts, but there\'s nothing to grab. The river has you now. You\'re swept forward, tumbling through the darkness, water roaring in your ears.', 'Thorb'),
        new EncounterText('A sudden drop — your stomach lurches as you go over a small waterfall. You crash into a deeper pool, pulled under for a terrifying moment before surfacing, gasping.'),
        new EncounterText('The current slows. You drag yourself onto a rocky shelf, coughing water. Thorb hauls himself up beside you, breathing hard. Your torch is long gone, but a faint amber glow emanates from somewhere ahead.'),
        new EncounterText('There\'s no going back the way you came.', '!'),
      ],
    }),
  ]);
}

// ============================================================
// Ruins Basin Encounters
// ============================================================

export function createPiranhaPoolEncounter() {
  // Mirrors Python create_piranha_pool_encounter — 5 narrative beats
  // ending with the piranhas swarming, then the piranhas_swarm fight.
  // (PY uses a swim-target mechanic for victory; the JS port currently
  // routes it through the existing kill-target system.)
  return new Encounter('piranha_pool', 'The Pool', 'A dark pool at the base of a waterfall.', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The river spits you out over the edge of a waterfall. For a terrible, weightless moment you hang in the air — then you plunge into a wide, dark pool below.'),
        new EncounterText('You surface, gasping. The pool is vast, fed by the waterfall thundering behind you. Ancient stone columns rise from the water around you, carved with symbols you don\'t recognize. Ruins.'),
        new EncounterText('Something brushes against your leg. Then again. Small, darting shapes move just beneath the surface, circling you in the murky water.'),
        new EncounterText('A sharp sting on your calf. Then another on your arm. Tiny teeth — dozens of them. The water around you begins to froth with silvery, writhing bodies.', '!'),
        new EncounterText('"PIRANHAS!" Thorb bellows, thrashing wildly. Blood clouds the water around him. "SWIM! Get to the edge!"', 'Thorb'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.COMBAT,
      enemyId: 'piranhas_swarm',
    }),
  ]);
}

export function createPoolSouthEncounter() {
  return new Encounter('pool_south', 'Pool South', 'Southern edge of the pool', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('You skirt along the southern edge of the pool, keeping well clear of the dark water. The stone walkway here is cracked but passable.'),
        new EncounterText('The passage continues ahead, winding between dripping stalactites and the remnants of carved walls.'),
      ],
    }),
  ]);
}

export function createPoolExitEncounter() {
  // Mirrors Python create_pool_exit_encounter — second sentinel ambush
  // at the edge of the corridor, then auto-jump to flooded_entrance.
  return new Encounter('pool_exit', "Pool's Exit", 'A sentinel patrols the passage ahead.', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The passage narrows ahead, ancient stone walls closing in on either side. You can see where the pool gives way to carved corridors leading deeper into the temple.'),
        new EncounterText('A rhythmic splashing echoes from around the corner. Heavy, deliberate footsteps wading through shallow water. Something is patrolling this passage.', '!'),
        new EncounterText('Another Sahuagin rounds the corner, trident in hand. Its eyes lock onto you instantly. There is no surprise this time — only cold recognition. It lowers its weapon and advances.', '!'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.COMBAT,
      enemyId: 'sahuagin_sentinel',
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.LOOT,
      lootGoldDice: [3, 6],
      lootCards: ['sahuagin_sentinel_loot'],
    }),
  ]);
}

export function createConservatoryWingEncounter() {
  // Mirrors Python create_conservatory_wing_encounter — TEXT-only
  // passage to the deeper sacred area. After the dialog, the player
  // is on temple_right with the altar_entrance node unlocked, so
  // they walk through to the Sacred Chamber on their own click.
  return new Encounter('conservatory_wing', 'Conservatory Wing', 'An arch leads deeper into the temple.', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('This arch leads to a deeper area of the temple. The stonework here is more ornate, carved with scenes of worship and offering. You press forward.'),
        new EncounterText('After walking through drenched and half-submerged corridors, the passage opens into what looks like a more sacred area within the temple. The ceiling is higher here, and faint light filters through cracks above.'),
        new EncounterText('There are forms moving around in the dim light ahead. You cannot tell if they are friend or foe.', '!'),
      ],
    }),
  ]);
}

export function createFloodedPassageEncounter() {
  // Mirrors Python create_flooded_passage_encounter — 4 narrative
  // beats: widening corridor, first daylight in days, Thorb's
  // delight, the temple giving way to natural rock. After the
  // dialog, the flow auto-transitions to passage_entrance on the
  // temple_exit map_area (PY mirror in main.js).
  return new Encounter('flooded_passage', 'Flooded Passage', 'The passage opens up ahead.', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The flooded corridor widens ahead. The ceiling rises, cracked and broken, revealing jagged holes where roots push through from above. Through the gaps, a faint gray light filters down.'),
        new EncounterText('Daylight. Weak and distant, but unmistakable. The first natural light you\'ve seen since you started following this underground river. The air shifts too — less stale, carrying the faint smell of earth and moss instead of brine.'),
        new EncounterText('"Light!" Thorb croaks, shielding his eyes. "Thought I\'d forgotten what that looked like." He squints upward at the cracks. "Can\'t climb through those, but... maybe there\'s a way out ahead."', 'Thorb'),
        new EncounterText('The passage slopes gently downward, the water growing shallower. Old temple stonework gives way to rougher, more natural rock. Whatever this place was, the temple is ending. Something else lies beyond.'),
      ],
    }),
  ]);
}

// === Boss Wing & Flooded Altar (PY mirrors) ===

export function createBossWingSentinelCombatEncounter() {
  return new Encounter('boss_wing_sentinel_combat', 'Sentinel Patrol', 'A Sahuagin sentinel blocks the way.', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The sentinel spots you. It lets out a guttural shriek that echoes through the flooded corridors, then charges, trident leveled.'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.COMBAT,
      enemyId: 'sahuagin_sentinel',
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The sentinel sinks beneath the murky water. The way ahead is clear, but the shriek will have alerted whatever lies deeper within.'),
      ],
    }),
  ]);
}

export function createBossWingPriestCombatEncounter() {
  return new Encounter('boss_wing_priest_combat', 'Flooded Chamber', 'The Sahuagin Baron awaits.', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The archway opens into a grand flooded chamber. At its center, a massive Sahuagin towers above the dark water. It is armored in barnacle-encrusted plate, and its eyes burn with cold fury.'),
        new EncounterText('The Sahuagin Baron raises a clawed fist and the water churns violently. Dark shapes move beneath the surface — sharks, sentinels, priests — all answering the Baron\'s call.', '!'),
        new EncounterText('The Baron lets out a thunderous roar that shakes the chamber. The water rises. There is no retreat now.', '!'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.COMBAT,
      enemyId: 'sahuagin_baron',
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.LOOT,
      lootGoldDice: [5, 6],
      lootCards: ['sahuagin_sentinel_loot', 'sahuagin_baron_loot'],
    }),
  ]);
}

export function createFloodedAltarEncounter() {
  // Mirrors PY create_flooded_altar_encounter — the priest rises
  // from the water, player can attack or retreat back to the
  // central chamber. Loot drops both Sahuagin Sentinel pool + the
  // guaranteed Sahuagin Priest Staff.
  return new Encounter('flooded_altar', 'Flooded Altar', 'Something stirs in the dark water.', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The chamber opens before you. At its center, a submerged altar rises from the dark water, covered in barnacles and ancient script. The air is thick with the smell of brine and decay.'),
        new EncounterText('The water ripples. Not the gentle lap of a current — something unnatural. Concentric rings spread from a point near the altar, as if pushed by an unseen force.', '!'),
        new EncounterText('A figure rises slowly from the water. Taller than the sentinels, draped in tattered robes that cling to scaled skin. Its eyes glow with a sickly green light. It raises a clawed hand, and the water around it churns.', '!'),
        new EncounterText('You see dark fins sliding in and out of the water on either side of the altar. The figure has not attacked yet, but its gaze is fixed on you with cold intent.', '!'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.CHOICE,
      choicePrompt: 'What do you do?',
      choices: [
        new EncounterChoice(
          'Attack!',
          'You charge forward, weapons drawn!',
          'altar_attack', 0,
        ),
        new EncounterChoice(
          'Retreat to the central chamber',
          'You back away slowly, retreating through the flooded corridors.',
          'altar_retreat', 0,
        ),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.COMBAT,
      enemyId: 'sahuagin_priest',
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.LOOT,
      lootGoldDice: [4, 6],
      lootCards: ['sahuagin_sentinel_loot', 'sahuagin_priest_loot'],
    }),
  ]);
}

export function createOldGodStatueEncounter() {
  // Mirrors PY create_old_god_statue_encounter — narrative beat then
  // a Pray / Leave choice. Praying triggers a class-specific tier-1
  // ability pick AND grants the Old God's Blessing combat buff
  // (next attack +1 if target is damaged) for the next combat.
  return new Encounter('old_god_statue', 'Statue of an Old God', 'An ancient statue stands half-submerged in the murky water.', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('Beyond the altar, a massive stone statue rises from the water. It depicts a figure you do not recognize — neither human nor Sahuagin. Something older. Its eyes are closed, but you feel them watching.'),
        new EncounterText("The statue's hands are outstretched, palms up, as though offering something — or waiting to receive. Ancient script circles its base, worn but still faintly glowing with a pale light.", '!'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.CHOICE,
      choices: [
        new EncounterChoice(
          'Pray at the Statue',
          'You kneel in the cold water and bow your head. The pale script flares — a single bright pulse — and warmth blooms in your chest. Whatever was sleeping here turns its attention toward you, and offers a gift.',
          'pray_statue', 1,
        ),
        new EncounterChoice(
          'Leave',
          'You step back from the statue. The pale glow dims, but the feeling of being watched lingers.',
          '', 0,
        ),
      ],
    }),
  ]);
}

export function createSentinelPatrolSightingEncounter() {
  // Mirrors Python create_sentinel_patrol_sighting_encounter —
  // dialog-only beat shown when the party first emerges into the
  // boss wing. Player can then navigate to the deeper rooms.
  return new Encounter('sentinel_patrol_sighting', 'Deeper Corridor', 'Sahuagin sentinels patrol the flooded corridors.', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('You emerge into a flooded wing of the temple. The water here is waist-deep and murky. Columns rise from the dark water, covered in barnacles and strange carvings.'),
        new EncounterText('Movement ahead. Two Sahuagin sentinels glide through the water on patrol, their tridents held low. They haven\'t spotted you yet, but there\'s no way past without a fight.', '!'),
        new EncounterText('Beyond them, the corridor leads to a grand archway. You can feel something emanating from that direction — a low hum of dark power that makes the water tremble.', '!'),
      ],
    }),
  ]);
}

export function createDarkCorridorEncounter() {
  // Mirrors Python create_dark_corridor_encounter — narrative
  // glimpse of the deeper flooded wing, then a "Descend / Turn back"
  // choice. Picking Descend unlocks the Deeper Corridor node and
  // teleports the party there; the two nodes act as a teleport pair
  // afterward (the encounter is one-shot, the connection persists).
  return new Encounter('dark_corridor', 'Dark Corridor', 'A wide corridor leading deeper into the temple.', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The corridor slopes downward, the water rising past your ankles. The walls narrow and the light fades. Somewhere ahead, you hear the rhythmic splash of something moving through deep water.'),
        new EncounterText('Through a gap in the crumbling wall, you catch a glimpse of a vast flooded chamber beyond. Dark shapes patrol the waters — Sahuagin, moving with purpose. This is no random territory. Something important lies deeper within.', '!'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.CHOICE,
      choicePrompt: 'The corridor descends into flooded darkness. What do you do?',
      choices: [
        new EncounterChoice(
          'Descend into the darkness',
          'You steel yourself and wade deeper. The water rises to your waist as the passage opens into a flooded wing of the temple.',
          'descend_dark_corridor', 1,
        ),
        new EncounterChoice(
          'Turn back',
          'You retreat from the flooded corridor. Whatever lies below can wait.',
          'dark_corridor_turn_back', 0,
        ),
      ],
    }),
  ]);
}

export function createPassageAmbushEncounter() {
  // Mirrors Python create_passage_ambush_encounter — a stalking
  // Sahuagin Sentinel jumps the party in the widening corridor.
  return new Encounter('passage_ambush', 'Ambush!', 'Something is waiting in the shadows.', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('You press forward through the widening passage. The shallow water barely reaches your ankles now. Moss-covered columns line the walls — the last remnants of the temple\'s architecture.'),
        new EncounterText('A sound. A wet scrape of claws on stone, somewhere to your left. You spin, hand on your weapon. For a moment, nothing. Just the dripping of water and the distant light above.', '!'),
        new EncounterText('Then it launches from behind a broken pillar — a Sahuagin, scales dark as wet slate, trident aimed at your throat. It was waiting. Patient. Hidden. You barely get your guard up in time!', '!'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.COMBAT,
      enemyId: 'sahuagin_sentinel',
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.LOOT,
      lootGoldDice: [3, 6],
      lootCards: ['sahuagin_sentinel_loot'],
    }),
  ]);
}

export function createCaveExitEncounter() {
  // Mirrors Python create_cave_exit_encounter — 7-beat narrative
  // ending on Thorb's "let's not keep civilization waiting." After
  // the dialog the encounter-complete branch in main.js auto-jumps
  // the party to mountain_overlook on the arriving_city map_area.
  return new Encounter('cave_exit', 'The Light Beyond', 'The cave opens onto a mountainside.', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The passage narrows one last time, and then — light. Real, blinding, glorious light. You shield your eyes as you stumble out of the cave mouth onto a rocky mountainside ledge.'),
        new EncounterText('The view steals your breath. Below you, the mountain slopes down through scrubby pines and wild grass toward a wide river valley. The descent looks manageable — steep in places, but nothing compared to what you\'ve already survived.'),
        new EncounterText('The underground river emerges far below as a waterfall, feeding into the river that cuts through the valley. But here, away from the falls, the river runs shallow and calm. You can see places where rocks break the surface — a crossing on foot.'),
        new EncounterText('And beyond the river, to the northeast... buildings. Walls. Smoke rising from chimneys. A city. Your heart hammers in your chest.'),
        new EncounterText('"Is that..." Thorb trails off, barely daring to say it. He wipes his eyes with a grimy sleeve. "That\'s Qualibaf. Has to be. We made it. We actually made it."', 'Thorb'),
        new EncounterText('Raena steps to the ledge, the wind catching her hair. A rare smile crosses her face. "We came from the south. The river took us much further than I expected — this detour added days to our journey." She pauses. "But we\'re alive. That counts for something."', 'Raena'),
        new EncounterText('"Counts for everything," Thorb says firmly. He claps you on the shoulder. "Come on. Let\'s not keep civilization waiting. I need a proper meal and a bed that isn\'t made of stone and regret."', 'Thorb'),
      ],
    }),
  ]);
}

export function createRiverCrossingEncounter() {
  // Mirrors PY create_river_crossing_encounter — 4 narrative beats
  // crossing the shallow river on foot, with a 25% chance to find a
  // Lucky Pebble at the far bank.
  const phases = [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('You pick your way down the mountainside, following a narrow goat trail that winds between boulders and gnarled trees. The air is warm and clean — a world away from the damp darkness of the flooded temple.'),
        new EncounterText('At the river\'s edge, a line of flat rocks juts above the current, forming a natural bridge. The water rushes between them, cold and clear, but shallow enough that even a misstep would only soak your boots.'),
        new EncounterText('One by one, you hop across — stone to stone, steady and sure. After swimming through piranha-infested temple pools and riding underground rapids, a simple river crossing feels almost laughable.'),
        new EncounterText('On the far bank, you pause to catch your breath. The road to Qualibaf stretches north through gentle farmland. You can see the city walls more clearly now — gray stone catching the afternoon light.'),
      ],
    }),
  ];
  if (Math.random() < 0.25) {
    phases.push(new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('As you step off the last stone, something catches your eye — a small, smooth pebble glinting between the rocks at the water\'s edge. Its surface is oddly warm to the touch, and it fits perfectly in the palm of your hand. What a nice little stone. Lucky me!'),
      ],
    }));
    phases.push(new EncounterPhaseData({
      phaseType: EncounterPhase.LOOT,
      lootCards: ['lucky_pebble_loot'],
    }));
  }
  return new Encounter('river_crossing', 'River Crossing', 'The river runs shallow here.', phases);
}

export function createSouthGateEncounter() {
  // Mirrors PY create_south_gate_encounter, tightened: 7 beats → 5,
  // sensory details kept (fishing boats / terraced fields / blue
  // tabards / bread + woodsmoke) plus the Thorb-and-Raena banter.
  return new Encounter('south_gate', 'The South Gate', 'Qualibaf at last.', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The road widens as you approach the city. Fishing boats bob on the river to your left; terraced grain climbs the hills to your right, tended by figures who pause to wave.'),
        new EncounterText('The South Gate stands open, iron-banded doors thrown wide. Guards in blue tabards watch you come, leaning easy on their spears — curious, but unalarmed. One nods you through.'),
        new EncounterText('The city washes over you all at once: merchants calling, children shrieking with laughter, cart wheels rattling on cobblestone. Fresh bread and woodsmoke. A wave of bone-deep relief — from the prison cell, through the sewers and the rapids and the Sahuagin, you made it. Qualibaf is real and solid around you.'),
        new EncounterText('"DRINKS!" Thorb roars, loud enough to turn every head on the street. He clamps both hands on a baffled merchant\'s shoulders. "Hot food! A bath! Where\'s the nearest tavern, friend? I\'ve got a thirst could drain that river we just crossed!"', 'Thorb'),
        new EncounterText('Raena shakes her head, but she\'s smiling. "Guild hall first — there are people who need to hear what we found beneath those ruins." She glances sideways at you, and the smile widens. "...but perhaps a meal on the way. We\'ve earned that much."', 'Raena'),
      ],
    }),
    // PY mirror: empty-loot phase with triggers_level_up + a yellow
    // "Welcome to Qualibaf!" title. The level-up flow opens after the
    // banner. Encounter-complete handler then teleports the party to
    // city_south_gate and shows the Chapter 4 title card.
    new EncounterPhaseData({
      phaseType: EncounterPhase.LOOT,
      lootCards: [],
      lootTitle: 'Welcome to Qualibaf!',
      triggersLevelUp: true,
    }),
  ]);
}

export function createSahuaginSentinelEncounter() {
  // Mirrors Python create_sahuagin_sentinel_encounter — 6 narrative
  // beats on the pool's stone ledge, sentinel rises and charges,
  // combat, then loot.
  return new Encounter('sahuagin_sentinel', "The Pool's Edge", 'Something lurks in the dark water.', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('You drag yourself onto the stone ledge, gasping and bleeding from a hundred tiny bites. The piranhas circle in the water below, but they don\'t follow onto the rock. You\'re safe.'),
        new EncounterText('For a moment, there is only the sound of your ragged breathing and the distant roar of the waterfall. The air is warm and heavy. Ancient stone pillars frame the pool, half-swallowed by moss and time.'),
        new EncounterText('Thorb collapses against a pillar, wringing water from his beard. "Never... again..." he wheezes. You allow yourself a moment to breathe. Just one moment.', 'Thorb'),
        new EncounterText('Then you hear it. A low, wet sound cutting through the water. Not the frantic thrashing of piranhas — something bigger. Something deliberate. A dark shape glides just beneath the surface, circling the edge of the pool with terrible patience.', '!'),
        new EncounterText('It rises. Scaled skin glistening in the dim light. Webbed claws grip a barbed trident. Cold, unblinking eyes fix on you from a face that is part fish, part nightmare. Water streams from its crested skull as it draws itself to full height.', '!'),
        new EncounterText('The creature lets out a guttural hiss — a sound like stone dragged across wet metal — and CHARGES, trident leveled at your chest!', '!'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.COMBAT,
      enemyId: 'sahuagin_sentinel',
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.LOOT,
      lootGoldDice: [3, 6],
      lootCards: ['sahuagin_sentinel_loot'],
    }),
  ]);
}

// ============================================================
// City Shop Encounters
// ============================================================

export function createCitySquareEncounter() {
  return new Encounter('city_square', 'City Square', 'The heart of Qualibaf.', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The City Square opens before you - a wide cobblestone plaza ringed by merchant stalls and old stone buildings. A fountain burbles at its center, carved in the shape of a leaping fish.'),
        new EncounterText('Townsfolk go about their business, haggling over prices, loading carts, and sharing gossip. After the darkness of the ruins, the ordinary bustle of city life feels almost surreal.'),
        new EncounterText('Market stalls line the edges of the square, selling fresh food and provisions. To the west you can see the Weaponsmith\'s forge and the Armorsmith\'s workshop. Signs point toward the Inn, General Store, and Guild Hall.'),
      ],
    }),
  ]);
}

export function createWeaponsmithEncounter() {
  return new Encounter('weaponsmith', 'Weaponsmith', 'A master of blade and steel.', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The forge radiates heat as you step inside. A broad-shouldered woman works the bellows, sending sparks cascading across the stone floor. Swords, axes, and spears hang from every wall.'),
        new EncounterText('She glances up, appraising you with a smith\'s eye. "You look like you\'ve seen some trouble. Dull blades and bent steel, I\'d wager." She sets down her tongs. "Let\'s see what I can do for you."', 'Weaponsmith'),
      ],
    }),
  ]);
}

export function createArmorsmithEncounter() {
  return new Encounter('armorsmith', 'Armorsmith', 'Protection for those who can afford it.', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The Armorsmith\'s workshop is quieter than the forge next door. A wiry man with careful hands works leather and chain into fitted pieces. Mannequins display his finest work - gleaming breastplates and reinforced shields.'),
        new EncounterText('"Adventurers, eh?" He looks you over with professional interest. "That gear\'s seen better days. I can patch it up, or fit you with something new if your coin purse allows."', 'Armorsmith'),
      ],
    }),
  ]);
}

export function createGeneralStoreEncounter() {
  return new Encounter('general_store', 'General Store', 'Everything an adventurer might need.', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The General Store is a maze of shelves crammed floor to ceiling with supplies - rope, torches, rations, healing herbs, and dozens of things you can\'t identify. A bell chimes as you enter.'),
        new EncounterText('A cheerful halfling appears from behind a towering stack of crates. "Welcome, welcome! Everything you need for the road ahead - and plenty you didn\'t know you needed! Browse freely, friends."', 'Shopkeeper'),
      ],
    }),
  ]);
}

export function createInnEncounter() {
  return new Encounter('inn', 'The Rusty Anchor', 'A warm tavern with cold drinks.', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The Rusty Anchor Inn lives up to its name - a weathered ship\'s anchor hangs above the door, and the interior smells of salt, ale, and roasting meat. A fire crackles in a massive stone hearth.'),
        new EncounterText('Thorb is already at the bar before you\'ve finished crossing the threshold. "THREE ales! No - FOUR! And whatever\'s on that spit!" He slams coins on the counter with the enthusiasm of a man who hasn\'t had a proper drink in weeks.', 'Thorb'),
        new EncounterText('The innkeeper, a weathered woman with kind eyes, slides mugs across the bar. "You lot look like you\'ve got stories to tell. First round\'s on the house for anyone brave enough - or foolish enough - to come from the south road."'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.CHOICE,
      choicePrompt: 'The inn has warm beds and a crackling fire. Rest here?',
      choices: [
        new EncounterChoice(
          'Rest here (5 GP)',
          '',
          'inn_rest', 5
        ),
        new EncounterChoice(
          'Not now',
          'You enjoy the atmosphere but decide not to stay. Perhaps another time.',
          '', 0
        ),
      ],
    }),
  ]);
}

export function createChurchEncounter() {
  return new Encounter('church', 'The Chapel of Light', 'A small, calm local church.', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The chapel is small but well-kept, its stone walls softened by the warm glow of dozens of candles. Stained glass windows cast colored light across worn wooden pews. The air smells of incense and old wood.'),
        new EncounterText('A lone priest tends to the altar, arranging fresh flowers. He notices you and smiles warmly. "Welcome, traveler. The chapel is open to all who seek guidance or solace. If you wish to make an offering, the divine may grant you a blessing."'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.CHOICE,
      choicePrompt: 'The altar glows faintly. Will you make an offering?',
      choices: [
        new EncounterChoice(
          'Pray and donate (50 GP)',
          'You kneel before the altar and place your offering. A warm light washes over you, and you feel a surge of divine knowledge flow through your mind.',
          'pray_church', 50
        ),
        new EncounterChoice(
          'Just visit',
          'You sit quietly in the pews for a while, enjoying the peaceful atmosphere. Perhaps another time.',
          '', 0
        ),
      ],
    }),
  ]);
}

export function createArcaneEmporiumEncounter() {
  return new Encounter('arcane_emporium', 'The Arcane Emporium', 'A shop of magical curiosities.', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('Crystals float in the window display, casting prismatic light across shelves lined with scrolls, wands, and bottled starlight. The air hums with faint arcane energy.'),
        new EncounterText('A tall elf with silver-streaked hair looks up from an ancient tome. His eyes widen slightly as he notices your companion. "Raena? It\'s been... years. I thought you were still in the Silverwood." He smiles warmly. "Please, browse freely — any friend of Raena\'s is welcome here."', 'Elarion'),
      ],
    }),
  ]);
}

// First-visit antiquity-shop encounter: Grimbold begs for help → choice →
// pre-combat creep → Mimic fight → post-combat thanks. After this encounter
// completes the auto-shop hook in main.js opens Grimbold's storefront and
// flips the antiquityShopCleared flag so future visits skip straight to
// the cleared variant.
export function createAntiquityShopEncounter() {
  return new Encounter('antiquity_shop', "Grimbold's Antiquities", 'A dusty shop of ancient relics.', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText("A crooked sign reads 'Grimbold's Antiquities' above a narrow doorway. As you approach, a frantic gnome with wild white hair and ink-stained fingers bursts out, waving his arms."),
        new EncounterText('"Don\'t go in there! There\'s a - a THING in my shop! It came through the cellar last night and now it won\'t leave! It\'s eating my inventory!"', 'Grimbold'),
        new EncounterText('"Wait, how does a monster just... get into a shop in the middle of a city? Don\'t you have guards for this sort of thing?"', 'Raena'),
        new EncounterText('"HA! A monster in a SHOP! This is the best city ever! Can I fight it? Please say I can fight it."', 'Thorb'),
        new EncounterText('The gnome wrings his hands nervously. "The guards said they\'d send someone but that was two days ago. If you could deal with it, I\'d be most grateful - and I\'d open my shop to you!"'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.CHOICE,
      choicePrompt: 'A monster has taken over the Antiquity Shop.',
      choices: [
        new EncounterChoice(
          'Clear out the monster',
          'You draw your weapons and push through the doorway. Inside, overturned shelves and scattered relics litter the floor. Something moves in the shadows...',
          'antiquity_fight', 0
        ),
        new EncounterChoice(
          'Not right now',
          "You promise the gnome you'll come back when you're ready. He nods anxiously.",
          'antiquity_leave', 0
        ),
      ],
    }),
    // Pre-combat — discovering the Mimic.
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText("You step carefully through the dim shop, squinting past toppled shelves and shattered display cases. Dust motes float in the thin light. You can't see any creature."),
        new EncounterText('"Where is it? I don\'t see anyth-"', 'Raena'),
        new EncounterText("A large ornate chest in the corner suddenly EXPLODES open - revealing rows of enormous teeth and a massive, slavering tongue. The chest wasn't a chest at all. It lunges at you!"),
        new EncounterText('"MIMIC! That\'s a MIMIC! I LOVE this shop!"', 'Thorb'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.COMBAT,
      enemyId: 'mimic',
    }),
    // Post-combat — Grimbold opens up shop.
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The Mimic collapses into a heap of splintered wood and teeth, its disguise dissolving into goo. Grimbold peeks through the doorway, then rushes in.'),
        new EncounterText('"A Mimic! In MY shop! That explains where my best chest went... and several rare artifacts along with it. But at least it\'s safe now. Thank you! As promised, you\'re welcome to browse my wares anytime. I have... unique items you won\'t find elsewhere."', 'Grimbold'),
      ],
    }),
  ]);
}

// Subsequent-visit short variant — opens the shop directly after one beat.
export function createAntiquityShopClearedEncounter() {
  return new Encounter('antiquity_shop_cleared', "Grimbold's Antiquities", 'A dusty shop of ancient relics, now monster-free.', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('Grimbold greets you warmly from behind a counter piled high with curious objects. "Welcome back, friends! Have a look around — everything\'s one of a kind!"'),
      ],
    }),
  ]);
}

// Adventurer's Guild — Aldric Voss briefs the party on the White Claw and
// dispatches Thorb to Tharnag. Completing this encounter unlocks the
// city's North Gate (see the post-encounter hook in advanceEncounterPhase).
export function createGuildHallEncounter() {
  return new Encounter('guild_hall', 'Guild Hall', 'The Guild Hall of Qualibaf.', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText("We should try to talk to the Guild Master and warn him about the kobold presence near the bridge on the Frontier road. That whole region is dangerous to travel now. Let's go meet them at the Guild Hall.", 'Raena'),
        new EncounterText('"Leave it to me! I\'ll petition them directly - they can\'t refuse a quick audience with one of their dwarf allies!"', 'Thorb'),
        new EncounterText("After some back and forth with the clerks, Thorb's stubborn insistence pays off. You are led through the Guild Hall's grand corridors to the chambers of Aldric Voss, the Guildmaster of Qualibaf. A broad-shouldered, middle-aged man with a trimmed grey beard and sharp, calculating eyes. Despite his size, he carries himself with the measured calm of someone used to making difficult decisions."),
        new EncounterText('"I was told that you bring news of troubles in the north? Please, tell me everything. Is that why we have not seen any dwarf merchants in a while?"', 'Aldric Voss'),
        new EncounterText('"Yes, my Lord. A kobold army, bearing the symbol of the White Claw, has destroyed the bridge north of here. They are organized and almost certainly have nefarious intent!"', 'Raena'),
        new EncounterText('You recount the details of your journey - the kobold patrols, the army encampment, the battle at the bridge. You mention the unseasonable cold and the light snowfall in the northern hills, weather that has no business appearing this time of year.'),
        new EncounterText('Aldric listens intently, his expression growing darker with each detail. He leans back in his chair and strokes his beard. "The White Claw... I had hoped those rumors were exaggerated. A destroyed bridge means our northern trade routes are severed. And this unnatural cold you describe - that troubles me most of all."', 'Aldric Voss'),
        new EncounterText('"I will dispatch scouts south to rally the settlements and put the garrisons on alert. But we need the dwarves. Thorb, you must travel to Tharnag — enlist their aid and warn them of what is coming. If the White Claw moves in force, we cannot hold without dwarf steel at our side."', 'Aldric Voss'),
        new EncounterText('"Tharnag is northeast, on this side of the river. We should leave by the North Gate once we are well prepared."', 'Raena'),
        new EncounterText('"Aye, but let\'s make sure we rest at the inn before we go. It\'s a long journey ahead — no sense starting it half-dead."', 'Thorb'),
      ],
    }),
  ]);
}

// North Gate exit cinema — once unlocked by the Guild Hall, walking the
// node out plays the PY 3-beat departure dialog and the post-encounter
// hook hops the party to the North Qualibaf map.
export function createCityNorthGateEncounter() {
  return new Encounter('city_north_gate', 'The North Gate', 'Leaving Qualibaf through the northern gate.', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The North Gate is less trafficked than the South. A pair of guards wave you through with barely a glance. Beyond the walls, the road narrows and winds northeast through rolling farmland toward the distant tree line.'),
        new EncounterText('"Keep your eyes open. Kobold patrols have been spotted on the roads north of the city. We\'ll need to stay sharp until we reach Tharnag."', 'Raena'),
        new EncounterText('The wind carries the faint scent of pine and woodsmoke. Qualibaf shrinks behind you as the road stretches onward. Whatever lies ahead, you face it rested and ready.'),
      ],
    }),
  ]);
}

// ============================================================
// North Qualibaf Encounters
// ============================================================

export function createNorthCrossroadEncounter() {
  return new Encounter('north_crossroad', 'North Crossroad', 'A crossroad outside the city', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('You stand at a crossroad just north of Qualibaf. The city walls are still visible behind you, but ahead the road splits.'),
        new EncounterText('To the east, a forest path disappears into the shadows of Filibaf Forest. The trees loom dark and ancient, their branches intertwined overhead.'),
      ],
    }),
  ]);
}

export function createFilibafEntranceEncounter() {
  return new Encounter('filibaf_entrance', 'Filibaf Entrance', 'The entrance to Filibaf Forest', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('You stand at the edge of Filibaf Forest. The trees tower overhead like silent sentinels, their gnarled trunks draped in moss and shadow.'),
        new EncounterText('The air is thick and damp, carrying the earthy scent of decay and growth intertwined. The path ahead is barely more than a game trail.'),
        new EncounterText('From deep within the forest comes the sound of skittering — many legs moving quickly across dry leaves. Something is watching from the darkness between the trees.'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.CHOICE,
      choices: [
        new EncounterChoice(
          'Enter the forest',
          'You steel your nerves and step beneath the canopy. The light dims immediately, swallowed by the dense foliage above.',
          'enter_filibaf', 1
        ),
        new EncounterChoice(
          'Turn back',
          'You step away from the treeline. The forest can wait.',
          '', 0
        ),
      ],
    }),
  ]);
}

// ============================================================
// Forest Encounters
// ============================================================

// First-visit Forest Shadows — Thorb explains the maze rule (more
// spiders = correct path).
export function createForestShadowsEncounter() {
  return new Encounter('forest_shadows', 'Shadowed Path', 'The path splits into shadow.', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The path narrows and splits around a massive fallen tree. Thick webs glint between the branches on both sides. Two shadowed trails diverge into the gloom. Countless eyes watch from the canopy above.'),
        new EncounterText('Do you know your way through this forest? The paths branch in every direction and I can feel many eyes watching our every move.', 'Raena'),
        new EncounterText('Hmm. I usually travel underground, but when I was young I crossed this forest with my father. I remember that the spiders near the edge were few in number. As we went deeper, the nests grew larger and the swarms thicker.', 'Thorb'),
        new EncounterText("So if we're on the right path, we should see more spiders the deeper we go?", 'Raena'),
        new EncounterText("Aye. Fewer spiders means we've gone astray and circled back toward the edge. More spiders means we're heading the right way — deeper into their territory.", 'Thorb'),
        new EncounterText("Wonderful. I hope you're right about that.", 'Raena'),
      ],
    }),
  ]);
}

// Short Forest Shadows reminder shown on every loop after the first
// (mirrors PY create_forest_shadows_revisit_encounter).
export function createForestShadowsRevisitEncounter() {
  return new Encounter('forest_shadows', 'Shadowed Path', 'The path splits into shadow.', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The path splits once more. Webs glint between the branches on both sides.'),
        new EncounterText("Remember — the number of spiders should increase as we go deeper! Fewer spiders means we've taken a wrong turn.", 'Thorb'),
      ],
    }),
  ]);
}

// Forest Clearing — final exit when the player has loop_level >= 4 AND
// picks the correct path. PY parity: 3-beat narration, then a 3-way
// choice (Search the remains / Short rest / Leave). Search and Rest
// are one-time-use (returnToChoices grays them out after picking).
// Leave triggers the post-encounter hook in main.js that scrubs Web
// tokens and transitions to Tharnag. Korgan companion intentionally
// not ported yet.
export function createForestClearingEncounter() {
  return new Encounter('forest_clearing', 'Forest Clearing', 'The trees thin out ahead.', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The webs thin and the canopy breaks apart. Shafts of golden light cut through the gloom. The oppressive crawling sensation that has haunted you through the maze finally lifts.'),
        new EncounterText("Ahead, a proper clearing opens up. The first open ground you've seen since entering Filibaf Forest. Among the old webs clinging to the trees, you find the remains of adventurers who were not so fortunate."),
        new EncounterText('Something moves in the largest web cocoon. You cut through the thick silk and a battered dwarf tumbles out, gasping for air.'),
        new EncounterText('"By Moradin\'s hammer! I thought I was done for!" He catches his breath. "Name\'s Korgan. Scout for Tharnag. Got caught by those cursed spiders on patrol. I owe you my life — I\'ll fight by your side when you need me."', 'Korgan'),
        new EncounterText("Beyond the clearing the trees thin further still — the road to Tharnag is finally within reach."),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.CHOICE,
      choices: [
        new EncounterChoice(
          'Search the remains',
          'You carefully remove old webs and salvage what you can from the fallen adventurers.',
          'search_clearing', 1,
          { returnToChoices: true }
        ),
        new EncounterChoice(
          'Take a short rest',
          'You sit among the shafts of golden light and catch your breath. The quiet of the clearing soothes your wounds. You feel some of your strength returning.',
          'short_rest', 8,
          { returnToChoices: true }
        ),
        new EncounterChoice(
          'Leave the forest',
          'You take one last look at the clearing and press onward. The worst of the forest is behind you.',
          'leave_clearing', 0
        ),
      ],
    }),
  ]);
}

export function createForestAmbushLeftEncounter() {
  return new Encounter('forest_ambush_left', 'Forest Ambush', 'Spiders attack from above', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('You push through the hanging moss and into a narrow clearing. The webs here are thicker, stretched between the trees like a grotesque canopy.'),
        new EncounterText('Without warning, spiders drop from the canopy above — huge, dark-bodied creatures with fangs dripping venom. They land all around you, cutting off escape!'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.COMBAT,
      enemyId: 'forest_spiders',
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The last spider curls up and goes still. The path ahead is clear, the webs torn apart by the battle.'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.LOOT,
      lootGoldDice: [2, 6],
    }),
  ]);
}

export function createForestAmbushRightEncounter() {
  return new Encounter('forest_ambush_right', 'Forest Ambush', 'More spiders lurk here', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('You hack through the thorny thicket, branches scratching at your arms and face. The undergrowth opens into a web-choked hollow.'),
        new EncounterText('More spiders emerge from burrows in the ground and crevices in the bark, their many eyes gleaming with hunger. They approach from a different angle than expected!'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.COMBAT,
      enemyId: 'forest_spiders',
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The spiders are defeated. Their webs hang in tattered ruins, and the path through the hollow is clear once more.'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.LOOT,
      lootGoldDice: [2, 6],
    }),
  ]);
}

// ============================================================
// Tharnag Encounters
// ============================================================

export function createTharnagArrivalEncounter() {
  return new Encounter('tharnag_arrival', 'Tharnag', 'The great Dwarven city rises before you.', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('Finally! Out of that accursed forest! He points toward the horizon where a massive mountain rises from the landscape, its peak lost in clouds. Behold — Tharnag! The greatest Dwarven city in the northern realms!', 'Thorb'),
        new EncounterText('Carved into the face of the mountain, colossal stone gates stand flanked by towering statues of dwarven kings. Balconies and terraces dot the mountainside, connected by bridges of stone and iron.'),
        new EncounterText('What you see is but the entrance. Inside the mountain lies the true city — the Great Forge, the Hall of Ancestors, markets that stretch for miles. Ten thousand dwarves call Tharnag home.', 'Thorb'),
        new EncounterText('Impressive.', 'Raena'),
        new EncounterText('But her expression shifts. She shields her eyes, her elven sight reaching further than any human could.'),
        new EncounterText('Something is wrong. There are fires near the base of the mountain — not forge fires. War fires. I see siege towers being assembled. Catapults. Battering rams. And the ones building them — goblins. Hundreds of them. And behind the lines... ogres. At least a dozen.', 'Raena', 'tharnag_siege_bg'),
        new EncounterText('The words hang in the air. Tharnag — the greatest Dwarven stronghold — is under siege.'),
        new EncounterText('NO! He rips his axe from the ground and lets out a roar that echoes across the valley. He breaks into a dead sprint down the path toward the city. WE HAVE A SIEGE TO BREAK!', 'Thorb'),
      ],
    }),
  ]);
}

export function createSiegeGauntlet1Encounter() {
  return new Encounter('siege_gauntlet_1', 'Siege Line - West', 'An ogre blocks the western siege line.', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The siege line stretches before you — a chaos of wooden barricades, overturned carts, and smoldering fires. Goblins scurry between crude war machines, but the real threat stands ahead.'),
        new EncounterText('A massive ogre blocks the path, hauling a battering ram the size of a tree trunk. Its goblin crew scatters as you approach.'),
        new EncounterText("That ram will bring down the gates if we don't stop it. Take it apart piece by piece!", 'Thorb'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.COMBAT,
      enemyId: 'siege_gauntlet_1',
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.LOOT,
      lootGoldDice: [1, 6],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The ogre crashes to the ground, its battering ram splintering beneath its weight. One siege engine down.'),
        new EncounterText("That's one! Keep moving — I can see more rams ahead!", 'Thorb'),
      ],
    }),
  ]);
}

export function createSiegeGauntlet2Encounter() {
  return new Encounter('siege_gauntlet_2', 'Siege Line - Center', 'Another ogre with a battering ram blocks the center.', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The center of the siege line is even more fortified. Another ogre stands guard over a massive ram, this one reinforced with iron bands.'),
        new EncounterText('More goblins! And this one looks angrier than the last!', 'Thorb'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.COMBAT,
      enemyId: 'siege_gauntlet_2',
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.LOOT,
      lootGoldDice: [1, 6],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The second ogre falls with a thunderous crash, crushing its own ram to splinters. The goblins flee in panic.'),
        new EncounterText('Two down! One more and the siege breaks! I can feel it!', 'Thorb'),
      ],
    }),
  ]);
}

export function createSiegeGauntlet3Encounter() {
  return new Encounter('siege_gauntlet_3', 'Siege Line - East', 'The last ogre stands between you and breaking the siege.', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The eastern siege line is the last stronghold. The biggest ogre yet stands here, bellowing orders at a horde of goblins scrambling to load their ram.'),
        new EncounterText('This is it! Break this one and the siege crumbles! FOR THARNAG!', 'Thorb'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.COMBAT,
      enemyId: 'siege_gauntlet_3',
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The final ogre topples, and with it, the last battering ram shatters. A cheer erupts from the walls of Tharnag as the remaining goblins scatter into the hills.'),
        new EncounterText('The siege is broken. The gates of Tharnag stand firm.'),
        new EncounterText("Among the wreckage you find goblin contraptions and the ogre's massive weapon."),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.LOOT,
      lootGoldDice: [8, 6],
      lootCards: ['goblin_rocket_boots', 'goblin_sapper_charges', 'ogre_maul'],
      lootTitle: 'Siege Spoils!',
    }),
  ]);
}

export function createSiegeGauntletDialogEncounter() {
  return new Encounter('siege_gauntlet_dialog', 'Beyond the Siege', 'Thorb knows another way into Tharnag.', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('With the siege line in ruins, the battlefield grows quiet. Thorb surveys the wreckage, then turns toward the mountainside.'),
        new EncounterText("The main gates are still sealed — my kin won't open them until they're sure the siege is truly over. But I know another way in. Follow me.", 'Thorb'),
        new EncounterText('He leads you along the base of the mountain, past collapsed tunnels and ancient stonework, until he stops at a narrow crack in the rock face half-hidden by rubble.'),
        new EncounterText("A side door. Only a few dwarves know about this one. It'll take us straight to the lower halls.", 'Thorb'),
      ],
    }),
  ]);
}

export function createTharnagSideDoorEncounter() {
  return new Encounter('tharnag_side_door', 'Side Door to Tharnag', 'A hidden passage into the dwarven city.', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('You squeeze through the narrow passage, the stone walls pressing close. The air changes — warmer, drier, carrying the distant ring of hammers and the smell of forge-fire.'),
        new EncounterText('Welcome to Tharnag.', 'Thorb'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.LOOT,
      lootTitle: 'Welcome to Tharnag',
      triggersLevelUp: true,
      levelUpTier: 2,
    }),
  ]);
}

// ============================================================
// Volcano Encounters
// ============================================================

export function createVolcanoArrivalEncounter() {
  return new Encounter('volcano_arrival', 'Volcano Slopes', 'The volcano slopes', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The ground beneath your feet shifts from earth to dark, porous rock. The volcano rises before you, its slopes scarred by ancient lava flows.'),
        new EncounterText('Heat radiates from fissures in the rock, and the air shimmers with waves of warmth. The smell of sulfur stings your nostrils.'),
        new EncounterText('Obsidian rocks jut from the ground like black glass teeth, their edges razor-sharp and gleaming in the harsh light. Nothing grows here.'),
      ],
    }),
    // Player can drop back into the labyrinth to grind / loot here. The
    // node is canRevisit, so the choice re-fires each time the player
    // returns to the volcano approach.
    new EncounterPhaseData({
      phaseType: EncounterPhase.CHOICE,
      choices: [
        new EncounterChoice(
          'Climb the volcano',
          'You shoulder your gear and start the long climb up the slope.',
          '', 0,
          { completesEncounter: true }
        ),
        new EncounterChoice(
          'Return to the Obsidian Wastes',
          'You retrace your steps. The labyrinth still calls — there may be more to find among its corridors.',
          'enter_obsidian_wastes', 1
        ),
      ],
    }),
  ]);
}

export function createVolcanoChoiceEncounter() {
  return new Encounter('volcano_choice', 'Volcano Base', 'A choice at the volcano base', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('You stand at the base of the volcano where the path diverges. One trail leads upward, switchbacking across the steep slope toward the smoking summit.'),
        new EncounterText('The other descends into a series of tunnels carved into the rock — whether by nature or by hand, you cannot tell. Warm air gusts from the tunnel mouth.'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.CHOICE,
      choices: [
        new EncounterChoice(
          'Climb toward the summit',
          'You begin the steep ascent, the heat growing more intense with every step.',
          '', 0
        ),
        new EncounterChoice(
          'Enter the tunnels below',
          'You duck into the tunnel entrance. The rock walls glow faintly with residual heat.',
          '', 0
        ),
      ],
    }),
  ]);
}

// ============================================================
// Obsidian Wastes Encounters
// ============================================================

// Obsidian Golem random encounter — fires randomly while crossing the
// labyrinth. Mirrors PY encounter.py:create_obsidian_golem_encounter.
export function createObsidianGolemEncounter() {
  return new Encounter('obsidian_golem', 'Obsidian Golem', 'A golem of living obsidian blocks the path.', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The ground trembles. A massive shape rises from the obsidian field — a golem of fused volcanic rock, its body crackling with each grinding movement.'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.COMBAT,
      enemyId: 'obsidian_golem',
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.LOOT,
      lootGoldDice: [2, 6],
      lootCards: ['obsidian_golem_loot'],
    }),
  ]);
}

// Obsidian Slime random encounter — fires randomly while crossing the
// labyrinth. Mirrors PY encounter.py:create_obsidian_slime_encounter.
export function createObsidianSlimeEncounter() {
  return new Encounter('obsidian_slime', 'Obsidian Slime', 'A mass of molten rock oozes toward you.', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('Something wet and heavy slithers across the obsidian. A slime of molten rock and volcanic glass oozes toward you, smaller blobs splitting off from its body as it moves.'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.COMBAT,
      enemyId: 'obsidian_slime',
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.LOOT,
      lootGoldDice: [2, 6],
      lootCards: ['obsidian_slime_loot'],
    }),
  ]);
}

// Obsidian Wastes arrival — PY copy. The party crosses into the lava
// flats north of Tharnag, with Val flagging the terrain risks.
// Mirrors PY encounter.py:create_obsidian_wastes_arrival_encounter.
export function createObsidianWastesArrivalEncounter() {
  return new Encounter('obsidian_wastes_arrival', 'The Obsidian Wastes', 'A vast field of frozen lava stretches before you.', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The Obsidian Wastes. A nearly endless field of frozen lava stretches in every direction, black glass glinting under a pale sky.'),
        new EncounterText('The ground looks stable enough. Recent cold must have solidified the upper layers. We should be able to cross without too much trouble.', 'Thorb'),
        new EncounterText("Without too much trouble. Famous last words from a dwarf standing on a volcano's doorstep.", 'Raena'),
        new EncounterText('I can feel the heat through my boots already. The deeper layers are still molten.', 'Val'),
        new EncounterText("There's no obvious path, but I can see the Volcano's peak to the north. We head straight for it and hope for the best.", 'Thorb'),
        new EncounterText("Hope for the best. Wonderful strategy. Let's go, then — hopefully in one piece.", 'Raena'),
        new EncounterText('Stay close. I know how quickly the haze can swallow you out here.', 'Val'),
        new EncounterText('As you venture deeper into the wastes, thick volcanic haze rises from cracks in the obsidian, cutting visibility to a few dozen paces. Every direction looks the same.'),
      ],
    }),
  ]);
}

export function createWastesNorthEncounter() {
  return new Encounter('wastes_north', 'Northern Wastes', 'The northern edge of the wastes', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('You reach the northern edge of the Obsidian Wastes. The terrain grows rougher here, the obsidian giving way to jagged basalt formations.'),
        new EncounterText('The volcano looms to the north, its peak wreathed in smoke and ash. Rivers of ancient lava have carved deep channels into the landscape, now cooled into twisted stone corridors.'),
      ],
    }),
    // Standing at the northern edge: push on into the Volcano, or stay
    // in the Wastes and grind another lap through the labyrinth. The
    // node is canRevisit, so the choice fires on every return trip.
    new EncounterPhaseData({
      phaseType: EncounterPhase.CHOICE,
      choices: [
        new EncounterChoice(
          'Push on toward the Volcano',
          'You leave the wastes behind and march toward the smoking peak. The heat thickens with every step.',
          'enter_volcano', 1
        ),
        new EncounterChoice(
          'Stay and search the labyrinth',
          'You turn back into the obsidian maze. There may still be threats — and rewards — among the molten corridors.',
          '', 0,
          { completesEncounter: true }
        ),
      ],
    }),
  ]);
}

// ============================================================
// Tharnag Interior Encounters
// ============================================================

export function createGrandHallArrivalEncounter() {
  return new Encounter('grand_hall_arrival', 'The Grand Hall', 'The vast Grand Hall of Tharnag stretches before you.', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText("HOME! FINALLY! Behold, my friends — THARNAG! The Great Dwarven City! Greatest city in all the land, and don't let anyone from Qualibaf tell you otherwise!", 'Thorb'),
        new EncounterText('The Grand Hall opens before you like the inside of a mountain cathedral. Massive stone pillars, carved with the faces of ancient dwarven kings, rise into darkness far above. Braziers of molten forge-light line the staircases, casting everything in a warm amber glow.'),
        new EncounterText('Everywhere you look, dwarves are moving with purpose. Soldiers in heavy plate haul crates of crossbow bolts up the stairs. Engineers argue over fortification plans spread across stone tables. A squad of militia drills with axes near the far wall.'),
        new EncounterText('The siege has clearly taken its toll — you can see scorched stone where goblin fire-bombs struck, and hastily erected barricades block some of the lower passages. But the hall itself stands firm, ancient and defiant.'),
      ],
    }),
  ]);
}

// Leaving Tharnag — first time the party crosses back outside after
// the throne audience. Sets up the route to the Obsidian Wastes /
// Volcano. Mirrors PY encounter.py:create_tharnag_exit_encounter.
export function createTharnagExitEncounter() {
  return new Encounter('tharnag_exit', 'Leaving Tharnag', 'Thorb outlines the road ahead.', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText("We need to get to the Volcano to figure out what the Kobold army is doing. They've probably infested the old dwarven ruins of Thorgazad — the City of Old — that sit below the Volcano.", 'Thorb'),
        new EncounterText("Thorgazad... I've heard stories. An entire city swallowed by the mountain.", 'Raena'),
        new EncounterText("Aye. If we use the path from here directly north of Qualibaf Forest, it'll be faster — and we avoid the bridge area, which is probably also infested by Kobolds.", 'Thorb'),
        new EncounterText('So we head north through the wastes. How bad can it be?', 'Raena'),
        new EncounterText('The Obsidian Wastes? Frozen lava fields as far as the eye can see. Not much lives out there, which is either a comfort or a warning.', 'Thorb'),
        new EncounterText("I've patrolled the edges of the Wastes before. The ground shifts underfoot — obsidian is sharp and treacherous. Watch your step out there.", 'Val'),
        new EncounterText('Since when do you patrol lava fields?', 'Thorb'),
        new EncounterText("Since you vanished and someone had to keep this kingdom from falling apart. Let's move.", 'Val'),
      ],
    }),
  ]);
}

// Upper Stairs return — fires when the party heads back through the
// Grand Hall's upper stairs after the throne audience and Valdrisa.
// Sets up the Artisan Hall side trip. Mirrors PY
// encounter.py:create_upper_stairs_return_encounter.
export function createUpperStairsReturnEncounter() {
  return new Encounter('upper_stairs_return', 'Upper Stairs', 'Back in the Grand Hall.', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText("So, a prince. This whole time we've been adventuring with dwarven royalty and you never thought to mention it?", 'Raena'),
        new EncounterText("Would it have changed anything? Besides, 'prince' is a strong word. More like... fifteenth in line for the throne. Maybe sixteenth. I lost count.", 'Thorb'),
        new EncounterText('The King mentioned the Artisans. We should head to the Artisan Hall before we leave — see what supplies they can spare for the road ahead.', 'Raena'),
        new EncounterText("Right, the Artisan Hall is just off the lower stairs. Fair warning though — with the Great Forge cold, the smiths can't produce new work. Whatever they have in stock is all there is.", 'Thorb'),
        new EncounterText("Limited supplies are better than no supplies. Let's see what they've got.", 'Raena'),
      ],
    }),
  ]);
}

// Valdrisa Emberforge — joins the party as you leave the Personal
// Quarters. Mirrors PY encounter.py:create_valdrisa_encounter.
export function createValdrisaEncounter() {
  return new Encounter('valdrisa_encounter', 'Valdrisa Emberforge', 'A dwarven princess blocks your path.', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('As you step into the hallway, a young dwarven woman in finely crafted armor steps out from an alcove, arms crossed. Her auburn hair is braided with gold rings, and her eyes burn with a fierce determination.'),
        new EncounterText('Going away without saying goodbye again, Thorbadin?', '???'),
        new EncounterText("Val... I— It's not like that. We have to move quickly—", 'Thorb'),
        new EncounterText("It's exactly like that. You vanished for months. Your father sends word you're alive, and before I can even see you, you're already packing to leave.", 'Valdrisa'),
        new EncounterText("Valdrisa Emberforge. Thorb's... betrothed.", 'Raena'),
        new EncounterText("Look, Val, the Kobolds are massing at the Volcano. If we don't stop them—", 'Thorb'),
        new EncounterText("Then you'll need someone who can actually keep you alive out there. I'm coming with you.", 'Valdrisa'),
        new EncounterText('Absolutely not. Father would—', 'Thorb'),
        new EncounterText("Your father gave me this armor himself. He knows I'm twice the fighter you are, and he'd rather have me watching your back than some hired swords.", 'Valdrisa'),
        new EncounterText("She's got you there.", 'Raena'),
        new EncounterText('...Fine. But you follow my lead out there.', 'Thorb'),
        new EncounterText('Of course, my prince.', 'Valdrisa'),
        new EncounterText("Call me Val. All of you. And let's get moving before Thorb changes his mind.", 'Valdrisa'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.LOOT,
      lootCards: ['valdrisa_card'],
      lootTitle: 'Val joins the party!',
    }),
  ]);
}

// Personal Quarters — bed rest. Mirrors PY
// encounter.py:create_quarters_rest_encounter.
export function createQuartersRestEncounter() {
  return new Encounter('quarters_rest', 'Rest', 'A well-earned rest in the Personal Quarters.', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The bed is surprisingly comfortable for dwarven make — thick furs piled atop a stone frame, warm from the forge-heated walls.'),
        new EncounterText('You sink into the furs and sleep overtakes you almost instantly. For the first time in days, you rest without one eye open.'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.CHOICE,
      choicePrompt: 'Rest for the night?',
      choices: [
        new EncounterChoice(
          'Sleep',
          'You sleep soundly through the night, waking refreshed and ready.',
          'quarters_rest', 0,
        ),
        new EncounterChoice(
          'Not yet',
          'You decide to look around a bit more first.',
          '', 0,
        ),
      ],
    }),
  ]);
}

// Personal Quarters — chest of belongings. Mirrors PY
// encounter.py:create_quarters_chest_encounter. Drops 50 gold +
// Queen's Locket. One-shot.
export function createQuartersChestEncounter() {
  return new Encounter('quarters_chest', 'Chest with Personal Belongings', 'A wooden chest left for the party.', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText("The chest has been prepared with care. A note on top reads: 'For the companions of Prince Thorbadin. May these serve you well on the road ahead. - By order of King Thorgrim.'"),
        new EncounterText("Inside the chest, nestled in velvet, lies a delicate golden locket set with a pale blue gem. A small card reads: 'From Queen Eirdrís. Keep my son safe.'"),
        new EncounterText('Prince Thorbadin?', 'Raena'),
        new EncounterText("Don't. Just... don't.", 'Thorb'),
        new EncounterText("Your mother's locket? Thorb...", 'Raena'),
        new EncounterText('She always said it brought her luck. I suppose she wants it to bring us some too.', 'Thorb'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.LOOT,
      lootGold: 50,
      lootCards: ['queens_locket'],
      lootTitle: 'Personal Belongings',
    }),
  ]);
}

// Throne Room arrival — first sight of the King + the family reveal.
// Mirrors PY encounter.py:create_throne_room_arrival_encounter.
export function createThroneRoomArrivalEncounter() {
  return new Encounter('throne_room_arrival', 'The Throne Room', 'The Throne Room of Tharnag.', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The Throne Room of Tharnag is a sight to behold. Enormous pillars of dark stone frame a raised dais, upon which sits a throne carved from a single block of obsidian. And upon that throne sits a broad-shouldered dwarf with a magnificent silver beard braided with golden rings.'),
        new EncounterText('THORBADIN! MY SON! You have come back!', 'King Thorgrim'),
        new EncounterText('The King rises from his throne and descends the steps with surprising speed for his age. He seizes Thorb in a crushing embrace that lifts the younger dwarf clean off his feet.'),
        new EncounterText('Come here so your father can see you! Let me look at you after all this time!', 'King Thorgrim'),
        new EncounterText('...Son? THORB, is there something you want to tell us?', 'Raena'),
        new EncounterText("He's... my father. And I was SUPPOSED to marry some Northern Dwarven Princess. No way I was going to do that this young!", 'Thorb'),
        new EncounterText('How old ARE you exactly?', 'Raena'),
        new EncounterText('A hundred and twenty-five years young!', 'Thorb'),
      ],
    }),
  ]);
}

// Throne audience — the White Claw briefing + the King's blessing.
// Mirrors PY encounter.py:create_throne_audience_encounter.
export function createThroneAudienceEncounter() {
  return new Encounter('throne_audience', 'Audience with the King', 'An audience with King Thorgrim.', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText("The King pulls back from the embrace, his hands still on Thorb's shoulders. His expression shifts from joy to concern."),
        new EncounterText('I am so glad you are back, son. Finally ready to accept your destiny!', 'King Thorgrim'),
        new EncounterText('Father... not exactly. But we bring urgent news from Qualibaf. An army of kobolds is preparing to besiege the city. Many clans have been united under something called the White Claw — whatever or whoever that is.', 'Thorb'),
        new EncounterText('This is concerning indeed. But as you may have seen, we are dealing with our own goblin problems! I cannot spare many resources. And worse — the flow of lava from the volcano has stopped. The Great Forge is cold when we need it most.', 'King Thorgrim'),
        new EncounterText("But Father — my King — it HAS to be related! The kobolds, this White Claw... they're messing with the Volcano, and it's lowering the temperature of the whole valley! The snow, the ice in the mountains — the signs are all there!", 'Thorb'),
        new EncounterText('Hmm... perhaps you are right. In any case, thanks in no small part to your efforts and your friends here, the siege is broken for now. But they will come back. And eventually they will attack the tunnels as well.', 'King Thorgrim'),
        new EncounterText('Thorb! My son! I commend you for bringing these tidings to me. Investigate the Volcano and this White Claw. I will ask the Artisans to assist you on your quest. May Moradin guide your hammer and see you home safe!', 'King Thorgrim'),
      ],
    }),
  ]);
}

// Grand Staircase arrival — Thorb's homecoming dialog. Mirrors PY
// encounter.py:create_grand_staircase_arrival_encounter.
export function createGrandStaircaseArrivalEncounter() {
  return new Encounter('grand_staircase_arrival', 'The Grand Staircase', 'A monumental staircase hewn from the living rock.', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText("It's been years since I walked these stairs. Years! It's... it's really good to be back.", 'Thorb'),
        new EncounterText('Years? You RAN AWAY from a dwarven city? What could possibly make someone leave all this behind?', 'Raena'),
        new EncounterText("I didn't RUN AWAY! I... left. Strategically. My father wanted me to marry some Northern Dwarven Princess. Can you imagine? ME? Married? At my age?", 'Thorb'),
        new EncounterText('...!!', 'Raena'),
        new EncounterText("Anyway! Enough about that. Let's go meet the King and tell him why we're here in the first place.", 'Thorb'),
        new EncounterText("Yes, though it looks like they have their own problems with that goblin army outside. I'm not sure how many resources they'll be able to spare for the kobolds menacing Qualibaf.", 'Raena'),
        new EncounterText("We've always had trouble with goblins, but usually they attack from underground and never in any real numbers. This is... different. Come, let's head up to see the King.", 'Thorb'),
      ],
    }),
  ]);
}

// Dwarven Tavern — short dialog, then auto-open shop. Mirrors PY
// encounter.py:create_dwarven_tavern_encounter.
export function createDwarvenTavernEncounter() {
  return new Encounter('dwarven_tavern', 'Dwarven Tavern', 'A warm tavern in the Artisan Hall.', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The tavern is carved into the rock wall, its low ceiling blackened by centuries of hearth smoke. A handful of dwarves sit at stone tables, nursing mugs of dark ale.'),
        new EncounterText("The barkeep, a stout dwarf with a braided beard reaching his belt, nods as you approach. \"What'll it be? We've still got brew, even if the forge is cold.\"", 'Barkeep'),
        new EncounterText('A few younger dwarves at the corner table look up with interest. One of them, lean and sharp-eyed with a light crossbow propped against his chair, speaks up.'),
        new EncounterText("\"You're the ones heading out to deal with the White Claw, aye? We've been sitting here long enough. Some of us are scouts — we know the mountain passes better than anyone.\"", 'Dwarven Scout'),
        new EncounterText("\"Could use eyes on the road ahead. Buy a round and we'll talk business.\"", 'Barkeep'),
      ],
    }),
  ]);
}

// Dwarven Smithy — short dialog, then auto-open shop. Mirrors PY
// encounter.py:create_dwarven_smithy_encounter.
export function createDwarvenSmithyEncounter() {
  return new Encounter('dwarven_smithy', 'Dwarven Smithy', 'The finest dwarven arms and armor.', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText("The smithy is enormous — rows of anvils and quenching troughs stretch back into the darkness. Without the Great Forge's heat, only a few small fires still burn."),
        new EncounterText("A scarred dwarven smith looks up from polishing a crossbow. \"Can't make new work without the Forge, but we've got stock. Finest dwarven craft — built to last a thousand years.\"", 'Smith'),
      ],
    }),
  ]);
}

// ============================================================
// Dwarven City — Entry Corridor / Gate
// ============================================================

export function createEntryCorridorArrivalEncounter() {
  return new Encounter('entry_corridor_arrival', 'Entry Corridor', 'A ruined dwarven corridor', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('You step into a long corridor carved from living stone. The walls bear the remnants of dwarven bas-reliefs, their details worn smooth by time.'),
        new EncounterText('Ancient stonework stretches ahead, the craftsmanship still evident despite centuries of neglect. Fallen masonry litters the floor.'),
        new EncounterText('Dust hangs thick in the still air. The silence here is absolute — the deep, patient silence of a place long abandoned.'),
      ],
    }),
  ]);
}

export function createCorridorGateApproachEncounter() {
  return new Encounter('corridor_gate_approach', 'Gate Approach', 'A massive gate blocks the corridor', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('A massive gate looms ahead, its iron surface etched with dwarven runes that still faintly glow.'),
        new EncounterText('As you approach, stone grinds against stone. An Obsidian Golem pulls itself free from the wall, its eyes blazing with ancient fire.'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.COMBAT,
      enemyId: 'obsidian_golem',
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The golem crumbles into shards of obsidian, its protective enchantment finally spent. The gate stands unguarded.'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.LOOT,
      lootGoldDice: [3, 6],
    }),
  ]);
}

export function createGateGuardroomEncounter() {
  return new Encounter('gate_guardroom', 'Guardroom', 'An old guardroom near the gate', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('A side chamber opens into what was once the gate guardroom. Weapon racks line the walls, though most are empty now.'),
        new EncounterText('A few crates and barrels remain in the corner, their contents unknown. Supplies may yet be salvageable.'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.CHOICE,
      choices: [
        new EncounterChoice(
          'Search for supplies',
          'You dig through the crates and find some provisions the dwarves left behind. Still usable, remarkably.',
          'search_camp', 1
        ),
        new EncounterChoice(
          'Leave',
          '',
          '', 0
        ),
      ],
    }),
  ]);
}

export function createGatePassageEncounter() {
  return new Encounter('gate_passage', 'Gate Passage', 'A passage deeper into the city', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('Beyond the gate, the passage widens into a broad thoroughfare leading deeper into the dwarven city.'),
        new EncounterText('Echoes drift from ahead — the creak of stone, the whisper of air currents through vast chambers. The city awaits.'),
      ],
    }),
  ]);
}

// ============================================================
// Dwarven City — Hall of Ancestors
// ============================================================

export function createRugaSlaveMasterEncounter() {
  return new Encounter('ruga_slave_master', 'Ruga the Slave Master', 'A massive ogre blocks the path', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('A shaft of daylight pierces the chamber from a crack in the ceiling high above. Dust motes drift lazily through the beam.'),
        new EncounterText('Beneath the light stands a massive ogre, his scarred hide draped in chains and trophies. Ruga, the Slave Master. The crack of his whip echoes off the stone.'),
        new EncounterText('He spots you and grins, revealing tusks filed to points. "Fresh meat for the pits," he snarls, raising his weapon.'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.COMBAT,
      enemyId: 'ruga_slave_master',
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('Ruga crashes to the ground, his whip clattering across the stone. The hall falls silent at last.'),
        new EncounterText('With the Slave Master gone, the path deeper into the ancestors\' domain lies open.'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.LOOT,
      lootGoldDice: [3, 6],
    }),
  ], true);
}

export function createMonumentAlleyEntryEncounter() {
  return new Encounter('monument_alley_entry', 'Monument Alley', 'A row of dwarven monuments', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('You walk between rows of carved stone monuments, each one depicting a dwarven hero of ages past.'),
        new EncounterText('Their names are etched in deep runes beneath stern, bearded faces. Even in ruin, the honor of the ancestors endures.'),
      ],
    }),
  ]);
}

// ============================================================
// Dwarven City — Tomb
// ============================================================

export function createTombOfAncestorEntryEncounter() {
  return new Encounter('tomb_of_ancestor_entry', 'Tomb of the Ancestor', 'A sacred dwarven tomb', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('You enter a sacred tomb carved deep into the mountain\'s heart. The air is cool and still, heavy with reverence.'),
        new EncounterText('Golden light spills from rune-etched braziers that have burned for centuries without fuel, casting warm shadows across the vaulted ceiling.'),
        new EncounterText('You sense a presence here — not hostile, but watchful. The ancestor spirits have not abandoned this place.'),
      ],
    }),
  ]);
}

export function createTombSarcophagusEncounter() {
  return new Encounter('tomb_sarcophagus', 'The Sarcophagus', 'An ornate dwarven sarcophagus', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('At the chamber\'s center rests an ornate sarcophagus of white marble veined with gold. The likeness of a dwarven king is carved into its lid, his hands folded over a stone warhammer.'),
        new EncounterText('Runes circle the base, their meaning lost to you, but the power radiating from them is unmistakable — a steady pulse like a heartbeat in the stone.'),
        new EncounterText('This was no ordinary dwarf. A king rests here, and his legacy still holds sway over the mountain.'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.CHOICE,
      choices: [
        new EncounterChoice(
          'Pray to the Ancestor',
          'You kneel before the sarcophagus and bow your head. Warmth spreads through you as the golden light intensifies. The ancestor\'s blessing settles over you like a mantle.',
          'pray_shrine', 1
        ),
        new EncounterChoice(
          'Leave respectfully',
          '',
          '', 0
        ),
      ],
    }),
  ]);
}

// ============================================================
// Dwarven City — Stairs / Throne
// ============================================================

export function createGrandStairsEntryEncounter() {
  return new Encounter('grand_stairs_entry', 'Grand Stairs', 'A grand dwarven staircase', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('A grand staircase spirals upward through the mountain, each step carved from a single block of granite.'),
        new EncounterText('The banisters are shaped like interlocking hammers and anvils — dwarven craftsmanship at its finest, even in something as simple as stairs.'),
      ],
    }),
  ]);
}

export function createDwarvenThroneRoomEntryEncounter() {
  return new Encounter('dwarven_throne_room_entry', 'Throne Room', 'The entrance to the throne room', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('You stand at the entrance to Tharnag\'s throne room. The doors — each thirty feet tall and bound in mithril — hang open on broken hinges.'),
        new EncounterText('Beyond them lies a vast chamber draped in shadow. The throne itself is barely visible at the far end, a dark shape on a raised dais.'),
        new EncounterText('Something shifts in the darkness. The shadows here feel alive, coiling and watching. You are not alone.'),
      ],
    }),
  ]);
}

export function createThroneSpecterEncounter() {
  return new Encounter('throne_specter', 'The Specter King', 'A spectral figure guards the throne', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('A spectral figure materializes on the throne, translucent and flickering with pale blue light. The ghost of a dwarven king, his crown still bright upon his brow.'),
        new EncounterText('He rises, ancient armor shimmering, and levels a ghostly warhammer at you. His voice echoes from everywhere and nowhere.'),
        new EncounterText('"None shall claim this throne who have not proven their worth. Defend yourself, intruder!"'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.COMBAT,
      enemyId: 'dwarven_specter',
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The specter flickers and fades, his expression shifting from fury to something like approval. "Perhaps... you are worthy after all."'),
        new EncounterText('The throne room falls silent. The seat of power stands empty, its guardian at rest.'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.LOOT,
      lootGoldDice: [4, 6],
    }),
  ]);
}

// ============================================================
// Dwarven City — Map Room
// ============================================================

export function createMapRoomEntryEncounter() {
  return new Encounter('map_room_entry', 'Map Room', 'A room with ancient maps', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('You enter a chamber dominated by a great stone table. Its surface is not flat but sculpted — a detailed topographic map carved directly into the rock.'),
        new EncounterText('Ancient maps of the dwarven city and surrounding tunnels are etched into the walls, their paths and chambers marked with tiny rune-labels.'),
      ],
    }),
  ]);
}

export function createMapTableEncounter() {
  return new Encounter('map_table', 'The Map Table', 'A detailed stone map of the city', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The stone table bears a remarkably detailed map of the entire dwarven city. Tunnels, chambers, forges, and halls are all meticulously rendered.'),
        new EncounterText('Studying it carefully could reveal hidden paths and forgotten chambers that would otherwise take weeks to discover.'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.CHOICE,
      choices: [
        new EncounterChoice(
          'Study the map',
          'You spend time tracing the carved pathways with your fingers. The layout of the city becomes clearer, and you feel more confident navigating these halls.',
          'short_rest', 3
        ),
        new EncounterChoice(
          'Leave',
          '',
          '', 0
        ),
      ],
    }),
  ]);
}

// ============================================================
// Dwarven City — Tunnels / Artisan
// ============================================================

export function createDeeperTunnelsEntryEncounter() {
  return new Encounter('deeper_tunnels_entry', 'Deeper Tunnels', 'Narrow tunnels descend further', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The corridor narrows and descends. Pick marks score the walls here — this section was still being carved when the city fell.'),
        new EncounterText('The air grows warmer as you go deeper, carrying a faint mineral tang. The tunnels branch and twist ahead.'),
      ],
    }),
  ]);
}

export function createArtisanDistrictEntryEncounter() {
  return new Encounter('artisan_district_entry', 'Artisan District', 'The workshops and forges of Tharnag', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('You emerge into a broad cavern lined with workshops and forges. Anvils stand at cold hearths, and tools hang in orderly rows along the walls.'),
        new EncounterText('This was the beating heart of dwarven industry — where master smiths and artisans plied their craft. The district stretches on in every direction.'),
        new EncounterText('The silence is oppressive. These forges once rang with the sound of hammers day and night. Now only dust and memory remain.'),
      ],
    }),
  ]);
}

export function createArtisanWorkshopEncounter() {
  return new Encounter('artisan_workshop', 'Artisan Workshop', 'An intact dwarven workshop', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('You find a workshop in remarkable condition. The forge is intact, its chimney still drawing air, and racks of half-finished work line the walls.'),
        new EncounterText('With some effort, this forge could be put to use. The dwarven tools here are of exceptional quality.'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.CHOICE,
      choices: [
        new EncounterChoice(
          'Use the forge',
          'dwarven_smithy',
          'open_shop', 0
        ),
        new EncounterChoice(
          'Leave',
          '',
          '', 0
        ),
      ],
    }),
  ]);
}

// Registry: encounter_id -> creator function
export const ENCOUNTER_REGISTRY = {
  giant_rat: createGiantRatEncounter,
  locked_door: createLockedDoorEncounter,
  bone_pile: createBonePileEncounter,
  crack: createCrackEncounter,
  splash_point: createSplashPointEncounter,
  dead_end: createDeadEndEncounter,
  tight_opening: createTightOpeningEncounter,
  lost_shrine: createLostShrineEncounter,
  sewer_junction: createSewerJunctionEncounter,
  abandoned_camp: createAbandonedCampEncounter,
  upward_passage: createUpwardPassageEncounter,
  kitchen: createKitchenEncounter,
  prison_entrance: createPrisonEntranceEncounter,
  leave_prison: createLeavePrisonEncounter,
  prison_wing: createPrisonWingEncounter,
  corner_cell: createCornerCellEncounter,
  mountain_camp: createMountainCampEncounter,
  mountain_pass: createMountainPassEncounter,
  calm_stream: createCalmStreamEncounter,
  general_zhost: createGeneralZhostEncounter,
  calm_grove: createCalmGroveEncounter,
  to_the_plains: createToThePlainsEncounter,
  // Plains
  bone_valley: createBoneValleyEncounter,
  wolf_blizzard: createWolfBlizzardEncounter,
  // Cave
  cave_entrance: createCaveEntranceEncounter,
  cave_ledge: createCaveLedgeEncounter,
  cave_river_landing: createCaveRiverLandingEncounter,
  underground_river: createUndergroundRiverEncounter,
  // Ruins Basin
  piranha_pool: createPiranhaPoolEncounter,
  pool_south: createPoolSouthEncounter,
  pool_exit: createPoolExitEncounter,
  conservatory_wing: createConservatoryWingEncounter,
  flooded_passage: createFloodedPassageEncounter,
  dark_corridor: createDarkCorridorEncounter,
  sentinel_patrol_sighting: createSentinelPatrolSightingEncounter,
  boss_wing_sentinel_combat: createBossWingSentinelCombatEncounter,
  boss_wing_priest_combat: createBossWingPriestCombatEncounter,
  flooded_altar: createFloodedAltarEncounter,
  old_god_statue: createOldGodStatueEncounter,
  passage_ambush: createPassageAmbushEncounter,
  cave_exit: createCaveExitEncounter,
  river_crossing: createRiverCrossingEncounter,
  south_gate: createSouthGateEncounter,
  sahuagin_sentinel: createSahuaginSentinelEncounter,
  // City Shops
  city_square: createCitySquareEncounter,
  weaponsmith: createWeaponsmithEncounter,
  armorsmith: createArmorsmithEncounter,
  general_store: createGeneralStoreEncounter,
  inn: createInnEncounter,
  church: createChurchEncounter,
  arcane_emporium: createArcaneEmporiumEncounter,
  antiquity_shop: createAntiquityShopEncounter,
  antiquity_shop_cleared: createAntiquityShopClearedEncounter,
  guild_hall: createGuildHallEncounter,
  city_north_gate: createCityNorthGateEncounter,
  // North Qualibaf
  north_crossroad: createNorthCrossroadEncounter,
  filibaf_entrance: createFilibafEntranceEncounter,
  // Forest
  forest_shadows: createForestShadowsEncounter,
  forest_shadows_revisit: createForestShadowsRevisitEncounter,
  forest_ambush_left: createForestAmbushLeftEncounter,
  forest_ambush_right: createForestAmbushRightEncounter,
  forest_clearing: createForestClearingEncounter,
  // Tharnag
  tharnag_arrival: createTharnagArrivalEncounter,
  siege_gauntlet_1: createSiegeGauntlet1Encounter,
  siege_gauntlet_2: createSiegeGauntlet2Encounter,
  siege_gauntlet_3: createSiegeGauntlet3Encounter,
  siege_gauntlet_dialog: createSiegeGauntletDialogEncounter,
  tharnag_side_door: createTharnagSideDoorEncounter,
  // Volcano
  volcano_arrival: createVolcanoArrivalEncounter,
  volcano_choice: createVolcanoChoiceEncounter,
  // Obsidian Wastes
  obsidian_wastes_arrival: createObsidianWastesArrivalEncounter,
  obsidian_golem: createObsidianGolemEncounter,
  obsidian_slime: createObsidianSlimeEncounter,
  wastes_north: createWastesNorthEncounter,
  // Tharnag Interior
  grand_hall_arrival: createGrandHallArrivalEncounter,
  grand_staircase_arrival: createGrandStaircaseArrivalEncounter,
  throne_room_arrival: createThroneRoomArrivalEncounter,
  throne_audience: createThroneAudienceEncounter,
  quarters_rest: createQuartersRestEncounter,
  quarters_chest: createQuartersChestEncounter,
  valdrisa_encounter: createValdrisaEncounter,
  upper_stairs_return: createUpperStairsReturnEncounter,
  tharnag_exit: createTharnagExitEncounter,
  dwarven_tavern: createDwarvenTavernEncounter,
  dwarven_smithy: createDwarvenSmithyEncounter,
  // Dwarven City — Entry Corridor / Gate
  entry_corridor_arrival: createEntryCorridorArrivalEncounter,
  corridor_gate_approach: createCorridorGateApproachEncounter,
  gate_guardroom: createGateGuardroomEncounter,
  gate_passage: createGatePassageEncounter,
  // Dwarven City — Hall of Ancestors
  ruga_slave_master: createRugaSlaveMasterEncounter,
  monument_alley_entry: createMonumentAlleyEntryEncounter,
  // Dwarven City — Tomb
  tomb_of_ancestor_entry: createTombOfAncestorEntryEncounter,
  tomb_sarcophagus: createTombSarcophagusEncounter,
  // Dwarven City — Stairs / Throne
  grand_stairs_entry: createGrandStairsEntryEncounter,
  dwarven_throne_room_entry: createDwarvenThroneRoomEntryEncounter,
  throne_specter: createThroneSpecterEncounter,
  // Dwarven City — Map Room
  map_room_entry: createMapRoomEntryEncounter,
  map_table: createMapTableEncounter,
  // Dwarven City — Tunnels / Artisan
  deeper_tunnels_entry: createDeeperTunnelsEntryEncounter,
  artisan_district_entry: createArtisanDistrictEntryEncounter,
  artisan_workshop: createArtisanWorkshopEncounter,
};
