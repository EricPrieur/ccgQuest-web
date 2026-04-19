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
  return new Encounter('mountain_pass', 'Mountain Pass', 'A narrow pass through the peaks', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The path narrows as it climbs between two towering cliff faces. Wind howls through the gap, whipping at your clothes and stinging your eyes.'),
        new EncounterText('Loose scree crunches underfoot, and the drop to your left is dizzying. One wrong step and you\'d tumble into the abyss.'),
        new EncounterText('Movement ahead — a patrol of Kobolds picks its way along the pass, their crude weapons glinting in the sunlight. They spot you and screech an alarm!'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.COMBAT,
      enemyId: 'kobold_patrol',
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The last Kobold tumbles over the edge with a fading shriek. The pass is clear.'),
        new EncounterText('You press on through the narrow gap, the wind at your back now. The path begins to descend on the other side.'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.LOOT,
      lootGoldDice: [2, 6],
    }),
  ]);
}

export function createCalmStreamEncounter() {
  return new Encounter('calm_stream', 'Calm Stream', 'A peaceful mountain stream', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The path opens into a small clearing where a crystal-clear stream bubbles over smooth stones. The water is cold and clean, fed by snowmelt from the peaks above.'),
        new EncounterText('After the stench of the sewers and the dust of the pass, this place feels like paradise. Birds sing in the branches overhead.'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.CHOICE,
      choices: [
        new EncounterChoice(
          'Rest by the stream',
          'You sit beside the stream and drink deeply, letting the cold water wash away the grime and fatigue. The gentle sound of flowing water soothes your nerves.',
          'short_rest', 3
        ),
        new EncounterChoice(
          'Continue on',
          'You fill your waterskin and press onward. There will be time to rest when you reach Qualibaf.',
          '', 0
        ),
      ],
    }),
  ]);
}

export function createGeneralZhostEncounter() {
  return new Encounter('general_zhost', 'River Crossing', 'A dramatic confrontation', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The mountain path opens onto a wide river crossing — a stone bridge spanning churning rapids. But the bridge is not unguarded.'),
        new EncounterText('Dozens of Kobold soldiers stand in formation on the far bank, their spears raised and shields locked. At their center, mounted on a snarling warg, sits a Kobold unlike any you\'ve seen before.'),
        new EncounterText('Clad in blackened armor etched with crimson runes, the Kobold commander surveys your approach with cold, calculating eyes. A tattered banner snaps in the wind behind it.'),
        new EncounterText('"You escaped the prison, but you will not escape ME. I am General Zhost, and this river marks the end of your journey!"', 'General Zhost'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.COMBAT,
      enemyId: 'kobold_patrol',
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('General Zhost\'s army scatters in disarray, the surviving Kobolds fleeing into the rocks. The general himself vanishes in the chaos, leaving behind only a snarled promise of revenge.'),
        new EncounterText('The river crossing is clear. You step onto the bridge, the roar of the rapids beneath your feet, and cross to the other side.'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.LOOT,
      lootGoldDice: [3, 6],
      lootCards: ['white_claw'],
    }),
  ], true);
}

export function createCalmGroveEncounter() {
  return new Encounter('calm_grove', 'Calm Grove', 'A sheltered grove of ancient trees', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('You enter a sheltered grove where ancient trees form a natural canopy overhead. Dappled sunlight filters through the leaves, and the air smells of moss and wildflowers.'),
        new EncounterText('This place has a timeless quality, as though the mountain itself has been protecting this grove for centuries.'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.CHOICE,
      choices: [
        new EncounterChoice(
          'Rest here',
          'You settle beneath the largest tree and close your eyes. The grove seems to embrace you, and when you wake, your wounds feel lighter.',
          'short_rest', 5
        ),
        new EncounterChoice(
          'Search for herbs',
          'You forage among the undergrowth, finding clusters of medicinal plants growing between the roots of the ancient trees.',
          'search_camp', 1
        ),
        new EncounterChoice(
          'Move on',
          'You pass through the grove without stopping, though you feel a pang of regret as the canopy thins behind you.',
          '', 0
        ),
      ],
    }),
  ]);
}

export function createToThePlainsEncounter() {
  return new Encounter('to_the_plains', 'To the Plains', 'The mountain path descends', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The mountain path begins its final descent, switchbacking down a rocky slope. The air grows warmer with each step, and the harsh mountain winds give way to gentle breezes.'),
        new EncounterText('Below you, the plains stretch to the horizon — golden grasslands rippling like an ocean under the afternoon sun. Roads wind between distant farmsteads and clusters of trees.'),
        new EncounterText('And there, nestled where the plains meet the foothills, you see it: the walls and towers of Qualibaf, smoke rising from its chimneys. Your destination is finally within reach.'),
      ],
    }),
  ]);
}

// ============================================================
// Plains Encounters
// ============================================================

export function createBoneValleyEncounter() {
  return new Encounter('bone_valley', 'Bone Valley', 'A barren valley of bones', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The path descends into a barren valley strewn with sun-bleached bones. Ribcages and skulls of creatures long dead litter the cracked earth.'),
        new EncounterText('An eerie silence hangs over the valley. No wind stirs, no birds call. Even your footsteps seem muffled, swallowed by the oppressive stillness.'),
        new EncounterText('The bones begin to tremble. One by one they rattle and roll, drawn together by unseen force. They fuse and stack, forming a towering amalgamation of death that lurches toward you!'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.COMBAT,
      enemyId: 'bone_amalgam',
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The bone amalgam shatters apart, its fragments scattering across the valley floor. Whatever dark energy held it together dissipates like smoke.'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.LOOT,
      lootGoldDice: [2, 6],
    }),
  ]);
}

export function createWolfBlizzardEncounter() {
  return new Encounter('wolf_blizzard', 'Wolf Blizzard', 'A blizzard brings wolves', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('A blizzard sweeps across the plains without warning, the sky darkening as snow and ice lash at your face. Visibility drops to nothing.'),
        new EncounterText('Through the howling wind, you hear wolves — their cries rising and falling, circling closer with each pass.'),
        new EncounterText('Yellow eyes appear in the white curtain of snow. A pack of wolves emerges from the storm, teeth bared, moving in coordinated silence.'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.COMBAT,
      enemyId: 'wolf_pack',
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The surviving wolves scatter into the fading storm, their howls growing distant.'),
        new EncounterText('As the blizzard clears, you spot the dark mouth of a cave in the hillside ahead, half-hidden by drifted snow.'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.CHOICE,
      choices: [
        new EncounterChoice(
          'Enter the cave',
          'You push through the snow toward the cave entrance. Anything is better than being caught in the open.',
          'enter_cave', 1
        ),
        new EncounterChoice(
          'Turn back',
          'You press on across the plains, leaving the cave behind. The storm is fading — you can make it.',
          '', 0
        ),
      ],
    }),
  ]);
}

// ============================================================
// Cave Encounters
// ============================================================

export function createCaveEntranceEncounter() {
  return new Encounter('cave_entrance', 'Cave Entrance', 'A dark cave entrance', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The cave mouth yawns before you, a jagged opening in the rock face. Cold air flows outward, carrying the smell of damp stone and something older.'),
        new EncounterText('You light a torch, but its flame barely pushes back the darkness. The walls glisten with moisture, and the passage slopes steadily downward.'),
      ],
    }),
  ]);
}

export function createCaveLedgeEncounter() {
  return new Encounter('cave_ledge', 'Cave Ledge', 'A narrow ledge over a chasm', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The passage opens onto a narrow ledge overlooking a vast underground chasm. The far side is lost in shadow, and loose pebbles tumble silently into the void.'),
        new EncounterText('The rock beneath your feet is slick with condensation. One careless step could send you over the edge.'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.CHOICE,
      choices: [
        new EncounterChoice(
          'Climb down carefully',
          'You press yourself flat against the rock and inch along the ledge, fingers gripping every crack and crevice. The stone crumbles in places, but you make it across.',
          'try_squeeze', 1
        ),
        new EncounterChoice(
          'Go back',
          'You step away from the edge. The chasm is too treacherous to risk.',
          '', 0
        ),
      ],
    }),
  ]);
}

export function createCaveRiverLandingEncounter() {
  return new Encounter('cave_river_landing', 'River Landing', 'An underground river', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The ledge deposits you on a rocky shelf beside an underground river. Dark water rushes past, its current strong and steady.'),
        new EncounterText('The sound of rushing water echoes off the cavern walls, filling the space with a constant low roar.'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.CHOICE,
      choices: [
        new EncounterChoice(
          'Follow the river',
          'You pick your way along the riverbank, following the current downstream into deeper darkness.',
          '', 0
        ),
        new EncounterChoice(
          'Rest here',
          'You settle onto the dry stone and drink from the river. The water is cold and clean. After a while, you feel renewed.',
          'short_rest', 3
        ),
      ],
    }),
  ]);
}

export function createUndergroundRiverEncounter() {
  return new Encounter('underground_river', 'Underground River', 'The river leads to ruins', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The river pulls you through a low tunnel and spills into a vast flooded chamber. Ancient stone walls rise from the water, carved with symbols you cannot read.'),
        new EncounterText('Pillars of worked stone break the surface, remnants of a civilization that built beneath the earth. Pale light filters from cracks in the ceiling far above.'),
        new EncounterText('The water stirs near a submerged archway. A scaled figure rises from the depths, trident in hand, its cold eyes fixed on you.'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.COMBAT,
      enemyId: 'sahuagin_sentinel',
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The sentinel sinks beneath the dark water, its trident clattering against the stone floor below.'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.LOOT,
      lootGoldDice: [2, 6],
    }),
  ]);
}

// ============================================================
// Ruins Basin Encounters
// ============================================================

export function createPiranhaPoolEncounter() {
  return new Encounter('piranha_pool', 'Piranha Pool', 'A pool infested with piranhas', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('You emerge into a cavern dominated by a vast underground pool. The water is deceptively still, its surface reflecting the pale glow of phosphorescent moss.'),
        new EncounterText('Beyond the pool, you can see the broken arches and crumbling walls of submerged ruins — a temple or palace, long claimed by the water.'),
        new EncounterText('Shadows dart beneath the surface. The water erupts as a sahuagin sentinel leaps from the pool, scattering a cloud of piranhas in its wake!'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.COMBAT,
      enemyId: 'sahuagin_sentinel',
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The pool grows still once more, the piranhas retreating to the depths now that their master has fallen.'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.LOOT,
      lootGoldDice: [1, 6],
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
  return new Encounter('pool_exit', 'Pool Exit', 'Leaving the pool behind', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The pool recedes behind you as the passage climbs slightly. The air grows drier, and the sound of water fades to a distant murmur.'),
        new EncounterText('Ahead, the passage opens into a grand entrance — the flooded temple, its stone doors standing ajar, beckoning you inside.'),
      ],
    }),
  ]);
}

export function createConservatoryWingEncounter() {
  return new Encounter('conservatory_wing', 'Conservatory Wing', 'An ornate wing of the ruins', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('You step into an ornate wing of the ruins. Faded murals cover the walls — scenes of a thriving underwater civilization, their colors still vivid beneath the grime of ages.'),
        new EncounterText('The air hums faintly, as though old magic still lingers in the stonework. Broken display cases and scattered relics suggest this was once a place of learning.'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.CHOICE,
      choices: [
        new EncounterChoice(
          'Search for supplies',
          'You sift through the debris, checking shelves and alcoves. Among the dust and shattered pottery, you find a few useful items.',
          'search_camp', 1
        ),
        new EncounterChoice(
          'Move on',
          'You admire the murals for a moment longer, then continue deeper into the ruins.',
          '', 0
        ),
      ],
    }),
  ]);
}

export function createFloodedPassageEncounter() {
  return new Encounter('flooded_passage', 'Flooded Passage', 'A flooded connecting passage', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The passage dips into knee-deep water, cold and murky. Your steps send ripples across the flooded corridor, disturbing sediment that clouds the surface.'),
        new EncounterText('This passage connects the wings of the temple. Waterlogged carvings line both walls, their details softened by centuries of submersion.'),
      ],
    }),
  ]);
}

export function createDarkCorridorEncounter() {
  return new Encounter('dark_corridor', 'Dark Corridor', 'A lightless corridor', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The corridor ahead is utterly dark. Whatever torches once lined these walls guttered out long ago, leaving only empty iron sconces and soot-stained stone.'),
        new EncounterText('You press forward by touch, one hand trailing along the damp wall. The silence is absolute, broken only by your own breathing.'),
      ],
    }),
  ]);
}

export function createPassageAmbushEncounter() {
  return new Encounter('passage_ambush', 'Passage Ambush', 'Spiders attack from the rubble', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The gallery ahead has partially collapsed, massive stone blocks and rubble choking the passage. You pick your way through the debris, climbing over fallen pillars.'),
        new EncounterText('Thick webs stretch between the rubble, glistening in the faint light. You notice them too late.'),
        new EncounterText('Spiders drop from the ceiling in a chittering swarm, their legs scrabbling against stone as they descend on silk threads!'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.COMBAT,
      enemyId: 'forest_spiders',
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The surviving spiders flee into cracks in the rubble, their webs trembling in their wake.'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.LOOT,
      lootGoldDice: [2, 6],
    }),
  ]);
}

export function createCaveExitEncounter() {
  return new Encounter('cave_exit', 'Cave Exit', 'Daylight at last', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('A sliver of daylight appears ahead, growing brighter with each step. Fresh mountain air rushes in, dispelling the stale underground atmosphere.'),
        new EncounterText('You emerge blinking into the open, the vast sky overhead a welcome sight after the cramped darkness below.'),
      ],
    }),
  ]);
}

export function createRiverCrossingEncounter() {
  return new Encounter('river_crossing', 'River Crossing', 'A river blocks the path', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('A swift river cuts across your path, its water dark and cold. The current looks strong, but a line of mossy stepping stones offers a precarious crossing.'),
        new EncounterText('The stones are slick with spray, and several look loose. You could wade across instead, though the water reaches waist height at the deepest point.'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.CHOICE,
      choices: [
        new EncounterChoice(
          'Wade across',
          'You plunge into the icy current, gasping as the cold hits you. The riverbed is uneven and the current tugs at your legs. You make it across, but not without a few scrapes.',
          'damage', 1
        ),
        new EncounterChoice(
          'Find stepping stones',
          'You hop carefully from stone to stone, arms outstretched for balance. A few wobble dangerously, but you reach the far bank dry and unharmed.',
          '', 0
        ),
      ],
    }),
  ]);
}

export function createSouthGateEncounter() {
  return new Encounter('south_gate', 'South Gate', 'The gates of Qualibaf', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The city walls of Qualibaf rise before you, their weathered stone bathed in afternoon light. Banners flutter from the battlements, and you can hear the bustle of commerce within.'),
        new EncounterText('The south gate stands open, its iron portcullis raised. A pair of guards in polished mail watch the road, spears resting casually against their shoulders.'),
        new EncounterText('One of them nods as you approach and waves you through. "Welcome to Qualibaf, traveler. Mind the market square — it\'s busy today."'),
      ],
    }),
  ]);
}

export function createSahuaginSentinelEncounter() {
  return new Encounter('sahuagin_sentinel', 'Sahuagin Sentinel', 'A sentinel blocks the path', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('A sahuagin sentinel rises from the shallow water ahead, its scaled hide glistening. It levels a barnacle-encrusted trident at you and hisses a warning.'),
        new EncounterText('There is no way around. The sentinel has no intention of letting you pass.'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.COMBAT,
      enemyId: 'sahuagin_sentinel',
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.LOOT,
      lootGoldDice: [1, 6],
    }),
  ]);
}

// ============================================================
// City Shop Encounters
// ============================================================

export function createCitySquareEncounter() {
  return new Encounter('city_square', 'City Square', 'A bustling city square', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('You step into the bustling city square of Qualibaf. The cobblestones are worn smooth by generations of foot traffic, and the air hums with commerce and conversation.'),
        new EncounterText('Merchants call out from colorful stalls, hawking everything from fresh bread to exotic spices. A fountain gurgles in the center of the square, its stone basin green with age.'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.CHOICE,
      choices: [
        new EncounterChoice(
          'Browse the market',
          'city_square',
          'open_shop', 0
        ),
        new EncounterChoice(
          'Move on',
          '',
          '', 0
        ),
      ],
    }),
  ]);
}

export function createWeaponsmithEncounter() {
  return new Encounter('weaponsmith', 'Weaponsmith', 'A weapons shop', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('You push open the heavy door of the weaponsmith\'s shop. Blades of every shape and size gleam on the walls, their edges catching the light from the forge in the back.'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.CHOICE,
      choices: [
        new EncounterChoice(
          'Browse weapons',
          'weaponsmith',
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

export function createArmorsmithEncounter() {
  return new Encounter('armorsmith', 'Armorsmith', 'An armor shop', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The armorsmith\'s shop is a fortress of steel and leather. Sturdy plates hang from iron racks, chainmail drapes over wooden mannequins, and the rhythmic clang of hammer on anvil echoes from the workshop beyond.'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.CHOICE,
      choices: [
        new EncounterChoice(
          'Browse armor',
          'armorsmith',
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

export function createGeneralStoreEncounter() {
  return new Encounter('general_store', 'General Store', 'A general store', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The general store is crammed floor to ceiling with supplies of every kind. Rope, rations, lanterns, and tools are stacked high on shelves that bow under the weight.'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.CHOICE,
      choices: [
        new EncounterChoice(
          'Browse supplies',
          'general_store',
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

export function createInnEncounter() {
  return new Encounter('inn', 'The Inn', 'A warm inn', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('You push through the door of the inn and are greeted by a wave of warmth. A fire crackles in a great stone hearth, casting dancing shadows across the timber walls.'),
        new EncounterText('The common room is lively — travelers swap stories over mugs of ale, and the smell of roasting meat drifts from the kitchen. A staircase in the corner leads to rooms above.'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.CHOICE,
      choices: [
        new EncounterChoice(
          'Rest for the night',
          'You pay for a room and settle into a clean bed. The warmth of the fire and the sounds of the inn lull you into a deep, restful sleep.',
          'short_rest', 5
        ),
        new EncounterChoice(
          'Have a drink',
          'city_square',
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

export function createChurchEncounter() {
  return new Encounter('church', 'The Church', 'A grand church', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('You enter the grand church of Qualibaf. Sunlight streams through tall stained glass windows, painting the stone floor in brilliant colors of gold, crimson, and sapphire.'),
        new EncounterText('The air smells of incense, and the soft murmur of prayer echoes through the vaulted nave. An altar stands at the far end, bathed in light.'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.CHOICE,
      choices: [
        new EncounterChoice(
          'Pray for healing',
          'You kneel before the altar and bow your head. A gentle warmth washes over you, easing your pains and calming your spirit.',
          'pray_shrine', 1
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

export function createArcaneEmporiumEncounter() {
  return new Encounter('arcane_emporium', 'Arcane Emporium', 'A mysterious magic shop', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('You step into the Arcane Emporium and the door swings shut behind you of its own accord. Shelves lined with mysterious artifacts and glowing vials stretch into shadowy alcoves. Arcane items pulse with soft, otherworldly light.'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.CHOICE,
      choices: [
        new EncounterChoice(
          'Browse magic items',
          'arcane_emporium',
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

export function createCityNorthGateEncounter() {
  return new Encounter('city_north_gate', 'North Gate', 'The north gate of the city', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('You stand before the north gate of Qualibaf. The heavy wooden doors are open, and beyond them a dirt road winds northward through rolling hills.'),
        new EncounterText('In the distance, a dark treeline marks the edge of Filibaf Forest. The guards at the gate eye you with a mixture of curiosity and concern.'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.CHOICE,
      choices: [
        new EncounterChoice(
          'Leave the city',
          'You pass through the north gate and step onto the open road. The city walls shrink behind you as you head toward the unknown.',
          'leave_city_north', 1
        ),
        new EncounterChoice(
          'Stay',
          '',
          '', 0
        ),
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

export function createForestShadowsEncounter() {
  return new Encounter('forest_shadows', 'Forest Shadows', 'Dense shadows in the forest', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The forest closes in around you, the canopy so thick that barely any light reaches the ground. Dense shadows pool between the twisted trunks.'),
        new EncounterText('Thick webs stretch between the trees, glistening with moisture. Some are large enough to snare a person. The silk trembles faintly, as though something nearby is moving.'),
        new EncounterText('The path splits ahead — one trail leads left through a curtain of hanging moss, the other veers right into a thicket of thorns.'),
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
  return new Encounter('tharnag_arrival', 'Tharnag', 'The fortress of Tharnag', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('Through the thinning trees you catch your first glimpse of Tharnag — a massive dwarven fortress carved into the mountainside, its battlements silhouetted against the sky.'),
        new EncounterText('But the fortress is under siege. Ogres and goblins swarm across the approaches, battering rams pound against the gates, and fire arrows arc through the smoky air.'),
        new EncounterText('The sounds of war echo across the valley — the crash of stone, the roar of siege engines, and the defiant war cries of the dwarven defenders holding the walls.'),
      ],
    }),
  ]);
}

export function createSiegeGauntlet1Encounter() {
  return new Encounter('siege_gauntlet_1', 'Siege Line', 'The first siege line', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('You approach the first line of the siege. A massive ogre operates a crude battering ram, slamming it against the outer defenses with earth-shaking force.'),
        new EncounterText('Goblin sappers scurry around the ogre\'s feet, carrying barrels of pitch and bundles of crude explosives. They spot you and shriek an alarm!'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.COMBAT,
      enemyId: 'siege_gauntlet_1',
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The ogre falls with a thunderous crash, its battering ram splintering beneath its bulk. The first siege line is broken.'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.LOOT,
      lootGoldDice: [2, 6],
    }),
  ]);
}

export function createSiegeGauntlet2Encounter() {
  return new Encounter('siege_gauntlet_2', 'Second Siege Line', 'The second siege engine', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('Ahead, a second siege engine looms — a crude catapult hurling boulders at the fortress walls. Another ogre guards it, bellowing orders at a mob of goblins.'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.COMBAT,
      enemyId: 'siege_gauntlet_2',
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.LOOT,
      lootGoldDice: [2, 6],
    }),
  ]);
}

export function createSiegeGauntlet3Encounter() {
  return new Encounter('siege_gauntlet_3', 'Final Siege Line', 'The final siege line', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('The final siege line stands between you and the fortress gates. The largest ogre yet commands this position, surrounded by elite goblin warriors.'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.COMBAT,
      enemyId: 'siege_gauntlet_3',
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.LOOT,
      lootGoldDice: [3, 6],
    }),
  ]);
}

export function createSiegeGauntletDialogEncounter() {
  return new Encounter('siege_gauntlet_dialog', 'Beyond the Siege', 'The dwarves greet you', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('With the siege lines broken, you push through to the fortress approach. The last of the attackers scatter into the hills, their war machines burning behind them.'),
        new EncounterText('A contingent of dwarven soldiers emerges from a sally port, their armor battered but their spirits high. They raise their axes in salute as you approach.'),
        new EncounterText('"Well fought, outsider! Ye\'ve done Tharnag a great service this day. The gates are open to ye — safe passage is granted within our halls."'),
      ],
    }),
  ]);
}

export function createTharnagSideDoorEncounter() {
  return new Encounter('tharnag_side_door', 'Side Door', 'A hidden entrance to Tharnag', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('Tucked behind a collapsed section of wall, you discover a hidden entrance into the fortress of Tharnag. The door is small and unassuming — clearly meant for dwarven use only.'),
        new EncounterText('Beyond the threshold, torchlight flickers in a narrow corridor that leads deep into the mountain.'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.CHOICE,
      choices: [
        new EncounterChoice(
          'Enter Tharnag',
          'You duck through the low doorway and step into the fortress. The stone walls close in around you, but the air is warm and dry.',
          'enter_tharnag', 1
        ),
        new EncounterChoice(
          'Not yet',
          'You step back from the entrance. The fortress can wait.',
          '', 0
        ),
      ],
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

export function createObsidianWastesArrivalEncounter() {
  return new Encounter('obsidian_wastes_arrival', 'Obsidian Wastes', 'A desolate obsidian landscape', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('You emerge into a vast expanse of black glass. The Obsidian Wastes stretch in every direction — a desolate, shattered landscape of jagged volcanic rock.'),
        new EncounterText('In the distance, crumbling ruins rise from the obsidian like broken bones. Whatever civilization once stood here was consumed long ago.'),
        new EncounterText('The silence is oppressive, broken only by the occasional crack of cooling rock and the whistle of wind through hollow formations.'),
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
  ]);
}

// ============================================================
// Tharnag Interior Encounters
// ============================================================

export function createGrandHallArrivalEncounter() {
  return new Encounter('grand_hall_arrival', 'Grand Hall', 'The grand dwarven hall', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('You step into the Grand Hall of Tharnag and the sheer scale takes your breath away. Massive stone pillars stretch from floor to ceiling, each one carved with intricate dwarven knotwork.'),
        new EncounterText('A layer of dust covers everything — the long stone tables, the iron chandeliers, the ceremonial banners that hang from the rafters. This hall once hosted thousands.'),
        new EncounterText('Despite the dust and the silence, the craftsmanship is magnificent. Every surface tells a story of dwarven pride and artistry that has endured the centuries.'),
      ],
    }),
  ]);
}

export function createDwarvenTavernEncounter() {
  return new Encounter('dwarven_tavern', 'Dwarven Tavern', 'An abandoned dwarven tavern', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('You find an abandoned dwarven tavern off the main hall. The bar is carved from a single block of granite, and the shelves behind it still hold dusty bottles.'),
        new EncounterText('Heavy oak barrels line one wall, their seals still intact. Whatever the dwarves brewed here, it was built to last.'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.CHOICE,
      choices: [
        new EncounterChoice(
          'Search for supplies',
          'dwarven_tavern',
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

export function createDwarvenSmithyEncounter() {
  return new Encounter('dwarven_smithy', 'Dwarven Smithy', 'A dwarven forge', [
    new EncounterPhaseData({
      phaseType: EncounterPhase.TEXT,
      texts: [
        new EncounterText('You enter a dwarven forge that still radiates faint warmth. The great anvil at its center is scarred by centuries of use, and tools of remarkable craftsmanship hang in orderly rows along the walls.'),
        new EncounterText('The forge itself is cold but intact — with the right fuel, it could be fired up again. Unfinished blades and armor pieces rest on workbenches, waiting for hands that never returned.'),
      ],
    }),
    new EncounterPhaseData({
      phaseType: EncounterPhase.CHOICE,
      choices: [
        new EncounterChoice(
          'Browse the forge',
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
  city_north_gate: createCityNorthGateEncounter,
  // North Qualibaf
  north_crossroad: createNorthCrossroadEncounter,
  filibaf_entrance: createFilibafEntranceEncounter,
  // Forest
  forest_shadows: createForestShadowsEncounter,
  forest_ambush_left: createForestAmbushLeftEncounter,
  forest_ambush_right: createForestAmbushRightEncounter,
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
  wastes_north: createWastesNorthEncounter,
  // Tharnag Interior
  grand_hall_arrival: createGrandHallArrivalEncounter,
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
